open Lui_protocol

let check message condition = if not condition then failwith message

let pointer_layout () =
  let store = Lui_store.create () in
  Lui_store.apply_op store (CreateNode (1, Column));
  let layout = Lui_layout.create () in
  let sync pointer =
    Lui_layout.sync ?ctx_anchor:(Host_interaction.context_anchor store 0 pointer)
      ~width:800. ~height:600. layout store
  in
  sync (10., 10.);
  let before = Lui_layout.stat_syncs layout in
  sync (20., 20.);
  check "Pointer motion without a context menu rebuilt layout"
    (Lui_layout.stat_syncs layout = before);
  Lui_store.apply_op store (CreateNode (2, ContextMenu));
  check "Context menu lost its pointer anchor"
    (Host_interaction.context_anchor store 2 (30., 40.) = Some (30., 40.));
  check "Other popup changed the context anchor"
    (Host_interaction.context_anchor store 1 (30., 40.) = None)

let idle_editor_scan () =
  let store = Lui_store.create () in
  for id = 1 to 1000 do Lui_store.apply_op store (CreateNode (id, Column)) done;
  let cache = Host_interaction.editor_cache () in
  ignore (Host_interaction.editor_candidate cache store);
  let before = (Gc.quick_stat ()).Gc.minor_words in
  for _ = 1 to 100 do ignore (Host_interaction.editor_candidate cache store) done;
  let allocated = (Gc.quick_stat ()).Gc.minor_words -. before in
  check "Idle focus checks allocated full store walks" (allocated < 10000.);
  Lui_store.apply_op store (SetExtensionProp (1000, "block-id", StringValue "block"));
  check "Newly mounted editor was not discovered"
    (Host_interaction.editor_candidate cache store = Some "block");
  Lui_store.apply_op store (DropNode 1000);
  check "Removed editor remained cached"
    (Host_interaction.editor_candidate cache store = None)

let visible_caret () =
  let color = Lui_scene.color 20 30 40 255 in
  let rect = Lui_scene.rect 120. 80. 0. 24. in
  (match Host_interaction.caret_ops ~scale:2. ~color rect with
   | [Lui_scene.Fill fill] ->
     check "Caret geometry does not match the glyph position"
       (fill.frect.x = 120. && fill.frect.y = 80. && fill.frect.w = 4.
        && fill.frect.h = 24. && fill.fcolor = color)
   | _ -> failwith "Focused editor has no visible caret paint operation");
  check "Clipped caret was painted"
    (Host_interaction.caret_ops ~scale:2. ~color (Lui_scene.rect 0. 0. 0. 0.) = [])

let interaction_repaints () =
  let ui = Lui_window.Ui.create () in
  let store_cell = ref None in
  let hooks = { Lui_paint.default_hooks with
    color_of = Lui_window.Theme.color_of;
    layout = (fun _ -> Lui_paint.placement_of_rect (Lui_scene.rect 10. 10. 200. 40.));
    state_of = (fun id -> Lui_window.Ui.state_of ui (Option.get !store_cell) id) } in
  let host = Lui_host.create ~hooks
    ~renderer:{name="test"; render=(fun _ -> Bytes.empty)}
    ~width:800 ~height:600 ~scale:1. () in
  let store = Lui_host.store host in
  store_cell := Some store;
  ignore (Lui_host.apply_batch host {generation=1; ops=[CreateNode (1, TextField)]});
  Host_interaction.prepare_paint ui host;
  ignore (Lui_host.repaint host);
  let before = (Lui_host.scene host).Lui_scene.ops in
  Lui_window.Ui.frame_done ui;
  Lui_window.Ui.set_focused ~kbd:true ui store 1;
  Host_interaction.prepare_paint ui host;
  ignore (Lui_host.repaint host);
  check "Focused control replayed stale paint fragments"
    ((Lui_host.scene host).Lui_scene.ops <> before)

let viewport_attributes () =
  check "Unrelated attributes emitted lazy-mount events"
    (not (Host_interaction.has_attribute {|{"data-testid":"block"}|} "data-lazy-mount"));
  check "Lazy mount marker was missed"
    (Host_interaction.has_attribute {|{"data-lazy-mount":"true"}|} "data-lazy-mount")

let geometry_refresh () =
  let store = Lui_store.create () in
  for id = 1 to 100 do
    Lui_store.apply_op store (CreateNode (id, Column));
    if id > 1 then Lui_store.apply_op store (InsertChild (id - 1, id, 0))
  done;
  let reads = ref 0 in
  let base id = incr reads; Lui_scene.rect 0. (float (id * 10)) 100. 100. in
  let rects = Lui_window.Rects.create () in
  Host_interaction.refresh_rects ~store ~base ~scroll_x:(fun _ -> 0.)
    ~scroll_y:(fun id -> if id=1 then 5. else 0.) ~scrollable:(fun id -> id=1) rects;
  check "Hit geometry refresh walks every ancestor repeatedly" (!reads <= 100);
  let child = Lui_window.Rects.get rects 2 in
  check "Scroll shifted hit geometry incorrectly" (child.y = 15.);
  let last = Lui_window.Rects.get rects 100 in
  check "Offscreen descendants escaped their scroll clip" (last.h = 0.)

let overlay_glyphs () =
  let atlas = Lui_scene.Atlas.create ~bpp:1 ~w:16 ~h:16 in
  let scene = Lui_scene.create ~mask_atlas:atlas ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:16 ~h:16) in
  let glyph x = { Lui_scene.gx=x; gy=0.; gw=1.; gh=1.; gu=0; gv=0;
    guw=1; gvh=1; gcolor=Lui_scene.color 0 0 0 255; gwide=0;
    gcolored=false; gsubpixel=false; gthin=false } in
  scene.glyphs <- [glyph 3.; glyph 2.; glyph 1.];
  Host_interaction.seal_overlay scene;
  let rendered = Array.of_list scene.glyphs in
  check "Overlay glyphs shifted retained text indices"
    (rendered.(0).gx = 1. && rendered.(1).gx = 2. && rendered.(2).gx = 3.)

let unconstrained_measure () =
  let memo = Hashtbl.create 2 in
  Hashtbl.add memo (Host_interaction.measure_width infinity) (10., 20.);
  check "Unconstrained width never hits the text measurement cache"
    (Hashtbl.find_opt memo (Host_interaction.measure_width nan) = Some (10., 20.));
  check "A positive wrapping width was discarded" (Host_interaction.measure_width 50. = 50.)

let () =
  let failures = ref [] in
  List.iter (fun (name, test) ->
    try test (); Printf.printf "%s: OK\n%!" name
    with Failure message -> failures := message :: !failures;
      Printf.eprintf "%s: FAIL: %s\n%!" name message)
    [ "pointer layout", pointer_layout; "idle focus", idle_editor_scan;
      "editor caret", visible_caret;
      "interaction paint", interaction_repaints; "viewport markers", viewport_attributes; "hit geometry", geometry_refresh; "overlay text", overlay_glyphs;
      "unconstrained measure", unconstrained_measure ];
  if !failures <> [] then exit 1
