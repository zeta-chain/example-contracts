import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther } from "@ethersproject/units";
import { getAddress } from "@zetachain/protocol-contracts/lib";
import { BigNumber } from "@ethersproject/bignumber";
import { prepareData } from "@zetachain/toolkit/helpers";

const ZRC20Addresses = {
  goerli: "0x91d18e54DAf4F677cB28167158d6dd21F6aB3921",
  "bsc-testnet": "0x13A0c5930C028511Dc02665E7285134B6d11A5f4",
  "bitcoin-testnet": "0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb",
  "polygon-mumbai": "0xd97B1de3619ed2c6BEb3860147E30cA8A7dC9891",
};

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const destinationToken =
    ZRC20Addresses[args.destination as keyof typeof ZRC20Addresses];
  const network = hre.network.name;
  const data = prepareData(
    args.contract,
    ["address", "address", "uint256"],
    [args.recipient || signer.address, destinationToken, BigNumber.from("0")]
  );
  const to = getAddress("tss", network as any);
  const value = parseEther(args.amount);
  const tx = await signer.sendTransaction({ data, to, value });

  console.log(`
🚀 Successfully broadcasted a token transfer transaction on ${network} network.
📝 Transaction hash: ${tx.hash}
💰 Amount: ${args.amount} native ${network} gas tokens

This transaction has been submitted to ${network}, but it may take some time
for it to be processed on ZetaChain. Please refer to ZetaChain's explorer
for updates on the progress of the cross-chain transaction.

🌍 Explorer: https://explorer.zetachain.com/address/${args.contract}?tab=ccTxs
`);
};

task("swap", "Swap tokens", main)
  .addOptionalParam("recipient", "Address of the recipient, defaults to signer")
  .addParam("contract", "Address of the swap contract on ZetaChain")
  .addParam("amount", "Amount to send to the recipient")
  .addParam("destination", "Destination network, like 'goerli'");
