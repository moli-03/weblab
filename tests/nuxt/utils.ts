import { db } from "../../server/database";
import {
  loginAudit,
  technologies,
  users,
  workspaceInvites,
  workspaceMembers,
  workspaces,
} from "../../server/database/schema";

export const clearDB = async () => {
  await db.delete(loginAudit);
  await db.delete(technologies);
  await db.delete(workspaceInvites);
  await db.delete(workspaceMembers);
  await db.delete(workspaces);
  await db.delete(users);
};
