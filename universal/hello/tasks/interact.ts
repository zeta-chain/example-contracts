import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import GatewayABI from "@zetachain/protocol-contracts/abi/GatewayEVM.sol/GatewayEVM.json";
import { utils } from "ethers";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();

  const gateway = new hre.ethers.Contract(
    args.gatewayEVM,
    GatewayABI.abi,
    signer
  );

  const message = hre.ethers.utils.defaultAbiCoder.encode(
    ["string"],
    [args.name]
  );
  try {
    const callTx = await gateway.call(
      args.contract,
      message,
      {
        revertAddress: "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
        callOnRevert: true,
        abortAddress: "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
        revertMessage: "0x",
      },
      {
        gasPrice: 10000000000,
        gasLimit: 6721975,
      }
    );
    await callTx.wait();
    console.log("Contract on ZetaChain called from EVM");
  } catch (e) {
    console.error("Error calling contract:", e);
  }
};

task("interact", "calls zevm zcontract from evm account", main)
  .addParam("name")
  .addParam("contract", "contract address of a universal app on ZetaChain")
  .addOptionalParam(
    "gatewayEVM",
    "contract address of gateway on EVM",
    "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
  );
