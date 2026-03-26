---
name: verify
description: Run all project validation checks (lint, frontmatter, marketplace). Use before committing or when you want to confirm everything passes CI.
---

Run the following validation steps in order. Stop on first failure and report the error.

## Step 1: Lint

```bash
pnpm lint
```

## Step 2: Frontmatter Validation

Find all files matching `**/agents/*.md`, `**/skills/*/SKILL.md`, and `**/commands/*.md`, then validate their YAML frontmatter:

```bash
node --experimental-strip-types .github/scripts/validate-frontmatter.ts
```

## Step 3: Marketplace Validation

Validate `.claude-plugin/marketplace.json` structure and sorting:

```bash
node --experimental-strip-types .github/scripts/validate-marketplace.ts
node --experimental-strip-types .github/scripts/check-marketplace-sorted.ts
```

## On Failure

If any step fails, report which step failed and the error output. If marketplace sorting fails, suggest running the fix command:

```bash
node --experimental-strip-types .github/scripts/check-marketplace-sorted.ts --fix
```