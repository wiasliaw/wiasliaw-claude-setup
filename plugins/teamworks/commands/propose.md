---
allowed-tools: Bash, Read, SendMessage, TeamCreate, TeamDelete
description: Run cross-repo SDD via openspec. Team-lead dispatches managers, self-approves their specs, writes a mission row to project.md plus a detail file under .teamworks/missions/, and updates topology.md if interfaces change.
---

Announce: "Using teamworks:propose to draft a cross-repo mission: <description>."

The slash command syntax is `/teamworks:propose <description>`. The
`<description>` argument is required and may be free-form prose
describing the cross-repo change. `propose` allocates a new
`mission-id`, writes a table row to `.teamworks/project.md`'s
`## Missions` section, and creates a detail file at
`.teamworks/missions/<mission-id>.md` holding the full mission
content. No user gate sits between `propose` and `apply`.

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

## Step 3.5: Append command anchor to today's log

Append a top-level command anchor so team-lead synthesis can seek to
this command's slice (see `reference/log-format.md`):

```bash
DATE=$(date -u +%F)
TS=$(date -u +"%F %H:%M UTC")
mkdir -p .teamworks/log
printf '\n## command: propose %s\n\n' "$TS" >> ".teamworks/log/$DATE.md"
```

## Step 4: Spawn team-lead and dispatch (Phase: propose)

Use `TeamCreate` to spawn the bundled `team-lead` agent. Then send the
first message via `SendMessage` using the structured payload that
team-lead expects (see `agents/team-lead.md` Section "Dispatch
protocol"). The `Phase` is `propose`. Use this payload shape:

<!-- SYNCED FROM reference/dispatch-payload.md — edit there, then re-sync here -->
```markdown
## Mission
<mission-id>: <one-line summary>

## Phase
propose | apply | explore | onboard | query

## Cross-repo Constraints
<topology slice and any phase-specific constraints>
(omit if Phase: query)

## Task
<concrete instructions>

## Expected Reply
- artifact-paths: [<files-or-dirs>]
- summary: <bullets>
- blockers: <if any>
```
<!-- /SYNCED -->

Fill it in like this for `propose` (note: this is a filled example,
not a sync-tracked block — substitute the one-line summary and the
verbatim description before sending):

```markdown
## Mission
Propose: <one-line summary of description>

## Phase
propose

## Cross-repo Constraints
This is the SDD phase. Each affected manager runs openspec inside its
own repo and replies with the spec path and a summary. team-lead
self-approves each repo spec — no user gate between `propose` and
`apply`. Managers do NOT run TDD or write production code in this
phase; spec artifacts only.

Topology-first filter (bounds context cost): identify candidate repos
from `.teamworks/topology.md` (graph + shared interfaces) BEFORE
reading any identity card. Then read only the candidate cards
(`.teamworks/repos/<name>.md`), not all of them. If you discover the
candidate set was wrong mid-flight (a candidate is unaffected, or a
non-candidate is actually affected), expand the read on demand and
document the revision in the mission detail file's `specs:` section.

If you conclude no repos are affected by the description, do NOT
allocate a mission-id, write a table row, or create a detail file.
Reply with `affected-repos: []` and a one-line explanation (e.g.
"no repo touches the described surface area"). The outer session will
relay your reasoning to the user.

If a manager reports openspec is not installed, treat that as an
immediate setup blocker — do NOT retry (the retry policy is for
content failures, not missing tooling). Surface it in your reply so
the user can install openspec and re-run.

A mission is approved only if EVERY affected repo's spec is accepted.
If any repo's spec is `blocked` or `partial` after retries, do NOT
write a table row or create a detail file; report the partial state
(which repos succeeded, which blocked, why) and stop. The user will
intervene and re-run `propose`.

Mission storage is split (v2):

1. A new row in `.teamworks/project.md`'s `## Missions` table.
2. A detail file at `.teamworks/missions/<mission-id>.md` containing
   the full mission body.

Both writes must succeed or neither — if you cannot write the detail
file, do NOT add the table row.

## Task
<user's description, verbatim>

Per your `propose` behaviour:

- Identify affected repos topology-first: read
  `.teamworks/{project,topology}.md`, derive the candidate set from
  the description and the topology graph, then read ONLY the
  candidates' identity cards (`.teamworks/repos/<name>.md`). Do NOT
  pre-read every repo's card. Expand on discovery if mid-flight you
  find the set was wrong, and note the revision in the detail file's
  `specs:` section.
- Dispatch the affected repo-managers in parallel with `Phase: propose`;
  each runs openspec inside its own repo and replies with the spec
  path and a summary.
- Review each reply against the mission and `topology.md`. Self-approve
  or push back via the retry policy.
- Once every repo spec is accepted, allocate a `mission-id` of the
  form `m-YYYYMMDD-<slug>` (e.g. `m-20260426-fee-on-transfer`).
- Append a new row to the `## Missions` table in
  `.teamworks/project.md`:
  `| <mission-id> | approved | <one-line description> | [<repo>, <repo>] | missions/<mission-id>.md |`
  The description must be a single line with no pipe (`|`) characters
  (replace with `/` or `,` if needed). The `repos` cell is the
  canonical dispatch list that `apply` will use; names match the
  `<name>` in `.teamworks/repos/<name>.md`.
- Create the detail file at `.teamworks/missions/<mission-id>.md` with
  this body (literal markdown):
  - Top heading: `# Mission: <mission-id>`
  - Then a blank line, then a bullet list with these keys (each on its
    own line):
    - `- mission-id: <mission-id>`
    - `- description: <one-line description, same as the table row>`
    - `- repos: [<repo>, <repo>]`
    - `- created: YYYY-MM-DD HH:MM UTC`
    - `- specs:` followed by one indented sub-bullet per spec, e.g.
      `  - <repo>: <path-to-spec-artifact relative to that repo's root>`

  Do NOT write a `status:` line into the detail file. The mission's
  status lives only in the `status` cell of its row in `project.md`'s
  `## Missions` table — that cell is the single source of truth.
  Duplicating status in the detail file would create a drift hazard
  between `apply` (which flips the cell) and any reader of the detail
  file.

  Do NOT add an `applied-summary:` line in `propose` either; that is
  appended by `/teamworks:shutdown` after a successful `apply`. See
  `reference/mission-block.md` for the full v2 detail file format.
- Update `.teamworks/topology.md` (both diagram and edge table) only
  if any interface changed (added / removed / changed export, new
  edge, etc.).

## Expected Reply
- mission-id: m-YYYYMMDD-<slug>
- affected-repos: [<list>]
- spec-paths: [<per-repo paths>]
- table-row-written: yes
- detail-file-path: missions/<mission-id>.md
- topology-updated: yes | no
- summary: <one paragraph describing the proposed mission>
- blockers: <if any manager replied partial / blocked>
```

## Step 5: Wait for team-lead's report and forward verbatim

Wait for team-lead's reply. Forward the report to the user verbatim —
do not summarise or paraphrase. The expected report includes:

- the allocated `mission-id`,
- the list of affected repos,
- the spec path for each repo,
- `table-row-written: yes` confirming the row was added to
  `project.md`,
- `detail-file-path: missions/<mission-id>.md` confirming the detail
  file was created,
- whether `topology.md` was updated,
- a one-paragraph summary of the proposed mission,
- any blockers (e.g. a manager replied `partial` or `blocked`).

If team-lead asks a clarifying question, relay it to the user, capture
the reply, and `SendMessage` it back to team-lead. Repeat until
team-lead reports completion.

If team-lead reports `partial` or `blocked` for one or more repos,
forward those blockers in full so the user can decide whether to
intervene before running `/teamworks:apply <mission-id>`.

## Step 5.5: Append mission sub-anchor to today's log

If team-lead returned an allocated `mission-id` (i.e. the mission was
approved and table-row-written is `yes`), append a mission sub-anchor
under the command anchor written in Step 3.5 so synthesis-time reads
can scope to this mission's slice (see `reference/log-format.md`):

```bash
DATE=$(date -u +%F)
printf '\n### mission: %s\n\n' "$MISSION_ID" >> ".teamworks/log/$DATE.md"
```

If team-lead reported `affected-repos: []` (no mission allocated) or
returned `partial` / `blocked` without a mission-id, skip this step —
there is no mission to anchor.

## Step 6: Tear down team-lead

Once team-lead has reported completion, tear down the spawned
team-lead agent so it does not persist past this command. Call
`TeamDelete` on the team-lead agent created in Step 4. Do not
fire-and-forget; explicitly invoke `TeamDelete` before exiting the
command.

Print a one-line confirmation that `propose` is complete (including
the `mission-id`) and that team-lead has been torn down via
`TeamDelete`.
