(* Graph operations: list/refresh, create (local + remote-sync), open/switch,
   delete, and ls-graphs-metadata bookkeeping. Mirrors
   components/repo.cljs repos-cp + repo/remove-repo!. *)

open Promise_ext
module T = I18n

(* The reducer owns local graph membership for views and operations. *)
let repos () = (Runtime.model ()).Model.repos

(* cljs repo.cljs invalid-graph-name? reserved chars *)
let reserved_characters () =
  [ '<', T.t "graph.validation/reserved-character-less-than"
  ; '>', T.t "graph.validation/reserved-character-greater-than"
  ; ':', T.t "graph.validation/reserved-character-colon"
  ; '"', T.t "graph.validation/reserved-character-double-quote"
  ; '/', T.t "graph.validation/reserved-character-forward-slash"
  ; '\\', T.t "graph.validation/reserved-character-backslash"
  ; '|', T.t "graph.validation/reserved-character-pipe"
  ; '?', T.t "graph.validation/reserved-character-question-mark"
  ; '*', T.t "graph.validation/reserved-character-asterisk"
  ; '#', T.t "graph.validation/reserved-character-hash"
  ; '+', T.t "graph.validation/reserved-character-plus" ]

let invalid_chars name =
  let out = ref [] in
  String.iter
    (fun c ->
      if String.contains "<>:\"/\\|?*#" c then out := c :: !out)
    name;
  if String.contains name '+' then out := '+' :: !out;
  List.rev !out

let invalid_name name = invalid_chars name <> []

let warn_invalid_name () =
  let lines =
    List.map (fun (character, label) -> Printf.sprintf "%c (%s)" character label)
      (reserved_characters ())
  in
  Toast.show ~key:Toast.reserved_graph_name_key ~kind:"warning" ~duration:0
    (String.concat "\n" (T.t "graph.validation/name-reserved-characters-warning" :: lines))

let is_demo repo =
  let suffixed = "Demo" in
  repo = "logseq_db_Demo"
  || let lr = String.length repo and ls = String.length suffixed in
     lr > ls && String.sub repo (lr - ls) ls = suffixed

let short_name repo =
  let p = "logseq_db_" in
  let lp = String.length p in
  if String.length repo > lp && String.sub repo 0 lp = p then
    String.sub repo lp (String.length repo - lp)
  else repo

let already_exists name =
  List.mem (Graph.full_graph_name name) (repos ())

(* remote graphs known to the sync server:
   (name-without-prefix, uuid, e2ee?, role) — role is the caller's
   graph_members role ("manager" | "member"), cljs
   :graph<->user-user-type *)
let remote_graphs : (string * string * bool * string) list ref = ref []

let list_remote_graphs () =
  (* the sync server rejects list-remote-graphs without a token — skip
     the request entirely when logged out and keep the local list *)
  if not (Rtc_flows.logged_in ()) then (
    remote_graphs := [];
    Js.Promise.resolve [])
  else begin
    (let* _ = Rtc_ops.sync_app_state (Runtime.model ()).Model.repo in
     let* w = Runtime.invoke "thread-api/db-sync-list-remote-graphs" [] in
  let entries =
    match w with
    | Wire.Array xs | Wire.List xs -> xs
    | _ -> []
  in
  remote_graphs :=
    List.filter_map
      (fun g ->
        match
          ( Wire.map_get_string g "graph-name"
          , Wire.map_get_string g "graph-id" )
        with
        | Some name, Some id ->
            let e2ee =
              match Wire.get g "graph-e2ee?" with
              | Some (Wire.Bool b) -> b
              | _ -> false
            in
            let role =
              Option.value (Wire.map_get_string g "role") ~default:"" in
            Some (name, id, e2ee, role)
        | _ -> None)
      entries;
  Js.Promise.resolve !remote_graphs)
  |> Js.Promise.catch (fun e ->
         (* offline / server errors: keep the previous list *)
         Ui_services.log_error ("list-remote-graphs failed", e);
         Js.Promise.resolve !remote_graphs)
  end

(* removable? = not (demo && it's the only graph) *)
let removable repo =
  not (is_demo repo && List.length (repos ()) = 1)

(* -- ls-graphs-metadata (localStorage EDN map, see Graphs_meta) -- *)

let meta_last_seen = Graphs_meta.last_seen

(* -- list + refresh -- *)

(* graphs_view registers a rerender callback here (avoids a module cycle) *)
let on_repos_changed : (unit -> unit) ref = ref (fun () -> ())

(* remote-graph-gone broadcast hookup (same cycle-avoidance trick) *)
let () =
  Runtime.remote_graph_gone :=
    (fun () ->
      ignore
        (let* _ = list_remote_graphs () in
        !on_repos_changed ();
        Js.Promise.resolve ()))

let refresh () =
  let* rs = Graph.list_graphs () in
  Runtime.send (Action.Repos_loaded rs);
  Runtime.flush ();
  !on_repos_changed ();
  Js.Promise.resolve rs

(* cljs state/add-repo! — the worker broadcasts add-repo when a remote
   graph download finishes; the local list must include it without
   waiting for a full list-db refresh *)
let add_repo repo =
  if not (List.mem repo (repos ())) then begin
    Runtime.send (Action.Repos_loaded (repos () @ [ repo ]));
    !on_repos_changed ()
  end

let () = Runtime.add_repo := add_repo

(* -- switch / navigate -- *)

(* Generation counter on navigation requests: two navigations can be
   in flight at once (e.g. delete-redirect racing a remote-graph
   download), and the earlier one's continuation must not win just
   because it resolved later. Only the newest request applies. *)
let nav_req = ref 0

let navigate_journal repo =
  incr nav_req;
  let seq = !nav_req in
  Editor_actions.after_pending_input (fun () ->
  if !nav_req <> seq then Js.Promise.resolve () else begin
  Graphs_meta.touch repo;
  let* config = Graph.open_graph repo in
  let* () = Boot.ensure_today_journal repo in
  Editor_actions.after_pending_input (fun () ->
  if !nav_req = seq then begin
    Worker_events.reset_rtc ();
    Runtime.send (Action.Boot_graph_ready (repo,config));
    Graph.build_search_index repo;
    Ui_services.nav_set_hash (Runtime.nav_hash "/");
    Router.resolve ()
  end;
  Js.Promise.resolve ())
  end)

(* -- create -- *)

(* cljs create-db (with creating-remote-graph?) then
   <rtc-create-graph-and-start-sync!: open + today's journal land
   BEFORE create-remote/start so flush-pending has a graph-id and the
   initial page txs upload. *)
let create_remote name e2ee =
  let* r = Graph.create_graph ~remote:true name in
  add_repo r;
  let* config = Graph.open_graph r in
  let* () = Boot.ensure_today_journal r in
  Worker_events.reset_rtc ();
  Runtime.send (Action.Boot_graph_ready (r, config));
  Graph.build_search_index r;
  let* _ = Rtc_ops.sync_app_state (Some r) in
  let* _ = Rtc_ops.set_sync_config () in
  let* w =
    Runtime.invoke3 "thread-api/db-sync-create-remote-graph"
      (Wire.String r) (Wire.Bool e2ee) (Wire.Bool true)
  in
  if Rtc_error.is_error w then begin
    Rtc_error.report_outcome "create-remote-graph" w;
    Js.Promise.resolve r
  end
  else begin
    let* _ = list_remote_graphs () in
    Rtc_ops.start r;
    Js.Promise.resolve r
  end

(* cljs :rtc/download-remote-graph -> <rtc-download-graph! ->
   <get-remote-graphs -> :graph/switch -> <rtc-start!. A failed
   download (e.g. wrong e2ee password — toasted inside
   Rtc_ops.download) aborts the chain; the cljs rejected promise did
   the same *)
let download_remote ~name ~uuid ~e2ee =
  let repo = Graph.full_graph_name name in
  let* ok = Editor_actions.after_pending_input (fun () ->
      Rtc_ops.download repo uuid e2ee) in
  if not ok then Js.Promise.resolve ()
  else begin
    let* _ = list_remote_graphs () in
    let* () = navigate_journal repo in
    Rtc_ops.start repo;
    Js.Promise.resolve ()
  end

let remember_open repo =
  Graphs_meta.touch repo;
  refresh () |> ignore

(* -- delete (remove-repo!) -- *)

(* cljs frontend.handler.db-based.sync <rtc-delete-graph!: HTTP DELETE
   {http-base}/graphs/{graph-uuid} with the Cognito id-token — the worker
   has no thread-api delete endpoint. *)
let delete_remote_http uuid =
  match Ui_services.storage_get "id-token" with
  | None -> Js.Promise.resolve false
  | Some token ->
      let init =
        Fetch.RequestInit.make ~method_:Delete
          ~headers:
            (Fetch.HeadersInit.makeWithArray
               [| ("Authorization", "Bearer " ^ token) |])
          ()
      in
      (let* _ =
         Fetch.fetchWithInit
           (Rtc_ops.http_base () ^ "/graphs/" ^ uuid)
           init
       in
       Js.Promise.resolve true)
      |> Js.Promise.catch (fun e ->
             Ui_services.log_error ("remote graph delete failed", e);
             Js.Promise.resolve false)

let delete_graph repo ~remote =
  let drop_from_repos () =
    Runtime.send (Action.Repos_loaded (List.filter (fun r -> r <> repo) (repos ())));
    !on_repos_changed ()
  in
  let finish () =
    Editor_actions.after_pending_input (fun () ->
    let* ok =
      (let* w = Runtime.invoke1 "thread-api/unsafe-unlink-db" (Wire.String repo) in
       if Rtc_error.is_error w then begin
         Rtc_error.report_outcome "unlink-db" w;
         Js.Promise.resolve false
       end else Js.Promise.resolve true)
      |> Js.Promise.catch (fun e ->
             Ui_services.log_error ("unlink-db failed " ^ repo, e);
             Js.Promise.resolve false)
    in
    if not ok then Js.Promise.resolve ()
    else begin
      drop_from_repos ();
      Graphs_meta.drop repo;
      match (Runtime.model ()).Model.repo = Some repo, (repos ()) with
      | true, next :: _ ->
          Toast.success (T.removed_redirecting (short_name repo) (short_name next));
          navigate_journal next
      | true, [] ->
          Toast.success (T.removed (short_name repo));
          Custom_css.remove ();
          Runtime.send Action.Graph_closed;
          Router.resolve ();
          Js.Promise.resolve ()
      | false, _ ->
          Toast.success (T.removed (short_name repo));
          Js.Promise.resolve ()
    end)
  in
  if remote then
    match
      List.find_opt
        (fun (n, _, _, _) -> n = short_name repo)
        !remote_graphs
    with
    | Some (_, uuid, _, _) ->
        let* remote_ok = delete_remote_http uuid in
        if remote_ok then finish ()
        else (
          Toast.error (I18n.t "graph/delete-remote-server-error");
          Js.Promise.resolve ())
    | None -> finish ()
  else finish ()

let ask_delete ~remote repo =
  (* cljs delete-local-graph!/delete-remotely: confirm with
     :title = confirm-desc, :description = delete-warning *)
  Dialogs_state.ask
    ~title:
      (if remote then T.delete_remote_confirm (short_name repo)
       else T.delete_local_confirm (short_name repo))
    ~desc:(T.t "graph/delete-warning")
    ~on_confirm:(fun () -> ignore (delete_graph repo ~remote))
    ()

(* cljs sync.cljs <rtc-upload-graph!: sync-auth-state ->
   db-sync-upload-graph -> <get-remote-graphs -> <rtc-start!. Worker
   failures resolve as error transits — toast the known ones and skip
   list/start like the cljs rejected chain *)
let upload repo =
  let* () =
    (* cljs <ensure-current-graph-for-upload! — switch first so the
       upload binds the open repo *)
    if (Runtime.model ()).Model.repo = Some repo then Js.Promise.resolve ()
    else navigate_journal repo
  in
  let* _ = Rtc_ops.sync_app_state (Some repo) in
  let* _ = Rtc_ops.set_sync_config () in
  let* w =
    Runtime.invoke1 "thread-api/db-sync-upload-graph" (Wire.String repo)
  in
  if Rtc_error.is_error w then begin
    Rtc_error.report_outcome "upload-graph" w;
    Js.Promise.resolve ()
  end
  else begin
    let* _ = list_remote_graphs () in
    Rtc_ops.start repo;
    Js.Promise.resolve ()
  end

(* cljs repo.cljs upload-local-graph-with-confirm!: confirm dialog
   (content-only alert) then the upload chain *)
let ask_upload repo =
  Dialogs_state.ask
    ~title:""
    ~desc:(I18n.t1 "graph/upload-local-confirm-desc" (short_name repo))
    ~on_confirm:(fun () -> ignore (upload repo))
    ()

(* after a graph opens, fetch + remember its worker uuid; in-graph routes
   carry ?graph-id=<uuid> inside the hash so deep links and reloads can
   resolve back to the repo (cljs handler.graph/remember-current-graph-id-in-tab!) *)
let () =
  Runtime.hooks.on_graph_opened <- fun repo ->
    (* cljs theme.cljs reset-custom-css! on :current-graph-changed *)
    ignore (Custom_css.reset_for_repo repo);
    ignore
      (let* w = Runtime.invoke1 "thread-api/get-graph-uuid" (Wire.String repo) in
      (* cljs graph_tab/set-tab-graph! — sessionStorage keys so a
                 reload reopens this tab's graph *)
      Ui_services.session_set "ls-tab-repo" repo;
      (match Wire.as_uuid w with
       | Some uuid ->
           Ui_services.session_set "ls-tab-graph-id" uuid;
           Runtime.current_graph_uuid := Some uuid;
           Graphs_meta.remember_uuid repo uuid;
           Runtime.sync_hash_graph_id ()
       | None -> ());
      Js.Promise.resolve ())
