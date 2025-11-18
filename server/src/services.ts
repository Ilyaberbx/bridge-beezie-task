import { IBlockchainProviderService } from "./abstractions/iblockchainProviderService";
import { BlockchainProviderService } from "./services/blockchainProviderService";
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
import { GasEstimationService } from "./services/gasEstimationService";
import { IGasEstimationService } from "./abstractions/igasEstimationService";
import { OperationTrackerService } from "./services/operationTrackerService";
import { IOperationTrackerService } from "./abstractions/ioperationTrackerService";

function initializeServices(): {
  blockchainProviderService: IBlockchainProviderService;
  usdcAddressService: IUsdcAddressService;
  bridgingLogsService: IBridgingLogsService;
  gasEstimationService: IGasEstimationService;
  operationTrackerService: IOperationTrackerService;
} {
  const database = drizzle({
    connection: process.env.MYSQL_CONNECTION_URL!,
  });

  const validatedProviders = providersConfigSchema.parse(providersConfig);
  const validatedUsdcAddresses = usdcAddressesConfigSchema.parse(usdcAddressesConfig);
  const bridgingLogsRepository = new BridgingLogsRepository(database);
  const blockchainProviderService = new BlockchainProviderService(validatedProviders);

  return {
    blockchainProviderService,
    usdcAddressService: new UsdcAddressService(validatedUsdcAddresses),
    bridgingLogsService: new BridgingLogsService(bridgingLogsRepository),
    gasEstimationService: new GasEstimationService(blockchainProviderService),
    operationTrackerService: new OperationTrackerService(),
  };
}

export const services = initializeServices();
