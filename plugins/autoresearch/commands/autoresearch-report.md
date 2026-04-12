---
allowed-tools: Read, Write, Bash
description: Generate a research report from a completed (or in-progress) autoresearch session
---

Invoke the autoresearch:research-reporting skill.

1. Locate session (from $ARGUMENTS or ask)
2. Read ALL inputs: program.md, draft.md, results.tsv, git history, every round directory
3. Analyze program.md to determine report structure
4. Write self-contained report (Part I: Research Content, Part II: Research Process)
5. Save to $RESEARCH_DIR/report-final.md

If the skill is unavailable, read the SKILL.md at the plugin's `skills/research-reporting/` directory for full methodology.

**User's specification (if any):** $ARGUMENTS
