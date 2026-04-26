# Teamworks Plugin

Cross-repo orchestration for Claude Code. Coordinates spec-driven and
test-driven work across multiple independent git repositories from a
single workspace folder, using a per-command team of agents that read
shared state from `.teamworks/` and dispatch managers in parallel.

## Architecture

Three-layer agent topology: the user's outer session forwards each
slash command to a freshly spawned `team-lead`, which dispatches one
`repo-manager` per affected repo in parallel. Agents are spawned per
command and torn down at the end; durable state lives in
`.teamworks/`, not in agent memory.

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

## Commands

| Command | What it does |
|---------|-------------|
| `/teamworks:init` | Bootstrap the `.teamworks/` skeleton in the current workspace folder. Pure file creation; does not spawn `team-lead`. |
| `/teamworks:add-repo` | Register a new repo. Spawns `team-lead`, which writes `.teamworks/repos/<name>.md` and updates `topology.md`. |
| `/teamworks:add-agent` | Register a project-scoped specialty agent (e.g. `security-reviewer`, `qa`) under `.claude/agents/` and record it in `project.md`. |
| `/teamworks:explore` | Ask `team-lead` a question. Read-only against `.teamworks/`; dispatches managers in parallel for investigation. |
| `/teamworks:propose` | Run cross-repo SDD via OpenSpec. `team-lead` dispatches managers, self-approves their specs, allocates a `mission-id`, appends a row to the `## Missions` table in `project.md`, and writes the full mission body to `.teamworks/missions/<mission-id>.md`. |
| `/teamworks:apply` | Execute an approved mission. Managers run TDD per their approved spec; no commits. Retries up to 3 times on failure with a new angle. |
| `/teamworks:shutdown` | Reap stray Team agents, append today's `log/` summary, and append a session summary to `project.md` if needed. Preserves `.teamworks/`. |

## Agents

| Agent | Role |
|-------|------|
| `team-lead` | Cross-repo orchestrator. Reads `.teamworks/`, dispatches to `repo-manager`s in parallel via `SendMessage`. Single writer of `project.md` / `topology.md` / `log/`. Self-approves repo specs and retries failures up to 3 times before escalating. |
| `repo-manager` | Single-repo owner spawned with cwd set to one repo. Runs SDD (OpenSpec) and TDD inside that repo. Reports to `team-lead` via `SendMessage`. Cannot read or modify other repos; never runs `git commit` / `git push`. |

## Workspace Layout

```text
my-project/                      # not a git repo; pure workspace
  .claude/
    agents/                      # team-lead.md, repo-manager.md (plugin-bundled)
                                 # plus specialty agents added via /add-agent
  .teamworks/
    project.md                   # workspace mission, settings, ## Missions index table
    topology.md                  # ASCII art + edge table (single source)
    repos/
      <name>.md                  # per-repo identity card (static + current role)
    missions/
      <mission-id>.md            # one detail file per mission (full body, specs, applied-summary)
    log/
      YYYY-MM-DD.md              # append-only agent interaction log
  token-contract/                # independent git repos
  indexer/
  frontend/
```

## External Dependencies

- **[OpenSpec CLI](https://github.com/Fission-AI/OpenSpec)** — invoked
  by `repo-manager` inside each affected repo during `/teamworks:propose`
  to author and persist spec artifacts. If `openspec` is missing in a
  repo, `team-lead` surfaces it as an immediate setup blocker rather
  than retrying.

For the full cross-repo design rationale (concurrency model,
single-writer rules, retry policy, agent lifecycle), see the design
doc linked below.

## Installation

```bash
/plugin marketplace add wiasliaw/wiasliaw-claude-setup
/plugin install teamworks@wiasliaw-claude-plugins
```

## Design Doc

See [`docs/plans/2026-04-26-teamworks-design.md`](../../docs/plans/2026-04-26-teamworks-design.md)
for the full architecture, data formats, and design decisions.
