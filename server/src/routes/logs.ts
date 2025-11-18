import { Hono } from "hono";
import { services } from "../services";
import { logsParamsSchema } from "../validation/logsParams";
import { zValidator } from "@hono/zod-validator";
import { ZodError } from "zod";

const app = new Hono().get("/", zValidator("query", logsParamsSchema), async (context) => {
  try {
    const validatedParams = context.req.valid("query");
    const logs = await services.bridgingLogsService.getByUserAddresses(
      validatedParams.sourceUserAddress,
      validatedParams.destinationUserAddress,
      validatedParams.limit,
      validatedParams.offset
    );
    return context.json({ status: "success", data: logs }, 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return context.json({ status: "error", message: error.issues.map((e) => e.message).join(", ") }, 400);
    }
    return context.json({ status: "error", message: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

export default app;
