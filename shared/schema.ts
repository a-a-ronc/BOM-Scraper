import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  customer: text("customer"),
  projectName: text("project_name"),
  address: text("address"),
  drawingNo: text("drawing_no"),
  revision: text("revision"),
  metadata: json("metadata").$type<{
    // Basic specs
    palletSize?: string;
    loadCapacity?: number;
    clearHeight?: string;
    trussHeight?: string;
    views?: string[];
    
    // Rack configuration details
    totalBays?: number;
    totalEndRowUprights?: number;
    topOfLoadBeamElevations?: string[];
    depthOfLoadBeam?: string;
    productLoad?: string;
    productDimensions?: string;
    topOfProductElevations?: string[];
  }>(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projectFiles = pgTable("project_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  filePath: text("file_path"), // Filesystem path for processing
  fileType: text("file_type"),
  pageCount: integer("page_count"),
  parsedData: json("parsed_data"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const bomItems = pgTable("bom_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  family: text("family").notNull(),
  partCode: text("part_code").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  uom: text("uom").notNull(),
  vendor: text("vendor").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  calcInputs: json("calc_inputs"),
});

export const agentLogs = pgTable("agent_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  stage: text("stage").notNull(),
  message: text("message").notNull(),
  details: json("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertProjectFileSchema = createInsertSchema(projectFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertBomItemSchema = createInsertSchema(bomItems).omit({
  id: true,
});

export const insertAgentLogSchema = createInsertSchema(agentLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertProjectFile = z.infer<typeof insertProjectFileSchema>;
export type ProjectFile = typeof projectFiles.$inferSelect;

export type InsertBomItem = z.infer<typeof insertBomItemSchema>;
export type BomItem = typeof bomItems.$inferSelect;

export type InsertAgentLog = z.infer<typeof insertAgentLogSchema>;
export type AgentLog = typeof agentLogs.$inferSelect;
