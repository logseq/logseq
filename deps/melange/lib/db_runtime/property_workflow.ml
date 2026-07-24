module Domain = Melange_db.Property_workflow

let field runtime datascript entity name =
  Entity_read.field runtime datascript entity name

let createUserIdent runtime name namespace_ =
  let namespace_ =
    Js.Nullable.toOption namespace_ |> Option.value ~default:"user.property"
  in
  Db_ident.createGenerated namespace_ name
  |> Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime

let content runtime datascript entity =
  Domain.value_content_with ~get:(field runtime datascript)
    ~truthy:(Melange_cljs_runtime_spec.Value_codec.value_truthy runtime)
    entity

let keyword_namespace runtime value =
  let ident =
    Melange_cljs_runtime_spec.Value_codec.keyword_to_string runtime value
  in
  match String.rindex_opt ident '/' with
  | None -> None
  | Some index -> Some (String.sub ident 0 index)

let map_entries runtime value =
  value
  |> Melange_cljs_runtime_spec.Value_codec.map_to_entries runtime
  |> Rrbvec.of_array
  |> Rrbvec.map (function
    | [| key; item |] -> (key, item)
    | _ -> invalid_arg "DB property map requires key/value entries")

let encode_entries runtime entries =
  entries
  |> Rrbvec.map (fun (key, value) -> [| key; value |])
  |> Rrbvec.to_array
  |> Melange_cljs_runtime_spec.Value_codec.entries_to_map runtime

let propertiesWith runtime entity =
  map_entries runtime entity
  |> Melange_db.Property_identity.visible_entries
       ~namespace_of:(fun key ->
         if Melange_cljs_runtime_spec.Value_codec.value_is_keyword runtime key
         then keyword_namespace runtime key
         else None)
       ~ident_of:(fun key ->
         if Melange_cljs_runtime_spec.Value_codec.value_is_keyword runtime key
         then
           Melange_cljs_runtime_spec.Value_codec.keyword_to_string runtime key
         else Melange_cljs_runtime_spec.Value_codec.value_to_string runtime key)
       ~is_keyword:
         (Melange_cljs_runtime_spec.Value_codec.value_is_keyword runtime)
  |> encode_entries runtime

let schemaWith runtime property =
  map_entries runtime property
  |> Melange_db.Property_catalog.schema_entries ~ident_of:(fun key ->
      if
        not (Melange_cljs_runtime_spec.Value_codec.value_is_keyword runtime key)
      then invalid_arg "DB property schema requires keyword keys";
      Melange_cljs_runtime_spec.Value_codec.keyword_to_string runtime key)
  |> encode_entries runtime

let publicBuiltInWith runtime entity =
  Melange_cljs_runtime_spec.Value_codec.map_get runtime entity
    (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
       "logseq.property/public?")

let lookup runtime datascript block ident =
  Domain.lookup_with
    ~get:(Melange_datascript_spec.Api.entity_get datascript)
    ~has_ref_value:(fun ident ->
      Melange_cljs_runtime_spec.Value_codec.value_is_keyword runtime ident
      && Melange_db.Property_identity.built_in_has_ref_value
           (Melange_cljs_runtime_spec.Value_codec.keyword_to_string runtime
              ident))
    ~content:(content runtime datascript)
    block ident

let contentWith runtime datascript entity = content runtime datascript entity

let lookupWith runtime datascript block ident =
  lookup runtime datascript block ident

let builtInDisplayTitleWith runtime datascript entity translate =
  Domain.built_in_display_title_with ~get:(field runtime datascript)
    ~ident_text:(fun ident ->
      if Melange_cljs_runtime_spec.Value_codec.value_is_keyword runtime ident
      then
        Some
          (Melange_cljs_runtime_spec.Value_codec.keyword_to_string runtime ident)
      else None)
    ~translate:(fun key ->
      (translate
         (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime key)
       [@u]))
    ~truthy:(Melange_cljs_runtime_spec.Value_codec.value_truthy runtime)
    ~value_to_string:
      (Melange_cljs_runtime_spec.Value_codec.value_to_string runtime)
    entity

let blockValueWith runtime datascript
    (database : Melange_datascript_spec.Api.database Js.Nullable.t) block ident
    =
  Domain.block_property_value_with
    ~entity:(fun database id ->
      Melange_datascript_spec.Api.entity datascript database id
      |> Js.Nullable.toOption)
    ~block_id:(fun block -> field runtime datascript block "db/id")
    ~lookup:(lookup runtime datascript)
    (Js.Nullable.toOption database)
    block ident
  |> Option.value
       ~default:(Melange_cljs_runtime_spec.Value_codec.nil_value runtime)
