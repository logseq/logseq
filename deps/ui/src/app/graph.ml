(* Graph lifecycle: init worker, list/open/create graphs, today journal.
   Mirrors frontend/persist_db/browser.cljs start-db-worker! +
   frontend/handler/repo.cljs get-repos/new-db!/create-db. *)

let db_version_prefix = "logseq_db_"

let full_graph_name name = db_version_prefix ^ String.trim name

let default_config = "{:feature/enable-git-auto-commit? false}"

let init_worker () =
  Runtime.invoke1 "thread-api/init" (Wire.Array [])
  |> Js.Promise.then_ (fun _ ->
         Runtime.invoke2 "thread-api/set-db-sync-config" (Wire.String "")
           (Wire.Map
              [ (Wire.kw "enabled?", Wire.Bool true)
              ; (Wire.kw "ws-url", Wire.Nil)
              ; (Wire.kw "http-base", Wire.Nil)
              ]))
  |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ())

let list_graphs () =
  Runtime.invoke "thread-api/list-db" []
  |> Js.Promise.then_ (fun w -> Js.Promise.resolve (Decode.repos_of_list_db w))

let open_graph repo =
  Runtime.invoke2 "thread-api/create-or-open-db" (Wire.String repo)
    (Wire.Map [])

let create_graph name =
  let repo = full_graph_name name in
  Runtime.invoke2 "thread-api/create-or-open-db" (Wire.String repo)
    (Wire.Map
       [ (Wire.kw "config", Wire.String default_config)
       ; (Wire.kw "graph-git-sha", Wire.Nil)
       ])
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
