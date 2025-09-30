import z from "zod";
import { db } from "~~/server/database";
import { workspaces, workspaceMembers } from "~~/server/database/schema";
import { requireCTO } from "~~/server/middleware/auth";
import { eq, and } from "drizzle-orm";

const paramsSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
});

export default defineEventHandler(async event => {
  try {
    const params = getRouterParams(event);
    const { id: workspaceId, userId } = paramsSchema.parse(params);

    // Ensure user has CTO role (only CTOs can remove members)
    const authContext = await requireCTO(event, workspaceId);

    // Prevent CTO from removing themselves
    if (authContext.user.id === userId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Cannot remove yourself from the workspace",
      });
    }

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

    // Prevent removing the workspace owner
    if (workspace.ownerId === userId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Cannot remove the workspace owner",
      });
    }

    // Check if the target user is a member of the workspace
    const existingMember = await db.query.workspaceMembers.findFirst({
      where: and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)),
      with: { user: true },
    });

    if (!existingMember) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "User is not a member of this workspace",
      });
    }

    // Remove the member from the workspace
    await db
      .delete(workspaceMembers)
      .where(and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)));

    return {
      success: true,
      message: `Successfully removed ${existingMember.user.name} from the workspace`,
      removedMember: {
        userId: existingMember.userId,
        name: existingMember.user.name,
        role: existingMember.role,
      },
    };
  } catch (error: unknown) {
    console.error("Error in DELETE /api/workspaces/[id]/members/[userId]:", error);

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Validation failed",
        data: error.issues,
      });
    }

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
