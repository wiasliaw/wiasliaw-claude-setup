# Evaluation Patterns Reference

Use this reference when discussing quality definition and evaluation during the research design conversation.

## Evaluation Approaches

| Approach | Description | Best For |
|---|---|---|
| **Quantitative** | Numeric scores on defined dimensions | Research with measurable outcomes (code quality, coverage, accuracy) |
| **Qualitative** | Structured rubric with levels (poor/fair/good/excellent) | Research where quality is subjective (writing, design, analysis) |
| **Hybrid** | Numeric scores + qualitative commentary | Most research — numbers for convergence detection, commentary for feedback |

## Scoring Formula Patterns

### Single Metric
One number captures overall quality:
```text
score = evaluator_rating (0-10)
```
Simple. Works when quality has one dominant dimension.

### Weighted Composite
Multiple dimensions combined with weights:
```text
score = 0.4 * accuracy + 0.3 * completeness + 0.2 * clarity + 0.1 * novelty
```
Works when quality has multiple independent dimensions. Weights reflect priorities.

### Multi-Dimensional (No Collapse)
Track each dimension separately, don't reduce to a single number:
```yaml
scores:
  accuracy: 7
  completeness: 5
  clarity: 8
```
Works when dimensions have different convergence rates. Convergence checks each dimension independently.

## Evaluator Design

### Isolated Evaluator (Recommended Default)
- Type: one-shot (`claude -p`) or fresh sub-agent
- Receives: only the current artifact (`draft.md`) and evaluation criteria
- Does NOT receive: round history, previous scores, agent prompts
- Benefit: unbiased, fresh judgment each round

### Contextual Evaluator
- Type: sub-agent with history
- Receives: current artifact + previous evaluation + round history
- Benefit: can assess improvement over time, detect recurring issues
- Risk: anchoring on previous scores, grade inflation

### Multi-Evaluator
- Multiple evaluators with different perspectives
- Example: one for technical accuracy, one for readability, one for completeness
- Scores combined per the scoring formula
- Benefit: reduces single-evaluator bias

## Evaluation Output Format

Every evaluation should produce:
1. **Scores** — numeric values per the scoring formula
2. **Strengths** — what is working well (preserve these)
3. **Weaknesses** — what needs improvement (actionable feedback)
4. **Suggestions** — specific changes for the next round

This output feeds back into the next round's agent prompts (for producer agents) or into `feedback-summary.md`.
