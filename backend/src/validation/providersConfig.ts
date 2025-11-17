import { z } from "zod";

const providerConfigSchema = z.object({
  name: z.string().nonempty("Name is required"),
  rpcUrl: z.url().nonempty("RPC URL is required"),
  privateKey: z.string().nonempty("Private key is required"),
});

const providersConfigSchema = z.array(providerConfigSchema);

export { providersConfigSchema };
