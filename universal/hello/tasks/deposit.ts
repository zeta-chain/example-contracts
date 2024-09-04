import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import GatewayABI from "@zetachain/protocol-contracts/abi/GatewayEVM.sol/GatewayEVM.json";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();

  const gateway = new hre.ethers.Contract(
    args.gatewayEVM,
    GatewayABI.abi,
    signer
  );

  const revertMessageBytes = hre.ethers.utils.toUtf8Bytes(args.revertMessage);

  try {
    const callTx = await gateway[
      "deposit(address(address,bool,address,bytes))"
    ](
      args.contract,
      {
        revertAddress: args.revertAddress,
        callOnRevert: args.callOnRevert,
        abortAddress: "0x0000000000000000000000000000000000000000", // not used
        revertMessage: hre.ethers.utils.hexlify(revertMessageBytes),
      },
      {
        gasPrice: 10000000000,
        gasLimit: 7000000,
        value: hre.ethers.utils.parseEther(args.amount),
      }
    );
    await callTx.wait();
    console.log(
      `Contract on ZetaChain called from EVM with ${args.amount} ETH`
    );
  } catch (e) {
    console.error("Error calling contract:", e);
  }
};

task("deposit2", "Deposit tokens to a universal app", main)
  .addParam("contract", "contract address of a universal app on ZetaChain")
  .addOptionalParam(
    "gatewayEVM",
    "contract address of gateway on EVM",
    "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
  )
  .addFlag("callOnRevert", "Whether to call on revert")
  .addParam("revertAddress")
  .addParam("revertMessage")
  .addParam("amount", "amount of ETH to send with the transaction");
