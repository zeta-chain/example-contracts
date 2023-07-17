import "@nomicfoundation/hardhat-toolbox";
import "./tasks/deploy";
import "./tasks/counter_increment";
import "./tasks/counter_show";

import { getHardhatConfigNetworks } from "@zetachain/networks";
import { HardhatUserConfig } from "hardhat/config";
import "@zetachain/toolkit/tasks";

const config: HardhatUserConfig = {
  networks: {
    ...getHardhatConfigNetworks(),
  },
  solidity: "0.8.7",
};

export default config;
