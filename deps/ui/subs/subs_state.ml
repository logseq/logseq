(* Subscribed data stores — the payload holders the worker feed
   publishes into (route page, journals list) plus the ordering and
   callback machinery the subscription pipeline needs. Views read them
   through the Runtime aliases; nothing in this package reaches back
   into the view/editor layers. *)

let current_page : Model.page option ref = ref None
(* journals view renders several pages at once — editor actions like
   append/find need access to every journal item's blocks *)
let current_journals : Model.page list ref = ref []

let journal_item_key (p : Model.page) =
  Option.value p.Model.page_uuid ~default:p.Model.page_title

(* the mounted journals stream's data signal — appended paginated days
   and delta-spliced days swap in through this array so the stream
   (and the scroll offset) survives; page.ml creates it lazily on
   mount *)
let journals_items : Model.page array Signal.state option ref =
  ref None

let journals_sig scheduler : Model.page array Signal.state =
  match !journals_items with
  | Some s -> s
  | None ->
      (* Journals_loaded can land before the list mounts — a
         push_journals_items before then is a no-op, so seed the
         signal from the authoritative list, not an empty array *)
      let s =
        Signal.state scheduler (Array.of_list !current_journals)
      in
      journals_items := Some s;
      s

(* repo the boot sequence opened — update.ml sets it so route loads and
   commands know which repo to hit (runtime.ml aliases it for src) *)
let current_repo : string option ref = ref None

let push_journals_items (js : Model.page list) =
  (* every Journals_loaded/Journals_spliced publish flows through here —
     keep the authoritative list in sync: delta splices and optimistic
     edits read current_journals to find the day page they touch *)
  current_journals := js;
  match !journals_items with
  | Some s ->
      let arr = Array.of_list js in
      (* a delta splice republishes the whole journals list on every op,
         but the stream only needs a top-level set when the day sequence
         itself changes (pagination append, removal); a spliced day's
         blocks reach the mounted item through journal_page_sig. A full
         republish forces the dyn over the array to rebuild every item
         descriptor, ~20-35ms per outliner op. *)
      let old = Signal.get_state s in
      let same_seq =
        Array.length old = Array.length arr
        && List.for_all2
             (fun (a : Model.page) (b : Model.page) ->
               journal_item_key a = journal_item_key b)
             (Array.to_list old) (Array.to_list arr)
      in
      if not same_seq then Signal.set s arr
  | None -> ()

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
  Hashtbl.iter
    (fun _ s -> Signal.dispose_signal (Signal.value s))
    page_items;
  Hashtbl.reset page_items

(* per-journal-day signals for mounted journal items — a delta-spliced
   journal page pushes straight into the item's dyn so the journals
   view need not remount (inner block lists are eager — the item dyn
   is the repaint channel) *)
let journal_items : (string, Model.page Signal.state) Hashtbl.t =
  Hashtbl.create 8

let journal_page_sig scheduler (p : Model.page) : Model.page Signal.state =
  let k = journal_item_key p in
  match Hashtbl.find_opt journal_items k with
  | Some s -> s
  | None ->
      let s = Signal.state scheduler p in
      Hashtbl.replace journal_items k s;
      s

let push_journal_page (p : Model.page) =
  match Hashtbl.find_opt journal_items (journal_item_key p) with
  | Some s -> Signal.set s p
  | None -> ()

let clear_journal_items () =
  current_journals := [];
  Hashtbl.iter
    (fun _ s -> Signal.dispose_signal (Signal.value s))
    journal_items;
  Hashtbl.reset journal_items

(* generation counter for async page loads — several Page_loaded
   producers (route loads, refresh_page, block zoom) can be in flight
   at once and their fetches can resolve out of order; bump on
   initiation and only commit when the captured generation is still
   current, so the latest-initiated load always wins *)
let load_gen : int ref = ref 0

(* one-shot (page_uuid, callback) armed before a hash navigation — runs
   when that page's Page_loaded lands; consumed by fire or load
   failure *)
let after_page_load : (string * (unit -> unit)) option ref = ref None

let on_page_loaded uuid f = after_page_load := Some (uuid, f)

(* "sync-db-changes" subscribers — one ordered list (drained by
   Subs.apply_pending) instead of each area monkey-patching
   Worker_client.on_message. A failing handler is logged and the rest
   still run.

   Each sub declares a [watch] over the delta's affected-keys so an
   unrelated tx doesn't refetch it: [w_tags] matches a key vector's
   leading tag ([tag] or [tag value] — e.g. "page-membership"),
   [w_keys] matches whole vectors (e.g. [:entity uuid]), [w_all]
   refreshes on every batch. [affected = []] means the broadcast
   carried no key info — run everything (conservative fallback). *)
type watch =
  { w_all : bool
  ; w_tags : string list
  ; w_keys : Wire.t list
  }

let watch_all = { w_all = true; w_tags = []; w_keys = [] }
let watch_tags tags = { w_all = false; w_tags = tags; w_keys = [] }

type sync_sub =
  { mutable watch : watch
  ; run : Wire.t list -> unit
  }

let sync_subs : sync_sub list ref = ref []

let on_sync ?(watch = watch_all) run : sync_sub =
  let s = { watch; run } in
  sync_subs := !sync_subs @ [ s ];
  s

(* watches that follow live data (e.g. sidebar items) re-declare after
   each refresh *)
let set_watch s w = s.watch <- w

let watch_key tag v = Wire.Array [ Wire.Keyword tag; v ]
let watch_key_uuid tag u = watch_key tag (Wire.Uuid u)

let key_tag (k : Wire.t) =
  match Wire.elems k with
  | Wire.Keyword t :: _ | Wire.String t :: _ -> Some t
  | _ -> None

let run_sync_subs (affected : Wire.t list) =
  let tags = List.filter_map key_tag affected in
  let hits w =
    w.w_all
    || List.exists (fun t -> List.mem t w.w_tags) tags
    || List.exists (fun k -> List.mem k affected) w.w_keys
  in
  List.iter
    (fun s ->
      if affected = [] || hits s.watch then
        try s.run affected
        with e ->
          Ui_services.log_error ("sync-db-changes handler failed", e))
    !sync_subs

(* ---- app-level runtime state + cycle-breaking hooks ----
   update.ml (same library) writes these; runtime.ml aliases them so src
   code keeps its Runtime.* surface *)

let current_route : Model.route option ref = ref None

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
      match Ui_services.nav_hash () with
      | "" | "#" | "#/" ->
          Ui_services.nav_replace_hash ("#/?graph-id=" ^ u)
      | h ->
          if String.index_opt h '?' = None then
            Ui_services.nav_replace_hash (h ^ "?graph-id=" ^ u))
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

(* Worker_events clears its stashed broadcast deltas on every route
   change (avoids a Runtime -> Worker_events cycle) *)
let on_navigate : (unit -> unit) ref = ref (fun () -> ())

(* the rest of the cycle-breaking callbacks, one documented record —
   each field is registered once by its owning module *)
type app_hooks =
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
    mutable refresh_after_ops : unit -> unit Ui_task.t
  ; (* properties_state — rebuild mounted property areas (they hold
       worker data outside the model) without the 150ms debounce *)
    mutable refresh_property_areas : unit -> unit Ui_task.t
  ; (* plugin_host — broadcast app hook firings to LSPluginCore
       (sidebar-visible-changed, current-graph-changed, ...) *)
    mutable plugin_event : string -> Json.t -> unit
  }

(* i18n lookup for document titles — installed by src at init (I18n
   lives outside this library) *)
let i18n : (string -> string) ref = ref (fun k -> k)

let app_hooks =
  { on_graph_opened = (fun _ -> ())
  ; rtc_graph_ready = (fun _ -> ())
  ; nav_load_done = (fun () -> ())
  ; refresh_journal_side = (fun _ -> ())
  ; refresh_after_ops = (fun () -> Ui_task.resolve ())
  ; refresh_property_areas = (fun () -> Ui_task.resolve ())
  ; plugin_event = (fun _ _ -> ())
  }

(* promise/task adapters at the transport boundary: shared flows run
   on Ui_task while worker/sdk call sites still produce Js.Promise.
   A Js promise rejection carries an opaque error on both runtimes, so
   it crosses as a labeled failure rather than a fabricated exn *)
let task_of_promise (p : 'a Js.Promise.t) : 'a Ui_task.t =
  Ui_task.create (fun ~resolve ~reject ->
      (* one then/catch chain — a rejection propagates through `then`
         into `catch`, which resolves the chain so nothing escapes as an
         unhandled rejection *)
      ignore
        (Js.Promise.catch
           (fun _ ->
             let e = Failure "promise rejected" in
             reject e;
             Js.Promise.resolve ())
           (Js.Promise.then_
              (fun v ->
                resolve v;
                Js.Promise.resolve ())
              p)))

let promise_of_task (t : 'a Ui_task.t) : 'a Js.Promise.t =
  Js.Promise.make (fun ~resolve ~reject ->
      ignore
        (Ui_task.bind t (fun v ->
             resolve v [@u];
             Ui_task.resolve ()));
      ignore
        (Ui_task.catch t (fun e -> reject e [@u]; Ui_task.reject e)))
