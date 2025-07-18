export interface SupportedChain {
  name: string;
  chainId: number;
  icon: string;
}

export const SUPPORTED_CHAINS: SupportedChain[] = [
  {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    icon: '/logos/ethereum-logo.svg',
  },
  {
    name: 'BSC Testnet',
    chainId: 97,
    icon: '/logos/bsc-logo.svg',
  },
  {
    name: 'Base Sepolia',
    chainId: 84532,
    icon: '/logos/base-logo.svg',
  },
  {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    icon: '/logos/arbitrum-logo.svg',
  },
  {
    name: 'Avalanche Fuji',
    chainId: 43113,
    icon: '/logos/avalanche-logo.svg',
  },
  {
    name: 'Polygon Amoy',
    chainId: 80002,
    icon: '/logos/polygon-logo.svg',
  },
];

export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map(
  (chain) => chain.chainId
);
