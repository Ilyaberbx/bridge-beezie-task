import { IGasEstimationService } from "../abstractions/igasEstimationService";
import { IBlockchainProviderService } from "../abstractions/iblockchainProviderService";

export class GasEstimationService implements IGasEstimationService {
  constructor(private readonly blockchainProviderService: IBlockchainProviderService) {}

  async hasEnoughNativeTokensToPayForGas(chainName: string, estimatedGas: bigint): Promise<boolean> {
    const provider = this.blockchainProviderService.getProvider(chainName);
    const wallet = this.blockchainProviderService.getWallet(chainName);
    const balanceInWei = await provider.getBalance(wallet.address);
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ?? BigInt(0);
    const gasPriceInWei = gasPrice * estimatedGas;
    return balanceInWei >= gasPriceInWei;
  }
}
