# Convergence Patterns Reference

Use this reference when discussing convergence and stopping conditions during the research design conversation.

## Common Stopping Conditions

| Condition | How It Works | Best For |
|---|---|---|
| **Score threshold** | Stop when score >= target | Optimization problems with a clear quality bar |
| **Round budget** | Stop after N rounds | Exploration or time-boxed research |
| **Consecutive plateau** | Stop after K rounds with no improvement | Research where diminishing returns are expected |
| **Composite** | Combine multiple conditions with AND/OR | Complex research with multiple quality dimensions |

## Choosing the Right Strategy

```text
What kind of research is this?
├── Optimization (improve a metric)
│   └── Score threshold + round budget as safety cap
├── Exploration (discover what's out there)
│   └── Round budget (fixed scope)
├── Synthesis (combine information into a coherent whole)
│   └── Consecutive plateau (stop when nothing new emerges)
├── Auditing (systematic review for issues)
│   └── Coverage-based (stop when all areas reviewed)
└── Mixed / Unclear
    └── Composite: plateau detection + round budget
```

## Example Configurations

### Optimization
```yaml
convergence:
  type: composite
  conditions:
    - score >= 8.5 out of 10
    - OR round_count >= 15
  plateau_detection: false
```

### Exploration
```yaml
convergence:
  type: budget
  max_rounds: 10
  early_stop: false
```

### Synthesis
```yaml
convergence:
  type: plateau
  window: 3  # consecutive rounds
  threshold: 0.2  # minimum score improvement to count as progress
  max_rounds: 20  # safety cap
```

## Depth Levels (Advanced)

Some research benefits from changing strategy at different quality thresholds:

- **Depth 1** (rounds 1-3): Broad exploration, low bar for acceptance
- **Depth 2** (rounds 4-7): Focused refinement, higher evaluation standards
- **Depth 3** (rounds 8+): Polish and edge cases, strict quality gates

Depth promotion criteria should be defined in `program.md` if used.
