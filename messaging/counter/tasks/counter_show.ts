import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const contractName = "Counter";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const factory = await hre.ethers.getContractFactory(contractName);
  const contract = factory.attach(args.contract);

  const counter = await contract.counter(signer.address);

  console.log(`🔢 The counter for ${signer.address} is: ${counter.toString()}
`);
};

task(
  "counter:show",
  "Sends a message from one chain to another.",
  main
).addParam("contract", "Contract address");
