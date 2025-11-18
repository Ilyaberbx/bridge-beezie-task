export const providersConfig = [
  {
    chainId: 545,
    rpcUrl: process.env.FLOW_TESTNET_RPC_URL!,
    privateKey: process.env.FLOW_TESTNET_PRIVATE_KEY!,
    explorerUrl: process.env.FLOW_TESTNET_EXPLORER_URL!,
  },
  {
    chainId: 84532,
    rpcUrl: process.env.BASE_TESTNET_RPC_URL!,
    privateKey: process.env.BASE_TESTNET_PRIVATE_KEY!,
    explorerUrl: process.env.BASE_TESTNET_EXPLORER_URL!,
  },
];
