import { ethers } from "hardhat";

export const SYSTEM_CONTRACT = "0x239e96c8f17C85c30100AC26F635Ea15f23E9c67";

const main = async () => {
  console.log(`Deploying ZetaSwapV2...`);

  const Factory = await ethers.getContractFactory("ZetaSwapV2");
  const contract = await Factory.deploy(SYSTEM_CONTRACT);
  await contract.deployed();

  console.log("Deployed ZetaSwap. Address:", contract.address);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
