# logseq CLI

## Dev rules
- Ensure `--output json`, `--output edn`, and `--output human` produce reasonable, consistent, and user-friendly output.
- Ensure all command outputs are user/agent-friendly, especially error outputs.
- Do not add new `thread-api` usage in db-worker unless it is absolutely necessary.
