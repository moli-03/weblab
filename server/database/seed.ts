import "dotenv/config";

import { reset } from "drizzle-seed";
import { db } from "./index";
import { loginAudit, technologies, users, workspaces, workspaceMembers, workspaceInvites } from "./schema";
import seeders from "./seeders/index";

const main = async () => {
  try {
    console.log("Seeding database...");

    await reset(db, { workspaceMembers, technologies, users, workspaces, loginAudit, workspaceInvites });
    console.log("Database reset complete");

    const seedGen = new Date().getTime();

    await seeders.users(db, seedGen);
    await seeders.workspaces(db, seedGen);
    await seeders.technologies(db, seedGen);

    console.log("Database seeding complete");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

main();
