---
allowed-tools: Bash, Read, Write, TeamCreate, TeamDelete
description: Reap stray Team agents, append today's log summary, and append a session summary to project.md if the latest mission lacks one. Preserves .teamworks/.
---

Announce: "Using teamworks:shutdown to close the workspace session."

The slash command syntax is `/teamworks:shutdown` and takes no
arguments. This command does NOT spawn `team-lead`; it operates
directly on `.teamworks/log/` and `.teamworks/project.md` from the
outer session. It is one of two commands (alongside `/teamworks:init`)
that touches files without going through `team-lead`. It also does NOT
use `SendMessage`. `TeamCreate` is listed in `allowed-tools` for
parity with the other team-spawning commands but is not invoked here.

This command performs no git operations; the user owns git.

## Step 0: Confirm working directory

Run `pwd` and confirm with the user that the current directory is the
intended workspace root before touching anything. Shutdown writes to
relative paths under `.teamworks/`; if you are in the wrong directory
you will edit the wrong workspace. If unsure, stop and ask.

```bash
pwd
```

## Step 1: Announce

Print the announce line above.

## Step 2: Validate `.teamworks/` exists

The current working directory must be the workspace root containing
`.teamworks/`. Check with:

```bash
[ -d .teamworks ] && echo ok || echo missing
```

If the directory is missing, print `no workspace found, nothing to do`
and exit cleanly. Do not create `.teamworks/`; do not error.

## Step 3: Reap stray Team agents

Try to enumerate live Team agents using whatever Team-list capability
the outer session exposes. If no enumeration tool is available in this
session, print exactly:

```text
cannot enumerate team agents; skipping reap (will rely on session-end auto-cleanup)
```

and proceed to Step 4. Do NOT invent a tool name.

If enumeration is available, list any live Team agents (typically the
bundled `team-lead` and any `repo-manager` instances spawned during
this session). For every agent matching one of those names, call
`TeamDelete` to tear it down.

Behaviour notes:

- If the enumeration tool does not expose a workspace identifier,
  reap any live agent named `team-lead` or `repo-manager` — outside
  this workspace they should not exist anyway, since other commands
  always tear down what they spawn.
- If enumeration returns nothing, skip without error.
- Tear down in any order; they do not depend on each other.

Print a one-line summary: either `reaped N stray agents` (with the
count) or `no stray agents`.

## Step 4: Append today's log summary

Compute today's UTC date and time:

```bash
DATE="$(date -u +%F)"
TIME="$(date -u +%H:%M)"
LOG=".teamworks/log/${DATE}.md"
```

If `$LOG` does not exist, skip this step (no activity was logged
today). Otherwise count its existing entries and append a single
shutdown line in the same `[HH:MM] [<from>] <summary>` shape used by
`team-lead` and `repo-manager` (no source/target arrow because
shutdown is not a `SendMessage`):

```bash
if [ -f "$LOG" ]; then
  N=$(grep -c '' "$LOG")
  printf '[%s] [shutdown] session ended; %s entries this session\n' "$TIME" "$N" >> "$LOG"
fi
```

`grep -c ''` counts every line including an unterminated final line
(unlike `wc -l`, which under-counts when the file lacks a trailing
newline).

Append-only; never rewrite earlier log entries.

## Step 5: Top up `.teamworks/project.md`

Read `.teamworks/project.md` and locate the latest mission block under
`## Missions` (the last entry in the section). Apply this conservative
rule:

- If there is no mission block at all, skip.
- If the latest mission's `status:` line is `approved` (not yet
  applied), skip — the session ended without completing the mission;
  do not paper over that.
- If the latest mission's `status:` line is `applied` AND the last
  non-blank line of that mission block already starts with the exact
  prefix `applied-summary: `, skip — it has been topped up before.
  (Use exact prefix; do not accept any other "trailing summary" — too
  permissive.)
- If the latest mission is `applied` AND its last non-blank line does
  not start with `applied-summary: `, append exactly one short line
  to the end of that mission block. Compute the timestamp inline and
  append in a single shell invocation so no variable needs to survive
  across separate code blocks:

  ```bash
  APPLIED_AT=$(date -u +"%F %H:%M")
  printf 'applied-summary: session ended at %s UTC\n' "$APPLIED_AT" >> .teamworks/project.md
  ```

  Do not edit anything else in `project.md`; do not touch any earlier
  mission block. This relies on the invariant from `init.md` that
  `## Missions` is the final section of `project.md`.

If you are not certain which line is the end of the latest mission
block, prefer to skip rather than edit. This step is best-effort and
must never corrupt the file.

## Step 6: Print confirmation

Print a short confirmation listing exactly what was done, for example:

```text
shutdown complete:
- agents reaped: <N> (or "none")
- log appended: .teamworks/log/<DATE>.md (or "skipped — no log today")
- project.md: applied-summary added to <mission-id> (or "skipped")
.teamworks/ is preserved.
```

Do NOT delete `.teamworks/`. Do NOT delete `.teamworks/log/` or any
log file. Do NOT run any git operation. The workspace stays intact for
the next session.
