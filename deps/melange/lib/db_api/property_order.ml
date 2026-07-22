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
    Support.Datascript.entity_get datascript entity
      (Support.Runtime_codec.keyword_from_string runtime name)
  in
  let order = field "block/order" in
  let uuid = field "block/uuid" in
  ({
     index;
     order =
       (if Support.Runtime_codec.value_is_nil runtime order then
          Js.Nullable.undefined
        else
          Support.Runtime_codec.string_from_value runtime order
          |> Js.Nullable.return);
     uuid =
       (if Support.Runtime_codec.value_is_uuid runtime uuid then
          Support.Runtime_codec.uuid_to_string runtime uuid
        else Support.Runtime_codec.value_to_string runtime uuid);
   }
    : encoded_entry)

let normalizeEntitiesValueWith runtime datascript entities =
  let entities =
    Support.Runtime_codec.collection_to_array runtime entities
  in
  let entries = Array.mapi (entity_entry runtime datascript) entities in
  normalizeOrders entries
  |> Array.map (fun (update : encoded_update) ->
      let entity = entities.(update.index) in
      Support.Runtime_codec.entries_to_map runtime
        [|
          [|
            Support.Runtime_codec.keyword_from_string runtime "db/id";
            Support.Datascript.entity_get datascript entity
              (Support.Runtime_codec.keyword_from_string runtime "db/id");
          |];
          [|
            Support.Runtime_codec.keyword_from_string runtime "block/order";
            Support.Runtime_codec.string_to_value runtime update.order;
          |];
        |])
  |> Support.Runtime_codec.array_to_vector runtime

let sortEntitiesWith runtime datascript entities =
  let entries = Array.mapi (entity_entry runtime datascript) entities in
  sortIndices entries |> Array.map (Array.get entities)

let classOrderedWith runtime datascript class_entity =
  let properties =
    Support.Datascript.entity_get datascript class_entity
      (Support.Runtime_codec.keyword_from_string runtime
         "logseq.property.class/properties")
  in
  if Support.Runtime_codec.value_is_nil runtime properties then [||]
  else
    properties
    |> Support.Runtime_codec.collection_to_array runtime
    |> sortEntitiesWith runtime datascript
