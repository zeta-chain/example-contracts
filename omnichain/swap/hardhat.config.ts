import "./tasks/interact";
import "./tasks/deploy";
import "@nomicfoundation/hardhat-toolbox";
import "@zetachain/toolkit/tasks";

import { getHardhatConfigNetworks } from "@zetachain/networks";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  networks: {
    ...getHardhatConfigNetworks(),
    eth_mainnet: {
      accounts: getHardhatConfigNetworks()["eth_mainnet"].accounts,
      chainId: 1,
      gas: 30000,
      gasPrice: 5000000000,
      url: "https://eth-mainnet.public.blastapi.io",
    },
    zeta_mainnet: {
      accounts: getHardhatConfigNetworks()["zeta_mainnet"].accounts,
      chainId: 7000,
      gas: 5000000,
      gasPrice: 10000000000,
      url: "https://zetachain-evm.blockpi.network:443/v1/rpc/public",
    },
  },
  solidity: {
    compilers: [
      { version: "0.5.10" /** For create2 factory */ },
      { version: "0.6.6" /** For uniswap v2 router*/ },
      { version: "0.5.16" /** For uniswap v2 core*/ },
      { version: "0.4.19" /** For weth*/ },
      { version: "0.8.7" },
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

export default config;
