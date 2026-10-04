(* Boot sequence — handler/start! equivalent:
   spawn worker -> init -> list-db -> open or create Demo graph ->
   ensure today journal -> load route page -> mark ready. *)

open Promise_ext
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
    (* cljs state.cljs :ui/system-theme? defaults to true *)
    match Platform.local_storage_get "system-theme?" with
    | Some v -> unquote v = "true"
    | None -> true
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
    (* cljs storage key is (name :ui/radix-color) = "radix-color" *)
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

(* pick the graph to open (cljs graph/resolve-startup-repo): the repo a
   deep link's ?graph-id= resolves to (via ls-graphs-metadata), else the
   repo this tab last had open (sessionStorage ls-tab-repo /
   ls-tab-graph-id), else the first existing repo, else create Demo. *)
let pick_graph repos =
  let url_target =
    match Platform.hash_query_param "graph-id" with
    | Some gid -> Graphs_meta.repo_of_uuid gid
    | None -> None
  in
  let tab_target =
    match Platform.session_storage_get "ls-tab-repo" with
    | Some repo when repo <> "" && List.mem repo repos -> Some repo
    | _ -> (
        match Platform.session_storage_get "ls-tab-graph-id" with
        | Some gid when gid <> "" -> Graphs_meta.repo_of_uuid gid
        | _ -> None)
  in
  match url_target, tab_target with
  | Some repo, _ when List.mem repo repos -> Js.Promise.resolve repo
  | _, Some repo when List.mem repo repos -> Js.Promise.resolve repo
  | _ -> (
      match repos with
      | first :: _ -> Js.Promise.resolve first
      | [] -> Graph.create_graph demo_graph)

let ensure_today_journal repo =
  let day = Dates.today_journal_day () in
  let* page =
    Runtime.invoke2 "thread-api/get-journal-page-by-day" (Wire.String repo)
      (Wire.Int day)
  in
  match page with
  | Wire.Map _ -> Js.Promise.resolve ()
  | _ ->
      let* _ = Graph.create_today_journal repo in
      Js.Promise.resolve ()

let run () =
  apply_storage_env ();
  (* emoji-mart: registers <em-emoji> + SearchIndex *)
  Emoji_mart.install ();
  (* pdf: Pdf_state.open_request -> mount/teardown the viewer portal *)
  Pdf.install ();
  let w = Worker_client.create () in
  Worker_client.notify_worker_failure :=
    (fun () -> Toast.error (I18n.t "storage/db-worker-crashed-error"));
  w.on_message <- Worker_events.dispatch;
  Worker_events.init ();
  Runtime.worker := Some w;
  (let* () = Graph.init_worker () in
  let* repos = Graph.list_graphs () in
  let* repo =
    Runtime.send (Action.Repos_loaded repos);
    pick_graph repos
  in
  let* _ = Graph.open_graph repo in
  let* repo =
    Graphs_meta.touch repo;
    Js.Promise.resolve repo
  in
  let* () = ensure_today_journal repo in
  let* repo =
    Graph.build_search_index repo;
    Js.Promise.resolve repo
  in
  Runtime.send (Action.Boot_graph_ready repo);
  Graph.build_search_index repo;
  (* initial route resolution (deep link or home) *)
  Router.resolve ();
  (* the pre-route hash stays "" until the first navigation, and
     set_location_hash refuses to push "" onto the back stack — so the
     very first in-app nav was un-undoable. Seed the home hash so the
     first nav can go back. *)
  if Platform.location_hash () = "" then
    Platform.replace_url_fragment "#/";
  Js.Promise.resolve ())
  |> Js.Promise.catch (fun err ->
         Platform.console_error ("boot failed", err);
         Toast.error (I18n.t "graph/load-error");
         Js.Promise.resolve ())
