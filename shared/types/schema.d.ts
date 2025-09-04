import type { Workspace } from "~~/server/database/schema";
import type { PublicUser } from "~~/server/utils/response-sanitizer";

export type User = PublicUser;

export type WorkspaceWithOwner = Workspace & {
  owner: PublicUser;
};

export type { Workspace };
