# Data-contract Pass

Use this file when running the independent data-contract review pass for `logseq-review-workflow`.

## Mission

Inspect the reviewed change for data-contract drift. Identify the canonical data shape proven by current callers, tests, public contracts, persisted data, protocol decoders, DB queries, pull selectors, schemas, or explicit boundary requirements. Flag defensive fallbacks, input-shape guessing, silent coercion, unnecessary normalizers, and compatibility ladders that are not justified by that evidence.

## Required checks

- Map every changed data path to its source of truth and canonical shape.
- Treat already-contracted domain data as valid. Examples: a valid datom is already a datom; a DB pull result follows its selector; a schema-validated value is already validated; a protocol decoder defines the decoded payload shape.
- Do not require normalizers for already-contracted domain data merely to make downstream access defensive or uniform.
- Allow normalization only at actual external, persisted, user, CLI, network, or JS/native interop boundaries that must accept multiple shapes.
- Require downstream code to use one clear contract after boundary validation or normalization.
- Flag broad `or` chains, generic stringification, map/string/keyword guessing, alternate field-name ladders, unchecked dynamic access, and default values that hide missing required data.
- Ask for unsupported-shape tests only when the changed code owns boundary validation. Do not ask for invalid-shape tests for data guaranteed by an upstream contract.

Return results using [`subagent-output.md`](./subagent-output.md). If there are no findings, say which changed data paths were inspected and what canonical contracts were confirmed.
