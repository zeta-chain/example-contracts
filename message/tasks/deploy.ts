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
  const zetaTokenConsumer = "0xCa7185cA7AB06fA60060d4D65C50b6883cc70419";
  const factory = await hre.ethers.getContractFactory(contractName);
  const contract = await factory.deploy(
    connectorAddress,
    zetaTokenAddress,
    zetaTokenConsumer
  );
  await contract.deployed();

  console.log(`🚀 Successfully deployed contract.
📜 Contract address: ${contract.address}
`);
};

task("deploy", "Deploy the contract").setAction(main);
