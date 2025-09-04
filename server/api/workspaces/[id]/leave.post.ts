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

    // Check if workspace exists
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    });

    if (!workspace) {
      throw createError({
        statusCode: 404,
        statusMessage: "Workspace not found",
      });
    }

    // Check if user is the owner (owners cannot leave their own workspace)
    if (workspace.ownerId === authContext.user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: "Workspace owners cannot leave their own workspace",
      });
    }

    // Check if user is a member
    const membership = await db.query.workspaceUsers.findFirst({
      where: and(eq(workspaceUsers.userId, authContext.user.id), eq(workspaceUsers.workspaceId, workspaceId)),
    });

    if (!membership) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not a member of this workspace",
      });
    }

    // Remove user from workspace
    await db
      .delete(workspaceUsers)
      .where(and(eq(workspaceUsers.userId, authContext.user.id), eq(workspaceUsers.workspaceId, workspaceId)));

    return {
      message: "Successfully left workspace",
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
