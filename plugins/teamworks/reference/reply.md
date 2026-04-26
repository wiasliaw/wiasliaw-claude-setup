# Reply Schema

The structured response that repo-manager sends back to team-lead (or to a peer repo-manager during cross-manager exchange).

## Template

```markdown
## Status
done | partial | blocked

## Artifacts
- <path>: <one-line description>

## Summary
- <bullets>

## Blockers
- <if status != done>

## Next-step suggestion (optional)
- <manager's suggestion>
```

## Notes

- Status enum is closed: only `done`, `partial`, `blocked`. Any other value MUST be treated by team-lead as `blocked` (this triggers retry policy).
- Missing `## Status` section MUST also be treated as `blocked`.
- Inlined copies live in: repo-manager.md (Reply protocol), team-lead.md (Expected Reply contract).
