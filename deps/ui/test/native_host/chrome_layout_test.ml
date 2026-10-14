let check name condition = if not condition then failwith name

let () =
  Platform.install_ui_services ~assert_owner:(fun () -> ())
    ~request_flush:(fun () -> ()) ~dom:Ui_dom_native.ops
    ~timers:Ui_dom_native.timers ~files:Ui_dom_native.files;
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
  print_endline "native header layout: OK"
