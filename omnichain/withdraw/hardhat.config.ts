import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { getHardhatConfigNetworks } from "@zetachain/networks";
import "@zetachain/toolkit/tasks";

import "./tasks/deploy";
import "./tasks/withdraw";

const config: HardhatUserConfig = {
  solidity: "0.8.7",
  networks: {
    ...getHardhatConfigNetworks(),
  },
};

export default config;
