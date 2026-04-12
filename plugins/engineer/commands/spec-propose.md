---
allowed-tools: Bash, Read, Write, Glob, Grep, WebFetch, WebSearch
description: Create a new OpenSpec change — generate proposal, specs, design, and tasks artifacts via /opsx:propose
---

# Spec Propose

Announce: "Using engineer:spec-propose to create spec artifacts."

## Load Skill

Read `skills/openspec-workflow/SKILL.md` for reference knowledge on OpenSpec conventions and artifact structure.

## Check Prerequisites

Verify OpenSpec is initialized by checking for an `openspec/` directory in the project root.

- If `openspec/` does not exist, tell the user: "OpenSpec is not initialized. Run `/spec:init` first." Then stop.

## Gather Input

- If `$ARGUMENTS` is provided, use it as the change description.
- If `$ARGUMENTS` is empty, ask the user what they want to build.
- Recommend: "If your idea is still rough, consider running superpowers brainstorming first to clarify."

## Execute OpenSpec Propose

Run OpenSpec propose via Bash:

```bash
openspec propose "<change-description>"
```

Where `<change-description>` is the resolved input from the user or `$ARGUMENTS`.

OpenSpec will generate the following artifacts under `openspec/changes/<change-name>/`:

- `proposal.md` — change proposal with objective, scope, and boundaries
- `specs/` — detailed specifications
- `design.md` — technical design
- `tasks.md` — implementation tasks

Wait for generation to complete before proceeding.

## Review Artifacts

After generation, read each artifact and walk the user through them:

1. **Proposal** — summarize the objective and scope; flag anything vague
2. **Specs** — check completeness and consistency
3. **Design** — verify technical feasibility and alignment with specs
4. **Tasks** — confirm tasks cover the full scope and are actionable

Help the user refine artifacts if needed — suggest edits, flag gaps, highlight contradictions.

## Verify

Run a final check on the generated artifacts:

1. All four artifact types exist (`proposal.md`, `specs/`, `design.md`, `tasks.md`)
2. Proposal has a clear objective and boundaries
3. Success criteria are specific and testable
4. "Not Doing" list is present in the proposal

If any check fails, point it out and help the user fix it before finishing.
