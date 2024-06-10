import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();

  const factory = await hre.ethers.getContractFactory("MyNFT");
  const contract = factory.attach(args.nft);

  const tx = await contract.connect(signer).mintTo(args.recipient);
  await tx.wait();

  console.log(tx.hash);
};

task("mint", "Mint", main)
  .addParam("nft", "Contract address")
  .addParam("recipient");
