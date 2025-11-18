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
import { ethers } from "ethers";
import { UseWalletsReturn } from "../hooks/useWallets";
import { useState } from "react";

type FormFields = z.infer<ReturnType<typeof createBridgingSchema>>;

export function BridgingInterface({ wallets }: { wallets: UseWalletsReturn }) {
  const { sourceWallet, destinationWallet, setIsActive } = wallets;

  const maxAmount = sourceWallet ? Number(sourceWallet.usdcAmount) : 0;

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

  if (!sourceWallet || !destinationWallet) {
    return <div>Connect your wallets first</div>;
  }
  const handleSliderChange = (value: number | number[]) => {
    const numericValue = Array.isArray(value) ? value[0] : value;
    setValue("usdcAmount", numericValue, { shouldValidate: true });
  };

  const onSubmit: SubmitHandler<FormFields> = async (data: FormFields) => {
    setIsActive(false);
    const usdcAddress = sourceWallet.usdcAddress;
    const usdcContract = Erc20Abi__factory.connect(usdcAddress, sourceWallet.signer);
    const poolAddress = getChainConfig(sourceWallet.chainId).poolAddress;
    const denormalizedAmount = ethers.parseUnits(data.usdcAmount.toString(), 6);

    try {
      const approve = await usdcContract.approve(poolAddress, denormalizedAmount);
      const receipt = await approve.wait();
      if (!receipt || receipt.status !== 1) {
        setModalTitle("Approval failed");
        setModalMessage("Approval transaction failed");
        setOpenModal(true);
        return;
      }
    } catch (error) {
      setModalTitle("Approval failed");
      setModalMessage((error as Error).message);
      setOpenModal(true);
      return;
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
      setModalTitle("Bridge failed");
      setModalMessage(responseData.message);
      setOpenModal(true);
      return;
    }

    setModalTitle("Bridge successful");
    setModalMessage(responseData.message);
    setOpenModal(true);
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="mb-6">
          <label htmlFor="usdcAmount" className="block text-sm font-medium text-gray-700 mb-2">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
          {errors.usdcAmount && <p className="mt-2 text-sm text-red-600">{errors.usdcAmount.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          Bridge USDC
        </button>
      </form>
      <Modal open={openModal} onClose={onCloseModal}>
        <h2>{modalTitle}</h2>
        <p>{modalMessage}</p>
      </Modal>
    </div>
  );
}
