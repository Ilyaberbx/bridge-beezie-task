export interface IGasEstimationService {
  hasEnoughNativeTokensToPayForGas(chainName: string, estimatedGas: bigint): Promise<boolean>;
}
