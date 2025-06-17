import { ethers } from "ethers";

import { createCommand, createRevertOptions, getAbi } from "../common";
import ZRC20ABI from "@zetachain/protocol-contracts/abi/ZRC20.sol/ZRC20.json";

const main = async (options: any) => {
  const provider = new ethers.JsonRpcProvider(options.rpc);
  const signer = new ethers.Wallet(options.privateKey, provider);

  const { abi } = getAbi(options.name);
  const contract = new ethers.Contract(options.contract, abi, signer);

  const zrc20 = new ethers.Contract(options.zrc20, ZRC20ABI.abi, signer);
  const [gasZRC20, gasFee] = await zrc20.withdrawGasFee();

  const zrc20TransferTx = await zrc20.approve(options.contract, gasFee);

  await zrc20TransferTx.wait();

  const decimals = await zrc20.decimals();
  if (gasZRC20 === options.zrc20) {
    const targetTokenApprove = await zrc20.approve(
      options.contract,
      gasFee + ethers.parseUnits(options.amount, decimals)
    );
    await targetTokenApprove.wait();
  } else {
    const targetTokenApprove = await zrc20.approve(
      options.contract,
      ethers.parseUnits(options.amount, decimals)
    );
    await targetTokenApprove.wait();
    const gasFeeApprove = await gasZRC20.approve(options.contract, gasFee);
    await gasFeeApprove.wait();
  }

  const tx = await contract.withdraw(
    options.receiver,
    ethers.parseUnits(options.amount, decimals),
    options.zrc20,
    createRevertOptions(options)
  );
  await tx.wait();

  console.log(`✅ Transaction sent: ${tx.hash}`);
};

export const universalWithdrawCommand = createCommand("universal-withdraw")
  .requiredOption("--amount <number>", "Amount to withdraw")
  .option("--zrc20 <address>", "The address of ZRC-20 to pay fees")
  .action(main);
