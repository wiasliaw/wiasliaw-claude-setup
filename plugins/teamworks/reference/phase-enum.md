# Phase Enum

The `Phase` field in a dispatch payload MUST be exactly one of these five values.

## Closed enumeration

The block between `<!-- CANONICAL -->` markers below is the source of truth — every SYNCED inline elsewhere in the plugin (currently none; reserved for future use) MUST byte-match it.

<!-- CANONICAL -->
| Value | Direction | Used by |
|---|---|---|
| `propose` | team-lead -> repo-manager | /teamworks:propose |
| `apply` | team-lead -> repo-manager | /teamworks:apply |
| `explore` | team-lead -> repo-manager | /teamworks:explore |
| `onboard` | team-lead -> repo-manager | /teamworks:add-repo, /teamworks:add-agent |
| `query` | repo-manager -> repo-manager (cross-manager only) | repo-manager spontaneously |
<!-- /CANONICAL -->

## Receiver behaviour

If a receiver sees `Phase:` with any value other than the five listed:
- Stop processing the dispatch.
- Reply with `Status: blocked` and a one-line blocker explaining the unknown phase.

This is a closed enum; do not add new phase values without updating this file, every inlined copy, and every command that uses Phase.

## Notes

- No SYNCED inlines exist for this enum today. team-lead.md and repo-manager.md reference the phase values prosaically (e.g. `propose | apply | explore | onboard | query`); if a future change needs the full enum table inlined, add a SYNCED block referencing this file and update this note.
