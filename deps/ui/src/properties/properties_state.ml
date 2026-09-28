(* Property UI state that lives outside Model: the overlay stack
   (popups/dialogs under .cp__overlays), the registry of mounted
   property areas (for refresh-on-tx), and the show-hidden-properties
   toggle. *)

open Properties_dom

(* ---------- overlay stack ---------- *)

type overlay =
  { el : Editor_dom.el
  ; on_escape : unit -> unit
  }

let overlays : overlay list ref = ref []

(* NOTE: overlays must NOT mount inside .cp__overlays — that container is
   LUI-managed, so any model flush reconciles its children and wipes
   foreign nodes (dialogs vanished mid-interaction). Body-level mount is
   safe; e2e locators are class-scoped. *)
let overlays_root () = doc_query "body"

let push_overlay el ~on_escape =
  (match overlays_root () with
   | Some root -> Editor_dom.el_append_child root el
   | None -> ());
  overlays := { el; on_escape } :: !overlays

let remove_overlay o =
  el_remove o.el;
  overlays := List.filter (fun x -> x != o) !overlays

let pop_overlay () =
  match !overlays with
  | top :: rest ->
      overlays := rest;
      el_remove top.el;
      top.on_escape ()
  | [] -> ()

let close_overlays () =
  List.iter (fun o -> el_remove o.el) !overlays;
  overlays := []

let overlay_open () = !overlays <> []

(* Escape pops the top overlay; the global keydown handler installs this. *)
let handle_escape () =
  if overlay_open () then (pop_overlay (); true) else false

(* ---------- toasts (through the existing toasts view) ---------- *)

let toast_error msg =
  Runtime.send
    (Action.Toast_push
       { Model.toast_id = 0; toast_text = msg; toast_kind = "error" });
  Runtime.flush ()

(* ---------- show hidden properties toggle (`p a`) ---------- *)

let show_hidden = ref false
let toggle_hidden () = show_hidden := not !show_hidden

(* ---------- mounted area registry ---------- *)

(* Each mounted area registers (container element, refresh closure).
   refresh() re-invokes get-display-properties and re-renders inside the
   container; dead entries are pruned by isConnected. *)
type area =
  { container : Editor_dom.el
  ; refresh : unit -> unit Js.Promise.t
  }

let areas : area list ref = ref []
let refresh_lock = ref false

let register_area container refresh =
  areas := { container; refresh } :: !areas

let unregister_area el =
  areas := List.filter (fun a -> a.container != el) !areas

let live_areas () =
  areas := List.filter (fun a -> el_is_connected a.container) !areas;
  !areas

(* Debounced global refresh: collapses bursts of tx broadcasts into one
   round of get-display-properties calls. *)
let refresh_pending = ref false

let refresh_all () =
  if !refresh_pending then ()
  else (
    refresh_pending := true;
    Editor_dom.set_timeout (fun () ->
        refresh_pending := false;
        if !refresh_lock then ()
        else List.iter (fun a -> ignore (a.refresh ())) (live_areas ()))
      150)

(* immediate rebuild for commit paths (sdk writes) — skips the 150ms
   debounce so callers observe applied property changes *)
let refresh_all_now () =
  List.map (fun a -> a.refresh ()) (live_areas ())
  |> Array.of_list
  |> Js.Promise.all
  |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ())

(* sdk apply_ops awaits this before resolving — avoids a
   properties->sdk dependency cycle *)
let () = Runtime.refresh_property_areas := refresh_all_now

(* Immediate refresh for flows that must render before the next user
   action (e.g. a pending inline editor must mount before the user can
   click elsewhere — a late mount would open into a moved focus). *)
let refresh_now () =
  if not !refresh_lock then
    List.iter (fun a -> ignore (a.refresh ())) (live_areas ())

(* ---------- sync-db-changes hook ---------- *)

(* boot.ml assigns worker.on_message = Worker_events.dispatch (which
   already triggers Router.reload for model-backed content). Property
   areas hold worker data outside the model, so we chain a listener
   AFTER the worker exists: keep the original handler, then refresh
   areas on every "sync-db-changes" broadcast. *)
let chained = ref false

let chain_worker () =
  match !chained, !Runtime.worker with
  | true, _ | _, None -> ()
  | false, Some w ->
      chained := true;
      let prev = w.Worker_client.on_message in
      w.Worker_client.on_message <-
        (fun kind payload ->
          (try prev kind payload with _ -> ());
          if kind = "sync-db-changes" then refresh_all ())

(* ---------- pending-async guards ---------- *)

(* In-flight flag per async action so double-clicks don't double-write. *)
let busy = ref false

let with_busy f =
  if !busy then ()
  else (
    busy := true;
    f ();
    Editor_dom.set_timeout (fun () -> busy := false) 300)
