import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import ZRC20ABI from "@zetachain/protocol-contracts/abi/ZRC20.sol/ZRC20.json";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const { ethers } = hre;
  const [signer] = await ethers.getSigners();

  const value = ethers.utils.parseUnits(args.amount, 18);
  const gasAmount =
    args.gasAmount && ethers.utils.parseUnits(args.gasAmount, 18);

  const txOptions = {
    gasPrice: args.txOptionsGasPrice,
    gasLimit: args.txOptionsGasLimit,
  };
  let tx;

  let contract;
  try {
    contract = await ethers.getContractAt("Universal", args.from);
    await (contract as any).isUniversal();
    const gasLimit = hre.ethers.BigNumber.from(args.txOptionsGasLimit);
    const zrc20 = new ethers.Contract(args.to, ZRC20ABI.abi, signer);
    const [, gasFee] = await zrc20.withdrawGasFeeWithGasLimit(gasLimit);
    const zrc20TransferTx = await zrc20.approve(args.from, gasFee, txOptions);
    await zrc20TransferTx.wait();
    const tokenApprove = await contract.approve(args.from, value);
    await tokenApprove.wait();
  } catch (e) {
    contract = await ethers.getContractAt("Connected", args.from);
  }

  const receiver = args.receiver || signer.address;

  tx = await (contract as any).transferCrossChain(
    args.to,
    receiver,
    args.amount,
    { ...txOptions, value: gasAmount }
  );

  await tx.wait();
  if (args.json) {
    console.log(
      JSON.stringify({
        contractAddress: args.from,
        transferTransactionHash: tx.hash,
        sender: signer.address,
        tokenId: args.tokenId,
      })
    );
  } else {
    console.log(`🚀 Successfully transferred NFT to the contract.
📜 Contract address: ${args.from}
🖼 NFT Contract address: ${args.nftContract}
🆔 Token ID: ${args.tokenId}
🔗 Transaction hash: ${tx.hash}`);
  }
};

task("transfer", "Transfer and lock an NFT", main)
  .addParam("from", "The contract being transferred from")
  .addOptionalParam(
    "txOptionsGasPrice",
    "The gas price for the transaction",
    10000000000,
    types.int
  )
  .addOptionalParam(
    "txOptionsGasLimit",
    "The gas limit for the transaction",
    7000000,
    types.int
  )
  .addFlag("callOnRevert", "Whether to call on revert")
  .addOptionalParam(
    "revertAddress",
    "The address to call on revert",
    "0x0000000000000000000000000000000000000000"
  )
  .addOptionalParam("revertMessage", "The message to send on revert", "0x")
  .addOptionalParam(
    "onRevertGasLimit",
    "The gas limit for the revert transaction",
    7000000,
    types.int
  )
  .addOptionalParam("receiver", "The receiver of the token")
  .addFlag("isArbitraryCall", "Whether the call is arbitrary")
  .addFlag("json", "Output the result in JSON format")
  .addOptionalParam(
    "to",
    "ZRC-20 of the gas token of the destination chain",
    "0x0000000000000000000000000000000000000000"
  )
  .addOptionalParam("gasAmount", "The amount for gas")
  .addParam("amount", "The amount of gas to transfer", "0");
