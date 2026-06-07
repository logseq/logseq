let k =
  [|
    0x428a2f98l;
    0x71374491l;
    0xb5c0fbcfl;
    0xe9b5dba5l;
    0x3956c25bl;
    0x59f111f1l;
    0x923f82a4l;
    0xab1c5ed5l;
    0xd807aa98l;
    0x12835b01l;
    0x243185bel;
    0x550c7dc3l;
    0x72be5d74l;
    0x80deb1fel;
    0x9bdc06a7l;
    0xc19bf174l;
    0xe49b69c1l;
    0xefbe4786l;
    0x0fc19dc6l;
    0x240ca1ccl;
    0x2de92c6fl;
    0x4a7484aal;
    0x5cb0a9dcl;
    0x76f988dal;
    0x983e5152l;
    0xa831c66dl;
    0xb00327c8l;
    0xbf597fc7l;
    0xc6e00bf3l;
    0xd5a79147l;
    0x06ca6351l;
    0x14292967l;
    0x27b70a85l;
    0x2e1b2138l;
    0x4d2c6dfcl;
    0x53380d13l;
    0x650a7354l;
    0x766a0abbl;
    0x81c2c92el;
    0x92722c85l;
    0xa2bfe8a1l;
    0xa81a664bl;
    0xc24b8b70l;
    0xc76c51a3l;
    0xd192e819l;
    0xd6990624l;
    0xf40e3585l;
    0x106aa070l;
    0x19a4c116l;
    0x1e376c08l;
    0x2748774cl;
    0x34b0bcb5l;
    0x391c0cb3l;
    0x4ed8aa4al;
    0x5b9cca4fl;
    0x682e6ff3l;
    0x748f82eel;
    0x78a5636fl;
    0x84c87814l;
    0x8cc70208l;
    0x90befffal;
    0xa4506cebl;
    0xbef9a3f7l;
    0xc67178f2l;
  |]

let initial =
  [|
    0x6a09e667l;
    0xbb67ae85l;
    0x3c6ef372l;
    0xa54ff53al;
    0x510e527fl;
    0x9b05688cl;
    0x1f83d9abl;
    0x5be0cd19l;
  |]

let ( +! ) = Int32.add
let ( ^! ) = Int32.logxor
let ( &! ) = Int32.logand
let ( |! ) = Int32.logor
let lnot = Int32.lognot
let shr = Int32.shift_right_logical
let shl = Int32.shift_left
let rotr value bits = shr value bits |! shl value (32 - bits)
let ch x y z = (x &! y) ^! (lnot x &! z)
let maj x y z = (x &! y) ^! (x &! z) ^! (y &! z)
let big_sigma0 x = rotr x 2 ^! rotr x 13 ^! rotr x 22
let big_sigma1 x = rotr x 6 ^! rotr x 11 ^! rotr x 25
let small_sigma0 x = rotr x 7 ^! rotr x 18 ^! shr x 3
let small_sigma1 x = rotr x 17 ^! rotr x 19 ^! shr x 10
let byte text index = Char.code (String.get text index)

let word_at text offset =
  shl (Int32.of_int (byte text offset)) 24
  |! shl (Int32.of_int (byte text (offset + 1))) 16
  |! shl (Int32.of_int (byte text (offset + 2))) 8
  |! Int32.of_int (byte text (offset + 3))

let padded text =
  let len = String.length text in
  let rem = (len + 1 + 8) mod 64 in
  let zeroes = if rem = 0 then 0 else 64 - rem in
  let total = len + 1 + zeroes + 8 in
  let bytes = Bytes.make total '\000' in
  Bytes.blit_string text 0 bytes 0 len;
  Bytes.set bytes len '\x80';
  let bit_len = Int64.mul (Int64.of_int len) 8L in
  for i = 0 to 7 do
    let shift = (7 - i) * 8 in
    let value =
      Int64.(to_int (logand (shift_right_logical bit_len shift) 0xffL))
    in
    Bytes.set bytes (total - 8 + i) (Char.chr value)
  done;
  Bytes.unsafe_to_string bytes

let digest text =
  let text = padded text in
  let h = Array.copy initial in
  let w = Array.make 64 0l in
  for chunk = 0 to (String.length text / 64) - 1 do
    let base = chunk * 64 in
    for i = 0 to 15 do
      w.(i) <- word_at text (base + (i * 4))
    done;
    for i = 16 to 63 do
      w.(i) <-
        small_sigma1 w.(i - 2)
        +! w.(i - 7)
        +! small_sigma0 w.(i - 15)
        +! w.(i - 16)
    done;
    let a = ref h.(0) in
    let b = ref h.(1) in
    let c = ref h.(2) in
    let d = ref h.(3) in
    let e = ref h.(4) in
    let f = ref h.(5) in
    let g = ref h.(6) in
    let h0 = ref h.(7) in
    for i = 0 to 63 do
      let t1 = !h0 +! big_sigma1 !e +! ch !e !f !g +! k.(i) +! w.(i) in
      let t2 = big_sigma0 !a +! maj !a !b !c in
      h0 := !g;
      g := !f;
      f := !e;
      e := !d +! t1;
      d := !c;
      c := !b;
      b := !a;
      a := t1 +! t2
    done;
    h.(0) <- h.(0) +! !a;
    h.(1) <- h.(1) +! !b;
    h.(2) <- h.(2) +! !c;
    h.(3) <- h.(3) +! !d;
    h.(4) <- h.(4) +! !e;
    h.(5) <- h.(5) +! !f;
    h.(6) <- h.(6) +! !g;
    h.(7) <- h.(7) +! !h0
  done;
  h

let hex text =
  digest text |> Array.to_list
  |> List.map (fun word -> Printf.sprintf "%08lx" word)
  |> String.concat ""

let raw text =
  let output = Bytes.create 32 in
  digest text
  |> Array.iteri (fun index word ->
      let base = index * 4 in
      Bytes.set output base
        (Char.chr Int32.(to_int (logand (shift_right_logical word 24) 0xffl)));
      Bytes.set output (base + 1)
        (Char.chr Int32.(to_int (logand (shift_right_logical word 16) 0xffl)));
      Bytes.set output (base + 2)
        (Char.chr Int32.(to_int (logand (shift_right_logical word 8) 0xffl)));
      Bytes.set output (base + 3) (Char.chr Int32.(to_int (logand word 0xffl))));
  Bytes.unsafe_to_string output

let base64url_alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"

let base64url_of_string text =
  let len = String.length text in
  let buffer = Buffer.create ((len + 2) / 3 * 4) in
  let rec loop index =
    if index >= len then Buffer.contents buffer
    else
      let b0 = byte text index in
      let b1 = if index + 1 < len then byte text (index + 1) else 0 in
      let b2 = if index + 2 < len then byte text (index + 2) else 0 in
      let n = (b0 lsl 16) lor (b1 lsl 8) lor b2 in
      Buffer.add_char buffer base64url_alphabet.[(n lsr 18) land 0x3f];
      Buffer.add_char buffer base64url_alphabet.[(n lsr 12) land 0x3f];
      if index + 1 < len then
        Buffer.add_char buffer base64url_alphabet.[(n lsr 6) land 0x3f];
      if index + 2 < len then
        Buffer.add_char buffer base64url_alphabet.[n land 0x3f];
      loop (index + 3)
  in
  loop 0

let base64url text = raw text |> base64url_of_string
let file_hex path = Cli_unix.read_binary_file path |> hex
