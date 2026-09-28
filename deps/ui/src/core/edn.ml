(* Minimal EDN reader/writer producing Wire.t — covers the config.edn
   subset: maps, vectors, lists, sets, strings, keywords, symbols,
   numbers, bools, nil. Tagged literals parse as Tagged (tag, value). *)

type token =
  | TOpen of char
  | TClose of char
  | TStr of string
  | TAtom of string
  | TDiscard
  | TSetOpen

let is_delim c =
  List.mem c
    [ ' '; '\t'; '\n'; '\r'; ','; '{'; '}'; '['; ']'; '('; ')'; '"' ]

let rec skip_ws s i =
  if i >= String.length s then i
  else
    match String.get s i with
    | ' ' | '\t' | '\n' | '\r' | ',' -> skip_ws s (i + 1)
    | ';' ->
        let rec to_eol j =
          if j >= String.length s || String.get s j = '\n' then j
          else to_eol (j + 1)
        in
        skip_ws s (to_eol i)
    | _ -> i

let read_string s i =
  let b = Buffer.create 16 in
  let rec go j =
    if j >= String.length s then (Buffer.contents b, j)
    else
      match String.get s j with
      | '"' -> (Buffer.contents b, j + 1)
      | '\\' when j + 1 < String.length s ->
          let c =
            match String.get s (j + 1) with
            | 'n' -> '\n'
            | 't' -> '\t'
            | 'r' -> '\r'
            | '"' -> '"'
            | '\\' -> '\\'
            | c -> c
          in
          Buffer.add_char b c;
          go (j + 2)
      | c ->
          Buffer.add_char b c;
          go (j + 1)
  in
  go (i + 1)

let read_token s i =
  let i = skip_ws s i in
  if i >= String.length s then (None, i)
  else
    match String.get s i with
    | ('{' | '[' | '(') as c -> (Some (TOpen c), i + 1)
    | ('}' | ']' | ')') as c -> (Some (TClose c), i + 1)
    | '#' when i + 1 < String.length s && String.get s (i + 1) = '_' ->
        (Some TDiscard, i + 2)
    | '#' when i + 1 < String.length s && String.get s (i + 1) = '{' ->
        (Some TSetOpen, i + 2)
    | '"' -> let str, j = read_string s i in (Some (TStr str), j)
    | _ ->
        let rec go j =
          if j >= String.length s || is_delim (String.get s j) then j
          else go (j + 1)
        in
        let j = go i in
        (Some (TAtom (String.sub s i (j - i))), j)

let atom_to_wire a =
  match a with
  | "nil" -> Wire.Nil
  | "true" -> Wire.Bool true
  | "false" -> Wire.Bool false
  | _ when String.length a > 0 && String.get a 0 = ':' ->
      Wire.Keyword (String.sub a 1 (String.length a - 1))
  | _ -> (
      match int_of_string_opt a with
      | Some n -> Wire.Int n
      | None -> (
          match float_of_string_opt a with
          | Some f -> Wire.Float f
          | None -> Wire.Symbol a))

exception Parse_error of string

let rec parse_value s i =
  match read_token s i with
  | Some (TStr v), j -> (Wire.String v, j)
  | Some (TAtom a), j -> (atom_to_wire a, j)
  | Some (TOpen c), j -> parse_collection s j c
  | Some TDiscard, j ->
      let _, j = parse_value s j in
      parse_value s j
  | Some TSetOpen, j -> parse_collection s j '#'
  | Some (TClose c), _ -> raise (Parse_error (Printf.sprintf "unexpected %c" c))
  | None, j -> (Wire.Nil, j)

and parse_collection s j open_c =
  let close_c =
    match open_c with
    | '{' | '#' -> '}'
    | '[' -> ']'
    | _ -> ')'
  in
  let rec go acc j =
    match read_token s j with
    | Some (TClose c), j' when c = close_c -> (List.rev acc, j')
    | None, _ -> raise (Parse_error "unterminated collection")
    | _ ->
        let v, j' = parse_value s j in
        go (v :: acc) j'
  in
  let elems, j' = go [] j in
  match open_c with
  | '{' -> (
      let rec pairs acc = function
        | k :: v :: rest -> pairs ((k, v) :: acc) rest
        | _ -> acc
      in
      (Wire.Map (List.rev (pairs [] elems)), j'))
  | '[' -> (Wire.Array elems, j')
  | '#' -> (Wire.Set elems, j')
  | _ -> (Wire.List elems, j')

let parse s = fst (parse_value s 0)

let rec write b (w : Wire.t) =
  match w with
  | Wire.Nil -> Buffer.add_string b "nil"
  | Wire.Bool v -> Buffer.add_string b (string_of_bool v)
  | Wire.Int n -> Buffer.add_string b (string_of_int n)
  | Wire.Int64 n -> Buffer.add_string b (Int64.to_string n)
  | Wire.Float f -> Buffer.add_string b (Printf.sprintf "%g" f)
  | Wire.String s -> Buffer.add_string b (esc_str s)
  | Wire.Keyword s -> Buffer.add_string b (":" ^ s)
  | Wire.Symbol s -> Buffer.add_string b s
  | Wire.Array xs -> write_seq b "[" xs "]"
  | Wire.List xs -> write_seq b "(" xs ")"
  | Wire.Set xs -> write_seq b "#{" xs "}"
  | Wire.Map kvs ->
      Buffer.add_char b '{';
      List.iteri
        (fun i (k, v) ->
          if i > 0 then Buffer.add_char b ' ';
          write b k;
          Buffer.add_char b ' ';
          write b v)
        kvs;
      Buffer.add_char b '}'
  | Wire.Tagged (t, v) ->
      Buffer.add_string b ("#" ^ t ^ " ");
      write b v
  | Wire.Uuid s -> Buffer.add_string b ("#uuid \"" ^ s ^ "\"")
  | Wire.Date_ms ms ->
      Buffer.add_string b (Printf.sprintf "#inst %Ld" ms)
  | _ -> Buffer.add_string b "nil"

and write_seq b o xs c =
  Buffer.add_string b o;
  List.iteri
    (fun i v ->
      if i > 0 then Buffer.add_char b ' ';
      write b v)
    xs;
  Buffer.add_string b c

and esc_str s =
  let b = Buffer.create (String.length s + 2) in
  Buffer.add_char b '"';
  String.iter
    (fun c ->
      match c with
      | '"' -> Buffer.add_string b "\\\""
      | '\\' -> Buffer.add_string b "\\\\"
      | '\n' -> Buffer.add_string b "\\n"
      | '\t' -> Buffer.add_string b "\\t"
      | _ -> Buffer.add_char b c)
    s;
  Buffer.add_char b '"';
  Buffer.contents b

let to_string w = let b = Buffer.create 64 in write b w; Buffer.contents b
