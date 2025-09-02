import { relations, sql } from "drizzle-orm";
import { json, pgTable, uuid, timestamp, varchar,  primaryKey, uniqueIndex, pgEnum, text, check, inet, boolean } from "drizzle-orm/pg-core";

export const technologyCategory = pgEnum("technology_category", ["technique", "tool", "platform", "framework"]);
export const technologyRing = pgEnum("technology_ring", ["adopt", "trial", "assess", "hold"]);
export const technologyStatus = pgEnum("technology_status", ["draft", "published"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  roles: json("roles").notNull().$type<Array<"admin" | "cto" | "customer">>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, table => [
    uniqueIndex("email_idx").on(table.email)
]);

export const loginAudit = pgTable("login_audit", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
    ipAddress: inet("ip_address").notNull(),
    userAgent: text("user_agent").notNull(),
    loginSuccessful: boolean("login_successful").notNull(),
    failureReason: varchar("failure_reason", { length: 255 })
});

export const workspaces = pgTable("workspaces", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const userWorkspaces = pgTable("user_workspaces", {
    userId: uuid("user_id").notNull().references(() => users.id),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
}, table => [
    primaryKey({ columns: [table.userId, table.workspaceId] }),
]);

export const technology = pgTable("technology", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    name: varchar("name", { length: 255 }).notNull(),
    category: technologyCategory("category").notNull(),
    description: text("description").notNull(),
    ring: technologyRing("ring"),
    ringDescription: text("ring_description"),
    status: technologyStatus("status").notNull(),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
}, table => [
    // Unique technologies per workspace
    uniqueIndex("workspace_technology_idx").on(table.workspaceId, table.name),
    check("published_tech_must_have_ring", sql`
        (${table.status} = "draft") 
        OR (${table.status} = "published" AND ${table.ring} IS NOT NULL AND ${table.publishedAt} IS NOT NULL
    )`)
]);



// Relations
export const userRelations = relations(users, ({ many }) => ({
    userWorkspaces: many(userWorkspaces),
    loginAudits: many(loginAudit),
}));

export const workspaceRelations = relations(workspaces, ({ many }) => ({
    userWorkspaces: many(userWorkspaces),
}));

export const userWorkspaceRelations = relations(userWorkspaces, ({ one }) => ({
    user: one(users, {
        fields: [userWorkspaces.userId],
        references: [users.id],
    }),
    workspace: one(workspaces, {
        fields: [userWorkspaces.workspaceId],
        references: [workspaces.id],
    }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type UserWorkspace = typeof userWorkspaces.$inferSelect;
export type NewUserWorkspace = typeof userWorkspaces.$inferInsert;
export type Technology = typeof technology.$inferSelect;
export type NewTechnology = typeof technology.$inferInsert;