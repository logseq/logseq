(* Shared helpers for the translated cljs test modules: Alcotest check,
   small entity/wire accessors, and query-result extractors used by the
   d/q-based tests. *)

open Datascript

(* cljs tests run with $LOGSEQ_STABLE_IDENTS so new user.property/user.class
   idents are deterministic (db-ident/create-db-ident-from-name). *)
let () = Unix.putenv "LOGSEQ_STABLE_IDENTS" "1"

let check (name : string) (ok : bool) =
  Alcotest.(check bool) name true ok

let await (t : Wire.t Db_worker_effect.t) : Wire.t =
  let result = ref Wire.nil in
  Db_worker_effect.on_any t (fun v -> result := v) (fun e -> raise e);
  !result

let test_repo = "test-repo"

let register_conn conn = Worker_state.set_datascript_conn test_repo conn

let db_of = Datascript.db
let ent_title (e : entity) = Ldb.string_value e "block/title"

let block_by_title db t = Db_test_util.find_page_by_title db t

(* wire helpers for endpoint result assertions *)
let wire_maps (w : Wire.t) : (Wire.t * Wire.t) list list =
  match w with
  | Wire.Array items | Wire.List items ->
      List.filter_map (function Wire.Map kvs -> Some kvs | _ -> None) items
  | _ -> []

let wire_get (k : string) (m : (Wire.t * Wire.t) list) : Wire.t option =
  List.find_map (function Wire.Keyword k', v when k' = k -> Some v | _ -> None) m

let wire_string_field (k : string) (m : (Wire.t * Wire.t) list) : string option =
  match wire_get k m with
  | Some (Wire.String s) | Some (Wire.Uuid s) -> Some s
  | _ -> None

(* --- query_result extraction --- *)

let ent_id (r : query_result) : entity_id option =
  match r with Result_entity id -> Some id | _ -> None

(* first col of each tuple as eid *)
let result_eids (rows : query_result list list) : entity_id list =
  List.filter_map (function [ r ] -> ent_id r | _ -> None) rows

let result_titles db (rows : query_result list list) : string list =
  List.filter_map
    (function
      | [ r ] ->
          (match ent_id r with
           | Some id ->
               (match Datascript.entity db (Entity_id id) with
                | Some e -> ent_title e
                | None -> None)
           | None ->
               (match r with
                | Result_value (String s) -> Some s
                | Result_pull p ->
                    (match
                       List.assoc_opt (Keyword "block/title") p.pulled_attrs
                     with
                     | Some (Pulled_scalar (String t)) -> Some t
                     | _ -> None)
                | _ -> None))
      | _ -> None)
    rows

(* (map (comp :block/title first) rows) where rows are single-col pulls *)
let pull_titles (rows : query_result list list) : string list =
  List.filter_map
    (function
      | [ Result_pull p ] ->
          (match List.assoc_opt (Keyword "block/title") p.pulled_attrs with
           | Some (Pulled_scalar (String t)) -> Some t
           | _ -> None)
      | _ -> None)
    rows

(* scalar first-column values as keywords *)
let result_keyword_values (rows : query_result list list) : string list =
  List.filter_map
    (function
      | [ Result_attr a ] -> Some a
      | [ Result_value (Keyword k) ] -> Some k
      | _ -> None)
    rows

(* sorted unique for cljs set equality *)
let sort_uniq = List.sort_uniq String.compare

let entity_at_ref db attr v : entity option =
  Datascript.entity db (Lookup_ref (attr, v))

let entity_at_uuid db (uuid : string) : entity option =
  entity_at_ref db "block/uuid" (Uuid uuid)

let uuid_of (e : entity) : string =
  match Ldb.value e "block/uuid" with Some (Uuid u) -> u | _ -> ""

(* throws if the cljs test relied on d/entity resolving a ref *)
let ent_of_ref_exn db r : entity =
  match Datascript.entity db r with
  | Some e -> e
  | None -> failwith "entity not found for ref"

let ident_ent_exn db (ident : string) : entity =
  ent_of_ref_exn db (Ident ident)
