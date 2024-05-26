import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther } from "@ethersproject/units";
import { getAddress } from "@zetachain/protocol-contracts";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();

  const factory = await hre.ethers.getContractFactory("CrossChainZeta");
  const contract = factory.attach(args.contract);

  const destination = hre.config.networks[args.destination]?.chainId;
  if (destination === undefined) {
    throw new Error(`${args.destination} is not a valid destination chain`);
  }

  
  const value = parseEther(args.amount);

  const zetaTokenAddress = getAddress("zetaToken", hre.network.name as any);
  const zetaFactory = await hre.ethers.getContractFactory("ZetaEth");
  const zetaToken = zetaFactory.attach(zetaTokenAddress);

  await (await zetaToken.approve(args.contract, value)).wait();

  const tx = await contract
    .connect(signer)
    .sendMessage(destination, value);

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
