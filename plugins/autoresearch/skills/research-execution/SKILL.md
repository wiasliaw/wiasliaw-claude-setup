---
name: research-execution
description: Executes autonomous research loops. Use when running a research session, resuming an interrupted session, or when you need to follow program.md's loop to iterate agents until convergence or budget exhaustion.
---

# Research Execution

## Overview

Execute the autonomous research loop defined by `program.md`. Read the program, follow it precisely, iterate rounds, evaluate, and stop only when convergence criteria are met or the round budget is exhausted. Be autonomous — do not ask the user whether to continue.

## When to Use

- Running a research session for the first time
- Resuming an interrupted session (reads state from `results.tsv`)
- Re-running after `program.md` was modified

## When NOT to Use

- No session exists yet — use `research-design` skill to create one first
- Session is complete and you need a report — use `research-reporting` skill
- You want to modify the research design — use `research-design` skill

## The Execution Cycle

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
Execute Setup (if first round)
     │
     ▼
┌─────────────────────────────────────────┐
│                                         │
│  Execute round per program.md's Loop    │
│       │                                 │
│       ▼                                 │
│  ── Per-Round Verification Gate ──      │
│       │                                 │
│       ▼                                 │
│  Evaluate (score, log to results.tsv)   │
│       │                                 │
│       ▼                                 │
│  Converged? ──YES──→ End                │
│       │                                 │
│      NO                                 │
│       │                                 │
│       ▼                                 │
│  Next round                             │
│                                         │
└─────────────────────────────────────────┘
     │
     ▼
Cleanup + Summary
```

## Startup

1. **Locate session.** Find an active session under `.autoresearch/`. If the user specified one in arguments, use that. If multiple exist and none specified, ask.
2. **Read program.md.** Read `$RESEARCH_DIR/program.md` in full. This defines everything.
3. **Read current state.** Read `results.tsv` to determine resume point. Read `draft.md` for current artifact state.
4. **Execute Setup.** Follow program.md's **Setup** section exactly — create teams, spawn agents, initialize state.

## Loop

For each round, follow program.md's **Loop** section step by step. Do not skip, reorder, or invent steps.

After each round, apply the Per-Round Verification Gate before proceeding to Evaluation.

## Per-Round Verification Gate

```text
AFTER EACH ROUND, VERIFY:
→ Did all agents produce output?
→ Was draft.md updated with this round's findings?
→ Was results.tsv appended with this round's data?
→ Does the score computation match program.md's formula?
→ Were file restrictions (editable/frozen scope) respected?
```

If any check fails, diagnose and fix before proceeding to the next round.

## Evaluation

Follow program.md's **Evaluation** section to compute scores. Extract metrics as the program defines, apply its scoring formula, determine status, and log results to `results.tsv`.

Check for depth promotion using the criteria in program.md's depth level definitions (if applicable).

## Convergence

After scoring, check program.md's **Convergence** section. Stop the loop if and only if those criteria are met, or the round budget is exhausted.

If not converged, continue to the next round.

## Error Recovery

When something goes wrong during a round:

```text
Problem encountered
├── Agent produces no output
│   └── Log the failure, retry once with same input
│       ├── Retry succeeds → continue
│       └── Retry fails → surface to user, pause loop
├── Score decreases from previous round
│   └── This is normal. Check if within expected variance.
│       Continue unless program.md defines regression handling.
├── program.md is ambiguous about a step
│   └── STOP. Surface the specific ambiguity. Do not guess.
├── File restriction violated
│   └── Undo the change. Log the violation. Continue.
└── Agent crashes or times out
    └── Log the error. Skip this agent for this round.
        Note the skip in results.tsv. Continue.
```

## On-Demand References

For iteration strategy patterns (parallel vs sequential, feedback flow, depth progression), read `loop-patterns.md` in this skill directory.

## End

When the loop ends:

1. **Cleanup agents** — shut down teams and agents per program.md's cleanup instructions
2. **Print summary** — display `results.tsv` as a formatted table, show score progression
3. **Remind user:** "Session complete. Run `/autoresearch-report` to generate a detailed report."

## End-of-Loop Checklist

```text
BEFORE DECLARING THE LOOP COMPLETE:
- [ ] All agents cleaned up (teams shut down, sub-agents terminated)
- [ ] results.tsv contains entries for every round that executed
- [ ] draft.md reflects the final state of research
- [ ] Summary printed with score progression
- [ ] User reminded to run /autoresearch-report
```

## Critical Rules

- **Follow program.md precisely.** It is the single source of truth for all loop logic, scoring, agent prompts, and stopping criteria.
- **Respect file restrictions.** program.md defines which files are frozen and which are editable.
- **Be autonomous.** Do not ask the user whether to continue — keep running rounds until convergence or budget exhaustion.
- **Do not stop early** unless the convergence criteria defined in program.md are satisfied.
- **Do not read files program.md forbids.**
- **Update draft.md every round.** This is the cumulative research artifact and primary deliverable.
- **Do not produce a final synthesis report.** Reporting is handled by `/autoresearch-report`.

## Anti-Rationalization Table

| Rationalization | Reality |
|---|---|
| "This round didn't improve, I should stop" | Check convergence criteria in program.md. Plateaus are expected and accounted for. |
| "The agent prompt seems wrong, let me fix it" | program.md is frozen mid-loop. Surface the issue to the user, don't fix it yourself. |
| "I'll skip evaluation this round to save time" | Evaluation is the feedback signal. Skipping it blinds the entire loop. |
| "I should ask the user if I should continue" | Be autonomous. Only stop for convergence criteria or budget exhaustion. |
| "draft.md is getting long, I'll summarize instead of updating" | draft.md is the primary deliverable. Update it fully every round. |
| "This agent's output looks wrong, I'll correct it manually" | Agents produce what they produce. Log it, score it, let the loop self-correct. |
| "I'll combine two rounds to move faster" | Each round is a discrete unit. Combining rounds breaks the evaluation cycle. |
