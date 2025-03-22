import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Container schema for validation
export const containerSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string(),
  state: z.string(),
  status: z.string(),
  created: z.number(),
  ports: z.array(z.object({
    IP: z.string().optional(),
    PrivatePort: z.number(),
    PublicPort: z.number().optional(),
    Type: z.string(),
  })).optional(),
  stats: z.object({
    cpu_percent: z.number().optional(),
    memory_usage: z.number().optional(),
    memory_limit: z.number().optional(),
    memory_percent: z.number().optional(),
    storage_usage: z.number().optional(),
  }).optional(),
});

export type Container = z.infer<typeof containerSchema>;

// Image schema for validation
export const imageSchema = z.object({
  id: z.string(),
  repoTags: z.array(z.string()).optional(),
  repoDigests: z.array(z.string()).optional(),
  created: z.number(),
  size: z.number(),
  virtualSize: z.number().optional(),
  sharedSize: z.number().optional(),
  labels: z.record(z.string()).optional(),
  containers: z.number().optional(),
});

export type Image = z.infer<typeof imageSchema>;

// System stats schema
export const systemStatsSchema = z.object({
  cpu: z.object({
    usage: z.number(),
    count: z.number(),
  }),
  memory: z.object({
    total: z.number(),
    used: z.number(),
    free: z.number(),
    percent: z.number(),
  }),
  storage: z.object({
    total: z.number(),
    used: z.number(),
    free: z.number(),
    percent: z.number(),
  }),
  docker: z.object({
    total: z.number(),
    used: z.number(),
    percent: z.number(),
  }),
});

export type SystemStats = z.infer<typeof systemStatsSchema>;

// Auth schema
export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
