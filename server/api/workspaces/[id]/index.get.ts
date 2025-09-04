import z from "zod";
import { db } from "~~/server/database";
import { requireAuth } from "~~/server/middleware/auth";

const paramsSchema = z.object({ id: z.uuid() });

export default defineEventHandler(async event => {
  const authContext = requireAuth(event);

  try {
    const params = getRouterParams(event);
    const { id: workspaceId } = paramsSchema.parse(params);

    // Check if workspace exists and is public
    const workspace = await db.query.workspaces.findFirst({
      where: (table, { eq }) => eq(table.id, workspaceId),
      with: {
        owner: true,
      },
    });

    if (!workspace) {
      throw createError({
        statusCode: 404,
        statusMessage: "Workspace not found",
      });
    }

    const workspaceMembership = await db.query.workspaceMembers.findFirst({
      where: (wm, { eq, and }) => and(eq(wm.workspaceId, workspaceId), eq(wm.userId, authContext.user.id)),
    });

    return {
      ...workspace,
      owner: toPublicUser(workspace.owner),
      isJoined: workspaceMembership !== null,
      memberRole: workspaceMembership?.role
    };
  } catch (error) {
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
