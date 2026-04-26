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

The mission must be present in `.teamworks/project.md` AND its status
must be `approved`. Search the mission block and confirm both with an
exact-match parser (substring matches would collide on prefix-shared
mission-ids such as `m-20260426-foo` vs `m-20260426-foo-extra`):

```bash
awk -v id="<mission-id>" '
  $0 == "mission-id: " id { found=1; block=1; next }
  block && /^mission-id: / { block=0 }
  block && /^status: / { print; status_seen=1; exit }
  END {
    if (!found) print "missing"
    else if (!status_seen) print "no-status"
  }
' .teamworks/project.md
```

Decision rules:

- If the parser prints `missing`, the mission-id is not in
  `.teamworks/project.md`; refuse with a clear error: `mission
  <mission-id> not found in .teamworks/project.md — run
  /teamworks:propose first`.
- If the parser prints `no-status`, the mission block exists but has
  no `status:` line (malformed block); refuse with: `mission
  <mission-id> block is malformed: no status line found — fix
  .teamworks/project.md by hand or re-run /teamworks:propose`. Do
  NOT proceed.
- If the parser prints `status: <X>` and `<X>` is not `approved`
  (e.g. `applied` or anything else), refuse with a clear error
  naming the actual status: `mission <mission-id> has status <X>;
  apply requires status: approved`. Do NOT downgrade an `applied`
  mission back to `approved` — tell the user to draft a new mission
  via `/teamworks:propose` if they need to redo the work.
- If approved, also confirm the mission has a non-empty `repos:`
  list (or, for legacy missions, at least one spec path). If the
  `repos:` list is empty / missing AND no spec paths are recorded,
  refuse: `mission <mission-id> has no affected repos; nothing to
  apply`. (Strict propose semantics from Task 8 should prevent this,
  but check defensively.)
- On pass, note the mission's `repos:` list and spec paths so you can
  cross-check team-lead's report later. Do not pass them in the
  payload — team-lead reads them itself from `.teamworks/project.md`.

## Step 4: Spawn team-lead and dispatch (Phase: apply)

Use `TeamCreate` to spawn the bundled `team-lead` agent. Then send
the first message via `SendMessage` using the structured payload that
team-lead expects (see `agents/team-lead.md` Section "Dispatch
protocol"). The `Phase` is `apply`. Use this payload shape:

<!-- SYNCED FROM reference/dispatch-payload.md — edit there, then re-sync here -->
```markdown
## Mission
<mission-id>: <one-line summary lifted from the mission block>

## Phase
apply

## Repo Context
(workspace-level execution — team-lead loads the mission from
`.teamworks/project.md`, reads its `repos:` field for the canonical
dispatch set, and falls back to deriving repo names from the recorded
spec paths only if `repos:` is missing on a legacy mission)

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
status `done`. If any manager is `partial` or `blocked` after
retries, leave the mission as `approved` (do NOT downgrade, do NOT
mark `applied`). The user will intervene and re-run `apply`.

## Task
Execute mission <mission-id>. Read the mission block from
`.teamworks/project.md` to get the `repos:` list (or fall back to
spec paths if `repos:` is missing on a legacy mission) and the spec
paths. Dispatch the managers for those repos in parallel with
`Phase: apply` and a `## Task` that points each manager at its own
approved spec for TDD execution. Synthesise their replies, apply the
retry policy on failures, and report per-repo status to the outer
session.

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
