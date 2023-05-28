import { expect } from "chai";
import { ethers } from "hardhat";

// Test suite for HelloZeta contract
describe("HelloZeta", function () {
  it("Should return 'Hello Zeta' when calling helloZeta()", async function () {
    // Deploy the contract
    const HelloZeta = await ethers.getContractFactory("HelloZeta");
    const helloZeta = await HelloZeta.deploy();
    await helloZeta.deployed();

    // Call the helloZeta() function
    const result = await helloZeta.helloZeta();

    // Check if the result is as expected
    expect(result).to.equal("Hello Zeta");
  });
});
