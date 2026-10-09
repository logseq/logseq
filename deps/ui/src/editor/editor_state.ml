(* Editor/outliner UI state, owned by the editor area. One LUI signal holds
   the whole ui record: which block is being edited (and its live buffer so a
   remount can restore the buffer verbatim), the block-selection set with
   its anchor, and the collapsed set mirrored from :block/collapsed? (the
   shared Model.block drops that flag, so we read it from the raw wire
   ourselves in Outliner_ops.refresh). *)

module String_set = Stdlib.Set.Make (String)

(* [scope] is the container the edit started in ("main" or
   "sidebar") — the same block can render in both trees, so only the
   initiating scope mounts the editor (cljs keys the editor by
   container-local edit-input-id) *)
(* base: the committed title the editor opened with — resync only
   overwrites a still-pristine buffer when the stored title changed
   externally; a divergent buffer is typed-not-yet-saved text.
   model: the Edit_model the logseq-editor surface renders —
   [buffer] always mirrors [model.source]; offsets are platform units
   (UTF-16 code units under Melange — DOM offsets count code units —
   UTF-8 bytes on native) *)

(* module-init constant: the runtime's unit kind is a host fact read
   before services install — keep the raw platform value here *)
let edit_units : Edit_model.units =
  match Platform.edit_units with
  | `Bytes -> Edit_model.Bytes
  | `U16 -> Edit_model.U16

type editing =
  { uuid : string; buffer : string; scope : string; base : string
  ; model : Edit_model.t }

let mk_editing ?(caret = 0) ~uuid ~buffer ~scope ~base () =
  let model =
    Edit_model.select (Edit_model.create ~units:edit_units buffer)
      ~anchor:caret ~focus:caret
  in
  { uuid; buffer; scope; base; model }

(* republish with a new model — keeps buffer mirroring model.source *)
let with_model e model = { e with buffer = model.Edit_model.source; model }


type t =
  { editing : editing option
  ; selected : String_set.t
  ; anchor : string option (* selection focus end for shift-arrow *)
  ; action_bar : bool
  ; collapsed : String_set.t
  ; expanded : String_set.t
    (* cljs temp-collapsed? inverse: user-expanded overrides a
       block_default_collapsed render flag without persisting *)
  ; collapsed_ui : String_set.t (* per-scope overrides: "scope\x00uuid" *)
  ; expanded_ui : String_set.t
  ; inv_tick : int
      (* bumped by Render_inline cache invalidations via worker_events —
         lets painted rows recheck their rendered-ref gens without
         subscribing the whole state record *)
  ; drag : (string * string * string) option
      (* native bullet-drag affordance: (src_uuid, tgt_uuid, move_to)
         while a drag gesture is in flight — the web dnd-kit path never
         sets it *)
  }

let initial =
  { editing = None
  ; selected = String_set.empty
  ; anchor = None
  ; action_bar = false
  ; collapsed = String_set.empty
  ; expanded = String_set.empty
  ; collapsed_ui = String_set.empty
  ; expanded_ui = String_set.empty
  ; inv_tick = 0
  ; drag = None
  }

include State_cell.Make (struct
  type nonrec t = t
  let name = "editor"
end)

(* focus request consumed after the next DOM flush — ops remount the page
   subtree, so the logseq-editor input must be re-focused once it exists
   again *)
let pending_focus : (string * int * float) option ref = ref None

(* (uuid, ms, clientX, clientY) of the latest mousedown that a click
   will run enter_edit for — the sink mounts after the pointer already
   landed, so its pointer emit is lost; apply_focus hit-tests these
   coords once the input can map them *)
let click_point : (string * float * float * float) option ref = ref None

(* the mounted edit surface's overlay frame — editor_surface registers it
   so caret moves outside apply_input (click hit-test, set_caret) can
   re-measure the caret/selection overlay *)
let active_frame : Edit_input.frame Signal.state option ref = ref None

(* block uuid whose input last reported the conduit's "focus" event —
   native `Editor_sink.is_focused` reads this (the DOM-level
   document.activeElement tracker only exists on the web profile) *)
let focused_block : string option ref = ref None

(* editing keys that arrive while a structure op's editor is still
   remounting (keydown landed on <body>): queued here and replayed by
   focus_pending once the refreshed model and DOM exist *)
let pending_focus_actions : (unit -> unit) list ref = ref []

(* Structural edits depend on the preceding worker transaction. Input
   received while it commits is replayed in order against the resulting
   editing session, including keystrokes aimed at a retired sink. *)
let structure_pending = ref false
let pending_edit_actions : (unit -> unit) Queue.t = Queue.create ()

let drain_edit_actions () =
  while not !structure_pending && not (Queue.is_empty pending_edit_actions) do
    (Queue.take pending_edit_actions) ()
  done

(* wall-clock of the last editing key/input event; worker_events
   defers a sync reload only while the editor is being actively typed in,
   so an idle-but-editing page does not starve remote updates *)
let last_edit_input_ms : float ref = ref 0.0

let note_input () = last_edit_input_ms := Ui_services.time_now ()

(* structured block clipboard (titles + hierarchy), set by copy/cut *)
let clipboard : Model.block list ref = ref []

(* the text/plain payload written alongside `clipboard`; an internal
   paste is detected by comparing the event's text against it *)
let clipboard_text : string ref = ref ""

(* cljs has a single editing block: entering block edit dismisses any
   inline secondary editor (e.g. a property value cell) and vice versa.
   editor_actions binds [close_block_editor] to blur_commit;
   properties_value binds [close_property_editor] to its commit thunk. *)
let close_block_editor : (unit -> unit) ref = ref (fun () -> ())
let close_property_editor : (unit -> unit) ref = ref (fun () -> ())

(* Virt_list binds this to its item-key scroller — editor_actions pulls
   the editing row back into the virtual window when its editor can't
   mount (the row scrolled out or an insert landed below the edge) *)
let scroll_key_into_view : (string -> unit) ref = ref (fun _ -> ())

(* state transforms deferred until the first block_row mounts the state —
   an empty page mounts no rows, so click-to-add on .block-add-button must
   queue its edit-mode entry here. They fold into [initial] before the
   state is created: a staged Signal.set inside mount would only publish on
   the next stabilize, producing a patch batch out of order *)
let on_init : (t -> t) list ref = ref []

let defer_init f = on_init := f :: !on_init

let ensure (ctx : Lui_ui.ui_context) =
  match !st with
  | Some _ -> ()
  | None ->
      let init =
        List.fold_left (fun acc f -> f acc) initial (List.rev !on_init)
      in
      on_init := [];
      st := Some (Signal.state ctx.ui_scheduler init)

(* the state as a read-only signal for dyn/if_/class_signal consumers *)

(* per-field derived signals, created once alongside the coarse record —
   every mounted row leaves ~15 subscriptions behind, so a bare [S.set]
   dirtied ~1k tasks on large pages (~80ms). Rows subscribe a field
   instead: an [editing] change only runs editing subscribers *)
type collapse_view =
  { cv_collapsed : String_set.t
  ; cv_expanded : String_set.t
  ; cv_collapsed_ui : String_set.t
  ; cv_expanded_ui : String_set.t
  }

let equal_collapse_view a b =
  String_set.equal a.cv_collapsed b.cv_collapsed
  && String_set.equal a.cv_expanded b.cv_expanded
  && String_set.equal a.cv_collapsed_ui b.cv_collapsed_ui
  && String_set.equal a.cv_expanded_ui b.cv_expanded_ui

type field_sigs =
  { editing_sig : editing option Signal.signal
  ; selected_sig : String_set.t Signal.signal
  ; anchor_sig : string option Signal.signal
  ; action_bar_sig : bool Signal.signal
  ; collapse_sig : collapse_view Signal.signal
  ; invalidation_sig : int Signal.signal
  ; drag_sig : (string * string * string) option Signal.signal
  }

let field_sigs_opt : field_sigs option ref = ref None

let field_sigs () =
  match !field_sigs_opt with
  | Some f -> f
  | None ->
      let s = signal () in
      let f =
        { editing_sig =
            Signal.cutoff ( = ) (Signal.map (fun st -> st.editing) s)
        ; selected_sig =
            Signal.cutoff String_set.equal
              (Signal.map (fun st -> st.selected) s)
        ; anchor_sig =
            Signal.cutoff ( = ) (Signal.map (fun st -> st.anchor) s)
        ; action_bar_sig =
            Signal.cutoff ( = ) (Signal.map (fun st -> st.action_bar) s)
        ; collapse_sig =
            Signal.cutoff equal_collapse_view
              (Signal.map
                 (fun (st : t) ->
                   { cv_collapsed = st.collapsed
                   ; cv_expanded = st.expanded
                   ; cv_collapsed_ui = st.collapsed_ui
                   ; cv_expanded_ui = st.expanded_ui
                   })
                 s)
        ; invalidation_sig =
            Signal.cutoff ( = ) (Signal.map (fun st -> st.inv_tick) s)
        ; drag_sig =
            Signal.cutoff ( = ) (Signal.map (fun st -> st.drag) s)
        }
      in
      field_sigs_opt := Some f;
      f

let editing_sig () = (field_sigs ()).editing_sig
let selected_sig () = (field_sigs ()).selected_sig
let anchor_sig () = (field_sigs ()).anchor_sig
let action_bar_sig () = (field_sigs ()).action_bar_sig
let collapse_sig () = (field_sigs ()).collapse_sig
let invalidation_sig () = (field_sigs ()).invalidation_sig
let drag_sig () = (field_sigs ()).drag_sig

(* Render_inline cache invalidation dirtied painted rows' ref gens —
   fold a tick into the state so row invalidation signals emit on the
   next flush. Silent: the caller's update flow already flushes *)
let bump_invalidation () =
  match !st with
  | Some st -> Signal.update st (fun s -> { s with inv_tick = s.inv_tick + 1 })
  | None -> ()

(* updates that must repaint now (called from document listeners, outside
   LUI's event dispatch); Signal.update composes with any pending staged
   value so deferred on_init writes aren't lost *)
(* updates with no visual dependency — folded into the next flush *)
let set_silent f =
  let st = state () in
  Signal.update st f

(* reads fall back to `initial` before the first editor mounts — e.g. on
   an empty page only the title editor exists, but renderers still query
   selection/editing state *)
let read () =
  match !st with Some s -> Runtime.signal_get s | None -> initial

(* imperative access to the in-flight drag — set only on target/zone
   transitions, never per mousemove *)
let drag () = (read ()).drag
let set_drag v = set (fun st -> { st with drag = v })

(* imperative readers get the pending (not-yet-published) value:
   Signal.update composes onto it, so a published snapshot can lag the
   edit buffer by several keystrokes during a remount window — caret
   math and mount renders must see the latest *)
let editing () =
  match !st with
  | Some s -> (
      match !(s.Signal.pending) with
      | Some v -> v.editing
      | None -> (read ()).editing)
  | None -> initial.editing

let editing_uuid () =
  match editing () with Some e -> Some e.uuid | None -> None

let selected () = (read ()).selected
let is_selected uuid = String_set.mem uuid (selected ())
let collapsed () = (read ()).collapsed
let is_collapsed uuid = String_set.mem uuid (collapsed ())
let is_expanded uuid = String_set.mem uuid (read ()).expanded

(* per-scope collapse: cljs scopes UI collapse overrides by container
   (the same block can render collapsed in the page but expanded as a
   sidebar/zoom root); "scope\x00uuid" keys the override sets *)
let collapse_key scope uuid = scope ^ "\x00" ^ uuid

(* cljs get-block-collapsed: the per-scope UI override wins, then the
   global expanded override, then the persisted :block/collapsed? datom *)
let collapsed_in ~scope (st : t) uuid =
  let k = collapse_key scope uuid in
  if String_set.mem k st.expanded_ui then false
  else if String_set.mem k st.collapsed_ui then true
  else if String_set.mem uuid st.expanded then false
  else String_set.mem uuid st.collapsed

(* same check on the projected [collapse_view] carried by [collapse_sig] *)
let collapsed_in_view ~scope (v : collapse_view) uuid =
  let k = collapse_key scope uuid in
  if String_set.mem k v.cv_expanded_ui then false
  else if String_set.mem k v.cv_collapsed_ui then true
  else if String_set.mem uuid v.cv_expanded then false
  else String_set.mem uuid v.cv_collapsed

let is_collapsed_in ?(scope = "main") uuid = collapsed_in ~scope (read ()) uuid

let collapsed_ui_transform ~scope uuid v (st : t) =
  let k = collapse_key scope uuid in
  { st with
    collapsed_ui =
      (if v then String_set.add k st.collapsed_ui
       else String_set.remove k st.collapsed_ui)
  ; expanded_ui =
      (if v then String_set.remove k st.expanded_ui
       else String_set.add k st.expanded_ui)
  }

let set_collapsed ?(scope = "main") uuid v =
  if ready () then set (collapsed_ui_transform ~scope uuid v)
  else defer_init (collapsed_ui_transform ~scope uuid v)

(* cljs block.cljs mounts a container's root block with
   set-collapsed-block! false — a zoomed/sidebar root always shows its
   children there even when the db datom is collapsed *)
let expand_root ~scope uuid = set_collapsed ~scope uuid false

(* render-time collapse: scoped overrides first, then persisted flag ||
   view default, minus the explicit user-expand override *)
let effective_collapsed_in ~scope uuid default (st : t) =
  if String_set.mem uuid st.expanded
     || String_set.mem (collapse_key scope uuid) st.expanded_ui
  then false
  else collapsed_in ~scope st uuid || default

let effective_collapsed_in_view ~scope uuid default (v : collapse_view) =
  if String_set.mem uuid v.cv_expanded
     || String_set.mem (collapse_key scope uuid) v.cv_expanded_ui
  then false
  else collapsed_in_view ~scope v uuid || default

let effective_collapsed ?(scope = "main") (b : Model.block) =
  match b.Model.block_uuid with
  | None -> false
  | Some u ->
      effective_collapsed_in ~scope u b.Model.block_default_collapsed
        (read ())
let anchor () = (read ()).anchor
let selection_active () = not (String_set.is_empty (selected ()))

(* -- model helpers over (Runtime.model ()).Model.route_page -- *)

let page_blocks () =
  match (Runtime.model ()).Model.route_page with
  | Some p -> p.Model.page_blocks
  | None ->
      (* journals view renders every journal item's blocks in the same
         page flow *)
      List.concat_map (fun (p : Model.page) -> p.Model.page_blocks)
        (Runtime.model ()).Model.journals

(* blocks a row actually displays: a :block/link (embed) block renders the
   linked page's fetched blocks in place of its own children — so lookups
   and visible order must consult block_embed_children for them *)
let children_of (b : Model.block) =
  match b.Model.block_link with
  | Some _ -> b.Model.block_embed_children
  | None -> b.Model.block_children

let rec find_in blocks uuid =
  match blocks with
  | [] -> None
  | b :: rest -> (
      if b.Model.block_uuid = Some uuid then Some b
      else
        match find_in (children_of b) uuid with
        | Some _ as r -> r
        | None -> find_in rest uuid)

(* block sources outside the current page tree (right-sidebar items) —
   the owning area registers its lookup at init *)
let extra_sources : (string -> Model.block option) list ref = ref []

let add_block_source f = extra_sources := f :: !extra_sources

let find uuid =
  match find_in (page_blocks ()) uuid with
  | Some _ as r -> r
  | None ->
      let rec go = function
        | [] -> None
        | f :: fs -> (
            match f uuid with Some _ as r -> r | None -> go fs)
      in
      go !extra_sources
      |> (fun r ->
           match r with
           | Some _ -> r
           | None ->
               (* quick-add dialog blocks live outside the current page
                  tree *)
               find_in (Quick_add_state.value ()).Quick_add_state.blocks
                 uuid)

(* committed edit buffers, applied to rendered titles immediately — the
   page model only catches up once the worker transact+refresh lands, and
   a stale paint between the two shows a blank/reverted title *)
let display_overrides : (string, string) Hashtbl.t = Hashtbl.create 8

let override_title uuid title =
  Hashtbl.replace display_overrides uuid title

let title_for uuid fallback =
  Option.value (Hashtbl.find_opt display_overrides uuid) ~default:fallback

let clear_overrides () = Hashtbl.reset display_overrides

(* drop overrides the model has caught up to: [touched] uuids whose canon
   row a delta splice just landed (its stored form wins over our
   normalized paint), blocks that vanished, and rows whose stored title
   already equals the override. Untouched overrides stay — their commits
   are still in flight *)
let prune_overrides touched =
  let dead u t =
    List.mem u touched
    ||
    match find u with
    | Some b -> b.Model.block_title = t
    | None -> true
  in
  Hashtbl.fold
    (fun u t acc -> if dead u t then u :: acc else acc)
    display_overrides []
  |> List.iter (Hashtbl.remove display_overrides)

(* CodeMirror buffer/focus providers for code-fence blocks, wired by
   Code_mirror.install — refs so Editor_actions needs no CM module dep *)
let code_buffer_of : (string -> string option) ref = ref (fun _ -> None)

let code_focus : (caret:int -> string -> bool) ref =
  ref (fun ~caret:_ _ -> false)

(* returns (parent, index) of uuid among its siblings *)
let rec find_parent_in blocks uuid =
  match blocks with
  | [] -> None
  | parent :: rest -> (
      let children = children_of parent in
      let rec idx i = function
        | [] -> None
        | c :: _ when c.Model.block_uuid = Some uuid -> Some i
        | _ :: cs -> idx (i + 1) cs
      in
      match idx 0 children with
      | Some i -> Some (Some parent, i)
      | None -> (
          match find_parent_in children uuid with
          | Some _ as r -> r
          | None -> find_parent_in rest uuid))

let find_parent uuid =
  (* top-level: parent = None (page) *)
  let tops = page_blocks () in
  let rec top_idx i = function
    | [] -> None
    | b :: _ when b.Model.block_uuid = Some uuid -> Some i
    | _ :: cs -> top_idx (i + 1) cs
  in
  match top_idx 0 tops with
  | Some i -> Some (None, i)
  | None -> find_parent_in tops uuid

(* uuid of the top-level row containing [uuid] — virtual lists window
   top-level items only, so a nested block's row lives under its
   highest ancestor *)
let rec top_level_uuid uuid =
  match find_parent uuid with
  | Some (Some p, _) -> (
      match p.Model.block_uuid with
      | Some u -> top_level_uuid u
      | None -> uuid)
  | _ -> uuid

(* DFS over visible (non-collapsed-subtree) blocks *)
let flat_visible ?(scope = "main") () =
  let rec go acc blocks =
    match blocks with
    | [] -> acc
    | b :: rest ->
        let acc = b :: acc in
        let acc =
          if effective_collapsed ~scope b then acc
          else go acc (children_of b)
        in
        go acc rest
  in
  List.rev (go [] (page_blocks ()))

let flat_all () =
  let rec go acc blocks =
    match blocks with
    | [] -> acc
    | b :: rest -> go (go (b :: acc) (children_of b)) rest
  in
  List.rev (go [] (page_blocks ()))

let neighbor_of ?(scope = "main") uuid dir =
  let flat = flat_visible ~scope () in
  let rec scan prev = function
    | [] -> None
    | b :: rest ->
        if b.Model.block_uuid = Some uuid then (
          match dir, rest with
          | `Prev, _ -> prev
          | `Next, h :: _ -> Some h
          | `Next, [] -> None)
        else scan (Some b) rest
  in
  scan None flat

let prev_visible ?(scope = "main") uuid = neighbor_of ~scope uuid `Prev
let next_visible ?(scope = "main") uuid = neighbor_of ~scope uuid `Next

let prev_sibling uuid =
  match find_parent uuid with
  | Some (parent_opt, idx) when idx > 0 ->
      let siblings =
        match parent_opt with
        | Some p -> p.Model.block_children
        | None -> page_blocks ()
      in
      List.nth_opt siblings (idx - 1)
  | _ -> None
