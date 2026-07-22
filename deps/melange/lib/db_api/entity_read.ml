module Domain = Melange_db.Entity_read

type encoded_ancestor = {
  id : string Js.Nullable.t;
  hidden : bool;
  deleted : bool;
}

let decode_ancestors ancestors =
  ancestors
  |> Array.map (fun (ancestor : encoded_ancestor) ->
      ({
         id = Js.Nullable.toOption ancestor.id;
         hidden = ancestor.hidden;
         deleted = ancestor.deleted;
       }
        : Domain.ancestor))
  |> Rrbvec.of_array

let entity_type_name = function
  | Domain.Class -> "class"
  | Property -> "property"
  | Journal -> "journal"
  | Page -> "page"

let hasTag tags target = Domain.has_tag (Rrbvec.of_array tags) target

let entityTypes tags =
  tags |> Rrbvec.of_array |> Domain.entity_types
  |> Rrbvec.map entity_type_name
  |> Rrbvec.to_array

let hidden page_name recognized root_hidden root_deleted ancestors =
  Domain.hidden
    ~page_name:(Js.Nullable.toOption page_name)
    ~recognized ~root_hidden ~root_deleted
    (decode_ancestors ancestors)

let recycled recognized root_deleted ancestors =
  Domain.recycled ~recognized ~root_deleted (decode_ancestors ancestors)

let field runtime datascript value name =
  Support.Datascript.entity_get datascript value
    (Support.Runtime_codec.keyword_from_string runtime name)

let entity_like runtime datascript value =
  Support.Runtime_codec.value_is_map runtime value
  || Support.Datascript.entity_is datascript value

let tag_texts runtime datascript value =
  Support.entity_tag_texts runtime datascript value

let has_tag_bool runtime datascript value target =
  Domain.has_tag (tag_texts runtime datascript value) target

let hasTagWith runtime datascript value target =
  if entity_like runtime datascript value then
    Js.Nullable.return (has_tag_bool runtime datascript value target)
  else Js.Nullable.null

let internalPageWith runtime datascript value =
  has_tag_bool runtime datascript value "logseq.class/Page"

let classWith runtime datascript value =
  has_tag_bool runtime datascript value "logseq.class/Tag"

let propertyWith runtime datascript value =
  has_tag_bool runtime datascript value "logseq.class/Property"

let journalWith runtime datascript value =
  has_tag_bool runtime datascript value "logseq.class/Journal"

let pageWith runtime datascript value =
  if entity_like runtime datascript value then
    Js.Nullable.return
      (internalPageWith runtime datascript value
      || journalWith runtime datascript value
      || classWith runtime datascript value
      || propertyWith runtime datascript value)
  else Js.Nullable.null

let fieldPresentWith runtime datascript value name =
  field runtime datascript value name
  |> Support.Runtime_codec.value_is_nil runtime
  |> not

let fieldValueWith runtime datascript value name =
  field runtime datascript value name

let entityTypesWith runtime datascript value =
  tag_texts runtime datascript value
  |> Domain.entity_types
  |> Rrbvec.map entity_type_name
  |> Rrbvec.to_array

let hiddenWith runtime datascript value =
  Domain.hidden_value_with
    ~get:(fun value name -> field runtime datascript value name)
    ~is_nil:(Support.Runtime_codec.value_is_nil runtime)
    ~is_string:(Support.Runtime_codec.value_is_string runtime)
    ~string_from_value:(Support.Runtime_codec.string_from_value runtime)
    ~entity_like:(entity_like runtime datascript)
    ~truthy:(Support.Runtime_codec.value_truthy runtime)
    ~value_to_string:(Support.Runtime_codec.value_to_string runtime)
    value

let recycledWith runtime datascript value =
  Domain.recycled_value_with
    ~get:(fun value name -> field runtime datascript value name)
    ~is_nil:(Support.Runtime_codec.value_is_nil runtime)
    ~entity_like:(entity_like runtime datascript)
    ~truthy:(Support.Runtime_codec.value_truthy runtime)
    ~value_to_string:(Support.Runtime_codec.value_to_string runtime)
    value

let entityToMapWith runtime datascript entity =
  let map =
    entity
    |> Support.Runtime_codec.map_to_entries runtime
    |> Support.Runtime_codec.entries_to_map runtime
  in
  Support.Runtime_codec.map_assoc runtime map
    (Support.Runtime_codec.keyword_from_string runtime "db/id")
    (field runtime datascript entity "db/id")

let pagesByNameWith runtime datascript database page_name =
  Domain.pages_by_name_with
    ~datoms:(fun attribute value ->
      Support.Datascript.datoms datascript database
        (Support.Runtime_codec.keyword_from_string runtime "avet")
        [| attribute; Support.Runtime_codec.string_to_value runtime value |])
    ~name_attribute:
      (Support.Runtime_codec.keyword_from_string runtime "block/name")
    ~normalize:Melange_common.String_util.page_name_sanity_lower page_name
