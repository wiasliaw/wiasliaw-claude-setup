---
name: research-design
description: Designs autonomous research programs through interactive conversation. Use when initializing a new research session, re-designing an existing program.md, or when you need to define agents, evaluation criteria, and convergence strategies for a research loop.
---

# Research Design

## Overview

Collaboratively design a `program.md` that fully specifies an autonomous research loop — its agents, evaluation, iteration strategy, and stopping conditions. Everything emerges from the conversation with the user. No predefined methodology, no hardcoded agent names, no hardcoded scoring formulas.

## When to Use

- Starting a new research session
- Re-designing an existing `program.md` after unsatisfactory results
- Helping a user define what "good research output" looks like

## When NOT to Use

- Running an existing session — use `research-execution` skill instead
- Generating a report from a completed session — use `research-reporting` skill instead
- Quick status check — just read `results.tsv` directly

## The Design Process

### Phase 1: Understand the Research Topic

Start from the user's research goal, not the current codebase.

1. **Ask the user what they want to research.** If arguments were provided, use those as a starting point.
2. **Use WebSearch to explore the topic.** Look up prior art, existing approaches, relevant papers, benchmarks, and domain-specific best practices.
3. **Brainstorm with the user.** Surface interesting angles, open questions, or approaches worth exploring.

Present a brief summary of your understanding and confirm before proceeding.

```text
BEFORE MOVING TO PHASE 2, VERIFY:
→ Is the research objective clear and specific?
→ Has prior art been explored via WebSearch?
→ Does the user agree with the stated objective?
```

### Phase 2: Interactive Design Conversation

Have a free-form conversation. Ask **one question at a time**. Wait for the answer before asking the next.

Cover all of these topics through natural conversation. Adapt the order and depth based on user responses.

**Topics to Cover:**

- **Research Identity & Objective** — What is the research about? Assign a research ID (slug). Is this optimization, exploration, synthesis, or auditing?
- **Quality Definition** — How is "good" output defined? What does success/failure look like? What metrics apply?
- **Agent Design** — What agents are needed? For each: name, type, rationale. Read `agent-types.md` in this skill directory when discussing agent architecture and context-passing strategies.
- **Iteration Strategy** — How does each round work? Which agents run sequentially vs. in parallel? What state persists between rounds?
- **Cumulative Research Artifact (draft.md)** — What should the initial structure look like? How should each round update it?
- **Convergence & Stopping** — When is the research "done"? Read `convergence-patterns.md` in this skill directory when discussing stopping conditions.
- **Evaluation** — How are scores computed? Read `evaluation-patterns.md` in this skill directory when discussing evaluation approaches.
- **Editable & Frozen Scope** — Which files may agents modify? Which are off-limits?
- **Agent Prompts** — For each agent, draft a prompt file capturing role, input/output, behavioral rules.

```text
BEFORE MOVING TO PHASE 3, VERIFY:
→ All topics covered? No boilerplate — everything from conversation.
→ Agent types defined with rationale?
→ Convergence criteria are concrete and testable?
→ Evaluation formula is specified?
→ draft.md structure agreed upon?
```

### Phase 3: Generate program.md

Generate using ONLY this skeleton. Fill every section with content from the conversation.

```markdown
# Research Program: <title>

## Objective

## Agents

## Evaluation

## Loop

## Convergence

## Directory Layout

## Editable Scope

## Frozen Scope

## Setup

## Outputs

## Critical Rules
```

**Mandatory requirements:**
- **Directory Layout** MUST list `draft.md` as the cumulative research artifact
- **Loop** MUST include explicit steps for reading and updating `draft.md` each round
- **Setup** MUST include initializing `draft.md` with its agreed-upon structure

### Phase 4: Save and Confirm

Save all generated files:
1. `.autoresearch/<research-id>/program.md`
2. `.autoresearch/<research-id>/draft.md` (initialized with agreed structure)
3. `.autoresearch/<research-id>/topic.md` (research scope, if applicable)
4. One prompt file per agent
5. Any tracking files required by the evaluation design

Show `program.md` to the user and ask them to review. Address any changes.

Confirm:
> Research session **<research-id>** is ready. Run `/autoresearch-run` to start the autonomous research loop.

## Conversation Guidelines

- Ask one question at a time. Keep it focused.
- After each answer, briefly reflect back what you understood before moving on.
- Use WebSearch when the user mentions a domain, technique, or standard you can look up.
- If an answer implies changes to earlier decisions, surface that and adjust.
- Propose concrete suggestions — give the user something to react to.
- When proposing agent designs, explain the trade-offs of different configurations.

## Anti-Rationalization Table

| Rationalization | Reality |
|---|---|
| "The user seems to know what they want, I'll skip the questions" | Assumptions kill research quality. Ask anyway. |
| "I'll use a standard agent setup" | Every research problem is different. Derive from the conversation. |
| "Convergence criteria can be figured out later" | Without stopping conditions, the loop runs forever or stops randomly. |
| "I'll add some extra agents that might be useful" | YAGNI. Only agents discussed and agreed upon. |
| "This topic doesn't need WebSearch" | Always search. Prior art informs better design decisions. |
| "The program.md skeleton sections are optional" | Every section must be populated from the conversation. No blanks. |
