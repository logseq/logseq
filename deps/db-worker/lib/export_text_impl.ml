(* frontend.handler.export.text-impl — markdown renderer for the export
   pipeline: block-ast -> simple-ast via the shared state in
   Export_common_impl.
   Source: src/main/frontend/handler/export/text_impl.cljs *)

open Datascript
open Export_common_impl

module CV = Clj_value

(* indent-with-2-spaces *)
let indent_with_2_spaces ~(st : state) (level : int) : simple_ast =
  match st.export_options.indent_style with
  | "dashes" -> indent level 2
  | "spaces" | "no-indent" -> indent level 0
  | style ->
      invalid_arg ("unknown indent-style: " ^ style)

let remove_nil (xs : simple_ast option list) : simple_ast list =
  List.filter_map Fun.id xs

(* block-heading-prefix *)
let block_heading_prefix ~(st : state) (ast_content : value)
    : simple_ast list =
  let level = mint ast_content "level" |> Option.value ~default:0 in
  let dashes = st.export_options.indent_style = "dashes" in
  let heading =
    if dashes then [ indent (level - 1) 0; raw_text "-" ]
    else [ indent (level - 1) 0 ]
  in
  let size =
    match mint ast_content "size" with
    | Some n -> [ space; raw_text (repeat_str n "#") ]
    | None -> []
  in
  st.current_level <- level;
  heading @ size
  @ remove_nil
      [ Some space
      ; (match mstr ast_content "marker" with
         | Some m -> Some (raw_text m)
         | None -> None)
      ; Some space
      ; (match mstr ast_content "priority" with
         | Some p -> Some (raw_text (priority_to_string p))
         | None -> None)
      ; Some space ]

(* heading-continuation-indent *)
let heading_continuation_indent ~(st : state) (ast_content : value)
    : simple_ast =
  let level = mint ast_content "level" |> Option.value ~default:0 in
  match st.export_options.indent_style with
  | "dashes" -> indent (level - 1) 2
  | "spaces" | "no-indent" -> indent (level - 1) 0
  | style -> invalid_arg ("unknown indent-style: " ^ style)

let rec block_heading ~(st : state) (ast_content : value) : simple_ast list =
  let newline_after_block = st.export_options.newline_after_block in
  let asts =
    (if newline_after_block && not st.nab_first_heading then [ newline_star 2 ]
     else [])
    @ block_heading_prefix ~st ast_content
    @ mapcatv (inline_ast_to_simple_ast ~st) (mcoll ast_content "title")
    @ [ newline_star 1 ]
  in
  st.nab_first_heading <- false;
  asts

(* list-continuation-indent *)
and list_continuation_indent ~(st : state) (current_level : int) : simple_ast =
  indent_with_2_spaces ~st (current_level - 1)

and src_in_list_item (ast_content : value)
    (continuation_indent : simple_ast) : simple_ast list =
  let lines = mcoll ast_content "lines" in
  [ raw_text "```" ]
  @ (match mstr ast_content "language" with
     | Some l -> [ raw_text l ]
     | None -> [])
  @ [ newline_star 1 ]
  @ List.map (function String s -> raw_text s | _ -> raw_text "") lines
  @ [ continuation_indent; raw_text "```"; newline_star 1 ]

and quote_line (line : string) : string =
  let line = str_trimr line in
  if str_blank line then ">" else "> " ^ line

and quote_in_list_item ~(st : state) (block_coll : value)
    (continuation_indent : simple_ast) : simple_ast list =
  let lines =
    CV.coll_items block_coll
    |> mapcatv (fun b -> block_ast_to_simple_ast ~st { node = b; meta = no_meta })
    |> simple_asts_to_string
    |> split_lines
  in
  let lines = match lines with [] -> [ "" ] | _ -> lines in
  List.concat
    (List.mapi
       (fun idx line ->
         (if idx > 0 then [ continuation_indent ] else [])
         @ [ raw_text (quote_line line); newline_star 1 ])
       lines)

and block_level_content_in_list_item ~(st : state) (content : value)
    (continuation_indent : simple_ast) : simple_ast list option =
  match CV.coll_items content with
  | [ first ] ->
      (match ast_type first with
       | "Src" -> Some (src_in_list_item (ast_content first) continuation_indent)
       | "Quote" ->
           Some (quote_in_list_item ~st (ast_content first) continuation_indent)
       | _ -> None)
  | _ -> None

and block_list_item ~(st : state) (item : value) : simple_ast list =
  let content = mget item "content" in
  let items = mcoll item "items" in
  let number = mint item "number" in
  let checkbox = mgeto item "checkbox" in
  let number_ast =
    raw_text (match number with Some n -> string_of_int n ^ ". " | None -> "* ")
  in
  let checkbox_ast =
    raw_text
      (match checkbox with
       | Some v -> if CV.truthy v then "[X]" else "[ ]"
       | None -> "")
  in
  let current_level = st.current_level in
  let indent' =
    if current_level > 1 then [ indent (current_level - 1) 0 ] else []
  in
  let continuation_indent = list_continuation_indent ~st current_level in
  let content_asts =
    match block_level_content_in_list_item ~st content continuation_indent with
    | Some asts -> asts
    | None ->
        mapcatv
          (fun b -> block_ast_to_simple_ast ~st { node = b; meta = no_meta })
          (CV.coll_items content)
  in
  let items_asts = block_list ~st ~in_list:true items in
  indent' @ [ number_ast; checkbox_ast; space ] @ content_asts
  @ [ newline_star 1 ] @ items_asts @ [ newline_star 1 ]

and block_list ~(st : state) ~(in_list : bool) (l : value list) : simple_ast list =
  with_bound_state st
    (fun s -> s.current_level <- s.current_level + 1)
    (fun () ->
      mapcatv (block_list_item ~st) l
      @ (if l <> [] && not in_list then [ newline_star 2 ] else []))

and block_property_drawer ~(st : state) (properties : value)
    : simple_ast list =
  if st.export_options.remove_properties then []
  else
    let level = st.current_level - 1 in
    let indent' = indent_with_2_spaces ~st level in
    List.concat_map
      (fun (pair : value) ->
        match CV.coll_items pair with
        | [ String k; v ] ->
            let vs = match v with String s -> s | _ -> "" in
            [ indent'; raw_text (k ^ "::"); space; raw_text vs; newline_star 1 ]
        | _ -> [])
      (CV.coll_items properties)

and block_example ~(st : state) (l : value) : simple_ast list =
  let level = st.current_level - 1 in
  mapcatv
    (fun (line : value) ->
      let s = match line with String s -> s | _ -> "" in
      [ indent_with_2_spaces ~st level; raw_text "    "; raw_text s
      ; newline_star 1 ])
    (CV.coll_items l)

and remove_max_prefix_spaces (lines : string list) : string list =
  let common =
    List.fold_left
      (fun r line ->
        if str_blank line then r
        else
          let leading =
            (* re-find #"^\s+" *)
            let n = String.length line in
            let i = ref 0 in
            while
              !i < n
              && (let c = line.[!i] in
                  c = ' ' || c = '\t' || c = '\n' || c = '\r')
            do
              incr i
            done;
            if !i = 0 then None else Some (String.sub line 0 !i)
          in
          match r, leading with
          | None, l -> l
          | Some r, Some l when str_starts r l -> Some l
          | Some r, _ -> Some r)
      None lines
  in
  match common with
  | None -> lines
  | Some p ->
      let plen = String.length p in
      List.map
        (fun line ->
          if String.length line >= plen && String.sub line 0 plen = p then
            String.sub line plen (String.length line - plen)
          else line)
        lines

and block_src ~(st : state) (ast_content : value) (meta : block_meta)
    : simple_ast list =
  let level = st.current_level - 1 in
  let language = mstr ast_content "language" in
  let lines =
    List.map (function String s -> s | _ -> "") (mcoll ast_content "lines")
  in
  let lines =
    if st.export_options.indent_style = "no-indent" then
      remove_max_prefix_spaces lines
    else lines
  in
  match meta.heading_prefix with
  | Some heading_prefix ->
      block_heading_prefix ~st heading_prefix
      @ [ raw_text "```" ]
      @ (match language with Some l -> [ raw_text l ] | None -> [])
      @ [ newline_star 1 ]
      @ List.map raw_text lines
      @ [ heading_continuation_indent ~st heading_prefix; raw_text "```"
        ; newline_star 1 ]
  | None ->
      [ indent_with_2_spaces ~st level; raw_text "```" ]
      @ (match language with Some l -> [ raw_text l ] | None -> [])
      @ [ newline_star 1 ]
      @ List.map raw_text lines
      @ [ indent_with_2_spaces ~st level; raw_text "```"; newline_star 1 ]

and quote_block_lines ~(st : state) (block_coll : value) : string list =
  let lines =
    CV.coll_items block_coll
    |> mapcatv (fun b -> block_ast_to_simple_ast ~st { node = b; meta = no_meta })
    |> simple_asts_to_string
    |> split_lines
  in
  match lines with [] -> [ "" ] | _ -> lines

and quote_lines_with_prefix (lines : string list) (prefix : simple_ast list)
    (continuation_indent : simple_ast) : simple_ast list =
  List.concat
    (List.mapi
       (fun idx line ->
         (if idx = 0 then prefix else [ continuation_indent ])
         @ [ raw_text (quote_line line); newline_star 1 ])
       lines)

and block_quote ~(st : state) (block_coll : value) (meta : block_meta)
    : simple_ast list =
  let level = st.current_level - 1 in
  match meta.heading_prefix with
  | Some heading_prefix ->
      with_bound_state st
        (fun s -> s.indent_after_break_line <- true)
        (fun () ->
          quote_lines_with_prefix
            (quote_block_lines ~st block_coll)
            (block_heading_prefix ~st heading_prefix)
            (heading_continuation_indent ~st heading_prefix))
  | None ->
      with_bound_state st
        (fun s -> s.indent_after_break_line <- true)
        (fun () ->
          mapcatv
            (fun (b : value) ->
              let simple =
                block_ast_to_simple_ast ~st { node = b; meta = no_meta }
              in
              if simple <> [] then
                [ indent_with_2_spaces ~st level; raw_text ">"; space ]
                @ simple
              else [])
            (CV.coll_items block_coll)
          @ [ newline_star 2 ])

and block_latex_fragment ~(st : state) (ast_content : value) : simple_ast list =
  inline_latex_fragment ~st ast_content

and block_latex_env ~(st : state) (rest : value list) : simple_ast list =
  let level = st.current_level - 1 in
  match rest with
  | [ String name; String options; String content ] ->
      [ indent_with_2_spaces ~st level
      ; raw_text ("\\begin{" ^ name ^ "}" ^ options); newline_star 1
      ; indent_with_2_spaces ~st level; raw_text content; newline_star 1
      ; indent_with_2_spaces ~st level; raw_text ("\\end{" ^ name ^ "}")
      ; newline_star 1 ]
  | _ -> []

and block_displayed_math (ast_content : value) : simple_ast list =
  let s = match ast_content with String s -> s | _ -> "" in
  [ space; raw_text ("$$" ^ s ^ "$$"); space ]

and block_drawer ~(st : state) (rest : value list) : simple_ast list =
  let level = st.current_level - 1 in
  match rest with
  | [ String name; lines ] ->
      [ raw_text (":" ^ name ^ ":"); newline_star 1 ]
      @ mapcatv
          (fun (line : value) ->
            [ indent_with_2_spaces ~st level
            ; raw_text (match line with String s -> s | _ -> "") ])
          (CV.coll_items lines)
      @ [ newline_star 1; raw_text ":END:"; newline_star 1 ]
  | _ -> []

and block_footnote_definition ~(st : state) (rest : value list)
    : simple_ast list =
  match rest with
  | [ String name; content ] ->
      [ raw_text ("[^" ^ name ^ "]:"); space ]
      @ mapcatv (inline_ast_to_simple_ast ~st) (CV.coll_items content)
      @ [ newline_star 1 ]
  | _ -> []

and block_table ~(st : state) (ast_content : value) : simple_ast list =
  let level = st.current_level - 1 in
  let header = mcoll ast_content "header" in
  let groups = mcoll ast_content "groups" in
  let sep_line =
    raw_text ("|" ^ String.concat "|" (List.init (List.length header) (fun _ -> "---")) ^ "|")
  in
  let header_line =
    mapcatv
      (fun h ->
        [ space; raw_text "|"; space ]
        @ mapcatv (inline_ast_to_simple_ast ~st) (CV.coll_items h))
      header
    @ [ space; raw_text "|" ]
  in
  let group_lines =
    mapcatv
      (fun group ->
        mapcatv
          (fun row ->
            [ indent_with_2_spaces ~st level ]
            @ mapcatv
                (fun col ->
                  [ raw_text "|"; space ]
                  @ mapcatv (inline_ast_to_simple_ast ~st)
                      (CV.coll_items col)
                  @ [ space ])
                (CV.coll_items row)
            @ [ raw_text "|"; newline_star 1 ])
          (CV.coll_items group))
      groups
  in
  [ newline_star 1; indent_with_2_spaces ~st level ]
  @ (if header <> [] then header_line else [])
  @ (if header <> [] then
       [ newline_star 1; indent_with_2_spaces ~st level; sep_line
       ; newline_star 1 ]
     else [])
  @ group_lines

and block_comment ~(st : state) (s : value) : simple_ast list =
  let level = st.current_level - 1 in
  let s = match s with String s -> s | _ -> "" in
  [ indent_with_2_spaces ~st level; raw_text "<!---"; newline_star 1
  ; indent_with_2_spaces ~st level; raw_text s; newline_star 1
  ; indent_with_2_spaces ~st level; raw_text "-->"; newline_star 1 ]

and block_raw_html ~(st : state) (s : value) : simple_ast list =
  let level = st.current_level - 1 in
  let s = match s with String s -> s | _ -> "" in
  [ indent_with_2_spaces ~st level; raw_text s; newline_star 1 ]

and block_hiccup ~(st : state) (s : value) : simple_ast list =
  let level = st.current_level - 1 in
  let s = match s with String s -> s | _ -> "" in
  [ indent_with_2_spaces ~st level; raw_text s; space ]

(* ---------- inline ---------- *)

and inline_link (ast_content : value) : simple_ast list =
  [ raw_text (mstr ast_content "full_text" |> Option.value ~default:"") ]

and inline_nested_link (ast_content : value) : simple_ast list =
  [ raw_text (mstr ast_content "content" |> Option.value ~default:"") ]

and inline_subscript ~(st : state) (inline_coll : value) : simple_ast list =
  [ raw_text "_{" ]
  @ mapcatv
      (fun inline -> space :: inline_ast_to_simple_ast ~st inline)
      (CV.coll_items inline_coll)
  @ [ raw_text "}" ]

and inline_superscript ~(st : state) (inline_coll : value) : simple_ast list =
  [ raw_text "^{" ]
  @ mapcatv
      (fun inline -> space :: inline_ast_to_simple_ast ~st inline)
      (CV.coll_items inline_coll)
  @ [ raw_text "}" ]

and inline_footnote_reference (ast_content : value) : simple_ast list =
  [ raw_text
      ("[" ^ (mstr ast_content "name" |> Option.value ~default:"") ^ "]") ]

and inline_cookie (ast_content : value) : simple_ast list =
  [ raw_text
      (match CV.coll_items ast_content with
       | [ String "Absolute"; cur; total ] ->
           "[" ^ str_of cur ^ "/" ^ str_of total ^ "]"
       | String "Percent" :: p :: _ -> "[" ^ str_of p ^ "%]"
       | _ -> "") ]

and str_of (v : value) : string =
  match v with
  | String s -> s
  | Int n -> string_of_int n
  | Float f -> Common_util.js_string_of_float f
  | _ -> ""

and inline_latex_fragment ~st:_ (ast_content : value) : simple_ast list =
  match CV.coll_items ast_content with
  | [ String typ; String content ] ->
      let wrapper = match typ with "Inline" -> "$" | _ -> "$$" in
      [ space; raw_text (wrapper ^ content ^ wrapper); space ]
  | _ -> []

and inline_macro (ast_content : value) : simple_ast list =
  let name = mstr ast_content "name" |> Option.value ~default:"" in
  let arguments =
    List.filter_map (function String s -> Some s | _ -> None)
      (mcoll ast_content "arguments")
  in
  [ raw_text
      (if name = "cloze" then String.concat "," arguments
       else
         "{{" ^ name
         ^ (if arguments <> [] then "(" ^ String.concat "," arguments ^ ")"
            else "")
         ^ "}}") ]

and inline_entity (ast_content : value) : simple_ast list =
  [ raw_text (mstr ast_content "unicode" |> Option.value ~default:"") ]

and inline_timestamp (ast_content : value) : simple_ast list =
  match CV.coll_items ast_content with
  | [ String typ; content ] ->
      let parts =
        match typ with
        | "Scheduled" -> [ "SCHEDULED: "; timestamp_to_string content ]
        | "Deadline" -> [ "DEADLINE: "; timestamp_to_string content ]
        | "Date" -> [ timestamp_to_string content ]
        | "Closed" -> [ "CLOSED: "; timestamp_to_string content ]
        | "Clock" ->
            [ "CLOCK: "
            ; (match CV.coll_items content with
               | [ _; ts ] -> timestamp_to_string ts
               | _ -> "") ]
        | "Range" ->
            (match mgeto content "start", mgeto content "stop" with
             | Some s, Some e ->
                 [ timestamp_to_string s ^ "--" ^ timestamp_to_string e ]
             | _ -> [])
        | _ -> []
      in
      [ raw_text (String.concat "" parts) ]
  | _ -> []

and inline_email (ast_content : value) : simple_ast list =
  let l = mstr ast_content "local_part" |> Option.value ~default:"" in
  let d = mstr ast_content "domain" |> Option.value ~default:"" in
  [ raw_text ("<" ^ l ^ "@" ^ d ^ ">") ]

(* emphasis-wrap-with — binds *outside-em-symbol* to (first em-symbol) *)
and emphasis_wrap_with ~(st : state) (inline_coll : value)
    (em_symbol : string) : simple_ast list =
  with_bound_state st
    (fun s ->
      s.outside_em_symbol <-
        (if String.length em_symbol > 0 then
           Some (String.make 1 em_symbol.[0])
         else None))
    (fun () ->
      [ raw_text em_symbol ]
      @ mapcatv (inline_ast_to_simple_ast ~st) (CV.coll_items inline_coll)
      @ [ raw_text em_symbol ])

and inline_emphasis ~(st : state) (emphasis : value) : simple_ast list =
  match CV.coll_items emphasis with
  | [ Vector [ String typ ] | List [ String typ ]; inline_coll ] ->
      let outside = st.outside_em_symbol in
      (match typ with
       | "Bold" ->
           emphasis_wrap_with ~st inline_coll
             (if outside = Some "*" then "__" else "**")
       | "Italic" ->
           emphasis_wrap_with ~st inline_coll
             (if outside = Some "*" then "_" else "*")
       | "Underline" ->
           with_bound_state st (fun _ -> ()) (fun () ->
             mapcatv
               (fun inline -> space :: inline_ast_to_simple_ast ~st inline)
               (CV.coll_items inline_coll))
       | "Strike_through" -> emphasis_wrap_with ~st inline_coll "~~"
       | "Highlight" -> emphasis_wrap_with ~st inline_coll "^^"
       | _ ->
           invalid_arg
             ("inline-emphasis " ^ typ ^ " is invalid"))
  | _ -> []

and inline_break_line ~(st : state) () : simple_ast option list =
  [ Some
      (raw_text
         (if st.export_options.indent_style = "no-indent" then "\n"
          else "  \n"))
  ; (if st.indent_after_break_line then
       let current_level = st.current_level in
       if current_level > 1 then
         Some (indent_with_2_spaces ~st (current_level - 1))
       else None
     else None) ]

(* ---------- dispatchers ---------- *)

and block_ast_to_simple_ast ~(st : state) (block : block_ast)
    : simple_ast list =
  let newline_after_block = st.export_options.newline_after_block in
  let t, c = pair_of block in
  remove_nil
    (match t with
     | "Paragraph" ->
         let origin_ast = block.meta.origin_ast in
         let first_heading = st.nab_first_heading in
         st.nab_first_heading <- false;
         (if origin_ast <> None && newline_after_block && not first_heading
          then [ Some (newline_star 2) ]
          else [])
         @ List.map Option.some
             (mapcatv (inline_ast_to_simple_ast ~st) (CV.coll_items c))
         @ (let last_el =
              match List.rev (CV.coll_items c) with
              | last :: _ -> ast_type last
              | [] -> ""
            in
            if newline_after_block && last_el = "Break_Line" then
              inline_break_line ~st ()
            else [])
         @ [ Some (newline_star 1) ]
     | "Paragraph_line" ->
         invalid_arg "Paragraph_line is mldoc internal ast"
     | "Paragraph_Sep" -> [ Some (newline_star (match c with Int n -> n | _ -> 0)) ]
     | "Heading" -> List.map Option.some (block_heading ~st c)
     | "List" -> List.map Option.some (block_list ~st ~in_list:false (CV.coll_items c))
     | "Directive" | "Results" | "Export" | "CommentBlock" | "Custom" -> []
     | "Example" -> List.map Option.some (block_example ~st c)
     | "Src" -> List.map Option.some (block_src ~st c block.meta)
     | "Quote" -> List.map Option.some (block_quote ~st c block.meta)
     | "Latex_Fragment" -> List.map Option.some (block_latex_fragment ~st c)
     | "Latex_Environment" ->
         List.map Option.some (block_latex_env ~st (ast_rest block.node))
     | "Displayed_Math" -> List.map Option.some (block_displayed_math c)
     | "Drawer" -> List.map Option.some (block_drawer ~st (ast_rest block.node))
     | "Property_Drawer" ->
         List.map Option.some (block_property_drawer ~st c)
     | "Footnote_Definition" ->
         List.map Option.some
           (block_footnote_definition ~st (ast_rest block.node))
     | "Horizontal_Rule" ->
         [ Some (newline_star 1); Some (raw_text "---"); Some (newline_star 1) ]
     | "Table" -> List.map Option.some (block_table ~st c)
     | "Comment" -> List.map Option.some (block_comment ~st c)
     | "Raw_Html" -> List.map Option.some (block_raw_html ~st c)
     | "Hiccup" -> List.map Option.some (block_hiccup ~st c)
     | _ ->
         invalid_arg ("block-ast->simple-ast " ^ t ^ " not implemented yet"))

and inline_ast_to_simple_ast ~(st : state) (inline : value) : simple_ast list =
  let t = ast_type inline in
  let c = ast_content inline in
  match t with
  | "Emphasis" -> inline_emphasis ~st c
  | "Break_Line" | "Hard_Break_Line" -> List.filter_map Fun.id (inline_break_line ~st ())
  | "Verbatim" -> [ raw_text (match c with String s -> s | _ -> "") ]
  | "Code" -> [ raw_text ("`" ^ str_of c ^ "`") ]
  | "Tag" -> [ raw_text ("#" ^ hashtag_value_to_string c) ]
  | "Spaces" -> []
  | "Plain" -> [ raw_text (str_of c) ]
  | "Link" -> inline_link c
  | "Nested_link" -> inline_nested_link c
  | "Target" -> [ raw_text ("<<" ^ str_of c ^ ">>") ]
  | "Subscript" -> inline_subscript ~st c
  | "Superscript" -> inline_superscript ~st c
  | "Footnote_Reference" -> inline_footnote_reference c
  | "Cookie" -> inline_cookie c
  | "Latex_Fragment" -> inline_latex_fragment ~st c
  | "Macro" -> inline_macro c
  | "Entity" -> inline_entity c
  | "Timestamp" -> inline_timestamp c
  | "Radio_Target" -> [ raw_text ("<<<" ^ str_of c ^ ">>>") ]
  | "Email" -> inline_email c
  | "Inline_Hiccup" -> [ raw_text (str_of c) ]
  | "Inline_Html" -> [ raw_text (str_of c) ]
  | "Export_Snippet" | "Inline_Source_Block" -> []
  | _ ->
      invalid_arg ("inline-ast->simple-ast " ^ t ^ " not implemented yet")

(* export-helper — the :markdown pipeline. [resolvers] is explicit
   context for the cljs dynamic vars. *)
let export_helper ~(resolvers : resolvers) ~(content : string)
    ~(format : string) ~(options : value) : string =
  let remove_options =
    List.filter_map
      (function
        | Keyword k -> Some k
        | String k -> Some k
        | _ -> None)
      (mcoll options "remove-options")
  in
  let other_options = mget options "other-options" in
  let export_options =
    { indent_style =
        Option.value ~default:"dashes" (mstr options "indent-style")
    ; remove_emphasis = List.mem "emphasis" remove_options
    ; remove_page_ref_brackets = List.mem "page-ref" remove_options
    ; remove_tags = List.mem "tag" remove_options
    ; remove_properties = List.mem "property" remove_options
    ; keep_only_level_n = mint other_options "keep-only-level<=N"
    ; newline_after_block = CV.truthy (mget other_options "newline-after-block") }
  in
  let st = default_state ~export_options in
  let ast =
    Gp_mldoc.to_db_edn ~content ~format
    |> CV.coll_items
    |> List.map remove_block_ast_pos
    |> List.filter (fun a -> not (properties_block_ast a))
  in
  let ast = replace_block_and_page_reference_and_embed ~resolvers ~st ast in
  let ast =
    match export_options.keep_only_level_n with
    | Some n when n > 0 -> keep_only_level_n ast n
    | _ -> ast
  in
  let ast =
    if export_options.indent_style = "no-indent" then
      List.map replace_heading_with_paragraph ast
    else ast
  in
  let config =
    { map_fns =
        (if export_options.remove_page_ref_brackets then
           [ remove_page_ref_brackets ]
         else [])
    ; mapcat_fns =
        (if export_options.remove_emphasis then [ remove_emphasis ] else [])
        @ (if export_options.remove_tags then [ remove_tags ] else [])
    ; coll_fns =
        (if export_options.indent_style = "no-indent" then
           [ remove_prefix_spaces_in_plain ]
         else []) }
  in
  let ast =
    if config.map_fns <> [] || config.mapcat_fns <> [] || config.coll_fns <> []
    then List.map (walk_block_ast config) ast
    else ast
  in
  (* heading-prefix loop: Heading with empty :title before Quote/Src
     attaches its ast-content as the next block's :heading-prefix meta *)
  let ast =
    let rec loop remaining acc =
      match remaining with
      | [] -> List.rev acc
      | block :: rest ->
          let t, c = pair_of block in
          (match rest with
           | next :: rest'
             when t = "Heading" && mcoll c "title" = []
                  && (match fst (pair_of next) with
                      | "Quote" | "Src" -> true
                      | _ -> false) ->
               loop rest'
                 ({ next with
                    meta =
                      { next.meta with heading_prefix = Some c } }
                  :: acc)
           | _ -> loop rest (block :: acc))
    in
    loop ast []
  in
  let simple_asts = mapcatv (block_ast_to_simple_ast ~st) ast in
  simple_asts_to_string simple_asts
