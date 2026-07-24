module Domain = Melange_db.Delete_plan

type encoded_node = { id : int; blockValue : bool; childrenIds : int array }
type encoded_referrer = { id : int; rawTitle : string Js.Nullable.t }

type encoded_block = {
  id : int;
  uuid : string;
  title : string Js.Nullable.t;
  asset : bool;
  referrers : encoded_referrer array;
}

type encoded_entity = {
  id : int;
  blockValue : encoded_block Js.Nullable.t;
  history : bool;
  reactionIds : int array;
  viewIds : int array;
  historyIds : int array;
}

type encoded_history = {
  targetKind : string;
  targetId : int;
  targetUuid : string;
  blockId : int Js.Nullable.t;
  propertyId : int Js.Nullable.t;
  refValueId : int Js.Nullable.t;
  ownRefRetracted : bool;
}

type encoded_operation = {
  kind : string;
  entityId : int;
  blockId : int;
  title : string;
  uuid : string;
}

let decode_referrer (referrer : encoded_referrer) : Domain.referrer =
  { id = referrer.id; raw_title = Js.Nullable.toOption referrer.rawTitle }

let decode_block (block : encoded_block) : Domain.block =
  {
    id = block.id;
    uuid = block.uuid;
    title = Js.Nullable.toOption block.title;
    asset = block.asset;
    referrers = block.referrers |> Array.map decode_referrer |> Rrbvec.of_array;
  }

let encode_operation = function
  | Domain.Retract_entity entity_id ->
      {
        kind = "retract-entity";
        entityId = entity_id;
        blockId = 0;
        title = "";
        uuid = "";
      }
  | Retract_ref { entity_id; block_id } ->
      {
        kind = "retract-ref";
        entityId = entity_id;
        blockId = block_id;
        title = "";
        uuid = "";
      }
  | Add_title { entity_id; title } ->
      {
        kind = "add-title";
        entityId = entity_id;
        blockId = 0;
        title;
        uuid = "";
      }
  | Retract_uuid uuid ->
      { kind = "retract-uuid"; entityId = 0; blockId = 0; title = ""; uuid }

let expandRetractIds root_ids nodes =
  nodes
  |> Array.map (fun (node : encoded_node) ->
      ({
         id = node.id;
         block = node.blockValue;
         children = Rrbvec.of_array node.childrenIds;
       }
        : Domain.node))
  |> Rrbvec.of_array
  |> Domain.expand_retract_ids ~root_ids:(Rrbvec.of_array root_ids)
  |> Rrbvec.to_array

let directCleanup entities =
  entities
  |> Array.map (fun (entity : encoded_entity) ->
      ({
         id = entity.id;
         block =
           entity.blockValue |> Js.Nullable.toOption |> Option.map decode_block;
         history = entity.history;
         reactions = Rrbvec.of_array entity.reactionIds;
         views = Rrbvec.of_array entity.viewIds;
         histories = Rrbvec.of_array entity.historyIds;
       }
        : Domain.entity))
  |> Rrbvec.of_array |> Domain.direct_cleanup
  |> Rrbvec.map encode_operation
  |> Rrbvec.to_array

let newHistoryRetracts retracted_ids candidates =
  candidates
  |> Array.map (fun (candidate : encoded_history) ->
      let target =
        match candidate.targetKind with
        | "id" -> Domain.By_id candidate.targetId
        | "uuid" -> By_uuid candidate.targetUuid
        | kind -> invalid_arg ("DB delete planning: unknown target kind " ^ kind)
      in
      ({
         target;
         block_id = Js.Nullable.toOption candidate.blockId;
         property_id = Js.Nullable.toOption candidate.propertyId;
         ref_value_id = Js.Nullable.toOption candidate.refValueId;
         own_ref_retracted = candidate.ownRefRetracted;
       }
        : Domain.history_candidate))
  |> Rrbvec.of_array
  |> Domain.new_history_retracts ~retracted_ids:(Rrbvec.of_array retracted_ids)
  |> Rrbvec.map encode_operation
  |> Rrbvec.to_array
