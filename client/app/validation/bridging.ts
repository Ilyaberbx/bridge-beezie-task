import { z } from "zod";

const bridgingSchema = z.object({
  usdcAmount: z.number().positive("USDC amount must be a positive number"),
});

const createBridgingSchema = (maxAmount: number) =>
  bridgingSchema.extend({
    usdcAmount: z
      .number()
      .positive("USDC amount must be a positive number")
      .max(maxAmount, "USDC amount must be less than the source wallet balance"),
  });

export { createBridgingSchema };
