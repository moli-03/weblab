interface LoginParams {
  email: string;
  password: string;
}

interface RegisterParams {
  email: string;
  password: string;
  name: string;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: "auth.accessToken",
  REFRESH_TOKEN: "auth.refreshToken",
  USER: "auth.user",
  TOKEN_EXPIRY: "auth.tokenExpiry",
} as const;

export default function useAuth() {
  const isLoggedIn = useState("auth.isLoggedIn", () => false);
  const user = useState<User | null>("auth.user", () => null);
  const accessToken = useState<string | null>("auth.accessToken", () => null);
  const refreshToken = useState<string | null>("auth.refreshToken", () => null);
  const tokenExpiry = useState<number | null>("auth.tokenExpiry", () => null);

  const calculateExpiryTime = (expiresIn: string): number => {
    const now = Date.now();
    if (expiresIn.endsWith("m")) {
      const minutes = parseInt(expiresIn.slice(0, -1));
      return now + minutes * 60 * 1000;
    } else if (expiresIn.endsWith("h")) {
      const hours = parseInt(expiresIn.slice(0, -1));
      return now + hours * 60 * 60 * 1000;
    } else if (expiresIn.endsWith("d")) {
      const days = parseInt(expiresIn.slice(0, -1));
      return now + days * 24 * 60 * 60 * 1000;
    }

    // Default to 15 minutes if format is unexpected
    return now + 15 * 60 * 1000;
  };

  // Store tokens and user data in localStorage and state
  const storeAuthData = (userData: User, aToken: string, rToken: string, expiresIn: string) => {
    const expiryTime = calculateExpiryTime(expiresIn);

    // Update state
    accessToken.value = aToken;
    refreshToken.value = rToken;
    user.value = userData;
    tokenExpiry.value = expiryTime;
    isLoggedIn.value = true;

    // Store in localStorage for persistence
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, aToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, rToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
  };

  // Clear all auth data
  const clearAuthData = () => {
    // Clear state
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;
    tokenExpiry.value = null;
    isLoggedIn.value = false;

    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  };

  // Initialize auth state from localStorage
  const initializeAuth = () => {
    try {
      const storedAccessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      const storedExpiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);

      if (storedAccessToken && storedRefreshToken && storedUser && storedExpiry) {
        const expiryTime = parseInt(storedExpiry);
        const now = Date.now();

        // Check if access token is still valid
        if (now < expiryTime) {
          accessToken.value = storedAccessToken;
          refreshToken.value = storedRefreshToken;
          user.value = JSON.parse(storedUser);
          tokenExpiry.value = expiryTime;
          isLoggedIn.value = true;
        } else {
          // Access token expired, try to refresh
          refreshAccessToken();
        }
      }
    } catch (error) {
      console.error("Failed to initialize auth state:", error);
      clearAuthData();
    }
  };

  // Check if access token is about to expire (within 5 minutes)
  const isTokenNearExpiry = (): boolean => {
    if (!tokenExpiry.value) return true;
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() + fiveMinutes >= tokenExpiry.value;
  };

  // Refresh access token using refresh token
  const refreshAccessToken = async (): Promise<boolean> => {
    if (!refreshToken.value) {
      clearAuthData();
      return false;
    }

    try {
      const response = await $fetch("/api/auth/refresh", {
        method: "POST",
        body: {
          refreshToken: refreshToken.value,
        },
      });

      storeAuthData(
        response.user,
        response.tokens.accessToken,
        response.tokens.refreshToken,
        response.tokens.expiresIn,
      );
      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      clearAuthData();
      return false;
    }
  };

  // Auto-refresh token when it's near expiry
  let tokenRefreshInterval: ReturnType<typeof setInterval> | null = null;
  const setupTokenRefresh = () => {
    // Make sure we don't set this up twice
    if (tokenRefreshInterval) {
      return;
    }

    const checkAndRefresh = async () => {
      if (isLoggedIn.value && isTokenNearExpiry()) {
        await refreshAccessToken();
      }
    };

    // Check every minute
    tokenRefreshInterval = setInterval(checkAndRefresh, 60 * 1000);

    // Cleanup on page unload
    window.addEventListener("beforeunload", () => {
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    });

    return tokenRefreshInterval;
  };

  const login = async (params: LoginParams): Promise<User> => {
    try {
      const response = await $fetch("/api/auth/login", {
        method: "POST",
        body: {
          email: params.email,
          password: params.password,
        },
      });

      storeAuthData(
        response.user,
        response.tokens.accessToken,
        response.tokens.refreshToken,
        response.tokens.expiresIn,
      );
      setupTokenRefresh();
      return response.user;
    } catch (error: unknown) {
      console.error("Login failed:", error);
      throw new Error("Login failed");
    }
  };

  const register = async (params: RegisterParams): Promise<void> => {
    try {
      await $fetch("/api/auth/register", {
        method: "POST",
        body: {
          email: params.email,
          password: params.password,
          name: params.name,
        },
      });
    } catch (error: unknown) {
      console.error("Registration failed:", error);
      throw new Error("Registration failed");
    }
  };

  const logout = async (): Promise<void> => {
    clearAuthData();
  };

  // Get authorization header for API requests
  const getAuthHeader = (): Record<string, string> => {
    if (!accessToken.value) return {};
    return {
      Authorization: `Bearer ${accessToken.value}`,
    };
  };

  return {
    // State
    isLoggedIn: readonly(isLoggedIn),
    user: readonly(user),
    accessToken: readonly(accessToken),
    refreshToken: readonly(refreshToken),
    tokenExpiry: readonly(tokenExpiry),

    // Methods
    login,
    register,
    logout,
    refreshAccessToken,
    initializeAuth,
    setupTokenRefresh,
    getAuthHeader,
    clearAuthData,

    // Computed
    isTokenNearExpiry,
  };
}
