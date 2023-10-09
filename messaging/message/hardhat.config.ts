import "./tasks/interact";
import "./tasks/deploy";
import "@nomicfoundation/hardhat-toolbox";
import "@zetachain/toolkit/tasks";

import { getHardhatConfigNetworks } from "@zetachain/networks";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  networks: {
    ...getHardhatConfigNetworks(),
    bsc_testnet: {
      ...getHardhatConfigNetworks().bsc_testnet,
      url: "https://bsc-testnet.blockpi.network/v1/rpc/public",
    },
  },
  solidity: "0.8.7",
};

export default config;
