import { Hono } from "hono";
import { z } from "zod";
import { bridgeRequestSchema } from "../validation/bridgeRequest";
import { BridgeController } from "../controllers/bridge.controller";

const app = new Hono();
const bridgeController = new BridgeController();

app.post("/", async (context) => {
  try {
    const body = await context.req.json();
    const validateRequestBody = bridgeRequestSchema.parse(body);
    const result = await bridgeController.executeBridge(validateRequestBody);

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
        },
        400
      );
    }

    return context.json(
      {
        status: "error",
        message: error.message,
      },
      500
    );
  }
});

export default app;
