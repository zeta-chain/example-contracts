import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployUniswap, deployWZETA, evmSetup } from "@zetachain/toolkit/test";
import { expect } from "chai";
import { defaultAbiCoder, parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

import {
  MockSystemContract,
  MockZRC20,
  Staking,
  Staking__factory,
  TestUniswapRouter,
  UniswapV2Factory,
  WZETA,
} from "../typechain-types";

const zeroAddress = "0x0000000000000000000000000000000000000000";

describe("Staking", function () {
  let uniswapFactory: UniswapV2Factory;
  let uniswapRouter: TestUniswapRouter;
  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let systemContract: MockSystemContract;
  let ZRC20Contracts: MockZRC20[];
  let stakeEVM: Staking;
  let stakeBitcoin: Staking;
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

    const StakingFactory = (await ethers.getContractFactory(
      "Staking"
    )) as Staking__factory;

    stakeEVM = (await StakingFactory.deploy(
      "stETH",
      "stETH",
      5,
      systemContract.address
    )) as Staking;
    await stakeEVM.deployed();

    stakeBitcoin = (await StakingFactory.deploy(
      "stBTC",
      "stBTC",
      18332,
      systemContract.address
    )) as Staking;
    await stakeBitcoin.deployed();
  });

  it("Should stake form EVM chain", async function () {
    const amount = parseEther("1");
    await ZRC20Contracts[1].transfer(systemContract.address, amount);

    await stakeFromEVM(
      systemContract,
      stakeEVM,
      ZRC20Contracts[1],
      deployer,
      amount
    );

    const currentStakeBalance = await stakeEVM.stakes(
      defaultAbiCoder.encode(["address"], [deployer.address])
    );
    expect(currentStakeBalance).to.be.equal(amount);
  });

  it("Should unstake from EVM chain", async function () {
    const amount = parseEther("1");
    await ZRC20Contracts[1].transfer(systemContract.address, amount);

    await stakeFromEVM(
      systemContract,
      stakeEVM,
      ZRC20Contracts[1],
      deployer,
      amount
    );

    let currentStakeBalance = await stakeEVM.stakes(
      defaultAbiCoder.encode(["address"], [deployer.address])
    );
    expect(currentStakeBalance).to.be.equal(amount);

    const unstakeParams = defaultAbiCoder.encode(
      ["uint8", "address"],
      [2, deployer.address]
    );

    await systemContract.onCrossChainCall(
      5,
      stakeEVM.address,
      ZRC20Contracts[1].address,
      0,
      unstakeParams,
      { gasLimit: 10_000_000 }
    );

    currentStakeBalance = await stakeEVM.stakes(
      defaultAbiCoder.encode(["address"], [deployer.address])
    );
    expect(currentStakeBalance).to.be.equal(0);
  });

  it("Should update beneficiary from EVM chain", async function () {
    const amount = parseEther("1");
    await ZRC20Contracts[1].transfer(systemContract.address, amount);

    await stakeFromEVM(
      systemContract,
      stakeEVM,
      ZRC20Contracts[1],
      deployer,
      amount
    );

    let currentBeneficiary = await stakeEVM.beneficiary(
      defaultAbiCoder.encode(["address"], [deployer.address])
    );
    expect(currentBeneficiary).to.be.equal(deployer.address);

    const newBeneficiary = accounts[1].address;

    const updateBeneficiaryParams = defaultAbiCoder.encode(
      ["uint8", "address"],
      [3, newBeneficiary]
    );

    await systemContract.onCrossChainCall(
      5,
      stakeEVM.address,
      ZRC20Contracts[1].address,
      0,
      updateBeneficiaryParams,
      { gasLimit: 10_000_000 }
    );

    currentBeneficiary = await stakeEVM.beneficiary(
      defaultAbiCoder.encode(["address"], [deployer.address])
    );
    expect(currentBeneficiary).to.be.equal(newBeneficiary);
  });

  it("Should stake from Bitcoin chain", async function () {
    const amount = parseEther("1");
    await ZRC20Contracts[4].transfer(systemContract.address, amount);

    await stakeFromBitcoin(
      systemContract,
      stakeBitcoin,
      ZRC20Contracts[4],
      deployer,
      amount
    );

    const currentStakeBalance = await stakeBitcoin.stakes(
      defaultAbiCoder.encode(["address"], [deployer.address])
    );
    expect(currentStakeBalance).to.be.equal(amount);
  });

  it("Should unstake from Bitcoin chain", async function () {
    const amount = parseEther("1");
    await ZRC20Contracts[4].transfer(systemContract.address, amount);

    await stakeFromBitcoin(
      systemContract,
      stakeBitcoin,
      ZRC20Contracts[4],
      deployer,
      amount
    );

    let currentStakeBalance = await stakeBitcoin.stakes(
      defaultAbiCoder.encode(["address"], [deployer.address])
    );
    expect(currentStakeBalance).to.be.equal(amount);

    const actionHex = "2".padStart(2, "0");
    const rawMemo = `0x${actionHex}`;
    const rawMemoBytes = ethers.utils.arrayify(rawMemo);

    const unstakeParams = ethers.utils.solidityPack(["bytes"], [rawMemoBytes]);

    await systemContract.onCrossChainCall(
      18332,
      stakeBitcoin.address,
      ZRC20Contracts[4].address,
      0,
      unstakeParams,
      { gasLimit: 10_000_000 }
    );

    currentStakeBalance = await stakeBitcoin.stakes(
      defaultAbiCoder.encode(["address"], [deployer.address])
    );
    expect(currentStakeBalance).to.be.equal(0);
  });

  it("Should update beneficiary from Bitcoin chain", async function () {
    const amount = parseEther("1");
    await ZRC20Contracts[4].transfer(systemContract.address, amount);

    await stakeFromBitcoin(
      systemContract,
      stakeBitcoin,
      ZRC20Contracts[4],
      deployer,
      amount
    );

    let currentBeneficiary = await stakeBitcoin.beneficiary(
      defaultAbiCoder.encode(["address"], [deployer.address])
    );
    expect(currentBeneficiary).to.be.equal(deployer.address);

    const newBeneficiary = accounts[1].address;

    const actionHex = "3".padStart(2, "0");
    const rawMemo = `0x${actionHex}${newBeneficiary.slice(2)}`;
    const rawMemoBytes = ethers.utils.arrayify(rawMemo);

    const updateBeneficiaryParams = ethers.utils.solidityPack(
      ["bytes"],
      [rawMemoBytes]
    );

    await systemContract.onCrossChainCall(
      18332,
      stakeBitcoin.address,
      ZRC20Contracts[4].address,
      0,
      updateBeneficiaryParams,
      { gasLimit: 10_000_000 }
    );

    currentBeneficiary = await stakeBitcoin.beneficiary(
      defaultAbiCoder.encode(["address"], [deployer.address])
    );
    expect(currentBeneficiary).to.be.equal(newBeneficiary);
  });
});

async function stakeFromEVM(
  systemContract: MockSystemContract,
  stakeEVM: Staking,
  ZRC20Contract: MockZRC20,
  deployer: SignerWithAddress,
  amount: any
) {
  const stakeParams = defaultAbiCoder.encode(
    ["uint8", "address"],
    [1, deployer.address]
  );

  return systemContract.onCrossChainCall(
    5,
    stakeEVM.address,
    ZRC20Contract.address,
    amount,
    stakeParams,
    { gasLimit: 10_000_000 }
  );
}

async function stakeFromBitcoin(
  systemContract: MockSystemContract,
  stakeBitcoin: Staking,
  ZRC20Contract: MockZRC20,
  deployer: SignerWithAddress,
  amount: any
) {
  const actionHex = "1".padStart(2, "0");

  const rawMemo = `0x${actionHex}${deployer.address.slice(2)}`;
  const rawMemoBytes = ethers.utils.arrayify(rawMemo);

  const params = ethers.utils.solidityPack(["bytes"], [rawMemoBytes]);

  return systemContract.onCrossChainCall(
    18332,
    stakeBitcoin.address,
    ZRC20Contract.address,
    amount,
    params,
    { gasLimit: 10_000_000 }
  );
}
