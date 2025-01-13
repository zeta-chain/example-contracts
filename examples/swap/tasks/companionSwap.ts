import ERC20_ABI from "@openzeppelin/contracts/build/contracts/ERC20.json";
import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { isInputAmountSufficient } from "./evmSwap";
import { ZetaChainClient } from "@zetachain/toolkit/client";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const { ethers } = hre;
  const [signer] = await ethers.getSigners();

  const factory = (await hre.ethers.getContractFactory("SwapCompanion")) as any;
  const contract = factory.attach(args.contract).connect(signer);

  const client = new ZetaChainClient({ network: "testnet", signer });

  if (!args.skipChecks) {
    await isInputAmountSufficient({
      hre,
      client,
      amount: args.amount,
      erc20: args.erc20,
      target: args.target,
    });
  }

  let tx;
  if (args.erc20) {
    const erc20Contract = new ethers.Contract(
      args.erc20,
      ERC20_ABI.abi,
      signer
    );
    const decimals = await erc20Contract.decimals();
    const value = hre.ethers.utils.parseUnits(args.amount, decimals);
    const approveTx = await erc20Contract
      .connect(signer)
      .approve(args.contract, value);
    await approveTx.wait();

    tx = await contract.swapERC20(
      args.universalContract,
      args.target,
      args.recipient,
      args.amount,
      args.erc20,
      args.withdraw
    );
  } else {
    const value = hre.ethers.utils.parseEther(args.amount);
    tx = await contract.swapNativeGas(
      args.universalContract,
      args.target,
      args.recipient,
      args.withdraw,
      { value }
    );
  }

  await tx.wait();
  console.log(`Transaction hash: ${tx.hash}`);
};

task("companion-swap", "Swap native gas tokens", main)
  .addParam("contract", "Contract address")
  .addParam("universalContract", "Universal contract address")
  .addOptionalParam(
    "withdraw",
    "Withdraw to destination or keep token on ZetaChain",
    true,
    types.boolean
  )
  .addOptionalParam("erc20", "ERC-20 token address")
  .addParam("target", "ZRC-20 address of the token to swap for")
  .addParam("amount", "Amount of tokens to swap")
  .addFlag("skipChecks", "Skip checks for minimum amount")
  .addParam("recipient", "Recipient address");
