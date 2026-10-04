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
  | Some s -> Signal.set s (Array.of_list js)
  | None -> ()

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
