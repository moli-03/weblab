import z from "zod";
import { db } from "~~/server/database";
import { workspaceInvites, workspaceMembers } from "~~/server/database/schema";
import { requireAuth } from "~~/server/middleware/auth";
import { eq, and } from "drizzle-orm";

const paramsSchema = z.object({
  token: z.string(),
});

export default defineEventHandler(async event => {
  try {
    const params = getRouterParams(event);
    const { token } = paramsSchema.parse(params);

    // Ensure user is authenticated
    const authContext = requireAuth(event);

    // Find the invite
    const invite = await db.query.workspaceInvites.findFirst({
      where: eq(workspaceInvites.token, token),
      with: {
        workspace: true,
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
    if (now > expiresAt) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Invite has expired",
      });
    }

    // Check if invite has already been used
    if (invite.usedAt) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Invite has already been used",
      });
    }

    // Check if user is already a member of the workspace
    const existingMember = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.userId, authContext.user.id),
        eq(workspaceMembers.workspaceId, invite.workspaceId),
      ),
    });

    if (existingMember) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "You are already a member of this workspace",
      });
    }

    // Mark invite as used and add user to workspace
    await db.transaction(async tx => {
      // Mark invite as used
      await tx
        .update(workspaceInvites)
        .set({
          usedAt: new Date().toISOString(),
          usedById: authContext.user.id,
        })
        .where(eq(workspaceInvites.id, invite.id));

      // Add user to workspace as a customer (default role)
      await tx.insert(workspaceMembers).values({
        userId: authContext.user.id,
        workspaceId: invite.workspaceId,
        role: "customer",
      });
    });

    return {
      success: true,
      workspace: {
        id: invite.workspace.id,
        name: invite.workspace.name,
        slug: invite.workspace.slug,
      },
      message: `Successfully joined ${invite.workspace.name}`,
    };
  } catch (error) {
    console.error("Error in POST /api/invite/[token]:", error);

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
      message: "Failed to accept invite",
    });
  }
});
