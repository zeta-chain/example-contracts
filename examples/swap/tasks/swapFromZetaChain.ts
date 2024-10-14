import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther } from "@ethersproject/units";
import { ethers } from "ethers";
import ZRC20 from "@zetachain/protocol-contracts/abi/ZRC20.sol/ZRC20.json";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();

  const factory = await hre.ethers.getContractFactory("SwapToAnyToken");
  const contract = factory.attach(args.contract);

  const zrc20 = new ethers.Contract(args.zrc20, ZRC20.abi, signer);

  const amount = parseEther(args.amount);

  const approval = await zrc20.approve(args.contract, amount);
  await approval.wait();

  const tx = await contract.swap(
    args.zrc20,
    amount,
    args.target,
    ethers.utils.arrayify(args.recipient),
    JSON.parse(args.withdraw)
  );

  await tx.wait();
  console.log(`Transaction hash: ${tx.hash}`);
};

task("swap-from-zetachain", "Swap tokens from ZetaChain", main)
  .addFlag("json", "Output JSON")
  .addParam("contract", "Contract address")
  .addParam("amount", "Token amount to send")
  .addParam("zrc20", "Input token address")
  .addParam("target", "Target token address")
  .addParam("recipient", "Recipient address")
  .addOptionalParam(
    "withdraw",
    "Withdraw tokens to destination chain",
    true,
    types.boolean
  );
