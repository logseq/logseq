let check name condition = if not condition then failwith name

let () =
  Platform.install_ui_services ~assert_owner:(fun () -> ())
    ~request_flush:(fun () -> ()) ~dom:Ui_dom_native.ops
    ~timers:Ui_dom_native.timers ~files:Ui_dom_native.files;
  check "native URI components follow encodeURIComponent rather than query syntax"
    (Ui_services.uri_encode_component "a/b?c=d&e+f,g!~*'()" =
       "a%2Fb%3Fc%3Dd%26e%2Bf%2Cg!~*'()");
  let store = Lui_store.create () in
  let backend =
    { Lui_protocol.backend_profile =
        Lui_protocol.profile Lui_protocol.LinuxOS Lui_protocol.GenericHost
    ; apply_batch = (fun batch -> Lui_store.apply_batch store batch; true) }
  in
  let initial = Model.initial in
  let registry = Lui_extension.registry () in
  Logseq_el.register registry;
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
  print_endline "native header layout: OK"
