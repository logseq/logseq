(* Editor/outliner UI state, owned by the editor area. One LUI signal holds
   the whole ui record: which block is being edited (and its live buffer so a
   remount can restore the textarea verbatim), the block-selection set with
   its anchor, and the collapsed set mirrored from :block/collapsed? (the
   shared Model.block drops that flag, so we read it from the raw wire
   ourselves in Outliner_ops.refresh). *)

module String_set = Stdlib.Set.Make (String)

(* [scope] is the container the edit started in ("main" or
   "sidebar") — the same block can render in both trees, so only the
   initiating scope mounts the textarea (cljs keys the editor by
   container-local edit-input-id) *)
(* base: the committed title the editor opened with — resync only
   overwrites a still-pristine buffer when the stored title changed
   externally; a divergent buffer is typed-not-yet-saved text *)
type editing = { uuid : string; buffer : string; scope : string; base : string }


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
  }

let st : t Signal.state option ref = ref None

(* focus request consumed after the next DOM flush — ops remount the page
   subtree, so the textarea must be re-focused once it exists again *)
let pending_focus : (string * int * float) option ref = ref None

(* editing keys that arrive while a structure op's textarea is still
   remounting (keydown landed on <body>): queued here and replayed by
   apply_focus once the refreshed model and DOM exist *)
let pending_focus_actions : (unit -> unit) list ref = ref []

(* wall-clock of the last editing-textarea key/input event; worker_events
   defers a sync reload only while the editor is being actively typed in,
   so an idle-but-editing page does not starve remote updates *)
let last_edit_input_ms : float ref = ref 0.0

let note_input () = last_edit_input_ms := Platform.date_now_ms ()

(* asset-dom's upload_files, wired by Asset_dom.install — same ref
   pattern as code_* below (paste_blocks can't link Asset_dom: a cycle
   through asset_dom → editor_actions) *)
let upload_files : (Js.Json.t array -> unit) ref = ref (fun _ -> ())

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
   the editing row back into the virtual window when its textarea can't
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

let ready () = Option.is_some !st

let state () =
  match !st with
  | Some s -> s
  | None -> failwith "editor state not mounted"

let value () = Signal.get_state (state ())

(* the state as a read-only signal for dyn/if_/class_signal consumers *)
let signal () = (state ()).Signal.state_signal

(* updates that must repaint now (called from document listeners, outside
   LUI's event dispatch); Signal.update composes with any pending staged
   value so deferred on_init writes aren't lost *)
let set f =
  let st = state () in
  Signal.update st f;
  Runtime.flush ()

(* updates with no visual dependency — folded into the next flush *)
let set_silent f =
  let st = state () in
  Signal.update st f

(* reads fall back to `initial` before the first editor mounts — e.g. on
   an empty page only the title editor exists, but renderers still query
   selection/editing state *)
let read () =
  match !st with Some s -> Signal.get_state s | None -> initial

let editing () = (read ()).editing

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

let effective_collapsed ?(scope = "main") (b : Model.block) =
  match b.Model.block_uuid with
  | None -> false
  | Some u ->
      effective_collapsed_in ~scope u b.Model.block_default_collapsed
        (read ())
let anchor () = (read ()).anchor
let selection_active () = not (String_set.is_empty (selected ()))

(* -- model helpers over !Runtime.current_page -- *)

let page_blocks () =
  match !Runtime.current_page with
  | Some p -> p.Model.page_blocks
  | None ->
      (* journals view renders every journal item's blocks in the same
         page flow *)
      List.concat_map (fun (p : Model.page) -> p.Model.page_blocks)
        !Runtime.current_journals

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
