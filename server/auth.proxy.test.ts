import { describe, expect, it } from "vitest";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";

describe("Better Auth Proxy Handling", () => {
  it("sanitizes multi-hop x-forwarded-proto headers without crashing URL parsing", async () => {
    // When requests come through ngrok or multi-hop proxies,
    // x-forwarded-proto is often "https, https"
    const socket = new Socket();
    const req = new IncomingMessage(socket);
    req.method = "GET";
    req.url = "/api/auth/get-session";
    req.headers = {
      "x-forwarded-proto": "https, https",
      "x-forwarded-host": "77c1-152-56-70-64.ngrok-free.app",
      host: "77c1-152-56-70-64.ngrok-free.app",
    };

    // Sanitize proxy headers as done in our middleware
    const proto = req.headers["x-forwarded-proto"];
    if (typeof proto === "string" && proto.includes(",")) {
      req.headers["x-forwarded-proto"] = proto.split(",")[0].trim();
    }

    const host = req.headers["x-forwarded-host"];
    if (typeof host === "string" && host.includes(",")) {
      req.headers["x-forwarded-host"] = host.split(",")[0].trim();
    }

    expect(req.headers["x-forwarded-proto"]).toBe("https");
    expect(req.headers["x-forwarded-host"]).toBe("77c1-152-56-70-64.ngrok-free.app");

    // Verify toNodeHandler accepts the sanitized request without throwing TypeError
    const authHandler = toNodeHandler(auth);
    const res = new ServerResponse(req);

    // Should complete cleanly without throwing TypeError: Failed to parse URL
    await expect(authHandler(req, res)).resolves.not.toThrow();
  });
});
