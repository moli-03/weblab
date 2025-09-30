import { $fetch } from "@nuxt/test-utils/e2e";
import type { PublicUser } from "../../server/utils/response-sanitizer";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
}

interface LoginResponse {
  tokens: TokenPair;
  user: PublicUser;
}

interface RegisterResponse {
  user: PublicUser;
}

export interface TestUser {
  name: string;
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  user: PublicUser;
  accessToken: string;
}

export const registerUser = async (userData: TestUser): Promise<RegisterResponse> => {
  return await $fetch<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: userData,
  });
};

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  return await $fetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: {
      email,
      password,
    },
  });
};

export const registerAndLoginUser = async (userData: TestUser): Promise<AuthenticatedUser> => {
  await registerUser(userData);
  const loginResponse = await loginUser(userData.email, userData.password);

  return {
    user: loginResponse.user,
    accessToken: loginResponse.tokens.accessToken,
  };
};

export const createAuthHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
});

// Common test users
export const TEST_USERS = {
  CTO: {
    name: "CTO User",
    email: "cto@example.com",
    password: "password123",
  },
  TECH_LEAD: {
    name: "Tech Lead User",
    email: "techlead@example.com",
    password: "password123",
  },
  CUSTOMER: {
    name: "Customer User",
    email: "customer@example.com",
    password: "password123",
  },
  NORMAL: {
    name: "Normal User",
    email: "normal@example.com",
    password: "password123",
  },
} as const;
