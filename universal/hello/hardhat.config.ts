import "./tasks/evmDepositAndCall";
import "./tasks/evmDeposit";
import "./tasks/depositAndCall";
import "./tasks/evmCall";
import "./tasks/mintUSDC";
import "./tasks/checkBalance";
import "./tasks/deploy";
import "./tasks/deposit";
import "./tasks/directDeposit";
import "./tasks/zetachainCall";
import "./tasks/deploy";
import "./tasks/solana/interact";
import "@zetachain/localnet/tasks";
import "@nomicfoundation/hardhat-toolbox";
import "@zetachain/toolkit/tasks";

import { getHardhatConfigNetworks } from "@zetachain/networks";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  networks: {
    ...getHardhatConfigNetworks(),
  },
  solidity: "0.8.26",
};

export default config;
