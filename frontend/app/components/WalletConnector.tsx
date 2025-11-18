"use client";

import { getChainName, CHAIN_IDS, getChainConfig, SupportedChainId } from "../lib/configs";
import type { UseWalletsReturn } from "../hooks/useWallets";
import { useUsdcBalance } from "../hooks/useUsdcBalance";

interface WalletConnectorProps {
  wallets: UseWalletsReturn;
}

export function WalletConnector({ wallets }: WalletConnectorProps) {
  const {
    sourceWallet,
    isConnecting,
    destinationWallet,
    connectSourceWallet,
    connectDestinationWallet,
    swapWallets,
    disconnectWallets,
    getAvailableDestinationChainId,
    isActive,
  } = wallets;

  const sourceBalance = useUsdcBalance(sourceWallet?.address, sourceWallet?.chainId, sourceWallet?.signer);
  const destinationBalance = useUsdcBalance(destinationWallet?.address, destinationWallet?.chainId, destinationWallet?.signer);

  const handleConnectSource = (chainId: SupportedChainId) => {
    connectSourceWallet(chainId);
  };

  const handleConnectDestination = () => {
    connectDestinationWallet();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Source Wallet</h2>
        {!sourceWallet ? (
          <div className="space-y-3">
            {!isConnecting ? (
              <>
                <p className="text-sm text-gray-600 mb-2">Choose network:</p>

                <button
                  onClick={() => handleConnectSource(CHAIN_IDS.FLOW_EVM_TESTNET)}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full"
                >
                  Connect to {getChainConfig(CHAIN_IDS.FLOW_EVM_TESTNET).name}
                </button>
                <button
                  onClick={() => handleConnectSource(CHAIN_IDS.BASE_SEPOLIA)}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full"
                >
                  Connect to {getChainConfig(CHAIN_IDS.BASE_SEPOLIA).name}
                </button>
              </>
            ) : (
              <p className="text-gray-500">Connecting wallet...</p>
            )}
          </div>
        ) : (
          <div>
            <p className="mb-2">
              <span className="font-semibold">Address:</span> {sourceWallet.address}
            </p>
            <p>
              <span className="font-semibold">Chain:</span> {getChainName(sourceWallet.chainId)}
            </p>
            <p>
              <span className="font-semibold">USDC Amount:</span> {sourceBalance.isLoading ? "Loading..." : sourceBalance.usdcAmount}
            </p>
          </div>
        )}
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Destination Wallet</h2>
        {!destinationWallet ? (
          <div className="space-y-3">
            {sourceWallet && !isConnecting && (
              <>
                <p className="text-sm text-gray-600 mb-2">Available network:</p>
                <button onClick={handleConnectDestination} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full">
                  Connect to {getChainName(getAvailableDestinationChainId()!)}
                </button>
              </>
            )}
            {sourceWallet && isConnecting && <p className="text-gray-500">Connecting wallet...</p>}
            {!sourceWallet && <p className="text-gray-500">Connect source wallet first</p>}
          </div>
        ) : (
          <div>
            <p className="mb-2">
              <span className="font-semibold">Address:</span> {destinationWallet.address}
            </p>
            <p>
              <span className="font-semibold">Chain:</span> {getChainName(destinationWallet.chainId)}
            </p>
            <p>
              <span className="font-semibold">USDC Amount:</span> {destinationBalance.isLoading ? "Loading..." : destinationBalance.usdcAmount}
            </p>
          </div>
        )}
      </div>

      {sourceWallet && destinationWallet && (
        <div className="flex gap-4">
          <button onClick={swapWallets} disabled={!isActive} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
            Swap Wallets
          </button>
          <button onClick={disconnectWallets} disabled={!isActive} className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700">
            Disconnect All
          </button>
        </div>
      )}
    </div>
  );
}
