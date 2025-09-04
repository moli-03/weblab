import z from "zod";
import { db } from "~~/server/database";
import { requireMembership } from "~~/server/middleware/auth";

const schema = z.object({
  id: z.uuid(),
});

export default defineEventHandler(async event => {
  try {
    const params = getRouterParams(event);
    const { id: workspaceId } = schema.parse(params);

    await requireMembership(event, workspaceId);

    const workspace = await db.query.workspaces.findFirst({
      where: (table, { eq }) => eq(table.id, workspaceId),
      with: {
        technologies: true,
      },
    });

    if (!workspace) {
      throw createError({
        statusCode: 404,
        statusMessage: "Workspace not found",
      });
    }

    return workspace.technologies;
  } catch (error) {
    console.error("Error in GET /api/workspaces/[id]/technologies:", error);
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
