import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

import { ZetaChainClient } from "@zetachain/toolkit/client";

export const isInputAmountSufficient = async ({
  hre,
  client,
  erc20,
  amount,
  target,
}: any) => {
  const inputZRC20 = await (erc20
    ? client.getZRC20FromERC20(erc20)
    : client.getZRC20GasToken(hre.network.name));

  const minAmount = await client.getWithdrawFeeInInputToken(inputZRC20, target);

  const minAmountFormatted = hre.ethers.utils.formatUnits(
    minAmount.amount,
    minAmount.decimals
  );

  const value = hre.ethers.utils.parseUnits(amount, minAmount.decimals);

  if (value.lt(minAmount.amount)) {
    throw new Error(
      `Input amount ${amount} is less than minimum amount ${minAmountFormatted} required for a withdrawal to the destination chain`
    );
  }
};

export const evmDepositAndCall = async (
  args: any,
  hre: HardhatRuntimeEnvironment
) => {
  try {
    const [signer] = await hre.ethers.getSigners();
    const client = new ZetaChainClient({ network: "testnet", signer });

    if (!args.skipChecks) {
      await isInputAmountSufficient({
        hre,
        client,
        amount: args.amount,
        erc20: args.erc20,
        target: args.target,
      });
    }

    const tx = await client.evmDepositAndCall({
      amount: args.amount,
      erc20: args.erc20,
      gatewayEvm: args.gatewayEvm,
      receiver: args.receiver,
      revertOptions: {
        callOnRevert: args.callOnRevert,
        onRevertGasLimit: args.onRevertGasLimit,
        revertAddress: args.revertAddress,
        revertMessage: args.revertMessage,
      },
      txOptions: {
        gasLimit: args.gasLimit,
        gasPrice: args.gasPrice,
      },
      types: ["address", "bytes", "bool"],
      values: [args.target, args.recipient, JSON.stringify(args.withdraw)],
    });
    if (tx) {
      const receipt = await tx.wait();
      console.log("Transaction hash:", receipt.transactionHash);
    }
  } catch (e) {
    console.error("Transaction error:", e);
  }
};

task("evm-swap", "Swap tokens from EVM", evmDepositAndCall)
  .addParam("receiver", "Receiver address on ZetaChain")
  .addParam("gatewayEvm", "contract address of gateway on EVM")
  .addFlag("callOnRevert", "Whether to call on revert")
  .addOptionalParam(
    "revertAddress",
    "Revert address",
    "0x0000000000000000000000000000000000000000",
    types.string
  )
  .addOptionalParam(
    "gasPrice",
    "The gas price for the transaction",
    50000000000,
    types.int
  )
  .addOptionalParam(
    "gasLimit",
    "The gas limit for the transaction",
    500000,
    types.int
  )
  .addOptionalParam(
    "onRevertGasLimit",
    "The gas limit for the revert transaction",
    50000,
    types.int
  )
  .addOptionalParam("revertMessage", "Revert message", "0x")
  .addParam("amount", "amount of ETH to send with the transaction")
  .addOptionalParam("erc20", "ERC-20 token address")
  .addFlag("skipChecks", "Skip checks for minimum amount")
  .addParam("target", "ZRC-20 address of the token to swap for")
  .addParam("recipient", "Recipient address")
  .addOptionalParam(
    "withdraw",
    "Withdraw to destination or keep token on ZetaChain",
    true,
    types.boolean
  );
