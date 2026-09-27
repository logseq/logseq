(* Shared helpers for the logseq.api bridge methods. *)

let repo () =
  match !Runtime.current_repo with
  | Some r -> r
  | None -> ""

external as_undefined : Js.Json.t -> Js.Json.t Js.Undefined.t
  = "%identity"

(* api args arrive positionally; absent slots are undefined/null *)
let arg_is_nil j =
  Js.Undefined.toOption (as_undefined j) = None || j == Js.Json.null

let arg_wire j = if arg_is_nil j then Wire.Nil else Sdk_convert.wire_of_json j

let arg_string j =
  if arg_is_nil j then None else Js.Json.decodeString j

let arg_map j = if arg_is_nil j then Wire.Map [] else arg_wire j

let resolved j = Js.Promise.resolve j
let resolved_wire w = resolved (Sdk_convert.json_of_wire w)
let resolved_nil = resolved Js.Json.null

let call name args =
  Runtime.invoke name args
  |> Js.Promise.then_ (fun w -> resolved (Sdk_convert.json_of_wire w))

let is_hex c =
  ('0' <= c && c <= '9') || ('a' <= c && c <= 'f') || ('A' <= c && c <= 'F')

let is_uuid_string s =
  String.length s = 36
  && String.get s 8 = '-'
  && String.get s 13 = '-'
  && String.get s 18 = '-'
  && String.get s 23 = '-'
  && String.for_all (fun c -> is_hex c) (String.sub s 0 8)

let trim_leading s =
  let n = String.length s in
  let rec go i =
    if i >= n then n
    else
      match String.get s i with
      | ':' | '_' | ' ' | '\t' | '\n' -> go (i + 1)
      | _ -> i
  in
  String.sub s (go 0) (n - go 0)

let ident_char_ok c =
  (Char.code c >= 0x80)
  || ('a' <= c && c <= 'z')
  || ('A' <= c && c <= 'Z')
  || ('0' <= c && c <= '9')
  || c = '_' || c = '-'

(* property ident: unqualified names live in the test-plugin ns *)
let property_ident name =
  let stripped =
    String.trim name |> trim_leading
    |> String.map (fun c -> if c = ' ' then '_' else c)
  in
  if String.contains stripped '/' then stripped
  else
    "plugin.property._test_plugin/"
    ^ String.lowercase_ascii
        (String.map (fun c -> if ident_char_ok c then c else '_') stripped)

(* transit vectors may decode as Array or List — treat both as seqs *)
let wire_elems w =
  match w with
  | Wire.Array xs | Wire.List xs | Wire.Set xs -> xs
  | _ -> []

(* dispatch outliner ops; each op entry is [kw-name, [args...]].
   Response is {result: <last op result>, ...} — unwrap it. *)
let apply_ops ops opts =
  Runtime.invoke3 "thread-api/apply-outliner-ops"
    (Wire.String (repo ()))
    (Wire.Array ops)
    opts
  |> Js.Promise.then_ (fun w ->
         Js.Promise.resolve
           (match Wire.get w "result" with
            | Some r -> r
            | None -> Wire.Nil))

let apply_op op args =
  apply_ops [ Wire.Array [ Wire.Keyword op; Wire.Array args ] ]
    (Wire.Map [])

(* id-or-name -> entity wire (get-blocks by uuid, else case page) *)
let get_entity id_or_name =
  let repo = repo () in
  if is_uuid_string id_or_name then
    Runtime.invoke2 "thread-api/get-blocks" (Wire.String repo)
      (Wire.Array
         [ Wire.Map
             [ (Wire.String "id", Wire.String id_or_name)
             ; (Wire.String "opts", Wire.Map [])
             ]
         ])
    |> Js.Promise.then_ (fun w ->
           Js.Promise.resolve
             (match wire_elems w with
              | [ pair ] -> (
                  match Wire.get pair "block" with
                  | Some res -> res
                  | None -> (
                      match wire_elems pair with
                      | [ _; res ] -> res
                      | _ -> Wire.Nil))
              | _ -> Wire.Nil))
  else
    Runtime.invoke2 "thread-api/get-case-page" (Wire.String repo)
      (Wire.String id_or_name)

let block_uuid_of (w : Wire.t) = Wire.map_get_uuid w "block/uuid"
