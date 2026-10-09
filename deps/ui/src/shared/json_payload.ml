(* Typed field decoders for JSON dom-event payloads (the "payload" arg
   reaching views as an optional JSON string). [None] reads as the empty
   object so callers don't need Option.value ~default:"{}"; malformed
   input raises Cmdk_json.Parse_error, matching the JSON.parse failure
   semantics the platform versions had. *)

let field json key = Cmdk_json.member key (match json with
  | Some s -> Cmdk_json.decode s
  | None -> Cmdk_json.Obj [])

let str json key =
  match field json key with
  | Some v -> Option.value (Cmdk_json.get_str v) ~default:""
  | None -> ""

(* same, keeping the option for callers that need presence *)
let str_opt json key =
  match field json key with
  | Some v -> Cmdk_json.get_str v
  | None -> None

let bool json key =
  match field json key with
  | Some (Cmdk_json.Bool b) -> b
  | _ -> false

let num json key =
  match field json key with
  | Some (Cmdk_json.Num n) -> n
  | _ -> 0.
