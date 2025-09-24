import type { User, WorkspaceMember } from "../database/schema";

export type PublicUser = Omit<User, "passwordHash">;

export type PublicWorkspaceMember = WorkspaceMember & {
  user: PublicUser;
};

export function toPublicUser(user: User): PublicUser {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

export function toPublicUsers(users: User[]): PublicUser[] {
  return users.map(toPublicUser);
}
