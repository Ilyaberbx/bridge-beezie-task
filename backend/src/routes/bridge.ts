import { Hono } from "hono";
import { z } from "zod";
import { transferRequestSchema } from "../validation/bridge";
import { services } from "../services";
import { Erc20Abi__factory } from "../types/factories/Erc20Abi__factory";
import { ethers } from "ethers";

const app = new Hono();

app.post("/transfer", async (context) => {
  try {
    const body = await context.req.json();
    const validatedData = transferRequestSchema.parse(body);
    const sourceWallet = services.providerService.getWallet(validatedData.sourceChainName);
    const destinationWallet = services.providerService.getWallet(validatedData.destinationChainName);
    const sourceUsdcAddress = services.usdcAddressService.getUsdcAddress(validatedData.sourceChainName);
    const destinationUsdcAddress = services.usdcAddressService.getUsdcAddress(validatedData.destinationChainName);

    const sourceUsdc = Erc20Abi__factory.connect(sourceUsdcAddress, sourceWallet);
    const destinationUsdc = Erc20Abi__factory.connect(destinationUsdcAddress, destinationWallet);
    const sourceDecimals = await sourceUsdc.decimals();
    const destinationDecimals = await destinationUsdc.decimals();

    if (sourceDecimals !== destinationDecimals) {
      return context.json(
        {
          status: "error",
          message: "Source and destination decimals must be the same",
          code: "INVALID_DECIMALS",
        },
        500
      );
    }

    const amountToBridge = ethers.parseUnits(validatedData.amount.toString(), sourceDecimals);
    const allowance = await sourceUsdc.allowance(validatedData.sourceUserAddress, sourceWallet.address);

    console.log("allowance", allowance, "amountToBridge", amountToBridge);

    if (allowance < amountToBridge) {
      return context.json(
        {
          status: "error",
          message: "Insufficient allowance",
          code: "INSUFFICIENT_ALLOWANCE",
        },
        400
      );
    }

    const destinationPoolBalance = await destinationUsdc.balanceOf(destinationWallet.address);

    if (destinationPoolBalance < amountToBridge) {
      return context.json(
        {
          status: "error",
          message: "Insufficient destination pool balance",
          code: "INSUFFICIENT_DESTINATION_POOL_BALANCE",
        },
        400
      );
    }

    const sourceUserToSourcePoolTx = await sourceUsdc.transferFrom(validatedData.sourceUserAddress, sourceWallet.address, amountToBridge);
    const sourceUserToSourcePoolReceipt = await sourceUserToSourcePoolTx.wait();
    console.log("Source user to source pool receipt", sourceUserToSourcePoolReceipt);

    const destinationPoolToDestinationUserTx = await destinationUsdc.transfer(validatedData.destinationUserAddress, amountToBridge);
    const destinationPoolToDestinationUserReceipt = await destinationPoolToDestinationUserTx.wait();
    console.log("Destination pool to destination user receipt", destinationPoolToDestinationUserReceipt);

    return context.json(
      {
        status: "success",
        message: "Transfer completed successfully",
        code: "TRANSFER_COMPLETED_SUCCESSFULLY",
      },
      200
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return context.json(
        {
          status: "error",
          message: error.issues.map((e) => e.message).join(", "),
          code: "INVALID_INPUT",
        },
        400
      );
    }

    return context.json(
      {
        status: "error",
        message: error.message,
        code: "TRANSFER_FAILED",
      },
      500
    );
  }
});

export default app;
