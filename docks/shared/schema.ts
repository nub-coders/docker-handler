import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

// Container schema
export const containerSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string(),
  status: z.string(),
  state: z.enum(["running", "stopped", "exited", "paused", "created"]),
  ports: z.array(z.string()).optional(),
  created: z.string(),
});

export type Container = z.infer<typeof containerSchema>;

// Container stats schema
export const containerStatsSchema = z.object({
  total: z.number(),
  running: z.number(),
  stopped: z.number(),
});

export type ContainerStats = z.infer<typeof containerStatsSchema>;

// Auth schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
