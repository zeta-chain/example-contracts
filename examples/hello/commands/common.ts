import path from "path";
import fs from "fs";

export const getAbi = (name: string) => {
  const abiPath = path.resolve(
    __dirname,
    path.join("..", "out", `${name}.sol`, `${name}.json`)
  );
  return JSON.parse(fs.readFileSync(abiPath, "utf8"));
};
