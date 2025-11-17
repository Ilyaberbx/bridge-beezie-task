import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { bridgeRequestSchema } from "../validation/bridgeRequest";
import { BridgeController } from "../controllers/bridge.controller";

const app = new Hono();
const bridgeController = new BridgeController();

app.post("/", zValidator("json", bridgeRequestSchema), async (context) => {
  try {
    const validatedRequestBody = context.req.valid("json");
    const result = await bridgeController.executeBridge(validatedRequestBody);

    if (result.status === "error") {
      return context.json(result, 400);
    }

    return context.json(result, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return context.json(
        {
          status: "error",
          message: error.issues.map((e) => e.message).join(", "),
          code: "INVALID_REQUEST",
        },
        400
      );
    }

    return context.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        code: "UNKNOWN_ERROR",
      },
      500
    );
  }
});

export default app;
