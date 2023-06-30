import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther } from "@ethersproject/units";
import { getAddress } from "@zetachain/protocol-contracts";
import { BigNumber } from "@ethersproject/bignumber";
import { prepareData } from "@zetachain/toolkit/helpers";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const network = hre.network.name;
  const data = prepareData(
    args.contract,
    ["bytes32"],
    [args.recipient || signer.address]
  );
  const to = getAddress("tss", network as any);
  const value = parseEther(args.amount);
  const tx = await signer.sendTransaction({ data, to, value });
  console.log(`
🚀 Successfully broadcasted a token transfer transaction on ${network} network.
📝 Transaction hash: ${tx.hash}
💰 Amount: ${args.amount} native ${network} gas tokens

This transaction has been submitted to ${network}, but it may take some time
for it to be processed on ZetaChain. Please refer to ZetaChain's explorer
for updates on the progress of the cross-chain transaction.

🌍 Explorer: https://explorer.zetachain.com/address/${args.contract}?tab=ccTxs
`);
};

task("send", "", main)
  .addOptionalParam("recipient", "Address of the recipient, defaults to signer")
  .addParam("contract", "Address of the swap contract on ZetaChain")
  .addParam("amount", "Amount to send to the recipient");
