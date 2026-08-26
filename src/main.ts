import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildKarabinerJson } from "./config";

const outputFile = "karabiner.json";

try {
  writeFileSync(outputFile, buildKarabinerJson());
  console.log(`Successfully wrote karabiner.json to ${resolve(outputFile)}`);
} catch (e) {
  console.error(
    `Error writing karabiner.json: ${e instanceof Error ? e.message : e}`,
  );
  throw e;
}
