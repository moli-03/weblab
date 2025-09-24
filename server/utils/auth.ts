import { db } from "../database";
import type { User, UserRole } from "../database/schema";
import { loginAudit } from "../database/schema";
import { createJwtAuthService } from "../security/jwt-auth";
import { toPublicUser, type PublicUser } from "./response-sanitizer";

export interface AuthContext {
  user: PublicUser;
}

export const jwtAuthService = createJwtAuthService<AuthContext>();

export const validateTokenForRequest = async (token: string): Promise<AuthContext | null> => {
  const tokenPayload = jwtAuthService.validateAccessToken(token)?.payload;
  if (!tokenPayload) {
    return null;
  }

  // Re-validate user exists in database
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, tokenPayload.user.id),
  });

  if (!user) {
    return null;
  }

  return {
    user: toPublicUser(user),
  };
};

export const generateTokenPair = async (user: User) => {
  const context: AuthContext = {
    user: toPublicUser(user),
  };

  return jwtAuthService.generateTokenPair(user.id, context);
};

export const refreshTokenPair = async (refreshToken: string) => {
  const context = jwtAuthService.validateRefreshToken(refreshToken)?.payload;
  if (!context) {
    throw new Error("Invalid refresh token");
  }

  // Re-validate user exists in database
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, context.user.id),
  });

  if (!user) {
    throw new Error("User no longer exists");
  }

  // Generate new token pair with fresh user data
  const updatedContext: AuthContext = {
    user: toPublicUser(user),
  };

  return jwtAuthService.generateTokenPair(context.user.id, updatedContext);
};

export const getUserFromAccessToken = async (accessToken: string): Promise<PublicUser | null> => {
  const context = await validateTokenForRequest(accessToken);
  return context ? context.user : null;
};

export const getUserWorkspaceProfiles = async (userId: string) => {
  return await db.query.workspaceMembers.findMany({
    where: (wm, { eq }) => eq(wm.userId, userId),
  });
};

export const hasRoleForRequest = async (
  authContext: AuthContext | null,
  workspaceId: string,
  role: UserRole,
): Promise<boolean> => {
  if (!authContext) return false;

  const workspaceProfiles = await getUserWorkspaceProfiles(authContext.user.id);
  return workspaceProfiles.some(profile => profile.workspaceId === workspaceId && profile.role === role);
};

export const auditLogin = async (
  userId: string | null,
  ipAddress: string,
  userAgent: string,
  success: boolean,
  failureReason?: string,
) => {
  try {
    await db.insert(loginAudit).values({
      userId,
      attemptedAt: new Date(),
      ipAddress,
      userAgent,
      loginSuccessful: success,
      failureReason,
    });
  } catch (error) {
    console.error("Failed to audit login:", error);
    // Don't throw - audit failures shouldn't break login flow
  }
};
