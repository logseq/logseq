(* Native boundary between the portable Json.t tree and this runtime's
   Js.Json variant — plus the opaque-object builders (json_obj/json_arr)
   matching the web adapter's surface. *)

let json_obj (d : 'a Js.Dict.t) : Js.Json.t =
  (* heterogeneous dicts (api fns, opaque handles) can't be reified as
     Json natively — emit a stable object keyed the same so plugin
     name lookups work; values that are already Json pass through the
     dedicated json_of_wire path instead *)
  Js.Json.JObject
    (Hashtbl.fold (fun k _ acc -> (k, Js.Json.JString ("#sdk:" ^ k)) :: acc) d [])

let json_arr (a : Js.Json.t array) : Js.Json.t = Js.Json.JArray a

let rec to_js (j : Json.t) : Js.Json.t =
  match j with
  | Json.Null -> Js.Json.JNull
  | Json.Bool b -> Js.Json.JBoolean b
  | Json.Number n -> Js.Json.JNumber n
  | Json.String s -> Js.Json.JString s
  | Json.Array a -> Js.Json.JArray (Array.map to_js a)
  | Json.Object kvs ->
      Js.Json.JObject (List.map (fun (k, v) -> (k, to_js v)) kvs)

let rec of_js (v : Js.Json.t) : Json.t =
  match v with
  | Js.Json.JNull -> Json.Null
  | Js.Json.JBoolean b -> Json.Bool b
  | Js.Json.JNumber n -> Json.Number n
  | Js.Json.JString s -> Json.String s
  | Js.Json.JArray a -> Json.Array (Array.map of_js a)
  | Js.Json.JObject kvs ->
      Json.Object (List.map (fun (k, v) -> (k, of_js v)) kvs)
