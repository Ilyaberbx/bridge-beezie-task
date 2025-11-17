import { IProviderService } from "./abstractions/iproviderService";
import { ProviderService } from "./services/providerService";
import { providersConfig } from "./configs/providersConfig";
import { providersConfigSchema } from "./validation/providersConfig";
import { UsdcAddressService } from "./services/usdcAddressService";
import { usdcAddressesConfig } from "./configs/usdcAddressesConfig";
import { usdcAddressesConfigSchema } from "./validation/usdcAddressesConfig";
import { IUsdcAddressService } from "./abstractions/iusdcAddressService";

function initializeServices(): { providerService: IProviderService; usdcAddressService: IUsdcAddressService } {
  const validatedProviders = providersConfigSchema.parse(providersConfig);
  const validatedUsdcAddresses = usdcAddressesConfigSchema.parse(usdcAddressesConfig);
  return { providerService: new ProviderService(validatedProviders), usdcAddressService: new UsdcAddressService(validatedUsdcAddresses) };
}

export const services = initializeServices();
