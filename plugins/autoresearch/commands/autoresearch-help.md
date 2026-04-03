---
description: Show how AutoResearch works and how to use it
---

# AutoResearch Help

AutoResearch is an autonomous research framework built on Claude Code. You define a research goal, and AI agents automatically iterate, evaluate, and improve until convergence criteria are met or the budget is exhausted.

---

## Key Features

### Conversation-Driven Design
Every detail — agents, scoring formulas, iteration strategies, stopping conditions — emerges from an interactive conversation during `/autoresearch-init`. No predefined templates. Your research problem shapes the entire setup.

### Multi-Agent Architecture
Design different types of agents based on your research needs:

| Agent Type | Characteristics | Best For |
|---|---|---|
| **team-agent** | Persistent across rounds, accumulates context | Tasks requiring memory over time |
| **sub-agent** | Fresh each round, receives context from orchestrator | Tasks needing a fresh perspective |
| **one-shot (`claude -p`)** | Fully isolated, no tool access | Unbiased evaluation tasks |

### Autonomous Iteration Loop
Each round runs automatically: agent output -> evaluation & scoring -> feedback integration -> improvement -> next round. No manual intervention required.

### Flexible Convergence Criteria
You define when the research is "done" — score thresholds, round budgets, consecutive plateau counts, or custom criteria.

---

## Workflow

AutoResearch has three stages, each with its own command:

### 1. `/autoresearch-init` — Design the Research Program

An interactive conversation covering:

- **Research objective**: What are you researching? Optimization, exploration, synthesis, auditing?
- **Quality definition**: What counts as "good" output? What metrics to use?
- **Agent design**: Which agents are needed? Their roles, types, and prompts
- **Iteration strategy**: Execution order per round, information flow between agents
- **Convergence criteria**: When to stop?
- **File scope**: Which files are editable vs. frozen

After the conversation, the following files are generated:
```text
.autoresearch/<research-id>/
  program.md          # Research program (complete operating manual)
  draft.md            # Cumulative research artifact (initialized with agreed-upon structure)
  topic.md            # Research scope document (if applicable)
  <agent-prompts>     # Prompt files for each agent
```

### 2. `/autoresearch-run` — Execute the Research Loop

Reads `program.md` as the sole operating manual and runs autonomously:

1. Locate the session and read `program.md`
2. Load current state from the tracking file (e.g., `results.tsv`) to determine resume point
3. Execute Setup as defined in `program.md` — create teams, spawn agents, initialize state
4. Run each round step by step per `program.md`'s Loop section
5. Compute scores per the Evaluation section
6. Check Convergence criteria — continue or stop
7. Cleanup agents and print a results summary when the loop ends

Fully autonomous — it will not pause to ask whether to continue.

### 3. `/autoresearch-report` — Generate a Research Report

Produces a report from a completed (or in-progress) session, including:

- **Executive Summary**: Research goal, major discoveries, quality evolution
- **Progress Timeline**: Score and status changes per round
- **Key Findings**: Discoveries organized by theme
- **What Didn't Work**: Issues that persisted across rounds
- **Recommendations**: Suggestions for follow-up research

The report structure adapts dynamically based on `program.md` — if your research defines depth levels, the report includes a corresponding section; if not, it won't.

Output: `.autoresearch/<research-id>/report-final.md`

---

## Quick Start

```bash
# Step 1: Design the research program
/autoresearch-init <describe your research topic>

# Step 2: Run the autonomous research loop
/autoresearch-run

# Step 3: Generate the report
/autoresearch-report
```

---

## Directory Structure

The exact layout is defined by each session's `program.md`. A typical session looks like:

```text
.autoresearch/
  <research-id>/
    program.md              # Research program (single source of truth)
    draft.md                # Cumulative research artifact (updated every round)
    topic.md                # Research scope document (if applicable)
    prompts/                # Agent prompt files
      <agent-name>.md
    rounds/                 # Round-by-round data and feedback
      round-01/             #   or round-01.md, depending on program.md
      round-02/
      ...
    results.tsv             # Score and status tracking (format varies)
    report-final.md         # Final report (from /autoresearch-report)
```

---

## FAQ

**Q: Can I pause and resume?**
Yes. `/autoresearch-run` reads the tracking file (e.g., `results.tsv`) on startup and resumes from where it left off.

**Q: Can I run multiple research sessions at once?**
Yes. Each session has its own `<research-id>` directory. Specify the research-id when running commands.

**Q: Can I manually edit `program.md`?**
Yes. It's just a Markdown file. Adjust the scoring formula, add/remove agents, or change stopping conditions, then re-run `/autoresearch-run`.

**Q: What if I'm not happy with the results?**
Check the Recommendations section in `report-final.md` to see what's worth exploring further. Then tweak `program.md` and re-run, or start fresh with `/autoresearch-init`.
