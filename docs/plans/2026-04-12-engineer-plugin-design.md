# Engineer Plugin Design

## Overview

Claude Code plugin providing general-purpose software engineering best practices as skills and commands. Covers the development lifecycle from spec to ship, integrating OpenSpec CLI and superpowers ecosystem.

## Architecture

Core design principle: skill and command separation.

- **Skills** = Pure knowledge carriers. Describe best practices and methodologies, no action logic.
- **Commands** = Action entry points. Spawn an agent, load relevant skill(s), execute concrete tasks.

A command can compose multiple skills; a skill can be reused across different commands.

## External Dependencies

- **OpenSpec CLI** (`@fission-ai/openspec`) — `/spec:init` and `/spec:propose` use the CLI to manage spec artifacts
- **Superpowers plugin** — `/plan` output feeds into `executing-plans` or `subagent-driven-development`; `/build` follows the executing-plans workflow

## Directory Structure

```
plugins/engineer/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── spec-init.md
│   ├── spec-propose.md
│   ├── plan.md
│   ├── build.md
│   ├── test-plan.md
│   ├── test-run.md
│   ├── review-self.md
│   ├── review-pr.md
│   └── code-simplify.md
├── skills/
│   ├── openspec-workflow/
│   │   └── SKILL.md
│   ├── planning-and-task-breakdown/
│   │   └── SKILL.md
│   ├── incremental-implementation/
│   │   └── SKILL.md
│   ├── test-engineering/
│   │   └── SKILL.md
│   ├── code-review-and-quality/
│   │   └── SKILL.md
│   └── code-simplification/
│       └── SKILL.md
└── README.md
```

## Commands

### /spec:init

Initialize OpenSpec environment.

- **Loads skill**: openspec-workflow
- **Behavior**:
  1. Check Node.js version >= 20.19.0
  2. Check if openspec is installed; guide installation if not
  3. Run `openspec init`
  4. Guide user through `openspec/config.yaml` setup (tech stack, conventions, rules)
- **Output**: `openspec/` directory + config.yaml

### /spec:propose

Produce spec artifacts.

- **Loads skill**: openspec-workflow
- **Behavior**:
  1. Confirm OpenSpec is initialized
  2. Execute `/opsx:propose` to produce proposal, specs, design, tasks
  3. Guide user to review each artifact
- **Output**: Artifacts under `openspec/changes/<change-name>/`
- **Prerequisite**: `/spec:init` completed
- **Recommended prior step**: Use superpowers brainstorming to clarify ideas

### /plan

Produce bite-sized implementation plan from OpenSpec artifacts.

- **Loads skill**: planning-and-task-breakdown
- **Behavior**:
  1. Read OpenSpec artifacts (proposal, specs, design, tasks)
  2. Analyze codebase (dependency graph, existing patterns)
  3. Vertical slicing into thin slices
  4. Produce bite-sized plan (2-5 min per step, with TDD steps, exact file paths, commit points)
- **Output**: `docs/plans/YYYY-MM-DD-<feature-name>.md`
- **Prerequisite**: OpenSpec artifacts exist
- **Execution handoff**: Choose subagent-driven (this session) or parallel session (executing-plans)

### /build

Execute implementation plan.

- **Loads skill**: incremental-implementation
- **Behavior**:
  1. Read plan file produced by `/plan`
  2. Execute increment cycle step by step (implement -> test -> verify -> commit)
  3. Follow scope discipline — only do what the task requires
  4. Source-driven — verify framework usage against official docs
- **Prerequisite**: Plan file exists

### /test:plan

Analyze codebase and design test strategy.

- **Loads skill**: test-engineering
- **Behavior**:
  1. Scan codebase — identify existing test framework, test directory structure, coverage status
  2. Analyze behaviors to test (from spec artifacts or code changes)
  3. Decide test type combinations (unit, integration, e2e, fuzz, invariant, property-based, etc.)
  4. Produce test strategy document (what behaviors, which frameworks, which edge cases)
- **Output**: Test strategy document
- **Prerequisite**: None (usable standalone or after /build)

### /test:run

Write and execute tests per test strategy.

- **Loads skill**: test-engineering
- **Behavior**:
  1. Read test strategy document
  2. Write tests following Prove-It Pattern (failing test first -> confirm fail -> write/verify code)
  3. Run full test suite
  4. Analyze coverage, write missing edge case tests
- **Prerequisite**: Test strategy exists (/test:plan output)

### /review:self

Self-review after build completion.

- **Loads skill**: code-review-and-quality
- **Behavior**:
  1. Collect current changes (git diff)
  2. Five-axis review (correctness, readability, architecture, security, performance)
  3. Produce severity-labeled findings
  4. Auto-fix fixable issues (Nit, obvious bugs)
  5. List findings requiring human judgment
- **Output**: Review report + auto-fix commits

### /review:pr

Review existing PR or diff.

- **Loads skill**: code-review-and-quality
- **Behavior**:
  1. Read diff of specified PR / branch
  2. Five-axis review
  3. Produce severity-labeled findings (Critical / Required / Nit / Optional / FYI)
  4. Check change sizing, test coverage, verification story
- **Output**: Review report (usable as PR comment)

### /code-simplify

Simplification pass on specified code.

- **Loads skill**: code-simplification
- **Behavior**:
  1. Chesterton's Fence — understand target code context and history (git blame)
  2. Scan simplification opportunities (structural complexity, naming, redundancy)
  3. Incremental apply — one change at a time, run tests after each
  4. Confirm simplification is genuinely more readable; revert otherwise
- **Prerequisite**: Target code has test coverage (suggest /test:plan first if not)

## Skills

### openspec-workflow

How to use OpenSpec CLI to produce spec artifacts.

- **Source**: Newly written, based on OpenSpec official docs
- **Covers**:
  - OpenSpec core concepts (artifact-guided workflow, fluid not rigid)
  - CLI operations (`openspec init`, `openspec update`, `openspec config profile`)
  - Artifact structure (proposal, specs, design, tasks — purpose and content of each)
  - `openspec/config.yaml` configuration (schema, context, rules)
  - Writing good proposals (clear objectives, boundaries, success criteria, Not Doing list)
  - Common pitfalls (vague specs, missing constraints, no success criteria)

### planning-and-task-breakdown

Produce executable implementation plans from spec artifacts.

- **Source**: Adapted from agent-skills + superpowers writing-plans format
- **Covers**:
  - Dependency graph analysis
  - Vertical slicing (vs horizontal slicing)
  - Task granularity standard (2-5 min per step, with TDD steps)
  - Plan file format (exact file paths, code snippets, test commands, commit points)
  - Checkpoint design (verification point every 2-3 tasks)
  - Task sizing (XS/S/M/L/XL)
  - Execution handoff (subagent-driven vs parallel session)

### incremental-implementation

Engineering discipline for executing plans step by step.

- **Source**: Adapted from agent-skills incremental-implementation + source-driven-development (merged)
- **Covers**:
  - Increment cycle (implement -> test -> verify -> commit -> next)
  - Simplicity first (simplest working solution)
  - Scope discipline (only do what the task requires)
  - Feature flags for incomplete features
  - Safe defaults / rollback-friendly changes
  - Source-driven development (verify against official docs, cite sources, flag unverified)

### test-engineering

Test design and execution knowledge.

- **Source**: Adapted from agent-skills, extended with fuzz/invariant/property-based/event trigger types
- **Covers**:
  - Test pyramid (unit 80% / integration 15% / e2e 5%)
  - Test types: unit, integration, e2e, fuzz, invariant, property-based, event trigger
  - Test sizing (small / medium / large resource model)
  - Prove-It Pattern (bug fix: reproduce -> test -> fix -> verify)
  - Good test practices (DAMP over DRY, state over interaction, Arrange-Act-Assert)
  - Real implementations over mocks (preference: real > fake > stub > mock)
  - Beyonce Rule
  - Anti-patterns (flaky tests, snapshot abuse, mock everything, testing framework code)

### code-review-and-quality

Multi-dimensional code review knowledge.

- **Source**: Adapted from agent-skills
- **Covers**:
  - Five-axis review (correctness, readability, architecture, security, performance)
  - Severity labels (Critical / Required / Nit / Optional / FYI)
  - Review process (understand context -> review tests -> review implementation -> categorize -> verify)
  - Change sizing (~100 lines ideal, splitting strategies)
  - Dead code hygiene
  - Dependency discipline (5 questions before adding a dependency)
  - Multi-model review pattern
  - Handling disagreements (facts > style guides > principles > consistency)
  - Review checklist

### code-simplification

Reduce complexity without changing behavior.

- **Source**: Adapted from agent-skills
- **Covers**:
  - Chesterton's Fence (understand why before changing)
  - Five principles (preserve behavior, follow conventions, clarity over cleverness, maintain balance, scope to changes)
  - Simplification patterns: structural (deep nesting, long functions, nested ternaries, boolean flags), naming (generic, abbreviated, misleading), redundancy (duplication, dead code, unnecessary abstractions)
  - Incremental apply + test cycle
  - Rule of 500 (use codemods for large-scale changes)
  - When NOT to simplify (don't understand code, performance-critical, about to rewrite)
