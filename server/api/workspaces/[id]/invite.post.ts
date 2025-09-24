import z from "zod";
import { db } from "~~/server/database";
import { workspaceInvites } from "~~/server/database/schema";
import { requireAdminOrCTO } from "~~/server/middleware/auth";
import { randomBytes } from "crypto";

const paramsSchema = z.object({
  id: z.uuid(),
});

const bodySchema = z.object({
  email: z.email().optional(), // Optional: for targeted invites
});

export default defineEventHandler(async event => {
  try {
    const params = getRouterParams(event);
    const { id: workspaceId } = paramsSchema.parse(params);

    // Ensure user has admin or CTO role
    const authContext = await requireAdminOrCTO(event, workspaceId);

    // Parse request body
    const body = await readBody(event);
    const { email } = bodySchema.parse(body);

    // Generate a secure random token
    const token = randomBytes(32).toString("hex");

    // Set expiry to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    // Create the invite
    const [newInvite] = await db
      .insert(workspaceInvites)
      .values({
        token,
        workspaceId,
        inviterId: authContext.user.id,
        email: email || null,
        expiresAt: expiresAt.toISOString(),
      })
      .returning();

    // Return the invite with the full URL
    const baseUrl = getRequestURL(event).origin;
    const inviteUrl = `${baseUrl}/invite/${token}`;

    return {
      id: newInvite.id,
      token: newInvite.token,
      inviteUrl,
      email: newInvite.email,
      expiresAt: newInvite.expiresAt,
      createdAt: newInvite.createdAt,
    };
  } catch (error) {
    console.error("Error in POST /api/workspaces/[id]/invite:", error);

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
      message: "Failed to create invite",
    });
  }
});
