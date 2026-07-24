module Domain = Melange_db.Property_order

type encoded_entry = {
  index : int;
  order : string Js.Nullable.t;
  uuid : string;
}

type encoded_update = { index : int; order : string }

let decode_entry (entry : encoded_entry) : Domain.entry =
  {
    index = entry.index;
    order = Js.Nullable.toOption entry.order;
    uuid = entry.uuid;
  }

let sortIndices entries =
  entries |> Array.map decode_entry |> Rrbvec.of_array |> Domain.sort_indices
  |> Rrbvec.to_array

let normalizeOrders entries =
  entries |> Array.map decode_entry |> Rrbvec.of_array
  |> Domain.normalize_orders
  |> Rrbvec.map (fun (update : Domain.update) ->
      { index = update.index; order = update.order })
  |> Rrbvec.to_array

let entity_entry runtime datascript index entity =
  let field name =
    Melange_datascript_spec.Api.entity_get datascript entity
      (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime name)
  in
  let order = field "block/order" in
  let uuid = field "block/uuid" in
  ({
     index;
     order =
       (if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime order then
          Js.Nullable.undefined
        else
          Melange_cljs_runtime_spec.Value_codec.string_from_value runtime order
          |> Js.Nullable.return);
     uuid =
       (if Melange_cljs_runtime_spec.Value_codec.value_is_uuid runtime uuid then
          Melange_cljs_runtime_spec.Value_codec.uuid_to_string runtime uuid
        else Melange_cljs_runtime_spec.Value_codec.value_to_string runtime uuid);
   }
    : encoded_entry)

let normalizeEntitiesValueWith runtime datascript entities =
  let entities =
    Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime entities
  in
  let entries = Array.mapi (entity_entry runtime datascript) entities in
  normalizeOrders entries
  |> Array.map (fun (update : encoded_update) ->
      let entity = entities.(update.index) in
      Melange_cljs_runtime_spec.Value_codec.entries_to_map runtime
        [|
          [|
            Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
              "db/id";
            Melange_datascript_spec.Api.entity_get datascript entity
              (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
                 "db/id");
          |];
          [|
            Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
              "block/order";
            Melange_cljs_runtime_spec.Value_codec.string_to_value runtime
              update.order;
          |];
        |])
  |> Melange_cljs_runtime_spec.Value_codec.array_to_vector runtime

let sortEntitiesWith runtime datascript entities =
  let entries = Array.mapi (entity_entry runtime datascript) entities in
  sortIndices entries |> Array.map (Array.get entities)

let classOrderedWith runtime datascript class_entity =
  let properties =
    Melange_datascript_spec.Api.entity_get datascript class_entity
      (Melange_cljs_runtime_spec.Value_codec.keyword_from_string runtime
         "logseq.property.class/properties")
  in
  if Melange_cljs_runtime_spec.Value_codec.value_is_nil runtime properties then
    [||]
  else
    properties
    |> Melange_cljs_runtime_spec.Value_codec.collection_to_array runtime
    |> sortEntitiesWith runtime datascript
