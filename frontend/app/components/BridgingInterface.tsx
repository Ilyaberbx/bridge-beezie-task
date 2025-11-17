import { SubmitHandler, useForm } from "react-hook-form";
import { UseWalletsReturn } from "../hooks/useWallets";
import { bridgingSchema } from "../validation/bridging";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type FormFields = z.infer<typeof bridgingSchema>;

export function BridgingInterface({ wallets }: { wallets: UseWalletsReturn }) {
  const { sourceWallet, destinationWallet } = wallets;

  if (!sourceWallet || !destinationWallet) {
    return <div>Connect your wallets first</div>;
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(bridgingSchema),
  });

  const onSubmit: SubmitHandler<FormFields> = async (data: FormFields) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <label htmlFor="usdcAmount" className="block text-sm font-medium text-gray-700 mb-2">
          USDC Amount
        </label>
        <input
          {...register("usdcAmount", {
            validate: (value) => value <= Number(sourceWallet.usdcAmount),
          })}
          type="number"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
        {errors.usdcAmount && <p className="mt-2 text-sm text-red-600">{errors.usdcAmount.message}</p>}
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
      >
        Bridge USDC
      </button>
    </form>
  );
}
