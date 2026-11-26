type runtime

external qjs_create : unit -> runtime = "logseq_qjs_create"
external qjs_eval : runtime -> string -> string = "logseq_qjs_eval"

type text_item = {
  x : float;
  y : float;
  text : string;
  font : string;
  size : float;
  italic : bool;
  bold : bool;
}

type svg_item = {
  sx : float;
  sy : float;
  sw : float;
  sh : float;
  view_box : float array;
  preserve : string;
  paths : string list;
}

type rule_item = { rx : float; ry : float; rw : float; rh : float }

type item =
  | Text of text_item
  | Rule of rule_item
  | Svg of svg_item

type layout = {
  width : float;
  height : float;
  depth : float;
  items : item list;
}

let runtime = ref None

let eval runtime source = qjs_eval runtime source

let runtime () =
  match !runtime with
  | Some runtime -> runtime
  | None ->
      let rt = qjs_create () in
      ignore (eval rt "var self = globalThis;");
      ignore (eval rt Katex_bundle.katex_js);
      ignore (eval rt Katex_bundle.metrics_js);
      ignore (eval rt Katex_bundle.layout_js);
      runtime := Some rt;
      rt

let json_string value = Yojson.Safe.to_string (`String value)

let float_member json name =
  match Yojson.Safe.Util.member name json with
  | `Int value -> float value
  | `Float value -> value
  | _ -> invalid_arg ("KaTeX layout missing numeric field " ^ name)

let bool_member json name =
  match Yojson.Safe.Util.member name json with
  | `Bool value -> value
  | _ -> invalid_arg ("KaTeX layout missing boolean field " ^ name)

let string_member json name =
  Yojson.Safe.Util.member name json |> Yojson.Safe.Util.to_string

let parse_item = function
  | `Assoc fields as json -> (
      match Yojson.Safe.Util.member "type" json with
      | `String "text" ->
          Text
            { x = float_member json "x"
            ; y = float_member json "y"
            ; text = string_member json "text"
            ; font = string_member json "font"
            ; size = float_member json "size"
            ; italic = bool_member json "italic"
            ; bold = bool_member json "bold"
            }
      | `String "rule" ->
          Rule
            { rx = float_member json "x"
            ; ry = float_member json "y"
            ; rw = float_member json "w"
            ; rh = float_member json "h"
            }
      | `String "svg" ->
          let number = function
            | `Int value -> float value
            | `Float value -> value
            | _ -> invalid_arg "KaTeX SVG viewBox contains a non-number"
          in
          Svg
            { sx = float_member json "x"
            ; sy = float_member json "y"
            ; sw = float_member json "w"
            ; sh = float_member json "h"
            ; view_box =
                (match List.assoc_opt "viewBox" fields with
                 | Some (`List values) -> Array.of_list (List.map number values)
                 | _ -> [||])
            ; preserve = string_member json "preserve"
            ; paths =
                (match List.assoc_opt "paths" fields with
                 | Some (`List values) -> List.map Yojson.Safe.Util.to_string values
                 | _ -> [])
            }
      | _ -> invalid_arg "KaTeX layout contains an unknown item type")
  | _ -> invalid_arg "KaTeX layout item is not an object"

let parse text =
  let json = Yojson.Safe.from_string text in
  let items =
    match Yojson.Safe.Util.member "items" json with
    | `List values -> List.map parse_item values
    | _ -> invalid_arg "KaTeX layout items are not a list"
  in
  { width = float_member json "width"
  ; height = float_member json "height"
  ; depth = float_member json "depth"
  ; items
  }

let cache = Hashtbl.create 128
let cache_mutex = Mutex.create ()

let max_tex_length = 2048
let max_extent_em = 128.
let max_items = 512

let finite_positive_or_zero value = Float.is_finite value && value >= 0.

let valid_layout layout =
  finite_positive_or_zero layout.width
  && finite_positive_or_zero layout.height
  && finite_positive_or_zero layout.depth
  && layout.width <= max_extent_em
  && layout.height +. layout.depth <= max_extent_em
  && List.length layout.items <= max_items

let layout_uncached ~tex ~display =
  if String.length tex > max_tex_length then Error "KaTeX input is too large"
  else
    try
      let source =
        Printf.sprintf "logseqKatexLayout(%s,%s)" (json_string tex)
          (if display then "true" else "false")
      in
      let layout = parse (eval (runtime ()) source) in
      if valid_layout layout then Ok layout
      else Error "KaTeX layout exceeds native rendering bounds"
    with
    | Failure message -> Error message
    | Invalid_argument message -> Error message
    | Yojson.Json_error message -> Error message

let layout ~tex ~display =
  let key = (tex, display) in
  Mutex.lock cache_mutex;
  Fun.protect ~finally:(fun () -> Mutex.unlock cache_mutex) (fun () ->
    match Hashtbl.find_opt cache key with
    | Some result -> result
    | None ->
        let result = layout_uncached ~tex ~display in
        if Hashtbl.length cache >= 256 then Hashtbl.reset cache;
        Hashtbl.add cache key result;
        result)

(* KaTeX applies a 1.21em root font-size in browser CSS. Match that scale
   here because layout metrics are expressed in root ems. *)
let body_size = 15. *. 1.21

let logical_size layout =
  ( int_of_float (Float.ceil (layout.width *. body_size)) + 4
  , int_of_float (Float.ceil ((layout.height +. layout.depth) *. body_size)) + 4
  , int_of_float (Float.round (layout.depth *. body_size)) )

let resource_url ~tex ~display ~dark =
  Printf.sprintf "logseq-math:%s:%s:%s" (if display then "1" else "0")
    (if dark then "1" else "0")
    (Uri.pct_encode ~component:`Query_value tex)
