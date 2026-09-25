(* logseq.graph-parser.exporter — exports a file graph to a DB graph. Used by
   the File to DB graph importer and by nbb-logseq CLIs.
   Source: deps/graph-parser/src/logseq/graph_parser/exporter.cljs *)

open Datascript

module BM = Block_map
module Eff = Db_worker_effect
open Eff.Infix

let kw (s : string) : value = Keyword s
let strv (s : string) : value = String s
let boolv (b : bool) : value = Bool b
let intv (i : int) : value = Int i
let floatv (f : float) : value = Float f
let uuidv (s : string) : value = Uuid s
let vec (xs : value list) : value = Vector xs
let setv (xs : value list) : value = Set xs

(* ::foo inside this ns -> :logseq.graph-parser.exporter/foo *)
let export_attr (n : string) : attr = "logseq.graph-parser.exporter/" ^ n

(* ---- map helpers over BM.t ((attr * value) list) and Map values ---- *)

let bm_of_value (v : value option) : BM.t =
  match v with
  | Some (Map pairs) ->
    List.filter_map
      (fun (k, v) ->
        match k with
        | Keyword s | String s -> Some (s, v)
        | _ -> None)
      pairs
  | _ -> []

let mv_of_bm (m : BM.t) : value =
  Map (List.map (fun (k, v) -> (Keyword k, v)) m)

let getv (m : BM.t) (a : attr) : value option = BM.attr_value m a

let get_string (m : BM.t) (a : attr) : string option =
  match getv m a with Some (String s) -> Some s | _ -> None

(* cljs keyword-valued schema attrs read as their name *)
let get_kstring (m : BM.t) (a : attr) : string option =
  match getv m a with
  | Some (String s) | Some (Keyword s) -> Some s
  | _ -> None

let get_uuid (m : BM.t) (a : attr) : string option =
  match getv m a with
  | Some (Uuid s) -> Some s
  | Some (String s) -> Some s
  | _ -> None

let get_bool (m : BM.t) (a : attr) : bool option =
  match getv m a with Some (Bool b) -> Some b | _ -> None

let get_int (m : BM.t) (a : attr) : int option =
  match getv m a with
  | Some (Int i) -> Some i
  | Some (Float f) -> Some (int_of_float f)
  | _ -> None

(* cljs truthiness *)
let truthy = Clj_value.truthy

let truthy_opt (v : value option) : bool =
  match v with Some v -> truthy v | None -> false

let coll_items = Clj_value.coll_items

let collv (v : value option) : value list =
  match v with Some v -> coll_items v | None -> []

let prop_map_of (block : BM.t) : BM.t = bm_of_value (getv block "block/properties")

let props_text_values_of (block : BM.t) : BM.t =
  bm_of_value (getv block "block/properties-text-values")

(* cljs (kw (:block/name m)) style lookups over ref-map values *)
let ref_bm (v : value option) : BM.t = bm_of_value v

let ref_bm_name (v : value) : string option =
  get_string (bm_of_value (Some v)) "block/name"

let ref_bm_uuid (v : value) : string option =
  get_uuid (bm_of_value (Some v)) "block/uuid"

(* (d/squuid) *)
let squuid () : string = Common_uuid.new_block_id ()

(* distinct preserving order *)
let distinct xs = Common_util.distinct_by Fun.id xs

let set_add xs x = if List.mem x xs then xs else xs @ [ x ]

let set_mem = List.mem

let str_opt_of (v : value) : string option =
  match v with String s -> Some s | _ -> None

(* cljs assoc-style upsert into an alist (last wins on write order) *)
let upsert (k : attr) (v : value) (m : (attr * value) list) :
    (attr * value) list =
  (k, v) :: List.remove_assoc k m

let map_value_to_bm (v : value) : BM.t option =
  match v with Map _ -> Some (bm_of_value (Some v)) | _ -> None

(* keywords are stored as plain strings in this port *)
let kwq (v : value) : string option = Clj_value.kw_opt v

(* ---- import state: new-import-state (atoms -> refs/Hashtbl) ---- *)

type extracted =
  { ex_pages : BM.t list
  ; ex_blocks : BM.t list }

type import_state =
  { ignored_properties : BM.t list ref
  ; ignored_files : BM.t list ref
  ; ignored_assets : BM.t list ref
  ; pdf_annotation_pages : (string, extracted) Hashtbl.t
  ; property_schemas : (string, BM.t) Hashtbl.t
  ; all_existing_page_uuids : (string, BM.t) Hashtbl.t
  ; page_names_to_uuids : (string, string) Hashtbl.t
  ; journal_page_name_uuids : (string, string) Hashtbl.t
  ; all_idents : (string, string) Hashtbl.t
  ; classes_from_property_parents : (string, unit) Hashtbl.t
  ; custom_status_markers : (string, value) Hashtbl.t
  ; block_properties_text_values : (string, BM.t) Hashtbl.t
  ; assets : (string, BM.t) Hashtbl.t
  ; alias_owners : (string, string) Hashtbl.t
  ; placeholder_ref_uuids : (string, unit) Hashtbl.t }

let new_import_state () : import_state =
  { ignored_properties = ref []
  ; ignored_files = ref []
  ; ignored_assets = ref []
  ; pdf_annotation_pages = Hashtbl.create 31
  ; property_schemas = Hashtbl.create 63
  ; all_existing_page_uuids = Hashtbl.create 511
  ; page_names_to_uuids = Hashtbl.create 511
  ; journal_page_name_uuids = Hashtbl.create 63
  ; all_idents = Hashtbl.create 255
  ; classes_from_property_parents = Hashtbl.create 7
  ; custom_status_markers = Hashtbl.create 7
  ; block_properties_text_values = Hashtbl.create 511
  ; assets = Hashtbl.create 255
  ; alias_owners = Hashtbl.create 63
  ; placeholder_ref_uuids = Hashtbl.create 63 }

type user_options =
  { tag_classes : string list
  ; property_classes : string list
  ; property_parent_classes : string list
  ; convert_all_tags : bool
  ; remove_inline_tags : bool
  ; extract_code_snippets : bool }

let default_user_options () : user_options =
  { tag_classes = []
  ; property_classes = []
  ; property_parent_classes = []
  ; convert_all_tags = true
  ; remove_inline_tags = true
  ; extract_code_snippets = false }

(* per-file-state map keys in cljs; here a small record *)
type per_file_state =
  { pfs_page_names_to_uuids : (string, string) Hashtbl.t
  ; pfs_classes_tx : BM.t list ref }

type options =
  { user_options : user_options
  ; user_config : (attr * value) list
  ; macros : (string * string) list
  ; log_fn : value list -> unit
  ; notify_user : BM.t -> unit
  ; import_state : import_state
  ; upstream_properties : (string, BM.t) Hashtbl.t
  ; classes_tx : BM.t list ref
  ; custom_status_tx : BM.t list ref
  ; journal_created_ats : (string, int64) Hashtbl.t
  ; current_journal_created_at : int64 option
  ; preserve_empty_property_block_uuids : (string, unit) Hashtbl.t
  ; file_created_at : int64 option
  ; file_updated_at : int64 option
  (* cljs :extract-options keys that callers merge over the defaults built in
     extract_pages_and_blocks; :db comes from @conn at call time *)
  ; extract_date_formatter : string option
  ; extract_user_config : (attr * value) list
  ; extract_filename_format : string option
  ; extract_verbose : bool
  (* cljs :property-changes — per call site map prop -> {:type {:from :to}} *)
  ; property_changes : (string, string * string) Hashtbl.t
  ; verbose : bool
  ; set_ui_state : string list -> value -> unit
  ; read_file : BM.t -> string Eff.t
  ; get_file_stat : (string -> File_sys.file_stat option Eff.t) option
  ; export_file : (conn -> BM.t -> options -> unit Eff.t) option
  ; read_and_copy_asset :
      (BM.t -> (string, BM.t) Hashtbl.t
      -> (string -> (BM.t -> BM.t) * bool) -> unit Eff.t) option
  ; save_file : (conn -> string -> string -> unit Eff.t) option
  ; on_tx_report : tx_report -> unit
  ; finalize_imported_graph : bool
  ; rpath_key : string
  ; import_watchdog : Import_profile.watchdog option
  ; import_timeout_ms : int option
  ; import_heartbeat_ms : int option
  ; default_config : (attr * value) list
  ; pdf_annotation_file : string option }

let noop_log_fn (_ : value list) : unit = ()
let noop_notify (_ : BM.t) : unit = ()
let noop_ui_state (_ : string list) (_ : value) : unit = ()

let default_options () : options =
  { user_options = default_user_options ()
  ; user_config = []
  ; macros = []
  ; log_fn = noop_log_fn
  ; notify_user = noop_notify
  ; import_state = new_import_state ()
  ; upstream_properties = Hashtbl.create 31
  ; classes_tx = ref []
  ; custom_status_tx = ref []
  ; journal_created_ats = Hashtbl.create 63
  ; current_journal_created_at = None
  ; preserve_empty_property_block_uuids = Hashtbl.create 31
  ; file_created_at = None
  ; file_updated_at = None
  ; extract_date_formatter = None
  ; extract_user_config = []
  ; extract_filename_format = None
  ; extract_verbose = false
  ; property_changes = Hashtbl.create 15
  ; verbose = false
  ; set_ui_state = noop_ui_state
  ; read_file =
      (fun f ->
        match get_string f "file/content" with
        | Some c -> Eff.pure c
        | None -> Eff.error (Failure "Import file is missing content"))
  ; get_file_stat = None
  ; export_file = None
  ; read_and_copy_asset = None
  ; save_file = None
  ; on_tx_report = (fun _ -> ())
  ; finalize_imported_graph = true
  ; rpath_key = "path"
  ; import_watchdog = None
  ; import_timeout_ms = None
  ; import_heartbeat_ms = None
  ; default_config = []
  ; pdf_annotation_file = None }

let logf (options : options) (args : value list) : unit = options.log_fn args

(* cljs log-phase-ms! / import-profile usage adapter: profile log-fn takes
   (event, kv-pairs) while exporter log-fn takes &args *)
let profile_log_fn (options : options) : string -> (attr * value) list -> unit =
  fun event kvs ->
  options.log_fn
    [ String event; mv_of_bm (List.map (fun (k, v) -> (k, v)) kvs) ]

let import_progress (options : options) (m : (string * value) list) : unit =
  Import_profile.set_import_progress options.import_watchdog m

let log_phase_ms (options : options) (phase : string) (start : float option)
    (extra : (attr * value) list) : unit =
  match start with
  | Some s ->
    Import_profile.log_phase (Some (profile_log_fn options)) phase s ~extra ()
  | None -> ()

(* ---------- add-missing-timestamps ---------- *)

let add_missing_timestamps ?(file_created_at : int64 option)
    ?(file_updated_at : int64 option)
    ?(current_journal_created_at : int64 option) (block : BM.t) : BM.t =
  let file_page =
    match getv block (export_attr "file-page?") with
    | Some (Bool b) -> b
    | _ -> false
  in
  let journal_day = getv block "block/journal-day" in
  let file_times =
    file_page
    && journal_day = None
    && (file_created_at <> None || file_updated_at <> None)
  in
  let journal_ref_page =
    current_journal_created_at <> None
    && getv block "block/name" <> None
    && journal_day = None
    && not file_page
  in
  let pick a b = match a with Some _ -> a | None -> b in
  let updated_at =
    if file_times then pick file_updated_at file_created_at
    else if journal_ref_page then current_journal_created_at
    else if file_updated_at <> None then file_updated_at
    else Some (Date_time_util.time_ms ())
  in
  let created_at =
    if file_times then pick file_created_at file_updated_at
    else if journal_ref_page then current_journal_created_at
    else if file_created_at <> None then file_created_at
    else updated_at
  in
  let msv ms = Common_util.value_of_ms ms in
  let block =
    if file_times || journal_ref_page || getv block "block/updated-at" = None
    then BM.put block "block/updated-at" (msv (Option.get updated_at))
    else block
  in
  if file_times || journal_ref_page || getv block "block/created-at" = None
  then BM.put block "block/created-at" (msv (Option.get created_at))
  else block

let add_missing_timestamps_opts (options : options) (block : BM.t) : BM.t =
  add_missing_timestamps ?file_created_at:options.file_created_at
    ?file_updated_at:options.file_updated_at
    ?current_journal_created_at:options.current_journal_created_at block

let pick_opt (a : 'a option) (b : 'a option) : 'a option =
  match a with Some _ -> a | None -> b

(* ---------- build-new-namespace-page ---------- *)

let build_new_namespace_page (block : BM.t) : BM.t =
  let new_title =
    Ns_util.get_last_part
      (Option.value ~default:"" (get_string block "block/title"))
  in
  BM.merge block
    [ "block/title", String new_title
    ; "block/name", String (Common_util.page_name_sanity_lc new_title) ]

(* ---------- template blocks ---------- *)

let template_file_property_names = [ "template"; "template-including-parent" ]

let get_template_name (block : BM.t) : string option =
  match List.assoc_opt "template" (prop_map_of block) with
  | Some (String s) ->
    let s = Unicode.trim s in
    if s = "" then None else Some s
  | _ -> None

let template_including_parent (block : BM.t) : bool =
  match List.assoc_opt "template-including-parent" (prop_map_of block) with
  | Some (Bool false) -> false
  | Some _ | None -> true

let remove_template_property_lines (title : string) : string =
  String.split_on_char '\n' title
  |> List.filter
       (fun line ->
         let trimmed = Common_util.str_triml line in
         not
           (Common_util.str_starts_with trimmed "template::"
            || Common_util.str_starts_with trimmed
                 "template-including-parent::"))
  |> String.concat "\n"

let group_block_children_by_parent (blocks : BM.t list)
    : (string, string list) Hashtbl.t =
  let tbl = Hashtbl.create 255 in
  List.iter
    (fun b ->
      match getv b "block/parent", getv b "block/uuid" with
      | Some (Vector [ Keyword "block/uuid"; Uuid pu ]), Some (Uuid cu) ->
        Hashtbl.replace tbl pu
          (Option.value ~default:[] (Hashtbl.find_opt tbl pu) @ [ cu ])
      | Some (Vector [ Keyword "block/uuid"; String pu ]), Some (Uuid cu) ->
        Hashtbl.replace tbl pu
          (Option.value ~default:[] (Hashtbl.find_opt tbl pu) @ [ cu ])
      | _ -> ())
    blocks;
  tbl

let get_block_subtree_uuids (block_children : (string, string list) Hashtbl.t)
    (root_uuid : string) : string list =
  let rec loop queue result =
    match queue with
    | [] -> List.rev result
    | u :: rest -> loop (rest @ Option.value ~default:[] (Hashtbl.find_opt block_children u)) (u :: result)
  in
  loop [ root_uuid ] []

let get_parent_uuid (parent : value option) : string option =
  match parent with
  | Some (Vector [ Keyword "block/uuid"; Uuid u ]) -> Some u
  | Some (Vector [ Keyword "block/uuid"; String u ]) -> Some u
  | Some (Map _ as m) -> get_uuid (bm_of_value (Some m)) "block/uuid"
  | _ -> None

(* handle-template-blocks *)
let handle_template_blocks (blocks : BM.t list)
    : BM.t list * (string, unit) Hashtbl.t =
  let include_parent_template_uuids =
    List.filter_map
      (fun b ->
        match get_template_name b with
        | Some _ when template_including_parent b -> get_uuid b "block/uuid"
        | _ -> None)
      blocks
  in
  let content_uuids_by_template =
    List.map (fun u -> (u, squuid ())) include_parent_template_uuids
  in
  let preserve = Hashtbl.create 63 in
  let out =
    List.rev
      (List.fold_left
         (fun acc block ->
           match get_template_name block with
        | Some template_name ->
          let block_children = group_block_children_by_parent blocks in
          let parent_uuid = get_parent_uuid (getv block "block/parent") in
          let content_uuid =
            match parent_uuid with
            | Some pu -> List.assoc_opt pu content_uuids_by_template
            | None -> None
          in
          let cleaned_block =
            match content_uuid with
            | Some cu ->
              BM.put block "block/parent" (vec [ kw "block/uuid"; uuidv cu ])
            | None -> block
          in
          let source_preserve =
            match get_uuid block "block/uuid" with
            | Some u -> get_block_subtree_uuids block_children u
            | None -> []
          in
          List.iter (fun u -> Hashtbl.replace preserve u ()) source_preserve;
          let template_root_block =
            let b =
              BM.put cleaned_block "block/title" (String template_name)
            in
            let b =
              BM.put b "block/tags"
                (List
                   (collv (getv b "block/tags")
                    @ [ kw "logseq.class/Template" ]))
            in
            BM.dissoc b [ "block/properties" ]
          in
          let block_uuid =
            Option.value ~default:"" (get_uuid block "block/uuid")
          in
          let template_content_block =
            if template_including_parent block then
              let b =
                if prop_map_of block <> [] then
                  BM.put block "block/properties"
                    (mv_of_bm
                       (List.filter
                          (fun (k, _) ->
                            not (List.mem k template_file_property_names))
                          (prop_map_of block)))
                else block
              in
              let b =
                match get_string b "block/title" with
                | Some t ->
                  BM.put b "block/title"
                    (String (remove_template_property_lines t))
                | None -> b
              in
              let b =
                BM.put b "block/uuid"
                  (uuidv
                     (Option.value ~default:""
                        (List.assoc_opt block_uuid content_uuids_by_template)))
              in
              let b =
                BM.put b "block/parent"
                  (vec [ kw "block/uuid"; uuidv block_uuid ])
              in
              BM.put b "block/order" (String (Db_order.gen_key None None))
              |> fun b -> BM.dissoc b [ "db/id" ]
              |> Option.some
            else None
          in
          (match template_content_block with
           | Some tcb ->
             (match get_uuid tcb "block/uuid" with
              | Some u -> Hashtbl.replace preserve u ()
              | None -> ())
           | None -> ());
          (match template_content_block with
           | Some t -> t :: template_root_block :: acc
           | None -> template_root_block :: acc)
        | None ->
          let block =
            match
              get_parent_uuid (getv block "block/parent")
              |> Fun.flip Option.bind
                   (fun pu -> List.assoc_opt pu content_uuids_by_template)
            with
            | Some cu ->
              BM.put block "block/parent" (vec [ kw "block/uuid"; uuidv cu ])
            | None -> block
          in
          block :: acc)
         [] blocks)
  in
  (out, preserve)

(* ---------- page uuid lookup ---------- *)

let get_page_uuid (page_names_to_uuids : (string, string) Hashtbl.t)
    (page_name : string) (ex_ctx : (string * value) list) : string =
  let page_name' =
    (if Common_util.str_includes page_name "#" then
       Unicode.lowercase (Gp_block.sanitize_hashtag_name page_name)
     else page_name)
    |> Common_util.str_trimr
  in
  match Hashtbl.find_opt page_names_to_uuids page_name' with
  | Some u -> u
  | None ->
    let names =
      Hashtbl.fold (fun k _ acc -> k :: acc) page_names_to_uuids []
      |> List.sort compare
    in
    failwith
      (Printf.sprintf "No uuid found for page name %s (ctx=%d, %d pages)"
         page_name (List.length ex_ctx) (List.length names))

(* ---------- replace-namespace-with-parent ---------- *)

let replace_namespace_with_parent (block : BM.t)
    (page_names_to_uuids : (string, string) Hashtbl.t) (parent_k : string)
    : BM.t =
  let ns_v = getv block "block/namespace" in
  if ns_v <> None && getv block "block/journal-day" = None then
    let ns_name =
      ref_bm ns_v |> fun m -> get_string m "block/name"
    in
    match ns_name with
    | Some n ->
      let resolved = get_page_uuid page_names_to_uuids n
          [ "block", mv_of_bm block ] in
      BM.put (BM.dissoc block [ "block/namespace" ]) parent_k
        (mv_of_bm
           [ "block/uuid", uuidv resolved ])
    | None -> BM.dissoc block [ "block/namespace" ]
  else block

(* ---------- classes / tags ---------- *)

let build_class_ident_name (class_name : string) : string =
  Common_util.str_replace_all class_name "/" "___"

(* returns (m, new-class?) — cljs uses (meta m) {:new-class?} *)
let find_or_create_class (db : db) (class_name : string)
    (all_idents : (string, string) Hashtbl.t) ?(class_block : BM.t option) ()
    : BM.t * bool =
  let ident = class_name in
  match Hashtbl.find_opt all_idents ident with
  | Some db_ident -> ([ "db/ident", Keyword db_ident ], false)
  | None ->
    let cb = Option.value ~default:[] class_block in
    let tags_v = getv cb "block/tags" in
    let m =
      if getv cb "block/namespace" <> None then
        (* Give namespaced tags a unique ident so they don't conflict with
           other tags *)
        let base =
          Db_class.build_new_class db
            (Ds_wire.transit_of_value
               (mv_of_bm
                  ([ "block/title", String (build_class_ident_name class_name) ]
                   @ (match tags_v with
                      | Some v -> [ "block/tags", v ]
                      | None -> []))))
        in
        let base = BM.of_transit base in
        BM.merge base
          [ "block/title", String class_name
          ; "block/name", String (Common_util.page_name_sanity_lc class_name) ]
        |> build_new_namespace_page
      else
        Db_class.build_new_class db
          (Ds_wire.transit_of_value
             (mv_of_bm
                [ "block/title", String class_name
                ; "block/name",
                  String (Common_util.page_name_sanity_lc class_name)
                ; "block/tags", Option.value ~default:Nil tags_v ]))
        |> BM.of_transit
    in
    (match getv m "db/ident" with
     | Some (Keyword db_ident) -> Hashtbl.replace all_idents ident db_ident
     | _ -> ());
    (m, true)

let find_or_gen_class_uuid (page_names_to_uuids : (string, string) Hashtbl.t)
    (page_name : string) (db_ident : string) ?(temp_new_class = false) () :
    string =
  match
    (if temp_new_class then
       (* First lookup by possible parent *)
       match
         Hashtbl.fold
           (fun k v acc ->
             match acc with
             | Some _ -> acc
             | None ->
               if Common_util.str_ends_with k ("/" ^ page_name) then Some v
               else None)
           page_names_to_uuids None
       with
       | Some u -> Some u
       | None -> Hashtbl.find_opt page_names_to_uuids page_name
     else Hashtbl.find_opt page_names_to_uuids page_name)
  with
  | Some u -> u
  | None ->
    let u = Common_uuid.gen_uuid "db-ident-block-uuid" db_ident in
    Hashtbl.replace page_names_to_uuids page_name u;
    u

let convert_tag (tag_name : string) (user_options : user_options) : bool =
  (user_options.convert_all_tags
   || List.mem tag_name user_options.tag_classes
   || tag_name = "card")
  && tag_name <> "tags"

(* find-existing-class *)
let find_existing_class (db : db) (tag_block : BM.t) : string option =
  let full_name = get_string tag_block "block/name" in
  let block_ns = getv tag_block "block/namespace" in
  let ent_uuid (e : entity) : string option =
    match Ldb.value e "block/uuid" with
    | Some (Uuid s) | Some (String s) -> Some s
    | _ -> None
  in
  let name_entities page_name =
    List.filter_map
      (fun (d : datom) ->
        match Ldb.ent_of_id db d.e with
        | Some e when Ldb.is_class e -> Some e
        | _ -> None)
      (List.of_seq (datoms db Avet ~a:"block/name" ~v:(String page_name) ()))
  in
  match block_ns with
  | Some _ ->
    (match full_name with
     | None -> None
     | Some full_name ->
       let leaf = Ns_util.get_last_part full_name in
       List.fold_left
         (fun acc (e : entity) ->
           match acc with
           | Some _ -> acc
           | None ->
             let parent =
               List.find_opt
                 (fun p ->
                   Ldb.ident_of p <> Some "logseq.class/Root")
                 (Db_class.get_class_extends e)
             in
             let parent_ancestors =
               match parent with
               | Some p -> Ldb.get_page_parents p
               | None -> []
             in
             let parents =
               parent_ancestors @ (match parent with Some p -> [ p ] | None -> [])
             in
             let names =
               List.filter_map
                 (fun (e : entity) -> Ldb.string_value e "block/name")
                 (parents @ [ e ])
             in
             if full_name = String.concat "/" names then
               ent_uuid e
             else None)
         None
         (name_entities leaf))
  | None ->
    (match full_name with
     | Some full_name ->
       List.fold_left
         (fun acc e ->
           match acc with
           | Some _ -> acc
           | None -> ent_uuid e)
         None (name_entities full_name)
     | None -> None)

(* convert-tag-to-class — returns [:block/uuid u] value or None *)
let convert_tag_to_class (db : db) (tag_block : BM.t)
    (per_file_state : per_file_state) (user_options : user_options)
    (all_idents : (string, string) Hashtbl.t) : value option =
  match getv tag_block "block.temp/new-class" with
  | Some new_class_v ->
    let new_class =
      match new_class_v with String s -> s | _ -> ""
    in
    let class_m, new_class_flag =
      find_or_create_class db new_class all_idents ()
    in
    let class_m' =
      BM.merge class_m
        [ "block/uuid",
          uuidv
            (find_or_gen_class_uuid
               per_file_state.pfs_page_names_to_uuids
               (Common_util.page_name_sanity_lc new_class)
               (match getv class_m "db/ident" with
                | Some (Keyword i) -> i
                | _ -> "")
               ~temp_new_class:true ()) ]
    in
    if new_class_flag then
      per_file_state.pfs_classes_tx := !(per_file_state.pfs_classes_tx) @ [ class_m' ];
    vec [ kw "block/uuid"; Option.value ~default:Nil (getv class_m' "block/uuid") ]
    |> Option.some
  | None ->
    (match get_string tag_block "block/name" with
     | Some name when convert_tag name user_options ->
       let existing_tag_uuid = find_existing_class db tag_block in
       let internal_tag_conflict =
         List.mem name [ "tag"; "property"; "page"; "journal"; "asset" ]
       in
       (match existing_tag_uuid, internal_tag_conflict with
        | Some u, false -> Some (vec [ kw "block/uuid"; uuidv u ])
        | _ ->
          let title = Option.value ~default:name (get_string tag_block "block/title") in
          let class_m, new_class_flag =
            find_or_create_class db title all_idents ~class_block:tag_block ()
          in
          let class_m' =
            BM.merge tag_block class_m
            |> fun m ->
            BM.merge m
              (if internal_tag_conflict then
                 [ "block/uuid",
                   uuidv
                     (Common_uuid.gen_uuid "db-ident-block-uuid"
                        (match getv class_m "db/ident" with
                         | Some (Keyword i) -> i
                         | _ -> "")) ]
               else
                 match getv tag_block "block/uuid" with
                 | Some _ -> []
                 | None ->
                   [ "block/uuid",
                     uuidv
                       (find_or_gen_class_uuid
                          per_file_state.pfs_page_names_to_uuids name
                          (match getv class_m "db/ident" with
                           | Some (Keyword i) -> i
                           | _ -> "")
                          ()) ])
            |> fun m -> BM.dissoc m [ "block/created-at"; "block/updated-at" ]
            |> fun m ->
            BM.merge m
              (add_missing_timestamps
                 (List.filter
                    (fun (k, _) ->
                      List.mem k [ "block/created-at"; "block/updated-at" ])
                    tag_block))
            |> fun m ->
            replace_namespace_with_parent m
              per_file_state.pfs_page_names_to_uuids
              "logseq.property.class/extends"
          in
          if new_class_flag then
            per_file_state.pfs_classes_tx :=
              !(per_file_state.pfs_classes_tx) @ [ class_m' ];
          Some
            (vec
               [ kw "block/uuid"
               ; Option.value ~default:Nil (getv class_m' "block/uuid") ]))
     | _ -> None)

(* logseq-class-ident? — qualified kw in the logseq.class ns *)
let logseq_class_ident (v : value) : bool =
  match kwq v with
  | Some k -> Db_class.logseq_class_kw k
  | None -> false

(* convert-tags-to-classes — converts each non-logseq-class tag; when a
   namespaced tag is present only its leaf child is kept on the block *)
let convert_tags_to_classes (tags : value list) (db : db)
    (per_file_state : per_file_state) (user_options : user_options)
    (all_idents : (string, string) Hashtbl.t) : value list =
  let tags' =
    List.filter_map
      (fun t ->
        if logseq_class_ident t then Some t
        else
          convert_tag_to_class db
            (bm_of_value (Some t))
            per_file_state user_options all_idents)
      tags
  in
  if
    List.exists
      (fun t -> getv (bm_of_value (Some t)) "block/namespace" <> None)
      tags
  then (match tags' with [] -> [] | child :: _ -> [ child ])
  else tags'

(* update-page-tags *)
let update_page_tags (block : BM.t) (db : db) (user_options : user_options)
    (per_file_state : per_file_state) (all_idents : (string, string) Hashtbl.t)
    : BM.t =
  let tags = collv (getv block "block/tags") in
  if tags = [] then
    BM.put block "block/tags" (List [ kw "logseq.class/Page" ])
  else
    let page_tags =
      tags
      |> List.filter
           (fun t ->
             let tm = bm_of_value (Some t) in
             not
               (getv tm "block.temp/new-class" <> None
                ||
                (match get_string tm "block/name" with
                 | Some n -> convert_tag n user_options
                 | None -> false)
                || logseq_class_ident t))
      |> List.filter_map
           (fun t ->
             match get_string (bm_of_value (Some t)) "block/name" with
             | Some n ->
               Some
                 (vec
                    [ kw "block/uuid"
                    ; uuidv
                        (get_page_uuid
                           per_file_state.pfs_page_names_to_uuids n
                           [ "block", t ]) ])
             | None -> None)
    in
    let block =
      BM.put block "block/tags"
        (List
           (convert_tags_to_classes tags db per_file_state user_options
              all_idents))
    in
    let tags_now = collv (getv block "block/tags") in
    let tags' =
      let s = distinct (tags_now @ [ kw "logseq.class/Page" ]) in
      let other_tags =
        List.filter (fun v -> v <> kw "logseq.class/Page") tags_now
      in
      let page_like =
        List.exists
          (fun t ->
            match kwq t with
            | Some k -> List.mem k Db_class.page_classes
            | _ -> false)
          other_tags
      in
      if page_like then
        List.filter (fun v -> v <> kw "logseq.class/Page") s
      else s
    in
    let block = BM.put block "block/tags" (List tags') in
    if page_tags <> [] then
      BM.merge block [ "logseq.property/page-tags", Set page_tags ]
    else block

let add_uuid_to_page_map (m : BM.t)
    (page_names_to_uuids : (string, string) Hashtbl.t) : BM.t =
  match get_string m "block/name" with
  | Some n ->
    BM.put m "block/uuid"
      (uuidv (get_page_uuid page_names_to_uuids n [ "block", mv_of_bm m ]))
  | None -> m

(* content-without-tags-ignore-case *)
let content_without_tags_ignore_case (content : string) (tags : string list) :
    string =
  let sorted = List.sort (fun a b -> compare b a) tags in
  List.fold_left
    (fun content tag ->
      let c = Common_util.replace_ignore_case content ("#" ^ tag) "" in
      Common_util.replace_ignore_case c
        ("#" ^ Page_ref.left_brackets ^ tag ^ Page_ref.right_brackets)
        "")
    content sorted
  |> Unicode.trim

(* replace-namespaced-tags-with-id-refs — tags are ref-map values *)
let replace_namespaced_tags_with_id_refs (content : string) (tags : value list)
    : string =
  let sorted =
    List.sort
      (fun a b ->
        let len t = String.length (Option.value ~default:"" (ref_bm_name t)) in
        compare (len b) (len a))
      tags
  in
  List.fold_left
    (fun content tag ->
      let tm = bm_of_value (Some tag) in
      match get_string tm "block/name" with
      | Some name when Ns_util.namespace_page (Some name) ->
        let uuid = Option.value ~default:"" (get_uuid tm "block/uuid") in
        let id_ref = Page_ref.to_page_ref uuid in
        let c =
          Common_util.replace_ignore_case content ("#" ^ name) ("#" ^ id_ref)
        in
        Common_util.replace_ignore_case c
          ("#" ^ Page_ref.to_page_ref name)
          ("#" ^ id_ref)
      | _ -> content)
    content sorted
  |> Unicode.trim

(* update-block-tags *)
let update_block_tags (block : BM.t) (db : db) (user_options : user_options)
    (per_file_state : per_file_state) (all_idents : (string, string) Hashtbl.t)
    : BM.t =
  match collv (getv block "block/tags") with
  | [] -> block
  | tags ->
    let original_tags =
      List.filter
        (fun t ->
          let tm = bm_of_value (Some t) in
          not (getv tm "block.temp/new-class" <> None || logseq_class_ident t))
        tags
    in
    let is_convertable t =
      match ref_bm_name t with
      | Some n -> convert_tag n user_options
      | None -> false
    in
    let block =
      if user_options.remove_inline_tags then
        let tag_names =
          List.filter_map
            (fun t ->
              if is_convertable t then
                get_string (bm_of_value (Some t)) "block/title"
              else None)
            original_tags
        in
        (match get_string block "block/title" with
         | Some title ->
           BM.put block "block/title"
             (String (content_without_tags_ignore_case title tag_names))
         | None -> block)
      else
        let namespaced =
          List.filter is_convertable original_tags
        in
        (match get_string block "block/title" with
         | Some title ->
           BM.put block "block/title"
             (String (replace_namespaced_tags_with_id_refs title namespaced))
         | None -> block)
    in
    let block =
      match get_string block "block/title" with
      | Some title ->
        let refs =
          List.filter_map
            (fun t ->
              if is_convertable t then None
              else
                let m = bm_of_value (Some t) in
                Some
                  (mv_of_bm
                     (add_uuid_to_page_map m
                        per_file_state.pfs_page_names_to_uuids)))
            original_tags
        in
        BM.put block "block/title"
          (String
             (Db_content.replace_tags_with_id_refs title
                (List.map bm_of_value (List.map Option.some refs))))
      | None -> block
    in
    BM.put block "block/tags"
      (List
         (convert_tags_to_classes tags db per_file_state user_options
            all_idents))

(* ---------- markers ---------- *)

let built_in_status_markers : (string * string) list =
  [ "TODO", "logseq.property/status.todo"
  ; "LATER", "logseq.property/status.todo"
  ; "NOW", "logseq.property/status.doing"
  ; "DOING", "logseq.property/status.doing"
  ; "DONE", "logseq.property/status.done"
  ; "CANCELED", "logseq.property/status.canceled"
  ; "CANCELLED", "logseq.property/status.canceled" ]

let custom_status_marker_names = [ "WAIT"; "WAITING"; "IN-PROGRESS" ]

let status_markers =
  List.map fst built_in_status_markers @ custom_status_marker_names

let marker_only_block_title (block : BM.t) : string option =
  match get_string block "block/title" with
  | Some title ->
    let t = Unicode.trim title in
    if List.mem t status_markers then Some t else None
  | None -> None

let find_status_choice_by_content (db : db) (marker : string) : entity option =
  List.find_opt
    (fun (e : entity) ->
      Db_property.closed_value_content e = Some (String marker))
    (Db_property.get_closed_property_values db "logseq.property/status")

(* cljs build-status-choice-tx: the Status property (not db-ident) is passed
   as `property`, so the choice block gets block/page, block/parent,
   block/closed-value-property and created-from-property pointing at
   :logseq.property/status and block/uuid materializes a new stub entity. *)
let build_status_choice_tx (marker : string) (block_uuid : string) : BM.t =
  BM.put
    (Db_property_build.build_closed_value_block block_uuid (Some "default")
       (String marker)
       [ "db/ident", kw "logseq.property/status" ])
    "block/order"
    (String (Db_order.gen_key None None))

(* custom-marker-status-ref — returns an entity ref value *)
let custom_marker_status_ref (db : db) (marker : string)
    (options : options) : value =
  match
    Hashtbl.find_opt options.import_state.custom_status_markers marker
  with
  | Some r -> r
  | None ->
    let status_ref =
      match find_status_choice_by_content db marker with
      | Some (s : entity) -> Int s.id
      | None ->
        let u = squuid () in
        options.custom_status_tx :=
          !(options.custom_status_tx) @ [ build_status_choice_tx marker u ];
        vec [ kw "block/uuid"; uuidv u ]
    in
    Hashtbl.replace options.import_state.custom_status_markers marker status_ref;
    status_ref

(* update-block-marker *)
let update_block_marker (block : BM.t) (db : db) (options : options) : BM.t =
  let marker =
    match getv block "block/marker" with
    | Some (String s) -> Some s
    | _ -> marker_only_block_title block
  in
  match marker with
  | None -> block
  | Some marker ->
    let status_ident =
      match List.assoc_opt marker built_in_status_markers with
      | Some ident -> kw ident
      | None ->
        if List.mem marker custom_status_marker_names then
          custom_marker_status_ref db marker options
        else begin
          logf options
            [ kw "invalid-todo"
            ; strv
                (Printf.sprintf "%s is not a valid marker so setting it to TODO"
                   (Edn_util.pr_str (String marker))) ];
          kw "logseq.property/status.todo"
        end
    in
    let block =
      BM.put block "logseq.property/status" status_ident
    in
    let block =
      match get_string block "block/title" with
      | Some title ->
        let re =
          Regexp.compile (Common_util.escape_regex_chars marker ^ "\\s*")
        in
        BM.put block "block/title"
          (String
             (Regexp.replace re
                ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> "")
                title))
      | None -> block
    in
    let block =
      BM.put block "block/tags"
        (List (collv (getv block "block/tags") @ [ kw "logseq.class/Task" ]))
    in
    BM.dissoc block [ "block/marker" ]

(* update-block-priority *)
let update_block_priority (block : BM.t) (options : options) : BM.t =
  match getv block "block/priority" with
  | Some (String priority) ->
    let old_to_new =
      [ "A", "logseq.property/priority.high"
      ; "B", "logseq.property/priority.medium"
      ; "C", "logseq.property/priority.low" ]
    in
    let priority_value =
      match List.assoc_opt priority old_to_new with
      | Some p -> kw p
      | None ->
        logf options
          [ kw "invalid-priority"
          ; strv
              (Printf.sprintf "%s is not a valid priority so setting it to low"
                 (Edn_util.pr_str (String priority))) ];
        kw "logseq.property/priority.low"
    in
    let block = BM.put block "logseq.property/priority" priority_value in
    let block =
      match get_string block "block/title" with
      | Some title ->
        let re =
          Regexp.compile
            ("\\[#" ^ Common_util.escape_regex_chars priority ^ "\\]\\s*")
        in
        BM.put block "block/title"
          (String
             (Regexp.replace re
                ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> "")
                title))
      | None -> block
    in
    BM.dissoc block [ "block/priority" ]
  | _ -> block

(* markdown-heading-level *)
let markdown_heading_level_re =
  Regexp.compile "^(#{1,6})\\s+"

let markdown_heading_level (title : string option) : int option =
  match title with
  | Some t ->
    (match Regexp.exec markdown_heading_level_re (Common_util.str_triml t) with
     | Some m ->
       (match Array.length m.Regexp.groups >= 2, m.Regexp.groups.(1) with
        | true, Some g -> Some (String.length g)
        | _ -> None)
     | None -> None)
  | None -> None

(* update-block-heading *)
let update_block_heading (block : BM.t) : BM.t =
  let display_type =
    match getv block "logseq.property.node/display-type" with
    | Some (Keyword s) -> Some s
    | _ -> None
  in
  if List.mem display_type [ Some "code"; Some "math"; Some "quote" ]
     || get_string block "block/title" = None
  then block
  else
    let title = Option.value ~default:"" (get_string block "block/title") in
    let heading_level = markdown_heading_level (Some title) in
    let block =
      if heading_level <> None || getv block "logseq.property/heading" <> None
      then
        BM.put block "block/title"
          (String
             (Common_util.clear_markdown_heading (Common_util.str_triml title)))
      else block
    in
    match heading_level with
    | Some lvl -> BM.put block "logseq.property/heading" (intv lvl)
    | None -> block

(* ---------- date/journal helpers ---------- *)

let get_date_formatter (config : (attr * value) list) : string =
  match List.assoc_opt "journal/page-title-format" config with
  | Some (String s) -> s
  | _ ->
    (match List.assoc_opt "date-formatter" config with
     | Some (String s) -> s
     | _ -> "MMM do, yyyy")

let journal_entity (entity : entity) : bool =
  Ldb.is_journal entity
  || Ldb.string_value entity "block/type" = Some "journal"

let page_entity (entity : entity) : bool =
  Ldb.is_page entity
  || (match Ldb.string_value entity "block/type" with
      | Some ("page" | "journal") -> true
      | _ -> false)

(* deadline-scheduled-date-int — value is map {:date-int} or int *)
let deadline_scheduled_date_int (v : value option) : int option =
  match v with
  | Some (Map _ as m) ->
    get_int (bm_of_value (Some m)) "date-int"
  | Some (Int i) -> Some i
  | _ -> None

(* deadline-scheduled-time-ms — local-midnight ms + optional :time {:hour :min} *)
let deadline_scheduled_time_ms (v : value option) : int64 option =
  match deadline_scheduled_date_int v with
  | None -> None
  | Some date_int ->
    let base = Date_time_util.int_to_local_ms date_int in
    (match v with
     | Some (Map _ as m) ->
       let tm = bm_of_value (Some m) in
       let time_m = bm_of_value (getv tm "time") in
       (match get_int time_m "hour" with
        | Some hour ->
          let min = Option.value ~default:0 (get_int time_m "min") in
          Some (Int64.add base (Int64.of_int (hour * 3600000 + min * 60000)))
        | None -> Some base)
     | _ -> Some base)

let repeat_recur_units : (string * string) list =
  [ "Minute", "logseq.property.repeat/recur-unit.minute"
  ; "Hour", "logseq.property.repeat/recur-unit.hour"
  ; "Day", "logseq.property.repeat/recur-unit.day"
  ; "Week", "logseq.property.repeat/recur-unit.week"
  ; "Month", "logseq.property.repeat/recur-unit.month"
  ; "Year", "logseq.property.repeat/recur-unit.year" ]

let repeat_types : (string * string) list =
  [ "Dotted", "logseq.property.repeat/repeat-type.dotted-plus"
  ; "Plus", "logseq.property.repeat/repeat-type.plus"
  ; "DoublePlus", "logseq.property.repeat/repeat-type.double-plus" ]

(* repeat-properties — value is map {:repetition [kind unit frequency]} *)
let repeat_properties (temporal_property : string) (v : value option) : BM.t =
  match v with
  | Some (Map _ as m) ->
    (match
       collv (getv (bm_of_value (Some m)) "repetition")
     with
     | [ kind_v; unit_v; frequency_v ] ->
       let kind =
         match coll_items kind_v with
         | String s :: _ | Keyword s :: _ -> s
         | _ -> ""
       in
       let unit_ =
         match coll_items unit_v with
         | String s :: _ | Keyword s :: _ -> s
         | _ -> ""
       in
       let unit_ident =
         match List.assoc_opt unit_ repeat_recur_units with
         | Some i -> i
         | None ->
           failwith
             (Printf.sprintf "Unknown repeat unit: %s"
                (Edn_util.pr_str unit_v))
       in
       let repeat_type_ident =
         Option.value
           ~default:"logseq.property.repeat/repeat-type.double-plus"
           (List.assoc_opt kind repeat_types)
       in
       [ "logseq.property.repeat/repeated?", Bool true
       ; "logseq.property.repeat/temporal-property", Keyword temporal_property
       ; "logseq.property.repeat/repeat-type", Keyword repeat_type_ident
       ; "logseq.property.repeat/recur-frequency", frequency_v
       ; "logseq.property.repeat/recur-unit", Keyword unit_ident ]
     | _ -> [])
  | _ -> []

(* ---------- property schema inference & tx ---------- *)

let prop_map_of_value (block_properties : value option) : (attr * value) list =
  match block_properties with
  | Some (Map kvs) ->
    List.filter_map
      (fun (k, v) ->
        match Clj_value.string_of_kwish k with
        | Some s -> Some (s, v)
        | None -> None)
      kvs
  | _ -> []

let text_value_of (block : BM.t) (prop : string) : string option =
  bm_of_value (getv block "block/properties-text-values")
  |> fun m ->
  match getv m prop with Some (String s) -> Some s | _ -> None

(* get-ident *)
let get_ident (all_idents : (string, string) Hashtbl.t) (kw : string) : string =
  if String.contains kw '/' && Db_property.logseq_property kw then kw
  else
    match Hashtbl.find_opt all_idents kw with
    | Some i -> i
    | None -> failwith ("No ident found for " ^ kw)

(* get-property-schema *)
let get_property_schema (property_schemas : (string, BM.t) Hashtbl.t)
    (kw : string) : BM.t =
  match Hashtbl.find_opt property_schemas kw with
  | Some s -> s
  | None -> failwith ("No property schema found for " ^ kw)

(* ->property-value-tx-m — returns (prop-name-or-ident * tx-value) list *)
let to_property_value_tx_m (new_block : BM.t) (properties : (attr * value) list)
    (get_schema_fn : string -> BM.t option) (all_idents : (string, string) Hashtbl.t)
    : (attr * value) list =
  let pairs : (value * value) list =
    List.filter_map
      (fun ((k, v) : string * value) ->
        let built_in_type = Db_property.built_in_property_schema_type k in
        match built_in_type with
        | Some t ->
          let has_closed_values =
            match
              List.find_opt
                (fun (p : Builtin_data.builtin_property) -> p.Builtin_data.ident = k)
                Builtin_data.built_in_properties
            with
            | Some p -> p.Builtin_data.closed_values <> []
            | None -> false
          in
          if List.mem t Db_schema.value_ref_property_types
             && not has_closed_values
          then
            Some
              ( Map
                  [ Keyword "db/ident", Keyword k
                  ; Keyword "db/id", Ref_to (Ident k)
                  ; Keyword "logseq.property/type", Keyword t ]
              , v )
          else None
        | None ->
          let schema = Option.value ~default:[] (get_schema_fn k) in
          (match get_kstring schema "logseq.property/type" with
           | Some t when List.mem t Db_schema.value_ref_property_types ->
             Some
               ( Map
                   ((Keyword "db/ident", Keyword (get_ident all_idents k))
                    :: (Keyword "original-property-id", String k)
                    :: List.map
                         (fun (a, v') -> (Keyword a, v'))
                         schema)
               , v )
           | _ -> None))
      properties
  in
  Db_property_build.build_property_values_tx_m new_block pairs

(* build-repeat-properties *)
let build_repeat_properties (block : BM.t) (properties : BM.t) :
    BM.t * BM.t list =
  let block' = BM.dissoc block [ "block/page" ] in
  let empty_idents : (string, string) Hashtbl.t = Hashtbl.create 3 in
  let pvalue_tx_m =
    to_property_value_tx_m block' properties (fun _ -> None) empty_idents
  in
  let pvalues_tx =
    List.concat_map
      (fun (_, v) ->
        match v with Set vs -> vs | _ -> [ v ])
      pvalue_tx_m
    |> List.filter_map (fun v -> match v with Map _ -> Some (bm_of_value (Some v)) | _ -> None)
  in
  ( BM.merge properties
      (Db_property_build.build_properties_with_ref_values pvalue_tx_m)
  , pvalues_tx )

(* fallback-repeat-type-property *)
let fallback_repeat_type_property : Builtin_data.builtin_property =
  { ident = "logseq.property.repeat/repeat-type"
  ; title = Some "Repeating type"
  ; attribute = None
  ; schema =
      [ "type", Keyword "default"; "public?", Bool false ]
  ; queryable = None
  ; closed_values =
      (let cvs ident txt : Builtin_data.builtin_closed_value =
         { Builtin_data.cv_value = String txt
         ; cv_db_ident = Some ident
         ; cv_uuid_seed = Some ident
         ; cv_icon = None
         ; cv_schema = None
         ; cv_properties = None }
       in
       [ cvs "logseq.property.repeat/repeat-type.dotted-plus"
           "Advance from completion"
       ; cvs "logseq.property.repeat/repeat-type.plus"
           "Advance from scheduled"
       ; cvs "logseq.property.repeat/repeat-type.double-plus"
           "Advance from scheduled, skip to future" ])
  ; rtc_ignore = false
  ; properties =
      [ "logseq.property/hide-empty-value", Bool true
      ; "logseq.property/default-value",
        Keyword "logseq.property.repeat/repeat-type.double-plus" ] }

(* missing-repeat-type-property-tx *)
let missing_repeat_type_property_tx (db : db) (repeat_property_values : BM.t) :
    BM.t list =
  if getv repeat_property_values "logseq.property.repeat/repeat-type" <> None
     && Datascript.entity db (Ident "logseq.property.repeat/repeat-type") = None
  then
    let entry =
      match
        List.find_opt
          (fun (p : Builtin_data.builtin_property) ->
            p.Builtin_data.ident = "logseq.property.repeat/repeat-type")
          Builtin_data.built_in_properties
      with
      | Some e -> e
      | None -> fallback_repeat_type_property
    in
    Sqlite_create_graph.build_properties [ entry ]
    |> List.map (fun m -> BM.put m "logseq.property/built-in?" (Bool true))
  else []

(* find-or-create-deadline-scheduled-value *)
let find_or_create_deadline_scheduled_value (value : value option)
    (page_names_to_uuids : (string, string) Hashtbl.t)
    (user_config : (attr * value) list) : value option * BM.t list =
  let date_int = deadline_scheduled_date_int value in
  match date_int with
  | None -> (None, [])
  | Some date_int ->
    let title =
      Some
        (Ldb.journal_title_of_day date_int (get_date_formatter user_config))
    in
    let existing_uuid =
      match title with
      | Some t ->
        Hashtbl.find_opt page_names_to_uuids
          (Common_util.page_name_sanity_lc t)
      | None -> None
    in
    let journal_page =
      match existing_uuid with
      | Some u -> [ "block/uuid", Uuid u ]
      | None ->
        BM.merge
          (BM.of_transit (Sqlite_util.build_new_page (Option.value ~default:"" title)))
          [ "block/uuid", uuidv (Common_uuid.gen_uuid "journal-page-uuid" (string_of_int date_int))
          ; "block/journal-day", Int date_int ]
    in
    let journal_page =
      BM.put journal_page "block/tags" (Set [ kw "logseq.class/Journal" ])
    in
    let time_ms = deadline_scheduled_time_ms value in
    ( (match time_ms with
       | Some ms -> Some (Common_util.value_of_ms ms)
       | None -> None)
    , (match existing_uuid with Some _ -> [] | None -> [ journal_page ]) )

(* update-block-deadline-and-scheduled *)
let update_block_deadline_and_scheduled (db : db) (block : BM.t)
    (page_names_to_uuids : (string, string) Hashtbl.t) (options : options) :
    BM.t * BM.t list =
  let deadline = getv block "block/deadline" in
  let scheduled = getv block "block/scheduled" in
  let deadline_value, deadline_tx =
    if deadline <> None then
      find_or_create_deadline_scheduled_value deadline page_names_to_uuids
        options.user_config
    else (None, [])
  in
  let scheduled_value, scheduled_tx =
    if scheduled <> None then
      find_or_create_deadline_scheduled_value scheduled page_names_to_uuids
        options.user_config
    else (None, [])
  in
  let repeat_properties' =
    BM.merge
      (bm_of_value
         (Some
            (mv_of_bm
               (repeat_properties "logseq.property/deadline" deadline))))
      (repeat_properties "logseq.property/scheduled" scheduled)
  in
  let repeat_block_properties, repeat_properties_tx =
    build_repeat_properties block repeat_properties'
  in
  let block' =
    BM.dissoc block [ "block/deadline"; "block/scheduled"; "block/repeated?" ]
  in
  let block' =
    match deadline_value with
    | Some v -> BM.put block' "logseq.property/deadline" v
    | None -> block'
  in
  let block' =
    match scheduled_value with
    | Some v -> BM.put block' "logseq.property/scheduled" v
    | None -> block'
  in
  let block' =
    if repeat_block_properties <> [] then
      BM.merge block' repeat_block_properties
    else block'
  in
  ( block'
  , missing_repeat_type_property_tx db repeat_properties'
    @ deadline_tx @ scheduled_tx @ repeat_properties_tx )

(* text-with-refs? — prop_vals are raw ref names (strings) *)
let text_with_refs (prop_vals : string list) (val_text : string) : bool =
  let sorted = List.sort (fun a b -> compare b a) prop_vals in
  let re =
    Regexp.compile
      ("([#\\[])("
       ^ String.concat "|" (List.map Common_util.escape_regex_chars sorted)
       ^ ")")
  in
  let remaining =
    Regexp.replace_all re
      ~f:(fun ~match_:_ ~groups ~offset:_ ~input:_ ->
        match groups.(1) with
        | Some g -> g
        | _ -> "")
      val_text
  in
  String.exists
    (fun c -> not (List.mem c [ ' '; '\t'; '\n'; '\r'; '['; ']'; ','; '#' ]))
    remaining

(* create-property-ident *)
let create_property_ident (db : db) (all_idents : (string, string) Hashtbl.t)
    (property_name : string) : unit =
  let db_ident =
    Db_property.create_user_property_ident_from_name property_name
    |> Db_ident.ensure_unique_db_ident db
  in
  Hashtbl.replace all_idents property_name db_ident

(* infer-property-schema-and-get-property-change — returns (from,to) option *)
let infer_property_schema_and_get_property_change (db : db) (prop_val : value)
    (prop : string) (prop_val_text : string option) (refs : value list)
    (import_state : import_state) (macros : (string * string) list)
    : (string * string) option =
  let prop_coll =
    match prop_val with Set vs | List vs | Vector vs -> Some vs | _ -> None
  in
  (match prop_coll with
   | Some vs when not (List.for_all (function String _ -> true | _ -> false) vs)
     ->
     failwith
       ("Import cannot infer schema of unknown property value "
        ^ Edn_util.pr_str prop_val)
   | _ -> ());
  let prop_val_names =
    match prop_coll with
    | Some vs -> List.filter_map (function String s -> Some s | _ -> None) vs
    | None -> []
  in
  let refs_journal_titles =
    List.filter_map
      (fun r ->
        match r with
        | Map _ ->
          let m = bm_of_value (Some r) in
          (match get_string m "block/title" with
           | Some t ->
             let journalish =
               getv m "block/journal-day" <> None
               || getv m "block/type" = Some (String "journal")
             in
             if journalish then Some t else None
           | None -> None)
        | _ -> None)
      refs
  in
  let prop_type =
    if prop_coll <> None && prop_val_names <> []
       && List.for_all (fun n -> List.mem n refs_journal_titles) prop_val_names
    then "date"
    else if prop_coll <> None && prop_val_names <> []
            && (match prop_val_text with
                | Some t -> text_with_refs prop_val_names t
                | None -> false)
    then "default"
    else if prop_coll <> None then "node"
    else
      Db_property_type.infer_property_type_from_value
        (Macro_util.expand_value_if_macro prop_val macros)
  in
  let prev_type =
    match Hashtbl.find_opt import_state.property_schemas prop with
    | Some s -> get_kstring s "logseq.property/type"
    | None -> None
  in
  (match Hashtbl.find_opt import_state.property_schemas prop with
   | None ->
     create_property_ident db import_state.all_idents prop;
     let schema =
       [ "logseq.property/type", kw prop_type ]
       @ (if List.mem prop_type [ "node"; "date" ] then
            [ "db/cardinality", kw "many" ]
          else [])
     in
     Hashtbl.replace import_state.property_schemas prop schema
   | Some _ -> ());
  (match prev_type with
   | Some pt when pt <> prop_type -> Some (pt, prop_type)
   | _ -> None)

(* get-file-pid — file-graph property id for a db graph ident *)
let get_file_pid (db_ident : string) : string =
  match db_ident with
  | "logseq.property/order-list-type" -> "logseq.order-list-type"
  | "logseq.property/publishing-public?" -> "public"
  | _ ->
    (match String.rindex_opt db_ident '/' with
     | Some i ->
       String.sub db_ident (i + 1) (String.length db_ident - i - 1)
     | None -> db_ident)

(* built-in-property-file-to-db-idents — {file-id db-ident} *)
let built_in_property_file_to_db_idents : (string * string) list =
  List.map
    (fun (k, _, _) -> (get_file_pid k, k))
    Db_property.built_in_properties

(* all-built-in-property-file-ids *)
let all_built_in_property_file_ids : string list =
  List.map fst built_in_property_file_to_db_idents
  @ [ "filters"; "query-table"; "query-properties"; "query-sort-by"
    ; "query-sort-desc"; "hl-stamp"; "file"; "file-path" ]
  @ template_file_property_names

let all_built_in_names : string list =
  all_built_in_property_file_ids
  @ List.map
      (fun (c : Db_class.built_in_class) ->
        Unicode.lowercase c.Db_class.title)
      Db_class.built_in_classes
  @ [ Unicode.lowercase Common_config.library_page_name ]

let file_built_in_property_names : string list =
  [ "alias"; "tags"; "background-color"; "heading"; "query-table"
  ; "query-properties"; "query-sort-by"; "query-sort-desc"; "ls-type"
  ; "hl-type"; "hl-color"; "hl-page"; "hl-stamp"; "hl-value"; "file"
  ; "file-path"; "logseq.order-list-type"; "icon"; "public"
  ; "exclude-from-graph-view"; "filters"; "template"
  ; "template-including-parent" ]

let query_table_special_keys : (string * string) list =
  [ "page", "block/title"; "block", "block/title"; "tags", "block/tags"
  ; "alias", "block/alias"; "created-at", "block/created-at"
  ; "updated-at", "block/updated-at" ]

let translate_query_properties (prop_value : string)
    (all_idents : (string, string) Hashtbl.t) (property_classes : string list) :
    value =
  try
    match Edn_util.safe_read_string prop_value with
    | Some v ->
      let cols =
        Clj_value.coll_items v
        |> List.filter_map (fun item ->
               match Clj_value.string_of_kwish item with
               | None -> None
               | Some s ->
                 (match List.assoc_opt s query_table_special_keys with
                  | Some k -> Some (kw k)
                  | None ->
                    if List.mem s property_classes || s = "tags" then
                      Some (kw "block/tags")
                    else Some (kw (get_ident all_idents s))))
        |> distinct
      in
      vec (List.map (fun v -> v) cols)
    | None -> vec []
  with e ->
    Worker_log.error "Translating query properties failed with:"
      [ ("error", Printexc.to_string e) ];
    vec []

(* translate-linked-ref-filters — returns (ident * value) pairs *)
let translate_linked_ref_filters (prop_value : string)
    (page_names_to_uuids : (string, string) Hashtbl.t) : (attr * value) list =
  try
    match Edn_util.safe_read_string prop_value with
    | Some (Map kvs) ->
      let includes, excludes =
        List.fold_left
          (fun (inc, exc) (k, v) ->
            let name = Clj_value.string_of_kwish k in
            match name, v with
            | Some n, Bool true -> (n :: inc, exc)
            | Some n, Bool false -> (inc, n :: exc)
            | _ -> (inc, exc))
          ([], []) kvs
      in
      let to_refs names =
        List.filter_map
          (fun n ->
            match Hashtbl.find_opt page_names_to_uuids n with
            | Some u -> Some (vec [ kw "block/uuid"; uuidv u ])
            | None ->
              (* cljs (js/console.error (str "No uuid found ..." (pr-str %))) *)
              Worker_log.error
                ("No uuid found for linked reference filter page "
                 ^ Edn_util.pr_str (String n))
                [];
              None)
          names
      in
      let includes' = vec (to_refs includes) in
      let excludes' = vec (to_refs excludes) in
      (if collv (Some includes') <> [] then
         [ "logseq.property.linked-references/includes", includes' ]
       else [])
      @ (if collv (Some excludes') <> [] then
           [ "logseq.property.linked-references/excludes", excludes' ]
         else [])
    | _ -> []
  with e ->
    Worker_log.error "Translating linked reference filters failed with: "
      [ ("error", Printexc.to_string e) ];
    []

(* emoji icon support *)
let emoji_icons : (string * BM.t) list Lazy.t =
  lazy
    (List.filter_map
       (fun (native, skin) ->
         Some
           ( native
           , [ "type", kw "emoji"; "id", String native ]
             @ (match skin with
                | Some i -> [ "skin", intv i ]
                | None -> []) ))
       (Emoji_data.all_emoji_icons ()))

let file_icon_value_to_db_icon (prop_value : value) : BM.t option =
  match prop_value with
  | String s ->
    let t = Unicode.trim s in
    (match
       List.find_opt (fun (n, _) -> n = t) (Lazy.force emoji_icons)
     with
     | Some (_, icon) -> Some icon
     | None -> None)
  | _ -> None

let ignored_built_in_property_value (prop : string) (prop_value : value)
    (block_name : string option) (block_title : string option) : BM.t =
  [ "property", String prop; "value", prop_value
  ; "location",
    (match block_name with
     | Some n -> mv_of_bm [ "page", String n ]
     | None -> mv_of_bm [ "block", String (Option.value ~default:"" block_title) ]) ]

(* update-built-in-property-values — returns (attr*value) list props *)
let update_built_in_property_values (props : (attr * value) list)
    (page_names_to_uuids : (string, string) Hashtbl.t)
    (import_state : import_state) (block_name, block_title) (options : options)
    : (attr * value) list =
  let m =
    List.concat_map
      (fun ((prop, prop_value) : string * value) ->
        if List.mem prop [ "file"; "file-path"; "hl-stamp" ] then begin
          import_state.ignored_properties :=
            !(import_state.ignored_properties)
            @ [ ignored_built_in_property_value prop prop_value block_name
                  block_title ];
          []
        end
        else
          match prop with
          | "icon" ->
            (match file_icon_value_to_db_icon prop_value with
             | Some icon -> [ "logseq.property/icon", mv_of_bm icon ]
             | None ->
               import_state.ignored_properties :=
                 !(import_state.ignored_properties)
                 @ [ ignored_built_in_property_value prop prop_value block_name
                       block_title ];
               [])
          | "query-properties" ->
            (match
               collv
                 (Some
                    (translate_query_properties
                       (match prop_value with String s -> s | _ -> "")
                       import_state.all_idents
                       options.user_options.property_classes))
             with
             | [] -> []
             | cols ->
               [ "logseq.property.table/ordered-columns", Vector cols ])
          | "query-table" ->
            [ ( "logseq.property.view/type"
              , kw
                  (if truthy prop_value then "logseq.property.view/type.table"
                   else "logseq.property.view/type.list") ) ]
          | "query-sort-by" ->
            let sv =
              match prop_value with
              | String s -> s
              | Keyword s -> s
              | _ -> ""
            in
            let id =
              match List.assoc_opt sv query_table_special_keys with
              | Some k -> k
              | None -> get_ident import_state.all_idents sv
            in
            [ ( "logseq.property.table/sorting"
              , vec [ mv_of_bm [ "id", kw id; "asc?", boolv true ] ] ) ]
          | "query-sort-desc" -> []
          | "filters" ->
            (match prop_value with
             | String s ->
               translate_linked_ref_filters s page_names_to_uuids
             | _ -> [])
          | "ls-type" ->
            (match prop_value with
             | String s -> [ "logseq.property/ls-type", kw s ]
             | _ -> [])
          | "hl-color" ->
            let color_pairs =
              Option.value ~default:[]
                (List.assoc_opt "logseq.property.pdf/hl-color"
                   Db_property.built_in_closed_value_pairs)
            in
            (match prop_value with
             | String s ->
               (match List.assoc_opt s color_pairs with
                | Some ident -> [ "logseq.property.pdf/hl-color", kw ident ]
                | None -> [])
             | _ -> [])
          | _ ->
            (match List.assoc_opt prop built_in_property_file_to_db_idents with
             | Some ident -> [ ident, prop_value ]
             | None -> []))
      props
  in
  (* (into {}) semantics: later entries win on duplicate keys *)
  let deduped =
    let seen = Hashtbl.create 31 in
    List.fold_left
      (fun acc (k, v) ->
        if Hashtbl.mem seen k then acc
        else begin
          Hashtbl.replace seen k ();
          (k, v) :: acc
        end)
      []
      (List.rev m)
  in
  if List.mem_assoc "query-sort-desc" props
     && List.mem_assoc "query-sort-by" props
  then
    let desc =
      match List.assoc_opt "query-sort-desc" props with
      | Some v -> truthy v
      | None -> false
    in
    List.map
      (fun (k, v) ->
        if k = "logseq.property.table/sorting" then
          match v with
          | Vector [ Map kvs ] ->
            let sm =
              List.map
                (fun (kk, vv) ->
                  let kk' = Clj_value.string_of_kwish kk |> Option.value ~default:"" in
                  if kk' = "asc?" then (kk, boolv (not desc)) else (kk, vv))
                kvs
            in
            (k, Vector [ Map sm ])
          | _ -> (k, v)
        else (k, v))
      deduped
  else deduped

(* sqlite-util/block-with-timestamps on BM maps *)
let with_timestamps (m : BM.t) : BM.t =
  BM.of_transit
    (Sqlite_util.block_with_timestamps (Ds_wire.transit_of_value (mv_of_bm m)))

(* property-ref-name->page-name *)
let property_ref_name_to_page_name (page_name : string)
    (user_config : (attr * value) list) : string =
  let _, page_name', _ =
    Gp_block.convert_page_if_journal ~export_to_db_graph:true page_name
      (Some (get_date_formatter user_config))
  in
  page_name'

(* update-page-or-date-values — set of [:block/uuid uuid] values *)
let update_page_or_date_values
    (page_names_to_uuids : (string, string) Hashtbl.t)
    (property_values : string list) (user_config : (attr * value) list) : value =
  Set
    (distinct
       (List.map
          (fun name ->
            vec
              [ kw "block/uuid"
              ; uuidv
                  (get_page_uuid page_names_to_uuids
                     (property_ref_name_to_page_name name user_config)
                     [ "original-name", String name ]) ])
          property_values))

(* parse-double — cljs parse-double = js/parseFloat *)
let parse_double (s : string) : value option =
  let n = String.length s in
  let rec scan i seen_digit seen_dot seen_exp =
    if i >= n then i
    else
      let c = s.[i] in
      if c >= '0' && c <= '9' then scan (i + 1) true seen_dot seen_exp
      else if c = '.' && not seen_dot && not seen_exp then
        scan (i + 1) seen_digit true seen_exp
      else if (c = 'e' || c = 'E') && seen_digit && not seen_exp then
        scan (i + 1) seen_digit seen_dot true
      else if (c = '-' || c = '+') && (i = 0 || s.[i - 1] = 'e' || s.[i - 1] = 'E')
      then scan (i + 1) seen_digit seen_dot seen_exp
      else i
  in
  let stop = scan 0 false false false in
  (* parse-double requires the whole string to be a number *)
  if stop = n && stop > 0 then
    try Some (floatv (float_of_string (String.sub s 0 stop)))
    with _ -> None
  else None

(* handle-changed-property — changes : (string, (string*string)) Hashtbl *)
let handle_changed_property (v : value) (prop : string)
    (page_names_to_uuids : (string, string) Hashtbl.t)
    (properties_text_values : BM.t)
    (property_changes : (string, string * string) Hashtbl.t)
    (import_state : import_state) (options : options) : value option =
  let type_change =
    match Hashtbl.find_opt property_changes prop with
    | Some (f, t) -> Some (f, t)
    | None -> None
  in
  let get_tv () =
    match getv properties_text_values prop with
    | Some (String s) -> Some (String s)
    | Some v' -> Some v'
    | None -> None
  in
  match type_change with
  | Some ("default", _) -> (match get_tv () with Some v' -> Some v' | None -> Some v)
  | Some ("node", "date") ->
    Some
      (update_page_or_date_values page_names_to_uuids
         (List.filter_map (function String s -> Some s | _ -> None)
            (collv (Some v)))
         options.user_config)
  | Some ("date", "node") ->
    Hashtbl.replace options.upstream_properties prop
      [ "schema", mv_of_bm [ "logseq.property/type", kw "node" ]
      ; "from-type", String "date" ];
    (match Hashtbl.find_opt import_state.property_schemas prop with
     | Some s ->
       Hashtbl.replace import_state.property_schemas prop
         (BM.put s "logseq.property/type" (kw "node"))
     | None -> ());
    Some
      (update_page_or_date_values page_names_to_uuids
         (List.filter_map (function String s -> Some s | _ -> None)
            (collv (Some v)))
         options.user_config)
  | Some (_, "default") ->
    if Hashtbl.mem options.upstream_properties prop then begin
      options.log_fn
        [ kw "prop-to-change-ignored"
        ; mv_of_bm
            [ "property", String prop; "val", v
            ; "change",
              (match type_change with
               | Some (f, t) ->
                 mv_of_bm [ "from", String f; "to", String t ]
               | None -> Nil) ] ];
      import_state.ignored_properties :=
        !(import_state.ignored_properties)
        @ [ [ "property", String prop; "value", v
            ; "schema",
              (match type_change with
               | Some (f, t) ->
                 mv_of_bm
                   [ "type", mv_of_bm [ "from", String f; "to", String t ] ]
               | None -> Nil) ] ];
      None
    end
    else begin
      (match type_change with
       | Some (f, _) ->
         Hashtbl.replace options.upstream_properties prop
           [ "schema", mv_of_bm [ "logseq.property/type", kw "default" ]
           ; "from-type", String f ]
       | None -> ());
      Hashtbl.replace import_state.property_schemas prop
        [ "logseq.property/type", kw "default" ];
      get_tv ()
    end
  | Some (f, t) ->
    options.log_fn
      [ kw "prop-change-ignored"
      ; mv_of_bm
          [ "property", String prop; "val", v
          ; "change", mv_of_bm [ "from", String f; "to", String t ] ] ];
    import_state.ignored_properties :=
      !(import_state.ignored_properties)
      @ [ [ "property", String prop; "value", v
          ; "schema",
            mv_of_bm [ "type", mv_of_bm [ "from", String f; "to", String t ] ] ] ];
    None
  | None -> Some v

(* update-user-property-values *)
let update_user_property_values (props : (attr * value) list)
    (page_names_to_uuids : (string, string) Hashtbl.t)
    (properties_text_values : BM.t)
    (property_changes : (string, string * string) Hashtbl.t)
    (import_state : import_state) (options : options) : (attr * value) list =
  List.filter_map
    (fun ((prop, v) : string * value) ->
      if Hashtbl.mem property_changes prop then
        match
          handle_changed_property v prop page_names_to_uuids
            properties_text_values property_changes import_state options
        with
        | Some v' -> Some (prop, v')
        | None -> None
      else
        match v with
        | Set names ->
          let schema_type =
            match Hashtbl.find_opt import_state.property_schemas prop with
            | Some s -> get_kstring s "logseq.property/type"
            | None -> None
          in
          if schema_type = Some "default" then
            (match getv properties_text_values prop with
             | Some tv -> Some (prop, tv)
             | None -> None)
          else
            Some
              ( prop
              , update_page_or_date_values page_names_to_uuids
                  (List.filter_map
                     (function String s -> Some s | _ -> None)
                     names)
                  options.user_config )
        | _ -> Some (prop, v))
    props

(* build-properties-and-values *)
let build_properties_and_values (props : (attr * value) list) (_db : db)
    (page_names_to_uuids : (string, string) Hashtbl.t) (block : BM.t)
    (options : options) : BM.t * BM.t list =
  let import_state = options.import_state in
  let all_idents = import_state.all_idents in
  let user_properties =
    List.filter
      (fun (k, _) -> not (List.mem k file_built_in_property_names))
      props
  in
  if user_properties <> [] then
    Hashtbl.replace import_state.block_properties_text_values
      (match getv block "block/name" with
       | Some _ ->
         get_page_uuid page_names_to_uuids
           (Option.value
              ~default:(Option.value ~default:"" (get_string block "block/name"))
              (get_string block (export_attr "original-name")))
           [ "block", mv_of_bm block ]
       | None ->
         Option.value ~default:"" (get_uuid block "block/uuid"))
      (bm_of_value (getv block "block/properties-text-values"));
  let props' =
    List.fold_left
      (fun acc (k, v) -> upsert k v acc)
      (update_built_in_property_values
         (List.filter
            (fun (k, _) -> List.mem k file_built_in_property_names)
            props)
         page_names_to_uuids import_state
         (get_string block "block/name", get_string block "block/title")
         options)
      (update_user_property_values user_properties page_names_to_uuids
         (bm_of_value (getv block "block/properties-text-values"))
         options.property_changes import_state options)
  in
  let pvalue_tx_m =
    to_property_value_tx_m block props'
      (fun k ->
        match Hashtbl.find_opt import_state.property_schemas k with
        | Some m -> Some m
        | None -> None)
      all_idents
  in
  let block_properties =
    BM.merge props'
      (Db_property_build.build_properties_with_ref_values pvalue_tx_m)
    |> List.map (fun (k, v) -> (get_ident all_idents k, v))
  in
  ( block_properties
  , List.concat_map
      (fun (_, v) ->
        List.map
          (fun m -> bm_of_value (Some m))
          (match v with Set vs -> vs | _ -> [ v ]))
      pvalue_tx_m )

(* ignored-built-in-properties — already imported via datascript attrs,
   unsupported, or deprecated *)
let ignored_built_in_properties : string list =
  [ "tags"; "alias"; "collapsed"; "id"; "now"; "later"; "doing"; "done"
  ; "canceled"; "cancelled"; "in-progress"; "todo"; "wait"; "waiting"
  ; "background-image"; "macros"; "logseq.query/nlp-date"
  ; "card-last-interval"; "card-repeats"; "card-last-reviewed"
  ; "card-next-schedule"; "card-ease-factor"; "card-last-score"
  ; "logseq.color"; "logseq.table.borders"; "logseq.table.stripes"
  ; "logseq.table.max-width"; "logseq.table.version"
  ; "logseq.table.compact"; "logseq.table.headers"; "logseq.table.hover" ]

(* pre-update-properties *)
let pre_update_properties (properties : (attr * value) list)
    (class_related_properties : string list)
    (preserve_empty_properties : bool) : (attr * value) list =
  let dissoced =
    ignored_built_in_properties @ [ "title"; "created-at"; "updated-at" ]
    @ class_related_properties
  in
  List.filter_map
    (fun ((prop, v) : string * value) ->
      if List.mem prop dissoced then None
      else if not (List.mem prop file_built_in_property_names) then
        match v with
        | String s ->
          if preserve_empty_properties || Unicode.trim s <> "" then
            Some
              ( prop
              , match parse_double s with
                | Some f -> f
                | None -> v )
          else None
        | _ -> Some (prop, v)
      else Some (prop, v))
    properties

(* handle-page-and-block-properties *)
let handle_page_and_block_properties (block : BM.t) (db : db)
    (page_names_to_uuids : (string, string) Hashtbl.t) (refs : value list)
    (options : options) : BM.t * BM.t list =
  let import_state = options.import_state in
  let properties = prop_map_of_value (getv block "block/properties") in
  if properties = [] then
    ( BM.dissoc block
        [ "block/properties"; "block/properties-text-values"
        ; "block/properties-order"; "block/invalid-properties" ]
    , [] )
  else begin
    let preserve_empty_properties =
      Hashtbl.mem options.preserve_empty_property_block_uuids
        (Option.value ~default:"" (get_uuid block "block/uuid"))
    in
    let user_options = options.user_options in
    let classes_from_properties =
      List.filter
        (fun (k, _) -> List.mem k user_options.property_classes)
        properties
      |> List.concat_map (fun (_, v) ->
             match collv (Some v) with
             | [] ->
               (match v with String s -> [ s ] | _ -> [])
             | vs ->
               List.filter_map (function String s -> Some s | _ -> None) vs)
      |> distinct
    in
    let properties' =
      pre_update_properties properties
        (user_options.property_classes @ user_options.property_parent_classes)
        preserve_empty_properties
    in
    let properties_to_infer =
      List.filter
        (fun (k, _) -> not (List.mem k file_built_in_property_names))
        properties'
    in
    let property_changes =
      List.filter_map
        (fun (prop, v) ->
          match
            infer_property_schema_and_get_property_change db v prop
              (get_string
                 (bm_of_value (getv block "block/properties-text-values"))
                 prop)
              refs import_state options.macros
          with
          | Some pc -> Some (prop, pc)
          | None -> None)
        properties_to_infer
    in
    List.iter
      (fun (prop, pc) -> Hashtbl.replace options.property_changes prop pc)
      property_changes;
    let block_properties, pvalues_tx =
      build_properties_and_values properties' db page_names_to_uuids block
        options
    in
    let block' =
      let b = BM.merge block block_properties in
      if classes_from_properties = [] then b
      else
        let tags =
          match getv b "block/tags" with
          | Some (List xs) | Some (Vector xs) | Some (Set xs) -> xs
          | _ -> []
        in
        BM.put b "block/tags"
          (List
             (tags
              @ List.map
                  (fun c -> Map [ kw "block.temp/new-class", String c ])
                  classes_from_properties))
    in
    ( BM.dissoc block'
        [ "block/properties"; "block/properties-text-values"
        ; "block/properties-order"; "block/invalid-properties" ]
    , pvalues_tx )
  end

(* handle-page-properties — extends/parent handling after general property
   processing *)
let handle_page_properties (block_star : BM.t) (db : db)
    (per_file_state : per_file_state) (refs : value list) (options : options)
    : BM.t * BM.t list =
  let page_names_to_uuids = per_file_state.pfs_page_names_to_uuids in
  let block, properties_tx =
    handle_page_and_block_properties block_star db page_names_to_uuids refs
      options
  in
  let import_state = options.import_state in
  let classes_tx = per_file_state.pfs_classes_tx in
  let properties = prop_map_of_value (getv block_star "block/properties") in
  let parent_classes_from_properties =
    List.filter
      (fun (k, _) -> List.mem k options.user_options.property_parent_classes)
      properties
    |> List.concat_map
         (fun (_, v) ->
           List.filter_map
             (function String s -> Some s | _ -> None)
             (match collv (Some v) with [] -> [ v ] | vs -> vs))
    |> distinct
  in
  let block'' =
    match parent_classes_from_properties with
    | [] ->
      replace_namespace_with_parent block page_names_to_uuids "block/parent"
    | new_class :: _ ->
      begin
        (match get_string block_star "block/title" with
         | Some t ->
           Hashtbl.replace import_state.classes_from_property_parents t ()
         | None -> ());
        let class_title =
          match get_string block (export_attr "original-title") with
          | Some t -> t
          | None ->
            Option.value ~default:"" (get_string block "block/title")
        in
        let class_m, _ =
          find_or_create_class db class_title import_state.all_idents
            ~class_block:block ()
        in
        let parent_class_m, parent_new_class =
          find_or_create_class db new_class import_state.all_idents ()
        in
        let parent_class_m' =
          BM.merge parent_class_m
            [ "block/uuid",
              uuidv
                (find_or_gen_class_uuid page_names_to_uuids
                   (Common_util.page_name_sanity_lc new_class)
                   (match getv parent_class_m "db/ident" with
                    | Some (Keyword i) | Some (String i) -> i
                    | _ -> "")
                   ()) ]
        in
        let parent_uuid =
          match getv parent_class_m' "block/uuid" with
          | Some (Uuid u) -> u
          | _ -> ""
        in
        let block' = BM.dissoc (BM.merge block class_m) [ "block/namespace" ] in
        if List.length parent_classes_from_properties > 1 then
          options.log_fn
            [ kw "skipped-parent-classes"
            ; strv "Only one parent class is allowed so skipped ones after the first one"
            ; mv_of_bm
                [ "classes", vec (List.map (fun s -> String s) parent_classes_from_properties) ] ];
      if parent_new_class then classes_tx := !classes_tx @ [ parent_class_m' ];
      BM.put block' "logseq.property.class/extends"
        (vec [ kw "block/uuid"; uuidv parent_uuid ])
    end
  in
  (block'', properties_tx)

(* pretty-print-dissoc *)
let pretty_print_dissoc (s : string) (dissoc_keys : string list) : string =
  Rewrite_edn.dissoc_many s dissoc_keys

(* migrate-advanced-query-string *)
let migrate_advanced_query_string (query_str : string) : string =
  try pretty_print_dissoc query_str [ "title"; "group-by-page?"; "collapsed?" ]
  with _ ->
    (match Edn_util.safe_read_map_string query_str with
     | Map kvs when kvs <> [] ->
       let m =
         List.filter
           (fun (k, _) ->
             match Clj_value.string_of_kwish k with
             | Some ("title" | "group-by-page?" | "collapsed?") -> false
             | _ -> true)
           kvs
       in
       Edn_util.pr_str (Map m)
     | _ -> query_str)

(* ---------- ast->text ---------- *)

let rec ast_to_text (ast_block : value) (options : options) : string =
  let rec extract (node : value) : string list =
    let tag_of n =
      match coll_items n with
      | String t :: _ -> Some t
      | _ -> None
    in
    let extract_emphasis (node : value) : string list =
      match coll_items node with
      | [ type'; coll' ] ->
        (match coll_items type' with
         | [ String t ] ->
           let wrap w =
             w :: (List.concat_map extract (coll_items coll')) @ [ w ]
           in
           (match t with
            | "Bold" -> wrap "**"
            | "Italic" -> wrap "*"
            | "Strike_through" -> wrap "~~"
            | "Highlight" -> wrap "^^"
            | _ ->
              failwith
                ("Failed to wrap Emphasis AST block of type " ^ t))
         | _ -> [])
      | _ -> []
    in
    let nth n (items : value list) =
      match List.nth_opt items n with Some v -> v | None -> Nil
    in
    match node with
    | (Vector _ | List _) as v ->
      let items = coll_items v in
      (match tag_of v with
       | Some ("Inline_Html" | "Plain" | "Inline_Hiccup") ->
         [ (match Clj_value.map_get_str (nth 1 items) "" with
            | Some s -> s
            | None -> Option.value ~default:"" (str_opt_of (nth 1 items))) ]
       | Some ("Break_Line" | "Hard_Break_Line") -> [ "\n" ]
       | Some "Link" ->
         [ Option.value ~default:""
             (Clj_value.map_get_str (nth 1 items) "full_text") ]
       | Some ("Paragraph" | "Quote") ->
         List.concat_map extract (coll_items (nth 1 items))
       | Some "Tag" -> "#" :: List.concat_map extract (coll_items (nth 1 items))
       | Some "Emphasis" -> extract_emphasis (nth 1 items)
       | Some "Custom" ->
         (match items with
          | _ :: String "query" :: _ ->
            [ str_opt_of (nth 4 items) |> Option.value ~default:"" ]
          | _ -> [])
       | Some "Code" ->
         [ "`"; str_opt_of (nth 1 items) |> Option.value ~default:""; "`" ]
       | Some "Email" ->
         let m = nth 1 items in
         [ "<"
         ; Option.value ~default:"" (Clj_value.map_get_str m "local_part")
         ; "@"
         ; Option.value ~default:"" (Clj_value.map_get_str m "domain")
         ; ">" ]
       | Some "Macro" ->
         (match Clj_value.map_get_str (nth 1 items) "name" with
          | Some "query" ->
            (match Clj_value.map_get_opt (nth 1 items) "arguments" with
             | Some args ->
               List.filter_map str_opt_of (coll_items args)
             | None -> [])
          | _ ->
            options.log_fn
              [ kw "ast->text"; strv "Ignored ast node"; kw "node"; node ];
            [])
       | Some "Example" ->
         [ str_opt_of (nth 1 items) |> Option.value ~default:"" ]
       | Some "Latex_Fragment" ->
         (match coll_items (nth 1 items) with
          | [ String t; c ] ->
            let w =
              match t with "Inline" -> "$" | "Displayed" -> "$$" | _ -> ""
            in
            [ w; str_opt_of c |> Option.value ~default:""; w ]
          | _ -> [])
       | Some "Src" ->
         let m = nth 1 items in
         let lang =
           match Clj_value.map_get_str m "language" with
           | Some l -> l
           | None -> ""
         in
         let lines =
           List.filter_map str_opt_of (coll_items (Option.value ~default:Nil (Clj_value.map_get_opt m "lines")))
         in
         [ "\n```" ^ lang; "\n" ^ String.concat "" lines; "```" ]
       | Some "Displayed_Math" ->
         [ "$$"; str_opt_of (nth 1 items) |> Option.value ~default:""; "$$" ]
       | Some "List" ->
         extract_block_list options (coll_items (nth 1 items)) false
       | _ ->
         options.log_fn
           [ kw "ast->text"; strv "Ignored ast node"; kw "node"; node ];
         [])
    | _ ->
      options.log_fn
        [ kw "ast->text"; strv "Ignored ast node"; kw "node"; node ];
      []
  in
  extract ast_block |> String.concat "" |> Unicode.trim

and extract_block_list (options : options) (l : value list) (in_list : bool)
    : string list =
  (if not in_list then [ "\n" ] else [])
  @ List.concat_map (extract_block_list_item options) l
  @ (if l <> [] && not in_list then [ "\n\n" ] else [])

and extract_block_list_item (options : options) (item : value) : string list =
  let content =
    List.map
      (fun n -> ast_to_text n options)
      (coll_items
         (Option.value ~default:Nil (Clj_value.map_get_opt item "content")))
  in
  let number' =
    match Clj_value.map_get_opt item "number" with
    | Some (Int i) -> string_of_int i ^ ". "
    | Some (Float f) -> Common_util.js_string_of_float f ^ ". "
    | Some (String s) -> s ^ ". "
    | Some v when truthy v -> "* "
    | _ -> "* "
  in
  let checkbox' =
    match Clj_value.map_get_opt item "checkbox" with
    | Some v when v <> Nil -> if truthy v then "[X]" else "[ ]"
    | _ -> ""
  in
  let items' =
    extract_block_list options
      (coll_items
         (Option.value ~default:Nil (Clj_value.map_get_opt item "items")))
      true
  in
  [ number'; checkbox'; " " ] @ content @ [ "\n" ] @ items'
  @ (if items' <> [] then [ "\n" ] else [])

(* ---------- url/zotero helpers (exporter.cljs ~1281-1336) ---------- *)

let decode_uri (s : string) : string =
  (* JS decodeURI: percent-decodes like decodeURIComponent but preserves the
     reserved characters ; / ? : @ & = + $ , # *)
  let reserved = ";/?:@&=+$,#" in
  let hexv c =
    match c with
    | '0' .. '9' -> Char.code c - Char.code '0'
    | 'a' .. 'f' -> Char.code c - Char.code 'a' + 10
    | 'A' .. 'F' -> Char.code c - Char.code 'A' + 10
    | _ -> -1
  in
  let b = Buffer.create (String.length s) in
  let n = String.length s in
  let rec loop i =
    if i < n then begin
      if
        s.[i] = '%' && i + 2 < n
        && hexv s.[i + 1] >= 0 && hexv s.[i + 2] >= 0
      then begin
        let c = Char.chr ((hexv s.[i + 1] lsl 4) + hexv s.[i + 2]) in
        if String.contains reserved c then
          Buffer.add_string b (String.sub s i 3)
        else Buffer.add_char b c;
        loop (i + 3)
      end else begin
        Buffer.add_char b s.[i];
        loop (i + 1)
      end
    end
  in
  loop 0;
  Buffer.contents b

(* get-in over a Map value using keyword-name keys *)
let rec get_in_v (v : value) (path : string list) : value option =
  match path with
  | [] -> Some v
  | k :: rest ->
    (match Clj_value.map_get_opt v k with
     | Some v' -> get_in_v v' rest
     | None -> None)

let config_get_in (config : (attr * value) list) (path : string list) :
    value option =
  match path with
  | [] -> None
  | k :: rest ->
    (match List.assoc_opt k config with
     | Some v -> get_in_v v rest
     | None -> None)

let last_path_segment (s : string) : string option =
  match List.rev (String.split_on_char '/' s) with
  | last :: _ when last <> "" -> Some last
  | _ -> None

(* get-zotero-local-pdf-path — [m] is a Link node's second item *)
let get_zotero_local_pdf_path (config : (attr * value) list) (m : value) :
    BM.t option =
  let url_m =
    match
      coll_items (Option.value ~default:Nil (Clj_value.map_get_opt m "url"))
    with
    | _ :: cplx :: _ -> bm_of_value (Some cplx)
    | _ -> []
  in
  if get_string url_m "protocol" <> Some "zotero" then None
  else
    match get_string url_m "link" with
    | None -> None
    | Some link ->
      let label =
        match
          coll_items
            (Option.value ~default:Nil (Clj_value.map_get_opt m "label"))
        with
        | first :: _ ->
          (match coll_items first with
           | _ :: l :: _ -> str_opt_of l
           | _ -> None)
        | _ -> None
      in
      (match label, last_path_segment link with
       | Some label, Some id ->
         (match
            config_get_in config
              [ "zotero/settings-v2"; "default"; "zotero-data-directory" ]
          with
          | Some (String dir) ->
            Some
              [ "link", strv ("zotero://" ^ link)
              ; "path", strv (Common_path.path_join dir [ "storage"; id; label ])
              ; "base", strv label ]
          | _ -> None)
       | _ -> None)

(* remote-http-url? *)
let remote_http_url (s : string option) : bool =
  match s with
  | Some s ->
    Common_util.str_starts_with s "http://"
    || Common_util.str_starts_with s "https://"
  | None -> false

(* link-map->url *)
let link_map_to_url (m : value) : string option =
  match m with
  | Map _ ->
    let bm = bm_of_value (Some m) in
    (match get_string bm "protocol", get_string bm "link" with
     | Some (("file" | "http" | "https") as proto), Some link ->
       Some (proto ^ "://" ^ link)
     | _ -> None)
  | _ -> None

(* external-pdf-url? *)
let external_pdf_url (s : string option) : bool =
  match s with
  | Some s -> Common_util.str_starts_with s "file://" || remote_http_url (Some s)
  | None -> false

(* windows-drive-path? *)
let windows_drive_path (s : string option) : bool =
  match s with
  | Some s ->
    String.length s >= 3
    && (match s.[0] with 'a' .. 'z' | 'A' .. 'Z' -> true | _ -> false)
    && s.[1] = ':'
    && (s.[2] = '/' || s.[2] = '\\')
  | _ -> false

(* pdf-target-path — js/URL().pathname for remote urls *)
let pdf_target_path (target : string) : string option =
  if remote_http_url (Some target) then
    match Common_util.str_index_of target "://" with
    | Some i ->
      (match String.index_from_opt target (i + 3) '/' with
       | Some j ->
         let path = String.sub target j (String.length target - j) in
         (* js/URL().pathname excludes query and fragment *)
         let cut =
           match
             ( Common_util.str_index_of path "?"
             , Common_util.str_index_of path "#" )
           with
           | Some a, Some b -> min a b
           | Some a, None | None, Some a -> a
           | None, None -> String.length path
         in
         Some (String.sub path 0 cut)
       | None -> Some "/")
    | None -> None
  else Some target

(* pdf-file? *)
let pdf_file (target : string option) : bool =
  match Option.bind target pdf_target_path with
  | Some path ->
    Common_path.filename path <> None
    && Common_path.file_ext path = "pdf"
  | None -> false

(* file-url->path *)
let file_url_to_path (file_url : string) : string =
  decode_uri (Common_path.url_to_path file_url)

(* ---------- walk-ast-blocks (cljs ~1337-1390) ---------- *)

type walked_ast =
  { wa_simple_queries : value list ref
  ; wa_cards : value list ref
  ; wa_embeds : value list ref
  ; wa_asset_links : value list ref
  ; wa_zotero_imported_files : (string, value) Hashtbl.t
  ; wa_zotero_linked_files : string list ref }

let new_walked_ast () : walked_ast =
  { wa_simple_queries = ref []
  ; wa_cards = ref []
  ; wa_embeds = ref []
  ; wa_asset_links = ref []
  ; wa_zotero_imported_files = Hashtbl.create 7
  ; wa_zotero_linked_files = ref [] }

(* cljs walk/prewalk: visits each node top-down including map keys/vals *)
let rec value_prewalk_iter (f : value -> unit) (v : value) : unit =
  f v;
  match v with
  | Vector xs | List xs | Set xs -> List.iter (value_prewalk_iter f) xs
  | Tuple xs ->
    List.iter
      (fun x -> match x with Some x' -> value_prewalk_iter f x' | None -> ())
      xs
  | Map pairs ->
    List.iter
      (fun (k, v') ->
        value_prewalk_iter f k;
        value_prewalk_iter f v')
      pairs
  | _ -> ()

let nth1 (x : value) : value option =
  match coll_items x with _ :: m :: _ -> Some m | _ -> None

(* (second (:url (second x))) — the url target of a Link ast node *)
let link_url_second (x : value) : value option =
  match nth1 x with
  | Some m ->
    (match Clj_value.map_get_opt m "url" with
     | Some u -> List.nth_opt (coll_items u) 1
     | None -> None)
  | None -> None

let ast_link_is_asset (config : (attr * value) list) (x : value) : bool =
  match link_url_second x with
  | Some (String s) ->
    Common_config.local_relative_asset s
    || Common_util.str_ends_with s ".pdf"
  | Some ((Map _) as m) ->
    let bm = bm_of_value (Some m) in
    (match get_string bm "protocol", get_string bm "link" with
     | Some "zotero", Some _ ->
       (match nth1 x with
        | Some link_map ->
          (match get_zotero_local_pdf_path config link_map with
           | Some bm' -> get_string bm' "link" <> None
           | None -> false)
        | None -> false)
     | _ ->
       (match link_map_to_url m with
        | Some url -> pdf_file (Some url)
        | None -> false))
  | _ -> false

let walk_ast_blocks (config : (attr * value) list) (ast_blocks : value list) :
    walked_ast =
  let wa = new_walked_ast () in
  List.iter
    (value_prewalk_iter
       (fun x ->
         match coll_items x with
         | String "Link" :: _ :: _ when ast_link_is_asset config x ->
           wa.wa_asset_links := !(wa.wa_asset_links) @ [ x ]
         | String "Macro" :: m :: _ ->
           (match Clj_value.map_get_str m "name" with
            | Some "embed" -> wa.wa_embeds := !(wa.wa_embeds) @ [ x ]
            | Some "cards" -> wa.wa_cards := !(wa.wa_cards) @ [ x ]
            | Some "query" ->
              wa.wa_simple_queries := !(wa.wa_simple_queries) @ [ x ]
            | Some "zotero-imported-file" ->
              (match
                 coll_items
                   (Option.value ~default:Nil
                      (Clj_value.map_get_opt m "arguments"))
               with
               | item_key :: filename :: _ ->
                 (match str_opt_of item_key with
                  | Some k ->
                    (match
                       Option.bind (str_opt_of filename)
                         Edn_util.safe_read_string
                     with
                     | Some v ->
                       Hashtbl.replace wa.wa_zotero_imported_files k v
                     | None -> ())
                  | None -> ())
               | _ -> ())
            | Some "zotero-linked-file" ->
              (match
                 coll_items
                   (Option.value ~default:Nil
                      (Clj_value.map_get_opt m "arguments"))
               with
               | p :: _ ->
                 (match
                    Option.bind (str_opt_of p) Edn_util.safe_read_string
                  with
                  | Some (String s) ->
                    wa.wa_zotero_linked_files
                      := !(wa.wa_zotero_linked_files) @ [ s ]
                  | _ -> ())
               | _ -> ())
            | _ -> ())
         | _ -> ()))
    ast_blocks;
  wa

(* ---------- handle-queries (cljs ~1391) ---------- *)

let value_block_uuid (v : value) : string option =
  match v with
  | Ref_to (Lookup_ref ("block/uuid", Uuid u)) -> Some u
  | Vector [ Keyword "block/uuid"; Uuid u ]
  | List [ Keyword "block/uuid"; Uuid u ]
  | Tuple [ Some (Keyword "block/uuid"); Some (Uuid u) ] -> Some u
  | Map _ -> get_uuid (bm_of_value (Some v)) "block/uuid"
  | _ -> None

let query_title_re = Regexp.compile "\\{\\{query.*\\}\\}"
let cards_title_re = Regexp.compile "\\{\\{cards.*\\}\\}"
let begin_query_re = Regexp.compile "#\\+BEGIN_QUERY[\\s\\S]*#\\+END_QUERY"

let handle_queries (block : BM.t) (db : db)
    (page_names_to_uuids : (string, string) Hashtbl.t) (walked : walked_ast)
    (options : options) : BM.t * BM.t list =
  let title = Option.value ~default:"" (get_string block "block/title") in
  let block_sel =
    List.filter
      (fun (k, _) ->
        List.mem k
          [ "block/properties-text-values"; "block/name"; "block/title"
          ; "block/uuid" ])
      block
  in
  let add_tag tag =
    List (collv (getv block "block/tags") @ [ kw tag ])
  in
  let simple_query =
    match !(walked.wa_simple_queries) with
    | q :: _ ->
      let q' = Unicode.trim (ast_to_text q options) in
      if q' = "" then None else Some q'
    | [] -> None
  in
  match simple_query with
  | Some query ->
    let block_properties, pvalues_tx =
      build_properties_and_values
        [ "logseq.property/query", String query ]
        db page_names_to_uuids block_sel options
    in
    let block' =
      BM.merge block block_properties
      |> fun b -> BM.put b "block/tags" (add_tag "logseq.class/Query")
      |> fun b ->
         BM.put b "block/title"
           (String
              (Unicode.trim
                 (Common_util.regex_replace_first query_title_re ~replacement:""
                    title)))
    in
    (block', pvalues_tx)
  | None ->
    let advanced_node =
      List.find_opt
        (fun n ->
          match coll_items n with
          | String "Custom" :: String "query" :: _ -> true
          | _ -> false)
        (collv (getv block "block.temp/ast-blocks"))
    in
    (match
       Option.bind advanced_node (fun n ->
         let q = Unicode.trim (ast_to_text n options) in
         if q = "" then None else Some q)
     with
     | Some advanced_query ->
       let query = migrate_advanced_query_string advanced_query in
       let block_properties, pvalues_tx =
         build_properties_and_values
           [ "logseq.property/query", String query ]
           db page_names_to_uuids block_sel options
       in
       let query_uuid =
         match List.assoc_opt "logseq.property/query" block_properties with
         | Some v -> value_block_uuid v
         | None -> None
       in
       let pvalues_tx' =
         pvalues_tx
         @ [ [ "block/uuid", uuidv (Option.value ~default:"" query_uuid)
             ; "logseq.property.code/lang", strv "clojure"
             ; "logseq.property.node/display-type", kw "code" ] ]
       in
       let query_map =
         bm_of_value
           (Some (Edn_util.safe_read_map_string advanced_query))
       in
       let block' =
         let b =
           BM.merge block block_properties
           |> fun b -> BM.put b "block/tags" (add_tag "logseq.class/Query")
         in
         let b =
           let title' =
             match getv query_map "title" with
             | Some (String t) -> t
             | Some v -> Edn_util.pr_str v
             | None ->
               Unicode.trim
                 (Common_util.regex_replace_first begin_query_re ~replacement:""
                    title)
           in
           BM.put b "block/title" (String title')
         in
         (match getv query_map "collapsed?" with
          | Some v when truthy v -> BM.put b "block/collapsed?" (Bool true)
          | _ -> b)
       in
       (block', pvalues_tx')
     | None ->
       (* cards macro *)
       (match !(walked.wa_cards) with
        | cards_macro :: _ ->
          let query =
            match nth1 cards_macro with
            | Some m ->
              (match
                 coll_items
                   (Option.value ~default:Nil
                      (Clj_value.map_get_opt m "arguments"))
               with
               | arg0 :: _ ->
                 (match str_opt_of arg0 with
                  | Some s ->
                    let s' = Unicode.trim s in
                    if s' = "" then None else Some s'
                  | None -> None)
               | _ -> None)
            | None -> None
          in
          (match query with
           | Some query ->
             let block_properties, pvalues_tx =
               build_properties_and_values
                 [ "logseq.property/query", String query ]
                 db page_names_to_uuids block_sel options
             in
             let block' =
               BM.merge block block_properties
               |> fun b -> BM.put b "block/tags" (add_tag "logseq.class/Cards")
               |> fun b ->
                  BM.put b "block/title"
                    (String
                       (Unicode.trim
                          (Common_util.regex_replace_first cards_title_re
                             ~replacement:"" title)))
             in
             (block', pvalues_tx)
           | None -> (block, []))
        | [] -> (block, [])))

(* ---------- handle-block-properties (cljs ~1452) ---------- *)

let handle_block_properties (block : BM.t) (db : db)
    (page_names_to_uuids : (string, string) Hashtbl.t) (refs : value list)
    (walked : walked_ast) (options : options) : BM.t * BM.t list =
  let block', properties_tx =
    handle_page_and_block_properties block db page_names_to_uuids refs options
  in
  let block'', pvalues_tx =
    handle_queries block' db page_names_to_uuids walked options
  in
  let block''' =
    match options.user_options.property_classes, collv (getv block "block/refs")
    with
    | _ :: _, _ :: _ ->
      BM.put block'' "block/refs"
        (List
           (List.filter
              (fun r ->
                not
                  (List.mem
                     (Option.value ~default:"" (ref_bm_name r))
                     options.user_options.property_classes))
              (collv (getv block'' "block/refs"))))
    | _ -> block''
  in
  (block''', properties_tx @ pvalues_tx)

(* ---------- block refs (cljs ~1465-1516) ---------- *)

let block_ref_re_unanchored =
  Regexp.compile
    "\\(\\(([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})\\)\\)"

(* convert-block-refs-to-page-refs *)
let convert_block_refs_to_page_refs (title : string) : string =
  Regexp.replace_all block_ref_re_unanchored
    ~f:(fun ~match_ ~groups ~offset:_ ~input:_ ->
      match groups.(1) with
      | Some id -> Page_ref.to_page_ref id
      | None -> match_)
    title

(* update-block-refs *)
let update_block_refs (block : BM.t)
    (page_names_to_uuids : (string, string) Hashtbl.t) : BM.t =
  match collv (getv block "block/refs") with
  | [] -> block
  | refs ->
    let block =
      BM.put block "block/refs"
        (List
           (List.map
              (fun r ->
                match r with
                | Map _ ->
                  let u =
                    match
                      Option.bind (ref_bm_name r)
                        (fun n -> Hashtbl.find_opt page_names_to_uuids n)
                    with
                    | Some u -> u
                    | None ->
                      Option.value ~default:"" (ref_bm_uuid r)
                  in
                  vec [ kw "block/uuid"; Uuid u ]
                | _ -> r)
              refs))
    in
    (match getv block "block/title" with
     | Some (String title) ->
       let title_refs =
         List.filter_map
           (fun r ->
             match r with
             | Vector (Keyword "block/uuid" :: _)
             | List (Keyword "block/uuid" :: _)
             | Tuple (Some (Keyword "block/uuid") :: _) -> None
             | Keyword s when Db_schema.internal_ident s -> None
             | Map _ ->
               Some
                 (mv_of_bm
                    (add_uuid_to_page_map (bm_of_value (Some r))
                       page_names_to_uuids))
             | _ -> Some r)
           refs
       in
       BM.put block "block/title"
         (String
            (convert_block_refs_to_page_refs
               (Db_content.title_ref_to_id_ref ~replace_tag:false title
                  title_refs)))
     | _ -> block)

(* fix-pre-block-references *)
let fix_pre_block_references (block : BM.t)
    (pre_blocks : (string, unit) Hashtbl.t)
    (page_names_to_uuids : (string, string) Hashtbl.t) : BM.t =
  match getv block "block/parent" with
  | Some v ->
    (match coll_items v with
     | _ :: pv :: _ ->
       (match pv with
        | String u | Uuid u when Hashtbl.mem pre_blocks u ->
          let page_uuid =
            match coll_items (Option.value ~default:Nil (getv block "block/page")) with
            | _ :: String n :: _ ->
              get_page_uuid page_names_to_uuids n
                [ "block", mv_of_bm block; "block/page", Option.get (getv block "block/page") ]
            | _ -> u
          in
          BM.put block "block/parent"
            (vec [ kw "block/uuid"; Uuid page_uuid ])
        | _ -> block)
     | _ -> block)
  | None -> block

(* fix-block-name-lookup-ref *)
let fix_block_name_lookup_ref (block : BM.t)
    (page_names_to_uuids : (string, string) Hashtbl.t) : BM.t =
  let block =
    match getv block "block/page" with
    | Some v ->
      (match coll_items v with
       | Keyword "block/name" :: String n :: _ ->
         BM.put block "block/page"
           (vec
              [ kw "block/uuid"
              ; Uuid
                  (get_page_uuid page_names_to_uuids n
                     [ "block", mv_of_bm block; "block/page", v ]) ])
       | _ -> block)
    | None -> block
  in
  match getv block "block/parent" with
  | Some ((Map _) as pm) ->
    (match get_string (bm_of_value (Some pm)) "block/name" with
     | Some n ->
       BM.put block "block/parent"
         (mv_of_bm
            [ "block/uuid"
            , Uuid
                (get_page_uuid page_names_to_uuids n
                   [ "block", mv_of_bm block; "block/parent", pm ]) ])
     | None -> block)
  | _ -> block

(* ---------- assets (cljs ~1519-1700) ---------- *)

let assets_path_re = Regexp.compile "assets/.*$"

(* asset-path->name *)
let asset_path_to_name (path : string option) : string option =
  match path with
  | Some p ->
    (match Regexp.exec assets_path_re p with
     | Some m -> m.groups.(0)
     | None -> if pdf_file (Some p) then Some p else None)
  | None -> None

(* update-asset-links-in-block-title *)
let update_asset_links_in_block_title (block_title : string)
    (asset_name_to_uuids : (string * string) list)
    (ignored_assets : BM.t list ref) : string =
  List.fold_left
    (fun acc (asset_name, asset_uuid) ->
      let re =
        Regexp.compile
          ("!?\\[[^\\]]*?\\]\\([^\\)]*?"
           ^ Common_util.escape_regex_chars asset_name
           ^ "\\)(\\{[^}]*\\})?")
      in
      let new_title =
        Regexp.replace_all re
          ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ ->
            Page_ref.to_page_ref asset_uuid)
          acc
      in
      if Common_util.str_includes new_title asset_name then
        ignored_assets
          := !ignored_assets
             @ [ [ "reason"
                 , strv "Some asset links were not updated to block references"
                 ; "path", strv asset_name
                 ; "location", mv_of_bm [ "block", strv new_title ] ] ];
      new_title)
    block_title asset_name_to_uuids

(* find-annotation-children-blocks *)
let find_annotation_children_blocks (blocks : BM.t list)
    (parent_uuids : string list) : BM.t list =
  let rec descendants acc seen =
    let new_uuids =
      List.filter_map
        (fun b ->
          match getv b "block/parent" with
          | Some v ->
            (match coll_items v with
             | _ :: pv :: _ ->
               (match pv with
                | String u | Uuid u when List.mem u acc ->
                  get_uuid b "block/uuid"
                | _ -> None)
             | _ -> None)
          | None -> None)
        blocks
    in
    let unseen = List.filter (fun u -> not (List.mem u seen)) new_uuids in
    if unseen = [] then seen else descendants unseen (seen @ unseen)
  in
  let all_ = descendants parent_uuids parent_uuids in
  let only_descendants =
    List.filter (fun u -> not (List.mem u parent_uuids)) all_
  in
  List.filter
    (fun b ->
      List.mem
        (Option.value ~default:"" (get_uuid b "block/uuid"))
        only_descendants)
    blocks

(* get-asset-block-id — (get-in @assets [path :asset-id]) *)
let get_asset_block_id (assets : (string, BM.t) Hashtbl.t) (path : string) :
    string option =
  match Hashtbl.find_opt assets path with
  | Some m -> get_uuid m "asset-id"
  | None -> None

(* build-annotation-block *)
let build_annotation_block (m : value) (color_text_idents : (string * string) list)
    (parent_asset : BM.t)
    (image_asset_name_to_uuids : (string * string) list)
    (md_blocks : (string * BM.t) list) (options : options) : BM.t =
  let mb = bm_of_value (Some m) in
  let get_in_bm path =
    match getv mb (List.hd path) with
    | Some v -> get_in_v v (List.tl path)
    | None -> None
  in
  let color =
    match get_in_bm [ "properties"; "color" ] with
    | Some (String c) -> List.assoc_opt c color_text_idents
    | _ -> None
  in
  let hl_page = get_in_bm [ "page" ] in
  let title = get_in_bm [ "content"; "text" ] in
  let user_attrs =
    [ "logseq.property.pdf/hl-color", Option.map kw color
    ; "logseq.property.pdf/hl-page", hl_page
    ; "block/title", title ]
  in
  if List.exists (fun (_, v) -> v = None) user_attrs then
    options.log_fn
      [ kw "missing-annotation-attributes"
      ; strv "Annotation is missing some attributes so set reasonable defaults for them"
      ; kw "annotation"
      ; mv_of_bm
          (List.map (fun (k, v) -> (k, Option.value ~default:Nil v)) user_attrs)
      ; kw "asset"
      ; (Option.value ~default:Nil (getv parent_asset "block/title")) ];
  let id = Option.value ~default:"" (get_uuid mb "id") in
  let asset_image_uuid =
    let needle =
      id
      ^ (match get_in_bm [ "content"; "image" ] with
         | Some (String img) -> "_" ^ img
         | Some v -> "_" ^ Edn_util.pr_str v
         | None -> "")
    in
    List.find_map
      (fun (asset_name, image_uuid) ->
        if Common_util.str_includes asset_name needle then Some image_uuid
        else None)
      image_asset_name_to_uuids
  in
  let md_block = List.assoc_opt id md_blocks in
  let annotation =
    BM.merge
      (BM.merge
         [ "logseq.property.pdf/hl-color", kw "logseq.property/color.yellow"
         ; "logseq.property.pdf/hl-page", Int 1
         ; "block/title", String "" ]
         (List.filter_map
            (fun (k, v) -> Option.map (fun v -> (k, v)) v)
            user_attrs))
      ([ "block/uuid", uuidv id
       ; "block/order", strv (Db_order.gen_key None None)
       ; "logseq.property/ls-type", kw "annotation"
       ; "logseq.property.pdf/hl-value", m
       ; "logseq.property/asset",
         vec
           [ kw "block/uuid"
           ; uuidv
               (Option.value ~default:"" (get_uuid parent_asset "block/uuid")) ]
       ; "block/tags", List [ kw "logseq.class/Pdf-annotation" ]
       ; "block/parent",
         vec
           [ kw "block/uuid"
           ; uuidv
               (Option.value ~default:"" (get_uuid parent_asset "block/uuid")) ]
       ; "block/page", kw "logseq.class/Asset" ]
       @ (match asset_image_uuid with
          | Some u ->
            [ "logseq.property.pdf/hl-image", vec [ kw "block/uuid"; Uuid u ]
            ; "logseq.property.pdf/hl-type", kw "area" ]
          | None -> [])
       @ (match md_block with
          | Some b ->
            (match getv b "block/title" with
             | Some t -> [ "block/title", t ]
             | None -> [])
          | None -> []))
  in
  with_timestamps annotation

(* build-pdf-annotations-tx* *)
let build_pdf_annotations_tx_inner (asset_edn_map : BM.t)
    (parsed_md : extracted) (parent_asset : BM.t)
    (image_asset_name_to_uuids : (string * string) list) (options : options) :
    BM.t list =
  let color_text_idents =
    match
      List.find_opt
        (fun (p : Builtin_data.builtin_property) ->
          p.ident = "logseq.property.pdf/hl-color")
        Builtin_data.built_in_properties
    with
    | Some p ->
      List.filter_map
        (fun (cv : Builtin_data.builtin_closed_value) ->
          match str_opt_of cv.cv_value, cv.cv_db_ident with
          | Some v, Some ident -> Some (v, ident)
          | _ -> None)
        p.closed_values
    | None -> []
  in
  let md_blocks =
    List.filter_map
      (fun b ->
        match get_uuid b "block/uuid" with
        | Some u ->
          Some
            ( u
            , List.filter
                (fun (k, _) ->
                  List.mem k
                    [ "block/title"; "block/order"; "block/parent"
                    ; "block/uuid" ])
                b )
        | None -> None)
      parsed_md.ex_blocks
  in
  let highlights =
    match getv asset_edn_map "edn-content" with
    | Some v -> collv (get_in_v v [ "highlights" ])
    | None -> []
  in
  let annotation_blocks =
    List.map
      (fun m ->
        build_annotation_block m color_text_idents parent_asset
          image_asset_name_to_uuids md_blocks options)
      highlights
  in
  let children =
    find_annotation_children_blocks (List.map snd md_blocks)
      (List.filter_map (fun m -> get_uuid (bm_of_value (Some m)) "id") highlights)
  in
  annotation_blocks
  @ List.map
      (fun b -> with_timestamps (BM.put b "block/page" (kw "logseq.class/Asset")))
      children

(* build-new-asset *)
let build_new_asset (asset_data : BM.t) : BM.t =
  BM.merge
    (with_timestamps
       [ "block/order", strv (Db_order.gen_key None None)
       ; "block/page", kw "logseq.class/Asset"
       ; "block/parent", kw "logseq.class/Asset" ])
    ([ "block/tags", List [ kw "logseq.class/Asset" ]
     ; "logseq.property.asset/type", Option.value ~default:Nil (getv asset_data "type")
     ; "logseq.property.asset/checksum", Option.value ~default:Nil (getv asset_data "checksum")
     ; "logseq.property.asset/size", Option.value ~default:Nil (getv asset_data "size") ]
     @ (match getv asset_data "external-url" with
        | Some url ->
          [ "logseq.property.asset/external-url", url ]
          @ (match getv asset_data "external-file-name" with
             | Some n -> [ "logseq.property.asset/external-file-name", n ]
             | None -> [])
        | None -> []))

(* build-annotation-images *)
let build_annotation_images (parent_asset_paths : string list)
    (assets : (string, BM.t) Hashtbl.t) (options : options) :
    BM.t list * (string * string) list =
  (* cljs #"(?i)\\.pdf$" *)
  let strip_pdf = Regexp.compile ~caseless:true "\\.pdf$" in
  let image_dirs =
    List.map
      (fun p ->
        Common_util.regex_replace strip_pdf ~replacement:"" p)
      parent_asset_paths
  in
  let image_paths =
    Hashtbl.fold (fun p _ acc -> p :: acc) assets []
    |> List.sort compare
    |> List.filter
         (fun p -> List.mem (Gp_node_path.dirname p) image_dirs)
  in
  (* cljs map stops at the shorter seq; keep (basename, uuid) pairs zipped
     the same way so skipped assets do not misalign *)
  let rec zip_shortest xs ys =
    match xs, ys with x :: xs', y :: ys' -> (x, y) :: zip_shortest xs' ys' | _ -> []
  in
  let txs =
    List.filter_map
      (fun p ->
        match get_asset_block_id assets p with
        | None ->
          options.notify_user
            [ "msg"
            , strv
                ("Skipped creating asset "
                 ^ Edn_util.pr_str (String p)
                 ^ " because it has no asset id")
            ; "level", kw "error" ];
          None
        | Some asset_id ->
          let new_asset =
            BM.merge (build_new_asset (Hashtbl.find assets p))
              [ "block/title", strv "pdf area highlight"
              ; "block/uuid", uuidv asset_id ]
          in
          Hashtbl.replace assets p
            (BM.put (Hashtbl.find assets p) "asset-created?" (Bool true));
          Some new_asset)
      image_paths
  in
  ( txs
  , List.filter_map
      (fun (p, tx) ->
        Option.map (fun u -> (Gp_node_path.basename p, u))
          (get_uuid tx "block/uuid"))
      (zip_shortest image_paths txs) )

(* safe-sanitize-file-name *)
let safe_sanitize_file_name (s : string) : string = Sanitize_filename.sanitize s

(* pdf-annotation-edn-path *)
let pdf_annotation_edn_path (parent_asset_path : string) : string =
  Common_path.path_join Common_config.local_assets_dir
    [ safe_sanitize_file_name
        (Gp_node_path.basename
           (Common_util.regex_replace
              (Regexp.compile ~caseless:true "\\.pdf$")
              ~replacement:".edn" parent_asset_path)) ]

(* pdf-annotation-md-name *)
let pdf_annotation_md_name (parent_asset_path : string) : string =
  "hls__"
  ^ safe_sanitize_file_name
      (Gp_node_path.basename
         (Common_util.regex_replace
            (Regexp.compile ~caseless:true "\\.pdf$")
            ~replacement:".md" parent_asset_path))

(* build-pdf-annotations-tx *)
let build_pdf_annotations_tx (parent_asset_paths : string list)
    (assets : (string, BM.t) Hashtbl.t) (parent_asset : BM.t)
    (pdf_annotation_pages : (string, extracted) Hashtbl.t)
    (options : options) : BM.t list =
  let paths = distinct parent_asset_paths in
  match
    List.find_map
      (fun pp ->
        let edn_path = pdf_annotation_edn_path pp in
        match Hashtbl.find_opt assets edn_path with
        | Some edn_map -> Some (edn_map, pdf_annotation_md_name pp)
        | None -> None)
      paths
  with
  | None -> []
  | Some (asset_edn_map, md_name) ->
    let txs, image_name_uuids = build_annotation_images paths assets options in
    txs
    @ build_pdf_annotations_tx_inner asset_edn_map
        (match Hashtbl.find_opt pdf_annotation_pages md_name with
         | Some e -> e
         | None -> { ex_pages = []; ex_blocks = [] })
        parent_asset image_name_uuids options

(* ---------- resolve-asset-data (cljs ~1560) ---------- *)

type asset_resolution =
  { ra_link_or_name : string option
  ; ra_name : string option
  ; ra_path : string option
  ; ra_asset_path : string option
  ; ra_zotero : bool }

let resolve_asset_data (asset_link : value)
    (user_config : (attr * value) list) (linked_files : string list ref)
    (linked_base_dir : string option)
    (zotero_imported_files : (string, value) Hashtbl.t) : asset_resolution =
  let link_map = Option.value ~default:Nil (nth1 asset_link) in
  let path_v = link_url_second asset_link in
  let link_url =
    match path_v with
    | Some ((Map _) as m) -> link_map_to_url m
    | Some (String s) when external_pdf_url (Some s) || windows_drive_path (Some s) ->
      Some s
    | _ -> None
  in
  let remote_url = remote_http_url link_url in
  let file_url =
    match link_url with
    | Some s when Common_util.str_starts_with s "file://" -> Some s
    | _ -> None
  in
  let zotero_path_data =
    match path_v with
    | Some (Map _) ->
      (match link_map with
       | Map _ -> get_zotero_local_pdf_path user_config link_map
       | _ -> None)
    | _ -> None
  in
  let zotero_asset = zotero_path_data <> None in
  let linked_relative =
    if !linked_files <> [] && zotero_asset then begin
      let value = List.hd !linked_files in
      linked_files := List.tl !linked_files;
      Some
        (match Common_util.str_index_of value "attachments:" with
         | Some 0 -> String.sub value 12 (String.length value - 12)
         | _ -> value)
    end else None
  in
  let linked_base =
    match linked_relative with
    | Some r -> Some (Gp_node_path.basename r)
    | None -> None
  in
  let linked_path =
    match linked_relative, linked_base_dir with
    | Some r, Some base when Unicode.trim base <> "" ->
      Some (Gp_node_path.join [ base; r ])
    | _ -> None
  in
  let path', link', base' =
    match linked_path with
    | Some lp ->
      ( Some lp
      , Option.bind zotero_path_data (fun bm -> get_string bm "link")
      , linked_base )
    | None ->
      (match zotero_path_data with
       | Some zbm ->
         ( get_string zbm "path"
         , get_string zbm "link"
         , get_string zbm "base" )
       | None ->
         if remote_url then
           ( link_url
           , link_url
           , Option.bind link_url (fun u ->
                 Option.bind (pdf_target_path u) Common_path.filename) )
         else
           (match file_url with
            | Some fu ->
              ( Some (file_url_to_path fu)
              , Some fu
              , Common_path.filename fu )
            | None ->
              (match path_v with
               | Some (String s) when windows_drive_path (Some s) ->
                 (Some s, Some ("file://" ^ s), Common_path.filename s)
               | _ -> (str_opt_of (Option.value ~default:Nil path_v), None, None))))
  in
  let last_seg (s : string option) : string option =
    match s with
    | Some s -> last_path_segment s
    | None -> None
  in
  let asset_name =
    match linked_path with
    | Some _ -> base'
    | None ->
      if zotero_asset then
        match Option.bind (last_seg link') (Hashtbl.find_opt zotero_imported_files)
        with
        | Some v -> str_opt_of v
        | None -> base'
      else Option.bind path' (fun p -> asset_path_to_name (pdf_target_path p))
  in
  let path =
    match linked_path with
    | Some _ -> path'
    | None ->
      if zotero_asset && asset_name <> None then
        match path', asset_name with
        | Some p, Some n ->
          Some (Common_util.regex_replace (Regexp.compile "[^/]+$") ~replacement:n p)
        | _ -> path'
      else path'
  in
  let asset_link_or_name =
    match link' with Some l -> Some l | None -> asset_name
  in
  let asset_path =
    if zotero_asset then
      match linked_path, linked_relative with
      | Some _, Some rel -> Some ("zotero-link://" ^ rel)
      | _ ->
        (match last_seg link', asset_name with
         | Some seg, Some name ->
           Some ("zotero-path://" ^ seg ^ "/" ^ name)
         | _ -> None)
    else None
  in
  { ra_link_or_name = asset_link_or_name
  ; ra_name = asset_name
  ; ra_path = path
  ; ra_asset_path = asset_path
  ; ra_zotero = zotero_asset }

(* external-linked-pdf? *)
let external_linked_pdf (asset_link_or_name : string option)
    (path : string option) : bool =
  external_pdf_url asset_link_or_name
  || external_pdf_url path
  || windows_drive_path path

(* put-linked-pdf-asset! *)
let put_linked_pdf_asset (assets : (string, BM.t) Hashtbl.t)
    (asset_link_or_name : string) (_path : string option)
    (asset_path : string option) (_stat : File_sys.file_stat option) : unit =
  Hashtbl.replace assets asset_link_or_name
    [ "asset-id", uuidv (squuid ())
    ; "type", strv "pdf"
    ; (* avoid using the real checksum since it could be the same with in-graph asset *)
      "checksum", strv "0000000000000000000000000000000000000000000000000000000000000000"
    ; (* file_stat carries no size field; cljs fell back to 0 *)
      "size", intv 0
    ; "external-url", strv asset_link_or_name
    ; "external-file-name", strv (Option.value ~default:"" asset_path) ]

(* <ensure-asset-data! *)
let ensure_asset_data (assets : (string, BM.t) Hashtbl.t)
    (asset_link_or_name : string option) (path : string option)
    (asset_path : string option) (options : options) : unit Eff.t =
  match asset_link_or_name with
  | Some lon when not (Hashtbl.mem assets lon) && pdf_file path ->
    let external_ = external_linked_pdf asset_link_or_name path in
    let remote_ =
      remote_http_url asset_link_or_name || remote_http_url path
    in
    if remote_ then begin
      put_linked_pdf_asset assets lon path asset_path None;
      Eff.pure ()
    end
    else
      (match options.get_file_stat with
       | Some get ->
         (match path with
          | Some p ->
            Eff.catch (get p) (fun _exn ->
                if external_ then
                  put_linked_pdf_asset assets lon path asset_path None;
                Eff.pure None)
            |> Eff.map
                 (fun stat ->
                   (* a missing local file yields no stat, like a rejected
                      <get-file-stat — only external links still get an asset *)
                   match stat with
                   | Some _ -> put_linked_pdf_asset assets lon path asset_path stat
                   | None ->
                     if external_ then
                       put_linked_pdf_asset assets lon path asset_path None)
          | None -> Eff.pure ())
       | None ->
         if external_ then
           put_linked_pdf_asset assets lon path asset_path None;
         Eff.pure ())
  | _ -> Eff.pure ()

(* build-asset-tx *)
let build_asset_tx (asset_data : BM.t) (asset_name : string option)
    (asset_link_or_name : string) (asset_link : value)
    (pdf_annotation_pages : (string, extracted) Hashtbl.t) (options : options)
    (assets : (string, BM.t) Hashtbl.t) (zotero_asset : bool) :
    (string * string) * BM.t list =
  let metadata =
    match nth1 asset_link with
    | Some (Map _) ->
      (match get_string (bm_of_value (nth1 asset_link)) "metadata" with
       | Some s ->
         (match Edn_util.safe_read_map_string s with
          | Map kvs when kvs <> [] -> Some (Map kvs)
          | _ -> None)
       | None -> None)
    | _ -> None
  in
  let title =
    match asset_name with
    | Some n -> Db_asset.asset_name_to_title (Gp_node_path.basename n)
    | None -> ""
  in
  let new_asset =
    BM.merge (build_new_asset asset_data)
      ([ "block/title", strv title
       ; "block/uuid",
         uuidv
           (Option.value ~default:""
              (get_asset_block_id assets asset_link_or_name)) ]
       @ (match metadata with
          | Some m -> [ "logseq.property.asset/resize-metadata", m ]
          | None -> []))
  in
  let external_file_asset =
    match asset_name with
    | Some n ->
      n <> asset_link_or_name
      || external_pdf_url (Some asset_link_or_name)
      || windows_drive_path (Some n)
    | None -> false
  in
  let pdf_annotations_paths =
    match options.pdf_annotation_file with
    | Some annotation_file ->
      let base = Gp_node_path.basename annotation_file in
      let pdf_base =
        (* cljs #"(?i)\\.md$" *)
        Common_util.regex_replace (Regexp.compile ~caseless:true "\\.md$")
          ~replacement:".pdf"
          (String.sub base 5 (String.length base - 5))
      in
      [ Common_path.path_join Common_config.local_assets_dir [ pdf_base ] ]
    | None ->
      if (zotero_asset || external_file_asset) && asset_name <> None then
        (match asset_name with
         | Some n ->
           [ Common_path.path_join Common_config.local_assets_dir
               [ Gp_node_path.basename n ]
           ; Common_path.path_join Common_config.local_assets_dir [ n ] ]
         | None -> [ asset_link_or_name ])
      else [ Option.value ~default:asset_link_or_name asset_name ]
  in
  let pdf_annotations_tx =
    if List.exists (fun p -> pdf_file (Some p)) pdf_annotations_paths then
      build_pdf_annotations_tx pdf_annotations_paths assets new_asset
        pdf_annotation_pages options
    else []
  in
  let asset_tx = [ new_asset ] @ pdf_annotations_tx in
  Hashtbl.replace assets asset_link_or_name
    (BM.put (Hashtbl.find assets asset_link_or_name) "asset-created?" (Bool true));
  ( (asset_link_or_name, Option.value ~default:"" (get_uuid new_asset "block/uuid"))
  , asset_tx )

(* <handle-assets-in-block *)
let handle_assets_in_block (block : BM.t) (walked : walked_ast)
    (import_state : import_state) (options : options) :
    (BM.t * BM.t list) Eff.t =
  let linked_files = ref !(walked.wa_zotero_linked_files) in
  let linked_base_dir =
    if !linked_files <> [] then
      (match
         config_get_in options.user_config
           [ "zotero/settings-v2"; "default"
           ; "zotero-linked-attachment-base-directory" ]
       with
       | Some (String s) -> Some s
       | _ -> None)
    else None
  in
  match !(walked.wa_asset_links) with
  | [] -> Eff.pure (block, [])
  | asset_links ->
    List.map
      (fun asset_link ->
        let ra =
          resolve_asset_data asset_link options.user_config linked_files
            linked_base_dir walked.wa_zotero_imported_files
        in
        ensure_asset_data import_state.assets ra.ra_link_or_name ra.ra_path
          ra.ra_asset_path options
        |> Eff.map
             (fun () ->
               match ra.ra_link_or_name with
               | Some lon ->
                 (match Hashtbl.find_opt import_state.assets lon with
                  | Some asset_data ->
                    if get_asset_block_id import_state.assets lon = None then begin
                      options.notify_user
                        [ "msg"
                        , strv
                            ("Skipped creating asset "
                             ^ Edn_util.pr_str (String lon)
                             ^ " because it has no asset id")
                        ; "level", kw "error" ];
                      None
                    end
                    else if truthy_opt (getv asset_data "asset-created?") then
                      Some
                        ( ( lon
                          , Option.value ~default:""
                              (get_uuid asset_data "asset-id") )
                        , [] )
                    else
                      Some
                        (build_asset_tx asset_data ra.ra_name lon asset_link
                           import_state.pdf_annotation_pages options
                           import_state.assets ra.ra_zotero)
                  | None ->
                    if not ra.ra_zotero then
                      import_state.ignored_assets
                        := !(import_state.ignored_assets)
                           @ [ [ "reason"
                               , strv "No asset data found for this asset path"
                               ; "path"
                               , Option.value ~default:Nil
                                   (link_url_second asset_link)
                               ; "location"
                               , mv_of_bm
                                   [ "block"
                                   , Option.value ~default:Nil
                                       (getv block "block/title") ] ] ];
                    None)
               | None -> None))
      asset_links
    |> Eff.all
    |> Eff.map
         (fun asset_maps ->
           let asset_maps = List.filter_map Fun.id asset_maps in
           let asset_blocks = List.concat_map snd asset_maps in
           let name_uuids = List.map fst asset_maps in
           let block' =
             BM.put block "block/title"
               (strv
                  (update_asset_links_in_block_title
                     (Option.value ~default:"" (get_string block "block/title"))
                     name_uuids import_state.ignored_assets))
           in
           (block', asset_blocks))

(* ---------- hls linked pdfs (cljs ~1900-1930) ---------- *)

let hls_annotation_md_file (file : string) : bool =
  Common_util.str_starts_with (Gp_node_path.basename file) "hls__"

let pdf_link_re = Regexp.compile "\\[[^\\]]*\\]\\(([^)\\s]+)\\)"

let pdf_url_from_text (s : string) : string option =
  let trimmed = Unicode.trim s in
  let url =
    match Regexp.exec pdf_link_re trimmed with
    | Some m -> m.groups.(1)
    | None -> Some trimmed
  in
  match url with
  | Some u when pdf_file (Some u) ->
    if external_pdf_url (Some u) || windows_drive_path (Some u) then Some u
    else None
  | _ -> None

let url_to_complex_link_map (url : string) : BM.t option =
  if Common_util.str_starts_with url "https://" then
    Some
      [ "protocol", strv "https"
      ; "link", strv (String.sub url 8 (String.length url - 8)) ]
  else if Common_util.str_starts_with url "http://" then
    Some
      [ "protocol", strv "http"
      ; "link", strv (String.sub url 7 (String.length url - 7)) ]
  else if Common_util.str_starts_with url "file://" then
    Some
      [ "protocol", strv "file"
      ; "link", strv (String.sub url 7 (String.length url - 7)) ]
  else if windows_drive_path (Some url) then
    Some [ "protocol", strv "file"; "link", strv url ]
  else None

let synthetic_pdf_asset_link (url : string) : value option =
  match url_to_complex_link_map url with
  | None -> None
  | Some lm ->
    let label =
      Option.value ~default:"pdf" (Common_path.filename url)
    in
    Some
      (vec
         [ String "Link"
         ; mv_of_bm
             [ "url", vec [ String "Complex"; mv_of_bm lm ]
             ; "label", vec [ vec [ String "Plain"; String label ] ]
             ; "full_text", strv ("![" ^ label ^ "](" ^ url ^ ")")
             ; "metadata", strv "" ] ])

let hls_extracted_pdf_urls (e : extracted) : string list =
  distinct
    (List.concat_map
       (fun b ->
         match getv b "block/properties-text-values" with
         | Some (Map kvs) ->
           List.filter_map
             (fun (k, v) ->
               match k with
               | Keyword ("file" | "file-path") ->
                 Option.bind (str_opt_of v) pdf_url_from_text
               | _ -> None)
             kvs
         | _ -> [])
       (e.ex_pages @ e.ex_blocks))

(* <import-hls-linked-pdf-assets! *)
let import_hls_linked_pdf_assets (file : string) (options : options) :
    BM.t list Eff.t =
  match
    Hashtbl.find_opt options.import_state.pdf_annotation_pages
      (Gp_node_path.basename file)
  with
  | None -> Eff.pure []
  | Some extracted ->
    let urls = hls_extracted_pdf_urls extracted in
    let asset_links = List.filter_map synthetic_pdf_asset_link urls in
    if asset_links = [] then Eff.pure []
    else
      let wa = new_walked_ast () in
      wa.wa_asset_links := asset_links;
      let options' = { options with pdf_annotation_file = Some file } in
      handle_assets_in_block [ "block/title", strv "" ] wa options.import_state
        options'
      |> Eff.map snd

(* ---------- quotes / math / code / embeds (cljs ~1940-2158) ---------- *)

let rec quote_node_to_markdown (quote_node : value) (options : options)
    (depth : int) : string =
  let inner =
    match coll_items quote_node with
    | _ :: els :: _ -> coll_items els
    | _ -> []
  in
  let parts =
    List.map
      (fun el ->
        match coll_items el with
        | String "Quote" :: _ ->
          quote_node_to_markdown el options (depth + 1)
        | _ ->
          let text = ast_to_text el options in
          if depth > 0 then
            String.concat "\n"
              (List.map
                 (fun l -> "> " ^ l)
                 (String.split_on_char '\n' text))
          else text)
      inner
  in
  String.concat "\n"
    (List.filter (fun t -> String.trim t <> "") parts)

(* cljs #"(?i)#\\+BEGIN_QUOTE" *)
let org_quote_re = Regexp.compile ~caseless:true "#\\+BEGIN_QUOTE"

(* handle-quotes — cljs ~1950 *)
let handle_quotes (block : BM.t) (options : options) : BM.t =
  let ast_blocks = collv (getv block "block.temp/ast-blocks") in
  let el_type (el : value) : string option =
    match coll_items el with String t :: _ -> Some t | _ -> None
  in
  let heading =
    List.find_opt (fun el -> el_type el = Some "Heading") ast_blocks
  in
  let heading_empty =
    match heading with
    | None -> true
    | Some h ->
      (match coll_items h with
       | _ :: m :: _ ->
         (match Clj_value.map_get_opt m "title" with
          | Some (String t) -> String.trim t = ""
          | Some v -> coll_items v = []
          | None -> true)
       | _ -> true)
  in
  let body_elements =
    List.filter (fun el -> el_type el <> Some "Heading") ast_blocks
  in
  let all_body_quotes =
    body_elements <> []
    && List.for_all (fun el -> el_type el = Some "Quote") body_elements
  in
  let has_quote_body =
    List.exists (fun el -> el_type el = Some "Quote") body_elements
  in
  let org_quote =
    match get_string block "block/title" with
    | Some t -> Regexp.test org_quote_re t
    | None -> false
  in
  if heading_empty && all_body_quotes then
    let combined_title =
      String.concat "\n"
        (List.filter
           (fun t -> String.trim t <> "")
           (List.map
              (fun el -> quote_node_to_markdown el options 0)
              body_elements))
    in
    BM.merge block
      [ "block/title", String combined_title
      ; "logseq.property.node/display-type", kw "quote"
      ; "block/tags", List [ kw "logseq.class/Quote-block" ] ]
  else if has_quote_body && org_quote then begin
    let ordered_blocks =
      match ast_blocks with
      | first :: rest -> first :: List.rev rest
      | [] -> []
    in
    let tagged_parts =
      List.filter_map
        (fun el ->
          let text =
            match el_type el with
            | Some "Heading" ->
              (match coll_items el with
               | _ :: m :: _ ->
                 (match Clj_value.map_get_opt m "title" with
                  | Some t ->
                    ast_to_text (List [ String "Paragraph"; t ]) options
                  | None -> "")
               | _ -> "")
            | Some "Quote" -> quote_node_to_markdown el options 1
            | _ -> ast_to_text el options
          in
          if String.trim text = "" then None
          else Some (el_type el = Some "Quote", text))
        ordered_blocks
    in
    let combined, _ =
      List.fold_left
        (fun (result, prev_quote) (is_quote, text) ->
          ( (if String.trim result = "" then text
             else
               result ^ (if prev_quote then "\n\n" else "\n") ^ text)
          , is_quote ))
        ("", false) tagged_parts
    in
    BM.put block "block/title" (String combined)
  end
  else block

(* handle-math — cljs ~2015; a block whose whole title is one $$ formula
   becomes a #Math-block *)
let handle_math (block : BM.t) : BM.t =
  match get_string block "block/title" with
  | Some raw ->
    let title = String.trim raw in
    let n = String.length title in
    if n > 4 && String.sub title 0 2 = "$$"
       && String.sub title (n - 2) 2 = "$$"
       && not
            (Common_util.str_includes
               (String.sub title 2 (n - 4))
               "$$")
    then
      let math_content = String.trim (String.sub title 2 (n - 4)) in
      BM.merge block
        [ "block/title", String math_content
        ; "logseq.property.node/display-type", kw "math"
        ; "block/tags", List [ kw "logseq.class/Math-block" ] ]
    else block
  | None -> block


let fence_line_re = Regexp.compile "^```.*$"

type code_seg = { cs_text : string; cs_lang : string option }

(* split-title-by-code-fences — line scanner collecting non-code text parts and
   fenced code segments; cs_lang is None when the opening fence has no tag *)
let split_title_by_code_fences (title : string) : string list * code_seg list =
  let lines = String.split_on_char '\n' title in
  let rec loop remaining in_code lang current text_parts code_segs =
    match remaining with
    | [] ->
      ( (match current with
         | [] -> text_parts
         | _ -> text_parts @ [ String.concat "\n" (List.rev current) ])
      , List.rev code_segs )
    | line :: rest ->
      let trimmed = Unicode.trim line in
      if not in_code && Regexp.test fence_line_re trimmed then
        let lang' =
          let l = String.sub trimmed 3 (String.length trimmed - 3) in
          if Unicode.trim l = "" then None else Some l
        in
        loop rest true lang' []
          (match current with
           | [] -> text_parts
           | _ -> text_parts @ [ String.concat "\n" (List.rev current) ])
          code_segs
      else if in_code && trimmed = "```" then
        loop rest false None [] text_parts
          ({ cs_text = String.concat "\n" (List.rev current)
           ; cs_lang = lang }
           :: code_segs)
      else loop rest in_code lang (line :: current) text_parts code_segs
  in
  loop lines false None [] [] []

let build_code_snippet_child_blocks (parent_block : BM.t)
    (code_segs : code_seg list) : BM.t list =
  List.map
    (fun seg ->
      let b =
        with_timestamps
          [ "block/uuid", uuidv (squuid ())
          ; "block/title", strv seg.cs_text
          ; "block/parent",
            vec
              [ kw "block/uuid"
              ; uuidv
                  (Option.value ~default:""
                     (get_uuid parent_block "block/uuid")) ]
          ; "block/page",
            Option.value ~default:Nil (getv parent_block "block/page")
          ; "block/order", strv (Db_order.gen_key None None)
          ; "block/tags", List [ kw "logseq.class/Code-block" ]
          ; "logseq.property.node/display-type", kw "code" ]
      in
      match seg.cs_lang with
      | Some lang -> BM.put b "logseq.property.code/lang" (strv lang)
      | None -> b)
    code_segs

let handle_embeds (block : BM.t)
    (page_names_to_uuids : (string, string) Hashtbl.t) (walked : walked_ast)
    (options : options) : BM.t =
  match !(walked.wa_embeds) with
  | [] -> block
  | embed_node :: _ ->
    let args =
      match nth1 embed_node with
      | Some m ->
        coll_items (Option.value ~default:Nil (Clj_value.map_get_opt m "arguments"))
      | None -> []
    in
    let first_arg =
      match args with a :: _ -> str_opt_of a | [] -> None
    in
    let first_arg_s = Option.value ~default:"" first_arg in
    if Page_ref.is_page_ref first_arg_s then
      let page_uuid =
        get_page_uuid page_names_to_uuids
          (match
             Option.bind (match args with h :: _ -> Some h | [] -> None)
               (fun v -> str_opt_of v)
             |> Fun.flip Option.bind Gp_text.get_page_name
             |> Option.map Common_util.page_name_sanity_lc
           with
           | Some n -> n
           | _ -> "")
          [ "block", mv_of_bm block ]
      in
      BM.merge block
        [ "block/title", String ""
        ; "block/link", vec [ kw "block/uuid"; uuidv page_uuid ] ]
    else if Block_ref.block_ref first_arg_s then
      (match Block_ref.get_block_ref_id first_arg_s with
       | Some u ->
         BM.merge block
           [ "block/title", String ""
           ; "block/link", vec [ kw "block/uuid"; Uuid u ] ]
       | None -> block)
    else begin
      options.log_fn
        [ kw "invalid-embed-arguments"
        ; strv "Ignore embed because of invalid arguments"
        ; kw "args"
        ; vec args ];
      block
    end

let dissoc_nil_block_refs (block : BM.t) : BM.t =
  match getv block "block/refs" with
  | Some Nil | None -> BM.dissoc block [ "block/refs" ]
  | _ -> block

let at_least_two (s : string) (substr : string) : bool =
  if substr = "" then false
  else
    let n = String.length s and m = String.length substr in
    let rec find i cnt =
      if cnt >= 2 then true
      else if i + m > n then false
      else if String.sub s i m = substr then find (i + m) (cnt + 1)
      else find (i + 1) cnt
    in
    find 0 0

let newline_runs_re = Regexp.compile "\\n{2,}"

let handle_code_blocks (block : BM.t) (options : options) : BM.t * BM.t list =
  match getv block "block/title" with
  | Some (String title) when at_least_two title "```" ->
    let text_parts, code_segs = split_title_by_code_fences title in
    let pure_single_code =
      List.length code_segs = 1
      && List.for_all (fun s -> Unicode.trim s = "") text_parts
    in
    let has_mixed_content =
      options.user_options.extract_code_snippets
      && code_segs <> []
      && List.exists (fun s -> Unicode.trim s <> "") text_parts
    in
    if pure_single_code then
      let seg = List.hd code_segs in
      let b =
        BM.merge block
          [ "block/title", String seg.cs_text
          ; "block/tags", List [ kw "logseq.class/Code-block" ]
          ; "logseq.property.node/display-type", kw "code" ]
      in
      let b =
        match seg.cs_lang with
        | Some lang -> BM.put b "logseq.property.code/lang" (strv lang)
        | None -> b
      in
      (b, [])
    else if has_mixed_content then
      let remaining_title =
        Unicode.trim
          (Common_util.regex_replace newline_runs_re ~replacement:"\n"
             (String.concat "\n" text_parts))
      in
      let updated = BM.put block "block/title" (String remaining_title) in
      (updated, build_code_snippet_child_blocks updated code_segs)
    else (block, [])
  | _ -> (block, [])

(* ---------- block tx chain (cljs ~2160-2228) ---------- *)

let build_block_tx_core (db : db) (block : BM.t)
    (per_file_state : per_file_state) (walked : walked_ast)
    (options : options) : BM.t * BM.t list =
  let block', properties_tx =
    handle_block_properties block db per_file_state.pfs_page_names_to_uuids
      (collv (getv block "block/refs")) walked options
  in
  let block_after, deadline_tx =
    update_block_deadline_and_scheduled db block'
      per_file_state.pfs_page_names_to_uuids options
  in
  (block_after, properties_tx @ deadline_tx)

let complete_block_tx_data (db : db) (block_src : BM.t)
    (block_after_assets : BM.t) (pre_blocks : (string, unit) Hashtbl.t)
    (per_file_state : per_file_state) (walked : walked_ast)
    (options : options) (properties_tx : BM.t list)
    (asset_blocks_tx : BM.t list) : BM.t list =
  let journal_page_created_at =
    match getv block_src "block/page" with
    | Some v ->
      (match coll_items v with
       | _ :: pv :: _ ->
         Option.bind (str_opt_of pv)
           (Hashtbl.find_opt options.journal_created_ats)
       | _ -> None)
    | None -> None
  in
  let prepared =
    match journal_page_created_at with
    | Some ms ->
      BM.put block_after_assets "block/created-at" (Common_util.value_of_ms ms)
    | None -> block_after_assets
  in
  let block' =
    prepared
    |> (fun b -> fix_pre_block_references b pre_blocks per_file_state.pfs_page_names_to_uuids)
    |> (fun b -> fix_block_name_lookup_ref b per_file_state.pfs_page_names_to_uuids)
    |> (fun b -> update_block_refs b per_file_state.pfs_page_names_to_uuids)
    |> dissoc_nil_block_refs
    |> (fun b ->
          update_block_tags b db options.user_options per_file_state
            options.import_state.all_idents)
    |> (fun b ->
          handle_embeds b per_file_state.pfs_page_names_to_uuids walked options)
    |> (fun b -> handle_quotes b options)
    |> handle_math
    |> (fun b -> update_block_marker b db options)
    |> (fun b -> update_block_priority b options)
    |> update_block_heading
    |> (fun b -> add_missing_timestamps_opts options b)
    |> fun b -> BM.dissoc b [ "block/format"; "block.temp/ast-blocks" ]
  in
  let final_block, code_children = handle_code_blocks block' options in
  properties_tx @ asset_blocks_tx @ [ final_block ] @ code_children

let build_block_tx_sync (db : db) (block : BM.t)
    (pre_blocks : (string, unit) Hashtbl.t) (per_file_state : per_file_state)
    (walked : walked_ast) (options : options) : BM.t list =
  let block_after, properties_tx =
    build_block_tx_core db block per_file_state walked options
  in
  complete_block_tx_data db block block_after pre_blocks per_file_state walked
    options properties_tx []

let build_block_tx (db : db) (block : BM.t)
    (pre_blocks : (string, unit) Hashtbl.t) (per_file_state : per_file_state)
    (walked : walked_ast) (options : options) : BM.t list Eff.t =
  let block_after, properties_tx =
    build_block_tx_core db block per_file_state walked options
  in
  if !(walked.wa_asset_links) <> [] then
    handle_assets_in_block block_after walked options.import_state options
    |> Eff.map
         (fun (block_after_assets, asset_blocks_tx) ->
           complete_block_tx_data db block block_after_assets pre_blocks
             per_file_state walked options properties_tx asset_blocks_tx)
  else
    Eff.pure
      (complete_block_tx_data db block block_after pre_blocks per_file_state
         walked options properties_tx [])

(* index-walked-ast-blocks *)
let index_walked_ast_blocks (user_config : (attr * value) list)
    (blocks : BM.t list) : (string, walked_ast) Hashtbl.t =
  let tbl = Hashtbl.create (List.length blocks) in
  List.iter
    (fun b ->
      match get_uuid b "block/uuid" with
      | Some u ->
        Hashtbl.replace tbl u
          (walk_ast_blocks user_config (collv (getv b "block.temp/ast-blocks")))
      | None -> ())
    blocks;
  tbl

let empty_walked () : walked_ast = new_walked_ast ()

let block_has_asset_links (walked_by_uuid : (string, walked_ast) Hashtbl.t)
    (block : BM.t) : bool =
  match get_uuid block "block/uuid" with
  | Some u ->
    (match Hashtbl.find_opt walked_by_uuid u with
     | Some wa -> !(wa.wa_asset_links) <> []
     | None -> false)
  | None -> false

let walked_of (walked_by_uuid : (string, walked_ast) Hashtbl.t)
    (block : BM.t) : walked_ast =
  match get_uuid block "block/uuid" with
  | Some u ->
    (match Hashtbl.find_opt walked_by_uuid u with
     | Some wa -> wa
     | None -> empty_walked ())
  | None -> empty_walked ()

(* <build-blocks-tx *)
let build_blocks_tx (conn : conn) (blocks : BM.t list)
    (pre_blocks : (string, unit) Hashtbl.t) (per_file_state : per_file_state)
    (tx_options : options) (walked_by_uuid : (string, walked_ast) Hashtbl.t) :
    BM.t list Eff.t =
  let blocks' =
    List.filter_map
      (fun b ->
        if truthy_opt (getv b "block/pre-block?") then None
        else Some (BM.dissoc b [ "block/pre-block?" ]))
      blocks
  in
  let rec loop acc = function
    | [] -> Eff.pure (List.rev acc)
    | block :: rest ->
      let db = Datascript.db conn in
      if block_has_asset_links walked_by_uuid block then
        build_block_tx db block pre_blocks per_file_state
          (walked_of walked_by_uuid block) tx_options
        |> Fun.flip Eff.bind
             (fun tx_data -> loop (List.rev_append tx_data acc) rest)
      else
        loop
          (List.rev_append
             (build_block_tx_sync db block pre_blocks per_file_state
                (walked_of walked_by_uuid block) tx_options)
             acc)
          rest
  in
  loop [] blocks' 

(* ---------- page tx ---------- *)


(* db-malli-schema/user-property? on a keyword name *)
let user_property_kw (s : string) : bool =
  match Db_property.namespace_of s with
  | Some ns -> Db_property.user_property_namespace ns
  | None -> false

(* db-malli-schema/class? on a db-ident name *)
let class_ident_kw (s : string) : bool =
  match Db_property.namespace_of s with
  | Some ns -> Ns_util.str_contains ns ".class"
  | None -> false

let update_page_alias (m : BM.t)
    (page_names_to_uuids : (string, string) Hashtbl.t) : BM.t =
  match getv m "block/alias" with
  | None -> m
  | Some aliases ->
    BM.put m "block/alias"
      (vec
         (List.map
            (fun a ->
              let ab = bm_of_value (Some a) in
              vec
                [ kw "block/uuid"
                ; uuidv
                    (get_page_uuid page_names_to_uuids
                       (Option.value ~default:""
                          (get_string ab "block/name"))
                       [ "block", a ]) ])
            (coll_items aliases)))

let build_new_page_or_class (m : BM.t) (db : db)
    (per_file_state : per_file_state) (all_idents : (string, string) Hashtbl.t)
    (options : options) : BM.t =
  let m =
    if getv m "block/title" = None then
      BM.put m "block/title"
        (Option.value ~default:Nil (getv m "block/name"))
    else m
  in
  let m =
    if collv (getv m "block/alias") <> [] then
      update_page_alias m per_file_state.pfs_page_names_to_uuids
    else m
  in
  let m =
    match get_string m "block/name" with
    | Some n ->
      (match Hashtbl.find_opt options.journal_created_ats n with
       | Some ms -> BM.put m "block/created-at" (Common_util.value_of_ms ms)
       | None -> m)
    | None -> m
  in
  m
  |> add_missing_timestamps_opts options
  |> (fun b ->
        update_page_tags b db options.user_options per_file_state all_idents)
  |> fun b -> BM.dissoc b [ export_attr "file-page?" ]

let get_page_parents (node : BM.t)
    (all_existing_page_uuids : (string, BM.t) Hashtbl.t) : BM.t list option =
  let get_parent (n : BM.t) : BM.t option =
    let parent_v =
      match getv n "logseq.property.class/extends" with
      | Some v -> Some v
      | None -> getv n "block/parent"
    in
    match
      Option.bind parent_v (fun v ->
        get_uuid (bm_of_value (Some v)) "block/uuid")
    with
    | Some pid ->
      (match Hashtbl.find_opt all_existing_page_uuids pid with
       | Some p -> Some p
       | None ->
         invalid_arg
           ("No parent page found for " ^ Edn_util.pr_str (Uuid pid)))
    | None -> None
  in
  match get_parent node with
  | None -> None
  | Some parent ->
    let rec loop current parents =
      match current with
      | Some p when not (List.exists (fun q -> q = p) parents) ->
        loop (get_parent p) (parents @ [ p ])
      | _ -> List.rev parents
    in
    Some (loop (Some parent) [])

(* ident keyword of a tag value as it appears in saved tx nodes — plain
   keyword, {:db/id kw} map, or [:block/uuid u] style vectors are all seen *)
let saved_tag_ident (v : value) : string option =
  match v with
  | Keyword s | String s -> Some s
  | Map pairs ->
    List.find_map
      (fun (k, v) ->
        match Clj_value.string_of_kwish k with
        | Some "db/id" ->
          (match v with
          | Keyword s | String s -> Some s
          | _ -> None)
        | _ -> None)
      pairs
  | _ -> None

let saved_tag_mem (ident : string) (tags : value list) : bool =
  List.exists (fun t -> saved_tag_ident t = Some ident) tags

let bm_has_tag (m : BM.t) (ident : string) : bool =
  saved_tag_mem ident (collv (getv m "block/tags"))

let page_name_lookup_key (p : BM.t)
    (classes_from_property_parents : (string, unit) Hashtbl.t)
    (all_existing_page_uuids : (string, BM.t) Hashtbl.t) : string =
  let tags = collv (getv p "block/tags") in
  let title = Option.value ~default:"" (get_string p "block/title") in
  match
    (saved_tag_mem "logseq.class/Tag" tags
     || saved_tag_mem "logseq.class/Page" tags)
    && not (Hashtbl.mem classes_from_property_parents title)
    && get_page_parents p all_existing_page_uuids <> None
  with
  | true ->
    let parents =
      match get_page_parents p all_existing_page_uuids with
      | Some ps -> ps
      | None -> []
    in
    List.map
      (fun q -> Option.value ~default:"" (get_string q "block/name"))
      (parents @ [ p ])
    |> String.concat "/"
  | false -> Option.value ~default:"" (get_string p "block/name")

(* index-saved-page-names! — name -> uuid for pages saved from one file *)
let index_saved_page_names (import_state : import_state) (pages : BM.t list)
    : unit =
  let uuid_to_page = import_state.all_existing_page_uuids in
  let classes = import_state.classes_from_property_parents in
  List.iter
    (fun p ->
      match get_uuid p "block/uuid" with
      | Some uuid
        when not
               (saved_tag_mem "logseq.class/Property"
                  (collv (getv p "block/tags")))
             && not
                  (match getv p "db/ident" with
                   | Some (Keyword i) | Some (String i) -> user_property_kw i
                   | _ -> false) ->
        let key = page_name_lookup_key p classes uuid_to_page in
        Hashtbl.replace import_state.page_names_to_uuids key uuid
      | _ -> ())
    pages

(* get-page-names-to-uuids — immutable snapshot of the saved page index *)
let get_page_names_to_uuids (import_state : import_state) :
    (string, string) Hashtbl.t =
  Hashtbl.copy import_state.page_names_to_uuids

let block_uuid_ref (v : value) : bool =
  match v with
  | Vector (Keyword "block/uuid" :: _) | List (Keyword "block/uuid" :: _) -> true
  | _ -> false

let lookup_imported_page_uuid (db : db)
    (all_existing_page_uuids : (string, string) Hashtbl.t)
    (page_name : string option) : string option =
  match page_name with
  | None -> None
  | Some name ->
    (match Hashtbl.find_opt all_existing_page_uuids name with
     | Some u -> Some u
     | None ->
       (match Ldb.get_page db (String name) with
        | Some e when not (Ldb.built_in e) && not (Ldb.is_property e) ->
          (match Ldb.value e "block/uuid" with
           | Some (Uuid u) -> Some u
           | _ -> None)
        | _ -> None))

(* ---------- journal helpers ---------- *)

let journal_file_re =
  Regexp.compile "(?:^|/)journals/(\\d{4}_\\d{2}_\\d{2})\\.(?:md|markdown|org)$"

let journal_file_title (path : string) : string option =
  let normalized =
    Unicode.lowercase (Common_util.str_replace_all path "\\" "/")
  in
  match Regexp.exec journal_file_re normalized with
  | Some m -> m.groups.(1)
  | None -> None

let journal_file_created_at (file : string) : int64 option =
  match journal_file_title file with
  | Some t ->
    (match
       Date_time_util.journal_title_to_int ~formatters:[ "yyyy_MM_dd" ] t
     with
     | Some day -> Some (Date_time_util.int_to_local_ms day)
     | None -> None)
  | None -> None

let month_names =
  [| "January"; "February"; "March"; "April"; "May"; "June"; "July"
   ; "August"; "September"; "October"; "November"; "December" |]

let month_names_short =
  [| "Jan"; "Feb"; "Mar"; "Apr"; "May"; "Jun"; "Jul"; "Aug"; "Sep"; "Oct"
   ; "Nov"; "Dec" |]

let weekday_names_short =
  [| "Sun"; "Mon"; "Tue"; "Wed"; "Thu"; "Fri"; "Sat" |]

let weekday_names_long =
  [| "Sunday"; "Monday"; "Tuesday"; "Wednesday"; "Thursday"; "Friday"
   ; "Saturday" |]

let ordinal_suffix (d : int) : string =
  if d >= 11 && d <= 13 then "th"
  else match d mod 10 with 1 -> "st" | 2 -> "nd" | 3 -> "rd" | _ -> "th"

(* date-time-util/int->journal-title — cljs-time format of a yyyyMMdd int *)
let int_to_journal_title (day : int) (formatter : string) : string =
  let y = day / 10000 and m = (day / 100) mod 100 and d = day mod 100 in
  let days =
    Int64.to_int (Int64.div (Date_time_util.int_to_local_ms day) 86400000L)
  in
  (* 1970-01-01 is a Thursday (index 4, Sunday = 0) *)
  let wd = (((days + 4) mod 7) + 7) mod 7 in
  let n = String.length formatter in
  let buf = Buffer.create 32 in
  let starts i (t : string) =
    i + String.length t <= n && String.sub formatter i (String.length t) = t
  in
  let rec go i =
    if i < n then
      if starts i "yyyy" then begin
        Buffer.add_string buf (Printf.sprintf "%04d" y);
        go (i + 4)
      end
      else if starts i "yy" then begin
        Buffer.add_string buf (Printf.sprintf "%02d" (y mod 100));
        go (i + 2)
      end
      else if starts i "MMMM" then begin
        Buffer.add_string buf month_names.(m - 1);
        go (i + 4)
      end
      else if starts i "MMM" then begin
        Buffer.add_string buf month_names_short.(m - 1);
        go (i + 3)
      end
      else if starts i "MM" then begin
        Buffer.add_string buf (Printf.sprintf "%02d" m);
        go (i + 2)
      end
      else if starts i "dd" then begin
        Buffer.add_string buf (Printf.sprintf "%02d" d);
        go (i + 2)
      end
      else if starts i "do" then begin
        Buffer.add_string buf (string_of_int d ^ ordinal_suffix d);
        go (i + 2)
      end
      else if starts i "EEEE" then begin
        Buffer.add_string buf weekday_names_long.(wd);
        go (i + 4)
      end
      else if starts i "EEE" then begin
        Buffer.add_string buf weekday_names_short.(wd);
        go (i + 3)
      end
      else if starts i "E" then begin
        Buffer.add_string buf weekday_names_short.(wd);
        go (i + 1)
      end
      else begin
        Buffer.add_char buf formatter.[i];
        go (i + 1)
      end
  in
  go 0;
  Buffer.contents buf

let journal_page_name_uuid_entries (file : BM.t) : (string * string) list =
  match get_string file "path" with
  | Some path ->
    (match journal_file_title path with
     | Some title ->
       (match
          Date_time_util.journal_title_to_int ~formatters:[ "yyyy_MM_dd" ]
            title
        with
        | Some day ->
          let uuid = Common_uuid.gen_journal_page_uuid day in
          let canonical =
            Common_util.page_name_sanity_lc
              (int_to_journal_title day
                 Date_time_util.default_journal_title_formatter)
          in
          [ title, uuid; canonical, uuid ]
        | None -> [])
     | None -> [])
  | None -> []

let index_journal_page_name_uuids (doc_files : BM.t list)
    (import_state : import_state) : unit =
  List.iter
    (fun (k, v) ->
      Hashtbl.replace import_state.journal_page_name_uuids k v)
    (List.concat_map journal_page_name_uuid_entries doc_files)

(* ---------- existing / modified pages ---------- *)

let build_existing_page (m : BM.t) (db : db) (page_uuid : string)
    (per_file_state : per_file_state) (options : options) : BM.t option =
  let file_page = truthy_opt (getv m (export_attr "file-page?")) in
  let file_times =
    file_page && getv m "block/journal-day" = None
    && (options.file_created_at <> None || options.file_updated_at <> None)
  in
  let m =
    let m = BM.dissoc m [ export_attr "file-page?" ] in
    if file_times then
      let m =
        match pick_opt options.file_created_at options.file_updated_at with
        | Some ms -> BM.put m "block/created-at" (Common_util.value_of_ms ms)
        | None -> m
      in
      match pick_opt options.file_updated_at options.file_created_at with
      | Some ms -> BM.put m "block/updated-at" (Common_util.value_of_ms ms)
      | None -> m
    else m
  in
  let disallowed =
    [ "block/name"; "block/uuid"; "block/format"; "block/title"
    ; "block/journal-day"; "block/created-at"; "block/updated-at" ]
  in
  let allowed =
    [ "block/tags"; "block/alias"; "block/parent"
    ; "logseq.property.class/extends"; "db/ident" ]
    @ List.filter_map
        (fun (k, _) -> if user_property_kw k then Some k else None) m
    @ (if file_times then [ "block/created-at"; "block/updated-at" ] else [])
  in
  let block_changes = List.filter (fun (k, _) -> List.mem k allowed) m in
  let ignored =
    List.filter (fun (k, _) -> not (List.mem k (disallowed @ allowed))) m
  in
  if ignored <> [] then
    options.notify_user
      [ "msg",
        strv
          ("Import ignored the following attributes on page "
           ^ Edn_util.pr_str
               (Option.value ~default:Nil (getv m "block/title"))
           ^ ": " ^ Edn_util.pr_str (mv_of_bm ignored)) ];
  if block_changes = [] then None
  else
    let b = block_changes @ [ "block/uuid", uuidv page_uuid ] in
    let b =
      if collv (getv m "block/alias") <> [] then
        update_page_alias b per_file_state.pfs_page_names_to_uuids
      else b
    in
    let b =
      if getv m "block/tags" <> None then
        update_page_tags b db options.user_options per_file_state
          options.import_state.all_idents
      else b
    in
    Some b

let modify_page_tx (page : BM.t)
    (all_existing_page_uuids : (string, string) Hashtbl.t) : BM.t =
  let name = Option.value ~default:"" (get_string page "block/name") in
  let page' =
    if Hashtbl.mem all_existing_page_uuids name then
      match getv page "block/namespace" with
      | Some _ ->
        BM.put page "block/uuid"
          (uuidv
             (match Hashtbl.find_opt all_existing_page_uuids name with
              | Some u -> u
              | None ->
                invalid_arg
                  ("No uuid found for existing namespace page "
                   ^ Edn_util.pr_str (String name))))
      | None -> page
    else
      let built_in_name =
        List.mem name all_built_in_names && name <> "card"
      in
      let p =
        if built_in_name then BM.put page "block/uuid" (uuidv (squuid ()))
        else page
      in
      if built_in_name && getv p "block/tags" = None then
        BM.put p "block/tags" (List [ kw "logseq.class/Page" ])
      else p
  in
  let page'' = BM.dissoc page' [ "block/format" ] in
  match getv page "block/namespace", getv page "block/journal-day" with
  | Some _, None ->
    let b = build_new_namespace_page page'' in
    BM.merge b
      [ ( export_attr "original-name"
        , Option.value ~default:Nil (getv page'' "block/name") )
      ; ( export_attr "original-title"
        , Option.value ~default:Nil (getv page'' "block/title") ) ]
  | _ -> page''

(* sanitize-page-aliases-for-import! — drops conflicting alias declarations *)
let sanitize_page_aliases_for_import (pages : BM.t list)
    (import_state : import_state) : BM.t list =
  let batch_alias_to_owner = Hashtbl.create 63 in
  List.iter
    (fun page ->
      let canonical = Option.value ~default:"" (get_string page "block/name") in
      List.iter
        (fun a ->
          let an =
            Option.value ~default:""
              (get_string (bm_of_value (Some a)) "block/name")
          in
          if not (Hashtbl.mem batch_alias_to_owner an) then
            Hashtbl.replace batch_alias_to_owner an canonical)
        (collv (getv page "block/alias")))
    pages;
  let batch_pages_with_aliases =
    List.filter_map
      (fun p ->
        if collv (getv p "block/alias") <> [] then get_string p "block/name"
        else None)
      pages
  in
  let cross_file_alias_owners =
    Hashtbl.fold (fun _ v acc -> v :: acc) import_state.alias_owners []
  in
  let ignore_ reason canonical aname =
    import_state.ignored_properties :=
      !(import_state.ignored_properties)
      @ [ [ "property", kw "block/alias"
          ; "value", strv aname
          ; "location", strv canonical
          ; "reason", kw reason ] ]
  in
  List.map
    (fun page ->
      match collv (getv page "block/alias") with
      | [] -> page
      | aliases ->
        let canonical =
          Option.value ~default:"" (get_string page "block/name")
        in
        if Hashtbl.mem import_state.alias_owners canonical then begin
          List.iter
            (fun a ->
              let an =
                Option.value ~default:""
                  (get_string (bm_of_value (Some a)) "block/name")
              in
              ignore_ "alias/source-is-alias" canonical an)
            aliases;
          BM.dissoc page [ "block/alias" ]
        end
        else begin
          let valid =
            List.filter
              (fun a ->
                let aname =
                  Option.value ~default:""
                    (get_string (bm_of_value (Some a)) "block/name")
                in
                if aname = canonical then begin
                  ignore_ "alias/self" canonical aname;
                  false
                end
                else
                  match Hashtbl.find_opt import_state.alias_owners aname with
                  | Some o when o <> canonical ->
                    ignore_ "alias/duplicate-owner" canonical aname;
                    false
                  | _ ->
                    if List.mem aname cross_file_alias_owners then begin
                      ignore_ "alias/alias-owns-aliases" canonical aname;
                      false
                    end
                    else if List.mem aname batch_pages_with_aliases then begin
                      ignore_ "alias/alias-owns-aliases" canonical aname;
                      false
                    end
                    else true)
              aliases
          in
          List.iter
            (fun a ->
              match get_string (bm_of_value (Some a)) "block/name" with
              | Some an ->
                Hashtbl.replace import_state.alias_owners an canonical
              | None -> ())
            valid;
          if valid <> [] then BM.put page "block/alias" (vec valid)
          else BM.dissoc page [ "block/alias" ]
        end)
    pages

(* Values built in this module carry lookup-refs as raw
   [Vector [Keyword a; v]] (cljs [:block/uuid uuid]); normalize them into
   Ref_to so entity_tx resolves them like datascript map-tx does. *)
let normalize_bm (m : BM.t) : BM.t =
  List.map (fun (a, v) -> (a, Block_map.normalize_value v)) m

let bm_tx_op (db : db) (m : BM.t) : tx_op =
  BM.to_tx_op db (normalize_bm m)

type pages_tx_result =
  { pt_pages_tx : BM.t list
  ; pt_page_properties_tx : BM.t list
  ; pt_per_file_state : per_file_state
  ; pt_existing_pages : (string, string) Hashtbl.t }

let build_pages_tx (conn : conn) (pages : BM.t list) (blocks : BM.t list)
    (options : options) : pages_tx_result =
  let import_state = options.import_state in
  let db = Datascript.db conn in
  let journal_page_name_uuids = import_state.journal_page_name_uuids in
  let file_page_created_at =
    pick_opt options.file_created_at options.file_updated_at
  in
  let file_page_updated_at =
    pick_opt options.file_updated_at options.file_created_at
  in
  let prop_class_names =
    options.user_options.property_classes
    @ options.user_options.property_parent_classes
  in
  let all_pages_star =
    Gp_extract.with_ref_pages pages blocks
    |> List.filter (fun p ->
           not
             (getv p "block/file" = None
              && (match get_string p "block/name" with
                  | Some n -> Hashtbl.mem journal_page_name_uuids n
                  | None -> false)))
    |> List.filter (fun p ->
           not
             ((match get_string p "block/name" with
               | Some n -> List.mem n prop_class_names
               | None -> false)
              && getv p "block/file" = None))
    |> List.map (fun p ->
           let file_page = getv p "block/file" <> None in
           let apply_file_times =
             file_page && getv p "block/journal-day" = None
           in
           let p = BM.dissoc p [ "block/file" ] in
           let p =
             if file_page then BM.put p (export_attr "file-page?") (Bool true)
             else p
           in
           let p =
             match apply_file_times, file_page_created_at with
             | true, Some ms ->
               BM.put p "block/created-at" (Common_util.value_of_ms ms)
             | _ -> p
           in
           (match apply_file_times, file_page_updated_at with
            | true, Some ms ->
              BM.put p "block/updated-at" (Common_util.value_of_ms ms)
            | _ -> p))
    |> fun ps -> sanitize_page_aliases_for_import ps import_state
  in
  let all_existing_page_uuids = get_page_names_to_uuids import_state in
  let all_pages =
    List.map (fun p -> modify_page_tx p all_existing_page_uuids) all_pages_star
  in
  let page_lookup_name (m : BM.t) : string option =
    match get_string m (export_attr "original-name") with
    | Some _ as s -> s
    | None -> get_string m "block/name"
  in
  let existing_page_uuid (m : BM.t) : string option =
    lookup_imported_page_uuid db all_existing_page_uuids (page_lookup_name m)
  in
  let db_existing_page_uuids = Hashtbl.create 127 in
  let all_new_page_uuids = Hashtbl.create 127 in
  List.iter
    (fun page ->
      match existing_page_uuid page with
      | Some u ->
        (match page_lookup_name page with
         | Some n -> Hashtbl.replace db_existing_page_uuids n u
         | None -> ())
      | None ->
        (match page_lookup_name page, get_uuid page "block/uuid" with
         | Some n, Some u -> Hashtbl.replace all_new_page_uuids n u
         | _ -> ()))
    all_pages;
  let page_names_to_uuids = Hashtbl.copy all_existing_page_uuids in
  Hashtbl.iter (Hashtbl.replace page_names_to_uuids) db_existing_page_uuids;
  Hashtbl.iter (Hashtbl.replace page_names_to_uuids) all_new_page_uuids;
  Hashtbl.iter
    (Hashtbl.replace page_names_to_uuids)
    journal_page_name_uuids;
  let per_file_state =
    { pfs_page_names_to_uuids = page_names_to_uuids
    ; pfs_classes_tx = options.classes_tx }
  in
  let all_pages_m =
    List.map
      (fun m ->
        handle_page_properties m db per_file_state
          (List.map mv_of_bm all_pages)
          options)
      all_pages
  in
  let pages_tx =
    List.filter_map
      (fun (m, _properties_tx) ->
        match existing_page_uuid m with
        | Some page_uuid ->
          build_existing_page
            (BM.dissoc m
               [ export_attr "original-name"; export_attr "original-title" ])
            db page_uuid per_file_state options
        | None ->
          let existing_named_is_class =
            match
              pick_opt
                (get_string m (export_attr "original-title"))
                (get_string m "block/title")
            with
            | Some t ->
              (match
                 Hashtbl.find_opt import_state.all_idents
                   (build_class_ident_name t)
               with
               | Some ident -> class_ident_kw ident
               | None -> false)
            | None -> false
          in
          if bm_has_tag m "logseq.class/Tag" || not existing_named_is_class then
            Some
              (build_new_page_or_class
                 (BM.dissoc m
                    [ export_attr "original-name"; export_attr "original-title" ])
                 db per_file_state import_state.all_idents options)
          else None)
      all_pages_m
  in
  { pt_pages_tx = pages_tx
  ; pt_page_properties_tx = List.concat_map snd all_pages_m
  ; pt_per_file_state = per_file_state
  ; pt_existing_pages =
      (let tbl = Hashtbl.create (List.length all_pages_star) in
       List.iter
         (fun p ->
           match get_string p "block/name" with
           | Some n ->
             (match Hashtbl.find_opt all_existing_page_uuids n with
              | Some u -> Hashtbl.replace tbl n u
              | None -> ())
           | None -> ())
         all_pages_star;
       tbl) }

(* ---------- upstream properties ---------- *)

(* (pull ?b [*]) result -> BM. Refs surface as Ref eid like cljs {:db/id n}. *)
let bm_of_pulled (p : pulled_entity) : BM.t =
  List.filter_map
    (fun (k, v) ->
      match k with
      | Keyword a | String a ->
        let v' =
          match v with
          | Pulled_scalar v -> v
          | Pulled_entity pe -> Ref pe.pulled_id
          | Pulled_many vs ->
            List
              (List.filter_map
                 (fun v ->
                   match v with
                   | Pulled_scalar v -> Some v
                   | Pulled_entity pe -> Some (Ref pe.pulled_id)
                   | Pulled_many _ -> None)
                 vs)
        in
        Some (a, v')
      | _ -> None)
    p.pulled_attrs

let pulled_eid (m : BM.t) : int option =
  match getv m "db/id" with
  | Some (Int i) -> Some i
  | Some (Ref i) -> Some i
  | _ -> None

let build_upstream_properties_tx_for_default (db : db) (prop : string)
    (property_ident : string) (from_prop_type : string option)
    (block_properties_text_values : (string, BM.t) Hashtbl.t) : tx_op list =
  let rows =
    Datascript.q_string db
      "[:find (pull ?b [*]) :in $ ?p % :where (has-property ?b ?p)]"
      ~inputs:
        [ Arg_scalar (Result_attr property_ident)
        ; Db_query_dsl.parse_rules_input
            (Db_query_dsl.extract_rules [ "has-property" ]) ]
  in
  let existing_blocks =
    List.filter_map
      (fun row ->
        match row with
        | Result_pull p :: _ -> Some (bm_of_pulled p)
        | _ -> None)
      rows
  in
  List.concat_map
    (fun m ->
      let prop_value = getv m property_ident in
      let eid = match pulled_eid m with Some i -> i | None -> 0 in
      let retract_tx : tx_op list =
        match from_prop_type with
        | Some "node" | Some "date" ->
          [ Retract (Entity_id eid, property_ident, None) ]
        | _ ->
          (match prop_value with
           | Some (List vs) | Some (Vector vs) | Some (Set vs) ->
             List.filter_map
               (fun v ->
                 match v with
                 | Ref id -> Some (RetractEntity (Entity_id id))
                 | _ -> None)
               vs
           | Some (Ref id) -> [ RetractEntity (Entity_id id) ]
           | _ -> [])
      in
      let block_uuid =
        match get_uuid m "block/uuid" with
        | Some u -> u
        | None -> ""
      in
      let prop_value_content =
        match
          get_uuid m "block/uuid"
          |> Fun.flip Option.bind (fun buuid ->
                 match Hashtbl.find_opt block_properties_text_values buuid with
                 | Some tbl ->
                   (match getv tbl prop with
                    | Some v -> Some v
                    | None -> None)
                 | None -> None)
        with
        | Some v -> v
        | None ->
          failwith
            (Printf.sprintf
               "No :block/text-properties-values found when changing property \
                values: %s"
               block_uuid)
      in
      let new_value =
        Db_property_build.build_property_value_block m
          ([ ("db/ident", Keyword property_ident) ])
          prop_value_content
      in
      retract_tx
      @ [ bm_tx_op db new_value
        ; bm_tx_op db
            [ ("block/uuid", Uuid block_uuid)
            ; ( property_ident
              , Vector
                  [ kw "block/uuid"
                  ; Uuid
                      (match get_uuid new_value "block/uuid" with
                       | Some u -> u
                       | None -> "") ]) ] ])
    existing_blocks

(* (merge {:db/ident ident} schema) as a BM — schema attrs plus ident *)
let bm_merge_ident_schema (ident : string) (schema : BM.t) : BM.t =
  BM.put schema "db/ident" (Keyword ident)

let build_upstream_properties_tx (db : db)
    (upstream_properties : (string, BM.t) Hashtbl.t)
    (import_state : import_state) (options : options) : tx_op list =
  if Hashtbl.length upstream_properties = 0 then []
  else begin
    let block_properties_text_values =
      import_state.block_properties_text_values
    in
    let all_idents = import_state.all_idents in
    logf options
      [ String "props-upstream-to-change"
      ; mv_of_bm (Hashtbl.fold (fun k v acc -> (k, mv_of_bm v) :: acc)
                    upstream_properties []) ];
    Hashtbl.fold
      (fun prop m acc ->
        let prop_ident = get_ident all_idents prop in
        let schema = bm_of_value (getv m "schema") in
        let from_type = get_string m "from-type" in
        let upstream_tx =
          match getv schema "logseq.property/type" with
          | Some (Keyword "default") | Some (String "default") ->
            build_upstream_properties_tx_for_default db prop prop_ident
              from_type block_properties_text_values
          | _ -> []
        in
        acc
        @ [ bm_tx_op db (bm_merge_ident_schema prop_ident schema) ]
        @ upstream_tx)
      upstream_properties []
  end

(* ---------- build-tx-options ---------- *)

let build_tx_options (options : options) : options =
  let file_built_in = file_built_in_property_names in
  let lower_names =
    List.filter_map
      (fun s ->
        let s = Unicode.lowercase s in
        if List.mem s file_built_in then None else Some s)
  in
  { options with
    extract_date_formatter = None
  ; extract_user_config = []
  ; extract_filename_format = None
  ; extract_verbose = false
  ; upstream_properties = Hashtbl.create 31
  ; classes_tx = ref []
  ; custom_status_tx = ref []
  ; journal_created_ats = Hashtbl.create 63
  ; current_journal_created_at = None
  ; preserve_empty_property_block_uuids = Hashtbl.create 31
  ; user_options =
      { options.user_options with
        tag_classes =
          List.map Unicode.lowercase options.user_options.tag_classes
      ; property_classes = lower_names options.user_options.property_classes
      ; property_parent_classes =
          lower_names options.user_options.property_parent_classes } }

(* ---------- split-pages-and-properties-tx ---------- *)

(* cljs retract-parent-and-page-tag: eid lookup-ref [:block/uuid uuid] *)
let retract_parent_and_page_tag (col : BM.t list) : tx_op list =
  List.concat_map
    (fun b ->
      match get_uuid b "block/uuid" with
      | Some u ->
        let eid = Lookup_ref ("block/uuid", Uuid u) in
        [ RetractAttr (eid, "block/parent")
        ; Retract (eid, "block/tags", Some (kw "logseq.class/Page")) ]
      | None -> [])
    col

let existing_named_page_is_class (import_state : import_state)
    (page_uuid : string) : bool =
  match Hashtbl.find_opt import_state.all_existing_page_uuids page_uuid with
  | Some p ->
    saved_tag_mem "logseq.class/Tag" (collv (getv p "block/tags"))
    || (match getv p "db/ident" with
        | Some (Keyword i) | Some (String i) -> class_ident_kw i
        | _ -> false)
  | None -> false

type split_result =
  { sp_pages_tx : BM.t list
  ; sp_property_pages_tx : tx_op list
  ; sp_property_page_properties_tx : BM.t list }

(* sqlite-util/build-new-property on BM maps *)
let build_new_property_bm (db_ident : string) (prop_schema : BM.t)
    (title : string option) (block_uuid : string option) : BM.t =
  BM.of_transit
    (Sqlite_util.build_new_property ?title ?block_uuid db_ident
       (Ds_wire.transit_of_value (mv_of_bm prop_schema)))

let split_pages_and_properties_tx (db : db) (pages_tx : BM.t list)
    (old_properties : string list)
    (existing_pages : (string, string) Hashtbl.t)
    (import_state : import_state)
    (upstream_properties : (string, BM.t) Hashtbl.t) : split_result =
  let new_properties =
    Hashtbl.fold
      (fun k _ acc ->
        if List.mem k old_properties then acc else k :: acc)
      import_state.property_schemas []
  in
  let class_occupied_property_names =
    List.filter
      (fun kw_name ->
        match Hashtbl.find_opt existing_pages kw_name with
        | Some existing_uuid ->
          existing_named_page_is_class import_state existing_uuid
        | None -> false)
      new_properties
  in
  let page_tx_for_new_property (page : BM.t) : bool =
    match get_string page "block/name" with
    | Some name ->
      List.mem name new_properties
      && not (List.mem name class_occupied_property_names)
      && (match get_uuid page "block/uuid" with
          | Some u -> not (existing_named_page_is_class import_state u)
          | None -> true)
    | None -> false
  in
  let properties_tx, pages_tx' =
    List.partition page_tx_for_new_property pages_tx
  in
  let build_property_page (title : string) (block_uuid : string option) : BM.t =
    let property_name = Unicode.lowercase title in
    let db_ident = get_ident import_state.all_idents property_name in
    let upstream_property =
      match Hashtbl.find_opt upstream_properties property_name with
      | Some _ as o -> o
      | None -> None
    in
    let schema =
      match upstream_property with
      | Some up ->
        let from_type = get_string up "from-type" in
        let schema_type =
          match
            getv (bm_of_value (getv up "schema")) "logseq.property/type"
          with
          | Some (Keyword t) | Some (String t) -> Some t
          | _ -> None
        in
        if
          (from_type = Some "date" || from_type = Some "node")
          && schema_type = Some "default"
        then
                      [ ( "logseq.property/type"
              , kw (Option.value ~default:"default" from_type) )
            ; ("db/cardinality", kw "many") ]
        else get_property_schema import_state.property_schemas property_name
      | None -> get_property_schema import_state.property_schemas property_name
    in
    build_new_property_bm db_ident schema (Some title) block_uuid
  in
  let property_pages_tx =
    List.map
      (fun page ->
        build_property_page
          (Option.value ~default:"" (get_string page "block/title"))
          (get_uuid page "block/uuid"))
      properties_tx
  in
  let converted_property_pages_tx =
    List.filter_map
      (fun kw_name ->
        if List.mem kw_name class_occupied_property_names then None
        else
          match Hashtbl.find_opt existing_pages kw_name with
          | Some existing_page_uuid ->
            let new_prop =
              build_property_page kw_name (Some existing_page_uuid)
            in
            let keep =
              List.filter
                (fun (a, _) ->
                  a = "block/tags" || a = "db/ident"
                  || a = "logseq.property/type" || a = "db/index"
                  || a = "db/cardinality" || a = "db/valueType")
                new_prop
            in
            Some
              (keep @ [ ("block/uuid", Uuid existing_page_uuid) ])
          | None -> None)
      new_properties
  in
  let class_occupied_property_pages_tx =
    List.map (fun kw_name -> build_property_page kw_name None)
      class_occupied_property_names
  in
  let retract_page_tag_from_properties_tx =
    retract_parent_and_page_tag
      (property_pages_tx @ converted_property_pages_tx
       @ class_occupied_property_pages_tx)
  in
  let property_page_properties_tx =
    List.filter_map
      (fun b ->
        let page_properties = Db_property.properties b in
        match page_properties with
        | [] -> None
        | kvs ->
          let page_props_bm = kvs in
          let tags =
            List.filter
              (fun t -> t <> kw "logseq.class/Page")
              (collv (getv page_props_bm "block/tags"))
            @ [ kw "logseq.class/Property" ]
          in
          Some
            (BM.merge page_props_bm
               [ ( "block/uuid"
                 , (match getv b "block/uuid" with
                    | Some v -> v
                    | None -> Nil) )
               ; ("block/tags", List tags) ]))
      properties_tx
  in
  { sp_pages_tx = pages_tx'
  ; sp_property_pages_tx =
      List.map
        (bm_tx_op db)
        (property_pages_tx @ converted_property_pages_tx
         @ class_occupied_property_pages_tx)
      @ retract_page_tag_from_properties_tx
  ; sp_property_page_properties_tx = property_page_properties_tx }

(* ---------- extract ---------- *)

(* fix-extracted-block-tags-and-refs *)
let fix_extracted_block_tags_and_refs (blocks : BM.t list) : BM.t list =
  let name_uuids : (string, string) Hashtbl.t = Hashtbl.create 255 in
  List.map
    (fun block ->
      let fix_ref ~is_ref ~properties v =
        match v with
        | Map _ ->
          let m = bm_of_value (Some v) in
          (match get_string m "block/name", get_uuid m "block/uuid" with
           | Some name, Some uuid ->
             if is_ref && List.mem name properties then
               (* don't change uuid if property since properties and tags have
                  different uuids *)
               v
             else
               (match Hashtbl.find_opt name_uuids name with
                | Some u when u <> uuid ->
                  mv_of_bm (BM.put m "block/uuid" (Uuid u))
                | _ ->
                  Hashtbl.replace name_uuids name uuid;
                  v)
           | _ -> v)
        | _ -> v
      in
      let fix_ref_list block a ~is_ref ~properties =
        match getv block a with
        | Some _ ->
          BM.put block a
            (List (List.map (fix_ref ~is_ref ~properties) (collv (getv block a))))
        | None -> block
      in
      let properties =
        match Block_map.attr_value block "block/properties" with
        | Some m ->
          List.map fst (Clj_value.map_entries_named m)
        | None -> []
      in
      let block = fix_ref_list block "block/tags" ~is_ref:false ~properties:[] in
      let block = fix_ref_list block "block/refs" ~is_ref:true ~properties in
      block)
    blocks

let get_block_pattern (format : string) : string =
  match format with "org" -> "*" | _ -> "-"

(* cljs #"(?im)```|\{\{|#\+BEGIN_|:LOGBOOK:|^\s*(?:(?:[-*+]|\d+\.)\s+)?>|\]\(|^\s*-\s+\S+::"
   — ~caseless carries the i flag; the platform Regexp has no multiline
   flag, so ^ becomes (?:^|\n). *)
let import_outline_only_re =
  Regexp.compile ~caseless:true
    "```|\\{\\{|#\\+BEGIN_|:LOGBOOK:|(?:^|\\n)\\s*(?:(?:[-*+]|\\d+\\.)\\s+)?>|\\]\\(|(?:^|\\n)\\s*-\\s+\\S+::"

let import_parse_outline_only (format : string) (content : string) : bool =
  (format = "markdown" || format = "md")
  && not (Regexp.test import_outline_only_re content)

let extract_pages_and_blocks (db : db) (file : string) (content : string)
    (options : options) : extracted option =
  let format =
    Common_util.get_format file
  in
  let journal_file =
    match journal_file_title file with Some _ -> true | None -> false
  in
  let with_file_timestamps (node : BM.t) : BM.t =
    let node =
      match pick_opt options.file_created_at options.file_updated_at with
      | Some ms ->
        if options.file_created_at <> None || options.file_updated_at <> None
        then
          BM.put node "block/created-at" (Common_util.value_of_ms ms)
        else node
      | None -> node
    in
    match options.file_updated_at with
    | Some ms -> BM.put node "block/updated-at" (Common_util.value_of_ms ms)
    | None -> node
  in
  let extract_opts : Gp_block.extract_options =
    { user_config = options.extract_user_config
    ; block_pattern = get_block_pattern format
    ; date_formatter =
        (match options.extract_date_formatter with
         | Some f -> Some f
         | None -> Some "MMM do, yyyy")
    ; db
    ; db_graph_mode = false
    ; export_to_db_graph_flag = true
    ; remove_properties = false
    ; remove_logbook = false
    ; remove_deadline_scheduled = false
    ; page_name = None
    ; filename_format = options.extract_filename_format
    ; resolve_uuid_fn = (fun _ _ _ _ -> None)
    ; skip_journal = not journal_file }
  in
  let extracted =
    if format = "org" || format = "markdown" || format = "md" then
      let pages, blocks, _ast =
        Gp_extract.extract ~file_path:file ~content
          ~user_config:options.extract_user_config
          ~verbose:options.extract_verbose
          ~parse_outline_only:(import_parse_outline_only format content) extract_opts
      in
      let pages =
        List.map
          (fun page ->
            let page =
              BM.dissoc page [ "block.temp/original-page-name" ]
            in
            if
              getv page "block/file" <> None
              && getv page "block/journal-day" = None
            then with_file_timestamps page
            else page)
          pages
      in
      let blocks =
        fix_extracted_block_tags_and_refs
          (List.map with_file_timestamps blocks)
      in
      Some (pages, blocks)
    else begin
      let is_whiteboard =
        match Regexp.exec
                (Regexp.compile "whiteboards/.*\\.edn$")
                (String.concat "" [ file ]) with
        | Some _ -> true
        | None -> false
      in
      if not is_whiteboard then
        options.import_state.ignored_files :=
                      [ ("path", String file)
            ; ("reason", kw "unsupported-file-format") ]
          :: !(options.import_state.ignored_files);
      None
    end
  in
  match extracted with
  | Some (pages, blocks) ->
    let extracted = { ex_pages = pages; ex_blocks = blocks } in
    if hls_annotation_md_file file then begin
      (* Annotation markdown pages are saved for later as they are dependant
         on the asset being annotated *)
      Hashtbl.replace options.import_state.pdf_annotation_pages
        (Gp_node_path.basename file) extracted;
      None
    end
    else Some extracted
  | None -> None

let build_journal_created_ats (pages : BM.t list) : (string, int64) Hashtbl.t =
  let tbl = Hashtbl.create 63 in
  List.iter
    (fun p ->
      match getv p "block/journal-day" with
      | Some (Int day) ->
        (match get_string p "block/name" with
         | Some n ->
           Hashtbl.replace tbl n (Date_time_util.int_to_local_ms day)
         | None -> ())
      | Some (Float f) ->
        (match get_string p "block/name" with
         | Some n ->
           Hashtbl.replace tbl n (Date_time_util.int_to_local_ms (int_of_float f))
         | None -> ())
      | _ -> ())
    pages;
  tbl

(* ---------- clean-extra-invalid-tags ---------- *)

type clean_result =
  { cl_pages_tx : BM.t list
  ; cl_retract_tx : tx_op list }

let ident_eid_of (db : db) (ident : string) : int =
  match Ldb.ent_of_ref db (Ident ident) with
  | Some e -> e.id
  | None -> -1

let clean_extra_invalid_tags (db : db) (pages_tx : BM.t list)
    (classes_tx : BM.t list)
    (existing_pages : (string, string) Hashtbl.t) : clean_result =
  let existing_classes = Hashtbl.create 63 in
  Seq.iter
    (fun (d : datom) ->
      match Ldb.ent_of_id db d.e with
      | Some e ->
        (match Ldb.value e "block/uuid" with
         | Some (Uuid u) | Some (String u) ->
           Hashtbl.replace existing_classes u ()
         | _ -> ())
      | None -> ())
    (datoms db Avet ~a:"block/tags"
       ~v:(Ref (ident_eid_of db "logseq.class/Tag")) ());
  let classes = Hashtbl.copy existing_classes in
  List.iter
    (fun c ->
      match get_uuid c "block/uuid" with
      | Some u -> Hashtbl.replace classes u ()
      | None -> ())
    classes_tx;
  let existing_properties = Hashtbl.create 63 in
  Seq.iter
    (fun (d : datom) ->
      match Ldb.ent_of_id db d.e with
      | Some e ->
        (match Ldb.value e "block/uuid" with
         | Some (Uuid u) | Some (String u) ->
           Hashtbl.replace existing_properties u ()
         | _ -> ())
      | None -> ())
    (datoms db Avet ~a:"block/tags"
       ~v:(Ref (ident_eid_of db "logseq.class/Property")) ());
  let existing_pages_inv = Hashtbl.create (Hashtbl.length existing_pages) in
  Hashtbl.iter
    (fun n u -> Hashtbl.replace existing_pages_inv u n)
    existing_pages;
  let retract_page_tag_from_existing_pages =
    pages_tx
    |> List.filter (fun p ->
           match getv p "db/ident", get_uuid p "block/uuid" with
           | Some _, Some u -> Hashtbl.mem existing_pages_inv u
           | _ -> false)
    |> retract_parent_and_page_tag
  in
  let pages_tx'' =
    List.map
      (fun page ->
        let uuid = get_uuid page "block/uuid" in
        let is_class_or_prop =
          match uuid with
          | Some u ->
            Hashtbl.mem classes u || Hashtbl.mem existing_properties u
          | None -> false
        in
        if is_class_or_prop then
          let page =
            BM.put page "block/tags"
              (List
                 (List.filter
                    (fun t -> t <> kw "logseq.class/Page")
                    (collv (getv page "block/tags"))))
          in
          BM.dissoc page [ "block/parent" ]
        else page)
      pages_tx
  in
  { cl_pages_tx = pages_tx''
  ; cl_retract_tx =
      retract_parent_and_page_tag classes_tx
      @ retract_page_tag_from_existing_pages }

(* ---------- transact plumbing ---------- *)

let entity_ref_value (r : entity_ref) : value option =
  match r with
  | Entity_id id -> Some (Int id)
  | Temp_id s -> Some (String s)
  | CurrentTx -> None
  | Ident s -> Some (Keyword s)
  | Lookup_ref (a, v) -> Some (Vector [ Keyword a; v ])

let rec bm_of_tx_entity (e : tx_entity) : BM.t =
  let base =
    match e.db_id with
    | Some r ->
      (match entity_ref_value r with Some v -> [ ("db/id", v) ] | None -> [])
    | None -> []
  in
  base
  @ List.concat_map
      (fun (a, tv) ->
        match tv with
        | One_value v -> [ (a, v) ]
        | Many_values vs -> [ (a, List vs) ]
        | One_entity e' -> [ (a, mv_of_bm (bm_of_tx_entity e')) ]
        | Many_entities es ->
          [ (a, List (List.map (fun e' -> mv_of_bm (bm_of_tx_entity e')) es)) ])
      e.attrs

(* save-from-tx: index named nodes into all-existing-page-uuids +
   page-names-to-uuids *)
let save_nodes (nodes : BM.t list) (options : options) : unit =
  match nodes with
  | [] -> ()
  | _ ->
    List.iter
      (fun m ->
        match get_uuid m "block/uuid" with
        | Some u ->
          Hashtbl.replace options.import_state.all_existing_page_uuids u m
        | None -> ())
      nodes;
    index_saved_page_names options.import_state nodes

let save_from_ops (txs : tx_op list) (options : options) : unit =
  save_nodes
    (List.filter_map
       (fun op ->
         match op with
         | Entity e ->
           let m = bm_of_tx_entity e in
           if getv m "block/name" <> None then Some m else None
         | _ -> None)
       txs)
    options

let save_from_bm_tx (txs : BM.t list) (options : options) : unit =
  save_nodes
    (List.filter (fun m -> getv m "block/name" <> None) txs)
    options

let imported_tx_meta (file : string option) : tx_meta =
  ( "logseq.graph-parser.exporter/imported-data?", Bool true )
  :: (match file with
      | Some f -> [ ("logseq.graph-parser.exporter/path", String f) ]
      | None -> [])
  @ [ ("logseq.graph-parser.exporter/new-graph?", Bool true) ]

let transact_imported_ops (conn : conn) (tx : tx_op list) (meta : tx_meta)
    (options : options) : tx_report option =
  match tx with
  | [] -> None
  | _ ->
    let report = Db_tx.transact ~tx_meta:meta conn tx in
    save_from_ops tx options;
    Some report

let transact_imported_maps (conn : conn) (maps : BM.t list) (meta : tx_meta)
    (options : options) : tx_report option =
  match maps with
  | [] -> None
  | _ ->
    let db = Datascript.db conn in
    let ops = List.map (bm_tx_op db) maps in
    let report = Db_tx.transact ~tx_meta:meta conn ops in
    save_from_bm_tx maps options;
    Some report

(* build-file-import-blocks-index — {:block/uuid _} stubs for block ids and
   every [:block/uuid _] ref/link target inside blocks-tx *)
let build_file_import_blocks_index (blocks_tx : BM.t list) : BM.t list =
  let block_uuid_index (v : value) : value option =
    match v with
    | Vector [ Keyword "block/uuid"; (Uuid _ as u) ] -> Some u
    | List [ Keyword "block/uuid"; (Uuid _ as u) ] -> Some u
    | _ -> None
  in
  let ref_uuids (b : BM.t) (attr : string) : value list =
    match getv b attr with
    | Some v ->
      List.filter_map block_uuid_index (collv (Some v))
    | None -> []
  in
  let dedupe_keep_order uuids =
    let seen = Hashtbl.create (List.length uuids * 2) in
    List.filter (fun u -> if Hashtbl.mem seen u then false else (Hashtbl.add seen u (); true)) uuids
  in
  (* cljs emits the ref/link-target stubs together with the block stubs as
     one unordered set; emitting the referenced entities' stubs first in
     collection order is a deterministic choice that matches the observed
     outcome where e.g. an asset page-ref wins a lowest-eid lookup *)
  let block_ids =
    List.filter_map
      (fun block ->
        match getv block "block/uuid" with
        | Some (Uuid _ as u) -> Some u
        | _ -> None)
      blocks_tx
  in
  let link_ids =
    List.filter_map
      (fun b ->
        match getv b "block/link" with
        | Some v when block_uuid_ref v -> block_uuid_index v
        | _ -> None)
      blocks_tx
  in
  let ref_ids =
    List.concat_map (fun b -> ref_uuids b "block/refs") blocks_tx
  in
  List.map
    (fun u -> [ "block/uuid", u ])
    (dedupe_keep_order (ref_ids @ link_ids @ block_ids))

(* build-file-import-main-tx — cljs ~2979 *)
let build_file_import_main_tx (db : db) (pages_tx'' : BM.t list)
    (page_properties_tx : BM.t list)
    (property_page_properties_tx : BM.t list) (classes_tx : BM.t list)
    (classes_tx' : tx_op list) (custom_status_tx : BM.t list)
    (blocks_tx : BM.t list) : tx_op list =
  let pages_index =
    distinct
      (List.filter_map
         (fun b ->
           (match getv b "block/uuid" with
            | Some (Uuid _ as u) -> Some [ "block/uuid", u ]
            | _ -> None))
         (pages_tx'' @ classes_tx))
  in
  let blocks_index = build_file_import_blocks_index blocks_tx in
  let bm_ops ms = List.map (bm_tx_op db) ms in
  bm_ops pages_index
  @ bm_ops page_properties_tx
  @ bm_ops property_page_properties_tx
  @ bm_ops pages_tx''
  @ classes_tx'
  @ bm_ops custom_status_tx
  @ bm_ops blocks_index
  @ bm_ops blocks_tx

(* track-placeholder-ref-uuids! — cljs ~2938; collects uuid targets of
   [:block/uuid _] refs so later passes can detect unresolved placeholders *)
let track_placeholder_ref_uuids (import_state : import_state)
    (blocks_tx : BM.t list) : unit =
  List.iter
    (fun b ->
      List.iter
        (fun r ->
          match r with
          | Vector [ Keyword "block/uuid"; (Uuid u | String u) ]
          | List [ Keyword "block/uuid"; (Uuid u | String u) ] ->
            Hashtbl.replace import_state.placeholder_ref_uuids u ()
          | _ -> ())
        (collv (getv b "block/refs")))
    blocks_tx

(* cljs file-graph-tx-options *)
let file_graph_tx_options (options : options) (pages : BM.t list)
    (file : string) (preserve : (string, unit) Hashtbl.t) : options =
  let tx_options = build_tx_options options in
  Hashtbl.iter
    (Hashtbl.replace tx_options.journal_created_ats)
    (build_journal_created_ats pages);
  { tx_options with
    current_journal_created_at = journal_file_created_at file
  ; preserve_empty_property_block_uuids = preserve }

(* cljs <add-file-to-db-graph *)
let add_file_to_db_graph (conn : conn) (file : string) (content : string)
    (options : options) : tx_report option list Eff.t =
  let file_start =
    if options.log_fn != noop_log_fn then Some (Import_profile.now_ms ())
    else None
  in
  let options = options in
  import_progress options [ ("phase", kw "parse"); ("file", String file) ];
  let parse_start =
    if options.log_fn != noop_log_fn then Some (Import_profile.now_ms ())
    else None
  in
  let extracted =
    extract_pages_and_blocks (Datascript.db conn) file content options
  in
  let pages, blocks =
    match extracted with
    | Some e -> (e.ex_pages, e.ex_blocks)
    | None -> ([], [])
  in
  log_phase_ms options "parse" parse_start [ ("file", String file) ];
  let prep_start =
    if options.log_fn != noop_log_fn then Some (Import_profile.now_ms ())
    else None
  in
  let blocks, preserve_empty_properties_uuids = handle_template_blocks blocks in
  let user_config =
    match options.user_config with
    | [] -> options.extract_user_config
    | c -> c
  in
  let walked_by_uuid = index_walked_ast_blocks user_config blocks in
  let tx_options =
    file_graph_tx_options options pages file preserve_empty_properties_uuids
  in
  let old_properties =
    Hashtbl.fold (fun k _ acc -> k :: acc)
      options.import_state.property_schemas []
  in
  log_phase_ms options "prep" prep_start [ ("file", String file) ];
  import_progress options [ ("phase", kw "pages-tx"); ("file", String file) ];
  let pages_start =
    if options.log_fn != noop_log_fn then Some (Import_profile.now_ms ())
    else None
  in
  let pt = build_pages_tx conn pages blocks tx_options in
  log_phase_ms options "pages-tx" pages_start [ ("file", String file) ];
  let pre_blocks =
    let tbl = Hashtbl.create 63 in
    List.iter
      (fun b ->
        if truthy_opt (getv b "block/pre-block?") then
          match get_uuid b "block/uuid" with
          | Some u -> Hashtbl.replace tbl u ()
          | None -> ())
      blocks;
    tbl
  in
  import_progress options
    [ ("phase", kw "blocks-tx"); ("file", String file) ];
  let blocks_start =
    if options.log_fn != noop_log_fn then Some (Import_profile.now_ms ())
    else None
  in
  build_blocks_tx conn blocks pre_blocks pt.pt_per_file_state tx_options
    walked_by_uuid
  |> Fun.flip Eff.bind (fun blocks_tx ->
     log_phase_ms options "blocks-tx" blocks_start
       [ ("file", String file); ("blocks", Int (List.length blocks)) ];
     track_placeholder_ref_uuids options.import_state blocks_tx;
     let split_start =
       if options.log_fn != noop_log_fn then Some (Import_profile.now_ms ())
       else None
     in
     let db = Datascript.db conn in
     let split =
       split_pages_and_properties_tx db pt.pt_pages_tx old_properties
         pt.pt_existing_pages options.import_state tx_options.upstream_properties
     in
     log_phase_ms options "split" split_start [ ("file", String file) ];
     let tx_meta = imported_tx_meta (Some file) in
     import_progress options
       [ ("phase", kw "property-transact"); ("file", String file) ];
     let prop_tx_start =
       if options.log_fn != noop_log_fn then Some (Import_profile.now_ms ())
       else None
     in
     ignore
       (transact_imported_ops conn split.sp_property_pages_tx tx_meta options);
     log_phase_ms options "prop-tx" prop_tx_start
       [ ( "file", String file )
       ; ("tx-count", Int (List.length split.sp_property_pages_tx)) ];
     let classes_tx = !(tx_options.classes_tx) in
     let clean_start =
       if options.log_fn != noop_log_fn then Some (Import_profile.now_ms ())
       else None
     in
     let clean =
       clean_extra_invalid_tags (Datascript.db conn) split.sp_pages_tx
         classes_tx pt.pt_existing_pages
     in
     log_phase_ms options "clean-tags" clean_start [ ("file", String file) ];
     let classes_tx' =
       List.map (bm_tx_op db) classes_tx
       @ clean.cl_retract_tx
     in
     let custom_status_tx = !(tx_options.custom_status_tx) in
     let main_tx_start =
       if options.log_fn != noop_log_fn then Some (Import_profile.now_ms ())
       else None
     in
     let tx' =
       build_file_import_main_tx db clean.cl_pages_tx
         pt.pt_page_properties_tx split.sp_property_page_properties_tx
         classes_tx classes_tx' custom_status_tx blocks_tx
     in
     log_phase_ms options "main-tx" main_tx_start
       [ ("file", String file); ("tx-count", Int (List.length tx')) ];
     import_progress options
       [ ("phase", kw "transact"); ("file", String file) ];
     let transact_start =
       if options.log_fn != noop_log_fn then Some (Import_profile.now_ms ())
       else None
     in
     let main_tx_report =
       if tx' = [] then None
       else begin
         let report =
           Db_tx.transact ~tx_meta:(imported_tx_meta (Some file)) conn tx'
         in
         save_from_ops tx' options;
         Some report
       end
     in
     log_phase_ms options "transact" transact_start
       [ ("file", String file); ("tx-count", Int (List.length tx')) ];
     let save_start =
       if options.log_fn != noop_log_fn then Some (Import_profile.now_ms ())
       else None
     in
     log_phase_ms options "save-tx" save_start [ ("file", String file) ];
     import_progress options
       [ ("phase", kw "upstream-properties"); ("file", String file) ];
     let upstream_start =
       if options.log_fn != noop_log_fn then Some (Import_profile.now_ms ())
       else None
     in
     let upstream_properties_tx =
       build_upstream_properties_tx (Datascript.db conn)
         tx_options.upstream_properties options.import_state options
     in
     let upstream_tx_report =
       transact_imported_ops conn upstream_properties_tx tx_meta options
     in
     log_phase_ms options "upstream" upstream_start [ ("file", String file) ];
     log_phase_ms options "file" file_start [ ("file", String file) ];
     Eff.pure [ main_tx_report; upstream_tx_report ])


(* ---------- export-doc-file ---------- *)

(* (export-doc-file file conn {:keys [notify-user set-ui-state <read-file
   <get-file-stat <export-file] :as options}) — reads the file, stamps
   file-created/updated timestamps from the stat, then exports *)
let export_doc_file (file : BM.t) (conn : conn) (options : options)
    : BM.t option Eff.t =
  let path = Option.value ~default:"" (get_string file "path") in
  let idx =
    match getv file "idx" with
    | Some (Int i) -> i
    | Some (Float f) -> int_of_float f
    | _ -> 0
  in
  import_progress options
    [ ("step", kw "doc-files"); ("phase", kw "read-file")
    ; ("file", String path); ("file-idx", Int (idx + 1)) ];
  let set = options.set_ui_state in
  set [ "graph/importing-state"; "step" ] (kw "pages");
  set [ "graph/importing-state"; "label" ] (kw "import/loading");
  set [ "graph/importing-state"; "current-idx" ] (Int (idx + 1));
  set [ "graph/importing-state"; "current-page" ] (String path);
  (options.read_file file
   >>= fun content ->
   let stat_eff =
     match options.get_file_stat with
     | Some f ->
       f (match get_string file "fs-path" with
          | Some p -> p
          | None -> path)
     | None -> Eff.pure None
   in
   stat_eff
   >>= fun stat ->
  let file_ts k =
    match getv file k with
    | Some v -> Common_util.timestamp_ms v
    | None -> None
  in
  (* timestamp-ms treats non-positive times (e.g. epoch-0 birthtime) as absent *)
  let to_i64 f =
    match f with
    | Some x when x > 0. && Float.is_finite x -> Some (Int64.of_float x)
    | _ -> None
  in
  let modified_at =
    pick_opt (file_ts "file-updated-at")
      (pick_opt
         (match stat with
          | Some s -> to_i64 s.mtime_ms
          | None -> None)
         (file_ts "last-modified-at"))
  in
  let created_at =
    pick_opt (file_ts "file-created-at")
      (pick_opt
         (match stat with
          | Some s -> to_i64 s.birthtime_ms
          | None -> None)
         modified_at)
  in
  let m = [ ("file/path", String path); ("file/content", String content) ] in
  let export_options =
    { options with
      set_ui_state = noop_ui_state
    ; export_file = None
    ; file_created_at = created_at
    ; file_updated_at = modified_at }
  in
  let export_fn =
    match options.export_file with
    | Some f -> f
    | None ->
      (fun conn m opts ->
        match get_string m "file/path", get_string m "file/content" with
        | Some p, Some c ->
          Eff.map ignore (add_file_to_db_graph conn p c opts)
        | _ -> Eff.pure ())
  in
  Eff.map (fun () -> Some m) (export_fn conn m export_options))
  |> Fun.flip Eff.catch (fun error ->
     options.notify_user
       [ ( "msg"
         , String
             ("Import failed on " ^ path ^ " with error:\n"
              ^ Printexc.to_string error) )
       ; ("level", kw "error")
       ; ( "ex-data"
         , Map
             [ (kw "path", String path)
             ; (kw "error", String (Printexc.to_string error)) ]) ];
     options.import_state.ignored_files :=
       [ ("path", String path); ("reason", kw "export-failed") ]
       :: !(options.import_state.ignored_files);
     Eff.pure None)

(* ---------- missing block refs ---------- *)

(* cljs (string/replace (block-ref/->block-ref uuid) etc.) on title *)
let remove_block_ref_from_title (title : value option) (block_uuid : string)
    : value option =
  match title with
  | Some (String t) ->
    let t = Common_util.str_replace_all t (Block_ref.to_block_ref block_uuid) "" in
    let t = Common_util.str_replace_all t (Page_ref.to_page_ref block_uuid) "" in
    Some
      (String
         (Unicode.trim
            (Regexp.replace ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> " ")
               (Regexp.compile " {2,}") t)))
  | _ -> None

(* entity-level placeholder ref: has :block/uuid and no :block/title *)
let placeholder_block_ref_ent (e : entity) : bool =
  Ldb.value e "block/uuid" <> None && Ldb.value e "block/title" = None

type phd = { phd_source_id : int; phd_ref_id : int; phd_ref_uuid : string }

(* missing-placeholder-ref-datoms — when candidate uuids given, check
   only their entities; else scan all :aevt attr datoms *)
let missing_placeholder_ref_datoms (db : db) (attr : attr)
    (candidate_ref_uuids : string list) : phd list =
  if candidate_ref_uuids <> [] then
    List.concat_map
      (fun ref_uuid ->
        match Ldb.ent_of_ref db (Lookup_ref ("block/uuid", Uuid ref_uuid)) with
        | Some e when placeholder_block_ref_ent e ->
          List.map
            (fun (d : datom) ->
              { phd_source_id = d.e; phd_ref_id = e.id
              ; phd_ref_uuid = ref_uuid })
            (List.of_seq (datoms db Avet ~a:attr ~v:(Ref e.id) ()))
        | _ -> [])
      candidate_ref_uuids
  else
    List.filter_map
      (fun (d : datom) ->
        match d.v with
        | Ref id ->
          (match Ldb.ent_of_id db id with
           | Some e when placeholder_block_ref_ent e ->
             (match Ldb.value e "block/uuid" with
              | Some (Uuid u) | Some (String u) ->
                Some
                  { phd_source_id = d.e; phd_ref_id = id
                  ; phd_ref_uuid = u }
              | _ -> None)
           | _ -> None)
        | _ -> None)
      (List.of_seq (datoms db Aevt ~a:attr ()))

(* cleanup-missing-block-refs-tx *)
let cleanup_missing_block_refs_tx (db : db)
    (candidate_ref_uuids : string list) : tx_op list =
  let missing_refs =
    missing_placeholder_ref_datoms db "block/refs" candidate_ref_uuids
  and missing_links =
    missing_placeholder_ref_datoms db "block/link" candidate_ref_uuids
  in
  let refs_by_source = Hashtbl.create 63 in
  List.iter
    (fun (d : phd) ->
      Hashtbl.replace refs_by_source d.phd_source_id
        (d :: Option.value ~default:[]
            (Hashtbl.find_opt refs_by_source d.phd_source_id)))
    missing_refs;
  let retract_ref_tx =
    Hashtbl.fold
      (fun source_id refs acc ->
        acc
        @ List.map
            (fun r ->
              Retract
                (Entity_id source_id, "block/refs", Some (Ref r.phd_ref_id)))
            refs)
      refs_by_source []
  in
  let retract_link_tx =
    List.map
      (fun d ->
        Retract
          (Entity_id d.phd_source_id, "block/link", Some (Ref d.phd_ref_id)))
      missing_links
  in
  let update_title_tx =
    Hashtbl.fold
      (fun source_id refs acc ->
        match Ldb.ent_of_id db source_id with
        | Some source ->
          let title = Ldb.value source "block/title" in
          let title' =
            List.fold_left
              (fun t r -> remove_block_ref_from_title t r.phd_ref_uuid)
              title refs
          in
          (match title', title with
           | Some t', Some t when t' <> t ->
             acc @ [ Add (Entity_id source_id, "block/title", t') ]
           | _ -> acc)
        | None -> acc)
      refs_by_source []
  in
  let placeholder_retract_tx =
    List.sort_uniq
      (fun (a : phd) b -> compare a.phd_ref_id b.phd_ref_id)
      (missing_refs @ missing_links)
    |> List.map (fun d ->
           Retract
             (Entity_id d.phd_ref_id, "block/uuid",
              Some (Uuid d.phd_ref_uuid)))
  in
  retract_ref_tx @ retract_link_tx @ update_title_tx
  @ placeholder_retract_tx

(* set-finishing-import-ui *)
let set_finishing_import_ui (options : options) : unit =
  let set = options.set_ui_state in
  set [ "graph/importing-state"; "step" ] (kw "finishing");
  set [ "graph/importing-state"; "label" ] (kw "import/finishing");
  set [ "graph/importing-state"; "current-page" ] Nil;
  set [ "graph/importing-state"; "current-idx" ] Nil

(* finalize-imported-graph — rebuilds :block/refs for imported blocks
   missing :block/tx-id *)
let finalize_imported_graph (conn : conn) (_options : options)
    : tx_report option =
  let db = Conn.db conn in
  let entity_ids =
    List.filter_map
      (fun (d : datom) ->
        match Ldb.ent_of_id db d.e with
        | Some e ->
          if Ldb.value e "block/title" <> None
             && Ldb.value e "block/tx-id" = None
          then Some d.e
          else None
        | None -> None)
      (List.of_seq (datoms db Aevt ~a:"block/uuid" ()))
  in
  if entity_ids = [] then None
  else
    let tx_id = db.max_tx + 1 in
    let ops =
      List.concat_map
        (fun id ->
          match Ldb.ent_of_id db id with
          | Some block ->
            let refs =
              match Ldb.value block "logseq.property.reaction/target" with
              | Some _ -> []
              | None -> Outliner_pipeline.db_rebuild_block_refs db block ()
            in
            let old_refs =
              if refs = [] then []
              else
                List.filter_map
                  (fun (d : datom) ->
                    match d.v with Ref r -> Some r | _ -> None)
                  (List.of_seq (datoms db Eavt ~e:id ~a:"block/refs" ()))
            in
            let missing_in a b =
              List.filter (fun x -> not (List.mem x b)) a
            in
            Add (Entity_id id, "block/tx-id", Int tx_id)
            :: List.map
                 (fun r ->
                   Retract (Entity_id id, "block/refs", Some (Ref r)))
                 (missing_in old_refs refs)
            @ List.map
                (fun r -> Add (Entity_id id, "block/refs", Ref r))
                (missing_in refs old_refs)
          | None -> [])
        entity_ids
    in
    if ops = [] then None
    else
      Some
        (Db_tx.transact
           ~tx_meta:
             (("logseq.graph-parser.exporter/imported-data?", Bool true)
              :: ("logseq.graph-parser.exporter/new-graph?", Bool true)
              :: [ ("transact-new-graph-refs?", Bool true) ])
           conn ops)

(* cleanup-missing-block-refs *)
let cleanup_missing_block_refs (conn : conn) (options : options)
    : tx_report option =
  let tx =
    cleanup_missing_block_refs_tx (Conn.db conn)
      (Hashtbl.fold (fun u () acc -> u :: acc)
         options.import_state.placeholder_ref_uuids
         [])
  in
  if tx = [] then None
  else transact_imported_ops conn tx (imported_tx_meta None) options


(* ---------- normalize journal uuids ---------- *)

type journal_normalization =
  { jn_eid : entity_id; jn_old : string; jn_new : string }

(* journal-uuid-normalizations: journal-day datoms whose entity uuid
   differs from the standard generated uuid *)
let journal_uuid_normalizations (db : db) : journal_normalization list =
  List.filter_map
    (fun (d : datom) ->
      match d.v with
      | Int day ->
        (match Ldb.ent_of_id db d.e with
         | Some e ->
           (match Ldb.value e "block/uuid" with
            | Some (Uuid old_uuid) | Some (String old_uuid) ->
              let new_uuid = Common_uuid.gen_journal_page_uuid day in
              if old_uuid = new_uuid then None
              else (
                (match
                   Ldb.ent_of_ref db
                     (Lookup_ref ("block/uuid", Uuid new_uuid))
                 with
                 | Some target when target.id <> e.id ->
                   invalid_arg
                     "Cannot normalize journal uuid because the standard uuid is already used"
                 | _ -> ());
                Some { jn_eid = e.id; jn_old = old_uuid; jn_new = new_uuid })
            | _ -> None)
         | None -> None)
      | _ -> None)
    (List.of_seq (datoms db Avet ~a:"block/journal-day" ()))

(* replace-journal-uuid-refs — postwalk over a value; inside strings,
   [[old]] -> [[new]] and ((old)) -> ((new)) *)
let replace_journal_uuid_refs (replacements : (string * string) list)
    (v : value) : value =
  if replacements = [] then v
  else
    let rec go (v : value) : value =
      match v with
      | String s ->
        String
          (List.fold_left
             (fun acc (old_uuid, new_uuid) ->
               let acc =
                 Common_util.str_replace_all acc
                   (Page_ref.to_page_ref old_uuid)
                   (Page_ref.to_page_ref new_uuid)
               in
               Common_util.str_replace_all acc
                 (Block_ref.to_block_ref old_uuid)
                 (Block_ref.to_block_ref new_uuid))
             s replacements)
      | Vector vs -> Vector (List.map go vs)
      | List vs -> List (List.map go vs)
      | Set vs -> Set (List.map go vs)
      | Map kvs -> Map (List.map (fun (k, x) -> (go k, go x)) kvs)
      | _ -> v
    in
    go v

(* normalize-journal-uuids-tx *)
let normalize_journal_uuids_tx (db : db) : tx_op list =
  let normalizations = journal_uuid_normalizations db in
  let uuid_tx =
    List.concat_map
      (fun n ->
        [ Retract (Entity_id n.jn_eid, "block/uuid", Some (Uuid n.jn_old))
        ; Add (Entity_id n.jn_eid, "block/uuid", Uuid n.jn_new) ])
      normalizations
  in
  let text_tx =
    if normalizations = [] then []
    else
      let replacements =
        List.map (fun n -> (n.jn_old, n.jn_new)) normalizations
      in
      List.filter_map
        (fun (d : datom) ->
          match d.v with
          | String _ | Vector _ | List _ | Set _ | Map _ ->
            let v' = replace_journal_uuid_refs replacements d.v in
            if v' <> d.v then Some (Add (Entity_id d.e, d.a, v')) else None
          | _ -> None)
        (List.of_seq (datoms db Eavt ()))
  in
  uuid_tx @ text_tx

(* normalize-journal-uuids! *)
let normalize_journal_uuids (conn : conn) (options : options)
    : tx_report option =
  let tx = normalize_journal_uuids_tx (Conn.db conn) in
  if tx = [] then None
  else transact_imported_ops conn tx (imported_tx_meta None) options

(* missing-internal-page-parent-order-tx — imported internal pages under a
   namespace parent that lack a string :block/order *)
let missing_internal_page_parent_order_tx (db : db) : BM.t list =
  let groups : (int, entity list) Hashtbl.t = Hashtbl.create 63 in
  List.iter
    (fun (d : datom) ->
      match Ldb.ent_of_id db d.e with
      | Some child ->
        let key = match d.v with Ref p -> p | _ -> -1 in
        Hashtbl.replace groups key
          (child :: Option.value ~default:[] (Hashtbl.find_opt groups key))
      | None -> ())
    (List.of_seq (datoms db Avet ~a:"block/parent" ()));
  Hashtbl.fold
    (fun _parent children acc ->
      let missing =
        List.filter
          (fun c ->
            Entity_util.internal_page c
            &&
            match Ldb.value c "block/order" with
            | Some (String _) -> false
            | _ -> true)
          children
      in
      if missing = [] then acc
      else
        let max_order =
          match
            List.rev
              (List.sort compare
                 (List.filter_map
                    (fun c ->
                      match Ldb.value c "block/order" with
                      | Some (String s) -> Some s
                      | _ -> None)
                    children))
          with
          | [] -> None
          | h :: _ -> Some h
        in
        let keys = Db_order.gen_n_keys (List.length missing) max_order None in
        acc
        @ List.map2
            (fun (c : entity) order ->
              [ ("db/id", Ref c.id); ("block/order", String order) ])
            missing keys)
    groups []

(* ensure-imported-page-parent-orders! *)
let ensure_imported_page_parent_orders (conn : conn) (options : options)
    : tx_report option =
  let tx = missing_internal_page_parent_order_tx (Conn.db conn) in
  if tx = [] then None
  else transact_imported_maps conn tx (imported_tx_meta None) options

(* sequential Eff composition (cljs p/doseq / p/loop) *)
let rec seq_eff (f : 'a -> unit Eff.t) (xs : 'a list) : unit Eff.t =
  match xs with
  | [] -> Eff.pure ()
  | x :: rest -> f x >>= fun () -> seq_eff f rest

(* export-doc-files *)
let export_doc_files (conn : conn) (raw_doc_files : BM.t list)
    (options : options) : tx_report option Eff.t =
  let set = options.set_ui_state in
  set [ "graph/importing-state"; "step" ] (kw "pages");
  set [ "graph/importing-state"; "label" ] (kw "import/loading");
  set [ "graph/importing-state"; "total" ] (Int (List.length raw_doc_files));
  import_progress options
    [ ("step", kw "doc-files")
    ; ("total-files", Int (List.length raw_doc_files)) ];
  let sort_key (f : BM.t) =
    let path = Option.value ~default:"" (get_string f "path") in
    (not (Common_util.str_starts_with (Gp_node_path.basename path) "hls__"), path)
  in
  let doc_files =
    List.map
      (fun (i, f) -> BM.put f "idx" (Int i))
      (List.mapi (fun i f -> (i, f))
         (List.stable_sort (fun a b -> compare (sort_key a) (sort_key b))
            raw_doc_files))
  in
  index_journal_page_name_uuids doc_files options.import_state;
  let rec split_with pred = function
    | x :: xs when pred x ->
      let l, r = split_with pred xs in
      (x :: l, r)
    | rest -> ([], rest)
  in
  let annotation_files, other_files =
    split_with
      (fun f ->
        hls_annotation_md_file
          (Option.value ~default:"" (get_string f "path")))
      doc_files
  in
  (seq_eff
     (fun f -> Eff.map (fun _ -> ()) (export_doc_file f conn options))
     annotation_files
   >>= fun () ->
   seq_eff
     (fun f ->
       match get_string f "path" with
       | Some path ->
         import_hls_linked_pdf_assets path options
         >>= fun tx ->
         if tx = [] then Eff.pure ()
         else (
           let db = Datascript.db conn in
           let ops = List.map (bm_tx_op db) tx in
           let report =
             Db_tx.transact ~tx_meta:(imported_tx_meta (Some path)) conn ops
           in
           save_from_bm_tx tx options;
           options.on_tx_report report;
           Eff.pure ())
       | None -> Eff.pure ())
     annotation_files
   >>= fun () ->
   seq_eff
     (fun f -> Eff.map (fun _ -> ()) (export_doc_file f conn options))
     other_files)
  >>= fun () ->
  set_finishing_import_ui options;
  import_progress options [ ("phase", kw "normalize-journal-uuids") ];
  (match normalize_journal_uuids conn options with
   | Some r -> options.on_tx_report r
   | None -> ());
  import_progress options [ ("phase", kw "cleanup-missing-block-refs") ];
  let cleanup_report = cleanup_missing_block_refs conn options in
  (match cleanup_report with
   | Some r -> options.on_tx_report r
   | None -> ());
  (match ensure_imported_page_parent_orders conn options with
   | Some r -> options.on_tx_report r
   | None -> ());
  (if options.finalize_imported_graph then (
     import_progress options [ ("phase", kw "finalize-imported-graph") ];
     let finalize_start =
       if options.log_fn != noop_log_fn then Some (Import_profile.now_ms ())
       else None
     in
     ignore (finalize_imported_graph conn options);
     log_phase_ms options "finalize-imported-graph" finalize_start
       [ ("entities", kw "post-doc-files") ]));
  Eff.pure cleanup_report
  |> Fun.flip Eff.catch (fun e ->
     options.notify_user
       [ ( "msg"
         , String
             ("Import has unexpected error:\n" ^ Printexc.to_string e) )
       ; ("level", kw "error")
       ; ("ex-data", Map [ (kw "error", String (Printexc.to_string e)) ]) ];
     Eff.error e)

(* default-save-file *)
let default_save_file (conn : conn) (path : string) (content : string)
    : unit Eff.t =
  let db = Datascript.db conn in
  ignore
    (Db_tx.transact
       ~tx_meta:[ ("logseq.graph-parser.exporter/imported-data?", Bool true) ]
       conn
       [ bm_tx_op db
           [ ("file/path", String path); ("file/content", String content)
           ; ("file/last-modified-at",
              Instant (Int64.of_float (Import_profile.now_ms ()))) ] ]);
  Eff.pure ()

(* export-logseq-files — custom.css / custom.js under logseq/ *)
let export_logseq_files (conn : conn) (logseq_files : BM.t list)
    (options : options) : unit Eff.t =
  let pick suffix =
    List.find_opt
      (fun f ->
        match get_string f "path" with
        | Some p -> Common_util.str_ends_with p suffix
        | None -> false)
      logseq_files
  in
  let save_file =
    match options.save_file with
    | Some f -> f
    | None -> default_save_file
  in
  (match pick "logseq/custom.css" with
   | Some f ->
     options.read_file f
     >>= fun c -> save_file conn "logseq/custom.css" c
   | None -> Eff.pure ())
  >>= fun () ->
  (match pick "logseq/custom.js" with
   | Some f ->
     options.read_file f
     >>= fun c -> save_file conn "logseq/custom.js" c
   | None -> Eff.pure ())
  |> Fun.flip Eff.catch (fun error ->
     options.notify_user
       [ ( "msg"
         , String
             ("Import unexpectedly failed while reading logseq files:\n"
              ^ Printexc.to_string error) )
       ; ("level", kw "error")
       ; ("ex-data", Map [ (kw "error", String (Printexc.to_string error)) ]) ];
     Eff.pure ())

(* cljs update-in for value Maps *)
let rec value_update_in (v : value) (path : value list)
    (f : value option -> value) : value =
  match path with
  | [] -> f (match v with Nil -> None | _ -> Some v)
  | k :: rest ->
    (match v with
     | Map kvs ->
       if List.exists (fun (k', _) -> k' = k) kvs then
         Map
           (List.map
              (fun (k', x) ->
                if k' = k then (k', value_update_in x rest f) else (k', x))
              kvs)
       else Map (kvs @ [ (k, value_update_in (Map []) rest f) ])
     | _ -> v)

(* resolve-zotero-config-path — relative zotero dirs become absolute under
   the graph root (dirname(dirname(config.edn))) *)
let resolve_zotero_config_path (config : value) (config_file : BM.t) : value =
  let base_dir =
    match get_string config_file "path" with
    | Some p when Gp_node_path.is_absolute p ->
      Some (Gp_node_path.dirname (Gp_node_path.dirname p))
    | _ -> None
  in
  let to_abs (p : value option) : value =
    match base_dir, p with
    | Some base, Some (String s)
      when Unicode.trim s <> "" && not (Gp_node_path.is_absolute s) ->
      String (Gp_node_path.join [ base; s ])
    | _, Some v -> v
    | _, None -> Nil
  in
  value_update_in
    (value_update_in config
       [ kw "zotero/settings-v2"; String "default"
       ; kw "zotero-data-directory" ]
       to_abs)
    [ kw "zotero/settings-v2"; String "default"
    ; kw "zotero-linked-attachment-base-directory" ]
    to_abs

(* export-config-file — saves config.edn, sets journal title-format, and
   returns the original config value *)
let export_config_file (conn : conn) (config_file : BM.t)
    (options : options) : (attr * value) list Eff.t =
  let save_file =
    match options.save_file with
    | Some f -> f
    | None -> default_save_file
  in
  options.read_file config_file
  >>= fun content ->
  save_file conn "logseq/config.edn"
    (pretty_print_dissoc content
       (List.map fst Common_config.file_only_config))
  >>= fun () ->
  let config_value =
    match Edn_util.safe_read_string content with
    | Some v -> resolve_zotero_config_path v config_file
    | None -> Map []
  in
  let title_format =
    match Edn_util.safe_read_string content with
    | Some (Map kvs) ->
      (match
         List.find_opt
           (fun (k, _) -> k = kw "journal/page-title-format") kvs
       with
       | Some (_, v) -> Some v
       | None ->
         (match
            List.find_opt (fun (k, _) -> k = kw "date-formatter") kvs
          with
          | Some (_, v) -> Some v
          | None -> None))
    | _ -> None
  in
  (match title_format with
   | Some fmt ->
     ignore
       (transact_imported_maps conn
          [ [ ("db/ident", kw "logseq.class/Journal")
            ; ("logseq.property.journal/title-format", fmt) ] ]
          [ ("logseq.graph-parser.exporter/imported-data?", Bool true) ]
          options)
   | None -> ());
  Eff.pure (bm_of_value (Some config_value))
  |> Fun.flip Eff.catch (fun error ->
     options.notify_user
       [ ( "msg"
         , String
             "Import may have mistakes due to an invalid config.edn. Recommend re-importing with a valid config.edn" )
       ; ("level", kw "error")
       ; ("ex-data", Map [ (kw "error", String (Printexc.to_string error)) ]) ];
     Eff.pure options.default_config)

(* export-class-properties — attach user property idents to user classes *)
let export_class_properties (conn : conn) (db : db) (options : options)
    : tx_report option =
  let tag_eid = ident_eid_of db "logseq.class/Tag" in
  let prop_tag_eid = ident_eid_of db "logseq.class/Property" in
  let user_class_idents, user_class_eids =
    List.filter_map
      (fun (d : datom) ->
        match Ldb.ent_of_id db d.e with
        | Some b ->
          (match Ldb.ident_of b with
           | Some ident
             when Option.is_none (Db_class.built_in_class ident) ->
             Some (ident, b.id)
           | _ -> None)
        | None -> None)
      (List.of_seq
         (datoms db Avet ~a:"block/tags" ~v:(Ref tag_eid) ()))
    |> List.split
  in
  (* [?b :block/tags ?t] [?t :db/ident ?class] [(contains? user ?class)]
     [?b ?prop _] [?prop-e :db/ident ?prop] [?prop-e :block/tags Property] *)
  let class_props : (int, string list) Hashtbl.t = Hashtbl.create 31 in
  List.iter
    (fun (d : datom) ->
      match d.v with
      | Ref t_id ->
        (match Ldb.ent_of_id db t_id with
         | Some t ->
           (match Ldb.ident_of t with
            | Some class_ident when List.mem class_ident user_class_idents ->
              (match Ldb.ent_of_id db d.e with
               | Some b ->
                 List.iter
                   (fun (a, _tv) ->
                     if a <> "block/tags" then
                       match Ldb.ent_of_ref db (Ident a) with
                       | Some prop_e ->
                         let is_prop =
                           List.exists
                             (fun (pd : datom) -> pd.v = Ref prop_tag_eid)
                             (List.of_seq
                                (datoms db Eavt ~e:prop_e.id ~a:"block/tags" ()))
                         in
                         if is_prop && not (Ldb.built_in prop_e) then
                           Hashtbl.replace class_props t_id
                             (a
                              :: Option.value ~default:[]
                                   (Hashtbl.find_opt class_props t_id))
                       | None -> ())
                   (entity_attrs b)
               | None -> ())
            | _ -> ())
         | None -> ())
      | _ -> ())
    (List.of_seq (datoms db Avet ~a:"block/tags" ()));
  ignore user_class_eids;
  let tx =
    Hashtbl.fold
      (fun class_id prop_idents acc ->
        acc
        @ [ [ ("db/id", Ref class_id)
            ; ( "logseq.property.class/properties"
              , Vector
                  (List.map
                     (fun ident -> kw ident)
                     (List.sort_uniq compare prop_idents)) ) ] ])
      class_props []
  in
  transact_imported_maps conn tx (imported_tx_meta None) options

(* <safe-async-loop — sequential, catch -> notify-user *)
let safe_async_loop (async_fn : 'a -> unit Eff.t) (args : 'a list)
    (notify_user : BM.t -> unit) : unit Eff.t =
  seq_eff async_fn args
  |> Fun.flip Eff.catch (fun e ->
     notify_user
       [ ( "msg"
         , String
             ("Import has an unexpected error:\n" ^ Printexc.to_string e) )
       ; ("level", kw "error")
       ; ("ex-data", Map [ (kw "error", String (Printexc.to_string e)) ]) ];
     Eff.pure ())

(* read-and-copy-asset-files *)
let read_and_copy_asset_files (asset_files_in : BM.t list)
    (read_and_copy_asset :
       BM.t -> (string, BM.t) Hashtbl.t
       -> (string -> (BM.t -> BM.t) * bool) -> unit Eff.t)
    (assets_tbl : (string, BM.t) Hashtbl.t) (options : options) : unit Eff.t =
  let assets =
    (if options.rpath_key <> "path" then
       let seen = Hashtbl.create 63 in
       List.filter
         (fun f ->
           match getv f options.rpath_key with
           | Some v ->
             if Hashtbl.mem seen v then false
             else (Hashtbl.replace seen v (); true)
           | None -> true)
         asset_files_in
     else asset_files_in)
    |> List.stable_sort (fun a b ->
           compare
             (Option.value ~default:"" (get_string a "path"))
             (Option.value ~default:"" (get_string b "path")))
  in
  let asset_files =
    List.mapi (fun i f -> BM.put f "idx" (Int i)) assets
  in
  let read_and_copy (file : BM.t) : unit Eff.t =
    let path = Option.value ~default:"" (get_string file "path") in
    let idx =
      match getv file "idx" with Some (Int i) -> i | _ -> 0
    in
    import_progress options
      [ ("step", kw "assets"); ("phase", kw "read-and-copy")
      ; ("file", String path); ("file-idx", Int (idx + 1))
      ; ("total-files", Int (List.length asset_files)) ];
    let set = options.set_ui_state in
    set [ "graph/importing-state"; "step" ] (kw "assets");
    set [ "graph/importing-state"; "label" ] (kw "import/copying-assets");
    set [ "graph/importing-state"; "total" ]
      (Int (List.length asset_files));
    set [ "graph/importing-state"; "current-idx" ] (Int (idx + 1));
    set [ "graph/importing-state"; "current-page" ] (String path);
    let buffer_handler (content : string) : (BM.t -> BM.t) * bool =
      let is_edn = Common_path.file_ext path = "edn" in
      let edn_content =
        if is_edn then
          bm_of_value
            (match Edn_util.safe_read_map_string content with
             | Map _ as m -> Some m
             | _ -> None)
        else []
      in
      let pdf_annotation =
        List.exists (fun (k, _) -> k = "highlights") edn_content
      in
      let with_edn_content (m : BM.t) : BM.t =
        if edn_content = [] then m
        else BM.put m "edn-content" (mv_of_bm edn_content)
      in
      (with_edn_content, pdf_annotation)
    in
    read_and_copy_asset file assets_tbl buffer_handler
    |> Fun.flip Eff.catch (fun error ->
       options.notify_user
         [ ( "msg"
           , String
               ("Import failed to read and copy " ^ path ^ " with error:\n"
                ^ Printexc.to_string error) )
         ; ("level", kw "error")
         ; ( "ex-data"
           , Map
               [ (kw "path", String path)
               ; (kw "error", String (Printexc.to_string error)) ]) ];
       Eff.pure ())
  in
  if asset_files = [] then Eff.pure ()
  else safe_async_loop read_and_copy asset_files options.notify_user

(* insert-favorites — cljs ldb/build-favorite-tx + timestamps + squuid *)
let insert_favorites (conn : conn) (favorited_ids : string list)
    (page_id : int) (options : options) : tx_report option =
  let _, tx =
    List.fold_left
      (fun (next_id, acc) favorite_id ->
        ( next_id - 1
        , acc
          @ [ with_timestamps
                (Ldb.build_favorite_tx favorite_id
                 @ [ ("block/uuid", Uuid (squuid ()))
                   ; ("db/id", Ref next_id)
                   ; ("block/order", String (Db_order.gen_key None None))
                   ; ("block/parent", Ref page_id)
                   ; ("block/page", Ref page_id) ]) ] ))
      (-1, []) favorited_ids
  in
  transact_imported_maps conn tx (imported_tx_meta None) options

(* favorite-config-page-name — bare name or [[page]] ref *)
let favorite_config_page_name (page_name : value option) : string option =
  match page_name with
  | Some (String s) -> Some (Page_ref.get_page_name_exn (String.trim s))
  | Some _ -> None
  | None -> None

(* find-namespace-page — OG foo/bar stored as page bar with parent foo *)
let find_namespace_page (db : db) (page_name : string) : entity option =
  let parts = String.split_on_char '/' page_name in
  match parts with
  | _first :: rest when rest <> [] ->
    let first_page = Ldb.get_page db (String (List.hd parts)) in
    List.fold_left
      (fun parent part ->
        match parent with
        | None -> None
        | Some p ->
          let target = Ldb.page_name_sanity_lc part in
          let r =
            List.find_opt
              (fun (child : entity) ->
                page_entity child
                && Ldb.string_value child "block/name" = Some target)
              (List.filter_map
               (fun (d : datom) -> Ldb.ent_of_id db d.e)
               (List.of_seq
                  (datoms db Avet ~a:"block/parent" ~v:(Ref p.id) ())))
          in
          r)
      first_page rest
  | _ -> None

(* get-imported-favorite-page *)
let get_imported_favorite_page (db : db) (page_name : value) : entity option =
  let name' = favorite_config_page_name (Some page_name) in
  match name' with
  | Some n ->
    (match Ldb.get_page db (String n) with
     | Some _ as p -> p
     | None ->
       if Ns_util.namespace_page (Some n) then find_namespace_page db n
       else None)
  | None -> None

(* export-favorites-from-config-edn *)
let export_favorites_from_config_edn (conn : conn) (config : (attr * value) list)
    (options : options) : unit =
  let favorites =
    match
      List.find_opt (fun (k, _) -> k = "favorites") config
    with
    | Some (_, Vector vs) | Some (_, List vs) -> vs
    | Some (_, v) -> [ v ]
    | None -> []
  in
  if favorites <> [] then
    let favorited_ids =
      List.filter_map
        (fun page_name ->
          match get_imported_favorite_page (Conn.db conn) page_name with
          | Some e ->
            (match Ldb.value e "block/uuid" with
             | Some (Uuid u) | Some (String u) -> Some u
             | _ -> None)
          | None -> None)
        favorites
    in
    if favorited_ids <> [] then
      match
        Ldb.get_page (Conn.db conn) (String Common_config.favorites_page_name)
      with
      | Some page_entity_ ->
        ignore (insert_favorites conn favorited_ids page_entity_.id options)
      | None -> ()
    else
      options.log_fn
        [ String "no-favorites-found"
        ; mv_of_bm [ ("favorites", Vector favorites) ] ]

(* build-doc-options *)
let build_doc_options (config : (attr * value) list) (options : options)
    : options =
  { options with
    user_config = config
  ; user_options =
      (* cljs merges {:remove-inline-tags? true :convert-all-tags? true}
         under :user-options — user-supplied values win; the defaults are
         already true in default_user_options *)
      options.user_options
  ; import_state = new_import_state ()
  ; macros =
      (if options.macros <> [] then options.macros
       else
         match List.find_opt (fun (k, _) -> k = "macros") config with
         | Some (_, Map kvs) ->
           List.filter_map
             (fun (k, v) ->
               match k, v with
               | (Keyword name | String name), String body -> Some (name, body)
               | _ -> None)
             kvs
         | _ -> [])
  ; extract_date_formatter = Some (get_date_formatter config)
  ; extract_user_config =
      List.filter
        (fun (k, _) ->
          k <> "property-pages/excludelist"
          && k <> "property-pages/enabled?")
        config
  ; extract_filename_format =
      (match List.find_opt (fun (k, _) -> k = "file/name-format") config with
       | Some (_, String s) -> Some s
       | Some (_, Keyword s) -> Some s
       | _ -> Some "legacy")
  ; extract_verbose = options.verbose }

(* move-top-parent-pages-to-library *)
let move_top_parent_pages_to_library (conn : conn) (options : options)
    : tx_report option =
  let db = Conn.db conn in
  match Ldb.get_built_in_page db Common_config.library_page_name with
  | None -> None
  | Some library_page ->
    let library_id =
      match Ldb.value library_page "block/uuid" with
      | Some (Uuid u) | Some (String u) -> u
      | _ -> ""
    in
    let top_parent_pages =
      List.filter_map
        (fun (d : datom) ->
          match d.v with
          | Ref parent_id ->
            (match Ldb.ent_of_id db d.e, Ldb.ent_of_id db parent_id with
             | Some child, Some parent ->
               if Ldb.value parent "block/parent" = None
                  && page_entity child && page_entity parent
               then Some parent
               else None
             | _ -> None)
          | _ -> None)
        (List.of_seq (datoms db Avet ~a:"block/parent" ()))
      |> List.sort_uniq (fun (a : entity) b -> compare a.id b.id)
    in
    let tx =
      List.map
        (fun (parent : entity) ->
          [ ("db/id", Ref parent.id)
          ; ( "block/parent"
            , Ref_to (Lookup_ref ("block/uuid", Uuid library_id)) )
          ; ("block/order", String (Db_order.gen_key None None)) ])
        top_parent_pages
    in
    transact_imported_maps conn tx (imported_tx_meta None) options

(* partition-graph-files *)
type partitioned_files =
  { pf_files : BM.t list
  ; pf_logseq_files : BM.t list
  ; pf_asset_files : BM.t list
  ; pf_doc_files : BM.t list }

let partition_graph_files (raw_files : BM.t list) (config : (attr * value) list)
    (rpath_key : string) : partitioned_files =
  let files =
    Common_config.remove_hidden_files raw_files config
      (fun f ->
        Option.value ~default:""
          (match getv f rpath_key with
           | Some (String s) -> Some s
           | _ -> None))
  in
  let normalized_rpath (f : BM.t) : string option =
    match getv f rpath_key with
    | Some (String s) -> Some (Gp_node_path.normalize s)
    | Some _ -> None
    | None -> None
  in
  let is_logseq f =
    match normalized_rpath f with
    | Some p -> Common_util.str_starts_with p "logseq/"
    | None -> false
  in
  let is_asset f =
    match normalized_rpath f with
    | Some p -> Common_util.str_starts_with p "assets/"
    | None -> false
  in
  let doc_files =
    List.filter
      (fun f ->
        (not (is_logseq f))
        && (not (is_asset f))
        &&
        match get_string f "path" with
        | Some p ->
          List.mem (Common_path.file_ext p)
            [ "md"; "org"; "markdown"; "edn" ]
        | None -> false)
      files
  in
  { pf_files = files
  ; pf_logseq_files = List.filter is_logseq files
  ; pf_asset_files = List.filter is_asset files
  ; pf_doc_files = doc_files }

(* <export-file-graph-steps *)
let export_file_graph_steps (conn : conn) (config : (attr * value) list)
    (partitioned : partitioned_files) (options : options)
    (doc_options : options) : BM.t list Eff.t =
  if options.log_fn != noop_log_fn then
    options.log_fn
      [ String "Importing"; Int (List.length partitioned.pf_doc_files)
      ; String "files ..." ];
  import_progress doc_options [ ("step", kw "logseq-files") ];
  export_logseq_files conn partitioned.pf_logseq_files options
  >>= fun () ->
  import_progress doc_options [ ("step", kw "assets") ];
  (match options.read_and_copy_asset with
   | Some rc ->
     read_and_copy_asset_files partitioned.pf_asset_files rc
       doc_options.import_state.assets
       { options with
         notify_user = options.notify_user
       ; set_ui_state = options.set_ui_state
       ; rpath_key = options.rpath_key
       ; import_watchdog = options.import_watchdog }
   | None -> Eff.pure ())
  >>= fun () ->
  import_progress doc_options
    [ ("step", kw "doc-files")
    ; ("total-files", Int (List.length partitioned.pf_doc_files)) ];
  export_doc_files conn partitioned.pf_doc_files
    { doc_options with finalize_imported_graph = false }
  >>= fun _ ->
  set_finishing_import_ui options;
  import_progress doc_options [ ("step", kw "favorites") ];
  export_favorites_from_config_edn conn config options;
  import_progress doc_options [ ("step", kw "class-properties") ];
  ignore (export_class_properties conn (Conn.db conn) doc_options);
  import_progress doc_options [ ("step", kw "move-to-library") ];
  ignore (move_top_parent_pages_to_library conn doc_options);
  import_progress doc_options [ ("phase", kw "finalize-imported-graph") ];
  let finalize_start =
    if options.log_fn != noop_log_fn then Some (Import_profile.now_ms ())
    else None
  in
  ignore (finalize_imported_graph conn doc_options);
  log_phase_ms options "finalize-imported-graph" finalize_start [];
  Eff.pure partitioned.pf_files

(* export-file-graph — the entry point *)
let export_file_graph (_repo_or_conn : conn) (conn : conn)
    (config_file : BM.t) (raw_files : BM.t list) (options_in : options)
    : BM.t Eff.t =
  let log_fn =
    if options_in.log_fn != noop_log_fn then options_in.log_fn
    else if options_in.verbose then
      (fun args ->
        match args with
        | String s :: _ -> Printf.eprintf "%s\n" s
        | _ -> ())
    else noop_log_fn
  in
  let watchdog =
    match options_in.import_timeout_ms with
    | Some timeout ->
      Some
        (let heartbeat_ms = options_in.import_heartbeat_ms in
         Import_profile.new_watchdog ~timeout_ms:timeout ?heartbeat_ms
           ~log_fn:(fun s kvs -> log_fn [ String s; mv_of_bm kvs ])
           ())
    | None -> None
  in
  let options =
    { options_in with
      log_fn
    ; import_watchdog =
        (match watchdog with Some w -> Some w | None -> options_in.import_watchdog) }
  in
  Gp_block.export_to_db_graph := true;
  (Db_tx.flags_of conn).skip_store <- true;
  let set = options.set_ui_state in
  import_progress options [ ("step", kw "config"); ("phase", kw "read-config") ];
  set [ "graph/importing-state"; "step" ] (kw "config");
  set [ "graph/importing-state"; "label" ] (kw "import/loading");
  set [ "graph/importing-state"; "current-page" ]
    (match getv config_file options.rpath_key with
     | Some v -> v
     | None -> Nil);
  (match watchdog with
   | Some w -> Import_profile.start_watchdog w
   | None -> ());
  (export_config_file conn config_file options
   >>= fun config ->
   let partitioned =
     partition_graph_files raw_files config options.rpath_key
   in
   let doc_options = build_doc_options config options in
   export_file_graph_steps conn config partitioned options doc_options
   >>= fun files ->
   Eff.pure
     [ ( "import-state"
       , mv_of_bm
           [ ( "ignored-properties"
             , Vector
                 (List.map mv_of_bm
                    !(doc_options.import_state.ignored_properties)) )
           ; ( "ignored-files"
             , Vector
                 (List.map mv_of_bm !(doc_options.import_state.ignored_files)) )
           ; ( "ignored-assets"
             , Vector
                 (List.map mv_of_bm
                    !(doc_options.import_state.ignored_assets)) )
           ; ( "all-existing-page-uuids"
             , mv_of_bm
                 (Hashtbl.fold
                    (fun k v acc -> (k, mv_of_bm v) :: acc)
                    doc_options.import_state.all_existing_page_uuids []) )
           ; ( "page-names-to-uuids"
             , mv_of_bm
                 (Hashtbl.fold
                    (fun k v acc -> (k, String v) :: acc)
                    doc_options.import_state.page_names_to_uuids []) ) ] )
     ; ("files", Vector (List.map mv_of_bm files)) ])
  |> (fun eff ->
     Eff.finally eff (fun () ->
       (Db_tx.flags_of conn).skip_store <- false;
       (match (Datascript.db conn).storage_ref with
        | Some storage ->
          ignore (Datascript.store (Datascript.db conn));
          Datascript.store_tail storage []
        | None -> ());
       Gp_block.export_to_db_graph := false;
       (match watchdog with
        | Some w -> Import_profile.stop_watchdog w
        | None -> ());
       Eff.pure ()))
  |> Fun.flip Eff.catch (fun e ->
     Gp_block.export_to_db_graph := false;
     options.notify_user
       [ ( "msg"
         , String
             ("Import has unexpected error:\n" ^ Printexc.to_string e) )
       ; ("level", kw "error")
       ; ("ex-data", Map [ (kw "error", String (Printexc.to_string e)) ]) ];
     Eff.error e)

