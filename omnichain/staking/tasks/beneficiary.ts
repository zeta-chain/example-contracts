import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther } from "@ethersproject/units";
import { getAddress } from "@zetachain/protocol-contracts";
import { prepareData } from "@zetachain/toolkit/client";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();

  const data = prepareData(
    args.contract,
    ["uint8", "address"],
    ["3", args.beneficiary]
  );
  const to = getAddress("tss", hre.network.name);
  const value = parseEther("0");

  const tx = await signer.sendTransaction({ data, to, value });
  if (args.json) {
    console.log(JSON.stringify(tx, null, 2));
  } else {
    console.log(`🔑 Using account: ${signer.address}\n`);

    console.log(`🚀 Successfully broadcasted a token transfer transaction on ${hre.network.name} network.
📝 Transaction hash: ${tx.hash}
`);
  }
};

task(
  "update-beneficiary",
  "Set the address on ZetaChain which will be allowed to claim staking rewards",
  main
)
  .addParam("contract", "The address of the contract on ZetaChain")
  .addPositionalParam("beneficiary", "The address of the beneficiary")
  .addFlag("json", "Output in JSON");
