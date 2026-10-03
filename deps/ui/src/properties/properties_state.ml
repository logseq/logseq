(* Property UI state that lives outside Model: the overlay stack
   (popups/dialogs under .cp__overlays), the registry of mounted
   property areas (for refresh-on-tx), and the show-hidden-properties
   toggle. *)

open Promise_ext
open Properties_dom
module D = Properties_data
module W = Wire

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

(* ---------- declarative overlay views ---------- *)

(* Overlays rendered inside .cp__overlays as retained LUI nodes (the
   property dialog, alert dialogs). Each entry mounts a [Lui_elements.t]
   so every platform presents it natively; the imperative el stack above
   still serves popup surfaces that anchor to real elements. *)
type view_overlay =
  { vo_key : string
  ; vo_view : Lui_elements.t
  ; vo_on_escape : unit -> unit
  }

(* signal state is created lazily with the mounting context's scheduler —
   the same entries are shared across page/sidebar areas in one app *)
let view_overlays_state : view_overlay list Signal.state option ref =
  ref None

let view_overlays_state_of (context : Lui_ui.ui_context) =
  match !view_overlays_state with
  | Some s -> s
  | None ->
      let s = Signal.state context.Lui_ui.ui_scheduler [] in
      view_overlays_state := Some s;
      s

let view_overlays (context : Lui_ui.ui_context) =
  Signal.value (view_overlays_state_of context)

let push_view_overlay context ~key ~view ~on_escape =
  let s = view_overlays_state_of context in
  let cur = Signal.get_state s in
  let cur = List.filter (fun o -> o.vo_key <> key) cur in
  Signal.set s (cur @ [ { vo_key = key; vo_view = view; vo_on_escape = on_escape } ])

let pop_view_overlay context =
  let s = view_overlays_state_of context in
  match List.rev (Signal.get_state s) with
  | top :: rest ->
      Signal.set s (List.rev rest);
      top.vo_on_escape ()
  | [] -> ()

let close_view_overlays context =
  let s = view_overlays_state_of context in
  Signal.set s []

(* context-free variant for openers that run before/without a mount
   (the property dialog clears all view overlays on open) *)
let close_all_view_overlays () =
  match !view_overlays_state with
  | Some s -> Runtime.signal_set s []
  | None -> ()

let view_overlay_open () =
  match !view_overlays_state with
  | Some s -> Signal.get_state s <> []
  | None -> false

(* Escape pops the top view overlay — context-free for the document
   keydown handler *)
let handle_view_escape () =
  match !view_overlays_state with
  | Some s -> (
      match List.rev (Signal.get_state s) with
      | top :: rest ->
          Runtime.signal_set s (List.rev rest);
          top.vo_on_escape ();
          true
      | [] -> false)
  | None -> false

(* ---------- show hidden properties toggle (`p a`) ---------- *)

let show_hidden = ref false
let show_hidden_state : bool Signal.state option ref = ref None

let show_hidden_signal (context : Lui_ui.ui_context) =
  match !show_hidden_state with
  | Some s -> Signal.value s
  | None ->
      let s = Signal.state context.Lui_ui.ui_scheduler !show_hidden in
      show_hidden_state := Some s;
      Signal.value s

let toggle_hidden () =
  show_hidden := not !show_hidden;
  (match !show_hidden_state with
   | Some s -> Signal.set s !show_hidden
   | None -> ())

(* ---------- mounted area registry (declarative) ---------- *)

(* Decoded row set for one mounted property surface. left/below are the
   positioned rows (block-left chips, block-below pills); rows/hidden
   the panel rows; class_rows a tag page's class schema; bidi the
   bidirectional groups {title, entities}. *)
type area_data =
  { left : W.t list
  ; below : W.t list
  ; rows : W.t list
  ; hidden : W.t list
  ; class_rows : W.t list
  ; bidi : W.t list
  }

let empty_area_data =
  { left = []; below = []; rows = []; hidden = []; class_rows = []
  ; bidi = [] }

(* one entry per surface key ("block:<uuid>", "page:<uuid>",
   "sb:<uuid>"): the data signal every mounted subtree reads, the
   fetch that repopulates it, and the runtime nodes anchoring
   liveness (pruned when every anchor leaves the tree) *)
type area =
  { a_app : Lui_runtime.application
  ; mutable a_nodes : int list
  ; a_state : area_data Signal.state
  ; a_fetch : unit -> unit Js.Promise.t
  }

let areas : (string, area) Hashtbl.t = Hashtbl.create 16

let node_live app node =
  Hashtbl.mem app.Lui_runtime.mounted_nodes node
  || Hashtbl.mem app.Lui_runtime.runtime_parents node
  || Hashtbl.mem app.Lui_runtime.runtime_extension_nodes node

(* one area's worker call failing must not starve the rest *)
let guarded (refresh : unit -> unit Js.Promise.t) =
  Js.Promise.catch
    (fun e ->
      Platform.console_error ("property area refresh failed", e);
      Js.Promise.resolve ())
    (refresh ())

(* shared per-key data state — created with the mounting context's
   scheduler on first use; the fetch fires once and every refresh()
   republishes into the same signal *)
let area_state (context : Lui_ui.ui_context) ~key
    ~(fetch : (area_data -> unit) -> unit Js.Promise.t) :
    area_data Signal.state =
  match Hashtbl.find_opt areas key with
  | Some a -> a.a_state
  | None ->
      let st =
        Signal.state context.Lui_ui.ui_scheduler empty_area_data
      in
      let a =
        { a_app = context.Lui_ui.ui_application
        ; a_nodes = []
        ; a_state = st
        ; a_fetch =
            (fun () -> fetch (fun d -> Runtime.signal_set st d))
        }
      in
      Hashtbl.replace areas key a;
      ignore (a.a_fetch ());
      st

(* called by views with the runtime node their t mounted *)
let note_area_node ~key node =
  match Hashtbl.find_opt areas key with
  | Some a -> a.a_nodes <- node :: a.a_nodes
  | None -> ()

let refresh_key key =
  match Hashtbl.find_opt areas key with
  | Some a -> ignore (guarded a.a_fetch)
  | None -> ()

let live_areas () =
  let dead =
    Hashtbl.fold
      (fun k a acc ->
        a.a_nodes <- List.filter (node_live a.a_app) a.a_nodes;
        if a.a_nodes = [] then k :: acc else acc)
      areas []
  in
  List.iter (Hashtbl.remove areas) dead;
  Hashtbl.fold (fun _ a acc -> a :: acc) areas []

(* drop one titled row out of an area's data — reordered/opaque wire is
   untouched; the rows lists are the decoded ones *)
let drop_title_of (d : area_data) title =
  let drop rs =
    List.filter (fun r -> D.row_title r <> title) rs
  in
  { d with left = drop d.left; below = drop d.below; rows = drop d.rows
         ; hidden = drop d.hidden; class_rows = drop d.class_rows }

(* optimistic row removal for sdk callers asserting right after a
   remove-block-property op resolves — matching areas drop the titled
   row immediately; the debounced refresh re-renders the same state *)
let drop_row ~owner_uuid ~title =
  let suffix = ":" ^ owner_uuid in
  Hashtbl.iter
    (fun key a ->
      if
        String.length key >= String.length suffix
        && String.sub key (String.length key - String.length suffix)
             (String.length suffix)
           = suffix
      then
        Runtime.signal_set a.a_state
          (drop_title_of (Signal.get_state a.a_state) title))
    areas

(* Debounced global refresh: collapses bursts of tx broadcasts into one
   round of get-display-properties calls. *)
let refresh_pending = ref false

let refresh_all () =
  if !refresh_pending then ()
  else (
    refresh_pending := true;
    Editor_dom.set_timeout (fun () ->
        refresh_pending := false;
        List.iter (fun a -> ignore (guarded a.a_fetch)) (live_areas ()))
      150)

(* immediate rebuild for commit paths (sdk writes) — skips the 150ms
   debounce so callers observe applied property changes *)
let refresh_all_now () =
  let* _ =
    List.map (fun a -> guarded a.a_fetch) (live_areas ())
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
  List.iter (fun a -> ignore (guarded a.a_fetch)) (live_areas ())

(* ---------- sync-db-changes hook ---------- *)

(* Property areas hold worker data outside the model, so they refresh on
   every "sync-db-changes" broadcast via the shared subscription list. *)
let chained = ref false

let chain_worker () =
  if not !chained then begin
    chained := true;
    Runtime.on_sync refresh_all
  end


