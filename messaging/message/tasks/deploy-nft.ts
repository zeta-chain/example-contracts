import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const factory = await hre.ethers.getContractFactory("MyNFT");
  const contract = await factory.deploy();

  console.log("Contract deployed to address:", contract.address);
};

task("deploy-nft", "Deploy the contract", main);
