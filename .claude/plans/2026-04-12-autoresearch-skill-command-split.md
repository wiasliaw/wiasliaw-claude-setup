# Proposal: Autoresearch Skill/Command Split

## Problem

Current autoresearch plugin has **only commands** — no skills, no agents, no hooks. Each command (especially `autoresearch-init` and `autoresearch-run`) bundles flow control and methodology knowledge into a single large file. This causes:

1. **Context bloat** — every command invocation loads all knowledge, even when only partial is needed
2. **No reuse** — research design methodology is locked inside `autoresearch-init`, cannot be referenced independently
3. **No routing** — user must already know which command to run

## Design Principles (borrowed from agent-skills)

- Commands are thin shells (~15 lines): declare which skills to invoke, list high-level steps
- Skills are standalone modules: methodology knowledge + verification gates
- Supplementary files split reference material from process instructions
- Meta-skill handles routing via ASCII decision tree
- Skills are zero-coupled to each other; composition happens at command/meta-skill layer

## Proposed Structure

```text
plugins/autoresearch/
  .claude-plugin/
    plugin.json
  commands/
    autoresearch-init.md       # thin: invoke research-design skill
    autoresearch-run.md        # thin: invoke research-execution skill
    autoresearch-report.md     # thin: invoke research-reporting skill
    autoresearch-help.md       # keep as-is (already thin)
  skills/
    using-autoresearch/
      SKILL.md                 # meta-skill: routing + core behaviors
    research-design/
      SKILL.md                 # methodology for designing research programs
      agent-types.md           # supplementary: agent type trade-offs
      convergence-patterns.md  # supplementary: convergence strategy catalog
      evaluation-patterns.md   # supplementary: scoring & metrics approaches
    research-execution/
      SKILL.md                 # methodology for running autonomous loops
      loop-patterns.md         # supplementary: iteration strategies
    research-reporting/
      SKILL.md                 # methodology for synthesizing reports
  README.md
```

## Detailed Changes

### 1. New: Meta-skill `using-autoresearch`

**Purpose:** Session start routing + cross-skill behavioral norms.

```markdown
# Using AutoResearch

## Skill Discovery

Task arrives
    │
    ├── Want to research something new?  ──→ /autoresearch-init (research-design)
    ├── Have a session, need to run it?   ──→ /autoresearch-run (research-execution)
    ├── Session done, need a report?      ──→ /autoresearch-report (research-reporting)
    ├── Want to understand autoresearch?  ──→ /autoresearch-help
    └── Want to tweak program.md?         ──→ research-design skill (direct)

## Core Behaviors (apply to all skills)

1. program.md is single source of truth — never invent rules
2. Surface assumptions before proceeding
3. Respect editable/frozen scope
4. draft.md is the primary deliverable — update every round
```

### 2. New: Skill `research-design`

Extract from current `autoresearch-init.md`:

| Current location | Move to |
|---|---|
| Phase 2 agent type trade-offs table | `agent-types.md` (supplementary) |
| Phase 2 convergence & stopping discussion | `convergence-patterns.md` (supplementary) |
| Phase 2 quality definition / evaluation | `evaluation-patterns.md` (supplementary) |
| Phase 1-4 flow + conversation guidelines | `SKILL.md` (main) |

**SKILL.md sections:**
- Overview
- When to Use / When NOT to use
- The Design Process (Phase 1-4 flow, kept lean)
- Inline verification gates per phase
- Anti-rationalization table
- Output specification (program.md skeleton)

**Key change:** SKILL.md references supplementary files with `Read agent-types.md in this skill directory when discussing agent design`. This way the supplementary material is loaded on-demand, not always.

### 3. New: Skill `research-execution`

Extract from current `autoresearch-run.md`:

**SKILL.md sections:**
- Overview
- When to Use / When NOT to use
- The Execution Cycle (ASCII flowchart)
- Per-round verification gate
- Convergence checking process
- Error recovery (what to do when a round fails)
- Anti-rationalization table
- End-of-loop checklist

**Supplementary:** `loop-patterns.md` — catalog of iteration strategies (parallel vs sequential agents, feedback flow patterns).

**New content not in current command:**
- Per-round inline gate:
  ```text
  AFTER EACH ROUND, VERIFY:
  → Did all agents produce output?
  → Was draft.md updated?
  → Was results.tsv appended?
  → Does the score computation match program.md's formula?
  ```
- Anti-rationalization table:
  ```text
  | Rationalization | Reality |
  |---|---|
  | "This round didn't improve, I should stop" | Check convergence criteria. Plateaus are expected. |
  | "The agent prompt seems wrong, let me fix it" | program.md is frozen. Surface the issue, don't fix mid-loop. |
  | "I'll skip evaluation this round to save time" | Evaluation is the feedback signal. Skipping it blinds the loop. |
  ```

### 4. New: Skill `research-reporting`

Extract from current `autoresearch-report.md`:

**SKILL.md sections:**
- Overview
- When to Use / When NOT to use
- The Report Process (Step 1-5)
- Quality gates for report completeness
- Anti-rationalization table

This one is relatively clean already — the current command's structure maps well to a skill.

### 5. Slim down Commands

Each command becomes ~15 lines:

**`autoresearch-init.md` (after):**
```markdown
---
allowed-tools: Read, Write, Bash, WebSearch, WebFetch
description: Initialize an autonomous research session
---

Invoke the autoresearch:research-design skill.

1. Ask user for research goal (or use $ARGUMENTS)
2. Use WebSearch to explore domain and prior art
3. Interactively design: objective, agents, evaluation, convergence
4. Generate program.md and supporting files
5. Confirm with user

Save to .autoresearch/<research-id>/
```

**`autoresearch-run.md` (after):**
```markdown
---
allowed-tools: Read, Write, Bash
description: Run the autonomous research loop
---

Invoke the autoresearch:research-execution skill.

1. Locate session (from $ARGUMENTS or ask)
2. Read program.md — it is the complete operating manual
3. Read current state from results.tsv and draft.md
4. Execute rounds per program.md's Loop section
5. Evaluate and check convergence after each round
6. Cleanup and print summary when done

Remind user: run /autoresearch-report to generate report.
```

## Migration Steps

1. Create `skills/` directory structure and write all SKILL.md files
2. Extract supplementary files from current command content
3. Add anti-rationalization tables and verification gates (new content)
4. Slim down commands to thin shells
5. Create meta-skill
6. Update README.md
7. Test: install plugin locally, verify commands still trigger correct skill flow

## Scope Boundary

**In scope:**
- Structural refactor (split commands into skills + thin commands)
- New content: anti-rationalization tables, verification gates, meta-skill

**Out of scope:**
- New features or commands
- Changes to program.md format or research loop logic
- Agent persona files (could be a follow-up)
- Changes to autoresearch-help.md (already thin enough)
- SessionStart hook (see Future Enhancements)

## Risk

- **Behavioral change:** Slimming commands means the LLM relies on skill content for methodology. If skill loading fails silently, the command becomes too vague to execute. Mitigation: commands should include enough high-level steps to be minimally functional standalone.

## Future Enhancements

- **SessionStart hook:** Autoresearch is a domain-specific tool, not a general-purpose skill set. Unlike superpowers (which needs to influence every task), autoresearch only activates when explicitly invoked. A SessionStart hook that injects the meta-skill into every session would cost ~1000 tokens with no benefit in non-research sessions. If session detection becomes valuable (e.g., reminding users of unfinished research), it can be added later as an opt-in hook. The meta-skill `using-autoresearch` is still discoverable via the Skill tool without a hook.
- **Agent persona templates:** Pre-built agent definitions (e.g., evaluator, synthesizer) as supplementary reference for the research-design skill.
