(* Secrets live in the platform kv — cljs <save-secret-text! falls back
   to (:set! kv) key text whenever the OS keychain (keytar) is absent;
   keytar is a Node-only binding, so the native worker always takes the
   kv-file path on every owner (the cljs CLI_E2E_TEST code path). The kv
   file itself is Idb's <LOGSEQ_WORKER_KV_DIR>/kv-store.json. *)

let save ~key text = Idb.set key text
let read ~key = Idb.get key
let delete ~key = Idb.delete key
