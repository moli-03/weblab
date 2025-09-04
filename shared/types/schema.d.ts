import type { Workspace, Technology, UserRole } from "~~/server/database/schema";
import type { PublicUser } from "~~/server/utils/response-sanitizer";

export type User = PublicUser;

export type WorkspaceWithOwner = Workspace & {
  owner: PublicUser;
  isJoined?: boolean;
};

export interface WorkspaceMember extends PublicUser {
  role: UserRole;
  joinedAt: string;
}

export type { Workspace, Technology };
