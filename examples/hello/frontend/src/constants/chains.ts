export interface SupportedChain {
  explorerUrl: (txHash: string) => string;
  name: string;
  chainId: number;
  chainType: 'EVM' | 'SOL' | 'BTC';
  icon: string;
  colorHex: string;
}

export const SUPPORTED_CHAINS: SupportedChain[] = [
  {
    explorerUrl: (txHash: string) => `https://sepolia.arbiscan.io/tx/${txHash}`,
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    chainType: 'EVM',
    icon: '/logos/arbitrum-logo.svg',
    colorHex: '#28446A',
  },
  {
    explorerUrl: (txHash: string) =>
      `https://testnet.snowtrace.io/tx/${txHash}`,
    name: 'Avalanche Fuji',
    chainId: 43113,
    chainType: 'EVM',
    icon: '/logos/avalanche-logo.svg',
    colorHex: '#FF394A',
  },
  {
    explorerUrl: (txHash: string) =>
      `https://sepolia.basescan.org/tx/${txHash}`,
    name: 'Base Sepolia',
    chainId: 84532,
    chainType: 'EVM',
    icon: '/logos/base-logo.svg',
    colorHex: '#0052FF',
  },
  {
    explorerUrl: (txHash: string) => `https://testnet.bscscan.com/tx/${txHash}`,
    name: 'BSC Testnet',
    chainId: 97,
    chainType: 'EVM',
    icon: '/logos/bsc-logo.svg',
    colorHex: '#E1A411',
  },
  {
    explorerUrl: (txHash: string) =>
      `https://sepolia.etherscan.io/tx/${txHash}`,
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    chainType: 'EVM',
    icon: '/logos/ethereum-logo.svg',
    colorHex: '#3457D5',
  },
  {
    explorerUrl: (txHash: string) =>
      `https://amoy.polygonscan.com/tx/${txHash}`,
    name: 'Polygon Amoy',
    chainId: 80002,
    chainType: 'EVM',
    icon: '/logos/polygon-logo.svg',
    colorHex: '#692BD7',
  },
  {
    explorerUrl: (txHash: string) =>
      `https://solscan.io/tx/${txHash}?cluster=devnet`,
    name: 'Solana Devnet',
    chainId: 901,
    chainType: 'SOL',
    icon: '/logos/solana-logo.svg',
    colorHex: '#9945FF',
  },
  {
    explorerUrl: (txHash: string) =>
      `https://mempool.space/signet/tx/${txHash}`,
    name: 'Bitcoin Signet',
    chainId: 18333,
    chainType: 'BTC',
    icon: '/logos/bitcoin-logo.svg',
    colorHex: '#F7931A',
  },
];

export const BITCOIN_GATEWAY_ADDRESS_SIGNET =
  'tb1qy9pqmk2pd9sv63g27jt8r657wy0d9ueeh0nqur';

export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map(
  (chain) => chain.chainId
);

export const ZETACHAIN_ATHENS_BLOCKSCOUT_EXPLORER_URL = (txHash: string) =>
  `https://zetachain-testnet.blockscout.com/tx/${txHash}`;
