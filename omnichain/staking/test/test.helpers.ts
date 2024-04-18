import { parseEther, parseUnits } from "@ethersproject/units";
import { ethers } from "hardhat";

import {
  MockSystemContract,
  MockSystemContract__factory,
  MockZRC20,
  MockZRC20__factory,
} from "../typechain-types";

const zeroAddress = "0x0000000000000000000000000000000000000000";

interface EvmSetupResult {
  ZRC20Contracts: MockZRC20[];
  systemContract: MockSystemContract;
}

export const evmSetup = async (
  gasTokenAddr: string
): Promise<EvmSetupResult> => {
  const [signer] = await ethers.getSigners();

  const ZRC20Factory = (await ethers.getContractFactory(
    "MockZRC20"
  )) as MockZRC20__factory;

  const tokenContract1 = (await ZRC20Factory.deploy(
    parseUnits("1000000"),
    "gETH",
    "gETH"
  )) as MockZRC20;

  const tokenContract2 = (await ZRC20Factory.deploy(
    parseUnits("1000000"),
    "tBTC",
    "tBTC"
  )) as MockZRC20;

  const ZRC20Contracts = [tokenContract1, tokenContract2];

  const SystemContractFactory = (await ethers.getContractFactory(
    "MockSystemContract"
  )) as MockSystemContract__factory;

  const systemContract = (await SystemContractFactory.deploy(
    gasTokenAddr,
    zeroAddress,
    zeroAddress
  )) as MockSystemContract;

  await systemContract.setGasCoinZRC20(5, tokenContract1.address);
  await systemContract.setGasCoinZRC20(18332, tokenContract2.address);

  await tokenContract1.setGasFeeAddress(tokenContract1.address);
  await tokenContract1.setGasFee(parseEther("0.01"));

  await tokenContract2.setGasFeeAddress(tokenContract2.address);
  await tokenContract2.setGasFee(parseEther("0.01"));

  return { ZRC20Contracts, systemContract };
};
