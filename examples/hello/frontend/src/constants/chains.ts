const SUPPORTED_CHAINS = [
  {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
  },
  {
    name: 'BSC Testnet',
    chainId: 97,
  },
  {
    name: 'Base Sepolia',
    chainId: 84532,
  },
  {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
  },
  {
    name: 'Avalanche Fuji',
    chainId: 43113,
  },
  {
    name: 'Polygon Amoy',
    chainId: 80002,
  },
];

export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map(
  (chain) => chain.chainId
);
