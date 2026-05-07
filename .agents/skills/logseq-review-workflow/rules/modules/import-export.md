# Import, Export, and Publishing Review Rules

Apply when a change touches Markdown/Org/EDN import, export, publishing, graph conversion, file parsing, or serialization.

## Review focus

- Round-trip behavior should preserve user data, block identity, properties, ordering, and references where promised.
- Parsers should fail with actionable errors on invalid input instead of silently dropping data.
- Export output should be deterministic enough for tests and version control.
- Large imports/exports should avoid loading or transforming unnecessary full graph data.
- DB graph and file graph differences should be explicit.

## Red flags

- Dropping unknown properties, refs, assets, or nested structure without warning.
- Non-deterministic output ordering.
- Encoding/path assumptions that break non-ASCII graph content or assets.
- Treating parser recovery as success without surfacing partial failure.
- Tests that only cover small flat pages.

## Review questions

- Does import followed by export preserve the changed data shape?
- Are invalid files and partial failures tested?
- Is output stable across runs?
- Are assets, refs, properties, and nested blocks preserved?
- Are large graph performance characteristics acceptable?
