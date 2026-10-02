import { cpSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const outputDir = resolve(projectRoot, "dist");

mkdirSync(outputDir, { recursive: true });

// TypeScript writes the JavaScript bundle to dist. Copy the static site files
// there as well so Vercel and other static hosts can deploy dist directly.
for (const entry of ["index.html", "css", "assets", "data"]) {
  cpSync(resolve(projectRoot, entry), resolve(outputDir, entry), {
    recursive: true,
  });
}
