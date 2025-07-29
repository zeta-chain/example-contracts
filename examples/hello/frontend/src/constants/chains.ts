export interface SupportedChain {
  explorerUrl: string;
  name: string;
  chainId: number;
  icon: string;
  colorHex: string;
}

export const SUPPORTED_CHAINS: SupportedChain[] = [
  {
    explorerUrl: 'https://sepolia.arbiscan.io/tx/',
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    icon: '/logos/arbitrum-logo.svg',
    colorHex: '#28446A',
  },
  {
    explorerUrl: 'https://testnet.snowtrace.io/tx/',
    name: 'Avalanche Fuji',
    chainId: 43113,
    icon: '/logos/avalanche-logo.svg',
    colorHex: '#FF394A',
  },
  {
    explorerUrl: 'https://sepolia.basescan.org/tx/',
    name: 'Base Sepolia',
    chainId: 84532,
    icon: '/logos/base-logo.svg',
    colorHex: '#0052FF',
  },
  {
    explorerUrl: 'https://testnet.bscscan.com/tx/',
    name: 'BSC Testnet',
    chainId: 97,
    icon: '/logos/bsc-logo.svg',
    colorHex: '#E1A411',
  },
  {
    explorerUrl: 'https://sepolia.etherscan.io/tx/',
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    icon: '/logos/ethereum-logo.svg',
    colorHex: '#3457D5',
  },
  {
    explorerUrl: 'https://amoy.polygonscan.com/tx/',
    name: 'Polygon Amoy',
    chainId: 80002,
    icon: '/logos/polygon-logo.svg',
    colorHex: '#692BD7',
  },
];

export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map(
  (chain) => chain.chainId
);

export const ZETACHAIN_ATHENS_BLOCKSCOUT_EXPLORER_URL =
  'https://zetachain-testnet.blockscout.com/tx/';
