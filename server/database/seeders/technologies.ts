import type { DB } from "..";
import type { NewTechnology } from "../schema";
import { technologies as technologiesTable } from "../schema";

const seedTechnologies: Omit<NewTechnology, "workspaceId" | "status">[] = [
  // Frameworks (cover rings adopt, trial, assess, hold)
  {
    name: "Nuxt",
    logoUrl: "https://nuxt.com/assets/design-kit/icon-green.svg",
    category: "framework",
    description: "The intuitive Vue meta framework for building web applications.",
    ring: "adopt",
    ringDescription: "Primary choice for SSR + DX in Vue ecosystem.",
  },
  {
    name: "Next.js",
    logoUrl: "https://nextjs.org/favicon.ico",
    category: "framework",
    description: "React framework for production with hybrid rendering.",
    ring: "adopt",
    ringDescription: "Battle tested for React workloads.",
  },
  {
    name: "NestJS",
    logoUrl: "https://docs.nestjs.com/assets/logo-small.svg",
    category: "framework",
    description: "Progressive Node.js framework for building efficient server-side apps.",
    ring: "trial",
    ringDescription: "Exploring for consistent backend architecture.",
  },
  {
    name: "SvelteKit",
    logoUrl: "https://svelte.dev/favicon.png",
    category: "framework",
    description: "Application framework for Svelte with routing & SSR.",
    ring: "assess",
    ringDescription: "Assessing performance & bundle size benefits.",
  },
  {
    name: "Angular",
    logoUrl: "https://angular.io/assets/images/favicons/favicon.ico",
    category: "framework",
    description: "Full‑featured TypeScript framework maintained by Google.",
    ring: "hold",
    ringDescription: "Legacy support only; not for new greenfield projects.",
  },

  // Platforms
  {
    name: "Vercel",
    logoUrl: "https://assets.vercel.com/image/upload/front/favicon/vercel/favicon.ico",
    category: "platform",
    description: "Edge‑first deployment & hosting platform for frontend frameworks.",
    ring: "adopt",
    ringDescription: "Default hosting for frontend & serverless functions.",
  },
  {
    name: "AWS Lambda",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Amazon_Lambda_architecture_logo.svg/250px-Amazon_Lambda_architecture_logo.svg.png",
    category: "platform",
    description: "Serverless compute platform by AWS.",
    ring: "trial",
    ringDescription: "Evaluate for event driven workloads needing deep AWS integration.",
  },
  {
    name: "Cloudflare Workers",
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdxGIZWq0lPRWmSDaBMEdlpA4lnQqw1pBqnA&s",
    category: "platform",
    description: "Edge compute platform running JS close to users.",
    ring: "assess",
    ringDescription: "Assess cold start and edge KV capabilities.",
  },
  {
    name: "Heroku",
    logoUrl: "https://www.herokucdn.com/favicon.ico",
    category: "platform",
    description: "PaaS for deploying apps quickly.",
    ring: "hold",
    ringDescription: "Migration underway; cost & flexibility limitations.",
  },

  // Tools
  {
    name: "TypeScript",
    logoUrl: "https://www.typescriptlang.org/icons/icon-48x48.png",
    category: "tool",
    description: "Typed superset of JavaScript that compiles to plain JS.",
    ring: "adopt",
    ringDescription: "Mandatory for all new codebases.",
  },
  {
    name: "Vitest",
    logoUrl: "https://vitest.dev/logo.svg",
    category: "tool",
    description: "Next generation blazing fast unit test framework powered by Vite.",
    ring: "adopt",
    ringDescription: "Fast feedback in dev loop.",
  },
  {
    name: "Playwright",
    logoUrl: "https://playwright.dev/img/playwright-logo.svg",
    category: "tool",
    description: "Reliable end‑to‑end testing for modern web apps.",
    ring: "trial",
    ringDescription: "Expanding E2E coverage beyond basic happy paths.",
  },
  {
    name: "Drizzle ORM",
    logoUrl: "https://avatars.githubusercontent.com/u/108468352?v=4",
    category: "tool",
    description: "TypeScript ORM focusing on type safety & SQL-first workflows.",
    ring: "trial",
    ringDescription: "Evaluating migrations ergonomics & DX vs Prisma.",
  },
  {
    name: "Prisma",
    logoUrl: "https://www.prisma.io/favicon.ico",
    category: "tool",
    description: "Type-safe ORM for Node.js & TypeScript.",
    ring: "assess",
    ringDescription: "Assessing continued fit vs Drizzle shift.",
  },
  {
    name: "Webpack",
    logoUrl: "https://raw.githubusercontent.com/webpack/media/master/logo/icon-square-small.png",
    category: "tool",
    description: "Module bundler for JavaScript & assets.",
    ring: "hold",
    ringDescription: "Avoid for new apps; legacy maintenance only.",
  },
  {
    name: "ESLint",
    logoUrl: "https://eslint.org/favicon.ico",
    category: "tool",
    description: "Pluggable linting utility for JavaScript & TypeScript.",
    ring: "adopt",
    ringDescription: "Baseline code quality enforcement.",
  },
  {
    name: "Prettier",
    logoUrl: "https://prettier.io/icon.png",
    category: "tool",
    description: "Opinionated code formatter ensuring consistent style.",
    ring: "adopt",
    ringDescription: "Auto-format on commit & save.",
  },

  // Techniques
  {
    name: "Test-Driven Development",
    category: "technique",
    description: "Write failing test, implement code, refactor.",
    ring: "adopt",
    ringDescription: "Default for critical modules & domain logic.",
  },
  {
    name: "Domain-Driven Design",
    category: "technique",
    description: "Strategic design aligning software model with business domain.",
    ring: "trial",
    ringDescription: "Applying bounded contexts to new services.",
  },
  {
    name: "Infrastructure as Code",
    category: "technique",
    description: "Provision & manage infra through declarative code.",
    ring: "adopt",
    ringDescription: "All infra changes via version control.",
  },
  {
    name: "Micro Frontends",
    category: "technique",
    description: "Decompose frontend into independently deployable fragments.",
    ring: "assess",
    ringDescription: "Exploring composition complexity & runtime overhead.",
  },
  {
    name: "Serverless First",
    category: "technique",
    description: "Prefer managed & event-driven compute over servers.",
    ring: "assess",
    ringDescription: "Assessing cost model & cold start impact.",
  },
  {
    name: "Long-Lived Feature Branches",
    category: "technique",
    description: "Large changes developed in isolation for extended periods.",
    ring: "hold",
    ringDescription: "Discouraged due to merge risk & slowed feedback.",
  },

  // Draft examples (no ring => status draft)
  {
    name: "Qwik",
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-wkuJvQ9Wxmh7aK3jS9b7naNGy1kYee_agQ&s",
    category: "framework",
    description: "Resumable framework focused on instant loading.",
  },
  {
    name: "Bun",
    logoUrl: "https://bun.sh/logo.svg",
    category: "platform",
    description: "All-in-one JavaScript runtime & toolkit.",
  },
  {
    name: "Turborepo",
    logoUrl: "https://turborepo.com/icon.png?icon.fb1a054d.png",
    category: "tool",
    description: "High-performance build system for JavaScript & monorepos.",
  },
  { name: "Event Sourcing", category: "technique", description: "Persist state as a sequence of domain events." },
];

export default async function execute(db: DB) {
  const workspaces = await db.query.workspaces.findMany();
  if (workspaces.length === 0) {
    console.warn("No workspaces found. Skipping technologies seeding.");
    return;
  }

  for (const ws of workspaces) {
    const randomTechnologies = seedTechnologies.filter(() => Math.random() < 0.7);

    await db.insert(technologiesTable).values(
      randomTechnologies.map<NewTechnology>(t => ({
        ...t,
        workspaceId: ws.id,
        status: t.ring ? "published" : "draft",
        publishedAt: t.ring ? new Date().toISOString() : undefined,
      })),
    );
  }
}
