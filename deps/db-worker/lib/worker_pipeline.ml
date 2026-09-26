(* frontend.worker.pipeline — the transact pipeline that runs between
   d/with and the commit in transact-sync. 1:1 port of pipeline.cljs:
   every hook, its order, and its early-outs are preserved.
   invoke-hooks/render-affected-keys is db_listener's surface (another
   agent) — transact-pipeline below is what db_tx wires into. *)

open Datascript

(* ---------- tx-meta helpers ---------- *)

let flag (tx_meta : tx_meta) (k : attr) : bool =
  Db_tx.tx_meta_flag tx_meta k

(* cljs rtc-tx-or-download-graph? *)
let rtc_tx_or_download_graph (tx_meta : tx_meta) : bool =
  flag tx_meta "rtc-op?" || flag tx_meta "rtc-tx?"
  || flag tx_meta "rtc-download-graph?" || flag tx_meta "transact-remote?"

let outliner_op (tx_meta : tx_meta) : string option =
  match Db_tx.tx_meta_lookup tx_meta "outliner-op" with
  | Some (Keyword k) -> Some k
  | _ -> None

(* cljs refs-need-recalculated? *)
let refs_need_recalculated (tx_meta : tx_meta) : bool =
  match outliner_op tx_meta with
  | Some "collapse-expand-blocks" | Some "delete-blocks" -> false
  | _ -> not (flag tx_meta "undo?" || flag tx_meta "redo?")

(* cljs imported-data? *)
let imported_data (tx_meta : tx_meta) : bool =
  flag tx_meta "logseq.graph-parser.exporter/imported-data?"
  || flag tx_meta "logseq.db.sqlite.export/imported-data?"

(* tx forms → tx_op *)
let retract (e : int) (a : attr) (v : value) : tx_op =
  Retract (Entity_id e, a, Some v)

let retract_attr (e : int) (a : attr) : tx_op =
  RetractAttr (Entity_id e, a)

let add (e : int) (a : attr) (v : value) : tx_op =
  Add (Entity_id e, a, v)

let ent_of_datom_v (db : db) (v : value) : entity option =
  match v with
  | Ref i -> Ldb.ent_of_id db i
  | Int64 i -> Option.bind (Datascript.Util.int64_to_int i) (Ldb.ent_of_id db)
  | _ -> None

(* ---------- rebuild-block-refs ---------- *)

let rebuild_block_refs (report : tx_report) (blocks : entity list)
    : tx_op list =
  let tx_meta = report.tx_meta in
  if
    (outliner_op tx_meta <> None && refs_need_recalculated tx_meta)
    || flag tx_meta "rtc-tx?" || flag tx_meta "rtc-op?"
    || imported_data tx_meta
  then
    List.concat_map
      (fun (block : entity) ->
        match entity report.db_after (Entity_id block.id) with
        | Some b_after
          when Ldb.value b_after "logseq.property.reaction/target" = None ->
            let ref_ids =
              List.sort_uniq compare
                (Outliner_pipeline.db_rebuild_block_refs report.db_after
                   b_after ())
            in
            let old_ref_ids =
              match entity report.db_before (Entity_id block.id) with
              | Some old ->
                  List.sort_uniq compare
                    (List.map
                       (fun (r : entity) -> r.id)
                       (Ldb.ref_ents old "block/refs"))
              | None -> []
            in
            if ref_ids = old_ref_ids then []
            else
              List.map
                (fun id -> retract block.id "block/refs" (Ref id))
                (List.filter
                   (fun id -> not (List.mem id ref_ids))
                   old_ref_ids)
              @ List.map
                  (fun id -> add block.id "block/refs" (Ref id))
                  (List.filter
                     (fun id -> not (List.mem id old_ref_ids))
                     ref_ids)
        | _ -> [])
      blocks
  else []

(* ---------- template journals ---------- *)

let journal_title (db : db) (journal_day : int) : string =
  let fmt =
    match entity db (Ident "logseq.class/Journal") with
    | Some j -> Ldb.string_value j "logseq.property.journal/title-format"
    | None -> None
  in
  match fmt with
  | Some f -> Ldb.journal_title_of_day journal_day f
  | None ->
      Ldb.journal_title_of_day journal_day
        Date_time_util.default_journal_title_formatter

(* cljs ensure-template-journal-pages *)
let ensure_template_journal_pages (db : db) (blocks : Block_map.t list)
    : db * datom list =
  List.fold_left
    (fun (db, tx_data) journal_day ->
      match Ldb.get_journal_page_by_day db journal_day with
      | Some _ -> (db, tx_data)
      | None ->
          let r =
            Outliner_page.create db (journal_title db journal_day)
              ~journal:true ()
          in
          if r.tx_data = [] then
            invalid_arg "failed to create template journal page";
          (* cljs (d/with db page-tx-data) — upstream create emits cljs
             tx forms (Wire.t); render + parse to tx ops, apply on a
             storage-less db like with_report does. *)
          let report =
            Datascript.transact_string ~tx_meta:[]
              { db with storage_ref = None }
              (Db_transact.tx_edn r.tx_data)
          in
          (report.db_after, tx_data @ report.tx_data))
    (db, [])
    (Outliner_template.dynamic_template_journal_days blocks)

(* cljs insert-tag-templates *)
let insert_tag_templates (tx_report : tx_report) : tx_op list =
  let db = tx_report.db_after in
  let journal_id =
    match entity db (Ident "logseq.class/Journal") with
    | Some e -> Some e.id
    | None -> None
  in
  let journal_page =
    List.find_map
      (fun (d : datom) ->
        if d.a = "block/journal-day" && d.added then
          entity db (Entity_id d.e)
        else None)
      tx_report.tx_data
  in
  let journal_template =
    match journal_id with
    | Some jid ->
        List.exists
          (fun (d : datom) ->
            d.added && d.a = "block/tags"
            && (match d.v with
                | Ref i -> i = jid
                | Int64 i -> Int64.equal i (Int64.of_int jid)
                | _ -> false))
          tx_report.tx_data
    | None -> false
  in
  (* (template entity, journal entity option) *)
  let tag_to_templates (id : entity_id) : (entity * entity option) list =
    match entity db (Entity_id id) with
    | None -> []
    | Some tag ->
        Db_class.get_class_extends tag @ [ tag ]
        |> List.concat_map
             (fun (t : entity) ->
               Ldb.ref_ents t "logseq.property/_template-applied-to")
        |> List.map (fun t -> (t, journal_page))
  in
  let raw_template_blocks (template : entity) (journal : entity option)
      : Block_map.t list =
    match Ldb.value template "block/uuid" with
    | Some (Uuid tu) -> begin
        (match
           Ldb.get_block_and_children db
             ~include_property_block:true tu
         with
         | [] -> []
         | _self :: children ->
             (* cljs (next children-list) — childless templates skipped *)
             (match children with
              | [] -> []
              | first_child :: rest_children ->
                  (Block_map.put (Block_map.of_entity first_child)
                     "logseq.property/used-template" (Int64 (Int64.of_int template.id))
                   :: List.map Block_map.of_entity rest_children)
                  |> List.map
                       (fun (m : Block_map.t) ->
                         match journal with
                         | Some jp ->
                             let ju =
                               (match Ldb.value jp "block/uuid" with
                                | Some (Uuid u) -> u
                                | _ -> "")
                             in
                             let bu =
                               Block_map.uuid_attr m "block/uuid"
                               |> Option.value
                                    ~default:(Common_uuid.new_block_id ())
                             in
                             Block_map.put m "block/uuid"
                               (Uuid
                                  (Common_uuid.gen_journal_template_block
                                     ju bu))
                         | None -> m)))
                  end
    | _ -> []
  in
  let tag_additions =
    let tbl = Hashtbl.create 16 in
    let order = ref [] in
    List.iter
      (fun (d : datom) ->
        if d.a = "block/tags" && d.added then begin
          (if not (Hashtbl.mem tbl d.e) then order := d.e :: !order);
          Hashtbl.replace tbl d.e
            (d :: (try Hashtbl.find tbl d.e with Not_found -> []))
        end)
      tx_report.tx_data;
    List.map
      (fun e -> (e, List.rev (Hashtbl.find tbl e)))
      (List.rev !order)
  in
  let insertion_inputs =
    List.concat_map
      (fun (e, (ds : datom list)) ->
        let tag_ids =
          List.sort_uniq compare
            (List.filter_map
               (fun (d : datom) ->
                 match d.v with
                 | Ref i -> Some i
                 | Int64 i -> Datascript.Util.int64_to_int i
                 | _ -> None)
               ds)
        in
        let templates =
          tag_ids
          |> List.concat_map tag_to_templates
          |> List.sort_uniq (fun (a, _) (b, _) -> compare a.id b.id)
          |> List.sort
               (fun (a, _) (b, _) ->
                 Int64.compare
                   (Option.value ~default:0L
                      (Ldb.int64_value a "block/created-at"))
                   (Option.value ~default:0L
                      (Ldb.int64_value b "block/created-at")))
        in
        List.map
          (fun (template, journal) ->
            (e, raw_template_blocks template journal))
          templates)
      tag_additions
  in
  let db_with_pages, page_tx_data =
    ensure_template_journal_pages db
      (List.concat_map snd insertion_inputs)
  in
  let insert_tx_data =
    List.concat_map
      (fun (object_id, blocks) ->
        match entity db_with_pages (Entity_id object_id) with
        | None -> []
        | Some object_ ->
            let blocks_to_insert =
              Outliner_template.resolve_dynamic_template_blocks
                db_with_pages object_ blocks
            in
            let tx_result, inserted_blocks =
              Outliner_core.insert_blocks db_with_pages blocks_to_insert
                (Block_map.of_entity object_)
                { Outliner_core.default_insert_opts with
                  sibling = false
                ; keep_uuid = journal_template
                ; outliner_op = Some "insert-template-blocks" }
            in
            tx_result.tx_data
            @ List.concat_map
                (fun (m : Block_map.t) ->
                  (* cljs outliner-pipeline/block-content-refs on the
                     returned block maps — raw-title falling back to
                     title, [[uuid]] matches → ref ids *)
                  let content =
                    match Block_map.string_attr m "block/raw-title",
                          Block_map.string_attr m "block/title" with
                    | Some c, _ | None, Some c -> Some c
                    | None, None -> None
                  in
                  match content with
                  | None -> []
                  | Some c ->
                      let refs =
                        List.filter_map
                          (fun u ->
                            match
                              entity db_with_pages
                                (Lookup_ref ("block/uuid", Uuid u))
                            with
                            | Some e -> Some e.id
                            | None -> None)
                          (Db_content.get_matched_ids c)
                      in
                      (match refs with
                       | [] -> []
                       | refs ->
                           (match Block_map.attr_value m "db/id" with
                            | Some id_v ->
                                [ Block_map.to_tx_op db_with_pages
                                    [ "db/id", id_v
                                    ; "block/refs",
                                      Set (List.map (fun i -> Int64 (Int64.of_int i)) refs) ] ]
                            | None -> [])))
                inserted_blocks)
      insertion_inputs
  in
  (* cljs concat page-tx-data insert-tx-data — both are tx forms;
     page_tx_data here is datoms from d/with *)
  (List.map (fun (d : datom) -> Raw_datom d) page_tx_data)
  @ insert_tx_data

(* ---------- fix-page-tags ---------- *)

(* cljs fix-page-tags *)
let fix_page_tags (report : tx_report) : tx_op list =
  if flag report.tx_meta "rtc-tx?" then []
  else
    let db = report.db_after in
    let page_tag = entity db (Ident "logseq.class/Page") in
    let tag = entity db (Ident "logseq.class/Tag") in
    (match page_tag with
     | None -> failwith "Page tag doesn't exist"
     | Some _ -> ());
    List.concat_map
      (fun (d : datom) ->
        if d.a = "block/tags" && d.added then
          let ent = entity db (Entity_id d.e) in
          let v_entity = ent_of_datom_v db d.v in
          (match ent, tag with
           | Some e, Some tag_e
             when (match d.v with
                   | Ref i -> i = tag_e.id
                   | Int64 i -> Int64.equal i (Int64.of_int tag_e.id)
                   | _ -> false)
                  && (match Ldb.string_value e "block/raw-title" with
                      | Some raw ->
                          (match Ldb.value tag_e "block/uuid" with
                           | Some (Uuid u) -> not (Ldb.inline_tag raw u)
                           | _ -> true)
                      | None -> true)
                  && Ldb.value e "db/ident" = None ->
               (* add missing :db/ident and class/extends for new tag *)
               (match Ldb.value e "block/page" with
                | Some _ ->
                    (* page child block never becomes a class *)
                    [ retract e.id "block/tags"
                        (Keyword "logseq.class/Tag") ]
                | None ->
                    [ add e.id "db/ident"
                        (Keyword
                           (Db_ident.create_user_class_ident_from_name
                              ~db
                              (Ldb.string_value e "block/title"
                               |> Option.value ~default:"")))
                    ; add e.id "logseq.property.class/extends"
                        (Keyword "logseq.class/Root")
                    ; retract e.id "block/tags"
                        (Keyword "logseq.class/Page") ])
           | Some e, _ ->
               (match page_tag with
                | Some pt
                  when (match d.v with
                        | Ref i -> i = pt.id
                        | Int64 i -> Int64.equal i (Int64.of_int pt.id)
                        | _ -> false) ->
                    (* remove #Page when entity has other page-classes *)
                    let tag_idents =
                      List.filter_map
                        (fun (t : entity) ->
                          match Ldb.ident_of t with
                          | Some "logseq.class/Page" -> None
                          | o -> o)
                        (Ldb.ref_ents e "block/tags")
                    in
                    if
                      tag_idents <> []
                      && List.exists
                           (fun i -> List.mem i Db_class.page_classes)
                           tag_idents
                    then
                      [ retract d.e "block/tags"
                          (Keyword "logseq.class/Page") ]
                    else
                      (match v_entity with
                       | Some ve ->
                           (match Ldb.ident_of ve with
                            | Some ident
                              when List.mem ident Db_class.page_classes
                                   && ident <> "logseq.class/Page"
                                   && Ldb.internal_page e ->
                                [ retract d.e "block/tags"
                                    (Keyword "logseq.class/Page") ]
                            | _ -> [])
                       | None -> [])
                | _ ->
                    (match v_entity with
                     | Some ve ->
                         (match Ldb.ident_of ve with
                          | Some ident
                            when List.mem ident Db_class.page_classes
                                 && ident <> "logseq.class/Page"
                                 && Ldb.internal_page e ->
                              [ retract d.e "block/tags"
                                  (Keyword "logseq.class/Page") ]
                          | _ -> [])
                     | None -> []))
           | _ -> [])
        else [])
      report.tx_data

(* ---------- fix-inline-built-in-page-classes ---------- *)

let contains_sub (s : string) (sub : string) : bool =
  let n = String.length s and m = String.length sub in
  let rec go i = i + m <= n && (String.sub s i m = sub || go (i + 1)) in
  go 0

let replace_sub_all (s : string) (sub : string) : string =
  let n = String.length s and m = String.length sub in
  let b = Buffer.create n in
  let rec go i =
    if i + m <= n && String.sub s i m = sub then go (i + m)
    else if i < n then begin
      Buffer.add_char b s.[i];
      go (i + 1)
    end
  in
  go 0;
  Buffer.contents b

(* cljs remove-inline-page-class-from-title *)
let remove_inline_page_class_from_title (block : entity) (page_tag : entity)
    : string =
  let raw =
    (* cljs (:block/raw-title block) — entity-plus alias that falls back
       to :block/title (and journal title), not a plain attr read *)
    match Ldb.raw_title block.db block with
    | Some (String s) -> s
    | _ -> ""
  in
  let uuid =
    Ldb.string_value page_tag "block/uuid" |> Option.value ~default:""
  in
  let needle = "#" ^ Page_ref.to_page_ref uuid in
  Unicode.trim (replace_sub_all raw needle)

let fix_inline_built_in_page_classes (report : tx_report) : tx_op list =
  if rtc_tx_or_download_graph report.tx_meta then []
  else
    let db = report.db_after in
    let class_idents =
      List.filter (fun i -> i <> "logseq.class/Page")
        Db_class.page_classes
    in
    let class_ids =
      List.filter_map
        (fun ident ->
          match entity db (Ident ident) with
          | Some e -> Some e.id
          | None -> None)
        class_idents
    in
    List.concat_map
      (fun (d : datom) ->
        match d.a = "block/tags" && d.added with
        | false -> []
        | true ->
            let vid =
              match d.v with
              | Ref i -> Some i
              | Int64 i -> Datascript.Util.int64_to_int i
              | _ -> None
            in
            (match vid with
             | Some vid when List.mem vid class_ids ->
                 let id = d.e in
                 (match
                    entity db (Entity_id id),
                    entity db (Entity_id vid)
                  with
                  | Some ent, Some page_tag ->
                      let title =
                        match Ldb.string_value ent "block/raw-title" with
                        | Some t -> Some t
                        | None -> Ldb.string_value ent "block/title"
                      in
                      (match title with
                       | Some t
                         when contains_sub t "#[["
                              && (match Ldb.value page_tag "block/uuid" with
                                  | Some (Uuid u) -> Ldb.inline_tag t u
                                  | _ -> false) ->
                           let new_title =
                             remove_inline_page_class_from_title ent
                               page_tag
                           in
                           [ Block_map.to_tx_op db
                               [ "db/id", Int64 (Int64.of_int id)
                               ; "block/title", String new_title ]
                           ; retract id "block/tags" d.v
                           ; retract id "block/tags"
                               (Keyword "logseq.class/Page") ]
                       | _ -> [])
                  | _ -> [])
             | _ -> []))
      report.tx_data

(* ---------- toggle-page-and-block ---------- *)

let toggle_page_and_block (db : db) (report : tx_report) : tx_op list =
  if rtc_tx_or_download_graph report.tx_meta then []
  else
    let page_tag = entity db (Ident "logseq.class/Page") in
    let library_page = Ldb.get_library_page report.db_after in
    (* cljs move-parent-to-library-tx — climb to the topmost page
       ancestor: namespaces created before registration existed can
       have a parentless root higher up. *)
    let move_parent_to_library_tx (block_parent : entity option) =
      let rec climb (p : entity) =
        match Ldb.ref_ent p "block/parent" with
        | Some pp when Ldb.is_page p && Ldb.is_page pp -> climb pp
        | _ -> p
      in
      match block_parent with
      | None -> []
      | Some bp ->
          let root = climb bp in
          (match library_page with
           | Some lp
             when Ldb.is_page root
                  && Ldb.value root "block/parent" = None
                  && root.id <> lp.id
                  && Ldb.value root "db/ident" = None
                  && not (Ldb.built_in root) ->
               [ Block_map.to_tx_op db
                   [ "db/id", Int64 (Int64.of_int root.id)
                   ; "block/parent", Int64 (Int64.of_int lp.id)
                   ; "block/order",
                     String (Db_order.gen_key None None) ] ]
           | _ -> [])
    in
    List.concat_map
      (fun (d : datom) ->
        let id = d.e in
        let page_tag_update =
          d.a = "block/tags"
          && (match page_tag, d.v with
              | Some pt, Ref i -> i = pt.id
              | Some pt, Int64 i -> Int64.equal i (Int64.of_int pt.id)
              | _ -> false)
        in
        let added_parent = d.a = "block/parent" && d.added in
        let move_to_library =
          added_parent
          && (match library_page, d.v with
              | Some lp, Ref i -> i = lp.id
              | Some lp, Int64 i -> Int64.equal i (Int64.of_int lp.id)
              | _ -> false)
        in
        (* A page moved under another page creates a namespace whose
           root page should be registered in Library. *)
        let move_under_page =
          added_parent && not move_to_library
          && (match d.v with
              | Int64 i ->
                  (match Datascript.Util.int64_to_int i with
                   | Some i -> (
                       match entity report.db_after (Entity_id i) with
                       | Some e -> Ldb.internal_page e
                       | None -> false)
                   | None -> false)
              | Ref i -> (
                  match entity report.db_after (Entity_id i) with
                  | Some e -> Ldb.internal_page e
                  | None -> false)
              | _ -> false)
        in
        if page_tag_update || move_to_library || move_under_page then
          let block_before = entity report.db_before (Entity_id id) in
          let block_after = entity report.db_after (Entity_id id) in
          let children_page_tx () =
            List.filter_map
              (fun child_id ->
                match
                  entity report.db_after (Entity_id child_id)
                with
                | Some child when not (Ldb.is_page child) ->
                    Some
                      (Block_map.to_tx_op db
                         [ "db/id", Int64 (Int64.of_int child_id)
                         ; "block/page", Int64 (Int64.of_int id) ])
                | _ -> None)
              (Ldb.get_block_full_children_ids report.db_after id)
          in
          match block_after with
          | None -> []
          | Some ba ->
              if move_to_library && not (Ldb.is_page ba) then
                (* move non-page block to Library *)
                Block_map.to_tx_op db
                  [ "db/id", Int64 (Int64.of_int id)
                  ; "block/name",
                    String
                      (Ldb.page_name_sanity_lc
                         (Ldb.string_value ba "block/title"
                          |> Option.value ~default:""))
                  ; "block/tags", Keyword "logseq.class/Page" ]
                :: retract_attr id "block/page"
                :: children_page_tx ()
              else if move_under_page && Ldb.internal_page ba then
                (* page moved under another page — register the
                   topmost namespace root in Library *)
                move_parent_to_library_tx (Ldb.ref_ent ba "block/parent")
              else if (not move_under_page) && d.added
                      && (match block_before with
                          | None -> true
                          | Some bb -> not (Ldb.is_page bb))
              then begin
                (* block->page *)
                let block_parent =
                  Ldb.ref_ent ba "block/parent"
                in
                let page_title =
                  match page_tag with
                  | Some pt ->
                      remove_inline_page_class_from_title ba pt
                  | None -> Ldb.string_value ba "block/raw-title"
                            |> Option.value ~default:""
                in
                let to_page_tx =
                  (Block_map.to_tx_op db
                     [ "db/id", Int64 (Int64.of_int id)
                     ; "block/name",
                       String (Ldb.page_name_sanity_lc page_title)
                     ; "block/title", String page_title ]
                   :: retract_attr id "block/page"
                   ::
                   (match block_parent with
                    | Some p
                      when Ldb.is_class p || Ldb.is_property p ->
                        [ retract_attr id "block/parent"
                        ; retract_attr id "block/order" ]
                    | _ -> []))
                in
                to_page_tx
                @ move_parent_to_library_tx block_parent
                @ children_page_tx ()
              end
              else if (not d.added)
                      && (match block_before with
                          | Some bb -> Ldb.internal_page bb
                          | None -> false)
              then begin
                (* page->block — cljs uses (:block/parent block-after) *)
                match Ldb.ref_ent ba "block/parent" with
                | Some parent ->
                    let rec find_parent_page (p : entity) =
                      if Ldb.is_page p then Some p
                      else
                        match Ldb.ref_ent p "block/parent" with
                        | Some pp -> find_parent_page pp
                        | None -> None
                    in
                    (match find_parent_page parent with
                     | Some pp ->
                         [ retract_attr id "block/name"
                         ; add id "block/page" (Int64 (Int64.of_int pp.id)) ]
                     | None -> [])
                | None -> []
              end
              else []
        else [])
      report.tx_data

(* ---------- add-missing-properties-to-typed-display-blocks ---------- *)

let node_display_type_classes =
  [ "logseq.class/Code-block"; "logseq.class/Math-block"
  ; "logseq.class/Quote-block" ]

let class_ident_by_display_type (v : value) : string option =
  match v with
  | Keyword "code" -> Some "logseq.class/Code-block"
  | Keyword "math" -> Some "logseq.class/Math-block"
  | Keyword "quote" -> Some "logseq.class/Quote-block"
  | _ -> None

let display_type_by_class_ident (ident : string) : string option =
  match ident with
  | "logseq.class/Code-block" -> Some "code"
  | "logseq.class/Math-block" -> Some "math"
  | "logseq.class/Quote-block" -> Some "quote"
  | _ -> None

let add_missing_properties_to_typed_display_blocks (db : db)
    (datoms : datom list) (tx_meta : tx_meta) : tx_op list =
  if rtc_tx_or_download_graph tx_meta then []
  else
    List.concat_map
      (fun (d : datom) ->
        if
          d.a = "logseq.property.node/display-type" && d.added
          && (match d.v with Keyword _ -> true | _ -> false)
        then
          match class_ident_by_display_type d.v with
          | Some tag -> [ add d.e "block/tags" (Keyword tag) ]
          | None -> []
        else if d.a = "block/tags"
                && (match ent_of_datom_v db d.v with
                    | Some ve ->
                        (match Ldb.ident_of ve with
                         | Some i ->
                             List.mem i node_display_type_classes
                         | None -> false)
                    | None -> false)
                && not d.added
        then [ retract_attr d.e "logseq.property.node/display-type" ]
        else if d.a = "block/tags"
                && (match ent_of_datom_v db d.v with
                    | Some ve ->
                        (match Ldb.ident_of ve with
                         | Some i ->
                             List.mem i node_display_type_classes
                         | None -> false)
                    | None -> false)
                && d.added
        then
          match ent_of_datom_v db d.v with
          | Some ve ->
              (match
                 Option.bind (Ldb.ident_of ve) display_type_by_class_ident
               with
               | Some display_type ->
                   let block = entity db (Entity_id d.e) in
                   let latest_code_lang =
                     Ldb.get_key_value db "logseq.kv/latest-code-lang"
                   in
                   [ Block_map.to_tx_op db
                       ([ "db/id", Int64 (Int64.of_int d.e)
                        ; "logseq.property.node/display-type",
                          Keyword display_type ]
                        @ (match display_type, block, latest_code_lang with
                           | "code", Some b, Some lang
                             when Ldb.value b
                                    "logseq.property.code/lang"
                                  = None ->
                               [ "logseq.property.code/lang", lang ]
                           | _ -> [])) ]
               | None -> [])
          | None -> []
        else [])
      datoms

(* ---------- ensure-query-property ---------- *)

let ensure_query_property_on_tag_additions (report : tx_report) : tx_op list =
  let db = report.db_after in
  let query_class = entity db (Ident "logseq.class/Query") in
  let query_property = entity db (Ident "logseq.property/query") in
  match query_class, query_property with
  | Some qc, Some qp
    when not
           (rtc_tx_or_download_graph report.tx_meta
            || flag report.tx_meta "undo?" || flag report.tx_meta "redo?") ->
      let tagged_block_ids =
        List.sort_uniq compare
          (List.filter_map
             (fun (d : datom) ->
               if d.a = "block/tags" && d.added then Some d.e else None)
             report.tx_data)
      in
      List.concat_map
        (fun eid ->
          match entity db (Entity_id eid) with
          | Some block when Db_class.class_instance qc block ->
              let query_entity =
                Ldb.ref_ent block "logseq.property/query"
              in
              (match
                 Option.bind query_entity
                   (fun qe -> Ldb.uuid_value qe "block/uuid")
               with
               | Some _ -> []
               | None ->
                   let query_text =
                     match Ldb.value block "logseq.property/query" with
                     | Some (String s) -> s
                     | _ -> ""
                   in
                   let value_block =
                     Db_property_build.build_property_value_block
                       ~block_uuid:(Common_uuid.new_block_id ())
                       (Block_map.of_entity block)
                       (Block_map.of_entity qp)
                       (String query_text)
                   in
                   let value_uuid =
                     match
                       Block_map.uuid_attr value_block "block/uuid"
                     with
                     | Some u -> u
                     | None -> Common_uuid.new_block_id ()
                   in
                   [ Block_map.to_tx_op db value_block
                   ; Block_map.to_tx_op db
                       (Outliner_core.block_with_updated_at
                          [ "db/id", Int64 (Int64.of_int block.id)
                          ; "logseq.property/query",
                            Ref_to
                              (Lookup_ref ("block/uuid", Uuid value_uuid)) ]) ])
          | _ -> [])
        tagged_block_ids
  | _ -> []

(* ---------- ensure-comments-blocks ---------- *)

let ensure_comments_blocks_property_on_tag_additions (report : tx_report)
    : tx_op list =
  let db = report.db_after in
  match entity db (Ident "logseq.class/Comments") with
  | Some comments_class
    when not
           (rtc_tx_or_download_graph report.tx_meta
            || flag report.tx_meta "undo?" || flag report.tx_meta "redo?") ->
      List.sort_uniq compare
        (List.filter_map
           (fun (d : datom) ->
             if d.a = "block/tags" && d.added
                && (match d.v with
                    | Ref i -> i = comments_class.id
                    | Int64 i -> Int64.equal i (Int64.of_int comments_class.id)
                    | _ -> false)
             then Some d.e
             else None)
           report.tx_data)
      |> List.filter_map
           (fun eid ->
             match entity db (Entity_id eid) with
             | Some block
               when Ldb.ref_ent block "block/parent" <> None
                    && Ldb.ref_ents block
                         "logseq.property.comments/blocks"
                       = [] ->
                 let parent =
                   match Ldb.ref_ent block "block/parent" with
                   | Some p -> p
                   | None -> assert false
                 in
                 Some
                   (Block_map.to_tx_op db
                      (Outliner_core.block_with_updated_at
                         [ "db/id", Int64 (Int64.of_int eid)
                         ; "logseq.property.comments/blocks",
                           Int64 (Int64.of_int parent.id) ]))
             | _ -> None)
  | _ -> []

(* ---------- created-by ---------- *)

let gen_created_by_block (claims : Worker_util.jwt_claims) : Block_map.t =
  let now = Date_time_util.time_ms () in
  [ "block/uuid", Uuid claims.sub
  ; "block/name",
    String (Option.value ~default:"" claims.username)
  ; "block/title",
    String (Option.value ~default:"" claims.username)
  ; "block/tags", Keyword "logseq.class/Page"
  ; "block/created-at", Common_util.value_of_ms now
  ; "block/updated-at", Common_util.value_of_ms now
  ; "logseq.property.user/name",
    String (Option.value ~default:"" claims.username)
  ; "logseq.property.user/email",
    String (Option.value ~default:"" claims.email) ]

let add_created_by_ref_hook (db_before : db) (db_after : db)
    (tx_data : datom list) (tx_meta : tx_meta) : tx_op list =
  if
    flag tx_meta "undo?" || flag tx_meta "redo?"
    || rtc_tx_or_download_graph tx_meta || tx_data = []
  then []
  else
    match Option.bind (Worker_util.get_id_token ()) Worker_util.parse_jwt
    with
    | None -> []
    | Some claims ->
        let created_by_ent =
          entity db_after (Lookup_ref ("block/uuid", Uuid claims.sub))
        in
        let created_by_ref : value =
          match created_by_ent with
          | Some e -> Int64 (Int64.of_int e.id)
          | None -> Ref_to (Temp_id "created-by-id")
        in
        let adds =
          List.filter_map
            (fun (d : datom) ->
              if d.a = "block/uuid" && d.added then
                match entity db_after (Entity_id d.e) with
                | Some e
                  when Ldb.value e
                         "logseq.property/created-by-ref"
                       = None ->
                    Some
                      (add d.e "logseq.property/created-by-ref"
                         created_by_ref)
                | _ -> None
              else if d.a = "block/title"
                      && (match d.v with
                          | String s -> Unicode.trim s <> ""
                          | _ -> false)
                      && (match
                            entity db_before (Entity_id d.e)
                          with
                          | Some old ->
                              (match
                                 Ldb.string_value old "block/title"
                               with
                               | Some t -> Unicode.trim t = ""
                               | None -> false)
                          | None -> false)
              then
                (match entity db_after (Entity_id d.e) with
                 | Some _ ->
                     Some
                       (add d.e "logseq.property/created-by-ref"
                          created_by_ref)
                 | None -> None)
              else None)
            tx_data
        in
        (match created_by_ent with
         | None ->
             Block_map.to_tx_op db_after
               (("db/id", Ref_to (Temp_id "created-by-id"))
                :: gen_created_by_block claims)
             :: adds
         | Some _ -> adds)

(* ---------- revert-disallowed-changes ---------- *)

let revert_disallowed_changes (report : tx_report) : tx_op list =
  let tx_meta = report.tx_meta in
  if rtc_tx_or_download_graph tx_meta || flag tx_meta "fix-db?" then []
  else
    let db_after = report.db_after and db_before = report.db_before in
    let built_in_page (id : entity_id) : bool =
      match entity db_after (Entity_id id) with
      | Some block ->
          (match Ldb.string_value block "block/title" with
           | Some t -> List.mem t Ldb.built_in_pages_names
           | None -> false)
          && Ldb.built_in block
      | None -> false
    in
    let protected_attrs =
      [ "db/ident"; "block/title"; "block/name"; "block/uuid"
      ; "logseq.property/type"; "db/cardinality"
      ; "logseq.property/built-in?"; "logseq.property.class/extends" ]
    in
    (* cljs (distinct tx-data') — first-occurrence order preserved *)
    Common_util.distinct_by Fun.id
      (List.concat_map
         (fun (d : datom) ->
           if not d.added then []
           else if d.a = "block/tags" && (match d.v with
                                          | Ref i -> built_in_page i
                                          | Int64 i -> (
                                              match Datascript.Util.int64_to_int i with
                                              | Some i -> built_in_page i
                                              | None -> false)
                                          | _ -> false)
           then
             (match d.v with
              | Int64 v -> (
                  match Datascript.Util.int64_to_int v with
                  | Some v ->
                      [ retract_attr v "db/ident"
                      ; retract_attr v "logseq.property.class/extends"
                      ; retract v "block/tags"
                          (Keyword "logseq.class/Tag") ]
                  | None -> [])
              | Ref v ->
                  [ retract_attr v "db/ident"
                  ; retract_attr v "logseq.property.class/extends"
                  ; retract v "block/tags"
                      (Keyword "logseq.class/Tag")
                  ; add v "block/tags" (Keyword "logseq.class/Page")
                  ; retract d.e d.a d.v ]
              | _ -> [])
           else if
             List.mem d.a protected_attrs
             && entity db_before (Entity_id d.e) <> None
             && (match
                   entity db_after (Entity_id d.e),
                   entity db_before (Entity_id d.e)
                 with
                 | Some after, Some before ->
                     (* cljs (not= (get block a) (get before a)) — compares
                        the whole value set, not first values *)
                     let sorted_values (e : entity) =
                       List.sort Util.compare_value (Ldb.values e d.a)
                     in
                     Ldb.built_in after
                     && sorted_values after <> sorted_values before
                 | _ -> false)
           then
             (match entity db_before (Entity_id d.e) with
              | Some before ->
                  (match Ldb.values before d.a with
                   | prev_v :: _ when d.a <> "logseq.property.class/extends" ->
                       [ add d.e d.a prev_v ]
                   | (_ :: _) as prev_vs ->
                       (* cljs {e a (map :db/id prev-v)} — restores the
                          whole extends set *)
                       retract_attr d.e d.a
                       :: [ Block_map.to_tx_op db_after
                              [ "db/id", Int64 (Int64.of_int d.e); d.a, Set prev_vs ] ]
                   | [] -> [ retract d.e d.a d.v ])
              | None -> [])
           else if
             d.a = "logseq.property.class/extends"
             && (match ent_of_datom_v db_after d.v with
                 | Some block ->
                     Ldb.built_in block
                     && (match Ldb.ident_of block with
                         | Some i ->
                             not
                               (List.mem i
                                  [ "logseq.class/Root"
                                  ; "logseq.class/Page"
                                  ; "logseq.class/Property"
                                  ; "logseq.class/Task"
                                  ; "logseq.class/Card" ])
                         | None -> false)
                 | None -> false)
           then
             retract d.e d.a d.v
             :: (match entity db_before (Entity_id d.e) with
                 | Some before ->
                     (match Ldb.values before d.a with
                      | (_ :: _) as prev_vs ->
                          (* cljs {e a (map :db/id prev-v)} *)
                          [ Block_map.to_tx_op db_after
                              [ "db/id", Int64 (Int64.of_int d.e)
                              ; d.a, Set prev_vs ] ]
                      | [] ->
                          [ add d.e d.a
                              (Keyword "logseq.class/Root") ])
                 | None ->
                     [ add d.e d.a (Keyword "logseq.class/Root") ])
           else [])
         report.tx_data)

(* ---------- ensure-journal-page-protected-attrs ---------- *)

exception Journal_protected_attr_updated of (attr * value option * value * int option)

let ensure_journal_page_protected_attrs_not_updated (report : tx_report)
    : unit =
  List.iter
    (fun (d : datom) ->
      if d.added && (d.a = "block/title" || d.a = "block/name") then
        match entity report.db_before (Entity_id d.e) with
        | Some before when Ldb.is_journal before ->
            (match Ldb.value before d.a with
             | Some bv when bv <> d.v ->
                 raise
                   (Journal_protected_attr_updated
                      (d.a, Some bv, d.v,
                       Ldb.int_value before "block/journal-day"))
             | _ -> ())
        | _ -> ())
    report.tx_data

(* ---------- compute-extra-tx-data ---------- *)

let compute_extra_tx_data (report : tx_report) : tx_op list =
  let db = report.db_after in
  let tx_meta = report.tx_meta in
  let revert_tx_data = revert_disallowed_changes report in
  let fix_page_tags_tx_data = fix_page_tags report in
  let fix_inline_page_tx_data = fix_inline_built_in_page_classes report in
  let toggle_page_and_block_tx_data =
    if fix_inline_page_tx_data = [] then
      toggle_page_and_block db report
    else []
  in
  let display_blocks_tx_data =
    add_missing_properties_to_typed_display_blocks db report.tx_data
      tx_meta
  in
  let ensure_query_tx_data =
    ensure_query_property_on_tag_additions report
  in
  let ensure_comments_tx_data =
    ensure_comments_blocks_property_on_tag_additions report
  in
  let commands_tx =
    if flag tx_meta "undo?" || outliner_op tx_meta = Some "rebase"
       || rtc_tx_or_download_graph tx_meta
    then []
    else Commands.run_commands report.db_after report.tx_data
  in
  let before_template_tx_data =
    revert_tx_data @ toggle_page_and_block_tx_data
    @ display_blocks_tx_data @ ensure_query_tx_data
    @ ensure_comments_tx_data @ commands_tx
  in
  let template_result =
    if before_template_tx_data <> [] then
      Some (Db_tx.with_report ~tx_meta db before_template_tx_data)
    else None
  in
  let template_db =
    match template_result with
    | Some r -> r.db_after
    | None -> db
  in
  let insert_templates_tx =
    if rtc_tx_or_download_graph tx_meta then []
    else
      insert_tag_templates
        { report with
          db_after = template_db
        ; tx_data =
            (match template_result with
             | Some r -> report.tx_data @ r.tx_data
             | None -> report.tx_data) }
  in
  let created_by_tx =
    add_created_by_ref_hook report.db_before report.db_after
      report.tx_data tx_meta
  in
  before_template_tx_data @ insert_templates_tx @ created_by_tx
  @ fix_page_tags_tx_data @ fix_inline_page_tx_data

(* ---------- projected reference datoms ---------- *)

let projected_reference_content_datom (d : datom) : bool =
  d.a <> "block/tx-id" && d.a <> "block/updated-at"

let reference_attr_definition_attrs =
  [ "db/ident"; "db/valueType"; "block/tags"
  ; "logseq.property/public?" ]

(* cljs reference-attrs *)
let reference_attrs (db : db) : string list =
  let property_class_id =
    match entity db (Ident "logseq.class/Property") with
    | Some e -> Some e.id
    | None -> None
  in
  let private_property_ids =
    List.map (fun (d : datom) -> d.e)
      (List.of_seq
         (datoms db Avet ~a:"logseq.property/public?" ~v:(Bool false) ()))
  in
  let tag_datoms =
    match property_class_id with
    | Some pid ->
        List.of_seq (datoms db Avet ~a:"block/tags" ~v:(Ref pid) ())
    | None -> []
  in
  "block/refs"
  :: List.filter_map
       (fun (d : datom) ->
         let property_id = d.e in
         match
           Seq.uncons (datoms db Eavt ~e:property_id ~a:"db/ident" ())
         with
         | Some (ident_d, _) ->
             (match ident_d.v with
              | Keyword ident
                when not (List.mem property_id private_property_ids) ->
                  (match
                     Schema.schema_attr_by_name (schema db) ident
                   with
                   | Some sa when sa.value_type = Some RefType ->
                       Some ident
                   | _ -> None)
              | _ -> None)
         | None -> None)
       tag_datoms

(* cljs js/WeakMap keyed on db identity — a WeakMap entry dies with its
   db value. A bounded fifo approximates that here: only the most recent
   dbs stay cached so stale immutable dbs are not pinned forever. *)
let reference_attrs_cache_max = 8

let reference_attrs_cache : (db * string list) list ref = ref []

let cache_push (db : db) (attrs : string list) : unit =
  let rec take n l =
    match n, l with
    | 0, _ -> []
    | _, [] -> []
    | n, x :: tl -> x :: take (n - 1) tl
  in
  reference_attrs_cache :=
    (db, attrs) :: take (reference_attrs_cache_max - 1) !reference_attrs_cache

let reference_attrs_cached (db : db) : string list =
  match List.find_opt (fun (d, _) -> d == db) !reference_attrs_cache with
  | Some (_, attrs) -> attrs
  | None ->
    let attrs = reference_attrs db in
    cache_push db attrs;
    attrs

let reference_owner_ids_at (db : db) (attrs : string list)
    (target_id : entity_id) : entity_id list =
  List.concat_map
    (fun attr ->
      List.map (fun (d : datom) -> d.e)
        (List.of_seq (datoms db Avet ~a:attr ~v:(Ref target_id) ())))
    attrs

let projected_reference_owner_ids (report : tx_report) : entity_id list =
  let db_before = report.db_before and db_after = report.db_after in
  let reference_attrs_changed =
    List.exists
      (fun (d : datom) -> List.mem d.a reference_attr_definition_attrs)
      report.tx_data
  in
  let target_ids =
    List.sort_uniq compare
      (List.filter_map
         (fun (d : datom) ->
           if projected_reference_content_datom d
              && entity db_before (Entity_id d.e) <> None
           then Some d.e
           else None)
         report.tx_data)
  in
  if target_ids = [] then begin
    (if not reference_attrs_changed then
       match List.find_opt (fun (d, _) -> d == db_before)
              !reference_attrs_cache with
       | Some (_, attrs) -> cache_push db_after attrs
       | None -> ());
    []
  end else begin
    let before_reference_attrs =
      match List.find_opt (fun (d, _) -> d == db_before)
             !reference_attrs_cache with
      | Some (_, a) -> a
      | None -> reference_attrs db_before
    in
    let after_reference_attrs =
      match List.find_opt (fun (d, _) -> d == db_after)
             !reference_attrs_cache with
      | Some (_, a) -> a
      | None ->
          if reference_attrs_changed then reference_attrs db_after
          else before_reference_attrs
    in
    cache_push db_after after_reference_attrs;
    cache_push db_before before_reference_attrs;
    List.sort_uniq compare
      (List.concat_map
         (fun target_id ->
           reference_owner_ids_at db_before before_reference_attrs
             target_id
           @ reference_owner_ids_at db_after after_reference_attrs
               target_id
           @ List.filter_map
               (fun db ->
                 match entity db (Entity_id target_id) with
                 | Some e ->
                     (match Ldb.value e "block/closed-value-property" with
                      | Some _ -> Some target_id
                      | None -> None)
                 | None -> None)
               [ db_before; db_after ])
         target_ids)
  end

let revision_owner_ids (report : tx_report) : entity_id list =
  let revision_datom (d : datom) : bool =
    if flag report.tx_meta "fix-db?" then d.a <> "block/tx-id"
    else projected_reference_content_datom d
  in
  List.sort_uniq compare
    (projected_reference_owner_ids report
     @ List.filter_map
         (fun (d : datom) -> if revision_datom d then Some d.e else None)
         report.tx_data)

(* ---------- transact-pipeline ---------- *)

let transact_pipeline (tx_report : tx_report) : tx_report =
  let tx_meta = tx_report.tx_meta in
  let derive_extra_data =
    not
      (flag tx_meta "sync-download-graph?" || flag tx_meta "reverse?"
       || flag tx_meta "transact-remote?" || imported_data tx_meta)
  in
  if derive_extra_data && not (rtc_tx_or_download_graph tx_meta) then
    ensure_journal_page_protected_attrs_not_updated tx_report;
  let extra_tx_data =
    if derive_extra_data then compute_extra_tx_data tx_report else []
  in
  let tx_report' =
    if extra_tx_data <> [] then
      let result =
        Db_tx.with_report ~tx_meta tx_report.db_after extra_tx_data
      in
      { tx_report with
        tx_data = tx_report.tx_data @ result.tx_data
      ; db_after = result.db_after }
    else tx_report
  in
  let blocks, _pages = Ds_report.get_blocks_and_pages tx_report' in
  let deleted_blocks =
    Outliner_pipeline.filter_deleted_blocks tx_report'.tx_data
  in
  let deleted_block_ids = List.map fst deleted_blocks in
  let surviving_blocks =
    List.filter
      (fun (b : entity) -> not (List.mem b.id deleted_block_ids))
      blocks
  in
  let block_refs =
    if (derive_extra_data || imported_data tx_meta)
       && surviving_blocks <> []
    then rebuild_block_refs tx_report' surviving_blocks
    else []
  in
  let revision_ids = revision_owner_ids tx_report' in
  let tx_id_data =
    let db_after = tx_report'.db_after in
    let tx_id = db_after.max_tx + 1 in
    List.filter_map
      (fun db_id ->
        if
          not (List.mem db_id deleted_block_ids)
          && (match entity db_after (Entity_id db_id) with
              | Some e -> Ldb.value e "block/uuid" <> None
              | None -> false)
        then
          Some
            (Block_map.to_tx_op db_after
               [ "db/id", Int64 (Int64.of_int db_id); "block/tx-id", Int64 (Int64.of_int tx_id) ])
        else None)
      revision_ids
  in
  let block_refs_tx_id_data = block_refs @ tx_id_data in
  let replace_tx_report =
    if block_refs_tx_id_data <> [] then
      Some
        (Db_tx.with_report ~tx_meta tx_report'.db_after
           block_refs_tx_id_data)
    else None
  in
  let tx_report'' =
    match replace_tx_report with
    | Some r -> r
    | None -> tx_report'
  in
  (* cljs moves the reference-attrs cache entry across db objects *)
  (match List.find_opt (fun (d, _) -> d == tx_report'.db_after)
           !reference_attrs_cache with
   | Some (_, attrs) ->
       reference_attrs_cache :=
         (tx_report''.db_after, attrs) :: !reference_attrs_cache
   | None -> ());
  let full_tx_data =
    tx_report'.tx_data
    @ (match replace_tx_report with
       | Some r -> r.tx_data
       | None -> [])
  in
  { tx_report'' with
    tx_data = full_tx_data
  ; tx_meta
  ; db_before = tx_report.db_before
  }

(* ---------- invoke-hooks (db_listener's post-commit surface) ---------- *)

(* cljs {:tx-report :affected-keys :deleted-block-uuids :deleted-assets
   :pages :blocks} — deleted_block_uuids holds uuid strings,
   deleted_assets the cljs {:block/uuid :ext} maps as wire. *)
type invoke_hooks_result =
  { hooks_tx_report : tx_report
  ; hooks_affected_keys : Wire.t list
  ; hooks_deleted_block_uuids : string list
  ; hooks_deleted_assets : Wire.t list
  ; hooks_pages : entity list
  ; hooks_blocks : entity list }

(* cljs pipeline/invoke-hooks-default — console.error + rethrow *)
let invoke_hooks (_conn : conn) (tx_report : tx_report)
    : invoke_hooks_result =
  try
    let blocks, pages = Ds_report.get_blocks_and_pages tx_report in
    let deleted_blocks =
      Outliner_pipeline.filter_deleted_blocks tx_report.tx_data
    in
    let deleted_block_uuids =
      List.map snd deleted_blocks |> Sync_state.distinct_by Fun.id
    in
    let deleted_block_ids =
      List.map fst deleted_blocks |> Sync_state.distinct_by Fun.id
    in
    (* cljs (swap! *deleted-block-uuid->db-id merge ...) *)
    List.iter
      (fun (db_id, uuid) ->
         Hashtbl.replace (Worker_state.deleted_block_uuid_to_db_id ())
           uuid db_id)
      deleted_blocks;
    let deleted_assets =
      List.filter_map
        (fun id ->
           match entity tx_report.db_before (Entity_id id) with
           | Some e when Ldb.asset e ->
               Some
                 (Wire.Map
                    [ ( Wire.Keyword "block/uuid"
                      , (match Ldb.value e "block/uuid" with
                         | Some v -> Ds_wire.transit_of_value v
                         | None -> Wire.Nil) )
                    ; ( Wire.Keyword "ext"
                      , (match Ldb.value e "logseq.property.asset/type" with
                         | Some v -> Ds_wire.transit_of_value v
                         | None -> Wire.Nil) ) ])
           | _ -> None)
        deleted_block_ids
    in
    let affected_keys = Render_affected_keys.affected_keys tx_report in
    { hooks_tx_report = tx_report
    ; hooks_affected_keys = affected_keys
    ; hooks_deleted_block_uuids = deleted_block_uuids
    ; hooks_deleted_assets = deleted_assets
    ; hooks_pages = pages
    ; hooks_blocks = blocks }
  with e ->
    Worker_log.error "worker-pipeline/invoke-hooks-failed"
      [ ("error", Printexc.to_string e) ];
    raise e

(* ---------- wiring ---------- *)

let () =
  Db_tx.transact_pipeline_fn := Some transact_pipeline
