import "./tasks/interact";
import "./tasks/deploy";
import "./tasks/create-giveaway";
import "./tasks/mint";
import "./tasks/deploy-nft";
import "./tasks/set-requirement";
import "./tasks/participate";
import "./tasks/claim";
import "./tasks/has-nft";
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
