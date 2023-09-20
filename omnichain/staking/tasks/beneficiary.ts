import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther } from "@ethersproject/units";
import { getAddress } from "@zetachain/protocol-contracts";
import { prepareData, trackCCTX } from "@zetachain/toolkit/helpers";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const data = prepareData(
    args.contract,
    ["uint8", "address"],
    ["3", args.beneficiary]
  );
  const to = getAddress("tss", hre.network.name);
  const value = parseEther(args.amount);

  const tx = await signer.sendTransaction({ data, to, value });
  console.log(`
🚀 Successfully broadcasted a token transfer transaction on ${hre.network.name} network.
📝 Transaction hash: ${tx.hash}
`);
  await trackCCTX(tx.hash);
};

task(
  "set-beneficiary",
  "Set the address on ZetaChain which will be allowed to claim staking rewards",
  main
)
  .addParam("contract", "The address of the contract on ZetaChain")
  .addParam("amount", "Amount of tokens to send")
  .addPositionalParam("beneficiary", "The address of the beneficiary");
