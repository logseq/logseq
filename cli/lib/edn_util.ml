let any = Melange_edn.any
let keyword_t value = Melange_edn.keyword value

let keyword_to_string (value : Melange_edn.keyword Melange_edn.t) =
  match value with
  | Melange_edn.Keyword value -> Melange_edn.keyword_to_string value

let keyword_any value = any (keyword_t value)
let list_t values = Melange_edn.list values
let vector_t values = Melange_edn.vector values
let set_t values = Melange_edn.set values
let map_t fields = Melange_edn.map fields
let nil = any Melange_edn.nil
let bool value = any (Melange_edn.bool value)
let int value = any (Melange_edn.int (Int64.of_int value))
let int64 value = any (Melange_edn.int value)
let float value = any (Melange_edn.float value)
let string value = any (Melange_edn.string value)
let symbol value = any (Melange_edn.symbol value)
let keyword value = any (keyword_t value)
let uuid value = any (Melange_edn.tagged "uuid" (string value))

let bytes value =
  any (Melange_edn.tagged "transit/bytes" (string (Bytes.to_string value)))

let list values = any (list_t values)
let vector values = any (vector_t values)
let set values = any (set_t values)
let map fields = any (map_t fields)

let iarray_to_list values =
  List.init (Iarray.length values) (fun index -> Iarray.get values index)

let keyword_text value = Melange_edn.keyword_to_string value

let int64_to_int_opt value =
  let int_value = Int64.to_int value in
  if Int64.of_int int_value = value then Some int_value else None

let as_bool = function
  | Melange_edn.Any (Melange_edn.Bool value) -> Some value
  | _ -> None

let as_int = function
  | Melange_edn.Any (Melange_edn.Int value) -> int64_to_int_opt value
  | _ -> None

let as_int64 = function
  | Melange_edn.Any (Melange_edn.Int value) -> Some value
  | _ -> None

let as_float = function
  | Melange_edn.Any (Melange_edn.Float value) -> Some value
  | _ -> None

let as_string = function
  | Melange_edn.Any (Melange_edn.String value) -> Some value
  | _ -> None

let as_symbol = function
  | Melange_edn.Any (Melange_edn.Symbol value) -> Some value
  | _ -> None

let as_keyword = function
  | Melange_edn.Any (Melange_edn.Keyword value) -> Some (keyword_text value)
  | _ -> None

let as_keyword_t = function
  | Melange_edn.Any (Melange_edn.Keyword value) ->
      Some (keyword_t (Melange_edn.keyword_to_string value))
  | _ -> None

let as_uuid = function
  | Melange_edn.Any (Melange_edn.Tagged ("uuid", value)) -> as_string value
  | _ -> None

let as_bytes = function
  | Melange_edn.Any (Melange_edn.Tagged ("transit/bytes", value)) ->
      Option.map Bytes.of_string (as_string value)
  | _ -> None

let as_list = function
  | Melange_edn.Any (Melange_edn.List values) -> Some (iarray_to_list values)
  | _ -> None

let as_vector = function
  | Melange_edn.Any (Melange_edn.Vector values) -> Some (iarray_to_list values)
  | _ -> None

let as_vector_t = function
  | Melange_edn.Any (Melange_edn.Vector values) ->
      Some (Melange_edn.vector (iarray_to_list values))
  | _ -> None

let as_set = function
  | Melange_edn.Any (Melange_edn.Set values) -> Some (iarray_to_list values)
  | _ -> None

let as_map = function
  | Melange_edn.Any (Melange_edn.Map fields) -> Some (iarray_to_list fields)
  | _ -> None

let as_map_t = function
  | Melange_edn.Any (Melange_edn.Map fields) ->
      Some (Melange_edn.map (iarray_to_list fields))
  | _ -> None

let expect_vector_t label value =
  match as_vector_t value with
  | Some value -> value
  | None -> invalid_arg (label ^ " must be an EDN vector")

let expect_map_t label value =
  match as_map_t value with
  | Some value -> value
  | None -> invalid_arg (label ^ " must be an EDN map")

let is_null = function Melange_edn.Any Melange_edn.Nil -> true | _ -> false

let as_seq value =
  match (as_list value, as_vector value, as_set value) with
  | Some values, _, _ | _, Some values, _ | _, _, Some values -> Some values
  | _ -> None

let as_string_like value =
  match (as_string value, as_keyword value, as_uuid value) with
  | Some value, _, _ | _, Some value, _ | _, _, Some value -> Some value
  | _ -> None

let key_matches key field =
  match (as_keyword field, as_string field) with
  | Some value, _ | _, Some value -> value = key
  | _ -> false

let get value key =
  match as_map value with
  | Some fields ->
      fields
      |> List.find_map (fun (field, value) ->
          if key_matches key field then Some value else None)
  | None -> None

let get_string value key = Option.bind (get value key) as_string_like
let get_int value key = Option.bind (get value key) as_int
let get_int64 value key = Option.bind (get value key) as_int64
let get_bool value key = Option.bind (get value key) as_bool

let assoc key value raw =
  match as_map raw with
  | Some fields ->
      map
        ((keyword key, value)
        :: List.filter (fun (field, _) -> not (key_matches key field)) fields)
  | None -> map [ (keyword key, value); (keyword "_", raw) ]

let remove key raw =
  match as_map raw with
  | Some fields ->
      map (List.filter (fun (field, _) -> not (key_matches key field)) fields)
  | None -> raw
