---
allowed-tools: Read, Write, Bash
description: Generate a research report from a completed (or in-progress) autoresearch session — report structure is derived from program.md
---

# AutoResearch: Generate Research Report

You are generating a comprehensive research report for an autoresearch session. The report structure is NOT fixed — it is derived from the session's `program.md`. You will build a minimal skeleton of universal sections, then add extra sections ONLY for concepts that program.md actually defined.

## Step 1: Locate the Session

Find the research session. The user may specify which one via arguments.

```bash
ls -d .autoresearch/*/program.md 2>/dev/null
```

If multiple sessions exist and the user didn't specify, ask which one to report on.

Set:
```bash
RESEARCH_DIR=.autoresearch/<research-id>
```

## Step 2: Gather Data

Read all available inputs. Not every file will exist — that's fine, work with what's there.

```bash
# 1. The research program (REQUIRED — this drives report structure)
cat $RESEARCH_DIR/program.md

# 2. Results tracking
cat $RESEARCH_DIR/results.tsv

# 3. Git history for this session
git log --oneline autoresearch/<research-id> 2>/dev/null || git log --oneline --grep="autoresearch(<research-id>)" 2>/dev/null

# 4. Round directories
ls -d $RESEARCH_DIR/rounds/round-* 2>/dev/null
```

For each round directory that exists, read the evaluation feedback files to understand progression — which issues were raised, resolved, or persisted across rounds.

Also read `rounds/feedback-summary.md` if it exists, for the cumulative view.

## Step 3: Analyze program.md

Before writing the report, analyze `program.md` to understand what concepts this session used. Look for:

- **Evaluation metrics**: What scoring formula was defined? What dimensions were tracked?
- **Agent architecture**: What agents were defined? What types (team-agent, sub-agent, one-shot)?
- **Iteration strategy**: How did rounds work? What was the loop structure?
- **Convergence criteria**: What stopping conditions were defined?
- **Any session-specific concepts**: depth levels, optimization parameters, persistent learners, quality dimensions, progressive scope expansion, etc.

Take note of which concepts are present — these will determine which additional sections to include in the report.

## Step 4: Write the Report

Write the report to `$RESEARCH_DIR/report-final.md`. Adapt depth and emphasis based on actual data — a session with 3 rounds gets a concise report; a session with 12 rounds gets a detailed one.

### Minimal Skeleton (ALWAYS include these sections)

Every report MUST have these six sections, regardless of what program.md defines:

~~~markdown
# Research Report: <research-id>

**Generated**: <timestamp>
**Session**: <branch name or research-id>
**Total Rounds**: <N>
**Final Score**: <score> (metric: <metric name from program.md>)
**Baseline Score**: <score> -> **Best Score**: <score> (<improvement summary>)

---

## Executive Summary

<2-3 paragraph summary: what was the research goal (from program.md Objective), what were the major discoveries, how did quality evolve across rounds, what is the overall outcome.>

## Progress Timeline

| Round | Score | Status | Notes |
|-------|-------|--------|-------|
| 1 | <score> | baseline | |
| 2 | <score> | improved/plateau | |
| ... | | | |

<Brief analysis of the trajectory: where did the biggest improvements happen, were there any regressions or plateaus, what caused them.>

## Key Findings

<Organize findings by whatever grouping makes sense for this session — pull from evaluation feedback and the final report. Each finding should note which round(s) it emerged in and why it matters.>

## What Didn't Work

<Summarize failed approaches — issues that persisted across multiple rounds despite revision attempts.>

- **<issue>** [rounds <list>]: <what was tried and why it didn't resolve>
- ...

## Recommendations

<Based on the session's trajectory, what should a follow-up session focus on? What issues remain open? What approaches showed promise but weren't fully explored?>

## Raw Data

- Full results: `<RESEARCH_DIR>/results.tsv`
- Round feedback: `<RESEARCH_DIR>/rounds/round-{N}/`
- Feedback summary: `<RESEARCH_DIR>/rounds/feedback-summary.md`
- Git history: `git log autoresearch/<research-id>`
~~~

### Additional Sections (derived from program.md)

After writing the minimal skeleton, review program.md and add extra sections ONLY for concepts the session actually defined and used. Examples of what to look for and the corresponding section to add:

- **If program.md defines depth levels / progressive scope** -> Add a section showing when each level was unlocked/converged, rounds spent per level, and issues per level.
- **If program.md defines a persistent learner agent** -> Add a section tracking knowledge accumulation across rounds — what was learned early, what took longer, any regressions.
- **If program.md defines optimization with parameters** -> Add a section showing parameter exploration history, which configurations were tried, and which performed best.
- **If program.md defines multiple quality dimensions with weights** -> Add a section breaking down scores by dimension over time.
- **If program.md defines specific agent roles beyond a simple loop** -> Add a section analyzing each agent's contribution and effectiveness.

**Do not add sections for concepts that program.md didn't define.** The report should reflect the actual session, not a generic template. If program.md uses a simple score with no depth levels, there is no depth section. If there is no persistent learner, there is no learner growth section.

For each additional section you add, derive its structure from the data that actually exists — don't invent column headers for data that wasn't tracked.

## Step 5: Save and Confirm

Save the report to `$RESEARCH_DIR/report-final.md`.

```bash
echo "Report saved to $RESEARCH_DIR/report-final.md"
```

Tell the user:
> Report generated at `$RESEARCH_DIR/report-final.md`. <1-2 sentence highlight of the session: overall trajectory, most notable finding, any open issues.>

---

**User's specification (if any):** $ARGUMENTS
