---
allowed-tools: Bash, Read, SendMessage, TeamCreate, TeamDelete
description: Ask the team-lead a question about the workspace. Read-only against .teamworks/; dispatches managers in parallel for investigation; only log/ is appended.
---

Announce: "Using teamworks:explore to ask the team-lead about <question>."

The slash command syntax is `/teamworks:explore <question>`. The
`<question>` argument is required and may be free-form prose (it does
not have to be a single line). `explore` is not a mission, so no
`mission-id` is involved.

## Step 0: Confirm working directory

Run `pwd` and confirm with the user that the current directory is the
intended workspace root (the folder containing `.teamworks/`). If
unsure, stop and ask.

```bash
pwd
```

## Step 1: Announce

Print the announce line above, substituting the actual `<question>` the
user supplied. If the question is long, you may truncate it for the
announce line — but pass the full text verbatim to team-lead in Step 3.

## Step 2: Validate `.teamworks/` exists

The current working directory must be the workspace root containing
`.teamworks/`. Check with:

```bash
[ -d .teamworks ] && echo ok || echo missing
```

If the directory is missing, stop and tell the user to run
`/teamworks:init` first. Do not proceed.

If the user did not supply a `<question>`, ask for one and stop until
they reply. Do not invent a question on the user's behalf.

## Step 2.5: Append command anchor to today's log

Append a top-level command anchor so team-lead synthesis can seek to
this command's slice (see `reference/log-format.md`):

```bash
DATE=$(date -u +%F)
TS=$(date -u +"%F %H:%M UTC")
mkdir -p .teamworks/log
printf '\n## command: explore %s\n\n' "$TS" >> ".teamworks/log/$DATE.md"
```

## Step 3: Spawn team-lead and dispatch (read-only)

Use `TeamCreate` to spawn the bundled `team-lead` agent. Then send the
first message via `SendMessage` using the structured payload that
team-lead expects (see `agents/team-lead.md` Section "Dispatch
protocol"). The `Phase` is `explore` and the payload must reinforce
the read-only nature of the investigation in multiple places:

<!-- SYNCED FROM reference/dispatch-payload.md — edit there, then re-sync here -->
```markdown
## Mission
Explore: <one-line summary of the question>

## Phase
explore

## Cross-repo Constraints
READ-ONLY. Do NOT modify `.teamworks/project.md`,
`.teamworks/topology.md`, or any `.teamworks/repos/<name>.md`. Only
`.teamworks/log/YYYY-MM-DD.md` may be appended (your normal logging
duty). No mission block is written; no topology edit is performed.

## Task
<user's question, verbatim>

Per your `explore` behaviour: identify the relevant repos from
`.teamworks/{project,topology}.md` and the `repos/` cards, then
dispatch those repo-managers in parallel with `Phase: explore` for
read-only investigation. Each dispatched manager must also be
instructed that this is observation only — they do NOT write any files
in their repo, do NOT update their own `.teamworks/repos/<self>.md`
card, do NOT run openspec, do NOT run TDD, and do NOT mutate git state
(no `checkout`, `switch`, `stash`, `commit`, `branch`, `reset`,
`rebase`). Read-only Bash only — `ls`, `cat`, `git log`, `git status`,
`git diff`, `git show`, `git remote -v`.

Synthesise the managers' replies into a single answer for the user.

## Expected Reply
- summary: synthesised answer to the user's question
- per-repo notes: short bullet per repo you consulted, if applicable
- blockers: any unresolved questions or repos you could not answer for
```
<!-- /SYNCED -->

Substitute the one-line summary and the verbatim question before
sending.

## Step 4: Wait for team-lead's report and forward verbatim

Wait for team-lead's reply. Forward the report to the user verbatim —
do not summarise or paraphrase. The expected report includes:

- the synthesised answer,
- per-repo notes (if team-lead consulted multiple managers),
- any blockers or unresolved questions.

If team-lead asks a clarifying question, relay it to the user, capture
the reply, and `SendMessage` it back to team-lead. Repeat until
team-lead reports completion.

If at any point team-lead reports having written to
`.teamworks/project.md`, `.teamworks/topology.md`, or any
`.teamworks/repos/<name>.md`, surface that as a violation in your
final message to the user — `explore` is read-only by contract.

## Step 5: Tear down team-lead

Once team-lead has reported completion, tear down the spawned
team-lead agent so it does not persist past this command. Call
`TeamDelete` on the team-lead agent created in Step 3. Do not
fire-and-forget; explicitly invoke `TeamDelete` before exiting the
command.

Print a one-line confirmation that `explore` is complete and that
team-lead has been torn down via `TeamDelete`.
