---
allowed-tools: Bash, Read, Write, Glob, Grep, WebFetch, WebSearch, Agent
description: Produce a bite-sized implementation plan from OpenSpec artifacts — with TDD steps, exact file paths, and commit points
---

# Implementation Plan from OpenSpec Artifacts

Announce: "Using engineer:plan to create an implementation plan."

## 1. Load Reference Knowledge

Read `skills/planning-and-task-breakdown/SKILL.md` in full. Internalize its principles — they govern every decision below.

## 2. Find OpenSpec Artifacts

Locate the target change under `openspec/changes/`.

- If `$ARGUMENTS` names a specific change, use it directly.
- If multiple changes exist and none specified, list them and ask the user which one to plan for.
- If only one change exists, use it.

Read these artifacts in order:

1. `openspec/changes/<change>/proposal.md`
2. All files under `openspec/changes/<change>/specs/`
3. `openspec/changes/<change>/design.md`
4. `openspec/changes/<change>/tasks.md`

If any artifact is missing, note it and proceed with what exists.

## 3. Analyze Codebase (Read-Only)

**Do NOT write any code during planning.** This phase is strictly read-only.

- Read relevant source files identified from the specs and design.
- Identify patterns: naming conventions, module structure, test framework, import style.
- Map the dependency graph — what depends on what.
- Identify what must be built first (bottom-up from leaf dependencies).
- Note existing tests, fixtures, and helpers that can be reused.

## 4. Create the Plan

Apply these principles throughout:

- **Vertical slicing** — each task cuts one complete path through the stack (model -> service -> handler -> test), not horizontal layers.
- **TDD** — every task starts with a failing test, then minimal implementation to pass.
- **DRY / YAGNI** — no speculative abstractions, no duplicate logic.
- **Frequent commits** — each task ends with a commit.

### Plan structure

Start with this header:

```markdown
# [Feature Name] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans

**Goal:** [one sentence]
**Architecture:** [2-3 sentences]
**Tech Stack:** [key technologies]
```

Then break the work into numbered task steps. Each step must be **2-5 minutes of work** and include:

1. **Exact file paths** to create or modify
2. **Failing test code** — the test to write first
3. **Minimal implementation code** — just enough to pass the test
4. **Test command** with expected output (e.g., `pnpm test -- --grep "feature"`)
5. **Commit message** in Conventional Commits format

Add a **checkpoint** every 2-3 tasks:

```markdown
### Checkpoint: [description]
- [ ] All tests pass
- [ ] No lint errors
- [ ] Feature X works end-to-end
```

### Ordering rules

1. Build leaf dependencies first (utilities, types, constants).
2. Then core logic (services, business rules).
3. Then integration points (handlers, routes, UI).
4. Each task must be independently testable after completion.

## 5. Save the Plan

Write the completed plan to:

```text
docs/plans/YYYY-MM-DD-<feature-name>.md
```

Use today's date. Derive `<feature-name>` from the change name (lowercase, hyphenated).

Create the `docs/plans/` directory if it does not exist.

## 6. Execution Handoff

After saving, present this to the user:

> Plan complete. Two execution options:
>
> 1. **Subagent-Driven** (this session) — uses `superpowers:subagent-driven-development`
> 2. **Parallel Session** — open a new session with `superpowers:executing-plans`
>
> Which approach?

---

**User's specification (if any):** $ARGUMENTS
