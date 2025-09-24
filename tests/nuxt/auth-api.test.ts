import { describe, it, expect, beforeAll } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";
import { db } from "../../server/database/index";
import { users } from "../../server/database/schema";

describe("Authentication API", async () => {
  await setup();

  beforeAll(async () => {
    // Reset db
    await db.delete(users);
  });

  const testUser = {
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  };

  const testUser2 = {
    name: "Test User 2",
    email: "test2@example.com",
    password: "password456",
  };

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await $fetch("/api/auth/register", {
        method: "POST",
        body: testUser,
      });

      expect(response).toHaveProperty("user");
      expect(response.user).toMatchObject({
        name: testUser.name,
        email: testUser.email,
      });
      expect(response.user).not.toHaveProperty("passwordHash");
      expect(response.user).toHaveProperty("id");
      expect(response.user).toHaveProperty("createdAt");
      expect(response.user).toHaveProperty("updatedAt");
    });

    it("should reject registration with invalid email", async () => {
      await expect(
        $fetch("/api/auth/register", {
          method: "POST",
          body: {
            ...testUser,
            email: "invalid-email",
          },
        }),
      ).rejects.toThrow();
    });

    it("should reject registration with short password", async () => {
      await expect(
        $fetch("/api/auth/register", {
          method: "POST",
          body: {
            ...testUser,
            password: "123",
          },
        }),
      ).rejects.toThrow();
    });

    it("should reject registration with short name", async () => {
      await expect(
        $fetch("/api/auth/register", {
          method: "POST",
          body: {
            ...testUser,
            name: "A",
          },
        }),
      ).rejects.toThrow();
    });

    it("should reject registration with duplicate email", async () => {
      // First registration should succeed
      await $fetch("/api/auth/register", {
        method: "POST",
        body: testUser,
      });

      // Second registration with same email should fail
      await expect(
        $fetch("/api/auth/register", {
          method: "POST",
          body: {
            ...testUser,
            name: "Different Name",
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe("POST /api/auth/login", () => {
    beforeAll(async () => {
      // Register a test user for login tests
      await $fetch("/api/auth/register", {
        method: "POST",
        body: testUser,
      });
    });

    it("should login with correct credentials", async () => {
      const response = (await $fetch("/api/auth/login", {
        method: "POST",
        body: {
          email: testUser.email,
          password: testUser.password,
        },
      })) as LoginResponse;

      expect(response).toHaveProperty("tokens");
      expect(response).toHaveProperty("user");
      expect(response.tokens).toHaveProperty("accessToken");
      expect(response.tokens).toHaveProperty("refreshToken");
      expect(response.user).toMatchObject({
        name: testUser.name,
        email: testUser.email,
      });
      expect(response.user).not.toHaveProperty("passwordHash");
    });

    it("should reject login with incorrect email", async () => {
      await expect(
        $fetch("/api/auth/login", {
          method: "POST",
          body: {
            email: "wrong@example.com",
            password: testUser.password,
          },
        }),
      ).rejects.toThrow(/401/);
    });

    it("should reject login with incorrect password", async () => {
      await expect(
        $fetch("/api/auth/login", {
          method: "POST",
          body: {
            email: testUser.email,
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
            password: testUser.password,
          },
        }),
      ).rejects.toThrow();
    });

    it("should reject login with empty password", async () => {
      await expect(
        $fetch("/api/auth/login", {
          method: "POST",
          body: {
            email: testUser.email,
            password: "",
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe("GET /api/auth/me", () => {
    let accessToken: string;

    beforeAll(async () => {
      // Register and login to get access token
      await $fetch("/api/auth/register", {
        method: "POST",
        body: testUser2,
      });

      const loginResponse = (await $fetch("/api/auth/login", {
        method: "POST",
        body: {
          email: testUser2.email,
          password: testUser2.password,
        },
      })) as LoginResponse;

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
        name: testUser2.name,
        email: testUser2.email,
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

  describe("POST /api/auth/refresh", () => {
    let refreshToken: string;
    let accessToken: string;

    beforeAll(async () => {
      // Register and login to get tokens
      await $fetch("/api/auth/register", {
        method: "POST",
        body: testUser,
      });

      const loginResponse = (await $fetch("/api/auth/login", {
        method: "POST",
        body: {
          email: testUser.email,
          password: testUser.password,
        },
      })) as LoginResponse;

      accessToken = loginResponse.tokens.accessToken;
      refreshToken = loginResponse.tokens.refreshToken;
    });

    it("should refresh tokens with valid refresh token", async () => {
      const response = (await $fetch("/api/auth/refresh", {
        method: "POST",
        body: {
          refreshToken,
        },
      })) as RefreshResponse;

      expect(response).toHaveProperty("tokens");
      expect(response).toHaveProperty("user");
      expect(response.tokens).toHaveProperty("accessToken");
      expect(response.tokens).toHaveProperty("refreshToken");
      expect(response.user).toMatchObject({
        name: testUser.name,
        email: testUser.email,
      });
      expect(response.user).not.toHaveProperty("passwordHash");

      // Tokens should be different from the original ones
      expect(response.tokens.accessToken).not.toBe(accessToken);
      expect(response.tokens.refreshToken).not.toBe(refreshToken);
    });

    it("should reject refresh with invalid token", async () => {
      await expect(
        $fetch("/api/auth/refresh", {
          method: "POST",
          body: {
            refreshToken: "invalid-token",
          },
        }),
      ).rejects.toThrow(/401/);
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
});
