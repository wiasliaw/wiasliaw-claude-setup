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
