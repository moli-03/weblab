import z from "zod";
import { db } from "~~/server/database";
import { technologies } from "~~/server/database/schema";
import { requireCTOOrTechLead } from "~~/server/middleware/auth";

const paramsSchema = z.object({
  id: z.uuid(),
});

const bodySchema = z
  .object({
    name: z.string().nonempty().max(255),
    description: z.string().nonempty(),
    category: z.enum(["framework", "tool", "technique", "platform"]),
    ring: z.enum(["adopt", "trial", "assess", "hold"]).optional(),
    ringDescription: z.string().optional(),
    logoUrl: z.httpUrl().optional().or(z.literal("")),
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
    const { id: workspaceId } = paramsSchema.parse(params);

    await requireCTOOrTechLead(event, workspaceId);

    const workspace = await db.query.workspaces.findFirst({
      where: (table, { eq }) => eq(table.id, workspaceId),
    });

    if (!workspace) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: `Workspace not found: ${workspaceId}`,
      });
    }

    const body = await readBody(event);
    const parsedBody = bodySchema.parse(body);

    const newTechnology = await db
      .insert(technologies)
      .values({
        workspaceId: workspace.id,
        name: parsedBody.name,
        category: parsedBody.category,
        description: parsedBody.description,
        ring: parsedBody.ring,
        ringDescription: parsedBody.ringDescription,
        logoUrl: parsedBody.logoUrl,
        status: parsedBody.publish ? "published" : "draft",
        publishedAt: parsedBody.publish ? new Date().toISOString() : null,
      })
      .returning();

    return newTechnology;
  } catch (error: unknown) {
    console.error("Error in POST /api/workspaces/[id]/technologies:", error);
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
