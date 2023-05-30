import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther } from "@ethersproject/units";

const contractName = "CrossChainCounter";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const factory = await hre.ethers.getContractFactory(contractName);
  const contract = factory.attach(args.contract);

  const tx = await contract
    .connect(signer)
    .crossChainCount(args.destination, { value: parseEther(args.amount) });

  const receipt = await tx.wait();
  console.log(`✅ "sendHelloWorld" transaction has been broadcasted to ${hre.network.name}
📝 Transaction hash: ${receipt.transactionHash}

Please, refer to ZetaChain's explorer for updates on the progress of the cross-chain transaction.

🌍 Explorer: https://explorer.zetachain.com/cc/tx/${receipt.transactionHash}
`);
};

const descTask = `Sends a message from one chain to another.`;
const descContractFlag = `Contract address`;
const descDestinationFlag = `Destination chain ID (integer)`;
const descAmountFlag = `Token amount to send`;

task("counter:increment", descTask, main)
  .addParam("contract", descContractFlag)
  .addParam("amount", descAmountFlag)
  .addParam("destination", descDestinationFlag);
