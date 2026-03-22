# cli-e2e

Shell-first end-to-end tests for logseq CLI.

## Test cli-e2e itself
- Run internal cli-e2e harness unit tests: `bb unit-test`

## Test cli-e2e cases
- List declared cli-e2e case ids: `bb list-cases`
- Run cli-e2e cases with build preflight unless --skip-build is provided: `bb test`
  - `bb test --help` for more help info

## Clean up
- Execute cleanup: terminate stale db-worker-node processes and remove cli-e2e temp graph directories: `bb cleanup`
- Preview cleanup actions only (no kill/delete): `bb cleanup --dry-run`
