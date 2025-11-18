import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { ethers, BrowserProvider } from "ethers";
import { Erc20Abi__factory } from "../types/factories/Erc20Abi__factory";
import { getChainConfig, SupportedChainId } from "../configs/configs";
import { client } from "../lib/client";

interface UseBridgeParams {
  sourceWalletAddress: string | undefined;
  sourceWalletChainId: SupportedChainId | undefined;
  destinationWalletAddress: string | undefined;
  destinationWalletChainId: SupportedChainId | undefined;
  usdcAddress: string | undefined;
}

export interface BridgeData {
  usdcAmount: number;
}

export interface BridgeResponse {
  status: string;
  message: string;
}

export function useBridge(
  { sourceWalletAddress, sourceWalletChainId, destinationWalletAddress, destinationWalletChainId, usdcAddress }: UseBridgeParams,
  options?: Omit<UseMutationOptions<BridgeResponse, Error, BridgeData>, "mutationFn">
) {
  return useMutation({
    mutationFn: async (data: BridgeData) => {
      if (!sourceWalletAddress || !sourceWalletChainId || !destinationWalletAddress || !destinationWalletChainId || !usdcAddress) {
        throw new Error("Wallets not connected properly");
      }

      if (!window.ethereum) {
        throw new Error("MetaMask not installed");
      }

      const currentProvider = new BrowserProvider(window.ethereum);
      const currentNetwork = await currentProvider.getNetwork();
      const currentChainId = Number(currentNetwork.chainId);

      if (currentChainId !== sourceWalletChainId) {
        const chainIdHex = `0x${sourceWalletChainId.toString(16)}`;
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainIdHex }],
        });
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const usdcContract = Erc20Abi__factory.connect(usdcAddress, signer);
      const poolAddress = getChainConfig(sourceWalletChainId).poolAddress;
      const denormalizedAmount = ethers.parseUnits(data.usdcAmount.toString(), 6);

      const approve = await usdcContract.approve(poolAddress, denormalizedAmount);
      const receipt = await approve.wait();
      if (!receipt || receipt.status !== 1) {
        throw new Error("Approval transaction failed");
      }

      const response = await client.api.bridge.$post({
        json: {
          sourceUserAddress: sourceWalletAddress,
          sourceChainId: sourceWalletChainId,
          destinationUserAddress: destinationWalletAddress,
          destinationChainId: destinationWalletChainId,
          amount: data.usdcAmount,
        },
      });

      const responseData = await response.json();

      if (responseData.status !== "success") {
        throw new Error(responseData.message);
      }

      return responseData;
    },
    ...options,
  });
}
