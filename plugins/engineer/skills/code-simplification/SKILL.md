---
name: code-simplification
description: Knowledge for simplifying code without changing behavior. Covers Chesterton's Fence, five simplification principles, pattern recognition, and incremental apply-and-test workflow.
---

# Code Simplification

Simplify code by reducing complexity while preserving exact behavior. The goal is **not** fewer lines — it's code that is easier to read, understand, modify, and debug.

Litmus test: *"Would a new team member understand this faster than the original?"*

## When to Use

- After a feature works and tests pass
- During code review
- Deeply nested logic or long functions
- After merging changes that introduced duplication

## When NOT to Use

- Code is already clean and readable
- You don't fully understand the code
- Performance-critical hot paths where structure exists for speed
- The module is about to be rewritten entirely

---

## The Five Principles

### 1. Preserve Behavior Exactly

Same output for every input. Same error behavior. Same side effects. Same ordering.

If you are unsure whether a change preserves behavior, **don't make the change**.

### 2. Follow Project Conventions

Read `CLAUDE.md`. Study neighboring files. Match the project's existing style for naming, structure, and patterns.

Inconsistent "simplification" is churn, not improvement.

### 3. Prefer Clarity Over Cleverness

Explicit beats compact when compact requires a mental pause to parse.

**Before** — nested ternary:

```ts
const label = isAdmin ? "Admin" : isMod ? "Moderator" : "User";
```

**After** — if/else:

```ts
let label: string;
if (isAdmin) {
  label = "Admin";
} else if (isMod) {
  label = "Moderator";
} else {
  label = "User";
}
```

**Before** — chained reduce:

```ts
const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
```

**After** — for loop:

```ts
let total = 0;
for (const item of items) {
  total += item.price * item.qty;
}
```

Use judgment — a simple `.map()` or `.filter()` is often clearer than a loop. The principle targets chains that require tracing multiple transformations mentally.

### 4. Maintain Balance

Avoid over-simplification:

- **Inlining too aggressively** — extracting a helper back forces readers to scroll
- **Combining unrelated logic** — a function that does two things is harder to test
- **Removing abstractions that exist for testability** — an interface or wrapper might look redundant but enables mocking
- **Optimizing for line count** — shorter is not always simpler

### 5. Scope to What Changed

Default to recently modified code. Avoid drive-by refactors in unrelated files — they bloat diffs, increase review burden, and risk regressions.

---

## The Simplification Process

### Step 1: Understand Before Touching (Chesterton's Fence)

Before removing or changing anything, answer:

1. What is this code's responsibility?
2. What calls it? What does it call?
3. What edge cases does it handle?
4. What tests cover it?
5. Why was it written this way?

Check `git blame` and related commits. A seemingly over-complex function may guard against a subtle bug.

### Step 2: Identify Opportunities

#### Structural Complexity

| Pattern | Symptom | Typical Fix |
|---|---|---|
| Deep nesting | 3+ levels of `if`/`for`/`try` | Early returns, extract helper |
| Long functions | 50+ lines, multiple responsibilities | Split by responsibility |
| Nested ternaries | Chained `? :` expressions | `if`/`else` or lookup map |
| Boolean parameter flags | `doThing(true, false, true)` | Options object or separate functions |
| Repeated conditionals | Same `if` check in multiple places | Consolidate or extract guard |

#### Naming and Readability

| Pattern | Symptom | Typical Fix |
|---|---|---|
| Generic names | `data`, `result`, `temp`, `val` | Name after domain concept |
| Abbreviations | `usr`, `cfg`, `idx` | Spell out unless universally understood |
| Misleading names | `isValid` that also transforms | Rename to reflect actual behavior |
| "What" comments | `// increment counter` | Delete or replace with "why" comment |

#### Redundancy

| Pattern | Symptom | Typical Fix |
|---|---|---|
| Duplicated logic | Copy-pasted blocks with minor variation | Extract shared function |
| Dead code | Unreachable branches, unused imports | Delete (verify with tests) |
| Unnecessary abstractions | Wrapper that only delegates | Inline the wrapper |
| Over-engineered patterns | Factory-of-factories, strategy for one variant | Flatten to direct implementation |
| Redundant type assertions | `as string` on an already-string value | Remove assertion |

### Step 3: Apply Incrementally

1. Make **one** simplification at a time.
2. Run tests after each change.
3. If tests pass — commit or continue.
4. If tests fail — **revert** immediately, then investigate.

Do not batch multiple simplifications into a single untested change.

### Step 4: Verify the Result

- Compare before and after side by side.
- Is the code **genuinely** easier to understand?
- Is it consistent with the rest of the codebase?
- Does the diff tell a clean story?

---

## Rule of 500

If a refactoring would touch **500+ lines**, prefer automation over manual edits:

- **Codemods** (jscodeshift, ts-morph)
- **sed / awk** for simple text transforms
- **AST transforms** for structural changes

Manual edits at scale invite typos and missed occurrences.

---

## Language-Specific Examples

### TypeScript / JavaScript

**Unnecessary async wrapper:**

```ts
// Before
async function getUser(id: string): Promise<User> {
  return await db.users.findOne({ id });
}

// After
function getUser(id: string): Promise<User> {
  return db.users.findOne({ id });
}
```

**Verbose conditional:**

```ts
// Before
if (user.role === "admin") {
  return true;
} else {
  return false;
}

// After
return user.role === "admin";
```

**Manual array building:**

```ts
// Before
const names: string[] = [];
for (const user of users) {
  names.push(user.name);
}

// After
const names = users.map((user) => user.name);
```

**Redundant boolean return:**

```ts
// Before
function isActive(user: User): boolean {
  if (user.status === "active") {
    return true;
  }
  return false;
}

// After
function isActive(user: User): boolean {
  return user.status === "active";
}
```

### Python

**Verbose dict building:**

```python
# Before
result = {}
for item in items:
    result[item.id] = item.name

# After
result = {item.id: item.name for item in items}
```

**Nested conditionals with early return:**

```python
# Before
def process(order):
    if order is not None:
        if order.is_valid():
            if order.has_items():
                return fulfill(order)
            else:
                return Error("no items")
        else:
            return Error("invalid")
    else:
        return Error("no order")

# After
def process(order):
    if order is None:
        return Error("no order")
    if not order.is_valid():
        return Error("invalid")
    if not order.has_items():
        return Error("no items")
    return fulfill(order)
```

---

## Anti-Rationalization Table

| Rationalization | Reality |
|---|---|
| "It's more concise" | Concise but harder to read is not simpler |
| "Modern style prefers this" | Follow the project's style, not trends |
| "Nobody will need to change this" | Every line eventually gets changed |
| "The tests still pass" | Tests may not cover the affected behavior |
| "I'll clean up adjacent code while I'm here" | Scope creep — file a separate issue |
| "This abstraction might be useful later" | YAGNI — remove speculative abstractions |
| "It's obvious what this does" | Obvious to you right now is not obvious to everyone |

---

## Red Flags

Stop and reconsider if your simplification:

- **Requires modifying tests** to pass (you may be changing behavior)
- **Results in longer code** than the original
- **Renames things to personal preference** rather than objective clarity
- **Removes error handling** or swallows exceptions
- **Simplifies code you don't fully understand**
- **Batches many unrelated changes into one commit**

---

## Verification Checklist

Before considering a simplification done:

1. All existing tests pass without modification
2. Behavior is identical for normal inputs, edge cases, and error paths
3. The change follows project conventions (checked `CLAUDE.md`, neighboring code)
4. Each simplification is in its own commit (or logically atomic)
5. The diff is reviewable — a reviewer can understand intent at a glance
6. No unrelated changes are included
7. Code is genuinely easier to understand, not just shorter
