# Mission Block Schema

The mission block lives inside `.teamworks/project.md`'s `## Missions` section, and is also persisted as a detail file at `.teamworks/missions/<id>.md`.

NOTE: this file describes the CURRENT (pre-table) format. Commit 2 of the refactor introduces a table-row + detail-file split (see `mission-table.md` and `mission-detail.md` once they exist). For now, this is the v1 format used by all consumers as of branch tip 7820df4.

## v1 Format (current)

`/teamworks:propose` writes mission blocks to `.teamworks/project.md` under the `## Missions` section. `/teamworks:apply` and `/teamworks:shutdown` parse them. The block grammar is line-oriented:

- One blank line separates mission blocks.
- Each block contains these lines, each on its own line, in this order:
  - `mission-id: m-YYYYMMDD-<slug>` — kebab-case slug, no spaces.
  - `status: approved | applied` — exactly one of these two.
  - `description: <one paragraph>` — single line; multi-paragraph descriptions are NOT supported.
  - `repos: [<repo-name>, <repo-name>, ...]` — JSON-style list of repo names matching `<name>` in `.teamworks/repos/<name>.md`.
  - `specs:` followed by one indented bullet per spec path:
    - `  - <repo>: <path-to-spec-artifact>`
- Optional trailing line (added by `/teamworks:shutdown` when the mission is applied):
  - `applied-summary: session ended at YYYY-MM-DD HH:MM UTC`

Parsers MUST anchor matches (e.g. `^mission-id: <id>$`, not substring) to avoid prefix collisions.

The `## Missions` section MUST remain the final section of project.md (shutdown's append relies on EOF == end-of-last-mission-block).

## Notes

- Inlined description lives in: init.md (Mission Block Schema section).
- Writers: propose.md.
- Parsers: apply.md (awk in Step 3), shutdown.md (Step 5).
- This file will be superseded by `mission-table.md` + `mission-detail.md` in Commit 2.
