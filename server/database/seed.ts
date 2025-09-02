import "dotenv/config";

import { reset, seed } from "drizzle-seed";
import { db } from "./index";
import { loginAudit, type NewWorkspaceUser, technologies, users, workspaces, workspaceUsers } from "./schema";
import { hashPassword } from "../security/password";

const main = async () => {
  try {
    console.log("Seeding database...");

    await reset(db, { workspaceUsers, technologies, users, workspaces, loginAudit });

    const workspaceCount: number = 5;

    await seed(db, { workspaces }).refine(f => ({
      workspaces: {
        count: workspaceCount,
        columns: {
          name: f.companyName(),
        },
      },
    }));

    // Random admins for the workspaces
    const adminPassword = await hashPassword("hslu1234");
    await seed(db, { users }).refine(f => ({
      users: {
        count: workspaceCount,
        columns: {
          passwordHash: f.default({
            defaultValue: adminPassword,
          }),
        },
      },
    }));

    const admins = await db.query.users.findMany();
    const allWorkspaces = await db.query.workspaces.findMany();
    await db.insert(workspaceUsers).values(
      admins.map<NewWorkspaceUser>((admin, index) => ({
        userId: admin.id,
        workspaceId: allWorkspaces[index % allWorkspaces.length].id,
        role: "admin",
      })),
    );

    // Some technologies
    await seed(db, { technologies }).refine(f => ({
      technologies: {
        count: 10,
        columns: {
          workspaceId: f.valuesFromArray({
            values: allWorkspaces.map(workspace => workspace.id),
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
