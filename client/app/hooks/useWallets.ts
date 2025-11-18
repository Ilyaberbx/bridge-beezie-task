"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { BrowserProvider, Signer } from "ethers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CHAIN_IDS, isSupportedChain, SupportedChainId } from "../configs/configs";
import { getIsFetchingBalance } from "./useUsdcBalance";

export type WalletState = {
  address: string;
  chainId: SupportedChainId;
  signer: Signer;
} | null;

export function useWallets() {
  const [sourceWallet, setSourceWallet] = useState<WalletState>(null);
  const [destinationWallet, setDestinationWallet] = useState<WalletState>(null);
  const isConnectingRef = useRef(false);
  const [isActive, setIsActive] = useState(true);
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
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainIdHex }],
        });
      } catch (error) {
        console.error("Failed to switch chain:", error);
        throw error;
      }
    },
    onError: (error) => {
      console.error("Chain switch error:", error);
    },
  });

  const connectWalletMutation = useMutation({
    mutationFn: async (params: { expectedChainId?: SupportedChainId }): Promise<WalletState> => {
      try {
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

          return { address, chainId: params.expectedChainId, signer };
        }

        if (!isSupportedChain(currentChainId)) {
          throw new Error("Unsupported chain. Please switch to chain 545 or 84532");
        }

        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        return { address, chainId: currentChainId, signer };
      } catch (error) {
        console.error("Failed to connect wallet:", error);
        throw error;
      }
    },
    onError: (error) => {
      console.error("Wallet connection error:", error);
    },
  });

  const connectSourceWalletMutation = useMutation({
    mutationFn: async (chainId: SupportedChainId) => {
      isConnectingRef.current = true;
      try {
        const wallet = await connectWalletMutation.mutateAsync({ expectedChainId: chainId });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return wallet;
      } catch (error) {
        console.error("Failed to connect source wallet:", error);
        throw error;
      }
    },
    onSuccess: (wallet) => {
      setSourceWallet(wallet);
    },
    onError: (error) => {
      console.error("Source wallet connection error:", error);
      isConnectingRef.current = false;
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
      try {
        const requiredChainId = getOppositeChainId(sourceWallet.chainId);
        const wallet = await connectWalletMutation.mutateAsync({ expectedChainId: requiredChainId });
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await switchChainMutation.mutateAsync(sourceWallet.chainId);
        await new Promise((resolve) => setTimeout(resolve, 500));

        return wallet;
      } catch (error) {
        console.error("Failed to connect destination wallet:", error);
        throw error;
      }
    },
    onSuccess: (wallet) => {
      setDestinationWallet(wallet);
    },
    onError: (error) => {
      console.error("Destination wallet connection error:", error);
      isConnectingRef.current = false;
    },
    onSettled: () => {
      isConnectingRef.current = false;
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async (params: { chainId: number; address: string; signer: Signer }) => {
      queryClient.invalidateQueries({ queryKey: ["usdcAddress"] });
      queryClient.invalidateQueries({ queryKey: ["usdcBalance"] });
      return params;
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

  const swapWallets = useCallback(async () => {
    if (!destinationWallet) return;

    isConnectingRef.current = true;
    const temp = sourceWallet;
    setSourceWallet(destinationWallet);
    setDestinationWallet(temp);

    try {
      await switchChainMutation.mutateAsync(destinationWallet.chainId);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      isConnectingRef.current = false;
    }
  }, [sourceWallet, destinationWallet, switchChainMutation]);

  const disconnectWallets = useCallback(() => {
    setSourceWallet(null);
    setDestinationWallet(null);
    queryClient.invalidateQueries({ queryKey: ["usdcAddress"] });
    queryClient.invalidateQueries({ queryKey: ["usdcBalance"] });
  }, [queryClient]);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = async () => {
      if (isConnectingRef.current || getIsFetchingBalance()) return;

      try {
        const provider = new BrowserProvider(window.ethereum!);
        const network = await provider.getNetwork();
        const newChainId = Number(network.chainId);

        if (!isSupportedChain(newChainId)) {
          disconnectWallets();
          return;
        }

        if (sourceWallet && destinationWallet) {
          if (newChainId !== sourceWallet.chainId && newChainId !== destinationWallet.chainId) {
            disconnectWallets();
          }
        }
      } catch (error) {
        console.error("Failed to handle chain change:", error);
        disconnectWallets();
      }
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

        await updateAccountMutation.mutateAsync({ chainId, address: newAddress, signer });

        if (sourceWallet && isSupportedChain(chainId)) {
          if (chainId === sourceWallet.chainId) {
            setSourceWallet({ address: newAddress, chainId, signer });
          }
        }

        if (destinationWallet && isSupportedChain(chainId)) {
          if (chainId === destinationWallet.chainId) {
            setDestinationWallet({ address: newAddress, chainId, signer });
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
    isActive,
    setIsActive,
  };
}

export type UseWalletsReturn = ReturnType<typeof useWallets>;
