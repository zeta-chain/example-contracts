import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";

import "./tasks/deploy";
import "@zetachain/localnet/tasks";
import "@zetachain/toolkit/tasks";
import { getHardhatConfig } from "@zetachain/toolkit/client";

dotenv.config();

const config: HardhatUserConfig = {
  ...getHardhatConfig({ accounts: [process.env.PRIVATE_KEY] }),
};

export default config;
