# Log Line Format

Every Team-side actor (team-lead, every repo-manager, the outer session for shutdown) appends to `.teamworks/log/YYYY-MM-DD.md`.

## Format

```text
[HH:MM] [<from> -> <to>] <one-line summary>
```

- `HH:MM` is UTC time, 24-hour.
- `<from>` and `<to>` are agent identifiers (e.g. `team-lead`, `repo-manager:indexer`, `shutdown`, `session`).
- For synthetic events (no real recipient), use `<actor> -> session` (e.g. `[shutdown -> session]`, `[init -> session]` if init ever logs).
- One line per entry; append-only.

## Notes

- Inlined copies live in: team-lead.md (Logging duty), repo-manager.md (Logging duty), shutdown.md (Step 4 log append).
- shutdown.md's appended line uses `[shutdown -> session]` for the from/to.
