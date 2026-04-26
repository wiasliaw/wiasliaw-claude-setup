---
allowed-tools: Bash, Read, SendMessage, TeamCreate, TeamDelete
description: Register a new repo into the workspace. Spawns team-lead, which produces .teamworks/repos/<name>.md and updates topology.md.
---

Announce: "Using teamworks:add-repo to register <path>."

The slash command syntax is `/teamworks:add-repo <path>`. If the user
did not provide `<path>`, ask for it and stop. If `<path>` is relative,
resolve it to an absolute path before passing it to team-lead.

## Step 0: Confirm working directory

Run `pwd` and confirm with the user that the current directory is the
intended workspace root (the folder containing `.teamworks/`). If
unsure, stop and ask.

```bash
pwd
```

## Step 1: Announce

Print the announce line above, substituting the actual `<path>` the
user supplied (after resolving to absolute).

## Step 2: Validate `.teamworks/` exists

The current working directory must be the workspace root containing
`.teamworks/`. Check with:

```bash
[ -d .teamworks ] && echo ok || echo missing
```

If the directory is missing, stop and tell the user to run
`/teamworks:init` first. Do not proceed.

## Step 2.5: Append command anchor to today's log

Append a top-level command anchor so team-lead synthesis can seek to
this command's slice (see `reference/log-format.md`):

```bash
DATE=$(date -u +%F)
TS=$(date -u +"%F %H:%M UTC")
mkdir -p .teamworks/log
printf '\n## command: add-repo %s\n\n' "$TS" >> ".teamworks/log/$DATE.md"
```

## Step 3: Validate target path is a git repo

Resolve `<path>` to an absolute path and confirm it is a directory
containing `.git/`:

```bash
ABS_PATH="$(cd "<path>" 2>/dev/null && pwd)" || { echo "not a directory: <path>"; exit 1; }
[ -d "$ABS_PATH/.git" ] || { echo "not a git repo: $ABS_PATH"; exit 1; }
echo "$ABS_PATH"
```

If either check fails, stop with a clear error message naming the
offending path. Also verify the resolved path sits inside the
workspace folder (the same directory that holds `.teamworks/`); if it
does not, warn the user and ask whether to continue — the design
expects repos to live as subdirectories of the workspace root.

If the user did not supply a reason for adding the repo in the slash
command args, ask them briefly now (one sentence is fine). Capture the
reply as `<reason>` for the dispatch payload.

## Step 4: Spawn team-lead and dispatch

Use `TeamCreate` to spawn the bundled `team-lead` agent. Then send the
first message via `SendMessage` using the structured payload that
team-lead expects (see `agents/team-lead.md` Section "Dispatch
protocol"):

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

Fill it in like this for `add-repo` (note: this is a filled example,
not a sync-tracked block — substitute `<name>` (the repo's directory
basename), `<absolute-path>`, and `<reason>` before sending):

```markdown
## Mission
add-repo: register <name> into the workspace

## Phase
onboard

## Cross-repo Constraints
(read `.teamworks/topology.md` to see existing nodes and edges)

## Task
The user is adding the repo at `<absolute-path>`. Reason: <reason>.

Per your `add-repo` behaviour:
1. Read the target repo read-only (README, manifest files, top-level
   layout, `git remote -v`, default branch).
2. Ask the user at most one or two clarification questions if signals
   are ambiguous.
3. Write `.teamworks/repos/<name>.md` (the identity card). Keep it
   under ~2KB — long-form repo knowledge belongs in the repo's own
   README, not the card.
4. Update `.teamworks/topology.md` (diagram + edges table).
5. Optionally append a one-line note to `.teamworks/project.md` if
   the addition affects the workspace mission.

## Expected Reply
- artifact-paths: [list of files written / updated]
- summary: one-paragraph description of what you did and the repo's
  role in the workspace
- blockers: any clarifying questions or unresolved issues
```

## Step 5: Wait for team-lead's report and forward verbatim

Wait for team-lead's reply. Forward the report to the user verbatim —
do not summarise or paraphrase. The expected report includes:

- the identity card path (`.teamworks/repos/<name>.md`),
- the topology updates (which nodes / edges were added or changed),
- any clarifying questions team-lead surfaced.

If team-lead asks a clarifying question, relay it to the user, capture
the reply, and `SendMessage` it back to team-lead. Repeat until
team-lead reports completion.

## Step 6: Tear down team-lead

Once team-lead has reported completion (or the user is done with
follow-up questions), tear down the spawned team-lead agent so it does
not persist past this command. Call `TeamDelete` on the team-lead
agent created in Step 4. Do not fire-and-forget; explicitly invoke
`TeamDelete` before exiting the command.

Print a one-line confirmation that `add-repo` is complete and that
team-lead has been torn down via `TeamDelete`.
