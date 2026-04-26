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
mkdir -p .teamworks/repos .teamworks/log
```

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
<!-- INVARIANT: ## Missions must remain the final section of project.md. /teamworks:shutdown appends 'applied-summary:' lines after the latest mission block, which relies on EOF == end-of-last-mission-block. -->
(none yet — propose via /teamworks:propose)
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

## Step 5: Verify

Confirm `.teamworks/project.md` and `.teamworks/topology.md` exist and
that `.teamworks/repos/` and `.teamworks/log/` are empty directories.
Print a one-line summary and suggest `/teamworks:add-repo <path>` as
the next step.

## Mission Block Schema

<!-- SYNCED FROM reference/mission-block.md — edit there, then re-sync here -->
`/teamworks:propose` writes mission blocks to `.teamworks/project.md` under
the `## Missions` section. `/teamworks:apply` and `/teamworks:shutdown`
parse them. The block grammar is line-oriented:

- One blank line separates mission blocks.
- Each block contains these lines, each on its own line, in this order:
  - `mission-id: m-YYYYMMDD-<slug>` — kebab-case slug, no spaces.
  - `status: approved | applied` — exactly one of these two.
  - `description: <one paragraph>` — single line; multi-paragraph
    descriptions are NOT supported.
  - `repos: [<repo-name>, <repo-name>, ...]` — JSON-style list of repo
    names matching `<name>` in `.teamworks/repos/<name>.md`.
  - `specs:` followed by one indented bullet per spec path:
    - `  - <repo>: <path-to-spec-artifact>`
- Optional trailing line (added by `/teamworks:shutdown` when the mission
  is applied):
  - `applied-summary: session ended at YYYY-MM-DD HH:MM UTC`

Parsers MUST anchor matches (e.g. `^mission-id: <id>$`, not substring) to
avoid prefix collisions. Future schema changes require updating
`/teamworks:propose` (writer), `/teamworks:apply` (parser), and
`/teamworks:shutdown` (parser/appender) atomically.
<!-- /SYNCED -->
