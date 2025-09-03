import { db } from "~~/server/database";
import { requireAuth } from "~~/server/middleware/auth";
import { toPublicUser } from "~~/server/utils/response-sanitizer";
import type { WorkspaceWithOwner } from "~~/shared/types/schema";

export default defineEventHandler(async event => {
  requireAuth(event);

  try {
    const workspaces = await db.query.workspaces.findMany({
      where: (ws, { eq }) => eq(ws.isPublic, true),
      with: {
        owner: true,
      },
      orderBy: (fields, { desc }) => {
        return desc(fields.createdAt);
      },
    });

    const workspacesWithOwner: WorkspaceWithOwner[] = workspaces.map(ws => ({
      ...ws,
      owner: toPublicUser(ws.owner),
    }));

    return {
      entries: workspacesWithOwner,
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: error,
    });
  }
});
