# Actual owned-worker update shutdown qualification

Status: stage-two native macOS qualification passed. Installation remains disabled.

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

This test qualifies explicit owned-worker protocol operations. It does not
qualify saving/quiescing all application workers as one update transaction,
restoring transports after partial shutdown, installer admission, package
replacement, signing or relaunch. The ordinary update action still refuses
installation after its existing save/abort preparation path.
