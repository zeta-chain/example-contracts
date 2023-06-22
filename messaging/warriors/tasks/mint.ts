import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const contractName = "CrossChainWarriors";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const factory = await hre.ethers.getContractFactory(contractName);
  const contract = factory.attach(args.contract);

  const tx = await contract.connect(signer).mint(signer.address);

  const receipt = await tx.wait();
  const event = receipt.events?.find((event) => event.event === "Transfer");
  const nftId = event?.args?.tokenId.toString();

  console.log(`✅ "mint" transaction has been broadcasted to ${hre.network.name}
📝 Transaction hash: ${receipt.transactionHash}
🌠 Minted NFT ID: ${nftId}
`);
};

task("mint", "Sends a message from one chain to another.", main).addParam(
  "contract",
  "Contract address"
);
