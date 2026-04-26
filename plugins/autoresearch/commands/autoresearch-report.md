---
allowed-tools: Read, Write, Bash
description: Generate a research report from a completed (or in-progress) autoresearch session
---

Invoke the autoresearch:research-reporting skill.

1. Locate session (from $ARGUMENTS or ask) — set `RESEARCH_DIR=.autoresearch/<research-id>`
2. Read ALL inputs allowed by `program.md` (program.md, draft.md, results.tsv, git history, every round directory). Honor any read restrictions program.md defines.
3. Analyze program.md to determine report structure
4. Write self-contained report (Part I: Research Content, Part II: Research Process)
5. Save to `.autoresearch/<research-id>/report-final.md`

If the skill is unavailable, read `plugins/autoresearch/skills/research-reporting/SKILL.md` for full methodology.

**User's specification (if any):** $ARGUMENTS
