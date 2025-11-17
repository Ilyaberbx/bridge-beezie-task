"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { BrowserProvider, ethers, Signer } from "ethers";
import { CHAIN_IDS, isSupportedChain, SupportedChainId } from "../lib/configs";
import { Erc20Abi__factory } from "../types/factories/Erc20Abi__factory";
import { client } from "../lib/client";

type WalletState = {
  address: string;
  chainId: SupportedChainId;
  signer: Signer;
  usdcAmount: string;
} | null;

export function useWallets() {
  const [sourceWallet, setSourceWallet] = useState<WalletState>(null);
  const [destinationWallet, setDestinationWallet] = useState<WalletState>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const isConnectingRef = useRef(false);

  const getOppositeChainId = (chainId: SupportedChainId): SupportedChainId => {
    return chainId === CHAIN_IDS.FLOW_EVM_TESTNET ? CHAIN_IDS.BASE_SEPOLIA : CHAIN_IDS.FLOW_EVM_TESTNET;
  };

  const switchToChain = async (chainId: SupportedChainId): Promise<void> => {
    if (!window.ethereum) return;

    const chainIdHex = `0x${chainId.toString(16)}`;

    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  };

  const connectWallet = async (expectedChainId?: SupportedChainId): Promise<WalletState> => {
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

    if (expectedChainId && currentChainId !== expectedChainId) {
      await switchToChain(expectedChainId);
      const newProvider = new BrowserProvider(window.ethereum);
      const signer = await newProvider.getSigner();
      const address = await signer.getAddress();
      const usdcAddressResponse = await client.api.usdcAddress.$get({
        query: {
          chainId: expectedChainId.toString(),
        },
      });

      const usdcAddressData = await usdcAddressResponse.json();
      if (usdcAddressData.status !== "success" || !("data" in usdcAddressData)) {
        throw new Error("Failed to fetch USDC address");
      }
      const usdcAddress = usdcAddressData.data;
      const usdcContract = Erc20Abi__factory.connect(usdcAddress, signer);
      const usdcAmount = await usdcContract.balanceOf(address);
      const formattedUsdcAmount = ethers.formatUnits(usdcAmount, 6);

      return { address, chainId: expectedChainId, signer, usdcAmount: formattedUsdcAmount };
    }

    if (!isSupportedChain(currentChainId)) {
      throw new Error("Unsupported chain. Please switch to chain 545 or 84532");
    }

    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const usdcAddressResponse = await client.api.usdcAddress.$get({
      query: {
        chainId: currentChainId.toString(),
      },
    });

    const usdcAddressData = await usdcAddressResponse.json();
    if (usdcAddressData.status !== "success" || !("data" in usdcAddressData)) {
      throw new Error("Failed to fetch USDC address");
    }
    const usdcAddress = usdcAddressData.data;
    const usdcContract = Erc20Abi__factory.connect(usdcAddress, signer);
    const usdcAmount = await usdcContract.balanceOf(address);
    const formattedUsdcAmount = ethers.formatUnits(usdcAmount, 6);

    return { address, chainId: currentChainId, signer, usdcAmount: formattedUsdcAmount };
  };

  const connectSourceWallet = useCallback(async (chainId: SupportedChainId) => {
    isConnectingRef.current = true;
    setIsConnecting(true);
    try {
      const wallet = await connectWallet(chainId);
      setSourceWallet(wallet);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      isConnectingRef.current = false;
      setIsConnecting(false);
    }
  }, []);

  const connectDestinationWallet = useCallback(async () => {
    if (!sourceWallet) {
      throw new Error("Connect source wallet first");
    }

    isConnectingRef.current = true;
    setIsConnecting(true);
    try {
      const requiredChainId = getOppositeChainId(sourceWallet.chainId);
      const wallet = await connectWallet(requiredChainId);
      setDestinationWallet(wallet);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      isConnectingRef.current = false;
      setIsConnecting(false);
    }
  }, [sourceWallet]);

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
  }, []);

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
        const usdcAddressResponse = await client.api.usdcAddress.$get({
          query: {
            chainId: chainId.toString(),
          },
        });

        const usdcAddressData = await usdcAddressResponse.json();
        if (usdcAddressData.status !== "success" || !("data" in usdcAddressData)) {
          throw new Error("Failed to fetch USDC address");
        }
        const usdcAddress = usdcAddressData.data;
        const usdcContract = Erc20Abi__factory.connect(usdcAddress, signer);
        const usdcAmount = await usdcContract.balanceOf(newAddress);
        const formattedUsdcAmount = ethers.formatUnits(usdcAmount, 6);

        if (sourceWallet && isSupportedChain(chainId)) {
          if (chainId === sourceWallet.chainId) {
            setSourceWallet({ address: newAddress, chainId, signer, usdcAmount: formattedUsdcAmount });
          }
        }

        if (destinationWallet && isSupportedChain(chainId)) {
          if (chainId === destinationWallet.chainId) {
            setDestinationWallet({ address: newAddress, chainId, signer, usdcAmount: formattedUsdcAmount });
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
  }, [disconnectWallets, sourceWallet, destinationWallet]);

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
