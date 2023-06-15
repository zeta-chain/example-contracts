import { parseEther } from "@ethersproject/units";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

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
  console.log(`✅ "crossChainCount" transaction has been broadcasted to ${hre.network.name}
📝 Transaction hash: ${receipt.transactionHash}

Please, refer to ZetaChain's explorer for updates on the progress of the cross-chain transaction.

🌍 Explorer: https://explorer.zetachain.com/cc/tx/${receipt.transactionHash}
`);
};

task("counter:increment", "Sends a message from one chain to another.", main)
  .addParam("contract", "Contract address")
  .addParam("amount", "Token amount to send")
  .addParam("destination", "Destination chain ID (integer)");
