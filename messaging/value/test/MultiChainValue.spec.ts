import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ZetaEth } from "@zetachain/protocol-contracts/dist/typechain-types/contracts/evm/Zeta.eth.sol";
import { expect } from "chai";
import { ethers } from "hardhat";

import { deployMultiChainValueMock } from "./helpers";
import {
  deployZetaConnectorMock,
  deployZetaEthMock,
} from "@zetachain/toolkit/helpers";
import {
  MultiChainValueMock,
  ZetaConnectorMockValue,
} from "../typechain-types";

describe("MultiChainValue tests", () => {
  let multiChainValueContractA: MultiChainValueMock;
  const chainAId = 1;
  const chainBId = 2;

  let zetaConnectorMockContract: ZetaConnectorMockValue;
  let zetaEthMockContract: ZetaEth;

  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let account1: SignerWithAddress;
  let deployerAddress: string;
  let account1Address: string;

  beforeEach(async () => {
    zetaConnectorMockContract = await deployZetaConnectorMock();
    zetaEthMockContract = await deployZetaEthMock();
    multiChainValueContractA = await deployMultiChainValueMock({
      zetaConnectorMockAddress: zetaConnectorMockContract.address,
      zetaTokenMockAddress: zetaEthMockContract.address,
    });

    await multiChainValueContractA.addAvailableChainId(chainBId);

    accounts = await ethers.getSigners();
    [deployer, account1] = accounts;
    deployerAddress = deployer.address;
    account1Address = account1.address;
  });

  describe("addAvailableChainId", () => {
    it("Should prevent enabling a chainId that's already enabled", async () => {
      await (
        await multiChainValueContractA.addAvailableChainId(chainAId)
      ).wait();

      expect(
        multiChainValueContractA.addAvailableChainId(chainAId)
      ).to.be.revertedWith("ChainIdAlreadyAvailable");
    });

    it("Should enable the provided chainId", async () => {
      await (
        await multiChainValueContractA.addAvailableChainId(chainAId)
      ).wait();

      expect(
        await multiChainValueContractA.availableChainIds(chainAId)
      ).to.equal(true);
    });
  });

  describe("removeAvailableChainId", () => {
    it("Should prevent disabling a chainId that's already disabled", async () => {
      expect(
        multiChainValueContractA.removeAvailableChainId(chainAId)
      ).to.be.revertedWith("ChainIdNotAvailable");
    });

    it("Should disable the provided chainId", async () => {
      await (
        await multiChainValueContractA.addAvailableChainId(chainAId)
      ).wait();
      expect(
        await multiChainValueContractA.availableChainIds(chainAId)
      ).to.equal(true);

      await (
        await multiChainValueContractA.removeAvailableChainId(chainAId)
      ).wait();
      expect(
        await multiChainValueContractA.availableChainIds(chainAId)
      ).to.equal(false);
    });
  });

  describe("send", () => {
    it("Should prevent sending value to a disabled chainId", async () => {
      expect(
        multiChainValueContractA.send(chainAId, account1Address, 100_000)
      ).to.be.revertedWith("InvalidDestinationChainId");
    });

    it("Should prevent sending 0 value", async () => {
      await (
        await multiChainValueContractA.addAvailableChainId(chainAId)
      ).wait();

      expect(
        multiChainValueContractA.send(chainAId, account1Address, 0)
      ).to.be.revertedWith("InvalidZetaValueAndGas");
    });

    it("Should prevent sending if the account has no Zeta balance", async () => {
      await (
        await multiChainValueContractA.addAvailableChainId(chainAId)
      ).wait();
    });

    it("Should prevent sending value to an invalid address", async () => {
      await (
        await multiChainValueContractA.addAvailableChainId(chainAId)
      ).wait();
    });

    describe("Given a valid input", () => {
      it("Should send value", async () => {
        await (
          await multiChainValueContractA.addAvailableChainId(chainAId)
        ).wait();
      });
    });
  });
});
