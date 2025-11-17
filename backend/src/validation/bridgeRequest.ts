import { z } from "zod";
import { addressRegex } from "./addressRegex";
import { ethers } from "ethers";

const bridgeRequestSchema = z
  .object({
    sourceUserAddress: z
      .string()
      .regex(addressRegex, "Source user address must be a valid blockchain address")
      .transform((value) => ethers.getAddress(value)),
    sourceChainName: z.string().min(1, "Source chain name is required"),
    destinationUserAddress: z
      .string()
      .regex(addressRegex, "Destination user address must be a valid blockchain address")
      .transform((value) => ethers.getAddress(value)),
    destinationChainName: z.string().min(1, "Destination chain name is required"),
    amount: z.number().positive("Amount must be a positive number"),
  })
  .refine((data) => data.sourceChainName !== data.destinationChainName, {
    message: "Source and destination chains must be different",
  });

export { bridgeRequestSchema };
