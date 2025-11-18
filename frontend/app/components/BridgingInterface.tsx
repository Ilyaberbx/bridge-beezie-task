import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import "react-responsive-modal/styles.css";
import Modal from "react-responsive-modal";
import { SubmitHandler, useForm } from "react-hook-form";
import { createBridgingSchema } from "../validation/bridging";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Erc20Abi__factory } from "../types/factories/Erc20Abi__factory";
import { getChainConfig } from "../lib/configs";
import { client } from "../lib/client";
import { ethers, BrowserProvider } from "ethers";
import { UseWalletsReturn } from "../hooks/useWallets";
import { useUsdcBalance } from "../hooks/useUsdcBalance";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type FormFields = z.infer<ReturnType<typeof createBridgingSchema>>;

export function BridgingInterface({ wallets }: { wallets: UseWalletsReturn }) {
  const { sourceWallet, destinationWallet, setIsActive } = wallets;
  const queryClient = useQueryClient();

  const sourceBalance = useUsdcBalance(sourceWallet?.address, sourceWallet?.chainId, sourceWallet?.signer);

  const maxAmount = sourceBalance.usdcAmount ? Number(sourceBalance.usdcAmount) : 0;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<FormFields>({
    resolver: zodResolver(createBridgingSchema(maxAmount)),
  });

  const [openModal, setOpenModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const onCloseModal = () => {
    setOpenModal(false);
    setIsActive(true);
  };

  const currentAmount = watch("usdcAmount");

  const bridgeMutation = useMutation({
    mutationFn: async (data: FormFields) => {
      if (!sourceWallet || !destinationWallet || !sourceBalance.usdcAddress) {
        throw new Error("Wallets not connected properly");
      }

      if (!window.ethereum) {
        throw new Error("MetaMask not installed");
      }

      const currentProvider = new BrowserProvider(window.ethereum);
      const currentNetwork = await currentProvider.getNetwork();
      const currentChainId = Number(currentNetwork.chainId);

      if (currentChainId !== sourceWallet.chainId) {
        const chainIdHex = `0x${sourceWallet.chainId.toString(16)}`;
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainIdHex }],
        });
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const usdcContract = Erc20Abi__factory.connect(sourceBalance.usdcAddress, signer);
      const poolAddress = getChainConfig(sourceWallet.chainId).poolAddress;
      const denormalizedAmount = ethers.parseUnits(data.usdcAmount.toString(), 6);

      const approve = await usdcContract.approve(poolAddress, denormalizedAmount);
      const receipt = await approve.wait();
      if (!receipt || receipt.status !== 1) {
        throw new Error("Approval transaction failed");
      }

      const response = await client.api.bridge.$post({
        json: {
          sourceUserAddress: sourceWallet.address,
          sourceChainId: sourceWallet.chainId,
          destinationUserAddress: destinationWallet.address,
          destinationChainId: destinationWallet.chainId,
          amount: data.usdcAmount,
        },
      });

      const responseData = await response.json();

      if (responseData.status !== "success") {
        throw new Error(responseData.message);
      }

      return responseData;
    },
    onMutate: () => {
      setIsActive(false);
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: ["usdcBalance"],
      });
      setModalTitle("Bridge successful");
      setModalMessage(data.message);
      setOpenModal(true);
    },
    onError: (error: Error) => {
      const errorMessage = error.message;
      if (errorMessage.includes("Approval")) {
        setModalTitle("Approval failed");
      } else {
        setModalTitle("Bridge failed");
      }
      setModalMessage(errorMessage);
      setOpenModal(true);
    },
    onSettled: () => {
      setIsActive(true);
    },
  });

  if (!sourceWallet || !destinationWallet) {
    return (
      <div className="text-center py-8 text-gray-500 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
        Connect your wallets first
      </div>
    );
  }

  const handleSliderChange = (value: number | number[]) => {
    const numericValue = Array.isArray(value) ? value[0] : value;
    setValue("usdcAmount", numericValue, { shouldValidate: true });
  };

  const onSubmit: SubmitHandler<FormFields> = async (data: FormFields) => {
    bridgeMutation.mutate(data);
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
          <label htmlFor="usdcAmount" className="block text-lg font-semibold text-gray-800 mb-4">
            USDC Amount
          </label>
          {maxAmount > 0 && (
            <div className="mb-4 px-2">
              <Slider min={0} max={maxAmount} value={currentAmount || 0} onChange={handleSliderChange} step={0.01} />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>0</span>
                <span>{maxAmount.toFixed(2)}</span>
              </div>
            </div>
          )}
          <input
            {...register("usdcAmount", {
              valueAsNumber: true,
            })}
            type="number"
            step="0.01"
            className="w-full px-4 py-3 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white"
          />
          {errors.usdcAmount && <p className="mt-2 text-sm text-red-600">{errors.usdcAmount.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting || bridgeMutation.isPending}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {bridgeMutation.isPending ? "Bridging..." : "Bridge USDC"}
        </button>
      </form>
      <Modal open={openModal} onClose={onCloseModal}>
        <h2 className="text-xl font-bold mb-4">{modalTitle}</h2>
        <p className="text-gray-600">{modalMessage}</p>
      </Modal>
    </div>
  );
}
