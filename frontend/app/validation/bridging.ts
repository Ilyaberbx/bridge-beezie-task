import { z } from "zod";

const bridgingSchema = z.object({
  usdcAmount: z.number().positive("USDC amount must be a positive number"),
});

export { bridgingSchema };
