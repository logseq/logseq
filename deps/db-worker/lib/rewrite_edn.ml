(* Minimal whitespace-preserving port of borkdude.rewrite-edn `dissoc` for
   the config.edn path: removes top-level key/value pairs from an EDN map
   string while keeping the rest of the text verbatim. Raises
   [Invalid_argument] when the input is not a readable top-level map, like
   rewrite/parse-string failing. *)

exception Invalid of string

let is_ws c = c = ' ' || c = '\t' || c = '\n' || c = '\r' || c = ','

(* scan one EDN node starting at index i; returns index just past it *)
let rec scan_node (s : string) (i : int) : int =
  let n = String.length s in
  if i >= n then raise (Invalid "eof")
  else
    match s.[i] with
    | c when is_ws c -> scan_node s (i + 1)
    | ';' ->
      (* line comment *)
      let rec go j = if j < n && s.[j] <> '\n' then go (j + 1) else j in
      scan_node s (go i)
    | '#' ->
      if i + 1 < n && s.[i + 1] = '_' then
        (* discard next form *)
        let j = scan_node s (i + 2) in
        j
      else if i + 1 < n && s.[i + 1] = '{' then scan_balanced s (i + 1) '{' '}'
      else if i + 1 < n && s.[i + 1] = '"' then scan_string s (i + 1)
      else if i + 1 < n && (s.[i + 1] = ':' || s.[i + 1] = '?') then
        (* tagged literal: tag + form *)
        let j = scan_atom s (i + 2) in
        scan_node s j
      else scan_atom s (i + 1)
    | '\'' | '`' | '~' | '@' | '^' -> scan_node s (i + 1)
    | '(' -> scan_balanced s (i + 1) '(' ')'
    | '[' -> scan_balanced s (i + 1) '[' ']'
    | '{' -> scan_balanced s (i + 1) '{' '}'
    | '"' -> scan_string s i
    | '\\' -> if i + 1 < n then i + 2 else raise (Invalid "bad char")
    | _ -> scan_atom s i

and scan_atom s i =
  let n = String.length s in
  let rec go j =
    if j < n
       && not (is_ws s.[j])
       && not
            (List.mem s.[j]
               [ '('; ')'; '['; ']'; '{'; '}'; '"'; ';'; '\''; '`'; '~'; '@'; '^' ])
    then go (j + 1)
    else j
  in
  let j = go i in
  if j = i then raise (Invalid "empty atom") else j

and scan_string s i =
  let n = String.length s in
  let rec go j =
    if j >= n then raise (Invalid "unterminated string")
    else if s.[j] = '\\' then go (j + 2)
    else if s.[j] = '"' then j + 1
    else go (j + 1)
  in
  go (i + 1)

and scan_balanced s i open_c close_c =
  let n = String.length s in
  let rec go j =
    if j >= n then raise (Invalid "unbalanced")
    else if s.[j] = open_c then go (scan_balanced s (j + 1) open_c close_c)
    else if s.[j] = close_c then j + 1
    else go (scan_node s j)
  in
  go i

let skip_ws s i =
  let n = String.length s in
  let rec go j =
    if j < n && (is_ws s.[j] || s.[j] = ';') then
      if s.[j] = ';' then
        let rec eol k = if k < n && s.[k] <> '\n' then eol (k + 1) else k in
        go (eol j)
      else go (j + 1)
    else j
  in
  go i

(* read a top-level map node returning [(key-string, key-end, val-end)] with
   spans covering key+separating ws+value *)
let parse_top_map (s : string) : (string * int * int) list =
  let n = String.length s in
  let i0 = skip_ws s 0 in
  if i0 >= n || s.[i0] <> '{' then raise (Invalid "not a map");
  let rec loop i acc =
    let i = skip_ws s i in
    if i >= n then raise (Invalid "eof in map")
    else if s.[i] = '}' then List.rev acc
    else
      let key_start = i in
      let key_end = scan_node s i in
      let key_str = String.sub s key_start (key_end - key_start) in
      let i' = skip_ws s key_end in
      let val_end = scan_node s i' in
      loop val_end ((key_str, key_start, val_end) :: acc)
  in
  loop (i0 + 1) []

(* rewrite/dissoc — remove each key's top-level entry (plus its preceding
   whitespace) keeping the rest of the string verbatim. *)
let dissoc (s : string) (key : string) : string =
  ignore (parse_top_map s);
  let n = String.length s in
  let i0 = skip_ws s 0 in
  (* find span [kstart, vend) of the first top-level entry whose key
     matches, including whitespace before the key *)
  let rec loop i prev_ws =
    let i = skip_ws s i in
    if i >= n then raise (Invalid "eof in map")
    else if s.[i] = '}' then None
    else
      let key_start = i in
      let key_end = scan_node s i in
      let key_str = String.sub s key_start (key_end - key_start) in
      let i' = skip_ws s key_end in
      let val_end = scan_node s i' in
      let kl =
        if String.length key_str > 0 && key_str.[0] = ':' then
          String.sub key_str 1 (String.length key_str - 1)
        else key_str
      in
      if kl = key then Some (prev_ws, val_end)
      else loop val_end key_start
  in
  match loop (i0 + 1) (i0 + 1) with
  | None -> s
  | Some (wstart, vend) ->
    String.sub s 0 wstart ^ String.sub s vend (n - vend)

let dissoc_many (s : string) (keys : string list) : string =
  List.fold_left dissoc s keys

(* rewrite/assoc — replace a top-level key's value, or append a new
   key/value pair before the closing '}', preserving other whitespace
   verbatim. [key] is the bare keyword name (no ':'), [value_text] is
   printed EDN. *)
let assoc (s : string) (key : string) (value_text : string) : string =
  ignore (parse_top_map s);
  let n = String.length s in
  let i0 = skip_ws s 0 in
  let rec loop i =
    let i = skip_ws s i in
    if i >= n then raise (Invalid "eof in map")
    else if s.[i] = '}' then None
    else
      let key_start = i in
      let key_end = scan_node s i in
      let key_str = String.sub s key_start (key_end - key_start) in
      let i' = skip_ws s key_end in
      let val_end = scan_node s i' in
      let kl =
        if String.length key_str > 0 && key_str.[0] = ':' then
          String.sub key_str 1 (String.length key_str - 1)
        else key_str
      in
      if kl = key then Some (i', val_end) else loop val_end
  in
  match loop (i0 + 1) with
  | Some (vstart, vend) ->
      String.sub s 0 vstart ^ value_text ^ String.sub s vend (n - vend)
  | None ->
      let close = String.rindex s '}' in
      String.sub s 0 close
      ^ " :" ^ key ^ " " ^ value_text
      ^ String.sub s close (n - close)
