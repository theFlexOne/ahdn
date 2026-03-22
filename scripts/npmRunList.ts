import { readFile } from "node:fs/promises";
import { styleText } from "node:util";

type PackageJson = {
  scripts?: Record<string, string>;
};

async function getPackageJson(): Promise<PackageJson> {
  const packageJsonPath = new URL("../package.json", import.meta.url);
  const packageJsonText = await readFile(packageJsonPath, "utf8");

  return JSON.parse(packageJsonText) as PackageJson;
}

function formatScriptCommand(name: string): string {
  return `npm run ${name}`;
}

async function main(): Promise<void> {
  const packageJson = await getPackageJson();
  const scripts = Object.entries(packageJson.scripts ?? {});

  if (scripts.length === 0) {
    console.log("No npm scripts found in package.json.");
    return;
  }

  const commandWidth = Math.max(
    ...scripts.map(([name]) => formatScriptCommand(name).length),
  );

  console.log(styleText("bold", "Available npm scripts"));
  console.log("");

  for (const [name, value] of scripts) {
    const command = formatScriptCommand(name).padEnd(commandWidth);
    console.log(`${styleText("cyan", command)}  ${value}`);
  }
}

main().catch((error: unknown) => {
  console.error(styleText("red", "Failed to list npm scripts."));
  console.error(error);
  process.exitCode = 1;
});
