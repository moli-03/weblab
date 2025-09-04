import "dotenv/config";

import { reset } from "drizzle-seed";
import { db } from "./index";
import { loginAudit, technologies, users, workspaces, workspaceUsers } from "./schema";
import seeders from "./seeders/index";

const main = async () => {
  try {
    console.log("Seeding database...");

    await reset(db, { workspaceUsers, technologies, users, workspaces, loginAudit });

    await seeders.users(db);
    await seeders.workspaces(db);
    await seeders.technologies(db);

    console.log("Database seeding complete");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

main();
