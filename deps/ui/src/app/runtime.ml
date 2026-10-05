(* Runtime services — the mutable side of the app, mirroring cljs
   frontend.state atoms: the worker client and the LUI app handle. *)

let worker : Worker_client.t option ref = ref None
let app_send : (Action.t -> bool) ref = ref (fun _ -> false)
let app_flush : (unit -> unit) ref = ref (fun () -> ())

(* the live reducer model — wired to Lui_app.model in main.ml; feature
   modules read current model fields through this instead of shadowing
   them in local refs *)
let read_model : (unit -> Model.t) ref = ref (fun () -> Model.initial)

let model () = !read_model ()

let repo () = Option.value (model ()).Model.repo ~default:""

let route () = (model ()).Model.route

(* mirrors of model fields for non-view consumers (sdk bridge, events) *)
let current_repo : string option ref = ref None
(* the subscribed-data stores live in the subs package (logseq_subs) —
   these aliases keep every consumer on the same refs *)
let current_page = Subs_state.current_page
let current_route : Model.route option ref = ref None

(* journals view renders several pages at once — editor actions like
   append/find need access to every journal item's blocks *)
let current_journals = Subs_state.current_journals
(* set by the router per route — lets outliner_ops refresh views whose
   content isn't covered by route_page (e.g. the journals list).
   Top-level name pinned: pages/page.ml invokes it directly *)
let reload_current_view : (unit -> unit Js.Promise.t) ref =
  ref (fun () -> Js.Promise.resolve ())

(* the journals list's scroll-end pagination hook — the router installs
   load_more_journals so page.ml stays below the routing layer *)
let journals_load_more : (unit -> unit Js.Promise.t) ref =
  ref (fun () -> Js.Promise.resolve ())

(* delta splices skip their side-fetches through this — Router
   registers the impl *)
let refresh_page_side : (Model.page -> unit) ref = ref (fun _ -> ())

(* set by rtc_flows (avoids a Worker_events -> Rtc_flows -> Rtc_ops ->
   Worker_events module cycle): the rtc-log broadcast feeds its
   latest-entry projections *)
let rtc_log_handler : (Wire.t -> unit) ref = ref (fun _ -> ())

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

(* the rest of the cycle-breaking callbacks, one documented record —
   each field is registered once by its owning module *)
type hooks =
  { (* graphs_ops — fetch + remember the graph's worker uuid after
       Boot_graph_ready *)
    mutable on_graph_opened : string -> unit
  ; (* rtc_flows — graph-switch sync trigger on Boot_graph_ready *)
    mutable rtc_graph_ready : string -> unit
  ; (* router — clears its loading_route dedupe when a route load
       commits or fails *)
    mutable nav_load_done : unit -> unit
  ; (* router — refetch one journal item's linked refs and republish
       through the keyed collection *)
    mutable refresh_journal_side : Model.page -> unit
  ; (* outliner_ops — refresh the current view after mutations made
       outside the editor (sdk bridge) *)
    mutable refresh_after_ops : unit -> unit Js.Promise.t
  ; (* properties_state — rebuild mounted property areas (they hold
       worker data outside the model) without the 150ms debounce *)
    mutable refresh_property_areas : unit -> unit Js.Promise.t
  }

let hooks =
  { on_graph_opened = (fun _ -> ())
  ; rtc_graph_ready = (fun _ -> ())
  ; nav_load_done = (fun () -> ())
  ; refresh_journal_side = (fun _ -> ())
  ; refresh_after_ops = (fun () -> Js.Promise.resolve ())
  ; refresh_property_areas = (fun () -> Js.Promise.resolve ())
  }

let on_sync = Subs_state.on_sync
let run_sync_subs = Subs_state.run_sync_subs

(* the open graph's worker uuid — carried as ?graph-id=<uuid> inside the
   location hash (e.g. "#/page/u?graph-id=u") like cljs
   current-graph-query-params, so deep links and reloads resolve a repo *)
let current_graph_uuid : string option ref = ref None

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

(* items signals live in the subs package — same store for both
   platforms (the native twin mounts the same mounted-list protocol) *)
let journal_item_key = Subs_state.journal_item_key
let journals_sig = Subs_state.journals_sig
let push_journals_items = Subs_state.push_journals_items
let page_items_sig = Subs_state.page_items_sig
let has_page_items = Subs_state.has_page_items
let set_page_items = Subs_state.set_page_items
let push_page_items = Subs_state.push_page_items
let clear_page_items = Subs_state.clear_page_items
let journal_page_sig = Subs_state.journal_page_sig
let push_journal_page = Subs_state.push_journal_page
let clear_journal_items = Subs_state.clear_journal_items

let after_page_load = Subs_state.after_page_load
let on_page_loaded = Subs_state.on_page_loaded


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

(* all actions reach the reducer through !app_send (wired to Lui_app.send
   in main.ml); Update.apply runs the per-action effect pass inside the
   dispatch so there is a single dispatch path *)
let send action =
  (match action with
   | Action.Navigate_to _ -> Platform.perf_mark "action:navigate"
   | Action.Page_loaded _ -> Platform.perf_mark "action:page-loaded"
   | Action.Boot_graph_ready _ -> Platform.perf_mark "action:boot-ready"
   | _ -> ());
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
