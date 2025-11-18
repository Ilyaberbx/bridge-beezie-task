import "dotenv/config";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import bridge from "./routes/bridge";
import logs from "./routes/logs";
import { serve } from "@hono/node-server";
import usdcAddress from "./routes/usdcAddress";
import { rateLimiter } from "hono-rate-limiter";

const app = new Hono();

app.use(logger());
app.use(
  rateLimiter({
    windowMs: 60000,
    limit: 100,
    standardHeaders: "draft-6",
    keyGenerator: (c) => c.req.header("cf-connecting-ip") ?? "",
  })
);
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

const routes = app.route("api/bridge", bridge).route("api/logs", logs).route("api/usdcAddress", usdcAddress);

console.log(`Starting server on port ${3001}`);

serve({
  fetch: app.fetch,
  port: 3001,
});

console.log(`Server is running on http://localhost:${3001}`);
console.log("Press Ctrl+C to stop");

export type AppType = typeof routes;
