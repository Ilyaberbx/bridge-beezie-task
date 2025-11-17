import { z } from "zod";
import { addressRegex } from "./addressRegex";

const logsParamsSchema = z.object({
  sourceUserAddress: z.string("Source user address is required").regex(addressRegex, "Source user address must be a valid blockchain address"),
  destinationUserAddress: z
    .string("Destination user address is required")
    .regex(addressRegex, "Destination user address must be a valid blockchain address"),
  limit: z.coerce.number().min(1, "Limit must be greater than 0").max(100, "Limit must be less than 100").optional().default(10),
  offset: z.coerce.number().min(0, "Offset must be greater than or equal to 0").optional().default(0),
});

export { logsParamsSchema };
