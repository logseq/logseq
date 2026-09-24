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
  (try go 0 with _ -> ok := false);
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

(* cljs string/triml / trimr — goog.string.trimLeft/trimRight use the JS
   WhiteSpace set (incl. U+00A0, U+3000, U+FEFF), handled by Unicode.triml/r. *)
let str_triml (s : string) : string = Unicode.triml s
let str_trimr (s : string) : string = Unicode.trimr s

(* js/parseFloat — leading JS whitespace skipped, then the longest valid
   float prefix: digits, '.', exponent 'e'/'E' with optional sign, or a
   sign followed by 'Infinity'. No hex/octal/binary prefixes (0x parses
   as 0). Returns NaN as [None]. *)
let parse_float (s0 : string) : float option =
  let n0 = String.length s0 in
  let i0 = ref 0 in
  while
    !i0 < n0
    && (match s0.[!i0] with
        | ' ' | '\t' | '\n' | '\r' | '\011' | '\012' -> true
        | _ -> false)
  do incr i0 done;
  let s = String.sub s0 !i0 (n0 - !i0) in
  let n = String.length s in
  (* strip the sign before the Infinity check *)
  let sign, s, n =
    if n > 0 && (s.[0] = '+' || s.[0] = '-') then
      (s.[0], String.sub s 1 (n - 1), n - 1)
    else ('+', s, n)
  in
  if n >= 8 && String.sub s 0 8 = "Infinity" then
    Some (if sign = '-' then Float.neg_infinity else Float.infinity)
  else
    let s = if sign = '+' then s else String.make 1 sign ^ s in
    let n = String.length s in
    let rec scan i seen_digit seen_dot seen_exp =
      if i >= n then i
      else
        let c = s.[i] in
        if c >= '0' && c <= '9' then scan (i + 1) true seen_dot seen_exp
        else if c = '.' && not seen_dot && not seen_exp then
          scan (i + 1) seen_digit true seen_exp
        else if (c = 'e' || c = 'E') && seen_digit && not seen_exp then
          scan (i + 1) seen_digit seen_dot true
        else if
          (c = '-' || c = '+')
          && (i = 0 || s.[i - 1] = 'e' || s.[i - 1] = 'E')
        then scan (i + 1) seen_digit seen_dot seen_exp
        else i
    in
    let stop = scan 0 false false false in
    (* a trailing exponent marker without digits is not part of the
       number: parseFloat("1e") = 1, parseFloat("1e+") = 1 *)
    let stop =
      if stop >= 1 && (s.[stop - 1] = 'e' || s.[stop - 1] = 'E') then
        stop - 1
      else if
        stop >= 2 && (s.[stop - 1] = '-' || s.[stop - 1] = '+')
        && (s.[stop - 2] = 'e' || s.[stop - 2] = 'E')
      then stop - 2
      else stop
    in
    if stop > 0 then
      try Some (float_of_string (String.sub s 0 stop)) with _ -> None
    else None

(* js/Number on a string — the whole string must be a numeric literal
   (unlike parseFloat's prefix scan): optional sign, decimal
   integer/fraction/exponent, 'Infinity', or 0x/0o/0b integer prefixes.
   OCaml's float_of_string additionally accepts '_' separators and
   inf/nan spellings that Number rejects, so gate those out. Input must
   already be trimmed of whitespace. *)
let js_number_of_string (s : string) : float option =
  if s = "" then Some 0.
  else if String.contains s '_' then None
  else
    match s with
    | "Infinity" | "+Infinity" -> Some Float.infinity
    | "-Infinity" -> Some Float.neg_infinity
    | _ ->
        let n = String.length s in
        let radix_digits base s =
          let ok =
            s <> ""
            && String.for_all
                 (fun c ->
                   match base with
                   | 16 ->
                       (c >= '0' && c <= '9')
                       || (c >= 'a' && c <= 'f')
                       || (c >= 'A' && c <= 'F')
                   | 8 -> c >= '0' && c <= '7'
                   | _ -> c = '0' || c = '1')
                 s
          in
          if ok then
            let acc =
              String.fold_left
                (fun acc c ->
                  let d =
                    if c >= '0' && c <= '9' then Char.code c - Char.code '0'
                    else if c >= 'a' && c <= 'f' then
                      Char.code c - Char.code 'a' + 10
                    else Char.code c - Char.code 'A' + 10
                  in
                  acc *. float_of_int base +. float_of_int d)
                0. s
            in
            Some acc
          else None
        in
        if
          n > 2 && s.[0] = '0'
          && (s.[1] = 'x' || s.[1] = 'X' || s.[1] = 'o' || s.[1] = 'O'
             || s.[1] = 'b' || s.[1] = 'B')
        then
          let base =
            match s.[1] with
            | 'x' | 'X' -> 16
            | 'o' | 'O' -> 8
            | _ -> 2
          in
          radix_digits base (String.sub s 2 (n - 2))
        else
          (* reject OCaml-only spellings that Number returns NaN for *)
          let signless =
            if n > 0 && (s.[0] = '+' || s.[0] = '-') then
              String.sub s 1 (n - 1)
            else s
          in
          let lowered = String.lowercase_ascii signless in
          if
            lowered = "inf" || lowered = "infinity" || lowered = "nan"
          then None
          else if
            (* a sign before 0x/0o/0b is NaN in JS, accepted in OCaml *)
            signless <> s
            && String.length signless > 2
            && signless.[0] = '0'
            && (signless.[1] = 'x' || signless.[1] = 'o'
               || signless.[1] = 'b')
          then None
          else float_of_string_opt s

(* js/parseInt — leading JS whitespace skipped, optional sign, then the
   longest valid digit prefix. With ~radix:0 (default, matching cljs
   parse-long/parse-int's bare js/parseInt) a "0x"/"0X" prefix selects
   base 16, otherwise base 10; an explicit ~radix uses that base and
   (for 16 only) also strips a leading "0x". Returns NaN as [None]. *)
let parse_long ?(radix = 0) (s0 : string) : int option =
  let n0 = String.length s0 in
  let i0 = ref 0 in
  while
    !i0 < n0
    && (match s0.[!i0] with
        | ' ' | '\t' | '\n' | '\r' | '\011' | '\012' -> true
        | _ -> false)
  do incr i0 done;
  let s = String.sub s0 !i0 (n0 - !i0) in
  let n = String.length s in
  let neg, s, n =
    if n > 0 && (s.[0] = '+' || s.[0] = '-') then
      (s.[0] = '-', String.sub s 1 (n - 1), n - 1)
    else (false, s, n)
  in
  let base, s, n =
    if (radix = 0 || radix = 16) && n > 2 && s.[0] = '0'
       && (s.[1] = 'x' || s.[1] = 'X')
    then (16, String.sub s 2 (n - 2), n - 2)
    else ((if radix = 0 then 10 else radix), s, n)
  in
  let digit c =
    let d =
      if c >= '0' && c <= '9' then Char.code c - Char.code '0'
      else if c >= 'a' && c <= 'z' then Char.code c - Char.code 'a' + 10
      else if c >= 'A' && c <= 'Z' then Char.code c - Char.code 'A' + 10
      else 99
    in
    if d < base then Some d else None
  in
  let i = ref 0 and acc = ref 0 in
  while
    !i < n && (match digit s.[!i] with Some _ -> true | None -> false)
  do
    acc := !acc * base + Option.get (digit s.[!i]);
    incr i
  done;
  if !i = 0 then None else Some (if neg then - !acc else !acc)

(* js (str f) on a double — ECMAScript Number::toString: the shortest
   digit sequence that round-trips, in fixed notation for
   1e-6 <= |x| < 1e21 and scientific "d[.ddd]e±n" otherwise. Integers
   print without a decimal point, -0 prints "0". *)
let js_string_of_float (f : float) : string =
  if Float.is_nan f then "NaN"
  else if f = Float.infinity then "Infinity"
  else if f = Float.neg_infinity then "-Infinity"
  else if f = 0. then "0"
  else
    (* shortest %.*e precision that round-trips *)
    let rec find_p p =
      if p > 17 then 17
      else
        let s = Printf.sprintf "%.*e" (p - 1) f in
        if float_of_string s = f then p else find_p (p + 1)
    in
    let sci = Printf.sprintf "%.*e" (find_p 1 - 1) f in
    let epos = String.index sci 'e' in
    let mant = String.sub sci 0 epos in
    let exp =
      int_of_string (String.sub sci (epos + 1) (String.length sci - epos - 1))
    in
    let neg = mant.[0] = '-' in
    let m = if neg then String.sub mant 1 (String.length mant - 1) else mant in
    let digits = String.concat "" (String.split_on_char '.' m) in
    let k = String.length digits in
    let sign = if neg then "-" else "" in
    if exp >= -6 && exp < 21 then
      if exp >= k - 1 then sign ^ digits ^ String.make (exp - k + 1) '0'
      else if exp >= 0 then
        sign ^ String.sub digits 0 (exp + 1) ^ "."
        ^ String.sub digits (exp + 1) (k - exp - 1)
      else sign ^ "0." ^ String.make (-exp - 1) '0' ^ digits
    else
      let m2 =
        if k = 1 then digits
        else String.sub digits 0 1 ^ "." ^ String.sub digits 1 (k - 1)
      in
      Printf.sprintf "%s%s%s%d" sign m2
        (if exp < 0 then "e-" else "e+") (abs exp)

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
    List.map Unicode.trim (loop [ first ] first others)

(* cljs #"(?i)%[0-9a-f]{2}" *)
let url_encoded_pattern = Regexp.compile ~caseless:true "%[0-9a-f]{2}"

let page_name_sanity (s : string) : string = Ldb.page_name_sanity s
let page_name_sanity_lc (s : string) : string = Ldb.page_name_sanity_lc s
let safe_page_name_sanity_lc (s : string) : string = page_name_sanity_lc s

(* common-util/capitalize-all *)
let capitalize_all (s : string) : string =
  String.split_on_char ' ' s
  |> List.map (fun w ->
         if w = "" then w
         else Unicode.capitalize w)
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
     | Some ext -> normalize_format (Unicode.lowercase ext)
     | None -> "")

(* common-util/get-file-ext *)
let get_file_ext (file : string) : string option =
  if String.contains file '.' then
    Option.map Unicode.lowercase (path_to_file_ext file)
  else None

(* common-util/uuid-string? *)
let uuid_pattern = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
(* cljs exactly-uuid-pattern = re-pattern "(?i)^uuid$" *)
let uuid_string_re =
  Regexp.compile ~caseless:true ("^" ^ uuid_pattern ^ "$")

let uuid_string (s : string) : bool = Regexp.test uuid_string_re s

(* ---- json->clj ---- *)

let rec value_of_wire (w : Wire.t) : value =
  match w with
  | Wire.Nil -> Nil
  | Wire.Bool b -> Bool b
  | Wire.String s -> String s
  | Wire.Int n -> Int n
  | Wire.Int64 n ->
      if Int64.abs n <= Int64.of_int max_int then Int (Int64.to_int n)
      else Instant n
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
  regex_replace (Regexp.compile ~caseless:true ("" ^ escape_regex_chars old_value)) ~replacement:new_value s

(* common-util/clear-markdown-heading *)
let markdown_heading_pattern = Regexp.compile "^#+\\s+"

let clear_markdown_heading (content : string) : string =
  regex_replace_first markdown_heading_pattern ~replacement:"" content

(* Fun.protect for runtimes without backtrace support (Melange): the
   stdlib version restores the raise backtrace via a primitive that is
   not polyfilled there, which would replace the work exception with the
   polyfill error. Same semantics minus backtrace preservation. *)
let protect ~(finally : unit -> unit) (work : unit -> 'a) : 'a =
  let finally_no_exn () =
    try finally () with e -> raise (Fun.Finally_raised e)
  in
  match work () with
  | result ->
      finally_no_exn ();
      result
  | exception work_exn ->
      finally_no_exn ();
      raise work_exn
