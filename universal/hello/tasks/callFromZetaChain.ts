import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();

  const contractArtifact = await hre.artifacts.readArtifact("Hello");
  const contract = new hre.ethers.Contract(
    args.contract,
    contractArtifact.abi,
    signer
  );

  const zrc20Artifact = await hre.artifacts.readArtifact("IZRC20");
  const zrc20 = new hre.ethers.Contract(args.zrc20, zrc20Artifact.abi, signer);

  const revertMessageBytes = hre.ethers.utils.toUtf8Bytes(args.revertMessage);

  const encodedFunctionCall = hre.ethers.utils.defaultAbiCoder.encode(
    ["string"],
    [args.message]
  );

  const message = hre.ethers.utils.hexlify(
    hre.ethers.utils.concat([
      hre.ethers.utils.toUtf8Bytes("hello(string)"),
      encodedFunctionCall,
    ])
  );

  try {
    const zrc20TransferTx = await zrc20.transfer(args.contract, 500_000_000, {
      gasPrice: 10000000000,
      gasLimit: 7000000,
    });
    await zrc20TransferTx.wait();

    const tx = await contract.callFromZetaChain(
      hre.ethers.utils.hexlify(args.receiver),
      args.zrc20,
      message,
      args.gasLimit,
      {
        revertAddress: args.revertAddress,
        callOnRevert: args.callOnRevert,
        abortAddress: "0x0000000000000000000000000000000000000000", // not used
        revertMessage: hre.ethers.utils.hexlify(revertMessageBytes),
      },
      {
        gasPrice: 10000000000,
        gasLimit: 7000000,
      }
    );

    await tx.wait();
    console.log("Successfully called the contract on ZetaChain!");
  } catch (e) {
    console.error("Error calling contract:", e);
  }
};

task(
  "call-from-zetachain",
  "Calls the callFromZetaChain function on a universal app",
  main
)
  .addParam("message", "A message")
  .addParam("contract", "The address of the universal app on ZetaChain")
  .addOptionalParam(
    "zrc20",
    "The address of the ZRC20 token",
    "0x9fd96203f7b22bCF72d9DCb40ff98302376cE09c"
  )
  .addParam("gasLimit", "The gas limit for the transaction", 7000000, types.int)
  .addFlag("callOnRevert", "Whether to call on revert")
  .addParam("revertAddress")
  .addParam("revertMessage")
  .addParam("receiver", "The address of the receiver contract on EVM");
