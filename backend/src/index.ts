import "dotenv/config";
import { Hono } from "hono";
import { logger } from "hono/logger";
import bridge from "./routes/bridge.ts";
import { serve } from "@hono/node-server";

const app = new Hono();

app.use(logger());
app.route("/api/bridge", bridge);

console.log(`Starting server on port ${3001}`);

serve({
  fetch: app.fetch,
  port: 3001,
});

console.log(`Server is running on http://localhost:${3001}`);
console.log("Press Ctrl+C to stop");
