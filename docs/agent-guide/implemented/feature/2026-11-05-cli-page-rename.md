# Cli Page Rename

## Problem

CLI page title property updates leave the internal lookup name stale. Ordinary pages have no supported rename command.

## Decision

Add `upsert page --rename <title>` with exactly one of `--id` or `--page` as the existing-page selector. Never create a missing rename target, reject ambiguous names, and submit rename plus property updates in one outliner transaction. Reject page title property assignments with a pointer to `--rename`. The user approved this design and explicitly authorized adding `rename : string option` to both page records in `cli/spec/commands/upsert.mli`.

## Alternatives considered

### Independent rename command or implicit title-property rename

Not selected: an independent command expands the command surface; implicit rename hides business semantics in generic property writes. Reuse the existing rename-page outliner operation.

## Acceptance criteria

- Rename by ID and old name preserves page identity and keeps title/name consistent, including subsequent links.
- Missing, ambiguous, blank, and conflicting requests fail without partially applying rename or properties.
- Existing upsert behavior remains unchanged when rename is absent, except rejecting title property assignments.

## Risks

- Name selectors can match multiple pages; require ID instead of selecting an arbitrary match. Existing duplicates are not merged or repaired.
- Existing page option/action fixture records require the new optional field to compile.

## Consequences

Page identity and references remain stable while shared outliner validation maintains lookup names and rejects conflicts. Generic page title property updates now fail with a pointer to `--rename`. Existing duplicate pages are not merged or repaired.

## Questions

- None. Design and interface-edit authorization were supplied by the user in this session.
