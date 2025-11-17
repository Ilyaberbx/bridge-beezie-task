import { z } from "zod";
import { addressRegex } from "./addressRegex";
import { ethers } from "ethers";

const bridgeRequestSchema = z
  .object({
    sourceUserAddress: z
      .string()
      .regex(addressRegex, "Source user address must be a valid blockchain address")
      .transform((value) => ethers.getAddress(value)),
    sourceChainId: z.number().positive("Source chain ID must be a positive number"),
    destinationUserAddress: z
      .string()
      .regex(addressRegex, "Destination user address must be a valid blockchain address")
      .transform((value) => ethers.getAddress(value)),
    destinationChainId: z.number().positive("Destination chain ID must be a positive number"),
    amount: z.number().positive("Amount must be a positive number"),
  })
  .refine((data) => data.sourceChainId !== data.destinationChainId, {
    message: "Source and destination chains must be different",
  });

export { bridgeRequestSchema };
