import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther } from "@ethersproject/units";
import { getAddress } from "@zetachain/protocol-contracts";
import { prepareData } from "@zetachain/toolkit/helpers";
import { utils } from "ethers";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();

  if (args.targetToken) {
    const destinationTokens = args.targetToken.split(",");
    const ZetaMultiOutput = await hre.ethers.getContractAt(
      "MultiOutput",
      args.contract
    );
    const tx = await ZetaMultiOutput.registerDestinationToken(
      destinationTokens
    );

    await tx.wait();

    console.log(
      `Registered tokens ${destinationTokens} as destination tokens in the contract ${args.contract}`
    );
  }

  let bitcoinAddress;
  let data;
  if (args.btcRecipient) {
    bitcoinAddress = utils.solidityPack(
      ["bytes"],
      [utils.toUtf8Bytes(args.btcRecipient)]
    );
    data = prepareData(
      args.contract,
      ["address", "bytes"],
      [args.recipient, bitcoinAddress]
    );
  } else {
    data = prepareData(args.contract, ["address"], [args.recipient]);
  }

  const to = getAddress("tss", hre.network.name);
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

task("interact", "Interact with the contract", main)
  .addParam("contract", "The address of the withdraw contract on ZetaChain")
  .addParam("amount", "Amount of tokens to send")
  .addFlag("json", "Output in JSON")
  .addParam("recipient", "The evm address to send to")
  .addOptionalParam("btcRecipient", "The bitcoin address to send to")
  .addOptionalParam("targetToken", "The Address of the token to send to");
