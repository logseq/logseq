(* Graph operations: list/refresh, create (local + remote-sync), open/switch,
   delete, and ls-graphs-metadata bookkeeping. Mirrors
   components/repo.cljs repos-cp + repo/remove-repo!. *)

module T = Graphs_text

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

(* remote graphs known to the sync server: (name-without-prefix, uuid) *)
let remote_graphs : (string * string) list ref = ref []

let list_remote_graphs () =
  Runtime.invoke "thread-api/db-sync-list-remote-graphs" []
  |> Js.Promise.then_ (fun w ->
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
               | Some name, Some id -> Some (name, id)
               | _ -> None)
             entries;
         Js.Promise.resolve !remote_graphs)

(* removable? = not (demo && it's the only graph) *)
let removable repo =
  not (is_demo repo && List.length !repos = 1)

(* -- ls-graphs-metadata (localStorage EDN map, see Graphs_meta) -- *)

let meta_last_seen = Graphs_meta.last_seen

(* -- list + refresh -- *)

(* graphs_view registers a rerender callback here (avoids a module cycle) *)
let on_repos_changed : (unit -> unit) ref = ref (fun () -> ())

let refresh () =
  Graph.list_graphs ()
  |> Js.Promise.then_ (fun rs ->
         repos := rs;
         Runtime.send (Action.Repos_loaded rs);
         Runtime.flush ();
         !on_repos_changed ();
         Js.Promise.resolve rs)

(* -- switch / navigate -- *)

let navigate_journal repo =
  Graphs_meta.touch repo;
  Graph.open_graph repo
  |> Js.Promise.then_ (fun _ -> Boot.ensure_today_journal repo)
  |> Js.Promise.then_ (fun () ->
         Runtime.send (Action.Boot_graph_ready repo);
         Runtime.current_repo := Some repo;
         Platform.set_location_hash (Runtime.nav_hash "#/");
         Router.resolve ();
         Js.Promise.resolve ())

(* -- create -- *)

let create_remote name e2ee =
  Graph.create_graph name
  |> Js.Promise.then_ (fun r ->
         Runtime.invoke3 "thread-api/db-sync-create-remote-graph"
           (Wire.String r) (Wire.Bool e2ee) (Wire.Bool true)
         |> Js.Promise.then_ (fun _ ->
                Runtime.invoke1 "thread-api/db-sync-start" (Wire.String r)
                |> Js.Promise.then_ (fun _ -> Js.Promise.resolve r)))

let remember_open repo =
  Graphs_meta.touch repo;
  refresh () |> ignore

(* -- delete (remove-repo!) -- *)

(* cljs frontend.handler.db-based.sync <rtc-delete-graph!: HTTP DELETE
   {http-base}/graphs/{graph-uuid} with the Cognito id-token — the worker
   has no thread-api delete endpoint. *)
let delete_remote_http uuid =
  match Platform.local_storage_get "id-token" with
  | None -> Js.Promise.resolve ()
  | Some token ->
      let init =
        Fetch.RequestInit.make ~method_:Delete
          ~headers:
            (Fetch.HeadersInit.makeWithArray
               [| ("Authorization", "Bearer " ^ token) |])
          ()
      in
      Fetch.fetchWithInit ("https://api.logseq.io/graphs/" ^ uuid) init
      |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ())
      |> Js.Promise.catch (fun _ -> Js.Promise.resolve ())

let delete_graph repo ~remote =
  let finish () =
    Runtime.invoke1 "thread-api/unsafe-unlink-db" (Wire.String repo)
    |> Js.Promise.then_ (fun _ ->
           Graphs_meta.drop repo;
           refresh ())
    |> Js.Promise.then_ (fun remaining ->
           match !Runtime.current_repo = Some repo, remaining with
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
               Js.Promise.resolve ())
  in
  if remote then
    match
      List.find_opt
        (fun (n, _) -> n = short_name repo)
        !remote_graphs
    with
    | Some (_, uuid) ->
        delete_remote_http uuid
        |> Js.Promise.then_ (fun () -> finish ())
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
      (Runtime.invoke1 "thread-api/get-graph-uuid" (Wire.String repo)
       |> Js.Promise.then_ (fun w ->
              (match Wire.as_uuid w with
               | Some uuid ->
                   Runtime.current_graph_uuid := Some uuid;
                   Graphs_meta.remember_uuid repo uuid;
                   Runtime.sync_hash_graph_id ()
               | None -> ());
              Js.Promise.resolve ()))
