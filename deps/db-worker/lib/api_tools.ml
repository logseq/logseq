(* logseq.api.db-based/tools.cljs build-upsert-nodes-edn — LLM upsert
   operations -> import EDN (+ validation).

   The malli Upsert-nodes-operations-schema is replaced by explicit
   checks with the same fail-fast semantics. *)

open Datascript

let kw s = Wire.Keyword s

exception Api_error = Dispatcher.Exn_info

let fail_api message data = raise (Dispatcher.Exn_info (message, data))

(* --- wire accessors for the operation maps --- *)

let field (m : Wire.t) (k : string) : Wire.t option = Wire.get k m

let field_str m k =
  match field m k with
  | Some (Wire.String s) -> Some s
  | _ -> None

let field_str_list m k : string list =
  match field m k with
  | Some (Wire.Array xs | Wire.List xs | Wire.Set xs) ->
      List.filter_map (function Wire.String s -> Some s | _ -> None) xs
  | _ -> []

let data_of (op : Wire.t) : Wire.t =
  match field op "data" with
  | Some (Wire.Map _ as d) -> d
  | _ -> Wire.Map []

let data_str op k = field_str (data_of op) k
let data_str_list op k = field_str_list (data_of op) k

let entity_type op = Option.value (field_str op "entityType") ~default:""
let operation op = Option.value (field_str op "operation") ~default:""

(* --- schema checks (malli Upsert-nodes-operations-schema) --- *)

let uuid_string s = Ldb.is_uuid_string s

let validate_uuid_list field_name (xs : string list) =
  List.iter
    (fun s ->
       if not (uuid_string s) then
         fail_api
           (Printf.sprintf
              "Tool arguments are invalid:\n%s must be a uuid string"
              field_name)
           [ (kw "errors", Wire.String field_name) ])
    xs

let validate_operation (op : Wire.t) =
  let et = entity_type op and oper = operation op in
  let invalid msg =
    fail_api (Printf.sprintf "Tool arguments are invalid:\n%s" msg)
      [ (kw "errors", Wire.String msg) ]
  in
  if not (List.mem oper [ "add"; "edit" ]) then
    invalid "operation must be \"add\" or \"edit\"";
  if not (List.mem et [ "block"; "page"; "tag"; "property" ]) then
    invalid "entityType must be one of block, page, tag, property";
  (match oper, et with
   | "add", "block" ->
       if data_str op "title" = None then
         invalid "add block requires data.title";
       if data_str op "page-id" = None then
         invalid "add block requires data.page-id"
   | "add", ("page" | "tag" | "property") ->
       if data_str op "title" = None then
         invalid (Printf.sprintf "add %s requires data.title" et)
   | "edit", "block" -> (
       match field_str op "id" with
       | Some id when uuid_string id -> ()
       | _ -> invalid "edit block requires a uuid-string id")
   | "edit", _ -> (
       match field_str op "id" with
       | Some id when uuid_string id -> ()
       | _ -> invalid "edit requires a uuid-string id")
   | _ -> ());
  validate_uuid_list "data.tags" (data_str_list op "tags")

(* --- ident construction --- *)

type op_idents =
  { property_idents : (string * string) list
  ; class_idents : (string * string) list
  ; existing_classes : string list (* idents already in db *)
  ; existing_properties : (string * Wire.t) list (* ident -> {cardinality,type} *)
  }

let get_ident idents title =
  match List.assoc_opt title idents with
  | Some i -> i
  | None -> fail_api ("No ident found for " ^ title) []

let get_ident_w idents title = Wire.String (get_ident idents title)

let operations_idents (db : db) (operations : Wire.t list) : op_idents =
  let existing_classes = ref [] in
  let existing_properties = ref [] in
  let property_titles =
    List.filter_map
      (fun op ->
        if entity_type op = "property" && operation op = "add" then
          data_str op "title"
        else None)
      operations
    @ List.concat_map
        (fun op ->
          if entity_type op = "tag" && operation op = "add" then
            data_str_list op "class-properties"
          else [])
        operations
  in
  let property_titles = List.sort_uniq String.compare property_titles in
  let property_idents =
    List.map
      (fun title ->
        if uuid_string title then (
          let ent = entity db (Lookup_ref ("block/uuid", Uuid title)) in
          let ident =
            match ent with Some e -> Ldb.ident_of e | None -> None
          in
          (match ent with
           | Some e when not (Ldb.is_property e) ->
               fail_api
                 (Printf.sprintf "%s is not a property and can't be used as one"
                    (Option.value
                       (Option.bind ent (fun e -> Ldb.string_value e "block/title"))
                       ~default:title))
                 []
           | _ -> ());
          (match ent, ident with
           | Some e, Some id ->
               let card =
                 match Ldb.value e "db/cardinality" with
                 | Some v -> [ (kw "db/cardinality", Ds_wire.transit_of_value v) ]
                 | None -> []
               and ty =
                 match Ldb.value e "logseq.property/type" with
                 | Some v -> [ (kw "logseq.property/type", Ds_wire.transit_of_value v) ]
                 | None -> []
               in
               existing_properties := (id, Wire.Map (card @ ty)) :: !existing_properties
           | _ -> ());
          (title, Option.value ident ~default:title))
        else
          ( title
          , Db_ident.create_user_property_ident_from_name ~user_namespace:"user.property"
              title ))
      property_titles
  in
  let class_titles =
    List.concat_map
      (fun op ->
        if entity_type op = "tag" && operation op = "add" then
          Option.to_list (data_str op "title") @ data_str_list op "class-extends"
        else [])
      operations
    @ List.concat_map
        (fun op ->
          if entity_type op = "property" && operation op = "add" then
            data_str_list op "property-classes"
          else [])
      operations
    @ List.concat_map
        (fun op ->
          if entity_type op = "block" && operation op = "add" then
            data_str_list op "tags"
          else [])
      operations
  in
  let class_titles = List.sort_uniq String.compare class_titles in
  let class_idents =
    List.map
      (fun title ->
        if uuid_string title then (
          let ent = entity db (Lookup_ref ("block/uuid", Uuid title)) in
          let ident =
            match ent with Some e -> Ldb.ident_of e | None -> None
          in
          (match ent with
           | Some e when not (Ldb.is_class e) ->
               fail_api
                 (Printf.sprintf "%s is not a tag and can't be used as one"
                    (Option.value
                       (Option.bind ent (fun e -> Ldb.string_value e "block/title"))
                       ~default:title))
                 []
           | _ -> ());
          (match ident with
           | Some id -> existing_classes := id :: !existing_classes
           | None -> ());
          (title, Option.value ident ~default:title))
        else
          ( title
          , Db_ident.create_user_class_ident_from_name ~db title ))
      class_titles
  in
  { property_idents
  ; class_idents
  ; existing_classes = !existing_classes
  ; existing_properties = !existing_properties
  }

(* --- op -> import-edn fragments --- *)

let build_add_block (op : Wire.t) (idents : op_idents) : Wire.t =
  let base = [ (kw "block/title", Wire.String (Option.value (data_str op "title") ~default:"")) ] in
  match data_str_list op "tags" with
  | [] -> Wire.Map base
  | tags ->
      Wire.Map
        ( base
        @ [ ( kw "build/tags"
            , Wire.Array (List.map (get_ident_w idents.class_idents) tags) ) ] )

let ops_new_page_ids (operations : Wire.t list) : (string, unit) Hashtbl.t =
  (* Local :id's of pages added in the same call *)
  let ids = Hashtbl.create 8 in
  List.iter
    (fun op ->
      if entity_type op = "page" && operation op = "add" then
        match field_str op "id" with
        | Some id -> Hashtbl.replace ids id ()
        | None -> ())
    operations;
  ids

let assert_add_block_page_ids (db : db) (operations : Wire.t list) : unit =
  (* page-id must be the :id of a page added in the same call or the uuid of
     an existing page. A page name is not resolved and would otherwise be
     silently dropped. *)
  let new_page_ids = ops_new_page_ids operations in
  List.iter
    (fun op ->
      if entity_type op = "block" && operation op = "add" then
        match data_str op "page-id" with
        | Some page_id ->
            if not (Hashtbl.mem new_page_ids page_id) then (
              if not (uuid_string page_id) then
                fail_api
                  (Printf.sprintf
                     "Block page-id %S must be a page uuid or the id of a page added in the same call"
                     page_id)
                  [ (kw "page-id", Wire.String page_id) ];
              match entity db (Lookup_ref ("block/uuid", Uuid page_id)) with
              | Some ent when Entity_util.page ent -> ()
              | _ ->
                  fail_api
                    (Printf.sprintf "Block page-id %S is not an existing page"
                       page_id)
                    [ (kw "page-id", Wire.String page_id) ])
        | None -> ())
    operations

let ops_existing_pages_and_blocks (db : db) (operations : Wire.t list)
    (idents : op_idents) : Wire.t list =
  let new_page_ids = ops_new_page_ids operations in
  (* (page-uuid-str, op) pairs for blocks on existing pages *)
  let pairs =
    List.filter_map
      (fun op ->
        if entity_type op = "block" && operation op = "add" then
          match data_str op "page-id" with
          | Some pid when (not (Hashtbl.mem new_page_ids pid)) && uuid_string pid
            -> Some (pid, op)
          | _ -> None
        else if entity_type op = "block" && operation op = "edit" then
          match field_str op "id" with
          | Some id ->
              let block_uuid = id in
              (match entity db (Lookup_ref ("block/uuid", Uuid block_uuid)) with
               | Some ent -> (
                   match Ldb.ref_ent ent "block/page" with
                   | Some page -> (
                       match Ldb.value page "block/uuid" with
                       | Some (Uuid u) -> Some (u, op)
                       | _ -> None)
                   | None ->
                       fail_api
                         "Block edit operation requires a block to have a page."
                         [])
               | None ->
                   fail_api
                     "Block edit operation requires a block to have a page."
                     [])
          | None -> None
        else None)
      operations
  in
  (* group-by page-id preserving op order *)
  let page_ids = List.sort_uniq String.compare (List.map fst pairs) in
  List.map
    (fun pid ->
      let ops =
        List.filter_map (fun (p, op) -> if p = pid then Some op else None) pairs
      in
      Wire.Map
        [ (kw "page", Wire.Map [ (kw "block/uuid", Wire.Uuid pid) ])
        ; ( kw "blocks"
          , Wire.Array
              (List.map
                 (fun op ->
                   if operation op = "add" then build_add_block op idents
                   else
                     let base =
                       [ ( kw "block/uuid"
                         , Wire.Uuid (Option.value (field_str op "id") ~default:"") ) ]
                     in
                     match data_str op "title" with
                     | Some t -> Wire.Map (base @ [ (kw "block/title", Wire.String t) ])
                     | None -> Wire.Map base)
                 ops) ) ])
    page_ids

let ops_pages_and_blocks (db : db) (operations : Wire.t list)
    (idents : op_idents) : Wire.t list =
  let new_blocks_by_page =
    List.filter_map
      (fun op ->
        if entity_type op = "block" && operation op = "add" then
          match data_str op "page-id" with
          | Some pid -> Some (pid, op)
          | None -> None
        else None)
      operations
  in
  let new_pages =
    List.filter
      (fun op -> entity_type op = "page" && operation op = "add")
      operations
  in
  List.map
    (fun op ->
      let title = Option.value (data_str op "title") ~default:"" in
      let page_entry =
        match
          Date_time_util.journal_title_to_int
            ~formatters:(Date_time_util.safe_journal_title_formatters None)
            title
        with
        | Some journal_day ->
            (kw "page", Wire.Map [ (kw "build/journal", Wire.Int journal_day) ])
        | None -> (kw "page", Wire.Map [ (kw "block/title", Wire.String title) ])
      in
      let op_id = field_str op "id" in
      let blocks =
        match op_id with
        | Some id ->
            List.filter_map
              (fun (pid, bop) -> if pid = id then Some (build_add_block bop idents) else None)
              new_blocks_by_page
        | None -> []
      in
      match blocks with
      | [] -> Wire.Map [ page_entry ]
      | _ -> Wire.Map [ page_entry; (kw "blocks", Wire.Array blocks) ])
    new_pages
  @ ops_existing_pages_and_blocks db operations idents

let ops_classes (operations : Wire.t list) (idents : op_idents)
    : (Wire.t * Wire.t) list =
  let new_classes =
    List.filter
      (fun op -> entity_type op = "tag" && operation op = "add")
      operations
  in
  let existing =
    List.filter_map
      (fun (title, ident) ->
        if List.mem ident idents.existing_classes then None
        else Some (Wire.String ident, Wire.Map [ (kw "block/title", Wire.String title) ]))
      idents.class_idents
  in
  let fresh =
    List.map
      (fun op ->
        let title = Option.value (data_str op "title") ~default:"" in
        let entries = ref [ (kw "block/title", Wire.String title) ] in
        (match data_str_list op "class-extends" with
         | [] -> ()
         | xs ->
             entries :=
               !entries
               @ [ ( kw "build/class-extends"
                   , Wire.Array (List.map (get_ident_w idents.class_idents) xs) ) ]);
        (match data_str_list op "class-properties" with
         | [] -> ()
         | xs ->
             entries :=
               !entries
               @ [ ( kw "build/class-properties"
                   , Wire.Array (List.map (get_ident_w idents.property_idents) xs) ) ]);
        (get_ident_w idents.class_idents title, Wire.Map !entries))
      new_classes
  in
  existing @ fresh

let user_built_in_property_types =
  [ "default"; "number"; "date"; "datetime"; "checkbox"; "url"; "node"; "asset" ]

let ops_properties (operations : Wire.t list) (idents : op_idents)
    : (Wire.t * Wire.t) list =
  let new_properties =
    List.filter
      (fun op -> entity_type op = "property" && operation op = "add")
      operations
  in
  let fresh =
    List.map
      (fun op ->
        let title = Option.value (data_str op "title") ~default:"" in
        let entries = ref [ (kw "block/title", Wire.String title) ] in
        (match data_str op "property-type" with
         | Some pt when List.mem pt user_built_in_property_types ->
             entries := !entries @ [ (kw "logseq.property/type", kw pt) ]
         | _ -> ());
        (match data_str op "property-cardinality" with
         | Some "many" ->
             entries := !entries @ [ (kw "db/cardinality", kw "db.cardinality/many") ]
         | _ -> ());
        (match data_str_list op "property-classes" with
         | [] -> ()
         | xs ->
             entries :=
               !entries
               @ [ ( kw "build/property-classes"
                   , Wire.Array (List.map (get_ident_w idents.class_idents) xs) )
                 ; (kw "logseq.property/type", kw "node") ]);
        (get_ident_w idents.property_idents title, Wire.Map !entries))
      new_properties
  in
  List.map (fun (id, m) -> (Wire.String id, m)) idents.existing_properties
  @ fresh

(* --- validate-import-edn --- *)

let wire_map_entries = function Wire.Map kvs -> kvs | _ -> []

let map_title (m : Wire.t) : string option =
  match Wire.get "block/title" m with
  | Some (Wire.String s) -> Some s
  | _ -> None

let entity_type_name = function
  | "property" -> "Property"
  | "tag" -> "Tag"
  | _ -> "Page"

let validate_one etype title (m : Wire.t) =
  (* cljs wraps validator ex-info into "<Entity-type> \"title\" is
     invalid: <msg>" *)
  let wrap f =
    try f ()
    with
    | Outliner_validate.Notification w ->
        let msg =
          match Wire.get "message" w with
          | Some (Wire.String s) -> s
          | _ -> "validation failed"
        in
        fail_api
          (Printf.sprintf "%s %s is invalid: %s" (entity_type_name etype)
             (Printf.sprintf "%S" title) msg)
          [ (kw "entity-type", kw etype)
          ; (kw "title", Wire.String title)
          ; (kw "entity-map", m) ]
    | Api_error (msg, data) ->
        fail_api
          (Printf.sprintf "%s %s is invalid: %s" (entity_type_name etype)
             (Printf.sprintf "%S" title) msg)
          data
  in
  (match etype with
   | "property" ->
       wrap (fun () -> Outliner_validate.validate_property_title title)
   | _ -> ());
  wrap (fun () -> Outliner_validate.validate_page_title_characters title);
  wrap (fun () -> Outliner_validate.validate_page_title title)

let validate_import_edn (import_edn : Wire.t) : unit =
  let properties =
    match Wire.get "properties" import_edn with
    | Some (Wire.Map kvs) -> List.map snd kvs
    | _ -> []
  and classes =
    match Wire.get "classes" import_edn with
    | Some (Wire.Map kvs) -> List.map snd kvs
    | _ -> []
  and pages =
    match Wire.get "pages-and-blocks" import_edn with
    | Some (Wire.Array xs | Wire.List xs) ->
        List.filter_map
          (fun item -> match Wire.get "page" item with Some p -> Some p | None -> None)
          xs
    | _ -> []
  in
  List.iter
    (fun m ->
      match map_title m with
      | Some title -> validate_one "property" title m
      | None -> ())
    (List.filter (fun m -> map_title m <> None) properties);
  List.iter
    (fun m ->
      match map_title m with
      | Some title -> validate_one "tag" title m
      | None -> ())
    classes;
  List.iter
    (fun m ->
      match map_title m with
      | Some title -> validate_one "page" title m
      | None -> ())
    pages

(* --- build-upsert-nodes-edn --- *)

let build_upsert_nodes_edn (db : db) (operations : Wire.t list) : Wire.t =
  List.iter
    (fun op ->
      if
        List.mem (entity_type op) [ "page"; "tag"; "property" ]
        && operation op = "edit"
      then
        fail_api "Editing a page, tag or property isn't supported yet" [])
    operations;
  (* normalize tag titles from :data :name *)
  let operations =
    List.map
      (fun op ->
        if entity_type op = "tag" && operation op = "add" then
          match data_str op "title" with
          | Some _ -> op
          | None -> (
              match data_str op "name" with
              | Some name ->
                  let d = data_of op in
                  let d' =
                    Wire.Map
                      (wire_map_entries d @ [ (kw "title", Wire.String name) ])
                  in
                  Wire.Map
                    (List.map
                       (fun (k, v) ->
                         if Wire.key_matches "data" k then (k, d') else (k, v))
                       (wire_map_entries op))
              | None -> op)
        else op)
      operations
  in
  List.iter validate_operation operations;
  assert_add_block_page_ids db operations;
  let idents = operations_idents db operations in
  let pages_and_blocks = ops_pages_and_blocks db operations idents in
  let classes = ops_classes operations idents in
  let properties = ops_properties operations idents in
  let import_edn =
    Wire.Map
      ( (match pages_and_blocks with
         | [] -> []
         | xs -> [ (kw "pages-and-blocks", Wire.Array xs) ])
      @ (match classes with
         | [] -> []
         | xs -> [ (kw "classes", Wire.Map xs) ])
      @
      match properties with
      | [] -> []
      | xs -> [ (kw "properties", Wire.Map xs) ] )
  in
  validate_import_edn import_edn;
  import_edn
