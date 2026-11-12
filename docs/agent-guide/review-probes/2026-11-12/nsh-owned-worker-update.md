# Actual owned-worker update shutdown qualification

Status: native macOS protocol and real two-worker rollback qualification passed.
Installation remains disabled.

## Revisions and commands

Application implementation: `8ecadc5463` (source fixture commit `04ae0153a6`).
LUI dependency: `20fc6fbbda28e5785a0d364bf816704375886df2`.
NSH dependency: `adc186db7213f3ccd1eacaa836cc721e9779fd14`.
OCaml 5.5.1 native release archives and the actual native DB worker were used.
The worker SHA-256 was
`5404762a8ccd9b5987c0ab00fc8455000e428f0ac652a5e55166b20ec0ba1b50`.

From `deps/ui`, rebuild `native/native_embed.exe.o` with the release profile,
then run from the repository root:

```sh
OCAMLPATH=/absolute/lui/_build/install/default/lib OPAMSWITCH=5.5.1 \
  python3 deps/ui/nsh/run_owned_worker_update_native.py \
  --worker /absolute/logseq/deps/db-worker/_build/default/bin/main.exe
```

The first execution passed but exposed a non-unit statement warning in the
fixture. Explicitly ignoring that returned wire value removed the warning;
the complete second execution also passed. Existing findlib warnings remained
visible. Logs: `/tmp/logseq-owned-worker-e2e.log` and
`/tmp/logseq-owned-worker-e2e-clean.log`. These are local diagnostic files, not
committed build outputs. The current native save/abort admission fixture also
passed, including exact child ownership after injected startup publication
failure (`/tmp/logseq-current-native-admission.log`).

## Actual evidence

The driver contains its new fixture and descendants before releasing the stdin
startup gate. It uses fresh private storage and empty application credentials;
login daemon startup is disabled. It does not contact the installed application.

The actual first worker accepted a page transaction and returned its scalar
title query. An authenticated SSE connection remained open while:

1. Sealing refused later normal invokes with `worker-update-sealed`.
2. Abort acknowledged release and normal work/read access resumed.
3. A new request sealed and stopped the worker without SSE blocking shutdown.
4. The client waited for its captured exact child to exit successfully.

The Python parent independently observed the runtime record change from ready
to closed, the SQLite graph ownership lock become available, a successful
SQLite integrity check and the TCP endpoint close. A second actual worker
opened the same graph and read the durable page before its own sealed stop.
The clean repeat used distinct instances
`cec1c4bf-2c2a-4b14-8063-590c2b95814c` and
`44fa4b7e-00a8-484b-9f35-e1408bce834e`.

The developer's installed frontend and worker remained running throughout.

## Remaining gates

The same driver is now required by the macOS/Linux and Windows application CI
workflows. This local result does not qualify Windows HANDLE waiting, Windows
Job containment or Linux execution. Those require actual corresponding jobs.

The initial single-worker execution above qualified explicit owned-worker
protocol operations. The follow-up below expands this to real multiworker
preparation and transport restoration. Installer admission, package replacement,
signing and relaunch remain outside these worker tests. The ordinary update
action still refuses installation after its save/abort preparation path.

## Production coordinator follow-up

The same driver was extended at application `008398cb3c` and executed successfully
with the same native worker digest above. LUI was `414ef098` for the associated
production code; this native OCaml fixture does not exercise LUI's Rust renderer.
The original protocol checks still run in their own fresh contained process.
The additional coordinator process starts two concurrent actual owned workers,
stores and queries a distinct durable page in each, and uses the real
`Native_embed.update_worker_lifecycle` with an actual `Worker_client` and SSE.

The complete preparation proves both captured children exited cleanly before
`prepared: true`. Abort then replaces both, restores the same client/message
owner, acknowledges SSE and performs finite reads of the original durable data.

The next preparation pauses only after the first real stop has completed and
its exact exit has been proved. At this boundary the Python parent independently
checks that A is closed and unlocked, while B remains alive, locked and sealed.
Cancellation then prevents dispatch of the second stop. Recovery replaces only
A, aborts B's seal without replacing B, restores the captured active transport,
and again reads both durable values. This boundary wrapper changes no exit or
management result; there is no simulated worker shutdown.

The complete command exited successfully, reporting `stage2Qualified: true`,
`coordinatorQualified: true`, and `installerEnabled: false` in
`/tmp/logseq-real-multiworker-update.log`. All fixture processes were contained
and cleaned; the installed developer frontend and worker remained running.
The separate native admission runner also passed deterministic ordering,
recovery-failure retry, readiness-only retry, and retired-owner fence cases.

This closes the macOS two-worker full/partial rollback seam. It does not qualify
actual editor saving through an installed application update, transport failure
during physical replacement, crash/retirement recovery, Windows/Linux, public
HTTPS download/install actions or relaunch. Those remain required gates before
enabling production installation.
