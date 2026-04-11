# logseq CLI

## Dev rules
- Ensure `--output json`, `--output edn`, and `--output human` produce reasonable, consistent, and user-friendly output.
- Ensure all command outputs are user/agent-friendly, especially error outputs.
- Do not implement new `thread-api` in db-worker unless it is absolutely necessary.
- Use logseq-cli skill; test the changed parts with the new-built logseq-cli & db-worker-node server.
