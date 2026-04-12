# Agent Types Reference

Use this reference when discussing agent design during the research design conversation.

## Agent Type Comparison

| Type | Characteristics | Best For | Cost |
|---|---|---|---|
| **team-agent** | Persistent across rounds, accumulates context | Tasks requiring memory over time (e.g., building understanding incrementally) | Uses persistent context window |
| **sub-agent** | One-shot, receives context from orchestrator each round | Tasks needing file access but fresh perspective each round | No memory between invocations |
| **one-shot (`claude -p`)** | Fully isolated, no tool access, receives input via stdin | Unbiased evaluation where isolation from orchestrator is critical | No file access, limited context |

## Context-Passing for Sub-Agents

When a user chooses sub-agent type, discuss these questions:

1. **What context should the orchestrator pass?** Options:
   - Current artifact only (`draft.md`)
   - Evaluation feedback from previous round
   - Cumulative history of all rounds
   - A maintained `feedback-summary.md`

2. **Should the orchestrator maintain a `feedback-summary.md`?** If so, what should it contain?
   - Persistent issues that keep recurring
   - Resolved issues (so the agent doesn't revisit them)
   - Approaches tried and failed (so the agent doesn't repeat them)

## Context-Passing Principles

- **Evaluator agents** (any type used for scoring/judging): recommend NOT passing round history. Fresh, unanchored judgment produces more honest evaluation.
- **Producer agents** (writers, researchers, analysts): recommend passing cumulative context so they don't repeat failed approaches or lose progress.

## Baking Context-Passing Into program.md

The agreed context-passing rules must become explicit steps in program.md's **Loop** section. Example:

```markdown
## Loop

### Step 3: Spawn writer sub-agent
- Read `feedback-summary.md` and include it in the agent prompt
- Pass the current `draft.md` as input
- Do NOT pass raw round history or scores
```

## Choosing the Right Type

```text
Does the agent need memory across rounds?
├── YES → team-agent
└── NO
    ├── Does it need file access (read/write)?
    │   ├── YES → sub-agent
    │   └── NO
    │       └── Should it be isolated from orchestrator influence?
    │           ├── YES → one-shot (claude -p)
    │           └── NO → sub-agent (simpler to manage)
```
