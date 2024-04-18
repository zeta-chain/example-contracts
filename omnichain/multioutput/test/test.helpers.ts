import { MaxUint256 } from "@ethersproject/constants";
import { parseEther, parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

import {
  MockSystemContract,
  MockSystemContract__factory,
  MockZRC20,
  MockZRC20__factory,
  TestUniswapRouter,
  TestUniswapRouter__factory,
  UniswapV2Factory,
  UniswapV2Factory__factory,
  WZETA,
  WZETA__factory,
} from "../typechain-types";

export const deployWZETA = async (
  signer: SignerWithAddress
): Promise<WZETA> => {
  const WZETAFactory = (await ethers.getContractFactory(
    "WZETA"
  )) as WZETA__factory;
  const wZETAContract = (await WZETAFactory.deploy()) as WZETA;
  await wZETAContract.deployed();
  await wZETAContract.deposit({ value: parseEther("10") });
  return wZETAContract;
};

interface UniswapDeployResult {
  uniswapFactory: UniswapV2Factory;
  uniswapRouter: TestUniswapRouter;
}

export const deployUniswap = async (
  signer: SignerWithAddress,
  wZETA: string
): Promise<UniswapDeployResult> => {
  const UniswapV2Factory = (await ethers.getContractFactory(
    "UniswapV2Factory"
  )) as UniswapV2Factory__factory;
  const uniswapFactory = (await UniswapV2Factory.deploy(
    signer.address
  )) as UniswapV2Factory;
  await uniswapFactory.deployed();

  const UniswapRouter = (await ethers.getContractFactory(
    "TestUniswapRouter"
  )) as TestUniswapRouter__factory;
  const uniswapRouter = (await UniswapRouter.deploy(
    uniswapFactory.address,
    wZETA
  )) as TestUniswapRouter;
  await uniswapRouter.deployed();

  return { uniswapFactory, uniswapRouter };
};

const addZetaEthLiquidity = async (
  signer: SignerWithAddress,
  token: MockZRC20,
  uniswapRouterAddr: string
) => {
  const block = await ethers.provider.getBlock("latest");

  const tx1 = await token.approve(uniswapRouterAddr, MaxUint256);
  await tx1.wait();

  const uniswapRouterFork = TestUniswapRouter__factory.connect(
    uniswapRouterAddr,
    signer
  );

  const tx2 = await uniswapRouterFork.addLiquidityETH(
    token.address,
    parseUnits("2000"),
    0,
    0,
    signer.address,
    block.timestamp + 360,
    {
      gasLimit: 10_000_000,
      value: parseUnits("10"),
    }
  );
  await tx2.wait();
};

interface EvmSetupResult {
  ZRC20Contracts: MockZRC20[];
  systemContract: MockSystemContract;
}

export const evmSetup = async (
  gasTokenAddr: string,
  uniswapFactoryAddr: string,
  uniswapRouterAddr: string
): Promise<EvmSetupResult> => {
  const [signer] = await ethers.getSigners();

  const ZRC20Factory = (await ethers.getContractFactory(
    "MockZRC20"
  )) as MockZRC20__factory;

  const token1Contract = (await ZRC20Factory.deploy(
    parseUnits("1000000"),
    "tBNB",
    "tBNB"
  )) as MockZRC20;
  const token2Contract = (await ZRC20Factory.deploy(
    parseUnits("1000000"),
    "gETH",
    "gETH"
  )) as MockZRC20;
  const token3Contract = (await ZRC20Factory.deploy(
    parseUnits("1000000"),
    "tMATIC",
    "tMATIC"
  )) as MockZRC20;
  const token4Contract = (await ZRC20Factory.deploy(
    parseUnits("1000000"),
    "USDC",
    "USDC"
  )) as MockZRC20;
  const token5Contract = (await ZRC20Factory.deploy(
    parseUnits("1000000"),
    "tBTC",
    "tBTC"
  )) as MockZRC20;

  const ZRC20Contracts = [
    token1Contract,
    token2Contract,
    token3Contract,
    token4Contract,
    token5Contract,
  ];

  const SystemContractFactory = (await ethers.getContractFactory(
    "MockSystemContract"
  )) as MockSystemContract__factory;

  const systemContract = (await SystemContractFactory.deploy(
    gasTokenAddr,
    uniswapFactoryAddr,
    uniswapRouterAddr
  )) as MockSystemContract;

  await systemContract.setGasCoinZRC20(97, ZRC20Contracts[0].address);
  await systemContract.setGasCoinZRC20(5, ZRC20Contracts[1].address);
  await systemContract.setGasCoinZRC20(80001, ZRC20Contracts[2].address);
  await systemContract.setGasCoinZRC20(18332, ZRC20Contracts[4].address);

  await ZRC20Contracts[0].setGasFeeAddress(ZRC20Contracts[0].address);
  await ZRC20Contracts[0].setGasFee(parseEther("0.01"));

  await ZRC20Contracts[1].setGasFeeAddress(ZRC20Contracts[1].address);
  await ZRC20Contracts[1].setGasFee(parseEther("0.01"));

  await ZRC20Contracts[2].setGasFeeAddress(ZRC20Contracts[2].address);
  await ZRC20Contracts[2].setGasFee(parseEther("0.01"));

  await ZRC20Contracts[3].setGasFeeAddress(ZRC20Contracts[1].address);
  await ZRC20Contracts[3].setGasFee(parseEther("0.01"));

  await ZRC20Contracts[4].setGasFeeAddress(ZRC20Contracts[4].address);
  await ZRC20Contracts[4].setGasFee(parseEther("0.01"));

  await addZetaEthLiquidity(signer, ZRC20Contracts[0], uniswapRouterAddr);
  await addZetaEthLiquidity(signer, ZRC20Contracts[1], uniswapRouterAddr);
  await addZetaEthLiquidity(signer, ZRC20Contracts[2], uniswapRouterAddr);
  await addZetaEthLiquidity(signer, ZRC20Contracts[3], uniswapRouterAddr);
  await addZetaEthLiquidity(signer, ZRC20Contracts[4], uniswapRouterAddr);

  return { ZRC20Contracts, systemContract };
};
