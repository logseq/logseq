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

let page_entity (e : entity) : bool =
  Ldb.is_page e
  || (match Ldb.value e "block/type" with
      | Some (String ("page" | "journal")) -> true
      | _ -> false)

(* convert-page-if-journal (memoized on (name, formatter)) *)
module CPJ = struct
  module H = Hashtbl.Make (struct
    type t = string * string option
    let equal (a1, b1) (a2, b2) = a1 = a2 && b1 = b2
    let hash = Hashtbl.hash
  end)
  let tbl = H.create 127
end

let convert_page_if_journal (original_page_name : string) (date_formatter : string option)
    : string * string * int option =
  let key = (original_page_name, date_formatter) in
  match CPJ.H.find_opt CPJ.tbl key with
  | Some r -> r
  | None ->
    let r =
      let page_name = Ldb.page_name_sanity_lc original_page_name in
      let day =
        match date_formatter with
        | None -> None
        | Some fmt ->
          Date_time_util.journal_title_to_int
            ~formatters:(Date_time_util.safe_journal_title_formatters (Some fmt))
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
         when String.lowercase_ascii name
              <> String.lowercase_ascii original_page_name'
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
         | ns, _ when String.trim ns <> "" ->
           [ "block/namespace"
           , Block_map.normalize_value
               (Map [ String "block/name", String (String.trim (Ldb.page_name_sanity_lc ns)) ]) ]
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
      let t = String.trim original_page_name in
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
