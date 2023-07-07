import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther } from "@ethersproject/units";
import ZRC20 from "@zetachain/protocol-contracts/abi/zevm/ZRC20.sol/ZRC20.json";
import { getAddress } from "@zetachain/protocol-contracts";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const network = hre.network.name;
  const value = parseEther(args.amount);

  const factory = await hre.ethers.getContractFactory("Withdraw");
  const contract = factory.attach(args.contract);
  const recipient = hre.ethers.utils.hexZeroPad(args.recipient, 32);

  const zrc20Address = getAddress("zrc20", args.destination);
  const token = new hre.ethers.Contract(zrc20Address, ZRC20.abi, signer);
  await token.transfer(args.contract, value);
  await token.approve(args.contract, value);
  const tx = await contract.withdraw(zrc20Address, value, recipient);

  console.log(`
🚀 Successfully broadcasted a token withdrawal transaction on ${network} network.
📝 Transaction hash: ${tx.hash}
💰 Amount: ${args.amount} of ZRC20 tokens
💁 Sender: ${signer.address} (your address on ${network})
💁 Recipient: ${args.recipient} (Recipient's address on ${network})

This transaction has been submitted to ${network}, but it may take some time
for it to be processed on ZetaChain. Please refer to ZetaChain's explorer
for updates on the progress of the cross-chain transaction.
`);
};

task("withdraw", "Withdraw ZRC20 tokens to a recipient address", main)
  .addParam("destination", "Destination chain")
  .addParam("contract", "Contract address")
  .addParam("recipient", "Address of the recipient on the target network")
  .addParam("amount", "Amount to withdraw to the recipient");
