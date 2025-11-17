import { IWalletProviderService } from "./abstractions/iproviderService";
import { WalletProviderService } from "./services/providerService";
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
  walletProviderService: IWalletProviderService;
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
    walletProviderService: new WalletProviderService(validatedProviders),
    usdcAddressService: new UsdcAddressService(validatedUsdcAddresses),
    bridgingLogsService: new BridgingLogsService(bridgingLogsRepository),
  };
}

export const services = initializeServices();
