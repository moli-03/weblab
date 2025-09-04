import { hashPassword } from "../../security/password";
import { users } from "../schema";
import type { DB } from "..";
import { seed } from "drizzle-seed";

export default async function execute(db: DB) {
  const adminPassword = await hashPassword("hslu1234");

  // Default admin account
  await db.insert(users).values({
    name: "Admin",
    email: "admin@admin.dev",
    passwordHash: adminPassword,
  });

  // Some more users
  await seed(db, { users }).refine(f => ({
    users: {
      count: 20,
      columns: {
        passwordHash: f.default({
          defaultValue: adminPassword,
        }),
      },
    },
  }));
}
