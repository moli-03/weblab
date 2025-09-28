import z from "zod";
import { db } from "~~/server/database";
import { workspaceMembers } from "~~/server/database/schema";
import { requireCTO } from "~~/server/middleware/auth";
import { eq, and } from "drizzle-orm";

const paramsSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
});

const bodySchema = z.object({
  role: z.enum(["cto", "tech-lead", "customer"]),
});

export default defineEventHandler(async event => {
  try {
    const params = getRouterParams(event);
    const { id: workspaceId, userId } = paramsSchema.parse(params);

    // Ensure user has CTO role (only CTOs can change roles)
    const authContext = await requireCTO(event, workspaceId);

    // Prevent CTO from changing their own role
    if (authContext.user.id === userId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Cannot change your own role",
      });
    }

    // Parse request body
    const body = await readBody(event);
    const { role } = bodySchema.parse(body);

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

    // Update the member's role
    await db
      .update(workspaceMembers)
      .set({
        role: role,
      })
      .where(and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)));

    return {
      success: true,
      message: `Successfully updated ${existingMember.user.name}'s role to ${role}`,
      member: {
        userId: existingMember.userId,
        role: role,
        name: existingMember.user.name,
      },
    };
  } catch (error: unknown) {
    console.error("Error in PATCH /api/workspaces/[id]/members/[userId]:", error);

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
