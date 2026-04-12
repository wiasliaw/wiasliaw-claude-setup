---
name: openspec-workflow
description: Knowledge for using OpenSpec CLI to produce structured spec artifacts. Loaded by /spec:init and /spec:propose commands.
---

# OpenSpec Workflow Knowledge

Pure knowledge document for the OpenSpec artifact-guided workflow. This file contains no action logic or slash command behavior — it is reference material loaded by `/spec:init` and `/spec:propose`.

## Core Concepts

OpenSpec is an **artifact-guided** workflow for planning software changes. It is fluid, not rigid — there are no phase gates. You move between artifacts as understanding deepens.

### The Four Artifacts

| Artifact     | Purpose   | Key Question |
|-------------|-----------|--------------|
| **Proposal** | Why       | What problem are we solving and why does it matter? |
| **Specs**    | What      | What are the requirements, scenarios, and success criteria? |
| **Design**   | How       | What is the technical approach, architecture, and trade-offs? |
| **Tasks**    | Do what   | What is the implementation checklist, ordered and actionable? |

Each artifact has a distinct role:

- **Proposal** — captures motivation, scope, boundaries, and success criteria. Answers "why this change?" and "what's in/out of scope?"
- **Specs** — captures requirements, user scenarios, edge cases, and acceptance conditions. Answers "what exactly must be true when this is done?"
- **Design** — captures technical approach, component interactions, data flow, and trade-offs. Answers "how will we build this?"
- **Tasks** — captures an ordered implementation checklist with clear done criteria. Answers "what do we do, step by step?"

## CLI Operations

**Prerequisite:** Node.js >= 20.19.0

### Commands

```bash
# Initialize a new OpenSpec project — creates the openspec/ directory
openspec init

# Refresh agent instructions after upgrading OpenSpec
openspec update

# Switch between workflow profiles (core vs expanded)
openspec config profile
```

- `openspec init` — run once at the project root. Creates `openspec/` with default config and agent instructions.
- `openspec update` — run after upgrading the OpenSpec package to sync agent instructions.
- `openspec config profile` — toggle between `core` (minimal artifacts) and `expanded` (full four-artifact workflow).

## Project Configuration

Configuration lives in `openspec/config.yaml`.

### Structure

```yaml
# Default schema for new changes
schema: spec-driven

# Project context injected into all artifact instructions
context: |
  Tech stack: TypeScript, React, PostgreSQL
  Testing: Vitest + Playwright
  Conventions: Conventional Commits, 2-space indent
  CI: GitHub Actions

# Per-artifact rules keyed by artifact ID
rules:
  proposal:
    - Always include a "Not Doing" section
    - Reference related past changes if they exist
  specs:
    - Include at least 3 acceptance scenarios
    - Cover error/edge cases explicitly
  design:
    - Justify technology choices
    - Include a data flow diagram when adding new endpoints
  tasks:
    - Each task must be independently verifiable
    - Estimate complexity as S/M/L
```

### Key Fields

| Field     | Description |
|-----------|-------------|
| `schema`  | Default schema applied to new changes (e.g., `spec-driven`) |
| `context` | Free-text project context injected into every artifact prompt. Include tech stack, conventions, testing setup, and anything the AI needs to produce relevant output. |
| `rules`   | Per-artifact rules keyed by artifact ID (`proposal`, `specs`, `design`, `tasks`). Each is a list of strings applied when generating that artifact. |

**Important:** Not setting up `context` leads to generic, less useful AI output. Always populate it with your project's specifics.

## OPSX Commands Reference

| Command          | Purpose |
|-----------------|---------|
| `/opsx:propose`  | Create a change and generate planning artifacts (proposal, specs, design, tasks). This is the primary command. |
| `/opsx:apply`    | Implement tasks from the current change's task list. |
| `/opsx:verify`   | Validate implementation against specs and design artifacts. |
| `/opsx:archive`  | Archive a completed change for historical reference. |
| `/opsx:explore`  | Freeform exploration and brainstorming. Note: user prefers the superpowers brainstorming skill for this use case. |

### Typical Flow

```text
/opsx:propose  -->  iterate on artifacts  -->  /opsx:apply  -->  /opsx:verify  -->  /opsx:archive
```

The flow is not linear. You can revisit any artifact at any time as understanding evolves.

## Writing Good Proposals

A good proposal is the foundation of the entire workflow. Weak proposals produce weak specs, designs, and tasks.

### Essential Elements

1. **Clear objective** — state what AND why, not just what. "Add caching" is weak. "Add Redis caching to reduce API response times from 800ms to <200ms for repeated queries" is strong.

2. **Explicit boundaries** — define what's in scope AND what's NOT in scope. Ambiguity here cascades through every downstream artifact.

3. **Success criteria** — specific, testable conditions that determine when the change is done. "Works correctly" is not a success criterion. "All existing tests pass and new endpoints return <200ms p95 latency" is.

4. **Not Doing list** — make trade-offs explicit. What related work are you deliberately deferring? This prevents scope creep and sets expectations.

5. **Affected areas and risks** — identify what parts of the system this change touches and what could go wrong.

### Proposal Template Outline

```markdown
## Objective
What we're doing and why it matters.

## In Scope
- Item A
- Item B

## Not Doing
- Deferred item X (reason)
- Out of scope item Y (reason)

## Success Criteria
- [ ] Criterion 1 (measurable)
- [ ] Criterion 2 (testable)

## Affected Areas
- Module/service A — how it's affected
- Module/service B — how it's affected

## Risks
- Risk 1 — mitigation strategy
```

## Common Pitfalls

| Pitfall | Why It Matters | Fix |
|---------|---------------|-----|
| Vague specs without success criteria | No way to know when you're done | Add specific, testable acceptance conditions |
| Missing constraints | AI generates impractical solutions | Specify tech stack, performance targets, compatibility requirements in `config.yaml` context |
| Skipping the "Not Doing" list | Scope creep, misaligned expectations | Explicitly list what you're deferring and why |
| Over-specifying implementation in proposal | Proposal is "why/what", not "how" — that's design's job | Move implementation details to the design artifact |
| Not setting up `config.yaml` context | AI lacks project context, produces generic output | Populate context with tech stack, conventions, testing setup |
| Treating artifacts as sequential gates | Workflow is fluid; rigid phases slow you down | Revisit any artifact as understanding evolves |

## Anti-Rationalization Table

Excuses you'll hear (or tell yourself) and why they don't hold up.

| Excuse | Reality Check |
|--------|--------------|
| "This is simple, no spec needed" | Simple tasks still need success criteria. "Simple" changes cause the most subtle bugs when undefined. |
| "I'll figure it out as I code" | You'll figure out the wrong thing and refactor twice. 10 minutes of spec saves hours of rework. |
| "The spec is in my head" | Specs in your head can't be reviewed, challenged, or referenced later. Write it down. |
| "We don't have time for specs" | You don't have time to NOT write specs. Unspecified work takes longer and ships with more bugs. |
| "The requirements are obvious" | If they're obvious, writing them down takes 5 minutes. If they're not (they never are), you just saved yourself. |
| "This is just a refactor" | Refactors need clear boundaries and success criteria more than new features. What stays the same matters as much as what changes. |
| "I'll add specs after I prototype" | Prototypes without specs become production code without specs. Write the proposal first, prototype within its boundaries. |
| "The ticket/issue already describes it" | Tickets describe symptoms. Proposals describe solutions, boundaries, and acceptance criteria. They're different documents. |

## Verification Checklist

Use this checklist to confirm the OpenSpec workflow was applied correctly for a change.

- `openspec/config.yaml` has `context` populated with project-specific information
- Proposal includes a clear objective (what AND why)
- Proposal includes explicit scope boundaries (in scope AND not doing)
- Proposal includes specific, testable success criteria
- Specs cover requirements, scenarios, and edge cases
- Design captures technical approach and trade-offs (not in proposal)
- Tasks are ordered, actionable, and independently verifiable
- Artifacts are consistent with each other (no contradictions between proposal and specs)
- Per-artifact rules in `config.yaml` are respected in generated output
