---
allowed-tools: Bash, Read, Glob, Grep, WebFetch, WebSearch
description: Review an existing PR or branch diff — five-axis review producing severity-labeled findings suitable for PR comments
---

Say: "Using engineer:review-pr to review the PR."

This is a READ-ONLY review. Do NOT modify any files.

## Step 1 — Load review knowledge

Read the file `skills/code-review-and-quality/SKILL.md` in this plugin to load review guidelines and quality criteria.

## Step 2 — Identify the PR / diff

Determine what to review based on `$ARGUMENTS`:

- **PR number given** (e.g. `123`, `#123`): run `gh pr view <number>` to get PR metadata and `gh pr diff <number>` to get the diff.
- **Branch name given**: run `git diff main...<branch>` to produce the diff, and `git log main..<branch> --oneline` for commit messages.
- **No argument**: detect the current branch with `git branch --show-current`. If it is not `main`, diff the current branch against main with `git diff main...HEAD` and `git log main..HEAD --oneline`. If already on main, ask the user to provide a PR number or branch name.

## Step 3 — Understand context

- Read the PR description and/or commit messages obtained above.
- Identify the goal of the change: what problem does it solve? what behavior does it add or modify?
- Check if the PR body links to an issue or spec. If a linked issue exists, read it with `gh issue view <number>` to understand requirements.

## Step 4 — Review tests first

Before reviewing implementation, look at test changes in the diff:

- Are there tests covering this change? If not, flag it.
- Do tests verify behavior (inputs/outputs) rather than implementation details?
- Are edge cases covered (empty input, error paths, boundary values)?
- Are test names descriptive enough to serve as documentation?

## Step 5 — Five-axis review

For each changed file, evaluate:

1. **Correctness** — Does the code match requirements? Are edge cases handled? Are error paths correct? Any off-by-one errors, race conditions, or resource leaks?
2. **Readability** — Are names clear and intention-revealing? Is the control flow straightforward? Is there unnecessary complexity or clever code that should be simplified?
3. **Architecture** — Does the change follow existing patterns in the codebase? Are module boundaries clean? Is there any misplaced responsibility?
4. **Security** — Is user input validated? Are secrets kept out of code? Is there protection against injection (SQL, XSS, command)? Are auth checks in place where needed?
5. **Performance** — Any N+1 queries? Unbounded iterations or allocations? Missing pagination on list endpoints? Unnecessary computation in hot paths?

Use Glob, Grep, and Read as needed to check surrounding code for pattern consistency and to verify assumptions about existing behavior.

## Step 6 — Categorize findings

Label every finding with a severity prefix:

- **Critical:** — Must fix before merge. Bugs, data loss risks, security vulnerabilities.
- **(no prefix)** — Required change. Correctness or maintainability issues that should be addressed.
- **Nit:** — Minor style or naming issue. Optional to fix.
- **Optional:** / **Consider:** — A suggestion for improvement, not blocking.
- **FYI** — Informational observation, no action needed.

## Step 7 — Check change sizing

Assess the overall diff size:

- ~100 lines changed: good, easy to review.
- ~300 lines changed: acceptable if it is a single logical change.
- ~1000+ lines changed: recommend the author split the PR into smaller, independently reviewable pieces. Note which logical units could be extracted.

## Step 8 — Check dependency changes

If the diff adds or modifies dependencies (package.json, Cargo.toml, go.mod, requirements.txt, etc.):

- Could an existing dependency or stdlib solve this instead?
- What is the package size / impact on bundle?
- Is it actively maintained (last publish date, open issues)?
- Are there known vulnerabilities? (check with `gh api` or WebSearch if needed)
- Is the license compatible with the project?

## Step 9 — Produce the review report

Output a report formatted for posting as a PR comment. Use this structure:

```markdown
## Review Summary

<1-3 sentence summary of what the change does and the overall assessment.>

## Findings

### Critical

- <file:line> — description and why it blocks merge

### Required Changes

- <file:line> — description

### Nits

- <file:line> — description

### Suggestions

- <file:line> — description

### FYI

- observation

## Change Size

<assessment and recommendation if splitting is warranted>

## Dependency Changes

<assessment, or "No new dependencies." if none>

## Verdict

**Approve** / **Request Changes**

<brief rationale>
```

Omit any section that has no findings (e.g. if there are no Critical items, skip that heading).

Keep findings concise and action-oriented. Each finding should tell the author *what* is wrong and *why*, with enough context to act on it without further clarification.
