import { validateTokenForRequest, hasRoleForRequest, type AuthContext } from "../utils/auth";
import type { UserRole } from "../database/schema";
import type { H3Event } from "h3";

declare module "h3" {
  interface H3EventContext {
    auth?: AuthContext | null;
  }
}

export default defineEventHandler(async event => {
  if (event.context.auth !== undefined) {
    return;
  }

  const authHeader = getHeader(event, "authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    event.context.auth = null;
    return;
  }

  const token = authHeader.substring(7);
  const authContext = validateTokenForRequest(token);

  event.context.auth = authContext;
});

export const parseAuthToken = (event: H3Event): AuthContext | null => {
  return event.context.auth ?? null;
};

export const requireAuth = (event: H3Event): AuthContext => {
  const authContext = parseAuthToken(event);

  if (!authContext) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Authentication required",
    });
  }

  return authContext;
};

export const requireRole = (event: H3Event, workspaceId: string, requiredRole: UserRole): AuthContext => {
  const authContext = requireAuth(event);

  const hasRequiredRole = hasRoleForRequest(authContext, workspaceId, requiredRole);

  if (!hasRequiredRole) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: `Required role: ${requiredRole} in workspace: ${workspaceId}`,
    });
  }

  return authContext;
};

export const requireAdmin = (event: H3Event): AuthContext => {
  const authContext = requireAuth(event);

  const isAdmin = authContext.workspaceProfiles.some(profile => profile.role === "admin");

  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: "Admin role required",
    });
  }

  return authContext;
};

export const getAuthContext = (event: H3Event): AuthContext | null => {
  return parseAuthToken(event);
};

export const getCurrentUserId = (event: H3Event): string => {
  const authContext = requireAuth(event);
  return authContext.user.id;
};

export const hasWorkspaceAccess = (event: H3Event, workspaceId: string): boolean => {
  const authContext = getAuthContext(event);
  if (!authContext) return false;

  return authContext.workspaceProfiles.some(profile => profile.workspaceId === workspaceId);
};
