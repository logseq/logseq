let encode payload = Datascript_melange_storage.encode payload
let decode content = Datascript_melange_storage.decode content

let encode_addresses addrs = "[" ^ String.concat "," addrs ^ "]"

let decode_addresses json =
  let json = String.trim json in
  let len = String.length json in
  let invalid () = invalid_arg "Invalid storage address array" in
  if len < 2 || json.[0] <> '[' || json.[len - 1] <> ']' then invalid ();
  let contents = String.trim (String.sub json 1 (len - 2)) in
  if contents = "" then []
  else
    String.split_on_char ',' contents
    |> List.map (fun token ->
        let address = String.trim token in
        if address = ""
           || not (String.for_all (fun c -> c >= '0' && c <= '9') address)
           || (String.length address > 1 && address.[0] = '0')
        then invalid ();
        (try ignore (Int64.of_string address) with Failure _ -> invalid ());
        address)
