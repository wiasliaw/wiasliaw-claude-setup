---
allowed-tools: Bash, Read, Write, Glob, Grep, WebFetch, WebSearch
description: Analyze the codebase and design a test strategy — identify test types, frameworks, behaviors to cover, and edge cases
---

# Test Plan

Announce: "Using engineer:test-plan to design a test strategy."

## Load Skill

Read `skills/test-engineering/SKILL.md` for test design knowledge — test types, selection criteria, and best practices.

## Analyze Existing Test Infrastructure

Scan the project to understand the current testing landscape:

1. **Detect test framework(s)** — check `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, or equivalent for test dependencies and scripts.
2. **Find test directories and conventions** — look for `test/`, `tests/`, `__tests__/`, `spec/`, `*_test.*`, `*.spec.*`, `*.test.*` patterns.
3. **Check coverage configuration** — look for coverage tools (nyc, c8, istanbul, coverage.py, tarpaulin, etc.) and existing coverage reports.
4. **Count and categorize existing tests** — tally tests by type (unit, integration, e2e) and by module/component.

Summarize findings before proceeding.

## Identify What to Test

Determine the scope of the test strategy:

- If `$ARGUMENTS` specifies a scope (file, module, feature, PR), focus analysis on that scope.
- If `$ARGUMENTS` is empty, analyze recent changes via `git diff HEAD~5 --stat` or look for spec artifacts (e.g., `openspec/`, `docs/`) to derive scope.

For the identified scope:

1. **List behaviors that need testing** — public APIs, state transitions, data transformations, side effects.
2. **Identify edge cases** — boundary values, empty inputs, overflow, concurrent access, error paths, permission failures.
3. **Identify error paths** — exception handling, invalid input, network failures, timeouts.

## Design Test Strategy

For each component or behavior, decide:

- **Test type** — unit, integration, e2e, fuzz, invariant, property-based, event trigger, snapshot, or other.
- **Justification** — why this type fits (isolation needs, interaction complexity, randomness benefit, etc.).
- **Behaviors to verify** — specific assertions and properties.
- **Edge cases to cover** — concrete scenarios.
- **Priority** — critical path first, then secondary flows, then edge cases.

Order the plan so critical-path items come first.

## Produce Test Strategy Document

Format the strategy as:

```markdown
# Test Strategy: [scope]

## Current State
- Framework: [detected framework(s)]
- Existing tests: [count by type]
- Coverage: [summary or "not configured"]

## Test Plan

### [Component/Behavior 1]
- Type: [unit/integration/fuzz/etc.]
- Why: [justification]
- Behaviors to verify:
  - [ ] [behavior 1]
  - [ ] [behavior 2]
- Edge cases:
  - [ ] [edge case 1]
  - [ ] [edge case 2]
- Priority: [critical/high/medium/low]

### [Component/Behavior 2]
...
```

## Save

Ask the user where to save the document. Suggest `docs/test-strategy-<scope>.md` as a default. Write the file to the agreed location.

## Handoff

"Test strategy ready. Run `/test:run` to execute."
