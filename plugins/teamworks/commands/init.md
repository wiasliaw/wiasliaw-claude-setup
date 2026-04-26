---
allowed-tools: Bash, Read, Write
description: Initialize the .teamworks/ skeleton in the current workspace folder. Pure file bootstrap — does not spawn team-lead.
---

# teamworks:init

Announce: "Using teamworks:init to scaffold the workspace."

## Step 0: Confirm working directory

Run `pwd` and confirm with the user that the current directory is the
intended workspace root before creating anything. If unsure, stop and ask.

```bash
pwd
```

## Step 1: Refuse if already initialised

If `.teamworks/` already exists, stop and tell the user it is already
initialised. Do not overwrite. If you believe `.teamworks/` is a
leftover from a previous failed run, remove it manually (`rm -rf .teamworks`)
and re-run this command.

## Step 2: Create directory skeleton

Run:

```bash
mkdir -p .teamworks/repos .teamworks/log .teamworks/missions
```

The `missions/` directory holds per-mission detail files
(`<mission-id>.md`) written by `/teamworks:propose`. It starts empty.

## Step 3: Create project.md

Ask the user for a one-paragraph workspace mission. Wait for the reply,
then write `.teamworks/project.md` with this skeleton, substituting the
user's paragraph for the placeholder:

```markdown
# Workspace Mission

<one paragraph: ask the user>

## Settings
- max-retries: 3

## Specialty Agents
(none yet — add via /teamworks:add-agent)

## Missions
<!-- INVARIANT: ## Missions must remain the final section of project.md. The table extends to EOF; parsers in /teamworks:apply and /teamworks:shutdown rely on this. Per-mission detail files live in .teamworks/missions/<mission-id>.md. -->
| mission-id | status | description | repos | detail |
|---|---|---|---|---|
```

## Step 4: Create topology.md

Write `.teamworks/topology.md` with this skeleton:

```markdown
# Topology

## Diagram

(empty — populated as repos are added via /teamworks:add-repo)

## Edges

| From | To | Kind | Notes |
| --- | --- | --- | --- |

## Shared Interfaces

(none yet)
```

## Step 5: Append command anchor to today's log

Now that `.teamworks/log/` exists (created in Step 2), append the
command-anchor heading so future commands and team-lead synthesis can
seek to this command's slice (see `reference/log-format.md`):

```bash
DATE=$(date -u +%F)
TS=$(date -u +"%F %H:%M UTC")
printf '\n## command: init %s\n\n' "$TS" >> ".teamworks/log/$DATE.md"
```

This is the only command for which the anchor write also bootstraps
the log file (init created the directory in Step 2; the file is
created here implicitly by the redirect). Other commands fail-fast on
a missing `.teamworks/` before writing the anchor, so init is the
special case.

## Step 6: Verify

Confirm `.teamworks/project.md` and `.teamworks/topology.md` exist and
that `.teamworks/repos/` and `.teamworks/missions/` are empty
directories. `.teamworks/log/` will contain today's log file with the
command-anchor heading written in Step 5. Print a one-line summary and
suggest `/teamworks:add-repo <path>` as the next step.

## Mission Block Schema

<!-- SYNCED FROM reference/mission-block.md — edit there, then re-sync here -->
Missions are stored in two places:

1. A row in `.teamworks/project.md`'s `## Missions` table (the index).
2. A detail file at `.teamworks/missions/<mission-id>.md` (the full
   mission content).

This split bounds `project.md` size: the table grows ~1 row per
mission; full mission contents live in per-mission files that consumers
load only when needed.

The `## Missions` section in `project.md` is a markdown table:

```markdown
## Missions
| mission-id | status | description | repos | detail |
|---|---|---|---|---|
| m-YYYYMMDD-<slug> | approved | <one-line description> | [<repo>, <repo>] | missions/<mission-id>.md |
```

Constraints:

- mission-id: kebab-case slug, no spaces, format `m-YYYYMMDD-<slug>`.
- status: exactly one of `approved` or `applied`.
- description: ONE LINE. Must not contain pipe (`|`) characters; replace
  with `/` or `,` if needed.
- repos: JSON-style list `[name, name]`. Repo names match `<name>` in
  `.teamworks/repos/<name>.md`.
- detail: relative path `missions/<mission-id>.md` (relative to
  `.teamworks/`).

Each mission's full content lives at `.teamworks/missions/<mission-id>.md`:

```markdown
# Mission: <mission-id>

- mission-id: <mission-id>
- description: <one-line description, same as table row>
- repos: [<repo>, <repo>]
- created: YYYY-MM-DD HH:MM UTC
- specs:
  - <repo>: <path-to-spec-artifact relative to that repo's root>
  - <repo>: <path>
- applied-summary: session ended at YYYY-MM-DD HH:MM UTC   (added by shutdown when applicable)
```

Status is deliberately NOT in the detail file. The single source of
truth for a mission's status is the `status` cell of its row in
`project.md`'s `## Missions` table — duplicating it in the detail file
would create a drift hazard. `apply` flips the table cell; `shutdown`
only appends `applied-summary` to the detail file. Neither writes a
`status:` line into the detail file.

The `applied-summary` line is added by `/teamworks:shutdown` only when
status flips to `applied`. Optional otherwise.

Writers / parsers:

- `/teamworks:propose` writes a new table row + creates the detail file.
- `/teamworks:apply` reads the table row to verify `status: approved`,
  reads the detail file for full mission data, and flips the row's
  status cell to `applied` on success. Does NOT modify the detail file.
- `/teamworks:shutdown` scans the table for the latest `applied` row,
  reads its detail file path, and appends `applied-summary` to that
  detail file. Does NOT modify `project.md`.

Parsers MUST anchor on the exact mission-id between `|` delimiters
(e.g. `$2 == "m-20260426-foo"` after splitting on `|`), not a substring
match — `m-20260426-foo` would otherwise collide with
`m-20260426-foo-extra`. Future schema changes require updating
`/teamworks:propose` (writer), `/teamworks:apply` (parser/writer), and
`/teamworks:shutdown` (parser/appender) atomically.
<!-- /SYNCED -->
