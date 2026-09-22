let random_state =
  let seed =
    try
      let ic = open_in_bin "/dev/urandom" in
      let b = Bytes.create 8 in
      really_input ic b 0 8;
      close_in ic;
      Bytes.get_int64_le b 0 |> Int64.to_int
    with _ -> int_of_float (Unix.gettimeofday () *. 1e6)
  in
  Stdlib.Random.State.make [| seed |]

let random_int () = Stdlib.Random.State.int random_state 0x40000000

let random_bytes n =
  Bytes.init n (fun _ -> Char.chr (Stdlib.Random.State.int random_state 256)) |> Bytes.to_string

let uuid () =
  let hexn len =
    let b = Buffer.create len in
    while Buffer.length b < len do
      Buffer.add_string b (Printf.sprintf "%x" (random_int ()))
    done;
    String.sub (Buffer.contents b) 0 len
  in
  let a = hexn 8 and b = hexn 4 and c = hexn 4 and d = hexn 4 and e = hexn 12 in
  let b = Printf.sprintf "4%s" (String.sub b 1 3) in
  let c = Printf.sprintf "%x%s" (8 + Stdlib.Random.State.int random_state 4) (String.sub c 1 3) in
  String.concat "-" [ a; b; c; d; e ]
