const FLOW_EVM_TESTNET_CHAIN_ID = 545;
const BASE_SEPOLIA_CHAIN_ID = 84532;

export const SUPPORTED_CHAINS = {
  FLOW_EVM_TESTNET: {
    chainId: 545,
    name: "Flow EVM Testnet",
    poolAddress: process.env.NEXT_PUBLIC_FLOW_EVM_TESTNET_POOL_ADDRESS!,
  },
  BASE_SEPOLIA: {
    chainId: 84532,
    name: "Base Sepolia",
    poolAddress: process.env.NEXT_PUBLIC_BASE_TESTNET_POOL_ADDRESS!,
  },
} as const;

export type SupportedChainId = typeof FLOW_EVM_TESTNET_CHAIN_ID | typeof BASE_SEPOLIA_CHAIN_ID;

export const CHAIN_IDS = {
  FLOW_EVM_TESTNET: FLOW_EVM_TESTNET_CHAIN_ID,
  BASE_SEPOLIA: BASE_SEPOLIA_CHAIN_ID,
} as const;

export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return chainId === CHAIN_IDS.FLOW_EVM_TESTNET || chainId === CHAIN_IDS.BASE_SEPOLIA;
}

export function getChainConfig(chainId: SupportedChainId) {
  if (chainId === CHAIN_IDS.FLOW_EVM_TESTNET) {
    return SUPPORTED_CHAINS.FLOW_EVM_TESTNET;
  }
  if (chainId === CHAIN_IDS.BASE_SEPOLIA) {
    return SUPPORTED_CHAINS.BASE_SEPOLIA;
  }
  throw new Error(`Unsupported chain ID: ${chainId}`);
}

export function getChainName(chainId: number): string {
  if (chainId === CHAIN_IDS.FLOW_EVM_TESTNET) {
    return SUPPORTED_CHAINS.FLOW_EVM_TESTNET.name;
  }
  if (chainId === CHAIN_IDS.BASE_SEPOLIA) {
    return SUPPORTED_CHAINS.BASE_SEPOLIA.name;
  }
  return `Unknown Chain (${chainId})`;
}
