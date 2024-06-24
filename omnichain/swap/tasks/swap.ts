import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther } from "@ethersproject/units";
import { ethers } from "ethers";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();

  const factory = await hre.ethers.getContractFactory("SwapToAnyToken");
  const contract = factory.attach(args.contract);

  const amount = parseEther(args.amount);
  const inputToken = args.inputToken;
  const targetToken = args.targetToken;
  const recipient = ethers.utils.arrayify(args.recipient);
  const withdraw = JSON.parse(args.withdraw);

  const erc20Factory = await hre.ethers.getContractFactory("ERC20");
  const inputTokenContract = erc20Factory.attach(args.inputToken);

  const approval = await inputTokenContract.approve(args.contract, amount);
  await approval.wait();

  const tx = await contract.swap(
    inputToken,
    amount,
    targetToken,
    recipient,
    withdraw
  );

  await tx.wait();
  console.log(`Transaction hash: ${tx.hash}`);
};

task("swap", "Sends a message from one chain to another.", main)
  .addFlag("json", "Output JSON")
  .addParam("contract", "Contract address")
  .addParam("amount", "Token amount to send")
  .addParam("inputToken", "Input token address")
  .addParam("targetToken", "Target token address")
  .addParam("recipient", "Recipient address")
  .addParam("withdraw", "Withdraw flag (true/false)")
  .setAction(main);
