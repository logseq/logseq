let random_int () = Js.Math.random_int 0 0x40000000

let random_bytes n =
  Bytes.init n (fun _ -> Char.chr (Js.Math.random_int 0 256)) |> Bytes.to_string

let hex n = Printf.sprintf "%x" n

let uuid () =
  (* v4 uuid *)
  let hexn len =
    let rec go acc = if String.length acc >= len then String.sub acc 0 len else go (acc ^ hex (random_int ())) in
    go ""
  in
  let a = hexn 8 and b = hexn 4 and c = hexn 4 and d = hexn 4 and e = hexn 12 in
  let set_byte s i v =
    let r = Stdlib.Random.int 16 in
    let c = if i = 0 then v else r in
    String.init (String.length s) (fun j -> if j = i then "0123456789abcdef".[c] else s.[j])
  in
  let b = set_byte b 0 4 in
  let c = set_byte c 0 (8 + Stdlib.Random.int 4) in
  String.concat "-" [ a; b; c; d; e ]
