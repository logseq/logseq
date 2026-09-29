(* Graph lifecycle: init worker, list/open/create graphs, today journal.
   Mirrors frontend/persist_db/browser.cljs start-db-worker! +
   frontend/handler/repo.cljs get-repos/new-db!/create-db. *)

let db_version_prefix = "logseq_db_"

let full_graph_name name = db_version_prefix ^ String.trim name

let default_config = "{:feature/enable-git-auto-commit? false}"

let init_worker () =
  Runtime.invoke1 "thread-api/init" (Wire.Array [])
  |> Js.Promise.then_ (fun _ ->
         (* cljs events.cljs :graph/sync-context — :dev? flips the
            worker's OUTLINER-PERF-LOGGING mirror used by e2e *)
         Runtime.invoke1 "thread-api/set-context"
           (Wire.Map
              [ (Wire.kw "dev?", Wire.Bool Platform.dev_build) ]))
  |> Js.Promise.then_ (fun _ ->
         (* single-arg map like cljs state/set-db-sync-config *)
         Runtime.invoke1 "thread-api/set-db-sync-config"
           (Rtc_ops.db_sync_config ()))
  |> Js.Promise.then_ (fun _ ->
         (* cljs pushes sync-app-state at boot so a stored login reaches
            the worker before any db-sync call *)
         Rtc_ops.sync_app_state !Runtime.current_repo;
         Js.Promise.resolve ())

let list_graphs () =
  Runtime.invoke "thread-api/list-db" []
  |> Js.Promise.then_ (fun w -> Js.Promise.resolve (Decode.repos_of_list_db w))

let open_graph repo =
  Runtime.invoke2 "thread-api/create-or-open-db" (Wire.String repo)
    (Wire.Map [])

(* cljs events.cljs <build-search-index!: on graph open the frontend asks
   the worker to build blocks_fts; seed entities (Library etc.) only reach
   the index through this call since the tx listener ignores seed txns *)
let build_search_index repo =
  Runtime.invoke1 "thread-api/search-build-blocks-indice-in-worker"
    (Wire.String repo)
  |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ())
  |> Js.Promise.catch (fun e ->
         Platform.console_error ("search-build-blocks-indice failed", e);
         Js.Promise.resolve ())
  |> ignore

let create_graph ?(remote = false) name =
  let repo = full_graph_name name in
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
  |> Js.Promise.then_ (fun _ -> Js.Promise.resolve repo)

(* cljs <create! title {:today-journal? true} via outliner-op create-page *)
let create_today_journal repo =
  let title = Dates.today () in
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
  |> Js.Promise.then_ (fun _ -> Js.Promise.resolve title)
