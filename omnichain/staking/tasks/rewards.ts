import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { convertToHexAddress } from "../lib/convertToHexAddress";
const { decode } = require("bech32");
const { arrayify } = require("@ethersproject/bytes");

function bech32ToHex(bech32Address: string) {
  const { words } = decode(bech32Address);

  // Convert 5-bit words to bytes
  let bytes = [];
  for (let i = 0; i < words.length; i++) {
    let word = words[i];
    for (let j = 4; j >= 0; j--) {
      bytes.push((word >> j) & 1);
    }
  }

  return arrayify(bytes);
}
const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const staker = convertToHexAddress(args.staker);

  const factory = await hre.ethers.getContractFactory("Staking");
  const contract = factory.attach(args.contract);

  console.log(await contract.queryRewards(bech32ToHex(args.staker)));
};

task("rewards", "Query staking rewards", main)
  .addParam("contract", "The address of the contract on ZetaChain")
  .addParam("staker", "Staker address");
