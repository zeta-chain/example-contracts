import { ethers } from "hardhat";

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const HelloZeta = await ethers.getContractFactory("HelloZeta");
  const helloZeta = await HelloZeta.deploy();

  await helloZeta.deployed();

  console.log("HelloZeta contract deployed to:", helloZeta.address);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
