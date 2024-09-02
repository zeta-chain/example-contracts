import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import GatewayABI from "@zetachain/protocol-contracts/abi/GatewayEVM.sol/GatewayEVM.json";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  const { utils } = hre.ethers;

  const gateway = new hre.ethers.Contract(
    args.gatewayEvm,
    GatewayABI.abi,
    signer
  );

  const message = utils.defaultAbiCoder.encode(["string"], [args.message]);
  try {
    const callTx = await gateway[
      "call(address,bytes,(address,bool,address,bytes,uint256))"
    ](
      args.receiver,
      message,
      {
        revertAddress: args.revertAddress,
        callOnRevert: args.callOnRevert,
        abortAddress: "0x0000000000000000000000000000000000000000", // not used
        revertMessage: utils.hexlify(utils.toUtf8Bytes(args.revertMessage)),
        onRevertGasLimit: args.onRevertGasLimit,
      },
      {
        gasPrice: args.gasPrice,
        gasLimit: args.gasLimit,
      }
    );
    await callTx.wait();
  } catch (e) {
    console.error("Transaction error:", e);
  }
};

task("evm-call", "Call a universal app", main)
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
  .addOptionalParam("revertMessage", "Revert message", "0x");
