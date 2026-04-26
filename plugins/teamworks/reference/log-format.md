# Log Line Format

Every Team-side actor (team-lead, every repo-manager, the outer session for shutdown) appends to `.teamworks/log/YYYY-MM-DD.md`.

## Format

The block between `<!-- CANONICAL -->` markers below is the source of truth — every SYNCED inline elsewhere in the plugin MUST byte-match it. Concrete shell snippets that USE this format (e.g. shutdown.md's `printf` command) are NOT inside SYNCED markers; only the format string itself is canonical.

<!-- CANONICAL -->
```text
[HH:MM] [<from> -> <to>] <one-line summary>
```
<!-- /CANONICAL -->

- `HH:MM` is UTC time, 24-hour.
- `<from>` and `<to>` are agent identifiers (e.g. `team-lead`, `repo-manager:indexer`, `shutdown`, `session`).
- For synthetic events (no real recipient), use `<actor> -> session` (e.g. `[shutdown -> session]`, `[init -> session]` if init ever logs).
- One line per entry; append-only.

## Anchors

The log gains structured headings that team-lead can `awk`-seek between during synthesis instead of scanning the whole file:

- **Top-level command anchor**: `## command: <command-name> <YYYY-MM-DD HH:MM UTC>` — emitted by every command at start (init, add-repo, add-agent, explore, propose, apply, shutdown). One per command invocation.
- **Mission-tied sub-anchor**: `### mission: <mission-id>` — emitted by `/teamworks:propose` immediately after team-lead returns the allocated mission-id, and by `/teamworks:apply` immediately after dispatch begins against the existing mission. One per mission-tied command run.

The append-only `[HH:MM] [<from> -> <to>] <summary>` line format is unchanged. Anchors are H2/H3 markdown headings that sit between log entries.

### Example layout

```text
## command: add-repo 2026-04-26 13:50 UTC

[13:50] [team-lead -> indexer] dispatch: onboard
[13:51] [indexer -> team-lead] reply: done; identity card written

## command: propose 2026-04-26 14:02 UTC

### mission: m-20260426-fee-on-transfer

[14:03] [team-lead -> indexer] dispatch: propose (regenerate types from new ABI)
[14:07] [indexer -> team-lead] reply: done; spec at openspec/changes/fee/proposal.md
[14:11] [indexer -> token-contract] query: confirm event signature
[14:13] [token-contract -> indexer] reply: done; FeeApplied(address,uint256,uint256)

## command: apply 2026-04-26 14:30 UTC

### mission: m-20260426-fee-on-transfer

[14:31] [team-lead -> indexer] dispatch: apply
[14:42] [indexer -> team-lead] reply: done; tests passing
```

## Notes

- Anchors are emitted by the slash command (and by `propose`/`apply` for mission sub-anchors); team-lead and repo-managers do NOT emit anchors themselves — they only append `[HH:MM] [from -> to] summary` lines.
- Synthesis-time reads can `awk` between `## command:` headings (or between `### mission:` headings) to scope to the relevant slice of the day, rather than reading the whole file.
- Inlined copies live in: team-lead.md (Logging duty), repo-manager.md (Logging duty), shutdown.md (Step 4 log append), every command (Step 1 anchor write).
- shutdown.md's appended line uses `[shutdown -> session]` for the from/to.
