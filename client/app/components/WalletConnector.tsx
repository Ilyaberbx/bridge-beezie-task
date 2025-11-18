"use client";

import { getChainName, CHAIN_IDS, getChainConfig, SupportedChainId } from "../configs/configs";
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
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Source Wallet</h2>
        {!sourceWallet ? (
          <div className="space-y-3">
            {!isConnecting ? (
              <>
                <p className="text-sm text-gray-600 mb-2">Choose network:</p>

                <button
                  onClick={() => handleConnectSource(CHAIN_IDS.FLOW_EVM_TESTNET)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 w-full font-medium transition-all shadow-md hover:shadow-lg"
                >
                  Connect to {getChainConfig(CHAIN_IDS.FLOW_EVM_TESTNET).name}
                </button>
                <button
                  onClick={() => handleConnectSource(CHAIN_IDS.BASE_SEPOLIA)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 w-full font-medium transition-all shadow-md hover:shadow-lg"
                >
                  Connect to {getChainConfig(CHAIN_IDS.BASE_SEPOLIA).name}
                </button>
              </>
            ) : (
              <p className="text-gray-500">Connecting wallet...</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p>
              <span className="font-semibold text-gray-700">Address:</span> <span className="text-gray-600 text-sm">{sourceWallet.address}</span>
            </p>
            <p>
              <span className="font-semibold text-gray-700">Chain:</span> <span className="text-gray-600">{getChainName(sourceWallet.chainId)}</span>
            </p>
            <p>
              <span className="font-semibold text-gray-700">USDC Amount:</span>{" "}
              {sourceBalance.isLoading ? (
                <span className="text-gray-500">Loading...</span>
              ) : (
                <span className="text-gray-600 font-medium">{sourceBalance.usdcAmount}</span>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Destination Wallet</h2>
        {!destinationWallet ? (
          <div className="space-y-3">
            {sourceWallet && !isConnecting && (
              <>
                <p className="text-sm text-gray-600 mb-2">Available network:</p>
                <button
                  onClick={handleConnectDestination}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 w-full font-medium transition-all shadow-md hover:shadow-lg"
                >
                  Connect to {getChainName(getAvailableDestinationChainId()!)}
                </button>
              </>
            )}
            {sourceWallet && isConnecting && <p className="text-gray-500">Connecting wallet...</p>}
            {!sourceWallet && <p className="text-gray-500">Connect source wallet first</p>}
          </div>
        ) : (
          <div className="space-y-2">
            <p>
              <span className="font-semibold text-gray-700">Address:</span> <span className="text-gray-600 text-sm">{destinationWallet.address}</span>
            </p>
            <p>
              <span className="font-semibold text-gray-700">Chain:</span>{" "}
              <span className="text-gray-600">{getChainName(destinationWallet.chainId)}</span>
            </p>
            <p>
              <span className="font-semibold text-gray-700">USDC Amount:</span>{" "}
              {destinationBalance.isLoading ? (
                <span className="text-gray-500">Loading...</span>
              ) : (
                <span className="text-gray-600 font-medium">{destinationBalance.usdcAmount}</span>
              )}
            </p>
          </div>
        )}
      </div>

      {sourceWallet && destinationWallet && (
        <div className="flex gap-4 justify-center">
          <button
            onClick={swapWallets}
            disabled={!isActive}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Swap Wallets
          </button>
          <button
            onClick={disconnectWallets}
            disabled={!isActive}
            className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-8 py-3 rounded-lg hover:from-red-700 hover:to-rose-700 font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Disconnect All
          </button>
        </div>
      )}
    </div>
  );
}
