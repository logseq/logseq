(* logseq.db.common.delete-blocks — per-ldb/transact! deletion expansion
   and cleanup (reactions, views, property history, ref title rewrites). *)

open Datascript

module Int_set = Db_reference.IdSet

let distinct_entities (ents : entity list) : entity list =
  let seen = Hashtbl.create 16 in
  List.filter
    (fun e ->
      if Hashtbl.mem seen e.id then false
      else begin Hashtbl.replace seen e.id (); true end)
    ents

let str_replace (s : string) (pattern : string) (repl : string) : string =
  (* cljs string/replace with a string pattern — literal, all occurrences *)
  let plen = String.length pattern in
  if plen = 0 || String.length s < plen then s
  else begin
    let buf = Buffer.create (String.length s) in
    let rec go i =
      if i > String.length s - plen then
        Buffer.add_substring buf s i (String.length s - i)
      else if String.sub s i plen = pattern then begin
        Buffer.add_string buf repl;
        go (i + plen)
      end else begin
        Buffer.add_char buf s.[i];
        go (i + 1)
      end
    in
    go 0;
    Buffer.contents buf
  end

let regex_escape (s : string) : string =
  let specials = "\\.^$*+?()[]{}|" in
  let buf = Buffer.create (String.length s * 2) in
  String.iter
    (fun c ->
      if String.contains specials c then begin
        Buffer.add_char buf '\\';
        Buffer.add_char buf c
      end else Buffer.add_char buf c)
    s;
  Buffer.contents buf

(* cljs replace-ref-with-deleted-block-title *)
let replace_ref_with_deleted_block_title ~(block : entity)
    (ref_raw_title : string) : string =
  let content =
    if Ldb.asset block then ""
    else Option.value (Ldb.string_value block "block/title") ~default:""
  in
  let uuid_s = Option.value (Ldb.string_value block "block/uuid") ~default:"" in
  let embed_re =
    Regexp.compile
      (Printf.sprintf "\\{\\{embed \\(\\(%s\\)\\)\\s?\\}\\}"
         (regex_escape uuid_s))
  in
  ref_raw_title
  |> Regexp.replace_all embed_re ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> content)
  |> fun s -> str_replace s ("((" ^ uuid_s ^ "))") content
  |> fun s -> str_replace s ("[[" ^ uuid_s ^ "]]") content

let block_entity (e : entity) : bool =
  Option.is_some (Ldb.value e "block/uuid")
  && Option.is_some (Ldb.value e "block/page")
  && not (Ldb.is_page e)

let retracted_entities (db : db) (txs : tx_op list) : entity list =
  List.filter_map
    (fun tx ->
      match tx with
      | RetractEntity r ->
        (match Datascript.entity db r with
         | Some e -> Some e
         | None -> None)
      | _ -> None)
    txs
  |> distinct_entities

let property_history_ref_attrs =
  [ "logseq.property.history/block"
  ; "logseq.property.history/property"
  ; "logseq.property.history/ref-value"
  ]

let property_history_entity (e : entity) : bool =
  Option.is_some (Ldb.value e "logseq.property.history/block")
  || Option.is_some (Ldb.value e "logseq.property.history/property")
  || Option.is_some (Ldb.value e "logseq.property.history/ref-value")
  || Option.is_some (entity_attr e "logseq.property.history/scalar-value")

let property_history_ref_retracted_entities (db : db) (txs : tx_op list)
    : entity list =
  List.filter_map
    (fun tx ->
      match tx with
      | Retract (r, a, _)
        when List.mem a property_history_ref_attrs ->
        (match Datascript.entity db r with
         | Some e when property_history_entity e -> Some e
         | _ -> None)
      | _ -> None)
    txs
  |> distinct_entities

let tx_entity_id (db : db) (v : value) : entity_id option =
  match v with
  | Ref n -> Some n
  | Ref_to r -> Datascript.entid_ref db r
  | _ -> None

(* map-shaped ops kept for the property-history checks below *)
let tx_entity_of_op (op : tx_op) : tx_entity option =
  match op with Entity te -> Some te | _ -> None

let property_history_entity_map (te : tx_entity) : bool =
  let has a = List.exists (fun (k, _) -> k = a) te.attrs in
  has "logseq.property.history/block"
  || has "logseq.property.history/property"
  || has "logseq.property.history/ref-value"
  || has "logseq.property.history/scalar-value"

let tx_entity_block_uuid (te : tx_entity) : string option =
  match List.assoc_opt "block/uuid" te.attrs with
  | Some (One_value (Uuid u)) -> Some u
  | _ -> None

(* history entity map referencing a retracted entity id *)
let tx_map_references_ids (db : db) (retracted_ids : Int_set.t) (te : tx_entity)
    : bool =
  let refs_attr a =
    match List.assoc_opt a te.attrs with
    | Some (One_value v) -> tx_entity_id db v
    | Some (One_entity { db_id = Some r; _ }) -> Datascript.entid_ref db r
    | _ -> None
  in
  List.exists
    (fun a ->
      match refs_attr a with
      | Some id -> Int_set.mem id retracted_ids
      | None -> false)
    property_history_ref_attrs

let property_history_ref_retracted_ids (txs : tx_op list) : Int_set.t =
  List.fold_left
    (fun acc tx ->
      match tx with
      | Retract (Entity_id eid, a, _)
        when List.mem a property_history_ref_attrs -> Int_set.add eid acc
      | _ -> acc)
    Int_set.empty txs

(* attrs a vector Add op asserts on eid: eid -> attr -> value *)
let vector_adds_by_eid (txs : tx_op list) : (entity_id, (attr * value) list) Hashtbl.t =
  let tbl = Hashtbl.create 16 in
  List.iter
    (fun tx ->
      match tx with
      | Add (Entity_id eid, a, v) ->
        Hashtbl.replace tbl eid ((a, v) :: Option.value (Hashtbl.find_opt tbl eid) ~default:[])
      | _ -> ())
    txs;
  tbl

let new_property_history_retract_tx (db : db) (txs : tx_op list)
    (retracted_ids : Int_set.t) : tx_op list =
  let referencing_retracted_entity (te : tx_entity) =
    tx_map_references_ids db retracted_ids te
  in
  let map_retract_tx =
    List.filter_map
      (fun tx ->
        match tx with
        | Entity te
          when Option.is_some (tx_entity_block_uuid te)
               && property_history_entity_map te
               && referencing_retracted_entity te ->
          Some (RetractEntity
                  (Lookup_ref ("block/uuid", Uuid (Option.get (tx_entity_block_uuid te)))))
        | _ -> None)
      txs
  in
  let retracted_history_ref_ids = property_history_ref_retracted_ids txs in
  let vector_retract_tx =
    Hashtbl.fold
      (fun eid attrs acc ->
        let as_te = { db_id = Some (Entity_id eid); attrs = List.map (fun (a, v) -> (a, One_value v)) attrs } in
        if Option.is_some
             (match List.assoc_opt "block/uuid" attrs with
              | Some (Uuid u) -> Some u | _ -> None)
           && property_history_entity_map as_te
           && (Int_set.mem eid retracted_history_ref_ids
               || tx_map_references_ids db retracted_ids as_te)
        then RetractEntity (Entity_id eid) :: acc
        else acc)
      (vector_adds_by_eid txs) []
  in
  let all = map_retract_tx @ vector_retract_tx in
  let seen = ref [] in
  List.filter (fun x -> if List.mem x !seen then false else (seen := x :: !seen; true)) all

(* cljs build-retracted-tx: for each entity that :block/refs a retracted
   block, retract the ref and rewrite :block/title with the deleted block's
   title inlined. *)
let build_retracted_tx ?(extra_retract_ids = Int_set.empty)
    (retracted_blocks : entity list) : tx_op list =
  let retract_ids =
    List.fold_left (fun s e -> Int_set.add e.id s) extra_retract_ids retracted_blocks
  in
  let refs =
    List.concat_map (fun b -> Ldb.ref_ents b "block/_refs") retracted_blocks
    |> distinct_entities
  in
  List.concat_map
    (fun ref_e ->
      let replaced_title =
        if Int_set.mem ref_e.id retract_ids then None
        else
          match Ldb.raw_title ref_e.db ref_e with
          | Some (String raw) ->
            Some
              (List.fold_left
                 (fun title block -> replace_ref_with_deleted_block_title ~block title)
                 raw retracted_blocks)
          | _ -> None
      in
      List.concat_map
        (fun block -> [ Retract (Entity_id ref_e.id, "block/refs", Some (Ref block.id)) ])
        retracted_blocks
      @ (match replaced_title with
         | Some t -> [ Add (Entity_id ref_e.id, "block/title", String t) ]
         | None -> []))
    refs

let block_subtree_entities (root : entity) : entity list =
  let rec loop pending seen result =
    match pending with
    | [] -> List.rev result
    | e :: rest ->
      if Int_set.mem e.id seen then loop rest seen result
      else begin
        let children =
          Ldb.ref_ents e "block/_parent" |> List.filter block_entity
        in
        loop (rest @ children) (Int_set.add e.id seen) (e :: result)
      end
  in
  loop [ root ] Int_set.empty []

let expand_delete_blocks_tx (db : db) (txs : tx_op list) ~(outliner_op : string)
    : tx_op list =
  if outliner_op = "delete-blocks" then
    let subtree_tx =
      retracted_entities db txs
      |> List.filter block_entity
      |> List.concat_map block_subtree_entities
      |> List.map (fun e -> RetractEntity (Entity_id e.id))
    in
    let all = txs @ subtree_tx in
    let seen = ref [] in
    List.filter (fun x -> if List.mem x !seen then false else (seen := x :: !seen; true)) all
  else txs

let direct_cleanup_tx (entities : entity list) : tx_op list =
  let retracted_blocks = List.filter block_entity entities in
  let history_self = List.filter property_history_entity entities in
  let history_self_tx =
    List.map (fun h -> RetractEntity (Entity_id h.id)) history_self
  in
  let reaction_entities =
    List.concat_map (fun e -> Ldb.ref_ents e "logseq.property.reaction/_target") entities
    |> distinct_entities
  in
  let retract_reactions_tx =
    List.map (fun r -> RetractEntity (Entity_id r.id)) reaction_entities
  in
  let view_entities =
    List.concat_map (fun e -> Ldb.ref_ents e "logseq.property/_view-for") entities
    |> distinct_entities
  in
  let history_entities =
    List.concat_map
      (fun e ->
        Ldb.ref_ents e "logseq.property.history/_block"
        @ Ldb.ref_ents e "logseq.property.history/_property"
        @ Ldb.ref_ents e "logseq.property.history/_ref-value")
      entities
    |> distinct_entities
  in
  let retract_history_tx =
    List.map (fun h -> RetractEntity (Entity_id h.id)) history_entities
  in
  let cleanup_retract_ids =
    List.fold_left (fun s e -> Int_set.add e.id s) Int_set.empty
      (history_self @ reaction_entities @ view_entities @ history_entities)
  in
  build_retracted_tx ~extra_retract_ids:cleanup_retract_ids retracted_blocks
  @ List.map (fun v -> RetractEntity (Entity_id v.id)) view_entities
  @ history_self_tx @ retract_history_tx @ retract_reactions_tx

let build_cleanup_tx (db : db) (txs : tx_op list) : tx_op list =
  let initial =
    retracted_entities db txs @ property_history_ref_retracted_entities db txs
  in
  let rec loop pending seen cleanup_tx =
    let entities = List.filter (fun e -> not (Int_set.mem e.id seen)) pending in
    match entities with
    | [] -> cleanup_tx
    | _ ->
      let seen' = List.fold_left (fun s e -> Int_set.add e.id s) seen entities in
      let next_tx = direct_cleanup_tx entities in
      loop (retracted_entities db next_tx) seen' (cleanup_tx @ next_tx)
  in
  let cleanup = loop initial Int_set.empty
      (new_property_history_retract_tx db txs
         (List.fold_left (fun s e -> Int_set.add e.id s) Int_set.empty initial))
  in
  let seen = ref [] in
  List.filter (fun x -> if List.mem x !seen then false else (seen := x :: !seen; true)) cleanup

let update_refs_history (db : db) (txs : tx_op list) : tx_op list =
  build_cleanup_tx db txs
