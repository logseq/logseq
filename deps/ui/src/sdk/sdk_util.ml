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
let resolved_result w = resolved (Sdk_convert.result_json_of_wire w)
let resolved_nil = resolved Js.Json.null

(* worker invoke + result->js (property-refs->ids) — every read API
   that returns entities uses this except get-block (which keeps
   compact-normalized-refs semantics) *)
let call name args =
  Runtime.invoke name args
  |> Js.Promise.then_ (fun w -> resolved (Sdk_convert.result_json_of_wire w))

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

(* db-ident/normalize-ident-name-part: keep alnum + =*+!_'?<>=-, and
   prefix NUM- when the name starts with a digit *)
let ident_char_ok c =
  ('a' <= c && c <= 'z')
  || ('A' <= c && c <= 'Z')
  || ('0' <= c && c <= '9')
  || String.contains "=*+!_'?<>=-" c

let normalize_ident_name s =
  let s = if String.length s > 0 && s.[0] >= '0' && s.[0] <= '9'
          then "NUM-" ^ s else s in
  String.to_seq s |> Seq.filter ident_char_ok |> String.of_seq

(* property-name->title: trim, strip leading ':', trim *)
let property_title name =
  String.trim (trim_leading name)

(* sanitize-user-property-name: trim, remove spaces, strip leading :_\s *)
let sanitize_property_name name =
  let s = String.trim name |> trim_leading in
  String.to_seq s |> Seq.filter (fun c -> c <> ' ') |> String.of_seq

(* property ident: unqualified names live in the test-plugin ns *)
let property_ident name =
  let stripped = property_title name in
  if String.contains stripped '/' then stripped
  else "plugin.property._test_plugin/" ^ normalize_ident_name stripped

(* transit vectors may decode as Array or List — treat both as seqs *)
let wire_elems w =
  match w with
  | Wire.Array xs | Wire.List xs | Wire.Set xs -> xs
  | _ -> []

(* get-blocks result element: {id, block} pair map *)
let block_of_pair pair =
  match Wire.get pair "block" with
  | Some res -> Some res
  | None -> (
      match wire_elems pair with
      | [ _; res ] -> Some res
      | _ -> None)

let get_many ids =
  Runtime.invoke2 "thread-api/get-blocks" (Wire.String (repo ()))
    (Wire.Array
       (List.map
          (fun id ->
            Wire.Map
              [ (Wire.String "id", id); (Wire.String "opts", Wire.Map []) ])
          ids))
  |> Js.Promise.then_ (fun w ->
         Js.Promise.resolve (List.map block_of_pair (wire_elems w)))

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

(* get-blocks [{id, opts}] -> [[{id, block?}...]] — resolve first result *)
let get_by_id id_wire =
  Runtime.invoke2 "thread-api/get-blocks" (Wire.String (repo ()))
    (Wire.Array
       [ Wire.Map
           [ (Wire.String "id", id_wire); (Wire.String "opts", Wire.Map []) ]
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

(* id-or-name -> entity wire (uuid / namespaced ident / page name).
   resolve_block_entity accepts page-name strings directly; when a
   name lookup misses and the string is qualified (ns/name) retry as
   a db ident (leading ':' stripped). *)
let get_entity id_or_name =
  get_by_id (Wire.String id_or_name)
  |> Js.Promise.then_ (fun w ->
         match w with
         | Wire.Nil when String.contains id_or_name '/' ->
             get_by_id (Wire.Keyword (trim_leading id_or_name))
         | _ -> Js.Promise.resolve w)

(* api args can be uuid strings, page names, db ids (numbers) or
   lookup maps like {id: n} / {uuid: "..."} — normalize to wire eid *)
let eid_wire_of_json (j : Js.Json.t) : Wire.t option =
  match Js.Json.classify j with
  | Js.Json.JSONNumber n -> Some (Wire.Int64 (Int64.of_float n))
  | Js.Json.JSONString s -> Some (Wire.String s)
  | Js.Json.JSONObject o -> (
      match Js.Dict.get o "id" with
      | Some n -> (
          match Js.Json.decodeNumber n with
          | Some f -> Some (Wire.Int64 (Int64.of_float f))
          | None -> None)
      | None -> (
          match Js.Dict.get o "uuid" with
          | Some u ->
              Option.map
                (fun s -> Wire.String s)
                (Js.Json.decodeString u)
          | None -> None))
  | _ -> None

let get_entity_json j =
  match eid_wire_of_json j with
  | Some (Wire.String s) -> get_entity s
  | Some w -> get_by_id w
  | None -> Js.Promise.resolve Wire.Nil

let get_entity_ident ident = get_by_id (Wire.Keyword ident)

(* entity/class? — :block/tags contains :logseq.class/Tag *)
let is_class_entity (w : Wire.t) =
  match Wire.get w "block/tags" with
  | Some tags ->
      List.exists
        (fun t ->
           match Wire.get t "db/ident" with
           | Some (Wire.Keyword s) | Some (Wire.String s) ->
               s = "logseq.class/Tag"
           | _ -> false)
        (wire_elems tags)
  | None -> false

let block_uuid_of (w : Wire.t) = Wire.map_get_uuid w "block/uuid"
