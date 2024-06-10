import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();

  const factory = await hre.ethers.getContractFactory("CrossChainMessage");
  const contract = factory.attach(args.contract);

  const value = hre.ethers.utils.parseEther(args.amount);

  const tx = await contract.connect(signer).participate(args.id, { value });
  await tx.wait();

  console.log(tx.hash);
};

task("participate", "", main)
  .addParam("contract", "Contract address")
  .addParam("id")
  .addParam("amount", "Token amount to send");
