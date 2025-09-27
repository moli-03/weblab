
import { describe, it, expect, beforeAll } from "vitest";
import { $fetch } from "@nuxt/test-utils/e2e";
import type { PublicUser } from "../../../server/utils/response-sanitizer";
import { setupNuxt } from "../setup-nuxt";
import { clearDB } from "../utils";

describe("POST /api/auth/register", async () => {

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

  await setupNuxt();

  beforeAll(async () => {
    await clearDB();
  });

  it("should register a new user successfully", async () => {
    const response = await $fetch<{ user: PublicUser }>("/api/auth/register", {
      method: "POST",
      body: testUser
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
      body: testUser2,
    }) as { user: PublicUser };

    // Second registration with same email should fail
    await expect(
      $fetch("/api/auth/register", {
        method: "POST",
        body: {
          ...testUser2,
          name: "Different Name",
        },
      }),
    ).rejects.toThrow();
  });
});