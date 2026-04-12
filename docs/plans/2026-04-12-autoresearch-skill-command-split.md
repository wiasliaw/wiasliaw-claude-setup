# AutoResearch Skill/Command Split — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split autoresearch commands into thin shell commands + standalone skills with supplementary files, following agent-skills design patterns.

**Architecture:** Extract methodology knowledge from 3 commands into 3 skills + 1 meta-skill. Commands become ~15-line dispatchers. Supplementary reference files are split out for on-demand loading. New content (anti-rationalization tables, verification gates) is added to each skill.

**Tech Stack:** Markdown (YAML frontmatter), Claude Code plugin system (convention-based skill discovery via `skills/<name>/SKILL.md`)

---

## Task 1: Create skill directory structure

**Files:**
- Create: `plugins/autoresearch/skills/using-autoresearch/SKILL.md`
- Create: `plugins/autoresearch/skills/research-design/SKILL.md`
- Create: `plugins/autoresearch/skills/research-design/agent-types.md`
- Create: `plugins/autoresearch/skills/research-design/convergence-patterns.md`
- Create: `plugins/autoresearch/skills/research-design/evaluation-patterns.md`
- Create: `plugins/autoresearch/skills/research-execution/SKILL.md`
- Create: `plugins/autoresearch/skills/research-execution/loop-patterns.md`
- Create: `plugins/autoresearch/skills/research-reporting/SKILL.md`

**Step 1: Create directories**

Run: `mkdir -p plugins/autoresearch/skills/{using-autoresearch,research-design,research-execution,research-reporting}`

**Step 2: Verify structure**

Run: `find plugins/autoresearch/skills -type d`
Expected: 5 directories (skills/ + 4 subdirectories)

**Step 3: Commit**

```bash
git add plugins/autoresearch/skills/
git commit --allow-empty -m "chore: create autoresearch skill directory structure"
```

---

## Task 2: Write meta-skill `using-autoresearch`

**Files:**
- Create: `plugins/autoresearch/skills/using-autoresearch/SKILL.md`

**Step 1: Write SKILL.md**

Content requirements:
- Frontmatter: `name: using-autoresearch`, `description:` must include "Use when" trigger phrase for routing
- Section: `## Overview` — 1-2 sentences on what AutoResearch is
- Section: `## Skill Discovery` — ASCII decision tree routing to 4 commands + direct skill access
- Section: `## Core Behaviors` — 4 cross-skill norms (program.md is truth, surface assumptions, respect scope, draft.md is deliverable)
- Section: `## Failure Modes to Avoid` — list of common mistakes (inventing rules, skipping evaluation, modifying frozen files)
- No supplementary files — this skill is self-contained

Reference the routing tree from the design proposal (lines 56-71 of `.claude/plans/2026-04-12-autoresearch-skill-command-split.md`).

**Step 2: Validate frontmatter**

Run: `head -5 plugins/autoresearch/skills/using-autoresearch/SKILL.md`
Expected: valid YAML frontmatter with `---` delimiters, `name:`, `description:`

**Step 3: Commit**

```bash
git add plugins/autoresearch/skills/using-autoresearch/SKILL.md
git commit -m "feat: add using-autoresearch meta-skill with routing and core behaviors"
```

---

## Task 3: Write skill `research-design` — SKILL.md

Extract methodology from current `plugins/autoresearch/commands/autoresearch-init.md` (170 lines).

**Files:**
- Create: `plugins/autoresearch/skills/research-design/SKILL.md`

**Step 1: Write SKILL.md**

Content requirements:
- Frontmatter: `name: research-design`, `description:` with "Use when" triggers (designing research, defining agents, choosing evaluation)
- `## Overview` — what research design is, why it matters
- `## When to Use` — starting new research, re-designing existing program.md
- `## When NOT to Use` — running an existing session (use research-execution), generating a report (use research-reporting)
- `## The Design Process` — lean version of Phase 1-4 flow from current init command:
  - Phase 1: Understand the Research Topic (ask goal, WebSearch for prior art, brainstorm)
  - Phase 2: Interactive Design Conversation (topics to cover, one question at a time)
  - Phase 3: Generate program.md (skeleton template)
  - Phase 4: Save and Confirm
- `## Conversation Guidelines` — extracted from current init command lines 106-114 (ask one question at a time, reflect back, propose concrete suggestions)
- `## On-Demand References` — instruct agent to read supplementary files when needed:
  - "When discussing agent design, read `agent-types.md` in this skill directory"
  - "When discussing convergence, read `convergence-patterns.md` in this skill directory"
  - "When discussing evaluation, read `evaluation-patterns.md` in this skill directory"
- `## Verification Gates` — inline checks per phase:
  - After Phase 1: "Confirm research objective is clear and specific before proceeding"
  - After Phase 2: "All topics covered? Agent types defined? Convergence criteria set?"
  - After Phase 3: "Every section of program.md populated from conversation — no boilerplate"
- `## Anti-Rationalization Table`:
  ```text
  | Rationalization | Reality |
  |---|---|
  | "The user seems to know what they want, I'll skip the questions" | Assumptions kill research quality. Ask anyway. |
  | "I'll use a standard agent setup" | Every research problem is different. Derive from the conversation. |
  | "Convergence criteria can be figured out later" | Without stopping conditions, the loop runs forever or stops randomly. |
  | "I'll add some extra agents that might be useful" | YAGNI. Only agents discussed and agreed upon. |
  ```
- `## Output Specification` — program.md skeleton (from current init command lines 120-143)

**Key extraction rules:**
- Phase 2 topics list (lines 43-101 of current init): keep the topic headers and brief descriptions in SKILL.md, but move the detailed trade-off discussions to supplementary files
- The agent type table (team-agent / sub-agent / one-shot) and context-passing guidance (lines 62-73): move entirely to `agent-types.md`
- program.md skeleton (lines 120-143): keep in SKILL.md as the output specification

**Step 2: Verify frontmatter and section count**

Run: `grep "^## " plugins/autoresearch/skills/research-design/SKILL.md | wc -l`
Expected: 8 sections (Overview, When to Use, When NOT to Use, The Design Process, Conversation Guidelines, On-Demand References, Verification Gates, Anti-Rationalization Table, Output Specification — 9 total, or grouped as fits)

**Step 3: Commit**

```bash
git add plugins/autoresearch/skills/research-design/SKILL.md
git commit -m "feat: add research-design skill extracted from autoresearch-init"
```

---

## Task 4: Write `research-design` supplementary files

**Files:**
- Create: `plugins/autoresearch/skills/research-design/agent-types.md`
- Create: `plugins/autoresearch/skills/research-design/convergence-patterns.md`
- Create: `plugins/autoresearch/skills/research-design/evaluation-patterns.md`

**Step 1: Write `agent-types.md`**

Extract from current init command lines 62-73. Content:
- Agent type comparison table (team-agent / sub-agent / one-shot `claude -p`) with characteristics, best-for, cost
- Context-passing guidance for sub-agents (what to pass, feedback-summary.md pattern)
- Evaluator isolation principle (don't pass round history to evaluators)
- Producer context principle (pass cumulative context to writers/researchers)

**Step 2: Write `convergence-patterns.md`**

New reference content (not directly in current command, but implied by Phase 2 topics). Content:
- Common stopping conditions catalog: score threshold, round budget, consecutive plateau, composite criteria
- How to choose: optimization problems → score threshold; exploration → round budget; synthesis → plateau detection
- Example convergence configurations for different research types

**Step 3: Write `evaluation-patterns.md`**

New reference content derived from Phase 2 "Quality Definition" topic. Content:
- Quantitative vs qualitative evaluation approaches
- Scoring formula patterns: single metric, weighted composite, multi-dimensional
- Evaluator design: isolated (one-shot) vs contextual (sub-agent) trade-offs
- Example evaluation setups for different research types

**Step 4: Commit**

```bash
git add plugins/autoresearch/skills/research-design/
git commit -m "feat: add research-design supplementary reference files"
```

---

## Task 5: Write skill `research-execution`

Extract methodology from current `plugins/autoresearch/commands/autoresearch-run.md` (70 lines).

**Files:**
- Create: `plugins/autoresearch/skills/research-execution/SKILL.md`
- Create: `plugins/autoresearch/skills/research-execution/loop-patterns.md`

**Step 1: Write SKILL.md**

Content requirements:
- Frontmatter: `name: research-execution`, `description:` with "Use when" triggers
- `## Overview` — autonomous loop execution philosophy
- `## When to Use` — running a research session, resuming an interrupted session
- `## When NOT to Use` — no session exists (use research-design first), session complete and need report (use research-reporting)
- `## The Execution Cycle` — ASCII flowchart:
  ```text
  Locate session
       │
       ▼
  Read program.md (single source of truth)
       │
       ▼
  Read current state (results.tsv, draft.md)
       │
       ▼
  ┌──────────────────────────────────────┐
  │  Execute round per program.md Loop   │
  │       │                              │
  │       ▼                              │
  │  Evaluate (score, log to results)    │
  │       │                              │
  │       ▼                              │
  │  Converged? ──YES──→ End             │
  │       │                              │
  │      NO                              │
  │       │                              │
  │       ▼                              │
  │  Next round                          │
  └──────────────────────────────────────┘
  ```
- `## Per-Round Verification Gate`:
  ```text
  AFTER EACH ROUND, VERIFY:
  → Did all agents produce output?
  → Was draft.md updated?
  → Was results.tsv appended with this round's data?
  → Does the score computation match program.md's formula?
  → Were file restrictions (editable/frozen scope) respected?
  ```
- `## Error Recovery` — what to do when a round fails:
  - Agent produces no output → log the failure, retry once, then surface to user
  - Score decreases → this is normal, check if within expected variance, continue
  - program.md is ambiguous → STOP and surface the ambiguity, do not guess
- `## On-Demand References` — "For iteration strategy patterns, read `loop-patterns.md` in this skill directory"
- `## Anti-Rationalization Table`:
  ```text
  | Rationalization | Reality |
  |---|---|
  | "This round didn't improve, I should stop" | Check convergence criteria in program.md. Plateaus are expected. |
  | "The agent prompt seems wrong, let me fix it" | program.md is frozen mid-loop. Surface the issue, don't fix it. |
  | "I'll skip evaluation this round to save time" | Evaluation is the feedback signal. Skipping it blinds the loop. |
  | "I should ask the user if I should continue" | Be autonomous. Only stop for convergence or budget exhaustion. |
  | "draft.md is getting long, I'll summarize instead of updating" | draft.md is the primary deliverable. Update it fully every round. |
  ```
- `## End-of-Loop Checklist`:
  ```text
  - [ ] All agents cleaned up (teams shut down, sub-agents terminated)
  - [ ] results.tsv contains entries for every round
  - [ ] draft.md reflects the final state of research
  - [ ] Summary printed with score progression
  - [ ] User reminded to run /autoresearch-report
  ```
- `## Critical Rules` — extracted from current run command lines 59-67 (follow program.md, respect file restrictions, be autonomous, do not stop early, update draft.md every round)

**Step 2: Write `loop-patterns.md`**

New supplementary reference. Content:
- Sequential execution: agents run one after another, each sees previous output
- Parallel execution: independent agents run simultaneously, outputs merged
- Feedback flow: how evaluation results feed back into next round's agent prompts
- Depth progression: how some loops change strategy at different quality thresholds

**Step 3: Commit**

```bash
git add plugins/autoresearch/skills/research-execution/
git commit -m "feat: add research-execution skill extracted from autoresearch-run"
```

---

## Task 6: Write skill `research-reporting`

Extract methodology from current `plugins/autoresearch/commands/autoresearch-report.md` (170 lines).

**Files:**
- Create: `plugins/autoresearch/skills/research-reporting/SKILL.md`

**Step 1: Write SKILL.md**

Content requirements:
- Frontmatter: `name: research-reporting`, `description:` with "Use when" triggers
- `## Overview` — report generation philosophy (self-contained, publishable quality)
- `## When to Use` — session complete or in-progress, need comprehensive report
- `## When NOT to Use` — session hasn't started, want to check quick status (just read results.tsv)
- `## The Report Process` — Steps 1-5 from current report command:
  - Step 1: Locate session
  - Step 2: Gather data (read ALL inputs — program.md, draft.md, results.tsv, git history, round directories)
  - Step 3: Analyze program.md (identify evaluation metrics, agent architecture, iteration strategy, convergence criteria)
  - Step 4: Write report (two-part structure: Research Content + Research Process)
  - Step 5: Save and confirm
- `## Report Structure` — the report template from current command lines 74-128 (header, Executive Summary, Part I: Research Content, Part II: Research Process)
- `## Quality Gates`:
  ```text
  BEFORE SAVING THE REPORT, VERIFY:
  → Is the report fully self-contained? No references to external .md files.
  → Does Part I contain full research content, not summaries?
  → Are all round findings synthesized, not just the last round?
  → Would a reader unfamiliar with AutoResearch understand Part I?
  → Does the Progress Timeline cover every round?
  ```
- `## Anti-Rationalization Table`:
  ```text
  | Rationalization | Reality |
  |---|---|
  | "The draft.md is good enough as the report" | draft.md is a working document. The report must be polished and structured. |
  | "I'll summarize the detailed findings to keep it short" | Full detail, not summaries. Include everything substantive. |
  | "I'll link to the round files for details" | No external file references. All content must be inlined. |
  | "Part II (process) is the interesting part" | Part I (content) is the primary value. Research content comes first. |
  ```
- `## Critical Rules` — extracted from current report command lines 132-142

**Step 2: Commit**

```bash
git add plugins/autoresearch/skills/research-reporting/SKILL.md
git commit -m "feat: add research-reporting skill extracted from autoresearch-report"
```

---

## Task 7: Slim down commands to thin shells

**Files:**
- Modify: `plugins/autoresearch/commands/autoresearch-init.md` (replace 170 lines with ~15)
- Modify: `plugins/autoresearch/commands/autoresearch-run.md` (replace 70 lines with ~15)
- Modify: `plugins/autoresearch/commands/autoresearch-report.md` (replace 170 lines with ~15)

**Step 1: Rewrite `autoresearch-init.md`**

```markdown
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

If the skill is unavailable, read the SKILL.md at the plugin's `skills/research-design/` directory for full methodology.

**User's specification (if any):** $ARGUMENTS
```

**Step 2: Rewrite `autoresearch-run.md`**

```markdown
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
```

**Step 3: Rewrite `autoresearch-report.md`**

```markdown
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
```

**Step 4: Verify line counts**

Run: `wc -l plugins/autoresearch/commands/autoresearch-{init,run,report}.md`
Expected: each file under 25 lines

**Step 5: Commit**

```bash
git add plugins/autoresearch/commands/
git commit -m "refactor: slim down autoresearch commands to thin skill dispatchers"
```

---

## Task 8: Update README.md

**Files:**
- Modify: `plugins/autoresearch/README.md`

**Step 1: Read current README**

Read `plugins/autoresearch/README.md` to understand current content.

**Step 2: Update README**

Add a section explaining the skill/command architecture:
- Commands are entry points (thin dispatchers)
- Skills contain methodology (loaded on-demand)
- Supplementary files provide reference material (loaded when needed)
- List all skills with one-line descriptions

Keep existing content (workflow, FAQ, directory structure) but update to reflect the new structure.

**Step 3: Commit**

```bash
git add plugins/autoresearch/README.md
git commit -m "docs: update autoresearch README with skill/command architecture"
```

---

## Task 9: Run lint and validate

**Step 1: Run lint**

Run: `pnpm lint`
Expected: PASS (no markdown lint errors)

**Step 2: Run frontmatter validation**

Run: `node --experimental-strip-types .github/scripts/check-frontmatter.ts`
Expected: All skill SKILL.md files pass frontmatter validation (or are not matched by the glob — verify which glob pattern CI uses)

**Step 3: Check marketplace validation**

Run: `node --experimental-strip-types .github/scripts/check-marketplace-sorted.ts`
Expected: PASS

**Step 4: Fix any issues found, then commit**

```bash
git add -A
git commit -m "fix: resolve lint and validation issues from skill split"
```

---

## Task 10: Local install verification

**Step 1: Verify skill discovery**

Run: `ls -R plugins/autoresearch/skills/`
Expected: 4 skill directories, each with a SKILL.md

**Step 2: Verify file structure matches proposal**

Run: `find plugins/autoresearch -name "*.md" | sort`
Expected output matches the proposed structure from the design doc:
- commands/autoresearch-help.md
- commands/autoresearch-init.md
- commands/autoresearch-report.md
- commands/autoresearch-run.md
- README.md
- skills/research-design/SKILL.md
- skills/research-design/agent-types.md
- skills/research-design/convergence-patterns.md
- skills/research-design/evaluation-patterns.md
- skills/research-execution/SKILL.md
- skills/research-execution/loop-patterns.md
- skills/research-reporting/SKILL.md
- skills/using-autoresearch/SKILL.md

**Step 3: Verify commands are thin**

Run: `wc -l plugins/autoresearch/commands/autoresearch-{init,run,report}.md`
Expected: each under 25 lines

**Step 4: Verify skills have required sections**

Run: `for f in plugins/autoresearch/skills/*/SKILL.md; do echo "=== $f ==="; grep "^## " "$f"; done`
Expected: each skill has Overview, When to Use, anti-rationalization or verification sections

**Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "chore: final verification fixes for skill/command split"
```
