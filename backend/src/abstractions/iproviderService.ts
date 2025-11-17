import { ethers } from "ethers";

export interface IWalletProviderService {
  getWallet(chainName: string): ethers.Wallet;
  getExplorerUrl(chainName: string): string;
}
