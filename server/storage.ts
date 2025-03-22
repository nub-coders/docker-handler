import { users, type User, type InsertUser, type Container, type ContainerStats } from "@shared/schema";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listContainers(): Promise<Container[]>;
  getContainerStats(): Promise<ContainerStats>;
  startContainer(id: string): Promise<boolean>;
  stopContainer(id: string): Promise<boolean>;
  getContainerLogs(id: string, lines?: number): Promise<string>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    
    // Initialize with default user
    const defaultUser: InsertUser = {
      username: "nub-coders",
      password: "Dev", // In a real app, this would be hashed
    };
    
    this.createUser(defaultUser);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async listContainers(): Promise<Container[]> {
    try {
      const { stdout } = await execAsync(
        'docker ps -a --format "{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}|{{.CreatedAt}}"'
      );

      const containers: Container[] = stdout
        .trim()
        .split("\n")
        .filter(line => line.trim() !== "")
        .map(line => {
          const [id, name, image, status, ports, created] = line.split("|");
          
          // Determine state from status string
          let state: "running" | "stopped" | "exited" | "paused" | "created" = "stopped";
          if (status.includes("Up")) {
            state = "running";
          } else if (status.includes("Exited")) {
            state = "exited";
          } else if (status.includes("Paused")) {
            state = "paused";
          } else if (status.includes("Created")) {
            state = "created";
          }
          
          // Parse ports properly
          const formattedPorts = ports ? ports.split(", ").filter(p => p) : [];
          
          return {
            id,
            name,
            image,
            status,
            state,
            ports: formattedPorts,
            created,
          };
        });

      return containers;
    } catch (error) {
      console.error("Error listing Docker containers:", error);
      return [];
    }
  }

  async getContainerStats(): Promise<ContainerStats> {
    try {
      const containers = await this.listContainers();
      const running = containers.filter(c => c.state === "running").length;
      
      return {
        total: containers.length,
        running,
        stopped: containers.length - running,
      };
    } catch (error) {
      console.error("Error getting container stats:", error);
      return { total: 0, running: 0, stopped: 0 };
    }
  }

  async startContainer(id: string): Promise<boolean> {
    try {
      await execAsync(`docker start ${id}`);
      return true;
    } catch (error) {
      console.error(`Error starting container ${id}:`, error);
      return false;
    }
  }

  async stopContainer(id: string): Promise<boolean> {
    try {
      await execAsync(`docker stop ${id}`);
      return true;
    } catch (error) {
      console.error(`Error stopping container ${id}:`, error);
      return false;
    }
  }

  async getContainerLogs(id: string, lines: number = 100): Promise<string> {
    try {
      const { stdout } = await execAsync(`docker logs --tail ${lines} ${id}`);
      return stdout;
    } catch (error) {
      console.error(`Error getting logs for container ${id}:`, error);
      return `Error retrieving logs for container ${id}`;
    }
  }
}

export const storage = new MemStorage();
