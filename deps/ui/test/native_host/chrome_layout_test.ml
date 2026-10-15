let check name condition = if not condition then failwith name

let () =
  Platform.install_ui_services ~assert_owner:(fun () -> ())
    ~request_flush:(fun () -> ()) ~dom:Ui_dom_native.ops
    ~timers:Ui_dom_native.timers ~files:Ui_dom_native.files;
  let parent = Js.Json.JObject [ "node-id", Js.Json.JNumber 970. ] in
  let child = Js.Json.JObject
      [ "node-id", Js.Json.JNumber 971.; "ancestors", Js.Json.JArray [| parent |] ] in
  check "native element containment includes the element itself"
    (Dom_ext.el_contains parent parent);
  check "native element containment includes descendants"
    (Dom_ext.el_contains parent child);
  check "native element containment excludes unrelated nodes"
    (not (Dom_ext.el_contains child parent));
  let previous_size = Host.inner_width (), Host.inner_height () in
  let resize_observed = ref None in
  Ui_services.dom_on_window_event "resize" (fun _ ->
      resize_observed := Some (Host.inner_width (), Host.inner_height ()));
  Native_embed_snapshot.platform_event "window-size\n{\"width\":1280,\"height\":900}";
  Host.drain ();
  check "native size reports notify viewport subscribers after updating host dimensions"
    (!resize_observed = Some (1280., 900.));
  Host.set_window_size (fst previous_size) (snd previous_size);
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
  let window_listeners_before = List.length !Host.window_state_listeners in
  let app = Lui_app.create_with_extensions backend registry initial (fun _model model -> model) view in
  ignore (Lui_app.start app);
  let layout = Lui_layout.create () in
  let by_id identifier =
    List.find (fun id ->
        Lui_store.string_prop store id "accessibility-identifier" = Some identifier)
      (Lui_store.preorder store)
  in
  ignore (Lui_app.flush app);
  List.iter (fun identifier ->
      check ("native desktop header exposes " ^ identifier)
        (List.exists (fun node ->
            Lui_store.string_prop store node "accessibility-identifier" = Some identifier)
          (Lui_store.preorder store))) [ "history-back"; "history-forward" ];
  let back_id = by_id "history-back" and forward_id = by_id "history-forward" in
  let keys id =
    Lui_protocol.data_attrs_decode (Option.get (Lui_store.string_prop store id "data-attrs"))
    |> List.assoc "data-tooltip-keys" in
  let modifier = if Platform.is_mac () then "⌘" else "ctrl" in
  check "history tooltips use the current platform binding display"
    (keys back_id = modifier ^ " [" && keys forward_id = modifier ^ " ]");
  if not (Platform.is_mac ()) then
    List.iter (fun identifier ->
        check ("native custom titlebar exposes " ^ identifier)
          (List.exists (fun node ->
              Lui_store.string_prop store node "accessibility-identifier" = Some identifier)
            (Lui_store.preorder store)))
      [ "window-minimize"; "window-toggle-maximized"; "window-close" ];
  if not (Platform.is_mac ()) then begin
    let previous_state = Host.window_state () and previous_op = !Host.host_op in
    let operations = ref [] in
    Host.set_host_op (fun name _ -> operations := !operations @ [ name ]);
    List.iter (fun identifier ->
        ignore (Lui_app.dispatch_event app (Lui_protocol.Press (by_id identifier)));
        ignore (Lui_app.flush app))
      [ "window-minimize"; "window-toggle-maximized"; "window-close" ];
    Host.set_window_state { Host.maximized = true; fullscreen = false };
    ignore (Lui_app.flush app);
    check "authoritative maximized state changes the caption label to Restore"
      (Lui_store.string_prop store (by_id "window-toggle-maximized") "accessibility-label"
       = Some (I18n.t "window/restore"));
    check "the maximized caption uses the reference restore glyph"
      (List.exists (fun node -> Lui_store.string_prop store node "name" =
           Some "app:window-control-restore") (Lui_store.preorder store));
    Host.set_window_state { Host.maximized = false; fullscreen = true };
    ignore (Lui_app.flush app);
    check "fullscreen leaves only the exit control"
      (not (List.exists (fun node -> Lui_store.string_prop store node "accessibility-identifier" =
          Some "window-close") (Lui_store.preorder store)));
    Lui_layout.sync ~width:1280. ~height:900. layout store;
    let exit = Option.get (Lui_layout.rect layout (by_id "window-toggle-fullscreen")) in
    check "the fullscreen exit control occupies the last forty-eight pixels"
      (exit.x = 1232. && exit.y = 0. && exit.w = 48. && exit.h = 48.);
    ignore (Lui_app.dispatch_event app
        (Lui_protocol.Press (by_id "window-toggle-fullscreen")));
    ignore (Lui_app.flush app);
    check "caption controls use the existing host request channel"
      (!operations = [ "window-minimize"; "window-toggle-maximized"; "window-close"
                     ; "window-toggle-fullscreen" ]);
    Host.set_window_state previous_state;
    ignore (Lui_app.flush app);
    Host.set_host_op previous_op
  end;
  let previous_back = !Platform.back_stack and previous_forward = !Platform.fwd_stack in
  let previous_hash = Ui_services.nav_hash () in
  Ui_services.nav_set_hash "#/page/previous";
  Ui_services.nav_set_hash "#/page/current";
  ignore (Lui_app.dispatch_event app (Lui_protocol.Press (by_id "history-back")));
  ignore (Lui_app.flush app);
  check "the native header back control uses route history"
    (Ui_services.nav_hash () = "#/page/previous");
  ignore (Lui_app.dispatch_event app (Lui_protocol.Press (by_id "history-forward")));
  ignore (Lui_app.flush app);
  check "the native header forward control uses route history"
    (Ui_services.nav_hash () = "#/page/current");
  ignore (Lui_app.dispatch_event app (Lui_protocol.Press forward_id));
  ignore (Lui_app.flush app);
  check "forward at the history boundary is a no-op"
    (Ui_services.nav_hash () = "#/page/current");
  Ui_services.nav_back ();
  Ui_services.nav_set_hash "#/page/another";
  ignore (Lui_app.dispatch_event app (Lui_protocol.Press forward_id));
  ignore (Lui_app.flush app);
  check "new navigation retires forward history"
    (Ui_services.nav_hash () = "#/page/another");
  Platform.replace_url_fragment previous_hash;
  Platform.back_stack := previous_back;
  Platform.fwd_stack := previous_forward;
  ignore (Lui_app.send app initial);
  ignore (Lui_app.flush app);
  Lui_layout.sync ~width:1280. ~height:900. layout store;
  let hit_rects = Lui_window.Rects.create () in
  List.iter (fun id -> Option.iter (Hashtbl.replace hit_rects id)
      (Lui_layout.rect layout id)) (Lui_store.preorder store);
  let hit x y = List.hd (Lui_window.hit_path store hit_rects ~x ~y) in
  let rec within ancestor id =
    id = ancestor || match Lui_store.parent store id with
      | Some parent -> within ancestor parent | None -> false in
  let draggable x y =
    Host_events.window_draggable ~kind:(Lui_store.kind store)
      ~identifier:(fun id -> Lui_store.string_prop store id "accessibility-identifier")
      ~parent:(Lui_store.parent store) (hit x y) in
  check "native dragging recognizes the actual header identifier"
    (draggable 400. 24.);
  check "native dragging does not capture header controls or body input"
    (not (draggable 24. 24.) && not (draggable 400. 300.));
  if not (Platform.is_mac ()) then
    check "native dragging does not capture caption controls"
      (not (draggable 1256. 24.));
  check "the caption overlay leaves unused header space reachable"
    (within (by_id "head") (hit 400. 24.));
  check "the caption overlay leaves ordinary page input reachable"
    (within (by_id "main-content-container") (hit 400. 300.));
  if not (Platform.is_mac ()) then
    check "caption buttons opt back into pointer input"
      (within (by_id "window-close") (hit 1256. 24.));
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
          if not (Platform.is_mac ()) then begin
            let close = Option.get (Lui_layout.rect layout (by_id "window-close")) in
            let minimize = Option.get (Lui_layout.rect layout (by_id "window-minimize")) in
            Hashtbl.clear hit_rects;
            List.iter (fun id -> Option.iter (Hashtbl.replace hit_rects id)
                (Lui_layout.rect layout id)) (Lui_store.preorder store);
            check "caption controls remain clickable above the open right dock"
              (within (by_id "window-close") (hit (width -. 24.) 24.));
            check "caption controls remain at the global window edge independently of the right dock"
              (close.x = width -. 48. && minimize.x = width -. 144.
               && close.y = 0. && close.w = 48. && close.h = 48.)
          end;
          let menu_id = List.find (fun id ->
              match Lui_store.string_prop store id "style-class" with
              | Some classes -> List.mem "ls-dots-menu" (String.split_on_char ' ' classes)
              | None -> false) (Lui_store.preorder store) in
          let menu = Option.get (Lui_layout.rect layout menu_id) in
          check "the menu follows its header controls rather than the window edge"
            (let caption = if Platform.is_mac () || right_sidebar_open then 0. else 144. in
             Float.abs (menu.x +. menu.w -. (head.x +. head.w -. 6. -. caption)) < 0.5);
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
  let day1 =
    { page with Model.page_uuid = Some "00000001-2026-1015-0000-000000000000"
    ; page_title = "Oct 15th, 2026"; page_journal_day = Some 20261015
    ; page_blocks = [ { block with Model.block_uuid = Some "day-one-block" } ] } in
  let day2 =
    { day1 with Model.page_uuid = Some "00000001-2026-1014-0000-000000000000"
    ; page_title = "Oct 14th, 2026"; page_journal_day = Some 20261014
    ; page_blocks = [ { block with Model.block_uuid = Some "day-two-block" } ] } in
  ignore (Lui_app.send app
      { model with route = Model.Home; route_page = None; journals = [ day1; day2 ] });
  ignore (Lui_app.flush app);
  Lui_layout.sync ~width:1280. ~height:900.
    ~hidden:(Lui_window.Ui.hidden ui store)
    ~measure:(fun id text width _ -> Some (Text_engine.measure_text ~width engine id text))
    layout store;
  let journal_nodes () = List.filter (fun node ->
      match Lui_store.string_prop store node "style-class" with
      | Some classes -> List.mem "journal-item" (String.split_on_char ' ' classes)
      | None -> false) (Lui_store.preorder store) in
  let journal_rects = List.map (fun node -> Option.get (Lui_layout.rect layout node))
      (journal_nodes ()) in
  check "the native journal fixture renders both days" (List.length journal_rects = 2);
  check "normal desktop journal rows match the reference virtual-row five-hundred-pixel minimum"
    (List.for_all (fun (rect : Lui_scene.rect) -> rect.h = 500.) journal_rects);
  check "the next journal begins immediately after its preceding row"
    ((List.nth journal_rects 1).y = (List.hd journal_rects).y +. 500.);
  let separators () = List.filter (fun node ->
      Lui_store.string_prop store node "background" =
        Some "var(--lx-gray-04, var(--ls-border-color))") (Lui_store.preorder store) in
  check "only a non-final journal has a real native separator" (List.length (separators ()) = 1);
  let separator = Option.get (Lui_layout.rect layout (List.hd (separators ()))) in
  check "the journal separator occupies the final pixel of the row"
    (separator.h = 1. && separator.y = (List.hd journal_rects).y +. 499.);
  let previous_search = Platform.location_search () in
  Platform.set_location_search "?rtc-test=true";
  ignore (Lui_app.send app
      { model with route = Model.Home; route_page = None; journals = [ day2; day1 ] });
  ignore (Lui_app.flush app);
  check "nonvirtual test mode gives only the first day the five-hundred-pixel minimum"
    (List.map (fun node -> Lui_store.int_prop store node "min-height") (journal_nodes ())
     = [ Some 500; Some 250 ]);
  let rec under ancestor node = node = ancestor ||
    match Lui_store.parent store node with
    | Some parent -> under ancestor parent
    | None -> false in
  check "reordering days transfers the separator to the new non-final row"
    (List.length (separators ()) = 1
     && under (List.hd (journal_nodes ())) (List.hd (separators ()))
     && not (under (List.nth (journal_nodes ()) 1) (List.hd (separators ()))));
  Platform.set_location_search previous_search;
  ignore (Lui_app.send app
      { model with route = Model.Home; route_page = None
      ; journals = [ { day1 with page_blocks = long_blocks }; day2 ] });
  ignore (Lui_app.flush app);
  let remaining = ref 1000 in
  while not (complete ()) && !remaining > 0 do
    decr remaining; Unix.sleepf 0.001; Host.drain (); ignore (Lui_app.flush app)
  done;
  check "the tall journal fixture renders all original rows" (complete ());
  Lui_layout.sync ~width:1280. ~height:900.
    ~hidden:(Lui_window.Ui.hidden ui store)
    ~measure:(fun id text width _ -> Some (Text_engine.measure_text ~width engine id text))
    layout store;
  let first_rect = Option.get (Lui_layout.rect layout (List.hd (journal_nodes ()))) in
  let separator_rect = Option.get (Lui_layout.rect layout (List.hd (separators ()))) in
  check "long journal content expands rather than clipping to its minimum"
    (first_rect.h > 1000. && separator_rect.y = first_rect.y +. first_rect.h -. 1.);
  let footers = List.filter (fun node -> Lui_store.kind store node = "spacer"
      && Lui_store.int_prop store node "min-height" = Some 102) (Lui_store.preorder store) in
  check "both journal footers retain at least the reference bottom padding"
    (List.length footers = 2 && List.for_all (fun node ->
       (Option.get (Lui_layout.rect layout node)).h >= 102.) footers);
  Runtime.worker := previous_worker;
  ignore (Lui_app.dispose app);
  check "disposing native chrome releases every window-state subscriber"
    (List.length !Host.window_state_listeners = window_listeners_before);
  List.iter (fun name ->
      let svg = List.assoc name (Icons.app_icon_svgs ()) in
      check "caption glyphs preserve the reference sixteen-pixel SVG coordinate system"
        (I18n.contains svg "viewBox=\"0 0 16 16\""))
    [ "window-control-minimize"; "window-control-maximize"
    ; "window-control-restore"; "window-control-close" ];
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
  let saves_before = List.length !Editor_sink.save_listeners in
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
  let previous_worker = !Runtime.worker and previous_op = !Host.host_op in
  let dead, _, _ = Js.Promise.pending () in
  let saved, resolve_saved, _ = Js.Promise.pending () in
  let latest, resolve_latest, _ = Js.Promise.pending () in
  let mutations = ref [] and close_requests = ref 0 in
  Runtime.worker := Some { Worker_client.invoke_fn = (fun method_name arguments ->
      if method_name = "thread-api/apply-outliner-ops" then begin
        mutations := !mutations @ [ arguments ];
        if List.length !mutations = 1 then saved else latest
      end else Js.Promise.resolve Wire.Nil);
      on_message = (fun _ _ -> ()); dead };
  Runtime.read_model := (fun () ->
      { Model.initial with repo = Some "title-close-fixture"; editing_title = true });
  Host.set_host_op (fun operation _ ->
      if operation = "window-close" then incr close_requests);
  ignore (Lui_app.dispatch_event app (Lui_protocol.ExtensionEvent
      (sink, Logseq_editor.identifier, "insert",
       Lui_protocol.String_map.singleton "text" (Lui_protocol.StringValue " pending"))));
  ignore (Lui_app.flush app);
  Chrome.request_window_close ();
  check "closing saves the locally owned title before requesting window destruction"
    (!mutations <> [] && !close_requests = 0);
  Chrome.request_window_close ();
  check "repeated close requests do not duplicate the pending title save"
    (List.length !mutations = 1);
  ignore (Lui_app.dispatch_event app (Lui_protocol.ExtensionEvent
      (sink, Logseq_editor.identifier, "insert",
       Lui_protocol.String_map.singleton "text" (Lui_protocol.StringValue " latest"))));
  ignore (Lui_app.flush app);
  resolve_saved Wire.Nil;
  Host.drain ();
  check "input received while closing gets a second acknowledged title save"
    (List.length !mutations = 2 && !close_requests = 0);
  resolve_latest Wire.Nil;
  Host.drain ();
  check "the close request follows the worker save acknowledgement" (!close_requests = 1);
  let first_revision, resolve_revision, _ = Js.Promise.pending () in
  let last_revision, _, reject_revision = Js.Promise.pending () in
  let revisions = ref 0 in
  Runtime.worker := Some { Worker_client.invoke_fn = (fun method_name _ ->
      if method_name = "thread-api/apply-outliner-ops" then begin
        incr revisions;
        if !revisions = 1 then first_revision else last_revision
      end else Js.Promise.resolve Wire.Nil);
      on_message = (fun _ _ -> ()); dead };
  let insert text =
    ignore (Lui_app.dispatch_event app (Lui_protocol.ExtensionEvent
        (sink, Logseq_editor.identifier, "insert",
         Lui_protocol.String_map.singleton "text" (Lui_protocol.StringValue text))));
    ignore (Lui_app.flush app) in
  insert " revision";
  Chrome.request_window_close ();
  insert " newest";
  resolve_revision Wire.Nil;
  Host.drain ();
  reject_revision (Failure "expected latest title save rejection");
  Host.drain ();
  check "a successful older title save cannot mask rejection of the latest revision"
    (!revisions = 2 && !close_requests = 1 && not !Chrome.close_pending);
  let rejected, _, reject_save = Js.Promise.pending () in
  Runtime.worker := Some { Worker_client.invoke_fn = (fun method_name _ ->
      if method_name = "thread-api/apply-outliner-ops" then rejected
      else Js.Promise.resolve Wire.Nil);
      on_message = (fun _ _ -> ()); dead };
  ignore (Lui_app.dispatch_event app (Lui_protocol.ExtensionEvent
      (sink, Logseq_editor.identifier, "insert",
       Lui_protocol.String_map.singleton "text" (Lui_protocol.StringValue " rejected"))));
  ignore (Lui_app.flush app);
  Chrome.request_window_close ();
  reject_save (Failure "expected title save rejection");
  check "a rejected buffered title save cancels window destruction"
    (!close_requests = 1 && not !Chrome.close_pending);
  Runtime.worker := Some { Worker_client.invoke_fn = (fun _ _ -> Js.Promise.resolve Wire.Nil);
      on_message = (fun _ _ -> ()); dead };
  Chrome.request_window_close ();
  Host.drain ();
  check "a cancelled close can be retried after the save succeeds" (!close_requests = 2);
  let body = Model.empty_block ~uuid:"body-close-fixture" ~title:"Original body" ~is_page:false in
  Runtime.read_model := (fun () ->
      { Model.initial with repo = Some "title-close-fixture"; route = Model.Page "fixture"
      ; route_page = Some { page with page_blocks = [ body ] } });
  Editor_state.set (fun state -> { state with editing = Some
      (Editor_state.mk_editing ~uuid:(Option.get body.block_uuid) ~buffer:"Pending body close"
         ~scope:"main" ~base:"Original body" ()) });
  let first_body, _, reject_body = Js.Promise.pending () in
  let retry_body, resolve_body, _ = Js.Promise.pending () in
  let body_attempts = ref 0 and body_payloads = ref [] in
  let saves_body title arguments = match arguments with
    | [ Wire.String "title-close-fixture"; Wire.Array operations; _ ] ->
      List.exists (function
        | Wire.Array [ Wire.Keyword "save-block"; Wire.Array [ (Wire.Map _ as block); _ ] ] ->
          Wire.map_get_uuid block "block/uuid" = body.block_uuid
          && Wire.map_get_string block "block/title" = Some title
        | _ -> false) operations
    | _ -> false in
  Runtime.worker := Some { Worker_client.invoke_fn = (fun method_name arguments ->
      if method_name = "thread-api/apply-outliner-ops" then begin
        body_payloads := !body_payloads @ [ arguments ];
        incr body_attempts;
        if !body_attempts = 1 then first_body else retry_body
      end else Js.Promise.resolve Wire.Nil);
      on_message = (fun _ _ -> ()); dead };
  Chrome.request_window_close ();
  Host.drain ();
  check "body shutdown waits for its current dirty buffer acknowledgement"
    (!body_attempts = 1 && !close_requests = 2);
  reject_body (Failure "expected body save rejection");
  Host.drain ();
  check "a rejected body save leaves the editor open for retry"
    (!close_requests = 2 && not !Chrome.close_pending);
  Chrome.request_window_close ();
  Host.drain ();
  check "retrying close resubmits a dirty body even after its save queue was cleared"
    (!body_attempts = 2 && !close_requests = 2
     && List.for_all (saves_body "Pending body close") !body_payloads);
  resolve_body Wire.Nil;
  Host.drain ();
  check "body shutdown follows the successful retry acknowledgement" (!close_requests = 3);
  let autosave, resolve_autosave, _ = Js.Promise.pending () in
  let final_save, resolve_final_save, _ = Js.Promise.pending () in
  let post_input, resolve_post_input, _ = Js.Promise.pending () in
  let inflight_attempts = ref 0 and inflight_payloads = ref [] in
  Runtime.worker := Some { Worker_client.invoke_fn = (fun method_name arguments ->
      if method_name = "thread-api/apply-outliner-ops" then begin
        inflight_payloads := !inflight_payloads @ [ arguments ];
        incr inflight_attempts;
        match !inflight_attempts with 1 -> autosave | 2 -> final_save | _ -> post_input
      end else Js.Promise.resolve Wire.Nil);
      on_message = (fun _ _ -> ()); dead };
  Outliner_ops.schedule_save (Option.get body.block_uuid) "Pending body close";
  Thread.delay 0.45;
  Host.drain ();
  check "the production autosave timer can leave a write in flight with no queued save"
    (!inflight_attempts = 1 && !Outliner_ops.pending_save = None);
  Editor_state.set (fun state -> { state with editing = Option.map (fun editor ->
      Editor_state.with_model editor (Edit_model.set_source editor.model "Newest body close")) state.editing });
  Chrome.request_window_close ();
  Host.drain ();
  check "close does not confuse an empty debounce queue with an acknowledged current buffer"
    (!inflight_attempts = 2 && !close_requests = 3);
  Editor_state.set (fun state -> { state with editing = Option.map (fun editor ->
      Editor_state.with_model editor (Edit_model.set_source editor.model "Typed while closing")) state.editing });
  resolve_final_save Wire.Nil;
  Host.drain ();
  check "body input accepted during shutdown receives another awaited save"
    (!inflight_attempts = 3 && !close_requests = 3
     && saves_body "Newest body close" (List.nth !inflight_payloads 1)
     && saves_body "Typed while closing" (List.nth !inflight_payloads 2));
  resolve_post_input Wire.Nil;
  Host.drain ();
  check "an in-flight autosave does not bypass the latest body acknowledgement" (!close_requests = 4);
  resolve_autosave Wire.Nil;
  Host.drain ();
  Runtime.worker := Some { Worker_client.invoke_fn = (fun _ _ -> Js.Promise.resolve Wire.Nil);
      on_message = (fun _ _ -> ()); dead };
  Editor_state.structure_pending := true;
  Chrome.request_window_close ();
  check "shutdown queues behind an outstanding structural edit"
    (!close_requests = 4 && !Chrome.close_pending);
  Editor_state.structure_pending := false;
  Editor_state.drain_edit_actions ();
  Host.drain ();
  check "shutdown resumes after structural editing settles" (!close_requests = 5);
  Editor_state.set (fun state -> { state with editing = None });
  Runtime.worker := previous_worker;
  Host.set_host_op previous_op;
  Runtime.read_model := previous_model;
  ignore (Lui_app.dispose app);
  check "disposing a title editor releases its buffered-save owner"
    (List.length !Editor_sink.save_listeners = saves_before);
  check "disposing a title editor releases its geometry reply owner"
    (List.length !Editor_sink.measurement_listeners = listeners_before);
  Editor_sink.measurement_changed (Option.get page.page_uuid)

let () =
  let store = Lui_store.create () in
  let backend =
    { Lui_protocol.backend_profile =
        Lui_protocol.profile Lui_protocol.LinuxOS Lui_protocol.GenericHost
    ; apply_batch = (fun batch -> Lui_store.apply_batch store batch; true) } in
  let registry = Lui_extension.registry () in
  Logseq_editor.register registry;
  let uuid = "77777777-7777-4777-8777-777777777777" in
  let page = Option.get (Decode.page_of_summary (Wire.Map
      [ Wire.Keyword "page-title", Wire.String "Clipboard title"
      ; Wire.Keyword "page-uuid", Wire.Uuid uuid ])) in
  let app = Lui_app.create_with_extensions backend registry () (fun () () -> ())
      (fun _context _model _send -> Page.title_editor page) in
  ignore (Lui_app.start app);
  ignore (Lui_app.flush app);
  let sink = List.find (fun node ->
      Lui_store.string_prop store node "block-id" = Some uuid)
      (Lui_store.preorder store) in
  let previous_host_op = !Host.host_op in
  let copied = ref [] in
  Host.set_host_op (fun operation payload ->
      if operation = "clipboard" then copied := payload :: !copied);
  let event name fields =
    ignore (Lui_app.dispatch_event app (Lui_protocol.ExtensionEvent
        (sink, Logseq_editor.identifier, name,
         List.fold_left (fun acc (key, value) -> Lui_protocol.String_map.add key value acc)
           Lui_protocol.String_map.empty fields)));
    ignore (Lui_app.flush app) in
  let menu name = event "menu" [ "name", Lui_protocol.StringValue name ] in
  let select_all () = event "key"
      [ "key", Lui_protocol.StringValue "a"; "ctrl", Lui_protocol.BoolValue true ] in
  let previous_trees = !Editor_state.clipboard
  and previous_text = !Editor_state.clipboard_text in
  Editor_state.clipboard := [ Model.empty_block ~uuid:"old" ~title:"Clipboard title" ~is_page:false ];
  Editor_state.clipboard_text := "Clipboard title";
  menu "copy";
  check "collapsed title copy uses the reference block-ref format"
    (!copied = [ "[[" ^ uuid ^ "]]" ]);
  check "plain title copy retires the previous structured clipboard provenance"
    (!Editor_state.clipboard = [] && !Editor_state.clipboard_text = "");
  copied := [];
  menu "cut";
  check "collapsed title cut does not overwrite the clipboard" (!copied = []);
  select_all ();
  menu "copy";
  check "selected title copy reads its local model, not the empty native sink"
    (!copied = [ "Clipboard title" ]);
  copied := [];
  menu "cut";
  check "selected title cut copies its selected source exactly once"
    (!copied = [ "Clipboard title" ]);
  check "selected title cut removes the source from its local buffer"
    (not (List.exists (fun node ->
        Lui_store.string_prop store node "text" = Some "Clipboard title")
      (Lui_store.preorder store)));
  event "insert" [ "text", Lui_protocol.StringValue "First line\nSecond line" ];
  List.iter (fun text ->
      check "title paste preserves multiline source without creating outline blocks"
        (List.exists (fun node -> Lui_store.string_prop store node "text" = Some text)
          (Lui_store.preorder store))) [ "First line"; "Second line" ];
  select_all ();
  copied := [];
  menu "copy";
  check "multiline title copy preserves source newlines"
    (!copied = [ "First line\nSecond line" ]);
  event "insert" [ "text", Lui_protocol.StringValue "café 😀 suffix" ];
  event "pointer" [ "offset", Lui_protocol.IntValue 6 ];
  event "pointer" [ "offset", Lui_protocol.IntValue 10; "extend", Lui_protocol.BoolValue true ];
  copied := [];
  menu "copy";
  check "native title selection copies whole UTF-8 characters from byte offsets"
    (!copied = [ "😀" ]);
  Host.set_host_op previous_host_op;
  Editor_state.clipboard := previous_trees;
  Editor_state.clipboard_text := previous_text;
  ignore (Lui_app.dispose app)

let () =
  let previous_state = !Tooltip.state in
  let state = Signal.state (Signal.scheduler ()) None in
  Tooltip.state := Some state;
  let pending = ref true in
  let trigger =
    { (Ui_dom_native.el_of (Js.Json.JObject [])) with
      Ui_services.attr = (function "aria-label" -> Some "History" | _ -> None)
    ; rect_pending = (fun () -> !pending)
    ; rect = (fun () -> if !pending then (0., 0., 0., 0.) else (1144., 8., 32., 32.)) } in
  let owner = ref None in
  let trigger =
    { trigger with Ui_services.closest = (fun _ -> !owner)
    ; contains = (fun other -> other.Ui_services.token = trigger.Ui_services.token) } in
  owner := Some trigger;
  let event =
    { (Ui_dom_native.ev_of (Js.Json.JObject [])) with Ui_services.target = Some trigger } in
  Tooltip.show_for trigger;
  check "a tooltip waits for its native trigger geometry"
    (Runtime.signal_get state = None);
  pending := false;
  Unix.sleepf 0.03;
  Host.drain ();
  check "a cold tooltip starts below its measured trigger"
    (match Runtime.signal_get state with
     | Some tip -> tip.Tooltip.tip_x = 1160. && tip.tip_y = 40.
     | None -> false);
  Tooltip.on_mousemove event;
  check "pointer movement within the visible tooltip trigger keeps it open"
    (Runtime.signal_get state <> None);
  Tooltip.hide ();
  pending := true;
  Tooltip.show_for trigger;
  Tooltip.hide ();
  pending := false;
  Unix.sleepf 0.03;
  Host.drain ();
  check "dismissal cancels a queued trigger measurement"
    (Runtime.signal_get state = None);
  Tooltip.hide ();
  Unix.sleepf 0.03;
  Host.drain ();
  Tooltip.on_mousemove event;
  (* A native timeout already in the UI mailbox survives clear_timeout. *)
  let rec wait_queued attempts =
    Mutex.lock Host.lock;
    let queued = not (Queue.is_empty Host.queue) in
    Mutex.unlock Host.lock;
    if queued || attempts = 0 then queued
    else (Unix.sleepf 0.01; wait_queued (attempts - 1)) in
  check "the hover timeout reached the native UI mailbox before dismissal" (wait_queued 200);
  Tooltip.hide ();
  Host.drain ();
  check "dismissal cancels an expired hover callback already queued in the native mailbox"
    (Runtime.signal_get state = None);
  Tooltip.hide ();
  Tooltip.state := previous_state
