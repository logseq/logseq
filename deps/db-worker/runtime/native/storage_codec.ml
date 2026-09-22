let encode (payload : Datascript.storage_payload) = Datascript_sqlite_codec.encode payload
let decode (content : string) : Datascript.storage_payload =
  Datascript_sqlite_codec.decode content

let encode_addresses addrs = "[" ^ String.concat "," addrs ^ "]"

let decode_addresses json =
  let len = String.length json in
  let rec skip_ws i =
    if i < len && (json.[i] = ' ' || json.[i] = '\t' || json.[i] = '\n') then skip_ws (i + 1) else i
  in
  let rec parse_int i acc =
    if i < len && json.[i] >= '0' && json.[i] <= '9' then
      parse_int (i + 1) (acc * 10 + (Char.code json.[i] - Char.code '0'))
    else (acc, i)
  in
  let rec loop i acc =
    let i = skip_ws i in
    if i >= len || json.[i] = ']' then List.rev acc
    else if json.[i] = ',' then loop (i + 1) acc
    else
      let n, i' = parse_int i 0 in
      loop i' (string_of_int n :: acc)
  in
  loop 0 []
