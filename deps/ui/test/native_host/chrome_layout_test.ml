let check name condition = if not condition then failwith name

let () =
  Platform.install_ui_services ~assert_owner:(fun () -> ())
    ~request_flush:(fun () -> ()) ~dom:Ui_dom_native.ops
    ~timers:Ui_dom_native.timers ~files:Ui_dom_native.files;
  let seen_prevented = ref false in
  Ui_services.dom_on_document_event ~capture:true "parity-prevention"
    (fun ev -> ev.prevent_default ());
  Ui_services.dom_on_document_event "parity-prevention"
    (fun ev -> seen_prevented := ev.default_prevented);
  Platform.emit_event "parity-prevention" (Js.Json.JObject []);
  check "native capture prevention reaches later document listeners" !seen_prevented;
  check "native dispatch reports consumed defaults to its host"
    (Platform.emit_event_with_default "parity-prevention" (Js.Json.JObject []));
  check "default prevention does not leak into the next event"
    (not (Platform.emit_event_with_default "parity-unhandled" (Js.Json.JObject [])));
  Ui_services.dom_on_document_event ~capture:true "parity-nested"
    (fun ev ->
      ev.prevent_default ();
      check "nested dispatch starts with an independent default state"
        (not (Platform.emit_event_with_default "parity-unhandled" (Js.Json.JObject []))));
  check "nested dispatch preserves its parent's default prevention"
    (Platform.emit_event_with_default "parity-nested" (Js.Json.JObject []));
  Platform.add_event_listener ~capture:true "parity-direct-prevention" Dom_ext.prevent_default;
  check "native snapshot event handlers share default prevention"
    (Platform.emit_event_with_default "parity-direct-prevention" (Js.Json.JObject []));
  Ui_services.dom_on_document_event ~capture:true "parity-stop"
    (fun ev -> ev.stop_propagation ());
  check "propagation stopping alone does not prevent a host default"
    (not (Platform.emit_event_with_default "parity-stop" (Js.Json.JObject [])));

  check "native URI components follow encodeURIComponent rather than query syntax"
    (Ui_services.uri_encode_component "a/b?c=d&e+f,g!~*'()" =
       "a%2Fb%3Fc%3Dd%26e%2Bf%2Cg!~*'()");
  let input_snapshot id ancestor = Js.Json.JObject
      [ "node-id", Js.Json.JNumber (float_of_int id)
      ; "tag", Js.Json.JString "input"
      ; "class", Js.Json.JString "cp__cmdk-search-input"
      ; "ancestors", Js.Json.JArray [| ancestor |] ] in
  let sidebar_owner = Js.Json.JObject [ "id", Js.Json.JString "sidebar-panel-content-0" ]
  and modal_owner = Js.Json.JObject [ "class", Js.Json.JString "cp__cmdk__modal" ] in
  let previous_elements = !Dom_ext.doc_elements_provider
  and previous_host_op = !Host.host_op in
  Dom_ext.doc_elements_provider := (fun () ->
      [ input_snapshot 9001 sidebar_owner; input_snapshot 9002 modal_owner ]);
  let target = ref None in
  Host.set_host_op (fun operation payload ->
      if operation = "dom-op" then
        let index = String.index payload '\n' in
        let json = Js.Json.parseExn (String.sub payload (index + 1)
            (String.length payload - index - 1)) in
        target := Js.Json.decodeNumber (Dom_ext.prop "node-id" (Dom_ext.prop "ref" json)));
  let services = Cmdk_host.services () in
  services.focus_search_input ();
  check "modal focus does not select an earlier pinned-sidebar input" (!target = Some 9002.);
  services.set_input_value "query";
  check "modal value changes do not write into an earlier sidebar input" (!target = Some 9002.);
  let sidebar_services = Cmdk_host.services ~input_container:"sidebar-panel-content-0" () in
  sidebar_services.focus_search_input ();
  check "sidebar focus stays with its owning search panel" (!target = Some 9001.);
  sidebar_services.set_input_value "sidebar query";
  check "sidebar input changes do not overwrite the open modal" (!target = Some 9001.);
  Dom_ext.doc_elements_provider := previous_elements;
  Host.set_host_op previous_host_op;
  let store = Lui_store.create () in
  let backend =
    { Lui_protocol.backend_profile =
        Lui_protocol.profile Lui_protocol.LinuxOS Lui_protocol.GenericHost
    ; apply_batch = (fun batch -> Lui_store.apply_batch store batch; true) }
  in
  let initial = Model.initial in
  let registry = Lui_extension.registry () in
  Logseq_el.register_all registry;
  Logseq_codemirror.register registry;
  Logseq_editor.register registry;
  let view _context model _send = Chrome.shell model in
  let app = Lui_app.create_with_extensions backend registry initial (fun _model model -> model) view in
  ignore (Lui_app.start app);
  let layout = Lui_layout.create () in
  let by_id identifier =
    List.find (fun id ->
        Lui_store.string_prop store id "accessibility-identifier" = Some identifier)
      (Lui_store.preorder store)
  in
  List.iter (fun left_sidebar_open ->
      ignore (Lui_app.send app { initial with left_sidebar_open });
      ignore (Lui_app.flush app);
      Lui_layout.sync ~width:1280. ~height:900. layout store;
      let _, height = Lui_layout.content_extent layout in
      check "the native shell stays inside its offered viewport" (height <= 900.);
      let menu = Option.get (Lui_layout.rect layout (by_id "left-menu")) in
      let reserved = if Platform.is_mac () then 70. else 0. in
      check "native header reserves traffic-light space only on macOS"
        (menu.x = 8. +. reserved && menu.y = 8.))
    [ false; true ];
  List.iter (fun right_sidebar_open ->
      ignore (Lui_app.send app
        { initial with right_sidebar_open
        ; page_menu = Some (1232., 48., 48., true, None) });
      ignore (Lui_app.flush app);
      List.iter (fun width ->
          Lui_layout.sync ~width ~height:900. layout store;
          let head = Option.get (Lui_layout.rect layout (by_id "head")) in
          let menu_id = List.find (fun id ->
              match Lui_store.string_prop store id "style-class" with
              | Some classes -> List.mem "ls-dots-menu" (String.split_on_char ' ' classes)
              | None -> false) (Lui_store.preorder store) in
          let menu = Option.get (Lui_layout.rect layout menu_id) in
          check "the menu follows its header controls rather than the window edge"
            (Float.abs (menu.x +. menu.w -. (head.x +. head.w -. 5.)) < 0.5);
          check "the toolbar menu sits directly below the reference trigger"
            (menu.y = 40. && menu.w = 256.))
        [ 1280.; 1100. ])
    [ false; true ];
  let previous_worker = !Runtime.worker in
  let dead, _, _ = Js.Promise.pending () in
  Runtime.worker := Some
    { Worker_client.invoke_fn = (fun _ _ -> Js.Promise.resolve Wire.Nil)
    ; on_message = (fun _ _ -> ()); dead };
  let block = Decode.block_of_wire (Wire.Map
      [ Wire.Keyword "block/uuid", Wire.Uuid "22222222-2222-4222-8222-222222222222"
      ; Wire.Keyword "block/title", Wire.String "Body typography fixture" ]) in
  let page = Option.get (Decode.page_of_summary (Wire.Map
      [ Wire.Keyword "page-title", Wire.String "Typography fixture"
      ; Wire.Keyword "page-uuid", Wire.Uuid "33333333-3333-4333-8333-333333333333" ])) in
  let page = { page with page_blocks = [ block ] } in
  let model = { Model.initial with phase = Model.Ready; route = Model.Page "fixture"; route_page = Some page } in
  ignore (Lui_app.send app model);
  ignore (Lui_app.flush app);
  let theme = Ui_theme.snapshot Ui_theme.Light in
  Theme_vars.install_snapshot (Yojson.Safe.to_string (`Assoc
      [ "mode", `String "light"
      ; "vars", `Assoc (List.map (fun (key, value) -> key, `String value) theme.vars) ]));
  let by_text text = List.find (fun id -> Lui_store.string_prop store id "text" = Some text)
      (Lui_store.preorder store) in
  let body = by_text "Body typography fixture"
  and title = by_text "Typography fixture" in
  let body_font = Text_engine.font_of store body
  and title_font = Text_engine.font_of store title in
  check "native page body text inherits the reference sixteen-pixel size"
    (Host_platform.Text.size body_font = 16.);
  check "native body text inherits the reference twenty-four-pixel line height"
    (Text_engine.line_height store body body_font = Some 24.);
  check "native page titles retain their separate font size and inherited line-height ratio"
    (Host_platform.Text.size title_font = 36.
     && Text_engine.line_height store title title_font = Some 54.);
  let scene = Lui_scene.create
      ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:256 ~h:256)
      ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:256 ~h:256) in
  let engine = Text_engine.create ~scene:(fun () -> scene)
      ~scale:(fun () -> 1.) ~store:(fun () -> store) in
  let ui = Lui_window.Ui.create () in
  Lui_layout.sync ~width:1280. ~height:900.
    ~hidden:(Lui_window.Ui.hidden ui store)
    ~measure:(fun id text width _ -> Some (Text_engine.measure_text ~width engine id text))
    layout store;
  let title_rect = Option.get (Lui_layout.rect layout title)
  and body_rect = Option.get (Lui_layout.rect layout body) in
  Printf.printf "native page geometry: title %.0f,%.0f body %.0f,%.0f\n%!"
    title_rect.x title_rect.y body_rect.x body_rect.y;
  check "page centering includes the reference asymmetric scrollbar gutter"
    (title_rect.x = 178.);
  check "page title has the reference two-pixel block inset" (title_rect.y = 82.);
  check "ordinary block controls reserve the reference indentation width"
    (body_rect.x = 198.);
  check "body rows follow the reference title and block padding" (body_rect.y = 188.);
  let scroll = by_id "main-content-container" in
  let viewport = Option.get (Lui_layout.rect layout scroll) in
  let left, top, right, bottom = Host_scroll.content_bounds ~viewport
      ~padding_x:16. ~padding_y:32.
      ~rect_of:(fun node -> Option.value (Lui_layout.rect layout node) ~default:(Lui_scene.rect 0. 0. 0. 0.))
      ~children:(fun node ->
        if Lui_window.Ui.hidden ui store node
           || (not (Lui_paint.unboxed store node)
               && Lui_paint.clips (Lui_store.kind store node) store node)
        then [] else Lui_store.child_ids store node)
      (Lui_store.child_ids store scroll) in
  check "short native pages do not create vertical or horizontal scrollbar range"
    (bottom -. top = viewport.h && right -. left = viewport.w);
  let property_area = Hashtbl.find Properties_state.areas
      "page:33333333-3333-4333-8333-333333333333" in
  let hidden_row = Wire.Map
      [ Wire.Keyword "property-ident", Wire.Keyword "logseq.property/publishing-public?"
      ; Wire.Keyword "property", Wire.Map
          [ Wire.Keyword "db/ident", Wire.Keyword "logseq.property/publishing-public?"
          ; Wire.Keyword "block/title", Wire.String "Publishing Public?"
          ; Wire.Keyword "logseq.property/type", Wire.Keyword "checkbox"
          ; Wire.Keyword "logseq.property/hide?", Wire.Bool true ]
      ; Wire.Keyword "value", Wire.Bool false ] in
  Signal.set property_area.a_state
    { Properties_state.empty_area_data with hidden = [ hidden_row ] };
  ignore (Lui_app.flush app);
  check "hidden-only page metadata does not create an empty properties panel"
    (not (List.exists (fun node ->
       match Lui_store.string_prop store node "style-class" with
       | Some classes -> List.mem "ls-properties-area" (String.split_on_char ' ' classes)
       | None -> false) (Lui_store.preorder store)));
  Properties_state.toggle_hidden ();
  ignore (Lui_app.flush app);
  check "explicit hidden-property visibility reveals the page panel"
    (List.exists (fun node ->
       match Lui_store.string_prop store node "style-class" with
       | Some classes -> List.mem "ls-properties-area" (String.split_on_char ' ' classes)
       | None -> false) (Lui_store.preorder store));
  Lui_layout.sync ~width:1280. ~height:900.
    ~hidden:(Lui_window.Ui.hidden ui store)
    ~measure:(fun id text width _ -> Some (Text_engine.measure_text ~width engine id text))
    layout store;
  let checkbox = List.find (fun node -> Lui_store.kind store node = "checkbox") (Lui_store.preorder store) in
  let checkbox_rect = Option.get (Lui_layout.rect layout checkbox) in
  check "native property checkbox values have a visible sixteen-pixel hit target"
    (checkbox_rect.w = 16. && checkbox_rect.h = 16.);
  check "native property checkboxes preserve an explicit false value"
    (not (Lui_store.bool_prop store checkbox "checked"));
  Properties_state.toggle_hidden ();
  ignore (Lui_app.flush app);
  Signal.set property_area.a_state Properties_state.empty_area_data;
  ignore (Lui_app.flush app);
  let long_blocks = List.init 45 (fun index -> Decode.block_of_wire (Wire.Map
      [ Wire.Keyword "block/uuid", Wire.Uuid (Printf.sprintf "22222222-2222-4222-8222-%012d" index)
      ; Wire.Keyword "block/title", Wire.String (Printf.sprintf "Scroll row %02d: repeatable long-page content" (index + 1)) ])) in
  let long_page = { page with page_blocks = long_blocks } in
  ignore (Lui_app.send app { model with route_page = Some long_page });
  ignore (Lui_app.flush app);
  let complete () = List.exists (fun node -> Lui_store.string_prop store node "text" =
      Some "Scroll row 45: repeatable long-page content") (Lui_store.preorder store) in
  let remaining = ref 1000 in
  while not (complete ()) && !remaining > 0 do
    decr remaining;
    Unix.sleepf 0.001;
    Host.drain ();
    ignore (Lui_app.flush app)
  done;
  check "the long-page regression waits for the complete deferred block spine" (complete ());
  Lui_layout.sync ~width:1280. ~height:900.
    ~hidden:(Lui_window.Ui.hidden ui store)
    ~measure:(fun id text width _ -> Some (Text_engine.measure_text ~width engine id text))
    layout store;
  let scroll_rect = Option.get (Lui_layout.rect layout (by_id "main-content-container")) in
  let _, height = Lui_layout.content_extent layout in
  check "long pages keep the native scroll viewport inside the offered window"
    (scroll_rect.h = 852. && height = 900.);
  let scroll = by_id "main-content-container" in
  let _, top, _, bottom = Host_scroll.content_bounds ~viewport:scroll_rect
      ~padding_x:16. ~padding_y:32.
      ~rect_of:(fun node -> Option.value (Lui_layout.rect layout node) ~default:(Lui_scene.rect 0. 0. 0. 0.))
      ~children:(fun node ->
        if Lui_window.Ui.hidden ui store node
           || (not (Lui_paint.unboxed store node)
               && Lui_paint.clips (Lui_store.kind store node) store node)
        then [] else Lui_store.child_ids store node)
      (Lui_store.child_ids store scroll) in
  Printf.printf "long native page range %.0f\n%!" (bottom -. top -. scroll_rect.h);
  check "long pages retain a real scroll range after the viewport is bounded"
    (bottom -. top -. scroll_rect.h > 600.);
  let sidebar_state = Option.get !Sidebar_state.st_ref in
  Signal.set sidebar_state.viewport_w 600.;
  ignore (Lui_app.flush app);
  Lui_layout.sync ~width:600. ~height:700.
    ~hidden:(Lui_window.Ui.hidden ui store)
    ~measure:(fun id text width _ -> Some (Text_engine.measure_text ~width engine id text))
    layout store;
  let scroll = by_id "main-content-container" in
  let scroll_rect = Option.get (Lui_layout.rect layout scroll) in
  check "narrow native viewports use the reference eight-pixel vertical gutter"
    (Lui_store.int_prop store scroll "padding-vertical" = Some 8
     && Lui_store.int_prop store scroll "padding-horizontal" = Some 0);
  check "narrow long pages keep a bounded scroll viewport"
    (scroll_rect.h = 652. && snd (Lui_layout.content_extent layout) = 700.);
  Signal.set sidebar_state.viewport_w 1280.;
  ignore (Lui_app.flush app);
  Runtime.worker := previous_worker;
  ignore (Lui_app.dispose app);
  let page = Option.get (Decode.page_of_summary (Wire.Map
      [ Wire.Keyword "page-title", Wire.String "Clipboard fixture"
      ; Wire.Keyword "page-uuid", Wire.Uuid "11111111-1111-4111-8111-111111111111" ])) in
  let copy_app = Lui_app.create backend () (fun model () -> model)
      (fun _context _model _send -> Lui_elements.column (Page_menu.page_items page)) in
  ignore (Lui_app.start copy_app);
  ignore (Lui_app.flush copy_app);
  let copy_item = List.find_opt (fun id ->
      Lui_store.string_prop store id "text" = Some (I18n.t "page/copy-url"))
      (Lui_store.preorder store) in
  check "native page menus expose the desktop Copy page URL action" (copy_item <> None);
  let previous_model = !Runtime.read_model
  and previous_graph_id = !Runtime.current_graph_uuid
  and previous_host_op = !Host.host_op in
  Runtime.read_model := (fun () -> { Model.initial with repo = Some "logseq_db_work space&+" });
  Runtime.current_graph_uuid := Some "graph-id";
  let copied = ref None in
  Host.set_host_op (fun operation text -> if operation = "clipboard" then copied := Some text);
  ignore (Lui_app.dispatch_event copy_app (Lui_protocol.Press (Option.get copy_item)));
  ignore (Lui_app.flush copy_app);
  check "the native page URL action writes the graph-qualified URL to the host clipboard"
    (!copied = Some "http://localhost:3001/page/11111111-1111-4111-8111-111111111111?graph-id=graph-id");
  Runtime.current_graph_uuid := None;
  Page_ops.copy_url page;
  check "local-only native copy preserves the reference protocol URI encoding"
    (!copied = Some "logseq://graph/work%20space&+?block-id=11111111-1111-4111-8111-111111111111");
  Host.set_host_op previous_host_op;
  Runtime.read_model := previous_model;
  Runtime.current_graph_uuid := previous_graph_id;
  ignore (Lui_app.dispose copy_app);

  List.iter (fun (public, label) ->
      let page = Option.get (Decode.page_of_summary (Wire.Map
          [ Wire.Keyword "page-title", Wire.String "Publishing fixture"
          ; Wire.Keyword "page-uuid", Wire.Uuid "44444444-4444-4444-8444-444444444444"
          ; Wire.Keyword "logseq.property/publishing-public?", Wire.Bool public ])) in
      let menu_app = Lui_app.create backend () (fun model () -> model)
          (fun _context _model _send -> Lui_elements.column (Page_menu.page_items page)) in
      ignore (Lui_app.start menu_app);
      ignore (Lui_app.flush menu_app);
      let action = List.find_opt (fun node ->
          Lui_store.string_prop store node "text" = Some (I18n.t label)) (Lui_store.preorder store) in
      check "native page menus expose the publication flag's current action" (action <> None);
      let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model in
      let mutation = ref None in
      let dead, _, _ = Js.Promise.pending () in
      Runtime.worker := Some
        { Worker_client.invoke_fn = (fun method_name arguments ->
            if method_name = "thread-api/apply-outliner-ops" then mutation := Some arguments;
            Js.Promise.resolve Wire.Nil)
        ; on_message = (fun _ _ -> ()); dead };
      Runtime.read_model := (fun () -> { Model.initial with repo = Some "publication-fixture" });
      ignore (Lui_app.dispatch_event menu_app (Lui_protocol.Press (Option.get action)));
      ignore (Lui_app.flush menu_app);
      Host.drain ();
      check "the native action toggles only the existing local publishing property"
        (!mutation = Some
          [ Wire.String "publication-fixture"
          ; Wire.Array [ Wire.Array [ Wire.Keyword "set-block-property"
              ; Wire.Array [ Wire.Uuid "44444444-4444-4444-8444-444444444444"
                  ; Wire.Keyword "logseq.property/publishing-public?"; Wire.Bool (not public) ] ] ]
          ; Wire.Map [] ]);
      Runtime.worker := previous_worker;
      Runtime.read_model := previous_model;
      ignore (Lui_app.dispose menu_app))
    [ false, "page/make-public"; true, "page/make-private" ];
  let identity = "55555555-5555-4555-8555-555555555555" in
  let page = Option.get (Decode.page_of_summary (Wire.Map
      [ Wire.Keyword "page-title", Wire.String "Eligibility fixture"
      ; Wire.Keyword "page-uuid", Wire.Uuid identity ])) in
  let block_page = { page with page_blocks =
      [ Model.empty_block ~uuid:identity ~title:"Contained block" ~is_page:false ] } in
  List.iter (fun page ->
      let menu_app = Lui_app.create backend () (fun model () -> model)
          (fun _context _model _send -> Lui_elements.column (Page_menu.page_items page)) in
      ignore (Lui_app.start menu_app);
      ignore (Lui_app.flush menu_app);
      check "publication flag actions require an actual page identity"
        (not (List.exists (fun node ->
          let label = Lui_store.string_prop store node "text" in
          label = Some (I18n.t "page/make-public") || label = Some (I18n.t "page/make-private"))
          (Lui_store.preorder store)));
      ignore (Lui_app.dispose menu_app)) [ { page with page_uuid = None }; block_page ];
  print_endline "native header layout: OK"

let () =
  let store = Lui_store.create () in
  let backend =
    { Lui_protocol.backend_profile =
        Lui_protocol.profile Lui_protocol.LinuxOS Lui_protocol.GenericHost
    ; apply_batch = (fun batch -> Lui_store.apply_batch store batch; true) } in
  let frame = { Edit_input.empty_frame with
      caret = Some { Edit_input.x = 34; y = 0; w = 2; h = 24 } } in
  let app = Lui_app.create backend frame (fun _ next -> next)
      (fun _context state _send -> Edit_view.overlay state) in
  ignore (Lui_app.start app);
  ignore (Lui_app.flush app);
  let caret = List.find_opt (fun id ->
      Lui_store.string_prop store id "style-class" = Some "ed-caret")
      (Lui_store.preorder store) in
  check "native rich-text editing retains a visible measured caret"
    (Option.is_some caret);
  let layout = Lui_layout.create () in
  Lui_layout.sync ~width:300. ~height:24. layout store;
  let caret_rect = Option.get (Lui_layout.rect layout (Option.get caret)) in
  check "native caret follows the measured glyph edge and line height"
    (caret_rect.x = 34. && caret_rect.y = 0.
     && caret_rect.w = 2. && caret_rect.h = 24.);
  let scene = Lui_scene.create
      ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:64 ~h:64)
      ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:64 ~h:64) in
  let hooks = { Lui_paint.default_hooks with
      layout = Lui_layout.layout_hook layout; color_of = Theme_vars.color_of } in
  List.iter (fun mode ->
      let theme = Ui_theme.snapshot mode in
      Theme_vars.install_snapshot (Yojson.Safe.to_string (`Assoc
          [ "mode", `String (if mode = Ui_theme.Light then "light" else "dark")
          ; "vars", `Assoc (List.map (fun (key, value) -> key, `String value) theme.vars) ]));
      Lui_paint.paint hooks store scene ~width:300 ~height:24 ~scale:1.
        ~clear:(Lui_scene.color 0 0 0 0);
      let foreground = Option.get (Theme_vars.color_of "foreground") in
      check "native caret paints the app foreground in both themes"
        (List.exists (function
           | Lui_scene.Fill fill -> fill.frect = caret_rect
               && fill.fcolor = foreground && fill.fcolor.a > 0
           | _ -> false) scene.ops)) [ Ui_theme.Dark; Ui_theme.Light ];
  Lui_layout.sync ~scale:2. ~width:600. ~height:48. layout store;
  let scaled_rect = Option.get (Lui_layout.rect layout (Option.get caret)) in
  check "logical caret measurements scale exactly once with native layout"
    (scaled_rect.x = 68. && scaled_rect.y = 0.
     && scaled_rect.w = 4. && scaled_rect.h = 48.);
  ignore (Lui_app.send app Edit_input.empty_frame);
  ignore (Lui_app.flush app);
  check "native caret disappears when its measurement frame is cleared"
    (not (List.exists (fun id ->
        Lui_store.string_prop store id "style-class" = Some "ed-caret")
      (Lui_store.preorder store)));
  ignore (Lui_app.dispose app)

let () =
  let store = Lui_store.create () in
  let backend =
    { Lui_protocol.backend_profile =
        Lui_protocol.profile Lui_protocol.LinuxOS Lui_protocol.GenericHost
    ; apply_batch = (fun batch -> Lui_store.apply_batch store batch; true) } in
  let registry = Lui_extension.registry () in
  Logseq_editor.register registry;
  let page = Option.get (Decode.page_of_summary (Wire.Map
      [ Wire.Keyword "page-title", Wire.String "Title input ownership"
      ; Wire.Keyword "page-uuid", Wire.Uuid "66666666-6666-4666-8666-666666666666" ])) in
  let listeners_before = List.length !Editor_sink.measurement_listeners in
  let app = Lui_app.create_with_extensions backend registry () (fun () () -> ())
      (fun context _model _send ->
         Editor_state.ensure context;
         Page.title_editor page) in
  ignore (Lui_app.start app);
  ignore (Lui_app.flush app);
  let runtime = Lui_app.runtime app in
  let sink = List.find (fun node ->
      Lui_store.string_prop store node "block-id" = page.page_uuid)
      (Lui_store.preorder store) in
  let snapshot = Native_embed_snapshot.ext_snapshot runtime sink in
  let input = Ui_dom_native.el_of snapshot in
  check "native title editor snapshots expose editable input semantics"
    (input.Ui_services.editable ());
  let previous_model = !Runtime.read_model in
  Runtime.read_model := (fun () ->
      { Model.initial with phase = Model.Ready; route = Model.Page "title"
      ; route_page = Some { page with page_blocks =
          [ Model.empty_block ~uuid:"body" ~title:"Body" ~is_page:false ] }
      ; editing_title = true });
  let ev = Ui_dom_native.ev_of (Js.Json.JObject
      [ "target", snapshot; "key", Js.Json.JString "a"
      ; "ctrlKey", Js.Json.JBoolean true ]) in
  Editor_keys.on_keydown ev;
  check "title select-all does not select the page's outline blocks"
    (not (Editor_state.selection_active ()));
  let hidden_before = !Properties_state.show_hidden in
  Editor_keys.chord_seq := [];
  List.iter (fun key ->
      Editor_keys.on_global_key (Ui_dom_native.ev_of (Js.Json.JObject
        [ "target", snapshot; "key", Js.Json.JString key ]))) [ "p"; "a" ];
  check "typing a non-editing shortcut inside the title does not toggle properties"
    (!Properties_state.show_hidden = hidden_before);
  Editor_keys.chord_seq := [];
  ignore (Lui_app.dispatch_event app (Lui_protocol.ExtensionEvent
      (sink, Logseq_editor.identifier, "focus", Lui_protocol.String_map.empty)));
  ignore (Lui_app.flush app);
  Logseq_editor.note_measurement "caret-rect" (Js.Json.JObject
      [ "block-id", Js.Json.JString (Option.get page.page_uuid)
      ; "offset", Js.Json.JNumber (float_of_int (String.length page.page_title))
      ; "x", Js.Json.JNumber 180.; "y", Js.Json.JNumber 0.
      ; "h", Js.Json.JNumber 54. ]);
  Host.drain ();
  ignore (Lui_app.flush app);
  check "a cold native title paints its caret when the first measurement reply arrives"
    (List.exists (fun node ->
        Lui_store.string_prop store node "style-class" = Some "ed-caret")
      (Lui_store.preorder store));
  let caret = List.find (fun node ->
      Lui_store.string_prop store node "style-class" = Some "ed-caret")
      (Lui_store.preorder store) in
  let layout = Lui_layout.create () in
  Lui_layout.sync ~width:180. ~height:54. layout store;
  let rect = Option.get (Lui_layout.rect layout caret) in
  check "a caret at the title's right edge cannot flex-shrink to zero width"
    (rect.x = 180. && rect.w = 2. && rect.h = 54.);
  Runtime.read_model := previous_model;
  ignore (Lui_app.dispose app);
  check "disposing a title editor releases its geometry reply owner"
    (List.length !Editor_sink.measurement_listeners = listeners_before);
  Editor_sink.measurement_changed (Option.get page.page_uuid)
