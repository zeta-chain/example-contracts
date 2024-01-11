import "./tasks/interact";
import "./tasks/deploy";
import "./tasks/destination";
import "@nomicfoundation/hardhat-toolbox";
import "@zetachain/toolkit/tasks";
import "@nomicfoundation/hardhat-foundry";

import { getHardhatConfigNetworks } from "@zetachain/networks";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  networks: {
    ...getHardhatConfigNetworks(),
  },
  solidity: "0.8.7",
};

export default config;
