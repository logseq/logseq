module Domain = Melange_db.Schema_version

type encoded = { major : int; minor : int Js.Nullable.t }

let encode version =
  ({
     major = Domain.major version;
     minor = Domain.minor version |> Js.Nullable.fromOption;
   }
    : encoded)

let decode major minor = Domain.make major (Js.Nullable.toOption minor)
let parseText value = Domain.parse value |> encode
let make major minor = decode major minor |> encode

let compare left_major left_minor right_major right_minor =
  Domain.compare (decode left_major left_minor) (decode right_major right_minor)

let toString major minor = decode major minor |> Domain.to_string
let version = encode Domain.version

let map_field runtime value name =
  Melange_cljs_runtime_spec.Value_codec.map_get runtime value
    (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime name)

let map_version runtime value =
  Melange_cljs_runtime_spec.Value_codec.value_is_map runtime value
  && map_field runtime value "major"
     |> Melange_cljs_runtime_spec.Value_codec.value_truthy runtime

let decode_parts runtime major minor =
  let major =
    Melange_cljs_runtime_spec.Value_codec.int_from_value runtime major
  in
  let minor =
    if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime minor then
      None
    else
      Some (Melange_cljs_runtime_spec.Value_codec.int_from_value runtime minor)
  in
  Domain.make major minor |> encode

let decodeValueWith runtime value =
  let decoded =
    if map_version runtime value then
      Some
        (decode_parts runtime
           (map_field runtime value "major")
           (map_field runtime value "minor"))
    else if
      Melange_cljs_runtime_spec.Value_codec.value_is_sequential runtime value
    then
      let values =
        Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime value
      in
      if
        Array.length values > 0
        && Melange_cljs_runtime_spec.Value_codec.value_truthy runtime values.(0)
      then
        Some
          (decode_parts runtime values.(0)
             (if Array.length values > 1 then values.(1)
              else Melange_cljs_runtime_spec.Value_codec.nil_value runtime))
      else None
    else if Melange_cljs_runtime_spec.Value_codec.value_is_integer runtime value
    then
      Some
        (Domain.make
           (Melange_cljs_runtime_spec.Value_codec.int_from_value runtime value)
           None
        |> encode)
    else if Melange_cljs_runtime_spec.Value_codec.value_is_string runtime value
    then
      Some
        (Melange_cljs_runtime_spec.Value_codec.string_from_value runtime value
        |> Domain.parse |> encode)
    else None
  in
  Js.Nullable.fromOption decoded

let valueIsVersionWith runtime value = map_version runtime value

let stringValueWith runtime value =
  let result =
    if Melange_cljs_runtime_spec.Value_codec.value_is_string runtime value then
      Some
        (Melange_cljs_runtime_spec.Value_codec.string_from_value runtime value)
    else if Melange_cljs_runtime_spec.Value_codec.value_is_integer runtime value
    then
      Some
        (Melange_cljs_runtime_spec.Value_codec.int_from_value runtime value
        |> string_of_int)
    else if map_version runtime value then
      let decoded =
        decode_parts runtime
          (map_field runtime value "major")
          (map_field runtime value "minor")
      in
      Some (toString decoded.major decoded.minor)
    else None
  in
  Js.Nullable.fromOption result

let requireValueWith runtime value =
  match decodeValueWith runtime value |> Js.Nullable.toOption with
  | Some value -> decode value.major value.minor
  | None -> invalid_arg "Invalid DB schema version value"

let compareValuesWith runtime left right =
  Domain.compare
    (requireValueWith runtime left)
    (requireValueWith runtime right)
