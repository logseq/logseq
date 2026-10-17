module Lui_text = Host_platform.Text

open Lui_protocol

external register_fixture_fonts : string -> unit = "logseq_native_register_fonts"
let () = Option.iter register_fixture_fonts (Sys.getenv_opt "LOGSEQ_NATIVE_FONT_DIR")

let check message condition = if not condition then failwith message

let () =
  let failures = ref [] in
  let expect message condition = if not condition then failures := message :: !failures in
  let host = Lui_host.create ~hooks:Lui_paint.default_hooks
    ~layout:(module Lui_layout) ~measure:(fun _ _ _ _ -> Some (80.,20.))
    ~renderer:{Lui_host.name="menu-chrome-test"; render=(fun _ -> Bytes.empty)}
    ~width:1440 ~height:932 ~scale:1. () in
  let app = Lui_app.create (Lui_host.backend host (profile MacOS GenericHost)) ()
    (fun () () -> ()) (fun _ _ _ ->
      Lui_elements.column
        [Lui_elements.button ~height:32 ~text:"Menu" [];
         Ui_components.menu_card ~key:"chrome-menu" ~anchor:`below
           ~anchor_alignment:`end_ ~on_dismiss:(fun _ -> ())
           (List.init 11 (fun i -> Menu_item.el ~key:(string_of_int i)
              ~label:(string_of_int i) ~on_click:ignore ()));
         Ui_components.menu_surface
           (Lui_elements.popover ~key:"point-menu" ~at:(100.,40.) ~role:`menu
              ~width:256
              [Menu_item.el ~key:"point-item" ~label:"Action" ~on_click:ignore ()])]) in
  ignore (Lui_app.start app); ignore (Lui_app.flush app);
  let store = Lui_host.store host in
  let menu = List.find (fun id -> Lui_store.kind store id="dropdown-menu")
    (Lui_store.preorder store) in
  let item = List.find (fun id -> Lui_store.kind store id="menu-item")
    (Lui_store.preorder store) in
  List.iter (fun mode ->
    let snapshot = Ui_theme.snapshot mode in
    Theme_vars.install_snapshot (Yojson.Safe.to_string (`Assoc
      ["mode",`String (if mode=Ui_theme.Dark then "dark" else "light");
       "vars",`Assoc (List.map (fun (k,v) -> k,`String v) snapshot.vars)]));
    Theme_vars.set_dark (mode=Ui_theme.Dark);
    List.iter (fun (name,state) ->
      let ink = ref None in
      let scene = Lui_scene.create
        ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:1 ~h:1)
        ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:1 ~h:1) in
      let item_rect = Lui_scene.rect 0. 0. 200. 32. in
      Lui_paint.paint {Lui_paint.default_hooks with
        color_of=Theme_vars.color_of;
        layout=(fun id -> Lui_paint.placement_of_rect
          (if id=item then item_rect else Lui_scene.rect 0. 0. 240. 400.));
        state_of=(fun id -> if id=item then state else Lui_paint.state_neutral);
        text_ops=(fun id _ color _ -> if id=item then ink:=Some color; [])}
        store scene ~width:1440 ~height:932 ~scale:1.
        ~clear:(Lui_scene.color 255 255 255 255);
      let expected = Option.get (Theme_vars.color_of "var(--lx-gray-05)") in
      expect ("Menu " ^ name ^ " does not use the application's neutral highlight")
        (List.exists (function Lui_scene.Fill f -> f.frect=item_rect && f.fcolor=expected
           | _ -> false) scene.ops);
      expect ("Menu " ^ name ^ " inverts its foreground on a neutral highlight")
        (!ink=Theme_vars.color_of "foreground"))
      ["pointer",{Lui_paint.state_neutral with hovered=true};
       "keyboard",{Lui_paint.state_neutral with hovered=true;focused=true;selected=true}])
    [Ui_theme.Light;Ui_theme.Dark];
  ignore (Lui_host.repaint host);
  let point_menu = List.find (fun id -> Lui_store.kind store id="popover")
    (Lui_store.preorder store) in
  let point_item = List.hd (Lui_store.child_ids store point_menu) in
  let point_box = Option.get (Lui_host.layout_rect host point_menu)
  and point_row = Option.get (Lui_host.layout_rect host point_item) in
  expect "A point menu loses the shared card's five-point content inset"
    (abs_float (point_row.x -. point_box.x -. 5.) < 0.1
     && abs_float (point_row.y -. point_box.y -. 5.) < 0.1);
  let full = Option.get (Lui_host.layout_rect host menu) in
  expect "An ordinary menu truncates entries despite available window height" (full.h >= 360.);
  Lui_host.resize host ~width:1440 ~height:200 ~scale:1.;
  ignore (Lui_host.repaint host);
  let small = Option.get (Lui_host.layout_rect host menu) in
  expect "A menu exceeds its resized window" (small.h <= 184.);
  ignore (Lui_app.dispose app);
  Theme_vars.set_dark false;
  List.iter prerr_endline (List.rev !failures);
  check "Shared menu highlight and available-height parity" (!failures=[]);
  print_endline "native shared menu chrome: OK"

let () =
  let failures = ref [] in
  let expect message condition = if not condition then failures := message :: !failures in
  let shared = Js.Json.JString "row item" in
  let element = Js.Json.JObject
    ["tag",Js.Json.JString "div"; "class",shared; "class",Js.Json.JString "later"] in
  expect "Property lookup changed duplicate-key precedence"
    (Dom_ext.prop "class" element == shared);
  expect "Property lookup changed missing fields" (Dom_ext.prop "missing" element = Js.Json.JNull);
  List.iter (fun value ->
    expect "Property lookup accepts a nonobject as an object"
      (Dom_ext.prop "class" value = Js.Json.JNull))
    [Js.Json.JNull; Js.Json.JString "text"; Js.Json.JBoolean true; Js.Json.JArray [||]];
  let measure name f =
    Gc.full_major ();
    let before = Gc.allocated_bytes () in
    for _ = 1 to 10000 do ignore (Sys.opaque_identity (f ())) done;
    let per_read = (Gc.allocated_bytes () -. before) /. 10000. in
    Printf.printf "native %s allocated %.3f bytes/read\n%!" name per_read;
    expect (name ^ " allocates temporary property wrappers") (per_read < 1.) in
  measure "raw property" (fun () -> Dom_ext.prop "class" element);
  measure "plain class" (fun () -> Dom_ext.class_string element);
  expect "Class matching lost token boundaries"
    (Dom_ext.has_class element "row" && Dom_ext.has_class element "item"
     && not (Dom_ext.has_class element "row item") && not (Dom_ext.has_class element "ow"));
  List.iter (fun class_value ->
    let element = Js.Json.JObject
      ["class",class_value; "attrs",Js.Json.JObject ["class",Js.Json.JString "from-attrs"]] in
    expect "Class lookup lost attributes when its direct value is empty or invalid"
      (Dom_ext.class_string element = "from-attrs"))
    [Js.Json.JNull; Js.Json.JNumber 2.; Js.Json.JString ""];
  expect "Class lookup changed missing class semantics"
    (Dom_ext.class_string (Js.Json.JObject []) = "");
  let node = 987654 in
  let element = Js.Json.JObject ["node-id",Js.Json.JNumber (float node); "class",shared] in
  Fun.protect ~finally:(fun () -> Hashtbl.remove Dom_ext.overlays node) (fun () ->
    let overlay = Dom_ext.overlay_get node in
    overlay.Dom_ext.o_class <- Some "replacement";
    let unrelated = Js.Json.JObject
      ["node-id",Js.Json.JNumber (float (node+1)); "class",shared] in
    measure "class with active overlay" (fun () -> Dom_ext.class_string element);
    measure "class beside active overlay" (fun () -> Dom_ext.class_string unrelated);
    measure "missing attribute with active overlay"
      (fun () -> Dom_ext.overlay_attr element "data-missing");
    measure "attribute beside active overlay"
      (fun () -> Dom_ext.overlay_attr unrelated "data-missing");
    Hashtbl.replace overlay.o_attrs "data-state" (Some "changed");
    expect "Attribute overlay lost its replacement"
      (Dom_ext.overlay_attr element "data-state" = Some (Some "changed"));
    Hashtbl.replace overlay.o_attrs "data-state" None;
    expect "Attribute overlay lost its removal tombstone"
      (Dom_ext.overlay_attr element "data-state" = Some None);
    expect "An overlay without a node id affected unrelated snapshots"
      (Dom_ext.overlay_attr (Js.Json.JObject []) "data-state" = None);
    expect "An invalid overlay node id matched a real node"
      (Dom_ext.overlay_attr (Js.Json.JObject ["node-id",Js.Json.JString "invalid"])
         "data-state" = None);
    expect "A class lookup ignored an overlay replacement"
      (Dom_ext.has_class element "replacement" && not (Dom_ext.has_class element "row"));
    overlay.o_class <- Some "";
    expect "An empty class overlay exposed the snapshot class"
      (Dom_ext.class_string element = ""));
  List.iter prerr_endline (List.rev !failures);
  check "Native property lookup semantics and allocation" (!failures = []);
  print_endline "native property lookup allocation: OK"

let () =
  List.iter (fun (title,reference,expected) ->
    check "Block reference search changed substring semantics"
      (Tree.contains_sub title reference = expected))
    ["","",true; "title","",true; "","[[ref]]",false;
     "before [[ref]] after","[[ref]]",true; "((ref))","[[ref]]",false;
     "[[ref]] suffix","[[ref]]",true; "prefix [[ref]]","[[ref]]",true;
     "aaaaab","aaab",true; "aaa","aaaa",false;
     "é [[引用]] text","[[引用]]",true;
     "a\000b","\000b",true];
  let title = String.make 32768 'x' in
  let reference = "[[8fb00cfb-ec54-48e8-8523-323635577438]]" in
  let with_reference = title ^ reference in
  List.iter (fun (name,title,expected) ->
    Gc.full_major ();
    let before = Gc.allocated_bytes () in
    for _ = 1 to 20 do
      check "Long block reference search changed its result"
        (Tree.contains_sub title reference = expected)
    done;
    let allocated = (Gc.allocated_bytes () -. before) /. 20. in
    Printf.printf "native block reference %s allocated %.0f bytes/search\n%!" name allocated;
    check "Block reference search copies text at each candidate position"
      (allocated < 512.))
    ["missing",title,false; "trailing",with_reference,true];
  print_endline "native block reference search allocation: OK"

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

let () =
  let store = Lui_store.create () and ui = Lui_window.Ui.create () in
  let rects = Lui_window.Rects.create () in
  List.iter (Lui_store.apply_op store)
    [
      CreateNode (1, Scroll);
      CreateNode (2, Column);
      CreateExtension (3, "logseq-editor", "focus-scroll");
      InsertChild (1, 2, 0);
      InsertChild (2, 3, 0);
      SetExtensionProp (3, "block-id", StringValue "focus-scroll");
    ];
  Hashtbl.replace rects 1 (Lui_scene.rect 0. 0. 800. 600.);
  Lui_window.Ui.set_content_rect ui (Lui_window.Rects.get rects);
  Lui_window.Ui.set_scroll_cap ui 1 400.;
  let env : Host_requests.env =
    {
      store;
      ui;
      rects;
      rect_of = Lui_window.Rects.get rects;
      scale = (fun () -> 1.);
      measure = (fun _ _ -> (0., 0.));
      text_layout = (fun _ _ -> failwith "Unexpected text layout");
      apply_batch = (fun _ -> ());
      apply_actions = (fun _ -> ());
      set_ime_rect = (fun _ -> ());
      focused_text_input = (fun _ -> ());
      repaint = (fun () -> ());
    }
  in
  let old_env = !Host_requests.env
  and old_focus = !Host_requests.editor_focus_bid
  and old_pending = !Host_requests.pending_focus
  and old_reveal = !Host_requests.pending_focus_reveal in
  Fun.protect
    ~finally:(fun () ->
      ignore (Host_requests.try_set_input_focus env "focus-scroll" false);
      Host_requests.env := old_env;
      Host_requests.editor_focus_bid := old_focus;
      Host_requests.pending_focus := old_pending;
      Host_requests.pending_focus_reveal := old_reveal)
    (fun () ->
      Host_requests.env := Some env;
      Host_requests.editor_focus_bid := None;
      Host_requests.pending_focus := [];
      check "The mounted editor did not accept focus"
        (Host_requests.try_set_input_focus env "focus-scroll" true);
      Host_requests.flush_pending_focus ();
      check "Focus scrolled using an unmeasured editor rectangle"
        (Lui_window.Ui.scroll_offset ui 1 = 0.);
      Hashtbl.replace rects 2 (Lui_scene.rect 0. 900. 800. 40.);
      Lui_window.Ui.notify_layout ui;
      Host_requests.flush_pending_focus ();
      check
        "A newly focused editor below the viewport was not revealed after \
         layout"
        (Lui_window.Ui.scroll_offset ui 1 = 340.);
      ignore (Lui_window.Ui.scroll_to ui store 1 0.);
      Host_requests.flush_pending_focus ();
      check "Idle focus recovery undid a manual scroll"
        (Lui_window.Ui.scroll_offset ui 1 = 0.);
      ignore (Host_requests.try_set_input_focus env "focus-scroll" true);
      ignore (Host_requests.try_set_input_focus env "focus-scroll" false);
      Lui_store.apply_op store (DropNode 3);
      Host_requests.flush_pending_focus ();
      check "A blurred editor retained a pending scroll request"
        (Lui_window.Ui.scroll_offset ui 1 = 0.));
  print_endline "native deferred focus reveal: OK"

let () = Native_embed.with_entry_lock (fun () ->
  Platform.install_ui_services ~assert_owner:Native_embed.assert_entry_owner
    ~request_flush:Runtime.flush ~dom:Ui_dom_native.ops
    ~timers:Ui_dom_native.timers ~files:Ui_dom_native.files;
  List.iter (fun (source, expected) ->
    check "Native command-palette spacing must preserve UTF-8 text"
      (Cmdk_view.display_spaces source = expected))
    [ "Oct 17th, 2026", "Oct\xc2\xa017th,\xc2\xa02026"
    ; "中文 café 😀", "中文\xc2\xa0café\xc2\xa0😀"
    ; "a\xc2\xa0b  c", "a\xc2\xa0b\xc2\xa0\xc2\xa0c"
    ; "", "" ];
  Keyboard_capture.install ();
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
  let inner = find_class "left-sidebar-inner" in
  let splits = List.filter (fun id -> Lui_store.kind store id="split")
    (Lui_store.preorder store) in
  let left_split = List.find (fun id -> Lui_store.parent store sidebar=Some id) splits in
  Lui_layout.sync ~scale:2. ~width:2880. ~height:1800. layout store;
  let expanded = (Option.get (Lui_layout.rect layout inner)).Lui_scene.w in
  let expanded_value=Option.get (Lui_store.float_prop store left_split "value") in
  Lui_store.apply_op store (SetProp (left_split,ProgressValue,FloatValue 0.03));
  Lui_layout.sync ~scale:2. ~width:2880. ~height:1800. layout store;
  let contracted = (Option.get (Lui_layout.rect layout inner)).Lui_scene.w in
  check "Narrowing the sidebar reflows its text and titlebar controls together"
    (contracted >= expanded -. 2.);
  Lui_store.apply_op store (SetProp (left_split,ProgressValue,FloatValue expanded_value));
  Lui_layout.sync ~scale:2. ~width:2880. ~height:1800. layout store;
  let right_split = Option.get (Lui_store.parent store left_split) in
  let right_value = Option.get (Lui_store.float_prop store right_split "value") in
  let right_sidebar = List.find (fun id ->
    Lui_store.string_prop store id "accessibility-identifier" = Some "right-sidebar")
    (Lui_store.preorder store) in
  Lui_store.apply_op store (SetProp (right_split,ProgressValue,FloatValue 0.7));
  List.iter (fun (split,pane,endpoint) ->
    Lui_layout.sync ~scale:2. ~width:2880. ~height:1800. layout store;
    let rects = Lui_window.Rects.create () in
    List.iter (fun id -> Option.iter (Hashtbl.replace rects id)
      (Lui_layout.rect layout id)) (Lui_store.preorder store);
    let first = List.hd (Lui_store.child_ids store split) in
    let first_rect = Lui_window.Rects.get rects first in
    let x = (first_rect.x +. first_rect.w +. 3.) /. 2. in
    let ui = Lui_window.Ui.create () in
    Lui_window.Ui.set_scale ui 2.;
    ignore (Lui_window.Ui.handle ui store rects
      (Lui_window.Input.Button_down (x,200.,Lui_window.Input.Left,1,Lui_window.Input.mods_none)));
    ignore (Lui_window.Ui.handle ui store rects
      (Lui_window.Input.Button_up (endpoint,200.,Lui_window.Input.Left,Lui_window.Input.mods_none)));
    Lui_layout.sync ~scale:2. ~width:2880. ~height:1800. layout store;
    check (Printf.sprintf "Dragging native sidebar %d leaves %.1f points (split %d, value %.4f)"
      pane ((Option.get (Lui_layout.rect layout pane)).Lui_scene.w /. 2.) split
      (Option.get (Lui_store.float_prop store split "value")))
      ((Option.get (Lui_layout.rect layout pane)).Lui_scene.w >= 479.);
    Lui_store.apply_op store (SetProp (left_split,ProgressValue,FloatValue expanded_value));
    Lui_store.apply_op store (SetProp (right_split,ProgressValue,FloatValue 0.7)))
    [left_split,sidebar,-2000.;right_split,right_sidebar,3000.];
  Lui_store.apply_op store (SetProp (right_split,ProgressValue,FloatValue right_value));
  Lui_layout.sync ~scale:2. ~width:2880. ~height:1800. layout store;
  let shell_scene =
    Lui_scene.create
      ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:1 ~h:1)
      ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:1 ~h:1)
  in
  let sidebar_surface mode override =
    let snapshot = Ui_theme.snapshot mode in
    let vars = match override with
      | None -> snapshot.Ui_theme.vars
      | Some value -> ("--left-sidebar-bg-color", value)
          :: List.remove_assoc "--left-sidebar-bg-color" snapshot.vars
    in
    Theme_vars.install_snapshot (Yojson.Safe.to_string (`Assoc
      ["mode", `String (if mode = Ui_theme.Dark then "dark" else "light");
       "vars", `Assoc (List.map (fun (key, value) -> key, `String value) vars)]));
    Theme_vars.set_dark (mode = Ui_theme.Dark);
    Lui_paint.paint
      { Lui_paint.default_hooks with
        layout = Lui_layout.layout_hook layout; color_of = Theme_vars.color_of }
      store shell_scene ~width:2880 ~height:1800 ~scale:2.
      ~clear:(Lui_scene.color 255 255 255 255);
    let expected = Option.get (Theme_vars.color_of "var(--left-sidebar-bg-color)") in
    let region = Option.get (Lui_layout.rect layout inner) in
    check "Native sidebar must paint the same semantic surface as the Web theme"
      (List.exists (function
        | Lui_scene.Fill fill -> fill.frect = region && fill.fcolor = expected
        | _ -> false) shell_scene.ops)
  in
  sidebar_surface Ui_theme.Light None;
  sidebar_surface Ui_theme.Dark None;
  sidebar_surface Ui_theme.Light (Some "#e3f1e9");
  let snapshot = Ui_theme.snapshot Ui_theme.Light in
  Theme_vars.install_snapshot (Yojson.Safe.to_string (`Assoc
    ["mode", `String "light";
     "vars", `Assoc (List.map (fun (key, value) -> key, `String value) snapshot.vars)]));
  Theme_vars.set_dark false;
  let retained = Lui_retained.create () in
  ignore (Lui_retained.tick retained ~now:0.);
  let paint_hooks =
    { Lui_paint.default_hooks with layout = Lui_layout.layout_hook layout }
  in
  Lui_retained.paint_retained retained paint_hooks store shell_scene ~width:2880
    ~height:1800 ~scale:2.
    ~clear:(Lui_scene.color 255 255 255 255)
    ();
  let idle_motion = Lui_retained.animating retained in
  ignore (Lui_retained.tick retained ~now:0.25);
  Lui_retained.paint_retained retained paint_hooks store shell_scene ~width:2880
    ~height:1800 ~scale:2.
    ~clear:(Lui_scene.color 255 255 255 255)
    ();
  check "The idle overlay carrier casts a full-window popup shadow"
    (not
       (List.exists
          (function
            | Lui_scene.Shadow shadow ->
                shadow.scast.w >= 2878. && shadow.scast.h >= 1798.
            | _ -> false)
          shell_scene.ops));
  check "The permanent overlay carrier schedules popup animation while idle"
    (not idle_motion);
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
  check "Closed native sidebar must suspend retained subtree interaction"
    (Lui_store.bool_prop store sidebar "inert");
  check "Closed native sidebar controls must leave the focus sequence"
    (List.for_all (fun id -> not (Lui_query.is_desc store id sidebar))
       (Lui_focus.focusables store ~scope:None));
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
  let failures = ref [] in
  let expect message condition = if not condition then failures := message :: !failures in
  List.iter (fun source ->
    let store = Lui_store.create () in
    let backend = {backend_profile=profile MacOS GenericHost;
      apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
    let registry = Lui_extension.registry () in
    Logseq_editor.register registry;
    let model = Edit_model.select (Edit_model.create source)
        ~anchor:(String.length source) ~focus:(String.length source) in
    let app = Lui_app.create_with_extensions backend registry model (fun _ next -> next)
        (fun context model _ ->
          let frame = Signal.state context.Lui_ui.ui_scheduler Edit_input.empty_frame in
          Edit_view.view ~model ~frame:(Signal.value frame) ~block_id:"caret-end"
            ~on_input:(fun _ -> ()) ~cls:"") in
    ignore (Lui_app.start app); ignore (Lui_app.flush app);
    let layout = Lui_layout.create () in
    let scene = Lui_scene.create
        ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:64 ~h:64)
        ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:64 ~h:64) in
    let current_scale = ref 2. in
    let engine = Text_engine.create ~scene:(fun () -> scene)
        ~scale:(fun () -> !current_scale) ~store:(fun () -> store) in
    let rect_of id = Option.get (Lui_layout.rect layout id) in
    let env : Host_requests.env =
      {store; ui=Lui_window.Ui.create (); rects=Lui_window.Rects.create (); rect_of;
       scale=(fun () -> !current_scale); measure=Text_engine.measure_text engine;
       text_layout=(fun id text -> Text_engine.text_layout engine id (rect_of id) text);
       apply_batch=(fun _ -> ()); apply_actions=(fun _ -> ()); set_ime_rect=(fun _ -> ());
       focused_text_input=(fun _ -> ()); repaint=(fun () -> ())} in
    List.iter (fun (scale,width) ->
      current_scale := scale;
      Lui_layout.sync ~scale ~width ~height:1600.
        ~measure:(fun id text width _ -> Some (Text_engine.measure_text ~width engine id text))
        layout store;
      let ctx = Option.get (Host_requests.ed_ctx env "caret-end") in
      let last = Array.length ctx.nodes - 1 in
      let previous = last - 1 in
      let content_end = previous >= 0 &&
        let lo,hi = ctx.runs.(previous) in
        hi = String.length source && hi > lo in
      if content_end then begin
        let node = ctx.nodes.(previous) in
        let text = Option.get (Lui_store.string_prop store node "text") in
        let shaped,x0,y0 = env.text_layout node text in
        let expected = Lui_text.caret_rect shaped (String.length text) in
        let x,y,h = Host_requests.caret_rect env ctx (String.length source) in
        expect "Native line-end caret must follow the final visual glyph, not the landing span"
          (abs_float (x -. (x0 +. expected.rx *. scale -. ctx.ox)) < 0.01
           && abs_float (y -. (y0 +. expected.ry *. scale -. ctx.oy)) < 0.01
           && abs_float (h -. expected.rh *. scale) < 0.01)
      end else begin
        let x,y,h = Host_requests.caret_rect env ctx (String.length source) in
        let pad = rect_of ctx.nodes.(last) in
        expect "An empty logical line keeps its own caret landing position"
          (h > 0. && abs_float (x -. (pad.x -. ctx.ox)) < 0.01
           && y >= pad.y -. ctx.oy)
      end) [2.,320.; 1.,320.; 2.,1200.; 2.,320.];
    ignore (Lui_app.dispose app))
    [String.concat " " (List.init 12 (fun _ -> "wrapped editor text"));
     "plain **bold** tail"; "plain [[Page]]"; "你好，编辑器。你好，光标。你好，换行。";
     ""; "first line\n"; "first line\n\n"];
  List.iter prerr_endline (List.rev !failures);
  check "Native editor line-end caret geometry" (!failures = []);
  print_endline "native editor line-end caret geometry: OK")

let () = Native_embed.with_entry_lock (fun () ->
  let store = Lui_store.create () in
  let backend = {backend_profile=profile MacOS GenericHost;
    apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
  let previous_flush = !Runtime.app_flush in
  let app = Lui_app.create backend () (fun () () -> ())
      (fun context _ _ ->
        let state value = Signal.state context.Lui_ui.ui_scheduler value in
        let st : Sidebar_state.t =
          {favorites=state []; recents=state []; nav_checked=state [];
           nav_tag_titles=state []; items=state [];
           open_menu=state ""; groups_collapsed=state [];
           left_fraction=state 0.2; right_fraction=state 0.3; viewport_w=state 1440.} in
        Left_sidebar_view.content_group st ~key:"native-recent" ~class_:"recent"
          ~label:"Recent" ~items_sig:(Signal.value st.recents)
          ~li_class:"recent-item" ~ul_class:"" ~always_bd:true ~recent:true) in
  ignore (Lui_app.start app); ignore (Lui_app.flush app);
  Runtime.app_flush := (fun () -> ignore (Lui_app.flush app));
  let has_class id name =
    match Lui_store.string_prop store id "style-class" with
    | Some value -> List.mem name (String.split_on_char ' ' value)
    | None -> false in
  let body () = List.exists (fun id -> has_class id "bd") (Lui_store.preorder store) in
  let header = List.find (fun id -> has_class id "hd") (Lui_store.preorder store) in
  let label = List.find (fun id -> has_class id "wrap-th") (Lui_store.preorder store) in
  let failures = ref [] in
  let expect message value = if not value then failures := message :: !failures in
  expect "An empty expanded Recent retains its list body" (body ());
  expect "Sidebar group labels match the reference opacity"
    (Lui_store.float_prop store label "opacity" = Some 0.5);
  for _ = 1 to 2 do
    ignore (Lui_app.dispatch_event app (Press header)); ignore (Lui_app.flush app);
    expect "Collapsed native sidebar groups must remove their content" (not (body ()));
    expect "Collapsing a sidebar group must retain its header" (Lui_store.mem store header);
    ignore (Lui_app.dispatch_event app (Press header)); ignore (Lui_app.flush app);
    expect "Reopening a native sidebar group restores its content" (body ())
  done;
  Runtime.app_flush := previous_flush;
  ignore (Lui_app.dispose app);
  List.iter prerr_endline (List.rev !failures);
  check "Native sidebar group collapse and style" (!failures = []);
  print_endline "native sidebar group collapse and style: OK")

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

let () =
  Native_embed.with_entry_lock (fun () ->
      let store = Lui_store.create ()
      and outer_end = ref 0
      and inner_end = ref 0 in
      let old_parent = !Platform.dom_parent_of in
      let backend =
        {
          backend_profile = profile MacOS GenericHost;
          apply_batch =
            (fun batch ->
              Lui_store.apply_batch store batch;
              true);
        }
      in
      let registry = Lui_extension.registry () in
      Logseq_el.register_all registry;
      Logseq_codemirror.register registry;
      let app =
        Lui_app.create_with_extensions backend registry Model.initial
          (fun model _ -> model)
          (fun _ _ _ ->
            Virt_list.list ~initial_rows:1
              ~estimate_size:(fun _ -> 800.)
              ~on_end:(fun () -> incr outer_end)
              ~key_of:Fun.id
              ~render:(fun _ ->
                Virt_list.list ~initial_rows:2
                  ~estimate_size:(fun _ -> 40.)
                  ~on_end:(fun () -> incr inner_end)
                  ~key_of:Fun.id
                  ~render:(fun name ->
                    Lui_elements.column ~height:40
                      [ Lui_elements.text ~value:name [] ])
                  [| "first"; "second" |])
              [| "day" |])
      in
      Fun.protect
        ~finally:(fun () ->
          ignore (Lui_app.dispose app);
          Platform.dom_parent_of := old_parent)
        (fun () ->
          Platform.dom_parent_of := Lui_store.parent store;
          ignore (Lui_app.start app);
          ignore (Lui_app.flush app);
          let marker key =
            List.find
              (fun id ->
                Lui_store.string_prop store id "attrs"
                = Some ("{\"data-lazy-mount\":\"" ^ key ^ "\"}"))
              (Lui_store.preorder store)
          in
          let day = marker "day"
          and first = marker "first"
          and second = marker "second" in
          let mounted id = Lui_store.children store id <> [] in
          let emit name id =
            Platform.emit_event name
              (Js.Json.JObject
                 [
                   ("nodeId", Js.Json.JNumber (float id));
                   ("height", Js.Json.JNumber 40.);
                 ]);
            ignore (Lui_app.flush app)
          in
          let errors = ref [] in
          let expect message condition =
            if not condition then errors := message :: !errors
          in
          emit "lazy-unmount" first;
          expect
            "A child row leaving the viewport disposed its entire journal day"
            (mounted day && Lui_store.mem store second && mounted second);
          expect "A child row overwrote its ancestor's measured height"
            (Lui_store.string_prop store day "height" = Some "auto");
          if mounted day then begin
            expect "The offscreen child row remained mounted"
              (not (mounted first));
            emit "lazy-mount" first;
            expect "The child row failed to remount independently"
              (mounted first);
            let inner_list = Option.get (Lui_store.parent store first) in
            let rec list_container id =
              match Lui_store.string_prop store id "events" with
              | Some events when Platform.event_listed events "virt-end" -> id
              | _ -> list_container (Option.get (Lui_store.parent store id))
            in
            emit "virt-end" (list_container inner_list);
            expect "Nested pagination also loaded its parent list"
              (!inner_end = 1 && !outer_end = 0)
          end;
          List.iter prerr_endline (List.rev !errors);
          check "Native viewport notifications must target their owning row"
            (!errors = [])));
  print_endline "native nested viewport event ownership: OK"

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
    check "Subtree snapshots allocate a redundant traversal list" (allocated <= 224000.);
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
    check "Snapshot refresh allocates a redundant traversal list" (bytes <= 230000.);
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
  let name = "listener-order-regression" in
  let order = ref [] in
  Fun.protect ~finally:(fun () ->
      Hashtbl.remove Platform.capture_listeners name;
      Hashtbl.remove Platform.window_listeners name) (fun () ->
      Platform.add_event_listener ~capture:true name (fun _ ->
          order := !order @ ["recorder"]; Platform.request_stop ());
      Platform.add_event_listener ~capture:true name (fun _ ->
          order := !order @ ["global-shortcut"]);
      Platform.add_event_listener name (fun _ ->
          order := !order @ ["window"]);
      Platform.emit_event name (Js.Json.JObject []);
      check "Earlier keyboard capture must suppress later global shortcuts"
        (!order = ["recorder"]));
  let name = "listener-order-unhandled" in
  order := [];
  Fun.protect ~finally:(fun () ->
      Hashtbl.remove Platform.capture_listeners name;
      Hashtbl.remove Platform.window_listeners name) (fun () ->
      List.iter (fun (capture, label) ->
          Platform.add_event_listener ~capture name (fun _ ->
              order := !order @ [label]))
        [true,"capture-first"; true,"capture-second";
         false,"window-first"; false,"window-second"];
      Platform.emit_event name (Js.Json.JObject []);
      check "Native listeners must retain registration order in each phase"
        (!order = ["capture-first";"capture-second";"window-first";"window-second"]));
  print_endline "native listener registration order: OK"

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
        let result = Some (Text_engine.pad_size store id ~scale (mw,mh)) in
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
        let result = Some (Text_engine.pad_size !current_store id ~scale:!scale_now (mw,mh)) in
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

let () =
  Native_embed.with_entry_lock (fun () ->
      let module A = Lui_window.Assembly in
      let module W = Lui_window in
      let run scale width height =
        let marker = ref 0 in
        let marker_color = Lui_scene.color 219 17 71 255 in
        let painted = ref [] in
        let surface =
          A.create
            ~layout:(module Lui_layout)
            ~scale_cell:(ref scale)
            ~text:
              {
                measure = (fun _ text -> (float (String.length text * 14), 32.));
                text_ops =
                  (fun id rect _ _ ->
                    if id = !marker then
                      Host_interaction.caret_ops ~scale ~color:marker_color rect
                    else []);
                hit_text = (fun _ _ ~lx:_ ~ly:_ ~lw:_ ~lh:_ -> 0);
                caret_ops =
                  (fun _ _ ~lw:_ ~lh:_ ->
                    {
                      W.Ui.c_before = Fun.id;
                      c_after = Fun.id;
                      c_up = Fun.id;
                      c_down = Fun.id;
                      c_rect = (fun _ -> (0., 0., 32.));
                    });
              }
            ~renderer:
              {
                name = "menu-test";
                render =
                  (fun scene ->
                    painted := scene.Lui_scene.ops;
                    Bytes.empty);
              }
            ~width ~height ()
        in
        let host = A.host surface and store = A.store surface in
        let app =
          Lui_app.create
            (Lui_host.backend host (profile MacOS GenericHost))
            ()
            (fun () () -> ())
            (fun ctx _ _ ->
              let label = Signal.state ctx.Lui_ui.ui_scheduler "English" in
              Lui_elements.dialog ~width:560 ~height:400
                [
                  Lui_elements.scroll ~height:368
                    [
                      Lui_elements.column ~padding:16
                        [
                          Lui_elements.spacer ~height:180 [];
                          Settings_view.lang_trigger ~ctx ~key:"menu-viewport"
                            ~height:32 ~st:label;
                        ];
                    ];
                ])
        in
        ignore (Lui_app.start app);
        ignore (Lui_app.flush app);
        let trigger =
          List.find
            (fun id -> Lui_store.kind store id = "select")
            (Lui_store.preorder store)
        in
        ignore (Lui_app.dispatch_event app (Press trigger));
        ignore (Lui_app.flush app);
        ignore (A.store_changed surface);
        let menu =
          List.find
            (fun id -> Lui_store.kind store id = "dropdown-menu")
            (Lui_store.preorder store)
        in
        let items = Lui_store.children store menu in
        let last = Lui_store.node_id (List.hd (List.rev items)) in
        marker := last;
        ignore (A.repaint surface);
        let rect = W.Rects.get (A.rects surface) menu in
        Printf.printf
          "native language menu initial rect=%.1f,%.1f %.1fx%.1f\n%!" rect.x
          rect.y rect.w rect.h;
        check "Language menu must remain inside the viewport"
          (rect.x >= 0. && rect.y >= 0.
          && rect.x +. rect.w <= float width
          && rect.y +. rect.h <= float height);
        check "Language menu must stop growing at 288 logical points"
          (rect.h <= 288. *. scale);
        let key input =
          A.handle surface (W.Input.Key_down (input, W.Input.mods_none, false))
        in
        ignore (key W.Input.End);
        check "The actual select menu does not navigate to its final option"
          (W.Ui.hl_item (A.ui surface) = last);
        ignore (A.repaint surface);
        let final = W.Rects.get (A.rects surface) last in
        check "Keyboard navigation leaves the selected language offscreen"
          (final.y >= rect.y && final.y +. final.h <= rect.y +. rect.h);
        let activation = key W.Input.Return in
        check "Select keyboard activation does not target its final option once"
          (List.length
             (List.filter
                (function W.Dispatch (Press id) -> id = last | _ -> false)
                activation)
          = 1);
        check "Select keyboard activation uses the visible logical coordinates"
          (List.exists
             (function
               | W.Dispatch (PressDetail (id, detail)) when id = last ->
                   detail.x >= final.x /. scale
                   && detail.x <= (final.x +. final.w) /. scale
                   && detail.y >= final.y /. scale
                   && detail.y <= (final.y +. final.h) /. scale
               | _ -> false)
             activation);
        ignore (key W.Input.Home);
        check "The actual select menu does not return to its first option"
          (W.Ui.hl_item (A.ui surface) = Lui_store.node_id (List.hd items));
        ignore (A.repaint surface);
        let shift =
          Host_interaction.scroll_shifts
            ~store:(fun () -> store)
            ~scroll_epoch:(fun () -> W.Ui.scroll_epoch (A.ui surface))
            ~scroll_x:(W.Ui.scroll_offset_x (A.ui surface))
            ~scroll_y:(W.Ui.scroll_offset (A.ui surface))
        in
        ignore (shift last);
        let x = (rect.x +. (rect.w /. 2.)) /. scale
        and y = (rect.y +. (rect.h /. 2.)) /. scale in
        ignore (A.handle surface (W.Input.Move (x, y)));
        ignore (A.handle surface (W.Input.Wheel (0., -2000.)));
        ignore (A.repaint surface);
        check "A tall language menu must scroll to its final option"
          (W.Ui.scroll_offset (A.ui surface) menu > 0.);
        let _, shift_y = shift last in
        check
          "Retained application paint callbacks must observe the current menu \
           scroll offset"
          (shift_y = W.Ui.scroll_offset (A.ui surface) menu);
        let final = W.Rects.get (A.rects surface) last in
        Printf.printf
          "native language menu rect=%.1f,%.1f %.1fx%.1f final=%.1f,%.1f \
           %.1fx%.1f offset=%.1f hit=%b\n\
           %!"
          rect.x rect.y rect.w rect.h final.x final.y final.w final.h
          (W.Ui.scroll_offset (A.ui surface) menu)
          (List.mem last
             (W.hit_path store (A.rects surface)
                ~x:(final.x +. (final.w /. 2.))
                ~y:(final.y +. (final.h /. 2.))));
        check
          "The final language option must be visible and hit-testable after \
           scrolling"
          (final.h > 0. && final.y >= rect.y
          && final.y +. final.h <= rect.y +. rect.h
          && List.mem last
               (W.hit_path store (A.rects surface)
                  ~x:(final.x +. (final.w /. 2.))
                  ~y:(final.y +. (final.h /. 2.))));
        check
          "Scrolling must paint the final language option at its visible hit \
           rectangle"
          (List.exists
             (function
               | Lui_scene.Fill fill ->
                   fill.fcolor = marker_color && fill.frect.y = final.y
               | _ -> false)
             !painted);
        let main_rects = W.Rects.create () in
        Host_interaction.refresh_rects ~store ~base:(A.engine_rect surface)
          ~scroll_x:(W.Ui.scroll_offset_x (A.ui surface))
          ~scroll_y:(W.Ui.scroll_offset (A.ui surface))
          main_rects;
        check
          "The main application hit mirror must preserve popup options outside \
           the dialog scroll clip"
          (List.mem last
             (W.hit_path store main_rects
                ~x:(final.x +. (final.w /. 2.))
                ~y:(final.y +. (final.h /. 2.))));
        ignore (Lui_app.dispose app);
        print_endline "native language menu viewport and scrolling: OK"
      in
      List.iter
        (fun (scale, width, height) -> run scale width height)
        [ (1., 1440, 932); (2., 2880, 1864); (1., 640, 300); (2., 1280, 600) ])

let () =
  let store = Lui_store.create () in
  List.iteri
    (fun i kind ->
      let id = 810000 + i in
      Lui_store.apply_op store (CreateNode (id, kind));
      List.iter
        (fun scale ->
          let r = Lui_scene.rect 0. 0. 16. 16. in
          let image = Host_icons.image_of store scale id r in
          check "Native select must resolve its intrinsic chevron"
            (Option.is_some image);
          let image = Option.get image in
          check "Native select chevron must rasterize at the backing scale"
            (image.iw = int_of_float (16. *. scale)
            && image.ih = int_of_float (16. *. scale));
          check "Native select chevron must contain visible stroke pixels"
            (let visible = ref false in
             for p = 0 to (image.iw * image.ih) - 1 do
               if Bytes.get image.ipix ((p * 4) + 3) <> '\000' then
                 visible := true
             done;
             !visible);
          check "Native select chevron must reuse its cached image"
            (Option.get (Host_icons.image_of store scale id r) == image))
        [ 1.; 2. ])
    [ Select; Combobox ];
  Lui_store.apply_op store (CreateNode (810002, Text));
  check "Ordinary text must not acquire an intrinsic select icon"
    (Host_icons.image_of store 1. 810002 (Lui_scene.rect 0. 0. 16. 16.) = None);
  print_endline "native intrinsic select icons: OK"

let () =
  let old_mode = !Theme_vars.mode in
  let old_light = Hashtbl.copy Theme_vars.light_vars
  and old_dark = Hashtbl.copy Theme_vars.dark_vars in
  let restore table saved =
    Hashtbl.reset table;
    Hashtbl.iter (Hashtbl.replace table) saved
  in
  Fun.protect
    ~finally:(fun () ->
      restore Theme_vars.light_vars old_light;
      restore Theme_vars.dark_vars old_dark;
      Theme_vars.set_dark (old_mode = Lui_theme.Dark))
    (fun () ->
      Theme_vars.set_dark false;
      List.iter
        (fun (name, value) -> Hashtbl.replace Theme_vars.light_vars name value)
        [
          ("--test-rgb", "18 52 86");
          ("--test-hsl", "0 0% 100%");
          ("--test-alpha", "25%");
          ("--test-alias", "var(--test-rgb)");
          ("--test-color", "#12345680");
          ("--test-cycle-a", "var(--test-cycle-b)");
          ("--test-cycle-b", "var(--test-cycle-a)");
        ];
      List.iter
        (fun (css, expected) ->
          check
            ("Native CSS color substitution: " ^ css)
            (Theme_vars.color_of css = expected))
        [
          ("rgb(var(--test-rgb) / 0.5)", Some (Lui_scene.color 18 52 86 128));
          ("rgb(var(--test-rgb) / 0%)", Some (Lui_scene.color 18 52 86 0));
          ("rgb(var(--test-rgb) / 100%)", Some (Lui_scene.color 18 52 86 255));
          ("rgb(var(--test-rgb))", Some (Lui_scene.color 18 52 86 255));
          ( "rgb(var(--test-alias) / var(--test-alpha))",
            Some (Lui_scene.color 18 52 86 64) );
          ("hsl(var(--test-hsl) / 50%)", Some (Lui_scene.color 255 255 255 128));
          ( "rgb(var(--test-missing, 18 52 86) / .5)",
            Some (Lui_scene.color 18 52 86 128) );
          ( "hsl(var(--test-missing, var(--test-hsl)) / .5)",
            Some (Lui_scene.color 255 255 255 128) );
          ("var(--test-color)", Some (Lui_scene.color 18 52 86 128));
          ("rgb(var(--test-color))", None);
          ("hsl(var(--test-color) / 50%)", None);
          ("hsl(var(--test-missing))", None);
          ("hsl(var(--test-cycle-a))", None);
        ];
      List.iter
        (fun css ->
          check
            ("Malformed CSS is rejected without throwing: " ^ css)
            (try Theme_vars.color_of css = None
             with Invalid_argument _ -> false))
        [ "var()"; "hsl(var())"; "rgb(var(--test-rgb)" ];
      List.iter
        (fun (mode, name, background, border) ->
          let snapshot = Ui_theme.snapshot mode in
          Theme_vars.install_snapshot
            (Yojson.Safe.to_string
               (`Assoc
                  [
                    ("mode", `String name);
                    ( "vars",
                      `Assoc
                        (List.map
                           (fun (key, value) -> (key, `String value))
                           snapshot.vars) );
                  ]));
          Theme_vars.set_dark (mode = Ui_theme.Dark);
          check
            "Native modal scrim uses the active background at ninety percent"
            (Theme_vars.color_of "scrim"
            = Some { background with Lui_scene.a = 230 });
          check "Native modal border matches the CSS channel color"
            (Theme_vars.color_of "hsl(var(--border))" = Some border))
        [
          ( Ui_theme.Light,
            "light",
            Lui_scene.color 255 255 255 255,
            Lui_scene.color 235 234 235 255 );
          ( Ui_theme.Dark,
            "dark",
            Lui_scene.color 0 45 56 255,
            Lui_scene.color 0 57 71 255 );
        ]);
  print_endline "native CSS color substitution and modal backdrop: OK"

let () =
  let property name =
    match
      List.find_opt
        (fun p -> Lui_wire_schema.property_name p = name)
        Lui_wire_schema.all_properties
    with
    | Some p -> p
    | None -> failwith ("Missing typed property: " ^ name)
  in
  List.iter
    (fun scale ->
      let store = Lui_store.create () in
      let scene =
        Lui_scene.create
          ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:128 ~h:128)
          ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:128 ~h:128)
      in
      let engine =
        Text_engine.create
          ~scene:(fun () -> scene)
          ~scale:(fun () -> scale)
          ~store:(fun () -> store)
      in
      let apply ops = List.iter (Lui_store.apply_op store) ops in
      let left = property "padding-left"
      and right = property "padding-right"
      and top = property "padding-top"
      and bottom = property "padding-bottom" in
      apply
        [
          CreateNode (830001, SearchField);
          SetProp (830001, FontSize, StringValue "14px");
          SetProp (830001, LineHeight, StringValue "20px");
          SetProp (830001, TextValue, StringValue "Undo");
          SetProp (830001, PaddingValue, IntValue 5);
          SetProp (830001, PaddingHorizontal, IntValue 10);
          SetProp (830001, PaddingVertical, IntValue 6);
        ];
      let region =
        Lui_scene.rect (100. *. scale) (200. *. scale) (200. *. scale)
          (60. *. scale)
      in
      let expect ~measured:(ml, mt, mr, mb) l t r b =
        let layout, x, y =
          Text_engine.text_layout engine 830001 region "Undo"
        in
        check "Native search text ignores its left inset"
          (x -. region.x = l *. scale);
        check "Native search text ignores asymmetric vertical padding"
          (abs_float
             (y -. region.y
             -. (region.h -. (layout.lay_height *. scale) +. ((t -. b) *. scale))
                /. 2.)
          < 0.01);
        let w, h = Text_engine.measure store 830001 ~scale in
        check "Native field content measurement duplicates horizontal layout padding"
          (abs_float (w -. ((layout.lay_width +. ml +. mr) *. scale)) < 0.01);
        check "Native field content measurement duplicates vertical layout padding"
          (abs_float (h -. ((layout.lay_height +. mt +. mb) *. scale)) < 0.01)
      in
      expect ~measured:(0., 0., 0., 0.) 10. 6. 10. 6.;
      apply
        [
          SetProp (830001, left, IntValue 28);
          SetProp (830001, right, IntValue 8);
          SetProp (830001, top, IntValue 3);
          SetProp (830001, bottom, IntValue 9);
        ];
      expect ~measured:(0., 0., 0., 0.) 28. 3. 8. 9.;
      apply
        [
          SetProp (830001, left, IntValue 0);
          SetProp (830001, bottom, IntValue 0);
        ];
      expect ~measured:(0., 0., 0., 0.) 0. 3. 8. 0.;
      apply
        [
          RemoveProp (830001, left);
          RemoveProp (830001, right);
          RemoveProp (830001, top);
          RemoveProp (830001, bottom);
        ];
      expect ~measured:(0., 0., 0., 0.) 10. 6. 10. 6.;
      apply [RemoveProp (830001, PaddingValue);
             RemoveProp (830001, PaddingHorizontal);
             RemoveProp (830001, PaddingVertical)];
      expect ~measured:(10., 6., 10., 6.) 10. 6. 10. 6.)
    [ 1.; 2. ];
  print_endline "native text padding edges: OK"

let () =
  let errors = ref [] in
  List.iter
    (fun scale ->
      List.iter
        (fun width ->
          List.iter
            (fun (height, pad_left, borderless) ->
              List.iter
                (fun trailing ->
                  let host_cell = ref None in
                  let engine =
                    lazy
                      (Text_engine.create
                         ~scene:(fun () ->
                           Lui_host.scene (Option.get !host_cell))
                         ~scale:(fun () -> scale)
                         ~store:(fun () ->
                           Lui_host.store (Option.get !host_cell)))
                  in
                  let host =
                    Lui_host.create ~hooks:Lui_paint.default_hooks
                      ~layout:(module Lui_layout)
                      ~measure:(fun id _text _w _h ->
                        Some
                          (Text_engine.measure
                             (Lui_host.store (Option.get !host_cell))
                             id ~scale))
                      ~renderer:
                        {
                          Lui_host.name = "search-row-test";
                          render = (fun _ -> Bytes.empty);
                        }
                      ~width:(int_of_float (width *. scale))
                      ~height:(int_of_float (80. *. scale))
                      ~scale ()
                  in
                  host_cell := Some host;
                  let app =
                    Lui_app.create
                      (Lui_host.backend host (profile MacOS GenericHost))
                      ()
                      (fun () () -> ())
                      (fun context _ _ ->
                        let value =
                          Signal.state context.Lui_ui.ui_scheduler "Undo"
                        in
                        Lui_elements.column ~width:(int_of_float width)
                          [
                            Ui_components.search_row ~key:"shared-search"
                              ~height ~pad_left ~borderless
                              ~background:"#f0f0f0" ~placeholder:"Search"
                              ~text_signal:(Signal.value value)
                              ~on_text:(fun text ->
                                Runtime.signal_set value text)
                              ~trailing:
                                (if trailing then
                                   [
                                     Lui_elements.button ~width:20 ~min_width:0
                                       ~padding:0 ~text:"x" [];
                                   ]
                                 else [])
                              ();
                          ])
                  in
                  Fun.protect
                    ~finally:(fun () -> ignore (Lui_app.dispose app))
                    (fun () ->
                      ignore (Lui_app.start app);
                      ignore (Lui_app.flush app);
                      ignore (Lui_host.repaint host);
                      let store = Lui_host.store host in
                      let field =
                        List.find
                          (fun id -> Lui_store.kind store id = "search-field")
                          (Lui_store.preorder store)
                      in
                      let rect id = Option.get (Lui_host.layout_rect host id) in
                      let field_rect = rect field in
                      let label =
                        Printf.sprintf
                          "search-row scale=%.0f width=%.0f height=%d \
                           trailing=%b"
                          scale width height trailing
                      in
                      let expect text condition =
                        if not condition then
                          errors := (label ^ ": " ^ text) :: !errors
                      in
                      let paint () =
                        let hooks =
                          {
                            Lui_paint.default_hooks with
                            Lui_paint.layout =
                              (fun id -> Lui_paint.placement_of_rect (rect id));
                            text_ops = Text_engine.text_ops (Lazy.force engine);
                            image_of =
                              (fun id ->
                                Host_icons.image_of store scale id (rect id));
                            image_in =
                              (fun id region ->
                                Host_icons.image_of store scale id region);
                          }
                        in
                        let scene = Lui_host.scene host in
                        Lui_paint.paint hooks store scene
                          ~width:(int_of_float (width *. scale))
                          ~height:(int_of_float (80. *. scale))
                          ~scale
                          ~clear:(Lui_scene.color 255 255 255 255);
                        scene
                      in
                      let scene = paint () in
                      let images =
                        List.filter_map
                          (function
                            | Lui_scene.Image image -> Some image.irect2
                            | _ -> None)
                          scene.ops
                      in
                      expect "missing or duplicate search image"
                        (List.length images = 1);
                      List.iter
                        (fun (image : Lui_scene.rect) ->
                          expect "image extends outside its field"
                            (image.w > 0. && image.h > 0.
                           && image.x >= field_rect.x && image.y >= field_rect.y
                            && image.x +. image.w
                               <= field_rect.x +. field_rect.w
                            && image.y +. image.h
                               <= field_rect.y +. field_rect.h);
                          expect
                            "search image is not vertically centered in its \
                             field"
                            (abs_float
                               (image.y +. (image.h /. 2.) -. field_rect.y
                              -. (field_rect.h /. 2.))
                            <= 0.5);
                          let seen = ref false in
                          let covered =
                            List.exists
                              (function
                                | Lui_scene.Image op when op.irect2 = image ->
                                    seen := true;
                                    false
                                | Lui_scene.Fill op when !seen ->
                                    op.fcolor.a = 255 && op.fopacity = 1.
                                    && op.frect.x <= image.x
                                    && op.frect.y <= image.y
                                    && op.frect.x +. op.frect.w
                                       >= image.x +. image.w
                                    && op.frect.y +. op.frect.h
                                       >= image.y +. image.h
                                | _ -> false)
                              scene.ops
                          in
                          expect "field background covers its search image"
                            (not covered))
                        images;
                      let expect_origin text =
                        let _, x, _ =
                          Text_engine.text_layout (Lazy.force engine) field
                            (rect field) text
                        in
                        expect "text does not clear the leading image"
                          (x -. (rect field).x = float pad_left *. scale)
                      in
                      expect_origin "Undo";
                      ignore
                        (Lui_app.dispatch_event app
                           (TextChanged (field, "Repeated typing")));
                      ignore (Lui_app.flush app);
                      ignore (Lui_host.repaint host);
                      expect "typing is not delivered through the shared field"
                        (Lui_store.string_prop store field "text"
                        = Some "Repeated typing");
                      expect_origin "Repeated typing"))
                [ false; true ])
            [ (26, 28, false); (28, 28, false); (32, 32, true) ])
        [ 160.; 320. ])
    [ 1.; 2. ];
  List.iter prerr_endline (List.rev !errors);
  check "Shared native search fields across caller sizes and backing scales"
    (!errors = []);
  print_endline "native shared search fields: OK"

let () =
  Native_embed.with_entry_lock (fun () ->
      let module A = Lui_window.Assembly in
      let module W = Lui_window in
      let old_theme_mode = !Theme_vars.mode in
      let old_light_vars = Hashtbl.copy Theme_vars.light_vars in
      let snapshot = Ui_theme.snapshot Ui_theme.Light in
      Theme_vars.install_snapshot
        (Yojson.Safe.to_string
           (`Assoc
              [
                ("mode", `String "light");
                ( "vars",
                  `Assoc
                    (List.map
                       (fun (key, value) -> (key, `String value))
                       snapshot.vars) );
              ]));
      Theme_vars.set_dark false;
      let old_settings = !Settings_state.st and old_worker = !Runtime.worker in
      Runtime.worker :=
        Some
          {
            Worker_client.invoke_fn =
              (fun name _ ->
                match name with
                | "thread-api/get-file-content" | "thread-api/pull" ->
                    Js.Promise.resolve Wire.Nil
                | _ -> failwith ("Unexpected settings fixture request: " ^ name));
            on_message = (fun _ _ -> ());
            dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ());
          };
      let old_width = Host.inner_width ()
      and old_height = Host.inner_height () in
      Settings_state.st := None;
      Host.set_window_size 1440. 932.;
      let surface_cell = ref None in
      let engine =
        lazy
          (Text_engine.create
             ~scene:(fun () ->
               Lui_host.scene (A.host (Option.get !surface_cell)))
             ~scale:(fun () -> 2.)
             ~store:(fun () -> A.store (Option.get !surface_cell)))
      in
      let surface =
        A.create
          ~layout:(module Lui_layout)
          ~scale_cell:(ref 2.)
          ~text:
            {
              measure =
                (fun id value ->
                  Text_engine.measure_text (Lazy.force engine) id value);
              text_ops =
                (fun id rect color value ->
                  Text_engine.text_ops (Lazy.force engine) id rect color value);
              hit_text = (fun _ _ ~lx:_ ~ly:_ ~lw:_ ~lh:_ -> 0);
              caret_ops =
                (fun _ _ ~lw:_ ~lh:_ ->
                  {
                    W.Ui.c_before = Fun.id;
                    c_after = Fun.id;
                    c_up = Fun.id;
                    c_down = Fun.id;
                    c_rect = (fun _ -> (0., 0., 32.));
                  });
            }
          ~renderer:
            { name = "settings-layout"; render = (fun _ -> Bytes.empty) }
          ~width:2880 ~height:1864 ()
      in
      surface_cell := Some surface;
      let host = A.host surface and store = A.store surface in
      let registry = Lui_extension.registry () in
      Logseq_el.register_all registry;
      Logseq_codemirror.register registry;
      let app =
        Lui_app.create_with_extensions
          (Lui_host.backend host (profile MacOS GenericHost))
          registry Model.initial
          (fun model _ -> model)
          (fun _ model _ ->
            Ui_components.with_props
              [
                Ui_components.Prop.font_size "1rem";
                Ui_components.Prop.font_family "Inter";
                Ui_components.Prop.line_height "1.5";
              ]
              (Lui_elements.column
                 [ Dialogs_view.dialog_view "settings" model ]))
      in
      Fun.protect
        ~finally:(fun () ->
          ignore (Lui_app.dispose app);
          Theme_vars.install_snapshot
            (Yojson.Safe.to_string
               (`Assoc
                  [
                    ("mode", `String "light");
                    ( "vars",
                      `Assoc
                        (Hashtbl.fold
                           (fun key value entries ->
                             (key, `String value) :: entries)
                           old_light_vars []) );
                  ]));
          Theme_vars.set_dark (old_theme_mode = Lui_theme.Dark);
          Settings_state.st := old_settings;
          Runtime.worker := old_worker;
          Host.set_window_size old_width old_height)
        (fun () ->
          ignore (Lui_app.start app);
          ignore (Lui_app.flush app);
          ignore (A.store_changed surface);
          ignore (A.repaint surface);
          let nodes = Lui_store.preorder store in
          let has_class id name =
            match Lui_store.string_prop store id "style-class" with
            | Some cls -> List.mem name (String.split_on_char ' ' cls)
            | None -> false
          in
          let find_class name = List.find (fun id -> has_class id name) nodes in
          let rect = W.Rects.get (A.rects surface) in
          let errors = ref [] in
          let expect message condition =
            if not condition then errors := message :: !errors
          in
          let dialog =
            List.find (fun id -> Lui_store.kind store id = "dialog") nodes
          in
          let inner = find_class "cp__settings-inner" in
          Printf.printf "settings dialog %.2fx%.2f inner %.2fx%.2f\n%!"
            (rect dialog).w (rect dialog).h (rect inner).w (rect inner).h;
          (* Native layout snaps the viewport fraction to physical pixels. *)
          expect
            "Settings content must occupy 70 percent of the viewport height"
            (abs_float ((rect inner).h -. 1304.8) <= 1.);
          expect "Settings chrome must include its one-point border in layout"
            ((rect inner).x = (rect dialog).x +. 2. && (rect inner).w = 2044.);
          let pane = find_class "panel-wrap" in
          expect "General settings content exceeds its six-hundred-point column"
            ((rect pane).w <= 1200.);
          let nav =
            List.filter
              (fun id ->
                Lui_store.kind store id = "list-item"
                && has_class id "settings-menu-item")
              nodes
          in
          expect "Settings navigation does not keep forty-point row spacing"
            ((rect (List.nth nav 1)).y -. (rect (List.hd nav)).y = 80.);
          let modal_title = find_class "cp__settings-modal-title" in
          let text_engine =
            Text_engine.create
              ~scene:(fun () -> Lui_host.scene host)
              ~scale:(fun () -> 2.)
              ~store:(fun () -> store)
          in
          List.iter
            (fun item ->
              let rec descendants id =
                List.concat_map
                  (fun child ->
                    let child_id = Lui_store.node_id child in
                    child_id :: descendants child_id)
                  (Lui_store.children store id)
              in
              let children = descendants item in
              let image =
                List.find (fun id -> has_class id "ls-nav-item-icon") children
              in
              let label =
                if Lui_store.string_prop store item "text" <> None then item
                else List.find (fun id -> Lui_store.kind store id = "text") children
              in
              let value = Option.get (Lui_store.string_prop store label "text") in
              let _, text_x, _ =
                Text_engine.text_layout text_engine label (rect label) value
              in
              expect
                (Printf.sprintf
                   "Settings navigation icon inset %.2f, expected 16 device pixels"
                   ((rect image).x -. (rect item).x))
                (abs_float ((rect image).x -. (rect item).x -. 16.) < 0.01);
              expect "Settings navigation text must follow its icon by four points"
                (abs_float (text_x -. (rect image).x -. (rect image).w -. 8.) < 0.01);
              expect "Settings navigation icon must stay vertically centered"
                (abs_float
                   ((rect image).y +. ((rect image).h /. 2.) -. (rect item).y
                  -. ((rect item).h /. 2.))
                <= 1.))
            nav;
          expect
            "Settings modal title does not use its measured thirty-two-point \
             line box"
            (abs_float
               (snd
                  (Text_engine.measure_text text_engine modal_title "Settings")
               -. 64.)
            < 0.001);
          let title = find_class "cp__settings-category-title" in
          let rendered_width =
            fst (Lui_text.measure (Text_engine.font_of store title) "General")
          in
          let regular =
            Lui_text.create ~families:[ "Inter" ] ~size:20. ~weight:400 ()
          in
          expect
            "The category heading still renders with bold default typography"
            (abs_float
               (rendered_width -. fst (Lui_text.measure regular "General"))
            < 0.01);
          let checkbox =
            List.find (fun id -> Lui_store.kind store id = "checkbox") nodes
          in
          expect "Settings checkbox has no visible sixteen-point hit target"
            ((rect checkbox).w = 32. && (rect checkbox).h = 32.
            && List.mem checkbox
                 (W.hit_path store (A.rects surface)
                    ~x:((rect checkbox).x +. 16.) ~y:((rect checkbox).y +. 16.))
            );
          let cards =
            List.filter
              (fun id ->
                Lui_store.kind store id = "list-item"
                && List.exists
                     (fun child ->
                       match
                         Lui_store.string_prop store child "style-class"
                       with
                       | Some cls -> String.starts_with ~prefix:"mode-" cls
                       | None -> false)
                     (Lui_store.preorder ~root:id store))
              nodes
          in
          expect
            "Native theme choices still draw approximations instead of the \
             bundled PNGs"
            (List.length
               (List.filter
                  (fun id ->
                    Lui_store.kind store id = "file-image"
                    &&
                    match Lui_store.string_prop store id "path" with
                    | Some path ->
                        List.mem path
                          [
                            "img/light-theme.png";
                            "img/dark-theme.png";
                            "img/system-theme.png";
                          ]
                    | None -> false)
                  nodes)
            = 3);
          let selected =
            List.find (fun id -> W.bool_prop store id "selected") cards
          in
          expect "Theme selection paints the entire card as an accent block"
            (not
               (List.exists
                  (function
                    | Lui_scene.Fill f ->
                        f.frect = rect selected && f.fcolor.a > 0
                    | _ -> false)
                  (Lui_host.scene host).ops));
          let trigger =
            List.find (fun id -> Lui_store.kind store id = "select") nodes
          in
          expect
            "Language select lacks an explicit background and 14-point \
             typography"
            (Lui_store.string_prop store trigger "background"
             = Some "hsl(var(--background))"
            && Lui_text.size (Text_engine.font_of store trigger) = 14.);
          let thumbnail_ring =
            List.find
              (fun id ->
                Lui_store.kind store id = "box"
                && Lui_store.int_prop store id "border-width" = Some 2)
              (Lui_store.preorder ~root:selected store)
          in
          List.iter
            (fun id ->
              let css =
                Option.get (Lui_store.string_prop store id "border-color")
              in
              expect
                "A Settings surface border resolves to transparent in the \
                 production theme"
                (match Theme_vars.color_of css with
                | Some color -> color.a > 0
                | None -> false))
            [ dialog; trigger; thumbnail_ring ];
          let font_sample = find_class "ls-font-sample" in
          let bold =
            Lui_text.create ~families:[ "Inter" ] ~size:14. ~weight:700 ()
          in
          expect "Font preview lost its bold sample"
            (abs_float
               (fst
                  (Lui_text.measure
                     (Text_engine.font_of store font_sample)
                     "Ag")
               -. fst (Lui_text.measure bold "Ag"))
            < 0.01);
          let fonts =
            List.filter (fun id -> has_class id "ls-font-btn") nodes
          in
          expect "Font choices have no eight-point gap"
            ((rect (List.nth fonts 1)).x
             -. ((rect (List.hd fonts)).x +. (rect (List.hd fonts)).w)
            = 16.);
          let global_label = find_class "ls-check-label" in
          expect "Global font checkbox label is not fourteen-point text"
            (Lui_text.size (Text_engine.font_of store global_label) = 14.);
          let font_name = find_class "ls-font-name" in
          expect
            "Font preview captions differ from the measured eleven-point-two \
             text"
            (abs_float
               (Lui_text.size (Text_engine.font_of store font_name) -. 11.2)
            < 0.001);
          List.iter2
            (fun button families ->
              let descendants = Lui_store.preorder ~root:button store in
              let sample =
                List.find (fun id -> has_class id "ls-font-sample") descendants
              in
              let caption =
                List.find (fun id -> has_class id "ls-font-name") descendants
              in
              List.iter
                (fun (id, size, weight) ->
                  let actual = Text_engine.font_of store id in
                  let expected = Lui_text.create ~families ~size ~weight () in
                  expect "Font preview uses the wrong resolved font family"
                    (Lui_text.family actual = Lui_text.family expected);
                  expect
                    "Font preview typography differs from its measured weight"
                    (abs_float
                       (fst (Lui_text.measure actual "Ag Default Serif Mono")
                       -. fst
                            (Lui_text.measure expected "Ag Default Serif Mono")
                       )
                    < 0.01))
                [ (sample, 14., 700); (caption, 11.2, 500) ])
            fonts
            [
              [ "Inter" ];
              [ "Lyon-Text"; "Georgia"; "ui-serif"; "serif" ];
              [ "iawriter-mono"; "Nitti"; "Menlo"; "Courier"; "monospace" ];
            ];
          List.iter prerr_endline (List.rev !errors);
          Option.iter
            (fun path ->
              let snapshot = Ui_theme.snapshot Ui_theme.Light in
              Theme_vars.install_snapshot
                (Yojson.Safe.to_string
                   (`Assoc
                      [
                        ("mode", `String "light");
                        ( "vars",
                          `Assoc
                            (List.map
                               (fun (key, value) -> (key, `String value))
                               snapshot.vars) );
                      ]));
              let scene =
                Lui_scene.create
                  ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:512 ~h:512)
                  ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:512 ~h:512)
              in
              let engine =
                Text_engine.create
                  ~scene:(fun () -> scene)
                  ~scale:(fun () -> 2.)
                  ~store:(fun () -> store)
              in
              let hooks =
                {
                  Lui_paint.default_hooks with
                  Lui_paint.color_of = Theme_vars.color_of;
                  layout = (fun id -> Lui_paint.placement_of_rect (rect id));
                  text_ops = Text_engine.text_ops engine;
                  image_of =
                    (fun id -> Host_icons.image_of store 2. id (rect id));
                  image_in =
                    (fun id region -> Host_icons.image_of store 2. id region);
                }
              in
              Lui_paint.paint hooks store scene ~width:2880 ~height:1864
                ~scale:2.
                ~clear:(Lui_scene.color 255 255 255 255);
              Out_channel.with_open_bin path (fun channel ->
                  Marshal.to_channel channel scene []);
              let border_at region =
                List.exists
                  (function
                    | Lui_scene.Fill fill ->
                        fill.frect = region
                        && fill.fborder <> (0., 0., 0., 0.)
                        && fill.fborder_color.a > 0
                    | _ -> false)
                  scene.ops
              in
              check "Native Settings dialog border resolves to transparent"
                (border_at (rect dialog));
              check "Native language select border resolves to transparent"
                (border_at (rect trigger));
              check
                "Native selected theme thumbnail has no visible selection ring"
                (List.exists
                   (function
                     | Lui_scene.Fill fill ->
                         fill.frect.w = 184. && fill.frect.h = 126.
                         && fill.fborder = (4., 4., 4., 4.)
                         && fill.fborder_color.a > 0
                     | _ -> false)
                   scene.ops))
            (Sys.getenv_opt "LOGSEQ_NATIVE_SETTINGS_SCENE");
          check "Native Settings visual geometry and typography" (!errors = []);
          Settings_state.set_tab "keymap";
          ignore (Lui_app.flush app);
          ignore (A.store_changed surface);
          ignore (A.repaint surface);
          let keymap_nodes = Lui_store.preorder store in
          let keymap_find name = List.find (fun id -> has_class id name) keymap_nodes in
          let keymap_header = keymap_find "cp__settings-header" in
          let key_button = keymap_find "shortcut-keystroke-inactive" in
          let search =
            List.find (fun id -> Lui_store.kind store id = "search-field") keymap_nodes
          in
          let pills = keymap_find "shortcut-filter-pills" in
          let category = keymap_find "th" in
          let command_rows =
            List.filter (fun id -> has_class id "shortcut-row") keymap_nodes
          in
          let command_label = keymap_find "ls-kbd-label" in
          let list_scroller =
            List.find
              (fun id -> Lui_store.kind store id = "scroll")
              (Lui_store.preorder ~root:(keymap_find "cp__shortcut-page-x") store)
          in
          expect "Keymap search button must use fourteen-point text"
            (Lui_text.size (Text_engine.font_of store key_button) = 14.);
          expect "Keymap search button must be thirty points high"
            ((rect key_button).h = 60.);
          expect "Keymap toolbar must keep its twenty-two-point title gap"
            ((rect key_button).y -. ((rect keymap_header).y +. (rect keymap_header).h)
            = 44.);
          expect "Keymap search field must keep an eight-point button gap"
            ((rect key_button).x -. ((rect search).x +. (rect search).w) = 16.);
          expect "Keymap category bands must be thirty points high"
            ((rect category).h = 60.);
          let category_text =
            List.find
              (fun id -> Lui_store.kind store id = "text")
              (Lui_store.preorder ~root:category store)
          in
          expect "Keymap category text must be fifteen points"
            (Lui_text.size (Text_engine.font_of store category_text) = 15.);
          let disclosure =
            List.find
              (fun id -> Lui_store.kind store id = "icon")
              (Lui_store.preorder ~root:category store)
          in
          expect "Keymap category disclosure has no visible fourteen-point target"
            ((rect disclosure).w = 28. && (rect disclosure).h = 28.);
          expect "Keymap command text must be fourteen points"
            (Lui_text.size (Text_engine.font_of store command_label) = 14.);
          expect "Keymap commands must retain thirty-four-point row spacing"
            ((rect (List.nth command_rows 1)).y -. (rect (List.hd command_rows)).y = 68.);
          expect "Keymap rows must leave an eight-point label inset"
            ((rect command_label).x -. (rect (List.hd command_rows)).x = 16.);
          expect "Keymap needs a bounded internal scroll viewport"
            ((rect list_scroller).h > 0.
            && (rect list_scroller).y +. (rect list_scroller).h
               <= (rect inner).y +. (rect inner).h
            && W.Ui.scroll_cap (A.ui surface) list_scroller > 0.);
          let keymap_scene =
            Lui_scene.create
              ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:512 ~h:512)
              ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:512 ~h:512)
          in
          let keymap_engine =
            Text_engine.create
              ~scene:(fun () -> keymap_scene)
              ~scale:(fun () -> 2.)
              ~store:(fun () -> store)
          in
          let keymap_hooks =
            {
              Lui_paint.default_hooks with
              Lui_paint.color_of = Theme_vars.color_of;
              layout = (fun id -> Lui_paint.placement_of_rect (rect id));
              text_ops = Text_engine.text_ops keymap_engine;
              image_of = (fun id -> Host_icons.image_of store 2. id (rect id));
              image_in = (fun id region -> Host_icons.image_of store 2. id region);
            }
          in
          Lui_paint.paint keymap_hooks store keymap_scene ~width:2880 ~height:1864
            ~scale:2.
            ~clear:(Lui_scene.color 255 255 255 255);
          let visible_face region =
            List.exists
              (function
                | Lui_scene.Fill fill ->
                    fill.frect = region
                    && (fill.fcolor.a > 0
                       || (fill.fborder <> (0., 0., 0., 0.) && fill.fborder_color.a > 0)
                       )
                | _ -> false)
              keymap_scene.ops
          in
          expect "Keymap independent filter pills must not acquire a shared track"
            (not (visible_face (rect pills)));
          expect "Keymap category bands must paint their themed background"
            (visible_face (rect category));
          let key_icons =
            List.filter
              (function
                | Lui_scene.Image image ->
                    let region = image.irect2 and button = rect key_button in
                    region.x >= button.x && region.y >= button.y
                    && region.x +. region.w <= button.x +. button.w
                    && region.y +. region.h <= button.y +. button.h
                | _ -> false)
              keymap_scene.ops
          in
          expect "Search-by-keys paints a duplicate or missing keyboard icon"
            (List.length key_icons = 1);
          let search_region = rect search in
          let inside_search (region : Lui_scene.rect) =
            region.w > 0. && region.h > 0.
            && region.x >= search_region.x
            && region.y >= search_region.y
            && region.x +. region.w <= search_region.x +. search_region.w
            && region.y +. region.h <= search_region.y +. search_region.h
          in
          let search_icons =
            List.filter_map
              (function
                | Lui_scene.Image image when inside_search image.irect2 ->
                    Some image.irect2
                | _ -> None)
              keymap_scene.ops
          in
          expect "Keymap search needs exactly one visible leading icon"
            (List.length search_icons = 1);
          List.iter
            (fun icon ->
              let seen = ref false in
              let covered =
                List.exists
                  (function
                    | Lui_scene.Image image when image.irect2 = icon ->
                        seen := true;
                        false
                    | Lui_scene.Fill fill when !seen ->
                        fill.fcolor.a = 255 && fill.fopacity = 1.
                        && fill.frect.x <= icon.x && fill.frect.y <= icon.y
                        && fill.frect.x +. fill.frect.w >= icon.x +. icon.w
                        && fill.frect.y +. fill.frect.h >= icon.y +. icon.h
                    | _ -> false)
                  keymap_scene.ops
              in
              expect "The input surface must not cover its leading search icon"
                (not covered))
            search_icons;
          let search_layout, search_text_x, _ =
            Text_engine.text_layout keymap_engine search search_region "Undo"
          in
          expect "Keymap search text must clear the twenty-eight-point icon slot"
            (search_text_x -. search_region.x = 56.);
          let first_caret = Lui_text.caret_rect search_layout 0 in
          expect "Keymap search caret must start after the leading icon slot"
            (search_text_x +. first_caret.rx -. search_region.x = 56.);
          expect "The search icon must not intercept its field's hit target"
            (List.mem search
               (W.hit_path store (A.rects surface) ~x:(search_region.x +. 24.)
                  ~y:(search_region.y +. (search_region.h /. 2.))));
          let previous_app = !Native_embed.current_app
          and previous_flush = !Runtime.app_flush
          and previous_provider = !Dom_ext.doc_elements_provider
          and previous_host_op = !Host.host_op in
          Fun.protect
            ~finally:(fun () ->
              Native_embed.current_app := previous_app;
              Runtime.app_flush := previous_flush;
              Dom_ext.doc_elements_provider := previous_provider;
              Host.host_op := previous_host_op)
            (fun () ->
              Native_embed.current_app := Some app;
              (Runtime.app_flush := fun () -> ignore (Lui_app.flush app));
              Dom_ext.doc_elements_provider := Native_embed.collect_elements;
              let focused_input = ref 0 in
              let env : Host_requests.env =
                {
                  store;
                  ui = A.ui surface;
                  rects = A.rects surface;
                  rect_of = rect;
                  scale = (fun () -> 2.);
                  measure =
                    (fun _ _ -> failwith "Unexpected keymap measurement request");
                  text_layout =
                    (fun _ _ -> failwith "Unexpected keymap text-layout request");
                  apply_batch = (fun _ -> failwith "Unexpected keymap batch request");
                  apply_actions = (fun _ -> failwith "Unexpected keymap action request");
                  set_ime_rect = (fun _ -> failwith "Unexpected keymap IME request");
                  focused_text_input = (fun id -> focused_input := id);
                  repaint = (fun () -> failwith "Unexpected keymap repaint request");
                }
              in
              (Host.host_op :=
                 fun name body ->
                   if name <> "dom-op" then
                     failwith ("Unexpected keymap host request: " ^ name);
                   let separator = String.index body '\n' in
                   Host_requests.dom_op env
                     (String.sub body 0 separator)
                     (String.sub body (separator + 1)
                        (String.length body - separator - 1)));
              let dispatch event =
                ignore (Lui_app.dispatch_event app event);
                ignore (Lui_app.flush app)
              in
              let count_class name =
                List.length
                  (List.filter (fun id -> has_class id name) (Lui_store.preorder store))
              in
              let categories =
                List.filter_map
                  (function Keymap_data.Category label -> Some label | _ -> None)
                  Keymap_data.items
              in
              expect "Native Keymap must retain its empty category headings"
                (count_class "th" = List.length categories);
              let all_rows = count_class "shortcut-row" in
              let category_toggle () =
                List.find
                  (fun id ->
                    Lui_store.string_prop store id "accessibility-label"
                    = Some I18n.keymap_toggle_categories)
                  (Lui_store.preorder store)
              in
              let first_category () =
                List.find (fun id -> has_class id "th") (Lui_store.preorder store)
              in
              let category_tools () =
                List.filter
                  (fun id ->
                    let label = Lui_store.string_prop store id "accessibility-label" in
                    label = Some I18n.keymap_toggle_categories
                    || label = Some I18n.keymap_refresh_all)
                  (Lui_store.preorder store)
              in
              expect "Native empty query must show category actions"
                (List.length (category_tools ()) = 2);
              dispatch (Press (first_category ()));
              expect "Native individual collapse must retain other groups"
                (count_class "shortcut-row" > 0 && count_class "shortcut-row" < all_rows);
              dispatch (Press (category_toggle ()));
              expect "Native global toggle must collapse a partly collapsed list"
                (count_class "shortcut-row" = 0);
              dispatch (TextChanged (search, "Undo"));
              expect "Native search must ignore collapsed category state"
                (count_class "shortcut-row" = 13 && count_class "th" = 0);
              expect "Native query results must hide category actions"
                (category_tools () = []);
              dispatch (TextChanged (search, ""));
              expect "Native clearing search must retain collapsed categories"
                (count_class "shortcut-row" = 0);
              expect "Native clearing search must restore category actions"
                (List.length (category_tools ()) = 2);
              dispatch (Press (first_category ()));
              expect "Native individual expansion must open just one group"
                (count_class "shortcut-row" > 0 && count_class "shortcut-row" < all_rows);
              dispatch (Press (category_toggle ()));
              expect "Native global toggle must collapse a partly expanded list"
                (count_class "shortcut-row" = 0);
              dispatch (Press (category_toggle ()));
              expect "Native global toggle must expand all collapsed groups"
                (count_class "shortcut-row" = all_rows);
              dispatch (TextChanged (search, "Undo"));
              expect "Native Keymap search does not retain categorized fuzzy matches"
                (count_class "shortcut-row" = 13 && count_class "th" = 0);
              let clear =
                List.find
                  (fun id ->
                    Lui_store.string_prop store id "accessibility-label"
                    = Some (I18n.t "keymap/clear-search"))
                  (Lui_store.preorder store)
              in
              W.Ui.set_focused (A.ui surface) store clear;
              dispatch (Press clear);
              expect "Native query clear must preserve the field and reset its text"
                (Lui_store.string_prop store search "text" = Some ""
                && List.mem search (Lui_store.preorder store));
              expect "Native query clear must restore host text-input focus"
                (W.Ui.focused (A.ui surface) = search && !focused_input = search);
              expect "Native query clear must restore category headings"
                (count_class "th" > 0);
              let row_ids () =
                List.filter (fun id -> has_class id "shortcut-row")
                  (Lui_store.preorder store)
              in
              let grouped_row_ids = row_ids () in
              let before_recording = Gc.allocated_bytes () in
              dispatch (Press key_button);
              let recording_bytes = Gc.allocated_bytes () -. before_recording in
              Printf.eprintf "native recorder open allocation: %.0f bytes\n" recording_bytes;
              expect "Opening native recording must allocate less than 2 MB"
                (recording_bytes < 2_000_000.);
              expect "Opening native recording must preserve command rows"
                (row_ids () = grouped_row_ids);
              expect "Native keystroke filter does not own keyboard recording"
                (Keyboard_capture.active () && count_class "shortcut-filter-popover" = 1);
              let key name meta =
                Platform.emit_event "keydown"
                  (Js.Json.JObject
                     [
                       ("key", Js.Json.JString name); ("metaKey", Js.Json.JBoolean meta);
                     ])
              in
              let before_empty_dismissal = Gc.allocated_bytes () in
              key "Escape" false;
              let empty_dismissal_bytes =
                Gc.allocated_bytes () -. before_empty_dismissal
              in
              Printf.eprintf "native empty recorder close allocation: %.0f bytes\n"
                empty_dismissal_bytes;
              expect "Closing empty native recording must allocate less than 4 MB"
                (empty_dismissal_bytes < 4_000_000.);
              expect "Closing empty native recording must preserve command rows"
                (row_ids () = grouped_row_ids);
              dispatch (Press key_button);
              ignore (A.store_changed surface);
              ignore (A.repaint surface);
              let recorder () = List.find (fun id -> has_class id "shortcut-filter-popover")
                  (Lui_store.preorder store) in
              if Lui_store.bool_prop store (recorder ()) "appear-enabled"
              then dispatch (Appear (recorder ()));
              expect "Native recorder appearance must focus its content"
                (W.Ui.focused (A.ui surface) = recorder ());
              let anchor_gap () = (rect (recorder ())).y -. ((rect key_button).y +. (rect key_button).h) in
              let initial_anchor_gap = anchor_gap () in
              key "k" true;
              ignore (A.store_changed surface);
              ignore (A.repaint surface);
              expect "Native key-filter clear must not replace the popover anchor"
                (abs_float (anchor_gap () -. initial_anchor_gap) < 0.01);
              expect "Native keystroke recording does not filter matching commands"
                (count_class "shortcut-row" = 1 && count_class "th" = 0);
              let active_trigger = List.find (fun id ->
                  has_class id "shortcut-keystroke-active") (Lui_store.preorder store) in
              let rec trigger_contains id =
                id = active_trigger || match Lui_store.parent store id with
                  | Some parent -> trigger_contains parent
                  | None -> false in
              let trigger_rect = rect active_trigger in
              List.iter (fun id ->
                  let child = rect id in
                  if child.w > 0. && child.h > 0. then
                  expect (Printf.sprintf
                    "Native shortcut trigger must contain %s #%d (x=%.2f w=%.2f, button x=%.2f w=%.2f)"
                    (Lui_store.kind store id) id child.x child.w trigger_rect.x trigger_rect.w)
                    (child.x >= trigger_rect.x
                     && child.x +. child.w <= trigger_rect.x +. trigger_rect.w))
                (List.filter trigger_contains (Lui_store.preorder store));
              key "c" true;
              expect
                "Native recorded prefixes must include multi-stroke command bindings"
                (count_class "shortcut-row" = 4);
              let timer_ids_before =
                Hashtbl.fold (fun id _ ids -> id :: ids) Host.timers []
              in
              key "Tab" false;
              expect "Native Tab is not captured as a shortcut stroke"
                (Option.is_some
                   (Ui_services.dom_query
                      ".shortcut-filter-popover [data-shortcut-binding=\"tab\"]"));
              key "Backspace" false;
              for _ = 1 to 5 do key "PageDown" false done;
              ignore (A.store_changed surface);
              ignore (A.repaint surface);
              let popup = recorder () in
              let rec in_popup id =
                id = popup || match Lui_store.parent store id with
                  | Some parent -> in_popup parent
                  | None -> false
              in
              let popup_nodes = List.filter in_popup (Lui_store.preorder store) in
              let recorded_keys = List.filter (fun id ->
                  match Lui_store.string_prop store id "data-attrs" with
                  | Some raw -> List.mem ("data-shortcut-binding", "pagedown")
                      (Lui_protocol.data_attrs_decode raw)
                  | None -> false) popup_nodes in
              let remove = List.find (fun id ->
                  Lui_store.string_prop store id "accessibility-label"
                    = Some (I18n.t "keymap/remove-filter")) popup_nodes in
              let shell = rect popup and action = rect remove in
              let contained (r : Lui_scene.rect) = r.x >= shell.x +. 31.9
                  && r.x +. r.w <= shell.x +. shell.w -. 31.9
                  && r.y >= shell.y && r.y +. r.h <= shell.y +. shell.h in
              expect "Native recorder must retain all five named strokes"
                (List.length recorded_keys = 5);
              List.iter (fun id ->
                  let region = rect id in
                  expect "Native recorded keys must stay inside the popup content"
                    (contained region);
                  expect "Native recorded keys must not overlap their remove action"
                    (region.x +. region.w <= action.x
                     || region.x >= action.x +. action.w
                     || region.y +. region.h <= action.y
                     || region.y >= action.y +. action.h)) recorded_keys;
              expect "Native recording must preserve its remove target"
                (contained action && action.w >= 32. && action.h >= 32.
                 && List.mem remove (W.hit_path store (A.rects surface)
                   ~x:(action.x +. action.w /. 2.)
                   ~y:(action.y +. action.h /. 2.)));
              W.Ui.set_focused (A.ui surface) store remove;
              dispatch (Press remove);
              expect "Native recording clear must restore popup focus"
                (W.Ui.focused (A.ui surface) = recorder ());
              key "Tab" false;
              let filtered_row_ids = row_ids () in
              let before_dismissal = Gc.allocated_bytes () in
              key "Escape" false;
              let dismissal_bytes = Gc.allocated_bytes () -. before_dismissal in
              Printf.eprintf "native recorder close allocation: %.0f bytes\n" dismissal_bytes;
              expect "Closing native recording must allocate less than 2 MB"
                (dismissal_bytes < 2_000_000.);
              expect "Closing native recording must preserve filtered command rows"
                (row_ids () = filtered_row_ids);
              expect "Closing native recording must cancel its pending timer"
                (Hashtbl.fold
                   (fun id _ ok -> ok && List.mem id timer_ids_before)
                   Host.timers true);
              expect "Native Escape must dismiss only the recorder and release capture"
                ((not (Keyboard_capture.active ()))
                && count_class "shortcut-filter-popover" = 0
                && List.mem search (Lui_store.preorder store));
              let clear_keys =
                List.find
                  (fun id ->
                    Lui_store.string_prop store id "accessibility-label"
                    = Some (I18n.t "keymap/clear-keystroke-filter"))
                  (Lui_store.preorder store)
              in
              dispatch (Press clear_keys);
              expect "Native key-filter clear must restore grouped commands"
                (count_class "th" > 0);
              let saved_shortcuts = Ui_services.storage_get "ls-shortcuts" in
              let refresh () =
                let target = List.find (fun id ->
                    Lui_store.string_prop store id "accessibility-label"
                    = Some I18n.keymap_refresh_all) (Lui_store.preorder store) in
                dispatch (Press target)
              in
              let displays value = List.exists (fun id ->
                  Lui_store.string_prop store id "text" = Some value)
                  (Lui_store.preorder store) in
              Ui_services.storage_set "ls-shortcuts"
                "{:ui/toggle-left-sidebar [\"f8\"]}";
              refresh ();
              expect "Native Refresh must load the persisted shortcut"
                (displays "F8");
              expect "Native Custom count must include the persisted shortcut"
                (Keymap_data.count Keymap_data.Custom = 1);
              let command = List.find (fun (c : Cmdk_services.cmd) ->
                  c.id = "ui/toggle-left-sidebar") ((Cmdk_host.services ()).commands ()) in
              expect "Native command palette must read the same shortcut"
                (command.sc = "f8");
              Ui_services.storage_set "ls-shortcuts"
                "{:ui/toggle-left-sidebar [\"f9\"]}";
              refresh ();
              expect "Native Refresh must replace stale shortcut keycaps"
                (displays "F9" && not (displays "F8"));
              (match saved_shortcuts with
               | Some value -> Ui_services.storage_set "ls-shortcuts" value
               | None -> Ui_services.storage_remove "ls-shortcuts");
              refresh ());
          List.iter prerr_endline (List.rev !errors);
          check "Native Keymap visual geometry and typography" (!errors = [])));
  print_endline "native settings visual geometry: OK"

let () =
  let failures = ref [] in
  let expect message condition =
    if not condition then failures := message :: !failures
  in
  List.iter
    (fun scale ->
      let store = Lui_store.create () in
      let scene =
        Lui_scene.create
          ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:128 ~h:128)
          ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:128 ~h:128)
      in
      let engine =
        Text_engine.create
          ~scene:(fun () -> scene)
          ~scale:(fun () -> scale)
          ~store:(fun () -> store)
      in
      List.iter (Lui_store.apply_op store)
        [
          CreateNode (820000, Column);
          CreateNode (820001, Paragraph);
          InsertChild (820000, 820001, 0);
          SetProp (820000, FontSize, StringValue "14px");
          SetProp (820001, FontSize, StringValue "20px");
        ];
      let text = "a\na" in
      let verify value pitch =
        Lui_store.apply_op store (SetProp (820000, LineHeight, value));
        let rect =
          Lui_scene.rect 0. 0. (200. *. scale) (2. *. pitch *. scale)
        in
        let layout, _, y = Text_engine.text_layout engine 820001 rect text in
        expect "Native text layout ignores the declared line pitch"
          (abs_float (layout.lay_height -. (2. *. pitch)) < 0.001);
        expect "Native measured height differs from its text layout"
          (abs_float
             (snd (Text_engine.measure_text engine 820001 text)
             -. (2. *. pitch *. scale))
          < 0.001);
        let caret = Lui_text.caret_rect layout 2 in
        expect "Native caret does not follow the styled line box"
          (abs_float (caret.ry -. pitch) < 0.001
          && abs_float (caret.rh -. pitch) < 0.001);
        expect "Native hit testing chooses a line from the natural font pitch"
          (Lui_text.hit_test layout (0., pitch *. 1.5) = 2);
        scene.glyphs <- [];
        ignore
          (Text_engine.text_ops engine 820001 rect
             (Lui_scene.color 0 0 0 255)
             text);
        (match scene.glyphs with
        | [ second; first ] ->
            expect "Native painted line pitch differs from layout and caret"
              (abs_float (second.gy -. first.gy -. (pitch *. scale)) <= 1.)
        | _ ->
            failures :=
              "Expected two native glyphs for line-height verification"
              :: !failures);
        expect
          "Native line boxes unexpectedly shift vertically inside their exact \
           height"
          (abs_float y < 0.001);
        let repeated, _, _ = Text_engine.text_layout engine 820001 rect text in
        expect "Repeated line-height layout does not reuse the bounded cache"
          (repeated == layout)
      in
      List.iter
        (fun (value, pitch) -> verify value pitch)
        [
          (StringValue "1.5", 30.);
          (StringValue "28px", 28.);
          (StringValue "1.75rem", 28.);
          (StringValue "2em", 28.);
          (StringValue "150%", 21.);
          (FloatValue 24., 24.);
          (StringValue "10px", 10.);
          (StringValue "40px", 40.);
        ];
      Lui_store.apply_op store
        (SetProp (820001, LineHeight, StringValue "16px"));
      let layout, _, _ =
        Text_engine.text_layout engine 820001
          (Lui_scene.rect 0. 0. 400. 64.)
          text
      in
      expect "A child's explicit line height does not override its ancestor"
        (abs_float (layout.lay_height -. 32.) < 0.001);
      Lui_store.apply_op store
        (SetProp (820001, LineHeight, StringValue "normal"));
      let layout, _, _ =
        Text_engine.text_layout engine 820001
          (Lui_scene.rect 0. 0. 400. 200.)
          text
      in
      let natural = Lui_text.layout (Text_engine.font_of store 820001) text in
      expect "Normal line height no longer uses font metrics"
        (layout.lay_height = natural.lay_height))
    [ 1.; 2. ];
  List.iter prerr_endline (List.rev !failures);
  check "Native styled line height across measure, paint, caret and hit testing"
    (!failures = []);
  print_endline "native styled line height: OK"

let () =
  let first = Filename.temp_file "native-image-" ".png"
  and second = Filename.temp_file "native-image-" ".png" in
  let pressure =
    List.init 5 (fun _ -> Filename.temp_file "native-image-pressure-" ".png")
  in
  let tiny =
    List.init 33 (fun _ -> Filename.temp_file "native-image-tiny-" ".png")
  in
  let oversized = Filename.temp_file "native-image-oversized-" ".png" in
  Fun.protect
    ~finally:(fun () ->
      List.iter Sys.remove ((first :: second :: oversized :: pressure) @ tiny))
    (fun () ->
      let source = Image.create_rgb ~alpha:true 2 2 in
      Image.write_rgba source 0 0 255 0 0 255;
      Image.write_rgba source 1 0 0 255 0 128;
      Image.write_rgba source 0 1 0 0 255 255;
      Image.write_rgba source 1 1 255 255 255 0;
      let buffer = Buffer.create 128 in
      ImageLib.PNG.write (ImageUtil.chunk_writer_of_buffer buffer) source;
      List.iter
        (fun path ->
          Out_channel.with_open_bin path (fun channel ->
              output_string channel (Buffer.contents buffer)))
        [ first; second ];
      List.iter
        (fun path ->
          Out_channel.with_open_bin path (fun channel ->
              output_string channel (Buffer.contents buffer)))
        tiny;
      let write_image width height paths =
        let bitmap = Image.create_rgb ~alpha:true width height in
        let encoded = Buffer.create 1024 in
        ImageLib.PNG.write (ImageUtil.chunk_writer_of_buffer encoded) bitmap;
        List.iter
          (fun path ->
            Out_channel.with_open_bin path (fun channel ->
                output_string channel (Buffer.contents encoded)))
          paths
      in
      write_image 256 256 pressure;
      write_image 513 512 [ oversized ];
      let store = Lui_store.create () in
      List.iter (Lui_store.apply_op store)
        [
          CreateNode (830000, FileImage);
          SetProp (830000, PathValue, StringValue first);
        ];
      let load () =
        Host_icons.image_of store 2. 830000 (Lui_scene.rect 0. 0. 100. 100.)
      in
      let original = Weak.create 1 and changed = Weak.create 1 in
      let verify () =
        let decoded = load () in
        check "Native file-image never decodes its PNG source"
          (Option.is_some decoded);
        let image = Option.get decoded in
        check "Native PNG decoding changed the source dimensions"
          (image.iw = 2 && image.ih = 2);
        check "Native PNG pixels lost orientation or premultiplied alpha"
          (List.init 16 (fun i -> Bytes.get_uint8 image.ipix i)
          = [ 255; 0; 0; 255; 0; 128; 0; 128; 0; 0; 255; 255; 0; 0; 0; 0 ]);
        check "Repeated native PNG paint decodes another image"
          (Option.get (load ()) == image);
        Weak.set original 0 (Some image);
        Lui_store.apply_op store
          (SetProp (830000, PathValue, StringValue second));
        let next = Option.get (load ()) in
        check "Changing a native image path reused the previous resource"
          (next.iid <> image.iid);
        Weak.set changed 0 (Some next)
      in
      verify ();
      Lui_store.apply_op store (DropNode 830000);
      Lui_store.apply_op store (CreateNode (830001, Icon));
      ignore
        (Host_icons.image_of store 1. 830001 (Lui_scene.rect 0. 0. 16. 16.));
      Gc.full_major ();
      let remount path =
        List.iter (Lui_store.apply_op store)
          [
            CreateNode (830002, FileImage);
            SetProp (830002, PathValue, StringValue path);
          ];
        let image =
          Option.get
            (Host_icons.image_of store 1. 830002
               (Lui_scene.rect 0. 0. 100. 100.))
        in
        let weak = Weak.create 1 in
        Weak.set weak 0 (Some image);
        Lui_store.apply_op store (DropNode 830002);
        ignore
          (Host_icons.image_of store 1. 830001 (Lui_scene.rect 0. 0. 16. 16.));
        weak
      in
      let remounted = remount first in
      check "Remounting a native PNG decodes the same resource again"
        (match (Weak.get original 0, Weak.get remounted 0) with
        | Some original_image, Some next -> original_image == next
        | _ -> false);
      List.iter (fun path -> ignore (remount path)) pressure;
      Gc.full_major ();
      check "Native PNG resource cache exceeds its pixel budget"
        ((not (Weak.check original 0)) && not (Weak.check changed 0));
      let large = remount oversized in
      Gc.full_major ();
      check "Oversized unmounted PNG remains in the resource cache"
        (not (Weak.check large 0));
      let oldest = remount (List.hd tiny) in
      List.iter (fun path -> ignore (remount path)) (List.tl tiny);
      Gc.full_major ();
      check "Native PNG resource cache retains an unbounded path history"
        (not (Weak.check oldest 0));
      let previous = remount first in
      Image.write_rgba source 0 0 64 0 0 255;
      Buffer.clear buffer;
      ImageLib.PNG.write (ImageUtil.chunk_writer_of_buffer buffer) source;
      Out_channel.with_open_bin first (fun channel ->
          output_string channel (Buffer.contents buffer));
      let updated = remount first in
      check "Remounting a modified PNG reuses stale pixels"
        (match (Weak.get previous 0, Weak.get updated 0) with
        | Some previous_image, Some updated_image ->
            previous_image.iid <> updated_image.iid
            && Bytes.get_uint8 updated_image.ipix 0 = 64
        | _ -> false));
  print_endline "native PNG decoding and bounded resource reuse: OK"

let () =
  Option.iter
    (fun _ ->
      let store = Lui_store.create () in
      List.iteri
        (fun index mode ->
          let id = 840000 + index and path = "img/" ^ mode ^ "-theme.png" in
          List.iter (Lui_store.apply_op store)
            [
              CreateNode (id, FileImage);
              SetProp (id, PathValue, StringValue path);
            ];
          let before = Unix.gettimeofday () in
          let image =
            Option.get
              (Host_icons.image_of store 2. id (Lui_scene.rect 0. 0. 184. 126.))
          in
          check "Bundled native theme PNG has unexpected dimensions"
            (image.iw = 160 && image.ih = 92);
          Printf.printf "native theme PNG %s decoded %d bytes in %.3f ms\n%!"
            mode (Bytes.length image.ipix)
            ((Unix.gettimeofday () -. before) *. 1000.))
        [ "light"; "dark"; "system" ];
      let before = Unix.gettimeofday () in
      for cycle = 0 to 19 do
        List.iteri
          (fun index mode ->
            let id = 841000 + (cycle * 3) + index in
            List.iter (Lui_store.apply_op store)
              [
                CreateNode (id, FileImage);
                SetProp
                  (id, PathValue, StringValue ("img/" ^ mode ^ "-theme.png"));
              ];
            ignore
              (Host_icons.image_of store 2. id (Lui_scene.rect 0. 0. 184. 126.));
            Lui_store.apply_op store (DropNode id))
          [ "light"; "dark"; "system" ]
      done;
      Printf.printf "native theme PNG remount mean %.3f ms/three images\n%!"
        ((Unix.gettimeofday () -. before) *. 1000. /. 20.);
      print_endline "native bundled theme PNGs: OK")
    (Sys.getenv_opt "LOGSEQ_NATIVE_ASSET_DIR")

let () =
  List.iter (fun scale ->
      let store = Lui_store.create () in
      List.iter (Lui_store.apply_op store)
        [CreateNode (850000, Column); CreateNode (850001, MenuItem);
         SetProp (850001, TextValue, StringValue "English");
         SetProp (850001, FontSize, StringValue "14px");
         SetProp (850001, LineHeight, StringValue "20px");
         SetProp (850001, PaddingHorizontal, IntValue 8);
         SetProp (850001, PaddingVertical, IntValue 6);
         InsertChild (850000, 850001, 0)];
      let scene = Lui_scene.create
        ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:64 ~h:64)
        ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:64 ~h:64) in
      let engine = Text_engine.create ~scene:(fun () -> scene)
        ~scale:(fun () -> scale) ~store:(fun () -> store) in
      let layout = Lui_layout.create () in
      Lui_layout.sync ~scale ~width:800. ~height:600. layout store
        ~measure:(fun id text width _ ->
          Some (Text_engine.pad_size store id ~scale
            (Text_engine.measure_text ~width:(Host_interaction.measure_width width) engine id text)));
      let row = Option.get (Lui_layout.rect layout 850001) in
      Printf.printf "native menu row scale=%.0f height=%.1f expected=%.1f\n%!"
        scale row.Lui_scene.h (32. *. scale);
      check "Menu row counts typed vertical padding twice"
        (abs_float (row.Lui_scene.h -. 32. *. scale) < 0.01))
    [1.; 2.];
  print_endline "native menu intrinsic padding: OK"


let () = Native_embed.with_entry_lock (fun () ->
  let module W = Lui_window in
  let failures = ref [] in
  let expect message condition = if not condition then failures := message :: !failures in
  List.iter (fun recent ->
    let store = Lui_store.create () in
    let backend = {backend_profile=profile MacOS GenericHost;
      apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
    let sidebar = ref None in
    let page = Option.get (Decode.page_of_summary
      (Wire.Map [Wire.Keyword "block/uuid",Wire.Uuid "menu-page";
                 Wire.Keyword "block/title",Wire.String "Menu page"])) in
    let app = Lui_app.create backend () (fun () () -> ())
      (fun context _ _ ->
        let state value = Signal.state context.Lui_ui.ui_scheduler value in
        let st : Sidebar_state.t =
          {favorites=state []; recents=state []; nav_checked=state [];
           nav_tag_titles=state []; items=state [];
           open_menu=state ""; groups_collapsed=state [];
           left_fraction=state 0.2; right_fraction=state 0.3; viewport_w=state 240.} in
        sidebar := Some st;
        Lui_elements.column ~width:240 ~height:100
          [Left_sidebar_view.page_item_el st page
             ~li_class:(if recent then "recent-item" else "favorite-item")
             ~recent ~key:"menu-page-row"]) in
    ignore (Lui_app.start app); ignore (Lui_app.flush app);
    let st = Option.get !sidebar in
    let layout = Lui_layout.create () in
    Lui_layout.sync ~scale:1. ~width:240. ~height:100. layout store;
    let rects = W.Rects.create () in
    List.iter (fun id -> Option.iter (Hashtbl.replace rects id)
      (Lui_layout.rect layout id)) (Lui_store.preorder store);
    let has_class id name =
      match Lui_store.string_prop store id "style-class" with
      | Some value -> List.mem name (String.split_on_char ' ' value)
      | None -> false in
    let find name = List.find (fun id -> has_class id name) (Lui_store.preorder store) in
    let menu = find "sidebar-page-actions" and entry = find "link-item" in
    let ui = W.Ui.create () in
    W.Ui.set_scale ui 1.;
    let click id mods =
      let r = W.Rects.get rects id in
      let x,y = r.Lui_scene.x +. r.w /. 2.,r.y +. r.h /. 2. in
      ignore (W.Ui.handle ui store rects (W.Input.Move (x,y)));
      ignore (W.Ui.handle ui store rects (W.Input.Button_down (x,y,W.Input.Left,1,mods)));
      W.Ui.handle ui store rects (W.Input.Button_up (x,y,W.Input.Left,mods)) in
    let details acts = List.filter_map (function
      | W.Dispatch (PressDetail (id,d)) -> Some (id,d)
      | _ -> None) acts in
    let deliver acts = List.iter (function
      | W.Dispatch event -> ignore (Lui_app.dispatch_event app event)
      | _ -> ()) acts; ignore (Lui_app.flush app) in
    List.iter (fun mods ->
      Runtime.signal_set st.open_menu "";
      let acts = click menu mods in
      let targets = List.map fst (details acts) in
      expect "Sidebar more-button click must not reach a page navigation handler"
        (targets = [menu]);
      (* Dispatch only the menu-owned events: a failing ownership check must
         not navigate the surrounding test application's graph. *)
      deliver (List.filter (function
        | W.Dispatch event -> Lui_protocol.event_node event = menu
        | _ -> false) acts);
      expect "Sidebar more-button click must open its menu"
        (Runtime.signal_get st.open_menu = "lp-menu-page");
      deliver (List.filter (function
        | W.Dispatch event -> Lui_protocol.event_node event = menu
        | _ -> false) (click menu mods));
      expect "Sidebar more-button second click must close its menu"
        (Runtime.signal_get st.open_menu = ""))
      [W.Input.mods_none; {W.Input.mods_none with shift=true}];
    List.iter (fun target ->
      let ds = details (click target {W.Input.mods_none with shift=true}) in
      expect "Sidebar title and file icon must retain one page navigation target"
        (match ds with [(id,d)] -> id=entry && d.modifiers land 2 <> 0 | _ -> false))
      [find "page-title"; find "page-icon"];
    ignore (Lui_app.dispose app)) [false;true];
  List.iter prerr_endline (List.rev !failures);
  check "Native sidebar page and menu input ownership" (!failures = []);
  print_endline "native sidebar page and menu input ownership: OK")

let () = Native_embed.with_entry_lock (fun () ->
  let failures = ref [] in
  let expect message condition = if not condition then failures:=message::!failures in
  let old_sidebar = !Sidebar_state.st_ref and old_sidebar_model = !Sidebar_state.model_signal
  and old_model = !Runtime.read_model and old_worker = !Runtime.worker
  and old_send = !Runtime.app_send and old_flush = !Runtime.app_flush in
  let summary uuid = Wire.Map [Wire.Keyword "block/uuid",Wire.Uuid uuid;
                              Wire.Keyword "block/title",Wire.String "Same title"] in
  let target = Option.get (Decode.page_of_summary (summary "menu-target"))
  and current = Option.get (Decode.page_of_summary (summary "current-route")) in
  let store = Lui_store.create () and sidebar = ref None in
  let backend = {backend_profile=profile MacOS GenericHost;
    apply_batch=(fun batch -> Lui_store.apply_batch store batch;true)} in
  let app = Lui_app.create backend
    {Model.initial with repo=Some "menu-fixture";route_page=Some current}
    (fun model (_ : Action.t) -> model) (fun ctx ms _ ->
      let state value = Signal.state ctx.Lui_ui.ui_scheduler value in
      let st : Sidebar_state.t =
        {favorites=state [target];recents=state [];nav_checked=state [];
         nav_tag_titles=state [];items=state [];
         open_menu=state "";groups_collapsed=state [];
         left_fraction=state 0.2;right_fraction=state 0.3;viewport_w=state 1440.} in
      sidebar:=Some st;Sidebar_state.st_ref:=Some st;Sidebar_state.model_signal:=Some ms;
      Lui_elements.column (Page_menu.page_items target @ [Left_sidebar_view.nav_edit_menu st])) in
  Fun.protect ~finally:(fun () ->
    ignore (Lui_app.dispose app);
    Sidebar_state.st_ref:=old_sidebar;Sidebar_state.model_signal:=old_sidebar_model;
    Runtime.read_model:=old_model;Runtime.worker:=old_worker;
    Runtime.app_send:=old_send;Runtime.app_flush:=old_flush) (fun () ->
      ignore (Lui_app.start app);ignore (Lui_app.flush app);
      let st = Option.get !sidebar in
      let item = List.find (fun id -> Lui_store.kind store id="menu-item")
        (Lui_store.preorder store) in
      let label () = Lui_store.string_prop store item "text" in
      expect "Native favorite label uses the route instead of its target"
        (label ()=Some I18n.unfavorite_page);
      expect "Native navigation checkbox menu displays a translation key instead of Pages"
        (List.exists (fun id ->
          Lui_store.string_prop store id "text"=Some (I18n.t "nav.all-pages/label"))
          (Lui_store.preorder store));
      Runtime.signal_set st.favorites [current];ignore (Lui_app.flush app);
      expect "Native favorite label does not follow its target UUID"
        (label ()=Some I18n.add_to_favorites);
      Runtime.signal_set st.favorites [target];ignore (Lui_app.flush app);
      expect "Native favorite label does not update on the existing row"
        (label ()=Some I18n.unfavorite_page);
      let favorites = Hashtbl.create 2 and writes = ref [] in
      Hashtbl.add favorites "menu-target" true;Hashtbl.add favorites "current-route" false;
      Runtime.worker:=Some {Worker_client.invoke_fn=(fun name args ->
          Js.Promise.resolve (match name,args with
            | "thread-api/favorited-page?",[_;Wire.Uuid uuid] ->
                Wire.Bool (Hashtbl.find favorites uuid)
            | "thread-api/set-page-favorite",[_;Wire.Uuid uuid;Wire.Bool value] ->
                writes:=(uuid,value)::!writes;Hashtbl.replace favorites uuid value;Wire.Nil
            | "thread-api/get-favorite-pages",[_] ->
                Wire.List (List.filter_map (fun uuid ->
                  if Hashtbl.find favorites uuid then Some (summary uuid) else None)
                  ["menu-target";"current-route"])
            | _ -> failwith ("Unexpected favorite fixture request: "^name)));
        on_message=(fun _ _ -> ());dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
      Runtime.read_model:=(fun () -> Lui_app.model app);
      Runtime.app_send:=(fun _ -> false);Runtime.app_flush:=(fun () -> ());
      ignore (Lui_app.dispatch_event app (Press item));ignore (Lui_app.flush app);
      expect "Native favorite action mutates the current route instead of its target"
        (!writes=["menu-target",false]);
      expect "Native favorite action does not refresh the target's label"
        (label ()=Some I18n.add_to_favorites));
  List.iter prerr_endline (List.rev !failures);
  check "Native page-menu favorite target and reactive label" (!failures=[]);
  print_endline "native page-menu favorite target and reactive label: OK")
