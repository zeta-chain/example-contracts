import {
  ZetaEth,
  ZetaEth__factory as ZetaEthFactory,
} from "@zetachain/interfaces/typechain-types";
import assert from "assert";
import { ethers, network } from "hardhat";

import {
  MultiChainValue__factory as MultiChainValueFactory,
  MultiChainValueMock,
  MultiChainValueMock__factory as MultiChainValueMockFactory,
  ZetaConnectorMockValue,
  ZetaConnectorMockValue__factory as ZetaConnectorMockValueFactory,
} from "../typechain-types";
import { BaseContract, ContractFactory } from "ethers";

export type GetContractParams<Factory extends ContractFactory> =
  | {
      deployParams: Parameters<Factory["deploy"]>;
      existingContractAddress?: null;
    }
  | {
      deployParams?: null;
      existingContractAddress: string;
    };

export const getContract = async <
  Factory extends ContractFactory,
  Contract extends BaseContract
>({
  contractName,
  deployParams,
  existingContractAddress,
}: GetContractParams<Factory> & {
  contractName: string;
}): Promise<Contract> => {
  const ContractFactory = (await ethers.getContractFactory(
    contractName
  )) as Factory;

  const isGetExistingContract = Boolean(existingContractAddress);
  if (isGetExistingContract) {
    console.log(
      "Getting existing contract from address:",
      existingContractAddress
    );
    return ContractFactory.attach(existingContractAddress!) as Contract;
  }

  const contract = (await ContractFactory.deploy(...deployParams!)) as Contract;
  await contract.deployed();

  return contract;
};

/**
 * @description only for testing or local environment
 */
export const deployMultiChainValueMock = async ({
  zetaConnectorMockAddress,
  zetaTokenMockAddress,
}: {
  zetaConnectorMockAddress: string;
  zetaTokenMockAddress: string;
}) => {
  const isLocalEnvironment = network.name === "hardhat";

  assert(
    isLocalEnvironment,
    "This function is only intended to be used in the local environment"
  );

  const Factory = (await ethers.getContractFactory(
    "MultiChainValueMock"
  )) as MultiChainValueMockFactory;

  const multiChainValueContract = (await Factory.deploy(
    zetaConnectorMockAddress,
    zetaTokenMockAddress
  )) as MultiChainValueMock;

  await multiChainValueContract.deployed();

  return multiChainValueContract;
};

export const deployZetaConnectorMock = async () => {
  const Factory = (await ethers.getContractFactory(
    "ZetaConnectorMockValue"
  )) as ZetaConnectorMockValueFactory;

  const zetaConnectorMockContract =
    (await Factory.deploy()) as ZetaConnectorMockValue;

  await zetaConnectorMockContract.deployed();

  return zetaConnectorMockContract;
};

export const deployZetaEthMock = async () => {
  const Factory = (await ethers.getContractFactory(
    "ZetaEthMock"
  )) as ZetaEthFactory;

  const zetaConnectorMockContract = (await Factory.deploy(100_000)) as ZetaEth;

  await zetaConnectorMockContract.deployed();

  return zetaConnectorMockContract;
};
