module Lui_text = Host_platform.Text

open Lui_protocol

let check message condition = if not condition then failwith message

let transport_batches () =
  let payload = "\n\t\"你好\"\\" ^ String.make 1024 'x' in
  let children = List.concat_map (fun i ->
    let id = 900001+i in
    [CreateNode (id, Text); SetProp (id, TextValue, StringValue payload);
     InsertChild (900000, id, i)]) (List.init 512 Fun.id) in
  [{generation=1; ops=CreateNode (900000, Column) :: children};
   {generation=2; ops=[SetProp (900001, TextValue, StringValue "updated");
     SetProp (900001, Enabled, BoolValue false);
     SetProp (900001, Opacity, FloatValue 0.625);
     SetProp (900001, WidthValue, IntValue 42)]}]

let () =
  let expected = transport_batches () in
  Native_embed.with_entry_lock (fun () ->
    Queue.clear Native_embed.pending_batches;
    List.iter (fun batch -> ignore (Native_embed.enqueue_batch batch)) expected);
  let actual = Patch_decode.batches_of_string (Native_embed.Ffi.pump ()) in
  check "Cross-language transport changed batch order, generations, or values" (actual=expected);
  let store = Lui_store.create () in
  List.iter (Lui_store.apply_batch store) actual;
  check "Transport lost a later text update"
    (Lui_store.string_prop store 900001 "text" = Some "updated");
  check "Transport lost mounted children" (Lui_store.node_count store=513);
  check "Empty cross-language transport changed its no-work result" (Native_embed.Ffi.pump ()="");
  print_endline "native patch wire boundary: OK"

let () =
  let batches = transport_batches () in
  let allocated = Native_embed.with_entry_lock (fun () ->
    Queue.clear Native_embed.pending_batches;
    let before = Gc.allocated_bytes () in
    List.iter (fun batch -> ignore (Native_embed.enqueue_batch batch)) batches;
    ignore (Native_embed.take_patches ());
    Gc.allocated_bytes () -. before) in
  Printf.printf "native in-process patch transport allocated %.0f bytes\n%!" allocated;
  check "In-process patch transport copies or serializes the batch payload"
    (allocated <= 65_536.);
  check "In-process transport retained already consumed batches"
    (Queue.is_empty Native_embed.pending_batches);
  print_endline "native patch allocation: OK"

let () =
  let before = Gc.allocated_bytes () in
  ignore (Option.get (Icon_data.get "menu-2"));
  let allocated = Gc.allocated_bytes () -. before in
  Printf.printf "native icon startup allocated %.0f bytes\n%!" allocated;
  check "Native icons still parse or retain the source JSON at startup"
    (allocated < 100_000.)

let rec json_of_yojson = function
  | `Null -> Json.Null
  | `Bool b -> Json.Bool b
  | `Int n -> Json.Number (float_of_int n)
  | `Intlit s -> Json.Number (float_of_string s)
  | `Float f -> Json.Number f
  | `String s -> Json.String s
  | `List xs -> Json.Array (Array.of_list (List.map json_of_yojson xs))
  | `Assoc kvs -> Json.Object (List.map (fun (k,v) -> k,json_of_yojson v) kvs)

let () =
  let source = In_channel.with_open_bin (Sys.getenv "LOGSEQ_ICON_DATA") In_channel.input_all in
  let expected = match Yojson.Safe.from_string source with
    | `Assoc entries -> entries | _ -> failwith "Invalid bundled icon fixture" in
  check "Compiled native icons lost bundled names"
    (List.sort String.compare (Array.to_list (Icon_data.keys ()))
     = List.sort String.compare (List.map fst expected));
  List.iter (fun (name,value) ->
    check ("Compiled icon differs from bundled data: " ^ name)
      (Icon_data.get name = Some (Icon_tabler_data.decode_children (json_of_yojson value)))) expected;
  let first = Option.get (Icon_data.get "menu-2") in
  let before = Gc.allocated_bytes () in
  for _ = 1 to 1000 do
    check "Repeated icon lookup does not reuse compiled data"
      (Option.get (Icon_data.get "menu-2") == first)
  done;
  check "Warm icon lookup still decodes data"
    (Gc.allocated_bytes () -. before < 32_000.);
  check "Missing icon unexpectedly resolves" (Icon_data.get "absent-native-icon" = None);
  check "Before-first icon name unexpectedly resolves" (Icon_data.get "" = None);
  check "After-last icon name unexpectedly resolves" (Icon_data.get "zzzzzzzz" = None);
  print_endline "native compiled icon data: OK"

let () =
  let snapshot = Ui_theme.snapshot Ui_theme.Light in
  Theme_vars.install_snapshot (Yojson.Safe.to_string (`Assoc
    ["mode",`String "light";
     "vars",`Assoc (List.map (fun (key,value) -> key,`String value) snapshot.Ui_theme.vars)]));
  let store = Lui_store.create () in
  List.iter (Lui_store.apply_op store)
    [CreateNode (1, Text);
     SetProp (1, FontSize, StringValue "var(--ls-page-title-size, 32px)")];
  check "Native titles ignore the production theme's 36-point size"
    (Host_platform.Text.size (Text_engine.font_of store 1) = 36.);
  Lui_store.apply_op store (SetProp (1, FontSize, StringValue "var(--missing-font-size, 18px)"));
  check "An absent font token must use its declared CSS fallback"
    (Host_platform.Text.size (Text_engine.font_of store 1) = 18.);
  Theme_vars.install_snapshot (Yojson.Safe.to_string (`Assoc
    ["mode",`String "light";
     "vars",`Assoc ["--font-alias",`String "var(--font-target)";
                    "--font-target",`String "22px";
                    "--font-code",`String "monospace"]]));
  Lui_store.apply_op store (SetProp (1, FontSize, StringValue "var(--font-alias, 14px)"));
  check "Native text ignores nested theme font aliases"
    (Host_platform.Text.size (Text_engine.font_of store 1) = 22.);
  Lui_store.apply_op store (SetProp (1, FontFamily, StringValue "var(--font-code, sans-serif)"));
  let mono = Text_engine.font_of store 1 in
  let narrow,_ = Host_platform.Text.measure mono "iiii" in
  let wide,_ = Host_platform.Text.measure mono "WWWW" in
  check "Code font tokens fall back to proportional text"
    (abs_float (narrow -. wide) < 0.1);
  Theme_vars.install_snapshot (Yojson.Safe.to_string (`Assoc
    ["mode",`String "light";
     "vars",`Assoc (List.map (fun (key,value) -> key,`String value) snapshot.Ui_theme.vars)]));
  print_endline "native theme typography: OK"

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
  Lui_store.apply_op store (CreateNode (10000,Column));
  for index=0 to 999 do
    let id = 10001 + index in
    List.iter (Lui_store.apply_op store)
      [CreateNode (id,Text); InsertChild (10000,id,index)]
  done;
  let previous_focus = !Host_requests.editor_focus_bid in
  Host_requests.editor_focus_bid := None;
  let before = Gc.allocated_bytes () in
  for _=1 to 100 do Host_requests.ensure_ed_focus_ env done;
  let focus_bytes = (Gc.allocated_bytes () -. before) /. 100. in
  Printf.printf "native unfocused editor recovery allocated %.0f bytes/poll\n%!" focus_bytes;
  check "Unfocused idle polls allocate a complete node list"
    (focus_bytes <= 1024.);
  check "Idle recovery must not focus a non-editor node" (Lui_window.Ui.focused ui = 0);
  Host_requests.editor_focus_bid := previous_focus;
  Lui_store.apply_op store (DropNode 10000);
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
  let before = Gc.allocated_bytes () in
  let icons = Icons.app_icon_svgs () in
  let payload = Yojson.Safe.to_string (`Assoc
    (List.map (fun (name,svg) -> name,`String svg) icons)) in
  Host_icons.install payload;
  let allocated = Gc.allocated_bytes () -. before in
  Printf.printf "native icon bootstrap allocated %.0f bytes, payload %d bytes\n%!"
    allocated (String.length payload);
  check "Native startup eagerly duplicates the complete bundled icon table"
    (allocated < 1_000_000. && String.length payload < 65536);
  List.iter (fun name ->
    check ("Lazy native icon lookup lost " ^ name) (Host_icons.svg_of name <> None))
    ["app:menu-2"; "app:search"; "app:dots"; "app:layout-sidebar-right"];
  List.iter (fun (name,svg) ->
    check ("Custom native icon changed " ^ name) (Host_icons.svg_of ("app:" ^ name) = Some svg))
    (Icons.custom_icons @ Icons.extension_icons @ Icons.status_icons @ Icons.priority_icons);
  let original = Option.get (Host_icons.svg_of "app:menu-2") in
  let before = Gc.allocated_bytes () in
  for _=1 to 1000 do
    check "A cached icon was converted again"
      (Option.get (Host_icons.svg_of "app:menu-2") == original)
  done;
  let lookup_bytes = (Gc.allocated_bytes () -. before) /. 1000. in
  Printf.printf "native cached SVG allocated %.0f bytes/lookup\n%!" lookup_bytes;
  check "Warm native icon lookup must not rebuild SVG data" (lookup_bytes < 128.);
  let replacement = "<svg xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M0 0h4\"/></svg>" in
  Host_icons.install (Yojson.Safe.to_string (`Assoc ["menu-2",`String replacement]));
  check "An icon registry update retained a stale SVG"
    (Host_icons.svg_of "app:menu-2" = Some replacement);
  Host_icons.install payload;
  check "Replacing the icon registry retained a removed override"
    (Host_icons.svg_of "app:menu-2" = Some original);
  let store = Lui_store.create () in
  let backend = {backend_profile=profile MacOS GenericHost;
    apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
  let registry = Lui_extension.registry () in
  Logseq_el.register_all registry;
  Logseq_codemirror.register registry;
  Logseq_editor.register registry;
  let initial = {Model.initial with left_sidebar_open=true; right_sidebar_open=false} in
  let app = Lui_app.create_with_extensions backend registry initial
      (fun _ next -> next) (fun _ model _ -> Chrome.shell model) in
  ignore (Lui_app.start app);
  ignore (Lui_app.flush app);
  let layout = Lui_layout.create () in
  let root = List.find (fun id ->
    Lui_store.string_prop store id "accessibility-identifier"
      = Some "app-container-wrapper") (Lui_store.preorder store) in
  let scroll = List.find (fun id -> Lui_store.kind store id = "scroll")
      (Lui_store.preorder store) in
  let find_class cls = List.find (fun id ->
    match Lui_store.string_prop store id "style-class" with
    | Some value -> List.mem cls (String.split_on_char ' ' value)
    | None -> false) (Lui_store.preorder store) in
  let main = find_class "cp__sidebar-main-content" in
  let sidebar = List.find (fun id ->
    Lui_store.string_prop store id "accessibility-identifier" = Some "left-sidebar")
    (Lui_store.preorder store) in
  let left_menu = List.find (fun id ->
    Lui_store.string_prop store id "accessibility-identifier" = Some "left-menu")
    (Lui_store.preorder store) in
  Lui_layout.sync ~scale:2. ~width:2880. ~height:1800. layout store;
  let menu_rect = Option.get (Lui_layout.rect layout left_menu) in
  let sidebar_rect = Option.get (Lui_layout.rect layout sidebar) in
  check (Printf.sprintf "Native titlebar toggle x=%.0f w=%.0f exceeds sidebar x=%.0f w=%.0f" menu_rect.x menu_rect.w sidebar_rect.x sidebar_rect.w)
    (menu_rect.x >= 160. && menu_rect.x +. menu_rect.w <= sidebar_rect.x +. sidebar_rect.w);
  List.iter (fun (width,height) ->
    Lui_layout.sync ~scale:2. ~width ~height layout store;
    let viewport = Option.get (Lui_layout.rect layout scroll) in
    let content = Option.get (Lui_layout.rect layout main) in
    let expected_width = min 1920. (viewport.w -. 96.) in
    let expected_x = viewport.x +. 64. +. (viewport.w -. 96. -. expected_width) /. 2. in
    check (Printf.sprintf "Main content width %.0f does not match %.0f at %.0f" content.w expected_width width)
      (abs_float (content.w -. expected_width) <= 2.);
    check "Main content is not centered within the padded viewport"
      (abs_float (content.x -. expected_x) <= 2.);
    check "Journals must retain the production 32-point top spacing"
      (content.y >= viewport.y +. 64.)) [2880.,1800.; 2000.,1200.; 1280.,900.];
  let icons = List.filter (fun id -> Lui_store.kind store id = "icon")
    (Lui_store.preorder store) in
  check "The shell must contain visible toolbar and navigation icons" (icons <> []);
  List.iter (fun id ->
    match Lui_layout.rect layout id with
    | Some rect when rect.w > 0. && rect.h > 0. ->
        (match Host_icons.image_of store 1. id rect with
         | Some image ->
             let opaque = ref false in
             for i = 3 to Bytes.length image.Lui_scene.ipix - 1 do
               if i mod 4 = 3 && Bytes.get image.ipix i <> '\000' then opaque := true
             done;
             check "A visible native icon rasterized to transparent pixels" !opaque
         | None -> failwith ("A visible native icon did not resolve: " ^
             Option.value ~default:"unknown" (Host_icons.icon_name store id)))
    | _ -> ()) icons;
  ignore (Lui_app.send app {initial with left_sidebar_open=false});
  ignore (Lui_app.flush app);
  Lui_layout.sync ~scale:2. ~width:2880. ~height:1800. layout store;
  let menu_ids = List.filter (fun id ->
    Lui_store.string_prop store id "accessibility-identifier" = Some "left-menu")
    (Lui_store.preorder store) in
  check "Collapsing the sidebar duplicated or removed the titlebar toggle" (List.length menu_ids = 1);
  let closed_menu_rect = Option.get (Lui_layout.rect layout (List.hd menu_ids)) in
  check "The collapsed titlebar toggle overlaps the system traffic lights"
    (closed_menu_rect.x >= 160. && closed_menu_rect.x < 200.);
  ignore (Lui_app.send app initial);
  ignore (Lui_app.flush app);
  List.iter (Lui_store.apply_op store)
    [CreateNode (100000, Box); SetProp (100000, HeightValue, IntValue 4000);
     InsertChild (main, 100000, 0)];
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
      if mode=2 then Lazy_children.lazy_rows ~active_key:None
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
  let markers = List.filter (fun id ->
    (Option.get (Lui_layout.rect layout id)).h=64.) markers in
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
        Lazy_children.lazy_rows ~active_key:None ~key:(fun id -> "dispose-row-" ^ string_of_int id)
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

let () = Native_embed.with_entry_lock (fun () ->
  let old_state = !Editor_state.st and old_fields = !Editor_state.field_sigs_opt in
  Editor_state.st := None; Editor_state.field_sigs_opt := None;
  Fun.protect ~finally:(fun () ->
    Editor_state.st := old_state; Editor_state.field_sigs_opt := old_fields) (fun () ->
    let store = Lui_store.create () and errors = ref [] in
    let expect message condition = if not condition then errors := message :: !errors in
    let backend = {backend_profile=profile MacOS GenericHost;
      apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
    let registry = Lui_extension.registry () in
    Logseq_el.register_all registry; Logseq_codemirror.register registry;
    Logseq_editor.register registry;
    let children = List.init 53 (fun index -> Model.empty_block
      ~uuid:("nested-" ^ string_of_int index) ~title:"nested row" ~is_page:false) in
    let parent_block = {(Model.empty_block ~uuid:"nested-parent" ~title:"parent" ~is_page:false)
      with Model.block_children=children} in
    let parent_state = ref None in
    let app = Lui_app.create_with_extensions backend registry Model.initial (fun model _ -> model)
      (fun context _ _ ->
        Editor_state.ensure context;
        let state = Signal.state context.Lui_ui.ui_scheduler parent_block in
        parent_state := Some state;
        Tree.child_list ~depth:0 ~editable:true ~library:false ~virtualize:false
          "nested-parent" "main" (Signal.value state)) in
    Fun.protect ~finally:(fun () -> ignore (Lui_app.dispose app)) (fun () ->
      ignore (Lui_app.start app); ignore (Lui_app.flush app);
      let initial_nodes = Lui_store.node_count store in
      Printf.printf "nested rows initial_nodes=%d\n%!" initial_nodes;
      expect "Nested native rows eagerly mount offscreen content" (initial_nodes < 128);
      let marker uuid = List.find_opt (fun id -> match Lui_store.string_prop store id "attrs" with
        | Some attrs -> Host_interaction.has_attribute attrs uuid
        | None -> false) (Lui_store.preorder store) in
      let mounted uuid = List.exists (fun id ->
        Lui_store.string_prop store id "accessibility-identifier"=Some ("ls-block-" ^ uuid))
        (Lui_store.preorder store) in
      let emit name id = Platform.emit_event name
        (Js.Json.JObject ["nodeId",Js.Json.JNumber (float id); "height",Js.Json.JNumber 32.]) in
      (match marker "nested-0" with
       | None -> expect "Nested native rows have no viewport markers" false
       | Some id ->
         emit "lazy-mount" id; ignore (Lui_app.flush app);
         expect "Entering a nested row did not mount its content" (mounted "nested-0");
         expect "One nested row mounted every sibling" (Lui_store.node_count store < 180);
         emit "lazy-unmount" id; ignore (Lui_app.flush app);
         expect "Leaving a nested row retained its content" (not (mounted "nested-0"));
         emit "lazy-mount" id; ignore (Lui_app.flush app);
         expect "Returning to a nested row lost its content" (mounted "nested-0"));
      let focus uuid =
        Editor_state.set (fun state -> {state with editing=Some
          (Editor_state.mk_editing ~uuid ~buffer:"" ~scope:"main" ~base:"" ())});
        ignore (Lui_app.flush app);
        expect "Offscreen editing target was not mounted" (mounted uuid);
        expect "Offscreen editing target has no native editor"
          (List.exists (fun id -> Lui_store.string_prop store id "block-id"=Some uuid)
            (Lui_store.preorder store)) in
      Editor_state.set (fun state -> {state with editing=Some
        (Editor_state.mk_editing ~uuid:"nested-52" ~buffer:"" ~scope:"right" ~base:"" ())});
      ignore (Lui_app.flush app);
      expect "Editing another pane mounted an offscreen main-pane row" (not (mounted "nested-52"));
      focus "nested-52";
      (match marker "nested-52" with
       | None -> expect "Active nested row lost its viewport marker" false
       | Some id ->
         emit "lazy-unmount" id; ignore (Lui_app.flush app);
         expect "A viewport update disposed the active editor before focus settled"
           (mounted "nested-52"));
      let next = Model.empty_block ~uuid:"nested-53" ~title:"" ~is_page:false in
      Signal.set (Option.get !parent_state) {parent_block with block_children=children@[next]};
      focus "nested-53";
      List.iter prerr_endline (List.rev !errors);
      check "Nested row viewport and editing lifecycle" (!errors=[]))));
  print_endline "native nested row window: OK"

let () = List.iter lazy_row_extent [0;1;2;3];
  print_endline "native lazy row extent: OK"

let warmup_row_disposal mode = Native_embed.with_entry_lock (fun () ->
  let store = Lui_store.create () and rendered = ref 0 in
  let resources = Hashtbl.create 3 in
  let backend = {backend_profile=profile MacOS GenericHost;
    apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
  let registry = Lui_extension.registry () in
  Logseq_el.register_all registry;
  Logseq_codemirror.register registry;
  let app = Lui_app.create_with_extensions backend registry Model.initial (fun model _ -> model)
    (fun context _ _ ->
      let render id context parent =
        incr rendered;
        let resource = ref (String.make 4096 'x') and weak = Weak.create 1 in
        Weak.set weak 0 (Some resource); Hashtbl.replace resources id weak;
        Logseq_el.el ~events:"resource-check"
          ~on_dom_event:(fun _ _ -> ignore (Sys.opaque_identity resource))
          [Lui_elements.column ~height:40 [Lui_elements.text ~value:"row" []]] context parent in
      if mode=0 then Virt_list.list ~initial_rows:3 ~estimate_size:(fun _ -> 64.)
        ~key_of:string_of_int ~render (Array.init 10 Fun.id)
      else Virt_list.rows_sig ~initial_rows:3 ~estimate_size:(fun _ -> 64.)
        ~key:string_of_int ~cmp:String.compare
        ~mount:(fun item -> render (Signal.get item))
        (Signal.constant context.Lui_ui.ui_scheduler (List.init 10 Fun.id))) in
  ignore (Lui_app.start app); ignore (Lui_app.flush app);
  check "Warmup rows must render before the first viewport pass" (!rendered=3);
  let markers = List.filter (fun id ->
    match Lui_store.string_prop store id "attrs" with
    | Some attrs -> Host_interaction.has_attribute attrs "data-lazy-mount"
    | None -> false) (Lui_store.preorder store) in
  check "Warmup rows must participate in viewport disposal" (List.length markers=10);
  let first = List.hd markers and mounted_nodes = Lui_store.node_count store in
  check "Mounted warmup rows must expose their automatic height"
    (Lui_store.string_prop store first "height"=Some "auto");
  let layout = Lui_layout.create () in
  Lui_layout.sync ~width:800. ~height:600. layout store;
  List.iteri (fun index id ->
    check "Warmup rows must use content height while deferred rows keep their estimate"
      ((Option.get (Lui_layout.rect layout id)).h=(if index<3 then 40. else 64.))) markers;
  let resource = Hashtbl.find resources 0 in
  Platform.emit_event "lazy-unmount" (Js.Json.JObject
    ["nodeId",Js.Json.JNumber (float first);"height",Js.Json.JNumber 40.]);
  ignore (Lui_app.flush app);
  Gc.full_major ();
  check "Offscreen warmup content must release its nodes and owned resources"
    (Lui_store.node_count store < mounted_nodes && not (Weak.check resource 0));
  Lui_layout.sync ~width:800. ~height:600. layout store;
  check "Warmup disposal must preserve measured scroll extent"
    ((Option.get (Lui_layout.rect layout first)).h=40.);
  Platform.emit_event "lazy-mount" (Js.Json.JObject ["nodeId",Js.Json.JNumber (float first)]);
  ignore (Lui_app.flush app);
  check "Returning to a warmup row must remount its content" (!rendered=4);
  ignore (Lui_app.dispose app))

let () = List.iter warmup_row_disposal [0;1];
  print_endline "native warmup row disposal: OK"

let () = Native_embed.with_entry_lock (fun () ->
  let store = Lui_store.create () and mounted = ref 0 in
  let backend = {backend_profile=profile MacOS GenericHost;
    apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
  let registry = Lui_extension.registry () in
  Logseq_el.register_all registry; Logseq_codemirror.register registry;
  let key id = "viewport-batch-" ^ string_of_int id in
  let app = Lui_app.create_with_extensions backend registry Model.initial (fun model _ -> model)
    (fun context _ _ -> Lazy_children.lazy_rows ~active_key:None ~key ~cmp:String.compare
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
  Lui_runtime.set_extension_prop rt id "style-class" (StringValue "updated-class");
  ignore (Lui_app.flush app);
  Native_embed.invalidate_stale_snapshots rt;
  check "A live extension lost its parsed attributes after another property changed"
    (Hashtbl.mem Native_embed.attrs_parse_cache id);
  check "A live extension lost its DOM mutation overlay"
    (Hashtbl.mem Dom_ext.overlays id);
  Lui_runtime.remove_extension_prop rt id "attrs";
  ignore (Lui_app.flush app);
  Native_embed.invalidate_stale_snapshots rt;
  check "Removed attributes remain in the parsed snapshot cache"
    (not (Hashtbl.mem Native_embed.attrs_parse_cache id));
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

let () = Native_embed.with_entry_lock (fun () ->
  let store=Lui_store.create () in
  let backend={backend_profile=profile MacOS GenericHost;
    apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
  let app=Lui_app.create backend Model.initial (fun model _ -> model)
    (fun _ _ _ ->
      let rec nest depth child = if depth=0 then child
        else Lui_elements.column ~style_class:"ancestor" [nest (depth-1) child] in
      Lui_elements.column
        [Lui_elements.text ~value:"earlier sibling" [];
         nest 70 (Lui_elements.column (List.init 1000 (fun _ ->
           Lui_elements.text ~value:"deep snapshot leaf" [])))]) in
  let old_app= !Native_embed.current_app in
  Fun.protect ~finally:(fun () ->
    ignore (Lui_app.dispose app);
    Native_embed.invalidate_stale_snapshots (Lui_app.runtime app);
    Native_embed.current_app := old_app) (fun () ->
    Native_embed.current_app := Some app;
    ignore (Lui_app.start app); ignore (Lui_app.flush app);
    let rt=Lui_app.runtime app in
    Native_embed.invalidate_stale_snapshots rt;
    let ids=Lui_store.preorder store in
    List.iter (fun id -> ignore (Native_embed.shallow_of rt id)) ids;
    let before=Gc.allocated_bytes () in
    let snapshots=Native_embed.collect_subtree (Lui_app.root_node app) in
    let allocated=Gc.allocated_bytes () -. before in
    Printf.printf "native deep subtree snapshots allocated %.0f bytes\n%!" allocated;
    check "Subtree snapshots repeat ancestor walks and property lists" (allocated <= 524288.);
    check "Subtree collection changed preorder"
      (List.map (fun el -> int_of_float (Option.get (Dom_ext.num_prop "node-id" el))) snapshots=ids);
    List.iter2 (fun id snapshot ->
      check "Collected snapshot differs from its event target"
        (snapshot=Native_embed.ext_snapshot rt id)) ids snapshots;
    let leaves=List.filter (fun el -> Dom_ext.str_prop "text" el=Some "deep snapshot leaf") snapshots in
    check "Deep snapshot lost a leaf or changed its ancestor limit"
      (List.length leaves=1000 && List.for_all (fun el -> List.length (Dom_ext.ancestors_of el)=64) leaves);
    let leaf=List.hd leaves in
    let leaf_id=int_of_float (Option.get (Dom_ext.num_prop "node-id" leaf)) in
    check "A scoped subtree lost ancestors outside its collection root"
      (Native_embed.collect_subtree leaf_id=[leaf]);
    check "A cached subtree changed its snapshots"
      (Native_embed.collect_subtree (Lui_app.root_node app)==snapshots));
  print_endline "native shared snapshot ancestry: OK")

let () = Native_embed.with_entry_lock (fun () ->
  let store=Lui_store.create () in
  let backend={backend_profile=profile MacOS GenericHost;
    apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
  let app=Lui_app.create backend Model.initial (fun model _ -> model)
    (fun _ _ _ -> Lui_elements.column (List.init 1000 (fun id ->
      Lui_elements.text ~value:("snapshot row " ^ string_of_int id)
        ~data_attrs:["data-owner",string_of_int id; "data-detail",String.make 64 'x'] []))) in
  let old_app= !Native_embed.current_app in
  Fun.protect ~finally:(fun () ->
    ignore (Lui_app.dispose app);
    Native_embed.invalidate_stale_snapshots (Lui_app.runtime app);
    Native_embed.current_app := old_app) (fun () ->
    Native_embed.current_app := Some app;
    ignore (Lui_app.start app); ignore (Lui_app.flush app);
    let rt=Lui_app.runtime app in
    let root=Lui_app.root_node app in
    ignore (Native_embed.collect_subtree root);
    let target=List.find (fun id -> Lui_store.string_prop store id "text"=Some "snapshot row 0")
      (Lui_store.preorder store) in
    let sibling=List.find (fun id -> Lui_store.string_prop store id "text"=Some "snapshot row 1")
      (Lui_store.preorder store) in
    let original=Native_embed.shallow_of rt sibling in
    Lui_runtime.set_prop rt target TextValue (StringValue "changed snapshot row");
    ignore (Lui_app.flush app);
    let before=Gc.allocated_bytes () in
    let snapshots=Native_embed.collect_subtree root in
    let bytes=Gc.allocated_bytes () -. before in
    Printf.printf "native one-row snapshot refresh allocated %.0f bytes\n%!" bytes;
    check "Snapshot refresh copied unchanged node properties" (bytes <= 524288.);
    check "An unrelated row lost its cached immutable snapshot"
      (original==Native_embed.shallow_of rt sibling);
    check "A changed row returned its old snapshot text"
      (List.exists (fun el -> Dom_ext.str_prop "text" el=Some "changed snapshot row") snapshots);
    Lui_runtime.set_prop rt target DataAttrs
      (StringValue (Lui_protocol.data_attrs_encode ["data-owner","updated"]));
    ignore (Lui_app.flush app);
    let updated=Native_embed.ext_snapshot rt target in
    check "A changed attribute returned stale parsed data"
      (Dom_ext.el_attr updated "data-owner"=Some "updated"));
  print_endline "native per-node snapshot reuse: OK")

let () = Native_embed.with_entry_lock (fun () ->
  let store=Lui_store.create () in
  let backend={backend_profile=profile MacOS GenericHost;
    apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
  let registry=Lui_extension.registry () in
  List.iter (fun name -> Lui_extension.register_component registry
    (Lui_extension.component name [profile MacOS GenericHost] false [] [] []))
    ["snapshot-first";"snapshot-second"];
  let app=Lui_app.create_with_extensions backend registry Model.initial
    (fun model _ -> model) (fun _ _ _ -> Lui_elements.column []) in
  ignore (Lui_app.start app); ignore (Lui_app.flush app);
  let rt=Lui_app.runtime app in
  let old_app= !Native_embed.current_app in
  Fun.protect ~finally:(fun () ->
    ignore (Lui_app.dispose app);Native_embed.invalidate_stale_snapshots rt;
    Native_embed.current_app := old_app) (fun () ->
    Native_embed.current_app := Some app;
    let saved=Lui_runtime.checkpoint rt in
    let old_id=Lui_runtime.create_node rt Text in
    Lui_runtime.insert_child rt (Lui_app.root_node app) old_id 0;
    ignore (Native_embed.ext_snapshot rt old_id);
    ignore (Native_embed.collect_subtree (Lui_app.root_node app));
    Lui_runtime.restore rt saved;
    let new_id=Lui_runtime.create_node rt Button in
    Lui_runtime.insert_child rt (Lui_app.root_node app) new_id 0;
    check "Rollback did not reuse the candidate identity" (new_id=old_id);
    check "Reused node identity returned the previous kind"
      (Dom_ext.tag_name (Native_embed.ext_snapshot rt new_id)="button");
    check "A rollback with equal pending-operation counts reused a stale subtree"
      (List.exists (fun el -> Dom_ext.num_prop "node-id" el=Some (float new_id)
        && Dom_ext.tag_name el="button")
        (Native_embed.collect_subtree (Lui_app.root_node app)));
    Lui_runtime.restore rt saved;
    let old_extension=Lui_runtime.create_extension_node rt "snapshot-first" in
    ignore (Native_embed.ext_snapshot rt old_extension);
    Lui_runtime.restore rt saved;
    let new_extension=Lui_runtime.create_extension_node rt "snapshot-second" in
    check "Reused extension identity returned the previous identifier"
      (new_extension=old_extension
       && Dom_ext.tag_name (Native_embed.ext_snapshot rt new_extension)="snapshot-second");
    Lui_runtime.restore rt saved);
  print_endline "native snapshot identity after rollback: OK")

let () = Native_embed.with_entry_lock (fun () ->
  let make text =
    let store=Lui_store.create () in
    let backend={backend_profile=profile MacOS GenericHost;
      apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
    let app=Lui_app.create backend Model.initial (fun model _ -> model)
      (fun _ _ _ -> Lui_elements.column [Lui_elements.text ~value:text []]) in
    ignore (Lui_app.start app);ignore (Lui_app.flush app);app in
  let first=make "first runtime" and second=make "second runtime" in
  let old_app= !Native_embed.current_app in
  Fun.protect ~finally:(fun () ->
    List.iter (fun app -> ignore (Lui_app.dispose app);
      Native_embed.invalidate_stale_snapshots (Lui_app.runtime app)) [first;second];
    Native_embed.current_app := old_app) (fun () ->
    List.iter (fun (app,text) ->
      Native_embed.current_app := Some app;
      let snapshots=Native_embed.collect_subtree (Lui_app.root_node app) in
      check "Snapshot cache crossed application ownership"
        (List.exists (fun el -> Dom_ext.str_prop "text" el=Some text) snapshots))
      [first,"first runtime";second,"second runtime";first,"first runtime"]);
  check "Snapshot ownership retains a disposed runtime"
    (Option.is_none !Native_embed.snapshot_owner);
  print_endline "native snapshot runtime ownership: OK")

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

let () =
  let store = Lui_store.create () in
  let scene = Lui_scene.create
    ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:512 ~h:512)
    ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:512 ~h:512) in
  let engine = Text_engine.create ~scene:(fun () -> scene)
    ~scale:(fun () -> 2.) ~store:(fun () -> store) in
  let caches = Array.init 21 (fun _ -> Host_interaction.overlay_cache ()) in
  let foreground = Lui_scene.color 0 0 0 255 in
  let frame sample =
    scene.glyphs <- [];
    Array.iteri (fun index cache ->
      let value = if index=0 then Printf.sprintf "Heap: %d MB" sample
        else "Unchanged performance measurement" in
      let rect = Lui_scene.rect 2000. (float index *. 32.) 800. 32. in
      ignore (Host_interaction.overlay_cached cache ~key:value scene (fun () ->
        Text_engine.text_ops engine 0 rect foreground value))) caches;
    Host_interaction.seal_overlay scene in
  frame 99;
  let original = List.nth scene.glyphs 20 in
  frame 100;
  let current = List.find_opt (fun glyph -> glyph.Lui_scene.gx=original.gx
    && glyph.gy=original.gy && glyph.gu=original.gu && glyph.gv=original.gv) scene.glyphs in
  check "Changing the number of metrics digits reshaped unrelated labels"
    (match current with Some glyph -> glyph == original | None -> false);
  let before = Gc.allocated_bytes () in
  for sample=101 to 120 do frame sample done;
  let allocated = (Gc.allocated_bytes () -. before) /. 20. in
  Printf.printf "native metrics label refresh allocated %.0f bytes/frame\n%!" allocated;
  check "A metrics update regenerated every unchanged text label" (allocated <= 131072.);
  print_endline "native metrics label retention: OK"

let () =
  let errors=ref [] in
  let verify message condition = if not condition then errors := message :: !errors in
  List.iter (fun kind ->
    let store=Lui_store.create () in
    Lui_store.apply_batch store {generation=1;ops=[CreateNode (1,kind);
      SetProp (1,TextValue,StringValue "x");
      CreateNode (2,Text);SetProp (2,TextValue,StringValue "Unchanged caption")
    ]};
    if kind=Text then
      Lui_store.apply_op store (SetProp (1,StyleClass,StringValue "ed-r ed-raw"));
    let scene=Lui_scene.create
      ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:64 ~h:64)
      ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:64 ~h:64) in
    let engine=Text_engine.create ~scene:(fun () -> scene) ~scale:(fun () -> 2.)
      ~store:(fun () -> store) in
    let rect=Lui_scene.rect 0. 0. 420. 400. in
    let caption,_,_=Text_engine.text_layout engine 2 rect "Unchanged caption" in
    ignore (Text_engine.text_layout engine 1 rect "x");
    Gc.full_major ();
    let before=(Gc.stat ()).live_words in
    let previous=Weak.create 1 in
    for length=1 to 200 do
      let text=String.make length 'x' in
      Lui_store.apply_op store (SetProp (1,TextValue,StringValue text));
      ignore (Text_engine.measure_text ~width:420. engine 1 text);
      let layout,_,_=Text_engine.text_layout engine 1 rect text in
      if length=199 then Weak.set previous 0 (Some layout);
      ignore (Text_engine.measure_text engine 1 (String.sub text 0 (length/2)))
    done;
    Gc.full_major ();
    let retained=((Gc.stat ()).live_words-before)*8 in
    Printf.printf "native edited text kind=%s retained %d bytes after 200 updates\n%!"
      (if kind=Text then "rich" else "input") retained;
    verify "Editing retained a superseded paragraph layout" (Weak.get previous 0=None);
    verify "Editing retained more than 2 MiB of layout history" (retained <= 2*1024*1024);
    let disposed=Weak.create 1 in
    (let text=String.make 200 'x' in
     let current,_,_=Text_engine.text_layout engine 1 rect text in
     Weak.set disposed 0 (Some current);
     ignore (Text_engine.measure_text engine 1 (String.sub text 0 100));
     let repeated,_,_=Text_engine.text_layout engine 1 rect text in
     verify "Caret-prefix measurement evicted the current wrapped layout" (current==repeated));
    let repeated_caption,_,_=Text_engine.text_layout engine 2 rect "Unchanged caption" in
    verify "Editing invalidated an unrelated caption layout" (caption==repeated_caption);
    Lui_store.apply_op store (DropNode 1);
    ignore (Text_engine.text_layout engine 2 rect "Unchanged caption");
    Gc.full_major ();
    let live_caption,_,_=Text_engine.text_layout engine 2 rect "Unchanged caption" in
    verify "Editor disposal invalidated the live caption cache" (caption==live_caption);
    verify "A disposed editor retained its current layout" (Weak.get disposed 0=None)
  ) [Text;Input];
  List.iter prerr_endline (List.rev !errors);
  check "Native edited layout ownership failed" (!errors=[]);
  print_endline "native edited layout ownership: OK"

let () =
  let ancestors = Array.init 64 (fun id -> Js.Json.JObject
    ["node-id",Js.Json.JNumber (float id); "class",Js.Json.JString "container wrapper"] ) in
  let snapshot = Js.Json.JObject ["node-id",Js.Json.JNumber 100.;
    "class",Js.Json.JString "text"; "ancestors",Js.Json.JArray ancestors] in
  let before = Gc.allocated_bytes () in
  for _=1 to 100 do
    check "Missing hover selector unexpectedly matched"
      (Dom_ext.closest snapshot ".missing, [data-tooltip]" = None)
  done;
  let allocated = (Gc.allocated_bytes () -. before) /. 100. in
  Printf.printf "native closest on 64 ancestors allocated %.0f bytes/query\n%!" allocated;
  check "Hover closest reparses selectors and copies ancestor paths per candidate"
    (allocated <= 16384.);
  print_endline "native closest allocation: OK"

let () = Native_embed.with_entry_lock (fun () ->
  let store = Lui_store.create () in
  let backend = {backend_profile=profile MacOS GenericHost;
    apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
  let app = Lui_app.create backend Model.initial (fun model _ -> model)
    (fun _ _ _ -> Lui_elements.column ~style_class:"outer block"
      [Lui_elements.column ~style_class:"inner block"
        [Lui_elements.text ~value:"selector target" []]]) in
  ignore (Lui_app.start app); ignore (Lui_app.flush app);
  let target = List.find (fun id -> Lui_store.string_prop store id "text" = Some "selector target")
    (Lui_store.preorder store) in
  let snapshot = Native_embed.ext_snapshot (Lui_app.runtime app) target in
  let nearest = Option.get (Dom_ext.closest snapshot ".block") in
  check "Native closest selects an outer block instead of the nearest block"
    (Dom_ext.str_prop "class" nearest = Some "inner block");
  check "A descendant was incorrectly used as the ancestor of an outer candidate"
    (Dom_ext.closest snapshot ".inner .outer" = None);
  check "Closest lost a valid ancestor selector"
    (Dom_ext.closest snapshot ".outer .inner" <> None);
  ignore (Lui_app.dispose app);
  print_endline "native nearest ancestor selectors: OK")

let () =
  let element id class_ ancestors = Js.Json.JObject
    ["node-id",Js.Json.JNumber (float id); "class",Js.Json.JString class_;
     "ancestors",Js.Json.JArray (Array.of_list ancestors)] in
  let scope = element 200000 "scope" [] in
  let direct = element 200001 "item" [scope] in
  let wrapper = element 200002 "wrapper" [scope] in
  let nested = element 200003 "item" [wrapper;scope] in
  let rows = List.init 1000 (fun id -> element (id+300000) "row item" [scope]) in
  let before = Gc.allocated_bytes () in
  for _=1 to 20 do
    check "Compiled native selector changed query results"
      (List.length (Dom_ext.query_selector_all_scoped ~scope ~els:rows ".item")=1000)
  done;
  let allocated = (Gc.allocated_bytes () -. before) /. 20. in
  Printf.printf "native 1000-row query allocated %.0f bytes/query\n%!" allocated;
  check "Native queries recompile the same selector for each candidate" (allocated <= 262144.);
  let results = Dom_ext.query_selector_all_scoped ~scope ~els:[direct;wrapper;nested] ":scope > .item" in
  check "A direct-child selector also matched nested descendants" (results=[direct]);
  check "A descendant selector lost nested matches"
    (Dom_ext.query_selector_all_scoped ~scope ~els:[direct;wrapper;nested] ":scope .item"
      = [direct;nested]);
  print_endline "native scoped selector compilation: OK"

let () =
  let ancestors = Array.init 64 (fun id -> Js.Json.JObject
    ["node-id",Js.Json.JNumber (float id); "class",Js.Json.JString "container scope"]) in
  let rows = List.init 1000 (fun id -> Js.Json.JObject
    ["node-id",Js.Json.JNumber (float (id+1000)); "class",Js.Json.JString "row item";
     "ancestors",Js.Json.JArray ancestors]) in
  let scope = ancestors.(63) in
  List.iter (fun (selector,expected) ->
    let before = Gc.allocated_bytes () in
    for _=1 to 20 do
      check "Native deep query changed matching results"
        (List.length (Dom_ext.query_selector_all_scoped ~scope ~els:rows selector)=expected)
    done;
    let allocated = (Gc.allocated_bytes () -. before) /. 20. in
    Printf.printf "native 1000-row deep query %s allocated %.0f bytes/query\n%!"
      selector allocated;
    check "Native queries copied ancestor paths that matching did not need"
      (allocated <= 262144.)
  ) [".item",1000; ".ui__dropdown-menu-content",0; ".scope .missing",0;
      ".missing, .ui__dropdown-menu-content",0];
  print_endline "native unused query ancestry allocation: OK"

let () = Native_embed.with_entry_lock (fun () ->
  let previous_app = !Native_embed.current_app in
  let previous_editor = !Editor_state.st in
  let previous_elements = !Dom_ext.doc_elements_provider in
  let previous_pending = !Editor_state.structure_pending in
  let previous_edit_input = !Editor_state.last_edit_input_ms in
  let previous_ui_input = !Worker_events.last_ui_input_ms in
  let failures = ref [] in
  let verify label condition = if not condition then failures := label :: !failures in
  let queries = ref 0 in
  let now = 100000. in
  let with_page popup run =
    Editor_state.st := None;
    Editor_state.structure_pending := false;
    Editor_state.last_edit_input_ms := 0.;
    Worker_events.last_ui_input_ms := 0.;
    let store = Lui_store.create () in
    let backend = {backend_profile=profile MacOS GenericHost;
      apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
    let app = Lui_app.create backend Model.initial (fun model _ -> model)
      (fun context _ _ ->
        Editor_state.ensure context;
        let overlays = match popup with
          | None -> []
          | Some (id,cls) -> [Lui_elements.box ~accessibility_identifier:id ~style_class:cls []] in
        Lui_elements.column
          (List.init 1000 (fun _ -> Lui_elements.text ~value:"reload row" []) @ overlays)) in
    Native_embed.current_app := Some app;
    Fun.protect ~finally:(fun () ->
      ignore (Lui_app.dispose app);
      Native_embed.invalidate_stale_snapshots (Lui_app.runtime app)) (fun () ->
      ignore (Lui_app.start app); ignore (Lui_app.flush app);
      ignore (Native_embed.collect_elements ());
      run ())
  in
  Fun.protect ~finally:(fun () ->
    Native_embed.current_app := previous_app;
    Editor_state.st := previous_editor;
    Dom_ext.doc_elements_provider := previous_elements;
    Editor_state.structure_pending := previous_pending;
    Editor_state.last_edit_input_ms := previous_edit_input;
    Worker_events.last_ui_input_ms := previous_ui_input) (fun () ->
    Dom_ext.doc_elements_provider := (fun () -> incr queries; Native_embed.collect_elements ());
    with_page None (fun () ->
      let editor = Editor_state.mk_editing ~uuid:"reload-test-editor"
        ~buffer:"" ~base:"" ~scope:"main" () in
      let check_busy label ~editing ~pending ~edit_age ~pointer_age ~reload_age =
        Editor_state.set_silent (fun state ->
          {state with editing=(if editing then Some editor else None)});
        Editor_state.structure_pending := pending;
        Editor_state.last_edit_input_ms := now -. edit_age;
        Worker_events.last_ui_input_ms := now -. pointer_age;
        let queried = !queries and before = Gc.allocated_bytes () in
        for _=1 to 20 do
          verify (label ^ " must defer reload")
            (Worker_events.ui_busy ~now ~last_fire:(now -. reload_age))
        done;
        let allocated = (Gc.allocated_bytes () -. before) /. 20. in
        Printf.printf "native busy reload %s allocated %.0f bytes/check\n%!" label allocated;
        verify (label ^ " scans popup nodes despite an existing reload guard") (!queries=queried);
        verify (label ^ " allocates a document query despite an existing reload guard")
          (allocated <= 4096.)
      in
      check_busy "structure pending" ~editing:false ~pending:true
        ~edit_age:1000. ~pointer_age:1000. ~reload_age:9000.;
      check_busy "active typing" ~editing:true ~pending:false
        ~edit_age:1. ~pointer_age:1000. ~reload_age:9000.;
      check_busy "edit throttle" ~editing:true ~pending:false
        ~edit_age:1000. ~pointer_age:1000. ~reload_age:1.;
      check_busy "recent pointer" ~editing:true ~pending:false
        ~edit_age:1000. ~pointer_age:1. ~reload_age:9000.;
      Editor_state.last_edit_input_ms := now -. Worker_events.edit_input_idle_ms;
      Worker_events.last_ui_input_ms := now -. Worker_events.edit_input_idle_ms;
      verify "Expired interaction guards must allow an unobstructed reload"
        (not (Worker_events.ui_busy ~now ~last_fire:(now -. Worker_events.edit_reload_min_ms)));
      Editor_state.set_silent (fun state -> {state with editing=None});
      Worker_events.last_ui_input_ms := now;
      verify "Pointer activity without an editor must not throttle reload"
        (not (Worker_events.ui_busy ~now ~last_fire:now)));
    List.iter (fun popup -> with_page (Some popup) (fun () ->
      verify "An open popup must still block an otherwise idle reload"
        (Worker_events.ui_busy ~now ~last_fire:0.)))
      ["ui__ac",""; "reload-popup","cp__cmdk__modal";
       "reload-popup","ui__popover-content"; "reload-popup","ls-context-menu-content";
       "date-time-picker",""; "reload-popup","ls-editor-link-form";
       "reload-popup","ls-property-dialog"]);
  List.iter prerr_endline (List.rev !failures);
  check "Native reload deferral must preserve guards without redundant popup scans" (!failures=[]);
  print_endline "native reload deferral allocation: OK")

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


let () = Native_embed.with_entry_lock (fun () ->
  let module W = Wire in
  let failures = ref [] in
  let expect message condition = if not condition then failures := Failure message :: !failures in
  let old_read = !Runtime.read_model and old_send = !Runtime.app_send
  and old_flush = !Runtime.app_flush and old_state = !Editor_state.st
  and old_page = !Runtime.current_page and old_journals = !Runtime.current_journals
  and old_route = !Runtime.current_route and old_hooks = !Subs.hooks in
  Fun.protect ~finally:(fun () ->
    Runtime.read_model := old_read; Runtime.app_send := old_send;
    Runtime.app_flush := old_flush; Editor_state.st := old_state;
    Runtime.current_page := old_page; Runtime.current_journals := old_journals;
    Runtime.current_route := old_route; Subs.hooks := old_hooks;
    Subs.clear_pending_deltas (); Page_delta.reset ()) (fun () ->
    List.iter (fun (journals,broadcast) -> try
      Page_delta.apply_queue := None;
      let scheduler = Signal.scheduler () in
      Editor_state.st := Some (Signal.state scheduler Editor_state.initial);
      Runtime.app_flush := (fun () -> Signal.stabilize scheduler);
      Page_delta.reset ();
      let first = { (Model.empty_block ~uuid:"first" ~title:"first" ~is_page:false)
        with Model.block_order = Some "a0" } in
      let pending = Model.empty_block ~uuid:"second" ~title:"" ~is_page:false in
      let summary = Option.get (Decode.page_of_summary
        (W.Map [W.Keyword "block/uuid",W.Uuid "page";
                W.Keyword "block/title",W.String "page"])) in
      let page = { summary with Model.page_blocks = [first;pending] } in
      let route = if journals then Model.Journals else Model.Page "page" in
      let model = ref {Model.initial with route;
        route_page=(if journals then None else Some page);
        journals=(if journals then [page] else [])} in
      Runtime.read_model := (fun () -> !model);
      Runtime.current_route := Some route;
      Runtime.current_page := (if journals then None else Some page);
      Runtime.current_journals := (if journals then [page] else []);
      Runtime.app_send := (function
        | Action.Page_loaded value ->
          model := {!model with Model.route_page=Some value};
          Runtime.current_page := Some value; true
        | Action.Journals_spliced values ->
          model := {!model with Model.journals=values};
          Runtime.current_journals := values; true
        | _ -> failwith "Unexpected action in optimistic splice regression");
      let current () = if journals then List.hd (!model).Model.journals
        else Option.get (!model).Model.route_page in
      let delta rev uuid order = W.Map
        [W.Keyword "rev",W.Int rev;
         W.Keyword "blocks",W.Map [W.Uuid uuid,W.Map
           [W.Keyword "block/uuid",W.Uuid uuid;
            W.Keyword "block/title",W.String "";
            W.Keyword "block/order",W.String order]];
         W.Keyword "deleted",W.Map [];
         W.Keyword "children",W.Map [W.Uuid "page",W.Map
           [W.Keyword "base-rev",W.Int (rev-1);
            W.Keyword "remove",W.Array [];
            W.Keyword "upsert",W.Array [W.Array [W.Uuid uuid;W.String order]]]]] in
      let errors = ref [] in
      let hold = ref true and release = ref None and reloads = ref 0 in
      let publish page =
        model := {!model with Model.route_page=Some page};
        Runtime.current_page := Some page in
      let publish_journals pages =
        model := {!model with Model.journals=pages};
        Runtime.current_journals := pages in
      Subs.install_hooks
        { reload=(fun () -> incr reloads);
          refresh_page_side=(fun _ -> ()); prune_overrides=(fun _ -> ());
          invalidate_pull_uuids=(fun _ -> ()); invalidate_pull_caches=(fun () -> ());
          fire_db_hooks=(fun _ -> ()); ui_busy=(fun ~now:_ ~last_fire:_ -> false);
          schedule=(fun _ -> ()); publish_page=publish; publish_journals;
          refetch_page=(fun _ -> failwith "Unexpected refetch in optimistic splice");
          resync_editing=(fun () -> ());
          helpers_of=(fun _ ->
            { Page_delta.resolve=(fun blocks ->
                if !hold then begin
                  hold := false;
                  let task,resolve,_ = Ui_task.pending () in
                  release := Some (fun () -> resolve blocks); task
                end else Ui_task.resolve blocks);
              fill_embeds=Ui_task.resolve; merge_collapsed=(fun _ _ -> ());
              refresh_page_fields=Ui_task.resolve }) };
      let complete () =
        Option.iter (fun resolve -> release := None; resolve ()) !release;
        Host.drain () in
      let start value =
        let task = if broadcast then begin
          Subs.pending_deltas := [value];
          Subs.pending_unknown_delta := false;
          Subs.pending_apply_template := false;
          Subs_state.promise_of_task (Subs.apply_pending ())
        end else
          Outliner_ops.refresh_via_delta (Some (W.Map [W.Keyword "delta",value])) in
        ignore (Js.Promise.catch (fun error -> errors := error :: !errors;
          Js.Promise.resolve ()) task) in
      start (delta 1 "second" "a1");
      check "Splice must be pending while optimistic input arrives"
        (not (Page_delta.already_applied 1));
      let later = Model.empty_block ~uuid:"third" ~title:"" ~is_page:false in
      let optimistic = Option.get (Model.split_insert (current ()) ~uuid:"second"
        ~before:"" ~new_block:later ~sibling:true) in
      if journals then begin
        model := {!model with Model.journals=[optimistic]};
        Runtime.current_journals := [optimistic]
      end else begin
        model := {!model with Model.route_page=Some optimistic};
        Runtime.current_page := Some optimistic
      end;
      Editor_state.set (fun state -> {state with Editor_state.editing=Some
        (Editor_state.mk_editing ~uuid:"third" ~buffer:"unsaved" ~scope:"main"
          ~base:"" ())});
      complete ();
      start (delta 2 "third" "a2");
      Host.drain ();
      List.iter (fun error -> raise error) !errors;
      let blocks = (current ()).Model.page_blocks in
      expect ((if broadcast then "Broadcast " else "Operation ") ^
        (if journals then "journals" else "page") ^
        " splice lost an Enter commit during optimistic input")
        (List.map (fun (block:Model.block) -> block.block_uuid,block.block_order) blocks
          = [Some "first",Some "a0";Some "second",Some "a1";Some "third",Some "a2"]);
      expect "Splice must preserve the latest editor and its unsaved input"
        (match Editor_state.editing () with Some edit -> edit.uuid="third" && edit.buffer="unsaved"
         | None -> false);
      Page_delta.apply_queue := None;
      Page_delta.reset ();
      hold := true;
      start (delta 3 "second" "a1");
      Page_delta.reset ();
      let loaded = { (current ()) with Model.page_title="reloaded" } in
      if journals then begin
        model := {!model with Model.journals=[loaded]};
        Runtime.current_journals := [loaded]
      end else begin
        model := {!model with Model.route_page=Some loaded};
        Runtime.current_page := Some loaded
      end;
      complete ();
      expect "Successful splices must not reload the route" (!reloads = 0);
      List.iter (fun error -> raise error) !errors;
      expect "An invalidated splice must not publish over a fresh load" (current () == loaded);
      expect "An invalidated splice must not mark its revision applied"
        (not (Page_delta.already_applied 3))
    with error -> failures := error :: !failures) [true,false;false,false;true,true;false,true];
    List.iter (fun error -> prerr_endline (Printexc.to_string error)) (List.rev !failures);
    if !failures <> [] then failwith "Optimistic Enter commit ordering failed"));
  print_endline "native optimistic Enter commit ordering: OK"
