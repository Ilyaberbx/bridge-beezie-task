import { z } from "zod";
import { addressRegex } from "./addressRegex";

const usdcAddressConfigSchema = z.object({
  chainId: z.number().positive("Chain ID must be a positive number"),
  address: z.string().regex(addressRegex, "Address must be a valid blockchain address").nonempty("Address is required"),
});

const usdcAddressesConfigSchema = z.array(usdcAddressConfigSchema);

export { usdcAddressesConfigSchema };
