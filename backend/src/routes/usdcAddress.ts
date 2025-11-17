import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { usdcAddressParamsSchema } from "../validation/usdcAddressParams";
import { services } from "../services";

const app = new Hono().get("/", zValidator("query", usdcAddressParamsSchema), async (context) => {
  const validatedParams = context.req.valid("query");
  try {
    const usdcAddress = services.usdcAddressService.getUsdcAddress(validatedParams.chainId);
    return context.json({ status: "success", data: usdcAddress }, 200);
  } catch (error) {
    return context.json({ status: "error", message: error instanceof Error ? error.message : "Unknown error", code: "UNKNOWN_ERROR" }, 500);
  }
});

export default app;
