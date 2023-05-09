import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getAddress } from "@zetachain/addresses";

// const contractName = "CrossChainMessage";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);
  const { contract } = args;

  // Get the CrossChainMessage contract instance
  const CrossChainMessage = await hre.ethers.getContractFactory(
    "CrossChainMessage"
  );
  const crossChainMessage = CrossChainMessage.attach(contract);
  const encodedCrossChainAddress = hre.ethers.utils.solidityPack(
    ["address"],
    ["0x6EFDe764cEA539Cd32cB4B608E5871c67D9Ad4F2"]
  );
  await (
    await crossChainMessage.setInteractorByChainId(97, encodedCrossChainAddress)
  ).wait();
};

task("interactor", "").addParam("contract").setAction(main);
