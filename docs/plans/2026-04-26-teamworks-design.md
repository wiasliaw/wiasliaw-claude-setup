# teamworks Plugin Design

- Date: 2026-04-26
- Status: Design (pre-implementation)
- Plugin: `teamworks`

## Problem

Cross-repo work in Claude Code today forces a single agent to juggle the
context of many repos at once, which is slow, lossy, and hard to reason
about. We want a plugin that:

- Treats a folder as a workspace holding several independent git repos.
- Spawns one agent per repo so each owns its own context.
- Coordinates them through an explicit team-lead so the user has one
  conversational entry point.
- Uses Claude Code's Team feature (`TeamCreate`, `SendMessage`) instead of
  nested sub-agents at the outer level, so each agent has a clean window.

The plugin is bounded to repos inside the workspace folder. No
organisation-wide scanning, no cross-workspace sharing.

## Use Cases

The plugin should support all four:

1. Coordinated cross-repo development (e.g. ABI change rolls into indexer
   and frontend).
2. Multi-repo audits / completeness reviews scoped to repos in the folder.
3. Whole-system feature planning where each repo evaluates its own impact.
4. Periodic re-evaluation when one repo changes (manual trigger).

## Architecture

Three-layer agent topology:

```text
user outer session (in meta-folder)
  - No Task at this level; only Team operations.
  - 7 slash commands forward requests to team-lead.
    |
    | SendMessage (per command)
    v
team-lead (Team agent, per-command spawn)
  - Single writer of .teamworks/{project,topology}.md.
  - Dispatches in parallel to repo-managers.
  - May spawn specialty agents registered under
    $project/.claude/agents/.
  - May use Task internally for narrow research.
    |
    | SendMessage (parallel)
    v
repo-manager x N (per-command spawn, one per repo)
  - Owns its repo entirely (read + write).
  - Runs SDD (openspec) and TDD inside the repo.
  - May SendMessage other managers directly.
  - May use Task internally to keep its context clean.
  - Never reads or writes another repo's files.
  - Never runs git commit / push.
```

### Meta-folder layout

```text
my-project/                      # not a git repo; pure workspace
  .claude/
    agents/                      # team-lead.md, repo-manager.md (plugin-bundled)
                                 # plus specialty agents added via /add-agent
  .teamworks/
    project.md                   # mission, decisions, settings (e.g. max-retries)
    topology.md                  # ASCII art + edge table (single source)
    repos/
      <name>.md                  # per-repo identity card (static + current role)
    log/
      YYYY-MM-DD.md              # append-only agent interaction log
  token-contract/                # independent git repos
  indexer/
  frontend/
```

### Agent lifecycle

- **Per-command spawn**: every slash command spawns the agents it needs
  and tears them down at the end of the command.
- **Persistent within a command**: agents stay alive across multiple
  SendMessage round-trips and retry loops within the same command. They
  are not spawned per dispatch.
- **No cross-command persistence**: state lives in `.teamworks/` files,
  not in agent memory.

### Concurrency

- team-lead dispatches to managers in parallel using parallel
  `SendMessage` tool calls.
- File-write contention is avoided by single-writer rules:
  - Each manager writes only inside its own repo and its own
    `.teamworks/repos/<self>.md`.
  - Only team-lead writes `.teamworks/project.md` and
    `.teamworks/topology.md`.
  - `log/` is append-only; each agent prefixes its own entries with
    timestamp and self-identification.

## Slash Commands

Seven commands, all run in the user's outer session.

| Command | Args | Outer-session work | team-lead work |
| --- | --- | --- | --- |
| `/teamworks:init` | none | Create `.teamworks/` skeleton (empty `project.md`, `topology.md`, `repos/`, `log/`). | Not spawned. |
| `/teamworks:add-repo` | `<path>` | Spawn team-lead, forward request. | Read target repo (read-only), produce `repos/<name>.md`, update `topology.md`, optionally update `project.md`, report back. |
| `/teamworks:add-agent` | `<role>` `[brief]` | Spawn team-lead. | Write a specialty agent definition to `$project/.claude/agents/<role>.md` (YAML frontmatter + system prompt) and register it in `project.md`. |
| `/teamworks:explore` | `<question>` | Spawn team-lead. | Dispatch relevant managers in parallel, synthesise, answer the user. Read-only against `.teamworks/`; only `log/` is touched. |
| `/teamworks:propose` | `<description>` | Spawn team-lead. | Dispatch managers to run openspec inside their repos, self-approve their specs, write a `mission` block (with `mission-id`) into `project.md`, and update `topology.md` if interfaces change. |
| `/teamworks:apply` | `<mission-id>` | Spawn team-lead. | Dispatch managers to run TDD per the approved mission. No commit. On failure, retry up to 3 times with new angle; otherwise report the partial state. |
| `/teamworks:shutdown` | none | Reap stray Team agents, append today's `log/` summary, append a session summary to `project.md` if needed. | Not spawned. |

Design choices behind the catalogue:

- `init` is pure file bootstrap; no agent tokens spent for first-time use.
- `apply` accepts only a `mission-id`, forcing `propose -> apply`
  traceability.
- `add-agent` only registers; the specialty agent is spawned later when
  team-lead deems it relevant during `propose` / `apply` / `explore`.
- `shutdown` does not delete `.teamworks/`; it is a session close, not an
  uninit.

## Agents

### Built-in: `team-lead`

Shipped at `plugins/teamworks/agents/team-lead.md`.

```yaml
---
name: team-lead
description: Cross-repo orchestrator. Reads .teamworks/, dispatches to repo-managers in parallel via SendMessage, owns project.md / topology.md / log/. Self-approves repo-manager specs, retries failures up to 3 times before escalating.
tools: Read, Edit, Write, Bash, SendMessage, TeamCreate, Task
model: sonnet
---
```

System prompt highlights (full text in the agent body):

- Read scope: `.teamworks/**` and every repo (read-only sanity checks).
- Write scope: `.teamworks/**` only. Never edit a repo's files.
- Bash scope: read-only commands such as `ls`, `git log`, `gh pr list`.
  No git write operations.
- Dispatch protocol: structured SendMessage payload (see Data Formats).
- Retry policy: up to 3 retries per failed manager response; before each
  retry, must articulate a new angle, otherwise stop and report.
- Approval policy: self-approves repo-manager specs and cross-repo
  missions; the user does not gate `propose -> apply`.

### Built-in: `repo-manager`

Shipped at `plugins/teamworks/agents/repo-manager.md`.

```yaml
---
name: repo-manager
description: Single-repo owner spawned with cwd set to one repo. Runs SDD (openspec) and TDD inside that repo. Reports to team-lead via SendMessage. Cannot read or modify other repos.
tools: Read, Edit, Write, Bash, SendMessage, Task
model: sonnet
---
```

System prompt highlights:

- Read / Write scope: own repo, plus `.teamworks/repos/<self>.md` (the
  only meta file the manager may edit).
- Bash cwd is the own repo root; no `git commit` or `git push`.
- SDD: run openspec inside the repo; spec artifacts live in the repo's
  own spec structure.
- TDD: red, green, refactor; tests must precede production code.
- Cross-repo info: ask via SendMessage (team-lead or another manager);
  never read another repo's files directly.
- Onboarding: read `.teamworks/repos/<self>.md` and the dispatch payload;
  no other discovery is required.

### Specialty agents (user-defined)

Created by `/teamworks:add-agent`, written to
`$project/.claude/agents/<role>.md`. Typical roles: `security-reviewer`,
`qa`, `api-designer`, `perf-analyst`. Project-scoped (cross-repo); team-lead
spawns them on demand during `propose` / `apply` / `explore`.

## Data Formats

### SendMessage payload (team-lead -> repo-manager)

```markdown
## Mission
<mission-id>: <one-line summary>

## Phase
propose | apply | explore | onboard

## Repo Context
<paste contents of .teamworks/repos/<this>.md>

## Cross-repo Constraints
<relevant slice of topology.md, e.g. "Your ABI is consumed by indexer.">

## Task
<concrete instruction>

## Expected Reply
- artifact-paths: [<files-or-dirs>]
- summary: <bullets>
- blockers: <if any>
```

### SendMessage reply (repo-manager -> team-lead)

```markdown
## Status
done | partial | blocked

## Artifacts
- <path>: <one-line description>

## Summary
- <bullets>

## Blockers
- <if status != done>

## Next-step suggestion (optional)
- <manager's suggestion>
```

### Cross-manager SendMessage

Allowed. No team-lead routing required. Both sender and receiver append
their own log entry; team-lead reconstructs the conversation from the log
when synthesising.

### Log entry format

`log/YYYY-MM-DD.md` is append-only. Each line:

```text
[HH:MM] [<from> -> <to>] <one-line summary>
```

Each agent (team-lead and every manager) is responsible for appending its
own outgoing and incoming entries. Self-identification + monotonic
timestamps make races tolerable.

### `topology.md` format

```markdown
# Topology

## Diagram

    +------------------+
    |  token-contract  | (Solidity / Foundry)
    |  exports: ABI    |
    +--------+---------+
             |
             | ABI consumed by
             v
    +------------------+         +------------------+
    |     indexer      | ------> |     frontend     |
    |  (Node / Ponder) |  REST   |  (Next.js)       |
    +------------------+         +------------------+

## Edges

| From | To | Kind | Notes |
| --- | --- | --- | --- |
| token-contract | indexer | ABI | regenerate on contract change |
| token-contract | frontend | ABI (typed) | shared types via wagmi codegen |
| indexer | frontend | REST | OpenAPI spec at indexer/openapi.yaml |

## Shared Interfaces
- ABI: token-contract/out/Token.sol/Token.json
- REST: indexer/openapi.yaml
```

Both diagram and edge table are kept. Diagram for human glance; edge
table for agent parsing. team-lead is the single writer; any mission that
touches an interface updates both.

## Key Behaviours

### `propose`

1. team-lead reads `.teamworks/{project,topology}.md` and every
   `repos/<name>.md`.
2. team-lead identifies affected repos.
3. team-lead dispatches in parallel: each affected manager runs openspec
   inside its repo and replies with the spec path and a summary.
4. team-lead reviews and self-approves each repo spec.
5. team-lead writes a new `mission` block to `project.md` with a
   `mission-id`, marks it `approved`, and updates `topology.md` if
   interfaces change.
6. team-lead reports the mission to the user. No user gate.

### `apply`

1. team-lead loads the approved mission from `project.md`. If the mission
   is not `approved`, refuse.
2. team-lead dispatches managers in parallel to execute TDD per the
   mission spec. Managers do not commit.
3. On manager failure, team-lead analyses the report, formulates new
   guidance, and re-dispatches. Stops at the earliest of:
   - 3 retries on the same manager, or
   - team-lead self-judgement that no new angle remains.
4. On stop, team-lead reports per-repo status (which files changed, which
   tests pass / fail, which managers blocked) and hands the working tree
   to the user. The user owns commit / push.
5. team-lead marks the mission `applied` in `project.md` only if every
   manager reported `done`. Otherwise the mission stays `approved` and
   the user can re-run `apply` after intervention.

### `explore`

1. team-lead reads `.teamworks/` plus the user's question.
2. team-lead dispatches managers in parallel for read-only investigation.
3. team-lead synthesises and answers. No edits to `project.md`,
   `topology.md`, or `repos/<name>.md`. Only `log/` is appended.

### `add-repo`

1. team-lead reads the target repo (read-only) and any signals (README,
   `package.json`, etc.) to draft the identity card.
2. team-lead may ask the user one or two clarification questions about
   purpose and role.
3. team-lead writes `.teamworks/repos/<name>.md`, updates
   `.teamworks/topology.md`, and optionally appends to `project.md`.

### `shutdown`

1. Outer session enumerates live Team agents associated with this
   workspace and tears them down.
2. Outer session appends a one-line summary to today's `log/` if any
   activity is unrecorded.
3. Outer session appends a session summary to `project.md` if the latest
   mission lacks one.
4. `.teamworks/` is preserved.

## Out of Scope (YAGNI)

The following are explicitly not part of MVP:

1. Any git operation (commit, push, branch, PR creation, PR description
   generation). The user owns git.
2. Cross-command persistent agents. Within a command, agents are
   persistent; across commands they are not.
3. Automatic topology inference. team-lead updates `topology.md` from
   what it reads and what managers report; no static analysis of
   imports / ABI / proto.
4. Mission state beyond `approved` / `applied`. No `in-review`,
   `partial`, `rolled-back`, etc.
5. Resuming a single mission across `apply` invocations. After failure,
   the user patches and re-runs `apply`, or opens a new mission.
6. Concurrent slash commands. Behaviour is undefined if the user runs
   two commands at once; `shutdown` is recovery, not concurrency
   control.
7. Cross-workspace sharing. A meta-folder is a closed world.
8. User-as-team-lead shortcut. Default is agent team-lead; users who
   want to drive directly should not use this plugin.
9. Hook-based enforcement that the outer session cannot use Task. The
   constraint is documented in the plugin's commands; we do not block
   user-initiated Task calls.

## Future Work

- `/teamworks:status` for a cheap read-only dashboard.
- Mission archive (move completed missions to
  `.teamworks/missions/archive/`).
- Topology export to mermaid / graphviz for external docs.
- Multiple team-lead style presets (strict-SDD, fast-prototype, etc.).

## Plugin Layout (preview, for implementation)

```text
plugins/teamworks/
  .claude-plugin/
    plugin.json
  agents/
    team-lead.md
    repo-manager.md
  commands/
    init.md
    add-repo.md
    add-agent.md
    explore.md
    propose.md
    apply.md
    shutdown.md
  README.md
```

The marketplace entry will be added to `.claude-plugin/marketplace.json`,
sorted alphabetically with `autoresearch`.
