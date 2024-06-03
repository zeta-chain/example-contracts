import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployUniswap, deployWZETA, evmSetup } from "@zetachain/toolkit/test";
import { expect } from "chai";
import { utils } from "ethers";
import { defaultAbiCoder, parseEther, parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";

import {
  MockSystemContract,
  MockZRC20,
  Multioutput,
  Multioutput__factory,
  TestUniswapRouter,
  UniswapV2Factory,
  WZETA,
} from "../typechain-types";

describe("Multioutput", function () {
  let uniswapFactory: UniswapV2Factory;
  let uniswapRouter: TestUniswapRouter;
  let multioutput: Multioutput;
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

    const MultioutputFactory = (await ethers.getContractFactory(
      "Multioutput"
    )) as Multioutput__factory;

    multioutput = (await MultioutputFactory.deploy(
      systemContract.address
    )) as Multioutput;
    await multioutput.deployed();
  });

  describe("Multioutput", function () {
    it("Should do swap from EVM Chain to multi EVM chains", async function () {
      const amount = parseEther("1");
      await ZRC20Contracts[0].transfer(systemContract.address, amount);

      const initBalance1 = await ZRC20Contracts[1].balanceOf(deployer.address);
      const initBalance2 = await ZRC20Contracts[2].balanceOf(deployer.address);
      console.log("initBalance1", initBalance1.toString());
      console.log("initBalance2", initBalance2.toString());

      const evmRecipient = deployer.address;

      const btcRecipient = utils.solidityPack(
        ["bytes"],
        [utils.toUtf8Bytes("")]
      );

      const destinationTokens = [
        ZRC20Contracts[1].address,
        ZRC20Contracts[2].address,
      ];

      const tokensBytes = ethers.utils.concat(
        destinationTokens.map((address) =>
          utils.defaultAbiCoder.encode(["address"], [address])
        )
      );

      const params = defaultAbiCoder.encode(
        ["address", "bytes", "bytes"],
        [evmRecipient, btcRecipient, tokensBytes]
      );

      await systemContract.onCrossChainCall(
        1, // ETH chain id
        multioutput.address,
        ZRC20Contracts[0].address,
        amount,
        params,
        { gasLimit: 10_000_000 }
      );

      const endBalance1 = await ZRC20Contracts[1].balanceOf(deployer.address);
      const endBalance2 = await ZRC20Contracts[2].balanceOf(deployer.address);

      console.log("endBalance1", endBalance1.toString());
      console.log("endBalance2", endBalance2.toString());
    });

    it("Should do swap from EVM Chain to EVM chain and Bitcoin chain", async function () {
      const amount = parseEther("1");
      await ZRC20Contracts[0].transfer(systemContract.address, amount);

      const initBalance1 = await ZRC20Contracts[1].balanceOf(deployer.address);
      const initBalance2 = await ZRC20Contracts[2].balanceOf(deployer.address);
      const initBalance3 = await ZRC20Contracts[4].balanceOf(deployer.address);
      console.log("initBalance1", initBalance1.toString());
      console.log("initBalance2", initBalance2.toString());
      console.log("initBalance3", initBalance3.toString());

      const evmRecipient = deployer.address;

      const btcRecipient = utils.solidityPack(
        ["bytes"],
        [utils.toUtf8Bytes("197qzW8qxsJJYkikFQt45S1a75mKNCvRA9")]
      );

      const destinationTokens = [
        ZRC20Contracts[1].address,
        ZRC20Contracts[2].address,
        ZRC20Contracts[4].address,
      ];

      const tokensBytes = ethers.utils.concat(
        destinationTokens.map((address) =>
          utils.defaultAbiCoder.encode(["address"], [address])
        )
      );

      const params = defaultAbiCoder.encode(
        ["address", "bytes", "bytes"],
        [evmRecipient, btcRecipient, tokensBytes]
      );

      await systemContract.onCrossChainCall(
        1, // ETH chain id
        multioutput.address,
        ZRC20Contracts[0].address,
        amount,
        params,
        { gasLimit: 10_000_000 }
      );

      const endBalance1 = await ZRC20Contracts[1].balanceOf(deployer.address);
      const endBalance2 = await ZRC20Contracts[2].balanceOf(deployer.address);
      const endBalance3 = await ZRC20Contracts[4].balanceOf(deployer.address);

      console.log("endBalance1", endBalance1.toString());
      console.log("endBalance2", endBalance2.toString());
      console.log("endBalance3", endBalance3.toString());
    });

    it("Should do swap from Bitcoin Chain to multi EVM chains", async function () {
      const amount = parseEther("1");
      await ZRC20Contracts[0].transfer(systemContract.address, amount);

      const initBalance1 = await ZRC20Contracts[1].balanceOf(deployer.address);
      const initBalance2 = await ZRC20Contracts[2].balanceOf(deployer.address);
      console.log("initBalance1", initBalance1.toString());
      console.log("initBalance2", initBalance2.toString());

      const rawMemo = `${deployer.address}${ZRC20Contracts[1].address.slice(
        2
      )}${ZRC20Contracts[2].address.slice(2)}`;
      const rawMemoBytes = ethers.utils.arrayify(rawMemo);

      const params = ethers.utils.solidityPack(["bytes"], [rawMemoBytes]);

      await systemContract.onCrossChainCall(
        18332, // Bitcoin chain id
        multioutput.address,
        ZRC20Contracts[0].address,
        amount,
        params,
        { gasLimit: 10_000_000 }
      );

      const endBalance1 = await ZRC20Contracts[1].balanceOf(deployer.address);
      const endBalance2 = await ZRC20Contracts[2].balanceOf(deployer.address);
      console.log("endBalance1", endBalance1.toString());
      console.log("endBalance2", endBalance2.toString());
    });
  });
});
