"use client";

import { useWallets } from "./hooks/useWallets";
import { getChainName, CHAIN_IDS, getChainConfig, SupportedChainId } from "./lib/configs";

export default function Home() {
  const {
    sourceWallet,
    isConnecting,
    destinationWallet,
    connectSourceWallet,
    connectDestinationWallet,
    swapWallets,
    disconnectWallets,
    getAvailableDestinationChainId,
  } = useWallets();

  const handleConnectSource = async (chainId: SupportedChainId) => {
    try {
      await connectSourceWallet(chainId);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to connect source wallet");
    }
  };

  const handleConnectDestination = async () => {
    try {
      await connectDestinationWallet();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to connect destination wallet");
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Bridge Application</h1>

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
            </div>
          )}
        </div>

        {sourceWallet && destinationWallet && (
          <div className="flex gap-4">
            <button onClick={swapWallets} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
              Swap Wallets
            </button>
            <button onClick={disconnectWallets} className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700">
              Disconnect All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
