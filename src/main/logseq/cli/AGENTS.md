# logseq CLI

## Dev rules
- Ensure `--output json`, `--output edn`, and `--output human` produce reasonable, consistent, and user-friendly output.
- Ensure all command outputs are user/agent-friendly, especially error outputs.
- Do not implement new `thread-api` in db-worker unless it is absolutely necessary.
- Use logseq-cli skill; test the changed parts with the new-built logseq-cli & db-worker-node server.
- Ensure at least all cli-e2e non-sync cases passed.

## Debug tools
- `--verbose` - debug cli process
- `--profile` - performance check
- Logseq-cli skill - explore cli self in agent
- db-worker-node.log - logs for db-worker-node process
- db-worker-node-repl skill - Directly validate some db worker node code in the REPL

