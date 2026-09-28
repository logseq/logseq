(* Boot sequence — handler/start! equivalent:
   spawn worker -> init -> list-db -> open or create Demo graph ->
   ensure today journal -> load route page -> mark ready. *)

let demo_graph = "Demo"

(* storage values are edn-ish strings: "\"en\"" -> "en" *)
let unquote s =
  let len = String.length s in
  if len >= 2 && String.get s 0 = '"' && String.get s (len - 1) = '"' then
    String.sub s 1 (len - 2)
  else s

(* e2e contract: html lang reflects preferred-language storage key *)
let apply_storage_env () =
  let lang =
    match Platform.local_storage_get "preferred-language" with
    | Some v -> unquote v
    | None -> "en"
  in
  Platform.document_set_lang lang;
  let theme =
    match Platform.local_storage_get "ui/theme" with
    | Some v -> unquote v
    | None -> "light"
  in
  Platform.document_set_data "theme" theme;
  Platform.document_set_data "color" "logseq"

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

let run () =
  apply_storage_env ();
  let w = Worker_client.create () in
  w.on_message <- Worker_events.dispatch;
  Worker_events.init ();
  Runtime.worker := Some w;
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
         Graph.build_search_index repo;
         (* initial route resolution (deep link or home) *)
         Router.resolve ();
         Js.Promise.resolve ())
  |> Js.Promise.catch (fun err ->
         Platform.console_error ("boot failed", err);
         Js.Promise.resolve ())
