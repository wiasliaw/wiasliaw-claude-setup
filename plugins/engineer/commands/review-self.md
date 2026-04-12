---
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, WebFetch, WebSearch
description: Self-review current changes before merge — five-axis review with severity-labeled findings and auto-fixes
---

# Self-Review: Five-Axis Review

Using engineer:review-self to self-review changes.

## Setup

1. **Load review knowledge.** Read `skills/code-review-and-quality/SKILL.md` in full. This defines the five-axis review framework, severity labels, and approval standards. Follow it precisely.

2. **Collect changes.** Gather the diff to review:

   ```bash
   git diff
   git diff --staged
   git log --oneline main..HEAD
   ```

   If `$ARGUMENTS` specifies a scope (file paths, commit range, etc.), use that scope instead.

3. **Identify changed files.** Build a list of all modified files from the diffs. Read each file in full so you have complete context, not just the diff hunks.

## Phase 1: Test Review

Before reviewing implementation, check the tests:

- **Existence**: Do tests exist for the changed code? If not, flag as a finding.
- **Behavior focus**: Do tests verify behavior and outcomes, not implementation details?
- **Edge cases**: Are boundary conditions, empty inputs, and error paths tested?
- **Regression safety**: Would these tests catch a future regression in the changed code?

## Phase 2: Five-Axis Review

Review each changed file across all five axes:

### Correctness
- Does the code match the intended spec or purpose?
- Are edge cases handled (nil, empty, overflow, concurrent access)?
- Are error paths correct — no swallowed errors, no missing cleanup?

### Readability
- Are names clear and consistent with surrounding code?
- Is the control flow straightforward? No unnecessary cleverness?
- Could a new team member understand this without extra explanation?

### Architecture
- Does it follow existing patterns in the codebase?
- Are module boundaries clean — no layering violations?
- Is the abstraction level right — not too abstract, not too concrete?

### Security
- Is user input validated and sanitized?
- No hardcoded secrets, tokens, or credentials?
- SQL queries parameterized? HTML output escaped (XSS prevention)?
- Are permissions and access controls checked?

### Performance
- Any N+1 query patterns?
- Unbounded loops or uncapped collection growth?
- Missing pagination on list endpoints?
- Unnecessary allocations in hot paths?

## Phase 3: Categorize Findings

Label every finding with a severity:

| Severity | Meaning | Action |
|----------|---------|--------|
| **Critical** | Blocks merge — security vuln, data loss, broken functionality | Must fix before merge |
| *(no prefix)* | Required change — correctness or quality issue | Must address |
| **Nit** | Minor — formatting, naming preference, style | Optional |
| **Optional/Consider** | Suggestion worth thinking about | Author's discretion |
| **FYI** | Informational context, no action needed | None |

## Phase 4: Auto-Fix

- **Nit-level issues**: Fix automatically (formatting, trivial naming, style).
- **Obvious bugs**: Fix if the correct behavior is unambiguous.
- **Commit each fix separately** with a clear conventional commit message (e.g., `fix: correct off-by-one in pagination`, `style: fix formatting in utils`).
- **Do not auto-fix** anything that requires design judgment. List it in the report and ask the user.

## Phase 5: Report

Output a summary:

1. **Findings by severity** — count and list, grouped by Critical / Required / Nit / Optional / FYI.
2. **Auto-fixed** — what was fixed and the commit hash for each fix.
3. **Needs human judgment** — findings that require the user to decide, with enough context to act.
4. **Overall assessment** — whether the change is ready to merge, or what blocks it.

## Rules

- Be honest. If the code is fine, say so. Do not invent findings to appear thorough.
- Be specific. Every finding must reference the file, line, and exact issue.
- Be actionable. Every non-FYI finding must say what to do.
- Respect the approval standard from the skill: approve when the change definitively improves overall code health, even if imperfect.

---

**User's specification (if any):** $ARGUMENTS
