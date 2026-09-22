(* JSON via Js.Json. Numbers that fit an int round-trip as Int64 to
   keep timeout-ms/epoch fields typed; everything else stays Float. *)

let rec wire_of_json json =
  match Js.Json.classify json with
  | Js.Json.JSONFalse -> Wire.Bool false
  | Js.Json.JSONTrue -> Wire.Bool true
  | Js.Json.JSONNull -> Wire.Nil
  | Js.Json.JSONString s -> Wire.String s
  | Js.Json.JSONNumber f ->
      if Float.is_integer f then Wire.Int64 (Int64.of_float f) else Wire.Float f
  | Js.Json.JSONObject o ->
      Wire.Map
        (Array.to_list
           (Array.map
              (fun (k, v) -> (Wire.String k, wire_of_json v))
              (Js.Dict.entries o)))
  | Js.Json.JSONArray a -> Wire.Array (Array.to_list (Array.map wire_of_json a))

let parse s = wire_of_json (Js.Json.parseExn s)

let name_part s =
  match String.rindex_opt s '/' with
  | Some i -> String.sub s (i + 1) (String.length s - i - 1)
  | None -> s

let key_name = function
  | Wire.String s -> s
  | Wire.Keyword s -> name_part s
  | _ -> invalid_arg "Json.stringify: map key must be string or keyword"

let rec json_of_wire = function
  | Wire.Nil -> Js.Json.null
  | Wire.Bool b -> Js.Json.boolean b
  | Wire.Int i -> Js.Json.number (Float.of_int i)
  | Wire.Int64 i -> Js.Json.number (Int64.to_float i)
  | Wire.Float f -> Js.Json.number f
  | Wire.String s -> Js.Json.string s
  | Wire.Keyword s -> Js.Json.string (name_part s)
  | Wire.Uuid s | Wire.Uri s -> Js.Json.string s
  | Wire.Date_ms ms -> Js.Json.number (Int64.to_float ms)
  | Wire.Array xs | Wire.List xs | Wire.Set xs ->
      Js.Json.array (Array.map json_of_wire (Array.of_list xs))
  | Wire.Map kvs ->
      Js.Json.object_
        (Js.Dict.fromList
           (List.map (fun (k, v) -> (key_name k, json_of_wire v)) kvs))
  | Wire.Binary _ -> invalid_arg "Json.stringify: Binary values unsupported"
  | Wire.Symbol s -> Js.Json.string s
  | Wire.Big_decimal s | Wire.Big_int s -> Js.Json.string s
  | Wire.Tagged (tag, _) ->
      invalid_arg ("Json.stringify: tagged value unsupported: " ^ tag)

let stringify w = Js.Json.stringify (json_of_wire w)
