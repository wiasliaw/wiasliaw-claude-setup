# teamworks Plugin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task.

**Goal:** Ship the `teamworks` plugin (cross-repo orchestrator) per
`docs/plans/2026-04-26-teamworks-design.md`. Final artifact is a new
plugin under `plugins/teamworks/` registered in
`.claude-plugin/marketplace.json`.

**Architecture:** Plugin contains 2 bundled agents (`team-lead`,
`repo-manager`) and 7 slash commands (`init`, `add-repo`, `add-agent`,
`explore`, `propose`, `apply`, `shutdown`). All cross-repo state lives
in the user workspace's `.teamworks/` directory; the plugin itself
ships only definitions, not state.

**Tech stack:** Markdown with YAML frontmatter (no code). Validation
via the repo's existing scripts: ESLint markdown plugin, two TypeScript
validators in `.github/scripts/`.

**Source of truth:** `docs/plans/2026-04-26-teamworks-design.md`. When
this plan says "per design doc Section X", read that section before
authoring.

**Conventions to follow:** Mirror the `plugins/autoresearch/` style:

- `plugin.json` shape: `{ name, description, author: { name } }`.
- Commands: `allowed-tools` and `description` in frontmatter; first
  body line is `Announce: "..."`; numbered steps.
- Code blocks always have a language (lint enforces this; use `text`
  for ASCII art).

---

## Verification commands (used throughout)

Run from repo root:

| Purpose | Command |
| --- | --- |
| Markdown lint | `pnpm lint` |
| Frontmatter validation | `node --experimental-strip-types .github/scripts/validate-frontmatter.ts plugins/teamworks` |
| Marketplace shape | `node --experimental-strip-types .github/scripts/validate-marketplace.ts .claude-plugin/marketplace.json` |
| Marketplace sort | `node --experimental-strip-types .github/scripts/check-marketplace-sorted.ts` |

Each task ends with the relevant subset.

---

### Task 1: Plugin scaffold + marketplace entry

**Files:**

- Create: `plugins/teamworks/.claude-plugin/plugin.json`
- Modify: `.claude-plugin/marketplace.json` (add `teamworks` entry,
  alphabetically after `autoresearch`)

**Step 1: Create plugin.json**

Write `plugins/teamworks/.claude-plugin/plugin.json`:

```json
{
  "name": "teamworks",
  "description": "Cross-repo orchestrator built on Claude Code Team. Treat a folder as a workspace of independent git repos; one repo-manager agent per repo, coordinated by a team-lead agent. Provides slash commands for init, add-repo, propose, apply, explore, and shutdown.",
  "author": {
    "name": "wiasliaw"
  }
}
```

**Step 2: Add marketplace entry**

Append to the `plugins` array in `.claude-plugin/marketplace.json`:

```json
{
  "name": "teamworks",
  "description": "Cross-repo orchestrator. Workspace folder + one repo-manager agent per repo + team-lead agent, communicating via Claude Code Team SendMessage.",
  "source": "./plugins/teamworks"
}
```

`teamworks` sorts after `autoresearch`, so just append.

**Step 3: Verify**

Run:

```bash
node --experimental-strip-types .github/scripts/validate-marketplace.ts .claude-plugin/marketplace.json
node --experimental-strip-types .github/scripts/check-marketplace-sorted.ts
```

Expected: both exit 0; sort check prints nothing or "ok".

**Step 4: Commit**

```bash
git add plugins/teamworks/.claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "feat(teamworks): add plugin scaffold and marketplace entry"
```

---

### Task 2: Agent — team-lead

**Files:**

- Create: `plugins/teamworks/agents/team-lead.md`

**Reference:** Design doc Section "Agents > Built-in: team-lead" and
"Key Behaviours" (all sub-sections).

**Step 1: Author frontmatter**

```yaml
---
name: team-lead
description: Cross-repo orchestrator. Reads .teamworks/, dispatches to repo-managers in parallel via SendMessage, owns project.md / topology.md / log/. Self-approves repo-manager specs, retries failures up to 3 times before escalating to user.
tools: Read, Edit, Write, Bash, SendMessage, TeamCreate, Task
model: sonnet
---
```

**Step 2: Author body**

Required sections (use `##` headings):

1. **Role** — one paragraph: orchestrator role, when invoked.
2. **Read scope** — `.teamworks/**` plus every repo (read-only).
3. **Write scope** — `.teamworks/**` only. Never edit a repo's files.
4. **Bash scope** — read-only commands (`ls`, `git log`, `gh pr list`).
   Explicitly forbid `git commit`, `git push`, `git branch -d`, etc.
5. **Dispatch protocol** — when SendMessaging a `repo-manager`, use the
   structured payload from design doc Section "Data Formats >
   SendMessage payload (team-lead -> repo-manager)". Inline the full
   payload template in this section so the agent does not need to
   cross-reference.
6. **Retry policy** — max 3 retries per failed manager; before each
   retry, must articulate a new angle; otherwise stop and report.
7. **Approval policy** — self-approves repo-manager specs and
   cross-repo missions. No user gate between propose and apply.
8. **Logging duty** — append every outgoing/incoming SendMessage to
   `.teamworks/log/YYYY-MM-DD.md` using format
   `[HH:MM] [<from> -> <to>] <one-line summary>`.
9. **Behaviour per command** — short blocks describing `add-repo`,
   `add-agent`, `explore`, `propose`, `apply` from the user's
   perspective (refer to design doc "Key Behaviours").

**Step 3: Verify**

```bash
node --experimental-strip-types .github/scripts/validate-frontmatter.ts plugins/teamworks
pnpm lint
```

Expected: 0 errors.

**Step 4: Commit**

```bash
git add plugins/teamworks/agents/team-lead.md
git commit -m "feat(teamworks): add team-lead agent"
```

---

### Task 3: Agent — repo-manager

**Files:**

- Create: `plugins/teamworks/agents/repo-manager.md`

**Reference:** Design doc Section "Agents > Built-in: repo-manager".

**Step 1: Author frontmatter**

```yaml
---
name: repo-manager
description: Single-repo owner spawned with cwd set to one repo. Runs SDD (openspec) and TDD inside that repo. Reports to team-lead via SendMessage. Cannot read or modify other repos.
tools: Read, Edit, Write, Bash, SendMessage, Task
model: sonnet
---
```

**Step 2: Author body**

Required sections:

1. **Role** — one paragraph: single-repo worker, spawned per dispatch.
2. **Onboarding** — first action on receiving a payload: read
   `.teamworks/repos/<self>.md` and the dispatch payload's `Repo
   Context` block. No further discovery needed.
3. **Read / Write scope** — own repo + own `.teamworks/repos/<self>.md`
   (the only meta file the manager may edit). Never read another repo.
4. **Bash scope** — cwd is own repo root. Never `git commit`, `git
   push`, or any git write op.
5. **SDD inside the repo** — use openspec; spec artifacts land in the
   repo's own spec structure.
6. **TDD discipline** — red, green, refactor; tests precede production
   code.
7. **Cross-repo info** — ask via SendMessage (team-lead or another
   manager). Inline the SendMessage payload format from design doc
   Section "Data Formats > SendMessage reply" for outgoing requests.
8. **Reply protocol** — when replying to team-lead, use the structured
   reply format from design doc Section "Data Formats > SendMessage
   reply". Inline the full template in this section.
9. **Logging duty** — append own outgoing/incoming SendMessage to
   `.teamworks/log/YYYY-MM-DD.md` (same format as team-lead).

**Step 3: Verify**

Same as Task 2 Step 3.

**Step 4: Commit**

```bash
git add plugins/teamworks/agents/repo-manager.md
git commit -m "feat(teamworks): add repo-manager agent"
```

---

### Task 4: Command — init

**Files:**

- Create: `plugins/teamworks/commands/init.md`

**Reference:** Design doc "Slash Commands" row for `init` and "Key
Behaviours" (this command is pure file scaffolding; no team-lead
spawn).

**Step 1: Author frontmatter**

```yaml
---
allowed-tools: Bash, Read, Write
description: Initialize the .teamworks/ skeleton in the current workspace folder. Pure file bootstrap — does not spawn team-lead.
---
```

**Step 2: Author body**

```markdown
# teamworks:init

Announce: "Using teamworks:init to scaffold the workspace."

## Step 1: Refuse if already initialised

If `.teamworks/` already exists, stop and tell the user it is already
initialised. Do not overwrite.

## Step 2: Create directory skeleton

Run:

\`\`\`bash
mkdir -p .teamworks/repos .teamworks/log
\`\`\`

## Step 3: Create project.md

Write `.teamworks/project.md` with this skeleton:

\`\`\`markdown
# Workspace Mission

<one paragraph: ask the user>

## Settings
- max-retries: 3

## Specialty Agents
(none yet — add via /teamworks:add-agent)

## Missions
(none yet — propose via /teamworks:propose)
\`\`\`

Ask the user for the workspace mission paragraph and fill it in before
writing.

## Step 4: Create topology.md

Write `.teamworks/topology.md` with this skeleton:

\`\`\`markdown
# Topology

## Diagram

(empty — populated as repos are added via /teamworks:add-repo)

## Edges

| From | To | Kind | Notes |
| --- | --- | --- | --- |

## Shared Interfaces

(none yet)
\`\`\`

## Step 5: Verify

Confirm `.teamworks/{project,topology}.md` exist and `repos/`, `log/`
are empty directories. Print a one-line summary and suggest
`/teamworks:add-repo <path>` as the next step.
```

(In the actual file, the inner code blocks must be real triple
backticks, not escaped. The escaping above is for plan readability.)

**Step 3: Verify**

```bash
node --experimental-strip-types .github/scripts/validate-frontmatter.ts plugins/teamworks
pnpm lint
```

Expected: 0 errors.

**Step 4: Commit**

```bash
git add plugins/teamworks/commands/init.md
git commit -m "feat(teamworks): add init command"
```

---

### Task 5: Command — add-repo

**Files:**

- Create: `plugins/teamworks/commands/add-repo.md`

**Reference:** Design doc "Slash Commands" row for `add-repo` and "Key
Behaviours > add-repo".

**Step 1: Author frontmatter**

```yaml
---
allowed-tools: Bash, Read, SendMessage, TeamCreate, TeamDelete
description: Register a new repo into the workspace. Spawns team-lead, which produces .teamworks/repos/<name>.md and updates topology.md.
---
```

**Step 2: Author body**

The command body must:

1. Announce: `Using teamworks:add-repo to register <path>.`
2. Validate: `.teamworks/` exists (run `/teamworks:init` first if not).
3. Validate: target path is a directory containing `.git/`.
4. Spawn team-lead via `TeamCreate`. The team-lead's first message
   should include the `<path>` and the user's reason for adding it.
5. Wait for team-lead to: produce identity card, update topology, and
   report. Forward the report to the user verbatim.
6. Tear down team-lead at end of command.

Body uses 5 numbered steps, plus a final "Tear down" step.

**Step 3: Verify**

Same validation commands as Task 4 Step 3.

**Step 4: Commit**

```bash
git add plugins/teamworks/commands/add-repo.md
git commit -m "feat(teamworks): add add-repo command"
```

---

### Task 6: Command — add-agent

**Files:**

- Create: `plugins/teamworks/commands/add-agent.md`

**Reference:** Design doc "Slash Commands" row for `add-agent`.

**Step 1: Author frontmatter**

```yaml
---
allowed-tools: Bash, Read, SendMessage, TeamCreate, TeamDelete
description: Register a project-scoped specialty agent (e.g. security-reviewer, qa). Writes the definition to $project/.claude/agents/<role>.md and registers it in project.md.
---
```

**Step 2: Author body**

Steps:

1. Announce: `Using teamworks:add-agent to register <role>.`
2. Validate: `.teamworks/` exists.
3. Spawn team-lead. Forward `<role>` and `[brief]`.
4. Team-lead writes `.claude/agents/<role>.md` (NOT under
   `plugins/`; this lives in the user's workspace) with frontmatter
   `name`, `description`, plus a body that captures the role's
   responsibility and trigger conditions.
5. Team-lead appends an entry under `## Specialty Agents` in
   `.teamworks/project.md` with role name and one-line purpose.
6. Tear down.

**Step 3: Verify**

Same as Task 4 Step 3.

**Step 4: Commit**

```bash
git add plugins/teamworks/commands/add-agent.md
git commit -m "feat(teamworks): add add-agent command"
```

---

### Task 7: Command — explore

**Files:**

- Create: `plugins/teamworks/commands/explore.md`

**Reference:** Design doc "Key Behaviours > explore".

**Step 1: Author frontmatter**

```yaml
---
allowed-tools: Bash, Read, SendMessage, TeamCreate, TeamDelete
description: Ask the team-lead a question about the workspace. Read-only against .teamworks/; dispatches managers in parallel for investigation; only log/ is appended.
---
```

**Step 2: Author body**

Steps:

1. Announce.
2. Validate `.teamworks/` exists.
3. Spawn team-lead. Forward `<question>`. Instruct: "this is a
   read-only investigation; do not modify project.md, topology.md, or
   any repos/<name>.md".
4. Wait for team-lead to dispatch managers in parallel and synthesise
   an answer. Forward to user.
5. Tear down.

**Step 3: Verify**

Same as Task 4 Step 3.

**Step 4: Commit**

```bash
git add plugins/teamworks/commands/explore.md
git commit -m "feat(teamworks): add explore command"
```

---

### Task 8: Command — propose

**Files:**

- Create: `plugins/teamworks/commands/propose.md`

**Reference:** Design doc "Key Behaviours > propose".

**Step 1: Author frontmatter**

```yaml
---
allowed-tools: Bash, Read, SendMessage, TeamCreate, TeamDelete
description: Run cross-repo SDD via openspec. Team-lead dispatches managers, self-approves their specs, writes a mission block to project.md, and updates topology.md if interfaces change.
---
```

**Step 2: Author body**

Steps:

1. Announce.
2. Validate `.teamworks/` exists.
3. Spawn team-lead. Forward `<description>`.
4. Wait for team-lead to:
   - Identify affected repos.
   - Dispatch each affected manager in parallel: each runs openspec
     inside its repo and replies with the spec path and summary.
   - Self-approve each repo spec.
   - Write a `mission` block to `.teamworks/project.md` under
     `## Missions`. Use a `mission-id` of the form
     `m-YYYYMMDD-<slug>` and mark it `approved`.
   - Update `.teamworks/topology.md` if any interface changed.
5. Forward the team-lead's report (mission-id, affected repos, spec
   paths) to the user.
6. Tear down.

The command body must instruct team-lead to use the SendMessage
payload format (defined in `agents/team-lead.md`) for every dispatch.

**Step 3: Verify**

Same as Task 4 Step 3.

**Step 4: Commit**

```bash
git add plugins/teamworks/commands/propose.md
git commit -m "feat(teamworks): add propose command"
```

---

### Task 9: Command — apply

**Files:**

- Create: `plugins/teamworks/commands/apply.md`

**Reference:** Design doc "Key Behaviours > apply".

**Step 1: Author frontmatter**

```yaml
---
allowed-tools: Bash, Read, SendMessage, TeamCreate, TeamDelete
description: Execute an approved mission. Team-lead dispatches managers to run TDD per spec; no commits. On failure, retries up to 3 times with new angle. Reports per-repo status; the user owns git.
---
```

**Step 2: Author body**

Steps:

1. Announce.
2. Validate `.teamworks/` exists and the supplied `<mission-id>`
   exists in `.teamworks/project.md` with status `approved`. If not
   found or not approved, refuse with a clear error.
3. Spawn team-lead. Forward `<mission-id>`.
4. Wait for team-lead to:
   - Dispatch managers in parallel per the mission spec.
   - On failure: analyse, formulate a new angle, re-dispatch.
     Stop at the earliest of 3 retries on the same manager OR
     team-lead's self-judgement of "no new angle".
   - On all-`done`: mark the mission `applied` in project.md.
   - Otherwise: leave the mission `approved`.
5. Forward the team-lead's per-repo report to the user (which files
   changed in which repos, which tests pass / fail, which managers
   blocked).
6. Tear down.

The command body must explicitly state: "managers do not commit; the
user owns git".

**Step 3: Verify**

Same as Task 4 Step 3.

**Step 4: Commit**

```bash
git add plugins/teamworks/commands/apply.md
git commit -m "feat(teamworks): add apply command"
```

---

### Task 10: Command — shutdown

**Files:**

- Create: `plugins/teamworks/commands/shutdown.md`

**Reference:** Design doc "Key Behaviours > shutdown".

**Step 1: Author frontmatter**

```yaml
---
allowed-tools: Bash, Read, Write, TeamCreate, TeamDelete
description: Reap stray Team agents, append today's log summary, and append a session summary to project.md if the latest mission lacks one. Preserves .teamworks/.
---
```

**Step 2: Author body**

Steps:

1. Announce.
2. Validate `.teamworks/` exists.
3. Enumerate live Team agents (use the Team operations available in
   the outer session) and tear down any associated with this
   workspace.
4. Append a one-line summary to today's
   `.teamworks/log/YYYY-MM-DD.md` if any unrecorded activity is
   visible (e.g. recent file mtimes).
5. Read `.teamworks/project.md`; if the latest mission lacks a
   trailing summary line, append one ("session ended at ...").
6. Print confirmation. Do not delete `.teamworks/`.

**Step 3: Verify**

Same as Task 4 Step 3.

**Step 4: Commit**

```bash
git add plugins/teamworks/commands/shutdown.md
git commit -m "feat(teamworks): add shutdown command"
```

---

### Task 11: README + final verification

**Files:**

- Create: `plugins/teamworks/README.md`

**Step 1: Author README**

Mirror `plugins/autoresearch/README.md` structure:

- Title and one-paragraph summary.
- `## Architecture` — three-layer agent topology (lift the diagram
  from design doc; shorten prose).
- `## Commands` — table of the 7 commands (`/teamworks:init`,
  `/teamworks:add-repo`, `/teamworks:add-agent`, `/teamworks:explore`,
  `/teamworks:propose`, `/teamworks:apply`, `/teamworks:shutdown`)
  with a "What it does" column.
- `## Agents` — table of `team-lead` and `repo-manager` with role.
- `## Workspace Layout` — show `.teamworks/` tree (lift from design
  doc).
- `## External Dependencies` — OpenSpec CLI (used inside repo-manager
  for SDD).
- `## Installation` — `/plugin marketplace add ...` and `/plugin
  install teamworks@wiasliaw-claude-plugins`.
- Link to design doc: `docs/plans/2026-04-26-teamworks-design.md`.

Use `text` language for code blocks containing ASCII art.

**Step 2: Final verification (full suite)**

Run:

```bash
pnpm lint
node --experimental-strip-types .github/scripts/validate-frontmatter.ts plugins/teamworks
node --experimental-strip-types .github/scripts/validate-marketplace.ts .claude-plugin/marketplace.json
node --experimental-strip-types .github/scripts/check-marketplace-sorted.ts
```

Expected: all four exit 0.

**Step 3: Sanity check directory tree**

Run:

```bash
find plugins/teamworks -type f | sort
```

Expected output (exactly these 11 files):

```text
plugins/teamworks/.claude-plugin/plugin.json
plugins/teamworks/README.md
plugins/teamworks/agents/repo-manager.md
plugins/teamworks/agents/team-lead.md
plugins/teamworks/commands/add-agent.md
plugins/teamworks/commands/add-repo.md
plugins/teamworks/commands/apply.md
plugins/teamworks/commands/explore.md
plugins/teamworks/commands/init.md
plugins/teamworks/commands/propose.md
plugins/teamworks/commands/shutdown.md
```

**Step 4: Commit README**

```bash
git add plugins/teamworks/README.md
git commit -m "docs(teamworks): add README"
```

---

## Done criteria

- All 11 tasks committed on branch `feat/teamworks-plugin`.
- Final verification suite (Task 11 Step 2) all green.
- Directory tree matches Task 11 Step 3.

After done: hand back to the user. Do not push, do not open a PR (per
design doc YAGNI #1: git operations are out of scope; the user owns
push and PR).
