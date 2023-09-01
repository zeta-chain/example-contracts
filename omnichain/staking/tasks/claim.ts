import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const factory = await hre.ethers.getContractFactory("Staking");
  const contract = factory.attach(args.contract);

  const tx = await contract.claimRewards(args.staker);

  const receipt = await tx.wait();

  console.log(receipt);
};

task("claim", "Claim staking rewards", main)
  .addParam("contract", "The address of the contract on ZetaChain")
  .addParam("staker", "Staker address");
