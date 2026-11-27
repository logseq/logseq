(* Calculator block — evaluates arithmetic, assignments and named functions into result
   strings shown in .extensions__code-calc-output-line elements.
   Grammar: expr := term (('+'|'-') term)*; term := unary (('*'|'/'|'%')
   unary)*; unary := '-' unary | power; power := atom ('^' unary)?;
   atom := number | '(' expr ')' | name ['(' expr ')']. *)

let is_digit c = c >= '0' && c <= '9'

module Number = struct
  type t = Decimal of bool * string * int | Special of float

  let strip s =
    let i = ref 0 in
    while !i < String.length s - 1 && s.[!i] = '0' do incr i done;
    String.sub s !i (String.length s - !i)

  let make negative digits scale =
    let digits = strip digits in
    if digits = "0" then Decimal (false, "0", 0)
    else
      let last = ref (String.length digits) in
      while !last > 1 && digits.[!last - 1] = '0' do decr last done;
      Decimal (negative, String.sub digits 0 !last,
               scale - (String.length digits - !last))

  let compare_unsigned a b =
    let size = Int.compare (String.length a) (String.length b) in
    if size = 0 then String.compare a b else size

  let digit s i = if i < 0 then 0 else Char.code s.[i] - 48
  let character n = Char.chr (48 + n)

  let add_unsigned a b =
    let n = max (String.length a) (String.length b) in
    let result = Bytes.make (n + 1) '0' and carry = ref 0 in
    for i = 0 to n - 1 do
      let sum = digit a (String.length a - i - 1)
                + digit b (String.length b - i - 1) + !carry in
      Bytes.set result (n - i) (character (sum mod 10));
      carry := sum / 10
    done;
    Bytes.set result 0 (character !carry);
    strip (Bytes.to_string result)

  let subtract_unsigned a b =
    let n = String.length a in
    let result = Bytes.make n '0' and borrow = ref 0 in
    for i = 0 to n - 1 do
      let difference = digit a (n - i - 1)
                       - digit b (String.length b - i - 1) - !borrow in
      borrow := if difference < 0 then 1 else 0;
      Bytes.set result (n - i - 1) (character ((difference + 10) mod 10))
    done;
    strip (Bytes.to_string result)

  let multiply_unsigned a b =
    let n = String.length a and m = String.length b in
    let result = Array.make (n + m) 0 in
    for i = n - 1 downto 0 do
      let carry = ref 0 in
      for j = m - 1 downto 0 do
        let index = i + j + 1 in
        let product = digit a i * digit b j + result.(index) + !carry in
        result.(index) <- product mod 10;
        carry := product / 10
      done;
      result.(i) <- result.(i) + !carry
    done;
    strip (String.init (n + m) (fun i -> character result.(i)))

  let divide_unsigned numerator denominator =
    let remainder = ref "0" in
    let quotient = String.init (String.length numerator) (fun i ->
      remainder := strip (!remainder ^ String.make 1 numerator.[i]);
      let digit = ref 0 in
      while compare_unsigned !remainder denominator >= 0 do
        remainder := subtract_unsigned !remainder denominator;
        incr digit
      done;
      character !digit) in
    strip quotient, !remainder

  let zeros digits count = if digits = "0" then digits else digits ^ String.make count '0'

  let of_string input =
    let length = String.length input in
    let negative = length > 0 && input.[0] = '-' in
    let offset = if length > 0 && (negative || input.[0] = '+') then 1 else 0 in
    let input = String.sub input offset (length - offset) in
    let mantissa, exponent =
      match String.index_opt (String.lowercase_ascii input) 'e' with
      | None -> input, 0
      | Some index -> String.sub input 0 index,
          int_of_string (String.sub input (index + 1) (String.length input - index - 1)) in
    let digits, scale = match String.index_opt mantissa '.' with
      | None -> mantissa, 0
      | Some index ->
          String.sub mantissa 0 index
          ^ String.sub mantissa (index + 1) (String.length mantissa - index - 1),
          String.length mantissa - index - 1 in
    if digits = "" || not (String.for_all is_digit digits) then
      invalid_arg "invalid decimal";
    make negative digits (scale - exponent)

  let of_float value =
    if not (Float.is_finite value) then Special value
    else
      let rec shortest precision =
        let text = Printf.sprintf "%.*g" precision value in
        if precision = 17 || float_of_string text = value then of_string text
        else shortest (precision + 1) in
      shortest 1

  let to_float = function
    | Special value -> value
    | Decimal (negative, digits, scale) ->
        float_of_string ((if negative then "-" else "") ^ digits ^ "e" ^ string_of_int (-scale))

  let neg = function
    | Decimal (negative, digits, scale) -> make (not negative) digits scale
    | Special value -> Special (-. value)

  let abs = function Decimal (_, digits, scale) -> Decimal (false, digits, scale)
    | Special value -> Special (Float.abs value)

  let add a b = match a, b with
    | Decimal (an, ad, ap), Decimal (bn, bd, bp) ->
        let scale = max ap bp in
        let ad = zeros ad (scale - ap) and bd = zeros bd (scale - bp) in
        if an = bn then make an (add_unsigned ad bd) scale
        else if compare_unsigned ad bd >= 0 then make an (subtract_unsigned ad bd) scale
        else make bn (subtract_unsigned bd ad) scale
    | _ -> of_float (to_float a +. to_float b)

  let sub a b = add a (neg b)

  let mul a b = match a, b with
    | Decimal (an, ad, ap), Decimal (bn, bd, bp) ->
        make (an <> bn) (multiply_unsigned ad bd) (ap + bp)
    | _ -> of_float (to_float a *. to_float b)

  let div a b = match a, b with
    | Decimal (an, ad, ap), Decimal (bn, bd, bp) when bd <> "0" ->
        let shift = 20 + bp - ap in
        let numerator = if shift >= 0 then zeros ad shift else ad in
        let denominator = if shift < 0 then zeros bd (-shift) else bd in
        let quotient, remainder = divide_unsigned numerator denominator in
        let quotient = if compare_unsigned (add_unsigned remainder remainder) denominator >= 0
          then add_unsigned quotient "1" else quotient in
        make (an <> bn) quotient 20
    | _ -> of_float (to_float a /. to_float b)

  let pow a b = match b with
    | Decimal (negative, digits, scale) when scale <= 0 ->
        let exponent = int_of_string (zeros digits (-scale)) in
        let rec power value exponent result =
          if exponent = 0 then result
          else power (mul value value) (exponent / 2)
            (if exponent mod 2 = 1 then mul result value else result) in
        let result = power a exponent (of_string "1") in
        if negative then div (of_string "1") result else result
    | _ -> of_float (Float.pow (to_float a) (to_float b))

  let sqrt = function
    | Decimal (false, digits, scale) ->
        let shift = 40 - scale in
        let numerator = if shift >= 0 then zeros digits shift else digits in
        let denominator = if shift < 0 then zeros "1" (-shift) else "1" in
        let integer, _ = divide_unsigned numerator denominator in
        let root = ref "0" and remainder = ref "0" in
        let index = ref 0 in
        while !index < String.length integer do
          let count = if !index = 0 && String.length integer mod 2 = 1 then 1 else 2 in
          remainder := strip (!remainder ^ String.sub integer !index count);
          let base = multiply_unsigned !root "20" in
          let trial digit = multiply_unsigned (add_unsigned base (string_of_int digit))
              (string_of_int digit) in
          let next = ref 9 in
          while compare_unsigned (trial !next) !remainder > 0 do decr next done;
          remainder := subtract_unsigned !remainder (trial !next);
          root := strip (!root ^ string_of_int !next);
          index := !index + count
        done;
        let midpoint = add_unsigned (multiply_unsigned !root "2") "1" in
        let threshold = multiply_unsigned (multiply_unsigned midpoint midpoint) denominator in
        let root = if compare_unsigned (multiply_unsigned numerator "4") threshold >= 0
          then add_unsigned !root "1" else !root in
        make false root 20
    | Decimal (true, _, _) -> Special nan
    | Special value -> of_float (Float.sqrt value)

  let format = function
    | Special value -> if Float.is_nan value then "NaN"
        else if value < 0. then "-Infinity" else "Infinity"
    | Decimal (negative, digits, scale) ->
        let rounded =
          if String.length digits <= 21 then Decimal (negative, digits, scale)
          else
            let kept = String.sub digits 0 21 in
            make negative (if digits.[21] >= '5' then add_unsigned kept "1" else kept)
              (scale - (String.length digits - 21)) in
        let negative, digits, scale = match rounded with
          | Decimal (n, d, p) -> n, d, p | Special _ -> assert false in
        let length = String.length digits in
        let exponent = length - scale - 1 in
        let content =
          if exponent >= 21 || scale > 22 then
            String.make 1 digits.[0]
            ^ (if length = 1 then "" else "." ^ String.sub digits 1 (length - 1))
            ^ "e" ^ (if exponent >= 0 then "+" else "") ^ string_of_int exponent
          else if scale <= 0 then zeros digits (-scale)
          else if scale >= length then "0." ^ String.make (scale - length) '0' ^ digits
          else String.sub digits 0 (length - scale) ^ "."
               ^ String.sub digits (length - scale) scale in
        (if negative then "-" else "") ^ content
end

type state = { s : string; mutable i : int; env : (string, Number.t) Hashtbl.t }

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
    | Some '+' -> st.i <- st.i + 1; go (Number.add v (parse_mul st))
    | Some '-' -> st.i <- st.i + 1; go (Number.sub v (parse_mul st))
    | _ -> v
  in
  go v

and parse_mul st =
  let v = parse_unary st in
  let rec go v =
    skip_ws st;
    match peek st with
    | Some '*' -> st.i <- st.i + 1; go (Number.mul v (parse_unary st))
    | Some '/' -> st.i <- st.i + 1; go (Number.div v (parse_unary st))
    | Some '%' -> st.i <- st.i + 1;
        go (Number.div (Number.mul v (parse_unary st)) (Number.of_string "100"))
    | _ -> v
  in
  go v

and parse_unary st =
  skip_ws st;
  match peek st with
  | Some '-' -> st.i <- st.i + 1; Number.neg (parse_unary st)
  | Some '+' -> st.i <- st.i + 1; parse_unary st
  | _ -> parse_power st

and parse_power st =
  let v = parse_atom st in
  skip_ws st;
  if eat st '^' then Number.pow v (parse_unary st) else v

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
        let apply f = Number.of_float (f (Number.to_float value)) in
        match name with
        | "abs" -> Number.abs value
        | "sqrt" -> Number.sqrt value
        | "log" -> apply Float.log10
        | "ln" -> apply Float.log
        | "exp" -> apply Float.exp
        | "sin" -> apply Float.sin
        | "cos" -> apply Float.cos
        | "tan" -> apply Float.tan
        | "asin" -> apply Float.asin
        | "acos" -> apply Float.acos
        | "atan" -> apply Float.atan
        | _ -> failwith "unknown function"
      end else
        (match name with
         | "PI" -> Number.of_string "3.14159265358979323846"
         | "E" -> Number.of_string "2.71828182845904523536"
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
  Number.of_string (String.sub st.s start (j - start))

let eval ?env (line : string) : Number.t option =
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
         else match eval ~env line with Some v -> Number.format v | None -> "?") lines


(* Shared calculator output chrome. Web CodeMirror fills the mounted empty
   container imperatively; native hosts bind the same rows to the textarea
   signal inside the native code-editor surface. *)
let output_el ?(key = "calc") (source : string) : Lui_elements.t =
  let line_el line =
    Lui_elements.text ~style_class:"extensions__code-calc-output-line"
      ~white_space:`nowrap ~line_height:"1.45rem" ~min_height:23
      ~value:line []
  in
  Lui_elements.column ~key ~style_class:"extensions__code-calc"
    (List.map line_el (results source))
