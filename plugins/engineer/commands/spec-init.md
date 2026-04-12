---
allowed-tools: Bash, Read, Write, Glob, Grep, WebFetch, WebSearch
description: Initialize OpenSpec in the current project — install CLI if needed, run openspec init, configure config.yaml
---

# spec-init

Announce: "Using engineer:spec-init to initialize OpenSpec."

## Step 1: Load Skill

Read `skills/openspec-workflow/SKILL.md` from this plugin directory for reference knowledge about OpenSpec concepts and CLI usage. Internalize the content — do not summarize it to the user.

## Step 2: Check Prerequisites

1. Run `node --version` and verify the version is >= 20.19.0. If Node.js is missing or too old, stop and tell the user.
2. Run `openspec --version` to check if the CLI is installed.
3. If the command fails (not found), install it:
   ```bash
   npm install -g @fission-ai/openspec@latest
   ```
   Confirm installation succeeded by running `openspec --version` again.

## Step 3: Initialize OpenSpec

Run `openspec init` in the project root. This creates the `openspec/` directory with default configuration files.

If `openspec/` already exists, inform the user and ask whether to proceed (re-init) or skip this step.

## Step 4: Guide config.yaml Setup

1. Read `openspec/config.yaml`.
2. Scan the codebase for tech stack signals — look for `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, `tsconfig.json`, `Makefile`, and similar files. Read them to detect:
   - Language and runtime
   - Frameworks and major dependencies
   - Testing tools (jest, vitest, pytest, cargo test, etc.)
   - Linting and formatting tools
3. Ask the user:
   - What is the project's primary tech stack? (Confirm or correct what you detected)
   - What testing framework do they use?
   - Any code conventions or architectural patterns to capture?
4. Update the `context` and `rules` fields in `openspec/config.yaml` based on the user's answers and your codebase analysis.

## Step 5: Verify

1. Confirm `openspec/` directory exists with `ls openspec/`.
2. Read `openspec/config.yaml` and verify it has meaningful, non-placeholder content in `context` and `rules`.
3. Print a summary:
   - OpenSpec directory location
   - Detected tech stack
   - Key config values that were set
   - Next step: suggest running `/spec:propose` to create the first proposal
