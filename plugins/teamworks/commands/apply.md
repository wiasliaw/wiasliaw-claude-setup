---
allowed-tools: Bash, Read, SendMessage, TeamCreate, TeamDelete
description: Execute an approved mission. Team-lead dispatches managers to run TDD per spec; no commits. On failure, retries up to 3 times with new angle. Reports per-repo status; the user owns git.
---

Announce: "Using teamworks:apply to execute mission <mission-id>."

The slash command syntax is `/teamworks:apply <mission-id>`. The
`<mission-id>` argument is required and must match the format
`m-YYYYMMDD-<slug>` allocated by a previous `/teamworks:propose`
run. `apply` does NOT execute any git operations — the user owns
commit, push, and every other git write from here.

## Step 0: Confirm working directory

Run `pwd` and confirm with the user that the current directory is the
intended workspace root (the folder containing `.teamworks/`). If
unsure, stop and ask.

```bash
pwd
```

## Step 1: Announce

Print the announce line above, substituting the actual `<mission-id>`
the user supplied.

## Step 2: Validate `.teamworks/` exists

The current working directory must be the workspace root containing
`.teamworks/`. Check with:

```bash
[ -d .teamworks ] && echo ok || echo missing
```

If the directory is missing, stop and tell the user to run
`/teamworks:init` first. Do not proceed.

## Step 3: Validate `<mission-id>` exists and is approved

If the user did not supply a `<mission-id>`, ask for one and stop
until they reply. Do not invent a mission-id on the user's behalf.

The mission must have a row in `.teamworks/project.md`'s `## Missions`
table AND its `status` cell must be `approved`. Parse the table with
an exact-match parser on the mission-id between `|` delimiters
(substring matches would collide on prefix-shared mission-ids such as
`m-20260426-foo` vs `m-20260426-foo-extra`):

```bash
ROW=$(awk -v id="<mission-id>" -F'|' '
  # Skip header row, separator row, and section title.
  # Data rows start with a leading "|" and have id in column 2.
  /^\|/ {
    cell = $2
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", cell)
    if (cell == id) { print; exit }
  }
' .teamworks/project.md)

if [ -z "$ROW" ]; then
  echo missing
else
  # Extract status (column 3) and detail path (column 6).
  STATUS=$(printf '%s\n' "$ROW" | awk -F'|' '{
    s = $3; gsub(/^[[:space:]]+|[[:space:]]+$/, "", s); print s
  }')
  DETAIL=$(printf '%s\n' "$ROW" | awk -F'|' '{
    d = $6; gsub(/^[[:space:]]+|[[:space:]]+$/, "", d); print d
  }')
  printf 'status: %s\ndetail: %s\n' "$STATUS" "$DETAIL"
fi
```

Decision rules:

- If the parser prints `missing`, the mission-id has no row in the
  `## Missions` table; refuse with a clear error: `mission
  <mission-id> not found in .teamworks/project.md — run
  /teamworks:propose first`.
- If the row is found but the `status` cell is empty or absent,
  refuse: `mission <mission-id> row is malformed: no status cell —
  fix .teamworks/project.md by hand or re-run /teamworks:propose`.
  Do NOT proceed.
- If the `status` cell is not `approved` (e.g. `applied` or anything
  else), refuse with a clear error naming the actual status:
  `mission <mission-id> has status <X>; apply requires status:
  approved`. Do NOT downgrade an `applied` mission back to
  `approved` — tell the user to draft a new mission via
  `/teamworks:propose` if they need to redo the work.
- If approved, confirm the detail file exists at
  `.teamworks/<DETAIL>` (the path printed by the parser is relative to
  `.teamworks/`). If the file is missing, refuse: `mission
  <mission-id> detail file not found at <path>; re-run
  /teamworks:propose to recreate it`.
- On pass, note the detail file path so team-lead can read it. Do not
  read the file yourself in this step — team-lead loads it from the
  payload.

## Step 4: Spawn team-lead and dispatch (Phase: apply)

Use `TeamCreate` to spawn the bundled `team-lead` agent. Then send
the first message via `SendMessage` using the structured payload that
team-lead expects (see `agents/team-lead.md` Section "Dispatch
protocol"). The `Phase` is `apply`. Use this payload shape:

<!-- SYNCED FROM reference/dispatch-payload.md — edit there, then re-sync here -->
```markdown
## Mission
<mission-id>: <one-line summary lifted from the mission's row description in project.md>

## Phase
apply

## Repo Context
(workspace-level execution — team-lead reads the mission's row in
`.teamworks/project.md`'s `## Missions` table to confirm the
mission-id and status, then loads the full mission body from
`.teamworks/missions/<mission-id>.md`. The detail file's `repos:`
field is the canonical dispatch set.)

## Cross-repo Constraints
This is the TDD execution phase. Each affected manager runs TDD per
their approved spec: red (failing test) -> green (minimum
implementation) -> refactor. Tests must precede production code; do
NOT skip the red step.

NO managers (and not you) may run `git commit`, `git push`, `git
pull`, `git fetch`, `git merge`, `git rebase`, `git reset`, `git
checkout`, `git branch`, `git tag`, `git stash`, or any other git
write operation. The user owns git from here. If a manager believes
a git write is required, it must stop and surface that as a blocker.

Leave all changes in the working tree (modified, staged, or
untracked); the user will review with `git status` / `git diff` and
own the commit decision. Do NOT stash, do NOT discard.

If a recorded spec path no longer exists on disk, treat that as a
setup blocker — do NOT retry, do NOT fabricate a spec; surface it so
the user can restore the file or run `/teamworks:propose` again.

If a manager's first test for a spec passes immediately (the
behaviour already exists, no red step possible), the manager should
report `status: done` with a note that no production code change was
required. Do NOT contrive a failing test; pass the note through
verbatim in your reply.

Retry policy: max 3 retries per manager. Before each retry you must
articulate a genuinely new angle in the next dispatch payload's
`## Task` (different decomposition, missing constraint surfaced from
another manager, narrowed scope, etc.). If you cannot name a
genuinely new angle, stop retrying that manager and surface the
partial state. Do not silently retry beyond the cap.

Treat any dispatch failure (`TeamCreate` / `SendMessage` error,
manager non-response within reasonable time) as equivalent to a
`blocked` reply for status-transition purposes — do NOT mark the
mission `applied`.

Mission status transition: mark the mission `applied` in
`.teamworks/project.md` ONLY if every dispatched manager reports
status `done`. The status flip is a single-cell edit: change the row's
`status` cell from `approved` to `applied` in the `## Missions` table.
The table cell is the single source of truth for mission status; the
detail file does NOT carry a `status:` line and must not be edited in
`apply`. (`/teamworks:shutdown` later appends `applied-summary` to the
detail file as a separate concern.) If any manager is `partial` or
`blocked` after retries, leave the row's status as `approved` (do NOT
downgrade, do NOT mark `applied`). The user will intervene and re-run
`apply`.

## Task
Execute mission <mission-id>. Read the mission's row in
`.teamworks/project.md`'s `## Missions` table to confirm the
mission-id and status, then load the full mission body from
`.teamworks/missions/<mission-id>.md`. The detail file's `repos:`
field is the canonical dispatch list and its `specs:` block lists the
per-repo spec paths. Dispatch the managers for those repos in
parallel with `Phase: apply` and a `## Task` that points each manager
at its own approved spec for TDD execution. Synthesise their replies,
apply the retry policy on failures, and report per-repo status to the
outer session.

## Expected Reply
- mission-id: <mission-id>
- status-after: applied | approved (still)
- per-repo:
  - <repo>: status (done | partial | blocked), files-changed,
    tests-pass / tests-fail, blockers (if any)
- summary: <one paragraph describing what was executed and the
  aggregate outcome>
- blockers: <aggregate blockers across repos, if any>
- next-step: "user owns git from here" (always include this line)
```
<!-- /SYNCED -->

Substitute the real `<mission-id>` and the one-line mission summary
before sending.

## Step 5: Wait for team-lead's report and forward verbatim

Wait for team-lead's reply. Forward the report to the user verbatim —
do not summarise or paraphrase. The expected report includes:

- the `mission-id`,
- the `status-after` (`applied` if every manager reported `done`,
  otherwise still `approved`),
- per-repo status: which files changed in which repos, which tests
  pass / fail, which managers are `partial` or `blocked`,
- a one-paragraph summary of the executed mission,
- aggregate blockers if any manager hit retry cap or stopped on no
  new angle,
- a closing `next-step` line reminding the user they own git.

If team-lead asks a clarifying question, relay it to the user,
capture the reply, and `SendMessage` it back to team-lead. Repeat
until team-lead reports completion.

After forwarding, append a final line of your own that reinforces:
`Nothing has been committed. The user owns git from here — review
the working tree, commit, and push when ready.`

## Step 6: Tear down team-lead

Once team-lead has reported completion, tear down the spawned
team-lead agent so it does not persist past this command. Call
`TeamDelete` on the team-lead agent created in Step 4. Do not
fire-and-forget; explicitly invoke `TeamDelete` before exiting the
command.

Print a one-line confirmation that `apply` is complete (including
the `mission-id` and the resulting status: `applied` or still
`approved`) and that team-lead has been torn down via `TeamDelete`.
