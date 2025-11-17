import { IGasEstimationService } from "../abstractions/igasEstimationService";
import { IBlockchainProviderService } from "../abstractions/iblockchainProviderService";

export class GasEstimationService implements IGasEstimationService {
  constructor(private readonly blockchainProviderService: IBlockchainProviderService) {}

  async hasEnoughNativeTokensToPayForGas(chainId: number, estimatedGas: bigint): Promise<boolean> {
    const provider = this.blockchainProviderService.getProvider(chainId);
    const wallet = this.blockchainProviderService.getWallet(chainId);
    const balanceInWei = await provider.getBalance(wallet.address);
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ?? BigInt(0);
    const gasPriceInWei = gasPrice * estimatedGas;
    return balanceInWei >= gasPriceInWei;
  }
}
