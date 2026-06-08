let max_safe_json_int = 9_007_199_254_740_991.

let is_integral_float value =
  Float.is_finite value
  && value = floor value
  && Float.abs value <= max_safe_json_int

let rec value_of_json json =
  match Js.Json.classify json with
  | JSONNull -> Edn_util.nil
  | JSONFalse -> Edn_util.bool false
  | JSONTrue -> Edn_util.bool true
  | JSONString value -> Edn_util.string value
  | JSONNumber value ->
      if is_integral_float value then Edn_util.int64 (Int64.of_float value)
      else Edn_util.float value
  | JSONArray values ->
      Edn_util.vector (values |> Array.to_list |> List.map value_of_json)
  | JSONObject fields ->
      fields |> Js.Dict.entries |> Array.to_list
      |> List.map (fun (key, value) ->
          (Edn_util.string key, value_of_json value))
      |> Edn_util.map

let value_of_json_string text = Js.Json.parseExn text |> value_of_json
let object_of_json_string text = Js.Json.decodeObject (Js.Json.parseExn text)

let json_of_string_fields fields =
  let object_ = Js.Dict.empty () in
  List.iter
    (fun (key, value) -> Js.Dict.set object_ key (Js.Json.string value))
    fields;
  Js.Json.object_ object_

let string_of_string_fields fields =
  fields |> json_of_string_fields |> Js.Json.stringify

let field object_ key = Js.Dict.get object_ key

let string_field object_ key =
  Option.bind (field object_ key) Js.Json.decodeString

let number_field object_ key =
  Option.bind (field object_ key) Js.Json.decodeNumber

let int64_field object_ key =
  match number_field object_ key with
  | Some value when is_integral_float value -> Some (Int64.of_float value)
  | _ -> None

let object_field object_ key =
  match field object_ key with
  | Some value -> Js.Json.decodeObject value
  | None -> None

let nested_string_field object_ object_key field_key =
  match object_field object_ object_key with
  | Some object_ ->
      Option.bind (Js.Dict.get object_ field_key) Js.Json.decodeString
  | None -> None
