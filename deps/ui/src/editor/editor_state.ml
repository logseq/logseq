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
type editing = { uuid : string; buffer : string; scope : string }

type t =
  { editing : editing option
  ; selected : String_set.t
  ; anchor : string option (* selection focus end for shift-arrow *)
  ; collapsed : String_set.t
  ; expanded : String_set.t
    (* cljs temp-collapsed? inverse: user-expanded overrides a
       block_default_collapsed render flag without persisting *)
  }

let initial =
  { editing = None
  ; selected = String_set.empty
  ; anchor = None
  ; collapsed = String_set.empty
  ; expanded = String_set.empty
  }

let st : t Signal.state option ref = ref None

(* focus request consumed after the next DOM flush — ops remount the page
   subtree, so the textarea must be re-focused once it exists again *)
let pending_focus : (string * int) option ref = ref None

(* structured block clipboard (titles + hierarchy), set by copy/cut *)
let clipboard : Model.block list ref = ref []

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
  Signal.update (state ()) f;
  Runtime.flush ()

(* updates with no visual dependency — folded into the next flush *)
let set_silent f = Signal.update (state ()) f

(* reads fall back to `initial` before the first editor mounts — e.g. on
   an empty page only the title editor exists, but renderers still query
   selection/editing state *)
let read () =
  match !st with Some s -> Signal.get_state s | None -> initial

let editing () = (read ()).editing

let is_editing_in uuid scope =
  match editing () with
  | Some e -> e.uuid = uuid && e.scope = scope
  | None -> false

let editing_uuid () =
  match editing () with Some e -> Some e.uuid | None -> None

let is_editing uuid = editing_uuid () = Some uuid
let selected () = (read ()).selected
let is_selected uuid = String_set.mem uuid (selected ())
let collapsed () = (read ()).collapsed
let is_collapsed uuid = String_set.mem uuid (collapsed ())
let is_expanded uuid = String_set.mem uuid (read ()).expanded

(* render-time collapse: persisted flag || view default, overridable by
   an explicit user expand (cljs temp-collapsed? has priority) *)
let effective_collapsed (b : Model.block) =
  match b.Model.block_uuid with
  | None -> false
  | Some u ->
      if is_expanded u then false
      else is_collapsed u || b.Model.block_default_collapsed
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

let find uuid = find_in (page_blocks ()) uuid

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

(* DFS over visible (non-collapsed-subtree) blocks *)
let flat_visible () =
  let rec go acc blocks =
    match blocks with
    | [] -> acc
    | b :: rest ->
        let acc = b :: acc in
        let acc =
          if effective_collapsed b then acc else go acc (children_of b)
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

let neighbor_of uuid dir =
  let flat = flat_visible () in
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

let prev_visible uuid = neighbor_of uuid `Prev
let next_visible uuid = neighbor_of uuid `Next

(* optimistic title write: a commit updates the model so the row re-renders
   immediately instead of waiting for the worker refresh round-trip *)
let rec map_block_title uuid title blocks =
  List.map
    (fun (b : Model.block) ->
      { b with
        Model.block_title =
          (if b.Model.block_uuid = Some uuid then title
           else b.Model.block_title)
      ; block_children = map_block_title uuid title b.Model.block_children
      ; block_embed_children =
          map_block_title uuid title b.Model.block_embed_children
      })
    blocks

let update_block_title uuid title =
  match !Runtime.current_page with
  | None -> ()
  | Some p ->
      Runtime.current_page :=
        Some
          { p with
            Model.page_blocks =
              map_block_title uuid title p.Model.page_blocks
          };
      set (fun st -> st)

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
