(* logseq.graph-parser.property — file-graph property helpers. *)

let colons = "::"

let colons_org (property : string) : string = ":" ^ property ^ ":"

let properties_ast (block : Datascript.value) : bool =
  match block with
  | Datascript.Vector (Datascript.String t :: _) ->
    t = "Property_Drawer" || t = "Properties"
  | _ -> false

(* property/valid-property-name? *)
let valid_property_name_re1 = Regexp.compile "[\"|^|(|)|{|}]+"
let valid_property_name_re2 = Regexp.compile "^:#"

let valid_property_name (s : string) : bool =
  Edn_util.valid_edn_keyword s
  && not (Regexp.test valid_property_name_re1 s)
  && not (Regexp.test valid_property_name_re2 s)

let editable_linkable_built_in_properties =
  [ "alias"; "aliases"; "tags" ]

let editable_built_in_properties () =
  [ "title"; "icon"; "template"; "template-including-parent"; "public";
    "filters"; "exclude-from-graph-view"; "logseq.query/nlp-date";
    (* org-mode only *) "macro"; "filetags" ]
  @ editable_linkable_built_in_properties

let hidden_built_in_properties () =
  [ "custom-id"; "background_color"; "created_at"; "last_modified_at";
    "id"; "background-color"; "heading"; "collapsed";
    "created-at"; "updated-at"; "last-modified-at";
    "query-table"; "query-properties"; "query-sort-by"; "query-sort-desc";
    "ls-type"; "hl-type"; "hl-page"; "hl-stamp"; "hl-color"; "hl-value";
    "logseq.macro-name"; "logseq.macro-arguments"; "logseq.order-list-type";
    (* task markers *)
    "todo"; "doing"; "now"; "later"; "done" ]

let built_in_property_types : (string * string) list =
  [ "template-including-parent", "boolean"
  ; "public", "boolean"
  ; "exclude-from-graph-view", "boolean"
  ; "logseq.query/nlp-date", "boolean"
  ; "heading", "boolean"
  ; "collapsed", "boolean"
  ; "created-at", "integer"
  ; "created_at", "integer"
  ; "updated-at", "integer"
  ; "last-modified-at", "integer"
  ; "last_modified_at", "integer"
  ; "query-table", "boolean"
  ; "query-sort-desc", "boolean"
  ; "hl-page", "integer"
  ; "hl-stamp", "integer"
  ; "todo", "integer"
  ; "doing", "integer"
  ; "now", "integer"
  ; "later", "integer"
  ; "done", "integer" ]

let unparsed_built_in_properties () : string list =
  List.filter
    (fun k ->
      not
        (List.mem k editable_linkable_built_in_properties
         || List.mem_assoc k built_in_property_types))
    (hidden_built_in_properties () @ editable_built_in_properties ())

let properties_start = ":PROPERTIES:"
let properties_end = ":END:"

let properties_end_pattern =
  Regexp.compile (":END:" ^ "[\t\r ]*\n|(" ^ ":END:" ^ "\\s*$)")

let contains_properties (content : string) : bool =
  content <> ""
  && Common_util.str_includes content properties_start
  && Regexp.test properties_end_pattern content

(* cljs string/split-lines: split on \r?\n, dropping every trailing
   empty string (Java split semantics). *)
let split_lines (s : string) : string list =
  let raw = String.split_on_char '\n' s in
  let stripped =
    List.map
      (fun l ->
        let n = String.length l in
        if n > 0 && l.[n - 1] = '\r' then String.sub l 0 (n - 1) else l)
      raw
  in
  let rec drop_trailing_empty = function
    | [] -> []
    | "" :: tl -> drop_trailing_empty tl
    | l -> l
  in
  List.rev (drop_trailing_empty (List.rev stripped))

(* property/->new-properties *)
let to_new_properties (content : string) : string =
  if not (contains_properties content) then content
  else
    let lines = split_lines content in
    let index_of x xs =
      let rec go i = function
        | [] -> -1
        | y :: tl -> if y = x then i else go (i + 1) tl
      in
      go 0 xs
    in
    let start_idx = index_of properties_start lines in
    let end_idx = index_of properties_end lines in
    if start_idx >= 0 && end_idx > 0 && end_idx > start_idx then
      let before = List.filteri (fun i _ -> i < start_idx) lines in
      let middle =
        List.filteri (fun i _ -> i > start_idx && i < end_idx) lines
        |> List.map (fun text ->
               (* cljs (subs text 1) — throws on an empty drawer line. *)
               match Common_util.split_first ":"
                       (String.sub text 1 (String.length text - 1)) with
               | Some (k, v) ->
                 let k = Common_util.str_replace_all k "_" "-" in
                 let compare_k = Unicode.lowercase k in
                 let k =
                   if List.mem compare_k [ "id"; "custom_id"; "custom-id" ]
                   then "id"
                   else k
                 in
                 let k =
                   if compare_k = "last-modified-at" then "updated-at" else k
                 in
                 k ^ colons ^ " " ^ Unicode.trim v
               | None -> text)
      in
      let after = List.filteri (fun i _ -> i > end_idx) lines in
      String.concat "\n" (before @ middle @ after)
    else content

(* property/simplified-property? *)
let simplified_property_re = Regexp.compile "^\\s?[^ ]+::"

let simplified_property (line : string) : bool =
  Regexp.test simplified_property_re line

let drop_while f xs =
  let rec go = function
    | x :: rest when f x -> go rest
    | rest -> rest
  in
  go xs

(* property/remove-properties *)
let remove_properties (format : string) (content : string) : string =
  if contains_properties content then
    let lines = split_lines content in
    let rec split_with acc = function
      | line :: rest
        when not (starts_with_upper (Common_util.str_triml line) properties_start) ->
        split_with (line :: acc) rest
      | rest -> (List.rev acc, rest)
    and starts_with_upper s prefix =
      Common_util.str_starts_with (Unicode.uppercase s) prefix
    in
    let title_lines, properties_body = split_with [] lines in
    let rec drop_body = function
      | line :: rest
        when (not (starts_with_upper (Unicode.trim line) properties_end))
             || Unicode.trim line = "" ->
        drop_body rest
      | rest -> rest
    in
    let body = drop_body properties_body in
    let body =
      match body with
      | first :: rest
        when starts_with_upper (Common_util.str_triml first) properties_end ->
        let line =
          Common_util.regex_replace
            (* cljs #"(?i):END:\\s?" *)
            (Regexp.compile ~caseless:true ":END:\\s?")
            ~replacement:"" first
        in
        if Unicode.trim line = "" then rest else line :: rest
      | _ -> body
    in
    String.concat "\n" (title_lines @ body)
  else if format <> "org" then
    let lines = split_lines content in
    let lines =
      match lines with
      | first :: _rest when simplified_property first ->
        drop_while simplified_property lines
      | first :: rest ->
        first :: drop_while simplified_property rest
      | [] -> []
    in
    String.concat "\n" lines
  else content

(* property/remove-logbook *)
let remove_logbook (content : string) : string =
  let lines = split_lines content in
  let acc, _in =
    List.fold_left
      (fun (acc, in_logbook) line ->
        let upper = Unicode.uppercase (Unicode.trim line) in
        if Common_util.str_starts_with upper ":LOGBOOK:" then (acc, true)
        else if in_logbook && Common_util.str_starts_with upper ":END:" then
          (acc, false)
        else if in_logbook then (acc, true)
        else (line :: acc, in_logbook))
      ([], false) lines
  in
  String.concat "\n" (List.rev acc)

(* property/remove-deadline-scheduled *)
let remove_deadline_scheduled (content : string) : string =
  let lines = split_lines content in
  match lines with
  | [ _ ] -> content
  | first_line :: rest_lines ->
    (* cljs #"(?i)(?:^|\\s)(DEADLINE|SCHEDULED):\\s+<[^>]*>" *)
    let re =
      Regexp.compile ~caseless:true "(?:^|\\s)(DEADLINE|SCHEDULED):\\s+<[^>]*>"
    in
    let rest_lines =
      List.filter_map
        (fun line ->
          let upper = Unicode.uppercase (Common_util.str_triml line) in
          if
            Common_util.str_starts_with upper "DEADLINE: "
            || Common_util.str_starts_with upper "SCHEDULED: "
          then
            let cleaned =
              Unicode.trim
                (Common_util.regex_replace re ~replacement:"" line)
            in
            if cleaned = "" then None else Some cleaned
          else Some line)
        rest_lines
    in
    String.concat "\n" (first_line :: rest_lines)
  | [] -> content
