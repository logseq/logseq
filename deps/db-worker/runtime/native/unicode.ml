let nfc s = Uunf_string.normalize_utf_8 `NFC s
let nfkc s = Uunf_string.normalize_utf_8 `NFKC s
let nfd s = Uunf_string.normalize_utf_8 `NFD s

(* UTF-8 codec (scalar values as ints). *)
let decode_utf8 (s : string) : int list =
  let len = String.length s in
  let byte i = Char.code (String.get s i) in
  let rec loop i acc =
    if i >= len then List.rev acc
    else
      let b0 = byte i in
      if b0 < 0x80 then loop (i + 1) (b0 :: acc)
      else if b0 < 0xC0 then loop (i + 1) (0xFFFD :: acc)
      else if b0 < 0xE0 && i + 1 < len then
        loop (i + 2) (((b0 land 0x1F) lsl 6 lor (byte (i + 1) land 0x3F)) :: acc)
      else if b0 < 0xF0 && i + 2 < len then
        loop (i + 3)
          (((b0 land 0x0F) lsl 12 lor ((byte (i + 1) land 0x3F) lsl 6)
            lor (byte (i + 2) land 0x3F))
          :: acc)
      else if i + 3 < len then
        loop (i + 4)
          (((b0 land 0x07) lsl 18 lor ((byte (i + 1) land 0x3F) lsl 12)
            lor ((byte (i + 2) land 0x3F) lsl 6)
            lor (byte (i + 3) land 0x3F))
          :: acc)
      else acc |> List.rev
  in
  loop 0 []

let encode_utf8 (cps : int list) : string =
  let buf = Buffer.create 64 in
  let add c = Buffer.add_char buf (Char.chr c) in
  List.iter
    (fun cp ->
       if cp < 0x80 then add cp
       else if cp < 0x800 then begin
         add (0xC0 lor (cp lsr 6));
         add (0x80 lor (cp land 0x3F))
       end
       else if cp < 0x10000 then begin
         add (0xE0 lor (cp lsr 12));
         add (0x80 lor ((cp lsr 6) land 0x3F));
         add (0x80 lor (cp land 0x3F))
       end
       else begin
         add (0xF0 lor (cp lsr 18));
         add (0x80 lor ((cp lsr 12) land 0x3F));
         add (0x80 lor ((cp lsr 6) land 0x3F));
         add (0x80 lor (cp land 0x3F))
       end)
    cps;
  Buffer.contents buf

(* String.prototype.toLowerCase — per-codepoint full simple case mapping. *)
let lowercase (s : string) : string =
  decode_utf8 s
  |> List.concat_map (fun cp ->
         match Uucp.Case.Map.to_lower (Uchar.unsafe_of_int cp) with
         | `Self -> [ cp ]
         | `Uchars us -> List.map Uchar.to_int us)
  |> encode_utf8

(* String.prototype.toUpperCase — per-codepoint full simple case mapping. *)
let uppercase (s : string) : string =
  decode_utf8 s
  |> List.concat_map (fun cp ->
         match Uucp.Case.Map.to_upper (Uchar.unsafe_of_int cp) with
         | `Self -> [ cp ]
         | `Uchars us -> List.map Uchar.to_int us)
  |> encode_utf8

(* ECMAScript WhiteSpace + LineTerminator code points. *)
let is_js_whitespace cp =
  match cp with
  | 0x0009 | 0x000A | 0x000B | 0x000C | 0x000D | 0x0020 | 0x00A0
  | 0x1680 | 0x2028 | 0x2029 | 0x202F | 0x205F | 0x3000 | 0xFEFF -> true
  | _ -> cp >= 0x2000 && cp <= 0x200A

let trim (s : string) : string =
  match decode_utf8 s with
  | [] -> ""
  | cps ->
      let cps = List.rev (List.drop_while is_js_whitespace
                            (List.rev (List.drop_while is_js_whitespace cps))) in
      encode_utf8 cps

let triml (s : string) : string =
  encode_utf8 (List.drop_while is_js_whitespace (decode_utf8 s))

let trimr (s : string) : string =
  encode_utf8
    (List.rev (List.drop_while is_js_whitespace
                 (List.rev (decode_utf8 s))))

let case_map_cp map cp =
  match map (Uchar.unsafe_of_int cp) with
  | `Self -> [ cp ]
  | `Uchars us -> List.map Uchar.to_int us

let capitalize (s : string) : string =
  match decode_utf8 s with
  | [] -> ""
  | c :: rest ->
      encode_utf8
        (case_map_cp Uucp.Case.Map.to_upper c
         @ List.concat_map (case_map_cp Uucp.Case.Map.to_lower) rest)

(* String.length — UTF-16 code units: BMP 1, astral 2. *)
let js_length (s : string) : int =
  List.fold_left
    (fun acc cp -> acc + (if cp > 0xFFFF then 2 else 1))
    0 (decode_utf8 s)

(* subs on UTF-16 units — a boundary inside an astral char keeps/drops
   the whole char (a lone surrogate is not encodable). *)
let js_sub (s : string) (start : int) (end_ : int) : string =
  let rec skip cps pos units =
    match cps with
    | [] -> cps, units
    | c :: rest ->
        let w = if c > 0xFFFF then 2 else 1 in
        if units + w > pos then cps, units else skip rest pos (units + w)
  in
  let cps = decode_utf8 s in
  let cps, u0 = skip cps start 0 in
  let rec take cps rem acc =
    match cps with
    | [] -> List.rev acc
    | c :: rest ->
        let w = if c > 0xFFFF then 2 else 1 in
        if w > rem then List.rev acc else take rest (rem - w) (c :: acc)
  in
  encode_utf8 (take cps (end_ - u0) [])
