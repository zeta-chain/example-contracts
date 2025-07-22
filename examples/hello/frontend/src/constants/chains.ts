export interface SupportedChain {
  explorerUrl: string;
  name: string;
  chainId: number;
  icon: string;
}

export const SUPPORTED_CHAINS: SupportedChain[] = [
  {
    explorerUrl: 'https://sepolia.etherscan.io/tx/',
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    icon: '/logos/ethereum-logo.svg',
  },
  {
    explorerUrl: 'https://testnet.bscscan.com/tx/',
    name: 'BSC Testnet',
    chainId: 97,
    icon: '/logos/bsc-logo.svg',
  },
  {
    explorerUrl: 'https://sepolia.basescan.org/tx/',
    name: 'Base Sepolia',
    chainId: 84532,
    icon: '/logos/base-logo.svg',
  },
  {
    explorerUrl: 'https://sepolia.arbiscan.io/tx/',
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    icon: '/logos/arbitrum-logo.svg',
  },
  {
    explorerUrl: 'https://testnet.snowtrace.io/tx/',
    name: 'Avalanche Fuji',
    chainId: 43113,
    icon: '/logos/avalanche-logo.svg',
  },
  {
    explorerUrl: 'https://amoy.polygonscan.com/tx/',
    name: 'Polygon Amoy',
    chainId: 80002,
    icon: '/logos/polygon-logo.svg',
  },
];

export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map(
  (chain) => chain.chainId
);

export const ZETACHAIN_ATHENS_BLOCKSCOUT_EXPLORER_URL =
  'https://zetachain-testnet.blockscout.com/tx/';
