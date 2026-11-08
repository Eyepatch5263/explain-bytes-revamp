import "dotenv/config";
import express from "express";
import { createServer } from "http";
import crossws from "crossws/adapters/node";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { authenticateAuth0IdToken, AuthenticationError } from "../collaborative/auth";
import { createCollaborationServer } from "../collaborative/hocuspocus";
import { createCollaborativeHttpRouter } from "../collaborative/http";
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
  const collaboration = createCollaborationServer();
  const websocketAdapter = crossws({
    hooks: {
      open(peer) {
        const connection = collaboration.handleConnection(
          peer.websocket as any,
          peer.request as unknown as Request,
        );
        (peer as any)._hocuspocus = connection;
        (peer.websocket as any).on?.("pong", () => connection.touch());
      },
      message(peer, message) {
        (peer as any)._hocuspocus?.handleMessage(message.uint8Array());
      },
      close(peer, event) {
        (peer as any)._hocuspocus?.handleClose({ code: event.code, reason: event.reason });
      },
      error(peer, error) {
        console.error("[Collaborative room] WebSocket error for peer", peer.id, error);
      },
    },
  });

  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`).pathname;
    if (pathname !== "/collab") {
      socket.destroy();
      return;
    }
    const origin = request.headers.origin;
    const allowedOrigins = (process.env.COLLABORATION_ALLOWED_ORIGINS ?? "")
      .split(",").map((value) => value.trim()).filter(Boolean);
    if (origin) {
      try {
        const originUrl = new URL(origin);
        const forwardedHost = request.headers["x-forwarded-host"];
        const requestHost = (typeof forwardedHost === "string" ? forwardedHost.split(",")[0].trim() : request.headers.host)?.toLowerCase();
        const sameHost = originUrl.host.toLowerCase() === requestHost;
        if (!sameHost && !allowedOrigins.includes(origin)) {
          socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
          socket.destroy();
          return;
        }
      } catch {
        socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
        socket.destroy();
        return;
      }
    }
    websocketAdapter.handleUpgrade(request, socket, head);
  });

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

  // Auth0 identity sync endpoint. Identity data is taken only from the verified token.
  app.post("/api/auth/sync-user", async (req, res) => {
    try {
      const match = /^Bearer\s+(.+)$/i.exec(req.header("authorization") ?? "");
      if (!match) return res.status(401).json({ error: "Sign in is required." });
      const user = await authenticateAuth0IdToken(match[1]);
      return res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl } });
    } catch (error) {
      const status = error instanceof AuthenticationError ? error.status : 401;
      const message = error instanceof AuthenticationError ? error.message : "The sign-in token could not be verified.";
      return res.status(status).json({ error: message });
    }
  });

  app.use("/api/collaborative", createCollaborativeHttpRouter(collaboration));

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
