export interface IGasEstimationService {
  hasEnoughNativeTokensToPayForGas(chainId: number, estimatedGas: bigint): Promise<boolean>;
}
