import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

console.log("Starting server initialization...");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

console.log("Middleware setup complete");

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

console.log("Request logging middleware setup complete");

// Add a simple health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

console.log("Health check route added");

(async () => {
  try {
    console.log("Starting to register routes...");
    const server = await registerRoutes(app);
    console.log("Routes registered successfully");

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Error middleware triggered:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    console.log("Error middleware setup complete");

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      console.log("Setting up Vite in development mode...");
      await setupVite(app, server);
      console.log("Vite setup complete");
    } else {
      console.log("Setting up static file serving...");
      serveStatic(app);
      console.log("Static file serving setup complete");
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    const port = 5000;
    console.log(`Attempting to listen on port ${port}...`);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Server successfully listening on port ${port}`);
    });

    // Add error handler for server
    server.on('error', (error) => {
      console.error('Server error:', error);
    });
  } catch (error) {
    console.error("Fatal error during server startup:", error);
  }
})();
