import { Command } from "commander";

/**
 * Get ABI from contract artifacts
 */
export const getAbi = (name: string) => {
  const fs = require("fs");
  const path = require("path");

  try {
    const artifactPath = path.join(
      __dirname,
      `../artifacts/contracts/${name}.sol/${name}.json`
    );
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    return { abi: artifact.abi };
  } catch (error) {
    console.warn(`Warning: Could not load ABI for ${name}`);
    return { abi: [] };
  }
};

/**
 * Load contract artifacts (ABI and bytecode)
 */
export const loadContractArtifacts = (
  contractName: string,
  sourceName?: string
) => {
  const fs = require("fs");
  const path = require("path");

  const sourcePath = sourceName || `${contractName}.sol`;
  const artifactPath = path.join(
    __dirname,
    `../artifacts/contracts/${sourcePath}/${contractName}.json`
  );

  try {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    return {
      abi: artifact.abi,
      bytecode: artifact.bytecode,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to load contract artifacts for ${contractName}: ${errorMessage}`
    );
  }
};