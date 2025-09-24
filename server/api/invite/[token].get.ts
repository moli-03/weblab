import z from "zod";
import { db } from "~~/server/database";
import { workspaceInvites } from "~~/server/database/schema";
import { eq } from "drizzle-orm";

const paramsSchema = z.object({
  token: z.string(),
});

export default defineEventHandler(async event => {
  try {
    const params = getRouterParams(event);
    const { token } = paramsSchema.parse(params);

    // Find the invite
    const invite = await db.query.workspaceInvites.findFirst({
      where: eq(workspaceInvites.token, token),
      with: {
        workspace: {
          columns: {
            id: true,
            name: true,
            slug: true,
            description: true,
            logoUrl: true,
          },
        },
        inviter: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invite) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Invite not found",
      });
    }

    // Check if invite has expired
    const now = new Date();
    const expiresAt = new Date(invite.expiresAt);
    const isExpired = now > expiresAt;

    // Check if invite has already been used
    const isUsed = !!invite.usedAt;

    return {
      id: invite.id,
      workspace: invite.workspace,
      inviter: invite.inviter,
      email: invite.email,
      expiresAt: invite.expiresAt,
      isExpired,
      isUsed,
      usedAt: invite.usedAt,
      createdAt: invite.createdAt,
    };
  } catch (error) {
    console.error("Error in GET /api/invite/[token]:", error);

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
      message: "Failed to retrieve invite",
    });
  }
});
