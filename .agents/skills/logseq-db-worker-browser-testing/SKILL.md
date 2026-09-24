---
name: logseq-db-worker-browser-testing
description: Serve the Logseq web app with the OCaml (Melange) db-worker bundle and drive worker endpoints directly from devtools for end-to-end reproduction of worker bugs.
---

# OCaml db-worker browser testing

Use when reproducing or verifying bugs in `deps/db-worker/` (the Melange-compiled
worker that replaces `frontend.worker` behind the Comlink/transit `remoteInvoke`
protocol) in the real browser app.

## Serve the app with the OCaml worker

1. `pnpm gulp:watch` and `pnpm cljs:app-watch` (or `pnpm watch` = both) — shadow
   dev-http serves `static/` on http://localhost:3001 (first cljs compile ~1 min).
2. Build the OCaml bundle (NOT covered by `pnpm watch`; cljs watch builds
   `db-worker-node`, not this): `cd deps/db-worker && dune build &&
   ../../node_modules/.bin/vite build --mode browser` → emits
   `static/js/db-worker.js` (~4 MB IIFE, sets `globalThis.LogseqDbWorker`,
   installs the Comlink `remoteInvoke` handler in the worker). If `dune build`
   is locked by a concurrent build, `vite build --mode browser` alone rebuilds
   the bundle from the last `_build` output.
3. Verify it is live (not the cljs fallback worker): devtools Console → context
   dropdown (top-left "top ▾") → pick `db-worker.js (localhost:3001)` →
   `typeof LogseqDbWorker` is `"object"`.

## Login with the e2e account

- Creds (from `clj-e2e/src/logseq/e2e/util.clj` `login-test-account`):
  user `e2etest`, pass `Logseq-e2e`.
- `localStorage.setItem("login-enabled","true")`, reload, then click
  `.toolbar-dots-btn` → "Login" → type user → Tab → pass → submit.
- Cognito prod; tokens persist in localStorage (`id-token`, `access-token`,
  `refresh-token`, `CognitoIdentityServiceProvider.*`). Sync server defaults to
  `https://api.logseq.io`.

## Drive worker endpoints directly

The page console cannot reach the worker — use the console context dropdown →
`db-worker.js`. Invoke the same calls the UI would:

```js
LogseqDbWorker.invoke("thread-api/set-db-sync-config",
  '[["^ ","~:enabled?",true,"~:http-base","https://api.logseq.io","~:ws-url","wss://api.logseq.io/sync/%s"]]')
LogseqDbWorker.invoke("thread-api/sync-app-state",
  '[["^ ","~:auth/id-token","<jwt>","~:auth/access-token","<jwt>","~:auth/refresh-token","<jwt>","~:auth/oauth-client-id","69cs1lgme7p8kbgld8n5kseii6","~:auth/oauth-domain","logseq-prod.auth.us-east-1.amazoncognito.com","~:auth/oauth-token-url","https://logseq-prod.auth.us-east-1.amazoncognito.com/oauth2/token"]]')
LogseqDbWorker.invoke("thread-api/db-sync-ensure-user-rsa-keys",
  '[["^ ","~:ensure-server?",true,"~:server-rsa-keys-exists?",false]]')
```

Wire format: the transit string decodes to the ARGS LIST; one map arg is
`[["^ ","~:key",value,...]]`. Errors caught by the endpoint's `run` wrapper come
back as RESOLVED values `["~#error",["^ ","~:message","Js__Js_exn.Error/1(...)"]]`.
BUT exceptions thrown inside async `Db_worker_effect.bind` callbacks OUTSIDE the
endpoint `run` boundary (e.g. `with_store`'s `db.transaction(...)` call, which
sits outside its own `try`) escape as a REJECTED promise carrying a
`MelangeError` — use `.then(onOk, onErr)` (not just `.then`), stash the error
(`self.__err=e`), and read the wrapped JS error via `__err._1` /
`__err._1.message` / `__err._1.stack`.

Melange/DOM gotcha seen twice now: externals that read `.result`/`.error` off an
`on*` handler's argument get the DOM **Event**, not the request — the DB is at
`event.target.result`. Probe pattern:
`var rq=indexedDB.open('x',2);rq.onsuccess=e=>console.log(e.result,e.target.result)`
→ first value undefined, second IDBDatabase.

Interop binding-shape bugs (found repeatedly — audit externals when an
"X is not a function" / "reading '#priv'" TypeError appears):
- `external f : unit -> t = "prop" [@@mel.scope "obj"]` emits `obj.prop()` —
  **invokes** the property. If `prop` is a non-function object (e.g.
  `navigator.locks` = LockManager), you get `obj.prop is not a function`.
  For property reads, bind as a value/option (`t Js.Undefined.t` + `[@@mel.get]`
  or a plain `external prop : t = "prop" [@@mel.scope ...]`), not `unit ->`.
- `external m : obj -> (unit -> x) Js.Undefined.t = "m" [@@mel.get]` reads a
  METHOD as an unbound function ref; calling `m ()` loses `this` → inside
  `class C { #f; m(){this.#f...} }` the private-field read throws
  `Cannot read properties of null/undefined (reading '#f')`. Use
  `[@@mel.send]`/receiver-carrying calls, or wrap `(fun [@u] -> obj.m())`.

Transit arg encoding notes:
- nil inside the args vector is plain `null`: `'[null,"~:key"]'` works
  (verified — resolves `["~#",null]` for conn-miss endpoints).
- `["^ "]` (verbose empty map) does NOT decode to an empty `Wire.Map` — it
  decodes to `null`, so `Wire.get`-style reads crash (`reading 'e'`/`'#e'`).
  Always include at least one `"~:key",v` pair in map args.

To pump captured strings out of the worker (no clipboard access there), POST to
a local listener: `(timeout 40 nc -l -p 8799 > out.txt &)` then
`fetch('http://localhost:8799/',{method:'POST',body:JSON.stringify(...)})` —
the fetch fails after nc closes but the body lands in out.txt.

To capture the real JS exception inside a `MelangeError: Js__Js_exn.Error/1`,
temporarily patch `internalToOCamlException` in `static/js/db-worker.js` to log
the raw error + stack before wrapping, e.g. in the `o(t)` wrapper insert
`try{globalThis.__rawErr=t;console.error("RAWJSERR:",t,t&&t.stack)}catch(_e){}`.
Keep a backup (`cp` to /tmp) and restore it when done — never commit a
hand-edited bundle. No sourcemap is emitted; demangle frames by slicing the
minified line at the reported column.

To attribute a console `MelangeError`/rejection to its invoking endpoint
(the page-side `report-worker-error!` log drops the endpoint name — Comlink
`HANDLER/throw` = remoteInvoke rejection): patch the two wrappers in
`require_entry_worker` (`function N(t,n)` = remoteInvoke → `S.remote_invoke`,
`function T(t,n)` = invoke → `S.invoke`) to push `"name=>OK"` / `"name=>ERR msg"`
into `self.__calls`, then reload and read `__calls` in the worker context. The
tap survives the reload because it lives in the served file — restore the backup
when done. If a boot error only fires when the worker lacks auth, reproduce by
nilling state: `invoke("thread-api/set-ui-state",'["~:auth/id-token",null]')`
(also access/refresh-token + user/info) then re-invoke the suspect endpoint —
`resolve_user_uuid`→None yields `db-sync/missing-field {base,user-id:nil,
field:user-rsa-key-pair}` Exn_info from `get_user_rsa_key_pair_raw_impl`.

"Pause on caught exceptions" pauses the PAGE devtools only (won't stop in the
worker) and pdf.js throws many benign caught exceptions during load — keep it
off.

Gotcha: if the app sits on skeleton/"Select a graph" after login, the UI chain
(`:thread-api/init` → `set-db-sync-config` → `:user/fetch-info-and-graphs` →
ensure) may not have run — inject config + auth state manually as above to hit
the same endpoint with identical args.
