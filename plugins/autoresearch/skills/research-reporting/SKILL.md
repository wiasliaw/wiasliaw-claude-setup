---
name: research-reporting
description: Generates comprehensive research reports from completed or in-progress sessions. Use when a research session has finished (or partially completed) and you need to produce a self-contained, publishable report synthesizing all findings.
---

# Research Reporting

## Overview

Generate a comprehensive, self-contained research report from an AutoResearch session. The report must be readable by someone with no access to session files and no knowledge of the AutoResearch framework. Research content comes first; process documentation is supplementary.

## When to Use

- A research session has completed (converged or budget exhausted)
- A session is in-progress but the user wants an interim report
- The user wants to understand what a research session produced

## When NOT to Use

- No session exists — use `research-design` skill to create one
- Session is still running — let it finish first, or pause and then report
- Quick status check — just read `results.tsv` directly

## The Report Process

### Step 1: Locate the Session

Find the research session under `.autoresearch/`. If multiple exist and the user didn't specify, ask.

```bash
RESEARCH_DIR=.autoresearch/<research-id>
```

### Step 2: Gather Data

Read ALL available inputs. The report must be fully self-contained.

- `$RESEARCH_DIR/program.md` (REQUIRED — drives report structure)
- `$RESEARCH_DIR/draft.md` (REQUIRED — primary content source)
- `$RESEARCH_DIR/results.tsv` (score tracking)
- Git history for the session
- Every file in `$RESEARCH_DIR/rounds/` directories
- `feedback-summary.md` if it exists

```text
BEFORE PROCEEDING TO STEP 3, VERIFY:
→ Have you read program.md?
→ Have you read draft.md in full?
→ Have you read every round directory's contents?
→ Did you skip any files? If so, go back and read them.
```

### Step 3: Analyze program.md

Before writing, understand what this session used:

- What evaluation metrics and scoring formula were defined?
- What agents were used and what types?
- How did rounds work (iteration strategy)?
- What convergence criteria were set?
- Any session-specific concepts (depth levels, progressive scope, etc.)?

### Step 4: Write the Report

Write to `$RESEARCH_DIR/report-final.md`.

**Report structure:**

```markdown
# Research Report: <research-id>

**Generated**: <timestamp>
**Session**: <research-id>
**Total Rounds**: <N>
**Final Score**: <score> (metric: <metric name>)
**Baseline Score**: <score> → **Best Score**: <score> (<improvement summary>)

---

## Executive Summary

<2-3 paragraphs: research goal, major discoveries, overall outcome>

---

## Part I: Research Content

<Core of the report. Synthesize draft.md and round outputs into polished,
publishable content. This is NOT a summary — it IS the research.
Organize into logical sections derived from the research topic.
Include all substantive content: code, data, analysis, evidence.>

---

## Part II: Research Process

### Progress Timeline

| Round | Score | Status | Key Changes |
|-------|-------|--------|-------------|
| 1 | <score> | baseline | <what happened> |
| ... | | | |

<Trajectory analysis>

### Methodology

<Agents used, round structure, evaluation criteria — fully inlined>

### What Didn't Work

<Failed approaches, each with explanation>

### Recommendations

<Follow-up research, open issues, unexplored directions>
```

**Additional sections** (only if program.md defined these concepts):
- Depth levels → depth progression section
- Multiple evaluators → per-evaluator contribution analysis
- Optimization parameters → parameter exploration results

### Step 5: Save and Confirm

Save to `$RESEARCH_DIR/report-final.md`. Tell the user with a 1-2 sentence highlight.

## Quality Gates

```text
BEFORE SAVING THE REPORT, VERIFY:
→ Is the report fully self-contained? No references to external files.
→ Does Part I contain full research content, not summaries?
→ Are all round findings synthesized, not just the last round?
→ Would a reader unfamiliar with AutoResearch understand Part I?
→ Does the Progress Timeline cover every round?
→ Is the methodology section complete (no "see program.md")?
```

## Anti-Rationalization Table

| Rationalization | Reality |
|---|---|
| "The draft.md is good enough as the report" | draft.md is a working document. The report must be polished and structured for a reader. |
| "I'll summarize the detailed findings to keep it short" | Full detail, not summaries. Include everything substantive. |
| "I'll link to the round files for details" | No external file references. All content must be inlined in this document. |
| "Part II (process) is the interesting part" | Part I (content) is the primary value. Research content comes first and takes the majority. |
| "I didn't read all the round files, but I have enough" | Read every file. Missing data means missing findings in the report. |
| "This section from program.md doesn't apply to the report" | If program.md defined it and the session used it, it gets a section. Derive structure from data. |
