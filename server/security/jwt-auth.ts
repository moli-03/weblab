import type { StringValue } from "ms";
import jwt from "jsonwebtoken";

export interface JwtAuthServiceConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiry: StringValue;
  refreshTokenExpiry: StringValue;
  issuer: "technology-radar";
}

export type TokenType = "access" | "refresh";

type TokenPayload<P> = {
  sub: string;
  payload: P;
  type: TokenType;
  iat: number;
};

export const createJwtAuthService = <P>(config?: Partial<JwtAuthServiceConfig>) => {
  const {
    accessTokenSecret = process.env.JWT_ACCESS_SECRET,
    refreshTokenSecret = process.env.JWT_REFRESH_SECRET,
    accessTokenExpiry = "15m",
    refreshTokenExpiry = "7d",
    issuer = "technology-radar",
  } = config || {};

  if (!accessTokenSecret || !refreshTokenSecret) {
    throw new Error("JWT secrets must be provided via environment variables JWT_ACCESS_SECRET and JWT_REFRESH_SECRET");
  }

  // Validate secret strength
  if (accessTokenSecret.length < 32 || refreshTokenSecret.length < 32) {
    throw new Error("JWT secrets must be at least 32 characters long for security");
  }

  const createTokenPayload = (sub: string, payload: P, type: TokenType): TokenPayload<P> => ({
    sub,
    payload,
    type,
    iat: Math.floor(Date.now() / 1000),
  });

  const signAccessToken = (sub: string, payload: P) => {
    const tokenPayload = createTokenPayload(sub, payload, "access");

    return jwt.sign(tokenPayload, accessTokenSecret, {
      expiresIn: accessTokenExpiry,
      issuer,
    });
  };

  const signRefreshToken = (sub: string, payload: P) => {
    const tokenPayload = createTokenPayload(sub, payload, "refresh");

    return jwt.sign(tokenPayload, refreshTokenSecret, {
      expiresIn: refreshTokenExpiry,
      issuer,
    });
  };

  const validateAccessToken = (token: string): TokenPayload<P> | null => {
    try {
      const decoded = jwt.verify(token, accessTokenSecret, {
        issuer,
      }) as TokenPayload<P>;

      if (decoded.type != "access") {
        return null;
      }

      return decoded;
    } catch (error) {
      console.error("Access token validation failed:", error);
      return null;
    }
  };

  const validateRefreshToken = (token: string): TokenPayload<P> | null => {
    try {
      const decoded = jwt.verify(token, refreshTokenSecret, {
        issuer,
      }) as TokenPayload<P>;

      if (decoded.type != "refresh") {
        return null;
      }

      return decoded;
    } catch (error) {
      console.error("Refresh token validation failed:", error);
      return null;
    }
  };

  const generateTokenPair = (sub: string, payload: P) => ({
    accessToken: signAccessToken(sub, payload),
    refreshToken: signRefreshToken(sub, payload),
    tokenType: "Bearer",
    expiresIn: accessTokenExpiry,
  });

  return {
    createTokenPayload,
    signAccessToken,
    signRefreshToken,
    validateAccessToken,
    validateRefreshToken,
    generateTokenPair,
  };
};
