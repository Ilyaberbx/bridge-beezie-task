import { IProviderService } from "../abstractions/iproviderService";
import { ethers } from "ethers";

export class ProviderService implements IProviderService {
  private providers: Map<string, { provider: ethers.JsonRpcProvider; wallet: ethers.Wallet }>;

  constructor(config: { name: string; privateKey: string; rpcUrl: string }[]) {
    this.providers = new Map<string, { provider: ethers.JsonRpcProvider; wallet: ethers.Wallet }>();
    for (const provider of config) {
      this.providers[provider.name] = {
        provider: new ethers.JsonRpcProvider(provider.rpcUrl),
        wallet: new ethers.Wallet(provider.privateKey, new ethers.JsonRpcProvider(provider.rpcUrl)),
      };
    }
  }

  public getWallet(chainName: string): ethers.Wallet {
    const { provider, wallet } = this.providers[chainName];
    if (provider === undefined || wallet === undefined) {
      throw new Error("Provider or wallet not found for chain name: " + chainName);
    }

    return wallet;
  }
}
