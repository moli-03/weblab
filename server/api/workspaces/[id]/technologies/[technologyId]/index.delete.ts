import z from "zod";
import { db } from "~~/server/database";
import { technologies } from "~~/server/database/schema";
import { requireAdminOrCTO } from "~~/server/middleware/auth";
import { and, eq } from "drizzle-orm";

const paramsSchema = z.object({
  id: z.uuid(),
  technologyId: z.uuid(),
});

export default defineEventHandler(async event => {
  try {
    const params = getRouterParams(event);
    const { id: workspaceId, technologyId } = paramsSchema.parse(params);

    // Ensure user has admin or CTO role
    await requireAdminOrCTO(event, workspaceId);

    // Check existence and ownership
    const existing = await db.query.technologies.findFirst({
      where: (table, { eq }) => eq(table.id, technologyId),
    });

    if (!existing || existing.workspaceId !== workspaceId) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Technology not found",
      });
    }

    await db
      .delete(technologies)
      .where(and(eq(technologies.id, technologyId), eq(technologies.workspaceId, workspaceId)));

    return { success: true, id: technologyId };
  } catch (error: unknown) {
    console.error("Error in DELETE /api/workspaces/[id]/technologies/[technologyId]:", error);
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
