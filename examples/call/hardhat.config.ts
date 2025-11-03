import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";

import { getHardhatConfig } from "@zetachain/toolkit/utils";

dotenv.config();

const config: HardhatUserConfig = {
  ...getHardhatConfig({ accounts: [process.env.PRIVATE_KEY || ""] }),
  solidity: {
    settings: {
      evmVersion: "cancun",
    },
    version: "0.8.26",
  },
};

export default config;
