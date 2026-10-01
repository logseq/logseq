(* Graph operations: list/refresh, create (local + remote-sync), open/switch,
   delete, and ls-graphs-metadata bookkeeping. Mirrors
   components/repo.cljs repos-cp + repo/remove-repo!. *)

open Promise_ext
module T = I18n

(* last known repo list (logseq_db_* names) for the all-graphs view +
   name-conflict checks *)
let repos : string list ref = ref []

(* cljs repo.cljs invalid-graph-name? reserved chars *)
let reserved = ":|\\*\\?\"<>|\\#\\\\/"

let invalid_chars name =
  let out = ref [] in
  String.iter
    (fun c ->
      if String.contains reserved c then out := c :: !out)
    name;
  if String.contains name '+' then out := '+' :: !out;
  List.rev !out

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
  List.mem (Graph.full_graph_name name) !repos

(* remote graphs known to the sync server:
   (name-without-prefix, uuid, e2ee?) *)
let remote_graphs : (string * string * bool) list ref = ref []

let list_remote_graphs () =
  Rtc_ops.sync_app_state !Runtime.current_repo;
  (let* w = Runtime.invoke "thread-api/db-sync-list-remote-graphs" [] in
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
            Some (name, id, e2ee)
        | _ -> None)
      entries;
  Js.Promise.resolve !remote_graphs)
  |> Js.Promise.catch (fun e ->
         (* logged out / offline: keep the previous list *)
         Platform.console_error ("list-remote-graphs failed", e);
         Js.Promise.resolve !remote_graphs)

(* removable? = not (demo && it's the only graph) *)
let removable repo =
  not (is_demo repo && List.length !repos = 1)

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
  repos := rs;
  Runtime.send (Action.Repos_loaded rs);
  Runtime.flush ();
  !on_repos_changed ();
  Js.Promise.resolve rs

(* cljs state/add-repo! — the worker broadcasts add-repo when a remote
   graph download finishes; the local list must include it without
   waiting for a full list-db refresh *)
let add_repo repo =
  if not (List.mem repo !repos) then begin
    repos := !repos @ [ repo ];
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
  Graphs_meta.touch repo;
  let* _ = Graph.open_graph repo in
  let* () = Boot.ensure_today_journal repo in
  if !nav_req = seq then begin
    Worker_events.reset_rtc ();
    Runtime.send (Action.Boot_graph_ready repo);
    Runtime.current_repo := Some repo;
    Graph.build_search_index repo;
    Platform.set_location_hash (Runtime.nav_hash "#/");
    Router.resolve ()
  end;
  Js.Promise.resolve ()

(* -- create -- *)

(* cljs <rtc-create-graph-and-start-sync!: create-remote-graph ->
   <get-remote-graphs -> <rtc-start! (which pushes sync-app-state +
   db-sync config). Worker failures resolve as error transits — toast
   the known ones and skip list/start like the cljs rejected chain
   (the local graph itself was still created) *)
let create_remote name e2ee =
  let* r = Graph.create_graph ~remote:true name in
  Rtc_ops.sync_app_state (Some r);
  Rtc_ops.set_sync_config ();
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
  let* ok = Rtc_ops.download repo uuid e2ee in
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
  match Platform.local_storage_get "id-token" with
  | None -> Js.Promise.resolve false
  | Some token ->
      let init =
        Fetch.RequestInit.make ~method_:Delete
          ~headers:
            (Fetch.HeadersInit.makeWithArray
               [| ("Authorization", "Bearer " ^ token) |])
          ()
      in
      (let* _ = Fetch.fetchWithInit ("https://api.logseq.io/graphs/" ^ uuid) init in
      Js.Promise.resolve true)
      |> Js.Promise.catch (fun e ->
             Platform.console_error ("remote graph delete failed", e);
             Js.Promise.resolve false)

let delete_graph repo ~remote =
  let drop_from_repos () =
    Graphs_meta.drop repo;
    repos := List.filter (fun r -> r <> repo) !repos;
    Runtime.send (Action.Repos_loaded !repos);
    !on_repos_changed ()
  in
  let finish () =
    (* drop the repo from the local list before the worker round-trip:
       the graphs view can re-render the remote row while the unlink is
       in flight, and its click handler decides local-vs-remote from
       `repos`. cljs removes via state/delete-repo! right after the
       delete-graph! invoke resolves; removing on entry keeps the remote
       row non-local for the whole window *)
    drop_from_repos ();
    let* ok =
      (let* _w = Runtime.invoke1 "thread-api/unsafe-unlink-db" (Wire.String repo) in
      Js.Promise.resolve true)
      |> Js.Promise.catch (fun e ->
             Platform.console_error ("unlink-db failed " ^ repo, e);
             repos := repo :: !repos;
             Runtime.send (Action.Repos_loaded !repos);
             !on_repos_changed ();
             Js.Promise.resolve false)
    in
    if not ok then Js.Promise.resolve ()
    else
      match !Runtime.current_repo = Some repo, !repos with
      | true, next :: _ ->
          Toast.success (T.removed_redirecting repo next);
          navigate_journal next
      | true, [] ->
          Toast.success (T.removed repo);
          Runtime.current_repo := None;
          Router.resolve ();
          Js.Promise.resolve ()
      | false, _ ->
          Toast.success (T.removed repo);
          Js.Promise.resolve ()
  in
  if remote then
    match
      List.find_opt
        (fun (n, _, _) -> n = short_name repo)
        !remote_graphs
    with
    | Some (_, uuid, _) ->
        let* remote_ok = delete_remote_http uuid in
        if remote_ok then finish ()
        else (
          Toast.error (I18n.t "graph/delete-remote-server-error");
          Js.Promise.resolve ())
    | None -> finish ()
  else finish ()

let ask_delete ~remote repo =
  Dialogs_state.ask
    ~title:(if remote then T.delete_remote_graph else T.delete_local_graph)
    ~desc:
      ((if remote then T.delete_remote_confirm repo
        else T.delete_local_confirm repo)
      ^ " " ^ T.delete_warning)
    ~on_confirm:(fun () -> ignore (delete_graph repo ~remote))
    ()

(* after a graph opens, fetch + remember its worker uuid; in-graph routes
   carry ?graph-id=<uuid> inside the hash so deep links and reloads can
   resolve back to the repo (cljs handler.graph/remember-current-graph-id-in-tab!) *)
let () =
  Runtime.on_graph_opened := fun repo ->
    ignore
      (let* w = Runtime.invoke1 "thread-api/get-graph-uuid" (Wire.String repo) in
      (* cljs graph_tab/set-tab-graph! — sessionStorage keys so a
                 reload reopens this tab's graph *)
      Platform.session_storage_set "ls-tab-repo" repo;
      (match Wire.as_uuid w with
       | Some uuid ->
           Platform.session_storage_set "ls-tab-graph-id" uuid;
           Runtime.current_graph_uuid := Some uuid;
           Graphs_meta.remember_uuid repo uuid;
           Runtime.sync_hash_graph_id ()
       | None -> ());
      Js.Promise.resolve ())
