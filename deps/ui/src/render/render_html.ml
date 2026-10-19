(* @@html: fragment parser — parses a small HTML fragment ("<div
   id='x'>text</div>") into LUI elements. Unbalanced input renders as a
   literal text node so nothing is lost (cljs renders through an html
   template too). *)

open Lui_elements
module D = Logseq_el

type node =
  | Text of string
  | Elem of string * (string * string) list * node list

let is_ws c = c = ' ' || c = '\t' || c = '\n' || c = '\r'
let is_name_char c =
  (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
  || (c >= '0' && c <= '9') || c = '-' || c = '_' || c = ':' || c = '.'

let skip_ws s i n =
  let rec go i = if i < n && is_ws s.[i] then go (i + 1) else i in
  go i

let read_name s i n =
  let rec go i = if i < n && is_name_char s.[i] then go (i + 1) else i in
  let j = go i in
  (String.sub s i (j - i), j)

(* attrs until '>' or '/>' *)
let read_attrs s i n =
  let rec loop i acc =
    let i = skip_ws s i n in
    if i >= n || s.[i] = '>' || (s.[i] = '/' && i + 1 < n && s.[i + 1] = '>')
    then (List.rev acc, i)
    else
      let name, i = read_name s i n in
      if name = "" then (List.rev acc, n)
      else
        let i = skip_ws s i n in
        if i < n && s.[i] = '=' then
          let i = skip_ws s (i + 1) n in
          if i < n && (s.[i] = '"' || s.[i] = '\'') then
            let q = s.[i] in
            let j =
              let rec find j =
                if j >= n then n else if s.[j] = q then j else find (j + 1)
              in
              find (i + 1)
            in
            loop (j + 1) ((name, String.sub s (i + 1) (j - i - 1)) :: acc)
          else
            let v, i = read_name s i n in
            loop i ((name, v) :: acc)
        else loop i ((name, "") :: acc)
  in
  loop i []

let void_tag = function
  | "area" | "base" | "br" | "col" | "embed" | "hr" | "img"
  | "input" | "link" | "meta" | "param" | "source" | "track" | "wbr" -> true
  | _ -> false

let rec parse_nodes s i n acc =
  if i >= n then (List.rev acc, i)
  else if starts_closing s i n then (List.rev acc, i)
  else if s.[i] = '<' then
    let j = skip_ws s (i + 1) n in
    if j < n && s.[j] = '!' then
      (* comment / doctype: skip to '>' *)
      let rec find k = if k >= n then n else if s.[k] = '>' then k + 1 else find (k + 1) in
      parse_nodes s (find j) n acc
    else
      let tag, k = read_name s j n in
      if tag = "" then parse_nodes s (i + 1) n acc
      else
        let tag = String.lowercase_ascii tag in
        let attrs, k = read_attrs s k n in
        if k >= n then (List.rev (Elem (tag, attrs, []) :: acc), n)
        else if s.[k] = '/' then
          parse_nodes s (min n (k + 2)) n (Elem (tag, attrs, []) :: acc)
        else if void_tag tag then
          parse_nodes s (k + 1) n (Elem (tag, attrs, []) :: acc)
        else
          let kids, k2 = parse_nodes s (k + 1) n [] in
          (* skip </tag> *)
          let k3 =
            if starts_closing s k2 n then
              let _, e = read_name s (skip_ws s (k2 + 2) n) n in
              let rec find x = if x >= n then n else if s.[x] = '>' then x + 1 else find (x + 1) in
              find e
            else k2
          in
          parse_nodes s k3 n (Elem (tag, attrs, kids) :: acc)
  else
    let j =
      let rec find j = if j >= n || s.[j] = '<' then j else find (j + 1) in
      find i
    in
    parse_nodes s j n (Text (String.sub s i (j - i)) :: acc)

and starts_closing s i n =
  i + 1 < n && s.[i] = '<' && s.[i + 1] = '/'

let numeric_entity entity =
  let n = String.length entity in
  if n < 2 || entity.[0] <> '#' then None else
  let base, start =
    if n > 2 && (entity.[1] = 'x' || entity.[1] = 'X') then 16, 2 else 10, 1 in
  let rec parse i value =
    if i = n then
      if value <> 0 && Uchar.is_valid value then Some value else None
    else
      let digit = match entity.[i] with
        | '0' .. '9' as c -> Char.code c - Char.code '0'
        | 'a' .. 'f' as c -> Char.code c - Char.code 'a' + 10
        | 'A' .. 'F' as c -> Char.code c - Char.code 'A' + 10
        | _ -> -1 in
      if digit < 0 || digit >= base || value > (0x10FFFF - digit) / base then None
      else parse (i + 1) (value * base + digit)
  in
  if start = n then None else parse start 0

let add_scalar buffer codepoint =
  match Sys.backend_type with
  | Native | Bytecode -> Buffer.add_utf_8_uchar buffer (Uchar.of_int codepoint)
  | Other "Melange" ->
      if codepoint <= 0xFFFF then Buffer.add_char buffer (Char.unsafe_chr codepoint)
      else begin
        Buffer.add_char buffer (Char.unsafe_chr (0xD800 + ((codepoint - 0x10000) lsr 10)));
        Buffer.add_char buffer (Char.unsafe_chr (0xDC00 + ((codepoint - 0x10000) land 0x3FF)))
      end
  | Other backend -> invalid_arg ("HTML: unsupported text backend " ^ backend)

let rec el_of_node = function
  | Text s ->
      if String.trim s = "" then [] else [ D.txt (decode_entities s) ]
  | Elem (tag, attrs, kids) ->
      (* TODO(component): @@html parses arbitrary tags/attrs — no
         fixed component kind maps a parsed fragment *)
      [ D.el ~tag ~attrs (List.concat_map el_of_node kids) ]

and decode_entities s =
  let b = Buffer.create (String.length s) in
  let n = String.length s in
  let add_entity entity =
    match entity with
    | "amp" -> Buffer.add_char b '&'; true
    | "lt" -> Buffer.add_char b '<'; true
    | "gt" -> Buffer.add_char b '>'; true
    | "quot" -> Buffer.add_char b '"'; true
    | "apos" -> Buffer.add_char b '\''; true
    | "nbsp" -> add_scalar b 0xA0; true
    | _ -> match numeric_entity entity with
      | Some codepoint -> add_scalar b codepoint; true
      | None -> false
  in
  let rec go i =
    if i < n then begin
      if s.[i] = '&' then begin
        let rec find_semi j =
          if j >= n || is_ws s.[j] || s.[j] = '&' || s.[j] = '<' then -1
          else if s.[j] = ';' then j
          else find_semi (j + 1)
        in
        let j = find_semi (i + 1) in
        if j > 0 && add_entity (String.sub s (i + 1) (j - i - 1)) then go (j + 1)
        else begin Buffer.add_char b s.[i]; go (i + 1) end
      end else begin Buffer.add_char b s.[i]; go (i + 1) end
    end
  in
  go 0;
  Buffer.contents b

let els_of_string frag : t list =
  let nodes, _ = parse_nodes frag 0 (String.length frag) [] in
  match nodes with
  | [] -> [ D.txt frag ]
  | _ -> List.concat_map el_of_node nodes
