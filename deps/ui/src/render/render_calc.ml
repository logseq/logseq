(* Calculator block — evaluates simple arithmetic lines into result
   strings shown in .extensions__code-calc-output-line elements.
   Grammar: expr := term (('+'|'-') term)*; term := unary (('*'|'/'|'%')
   unary)*; unary := '-' unary | power; power := atom ('^' unary)?;
   atom := number | '(' expr ')'. *)

let is_digit c = c >= '0' && c <= '9'

type state = { s : string; mutable i : int }

let nst st = String.length st.s

let skip_ws st =
  while st.i < nst st
        && (let c = st.s.[st.i] in c = ' ' || c = '\t')
  do
    st.i <- st.i + 1
  done

let peek st =
  if st.i < nst st then Some st.s.[st.i] else None

let eat st c =
  skip_ws st;
  match peek st with
  | Some c' when c' = c -> st.i <- st.i + 1; true
  | _ -> false

let rec parse_expr st = parse_add st

and parse_add st =
  let v = parse_mul st in
  let rec go v =
    skip_ws st;
    match peek st with
    | Some '+' -> st.i <- st.i + 1; go (v +. parse_mul st)
    | Some '-' -> st.i <- st.i + 1; go (v -. parse_mul st)
    | _ -> v
  in
  go v

and parse_mul st =
  let v = parse_unary st in
  let rec go v =
    skip_ws st;
    match peek st with
    | Some '*' -> st.i <- st.i + 1; go (v *. parse_unary st)
    | Some '/' -> st.i <- st.i + 1; go (v /. parse_unary st)
    | Some '%' -> st.i <- st.i + 1; go (v *. parse_unary st /. 100.0)
    | _ -> v
  in
  go v

and parse_unary st =
  skip_ws st;
  match peek st with
  | Some '-' -> st.i <- st.i + 1; Float.neg (parse_unary st)
  | Some '+' -> st.i <- st.i + 1; parse_unary st
  | _ -> parse_power st

and parse_power st =
  let v = parse_atom st in
  skip_ws st;
  if eat st '^' then Float.pow v (parse_unary st) else v

and parse_atom st =
  skip_ws st;
  match peek st with
  | Some '(' ->
      st.i <- st.i + 1;
      let v = parse_expr st in
      (if eat st ')' then () else failwith "unclosed paren");
      v
  | Some c when is_digit c || c = '.' -> parse_number st
  | _ -> failwith "expected number"

and parse_number st =
  let start = st.i in
  let rec scan i seen_dot seen_e =
    if i >= nst st then i
    else
      match st.s.[i] with
      | c when is_digit c -> scan (i + 1) seen_dot seen_e
      | '.' when not seen_dot && not seen_e -> scan (i + 1) true seen_e
      | ('e' | 'E') when not seen_e && i > start ->
          scan (i + 1) seen_dot true
      | ('+' | '-')
        when seen_e && i > start && (st.s.[i - 1] = 'e' || st.s.[i - 1] = 'E') ->
          scan (i + 1) seen_dot seen_e
      | _ -> i
  in
  let j = scan st.i false false in
  if j = start then failwith "expected number";
  st.i <- j;
  float_of_string (String.sub st.s start (j - start))

let eval (line : string) : float option =
  let st = { s = line; i = 0 } in
  match
    (let v = parse_expr st in
     skip_ws st;
     if st.i = nst st then Some v else None)
  with
  | v -> v
  | exception _ -> None

let fmt_float v =
  if Float.is_integer v && Float.abs v < 1e15 then
    string_of_int (int_of_float v)
  else
    let s = Printf.sprintf "%.6g" v in
    s

let results (source : string) : string list =
  String.split_on_char '\n' source
  |> List.filter_map (fun line ->
         let line = String.trim line in
         if line = "" then None
         else Option.map fmt_float (eval line))
