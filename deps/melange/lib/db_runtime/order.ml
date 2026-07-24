module Domain = Melange_db.Order

let generateKeyBetween lower upper =
  Domain.generate_key_between
    (Js.Nullable.toOption lower)
    (Js.Nullable.toOption upper)

let generateNKeysBetween count lower upper =
  Domain.generate_n_keys_between count
    (Js.Nullable.toOption lower)
    (Js.Nullable.toOption upper)
  |> Rrbvec.to_array

let validateOrderKey value = Domain.validate_order_key value

let advanceMaxKey current candidate =
  Domain.advance_max_key
    (Js.Nullable.toOption current)
    (Js.Nullable.toOption candidate)
  |> Js.Nullable.fromOption

let maxOrderWith runtime datascript database =
  Domain.max_order_with
    ~nil_value:(Melange_cljs_runtime_spec.Value_codec.nil_value runtime)
    ~keyword_from_string:
      (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime)
    ~rseek_datoms:(Melange_datascript_spec.Api.rseek_datoms datascript database)
    ~datom_value:(Melange_datascript_spec.Api.datom_value datascript)

let resetTrackedMaxKey value =
  Domain.reset_state Domain.default_state (Js.Nullable.toOption value)

let advanceTrackedMaxKey value =
  Domain.advance_state Domain.default_state (Js.Nullable.toOption value)

let generateTrackedKeyBetween lower upper =
  Domain.generate_tracked_key_between Domain.default_state
    (Js.Nullable.toOption lower)
    (Js.Nullable.toOption upper)

let generateTrackedNKeysBetween count lower upper =
  Domain.generate_tracked_n_keys_between Domain.default_state count
    (Js.Nullable.toOption lower)
    (Js.Nullable.toOption upper)
  |> Rrbvec.to_array

let cell_maximum runtime cell =
  let value =
    Melange_cljs_runtime_spec.Value_codec.mutable_cell_value runtime cell
  in
  if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime value then None
  else
    Some (Melange_cljs_runtime_spec.Value_codec.string_from_value runtime value)

let reset_cell runtime cell maximum =
  let value =
    match maximum with
    | Some value ->
        Melange_cljs_runtime_spec.Value_codec.string_to_value runtime value
    | None -> Melange_cljs_runtime_spec.Value_codec.nil_value runtime
  in
  Melange_cljs_runtime_spec.Value_codec.mutable_cell_reset runtime cell value

let advanceCellWith runtime cell candidate =
  let current = cell_maximum runtime cell in
  let next = Domain.advance_max_key current (Js.Nullable.toOption candidate) in
  if not (Option.equal String.equal current next) then
    reset_cell runtime cell next

let generateKeyWithStateWith runtime has_cell cell lower upper =
  if has_cell then (
    let key = generateKeyBetween lower upper in
    advanceCellWith runtime cell (Js.Nullable.return key);
    key)
  else
    let key = generateKeyBetween lower upper in
    advanceTrackedMaxKey (Js.Nullable.return key);
    key

let generateNKeysWithStateWith runtime has_cell cell count lower upper =
  if has_cell then (
    let keys = generateNKeysBetween count lower upper in
    let maximum =
      if Array.length keys = 0 then Js.Nullable.undefined
      else Js.Nullable.return keys.(Array.length keys - 1)
    in
    advanceCellWith runtime cell maximum;
    keys)
  else generateTrackedNKeysBetween count lower upper

let previousOrder value_order candidates =
  Domain.previous_order ~value_order ~candidates:(Rrbvec.of_array candidates)
  |> Js.Nullable.fromOption

let nextOrder value_order candidates =
  Domain.next_order ~value_order ~candidates:(Rrbvec.of_array candidates)
  |> Js.Nullable.fromOption

let ordered_entities runtime datascript database property =
  if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime property then
    Melange_datascript_spec.Api.datoms datascript database
      (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime "avet")
      [|
        Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
          "block/tags";
        Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
          "logseq.class/Property";
      |]
    |> Array.map (fun datom ->
        let entity_id =
          Melange_datascript_spec.Api.datom_entity datascript datom
        in
        match
          Melange_datascript_spec.Api.entity datascript database entity_id
          |> Js.Nullable.toOption
        with
        | Some entity -> entity
        | None -> invalid_arg "DB order candidate entity is missing")
    |> Rrbvec.of_array
  else
    Melange_datascript_spec.Api.entity_get datascript property
      (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
         "property/closed-values")
    |> Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime
    |> Rrbvec.of_array

let order_around_with select runtime datascript database property value_id =
  let keyword =
    Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
  in
  let field entity name =
    Melange_datascript_spec.Api.entity_get datascript entity (keyword name)
  in
  let value =
    match
      Melange_datascript_spec.Api.entity datascript database value_id
      |> Js.Nullable.toOption
    with
    | Some entity -> entity
    | None -> invalid_arg "DB order value entity is missing"
  in
  let value_order =
    field value "block/order"
    |> Melange_cljs_runtime_spec.Value_codec.string_from_value runtime
  in
  let candidates =
    ordered_entities runtime datascript database property
    |> Rrbvec.filter (fun entity ->
        not
          (Melange_cljs_runtime_spec.Value_codec.value_equals runtime
             (field entity "db/id") value_id))
    |> Rrbvec.map (fun entity ->
        field entity "block/order"
        |> Melange_cljs_runtime_spec.Value_codec.string_from_value runtime)
  in
  select ~value_order ~candidates |> Js.Nullable.fromOption

let previousOrderWith runtime datascript database property value_id =
  order_around_with Domain.previous_order runtime datascript database property
    value_id

let nextOrderWith runtime datascript database property value_id =
  order_around_with Domain.next_order runtime datascript database property
    value_id
