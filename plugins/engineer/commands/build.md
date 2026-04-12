---
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, WebFetch, WebSearch, Agent
description: Execute an implementation plan step by step — following the increment cycle (implement, test, verify, commit)
---

# Build — Execute Implementation Plan

Announce: "Using engineer:build to execute the implementation plan."

## 1. Load Engineering Discipline

Read `skills/incremental-implementation/SKILL.md` and internalize the increment cycle and all rules before proceeding.

## 2. Find the Plan

- If `$ARGUMENTS` specifies a plan file, read that file directly.
- Otherwise, search `docs/plans/` for plan files.
- If multiple plans exist, list them and ask the user which one to execute.
- Read the full plan before starting.

## 3. Execute Tasks — One at a Time

For each task step in the plan, follow the increment cycle:

| Step      | Action                                                                |
|-----------|-----------------------------------------------------------------------|
| Implement | Write the code specified in the task step                             |
| Test      | Run the test command specified. If no test exists, write one first.   |
| Verify    | Confirm tests pass, build succeeds, lint passes                       |
| Commit    | Commit with the message specified in the plan                         |
| Next      | Move to the next task step                                            |

## 4. Discipline Rules

- **Simplicity first** — simplest thing that works.
- **Scope discipline** — only touch what the task requires. If you notice something outside scope, note it: `NOTICED BUT NOT TOUCHING: [list]`
- **One thing at a time** — each increment changes one logical thing.
- **Keep it compilable** — project must build after each increment.
- **Source-driven** — for framework-specific code, verify against official docs before implementing.

## 5. Checkpoints

At each checkpoint defined in the plan:

- Pause and report current status to the user.
- Run the full test suite.
- Wait for user confirmation before proceeding to the next section.

## 6. On Failure

- **Test fails**: Diagnose the root cause before retrying. Do not loop blindly.
- **Plan step seems wrong**: Flag it to the user — do not blindly execute.
- **Blocked**: Report to user with full context (what was attempted, what failed, what is needed).
