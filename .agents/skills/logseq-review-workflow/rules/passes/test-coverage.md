# Test-coverage Pass

Inspect whether the reviewed change has useful tests for the behavior it changes.

Check:

- tests cover the changed contract, not only happy paths
- regression tests exist for fixed bugs or risky behavior
- boundary validation is tested when the changed code owns that boundary
- tests avoid unsupported-shape cases when upstream contracts already guarantee the shape
- unit, CLI E2E, clj-e2e, or runtime probes match the touched surface
- assertions verify observable behavior rather than implementation details only
- test names, fixtures, and graph setup remain maintainable

Return results using [`subagent-output.md`](./subagent-output.md).
