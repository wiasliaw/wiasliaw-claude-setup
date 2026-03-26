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

Read ALL available inputs. You must be thorough — the final report must be fully self-contained, so you need every piece of content now.

```bash
# 1. The research program (REQUIRED — this drives report structure)
cat $RESEARCH_DIR/program.md

# 2. The cumulative research artifact (REQUIRED — this is the primary content source)
cat $RESEARCH_DIR/draft.md

# 3. Results tracking
cat $RESEARCH_DIR/results.tsv

# 4. Git history for this session
git log --oneline autoresearch/<research-id> 2>/dev/null || git log --oneline --grep="autoresearch(<research-id>)" 2>/dev/null

# 5. Round directories — list all
ls -d $RESEARCH_DIR/rounds/round-* 2>/dev/null
```

For each round directory that exists, read **every file** inside it — evaluation feedback, agent outputs, intermediate artifacts, all of it. You need the complete picture to write a comprehensive report.

Also read `rounds/feedback-summary.md` if it exists, for the cumulative view.

**Do not skip any files.** The report must synthesize ALL research outputs into a single self-contained document.

## Step 3: Analyze program.md

Before writing the report, analyze `program.md` to understand what concepts this session used. Look for:

- **Evaluation metrics**: What scoring formula was defined? What dimensions were tracked?
- **Agent architecture**: What agents were defined? What types (team-agent, sub-agent, one-shot)?
- **Iteration strategy**: How did rounds work? What was the loop structure?
- **Convergence criteria**: What stopping conditions were defined?
- **Any session-specific concepts**: depth levels, optimization parameters, persistent learners, quality dimensions, progressive scope expansion, etc.

Take note of which concepts are present — these will determine which additional sections to include in the report.

## Step 4: Write the Report

Write the report to `$RESEARCH_DIR/report-final.md`.

**This report must be a single, self-contained document.** A reader with no access to the research session files must be able to understand the full research content, findings, and methodology from this report alone. No links to other `.md` files. No "see file X for details." Everything must be inlined.

### Report Structure

The report has two parts: **Research Content** (the substance) and **Research Process** (how it evolved). Research content comes first and takes up the majority of the report.

~~~markdown
# Research Report: <research-id>

**Generated**: <timestamp>
**Session**: <research-id>
**Total Rounds**: <N>
**Final Score**: <score> (metric: <metric name from program.md>)
**Baseline Score**: <score> → **Best Score**: <score> (<improvement summary>)

---

## Executive Summary

<2-3 paragraph summary: what was the research goal, what were the major discoveries, what is the overall outcome and conclusion.>

---

## Part I: Research Content

<This is the core of the report. Synthesize the final state of `draft.md` and all round outputs into polished, publishable research content. This is NOT a summary of draft.md — it IS the research, refined and structured for a reader.>

<Organize into logical sections derived from the research topic. Use whatever headings, subheadings, and structure best present the findings. Examples:>

<For a code audit: sections by audit category, each with detailed findings, severity, evidence, and recommendations.>
<For an optimization study: sections by approach tried, parameter analysis, performance results with data.>
<For a literature synthesis: sections by theme, with detailed analysis and cross-references.>

<Include all substantive content — code snippets, data tables, analysis, examples, evidence. Do not summarize what could be stated in full. If draft.md contains a detailed finding, the report contains that finding in full, polished form.>

---

## Part II: Research Process

### Progress Timeline

| Round | Score | Status | Key Changes |
|-------|-------|--------|-------------|
| 1 | <score> | baseline | <what happened> |
| 2 | <score> | improved/plateau | <what changed> |
| ... | | | |

<Analysis of the trajectory: where did the biggest improvements happen, were there regressions or plateaus, what caused them.>

### Methodology

<Describe the research methodology: what agents were used, how rounds worked, what evaluation criteria were applied. Inline this fully — do not reference program.md or any other file.>

### What Didn't Work

<Failed approaches across rounds. Each entry explains what was tried and why it didn't resolve.>

### Recommendations

<What should follow-up research focus on? What issues remain open? What showed promise but wasn't fully explored?>
~~~

### Additional Sections (derived from program.md)

After writing the above, review program.md and add extra sections ONLY for concepts the session actually used:

- **Depth levels / progressive scope** → section showing level progression, rounds per level, issues per level
- **Persistent learner agent** → section on knowledge accumulation across rounds
- **Optimization with parameters** → section on parameter exploration and best configurations
- **Multiple quality dimensions** → section breaking down scores by dimension over time
- **Multiple agent roles** → section analyzing each agent's contribution

Do not add sections for concepts that program.md didn't define. Derive structure from actual data.

### Critical Rules for Report Quality

- **No external file references.** Do not link to or reference other `.md` files, `.tsv` files, or directories. All content must be inlined in this document.
- **Research content first.** Part I (Research Content) is the primary value of this report. Part II (Research Process) is supplementary context.
- **Full detail, not summaries.** If the research produced detailed findings, include them in full. Do not condense 10 findings into 3 bullet points.
- **Publishable quality.** Write as if this document will be read by someone unfamiliar with the AutoResearch framework. No jargon about "rounds", "agents", or "draft.md" in Part I — use natural research language.

## Step 5: Save and Confirm

Save the report to `$RESEARCH_DIR/report-final.md`.

```bash
echo "Report saved to $RESEARCH_DIR/report-final.md"
```

Tell the user:
> Report generated at `$RESEARCH_DIR/report-final.md`. <1-2 sentence highlight of the session: overall trajectory, most notable finding, any open issues.>

---

**User's specification (if any):** $ARGUMENTS
