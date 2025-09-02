import "dotenv/config";

import { reset, seed } from "drizzle-seed";
import { db } from "./index";
import { users } from "./schema";
import { hashPassword } from "../security/password";

const main = async () => {
  try {
    console.log("Seeding database...");

    await reset(db, { users });

    await db
      .insert(users)
      .values({
        name: "SysAdmin",
        email: "sysadmin@example.com",
        roles: ["admin"],
        passwordHash: await hashPassword("hslu"),
      })
      .returning();

    const defaultPassword = await hashPassword("password");

    await seed(db, { users }).refine(f => ({
      users: {
        count: 10,
        columns: {
          passwordHash: f.default({
            defaultValue: defaultPassword,
          }),
          roles: f.valuesFromArray({
            values: ["cto", "customer"],
            arraySize: 1,
          }),
        },
      },
    }));

    console.log("Database seeding complete");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

main();
