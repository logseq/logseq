(* frontend.extensions.html-parser/convert — clipboard text/html ->
   markdown text. cljs parses with hickory into hiccup vectors then runs
   hiccup->doc-inner's tag table; here the same table walks DOM nodes
   directly (DOMParser output is already entity-decoded, so the cljs
   html-decode-hiccup pass is unnecessary). *)

module D = Web_dom

type dom_parser

external new_dom_parser : unit -> dom_parser = "DOMParser" [@@mel.new]

external parse_from_string : dom_parser -> string -> string -> D.el
  = "parseFromString" [@@mel.send]


(* markdown emphasis markers (config/get-* for :markdown) *)
let pat_bold = "**"
let pat_italic = "*"
let pat_underline = "" (* no underline for markdown *)
let pat_strike = "~~"
let pat_highlight = "=="
let pat_code = "`"
let pat_hr = "---"

let denied_tags =
  [ "script"; "base"; "head"; "link"; "meta"; "style"; "title"; "comment"
  ; "xml"; "svg"; "frame"; "frameset"; "embed"; "object"; "canvas"; "applet"
  ]

let block_wrap_tags =
  [ "p"; "hr"; "ul"; "ol"; "dl"; "table"; "pre"; "blockquote"; "aside"
  ; "canvas"; "center"; "figure"; "figcaption"; "fieldset"; "div"; "footer"
  ; "header" ]

let newline_tail_tags = [ "thead"; "tr"; "li" ]

(* cljs remove-ending-dash-lines — "(\n*-\s*\n*)*$": a trailing run of
   groups, each one dash surrounded by whitespace/newlines *)
let rec remove_ending_dash_lines s =
  let t = String.trim s in
  let n = String.length t in
  if n > 0 && t.[n - 1] = '-' then
    remove_ending_dash_lines (String.sub t 0 (n - 1))
  else t

(* collapse \n + whitespace runs to a single space — the cljs
   (replace #"\n" " ") + (replace #"\s+" " ") pair *)
let normalize_text s =
  let b = Buffer.create (String.length s) in
  let ws = ref false in
  String.iter
    (fun c ->
      if c = ' ' || c = '\t' || c = '\n' || c = '\r' then (
        if not !ws then Buffer.add_char b ' ';
        ws := true)
      else (
        Buffer.add_char b c;
        ws := false))
    s;
  Buffer.contents b

(* style attr -> [(prop, value)] lowercased — used by the emphasis regex
   checks in cljs (font-weight/font-style/text-decoration/background-color) *)
let style_props style =
  String.split_on_char ';' style
  |> List.filter_map (fun kv ->
      match String.index_opt kv ':' with
      | Some i ->
          Some
            ( String.lowercase_ascii (String.trim (String.sub kv 0 i))
            , String.lowercase_ascii
                (String.trim (String.sub kv (i + 1) (String.length kv - i - 1)))
            )
      | None -> None)

let style_value style props =
  match
    List.find_opt (fun (k, _) -> List.mem k props) (style_props style)
  with
  | Some (_, v) -> Some v
  | None -> None

let bold_styled style =
  match style_value style [ "font-weight" ] with
  | Some v -> (
      v = "bold" || v = "semibold"
      ||
      match int_of_string_opt v with
      | Some n -> n >= 600
      | None -> false)
  | None -> false

let italic_styled style =
  match style_value style [ "font-style" ] with
  | Some v -> Str_util.contains v "italic"
  | None -> false

let underline_styled style =
  match style_value style [ "text-decoration"; "text-decoration-line" ] with
  | Some v -> Str_util.contains v "underline"
  | None -> false

let strike_styled style =
  match style_value style [ "text-decoration"; "text-decoration-line" ] with
  | Some v -> Str_util.contains v "line-through"
  | None -> false

let mark_styled style =
  match style_value style [ "background-color" ] with
  | Some v -> Str_util.contains v "yellow"
  | None -> false

type attrs = { style : string option }

(* cljs emphasis-transform: pick the markdown pattern for the tag/style *)
let emphasis_pattern tag attrs =
  let style = Option.value attrs.style ~default:"" in
  let bold_s = bold_styled style in
  let italic_s = italic_styled style in
  let underline_s = underline_styled style in
  let strike_s = strike_styled style in
  let mark_s = mark_styled style in
  if tag = "b" || tag = "strong" then
    if style_value style [ "font-weight" ] = Some "normal" then ""
    else pat_bold
  else if tag = "i" || tag = "em" then
    if style_value style [ "font-style" ] = Some "normal" then ""
    else if bold_s then pat_bold
    else pat_italic
  else if tag = "ins" || tag = "u" then
    if style_value style [ "text-decoration" ] = Some "normal" then ""
    else pat_underline
  else if tag = "del" || tag = "s" || tag = "strike" then
    if style_value style [ "text-decoration" ] = Some "normal" then ""
    else pat_strike
  else if tag = "mark" || mark_s then
    if style_value style [ "background-color" ] = Some "transparent" then ""
    else pat_highlight
  else if tag = "span" then
    (* order mirrors cljs: bold, italic, underline, strike, highlight *)
    String.concat ""
      (List.concat
         [ (if bold_s then [ pat_bold ] else [])
         ; (if italic_s then [ pat_italic ] else [])
         ; (if underline_s then [ pat_underline ] else [])
         ; (if strike_s then [ pat_strike ] else [])
         ; (if mark_s then [ pat_highlight ] else [])
         ])
  else ""

let inside_pre = ref false

type ctx = { level : int; in_table : bool }

(* one DOM node -> markdown fragment *)
let rec node_to_md (ctx : ctx) (node : D.el) : string =
  match D.el_node_type node with
  | 8 -> "" (* comments *)
  | 3 ->
      (* text *)
      let t = D.el_text_content node in
      if !inside_pre then t else normalize_text t
  | 1 -> (
      let tag = String.lowercase_ascii (D.el_tag node) in
      let children = children_of node in
      let map_join ?(list = false) els =
        let ctx' =
          if list then { ctx with level = ctx.level + 1 } else ctx
        in
        String.concat "" (List.map (node_to_md ctx') els)
      in
      let block_transform level els =
        String.make level '#'
        ^ " "
        ^ String.concat " " (List.map (node_to_md ctx) els)
        ^ "\n"
      in
      let result =
        match tag with
        | "head" -> ""
        | ("h1" | "h2" | "h3" | "h4" | "h5" | "h6") as h ->
            block_transform
              (int_of_string (String.sub h 1 1))
              children
        | "a" -> (
            match D.el_get_attr node "href" with
            | Some href when String.trim href <> "" ->
                if D.el_query node "img" <> None then
                  (* cljs exports the raw hiccup for linked images; the DOM
                     equivalent is the element's own html *)
                  "#+BEGIN_EXPORT html\n" ^ D.el_outer_html node
                  ^ "\n#+END_EXPORT"
                else
                  "["
                  ^ String.trim (map_join children)
                  ^ "]("
                  ^ href
                  ^ ")"
            | _ -> "")
        | "img" -> (
            match D.el_get_attr node "src" with
            | Some src
              when not
                     (String.length src >= 5
                      && String.sub src 0 5 = "data:"
                      && not (Str_util.contains src ";base64,")) ->
                "!["
                ^ Option.value (D.el_get_attr node "alt") ~default:""
                ^ "]("
                ^ src
                ^ ")"
            | _ -> "")
        | "p" -> map_join children
        | "hr" -> pat_hr
        | "b" | "strong" | "i" | "em" | "ins" | "u" | "del" | "s"
        | "strike" | "mark" | "span" ->
            let pattern =
              emphasis_pattern tag
                { style = D.el_get_attr node "style" }
            in
            let inner = map_join children in
            if inner = "" then ""
            else if pattern = "" then inner
            else if String.length inner >= String.length pattern
                    && String.sub inner 0 (String.length pattern)
                       = pattern
            then inner
            else pattern ^ inner ^ pattern
        | "code" ->
            if !inside_pre then map_join children
            else (
              match children with
              | first :: _ when D.el_node_type first = 3 ->
                  pat_code ^ map_join children ^ pat_code
              | _ -> map_join children)
        | "pre" ->
            inside_pre := true;
            let content = String.trim (map_join children) in
            inside_pre := false;
            if String.length content >= 3
               && String.sub content 0 3 = "```"
            then content
            else "```\n" ^ content ^ "\n```"
        | "blockquote" -> "> " ^ map_join children
        | "li" ->
            String.make (max 0 (ctx.level - 1)) '\t' ^ "- " ^ map_join children
        | "br" -> "\n"
        | "dt" -> map_join children ^ "\n"
        | "dd" -> ": " ^ map_join children ^ "\n"
        | "thead" ->
            (* separator row after the header cells; cljs counts the last
               child of the first tr — same column count, without its
               bug of counting vector length *)
            let cols =
              match children with
              | tr :: _ ->
                  List.length
                    (List.filter
                       (fun c ->
                         D.el_node_type c = 1
                         && (let t = String.lowercase_ascii (D.el_tag c) in
                             t = "td" || t = "th"))
                       (children_of tr))
              | _ -> 0
            in
            map_join children
            ^ "| "
            ^ String.concat " | " (List.init cols (fun _ -> "----"))
            ^ " |"
        | "tr" ->
            "| "
            ^ String.concat " | "
                (List.map (node_to_md { ctx with in_table = true }) children)
            ^ " |"
        | "ul" | "ol" | "dl" -> map_join ~list:true children
        | tag when List.mem tag denied_tags -> ""
        | _ -> map_join children
      in
      (* wrapper: block tags get blank-line padding, thead/tr/li a
         newline tail *)
      if List.mem tag denied_tags then ""
      else if tag = "p" && ctx.in_table then result
      else if List.mem tag block_wrap_tags then "\n\n" ^ result ^ "\n\n"
      else if List.mem tag newline_tail_tags then result ^ "\n"
      else result)
  | _ -> ""

and children_of node : D.el list =
  let nl = D.el_child_nodes node in
  let n = D.nl_length nl in
  let rec go i acc =
    if i < 0 then acc
    else
      go (i - 1)
        (match D.nl_item nl i with
         | Some c -> c :: acc
         | None -> acc)
  in
  go (n - 1) []

let convert html =
  if String.trim html = "" then None
  else
    let doc = parse_from_string (new_dom_parser ()) html "text/html" in
    let body =
      match D.el_body doc with Some b -> b | None -> doc
    in
    let s =
      String.concat ""
        (List.map (node_to_md { level = 0; in_table = false })
           (children_of body))
    in
    let s =
      if String.trim s = "" then ""
      else (
        let t = String.trim s in
        (* \n\n+ -> \n\n *)
        let b = Buffer.create (String.length t) in
        let run = ref 0 in
        String.iter
          (fun c ->
            if c = '\n' then (
              incr run;
              if !run <= 2 then Buffer.add_char b c)
            else (
              run := 0;
              Buffer.add_char b c))
          t;
        Buffer.contents b)
    in
    Some (remove_ending_dash_lines s)
