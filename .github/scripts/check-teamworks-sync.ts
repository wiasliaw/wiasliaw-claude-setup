/**
 * Verifies every <!-- SYNCED FROM reference/<name>.md --> block in
 * plugins/teamworks/ matches the corresponding <!-- CANONICAL -->
 * section of the referenced reference file after whitespace normalization
 * (trailing whitespace per line and leading/trailing blank lines stripped).
 *
 * The reference file is the source of truth; the inlined SYNCED block
 * is a cache. Drift is a CI failure.
 *
 * Usage:
 *   node --experimental-strip-types check-teamworks-sync.ts
 *   node --experimental-strip-types check-teamworks-sync.ts --fix     # rewrite SYNCED blocks to match canonical (raw, not normalized)
 *
 * Exit codes:
 *   0  all SYNCED blocks match their canonical reference after normalization
 *   1  one or more SYNCED blocks are out of sync
 *   2  script error (missing reference file, malformed markers)
 *
 * No external deps. Uses node:fs only (matches existing CI script style).
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../..");
const PLUGIN_DIR = join(REPO_ROOT, "plugins/teamworks");
const REFERENCE_DIR = join(PLUGIN_DIR, "reference");

const SYNCED_OPEN_RE =
  /<!--\s*SYNCED FROM reference\/([A-Za-z0-9_.-]+)\.md(?:[^>]*)-->/;
const SYNCED_CLOSE = "<!-- /SYNCED -->";
const CANONICAL_OPEN = "<!-- CANONICAL -->";
const CANONICAL_CLOSE = "<!-- /CANONICAL -->";

const FIX_MODE = process.argv.includes("--fix");

interface SyncedBlock {
  /** Reference file basename (without .md). */
  refName: string;
  /** 1-based line number of the SYNCED open marker. */
  startLine: number;
  /** 1-based line number of the SYNCED close marker. */
  endLine: number;
  /** Raw inline content between the open and close markers (exclusive). */
  inlineContent: string;
}

interface ScriptError {
  file: string;
  line?: number;
  message: string;
}

const errors: ScriptError[] = [];
const mismatches: {
  file: string;
  block: SyncedBlock;
  expected: string;
  got: string;
}[] = [];

function findMdFiles(baseDir: string): string[] {
  const results: string[] = [];
  function walk(dir: string) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      errors.push({ file: dir, message: `cannot read directory: ${e}` });
      return;
    }
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        walk(fullPath);
      } else if (entry.name.endsWith(".md")) {
        results.push(fullPath);
      }
    }
  }
  walk(baseDir);
  return results;
}

/**
 * Extract every SYNCED block from a markdown file. The inline content is
 * everything between the open and close markers (exclusive of both markers).
 */
function extractSyncedBlocks(filePath: string, content: string): SyncedBlock[] {
  const lines = content.split("\n");
  const blocks: SyncedBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] || "";
    const match = line.match(SYNCED_OPEN_RE);
    if (!match) {
      i++;
      continue;
    }
    const refName = match[1] || "";
    const startLine = i + 1;
    let closeIdx = -1;
    for (let j = i + 1; j < lines.length; j++) {
      const inner = lines[j] || "";
      if (inner.includes(SYNCED_CLOSE)) {
        closeIdx = j;
        break;
      }
      if (inner.match(SYNCED_OPEN_RE)) {
        errors.push({
          file: filePath,
          line: j + 1,
          message: `nested SYNCED open marker before closing previous one (started at line ${startLine})`,
        });
        break;
      }
    }
    if (closeIdx === -1) {
      errors.push({
        file: filePath,
        line: startLine,
        message: `SYNCED block not closed (opened at line ${startLine}, no matching ${SYNCED_CLOSE})`,
      });
      return blocks;
    }
    const inlineLines = lines.slice(i + 1, closeIdx);
    blocks.push({
      refName,
      startLine,
      endLine: closeIdx + 1,
      inlineContent: inlineLines.join("\n"),
    });
    i = closeIdx + 1;
  }
  return blocks;
}

/**
 * Extract the canonical content from a reference file. The canonical content
 * is the raw text between the first <!-- CANONICAL --> and the matching
 * <!-- /CANONICAL --> markers (exclusive of both markers).
 *
 * Returns null and records an error if the reference file is missing or
 * lacks well-formed canonical markers.
 */
function readCanonical(refName: string): string | null {
  const refPath = join(REFERENCE_DIR, `${refName}.md`);
  let content: string;
  try {
    content = readFileSync(refPath, "utf-8");
  } catch {
    errors.push({
      file: refPath,
      message: `referenced canonical file missing: reference/${refName}.md`,
    });
    return null;
  }
  const lines = content.split("\n");
  const openIdx = lines.findIndex((l) => l.trim() === CANONICAL_OPEN);
  if (openIdx === -1) {
    errors.push({
      file: refPath,
      message: `reference file lacks ${CANONICAL_OPEN} marker`,
    });
    return null;
  }
  const closeIdx = lines.findIndex(
    (l, i) => i > openIdx && l.trim() === CANONICAL_CLOSE,
  );
  if (closeIdx === -1) {
    errors.push({
      file: refPath,
      line: openIdx + 1,
      message: `reference file has ${CANONICAL_OPEN} but no matching ${CANONICAL_CLOSE}`,
    });
    return null;
  }
  return lines.slice(openIdx + 1, closeIdx).join("\n");
}

/** Normalise: strip leading/trailing blank lines and trailing whitespace per line. */
function normalise(text: string): string {
  return text
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/^\n+/, "")
    .replace(/\n+$/, "");
}

const canonicalCache = new Map<string, string | null>();
function getCanonical(refName: string): string | null {
  if (!canonicalCache.has(refName)) {
    canonicalCache.set(refName, readCanonical(refName));
  }
  return canonicalCache.get(refName) ?? null;
}

function unifiedDiffHint(expected: string, got: string): string {
  const exp = expected.split("\n");
  const gt = got.split("\n");
  const out: string[] = [];
  const max = Math.max(exp.length, gt.length);
  for (let i = 0; i < max; i++) {
    const e = exp[i];
    const g = gt[i];
    if (e === g) continue;
    if (e !== undefined) out.push(`- ${e}`);
    if (g !== undefined) out.push(`+ ${g}`);
    if (out.length >= 20) {
      out.push("  ... (diff truncated)");
      break;
    }
  }
  return out.join("\n");
}

function fixFile(
  filePath: string,
  blocks: SyncedBlock[],
  canonicalByRef: Map<string, string>,
): void {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  // Process from bottom to top so line indices stay valid.
  const sorted = [...blocks].sort((a, b) => b.startLine - a.startLine);
  for (const block of sorted) {
    const canonical = canonicalByRef.get(block.refName);
    if (canonical === undefined) continue;
    const before = lines.slice(0, block.startLine);
    const after = lines.slice(block.endLine - 1);
    const middle = canonical.split("\n");
    lines.splice(0, lines.length, ...before, ...middle, ...after);
  }
  writeFileSync(filePath, lines.join("\n"));
}

// ---- main ----

const files = findMdFiles(PLUGIN_DIR).filter(
  // Don't check the reference files against themselves.
  (p) => !p.startsWith(REFERENCE_DIR + "/"),
);

let totalBlocks = 0;
let totalFiles = 0;
let mismatchCount = 0;

const fixesByFile = new Map<string, SyncedBlock[]>();
const canonicalByRef = new Map<string, string>();

for (const filePath of files) {
  const content = readFileSync(filePath, "utf-8");
  const blocks = extractSyncedBlocks(filePath, content);
  if (blocks.length === 0) continue;
  totalFiles++;

  for (const block of blocks) {
    totalBlocks++;
    const canonical = getCanonical(block.refName);
    if (canonical === null) continue; // error already recorded

    const expected = normalise(canonical);
    const got = normalise(block.inlineContent);

    if (expected !== got) {
      mismatchCount++;
      mismatches.push({
        file: filePath,
        block,
        expected,
        got,
      });
      if (FIX_MODE) {
        canonicalByRef.set(block.refName, canonical);
        const list = fixesByFile.get(filePath) ?? [];
        list.push(block);
        fixesByFile.set(filePath, list);
      }
    }
  }
}

if (errors.length > 0) {
  console.error("script errors:");
  for (const e of errors) {
    const loc = e.line ? `:${e.line}` : "";
    console.error(`  ${relative(REPO_ROOT, e.file)}${loc}: ${e.message}`);
  }
  process.exit(2);
}

if (FIX_MODE && fixesByFile.size > 0) {
  for (const [filePath, blocks] of fixesByFile) {
    fixFile(filePath, blocks, canonicalByRef);
    console.log(`fixed ${blocks.length} block(s) in ${relative(REPO_ROOT, filePath)}`);
  }
  console.log(`\nFIXED: ${mismatchCount} block(s) across ${fixesByFile.size} file(s)`);
  process.exit(0);
}

if (mismatchCount > 0) {
  for (const m of mismatches) {
    const rel = relative(REPO_ROOT, m.file);
    console.error(
      `FAIL: ${rel}:${m.block.startLine} does not match reference/${m.block.refName}.md`,
    );
    const hint = unifiedDiffHint(m.expected, m.got);
    if (hint) {
      console.error(hint);
    }
    console.error("");
  }
  console.error(
    `${mismatchCount} mismatched block(s); rerun with --fix to rewrite SYNCED blocks from canonical.`,
  );
  process.exit(1);
}

console.log(
  `OK: ${totalBlocks} synced blocks across ${totalFiles} files match their canonical references`,
);
