(* Runtime services — the mutable side of the app, mirroring cljs
   frontend.state atoms: the worker client and the LUI app handle. *)

let worker : Worker_client.t option ref = ref None
let app_send : (Action.t -> bool) ref = ref (fun _ -> false)
let app_flush : (unit -> unit) ref = ref (fun () -> ())

(* mirrors of model fields for non-view consumers (sdk bridge, events) *)
let current_repo : string option ref = ref None
(* the subscribed-data stores live in the subs package (logseq_subs) —
   these aliases keep every consumer on the same refs *)
let current_page = Subs_state.current_page
let current_route : Model.route option ref = ref None

let repo () = Option.value !current_repo ~default:""
let current_journals = Subs_state.current_journals
(* set by the router per route — lets outliner_ops refresh views whose
   content isn't covered by current_page (e.g. the journals list) *)
let reload_current_view : (unit -> unit Js.Promise.t) ref =
  ref (fun () -> Js.Promise.resolve ())

(* the journals list's scroll-end pagination hook — the router installs
   load_more_journals so page.ml stays below the routing layer *)
let journals_load_more : (unit -> unit Js.Promise.t) ref =
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

let on_sync = Subs_state.on_sync
let run_sync_subs = Subs_state.run_sync_subs

(* the open graph's worker uuid — carried as ?graph-id=<uuid> inside the
   location hash (e.g. "#/page/u?graph-id=u") like cljs
   current-graph-query-params, so deep links and reloads resolve a repo *)
let current_graph_uuid : string option ref = ref None

(* set by graphs_ops (avoids a boot/graphs_ops module cycle); invoked on
   Boot_graph_ready to fetch and remember the graph's uuid *)
let on_graph_opened : (string -> unit) ref = ref (fun _ -> ())

(* set by rtc_flows (avoids a Worker_events -> Rtc_flows -> Rtc_ops ->
   Worker_events module cycle): the rtc-log broadcast feeds its
   latest-entry projections *)
let rtc_log_handler : (Wire.t -> unit) ref = ref (fun _ -> ())

(* a second Boot_graph_ready subscriber for rtc_flows' graph-switch
   sync trigger (on_graph_opened is already owned by graphs_ops) *)
let rtc_graph_ready : (string -> unit) ref = ref (fun _ -> ())

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

let load_gen = Subs_state.load_gen

(* set by graphs_ops (avoids a Worker_events -> Graphs_ops -> Boot
   module cycle): remote-graph-gone broadcast refreshes the remote
   list and the all-graphs view *)
let remote_graph_gone : (unit -> unit) ref = ref (fun () -> ())

(* set by graphs_ops (same cycle-avoidance): worker add-repo broadcast
   appends a downloaded graph to the local list *)
let add_repo : (string -> unit) ref = ref (fun _ -> ())

(* Worker_events clears its stashed broadcast deltas on every route
   change (avoids a Runtime -> Worker_events cycle) *)
let on_navigate : (unit -> unit) ref = ref (fun () -> ())

(* the cheap side-fetches a page load also runs (linked refs, unlinked
   refs/exists) — Router registers it so the delta-splice path can
   refresh them without a routing -> outliner_ops cycle *)
let refresh_page_side : (Model.page -> unit) ref = ref (fun _ -> ())

let journal_item_key = Subs_state.journal_item_key
let journals_sig = Subs_state.journals_sig
let push_journals_items = Subs_state.push_journals_items

(* Router clears its loading_route dedupe when a route load commits or
   fails (avoids a Runtime -> Router cycle) *)
let nav_load_done : (unit -> unit) ref = ref (fun () -> ())

let after_page_load = Subs_state.after_page_load
let on_page_loaded = Subs_state.on_page_loaded

(* mirrors Model.unlinked_open so fetch paths outside the model (router,
   outliner refresh) can gate the full-title unlinked scan on the
   section being open *)
let unlinked_open = ref true

let track action =
  match action with
  | Action.Boot_graph_ready repo ->
      current_repo := Some repo;
      current_graph_uuid := None;
      !on_graph_opened repo;
      !rtc_graph_ready repo
  | Action.Page_loaded page ->
      !nav_load_done ();
      (* a fresh full-fetch replaces the tree at an unknown rev — the
         delta basis only survives splices applied through Page_delta *)
      if not (Page_delta.is_own_commit page) then Page_delta.reset ();
      current_page := Some page;
      (* cljs route.cljs update-page-title!: document.title follows the
         loaded page's title *)
      Browser_ui.set_document_title page.Model.page_title;
      sync_hash_graph_id ();
      (match !after_page_load, page.Model.page_uuid with
       | Some (want, f), Some u when u = want ->
           after_page_load := None;
           f ()
       | _ -> ())
  | Action.Page_load_failed ->
      !nav_load_done ();
      after_page_load := None
  | Action.Journals_loaded js ->
      !nav_load_done ();
      current_journals := js;
      push_journals_items js
  | Action.Navigate_to r ->
      Page_delta.reset ();
      push_journals_items [];
      !on_navigate ();
      current_page := None;
      current_journals := [];
      current_route := Some r;
      unlinked_open := false;
      (* in-graph routes always carry ?graph-id — navigation call sites
         write raw hashes, so re-append it here after the hash settles *)
      (match r with
       | Model.All_graphs | Model.Import | Model.Not_found _ -> ()
       | _ -> sync_hash_graph_id ());
      (* cljs route.cljs static-title for non-page routes (page routes
         get their title when Page_loaded lands) *)
      (match r with
       | Model.Home -> Browser_ui.set_document_title "Logseq"
       | Model.Journals ->
           Browser_ui.set_document_title (I18n.t "nav/all-journals")
       | Model.All_pages ->
           Browser_ui.set_document_title (I18n.t "nav.all-pages/title")
       | Model.All_graphs ->
           Browser_ui.set_document_title (I18n.t "mobile.tab/graphs")
       | Model.Graph_view ->
           Browser_ui.set_document_title (I18n.t "nav/graph-view")
       | Model.Settings ->
           Browser_ui.set_document_title (I18n.t "nav/settings")
       | Model.Import ->
           Browser_ui.set_document_title (I18n.t "import/title")
       | Model.Library | Model.Not_found _ ->
           Browser_ui.set_document_title "Logseq"
       | Model.Page _ | Model.Block_zoom _ -> ())
  | Action.Unlinked_toggle_open -> unlinked_open := not !unlinked_open
  | _ -> ()

let flush () = !app_flush ()

(* doc-scan scheduling — the native host re-runs registered doc scans
   after a flush only when the tree changed structurally or enough time
   passed since the last scan; prop-only generations coalesce to at most
   one scan per [scan_gate_interval] seconds (MutationObserver batches
   the same way). Every scan walks the whole tree, so running per
   keystroke is what made input lag — this policy is regression-tested
   in test_main. *)
type scan_gate =
  { mutable sg_last_gen : int
  ; mutable sg_structural : bool
  ; mutable sg_last_time : float
  }

let scan_gate_interval = 0.1

let scan_gate () = { sg_last_gen = -1; sg_structural = false; sg_last_time = 0. }

let scan_gate_note_structural g = g.sg_structural <- true

let scan_gate_should g ~gen ~now =
  g.sg_structural
  || (gen <> g.sg_last_gen && now -. g.sg_last_time >= scan_gate_interval)

let scan_gate_mark g ~gen ~now =
  g.sg_structural <- false;
  g.sg_last_gen <- gen;
  g.sg_last_time <- now

let send action =
  (match action with
   | Action.Navigate_to _ -> Platform.perf_mark "action:navigate"
   | Action.Page_loaded _ -> Platform.perf_mark "action:page-loaded"
   | Action.Boot_graph_ready _ -> Platform.perf_mark "action:boot-ready"
   | _ -> ());
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

let invoke name args =
  Platform.perf_mark ("invoke:" ^ name);
  let p = Worker_client.invoke (worker_or_fail ()) name args in
  ignore
    (Js.Promise.then_
       (fun r ->
         Platform.perf_mark ("done:" ^ name);
         Js.Promise.resolve r)
       p);
  p
let invoke1 name a = invoke name [ a ]
let invoke2 name a b = invoke name [ a; b ]
let invoke3 name a b c = invoke name [ a; b; c ]
