let any = Melange_edn_melange.any
let keyword_t value = Melange_edn_melange.keyword value

let keyword_to_string
    (value : Melange_edn_melange.keyword Melange_edn_melange.t) =
  match value with
  | Melange_edn_melange.Keyword value ->
      Melange_edn_melange.keyword_to_string value

let keyword_any value = any (keyword_t value)
let list_t values = Melange_edn_melange.list values
let vector_t values = Melange_edn_melange.vector values
let set_t values = Melange_edn_melange.set values
let map_t fields = Melange_edn_melange.map fields
let nil = any Melange_edn_melange.nil
let bool value = any (Melange_edn_melange.bool value)
let int value = any (Melange_edn_melange.int (Int64.of_int value))
let int64 value = any (Melange_edn_melange.int value)
let float value = any (Melange_edn_melange.float value)
let string value = any (Melange_edn_melange.string value)
let symbol value = any (Melange_edn_melange.symbol value)
let keyword value = any (keyword_t value)
let uuid value = any (Melange_edn_melange.tagged "uuid" (string value))

let bytes value =
  any
    (Melange_edn_melange.tagged "transit/bytes"
       (string (Bytes.to_string value)))

let list values = any (list_t values)
let vector values = any (vector_t values)
let set values = any (set_t values)
let map fields = any (map_t fields)
let list_t_vec values = list_t (Vec.to_list values)
let vector_t_vec values = vector_t (Vec.to_list values)
let set_t_vec values = set_t (Vec.to_list values)
let map_t_vec fields = map_t (Vec.to_list fields)
let list_vec values = any (list_t_vec values)
let vector_vec values = any (vector_t_vec values)
let set_vec values = any (set_t_vec values)
let map_vec fields = any (map_t_vec fields)
let map_t_rev_vec fields = map_t_vec (Vec.rev fields)
let map_rev_vec fields = any (map_t_rev_vec fields)
let vec_of_array = Rrbvec.of_array
let keyword_text value = Melange_edn_melange.keyword_to_string value

let int64_to_int_opt value =
  let int_value = Int64.to_int value in
  if Int64.of_int int_value = value then Some int_value else None

let as_bool = function
  | Melange_edn_melange.Any (Melange_edn_melange.Bool value) -> Some value
  | _ -> None

let as_int = function
  | Melange_edn_melange.Any (Melange_edn_melange.Int value) ->
      int64_to_int_opt value
  | _ -> None

let as_int64 = function
  | Melange_edn_melange.Any (Melange_edn_melange.Int value) -> Some value
  | _ -> None

let as_float = function
  | Melange_edn_melange.Any (Melange_edn_melange.Float value) -> Some value
  | _ -> None

let raw_string = function
  | Melange_edn_melange.Any (Melange_edn_melange.String value) -> Some value
  | _ -> None

let as_string value =
  Option.map
    (fun value -> Ustring.(of_string value |> to_string))
    (raw_string value)

let as_symbol = function
  | Melange_edn_melange.Any (Melange_edn_melange.Symbol value) -> Some value
  | _ -> None

let as_keyword = function
  | Melange_edn_melange.Any (Melange_edn_melange.Keyword value) ->
      Some (keyword_text value)
  | _ -> None

let as_keyword_t = function
  | Melange_edn_melange.Any (Melange_edn_melange.Keyword value) ->
      Some (keyword_t (Melange_edn_melange.keyword_to_string value))
  | _ -> None

let as_uuid = function
  | Melange_edn_melange.Any (Melange_edn_melange.Tagged ("uuid", value)) ->
      as_string value
  | _ -> None

let as_bytes = function
  | Melange_edn_melange.Any
      (Melange_edn_melange.Tagged ("transit/bytes", value)) ->
      Option.map Bytes.of_string (raw_string value)
  | _ -> None

let as_list = function
  | Melange_edn_melange.Any (Melange_edn_melange.List values) ->
      Some (vec_of_array values)
  | _ -> None

let as_vector = function
  | Melange_edn_melange.Any (Melange_edn_melange.Vector values) ->
      Some (vec_of_array values)
  | _ -> None

let as_vector_t = function
  | Melange_edn_melange.Any (Melange_edn_melange.Vector values) ->
      Some (vector_t_vec (vec_of_array values))
  | _ -> None

let as_set = function
  | Melange_edn_melange.Any (Melange_edn_melange.Set values) ->
      Some (vec_of_array values)
  | _ -> None

let as_map = function
  | Melange_edn_melange.Any (Melange_edn_melange.Map fields) ->
      Some (vec_of_array fields)
  | _ -> None

let as_map_t = function
  | Melange_edn_melange.Any (Melange_edn_melange.Map fields) ->
      Some (map_t_vec (vec_of_array fields))
  | _ -> None

let expect_vector_t label value =
  match as_vector_t value with
  | Some value -> value
  | None -> invalid_arg (label ^ " must be an EDN vector")

let expect_map_t label value =
  match as_map_t value with
  | Some value -> value
  | None -> invalid_arg (label ^ " must be an EDN map")

let is_null = function
  | Melange_edn_melange.Any Melange_edn_melange.Nil -> true
  | _ -> false

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
      |> Vec.find_map (fun (field, value) ->
          if key_matches key field then Some value else None)
  | None -> None

let get_string value key = Option.bind (get value key) as_string_like
let get_int value key = Option.bind (get value key) as_int
let get_int64 value key = Option.bind (get value key) as_int64
let get_bool value key = Option.bind (get value key) as_bool

let assoc key value raw =
  match as_map raw with
  | Some fields ->
      map_vec
        (Vec.push_front
           (Vec.filter (fun (field, _) -> not (key_matches key field)) fields)
           (keyword key, value))
  | None ->
      map_vec (Vec.of_array [| (keyword key, value); (keyword "_", raw) |])

let remove key raw =
  match as_map raw with
  | Some fields ->
      map_vec
        (fields |> Vec.filter (fun (field, _) -> not (key_matches key field)))
  | None -> raw
