# Tasks app

A small public client for Sign in with Logseq. It asks for one graph, then
lists and creates Task objects in that graph through the semantic API.

## Local preview

The preview signs tokens with a key that never leaves this machine. The node
process answers the Cognito password check and JWKS fetch for
`cognito-idp.demo.local`. Use it to exercise the flow locally. A deployed
server still uses the configured Cognito pool.

```bash
cd deps/db-sync
pnpm preview:tasks-app
```

The command compiles nothing. Build the node adapter and the seed script first:

```bash
cd deps/db-sync
clojure -M:cljs compile db-sync-node db-sync-tasks-demo-seed
pnpm preview:tasks-app
```

Then open:

- Tasks app: `http://127.0.0.1:8791/`
- Logseq web app, already pointed at the local sync server: `http://127.0.0.1:3011/tasks-demo-session.html`

The preview account is `ada` / `tasks-demo`. The graph is named Tasks. Sign in
on the Tasks app, choose that graph, and allow access. Tasks created in either
app are the same graph: the Tasks app uses `GET` and `POST
/api/v1/graphs/:graph-id/tasks`, and the web app syncs that graph. Use Refresh
in the Tasks app after changing a task in Logseq.
