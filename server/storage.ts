import { users, type User, type InsertUser, type Container, type ContainerStats, type Image, type SystemSpecs, type DockerResources } from "@shared/schema";
import { exec } from "child_process";
import { promisify } from "util";
import * as os from "os";
import * as fs from "fs";

const execAsync = promisify(exec);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listContainers(): Promise<Container[]>;
  getContainerStats(): Promise<ContainerStats>;
  startContainer(id: string): Promise<boolean>;
  stopContainer(id: string): Promise<boolean>;
  deleteContainer(id: string): Promise<boolean>;
  getContainerLogs(id: string, lines?: number): Promise<string>;
  listImages(): Promise<Image[]>;
  deleteImage(id: string): Promise<boolean>;
  getSystemSpecs(): Promise<SystemSpecs>;
  getDockerResources(): Promise<DockerResources>;
  startMultipleContainers(ids: string[]): Promise<boolean[]>;
  stopMultipleContainers(ids: string[]): Promise<boolean[]>;
  deleteMultipleContainers(ids: string[]): Promise<boolean[]>;
  deleteMultipleImages(ids: string[]): Promise<boolean[]>;
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

  async deleteContainer(id: string): Promise<boolean> {
    try {
      // Check if container is running
      const containers = await this.listContainers();
      const container = containers.find(c => c.id === id);
      
      // If running, stop it first
      if (container && container.state === "running") {
        await this.stopContainer(id);
      }
      
      // Delete the container
      await execAsync(`docker rm ${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting container ${id}:`, error);
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

  async listImages(): Promise<Image[]> {
    try {
      const { stdout } = await execAsync(
        'docker images --format "{{.ID}}|{{.Repository}}|{{.Tag}}|{{.Size}}|{{.CreatedAt}}"'
      );

      const images: Image[] = stdout
        .trim()
        .split("\n")
        .filter(line => line.trim() !== "")
        .map(line => {
          const [id, name, tag, size, created] = line.split("|");
          
          return {
            id,
            name,
            tag,
            size,
            created,
          };
        });

      return images;
    } catch (error) {
      console.error("Error listing Docker images:", error);
      return [];
    }
  }

  async deleteImage(id: string): Promise<boolean> {
    try {
      await execAsync(`docker rmi -f ${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting image ${id}:`, error);
      return false;
    }
  }

  async getSystemSpecs(): Promise<SystemSpecs> {
    try {
      // Get CPU information
      const { stdout: cpuInfo } = await execAsync("cat /proc/cpuinfo");
      const cpuModel = cpuInfo.match(/model name\s*:\s*(.*)/)?.[1] || "Unknown CPU";
      const cpuCores = os.cpus().length;

      // Get memory information
      const totalMemory = Math.round(os.totalmem() / (1024 * 1024)); // Convert to MB
      const freeMemory = Math.round(os.freemem() / (1024 * 1024)); // Convert to MB
      const availableMemory = freeMemory;
      const memoryUsage = Math.round(((totalMemory - freeMemory) / totalMemory) * 100);

      // Get disk information
      const { stdout: dfOutput } = await execAsync("df -h / | tail -n 1");
      const dfParts = dfOutput.trim().split(/\s+/);
      
      // Parse disk information - typical format is: Filesystem Size Used Avail Use% Mounted on
      const diskTotal = parseFloat(dfParts[1].replace('G', '')) || 0;
      const diskUsed = parseFloat(dfParts[2].replace('G', '')) || 0;
      const diskFree = parseFloat(dfParts[3].replace('G', '')) || 0;

      // Get OS information
      const { stdout: osRelease } = await execAsync("cat /etc/os-release");
      const prettyName = osRelease.match(/PRETTY_NAME="(.*)"/)?.[1] || "Unknown OS";
      
      // Get kernel version
      const { stdout: kernelVersion } = await execAsync("uname -r");
      
      // Get architecture
      const architecture = os.arch();

      return {
        cpuCores,
        cpuModel,
        totalMemory,
        availableMemory,
        memoryUsage,
        diskTotal,
        diskUsed,
        diskFree,
        operatingSystem: prettyName,
        kernelVersion: kernelVersion.trim(),
        architecture,
      };
    } catch (error) {
      console.error("Error getting system specifications:", error);
      // Return fallback values from OS module if command line utilities fail
      return {
        cpuCores: os.cpus().length,
        cpuModel: os.cpus()[0]?.model || "Unknown CPU",
        totalMemory: Math.round(os.totalmem() / (1024 * 1024)),
        availableMemory: Math.round(os.freemem() / (1024 * 1024)),
        memoryUsage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
        diskTotal: 0,
        diskUsed: 0,
        diskFree: 0,
        operatingSystem: os.type() + " " + os.release(),
        kernelVersion: os.release(),
        architecture: os.arch(),
      };
    }
  }

  async getDockerResources(): Promise<DockerResources> {
    try {
      // Get Docker-specific resource consumption stats
      
      // Get Docker CPU and memory usage
      const { stdout: dockerStats } = await execAsync(
        "docker stats --no-stream --format '{{.CPUPerc}}|{{.MemUsage}}|{{.NetIO}}'"
      );
      
      // Parse stats
      let totalCpuUsage = 0;
      let totalMemoryUsage = 0;
      let totalNetworkRx = 0;
      let totalNetworkTx = 0;
      
      dockerStats.trim().split("\n").forEach(line => {
        if (!line.trim()) return;
        
        const [cpuPerc, memUsage, netIO] = line.split("|");
        
        // Parse CPU percentage (format: 0.00%)
        totalCpuUsage += parseFloat(cpuPerc.replace('%', '')) || 0;
        
        // Parse memory usage (format: 100MiB / 16GiB)
        const memParts = memUsage.split('/');
        if (memParts.length >= 1) {
          const usageStr = memParts[0].trim();
          let value = parseFloat(usageStr.replace(/[^0-9.]/g, '')) || 0;
          
          // Convert to MB if needed
          if (usageStr.includes('GiB') || usageStr.includes('GB')) {
            value *= 1024;
          } else if (usageStr.includes('KiB') || usageStr.includes('KB')) {
            value /= 1024;
          }
          
          totalMemoryUsage += value;
        }
        
        // Parse network I/O (format: 100MB / 200MB)
        const netParts = netIO.split('/');
        if (netParts.length >= 2) {
          const rxStr = netParts[0].trim();
          const txStr = netParts[1].trim();
          
          let rxValue = parseFloat(rxStr.replace(/[^0-9.]/g, '')) || 0;
          let txValue = parseFloat(txStr.replace(/[^0-9.]/g, '')) || 0;
          
          // Convert to KB
          if (rxStr.includes('MB')) {
            rxValue *= 1024;
          } else if (rxStr.includes('GB')) {
            rxValue *= 1024 * 1024;
          }
          
          if (txStr.includes('MB')) {
            txValue *= 1024;
          } else if (txStr.includes('GB')) {
            txValue *= 1024 * 1024;
          }
          
          totalNetworkRx += rxValue;
          totalNetworkTx += txValue;
        }
      });
      
      // Get Docker disk usage
      const { stdout: dockerDiskUsage } = await execAsync("docker system df --format '{{.Size}}'");
      let totalDiskUsage = 0;
      
      dockerDiskUsage.trim().split("\n").forEach(line => {
        if (!line.trim()) return;
        
        // Parse disk usage (format: 100MB)
        let value = parseFloat(line.replace(/[^0-9.]/g, '')) || 0;
        
        // Convert to GB
        if (line.includes('MB')) {
          value /= 1024;
        } else if (line.includes('KB')) {
          value /= (1024 * 1024);
        } else if (line.includes('TB')) {
          value *= 1024;
        }
        
        totalDiskUsage += value;
      });
      
      // Calculate memory percentage
      const totalSystemMemory = os.totalmem() / (1024 * 1024); // in MB
      const memoryPercentage = Math.round((totalMemoryUsage / totalSystemMemory) * 100);
      
      return {
        cpuUsage: Math.round(totalCpuUsage * 10) / 10, // Round to 1 decimal place
        memoryUsage: Math.round(totalMemoryUsage),
        memoryPercentage,
        diskUsage: Math.round(totalDiskUsage * 100) / 100, // Round to 2 decimal places
        networkRx: Math.round(totalNetworkRx),
        networkTx: Math.round(totalNetworkTx),
      };
    } catch (error) {
      console.error("Error getting Docker resource usage:", error);
      return {
        cpuUsage: 0,
        memoryUsage: 0,
        memoryPercentage: 0,
        diskUsage: 0,
        networkRx: 0,
        networkTx: 0,
      };
    }
  }

  async startMultipleContainers(ids: string[]): Promise<boolean[]> {
    const results: boolean[] = [];
    
    for (const id of ids) {
      const result = await this.startContainer(id);
      results.push(result);
    }
    
    return results;
  }

  async stopMultipleContainers(ids: string[]): Promise<boolean[]> {
    const results: boolean[] = [];
    
    for (const id of ids) {
      const result = await this.stopContainer(id);
      results.push(result);
    }
    
    return results;
  }

  async deleteMultipleContainers(ids: string[]): Promise<boolean[]> {
    const results: boolean[] = [];
    
    for (const id of ids) {
      const result = await this.deleteContainer(id);
      results.push(result);
    }
    
    return results;
  }

  async deleteMultipleImages(ids: string[]): Promise<boolean[]> {
    const results: boolean[] = [];
    
    for (const id of ids) {
      const result = await this.deleteImage(id);
      results.push(result);
    }
    
    return results;
  }
}

export const storage = new MemStorage();
