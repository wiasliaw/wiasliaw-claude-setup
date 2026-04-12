---
allowed-tools: Read, Write, Bash
description: Run the autonomous research loop — reads program.md as the complete operating manual and iterates until convergence or budget exhausted
---

Invoke the autoresearch:research-execution skill.

1. Locate session (from $ARGUMENTS or ask)
2. Read program.md — it is the complete operating manual
3. Read current state from results.tsv and draft.md
4. Execute rounds per program.md's Loop section
5. Evaluate and check convergence after each round
6. Cleanup and print summary when done

Remind user: run /autoresearch-report to generate report.

If the skill is unavailable, read the SKILL.md at the plugin's `skills/research-execution/` directory for full methodology.

**User's specification (if any):** $ARGUMENTS
