open Lui_scene

let check name condition = if not condition then failwith name

let install_theme () =
  let theme = Ui_theme.snapshot Ui_theme.Light in
  Theme_vars.install_snapshot
    (Yojson.Safe.to_string (`Assoc
       [ "mode", `String "light"
       ; "vars", `Assoc (List.map (fun (key, value) -> key, `String value) theme.vars) ]))

let glyph_span kind =
  let store = Lui_store.create () in
  Lui_store.apply_batch store
    { Lui_protocol.generation = 1
    ; ops = [ CreateNode (1, kind); SetProp (1, FontSize, StringValue "14px") ] };
  let scene = Lui_scene.create
      ~mask_atlas:(Atlas.create ~bpp:1 ~w:256 ~h:256)
      ~color_atlas:(Atlas.create ~bpp:4 ~w:256 ~h:256) in
  let engine = Text_engine.create ~scene:(fun () -> scene) ~scale:(fun () -> 1.)
      ~store:(fun () -> store) in
  ignore (Text_engine.text_ops engine 1 (rect 0. 0. 100. 100.)
      (color 0 0 0 255) "reference reference reference");
  check "the native text engine emits glyphs" (scene.glyphs <> []);
  let low, high = List.fold_left (fun (low, high) (glyph : glyph) ->
      Float.min low glyph.gy, Float.max high (glyph.gy +. glyph.gh))
      (Float.infinity, Float.neg_infinity) scene.glyphs in
  high -. low

let line_height () =
  let store = Lui_store.create () in
  Lui_store.apply_batch store
    { Lui_protocol.generation = 1
    ; ops = [ CreateNode (1, Label); SetProp (1, FontSize, StringValue "14px")
            ; SetProp (1, LineHeight, StringValue "28px") ] };
  let scene = Lui_scene.create
      ~mask_atlas:(Atlas.create ~bpp:1 ~w:256 ~h:256)
      ~color_atlas:(Atlas.create ~bpp:4 ~w:256 ~h:256) in
  let engine = Text_engine.create ~scene:(fun () -> scene) ~scale:(fun () -> 1.)
      ~store:(fun () -> store) in
  let _, height = Text_engine.measure_text ~width:100. engine 1
      "reference reference reference" in
  check "native measurement honors the declared line height" (height = 84.);
  ignore (Text_engine.text_ops engine 1 (rect 0. 0. 100. 84.)
      (color 0 0 0 255) "reference reference reference");
  let low, high = List.fold_left (fun (low, high) (glyph : glyph) ->
      Float.min low glyph.gy, Float.max high (glyph.gy +. glyph.gh))
      (Float.infinity, Float.neg_infinity) scene.glyphs in
  check "native painting uses the same line spacing as measurement"
    (high -. low > 60.)

let () =
  install_theme ();
  check "native page typography resolves its app variable before the fallback"
    (Text_engine.parse_len "var(--ls-page-title-size, 32px)" = Some 36.);
  check "settings labels wrap inside their measured column"
    (glyph_span Lui_protocol.Label > 30.);
  line_height ();
  check "button captions stay single-line"
    (glyph_span Lui_protocol.Button < 30.);
  print_endline "native text rendering: OK"
