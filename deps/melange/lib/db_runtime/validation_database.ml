type encoded_counts = {
  entities : int;
  pages : int;
  blocks : int;
  classes : int;
  properties : int;
  objects : int;
  propertyPairs : int;
}

let namespace_of_ident ident =
  match String.rindex_opt ident '/' with
  | Some index -> Some (String.sub ident 0 index)
  | None -> None

let datom_count runtime datascript database components =
  Melange_datascript_spec.Api.datoms datascript database
    (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime "avet")
    (components
    |> Rrbvec.map
         (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime)
    |> Rrbvec.to_array)
  |> Array.length

let graphCountsWith runtime datascript database entities =
  let classes =
    datom_count runtime datascript database
      (Rrbvec.of_array [| "block/tags"; "logseq.class/Tag" |])
  in
  let properties =
    datom_count runtime datascript database
      (Rrbvec.of_array [| "block/tags"; "logseq.class/Property" |])
  in
  let tagged =
    datom_count runtime datascript database (Rrbvec.singleton "block/tags")
  in
  let field_truthy entity name =
    Entity_read.field runtime datascript entity name
    |> Melange_cljs_runtime_spec.Value_codec.value_truthy runtime
  in
  let property_pairs =
    entities
    |> Array.fold_left
         (fun count entity ->
           entity
           |> Melange_cljs_runtime_spec.Value_codec.map_to_entries runtime
           |> Array.fold_left
                (fun count entry ->
                  let attribute = entry.(0) in
                  if
                    Melange_cljs_runtime_spec.Value_codec.value_is_keyword
                      runtime attribute
                  then
                    let ident =
                      Melange_cljs_runtime_spec.Value_codec.keyword_to_string
                        runtime attribute
                    in
                    if
                      (not (String.equal ident "block/tags"))
                      && Melange_db.Property_identity.is_property
                           ~namespace_:(namespace_of_ident ident) ~ident
                           ~is_keyword:true
                    then count + 1
                    else count
                  else count)
                count)
         0
  in
  {
    entities = Array.length entities;
    pages =
      entities
      |> Array.fold_left
           (fun count entity ->
             if field_truthy entity "block/name" then count + 1 else count)
           0;
    blocks =
      entities
      |> Array.fold_left
           (fun count entity ->
             if field_truthy entity "block/page" then count + 1 else count)
           0;
    classes;
    properties;
    objects = tagged - classes - properties;
    propertyPairs = property_pairs;
  }
