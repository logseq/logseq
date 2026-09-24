(* logseq.graph-parser.mldoc — wraps the npm mldoc JSON API behind the
   Mldoc platform virtual module; converts JSON results to cljs-style
   Datascript.value data. *)

open Datascript

let default_references = "{\"embed_blocks\":[],\"embed_pages\":[]}"

(* mldoc/default-config-map -> JSON string (cljs bean/->js +
   js/JSON.stringify) *)
let default_config_map ?export_heading_to_list ?export_keep_properties
    ?export_md_indent_style ?export_md_remove_options ?parse_outline_only
    (format : string) : (string * Wire.t) list =
  let cap = Unicode.capitalize format in
  [ Some ("toc", Wire.Bool false)
  ; Some ("parse_outline_only", Wire.Bool (Option.value ~default:false parse_outline_only))
  ; Some ("heading_number", Wire.Bool false)
  ; Some ("keep_line_break", Wire.Bool true)
  ; Some ("format", Wire.String cap)
  ; Some ("heading_to_list", Wire.Bool (Option.value ~default:false export_heading_to_list))
  ; Option.map (fun b -> ("exporting_keep_properties", Wire.Bool b)) export_keep_properties
  ; Option.map (fun s -> ("export_md_indent_style", Wire.String s)) export_md_indent_style
  ; Option.map
      (fun opts ->
        (* convert-export-md-remove-options: :page-ref -> ["Page_ref"],
           :emphasis -> ["Emphasis"] *)
        let arr =
          List.filter_map
            (fun o ->
              match o with
              | "page-ref" -> Some (Wire.Array [ Wire.String "Page_ref" ])
              | "emphasis" -> Some (Wire.Array [ Wire.String "Emphasis" ])
              | _ -> None)
            opts
        in
        ("export_md_remove_options", Wire.Array arr))
      export_md_remove_options ]
  |> List.filter_map Fun.id

let wire_obj kvs = Wire.Map (List.map (fun (k, v) -> (Wire.String k, v)) kvs)

let default_config ?export_heading_to_list ?export_keep_properties
    ?export_md_indent_style ?export_md_remove_options ?parse_outline_only
    (format : string) : string =
  Json.stringify
    (wire_obj
       (default_config_map ?export_heading_to_list ?export_keep_properties
          ?export_md_indent_style ?export_md_remove_options ?parse_outline_only
          format))

let parse_json ~content ~config = Mldoc.parse_json ~content ~config
let inline_parse_json ~text ~config = Mldoc.parse_inline_json ~text ~config

let get_references ~text ~config : value =
  if Unicode.trim text = "" then Nil
  else
    Common_util.json_clj_of_wire
      (Json.parse (Mldoc.get_references ~text ~config))

let ast_export_markdown ~ast ~config ~references : string =
  Mldoc.ast_export_markdown ~ast ~config
    ~references:(match references with "" -> default_references | r -> r)

(* mldoc/remove-indentation-spaces *)
let remove_indentation_spaces (s : string) (level : int) (remove_first_line : bool)
    : string =
  let lines =
    (* cljs string/split-lines: split on \n|\r\n and drops every trailing
       empty string. *)
    let raw = String.split_on_char '\n' s in
    let n = List.length raw in
    let ends_with_lf = Common_util.str_ends_with s "\n" in
    let stripped =
      List.mapi
        (fun i l ->
          let ln = String.length l in
          if
            ln > 0 && l.[ln - 1] = '\r'
            && (i < n - 1 || ends_with_lf)
          then String.sub l 0 (ln - 1)
          else l)
        raw
    in
    let rec drop_trailing_empty = function
      | [] -> []
      | "" :: tl -> drop_trailing_empty tl
      | l -> l
    in
    List.rev (drop_trailing_empty (List.rev stripped))
  in
  let rest =
    match lines with
    | [] -> []
    | _ :: tl -> if remove_first_line then lines else tl
  in
  let body =
    List.map
      (fun line ->
        if Unicode.trim (Common_util.safe_subs line 0 ~end_:level ()) = "" then
          Common_util.safe_subs line level ()
        else Common_util.str_triml line)
      rest
  in
  let content =
    match lines, remove_first_line with
    | f :: _, false -> f :: body
    | _ -> body
  in
  String.concat "\n" content

(* mldoc/update-src-full-content *)
let src_space_re = Regexp.compile "^[\t ]+"

let update_src_full_content (ast : value list) (content : string) : value list =
  List.map
    (fun pair ->
      match pair with
      | Vector [ block; pos_meta ] ->
        (match block with
         | Vector (String "Src" :: _) ->
           let start_pos = Clj_value.map_get_int pos_meta "start_pos" in
           let end_pos = Clj_value.map_get_int pos_meta "end_pos" in
           (match start_pos, end_pos with
            | Some sp, Some ep ->
              let full = Gp_utf8.substring content sp ~end_:ep () in
              let first_line =
                match String.split_on_char '\n' full with
                | l :: _ -> l
                | [] -> ""
              in
              let spaces =
                match Regexp.exec src_space_re first_line with
                | Some m -> String.length (Option.value ~default:"" m.Regexp.groups.(0))
                | None -> 0
              in
              let full =
                if spaces > 0 then remove_indentation_spaces full spaces true
                else full
              in
              let block =
                match block with
                | Vector [ String "Src"; m ] ->
                  Vector [ String "Src"; Clj_value.map_assoc m "full_content" (String full) ]
                | _ -> block
              in
              Vector [ block; pos_meta ]
            | _ -> pair)
         | _ -> pair)
      | _ -> pair)
    ast

(* inline ast types set (mldoc/inline-ast-types) *)
let inline_ast_types =
  [ "Plain"; "Spaces"; "Link"; "Nested_link"; "Target"; "Subscript";
    "Superscript"; "Footnote_Reference"; "Cookie"; "Latex_Fragment"; "Macro";
    "Entity"; "Timestamp"; "Radio_Target"; "Export_Snippet";
    "Inline_Source_Block"; "Email"; "Inline_Hiccup"; "Inline_Html"; "Emphasis";
    "Verbatim"; "Code"; "Break_Line"; "Hard_Break_Line" ]

(* mldoc/inline-coll? — a vector whose every element is ["<inline-type>" _] *)
let is_inline_coll (x : value) : bool =
  match x with
  | Vector xs when xs <> [] ->
    List.for_all
      (fun item ->
        match item with
        | Vector (String t :: _) -> List.mem t inline_ast_types
        | _ -> false)
      xs
  | _ -> false

(* mldoc/inline-ast->source *)
let rec inline_ast_to_source (node : value) : string option =
  match node with
  | Vector [ String "Plain"; String s ] -> Some s
  | Vector [ String "Spaces"; String s ] -> Some s
  | Vector [ String "Link"; data ] -> Clj_value.map_get_str data "full_text"
  | Vector [ String "Nested_link"; data ] -> Clj_value.map_get_str data "content"
  | Vector [ String "Superscript"; content ] ->
    let parts = List.filter_map inline_ast_to_source (Clj_value.coll_items content) in
    Some ("^{" ^ String.concat "" parts ^ "}")
  | Vector [ String "Subscript"; content ] ->
    let parts = List.filter_map inline_ast_to_source (Clj_value.coll_items content) in
    Some ("_{" ^ String.concat "" parts ^ "}")
  | _ -> None

let starts_with_at (s : string) (prefix : string) (idx : int) : bool =
  let e = idx + String.length prefix in
  e <= String.length s && String.sub s idx (String.length prefix) = prefix

(* mldoc/unclosed-script-markup? *)
let unclosed_script_markup (s : string) : bool =
  let n = String.length s in
  let rec loop idx depth =
    if idx < n then
      if starts_with_at s "^{" idx || starts_with_at s "_{" idx then
        loop (idx + 2) (depth + 1)
      else if depth > 0 && s.[idx] = '}' then loop (idx + 1) (depth - 1)
      else loop (idx + 1) depth
    else depth > 0
  in
  loop 0 0

(* mldoc/split-macro-arguments *)
let split_macro_arguments (s : string) : string list =
  if Unicode.trim s = "" then []
  else
    let n = String.length s in
    let rec loop idx start page_ref_depth script_depth quoted escaped result =
      if idx < n then
        let c = s.[idx] in
        if escaped then loop (idx + 1) start page_ref_depth script_depth quoted false result
        else if c = '\\' then loop (idx + 1) start page_ref_depth script_depth quoted true result
        else if c = '"' then loop (idx + 1) start page_ref_depth script_depth (not quoted) false result
        else if quoted then loop (idx + 1) start page_ref_depth script_depth quoted false result
        else if starts_with_at s "[[" idx then
          loop (idx + 2) start (page_ref_depth + 1) script_depth quoted false result
        else if page_ref_depth > 0 && starts_with_at s "]]" idx then
          loop (idx + 2) start (page_ref_depth - 1) script_depth quoted false result
        else if starts_with_at s "^{" idx || starts_with_at s "_{" idx then
          loop (idx + 2) start page_ref_depth (script_depth + 1) quoted false result
        else if script_depth > 0 && c = '}' then
          loop (idx + 1) start page_ref_depth (script_depth - 1) quoted false result
        else if page_ref_depth = 0 && script_depth = 0 && c = ',' then
          loop (idx + 1) (idx + 1) page_ref_depth script_depth quoted false
            (Unicode.trim (String.sub s start (idx - start)) :: result)
        else loop (idx + 1) start page_ref_depth script_depth quoted false result
      else List.rev (Unicode.trim (String.sub s start (n - start)) :: result)
    in
    loop 0 0 0 0 false false []

(* mldoc/macro-source->ast *)
let macro_name_re = Regexp.compile "^([^\\s]+)(?:\\s+([\\s\\S]*))?$"

let macro_source_to_ast (s : string) : value option =
  let n = String.length s in
  if n >= 4 && Common_util.str_starts_with s "{{" && Common_util.str_ends_with s "}}" then
    let content = Common_util.str_triml (String.sub s 2 (n - 4)) in
    match Regexp.exec macro_name_re content with
    | Some m ->
      (match m.Regexp.groups.(1) with
       | Some name ->
         let args =
           match m.Regexp.groups.(2) with
           | Some a -> split_macro_arguments a
           | None -> []
         in
         Some
           (Vector
              [ String "Macro"
              ; Map
                  [ Keyword "name", String name
                  ; Keyword "arguments",
                    Vector (List.map (fun a -> String a) args) ] ])
       | None -> None)
    | None -> None
  else None


let list_take (n : int) (xs : 'a list) : 'a list =
  let rec go n acc = function
    | _ when n <= 0 -> List.rev acc
    | x :: rest -> go (n - 1) (x :: acc) rest
    | [] -> List.rev acc
  in
  go n [] xs

let list_drop (n : int) (xs : 'a list) : 'a list =
  let rec go n xs =
    if n <= 0 then xs else (match xs with _ :: rest -> go (n - 1) rest | [] -> [])
  in
  go n xs

let str_index_of_from (s : string) (pattern : string) (start : int) : int option =
  let n = String.length s and m = String.length pattern in
  let rec go i =
    if i + m > n then None
    else if String.sub s i m = pattern then Some i
    else go (i + 1)
  in
  if m = 0 then Some (min start n) else if start >= n then None else go start

(* scan result of collect-macro-source *)
type macro_scan =
  { scan_macro : value option
  ; scan_remaining : value list
  ; scan_offset : int
  ; scan_skip : int }

(* mldoc/collect-macro-source *)
let collect_macro_source (items : value list) (start : int) : macro_scan =
  let rec loop remaining offset fragments scanned =
    match remaining with
    | [] -> { scan_macro = None; scan_remaining = []; scan_offset = 0; scan_skip = scanned }
    | item :: _more ->
      (match item with
       | Vector [ String "Plain"; String content ] ->
         (match str_index_of_from content "}}" offset with
          | Some idx ->
            let e = idx + 2 in
            let source =
              String.concat "" (List.rev (String.sub content offset (e - offset) :: fragments))
            in
            (match macro_source_to_ast source with
             | Some macro ->
               { scan_macro = Some macro
               ; scan_remaining = remaining
               ; scan_offset = e
               ; scan_skip = 0 }
             | None ->
               { scan_macro = None
               ; scan_remaining = []
               ; scan_offset = 0
               ; scan_skip = max 1 scanned })
          | None ->
            loop (List.tl remaining) 0
              (String.sub content offset (String.length content - offset)
               :: fragments)
              (scanned + 1))
       | _ ->
         (match inline_ast_to_source item with
          | Some src ->
            loop (List.tl remaining) 0 (src :: fragments) (scanned + 1)
          | None ->
            { scan_macro = None
            ; scan_remaining = []
            ; scan_offset = 0
            ; scan_skip = scanned }))
  in
  loop items start [] 0

(* mldoc/close-script-markup-in-macro *)
let close_script_markup_in_macro (macro : value) : value =
  match macro with
  | Vector [ t; m ] ->
    let args = Clj_value.coll_items (Clj_value.map_get m "arguments") in
    (match List.rev args with
     | String last :: rev_rest ->
       let args' = List.rev (String (last ^ "}") :: rev_rest) in
       Vector [ t; Clj_value.map_assoc m "arguments" (Vector args') ]
     | _ -> macro)
  | _ -> macro

(* mldoc/recover-inline-macros *)
let recover_inline_macros (inline_list : value list) : value list =
  let rec loop remaining offset result =
    match remaining with
    | [] -> List.rev result
    | item :: more ->
      (match item with
       | Vector [ String "Plain"; String content ] ->
         (match str_index_of_from content "{{" offset with
          | Some idx ->
            let scan = collect_macro_source remaining idx in
            (match scan.scan_macro with
             | Some macro ->
               let prefix = String.sub content offset (idx - offset) in
               let result =
                 if Unicode.trim prefix <> "" || prefix <> "" then
                   Vector [ String "Plain"; String prefix ] :: result
                 else result
               in
               loop scan.scan_remaining scan.scan_offset (macro :: result)
             | None ->
               let skip = scan.scan_skip in
               let item' =
                 if offset = 0 then item
                 else
                   Vector
                     [ String "Plain"
                     ; String
                         (String.sub content offset (String.length content - offset)) ]
               in
               (* cljs (take (dec skip) more) — skip counts item itself *)
               let result =
                 List.rev_append (list_take (skip - 1) more) (item' :: result)
               in
               loop (list_drop skip remaining) 0 result)
          | None ->
            let suffix =
              String.sub content offset (String.length content - offset)
            in
            let result =
              if offset = 0 then item :: result
              else if suffix <> "" then
                Vector [ String "Plain"; String suffix ] :: result
              else result
            in
            loop more 0 result)
       | Vector (String "Macro" :: _) as macro_item ->
         let args =
           match macro_item with
           | Vector [ _; m ] -> Clj_value.coll_items (Clj_value.map_get m "arguments")
           | _ -> []
         in
         let last_arg =
           match List.rev args with String a :: _ -> Some a | _ -> None
         in
         (match last_arg, more with
          | Some a,
            (Vector [ String "Plain"; String p ]) :: _rest
            when args <> []
                 && unclosed_script_markup a
                 && Common_util.str_starts_with p "}" ->
            loop more 1 (close_script_markup_in_macro macro_item :: result)
          | _ -> loop more 0 (item :: result))
       | _ -> loop more 0 (item :: result))
  in
  loop inline_list 0 []

(* mldoc/normalize-macro-asts — postwalk recover-inline-macros over
   inline colls *)
let rec normalize_macro_asts (x : value) : value =
  let walked =
    match x with
    | Vector xs -> Vector (List.map normalize_macro_asts xs)
    | List xs -> List (List.map normalize_macro_asts xs)
    | Set xs -> Set (List.map normalize_macro_asts xs)
    | Map kvs -> Map (List.map (fun (k, v) -> (k, normalize_macro_asts v)) kvs)
    | other -> other
  in
  if is_inline_coll walked then
    match walked with
    | Vector xs -> Vector (recover_inline_macros xs)
    | _ -> walked
  else walked

let macro_with_script_markup (content : string) : bool =
  Common_util.str_includes content "{{"
  && (Common_util.str_includes content "^{"
      || Common_util.str_includes content "_{")

(* mldoc/collect-page-properties *)
let collect_page_properties (ast : value list) (config : string) : value list =
  match ast with
  | [] -> []
  | _ ->
    let is_directive pair =
      match pair with
      | Vector [ Vector (String t :: _); _ ] ->
        Unicode.lowercase t = "directive"
      | _ -> false
    in
    let directives, others = List.partition is_directive ast in
    let properties =
      List.filter_map
        (fun pair ->
          match pair with
          | Vector [ Vector [ _dir; k; v ]; _ ] ->
            (* cljs (get-references v config) — v raw; nil short-circuits
               on (string/blank? text), scalars reach JS coerced by (str). *)
            let text =
              match v with
              | String t -> t
              | Nil -> ""
              | _ -> Edn_util.pr_str v
            in
            Some (Vector [ k; v; get_references ~text ~config ])
          | _ -> None)
        directives
    in
    if properties <> [] then
      Vector [ Vector [ String "Properties"; Vector properties ]; Nil ] :: others
    else ast

(* mldoc/->edn *)
let to_edn ~(content : value) ~(config : string) : value =
  match content with
  | String s ->
    (try
       if Unicode.trim s = "" then Vector []
       else
         let parsed =
           Common_util.json_clj_of_wire (Json.parse (parse_json ~content:s ~config))
         in
         let ast =
           match parsed with
           | Vector xs -> xs
           | List xs -> xs
           | _ -> []
         in
         let ast =
           if macro_with_script_markup s then
             List.map normalize_macro_asts ast
           else ast
         in
         let ast = update_src_full_content ast s in
         Vector (collect_page_properties ast config)
     with _ ->
       Worker_log.error "unexpected-error" [];
       Vector [])
  | _ ->
    Worker_log.error "edn/wrong-content-type"
      [ "content", Edn_util.pr_str content ];
    Nil

let to_edn_format ~(content : string) ~(format : string) : value =
  to_edn ~content:(String content) ~config:(default_config format)

(* gp-mldoc/get-default-config for a DB-backed repo: default-config-map
   plus the db-based? overrides enable_drawers/parse_marker/parse_priority
   (mldoc.cljc get-default-config). *)
let db_default_config (format : string) : string =
  Json.stringify
    (wire_obj
       (default_config_map format
        @ [ ("enable_drawers", Wire.Bool false)
          ; ("parse_marker", Wire.Bool false)
          ; ("parse_priority", Wire.Bool false) ]))

(* get-default-config — cljs adds the DB overrides when the repo is
   db-based (name starts with db-version-prefix). *)
let get_default_config ~repo ~format : string =
  let db_based =
    Common_util.str_starts_with repo Common_config.db_version_prefix
  in
  if db_based then db_default_config format else default_config format

(* gp-mldoc/->db-edn — ->edn with the db-based default config. *)
let to_db_edn ~(content : string) ~(format : string) : value =
  to_edn ~content:(String content) ~config:(db_default_config format)

(* mldoc/inline->edn *)
let inline_to_edn (text : string) (config : string) : value list =
  try
    if Unicode.trim text = "" then []
    else
      let parsed =
        Common_util.json_clj_of_wire
          (Json.parse (inline_parse_json ~text ~config))
      in
      let ast = Clj_value.coll_items parsed in
      if macro_with_script_markup text then
        (* the top-level list itself is an inline coll: normalize the whole
           vector so sibling-level macro recovery runs on it, matching
           cljs postwalk *)
        (match normalize_macro_asts (Vector ast) with
         | Vector xs -> xs
         | v -> [ v ])
      else ast
  with _ -> []

(* mldoc/ast-link? *)
let ast_link (node : value) : bool =
  match node with
  | Vector [ String "Link"; link ] ->
    (match Clj_value.coll_items (Clj_value.map_get link "url") with
     | String ref_type :: rest ->
       (match ref_type with
        | "Page_ref" ->
          (match rest with
           | [ String ref_value ] -> Common_config.local_relative_asset ref_value
           | _ -> false)
        | "Block_ref" -> false
        | _ -> true)
     | _ -> true)
  | _ -> false

(* mldoc/mldoc-link? *)
let mldoc_link ~(format : string) (s : string) : bool =
  let result = inline_to_edn s (default_config format) in
  match result with
  | [ first ] ->
    (match first with
     | Vector (String "Nested_link" :: _) -> true
     | Vector [ String "Link"; data ] ->
       (match Clj_value.coll_items (Clj_value.map_get data "url") with
        | String t :: _ ->
          t = "Page_ref" || t = "Block_ref" || t = "Complex"
        | _ -> false)
     | Vector [ String t; data ] when t <> "Plain" ->
       (match Clj_value.coll_items (Clj_value.map_get data "url") with
        | String u :: _ -> u = "Page_ref" || u = "Block_ref" || u = "Complex"
        | _ -> false)
     | _ -> false)
  | _ -> false

(* mldoc/block-with-title? *)
let block_with_title (type_ : string) : bool =
  List.mem type_ [ "Paragraph"; "Raw_Html"; "Hiccup"; "Heading" ]
