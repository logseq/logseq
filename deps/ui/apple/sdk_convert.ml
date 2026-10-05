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

let camel_of_snake s =
  let b = Buffer.create (String.length s) in
  let up = ref false in
  String.iter
    (fun c ->
      if c = '-' || c = '_' then up := true
      else if !up then ( Buffer.add_char b (Char.uppercase_ascii c); up := false )
      else Buffer.add_char b c)
    s;
  Buffer.contents b

let json_name_of_keyword ~camel (k : string) : string =
  let k =
    match String.index_opt k '/' with
    | Some i -> String.sub k (i + 1) (String.length k - i - 1)
    | None -> k
  in
  if camel then camel_of_snake k else k

let map_key_json ~camel (k : 'a) : string =
  match k with
  | Wire.Keyword s | Wire.String s -> json_name_of_keyword ~camel s
  | _ -> ""

let hidden_key (k : 'a) : bool =
  match k with
  | Wire.Keyword s | Wire.String s ->
      String.length s > 0 && s.[0] = '_'
  | _ -> true

let rec json_of_wire ?(camel = true) (w : 'a) : Js.Json.t =
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
      Js.Json.JObject
        (List.filter_map
           (fun (k, v) ->
             if hidden_key k then None
             else Some (map_key_json ~camel k, json_of_wire ~camel v))
           kvs)

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

let result_json_of_wire w = json_of_wire w
