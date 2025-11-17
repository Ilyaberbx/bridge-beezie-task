import { IWalletProviderService } from "../abstractions/iproviderService";
import { ethers } from "ethers";

export class WalletProviderService implements IWalletProviderService {
  private providers: Map<string, { provider: ethers.JsonRpcProvider; wallet: ethers.Wallet; explorerUrl: string }>;

  constructor(config: { name: string; privateKey: string; rpcUrl: string; explorerUrl: string }[]) {
    this.providers = new Map<string, { provider: ethers.JsonRpcProvider; wallet: ethers.Wallet; explorerUrl: string }>();
    for (const provider of config) {
      this.providers[provider.name] = {
        wallet: new ethers.Wallet(provider.privateKey, new ethers.JsonRpcProvider(provider.rpcUrl)),
        explorerUrl: provider.explorerUrl,
      };
    }
  }

  public getWallet(chainName: string): ethers.Wallet {
    try {
      const { wallet } = this.providers[chainName];
      if (wallet === undefined) {
        throw new Error("Provider or wallet not found for chain name: " + chainName);
      }
      return wallet;
    } catch (error) {
      throw new Error("Error getting wallet for chain name: " + chainName + " - " + error);
    }
  }

  public getExplorerUrl(chainName: string): string {
    try {
      const { explorerUrl } = this.providers[chainName];
      if (explorerUrl === undefined) {
        throw new Error("Explorer URL not found for chain name: " + chainName);
      }
      return explorerUrl;
    } catch (error) {
      throw new Error("Error getting explorer URL for chain name: " + chainName + " - " + error);
    }
  }
}
