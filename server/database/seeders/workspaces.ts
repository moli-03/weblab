import { seed } from "drizzle-seed";
import type { DB } from "..";
import { type NewWorkspaceMember, workspaces, workspaceMembers } from "../schema";

export default async function execute(db: DB, seedGen: number) {
  const nWorkspaces: number = 5;

  const allUsers = await db.query.users.findMany();

  await seed(db, { workspaces }, { seed: seedGen }).refine(f => ({
    workspaces: {
      count: nWorkspaces,
      columns: {
        id: f.default({ defaultValue: undefined }),
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
        description: f.loremIpsum({ sentencesCount: 2 }),
        isPublic: f.weightedRandom([
          { weight: 0.7, value: f.default({ defaultValue: true }) },
          { weight: 0.3, value: f.default({ defaultValue: false }) },
        ]),
        ownerId: f.valuesFromArray({
          values: allUsers.map(user => user.id),
        }),
      },
    },
  }));

  // Assign the owners as CTO to the workspaces
  const allWorkspaces = await db.query.workspaces.findMany();
  await db.insert(workspaceMembers).values(
    allWorkspaces.map<NewWorkspaceMember>(workspace => ({
      userId: allUsers.find(user => user.id == workspace.ownerId)!.id!,
      workspaceId: workspace.id,
      role: "cto",
    })),
  );
}
