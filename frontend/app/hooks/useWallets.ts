"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { BrowserProvider, ethers, Signer } from "ethers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CHAIN_IDS, isSupportedChain, SupportedChainId } from "../lib/configs";
import { Erc20Abi__factory } from "../types/factories/Erc20Abi__factory";
import { client } from "../lib/client";

type WalletState = {
  address: string;
  chainId: SupportedChainId;
  signer: Signer;
  usdcAmount: string;
} | null;

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

const fetchUsdcBalance = async (params: { usdcAddress: string; walletAddress: string; signer: Signer }): Promise<string> => {
  const usdcContract = Erc20Abi__factory.connect(params.usdcAddress, params.signer);
  const balance = await usdcContract.balanceOf(params.walletAddress);
  return ethers.formatUnits(balance, 6);
};

export function useWallets() {
  const [sourceWallet, setSourceWallet] = useState<WalletState>(null);
  const [destinationWallet, setDestinationWallet] = useState<WalletState>(null);
  const isConnectingRef = useRef(false);
  const queryClient = useQueryClient();

  const getOppositeChainId = (chainId: SupportedChainId): SupportedChainId => {
    return chainId === CHAIN_IDS.FLOW_EVM_TESTNET ? CHAIN_IDS.BASE_SEPOLIA : CHAIN_IDS.FLOW_EVM_TESTNET;
  };

  const switchChainMutation = useMutation({
    mutationFn: async (chainId: SupportedChainId) => {
      if (!window.ethereum) {
        throw new Error("MetaMask not installed");
      }

      const chainIdHex = `0x${chainId.toString(16)}`;
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
    },
  });

  const connectWalletMutation = useMutation({
    mutationFn: async (params: { expectedChainId?: SupportedChainId }): Promise<WalletState> => {
      if (!window.ethereum) {
        throw new Error("MetaMask not installed");
      }

      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);

      if (params.expectedChainId && currentChainId !== params.expectedChainId) {
        await switchChainMutation.mutateAsync(params.expectedChainId);
        const newProvider = new BrowserProvider(window.ethereum);
        const signer = await newProvider.getSigner();
        const address = await signer.getAddress();

        const usdcAddress = await queryClient.fetchQuery({
          queryKey: ["usdcAddress", params.expectedChainId],
          queryFn: () => fetchUsdcAddress(params.expectedChainId!),
        });

        const usdcAmount = await queryClient.fetchQuery({
          queryKey: ["usdcBalance", address, params.expectedChainId, usdcAddress],
          queryFn: () => fetchUsdcBalance({ usdcAddress, walletAddress: address, signer }),
        });

        return { address, chainId: params.expectedChainId, signer, usdcAmount };
      }

      if (!isSupportedChain(currentChainId)) {
        throw new Error("Unsupported chain. Please switch to chain 545 or 84532");
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const usdcAddress = await queryClient.fetchQuery({
        queryKey: ["usdcAddress", currentChainId],
        queryFn: () => fetchUsdcAddress(currentChainId),
      });

      const usdcAmount = await queryClient.fetchQuery({
        queryKey: ["usdcBalance", address, currentChainId, usdcAddress],
        queryFn: () => fetchUsdcBalance({ usdcAddress, walletAddress: address, signer }),
      });

      return { address, chainId: currentChainId, signer, usdcAmount };
    },
  });

  const connectSourceWalletMutation = useMutation({
    mutationFn: async (chainId: SupportedChainId) => {
      isConnectingRef.current = true;
      const wallet = await connectWalletMutation.mutateAsync({ expectedChainId: chainId });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return wallet;
    },
    onSuccess: (wallet) => {
      setSourceWallet(wallet);
    },
    onSettled: () => {
      isConnectingRef.current = false;
    },
  });

  const connectDestinationWalletMutation = useMutation({
    mutationFn: async () => {
      if (!sourceWallet) {
        throw new Error("Connect source wallet first");
      }

      isConnectingRef.current = true;
      const requiredChainId = getOppositeChainId(sourceWallet.chainId);
      const wallet = await connectWalletMutation.mutateAsync({ expectedChainId: requiredChainId });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return wallet;
    },
    onSuccess: (wallet) => {
      setDestinationWallet(wallet);
    },
    onSettled: () => {
      isConnectingRef.current = false;
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async (params: { chainId: number; address: string; signer: Signer }) => {
      const usdcAddress = await queryClient.fetchQuery({
        queryKey: ["usdcAddress", params.chainId],
        queryFn: () => fetchUsdcAddress(params.chainId),
      });

      const usdcAmount = await queryClient.fetchQuery({
        queryKey: ["usdcBalance", params.address, params.chainId, usdcAddress],
        queryFn: () => fetchUsdcBalance({ usdcAddress, walletAddress: params.address, signer: params.signer }),
      });

      return { usdcAmount };
    },
  });

  const connectSourceWallet = useCallback(
    (chainId: SupportedChainId) => {
      connectSourceWalletMutation.mutate(chainId);
    },
    [connectSourceWalletMutation]
  );

  const connectDestinationWallet = useCallback(() => {
    connectDestinationWalletMutation.mutate();
  }, [connectDestinationWalletMutation]);

  const getAvailableDestinationChainId = useCallback((): SupportedChainId | null => {
    if (!sourceWallet) return null;
    return getOppositeChainId(sourceWallet.chainId);
  }, [sourceWallet]);

  const swapWallets = useCallback(() => {
    const temp = sourceWallet;
    setSourceWallet(destinationWallet);
    setDestinationWallet(temp);
  }, [sourceWallet, destinationWallet]);

  const disconnectWallets = useCallback(() => {
    setSourceWallet(null);
    setDestinationWallet(null);
    queryClient.invalidateQueries({ queryKey: ["usdcAddress"] });
    queryClient.invalidateQueries({ queryKey: ["usdcBalance"] });
  }, [queryClient]);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = () => {
      if (isConnectingRef.current) return;
      disconnectWallets();
    };

    const handleAccountsChanged = async (accounts: unknown) => {
      if (isConnectingRef.current) return;

      if (!accounts || (accounts as string[]).length === 0) {
        disconnectWallets();
        return;
      }

      try {
        const provider = new BrowserProvider(window.ethereum!);
        const signer = await provider.getSigner();
        const newAddress = await signer.getAddress();
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);

        const result = await updateAccountMutation.mutateAsync({ chainId, address: newAddress, signer });

        if (sourceWallet && isSupportedChain(chainId)) {
          if (chainId === sourceWallet.chainId) {
            setSourceWallet({ address: newAddress, chainId, signer, usdcAmount: result.usdcAmount });
          }
        }

        if (destinationWallet && isSupportedChain(chainId)) {
          if (chainId === destinationWallet.chainId) {
            setDestinationWallet({ address: newAddress, chainId, signer, usdcAmount: result.usdcAmount });
          }
        }
      } catch (error) {
        console.error("Failed to update account:", error);
      }
    };

    window.ethereum.on("chainChanged", handleChainChanged);
    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [disconnectWallets, sourceWallet, destinationWallet, updateAccountMutation]);

  const isConnecting = connectSourceWalletMutation.isPending || connectDestinationWalletMutation.isPending;

  return {
    sourceWallet,
    destinationWallet,
    connectSourceWallet,
    connectDestinationWallet,
    swapWallets,
    disconnectWallets,
    getAvailableDestinationChainId,
    isConnecting,
  };
}

export type UseWalletsReturn = ReturnType<typeof useWallets>;
