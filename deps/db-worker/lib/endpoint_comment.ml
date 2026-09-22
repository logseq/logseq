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

(* ---- write side: ensure-comments-area / delete-comment ---- *)

let tagged_with (block : entity) (ident : string) : bool =
  Ldb.has_tag block ident

let comments_area_p (block : entity) : bool =
  tagged_with block comments_tag_ident

let comment_block_p (block : entity) : bool =
  tagged_with block "logseq.class/Comment"
  ||
  (match Ldb.ref_ent block "block/parent" with
   | Some p -> comments_area_p p
   | None -> false)

let comment_target_block_p (block : entity) : bool =
  not (comments_area_p block || comment_block_p block)

let block_uuid_of (block : entity) : string option =
  match Ldb.value block "block/uuid" with
  | Some (Uuid u) -> Some u
  | _ -> None

let block_lookup_ref (block : entity) : Wire.t =
  match block_uuid_of block with
  | Some u -> Wire.Array [ kw "block/uuid"; Wire.Uuid u ]
  | None -> Wire.Nil

let comments_area_child (block : entity) : entity option =
  List.find_opt comments_area_p
    (Ldb.sort_by_order (Ldb.get_children block))

let comments_area_title (block : entity) : string =
  if Ldb.is_page block then "Comments on this page" else "Comments"

let block_ref_uuid (block : entity) : string option = block_uuid_of block

(* targets of an existing comments-area entity: live :comments/blocks
   uuids as a set *)
let comments_area_target_uuids (comments_area : entity) : string list =
  Ldb.ref_ents comments_area comments_blocks_property
  |> List.filter
       (fun e -> not (Ldb.truthy (Ldb.value e "logseq.property/deleted-at")))
  |> List.filter_map block_ref_uuid
  |> List.sort_uniq String.compare

type comments_area_resolution =
  | Res_existing of entity * string option  (* area, missing target lookup uuid *)
  | Res_insert of string * Wire.t           (* title, opts map *)
  | Res_single of string                    (* single block: recurse as single *)

(* resolve-comments-area — single block *)
let resolve_comments_area db (block_ref : Wire.t) : comments_area_resolution option =
  match block_ref_entity db (Ds_wire.value_of_transit block_ref) with
  | None -> None
  | Some block -> (
      match comments_area_child block with
      | Some comments_area ->
          let missing_target =
            if Ldb.ref_ents comments_area comments_blocks_property = [] then
              block_uuid_of block
            else None
          in
          Some (Res_existing (comments_area, missing_target))
      | None ->
          let insert_opts =
            Wire.Map
              [ (kw "block-uuid",
                 (match block_uuid_of block with
                  | Some u -> Wire.Uuid u
                  | None -> Wire.Nil))
              ; (kw "edit-block?", Wire.Bool false)
              ; ( kw "other-attrs",
                  Wire.Map
                    [ (kw "block/tags", Wire.Set [ kw comments_tag_ident ])
                    ; ( kw comments_blocks_property
                      , Wire.Set [ block_lookup_ref block ] ) ] )
              ; ( if Ldb.is_page block then (kw "start?", Wire.Bool true)
                  else (kw "end?", Wire.Bool true) ) ]
          in
          Some (Res_insert (comments_area_title block, insert_opts)))

(* resolve-comments-area-for-blocks — multi *)
let resolve_comments_area_for_blocks db (block_refs : Wire.t list)
    : comments_area_resolution option =
  let blocks =
    List.filter_map
      (fun r -> block_ref_entity db (Ds_wire.value_of_transit r))
      block_refs
    |> List.filter comment_target_block_p
  in
  match List.rev blocks with
  | [] -> None
  | last_block :: _ -> (
      if List.length blocks = 1 then
        (* :single — delegate to single ensure *)
        Option.map (fun u -> Res_single u) (block_uuid_of last_block)
      else
        let target_uuids =
          List.sort_uniq String.compare
            (List.filter_map block_uuid_of blocks)
        in
        let existing =
          match blocks with
          | first :: _ ->
              List.find_opt
                (fun (comments_area : entity) ->
                   List.sort_uniq String.compare
                     (comments_area_target_uuids comments_area)
                   = target_uuids)
                (Ldb.ref_ents first "logseq.property.comments/_blocks")
          | [] -> None
        in
        match existing with
        | Some comments_area -> Some (Res_existing (comments_area, None))
        | None ->
            let insert_opts =
              Wire.Map
                [ (kw "block-uuid",
                   (match block_uuid_of last_block with
                    | Some u -> Wire.Uuid u
                    | None -> Wire.Nil))
                ; (kw "sibling?", Wire.Bool true)
                ; (kw "edit-block?", Wire.Bool false)
                ; ( kw "other-attrs",
                    Wire.Map
                      [ (kw "block/tags", Wire.Set [ kw comments_tag_ident ])
                      ; ( kw comments_blocks_property
                        , Wire.Set (List.map block_lookup_ref blocks) ) ] ) ]
            in
            Some (Res_insert ("Comments", insert_opts)))

(* insert-comments-area! — builds the area block and applies
   insert-blocks via apply-ops! *)
let insert_comments_area (conn : conn) (title : string) (opts : Wire.t)
    : Wire.t option =
  let db = Conn.db conn in
  let target =
    Option.bind (Cljs_map.get opts "block-uuid")
      (fun w -> block_ref_entity db (Ds_wire.value_of_transit w))
  in
  match target with
  | None -> None
  | Some target ->
      let children =
        if Cljs_map.get opts "end?" = Some (Wire.Bool true) then
          Ldb.sort_by_order (Ldb.get_children target)
        else []
      in
      let insert_target, sibling =
        if Cljs_map.get opts "sibling?" = Some (Wire.Bool true) then
          (target, true)
        else
          match List.rev children with
          | last :: _ -> (last, true)
          | [] -> (target, false)
      in
      let comments_area_uuid = Common_uuid.new_block_id () in
      let comments_area =
        let base =
          [ (kw "block/title", Wire.String title)
          ; (kw "block/uuid", Wire.Uuid comments_area_uuid) ]
        in
        let other =
          match Cljs_map.get opts "other-attrs" with
          | Some (Wire.Map kvs) -> kvs
          | _ -> []
        in
        Wire.Map (base @ other)
      in
      let insert_opts =
        Wire.Map
          [ (kw "sibling?", Wire.Bool sibling)
          ; (kw "keep-uuid?", Wire.Bool true) ]
      in
      let target_uuid =
        match block_uuid_of insert_target with
        | Some u -> Wire.Uuid u
        | None -> Wire.Nil
      in
      ignore
        (Outliner_op.apply_ops conn
           (Wire.Array
              [ Wire.Array
                  [ kw "insert-blocks"
                  ; Wire.Array
                      [ Wire.Array [ comments_area ]; target_uuid; insert_opts ] ] ])
           Wire.Nil);
      Option.bind
        (entity (Conn.db conn) (Lookup_ref ("block/uuid", Uuid comments_area_uuid)))
        (block_map (Conn.db conn))

(* ensure-comments-area! *)
let rec ensure_comments_area conn (block_ref : Wire.t) : Wire.t option =
  match resolve_comments_area (Conn.db conn) block_ref with
  | Some (Res_existing (comments_area, missing_target)) ->
      (match missing_target with
       | Some uuid ->
           let target_ref =
             match block_uuid_of comments_area with
             | Some u -> Wire.Array [ kw "block/uuid"; Wire.Uuid u ]
             | None -> Wire.Nil
           in
           ignore
             (Db_transact.transact conn
                [ Wire.Array
                    [ kw "db/add"; target_ref
                    ; kw comments_blocks_property
                    ; Wire.Array [ kw "block/uuid"; Wire.Uuid uuid ] ] ]
                [ ("outliner-op", Keyword "save-block") ])
       | None -> ());
      (match
         Option.bind (block_uuid_of comments_area)
           (fun u ->
             entity (Conn.db conn) (Lookup_ref ("block/uuid", Uuid u)))
       with
       | Some e -> block_map (Conn.db conn) e
       | None -> block_map (Conn.db conn) comments_area)
  | Some (Res_insert (title, opts)) ->
      insert_comments_area conn title opts
  | Some (Res_single uuid) ->
      ensure_comments_area conn (Wire.Uuid uuid)
  | None -> None

(* ensure-comments-area-for-blocks! *)
let ensure_comments_area_for_blocks conn (block_refs : Wire.t list)
    : Wire.t option =
  match resolve_comments_area_for_blocks (Conn.db conn) block_refs with
  | Some (Res_single uuid) ->
      ensure_comments_area conn
        (Wire.Uuid uuid)
  | Some (Res_existing (comments_area, _)) ->
      block_map (Conn.db conn) comments_area
  | Some (Res_insert (title, opts)) ->
      insert_comments_area conn title opts
  | None -> None

(* delete-comment! *)
let delete_comment conn (comment_block_ref : Wire.t) : unit =
  let db = Conn.db conn in
  match block_ref_entity db (Ds_wire.value_of_transit comment_block_ref) with
  | None -> ()
  | Some comment_block ->
      let targets =
        match Ldb.ref_ent comment_block "block/parent" with
        | Some comments_area when comments_area_p comments_area ->
            let live_children =
              List.filter
                (fun c ->
                  not (Ldb.truthy (Ldb.value c "logseq.property/deleted-at")))
                (Ldb.get_children comments_area)
            in
            if List.length live_children <= 1 then
              List.filter_map (block_map_with_children db)
                [ comments_area ]
            else List.filter_map (block_map db) [ comment_block ]
        | _ -> List.filter_map (block_map db) [ comment_block ]
      in
      let target_uuids =
        List.filter_map
          (fun w ->
            match w with
            | Wire.Map kvs -> (
                match
                  List.find_opt
                    (fun (k, _) ->
                      match k with
                      | Wire.Keyword "block/uuid" -> true
                      | _ -> false)
                    kvs
                with
                | Some (_, Wire.Uuid u) -> Some (Wire.Uuid u)
                | _ -> None)
            | _ -> None)
          targets
      in
      (match target_uuids with
       | [] -> ()
       | _ ->
           ignore
             (Outliner_op.apply_ops conn
                (Wire.Array
                   [ Wire.Array
                       [ kw "delete-blocks"
                       ; Wire.Array
                           [ Wire.Array target_uuids; Wire.Map [] ] ] ])
                Wire.Nil))

let () =
  Dispatcher.register "thread-api/ensure-comments-area" (fun args ->
      with_conn args (fun _db ->
          match Worker_state.datascript_conn
                  (match arg args 0 with
                   | Some (Wire.String s) -> s
                   | _ -> invalid_arg "repo")
          with
          | Some conn ->
              Db_worker_effect.pure
                (Option.value
                   (ensure_comments_area conn
                      (Option.value (arg args 1) ~default:Wire.Nil))
                   ~default:Wire.Nil)
          | None -> Db_worker_effect.pure Wire.Nil));
  Dispatcher.register "thread-api/ensure-comments-area-for-blocks"
    (fun args ->
      with_conn args (fun _db ->
          match Worker_state.datascript_conn
                  (match arg args 0 with
                   | Some (Wire.String s) -> s
                   | _ -> invalid_arg "repo")
          with
          | Some conn ->
              let block_refs =
                match arg args 1 with
                | Some (Wire.Array xs) | Some (Wire.List xs) -> xs
                | _ -> []
              in
              Db_worker_effect.pure
                (Option.value
                   (ensure_comments_area_for_blocks conn block_refs)
                   ~default:Wire.Nil)
          | None -> Db_worker_effect.pure Wire.Nil));
  Dispatcher.register "thread-api/delete-comment" (fun args ->
      with_conn args (fun _db ->
          match Worker_state.datascript_conn
                  (match arg args 0 with
                   | Some (Wire.String s) -> s
                   | _ -> invalid_arg "repo")
          with
          | Some conn ->
              delete_comment conn (Option.value (arg args 1) ~default:Wire.Nil);
              Db_worker_effect.pure Wire.Nil
          | None -> Db_worker_effect.pure Wire.Nil))
