module Runtime_codec = Melange_cljs_runtime_spec.Value_codec
(** Typed DB workflows and their JavaScript-boundary representations. *)

module Datascript = Melange_datascript_spec.Api
module Kv_entity = Melange_db.Kv_entity

let rec encode_datalog_form runtime = function
  | Melange_db.Datalog_form.Symbol value ->
      Runtime_codec.symbol_from_string runtime value
  | Keyword value -> Runtime_codec.keyword_from_string runtime value
  | String_literal value -> Runtime_codec.string_to_value runtime value
  | Bool value -> Runtime_codec.bool_to_value runtime value
  | List_form values ->
      values
      |> Rrbvec.map (encode_datalog_form runtime)
      |> Rrbvec.to_array
      |> Runtime_codec.array_to_list runtime
  | Vector_form values ->
      values
      |> Rrbvec.map (encode_datalog_form runtime)
      |> Rrbvec.to_array
      |> Runtime_codec.array_to_vector runtime

let value_is_collection runtime value =
  Runtime_codec.value_is_vector runtime value
  || Runtime_codec.value_is_set runtime value
  || Runtime_codec.value_is_sequential runtime value

let entity_tag_texts runtime datascript entity =
  let database =
    Datascript.entity_database datascript entity |> Js.Nullable.toOption
  in
  let resolve_tag tag =
    if Datascript.entity_is datascript tag then tag
    else
      match database with
      | None -> tag
      | Some database ->
          Datascript.entity datascript database tag
          |> Js.Nullable.toOption |> Option.value ~default:tag
  in
  Melange_db.Entity_read.tag_ident_texts_with
    ~get:(fun value name ->
      Datascript.entity_get datascript value
        (Runtime_codec.keyword_from_string runtime name))
    ~collection_to_array:(Runtime_codec.collection_to_array runtime)
    ~is_collection:(value_is_collection runtime)
    ~is_keyword:(Runtime_codec.value_is_keyword runtime)
    ~keyword_to_string:(Runtime_codec.keyword_to_string runtime)
    ~resolve_tag entity

module Property_type = Melange_db.Property_type
