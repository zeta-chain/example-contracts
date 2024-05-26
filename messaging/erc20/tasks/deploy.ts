import { getAddress } from "@zetachain/protocol-contracts";
import { ethers } from "ethers";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import type { ParamChainName } from "@zetachain/protocol-contracts";

const contractName = "CrossChainERC20";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const networks = args.networks.split(",");
  const contracts: { [key: string]: string } = {};
  await Promise.all(
    networks.map(async (networkName: ParamChainName) => {
      contracts[networkName] = await deployContract(
        hre,
        networkName,
        args.json,
        args.gasLimit
      );
    })
  );

  for (const source in contracts) {
    await setInteractors(
      hre,
      source as ParamChainName,
      contracts,
      args.json,
      args.gasLimit
    );
  }

  if (args.json) {
    console.log(JSON.stringify(contracts, null, 2));
  }
};

const initWallet = (
  hre: HardhatRuntimeEnvironment,
  networkName: ParamChainName
) => {
  const { url } = hre.config.networks[networkName] as any;
  const provider = new ethers.providers.JsonRpcProvider(url);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);

  return wallet;
};

const deployContract = async (
  hre: HardhatRuntimeEnvironment,
  networkName: ParamChainName,
  json: boolean = false,
  gasLimit: number
) => {
  const wallet = initWallet(hre, networkName);

  const connector = getAddress("connector", networkName);
  const zetaToken = getAddress("zetaToken", networkName);
  const zetaTokenConsumer = getAddress("zetaTokenConsumerUniV3", networkName);

  const { abi, bytecode } = await hre.artifacts.readArtifact(contractName);
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy(connector, zetaToken, zetaTokenConsumer, { gasLimit });

  await contract.deployed();
  if (!json) {
    console.log(`
🚀 Successfully deployed contract on ${networkName}
📜 Contract address: ${contract.address}`);
  }
  return contract.address;
};

const setInteractors = async (
  hre: HardhatRuntimeEnvironment,
  source: ParamChainName,
  contracts: { [key: string]: string },
  json: boolean = false,
  gasLimit: number
) => {
  if (!json) {
    console.log(`
🔗 Setting interactors for a contract on ${source}`);
  }
  const wallet = initWallet(hre, source);

  const { abi, bytecode } = await hre.artifacts.readArtifact(contractName);
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = factory.attach(contracts[source]);

  for (const counterparty in contracts) {
    if (counterparty === source) continue;

    const counterpartyContract = ethers.utils.solidityPack(
      ["address"],
      [contracts[counterparty]]
    );
    const chainId = hre.config.networks[counterparty].chainId;
    await (
      await contract.setInteractorByChainId(chainId, counterpartyContract, {
        gasLimit,
      })
    ).wait();
    if (!json) {
      console.log(
        `✅ Interactor address for ${chainId} (${counterparty}) is set to ${counterpartyContract}`
      );
    }
  }
};

task("deploy", "Deploy the contract", main)
  .addParam("networks", "Comma separated list of networks to deploy to")
  .addOptionalParam("gasLimit", "Gas limit", 10000000, types.int)
  .addFlag("json", "Output JSON");
