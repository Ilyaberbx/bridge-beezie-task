export const providersConfig = [
  {
    name: "flow-evm-testnet",
    rpcUrl: process.env.FLOW_TESTNET_RPC_URL!,
    privateKey: process.env.FLOW_TESTNET_PRIVATE_KEY!,
  },
  {
    name: "base-testnet",
    rpcUrl: process.env.BASE_TESTNET_RPC_URL!,
    privateKey: process.env.BASE_TESTNET_PRIVATE_KEY!,
  },
];
