(* Native Transit JSON codec.

   Copied from melange-transit-native 0.1.2 (lib/native/transit.ml,
   RCmerci/melange-transit) with fixes to the read/write cache handling so
   Normal-mode roundtrips match transit-js semantics:

   - key_string now caches every >3-char map key (~u, ~i, ~d, ~m, ~n, ~f,
     ~b, ~r, escaped strings), not just ~:/~$/plain strings. The reader
     caches every >3-char map key, so skipping them on write desynced all
     subsequent ^N cache references.
   - Float map keys encode as ~d (transit-js emitDouble), not ~i.
   - decode_tagged_string no longer treats "^ " (the array-map marker) as a
     cache reference.
   - decode_map_key only resolves ^N refs of length <= 3; longer ^-keys are
     literal strings (transit-js isCacheable ordering).
   - Edn conversion helpers from the upstream module are omitted here; the
     worker only needs of_string/to_string. *)

include Transit_core.Json
open Internal

let max_safe_integer = 9_007_199_254_740_991L
let min_safe_integer = Int64.neg max_safe_integer
let min_ocaml_int = Int64.of_int min_int
let max_ocaml_int = Int64.of_int max_int
let min_transit_int_number = -2_147_483_648.
let max_transit_int_number = 2_147_483_647.

type cache = {
  values : (string, int) Hashtbl.t;
  mutable next_index : int;
}

type write_context = {
  mode : mode;
  cache : cache;
}

type cached =
  | Cached_value of value
  | Cached_tag of string

type read_context = {
  cache : (int, cached) Hashtbl.t;
  mutable next_cache_index : int;
}

let make_cache () = { values = Hashtbl.create 16; next_index = 0 }
let make_write_context mode = { mode; cache = make_cache () }
let make_read_context () =
  { cache = Hashtbl.create 16; next_cache_index = 0 }

let max_cache_entries = 44 * 44

let base44_digits =
  "0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ["

let rec base44_encode index =
  let digit = base44_digits.[index mod 44] in
  let rest = index / 44 in
  if rest = 0 then String.make 1 digit else base44_encode rest ^ String.make 1 digit

let base44_decode text =
  let value_of_char char =
    let rec loop index =
      if index = String.length base44_digits then
        decode_error ("invalid Transit cache code: " ^ text)
      else if Char.equal base44_digits.[index] char then index
      else loop (index + 1)
    in
    loop 0
  in
  let value = ref 0 in
  String.iter
    (fun char -> value := (!value * 44) + value_of_char char)
    text;
  !value

let cacheable_token text =
  String.length text > 3
  &&
  match text.[0], text.[1] with
  | '~', (':' | '$') -> true
  | _ -> false

let cacheable_any text = String.length text > 3

let write_cache_any context text =
  if context.mode = Verbose || not (cacheable_any text) then text
  else (
    if context.cache.next_index = max_cache_entries then (
      Hashtbl.clear context.cache.values;
      context.cache.next_index <- 0);
    match Hashtbl.find_opt context.cache.values text with
    | Some index -> "^" ^ base44_encode index
    | None ->
        let index = context.cache.next_index in
        context.cache.next_index <- index + 1;
        Hashtbl.add context.cache.values text index;
        text)

let write_cache_token context text =
  if cacheable_token text then write_cache_any context text else text

let add_read_cache_entry context entry =
  if context.next_cache_index = max_cache_entries then
    context.next_cache_index <- 0;
  Hashtbl.replace context.cache context.next_cache_index entry;
  context.next_cache_index <- context.next_cache_index + 1

let read_cache_value context text value =
  if cacheable_any text then add_read_cache_entry context (Cached_value value);
  value

let read_cache_tag context text =
  if cacheable_any text then add_read_cache_entry context (Cached_tag text);
  text

let escaped_string text =
  if String.length text = 0 then text
  else
    match text.[0] with
    | '~' | '^' | '`' -> "~" ^ text
    | _ -> text

let base64_decode text =
  let value = function
    | 'A' .. 'Z' as char -> Char.code char - Char.code 'A'
    | 'a' .. 'z' as char -> Char.code char - Char.code 'a' + 26
    | '0' .. '9' as char -> Char.code char - Char.code '0' + 52
    | '+' -> 62
    | '/' -> 63
    | char -> decode_error (Printf.sprintf "invalid base64 character: %C" char)
  in
  let len = String.length text in
  if len mod 4 <> 0 then decode_error "invalid base64 length";
  let output = Buffer.create ((len / 4) * 3) in
  let rec loop offset =
    if offset < len then (
      let c0 = value text.[offset] in
      let c1 = value text.[offset + 1] in
      let has_c2 = not (Char.equal text.[offset + 2] '=') in
      let has_c3 = not (Char.equal text.[offset + 3] '=') in
      let c2 = if has_c2 then value text.[offset + 2] else 0 in
      let c3 = if has_c3 then value text.[offset + 3] else 0 in
      Buffer.add_char output (Char.chr ((c0 lsl 2) lor (c1 lsr 4)));
      if has_c2 then
        Buffer.add_char output
          (Char.chr (((c1 land 0x0f) lsl 4) lor (c2 lsr 2)));
      if has_c3 then
        Buffer.add_char output
          (Char.chr (((c2 land 0x03) lsl 6) lor c3));
      loop (offset + 4))
  in
  loop 0;
  Buffer.contents output

let iso_of_milliseconds milliseconds =
  let seconds = Int64.to_float milliseconds /. 1000. in
  match Ptime.of_float_s seconds with
  | None -> decode_error ("invalid Transit date: " ^ Int64.to_string milliseconds)
  | Some time ->
      let (year, month, day), ((hour, minute, second), _tz) =
        Ptime.to_date_time time
      in
      let millisecond =
        Int64.(to_int (rem (abs milliseconds) 1000L))
      in
      Printf.sprintf "%04d-%02d-%02dT%02d:%02d:%02d.%03dZ" year month day
        hour minute second millisecond

let milliseconds_of_iso text =
  match Ptime.of_rfc3339 text with
  | Error _ -> decode_error ("invalid Transit date: " ^ text)
  | Ok (time, _tz_offset, _tz_count) ->
      let seconds = Ptime.to_float_s time in
      Int64.of_float (Float.round (seconds *. 1000.))

let int64_is_safe_integer value =
  Int64.compare value min_safe_integer >= 0
  && Int64.compare value max_safe_integer <= 0

let json_int64 value =
  if
    Int64.compare value min_ocaml_int >= 0
    && Int64.compare value max_ocaml_int <= 0
  then `Int (Int64.to_int value)
  else `Intlit (Int64.to_string value)

let int64_json value =
  if int64_is_safe_integer value then json_int64 value
  else `String ("~i" ^ Int64.to_string value)

let number_value value =
  match classify_float value with
  | FP_normal | FP_subnormal | FP_zero when Float.equal value (floor value) ->
      if value >= min_transit_int_number && value <= max_transit_int_number then
        Int (int_of_float value)
      else (
        let int64 = Int64.of_float value in
        if Float.equal (Int64.to_float int64) value then Int64 int64
        else Float value)
  | FP_normal | FP_subnormal | FP_zero | FP_nan | FP_infinite -> Float value

let dedupe_entries entries =
  let replace key value =
    List.map (fun (existing_key, existing_value) ->
        if existing_key = key then (existing_key, value)
        else (existing_key, existing_value))
  in
  List.fold_left
    (fun acc (key, value) ->
      if List.exists (fun (existing_key, _) -> existing_key = key) acc then
        replace key value acc
      else acc @ [ (key, value) ])
    [] entries

let key_string context value =
  let raw =
    match value with
    | Null -> "~_"
    | Bool true -> "~?t"
    | Bool false -> "~?f"
    | String text -> escaped_string text
    | Int value -> "~i" ^ string_of_int value
    | Int64 value -> "~i" ^ Int64.to_string value
    | Float value -> "~d" ^ Yojson.Safe.to_string (`Float value)
    | Binary text -> "~b" ^ base64_encode text
    | Keyword text -> "~:" ^ text
    | Symbol text -> "~$" ^ text
    | Big_decimal text -> "~f" ^ text
    | Big_int text -> "~n" ^ text
    | Date milliseconds ->
        (match context.mode with
        | Normal -> "~m" ^ Int64.to_string milliseconds
        | Verbose -> "~t" ^ iso_of_milliseconds milliseconds)
    | Uuid text -> "~u" ^ text
    | Uri text -> "~r" ^ text
    | Array _ | Map _ | Set _ | List _ | Tagged _ -> ""
  in
  match value with
  | Array _ | Map _ | Set _ | List _ | Tagged _ -> None
  | _ -> Some (write_cache_any context raw)

let stringable_key = function
  | Array _ | Map _ | Set _ | List _ | Tagged _ -> false
  | Null | Bool _ | String _ | Int _ | Int64 _ | Float _ | Binary _ | Keyword _
  | Symbol _ | Big_decimal _ | Big_int _ | Date _ | Uuid _ | Uri _ ->
      true

let rec yojson_of_value context = function
  | Null -> `Null
  | Bool value -> `Bool value
  | String text -> `String (escaped_string text)
  | Int value -> `Int value
  | Int64 value -> int64_json value
  | Float value -> `Float value
  | Binary text -> `String ("~b" ^ base64_encode text)
  | Keyword text -> `String (write_cache_token context ("~:" ^ text))
  | Symbol text -> `String (write_cache_token context ("~$" ^ text))
  | Big_decimal text -> `String ("~f" ^ text)
  | Big_int text -> `String ("~n" ^ text)
  | Date milliseconds ->
      `String
        (match context.mode with
        | Normal -> "~m" ^ Int64.to_string milliseconds
        | Verbose -> "~t" ^ iso_of_milliseconds milliseconds)
  | Uuid text -> `String ("~u" ^ text)
  | Uri text -> `String ("~r" ^ text)
  | Array values -> `List (List.map (yojson_of_value context) values)
  | Map entries -> yojson_of_map context entries
  | Set values ->
      let tag = write_cache_any context "~#set" in
      let values = `List (List.map (yojson_of_value context) values) in
      if context.mode = Verbose then `Assoc [ ("~#set", values) ]
      else `List [ `String tag; values ]
  | List values ->
      let tag = write_cache_any context "~#list" in
      let values = `List (List.map (yojson_of_value context) values) in
      if context.mode = Verbose then `Assoc [ ("~#list", values) ]
      else `List [ `String tag; values ]
  | Tagged (tag, value) ->
      let tag = "~#" ^ tag in
      let cached_tag = write_cache_any context tag in
      if context.mode = Verbose then `Assoc [ (tag, yojson_of_value context value) ]
      else `List [ `String cached_tag; yojson_of_value context value ]

and yojson_of_map context entries =
  let entries = dedupe_entries entries in
  if not (List.for_all (fun (key, _) -> stringable_key key) entries) then
    let tag = write_cache_any context "~#cmap" in
      `List
        [
          `String tag;
          `List
            (List.concat_map
               (fun (key, value) ->
                 let key = yojson_of_value context key in
                 let value = yojson_of_value context value in
                 [ key; value ])
               entries);
        ]
  else
    if context.mode = Verbose then
      `Assoc
        (List.map
           (fun (key, value) ->
             match key_string context key with
             | Some key -> (key, yojson_of_value context value)
             | None -> assert false)
           entries)
    else
      let rec fields = function
        | [] -> []
        | (key, value) :: rest -> (
            match key_string context key with
            | Some key ->
                let value = yojson_of_value context value in
                let rest = fields rest in
                `String key :: value :: rest
            | None -> assert false)
      in
        `List
          (`String "^ " :: fields entries)

let is_ground = function
  | Null | Bool _ | String _ | Int _ | Int64 _ | Float _ | Binary _ | Keyword _
  | Symbol _ | Big_decimal _ | Big_int _ | Date _ | Uuid _ | Uri _ ->
      true
  | Array _ | Map _ | Set _ | List _ | Tagged _ -> false

let yojson_root ?(mode = Normal) value =
  let context = make_write_context mode in
  if is_ground value then
    let value = yojson_of_value context value in
    match mode with
    | Normal -> `List [ `String "~#'"; value ]
    | Verbose -> `Assoc [ ("~#'", value) ]
  else yojson_of_value context value

let to_string ?mode value = value |> yojson_root ?mode |> Yojson.Safe.to_string

let decode_cache_ref context text =
  let index_text = String.sub text 1 (String.length text - 1) in
  let index = base44_decode index_text in
  match Hashtbl.find_opt context.cache index with
  | Some (Cached_value value) -> value
  | Some (Cached_tag tag) -> String tag
  | None -> decode_error ("unknown Transit cache code: " ^ text)

let decode_cache_tag_ref context text =
  let index_text = String.sub text 1 (String.length text - 1) in
  let index = base44_decode index_text in
  match Hashtbl.find_opt context.cache index with
  | Some (Cached_tag tag) -> Some tag
  | Some (Cached_value _) -> None
  | None -> decode_error ("unknown Transit cache code: " ^ text)

let decode_tagged_string ?(cache_token = true) context text =
  let len = String.length text in
  if len = 0 then String text
  else if
    Char.equal text.[0] '^'
    && len > 1
    && not (Char.equal text.[1] ' ')
  then decode_cache_ref context text
  else if not (Char.equal text.[0] '~') then String text
  else if len = 1 then decode_error "invalid Transit escape"
  else
    let rep = String.sub text 2 (len - 2) in
    match text.[1] with
    | '~' | '^' | '`' -> String (String.sub text 1 (len - 1))
    | '_' -> Null
    | '?' -> (
        match rep with
        | "t" -> Bool true
        | "f" -> Bool false
        | _ -> decode_error ("invalid Transit boolean: " ^ text))
    | ':' ->
        if cache_token then read_cache_value context text (Keyword rep)
        else Keyword rep
    | '$' ->
        if cache_token then read_cache_value context text (Symbol rep)
        else Symbol rep
    | 'i' -> transit_int rep
    | 'n' -> Big_int rep
    | 'f' -> Big_decimal rep
    | 'd' -> (
        match float_of_string_opt rep with
        | Some value -> Float value
        | None -> decode_error ("invalid Transit double: " ^ text))
    | 'b' -> Binary (base64_decode rep)
    | 'm' -> (
        match Int64.of_string_opt rep with
        | Some milliseconds -> Date milliseconds
        | None -> decode_error ("invalid Transit date: " ^ text))
    | 't' -> Date (milliseconds_of_iso rep)
    | 'u' -> Uuid rep
    | 'r' -> Uri rep
    | 'c' -> String rep
    | _ -> decode_error ("unsupported Transit tag: " ^ text)

let rec value_of_yojson context = function
  | `Null -> Null
  | `Bool value -> Bool value
  | `Int value -> number_value (Float.of_int value)
  | `Intlit value -> transit_int value
  | `Float value -> number_value value
  | `String text -> decode_tagged_string context text
  | `List values -> value_of_array context values
  | `Assoc [ (tag, value) ]
    when String.length tag > 2
         && Char.equal tag.[0] '~'
         && Char.equal tag.[1] '#' ->
      verbose_tagged_value context tag value
  | `Assoc entries ->
      Map
        (List.map
           (fun (key, value) ->
             let key = decode_map_key context key in
             let value = value_of_yojson context value in
             (key, value))
           entries)
  | `Tuple _ | `Variant _ ->
      decode_error "Transit JSON must be standard JSON"

and value_of_array context = function
  | [ `String "~#'"; value ] -> value_of_yojson context value
  | `String "^ " :: values -> map_of_string_key_flat_array context values
  | [ `String raw_tag; value ] -> (
      match array_tag context raw_tag with
      | Some tag -> tagged_array_value context tag value
      | None ->
          let first = value_of_yojson context (`String raw_tag) in
          let second = value_of_yojson context value in
          Array [ first; second ])
  | values -> Array (List.map (value_of_yojson context) values)

and tagged_array_value context tag value =
  match tag, value with
  | "~#set", `List values -> Set (List.map (value_of_yojson context) values)
  | "~#list", `List values -> List (List.map (value_of_yojson context) values)
  | "~#cmap", `List values -> map_of_flat_array context values
  | _ ->
      Tagged (String.sub tag 2 (String.length tag - 2), value_of_yojson context value)

and map_of_flat_array context values =
  let rec loop acc = function
    | [] -> Map (List.rev acc)
    | key :: value :: rest ->
        let key = value_of_yojson context key in
        let value = value_of_yojson context value in
        loop ((key, value) :: acc) rest
    | [ _ ] -> decode_error "Transit map expects an even number of entries"
  in
  loop [] values

and map_of_string_key_flat_array context values =
  let rec loop acc = function
    | [] -> Map (List.rev acc)
    | `String key :: value :: rest ->
        let key = decode_map_key context key in
        let value = value_of_yojson context value in
        loop ((key, value) :: acc) rest
    | key :: value :: rest ->
        let key = value_of_yojson context key in
        let value = value_of_yojson context value in
        loop ((key, value) :: acc) rest
    | [ _ ] -> decode_error "Transit map expects an even number of entries"
  in
  loop [] values

and array_tag context tag =
  if String.length tag > 1 && Char.equal tag.[0] '^' then
    decode_cache_tag_ref context tag
  else if
    String.length tag > 2
    && Char.equal tag.[0] '~'
    && Char.equal tag.[1] '#'
  then Some (read_cache_tag context tag)
  else None

and decode_map_key context key =
  let len = String.length key in
  if
    len > 1
    && len <= 3
    && Char.equal key.[0] '^'
    && not (Char.equal key.[1] ' ')
  then decode_cache_ref context key
  else if Char.equal key.[0] '^' then
    (* a >3-char key starting with '^' is a literal string key, not a
       cache reference (transit-js: isCacheable wins over isCacheCode
       for map keys) *)
    read_cache_value context key (String key)
  else
    let value = decode_tagged_string ~cache_token:false context key in
    read_cache_value context key value

and verbose_tagged_value context tag value =
  match tag, value with
  | "~#'", value -> value_of_yojson context value
  | "~#set", `List values -> Set (List.map (value_of_yojson context) values)
  | "~#list", `List values -> List (List.map (value_of_yojson context) values)
  | "~#cmap", `List values -> map_of_flat_array context values
  | _ when String.length tag > 2 ->
      Tagged (String.sub tag 2 (String.length tag - 2), value_of_yojson context value)
  | _ -> decode_error ("invalid Transit verbose tag: " ^ tag)

let of_string text =
  protect_decode (fun () ->
      text |> Yojson.Safe.from_string |> value_of_yojson (make_read_context ()))
