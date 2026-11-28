(* Minimal PNG encoder: truecolor RGBA8 (color type 6) with zlib stored
   (uncompressed) deflate blocks. Self-contained — no external codec
   dependency, correctness over size. *)

let crc_table =
  Array.init 256 (fun n ->
      let c = ref (Int32.of_int n) in
      for _ = 0 to 7 do
        c :=
          if Int32.logand !c 1l <> 0l then
            Int32.logxor 0xEDB88320l (Int32.shift_right_logical !c 1)
          else Int32.shift_right_logical !c 1
      done;
      !c)

let crc32 bytes off len =
  let c = ref 0xFFFFFFFFl in
  for i = off to off + len - 1 do
    let idx =
      Int32.to_int
        (Int32.logand (Int32.logxor !c (Int32.of_int (Char.code (Bytes.get bytes i)))) 0xFFl)
    in
    c := Int32.logxor crc_table.(idx) (Int32.shift_right_logical !c 8)
  done;
  Int32.logxor !c 0xFFFFFFFFl

let adler32 bytes =
  let a = ref 1 and b = ref 0 in
  Bytes.iter
    (fun ch ->
      a := (!a + Char.code ch) mod 65521;
      b := (!b + !a) mod 65521)
    bytes;
  Int32.logor
    (Int32.shift_left (Int32.of_int !b) 16)
    (Int32.of_int !a)

let be32 buf v =
  Buffer.add_char buf (Char.chr ((v lsr 24) land 0xFF));
  Buffer.add_char buf (Char.chr ((v lsr 16) land 0xFF));
  Buffer.add_char buf (Char.chr ((v lsr 8) land 0xFF));
  Buffer.add_char buf (Char.chr (v land 0xFF))

let chunk buf kind payload =
  be32 buf (Bytes.length payload);
  let start = Buffer.length buf in
  Buffer.add_string buf kind;
  Buffer.add_bytes buf payload;
  (* crc over type+data *)
  let tmp = Bytes.cat (Bytes.of_string kind) payload in
  be32 buf (Int32.to_int (crc32 tmp 0 (Bytes.length tmp)));
  ignore start

(* zlib stream of stored blocks: 2-byte header 0x78 0x01, then deflate
   stored blocks max 65535 each, then adler32 *)
let deflate_stored data =
  let len = Bytes.length data in
  let buf = Buffer.create (len + (len / 65535 * 5) + 16) in
  Buffer.add_char buf '\x78';
  Buffer.add_char buf '\x01';
  let rec go off =
    let remaining = len - off in
    let n = min 65535 remaining in
    let last = remaining <= 65535 in
    Buffer.add_char buf (if last then '\x01' else '\x00');
    Buffer.add_char buf (Char.chr (n land 0xFF));
    Buffer.add_char buf (Char.chr ((n lsr 8) land 0xFF));
    let nn = lnot n land 0xFFFF in
    Buffer.add_char buf (Char.chr (nn land 0xFF));
    Buffer.add_char buf (Char.chr ((nn lsr 8) land 0xFF));
    Buffer.add_subbytes buf data off n;
    if not last then go (off + n)
  in
  go 0;
  let a = adler32 data in
  be32 buf (Int32.to_int a);
  Buffer.contents buf

(* rgba: straight (non-premultiplied) RGBA bytes, row-major w*h*4 *)
let encode ~w ~h rgba =
  let stride = w * 4 in
  let raw = Buffer.create ((stride + 1) * h) in
  for y = 0 to h - 1 do
    Buffer.add_char raw '\x00'; (* filter none *)
    Buffer.add_subbytes raw rgba (y * stride) stride
  done;
  let raw_bytes = Bytes.of_string (Buffer.contents raw) in
  let idat = deflate_stored raw_bytes in
  let out = Buffer.create (Bytes.length raw_bytes + 128) in
  Buffer.add_string out "\x89PNG\r\n\x1a\n";
  let ihdr = Buffer.create 16 in
  be32 ihdr w;
  be32 ihdr h;
  Buffer.add_char ihdr '\x08'; (* bit depth 8 *)
  Buffer.add_char ihdr '\x06'; (* color type RGBA *)
  Buffer.add_char ihdr '\x00';
  Buffer.add_char ihdr '\x00';
  Buffer.add_char ihdr '\x00';
  chunk out "IHDR" (Bytes.of_string (Buffer.contents ihdr));
  chunk out "IDAT" (Bytes.of_string idat);
  chunk out "IEND" Bytes.empty;
  Buffer.contents out

(* Convert premultiplied RGBA to straight-alpha RGBA in place copy. *)
let unpremultiply rgba =
  let out = Bytes.copy rgba in
  for i = 0 to (Bytes.length out / 4) - 1 do
    let a = Char.code (Bytes.get out (i * 4 + 3)) in
    if a <> 0 && a <> 255 then
      for c = 0 to 2 do
        let v = Char.code (Bytes.get out (i * 4 + c)) in
        Bytes.set out (i * 4 + c) (Char.chr (min 255 ((v * 255 + a / 2) / a)))
      done
  done;
  out
