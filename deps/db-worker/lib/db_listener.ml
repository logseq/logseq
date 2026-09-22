(* frontend.worker.db-listener — post-commit listener dispatch.

   cljs runs, per committed tx: db-sync checksum, db-sync
   persist-local-tx, the sync-db-to-main-thread pipeline
   (invoke-hooks -> render-delta -> broadcast), then deferred
   listeners (markdown-mirror, search). The sync/search/pipeline
   pieces register themselves here as they are ported. *)

open Datascript

type handler = string -> tx_report -> unit

(* deferred handlers keyed by cljs listen-key name ("markdown-mirror",
   "search", ...); :db-sync is hoisted out below like cljs does. *)
let deferred_handlers : (string, handler) Hashtbl.t = Hashtbl.create 8

let register key f = Hashtbl.replace deferred_handlers key f

(* hoistable slots — set by the sync/pipeline ports when they land *)
let update_checksum : (string -> tx_report -> unit) ref =
  ref (fun _ _ -> ())

let persist_local_tx : (string -> tx_report -> unit) ref =
  ref (fun _ _ -> ())

let main_thread_sync : (string -> conn -> tx_report -> unit) ref =
  ref (fun _ _ _ -> ())

let tx_meta_bool (r : tx_report) k : bool =
  match List.assoc_opt k r.tx_meta with
  | Some (Bool b) -> b
  | _ -> false

let report_post_commit_error repo stage exn =
  Worker_log.error "db-worker/post-commit-handler-failed"
    [ ("repo", repo); ("stage", stage); ("error", Printexc.to_string exn) ]

let run_post_commit repo stage f =
  try f () with exn -> report_post_commit_error repo stage exn

let process_committed_tx repo conn (r : tx_report) =
  run_post_commit repo "update-checksum" (fun () ->
      !update_checksum repo r);
  run_post_commit repo "db-sync" (fun () -> !persist_local_tx repo r);
  run_post_commit repo "sync-db-to-main-thread" (fun () ->
      !main_thread_sync repo conn r);
  Hashtbl.iter
    (fun key f -> run_post_commit repo key (fun () -> f repo r))
    deferred_handlers

(* cljs installs on each repo conn via d/listen! ::listen-db-changes! *)
let listen_db_changes repo conn =
  ignore
    (Datascript.listen conn "listen-db-changes!" (fun (r : tx_report) ->
         if r.tx_data <> [] && (tx_meta_bool r "batch-final-tx-report?"
                                || not (tx_meta_bool r "batch-tx-report?"))
         then process_committed_tx repo conn r))

(* built-in deferred listeners — mirror queues jobs with debounce *)
let () =
  register "markdown-mirror" (fun repo r ->
      Db_worker_effect.async (fun () ->
          Db_worker_effect.map (fun _ -> ())
            (Markdown_mirror.handle_tx_report repo r
               { Markdown_mirror.default_opts with defer = true })))
