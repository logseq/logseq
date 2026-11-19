(* Calculator block — evaluates arithmetic, assignments and named functions into result
   strings shown in .extensions__code-calc-output-line elements.
   Grammar: expr := term (('+'|'-') term)*; term := unary (('*'|'/'|'%')
   unary)*; unary := '-' unary | power; power := atom ('^' unary)?;
   atom := number | '(' expr ')' | name ['(' expr ')']. *)

let is_digit c = c >= '0' && c <= '9'

type state = { s : string; mutable i : int; env : (string, float) Hashtbl.t }

let is_alpha c = (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')

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

let parse_name st =
  let first = st.i in
  while peek st = Some '_' do st.i <- st.i + 1 done;
  (match peek st with
   | Some c when is_alpha c -> ()
   | _ -> failwith "expected name");
  while st.i < nst st
        && (let c = st.s.[st.i] in is_alpha c || is_digit c || c = '_') do
    st.i <- st.i + 1
  done;
  String.sub st.s first (st.i - first)

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
  | Some c when is_alpha c || c = '_' ->
      let name = parse_name st in
      if peek st = Some '(' then begin
        st.i <- st.i + 1;
        let value = parse_expr st in
        if not (eat st ')') then failwith "unclosed paren";
        match name with
        | "abs" -> Float.abs value
        | "sqrt" -> Float.sqrt value
        | "log" -> Float.log10 value
        | "ln" -> Float.log value
        | "exp" -> Float.exp value
        | "sin" -> Float.sin value
        | "cos" -> Float.cos value
        | "tan" -> Float.tan value
        | "asin" -> Float.asin value
        | "acos" -> Float.acos value
        | "atan" -> Float.atan value
        | _ -> failwith "unknown function"
      end else
        (match name with
         | "PI" -> Float.pi
         | "E" -> Float.exp 1.
         | _ -> match Hashtbl.find_opt st.env name with
           | Some value -> value
           | None -> failwith "unknown variable")
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

let eval ?env (line : string) : float option =
  let env = match env with Some env -> env | None -> Hashtbl.create 16 in
  let st = { s = line; i = 0; env } in
  match
    (skip_ws st;
     let first = st.i in
     let binding = match peek st with
       | Some c when is_alpha c || c = '_' ->
           let name = parse_name st in
           if eat st '=' then Some name else (st.i <- first; None)
       | _ -> None in
     let v = parse_expr st in
     skip_ws st;
     if st.i <> nst st && peek st <> Some '#' then failwith "unexpected input";
     (match binding with
      | Some ("PI" | "E") -> failwith "cannot redefine constant"
      | Some name -> Hashtbl.replace env name v
      | None -> ());
     Hashtbl.replace env "last" v;
     Some v)
  with
  | v -> v
  | exception _ -> Hashtbl.remove env "last"; None

let fmt_float v =
  if Float.is_nan v then "NaN"
  else if v = infinity then "Infinity"
  else if v = neg_infinity then "-Infinity"
  else if Float.is_integer v && Float.abs v < 1e15 then
    string_of_int (int_of_float v)
  else
    let s = Printf.sprintf "%.6g" v in
    s

let results (source : string) : string list =
  let env = Hashtbl.create 16 in
  let lines = String.split_on_char '\n' source in
  let count = List.length lines in
  let lines = List.mapi (fun i line ->
    let n = String.length line in
    if i < count - 1 && n > 0 && line.[n - 1] = '\r' then String.sub line 0 (n - 1)
    else line) lines in
  let lines = match lines with
    | [_] -> lines
    | _ ->
        let rec drop = function "" :: rest -> drop rest | rest -> rest in
        List.rev (drop (List.rev lines)) in
  List.map (fun line ->
         let line = String.trim line in
         if line = "" || line.[0] = '#' then ""
         else match eval ~env line with Some v -> fmt_float v | None -> "?") lines
