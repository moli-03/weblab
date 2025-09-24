import { validateTokenForRequest, hasRoleForRequest, getUserWorkspaceProfiles, type AuthContext } from "../utils/auth";
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
  const authContext = await validateTokenForRequest(token);

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

export const requireMembership = async (event: H3Event, workspaceId: string): Promise<AuthContext> => {
  const authContext = requireAuth(event);
  const workspaceProfiles = await getUserWorkspaceProfiles(authContext.user.id);
  const isMember = workspaceProfiles.some(profile => profile.workspaceId === workspaceId);
  if (!isMember) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: `Membership required in workspace: ${workspaceId}`,
    });
  }

  return authContext;
};

export const requireRole = async (
  event: H3Event,
  workspaceId: string,
  requiredRole: UserRole,
): Promise<AuthContext> => {
  const authContext = requireAuth(event);

  const hasRequiredRole = await hasRoleForRequest(authContext, workspaceId, requiredRole);

  if (!hasRequiredRole) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: `Required role: ${requiredRole} in workspace: ${workspaceId}`,
    });
  }

  return authContext;
};

export const requireAdmin = (event: H3Event, workspaceId: string): Promise<AuthContext> => {
  return requireRole(event, workspaceId, "admin");
};

export const requireAdminOrCTO = async (event: H3Event, workspaceId: string): Promise<AuthContext> => {
  const authContext = requireAuth(event);

  const isAdminOrCTO = await hasRoleForRequest(authContext, workspaceId, "admin")
    .then(isAdmin => {
      if (!isAdmin) {
        return hasRoleForRequest(authContext, workspaceId, "cto");
      }
      return true;
    });

  if (!isAdminOrCTO) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: `Required role: admin or cto in workspace: ${workspaceId}`,
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

export const hasWorkspaceAccess = async (event: H3Event, workspaceId: string): Promise<boolean> => {
  const authContext = getAuthContext(event);
  if (!authContext) return false;

  const workspaceProfiles = await getUserWorkspaceProfiles(authContext.user.id);
  return workspaceProfiles.some(profile => profile.workspaceId === workspaceId);
};
