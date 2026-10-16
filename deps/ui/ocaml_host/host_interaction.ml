(* Interaction policy shared by the native loop and its regression tests. *)
let context_anchor store menu pointer =
  if menu <> 0 && Lui_store.kind store menu = "context-menu" then Some pointer
  else None

type hit_snapshot = {
  hit_store : Lui_store.t;
  hit_rects : Lui_window.Rects.t;
  hit_revision : int;
  hit_epoch : int;
  hit_index : Lui_spatial.t;
}
type hit_cache = { mutable hit_snapshot : hit_snapshot option }
let hit_cache () = {hit_snapshot=None}
let hit_index cache ~store ~rects ~epoch =
  let revision = Lui_store.revision store in
  match cache.hit_snapshot with
  | Some previous when previous.hit_store == store && previous.hit_rects == rects
      && previous.hit_revision = revision && previous.hit_epoch = epoch -> previous.hit_index
  | _ ->
    let index = Lui_spatial.build Lui_paint.spatial_env store
      ~rect_of:(Lui_window.Rects.get rects) in
    cache.hit_snapshot <- Some {hit_store=store;hit_rects=rects;
      hit_revision=revision;hit_epoch=epoch;hit_index=index};
    index

type editor_cache = {
  mutable store : Lui_store.t option;
  mutable revision : int;
  mutable candidate : string option;
}
let editor_cache () = { store = None; revision = -1; candidate = None }
let editor_candidate cache store =
  let same_store = match cache.store with Some previous -> previous == store | None -> false in
  let revision = Lui_store.revision store in
  if not same_store || cache.revision <> revision then begin
    cache.candidate <- List.find_map
      (fun id -> Lui_store.string_prop store id "block-id") (Lui_store.preorder store);
    cache.store <- Some store;
    cache.revision <- revision
  end;
  cache.candidate

let caret_ops ~scale ~color (rect : Lui_scene.rect) =
  if rect.h <= 0. then []
  else
    [ Lui_scene.Fill
        { frect = { rect with w = 2. *. scale };
          fradii = (0., 0., 0., 0.); fcontinuous = false;
          fcolor = color; fpaint = Lui_scene.Solid; fcolor2 = color;
          fgradient = (0., 0., 0., 0.); fborder = (0., 0., 0., 0.);
          fborder_color = Lui_scene.color 0 0 0 0;
          fdashed = false; fwide = 0; fopacity = 1. } ]

let advance_frame ui host ~now ~reduced_motion =
  Lui_host.set_reduced_motion host reduced_motion;
  Lui_host.tick host ~now;
  Lui_window.Ui.tick_scrollbars ui ~now_ms:(now *. 1000.)

let apply_event_batch host event batch =
  let direct_resize =
    match event with
    | Lui_protocol.ValueChanged (id, _) ->
        Lui_store.kind (Lui_host.store host) id = "split"
    | _ -> false
  in
  Lui_host.apply_batch ~animate_resize:(not direct_resize) host batch

let prepare_paint ui host =
  let hard, soft = Lui_window.Ui.paint_hints ui (Lui_host.store host) in
  Hashtbl.iter (fun id () -> Lui_host.note_paint host id) hard;
  Hashtbl.iter (fun id () -> Lui_host.note_moved host id) soft

let rec attribute_matches payload name i j =
  j = String.length name ||
  (payload.[i + j] = name.[j] && attribute_matches payload name i (j + 1))

let rec attribute_found payload name i =
  i + String.length name <= String.length payload &&
  (attribute_matches payload name i 0 || attribute_found payload name (i + 1))

let has_attribute payload name = attribute_found payload name 0

let prop_has_attribute store id name prop =
  match Lui_store.string_prop store id prop with
  | Some attributes -> has_attribute attributes name
  | None -> false

let node_has_attribute store id name =
  prop_has_attribute store id name "attrs" || prop_has_attribute store id name "data-attrs"

let refresh_rects ~store ~base ~scroll_x ~scroll_y rects =
  let transforms = Hashtbl.create (Lui_store.node_count store) in
  let unshifted = 0.,0. in
  Hashtbl.reset rects;
  Lui_store.iter_preorder store (fun id ->
    let inherited =
      match Lui_store.parent store id with
      | None -> unshifted
      | Some parent -> Hashtbl.find transforms parent
    in
    let offset_x,offset_y = inherited in
    let r : Lui_scene.rect = base id in
    let shifted = if offset_x=0. && offset_y=0. then r
      else {r with x=r.x-.offset_x; y=r.y-.offset_y} in
    (* The shared hit walk owns clipping and promoted-popup escape.
       Baking ancestor clips into these boxes loses popup hit regions. *)
    Hashtbl.replace rects id shifted;
    (* Resolve the children's transform once per parent. Ordinary wrappers
       share the inherited value rather than allocating identical tuples. *)
    if Lui_store.child_count store id>0 then begin
      let child_x = offset_x+.scroll_x id and child_y = offset_y+.scroll_y id in
      let children = if child_x=offset_x && child_y=offset_y then inherited
        else child_x,child_y in
      Hashtbl.replace transforms id children
    end)

let seal_overlay (scene : Lui_scene.t) = scene.glyphs <- List.rev scene.glyphs

let scroll_shifts ~store ~scroll_epoch ~scroll_x ~scroll_y =
  let shifts = Hashtbl.create 256 in
  let revision = ref (-1) and epoch = ref (-1) in
  let rec read id =
    let current_store = store () in
    let current_revision = Lui_store.revision current_store and current_epoch = scroll_epoch () in
    if !revision <> current_revision || !epoch <> current_epoch then begin
      Hashtbl.reset shifts; revision := current_revision; epoch := current_epoch
    end;
    match Hashtbl.find shifts id with
    | shift -> shift
    | exception Not_found ->
      let shift = match Lui_store.parent current_store id with
        | None -> 0.,0.
        | Some parent ->
          let inherited = read parent in
          let dx = scroll_x parent and dy = scroll_y parent in
          if dx=0. && dy=0. then inherited
          else let x,y = inherited in x +. dx, y +. dy
      in
      Hashtbl.replace shifts id shift;
      shift
  in
  read

type content_edges = {
  mutable left : float;
  mutable top : float;
  mutable right : float;
  mutable bottom : float;
}

let content_bounds ~store ~rect_of id =
  let bounds = {left=Float.max_float; top=Float.max_float;
    right = -.Float.max_float; bottom = -.Float.max_float} in
  Lui_store.iter_preorder ~root:id store (fun child ->
    if child<>id then begin
      let r = rect_of child in
      bounds.left <- Float.min bounds.left r.Lui_scene.x;
      bounds.top <- Float.min bounds.top r.Lui_scene.y;
      bounds.right <- Float.max bounds.right (r.Lui_scene.x +. r.Lui_scene.w);
      bounds.bottom <- Float.max bounds.bottom (r.Lui_scene.y +. r.Lui_scene.h)
    end);
  bounds.left,bounds.top,bounds.right,bounds.bottom

let measure_width width = if Float.is_finite width && width > 0. then width else 0.

let scroll_extent (viewport : Lui_scene.rect) ~right ~bottom =
  max 0. (right -. viewport.x -. viewport.w),
  max 0. (bottom -. viewport.y -. viewport.h)
type viewport_cache = {
  mutable viewport_store : Lui_store.t option;
  mutable viewport_revision : int;
  mutable viewport_ids : int list;
  viewport_members : (int,unit) Hashtbl.t;
}
let viewport_cache () = {viewport_store=None; viewport_revision=(-1); viewport_ids=[];viewport_members=Hashtbl.create 16}
let viewport_candidates cache store =
  let same_store = match cache.viewport_store with
    | Some previous -> previous == store | None -> false in
  let revision = Lui_store.revision store in
  if not same_store || cache.viewport_revision <> revision then begin
    let ids = ref [] in
    Hashtbl.reset cache.viewport_members;
    Lui_store.iter_preorder store (fun id ->
      if node_has_attribute store id "data-lazy-mount"
          || node_has_attribute store id "data-virt-count" then begin
        Hashtbl.add cache.viewport_members id (); ids := id :: !ids
      end);
    cache.viewport_ids <- List.rev !ids;
    cache.viewport_store <- Some store;
    cache.viewport_revision <- revision
  end;
  cache.viewport_ids

let viewport_events ?(pinned=fun _ -> false) cache ~store ~rect_of ~height ~lazy_fired ~virt_end_fired ~emit =
  let previous_revision = cache.viewport_revision and previous_store = cache.viewport_store in
  let ids = viewport_candidates cache store in
  if previous_revision <> cache.viewport_revision || previous_store != cache.viewport_store then begin
    let keep id value = if Hashtbl.mem cache.viewport_members id then Some value else None in
    Hashtbl.filter_map_inplace keep lazy_fired;
    Hashtbl.filter_map_inplace keep virt_end_fired
  end;
  let edge = height +. 768. in
  let attrs_has id name = node_has_attribute store id name in
  List.iter (fun id ->
    let r : Lui_scene.rect = rect_of id in
    if attrs_has id "data-lazy-mount" then begin
      let visible = r.y < edge && r.y +. r.h > -256. in
      (* Warmup content can already be mounted before the first entry
         event. Its automatic height identifies that mounted state. *)
      if not (Hashtbl.mem lazy_fired id) && visible then begin
        Hashtbl.replace lazy_fired id (); emit "lazy-mount" id
      end else if not visible && not (pinned id)
          && (Hashtbl.mem lazy_fired id || Lui_store.string_prop store id "height"=Some "auto") then begin
        Hashtbl.remove lazy_fired id; emit "lazy-unmount" id
      end
    end else if attrs_has id "data-virt-count" then begin
      let bottom = r.y +. r.h in
      let previous = Option.value (Hashtbl.find_opt virt_end_fired id) ~default:(-1.) in
      if bottom < edge && bottom > previous then begin
        Hashtbl.replace virt_end_fired id bottom; emit "virt-end" id
      end
    end) ids

let lazy_mount_groups store ids =
  let target id =
    let rec ancestor parent =
      match Lui_store.string_prop store parent "events" with
      | Some events when events<>"" ->
        let marker = match Lui_store.string_prop store parent "attrs" with
          | Some attrs -> has_attribute attrs "data-lazy-mount" | None -> false in
        if not marker && List.mem "lazy-mount" (String.split_on_char ' ' events)
        then parent else id
      | _ -> match Lui_store.parent store parent with
        | Some next -> ancestor next | None -> id in
    match Lui_store.parent store id with Some parent -> ancestor parent | None -> id in
  let groups = Hashtbl.create 8 and order = ref [] in
  List.iter (fun id ->
    let parent = target id in
    match Hashtbl.find_opt groups parent with
    | Some children -> children := id :: !children
    | None -> Hashtbl.add groups parent (ref [id]); order := parent :: !order) ids;
  List.rev_map (fun parent -> parent,List.rev !(Hashtbl.find groups parent)) !order

type presentation = { mutable pending : bool }
type memory_replay_mode = Replay_off | Replay_changes | Replay_continuous
let memory_replay_mode ~enabled mode =
  match enabled,mode with
  | false,None -> Replay_off
  | true,None | true,Some "continuous" -> Replay_continuous
  | true,Some "changes" -> Replay_changes
  | false,Some _ -> invalid_arg "Replay mode requires a replay duration"
  | true,Some _ -> invalid_arg "Unknown native memory replay mode"

(* Retained backing content remains useful to window previews and accessibility
   while occluded. Updating it does not establish onscreen presentation. *)
let can_render ~replay ~visible ~backing = visible || backing || replay <> Replay_off

let should_paint ~replay ~visible ~backing ~dirty =
  match replay with
  | Replay_continuous -> true
  | Replay_changes | Replay_off -> can_render ~replay ~visible ~backing && dirty

let presentation () = {pending=false}
let present state ~ready ~submit scene =
  if ready then begin submit scene; state.pending <- false; true end
  else begin state.pending <- true; false end
let presentation_due state = state.pending

type 'key overlay_cache = {
  mutable overlay : ('key * int * Lui_scene.op list * Lui_scene.glyph list) option;
}
let overlay_cache () = {overlay=None}
let overlay_cached cache ~key (scene : Lui_scene.t) draw =
  let body = scene.glyphs in
  let base = List.length body in
  match cache.overlay with
  | Some (previous,previous_base,ops,glyphs) when previous=key ->
    scene.glyphs <- glyphs @ body;
    if previous_base=base then ops
    else List.map (function
      | Lui_scene.Glyphs range -> Lui_scene.Glyphs
          {range with gstart=range.gstart + base - previous_base;
                      gend=range.gend + base - previous_base}
      | op -> op) ops
  | _ ->
    let ops = draw () in
    (* Reuse the unchanged suffix while separating the overlay from the body.
       Metrics labels already share their glyphs; copying that suffix once to
       extract it and again to compare it would allocate on every sample. *)
    let rec prefix glyphs previous =
      if glyphs == body then []
      else match glyphs,previous with
        | glyph::rest,previous_glyph::previous_rest ->
          let tail = prefix rest previous_rest in
          let glyph = if glyph=previous_glyph then previous_glyph else glyph in
          if glyph==previous_glyph && tail==previous_rest then previous
          else glyph::tail
        | glyph::rest,[] -> glyph :: prefix rest []
        | [],_ -> invalid_arg "Overlay draw must prepend glyphs to the current scene" in
    let previous = match cache.overlay with Some (_,_,_,glyphs) -> glyphs | None -> [] in
    let glyphs = prefix scene.glyphs previous in
    scene.glyphs <- if body=[] then glyphs else glyphs @ body;
    cache.overlay <- Some (key,base,ops,glyphs);
    ops

let pointer_cursor ui store rects node =
  let rec up id depth =
    if id <= 0 || depth > 64 then "default"
    else
      let kind = Lui_store.kind store id in
      match Lui_store.string_prop store id "cursor" with
      | Some c when c <> "" && c <> "auto" && c <> "inherit" -> c
      | _ ->
        if kind = "extension:logseq-editor" || kind = "text-field"
           || kind = "textarea" || kind = "input"
           || kind = "search-field" || kind = "secure-field"
        then "text"
        else if kind = "link" || kind = "button" || kind = "menu-item"
                || kind = "toggle" || kind = "checkbox"
        then "pointer"
        else if kind = "split" &&
          (let x,y=Lui_window.Ui.pointer ui in
           Lui_window.Ui.split_handle ui store rects id ~x ~y) then "col-resize"
        else if Lui_query.presented_overlay store id then "default"
        else
          match Lui_store.parent store id with
          | Some p -> up p (depth + 1)
          | None -> "default"
  in
  if Lui_window.Ui.resizing_split ui then "col-resize" else up node 0
