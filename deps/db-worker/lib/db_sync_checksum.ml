(* logseq.db-sync.checksum — rolling FNV+DJB checksum of checksum-relevant
   datom tuples, plus incremental update from a tx-report. *)

open Datascript

let fnv_offset = 0x811C9DC5 (* 2166136261 *)
let djb_offset = 5381
let field_separator = 31
let mask32 n = n land 0xFFFFFFFF

let fnv_step h code = mask32 ((mask32 (h lxor code)) * 16777619)
let djb_step h code = mask32 ((mask32 (h * 33)) + code)
let add_step acc v = mask32 (acc + v)
let sub_step acc v = mask32 (acc - v)

let hash_code (fnv, djb) code = (fnv_step fnv code, djb_step djb code)

let digest_string state (value : string) =
  let rec loop idx st =
    if idx < String.length value then
      loop (idx + 1) (hash_code st (Char.code value.[idx]))
    else st
  in
  loop 0 state

let unsigned_hex n = Printf.sprintf "%08x" n

let parse_hex32 s =
  if String.length s = 8 then
    match int_of_string_opt ("0x" ^ s) with
    | Some n -> Some (mask32 n)
    | None -> None
  else None

let checksum_of_state (fnv, djb) = unsigned_hex fnv ^ unsigned_hex djb

let state_of_checksum checksum =
  if String.length checksum = 16 then
    ( Option.value (parse_hex32 (String.sub checksum 0 8)) ~default:0
    , Option.value (parse_hex32 (String.sub checksum 8 8)) ~default:0 )
  else (0, 0)

let is_hex_char c =
  (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')

let valid_checksum checksum =
  String.length checksum = 16
  && String.for_all is_hex_char checksum

(* relevant-attrs *)
let relevant_attrs e2ee =
  if e2ee then
    [ "block/uuid"; "block/parent"; "block/page"; "block/order" ]
  else
    [ "block/uuid"; "block/parent"; "block/page"; "block/order"
    ; "block/title"; "block/name" ]

let get_block_uuid (db : db) (eid : entity_id) : value option =
  match find_datom db Eavt ~e:eid ~a:"block/uuid" () with
  | Some d -> Some d.v
  | None -> None

let block_uuid_str db eid =
  match get_block_uuid db eid with
  | Some (Uuid u) -> Some u
  | _ -> None

let parse_uuid_string (v : value) : value option =
  match v with
  | String s when Sync_state.uuid_string s -> Some (Uuid s)
  | _ -> None

(* cljs d/entid with try/catch: resolves eid-int, ident kw, lookup-ref *)
let lookup_ref (db : db) (v : value) : entity_id option =
  try
    match v with
    | Int n -> Some n
    | Ref id -> Some id
    | Keyword s -> entid_ref db (Ident s)
    | Vector [ Keyword a; x ] | List [ Keyword a; x ] ->
        entid_ref db (Lookup_ref (a, x))
    | Symbol s -> entid_ref db (Ident s)
    | _ -> None
  with _ -> None

let entids db_before db_after (v : value) : entity_id list =
  let uuid_value =
    match v with
    | Uuid _ -> Some v
    | String _ -> parse_uuid_string v
    | _ -> None
  in
  let out = ref [] in
  let add e =
    match e with
    | Some eid when not (List.mem eid !out) -> out := eid :: !out
    | _ -> ()
  in
  (match v with Int n -> add (Some n) | _ -> ());
  add (lookup_ref db_before v);
  add (lookup_ref db_after v);
  (match uuid_value with
   | Some uv ->
       add (lookup_ref db_before (Vector [ Keyword "block/uuid"; uv ]));
       add (lookup_ref db_after (Vector [ Keyword "block/uuid"; uv ]))
   | None -> ());
  !out

let normalize_checksum_value db attr (v : value) : value =
  match attr, v with
  | "block/parent", Ref eid -> Option.value (get_block_uuid db eid) ~default:Nil
  | "block/page", Ref eid -> Option.value (get_block_uuid db eid) ~default:Nil
  | _ -> v

let entity_values db eid e2ee : (string * value) list =
  let attrs = relevant_attrs e2ee in
  List.of_seq (datoms db Eavt ~e:eid ())
  |> List.filter_map (fun (d : datom) ->
         if List.mem d.a attrs then
           let v =
             match d.a with
             | "block/parent" | "block/page" ->
                 (match d.v with
                  | Ref e -> Option.value (get_block_uuid db e) ~default:Nil
                  | _ -> Nil)
             | _ -> d.v
           in
           Some (d.a, v)
         else None)

let checksum_eligible_entity (db : db) (eid : entity_id) : bool =
  match entity db (Entity_id eid) with
  | Some ent ->
      (match Ldb.value ent "block/uuid" with
       | Some (Uuid _) ->
           not (Ldb.built_in ent)
           && (Ldb.is_page ent
               || Option.is_some (Ldb.value ent "block/page")
               || Option.is_some (Ldb.value ent "block/name"))
       | _ -> false)
  | None -> false

(* tuple = (entity-uuid-str, attr, normalized value) *)
module Tuple = struct
  type t = string * string * value
  let compare (a1, a2, a3) (b1, b2, b3) =
    match compare a1 b1 with
    | 0 -> (match compare a2 b2 with 0 -> compare a3 b3 | c -> c)
    | c -> c
end

module Tuple_set = Set.Make (Tuple)
module Tuple_map = Map.Make (Tuple)
module Int_set = Set.Make (Int)
module Str_set = Set.Make (String)

let entity_checksum_tuples db eid e2ee : Tuple_set.t =
  match block_uuid_str db eid with
  | Some entity_uuid ->
      let attrs = relevant_attrs e2ee in
      List.of_seq (datoms db Eavt ~e:eid ())
      |> List.fold_left
           (fun acc (d : datom) ->
              if List.mem d.a attrs then
                Tuple_set.add
                  (entity_uuid, d.a, normalize_checksum_value db d.a d.v)
                  acc
              else acc)
           Tuple_set.empty
  | None -> Tuple_set.empty

let value_str = function
  | String s | Keyword s | Symbol s | Uuid s -> Some s
  | Int n -> Some (string_of_int n)
  | Float f -> Some (string_of_float f)
  | Bool b -> Some (string_of_bool b)
  | Nil -> None
  | other -> Some (Ds_wire.edn_of_transit (Ds_wire.transit_of_value other))

let tuple_digest (entity_uuid, attr, value) =
  (fnv_offset, djb_offset)
  |> fun s -> digest_string s entity_uuid
  |> fun s -> hash_code s field_separator
  |> fun s -> digest_string s attr
  |> fun s -> hash_code s field_separator
  |> fun s -> digest_string s (Option.value (value_str value) ~default:"")

let add_digest (sum_fnv, sum_djb) (fnv, djb) =
  (add_step sum_fnv fnv, add_step sum_djb djb)

let subtract_digest (sum_fnv, sum_djb) (fnv, djb) =
  (sub_step sum_fnv fnv, sub_step sum_djb djb)

let db_checksum_tuples db e2ee : Tuple.t list =
  List.of_seq (datoms db Avet ~a:"block/uuid" ())
  |> List.concat_map (fun (d : datom) ->
         if checksum_eligible_entity db d.e then
           Tuple_set.elements (entity_checksum_tuples db d.e e2ee)
         else [])

(* tx-data items: datoms from a tx-report, or raw tx-op vectors. *)
type tx_item =
  | Tx_datom of datom
  | Tx_op of value list

let tx_item_attr = function
  | Tx_datom d -> Some d.a
  | Tx_op (_op :: _e :: a :: _) -> (match a with Keyword s -> Some s | _ -> None)
  | Tx_op _ -> None

let tx_item_eids db_before db_after = function
  | Tx_datom d -> [ d.e ]
  | Tx_op (op :: entity :: attr :: rest) ->
      let value = List.nth_opt rest 0 in
      let ids = ref (match entity with v -> entids db_before db_after v) in
      (match (op, attr, value) with
       | Keyword "db/add", Keyword "block/uuid", Some v
       | Keyword "db/retract", Keyword "block/uuid", Some v ->
           ids := Sync_state.distinct_by Fun.id (!ids @ entids db_before db_after v)
       | _ -> ());
      !ids
  | _ -> []

let touched_base_eids db_before db_after (tx_data : tx_item list) : Int_set.t =
  let before_cache = Hashtbl.create 31 in
  let after_cache = Hashtbl.create 31 in
  let cached_eligible cache db eid =
    match Hashtbl.find_opt cache eid with
    | Some b -> b
    | None ->
        let b = checksum_eligible_entity db eid in
        Hashtbl.replace cache eid b;
        b
  in
  List.fold_left
    (fun result item ->
       let block_uuid_change = tx_item_attr item = Some "block/uuid" in
       List.fold_left
         (fun eids eid ->
            if
              block_uuid_change
              || get_block_uuid db_before eid <> get_block_uuid db_after eid
              || cached_eligible before_cache db_before eid
              || cached_eligible after_cache db_after eid
            then Int_set.add eid eids
            else eids)
         result
         (tx_item_eids db_before db_after item))
    Int_set.empty tx_data

let touched_checksum_uuids db_before db_after eids : Str_set.t =
  Int_set.fold
    (fun eid acc ->
       let acc =
         match block_uuid_str db_before eid with
         | Some u -> Str_set.add u acc
         | None -> acc
       in
       match block_uuid_str db_after eid with
       | Some u -> Str_set.add u acc
       | None -> acc)
    eids Str_set.empty

let eids_with_changed_block_uuid db_before db_after eids : Int_set.t =
  Int_set.filter
    (fun eid ->
       get_block_uuid db_before eid <> get_block_uuid db_after eid)
    eids

let referrer_eids_by_target (db : db) target_eid : Int_set.t =
  let s = ref Int_set.empty in
  List.iter
    (fun (d : datom) -> s := Int_set.add d.e !s)
    (List.of_seq (datoms db Avet ~a:"block/parent" ~v:(Ref target_eid) ())
     @ List.of_seq (datoms db Avet ~a:"block/page" ~v:(Ref target_eid) ()));
  !s

let impacted_referrer_eids db_before db_after target_eids : Int_set.t =
  Int_set.fold
    (fun target acc ->
       Int_set.union acc
         (Int_set.union
            (referrer_eids_by_target db_before target)
            (referrer_eids_by_target db_after target)))
    target_eids Int_set.empty

let eids_by_block_uuid db block_uuid : Int_set.t =
  List.of_seq
    (datoms db Avet ~a:"block/uuid" ~v:(Uuid block_uuid) ())
  |> List.fold_left (fun s (d : datom) -> Int_set.add d.e s) Int_set.empty

let block_uuid_datom_count db eid : int =
  List.length
    (List.of_seq (datoms db Eavt ~e:eid ~a:"block/uuid" ()))

let duplicate_block_uuid db_before db_after (uuids : Str_set.t) : bool =
  Str_set.exists
    (fun u ->
       List.length
         (List.of_seq (datoms db_before Avet ~a:"block/uuid" ~v:(Uuid u) ()))
       > 1
       || List.length
            (List.of_seq (datoms db_after Avet ~a:"block/uuid" ~v:(Uuid u) ()))
          > 1)
    uuids

let tuple_set_for_eids db eids e2ee : Tuple_set.t =
  Int_set.fold
    (fun eid acc ->
       if checksum_eligible_entity db eid then
         Tuple_set.union acc (entity_checksum_tuples db eid e2ee)
       else acc)
    eids Tuple_set.empty

let tuple_counts_for_eids db eids e2ee : int Tuple_map.t =
  Int_set.fold
    (fun eid counts ->
       let datom_count = block_uuid_datom_count db eid in
       if datom_count > 0 && checksum_eligible_entity db eid then
         Tuple_set.fold
           (fun tuple acc ->
              Tuple_map.update tuple
                (fun n -> Some (Option.value n ~default:0 + datom_count))
                acc)
           (entity_checksum_tuples db eid e2ee) counts
       else counts)
    eids Tuple_map.empty

(* -> (removed, added) tuple->count maps *)
let net_tuple_delta db_before db_after e2ee (tx_data : tx_item list)
    : int Tuple_map.t * int Tuple_map.t =
  (* :block/tx-id + :block/refs don't affect tuples or eligibility *)
  let tx_data =
    List.filter
      (fun item ->
         match tx_item_attr item with
         | Some "block/tx-id" | Some "block/refs" -> false
         | _ -> true)
      tx_data
  in
  let base_eids = touched_base_eids db_before db_after tx_data in
  if Int_set.is_empty base_eids then (Tuple_map.empty, Tuple_map.empty)
  else
    let uuid_changed_eids =
      eids_with_changed_block_uuid db_before db_after base_eids
    in
    let dependent_eids =
      if Int_set.is_empty uuid_changed_eids then Int_set.empty
      else
        impacted_referrer_eids db_before db_after uuid_changed_eids
        |> Int_set.filter (fun eid ->
               checksum_eligible_entity db_before eid
               || checksum_eligible_entity db_after eid)
    in
    let effective_eids = Int_set.union base_eids dependent_eids in
    let touched_uuids =
      touched_checksum_uuids db_before db_after effective_eids
    in
    if duplicate_block_uuid db_before db_after touched_uuids then begin
      let peer_eids =
        Str_set.fold
          (fun u acc ->
             Int_set.union acc
               (Int_set.union
                  (eids_by_block_uuid db_before u)
                  (eids_by_block_uuid db_after u)))
          touched_uuids Int_set.empty
        |> Int_set.filter (fun eid ->
               checksum_eligible_entity db_before eid
               || checksum_eligible_entity db_after eid)
      in
      let touched_eids = Int_set.union effective_eids peer_eids in
      let before_counts = tuple_counts_for_eids db_before touched_eids e2ee in
      let after_counts = tuple_counts_for_eids db_after touched_eids e2ee in
      let all_tuples =
        Tuple_map.fold
          (fun t _ s -> Tuple_set.add t s)
          before_counts
          (Tuple_map.fold
             (fun t _ s -> Tuple_set.add t s)
             after_counts Tuple_set.empty)
      in
      Tuple_set.fold
        (fun tuple (removed, added) ->
           let before_count =
             Option.value (Tuple_map.find_opt tuple before_counts) ~default:0
           in
           let after_count =
             Option.value (Tuple_map.find_opt tuple after_counts) ~default:0
           in
           if before_count > after_count then
             (Tuple_map.add tuple (before_count - after_count) removed, added)
           else if after_count > before_count then
             (removed, Tuple_map.add tuple (after_count - before_count) added)
           else (removed, added))
        all_tuples (Tuple_map.empty, Tuple_map.empty)
    end
    else begin
      let before_tuples = tuple_set_for_eids db_before effective_eids e2ee in
      let after_tuples = tuple_set_for_eids db_after effective_eids e2ee in
      let removed =
        Tuple_set.fold
          (fun t m -> Tuple_map.add t 1 m)
          (Tuple_set.diff before_tuples after_tuples)
          Tuple_map.empty
      in
      let added =
        Tuple_set.fold
          (fun t m -> Tuple_map.add t 1 m)
          (Tuple_set.diff after_tuples before_tuples)
          Tuple_map.empty
      in
      (removed, added)
    end

let apply_digest_n checksum_state tuple count op =
  let digest = tuple_digest tuple in
  let rec loop n st =
    if n > 0 then loop (n - 1) (op st digest) else st
  in
  loop count checksum_state

let get_graph_rtc_e2ee db : bool =
  match Ldb.get_key_value db "logseq.kv/graph-rtc-e2ee?" with
  | Some (Bool b) -> b
  | Some _ -> true
  | None -> false

let recompute_checksum db : string =
  let e2ee = get_graph_rtc_e2ee db in
  let tuples = db_checksum_tuples db e2ee in
  List.fold_left
    (fun st tuple -> add_digest st (tuple_digest tuple))
    (0, 0) tuples
  |> checksum_of_state

let recompute_checksum_diagnostics db : Wire.t =
  let e2ee = get_graph_rtc_e2ee db in
  let attrs = relevant_attrs e2ee in
  let eids =
    List.of_seq (datoms db Eavt ())
    |> List.filter_map (fun (d : datom) ->
           if List.mem d.a attrs then Some d.e else None)
    |> List.sort_uniq compare
  in
  let block_map eid =
    let kvs = entity_values db eid e2ee in
    let find a =
      Ds_wire.transit_of_value
        (Option.value (List.assoc_opt a kvs) ~default:Nil)
    in
    let base =
      [ Wire.Keyword "block/uuid", find "block/uuid"
      ; Wire.Keyword "block/parent", find "block/parent"
      ; Wire.Keyword "block/page", find "block/page"
      ; Wire.Keyword "block/order", find "block/order" ]
    in
    let base =
      if not e2ee then
        base
        @ [ Wire.Keyword "block/title", find "block/title"
          ; Wire.Keyword "block/name", find "block/name" ]
      else base
    in
    Wire.Map base
  in
  let blocks =
    eids
    |> List.filter_map (fun eid ->
           if checksum_eligible_entity db eid then Some (block_map eid)
           else None)
    |> List.sort (fun a b ->
           let uuid_of m =
             match Wire.get "block/uuid" m with
             | Some (Wire.Uuid u | Wire.String u) -> u
             | _ -> ""
           in
           compare (uuid_of a) (uuid_of b))
  in
  Wire.Map
    [ Wire.Keyword "checksum", Wire.String (recompute_checksum db)
    ; Wire.Keyword "e2ee?", Wire.Bool e2ee
    ; Wire.Keyword "attrs"
    , Wire.Array
        (List.map (fun a -> Wire.Keyword a)
           (List.sort compare attrs))
    ; Wire.Keyword "blocks", Wire.Array blocks ]

let update_checksum checksum ~db_before ~db_after ~tx_data =
  let before_e2ee = get_graph_rtc_e2ee db_before in
  let after_e2ee = get_graph_rtc_e2ee db_after in
  let tx_data = List.map (fun d -> Tx_datom d) tx_data in
  if before_e2ee <> after_e2ee then
    (* E2EE mode changes the global digest semantics; deltas invalid. *)
    recompute_checksum db_after
  else if tx_data = [] then checksum
  else
    let initial_state =
      if valid_checksum checksum then state_of_checksum checksum
      else state_of_checksum (recompute_checksum db_before)
    in
    let removed, added =
      net_tuple_delta db_before db_after after_e2ee tx_data
    in
    let state_after_removals =
      Tuple_map.fold
        (fun tuple count st ->
           apply_digest_n st tuple count subtract_digest)
        removed initial_state
    in
    let state_after_additions =
      Tuple_map.fold
        (fun tuple count st -> apply_digest_n st tuple count add_digest)
        added state_after_removals
    in
    checksum_of_state state_after_additions
