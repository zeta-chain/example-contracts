import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther } from "@ethersproject/units";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const { contract, destination } = args;

  const CrossChainMessage = await hre.ethers.getContractFactory(
    "CrossChainMessage"
  );
  const crossChainMessage = CrossChainMessage.attach(contract);

  const tx = await crossChainMessage
    .connect(signer)
    .sendHelloWorld(97, { value: parseEther("50") });

  const receipt = await tx.wait();
  console.log("sendHelloWorld transaction mined:", receipt.transactionHash);
};

task("message", "Send tokens to the recipient address")
  .addParam("contract")
  .addParam("destination")
  .setAction(main);
