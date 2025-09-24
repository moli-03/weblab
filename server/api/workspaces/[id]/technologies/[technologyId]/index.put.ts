import z from "zod";
import { db } from "~~/server/database";
import { technologies } from "~~/server/database/schema";
import { requireAdminOrCTO } from "~~/server/middleware/auth";
import { eq, and } from "drizzle-orm";

const paramsSchema = z.object({
  id: z.uuid(),
  technologyId: z.uuid(),
});

const bodySchema = z
  .object({
    name: z.string().nonempty().max(255),
    description: z.string().nonempty(),
    category: z.enum(["framework", "tool", "technique", "platform"]),
    ring: z.enum(["adopt", "trial", "assess", "hold"]).optional(),
    ringDescription: z.string().optional(),
    logoUrl: z.union([z.url(), z.literal("")]).optional(),
    publish: z.boolean(),
  })
  .refine(
    data => {
      if (data.publish) {
        return data.ring !== undefined;
      }
      return true;
    },
    {
      message: "Ring is required when publishing",
      path: ["ring"],
    },
  );

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

    const body = await readBody(event);
    const parsedBody = bodySchema.parse(body);

    // Update the technology
    const [updatedTechnology] = await db
      .update(technologies)
      .set({
        name: parsedBody.name,
        description: parsedBody.description,
        category: parsedBody.category,
        ring: parsedBody.ring,
        ringDescription: parsedBody.ringDescription,
        logoUrl: parsedBody.logoUrl || null,
        status: parsedBody.publish ? "published" : "draft",
        publishedAt: parsedBody.publish 
          ? (existing.publishedAt || new Date().toISOString()) 
          : null,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(technologies.id, technologyId), eq(technologies.workspaceId, workspaceId)))
      .returning();

    if (!updatedTechnology) {
      throw createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
        message: "Failed to update technology",
      });
    }

    return updatedTechnology;
  } catch (error) {
    console.error("Error in PUT /api/workspaces/[id]/technologies/[technologyId]:", error);

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
      message: "An unexpected error occurred",
    });
  }
});