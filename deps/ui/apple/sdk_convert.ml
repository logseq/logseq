(* Native port of sdk/sdk_convert.ml — Wire<->Json conversion, real
   implementation (pure data, no DOM). *)

open Promise_ext

let json_obj (d : 'a Js.Dict.t) : Js.Json.t =
  (* heterogeneous dicts (api fns, opaque handles) can't be reified as
     Json natively — emit a stable object keyed the same so plugin
     name lookups work; values that are already Json pass through the
     dedicated json_of_wire path instead *)
  Js.Json.JObject
    (Hashtbl.fold (fun k _ acc -> (k, Js.Json.JString ("#sdk:" ^ k)) :: acc) d [])

let json_arr (a : Js.Json.t array) : Js.Json.t = Js.Json.JArray a

(* JS <-> Wire converters for the window.logseq api surface.
   Result side mirrors logseq.sdk.utils/normalize-keyword-for-json:
   keyword -> camelCase name when ns in {block,db,file} or unqualified,
   otherwise ":ns/name"; uuid -> string; sets -> arrays. *)

let is_ns_kept ns = not (ns = "block" || ns = "db" || ns = "file")

let split_ns s =
  match String.index_opt s '/' with
  | Some i ->
      (Some (String.sub s 0 i)
      , String.sub s (i + 1) (String.length s - i - 1))
  | None -> (None, s)

(* kebab-case/snake_case -> camelCase *)
let camel_case s =
  let b = Buffer.create (String.length s) in
  let up = ref false in
  String.iter
    (fun c ->
      if c = '-' || c = '_' then up := true
      else if !up then (
        Buffer.add_char b (Char.uppercase_ascii c);
        up := false)
      else Buffer.add_char b c)
    s;
  Buffer.contents b

(* keyword -> json name (map keys and keyword values).
   camel=false mirrors normalize-keyword-for-json's camel-case? nil
   path (datascript_query): keeps hyphenated names like journal-day *)
let json_name_of_keyword ?(camel = true) s =
  match split_ns s with
  | Some ns, _name when is_ns_kept ns -> ":" ^ s
  | _, name -> if camel then camel_case name else name

(* hidden keys removed from api results (remove-hidden-properties) *)
let hidden_key = function
  | Wire.Keyword "block/tx-id" -> true
  | Wire.Keyword s -> (
      match split_ns s with
      | Some "block.temp", _ -> true
      | _ -> false)
  | _ -> false

let rec map_key_json ?(camel = true) = function
  | Wire.Keyword s -> json_name_of_keyword ~camel s
  | Wire.String s -> s
  | Wire.Symbol s -> s
  | Wire.Uuid s -> s
  | other -> Js.Json.stringify (json_of_wire ~camel other)

(* entity map with uuid+title also exposes content/fullTitle — the
   kv-list encoding overwrites by removing an existing key first *)
and with_content_alias (w : Wire.t) (kvs : (string * Js.Json.t) list)
    : (string * Js.Json.t) list =
  match Wire.get w "block/uuid", Wire.get w "block/title" with
  | Some _, Some (Wire.String t) ->
      let has_full = List.exists (fun (k, _) -> k = "fullTitle") kvs in
      let kvs =
        ("content", Js.Json.JString t)
        :: List.filter (fun (k, _) -> k <> "content") kvs
      in
      if has_full then kvs
      else ("fullTitle", Js.Json.JString t) :: kvs
  | _ -> kvs

and json_of_wire ?(camel = true) (w : 'a) : Js.Json.t =
  match w with
  | Wire.Nil -> Js.Json.JNull
  | Wire.Bool b -> Js.Json.JBoolean b
  | Wire.Int n -> Js.Json.JNumber (float_of_int n)
  | Wire.Int64 n -> Js.Json.JNumber (Int64.to_float n)
  | Wire.Float f -> Js.Json.JNumber f
  | Wire.String s -> Js.Json.JString s
  | Wire.Binary s -> Js.Json.JString s
  | Wire.Date_ms n -> Js.Json.JNumber (Int64.to_float n)
  | Wire.Uuid s | Wire.Uri s -> Js.Json.JString s
  | Wire.Big_decimal s | Wire.Big_int s -> (
      match float_of_string_opt s with
      | Some f -> Js.Json.JNumber f
      | None -> Js.Json.JString s)
  | Wire.Keyword s -> Js.Json.JString (json_name_of_keyword ~camel s)
  | Wire.Symbol s -> Js.Json.JString s
  | Wire.Tagged (_, v) -> json_of_wire ~camel v
  | Wire.Array xs | Wire.List xs | Wire.Set xs ->
      json_arr (Array.of_list (List.map (json_of_wire ~camel) xs))
  | Wire.Map kvs ->
      let json_kvs =
        List.filter_map
          (fun (k, v) ->
            if hidden_key k then None
            else Some (map_key_json ~camel k, json_of_wire ~camel v))
          kvs
      in
      Js.Json.JObject (with_content_alias w json_kvs)

(* sdk-utils/property-refs->ids: on every map node, values under keys
   that are :block/tags or keep-json-keyword? (ns not in {block,db,file},
   or unqualified) get ref-value->ids — maps carrying :db/id collapse to
   the bare id, recursively. cljs result->js = property-refs->ids +
   normalize-keyword-for-json; get_block alone uses
   compact-normalized-refs (no reduction). *)
let key_reduces = function
  (* cljs requires (keyword? k) — string keys (e.g. readable-properties
     output) are never reduced *)
  | Wire.Keyword s -> (
      match s with
      | "block/tags" -> true
      | _ -> (
          match String.index_opt s '/' with
          | Some i -> (
              match String.sub s 0 i with
              | "block" | "db" | "file" -> false
              | _ -> true)
          | None -> true))
  | _ -> false

let rec ref_ids (w : Wire.t) : Wire.t =
  match w with
  | Wire.Map kvs -> (
      match Wire.get w "db/id" with
      | Some (Wire.Int n) -> Wire.Int n
      | Some (Wire.Int64 n) -> Wire.Int (Int64.to_int n)
      | _ ->
          Wire.Map (List.map (fun (k, v) -> (k, ref_ids v)) kvs))
  | Wire.Array xs -> Wire.Array (List.map ref_ids xs)
  | Wire.List xs -> Wire.List (List.map ref_ids xs)
  | Wire.Set xs -> Wire.Set (List.map ref_ids xs)
  | other -> other

let rec property_refs_to_ids (w : Wire.t) : Wire.t =
  match w with
  | Wire.Map kvs ->
      Wire.Map
        (List.map
           (fun (k, v) ->
             let v' = property_refs_to_ids v in
             (k, if key_reduces k then ref_ids v' else v'))
           kvs)
  | Wire.Array xs -> Wire.Array (List.map property_refs_to_ids xs)
  | Wire.List xs -> Wire.List (List.map property_refs_to_ids xs)
  | Wire.Set xs -> Wire.Set (List.map property_refs_to_ids xs)
  | other -> other

let rec wire_of_json (j : Js.Json.t) : 'a =
  match j with
  | Js.Json.JNull -> Wire.Nil
  | Js.Json.JBoolean b -> Wire.Bool b
  | Js.Json.JNumber n ->
      if Float.is_integer n then Wire.Int (int_of_float n)
      else Wire.Float n
  | Js.Json.JString s -> Wire.String s
  | Js.Json.JArray a ->
      Wire.List (List.map wire_of_json (Array.to_list a))
  | Js.Json.JObject kvs ->
      Wire.Map
        (List.map (fun (k, v) -> (Wire.Keyword k, wire_of_json v)) kvs)

let wire_to_string w = Js.Json.stringify (json_of_wire w)

let result_json_of_wire w = json_of_wire (property_refs_to_ids w)
