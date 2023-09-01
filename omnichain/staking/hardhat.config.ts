import "./tasks/interact";
import "./tasks/deploy";
import "./tasks/rewards";
import "./tasks/claim";
import "./tasks/unstake";
import "@nomicfoundation/hardhat-toolbox";
import "@zetachain/toolkit/tasks";

import { getHardhatConfigNetworks } from "@zetachain/networks";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  networks: {
    ...getHardhatConfigNetworks(),
  },
  solidity: "0.8.7",
};

export default config;
