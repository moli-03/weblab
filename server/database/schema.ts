import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  timestamp,
  varchar,
  primaryKey,
  uniqueIndex,
  pgEnum,
  text,
  check,
  inet,
  boolean,
  index,
} from "drizzle-orm/pg-core";

export const technologyCategory = pgEnum("technology_category", ["technique", "tool", "platform", "framework"]);
export const technologyRing = pgEnum("technology_ring", ["adopt", "trial", "assess", "hold"]);
export const technologyStatus = pgEnum("technology_status", ["draft", "published"]);
export const userRole = pgEnum("user_role", ["admin", "cto", "customer"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  },
  table => [uniqueIndex("email_idx").on(table.email)],
);

export const loginAudit = pgTable("login_audit", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
  ipAddress: inet("ip_address").notNull(),
  userAgent: text("user_agent").notNull().notNull(),
  loginSuccessful: boolean("login_successful").notNull(),
  failureReason: varchar("failure_reason", { length: 255 }),
});

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    logoUrl: varchar("logo_url", { length: 255 }),
    description: text("description").notNull(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    isPublic: boolean("is_public").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  },
  table => [
    uniqueIndex("workspace_name_idx").on(table.name),
    uniqueIndex("workspace_slug_idx").on(table.slug),
    index("workspace_owner_idx").on(table.ownerId),
  ],
);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    role: userRole("role").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  },
  table => [primaryKey({ columns: [table.userId, table.workspaceId] })],
);

export const technologies = pgTable(
  "technologies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    name: varchar("name", { length: 255 }).notNull(),
    logoUrl: varchar("logo_url", { length: 255 }),
    category: technologyCategory("category").notNull(),
    description: text("description").notNull(),
    ring: technologyRing("ring"),
    ringDescription: text("ring_description"),
    status: technologyStatus("status").notNull(),
    publishedAt: timestamp("published_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  },
  table => [
    // Unique technologies per workspace
    uniqueIndex("workspace_technology_idx").on(table.workspaceId, table.name),
    check(
      "published_tech_must_have_ring",
      sql`
      (${table.status} = 'draft') 
      OR (${table.status} = 'published' AND ${table.ring} IS NOT NULL AND ${table.publishedAt} IS NOT NULL)
  `,
    ),
  ],
);

export const workspaceInvites = pgTable(
  "workspace_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: varchar("token", { length: 255 }).notNull(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    inviterId: uuid("inviter_id")
      .notNull()
      .references(() => users.id),
    email: varchar("email", { length: 255 }), // Optional: for targeted invites
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    usedAt: timestamp("used_at", { mode: "string" }),
    usedById: uuid("used_by_id").references(() => users.id),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  },
  table => [
    uniqueIndex("workspace_invite_token_idx").on(table.token),
    index("workspace_invite_workspace_idx").on(table.workspaceId),
    index("workspace_invite_expires_idx").on(table.expiresAt),
  ],
);

// Relations
export const userRelations = relations(users, ({ many }) => ({
  workspaceMembers: many(workspaceMembers),
  loginAudits: many(loginAudit),
  ownedWorkspaces: many(workspaces),
  sentInvites: many(workspaceInvites, { relationName: "inviter" }),
  usedInvites: many(workspaceInvites, { relationName: "invitee" }),
}));

export const workspaceRelations = relations(workspaces, ({ many, one }) => ({
  workspaceMembers: many(workspaceMembers),
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id],
  }),
  technologies: many(technologies),
  invites: many(workspaceInvites),
}));

export const technologyRelations = relations(technologies, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [technologies.workspaceId],
    references: [workspaces.id],
  }),
}));

export const workspaceMemberRelations = relations(workspaceMembers, ({ one }) => ({
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
}));

export const workspaceInviteRelations = relations(workspaceInvites, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceInvites.workspaceId],
    references: [workspaces.id],
  }),
  inviter: one(users, {
    fields: [workspaceInvites.inviterId],
    references: [users.id],
    relationName: "inviter",
  }),
  usedBy: one(users, {
    fields: [workspaceInvites.usedById],
    references: [users.id],
    relationName: "invitee",
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type UserRole = typeof workspaceMembers.$inferSelect.role;

export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert;

export type Technology = typeof technologies.$inferSelect;
export type NewTechnology = typeof technologies.$inferInsert;

export type WorkspaceInvite = typeof workspaceInvites.$inferSelect;
export type NewWorkspaceInvite = typeof workspaceInvites.$inferInsert;
