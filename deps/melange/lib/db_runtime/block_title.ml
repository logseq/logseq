module Domain = Melange_db.Block_title

type encoded_extend = { title : string Js.Nullable.t; builtIn : bool }

type encoded_input = {
  builtIn : bool;
  storedTitle : string Js.Nullable.t;
  classValue : bool;
  classConflict : bool;
  extendsValues : encoded_extend array;
  displayTitle : string Js.Nullable.t;
  truncate : bool;
  tagTitles : string array;
  alias : string Js.Nullable.t;
}

let uniqueTitle input =
  Domain.unique_title ~built_in:input.builtIn
    ~stored_title:(Js.Nullable.toOption input.storedTitle)
    ~class_:input.classValue ~class_conflict:input.classConflict
    ~extends:
      (input.extendsValues
      |> Array.map (fun (value : encoded_extend) ->
          ({
             title = Js.Nullable.toOption value.title;
             built_in = value.builtIn;
           }
            : Domain.extend))
      |> Rrbvec.of_array)
    ~display_title:(Js.Nullable.toOption input.displayTitle)
    ~truncate:input.truncate
    ~tag_titles:(Rrbvec.of_array input.tagTitles)
    ~alias:(Js.Nullable.toOption input.alias)
  |> Js.Nullable.fromOption

type encoded_workflow_options = {
  withTags : bool;
  alias : string Js.Nullable.t;
  truncate : bool;
  title : string Js.Nullable.t;
}

let field runtime datascript entity name =
  Melange_datascript_spec.Api.entity_get datascript entity
    (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime name)

let optional_value runtime value =
  if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime value then None
  else Some value

let optional_string runtime value =
  optional_value runtime value
  |> Option.map
       (Melange_cljs_runtime_spec.Value_codec.string_from_value runtime)

let collection runtime value =
  match optional_value runtime value with
  | None -> Rrbvec.empty
  | Some value ->
      Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime value
      |> Rrbvec.of_array

let class_value runtime datascript entity =
  Entity_read_runtime.tag_texts runtime datascript entity |> fun tags ->
  Melange_db.Entity_read.has_tag tags "logseq.class/Tag"

let resolve_entity datascript database lookup fallback =
  match database with
  | None -> fallback
  | Some database -> (
      match
        Melange_datascript_spec.Api.entity datascript database lookup
        |> Js.Nullable.toOption
      with
      | Some entity -> entity
      | None -> fallback)

let resolve_block runtime datascript database block =
  if Melange_datascript_spec.Api.entity_is datascript block then block
  else
    let title = field runtime datascript block "block/title" in
    let tags =
      field runtime datascript block "block/tags" |> collection runtime
    in
    let needs_resolution =
      Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime title
      || class_value runtime datascript block
      || Rrbvec.exists
           (Melange_cljs_runtime_spec.Value_codec.value_is_number runtime)
           tags
    in
    if not needs_resolution then block
    else
      let id = field runtime datascript block "db/id" in
      if Melange_cljs_runtime_spec.Value_codec.value_is_number runtime id then
        resolve_entity datascript database id block
      else
        let uuid = field runtime datascript block "block/uuid" in
        if Melange_cljs_runtime_spec.Value_codec.value_is_uuid runtime uuid then
          let lookup =
            Melange_cljs_runtime_spec.Value_codec.array_to_vector runtime
              [|
                Melange_cljs_runtime_spec.Value_codec.keyword_from_string
                  runtime "block/uuid";
                uuid;
              |]
          in
          resolve_entity datascript database lookup block
        else block

let class_conflict_query =
  let open Melange_db.Datalog_form in
  vector_form
    [|
      keyword "find";
      symbol "?other";
      symbol ".";
      keyword "in";
      symbol "$";
      symbol "?class-title";
      symbol "?class-id";
      keyword "where";
      vector_form
        [| symbol "?other"; keyword "block/title"; symbol "?class-title" |];
      vector_form
        [| symbol "?other"; keyword "block/tags"; keyword "logseq.class/Tag" |];
      vector_form
        [| list_form [| symbol "not="; symbol "?other"; symbol "?class-id" |] |];
      list_form
        [|
          symbol "not";
          vector_form
            [| symbol "?other"; keyword "logseq.property/deleted-at" |];
        |];
    |]

let class_conflict runtime datascript database class_entity =
  match database with
  | None -> false
  | Some database ->
      let title = field runtime datascript class_entity "block/title" in
      let id = field runtime datascript class_entity "db/id" in
      if
        Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime title
        || Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime id
      then false
      else
        Melange_datascript_spec.Api.query datascript
          (Datalog_runtime.encode runtime class_conflict_query)
          database [| title; id |]
        |> Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime
        |> not

let private_tag runtime datascript tag =
  let ident = field runtime datascript tag "db/ident" in
  Melange_cljs_runtime_spec.Value_codec.value_is_keyword runtime ident
  && Rrbvec.mem
       (Melange_cljs_runtime_spec.Value_codec.keyword_to_string runtime ident)
       Melange_db.Class_catalog.private_tags

let inline_tag runtime datascript raw_title tag =
  match raw_title with
  | None -> false
  | Some raw_title ->
      let uuid = field runtime datascript tag "block/uuid" in
      if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime uuid then
        false
      else
        Melange_db.Frontend_read.inline_tag raw_title
          (Melange_cljs_runtime_spec.Value_codec.uuid_to_string runtime uuid)

let encoded_extend runtime datascript extend =
  ({
     title =
       field runtime datascript extend "block/title"
       |> optional_string runtime |> Js.Nullable.fromOption;
     builtIn =
       field runtime datascript extend "logseq.property/built-in?"
       |> Melange_cljs_runtime_spec.Value_codec.value_truthy runtime;
   }
    : encoded_extend)

let uniqueTitleWith runtime datascript database block
    (options : encoded_workflow_options) =
  let database = Js.Nullable.toOption database in
  let block_entity = resolve_block runtime datascript database block in
  let class_ = class_value runtime datascript block_entity in
  let tag_titles =
    if (not options.withTags) || class_ then Rrbvec.empty
    else
      let source_tags = field runtime datascript block "block/tags" in
      let source_tags =
        if
          Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime source_tags
        then field runtime datascript block_entity "block/tags"
        else source_tags
      in
      let raw_title =
        field runtime datascript block_entity "block/raw-title"
        |> optional_string runtime
      in
      source_tags |> collection runtime
      |> Rrbvec.map (fun tag ->
          if Melange_cljs_runtime_spec.Value_codec.value_is_number runtime tag
          then
            resolve_entity datascript database tag
              (Melange_cljs_runtime_spec.Value_codec.nil_value runtime)
          else tag)
      |> Rrbvec.filter (fun tag ->
          (not (inline_tag runtime datascript raw_title tag))
          && not (private_tag runtime datascript tag))
      |> Rrbvec.filter_map (fun tag ->
          field runtime datascript tag "block/title" |> optional_string runtime)
  in
  uniqueTitle
    ({
       builtIn =
         field runtime datascript block_entity "logseq.property/built-in?"
         |> Melange_cljs_runtime_spec.Value_codec.value_truthy runtime;
       storedTitle =
         field runtime datascript block_entity "block/title"
         |> optional_string runtime |> Js.Nullable.fromOption;
       classValue = class_;
       classConflict =
         class_ && class_conflict runtime datascript database block_entity;
       extendsValues =
         field runtime datascript block_entity "logseq.property.class/extends"
         |> collection runtime
         |> Rrbvec.map (encoded_extend runtime datascript)
         |> Rrbvec.to_array;
       displayTitle = options.title;
       truncate = options.truncate;
       tagTitles = Rrbvec.to_array tag_titles;
       alias = options.alias;
     }
      : encoded_input)
