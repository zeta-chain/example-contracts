import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther } from "@ethersproject/units";
import { getAddress } from "@zetachain/addresses";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const prepareData = (contract: string, recipient: string) => {
    const paddedRecipient = hre.ethers.utils.hexlify(
      hre.ethers.utils.zeroPad(recipient, 32)
    );
    return contract + paddedRecipient.slice(2);
  };

  const network = hre.network.name;
  const data = prepareData(args.contract, args.recipient);
  const to = getAddress({
    address: "tss",
    networkName: network,
    zetaNetwork: "athens",
  });
  const value = parseEther(args.amount);

  const tx = await signer.sendTransaction({ data, to, value });

  console.log(`
🚀 Successfully broadcasted a token transfer transaction on ${network} network.
📝 Transaction hash: ${tx.hash}
💰 Amount: ${args.amount} native ${network} gas tokens
💁 Sender: ${signer.address} (your address on ${network})
💁 Recipient: ${args.recipient} (ZetaChain's TSS address on ${network})

This transaction has been submitted to ${network}, but it may take some time
for it to be processed on ZetaChain. Please refer to ZetaChain's explorer
for updates on the progress of the cross-chain transaction.

🌍 Explorer: https://explorer.zetachain.com/address/${args.contract}?tab=ccTxs
`);
};

task("withdraw", "Send tokens to the recipient address")
  .addParam("contract", "The address of the withdraw contract on ZetaChain")
  .addParam("recipient", "Address of the recipient on the target network")
  .addParam("amount", "Amount to send to the recipient")
  .setAction(main);
