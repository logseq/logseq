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

(* DERIVED MIRRORS — worker_events.ml, pages/page.ml and views/* read
   these two refs directly and are owned by other cleanup sessions.
   Update.effects keeps them in sync with model.route_page/model.route.
   No new readers: use Runtime.model instead. *)
let current_page : Model.page option ref = ref None
let current_route : Model.route option ref = ref None

(* set by the router per route — lets outliner_ops refresh views whose
   content isn't covered by route_page (e.g. the journals list).
   Top-level name pinned: pages/page.ml invokes it directly *)
let reload_current_view : (unit -> unit Js.Promise.t) ref =
  ref (fun () -> Js.Promise.resolve ())

(* cycle-breaking callback refs whose names are pinned by
   app/worker_events.ml (a sibling session owns that file — it both
   invokes and registers these). Everything else lives in [hooks]. *)
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

(* "sync-db-changes" subscribers — one ordered list (drained by
   Worker_events.dispatch) instead of each area monkey-patching
   Worker_client.on_message. A failing handler is logged and the rest
   still run. *)
let sync_subs : (unit -> unit) list ref = ref []

let on_sync f = sync_subs := !sync_subs @ [ f ]

let run_sync_subs () =
  List.iter
    (fun f ->
      try f ()
      with e -> Platform.console_error ("sync-db-changes handler failed", e))
    !sync_subs

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

(* generation counter for async page loads — several Page_loaded
   producers (route loads, refresh_page, block zoom) can be in flight at
   once and their fetches can resolve out of order; bump on initiation
   and only commit when the captured generation is still current, so the
   latest-initiated load always wins *)
let load_gen : int ref = ref 0

(* items signals for mounted virtual lists — a spliced block array is
   pushed straight into the list so the page dyn need not remount it *)
let page_items : (string, Model.block array Signal.state) Hashtbl.t =
  Hashtbl.create 8

let items_key ~scope ~puuid =
  scope ^ "|" ^ Option.value puuid ~default:""

let page_items_sig_key scheduler k items =
  match Hashtbl.find_opt page_items k with
  | Some s -> s
  | None ->
      let s = Signal.state scheduler items in
      Hashtbl.replace page_items k s;
      s

let page_items_sig scheduler ~scope ~puuid items =
  page_items_sig_key scheduler (items_key ~scope ~puuid) items

let has_page_items ~scope ~puuid =
  Hashtbl.mem page_items (items_key ~scope ~puuid)

let set_page_items ~scope ~puuid items =
  match Hashtbl.find_opt page_items (items_key ~scope ~puuid) with
  | Some s -> Signal.set s items
  | None -> ()

(* every Page_loaded whose page_blocks came from a splice/delta/optimistic
   reparent — not a fresh fetch — pushes its items first so the mounted
   virtual list repaints even when update.ml skips the remount *)
let push_page_items (page : Model.page) =
  set_page_items ~scope:"main" ~puuid:page.Model.page_uuid
    (Array.of_list page.Model.page_blocks)

let clear_page_items () =
  Hashtbl.iter (fun _ s -> Signal.dispose_signal (Signal.value s)) page_items;
  Hashtbl.reset page_items

(* one-shot (page_uuid, callback) armed before a hash navigation — runs
   when that page's Page_loaded lands; consumed by fire or load failure *)
let after_page_load : (string * (unit -> unit)) option ref = ref None

let on_page_loaded uuid f = after_page_load := Some (uuid, f)

(* root element of the editor's inline popup (date picker / link form),
   mounted under <body> by editor_commands — exposed here so
   Popups_state can hit-test it without an Editor_commands dependency
   (which would cycle through Cmdk_state) *)
let editor_popup_root : Editor_dom.el option ref = ref None

let flush () = !app_flush ()

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
