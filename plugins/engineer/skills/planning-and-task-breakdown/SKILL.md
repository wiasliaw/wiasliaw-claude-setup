---
name: planning-and-task-breakdown
description: Knowledge for producing bite-sized implementation plans from spec artifacts. Covers dependency analysis, vertical slicing, TDD task structure, and execution handoff.
---

# Planning and Task Breakdown

## Overview

Decompose spec artifacts into small, verifiable implementation tasks. Each task step represents 2-5 minutes of work. The resulting plan must be detailed enough that an engineer with **zero codebase context** can execute it — exact file paths, complete code, exact commands with expected output.

Core principles:

- **DRY** — Don't Repeat Yourself
- **YAGNI** — You Aren't Gonna Need It
- **TDD** — Red-green-refactor for every task
- **Frequent commits** — one commit per task

---

## When to Use

| Scenario | Use? |
|---|---|
| You have spec artifacts (proposal, spec, design, tasks) and need an implementation plan | Yes |
| Feature spans multiple files or components | Yes |
| Work will be handed off to another session or agent | Yes |
| Exploratory prototyping with no clear spec | No |
| Single-file bug fix with obvious cause | No |
| Refactoring with no behavioral change | No — use a refactoring checklist instead |

---

## Input: Reading OpenSpec Artifacts

Before planning, extract key information from each available artifact.

### From Proposal

- **Objective** — the single sentence describing what and why
- **Boundaries** — what is explicitly out of scope
- **Success criteria** — how we know it's done

### From Spec

- **Functional requirements** — numbered list of behaviors
- **Non-functional requirements** — performance, security, constraints
- **Scenarios** — concrete usage flows (happy path + edge cases)
- **Acceptance criteria** — testable conditions per requirement

### From Design

- **Architecture decisions** — chosen patterns, rationale
- **Component structure** — modules, interfaces, data flow
- **Dependencies** — external libraries, services, APIs
- **Data models** — schemas, types, state shape

### From Tasks

- **High-level task list** — starting point to refine into bite-sized tasks
- **Priority order** — which tasks are critical path
- **Known risks** — areas flagged as complex or uncertain

---

## The Planning Process

### Step 1: Enter Read-Only Mode

Do not write any code yet. Read all available inputs:

1. Read every spec artifact cover to cover
2. Read the relevant parts of the codebase — entry points, existing patterns, test setup
3. Identify conventions: naming, directory structure, import style, test framework
4. Map existing abstractions that the new feature must integrate with

Output: mental model of the problem space and the codebase surface area.

### Step 2: Dependency Graph

Map what depends on what:

1. List every new component, function, type, and config change
2. Draw edges: "A requires B to exist first"
3. Identify leaf nodes (no dependencies) — these are your starting tasks
4. Implementation order follows **bottom-up**: leaves first, dependents after

```text
Example:
  types.ts          (leaf — no deps)
  repository.ts     (depends on types)
  service.ts        (depends on repository + types)
  handler.ts        (depends on service)
  route.ts          (depends on handler)
```

### Step 3: Vertical Slicing (Preferred)

Build one complete path through the stack at a time, not horizontal layers.

**Bad (horizontal):**
1. Create all types
2. Create all repositories
3. Create all services
4. Create all handlers

**Good (vertical):**
1. Types → Repository → Service → Handler for Feature A
2. Types → Repository → Service → Handler for Feature B

Each vertical slice produces a working, testable increment. The first slice is always the **thinnest possible** path that proves the architecture works end to end.

### Step 4: Write Tasks

Convert each node in the dependency graph into a task using the bite-sized format (see Task Structure below). Every task must include:

- Exact file paths (create or modify)
- Complete code (not pseudocode)
- Test code with exact assertions
- Run commands with expected output

### Step 5: Order and Checkpoint

1. Number tasks sequentially
2. Insert a **verification checkpoint** every 2-3 tasks:
   ```text
   #### Checkpoint: [description]
   Run: `exact test command`
   Expected: all N tests pass
   At this point: [what should be working]
   ```
3. The final checkpoint runs the full test suite

---

## Task Structure (Bite-Sized Format)

Each task step is one discrete action taking 2-5 minutes.

```markdown
### Task N: [Component Name]

**Size:** S (1-2 files)

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Step 1: Write the failing test**
    # tests/exact/path/to/test.py
    def test_component_does_expected_thing():
        result = component.do_thing(input)
        assert result == expected

**Step 2: Run test to verify it fails**
Run: `pytest tests/exact/path/to/test.py::test_component_does_expected_thing -v`
Expected: FAIL with "AttributeError: module has no attribute 'do_thing'"

**Step 3: Write minimal implementation**

    # exact/path/to/file.py
    def do_thing(input):
        return expected

**Step 4: Run test to verify it passes**
Run: `pytest tests/exact/path/to/test.py::test_component_does_expected_thing -v`
Expected: PASS

**Step 5: Commit**
Run: `git add -A && git commit -m "feat(component): add do_thing"`

---

## Task Sizing Guidelines

| Size | Files Changed | Guideline |
|---|---|---|
| **XS** | 1 file | Single function, type, or config entry |
| **S** | 1-2 files | One implementation file + its test |
| **M** | 3-5 files | One vertical slice through 2-3 layers |
| **L** | 5-8 files | Multiple related components — consider splitting |
| **XL** | 8+ files | **Must break down further** — too large to review or verify in one step |

If a task exceeds size M, split it. Prefer more smaller tasks over fewer large ones.

---

## Plan Document Template

```markdown
# [Feature Name] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans

**Goal:** [one sentence — what this plan delivers]
**Architecture:** [2-3 sentences — key design decisions, patterns used, integration points]
**Tech Stack:** [key technologies, frameworks, libraries]

## Prerequisites

- [ ] Spec artifacts reviewed: [list which ones]
- [ ] Codebase patterns identified: [list conventions]
- [ ] Dependencies available: [list external deps]

## Tasks

### Task 1: [Component Name]
...

#### Checkpoint: [description]
...

### Task 2: [Component Name]
...

### Task 3: [Component Name]
...

#### Checkpoint: [description]
...

## Summary

| Metric | Value |
|---|---|
| Total tasks | N |
| Estimated time | N minutes |
| Files created | N |
| Files modified | N |
| Test files | N |
```

---

## Execution Handoff

After saving the plan document, present these options to the user:

1. **Subagent-driven (this session)** — Hand off to `superpowers:subagent-driven-development`. Best when tasks have shared state or you want oversight within the current session.

2. **Parallel session** — Hand off to `superpowers:executing-plans`. Best when the plan is self-contained and can run independently with review checkpoints.

3. **Manual execution** — If the Superpowers plugin is not installed, execute the plan manually step by step, following the increment cycle from the `incremental-implementation` skill.

> **Note:** Options 1 and 2 require the [Superpowers plugin](https://github.com/nichochar/claude-superpowers). If unavailable, use option 3.

State clearly which option you recommend and why, based on:
- Number of tasks (>10 favors parallel)
- Task independence (high independence favors subagent-driven)
- Need for human review checkpoints (favors executing-plans)

---

## Slicing Strategies

### Vertical Slice (Preferred)

Build one complete path through all layers for a single feature. Each slice is independently deployable and testable.

**When:** Most features. Default choice.

### Contract-First

Define interfaces and types first, then implement both sides independently.

**When:** Multiple consumers of the same API, or teams working in parallel.

```text
1. Define interface / API contract
2. Write consumer tests against the contract (mock implementation)
3. Write implementation tests
4. Implement the provider
5. Integration test
```

### Risk-First

Tackle the highest-risk or most uncertain component first to fail fast.

**When:** New technology, unclear requirements, performance-critical paths.

```text
1. Spike the risky component with a minimal test
2. If spike succeeds, plan remaining tasks normally
3. If spike fails, re-evaluate architecture before proceeding
```

---

## Anti-Rationalization Table

| Temptation | Why It's Wrong | Do This Instead |
|---|---|---|
| "I'll add the abstraction now since we'll need it later" | YAGNI — you don't know the future shape | Implement the concrete case; extract later |
| "Let me refactor this existing code first" | Scope creep — refactoring is a separate task | Note it as a follow-up; implement against current code |
| "This task is too small to need a test" | Every task gets a test — no exceptions | Write the test; it takes 2 minutes |
| "I'll batch these three small changes into one task" | Larger tasks are harder to verify and review | Keep them separate; commit after each |
| "The test is obvious so I'll skip the failing step" | Red-green-refactor requires the red step | Run the test, see it fail, then implement |
| "I'll figure out the file path later" | Plans with vague paths are unexecutable | Determine the exact path now |
| "This pseudocode is clear enough" | Pseudocode introduces ambiguity | Write the real code |

---

## Red Flags

Stop and re-evaluate the plan if you see any of these:

- **A task has more than 5 steps** — it's doing too much; split it
- **A task modifies more than 8 files** — it's XL; break it down
- **Two tasks modify the same lines** — merge conflict risk; reorder or combine
- **No test in a task** — every task must have a test step
- **Circular dependency in the task graph** — rethink the decomposition
- **A checkpoint spans more than 3 tasks** — add an intermediate checkpoint
- **Vague file paths** ("somewhere in utils") — resolve to exact paths before proceeding
- **"TODO" or "TBD" in task steps** — the plan is incomplete; fill in the blanks
- **A task depends on something outside the plan** — add it as a prerequisite or a new task

---

## Verification Checklist

Before finalizing the plan, confirm:

- Every task has exact file paths (no placeholders)
- Every task has complete, real code (no pseudocode)
- Every task has a test with specific assertions
- Every task has run commands with expected output
- Every task has a commit step
- Every task is size M or smaller
- Checkpoints appear every 2-3 tasks
- The final checkpoint runs the full test suite
- Dependency order is correct (no forward references)
- No task depends on unplanned work
- The plan header includes Goal, Architecture, and Tech Stack
- Execution handoff options are stated
