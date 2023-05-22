import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getAddress } from "@zetachain/addresses";
import { exec } from "child_process";
import { ethers } from "ethers";

const contractName = "CrossChainMessage";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const networks = args.networks.split(",");
  await Promise.all(
    networks.map(async (networkName: string) => {
      console.log(`Deploying contract to ${networkName}`);
      const { url } = hre.config.networks[networkName];
      const provider = new ethers.providers.JsonRpcProvider(url);
      const wallet = new ethers.Wallet(
        process.env.PRIVATE_KEY as string,
        provider
      );

      const connectorAddress = getAddress({
        address: "connector",
        networkName,
        zetaNetwork: "athens",
      });
      const zetaTokenAddress = getAddress({
        address: "zetaToken",
        networkName,
        zetaNetwork: "athens",
      });
      const zetaTokenConsumerV2 = getAddress({
        address: "zetaTokenConsumerUniV2",
        networkName,
        zetaNetwork: "athens",
      });
      console.log("zetaTokenConsumerV2", zetaTokenConsumerV2);
      const zetaTokenConsumerV3 = getAddress({
        address: "zetaTokenConsumerUniV3",
        networkName,
        zetaNetwork: "athens",
      });
      console.log("zetaTokenConsumerV3", zetaTokenConsumerV3);
      const { abi, bytecode } = await hre.artifacts.readArtifact(contractName);

      const factory = new ethers.ContractFactory(abi, bytecode, wallet);

      const contract = await factory.deploy(
        connectorAddress,
        zetaTokenAddress,
        zetaTokenConsumerV2 || zetaTokenConsumerV3
      );

      await contract.deployed();
      console.log(`Contract deployed at: ${contract.address}`);
    })
  );
};

task("deploy", "Deploy the contract").addParam("networks").setAction(main);
