import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import GatewayABI from "@zetachain/protocol-contracts/abi/GatewayZEVM.sol/GatewayZEVM.json";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  const { utils } = hre.ethers;

  const gateway = new hre.ethers.Contract(
    args.gatewayZetaChain,
    GatewayABI.abi,
    signer
  );

  const zrc20Artifact = await hre.artifacts.readArtifact("IZRC20");
  const zrc20 = new hre.ethers.Contract(args.zrc20, zrc20Artifact.abi, signer);

  const functionSignature = utils.id(args.function).slice(0, 10);
  const encodedParameters = utils.defaultAbiCoder.encode(
    JSON.parse(args.types),
    args.values
  );

  const message = utils.hexlify(
    utils.concat([functionSignature, encodedParameters])
  );

  try {
    const zrc20TransferTx = await zrc20.approve(
      args.gatewayZetaChain,
      utils.parseUnits(args.amount, 18),
      {
        gasPrice: 10000000000,
        gasLimit: 7000000,
      }
    );
    await zrc20TransferTx.wait();
    const tx = await gateway[
      "call(bytes,address,bytes,uint256,(address,bool,address,bytes,uint256))"
    ](
      utils.hexlify(args.receiver),
      args.zrc20,
      message,
      args.gasLimit,
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

    await tx.wait();
    console.log("Successfully called the contract on ZetaChain!");
  } catch (e) {
    console.error("Error calling contract:", e);
  }
};

task(
  "zetachain-call",
  "Calls the callFromZetaChain function on a universal app",
  main
)
  .addOptionalParam(
    "gatewayZetaChain",
    "contract address of gateway on EVM",
    "0x610178dA211FEF7D417bC0e6FeD39F05609AD788"
  )
  .addParam("contract", "The address of the universal app on ZetaChain")
  .addOptionalParam(
    "zrc20",
    "The address of the ZRC20 token",
    "0x9fd96203f7b22bCF72d9DCb40ff98302376cE09c"
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
  .addOptionalParam("revertMessage", "Revert message", "0x")
  .addParam(
    "receiver",
    "The address of the receiver contract on a connected chain"
  )
  .addOptionalParam(
    "onRevertGasLimit",
    "The gas limit for the revert transaction",
    7000000,
    types.int
  )
  .addParam("function", "Function to call (example: 'hello(string)')")
  .addParam("amount", "The amount of tokens to send")
  .addParam("types", "The types of the parameters (example: ['string'])")
  .addVariadicPositionalParam("values", "The values of the parameters");
