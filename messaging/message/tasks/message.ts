import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther } from "@ethersproject/units";
import { getChainId } from "@zetachain/addresses";

const contractName = "CrossChainMessage";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const factory = await hre.ethers.getContractFactory(contractName);
  const contract = factory.attach(args.contract);

  const tx = await contract
    .connect(signer)
    .sendHelloWorld(args.destination, { value: parseEther("50") });

  const receipt = await tx.wait();
  console.log("sendHelloWorld transaction mined:", receipt.transactionHash);
};

task("message", "Send a message from one chain to another", main)
  .addParam("contract", "Contract address")
  .addParam("destination", "Destination chain ID (integer)");
