type node =
  | Text of string
  | Element of string * (Markup.name * string) list * node list

type context = { level : int; pre : bool; in_table : bool }

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
            else if context.in_table then inner ^ " "
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
            let _, longest =
              String.fold_left
                (fun (run, longest) c ->
                  let run = if c = '`' then run + 1 else 0 in
                  (run, max run longest))
                (0, 2) content
            in
            let fence = String.make (longest + 1) '`' in
            "\n\n" ^ fence ^ "\n" ^ content ^ "\n" ^ fence ^ "\n\n"
        | "blockquote" ->
            let lines = String.split_on_char '\n' (String.trim (contents ())) in
            "\n\n" ^ String.concat "\n" (List.map (fun line -> "> " ^ line) lines) ^ "\n\n"
        | "table" -> render_table context children
        | "br" -> if context.in_table then " " else "\n"
        | "hr" -> "\n\n---\n\n"
        | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" ->
            "\n\n" ^ String.make (Char.code tag.[1] - Char.code '0') '#'
            ^ " " ^ String.trim (contents ()) ^ "\n\n"
        | _ -> contents ()

and render_table context children =
  let rec rows_in nodes =
    List.concat_map
      (function
        | Element ("tr", _, _) as row -> [ row ]
        | Element (("thead" | "tbody" | "tfoot"), _, children) -> rows_in children
        | _ -> [])
      nodes
  in
  let int_attr attrs name =
    match List.assoc_opt ("", name) attrs with
    | Some value -> (try max 1 (int_of_string value) with _ -> 1)
    | None -> 1
  in
  let cells_in = function
    | Element (_, _, children) ->
        List.filter_map
          (function
            | Element (("td" | "th"), attrs, cell_children) ->
                Some (int_attr attrs "colspan", int_attr attrs "rowspan",
                      render_table_cell context cell_children)
            | _ -> None)
          children
    | _ -> []
  in
  let layout rows =
    let active = Hashtbl.create 8 in
    let output_rows =
      List.map
        (fun row ->
          let previous = Hashtbl.fold (fun col span acc -> (col, span) :: acc) active [] in
          let pending = ref [] in
          let cells = ref [] in
          let add text = cells := text :: !cells in
          let col = ref 0 in
          let rec skip_spans () =
            if Hashtbl.mem active !col then (
              add "";
              incr col;
              skip_spans ())
          in
          List.iter
            (fun (colspan, rowspan, text) ->
              skip_spans ();
              let start = !col in
              add text;
              for _ = 2 to colspan do
                add ""
              done;
              if rowspan > 1 then
                for c = start to start + colspan - 1 do
                  pending := (c, rowspan - 1) :: !pending
                done;
              col := start + colspan)
            row;
          let max_span =
            Hashtbl.fold (fun col _ acc -> max col acc) active (-1)
          in
          while !col <= max_span do
            add "";
            incr col
          done;
          List.iter
            (fun (col, span) ->
              if span <= 1 then Hashtbl.remove active col
              else Hashtbl.replace active col (span - 1))
            previous;
          List.iter (fun (col, span) -> Hashtbl.replace active col span) !pending;
          List.rev !cells)
        rows
    in
    output_rows
  in
  let format_row cells = "| " ^ String.concat " | " cells ^ " |" in
  let rows = rows_in children |> List.map cells_in |> List.filter (( <> ) []) in
  match rows with
  | [] -> ""
  | first :: rest ->
      let rows = layout (first :: rest) in
      let width = List.fold_left (fun width row -> max width (List.length row)) 0 rows in
      let separator = "| " ^ String.concat " | " (List.init width (fun _ -> "----")) ^ " |" in
      "\n\n"
      ^ String.concat "\n"
          (format_row (List.hd rows) :: separator :: List.map format_row (List.tl rows))
      ^ "\n\n"

and render_table_cell context children =
  let text =
    String.concat ""
      (List.map (render { context with in_table = true }) children)
  in
  let flattened = Buffer.create (String.length text) in
  String.iter
    (fun c ->
      if c = '\n' || c = '\r' then Buffer.add_char flattened ' '
      else Buffer.add_char flattened c)
    text;
  let text = String.trim (Buffer.contents flattened) in
  let escaped = Buffer.create (String.length text) in
  String.iter
    (fun c ->
      if c = '|' then Buffer.add_char escaped '\\';
      Buffer.add_char escaped c)
    text;
  Buffer.contents escaped

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
      String.concat "" (List.map (render { level = 0; pre = false; in_table = false }) nodes)
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
