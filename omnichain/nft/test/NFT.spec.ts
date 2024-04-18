import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { defaultAbiCoder, parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

import {
  MockSystemContract,
  MockZRC20,
  NFT,
  NFT__factory,
} from "../typechain-types";
import { evmSetup } from "./test.helpers";

describe("NFT", function () {
  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let systemContract: MockSystemContract;
  let ZRC20Contracts: MockZRC20[];
  let nft: NFT;

  const zeroAddress = "0x0000000000000000000000000000000000000000";

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    [deployer] = accounts;

    const evmSetupResult = await evmSetup(zeroAddress);
    ZRC20Contracts = evmSetupResult.ZRC20Contracts;
    systemContract = evmSetupResult.systemContract;

    const NFTFactory = (await ethers.getContractFactory("NFT")) as NFT__factory;

    nft = (await NFTFactory.deploy(systemContract.address)) as NFT;
    await nft.deployed();
  });

  it("Should mint NFT from EVM chain", async function () {
    const amount = parseEther("10");
    await ZRC20Contracts[0].transfer(systemContract.address, amount);

    const params = defaultAbiCoder.encode(["address"], [deployer.address]);

    await systemContract.onCrossChainCall(
      5,
      nft.address,
      ZRC20Contracts[0].address,
      amount,
      params,
      { gasLimit: 10_000_000 }
    );

    const balance = await nft.balanceOf(deployer.address);
    expect(balance).to.be.eq(1);

    const tokenAmount = await nft.tokenAmounts(0);
    expect(tokenAmount).to.be.eq(amount);

    const tokenChain = await nft.tokenChains(0);
    expect(tokenChain).to.be.eq(5);
  });

  it("Should mint NFT from Bitcoin chain", async function () {
    const amount = parseEther("10");
    await ZRC20Contracts[1].transfer(systemContract.address, amount);

    const rawMemoBytes = ethers.utils.arrayify(deployer.address);
    const params = ethers.utils.solidityPack(["bytes"], [rawMemoBytes]);

    await systemContract.onCrossChainCall(
      18332,
      nft.address,
      ZRC20Contracts[1].address,
      amount,
      params,
      { gasLimit: 10_000_000 }
    );

    const balance = await nft.balanceOf(deployer.address);
    expect(balance).to.be.eq(1);

    const tokenAmount = await nft.tokenAmounts(0);
    expect(tokenAmount).to.be.eq(amount);

    const tokenChain = await nft.tokenChains(0);
    expect(tokenChain).to.be.eq(18332);
  });

  it("Should burn NFT", async function () {
    const amount = parseEther("10");
    await ZRC20Contracts[0].transfer(systemContract.address, amount);

    const params = defaultAbiCoder.encode(["address"], [deployer.address]);

    await systemContract.onCrossChainCall(
      5,
      nft.address,
      ZRC20Contracts[0].address,
      amount,
      params,
      { gasLimit: 10_000_000 }
    );

    const balance = await nft.balanceOf(deployer.address);
    expect(balance).to.be.eq(1);

    const recipient = defaultAbiCoder.encode(["address"], [deployer.address]);

    await nft.burnNFT(0, recipient);

    const newBalance = await nft.balanceOf(deployer.address);
    expect(newBalance).to.be.eq(0);

    const tokenAmount = await nft.tokenAmounts(0);
    expect(tokenAmount).to.be.eq(0);

    const tokenChain = await nft.tokenChains(0);
    expect(tokenChain).to.be.eq(0);
  });
});
