import z from "zod";
import { db } from "~~/server/database";
import { workspaces, workspaceUsers } from "~~/server/database/schema";
import { requireAuth } from "~~/server/middleware/auth";
import { eq, and } from "drizzle-orm";

const paramsSchema = z.object({
  id: z.uuid(),
});

export default defineEventHandler(async event => {
  const authContext = requireAuth(event);

  try {
    const params = getRouterParams(event);
    const { id: workspaceId } = paramsSchema.parse(params);

    // Check if workspace exists and is public
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    });

    if (!workspace) {
      throw createError({
        statusCode: 404,
        statusMessage: "Workspace not found",
      });
    }

    if (!workspace.isPublic) {
      throw createError({
        statusCode: 403,
        statusMessage: "Cannot join private workspace",
      });
    }

    // Check if user is already a member
    const existingMember = await db.query.workspaceUsers.findFirst({
      where: and(eq(workspaceUsers.userId, authContext.user.id), eq(workspaceUsers.workspaceId, workspaceId)),
    });

    if (existingMember) {
      throw createError({
        statusCode: 409,
        statusMessage: "Already a member of this workspace",
      });
    }

    // Add user to workspace
    await db.insert(workspaceUsers).values({
      userId: authContext.user.id,
      workspaceId: workspaceId,
      role: "customer",
    });

    return {
      message: "Successfully joined workspace",
    };
  } catch (error: unknown) {
    // Check if it's an HTTP error from createError
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: error,
    });
  }
});
