module Domain = Melange_db.Entity_lookup

type value = Support.Runtime_codec.cljs_value
type entity_database = (value -> Support.Datascript.database[@u])
type entity_eid = (value -> value[@u])
type kv_get = (value -> value -> value Js.Nullable.t[@u])
type lookup = (value -> value -> value -> value[@u])

type capabilities = {
  node : bool;
  entityDb : entity_database;
  entityEid : entity_eid;
  kvGet : kv_get;
  lookup : lookup;
}

let keyword runtime name =
  Support.Runtime_codec.keyword_from_string runtime name

let ident_text runtime value =
  if Support.Runtime_codec.value_is_keyword runtime value then
    Support.Runtime_codec.keyword_to_string runtime value
  else Support.Runtime_codec.value_to_string runtime value

let namespace_of_ident ident =
  match String.rindex_opt ident '/' with
  | None -> None
  | Some index -> Some (String.sub ident 0 index)

let qualified runtime value =
  Support.Runtime_codec.value_is_keyword runtime value
  && String.contains
       (Support.Runtime_codec.keyword_to_string runtime value)
       '/'

let memoized runtime datascript database ident node =
  let ident_name = ident_text runtime ident in
  match
    Domain.memo_plan ~qualified:(qualified runtime ident) ~node
      ~cache_enabled:false ident_name
  with
  | Domain.Return_none -> None
  | Cached ->
      invalid_arg "Entity lookup cache is unavailable at the runtime boundary"
  | Direct ->
      Support.Datascript.entity datascript database ident
      |> Js.Nullable.toOption

let memoizedWith runtime datascript database ident node =
  memoized runtime datascript database ident node |> Js.Nullable.fromOption

let raw_lookup (capabilities : capabilities) entity key default_value =
  capabilities.lookup entity key default_value [@u]

let optional_kv runtime (capabilities : capabilities) entity key =
  match (capabilities.kvGet entity key [@u]) |> Js.Nullable.toOption with
  | Some value when Support.Runtime_codec.value_truthy runtime value ->
      Some value
  | Some _ | None -> None

let collection runtime value =
  if Support.Runtime_codec.value_is_nil runtime value then [||]
  else Support.Runtime_codec.collection_to_array runtime value

let field runtime datascript entity name =
  Support.Datascript.entity_get datascript entity (keyword runtime name)

let db_based runtime datascript (capabilities : capabilities) database =
  match
    memoized runtime datascript database
      (keyword runtime "logseq.kv/db-type")
      capabilities.node
  with
  | None -> false
  | Some entity ->
      let value =
        raw_lookup capabilities entity
          (keyword runtime "kv/value")
          (Support.Runtime_codec.nil_value runtime)
      in
      Support.Runtime_codec.value_is_string runtime value
      && String.equal
           (Support.Runtime_codec.string_from_value runtime value)
           "db"

let dbBasedWith runtime datascript capabilities database =
  db_based runtime datascript capabilities database

let dbBasedNullableWith runtime datascript capabilities database =
  match Js.Nullable.toOption database with
  | Some database ->
      db_based runtime datascript capabilities database |> Js.Nullable.return
  | None -> Js.Nullable.null

let journal_title runtime datascript (capabilities : capabilities) database
    entity =
  let journal_day = field runtime datascript entity "block/journal-day" in
  let formatter =
    match
      memoized runtime datascript database
        (keyword runtime "logseq.class/Journal")
        capabilities.node
    with
    | None -> Support.Runtime_codec.nil_value runtime
    | Some journal ->
        raw_lookup capabilities journal
          (keyword runtime "logseq.property.journal/title-format")
          (Support.Runtime_codec.nil_value runtime)
  in
  if
    Support.Runtime_codec.value_is_nil runtime journal_day
    || Support.Runtime_codec.value_is_nil runtime formatter
  then Support.Runtime_codec.nil_value runtime
  else
    Melange_common.Date_time.format_journal_day
      ~journal_day:
        (Support.Runtime_codec.int_from_value runtime journal_day)
      ~formatter:(Support.Runtime_codec.string_from_value runtime formatter)
    |> Support.Runtime_codec.string_to_value runtime

let property_key runtime key =
  if not (Support.Runtime_codec.value_is_keyword runtime key) then false
  else
    let ident = Support.Runtime_codec.keyword_to_string runtime key in
    Melange_db.Property_identity.is_property
      ~namespace_:(namespace_of_ident ident) ~ident ~is_keyword:true

let property_entries runtime entries =
  entries |> Rrbvec.of_array
  |> Rrbvec.filter (fun entry ->
      Array.length entry = 2 && property_key runtime entry.(0))

let properties runtime datascript (capabilities : capabilities) database entity
    =
  if db_based runtime datascript capabilities database then
    let fallback =
      Support.Runtime_codec.map_to_entries runtime entity
      |> property_entries runtime |> Rrbvec.to_array
      |> Support.Runtime_codec.entries_to_map runtime
    in
    raw_lookup capabilities entity (keyword runtime "block/properties") fallback
  else
    raw_lookup capabilities entity
      (keyword runtime "block/properties")
      (Support.Runtime_codec.nil_value runtime)

let property_keys runtime datascript (capabilities : capabilities) database
    entity =
  let keys =
    if db_based runtime datascript capabilities database then
      Support.Datascript.datoms datascript database (keyword runtime "eavt")
        [| (capabilities.entityEid entity [@u]) |]
      |> Array.fold_left
           (fun result datom ->
             let attribute =
               Support.Datascript.datom_attribute datascript datom
             in
             if
               property_key runtime attribute
               && not
                    (Rrbvec.exists
                       (Support.Runtime_codec.value_equals runtime attribute)
                       result)
             then Rrbvec.push_back result attribute
             else result)
           Rrbvec.empty
    else
      raw_lookup capabilities entity
        (keyword runtime "block/properties")
        (Support.Runtime_codec.nil_value runtime)
      |> Support.Runtime_codec.map_to_entries runtime
      |> Rrbvec.of_array
      |> Rrbvec.filter_map (fun entry ->
          if Array.length entry = 2 then Some entry.(0) else None)
  in
  keys |> Rrbvec.to_array |> Support.Runtime_codec.array_to_list runtime

let filtered_values runtime values predicate =
  values |> collection runtime |> Rrbvec.of_array |> Rrbvec.filter predicate
  |> Rrbvec.to_array

let filtered_parent runtime datascript (capabilities : capabilities) entity
    default_value =
  raw_lookup capabilities entity (keyword runtime "block/_parent") default_value
  |> fun values ->
  filtered_values runtime values (fun child ->
      let created =
        field runtime datascript child "logseq.property/created-from-property"
        |> Support.Runtime_codec.value_truthy runtime
      in
      let closed =
        field runtime datascript child "block/closed-value-property"
        |> Support.Runtime_codec.value_truthy runtime
      in
      not (created || closed))
  |> fun values ->
  if Array.length values = 0 then Support.Runtime_codec.nil_value runtime
  else Support.Runtime_codec.array_to_list runtime values

let compare_order runtime datascript left right =
  let order entity =
    let value = field runtime datascript entity "block/order" in
    if Support.Runtime_codec.value_is_nil runtime value then None
    else Some (Support.Runtime_codec.string_from_value runtime value)
  in
  match (order left, order right) with
  | None, None -> 0
  | None, Some _ -> -1
  | Some _, None -> 1
  | Some left, Some right -> String.compare left right

let closed_values runtime datascript (capabilities : capabilities) entity
    default_value =
  let values =
    raw_lookup capabilities entity
      (keyword runtime "block/_closed-value-property")
      default_value
  in
  if Support.Runtime_codec.value_is_nil runtime values then
    Support.Runtime_codec.nil_value runtime
  else
    let values =
      filtered_values runtime values (fun value ->
          not (Entity_read.recycledWith runtime datascript value))
    in
    Array.sort (compare_order runtime datascript) values;
    Support.Runtime_codec.array_to_list runtime values

let default_lookup runtime datascript (capabilities : capabilities) database
    entity key default_value =
  match optional_kv runtime capabilities entity key with
  | Some value -> value
  | None -> (
      let value = raw_lookup capabilities entity key default_value in
      if not (Support.Runtime_codec.value_is_nil runtime value) then value
      else if not (qualified runtime key) then
        Support.Runtime_codec.nil_value runtime
      else
        match memoized runtime datascript database key capabilities.node with
        | None -> Support.Runtime_codec.nil_value runtime
        | Some property ->
            let property_type =
              raw_lookup capabilities property
                (keyword runtime "logseq.property/type")
                (Support.Runtime_codec.nil_value runtime)
            in
            let checkbox =
              Support.Runtime_codec.value_equals runtime property_type
                (keyword runtime "checkbox")
            in
            raw_lookup capabilities property
              (Domain.default_attribute ~checkbox |> keyword runtime)
              (Support.Runtime_codec.nil_value runtime))

let block_title runtime datascript (capabilities : capabilities) database entity
    key default_value =
  match optional_kv runtime capabilities entity key with
  | Some value -> value
  | None ->
      let db_based = db_based runtime datascript capabilities database in
      if db_based && Entity_read.journalWith runtime datascript entity then
        journal_title runtime datascript capabilities database entity
      else
        let value = raw_lookup capabilities entity key default_value in
        let value =
          if db_based && Support.Runtime_codec.value_is_string runtime value
          then
            let refs = field runtime datascript entity "block/refs" in
            if Support.Runtime_codec.value_truthy runtime refs then
              Content_workflow.idRefToTitleRefWith runtime datascript value
                refs
                (Js.Nullable.return database)
                false false
            else value
          else value
        in
        if Support.Runtime_codec.value_truthy runtime value then value
        else default_value

let action runtime datascript (capabilities : capabilities) database entity key
    =
  let ident = ident_text runtime key in
  match Domain.lookup_action ~db_based:false ~journal:false ident with
  | Domain.Raw_title | Title ->
      Domain.lookup_action
        ~db_based:(db_based runtime datascript capabilities database)
        ~journal:(Entity_read.journalWith runtime datascript entity)
        ident
  | action -> action

let lookupWith runtime datascript (capabilities : capabilities) entity key
    default_value =
  let database = (capabilities.entityDb entity [@u]) in
  match action runtime datascript capabilities database entity key with
  | Domain.Journal_title ->
      journal_title runtime datascript capabilities database entity
  | Raw_title ->
      raw_lookup capabilities entity
        (keyword runtime "block/title")
        default_value
  | Properties -> properties runtime datascript capabilities database entity
  | Property_keys ->
      property_keys runtime datascript capabilities database entity
  | Title ->
      block_title runtime datascript capabilities database entity key
        default_value
  | Filtered_parent ->
      filtered_parent runtime datascript capabilities entity default_value
  | Raw_parent ->
      raw_lookup capabilities entity
        (keyword runtime "block/_parent")
        default_value
  | Closed_values ->
      closed_values runtime datascript capabilities entity default_value
  | Default_lookup ->
      default_lookup runtime datascript capabilities database entity key
        default_value

type log_lookup_error_callback = (Js.Exn.t -> unit[@u])

let lookupSafeWith runtime datascript capabilities entity key default_value
    (log_error : log_lookup_error_callback) =
  if not (Support.Runtime_codec.value_truthy runtime key) then
    Support.Runtime_codec.nil_value runtime
  else
    try lookupWith runtime datascript capabilities entity key default_value
    with error ->
      (match Js.Exn.asJsExn error with
      | Some error -> log_error error [@u]
      | None ->
          Support.Runtime_codec.log_error runtime (Printexc.to_string error));
      Support.Runtime_codec.nil_value runtime
