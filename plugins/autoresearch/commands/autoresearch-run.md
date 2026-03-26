---
allowed-tools: Read, Write, Bash
description: Run the autonomous research loop — reads program.md as the complete operating manual and iterates until convergence or budget exhausted
---

# AutoResearch: Run Research Loop

You are a generic research executor. Read `program.md` — it is your complete operating manual. Every detail about agents, scoring, evaluation, depth levels, and loop mechanics lives there. You do not invent any of it yourself.

## Startup

1. **Locate session.** Find an active session under `.autoresearch/`. If the user specified one in the arguments, use that. If multiple exist and none specified, ask. If none exist, tell the user to run `/autoresearch-init` first.

   ```bash
   RESEARCH_DIR=.autoresearch/<research-id>
   ```

2. **Read program.md.** Read `$RESEARCH_DIR/program.md` in full. This defines everything: agent architecture, prompts, scoring formula, depth levels, promotion criteria, evaluation workflow, round budget, stopping criteria, and file restrictions.

3. **Read current state.** Read `$RESEARCH_DIR/results.tsv` to determine what round to resume from and what state (depth, scores, status) currently holds. Read `$RESEARCH_DIR/draft.md` to understand the current cumulative research artifact. If no rounds have run, you are starting fresh.

4. **Execute Setup.** Follow program.md's **Setup** section exactly — create teams, spawn agents, initialize state, check out the correct branch, and do whatever else it prescribes.

## Loop

For each round, follow program.md's **Loop** section step by step. Do not skip, reorder, or invent steps. The program defines:

- What each agent does and in what order
- What files to read and write
- How to read from and update `draft.md` (the cumulative research artifact)
- How to run evaluations (which may be parallel or sequential)
- How to merge feedback
- How and when to commit

Execute each step as program.md specifies. After each round, proceed to Evaluation.

## Evaluation

Follow program.md's **Evaluation** section to compute scores. Extract metrics as the program defines, apply its scoring formula, determine status, and log results to `results.tsv` in the format the program specifies.

Check for depth promotion using the criteria in program.md's depth level definitions.

## Convergence

After scoring, check program.md's **Convergence** section. Stop the loop if and only if those criteria are met, or the round budget is exhausted.

If not converged, continue to the next round.

## End

When the loop ends:

1. **Cleanup agents** — shut down any agents and teams created during Setup, following program.md's cleanup instructions.
2. **Print summary** — display `results.tsv` as a formatted table, show depth progression, and briefly analyze what improved and what persisted.
3. **Remind user:**
   > Session complete. Run `/autoresearch-report` to generate a detailed report.

## Critical Rules

- **Follow program.md precisely.** It is the single source of truth for all loop logic, scoring, agent prompts, and stopping criteria. Do not invent rules, steps, or formulas.
- **Respect file restrictions.** program.md defines which files are frozen and which are editable. Never modify frozen files.
- **Be autonomous.** Do not ask the user whether to continue — keep running rounds until convergence criteria are met or budget is exhausted.
- **Do not stop early** unless the convergence criteria defined in program.md are satisfied.
- **Do not read files program.md forbids you from reading.** If it says certain prompt files are off-limits to the orchestrator, obey that restriction.
- **Update `draft.md` every round.** This is the cumulative research artifact. Each round must refine, extend, or revise it as program.md specifies. `draft.md` is the primary deliverable of the loop.
- **Do not produce a final synthesis report.** The loop ends when convergence criteria are met. Reporting and synthesis are handled separately by `/autoresearch-report`.

---

**User's specification (if any):** $ARGUMENTS
