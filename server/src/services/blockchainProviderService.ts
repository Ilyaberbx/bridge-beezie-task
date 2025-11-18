import { IBlockchainProviderService } from "../abstractions/iblockchainProviderService";
import { ethers } from "ethers";

export class BlockchainProviderService implements IBlockchainProviderService {
  private providers: Map<number, { provider: ethers.JsonRpcProvider; wallet: ethers.Wallet; explorerUrl: string }>;

  constructor(config: { chainId: number; privateKey: string; rpcUrl: string; explorerUrl: string }[]) {
    this.providers = new Map<number, { provider: ethers.JsonRpcProvider; wallet: ethers.Wallet; explorerUrl: string }>();
    for (const provider of config) {
      this.providers.set(provider.chainId, {
        provider: new ethers.JsonRpcProvider(provider.rpcUrl),
        wallet: new ethers.Wallet(provider.privateKey, new ethers.JsonRpcProvider(provider.rpcUrl)),
        explorerUrl: provider.explorerUrl,
      });
    }
  }

  public getProvider(chainId: number): ethers.JsonRpcProvider {
    try {
      const provider = this.providers.get(chainId)?.provider;
      if (provider === undefined) {
        throw new Error("Provider not found for chain ID: " + chainId);
      }
      return provider;
    } catch (error) {
      throw new Error("Error getting provider for chain ID: " + chainId + " - " + error);
    }
  }

  public getWallet(chainId: number): ethers.Wallet {
    try {
      const wallet = this.providers.get(chainId)?.wallet;
      if (wallet === undefined) {
        throw new Error("Wallet not found for chain ID: " + chainId);
      }
      return wallet;
    } catch (error) {
      throw new Error("Error getting wallet for chain ID: " + chainId + " - " + error);
    }
  }

  public getExplorerUrl(chainId: number): string {
    try {
      const explorerUrl = this.providers.get(chainId)?.explorerUrl;

      if (explorerUrl === undefined) {
        throw new Error("Explorer URL not found for chain ID: " + chainId);
      }
      return explorerUrl;
    } catch (error) {
      throw new Error("Error getting explorer URL for chain ID: " + chainId + " - " + error);
    }
  }
}
