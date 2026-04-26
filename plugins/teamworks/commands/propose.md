---
allowed-tools: Bash, Read, SendMessage, TeamCreate, TeamDelete
description: Run cross-repo SDD via openspec. Team-lead dispatches managers, self-approves their specs, writes a mission block to project.md, and updates topology.md if interfaces change.
---

Announce: "Using teamworks:propose to draft a cross-repo mission: <description>."

The slash command syntax is `/teamworks:propose <description>`. The
`<description>` argument is required and may be free-form prose
describing the cross-repo change. `propose` allocates a new
`mission-id` and writes the mission block to `.teamworks/project.md`;
no user gate sits between `propose` and `apply`.

## Step 0: Confirm working directory

Run `pwd` and confirm with the user that the current directory is the
intended workspace root (the folder containing `.teamworks/`). If
unsure, stop and ask.

```bash
pwd
```

## Step 1: Announce

Print the announce line above, substituting the actual `<description>`
the user supplied. If the description is long, you may truncate it for
the announce line — but pass the full text verbatim to team-lead in
Step 4.

## Step 2: Validate `.teamworks/` exists

The current working directory must be the workspace root containing
`.teamworks/`. Check with:

```bash
[ -d .teamworks ] && echo ok || echo missing
```

If the directory is missing, stop and tell the user to run
`/teamworks:init` first. Do not proceed.

## Step 3: Validate `<description>`

If the user did not supply a `<description>`, ask for one and stop
until they reply. Do not invent a description on the user's behalf and
do not proceed to spawn team-lead with an empty payload.

## Step 4: Spawn team-lead and dispatch (Phase: propose)

Use `TeamCreate` to spawn the bundled `team-lead` agent. Then send the
first message via `SendMessage` using the structured payload that
team-lead expects (see `agents/team-lead.md` Section "Dispatch
protocol"). The `Phase` is `propose`. Use this payload shape:

```markdown
## Mission
Propose: <one-line summary of description>

## Phase
propose

## Repo Context
(workspace-level mission proposal — team-lead reads
`.teamworks/{project,topology}.md` and every `.teamworks/repos/*.md`
to identify affected repos, then dispatches their managers)

## Cross-repo Constraints
This is the SDD phase. Each affected manager runs openspec inside its
own repo and replies with the spec path and a summary. team-lead
self-approves each repo spec — no user gate between `propose` and
`apply`. Managers do NOT run TDD or write production code in this
phase; spec artifacts only.

If you conclude no repos are affected by the description, do NOT
allocate a mission-id or write a mission block. Reply with
`affected-repos: []` and a one-line explanation (e.g. "no repo touches
the described surface area"). The outer session will relay your
reasoning to the user.

If a manager reports openspec is not installed, treat that as an
immediate setup blocker — do NOT retry (the retry policy is for
content failures, not missing tooling). Surface it in your reply so
the user can install openspec and re-run.

A mission is approved only if EVERY affected repo's spec is accepted.
If any repo's spec is `blocked` or `partial` after retries, do NOT
write a mission block; report the partial state (which repos
succeeded, which blocked, why) and stop. The user will intervene and
re-run `propose`.

## Task
<user's description, verbatim>

Per your `propose` behaviour:

- Identify affected repos by reading `.teamworks/{project,topology}.md`
  and every `.teamworks/repos/*.md`.
- Dispatch the affected repo-managers in parallel with `Phase: propose`;
  each runs openspec inside its own repo and replies with the spec
  path and a summary.
- Review each reply against the mission and `topology.md`. Self-approve
  or push back via the retry policy.
- Once every repo spec is accepted, allocate a `mission-id` of the
  form `m-YYYYMMDD-<slug>` (e.g. `m-20260426-fee-on-transfer`).
- Write a new mission block to `.teamworks/project.md` under
  `## Missions`. The block must include:
  - `mission-id: m-YYYYMMDD-<slug>`
  - `status: approved`
  - `description: <user description>`
  - `repos: [<list of affected repo names>]` — canonical list that
    `apply` reads to know who to dispatch; names match the `<name>` in
    `.teamworks/repos/<name>.md`.
  - links / paths to each repo's spec artifact.
- Update `.teamworks/topology.md` (both diagram and edge table) only
  if any interface changed (added / removed / changed export, new
  edge, etc.).

## Expected Reply
- mission-id: m-YYYYMMDD-<slug>
- affected-repos: [<list>]
- spec-paths: [<per-repo paths>]
- topology-updated: yes | no
- summary: <one paragraph describing the proposed mission>
- blockers: <if any manager replied partial / blocked>
```

Substitute the one-line summary and the verbatim description before
sending.

## Step 5: Wait for team-lead's report and forward verbatim

Wait for team-lead's reply. Forward the report to the user verbatim —
do not summarise or paraphrase. The expected report includes:

- the allocated `mission-id`,
- the list of affected repos,
- the spec path for each repo,
- whether `topology.md` was updated,
- a one-paragraph summary of the proposed mission,
- any blockers (e.g. a manager replied `partial` or `blocked`).

If team-lead asks a clarifying question, relay it to the user, capture
the reply, and `SendMessage` it back to team-lead. Repeat until
team-lead reports completion.

If team-lead reports `partial` or `blocked` for one or more repos,
forward those blockers in full so the user can decide whether to
intervene before running `/teamworks:apply <mission-id>`.

## Step 6: Tear down team-lead

Once team-lead has reported completion, tear down the spawned
team-lead agent so it does not persist past this command. Call
`TeamDelete` on the team-lead agent created in Step 4. Do not
fire-and-forget; explicitly invoke `TeamDelete` before exiting the
command.

Print a one-line confirmation that `propose` is complete (including
the `mission-id`) and that team-lead has been torn down via
`TeamDelete`.
