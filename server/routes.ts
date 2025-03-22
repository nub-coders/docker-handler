import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import { loginSchema } from "@shared/schema";
import MemoryStore from "memorystore";

// Extend the session interface to include user property
declare module "express-session" {
  interface SessionData {
    user?: {
      id: number;
      username: string;
    };
  }
}

const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  app.use(
    session({
      cookie: { maxAge: 86400000 }, // 24 hours
      store: new SessionStore({
        checkPeriod: 86400000, // 24 hours
      }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || "docker-manager-secret",
    })
  );

  // Authentication route
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const result = loginSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid credentials format" });
      }
      
      const { username, password } = result.data;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Save user info to session (excluding password)
      const { password: _, ...userData } = user;
      req.session.user = userData;
      
      return res.status(200).json({ message: "Login successful", user: userData });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Auth check route
  app.get("/api/auth/check", (req: Request, res: Response) => {
    if (req.session.user) {
      return res.status(200).json({ isAuthenticated: true, user: req.session.user });
    }
    return res.status(200).json({ isAuthenticated: false });
  });

  // Logout route
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Auth middleware for API routes
  const authenticate = (req: Request, res: Response, next: Function) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Docker container routes
  app.get("/api/containers", authenticate, async (req: Request, res: Response) => {
    try {
      const containers = await storage.listContainers();
      res.status(200).json(containers);
    } catch (error) {
      console.error("Error fetching containers:", error);
      res.status(500).json({ message: "Error fetching containers" });
    }
  });

  // Docker container stats
  app.get("/api/containers/stats", authenticate, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getContainerStats();
      res.status(200).json(stats);
    } catch (error) {
      console.error("Error fetching container stats:", error);
      res.status(500).json({ message: "Error fetching container stats" });
    }
  });

  // Start container
  app.post("/api/containers/:id/start", authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.startContainer(id);
      
      if (success) {
        res.status(200).json({ message: "Container started successfully" });
      } else {
        res.status(500).json({ message: "Failed to start container" });
      }
    } catch (error) {
      console.error(`Error starting container:`, error);
      res.status(500).json({ message: "Error starting container" });
    }
  });

  // Stop container
  app.post("/api/containers/:id/stop", authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.stopContainer(id);
      
      if (success) {
        res.status(200).json({ message: "Container stopped successfully" });
      } else {
        res.status(500).json({ message: "Failed to stop container" });
      }
    } catch (error) {
      console.error(`Error stopping container:`, error);
      res.status(500).json({ message: "Error stopping container" });
    }
  });

  // Get container logs
  app.get("/api/containers/:id/logs", authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const lines = req.query.lines ? parseInt(req.query.lines as string) : 100;
      
      const logs = await storage.getContainerLogs(id, lines);
      res.status(200).json({ logs });
    } catch (error) {
      console.error(`Error getting container logs:`, error);
      res.status(500).json({ message: "Error getting container logs" });
    }
  });

  // Delete container
  app.delete("/api/containers/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteContainer(id);
      
      if (success) {
        res.status(200).json({ message: "Container deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete container" });
      }
    } catch (error) {
      console.error(`Error deleting container:`, error);
      res.status(500).json({ message: "Error deleting container" });
    }
  });

  // Docker image routes
  app.get("/api/images", authenticate, async (req: Request, res: Response) => {
    try {
      const images = await storage.listImages();
      res.status(200).json(images);
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).json({ message: "Error fetching images" });
    }
  });

  // Delete image
  app.delete("/api/images/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteImage(id);
      
      if (success) {
        res.status(200).json({ message: "Image deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete image" });
      }
    } catch (error) {
      console.error(`Error deleting image:`, error);
      res.status(500).json({ message: "Error deleting image" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
