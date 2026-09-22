(* Port of frontend.worker.handler.block-breadcrumb — canonical
   breadcrumb payloads for block loads and search results. Values are
   (attr, value) assoc lists converted to Wire maps by the caller. *)

open Datascript
module Ev = Entity_view

let load_depth = 16

let fail msg data = failwith (Printf.sprintf "%s %s" msg data)

let eavt_scalar db (eid : entity_id) (attr : attr) : value option =
  match Seq.uncons (datoms db Eavt ~e:eid ~a:attr ()) with
  | Some (d, _) -> Some d.v
  | None -> None

(* resolve-ref-id — page/parent passed as eid, uuid, ident, or an
   entity/pulled map that may omit :db/id. *)
let resolve_ref_id (db : db) (r : Ev.node) : entity_id option =
  match Ev.db_id r with
  | Some id -> Some id
  | None ->
      (match Ev.uuid r with
       | Some u ->
           (match entity db (Lookup_ref ("block/uuid", Uuid u)) with
            | Some e -> Some e.id
            | None -> None)
       | None ->
           (match Ev.ident r with
            | Some i ->
                (match entity db (Ident i) with
                 | Some e -> Some e.id
                 | None -> None)
            | None -> None))

let resolve_ref_id_of_value (db : db) (v : value) : entity_id option =
  match v with
  | Int id | Ref id -> Some id
  | Uuid u ->
      (match entity db (Lookup_ref ("block/uuid", Uuid u)) with
       | Some e -> Some e.id
       | None -> None)
  | Keyword k ->
      (match entity db (Ident k) with
       | Some e -> Some e.id
       | None -> None)
  | _ -> None

let tag_summary db (tag_id : entity_id) : (attr * value) list =
  [ ("db/id", Int tag_id) ]
  @ (match eavt_scalar db tag_id "block/uuid" with
     | Some (Uuid _ as u) -> [ ("block/uuid", u) ]
     | _ -> [])
  @ (match eavt_scalar db tag_id "db/ident" with
     | Some (Keyword _ as k) -> [ ("db/ident", k) ]
     | _ -> [])

let choice_summary = tag_summary (* cljs duplicates the same shape *)

let many_identity_attrs =
  [ "block/tags"; "logseq.property/choice-exclusions" ]

let scalar_identity_attrs =
  [ "block/uuid"; "block/title"; "block/name"; "db/ident"
  ; "logseq.property/type"; "db/cardinality"; "logseq.property/value"
  ; "logseq.property.node/display-type"; "logseq.property.code/lang"
  ; "logseq.property/icon"; "logseq.property.class/hide-from-node"
  ; "logseq.property.asset/type"; "logseq.property.asset/width"
  ; "logseq.property.asset/height"; "logseq.property.asset/resize-metadata"
  ; "logseq.property.asset/external-url"; "block/closed-value-property"
  ; "logseq.property/created-from-property" ]

(* scan-ref-attrs — one eavt range per ref. *)
let scan_ref_attrs db (ref_id : entity_id) : (attr, value list) Hashtbl.t =
  let collected = Hashtbl.create 17 in
  Hashtbl.replace collected "db/id" [ Int ref_id ];
  Seq.iter
    (fun (d : datom) ->
       if List.mem d.a many_identity_attrs then
         let cur = Option.value (Hashtbl.find_opt collected d.a) ~default:[] in
         Hashtbl.replace collected d.a (cur @ [ d.v ])
       else if List.mem d.a scalar_identity_attrs then
         Hashtbl.replace collected d.a [ d.v ]
       else ())
    (datoms db Eavt ~e:ref_id ());
  collected

let collected_scalar collected a : value option =
  match Hashtbl.find_opt collected a with
  | Some (v :: _) -> Some v
  | _ -> None

let collected_many collected a : value list =
  Option.value (Hashtbl.find_opt collected a) ~default:[]

let page_ref_identity collected =
  (match collected_scalar collected "block/name" with
   | Some (String _) -> true
   | _ -> false)
  && (match collected_scalar collected "db/ident" with
      | Some (Keyword _) -> false
      | _ -> true)
  && collected_scalar collected "logseq.property.asset/type" = None

let property_or_asset_extras db collected : (attr * value) list =
  let ref_title =
    match collected_scalar collected "block/title" with
    | Some (String s) -> Some s
    | _ -> None
  in
  let choice_exclusions =
    collected_many collected "logseq.property/choice-exclusions"
    |> List.filter_map (fun v ->
           match v with
           | Ref id | Int id -> Some (choice_summary db id)
           | _ -> None)
  in
  let closed_value = collected_scalar collected "block/closed-value-property" <> None in
  let created_from = collected_scalar collected "logseq.property/created-from-property" <> None in
  let property_value_title =
    match ref_title with
    | Some t when closed_value || created_from -> Some t
    | _ -> None
  in
  let extra a =
    match collected_scalar collected a with
    | Some v -> [ (a, v) ]
    | None -> []
  in
  (* cljs (merge (select-keys collected [...]) assoc'd pairs) *)
  List.concat
    [ List.filter_map
        (fun a ->
           match collected_scalar collected a with
           | Some v -> Some (a, v)
           | None -> None)
        [ "logseq.property.node/display-type"; "logseq.property.code/lang" ]
    ; (match choice_exclusions with
       | [] -> []
       | xs -> [ ("logseq.property/choice-exclusions",
                  List (List.map (fun pairs -> Map (List.map (fun (a, v) -> (Keyword a, v)) pairs)) xs)) ])
    ; extra "logseq.property/type"
    ; extra "db/cardinality"
    ; extra "logseq.property/value"
    ; extra "logseq.property/icon"
    ; extra "logseq.property.class/hide-from-node"
    ; extra "logseq.property.asset/type"
    ; extra "logseq.property.asset/width"
    ; extra "logseq.property.asset/height"
    ; extra "logseq.property.asset/resize-metadata"
    ; extra "logseq.property.asset/external-url"
    ; (match property_value_title with
       | Some t -> [ ("block/title", String t) ]
       | None -> [])
    ]

let compute_shallow_ref_identity db (ref_id : entity_id option) : (attr * value) list =
  let ref_id =
    match ref_id with
    | Some id -> id
    | None -> fail "Missing canonical block reference" "{:ref-id nil}"
  in
  let collected = scan_ref_attrs db ref_id in
  let ref_uuid = collected_scalar collected "block/uuid" in
  let ref_ident = collected_scalar collected "db/ident" in
  let ref_title =
    match collected_scalar collected "block/title" with
    | Some (String _ as s) -> Some s
    | _ -> None
  in
  let ref_name =
    match collected_scalar collected "block/name" with
    | Some (String _ as s) -> Some s
    | _ -> None
  in
  let tag_ids =
    collected_many collected "block/tags"
    |> List.filter_map (function Ref id | Int id -> Some id | _ -> None)
  in
  (match ref_uuid with
   | Some v -> (match v with Uuid _ -> () | _ -> fail "Invalid canonical block reference UUID" "")
   | None -> ());
  (match ref_ident with
   | Some v -> (match v with Keyword _ -> () | _ -> fail "Invalid canonical block reference ident" "")
   | None -> ());
  let base =
    [ ("db/id", Int ref_id) ]
    @ (match ref_uuid with Some u -> [ ("block/uuid", u) ] | None -> [])
    @ (match ref_ident with Some k -> [ ("db/ident", k) ] | None -> [])
    @ (match ref_title with Some t -> [ ("block/title", t) ] | None -> [])
    @ (match ref_name with Some n -> [ ("block/name", n) ] | None -> [])
    @ (match tag_ids with
       | [] -> []
       | ids -> [ ("block/tags",
                List (List.map (fun id -> Map (List.map (fun (a, v) -> (Keyword a, v)) (tag_summary db id))) ids)) ])
  in
  (* cljs merge: extra pairs replace same-attr base pairs *)
  List.fold_left
    (fun acc (a, v) -> (a, v) :: List.remove_assoc a acc)
    base
    (if page_ref_identity collected then [] else property_or_asset_extras db collected)

(* cljs *ref-identity-cache* — bound per batch; one per breadcrumb
   call here (still dedupes refs shared across ancestors/refs). *)
type cache = (entity_id, (attr * value) list) Hashtbl.t

let shallow_ref_identity ?cache db (r : Ev.node) : (attr * value) list =
  let ref_id = resolve_ref_id db r in
  let hit =
    match cache, ref_id with
    | Some c, Some id -> Hashtbl.find_opt c id
    | _ -> None
  in
  match hit with
  | Some h -> h
  | None ->
      let identity = compute_shallow_ref_identity db ref_id in
      (match cache, ref_id with
       | Some c, Some id -> Hashtbl.replace c id identity
       | _ -> ());
      identity

let breadcrumb_entity ?cache db (n : Ev.node) : (attr * value) list =
  shallow_ref_identity ?cache db n
  @ (match Ev.value n "block/raw-title" with
     | Some (String _ as s) -> [ ("block/raw-title", s) ]
     | _ -> [])
  @ (match Ev.value n "logseq.property.node/display-type" with
     | Some v -> [ ("logseq.property.node/display-type", v) ]
     | None -> [])
  @ (match Ev.ref_nodes n "block/refs" with
     | [] -> []
     | refs ->
         [ ("block/refs",
            List
             (List.map
                (fun r ->
                   Map (List.map (fun (a, v) -> (Keyword a, v))
                          (shallow_ref_identity ?cache db r)))
                refs)) ])

(* block-breadcrumb db block depth *)
let block_breadcrumb ?(depth = load_depth) db (block : Ev.node) :
    (attr * value) list list =
  if depth <= 0 then fail "Invalid breadcrumb load depth" (string_of_int depth);
  let cache = Hashtbl.create 17 in
  let block_uuid = Option.value (Ev.uuid block) ~default:"" in
  let parents = Ldb.get_block_parents db ~depth block_uuid in
  let page = Ev.ref_node block "block/page" in
  let page_id =
    match page with
    | Some p -> resolve_ref_id db p
    | None -> None
  in
  let parent_ids = List.filter_map (fun (e : entity) -> Some e.id) parents in
  let ancestors : Ev.node list =
    match page, page_id with
    | Some p, Some pid when not (List.mem pid parent_ids) -> p :: List.map Entity_view.of_entity parents
    | _ -> List.map Entity_view.of_entity parents
  in
  let crumbs = List.map (fun n -> breadcrumb_entity ~cache db n) ancestors in
  match Ev.ref_node block "logseq.property/created-from-property" with
  | Some prop -> crumbs @ [ breadcrumb_entity ~cache db prop ]
  | None -> crumbs
