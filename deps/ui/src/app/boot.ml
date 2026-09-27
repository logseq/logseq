(* Boot sequence — handler/start! equivalent:
   spawn worker -> init -> list-db -> open or create Demo graph ->
   ensure today journal -> load route page -> mark ready. *)

let demo_graph = "Demo"

(* pick the graph to open: first existing repo, else create Demo. *)
let pick_graph repos =
  match repos with
  | first :: _ -> Js.Promise.resolve first
  | [] -> Graph.create_graph demo_graph

let ensure_today_journal repo =
  let day = Dates.today_journal_day () in
  Runtime.invoke2 "thread-api/get-journal-page-by-day" (Wire.String repo)
    (Wire.Int day)
  |> Js.Promise.then_ (fun page ->
         match page with
         | Wire.Map _ -> Js.Promise.resolve ()
         | _ ->
             Graph.create_today_journal repo
             |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ()))

let load_home_page repo =
  let day = Dates.today_journal_day () in
  Runtime.invoke2 "thread-api/get-journal-page-by-day" (Wire.String repo)
    (Wire.Int day)
  |> Js.Promise.then_ (fun page_w ->
         match Decode.page_of_summary page_w with
         | Some page -> (
             let ref_v =
               match page.Model.page_uuid with
               | Some u ->
                   (* lookup-ref [:block/uuid u] *)
                   Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid u ]
               | None -> Wire.String page.Model.page_title
             in
             Runtime.invoke3 "thread-api/get-page-blocks-tree"
               (Wire.String repo) ref_v Wire.Nil
             |> Js.Promise.then_ (fun blocks_w ->
                    Js.Promise.resolve
                      (Some
                         { page with
                           Model.page_blocks =
                             Decode.blocks_of_wire blocks_w
                         })))
         | None -> Js.Promise.resolve None)

let run () =
  Runtime.worker := Some (Worker_client.create ());
  Graph.init_worker ()
  |> Js.Promise.then_ (fun () -> Graph.list_graphs ())
  |> Js.Promise.then_ (fun repos ->
         Runtime.send (Action.Repos_loaded repos);
         pick_graph repos)
  |> Js.Promise.then_ (fun repo ->
         Graph.open_graph repo
         |> Js.Promise.then_ (fun _ -> Js.Promise.resolve repo))
  |> Js.Promise.then_ (fun repo ->
         ensure_today_journal repo
         |> Js.Promise.then_ (fun () -> Js.Promise.resolve repo))
  |> Js.Promise.then_ (fun repo ->
         Runtime.send (Action.Boot_graph_ready repo);
         load_home_page repo)
  |> Js.Promise.then_ (fun page_opt ->
         (match page_opt with
          | Some page -> Runtime.send (Action.Page_loaded page)
          | None -> ());
         Js.Promise.resolve ())
  |> Js.Promise.catch (fun err ->
         Platform.console_error ("boot failed", err);
         Js.Promise.resolve ())
