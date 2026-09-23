(* logseq.graph-parser.block — page-name->map and journal title conversion.
   Only the DB-graph paths are ported; file-graph extras (:block/type,
   :block/namespace) are retained since page-name->map is dual-purpose. *)
open Datascript

let sanitize_hashtag_name (s : string) : string =
  (* cljs string/replace s "#" "HashTag-" *)
  let b = Buffer.create (String.length s) in
  String.iter
    (fun c -> if c = '#' then Buffer.add_string b "HashTag-" else Buffer.add_char b c)
    s;
  Buffer.contents b

(* gp-block/*export-to-db-graph?* *)
let export_to_db_graph = ref false

(* alias so optional-arg shadowing can still read the flag *)
let export_to_db_graph_ref = export_to_db_graph

let page_entity (e : entity) : bool =
  Ldb.is_page e
  || (match Ldb.value e "block/type" with
      | Some (String ("page" | "journal")) -> true
      | _ -> false)

(* convert-page-if-journal (memoized on (name, formatter)) *)
module CPJ = struct
  module H = Hashtbl.Make (struct
    type t = string * string option * bool
    let equal (a1, b1, c1) (a2, b2, c2) = a1 = a2 && b1 = b2 && c1 = c2
    let hash = Hashtbl.hash
  end)
  let tbl = H.create 127
end

let convert_page_if_journal ?(export_to_db_graph : bool option)
    (original_page_name : string) (date_formatter : string option)
    : string * string * int option =
  let export_to_db_graph =
    Option.value ~default:!export_to_db_graph_ref export_to_db_graph
  in
  let key = (original_page_name, date_formatter, export_to_db_graph) in
  match CPJ.H.find_opt CPJ.tbl key with
  | Some r -> r
  | None ->
    let r =
      let page_name = Ldb.page_name_sanity_lc original_page_name in
      let day =
        match date_formatter with
        | None -> None
        | Some fmt ->
          (* cljs passes [date-formatter] (not safe-journal-title-formatters)
             when exporting to a db graph. *)
          Date_time_util.journal_title_to_int
            ~formatters:
              (if export_to_db_graph then
                 [ fmt ]
               else
                 Date_time_util.safe_journal_title_formatters (Some fmt))
            page_name
      in
      match day with
      | Some day ->
        let original' =
          match date_formatter with
          | Some fmt -> Ldb.journal_title_of_day day fmt
          | None -> original_page_name
        in
        let default_name =
          Ldb.page_name_sanity_lc
            (Ldb.journal_title_of_day day Date_time_util.default_journal_title_formatter)
        in
        (original', default_name, Some day)
      | None -> (original_page_name, page_name, None)
    in
    CPJ.H.add CPJ.tbl key r;
    r

(* get-page — first (lowest eid) page entity by name *)
let get_page_by_name db (page_name : string) : entity option =
  match List.sort compare (List.map (fun (d : datom) -> d.e) (Ldb.pages_by_name db page_name)) with
  | id :: _ -> Ldb.ent_of_id db id
  | [] -> None

type page_map_opts =
  { with_timestamp : bool
  ; page_uuid : string option
  ; from_page : string option
  ; class_ : bool
  ; skip_existing_page_check : bool
  ; skip_journal : bool }

let default_page_map_opts =
  { with_timestamp = false
  ; page_uuid = None
  ; from_page = None
  ; class_ = false
  ; skip_existing_page_check = false
  ; skip_journal = false }

(* page-name-string->map — returns (block map, existing page entity option) *)
let page_name_string_to_map (original_page_name : string) db (date_formatter : string option)
    (opts : page_map_opts) : Block_map.t * entity option =
  let db_based = Ldb.db_based_graph db in
  let original_page_name = Ldb.remove_boundary_slashes original_page_name in
  let original_page_name', page_name, journal_day =
    if opts.skip_journal then
      (original_page_name, Ldb.page_name_sanity_lc original_page_name, None)
    else convert_page_if_journal original_page_name date_formatter
  in
  let namespace =
    (not db_based || !export_to_db_graph)
    && journal_day = None
    && (match Ns_util.get_nested_page_name original_page_name' with
        | Some _ -> false
        | None -> true)
    && Ns_util.namespace_page (Some original_page_name')
  in
  let page_e =
    if opts.skip_existing_page_check then None
    else
      match journal_day with
      | Some day -> Ldb.get_journal_page_by_day db day
      | None ->
        if opts.class_ && db_based then
          (match Ldb.page_exists_ids db original_page_name' [ "logseq.class/Tag" ] with
           | id :: _ -> Ldb.ent_of_id db id
           | [] -> None)
        else get_page_by_name db original_page_name'
  in
  let original_page_name' =
    match opts.from_page with
    | Some f -> f
    | None ->
      (match page_e with
       | Some e ->
         (match Ldb.value e "block/title" with
          | Some (String t) -> t
          | _ -> original_page_name')
       | None -> original_page_name')
  in
  let page_name' =
    match journal_day, page_e with
    | Some _, Some e ->
      (match Ldb.value e "block/name" with Some (String n) -> n | _ -> page_name)
    | _ -> page_name
  in
  let m =
    [ "block/name", String page_name'
    ; "block/title", String original_page_name' ]
    @ (match original_page_name with
       | name
         when Unicode.lowercase name
              <> Unicode.lowercase original_page_name'
              && not !export_to_db_graph ->
         [ "block.temp/original-page-name", String name ]
       | _ -> [])
    @ (match opts.class_, page_e with
       | true, Some e
         when Option.is_some (Ldb.ident_of e) && Option.is_some (Ldb.value e "block/uuid") ->
         [ "block/uuid", (match Ldb.value e "block/uuid" with Some v -> v | None -> assert false)
         ; "db/ident", Keyword (Option.get (Ldb.ident_of e)) ]
       | _ ->
         let new_uuid =
           match opts.page_uuid with
           | Some u -> u
           | None ->
             (match journal_day with
              | Some d -> Common_uuid.gen_journal_page_uuid d
              | None -> Common_uuid.new_block_id ())
         in
         let new_uuid =
           if opts.skip_existing_page_check then new_uuid
           else
             match page_e, opts.page_uuid with
             | Some e, _ ->
               (match Ldb.value e "block/uuid" with
                | Some (Uuid u) -> u
                | _ -> new_uuid)
             | None, Some u -> u
             | None, None -> new_uuid
         in
         [ "block/uuid", Uuid new_uuid ])
    @ (if namespace then
         match Ns_util.split_last "/" original_page_name with
         | ns, _ when Unicode.trim ns <> "" ->
           [ "block/namespace"
           , Block_map.normalize_value
               (Map [ String "block/name", String (Unicode.trim (Ldb.page_name_sanity_lc ns)) ]) ]
         | _ -> []
       else [])
    @ (if opts.with_timestamp && (opts.skip_existing_page_check || page_e = None) then
         let now = int_of_float (Clock.now_ms ()) in
         [ "block/created-at", Int now; "block/updated-at", Int now ]
       else [])
    @ (match journal_day with
       | Some day ->
         [ "block/journal-day", Int day ]
         @ (if db_based then [ "block/tags", Vector [ Keyword "logseq.class/Journal" ] ]
            else [ "block/type", String "journal" ])
       | None -> [])
  in
  (m, page_e)

(* gp-block/page-name->map *)
let page_name_to_map (original_page_name : string) db (with_timestamp : bool)
    (date_formatter : string option) ?(opts = default_page_map_opts) () : Block_map.t option =
  let uuid_name_no_page =
    Ldb.is_uuid_string original_page_name
    && (match entity db (Lookup_ref ("block/uuid", Uuid original_page_name)) with
        | Some e -> not (page_entity e)
        | None -> true)
  in
  if uuid_name_no_page then None
  else
    let db_based = Ldb.db_based_graph db in
    let original_page_name =
      let t = Unicode.trim original_page_name in
      if db_based then sanitize_hashtag_name t else t
    in
    match page_name_string_to_map original_page_name db date_formatter
            { opts with with_timestamp = with_timestamp } with
    | (page, _page_entity) when page <> [] ->
      let page =
        if db_based then
          match Block_map.attr_value page "block/tags" with
          | Some _ when opts.class_ -> Block_map.put page "block/tags" (Vector [ Keyword "logseq.class/Tag" ])
          | Some _ -> page
          | None ->
            let tags =
              if opts.class_ then Vector [ Keyword "logseq.class/Tag" ]
              else Vector [ Keyword "logseq.class/Page" ]
            in
            Block_map.put page "block/tags" tags
        else
          match Block_map.attr_value page "block/type" with
          | Some _ -> page
          | None -> Block_map.put page "block/type" (String "page")
      in
      Some page
    | _ -> None

(* ---------------------------------------------------------------- *)
(* The rest of logseq.graph-parser.block — the file-graph extraction
   pipeline (extract-blocks etc). Block maps are (attr * value) list
   (= Block_map.t); mldoc AST nodes are [value]s. *)

let heading_block (block : value) : bool =
  match block with Vector (String "Heading" :: _) -> true | _ -> false

let paragraph_block (block : value) : bool =
  match block with Vector (String "Paragraph" :: _) -> true | _ -> false

let timestamp_block (block : value) : bool =
  match block with Vector (String "Timestamp" :: _) -> true | _ -> false

(* gp-block/get-tag *)
let get_tag (block : value) : string option =
  match block with
  | Vector [ String "Tag"; tag_value ] ->
    let parts =
      List.map
        (fun pair ->
          match pair with
          | Vector [ String "Plain"; String v ] -> v
          | Vector [ String "Link"; m ] ->
            (match Clj_value.map_get_str m "full_text" with
             | Some s -> s
             | None -> "")
          | Vector [ String "Nested_link"; m ] ->
            (match Clj_value.map_get_str m "content" with
             | Some s -> s
             | None -> "")
          | _ -> "")
        (Clj_value.coll_items tag_value)
    in
    Some (String.concat "" parts)
  | _ -> None

(* gp-block/inline-nodes->plain-text — tree-seq over sequential nodes,
   collecting the second element of Plain/Spaces/Verbatim/Code nodes. *)
let inline_nodes_to_plain_text (nodes : value list) : string option =
  let buf = Buffer.create 64 in
  let rec walk (v : value) =
    match v with
    | Vector [ String t; String s ]
      when t = "Plain" || t = "Spaces" || t = "Verbatim" || t = "Code" ->
      Buffer.add_string buf s
    | Vector xs | List xs -> List.iter walk xs
    | _ -> ()
  in
  List.iter walk nodes;
  let s = Unicode.trim (Buffer.contents buf) in
  if s = "" then None else Some s

(* gp-block/get-page-reference — returns the referenced page name, a macro
   {:type "macro" ...} map, or none. *)
let get_page_reference (block : value) (format : string) : value option =
  let page : value option =
    match block with
    | Vector [ String "Link"; data ] ->
      let url = Clj_value.map_get data "url" in
      let url_items = Clj_value.coll_items url in
      let url_type = match url_items with String t :: _ -> Some t | _ -> None in
      let value =
        match url_items with _ :: v :: _ -> Some v | _ -> None
      in
      let value_s = match value with Some (String s) -> Some s | _ -> None in
      (match url_type with
       | Some "Page_ref" ->
         (match value_s with
          | Some v when not (Common_config.local_relative_asset v) ->
            Some (String v)
          | _ -> None)
       | Some "Search" ->
         (match value_s with
          | Some v when Page_ref.is_page_ref v ->
            Some (String (Gp_text.page_ref_un_brackets v))
          | Some v when format = "org" && not (Common_config.local_relative_asset v) ->
            Some (String v)
          | _ -> None)
       | Some "File" ->
         (match Clj_value.coll_items (Clj_value.map_get data "label")
                |> inline_nodes_to_plain_text with
          | Some s -> Some (String s)
          | None -> None)
       | _ -> None)
    | Vector [ String "Nested_link"; data ] ->
      (match Clj_value.map_get_str data "content" with
       | Some content when String.length content >= 4 ->
         Some (String (String.sub content 2 (String.length content - 4)))
       | _ -> None)
    | Vector [ String "Macro"; data ] ->
      let name = Clj_value.map_get_str data "name" in
      let arguments =
        List.filter_map Clj_value.string_of_kwish
          (Clj_value.coll_items (Clj_value.map_get data "arguments"))
      in
      (match name with
       | Some "embed" ->
         let argument = String.concat ", " arguments in
         if Page_ref.is_page_ref argument then
           Some (String (Gp_text.page_ref_un_brackets argument))
         else None
       | _ ->
         Some
           (Map
              [ Keyword "type", String "macro"
              ; Keyword "name", (match name with Some n -> String n | None -> Nil)
              ; Keyword "arguments",
                Vector (List.map (fun a -> String a) arguments) ]))
    | Vector (String "Tag" :: _) ->
      (match get_tag block with
       | Some t -> Some (String (Gp_text.page_ref_un_brackets t))
       | None -> None)
    | _ -> None
  in
  match page with
  | Some (String s) ->
    (match Block_ref.get_block_ref_id s with
     | Some id -> Some (String id)
     | None -> Some (String s))
  | other -> other

(* gp-block/get-block-reference — returns a uuid string *)
let get_block_reference (block : value) : string option =
  let block_id : string option =
    match block with
    | Vector [ String "Block_reference"; String id ] -> Some id
    | Vector (String "Block_reference" :: rest) ->
      (match List.rev rest with String id :: _ -> Some id | _ -> None)
    | Vector [ String "Link"; data ] when Clj_value.is_map data ->
      (match Clj_value.map_get data "url" with
       | url ->
         (match Clj_value.coll_items url with
          | String "Block_ref" :: _ ->
            (match Clj_value.coll_items url with
             | [ _; String id ] -> Some id
             | _ -> None)
          | _ :: (second :: _) ->
            (match second with
             | Map _ ->
               (match Clj_value.map_get_str second "protocol" with
                | Some "id" -> Clj_value.map_get_str second "link"
                | _ -> None)
             | String id ->
               (match Block_ref.get_block_ref_id id with
                | Some i -> Some i
                | None -> Some id)
             | _ -> None)
          | _ -> None))
    | Vector [ String "Macro"; data ] ->
      (match Clj_value.map_get_str data "name",
             Clj_value.coll_items (Clj_value.map_get data "arguments") with
       | Some "embed", (String first :: _) when Block_ref.string_block_ref first ->
         Some (Block_ref.get_string_block_ref_id first)
       | _ -> None)
    | _ -> None
  in
  match block_id with
  | Some id when Common_util.uuid_string id -> Some id
  | _ -> None

(* cljs :property-pages/enabled? excludelist from user-config *)
type property_pages_config =
  { pp_enabled : bool option
  ; pp_excludelist : string list }

let property_pages_config (user_config : (attr * value) list) : property_pages_config =
  { pp_enabled =
      (match List.assoc_opt "property-pages/enabled?" user_config with
       | Some (Bool b) -> Some b
       | _ -> None)
  ; pp_excludelist =
      (match List.assoc_opt "property-pages/excludelist" user_config with
       | Some v -> List.filter_map Clj_value.string_of_kwish (Clj_value.coll_items v)
       | None -> []) }

(* gp-block/get-page-refs-from-property-names *)
let get_page_refs_from_property_names (properties : (value * value * value) list)
    (ppc : property_pages_config) : string list =
  let enabled =
    match ppc.pp_enabled with Some true | None -> true | Some false -> false
  in
  if not enabled then []
  else
    let excluded = ppc.pp_excludelist in
    let builtins =
      List.filter
        (fun k -> not (List.mem k Gp_property.editable_linkable_built_in_properties))
        (Gp_property.editable_built_in_properties ())
      @ Gp_property.hidden_built_in_properties ()
    in
    properties
    |> List.filter_map (fun (k, _v, _ast) -> Clj_value.string_of_kwish k)
    |> List.filter (fun s -> Unicode.trim s <> "")
    |> List.filter (fun s -> not (List.mem s excluded))
    |> List.filter (fun s -> not (List.mem s builtins))
    |> Common_util.distinct_by Fun.id

(* gp-block/get-page-ref-names-from-properties *)
let get_page_ref_names_from_properties (properties : (value * value * value) list)
    (user_config : (attr * value) list) : string list =
  let non_linkable_editables =
    List.filter
      (fun k -> not (List.mem k Gp_property.editable_linkable_built_in_properties))
      (Gp_property.editable_built_in_properties ())
  in
  let hidden = Gp_property.hidden_built_in_properties () in
  let page_refs =
    properties
    |> List.filter (fun (k, _v, _ast) ->
           match Clj_value.string_of_kwish k with
           | Some ks ->
             not (List.mem ks non_linkable_editables || List.mem ks hidden)
           | None -> true)
    |> List.concat_map (fun (_k, v, mldoc_ast) ->
           let ast_refs =
             Clj_value.coll_items mldoc_ast
             |> Gp_text.extract_refs_from_mldoc_ast
             |> Clj_value.coll_items
           in
           let value_refs =
             Clj_value.coll_items v
             |> List.filter_map
                  (fun x ->
                    match x with
                    | String s when Unicode.trim s <> "" -> Some (String s)
                    | _ -> None)
           in
           ast_refs @ value_refs)
  in
  let names = get_page_refs_from_property_names properties (property_pages_config user_config) in
  page_refs @ List.map (fun s -> String s) names
  |> List.filter_map Clj_value.string_of_kwish
  |> List.filter (fun s -> Unicode.trim s <> "")
  |> Common_util.distinct_by Fun.id

(* clojure.walk/postwalk over values *)
let rec postwalk (f : value -> value) (x : value) : value =
  let inner =
    match x with
    | Vector xs -> Vector (List.map (postwalk f) xs)
    | List xs -> List (List.map (postwalk f) xs)
    | Set xs -> Set (List.map (postwalk f) xs)
    | Map kvs -> Map (List.map (fun (k, v) -> (postwalk f k, postwalk f v)) kvs)
    | Tuple vs -> Tuple (List.map (Option.map (postwalk f)) vs)
    | other -> other
  in
  f inner

let rec prewalk (f : value -> value) (x : value) : value =
  match f x with
  | Vector xs -> Vector (List.map (prewalk f) xs)
  | List xs -> List (List.map (prewalk f) xs)
  | Set xs -> Set (List.map (prewalk f) xs)
  | Map kvs -> Map (List.map (fun (k, v) -> (prewalk f k, prewalk f v)) kvs)
  | Tuple vs -> Tuple (List.map (Option.map (prewalk f)) vs)
  | other -> other

(* gp-block/extract-block-refs — collect [:block/uuid <id>] lookup maps *)
let extract_block_refs (nodes : value list) : value list =
  let ref_blocks = ref [] in
  List.iter
    (fun node ->
      ignore
        (postwalk
           (fun form ->
             (match get_block_reference form with
              | Some id -> ref_blocks := id :: !ref_blocks
              | None -> ());
             form)
           node))
    nodes;
  !ref_blocks
  |> List.filter Common_util.uuid_string
  |> List.map (fun id -> Vector [ Keyword "block/uuid"; Uuid id ])

(* extract-properties result *)
type extract_properties_result =
  { properties : (attr * value) list
  ; properties_order : attr list
  ; properties_text_values : (attr * value) list
  ; invalid_properties : string list
  ; page_refs : string list
  ; block_refs : value list }

let empty_properties_result =
  { properties = []
  ; properties_order = []
  ; properties_text_values = []
  ; invalid_properties = []
  ; page_refs = []
  ; block_refs = [] }

(* gp-block/extract-properties — [properties] is a list of
   [k v mldoc-references-ast] triples *)
let extract_properties (properties : value list)
    (user_config : (attr * value) list) : extract_properties_result option =
  if properties = [] then None
  else
    let invalid = ref [] in
    let triples =
      properties
      |> List.filter_map (fun triple ->
             match triple with
             | Vector [ k; v; mldoc_ast ] | List [ k; v; mldoc_ast ] ->
               let ks =
                 match k with
                 | Keyword s | Symbol s -> s
                 | String s -> s
                 | _ -> Edn_util.pr_str k
               in
               let ks = Unicode.lowercase ks in
               let ks = Common_util.str_replace_all ks "/" "-" in
               let ks = Common_util.str_replace_all ks " " "-" in
               let ks = Common_util.str_replace_all ks "_" "-" in
               if Gp_property.valid_property_name (":" ^ ks) then
                 let k' = if ks = "custom_id" || ks = "custom-id" then "id" else ks in
                 let v' =
                   Gp_text.parse_property k'
                     (match v with String s -> s | _ -> Edn_util.pr_str v)
                     (Clj_value.coll_items mldoc_ast) user_config
                 in
                 (match v' with
                  | Nil -> None
                  | _ ->
                    Some (k', v', mldoc_ast, (match v with String s -> s | _ -> Edn_util.pr_str v)))
               else begin
                 invalid := ks :: !invalid;
                 None
               end
             | _ -> None)
    in
    let as_triples = List.map (fun (k, v, mldoc_ast, _orig) ->
        Vector [ Keyword k; v; mldoc_ast ]) triples in
    let page_refs =
      get_page_ref_names_from_properties
        (List.map (fun (k, v, mldoc_ast, _o) -> (Keyword k, v, mldoc_ast)) triples)
        user_config
    in
    let block_refs = extract_block_refs as_triples in
    { properties = List.map (fun (k, v, _a, _o) -> (k, v)) triples
    ; properties_order = List.map (fun (k, _v, _a, _o) -> k) triples
    ; properties_text_values = List.map (fun (k, _v, _a, o) -> (k, String o)) triples
    ; invalid_properties = !invalid
    ; page_refs
    ; block_refs }
    |> Option.some

let paragraph_timestamp_block (block : value) : bool =
  match block with
  | Vector [ String "Paragraph"; inner ] ->
    (match Clj_value.coll_items inner with
     | first :: _ -> timestamp_block first ||
                     (match Clj_value.coll_items inner with
                      | _ :: second :: _ -> timestamp_block second
                      | _ -> false)
     | [] -> false)
  | _ -> false

(* gp-block/extract-timestamps — Paragraph body may contain
   ["Timestamp" ["Deadline" m]] / ["Timestamp" ["Scheduled" m]] nodes;
   returns (kind * data) pairs. *)
let extract_timestamps (block : value) : (string * value) list =
  match block with
  | Vector [ String "Paragraph"; inner ] ->
    List.filter_map
      (fun t ->
        match t with
        | Vector [ String "Timestamp"; Vector [ String kind; data ] ]
        | List [ String "Timestamp"; List [ String kind; data ] ] ->
          Some (kind, data)
        | Vector [ String "Timestamp"; List [ String kind; data ] ]
        | List [ String "Timestamp"; Vector [ String kind; data ] ] ->
          Some (kind, data)
        | Vector (String "Timestamp" :: rest) | List (String "Timestamp" :: rest) ->
          (match List.rev rest with
           | Vector [ String kind; data ] :: _ | List [ String kind; data ] :: _ ->
             Some (kind, data)
           | _ -> None)
        | _ -> None)
      (List.filter timestamp_block (Clj_value.coll_items inner))
  | _ -> []

(* gp-block/timestamp->scheduled-or-deadline-value *)
let timestamp_to_scheduled_or_deadline_value (ts : value) : value =
  let date = Clj_value.map_get ts "date" in
  let year = Clj_value.map_get_int date "year" |> Option.value ~default:0 in
  let month = Clj_value.map_get_int date "month" |> Option.value ~default:0 in
  let day = Clj_value.map_get_int date "day" |> Option.value ~default:0 in
  let day =
    int_of_string
      (Printf.sprintf "%d%s%s" year (Common_util.zero_pad month)
         (Common_util.zero_pad day))
  in
  let time_v = Clj_value.map_get ts "time" in
  let repetition = Clj_value.map_get ts "repetition" in
  if Clj_value.truthy time_v || Clj_value.truthy repetition then
    Map
      ([ Some ("date-int", Int day)
       ; (match time_v with Nil -> None | _ -> Some ("time", time_v))
       ; (match repetition with Nil -> None | _ -> Some ("repetition", repetition)) ]
       |> List.filter_map Fun.id
       |> List.map (fun (a, v) -> (Keyword a, v)))
  else Int day

(* gp-block/timestamps->scheduled-and-deadline *)
let timestamps_to_scheduled_and_deadline (timestamps : (string * value) list)
    : (attr * value) list =
  List.filter_map
    (fun (k, v) ->
      match Unicode.lowercase k with
      | "scheduled" -> Some ("scheduled", timestamp_to_scheduled_or_deadline_value v)
      | "deadline" -> Some ("deadline", timestamp_to_scheduled_or_deadline_value v)
      | _ -> None)
    timestamps

(* gp-block/db-namespace-page? *)
let db_namespace_page (db_based : bool) (page : string) : bool =
  db_based
  && Ns_util.namespace_page (Some page)
  && not (Date_time_util.valid_journal_title_with_slash page)

(* shared name->uuid map used by ref->map *)
module Name_id = Hashtbl.Make (struct
  type t = string
  let equal = String.equal
  let hash = Hashtbl.hash
end)

let bm_to_map (m : Block_map.t) : value =
  Map (List.map (fun (a, v) -> (Keyword a, v)) m)

let bm_of_map (v : value) : Block_map.t =
  Clj_value.map_entries_named v

(* gp-block/ref->map — resolves page/tag names into page maps.
   [col] contains String page names, page maps, and macro maps (skipped). *)
let ref_to_map db (col : value list)
    ~(date_formatter : string option) ~(name_to_id : string Name_id.t)
    ~(tag : bool) ~(db_based : bool) ~(structured_tags : string list) : value list =
  let col =
    List.filter
      (fun p ->
        match p with
        | String s -> Unicode.trim s <> ""
        | Map _ -> true
        | _ -> false)
      col
  in
  let children_pages =
    List.concat_map
      (fun item ->
        let p =
          match item with
          | Map _ -> Clj_value.map_get_str item "block/title"
          | String s -> Some s
          | _ -> None
        in
        match p with
        | Some p ->
          let p =
            match Gp_text.get_nested_page_name p with
            | Some n -> n
            | None -> p
          in
          if
            Ns_util.namespace_page (Some p)
            && not (Date_time_util.valid_journal_title_with_slash p)
            && not tag
          then List.map (fun s -> String s) (Common_util.split_namespace_pages p)
          else [ String p ]
        | None -> [])
      col
    |> List.filter (fun v -> match v with String s -> Unicode.trim s <> "" | _ -> false)
    |> Common_util.distinct_by Fun.id
  in
  let col = Common_util.distinct_by Fun.id (col @ children_pages) in
  let export = !export_to_db_graph in
  List.filter_map
    (fun item ->
      let is_macro =
        match Clj_value.map_get_str item "type" with
        | Some "macro" -> true
        | _ -> false
      in
      if is_macro then None
      else begin
        let tag' =
          if export then tag
          else
            match item with
            | String s -> List.mem s structured_tags || tag
            | _ -> tag
        in
        let m_opt =
          match item with
          | String s ->
            page_name_to_map s db true date_formatter
              ~opts:{ default_page_map_opts with class_ = tag' } ()
          | Map _ ->
            (* page-name->map map input: keep map, ensure :block/uuid *)
            let bm = bm_of_map item in
            let bm =
              match Block_map.attr_value bm "block/uuid" with
              | Some _ -> bm
              | None -> Block_map.put bm "block/uuid" (Uuid (Common_uuid.new_block_id ()))
            in
            Some bm
          | _ -> None
        in
        match m_opt with
        | None -> None
        | Some m ->
          let result =
            if db_based && tag' && Block_map.attr_value m "db/ident" = None then
              bm_of_map
                (Ds_wire.value_of_transit
                   (Db_class.build_new_class db
                      (Ds_wire.transit_of_value (bm_to_map m))))
            else m
          in
          let page_name =
            match
              (if db_based then Block_map.attr_value result "block/title"
               else Block_map.attr_value result "block/name")
            with
            | Some (String n) -> n
            | _ -> ""
          in
          let id = Name_id.find_opt name_to_id page_name in
          let result_uuid =
            match Block_map.attr_value result "block/uuid" with
            | Some (Uuid u) -> u
            | _ -> ""
          in
          (match id with
           | None -> Name_id.add name_to_id page_name result_uuid
           | Some _ -> ());
          let override =
            match id with
            | Some _uuid ->
              (match Block_map.attr_value result "db/ident" with
               | Some (Keyword ident) ->
                 (match entity db (Ident ident) with
                  | None -> true
                  | Some _ -> export)
               | _ -> export)
            | None -> false
          in
          let result =
            match id, override with
            | Some uuid, true -> Block_map.put result "block/uuid" (Uuid uuid)
            | _ -> result
          in
          Some (bm_to_map result)
      end)
    col

(* gp-block/with-page-refs-and-tags — walks title+body AST collecting page
   refs and tags, then turns them into page maps *)
let with_page_refs_and_tags (block : Block_map.t) db (date_formatter : string option)
    ~(structured_tags : string list) : Block_map.t =
  let db_based = Ldb.db_based_graph db && not !export_to_db_graph in
  let title_items =
    Clj_value.coll_items
      (match Block_map.attr_value block "title" with
       | Some v -> v
       | None -> Vector [])
  in
  let body_items =
    Clj_value.coll_items
      (match Block_map.attr_value block "body" with
       | Some v -> v
       | None -> Vector [])
  in
  let seed_refs =
    List.concat_map
      (fun a ->
        match Block_map.attr_value block a with
        | Some v -> List.filter_map Clj_value.string_of_kwish (Clj_value.coll_items v)
        | None -> [])
      [ "tags"; "refs" ]
    @ (if db_based then []
       else
         List.filter_map
           (fun a ->
             match Block_map.attr_value block a with
             | Some (String s) when Unicode.trim s <> "" -> Some s
             | _ -> None)
           [ "marker"; "priority" ])
    |> List.filter (fun s -> Unicode.trim s <> "")
    |> Common_util.distinct_by Fun.id
  in
  let refs = ref (List.map (fun s -> String s) seed_refs) in
  let found_tags = ref structured_tags in
  let format =
    match Block_map.attr_value block "format" with
    | Some (String f) -> f
    | _ -> "markdown"
  in
  List.iter
    (fun node ->
      ignore
        (prewalk
           (fun form ->
             let is_custom_query =
               match form with
               | Vector (String "Custom" :: String "query" :: _) -> true
               | _ -> false
             in
             if not is_custom_query then begin
               (match get_page_reference form format with
                | Some page ->
                  (match page with
                   | String p ->
                     if not (db_namespace_page db_based p) then
                       refs := page :: !refs
                   | _ -> refs := page :: !refs)
                 | None -> ());
               (match get_tag form with
                | Some tag_raw ->
                  let tag = Gp_text.page_ref_un_brackets tag_raw in
                  if
                    (not (db_namespace_page db_based tag))
                    && Common_util.tag_valid tag
                  then begin
                    refs := String tag :: !refs;
                    found_tags := tag :: !found_tags
                  end
                | None -> ())
             end;
             form)
           node))
    (title_items @ body_items);
  let refs =
    List.rev !refs
    |> List.filter (fun v -> match v with String s -> Unicode.trim s <> "" | _ -> true)
  in
  let name_to_id = Name_id.create 127 in
  let ref_maps =
    ref_to_map db refs
      ~date_formatter ~name_to_id ~tag:false ~db_based
      ~structured_tags:!found_tags
  in
  let tag_maps =
    ref_to_map db
      (List.map (fun s -> String s) (Common_util.distinct_by Fun.id !found_tags))
      ~date_formatter ~name_to_id ~tag:true ~db_based
      ~structured_tags:!found_tags
  in
  Block_map.put
    (Block_map.put block "refs" (List ref_maps))
    "tags" (List tag_maps)

(* gp-block/with-block-refs *)
let with_block_refs (block : Block_map.t) : Block_map.t =
  let title_items =
    Clj_value.coll_items
      (match Block_map.attr_value block "title" with
       | Some v -> v
       | None -> Vector [])
  in
  let body_items =
    Clj_value.coll_items
      (match Block_map.attr_value block "body" with
       | Some v -> v
       | None -> Vector [])
  in
  let ref_blocks = extract_block_refs (title_items @ body_items) in
  let existing =
    match Block_map.attr_value block "refs" with
    | Some v -> Clj_value.coll_items v
    | None -> []
  in
  let refs =
    List.fold_left
      (fun acc x -> if List.mem x acc then acc else acc @ [ x ])
      existing ref_blocks
  in
  Block_map.put block "refs" (List refs)

(* gp-block/block-keywordize *)
let block_keywordize (block : Block_map.t) : Block_map.t =
  List.map
    (fun (k, v) ->
      let k' =
        if String.contains k '/' then k else "block/" ^ k
      in
      (k', v))
    block

(* gp-block/sanity-blocks-data *)
let sanity_blocks_data (blocks : Block_map.t list) : Block_map.t list =
  List.map
    (fun block -> block_keywordize (Common_util.remove_nils_non_nested block))
    blocks

(* gp-block/get-block-content *)
let get_block_content (utf8_content : string) (block : Block_map.t)
    (format : string) (meta' : value) (block_pattern : string) : string =
  let start_pos =
    match Clj_value.map_get_int meta' "start_pos" with Some p -> p | None -> 0
  in
  let end_pos = Clj_value.map_get_int meta' "end_pos" in
  let content = Gp_utf8.substring utf8_content start_pos ?end_:end_pos () in
  let block_format =
    match Block_map.attr_value block "format" with
    | Some (String f) -> f
    | _ -> "markdown"
  in
  let pre_block =
    match Block_map.attr_value block "pre-block?" with
    | Some (Bool b) -> b
    | _ -> false
  in
  let level =
    match Block_map.attr_value block "level" with
    | Some (Int n) -> n
    | _ -> 1
  in
  let content =
    let c = Gp_text.remove_level_spaces content format block_pattern () in
    if pre_block || block_format = "org" then c
    else Gp_mldoc.remove_indentation_spaces c (level + 1) false
  in
  if format = "org" then content else Gp_property.to_new_properties content

(* gp-block/get-custom-id-or-new-id — [properties] is the inner
   :properties map of an extract-properties result *)
let get_custom_id_or_new_id (properties : (attr * value) list) : string =
  let custom_id =
    match
      (List.assoc_opt "custom-id" properties, List.assoc_opt "custom_id" properties,
       List.assoc_opt "id" properties)
    with
    | Some v, _, _ | None, Some v, _ | None, None, Some v ->
      (match v with String s -> Some (Unicode.trim s) | _ -> None)
    | _ -> None
  in
  match custom_id with
  | Some s when Common_util.uuid_string s -> s
  | _ -> Common_uuid.new_block_id ()

(* gp-block/macro->block *)
let macro_to_block (macro : value) : Block_map.t =
  [ "block/uuid", Uuid (Common_uuid.new_block_id ())
  ; "block/type", String "macro"
  ; "block/properties",
    Map
      [ Keyword "logseq.macro-name", Clj_value.map_get macro "name"
      ; Keyword "logseq.macro-arguments", Clj_value.map_get macro "arguments" ] ]

(* gp-block/extract-macros-from-ast *)
let extract_macros_from_ast (ast : value list) : value =
  let result = ref [] in
  List.iter
    (fun node ->
      ignore
        (postwalk
           (fun f ->
             match f with
             | Vector (String "Macro" :: m :: _) ->
               result := m :: !result;
               f
             | _ -> f)
           node))
    ast;
  List (List.map (fun m -> bm_to_map (macro_to_block m)) !result)

(* gp-block/with-page-block-refs *)
let with_page_block_refs (block : Block_map.t) db (date_formatter : string option)
    ~(structured_tags : string list) : Block_map.t =
  let block = with_page_refs_and_tags block db date_formatter ~structured_tags in
  let block = with_block_refs block in
  let refs =
    match Block_map.attr_value block "refs" with
    | Some v -> List.filter (fun r -> r <> Nil) (Clj_value.coll_items v)
    | None -> []
  in
  Block_map.put block "refs" (List refs)

(* options threaded through extract-blocks / extract-pages-and-blocks *)
type extract_options =
  { user_config : (attr * value) list
  ; block_pattern : string
  ; date_formatter : string option
  ; db : db
  ; db_graph_mode : bool
  ; export_to_db_graph_flag : bool
  ; remove_properties : bool
  ; remove_logbook : bool
  ; remove_deadline_scheduled : bool
  ; page_name : string option
  ; filename_format : string option
  ; resolve_uuid_fn :
      string -> value list -> string -> extract_options -> string option list option
  ; skip_journal : bool }

(* gp-block/with-pre-block-if-exists *)
let with_pre_block_if_exists (blocks : Block_map.t list) (body : value list)
    (pre_block_properties : extract_properties_result)
    (encoded_content : string) (opts : extract_options) : Block_map.t list =
  let first_block = List.nth_opt blocks 0 in
  let first_block_start_pos =
    match first_block with
    | Some b ->
      (match Block_map.attr_value b "block/meta" with
       | Some meta -> Clj_value.map_get_int meta "start_pos"
       | None -> None)
    | None -> None
  in
  if
    (match first_block_start_pos with Some p -> p > 0 | None -> false)
    || blocks = []
  then
    let start_pos = match first_block_start_pos with Some p -> p | None -> 0 in
    let content = Gp_utf8.substring encoded_content 0 ~end_:start_pos () in
    let id = get_custom_id_or_new_id pre_block_properties.properties in
    let property_refs =
      List.filter_map
        (fun page ->
          match
            page_name_to_map page opts.db true opts.date_formatter ()
          with
          | Some m -> Block_map.attr_value m "block/title"
          | None -> None)
        pre_block_properties.page_refs
      |> List.filter_map
           (fun v -> match v with String s -> Some s | _ -> None)
    in
    let pre_block =
      let heading_prop =
        match List.assoc_opt "heading" pre_block_properties.properties with
        | Some _ -> false
        | None -> true
      in
      let b : Block_map.t =
        [ "block/uuid", Uuid id
        ; "block/title", String content
        ; "block/level", Int 1
        ; "block/properties",
          Map (List.map (fun (k, v) -> (Keyword k, v)) pre_block_properties.properties)
        ; "block/properties-order",
          Vector
            (List.map (fun k -> Keyword k) pre_block_properties.properties_order)
        ; "block/properties-text-values",
          Map
            (List.map
               (fun (k, v) -> (Keyword k, v))
               pre_block_properties.properties_text_values)
        ; "block/invalid-properties",
          Set (List.map (fun k -> Keyword k) pre_block_properties.invalid_properties)
        ; "block/pre-block?", Bool heading_prop
        ; "block/macros", extract_macros_from_ast body
        ; "block.temp/ast-body", List body ]
      in
      let b =
        let b' =
          with_page_block_refs
            [ "body", List body; "refs", List (List.map (fun s -> String s) property_refs) ]
            opts.db opts.date_formatter ~structured_tags:[]
        in
        let tags = Block_map.attr_value b' "tags" in
        let refs =
          match Block_map.attr_value b' "refs" with
          | Some (List xs) -> xs
          | Some v -> Clj_value.coll_items v
          | None -> []
        in
        let block_refs =
          List.map (fun r -> r) pre_block_properties.block_refs
        in
        let b = match tags with
          | Some t -> Block_map.put b "block/tags" t
          | None -> b
        in
        Block_map.put b "block/refs" (List (refs @ block_refs))
      in
      (* merge :block/format/:block/page from the first real block *)
      match first_block with
      | Some fb ->
        let b =
          match Block_map.attr_value fb "block/format" with
          | Some f -> Block_map.put b "block/format" f
          | None -> b
        in
        (match Block_map.attr_value fb "block/page" with
         | Some p -> Block_map.put b "block/page" p
         | None -> b)
      | None -> b
    in
    pre_block :: blocks
  else blocks

(* gp-block/with-heading-property *)
let with_heading_property (properties : (attr * value) list)
    (markdown_heading : bool) (size : value) : (attr * value) list =
  if markdown_heading then ("heading", size) :: properties else properties

(* gp-block/construct-block — [block] is the mldoc heading data map *)
let construct_block (ast_block : value) (properties : extract_properties_result)
    (timestamps : (string * value) list) (body : value list)
    (encoded_content : string) (format : string) (pos_meta : value)
    (opts : extract_options) : Block_map.t =
  let id = get_custom_id_or_new_id properties.properties in
  let block_tags =
    if opts.export_to_db_graph_flag then
      match List.assoc_opt "tags" properties.properties with
      | Some v -> Some v
      | None -> None
    else None
  in
  (* For export, remove tags from properties as they are converted to classes *)
  let properties =
    match block_tags with
    | Some _ ->
      { properties with
        properties = List.remove_assoc "tags" properties.properties
      ; properties_text_values =
          List.remove_assoc "tags" properties.properties_text_values
      ; properties_order =
          List.filter (fun k -> k <> "tags") properties.properties_order
      ; page_refs = List.filter (fun r -> r <> "tags") properties.page_refs }
    | None -> properties
  in
  let ref_pages_in_properties =
    List.filter (fun s -> Unicode.trim s <> "") properties.page_refs
  in
  let block_data =
    match ast_block with
    | Vector [ String _; data ] | List [ String _; data ] -> data
    | _ -> Map []
  in
  let unordered =
    match Clj_value.map_get block_data "unordered" with
    | Bool b -> b
    | _ -> false
  in
  let size = Clj_value.map_get block_data "size" in
  let markdown_heading = size <> Nil && format = "markdown" in
  (* (assoc block :level (if unordered? (:level block) 1)) for md heading *)
  let block : (attr * value) list =
    let base = Clj_value.map_entries_named block_data in
    let base =
      if markdown_heading then
        let level =
          if unordered then Clj_value.map_get block_data "level" else Int 1
        in
        ("level", level) :: List.remove_assoc "level" base
      else base
    in
    base
  in
  let block : (attr * value) list =
    let block =
      [ "uuid", Uuid id
      ; "refs", List (List.map (fun s -> String s) ref_pages_in_properties)
      ; "format", String format
      ; "meta", pos_meta ]
      @ List.filter (fun (k, _) -> k <> "size" && k <> "unordered") block
    in
    let block =
      if properties.properties <> [] || markdown_heading then
        block
        @ [ "properties",
            Map
              (List.map
                 (fun (k, v) -> (Keyword k, v))
                 (with_heading_property properties.properties markdown_heading size))
          ; "properties-text-values",
            Map
              (List.map
                 (fun (k, v) -> (Keyword k, v)) properties.properties_text_values)
          ; "properties-order",
            Vector (List.map (fun k -> Keyword k) properties.properties_order) ]
      else block
    in
    if properties.invalid_properties <> [] then
      block
      @ [ "invalid-properties",
          Set (List.map (fun s -> Keyword s) properties.invalid_properties) ]
    else block
  in
  (* :properties :collapsed -> :collapsed? *)
  let props_of (b : (attr * value) list) =
    match List.assoc_opt "properties" b with
    | Some m -> m
    | None -> Map []
  in
  let collapsed =
    Clj_value.map_get_bool (props_of block) "collapsed" |> Option.value ~default:false
  in
  let block =
    if collapsed then
      let block = ("collapsed?", Bool true) :: block in
      let block =
        List.map
          (fun (k, v) ->
            if k = "properties" then
              (k, Clj_value.map_dissoc v [ "collapsed" ])
            else if k = "properties-text-values" then
              (k, Clj_value.map_dissoc v [ "collapsed" ])
            else if k = "properties-order" then
              (k,
               Vector
                 (List.filter
                    (fun kk -> kk <> Keyword "collapsed")
                    (Clj_value.coll_items v)))
            else (k, v))
          block
      in
      block
    else block
  in
  let title =
    let t =
      get_block_content encoded_content block format pos_meta opts.block_pattern
    in
    let t =
      if opts.remove_properties then
        Gp_property.remove_properties
          (match List.assoc_opt "format" block with
           | Some (String f) -> f
           | _ -> "markdown")
          t
      else t
    in
    let t = if opts.remove_logbook then Gp_property.remove_logbook t else t in
    if opts.remove_deadline_scheduled then Gp_property.remove_deadline_scheduled t
    else t
  in
  let block = ("block/title", String title) :: block in
  let block =
    if timestamps <> [] then
      block @ timestamps_to_scheduled_and_deadline timestamps
    else block
  in
  let db_based = opts.db_graph_mode || opts.export_to_db_graph_flag in
  let block = ("body", List body) :: block in
  let structured =
    match block_tags with
    | Some v -> List.filter_map Clj_value.string_of_kwish (Clj_value.coll_items v)
    | None -> []
  in
  let block = with_page_block_refs block opts.db opts.date_formatter ~structured_tags:structured in
  let block =
    if db_based then block
    else
      List.map
        (fun (k, v) ->
          match k, v with
          | "tags", List xs ->
            (k, List (List.map (fun t -> bm_to_map (Block_map.put (bm_of_map t) "block/format" (String format))) xs))
          | "refs", List xs ->
            (k, List (List.map
                (fun r ->
                  match r with
                  | Map _ -> bm_to_map (Block_map.put (bm_of_map r) "block/format" (String format))
                  | _ -> r)
                xs))
          | _ -> (k, v))
        block
  in
  let block =
    match List.assoc_opt "refs" block with
    | Some (List xs) ->
      List.map
        (fun (k, v) -> if k = "refs" then (k, List (xs @ properties.block_refs)) else (k, v))
        block
    | _ -> block @ [ "refs", List properties.block_refs ]
  in
  let created_at =
    match List.assoc_opt "created-at" properties.properties with
    | Some (Int n) -> Some n
    | _ -> None
  in
  let updated_at =
    match List.assoc_opt "updated-at" properties.properties with
    | Some (Int n) -> Some n
    | _ -> None
  in
  let block =
    (match created_at with
     | Some n -> ("block/created-at", Int n) :: block
     | None -> block)
    |> fun b ->
    (match updated_at with
     | Some n -> ("block/updated-at", Int n) :: b
     | None -> b)
  in
  (* (dissoc block :title :body :anchor) *)
  List.filter
    (fun (k, _) -> k <> "title" && k <> "body" && k <> "anchor")
    block

(* gp-block/fix-duplicate-id — operates on the keywordized block map *)
let fix_duplicate_id (block : Block_map.t) : Block_map.t =
  let old_uuid =
    match Block_map.attr_value block "block/uuid" with
    | Some (Uuid u) -> u
    | _ -> ""
  in
  let format =
    match Block_map.attr_value block "block/format" with
    | Some (String f) -> f
    | _ -> "markdown"
  in
  let replace_re =
    Regexp.compile
      ("\\n*\\s*"
       ^ (if format = "markdown" then "id" ^ Gp_property.colons ^ " " ^ old_uuid
          else Gp_property.colons_org "id" ^ " " ^ old_uuid))
  in
  let block =
    Block_map.put block "block/uuid" (Uuid (Common_uuid.new_block_id ()))
  in
  let block =
    match Block_map.attr_value block "block/properties" with
    | Some m ->
      Block_map.put block "block/properties" (Clj_value.map_dissoc m [ "id" ])
    | None -> block
  in
  let block =
    match Block_map.attr_value block "block/properties-text-values" with
    | Some m ->
      Block_map.put block "block/properties-text-values" (Clj_value.map_dissoc m [ "id" ])
    | None -> block
  in
  let block =
    match Block_map.attr_value block "block/properties-order" with
    | Some v ->
      Block_map.put block "block/properties-order"
        (Vector (List.filter (fun k -> k <> Keyword "id") (Clj_value.coll_items v)))
    | None -> block
  in
  match Block_map.attr_value block "block/title" with
  | Some (String c) ->
    Block_map.put block "block/title"
      (String (Common_util.regex_replace replace_re ~replacement:"" c))
  | _ -> block

(* gp-block/fix-block-id-if-duplicated! *)
let fix_block_id_if_duplicated db (page_name : string)
    (extracted_block_ids : (string, unit) Hashtbl.t) (block : Block_map.t)
    : Block_map.t =
  let uuid =
    match Block_map.attr_value block "block/uuid" with
    | Some (Uuid u) -> u
    | _ -> ""
  in
  let block_page_name =
    match entity db (Lookup_ref ("block/uuid", Uuid uuid)) with
    | Some e ->
      (match Ldb.ref_ent e "block/page" with
       | Some p -> Ldb.string_value p "block/name"
       | None -> None)
    | None -> None
  in
  let block =
    if
      (match block_page_name with
       | Some n -> n <> page_name
       | None -> false)
      || Hashtbl.mem extracted_block_ids uuid
    then fix_duplicate_id block
    else block
  in
  let uuid =
    match Block_map.attr_value block "block/uuid" with
    | Some (Uuid u) -> u
    | _ -> ""
  in
  Hashtbl.replace extracted_block_ids uuid ();
  block

(* gp-block/extract-blocks *)
let extract_blocks (ast : value list) (content : string) (format : string)
    (opts : extract_options) : Block_map.t list =
  assert (ast <> []);
  let encoded_content = Gp_utf8.encode content in
  let all_blocks = List.rev ast in
  let ast_blocks = all_blocks in
  let headings, body, pre_block_properties =
    (* `consumed` accumulates the ast blocks seen since the last heading, in
       reverse order — the cljs `(take prev-block-num (drop ... all-blocks))`
       slice without an O(n) list scan per heading. *)
    let rec loop headings ast_blocks block_idx timestamps properties body
        consumed prev_block_num =
      match ast_blocks with
      | [] ->
        (sanity_blocks_data headings, List.rev body, properties)
      | pair :: rest ->
        let ast_block, pos_meta =
          match pair with
          | Vector [ a; p ] | List [ a; p ] -> (a, p)
          | _ -> (pair, Map [])
        in
        let consumed' =
          match pair with
          | Vector _ | List _ -> ast_block :: consumed
          | _ -> consumed
        in
        if paragraph_timestamp_block ast_block then
          let ts = extract_timestamps ast_block in
          loop headings rest (block_idx + 1) (List.rev_append ts timestamps)
            properties body consumed' (prev_block_num + 1)
        else if Gp_property.properties_ast ast_block then
          let props_list =
            match ast_block with
            | Vector [ _; props ] | List [ _; props ] -> Clj_value.coll_items props
            | _ -> []
          in
          let properties =
            match
              extract_properties props_list
                (("format", String format) :: opts.user_config)
            with
            | Some r -> r
            | None -> empty_properties_result
          in
          loop headings rest (block_idx + 1) timestamps properties body
            consumed' (prev_block_num + 1)
        else if heading_block ast_block then
          let cut_multiline =
            opts.export_to_db_graph_flag && prev_block_num = 0
          in
          let prev_blocks = List.rev consumed in
          let pos_meta' =
            if cut_multiline then pos_meta
            else
              let e =
                match headings with
                | last :: _ ->
                  (match Block_map.attr_value last "meta" with
                   | Some m -> Clj_value.map_get m "start_pos"
                   | None -> Nil)
                | [] -> Nil
              in
              Clj_value.map_assoc pos_meta "end_pos" e
          in
          let has_properties_ast =
            List.exists Gp_property.properties_ast prev_blocks
          in
          let has_logbook =
            List.exists
              (fun b ->
                match b with
                | Vector (String "Drawer" :: String "logbook" :: _)
                | List (String "Drawer" :: String "logbook" :: _) -> true
                | _ -> false)
              prev_blocks
          in
          let has_deadline =
            List.exists
              (fun b ->
                let rec contains (v : value) : bool =
                  match v with
                  | String ("Deadline" | "Scheduled") -> true
                  | Vector xs | List xs | Set xs -> List.exists contains xs
                  | Map kvs -> List.exists (fun (k, v') -> contains k || contains v') kvs
                  | Tuple vs -> List.exists (fun o -> match o with Some v -> contains v | None -> false) vs
                  | _ -> false
                in
                contains b)
              prev_blocks
          in
          let opts' =
            { opts with
              remove_properties =
                opts.export_to_db_graph_flag && has_properties_ast
            ; remove_logbook = opts.export_to_db_graph_flag && has_logbook
            ; remove_deadline_scheduled =
                opts.export_to_db_graph_flag && has_deadline }
          in
          let block' =
            construct_block ast_block properties (List.rev timestamps)
              (List.rev body) encoded_content format pos_meta' opts'
          in
          let block'' =
            if opts.db_graph_mode then block'
            else if opts.export_to_db_graph_flag then
              ("block.temp/ast-blocks", List (ast_block :: List.rev body)) :: block'
            else ("macros", extract_macros_from_ast (ast_block :: List.rev body)) :: block'
          in
          loop (block'' :: headings) rest (block_idx + 1) [] empty_properties_result
            [] [] 0
        else
          loop headings rest (block_idx + 1) timestamps properties
            (ast_block :: body) consumed' (prev_block_num + 1)
    in
    loop [] ast_blocks 0 [] empty_properties_result [] [] 0
  in
  let result =
    with_pre_block_if_exists headings body pre_block_properties
      encoded_content opts
  in
  List.map
    (fun b -> List.filter (fun (k, _) -> k <> "block/meta") b)
    result

(* gp-block/with-parent-and-order *)
type wpo_frame =
  { f_ref : value
  ; f_parent : value option
  ; f_level : int
  ; f_indent : int }

let with_parent_and_order (page_id : value) (blocks : Block_map.t list)
    : Block_map.t list =
  let is_macro b =
    match Block_map.attr_value b "block/type" with
    | Some (String "macro") -> true
    | _ -> false
  in
  let rec split_with acc = function
    | b :: rest when not (is_macro b) -> split_with (b :: acc) rest
    | rest -> (List.rev acc, rest)
  in
  let normal_blocks, other_blocks = split_with [] blocks in
  let result =
    let rec loop remaining frames result =
      match remaining with
      | [] -> List.rev result
      | block :: others ->
        let input_level =
          match Block_map.attr_value block "block/level" with
          | Some (Int n) -> n
          | _ -> 1
        in
        (* pop frames while input-level < top.indent *)
        let rec popp stack last =
          match stack with
          | top :: tl when input_level < top.f_indent -> popp tl (Some top)
          | _ -> (stack, last)
        in
        let ancestor_frames, last_popped = popp frames None in
        let top_frame =
          match ancestor_frames with
          | top :: _ -> top
          | [] -> { f_ref = page_id; f_parent = None; f_level = 0; f_indent = 0 }
        in
        let resolved_block, base_frames, comparison_indent =
          if input_level = top_frame.f_indent then
            (* sibling *)
            let b =
              match top_frame.f_parent with
              | Some p -> Block_map.put (Block_map.put block "block/parent" p) "block/level" (Int top_frame.f_level)
              | None -> block
            in
            (b, (match ancestor_frames with _ :: tl -> tl | [] -> []), input_level)
          else if last_popped = None then
            (* child *)
            let b = Block_map.put block "block/parent" top_frame.f_ref in
            let b =
              if input_level - top_frame.f_indent >= 1 then
                Block_map.put b "block/level" (Int (top_frame.f_level + 1))
              else b
            in
            (b, ancestor_frames, input_level)
          else
            (* irregular outdent *)
            let lp = Option.get last_popped in
            let b =
              Block_map.put
                (Block_map.put block "block/parent"
                   (match top_frame.f_ref with Nil -> page_id | r -> r))
                "block/level" (Int lp.f_level)
            in
            (b, ancestor_frames, lp.f_indent)
        in
        let frame =
          { f_ref =
              (match Block_map.attr_value resolved_block "block/uuid" with
               | Some u -> Vector [ Keyword "block/uuid"; u ]
               | None -> Nil)
          ; f_parent = Block_map.attr_value resolved_block "block/parent"
          ; f_level =
              (match Block_map.attr_value resolved_block "block/level" with
               | Some (Int n) -> n
               | _ -> 0)
          ; f_indent = comparison_indent }
        in
        loop others (frame :: base_frames) (resolved_block :: result)
    in
    loop normal_blocks
      [ { f_ref = page_id; f_parent = None; f_level = 0; f_indent = 0 } ]
      []
  in
  let result =
    List.map
      (fun b -> Block_map.put b "block/order" (String (Db_order.gen_key_from_max ())))
      result
  in
  result @ other_blocks
