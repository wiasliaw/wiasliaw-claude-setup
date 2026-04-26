---
allowed-tools: Bash, Read, SendMessage, TeamCreate, TeamDelete
description: Register a project-scoped specialty agent (e.g. security-reviewer, qa). Writes the definition to $project/.claude/agents/<role>.md and registers it in project.md.
---

Announce: "Using teamworks:add-agent to register <role>."

The slash command syntax is `/teamworks:add-agent <role> [brief]`. The
`<role>` argument is required; `[brief]` is an optional one-line purpose
statement that anchors the agent's system prompt.

`$project` in this command refers to the workspace folder — the cwd of
the outer session, the same directory that holds `.teamworks/`.

## Step 0: Confirm working directory

Run `pwd` and confirm with the user that the current directory is the
intended workspace root (the folder containing `.teamworks/`). If
unsure, stop and ask.

```bash
pwd
```

## Step 1: Announce

Print the announce line above, substituting the actual `<role>` the user
supplied.

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
printf '\n## command: add-agent %s\n\n' "$TS" >> ".teamworks/log/$DATE.md"
```

## Step 3: Validate args

`<role>` is required. If the user did not supply one, ask for it and
stop until they reply.

`<role>` must be a kebab-case identifier: starts with a lowercase
letter, then lowercase alphanumerics and dashes only. Validate with:

```bash
printf '%s' "<role>" | grep -Eq '^[a-z][a-z0-9-]*$' && echo ok || echo bad
```

If the check prints `bad`, stop with a one-line error naming the
offending value, e.g. `invalid role "<role>": must match
^[a-z][a-z0-9-]*$ (kebab-case, lowercase, no underscores)`. The role
becomes both the filename and the agent's `name:` frontmatter, so it
must be a valid identifier.

Refuse if the agent file already exists, to avoid silent overwrite:

```bash
[ -e ".claude/agents/<role>.md" ] && echo exists || echo ok
```

If the file already exists, stop and tell the user the agent is already
registered. Suggest they edit `.claude/agents/<role>.md` directly or
pick a different role name.

`[brief]` is optional. If the user did not supply one, do not ask;
team-lead will fall back to a sensible default for `<role>`. Capture
whatever the user did supply (joined into a single string) as
`<brief>`, or set it to `(none provided)` for the dispatch payload.

## Step 4: Spawn team-lead and dispatch

Use `TeamCreate` to spawn the bundled `team-lead` agent. Then send the
first message via `SendMessage` using the structured payload that
team-lead expects (see `agents/team-lead.md` Section "Dispatch
protocol"):

<!-- SYNCED FROM reference/dispatch-payload.md — edit there, then re-sync here -->
```markdown
## Mission
add-agent: register specialty agent <role>

## Phase
onboard

## Cross-repo Constraints
(read `.teamworks/project.md` `## Specialty Agents` section to avoid
duplicate registrations and to keep the new entry consistent with
existing ones)

## Task
The user wants to register a project-scoped specialty agent.
- Role: <role>
- Brief: <brief>

`$project` is the workspace folder (the cwd of the outer session, the
parent of `.teamworks/`).

Note: the agent definition file lives at the **workspace root**
(`$project/.claude/agents/`), outside any repo. Your "do not edit repo
files" rule does not apply here — this is a workspace-level
registration, the same scope as `.teamworks/**`.

Per your `add-agent` behaviour:
1. Write `$project/.claude/agents/<role>.md` with valid YAML
   frontmatter (`name: <role>`, a one-paragraph `description`, an
   appropriate `tools` list, and `model: sonnet`). Tools must match
   the role: read-only reviewers (e.g. `security-reviewer`) should
   omit `Edit` and `Write`; doer roles (e.g. `qa` writing tests) may
   include them. Default to the minimum tool set that lets the role do
   its job.
2. Author the body to capture the role's responsibility and the
   trigger conditions under which team-lead should invoke it during
   `propose` / `apply` / `explore`.
3. Append a one-line entry to `.teamworks/project.md` under the
   `## Specialty Agents` section: `- <role>: <one-line purpose>`. If
   the section currently reads `(none yet — add via
   /teamworks:add-agent)`, replace that placeholder with the first
   real entry.

Do not spawn `<role>` now. Later commands will invoke it on demand.

## Expected Reply
- artifact-paths: [the agent file path, `.teamworks/project.md`]
- summary: one-line description of what was written and the role's
  registered purpose
- blockers: any clarifying questions or unresolved issues
```
<!-- /SYNCED -->

Substitute `<role>` and `<brief>` before sending.

## Step 5: Forward team-lead's report

Wait for team-lead's reply. Forward the report to the user verbatim —
do not summarise or paraphrase. The expected report includes:

- the agent file path (`.claude/agents/<role>.md`),
- the `.teamworks/project.md` update under `## Specialty Agents`,
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

Print a one-line confirmation that `add-agent` is complete and that
team-lead has been torn down via `TeamDelete`.
