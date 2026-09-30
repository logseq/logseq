(* Property UI state that lives outside Model: the overlay stack
   (popups/dialogs under .cp__overlays), the registry of mounted
   property areas (for refresh-on-tx), and the show-hidden-properties
   toggle. *)

open Promise_ext
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

(* cljs shui popups dismiss on window mousedown outside their root: a
   click drops every overlay stacked above the innermost overlay that
   contains the click target (all when outside any). *)
let install_outside_close =
  let installed = ref false in
  fun () ->
    if not !installed then (
      installed := true;
      Overlay.on_document_press "mousedown"
        ~els:(fun () -> List.map (fun o -> o.el) !overlays)
        ~on_hit:(function
          | None ->
              List.iter (fun o -> el_remove o.el) !overlays;
              overlays := []
          | Some i ->
              List.iteri (fun n o -> if n < i then el_remove o.el) !overlays;
              overlays := List.filteri (fun n _ -> n >= i) !overlays))

let push_overlay el ~on_escape =
  install_outside_close ();
  (match overlays_root () with
   | Some root -> Editor_dom.el_append_child root el
   | None -> ());
  overlays := { el; on_escape } :: !overlays

let remove_overlay_el el =
  List.iter (fun o -> if o.el == el then el_remove o.el) !overlays;
  overlays := List.filter (fun o -> o.el != el) !overlays

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
       { Model.toast_id = 0
       ; toast_text = msg
       ; toast_kind = "error"
       ; toast_key = None
       });
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

let register_area container refresh =
  areas := { container; refresh } :: !areas

let unregister_area el =
  areas := List.filter (fun a -> a.container != el) !areas

let live_areas () =
  areas := List.filter (fun a -> el_is_connected a.container) !areas;
  !areas

(* one area's worker call failing must not starve the rest *)
let guarded refresh =
  Js.Promise.catch
    (fun e ->
      Platform.console_error ("property area refresh failed", e);
      Js.Promise.resolve ())
    (refresh ())

(* Debounced global refresh: collapses bursts of tx broadcasts into one
   round of get-display-properties calls. *)
let refresh_pending = ref false

let refresh_all () =
  if !refresh_pending then ()
  else (
    refresh_pending := true;
    Editor_dom.set_timeout (fun () ->
        refresh_pending := false;
        List.iter (fun a -> ignore (guarded a.refresh)) (live_areas ()))
      150)

(* immediate rebuild for commit paths (sdk writes) — skips the 150ms
   debounce so callers observe applied property changes *)
let refresh_all_now () =
  let* _ =
    List.map (fun a -> guarded a.refresh) (live_areas ())
    |> Array.of_list
    |> Js.Promise.all
  in
  Js.Promise.resolve ()

(* sdk apply_ops awaits this before resolving — avoids a
   properties->sdk dependency cycle *)
let () = Runtime.refresh_property_areas := refresh_all_now

(* Immediate refresh for flows that must render before the next user
   action (e.g. a pending inline editor must mount before the user can
   click elsewhere — a late mount would open into a moved focus). *)
let refresh_now () =
  List.iter (fun a -> ignore (guarded a.refresh)) (live_areas ())

(* ---------- sync-db-changes hook ---------- *)

(* Property areas hold worker data outside the model, so they refresh on
   every "sync-db-changes" broadcast via the shared subscription list. *)
let chained = ref false

let chain_worker () =
  if not !chained then begin
    chained := true;
    Runtime.on_sync refresh_all
  end


