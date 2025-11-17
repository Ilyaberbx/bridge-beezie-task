import { Hono } from "hono";
import { services } from "../services";
import { logsParamsSchema } from "../validation/logsParams";
import { ZodError } from "zod";

const app = new Hono();

app.get("/", async (context) => {
  try {
    const validatedParams = logsParamsSchema.parse(context.req.query());
    const logs = await services.bridgingLogsService.getByUserAddresses(
      validatedParams.sourceUserAddress,
      validatedParams.destinationUserAddress,
      validatedParams.limit,
      validatedParams.offset
    );
    return context.json({ status: "success", data: logs }, 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return context.json({ status: "error", message: error.issues.map((e) => e.message).join(", "), code: "INVALID_PARAMS" }, 400);
    }
    return context.json({ status: "error", message: error.message }, 500);
  }
});

export default app;
