import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployUniswap, deployWZETA, evmSetup } from "@zetachain/toolkit/test";
import { expect } from "chai";
import { defaultAbiCoder, parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

import {
  MockSystemContract,
  MockZRC20,
  SwapToAnyToken,
  SwapToAnyToken__factory,
  TestUniswapRouter,
  UniswapV2Factory,
  WZETA,
} from "../typechain-types";

describe("SwapToAnyToken", function () {
  let uniswapFactory: UniswapV2Factory;
  let uniswapRouter: TestUniswapRouter;
  let swapToAnyToken: SwapToAnyToken;
  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let systemContract: MockSystemContract;
  let ZRC20Contracts: MockZRC20[];
  let wGasToken: WZETA;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    [deployer] = accounts;

    const wZETA = await deployWZETA(deployer);
    wGasToken = wZETA;

    const deployResult = await deployUniswap(deployer, wGasToken.address);
    uniswapFactory = deployResult.uniswapFactory;
    uniswapRouter = deployResult.uniswapRouter;

    const evmSetupResult = await evmSetup(
      wGasToken.address,
      uniswapFactory.address,
      uniswapRouter.address
    );
    ZRC20Contracts = evmSetupResult.ZRC20Contracts;
    systemContract = evmSetupResult.systemContract;

    const SwapToAnyTokenFactory = (await ethers.getContractFactory(
      "SwapToAnyToken"
    )) as SwapToAnyToken__factory;

    swapToAnyToken = (await SwapToAnyTokenFactory.deploy(systemContract.address)) as SwapToAnyToken;
    await swapToAnyToken.deployed();
  });

  describe("SwapToAnyToken", function () {
    it("Should do swap from EVM Chain and withdraw", async function () {
      const amount = parseEther("1");
      await ZRC20Contracts[0].transfer(systemContract.address, amount);

      const initBalance = await ZRC20Contracts[1].balanceOf(deployer.address);

      const recipient = ethers.utils.arrayify(deployer.address);

      const withdraw = true;

      const params = defaultAbiCoder.encode(
        ["address", "bytes", "bool"],
        [ZRC20Contracts[1].address, recipient, withdraw]
      );

      await systemContract.onCrossChainCall(
        1, // ETH chain id
        swapToAnyToken.address,
        ZRC20Contracts[0].address,
        amount,
        params,
        { gasLimit: 10_000_000 }
      );

      const endBalance = await ZRC20Contracts[1].balanceOf(deployer.address);

      expect(endBalance).to.be.gt(initBalance);
    });

    it("Should do swap from EVM Chain and no withdraw", async function () {
      const amount = parseEther("1");
      await ZRC20Contracts[0].transfer(systemContract.address, amount);

      const initBalance = await ZRC20Contracts[1].balanceOf(deployer.address);

      const recipient = ethers.utils.arrayify(deployer.address);

      const withdraw = false;

      const params = defaultAbiCoder.encode(
        ["address", "bytes", "bool"],
        [ZRC20Contracts[1].address, recipient, withdraw]
      );

      await systemContract.onCrossChainCall(
        1, // ETH chain id
        swapToAnyToken.address,
        ZRC20Contracts[0].address,
        amount,
        params,
        { gasLimit: 10_000_000 }
      );

      const endBalance = await ZRC20Contracts[1].balanceOf(deployer.address);
      expect(endBalance).to.be.gt(initBalance);
    });

    it("Should do swap from Bitcoin Chain with withdraw", async function () {
      const amount = parseEther("1");
      await ZRC20Contracts[0].transfer(systemContract.address, amount);

      const initBalance = await ZRC20Contracts[1].balanceOf(deployer.address);
      const withdraw = "0x01".slice(2);

      const rawMemo = `${ZRC20Contracts[1].address}${deployer.address.slice(
        2
      )}${withdraw}`;
      const rawMemoBytes = ethers.utils.arrayify(rawMemo);

      const params = ethers.utils.solidityPack(["bytes"], [rawMemoBytes]);

      await systemContract.onCrossChainCall(
        18332, // Bitcoin chain id
        swapToAnyToken.address,
        ZRC20Contracts[0].address,
        amount,
        params,
        { gasLimit: 10_000_000 }
      );

      const endBalance = await ZRC20Contracts[1].balanceOf(deployer.address);

      expect(endBalance).to.be.gt(initBalance);
    });

    it("Should do swap from Bitcoin Chain with no withdraw", async function () {
      const amount = parseEther("1");
      await ZRC20Contracts[0].transfer(systemContract.address, amount);

      const initBalance = await ZRC20Contracts[1].balanceOf(deployer.address);
      const withdraw = "0x00".slice(2);

      const rawMemo = `${ZRC20Contracts[1].address}${deployer.address.slice(
        2
      )}${withdraw}`;
      const rawMemoBytes = ethers.utils.arrayify(rawMemo);

      const params = ethers.utils.solidityPack(["bytes"], [rawMemoBytes]);

      await systemContract.onCrossChainCall(
        18332, // Bitcoin chain id
        swapToAnyToken.address,
        ZRC20Contracts[0].address,
        amount,
        params,
        { gasLimit: 10_000_000 }
      );

      const endBalance = await ZRC20Contracts[1].balanceOf(deployer.address);

      expect(endBalance).to.be.gt(initBalance);
    });
  });
});
