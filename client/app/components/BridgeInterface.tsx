import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { SubmitHandler, useForm } from "react-hook-form";
import { createBridgingSchema } from "../validation/bridging";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UseWalletsReturn } from "../hooks/useWallets";
import { useUsdcBalance } from "../hooks/useUsdcBalance";
import { useBridge, BridgeResponse } from "../hooks/useBridge";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type FormFields = z.infer<ReturnType<typeof createBridgingSchema>>;

interface BridgeInterfaceProps {
  wallets: UseWalletsReturn;
  showModal: (title: string, message: string) => void;
}

export function BridgeInterface({ wallets, showModal }: BridgeInterfaceProps) {
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

  const currentAmount = watch("usdcAmount");

  useEffect(() => {
    if (maxAmount <= 0) {
      setValue("usdcAmount", 0);
      return;
    }

    const halfAmount = maxAmount / 2;
    setValue("usdcAmount", halfAmount);
  }, [maxAmount, setValue]);

  const bridgeMutation = useBridge(
    {
      sourceWalletAddress: sourceWallet?.address,
      sourceWalletChainId: sourceWallet?.chainId,
      destinationWalletAddress: destinationWallet?.address,
      destinationWalletChainId: destinationWallet?.chainId,
      usdcAddress: sourceBalance.usdcAddress,
    },
    {
      onMutate: () => {
        setIsActive(false);
      },
      onSuccess: async (data: BridgeResponse) => {
        queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] === "usdcBalance",
        });
        showModal("Bridge successful", data.message);
      },
      onError: (error: Error) => {
        const errorMessage = error.message;
        const title = errorMessage.includes("Approval") ? "Approval failed" : "Bridge failed";
        showModal(title, errorMessage);
      },
      onSettled: () => {
        setIsActive(true);
      },
    }
  );

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
  );
}
