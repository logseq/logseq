(* Boot sequence — handler/start! equivalent:
   spawn worker -> init -> list-db -> open or create Demo graph ->
   ensure today journal -> load route page -> mark ready. *)

open Promise_ext
let demo_graph = "Demo"

(* e2e contract: html lang reflects preferred-language storage key.
   Theme/accent/font/wide-mode mirror cljs theme.cljs container effects;
   storage keys use cljs `(name key)` semantics (namespace stripped). *)
let apply_storage_env () =
  let lang = Ui_services.doc_preferred_lang () in
  Ui_services.doc_set_lang lang;
  let theme =
    match Ui_services.theme_mode () with
    | "system" -> if Ui_services.theme_prefers_dark () then "dark" else "light"
    | mode -> mode
  in
  Settings_view.apply_theme_dom theme;
  let accent =
    (* cljs storage key is (name :ui/radix-color) = "radix-color" *)
    match Ui_services.storage_get "radix-color" with
    | Some v -> (
        let v = Ui_services.storage_unquote v in
        if String.length v > 0 && String.get v 0 = ':' then
          String.sub v 1 (String.length v - 1)
        else v)
    | None -> "logseq"
  in
  Ui_services.doc_set_data "color" accent;
  (match Ui_services.storage_get "editor-font" with
   | Some v -> (
       match Edn.parse (Ui_services.storage_unquote v) with
       | Wire.Map kvs ->
           let m = Wire.Map kvs in
           (match Wire.get m "type" with
            | Some (Wire.String t) -> Ui_services.doc_set_data "font" t
            | _ -> ());
           (match Wire.get m "global" with
            | Some (Wire.Bool g) ->
                Ui_services.doc_set_data "font-global"
                  (if g then "true" else "false")
            | _ -> ())
       | _ -> ())
   | None -> ());
  let wide =
    match Ui_services.storage_get "wide-mode" with
    | Some v -> Ui_services.storage_unquote v = "true" || v = "true"
    | None -> false
  in
  if wide then
    match Web_dom.query_selector "#app-container-wrapper" with
    | Some el -> Web_dom.el_class_add el "ls-wide-mode"
    | None -> ()

(* pick the graph to open (cljs graph/resolve-startup-repo): the repo a
   deep link's ?graph-id= resolves to (via ls-graphs-metadata), else the
   repo this tab last had open (sessionStorage ls-tab-repo /
   ls-tab-graph-id), else the first existing repo, else create Demo. *)
let pick_graph repos =
  let url_target =
    match Ui_services.nav_hash_query_param "graph-id" with
    | Some gid -> Graphs_meta.repo_of_uuid gid
    | None -> None
  in
  let tab_target =
    match Ui_services.session_get "ls-tab-repo" with
    | Some repo when repo <> "" && List.mem repo repos -> Some repo
    | _ -> (
        match Ui_services.session_get "ls-tab-graph-id" with
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

let published_boot : (unit -> unit Js.Promise.t) ref =
  ref (fun () -> failwith "Publishing boot is not installed")

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
  (if Ui_services.env_publishing () then !published_boot () else
  (let* () = Graph.init_worker () in
  let* repos = Graph.list_graphs () in
  let* repo =
    Runtime.send (Action.Repos_loaded repos);
    pick_graph repos
  in
  (* pick_graph may have just created the repo (fresh profile -> Demo);
     Repos_loaded fired before that create, so register it now — the
     header's local-graph-sync-btn checks m.repos membership *)
  if not (List.mem repo repos) then !Runtime.add_repo repo;
  let* _ = Graph.open_graph repo in
  let* repo =
    Graphs_meta.touch repo;
    Js.Promise.resolve repo
  in
  let* () = ensure_today_journal repo in
  Runtime.send (Action.Boot_graph_ready repo);
  Graph.build_search_index repo;
  (* initial route resolution (deep link or home) *)
  Router.resolve ();
  (* the pre-route hash stays "" until the first navigation, and
     set_location_hash refuses to push "" onto the back stack — so the
     very first in-app nav was un-undoable. Seed the home hash so the
     first nav can go back. *)
  if Ui_services.nav_hash () = "" then
    Ui_services.nav_replace_hash "#/";
  Js.Promise.resolve ()))
  |> Js.Promise.catch (fun err ->
         Ui_services.log_error ("boot failed", err);
         Toast.error (I18n.t "graph/load-error");
         Js.Promise.resolve ())
