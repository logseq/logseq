open Lui_scene

let check name condition =
  if not condition then failwith name

let snapshot mode =
  let s = Ui_theme.snapshot mode in
  Theme_vars.install_snapshot
    (Yojson.Safe.to_string
       (`Assoc
          [ "mode", `String (if mode = Ui_theme.Dark then "dark" else "light")
          ; "vars", `Assoc (List.map (fun (key, value) -> key, `String value) s.vars)
          ]));
  Theme_vars.set_dark (mode = Ui_theme.Dark)

let resolve name =
  match Theme_vars.color_of name with
  | Some color -> color
  | None -> failwith ("Unresolved app color: " ^ name)

let paint kind props =
  let store = Lui_store.create () in
  Lui_store.apply_batch store
    { Lui_protocol.generation = 1
    ; ops = Lui_protocol.CreateNode (1, kind) ::
        List.map (fun (key, value) -> Lui_protocol.SetProp (1, key, value)) props
    };
  let scene =
    Lui_scene.create
      ~mask_atlas:(Atlas.create ~bpp:1 ~w:64 ~h:64)
      ~color_atlas:(Atlas.create ~bpp:4 ~w:64 ~h:64)
  in
  let hooks =
    { Lui_paint.default_hooks with
      color_of = Theme_vars.color_of
    ; layout = (fun _ -> Lui_paint.placement_of_rect (rect 20. 20. 32. 18.))
    }
  in
  Lui_paint.paint hooks store scene ~width:100 ~height:100 ~scale:1.
    ~clear:(color 0 0 0 0);
  List.filter_map (function Fill fill -> Some fill | _ -> None) scene.ops

let checked_switch () =
  let fills = paint Lui_protocol.SwitchControl [ Lui_protocol.Checked, BoolValue true ] in
  check "checked switch uses the app's primary color, not LUI's default blue"
    (List.exists (fun fill -> fill.fcolor = resolve "var(--primary)") fills)

let unchecked_switch () =
  let fills = paint Lui_protocol.SwitchControl [ Lui_protocol.Checked, BoolValue false ] in
  check "unchecked switch uses the app's input-colored track"
    (List.exists (fun fill -> fill.fcolor = resolve "var(--input)") fills)

let dialog_backdrop () =
  let fills = paint Lui_protocol.Dialog [] in
  let background = resolve "var(--background)" in
  let expected =
    { background with a = int_of_float (Float.round (0.9 *. float background.a)) }
  in
  check "dialog backdrop uses the reference background at ninety percent opacity"
    (List.exists (fun fill -> fill.fcolor = expected && fill.frect.w = 100.) fills)

let functional_alpha () =
  let primary = resolve "var(--primary)" in
  let translucent = resolve "hsl(var(--primary) / 0.5)" in
  check "functional variable colors retain their RGB channels"
    (translucent.r = primary.r && translucent.g = primary.g && translucent.b = primary.b);
  check "functional variable colors multiply the resolved alpha"
    (translucent.a = int_of_float (Float.round (0.5 *. float primary.a)))

let () =
  List.iter
    (fun mode ->
      snapshot mode;
      checked_switch ();
      unchecked_switch ();
      functional_alpha ();
      dialog_backdrop ())
    [ Ui_theme.Light; Ui_theme.Dark ];
  snapshot Ui_theme.Light;
  let muted = resolve "muted-foreground" in
  snapshot Ui_theme.Dark;
  check "native named colors follow the selected app mode"
    (resolve "muted-foreground" <> muted);
  print_endline "native app theme rendering: OK"
