(* frontend.worker.sync.replay — pending tx re-application on the display
   conn (reverse/rebase), remote tx application on the server conn, sync
   conflict detection, and undo/redo history actions. Shared tx-item and
   pending-tx helpers live in Sync_apply; this module also fills its
   rebuild_display_fn forward-ref so upload paths can re-project the
   display conn without depending back on this module. *)

open Datascript
open Db_worker_effect.Infix
open Sync_apply

let invalid_rebase_op op data : 'a =
  let data' =
    match data with
    | Wire.Map kvs -> Wire.Map (kvs @ [ Wire.keyword "op", op ])
    | _ -> data
  in
  raise (Sync_util.ex_info "invalid rebase op" (Wire.as_map data'))

let expected_stale_rebase_error (error : exn) : bool =
  let err, attr =
    match error with
    | Dispatcher.Exn_info (_, kvs) ->
        ( List.assoc_opt (Wire.Keyword "error") kvs
        , List.assoc_opt (Wire.Keyword "attribute") kvs )
    | _ -> (None, None)
  in
  (* datascript raises bare invalid_arg where cljs datascript attaches
     ex-data: "Nothing found for entity id" = :entity-id/missing;
     "unique constraint" = :transact/unique. The cljs check narrows the
     latter to :block/uuid, but in a rebase-reverse context block/uuid is
     the only db.unique attribute that can conflict. *)
  match error with
  | Dispatcher.Exn_info (msg, _) when msg = "invalid rebase op" -> true
  | Invalid_argument msg
    when msg = "unique constraint"
         || Common_util.str_starts_with msg "Nothing found for entity id" -> true
  | _ ->
      err = Some (Wire.keyword "entity-id/missing")
      || (err = Some (Wire.keyword "transact/unique") && attr = Some (Wire.keyword "block/uuid"))

let history_action_error_reason (error : exn) : Wire.t =
  let msg =
    match error with
    | Dispatcher.Exn_info (msg, _) -> msg
    | e -> Printexc.to_string e
  in
  if msg = "invalid rebase op"
     || msg = "Non-transact outliner ops contain numeric entity ids" then
    Wire.keyword "invalid-history-action-ops"
  else Wire.keyword "error"

let expected_history_action_error_reason reason : bool =
  reason = Wire.keyword "invalid-history-action-ops"
  || reason = Wire.keyword "invalid-history-action-tx"

(* batch-transact-with-temp-conn! with cljs {:listen-db :before-commit} *)
let batch_transact_with_temp_conn_impl (conn : conn) (tx_meta : tx_meta)
    ?(listen_db : (tx_report -> unit) option)
    ?(before_commit : (unit -> unit) option) (f : conn -> unit) () :
    tx_report option =
  let temp_conn =
    Datascript.conn_from_db
      { (Datascript.db conn) with storage_ref = None }
  in
  let fl = Db_tx.flags_of temp_conn in
  fl.Db_tx.batch_tx <- true;
  fl.Db_tx.skip_store <- true;
  fl.Db_tx.skip_validate <- true;
  let collected = ref [] in
  let listener_id =
    Datascript.listen temp_conn "temp-conn-batch-tx" (fun report ->
         collected := List.rev_append report.tx_data !collected;
         match listen_db with
         | Some listen -> listen report
         | None -> ())
  in
  Db_tx.with_temp_conn_cleanup temp_conn listener_id (fun () ->
      f temp_conn;
      match before_commit with
      | Some bc -> bc ()
      | None -> ());
  match List.rev !collected with
  | [] -> None
  | datoms ->
      (* Ref_to datom values re-serialize as lookup-refs ([:block/uuid
         u]); replaying them verbatim re-resolves lazily against the
         evolving conn, so a mid-commit uuid retract breaks a later
         lookup and crashes the whole commit — while a datom is an
         eid-level fact: (e, a, Ref eid) applies identically no matter
         what happens to the uuid datom around it. Resolve every
         Ref_to against the live conn up front. Unresolvable targets:
         a retracted datom can't exist when its value can't be named —
         a true no-op, drop it; an add keeps the lookup form and a
         trailing uuid-shell add lets the deferred lookup resolve —
         the link the journaled add carried still lands. *)
      let live_db = Conn.db conn in
      let shell_keys = ref SSet.empty in
      let shells = ref [] in
      let lookup_of (d : datom) =
        (* r.tx_data records lookup refs in several shapes: Ref_to for
           adds resolved during apply, raw [:attr v] vectors/lists for
           items whose declared form stayed unresolved, and bare uuids
           under ref attrs. Replaying any of them verbatim re-resolves
           lazily mid-commit — a uuid retracted earlier in the same
           commit then crashes the whole batch. A datom is an eid-level
           fact: resolve every lookup-shaped v to its live eid up front
           so (e, a, Ref eid) applies no matter what happens to the uuid
           datom around it. *)
        let is_ref = Db_normalize.entity_value_type_ref live_db d.a in
        match d.v with
        | Ref_to (Lookup_ref (la, lv)) -> Some (la, lv)
        | Vector [ Keyword la; lv ] | List [ Keyword la; lv ] when is_ref ->
            Some (la, lv)
        | Uuid u when is_ref -> Some ("block/uuid", Uuid u)
        | _ -> None
      in
      let v_wire (d : datom) =
        match lookup_of d with
        | Some (la, lv) -> (
            match Datascript.entid live_db la lv with
            | Some eid -> `Resolved (Wire.Int eid)
            | None ->
                let key =
                  la ^ "|" ^ Ds_wire.edn_of_transit
                              (Ds_wire.transit_of_value lv)
                in
                if d.added && not (SSet.mem key !shell_keys) then begin
                  shell_keys := SSet.add key !shell_keys;
                  shells := (la, lv) :: !shells
                end;
                `Missing (Ds_wire.transit_of_value d.v))
        | None -> (
            match d.v with
            | Ref_to (Entity_id n) -> `Resolved (Wire.Int n)
            | _ -> `Resolved (Ds_wire.transit_of_value d.v))
      in
      let items =
        List.filter_map
          (fun (d : datom) ->
             match v_wire d with
             | `Resolved v ->
                 Some
                   (Wire.Array
                      [ Wire.keyword
                          (if d.added then "db/add" else "db/retract")
                      ; Wire.Int d.e; Wire.keyword d.a; v ])
             | `Missing _ when d.added ->
                 Some
                   (Wire.Array
                      [ Wire.keyword "db/add"; Wire.Int d.e
                      ; Wire.keyword d.a; Ds_wire.transit_of_value d.v ])
             | `Missing _ -> None)
          datoms
      in
      let items =
        items
        @ List.map
            (fun (la, lv) ->
               Wire.Array
                 [ Wire.keyword "db/add"; Wire.String ("ref-shell-" ^ la)
                 ; Wire.keyword la; Ds_wire.transit_of_value lv ])
            (List.rev !shells)
      in
      Db_transact.transact conn items tx_meta

(* cljs with-redefs seam — tests intercept the temp-conn batch to inject a
   local change mid-apply *)
let batch_transact_with_temp_conn_fn = ref batch_transact_with_temp_conn_impl

let batch_transact_with_temp_conn (conn : conn) (tx_meta : tx_meta)
    ?(listen_db : (tx_report -> unit) option)
    ?(before_commit : (unit -> unit) option) (f : conn -> unit) () :
    tx_report option =
  !batch_transact_with_temp_conn_fn conn tx_meta ?listen_db ?before_commit f ()

(* ---- entity resolution helpers for replay ---- *)

let replay_entity_id_value (db : db) (v : Wire.t) : Wire.t =
  match v with
  | Wire.Int _ -> v
  | Wire.Uuid _ -> (
      match
        Datascript.entity db (Lookup_ref ("block/uuid", Ds_wire.value_of_transit v))
      with
      | Some e -> Wire.Int e.id
      | None -> Wire.Nil)
  | Wire.Array _ | Wire.List _ | Wire.Keyword _ -> (
      match
        (try Datascript.entity db (Ds_wire.entity_ref_of_transit v)
         with _ -> None)
      with
      | Some e -> Wire.Int e.id
      | None -> Wire.Nil)
  | _ -> v

let replay_entity_id_coll (db : db) (ids : Wire.t) : Wire.t list =
  ids
  |> tx_items_of
  |> List.map (fun v ->
         match replay_entity_id_value db v with
         | Wire.Nil -> v
         | w -> w)

let get_left_sibling_entity (e : entity) : entity option =
  Ldb.get_left_sibling e

let rebase_find_existing_left_sibling (current_db : db) (target : entity)
    : entity option =
  let rec loop (sibling : entity option) =
    match sibling with
    | None -> None
    | Some s -> (
        let su =
          match Datascript.entity_attr s "block/uuid" with
          | Some (One_value (Uuid u)) -> Some u
          | _ -> None
        in
        match su with
        | Some u -> (
            match
              Datascript.entity current_db (Lookup_ref ("block/uuid", Uuid u))
            with
            | Some cur -> Some cur
            | None -> loop (Ldb.get_left_sibling s))
        | None -> loop (Ldb.get_left_sibling s))
  in
  loop (Ldb.get_left_sibling target)

let rebase_target_ref (target_id : Wire.t) : Wire.t =
  match target_id with
  | Wire.Array [ a; _ ] | Wire.List [ a; _ ] when a = Wire.keyword "block/uuid" ->
      target_id
  | Wire.Uuid _ -> Wire.Array [ Wire.keyword "block/uuid"; target_id ]
  | Wire.Map _ -> (
      match Wire.get "block/uuid" target_id with
      | Some (Wire.Uuid _ as u) -> Wire.Array [ Wire.keyword "block/uuid"; u ]
      | _ -> target_id)
  | _ -> target_id

(* Walks a deleted target's ancestor chain on db_before: the closest
   ancestor still present on current_db becomes the insert parent, and
   falling off the top lands on the target's own block/page entity. *)
let resolve_ancestor_or_page (db_before : db) (current_db : db)
    (tb : entity) : entity option =
  let entity_on_current (e : entity) : entity option =
    match Datascript.entity_attr e "block/uuid" with
    | Some (One_value (Uuid u)) ->
        Datascript.entity current_db (Lookup_ref ("block/uuid", Uuid u))
    | _ -> None
  in
  let parent_on (d : db) (e : entity) : entity option =
    match Datascript.entity_attr e "block/parent" with
    | Some (One_entity pe) ->
        Option.bind pe.db_id (fun r ->
            try Datascript.entity d r with _ -> None)
    | _ -> None
  in
  let visited = Hashtbl.create 7 in
  let rec up (e : entity) : entity option =
    if Hashtbl.mem visited e.id then None
    else begin
      Hashtbl.replace visited e.id ();
      match parent_on db_before e with
      | Some p -> (
          match entity_on_current p with
          | Some cur -> Some cur
          | None -> up p)
      | None -> (
          match Datascript.entity_attr e "block/page" with
          | Some (One_entity pe) -> (
              match
                Option.bind pe.db_id (fun r ->
                    try Datascript.entity db_before r with _ -> None)
              with
              | Some page -> entity_on_current page
              | None -> None)
          | _ -> None)
    end
  in
  up tb

let rebase_resolve_target_and_sibling ?(page_root_fallback = false)
    (current_db : db) (rebase_db_before : db option) (target_id : Wire.t)
    (sibling : bool) : (entity * bool) option =
  let target_ref = rebase_target_ref target_id in
  let target = entity_of_wire_ref current_db target_ref in
  let target_before, parent_uuid =
    match rebase_db_before with
    | Some db -> (
        ( entity_of_wire_ref db target_ref
        , match entity_of_wire_ref db target_ref with
          | Some e -> (
              match Datascript.entity_attr e "block/parent" with
              | Some (One_entity te) -> (
                  match
                    Option.bind te.db_id (fun r ->
                         try Some (Datascript.entity db r) with _ -> None)
                  with
                  | Some (Some parent) -> (
                      match Datascript.entity_attr parent "block/uuid" with
                      | Some (One_value (Uuid u)) -> Some u
                      | _ -> None)
                  | _ -> None)
              | _ -> None)
          | None -> None ))
    | None -> (None, None)
  in
  let page_root tb =
    if page_root_fallback then
      match rebase_db_before with
      | Some db ->
          Option.map
            (fun e -> (e, false))
            (resolve_ancestor_or_page db current_db tb)
      | None -> None
    else None
  in
  let r =
    match target with
    | Some t -> Some (t, sibling)
    | None -> (
        match (target_before, parent_uuid, sibling) with
        | Some tb, Some puuid, true -> (
            match rebase_find_existing_left_sibling current_db tb with
            | Some s -> Some (s, true)
            | None -> (
                match
                  Datascript.entity current_db
                    (Lookup_ref ("block/uuid", Uuid puuid))
                with
                | Some parent -> Some (parent, false)
                | None -> page_root tb))
        | Some tb, _, _ -> page_root tb
        | _ -> None)
  in
  r

let template_parent_ref (parent : Wire.t) : Wire.t =
  match parent with
  | Wire.Array [ a; _ ] | Wire.List [ a; _ ] when a = Wire.keyword "block/uuid" ->
      parent
  | Wire.Uuid _ -> Wire.Array [ Wire.keyword "block/uuid"; parent ]
  | Wire.Map _ -> (
      match Wire.get "block/uuid" parent with
      | Some (Wire.Uuid _ as u) -> Wire.Array [ Wire.keyword "block/uuid"; u ]
      | _ -> parent)
  | _ -> parent

(* cljs truthy — anything but nil/false *)
let wire_truthy (v : Wire.t option) : bool =
  match v with
  | Some Wire.Nil | Some (Wire.Bool false) | None -> false
  | Some _ -> true

let sanitize_template_block (current_db : db) (rebase_db_before : db option)
    (block : Wire.t) : Wire.t =
  let m = Wire.as_map block in
  let block_id =
    List.assoc_opt (Wire.keyword "db/id") m |> Option.value ~default:Wire.Nil
  in
  (* cljs (or (:block/uuid m) ...) — a truthy :block/uuid wins raw, whatever
     its shape; the db/id and lookup-vector fallbacks only run when it's
     absent/nil/false. uuid? is checked at assoc time, so a non-uuid
     :block/uuid is kept verbatim rather than replaced by a db lookup. *)
  let block_uuid =
    match List.assoc_opt (Wire.keyword "block/uuid") m with
    | Some v when v <> Wire.Nil && v <> Wire.Bool false -> Some v
    | _ -> (
        match block_id with
        | Wire.Int n -> (
            let from db = entity_block_uuid db n in
            match rebase_db_before with
            | Some db -> (
                match from db with
                | Some u -> Some (Wire.Uuid u)
                | None -> (
                    match from current_db with
                    | Some u -> Some (Wire.Uuid u)
                    | None -> None))
            | None -> (
                match from current_db with
                | Some u -> Some (Wire.Uuid u)
                | None -> None))
        | Wire.Array [ a; u ] | Wire.List [ a; u ]
          when a = Wire.keyword "block/uuid" -> (
            match u with Wire.Uuid _ -> Some u | _ -> None)
        | _ -> None)
  in
  let dropped =
    List.filter
      (fun (k, _) ->
         k <> Wire.keyword "db/id" && k <> Wire.keyword "block/order" && k <> Wire.keyword "block/page"
         && k <> Wire.keyword "block/tx-id")
      m
  in
  (* cljs (update :block/parent template-parent-ref) — :block/parent is
     always present in the result (nil when absent in the input) *)
  let with_parent =
    let has_parent = List.exists (fun (k, _) -> k = Wire.keyword "block/parent") dropped in
    let mapped =
      List.map
        (fun (k, v) ->
           if k = Wire.keyword "block/parent" then (k, template_parent_ref v)
           else (k, v))
        dropped
    in
    if has_parent then mapped
    else mapped @ [ (Wire.keyword "block/parent", template_parent_ref Wire.Nil) ]
  in
  match block_uuid with
  | Some (Wire.Uuid _ as u) ->
      Cljs_map.assoc (Wire.Map with_parent) "block/uuid" u
  | _ -> Wire.Map with_parent

(* ---- replay-canonical-outliner-op! ---- *)

let kw_str (w : Wire.t) : string option =
  match w with Wire.Keyword s | Wire.String s -> Some s | _ -> None

let opts_wire_map (w : Wire.t) : Wire.t =
  match w with Wire.Map _ -> w | _ -> Wire.Map []

let block_map_wire (w : Wire.t) : Block_map.t =
  Outliner_op.block_map_of_wire w

let resolve_temp_id
    ?(replay_created : (string, Wire.t) Hashtbl.t option) (db : db)
    (datom_v : Wire.t) : Wire.t =
  let replace v =
    match v with
    | Wire.String s when Sync_state.uuid_string s -> (
        let u = Datascript.Util.uuid_canonicalize s in
        match
          Datascript.entity db (Lookup_ref ("block/uuid", Uuid u))
        with
        | Some e -> Wire.Int e.id
        | None -> v)
    | _ -> v
  in
  (* replay path only: a db/add e-position lookup-ref the tx itself
     creates is unresolvable on a fresh base and strict resolution
     kills the whole tx — map it to one deterministic string tempid
     shared by every item materializing that entity. Off by default:
     remote txs and dangling refs keep strict resolution *)
  let e_created_uuid e =
    match replay_created with
    | None -> None
    | Some created -> (
        match e with
        | Wire.Uuid u when Hashtbl.mem created u -> Some u
        | Wire.Array [ a ; Wire.Uuid u ] | Wire.List [ a ; Wire.Uuid u ]
          when a = Wire.keyword "block/uuid" && Hashtbl.mem created u -> Some u
        | _ -> None)
  in
  let replace_e op e =
    match replace e with
    | e' when e' <> e -> e'
    | _ -> (
        match e_created_uuid e with
        | Some u
          when op = Wire.keyword "db/add" && entity_of_wire_ref db e = None -> (
            (* join the creator's own e form when it is a usable
               tempid — mixing forms (db/add "t-1" :block/uuid u plus
               [:block/uuid u] refs) would otherwise split the entity *)
            match
              (match replay_created with
               | Some created -> Hashtbl.find_opt created u
               | None -> None)
            with
            | Some ce
              when (match ce with
                    | Wire.Uuid _ -> false
                    | Wire.Array [ a ; Wire.Uuid _ ]
                    | Wire.List [ a ; Wire.Uuid _ ] ->
                        a <> Wire.keyword "block/uuid"
                    | _ -> true) -> ce
            | _ -> Wire.String ("replay-created-" ^ u))
        | _ -> e)
  in
  match datom_v with
  | Wire.Array (op :: e :: a :: v :: rest)
  | Wire.List (op :: e :: a :: v :: rest)
    when op = Wire.keyword "db/add" || op = Wire.keyword "db/retract" ->
      let e' = replace_e op e in
      let v' =
        match a with
        | Wire.Keyword attr when ref_attr db attr -> replace v
        | _ -> v
      in
      Wire.Array (op :: e' :: a :: v' :: rest)
  | _ -> datom_v

let rec replay_canonical_outliner_op (conn : conn) (op_entry : Wire.t)
    (rebase_db_before : db option) : Wire.t option =
  let op, args =
    match Outliner_op.op_of_entry op_entry with
    | Some x -> x
    | None -> invalid_rebase_op op_entry (Wire.Map [])
  in
  let db = Conn.db conn in
  match (op, args) with
  | "save-block", [ block; opts ] ->
      let block_uuid = Wire.get "block/uuid" block in
      let block_ent =
        match block_uuid with
        | Some (Wire.Uuid u) ->
            Datascript.entity db (Lookup_ref ("block/uuid", Uuid u))
        | _ -> None
      in
      let block_base =
        block
        |> Wire.as_map
        |> List.filter (fun (k, _) -> k <> Wire.keyword "db/id" && k <> Wire.keyword "block/order")
        |> fun kvs -> Wire.Map kvs
      in
      let block' =
        Sync_deps.require "rewrite_block_title_with_retracted_refs"
          Sync_deps.rewrite_block_title_with_retracted_refs db block_base
      in
      (match block_ent with
       | None ->
           invalid_rebase_op (Wire.keyword op)
             (Wire.Map [ Wire.keyword "args", Wire.Array args
                       ; Wire.keyword "reason", Wire.keyword "missing-block" ])
       | Some _ -> ());
      ignore
        (Outliner_core.save_block_conn conn (block_map_wire block')
           (Outliner_op.save_opts_of (opts_wire_map opts))
           (block_map_wire opts));
      None
  | "insert-blocks", [ blocks; target_id; opts ] ->
      let sibling =
        match Wire.get "sibling?" (opts_wire_map opts) with
        | Some (Wire.Bool b) -> b
        | _ -> false
      in
      (match
         rebase_resolve_target_and_sibling db rebase_db_before target_id
           ~page_root_fallback:true sibling
       with
       | Some (target, sibling') -> (
           let blocks' =
             tx_items_of blocks
             |> List.map (fun b ->
                    Sync_deps.require
                      "rewrite_block_title_with_retracted_refs"
                      Sync_deps.rewrite_block_title_with_retracted_refs db b)
           in
           match blocks' with
           | [] ->
               invalid_rebase_op (Wire.keyword op)
                 (Wire.Map [ Wire.keyword "args", Wire.Array args ])
           | _ ->
               let opts' =
                 Cljs_map.assoc (opts_wire_map opts) "sibling?"
                   (Wire.Bool sibling')
               in
               ignore
                 (Outliner_core.insert_blocks_conn conn
                    (List.map block_map_wire blocks')
                    (Block_map.of_entity target)
                    (Outliner_op.insert_opts_of opts')
                    (block_map_wire opts'));
               None)
       | None ->
           invalid_rebase_op (Wire.keyword op)
             (Wire.Map [ Wire.keyword "args", Wire.Array args ]))
  | "apply-template", [ template_id; target_id; opts ] -> (
      let template_id' = replay_entity_id_value db template_id in
      let sibling =
        match Wire.get "sibling?" (opts_wire_map opts) with
        | Some (Wire.Bool b) -> b
        | _ -> false
      in
      let resolved =
        rebase_resolve_target_and_sibling db rebase_db_before target_id
          ~page_root_fallback:true sibling
      in
      let template_ent = entity_of_wire_ref db template_id' in
      match (template_ent, resolved) with
      | Some template, Some (target, sibling') -> (
          let template_uuid =
            match Datascript.entity_attr template "block/uuid" with
            | Some (One_value (Uuid u)) -> Some u
            | _ -> None
          in
          let target_uuid =
            match Datascript.entity_attr target "block/uuid" with
            | Some (One_value (Uuid u)) -> Some u
            | _ -> None
          in
          match (template_uuid, target_uuid) with
          | Some tuuid, Some tguuid ->
              let replace_empty_target =
                match Wire.get "replace-empty-target?"
                        (opts_wire_map opts) with
                | Some (Wire.Bool b) -> b
                | _ -> false
              in
              let template_blocks =
                match Wire.get "template-blocks" (opts_wire_map opts) with
                | Some (Wire.Array xs) | Some (Wire.List xs) ->
                    xs
                    |> List.mapi (fun idx block ->
                           let block' =
                             sanitize_template_block db rebase_db_before
                               block
                           in
                           let block'' =
                             if replace_empty_target && idx = 0
                                && not
                                     (wire_truthy
                                        (Wire.get "block/uuid" block'))
                             then
                               Cljs_map.assoc block' "block/uuid"
                                 (Wire.Uuid tguuid)
                             else block'
                           in
                           if wire_truthy (Wire.get "block/uuid" block'') then
                             Some block''
                           else None)
                    |> List.filter_map Fun.id
                | _ -> []
              in
              let opts' =
                let o = opts_wire_map opts in
                let o = Cljs_map.assoc o "sibling?" (Wire.Bool sibling') in
                let o =
                  Wire.Map
                    (List.filter
                       (fun (k, _) -> k <> Wire.keyword "template-blocks")
                       (Wire.as_map o))
                in
                if template_blocks <> [] then
                  Cljs_map.assoc o "template-blocks"
                    (Wire.Array template_blocks)
                else o
              in
              ignore
                (Outliner_op.apply_ops conn
                   (Wire.Array
                      [ Wire.Array
                          [ Wire.keyword "apply-template"
                          ; Wire.Array
                              [ Wire.Uuid tuuid; Wire.Uuid tguuid; opts' ] ] ])
                   (Wire.Map [ (Wire.keyword "gen-undo-ops?", Wire.Bool false) ]));
              None
          | _ ->
              invalid_rebase_op (Wire.keyword op)
                (Wire.Map
                   [ Wire.keyword "args", Wire.Array args
                   ; Wire.keyword "reason", Wire.keyword "missing-template-or-target-uuid" ]))
      | _ ->
          invalid_rebase_op (Wire.keyword op)
            (Wire.Map
               [ Wire.keyword "args", Wire.Array args
               ; Wire.keyword "reason", Wire.keyword "missing-template-or-target-block" ]))
  | "move-blocks", [ ids; target_id; opts ] -> (
      let ids' = replay_entity_id_coll db ids in
      let blocks = List.filter_map (entity_of_wire_ref db) ids' in
      let sibling =
        match Wire.get "sibling?" (opts_wire_map opts) with
        | Some (Wire.Bool b) -> b
        | _ -> false
      in
      let resolved =
        rebase_resolve_target_and_sibling db rebase_db_before target_id
          sibling
      in
      match (blocks, resolved) with
      | _ :: _, Some (target, sibling') ->
          Outliner_core.move_blocks_conn conn blocks target
            (Outliner_op.insert_opts_of
               (Cljs_map.assoc (opts_wire_map opts) "sibling?"
                  (Wire.Bool sibling')))
            (block_map_wire
               (Cljs_map.assoc (opts_wire_map opts) "sibling?"
                  (Wire.Bool sibling')));
          None
      | _ ->
          invalid_rebase_op (Wire.keyword op) (Wire.Map [ Wire.keyword "args", Wire.Array args ]))
  | "move-blocks-up-down", [ ids; up ] ->
      let ids' = replay_entity_id_coll db ids in
      let blocks = List.filter_map (entity_of_wire_ref db) ids' in
      let up = match up with Wire.Bool b -> b | _ -> false in
      (match blocks with
       | [] -> ()
       | _ -> Outliner_core.move_blocks_up_down_conn conn blocks up);
      None
  | "indent-outdent-blocks", [ ids; indent; opts ] ->
      let ids' = replay_entity_id_coll db ids in
      let blocks = List.filter_map (entity_of_wire_ref db) ids' in
      let indent = match indent with Wire.Bool b -> b | _ -> false in
      (match blocks with
       | [] ->
           invalid_rebase_op (Wire.keyword op)
             (Wire.Map [ Wire.keyword "args", Wire.Array args ])
       | _ ->
           Outliner_core.indent_outdent_blocks_conn conn blocks indent
             (block_map_wire (opts_wire_map opts)));
      None
  | "delete-blocks", [ ids; _opts ] ->
      let ids' = replay_entity_id_coll db ids in
      let blocks = List.filter_map (entity_of_wire_ref db) ids' in
      (match blocks with
       | [] -> ()
       | _ ->
           ignore
             (Outliner_core.delete_blocks_conn conn
                (List.map Block_map.of_entity blocks)
                (block_map_wire (opts_wire_map _opts))));
      None
  | "create-page", [ title; opts ] -> (
      let title_str =
        match title with Wire.String s -> s | _ -> ""
      in
      let opts = opts_wire_map opts in
      let opt_bool k =
        match Wire.get k opts with
        | Some (Wire.Bool b) -> b
        | _ -> false
      in
      let page_uuid =
        match Wire.get "uuid" opts with
        | Some (Wire.Uuid u) -> Some u
        | Some (Wire.String u) when Sync_state.uuid_string u -> Some u
        | _ -> None
      in
      let existing_page =
        (* A page, a tag or a property can share a title; only an entity
           of the kind being created is this page. *)
        let by_title =
          match Ldb.get_page db (String title_str) with
          | Some page
            when (not (Ldb.is_property page))
                 && opt_bool "class?" = Ldb.is_class page ->
              Some page
          | _ -> None
        in
        match page_uuid with
        | Some u -> (
            match
              Datascript.entity db (Lookup_ref ("block/uuid", Uuid u))
            with
            | Some e -> Some e
            | None -> by_title)
        | None -> by_title
      in
      match existing_page with
      | Some page when not (Ldb.recycled page) -> (
          let title_v =
            match Datascript.entity_attr page "block/title" with
            | Some (One_value (String s)) -> Wire.String s
            | _ -> Wire.Nil
          in
          let uuid_v =
            match Datascript.entity_attr page "block/uuid" with
            | Some (One_value (Uuid u)) -> Wire.Uuid u
            | _ -> Wire.Nil
          in
          Some (Wire.Array [ title_v; uuid_v ]))
      | _ ->
          (* cljs (outliner-page/create! conn title opts) — opts carries
             :uuid/:tags/:properties/flags; keep them on replay so the
             recreated page keeps the wire uuid *)
          let created_title, created_uuid =
            Outliner_page.create_bang conn title_str
              ~opts:(fun () ->
                Outliner_page.create db title_str
                    ?uuid:page_uuid
                    ?tags:
                      (match Wire.get "tags" opts with
                       | Some w -> Some (tx_items_of w)
                       | None -> None)
                    ?properties:
                      (match Wire.get "properties" opts with
                       | Some (Wire.Map kvs) ->
                           Some
                             (List.filter_map
                                (fun (k, v) ->
                                   match kw_str k with
                                   | Some s -> Some (s, v)
                                   | None -> None)
                                kvs)
                       | _ -> None)
                    ~persist_op:
                      (match Wire.get "persist-op?" opts with
                       | Some (Wire.Bool b) -> b
                       | _ -> true)
                    ~class_:(opt_bool "class?")
                    ~journal:(opt_bool "journal?")
                    ~today_journal:(opt_bool "today-journal?")
                    ~split_namespace:
                      (match Wire.get "split-namespace?" opts with
                       | Some (Wire.Bool b) -> b
                       | _ -> false)
                    ?class_ident_namespace:
                      (match Wire.get "class-ident-namespace" opts with
                       | Some (Wire.String s) -> Some s
                       | _ -> None)
                    ())
              ()
          in
          (* cljs create! returns [title page-uuid] *)
          Some
            (Wire.Array
               [ Wire.String created_title
               ; (match created_uuid with
                  | Some u -> Wire.Uuid u
                  | None -> Wire.Nil) ]))
  | "delete-page", [ page_uuid; opts ] ->
      (match page_uuid with
       | Wire.Uuid u | Wire.String u ->
           ignore (Outliner_page.delete_conn conn u (opts_wire_map opts))
       | _ -> ());
      None
  | "upsert-property", property_id :: schema :: rest -> (
      let opts = match rest with o :: _ -> opts_wire_map o | [] -> Wire.Map [] in
      let property_name =
        Option.bind (Wire.get "property-name" opts) kw_str
      in
      let properties =
        match Wire.get "properties" opts with
        | Some (Wire.Map kvs) ->
            List.filter_map
              (fun (k, v) -> Option.map (fun k' -> (k', v)) (kw_str k))
              kvs
        | _ -> []
      in
      ignore
        (Outliner_property.upsert_property conn (kw_str property_id) schema
           ~property_name ~properties);
      None)
  | "restore-recycled", [ root_id ] -> (
      let root_ref =
        match root_id with
        | Wire.Array [ a; _ ] | Wire.List [ a; _ ] when a = Wire.keyword "block/uuid" ->
            root_id
        | Wire.Uuid _ -> Wire.Array [ Wire.keyword "block/uuid"; root_id ]
        | _ -> root_id
      in
      let root = entity_of_wire_ref db root_ref in
      let tx_ops =
        match root with
        | Some r -> Outliner_recycle.restore_tx_data db r
        | None -> []
      in
      match tx_ops with
      | [] ->
          invalid_rebase_op (Wire.keyword op)
            (Wire.Map
               [ Wire.keyword "args", Wire.Array args
               ; Wire.keyword "reason", Wire.keyword "invalid-restore-target" ])
      | _ ->
          ignore
            (Db_tx.transact
               ~tx_meta:[ "outliner-op", Keyword "restore-recycled" ] conn
               tx_ops);
          None)
  | "recycle-delete-permanently", [ root_id ] -> (
      let root_ref =
        match root_id with
        | Wire.Array [ a; _ ] | Wire.List [ a; _ ] when a = Wire.keyword "block/uuid" ->
            root_id
        | Wire.Uuid _ -> Wire.Array [ Wire.keyword "block/uuid"; root_id ]
        | _ -> root_id
      in
      let root = entity_of_wire_ref db root_ref in
      match root with
      | Some r -> (
          match Outliner_recycle.permanently_delete_tx_data db r with
          | [] -> None
          | tx_ops ->
              (* cljs returns the transact report — callers/tests only need
                 truthy-vs-nil, so Bool true carries the same signal *)
              ignore
                (Db_tx.transact
                   ~tx_meta:
                     [ "outliner-op", Keyword "recycle-delete-permanently" ]
                   conn tx_ops);
              Some (Wire.Bool true))
      | None -> None)
  | _, [ tx_data; tx_meta ] ->
      let tx_data =
        expand_block_retracts_to_descendants db (tx_items_of tx_data)
      in
      let tx_data =
        (* verbatim replay datoms carry bare uuid strings in entity
           position — an unresolvable one registers a tempid and
           materializes a uuid-less shell entity. Resolve each ref and
           drop ops whose targets are missing on this conn, same as the
           remote-apply and confirm pipelines do *)
        tx_data
        |> List.map (resolve_temp_id db)
        |> drop_missing_block_ref_ops db
      in
      (match tx_data with
       | [] -> None
       | _ ->
           ignore
             (Db_transact.transact conn tx_data
                (Ds_wire.tx_meta_of_transit tx_meta));
           None)
  | _ -> None

and expand_block_retracts_to_descendants (db : db) (tx_data : Wire.t list)
    : Wire.t list =
  let explicit_retracts =
    List.filter_map
      (fun item ->
         match item with
         | Wire.Array [ op; e ] | Wire.List [ op; e ]
           when op = Wire.keyword "db/retractEntity" || op = Wire.keyword "db.fn/retractEntity" -> (
             match entity_of_wire_ref db e with
             | Some ent -> Some ent.id
             | None -> None)
         | _ -> None)
      tx_data
  in
  (* cljs block-descendants: (sort-by :block/order (:block/_raw-parent b))
     — raw children incl. closed-value/created-from-property, order-sorted.
     visited guards parent cycles (a moved block can temporarily close a
     loop while an ancestor is selected). *)
  let visited = Hashtbl.create 16 in
  let rec descendants (block : entity) : entity list =
    Ldb.sort_by_order (Ldb.ref_ents block "block/_parent")
    |> List.concat_map (fun child ->
           if Hashtbl.mem visited child.id then []
           else begin
             Hashtbl.add visited child.id ();
             child :: descendants child
           end)
  in
  let descendants block =
    Hashtbl.add visited block.id ();
    descendants block
  in
  List.concat_map
    (fun item ->
       match item with
       | Wire.Array [ op; e ] | Wire.List [ op; e ]
         when op = Wire.keyword "db/retractEntity" || op = Wire.keyword "db.fn/retractEntity" -> (
           match entity_of_wire_ref db e with
           | Some root ->
               descendants root
               |> List.filter (fun ent ->
                      not (List.mem ent.id explicit_retracts))
               |> List.map (fun ent ->
                      let ref_v =
                        match
                          Datascript.entity_attr ent "block/uuid"
                        with
                        | Some (One_value (Uuid u)) ->
                            Wire.Array [ Wire.keyword "block/uuid"; Wire.Uuid u ]
                        | _ -> Wire.Int ent.id
                      in
                      Wire.Array [ Wire.keyword "db/retractEntity"; ref_v ])
               |> fun ds -> ds @ [ item ]
           | None -> [ item ])
       | _ -> [ item ])
    tx_data

(* ---- reverse / rebase ---- *)

(* uuids a tx actually creates: asserted via a block/uuid identity
   item. pending_tx_uuid_delta's e-position over-count deliberately
   (server upsert semantics), which would resurrect dangling
   e-refs — replay needs the strict set. Maps uuid → the creator
   item's e-position so refs can join a non-uuid creator form *)
let tx_self_created (items : Wire.t list) : (string, Wire.t) Hashtbl.t =
  let t = Hashtbl.create 16 in
  List.iter
    (fun item ->
      match item with
      | Wire.Array (op :: e :: a :: Wire.Uuid u :: _)
      | Wire.List (op :: e :: a :: Wire.Uuid u :: _)
        when op = Wire.keyword "db/add" && a = Wire.keyword "block/uuid" ->
          if not (Hashtbl.mem t u) then Hashtbl.replace t u e
      | _ -> ())
    items;
  t

let inline_history_action (tx_meta : tx_meta)
    : (value option * Wire.t list * Wire.t list) option =
  let get_opt names =
    List.find_map
      (fun n ->
         match List.assoc_opt n tx_meta with
         | Some (Vector xs) -> Some (List.map Ds_wire.transit_of_value xs)
         | Some (List xs) -> Some (List.map Ds_wire.transit_of_value xs)
         | _ -> None)
      names
  in
  match
    ( get_opt [ "db-sync/forward-outliner-ops"; "forward-outliner-ops" ]
    , get_opt [ "db-sync/inverse-outliner-ops"; "inverse-outliner-ops" ] )
  with
  | Some fwd, Some inv when fwd <> [] && inv <> [] ->
      Some (List.assoc_opt "outliner-op" tx_meta, fwd, inv)
  | _ -> None

(* apply-history-action! *)
let apply_history_action repo (tx_id : string) (undo : bool)
    (tx_meta : tx_meta) : Wire.t =
  match Worker_state.datascript_conn repo with
  | None ->
      Sync_util.fail_fast "db-sync/missing-db"
        (Wire.Map
           [ Wire.keyword "repo", Wire.String repo
           ; Wire.keyword "op", Wire.keyword "apply-history-action" ])
  | Some conn -> (
      let action =
        match pending_tx_by_id repo tx_id with
        | Some entry ->
            Some
              ( (match entry.outliner_op with
                 | Some o -> Some (Keyword o)
                 | None -> None)
              , entry.forward_outliner_ops
              , entry.inverse_outliner_ops
              , entry.tx
              , entry.reversed_tx )
        | None -> (
            match inline_history_action tx_meta with
            | Some (op, fwd, inv) -> Some (op, fwd, inv, Wire.Array [], Wire.Array [])
            | None -> None)
      in
      match action with
      | None ->
          Wire.Map
            [ Wire.keyword "applied?", Wire.Bool false
            ; Wire.keyword "reason", Wire.keyword "missing-history-action"
            ; Wire.keyword "tx-id", Wire.String tx_id ]
      | Some (outliner_op, forward_ops, inverse_ops, tx, reversed_tx) ->
          let action_wire =
            Wire.Map
              [ ( Wire.keyword "outliner-op"
                , match outliner_op with
                    | Some o -> Ds_wire.transit_of_value o
                    | None -> Nil )
              ; Wire.keyword "forward-outliner-ops", Wire.Array forward_ops
              ; Wire.keyword "inverse-outliner-ops", Wire.Array inverse_ops
              ; Wire.keyword "tx", tx
              ; Wire.keyword "reversed-tx", reversed_tx ]
          in
          if outliner_op = Some (Keyword "fix") then
            Wire.Map
              [ Wire.keyword "applied?", Wire.Bool false
              ; Wire.keyword "reason", Wire.keyword "unsupported-history-action"
              ; Wire.keyword "action", action_wire ]
          else
            let ops =
              (if undo then inverse_ops else forward_ops)
              |> List.filter (fun op_entry ->
                     match Outliner_op.op_of_entry op_entry with
                     | Some (op_name, _) ->
                         List.mem op_name
                           Outliner_op.semantic_outliner_op_names
                     | None -> false)
            in
            let tx_data_items =
              (if undo then reversed_tx else tx)
              |> normalize_tx_data_for_rebase
            in
            let ops' =
              match ops with
              | _ :: _ -> ops
              | [] ->
                  [ Wire.Array
                      [ Wire.keyword "transact"
                      ; Wire.Array
                          [ Wire.Array tx_data_items; Wire.Nil ] ] ]
            in
            let provided_history_tx_id =
              match List.assoc_opt "db-sync/tx-id" tx_meta with
              | Some (Uuid s) when s <> tx_id -> Some s
              | _ -> None
            in
            let history_tx_id =
              Option.value provided_history_tx_id ~default:(Uuid_gen.uuid ())
            in
            let fwd = if undo then inverse_ops else forward_ops in
            let inv = if undo then forward_ops else inverse_ops in
            let tx_meta' : tx_meta =
              [ "outliner-op"
              , (match outliner_op with Some o -> o | None -> Nil)
              ; "local-tx?", Bool true
              ; "gen-undo-ops?", Bool false
              ; "persist-op?", Bool true
              ; "undo?", Bool undo
              ; ( "redo?"
                , match List.assoc_opt "redo?" tx_meta with
                  | Some (Bool b) -> Bool b
                  | _ -> Bool false )
              ; "db-sync/tx-id", Uuid history_tx_id
              ; ( "db-sync/source-tx-id"
                , match List.assoc_opt "db-sync/source-tx-id" tx_meta with
                  | Some (Uuid s) -> Uuid s
                  | _ -> Uuid tx_id )
              ; "db-sync/forward-outliner-ops"
              , Vector (List.map Ds_wire.value_of_transit fwd)
              ; "db-sync/inverse-outliner-ops"
              , Vector (List.map Ds_wire.value_of_transit inv) ]
            in
            (match ops' with
             | [] ->
                 Wire.Map
                   [ Wire.keyword "applied?", Wire.Bool false
                   ; Wire.keyword "reason", Wire.keyword "unsupported-history-action"
                   ; Wire.keyword "action", action_wire ]
             | _ -> (
                 try
                   if ops <> [] then
                     Sync_deps.require "assert_no_numeric_entity_ids"
                       Sync_deps.assert_no_numeric_entity_ids conn ops
                       "history-action-ops";
                   ignore
                     (batch_transact_with_temp_conn conn tx_meta' (fun c ->
                           List.iter
                             (fun op ->
                                ignore
                                  (replay_canonical_outliner_op c op None))
                             ops')
                        ());
                   Wire.Map
                     [ Wire.keyword "applied?", Wire.Bool true
                     ; Wire.keyword "history-tx-id", Wire.Uuid history_tx_id ]
                 with e ->
                   let reason = history_action_error_reason e in
                   if not (expected_history_action_error_reason reason) then
                     Worker_log.error "undo-redo-failed"
                       [ "repo", repo; "error", Printexc.to_string e ];
                   Wire.Map
                     [ Wire.keyword "applied?", Wire.Bool false
                     ; Wire.keyword "reason", reason
                     ; Wire.keyword "action", action_wire ])))

(* The fix must be computed on the shared confirmed state — the server
   conn — not the display conn: pending ops differ per client, so sibling
   sets computed on display state would produce different fixes and the
   clients' orders would diverge permanently. Lookup-ref keys resolve to
   display eids on transact. *)
let fix_tx repo (display_conn : conn) ~(jump_tx_data : datom list)
    (tx_meta : tx_meta) : unit =
  (* jump datoms carry server-conn eids (remote apply ran on server_conn),
     replayed datoms carry display eids — only the jump portion is valid
     input for a server-db evaluation *)
  let fixes =
    match Sync_state.server_conn repo with
    | Some server_conn ->
        Db_sync_order.dup_order_fix_ops (Conn.db server_conn) jump_tx_data
    | None -> []
  in
  (* fixes carry server-conn [:block/uuid u] lookup-refs that resolve
     against the display db at transact time. A pending replay can have
     deleted the target on display while it stays alive on the server
     conn — resolve each ref now and drop ops whose target is gone
     (the pending delete uploads anyway, so an order fix on a
     being-deleted entity is moot). cljs emits live-conn eids for the
     same conn it transacts on and never hits this. *)
  let display_db = Conn.db display_conn in
  let fixes =
    List.filter_map
      (fun (op : tx_op) ->
         match op with
         | Add (Lookup_ref _ as r, a, v) -> (
             match Datascript.entid_ref display_db r with
             | Some eid -> Some (Add (Entity_id eid, a, v))
             | None -> None)
         | _ -> Some op)
      fixes
  in
  if fixes <> [] then
    let _report =
      Datascript.transact_conn display_conn fixes
        ~tx_meta:
          (List.filter (fun (k, _) -> k <> "op") tx_meta
           @ [ ("op", Keyword "fix-duplicate-order") ])
    in
    ()

let sync_fix_tx_meta () : tx_meta =
  [ "outliner-op", Keyword "fix"
  ; "gen-undo-ops?", Bool false
  ; "db-sync/tx-id", Uuid (Uuid_gen.uuid ()) ]

let pending_tx_ids (local_txs : Sync_client_op.local_tx_entry list) =
  List.map (fun (t : Sync_client_op.local_tx_entry) -> t.tx_id) local_txs

(* ---- transact-remote-txs! ---- *)

(* Remote txs reference entities by [:block/uuid u] lookup-refs. Strict
   positions (retract/retractEntity/db.fn) crash on a missing entity so
   they are dropped as no-ops. Lookup-refs never upsert in this
   datascript — when the uuid is absent from the conn, rewrite the ref:
   - u created inside this tx (a remote "new entity"): every
     [:block/uuid u] ref becomes a shared tempid so the tempid path
     materializes the entity;
   - u nowhere (pending-deleted locally, or simply unseen): rewrite to a
     uuid-string tempid plus an injected [:db/add tempid "block/uuid" u]
     stub — the same uuid shell the server's ingest held; a later
     journal tx fills the shell in. *)
let rewrite_missing_uuid_refs
    ?(remote_deleted : SSet.t = SSet.empty)
    ?(stale : SSet.t ref = ref SSet.empty)
    (db : db) (tx_data : Wire.t list) : Wire.t list =
  (* uuid -> the e-position tempid its block/uuid add uses in this tx;
     refs to a created uuid must reuse that tempid — a bare uuid string
     would register a *different* tempid appearing only as a value *)
  let uuid_adds (tbl : (string, Wire.t) Hashtbl.t) (items : Wire.t list)
      : unit =
    List.iter
      (fun item ->
         match item with
         | Wire.Array (op :: e :: a :: v :: _)
         | Wire.List (op :: e :: a :: v :: _)
           when op = Wire.keyword "db/add" && a = Wire.keyword "block/uuid" -> (
             match uuid_str_of_wire v with
             | Some u ->
                 let u = Datascript.Util.uuid_canonicalize u in
                 if not (Hashtbl.mem tbl u) then Hashtbl.replace tbl u e
             | None -> ())
         | _ -> ())
      items
  in
  let created : (string, Wire.t) Hashtbl.t = Hashtbl.create 8 in
  uuid_adds created tx_data;
  let on_srv u = Outliner_op.entity_of_uuid db u <> None in
  let display_only = ref SSet.empty in
  (* uuids the caller marked remotely-deleted (never-journaled data only —
     the confirm fallback and unapply pass this set): items still
     carrying refs to them are dropped whole — materializing a shell
     would resurrect an entity confirmed gone, and keeping the verbatim
     [:block/uuid u] crashes transact *)
  let dead = ref SSet.empty in
  let uuid_of_ref_pos w =
    match block_uuid_lookup_ref_value w with
    | Some s -> Some (Datascript.Util.uuid_canonicalize s)
    | None -> (
        match w with
        | Wire.String s when Sync_state.uuid_string s ->
            Some (Datascript.Util.uuid_canonicalize s)
        | Wire.Uuid s -> Some (Datascript.Util.uuid_canonicalize s)
        | _ -> None)
  in
  (* uuids this tx writes to through e-position adds — the journal holds
     every journal entry verbatim, so a uuid absent on this conn can
     only arrive via its own entries. A uuid-string e-position add
     materializes the uuid shell (the same upsert the server's ingest
     produced) and the tx's other writes fill it in. A uuid that is only
     *named* in value position never materializes a fillable entity — a
     lone block/uuid shell fails schema validation — so refs to one
     drop the item *)
  let written_uuids (items : Wire.t list) : SSet.t =
    List.fold_left
      (fun acc item ->
         match item with
         | Wire.Array (op :: e :: _ :: _)
         | Wire.List (op :: e :: _ :: _)
           when op = Wire.keyword "db/add" -> (
             match entity_pos_uuid e with
             | Some u ->
                 SSet.add (Datascript.Util.uuid_canonicalize u) acc
             | None -> acc)
         | _ -> acc)
      SSet.empty items
  in
  (* stale carries the uuids of entities whose items were dropped this
     batch — either here in a prior pass or by the caller's prior remote
     txs. Follow-up ops on a stale entity must not resurrect it *)
  let rec converge (items : Wire.t list) : Wire.t list =
    let created' = Hashtbl.create 8 in
    uuid_adds created' items;
    let written = written_uuids items in
    let temp_id_uuid = Sync_apply.tx_temp_id_uuid items in
    let missing u =
      (not (on_srv u)) && not (Hashtbl.mem created' u)
      && not (SSet.mem u written)
    in
    let rec any_missing w =
      match uuid_of_ref_pos w with
      | Some u -> missing u
      | None -> (
          match w with
          | Wire.Array xs -> List.exists any_missing xs
          | Wire.List xs -> List.exists any_missing xs
          | Wire.Set xs -> List.exists any_missing xs
          | Wire.Map kvs ->
              List.exists (fun (k, v) -> any_missing k || any_missing v) kvs
          | Wire.Tagged (_, v) -> any_missing v
          | _ -> false)
    in
    let drops (item : Wire.t) : bool =
      match item with
      | Wire.Array (op :: _ :: a :: v :: rest)
      | Wire.List (op :: _ :: a :: v :: rest)
        when op = Wire.keyword "db/add" -> (
          (match
             Sync_apply.tx_item_entity_block_uuid ~temp_id_uuid db item
           with
           | Some u -> SSet.mem (Datascript.Util.uuid_canonicalize u) !stale
           | None -> false)
          ||
          match a with
          | Wire.Keyword attr when ref_attr db attr ->
              List.exists any_missing (v :: rest)
          | _ -> false)
      | _ -> false
    in
    let kept, dropped_ents =
      List.fold_left
        (fun (k, d) item ->
           if drops item then
             ( k
             , (* only entities that can't exist — ones absent on the
                  conn — go stale; a live entity keeps its other items *)
               match
                 Sync_apply.tx_item_entity_block_uuid ~temp_id_uuid db
                   item
               with
               | Some u ->
                   let u = Datascript.Util.uuid_canonicalize u in
                   if on_srv u then d else u :: d
               | None -> d )
           else (item :: k, d))
        ([], []) items
    in
    let new_stale =
      List.fold_left
        (fun s u -> if SSet.mem u !stale then s else SSet.add u s)
        SSet.empty dropped_ents
    in
    if SSet.is_empty new_stale then List.rev kept
    else begin
      stale := SSet.union !stale new_stale;
      converge (List.rev kept)
    end
  in
  let tx_data = converge tx_data in
  Hashtbl.reset created;
  uuid_adds created tx_data;
  let written = written_uuids tx_data in
  let rec rewrite_pos w =
    match uuid_of_ref_pos w with
    | Some u -> (
        if on_srv u then Some w
        else
          match Hashtbl.find_opt created u with
          | Some t -> Some t
          | None ->
              if SSet.mem u remote_deleted then begin
                dead := SSet.add u !dead;
                Some w
              end
              else if SSet.mem u written then begin
                (* e-written in this tx — materialize the uuid shell so
                   the verbatim ref joins it; lookup-refs never upsert
                   here, and a lone shell would fail schema validation *)
                display_only := SSet.add u !display_only;
                Some (Wire.String u)
              end
              else None)
    | None -> (
        (* coll values under a ref attr are colls OF refs — cardinality-
           many attrs like block/tags arrive as nested lookup-refs;
           unresolvable elements drop individually *)
        match w with
        | Wire.Array xs ->
            Some (Wire.Array (List.filter_map rewrite_pos xs))
        | Wire.List xs ->
            Some (Wire.List (List.filter_map rewrite_pos xs))
        | Wire.Set xs ->
            Some (Wire.Set (List.filter_map rewrite_pos xs))
        | Wire.Map kvs ->
            Some
              (Wire.Map
                 (List.filter_map
                    (fun (k, v) ->
                       match rewrite_pos k, rewrite_pos v with
                       | Some k', Some v' -> Some (k', v')
                       | _ -> None)
                    kvs))
        | Wire.Tagged (t, v) -> (
            match rewrite_pos v with
            | Some v' -> Some (Wire.Tagged (t, v'))
            | None -> None)
        | _ -> Some w)
  in
  (* entity position is always a scalar ref — never a coll — so the
     deep walk would only misfire on non-uuid lookups like
     [:block/name "uuid-shaped-string"]. An e-position [:block/uuid u]
     resolves strictly (unlike v-position, it never upserts): when u is
     on neither conn the e-position writes themselves materialize the
     uuid shell — the same upsert the server's ingest produced *)
  let rewrite_e_pos w =
    match uuid_of_ref_pos w with
    | Some u -> (
        if on_srv u then w
        else
          match Hashtbl.find_opt created u with
          | Some t -> t
          | None ->
              if SSet.mem u remote_deleted || SSet.mem u !stale then w
              else begin
                display_only := SSet.add u !display_only;
                Wire.String u
              end)
    | None -> w
  in
  (* strict positions (retract/retractEntity/cas/db-id) must resolve on
     this conn or within this tx — display-only uuids can't name a
     server-conn datom, and a verbatim [:block/uuid u] there crashes
     transact with "Nothing found for entity id". When the uuid is
     missing, the datom the op targets can't exist either, so the op is
     a true no-op and dropping it preserves parity — unlike shell
     upserts, which would add a phantom uuid the journal never created. *)
  let resolvable w =
    match uuid_of_ref_pos w with
    | Some u -> on_srv u || Hashtbl.mem created u
    | None -> true
  in
  let rec resolvable_deep w =
    match uuid_of_ref_pos w with
    | Some _ -> resolvable w
    | None -> (
        match w with
        | Wire.Array xs -> List.for_all resolvable_deep xs
        | Wire.List xs -> List.for_all resolvable_deep xs
        | Wire.Set xs -> List.for_all resolvable_deep xs
        | Wire.Map kvs ->
            List.for_all
              (fun (k, v) -> resolvable_deep k && resolvable_deep v)
              kvs
        | Wire.Tagged (_, v) -> resolvable_deep v
        | _ -> true)
  in
  let rec refs_dead w =
    match uuid_of_ref_pos w with
    | Some u -> SSet.mem u !dead
    | None -> (
        match w with
        | Wire.Array xs | Wire.List xs | Wire.Set xs ->
            List.exists refs_dead xs
        | Wire.Map kvs ->
            List.exists
              (fun (k, v) -> refs_dead k || refs_dead v) kvs
        | Wire.Tagged (_, v) -> refs_dead v
        | _ -> false)
  in
  let item_refs_dead = function
    | Wire.Array (_ :: e :: _ :: v :: rest)
    | Wire.List (_ :: e :: _ :: v :: rest) ->
        refs_dead e || refs_dead v || List.exists refs_dead rest
    | Wire.Array (_ :: e :: _) | Wire.List (_ :: e :: _) -> refs_dead e
    | _ -> false
  in
  let is_db_fn_op = function
    | Wire.Keyword s -> String.length s >= 6 && String.sub s 0 6 = "db.fn/"
    | _ -> false
  in
  let tx_data =
    List.filter_map
      (fun item ->
         match item with
         | Wire.Array (op :: e :: a :: v :: rest)
         | Wire.List (op :: e :: a :: v :: rest)
           when op = Wire.keyword "db/add" -> (
             let e' = rewrite_e_pos e in
             let rewrite_ref w =
               match a with
               | Wire.Keyword attr when ref_attr db attr -> rewrite_pos w
               | _ -> Some w
             in
             match rewrite_ref v, List.map rewrite_ref rest with
             | Some v', rest' when List.for_all Option.is_some rest' -> (
                 let item' =
                   Wire.Array
                     (op :: e' :: a :: v' :: List.map Option.get rest')
                 in
                 if item_refs_dead item' then None else Some item')
             | _ -> None)
         | Wire.Array (op :: e :: rest)
         | Wire.List (op :: e :: rest)
           when op = Wire.keyword "db/add" ->
             let e' = rewrite_e_pos e in
             let item' = Wire.Array (op :: e' :: rest) in
             if item_refs_dead item' then None else Some item'
         | Wire.Array (op :: e :: a :: v :: rest)
         | Wire.List (op :: e :: a :: v :: rest)
           when op = Wire.keyword "db/retract" || op = Wire.keyword "db/cas" ->
             let ref_ok w =
               match a with
               | Wire.Keyword attr when ref_attr db attr ->
                   resolvable_deep w
               | _ -> true
             in
             let map_v w =
               match a with
               | Wire.Keyword attr when ref_attr db attr -> (
                   match rewrite_pos w with Some x -> x | None -> w)
               | _ -> w
             in
             if resolvable e && ref_ok v && List.for_all ref_ok rest
             then
               Some
                 (Wire.Array
                    (op :: rewrite_e_pos e :: a :: map_v v
                     :: List.map map_v rest))
             else None
         | Wire.Array [ op; e ] | Wire.List [ op; e ]
           when op = Wire.keyword "db/retractEntity"
                || op = Wire.keyword "db.fn/retractEntity" ->
             (* a remote retract of an entity this conn never received
                is a no-op — drop it rather than crash the transact *)
             if resolvable e then Some (Wire.Array [ op; rewrite_e_pos e ])
             else None
         | Wire.Array (op :: e :: rest) | Wire.List (op :: e :: rest)
           when is_db_fn_op op ->
             if resolvable e then
               Some (Wire.Array (op :: rewrite_e_pos e :: rest))
             else None
         | Wire.Map _ as m -> (
             match Wire.get "db/id" m with
             | Some id when not (resolvable id) -> None
             | _ -> Some m)
         | _ -> Some item)
      tx_data
  in
  List.rev_append
    (SSet.fold
       (fun u acc ->
          Wire.Array
            [ Wire.keyword "db/add"; Wire.String u; Wire.keyword "block/uuid"; Wire.Uuid u ]
          :: acc)
       !display_only [])
    tx_data

let transact_remote_txs
    ?(repo : string = "") (conn : conn)
    (remote_txs : Wire.t list) () : (Wire.t list * tx_report option) list =
  (* entities whose items were dropped by rewrite_missing_uuid_refs in
     this batch — a follow-up tx that e-writes one of them must not
     resurrect it *)
  let stale : SSet.t ref = ref SSet.empty in
  let rec loop remaining results =
    match remaining with
    | [] -> List.rev results
    | remote_tx :: rest ->
        let db = Conn.db conn in
        let raw_tx_data =
          match Wire.get "tx-data" remote_tx with
          | Some xs -> tx_items_of xs
          | None -> []
        in
        (* cljs sanitize-tx-entry flags keyed on the entry's outliner-op —
           remote delete/fix ops must cascade the same way they did on the
           server or descendants diverge *)
        let remote_op =
          match Wire.get "outliner-op" remote_tx with
          | Some (Wire.Keyword s) -> s
          | _ -> ""
        in
        let remote_delete_op =
          remote_op = "delete-blocks" || remote_op = "delete-page"
        in
        let tx_data =
          raw_tx_data
          |> fun items ->
             items
             |> List.map Ds_wire.value_of_transit
             |> Db_sync_tx_sanitize.sanitize_tx db
                 ~drop_missing_retract_ops:
                   (remote_delete_op || remote_op = "fix")
                 ~drop_ops_targeting_retracted_entities:remote_delete_op
                 ~retract_touched_descendants:remote_delete_op
             |> List.map Ds_wire.transit_of_value
          (* journal truth: the server applied these datoms verbatim —
             strip/sanitize is applied, then every remaining item
             lands — so the pull path must apply them verbatim too.
             Ref filters keyed on this conn's transient state
             (remote_deleted, a forward-looking deleted suffix, plain
             missing-ness) drop datoms that never re-arrive: a uuid
             deleted now and revived later loses its refs forever,
             leaving a bare shell. rewrite_missing_uuid_refs only keeps
             crash-guards that can't violate journal order: strict
             positions whose targets never resolve are true no-ops, and
             value-position refs to uuids nothing in this tx writes
             drop — an unresolved ref can never have journaled *)
          |> rewrite_missing_uuid_refs db ~stale
          |> List.map (resolve_temp_id db)
          |> drop_stale_adds_after_remote_entity_delete
        in
        let report =
          match tx_data with
          | [] -> None
          | _ -> (
              try
                let r =
                  Db_transact.transact conn tx_data
                    (apply_tx_meta remote_tx)
                in
                Sync_apply.record_remote_asserted (Conn.db conn) repo
                  tx_data;
                r
              with e ->
                let items_dump =
                  String.concat ","
                    (List.map
                       (fun (item : Wire.t) -> Transit_codec.to_string item)
                       (List.filteri (fun i _ -> i < 40) tx_data))
                in
                Worker_log.error "db-sync/remote-tx-apply-failed"
                  [ "outliner-op", remote_op
                  ; "error", Printexc.to_string e
                  ; "tx-items", items_dump ];
                raise e)
        in
        (* fold this tx's entity deletes/recreates into remote_deleted
           only after it applied: the set must gate later txs, never the
           same tx — a batch-level union poisons earlier items that
           legitimately referenced an entity a later tx deletes *)
        let tx_dead, tx_alive =
          List.fold_left
            (fun (dead, alive) (item : Wire.t) ->
               match tx_item_retract_entity_block_uuid item with
               | Some u -> SSet.add u dead, SSet.remove u alive
               | None -> (
                   match item with
                   | Wire.Array (op :: _ :: a :: v :: _)
                   | Wire.List (op :: _ :: a :: v :: _)
                     when op = Wire.keyword "db/add"
                          && a = Wire.keyword "block/uuid" -> (
                       match Sync_apply.uuid_str_of_wire v with
                       | Some u -> SSet.remove u dead, SSet.add u alive
                       | None -> dead, alive)
                   | _ -> dead, alive))
            (SSet.empty, SSet.empty) raw_tx_data
        in
        if not (SSet.is_empty tx_dead && SSet.is_empty tx_alive) then
          Sync_state.set_remote_deleted repo
            (SSet.diff
               (SSet.union (Sync_state.remote_deleted repo) tx_dead)
               tx_alive);
        let results' =
          match tx_data with
          | [] -> results
          | _ -> (tx_data, report) :: results
        in
        loop rest results'
  in
  (* remote_deleted tracks net-dead uuids for its other consumers — the
     confirm fallback for never-uploaded pending txs and the unapply
     deleted-readded poison — not for journal data itself. The set is
     cumulative across pulls and only loses uuids the remote side
     explicitly recreates: each tx's own deletes/recreates fold in after
     it applies (inside loop), so it always reflects last-write-wins at
     the conn's journal position; it resets wholesale only when the
     server conn is dropped (fresh download) *)
  loop remote_txs []

(* ---- pending replay / display rebuild ---- *)

(* Attrs whose db/ident creation is still queued — a property that only
   exists inside a pending entry is pending-created, not remotely
   deleted, so verbatim replay must keep items on it. *)
let pending_property_attrs (pending : Sync_client_op.local_tx_entry list)
    : SSet.t =
  List.fold_left
    (fun acc (e : Sync_client_op.local_tx_entry) ->
       List.fold_left
         (fun acc item ->
            match item with
            | Wire.Array l | Wire.List l
              when List.length l >= 4
                   && List.nth l 0 = Wire.keyword "db/add"
                   && List.nth l 2 = Wire.keyword "db/ident" -> (
                match List.nth l 3 with
                | Wire.Keyword a | Wire.String a
                  when Db_property.property a -> SSet.add a acc
                | _ -> acc)
            | _ -> acc)
         acc (tx_items_of e.tx))
    SSet.empty pending

(* block/uuid adds inside a pending entry's verbatim .tx — the entities
   that entry will create once uploaded. *)
let entry_created_uuids (local_tx : Sync_client_op.local_tx_entry)
    : string list =
  List.filter_map
    (fun item ->
       match item with
       | Wire.Array l | Wire.List l
         when List.length l >= 4
              && List.nth l 0 = Wire.keyword "db/add"
              && List.nth l 2 = Wire.keyword "block/uuid" -> (
           match List.nth l 3 with
           | Wire.Uuid u -> Some u
           | _ -> None)
       | _ -> None)
    (tx_items_of local_tx.tx)

let rec uuids_in_wire (w : Wire.t) : string list =
  match w with
  | Wire.Uuid u -> [ u ]
  | Wire.Array xs | Wire.List xs | Wire.Set xs ->
      List.concat_map uuids_in_wire xs
  | Wire.Map kvs ->
      List.concat_map
        (fun (k, v) -> uuids_in_wire k @ uuids_in_wire v)
        kvs
  | Wire.Tagged (_, v) -> uuids_in_wire v
  | _ -> []

(* a replayed entry whose ops reference uuids that another still-pending
   entry will create must NOT be marked failed: the verbatim upload
   applies entries in order, so the dep lands on the server first and
   the next rebase resolves. cljs fails such entries eagerly, which
   loses the op whenever a remote apply races the first upload after
   reconnect — deterministically killing offline work on the behind
   client (rtc-page-test). Defer instead: the entry stays pending; it
   fails naturally if the dep entry itself ever dies. *)
let references_pending_uuid (db : db)
    ~(pending : Sync_client_op.local_tx_entry list)
    (local_tx : Sync_client_op.local_tx_entry) : bool =
  let pending_created =
    List.concat_map
      (fun (e : Sync_client_op.local_tx_entry) ->
         if e.tx_id = local_tx.tx_id then [] else entry_created_uuids e)
      pending
  in
  List.exists
    (fun u ->
       List.mem u pending_created
       && (match Outliner_op.entity_of_uuid db u with
          | Some e -> List.length (Datascript.entity_attrs e) <= 1
          | None -> true))
    (List.concat_map uuids_in_wire local_tx.forward_outliner_ops)

let replay_pending_entry (repo : string) (conn : conn)
    (rebase_db_before : db option) ~(pending_attrs : SSet.t)
    (local_tx : Sync_client_op.local_tx_entry) : unit =
  let db = Conn.db conn in
  (* idempotent replay: a queued op may re-run against a newer base (e.g.
     its own ack echo rebuilt the display while the entry was still
     pending). When every block/uuid the tx creates already exists, the
     op's effects are already materialized — replaying it again would
     fail resolving targets that no longer exist even on db_before. *)
  let created_uuids = entry_created_uuids local_tx in
  let already_materialized =
    created_uuids <> []
    && List.for_all
         (fun u ->
            match Outliner_op.entity_of_uuid db u with
            | Some e ->
                (* a uuid-only entity is the stub injected by
                   rewrite_missing_uuid_refs — the entry's own
                   effects (title, parent, ...) are NOT materialized
                   and the entry must replay *)
                List.length (Datascript.entity_attrs e) > 1
            | None -> false)
         created_uuids
  in
  if already_materialized then ()
  else
    match local_tx.forward_outliner_ops with
    | _ :: _ as forward_ops ->
        let db_before_apply = Conn.db conn in
        let ops =
          Outliner_op_construct.canonicalize_insert_ops (Conn.db conn)
            (Wire.as_seq local_tx.tx) forward_ops
        in
        (* capture the datoms this entry's ops produce: on success the
           resolved, canonical tx replaces the stored op so subsequent
           rebuilds/upload/confirm replay the same concrete tx data. *)
        let reports = ref [] in
        let explicit_result = ref false in
        let lid =
          Datascript.listen conn "pending-resolve-collect"
            (fun r -> reports := r :: !reports)
        in
        (try
           List.iter
             (fun op ->
                match
                  replay_canonical_outliner_op conn op rebase_db_before
                with
                | Some _ -> explicit_result := true
                | None -> ())
             ops
         with e ->
           Datascript.unlisten conn lid;
           raise e);
        Datascript.unlisten conn lid;
        let datoms =
          List.concat_map
            (fun (r : tx_report) -> r.tx_data)
            (List.rev !reports)
        in
        if datoms = [] && ops <> [] && not !explicit_result then
          (* every canonical op re-executed to nothing — validation
             rejected them on the new base (e.g. a move whose resolved
             target is now inside the moved subtree). Without a failure
             the stale verbatim .tx would still upload and confirm,
             applying exactly what the rebase rejected. An op returning
             a result (create-page converging to the existing page)
             produces no datoms by design — cljs marks such replays
             :no-op and keeps the verbatim pending, so exempt them *)
          invalid_rebase_op (Wire.keyword "replay-no-effect")
            (Wire.Map
               [ Wire.keyword "tx-id", Wire.String local_tx.tx_id
               ; Wire.keyword "reason", Wire.keyword "ops-produced-no-datoms" ]);
        if datoms <> [] then
          let resolved =
            normalize_tx_data (Conn.db conn) db_before_apply datoms
          in
          Sync_client_op.update_local_tx_resolved repo local_tx.tx_id
            (Wire.Array resolved)
    | [] -> (
        match normalize_tx_data_for_rebase local_tx.tx with
        | _ :: _ as tx_data ->
            let attr_live (a : Wire.t) : bool =
              attr_resolves db a
              || (match a with
                  | Wire.Keyword a' | Wire.String a' ->
                      SSet.mem a' pending_attrs
                  | _ -> false)
              || (match rebase_db_before with
                  | Some b -> not (attr_resolves b a)
                  | None -> true)
            in
            let tx_data =
              sanitize_pending_tx_refs ~attr_live db tx_data
            in
            let tx_data =
              let replay_created = tx_self_created tx_data in
              List.map
                (resolve_temp_id ~replay_created db)
                tx_data
              |> drop_cycle_parent_edges db
            in
            ignore
              (Db_transact.transact conn tx_data
                 [ ( "outliner-op"
                   , match local_tx.outliner_op with
                     | Some o -> Keyword o
                     | None -> Nil )
                 ; (* recorded tx-data already carries the original tx's
                      pipeline effects — skip re-running them *)
                   "db-sync/replayed-tx-data?", Bool true ])
        | [] -> ())

(* Replays the pending queue in order. A replay failure marks the entry
   failed — the server stays authoritative and the op leaves the
   projection. Returns how many entries failed: ops committed before a
   failing op within the same entry stay applied on conn, so callers
   that can rebind should do a second pass to drop the residue. *)
let replay_pending_txs repo (conn : conn)
    (rebase_db_before : db option) : int =
  let pending = pending_txs repo () in
  if pending = [] then 0
  else begin
    let failed = ref 0 in
    (* nested replay (a failed entry's mark_failed rebuilds and replays
       again) must not clear the flag for the outer pass — a leaked
       false would let replay txs re-enter the client-ops queue *)
    let prev_replay = !Sync_state.pending_replay in
    Sync_state.pending_replay := true;
    let pending_attrs = pending_property_attrs pending in
    (try
       List.iter
         (fun (local_tx : Sync_client_op.local_tx_entry) ->
            try
              replay_pending_entry repo conn rebase_db_before
                ~pending_attrs local_tx
            with e -> (
              match e with
              | Dispatcher.Exn_info ("invalid rebase op", _)
                  when references_pending_uuid (Conn.db conn)
                         ~pending:(pending_txs repo ()) local_tx ->
                  Worker_log.info "db-sync/replay-deferred"
                    [ "repo", repo
                    ; "tx-id", local_tx.tx_id
                    ; "outliner-op"
                    , Option.value local_tx.outliner_op ~default:"" ]
              | _ ->
                  incr failed;
                  (* dump the normalized verbatim tx items (bounded) — a
                     strict-resolve crash needs the actual item shape to
                     find which position escaped sanitize *)
                  let tx_dump =
                    match normalize_tx_data_for_rebase local_tx.tx with
                    | [] -> ""
                    | items ->
                        let s =
                          Transit_codec.to_string (Wire.Array items)
                        in
                        if String.length s > 4096
                        then String.sub s 0 4096 ^ "…"
                        else s
                  in
                  Worker_log.warn "db-sync/pending-replay-failed"
                    [ "repo", repo
                    ; "tx-id", local_tx.tx_id
                    ; "outliner-op"
                    , Option.value local_tx.outliner_op ~default:""
                    ; "ops"
                    , Transit_codec.to_string
                        (Wire.Array local_tx.forward_outliner_ops)
                    ; "tx", tx_dump
                    ; "error", Printexc.to_string e ];
                  ignore (mark_failed_txs repo [ local_tx.tx_id ])))
         pending
     with e ->
       Sync_state.pending_replay := prev_replay;
       raise e);
    Sync_state.pending_replay := prev_replay;
    !failed
  end

(* Display conns read shared index pages through each PSet's own
   set_storage (a read path independent of db.storage_ref), so the db's
   storage_ref must be None: any conn-level store path — transact/apply_report
   tail compaction, batch_transact's reset_schema epilogue, conn_from_db —
   would run context.store, which writes pending-mixed index nodes into the
   real durable pages via the set's own storage (a no-op storage wrapper
   cannot intercept that write) and re-adopts the indexes as deferred roots
   over phantom addresses. *)
let display_db_from_server (server_db : db) : db =
  { server_db with storage_ref = None }

(* The display conn's max_tx must stay strictly ahead of every rev already
   emitted on a server-state rebind: the frontend drops any render delta
   whose rev is not strictly greater than the last applied one, and
   db_before.max_tx is exactly that last applied rev — its delta already
   shipped. A rebound counter equal to it makes the synthesized jump delta
   collide and get silently ignored — the UI then shows stale state (e.g.
   an indent the db no longer has, or children that never mount). *)
let display_db_rebind_floor (rebound : db) ~(floor : int) : db =
  if rebound.max_tx <= floor then { rebound with max_tx = floor + 1 }
  else rebound

let display_conn_from_server (server_db : db) : conn =
  Datascript.conn_from_db (display_db_from_server server_db)

(* Rebinds the display projection onto the server conn's confirmed state
   and replays pending ops forward. jump_tx_data carries the datoms the
   server conn just committed (remote apply / confirm batch) so the UI
   gets one delta for the jump; replayed ops emit their own deltas. *)
let rebuild_display repo ~(jump_tx_data : datom list) : unit =
  match
    (Sync_state.server_conn repo, Worker_state.datascript_conn repo)
  with
  | Some server_conn, Some display_conn ->
      let db_before = Conn.db display_conn in
      Conn.update_db display_conn (fun _ ->
          display_db_rebind_floor
            (display_db_from_server (Conn.db server_conn))
            ~floor:db_before.max_tx);
      let replay_reports = ref [] in
      let lid =
        Datascript.listen display_conn "pending-replay-collect"
          (fun r -> replay_reports := r :: !replay_reports)
      in
      (try
         (* ops committed before a failing op stay applied — rebind to
            the server base once more and replay the surviving queue
            (failed entries are out of pending now) so no residue leaks
            into the projection. Loop: an entry deferred on a dep that is
            marked failed later in the same pass stays pending — each
            pass fails >=1 entry, so iterate until a pass is clean.
            Progress bound: a pass that fails entries without shrinking
            the pending set (e.g. a tx-id mark_failed_txs filters out)
            can never terminate — stop instead of spinning at 100%. *)
         let rec drain_failures () =
           let pending_before = List.length (pending_txs repo ()) in
           let failed =
             replay_pending_txs repo display_conn (Some db_before)
           in
           if failed > 0
              && List.length (pending_txs repo ()) < pending_before
           then begin
             Conn.update_db display_conn (fun _ ->
                 display_db_rebind_floor
                   (display_db_from_server (Conn.db server_conn))
                   ~floor:db_before.max_tx);
             replay_reports := [];
             drain_failures ()
           end
         in
         drain_failures ()
       with e ->
         Datascript.unlisten display_conn lid;
         raise e);
      Datascript.unlisten display_conn lid;
      let replayed =
        List.concat_map
          (fun (r : tx_report) -> r.tx_data)
          (List.rev !replay_reports)
      in
      let tx_data = jump_tx_data @ replayed in
      if tx_data <> [] then begin
        let report =
          { db_before
          ; db_after = Conn.db display_conn
          ; tx_data
          ; tempids = []
          ; tx_meta = [ "rtc-tx?", Bool true ] }
        in
        Db_listener.commit_synthesized_report repo display_conn report;
        fix_tx repo display_conn ~jump_tx_data (sync_fix_tx_meta ())
      end
  | _ -> ()

let () =
  Sync_apply.rebuild_display_fn :=
    (fun repo -> rebuild_display repo ~jump_tx_data:[])

(* Marks queued txs confirmed: the exact normalized tx data that was
   uploaded is applied to the server conn in queue order, so the
   projection base converges with what the server accepted. *)
let confirm_pending_txs ?(uploaded : (string * Wire.t) list = []) repo
    (tx_ids : string list) : unit =
  match Sync_state.server_conn repo with
  | None -> ()
  | Some server_conn -> (
      let pending_entries =
        Sync_client_op.get_pending_local_txs_in repo tx_ids
      in
      let pending_ids =
        List.map (fun (e : Sync_client_op.local_tx_entry) -> e.tx_id)
          pending_entries
      in
      (* an id the server reported applied can have left the pending
         queue already (a failed replay sweep or a restart boundary)
         — the server's journal still carries it, so confirm it from
         the verbatim upload data or the server conn permanently
         misses a tx the remote side committed *)
      let orphan_ids =
        List.filter
          (fun id -> not (List.mem id pending_ids))
          tx_ids
      in
      let entries =
        pending_entries
        @ List.filter_map
            (fun id ->
               match List.assoc_opt id uploaded with
               | Some items ->
                   Some
                     { Sync_client_op.tx_id = id
                     ; outliner_op = None
                     ; forward_outliner_ops = []
                     ; inverse_outliner_ops = []
                     ; inferred_outliner_ops = false
                     ; undo_redo = None
                     ; tx = items
                     ; reversed_tx = Wire.List [] }
               | None -> None)
            orphan_ids
      in

      (* apply each confirmed entry in queue order, sanitized the same
         way the upload was — refs to uuids the remote side deleted are
         dropped in value position so the server conn mirrors what the
         server actually accepted. An entity-position miss means the
         upload never happened (marked failed earlier), so keep the tx
         verbatim and let transact surface it.

         `uploaded` carries the sanitized tx-data the wire actually sent
         (upload_request.tx_datas): prep already ran
         sanitize_pending_tx_refs + drop_cycle_parent_edges on those
         items against the server view, so applying them verbatim —
         with only the shared ingest sanitize — lands the journaled
         form. Re-sanitizing the stored raw tx against the local conn
         instead is wrong: the two reference dbs differ (e.g. a uuid the
         server kept but the local conn lacks), and the block/parent
         live-page fallback then rewrites the confirmed item to a value
         the journal never carried — a divergence verbatim LWW cannot
         repair. *)
      List.iter
        (fun (local_tx : Sync_client_op.local_tx_entry) ->
           try
             let db = Conn.db server_conn in
             (* cljs sanitize-tx-entry: the server applies the same
                sanitize with flags derived from the entry's
                outliner-op — mirror them here so the server conn
                ends with what the server accepted *)
             let delete_op =
               match local_tx.outliner_op with
               | Some ("delete-blocks" | "delete-page") -> true
               | _ -> false
             in
             let fix_op = local_tx.outliner_op = Some "fix" in
             let ingest_sanitize items =
               List.map Ds_wire.value_of_transit items
               |> Db_sync_tx_sanitize.sanitize_tx db
                    ~drop_missing_retract_ops:(delete_op || fix_op)
                    ~drop_ops_targeting_retracted_entities:delete_op
                    ~retract_touched_descendants:delete_op
               |> List.map Ds_wire.transit_of_value
             in
             let remote_deleted = Sync_state.remote_deleted repo in
             let tx_data =
               match List.assoc_opt local_tx.tx_id uploaded with
               | Some items ->
                   (* the uploaded items are what the server accepted —
                      remote_deleted cannot gate them: a uuid recorded
                      deleted was pulled BEFORE this upload journaled, so
                      on the server the client's re-add always lands after
                      the delete and the entity is live. Dropping those
                      adds loses the revive the server kept *)
                   tx_items_of items
                   |> rewrite_missing_uuid_refs db
                        ~remote_deleted:SSet.empty
                   |> List.map (resolve_temp_id db)
                   |> ingest_sanitize
               | None -> (
                   match normalize_tx_data_for_rebase local_tx.tx with
                   | [] -> []
                   | tx_data ->
                       (* sanitize with the upload domain: uuids the
                          server conn can see, and attrs live on either
                          conn — the server conn must only ever gain
                          what the upload could actually have carried *)
                       let uuid_exists u =
                         Outliner_op.entity_of_uuid
                           (Conn.db server_conn) u
                         <> None
                       in
                       let attr_live (a : Wire.t) : bool =
                         attr_resolves db a
                         || (match Worker_state.datascript_conn repo with
                             | Some display ->
                                 attr_resolves (Conn.db display) a
                             | None -> true)
                       in
                       sanitize_pending_tx_refs ~uuid_exists ~attr_live db
                         tx_data
                       |> rewrite_missing_uuid_refs db
                            ~remote_deleted
                       |> List.map (resolve_temp_id db)
                       |> ingest_sanitize
                       |> drop_cycle_parent_edges db)
             in
             if tx_data <> [] then begin
               let report =
                 Db_transact.transact server_conn tx_data
                   [ "rtc-tx?", Bool true ]
               in
               Sync_apply.record_remote_asserted db repo tx_data;
               (* our own confirmed delete never flows through the pull
                  path, so remote_deleted would never record it — then a
                  remote tx generated before the delete but arriving
                  after it re-adds the entity and nothing filters it.
                  Union the confirmed tx's own entity deletes into the
                  tracked set so stale remote adds are dropped the same
                  way they are after a remote delete. Scan the emitted
                  report datoms, not the input items: resolve rewrites
                  [:db/retractEntity [:block/uuid u]] into a bare eid
                  and the server-side cascade (retract-touched-
                  descendants) retracts children the upload never named —
                  only the diff sees every deleted entity *)
               let now_deleted, now_created =
                 match report with
                 | Some r ->
                     List.fold_left
                       (fun (dead, alive) (d : datom) ->
                          if d.a = "block/uuid" then
                            match d.v with
                            | String u | Uuid u ->
                                if d.added
                                then dead, SSet.add u alive
                                else SSet.add u dead, alive
                            | _ -> dead, alive
                          else dead, alive)
                       (SSet.empty, SSet.empty) r.tx_data
                 | None -> SSet.empty, SSet.empty
               in
               if
                 not
                   (SSet.is_empty now_deleted
                    && SSet.is_empty now_created)
               then
                 Sync_state.set_remote_deleted repo
                   (SSet.diff
                      (SSet.union (Sync_state.remote_deleted repo)
                         now_deleted)
                      now_created)
             end
           with e ->
             (* an exception anywhere in one entry's confirm pipeline
                must not abort the loop — client.inflight stays set and
                uploads stall, or a rejected tx re-uploads forever *)
             ignore (mark_failed_txs repo [ local_tx.tx_id ]);
             Worker_log.warn "db-sync/confirm-tx-failed"
               [ "repo", repo
               ; "tx-id", local_tx.tx_id
               ; "error", Printexc.to_string e ])
        entries)

(* Pending entries may have their forward datoms persisted on the conn
   being split: pre-upgrade graphs wrote them under the old model, and a
   mid-session split still applies local ops directly to the only conn
   that exists. Un-applying each entry's stored reversed tx newest-first
   restores the server conn to confirmed-only before the display
   projection is built — replay then re-derives every pending effect
   forward. Entries whose forward never touched the conn are no-ops:
   reversed retracts miss absent datoms and re-adds of still-present
   originals dedup away. Per-row errors (e.g. a lookup-ref left dangling
   after a later row's un-apply) warn and move on to the next entry. *)
let unapply_persisted_pending_txs repo (conn : conn) : unit =
  if
    Sync_state.has_client_ops_conn repo
    && not (Sync_client_op.pending_unapply_done repo)
  then begin
    (* logseq.kv/* ident entities are graph bookkeeping (graph-uuid,
       graph-remote?, gc markers), not pending user data — pending rows
       can contain them (e.g. upload's identity write), and un-applying
       those would strip the remote flag off the server conn. The eid
       set is computed once (bounded ident walk) — keyword and
       lookup-ref subjects carry the ident string inline and never
       need a resolve *)
    let kv_eids =
      let acc = ref Int_set.empty in
      Datascript.datoms (Conn.db conn) Aevt ~a:"db/ident" ()
      |> Seq.iter (fun (d : datom) ->
             match d.v with
             | Keyword s | String s
               when String.length s >= 10
                    && String.sub s 0 10 = "logseq.kv/" ->
                 acc := Int_set.add d.e !acc
             | _ -> ());
      !acc
    in
    let touches_kv_item (item : Wire.t) : bool =
      let kv_ident (s : string) : bool =
        String.length s >= 10 && String.sub s 0 10 = "logseq.kv/"
      in
      let target =
        match item with
        | Wire.Array (_ :: e :: _) | Wire.List (_ :: e :: _) -> e
        | _ -> Wire.Nil
      in
      match target with
      | Wire.Keyword s -> kv_ident s
      | Wire.String s ->
          (* db_absent eid_tempid encodes idents as ":ident" — strip the
             prefix so a pending-created logseq.kv/* entity is still
             recognized as bookkeeping *)
          kv_ident
            (if String.length s > 0 && s.[0] = ':'
             then String.sub s 1 (String.length s - 1)
             else s)
      | Wire.Array [ a ; Wire.Keyword s ] | Wire.List [ a ; Wire.Keyword s ]
      | Wire.Array [ a ; Wire.String s ] | Wire.List [ a ; Wire.String s ]
        when a = Wire.keyword "db/ident" ->
          kv_ident s
      | Wire.Int n -> Int_set.mem n kv_eids
      | Wire.Int64 n -> (
          match Int64.to_int n with
          | n' when Int64.of_int n' = n -> Int_set.mem n' kv_eids
          | _ -> false)
      | _ -> false
    in
    (* attr entities whose ident is built-in (anything outside the
       user.* namespaces) are graph bookkeeping like logseq.kv/*
       entities — every peer derives them from its own seed with the
       same deterministic content, so un-applying their retractions only
       churns the schema: the fork drops the schema attr when an
       entity's db/ident retracts and re-asserts it bare on re-create,
       losing declared-only flags like :db/index (every subsequent
       :avet access on block/parent then throws — the checksum listener
       crashes on each commit and sync counters never converge).
       Retraction items that target a bookkeeping attr entity are
       skipped; adds still apply so a pending delete still resurrects
       the entity. *)
    let builtin_attr_eids =
      let acc = ref Int_set.empty in
      Datascript.datoms (Conn.db conn) Aevt ~a:"db/ident" ()
      |> Seq.iter (fun (d : datom) ->
             match d.v with
             | Keyword s | String s
               when not
                      (String.length s >= 5
                       && String.sub s 0 5 = "user.") ->
                 acc := Int_set.add d.e !acc
             | _ -> ());
      !acc
    in
    let touches_builtin_attr (db : db) (item : Wire.t) : bool =
      let target =
        match item with
        | Wire.Array (op :: e :: _) | Wire.List (op :: e :: _)
          when op = Wire.keyword "db/retract"
               || op = Wire.keyword "db/retractEntity"
               || op = Wire.keyword "db.fn/retractEntity" -> e
        | _ -> Wire.Nil
      in
      match Sync_apply.entity_of_wire_ref db target with
      | Some ent -> Int_set.mem ent.id builtin_attr_eids
      | None -> false
    in
    (* (attr, value) of a lookup-ref-shaped wire item, for stubbing *)
    let lookup_pair_of (v : Wire.t) : (string * Wire.t) option =
      match v with
      | Wire.Uuid _ -> Some ("block/uuid", v)
      | Wire.Array [ a ; v' ] | Wire.List [ a ; v' ] -> (
          match a with
          | Wire.Keyword s | Wire.Symbol s -> Some (s, v')
          | _ -> None)
      | _ -> None
    in
    (* attr classification (ref?/card-many?) is schema-level — stable
       for the whole pass; cache per attr to avoid a counted_entity
       seek per item *)
    let attr_class =
      let cache = Hashtbl.create 32 in
      fun (db : db) (a : string) ->
        match Hashtbl.find_opt cache a with
        | Some r -> r
        | None ->
            let r = (Ldb.ref_attr db a, Ldb.many_attr db a) in
            Hashtbl.replace cache a r;
            r
    in
    let is_retract_entity_item (item : Wire.t) : bool =
      match item with
      | Wire.Array (op :: _) | Wire.List (op :: _) ->
          op = Wire.keyword "db/retractEntity" || op = Wire.keyword "db.fn/retractEntity"
      | _ -> false
    in
    (* a pending delete's reversed re-adds reference the deleted entity
       through [:block/uuid u] — the lookup-ref is unresolvable until
       the entity exists, which fails the whole item. Materialize a
       stub per unresolvable ref first (uuid-only entities are
       deliberately not "materialized" for replay, so stubs are inert) *)
    let stubs_of (db : db) (items : Wire.t list) : (string * Wire.t) list =
      let seen = Hashtbl.create 16 in
      items
      |> List.concat_map (fun item ->
             match item with
             (* only db/add items can use a stub: a retract resolves the
                ref to the fresh stub eid and silently misses the real
                dangling eid it meant to remove *)
             | Wire.Array (op :: e :: rest) | Wire.List (op :: e :: rest)
               when op = Wire.keyword "db/add" ->
                 (match lookup_pair_of e with
                  | Some p when entity_of_wire_ref db e = None -> [ p ]
                  | _ -> [])
                 @ (match rest with
                    | a :: v :: _ -> (
                        match a with
                        | Wire.Keyword s | Wire.Symbol s
                          when fst (attr_class db s) -> (
                            match lookup_pair_of v with
                            | Some p when entity_of_wire_ref db v = None
                              -> [ p ]
                            | _ -> [])
                        | _ -> [])
                    | _ -> [])
             | _ -> [])
      |> List.filter (fun (a, v) ->
             match Hashtbl.find_opt seen (a, v) with
             | Some () -> false
             | None -> Hashtbl.replace seen (a, v) (); true)
    in
    (* a reversed db/add restores the value a pending write evicted —
       but it must never stomp a LATER confirmed value: apply the
       restore only while the phantom is intact, i.e. the conn still
       shows the state this row's forward tx left. For a retractEntity
       forward that means the entity is still absent — a confirmed
       re-create wins wholesale. For an attr-level retract it means the
       attr is still empty. For an add it means the forward value is
       still present. card-many adds can't stomp a value (they merge),
       so they only need the retractEntity check *)
    let stale_restores (db : db) ~(forward_items : Wire.t list)
        (items : Wire.t list) : Wire.t list =
      (* index the row's forward items once — per-item rescans are
         O(reversed × forward) on bulk pending ops *)
      let attr_key (e_w : Wire.t) (a : string) : string =
        Transit_codec.to_string (Wire.Array [ e_w; Wire.Keyword a ])
      in
      let fw_retracts_ent_tbl = Hashtbl.create 8 in
      let fw_retracts_attr_tbl = Hashtbl.create 16 in
      let fw_vals_tbl = Hashtbl.create 16 in
      let push_val e_w a_w v' =
        match a_w with
        | Wire.Keyword s | Wire.Symbol s ->
            let k = attr_key e_w s in
            let rest =
              match Hashtbl.find_opt fw_vals_tbl k with
              | Some l -> l
              | None -> []
            in
            Hashtbl.replace fw_vals_tbl k (v' :: rest)
        | _ -> ()
      in
      List.iter
        (fun item ->
          match item with
          | Wire.Array (op :: e' :: _) | Wire.List (op :: e' :: _)
            when op = Wire.keyword "db/retractEntity"
                 || op = Wire.keyword "db.fn/retractEntity" ->
              Hashtbl.replace fw_retracts_ent_tbl
                (Transit_codec.to_string e') ()
          | Wire.Array (op :: e' :: a' :: _) | Wire.List (op :: e' :: a' :: _)
            when op = Wire.keyword "db/retract" -> (
              match a' with
              | Wire.Keyword s | Wire.Symbol s ->
                  Hashtbl.replace fw_retracts_attr_tbl (attr_key e' s) ()
              | _ -> ())
          (* values the forward tx wrote to (e,a): db/add carries the
             new value at position 3, db/cas at position 4 (after the
             old value). A db/retract writes nothing — it must not
             count as a forward value or the intact check below would
             demand the conn still hold a value the forward removed,
             dropping the legit restore *)
          | Wire.Array (op :: e' :: a' :: v' :: _)
          | Wire.List (op :: e' :: a' :: v' :: _)
            when op = Wire.keyword "db/add" -> push_val e' a' v'
          | Wire.Array (op :: e' :: a' :: _ :: v' :: _)
          | Wire.List (op :: e' :: a' :: _ :: v' :: _)
            when op = Wire.keyword "db/cas" -> push_val e' a' v'
          | _ -> ())
        forward_items;
      let forward_retracts_entity (e_w : Wire.t) : bool =
        Hashtbl.mem fw_retracts_ent_tbl (Transit_codec.to_string e_w)
      in
      let forward_retracts_attr (e_w : Wire.t) (a : string) : bool =
        Hashtbl.mem fw_retracts_attr_tbl (attr_key e_w a)
      in
      let forward_vals (e_w : Wire.t) (a : string) : Wire.t list =
        match Hashtbl.find_opt fw_vals_tbl (attr_key e_w a) with
        | Some l -> l
        | None -> []
      in
      let phantom_intact (e_w : Wire.t) (a : string) : bool =
        match forward_vals e_w a with
        | [] ->
            (* the forward removed (e,a) rather than writing it: the
               phantom only survives while nothing confirmed wrote it
               back — a still-empty attr is intact; any present value
               means confirmed state drifted and wins *)
            forward_retracts_attr e_w a
            && (match entity_of_wire_ref db e_w with
                | None -> false
                | Some ent -> Datascript.entity_attr ent a = None)
        | fvs -> (
            match entity_of_wire_ref db e_w with
            | None -> false
            | Some ent -> (
                let match_val (wv : Wire.t) (dv : value) : bool =
                  match dv with
                  | Ref eid -> (
                      match entity_of_wire_ref db wv with
                      | Some re -> re.id = eid
                      | None -> false)
                  | _ -> Ds_wire.value_of_transit wv = dv
                in
                let match_ent (wv : Wire.t) (te : tx_entity) : bool =
                  match entity_of_wire_ref db wv, te.db_id with
                  | Some re, Some (Entity_id eid) -> re.id = eid
                  | _ -> false
                in
                match Datascript.entity_attr ent a with
                | Some (One_value dv) ->
                    List.exists (fun wv -> match_val wv dv) fvs
                | Some (One_entity te) ->
                    List.exists (fun wv -> match_ent wv te) fvs
                | Some (Many_values dvs) ->
                    List.exists
                      (fun wv -> List.exists (match_val wv) dvs)
                      fvs
                | Some (Many_entities tes) ->
                    List.exists
                      (fun wv -> List.exists (match_ent wv) tes)
                      fvs
                | None -> false))
      in
      (* reversed items carry bare local eids — resolving the subject
         back to a uuid fails once the entity is gone, so a remote-deleted
         entity must be recognized by VALUE: a reversed add whose
         (e, block/uuid, u) re-asserts a uuid the remote side deleted
         poisons every item for that subject *)
      let remote_deleted = Sync_state.remote_deleted repo in
      let deleted_readded_subject (i : Wire.t) : string option =
        match i with
        | Wire.Array (op :: e_w :: a_w :: v_w :: _)
        | Wire.List (op :: e_w :: a_w :: v_w :: _)
          when op = Wire.keyword "db/add" -> (
            let uuid_of_value = Sync_apply.uuid_str_of_wire in
            match a_w with
            | Wire.Keyword "block/uuid" | Wire.Symbol "block/uuid" -> (
                match uuid_of_value v_w with
                | Some u when SSet.mem u remote_deleted ->
                    Some (Transit_codec.to_string e_w)
                | _ -> None)
            | _ -> None)
        | _ -> None
      in
      let poisoned =
        List.fold_left
          (fun acc i ->
             match deleted_readded_subject i with
             | Some k -> SSet.add k acc
             | None -> acc)
          SSet.empty items
      in
      List.filter
        (fun item ->
          match item with
          | Wire.Array (op :: e_w :: a_w :: _ :: _)
          | Wire.List (op :: e_w :: a_w :: _ :: _)
            when op = Wire.keyword "db/add" ->
              if
                SSet.mem (Transit_codec.to_string e_w) poisoned
              then false
              else if forward_retracts_entity e_w then
                (* the forward deleted the whole entity: resurrect it
                   only while it is still absent — a confirmed
                   re-create wins wholesale. Absent because the remote
                   side deleted it is NOT a green light: re-adding its
                   datoms resurrects an entity the server dropped, and
                   the pending delete then fails replay as vacuous so
                   the resurrection never unwinds *)
                entity_of_wire_ref db e_w = None
                && (match Sync_apply.tx_item_block_uuid db e_w with
                    | Some u ->
                        not
                          (SSet.mem u (Sync_state.remote_deleted repo))
                    | None -> true)
              else (
                match a_w with
                | Wire.Keyword a | Wire.Symbol a
                  when not (snd (attr_class db a)) ->
                    phantom_intact e_w a
                | _ -> true)
          | _ -> true)
        items
    in
    let any_failed = ref false in
    let stored_items (s : string option) : Wire.t list =
      match s with
      | Some s -> tx_items_of (Transit_codec.of_string s)
      | None -> []
    in
    let unconfirmed = Sync_client_op.get_unconfirmed_tx_data repo in
    let pending_created_uuids, unconfirmed_tx_stamps =
      List.fold_left
        (fun (uuids, stamps) (e : Sync_client_op.unconfirmed_tx_row) ->
          List.fold_left
            (fun (uuids, stamps) item ->
               match item with
               | Wire.Array (_ :: _ :: a :: v :: t)
               | Wire.List (_ :: _ :: a :: v :: t) -> (
                   let stamps' =
                     match t with
                     | [ Wire.Int n ] -> Int_set.add n stamps
                     | [ Wire.Int64 n ] -> Int_set.add (Int64.to_int n) stamps
                     | _ -> stamps
                   in
                   match a with
                   | Wire.Keyword "block/uuid" | Wire.Symbol "block/uuid"
                     -> (
                       match v with
                       | Wire.Uuid s | Wire.String s -> s :: uuids, stamps'
                       | _ -> uuids, stamps')
                   | _ -> uuids, stamps')
               | _ -> uuids, stamps)
            (uuids, stamps) (stored_items e.un_normalized_tx_data))
        ([], Int_set.empty) unconfirmed
    in
    (* a reversed db/retract undoes the value this row's forward tx
       added — but only while unconfirmed state still owns the live
       datom. Two clients can create the same deterministic-uuid entity
       (e.g. a property) while offline; the peer's confirmed tx then
       lands the SAME (e,a,v) on this conn before the local row is
       unapplied. The live datom carries a confirmed stamp: retracting
       it strips state the server owns, collapsing the shared entity
       to a shell. Skip the retract when the matching datom is
       confirmed-owned; a still-unconfirmed datom belongs to pending
       state and retracts normally *)
    let confirmed_owned_retract (db : db) (item : Wire.t) : bool =
      match item with
      | Wire.Array (op :: e_w :: a_w :: v_w :: _)
      | Wire.List (op :: e_w :: a_w :: v_w :: _)
        when op = Wire.keyword "db/retract" -> (
          match a_w with
          | Wire.Keyword a | Wire.Symbol a -> (
              let asserted =
                SSet.mem
                  (Sync_apply.asserted_key_of_item db e_w a v_w)
                  (Sync_state.remote_asserted repo)
              in
              if asserted then true
              else
                match Sync_apply.entity_of_wire_ref db e_w with
                | None -> false
                | Some ent ->
                    (* the other confirmed-ownership signal: a live
                       datom whose stamp predates this row's pending
                       state (snapshot-restored or otherwise
                       unrecorded). Remote re-asserts keep the
                       unconfirmed stamp — those are caught by
                       remote_asserted above *)
                    let value_eq (wv : Wire.t) (dv : value) : bool =
                      match dv with
                      | Ref eid -> (
                          match Sync_apply.entity_of_wire_ref db wv with
                          | Some re -> re.id = eid
                          | None -> false)
                      | _ -> Ds_wire.value_of_transit wv = dv
                    in
                    Seq.exists
                      (fun (d : datom) ->
                         d.a = a && value_eq v_w d.v
                         && not (Int_set.mem d.tx unconfirmed_tx_stamps))
                      (fun () ->
                         Datascript.datoms db Datascript.Eavt ~e:ent.id
                           () ()))
          | _ -> false)
      | _ -> false
    in
    (* mirror image on the restore side: a reversed db/add puts back
       the value this row's forward retract evicted. Confirmed state
       wins when it explicitly dropped the same (e,a,v) — a remote
       retract recorded in remote_retracted — or, for cardinality-one
       attrs, when remote_asserted shows a different live value: the
       restore would resurrect a value the journal superseded *)
    let remote_superseded_add (db : db) (item : Wire.t) : bool =
      match item with
      | Wire.Array (op :: e_w :: a_w :: v_w :: _)
      | Wire.List (op :: e_w :: a_w :: v_w :: _)
        when op = Wire.keyword "db/add" -> (
          match a_w with
          | Wire.Keyword a | Wire.Symbol a -> (
              let key = Sync_apply.asserted_key_of_item db e_w a v_w in
              if SSet.mem key (Sync_state.remote_retracted repo) then
                true
              else if not (snd (attr_class db a)) then begin
                (* card-one: any other asserted value on (e,a) means
                   confirmed state holds a different live value *)
                let prefix =
                  Sync_apply.asserted_e_key_of_wire db e_w ^ "" ^ a
                  ^ ""
                in
                SSet.exists
                  (fun k ->
                     String.length k > String.length prefix
                     && String.sub k 0 (String.length prefix) = prefix
                     && k <> key)
                  (Sync_state.remote_asserted repo)
              end
              else false)
          | _ -> false)
      | _ -> false
    in
    unconfirmed
    |> List.rev
    |> List.iter (fun (e : Sync_client_op.unconfirmed_tx_row) ->
           try
             let db = Conn.db conn in
             match
               stored_items e.un_reversed_tx_data
               |> List.filter (fun i -> not (touches_kv_item i))
               |> List.filter (fun i -> not (touches_builtin_attr db i))
               (* a failed row's reject usually already rolled its
                  reversed tx back on the durable conn — a second
                  retractEntity would delete an entity re-created in
                  between. Every other reversed shape is idempotent
                  under the stale-restore guards, so strip only these *)
               |> List.filter (fun i ->
                      not e.un_failed || not (is_retract_entity_item i))
               |> stale_restores db
                    ~forward_items:(stored_items e.un_normalized_tx_data)
               |> List.filter
                    (fun i -> not (confirmed_owned_retract db i))
               |> List.filter
                    (fun i -> not (remote_superseded_add db i))
             with
             | [] -> ()
             | items ->
                 (* stored reversed datoms carry bare uuid strings in
                    entity position — an unresolvable one registers a
                    tempid and materializes a uuid-less shell entity.
                    Resolve each ref and drop items whose targets are
                    gone, same as the remote-apply pipeline. Restored
                    entities legitimately absent on the conn map to one
                    deterministic tempid via replay_created — treating
                    their [:block/uuid u] e-position as a missing ref
                    would drop the very items that recreate them *)
                 let replay_created = tx_self_created items in
                 let items =
                   items
                   |> List.map (resolve_temp_id ~replay_created db)
                   |> drop_missing_block_ref_ops db
                 in
                 (* stubs and items in ONE tx: lookup-refs resolve
                    against datoms applied earlier in the same tx, and a
                    single tx means an items failure can't orphan
                    stub entities on the durable conn *)
                 let stub_items =
                   stubs_of db items
                   |> List.mapi (fun i (a, v) ->
                          Wire.Array
                            [ Wire.keyword "db/add"
                            ; Wire.String
                                ("unapply-stub-" ^ string_of_int i)
                            ; Wire.Keyword a ; v ])
                 in
                 ignore
                   (Db_transact.transact conn (stub_items @ items)
                      [ "persist-op?", Bool false
                      ; "skip-validate-db?", Bool true ])
           with exn ->
             any_failed := true;
             Worker_log.warn "db-sync/unapply-pending-failed"
               [ "repo", repo; "tx-id", e.un_tx_id
               ; "error", Printexc.to_string exn ]);
    (* pending-created sweep: a uuid introduced only by an unconfirmed
       row must not survive on the durable conn — confirmed state never
       had it. Failed rows skip their reversed retractEntity (the reject
       usually already rolled it back), and when a later unapplied row
       resurrected or stubbed the entity first, nothing else removes
       it — the phantom uuid shell diverges every conn permanently *)
    (* an entity is a phantom only when every datom it carries was
       committed by an unconfirmed row: a verbatim tx that merely
       re-asserts [:block/uuid u] on an already-confirmed entity looks
       identical to a create at the wire level, so the uuid alone can't
       mark ownership. Any confirmed-stamp datom means confirmed state
       reached this entity — retracting it would drop a server-known
       entity every replica shares *)
    let phantom_entity db (ent : entity) : bool =
      let confirmed =
        Seq.exists
          (fun (d : datom) -> not (Int_set.mem d.tx unconfirmed_tx_stamps))
          (fun () -> Datascript.datoms db Datascript.Eavt ~e:ent.id () ())
      in
      not confirmed
    in
    (let db = Conn.db conn in
     let sweep_items =
       pending_created_uuids
       |> List.filter_map (fun u ->
              match Outliner_op.entity_of_uuid db u with
              | Some ent when phantom_entity db ent ->
                  Some
                    (Wire.Array
                       [ Wire.keyword "db/retractEntity"
                       ; Wire.Array [ Wire.keyword "block/uuid"; Wire.Uuid u ] ])
              | _ -> None)
     in
     match sweep_items with
     | [] -> ()
     | items ->
         (try
            ignore
              (Db_transact.transact conn items
                 [ "persist-op?", Bool false
                 ; "skip-validate-db?", Bool true ])
          with exn ->
            any_failed := true;
            Worker_log.warn "db-sync/unapply-pending-sweep-failed"
              [ "repo", repo; "error", Printexc.to_string exn ]));
    (* a skipped row keeps its phantom datoms on the conn — don't mark
       the pass done so the next open retries it (completed rows are
       idempotent: their phantom is already stripped) *)
    if not !any_failed then Sync_client_op.mark_pending_unapply_done repo
  end

(* Remote graphs keep two conns: the storage-backed conn registered at
   open becomes the server conn holding only confirmed state (restored
   snapshot + remote txs + acked local txs); datascript_conn becomes a
   storage-less display projection replaying the pending queue forward.
   The commit listener moves to the display conn — server-conn transacts
   drive checksum and the synthesized jump report explicitly.
   ~unapply_pending:false is for the initial-upload split: there the
   snapshot must carry the pending content (clear_pending_txs confirms
   it into the server conn afterwards), so the forward datoms stay. *)
let split_off_server_if_remote ?(unapply_pending = true) repo : unit =
  match Worker_state.datascript_conn repo with
  | None -> ()
  | Some conn ->
      let db = Conn.db conn in
      (* server_conn absent means this conn was never split — the display
         projection only exists once a server conn is registered *)
      if Sync_state.server_conn repo = None
         && Ldb.get_key_value db "logseq.kv/graph-remote?"
            = Some (Bool true)
      then begin
        (* the pipeline-updates listener maintains new-db-graph-refs on
           the UI-visible conn (CLI path attaches it at init) — move it
           onto the display conn so local ops keep feeding it; the
           server conn must not take its writes *)
        let had_pipeline = Outliner_db_pipeline.has_listener conn in
        Datascript.unlisten conn "listen-db-changes!";
        Datascript.unlisten conn "pipeline-updates";
        (try
           Sync_state.set_server_conn repo conn;
           Db_listener.listen_db_checksum repo conn;
           if unapply_pending then unapply_persisted_pending_txs repo conn;
           let display = display_conn_from_server (Conn.db conn) in
           Worker_state.set_datascript_conn repo display;
           Db_listener.listen_db_changes repo display;
           if had_pipeline then Outliner_db_pipeline.add_listener display;
           (* the pre-split conn db is the best available db_before: at a
              mid-session split (or a pre-upgrade graph whose pending
              datoms were persisted) it still resolves remotely-deleted
              targets so ancestor fallback can run; on a fresh restart
              under the new model it simply lacks them and those ops
              mark failed *)
           (* progress bound as in rebuild_display: a pass that fails
              entries without shrinking the pending set can never
              terminate (e.g. a tx-id mark_failed_txs filters out) *)
           let rec drain_failures (before : db option) =
             let pending_before = List.length (pending_txs repo ()) in
             let failed = replay_pending_txs repo display before in
             if failed > 0
                && List.length (pending_txs repo ()) < pending_before
             then begin
               Conn.update_db display (fun _ ->
                   display_db_rebind_floor
                     (display_db_from_server (Conn.db conn))
                     ~floor:db.max_tx);
               drain_failures None
             end
           in
           drain_failures (Some db)
         with exn ->
           (* a throw mid-split must not leave server_conn registered
              with no display conn — a retry would early-return into
              the half-state with the commit listener detached *)
           Sync_state.drop_server_conn repo;
           Datascript.unlisten conn "listen-db-sync-checksum";
           Worker_state.set_datascript_conn repo conn;
           Db_listener.listen_db_changes repo conn;
           if had_pipeline then Outliner_db_pipeline.add_listener conn;
           raise exn)
      end


let clear_pending_txs repo : int =
  let ids = Sync_client_op.get_pending_local_tx_ids repo in
  (* snapshot upload already carried these to the server — confirm them
     into the server conn before un-pending *)
  confirm_pending_txs repo ids;
  mark_pending_txs_false repo ids


(* ---- conflicts ---- *)

let sync_conflict_attrs = [ "block/title" ]

let tx_item_components (item : Wire.t) :
    (string * Wire.t * string * Wire.t) option =
  match item with
  | Wire.Array l | Wire.List l when List.length l >= 4 -> (
      match (List.nth l 0, List.nth l 2) with
      | Wire.Keyword op, Wire.Keyword a
        when (op = "db/add" || op = "db/retract")
             && List.mem a sync_conflict_attrs ->
          Some (op, List.nth l 1, a, List.nth l 3)
      | _ -> None)
  | _ -> None

let tx_entity_uuid (db : db) (temp_id_uuid : (string, string) Hashtbl.t)
    (e : Wire.t) : string option =
  match e with
  | Wire.Uuid s -> Some s
  | Wire.String s when Sync_state.uuid_string s -> Some s
  | Wire.Array [ a; u ] | Wire.List [ a; u ] when a = Wire.keyword "block/uuid" ->
      uuid_str_of_wire u
  | Wire.Int _ -> (
      match Hashtbl.find_opt temp_id_uuid (Transit_codec.to_string e) with
      | Some u -> Some u
      | None -> tx_item_block_uuid db e)
  | _ -> tx_item_block_uuid db e

let local_conflict_block_uuids (db : db)
    (local_txs : Sync_client_op.local_tx_entry list) : SSet.t =
  List.fold_left
    (fun acc (t : Sync_client_op.local_tx_entry) ->
       tx_items_of t.tx
       |> List.fold_left
            (fun acc2 item ->
               match tx_item_components item with
               | Some (_, e, _, _) -> (
                   match tx_entity_uuid db (Hashtbl.create 0) e with
                   | Some u -> SSet.add u acc2
                   | None -> acc2)
               | None -> acc2)
            acc)
    SSet.empty local_txs

let remote_sync_conflicts (db : db)
    (local_txs : Sync_client_op.local_tx_entry list) (remote_txs : Wire.t list)
    : (string * string * string * int) list =
  let local_uuids = local_conflict_block_uuids db local_txs in
  if SSet.is_empty local_uuids then []
  else
    remote_txs
    |> List.concat_map (fun remote_tx ->
           let t =
             match Wire.get "t" remote_tx with
             | Some (Wire.Int n) -> n
             | Some (Wire.Int64 n) -> Int64.to_int n
             | _ -> 0
           in
           let tx_data =
             match Wire.get "tx-data" remote_tx with
             | Some xs -> tx_items_of xs
             | None -> []
           in
           let temp_id_uuid = tx_temp_id_uuid tx_data in
           List.filter_map
             (fun item ->
                match tx_item_components item with
                | Some (op, e, a, v) when op = "db/add" -> (
                    match v with
                    | Wire.String _ -> (
                        match tx_entity_uuid db temp_id_uuid e with
                        | Some block_uuid
                          when SSet.mem block_uuid local_uuids -> (
                            let current =
                              match
                                Datascript.entity db
                                  (Lookup_ref ("block/uuid", Uuid block_uuid))
                              with
                              | Some ent -> (
                                  match Datascript.entity_attr ent a with
                                  | Some (One_value value) ->
                                      Ds_wire.transit_of_value value
                                  | _ -> Wire.Nil)
                              | None -> Wire.Nil
                            in
                            if current <> v then
                              Some (block_uuid, a,
                                    (match v with Wire.String s -> s | _ -> ""),
                                    t)
                            else None)
                        | _ -> None)
                    | _ -> None)
                | _ -> None)
             tx_data)
    (* cljs distinct — first-occurrence order *)
    |> Sync_state.distinct_by Fun.id

let broadcast_sync_conflicts repo conflicts : unit =
  (* cljs (distinct (map :block-uuid conflicts)) — first-occurrence order *)
  let uuids =
    List.map (fun (u, _, _, _) -> u) conflicts
    |> Sync_state.distinct_by Fun.id
  in
  List.iter
    (fun block_uuid ->
       let cs = Sync_client_op.get_sync_conflicts repo block_uuid in
       Broadcast.to_clients ~kind:"sync-conflicts-updated"
         ~transit_payload:
           (Transit_codec.to_string
              (Wire.Array
                 [ Wire.keyword "sync-conflicts-updated"
                 ; Wire.Map
                     [ Wire.keyword "repo", Wire.String repo
                     ; Wire.keyword "block-uuid", Wire.String block_uuid
                     ; ( Wire.keyword "conflicts"
                   , Wire.Array
                       (List.map
                          (fun (c : Sync_client_op.sync_conflict) ->
                             Wire.Map
                               [ Wire.keyword "id", Wire.Int c.id
                               ; Wire.keyword "block-uuid", Wire.String c.block_uuid
                               ; Wire.keyword "attr", Wire.String c.attr
                               ; Wire.keyword "value", Wire.String c.value
                               ; ( Wire.keyword "remote-t"
                                 , match c.remote_t with
                                   | Some t -> Wire.Int t
                                   | None -> Wire.Nil )
                               ; Wire.keyword "created-at", Ds_wire.wire_int64 (Time.epoch_ms_to_int64 c.created_at) ])
                          cs)) ]] )))
    uuids

(* ---- apply-remote-txs! ---- *)


let report_apply_remote_txs_error (_error : exn) has_local_changes remote_count
    local_count : unit =
  try
    match !Sync_deps.capture_error with
    | Some fn ->
        fn "Sync apply remote txs failed"
          (Wire.Map
             [ Wire.keyword "source", Wire.String "db-sync"
             ; Wire.keyword "operation", Wire.String "apply-remote-txs"
             ; Wire.keyword "has-local-changes", Wire.Bool has_local_changes
             ; Wire.keyword "remote-tx-count", Wire.Int remote_count
             ; Wire.keyword "local-tx-count", Wire.Int local_count ])
          Wire.Nil
    | None -> ()
  with e ->
    Worker_log.error "db-sync/report-apply-remote-txs-error-failed"
      [ "error", Printexc.to_string e ]

let eager_remote_asset_download_owner () : bool =
  Sync_util.cli_node_owner () || Runtime_env.electron_owner ()

let download_missing_remote_assets_for_owner repo
    (client : Sync_state.client) (remote_tx_data : datom list)
    : unit Db_worker_effect.t =
  match client.graph_id with
  | Some graph_id when eager_remote_asset_download_owner () -> (
      match Worker_state.datascript_conn repo with
      | Some conn ->
          let candidates =
            Sync_assets.remote_asset_download_candidates_in_tx
              (Conn.db conn) remote_tx_data
          in
          (match candidates with
           | [] -> Db_worker_effect.pure ()
           | _ ->
               Db_worker_effect.map
                 (fun _ -> ())
                 (Sync_assets.download_remote_assets_if_missing repo graph_id
                    candidates))
      | None -> Db_worker_effect.pure ())
  | _ -> Db_worker_effect.pure ()

let finish_apply_remote_txs repo (client : Sync_state.client)
    (remote_tx_data : Wire.t list) (remote_asset_tx_data : datom list)
    : unit Db_worker_effect.t =
  client.inflight := [];
  Db_worker_effect.catch
    (rehydrate_large_titles repo ~tx_data:(Some remote_tx_data)
       ~graph_id:client.graph_id)
    (fun error ->
       Worker_log.error "db-sync/large-title-rehydrate-failed"
         [ "repo", repo; "error", Printexc.to_string error ];
       Db_worker_effect.pure ())
  >>= fun () ->
  download_missing_remote_assets_for_owner repo client remote_asset_tx_data

(* Remote txs land on the server conn only; the display projection is
   then rebuilt from confirmed state with the pending queue replayed
   forward. No reverse step — nothing local ever enters the base. *)
let apply_remote_txs_once repo (_client : Sync_state.client)
    (remote_txs : Wire.t list)
    : (Wire.t list * tx_report option) list =
  match Worker_state.datascript_conn repo with
  | None ->
      Sync_util.fail_fast "db-sync/missing-db"
        (Wire.Map
           [ Wire.keyword "repo", Wire.String repo
           ; Wire.keyword "op", Wire.keyword "apply-remote-txs" ])
  | Some display_conn -> (
      let conn =
        Option.value (Sync_state.server_conn repo) ~default:display_conn
      in
      let local_txs = pending_txs repo () in
      let db_migrate = remote_txs_db_migrate remote_txs in
      let tx_meta =
        [ "rtc-tx?", Bool true ]
        @ (if local_txs <> []
           then [ "with-local-changes?", Bool true ]
           else [ "without-local-changes?", Bool true ])
        @ (if db_migrate then
             [ "db-migrate?", Bool true
             ; "outliner-op", Keyword "db-migrate"
             ; "skip-validate-db?", Bool true ]
           else [])
      in
      let remote_tx_results = ref [] in
      try
        let conflicts =
          remote_sync_conflicts (Conn.db display_conn) local_txs remote_txs
        in
        if conflicts <> [] then begin
          Sync_client_op.add_sync_conflicts repo conflicts;
          broadcast_sync_conflicts repo conflicts
        end;

        let tx_report =
          batch_transact_with_temp_conn conn tx_meta
            (fun c ->
               remote_tx_results :=
                 transact_remote_txs ~repo c remote_txs ())
            ()
        in
        rebuild_display repo
          ~jump_tx_data:
            (match tx_report with
             | Some r -> r.tx_data
             | None -> []);
        !remote_tx_results
      with e ->
        Worker_log.error "db-sync/apply-remote-txs-inner-error"
          [ "repo", repo; "error", Printexc.to_string e ];
        (match !Sync_deps.clear_history with
         | Some f -> f repo
         | None -> ());
        raise e)


let apply_remote_txs repo (client : Sync_state.client)
    (remote_txs : Wire.t list) : unit Db_worker_effect.t =
  let remote_tx_data =
    List.concat_map
      (fun tx ->
         tx_items_of
           (Option.value (Wire.get "tx-data" tx) ~default:(Wire.Array [])))
      remote_txs
  in
  (* bind (pure ()) defers the synchronous apply body into the task so a
     raise becomes a Rejected task the catch can report — a plain
     argument would be evaluated eagerly and escape before catch is
     installed *)
  Db_worker_effect.catch
    (Db_worker_effect.bind (Db_worker_effect.pure ()) (fun () ->
         Db_worker_effect.pure
           (apply_remote_txs_once repo client remote_txs)))
    (fun error ->
       let local_txs = pending_txs repo () in
       Worker_log.error "db-sync/apply-remote-txs-failed"
         [ "repo", repo
         ; "has-local-changes?", string_of_bool (local_txs <> [])
         ; "remote-tx-count", string_of_int (List.length remote_txs)
         ; "local-tx-count", string_of_int (List.length local_txs)
         ; "error", Printexc.to_string error ];
       report_apply_remote_txs_error error (local_txs <> [])
         (List.length remote_txs) (List.length local_txs);
       Db_worker_effect.error error)
  >>= fun remote_tx_results ->
  let remote_asset_tx_data =
    List.concat_map
      (fun (_, report) ->
         match report with Some r -> r.tx_data | None -> [])
      remote_tx_results
  in
  finish_apply_remote_txs repo client remote_tx_data remote_asset_tx_data

let apply_remote_tx repo client (tx_data : Wire.t list) =
  apply_remote_txs repo client
    [ Wire.Map [ (Wire.keyword "tx-data", Wire.Array tx_data) ] ]

