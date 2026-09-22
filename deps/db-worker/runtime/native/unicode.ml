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
