import { z } from "zod";
import { ethers } from "ethers";
import { Erc20Abi__factory } from "../types/factories/Erc20Abi__factory";
import { bridgeRequestSchema } from "../validation/bridgeRequest";
import { services } from "../services";
import { NewBridgingLog } from "../database/bridgingLogs.schema";
import { BridgeContext, ErrorResponse, SuccessResponse, TransferResult } from "../dto/bridge.dto";

export class BridgeController {
  async executeBridge(validatedRequestBody: z.infer<typeof bridgeRequestSchema>): Promise<SuccessResponse | ErrorResponse> {
    const operationKey = this.generateOperationKey(validatedRequestBody);

    return services.operationTrackerService.trackOperation(operationKey, async () => {
      return this.processBridge(validatedRequestBody);
    });
  }

  private generateOperationKey(requestBody: z.infer<typeof bridgeRequestSchema>): string {
    return `${requestBody.sourceUserAddress}-${requestBody.sourceChainId}-${requestBody.destinationUserAddress}-${requestBody.destinationChainId}-${requestBody.amount}`;
  }

  private async processBridge(validatedRequestBody: z.infer<typeof bridgeRequestSchema>): Promise<SuccessResponse | ErrorResponse> {
    const context = await this.setupBridgeContext(validatedRequestBody);

    const validationError = await this.validateBridgeRequirements(context, validatedRequestBody);
    if (validationError) {
      return validationError;
    }

    const gasError = await this.checkGasRequirements(context, validatedRequestBody);
    if (gasError) {
      return gasError;
    }

    const sourceResult = await this.executeSourceTransfer(context, validatedRequestBody.sourceUserAddress);
    if (this.isErrorResponse(sourceResult)) {
      return sourceResult;
    }

    const destinationResult = await this.executeDestinationTransfer(context, validatedRequestBody.destinationUserAddress);

    if (this.isErrorResponse(destinationResult)) {
      const revertSourceResult = await this.revertSourceTransfer(context, validatedRequestBody.sourceUserAddress);

      if (this.isErrorResponse(revertSourceResult)) {
        return revertSourceResult;
      }

      return destinationResult;
    }

    const bridgingLog = this.createBridgingLog(validatedRequestBody, sourceResult.receipt, destinationResult.receipt, context.amountToBridge);
    await services.bridgingLogsService.insert(bridgingLog);

    const message = `Transfer completed successfully. Source transaction: ${bridgingLog.sourceTxExplorerUrl} - Destination transaction: ${bridgingLog.destinationTxExplorerUrl} - Amount bridged: ${bridgingLog.amountBridged}`;

    console.log(message);

    return {
      status: "success",
      message: message,
    };
  }

  private isErrorResponse(result: TransferResult | ErrorResponse): result is ErrorResponse {
    return "status" in result && result.status === "error";
  }

  private async setupBridgeContext(validatedRequestBody: z.infer<typeof bridgeRequestSchema>): Promise<BridgeContext> {
    const sourceWallet = services.blockchainProviderService.getWallet(validatedRequestBody.sourceChainId);
    const destinationWallet = services.blockchainProviderService.getWallet(validatedRequestBody.destinationChainId);

    const sourceUsdcAddress = services.usdcAddressService.getUsdcAddress(validatedRequestBody.sourceChainId);
    const destinationUsdcAddress = services.usdcAddressService.getUsdcAddress(validatedRequestBody.destinationChainId);

    const sourceUsdc = Erc20Abi__factory.connect(sourceUsdcAddress, sourceWallet);
    const destinationUsdc = Erc20Abi__factory.connect(destinationUsdcAddress, destinationWallet);

    const sourceDecimals = await sourceUsdc.decimals();
    const destinationDecimals = await destinationUsdc.decimals();
    const amountToBridge = ethers.parseUnits(validatedRequestBody.amount.toString(), sourceDecimals);

    return {
      sourceUsdc,
      destinationUsdc,
      sourceWallet,
      destinationWallet,
      sourceDecimals,
      destinationDecimals,
      amountToBridge,
    };
  }

  private async validateBridgeRequirements(
    context: BridgeContext,
    validatedData: z.infer<typeof bridgeRequestSchema>
  ): Promise<ErrorResponse | null> {
    if (context.sourceDecimals !== context.destinationDecimals) {
      return {
        status: "error",
        message: "Source and destination decimals must be the same",
      };
    }

    const allowance = await context.sourceUsdc.allowance(validatedData.sourceUserAddress, context.sourceWallet.address);

    console.log("allowance", allowance, "amountToBridge", context.amountToBridge);

    if (allowance < context.amountToBridge) {
      return {
        status: "error",
        message: "Insufficient allowance",
      };
    }

    const destinationPoolBalance = await context.destinationUsdc.balanceOf(context.destinationWallet.address);

    if (destinationPoolBalance < context.amountToBridge) {
      return {
        status: "error",
        message: "Insufficient destination pool balance",
      };
    }

    return null;
  }

  private async checkGasRequirements(
    context: BridgeContext,
    validatedRequestBody: z.infer<typeof bridgeRequestSchema>
  ): Promise<ErrorResponse | null> {
    const sourceEstimatedGas = await context.sourceUsdc.transferFrom.estimateGas(
      validatedRequestBody.sourceUserAddress,
      context.sourceWallet.address,
      context.amountToBridge
    );

    const hasEnoughNativeTokenOnSource = await services.gasEstimationService.hasEnoughNativeTokensToPayForGas(
      validatedRequestBody.sourceChainId,
      sourceEstimatedGas
    );

    if (!hasEnoughNativeTokenOnSource) {
      return {
        status: "error",
        message: "Insufficient native token balance to pay for gas on source chain",
      };
    }

    const destinationEstimatedGas = await context.destinationUsdc.transfer.estimateGas(
      validatedRequestBody.destinationUserAddress,
      context.amountToBridge
    );

    const hasEnoughNativeTokenOnDestination = await services.gasEstimationService.hasEnoughNativeTokensToPayForGas(
      validatedRequestBody.destinationChainId,
      destinationEstimatedGas
    );

    if (!hasEnoughNativeTokenOnDestination) {
      return {
        status: "error",
        message: "Insufficient native token balance to pay for gas on destination chain",
      };
    }

    return null;
  }

  private async executeSourceTransfer(
    context: BridgeContext,
    sourceUserAddress: string
  ): Promise<{ receipt: ethers.TransactionReceipt } | ErrorResponse> {
    const transaction = await context.sourceUsdc.transferFrom(sourceUserAddress, context.sourceWallet.address, context.amountToBridge);

    const receipt = await transaction.wait();

    if (!receipt) {
      return {
        status: "error",
        message: "Source user to source pool transaction failed",
      };
    }

    if (receipt.status !== 1) {
      return {
        status: "error",
        message: `Source user to source pool transaction failed with status ${receipt.status}`,
      };
    }

    return { receipt };
  }

  private async executeDestinationTransfer(
    context: BridgeContext,
    destinationUserAddress: string
  ): Promise<{ receipt: ethers.TransactionReceipt } | ErrorResponse> {
    const transaction = await context.destinationUsdc.transfer(destinationUserAddress, context.amountToBridge);
    const receipt = await transaction.wait();

    if (!receipt) {
      return {
        status: "error",
        message: "Destination pool to destination user transaction failed",
      };
    }

    if (receipt.status !== 1) {
      return {
        status: "error",
        message: `Destination pool to destination user transaction failed with status ${receipt.status}`,
      };
    }

    return { receipt };
  }

  private async revertSourceTransfer(context: BridgeContext, sourceUserAddress: string): Promise<ErrorResponse | TransferResult> {
    const transaction = await context.sourceUsdc.transferFrom(context.sourceWallet.address, sourceUserAddress, context.amountToBridge);
    const receipt = await transaction.wait();
    if (!receipt) {
      return {
        status: "error",
        message: "Revert source pool to source user transaction failed",
      };
    }
    if (receipt.status !== 1) {
      return {
        status: "error",
        message: `Revert source pool to source user transaction failed with status ${receipt.status}`,
      };
    }
    return { receipt };
  }

  private createBridgingLog(
    validatedRequestBody: z.infer<typeof bridgeRequestSchema>,
    sourceReceipt: ethers.TransactionReceipt,
    destinationReceipt: ethers.TransactionReceipt,
    amountBridged: bigint
  ): NewBridgingLog {
    return {
      sourceTxHash: sourceReceipt.hash,
      sourceTxExplorerUrl: `${services.blockchainProviderService.getExplorerUrl(validatedRequestBody.sourceChainId)}/tx/${sourceReceipt.hash}`,
      sourceUserAddress: validatedRequestBody.sourceUserAddress,
      destinationTxHash: destinationReceipt.hash,
      destinationTxExplorerUrl: `${services.blockchainProviderService.getExplorerUrl(validatedRequestBody.destinationChainId)}/tx/${
        destinationReceipt.hash
      }`,
      destinationUserAddress: validatedRequestBody.destinationUserAddress,
      amountBridged: amountBridged.toString(),
    };
  }
}
