(* Runtime services — the mutable side of the app, mirroring cljs
   frontend.state atoms: the worker client and the LUI app handle. *)

let worker : Worker_client.t option ref = ref None
let app_send : (Action.t -> bool) ref = ref (fun _ -> false)
let app_flush : (unit -> unit) ref = ref (fun () -> ())

(* mirrors of model fields for non-view consumers (sdk bridge, events) *)
let current_repo : string option ref = ref None
let current_page : Model.page option ref = ref None
let current_route : Model.route option ref = ref None

let repo () = Option.value !current_repo ~default:""
(* journals view renders several pages at once — editor actions like
   append/find need access to every journal item's blocks *)
let current_journals : Model.page list ref = ref []
(* set by the router per route — lets outliner_ops refresh views whose
   content isn't covered by current_page (e.g. the journals list) *)
let reload_current_view : (unit -> unit Js.Promise.t) ref =
  ref (fun () -> Js.Promise.resolve ())

(* mutation paths outside the editor (sdk bridge) refresh the current
   view through this hook — Outliner_ops sets it to refresh_page (avoids
   an editor->sdk dependency cycle) *)
let refresh_after_ops : (unit -> unit Js.Promise.t) ref =
  ref (fun () -> Js.Promise.resolve ())

(* mounted property areas live outside the model — Properties_state sets
   this so sdk mutations can rebuild them without the 150ms debounce *)
let refresh_property_areas : (unit -> unit Js.Promise.t) ref =
  ref (fun () -> Js.Promise.resolve ())

(* the open graph's worker uuid — carried as ?graph-id=<uuid> inside the
   location hash (e.g. "#/page/u?graph-id=u") like cljs
   current-graph-query-params, so deep links and reloads resolve a repo *)
let current_graph_uuid : string option ref = ref None

(* set by graphs_ops (avoids a boot/graphs_ops module cycle); invoked on
   Boot_graph_ready to fetch and remember the graph's uuid *)
let on_graph_opened : (string -> unit) ref = ref (fun _ -> ())

(* append ?graph-id=<uuid> to an in-app hash route when the uuid is known *)
let nav_hash route =
  match !current_graph_uuid with
  | Some u when u <> "" -> route ^ "?graph-id=" ^ u
  | _ -> route

(* add the missing graph-id to the current hash without firing hashchange *)
let sync_hash_graph_id () =
  match !current_graph_uuid with
  | Some u when u <> "" -> (
      match Platform.location_hash () with
      | "" | "#" | "#/" ->
          Platform.replace_url_fragment ("#/?graph-id=" ^ u)
      | h ->
          if String.index_opt h '?' = None then
            Platform.replace_url_fragment (h ^ "?graph-id=" ^ u))
  | _ -> ()

(* cljs add-page-to-recent! fires only inside redirect-to-page! — i.e.
   explicit in-app page navigations, not boot/hashchange loads. Call
   sites that correspond to redirect-to-page! mark the navigation here;
   the recents hook consumes the mark when the page becomes Ready. *)
let nav_user_initiated : bool ref = ref false

let mark_nav () = nav_user_initiated := true

let take_nav_mark () =
  let v = !nav_user_initiated in
  nav_user_initiated := false;
  v

(* generation counter for async page loads — several Page_loaded
   producers (route loads, refresh_page, block zoom) can be in flight at
   once and their fetches can resolve out of order; bump on initiation
   and only commit when the captured generation is still current, so the
   latest-initiated load always wins *)
let load_gen : int ref = ref 0

let track action =
  match action with
  | Action.Boot_graph_ready repo ->
      current_repo := Some repo;
      current_graph_uuid := None;
      !on_graph_opened repo
  | Action.Page_loaded page ->
      current_page := Some page;
      sync_hash_graph_id ()
  | Action.Journals_loaded js -> current_journals := js
  | Action.Navigate_to r ->
      current_page := None;
      current_journals := [];
      current_route := Some r;
      (* in-graph routes always carry ?graph-id — navigation call sites
         write raw hashes, so re-append it here after the hash settles *)
      (match r with
       | Model.All_graphs | Model.Import | Model.Not_found _ -> ()
       | _ -> sync_hash_graph_id ())
  | _ -> ()

let flush () = !app_flush ()

let send action =
  track action;
  ignore (!app_send action);
  flush ()

(* Convenience for feature modules: update a signal state and flush so the
   DOM re-renders outside the LUI event loop (async callbacks, timers). *)
let signal_set (state : 'a Signal.state) (v : 'a) =
  Signal.set state v;
  flush ()

let worker_or_fail () =
  match !worker with
  | Some w -> w
  | None -> failwith "db-worker not started"

let invoke name args = Worker_client.invoke (worker_or_fail ()) name args
let invoke1 name a = invoke name [ a ]
let invoke2 name a b = invoke name [ a; b ]
let invoke3 name a b c = invoke name [ a; b; c ]
