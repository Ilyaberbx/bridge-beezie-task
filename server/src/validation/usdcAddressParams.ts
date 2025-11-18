import { z } from "zod";

const usdcAddressParamsSchema = z.object({
  chainId: z.coerce.number().int().positive("Chain ID must be a positive number"),
});

export { usdcAddressParamsSchema };
