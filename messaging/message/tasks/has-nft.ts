import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();

  const factory = await hre.ethers.getContractFactory("CrossChainMessage");
  const contract = factory.attach(args.contract);

  const tx = await contract.connect(signer).hasNFT(args.account, args.nft);

  console.log(tx);
};

task("has-nft", "", main)
  .addParam("contract", "Contract address")
  .addParam("account")
  .addParam("nft", "NFT contract address");
