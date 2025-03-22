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

// Docker image schema
export const imageSchema = z.object({
  id: z.string(),
  name: z.string(),
  tag: z.string(),
  size: z.string(),
  created: z.string(),
});

export type Image = z.infer<typeof imageSchema>;

// System specifications schema
export const systemSpecsSchema = z.object({
  cpuCores: z.number(),
  cpuModel: z.string(),
  totalMemory: z.number(), // In MB
  availableMemory: z.number(), // In MB
  memoryUsage: z.number(), // Percentage
  diskTotal: z.number(), // In GB
  diskUsed: z.number(), // In GB
  diskFree: z.number(), // In GB
  operatingSystem: z.string(),
  kernelVersion: z.string(),
  architecture: z.string(),
});

export type SystemSpecs = z.infer<typeof systemSpecsSchema>;

// Docker resource usage schema
export const dockerResourcesSchema = z.object({
  cpuUsage: z.number(), // Percentage of total CPU used by Docker
  memoryUsage: z.number(), // MB used by Docker
  memoryPercentage: z.number(), // Percentage of total memory used by Docker
  diskUsage: z.number(), // GB used by Docker volumes and images
  networkRx: z.number(), // KB/s received
  networkTx: z.number(), // KB/s transmitted
});

export type DockerResources = z.infer<typeof dockerResourcesSchema>;

// Auth schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
