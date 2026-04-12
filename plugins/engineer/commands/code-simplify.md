---
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
description: Simplify code for clarity without changing behavior — applying Chesterton's Fence, incremental changes with test verification
---

# Code Simplify

Announce: "Using engineer:code-simplify to simplify code."

Read `skills/code-simplification/SKILL.md` to load simplification knowledge before proceeding.

## 1. Identify scope

- If `$ARGUMENTS` specifies files or directories, use that as the scope.
- If no argument is provided, default to recently modified files:
  ```bash
  git diff --name-only main..HEAD
  ```
- List the files in scope and confirm with the user before proceeding.

## 2. Understand before touching (Chesterton's Fence)

For each file in scope, answer these before making any change:

- What is this code's responsibility?
- What calls it? What does it call?
- What are the edge cases and error paths?
- Are there tests that define expected behavior?
- Check `git blame`: what was the original context for non-obvious code?

If you cannot answer these questions, read more context first. Do not simplify code you do not understand.

## 3. Check test coverage

- Verify the target code has test coverage.
- If tests are missing, warn the user:
  > "This code lacks tests. Simplifying without tests risks behavior changes. Consider running `/test:plan` first."
- Do not proceed with simplification on untested code without explicit user approval.

## 4. Identify simplification opportunities

Scan for:

- **Structural complexity**: deep nesting, long functions, nested ternaries, boolean flag parameters
- **Naming issues**: generic names (`data`, `tmp`, `val`), abbreviations, misleading names
- **Redundancy**: duplicated logic, dead code, unnecessary abstractions, over-engineering

## 5. Apply incrementally

For each simplification:

1. Make ONE change at a time.
2. Run the test suite.
3. If tests pass, continue (or commit the change).
4. If tests fail, revert immediately and reconsider the approach.
5. Follow project conventions (read `CLAUDE.md` for style and tooling).

## 6. Verify result

After all changes:

- Compare before/after: is it genuinely easier to understand?
- Is the diff clean and reviewable?
- No error handling removed or weakened?
- No dead code left behind?

## 7. Report

Provide a summary of simplifications made: what was changed and why.
