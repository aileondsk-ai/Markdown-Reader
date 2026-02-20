import { build } from "esbuild";
import { readFile } from "fs/promises";
import path from "path";

const pkg = JSON.parse(await readFile("package.json", "utf-8"));
const allDeps = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
];

await build({
  entryPoints: ["server/api-entry.ts"],
  platform: "node",
  bundle: true,
  format: "esm",
  outfile: "api/index.mjs",
  external: allDeps,
  alias: {
    "@shared": path.resolve("shared"),
    "@": path.resolve("client/src"),
  },
  tsconfig: "tsconfig.json",
  logLevel: "info",
});

console.log("✅ API function bundled to api/index.mjs");
