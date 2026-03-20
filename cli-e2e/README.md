# cli-e2e

Shell-first end-to-end tests for compiled `logseq-cli` and `db-worker-node`.

This harness is babashka-driven and reads declarative EDN manifests from `spec/`.

Current commands:

- `bb -f cli-e2e/bb.edn unit-test`
- `bb -f cli-e2e/bb.edn list-cases`
- `bb -f cli-e2e/bb.edn build`
- `bb -f cli-e2e/bb.edn test --skip-build`

The full in-scope case inventory and coverage metadata live in:

- `cli-e2e/spec/non_sync_inventory.edn`
- `cli-e2e/spec/non_sync_cases.edn`
