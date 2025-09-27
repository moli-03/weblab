import { describe, it, expect, beforeAll } from "vitest";
import { $fetch } from "@nuxt/test-utils/e2e";
import type { PublicUser } from "../../../server/utils/response-sanitizer";
import { setupNuxt } from "../setup-nuxt";
import { clearDB } from "../utils";

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

interface MeResponse {
  user: PublicUser;
}

describe("GET /api/auth/me", async () => {
  let accessToken: string;
  const testUser = {
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  };

  await setupNuxt();

  beforeAll(async () => {
    await clearDB();

    // Register and login to get access token
    await $fetch("/api/auth/register", {
      method: "POST",
      body: testUser,
    });

    const loginResponse = await $fetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: {
        email: testUser.email,
        password: testUser.password,
      },
    });

    accessToken = loginResponse.tokens.accessToken;
  });

  it("should return user info with valid token", async () => {
    const response = (await $fetch("/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })) as MeResponse;

    expect(response).toHaveProperty("user");
    expect(response.user).toMatchObject({
      name: testUser.name,
      email: testUser.email,
    });
    expect(response.user).not.toHaveProperty("passwordHash");
  });

  it("should reject request without authorization header", async () => {
    await expect(
      $fetch("/api/auth/me", {
        method: "GET",
      }),
    ).rejects.toThrow(/401/);
  });

  it("should reject request with invalid token", async () => {
    await expect(
      $fetch("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      }),
    ).rejects.toThrow(/401/);
  });

  it("should reject request with malformed authorization header", async () => {
    await expect(
      $fetch("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: "InvalidFormat",
        },
      }),
    ).rejects.toThrow(/401/);
  });
});
