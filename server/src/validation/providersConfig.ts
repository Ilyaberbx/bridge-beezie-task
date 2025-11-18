import { z } from "zod";

const providerConfigSchema = z.object({
  chainId: z.number().positive("Chain ID must be a positive number"),
  rpcUrl: z.url().nonempty("RPC URL is required"),
  privateKey: z.string().nonempty("Private key is required"),
  explorerUrl: z.url().nonempty("Explorer URL is required"),
});

const providersConfigSchema = z.array(providerConfigSchema);

export { providersConfigSchema };
