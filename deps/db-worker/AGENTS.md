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
