import z from "zod";
import { db } from "~~/server/database";
import { requireMembership } from "~~/server/middleware/auth";
import { toPublicUser } from "~~/server/utils/response-sanitizer";
import type { WorkspaceMember } from "~~/shared/types/schema";

const paramsSchema = z.object({ id: z.uuid() });

export default defineEventHandler(async event => {
  try {
    const params = getRouterParams(event);
    const { id: workspaceId } = paramsSchema.parse(params);

    // Ensure caller is at least a member
    await requireMembership(event, workspaceId);

    const members = await db.query.workspaceMembers.findMany({
      where: (wm, { eq }) => eq(wm.workspaceId, workspaceId),
      with: { user: true },
    });

    return members.map<WorkspaceMember>(m => ({
      ...toPublicUser(m.user),
      role: m.role,
      joinedAt: m.createdAt,
    }));
  } catch (error) {
    console.error("Error in GET /api/workspaces/[id]/members:", error);
    if (error && typeof error === "object" && "statusCode" in error) throw error;
    throw createError({ statusCode: 500, statusMessage: "Internal Server Error", data: error });
  }
});
