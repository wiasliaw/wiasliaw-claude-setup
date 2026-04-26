# Mission Schema (v2: table + detail)

Missions are stored in two places:

1. A row in `.teamworks/project.md`'s `## Missions` table (the index).
2. A detail file at `.teamworks/missions/<mission-id>.md` (the full mission content).

This split bounds `project.md` size: the table grows ~1 row per mission, and full mission contents live in per-mission files that consumers load only when needed.

## v2 Table Row Format

The `## Missions` section in `project.md` is a markdown table:

```markdown
## Missions
| mission-id | status | description | repos | detail |
|---|---|---|---|---|
| m-YYYYMMDD-<slug> | approved \| applied | <one-line description> | [<repo>, <repo>] | missions/<mission-id>.md |
```

Constraints:
- mission-id: kebab-case slug, no spaces, format `m-YYYYMMDD-<slug>`.
- status: exactly one of `approved` or `applied`.
- description: ONE LINE. Must not contain pipe (`|`) characters; replace with `/` or `,` if needed.
- repos: JSON-style list `[name, name]`. Repo names match `<name>` in `.teamworks/repos/<name>.md`.
- detail: relative path `missions/<mission-id>.md` (relative to `.teamworks/`).

## v2 Detail File Format

Each mission's full content lives at `.teamworks/missions/<mission-id>.md`:

```markdown
# Mission: <mission-id>

- mission-id: <mission-id>
- description: <one-line description, same as table row>
- repos: [<repo>, <repo>]
- created: YYYY-MM-DD HH:MM UTC
- specs:
  - <repo>: <path-to-spec-artifact relative to that repo's root>
  - <repo>: <path>
- applied-summary: session ended at YYYY-MM-DD HH:MM UTC   (added by shutdown when applicable)
```

Status is deliberately NOT in the detail file. The single source of truth for a mission's status is the `status` cell of its row in `project.md`'s `## Missions` table — duplicating it in the detail file would create a drift hazard. `apply` flips the table cell; `shutdown` only appends `applied-summary` to the detail file. Neither writes a `status:` line into the detail file.

The `applied-summary` line is added by `/teamworks:shutdown` only when status flips to `applied`. Optional otherwise; its presence is a de-facto marker that the mission was applied (the table cell is the authoritative source).

## Writers

- `/teamworks:propose`: writes a new table row to `project.md` AND creates the detail file.
- `/teamworks:apply`: flips the table row's `status` cell from `approved` to `applied` (only if all managers `done`); does NOT modify the detail file.
- `/teamworks:shutdown`: appends the `applied-summary` line to the detail file (NOT to `project.md`). Does NOT modify the table.

## Parsers

- `/teamworks:apply` reads:
  - `project.md`'s `## Missions` table to find the row matching `<mission-id>` and verify `status: approved`.
  - The detail file at `missions/<mission-id>.md` for full mission data (description, repos, specs).
- `/teamworks:shutdown` reads:
  - `project.md`'s table to find the latest mission with `status: applied` (the last table row whose status cell is `applied`).
  - The detail file for that mission to check whether `applied-summary` already exists.

## Anchoring rules

When parsers grep the table for a mission-id:
- Must anchor on the exact mission-id between `|` delimiters: `| m-20260426-foo |`, NOT a substring match on `m-20260426-foo` (which would match `m-20260426-foo-extra`).
- The detail-path column gives an unambiguous filename — use it after parsing the row.

## Notes

- Inlined description lives in: `init.md` (the table skeleton + detail-file shape).
- Writers: `propose.md` (row + detail file), `apply.md` (status cell flip), `shutdown.md` (applied-summary appended to detail file).
- Parsers: `apply.md` (Step 3 awk on the table; then read detail file), `shutdown.md` (Step 5 scan table for latest applied row, then read detail file).
- The `## Missions` section MUST remain the final section of `project.md`. v2 no longer appends to `project.md` from `shutdown`, but keeping the table last simplifies parsers (table extends to EOF) and preserves the cwd-anchored append rules from v1.
