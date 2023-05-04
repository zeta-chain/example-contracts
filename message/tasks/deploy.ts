import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const contractName = "CrossChainMessage";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const factory = await hre.ethers.getContractFactory(contractName);
  const contract = await factory.deploy(
    "0x000054d3A0Bc83Ec7808F52fCdC28A96c89F6C5c",
    "0x000080383847bd75f91c168269aa74004877592f",
    "0xa67b03930eb53d0462dCc0835e97964C062042fb"
  );
  await contract.deployed();

  console.log(`🚀 Successfully deployed contract.
📜 Contract address: ${contract.address}
`);
};

task("deploy", "Deploy the contract").setAction(main);
