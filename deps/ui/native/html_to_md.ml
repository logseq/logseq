type node =
  | Text of string
  | Element of string * (Markup.name * string) list * node list

type context = { level : int; pre : bool }

let normalize_text text =
  let output = Buffer.create (String.length text) in
  let rec loop i whitespace =
    if i < String.length text then (
      let decoded = String.get_utf_8_uchar text i in
      let length = Uchar.utf_decode_length decoded in
      let code = Uchar.to_int (Uchar.utf_decode_uchar decoded) in
      let is_whitespace = List.mem code [ 9; 10; 12; 13; 32; 160 ] in
      if is_whitespace then (
        if not whitespace then Buffer.add_char output ' ')
      else Buffer.add_substring output text i length;
      loop (i + length) is_whitespace)
  in
  loop 0 false;
  Buffer.contents output

let denied_tags =
  [ "script"; "base"; "head"; "link"; "meta"; "style"; "title"; "xml"
  ; "svg"; "frame"; "frameset"; "embed"; "object"; "canvas"; "applet" ]

let rec render context = function
  | Text text -> if context.pre then text else normalize_text text
  | Element (tag, attrs, children) ->
      let contents () = String.concat "" (List.map (render context) children) in
      let attr name = List.assoc_opt ("", name) attrs in
      let wrap marker =
        let inner = contents () in
        if inner = "" then "" else marker ^ inner ^ marker
      in
      if List.mem tag denied_tags then ""
      else
        match tag with
        | "p" | "div" | "aside" | "center" | "figure" | "figcaption"
        | "fieldset" | "footer" | "header" ->
            let inner = String.trim (contents ()) in
            if inner = "" then ""
            else if context.level > 0 then inner ^ "\n"
            else "\n\n" ^ inner ^ "\n\n"
        | "ul" | "ol" | "dl" ->
            let inner =
              String.concat ""
                (List.filter_map
                   (function
                     | Text text when String.trim text = "" -> None
                     | child -> Some (render { context with level = context.level + 1 } child))
                   children)
            in
            let padding = if context.level = 0 then "\n\n" else "\n" in
            padding ^ inner ^ (if context.level = 0 then "\n" else "")
        | "li" ->
            String.make (max 0 (context.level - 1)) '\t' ^ "- "
            ^ String.trim (contents ()) ^ "\n"
        | "dt" -> contents () ^ "\n"
        | "dd" -> ": " ^ contents () ^ "\n"
        | "a" -> (
            let label = contents () in
            match attr "href" with
            | Some href when String.trim href <> "" ->
                "[" ^ String.trim label ^ "](" ^ href ^ ")"
            | _ -> label)
        | "img" -> (
            match attr "src" with
            | Some src when String.trim src <> "" ->
                "![" ^ Option.value (attr "alt") ~default:"" ^ "](" ^ src ^ ")"
            | _ -> "")
        | "b" | "strong" -> wrap "**"
        | "i" | "em" -> wrap "*"
        | "s" | "strike" | "del" -> wrap "~~"
        | "mark" -> wrap "=="
        | "code" -> if context.pre then contents () else wrap "`"
        | "pre" ->
            let content =
              String.concat "" (List.map (render { context with pre = true }) children)
              |> String.trim
            in
            "\n\n```\n" ^ content ^ "\n```\n\n"
        | "blockquote" ->
            let lines = String.split_on_char '\n' (String.trim (contents ())) in
            "\n\n" ^ String.concat "\n" (List.map (fun line -> "> " ^ line) lines) ^ "\n\n"
        | "br" -> "\n"
        | "hr" -> "\n\n---\n\n"
        | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" ->
            "\n\n" ^ String.make (Char.code tag.[1] - Char.code '0') '#'
            ^ " " ^ String.trim (contents ()) ^ "\n\n"
        | _ -> contents ()

let convert html =
  if String.trim html = "" then None
  else
    let nodes =
      Markup.string html |> Markup.parse_html ~encoding:Markup.Encoding.utf_8
      |> Markup.signals
      |> Markup.trees
           ~text:(fun chunks -> Text (String.concat "" chunks))
           ~element:(fun (_, tag) attrs children -> Element (tag, attrs, children))
      |> Markup.to_list
    in
    let text =
      String.concat "" (List.map (render { level = 0; pre = false }) nodes)
      |> String.trim
    in
    let output = Buffer.create (String.length text) in
    let newlines = ref 0 in
    String.iter
      (fun c ->
        if c = '\n' then (
          incr newlines;
          if !newlines <= 2 then Buffer.add_char output c)
        else (
          newlines := 0;
          Buffer.add_char output c))
      text;
    Some (Buffer.contents output)
