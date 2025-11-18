"use client";

import { useState } from "react";
import Modal from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { useWallets } from "./hooks/useWallets";
import { WalletsPair } from "./components/WalletsPair";
import { BridgeInterface } from "./components/BridgeInterface";

export default function Home() {
  const wallets = useWallets();
  const [openModal, setOpenModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setOpenModal(true);
  };

  const onCloseModal = () => {
    setOpenModal(false);
    wallets.setIsActive(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Bridge Application</h1>
          <p className="text-gray-600 text-lg">Transfer USDC seamlessly across blockchain networks</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 backdrop-blur-sm bg-opacity-90">
          <WalletsPair wallets={wallets} />
          <BridgeInterface wallets={wallets} showModal={showModal} />
        </div>
      </div>

      <Modal open={openModal} onClose={onCloseModal}>
        <h2 className="text-xl font-bold mb-4">{modalTitle}</h2>
        <p className="text-gray-600">{modalMessage}</p>
      </Modal>
    </div>
  );
}
