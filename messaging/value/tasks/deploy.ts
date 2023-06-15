import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getAddress } from "@zetachain/protocol-contracts/lib";
import { ethers } from "ethers";

const contractName = "MultiChainValue";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const networks = args.networks.split(",");
  // A mapping between network names and deployed contract addresses.
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

// Initialize a wallet using a network configuration and a private key from
// environment variables.
const initWallet = (hre: HardhatRuntimeEnvironment, networkName: string) => {
  const { url } = hre.config.networks[networkName];
  const provider = new ethers.providers.JsonRpcProvider(url);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);

  return wallet;
};

// Deploy the contract on the specified network. deployContract reads the
// contract artifact, creates a contract factory, and deploys the contract using
// that factory.
const deployContract = async (
  hre: HardhatRuntimeEnvironment,
  networkName: string
) => {
  const wallet = initWallet(hre, networkName);
  const connectorAddress = getAddress("connector", networkName as any);
  const zetaTokenAddress = getAddress("zetaToken", networkName as any);

  const { abi, bytecode } = await hre.artifacts.readArtifact(contractName);
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);

  const contract = await factory.deploy(connectorAddress, zetaTokenAddress);

  await contract.deployed();
  console.log(`
🚀 Successfully deployed contract on ${networkName}.
📜 Contract address: ${contract.address}
`);
  return contract.address;
};

// Set interactors for a contract. setInteractors attaches to the contract
// deployed at the specified address, and for every other network, sets the
// deployed contract's address as an interactor.
const setInteractors = async (
  hre: HardhatRuntimeEnvironment,
  source: string,
  contracts: { [key: string]: string }
) => {
  console.log(`
🔗 Setting interactors for a contract on ${source}`);
  const wallet = initWallet(hre, source);

  const { abi, bytecode } = await hre.artifacts.readArtifact(contractName);
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = factory.attach(contracts[source]);

  for (const counterparty in contracts) {
    // Skip the destination network if it's the same as the source network.
    // For example, we don't need to set an interactor for a contract on
    // Goerli if the destination network is also Goerli.
    if (counterparty === source) continue;

    const counterpartyContract = hre.ethers.utils.solidityPack(
      ["address"],
      [contracts[counterparty]]
    );
    const chainId = hre.config.networks[counterparty].chainId;
    await (
      await contract.setInteractorByChainId(chainId, counterpartyContract)
    ).wait();
    // Adding a counterparty chain ID to the list of available chain IDs.
    (await contract.connect(wallet).addAvailableChainId(chainId)).wait();
    console.log(
      `✅ Interactor address for ${chainId} (${counterparty}) is set to ${counterpartyContract}. ${counterparty} added as an available chain.`
    );
  }
};

const descTask = `Deploy the contract`;
const descNetworksFlag = `Comma separated list of networks to deploy to`;

task("deploy", descTask).addParam("networks", descNetworksFlag).setAction(main);
