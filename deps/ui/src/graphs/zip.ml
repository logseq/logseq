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
