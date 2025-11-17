import { IGasEstimationService } from "../abstractions/igasCheckService";
import { IBlockchainProviderService } from "../abstractions/iblockchainProviderService";

export class GasEstimationService implements IGasEstimationService {
  constructor(private readonly blockchainProviderService: IBlockchainProviderService) {}

  async hasEnoughNativeTokenToPayForGas(chainName: string, estimatedGas: bigint): Promise<boolean> {
    const provider = this.blockchainProviderService.getProvider(chainName);
    const wallet = this.blockchainProviderService.getWallet(chainName);
    const balanceInWei = await provider.getBalance(wallet.address);
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ?? 0n;
    const gasPriceInWei = gasPrice * estimatedGas;
    return balanceInWei >= gasPriceInWei;
  }
}
