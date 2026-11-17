(* Web adapter for the `window.tablerIcons` extension pack — walks the
   react-element descriptors and serializes them to data-URI svgs for
   [Icons.app_icons ~ext]. Browser-only: lives in the js_app target. *)

external tabler_icons_u : (Js.Json.t -> Js.Json.t) Js.Dict.t Js.Undefined.t
  = "tablerIcons"
  [@@mel.scope "window"]

let string_of_prop v =
  match Js.Json.decodeString v with
  | Some s -> Some s
  | None -> (
      match Js.Json.decodeNumber v with
      | Some n -> Some (Printf.sprintf "%g" n)
      | None -> None)

let attr_of (k, v) =
  if k = "children" || k = "key" || k = "ref" then None
  else
    (* SVG attrs are case-sensitive: viewBox stays verbatim *)
    let name =
      match k with
      | "className" -> "class"
      | "viewBox" -> "viewBox"
      | _ -> Icons.kebab k
    in
    Option.map (fun s -> (name, s)) (string_of_prop v)

let icon_props size =
  let d = Js.Dict.empty () in
  Js.Dict.set d "size" (Js.Json.number size);
  Js.Json.object_ d

(* Serialize a react-element tree back to svg markup. *)
let rec markup_of_react (v : Js.Json.t) : string =
  match Js.Json.decodeObject v with
  | Some obj -> element_markup obj
  | None -> (
      match Js.Json.decodeArray v with
      | Some arr ->
          String.concat "" (List.map markup_of_react (Array.to_list arr))
      | None -> (
          match Js.Json.decodeString v with
          | Some s -> s
          | None -> ""))

and element_markup obj : string =
  let tag =
    match Option.bind (Js.Dict.get obj "type") Js.Json.decodeString with
    | Some t -> t
    | None -> ""
  in
  let props =
    match Option.bind (Js.Dict.get obj "props") Js.Json.decodeObject with
    | Some p -> p
    | None -> Js.Dict.empty ()
  in
  let attrs =
    List.filter_map attr_of (Array.to_list (Js.Dict.entries props))
    |> List.map (fun (k, v) -> Printf.sprintf " %s=\"%s\"" k v)
    |> String.concat ""
  in
  let children =
    match Js.Dict.get props "children" with
    | Some c -> markup_of_react c
    | None -> ""
  in
  if tag = "" then children
  else Printf.sprintf "<%s%s>%s</%s>" tag attrs children tag

let app_icons () : (string * string) list =
  match Js.Undefined.toOption tabler_icons_u with
  | None -> []
  | Some dict ->
      Array.to_list (Js.Dict.keys dict)
      |> List.filter_map (fun key ->
             if String.starts_with ~prefix:"Icon" key then
               match Js.Dict.get dict key with
               | Some f ->
                   let name =
                     Icons.kebab (String.sub key 4 (String.length key - 4))
                   in
                   Some
                     ( name
                     , Icons.data_uri_of_svg
                         (markup_of_react (f (icon_props 24.))) )
               | None -> None
             else None)

(* Index names without invoking SVG factories. A requested icon is encoded
   at render time; scrolling does not retain an expanded catalog. *)
let resolver () =
  let factories = Hashtbl.create 32 in
  (match Js.Undefined.toOption tabler_icons_u with
   | None -> ()
   | Some dict ->
     Array.iter (fun (key, factory) ->
       if String.starts_with ~prefix:"Icon" key then
         Hashtbl.replace factories
           (Icons.kebab (String.sub key 4 (String.length key - 4))) factory)
       (Js.Dict.entries dict));
  fun name ->
    Option.map (fun factory ->
      Icons.data_uri_of_svg (markup_of_react (factory (icon_props 24.))))
      (Hashtbl.find_opt factories name)

(* Convert dynamic catalog data at the Web boundary. The renderer accepts
   only shape and attribute constructors, so SVG cannot add active content. *)
let web_asset = function
  | Icons.Uri uri -> Lui_web_types.Icon_url uri
  | Icons.Svg_data (filled, children) ->
    let open Lui_web_types in
    let tag = function
      | "path" -> Svg_path | "rect" -> Svg_rect | "circle" -> Svg_circle
      | "ellipse" -> Svg_ellipse | "line" -> Svg_line | "polyline" -> Svg_polyline
      | "polygon" -> Svg_polygon
      | name -> invalid_arg ("Unsupported catalog SVG shape: " ^ name) in
    let attribute = function
      | "d" -> Svg_d | "points" -> Svg_points | "x" -> Svg_x | "y" -> Svg_y
      | "x1" -> Svg_x1 | "y1" -> Svg_y1 | "x2" -> Svg_x2 | "y2" -> Svg_y2
      | "cx" -> Svg_cx | "cy" -> Svg_cy | "r" -> Svg_r | "rx" -> Svg_rx | "ry" -> Svg_ry
      | "width" -> Svg_width | "height" -> Svg_height | "fill" -> Svg_fill
      | "stroke" -> Svg_stroke | "stroke-width" -> Svg_stroke_width
      | "stroke-linecap" -> Svg_stroke_linecap | "stroke-linejoin" -> Svg_stroke_linejoin
      | "stroke-miterlimit" -> Svg_stroke_miterlimit | "fill-rule" -> Svg_fill_rule
      | "clip-rule" -> Svg_clip_rule | "opacity" -> Svg_opacity
      | "fill-opacity" -> Svg_fill_opacity | "stroke-opacity" -> Svg_stroke_opacity
      | "transform" -> Svg_transform | "stroke-dasharray" -> Svg_stroke_dasharray
      | "stroke-dashoffset" -> Svg_stroke_dashoffset
      | name -> invalid_arg ("Unsupported catalog SVG attribute: " ^ name) in
    Icon_svg {svg_view_box = "0 0 24 24"; svg_filled = filled;
      svg_shapes = List.map (fun (name, attrs) -> tag name,
        List.map (fun (name, value) -> attribute name, value) attrs) children}
