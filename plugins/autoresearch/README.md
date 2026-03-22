# AutoResearch

Autonomous research framework built on Claude Code. Define a research goal, and AI agents automatically iterate, evaluate, and improve until convergence criteria are met or the budget is exhausted.

Inspired by [karpathy/autoresearch](https://github.com/karpathy/autoresearch).

## How It Works

AutoResearch uses a conversation-driven approach — no hardcoded agents, scoring formulas, or iteration patterns. You describe your research problem, and `/autoresearch-init` designs a custom research program through an interactive conversation.

The result is a `program.md` that fully specifies:
- **Agents**: what they do, how they interact, what type they are
- **Evaluation**: scoring formula, quality dimensions, metrics
- **Iteration**: round structure, information flow, state management
- **Convergence**: when the research is "done"

Then `/autoresearch-run` executes the loop autonomously. Finally, `/autoresearch-report` for final report.

### Agent Types

| Type | Behavior | Best For |
|---|---|---|
| **team-agent** | Persistent across rounds, accumulates context | Tasks requiring memory over time |
| **sub-agent** | Fresh each round, receives context from orchestrator | Tasks needing fresh perspective |
| **one-shot (`claude -p`)** | Fully isolated, no tool access | Unbiased evaluation |

## Commands

| Command | Description |
|---|---|
| `/autoresearch-init` | Interactive design session — produces `program.md` and agent prompts |
| `/autoresearch-run` | Executes the research loop defined in `program.md` |
| `/autoresearch-report` | Generates a structured report from session data |
| `/autoresearch-help` | Shows documentation and usage guide |

## Session Structure

Each research session lives under `.autoresearch/<research-id>/`. The exact layout is defined by the session's `program.md`. A typical session:

```text
.autoresearch/<research-id>/
  program.md              # Research program (single source of truth)
  topic.md                # Research scope document
  rounds/                 # Round-by-round data and feedback
  results.tsv             # Score tracking
  report-final.md         # Generated report
```
