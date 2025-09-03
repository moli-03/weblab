import type { User, WorkspaceUser } from "../database/schema";

export type PublicUser = Omit<User, "passwordHash">;

export type PublicWorkspaceUser = WorkspaceUser & {
  user: PublicUser;
};

export function toPublicUser(user: User): PublicUser {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

export function toPublicUsers(users: User[]): PublicUser[] {
  return users.map(toPublicUser);
}
