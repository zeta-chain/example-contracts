import "./tasks/interact";
import "./tasks/deploy";
import "./tasks/createGiveaway";
import "./tasks/mint";
import "./tasks/deploy-nft";
import "./tasks/set-req";
import "./tasks/participate";
import "./tasks/claim";
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
