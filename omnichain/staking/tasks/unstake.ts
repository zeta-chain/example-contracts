import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther } from "@ethersproject/units";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const factory = await hre.ethers.getContractFactory("Staking");
  const contract = factory.attach(args.contract);

  const amount = parseEther(args.amount);

  const tx = await contract.unstakeZRC(amount);

  const receipt = await tx.wait();

  console.log(receipt);
};

task("unstake", "Unstake tokens", main)
  .addParam("contract", "The address of the contract on ZetaChain")
  .addParam("amount", "Amount of tokens to unstake");
