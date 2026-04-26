# Phase Enum

The `Phase` field in a dispatch payload MUST be exactly one of these five values.

## Closed enumeration

| Value | Direction | Used by |
|---|---|---|
| `propose` | team-lead -> repo-manager | /teamworks:propose |
| `apply` | team-lead -> repo-manager | /teamworks:apply |
| `explore` | team-lead -> repo-manager | /teamworks:explore |
| `onboard` | team-lead -> repo-manager | /teamworks:add-repo, /teamworks:add-agent |
| `query` | repo-manager -> repo-manager (cross-manager only) | repo-manager spontaneously |

## Receiver behaviour

If a receiver sees `Phase:` with any value other than the five listed:
- Stop processing the dispatch.
- Reply with `Status: blocked` and a one-line blocker explaining the unknown phase.

This is a closed enum; do not add new phase values without updating this file, every inlined copy, and every command that uses Phase.

## Notes

- Inlined copies live in: team-lead.md (Dispatch protocol), repo-manager.md (cross-manager outgoing).
