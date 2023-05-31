import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther } from "@ethersproject/units";

const contractName = "CrossChainWarriors";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const factory = await hre.ethers.getContractFactory(contractName);
  const contract = factory.attach(args.contract);

  const tx = await contract
    .connect(signer)
    .crossChainTransfer(args.destination, args.address, args.token, {
      value: parseEther(args.amount),
    });

  const receipt = await tx.wait();
  console.log(`✅ "crossChainTransfer" transaction has been broadcasted to ${hre.network.name}
📝 Transaction hash: ${receipt.transactionHash}

Please, refer to ZetaChain's explorer for updates on the progress of the cross-chain transaction.

🌍 Explorer: https://explorer.zetachain.com/address/${args.contract}
`);
};

const descTask = `Sends a message from one chain to another.`;
const descContractFlag = `Contract address`;
const descDestinationFlag = `Destination chain ID (integer)`;
const descAddressFlag = `Recipient address`;
const descTokenFlag = `Token ID`;
const descAmountFlag = `Token amount to send`;

task("transfer", descTask, main)
  .addParam("contract", descContractFlag)
  .addParam("address", descAddressFlag)
  .addParam("destination", descDestinationFlag)
  .addParam("token", descTokenFlag)
  .addParam("amount", descAmountFlag);
