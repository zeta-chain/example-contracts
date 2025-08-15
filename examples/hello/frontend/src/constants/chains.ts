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

export const evmNetworks = [
  {
    blockExplorerUrls: ['https://sepolia.arbiscan.io/'],
    chainId: 421614,
    chainName: 'Arbitrum Sepolia',
    iconUrls: ['/logos/arbitrum-logo.svg'],
    name: 'Arbitrum',
    nativeCurrency: {
      name: 'Sepolia Eth',
      symbol: 'ETH',
      decimals: 18,
    },
    networkId: 421614,
    rpcUrls: ['https://arbitrum-sepolia-rpc.publicnode.com'],
    vanityName: 'Arbitrum Sepolia',
  },
  {
    blockExplorerUrls: ['https://testnet.snowscan.xyz/'],
    chainId: 43113,
    chainName: 'Avalanche Fuji',
    iconUrls: ['/logos/avalanche-logo.svg'],
    name: 'Avalanche',
    nativeCurrency: {
      name: 'Avalanche Fuji Coin',
      symbol: 'AVAX',
      decimals: 18,
    },
    networkId: 43113,
    rpcUrls: ['https://ava-testnet.public.blastapi.io/ext/bc/C/rpc'],
    vanityName: 'Avalanche Fuji',
  },
  {
    blockExplorerUrls: ['https://sepolia.basescan.org/'],
    chainId: 84532,
    chainName: 'Base Sepolia',
    iconUrls: ['/logos/base-logo.svg'],
    name: 'Base',
    nativeCurrency: {
      name: 'Base Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    networkId: 84532,
    rpcUrls: ['https://sepolia.base.org'],
    vanityName: 'Base Sepolia',
  },
  {
    blockExplorerUrls: ['https://testnet.bscscan.com/'],
    chainId: 97,
    chainName: 'BSC Testnet',
    iconUrls: ['/logos/bsc-logo.svg'],
    name: 'BSC',
    nativeCurrency: {
      name: 'Binance Testnet Coin',
      symbol: 'BNB',
      decimals: 18,
    },
    networkId: 97,
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
    vanityName: 'BSC Testnet',
  },
  {
    blockExplorerUrls: ['https://sepolia.etherscan.io/'],
    chainId: 11155111,
    chainName: 'Ethereum Sepolia',
    iconUrls: ['/logos/ethereum-logo.svg'],
    name: 'Ethereum',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'sETH',
      decimals: 18,
    },
    networkId: 11155111,
    rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
    vanityName: 'Sepolia',
  },
  {
    blockExplorerUrls: ['https://amoy.polygonscan.com/'],
    chainId: 80002,
    chainName: 'Polygon Amoy',
    iconUrls: ['/logos/polygon-logo.svg'],
    name: 'Polygon',
    nativeCurrency: {
      name: 'Polygon Amoy Coin',
      symbol: 'POL',
      decimals: 18,
    },
    networkId: 80002,
    rpcUrls: ['https://polygon-amoy.blockpi.network/v1/rpc/public'],
    vanityName: 'Polygon Amoy',
  },
];
