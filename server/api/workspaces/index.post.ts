import { db } from "~~/server/database";
import { workspaces, workspaceMembers } from "~~/server/database/schema";
import { requireAuth } from "~~/server/middleware/auth";
import { z } from "zod";

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .max(255, "Name must be at most 255 characters long"),
  description: z
    .string()
    .min(1, "The description is required")
    .max(1024, "Description must be at most 1024 characters long"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Only lowercase letters, numbers and hyphens"),
  logoUrl: z.url().optional(),
  isPublic: z.boolean(),
});

export default defineEventHandler(async event => {
  const user = requireAuth(event);

  try {
    const body = await readBody(event);
    const validatedData = createWorkspaceSchema.parse(body);

    // Check if slug is already taken
    const existingWorkspace = await db.query.workspaces.findFirst({
      where: (ws, { eq }) => eq(ws.slug, validatedData.slug),
    });

    if (existingWorkspace) {
      throw createError({
        statusCode: 400,
        statusMessage: "Workspace slug already exists",
      });
    }

    // Create the workspace
    const [newWorkspace] = await db
      .insert(workspaces)
      .values({
        name: validatedData.name,
        description: validatedData.description,
        slug: validatedData.slug,
        logoUrl: validatedData.logoUrl,
        isPublic: validatedData.isPublic,
        ownerId: user.user.id,
      })
      .returning();

    // Add the creator as an admin member of the workspace
    await db.insert(workspaceMembers).values({
      userId: user.user.id,
      workspaceId: newWorkspace.id,
      role: "admin",
    });

    return newWorkspace;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation Error",
        data: error.issues,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: error,
    });
  }
});
