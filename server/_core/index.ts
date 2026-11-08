import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { upsertAuth0User } from "../db";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable trusting proxy headers (for ngrok, reverse proxies, etc.)
  app.set("trust proxy", true);

  // Normalize multi-hop proxy headers (e.g. from ngrok, cloudflare, load balancers)
  app.use((req, _res, next) => {
    const rawProto = req.headers["x-forwarded-proto"];
    if (typeof rawProto === "string") {
      req.headers["x-forwarded-proto"] = rawProto.split(",")[0].trim();
    } else if (Array.isArray(rawProto) && rawProto.length > 0) {
      req.headers["x-forwarded-proto"] = rawProto[0].split(",")[0].trim();
    }

    const rawHost = req.headers["x-forwarded-host"];
    if (typeof rawHost === "string") {
      const sanitizedHost = rawHost.split(",")[0].trim();
      req.headers["x-forwarded-host"] = sanitizedHost;
      if (!req.headers.host || req.headers.host.includes("localhost") || req.headers.host.includes("127.0.0.1")) {
        req.headers.host = sanitizedHost;
      }
    } else if (Array.isArray(rawHost) && rawHost.length > 0) {
      const sanitizedHost = rawHost[0].split(",")[0].trim();
      req.headers["x-forwarded-host"] = sanitizedHost;
      if (!req.headers.host || req.headers.host.includes("localhost") || req.headers.host.includes("127.0.0.1")) {
        req.headers.host = sanitizedHost;
      }
    }

    if (req.headers.host && typeof req.headers.host === "string" && req.headers.host.includes(",")) {
      req.headers.host = req.headers.host.split(",")[0].trim();
    }

    next();
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Auth0 credential sync endpoint (saves user profile & credentials to PostgreSQL)
  app.post("/api/auth/sync-user", async (req, res) => {
    try {
      const { email, name, avatarUrl, oauthProvider, emailVerified } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const user = await upsertAuth0User({
        email,
        name,
        avatarUrl,
        oauthProvider,
        emailVerified,
      });
      return res.json({ success: true, user });
    } catch (err: any) {
      console.error("[Auth0 Sync] Error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
