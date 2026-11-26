(* Rasterize KaTeX layout commands produced by the trusted embedded
   QuickJS runtime. Coordinates arrive in root ems with y positive up. *)

type ink = { r : int; g : int; b : int }

(* Image resources load on worker domains. Serialize the raster pass so
   concurrent math resources cannot race the font engine cache. *)
let raster_mutex = Mutex.create ()

let clamp255 v = max 0 (min 255 (int_of_float (v +. 0.5)))

let blend_pixel image x y r g b alpha =
  if x >= 0 && y >= 0 && x < image.Image.width && y < image.Image.height && alpha > 0 then begin
    let sa = float alpha /. 255. in
    Image.read_rgba image x y (fun er eg eb ea ->
      let da = float ea /. 255. in
      let out_a = sa +. (da *. (1. -. sa)) in
      if out_a <= 0. then Image.write_rgba image x y 0 0 0 0
      else
        let channel s e =
          clamp255 (((float s *. sa) +. (float e *. da *. (1. -. sa))) /. out_a)
        in
        Image.write_rgba image x y (channel r er) (channel g eg) (channel b eb)
          (clamp255 (out_a *. 255.)))
  end

let fill_rect image ink x0 y0 x1 y1 =
  for y = max 0 (int_of_float (Float.round y0)) to min (image.Image.height - 1) (int_of_float (Float.round y1) - 1) do
    for x = max 0 (int_of_float (Float.round x0)) to min (image.Image.width - 1) (int_of_float (Float.round x1) - 1) do
      blend_pixel image x y ink.r ink.g ink.b 255
    done
  done

let draw_mask image ink baseline pen bitmap =
  let stride = bitmap.Lui_text.w * (if bitmap.Lui_text.color then 4 else 1) in
  for yy = 0 to bitmap.Lui_text.h - 1 do
    for xx = 0 to bitmap.Lui_text.w - 1 do
      let offset = (yy * stride) + (xx * if bitmap.Lui_text.color then 4 else 1) in
      let alpha, cr, cg, cb =
        if bitmap.Lui_text.color then
          (Char.code (Bytes.get bitmap.Lui_text.pixels (offset + 3)),
           Char.code (Bytes.get bitmap.Lui_text.pixels offset),
           Char.code (Bytes.get bitmap.Lui_text.pixels (offset + 1)),
           Char.code (Bytes.get bitmap.Lui_text.pixels (offset + 2)))
        else (Char.code (Bytes.get bitmap.Lui_text.pixels offset), ink.r, ink.g, ink.b)
      in
      if alpha > 0 then
        blend_pixel image (int_of_float pen + bitmap.Lui_text.left + xx)
          (int_of_float baseline + bitmap.Lui_text.top + yy) cr cg cb alpha
    done
  done

let draw_text image ink ~unit ~pad ~layout_height (item : Native_katex.text_item) =
  let size = Float.max 1. (item.size *. unit) in
  let weight = if item.bold then 700 else 400 in
  let font = Lui_text.create ~families:[ item.font; "KaTeX_Main" ] ~weight ~italic:item.italic ~size () in
  let lines = Lui_text.shape font item.text in
  let origin_x = pad +. (item.x *. unit) in
  let baseline = pad +. ((layout_height -. item.y) *. unit) in
  Array.iter (fun (line : Lui_text.line) ->
    Array.iter (fun (run : Lui_text.run) ->
      Array.iter (fun glyph ->
        match Lui_text.rasterize ~scale:1. run.font glyph.Lui_text.id with
        | Some bitmap ->
            draw_mask image ink (baseline +. glyph.Lui_text.y)
              (origin_x +. glyph.Lui_text.x) bitmap
        | None -> ())
      run.Lui_text.glyphs)
    line.Lui_text.runs)
  lines

let xml_escape s =
  let b = Buffer.create (String.length s) in
  String.iter (fun c ->
    match c with
    | '&' -> Buffer.add_string b "&amp;"
    | '<' -> Buffer.add_string b "&lt;"
    | '>' -> Buffer.add_string b "&gt;"
    | '"' -> Buffer.add_string b "&quot;"
    | c -> Buffer.add_char b c) s;
  Buffer.contents b

let draw_svg image ink ~unit ~pad ~layout_height (item : Native_katex.svg_item) =
  if Array.length item.Native_katex.view_box = 4 && item.paths <> [] && item.sw > 0. && item.sh > 0. then begin
    let width = max 1 (int_of_float (Float.round (item.sw *. unit))) in
    let height = max 1 (int_of_float (Float.round (item.sh *. unit))) in
    let vb = item.view_box in
    let paths =
      item.paths
      |> List.map (fun path ->
           Printf.sprintf "<path d=\"%s\" fill=\"currentColor\"/>" (xml_escape path))
      |> String.concat ""
    in
    let source =
      Printf.sprintf
        "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"%d\" height=\"%d\" viewBox=\"%g %g %g %g\" preserveAspectRatio=\"xMinYMin slice\" color=\"rgb(%d,%d,%d)\">%s</svg>"
        width height vb.(0) vb.(1) vb.(2) vb.(3) ink.r ink.g ink.b paths
    in
    match Lui_svg.render source ~w:width ~h:height with
    | Error _ -> ()
    | Ok rendered ->
        let left = int_of_float (Float.round (pad +. (item.sx *. unit))) in
        let top = int_of_float (Float.round (pad +. ((layout_height -. item.sy) *. unit))) in
        for yy = 0 to min height rendered.Lui_scene.ih - 1 do
          for xx = 0 to min width rendered.Lui_scene.iw - 1 do
            let offset = (yy * rendered.Lui_scene.iw * 4) + (xx * 4) in
            let a = Char.code (Bytes.get rendered.Lui_scene.ipix (offset + 3)) in
            if a > 0 then begin
              let unpremul channel =
                clamp255 (float channel *. 255. /. float (max 1 a))
              in
              blend_pixel image (left + xx) (top + yy)
                (unpremul (Char.code (Bytes.get rendered.Lui_scene.ipix offset)))
                (unpremul (Char.code (Bytes.get rendered.Lui_scene.ipix (offset + 1))))
                (unpremul (Char.code (Bytes.get rendered.Lui_scene.ipix (offset + 2))))
                a
            end
          done
        done
  end

let png_bytes_with_ink ~dark ~tex ~display =
  match Native_katex.layout ~tex ~display with
  | Error _ -> None
  | Ok layout ->
      let scale = 2. in
      let unit = Native_katex.body_size *. scale in
      let pad = 4. in
      let width = max 1 (int_of_float (Float.ceil (layout.width *. unit +. (2. *. pad)))) in
      let height = max 1 (int_of_float (Float.ceil ((layout.height +. layout.depth) *. unit +. (2. *. pad)))) in
      let image = Image.create_rgb ~alpha:true ~max_val:255 width height in
      Image.fill_rgb ~alpha:0 image 0 0 0;
      let ink = if dark then { r = 235; g = 235; b = 235 } else { r = 32; g = 32; b = 32 } in
      List.iter (fun item ->
        match item with
        | Native_katex.Text value -> draw_text image ink ~unit ~pad ~layout_height:layout.height value
        | Native_katex.Rule value ->
            let x0 = pad +. (value.Native_katex.rx *. unit) in
            let x1 = x0 +. (value.rw *. unit) in
            let y1 = pad +. ((layout.height -. value.ry) *. unit) in
            let y0 = y1 -. (value.rh *. unit) in
            fill_rect image ink x0 y0 x1 y1
        | Native_katex.Svg value -> draw_svg image ink ~unit ~pad ~layout_height:layout.height value)
        layout.items;
      let encoded = Buffer.create 4096 in
      ImageLib.PNG.write (ImageUtil.chunk_writer_of_buffer encoded) image;
      Some (Buffer.to_bytes encoded)

let png_cache = Hashtbl.create 64

let png_bytes ~dark ~tex ~display =
  let key = (dark, tex, display) in
  Mutex.lock raster_mutex;
  Fun.protect ~finally:(fun () -> Mutex.unlock raster_mutex) (fun () ->
    match Hashtbl.find_opt png_cache key with
    | Some encoded -> Some encoded
    | None ->
        let encoded = png_bytes_with_ink ~dark ~tex ~display in
        (match encoded with
         | Some bytes ->
             if Hashtbl.length png_cache >= 128 then Hashtbl.reset png_cache;
             Hashtbl.add png_cache key bytes
         | None -> ());
        encoded)
