import "./tasks/deploy";
import "./tasks/companionSwap";
import "./tasks/deployCompanion";
import "./tasks/zetachainSwap";
import "./tasks/evmSwap";
import "@zetachain/localnet/tasks";
import "@nomicfoundation/hardhat-toolbox";
import "@zetachain/toolkit/tasks";

import { getHardhatConfigNetworks } from "@zetachain/networks";
import { HardhatUserConfig } from "hardhat/config";

import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-ethers";

const config: HardhatUserConfig = {
  networks: {
    ...getHardhatConfigNetworks(),
  },
  solidity: {
    compilers: [{ version: "0.8.20" }, { version: "0.8.26" }],
  },
};

export default config;
