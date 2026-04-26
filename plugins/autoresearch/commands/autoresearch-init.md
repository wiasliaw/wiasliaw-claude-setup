---
allowed-tools: Read, Write, Bash, WebSearch, WebFetch
description: Initialize an autonomous research session — interactively design a research program
---

Invoke the autoresearch:research-design skill.

1. Ask user for research goal (or use $ARGUMENTS)
2. Use WebSearch to explore domain and prior art
3. Interactively design: objective, agents, evaluation, convergence
4. Generate program.md and supporting files
5. Confirm with user

Save to .autoresearch/<research-id>/

If the skill is unavailable, read `plugins/autoresearch/skills/research-design/SKILL.md` for full methodology.

**User's specification (if any):** $ARGUMENTS
