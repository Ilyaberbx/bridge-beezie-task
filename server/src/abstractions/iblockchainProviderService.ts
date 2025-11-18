import { ethers } from "ethers";

export interface IBlockchainProviderService {
  getWallet(chainId: number): ethers.Wallet;
  getProvider(chainId: number): ethers.JsonRpcProvider;
  getExplorerUrl(chainId: number): string;
}
