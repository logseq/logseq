(* No window or desktop session is needed to exercise the selected
   native text backend. Off-platform LUI stubs must not be selected. *)
module Text = Host_platform.Text

let check name condition =
  if not condition then failwith name

let () =
  check "native platform identity"
    (Host_platform.platform_code = if Host_platform.is_macos then 1 else 4);
  let font = Text.system ~size:16. () in
  let width, height = Text.measure font "Logseq" in
  check "text measurement" (width > 0. && height > 0.);
  let lines = Text.shape font "Logseq" in
  check "text shaping" (Array.length lines > 0);
  let glyph_count = ref 0 in
  let bitmap_count = ref 0 in
  Array.iter
    (fun (line : Text.line) ->
       Array.iter
         (fun (run : Text.run) ->
            Array.iter
              (fun (glyph : Text.glyph) ->
                 incr glyph_count;
                 match Text.rasterize run.font glyph.id with
                 | None -> ()
                 | Some bitmap ->
                   incr bitmap_count;
                   check "glyph buffer size"
                     (Bytes.length bitmap.pixels
                      = bitmap.w * bitmap.h * (if bitmap.color then 4 else 1)))
              run.glyphs)
         line.runs)
    lines;
  check "shaped glyphs" (!glyph_count > 0);
  check "rasterized glyphs" (!bitmap_count > 0);
  print_endline "native host platform: OK"
