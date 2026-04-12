# Loop Patterns Reference

Use this reference when you need to understand iteration strategies defined in `program.md`.

## Execution Patterns

### Sequential Execution
Agents run one after another. Each agent sees the previous agent's output.

```text
Agent A → output → Agent B → output → Agent C → output → Evaluation
```

Best for: pipelines where each agent builds on the previous one (e.g., research → analysis → writing).

### Parallel Execution
Independent agents run simultaneously. Outputs are merged after all complete.

```text
         ┌→ Agent A → output ─┐
Input ───┤→ Agent B → output ─┼→ Merge → Evaluation
         └→ Agent C → output ─┘
```

Best for: independent perspectives on the same input (e.g., multiple evaluators, diverse research angles).

### Hybrid Execution
Some agents run in parallel, then results feed into sequential agents.

```text
         ┌→ Researcher A ─┐
Input ───┤                 ├→ Synthesizer → Evaluator
         └→ Researcher B ─┘
```

Best for: research that benefits from diverse exploration followed by unified synthesis.

## Feedback Flow Patterns

### Direct Feedback
Evaluation output goes directly to producer agents next round.

```text
Round N evaluation → Round N+1 agent prompts
```

Simple. Works when evaluation feedback is actionable without processing.

### Summarized Feedback
Orchestrator maintains a `feedback-summary.md` that accumulates insights across rounds.

```text
Round N evaluation → update feedback-summary.md → Round N+1 agent prompts
```

Better for sub-agents that start fresh each round and need cumulative context.

### Selective Feedback
Different agents receive different subsets of feedback.

```text
Round N evaluation
├── Technical feedback → Technical agent
├── Style feedback → Writing agent
└── Full feedback → Orchestrator only
```

Prevents information overload. Each agent sees only what's relevant to its role.

## Depth Progression

Some research loops change strategy at different quality levels:

```text
Score < 4.0 (Depth 1: Exploration)
    │ Broad strokes, low bar for acceptance
    │ Focus: coverage and completeness
    │
Score 4.0-7.0 (Depth 2: Refinement)
    │ Focused improvement, moderate standards
    │ Focus: accuracy and coherence
    │
Score > 7.0 (Depth 3: Polish)
    │ Fine-tuning, strict quality gates
    │ Focus: edge cases and presentation
```

Depth promotion criteria should be defined in program.md. The orchestrator checks after each evaluation whether to advance depth.
