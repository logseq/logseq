(* logseq.common.util — misc shared helpers used by the graph-parser port.
   1:1 ports of the corresponding cljs fns; several delegate to the platform
   spec or to already-ported modules (Ldb.page_name_sanity_lc,
   Date_time_util.time_ms). *)

open Datascript

(* ---- tiny string helpers (cljs clojure.string analogs) ---- *)

let str_index_of (s : string) (pattern : string) : int option =
  let n = String.length s and m = String.length pattern in
  if m = 0 then Some 0
  else
    let rec go i =
      if i + m > n then None
      else if String.sub s i m = pattern then Some i
      else go (i + 1)
    in
    go 0

let str_last_index_of (s : string) (pattern : string) : int option =
  let n = String.length s and m = String.length pattern in
  let rec go i =
    if i < 0 then None
    else if String.sub s i m = pattern then Some i
    else go (i - 1)
  in
  if n < m then None else go (n - m)

let str_replace_all (s : string) (old_value : string) (new_value : string) : string =
  let m = String.length old_value in
  if m = 0 then s
  else
    let buf = Buffer.create (String.length s) in
    let rec go i =
      match str_index_of_from s old_value i with
      | None -> Buffer.add_substring buf s i (String.length s - i)
      | Some j ->
        Buffer.add_substring buf s i (j - i);
        Buffer.add_string buf new_value;
        go (j + m)
    and str_index_of_from s p i =
      let n = String.length s in
      let rec loop k =
        if k + m > n then None
        else if String.sub s k m = p then Some k
        else loop (k + 1)
      in
      if i + m > n then None else loop i
    in
    go 0;
    Buffer.contents buf

(* ---- time ---- *)

let time_ms () = Date_time_util.time_ms ()

(* common-util/timestamp-ms — Date or epoch-ms -> positive ms option. *)
let timestamp_ms (v : value) : int64 option =
  let ms =
    match v with
    | Float f -> Some (Int64.of_float f)
    | Int n -> Some (Int64.of_int n)
    | Instant n -> Some n
    | _ -> None
  in
  match ms with
  | Some ms when Int64.compare ms 0L > 0 -> Some ms
  | _ -> None

(* ---- uri ---- *)

let hex_val c =
  match c with
  | '0' .. '9' -> Char.code c - Char.code '0'
  | 'a' .. 'f' -> Char.code c - Char.code 'a' + 10
  | 'A' .. 'F' -> Char.code c - Char.code 'A' + 10
  | _ -> -1

(* JS decodeURIComponent: percent-decodes %XX byte sequences (UTF-8). *)
let decode_uri_component (s : string) : string option =
  let n = String.length s in
  let buf = Buffer.create n in
  let ok = ref true in
  let rec go i =
    if i < n then
      match s.[i] with
      | '%' when i + 2 < n ->
        let hi = hex_val s.[i + 1] and lo = hex_val s.[i + 2] in
        if hi < 0 || lo < 0 then ok := false
        else begin
          Buffer.add_char buf (Char.chr ((hi lsl 4) lor lo));
          go (i + 3)
        end
      | c ->
        Buffer.add_char buf c;
        go (i + 1)
  in
  (try go n with _ -> ok := false);
  if !ok then Some (Buffer.contents buf) else None

(* JS encodeURIComponent *)
let encode_uri_component (s : string) : string =
  let unreserved c =
    match c with
    | 'a' .. 'z' | 'A' .. 'Z' | '0' .. '9'
    | '-' | '_' | '.' | '!' | '~' | '*' | '\'' | '(' | ')' -> true
    | _ -> false
  in
  let buf = Buffer.create (String.length s) in
  String.iter
    (fun c ->
      if unreserved c then Buffer.add_char buf c
      else Buffer.add_string buf (Printf.sprintf "%%%02X" (Char.code c)))
    s;
  Buffer.contents buf

(* common-util/safe-decode-uri-component *)
let safe_decode_uri_component (uri : string) : string =
  match decode_uri_component uri with
  | Some s -> s
  | None ->
    Worker_log.error "decode-uri-component-failed" [ ("uri", uri) ];
    uri

(* common-util/path-normalize *)
let path_normalize (s : string) : string = Unicode.nfc s

(* common-util/remove-nils-non-nested *)
let remove_nils_non_nested (kvs : (attr * value) list) : (attr * value) list =
  List.filter (fun (_k, v) -> v <> Nil) kvs

(* common-util/split-first / split-last *)
let split_first (pattern : string) (s : string) : (string * string) option =
  match str_index_of s pattern with
  | None -> None
  | Some i ->
    Some (String.sub s 0 i, String.sub s (i + String.length pattern)
          (String.length s - i - String.length pattern))

let split_last (pattern : string) (s : string) : (string * string) option =
  match str_last_index_of s pattern with
  | None -> None
  | Some i ->
    Some (String.sub s 0 i, String.sub s (i + String.length pattern)
          (String.length s - i - String.length pattern))

let str_starts_with (s : string) (prefix : string) : bool =
  let n = String.length s and m = String.length prefix in
  n >= m && String.sub s 0 m = prefix

let str_ends_with (s : string) (suffix : string) : bool =
  let n = String.length s and m = String.length suffix in
  n >= m && String.sub s (n - m) m = suffix

let str_includes (s : string) (needle : string) : bool =
  str_index_of s needle <> None

let is_space_char c = c = ' ' || c = '\t' || c = '\n' || c = '\r' || c = '\x0b' || c = '\x0c'

let str_triml (s : string) : string =
  let n = String.length s in
  let rec go i = if i < n && is_space_char s.[i] then go (i + 1) else i in
  let i = go 0 in
  String.sub s i (n - i)

let str_trimr (s : string) : string =
  let n = String.length s in
  let rec go i = if i >= 0 && is_space_char s.[i] then go (i - 1) else i in
  let i = go (n - 1) in
  String.sub s 0 (i + 1)

(* common-util/tag-valid? *)
let tag_valid_re = Regexp.compile "[#\t\r\n]+"
let tag_valid (tag_name : string) : bool = not (Regexp.test tag_valid_re tag_name)

(* common-util/safe-subs — clamped substring. The cljs arity-2 guard on
   non-strings is unnecessary in OCaml. *)
let safe_subs (s : string) (start : int) ?end_ () : string =
  let c = String.length s in
  let start = min c start in
  let end_ = match end_ with Some e -> min c e | None -> c in
  if end_ <= start then "" else String.sub s start (end_ - start)

let wrapped_by_quotes (v : string) : bool =
  String.length v >= 2 && v.[0] = '"' && v.[String.length v - 1] = '"'

let wrapped_by_parens (v : string) : bool =
  String.length v >= 2 && v.[0] = '(' && v.[String.length v - 1] = ')'

(* common-util/zero-pad *)
let zero_pad (n : int) : string = if n < 10 then "0" ^ string_of_int n else string_of_int n

(* common-util/remove-boundary-slashes *)
let remove_boundary_slashes (s : string) : string = Ldb.remove_boundary_slashes s

(* common-util/split-namespace-pages *)
let split_namespace_pages (title : string) : string list =
  match String.split_on_char '/' title with
  | [] -> []
  | first :: others ->
    let rec loop acc last = function
      | [] -> List.rev acc
      | x :: rest ->
        let next = last ^ "/" ^ x in
        loop (next :: acc) next rest
    in
    List.map String.trim (loop [ first ] first others)

let url_encoded_pattern = Regexp.compile "%[0-9a-f]{2}"

let page_name_sanity (s : string) : string = Ldb.page_name_sanity s
let page_name_sanity_lc (s : string) : string = Ldb.page_name_sanity_lc s
let safe_page_name_sanity_lc (s : string) : string = page_name_sanity_lc s

(* common-util/capitalize-all *)
let capitalize_all (s : string) : string =
  String.split_on_char ' ' s
  |> List.map (fun w ->
         if w = "" then w
         else String.mapi (fun i c -> if i = 0 then Char.uppercase_ascii c else c) w)
  |> String.concat " "

(* common-util/distinct-by *)
let distinct_by (f : 'a -> 'k) (coll : 'a list) : 'a list =
  let seen = Hashtbl.create 17 in
  List.filter
    (fun x ->
      let k = f x in
      if Hashtbl.mem seen k then false
      else begin Hashtbl.replace seen k (); true end)
    coll

(* common-util/path->file-ext *)
let path_to_file_ext_re = Regexp.compile "\\.(\\w+)[^.]*$"

let path_to_file_ext (path_or_file_name : string) : string option =
  let last_part =
    match List.rev (String.split_on_char '/' path_or_file_name) with
    | last :: _ -> last
    | [] -> ""
  in
  match Regexp.exec path_to_file_ext_re last_part with
  | Some m ->
    (match m.Regexp.groups.(1) with Some g -> Some g | None -> None)
  | None -> None

(* common-util/normalize-format *)
let normalize_format (format : string) : string =
  match format with "md" -> "markdown" | _ -> format

(* common-util/get-format — file ext -> "org" | "markdown" | ... *)
let get_format (file : string) : string =
  match file with
  | "" -> ""
  | _ ->
    (match path_to_file_ext file with
     | Some ext -> normalize_format (String.lowercase_ascii ext)
     | None -> "")

(* common-util/get-file-ext *)
let get_file_ext (file : string) : string option =
  if String.contains file '.' then
    Option.map String.lowercase_ascii (path_to_file_ext file)
  else None

(* common-util/uuid-string? *)
let uuid_pattern = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
let uuid_string_re = Regexp.compile ("^" ^ uuid_pattern ^ "$")

let uuid_string (s : string) : bool = Regexp.test uuid_string_re s

(* ---- json->clj ---- *)

let rec value_of_wire (w : Wire.t) : value =
  match w with
  | Wire.Nil -> Nil
  | Wire.Bool b -> Bool b
  | Wire.String s -> String s
  | Wire.Int n -> Int n
  | Wire.Int64 n -> Instant n
  | Wire.Float f -> Float f
  | Wire.Binary s -> String s
  | Wire.Keyword s -> Keyword s
  | Wire.Symbol s -> Symbol s
  | Wire.Big_decimal s -> Float (float_of_string s)
  | Wire.Big_int s -> Int (int_of_string s)
  | Wire.Date_ms n -> Instant n
  | Wire.Uuid s -> Uuid s
  | Wire.Uri s -> String s
  | Wire.Array xs -> Vector (List.map value_of_wire xs)
  | Wire.List xs -> List (List.map value_of_wire xs)
  | Wire.Map kvs -> Map (List.map (fun (k, v) -> (value_of_wire k, value_of_wire v)) kvs)
  | Wire.Set xs -> Set (List.map value_of_wire xs)
  | Wire.Tagged (_t, v) -> Tuple [ None; Some (value_of_wire v) ]

(* cljs js->clj :keywordize-keys true on mldoc JSON: object keys become
   keywords, arrays become vectors. *)
let rec json_clj_of_wire (w : Wire.t) : value =
  match w with
  | Wire.Map kvs ->
    Map
      (List.map
         (fun (k, v) ->
           let k' =
             match k with
             | Wire.String s -> Keyword s
             | _ -> value_of_wire k
           in
           (k', json_clj_of_wire v))
         kvs)
  | Wire.Array xs -> Vector (List.map json_clj_of_wire xs)
  | Wire.List xs -> List (List.map json_clj_of_wire xs)
  | _ -> value_of_wire w

let json_to_clj (json_string : string) : value =
  json_clj_of_wire (Json.parse json_string)

(* ---- regex helpers ---- *)

let escape_chars = "\\[]{}().+*?|$^"

(* common-util/escape-regex-chars *)
let escape_regex_chars (old_value : string) : string =
  String.fold_left
    (fun acc escape_char ->
      let ch = String.make 1 escape_char in
      str_replace_all acc ch ("\\" ^ ch))
    old_value escape_chars

let regex_replace re ~replacement s =
  Regexp.replace_all re ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> replacement) s

let regex_replace_first re ~replacement s =
  Regexp.replace re ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> replacement) s

(* common-util/replace-ignore-case *)
let replace_ignore_case (s : string) (old_value : string) (new_value : string) : string =
  regex_replace (Regexp.compile ("" ^ escape_regex_chars old_value)) ~replacement:new_value s

(* common-util/clear-markdown-heading *)
let markdown_heading_pattern = Regexp.compile "^#+\\s+"

let clear_markdown_heading (content : string) : string =
  regex_replace_first markdown_heading_pattern ~replacement:"" content
