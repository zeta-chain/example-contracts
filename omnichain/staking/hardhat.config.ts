import "./tasks/stake";
import "./tasks/deploy";
import "./tasks/claim";
import "./tasks/unstake";
import "./tasks/beneficiary";
import "./tasks/unstake";
import "./tasks/address";
import "@nomicfoundation/hardhat-toolbox";
import "@zetachain/toolkit/tasks";

import { getHardhatConfigNetworks } from "@zetachain/networks";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  networks: {
    ...getHardhatConfigNetworks(),
  },
  solidity: {
    compilers: [
      { version: "0.5.16" /** For uniswap v2 core*/ },
      { version: "0.8.7" },
    ],
  },
};

export default config;
