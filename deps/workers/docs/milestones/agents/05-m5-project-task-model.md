# M5: Project + Task Model for Agents

## Target
Define `#Project` with `GitHub Repo` URL property, add `#Agent` with auth properties, and link `#Task` to a project and agent.

## Why
Tasks should be attributable to a project and repo so agents can operate in the right codebase.

## Scope
- Add `#Project` class in graph schema.
- Add `GitHub Repo` property (URL) on `#Project`.
- Add `#Agent` class in graph schema.
- Add `API token` property on `#Agent`.
- Add `auth.json` property on `#Agent` (stored as a text block).
- Add `project` reference on `#Task` (link to a `#Project`).
- Add `agent` reference on `#Task` (link to a `#Agent`).
- Extend sessions/create payload to accept project metadata.
- Persist project metadata on session + events.

## Acceptance
1) A task can reference a project with a repo URL.
2) A task can reference an agent with API token and/or auth.json text.
3) Sessions created from tasks include project + repo URL + agent auth data in session state.
4) Project + repo URL + agent auth data are available in session events for consumers.

## Notes
- Store in Logseq graph like `#Task`.
- URL validation should align with existing property types.
- `auth.json` should be stored as a text block on the `#Agent`.
