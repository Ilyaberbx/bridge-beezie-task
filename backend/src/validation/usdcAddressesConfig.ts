import { z } from "zod";
import { addressRegex } from "./addressRegex";

const usdcAddressConfigSchema = z.object({
  chainName: z.string().nonempty("Chain name is required"),
  address: z.string().regex(addressRegex, "Address must be a valid blockchain address").nonempty("Address is required"),
});

const usdcAddressesConfigSchema = z.array(usdcAddressConfigSchema);

export { usdcAddressesConfigSchema };
