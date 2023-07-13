import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther } from "@ethersproject/units";
import { getAddress } from "@zetachain/protocol-contracts";

const contractName = "MultiChainValue";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const factory = await hre.ethers.getContractFactory(contractName);
  const contract = factory.attach(args.contract);

  const zetaTokenAddress = getAddress("zetaToken", hre.network.name as any);
  const zetaFactory = await hre.ethers.getContractFactory("ZetaEth");
  const zetaToken = zetaFactory.attach(zetaTokenAddress);

  const destination = hre.config.networks[args.destination]?.chainId;
  if (destination === undefined) {
    throw new Error(`${args.destination} is not a valid destination chain`);
  }

  const recipient = args.address || signer.address;
  const amount = parseEther(args.amount);

  await (await zetaToken.approve(args.contract, amount)).wait();

  const tx = await contract
    .connect(signer)
    .send(destination, recipient, amount);

  const receipt = await tx.wait();
  console.log(`✅ Transaction has been broadcasted to ${hre.network.name}
📝 Transaction hash: ${receipt.transactionHash}

Please, refer to ZetaChain's explorer for updates on the progress of the cross-chain transaction.

🌍 Explorer: https://athens3.explorer.zetachain.com/address/${args.contract}
`);
};

task("send", "Sends a message from one chain to another.", main)
  .addParam("contract", "Contract address")
  .addOptionalParam("address", "Recipient address")
  .addParam("amount", "Amount of ZETA tokens to send")
  .addParam("destination", "Destination chain");
