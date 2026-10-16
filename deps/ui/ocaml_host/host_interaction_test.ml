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
    (Host_interaction.has_attribute {|{"data-lazy-mount":"true"}|} "data-lazy-mount");
  List.iter (fun (payload,name,expected) ->
    check "Attribute substring scan changed its boundary semantics"
      (Host_interaction.has_attribute payload name = expected))
    ["","",true; "","x",false; "x","",true; "x","xx",false;
     "xmarker","marker",true; "markerx","marker",true;
     "mmmmarker","marker",true; "markers","markert",false]

let attribute_scan_allocation () =
  let payload = String.make 1000 'x' ^ "data-window-titlebar" in
  let before = Gc.allocated_bytes () in
  for _ = 1 to 100 do
    check "Header marker at the end was missed"
      (Host_interaction.has_attribute payload "data-window-titlebar");
    check "Missing header marker matched"
      (not (Host_interaction.has_attribute payload "missing-marker"))
  done;
  let allocated = Gc.allocated_bytes () -. before in
  Printf.printf "200 attribute scans allocated %.0f bytes\n%!" allocated;
  check (Printf.sprintf "Attribute scans allocate %.0f temporary bytes" allocated)
    (allocated < 4096.)

let viewport_cold_scan_allocation () =
  let store = Lui_store.create () in
  for id = 1 to 6000 do
    Lui_store.apply_op store (CreateNode (id, Column));
    Lui_store.apply_op store
      (SetExtensionProp (id,"attrs",StringValue {|{"data-testid":"row"}|}))
  done;
  Lui_store.apply_op store
    (SetExtensionProp (10,"attrs",StringValue {|{"data-lazy-mount":"true"}|}));
  Lui_store.apply_op store
    (SetExtensionProp (20,"data-attrs",StringValue {|{"data-virt-count":"100"}|}));
  let cache = Host_interaction.viewport_cache () in
  let traversal_before = Gc.allocated_bytes () in
  Lui_store.iter_preorder store ignore;
  let traversal_allocated = Gc.allocated_bytes () -. traversal_before in
  let before = Gc.allocated_bytes () in
  let ids = Host_interaction.viewport_candidates cache store in
  let allocated = Gc.allocated_bytes () -. before -. traversal_allocated in
  Printf.printf "6000-node viewport attribute overhead allocated %.0f bytes\n%!" allocated;
  check "Cold viewport discovery lost attribute markers" (ids=[10;20]);
  check (Printf.sprintf "Cold viewport attribute matching allocates %.0f bytes beyond traversal" allocated)
    (allocated < 524288.)

let geometry_refresh () =
  let store = Lui_store.create () in
  for id = 1 to 100 do
    Lui_store.apply_op store (CreateNode (id, if id=1 then Scroll else Column));
    if id > 1 then Lui_store.apply_op store (InsertChild (id - 1, id, 0))
  done;
  let reads = ref 0 in
  let base id = incr reads; Lui_scene.rect 0. (float (id * 10)) 100. 100. in
  let rects = Lui_window.Rects.create () in
  Host_interaction.refresh_rects ~store ~base ~scroll_x:(fun _ -> 0.)
    ~scroll_y:(fun id -> if id=1 then 5. else 0.) rects;
  check "Hit geometry refresh walks every ancestor repeatedly" (!reads <= 100);
  let child = Lui_window.Rects.get rects 2 in
  check "Scroll shifted hit geometry incorrectly" (child.y = 15.);
  let last = Lui_window.Rects.get rects 100 in
  check "Hit geometry must retain full boxes for the shared clip walk" (last.h = 100.);
  check "Offscreen descendants escaped their scroll clip"
    (not (List.mem 20 (Lui_window.hit_path store rects ~x:50. ~y:200.)))

let geometry_refresh_allocation () =
  let store = Lui_store.create () in
  for id=1 to 1000 do
    Lui_store.apply_op store (CreateNode (id, Column));
    if id>1 then Lui_store.apply_op store (InsertChild (id-1,id,0))
  done;
  let rects = Lui_window.Rects.create () in
  let bounds = Lui_scene.rect 10. 20. 100. 40. in
  let refresh () = Host_interaction.refresh_rects ~store ~base:(fun _ -> bounds)
    ~scroll_x:(fun _ -> 0.) ~scroll_y:(fun _ -> 0.) rects in
  refresh ();
  let before = Gc.allocated_bytes () in
  refresh ();
  let allocated = Gc.allocated_bytes () -. before in
  check "Geometry refresh changed unscrolled bounds"
    (Lui_window.Rects.get rects 1000=bounds);
  Printf.printf "1000-node hit geometry refresh allocated %.0f bytes\n%!" allocated;
  check "Geometry refresh allocates intermediate transforms and rectangles per node"
    (allocated <= 200000.)

let nested_geometry_refresh () =
  let store = Lui_store.create () in
  Lui_store.apply_batch store {generation=1;ops=[CreateNode (1,Scroll);
    CreateNode (2,Scroll); CreateNode (3,Column); CreateNode (4,Column);
    InsertChild (1,2,0); InsertChild (2,3,0); InsertChild (1,4,1)]};
  let root_scroll = ref true in
  let rects = Lui_window.Rects.create () in
  let base = function
    | 1 -> Lui_scene.rect 0. 0. 300. 200.
    | 2 -> Lui_scene.rect 50. 50. 200. 150.
    | 3 -> Lui_scene.rect 70. 80. 400. 500.
    | _ -> Lui_scene.rect 500. 500. 10. 10. in
  let refresh () = Host_interaction.refresh_rects ~store ~base
    ~scroll_x:(fun id ->
      check "Leaf offsets must not be queried for a nonexistent child transform" (id=1 || id=2);
      if id=1 && !root_scroll then 10. else if id=2 then 5. else 0.)
    ~scroll_y:(fun id -> if id=1 && !root_scroll then 20. else if id=2 then 7. else 0.) rects in
  refresh ();
  check "A scroll container must inherit only its ancestors' offsets"
    (Lui_window.Rects.get rects 2=Lui_scene.rect 40. 30. 200. 150.);
  check "Nested offsets must preserve full descendant bounds"
    (Lui_window.Rects.get rects 3=Lui_scene.rect 55. 53. 400. 500.);
  check "Offscreen siblings must retain full bounds for the hit walk"
    (Lui_window.Rects.get rects 4=Lui_scene.rect 490. 480. 10. 10.);
  check "The shared hit walk must reject content outside a nested scroll clip"
    (not (List.mem 3 (Lui_window.hit_path store rects ~x:280. ~y:190.)));
  root_scroll := false;
  refresh ();
  check "A new scroll frame must replace the previous inherited transform"
    (Lui_window.Rects.get rects 3=Lui_scene.rect 65. 73. 400. 500.)

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

let scroll_end () =
  let viewport = Lui_scene.rect 40. 100. 200. 300. in
  let x,y = Host_interaction.scroll_extent viewport ~right:340. ~bottom:900. in
  check "Bottom padding and leading space were omitted from scroll range"
    (x = 100. && y = 500.);
  let x,y = Host_interaction.scroll_extent viewport ~right:140. ~bottom:200. in
  check "Short content acquired a negative scroll range" (x = 0. && y = 0.)

let viewport_candidate_allocation () =
  let store = Lui_store.create () in
  for id = 1 to 6000 do Lui_store.apply_op store (CreateNode (id, Column)) done;
  Lui_store.apply_op store (SetExtensionProp (10, "attrs", StringValue "data-lazy-mount"));
  Lui_store.apply_op store (SetExtensionProp (20, "attrs", StringValue "data-virt-count"));
  let cache = Host_interaction.viewport_cache () in
  check "Viewport candidates must include lazy mounts and pagination markers"
    (Host_interaction.viewport_candidates cache store = [10;20]);
  let before = Gc.allocated_bytes () in
  for _ = 1 to 100 do ignore (Host_interaction.viewport_candidates cache store) done;
  let allocated = (Gc.allocated_bytes () -. before) /. 100. in
  check (Printf.sprintf "Scroll viewport checks allocate %.0f bytes/frame" allocated)
    (allocated < 8192.);
  Lui_store.apply_op store (SetExtensionProp (30, "attrs", StringValue "data-lazy-mount"));
  Lui_store.apply_op store (RemoveExtensionProp (10, "attrs"));
  Lui_store.apply_op store (DropNode 20);
  check "Viewport markers must follow attributes and removed nodes"
    (Host_interaction.viewport_candidates cache store = [30]);
  let other = Lui_store.create () in
  Lui_store.apply_op other (CreateNode (40, Column));
  Lui_store.apply_op other (SetExtensionProp (40, "data-attrs", StringValue "data-lazy-mount"));
  check "Viewport candidate cache must not retain a previous graph's nodes"
    (Host_interaction.viewport_candidates cache other = [40])

let pointer_hit_allocations () =
  let store = Lui_store.create () in
  Lui_store.apply_op store (CreateNode (1, Column));
  let rects = Lui_window.Rects.create () in
  Hashtbl.add rects 1 (Lui_scene.rect 0. 0. 100. 40000.);
  for id = 2 to 2001 do
    Lui_store.apply_op store (CreateNode (id, Button));
    Lui_store.apply_op store (InsertChild (1, id, id - 2));
    Lui_store.apply_op store (SetProp (id, PointerEnabled, BoolValue true));
    Hashtbl.add rects id (Lui_scene.rect 0. (float (id - 2) *. 20.) 100. 20.)
  done;
  let cache = Host_interaction.hit_cache () in
  let ui = Lui_window.Ui.create () in
  let raw_motion () =
    ignore (Lui_window.Ui.handle ui store rects (Lui_window.Input.Move (10., 10.)));
    ignore (Lui_window.hit_path store rects ~x:10. ~y:10.)
  in
  raw_motion ();
  let raw_before = Gc.allocated_bytes () in
  for _ = 1 to 10 do raw_motion () done;
  Printf.printf "unindexed pointer motion allocated %.0f bytes/event\n%!"
    ((Gc.allocated_bytes () -. raw_before) /. 10.);
  let motion () =
    let spatial = Host_interaction.hit_index cache ~store ~rects ~epoch:0 in
    ignore (Lui_window.Ui.handle ~spatial ui store rects (Lui_window.Input.Move (10., 10.)));
    check "Indexed DOM hit differs from visible button"
      (Lui_window.hit_path ~spatial store rects ~x:10. ~y:10. = [2;1])
  in
  motion ();
  let before = Gc.allocated_bytes () in
  for _ = 1 to 100 do motion () done;
  let bytes = (Gc.allocated_bytes () -. before) /. 100. in
  Printf.printf "pointer motion allocated %.0f bytes/event\n%!" bytes;
  check "Pointer hit testing exceeds 16 KiB per event" (bytes < 16384.)

let pointer_hit_invalidation () =
  let store = Lui_store.create () in
  Lui_store.apply_batch store {generation=1;ops=[CreateNode (1, Button);
    SetProp (1, PointerEnabled, BoolValue true)]};
  let rects = Lui_window.Rects.create () in
  Hashtbl.add rects 1 (Lui_scene.rect 0. 0. 20. 20.);
  let cache = Host_interaction.hit_cache () in
  let hit epoch = Lui_window.hit_path
    ~spatial:(Host_interaction.hit_index cache ~store ~rects ~epoch)
    store rects ~x:10. ~y:10. in
  check "Initial hit missing" (hit 0 = [1]);
  Hashtbl.replace rects 1 (Lui_scene.rect 50. 50. 20. 20.);
  check "Moved geometry reused a stale index" (hit 1 = []);
  Hashtbl.replace rects 1 (Lui_scene.rect 0. 0. 20. 20.);
  Lui_store.apply_op store (SetProp (1, Visible, BoolValue false));
  check "Store visibility reused a stale index" (hit 2 = []);
  let replacement = Lui_store.create () in
  Lui_store.apply_batch replacement {generation=1;ops=[CreateNode (1, Button);
    SetProp (1, PointerEnabled, BoolValue true)]};
  let spatial = Host_interaction.hit_index cache ~store:replacement ~rects ~epoch:2 in
  check "A replacement store reused a foreign index"
    (Lui_window.hit_path ~spatial replacement rects ~x:10. ~y:10. = [1])

let () =
  let failures = ref [] in
  List.iter (fun (name, test) ->
    try test (); Printf.printf "%s: OK\n%!" name
    with Failure message -> failures := message :: !failures;
      Printf.eprintf "%s: FAIL: %s\n%!" name message)
    [ "pointer layout", pointer_layout; "idle focus", idle_editor_scan;
      "editor caret", visible_caret;
      "interaction paint", interaction_repaints; "viewport markers", viewport_attributes;
      "attribute allocation", attribute_scan_allocation;
      "cold viewport allocation", viewport_cold_scan_allocation;
      "hit geometry", geometry_refresh;
      "geometry allocation", geometry_refresh_allocation;
      "nested hit geometry", nested_geometry_refresh; "overlay text", overlay_glyphs;
      "unconstrained measure", unconstrained_measure; "scroll end", scroll_end ];
  List.iter (fun test ->
    try test () with Failure message -> failures := message :: !failures;
      Printf.eprintf "pointer hit: FAIL: %s\n%!" message)
    [pointer_hit_allocations; pointer_hit_invalidation];
  if !failures <> [] then exit 1

let () = viewport_candidate_allocation (); print_endline "viewport allocation: OK"

let () =
  let store = Lui_store.create () in
  Lui_store.apply_batch store {generation=1;ops=[CreateNode (1, Column); CreateNode (2, Column);
    SetExtensionProp (1,"attrs",StringValue "data-lazy-mount");
    SetExtensionProp (2,"data-attrs",StringValue "data-virt-count") ]};
  let cache = Host_interaction.viewport_cache () in
  let lazy_fired = Hashtbl.create 2 and virt_end_fired = Hashtbl.create 2 in
  let emitted = ref [] and bottom = ref 300. in
  let check_events expected =
    emitted := [];
    Host_interaction.viewport_events cache ~store ~height:600.
      ~rect_of:(fun id -> if id=1 then Lui_scene.rect 0. 2000. 100. 100.
        else Lui_scene.rect 0. 0. 100. !bottom)
      ~lazy_fired ~virt_end_fired ~emit:(fun name id -> emitted := (name,id)::!emitted);
    check "Pagination must fire independently from lazy-mount markers"
      (List.rev !emitted = expected) in
  check_events ["virt-end",2];
  check_events [];
  bottom := 800.; check_events ["virt-end",2];
  bottom := 2000.; check_events [];
  Hashtbl.replace lazy_fired 1 ();
  Lui_store.apply_op store (DropNode 2);
  Lui_store.apply_op store (RemoveExtensionProp (1,"attrs"));
  check_events [];
  check "Removed viewport markers must not retain per-node state"
    (Hashtbl.length lazy_fired=0 && Hashtbl.length virt_end_fired=0);
  print_endline "viewport pagination: OK"

let () =
  let store = Lui_store.create () in
  Lui_store.apply_batch store {generation=1;ops=[CreateNode (1, Column);
    SetExtensionProp (1,"attrs",StringValue "data-lazy-mount") ]};
  let cache = Host_interaction.viewport_cache () in
  let lazy_fired = Hashtbl.create 1 and virt_end_fired = Hashtbl.create 1 in
  let y = ref 100. and emitted = ref [] in
  let step expected =
    emitted := [];
    Host_interaction.viewport_events cache ~store ~height:600.
      ~rect_of:(fun _ -> Lui_scene.rect 0. !y 100. 40.)
      ~lazy_fired ~virt_end_fired ~emit:(fun name id -> emitted := (name,id)::!emitted);
    check "Lazy viewport window must enter, leave, and reenter without duplicate events"
      (List.rev !emitted = expected) in
  step ["lazy-mount",1]; step [];
  y := 2000.; step ["lazy-unmount",1]; step [];
  y := 100.; step ["lazy-mount",1];
  print_endline "bounded lazy viewport: OK"

let () =
  let store = Lui_store.create () in
  Lui_store.apply_batch store {generation=1;ops=[CreateNode (1, Column);
    SetExtensionProp (1,"attrs",StringValue "data-lazy-mount");
    SetExtensionProp (1,"height",StringValue "auto")]};
  let cache = Host_interaction.viewport_cache () in
  let lazy_fired = Hashtbl.create 1 and virt_end_fired = Hashtbl.create 1 in
  let pinned = ref true and emitted = ref [] in
  let step expected =
    emitted := [];
    Host_interaction.viewport_events cache ~store ~height:600.
      ~pinned:(fun _ -> !pinned)
      ~rect_of:(fun _ -> Lui_scene.rect 0. 2000. 100. 40.)
      ~lazy_fired ~virt_end_fired ~emit:(fun name id -> emitted := (name,id)::!emitted);
    check "Warmup viewport disposal must respect mounted and pinned state"
      (List.rev !emitted=expected) in
  step [];
  pinned := false;
  step ["lazy-unmount",1];
  Lui_store.apply_op store (SetExtensionProp (1,"height",StringValue "40."));
  step [];
  print_endline "warmup viewport disposal: OK"

let () =
  let store = Lui_store.create () in
  Lui_store.apply_batch store {generation=1;ops=[CreateNode (1, Column);
    SetExtensionProp (1,"attrs",StringValue "data-lazy-mount") ]};
  let cache = Host_interaction.viewport_cache () in
  let lazy_fired = Hashtbl.create 1 and virt_end_fired = Hashtbl.create 1 in
  Hashtbl.add lazy_fired 1 ();
  let emitted = ref [] in
  Host_interaction.viewport_events ~pinned:(fun id -> id=1) cache ~store ~height:600.
    ~rect_of:(fun _ -> Lui_scene.rect 0. 2000. 100. 40.)
    ~lazy_fired ~virt_end_fired ~emit:(fun name id -> emitted := (name,id)::!emitted);
  check "Focused editor ancestors must stay mounted outside the viewport"
    (!emitted=[] && Hashtbl.mem lazy_fired 1)

let () =
  let store = Lui_store.create () in
  Lui_store.apply_batch store {generation=1;ops=[CreateNode (1, Column); CreateNode (2, Column);
    CreateNode (3, Column); CreateNode (4, Column); CreateNode (5, Column);
    SetExtensionProp (1,"events",StringValue "lazy-mount click");
    SetExtensionProp (2,"attrs",StringValue "data-lazy-mount");
    SetExtensionProp (3,"attrs",StringValue "data-lazy-mount");
    SetExtensionProp (4,"events",StringValue "click");
    SetExtensionProp (5,"attrs",StringValue "data-lazy-mount");
    InsertChild (1,2,0); InsertChild (1,3,1); InsertChild (2,4,0); InsertChild (4,5,0) ]};
  check "Nested child gates must not be batched into an unrelated row container"
    (Host_interaction.lazy_mount_groups store [2;5;3] = [1,[2;3];5,[5]]);
  check "No viewport work must produce no batches" (Host_interaction.lazy_mount_groups store []=[])

let () =
  let state = Host_interaction.presentation () and ready = ref true in
  let presented = ref [] in
  let submit (scene : Lui_scene.t) = presented := scene.ops :: !presented in
  let renderer = {Lui_host.name="controlled-presentation";
    render=(fun scene -> ignore (Host_interaction.present state ~ready:!ready ~submit scene); Bytes.empty)} in
  let hooks = {Lui_paint.default_hooks with color_of=Lui_window.Theme.color_of;
    layout=(fun _ -> Lui_paint.placement_of_rect (Lui_scene.rect 0. 0. 100. 40.))} in
  let host = Lui_host.create ~hooks ~renderer ~width:200 ~height:100 ~scale:1. () in
  ignore (Lui_host.apply_batch host {generation=1;ops=[CreateNode (1,Box);
    SetProp (1,BackgroundValue,StringValue "#ff0000")]});
  ignore (Lui_host.repaint host);
  ready := false;
  ignore (Lui_host.apply_batch host {generation=2;ops=[SetProp (1,BackgroundValue,StringValue "#0000ff")]});
  ignore (Lui_host.repaint host);
  check "A busy renderer must not count a skipped scene as presented" (List.length !presented=1);
  check "A dirty scene skipped by the GPU must retry on the next loop without new input"
    (Host_interaction.presentation_due state);
  ignore (Lui_host.apply_batch host {generation=3;ops=[SetProp (1,BackgroundValue,StringValue "#00ff00")]});
  ignore (Lui_host.repaint host);
  ready := true;
  ignore (renderer.render (Lui_host.scene host));
  check "The retry must present the latest coalesced scene"
    (List.length !presented=2 && List.hd !presented=(Lui_host.scene host).Lui_scene.ops);
  check "The submitted scene must contain the final visual update"
    (List.exists (function Lui_scene.Fill fill -> fill.fcolor=Lui_scene.color 0 255 0 255 | _ -> false)
      (List.hd !presented));
  check "A successful retry must stop immediate resubmission"
    (not (Host_interaction.presentation_due state));
  check "An unchanged idle scene must not keep GPU working resources alive"
    (not (Host_interaction.presentation_due state));
  check "A long idle interval must not resubmit an unchanged scene"
    (not (Host_interaction.presentation_due state));
  print_endline "native pending presentation: OK"

let () =
  let exercise mode ~visible ~backing ~expected =
    let renders=ref 0 in
    let renderer={Lui_host.name="replay-policy";
      render=(fun _ -> incr renders;Bytes.empty)} in
    let hooks={Lui_paint.default_hooks with color_of=Lui_window.Theme.color_of;
      layout=(fun _ -> Lui_paint.placement_of_rect (Lui_scene.rect 0. 0. 100. 40.))} in
    let host=Lui_host.create ~hooks ~renderer ~width:200 ~height:100 ~scale:1. () in
    let replay=Host_interaction.memory_replay_mode ~enabled:(mode<>Some "off")
      (if mode=Some "off" then None else mode) in
    let frame visible =
      if Host_interaction.should_paint ~replay ~visible ~backing ~dirty:(Lui_host.wants_repaint host)
      then ignore (Lui_host.repaint host) in
    ignore (Lui_host.apply_batch host {generation=1;ops=[CreateNode (1,Box);
      SetProp (1,BackgroundValue,StringValue "#ff0000")]});
    for _=1 to 20 do frame visible done;
    check (Printf.sprintf "Repaint policy visible=%b backing=%b rendered %d frames, expected %d"
      visible backing !renders expected) (!renders=expected);
    ignore (Lui_host.apply_batch host {generation=2;ops=[
      SetProp (1,BackgroundValue,StringValue "#0000ff")]});
    frame (not backing);
    check "Replay policy lost a changed scene" (!renders=expected+1);
    check "Replay policy painted stale pixels"
      (List.exists (function Lui_scene.Fill fill ->
        fill.fcolor=Lui_scene.color 0 0 255 255 | _ -> false)
        (Lui_host.scene host).Lui_scene.ops) in
  exercise None ~visible:false ~backing:false ~expected:20;
  exercise (Some "continuous") ~visible:false ~backing:false ~expected:20;
  exercise (Some "changes") ~visible:false ~backing:false ~expected:1;
  exercise (Some "off") ~visible:false ~backing:false ~expected:0;
  exercise (Some "off") ~visible:true ~backing:false ~expected:1;
  exercise (Some "off") ~visible:false ~backing:true ~expected:1;
  check "An occluded backing store cannot refresh its diagnostic overlay"
    (Host_interaction.can_render ~replay:Replay_off ~visible:false ~backing:true);
  check "An occluded onscreen renderer became eligible for presentation"
    (not (Host_interaction.can_render ~replay:Replay_off ~visible:false ~backing:false));
  List.iter (fun (enabled,mode) ->
    let rejected=try ignore (Host_interaction.memory_replay_mode ~enabled (Some mode));false
      with Invalid_argument _ -> true in
    check "Invalid replay configuration was silently accepted" rejected)
    [true,"unknown";false,"changes"];
  print_endline "native replay painting policy: OK"

let () =
  let cache = Host_interaction.overlay_cache () in
  let scene = Lui_scene.create
    ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:32 ~h:32)
    ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:32 ~h:32) in
  let glyph = {Lui_scene.gx=1.;gy=2.;gw=3.;gh=4.;gu=0;gv=0;guw=3;gvh=4;
    gcolor=Lui_scene.color 0 0 0 255;gwide=0;gcolored=false;gsubpixel=false;gthin=false} in
  let draws = ref 0 in
  let draw () =
    incr draws;
    let base = List.length scene.glyphs in
    scene.glyphs <- {glyph with gx=99.} :: scene.glyphs;
    [Lui_scene.Glyphs {gstart=base;gend=base+1;gpaint=Lui_scene.Solid;
      gcolor=glyph.gcolor;gcolor2=glyph.gcolor;ggradient=(0.,0.,0.,0.);gwide2=0;gopacity=1.}] in
  let frame key body =
    scene.glyphs <- body;
    let ops = Host_interaction.overlay_cached cache ~key scene draw in
    check "Cached overlay must preserve the body's glyphs"
      (List.length scene.glyphs=List.length body+1 && (List.hd scene.glyphs).gx=99.);
    ops in
  let first = frame 1 [glyph] in
  for _=1 to 100 do
    check "Cached overlay changed glyph indices" (frame 1 [{glyph with gx=5.}]=first)
  done;
  check "Pointer repaint must not reshape unchanged metrics on every frame" (!draws=1);
  ignore (frame 2 [glyph]);
  check "A new metrics sample must refresh the overlay" (!draws=2);
  ignore (frame 2 [glyph;glyph]);
  check "Changed body glyph count must relocate cached glyph indices without reshaping" (!draws=2);
  (match frame 2 [glyph;glyph] with
   | [Lui_scene.Glyphs range] -> check "Relocated overlay points at the wrong glyphs"
       (range.gstart=2 && range.gend=3)
   | _ -> failwith "Overlay lost its text operation");
  let prior = List.hd scene.glyphs in
  ignore (frame 3 [glyph;glyph]);
  check "Unchanged glyph geometry lost its identity after an updated sample"
    (List.hd scene.glyphs == prior);
  ignore (frame 3 []);
  (match frame 3 [] with
   | [Lui_scene.Glyphs range] -> check "Overlay cannot relocate to an empty body"
       (range.gstart=0 && range.gend=1)
   | _ -> failwith "Empty body lost overlay text");
  print_endline "native metrics overlay reuse: OK"


let () =
  let glyph = {Lui_scene.gx=1.;gy=2.;gw=3.;gh=4.;gu=0;gv=0;guw=3;gvh=4;
    gcolor=Lui_scene.color 0 0 0 255;gwide=0;gcolored=false;gsubpixel=false;gthin=false} in
  let exercise body budget =
    let scene = Lui_scene.create
      ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:32 ~h:32)
      ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:32 ~h:32) in
    let cache = Host_interaction.overlay_cache () in
    let stable = List.init 999 (fun index -> {glyph with gx=float index}) in
    let variants = Array.init 2 (fun index ->
      ({glyph with gx=float (1000+index)} :: stable) @ body) in
    let frame sample =
      scene.glyphs <- body;
      ignore (Host_interaction.overlay_cached cache ~key:sample scene (fun () ->
        scene.glyphs <- variants.(sample mod 2); [])) in
    frame 0;
    let before = Gc.allocated_bytes () in
    for sample=1 to 100 do frame sample done;
    let allocated = (Gc.allocated_bytes () -. before) /. 100. in
    Printf.printf "native sampled overlay body=%d allocated %.0f bytes/frame\n%!"
      (List.length body) allocated;
    check "A metrics sample copied unchanged overlay glyph lists repeatedly"
      (allocated <= budget);
    check "Sampled overlay lost its body or reordered glyphs"
      (scene.glyphs = variants.(0));
    let replacement = [{glyph with gx=(-5.)}; glyph] in
    scene.glyphs <- replacement;
    ignore (Host_interaction.overlay_cached cache ~key:100 scene (fun () ->
      failwith "A changed body reshaped an unchanged overlay"));
    check "Overlay reused stale body glyphs"
      (List.length scene.glyphs=1002 && List.nth scene.glyphs 1000 == List.hd replacement) in
  exercise [] 4096.;
  exercise [glyph] 32768.;
  let scene = Lui_scene.create
    ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:32 ~h:32)
    ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:32 ~h:32) in
  scene.glyphs <- [glyph];
  let rejected = try
    ignore (Host_interaction.overlay_cached (Host_interaction.overlay_cache ())
      ~key:0 scene (fun () -> scene.glyphs <- []; [])); false
    with Invalid_argument _ -> true in
  check "An overlay draw discarded the scene body without failing" rejected;
  print_endline "native sampled overlay allocation: OK"

let () =
  let store = Lui_store.create () in
  List.iter (Lui_store.apply_op store) [CreateNode (1,Column);
    CreateNode (2,Text); CreateNode (3,Column); CreateNode (4,Text);
    CreateNode (5,Text); CreateNode (6,Column);
    InsertChild (1,2,0); InsertChild (1,3,1); InsertChild (3,4,0)];
  let negative = Lui_scene.rect (-10.) (-5.) 4. 10.
  and positive = Lui_scene.rect 20. 10. 30. 5.
  and empty = Lui_scene.rect 0.5 1. 0. 0.
  and outside = Lui_scene.rect 9999. 9999. 9999. 9999. in
  let rect_of = function 2 -> negative | 3 -> positive | 4 -> empty | _ -> outside in
  check "Content bounds include the root or an unrelated tree"
    (Host_interaction.content_bounds ~store ~rect_of 1 = (-10.,-5.,50.,15.));
  let l,t,r,b = Host_interaction.content_bounds ~store ~rect_of 6 in
  check "An empty content region changed its sentinel bounds"
    (l=Float.max_float && t=Float.max_float && r = -.Float.max_float && b = -.Float.max_float);
  let large = Lui_store.create () in
  Lui_store.apply_op large (CreateNode (1,Column));
  for id=2 to 1001 do
    Lui_store.apply_op large (CreateNode (id,Text));
    Lui_store.apply_op large (InsertChild (1,id,id-2))
  done;
  let rect_of _ = positive in
  ignore (Host_interaction.content_bounds ~store:large ~rect_of 1);
  let before = Gc.allocated_bytes () in
  for _=1 to 50 do ignore (Host_interaction.content_bounds ~store:large ~rect_of 1) done;
  let bounds_allocated = (Gc.allocated_bytes () -. before) /. 50. in
  let epoch = ref 0 in
  let offsets = Hashtbl.create 4 in
  let scroll_x id = match Hashtbl.find_opt offsets id with Some (x,_) -> x | None -> 0.
  and scroll_y id = match Hashtbl.find_opt offsets id with Some (_,y) -> y | None -> 0. in
  let shift = Host_interaction.scroll_shifts ~store:(fun () -> large)
    ~scroll_epoch:(fun () -> !epoch) ~scroll_x ~scroll_y in
  let before = Gc.allocated_bytes () in
  for id=2 to 1001 do ignore (shift id) done;
  let cold_allocated = Gc.allocated_bytes () -. before in
  let before = Gc.allocated_bytes () in
  for _=1 to 10 do for id=2 to 1001 do ignore (shift id) done done;
  let cached_allocated = (Gc.allocated_bytes () -. before) /. 10_000. in
  Hashtbl.add offsets 1 (10.,20.); incr epoch;
  check "Scroll cache ignores a changed scroll epoch" (shift 2 = (10.,20.));
  check "A node's own scroll offset shifts its border box" (shift 1 = (0.,0.));
  Hashtbl.add offsets 2 (3.,4.); incr epoch;
  List.iter (Lui_store.apply_op large) [CreateNode (1002,Text); InsertChild (2,1002,0)];
  check "Nested scroll offsets do not accumulate" (shift 1002 = (13.,24.));
  List.iter (Lui_store.apply_op large) [CreateNode (2000,Column); MoveChild (2000,1002,0)];
  check "A reparented node retains the prior ancestor offsets" (shift 1002 = (0.,0.));
  Lui_store.apply_op large (CreateNode (3000,Column));
  for id=3001 to 3064 do
    Lui_store.apply_op large (CreateNode (id,Column));
    Lui_store.apply_op large (InsertChild (id-1,id,0))
  done;
  Hashtbl.add offsets 3000 (2.,3.);
  Hashtbl.add offsets 3032 (-5.,7.);
  Hashtbl.add offsets 3064 (900.,900.); incr epoch;
  check "A deep scroll chain loses or includes the wrong offsets" (shift 3064 = (-3.,10.));
  check "An intermediate scroll viewport includes its own offset" (shift 3032 = (2.,3.));
  Printf.printf "Content bounds allocated %.0f bytes/read; cold scroll %.0f bytes/1000 nodes; cached scroll %.3f bytes/read\n%!"
    bounds_allocated cold_allocated cached_allocated;
  let failures = List.filter_map (fun (message,passed) -> if passed then None else Some message)
    ["Content bounds exceed 2 KiB per read", bounds_allocated <= 2048.;
     "Cold zero-scroll traversal exceeds 64 KiB", cold_allocated <= 65_536.;
     "Cached scroll reads exceed one byte per read", cached_allocated <= 1.] in
  check (String.concat "; " failures) (failures=[])


let () =
  let failures = ref [] in
  let expect message value = if not value then failures := message :: !failures in
  let ui = Lui_window.Ui.create () in
  let host = Lui_host.create ~layout:(module Lui_layout)
      ~hooks:Lui_paint.default_hooks
      ~renderer:{name="motion-test";render=(fun _ -> Bytes.empty)}
      ~width:800 ~height:600 ~scale:1. () in
  let store = Lui_host.store host in
  let apply ops = ignore (Lui_host.apply_batch host {generation=1;ops}) in
  let step ?(reduced_motion=false) now =
    Host_interaction.advance_frame ui host ~now ~reduced_motion;
    Host_interaction.prepare_paint ui host;
    ignore (Lui_host.repaint host);
    Lui_window.Ui.frame_done ui in
  let value () = Option.get (Lui_store.float_prop store 1 "value") in
  let width () = (Option.get (Lui_host.layout_rect host 2)).Lui_scene.w in
  apply [CreateNode (1,Split);CreateNode (2,Column);CreateNode (3,Column);
    SetProp (1,Gap,IntValue 3);SetProp (1,ResizeDuration,IntValue 300);
    SetProp (1,ResizeEasing,StringValue "standard");
    SetProp (1,ProgressValue,FloatValue 0.0001);
    InsertChild (1,2,0);InsertChild (1,3,1)];
  step 0.;
  let closed_width = width () in
  (* Begin input after a long quiet interval, as the blocking app loop does. *)
  Host_interaction.advance_frame ui host ~now:600. ~reduced_motion:false;
  apply [SetProp (1,ProgressValue,FloatValue 0.25)];
  step 600.;
  expect "Opening a sidebar jumps to its target on the input frame" (Float.abs (value () -. 0.0001) < 1.e-9);
  step 600.15;
  let halfway = value () and halfway_width = width () in
  expect "The app frame path does not advance sidebar interpolation"
    (halfway>0.0001 && halfway<0.25 && halfway_width>closed_width);
  apply [SetProp (1,ProgressValue,FloatValue 0.0001)];
  expect "Reversing a sidebar jumps away from displayed geometry" (value ()=halfway);
  step 600.46;
  expect "Closing a sidebar fails to settle exactly" (value ()=0.0001 && width ()=closed_width);
  expect "A completed sidebar transition keeps scheduling frames" (not (Lui_host.wants_repaint host));
  apply [SetProp (1,ProgressValue,FloatValue 0.75)];
  step 600.77;
  Host_interaction.advance_frame ui host ~now:601. ~reduced_motion:false;
  apply [SetProp (1,ProgressValue,FloatValue 1.)];
  step 601.15;
  expect "The right sidebar does not animate toward its collapsed endpoint" (value ()>0.75 && value ()<1.);
  step 601.31;
  expect "The right sidebar does not reach its collapsed endpoint" (value ()=1.);
  (* Pointer resize mirrors the direct value before the application echoes it. *)
  Lui_store.apply_op store (SetProp (1,ProgressValue,FloatValue 0.6));
  apply [SetProp (1,ProgressValue,FloatValue 0.6)];
  step 601.32;
  expect "Direct split drag creates eased catch-up" (value ()=0.6 && not (Lui_host.wants_repaint host));
  Host_interaction.advance_frame ui host ~now:602. ~reduced_motion:true;
  apply [SetProp (1,ProgressValue,FloatValue 0.2)];
  step ~reduced_motion:true 602.;
  expect "The application ignores the reduced-motion preference" (value ()=0.2);
  Host_interaction.advance_frame ui host ~now:603. ~reduced_motion:false;
  apply [SetProp (1,ProgressValue,FloatValue 0.8)];
  step 603.1;
  step ~reduced_motion:true 603.11;
  expect "Enabling reduced motion leaves an active transition" (value ()=0.8 && not (Lui_host.wants_repaint host));
  apply [SetProp (1,ProgressValue,FloatValue 0.1);DropNode 1];
  step ~reduced_motion:true 604.;
  expect "Removing a split leaves scheduled motion" (not (Lui_host.wants_repaint host));
  List.iter prerr_endline (List.rev !failures);
  check "Native frame-clock regression" (!failures=[]);
  print_endline "native sidebar animation frame clock: OK"


let () =
  let ui=Lui_window.Ui.create () in
  let host=Lui_host.create ~layout:(module Lui_layout) ~hooks:Lui_paint.default_hooks
    ~renderer:{name="split-input-test";render=(fun _ -> Bytes.empty)}
    ~width:800 ~height:600 ~scale:1. () in
  let store=Lui_host.store host and rects=Lui_window.Rects.create () in
  let apply ops=ignore (Lui_host.apply_batch host {generation=1;ops}) in
  let step now =
    Host_interaction.advance_frame ui host ~now ~reduced_motion:false;
    Host_interaction.prepare_paint ui host;
    ignore (Lui_host.repaint host);
    List.iter (fun id -> Hashtbl.replace rects id (Option.get (Lui_host.layout_rect host id))) [1;2;3];
    Lui_window.Ui.frame_done ui in
  apply [CreateNode (1,Split);CreateNode (2,Column);CreateNode (3,Column);
    SetProp (1,Gap,IntValue 3);SetProp (1,ResizeDuration,IntValue 300);
    SetProp (1,ResizeEasing,StringValue "standard");SetProp (1,ProgressValue,FloatValue 0.25);
    InsertChild (1,2,0);InsertChild (1,3,1)];
  step 0.;
  apply [SetProp (1,ProgressValue,FloatValue 0.5)];
  step 0.1;
  let before=Option.get (Lui_store.float_prop store 1 "value") in
  let first=Option.get (Lui_host.layout_rect host 2) in
  let x=first.Lui_scene.x+.first.w+.1.5 in
  ignore (Lui_window.Ui.handle ui store rects
    (Lui_window.Input.Button_down (x,100.,Lui_window.Input.Left,1,Lui_window.Input.mods_none)));
  let actions=Lui_window.Ui.handle ui store rects (Lui_window.Input.Move (x+.40.,100.)) in
  let fraction=List.find_map (function
    | Lui_window.Dispatch (ValueChanged (1,value)) -> Some value
    | _ -> None) actions in
  check "Native split dragging emits no application resize feedback" (Option.is_some fraction);
  let fraction=Option.get fraction in
  check "Native split dragging does not mirror pointer geometry immediately"
    (Float.abs (fraction-.before-.0.05)<1.e-6
      && Lui_store.float_prop store 1 "value"=Some fraction);
  apply [SetProp (1,ProgressValue,FloatValue fraction)];
  step 0.11;
  check "An interrupted sidebar animation continues fighting the pointer"
    (Lui_store.float_prop store 1 "value"=Some fraction && not (Lui_host.wants_repaint host));
  print_endline "native split drag interrupts sidebar motion: OK"


let () =
  let store=Lui_store.create () and rects=Lui_window.Rects.create () in
  List.iter (Lui_store.apply_op store)
    [CreateNode (1,Split);CreateNode (2,Column);CreateNode (3,Column);
     CreateNode (4,Button);CreateNode (5,TextField);SetProp (1,ProgressValue,FloatValue 0.25);
     InsertChild (1,2,0);InsertChild (1,3,1);InsertChild (2,4,0);InsertChild (3,5,0)];
  List.iter (fun (id,r) -> Hashtbl.add rects id r)
    [1,Lui_scene.rect 0. 0. 800. 600.;2,Lui_scene.rect 0. 0. 200. 600.;
     3,Lui_scene.rect 203. 0. 597. 600.;4,Lui_scene.rect 40. 40. 40. 24.;
     5,Lui_scene.rect 240. 40. 160. 24.];
  let ui=Lui_window.Ui.create () in
  let input ev=ignore (Lui_window.Ui.handle ui store rects ev) in
  let cursor id=Host_interaction.pointer_cursor ui store rects id in
  let failures=ref [] in
  let expect message value=if not value then failures:=message::!failures in
  input (Lui_window.Input.Move (201.,50.));
  expect "A split divider has no horizontal resize cursor" (cursor 1="col-resize");
  input (Lui_window.Input.Move (100.,50.));
  expect "A pane inherits a resize cursor outside the divider" (cursor 2="default");
  expect "A split ancestor hides a button cursor" (cursor 4="pointer");
  expect "A split ancestor hides a text cursor" (cursor 5="text");
  input (Lui_window.Input.Button_down (201.,50.,Lui_window.Input.Left,1,Lui_window.Input.mods_none));
  input (Lui_window.Input.Move (300.,50.));
  expect "Captured resize loses its cursor outside the divider" (cursor 5="col-resize");
  input (Lui_window.Input.Button_up (300.,50.,Lui_window.Input.Left,Lui_window.Input.mods_none));
  expect "Released resize retains its captured cursor" (cursor 5="text");
  List.iter (Lui_store.apply_op store)
    [CreateNode (6,Popover);CreateNode (7,Box);InsertChild (2,6,1);InsertChild (6,7,0)];
  input (Lui_window.Input.Move (201.,50.));
  expect "Popup content inherits a divider cursor from a background split" (cursor 7="default");
  Lui_store.apply_op store (SetProp (5,Cursor,StringValue "pointer"));
  expect "An explicit cursor property is ignored" (cursor 5="pointer");
  List.iter prerr_endline (List.rev !failures);
  check "Native split cursor regression" (!failures=[]);
  print_endline "native split resize cursor: OK"
