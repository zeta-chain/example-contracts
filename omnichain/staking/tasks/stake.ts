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
    ["1", args.beneficiary]
  );
  const to = getAddress("tss", hre.network.name as any);
  const value = parseEther(args.amount);

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

task("stake", "Deposit tokens to ZetaChain and stake them", main)
  .addParam("contract", "The address of the contract on ZetaChain")
  .addParam("amount", "Amount of tokens to send")
  .addParam("beneficiary", "Beneficiary")
  .addFlag("json", "Output in JSON");
