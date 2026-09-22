(* frontend.worker.handler.comments — read-side endpoints.
   ensure-comments-area / ensure-comments-area-for-blocks /
   delete-comment wait on the outliner-op write path. *)

open Datascript

let kw s = Wire.Keyword s

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

let comments_tag_ident = "logseq.class/Comments"

let comments_blocks_property = "logseq.property.comments/blocks"

let block_selector =
  "[:db/id :block/uuid :block/title :block/name :block/order \
   :block/created-at :block/updated-at :logseq.property/deleted-at \
   {:block/tags [:db/id :db/ident :block/title]} \
   {:block/parent [:db/id :block/uuid :block/title \
   {:block/tags [:db/ident]}]} \
   {:block/page [:db/id :block/uuid :block/title :block/name \
   {:block/tags [:db/ident]}]} \
   {:logseq.property.comments/blocks [:db/id :block/uuid :block/title \
   :logseq.property/deleted-at]}]"

let block_map db (block : entity) : Wire.t option =
  match pull_string db block_selector (Entity_id block.id) with
  | Some p -> Some (Ds_wire.transit_of_pulled p)
  | None -> None

let block_map_with_children db (block : entity) : Wire.t option =
  match block_map db block with
  | Some (Wire.Map pairs) ->
      let children =
        Ldb.get_children block |> List.filter_map (block_map db)
      in
      Some (Wire.Map ((kw "block/children", Wire.List children) :: pairs))
  | _ -> None

let block_ref_entity db (v : value) : entity option =
  match v with
  | Uuid u -> entity db (Lookup_ref ("block/uuid", Uuid u))
  | String s when Ldb.is_uuid_string s ->
      entity db (Lookup_ref ("block/uuid", Uuid s))
  | Int id -> entity db (Entity_id id)
  | _ -> None

(* :thread-api/get-comment-threads-for-block *)
let get_comment_threads_for_block args =
  with_conn args (fun db ->
      let uuid_v = Option.map Ds_wire.value_of_transit (arg args 1) in
      Db_worker_effect.pure
        (match uuid_v with
         | Some v ->
             let rows =
               q_string db
                 ~inputs:[ Arg_scalar (Result_value v) ]
                 "[:find [?comments-area ...] \
                   :in $ ?block-uuid \
                   :where \
                   [?block :block/uuid ?block-uuid] \
                   [?comments-area \
                   :logseq.property.comments/blocks ?block] \
                   [?comments-area :block/tags \
                   :logseq.class/Comments] \
                   [(missing? $ ?comments-area \
                   :logseq.property/deleted-at)]]"
             in
             Wire.List
               (List.filter_map
                  (function
                    | [ Result_entity id ] ->
                        (match entity db (Entity_id id) with
                         | Some e -> block_map_with_children db e
                         | None -> None)
                    | _ -> None)
                  rows)
         | None -> Wire.nil))

(* :thread-api/get-comment-thread-block-uuids *)
let get_comment_thread_block_uuids args =
  with_conn args (fun db ->
      let uuids =
        match arg args 1 with
        | Some (Wire.List vs) -> vs
        | Some (Wire.Set vs) -> vs
        | Some (Wire.Array vs) -> vs
        | _ -> []
      in
      let id_uuid : (entity_id * string) list =
        List.filter_map
          (fun t ->
            match block_ref_entity db (Ds_wire.value_of_transit t) with
            | Some b ->
                (match Ldb.value b "block/uuid" with
                 | Some (Uuid u) -> Some (b.id, u)
                 | _ -> None)
            | None -> None)
          uuids
      in
      let result =
        List.concat_map
          (fun (block_id, uuid_str) ->
            List.of_seq
              (datoms db Avet ~a:comments_blocks_property ~v:(Ref block_id) ())
            |> List.filter_map (fun (d : datom) ->
                   match entity db (Entity_id d.e) with
                   | Some area ->
                       let tagged =
                         List.mem comments_tag_ident
                           (List.filter_map Ldb.ident_of
                              (Ldb.ref_ents area "block/tags"))
                       in
                       let not_parent =
                         match Ldb.ref_ent area "block/parent" with
                         | Some p -> p.id <> block_id
                         | None -> true
                       in
                       let live =
                         not
                           (Ldb.truthy
                              (Ldb.value area
                                 "logseq.property/deleted-at"))
                       in
                       if tagged && not_parent && live then
                         Some (Wire.String uuid_str)
                       else None
                   | None -> None))
          id_uuid
      in
      Db_worker_effect.pure (Wire.List result))

let () =
  Dispatcher.register "thread-api/get-comment-threads-for-block"
    get_comment_threads_for_block;
  Dispatcher.register "thread-api/get-comment-thread-block-uuids"
    get_comment_thread_block_uuids
