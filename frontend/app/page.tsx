"use client";

import { useWallets } from "./hooks/useWallets";
import { WalletConnector } from "./components/WalletConnector";

export default function Home() {
  const wallets = useWallets();

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Bridge Application</h1>
      <WalletConnector wallets={wallets} />
    </div>
  );
}
