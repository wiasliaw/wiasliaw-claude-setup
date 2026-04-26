---
allowed-tools: Bash, Read, Write, TeamCreate, TeamDelete
description: Reap stray Team agents, append today's log summary, and append a session summary to the latest applied mission's detail file if it lacks one. Preserves .teamworks/.
---

Announce: "Using teamworks:shutdown to close the workspace session."

The slash command syntax is `/teamworks:shutdown` and takes no
arguments. This command does NOT spawn `team-lead`; it operates
directly on `.teamworks/log/` and `.teamworks/missions/<id>.md` from
the outer session. It is one of two commands (alongside
`/teamworks:init`) that touches files without going through
`team-lead`. It also does NOT use `SendMessage`. `TeamCreate` is
listed in `allowed-tools` for parity with the other team-spawning
commands but is not invoked here.

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
shutdown line in the same `[HH:MM] [<from> -> <to>] <summary>` shape
used by `team-lead` and `repo-manager`. Shutdown is not a real
`SendMessage`, so the synthetic recipient is `session` (the outer
session that invoked `/teamworks:shutdown`):

<!-- SYNCED FROM reference/log-format.md — edit there, then re-sync here -->
```bash
if [ -f "$LOG" ]; then
  N=$(grep -c '' "$LOG")
  printf '[%s] [shutdown -> session] session ended; %s entries this session\n' "$TIME" "$N" >> "$LOG"
fi
```
<!-- /SYNCED -->

`grep -c ''` counts every line including an unterminated final line
(unlike `wc -l`, which under-counts when the file lacks a trailing
newline).

Append-only; never rewrite earlier log entries.

## Step 5: Top up the latest applied mission's detail file

Read `.teamworks/project.md` and scan its `## Missions` table for the
latest row whose `status` cell is `applied`. "Latest" means the last
such row in document order — the table is append-only by `propose`, so
the bottom row is the most recent. Then read that row's `detail` cell
to get the path to the per-mission detail file. Apply this
conservative rule:

- If there is no row in the table at all (only the header + separator),
  skip.
- If no row has `status` cell `applied` (every mission is still
  `approved`), skip — the session ended without completing any
  mission; do not paper over that.
- If the latest `applied` row's detail file does not exist on disk,
  skip — surface this in the confirmation as `skipped — detail file
  missing` so the user can investigate. Never recreate the file.
- If the detail file already contains a line starting with the exact
  prefix `applied-summary: ` (anywhere in the file), skip — it has
  been topped up before. Use exact prefix; do not accept any other
  "trailing summary" — too permissive.
- Otherwise, append exactly one short line to the end of the detail
  file. Compute the timestamp inline and append in a single shell
  invocation:

  ```bash
  DETAIL=".teamworks/<detail-cell-from-row>"   # e.g. .teamworks/missions/m-20260426-fee.md
  APPLIED_AT=$(date -u +"%F %H:%M")
  printf 'applied-summary: session ended at %s UTC\n' "$APPLIED_AT" >> "$DETAIL"
  ```

  Do not edit `project.md` in this step. Do not edit anything else in
  the detail file beyond appending this single line. Do not touch
  earlier missions' detail files.

Locate the latest applied row with an awk parser over the table that
extracts mission-id (column 2) and detail (column 6) from each data
row, keeps the last row whose status cell (column 3) equals `applied`,
and prints the detail path:

```bash
LATEST=$(awk -F'|' '
  /^\|/ {
    id = $2; gsub(/^[[:space:]]+|[[:space:]]+$/, "", id)
    st = $3; gsub(/^[[:space:]]+|[[:space:]]+$/, "", st)
    dt = $6; gsub(/^[[:space:]]+|[[:space:]]+$/, "", dt)
    # Skip the header row (id == "mission-id") and separator (id starts with "-").
    if (id == "mission-id" || id ~ /^-+$/ || id == "") next
    if (st == "applied") { last_id = id; last_detail = dt }
  }
  END { if (last_id != "") printf "%s\t%s\n", last_id, last_detail }
' .teamworks/project.md)
```

If `$LATEST` is empty, skip. Otherwise the first tab-separated field
is the mission-id (for the confirmation line) and the second is the
detail path relative to `.teamworks/`.

If you are not certain which row is the latest applied row, prefer to
skip rather than edit. This step is best-effort and must never corrupt
the detail file.

## Step 6: Print confirmation

Print a short confirmation listing exactly what was done, for example:

```text
shutdown complete:
- agents reaped: <N> (or "none")
- log appended: .teamworks/log/<DATE>.md (or "skipped — no log today")
- mission detail: applied-summary added to missions/<mission-id>.md (or "skipped")
.teamworks/ is preserved.
```

Do NOT delete `.teamworks/`. Do NOT delete `.teamworks/log/` or any
log file. Do NOT run any git operation. The workspace stays intact for
the next session.
