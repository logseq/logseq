module Runtime_codec = Melange_cljs_runtime_spec.Value_codec
module Datascript = Melange_datascript_spec.Api

let tag_texts runtime datascript entity =
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
    ~is_collection:(Runtime_value.is_collection runtime)
    ~is_keyword:(Runtime_codec.value_is_keyword runtime)
    ~keyword_to_string:(Runtime_codec.keyword_to_string runtime)
    ~resolve_tag entity
