(* Boot sequence — handler/start! equivalent:
   spawn worker -> init -> list-db -> open or create Demo graph ->
   ensure today journal -> load route page -> mark ready. *)

open Promise_ext
let demo_graph = "Demo"

(* e2e contract: html lang reflects preferred-language storage key.
   Theme/accent/font/wide-mode mirror cljs theme.cljs container effects;
   storage keys use cljs `(name key)` semantics (namespace stripped). *)
let apply_storage_env () =
  Keymap_data.reload_shortcuts ();
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
    match Ui_services.dom_query "#app-container-wrapper" with
    | Some el -> el.Ui_services.add_class "ls-wide-mode"
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

let ensure_today_journal ?(invoke = Runtime.invoke) repo =
  let day = Dates.today_journal_day () in
  let* page =
    invoke "thread-api/get-journal-page-by-day" [ Wire.String repo; Wire.Int day ]
  in
  match page with
  | Wire.Map _ -> Js.Promise.resolve ()
  | _ ->
      let* _ = Graph.create_today_journal ~invoke repo in
      Js.Promise.resolve ()

let published_boot : (unit -> unit Js.Promise.t) ref =
  ref (fun () -> failwith "Publishing boot is not installed")

let boot_mark = Graph.boot_mark

let configure_recovery w =
  let status_key = "db-worker-reconnecting" in
  let auth_generation = ref 0 in
  let pending_logout : (unit -> unit) option ref = ref None in
  let show ?duration ~key ~kind message =
    Toast.dismiss_key key;
    Toast.show ?duration ~key ~kind message
  in
  let current_worker () =
    match !Runtime.worker with Some current -> current == w | None -> false
  in
  let invalidate () =
    incr Runtime.load_gen;
    incr Outliner_ops.refresh_gen;
    Outliner_ops.cancel_pending_save ();
    Runtime.after_page_load := None;
    ignore (Editor_actions.consume_pending_zoom ());
    Router.cancel_reload ();
    Rtc_flows.cancel_pending_start ();
    Subs.clear_pending_deltas ();
    Page_delta.reset ();
    Worker_events.reset_rtc ()
  in
  let on_state (state : Worker_client.lifecycle) =
    if current_worker () then
      match state.phase with
      | Worker_client.Recovering ->
          invalidate ();
          Toast.dismiss_key "db-worker-recovery-failed";
          show ~key:status_key ~duration:0 ~kind:"info"
            (I18n.t "graph/db-worker-reconnecting-status")
      | Worker_client.Ready ->
          Toast.dismiss_key status_key;
          Toast.dismiss_key "db-worker-request-not-sent";
          (match state.scope with
           | Some scope when (Runtime.model ()).Model.repo = Some scope.repo
                             && (Runtime.model ()).Model.phase = Model.Ready ->
               Runtime.run_sync_subs [];
               Rtc_flows.notify_repo_switch scope.repo;
               ignore (Outliner_ops.resync_open_editor ())
           | _ -> ())
      | Worker_client.Disconnected ->
          invalidate ();
          Toast.dismiss_key status_key
      | Worker_client.Failed _ ->
          invalidate ();
          Toast.dismiss_key status_key;
          if (Runtime.model ()).Model.phase = Model.Booting then
            Runtime.send (Action.Boot_failed (I18n.t "graph/load-error"));
          (match state.scope with
           | Some scope ->
               show ~key:"db-worker-recovery-failed" ~kind:"error"
                 (I18n.t1 "graph/db-worker-recovery-failed-error" scope.repo)
           | None -> ())
  in
  let on_request_failure (failure : Worker_client.request_failure) =
    if current_worker () then
      match failure.outcome with
      | Worker_client.Not_sent ->
          (match (Worker_client.lifecycle w).phase with
           | Worker_client.Recovering -> ()
           | _ ->
               show ~key:"db-worker-request-not-sent" ~kind:"error"
                 (I18n.t "graph/db-worker-request-not-sent-error"))
      | Worker_client.Outcome_unknown ->
          show ~key:"db-worker-outcome-unknown" ~kind:"error"
            (I18n.t "graph/db-worker-outcome-unknown-error")
  in
  let rehydrate (bootstrap : Worker_client.bootstrap) =
    let prior_repo = (Runtime.model ()).Model.repo in
    let changed = prior_repo <> Some bootstrap.scope.repo in
    let model_prepared = ref false in
    let current () =
      current_worker () && bootstrap.is_current ()
      && (not !model_prepared || (Runtime.model ()).Model.repo = Some bootstrap.scope.repo)
    in
    let require_current () =
      if not (current ()) then failwith "Worker recovery was superseded"
    in
    let failed = ref false in
    let invoke name args =
      require_current ();
      (let* result = bootstrap.invoke name args in
       require_current ();
       Js.Promise.resolve result)
      |> Js.Promise.catch (fun error ->
             failed := true;
             Js.Promise.reject (Js.Exn.anyToExnInternal error))
    in
    let* () = Graph.init_worker ~invoke ~repo:(Some bootstrap.scope.repo) () in
    let* config = Graph.open_graph ~invoke bootstrap.scope.repo in
    require_current ();
    Runtime.send (Action.Graph_prepared (bootstrap.scope.repo, config));
    model_prepared := true;
    if changed then
      Runtime.send
        (Action.Navigate_to
           (match prior_repo with
            | None -> Router.parse_path (Router.route_path ())
            | Some _ -> Model.Home));
    require_current ();
    Render_inline.invalidate_pull_caches ();
    Editor_state.bump_invalidation ();
    let rec reload () =
      require_current ();
      let route = Runtime.route () in
      let* () = Router.rehydrate ~invoke ~current () in
      require_current ();
      if route <> Runtime.route () then reload () else Js.Promise.resolve ()
    in
    let* () = reload () in
    require_current ();
    if !failed then Js.Promise.reject (Failure "Worker model recovery failed")
    else Js.Promise.resolve ()
  in
  Worker_client.configure_recovery w ~on_state ~on_request_failure ~rehydrate;
  let warn_logout () =
    show ~key:"account-logout-sync-unconfirmed" ~duration:0 ~kind:"error"
      (I18n.t "account/logout-sync-unconfirmed-error")
  in
  let reconnect_current () =
    if current_worker () then (
      Worker_client.disconnect w;
      match (Runtime.model ()).Model.repo with
      | Some repo when current_worker () &&
            (Worker_client.lifecycle w).phase = Worker_client.Disconnected ->
          ignore
            (Worker_client.reconnect_existing w ~repo
             |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ())
             |> Js.Promise.catch (fun error ->
                    Ui_services.log_error ("worker auth recovery failed", error);
                    Js.Promise.resolve ()))
      | _ -> ())
  in
  Runtime.worker_auth_changed := (function
    | Runtime.Auth_updated ->
        incr auth_generation;
        Option.iter (fun cancel -> cancel ()) !pending_logout;
        pending_logout := None;
        if current_worker () then (reconnect_current (); true) else false
    | Runtime.Logout ->
        if not (current_worker ()) then false
        else (match !pending_logout with
          | Some _ -> true
          | None ->
              incr auth_generation;
              let generation = !auth_generation in
              let state = Worker_client.lifecycle w in
              let current_scope scope =
                current_worker () && !auth_generation = generation
                && (let active = Worker_client.lifecycle w in
                    active.phase = Worker_client.Ready
                    && active.scope = Some scope)
              in
              match state.scope with
              | Some scope when state.phase = Worker_client.Ready ->
                  let model_repo = (Runtime.model ()).Model.repo in
                  let closed = ref false in
                  let remaining = ref 2 in
                  let failed = ref false in
                  let timer = ref None in
                  let finish () =
                    if not !closed then (
                      closed := true;
                      Option.iter Ui_services.timers_clear_timeout !timer;
                      pending_logout := None;
                      if !failed || !remaining > 0 then warn_logout ();
                      if current_scope scope &&
                         (Runtime.model ()).Model.repo = model_repo then (
                        Worker_client.disconnect w;
                        if current_worker () && !auth_generation = generation
                           && (Worker_client.lifecycle w).phase =
                              Worker_client.Disconnected
                        then (match (Runtime.model ()).Model.repo with
                          | Some repo when repo = scope.repo ->
                              ignore
                                (Worker_client.reconnect_existing w ~repo
                                 |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ())
                                 |> Js.Promise.catch (fun error ->
                                        Ui_services.log_error
                                          ("worker auth recovery failed", error);
                                        Js.Promise.resolve ()))
                          | _ -> ())))
                  in
                  let cancel () =
                    if not !closed then (
                      closed := true;
                      Option.iter Ui_services.timers_clear_timeout !timer;
                      if !failed || !remaining > 0 then warn_logout ())
                  in
                  pending_logout := Some cancel;
                  timer := Some (Ui_services.timers_timeout finish 2000);
                  let settle succeeded =
                    if not !closed then (
                      if not succeeded then failed := true;
                      decr remaining;
                      if !remaining = 0 then finish ())
                  in
                  let invoke = Worker_client.invoke w in
                  let send call =
                    if not (current_scope scope) then settle false
                    else
                      let request =
                        try call () with error -> Js.Promise.reject error
                      in
                      ignore
                        (request
                         |> Js.Promise.then_ (fun () ->
                                settle true; Js.Promise.resolve ())
                         |> Js.Promise.catch (fun _ ->
                                settle false; Js.Promise.resolve ()))
                  in
                  send (fun () -> Rtc_ops.stop_async ~invoke ());
                  send (fun () -> Rtc_ops.clear_auth_async ~invoke ());
                  true
              | _ ->
                  warn_logout ();
                  reconnect_current ();
                  true))

let run () =
  apply_storage_env ();
  (* emoji-mart: registers <em-emoji> + SearchIndex *)
  Emoji_mart.install ();
  (* pdf: Pdf_state.open_request -> mount/teardown the viewer portal *)
  Pdf.install ();
  Option.iter (fun old ->
      if Worker_client.supports_recovery old then
        Worker_client.disconnect old) !Runtime.worker;
  let w = Worker_client.create () in
  Worker_client.notify_worker_failure :=
    (fun () -> Toast.error (I18n.t "storage/db-worker-crashed-error"));
  w.on_message <- Worker_events.dispatch;
  Worker_events.init ();
  Runtime.worker := Some w;
  if Worker_client.supports_recovery w then configure_recovery w;
  (if Ui_services.env_publishing () then !published_boot () else
  (let* () =
     if Worker_client.supports_recovery w then Js.Promise.resolve ()
     else Graph.init_worker ()
   in
  let* repos = Graph.list_graphs () in
  boot_mark "list_graphs";
  let* repo =
    Runtime.send (Action.Repos_loaded repos);
    boot_mark "repos_loaded";
    pick_graph repos
  in
  boot_mark "picked";
  (* pick_graph may have just created the repo (fresh profile -> Demo);
     Repos_loaded fired before that create, so register it now — the
     header's local-graph-sync-btn checks m.repos membership *)
  if not (List.mem repo repos) then !Runtime.add_repo repo;
  boot_mark "opening";
  let* config = Graph.open_graph repo in
  boot_mark "opened";
  let* repo =
    Graphs_meta.touch repo;
    Js.Promise.resolve repo
  in
  let* () = ensure_today_journal repo in
  boot_mark "journal";
  Runtime.send (Action.Boot_graph_ready (repo,config));
  Graph.build_search_index repo;
  (* initial route resolution (deep link or home) *)
  Router.resolve ();
  (* the pre-route hash stays "" until the first navigation, and
     set_location_hash refuses to push "" onto the back stack — so the
     very first in-app nav was un-undoable. Seed the home hash so the
     first nav can go back. *)
  if Ui_services.nav_hash () = "" then
    Ui_services.nav_replace_hash "#/";
  boot_mark "route";
  Js.Promise.resolve ()))
  |> Js.Promise.catch (fun err ->
         Ui_services.log_error ("boot failed", err);
         let message = I18n.t "graph/load-error" in
         Runtime.send (Action.Boot_failed message);
         Toast.error message;
         Js.Promise.resolve ())
