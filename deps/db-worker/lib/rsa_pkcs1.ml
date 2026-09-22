(* RSASSA-PKCS1-v1_5 signature verification (SHA-256).

   Pure OCaml so it compiles on both the native and Melange targets
   without new platform-spec capabilities. Verification is a public-key
   operation — no secret data flows through it, so non-constant-time
   arithmetic is fine. Exponents in practice are 65537, so
   square-and-multiply does ~word-size work.

   Bignums are little-endian limb arrays, 14 bits per limb: products fit
   in 30 bits, safe for 31-bit ints and JS numbers alike. *)

type bignum = int array

let limb_bits = 14
let limb_base = 1 lsl limb_bits
let limb_mask = limb_base - 1

let trim (a : int array) : int array =
  let n = ref (Array.length a) in
  while !n > 0 && a.(!n - 1) = 0 do
    decr n
  done;
  Array.sub a 0 !n

(* big-endian byte string -> bignum *)
let of_be_bytes (s : string) : bignum =
  let n = String.length s in
  let count = (n * 8 + limb_bits - 1) / limb_bits in
  let a = Array.make count 0 in
  for bit = 0 to (n * 8) - 1 do
    let byte_i = n - 1 - (bit / 8) in
    if (Char.code s.[byte_i] lsr (bit land 7)) land 1 = 1 then
      a.(bit / limb_bits) <- a.(bit / limb_bits) lor (1 lsl (bit mod limb_bits))
  done;
  trim a

(* bignum -> big-endian byte string of exactly [len] bytes *)
let to_be_bytes ~(len : int) (a : bignum) : string =
  let b = Bytes.make len '\x00' in
  for i = 0 to len - 1 do
    let bit = i * 8 in
    let limb = bit / limb_bits in
    (if limb < Array.length a then
       let v =
         (a.(limb) lsr (bit mod limb_bits))
         lor
         (if limb + 1 < Array.length a && bit mod limb_bits > limb_bits - 8 then
            a.(limb + 1) lsl (limb_bits - (bit mod limb_bits))
          else 0)
       in
       Bytes.set b (len - 1 - i) (Char.chr (v land 0xFF)))
  done;
  Bytes.unsafe_to_string b

let compare (a : bignum) (b : bignum) : int =
  if Array.length a <> Array.length b then
    Stdlib.compare (Array.length a) (Array.length b)
  else
    let rec go i =
      if i < 0 then 0
      else if a.(i) <> b.(i) then Stdlib.compare a.(i) b.(i)
      else go (i - 1)
    in
    go (Array.length a - 1)

(* a - b, requires a >= b *)
let sub (a : bignum) (b : bignum) : bignum =
  let n = Array.length a in
  let r = Array.copy a in
  let borrow = ref 0 in
  for i = 0 to n - 1 do
    let bi = if i < Array.length b then b.(i) else 0 in
    let d = r.(i) - bi - !borrow in
    if d < 0 then (
      r.(i) <- d + limb_base;
      borrow := 1)
    else (
      r.(i) <- d;
      borrow := 0)
  done;
  trim r

(* a*2 + bit *)
let shl_add (a : bignum) (bit : int) : bignum =
  let n = Array.length a in
  let r = Array.make (n + 1) 0 in
  let carry = ref bit in
  for i = 0 to n - 1 do
    let v = (a.(i) lsl 1) + !carry in
    r.(i) <- v land limb_mask;
    carry := v lsr limb_bits
  done;
  r.(n) <- !carry;
  trim r

let mul (a : bignum) (b : bignum) : bignum =
  let la = Array.length a and lb = Array.length b in
  if la = 0 || lb = 0 then [||]
  else
    let r = Array.make (la + lb + 1) 0 in
    for i = 0 to la - 1 do
      let carry = ref 0 in
      for j = 0 to lb - 1 do
        let t = (a.(i) * b.(j)) + r.(i + j) + !carry in
        r.(i + j) <- t land limb_mask;
        carry := t lsr limb_bits
      done;
      let k = ref (i + lb) in
      while !carry > 0 do
        let t = r.(!k) + !carry in
        r.(!k) <- t land limb_mask;
        carry := t lsr limb_bits;
        incr k
      done
    done;
    trim r

(* x mod m: binary long division over x's bits, MSB first *)
let mod_bn (x : bignum) (m : bignum) : bignum =
  let rec loop r i j =
    if i < 0 then r
    else if j < 0 then loop r (i - 1) (limb_bits - 1)
    else
      let bit = (x.(i) lsr j) land 1 in
      let r' = shl_add r bit in
      let r'' = if compare r' m >= 0 then sub r' m else r' in
      loop r'' i (j - 1)
  in
  loop [||] (Array.length x - 1) (limb_bits - 1)

let mul_mod (a : bignum) (b : bignum) (m : bignum) : bignum =
  mod_bn (mul a b) m

(* base ^ exponent mod modulus *)
let pow_mod ~(base : bignum) ~(exponent : bignum) ~(modulus : bignum)
    : bignum =
  let r = ref [| 1 |] and b = ref (mod_bn base modulus) in
  for i = 0 to Array.length exponent - 1 do
    let e = exponent.(i) in
    for j = 0 to limb_bits - 1 do
      if (e lsr j) land 1 = 1 then r := mul_mod !r !b modulus;
      b := mul_mod !b !b modulus
    done
  done;
  trim !r

(* DER DigestInfo prefix for SHA-256 (RFC 8017 EMSA-PKCS1-v1_5). *)
let sha256_der_prefix =
  "\x30\x31\x30\x0d\x06\x09\x60\x86\x48\x01\x65\x03\x04\x02\x01\x05\x00\x04\x20"

let hex_byte (s : string) (i : int) : char =
  Char.chr (int_of_string ("0x" ^ String.sub s (i * 2) 2))

(* verify ~n ~e ~signature ~data — JWK n/e are base64url, signature and
   data are raw byte strings. Returns the subtle.verify boolean. *)
let verify ~(n : string) ~(e : string) ~(signature : string)
    ~(data : string) : bool Db_worker_effect.t =
  Db_worker_effect.map
    (fun digest_hex ->
       let digest =
         String.init (String.length digest_hex / 2) (hex_byte digest_hex)
       in
       let n_bytes = Worker_util.decode_base64url n in
       let e_bytes = Worker_util.decode_base64url e in
       let n_bn = of_be_bytes n_bytes in
       let e_bn = of_be_bytes e_bytes in
       let s_bn = of_be_bytes signature in
       if compare s_bn n_bn >= 0 then false
       else
         let m = pow_mod ~base:s_bn ~exponent:e_bn ~modulus:n_bn in
         let k = String.length n_bytes in
         let em = to_be_bytes ~len:k m in
         let expected =
           "\x00\x01"
           ^ String.make (k - 3 - String.length sha256_der_prefix - 32)
               '\xff'
           ^ "\x00" ^ sha256_der_prefix ^ digest
         in
         String.equal em expected)
    (Crypto.sha256_hex data)
