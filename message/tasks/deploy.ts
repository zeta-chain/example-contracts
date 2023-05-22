import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getAddress, getChainId } from "@zetachain/addresses";
import { ethers } from "ethers";

const contractName = "CrossChainMessage";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const networks = args.networks.split(",");
  const contracts: { [key: string]: string } = {};
  await Promise.all(
    networks.map(async (networkName: string) => {
      console.log(`Deploying contract to ${networkName}`);
      const { url } = hre.config.networks[networkName];
      const provider = new ethers.providers.JsonRpcProvider(url);
      const wallet = new ethers.Wallet(
        process.env.PRIVATE_KEY as string,
        provider
      );
      const zetaNetwork = "athens";
      const connectorAddress = getAddress({
        address: "connector",
        networkName,
        zetaNetwork,
      });
      const zetaTokenAddress = getAddress({
        address: "zetaToken",
        networkName,
        zetaNetwork,
      });
      const zetaTokenConsumerV2 = getAddress({
        address: "zetaTokenConsumerUniV2",
        networkName,
        zetaNetwork,
      });
      const zetaTokenConsumerV3 = getAddress({
        address: "zetaTokenConsumerUniV3",
        networkName,
        zetaNetwork,
      });

      const { abi, bytecode } = await hre.artifacts.readArtifact(contractName);
      const factory = new ethers.ContractFactory(abi, bytecode, wallet);
      const contract = await factory.deploy(
        connectorAddress,
        zetaTokenAddress,
        zetaTokenConsumerV2 || zetaTokenConsumerV3
      );

      await contract.deployed();
      contracts[networkName] = contract.address;
      console.log(`Contract deployed at: ${contract.address}`);
    })
  );

  for (const source in contracts) {
    const sourceContractAddress = contracts[source];
    const { url } = hre.config.networks[source];
    const provider = new ethers.providers.JsonRpcProvider(url);
    const wallet = new ethers.Wallet(
      process.env.PRIVATE_KEY as string,
      provider
    );
    const { abi, bytecode } = await hre.artifacts.readArtifact(contractName);
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = factory.attach(sourceContractAddress);
    for (const destination in contracts) {
      const destinationContractAdddress = hre.ethers.utils.solidityPack(
        ["address"],
        [contracts[destination]]
      );
      await (
        await contract.setInteractorByChainId(
          getChainId(destination as any),
          destinationContractAdddress
        )
      ).wait();
    }
  }
};

task("deploy", "Deploy the contract").addParam("networks").setAction(main);
