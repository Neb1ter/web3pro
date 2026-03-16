import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envFiles = [
  ".env",
  ".env.production",
  ".env.runtime",
];

for (const relativePath of envFiles) {
  const fullPath = path.resolve(process.cwd(), relativePath);
  if (!fs.existsSync(fullPath)) continue;

  dotenv.config({
    path: fullPath,
    override: relativePath === ".env.runtime",
  });
}
