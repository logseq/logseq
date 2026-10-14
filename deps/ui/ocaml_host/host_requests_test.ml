open Lui_protocol

let check message condition = if not condition then failwith message

let () =
  let store = Lui_store.create () in
  Lui_store.apply_op store (CreateNode (1, Text));
  let text = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" in
  Lui_store.apply_op store (SetProp (1, TextValue, StringValue text));
  let rect = Lui_scene.rect 100. 200. 180. 200. in
  let ui = Lui_window.Ui.create () in
  let scene = Lui_scene.create
    ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:64 ~h:64)
    ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:64 ~h:64) in
  let engine = Text_engine.create ~scene:(fun () -> scene) ~scale:(fun () -> 2.)
    ~store:(fun () -> store) in
  let env : Host_requests.env =
    { store; ui; rects=Lui_window.Rects.create (); rect_of=(fun _ -> rect);
      scale=(fun () -> 2.); measure=(Text_engine.measure_text engine);
      text_layout=(fun id s -> Text_engine.text_layout engine id rect s);
      apply_batch=(fun _ -> ()); apply_actions=(fun _ -> ());
      set_ime_rect=(fun _ -> ()); focused_text_input=(fun _ -> ());
      repaint=(fun () -> ()) } in
  let ctx : Host_requests.ed_ctx =
    {sink=2; ox=100.; oy=200.; runs=[|0,String.length text|]; nodes=[|1|]} in
  let x,y,h = Host_requests.caret_rect env ctx (String.length text) in
  check "Wrapped caret must be on the final visual line" (y > 0.);
  check "Wrapped caret must fit the run width" (x <= rect.w);
  check "Caret must cover one line" (h > 0. && h < rect.h);
  check "Clicking the wrapped end must return the final byte offset"
    (Host_requests.offset_at env ctx (int_of_float (x +. 1.))
       (int_of_float (y +. h /. 2.)) = String.length text);
  let layout,_,_ = env.text_layout 1 text in
  check "Line ranges must describe every visual line"
    (List.length (String.split_on_char ';' (Host_requests.line_ranges env ctx))
       = Array.length layout.Lui_text.lay_lines);
  let pending,_,_ = Text_engine.text_layout engine 1 (Lui_scene.rect 0. 0. 0. 0.) text in
  check "Pending layout wraps each character into its own visual line"
    (Array.length pending.Lui_text.lay_lines = 1);
  Lui_store.apply_op store (SetProp (1, WhiteSpace, StringValue "nowrap"));
  let single,_,_ = env.text_layout 1 text in
  check "No-wrap sidebar text became multiple visual lines after resize"
    (Array.length single.Lui_text.lay_lines = 1);
  let _,measured_height = Text_engine.measure_text ~width:rect.w engine 1 text in
  check "No-wrap measurement disagreed with painted text"
    (abs_float (measured_height -. single.lay_height *. 2.) < 0.01);
  Lui_store.apply_op store (SetProp (1, TextOverflow, StringValue "ellipsis"));
  scene.glyphs <- [];
  ignore (Text_engine.text_ops engine 1 rect (Lui_scene.color 0 0 0 255) text);
  check "Ellipsized sidebar text escaped its resized bounds"
    (scene.glyphs <> [] && List.for_all (fun g ->
       g.Lui_scene.gx +. g.gw <= rect.x +. rect.w +. 2.) scene.glyphs);
  List.iter (Lui_store.apply_op store)
    [CreateNode (10, Column); CreateExtension (20, "logseq-editor", "test");
     InsertChild (10,20,0); SetExtensionProp (20,"block-id",StringValue "block")];
  Lui_window.Ui.set_focused ui store 20;
  List.iter (Lui_store.apply_op store)
    [DropNode 20; CreateExtension (21,"logseq-editor","test");
     InsertChild (10,21,0); SetExtensionProp (21,"block-id",StringValue "block")];
  Host_requests.ensure_ed_focus_ env;
  check "Remounted editor must own the next input before frame cleanup"
    (Lui_window.Ui.focused ui = 21);
  for id=1000 to 2000 do Lui_store.apply_op store (CreateNode (id,Column)) done;
  ignore (Host_requests.ed_ctx env "block");
  let before = (Gc.quick_stat ()).Gc.minor_words in
  for _=1 to 100 do ignore (Host_requests.ed_ctx env "block") done;
  check "Idle caret lookups must not walk and allocate the entire store"
    ((Gc.quick_stat ()).Gc.minor_words -. before < 10000.);
  let moved_env = {env with rect_of=(fun _ -> Lui_scene.rect 120. 260. 180. 200.)} in
  (match Host_requests.ed_ctx moved_env "block" with
   | Some ctx -> check "Cached editor context must follow scroll geometry" (ctx.ox=120. && ctx.oy=260.)
   | None -> failwith "Editor context disappeared");
  print_endline "native editor wrapped geometry: OK"

let () = Native_embed.with_entry_lock (fun () ->
  Platform.install_ui_services ~assert_owner:Native_embed.assert_entry_owner
    ~request_flush:Runtime.flush ~dom:Ui_dom_native.ops
    ~timers:Ui_dom_native.timers ~files:Ui_dom_native.files;
  let store = Lui_store.create () in
  let backend = {backend_profile=profile MacOS GenericHost;
    apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
  let registry = Lui_extension.registry () in
  Logseq_el.register_all registry;
  Logseq_codemirror.register registry;
  Logseq_editor.register registry;
  let app = Lui_app.create_with_extensions backend registry Model.initial
      (fun model _ -> model) (fun _ model _ -> Chrome.shell model) in
  ignore (Lui_app.start app);
  ignore (Lui_app.flush app);
  let layout = Lui_layout.create () in
  let root = List.find (fun id ->
    Lui_store.string_prop store id "accessibility-identifier"
      = Some "app-container-wrapper") (Lui_store.preorder store) in
  let scroll = List.find (fun id -> Lui_store.kind store id = "scroll")
      (Lui_store.preorder store) in
  List.iter (Lui_store.apply_op store)
    [CreateNode (100000, Box); SetProp (100000, HeightValue, IntValue 4000);
     InsertChild (scroll, 100000, 0)];
  List.iter (fun (width,height) ->
    Lui_layout.sync ~scale:2. ~width ~height layout store;
    let root_rect = Option.get (Lui_layout.rect layout root) in
    let scroll_rect = Option.get (Lui_layout.rect layout scroll) in
    check (Printf.sprintf "Resized shell escaped its %.0fx%.0f viewport" width height)
      (root_rect.w <= width && root_rect.h <= height);
    check "Scroll viewport consumed the header or document extent"
      (scroll_rect.h > 0. && scroll_rect.h <= height -. 96.))
    [2880.,1800.; 1280.,900.; 2000.,1200.; 800.,600.; 2880.,1800.];
  ignore (Lui_app.dispose app);
  print_endline "native shell resize bounds: OK")

let () = Native_embed.with_entry_lock (fun () ->
  let store = Lui_store.create () in
  let backend = {backend_profile=profile MacOS GenericHost;
    apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
  let registry = Lui_extension.registry () in
  Logseq_editor.register registry;
  let model = Edit_model.set_lines (Edit_model.create "good")
      [0,1; 1,2; 2,3; 3,4] in
  let app = Lui_app.create_with_extensions backend registry model
      (fun _ next -> next)
      (fun context model _ ->
        let frame = Signal.state context.Lui_ui.ui_scheduler Edit_input.empty_frame in
        Edit_view.view ~model ~frame:(Signal.value frame) ~block_id:"regression"
          ~on_input:(fun _ -> ()) ~cls:"") in
  ignore (Lui_app.start app);
  ignore (Lui_app.flush app);
  let layout = Lui_layout.create () in
  let scene = Lui_scene.create
      ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:64 ~h:64)
      ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:64 ~h:64) in
  let engine = Text_engine.create ~scene:(fun () -> scene) ~scale:(fun () -> 2.)
      ~store:(fun () -> store) in
  Lui_layout.sync ~scale:2. ~width:1200. ~height:600.
    ~measure:(fun id text width _ -> Some (Text_engine.measure_text ~width engine id text))
    layout store;
  let baselines = List.filter_map (fun id ->
    match Lui_store.string_prop store id "text", Lui_layout.rect layout id with
    | Some text, Some rect when text <> "" && text <> "\226\128\139" ->
      let lines,_,y = Text_engine.text_layout engine id rect text in
      Some (y,Array.length lines.Lui_text.lay_lines)
    | _ -> None) (Lui_store.preorder store) in
  check "Native editor reused stale visual breaks as explicit paragraph breaks"
    (baselines <> [] && List.for_all (fun (y,count) ->
       y = fst (List.hd baselines) && count=1) baselines);
  ignore (Lui_app.dispose app);
  print_endline "native editor logical line reflow: OK")

let () = Native_embed.with_entry_lock (fun () ->
  let store = Lui_store.create () in
  let backend = {backend_profile=profile MacOS GenericHost;
    apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
  let app = Lui_app.create backend Model.initial (fun model _ -> model)
      (fun context _ _ ->
        Left_sidebar_view.nav_link ~sched:context.Lui_ui.ui_scheduler
          ~key:"resize-nav" ~class_:"test-nav" ~active:false ~title:"Flashcards"
          ~icon_name:"cards" ~on_click:(fun () -> ()) ()) in
  ignore (Lui_app.start app);
  ignore (Lui_app.flush app);
  let label = List.find (fun id -> Lui_store.string_prop store id "text" = Some "Flashcards")
      (Lui_store.preorder store) in
  let scene = Lui_scene.create
      ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:64 ~h:64)
      ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:64 ~h:64) in
  let engine = Text_engine.create ~scene:(fun () -> scene) ~scale:(fun () -> 2.)
      ~store:(fun () -> store) in
  let layout,_,_ = Text_engine.text_layout engine label (Lui_scene.rect 0. 0. 30. 64.) "Flashcards" in
  check "Narrow sidebar navigation wraps outside its fixed-height row"
    (Array.length layout.Lui_text.lay_lines = 1);
  ignore (Lui_app.dispose app);
  print_endline "native navigation resize: OK")

let lazy_row_extent mode = Native_embed.with_entry_lock (fun () ->
  let store = Lui_store.create () in
  let rendered = ref 0 and last_resource = ref None in
  let backend = {backend_profile=profile MacOS GenericHost;
    apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
  let registry = Lui_extension.registry () in
  Logseq_el.register_all registry;
  Logseq_codemirror.register registry;
  let app = Lui_app.create_with_extensions backend registry Model.initial (fun model _ -> model)
    (fun context _ _ ->
      let render _ context parent =
        incr rendered;
        let resource = ref (String.make 4096 'x') and weak = Weak.create 1 in
        Weak.set weak 0 (Some resource); last_resource := Some weak;
        Logseq_el.el ~events:"resource-check"
          ~on_dom_event:(fun _ _ -> ignore (Sys.opaque_identity resource))
          [Lui_elements.column ~height:40
            [Lui_elements.text ~value:"row" []; Lui_elements.box ~height:12 []]] context parent in
      if mode=2 then Lazy_children.lazy_rows
        ~key:(fun id -> "extent-row-" ^ string_of_int id) ~cmp:String.compare
        ~mount:(fun _ -> render 0) ~estimate_height:(fun _ -> 64.)
        ~source:(Signal.constant context.Lui_ui.ui_scheduler (List.init 10 Fun.id))
      else if mode=3 then Lui_elements.column (List.init 10 (fun id ->
        Lazy_children.lazy_children ~key:(string_of_int id)
          ~uuid:("extent-children-" ^ string_of_int id) ~min_height:64.
          ~render:(fun () -> render 0)))
      else if mode=1 then Virt_list.rows_sig ~initial_rows:3 ~estimate_size:(fun _ -> 64.)
        ~key:string_of_int ~cmp:String.compare ~mount:(fun _ -> render 0)
        (Signal.constant context.Lui_ui.ui_scheduler (List.init 10 Fun.id))
      else Virt_list.list ~initial_rows:3 ~estimate_size:(fun _ -> 64.)
        ~key_of:string_of_int ~render (Array.init 10 Fun.id)) in
  ignore (Lui_app.start app); ignore (Lui_app.flush app);
  check "Lazy list must initially render only its warmup rows" (!rendered=(if mode>=2 then 0 else 3));
  let layout = Lui_layout.create () in
  Lui_layout.sync ~width:800. ~height:600. layout store;
  let markers = List.filter (fun id ->
    match Lui_store.string_prop store id "attrs" with
    | Some attrs -> Host_interaction.has_attribute attrs "data-lazy-mount"
    | None -> false) (Lui_store.preorder store) in
  check "All deferred rows must retain their estimated scroll extent"
    (List.length markers=(if mode>=2 then 10 else 7) && List.for_all (fun id ->
      match Lui_layout.rect layout id with Some rect -> rect.h=64. | None -> false) markers);
  let last = List.hd (List.rev markers) in
  check "Offscreen lazy rows must not collapse into the first viewport"
    ((Option.get (Lui_layout.rect layout last)).y >= 504.);
  let first = List.hd markers in
  Platform.emit_event "lazy-mount" (Js.Json.JObject ["nodeId",Js.Json.JNumber (float first)]);
  ignore (Lui_app.flush app);
  Lui_layout.sync ~width:800. ~height:600. layout store;
  check "Lazy mount must replace its estimate with the actual row height"
    (!rendered=(if mode>=2 then 1 else 4) && (Option.get (Lui_layout.rect layout first)).h=40.);
  let mounted_nodes = Lui_store.node_count store in
  let released = Option.get !last_resource in
  Platform.emit_event "lazy-unmount" (Js.Json.JObject
    ["nodeId",Js.Json.JNumber (float first); "height",Js.Json.JNumber 40.]);
  ignore (Lui_app.flush app);
  Lui_layout.sync ~width:800. ~height:600. layout store;
  check "Offscreen lazy rows must unmount content while preserving their measured extent"
    (Lui_store.node_count store < mounted_nodes
     && (Option.get (Lui_layout.rect layout first)).h=40.);
  Gc.full_major ();
  check "Leaving the viewport must release row-owned resources" (not (Weak.check released 0));
  Platform.emit_event "lazy-mount" (Js.Json.JObject ["nodeId",Js.Json.JNumber (float first)]);
  ignore (Lui_app.flush app);
  check "Returning to a row must remount its content"
    (!rendered=(if mode>=2 then 2 else 5));
  Gc.full_major ();
  let before = (Gc.stat ()).Gc.live_words in
  for _ = 1 to 100 do
    Platform.emit_event "lazy-unmount" (Js.Json.JObject
      ["nodeId",Js.Json.JNumber (float first); "height",Js.Json.JNumber 40.]);
    ignore (Lui_app.flush app);
    Platform.emit_event "lazy-mount" (Js.Json.JObject ["nodeId",Js.Json.JNumber (float first)]);
    ignore (Lui_app.flush app)
  done;
  Gc.full_major ();
  let retained_bytes = ((Gc.stat ()).Gc.live_words - before) * (Sys.word_size / 8) in
  Printf.printf "lazy mode=%d retained_bytes_after_100_cycles=%d\n%!" mode retained_bytes;
  check "Repeated viewport crossings must not retain unmounted UI trees" (retained_bytes < 1048576);
  ignore (Lui_app.dispose app))

let () = Native_embed.with_entry_lock (fun () ->
  let mount_dispose () =
    let weak = Weak.create 1 in
    let resource = ref (String.make 1024 'x') in
    Weak.set weak 0 (Some resource);
    let store = Lui_store.create () in
    let backend = {backend_profile=profile MacOS GenericHost;
      apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
    let registry = Lui_extension.registry () in
    Logseq_el.register_all registry; Logseq_codemirror.register registry;
    let app = Lui_app.create_with_extensions backend registry Model.initial (fun model _ -> model)
      (fun _ _ _ -> Logseq_el.el ~events:"lazy-mount"
        ~on_dom_event:(fun _ _ -> ignore (Sys.opaque_identity resource)) []) in
    ignore (Lui_app.start app); ignore (Lui_app.flush app);
    check "Mounted event handler must retain its resources" (Weak.check weak 0);
    ignore (Lui_app.dispose app);
    weak in
  let weak = mount_dispose () in
  Gc.full_major ();
  check "Disposed native event handlers retain their captured UI resources"
    (not (Weak.check weak 0));
  print_endline "native DOM handler disposal: OK")

let () = Native_embed.with_entry_lock (fun () ->
  let store = Lui_store.create () in
  let backend = {backend_profile=profile MacOS GenericHost;
    apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
  let registry = Lui_extension.registry () in
  Logseq_el.register_all registry; Logseq_codemirror.register registry; Logseq_editor.register registry;
  let app = Lui_app.create_with_extensions backend registry Model.initial (fun model _ -> model)
    (fun context _ _ -> Page.journals_view_ms
      (Signal.constant context.Lui_ui.ui_scheduler Model.initial)) in
  ignore (Lui_app.start app); ignore (Lui_app.flush app);
  check "Short journals lists must retain their pagination endpoint"
    (List.exists (fun id -> match Lui_store.string_prop store id "attrs" with
      | Some attrs -> Host_interaction.has_attribute attrs "data-virt-count" | None -> false)
      (Lui_store.preorder store));
  ignore (Lui_app.dispose app);
  print_endline "native short journals pagination: OK")

let () = Native_embed.with_entry_lock (fun () ->
  let mount_dispose () =
    let weak = Weak.create 1 in
    let store = Lui_store.create () in
    let backend = {backend_profile=profile MacOS GenericHost;
      apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
    let registry = Lui_extension.registry () in
    Logseq_el.register_all registry; Logseq_codemirror.register registry;
    let app = Lui_app.create_with_extensions backend registry Model.initial (fun model _ -> model)
      (fun context _ _ ->
        Weak.set weak 0 (Some context.Lui_ui.ui_scheduler);
        Lazy_children.lazy_rows ~key:(fun id -> "dispose-row-" ^ string_of_int id)
          ~cmp:String.compare ~estimate_height:(fun _ -> 64.)
          ~mount:(fun _ -> Lui_elements.column ~height:40 [])
          ~source:(Signal.constant context.Lui_ui.ui_scheduler [1;2])) in
    ignore (Lui_app.start app); ignore (Lui_app.flush app);
    check "Mounted lazy rows must retain their scheduler" (Weak.check weak 0);
    ignore (Lui_app.dispose app); weak in
  let weak = mount_dispose () in
  Gc.full_major ();
  check "Lazy row latches retain a disposed app scheduler" (not (Weak.check weak 0));
  print_endline "native lazy row disposal: OK")

let () = List.iter lazy_row_extent [0;1;2;3];
  print_endline "native lazy row extent: OK"

let () = Native_embed.with_entry_lock (fun () ->
  let store = Lui_store.create () and mounted = ref 0 in
  let backend = {backend_profile=profile MacOS GenericHost;
    apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
  let registry = Lui_extension.registry () in
  Logseq_el.register_all registry; Logseq_codemirror.register registry;
  let key id = "viewport-batch-" ^ string_of_int id in
  let app = Lui_app.create_with_extensions backend registry Model.initial (fun model _ -> model)
    (fun context _ _ -> Lazy_children.lazy_rows ~key ~cmp:String.compare
      ~estimate_height:(fun _ -> 40.) ~source:(Signal.constant context.Lui_ui.ui_scheduler (List.init 20 Fun.id))
      ~mount:(fun _ context parent -> incr mounted; Lui_elements.column ~height:40 [] context parent)) in
  ignore (Lui_app.start app); ignore (Lui_app.flush app);
  let markers = List.filter (fun id -> match Lui_store.string_prop store id "attrs" with
    | Some attrs -> Host_interaction.has_attribute attrs "data-lazy-mount" | None -> false)
    (Lui_store.preorder store) in
  let groups = Host_interaction.lazy_mount_groups store markers in
  check "One visible journal region must publish its row latches in one event" (List.length groups=1);
  let parent,children = List.hd groups in
  check "The viewport batch must contain every row in source order" (children=markers);
  Platform.emit_event "lazy-mount" (Js.Json.JObject
    ["nodeId",Js.Json.JNumber (float parent);
     "uuids",Js.Json.JArray (Array.init 20 (fun id -> Js.Json.JString (key id)))]);
  ignore (Lui_app.flush app);
  check "Batched viewport entry must mount every intended row exactly once" (!mounted=20);
  ignore (Lui_app.dispose app);
  print_endline "native viewport mount batching: OK")

let () = Native_embed.with_entry_lock (fun () ->
  let store = Lui_store.create () in
  let backend = {backend_profile=profile MacOS GenericHost;
    apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
  let registry = Lui_extension.registry () in
  Logseq_el.register_all registry;
  Logseq_codemirror.register registry;
  let app = Lui_app.create_with_extensions backend registry Model.initial
      (fun model _ -> model) (fun _ _ _ ->
        Logseq_el.el ~attrs:["id","cache-lifetime"; "data-payload",String.make 100000 'x'] []) in
  ignore (Lui_app.start app); ignore (Lui_app.flush app);
  let rt = Lui_app.runtime app in
  let id = List.find (fun id -> Lui_store.string_prop store id "attrs" <> None)
      (Lui_store.preorder store) in
  let snapshot = Native_embed.ext_snapshot rt id in
  let weak = Weak.create 1 in
  Weak.set weak 0 (Some snapshot);
  ignore (Ui_dom_native.el_of snapshot);
  Dom_ext.overlay_set_attr id "data-highlighted" "";
  Dom_ext.set_value snapshot "temporary text";
  Dom_ext.note_node_rect (Js.Json.JObject ["nodeId",Js.Json.JNumber (float id);
    "rect",Js.Json.JObject ["width",Js.Json.JNumber 100.]; "ref",snapshot]);
  Dom_ext.note_node_natural_size (Js.Json.JObject ["nodeId",Js.Json.JNumber (float id)]);
  check "Live attributes were not cached" (Hashtbl.mem Native_embed.attrs_parse_cache id);
  ignore (Lui_app.dispose app);
  Native_embed.invalidate_stale_snapshots rt;
  check "Disposed row attributes remain retained" (not (Hashtbl.mem Native_embed.attrs_parse_cache id));
  check "Disposed DOM overlays remain retained" (not (Hashtbl.mem Dom_ext.overlays id));
  check "Disposed geometry remains retained" (not (Hashtbl.mem Dom_ext.rect_store id));
  check "Disposed image measurements remain retained" (not (Hashtbl.mem Dom_ext.natural_store id));
  check "Disposed editor fields remain retained" (not (Hashtbl.mem Dom_ext.live_fields "cache-lifetime"));
  check "Disposed reference geometry remains retained" (not (Hashtbl.mem Dom_ext.ref_rect_store "cache-lifetime"));
  Gc.full_major (); Gc.full_major ();
  check "Disposed element handles retain their snapshots" (not (Weak.check weak 0));
  print_endline "native snapshot cache lifetime: OK")

let () =
  let snapshot id = Js.Json.JObject ["node-id",Js.Json.JNumber (float id)] in
  let original = Ui_dom_native.el_of (snapshot 700001) in
  check "An element must contain itself before other lookups" (original.contains original);
  for id=700002 to 702002 do ignore (Ui_dom_native.el_of (snapshot id)) done;
  check "A held element handle must keep its identity after repeated pointer lookups"
    (original.contains original);
  let same = Ui_dom_native.el_of (snapshot 700001) in
  Gc.full_major ();
  check "Separate snapshots of the same element must share containment identity"
    (original.contains same && same.contains original);
  let child = Ui_dom_native.el_of (Js.Json.JObject ["node-id",Js.Json.JNumber 702003.;
    "ancestors",Js.Json.JArray [|snapshot 700001|]]) in
  check "Containment must preserve its direction between parent and child"
    (original.contains child && not (child.contains original));
  print_endline "native held element identity: OK"

let () = Native_embed.with_entry_lock (fun () ->
  let target = Js.Json.JObject ["text",Js.Json.JString (String.make 100000 'x')] in
  let payload = Js.Json.JObject ["nodeId",Js.Json.JNumber 910001.; "target",target] in
  let old_parent = !Platform.dom_parent_of in
  let old_capture = Hashtbl.find_opt Platform.capture_listeners "mousemove"
  and old_window = Hashtbl.find_opt Platform.window_listeners "mousemove" in
  let restore table value = match value with
    | Some listeners -> Hashtbl.replace table "mousemove" listeners
    | None -> Hashtbl.remove table "mousemove" in
  Fun.protect ~finally:(fun () ->
    Platform.dom_parent_of := old_parent;
    Platform.unregister_dom_handlers 910001; Platform.unregister_dom_handlers 910002;
    restore Platform.capture_listeners old_capture;
    restore Platform.window_listeners old_window) (fun () ->
    Platform.dom_parent_of := (function 910001 -> Some 910002 | _ -> None);
    let order = ref [] in
    Hashtbl.replace Platform.capture_listeners "mousemove"
      [fun event -> check "Document capture lost its original target"
        (Ui_dom_native.jfield "target" event = Some target)];
    Hashtbl.replace Platform.window_listeners "mousemove" [];
    Platform.register_dom_handler 910001 ~events:"click pointerdown"
      (fun _ _ -> failwith "Unsubscribed pointer handler ran");
    let before = Gc.allocated_bytes () in
    for _=1 to 100 do Platform.emit_event "mousemove" payload done;
    let bytes = (Gc.allocated_bytes () -. before) /. 100. in
    Printf.printf "native document-only motion allocated %.0f bytes/event\n%!" bytes;
    check "Document-only mouse movement serialized an unused node snapshot" (bytes <= 16384.);
    Hashtbl.replace Platform.capture_listeners "mousemove" [fun _ -> order := ["capture"]];
    Hashtbl.replace Platform.window_listeners "mousemove" [fun _ -> order := !order @ ["window"]];
    Platform.register_dom_handler 910001 ~events:"mousemove" (fun _ json ->
      let event = Js.Json.parseExn (Option.get json) in
      check "Element mousemove lost its complete snapshot"
        (Ui_dom_native.jfield "target" event = Some target);
      order := !order @ ["child"]);
    Platform.register_dom_handler 910002 ~events:"mousemove"
      (fun _ _ -> order := !order @ ["parent"]);
    Platform.emit_event "mousemove" payload;
    check "Pointer capture and bubbling order changed"
      (!order = ["capture";"child";"parent";"window"]);
    Hashtbl.replace Platform.capture_listeners "mousemove"
      [fun _ -> order := ["capture"]; Platform.request_stop ()];
    Platform.emit_event "mousemove" payload;
    check "Stopped capture still reached element handlers" (!order = ["capture"]));
  print_endline "native pointer event serialization: OK")

let () =
  let received = ref 0 and store = Lui_store.create () in
  let branches = ref None in
  let old_app = !Native_embed.current_app
  and old_target = !Platform.event_target_of in
  let old_capture = Hashtbl.find_opt Platform.capture_listeners "keydown" in
  let app = Native_embed.with_entry_lock (fun () ->
    let registry = Lui_extension.registry () in
    Logseq_editor.register registry;
    let backend = {backend_profile=profile MacOS GenericHost;
      apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
    let app = Lui_app.create_with_extensions backend registry Model.initial
      (fun (model : Model.t) (_ : Action.t) -> model) (fun context _ _ ->
        let items = Signal.state context.Lui_ui.ui_scheduler [0] in
        branches := Some items;
        let source = Signal.value items in
        Lui_elements.keyed ~source ~key:Fun.id ~cmp:Int.compare ~mount:(fun item ->
          let block_id = "key-owner-" ^ string_of_int (Signal.get item) in
          let model = Signal.constant context.Lui_ui.ui_scheduler
            (Edit_model.create "key regression") in
          Edit_view.view ~model
            ~frame:(Signal.constant context.Lui_ui.ui_scheduler Edit_input.empty_frame)
            ~block_id ~cls:"" ~on_input:(fun _ -> incr received))) in
    Native_embed.current_app := Some app;
    Platform.event_target_of := (fun id -> Some (Native_embed.ext_snapshot (Lui_app.runtime app) id));
    Hashtbl.replace Platform.capture_listeners "keydown" [];
    ignore (Lui_app.start app); ignore (Lui_app.flush app);
    app) in
  let editor_id () = List.find (fun id -> Lui_store.kind store id = "extension:logseq-editor")
    (Lui_store.preorder store) in
  let key id = Native_embed.keyboard_event id
      (Printf.sprintf "{\"nodeId\":%d,\"key\":\"Enter\"}" id)
      "{\"key\":\"Enter\"}" in
  Fun.protect ~finally:(fun () ->
    Native_embed.with_entry_lock (fun () -> ignore (Lui_app.dispose app));
    Native_embed.current_app := old_app;
    Platform.event_target_of := old_target;
    match old_capture with
    | Some listeners -> Hashtbl.replace Platform.capture_listeners "keydown" listeners
    | None -> Hashtbl.remove Platform.capture_listeners "keydown") (fun () ->
      let original = editor_id () in
      Hashtbl.replace Platform.capture_listeners "keydown" [fun _ ->
        Host.enqueue (fun () -> Signal.set (Option.get !branches) [1]; ignore (Lui_app.flush app))];
      ignore (key original);
      check "An async remount between document and editor dispatch dropped Enter" (!received=1);
      ignore (Native_embed.pump ());
      Hashtbl.replace Platform.capture_listeners "keydown" [];
      let next = editor_id () in
      check "Queued refresh did not remount the editor" (next <> original);
      ignore (key next);
      check "The remounted editor lost its next Enter" (!received=2);
      Hashtbl.replace Platform.capture_listeners "keydown" [fun _ ->
        incr received; Signal.set (Option.get !branches) [2]; ignore (Lui_app.flush app)];
      ignore (key next);
      check "A document-owned key was also delivered to a disposed editor" (!received=3));
  print_endline "native atomic editor key delivery: OK"

let () = match Sys.getenv_opt "LOGSEQ_NATIVE_LAYOUT_REPLAY" with
  | None -> ()
  | Some path ->
    let (store,width,height,scale,hidden_ids,anchor :
        Lui_store.t * float * float * float * int list * (float * float) option) =
      In_channel.with_open_bin path Marshal.from_channel in
    (if Sys.getenv_opt "LOGSEQ_NATIVE_REPLAY_TREE" = Some "1" then begin
      let depths = Hashtbl.create (Lui_store.node_count store) in
      let deepest = ref (0,0) in
      List.iter (fun id ->
        let depth = match Lui_store.parent store id with
          | None -> 0 | Some parent -> 1 + Hashtbl.find depths parent in
        Hashtbl.add depths id depth;
        if depth > fst !deepest then deepest := depth,id) (Lui_store.preorder store);
      let rec path id =
        Option.iter path (Lui_store.parent store id);
        Printf.eprintf "tree depth=%d kind=%s class=%s\n%!" (Hashtbl.find depths id)
          (Lui_store.kind store id)
          (Option.value (Lui_store.string_prop store id "style-class") ~default:"");
        List.iter (fun name -> Option.iter (fun value ->
          Printf.eprintf "  %s=%s\n%!" name (match value with Lui_protocol.StringValue s -> s | FloatValue f -> string_of_float f | IntValue i -> string_of_int i | _ -> "other"))
          (Lui_store.prop store id name))
          ["width";"height";"width-percent";"height-percent";"grow";"shrink";"padding";"gap";"align";"overflow"] in
      path (snd !deepest)
    end);
    let hidden_table = Hashtbl.create (List.length hidden_ids) in
    List.iter (fun id -> Hashtbl.add hidden_table id ()) hidden_ids;
    let scene = Lui_scene.create
      ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:512 ~h:512)
      ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:512 ~h:512) in
    let engine = Text_engine.create ~scene:(fun () -> scene)
      ~scale:(fun () -> scale) ~store:(fun () -> store) in
    let memo = Hashtbl.create 256 in
    let measure id text w _h =
      let w = Host_interaction.measure_width w in
      let key = id,text,w,scale in
      match Hashtbl.find_opt memo key with
      | Some result -> result
      | None ->
        let mw,mh = Text_engine.measure_text ~width:w engine id text in
        let tp = Lui_paint.text_placement_of store id in
        let result = Some (mw +. 2. *. tp.tp_pad_x *. scale,
                           mh +. 2. *. tp.tp_pad_y *. scale) in
        Hashtbl.add memo key result;
        result in
    let allocation_samples = Hashtbl.create 128 in
    let sample (allocation : Gc.Memprof.allocation) =
      let stack = Printexc.raw_backtrace_to_string allocation.callstack in
      let old = Option.value (Hashtbl.find_opt allocation_samples stack) ~default:0 in
      Hashtbl.replace allocation_samples stack (old + allocation.n_samples);
      None in
    let profiler = match Sys.getenv_opt "LOGSEQ_NATIVE_REPLAY_ALLOC_PROFILE" with
      | None -> None
      | Some _ -> Some (Gc.Memprof.start ~sampling_rate:0.0001 ~callstack_size:14
        {Gc.Memprof.null_tracker with alloc_minor=sample; alloc_major=sample}) in
    let samples = Array.init 6 (fun _ ->
      let layout = Lui_layout.create () in
      let before = Gc.allocated_bytes () and started = Unix.gettimeofday () in
      Lui_layout.sync ~scale ~measure ~hidden:(Hashtbl.mem hidden_table)
        ?ctx_anchor:anchor ~width ~height layout store;
      let elapsed = (Unix.gettimeofday () -. started) *. 1000. in
      Printf.printf "captured layout: nodes=%d ms=%.3f allocated_bytes=%.0f\n%!"
        (Lui_store.node_count store) elapsed (Gc.allocated_bytes () -. before);
      elapsed) in
    Option.iter (fun profile ->
      Gc.Memprof.stop ();
      Gc.Memprof.discard profile;
      let rows = Hashtbl.fold (fun stack count rows -> (count,stack)::rows) allocation_samples []
        |> List.sort (fun (a,_) (b,_) -> Int.compare b a) in
      List.iteri (fun index (count,stack) -> if index < 25 then
        Printf.eprintf "allocation samples=%d\n%s\n%!" count stack) rows) profiler;
    Array.sort Float.compare samples;
    check "Captured native layout exceeds the 60 FPS editing budget"
      (samples.(5) <= 16.67)

let () = match Sys.getenv_opt "LOGSEQ_NATIVE_LAYOUT_TRACE_REPLAY" with
  | None -> ()
  | Some path ->
    let layout = Lui_layout.create () in
    let current_store = ref (Lui_store.create ()) in
    let hidden_ids = Hashtbl.create 16 in
    let hidden id = Hashtbl.mem hidden_ids id in
    let scene = Lui_scene.create
      ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:512 ~h:512)
      ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:512 ~h:512) in
    let scale_now = ref 2. in
    let engine = Text_engine.create ~scene:(fun () -> scene)
      ~scale:(fun () -> !scale_now) ~store:(fun () -> !current_store) in
    let memo = Hashtbl.create 256 in
    let measure id text width _ =
      let width = Host_interaction.measure_width width in
      let key = id,text,width,!scale_now in
      match Hashtbl.find_opt memo key with
      | Some result -> result
      | None ->
        let mw,mh = Text_engine.measure_text ~width engine id text in
        let tp = Lui_paint.text_placement_of !current_store id in
        let result = Some (mw +. 2. *. tp.tp_pad_x *. !scale_now,
                           mh +. 2. *. tp.tp_pad_y *. !scale_now) in
        Hashtbl.add memo key result;
        result in
    In_channel.with_open_bin path (fun channel ->
      let previous = ref (-1) and frame = ref 0 in
      let rec replay () =
        match (Marshal.from_channel channel :
          Lui_store.t * float * float * float * int list * (float * float) option) with
        | store,width,height,scale,hidden_nodes,anchor ->
          incr frame;
          current_store := store; scale_now := scale;
          Hashtbl.reset memo; Hashtbl.reset hidden_ids;
          List.iter (fun id -> Hashtbl.add hidden_ids id ()) hidden_nodes;
          let ops = Lui_store.changes_since store !previous in
          Printf.printf "layout trace frame=%d revision=%d nodes=%d ops=%d\n%!"
            !frame (Lui_store.revision store) (Lui_store.node_count store)
            (match ops with None -> -1 | Some ops -> List.length ops);
          (try Lui_layout.sync ~scale ~measure ~hidden ?ctx_anchor:anchor
            ~width ~height layout store
           with error ->
             Option.iter (List.iter (fun op -> Printf.eprintf "%s\n%!"
               (Lui_wire.encode_op op))) ops;
             raise error);
          previous := Lui_store.revision store;
          replay ()
        | exception End_of_file -> () in
      replay ())
