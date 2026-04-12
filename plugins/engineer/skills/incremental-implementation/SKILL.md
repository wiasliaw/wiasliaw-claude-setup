---
name: incremental-implementation
description: Engineering discipline for incremental code delivery. Covers the implement-test-verify-commit cycle, scope discipline, simplicity-first approach, and source-driven development practices.
---

# Incremental Implementation

## Overview

Build in thin vertical slices. Each increment leaves the system in a working, testable state. Every framework decision is backed by official documentation.

```text
  Full Feature
  ┌─────────────────────────────────┐
  │  Slice 1  ✓ working + tested    │
  │  Slice 2  ✓ working + tested    │
  │  Slice 3  ◌ in progress         │
  │  Slice 4  · planned             │
  │  Slice 5  · planned             │
  └─────────────────────────────────┘
  At any point, slices 1..N are shippable.
```

A "slice" is the smallest unit of change that is complete, testable, and independently deployable. Slices are ordered so earlier slices never depend on later ones.

## When to Use

- Implementing a feature from a plan or spec
- Migrating or refactoring existing code
- Integrating a new library or framework
- Any task with more than one logical step

## When NOT to Use

- Exploratory prototyping where you intentionally throw code away
- One-line bug fixes or config changes (just do it)
- Pure documentation edits with no code impact

---

## The Increment Cycle

```text
Implement  -->  Test  -->  Verify  -->  Commit  -->  Next slice
    ^                                                   |
    └───────────────────────────────────────────────────┘
```

For each slice:

| Step       | Action                                                    |
|------------|-----------------------------------------------------------|
| Implement  | Write the smallest complete piece of functionality        |
| Test       | Run existing tests + add new tests covering the change    |
| Verify     | Tests pass, build succeeds, types check, lint passes      |
| Commit     | Commit with a descriptive message (`feat:`, `fix:`, etc.) |
| Next slice | Move to the next slice in the plan                        |

Never batch multiple slices into one commit. If verification fails, fix the current slice before moving on.

---

## Rule 0: Simplicity First

Before writing any code, ask:

1. **"What is the simplest thing that could work?"**
2. Can this be done in fewer lines?
3. Are abstractions earning their complexity?

Guidelines:

- Three similar lines > premature abstraction
- Implement the naive, obviously-correct version first
- Optimize only when measurement proves it necessary
- If a helper function is called once, inline it

```text
BAD:  abstract factory → strategy → adapter → the actual logic
GOOD: the actual logic (refactor later if patterns emerge)
```

---

## Rule 1: Scope Discipline

Touch only what the task requires.

**Do NOT:**

- Clean up adjacent code
- Refactor imports in untouched files
- Add features not in the spec
- "Improve" naming in unrelated modules
- Upgrade dependencies unless the task demands it

If you notice something worth improving, note it -- don't fix it:

```text
NOTICED BUT NOT TOUCHING:
- [ ] auth middleware has duplicated error handling
- [ ] user.ts imports are unsorted
- [ ] config loader lacks validation for new env vars

→ Want me to create tasks for these?
```

---

## Rule 2: One Thing at a Time

Each increment changes one logical thing. A "logical thing" is a single behavior change visible in tests or UI.

```text
BAD:  "Add user endpoint + refactor DB layer + update auth"
GOOD: Slice 1 — Add user endpoint with hardcoded data
      Slice 2 — Wire endpoint to DB layer
      Slice 3 — Add auth check to endpoint
```

---

## Rule 3: Keep It Compilable

The project must build and tests must pass after each increment. No exceptions.

- If a slice introduces a compile error, the slice is not done
- If a slice breaks existing tests, fix them in the same slice
- If you cannot keep it compilable, the slice is too big -- split it

```text
After every commit:
  ✓ build succeeds
  ✓ existing tests pass
  ✓ new tests pass
  ✓ type check passes
  ✓ lint passes
```

---

## Rule 4: Feature Flags

For incomplete features that need to merge into the main branch:

- Gate new behavior behind a feature flag or environment variable
- Default the flag to OFF (disabled)
- The system behaves identically to before when the flag is off
- Remove the flag once the feature is complete and validated

```typescript
// feature flag example
if (process.env.ENABLE_NEW_SEARCH === 'true') {
  return newSearchHandler(req);
}
return legacySearchHandler(req);
```

---

## Rule 5: Safe Defaults

New code defaults to conservative behavior:

- New boolean config → defaults to `false` (opt-in)
- New timeout → defaults to generous value
- New feature → disabled until explicitly enabled
- New API field → optional, not required
- Permissions → deny by default, grant explicitly

The goal: deploying new code with zero config changes produces identical behavior to the previous version.

---

## Rule 6: Rollback-Friendly

Each increment must be independently revertable:

- A `git revert <commit>` should cleanly apply
- No increment should leave orphaned migrations, dead config, or dangling references when reverted
- Database migrations: prefer additive changes (add column, add table) over destructive ones (drop column, rename)
- If a destructive migration is necessary, split into: (1) stop using the old thing, (2) remove the old thing

---

## Source-Driven Development

### Detect Stack and Versions

Before writing framework-specific code, read the project's dependency files:

| File             | Stack                |
|------------------|----------------------|
| `package.json`   | Node.js / JS / TS    |
| `Cargo.toml`     | Rust                 |
| `go.mod`         | Go                   |
| `pyproject.toml` | Python               |
| `Gemfile`        | Ruby                 |
| `pom.xml`        | Java / Kotlin        |
| `pubspec.yaml`   | Dart / Flutter       |

Pin your implementation to the **exact version** found in these files, not "latest."

### Source Hierarchy

When looking up how to do something, follow this priority:

```text
1. Official docs        (e.g., react.dev, docs.rs, pkg.go.dev)
2. Official blog/changelog  (e.g., Next.js blog, Rust release notes)
3. Web standards        (MDN Web Docs)
4. Browser/runtime compat   (caniuse.com, node.green)
```

Do NOT rely on:
- Stack Overflow answers (often outdated)
- Blog posts / tutorials (may target different versions)
- LLM memory (training data may be stale)

### Implement from Docs, Not from Memory

- Fetch official documentation for the exact version in use
- Follow documented patterns, even if you "know" a shortcut
- Cite sources in code comments with full URLs

```typescript
// Auth setup per Next.js 14 App Router docs:
// https://nextjs.org/docs/app/building-your-application/authentication
export async function middleware(request: NextRequest) {
  // ...
}
```

### Handle Conflicts

When official docs conflict with existing project code:

```text
CONFLICT DETECTED:
  - Project uses: NextAuth v4 pattern (pages/api/auth/[...nextauth].ts)
  - Docs recommend: Auth.js v5 pattern (app/api/auth/[...nextauth]/route.ts)
  - Project version: next-auth@4.24.5

→ Following project's current version pattern. Upgrade is a separate task.
```

Do NOT silently pick one. Surface the conflict and let the decision be explicit.

### Flag Unverified Patterns

If you cannot find official documentation for a pattern:

```typescript
// UNVERIFIED: No official docs found for this retry pattern with
// @tanstack/query v5. Based on observed behavior in tests.
const { data } = useQuery({
  queryKey: ['users'],
  retry: (count, error) => count < 3 && error.status !== 404,
});
```

---

## Increment Checklist

Run through this after **every** increment:

```text
[ ] One logical thing done completely
[ ] New tests added or existing tests updated
[ ] All tests pass
[ ] Build succeeds
[ ] Type check passes (if applicable)
[ ] Lint passes
[ ] Committed with descriptive message
[ ] No unrelated changes included
```

---

## Anti-Rationalization Table

| Rationalization                            | Counter                                                  |
|--------------------------------------------|----------------------------------------------------------|
| "While I'm here, I might as well..."       | No. Separate task.                                       |
| "This will only take a second..."          | Then it will only take a second in its own slice.        |
| "It's too small for its own commit..."     | Small commits are good commits.                          |
| "I'll clean it up before merging..."       | Clean it up now or not at all.                           |
| "The tests are passing so it's fine..."    | Passing tests + unrelated changes = hidden risk.         |
| "I know how this framework works..."       | Check the docs. Versions change. Memory lies.            |
| "This blog post shows a better way..."     | Does the official doc agree? Use that.                   |
| "The docs are outdated..."                 | Flag it as UNVERIFIED. Don't guess.                      |

---

## Red Flags

Stop and reassess if you observe any of these:

- A single slice touches more than 3 files (might be too big)
- You are writing code "for later" that no current test exercises
- You cannot describe the slice in one sentence
- The build has been broken for more than one step
- You are copying patterns from a different project without checking docs
- You are choosing a library/pattern based on familiarity rather than documentation
- A commit message needs "and" (doing two things)

---

## Verification Checklist

Before declaring the full implementation complete:

```text
[ ] Every slice followed the increment cycle
[ ] All tests pass (unit, integration, e2e as applicable)
[ ] Build succeeds in CI-equivalent environment
[ ] No TODO or FIXME introduced without a linked task
[ ] Feature flags documented if used
[ ] Source citations present for framework-specific patterns
[ ] No UNVERIFIED markers left unresolved (or explicitly accepted)
[ ] Scope matches the original spec — nothing more, nothing less
```
