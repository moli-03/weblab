import { db } from "../database";
import type { User, UserRole, WorkspaceUser } from "../database/schema";
import { loginAudit } from "../database/schema";
import { createJwtAuthService } from "../security/jwt-auth";
import { toPublicUser, type PublicUser } from "./response-sanitizer";

export interface AuthContext {
  user: PublicUser;
  workspaceProfiles: WorkspaceUser[];
}

export const jwtAuthService = createJwtAuthService<AuthContext>();

export const validateTokenForRequest = (token: string): AuthContext | null => {
  return jwtAuthService.validateAccessToken(token)?.payload ?? null;
};

export const generateTokenPair = async (user: User) => {
  const context: AuthContext = {
    user: toPublicUser(user),
    workspaceProfiles: await db.query.workspaceUsers.findMany({
      where: (wu, { eq }) => eq(wu.userId, user.id),
    }),
  };

  return jwtAuthService.generateTokenPair(user.id, context);
};

export const refreshTokenPair = (refreshToken: string) => {
  const context = jwtAuthService.validateRefreshToken(refreshToken)?.payload;
  if (!context) {
    throw new Error("Invalid refresh token");
  }
  return jwtAuthService.generateTokenPair(context.user.id, context);
};

export const hasRoleForRequest = (authContext: AuthContext | null, workspaceId: string, role: UserRole): boolean => {
  if (!authContext) return false;

  return authContext.workspaceProfiles.some(profile => profile.workspaceId === workspaceId && profile.role === role);
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
