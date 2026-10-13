(* Interaction policy shared by the native loop and its regression tests. *)
let context_anchor store menu pointer =
  if menu <> 0 && Lui_store.kind store menu = "context-menu" then Some pointer
  else None

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
  let rec found i = i + m <= n && (String.sub payload i m = name || found (i + 1)) in
  m = 0 || found 0

let refresh_rects ~store ~base ~scroll_x ~scroll_y ~scrollable rects =
  let intersect (a : Lui_scene.rect) (b : Lui_scene.rect) =
    let x = max a.x b.x and y = max a.y b.y in
    Lui_scene.rect x y (max 0. (min (a.x +. a.w) (b.x +. b.w) -. x))
      (max 0. (min (a.y +. a.h) (b.y +. b.h) -. y))
  in
  let transforms = Hashtbl.create (Lui_store.node_count store) in
  let unbounded = Lui_scene.rect (-1.e9) (-1.e9) 2.e9 2.e9 in
  Hashtbl.reset rects;
  List.iter (fun id ->
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
    (Lui_store.preorder store)

let seal_overlay (scene : Lui_scene.t) = scene.glyphs <- List.rev scene.glyphs

let measure_width width = if Float.is_finite width && width > 0. then width else 0.
