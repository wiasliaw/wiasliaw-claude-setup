---
name: test-engineering
description: Comprehensive test design and execution knowledge. Covers test pyramid, test types (unit, fuzz, invariant, property-based, event trigger), Prove-It pattern, and test quality practices.
---

## Overview

Tests are proof, not afterthoughts. Every behavior claim must be backed by an executable assertion. This skill covers both **test strategy design** (deciding what and how to test) and **execution discipline** (writing tests that actually catch bugs).

Used by:

- `/test:plan` — analyze a codebase and produce a test strategy
- `/test:run` — execute tests following the patterns defined here

## When to Use

- Implementing any new feature or fixing any bug (write tests first)
- Designing a test strategy for a new or existing codebase
- Reviewing test quality and coverage gaps
- Adding fuzz, invariant, or property-based tests to harden critical code

## When NOT to Use

- Throwaway prototypes with explicit "no tests" scope
- Pure documentation or configuration-only changes
- When the project has no test infrastructure and the task is unrelated to setting one up

## Test Pyramid

```text
     /\        E2E (~5%) — full user flows, real environment
    /  \       Integration (~15%) — component interactions, API boundaries
   /    \      Unit (~80%) — pure logic, isolated, milliseconds
  /______\
```

Push tests down the pyramid. Unit tests are fast, reliable, and cheap. E2E tests are slow, flaky, and expensive. Only escalate when a lower level cannot cover the behavior.

## Test Types — Full Catalog

### Unit Test

**What it tests:** Pure logic — no I/O, no network, no database.  
**When to use:** Every function with meaningful logic.  
**Speed:** Milliseconds.  
**Frameworks:** Jest, Vitest, pytest, Go `testing`, Foundry `forge test`

```typescript
// Example: pure calculation
function discount(price: number, pct: number): number {
  return price * (1 - pct / 100);
}

test("discount applies percentage correctly", () => {
  expect(discount(100, 15)).toBe(85);
});
```

### Integration Test

**What it tests:** Cross-boundary interactions — API calls, database queries, file system operations.  
**When to use:** Anywhere two components meet.  
**Speed:** Seconds.  
**Frameworks:** Supertest, pytest + httpx, testcontainers

```typescript
// Example: API endpoint with database
test("POST /users creates user and returns 201", async () => {
  const res = await request(app)
    .post("/users")
    .send({ name: "Alice" });
  expect(res.status).toBe(201);

  const user = await db.users.findOne({ name: "Alice" });
  expect(user).toBeDefined();
});
```

### E2E Test

**What it tests:** Complete user flow in a real browser or environment.  
**When to use:** Critical user journeys (login, checkout, onboarding).  
**Speed:** Minutes.  
**Frameworks:** Playwright, Cypress, Selenium

```typescript
// Example: login flow
test("user can log in and see dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", "user@test.com");
  await page.fill("#password", "secret");
  await page.click("button[type=submit]");
  await expect(page.locator("h1")).toHaveText("Dashboard");
});
```

### Fuzz Test

**What it tests:** Random/semi-random inputs to find crashes, panics, undefined behavior.  
**When to use:** Parsers, serializers, input handlers, codecs, anything that accepts untrusted input.  
**Speed:** Variable (runs many iterations).  
**Frameworks:** Go `testing.F`, AFL, libFuzzer, Foundry `forge test --fuzz-runs`

```solidity
// Example: Foundry fuzz test for a token transfer
function testFuzz_transfer(address to, uint256 amount) public {
    vm.assume(to != address(0));
    vm.assume(amount <= token.balanceOf(address(this)));

    uint256 preBal = token.balanceOf(to);
    token.transfer(to, amount);
    assertEq(token.balanceOf(to), preBal + amount);
}
```

### Invariant Test

**What it tests:** Conditions that must ALWAYS hold true regardless of input sequence.  
**When to use:** Smart contracts (total supply == sum of balances), financial systems, state machines.  
**Speed:** Variable (explores many call sequences).  
**Frameworks:** Foundry invariant testing, Echidna, Hypothesis (stateful)

```solidity
// Example: ERC-20 invariant — total supply equals sum of all balances
function invariant_totalSupplyMatchesBalances() public {
    uint256 sum;
    for (uint256 i = 0; i < actors.length; i++) {
        sum += token.balanceOf(actors[i]);
    }
    assertEq(token.totalSupply(), sum);
}
```

### Property-Based Test

**What it tests:** Properties/laws that hold over generated inputs rather than specific cases.  
**When to use:** Encoding/decoding roundtrips, algebraic laws, commutative operations.  
**Speed:** Seconds (many generated cases).  
**Frameworks:** fast-check, Hypothesis, QuickCheck, jqwik

```typescript
// Example: encode/decode roundtrip
import fc from "fast-check";

test("JSON roundtrip preserves data", () => {
  fc.assert(
    fc.property(fc.jsonValue(), (value) => {
      expect(JSON.parse(JSON.stringify(value))).toEqual(value);
    })
  );
});
```

### Event Trigger Test

**What it tests:** Specific actions trigger expected events or side effects (emitted events, webhook calls, state transitions).  
**When to use:** Event-driven systems, smart contracts, pub/sub architectures, webhook integrations.  
**Speed:** Milliseconds to seconds.  
**Frameworks:** Foundry `vm.expectEmit`, Jest event spies, pytest signals

```solidity
// Example: verify Transfer event is emitted
function test_transferEmitsEvent() public {
    vm.expectEmit(true, true, false, true);
    emit Transfer(alice, bob, 100);
    token.transfer(bob, 100);
}
```

```typescript
// Example: verify event emitter fires
test("order service emits 'orderCreated' event", () => {
  const handler = jest.fn();
  orderService.on("orderCreated", handler);
  orderService.createOrder({ item: "widget", qty: 1 });
  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({ item: "widget" })
  );
});
```

## Test Sizing (Resource Model)

| Size   | Constraints                        | Speed     | Example                          |
| ------ | ---------------------------------- | --------- | -------------------------------- |
| Small  | Single process, no I/O             | < 100 ms  | Unit test for a math function    |
| Medium | Multi-process, localhost only       | < 10 s    | API test with local database     |
| Large  | Multi-machine, external services   | < 5 min   | E2E test against staging cluster |

Prefer small. Promote to medium only when small cannot cover it. Use large sparingly.

## The Prove-It Pattern (Bug Fixes)

Every bug fix must follow this sequence:

1. **Bug report** — reproduce the problem manually or from a report
2. **Write reproduction test** — encode the exact failure as a test
3. **Test FAILS** — confirms the bug exists (if it passes, you misunderstand the bug)
4. **Implement fix** — minimal change to address root cause
5. **Test PASSES** — proves the fix works
6. **Run full suite** — no regressions introduced

Never skip step 3. A test that never failed proves nothing.

## Writing Good Tests

### Test State, Not Interactions

Assert outcomes, not method calls. Check what changed, not how it changed.

```typescript
// Bad: testing interactions
expect(mockDb.save).toHaveBeenCalledWith(user);

// Good: testing state
const saved = await db.users.findOne({ id: user.id });
expect(saved.name).toBe("Alice");
```

### DAMP over DRY

Each test tells a complete story. Duplication in tests is acceptable if it improves readability. A reader should understand a test without jumping to helpers.

### Real Implementations over Mocks

Preference order: **real > fake > stub > mock**

Mocks couple tests to implementation. Use real implementations when feasible, in-memory fakes when not, stubs for external services, mocks only as last resort.

### Arrange-Act-Assert

```typescript
test("withdraw reduces balance", () => {
  // Arrange
  const account = new Account(100);

  // Act
  account.withdraw(30);

  // Assert
  expect(account.balance).toBe(70);
});
```

### One Assertion per Concept

Multiple `expect` calls are fine if they verify the same concept. Do not test unrelated behaviors in one test.

### Descriptive Test Names

Test names read like specifications:

```text
"transfer reverts when sender has insufficient balance"
"discount returns 0 for 100% discount"
"parser throws on malformed input"
```

## Beyonce Rule

> "If you liked it, you should have put a test on it."

Your tests are your safety net. Infrastructure changes, refactors, and dependency updates will not catch your bugs. If a behavior matters, it must have a test. No exceptions.

## Test Strategy Design (for /test:plan)

When analyzing a codebase to produce a test plan:

1. **Identify the test framework** — check existing config (`jest.config`, `vitest.config`, `foundry.toml`, `pytest.ini`). Match the project's existing choices.
2. **Map components to test types** — pure logic gets unit tests, boundaries get integration tests, critical flows get E2E.
3. **Extract behaviors from artifacts** — read specs, READMEs, issue descriptions, function signatures. Each behavior is a test candidate.
4. **Identify edge cases** — zero values, empty inputs, max values, concurrent access, error paths, permission boundaries.
5. **Determine coverage targets** — aim for high coverage on critical paths. 100% line coverage is not the goal; 100% behavior coverage is.
6. **Decide on advanced test types** — add fuzz tests for input handlers, invariant tests for stateful systems, property-based tests for algebraic operations, event trigger tests for event-driven code.

## Anti-Patterns

| Anti-Pattern                 | Problem                                          | Fix                                                  |
| ---------------------------- | ------------------------------------------------ | ---------------------------------------------------- |
| Flaky tests                  | Non-deterministic; erode trust in the suite       | Remove time-dependence, fix shared state, use retries only as last resort |
| Snapshot abuse               | Tests pass without anyone reviewing changes       | Use targeted assertions; snapshots only for large stable outputs |
| Mock everything              | Tests pass but production breaks                  | Prefer real implementations; mock only external services |
| Testing framework code       | Tests verify library behavior, not your code       | Test your logic, not that Jest/Vitest works           |
| No test isolation            | Tests depend on execution order or shared state    | Each test sets up and tears down its own state        |
| Testing implementation details | Refactors break tests without behavior change   | Assert on public API and observable outcomes          |

## Anti-Rationalization Table

| Excuse                              | Reality                                                              |
| ----------------------------------- | -------------------------------------------------------------------- |
| "It's too simple to test"           | Simple code gets refactored into complex code. Test it now.          |
| "I'll add tests later"              | Later never comes. Write the test before or with the code.           |
| "Tests slow me down"                | Tests slow you down once. Bugs slow you down forever.                |
| "It works on my machine"            | That is not a test. Write one that proves it.                        |
| "The code is self-documenting"      | Documentation does not catch regressions. Tests do.                  |
| "We have QA for that"               | QA finds bugs after you wrote them. Tests prevent them.              |
| "100% coverage means no bugs"       | Coverage measures lines executed, not behaviors verified. Think harder. |

## Red Flags

- Test suite takes > 10 minutes for unit tests (too many large tests, not enough small)
- Tests break on every refactor (testing implementation, not behavior)
- Team skips tests for "trivial" changes (Beyonce Rule violation)
- Fuzz/invariant tests never added to stateful or parser code
- No reproduction test accompanies a bug fix (Prove-It Pattern violation)
- Mocks outnumber real implementations in the test suite
- Test names are `test1`, `test2`, `testFoo` (unreadable specifications)

## Verification Checklist

Before considering tests complete:

- Every new behavior has at least one test
- Every bug fix has a reproduction test that failed before the fix
- Tests run in isolation (no shared mutable state between tests)
- Test names describe the expected behavior
- No flaky tests introduced (run suite 3x if uncertain)
- Appropriate test level chosen (unit > integration > E2E)
- Edge cases covered (null, zero, empty, max, error paths)
- Fuzz/invariant/property tests added for critical stateful or input-handling code
- Full test suite passes with no regressions
