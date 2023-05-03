import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import { getHardhatConfigNetworks } from "@zetachain/addresses-tools/dist/networks";

import "./tasks/account";
import "./tasks/faucet";
import "./tasks/deploy";
import "./tasks/swap";

dotenv.config();
const PRIVATE_KEYS =
  process.env.PRIVATE_KEY !== undefined ? [`0x${process.env.PRIVATE_KEY}`] : [];

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      { version: "0.6.6" /** For uniswap v2 */ },
      { version: "0.8.7" },
    ],
  },
  networks: {
    ...getHardhatConfigNetworks(PRIVATE_KEYS),
  },
};

export default config;
