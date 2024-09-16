import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployUniswap, deployWZETA, evmSetup } from "@zetachain/toolkit/test";
import { expect } from "chai";
import { defaultAbiCoder, parseEther, parseUnits } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import {
  MockSystemContract,
  MockZRC20,
  Swap,
  Swap__factory,
  TestUniswapRouter,
  UniswapV2Factory,
  WZETA,
} from "../typechain-types";

describe("Swap", function () {
  let uniswapFactory: UniswapV2Factory;
  let uniswapRouter: TestUniswapRouter;
  let swap: Swap;
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

    const SwapFactory = (await ethers.getContractFactory(
      "Swap"
    )) as Swap__factory;

    swap = (await SwapFactory.deploy(systemContract.address)) as Swap;
    await swap.deployed();
  });

  describe("Swap", function () {
    it("Should do swap from EVM Chain", async function () {
      const amount = parseEther("1");
      await ZRC20Contracts[0].transfer(systemContract.address, amount);

      const initBalance = await ZRC20Contracts[1].balanceOf(deployer.address);

      const recipient = ethers.utils.hexlify(
        ethers.utils.zeroPad(deployer.address, 32)
      );

      const params = defaultAbiCoder.encode(
        ["address", "bytes"],
        [ZRC20Contracts[1].address, recipient]
      );

      await systemContract.onCrossChainCall(
        1, // ETH chain id
        swap.address,
        ZRC20Contracts[0].address,
        amount,
        params,
        { gasLimit: 10_000_000 }
      );

      const endBalance = await ZRC20Contracts[1].balanceOf(deployer.address);

      expect(endBalance).to.be.gt(initBalance);
    });

    it("Should do swap from Bitcoin Chain", async function () {
      const amount = parseEther("1");
      await ZRC20Contracts[0].transfer(systemContract.address, amount);

      const initBalance = await ZRC20Contracts[1].balanceOf(deployer.address);

      const rawMemo = `${ZRC20Contracts[1].address}${deployer.address.slice(
        2
      )}`;
      const rawMemoBytes = ethers.utils.arrayify(rawMemo);

      const params = ethers.utils.solidityPack(["bytes"], [rawMemoBytes]);

      await systemContract.onCrossChainCall(
        18332, // Bitcoin chain id
        swap.address,
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
