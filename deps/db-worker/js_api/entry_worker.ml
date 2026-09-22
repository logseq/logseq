(* CommonJS entry: exposes init/invoke/registered as module exports.
   The cljs worker bootstrap loads this bundle and the dispatch seam
   in thread_api delegates registered endpoints here. *)
let init () = Worker_core.init ()

let invoke name transit_args =
  Worker_core.init ();
  Js.Promise.make (fun ~resolve ~reject ->
      Db_worker_effect.on_any
        (Worker_core.invoke name transit_args)
        (fun result -> resolve result [@u])
        (fun exn -> reject exn [@u]))

let registered name = Dispatcher.registered name

(* Node daemon entry (cljs db_worker_node/main): takes over argv
   parsing, graph-lifecycle admission, the http+SSE surface and
   graceful shutdown. Only called when the bundle is run as the
   db-worker-node process replacement. *)
let main () = Db_worker_node.main ()
