import bech32 from "bech32";
import { utils } from "ethers";
import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

import { deposit } from "./deposit";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  let recipient;
  try {
    if (bech32.decode(args.recipient)) {
      recipient = utils.solidityPack(
        ["bytes"],
        [utils.toUtf8Bytes(args.recipient)]
      );
    }
  } catch (e) {
    recipient = args.recipient;
  }
  const { amount, contract, targetToken, withdraw, api, idPath } = args;
  const params = [
    ["address", "bytes", "bool"],
    [targetToken, recipient, withdraw],
  ];
  await deposit({ amount, api, contract, idPath, params });
};

task("interact-solana", "", main)
  .addParam("amount", "Amount of SOL to deposit")
  .addParam("contract", "Universal contract address")
  .addParam("targetToken")
  .addParam("recipient")
  .addOptionalParam("withdraw")
  .addOptionalParam("api", "Solana API", "https://api.devnet.solana.com")
  .addOptionalParam("idPath", "Path to id.json", "~/.config/solana/id.json");
