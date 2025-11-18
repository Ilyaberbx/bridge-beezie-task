"use client";

import { useWallets } from "./hooks/useWallets";
import { WalletConnector } from "./components/WalletConnector";
import { BridgingInterface } from "./components/BridgingInterface";

export default function Home() {
  const wallets = useWallets();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Bridge Application</h1>
          <p className="text-gray-600 text-lg">Transfer USDC seamlessly across blockchain networks</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 backdrop-blur-sm bg-opacity-90">
          <WalletConnector wallets={wallets} />
          <BridgingInterface wallets={wallets} />
        </div>
      </div>
    </div>
  );
}
