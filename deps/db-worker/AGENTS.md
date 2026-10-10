# deps/db-worker

OCaml implementation of the Logseq DB worker (`src/main/frontend/worker/**`).

Goal: replace the ClojureScript worker behind the exact same Comlink +
transit `remoteInvoke` protocol, backed by `datascript-ocaml`. Two targets:
JavaScript via Melange (browser + Node) and native OCaml.

## Rules

- Follow the conventions in `cli/AGENTS.md` and `cli/spec/AGENTS.md`.
- Jane Street style: `.mli` contracts are the source of truth; closed
  variants, no `Obj.magic`, no suppressed warnings.
- JS interop only through `melange.js` / `melange.node` or the platform spec
  surface — never raw hand-written JavaScript.
- Keep the on-disk storage format compatible with `kvs (addr, content,
  addresses)` written by `frontend.worker.db-core/new-sqlite-storage`.
- Keep original logic faithful; sync-related semantics need extra care.
- ClojureScript unit tests are translated 1:1 into OCaml tests under `test/`.
- Do not modify any files under `spec/` during development unless
  explicitly asked to modify the `.mli` files under `spec/`.
- Do not modify any dune file during development unless explicitly asked.
- If development is blocked because the `.mli` definitions under `spec/`
  are unclear or unreasonable, stop development immediately and report
  the specific spec issue, suggested changes, and rationale.

- Avoid O(n²) `List` patterns such as `List.concat` and repeated `List.append` on large sequences; when the project already depends on the `rrbvec` package, use `Rrbvec` vectors instead.
- Keep index access cheap. Never walk a whole index (`datoms db Eavt ()`
  or an unbounded `Avet ~a` slice) or materialize entities where a
  bounded seek suffices — prefer `~e`/`~a`/`~v`-constrained datoms
  queries and datom-level checks over `entity`/`ent_of_id` inside loops.
  Full scans belong only to inherently whole-db operations (export,
  publish, checksum, validate). ClojureScript datascript keeps every
  index in memory so a per-eid `entity` call looks free there; on
  storage-backed indexes each materialization is a real seek.

## Layout

- `spec/platform/*.mli` — runtime capabilities (virtual module
  `logseq_db_worker_platform_spec`), implemented per target in
  `runtime/melange` and `runtime/native`.
- `spec/worker/*.mli` — worker contract (virtual module
  `logseq_db_worker_spec`), implemented once in `lib/`.
- `lib/` — target-independent implementation.
- `runtime/{melange,native}/` — platform implementations.
- `js_api/` — Melange entry point exposing the worker bundle API.
- `test/` — melange-fest (node) and native tests.
