(* Minimal JSON codec for cmdk's localStorage payloads
   ("commands-history", "ls-cmdk-last-search") — the shared slice cannot
   link Js.Json and the values are plain JSON. *)

type t =
  | Null
  | Bool of bool
  | Num of float
  | Str of string
  | Arr of t list
  | Obj of (string * t) list

let encode v =
  let buf = Buffer.create 64 in
  let rec go = function
    | Null -> Buffer.add_string buf "null"
    | Bool b -> Buffer.add_string buf (if b then "true" else "false")
    | Num f ->
        (* JSON.stringify prints integral floats without a fraction *)
        if Float.of_int (int_of_float f) = f then
          Buffer.add_string buf (string_of_int (int_of_float f))
        else Buffer.add_string buf (string_of_float f)
    | Str s -> str s
    | Arr xs ->
        Buffer.add_char buf '[';
        List.iteri (fun i x -> if i > 0 then Buffer.add_char buf ','; go x)
          xs;
        Buffer.add_char buf ']'
    | Obj kvs ->
        Buffer.add_char buf '{';
        List.iteri
          (fun i (k, v) ->
            if i > 0 then Buffer.add_char buf ',';
            str k;
            Buffer.add_char buf ':';
            go v)
          kvs;
        Buffer.add_char buf '}'
  and str s =
    Buffer.add_char buf '"';
    String.iter
      (fun c ->
        match c with
        | '"' -> Buffer.add_string buf "\\\""
        | '\\' -> Buffer.add_string buf "\\\\"
        | '\n' -> Buffer.add_string buf "\\n"
        | '\r' -> Buffer.add_string buf "\\r"
        | '\t' -> Buffer.add_string buf "\\t"
        | c when Char.code c < 0x20 ->
            Buffer.add_string buf
              (Printf.sprintf "\\u%04x" (Char.code c))
        | c -> Buffer.add_char buf c)
      s;
    Buffer.add_char buf '"'
  in
  go v;
  Buffer.contents buf

exception Parse_error

let decode s =
  let n = String.length s in
  let pos = ref 0 in
  let peek () = if !pos < n then Some s.[!pos] else None in
  let take () = let c = s.[!pos] in incr pos; c in
  let ws () = while !pos < n && (s.[!pos] = ' ' || s.[!pos] = '\t'
              || s.[!pos] = '\n' || s.[!pos] = '\r') do incr pos done in
  let expect c = if take () <> c then raise Parse_error in
  let lit w =
    if String.length s - !pos < String.length w
       || String.sub s !pos (String.length w) <> w then raise Parse_error;
    pos := !pos + String.length w
  in
  let rec value () =
    ws ();
    match peek () with
    | Some '{' -> obj ()
    | Some '[' -> arr ()
    | Some '"' -> Str (text ())
    | Some 't' -> lit "true"; Bool true
    | Some 'f' -> lit "false"; Bool false
    | Some 'n' -> lit "null"; Null
    | Some c when c = '-' || (c >= '0' && c <= '9') -> Num (num ())
    | _ -> raise Parse_error
  and obj () =
    expect '{';
    ws ();
    if peek () = Some '}' then begin incr pos; Obj [] end
    else
      let rec pairs acc =
        ws ();
        let k = text () in
        ws (); expect ':';
        let v = value () in
        ws ();
        match take () with
        | ',' -> pairs ((k, v) :: acc)
        | '}' -> Obj (List.rev ((k, v) :: acc))
        | _ -> raise Parse_error
      in
      pairs []
  and arr () =
    expect '[';
    ws ();
    if peek () = Some ']' then begin incr pos; Arr [] end
    else
      let rec elems acc =
        let v = value () in
        ws ();
        match take () with
        | ',' -> elems (v :: acc)
        | ']' -> Arr (List.rev (v :: acc))
        | _ -> raise Parse_error
      in
      elems []
  and text () =
    expect '"';
    let buf = Buffer.create 16 in
    let rec loop () =
      match take () with
      | '"' -> ()
      | '\\' -> (
          match take () with
          | 'n' -> Buffer.add_char buf '\n'; loop ()
          | 'r' -> Buffer.add_char buf '\r'; loop ()
          | 't' -> Buffer.add_char buf '\t'; loop ()
          | 'b' -> Buffer.add_char buf '\b'; loop ()
          | 'f' -> Buffer.add_char buf '\012'; loop ()
          | 'u' ->
              if !pos + 4 > n then raise Parse_error;
              let code = int_of_string ("0x" ^ String.sub s !pos 4) in
              pos := !pos + 4;
              (* encode the BMP code point as UTF-8 *)
              if code < 0x80 then Buffer.add_char buf (Char.chr code)
              else if code < 0x800 then begin
                Buffer.add_char buf (Char.chr (0xC0 lor (code lsr 6)));
                Buffer.add_char buf (Char.chr (0x80 lor (code land 0x3F)))
              end
              else begin
                Buffer.add_char buf (Char.chr (0xE0 lor (code lsr 12)));
                Buffer.add_char buf
                  (Char.chr (0x80 lor ((code lsr 6) land 0x3F)));
                Buffer.add_char buf (Char.chr (0x80 lor (code land 0x3F)))
              end;
              loop ()
          | c -> Buffer.add_char buf c; loop ())
      | c -> Buffer.add_char buf c; loop ()
    in
    loop ();
    Buffer.contents buf
  and num () =
    let start = !pos in
    while
      !pos < n
      && (match s.[!pos] with
          | '0' .. '9' | '-' | '+' | '.' | 'e' | 'E' -> true
          | _ -> false)
    do
      incr pos
    done;
    try float_of_string (String.sub s start (!pos - start))
    with _ -> raise Parse_error
  in
  let v = value () in
  ws ();
  v

let get_obj = function Obj kvs -> Some kvs | _ -> None
let get_arr = function Arr xs -> Some xs | _ -> None
let get_str = function Str s -> Some s | _ -> None
let get_num = function Num f -> Some f | _ -> None
let assoc k kvs = try Some (List.assoc k kvs) with Not_found -> None
let member k v = match get_obj v with Some kvs -> assoc k kvs | None -> None
