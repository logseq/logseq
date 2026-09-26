(* JS entry for the Node db-worker-node daemon.

   The bundle is the whole daemon: it is spawned directly as
   `node db-worker-node.js` by graph-lifecycle (cli and Electron on
   Windows; macOS/Linux run the native binary from bin/main.exe
   instead). Running the module is running the daemon. *)

let () = Db_worker_node.main ()
