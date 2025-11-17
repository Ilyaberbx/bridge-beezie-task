import { ethers } from "ethers";
import { Erc20Abi__factory } from "../types/factories/Erc20Abi__factory";

export type BridgeContext = {
  sourceUsdc: ReturnType<typeof Erc20Abi__factory.connect>;
  destinationUsdc: ReturnType<typeof Erc20Abi__factory.connect>;
  sourceWallet: ethers.Wallet;
  destinationWallet: ethers.Wallet;
  sourceDecimals: bigint;
  destinationDecimals: bigint;
  amountToBridge: bigint;
};

export type ErrorResponse = {
  status: "error";
  message: string;
};

export type SuccessResponse = {
  status: "success";
  message: string;
};

export type TransferResult = { receipt: ethers.TransactionReceipt };
