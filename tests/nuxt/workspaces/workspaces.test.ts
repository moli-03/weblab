import { describe, it, expect, beforeAll } from "vitest";
import { $fetch } from "@nuxt/test-utils/e2e";
import type { Workspace, WorkspaceWithOwner } from "../../../shared/types/schema";
import { setupNuxt } from "../setup-nuxt";
import { clearDB } from "../utils";
import { registerAndLoginUser, TEST_USERS, type AuthenticatedUser } from "../auth-helpers";

interface CreateWorkspaceResponse {
  workspace: Workspace;
  message: string;
}

// Helper function to create a test workspace
async function createTestWorkspace(
  auth: AuthenticatedUser,
  overrides: Partial<{
    name: string;
    slug: string;
    description: string;
    isPublic: boolean;
  }> = {},
): Promise<Workspace> {
  const defaultData = {
    name: "Test Workspace",
    slug: "test-workspace-" + Date.now(), // Add timestamp to ensure uniqueness
    description: "A test workspace for API testing",
    isPublic: true,
  };

  const workspaceData = { ...defaultData, ...overrides };

  const workspace = await $fetch<CreateWorkspaceResponse>("/api/workspaces", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
    },
    body: workspaceData,
  });

  return workspace;
}

describe("Workspace API Endpoints", async () => {
  await setupNuxt();

  let ctoAuth: AuthenticatedUser;
  let customerAuth: AuthenticatedUser;

  beforeAll(async () => {
    await clearDB();

    // Register and login users
    ctoAuth = await registerAndLoginUser(TEST_USERS.CTO);
    customerAuth = await registerAndLoginUser(TEST_USERS.CUSTOMER);
  });

  it("should create a new workspace successfully", async () => {
    const testWorkspaceData = {
      name: "Test Workspace",
      slug: "test-workspace",
      description: "A test workspace for API testing",
      isPublic: true,
    };

    const workspace = await $fetch<CreateWorkspaceResponse>("/api/workspaces", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ctoAuth.accessToken}`,
      },
      body: testWorkspaceData,
    });

    expect(workspace).toMatchObject({
      name: testWorkspaceData.name,
      slug: testWorkspaceData.slug,
      description: testWorkspaceData.description,
      isPublic: testWorkspaceData.isPublic,
      ownerId: ctoAuth.user.id,
    });
    expect(workspace).toHaveProperty("id");
    expect(workspace).toHaveProperty("createdAt");
    expect(workspace).toHaveProperty("updatedAt");
  });

  it("should reject workspace creation without authentication", async () => {
    await expect(
      $fetch("/api/workspaces", {
        method: "POST",
        body: {
          name: "Unauthorized Workspace",
          slug: "unauthorized",
          description: "Should fail",
          isPublic: true,
        },
      }),
    ).rejects.toThrow(/401/);
  });

  it("should reject workspace creation with invalid data", async () => {
    await expect(
      $fetch("/api/workspaces", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ctoAuth.accessToken}`,
        },
        body: {
          name: "", // Empty name should fail
          slug: "invalid",
          description: "Invalid workspace",
          isPublic: true,
        },
      }),
    ).rejects.toThrow();
  });

  it("should reject workspace creation with duplicate slug", async () => {
    await createTestWorkspace(ctoAuth, {
      name: "First Workspace",
      slug: "duplicate-test-slug",
      description: "First workspace with this slug",
    });

    await expect(
      $fetch("/api/workspaces", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ctoAuth.accessToken}`,
        },
        body: {
          name: "Another Workspace",
          slug: "duplicate-test-slug", // Same slug as existing workspace
          description: "Should fail due to duplicate slug",
          isPublic: true,
        },
      }),
    ).rejects.toThrow();
  });

  it("should return list of workspaces for authenticated user", async () => {
    const testWorkspace = await createTestWorkspace(ctoAuth, {
      name: "List Test Workspace",
      description: "Workspace for testing list functionality",
      isPublic: false,
    });

    const response = await $fetch<{ entries: WorkspaceWithOwner[] }>("/api/workspaces", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ctoAuth.accessToken}`,
      },
    });

    expect(Array.isArray(response.entries)).toBe(true);
    expect(response.entries.length).toBeGreaterThan(0);

    const workspace = response.entries.find(w => w.id === testWorkspace.id);
    expect(workspace).toBeDefined();
    expect(workspace).toHaveProperty("owner");
    expect(workspace?.isJoined).toBe(true);
    expect(workspace?.memberRole).toBe("cto");
  });

  it("should reject workspace list request without authentication", async () => {
    await expect(
      $fetch("/api/workspaces", {
        method: "GET",
      }),
    ).rejects.toThrow(/401/);
  });

  it("should return public workspaces for non-members", async () => {
    const testWorkspace = await createTestWorkspace(ctoAuth, {
      name: "Public Test Workspace",
      description: "Public workspace for testing non-member access",
      isPublic: true,
    });

    const response = await $fetch<{ entries: WorkspaceWithOwner[] }>("/api/workspaces", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${customerAuth.accessToken}`,
      },
    });

    expect(Array.isArray(response.entries)).toBe(true);

    const workspace = response.entries.find(w => w.id === testWorkspace.id);
    expect(workspace).toBeDefined();
    expect(workspace?.isJoined).toBe(false);
    expect(workspace?.memberRole).toBeUndefined();
  });

  it("should return workspace details for member if workspace is not public", async () => {
    const testWorkspace = await createTestWorkspace(ctoAuth, {
      name: "Details Test Workspace",
      description: "Workspace for testing details endpoint",
      isPublic: false,
    });

    const response = await $fetch<WorkspaceWithOwner>(`/api/workspaces/${testWorkspace.id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ctoAuth.accessToken}`,
      },
    });

    expect(response).toMatchObject({
      id: testWorkspace.id,
      name: testWorkspace.name,
      slug: testWorkspace.slug,
      description: testWorkspace.description,
      isPublic: testWorkspace.isPublic,
      ownerId: testWorkspace.ownerId,
    });
    expect(response).toHaveProperty("owner");
    expect(response.isJoined).toBe(true);
    expect(response.memberRole).toBe("cto");
  });

  it("should reject workspace details request without authentication", async () => {
    await expect(
      $fetch("/api/workspaces/00000000-0000-0000-0000-000000000001", {
        method: "GET",
      }),
    ).rejects.toThrow(/401/);
  });

  it("should reject request for non-existent workspace", async () => {
    await expect(
      $fetch("/api/workspaces/00000000-0000-0000-0000-000000000000", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ctoAuth.accessToken}`,
        },
      }),
    ).rejects.toThrow(/404/);
  });

  it("should reject request with invalid UUID", async () => {
    await expect(
      $fetch("/api/workspaces/invalid-uuid", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ctoAuth.accessToken}`,
        },
      }),
    ).rejects.toThrow();
  });

  it("should allow user to join public workspace", async () => {
    const testWorkspace = await createTestWorkspace(ctoAuth, {
      name: "Join Test Workspace",
      description: "Workspace for testing join functionality",
      isPublic: true,
    });

    const response = await $fetch<{ message: string }>(`/api/workspaces/${testWorkspace.id}/join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${customerAuth.accessToken}`,
      },
    });

    expect(response).toHaveProperty("message");
    expect(response.message).toContain("Successfully joined");
  });

  it("should reject joining if already a member", async () => {
    const testWorkspace = await createTestWorkspace(ctoAuth, {
      name: "Already Member Test",
      description: "Workspace for testing duplicate join",
    });

    // Join the workspace first
    await $fetch(`/api/workspaces/${testWorkspace.id}/join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${customerAuth.accessToken}`,
      },
    });

    // Try to join again
    await expect(
      $fetch(`/api/workspaces/${testWorkspace.id}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${customerAuth.accessToken}`,
        },
      }),
    ).rejects.toThrow(/409/);
  });

  it("should reject join request without authentication", async () => {
    await expect(
      $fetch("/api/workspaces/00000000-0000-0000-0000-000000000003/join", {
        method: "POST",
      }),
    ).rejects.toThrow(/401/);
  });

  it("should reject joining non-existent workspace", async () => {
    await expect(
      $fetch("/api/workspaces/00000000-0000-0000-0000-000000000000/join", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ctoAuth.accessToken}`,
        },
      }),
    ).rejects.toThrow(/404/);
  });

  it("should allow member to leave workspace", async () => {
    const testWorkspace = await createTestWorkspace(ctoAuth, {
      name: "Leave Test Workspace",
      description: "Workspace for testing leave functionality",
    });

    // Join the workspace first
    await $fetch(`/api/workspaces/${testWorkspace.id}/join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${customerAuth.accessToken}`,
      },
    });

    // Then leave it
    const response = await $fetch<{ message: string }>(`/api/workspaces/${testWorkspace.id}/leave`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${customerAuth.accessToken}`,
      },
    });

    expect(response).toHaveProperty("message");
    expect(response.message).toBe("Successfully left workspace");
  });

  it("should reject owner leaving their own workspace", async () => {
    const testWorkspace = await createTestWorkspace(ctoAuth, {
      name: "Owner Leave Test",
      description: "Workspace for testing owner leave rejection",
    });

    await expect(
      $fetch(`/api/workspaces/${testWorkspace.id}/leave`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ctoAuth.accessToken}`,
        },
      }),
    ).rejects.toThrow(/403/);
  });

  it("should reject leaving if not a member", async () => {
    const testWorkspace = await createTestWorkspace(ctoAuth, {
      name: "Non-member Leave Test",
      description: "Workspace for testing non-member leave rejection",
    });

    await expect(
      $fetch(`/api/workspaces/${testWorkspace.id}/leave`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${customerAuth.accessToken}`,
        },
      }),
    ).rejects.toThrow(/404/);
  });

  it("should reject leave request without authentication", async () => {
    await expect(
      $fetch("/api/workspaces/00000000-0000-0000-0000-000000000002/leave", {
        method: "POST",
      }),
    ).rejects.toThrow(/401/);
  });
});
