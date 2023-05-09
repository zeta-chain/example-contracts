import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getAddress } from "@zetachain/addresses";

const contractName = "CrossChainMessage";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const connectorAddress = getAddress({
    address: "connector",
    networkName: hre.network.name,
    zetaNetwork: "athens",
  });
  const zetaTokenAddress = getAddress({
    address: "zetaToken",
    networkName: hre.network.name,
    zetaNetwork: "athens",
  });
  const zetaTokenConsumer = "0xa67b03930eb53d0462dCc0835e97964C062042fb";
  const factory = await hre.ethers.getContractFactory(contractName);
  const contract = await factory.deploy(
    connectorAddress,
    zetaTokenAddress,
    zetaTokenConsumer
  );
  await contract.deployed();

  // const encodedCrossChainAddress = hre.ethers.utils.solidityPack(
  //   ["address"],
  //   [THE_SAME_CONTRACT_ON_OTHER_CHAIN]
  // );
  // await (
  //   await contract.setInteractorByChainId(
  //     5,
  //     encodedCrossChainAddress
  //   )
  // ).wait();

  console.log(`🚀 Successfully deployed contract.
📜 Contract address: ${contract.address}
`);
};

task("deploy", "Deploy the contract").setAction(main);
