import "./tasks/deploy";
import "./tasks/universalCall";
import "./tasks/connectedCall";
import "./tasks/connectedDeposit";
import "./tasks/connectedDepositAndCall";
import "./tasks/universalWithdraw";
import "./tasks/universalWithdrawAndCall";
import "@zetachain/localnet/tasks";
import "@nomicfoundation/hardhat-toolbox";
import "@zetachain/toolkit/tasks";

import { HardhatUserConfig } from "hardhat/config";
import { getHardhatConfig } from "@zetachain/toolkit/client";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  ...getHardhatConfig({ accounts: [process.env.PRIVATE_KEY] }),
};

export default config;
