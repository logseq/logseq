(* Port of electron.graph-switch-flow — policy hooks for graph
   switching. *)

(* Decides whether `setCurrentGraph` should release db-worker runtime.

   Returns `false` by design.

   In Electron, `setCurrentGraph` is metadata synchronization for
   window graph path only. Runtime lifecycle is handled by the
   `db-worker-runtime` IPC path (switch/start) and window close path
   (release). Releasing here reintroduces the stale double-release bug
   that can stop the newly bound runtime. *)
let release_runtime_on_set_current_graph (_switch : 'a) : bool = false
