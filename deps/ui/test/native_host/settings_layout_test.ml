open Lui_elements

let check name condition = if not condition then failwith name

let () =
  let store = Lui_store.create () in
  let backend =
    { Lui_protocol.backend_profile =
        Lui_protocol.profile Lui_protocol.LinuxOS Lui_protocol.GenericHost
    ; apply_batch = (fun batch -> Lui_store.apply_batch store batch; true)
    }
  in
  let row_ key label =
    Ui_components.form_row ~key
      ~label:(Ui_components.form_label ~key:(key ^ "-label") ~text:label ())
      ~control:(switch_ ~key:(key ^ "-toggle") ~width:32 ~height:18
                  ~accessibility_identifier:(key ^ "-toggle") []) ()
  in
  let checkbox_checked = ref false in
  let view context _model _send =
    let selected = Signal.state context.Lui_ui.ui_scheduler true in
    column ~cross:`stretch ~min_width:0
      [ row_ "short" "Wide mode"
      ; row_ "long" "Expand block references automatically when zoom-in"
      ; row ~cross:`center
          [ Settings_controls.checkbox_el ~key:"global-font" ~on:false
              ~on_checked:(fun checked -> checkbox_checked := checked)
          ; label ~value:"Set as global font family" [] ]
      ; Ui_components.option_card ~key:"light-mode" ~mode:"light"
          ~thumbnail:(box ~width:92 ~height:63 []) ~label:"light"
          ~selected_signal:(Signal.value selected) ~on_press:(fun _ -> ()) () ]
  in
  let app = Lui_app.create backend () (fun model () -> model) view in
  ignore (Lui_app.start app);
  ignore (Lui_app.flush app);
  let all_nodes () =
    Lui_store.preorder store
  in
  let by_id identifier =
    List.find (fun id ->
        Lui_store.string_prop store id "accessibility-identifier" = Some identifier)
      (all_nodes ())
  in
  let checkbox = List.find (fun id -> Lui_store.kind store id = "checkbox") (all_nodes ()) in
  let layout = Lui_layout.create () in
  let font = Host_platform.Text.system ~size:14. () in
  let measure _id text width _height =
    let width = if Float.is_finite width && width > 0. then width else 0. in
    Some (Host_platform.Text.measure ~width font text)
  in
  List.iter (fun width ->
      Lui_layout.sync ~measure ~width ~height:220. layout store;
      let rect id = Option.get (Lui_layout.rect layout id) in
      let short = rect (by_id "short-toggle")
      and long = rect (by_id "long-toggle") in
      check "settings controls align independently of label length"
        (Float.abs (short.x -. long.x) < 0.5);
      let extent, _ = Lui_layout.content_extent layout in
      check "settings rows stay inside the offered width" (extent <= width +. 0.5);
      let checkbox = rect checkbox in
      check "the global-font checkbox has a visible and clickable native frame"
        (checkbox.w >= 16. && checkbox.h >= 16.))
    [ 720.; 480. ];
  ignore (Lui_app.dispatch_event app (Lui_protocol.ToggleChanged (checkbox, true)));
  ignore (Lui_app.flush app);
  check "the native font checkbox dispatches its checked state" !checkbox_checked;
  let theme = Ui_theme.snapshot Ui_theme.Light in
  Theme_vars.install_snapshot (Yojson.Safe.to_string (`Assoc
      [ "mode", `String "light"
      ; "vars", `Assoc (List.map (fun (key, value) -> key, `String value) theme.vars) ]));
  let scene = Lui_scene.create
      ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:64 ~h:64)
      ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:64 ~h:64) in
  let hooks = { Lui_paint.default_hooks with
      layout = Lui_layout.layout_hook layout; color_of = Theme_vars.color_of } in
  Lui_paint.paint hooks store scene ~width:480 ~height:300 ~scale:1.
    ~clear:(Lui_scene.color 0 0 0 0);
  let primary = Option.get (Theme_vars.color_of "var(--primary)") in
  check "selected theme preview does not paint a filled primary capsule"
    (not (List.exists (function Lui_scene.Fill fill -> fill.fcolor = primary | _ -> false) scene.ops));
  let outline = Option.get (Theme_vars.color_of "var(--ls-link-text-color, var(--primary))") in
  check "selected theme preview keeps its visible thumbnail outline"
    (List.exists (function
       | Lui_scene.Fill fill ->
           fill.fborder_color = outline && fill.fborder = (2., 2., 2., 2.)
           && fill.frect.w = 92.
       | _ -> false) scene.ops);
  ignore (Lui_app.dispose app);
  print_endline "native settings layout: OK"
