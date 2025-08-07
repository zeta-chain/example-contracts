import path from "path";
import fs from "fs";

/**
 * Load contract artifacts (ABI & bytecode) compiled by Foundry (out/** path)
 */
export const loadContractArtifacts = (
  contractName: string,
  sourceName?: string
) => {
  const sourcePath = sourceName || `${contractName}.sol`;
  const artifactPath = path.join(
    __dirname,
    `../out/${sourcePath}/${contractName}.json`
  );

  try {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    return {
      abi: artifact.abi,
      bytecode: artifact.bytecode,
    } as { abi: any; bytecode: string };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unable to load contract artifacts for ${contractName}: ${message}`
    );
  }
};
