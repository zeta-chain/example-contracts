import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const factory = await hre.ethers.getContractFactory("Caller");
  const contract = factory.attach(args.caller);

  const tx = await contract.deposit(args.contract, {
    value: hre.ethers.utils.parseUnits(args.amount, 18),
  });
  await tx.wait();

  console.log(tx.hash);
};

task("deposit-caller", "")
  .addParam("contract", "Universal app contract address")
  .addParam("caller", "Contract address")
  .addParam("amount", "The amount of ETH to send")
  .setAction(main);
