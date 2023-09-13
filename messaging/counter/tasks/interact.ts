import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther } from "@ethersproject/units";
import { trackCCTX } from "@zetachain/toolkit/helpers";

const contractName = "Counter";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const factory = await hre.ethers.getContractFactory(contractName);
  const contract = factory.attach(args.contract);

  const destination = hre.config.networks[args.destination]?.chainId;
  if (destination === undefined) {
    throw new Error(`${args.destination} is not a valid destination chain`);
  }

  const tx = await contract
    .connect(signer)
    .sendMessage(destination, { value: parseEther(args.amount) });

  const receipt = await tx.wait();
  console.log(`✅ The transaction has been broadcasted to ${hre.network.name}
📝 Transaction hash: ${receipt.transactionHash}
`);
  await trackCCTX(tx.hash);
};

task("interact", "Sends a message from one chain to another.", main)
  .addParam("contract", "Contract address")
  .addParam("amount", "Token amount to send")
  .addParam("destination", "Destination chain");
