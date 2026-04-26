# Dispatch Payload Schema

The structured SendMessage payload that team-lead sends to a repo-manager (and that repo-manager uses for cross-manager queries with `Phase: query`).

## Template

```markdown
## Mission
<mission-id>: <one-line summary>

## Phase
propose | apply | explore | onboard | query

## Repo Context
(omit if Phase: query — recipient already has its own card)

## Cross-repo Constraints
<topology slice and any phase-specific constraints>
(omit if Phase: query)

## Task
<concrete instructions>

## Expected Reply
- artifact-paths: [<files-or-dirs>]
- summary: <bullets>
- blockers: <if any>
```

## Notes

- Phase enum is closed; any value other than the 5 listed must be rejected by the receiver.
- For Phase: query (cross-manager), omit Repo Context and Cross-repo Constraints.
- Inlined copies live in: team-lead.md (Dispatch protocol), repo-manager.md (cross-manager outgoing), every command that spawns team-lead.
