---
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, WebFetch, WebSearch
description: Write and execute tests according to the test strategy — following Prove-It pattern with incremental test-verify cycles
---

# Test Run — Write and Execute Tests

Using engineer:test-run to write and execute tests.

## 1. Load Test Engineering Knowledge

Read `skills/test-engineering/SKILL.md` and internalize the test quality rules, Prove-It pattern, test pyramid, and writing guidelines before proceeding.

## 2. Find Test Strategy

- If `$ARGUMENTS` specifies a strategy file, read that file directly.
- Otherwise, search `docs/plans/` and the project root for recent test strategy documents (e.g., `test-strategy.md`, `test-plan.md`).
- If no strategy exists, tell the user:
  > No test strategy found. Run `/test:plan` first to generate one, or pass a strategy file as an argument.

Read the full strategy before starting.

## 3. Execute Test Strategy

For each behavior or test item in the strategy, follow the Prove-It cycle:

| Step     | Action                                                                          |
|----------|---------------------------------------------------------------------------------|
| Write    | Write a failing test that captures the expected behavior                         |
| Run      | Execute the test — confirm it fails (or passes if validating existing code)      |
| Verify   | If testing a bug fix, confirm the test fails before the fix and passes after     |
| Commit   | Commit the test with a descriptive message (`test: <what behavior is covered>`)  |
| Iterate  | Move to the next behavior in the strategy                                       |

## 4. Test Quality Rules

Apply these rules from the skill to every test written:

- **Test state, not interactions** — assert outcomes, not method calls.
- **DAMP over DRY** — each test tells a complete story. Duplication is acceptable for readability.
- **Real implementations over mocks** — preference order: real > fake > stub > mock.
- **Arrange-Act-Assert** — every test follows this structure.
- **One assertion per concept** — multiple expects are fine if they verify the same behavior.
- **Descriptive test names** — names read like specifications (e.g., "transfer reverts when sender has insufficient balance").

## 5. Coverage Analysis

After all tests in the strategy are written:

1. Run the full test suite — confirm everything passes.
2. Run coverage analysis if tools are available (`--coverage`, `forge coverage`, `pytest --cov`, etc.).
3. Identify gaps — behaviors listed in the strategy that still lack tests.
4. Write additional tests for uncovered edge cases (zero values, empty inputs, max values, error paths).

## 6. Report

When complete, print a summary:

- **Tests written**: count of new tests added
- **Tests passing**: count of passing tests in the full suite
- **Coverage change**: before vs. after (if coverage tooling is available)
- **Untestable behaviors**: any items from the strategy that could not be tested, with reasons
- **Suggestions**: future test improvements (fuzz tests, invariant tests, missing edge cases)

## Rules

- **Follow the strategy** — do not invent test cases outside the strategy unless filling obvious coverage gaps.
- **One test at a time** — write, run, verify, commit. Do not batch.
- **Diagnose failures** — if a test fails unexpectedly, investigate root cause before retrying. Do not loop blindly.
- **Do not modify production code** — this command writes tests only. If a bug is found, note it and move on.
- **Match existing conventions** — use the project's existing test framework, file structure, and naming patterns.
