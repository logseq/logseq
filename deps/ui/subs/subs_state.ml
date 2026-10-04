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

let push_journals_items (js : Model.page list) =
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
   still run. *)
let sync_subs : (unit -> unit) list ref = ref []

let on_sync f = sync_subs := !sync_subs @ [ f ]

let run_sync_subs () =
  List.iter
    (fun f ->
      try f ()
      with e ->
        Platform.console_error ("sync-db-changes handler failed", e))
    !sync_subs
