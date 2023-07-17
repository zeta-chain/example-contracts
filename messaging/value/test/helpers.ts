import assert from "assert";
import { ethers, network } from "hardhat";
import {
  MultiChainValueMock,
  MultiChainValueMock__factory as MultiChainValueMockFactory,
} from "../typechain-types";

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
