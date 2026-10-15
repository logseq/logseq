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

let attribute_scan_allocation () =
  let payload = String.make 1000 'x' ^ "data-window-titlebar" in
  let before = (Gc.quick_stat ()).Gc.minor_words in
  for _ = 1 to 100 do
    check "Header marker at the end was missed"
      (Host_interaction.has_attribute payload "data-window-titlebar");
    check "Missing header marker matched"
      (not (Host_interaction.has_attribute payload "missing-marker"))
  done;
  check "Attribute scans allocate a substring per character"
    ((Gc.quick_stat ()).Gc.minor_words -. before < 10000.)

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
      "hit geometry", geometry_refresh; "overlay text", overlay_glyphs;
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
  let exercise mode ~visible ~expected =
    let renders=ref 0 in
    let renderer={Lui_host.name="replay-policy";
      render=(fun _ -> incr renders;Bytes.empty)} in
    let hooks={Lui_paint.default_hooks with color_of=Lui_window.Theme.color_of;
      layout=(fun _ -> Lui_paint.placement_of_rect (Lui_scene.rect 0. 0. 100. 40.))} in
    let host=Lui_host.create ~hooks ~renderer ~width:200 ~height:100 ~scale:1. () in
    let replay=Host_interaction.memory_replay_mode ~enabled:(mode<>Some "off")
      (if mode=Some "off" then None else mode) in
    let frame visible =
      if Host_interaction.should_paint ~replay ~visible ~dirty:(Lui_host.wants_repaint host)
      then ignore (Lui_host.repaint host) in
    ignore (Lui_host.apply_batch host {generation=1;ops=[CreateNode (1,Box);
      SetProp (1,BackgroundValue,StringValue "#ff0000")]});
    for _=1 to 20 do frame visible done;
    check "Replay policy did not preserve its unchanged-scene behavior" (!renders=expected);
    ignore (Lui_host.apply_batch host {generation=2;ops=[
      SetProp (1,BackgroundValue,StringValue "#0000ff")]});
    frame true;
    check "Replay policy lost a changed scene" (!renders=expected+1);
    check "Replay policy painted stale pixels"
      (List.exists (function Lui_scene.Fill fill ->
        fill.fcolor=Lui_scene.color 0 0 255 255 | _ -> false)
        (Lui_host.scene host).Lui_scene.ops) in
  exercise None ~visible:false ~expected:20;
  exercise (Some "continuous") ~visible:false ~expected:20;
  exercise (Some "changes") ~visible:false ~expected:1;
  exercise (Some "off") ~visible:false ~expected:0;
  exercise (Some "off") ~visible:true ~expected:1;
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
