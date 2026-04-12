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

Then `/autoresearch-run` executes the loop autonomously. Finally, `/autoresearch-report` generates a comprehensive report.

## Architecture

AutoResearch follows a **command + skill** architecture:

- **Commands** are thin entry points (~15 lines) that dispatch to skills
- **Skills** contain methodology knowledge, verification gates, and anti-rationalization tables
- **Supplementary files** provide reference material loaded on-demand (not always in context)

### Skills

| Skill | Purpose |
|---|---|
| `using-autoresearch` | Meta-skill: routing and core behaviors across all skills |
| `research-design` | Methodology for designing research programs (agents, evaluation, convergence) |
| `research-execution` | Methodology for running autonomous loops with verification gates |
| `research-reporting` | Methodology for synthesizing self-contained reports |

### Supplementary References

| File | Loaded By | Content |
|---|---|---|
| `agent-types.md` | research-design | Agent type comparison, context-passing strategies |
| `convergence-patterns.md` | research-design | Stopping condition catalog and selection guide |
| `evaluation-patterns.md` | research-design | Scoring formulas, evaluator design patterns |
| `loop-patterns.md` | research-execution | Iteration strategies, feedback flow patterns |

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
  draft.md                # Cumulative research artifact (primary deliverable)
  topic.md                # Research scope document
  rounds/                 # Round-by-round data and feedback
  results.tsv             # Score tracking
  report-final.md         # Generated report
```

## Plugin Structure

```text
plugins/autoresearch/
  commands/                           # Thin command dispatchers
    autoresearch-init.md
    autoresearch-run.md
    autoresearch-report.md
    autoresearch-help.md
  skills/                             # Methodology and knowledge
    using-autoresearch/SKILL.md
    research-design/
      SKILL.md
      agent-types.md
      convergence-patterns.md
      evaluation-patterns.md
    research-execution/
      SKILL.md
      loop-patterns.md
    research-reporting/SKILL.md
  README.md
```
