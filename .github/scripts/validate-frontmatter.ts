/**
 * Validates YAML frontmatter in agent, skill, and command .md files.
 * Uses a minimal frontmatter parser (no external YAML dependency).
 *
 * Usage:
 *   node --experimental-strip-types validate-frontmatter.ts                    # scan plugins/
 *   node --experimental-strip-types validate-frontmatter.ts /path/to/dir       # scan specific directory
 *   node --experimental-strip-types validate-frontmatter.ts file1.md file2.md  # validate specific files
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)---\s*\n?/;

/**
 * Minimal frontmatter parser: extracts top-level key: value pairs.
 * Sufficient for validating presence of required fields without a full YAML parser.
 */
function parseFrontmatter(
  markdown: string,
): { fields: Record<string, string>; error?: string } {
  const match = markdown.match(FRONTMATTER_REGEX);
  if (!match) {
    return { fields: {}, error: "No frontmatter found" };
  }

  const fields: Record<string, string> = {};
  const lines = (match[1] || "").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim();
    if (key) fields[key] = value;
  }
  return { fields };
}

// --- Validation ---

type FileType = "agent" | "skill" | "command";

interface ValidationIssue {
  level: "error" | "warning";
  message: string;
}

function validateAgent(
  fields: Record<string, string>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!fields["name"]) {
    issues.push({ level: "error", message: 'Missing required "name" field' });
  }
  if (!fields["description"]) {
    issues.push({
      level: "error",
      message: 'Missing required "description" field',
    });
  }
  return issues;
}

function validateSkill(
  fields: Record<string, string>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!fields["description"] && !fields["when_to_use"]) {
    issues.push({
      level: "error",
      message: 'Missing required "description" field',
    });
  }
  return issues;
}

function validateCommand(
  fields: Record<string, string>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!fields["description"]) {
    issues.push({
      level: "error",
      message: 'Missing required "description" field',
    });
  }
  return issues;
}

// --- File type detection ---

function detectFileType(filePath: string): FileType | null {
  const inSkillContent = /\/skills\/[^/]+\//.test(filePath);
  if (filePath.includes("/agents/") && !inSkillContent) return "agent";
  if (filePath.includes("/skills/") && basename(filePath) === "SKILL.md")
    return "skill";
  if (filePath.includes("/commands/") && !inSkillContent) return "command";
  return null;
}

// --- File discovery ---

function findMdFiles(
  baseDir: string,
): { path: string; type: FileType }[] {
  const results: { path: string; type: FileType }[] = [];

  function walk(dir: string) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        walk(fullPath);
      } else if (entry.name.endsWith(".md")) {
        const type = detectFileType(fullPath);
        if (type) {
          results.push({ path: fullPath, type });
        }
      }
    }
  }

  walk(baseDir);
  return results;
}

// --- Main ---

function main() {
  const args = process.argv.slice(2);

  let files: { path: string; type: FileType }[];
  let baseDir: string;

  if (args.length > 0 && args.every((a) => a.endsWith(".md"))) {
    baseDir = process.cwd();
    files = [];
    for (const arg of args) {
      const fullPath = resolve(arg);
      const type = detectFileType(fullPath);
      if (type) {
        files.push({ path: fullPath, type });
      }
    }
  } else {
    baseDir = args[0] || process.cwd();
    files = findMdFiles(baseDir);
  }

  let totalErrors = 0;
  let totalWarnings = 0;

  console.log(`Validating ${files.length} frontmatter files...\n`);

  for (const { path: filePath, type } of files) {
    const rel = relative(baseDir, filePath);
    const content = readFileSync(filePath, "utf-8");
    const result = parseFrontmatter(content);

    const issues: ValidationIssue[] = [];

    if (result.error) {
      issues.push({ level: "error", message: result.error });
    }

    if (!result.error) {
      switch (type) {
        case "agent":
          issues.push(...validateAgent(result.fields));
          break;
        case "skill":
          issues.push(...validateSkill(result.fields));
          break;
        case "command":
          issues.push(...validateCommand(result.fields));
          break;
      }
    }

    if (issues.length > 0) {
      console.log(`${rel} (${type})`);
      for (const issue of issues) {
        const prefix = issue.level === "error" ? "  ERROR" : "  WARN ";
        console.log(`${prefix}: ${issue.message}`);
        if (issue.level === "error") totalErrors++;
        else totalWarnings++;
      }
      console.log();
    }
  }

  console.log("---");
  console.log(
    `Validated ${files.length} files: ${totalErrors} errors, ${totalWarnings} warnings`,
  );

  if (totalErrors > 0) {
    process.exit(1);
  }
}

main();
