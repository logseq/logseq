(* Graph lifecycle: init worker, list/open/create graphs, today journal.
   Mirrors frontend/persist_db/browser.cljs start-db-worker! +
   frontend/handler/repo.cljs get-repos/new-db!/create-db. *)

open Promise_ext
let db_version_prefix = "logseq_db_"

let full_graph_name name = db_version_prefix ^ String.trim name

let default_config = "{:feature/enable-git-auto-commit? false}"

let init_worker () =
  let* _ = Runtime.invoke1 "thread-api/init" (Wire.Array []) in
  (* cljs events.cljs :graph/sync-context — :dev? flips the
            worker's OUTLINER-PERF-LOGGING mirror used by e2e *)
  let* _ =
    Runtime.invoke1 "thread-api/set-context"
      (Wire.Map
         [ (Wire.kw "dev?", Wire.Bool Platform.dev_build) ])
  in
  (* single-arg map like cljs state/set-db-sync-config *)
  let* _ =
    Runtime.invoke1 "thread-api/set-db-sync-config"
      (Rtc_ops.db_sync_config ())
  in
  (* cljs pushes sync-app-state at boot so a stored login reaches
            the worker before any db-sync call *)
  let* _ =
    Rtc_ops.sync_app_state !Runtime.current_repo;
    Js.Promise.resolve ()
  in
  (* cljs ships a transact context with :dev? = config/dev?
            (DEV-RELEASE); e2e builds compile that flag in, which turns
            on the worker's :db-worker/outliner-op-perf logging *)
  let* _ =
    if Platform.rtc_test_mode () then
      Runtime.invoke1 "thread-api/set-context"
        (Wire.Map [ (Wire.kw "dev?", Wire.Bool true) ])
    else Js.Promise.resolve Wire.Nil
  in
  Js.Promise.resolve ()

let list_graphs () =
  let* w = Runtime.invoke "thread-api/list-db" [] in
  Js.Promise.resolve (Decode.repos_of_list_db w)

let open_graph repo =
  Runtime.invoke2 "thread-api/create-or-open-db" (Wire.String repo)
    (Wire.Map [])

(* cljs events.cljs <build-search-index!: on graph open the frontend asks
   the worker to build blocks_fts; seed entities (Library etc.) only reach
   the index through this call since the tx listener ignores seed txns *)
let build_search_index repo =
  (let* _ =
    Runtime.invoke1 "thread-api/search-build-blocks-indice-in-worker"
      (Wire.String repo)
  in
  Js.Promise.resolve ())
  |> Js.Promise.catch (fun e ->
         Platform.console_error ("search-build-blocks-indice failed", e);
         Js.Promise.resolve ())
  |> ignore

let create_graph ?(remote = false) name =
  let repo = full_graph_name name in
  let* _ =
    Runtime.invoke2 "thread-api/create-or-open-db" (Wire.String repo)
      (Wire.Map
         ([ (Wire.kw "config", Wire.String default_config)
          ; (Wire.kw "graph-git-sha", Wire.Nil)
          ]
         (* cljs repo-handler/new-db! passes {:creating-remote-graph? true}
            when the graph will sync — the worker seeds client-ops local-tx
            on that flag, which db-sync-start requires *)
         @ if remote then
             [ (Wire.kw "creating-remote-graph?", Wire.Bool true) ]
           else []))
  in
  Js.Promise.resolve repo

(* cljs <create! title {:today-journal? true} via outliner-op create-page *)
let create_today_journal repo =
  let title = Dates.today () in
  let* _ =
    Runtime.invoke3 "thread-api/apply-outliner-ops"
      (Wire.String repo)
      (Wire.Array
         [ Wire.Array
             [ Wire.Keyword "create-page"
             ; Wire.Array
                 [ Wire.String title
                 ; Wire.Map
                     [ (Wire.kw "today-journal?", Wire.Bool true)
                     ; (Wire.kw "split-namespace?", Wire.Bool false)
                     ]
                 ]
             ]
         ])
      (Wire.Map [])
  in
  Js.Promise.resolve title
