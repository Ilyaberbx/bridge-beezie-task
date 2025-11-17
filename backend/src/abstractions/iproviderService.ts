import { ethers } from "ethers";

export interface IProviderService {
  getWallet(chainName: string): ethers.Wallet;
}
