import z from "zod";
import { db } from "~~/server/database";
import { requireAuth } from "~~/server/middleware/auth";
import { toPublicUser } from "~~/server/utils/response-sanitizer";
import type { WorkspaceWithOwner } from "~~/shared/types/schema";

const queryParamsSchema = z.object({
  joined: z
    .string()
    .optional()
    .transform(val => (val === "true" ? true : val === "false" ? false : undefined)),
  slug: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  search: z.string().optional(),
});

export default defineEventHandler(async event => {
  const authContext = requireAuth(event);

  try {
    const query = getQuery(event);
    const parsedQuery = queryParamsSchema.parse(query);

    // Build the where conditions
    const joinedWorkspaceIds = authContext.workspaceProfiles.map(profile => profile.workspaceId);

    if (parsedQuery.joined && joinedWorkspaceIds.length === 0) {
      // User hasn't joined any workspaces, return empty result
      return {
        entries: [],
        pagination: {
          limit: parsedQuery.limit,
          offset: parsedQuery.offset,
          count: 0,
          hasMore: false,
        },
      };
    }

    const workspaces = await db.query.workspaces.findMany({
      where: (ws, { eq, and, or, inArray, ilike, notInArray }) => {
        // Visibility filter
        const conditions = [or(eq(ws.isPublic, true), inArray(ws.id, joinedWorkspaceIds))];

        if (parsedQuery.joined != undefined) {
          if (parsedQuery.joined) {
            conditions.push(inArray(ws.id, joinedWorkspaceIds));
          } else {
            conditions.push(notInArray(ws.id, joinedWorkspaceIds));
          }
        }

        if (parsedQuery.slug) {
          conditions.push(eq(ws.slug, parsedQuery.slug));
        }

        if (parsedQuery.search) {
          conditions.push(ilike(ws.name, `%${parsedQuery.search}%`));
        }

        return conditions.length > 1 ? and(...conditions) : conditions[0];
      },
      with: {
        owner: true,
      },
      orderBy: (fields, { desc }) => {
        return desc(fields.createdAt);
      },
      limit: parsedQuery.limit,
      offset: parsedQuery.offset,
    });

    const workspacesWithOwner: WorkspaceWithOwner[] = workspaces.map(ws => ({
      ...ws,
      owner: toPublicUser(ws.owner),
      isJoined: joinedWorkspaceIds.includes(ws.id),
    }));

    return {
      entries: workspacesWithOwner,
      pagination: {
        limit: parsedQuery.limit,
        offset: parsedQuery.offset,
        count: workspacesWithOwner.length,
        hasMore: workspacesWithOwner.length === parsedQuery.limit,
      },
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: error,
    });
  }
});
