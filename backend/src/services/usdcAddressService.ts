import { IUsdcAddressService } from "../abstractions/iusdcAddressService";

export class UsdcAddressService implements IUsdcAddressService {
  private usdcAddresses: Map<number, string>;

  constructor(config: { chainId: number; address: string }[]) {
    this.usdcAddresses = new Map<number, string>();
    for (const usdcAddress of config) {
      this.usdcAddresses.set(usdcAddress.chainId, usdcAddress.address);
    }
  }

  public getUsdcAddress(chainId: number): string {
    const usdcAddress = this.usdcAddresses.get(chainId);
    if (usdcAddress === undefined) {
      throw new Error("USDC address not found for chain ID: " + chainId);
    }
    return usdcAddress;
  }
}
