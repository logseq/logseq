(* frontend.worker.handler.flashcard — :thread-api/get-fsrs-due-card-block-ids *)

open Datascript

let arg args i = List.nth_opt args i

let with_conn args f =
  let repo =
    match arg args 0 with
    | Some (Wire.String s) -> s
    | _ -> invalid_arg "first arg must be repo name"
  in
  match Worker_state.datascript_conn repo with
  | None -> Db_worker_effect.pure Wire.nil
  | Some conn -> f (Datascript.db conn)

(* cards-id arrives as keyword/string ("global" means no query filter),
   entity id, uuid, or lookup-ref — same cases as d/entity. *)
let cards_entity db (w : Wire.t) : entity option =
  match w with
  | Wire.Keyword "global" | Wire.String "global" | Wire.Nil -> None
  | _ -> (try entity db (Ds_wire.entity_ref_of_transit w) with _ -> None)

let fsrs_due_card_block_ids db (cards_id : Wire.t) : Wire.t =
  let now_inst_ms = Instant (Date_time_util.time_ms ()) in
  let query_text =
    match cards_entity db cards_id with
    | None -> None
    | Some cards -> (
        match Ldb.ref_ent cards "logseq.property/query" with
        | None -> None
        | Some q_ent -> (
            match Ldb.value q_ent "block/title" with
            | Some (String s) when Unicode.trim s <> "" -> Some s
            | _ -> None))
  in
  let parsed = Option.bind query_text (Db_query_dsl.parse db) in
  let card_tag_id =
    match entity db (Ident "logseq.class/Card") with
    | Some e -> e.id
    | None -> -1
  in
  let card_ids =
    card_tag_id :: Db_class.get_structured_children db card_tag_id
  in
  let extra_edn =
    match parsed with
    | Some { Db_query_dsl.pquery = Some clauses; _ } ->
        " " ^ String.concat " " (List.map Ds_wire.edn_of_query_form clauses)
    | _ -> ""
  in
  let q =
    "[:find [?b ...] :in $ [?t ...] ?now-inst-ms % :where \
     [?b :block/tags ?t] \
     (or-join [?b ?now-inst-ms] \
     (and [?b :logseq.property.fsrs/due ?due] \
     [(>= ?now-inst-ms ?due)]) \
     [(missing? $ ?b :logseq.property.fsrs/due)]) \
     [?b :block/uuid]" ^ extra_edn ^ "]"
  in
  let rules =
    match parsed with
    | Some { Db_query_dsl.prules; _ } -> Db_query_dsl.parse_rules_input prules
    | None -> Arg_rules []
  in
  let rows =
    q_string db q
      ~inputs:
        [ Arg_collection (List.map (fun id -> Result_entity id) card_ids)
        ; Arg_scalar (Result_value now_inst_ms)
        ; rules ]
  in
  Wire.List
    (List.filter_map
       (function
         | [ Result_entity id ] -> Some (Wire.Int id)
         | [ Result_value (Int id) ] -> Some (Wire.Int id)
         | _ -> None)
       rows)

let get_fsrs_due_card_block_ids args =
  with_conn args (fun db ->
      Db_worker_effect.pure
        (fsrs_due_card_block_ids db
           (Option.value (arg args 1) ~default:Wire.Nil)))

let () =
  Dispatcher.register "thread-api/get-fsrs-due-card-block-ids"
    get_fsrs_due_card_block_ids
