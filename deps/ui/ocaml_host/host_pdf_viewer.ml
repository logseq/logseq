(* Self-drawn PDF viewer extension for the OCaml host. The app owns
   annotation persistence; this module owns only document rasterization,
   viewer geometry, pointer gestures and host events. *)

open Lui_scene

type attrs = {
  path : string;
  identity : string;
  repo : string;
  instance : string;
  page : int;
  scale_text : string;
  hls_json : Yojson.Safe.t;
  highlight_mode : bool;
  area_mode : bool;
  colored : bool;
  dashed : bool;
}

type geometry = {
  toolbar_h : float;
  content : rect;
  page_rect : rect;
  pdf_scale : float;
  page_width : float;
  page_height : float;
}

type drag = {
  node : int;
  x0 : float;
  y0 : float;
  mutable x1 : float;
  mutable y1 : float;
}

type menu = {
  node : int;
  hl_id : string;
  menu_x : float;
  menu_y : float;
}

let last_pointer = ref (0., 0.)

type viewer_state = {
  mutable scroll_y : float;
  mutable drag : drag option;
  mutable menu : menu option;
  mutable key : string;
}

let states : (int, viewer_state) Hashtbl.t = Hashtbl.create 4

let json_parse text =
  try Some (Yojson.Safe.from_string text) with _ -> None

let string_member json key =
  match json with
  | `Assoc fields -> (
      match List.assoc_opt key fields with
      | Some (`String value) -> value
      | _ -> "")
  | _ -> ""

let bool_string value = value = "true"

let attrs_of store id =
  match Option.bind (Lui_store.string_prop store id "attrs") json_parse with
  | None -> None
  | Some json ->
      let path = string_member json "path" in
      if path = "" then None
      else
        let hls_json =
          match string_member json "hls" with
          | "" -> `List []
          | text -> (
              match json_parse text with
              | Some (`List _ as value) -> value
              | _ -> `List [])
        in
        Some
          {
            path;
            identity = string_member json "identity";
            repo = string_member json "repo";
            instance = string_member json "instance";
            page = max 1 (try int_of_string (string_member json "page") with _ -> 1);
            scale_text = string_member json "scale";
            hls_json;
            highlight_mode = bool_string (string_member json "hl_mode");
            area_mode = bool_string (string_member json "area_mode");
            colored = bool_string (string_member json "colored");
            dashed = bool_string (string_member json "dashed");
          }

let state_for id attrs =
  let key =
    Printf.sprintf "%s:%d:%s" attrs.path attrs.page attrs.scale_text
  in
  match Hashtbl.find_opt states id with
  | Some state when state.key = key -> state
  | state_opt ->
      let state =
        match state_opt with
        | Some state -> state.key <- key; state.scroll_y <- 0.; state.drag <- None; state.menu <- None; state
        | None -> { scroll_y = 0.; drag = None; menu = None; key }
      in
      Hashtbl.replace states id state;
      state

let numeric_scale value =
  try
    let scale = float_of_string (String.trim value) in
    if Float.is_finite scale && scale > 0. then Some scale else None
  with _ -> None

let logical ctx value = value *. ctx.Lui_paint.scale

let geometry ctx attrs r =
  let s = ctx.Lui_paint.scale in
  let toolbar_h = 40. *. s in
  let margin = 12. *. s in
  let content = rect r.x (r.y +. toolbar_h) r.w (Float.max 0. (r.h -. toolbar_h)) in
  let page_width, page_height =
    try Host_pdf.page_size attrs.path attrs.page with _ -> (612., 792.)
  in
  let fit =
    if page_width > 0. && content.w > (2. *. margin) then
      (content.w -. (2. *. margin)) /. (page_width *. s)
    else 1.
  in
  let pdf_scale = Option.value (numeric_scale attrs.scale_text) ~default:(Float.min 3. fit) in
  let width = page_width *. pdf_scale *. s in
  let height = page_height *. pdf_scale *. s in
  let x = content.x +. Float.max margin ((content.w -. width) /. 2.) in
  let y = content.y +. margin in
  {
    toolbar_h;
    content;
    page_rect = rect x y width height;
    pdf_scale;
    page_width;
    page_height;
  }

let clamp_scroll state geom =
  let visible = Float.max 0. (geom.content.h -. (12. *. 2.)) in
  let maximum = Float.max 0. (geom.page_rect.h -. visible) in
  state.scroll_y <- Float.min maximum (Float.max 0. state.scroll_y)

let clamp01 value = Float.min 1. (Float.max 0. value)

let pdf_point_scrolled state geom ~x ~y =
  ( clamp01 ((x -. geom.page_rect.x) /. geom.page_rect.w)
  , clamp01 ((y -. geom.page_rect.y +. state.scroll_y) /. geom.page_rect.h) )

let inside rect x y =
  x >= rect.x && x <= rect.x +. rect.w && y >= rect.y && y <= rect.y +. rect.h

let image_cache : (string * int * int, image) Hashtbl.t = Hashtbl.create 16

let page_image attrs geom ctx =
  let raster_scale = geom.pdf_scale *. ctx.Lui_paint.scale in
  let key = (attrs.path, attrs.page, int_of_float (raster_scale *. 1000.)) in
  match Hashtbl.find_opt image_cache key with
  | Some image -> Some image
  | None ->
      (try
         let ppm = Host_pdf.render_ppm attrs.path attrs.page raster_scale in
         match Host_image.decode ppm with
         | Ok image ->
             if Hashtbl.length image_cache > 4 then Hashtbl.reset image_cache;
             Hashtbl.replace image_cache key image;
             Some image
         | Error _ -> None
       with _ -> None)

let solid_fill fill_color r alpha =
  Lui_paint.fill r (0., 0., 0., 0.) ~paint:Solid ~c1:fill_color ~c2:fill_color
    ~grad:(0., 0., 0., 0.) ~border:(0., 0., 0., 0.)
    ~bcolor:(color 0 0 0 0) ~dashed:false ~alpha

let rounded_fill fill_color radius r alpha =
  let radii = (radius, radius, radius, radius) in
  Lui_paint.fill r radii ~paint:Solid ~c1:fill_color ~c2:fill_color
    ~grad:(0., 0., 0., 0.) ~border:(0., 0., 0., 0.)
    ~bcolor:(color 0 0 0 0) ~dashed:false ~alpha

let rect_of_json json =
  match json with
  | `Assoc fields ->
      let number key =
        match List.assoc_opt key fields with
        | Some (`Float value) -> value
        | Some (`Int value) -> float value
        | _ -> 0.
      in
      Some (number "x1", number "y1", number "x2", number "y2", number "w", number "h")
  | _ -> None

let highlight_color = function
  | "red" -> color 239 68 68 92
  | "green" -> color 34 197 94 92
  | "blue" -> color 59 130 246 92
  | "purple" -> color 168 85 247 92
  | _ -> color 250 204 21 96

let normalized (x1, y1, x2, y2, w, h) =
  if w > 1.5 && h > 1.5 then (x1 /. w, y1 /. h, x2 /. w, y2 /. h)
  else (x1, y1, x2, y2)

let highlight_ops attrs geom alpha =
  match attrs.hls_json with
  | `List items ->
      List.concat_map
        (fun item ->
          match item with
          | `Assoc fields -> (
              let page =
                match List.assoc_opt "page" fields with
                | Some (`Float n) -> int_of_float n
                | Some (`Int n) -> n
                | _ -> 0
              in
              if page <> attrs.page then []
              else
                let tint =
                  match List.assoc_opt "color" fields with
                  | Some (`String name) -> highlight_color name
                  | _ -> highlight_color "yellow"
                in
                let rect_values =
                  match List.assoc_opt "rects" fields with
                  | Some (`List (_ :: _ as rects)) -> rects
                  | _ -> (match List.assoc_opt "bounding" fields with Some value -> [ value ] | None -> [])
                in
                (match rect_values with
                | rects ->
                    List.filter_map
                      (fun value ->
                        match rect_of_json value with
                        | None -> None
                        | Some raw ->
                            let x1, y1, x2, y2 = normalized raw in
                            let x = geom.page_rect.x +. (x1 *. geom.page_rect.w) in
                            let y = geom.page_rect.y +. (y1 *. geom.page_rect.h) in
                            let w = Float.max 1. ((x2 -. x1) *. geom.page_rect.w) in
                            let h = Float.max 1. ((y2 -. y1) *. geom.page_rect.h) in
                            Some (solid_fill tint (rect x y w h) alpha))
                      rects))
          | _ -> [])
        items
  | _ -> []

let menu_width ctx = 156. *. ctx.Lui_paint.scale
let menu_row_h ctx = 26. *. ctx.Lui_paint.scale

let menu_labels =
  [ "copy", "Copy reference"; "open", "Open reference"; "delete", "Delete";
    "yellow", "Yellow"; "red", "Red"; "green", "Green"; "blue", "Blue";
    "purple", "Purple" ]

let menu_frame ctx frame menu =
  let width = menu_width ctx in
  let height = menu_row_h ctx *. float (List.length menu_labels) in
  let x = Float.min menu.menu_x (frame.x +. frame.w -. width -. 4.) in
  let y = Float.min menu.menu_y (frame.y +. frame.h -. height -. 4.) in
  rect (Float.max (frame.x +. 4.) x) (Float.max (frame.y +. 4.) y) width height

let menu_hit ctx frame menu x y =
  let outer = menu_frame ctx frame menu in
  if not (inside outer x y) then None
  else
    let row = int_of_float ((y -. outer.y) /. menu_row_h ctx) in
    match List.nth_opt menu_labels row with
    | Some (action, _) -> Some action
    | None -> None

let highlight_at attrs geom x y =
  let rec first = function
    | item :: rest -> (
        match item with
        | `Assoc fields -> (
            let page =
              match List.assoc_opt "page" fields with
              | Some (`Float n) -> int_of_float n
              | Some (`Int n) -> n
              | _ -> 0
            in
            if page <> attrs.page then first rest
            else
              let hit_rect value =
                match rect_of_json value with
                | None -> false
                | Some raw ->
                    let x1, y1, x2, y2 = normalized raw in
                    let rx = geom.page_rect.x +. (x1 *. geom.page_rect.w) in
                    let ry = geom.page_rect.y +. (y1 *. geom.page_rect.h) in
                    let rw = (x2 -. x1) *. geom.page_rect.w in
                    let rh = (y2 -. y1) *. geom.page_rect.h in
                    x >= rx && x <= rx +. rw && y >= ry && y <= ry +. rh
              in
              let rect_values =
                match List.assoc_opt "rects" fields with
                | Some (`List (_ :: _ as rects)) -> rects
                | _ -> (match List.assoc_opt "bounding" fields with Some value -> [ value ] | None -> [])
              in
              let hit = List.exists hit_rect rect_values in
              if hit then
                match List.assoc_opt "id" fields with
                | Some (`String id) -> Some id
                | _ -> first rest
              else first rest)
        | _ -> first rest)
    | [] -> None
  in
  match attrs.hls_json with
  | `List items -> first items
  | _ -> None

let button_rects ctx r =
  let s = ctx.Lui_paint.scale in
  let size = 28. *. s in
  let gap = 6. *. s in
  let y = r.y +. ((40. *. s -. size) /. 2.) in
  let right = r.x +. r.w -. (8. *. s) in
  let close = rect (right -. size) y size size in
  let ann = rect (close.x -. gap -. size) y size size in
  let area = rect (ann.x -. gap -. size) y size size in
  let highlight = rect (area.x -. gap -. size) y size size in
  let zoom_in = rect (highlight.x -. gap -. size) y size size in
  let zoom_out = rect (zoom_in.x -. gap -. size) y size size in
  let next = rect (zoom_out.x -. gap -. size) y size size in
  let prev = rect (next.x -. gap -. size) y size size in
  [ ("close", close); ("annots", ann); ("area", area); ("highlight", highlight);
    ("zoom-in", zoom_in); ("zoom-out", zoom_out); ("next", next); ("prev", prev) ]

let button_label = function
  | "close" -> "×"
  | "annots" -> "≡"
  | "area" -> "▣"
  | "highlight" -> "H"
  | "zoom-in" -> "+"
  | "zoom-out" -> "−"
  | "next" -> "›"
  | "prev" -> "‹"
  | _ -> ""

let label_ops ctx node_id r label fg alpha =
  let ops = ctx.Lui_paint.hooks.text_ops node_id r fg label in
  List.map
    (fun op ->
      match op with
      | Fill fill -> Fill { fill with fopacity = fill.fopacity *. alpha }
      | Shadow shadow -> Shadow { shadow with sopacity = shadow.sopacity *. alpha }
      | Glyphs glyphs -> Glyphs { glyphs with gopacity = glyphs.gopacity *. alpha }
      | Image image -> Image { image with iopacity = image.iopacity *. alpha }
      | other -> other)
    ops

let menu_ops ctx node_id frame menu fg alpha =
  let dark = Theme_vars.current_dark () in
  let outer = menu_frame ctx frame menu in
  let bg = if dark then color 39 39 42 245 else color 255 255 255 245 in
  let line = if dark then color 82 82 91 160 else color 212 212 216 160 in
  solid_fill line (rect outer.x outer.y outer.w outer.h) alpha
  :: solid_fill bg
       (rect (outer.x +. 1.) (outer.y +. 1.) (outer.w -. 2.) (outer.h -. 2.)) alpha
  :: List.concat_map
       (fun (row, (action, label)) ->
         let y = outer.y +. (float row *. menu_row_h ctx) in
         let r = rect (outer.x +. 8.) y (outer.w -. 16.) (menu_row_h ctx) in
         let color swatch =
           solid_fill swatch
             (rect r.x (r.y +. (r.h -. 8.) /. 2.) 8. 8.) alpha
         in
         let swatches =
           match action with
           | "yellow" -> [ color (highlight_color "yellow") ]
           | "red" -> [ color (highlight_color "red") ]
           | "green" -> [ color (highlight_color "green") ]
           | "blue" -> [ color (highlight_color "blue") ]
           | "purple" -> [ color (highlight_color "purple") ]
           | _ -> []
         in
         swatches @ label_ops ctx node_id r label fg alpha)
       (List.mapi (fun index item -> (index, item)) menu_labels)


let paint ctx store node frame =
  let id = Lui_store.node_id node in
  match attrs_of store id with
  | None -> []
  | Some attrs ->
      let state = state_for id attrs in
      let geom = geometry ctx attrs frame in
      clamp_scroll state geom;
      let dark = Theme_vars.current_dark () in
      let surface = if dark then color 24 24 27 255 else color 244 244 245 255 in
      let toolbar_bg = if dark then color 39 39 42 255 else color 255 255 255 255 in
      let fg = if dark then color 228 228 231 255 else color 63 63 70 255 in
      let page_shadow = if dark then color 0 0 0 120 else color 0 0 0 42 in
      let alpha = 1. in
      let page_dst =
        rect geom.page_rect.x
          (geom.page_rect.y -. state.scroll_y)
          geom.page_rect.w geom.page_rect.h
      in
      let base =
        [ solid_fill surface frame alpha;
          solid_fill toolbar_bg (rect frame.x frame.y frame.w geom.toolbar_h) alpha ]
      in
      let page_ops =
        match page_image attrs geom ctx with
        | Some image ->
            [ solid_fill page_shadow
                (rect (page_dst.x +. (2. *. ctx.scale)) (page_dst.y +. (3. *. ctx.scale)) page_dst.w page_dst.h)
                alpha;
              Image
                {
                  irect2 = page_dst;
                  iradii = (0., 0., 0., 0.);
                  icontinuous = false;
                  iimage = image;
                  isrc = rect 0. 0. (float image.iw) (float image.ih);
                  igrayscale = false;
                  iopacity = alpha;
                } ]
        | None ->
            [ solid_fill (color 255 255 255 255) page_dst alpha ]
            @ label_ops ctx id page_dst "PDF unavailable" fg alpha
      in
      let highlight_ops =
        let shifted =
          rect geom.page_rect.x (geom.page_rect.y -. state.scroll_y) geom.page_rect.w geom.page_rect.h
        in
        highlight_ops attrs { geom with page_rect = shifted } alpha
      in
      let drag_ops =
        match state.drag with
        | None -> []
        | Some drag ->
            let x = Float.min drag.x0 drag.x1 in
            let y = Float.min drag.y0 drag.y1 in
            let w = Float.abs (drag.x1 -. drag.x0) in
            let h = Float.abs (drag.y1 -. drag.y0) in
            if w < 1. || h < 1. then []
            else [ solid_fill (color 59 130 246 70) (rect x y w h) alpha ]
      in
      let clip = Push_clip { crect = geom.content; cradii = (0., 0., 0., 0.); ccontinuous = false } in
      let toolbar_ops =
        List.concat_map
          (fun (name, br) ->
            let active =
              (name = "highlight" && attrs.highlight_mode)
              || (name = "area" && attrs.area_mode)
            in
            let bg = if active then color 59 130 246 90 else color 0 0 0 0 in
            rounded_fill bg (6. *. ctx.Lui_paint.scale) br alpha
            :: label_ops ctx id br (button_label name) fg alpha)
          (button_rects ctx frame)
      in
      let page_label = Printf.sprintf "%d" attrs.page in
      let overlay_ops =
        match state.menu with
        | Some menu when menu.node = id ->
            menu_ops ctx id frame menu fg alpha
        | _ -> []
      in
      base @ [ clip ] @ page_ops @ highlight_ops @ drag_ops @ [ Pop_clip ]
      @ toolbar_ops
      @ label_ops ctx id (rect frame.x frame.y (frame.w *. 0.45) geom.toolbar_h) page_label fg alpha
      @ overlay_ops

let json_escape text =
  let buffer = Buffer.create (String.length text + 8) in
  String.iter
    (fun ch ->
      match ch with
      | '"' -> Buffer.add_string buffer "\\\""
      | '\\' -> Buffer.add_string buffer "\\\\"
      | '\n' -> Buffer.add_string buffer "\\n"
      | '\r' -> Buffer.add_string buffer "\\r"
      | '\t' -> Buffer.add_string buffer "\\t"
      | _ -> Buffer.add_char buffer ch)
    text;
  Buffer.contents buffer

let emit store node_id name extra =
  match attrs_of store node_id with
  | None -> ()
  | Some attrs ->
      let common =
        [ "\"repo\":\"" ^ json_escape attrs.repo ^ "\"";
          "\"identity\":\"" ^ json_escape attrs.identity ^ "\"";
          "\"instance\":\"" ^ json_escape attrs.instance ^ "\"";
          "\"nodeId\":" ^ string_of_int node_id ]
      in
      Native_embed.platform_event
        (name ^ "\n{" ^ String.concat "," (common @ extra) ^ "}")


let emit_hl store node_id name hl_id extra =
  emit store node_id name
    (("\"id\":\"" ^ json_escape hl_id ^ "\"") :: extra)

let run_menu_action store node_id action hl_id =
  match action with
  | "copy" -> emit_hl store node_id "pdf-hl-ref" hl_id []
  | "open" -> emit_hl store node_id "pdf-hl-link" hl_id []
  | "delete" -> emit_hl store node_id "pdf-hl-del" hl_id []
  | "yellow" | "red" | "green" | "blue" | "purple" ->
      emit_hl store node_id "pdf-hl-color" hl_id
        [ "\"color\":\"" ^ action ^ "\"" ]
  | _ -> ()

let hit_button ctx frame x y =
  List.find_opt (fun (_name, rect) -> inside rect x y) (button_rects ctx frame)

let change_scale attrs current_fit delta =
  let current = Option.value (numeric_scale attrs.scale_text) ~default:current_fit in
  let next = Float.max 0.25 (Float.min 5. (current *. delta)) in
  Printf.sprintf "\"scale\":\"%.2f\"" next

let master_rect_json geom x1 y1 x2 y2 =
  Printf.sprintf
    "{\"x1\":%.6f,\"y1\":%.6f,\"x2\":%.6f,\"y2\":%.6f,\"w\":%.6f,\"h\":%.6f}"
    (x1 *. geom.page_rect.w) (y1 *. geom.page_rect.h)
    (x2 *. geom.page_rect.w) (y2 *. geom.page_rect.h)
    geom.page_rect.w geom.page_rect.h

let scale_position_rect geom json =
  match json with
  | `Assoc fields ->
      let number key =
        match List.assoc_opt key fields with
        | Some (`Float value) -> value
        | Some (`Int value) -> float value
        | _ -> 0.
      in
      `Assoc
        [ "x1", `Float (number "x1" *. geom.page_rect.w);
          "y1", `Float (number "y1" *. geom.page_rect.h);
          "x2", `Float (number "x2" *. geom.page_rect.w);
          "y2", `Float (number "y2" *. geom.page_rect.h);
          "w", `Float geom.page_rect.w;
          "h", `Float geom.page_rect.h ]
  | _ -> json

let scale_position_fields geom fields =
  let replace key value fields =
    List.map (fun (name, existing) -> if name = key then (name, value) else (name, existing)) fields
  in
  let fields =
    match List.assoc_opt "bounding" fields with
    | Some value -> replace "bounding" (scale_position_rect geom value) fields
    | None -> fields
  in
  match List.assoc_opt "rects" fields with
  | Some (`List rects) -> replace "rects" (`List (List.map (scale_position_rect geom) rects)) fields
  | _ -> fields

let selection_payload attrs geom state x0 y0 x1 y1 =
  let nx0, ny0 = pdf_point_scrolled state geom ~x:x0 ~y:y0 in
  let nx1, ny1 = pdf_point_scrolled state geom ~x:x1 ~y:y1 in
  try
    let json = Host_pdf.selection_json attrs.path attrs.page nx0 ny0 nx1 ny1 in
    match json_parse json with
    | Some (`Assoc fields) ->
        let text =
          match List.assoc_opt "text" fields with
          | Some (`String value) -> value
          | _ -> ""
        in
        if String.trim text = "" then None
        else
          let additions =
            [ ("id", `String (Host.random_uuid ()));
              ("page", `Int attrs.page);
              ("color", `String "yellow") ]
          in
          let cleaned = List.filter (fun (key, _) -> not (List.mem key [ "id"; "page"; "color" ])) fields in
          Some (Yojson.Safe.to_string (`Assoc (additions @ scale_position_fields geom cleaned)))
    | _ -> None
  with _ -> None

let base64_encode input =
  let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/" in
  let output = Buffer.create (((Bytes.length input + 2) / 3) * 4) in
  let byte index = if index < Bytes.length input then Char.code (Bytes.get input index) else 0 in
  let rec loop index =
    if index < Bytes.length input then (
      let b0 = byte index and b1 = byte (index + 1) and b2 = byte (index + 2) in
      let remain = Bytes.length input - index in
      Buffer.add_char output alphabet.[b0 lsr 2];
      Buffer.add_char output alphabet.[((b0 land 3) lsl 4) lor (b1 lsr 4)];
      Buffer.add_char output (if remain > 1 then alphabet.[((b1 land 15) lsl 2) lor (b2 lsr 6)] else '=');
      Buffer.add_char output (if remain > 2 then alphabet.[b2 land 63] else '=');
      loop (index + 3))
  in
  loop 0;
  Buffer.contents output

let area_png attrs geom state x0 y0 x1 y1 =
  let nx0, ny0 = pdf_point_scrolled state geom ~x:x0 ~y:y0 in
  let nx1, ny1 = pdf_point_scrolled state geom ~x:x1 ~y:y1 in
  let left = Float.min nx0 nx1 and right = Float.max nx0 nx1 in
  let top = Float.min ny0 ny1 and bottom = Float.max ny0 ny1 in
  if right -. left < 0.005 || bottom -. top < 0.005 then None
  else
    try
      let raster_scale = geom.pdf_scale *. 2. in
      let ppm = Host_pdf.render_ppm attrs.path attrs.page raster_scale in
      match Host_image.decode ppm with
      | Error _ -> None
      | Ok source ->
          let sx = int_of_float (left *. float source.iw) in
          let sy = int_of_float (top *. float source.ih) in
          let sw = max 1 (int_of_float ((right -. left) *. float source.iw)) in
          let sh = max 1 (int_of_float ((bottom -. top) *. float source.ih)) in
          let width = min sw (source.iw - sx) and height = min sh (source.ih - sy) in
          if width <= 0 || height <= 0 then None
          else
            let image = Image.create_rgb ~alpha:true ~max_val:255 width height in
            Image.fill_rgb ~alpha:0 image 0 0 0;
            for y = 0 to height - 1 do
              for x = 0 to width - 1 do
                let offset = (((sy + y) * source.iw) + sx + x) * 4 in
                let r = Char.code (Bytes.get source.ipix offset) in
                let g = Char.code (Bytes.get source.ipix (offset + 1)) in
                let b = Char.code (Bytes.get source.ipix (offset + 2)) in
                let a = Char.code (Bytes.get source.ipix (offset + 3)) in
                Image.write_rgba image x y r g b a
              done
            done;
            let encoded = Buffer.create 1024 in
            ImageLib.PNG.write (ImageUtil.chunk_writer_of_buffer encoded) image;
            Some (base64_encode (Buffer.to_bytes encoded))
    with _ -> None

let handle_input store ~scale ~rect_of ~hit_path input =
  let find_pdf x y =
    let rec find = function
      | id :: _ when Lui_store.kind store id = "extension:logseq-pdf" -> Some id
      | _ :: rest -> find rest
      | [] -> None
    in
    let path = hit_path ~x:(x *. scale) ~y:(y *. scale) in
    find path
  in
  match input with
  | Lui_window.Input.Button_down (x, y, Lui_window.Input.Left, _, _) -> (
      match find_pdf x y with
      | None -> false
      | Some id -> (
          match attrs_of store id with
          | None -> true
          | Some attrs ->
              let state = state_for id attrs in
              let dx = x *. scale and dy = y *. scale in
              state.drag <- Some { node = id; x0 = dx; y0 = dy; x1 = dx; y1 = dy };
              true))
  | Lui_window.Input.Move (x, y) -> (
      last_pointer := (x, y);
      let updated =
        Hashtbl.fold
          (fun id state acc ->
            match state.drag with
            | Some drag when drag.node = id ->
                drag.x1 <- x *. scale;
                drag.y1 <- y *. scale;
                true || acc
            | _ -> acc)
          states false
      in
      updated)
  | Lui_window.Input.Button_down (x, y, Lui_window.Input.Right, _, _) -> (
      match find_pdf x y with
      | None -> false
      | Some _ -> true)
  | Lui_window.Input.Button_up (x, y, Lui_window.Input.Right, _) -> (
      match find_pdf x y with
      | None -> false
      | Some id -> (
          match attrs_of store id with
          | None -> true
          | Some attrs ->
              let state = state_for id attrs in
              let frame = rect_of id in
              let geom = geometry { Lui_paint.hooks = Lui_paint.default_hooks; scale; viewport = frame; deferred = Queue.create () } attrs frame in
              let shifted =
                rect geom.page_rect.x (geom.page_rect.y -. state.scroll_y)
                  geom.page_rect.w geom.page_rect.h
              in
              let hit =
                highlight_at attrs { geom with page_rect = shifted }
                  (x *. scale) (y *. scale)
              in
              state.menu <-
                (match hit with
                 | Some hl_id ->
                     Some { node = id; hl_id; menu_x = x *. scale; menu_y = y *. scale }
                 | None -> None);
              true))
  | Lui_window.Input.Button_up (x, y, Lui_window.Input.Left, _) -> (
      let result = ref false in
      Hashtbl.iter
        (fun id state ->
          match state.drag with
          | None -> ()
          | Some drag when drag.node <> id -> ()
          | Some drag ->
              state.drag <- None;
              result := true;
              (match attrs_of store id with
               | None -> ()
               | Some attrs ->
                   let frame = rect_of id in
                   let geom = geometry { Lui_paint.hooks = Lui_paint.default_hooks; scale; viewport = frame; deferred = Queue.create () } attrs frame in
                   let dx = x *. scale and dy = y *. scale in
                   let moved =
                     Float.abs (dx -. drag.x0) > 4. || Float.abs (dy -. drag.y0) > 4.
                   in
                   if not moved then (
                     let host_ctx = { Lui_paint.hooks = Lui_paint.default_hooks; scale; viewport = frame; deferred = Queue.create () } in
                     let menu_handled =
                       match state.menu with
                       | Some menu when menu.node = id ->
                           state.menu <- None;
                           (match menu_hit host_ctx frame menu dx dy with
                            | Some action -> run_menu_action store id action menu.hl_id
                            | None -> ());
                           true
                       | _ -> false
                     in
                     if menu_handled then ()
                     else
                     let hit = hit_button host_ctx frame dx dy in
                     match hit with
                     | Some ("close", _) -> emit store id "pdf-close" []
                     | Some ("annots", _) -> emit store id "pdf-annots" []
                     | Some ("highlight", _) ->
                         emit store id "pdf-mode"
                           [ "\"name\":\"highlight\""; "\"on\":" ^ if attrs.highlight_mode then "\"false\"" else "\"true\"" ]
                     | Some ("area", _) ->
                         emit store id "pdf-mode"
                           [ "\"name\":\"area\""; "\"on\":" ^ if attrs.area_mode then "\"false\"" else "\"true\"" ]
                     | Some ("zoom-in", _) -> emit store id "pdf-scale" [ change_scale attrs geom.pdf_scale 1.1 ]
                     | Some ("zoom-out", _) -> emit store id "pdf-scale" [ change_scale attrs geom.pdf_scale (1. /. 1.1) ]
                     | Some ("next", _) ->
                         (try
                            if attrs.page < Host_pdf.page_count attrs.path then
                              emit store id "pdf-page" [ "\"page\":" ^ string_of_int (attrs.page + 1) ]
                          with _ -> ())
                     | Some ("prev", _) when attrs.page > 1 -> emit store id "pdf-page" [ "\"page\":" ^ string_of_int (attrs.page - 1) ]
                     | _ -> ())
                   else begin
                     let visible_page =
                       rect geom.page_rect.x (geom.page_rect.y -. state.scroll_y)
                         geom.page_rect.w geom.page_rect.h
                     in
                     if inside visible_page drag.x0 drag.y0 then begin
                       if attrs.area_mode then begin
                         match area_png attrs geom state drag.x0 drag.y0 dx dy with
                         | Some png ->
                             let nx0, ny0 = pdf_point_scrolled state geom ~x:drag.x0 ~y:drag.y0 in
                             let nx1, ny1 = pdf_point_scrolled state geom ~x:dx ~y:dy in
                             let left = Float.min nx0 nx1 and right = Float.max nx0 nx1 in
                             let top = Float.min ny0 ny1 and bottom = Float.max ny0 ny1 in
                             let rect_json = master_rect_json geom left top right bottom in
                             emit store id "pdf-hl-area"
                               [ "\"id\":\"" ^ Host.random_uuid () ^ "\"";
                                 "\"page\":" ^ string_of_int attrs.page;
                                 "\"color\":\"yellow\"";
                                 "\"text\":\"\"";
                                 "\"bounding\":" ^ rect_json;
                                 "\"rects\":[" ^ rect_json ^ "]";
                                 "\"png\":\"" ^ png ^ "\"" ]
                         | None -> ()
                       end else if attrs.highlight_mode then begin
                         match selection_payload attrs geom state drag.x0 drag.y0 dx dy with
                         | Some payload ->
                             Native_embed.platform_event ("pdf-hl-add\n" ^
                               (match json_parse payload with
                                | Some (`Assoc fields) ->
                                    let common =
                                      [ ("repo", `String attrs.repo); ("identity", `String attrs.identity);
                                        ("instance", `String attrs.instance); ("nodeId", `Int id) ]
                                    in
                                    Yojson.Safe.to_string (`Assoc (fields @ common))
                                | _ -> payload)
                             )
                         | None -> ()
                       end
                     end
                   end)
          )
        states;
      !result)
  | Lui_window.Input.Wheel (_dx, dy) | Lui_window.Input.Wheel_mods (_dx, dy, _) -> (
      let x, y = !last_pointer in
      match find_pdf x y with
      | None -> false
      | Some id -> (
          match attrs_of store id with
          | None -> false
          | Some attrs ->
              let state = state_for id attrs in
              let frame = rect_of id in
              let geom = geometry { Lui_paint.hooks = Lui_paint.default_hooks; scale; viewport = frame; deferred = Queue.create () } attrs frame in
              state.scroll_y <- state.scroll_y -. (dy *. scale);
              clamp_scroll state geom;
              true))
  | _ -> false
