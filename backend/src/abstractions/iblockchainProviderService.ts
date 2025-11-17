import { ethers } from "ethers";

export interface IBlockchainProviderService {
  getWallet(chainName: string): ethers.Wallet;
  getProvider(chainName: string): ethers.JsonRpcProvider;
  getExplorerUrl(chainName: string): string;
}
