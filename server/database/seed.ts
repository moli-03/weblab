import "dotenv/config";

import { reset, seed } from "drizzle-seed";
import { db } from "./index";
import { loginAudit, type NewWorkspaceUser, technologies, users, workspaces, workspaceUsers } from "./schema";
import { hashPassword } from "../security/password";

const main = async () => {
  try {
    console.log("Seeding database...");

    await reset(db, { workspaceUsers, technologies, users, workspaces, loginAudit });

    const adminPassword = await hashPassword("hslu1234");

    // Default admin account
    await db.insert(users).values({
      name: "Admin",
      email: "admin@admin.dev",
      passwordHash: adminPassword,
    });

    const workspaceCount: number = 5;

    // Random admins for the workspaces
    await seed(db, { users }).refine(f => ({
      users: {
        count: workspaceCount * 2,
        columns: {
          passwordHash: f.default({
            defaultValue: adminPassword,
          }),
        },
      },
    }));

    const admins = await db.query.users.findMany();
    await seed(db, { workspaces }).refine(f => ({
      workspaces: {
        count: workspaceCount,
        columns: {
          name: f.companyName(),
          slug: f.uuid(),
          logoUrl: f.valuesFromArray({
            values: [
              "https://www.shutterstock.com/image-vector/circle-line-simple-design-logo-600nw-2174926871.jpg",
              "https://img.freepik.com/free-vector/abstract-company-logo_53876-120501.jpg",
              "https://nuxt.com/assets/design-kit/icon-green.svg",
              "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Tailwind_CSS_Logo.svg/2560px-Tailwind_CSS_Logo.svg.png",
              undefined,
            ],
          }),
          description: f.loremIpsum(),
          isPublic: f.weightedRandom([
            { weight: 0.7, value: f.default({ defaultValue: true }) },
            { weight: 0.3, value: f.default({ defaultValue: false }) },
          ]),
          ownerId: f.valuesFromArray({
            values: admins.map(admin => admin.id),
          }),
        },
      },
    }));

    const allWorkspaces = await db.query.workspaces.findMany();
    await db.insert(workspaceUsers).values(
      allWorkspaces.map<NewWorkspaceUser>(workspace => ({
        userId: admins.find(user => user.id == workspace.ownerId)!.id!,
        workspaceId: workspace.id,
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
