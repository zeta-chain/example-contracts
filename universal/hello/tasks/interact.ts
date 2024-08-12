import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import GatewayABI from "@zetachain/protocol-contracts/abi/prototypes/evm/GatewayEVM.sol/GatewayEVM.json";

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
    const callTx = await gateway.call(args.contract, message);
    await callTx.wait();
    console.log("Contract on ZetaChain called from EVM");
  } catch (e) {
    console.error("Error calling TestZContract:", e);
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
