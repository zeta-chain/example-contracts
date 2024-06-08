import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther } from "@ethersproject/units";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();

  const factory = await hre.ethers.getContractFactory("CrossChainMessage");
  const contract = factory.attach(args.contract);

  const destination = hre.config.networks[args.destination]?.chainId;
  if (destination === undefined) {
    throw new Error(`${args.destination} is not a valid destination chain`);
  }

  const blockHeight = args.blockHeight;
  const prizeAmount = parseEther(args.prizeAmount);
  const maxParticipants = args.maxParticipants;
  const nftContract = args.nftContract;

  const value = parseEther(args.amount);

  const tx = await contract
    .connect(signer)
    .createGiveaway(
      blockHeight,
      prizeAmount,
      maxParticipants,
      nftContract,
      destination,
      { value }
    );

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

task(
  "create-giveaway",
  "Creates a giveaway and sends it to the destination chain.",
  main
)
  .addFlag("json", "Output JSON")
  .addParam("contract", "Contract address")
  .addParam("amount", "Token amount to send")
  .addParam("destination", "Destination chain")
  .addParam(
    "blockHeight",
    "Block height when users can start claiming the prizes"
  )
  .addParam("prizeAmount", "Prize amount in tokens")
  .addParam("maxParticipants", "Max number of participants")
  .addParam("nftContract", "NFT contract address");
