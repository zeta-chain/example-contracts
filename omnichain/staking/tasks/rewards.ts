import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const factory = await hre.ethers.getContractFactory("Staking");
  const contract = factory.attach(args.contract);

  console.log(await contract.queryRewards(args.staker));
};

task("rewards", "Query staking rewards", main)
  .addParam("contract", "The address of the contract on ZetaChain")
  .addParam("staker", "Staker address");
