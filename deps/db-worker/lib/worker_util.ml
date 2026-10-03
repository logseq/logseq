(* logseq.frontend.worker-common.util (subset) — parse-jwt for the
   created-by pipeline hook. Only the fields pipeline.cljs reads
   (:sub, :cognito:username, :email) are extracted. *)

type jwt_claims =
  { sub : string
  ; username : string option
  ; email : string option }

(* base64url-decode (url-safe alphabet, optional padding). *)
let decode_base64url (s : string) : string =
  let value_of_char c =
    match c with
    | 'A' .. 'Z' -> Char.code c - Char.code 'A'
    | 'a' .. 'z' -> Char.code c - Char.code 'a' + 26
    | '0' .. '9' -> Char.code c - Char.code '0' + 52
    | '-' | '+' -> 62
    | '_' | '/' -> 63
    | _ -> -1
  in
  let b = Buffer.create (String.length s * 3 / 4 + 3) in
  let acc = ref 0 and nbits = ref 0 in
  String.iter
    (fun c ->
      let v = value_of_char c in
      if v >= 0 then begin
        acc := (!acc lsl 6) lor v;
        nbits := !nbits + 6;
        if !nbits >= 8 then begin
          nbits := !nbits - 8;
          Buffer.add_char b (Char.chr ((!acc lsr !nbits) land 0xff))
        end
      end)
    s;
  Buffer.contents b

(* Extract the JSON string value for [key] (e.g. "\"sub\"") from a flat
   JSON object payload; nested escapes handled. *)
let json_string_field (payload : string) (key : string) : string option =
  let needle = "\"" ^ key ^ "\"" in
  let n = String.length needle and len = String.length payload in
  let rec find i =
    if i + n > len then None
    else if String.sub payload i n = needle then Some (i + n)
    else find (i + 1)
  in
  match find 0 with
  | None -> None
  | Some j ->
      let k = ref j in
      while !k < len && (payload.[!k] = ' ' || payload.[!k] = ':'
                         || payload.[!k] = '\t' || payload.[!k] = '\n') do
        incr k
      done;
      if !k >= len || payload.[!k] <> '"' then None
      else begin
        incr k;
        let b = Buffer.create 32 in
        let stop = ref false in
        while !k < len && not !stop do
          match payload.[!k] with
          | '"' -> stop := true
          | '\\' when !k + 1 < len ->
              Buffer.add_char b payload.[!k + 1];
              k := !k + 2
          | c ->
              Buffer.add_char b c;
              incr k
        done;
        Some (Buffer.contents b)
      end

(* worker-util/parse-jwt *)
let parse_jwt (jwt : string) : jwt_claims option =
  match String.split_on_char '.' jwt with
  | [ _; payload; _ ] ->
      let payload = decode_base64url payload in
      (match json_string_field payload "sub" with
       | Some sub ->
           Some
             { sub
             ; username = json_string_field payload "cognito:username"
             ; email = json_string_field payload "email" }
       | None -> None)
  | _ -> None

(* worker-state/get-id-token *)
let get_id_token () : string option =
  match Worker_state.state_get "auth/id-token" with
  | Some (Wire.String s) -> Some s
  | _ -> None
