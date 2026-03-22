/**
 * Checks that marketplace.json plugins are alphabetically sorted by name.
 *
 * Usage:
 *   node --experimental-strip-types check-marketplace-sorted.ts           # check, exit 1 if unsorted
 *   node --experimental-strip-types check-marketplace-sorted.ts --fix     # sort in place
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MARKETPLACE = join(__dirname, "../../.claude-plugin/marketplace.json");

type Plugin = { name: string; [k: string]: unknown };
type Marketplace = { plugins: Plugin[]; [k: string]: unknown };

const raw = readFileSync(MARKETPLACE, "utf8");
const mp: Marketplace = JSON.parse(raw);

const cmp = (a: Plugin, b: Plugin) =>
  a.name.toLowerCase().localeCompare(b.name.toLowerCase());

if (process.argv.includes("--fix")) {
  mp.plugins.sort(cmp);
  writeFileSync(MARKETPLACE, JSON.stringify(mp, null, 2) + "\n");
  console.log(`sorted ${mp.plugins.length} plugins`);
  process.exit(0);
}

for (let i = 1; i < mp.plugins.length; i++) {
  if (cmp(mp.plugins[i - 1], mp.plugins[i]) > 0) {
    console.error(
      `marketplace.json plugins are not sorted: ` +
        `'${mp.plugins[i - 1].name}' should come after '${mp.plugins[i].name}' (index ${i})`,
    );
    console.error(
      `  run: node --experimental-strip-types .github/scripts/check-marketplace-sorted.ts --fix`,
    );
    process.exit(1);
  }
}

console.log(`ok: ${mp.plugins.length} plugins sorted`);
