import { ethers } from "ethers";

export const convertToHexAddress = (address: string): string => {
  let addr: string;
  try {
    // Check if it's a valid hex address
    addr = ethers.utils.getAddress(address);
  } catch (e) {
    // If not, try to convert it to an address from bech32
    addr = ("0x" + Buffer.from(address).toString("hex")).slice(0, 42);
  }
  return addr;
};
