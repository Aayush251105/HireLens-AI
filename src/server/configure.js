import 'dotenv/config';
import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const viteServerBefore = (server, viteServer) => {
  console.log("Starting HireLens AI Dev Server...");
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));
};

export const viteServerAfter = (server, viteServer) => {
  const errorHandler = (err, req, res, next) => {
    if (err instanceof Error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    } else {
      next(err);
    }
  };
  server.use(errorHandler);
};

// ServerHook
export const serverBefore = (server) => {
  const shutdown = async (signal) => {
    console.log(`Got ${signal}, shutting down gracefully...`);

    try {
      // Gracefully close database connection on shutdown
      const dbClient = "./db/client" + ".js";
      const { closeConnection } = await import(dbClient);
      await closeConnection();
      console.log("Database connections closed");
    } catch (error) {
      if (error.code !== 'ERR_MODULE_NOT_FOUND') {
        console.error("Error during database shutdown:", error.message);
      }
    }

    process.exit(0);
  };

  ["SIGTERM", "SIGINT"].forEach((signal) => {
    process.once(signal, shutdown);
  });

  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));

  server.use(express.static(join(__dirname, "client"), {
    setHeaders(res, filePath) {
      // Cache-Control headers for production builds
      res.set("Cache-Control", filePath.includes("/assets/")
        ? "public, max-age=31536000, immutable"
        : "no-cache");
    }
  }));

  server.use((req, res, next) => {
    res.set("Cache-Control", "no-cache");
    next();
  });
};

export const serverAfter = (server) => {
  // Add SPA fallback for client-side routing
  // This middleware serves index.html for any GET request that doesn't match
  // an API endpoint or static file, enabling React Router to handle the route
  server.use((req, res, next) => {
    // Only handle GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if this is an API request
    if (req.path.startsWith('/api')) {
      return next();
    }

    // Skip if this is a static asset request (has file extension)
    if (extname(req.path)) {
      return next();
    }

    // For all other GET requests, serve index.html to support client-side routing
    res.sendFile(join(__dirname, 'client', 'index.html'));
  });

  const errorHandler = (err, req, res, next) => {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      next(err);
    }
  };
  server.use(errorHandler);
};
