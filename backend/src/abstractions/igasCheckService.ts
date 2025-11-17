export interface IGasEstimationService {
  hasEnoughNativeTokenToPayForGas(chainName: string, estimatedGas: bigint): Promise<boolean>;
}
