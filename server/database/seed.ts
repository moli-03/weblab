import "dotenv/config";

import { reset, seed } from "drizzle-seed";
import { db } from "./index";
import { users } from "./schema";

const main = async () => {
  try {
    console.log("Seeding database...");

    console.log("Removing old data");
    await reset(db, { users });

    console.log("Seeding admin");
    await db
      .insert(users)
      .values({
        name: "SysAdmin",
        email: "sysadmin@example.com",
        roles: ["admin"],
        passwordHash: "hashedpassword", // TODO: Replace with actual hash
      })
      .returning();

    console.log("Admin user created");

    console.log("Creating demo users");
    await seed(db, { users }).refine(f => ({
      users: {
        count: 10,
        columns: {
          passwordHash: f.default({
            defaultValue: "PretendThatImAPasswordHash",
          }),
          roles: f.valuesFromArray({
            values: ["cto", "customer"],
            arraySize: 1,
          }),
        },
      },
    }));

    console.log("Created some demo users");
    console.log("Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

main();
