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

interface LoginResponse {
  tokens: TokenPair;
  user: PublicUser;
}

describe("POST /api/auth/login", async () => {

  await setupNuxt();

  beforeAll(async () => {

    await clearDB();
      
    // Register a test user for login tests
    await $fetch("/api/auth/register", {
      method: "POST",
      body: {
        name: "Login Test User",
        email: "logintest@example.com",
        password: "password123",
      },
    });
  });

  it("should login with correct credentials", async () => {
    const response = (await $fetch("/api/auth/login", {
      method: "POST",
      body: {
        email: "logintest@example.com",
        password: "password123",
      },
    })) as LoginResponse;

    expect(response).toHaveProperty("tokens");
    expect(response).toHaveProperty("user");
    expect(response.tokens).toHaveProperty("accessToken");
    expect(response.tokens).toHaveProperty("refreshToken");
    expect(response.user).toMatchObject({
      name: "Login Test User",
      email: "logintest@example.com",
    });
    expect(response.user).not.toHaveProperty("passwordHash");
  });

  it("should reject login with incorrect email", async () => {
    await expect(
      $fetch("/api/auth/login", {
        method: "POST",
        body: {
          email: "wrong@example.com",
          password: "password123",
        },
      }),
    ).rejects.toThrow(/401/);
  });

  it("should reject login with incorrect password", async () => {
    await expect(
      $fetch("/api/auth/login", {
        method: "POST",
        body: {
          email: "logintest@example.com",
          password: "wrongpassword",
        },
      }),
    ).rejects.toThrow(/401/);
  });

  it("should reject login with invalid email format", async () => {
    await expect(
      $fetch("/api/auth/login", {
        method: "POST",
        body: {
          email: "invalid-email",
          password: "password123",
        },
      }),
    ).rejects.toThrow();
  });

  it("should reject login with empty password", async () => {
    await expect(
      $fetch("/api/auth/login", {
        method: "POST",
        body: {
          email: "logintest@example.com",
          password: "",
        },
      }),
    ).rejects.toThrow();
  });
});