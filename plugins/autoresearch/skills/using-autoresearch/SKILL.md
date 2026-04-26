---
name: using-autoresearch
description: Discovers and routes to the right AutoResearch skill. Use when starting a research task, when unsure which autoresearch command to run, or when you need to understand the AutoResearch workflow.
---

# Using AutoResearch

## Overview

AutoResearch is an autonomous research framework. You define a research goal, and AI agents automatically iterate, evaluate, and improve until convergence criteria are met or the budget is exhausted. This meta-skill helps you discover and apply the right skill for your current task.

## Skill Discovery

When a research-related task arrives, identify the phase and apply the corresponding skill:

```text
Task arrives
    │
    ├── Want to research something new?  ──→ /autoresearch-init  (research-design)
    ├── Have a session, need to run it?   ──→ /autoresearch-run   (research-execution)
    ├── Session done, need a report?      ──→ /autoresearch-report (research-reporting)
    ├── Want to understand AutoResearch?  ──→ /autoresearch-help
    └── Want to tweak program.md?         ──→ research-design skill (direct)
```

### Detecting Existing Sessions

Before suggesting a command, check if sessions already exist:

```bash
ls -d .autoresearch/*/program.md 2>/dev/null
```

- If sessions exist, check `results.tsv` for the latest round and score
- Suggest the appropriate next action based on session state

## Core Behaviors

These apply across all AutoResearch skills. They are non-negotiable.

### 1. program.md Is the Single Source of Truth

Never invent rules, steps, scoring formulas, or agent prompts. Everything comes from `program.md`. If something is ambiguous in `program.md`, surface the ambiguity — do not fill in the gaps yourself.

### 2. Surface Assumptions

Before proceeding with any non-trivial decision, state your assumptions explicitly:

```text
ASSUMPTIONS I'M MAKING:
1. [assumption about the research objective]
2. [assumption about agent behavior]
3. [assumption about evaluation criteria]
→ Correct me now or I'll proceed with these.
```

### 3. Respect Editable/Frozen Scope

`program.md` defines which files are editable and which are frozen. Never modify frozen files. Never read files that `program.md` forbids reading.

### 4. draft.md Is the Primary Deliverable

Every research session maintains a cumulative artifact at `$RESEARCH_DIR/draft.md`. It must be updated every round and serves as the primary content source for reporting.

## Failure Modes to Avoid

1. Inventing rules or steps not in `program.md`
2. Skipping evaluation rounds to "save time"
3. Modifying frozen files or reading forbidden files
4. Stopping the loop before convergence criteria are met
5. Forgetting to update `draft.md` after a round
6. Asking the user whether to continue instead of being autonomous
7. Summarizing `draft.md` instead of updating it with full detail
8. Using generic agent names or boilerplate prompts instead of deriving from the conversation
