# Repo Identity Card Schema

`.teamworks/repos/<name>.md` files describe each registered repo's static info and current role in the workspace's mission.

## Format

```markdown
# <repo-name>

## Static
- Lang: <language(s) and major framework(s)>
- Entry: <entry point file or directory>
- Test: <test command>
- Purpose: <one-line purpose>

## Current Role in Mission
- Mission: <description of current cross-repo work or "(none active)">
- Responsibilities: <one paragraph or bullets describing this repo's role>
```

## Constraints

- The card SHOULD fit in approximately 2KB. Long-form repo knowledge (architecture details, design decisions, READMEs) belongs IN the repo, not in this card.
- The card MUST NOT contain TODO lists; per-repo work tracking belongs in the repo's own SDD/TDD artifacts.
- The card MUST NOT contain topology information (who calls whom); that lives in `.teamworks/topology.md`.

## Writers

- team-lead.md (writes on `/teamworks:add-repo`, may update `## Current Role` during propose).
- repo-manager.md (may update its own card during work; this is the only meta file the manager may edit).
