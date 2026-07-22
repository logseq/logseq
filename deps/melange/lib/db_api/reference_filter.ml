module Domain = Melange_db.Reference_filter

type encoded_node = {
  id : string;
  parent : string Js.Nullable.t;
  ownRefs : string array;
  children : string array;
  classOk : bool;
}

type encoded_result = { topIds : string array; childIds : string array }

let select nodes top_ids includes excludes =
  let result =
    nodes
    |> Array.map (fun (node : encoded_node) ->
        ({
           id = node.id;
           parent = Js.Nullable.toOption node.parent;
           own_refs = Rrbvec.of_array node.ownRefs;
           children = Rrbvec.of_array node.children;
           class_ok = node.classOk;
         }
          : Domain.node))
    |> Rrbvec.of_array
    |> Domain.select ~top_ids:(Rrbvec.of_array top_ids)
         ~includes:(Rrbvec.of_array includes)
         ~excludes:(Rrbvec.of_array excludes)
  in
  {
    topIds = Rrbvec.to_array result.top_ids;
    childIds = Rrbvec.to_array result.child_ids;
  }

let unlinkedWith runtime datascript database target_id =
  let keyword name =
    Support.Runtime_codec.keyword_from_string runtime name
  in
  let field entity name =
    Support.Datascript.entity_get datascript entity (keyword name)
  in
  let required_entity id =
    match
      Support.Datascript.entity datascript database id
      |> Js.Nullable.toOption
    with
    | Some entity -> entity
    | None -> invalid_arg "DB unlinked references: entity is missing"
  in
  Domain.unlinked_with ~entity:required_entity
    ~title:(fun entity ->
      let value = field entity "block/title" in
      if Support.Runtime_codec.value_is_nil runtime value then None
      else Some (Support.Runtime_codec.string_from_value runtime value))
    ~title_datoms:(fun () ->
      Support.Datascript.datoms datascript database (keyword "avet")
        [| keyword "block/title" |])
    ~datom_entity:(Support.Datascript.datom_entity datascript)
    ~datom_title:(fun datom ->
      Support.Datascript.datom_value datascript datom
      |> Support.Runtime_codec.string_from_value runtime)
    ~id_equals:(Support.Runtime_codec.value_equals runtime)
    ~references:(fun entity ->
      field entity "block/refs"
      |> Support.Runtime_codec.collection_to_array runtime
      |> Array.map (fun reference -> field reference "db/id"))
    ~linked:(fun entity ->
      field entity "block/link"
      |> Support.Runtime_codec.value_truthy runtime)
    ~built_in:(fun entity ->
      field entity "logseq.property/built-in?"
      |> Support.Runtime_codec.value_truthy runtime)
    ~lowercase:(Support.Runtime_codec.string_lowercase runtime)
    target_id
  |> Js.Nullable.fromOption
