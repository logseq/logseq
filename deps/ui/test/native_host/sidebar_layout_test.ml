let check name condition = if not condition then failwith name

let () =
  Platform.install_ui_services ~assert_owner:(fun () -> ())
    ~request_flush:(fun () -> ()) ~dom:Ui_dom_native.ops
    ~timers:Ui_dom_native.timers ~files:Ui_dom_native.files;
  Host.set_window_size 1280. 900.;
  let store = Lui_store.create () and sidebar = ref None in
  let backend =
    { Lui_protocol.backend_profile =
        Lui_protocol.profile Lui_protocol.LinuxOS Lui_protocol.GenericHost
    ; apply_batch = (fun batch -> Lui_store.apply_batch store batch; true) } in
  let model = { Model.initial with right_sidebar_open = true } in
  let app = Lui_app.create backend model Update.apply
      (fun context model _send ->
         Editor_state.ensure context;
         let state = Sidebar_state.ensure model in
         sidebar := Some state;
         Right_sidebar_view.inner state) in
  ignore (Lui_app.start app);
  Runtime.app_send := (fun action -> Lui_app.send app action);
  Runtime.app_flush := (fun () -> ignore (Lui_app.flush app));
  Runtime.read_model := (fun () -> Lui_app.model app);
  let state = Option.get !sidebar in
  let uuid = "11111111-2222-4333-8444-555555555555" in
  let page = Option.get (Decode.page_of_summary (Wire.Map
      [ Wire.Keyword "page-title", Wire.String "Contents"
      ; Wire.Keyword "page-uuid", Wire.Uuid uuid ])) in
  let item : Sidebar_state.item =
    { key = "contents-fixture"; kind = "contents"; uuid = Some uuid
    ; title = "Contents"; icon = None; breadcrumb = []; blocks = []
    ; linked_refs = []; page_ref = None; page = Some page
    ; props_collapsed = true; collapsed = false } in
  Runtime.signal_set state.items [ item ];
  ignore (Lui_app.flush app);
  let layout = Lui_layout.create () in
  let by_id name = List.find (fun id ->
      Lui_store.string_prop store id "accessibility-identifier" = Some name)
      (Lui_store.preorder store) in
  let rect id = Option.get (Lui_layout.rect layout id) in
  let sync () =
    ignore (Lui_app.flush app);
    Lui_layout.sync ~width:560. ~height:900. layout store in
  sync ();
  let body = by_id "sidebar-panel-content-0" in
  Sidebar_state.toggle_collapsed state item.key;
  sync ();
  check "collapsed sidebar bodies use typed display rather than an ignored hidden class"
    (Lui_store.string_prop store body "display" = Some "none");
  let card = by_id "sbi-contents-fixture" in
  check "collapsed sidebar cards shrink to the reference 32px header"
    ((rect card).h = 32.);
  check "collapsed sidebar bodies do not remain pointer targets"
    (Lui_layout.rect layout body = None);
  Sidebar_state.toggle_collapsed state item.key;
  sync ();
  check "reopening a sidebar card preserves its mounted body identity"
    (by_id "sidebar-panel-content-0" = body);
  check "expanded empty Contents cards retain the reference 220px body spacing"
    ((rect (by_id "sbi-contents-fixture")).h = 220.);
  let body_rect = rect body in
  let props = List.find (fun id ->
      Lui_store.string_prop store id "text" = Some (I18n.t "page/open-properties"))
      (Lui_store.preorder store) in
  let props_rect = rect props in
  check "sidebar properties controls retain the reference medium text weight"
    (Lui_store.int_prop store props "font-weight" = Some 500);
  check "sidebar properties controls override the compact control's horizontal padding"
    (Lui_store.int_prop store props "padding-horizontal" = Some 4);
  check "sidebar properties controls stay leading and compact"
    (props_rect.x = body_rect.x +. 20. && props_rect.y = body_rect.y +. 16.
     && props_rect.h = 28. && props_rect.w < 150.);
  check "expanded native sidebar disclosures use the existing down-caret icon"
    (List.exists (fun id -> Lui_store.string_prop store id "name"
        = Some "app:rotating-arrow-down") (Lui_store.preorder store));
  check "sidebar cards carry the reference rounded shadow surface"
    (Lui_store.int_prop store card "corner-radius" = Some 6
     && Lui_store.string_prop store card "shadow" <> None);
  let help = { item with key = "help-fixture"; kind = "help"; title = "Help"
                      ; page = None; collapsed = true } in
  Runtime.signal_set state.items [ help; item ];
  sync ();
  let first = rect (by_id "sbi-help-fixture")
  and second = rect (by_id "sbi-contents-fixture") in
  check "adjacent cards retain the reference eight-pixel drop-indicator spacing"
    (first.h = 32. && second.y = first.y +. first.h +. 8.);
  Runtime.signal_set state.items [ item ];
  Runtime.signal_set state.viewport_w 600.;
  sync ();
  check "small viewports retain the reference 16px gap instead of the desktop 32px gap"
    ((rect (by_id "sbi-contents-fixture")).h = 204.);
  ignore (Lui_app.dispose app);
  print_endline "native sidebar card layout: OK"
