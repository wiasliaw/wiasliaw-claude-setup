# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Code plugin marketplace repository. Publishes the **AutoResearch** plugin (autonomous research framework) and supports future multi-plugin distribution.

## Commands

- **Lint**: `pnpm lint` (ESLint with `@eslint/markdown` — lints Markdown files)
- **Install**: `pnpm install`

## CI Validation

CI runs three checks on PRs:
1. `pnpm lint` — Markdown linting
2. Frontmatter validation — all files matching `**/agents/*.md`, `**/skills/*/SKILL.md`, `**/commands/*.md` must have valid YAML frontmatter
3. Marketplace validation — `.claude-plugin/marketplace.json` must have valid structure and plugins sorted alphabetically

## Code Style

- 2-space indentation, LF line endings, UTF-8 (see `.editorconfig`)
- Markdown files: do not trim trailing whitespace
- CI scripts use TypeScript with `--experimental-strip-types` (no tsconfig needed)

## Conventions

- **Commits**: Conventional Commits format (`feat:`, `fix:`, `chore:`, etc.)
- **Plugin commands**: defined as Markdown files with YAML frontmatter in `plugins/<name>/commands/`
- **Marketplace**: when adding plugins to `.claude-plugin/marketplace.json`, keep entries sorted alphabetically (CI enforces this; fix with `.github/scripts/check-marketplace-sorted.ts --fix`)

## Structure

- `plugins/` — plugin source directories
- `global/` — Claude Code settings templates
- `external_plugins/` — placeholder for external plugin references
- `.github/scripts/` — CI validation scripts (TypeScript)
