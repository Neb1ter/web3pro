import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const envFiles = [
  ".env",
  ".env.production",
  ".env.runtime",
];

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const candidateRoots = Array.from(
  new Set([
    process.cwd(),
    path.resolve(currentDir, ".."),
    path.resolve(currentDir, "../.."),
  ]),
);

for (const root of candidateRoots) {
  for (const relativePath of envFiles) {
    const fullPath = path.resolve(root, relativePath);
    if (!fs.existsSync(fullPath)) continue;

    dotenv.config({
      path: fullPath,
      override: relativePath === ".env.runtime",
    });
  }
}
