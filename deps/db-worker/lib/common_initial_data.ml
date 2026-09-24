(* Port of logseq.db.common.initial-data — the get-initial-data bundle
   (schema + bootstrap datoms) and its helpers. Separate from Ldb so it
   can use Db_order and Common_config without a module cycle. *)

open Datascript

let favorites_page_name = Common_config.favorites_page_name
let views_page_name = Common_config.views_page_name
let quick_add_page_name = Common_config.quick_add_page_name

(* get-structured-datoms — eavt datoms of every class- or
   property-tagged entity and every closed-value-property holder, plus
   each property's :logseq.property/description entity datoms. *)
let structured_datoms db : datom list =
  let class_property_id =
    match Ldb.counted_entity db (Ident "logseq.class/Property") with
    | Some e -> Some e.id
    | None -> None
  in
  let tag_datoms =
    List.concat_map
      (fun ident ->
        match Ldb.counted_entity db (Ident ident) with
        | Some tag ->
            List.of_seq
              (datoms db Avet ~a:"block/tags" ~v:(Ref tag.id) ())
        | None -> [])
      [ "logseq.class/Tag"; "logseq.class/Property" ]
    @ List.of_seq (datoms db Avet ~a:"block/closed-value-property" ())
  in
  List.concat_map
    (fun (d : datom) ->
      let block_datoms = List.of_seq (datoms db Eavt ~e:d.e ()) in
      let description_datoms =
        match d.v with
        | Ref v when Some v = class_property_id -> (
            match Ldb.ent_of_id db d.e with
            | Some e -> (
                match Ldb.value e "logseq.property/description" with
                | Some (Ref id) -> List.of_seq (datoms db Eavt ~e:id ())
                | Some (Int id) -> List.of_seq (datoms db Eavt ~e:id ())
                | _ -> [])
            | None -> [])
        | _ -> []
      in
      block_datoms @ description_datoms)
    tag_datoms

(* get-favorites — favorites page datoms + each child's :block/link
   target datoms + all children datoms. *)
let favorites_datoms db : datom list =
  match Ldb.first_page_by_name db favorites_page_name with
  | None -> []
  | Some pid -> (
      match Ldb.ent_of_id db pid with
      | None -> []
      | Some page ->
          let children = Ldb.ref_ents page "block/_page" in
          List.of_seq (datoms db Eavt ~e:page.id ())
          @ List.concat_map
              (fun (c : entity) ->
                match Ldb.ref_ent c "block/link" with
                | Some l -> List.of_seq (datoms db Eavt ~e:l.id ())
                | None -> [])
              children
          @ List.concat_map
              (fun (c : entity) -> List.of_seq (datoms db Eavt ~e:c.id ()))
              children)

(* get-recent-updated-pages — up to 15 non-hidden pages by
   :block/updated-at desc. *)
let get_recent_updated_pages db : entity list =
  rseek_datoms db Avet ~a:"block/updated-at" ()
  |> Seq.filter_map (fun (d : datom) ->
         let has_block_page =
           Option.is_some
             (Seq.uncons (datoms db Eavt ~e:d.e ~a:"block/page" ()))
         in
         let blank_title =
           match
             Seq.uncons (datoms db Eavt ~e:d.e ~a:"block/title" ())
           with
           | Some (t, _) -> (
               match t.v with
               | String s -> String.trim s = ""
               | _ -> false)
           | None -> true
         in
         if has_block_page || blank_title then None
         else
           match Ldb.ent_of_id db d.e with
           | Some e when Ldb.is_page e && not (Ldb.hidden e) -> Some e
           | _ -> None)
  |> Seq.take 15 |> List.of_seq

(* get-all-user-datoms — eavt datoms of every
   :logseq.property.user/email holder (nil when the ident is absent). *)
let all_user_datoms db : datom list =
  match Ldb.counted_entity db (Ident "logseq.property.user/email") with
  | None -> []
  | Some _ ->
      List.of_seq (datoms db Avet ~a:"logseq.property.user/email" ())
      |> List.concat_map (fun (d : datom) ->
             List.of_seq (datoms db Eavt ~e:d.e ()))

(* get-list-style-values — eavt datoms of every distinct
   :logseq.property/order-list-type value entity. *)
let list_style_datoms db : datom list =
  List.of_seq (datoms db Avet ~a:"logseq.property/order-list-type" ())
  |> List.map (fun (d : datom) -> d.v)
  |> List.sort_uniq Util.compare_value
  |> List.concat_map (fun v ->
         match v with
         | Ref id | Int id -> List.of_seq (datoms db Eavt ~e:id ())
         | _ -> [])

(* get-all-files — eavt datoms of every :file/path entity. *)
let all_files_datoms db : datom list =
  List.of_seq (datoms db Avet ~a:"file/path" ())
  |> List.concat_map (fun (d : datom) -> List.of_seq (datoms db Eavt ~e:d.e ()))

(* cljs distinct over datoms — dedup by full datom equality, keeping
   first occurrence. *)
let dedup_datoms (ds : datom list) : datom list =
  let seen = Hashtbl.create 256 in
  List.filter
    (fun d ->
      if Hashtbl.mem seen d then false
      else (
        Hashtbl.add seen d ();
        true))
    ds

type initial_data =
  { initial_schema : schema
  ; initial_datoms : datom list }

(* get-initial-data — schema + the datoms needed to bootstrap a
   frontend conn (kv idents, structured entities, user datoms,
   list-style values, favorites, recent pages, files, built-in pages),
   excluding transient attrs. *)
let get_initial_data db : initial_data =
  Db_order.reset_max_key (Db_order.get_max_order db);
  let kv_idents =
    [ "logseq.kv/db-type"; "logseq.kv/schema-version"; "logseq.kv/graph-uuid"
    ; "logseq.kv/local-graph-uuid"; "logseq.kv/graph-rtc-e2ee?"
    ; "logseq.kv/graph-remote?"; "logseq.kv/latest-code-lang"
    ; "logseq.kv/graph-backup-folder"; "logseq.property/empty-placeholder" ]
  in
  let ident_datoms =
    List.concat_map
      (fun ident ->
        match Ldb.counted_entity db (Ident ident) with
        | Some e -> List.of_seq (datoms db Eavt ~e:e.id ())
        | None -> [])
      kv_idents
  in
  let recent_page_datoms =
    List.concat_map
      (fun (p : entity) -> List.of_seq (datoms db Eavt ~e:p.id ()))
      (get_recent_updated_pages db)
  in
  let pages_datoms =
    let contents_id = Ldb.first_page_by_title db "Contents" in
    let capture_page_id =
      Option.map
        (fun (e : entity) -> e.id)
        (Ldb.get_built_in_page db quick_add_page_name)
    in
    let views_id = Ldb.first_page_by_title db views_page_name in
    let recycle_id = Ldb.first_page_by_title db "Recycle" in
    List.filter_map Fun.id
      [ contents_id; capture_page_id; views_id; recycle_id ]
    |> List.concat_map (fun e -> List.of_seq (datoms db Eavt ~e ()))
  in
  let data =
    dedup_datoms
      (ident_datoms @ structured_datoms db @ all_user_datoms db
       @ list_style_datoms db @ favorites_datoms db @ recent_page_datoms
       @ all_files_datoms db @ pages_datoms)
    |> List.filter (fun (d : datom) ->
           not
             (List.mem d.a
                [ "block/created-at"; "block/updated-at"; "block/tx-id"
                ; "logseq.property/created-by-ref" ]))
  in
  { initial_schema = Datascript.schema db; initial_datoms = data }

(* cljs common-initial-data/with-parent — post-processing applied to a
   :thread-api/pull result map. When the pulled entity carries
   :block/page, :block/parent is replaced by the parent's
   {db/id, block/uuid} select-keys map, nil top-level values are removed
   non-nested, and every :block/refs entry is expanded to a full [*]
   pull (cljs (map f refs) — a seq on the wire, not a set). *)
let with_parent (db : db) (block : Wire.t) : Wire.t =
  match block with
  | Wire.Map _ -> (
      let truthy = function Wire.Nil | Wire.Bool false -> false | _ -> true in
      match Cljs_map.get block "block/page" with
      | Some page_v when truthy page_v ->
          let parent =
            match Cljs_map.get block "block/parent" with
            | Some (Wire.Map _ as pm) -> (
                match Cljs_map.get pm "db/id" with
                | Some (Wire.Int eid) -> (
                    match Datascript.entity db (Entity_id eid) with
                    | Some e ->
                        let uuid_kv =
                          match Db_normalize.entity_block_uuid e with
                          | Some u -> [ (Wire.Keyword "block/uuid", u) ]
                          | None -> []
                        in
                        Wire.Map ((Wire.Keyword "db/id", Wire.Int eid) :: uuid_kv)
                    | None -> Wire.Nil)
                | _ -> Wire.Nil)
            | _ -> Wire.Nil
          in
          let block = Cljs_map.assoc block "block/parent" parent in
          let block =
            match block with
            | Wire.Map kvs ->
                Wire.Map (List.filter (fun (_, v) -> v <> Wire.Nil) kvs)
            | other -> other
          in
          let refs =
            match Cljs_map.get block "block/refs" with
            | Some (Wire.Set xs) | Some (Wire.Array xs) | Some (Wire.List xs) ->
                xs
            | Some Wire.Nil | None -> []
            | Some _ -> invalid_arg "block/refs is not sequential"
          in
          let refs' =
            List.map
              (fun r ->
                 match Cljs_map.get r "db/id" with
                 | Some (Wire.Int eid) -> (
                     match Datascript.pull_string db "[*]" (Entity_id eid) with
                     | Some pulled -> Ds_wire.transit_of_pulled pulled
                     | None -> Wire.Nil)
                 | _ -> Wire.Nil)
              refs
          in
          Cljs_map.assoc block "block/refs" (Wire.List refs')
      | _ -> block)
  | _ -> block
