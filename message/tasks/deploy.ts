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
      contracts[networkName] = await deployContract(hre, networkName);
    })
  );

  for (const source in contracts) {
    await setInteractors(hre, source, contracts);
  }
};

const initWallet = (hre: HardhatRuntimeEnvironment, networkName: string) => {
  const { url } = hre.config.networks[networkName];
  const provider = new ethers.providers.JsonRpcProvider(url);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);

  return wallet;
};

const deployContract = async (
  hre: HardhatRuntimeEnvironment,
  networkName: string
) => {
  const wallet = initWallet(hre, networkName);
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
  console.log(`
🚀 Successfully deployed contract on ${networkName}.
📜 Contract address: ${contract.address}
`);
  return contract.address;
};

const setInteractors = async (
  hre: HardhatRuntimeEnvironment,
  source: string,
  contracts: { [key: string]: string }
) => {
  console.log(`
🔗 Setting interactors for a contract on ${source}`);
  const sourceContractAddress = contracts[source];
  const wallet = initWallet(hre, source);
  const { abi, bytecode } = await hre.artifacts.readArtifact(contractName);
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = factory.attach(sourceContractAddress);
  for (const destination in contracts) {
    if (destination === source) continue;
    const destinationContract = hre.ethers.utils.solidityPack(
      ["address"],
      [contracts[destination]]
    );
    const chainId = getChainId(destination as any);
    await (
      await contract.setInteractorByChainId(chainId, destinationContract)
    ).wait();
    console.log(
      `✅ Interactor address for ${chainId} (${destination}) is set to ${destinationContract}`
    );
  }
};

task("deploy", "Deploy the contract").addParam("networks").setAction(main);
