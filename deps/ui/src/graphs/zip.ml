(* Minimal ZIP writer (STORE, no compression) — enough for the
   browser-side export downloads: export both SQLite DB + assets and
   the per-page Markdown bundle. *)

let crc_table = lazy (
  Array.init 256 (fun n ->
      let c = ref (Int32.of_int n) in
      for _ = 0 to 7 do
        c :=
          if Int32.logand !c 1l <> 0l then
            Int32.logxor (Int32.shift_right_logical !c 1) 0xEDB88320l
          else Int32.shift_right_logical !c 1
      done;
      !c))

let crc32 (s : string) : int32 =
  let table = Lazy.force crc_table in
  let c = ref 0xFFFFFFFFl in
  String.iter
    (fun ch ->
      let idx =
        Int32.logxor !c (Int32.of_int (Char.code ch))
        |> Int32.logand 0xFFl |> Int32.to_int
      in
      c := Int32.logxor table.(idx) (Int32.shift_right_logical !c 8))
    s;
  Int32.logxor !c 0xFFFFFFFFl

let u16 b n =
  Buffer.add_char b (Char.chr (n land 0xFF));
  Buffer.add_char b (Char.chr ((n lsr 8) land 0xFF))

let u32 b (n : int32) =
  Buffer.add_char b (Char.chr (Int32.to_int (Int32.logand n 0xFFl)));
  Buffer.add_char b
    (Char.chr (Int32.to_int (Int32.logand (Int32.shift_right_logical n 8) 0xFFl)));
  Buffer.add_char b
    (Char.chr (Int32.to_int (Int32.logand (Int32.shift_right_logical n 16) 0xFFl)));
  Buffer.add_char b
    (Char.chr (Int32.to_int (Int32.logand (Int32.shift_right_logical n 24) 0xFFl)))

type entry = { name : string; data : string; crc : int32; offset : int }

let build (files : (string * string) list) : string =
  let body = Buffer.create 4096 in
  let entries =
    List.map
      (fun (name, data) ->
        let offset = Buffer.length body in
        let crc = crc32 data in
        (* local file header *)
        u32 body 0x04034b50l;
        u16 body 20;
        u16 body 0;
        u16 body 0;
        u16 body 0;
        u16 body 0;
        u32 body crc;
        u32 body (Int32.of_int (String.length data));
        u32 body (Int32.of_int (String.length data));
        u16 body (String.length name);
        u16 body 0;
        Buffer.add_string body name;
        Buffer.add_string body data;
        { name; data; crc; offset })
      files
  in
  let cd = Buffer.create 1024 in
  List.iter
    (fun (e : entry) ->
      u32 cd 0x02014b50l;
      u16 cd 20;
      u16 cd 20;
      u16 cd 0;
      u16 cd 0;
      u16 cd 0;
      u16 cd 0;
      u32 cd e.crc;
      u32 cd (Int32.of_int (String.length e.data));
      u32 cd (Int32.of_int (String.length e.data));
      u16 cd (String.length e.name);
      u16 cd 0;
      u16 cd 0;
      u16 cd 0;
      u16 cd 0;
      u32 cd 0l;
      u32 cd (Int32.of_int e.offset);
      Buffer.add_string cd e.name)
    entries;
  let cd_offset = Buffer.length body in
  Buffer.add_buffer body cd;
  u32 body 0x06054b50l;
  u16 body 0;
  u16 body 0;
  u16 body (List.length entries);
  u16 body (List.length entries);
  u32 body (Int32.of_int (Buffer.length cd));
  u32 body (Int32.of_int cd_offset);
  u16 body 0;
  Buffer.contents body

(* Minimal ZIP reader (STORE + raw-DEFLATE extraction) — enough for the
   sqlite-zip graph import: central-directory parse + local-header seeks.
   DEFLATE payloads (method 8) are inflated by the caller via
   DecompressionStream; the reader itself stays pure OCaml. *)

type zip_entry =
  { e_name : string
  ; e_method : int
  ; e_csize : int
  ; e_offset : int (* offset of the local file header *)
  }

let rd_u16 s off =
  Char.code s.[off] lor (Char.code s.[off + 1] lsl 8)

let rd_u32 s off =
  Int32.logor
    (Int32.of_int (rd_u16 s off))
    (Int32.shift_left (Int32.of_int (rd_u16 s (off + 2))) 16)

let rd_i32 s off = Int32.to_int (rd_u32 s off)

let eocd_off s =
  let n = String.length s in
  let rec scan i =
    if i < 0 then -1
    else if
      i + 3 < n && s.[i] = 'P' && s.[i + 1] = 'K'
      && Char.code s.[i + 2] = 5 && Char.code s.[i + 3] = 6
    then i
    else scan (i - 1)
  in
  scan (n - 22)

let is_sig s p a b =
  p + 3 < String.length s
  && s.[p] = 'P'
  && s.[p + 1] = 'K'
  && Char.code s.[p + 2] = a
  && Char.code s.[p + 3] = b

let entries s : zip_entry list =
  match eocd_off s with
  | eo when eo < 0 -> []
  | eo ->
      let cd = rd_i32 s (eo + 16) in
      let n = String.length s in
      let rec loop p acc =
        if p + 46 > n || not (is_sig s p 1 2) then List.rev acc
        else
          let nlen = rd_u16 s (p + 28) in
          let e =
            { e_method = rd_u16 s (p + 10)
            ; e_csize = rd_i32 s (p + 20)
            ; e_offset = rd_i32 s (p + 42)
            ; e_name = String.sub s (p + 46) nlen
            }
          in
          loop
            (p + 46 + nlen + rd_u16 s (p + 30) + rd_u16 s (p + 32))
            (e :: acc)
      in
      loop cd []

(* compressed payload of an entry — seek its local header and skip the
   name/extra fields, then take e_csize bytes *)
let raw_data s (e : zip_entry) =
  let p = e.e_offset in
  if is_sig s p 3 4 then
    let start = p + 30 + rd_u16 s (p + 26) + rd_u16 s (p + 28) in
    if start + e.e_csize <= String.length s then
      String.sub s start e.e_csize
    else ""
  else ""
