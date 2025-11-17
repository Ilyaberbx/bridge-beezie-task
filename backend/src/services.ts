import { IProviderService } from "./abstractions/iproviderService";
import { ProviderService } from "./services/providerService";
import { providersConfig } from "./configs/providersConfig";
import { providersConfigSchema } from "./validation/providersConfig";
import { UsdcAddressService } from "./services/usdcAddressService";
import { usdcAddressesConfig } from "./configs/usdcAddressesConfig";
import { usdcAddressesConfigSchema } from "./validation/usdcAddressesConfig";
import { IUsdcAddressService } from "./abstractions/iusdcAddressService";
import { drizzle } from "drizzle-orm/mysql2";
import { BridgingLogsRepository } from "./repositories/bridgingLogsRepository";
import { BridgingLogsService } from "./services/bridgingLogsService";
import { IBridgingLogsService } from "./abstractions/ibridgingLogsService";

function initializeServices(): {
  providerService: IProviderService;
  usdcAddressService: IUsdcAddressService;
  bridgingLogsService: IBridgingLogsService;
} {
  const database = drizzle({
    connection: process.env.MYSQL_CONNECTION_URL!,
  });

  const validatedProviders = providersConfigSchema.parse(providersConfig);
  const validatedUsdcAddresses = usdcAddressesConfigSchema.parse(usdcAddressesConfig);
  const bridgingLogsRepository = new BridgingLogsRepository(database);

  return {
    providerService: new ProviderService(validatedProviders),
    usdcAddressService: new UsdcAddressService(validatedUsdcAddresses),
    bridgingLogsService: new BridgingLogsService(bridgingLogsRepository),
  };
}

export const services = initializeServices();
