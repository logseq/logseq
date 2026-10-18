(* JSON via yojson — mirrors the melange Js.Json impl. *)

let rec wire_of_json (json : Yojson.Basic.t) : Wire.t =
  match json with
  | `Null -> Wire.Nil
  | `Bool b -> Wire.Bool b
  | `Int i -> Wire.Int i
  | `Float f -> Wire.Float f
  | `String s -> Wire.String s
  | `Assoc kvs -> Wire.Map (List.map (fun (k, v) -> (Wire.String k, wire_of_json v)) kvs)
  | `List xs -> Wire.Array (List.map wire_of_json xs)

let parse s = wire_of_json (Yojson.Basic.from_string s)

let name_part s =
  match String.rindex_opt s '/' with
  | Some i -> String.sub s (i + 1) (String.length s - i - 1)
  | None -> s

let key_name = function
  | Wire.String s -> s
  | Wire.Keyword s -> name_part s
  | _ -> invalid_arg "Json.stringify: map key must be string or keyword"

let rec json_of_wire : Wire.t -> Yojson.Basic.t = function
  | Wire.Nil -> `Null
  | Wire.Bool b -> `Bool b
  | Wire.Int i -> `Int i
  | Wire.Int64 i -> `Int (Int64.to_int i)
  | Wire.Float f -> `Float f
  | Wire.String s -> `String s
  | Wire.Keyword s -> `String (name_part s)
  | Wire.Uuid s | Wire.Uri s -> `String s
  | Wire.Date_ms ms -> `Int (Int64.to_int ms)
  | Wire.Array xs | Wire.List xs | Wire.Set xs -> `List (List.map json_of_wire xs)
  | Wire.Map kvs -> `Assoc (List.map (fun (k, v) -> (key_name k, json_of_wire v)) kvs)
  | Wire.Binary _ -> invalid_arg "Json.stringify: Binary values unsupported"
  | Wire.Symbol s -> `String s
  | Wire.Big_decimal s | Wire.Big_int s -> `String s
  | Wire.Tagged (tag, _) ->
      invalid_arg ("Json.stringify: tagged value unsupported: " ^ tag)

let stringify w = Yojson.Basic.to_string (json_of_wire w)
