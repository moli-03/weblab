import { describe, it, expect, beforeAll } from "vitest";
import { $fetch } from "@nuxt/test-utils/e2e";
import type { PublicUser } from "../../../server/utils/response-sanitizer";
import { setupNuxt } from "../setup-nuxt";
import { clearDB } from "../utils";

// Type definitions for API responses
interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
}

interface RefreshResponse {
  tokens: TokenPair;
  user: PublicUser;
}

interface LoginResponse {
  tokens: TokenPair;
  user: PublicUser;
}

describe("POST /api/auth/refresh", async () => {
  let refreshToken: string;
  // eslint-disable-next-line
  let accessToken: string;
    
  const refreshTestUser = {
    name: "Refresh Test User",
    email: "refreshtest@example.com",
    password: "password789",
  };

  await setupNuxt();

  beforeAll(async () => {

    await clearDB();
      
    // Register and login to get tokens
    await $fetch("/api/auth/register", {
      method: "POST",
      body: refreshTestUser,
    });

    const loginResponse = await $fetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: {
        email: refreshTestUser.email,
        password: refreshTestUser.password,
      },
    });

    accessToken = loginResponse.tokens.accessToken;
    refreshToken = loginResponse.tokens.refreshToken;
  });

  it("should refresh tokens with valid refresh token", async () => {
    const response = await $fetch<RefreshResponse>("/api/auth/refresh", {
      method: "POST",
      body: {
        refreshToken,
      },
    });

    expect(response).toHaveProperty("tokens");
    expect(response).toHaveProperty("user");
    expect(response.tokens).toHaveProperty("accessToken");
    expect(response.tokens).toHaveProperty("refreshToken");
    expect(response.user).toMatchObject({
      name: refreshTestUser.name,
      email: refreshTestUser.email,
    });
    expect(response.user).not.toHaveProperty("passwordHash");
  });

  it("should reject refresh with invalid token", async () => {
    await expect(
      $fetch("/api/auth/refresh", {
        method: "POST",
        body: {
          refreshToken: "invalid-token",
        },
      }),
    ).rejects.toThrow();
  });

  it("should reject refresh with missing refresh token", async () => {
    await expect(
      $fetch("/api/auth/refresh", {
        method: "POST",
        body: {},
      }),
    ).rejects.toThrow();
  });

  it("should reject refresh with empty refresh token", async () => {
    await expect(
      $fetch("/api/auth/refresh", {
        method: "POST",
        body: {
          refreshToken: "",
        },
      }),
    ).rejects.toThrow();
  });
});
