(* frontend.worker.undo-redo — per-repo undo/redo op stacks.
   The actual db application goes through `apply_history_action`,
   installed by the transact layer (cljs *apply-history-action!). *)

open Datascript

let kw s = Wire.Keyword s

(* op items: [tag payload] pairs from the cljs ops *)
type undo_item =
  | Db_transact of (string * Wire.t) list
  | Record_editor_info of Wire.t
  | Ui_state of Wire.t

type undo_op = undo_item list

let max_stack_length = 250

let undo_ops : (string, undo_op list) Hashtbl.t = Hashtbl.create 8

let redo_ops : (string, undo_op list) Hashtbl.t = Hashtbl.create 8

let pending_editor_info : (string, Wire.t) Hashtbl.t = Hashtbl.create 8

let apply_history_action :
    (string -> string option -> bool -> (Wire.t * Wire.t) list ->
     (string * Wire.t) list) option
    ref =
  ref None

(* client-op history lookup — provided by the sync layer *)
let history_action_ops_provider :
    (string -> string -> (string * Wire.t) list option) ref =
  ref (fun _ _ -> None)

let clear_history repo =
  Hashtbl.replace undo_ops repo [];
  Hashtbl.replace redo_ops repo [];
  Hashtbl.remove pending_editor_info repo

let set_pending_editor_info repo editor_info =
  match editor_info with
  | Some info -> Hashtbl.replace pending_editor_info repo info
  | None -> Hashtbl.remove pending_editor_info repo

let take_pending_editor_info repo =
  let info = Hashtbl.find_opt pending_editor_info repo in
  Hashtbl.remove pending_editor_info repo;
  info

let conj_op col op =
  let result = col @ [ op ] in
  if List.length result >= max_stack_length then
    List.filteri (fun i _ -> i < max_stack_length / 2) result
  else result

let push_undo_op repo op =
  Hashtbl.replace undo_ops repo
    (conj_op (Option.value (Hashtbl.find_opt undo_ops repo) ~default:[]) op)

let push_redo_op repo op =
  Hashtbl.replace redo_ops repo
    (conj_op (Option.value (Hashtbl.find_opt redo_ops repo) ~default:[]) op)

let pop_stack stack =
  match List.rev stack with
  | [] -> (None, stack)
  | last :: rest -> (Some last, List.rev rest)

let pop_undo_op repo =
  let stack = Option.value (Hashtbl.find_opt undo_ops repo) ~default:[] in
  let op, stack' = pop_stack stack in
  Hashtbl.replace undo_ops repo stack';
  op

let pop_redo_op repo =
  let stack = Option.value (Hashtbl.find_opt redo_ops repo) ~default:[] in
  let op, stack' = pop_stack stack in
  Hashtbl.replace redo_ops repo stack';
  op

let empty_stack tbl repo =
  Option.value (Hashtbl.find_opt tbl repo) ~default:[] = []

let data_get k (data : (string * Wire.t) list) = List.assoc_opt k data

let data_assoc k v (data : (string * Wire.t) list) =
  (k, v) :: List.remove_assoc k data

let data_dissoc ks (data : (string * Wire.t) list) =
  List.filter (fun (k, _) -> not (List.mem k ks)) data

(* undo-redo-action-meta *)
let undo_redo_action_meta (data : (string * Wire.t) list) ~undo : (string * Wire.t) list =
  let tx_meta =
    match data_get "tx-meta" data with
    | Some (Wire.Map pairs) -> pairs
    | _ -> []
  in
  let source_tx_id = data_get "db-sync/tx-id" data in
  let meta_pairs =
    List.filter
      (fun (k, _) ->
        match k with Wire.Keyword "db-sync/tx-id" -> false | _ -> true)
      tx_meta
  in
  let meta_pairs =
    [ ( kw "gen-undo-ops?", Wire.Bool false )
    ; ( kw "persist-op?", Wire.Bool true )
    ; ( kw "undo?", Wire.Bool undo )
    ; ( kw "redo?", Wire.Bool (not undo) )
    ]
    @ meta_pairs
  in
  let meta_pairs =
    match source_tx_id with
    | Some v -> (kw "db-sync/source-tx-id", v) :: meta_pairs
    | None -> meta_pairs
  in
  [ ("tx-meta", Wire.Map meta_pairs) ]

let rebind_op_db_sync_tx_id (op : undo_op) (history_tx_id : string) : undo_op =
  List.map
    (function
      | Db_transact data ->
          Db_transact
            (data_assoc "db-sync/tx-id" (Wire.Uuid history_tx_id) data)
      | item -> item)
    op

let sanitize_db_transact (data : (string * Wire.t) list) =
  data_dissoc
    [ "tx"; "tx-data"; "reversed-tx"; "reversed-tx-data"
    ; "db-sync/normalized-tx-data"; "db-sync/reversed-tx-data" ]
    data

let push_opposite_op repo ~undo (op : undo_op) =
  let op' =
    List.map
      (function
        | Db_transact data -> Db_transact (sanitize_db_transact data)
        | item -> item)
      op
  in
  if undo then push_redo_op repo op' else push_undo_op repo op'

let get_wire_bool k (m : (string * Wire.t) list) =
  match List.assoc_opt k m with
  | Some (Wire.Bool b) -> Some b
  | _ -> None

let get_wire_string k (m : (string * Wire.t) list) =
  match List.assoc_opt k m with
  | Some (Wire.String s) -> Some s
  | _ -> None

let empty_stack_result ~undo =
  Wire.Keyword
    (if undo then "frontend.worker.undo-redo/empty-undo-stack"
     else "frontend.worker.undo-redo/empty-redo-stack")

let wire_of_op_item = function
  | Db_transact data ->
      Wire.List
        [ kw "frontend.worker.undo-redo/db-transact"
        ; Wire.Map (List.map (fun (k, v) -> (kw k, v)) data) ]
  | Record_editor_info info ->
      Wire.List
        [ kw "frontend.worker.undo-redo/record-editor-info"; info ]
  | Ui_state s ->
      Wire.List [ kw "frontend.worker.undo-redo/ui-state"; s ]

let wire_of_op (op : undo_op) = Wire.List (List.map wire_of_op_item op)

let editor_cursors_of_op (op : undo_op) : Wire.t list =
  List.filter_map (function Record_editor_info i -> Some i | _ -> None) op

let cursor_block_uuid (info : Wire.t) : string option =
  match info with
  | Wire.Map _ ->
      (match Wire.get "block-uuid" info with
       | Some (Wire.Uuid u) -> Some u
       | Some (Wire.String s) -> Some s
       | _ -> None)
  | _ -> None

(* worker-result helpers: {:applied? bool :reason kw :history-tx-id uuid} *)
let result_applied (r : (string * Wire.t) list) =
  get_wire_bool "applied?" r = Some true

let result_reason (r : (string * Wire.t) list) =
  match List.assoc_opt "reason" r with
  | Some (Wire.Keyword k) -> Some k
  | _ -> None

let result_history_tx_id (r : (string * Wire.t) list) =
  match List.assoc_opt "history-tx-id" r with
  | Some (Wire.Uuid u) -> Some u
  | _ -> None

let skippable_worker_result ~undo r =
  match result_reason r with
  | Some reason ->
      if undo then
        List.mem reason
          [ "invalid-history-action-ops"; "invalid-history-action-tx"
          ; "unsupported-history-action" ]
      else reason = "invalid-history-action-ops"
  | None -> false

let expected_invalid_history_action_reason r =
  match result_reason r with
  | Some reason ->
      List.mem reason
        [ "invalid-history-action-ops"; "invalid-history-action-tx" ]
  | None -> false

let rec undo_redo_aux repo ~undo : Wire.t =
  let op =
    if undo then pop_undo_op repo else pop_redo_op repo
  in
  match op with
  | Some op when op <> [] ->
      (match op with
       | Ui_state s :: _ ->
           push_opposite_op repo ~undo op;
           Wire.Map
             [ (kw "undo?", Wire.Bool undo)
             ; (kw "ui-state-str", s) ]
       | _ -> process_db_op repo ~undo op)
  | _ ->
      if empty_stack (if undo then undo_ops else redo_ops) repo then
        empty_stack_result ~undo
      else Wire.nil

and process_db_op repo ~undo (op : undo_op) : Wire.t =
  match
    List.find_map (function Db_transact d -> Some d | _ -> None) op
  with
  | None -> Wire.nil
  | Some data ->
      let tx_id =
        match data_get "db-sync/tx-id" data with
        | Some (Wire.Uuid u) -> Some u
        | _ -> None
      in
      (* cljs: tx-meta' = (merge (undo-redo-action-meta data)
         (select-keys data [:db-sync/forward-outliner-ops
                            :db-sync/inverse-outliner-ops])) —
         apply-action receives the keyword-keyed meta map. *)
      let base =
        match List.assoc_opt "tx-meta" (undo_redo_action_meta data ~undo) with
        | Some (Wire.Map pairs) -> pairs
        | _ -> []
      in
      let tx_meta' =
        base
        @ List.filter_map
            (fun k ->
              match data_get k data with
              | Some v -> Some (kw k, v)
              | None -> None)
            [ "db-sync/forward-outliner-ops"; "db-sync/inverse-outliner-ops" ]
      in
      apply_history_action_ repo ~undo op tx_meta' tx_id

and apply_history_action_ repo ~undo (op : undo_op) (tx_meta : (Wire.t * Wire.t) list) tx_id : Wire.t =
  match !apply_history_action with
  | Some apply ->
      (try
         let worker_result =
           apply repo tx_id undo tx_meta
         in
         if result_applied worker_result then
           let op' =
             if undo then op
             else
               match result_history_tx_id worker_result with
               | Some htx -> rebind_op_db_sync_tx_id op htx
               | None -> op
           in
           push_opposite_op repo ~undo op';
           let cursors = editor_cursors_of_op op in
           let cursor =
             if undo then List.nth_opt cursors 0
             else
               match List.rev cursors with
               | last :: _ -> Some last
               | [] -> List.nth_opt cursors 0
           in
           let block_content =
             match Option.bind cursor cursor_block_uuid with
             | Some u ->
                 (match Worker_state.datascript_conn repo with
                  | Some conn ->
                      (match
                         entity (Datascript.db conn)
                           (Lookup_ref ("block/uuid", Uuid u))
                       with
                       | Some b -> Ldb.string_value b "block/title"
                       | None -> None)
                  | None -> None)
             | None -> None
           in
           Wire.Map
             ((kw "undo?", Wire.Bool undo)
              :: (kw "editor-cursors", Wire.List cursors)
              :: (match block_content with
                  | Some c -> [ (kw "block-content", Wire.String c) ]
                  | None -> []))
         else if skippable_worker_result ~undo worker_result then
           undo_redo_aux repo ~undo
         else begin
           if not (expected_invalid_history_action_reason worker_result) then
            ();
           clear_history repo;
           empty_stack_result ~undo
         end
       with e ->
         (* skippable worker error → recur, else clear + rethrow *)
         (match e with
          | Failure msg when msg = "invalid-history-action-ops" ->
              undo_redo_aux repo ~undo
          | _ ->
              clear_history repo;
              raise e))
  | None ->
      clear_history repo;
      empty_stack_result ~undo

let undo repo = undo_redo_aux repo ~undo:true

let redo repo = undo_redo_aux repo ~undo:false

let record_editor_info repo (editor_info : Wire.t) =
  let stack = Option.value (Hashtbl.find_opt undo_ops repo) ~default:[] in
  if stack <> [] then begin
    let stack' =
      List.mapi
        (fun i op ->
          if i = List.length stack - 1 then
            op @ [ Record_editor_info editor_info ]
          else op)
        stack
    in
    Hashtbl.replace undo_ops repo stack'
  end

let record_ui_state repo (ui_state_str : Wire.t) =
  push_undo_op repo [ Ui_state ui_state_str ]

let get_debug_state repo : Wire.t =
  Wire.Map
    [ ( kw "undo-ops",
        Wire.List
          (List.map wire_of_op
             (Option.value (Hashtbl.find_opt undo_ops repo) ~default:[])) )
    ; ( kw "redo-ops",
        Wire.List
          (List.map wire_of_op
             (Option.value (Hashtbl.find_opt redo_ops repo) ~default:[])) )
    ; ( kw "pending-editor-info",
        Option.value
          (Hashtbl.find_opt pending_editor_info repo)
          ~default:Wire.Nil )
    ]

(* gen-undo-ops! — called from the transact path when it's ported. *)
let gen_undo_ops repo ~(tx_data : datom list) ~(tx_meta : (string * Wire.t) list)
    ~(db_before : db) ~(db_after : db) ~(tx_id : string)
    ~(apply_history : string -> string option -> bool ->
      (Wire.t * Wire.t) list -> (string * Wire.t) list) : unit =
  (match !apply_history_action with
   | None -> apply_history_action := Some apply_history
   | Some _ -> ());
  let tx_meta_bool k =
    match List.assoc_opt k tx_meta with
    | Some (Wire.Bool b) -> Some b
    | Some Wire.Nil -> Some false
    | Some _ -> Some true
    | None -> None
  in
  let outliner_op =
    match List.assoc_opt "outliner-op" tx_meta with
    | Some Wire.Nil | None -> None
    | Some v -> Some v
  in
  let local_tx = tx_meta_bool "local-tx?" = Some true in
  let gen_undo = tx_meta_bool "gen-undo-ops?" <> Some false in
  let create_today = tx_meta_bool "create-today-journal?" = Some true in
  let source_outliner_op =
    match List.assoc_opt "source-outliner-op" tx_meta with
    | Some (Wire.Keyword k) -> Some k
    | _ -> None
  in
  let pending_ops =
    !history_action_ops_provider repo tx_id
  in
  let forward_ops =
    Option.bind pending_ops
      (List.assoc_opt "db-sync/forward-outliner-ops")
  in
  let inverse_ops =
    Option.bind pending_ops
      (List.assoc_opt "db-sync/inverse-outliner-ops")
  in
  if
    local_tx && Option.is_some outliner_op && gen_undo
    && not create_today
    && source_outliner_op <> Some "create-view"
  then begin
    let all_ids =
      List.sort_uniq compare (List.map (fun (d : datom) -> d.e) tx_data)
    in
    let retracted_ids =
      List.filter
        (fun id ->
          entity db_before (Entity_id id) <> None
          && entity db_after (Entity_id id) = None)
        all_ids
    in
    let added_ids =
      List.filter
        (fun id ->
          entity db_before (Entity_id id) = None
          && entity db_after (Entity_id id) <> None)
        all_ids
    in
    let editor_info =
      match List.assoc_opt "undo-redo/editor-info" tx_meta with
      | Some Wire.Nil | None -> take_pending_editor_info repo
      | v -> v
    in
    let data =
      [ ("db-sync/tx-id", Wire.Uuid tx_id)
      ; ( "tx-meta",
          Wire.Map
            (List.map
               (fun (k, v) -> (kw k, v))
               (List.filter
                  (fun (k, _) -> k <> "outliner-ops")
                  tx_meta)) )
      ; ( "added-ids",
          Wire.Set (List.map (fun i -> Wire.Int i) added_ids) )
      ; ( "retracted-ids",
          Wire.Set (List.map (fun i -> Wire.Int i) retracted_ids) )
      ]
      (* cljs puts both keys in data with nil values when the row has none;
         an assoc-list nil entry is indistinguishable from absent, so only
         non-nil values are kept *)
      @ (match forward_ops with
         | Some (Wire.Nil) | None -> []
         | Some v -> [ ("db-sync/forward-outliner-ops", v) ])
      @ (match inverse_ops with
         | Some (Wire.Nil) | None -> []
         | Some v -> [ ("db-sync/inverse-outliner-ops", v) ])
    in
    let op : undo_op =
      (match editor_info with
       | Some info -> [ Record_editor_info info ]
       | None -> [])
      @ [ Db_transact data ]
    in
    Hashtbl.replace redo_ops repo [];
    push_undo_op repo op
  end

let referenced_history_tx_ids repo : string list =
  let ops =
    Option.value (Hashtbl.find_opt undo_ops repo) ~default:[]
    @ Option.value (Hashtbl.find_opt redo_ops repo) ~default:[]
  in
  List.concat_map Fun.id ops
  |> List.filter_map (function
       | Db_transact data ->
           (match data_get "db-sync/tx-id" data with
            | Some (Wire.Uuid u) -> Some u
            | _ -> None)
       | _ -> None)
  |> List.sort_uniq compare
