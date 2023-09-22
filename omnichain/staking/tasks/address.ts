import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { utils } from "ethers";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const dataTypes = ["bytes"];
  const values = [utils.toUtf8Bytes(args.address)];

  const encodedData = utils.solidityPack(dataTypes, values);
  console.log(`Encoded: ${encodedData}`);
  console.log(`context.origin: ${encodedData.slice(0, 42)}`);
};

task(
  "address",
  "Encode a Bitcoin bech32 address to hex",
  main
).addPositionalParam("address");
