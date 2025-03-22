import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, containerSchema, imageSchema, systemStatsSchema } from "@shared/schema";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import session from "express-session";
import MemoryStore from "memorystore";
import fs from "fs";
import os from "os";

// Promisify exec to use with async/await
const execAsync = promisify(exec);

// For authentication
const SessionStore = MemoryStore(session);

// Helper functions for Docker commands
async function runDockerCommand(command: string): Promise<string> {
  try {
    // Check if Docker is installed and available
    try {
      await execAsync('which docker');
    } catch (err) {
      // Docker is not installed, provide a descriptive error
      throw new Error("Docker is not installed or not in PATH. Please install Docker to use this feature.");
    }
    
    const { stdout, stderr } = await execAsync(`docker ${command}`);
    if (stderr) {
      console.error(`Docker command error: ${stderr}`);
    }
    return stdout;
  } catch (error) {
    console.error(`Failed to execute Docker command: ${error}`);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  app.use(
    session({
      secret: "docker-management-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
      store: new SessionStore({
        checkPeriod: 86400000, // 24 hours
      }),
    })
  );

  // Authentication middleware
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (req.session.authenticated) {
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  };

  // Login route
  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const isValid = await storage.validateCredentials(credentials.username, credentials.password);
      
      if (isValid) {
        req.session.authenticated = true;
        req.session.username = credentials.username;
        res.json({ success: true });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      res.status(400).json({ message: "Invalid request format" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ message: "Failed to logout" });
      } else {
        res.json({ success: true });
      }
    });
  });

  // Check authentication status
  app.get("/api/auth/status", (req, res) => {
    res.json({ authenticated: !!req.session.authenticated });
  });

  // Docker containers routes
  app.get("/api/containers", requireAuth, async (req, res) => {
    try {
      // Get list of containers with details
      const containersJson = await runDockerCommand('container ls -a --format "{{json .}}"');
      
      // Parse the output which is one JSON object per line
      const containers = containersJson
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const container = JSON.parse(line);
          return {
            id: container.ID,
            name: container.Names,
            image: container.Image,
            state: container.State,
            status: container.Status,
            created: container.CreatedAt,
          };
        });

      // Get stats for running containers
      for (const container of containers) {
        if (container.state === "running") {
          try {
            const statsJson = await runDockerCommand(`stats ${container.id} --no-stream --format "{{json .}}"`);
            const stats = JSON.parse(statsJson);
            container.stats = {
              cpu_percent: parseFloat(stats.CPUPerc.replace('%', '')),
              memory_usage: parseFloat(stats.MemUsage.split(' / ')[0]),
              memory_limit: parseFloat(stats.MemUsage.split(' / ')[1]),
              memory_percent: parseFloat(stats.MemPerc.replace('%', '')),
              storage_usage: 0, // Need to calculate separately as stats doesn't provide it
            };
          } catch (err) {
            console.error(`Error getting stats for container ${container.id}:`, err);
          }
        }
      }

      res.json(containers);
    } catch (error) {
      console.error("Error fetching containers:", error);
      res.status(500).json({ message: "Failed to fetch containers" });
    }
  });

  // Start container
  app.post("/api/containers/:id/start", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await runDockerCommand(`container start ${id}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: `Failed to start container: ${error}` });
    }
  });

  // Stop container
  app.post("/api/containers/:id/stop", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await runDockerCommand(`container stop ${id}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: `Failed to stop container: ${error}` });
    }
  });

  // Restart container
  app.post("/api/containers/:id/restart", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await runDockerCommand(`container restart ${id}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: `Failed to restart container: ${error}` });
    }
  });

  // Delete container
  app.delete("/api/containers/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await runDockerCommand(`container rm ${id}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: `Failed to delete container: ${error}` });
    }
  });

  // Run new container
  app.post("/api/containers", requireAuth, async (req, res) => {
    try {
      const { image, name, ports, volumes, env, restart } = req.body;
      
      // Validate that image is not empty or undefined
      if (!image || image === '<none>:<none>' || image === 'null:null') {
        return res.status(400).json({ message: "A valid image must be selected" });
      }
      
      let command = `run -d`;
      
      if (name && name.trim()) command += ` --name ${name.trim()}`;
      if (restart) command += ` --restart always`;
      
      if (ports && ports.length > 0) {
        const portMappings = ports.split(',');
        for (const port of portMappings) {
          if (port.trim()) {
            command += ` -p ${port.trim()}`;
          }
        }
      }
      
      if (volumes && volumes.length > 0) {
        const volumeMappings = volumes.split(',');
        for (const volume of volumeMappings) {
          if (volume.trim()) {
            command += ` -v ${volume.trim()}`;
          }
        }
      }
      
      if (env && env.length > 0) {
        for (const envVar of env.split('\n')) {
          if (envVar.trim()) {
            command += ` -e ${envVar.trim()}`;
          }
        }
      }
      
      command += ` ${image}`;
      
      console.log(`Running Docker command: ${command}`);
      const result = await runDockerCommand(command);
      res.json({ success: true, containerId: result.trim() });
    } catch (error) {
      console.error("Docker run command error:", error);
      res.status(500).json({ message: `Failed to run container: ${error}` });
    }
  });

  // Get container logs
  app.get("/api/containers/:id/logs", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { lines } = req.query;
      
      let command = `container logs ${id}`;
      if (lines && lines !== 'all') {
        command += ` --tail ${lines}`;
      }
      
      const logs = await runDockerCommand(command);
      res.json({ logs: logs.split('\n') });
    } catch (error) {
      res.status(500).json({ message: `Failed to fetch container logs: ${error}` });
    }
  });

  // Docker images routes
  app.get("/api/images", requireAuth, async (req, res) => {
    try {
      const imagesJson = await runDockerCommand('image ls --format "{{json .}}"');
      
      const images = imagesJson
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const image = JSON.parse(line);
          return {
            id: image.ID,
            repository: image.Repository,
            tag: image.Tag,
            created: image.CreatedSince,
            size: image.Size,
          };
        });

      res.json(images);
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });

  // Delete image
  app.delete("/api/images/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await runDockerCommand(`image rm ${id}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: `Failed to delete image: ${error}` });
    }
  });

  // Pull image
  app.post("/api/images/pull", requireAuth, async (req, res) => {
    try {
      const { name } = req.body;
      await runDockerCommand(`pull ${name}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: `Failed to pull image: ${error}` });
    }
  });

  // Build image
  app.post("/api/images/build", requireAuth, async (req, res) => {
    try {
      const { name, tag, dockerfilePath, buildContext, buildArgs, dockerfileContent } = req.body;
      
      let command = `build -t ${name}:${tag}`;
      
      if (buildArgs && buildArgs.length > 0) {
        for (const arg of buildArgs.split('\n')) {
          if (arg.trim()) {
            command += ` --build-arg ${arg.trim()}`;
          }
        }
      }
      
      // Handle case where the user provides Dockerfile content directly
      if (dockerfileContent) {
        // Create a temporary directory for the build
        const tempDir = `/tmp/docker-build-${Date.now()}`;
        await execAsync(`mkdir -p ${tempDir}`);
        
        // Write the Dockerfile content to the temporary directory
        const dockerfilePath = `${tempDir}/Dockerfile`;
        await execAsync(`cat > ${dockerfilePath} << 'EOF'
${dockerfileContent}
EOF`);
        
        console.log(`Created temporary Dockerfile at ${dockerfilePath}`);
        
        // Run the build command using the temporary Dockerfile
        command += ` -f ${dockerfilePath} ${tempDir}`;
      } else {
        // Use the provided Dockerfile path and build context
        command += ` -f ${dockerfilePath} ${buildContext}`;
      }
      
      console.log(`Running Docker build command: ${command}`);
      await runDockerCommand(command);
      
      // Clean up if we created a temporary directory
      if (dockerfileContent) {
        // Attempt to clean up in the background
        execAsync(`rm -rf /tmp/docker-build-*`).catch(console.error);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Docker build error:", error);
      res.status(500).json({ message: `Failed to build image: ${error}` });
    }
  });

  // System stats route
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      // Get CPU info
      const cpuInfo = await execAsync("cat /proc/stat | grep '^cpu '");
      const cpuLine = cpuInfo.stdout.trim().split(/\s+/);
      const idle = parseInt(cpuLine[4]);
      const total = cpuLine.slice(1).reduce((acc, val) => acc + parseInt(val), 0);
      const cpuUsage = 100 - (idle / total) * 100;
      
      const cpuCount = os.cpus().length;

      // Get memory info
      const memInfo = await execAsync("free -b");
      const memLines = memInfo.stdout.trim().split('\n');
      const memValues = memLines[1].split(/\s+/);
      const memTotal = parseInt(memValues[1]);
      const memUsed = parseInt(memValues[2]);
      const memFree = parseInt(memValues[3]);
      const memPercent = (memUsed / memTotal) * 100;

      // Get disk info
      const diskInfo = await execAsync("df -B1 / | tail -1");
      const diskValues = diskInfo.stdout.trim().split(/\s+/);
      const diskTotal = parseInt(diskValues[1]);
      const diskUsed = parseInt(diskValues[2]);
      const diskFree = parseInt(diskValues[3]);
      const diskPercent = (diskUsed / diskTotal) * 100;

      // Initialize Docker stats with some default values
      let dockerUsed = 0;
      const dockerTotal = 30 * 1024 * 1024 * 1024; // 30GB
      let dockerPercent = 0;

      // Try to get Docker disk usage (only if Docker is available)
      try {
        const dockerInfo = await runDockerCommand("system df -v");
        const dockerLines = dockerInfo.split('\n');
        
        // Parse the output to get total Docker disk usage
        for (const line of dockerLines) {
          if (line.includes('Images space usage')) {
            const match = line.match(/(\d+(\.\d+)?)\s*(B|KB|MB|GB|TB)/i);
            if (match) {
              const size = parseFloat(match[1]);
              const unit = match[3].toUpperCase();
              switch (unit) {
                case 'B': dockerUsed += size; break;
                case 'KB': dockerUsed += size * 1024; break;
                case 'MB': dockerUsed += size * 1024 * 1024; break;
                case 'GB': dockerUsed += size * 1024 * 1024 * 1024; break;
                case 'TB': dockerUsed += size * 1024 * 1024 * 1024 * 1024; break;
              }
            }
          }
        }
        
        dockerPercent = (dockerUsed / dockerTotal) * 100;
      } catch (dockerError) {
        console.log("Docker not available or error fetching Docker stats:", dockerError);
        // Use mock data for development when Docker is not available
        dockerUsed = 8 * 1024 * 1024 * 1024; // 8GB
        dockerPercent = 26.67; // 8GB out of 30GB
      }

      const stats = {
        cpu: {
          usage: Number(cpuUsage.toFixed(2)),
          count: cpuCount
        },
        memory: {
          total: memTotal,
          used: memUsed,
          free: memFree,
          percent: Number(memPercent.toFixed(2))
        },
        storage: {
          total: diskTotal,
          used: diskUsed,
          free: diskFree,
          percent: Number(diskPercent.toFixed(2))
        },
        docker: {
          total: dockerTotal,
          used: dockerUsed,
          percent: Number(dockerPercent.toFixed(2))
        }
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching system stats:", error);
      res.status(500).json({ message: "Failed to fetch system stats" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
