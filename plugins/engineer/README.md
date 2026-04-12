# Engineer Plugin

General-purpose software engineering best practices for Claude Code — covering the full development lifecycle from spec to ship.

## Architecture

- **Skills** = Pure knowledge. Best practices and methodologies, no action logic.
- **Commands** = Action entry points. Spawn an agent, load skill(s), execute tasks.

A command can compose multiple skills; a skill can be reused across commands.

## Commands

| Command | What it does |
|---------|-------------|
| `/spec:init` | Initialize OpenSpec in the project |
| `/spec:propose` | Generate spec artifacts (proposal, specs, design, tasks) |
| `/plan` | Produce bite-sized implementation plan from spec artifacts |
| `/build` | Execute plan step by step (implement → test → verify → commit) |
| `/test:plan` | Analyze codebase and design test strategy |
| `/test:run` | Write and execute tests per strategy |
| `/review:self` | Self-review changes with five-axis review |
| `/review:pr` | Review a PR with severity-labeled findings |
| `/code-simplify` | Simplify code without changing behavior |

## Workflow

```
  DEFINE          PLAN           BUILD          TEST           REVIEW         SIMPLIFY
 ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐
 │ Spec │ ───▶ │ Plan │ ───▶ │Build │ ───▶ │ Test │ ───▶ │Review│ ───▶ │Simpli│
 │ Init │      │      │      │      │      │ Plan │      │ Self │      │  fy  │
 │Propose│     │      │      │      │      │ Run  │      │  PR  │      │      │
 └──────┘      └──────┘      └──────┘      └──────┘      └──────┘      └──────┘
```

## Skills

| Skill | Covers |
|-------|--------|
| openspec-workflow | OpenSpec CLI usage, artifact structure, config |
| planning-and-task-breakdown | Dependency analysis, vertical slicing, TDD task format |
| incremental-implementation | Increment cycle, scope discipline, source-driven development |
| test-engineering | Test pyramid, test types (unit/fuzz/invariant/etc.), Prove-It pattern |
| code-review-and-quality | Five-axis review, severity labels, change sizing |
| code-simplification | Chesterton's Fence, five principles, incremental simplification |

## External Dependencies

- **[OpenSpec CLI](https://github.com/Fission-AI/OpenSpec)** — `/spec:init` and `/spec:propose` use this for spec artifact management
- **[Superpowers plugin](https://github.com/nichochar/claude-superpowers)** — `/plan` output integrates with `executing-plans` and `subagent-driven-development`

## Installation

```
/plugin marketplace add wiasliaw/wiasliaw-claude-setup
/plugin install engineer@wiasliaw-claude-plugins
```
