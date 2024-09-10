import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import GatewayABI from "@zetachain/protocol-contracts/abi/GatewayEVM.sol/GatewayEVM.json";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();

  const gateway = new hre.ethers.Contract(
    args.gatewayEvm,
    GatewayABI.abi,
    signer
  );

  // const revertMessageBytes = hre.ethers.utils.toUtf8Bytes(args.revertMessage);

  // if (!hre.ethers.utils.isAddress(args.message)) {
  //   throw new Error("Invalid address");
  // }
  const message = hre.ethers.utils.defaultAbiCoder.encode(
    ["string"],
    [args.message]
  ); // this is the address of the recipient contract (VaultManager)

  try {
    const callTx = await gateway[
      "depositAndCall(address,bytes,(address,bool,address,bytes,uint256))"
    ](
      args.receiver,
      message,
      {
        revertAddress: args.revertAddress,
        callOnRevert: args.callOnRevert,
        abortAddress: "0x0000000000000000000000000000000000000000", // not used
        revertMessage: hre.ethers.utils.hexlify(hre.ethers.utils.toUtf8Bytes(args.revertMessage)),
        onRevertGasLimit: args.onRevertGasLimit,
      },
      {
        gasPrice: args.gasPrice,
        gasLimit: args.gasLimit,
        value: hre.ethers.utils.parseEther(args.amount),
      }
    );
    await callTx.wait();
  } catch (e) {
    console.error("Transaction error:", e);
  }
};

task("deposit-and-call", "Deposit tokens to and call a universal app", main)
  .addParam("message")
  .addParam("receiver", "Receiver address on ZetaChain")
  .addOptionalParam(
    "gatewayEvm",
    "contract address of gateway on EVM",
    "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
  )
  .addFlag("callOnRevert", "Whether to call on revert")
  .addOptionalParam(
    "revertAddress",
    "Revert address",
    "0x0000000000000000000000000000000000000000"
  )
  .addOptionalParam(
    "gasPrice",
    "The gas price for the transaction",
    10000000000,
    types.int
  )
  .addOptionalParam(
    "gasLimit",
    "The gas limit for the transaction",
    7000000,
    types.int
  )
  .addOptionalParam(
    "onRevertGasLimit",
    "The gas limit for the revert transaction",
    7000000,
    types.int
  )
  .addOptionalParam("revertMessage", "Revert message", "0x")
  .addParam("amount", "amount of ETH to send with the transaction");