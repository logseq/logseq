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

let prepare_paint ui host =
  let hard, soft = Lui_window.Ui.paint_hints ui (Lui_host.store host) in
  Hashtbl.iter (fun id () -> Lui_host.note_paint host id) hard;
  Hashtbl.iter (fun id () -> Lui_host.note_moved host id) soft

let has_attribute payload name =
  let n = String.length payload and m = String.length name in
  let rec matches i j = j = m ||
    (payload.[i + j] = name.[j] && matches i (j + 1)) in
  let rec found i = i + m <= n && (matches i 0 || found (i + 1)) in
  m = 0 || found 0

let node_has_attribute store id name =
  let has prop = match Lui_store.string_prop store id prop with
    | Some attributes -> has_attribute attributes name
    | None -> false in
  has "attrs" || has "data-attrs"

let refresh_rects ~store ~base ~scroll_x ~scroll_y ~scrollable rects =
  let intersect (a : Lui_scene.rect) (b : Lui_scene.rect) =
    let x = max a.x b.x and y = max a.y b.y in
    Lui_scene.rect x y (max 0. (min (a.x +. a.w) (b.x +. b.w) -. x))
      (max 0. (min (a.y +. a.h) (b.y +. b.h) -. y))
  in
  let transforms = Hashtbl.create (Lui_store.node_count store) in
  let unbounded = Lui_scene.rect (-1.e9) (-1.e9) 2.e9 2.e9 in
  Hashtbl.reset rects;
  Lui_store.iter_preorder store (fun id ->
    let x, y, clip =
      match Lui_store.parent store id with
      | None -> 0., 0., unbounded
      | Some parent ->
        let x, y, clip = Hashtbl.find transforms parent in
        let clip =
          if scrollable parent then intersect clip (Hashtbl.find rects parent)
          else clip
        in
        x +. scroll_x parent, y +. scroll_y parent, clip
    in
    let r : Lui_scene.rect = base id in
    Hashtbl.replace transforms id (x, y, clip);
    Hashtbl.replace rects id (intersect clip {r with x=r.x-.x; y=r.y-.y}))

let seal_overlay (scene : Lui_scene.t) = scene.glyphs <- List.rev scene.glyphs

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
      if not (Hashtbl.mem lazy_fired id) && visible then begin
        Hashtbl.replace lazy_fired id (); emit "lazy-mount" id
      end else if Hashtbl.mem lazy_fired id && not visible && not (pinned id) then begin
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
    let rec prefix glyphs =
      if glyphs == body then []
      else match glyphs with
        | glyph::rest -> glyph :: prefix rest
        | [] -> invalid_arg "Overlay draw must prepend glyphs to the current scene" in
    let rec reuse fresh old = match fresh,old with
      | glyph::rest,previous::remaining ->
        (if glyph=previous then previous else glyph) :: reuse rest remaining
      | fresh,_ -> fresh in
    let glyphs = prefix scene.glyphs in
    let glyphs = match cache.overlay with
      | Some (_,_,_,old) -> reuse glyphs old
      | None -> glyphs in
    scene.glyphs <- glyphs @ body;
    cache.overlay <- Some (key,base,ops,glyphs);
    ops
