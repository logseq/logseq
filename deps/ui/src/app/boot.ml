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

(* e2e contract: html lang reflects preferred-language storage key.
   Theme/accent/font/wide-mode mirror cljs theme.cljs container effects;
   storage keys use cljs `(name key)` semantics (namespace stripped). *)
let apply_storage_env () =
  let lang =
    match Platform.local_storage_get "preferred-language" with
    | Some v -> unquote v
    | None -> "en"
  in
  Platform.document_set_lang lang;
  let system =
    match Platform.local_storage_get "system-theme?" with
    | Some v -> unquote v = "true"
    | None -> false
  in
  let theme =
    if system then if Browser_ui.prefers_dark () then "dark" else "light"
    else
      match Platform.local_storage_get "theme" with
      | Some v -> unquote v
      | None -> "light"
  in
  Settings_view.apply_theme_dom theme;
  let accent =
    match Platform.local_storage_get "radix-color" with
    | Some v -> (
        let v = unquote v in
        if String.length v > 0 && String.get v 0 = ':' then
          String.sub v 1 (String.length v - 1)
        else v)
    | None -> "logseq"
  in
  Platform.document_set_data "color" accent;
  (match Platform.local_storage_get "editor-font" with
   | Some v -> (
       match Edn.parse (unquote v) with
       | Wire.Map kvs ->
           let m = Wire.Map kvs in
           (match Wire.get m "type" with
            | Some (Wire.String t) -> Platform.document_set_data "font" t
            | _ -> ());
           (match Wire.get m "global" with
            | Some (Wire.Bool g) ->
                Platform.document_set_data "font-global"
                  (if g then "true" else "false")
            | _ -> ())
       | _ -> ())
   | None -> ());
  let wide =
    match Platform.local_storage_get "wide-mode" with
    | Some v -> unquote v = "true" || v = "true"
    | None -> false
  in
  if wide then
    match Browser_ui.qs "#app-container-wrapper" with
    | Some el -> Browser_ui.add_class el "ls-wide-mode"
    | None -> ()

(* pick the graph to open: the repo a deep link's ?graph-id= resolves to
   (via the uuid persisted in ls-graphs-metadata), else the first existing
   repo, else create Demo. *)
let pick_graph repos =
  let resolved =
    match Platform.hash_query_param "graph-id" with
    | Some gid -> Graphs_meta.repo_of_uuid gid
    | None -> None
  in
  match resolved with
  | Some repo when List.mem repo repos -> Js.Promise.resolve repo
  | _ -> (
      match repos with
      | first :: _ -> Js.Promise.resolve first
      | [] -> Graph.create_graph demo_graph)

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
  (* emoji-mart: registers <em-emoji> + SearchIndex *)
  Emoji_mart.install ();
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
