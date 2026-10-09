(* Property UI state that lives outside Model: the overlay stack
   (popups/dialogs under .cp__overlays), the registry of mounted
   property areas (for refresh-on-tx), and the show-hidden-properties
   toggle. *)

open Promise_ext
module D = Properties_data
module W = Wire

(* ---------- tracked popup surfaces ---------- *)

(* Popup surfaces that live outside the view-overlay stack — foreign
   pickers and portals the owner mounted itself and wants tracked for
   outside-press dismissal, Escape popping and inside-hit-testing.
   [el] is a service handle to the owner's mounted root (els arrive
   via queries/events, so a tracked node is always already mounted);
   [on_escape] is the owner's teardown hook — there is no node-removal
   op in the services layer, so every dismissal path (outside-press
   drop, Escape pop, programmatic close) runs it and the owner
   unmounts its own node. *)
type overlay =
  { el : Ui_services.el
  ; on_escape : unit -> unit
  }

let overlays : overlay list ref = ref []

(* the services layer offers no element-identity op: two els bound to
   the same host element contain each other, and nothing else does *)
let same_el (a : Ui_services.el) (b : Ui_services.el) =
  a.Ui_services.contains b && b.Ui_services.contains a

(* cljs shui popups dismiss on window mousedown outside their root: a
   click drops every overlay stacked above the innermost overlay that
   contains the click target (all when outside any). *)
let install_outside_close =
  let installed = ref false in
  fun () ->
    if not !installed then (
      installed := true;
      Ui_services.dom_on_document_event ~capture:true "mousedown"
        (fun ev ->
          match ev.Ui_services.target with
          | None -> ()
          | Some target -> (
              match !overlays with
              | [] -> ()
              | os -> (
                  match
                    List.find_index
                      (fun o -> o.el.Ui_services.contains target)
                      os
                  with
                  | Some i ->
                      List.iteri
                        (fun n o -> if n < i then o.on_escape ())
                        os;
                      overlays := List.filteri (fun n _ -> n >= i) os
                  | None ->
                      List.iter (fun o -> o.on_escape ()) os;
                      overlays := []))))

let push_overlay (el : Ui_services.el) ~on_escape =
  install_outside_close ();
  overlays := { el; on_escape } :: !overlays

let remove_overlay_el (el : Ui_services.el) =
  List.iter (fun o -> if same_el o.el el then o.on_escape ()) !overlays;
  overlays := List.filter (fun o -> not (same_el o.el el)) !overlays

(* hit-test against registered overlay roots — registered state, no
   selector list *)
let overlay_contains (el : Ui_services.el) =
  List.exists (fun o -> o.el.Ui_services.contains el) !overlays

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
  let cur = Runtime.signal_get s in
  let cur = List.filter (fun o -> o.vo_key <> key) cur in
  Signal.set s (cur @ [ { vo_key = key; vo_view = view; vo_on_escape = on_escape } ])

let pop_view_overlay context =
  let s = view_overlays_state_of context in
  match List.rev (Runtime.signal_get s) with
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
  | Some s -> Runtime.signal_get s <> []
  | None -> false

(* context-free push/remove for imperative openers (click handlers have
   no ui_context): the state exists once the .cp__overlays chrome has
   mounted, which always precedes the first user interaction *)
let push_view_overlay_ctxfree ~key ~view ~on_escape =
  match !view_overlays_state with
  | Some s ->
      let cur = Runtime.signal_get s in
      let cur = List.filter (fun o -> o.vo_key <> key) cur in
      Runtime.signal_set s
        (cur @ [ { vo_key = key; vo_view = view; vo_on_escape = on_escape } ]);
      true
  | None -> false

let remove_view_overlay key =
  match !view_overlays_state with
  | Some s ->
      Runtime.signal_set s
        (List.filter (fun o -> o.vo_key <> key) (Runtime.signal_get s))
  | None -> ()

(* Escape pops the top view overlay — context-free for the document
   keydown handler *)
let handle_view_escape () =
  match !view_overlays_state with
  | Some s -> (
      match List.rev (Runtime.signal_get s) with
      | top :: rest ->
          Runtime.signal_set s (List.rev rest);
          top.vo_on_escape ();
          true
      | [] -> false)
  | None -> false

(* ---------- pop/close across both stacks ---------- *)

(* "close the top popup" for imperative callers: popovers live on the
   view-overlay stack, tracked surfaces on the overlay stack — the
   view stack holds the most recently opened surface in practice *)
let pop_overlay () =
  match !view_overlays_state with
  | Some s when Runtime.signal_get s <> [] -> (
      match List.rev (Runtime.signal_get s) with
      | top :: rest ->
          Runtime.signal_set s (List.rev rest);
          top.vo_on_escape ()
      | [] -> ())
  | _ -> (
      match !overlays with
      | top :: rest ->
          overlays := rest;
          top.on_escape ()
      | [] -> ())

let close_overlays () =
  List.iter (fun o -> o.on_escape ()) !overlays;
  overlays := [];
  close_all_view_overlays ()

let overlay_open () = !overlays <> [] || view_overlay_open ()

(* Escape pops the top tracked overlay; view overlays and the property
   dialog have their own handlers the keydown dispatcher tries first *)
let handle_escape () =
  match !overlays with
  | top :: rest ->
      overlays := rest;
      top.on_escape ();
      true
  | [] -> false

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
  ; right : W.t list
  ; below : W.t list
  ; rows : W.t list
  ; hidden : W.t list
  ; class_rows : W.t list
  ; bidi : W.t list
  }

let empty_area_data =
  { left = []; right = []; below = []; rows = []; hidden = []
  ; class_rows = []; bidi = [] }

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
      Ui_services.log_error ("property area refresh failed", e);
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
          (drop_title_of (Runtime.signal_get a.a_state) title))
    areas

(* Debounced global refresh: collapses bursts of tx broadcasts into one
   round of get-display-properties calls. *)
let refresh_pending = ref false

(* does the batch's affected-keys touch this area — the area's own
   entity/display-properties keys plus the global property/schema tags
   (renames via page-lookup reach value chips; property-config and
   class-tree can reshape any area). [] = no info -> refresh all *)
let area_hit affected key =
  let uuid =
    match String.index_opt key ':' with
    | Some i -> String.sub key (i + 1) (String.length key - i - 1)
    | None -> key
  in
  List.exists
    (fun k ->
      match W.elems k with
      | W.Keyword ("property-config" | "class-tree" | "page-lookup")
        :: _ ->
          true
      | W.Keyword ("entity" | "display-properties") :: W.Uuid u :: _ ->
          u = uuid
      | _ -> false)
    affected

let refresh_all () =
  if !refresh_pending then ()
  else (
    refresh_pending := true;
    ignore
      (Ui_services.timers_timeout (fun () ->
           refresh_pending := false;
           List.iter (fun a -> ignore (guarded a.a_fetch)) (live_areas ()))
         150))

(* sync-sub entry: same debounce, but only refetches areas whose key
   the delta actually touched *)
let refresh_affected affected =
  if !refresh_pending then ()
  else if affected = [] then refresh_all ()
  else (
    refresh_pending := true;
    ignore
      (Ui_services.timers_timeout (fun () ->
           refresh_pending := false;
           (* prunes dead areas as a side effect, like refresh_all *)
           ignore (live_areas ());
           Hashtbl.iter
             (fun key a ->
               if area_hit affected key then ignore (guarded a.a_fetch))
             areas)
         150))

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
let () =
  Runtime.hooks.refresh_property_areas <-
    (fun () -> Subs_state.task_of_promise (refresh_all_now ()))

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
    ignore (Runtime.on_sync refresh_affected)
  end


