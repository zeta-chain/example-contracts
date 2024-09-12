import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { deposit } from "./deposit";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const { amount, memo, api, idPath } = args;
  await deposit({ amount, memo, api, idPath });
};

task("interact-solana", "", main)
  .addParam("amount", "Amount of SOL to deposit")
  .addParam("memo", "Memo")
  .addOptionalParam("api", "Solana API", "https://api.devnet.solana.com")
  .addOptionalParam("idPath", "Path to id.json", "~/.config/solana/id.json");
