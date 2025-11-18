"use client";

import { useQuery } from "@tanstack/react-query";
import { ethers, Signer, BrowserProvider } from "ethers";
import { Erc20Abi__factory } from "../types/factories/Erc20Abi__factory";
import { client } from "../lib/client";
import { SupportedChainId } from "../configs/configs";

let isFetchingBalance = false;

export const getIsFetchingBalance = () => isFetchingBalance;

const fetchUsdcAddress = async (chainId: number): Promise<string> => {
  const response = await client.api.usdcAddress.$get({
    query: {
      chainId: chainId.toString(),
    },
  });

  const data = await response.json();
  if (data.status !== "success" || !("data" in data)) {
    throw new Error("Failed to fetch USDC address");
  }
  return data.data;
};

const fetchUsdcBalance = async (params: {
  usdcAddress: string;
  walletAddress: string;
  chainId: SupportedChainId;
  signer: Signer;
}): Promise<string> => {
  isFetchingBalance = true;

  try {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed");
    }

    const currentProvider = new BrowserProvider(window.ethereum);
    const currentNetwork = await currentProvider.getNetwork();
    const currentChainId = Number(currentNetwork.chainId);

    if (currentChainId !== params.chainId) {
      const chainIdHex = `0x${params.chainId.toString(16)}`;
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const usdcContract = Erc20Abi__factory.connect(params.usdcAddress, signer);
    const balance = await usdcContract.balanceOf(params.walletAddress);
    return ethers.formatUnits(balance, 6);
  } finally {
    isFetchingBalance = false;
  }
};

export function useUsdcBalance(address: string | undefined, chainId: SupportedChainId | undefined, signer: Signer | undefined) {
  const usdcAddressQuery = useQuery({
    queryKey: ["usdcAddress", chainId],
    queryFn: () => fetchUsdcAddress(chainId!),
    enabled: !!chainId,
    staleTime: Infinity,
  });

  const balanceQuery = useQuery({
    queryKey: ["usdcBalance", address, chainId, usdcAddressQuery.data],
    queryFn: () =>
      fetchUsdcBalance({
        usdcAddress: usdcAddressQuery.data!,
        walletAddress: address!,
        chainId: chainId!,
        signer: signer!,
      }),
    enabled: !!address && !!chainId && !!signer && !!usdcAddressQuery.data,
    staleTime: 30000,
    refetchOnMount: true,
    retry: 3,
  });

  return {
    usdcAddress: usdcAddressQuery.data,
    usdcAmount: balanceQuery.data,
    isLoading: usdcAddressQuery.isLoading || balanceQuery.isLoading,
    error: usdcAddressQuery.error || balanceQuery.error,
    refetch: balanceQuery.refetch,
  };
}
