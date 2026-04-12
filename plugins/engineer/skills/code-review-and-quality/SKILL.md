---
name: code-review-and-quality
description: Multi-dimensional code review knowledge. Covers five-axis review, severity labeling, change sizing, dead code hygiene, and dependency discipline.
---

## Overview

Every change gets reviewed before merge. Review covers five axes: correctness, readability, architecture, security, and performance.

**Approval standard**: approve when the change definitely improves overall code health of the system, even if the change is not perfect. There is no such thing as "perfect" code -- there is only "better" code. A reviewer should not require the author to polish every tiny piece; rather, the reviewer should balance forward progress with the importance of the suggested change.

## When to Use

- Self-review after completing implementation (`/review:self`)
- Reviewing a PR or diff (`/review:pr`)
- Pre-merge quality gate
- Evaluating third-party contributions

## When NOT to Use

- Rubber-stamping a change you haven't actually read
- Reviewing generated code you don't understand -- understand it first, then review
- Nitpicking style on an urgent hotfix -- focus on correctness only

## The Five-Axis Review

### 1. Correctness

| Check | Details |
|-------|---------|
| Spec match | Does the code do what the spec / ticket / PR description says? |
| Edge cases | Empty inputs, nil/null, boundary values, max sizes |
| Error paths | Are errors caught, logged, and surfaced appropriately? |
| Tests | Do tests exist? Do they test the right behavior? |
| Off-by-one | Loop bounds, slice indices, pagination offsets |
| Race conditions | Shared mutable state, concurrent access, missing locks |

### 2. Readability & Simplicity

| Check | Details |
|-------|---------|
| Naming | Descriptive, unambiguous, consistent with codebase conventions |
| Control flow | Straightforward; no clever tricks or deeply nested logic |
| Abstractions | Each abstraction earns its complexity; no premature generalization |
| Dead code | No commented-out code, unused imports, or unreachable branches |
| Comments | Explain *why*, not *what*; no misleading stale comments |

### 3. Architecture

| Check | Details |
|-------|---------|
| Existing patterns | Follows established patterns in the codebase |
| Module boundaries | Clean separation of concerns; no circular dependencies |
| Abstraction level | Code lives at the appropriate layer |
| Dependency direction | Dependencies point inward (domain does not depend on infra) |
| API surface | Public API is minimal and intentional |

### 4. Security

| Check | Details |
|-------|---------|
| Input validation | All external input validated and sanitized |
| Secrets | No secrets, tokens, or credentials in code or config committed to repo |
| Injection | Parameterized queries; no string concatenation for SQL/commands |
| XSS | Output encoding in place; no raw HTML insertion from user data |
| Trust boundary | All external data treated as untrusted by default |

### 5. Performance

| Check | Details |
|-------|---------|
| N+1 queries | Database calls inside loops; missing eager loading |
| Unbounded loops | Loops over user-controlled input without limits |
| Sync vs async | Synchronous operations that should be async (I/O, network) |
| Pagination | Missing pagination on list endpoints or large data sets |
| Re-renders | Unnecessary re-renders in UI code (missing memoization, unstable keys) |
| Allocation | Excessive object creation in hot paths |

## Severity Labels

Use these prefixes on every review comment to signal intent clearly.

| Prefix | Meaning | Author Action |
|--------|---------|---------------|
| *(no prefix)* | Required change | Must fix before merge |
| **Critical** | Blocks merge -- data loss, security hole, crash | Must fix immediately |
| **Nit** | Minor style or preference issue | Optional -- fix if easy |
| **Optional** / **Consider** | Suggestion for improvement | Author decides |
| **FYI** | Informational, no action needed | Acknowledge or ignore |

Example:

```text
Critical: This SQL query interpolates user input directly. Use parameterized queries.

Nit: `data` is a vague name. Consider `userProfiles` or `fetchedRecords`.

FYI: There's a utility in `lib/format.ts` that already handles this date formatting.
```

## Review Process

### Step 1: Understand Context

- Read the PR description, linked ticket, or spec
- What is this change trying to accomplish?
- What is the expected user-visible behavior change?

### Step 2: Review Tests First

- Do tests exist for the change?
- Do they test behavior, not implementation details?
- Are edge cases covered (empty, null, boundary, error)?
- Would the tests catch a regression if someone changed the implementation?

### Step 3: Review Implementation

Walk through the code with the five axes:

1. Correctness -- does it do what it claims?
2. Readability -- can the next developer understand this in 30 seconds?
3. Architecture -- does it fit the existing system?
4. Security -- any new attack surface?
5. Performance -- any new bottlenecks?

### Step 4: Categorize Findings

Label every finding with a severity prefix. Group by file when possible. Put the most important findings first.

### Step 5: Verify the Verification

- What tests ran? Did they pass?
- Did the build pass?
- Was manual testing done where appropriate?
- Are there screenshots / recordings for UI changes?

## Change Sizing

| Lines Changed | Verdict |
|---------------|---------|
| ~100 | Good -- easy to review thoroughly |
| ~300 | Acceptable if it's a single logical change |
| ~1000+ | Too large -- split it |

### Splitting Strategies

| Strategy | Description |
|----------|-------------|
| **Stack** | Chain of dependent PRs, each building on the previous |
| **By file group** | Split by module or directory (e.g., backend + frontend separately) |
| **Horizontal** | Split by layer (data model, service, API, UI) |
| **Vertical** | Split by feature slice (one thin end-to-end slice per PR) |

**Rule**: separate refactoring from feature work. Never mix "cleanup" and "new behavior" in the same PR -- it makes review nearly impossible and git blame useless.

## Dead Code Hygiene

Dead code increases cognitive load and hides bugs.

1. **Identify** -- unreachable branches, unused functions, commented-out blocks, unused imports
2. **List explicitly** -- call out each instance in the review
3. **Ask before deleting** -- some "dead" code is intentionally kept (e.g., feature flags, fallback paths); confirm with the author
4. **Prefer deletion over commenting** -- version control is the archive; commented-out code is noise

## Dependency Discipline

Before adding any new dependency, answer these five questions:

| # | Question | Red Flag |
|---|----------|----------|
| 1 | Can the existing stack solve this? | Adding a dep for something 20 lines of code can do |
| 2 | What is the size / bundle impact? | > 100 KB for a utility function |
| 3 | Is it actively maintained? | No commits in 12+ months, unresolved critical issues |
| 4 | Are there known vulnerabilities? | Unpatched CVEs, `npm audit` / `cargo audit` warnings |
| 5 | Is the license compatible? | GPL in a proprietary project, SSPL in SaaS |

If any answer is a red flag, push back on the dependency.

## Multi-Model Review Pattern

When using AI-assisted development, apply a separation-of-concerns review:

1. **Model A writes** the implementation
2. **Model B reviews** the implementation (fresh context, no sunk-cost bias)
3. **Model A addresses** feedback from Model B
4. **Human makes the final call** -- AI review assists but does not replace human judgment

This pattern catches errors that a single model misses due to its own blind spots.

## Handling Disagreements

When reviewer and author disagree, resolve using this hierarchy (highest priority first):

1. **Technical facts** -- data, benchmarks, documentation, specs
2. **Style guides** -- project or team coding standards
3. **Engineering principles** -- SOLID, DRY, KISS, YAGNI
4. **Codebase consistency** -- "we do it this way here"

If the disagreement is purely preference with no clear winner, the **author wins** -- they own the code going forward.

Never block a PR over personal style preference. Escalate unresolved technical disagreements to a third party or tech lead.

## Honesty in Review

- **No rubber-stamping** -- if you didn't read it, don't approve it
- **No softening real issues** -- "this might maybe possibly be a problem" when you mean "this will crash in production"
- **Quantify problems** -- "this is O(n^2) on a list that can reach 100K items" beats "this might be slow"
- **Push back on bad approaches** -- suggest a concrete alternative, not just "this is wrong"
- **Accept override gracefully** -- if the author has context you lack and chooses to proceed, note your concern and move on

## Review Checklist

Use this checklist for thorough reviews:

### Correctness
- Code matches spec / ticket requirements
- Edge cases handled (empty, null, boundary, overflow)
- Error paths handled and tested
- No off-by-one errors in loops or indices
- No race conditions or shared mutable state issues

### Readability & Simplicity
- Names are descriptive and consistent
- Control flow is straightforward
- No dead code, commented-out blocks, or unused imports
- Comments explain *why*, not *what*
- Abstractions are justified

### Architecture
- Follows existing codebase patterns
- Clean module boundaries
- Dependency direction is correct
- No unnecessary public API surface

### Security
- External input validated and sanitized
- No secrets in code
- Queries are parameterized
- Output is properly encoded (XSS prevention)

### Performance
- No N+1 queries
- No unbounded loops on external input
- Async used where appropriate
- Pagination in place for list operations

### Verification
- Tests exist and pass
- Build passes
- Manual testing done (if applicable)
- Screenshots provided for UI changes

## Anti-Rationalization Table

Watch for these common rationalizations that mask real problems:

| Rationalization | Reality | What to Do |
|-----------------|---------|------------|
| "We'll fix it later" | Later never comes; tech debt compounds | Fix now or create a tracked ticket with a deadline |
| "It works on my machine" | Environment-specific behavior hides bugs | Require CI green + reproducible test |
| "It's just a small change" | Small changes cause big outages | Review with the same rigor regardless of size |
| "Nobody will use it that way" | Users always find the unexpected path | Add validation or document the constraint |
| "The tests pass" | Tests can be wrong, incomplete, or testing the wrong thing | Review the tests themselves |
| "It's too hard to test" | Usually means the design needs refactoring | Suggest a testable design alternative |
| "We need this for the deadline" | Shipping broken code costs more than a delay | Negotiate scope, not quality |

## Red Flags

Reject or escalate immediately when you see:

- **Secrets in code** -- API keys, passwords, tokens in source or config files
- **Disabled tests** -- `skip`, `xit`, `@Ignore` without a linked tracking issue
- **Catch-and-swallow** -- empty catch blocks that silently eat errors
- **Unbounded input** -- no limits on file upload size, query result count, or loop iterations
- **Raw SQL / command interpolation** -- string concatenation with user input
- **Permission changes** -- chmod 777, overly broad IAM policies, disabled auth checks
- **Copied sensitive logic** -- duplicated auth, crypto, or billing logic instead of reusing a shared module
- **TODO without ticket** -- `TODO` or `FIXME` without a linked issue; these become permanent

## Verification Checklist

Before approving, confirm:

- All CI checks pass (lint, build, test)
- Test coverage is adequate for the change
- No new warnings introduced
- Database migrations are reversible (if applicable)
- Feature flags are in place for incomplete features
- Documentation updated (API docs, README, changelog)
- No unresolved review threads
- Change size is reasonable (split if > 300 lines and multi-concern)
