(* logseq.graph-parser.text — text/property-value helpers for the parser. *)

open Datascript

(* text/get-file-basename = page-ref/get-file-basename (node-path basename) *)
let get_file_basename (path : string) : string =
  if String.trim path = "" then ""
  else
    let path = Common_util.str_replace_all path "+" "/" in
    (match List.rev (String.split_on_char '/' path) with
     | last :: _ -> last
     | [] -> path)

(* node-path .name = basename without ext *)
let get_file_rootname (path : string) : string =
  if String.trim path = "" then ""
  else
    let path = Common_util.str_replace_all path "+" "/" in
    let base = get_file_basename path in
    fst (Common_path.split_ext base)

(* org file link [[file:path][label]] — cljs re-matches = full match *)
let org_file_link_re = Regexp.compile "^\\[\\[(file:.*)\\]\\[.+?\\]\\]$"

(* text/get-page-name *)
let get_page_name (s : string) : string option =
  match Page_ref.markdown_page_ref_name s with
  | Some label -> Some label
  | None ->
    (match Regexp.exec org_file_link_re s with
     | Some m ->
       (match m.Regexp.groups.(1) with
        | Some path ->
          let rootname = get_file_rootname path in
          if rootname = "" then None
          else Some (Common_util.str_replace_all rootname "." "/")
        | None -> None)
     | _ -> Page_ref.get_page_name s)

let page_ref_un_brackets (s : string) : string = Page_ref.get_page_name_exn s

let get_nested_page_name (page_name : string) : string option =
  Ns_util.get_nested_page_name page_name

(* text/remove-level-spaces *)
let remove_level_spaces_aux (text : string) (pattern : string) (space : bool)
    (trim_left : bool) : string =
  let pat = Printf.sprintf (if space then "^[%s]+\\s+" else "^[%s]+\\s?") pattern in
  let text = if trim_left then Common_util.str_triml text else text in
  Common_util.regex_replace_first (Regexp.compile pat) ~replacement:"" text

let remove_level_spaces (text : string) (format : string) (block_pattern : string)
    ?(space = false) ?(trim_left = true) () : string =
  match format with
  | "" -> text
  | _ ->
    if String.trim text = "" then ""
    else if format = "markdown" && Common_util.str_starts_with text "---" then text
    else remove_level_spaces_aux text block_pattern space trim_left

(* text/parse-non-string-property-value *)
let parse_non_string_property_value (v : string) : value option =
  if v = "true" then Some (Bool true)
  else if v = "false" then Some (Bool false)
  else if Regexp.test (Regexp.compile "^\\d+$") v then
    Some (Int (int_of_string v))
  else None

(* text/get-ref-from-ast *)
let rec get_ref_from_ast (node : value) : string option =
  match node with
  | Vector [ String "Link"; data ] ->
    (match Clj_value.coll_items (Clj_value.map_get data "url") with
     | String "Page_ref" :: _ ->
       (match Clj_value.coll_items (Clj_value.map_get data "url") with
        | [ _; String s ] -> Some s
        | _ -> None)
     | String "Search" :: _ ->
       (match Clj_value.coll_items (Clj_value.map_get data "url") with
        | [ _; String s ] -> Some s
        | _ -> None)
     | _ -> None)
  | Vector [ String "Nested_link"; data ] ->
    (match Clj_value.map_get_str data "content" with
     | Some content -> get_page_name content
     | None -> None)
  | Vector [ String "Tag"; data ] ->
    (match Clj_value.coll_items data with
     | (Vector [ String "Plain"; String s ]) :: _ -> Some s
     | (x :: _) -> get_ref_from_ast x
     | [] -> None)
  | _ -> None

(* text/extract-refs-from-mldoc-ast *)
let extract_refs_from_mldoc_ast (v : value list) : value =
  v
  |> List.filter (fun ast -> not (Gp_mldoc.ast_link ast))
  |> List.filter_map get_ref_from_ast
  |> List.map String.trim
  |> List.filter (fun s -> s <> "")
  |> Common_util.distinct_by Fun.id
  |> fun xs -> Set (List.map (fun s -> String s) xs)

(* text/sep-by-comma *)
let sep_by_comma (s : string) : string list =
  Common_util.str_replace_all s "，" ","
  |> String.split_on_char ','
  |> List.map String.trim
  |> List.filter (fun s -> s <> "")
  |> Common_util.distinct_by Fun.id

(* text/separated-by-commas? *)
let separated_by_commas (config_state : (attr * value) list) (k : attr) : bool =
  let configured =
    match List.assoc_opt "property/separated-by-commas" config_state with
    | Some v -> List.filter_map Clj_value.string_of_kwish (Clj_value.coll_items v)
    | None -> []
  in
  List.mem k (Gp_property.editable_linkable_built_in_properties @ configured)

(* text/extract-refs-by-commas — split comma-separated plain text via the
   inline parser so commas inside [[page, name]] are preserved *)
let extract_refs_by_commas (v : string) (format : string) : string list =
  let ast = Gp_mldoc.inline_to_edn v (Gp_mldoc.default_config format) in
  ast
  |> List.filter_map
       (fun node ->
         match node with
         | Vector [ String "Plain"; String s ] -> Some s
         | _ -> None)
  |> List.concat_map sep_by_comma
  |> Common_util.distinct_by Fun.id

(* text/parse-property-refs *)
let parse_property_refs (k : attr) (v : string) (mldoc_references_ast : value list)
    (config_state : (attr * value) list) : value =
  let refs = Clj_value.coll_items (extract_refs_from_mldoc_ast mldoc_references_ast) in
  if separated_by_commas config_state k then
    let format =
      match List.assoc_opt "format" config_state with
      | Some (String f) -> f
      | _ -> "markdown"
    in
    let by_commas = extract_refs_by_commas v format in
    Set (List.map (fun s -> String s) by_commas @ refs)
  else Set refs

(* cljs (name k) on a keyword: name segment only *)
let kw_name_string (k : attr) : string =
  match String.rindex_opt k '/' with
  | Some i -> String.sub k (i + 1) (String.length k - i - 1)
  | None -> k

(* text/parse-property *)
let parse_property (k : attr) (v : string) (mldoc_references_ast : value list)
    (config_state : (attr * value) list) : value =
  let v' = String.trim v in
  let unparsed =
    Gp_property.unparsed_built_in_properties ()
    @ (match List.assoc_opt "ignored-page-references-keywords" config_state with
       | Some iv -> List.filter_map Clj_value.string_of_kwish
                      (Clj_value.coll_items iv)
       | None -> [])
  in
  if List.mem (kw_name_string k) unparsed then String v'
  else if Common_util.wrapped_by_quotes v' then String v'
  else
    let refs = Clj_value.coll_items (parse_property_refs k v' mldoc_references_ast config_state) in
    if refs <> [] then Set refs
    else
      (match parse_non_string_property_value v' with
       | Some nv -> nv
       | None -> String v')

let namespace_page (s : string) : bool = Ns_util.namespace_page (Some s)
let get_namespace_last_part (s : string) : string = Ns_util.get_last_part s
