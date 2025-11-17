import { IUsdcAddressService } from "../abstractions/iusdcAddressService";

export class UsdcAddressService implements IUsdcAddressService {
  private usdcAddresses: Map<string, string>;

  constructor(config: { chainName: string; address: string }[]) {
    this.usdcAddresses = new Map<string, string>();
    for (const usdcAddress of config) {
      this.usdcAddresses.set(usdcAddress.chainName, usdcAddress.address);
    }
  }

  public getUsdcAddress(chainName: string): string {
    const usdcAddress = this.usdcAddresses.get(chainName);
    if (usdcAddress === undefined) {
      throw new Error("USDC address not found for chain name: " + chainName);
    }
    return usdcAddress;
  }
}
