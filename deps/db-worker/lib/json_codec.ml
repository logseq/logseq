(* Minimal JSON codec over Wire.t, used by the db-sync port.
   cljs: js->clj with :keywordize-keys on parse, clj->js + JSON.stringify on
   encode. Object keys decode to Wire.Keyword (keywordize all keys); on encode,
   Keyword/String keys render to their name, Uuid renders as its string. *)

exception Json_error of string

let fail msg = raise (Json_error msg)

(* ---- decode ---- *)

let is_ws c = c = ' ' || c = '\t' || c = '\n' || c = '\r'

let parse (s : string) : Wire.t =
  let len = String.length s in
  let pos = ref 0 in
  let peek () = if !pos < len then Some s.[!pos] else None in
  let next () =
    match peek () with
    | Some c -> incr pos; c
    | None -> fail "unexpected end of json input"
  in
  let skip_ws () =
    while (match peek () with Some c -> is_ws c | None -> false) do
      incr pos
    done
  in
  let expect c =
    let c' = next () in
    if c' <> c then fail (Printf.sprintf "expected %c got %c" c c')
  in
  let expect_lit lit =
    String.iter
      (fun c ->
         match peek () with
         | Some c' when c' = c -> incr pos
         | _ -> fail (Printf.sprintf "expected %s" lit))
      lit
  in
  let parse_string () : string =
    expect '"';
    let b = Buffer.create 16 in
    let done_ = ref false in
    while not !done_ do
      match peek () with
      | None -> fail "unterminated string"
      | Some '"' -> incr pos; done_ := true
      | Some '\\' ->
          incr pos;
          (match next () with
           | 'u' ->
               let hex = String.sub s !pos 4 in
               pos := !pos + 4;
               let code = int_of_string ("0x" ^ hex) in
               (* surrogate pair *)
               let code =
                 if code >= 0xD800 && code <= 0xDBFF
                    && !pos + 1 < len
                    && s.[!pos] = '\\' && s.[!pos + 1] = 'u'
                 then begin
                   pos := !pos + 2;
                   let hex2 = String.sub s !pos 4 in
                   pos := !pos + 4;
                   let lo = int_of_string ("0x" ^ hex2) in
                   0x10000 + (((code - 0xD800) lsl 10) lor (lo - 0xDC00))
                 end
                 else code
               in
               Buffer.add_utf_8_uchar b (Uchar.of_int code)
           | 'n' -> Buffer.add_char b '\n'
           | 't' -> Buffer.add_char b '\t'
           | 'r' -> Buffer.add_char b '\r'
           | 'b' -> Buffer.add_char b '\b'
           | 'f' -> Buffer.add_char b '\012'
           | c -> Buffer.add_char b c)
      | Some c -> incr pos; Buffer.add_char b c
    done;
    Buffer.contents b
  in
  let rec parse_number () : Wire.t =
    let start = !pos in
    (match peek () with Some '-' -> incr pos | _ -> ());
    while (match peek () with
           | Some c -> (c >= '0' && c <= '9') || c = '.' || c = 'e' || c = 'E'
                       || c = '+' || c = '-'
           | None -> false)
    do
      incr pos
    done;
    let tok = String.sub s start (!pos - start) in
    if tok = "" then fail "empty number";
    let is_float =
      String.exists (fun c -> c = '.' || c = 'e' || c = 'E') tok
    in
    if is_float then
      Wire.Float (float_of_string tok)
    else
      match Int64.of_string_opt tok with
      | Some n ->
          if Int64.abs n <= Int64.of_int max_int then Wire.Int (Int64.to_int n)
          else Wire.Int64 n
      | None -> fail (Printf.sprintf "invalid number %s" tok)
  and parse_value () : Wire.t =
    skip_ws ();
    match peek () with
    | None -> fail "unexpected end of json input"
    | Some '{' -> parse_object ()
    | Some '[' -> parse_array ()
    | Some '"' -> Wire.String (parse_string ())
    | Some 't' -> expect_lit "true"; Wire.Bool true
    | Some 'f' -> expect_lit "false"; Wire.Bool false
    | Some 'n' -> expect_lit "null"; Wire.Nil
    | Some _ -> parse_number ()
  and parse_object () : Wire.t =
    expect '{';
    let rec acc kvs =
      skip_ws ();
      match peek () with
      | Some '}' -> incr pos; List.rev kvs
      | _ ->
          let k = parse_string () in
          skip_ws ();
          expect ':';
          let v = parse_value () in
          skip_ws ();
          (match peek () with
           | Some ',' -> incr pos; acc ((Wire.Keyword k, v) :: kvs)
           | Some '}' -> incr pos; List.rev ((Wire.Keyword k, v) :: kvs)
           | _ -> fail "expected , or } in object")
    in
    Wire.Map (acc [])
  and parse_array () : Wire.t =
    expect '[';
    let rec acc xs =
      skip_ws ();
      match peek () with
      | Some ']' -> incr pos; List.rev xs
      | _ ->
          let v = parse_value () in
          skip_ws ();
          (match peek () with
           | Some ',' -> incr pos; acc (v :: xs)
           | Some ']' -> incr pos; List.rev (v :: xs)
           | _ -> fail "expected , or ] in array")
    in
    Wire.Array (acc [])
  in
  let v = parse_value () in
  skip_ws ();
  (match peek () with
   | Some _ -> fail "trailing data after json value"
   | None -> ());
  v

(* ---- encode ---- *)

let escape_into b s =
  String.iter
    (fun c ->
       match c with
       | '"' -> Buffer.add_string b "\\\""
       | '\\' -> Buffer.add_string b "\\\\"
       | '\n' -> Buffer.add_string b "\\n"
       | '\r' -> Buffer.add_string b "\\r"
       | '\t' -> Buffer.add_string b "\\t"
       | c when Char.code c < 0x20 ->
           Buffer.add_string b (Printf.sprintf "\\u%04x" (Char.code c))
       | c -> Buffer.add_char b c)
    s

(* clj->js key conversion: keyword -> name, string -> itself, other scalars
   stringified. *)
let json_key = function
  | Wire.Keyword s -> s
  | Wire.String s -> s
  | Wire.Symbol s -> s
  | Wire.Int n -> string_of_int n
  | Wire.Int64 n -> Int64.to_string n
  | Wire.Float f -> Printf.sprintf "%.17g" f
  | Wire.Uuid s -> s
  | _ -> fail "json object key must be a keyword or string"

let rec encode_into b (t : Wire.t) =
  match t with
  | Wire.Nil -> Buffer.add_string b "null"
  | Wire.Bool true -> Buffer.add_string b "true"
  | Wire.Bool false -> Buffer.add_string b "false"
  | Wire.Int n -> Buffer.add_string b (string_of_int n)
  | Wire.Int64 n -> Buffer.add_string b (Int64.to_string n)
  | Wire.Float f ->
      (* JS JSON.stringify prints ints without decimal point *)
      let s = Printf.sprintf "%.17g" f in
      Buffer.add_string b s
  | Wire.String s | Wire.Symbol s | Wire.Uuid s | Wire.Uri s ->
      Buffer.add_char b '"'; escape_into b s; Buffer.add_char b '"'
  | Wire.Keyword s -> Buffer.add_char b '"'; escape_into b s; Buffer.add_char b '"'
  | Wire.Binary s ->
      (* transit bytes do not occur in db-sync JSON payloads *)
      Buffer.add_char b '"'; escape_into b s; Buffer.add_char b '"'
  | Wire.Date_ms _ | Wire.Big_decimal _ | Wire.Big_int _ | Wire.Tagged _ ->
      fail "json encode: unsupported wire constructor"
  | Wire.Array xs | Wire.List xs | Wire.Set xs ->
      Buffer.add_char b '[';
      List.iteri
        (fun i v -> if i > 0 then Buffer.add_char b ','; encode_into b v)
        xs;
      Buffer.add_char b ']'
  | Wire.Map kvs ->
      Buffer.add_char b '{';
      List.iteri
        (fun i (k, v) ->
           if i > 0 then Buffer.add_char b ',';
           Buffer.add_char b '"';
           escape_into b (json_key k);
           Buffer.add_string b "\":";
           encode_into b v)
        kvs;
      Buffer.add_char b '}'

let encode (t : Wire.t) : string =
  let b = Buffer.create 256 in
  encode_into b t;
  Buffer.contents b
