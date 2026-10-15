let check name condition = if not condition then failwith name
let close a b = Float.abs (a -. b) < 0.001

let () =
  Platform.install_ui_services ~assert_owner:(fun () -> ())
    ~request_flush:(fun () -> ()) ~dom:Ui_dom_native.ops
    ~timers:Ui_dom_native.timers ~files:Ui_dom_native.files;
  Host.set_window_size 1280. 900.;
  Ui_services.storage_remove "ls-left-sidebar-width";
  Ui_services.storage_remove "ls-right-sidebar-width";
  check "the left default is the reference's pixel width"
    (close (Sidebar_state.load_left_width 1280.) 246.);
  check "the right default is the reference's viewport percentage"
    (close (Sidebar_state.load_right_fraction ()) 0.4);
  let rejects key value load =
    Ui_services.storage_set key value;
    match load () with
    | _ -> false
    | exception Invalid_argument _ -> true in
  List.iter (fun value ->
      check "invalid controlled left preferences fail explicitly"
        (rejects "ls-left-sidebar-width" value
          (fun () -> Sidebar_state.load_left_width 1280.));
      check "invalid controlled right preferences fail explicitly"
        (rejects "ls-right-sidebar-width" value Sidebar_state.load_right_fraction))
    [ "nonnumeric"; "nan"; "infinity"; "0"; "-0.1"; "1.5" ];
  Ui_services.storage_set "ls-left-sidebar-width" "0.25";
  check "former native left fractions migrate to pixel units"
    (close (Sidebar_state.load_left_width 1280.) 320.
     && Ui_services.storage_get "ls-left-sidebar-width" = Some "\"320.00px\"");
  check "a migrated pixel width does not drift at another startup width"
    (close (Sidebar_state.load_left_width 1440.) 320.);
  Ui_services.storage_set "ls-right-sidebar-width" "0.3375";
  check "former native right fractions migrate to reference percentage units"
    (close (Sidebar_state.load_right_fraction ()) 0.3375
     && Ui_services.storage_get "ls-right-sidebar-width" = Some "\"33.7500%\"");
  Ui_services.storage_set "ls-left-sidebar-width" "\"300.00px\"";
  Ui_services.storage_set "ls-right-sidebar-width" "\"40%\"";
  let store = Lui_store.create () and state = ref None in
  let backend = { Lui_protocol.backend_profile =
      Lui_protocol.profile Lui_protocol.LinuxOS Lui_protocol.GenericHost;
      apply_batch = (fun batch -> Lui_store.apply_batch store batch; true) } in
  let model = { Model.initial with left_sidebar_open = true } in
  let app = Lui_app.create backend model Update.apply
      (fun context model _send ->
         Editor_state.ensure context;
         state := Some (Sidebar_state.ensure model);
         Lui_elements.box []) in
  ignore (Lui_app.start app);
  Runtime.app_send := (fun action -> Lui_app.send app action);
  Runtime.app_flush := (fun () -> ignore (Lui_app.flush app));
  Runtime.read_model := (fun () -> Lui_app.model app);
  let sidebar = Option.get !state in
  let left () = Runtime.signal_get sidebar.Sidebar_state.left_width in
  let right () = Runtime.signal_get sidebar.Sidebar_state.right_fraction in
  let unchanged_storage action =
    let file = Filename.concat (Sys.getenv "LOGSEQ_UI_STATE_DIR") "ui-state.json" in
    Unix.utimes file 1. 1.;
    action ();
    (Unix.stat file).Unix.st_mtime = 1. in
  let resize_left value = Sidebar_state.on_left_split_resize sidebar (Lui_protocol.ValueChanged (1, value)) in
  let resize_right value = Sidebar_state.on_right_split_resize sidebar (Lui_protocol.ValueChanged (2, value)) in
  check "canonical pixel preferences initialize the mounted owner" (close (left ()) 300.);
  resize_left 0.9;
  check "left dragging clamps its actual state and persisted width to 460px"
    (close (left ()) 460. && Ui_services.storage_get "ls-left-sidebar-width" = Some "\"460.00px\"");
  check "continued dragging beyond the left limit does not rewrite unchanged preferences"
    (unchanged_storage (fun () -> resize_left 0.95));
  resize_left 0.01;
  check "left dragging clamps to 240px, not a viewport-relative minimum" (close (left ()) 240.);
  resize_left (309. /. 1280.);
  Runtime.send Action.Toggle_right_sidebar;
  check "opening the right dock does not change preferred left pixels" (close (left ()) 309.);
  resize_left 0.5;
  check "nested left drag converts its own available track to pixels" (close (left ()) 384.);
  resize_right 0.8;
  check "right drag below 320px but above the close threshold preserves its last width"
    ((Runtime.model ()).right_sidebar_open && close (right ()) 0.4);
  resize_right 0.35;
  check "right preferences preserve percentage while visible width follows the reference 60vw cap"
    (close (right ()) 0.65 && close (Sidebar_state.visible_right_fraction (right ())) 0.6
     && Ui_services.storage_get "ls-right-sidebar-width" = Some "\"65.0000%\"");
  check "vertical right-grip motion does not rewrite unchanged preferences"
    (unchanged_storage (fun () -> resize_right 0.35));
  resize_right 0.1;
  check "right drag above its 70 percent update limit does not change preference" (close (right ()) 0.65);
  resize_right 0.99;
  check "dragging past half the right minimum closes the pane"
    (not (Runtime.model ()).right_sidebar_open);
  resize_right 0.6;
  check "a continuing captured drag can reopen the right pane without overwriting preference"
    ((Runtime.model ()).right_sidebar_open && close (right ()) 0.65);
  Host.set_window_size 1100. 900.;
  Platform.emit_event "resize" (Js.Json.JObject []);
  check "viewport changes retain left pixel preference"
    (close (left ()) 384. && close (Runtime.signal_get sidebar.viewport_w) 1100.);
  check "pixel persistence restores the same width at the new viewport"
    (close (Sidebar_state.load_left_width 1100.) 384.);
  ignore (Lui_app.dispose app);
  print_endline "sidebar width ownership: OK"
