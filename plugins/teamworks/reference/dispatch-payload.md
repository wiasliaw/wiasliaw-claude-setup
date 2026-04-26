# Dispatch Payload Schema

The structured SendMessage payload that team-lead sends to a repo-manager (and that repo-manager uses for cross-manager queries with `Phase: query`).

## Template

The block between `<!-- CANONICAL -->` markers below is the source of truth — every SYNCED inline elsewhere in the plugin MUST byte-match it. Customisation (specific Phase value, filled-in Task prose, etc.) belongs OUTSIDE the SYNCED block in the consumer file (typically as a follow-up "fill in like:" example without sync markers).

<!-- CANONICAL -->
```markdown
## Mission
<mission-id>: <one-line summary>

## Phase
propose | apply | explore | onboard | query

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
<!-- /CANONICAL -->

## Notes

- Phase enum is closed; any value other than the 5 listed must be rejected by the receiver.
- For Phase: query (cross-manager), omit Cross-repo Constraints (fold any constraint into Task prose if needed).
- Identity card is read from disk by the receiving manager (`.teamworks/repos/<name>.md`). The dispatch does NOT inline it. This avoids double IO (team-lead reading the card to inline + manager re-reading it on receipt) and bounds dispatch payload size.
- Inlined copies live in: team-lead.md (Dispatch protocol), repo-manager.md (cross-manager outgoing), every command that spawns team-lead.

## Retry elision (within a single command)

When sending a retry dispatch to the same manager during the same parent command, you may write `## Cross-repo Constraints: unchanged` in place of repeating the previous content. The receiver MUST keep the prior dispatch's constraints in effect. Only `## Task` MUST be regenerated — the new angle that justifies the retry is the whole point of the retry; everything else is static.

Rules:

- Elision is only valid for a retry of the same manager within the same parent command. Across commands or against a different manager, re-inline.
- The literal value after the colon MUST be exactly `unchanged` (lowercase, no surrounding punctuation). Anything else is treated as a normal constraints block by the receiver.
- `## Mission`, `## Phase`, and `## Expected Reply` are still emitted normally (they are short).
- The receiver, on seeing `## Cross-repo Constraints: unchanged`, falls back to the constraints from the previous dispatch in this command. If it has no previous dispatch in memory, it MUST reply `blocked` with a one-line note ("retry elision used but no prior constraints in scope") rather than guess.
