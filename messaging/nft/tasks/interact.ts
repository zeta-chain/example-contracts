import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther } from "@ethersproject/units";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();

  const factory = await hre.ethers.getContractFactory("CrossChainNFT");
  const contract = factory.attach(args.contract);

  const destination = hre.config.networks[args.destination]?.chainId;
  if (destination === undefined) {
    throw new Error(`${args.destination} is not a valid destination chain`);
  }

  const paramTo = hre.ethers.utils.getAddress(args.to);
const paramToken = hre.ethers.BigNumber.from(args.token);

  const value = parseEther(args.amount);


  const tx = await contract
    .connect(signer)
    .sendMessage(destination, paramTo, paramToken, { value });

  const receipt = await tx.wait();
  if (args.json) {
    console.log(JSON.stringify(tx, null, 2));
  } else {
    console.log(`🔑 Using account: ${signer.address}\n`);
    console.log(`✅ The transaction has been broadcasted to ${hre.network.name}
📝 Transaction hash: ${receipt.transactionHash}
`);
  }
};

task("interact", "Sends a message from one chain to another.", main)
  .addFlag("json", "Output JSON")
  .addParam("contract", "Contract address")
  .addParam("amount", "Token amount to send")
  .addParam("destination", "Destination chain")
  .addParam("to", "address")
  .addParam("token", "uint256")
