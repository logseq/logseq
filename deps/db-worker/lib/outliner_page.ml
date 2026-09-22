(* Port of logseq.outliner.page create chain
   (deps/outliner/src/logseq/outliner/page.cljs), plus the
   graph-parser block page-name->map and outliner-recycle restore
   it depends on. *)

open Datascript

(* ---------- util helpers ---------- *)

(* common-util/remove-boundary-slashes *)
let remove_boundary_slashes (s : string) : string =
  let n = String.length s in
  if n = 0 then s
  else
    let s = if s.[0] = '/' then String.sub s 1 (n - 1) else s in
    let m = String.length s in
    if m > 0 && s.[m - 1] = '/' then String.sub s 0 (m - 1) else s

(* common-util/url? — protocol://-style (js/URL origin check) *)
let url_re = Regexp.compile "[a-zA-Z][a-zA-Z0-9+\\-.]*://"
let url_p (s : string) : bool = Regexp.test url_re s

(* ns-util/namespace-page? *)
let namespace_page (page_name : string) : bool =
  String.contains page_name '/'
  && Unicode.trim page_name <> "/"
  && not (String.length page_name >= 3 && String.sub page_name 0 3 = "../")
  && not (String.length page_name >= 2 && String.sub page_name 0 2 = "./")
  && not (url_p page_name)

(* common-util/split-last *)
let split_last (pattern : string) (s : string) : string * string =
  let n = String.length s in
  let plen = String.length pattern in
  let rec last_index i =
    if i < 0 then -1
    else if i + plen <= n && String.sub s i plen = pattern then i
    else last_index (i - 1)
  in
  match last_index (n - plen) with
  | -1 -> (s, "")
  | idx -> (String.sub s 0 idx, String.sub s (idx + plen) (n - idx - plen))

let page_name_sanity_lc (s : string) : string = Ldb.page_name_sanity_lc s

(* outliner-page/sanitize-title *)
let sanitize_title (title : string) : string =
  title |> Unicode.trim |> Page_ref.get_page_name_exn |> remove_boundary_slashes

(* text/get-nested-page-name — first [[inner]] without nesting *)
let get_nested_page_name (page_name : string) : string option =
  match Regexp.exec Db_content.page_ref_without_nested_re page_name with
  | Some m ->
      (match m.Regexp.groups.(1) with
       | Some inner -> Some inner
       | None -> None)
  | None -> None

(* date-time-util/default-journal-title-formatter *)
let default_journal_title_formatter = "MMM do, yyyy"

(* date-time-util/int->journal-title — format an int day (yyyymmdd)
   with a temporal formatter. Local lexer keeps MMMM (long month) and
   MMM (short month) distinct, which Date_time_util.tok collapses for
   parsing. *)
type fmt_tok =
  | FYear4 | FYear2
  | FMonthLong | FMonthShort | FMonthNum
  | FDay | FDayOrd
  | FWeekdayLong | FWeekdayShort
  | FLit of char

let fmt_tokens (fmt : string) : fmt_tok list =
  let n = String.length fmt in
  let at i t =
    let l = String.length t in
    i + l <= n && String.sub fmt i l = t
  in
  let rec lex i acc =
    if i >= n then List.rev acc
    else if at i "yyyy" then lex (i + 4) (FYear4 :: acc)
    else if at i "yy" then lex (i + 2) (FYear2 :: acc)
    else if at i "MMMM" then lex (i + 4) (FMonthLong :: acc)
    else if at i "MMM" then lex (i + 3) (FMonthShort :: acc)
    else if at i "MM" then lex (i + 2) (FMonthNum :: acc)
    else if at i "dd" then lex (i + 2) (FDay :: acc)
    else if at i "do" then lex (i + 2) (FDayOrd :: acc)
    else if at i "EEEE" then lex (i + 4) (FWeekdayLong :: acc)
    else if at i "EEE" then lex (i + 3) (FWeekdayShort :: acc)
    else lex (i + 1) (FLit fmt.[i] :: acc)
  in
  lex 0 []

let weekday_long =
  [| "Sunday"; "Monday"; "Tuesday"; "Wednesday"; "Thursday"; "Friday";
     "Saturday" |]

let weekday_of_day (day : int) : int =
  (* days since 1970-01-01 (Thursday); day is yyyymmdd int *)
  let y = day / 10000 and m = day mod 10000 / 100 and d = day mod 100 in
  let dim y m =
    match m with
    | 1 | 3 | 5 | 7 | 8 | 10 | 12 -> 31
    | 4 | 6 | 9 | 11 -> 30
    | 2 -> if (y mod 4 = 0 && y mod 100 <> 0) || y mod 400 = 0 then 29 else 28
    | _ -> 30
  in
  let rec acc_y y acc = if y <= 1970 then acc else acc_y (y - 1) (acc + (if (y - 1) mod 4 = 0 && (y - 1) mod 100 <> 0 || (y - 1) mod 400 = 0 then 366 else 365)) in
  let rec acc_m m acc = if m <= 1 then acc else acc_m (m - 1) (acc + dim y (m - 1)) in
  let total = acc_y y 0 + acc_m m 0 + d - 1 in
  (total mod 7 + 4) mod 7

let journal_title_of_int (day : int) (fmt : string) : string =
  let year = day / 10000 and month = day mod 10000 / 100 and dom = day mod 100 in
  let ordinal d =
    if d >= 11 && d <= 13 then "th"
    else match d mod 10 with 1 -> "st" | 2 -> "nd" | 3 -> "rd" | _ -> "th"
  in
  let buf = Buffer.create 24 in
  List.iter
    (function
      | FYear4 -> Buffer.add_string buf (Printf.sprintf "%04d" year)
      | FYear2 -> Buffer.add_string buf (Printf.sprintf "%02d" (year mod 100))
      | FMonthLong ->
          Buffer.add_string buf Date_time_util.month_long.(month - 1)
      | FMonthShort ->
          Buffer.add_string buf Date_time_util.month_short.(month - 1)
      | FMonthNum -> Buffer.add_string buf (Printf.sprintf "%02d" month)
      | FDay -> Buffer.add_string buf (Printf.sprintf "%02d" dom)
      | FDayOrd ->
          Buffer.add_string buf (string_of_int dom ^ ordinal dom)
      | FWeekdayLong ->
          Buffer.add_string buf weekday_long.(weekday_of_day day)
      | FWeekdayShort ->
          let s = weekday_long.(weekday_of_day day) in
          Buffer.add_string buf (String.sub s 0 3)
      | FLit c -> Buffer.add_char buf c)
    (fmt_tokens fmt);
  Buffer.contents buf

(* ---------- ldb/page-exists? — returns candidate ids ---------- *)
let page_exists_ids db (page_name : string) (tag_idents : string list)
    : entity_id list =
  if page_name = "" then []
  else
    let only_class_tags =
      tag_idents <> []
      && List.for_all
           (fun t -> t = "logseq.class/Tag" || t = "logseq.class/Property")
           tag_idents
    in
    let name_v =
      if only_class_tags then page_name else page_name_sanity_lc page_name
    in
    let attr = if only_class_tags then "block/title" else "block/name" in
    q_string db
      ~inputs:
        [ Arg_scalar (Result_value (String name_v))
        ; Arg_collection
            (List.map (fun t -> Result_value (Keyword t)) tag_idents) ]
      (Printf.sprintf
         "[:find [?p ...] :in $ ?name [?tag-ident ...] :where \
          [?p %s ?name] [?p :block/tags ?tag] [?tag :db/ident ?tag-ident]]"
         attr)
    |> List.filter_map (function
         | [ Result_entity id ] -> Some id
         | [ Result_value (Int id) ] -> Some id
         | _ -> None)

(* ---------- gp-block page-name->map ---------- *)

(* sanitize-hashtag-name — keep in sync with db.frontend.content *)
let sanitize_hashtag_name (s : string) : string =
  let buf = Buffer.create (String.length s) in
  String.iter
    (fun c -> if c = '#' then Buffer.add_string buf "HashTag-" else Buffer.add_char buf c)
    s;
  Buffer.contents buf

(* gp-block/convert-page-if-journal — returns (title, lc name, day) *)
let convert_page_if_journal (original_page_name : string)
    (date_formatter : string option) : string * string * int option =
  let page_name = page_name_sanity_lc original_page_name in
  let formatters = Date_time_util.journal_title_formatters date_formatter in
  match Date_time_util.journal_title_to_int ~formatters page_name with
  | Some day ->
      let fmt = Option.value date_formatter ~default:default_journal_title_formatter in
      ( journal_title_of_int day fmt
      , page_name_sanity_lc
          (journal_title_of_int day default_journal_title_formatter)
      , Some day )
  | None -> (original_page_name, page_name, None)

(* gp-block/get-page (file-graph lookup; on db graphs journal lookup is
   handled separately — faithful call shape) *)
let get_page_by_name db (page_name : string) : entity option =
  Ldb.get_page db (String page_name)

(* gp-block/page-name-string->map *)
let page_name_string_to_map (original_page_name : string) db
    (date_formatter : string option) ~(with_timestamp : bool)
    ~(page_uuid : string option) ~(from_page : string option)
    ~(class_ : bool) ~(skip_existing_page_check : bool) ~(skip_journal : bool)
    : Wire.t * entity option =
  let db_based = Sqlite_util.db_based_graph db in
  let original_page_name = remove_boundary_slashes original_page_name in
  let original_page_name', page_name, journal_day =
    if skip_journal then
      (original_page_name, page_name_sanity_lc original_page_name, None)
    else convert_page_if_journal original_page_name date_formatter
  in
  let is_namespace =
    (not db_based) && journal_day = None
    && Option.is_none (get_nested_page_name original_page_name')
    && namespace_page original_page_name'
  in
  let page_entity =
    if not skip_existing_page_check then
      match journal_day with
      | Some day -> Ldb.get_journal_page_by_day db day
      | None ->
          if class_ && db_based then
            (match page_exists_ids db original_page_name' [ "logseq.class/Tag" ] with
             | id :: _ -> Ldb.ent_of_id db id
             | [] -> None)
          else get_page_by_name db original_page_name'
    else None
  in
  let original_page_name' =
    match from_page, page_entity with
    | Some f, _ -> f
    | None, Some e -> Option.value (Ldb.string_value e "block/title") ~default:original_page_name'
    | None, None -> original_page_name'
  in
  let page_name' =
    match journal_day, page_entity with
    | Some _, Some e -> Option.value (Ldb.string_value e "block/name") ~default:page_name
    | _ -> page_name
  in
  let kw s = Wire.Keyword s in
  let base =
    Wire.Map
      [ (kw "block/name", Wire.String page_name')
      ; (kw "block/title", Wire.String original_page_name') ]
  in
  let base =
    (* :block.temp/original-page-name *)
    if Unicode.lowercase original_page_name <> Unicode.lowercase original_page_name'
    then Cljs_map.assoc base "block.temp/original-page-name" (Wire.String original_page_name)
    else base
  in
  let base =
    match page_entity with
    | Some e when class_ && Option.is_some (Ldb.ident_of e) ->
        Cljs_map.assoc_list base
          [ "block/uuid",
            (match Ldb.value e "block/uuid" with
             | Some (Uuid u) -> Wire.Uuid u
             | _ -> Wire.Nil)
          ; "db/ident", Wire.Keyword (Option.get (Ldb.ident_of e)) ]
    | _ ->
        let new_uuid =
          match page_uuid, journal_day with
          | Some u, _ -> u
          | None, Some day -> Common_uuid.gen_journal_page_uuid day
          | None, None -> Uuid_gen.uuid ()
        in
        Cljs_map.assoc base "block/uuid" (Wire.Uuid new_uuid)
  in
  let base =
    if is_namespace then
      let namespace', _ = split_last "/" original_page_name' in
      if Unicode.trim namespace' <> "" then
        Cljs_map.assoc base "block/namespace"
          (Wire.Map
             [ (kw "block/name",
                Wire.String
                  (Unicode.trim (page_name_sanity_lc namespace'))) ])
      else base
    else base
  in
  let base =
    if with_timestamp && Option.is_none page_entity then
      let now = Wire.Date_ms (Int64.of_float (Clock.now_ms ())) in
      Cljs_map.assoc_list base
        [ "block/created-at", now; "block/updated-at", now ]
    else base
  in
  let base =
    match journal_day with
    | Some day ->
        let m = Cljs_map.assoc base "block/journal-day" (Wire.Int day) in
        if db_based then
          Cljs_map.assoc m "block/tags"
            (Wire.Array [ Wire.Keyword "logseq.class/Journal" ])
        else Cljs_map.assoc m "block/type" (Wire.String "journal")
    | None -> base
  in
  (base, page_entity)

(* gp-block/page-name->map *)
let page_name_to_map (original_page_name : string) db
    (with_timestamp : bool) (date_formatter : string option)
    ?(page_uuid : string option) ?(class_ = false)
    ?(skip_existing_page_check = false) ?(skip_journal = false) () :
    Wire.t =
  let is_uuid_of_existing_page =
    if Ldb.is_uuid_string original_page_name then
      match Ldb.ent_of_ref db (Lookup_ref ("block/uuid", Uuid original_page_name)) with
      | Some e -> Ldb.is_page e
      | None -> false
    else false
  in
  if is_uuid_of_existing_page then Wire.Nil
  else
    let db_based = Sqlite_util.db_based_graph db in
    let original_page_name =
      let s = Unicode.trim original_page_name in
      if db_based then sanitize_hashtag_name s else s
    in
    let page, _page_entity =
      page_name_string_to_map original_page_name db date_formatter
        ~with_timestamp ~page_uuid ~from_page:None ~class_
        ~skip_existing_page_check ~skip_journal
    in
    match page with
    | Wire.Nil -> Wire.Nil
    | _ ->
        if db_based then
          let tags =
            if class_ then Wire.Array [ Wire.Keyword "logseq.class/Tag" ]
            else
              match Cljs_map.get page "block/tags" with
              | Some t -> t
              | None -> Wire.Array [ Wire.Keyword "logseq.class/Page" ]
          in
          Cljs_map.assoc page "block/tags" tags
        else
          match Cljs_map.get page "block/type" with
          | Some _ -> page
          | None -> Cljs_map.assoc page "block/type" (Wire.String "page")

(* ---------- outliner-page create chain ---------- *)

let throw_private_create_page_tag (title : string) =
  raise
    (Outliner_validate.Notification
       (Wire.Map
          [ (Wire.Keyword "type", Wire.Keyword "notification")
          ; (Wire.Keyword "payload",
             Wire.Map
               [ (Wire.Keyword "message",
                  Wire.String
                    ("New page can't set built-in tags: \"" ^ title ^ "\""))
               ; (Wire.Keyword "i18n-key",
                  Wire.Keyword "page.validation/cant-set-built-in-tags")
               ; (Wire.Keyword "i18n-args", Wire.Array [ Wire.String ("\"" ^ title ^ "\"") ])
               ; (Wire.Keyword "type", Wire.Keyword "error") ]) ]))

let existing_class_for_title db (title : string) : entity option =
  match page_exists_ids db title [ "logseq.class/Tag" ] with
  | id :: _ -> Ldb.ent_of_id db id
  | [] -> None

(* outliner-page/resolve-create-page-tag — tag is a Wire.t: Uuid, Keyword
   (db ident), Int id, or Map. Returns db id (Int), Keyword ident, or a
   build-new-class map. *)
let resolve_create_page_tag db (tag : Wire.t) : Wire.t =
  let entity_of_tag =
    match tag with
    | Wire.Uuid u -> Ldb.ent_of_ref db (Lookup_ref ("block/uuid", Uuid u))
    | Wire.Keyword k -> Ldb.ent_of_ref db (Ident k)
    | Wire.Int id -> Ldb.ent_of_id db id
    | _ -> None
  in
  (* page.cljs disallowed-private-create-page-tag? — ident only,
     no title fallback *)
  let disallowed_private e =
    match Ldb.ident_of e with
    | Some i -> List.mem i Db_class.private_tags && i <> "logseq.class/Page"
    | None -> false
  in
  match entity_of_tag with
  | Some v ->
      if disallowed_private v then
        throw_private_create_page_tag
          (Option.value (Ldb.string_value v "block/title") ~default:"");
      Wire.Int v.id
  | None ->
      (match tag with
       | Wire.Map _ ->
           let by_uuid =
             match Cljs_map.get tag "block/uuid" with
             | Some (Wire.Uuid u) -> Ldb.ent_of_ref db (Lookup_ref ("block/uuid", Uuid u))
             | _ -> None
           in
           let by_ident =
             match Cljs_map.get tag "db/ident" with
             | Some (Wire.Keyword k) -> Ldb.ent_of_ref db (Ident k)
             | _ -> None
           in
           let existing =
             match by_uuid, by_ident with
             | Some e, _ -> Some e
             | None, Some e -> Some e
             | None, None ->
                 (match Cljs_map.get tag "db/ident" with
                  | Some _ -> None
                  | None ->
                      (match Cljs_map.get tag "block/title" with
                       | Some (Wire.String t) -> existing_class_for_title db t
                       | _ -> None))
           in
           (match existing with
            | Some e ->
                if disallowed_private e then
                  throw_private_create_page_tag
                    (Option.value (Ldb.string_value e "block/title") ~default:"");
                (match by_uuid with Some _ -> tag | None -> Wire.Int e.id)
            | None ->
                let tag' = Cljs_map.dissoc tag "block/type" in
                Db_class.build_new_class db tag')
       | _ -> tag)

let resolved_tag_ident db (tag : Wire.t) : string option =
  match tag with
  | Wire.Keyword k -> Some k
  | Wire.Int id ->
      (match Ldb.ent_of_id db id with Some e -> Ldb.ident_of e | None -> None)
  | Wire.Map _ ->
      (match Cljs_map.get tag "db/ident" with
       | Some (Wire.Keyword k) -> Some k
       | _ ->
           let ent =
             match Cljs_map.get tag "db/id" with
             | Some (Wire.Int id) -> Ldb.ent_of_id db id
             | _ ->
                 (match Cljs_map.get tag "block/uuid" with
                  | Some (Wire.Uuid u) -> Ldb.ent_of_ref db (Lookup_ref ("block/uuid", Uuid u))
                  | _ -> None)
           in
           (match ent with Some e -> Ldb.ident_of e | None -> None))
  | _ -> None

let resolve_create_page_tags db (tags : Wire.t list) : Wire.t list =
  List.map (resolve_create_page_tag db) tags

(* outliner-page/get-page-by-parent-name *)
let get_page_by_parent_name db (parent_title : string) (child_title : string)
    (class_ : bool) : entity option =
  let attr =
    if class_ then "logseq.property.class/extends" else "block/parent"
  in
  q_string db
    ~inputs:
      [ Arg_scalar (Result_value (Keyword attr))
      ; Arg_scalar (Result_value (String (page_name_sanity_lc parent_title)))
      ; Arg_scalar (Result_value (String (page_name_sanity_lc child_title))) ]
    "[:find [?b ...] :in $ ?attribute ?parent-name ?child-name :where \
     [?b ?attribute ?p] [?b :block/name ?child-name] \
     [?p :block/name ?parent-name]]"
  |> List.find_map (function
       | [ Result_entity id ] -> Ldb.ent_of_id db id
       | _ -> None)

(* outliner-page/page-with-parent-and-order *)
let page_with_parent_and_order db (page : Wire.t) ~(parent : Wire.t) : Wire.t =
  let library =
    Ldb.ent_of_ref db
      (Lookup_ref
         ("block/uuid",
          Uuid (Common_uuid.gen_uuid "builtin-block-uuid" "Library")))
  in
  match library with
  | None -> failwith "Library page doesn't exist"
  | Some lib ->
      let parent_v =
        match parent with
        | Wire.Nil -> Wire.Int lib.id
        | v -> v
      in
      Cljs_map.assoc_list page
        [ "block/parent", parent_v
        ; "block/order", Wire.String (Db_order.gen_key_from_max ()) ]

(* outliner-page/split-namespace-pages — items are either existing
   entities or new page maps. *)
type ns_page_item =
  | Existing of entity
  | Built of Wire.t

let split_namespace_pages db (page : Wire.t) (date_formatter : string option)
    (create_class : bool) : ns_page_item list =
  let title =
    match Cljs_map.get page "block/title" with
    | Some (Wire.String t) -> t
    | _ -> ""
  in
  let block_uuid =
    match Cljs_map.get page "block/uuid" with
    | Some (Wire.Uuid u) -> Some u
    | _ -> None
  in
  let page_is_class_or_page =
    match Cljs_map.get page "block/tags" with
    | Some (Wire.Array tags) ->
        List.exists
          (fun t ->
             t = Wire.Keyword "logseq.class/Tag"
             || t = Wire.Keyword "logseq.class/Page")
          tags
    | _ -> false
  in
  if page_is_class_or_page && namespace_page title then begin
    let parts =
      String.split_on_char '/' title
      |> List.map Unicode.trim
      |> List.filter (fun p -> p <> "")
    in
    let n = List.length parts in
    let pages =
      List.mapi
        (fun idx part ->
           let last_part = idx = n - 1 in
           let existing =
             if idx = 0 then Ldb.get_page db (String part)
             else
               get_page_by_parent_name db (List.nth parts (idx - 1)) part
                 create_class
           in
           match existing with
           | Some e -> Existing e
           | None ->
               Built
                 (page_name_to_map part db true date_formatter
                    ?page_uuid:(if last_part then block_uuid else None)
                    ~class_:create_class ~skip_existing_page_check:true ()))
        parts
    in
    let all_internal_pages =
      List.for_all
        (function
          | Existing e -> Ldb.internal_page e
          | Built m ->
              (match Cljs_map.get m "block/tags" with
               | Some (Wire.Array ts) ->
                   List.mem (Wire.Keyword "logseq.class/Page") ts
               | _ -> false))
        pages
    in
    let all_classes =
      List.for_all
        (function
          | Existing e -> Ldb.is_class e
          | Built m ->
              (match Cljs_map.get m "block/tags" with
               | Some (Wire.Array ts) ->
                   List.mem (Wire.Keyword "logseq.class/Tag") ts
               | _ -> false))
        pages
    in
    if (not create_class) && not all_internal_pages then
      raise
        (Outliner_validate.notif ~kind:"warning"
           ~i18n_key:"page.validation/parents-must-be-pages"
           "Cannot create this page unless all parents are pages");
    if create_class && not all_classes then
      raise
        (Outliner_validate.notif ~kind:"warning"
           ~i18n_key:"class.validation/parents-must-be-tags"
           "Cannot create this tag unless all parents are tags");
    List.mapi
      (fun idx item ->
         let parent_eid =
           if idx > 0 then
             let prev = List.nth pages (idx - 1) in
             let uuid =
               match prev with
               | Existing e ->
                   (match Ldb.value e "block/uuid" with
                    | Some (Uuid u) -> Some u
                    | _ -> None)
               | Built m ->
                   (match Cljs_map.get m "block/uuid" with
                    | Some (Wire.Uuid u) -> Some u
                    | _ -> None)
             in
             (match uuid with
              | Some u -> Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid u ]
              | None -> Wire.Nil)
           else Wire.Nil
         in
         match item with
         | Existing e ->
             if create_class then
               if Ldb.is_class e then
                 if parent_eid = Wire.Nil then Existing e
                 else
                   Built
                     (Cljs_map.assoc
                        (Ds_wire.entity_map_wire e)
                        "logseq.property.class/extends" parent_eid)
               else
                 (* page exists but isn't a class — cljs returns nil *)
                 Built Wire.Nil
             else Existing e
         | Built m ->
             if m = Wire.Nil then Built Wire.Nil
             else if create_class then
               Built
                 (Db_class.build_new_class db
                    (if parent_eid = Wire.Nil then m
                     else
                       Cljs_map.assoc m "logseq.property.class/extends" parent_eid))
             else
               Built (page_with_parent_and_order db m ~parent:parent_eid))
      pages
    |> List.filter (function Built m -> m <> Wire.Nil | Existing _ -> true)
  end else [ Built page ]

(* ---------- outliner-recycle/restore-tx-data ---------- *)

let next_child_order (parent : entity) : string =
  let children =
    List.of_seq (datoms parent.db Aevt ~a:"block/parent" ~v:(Ref parent.id) ())
    |> List.filter_map (fun d -> Ldb.ent_of_id parent.db d.e)
    |> Ldb.sort_by_order
  in
  let last_order =
    match children with
    | [] -> None
    | _ ->
        let last = List.nth children (List.length children - 1) in
        (match Ldb.value last "block/order" with
         | Some (String s) -> Some s
         | _ -> None)
  in
  Db_order.gen_key last_order None

let recycled_ (e : entity) : bool =
  Option.is_some (Ldb.value e "logseq.property/deleted-at")

let resolve_ref_ent (e : entity) (attr : string) : entity option =
  Ldb.ref_ent e attr

(* restore-target *)
type restore_target =
  { parent : entity option
  ; page : entity
  ; order : string option }

let restore_target _db (root : entity) : restore_target option =
  let original_parent = resolve_ref_ent root "logseq.property.recycle/original-parent" in
  let original_page = resolve_ref_ent root "logseq.property.recycle/original-page" in
  let parent_valid =
    match original_parent with
    | Some p -> not (recycled_ p)
    | None -> false
  in
  let original_order root =
    match Ldb.value root "logseq.property.recycle/original-order" with
    | Some (String s) -> Some s
    | _ -> None
  in
  if Ldb.is_page root then
    Some
      { parent = (if parent_valid then original_parent else None)
      ; page = root
      ; order =
          (match original_order root with
           | Some o -> Some o
           | None ->
               (match original_parent with
                | Some p when parent_valid -> Some (next_child_order p)
                | _ -> None)) }
  else if parent_valid then
    (match original_parent, original_page with
     | Some p, Some page ->
         Some
           { parent = Some p
           ; page
           ; order =
               (match original_order root with
                | Some o -> Some o
                | None -> Some (next_child_order p)) }
     | _ -> None)
  else
    match original_page with
    | Some page when not (recycled_ page) ->
        Some
          { parent = Some page
          ; page
          ; order = Some (next_child_order page) }
    | _ -> None

(* outliner-recycle/restore-tx-data *)
let restore_tx_data db (root : entity) : Wire.t list =
  match restore_target db root with
  | None -> []
  | Some target ->
      let subtree =
        if Ldb.is_page root then []
        else Outliner_blocks.block_subtree_ids db root
            |> List.filter_map (Ldb.ent_of_id db)
      in
      let kw s = Wire.Keyword s in
      let retract a =
        Wire.Array [ kw "db/retract"; Wire.Int root.id; kw a ]
      in
      let clear_structure =
        [ retract "block/parent"; retract "block/order" ]
        @ (if Ldb.is_page root then [] else [ retract "block/page" ])
      in
      let clear_meta =
        [ retract "logseq.property/deleted-at"
        ; retract "logseq.property/deleted-by-ref"
        ; retract "logseq.property.recycle/original-parent"
        ; retract "logseq.property.recycle/original-page"
        ; retract "logseq.property.recycle/original-order" ]
      in
      let root_tx =
        let m = Wire.Map [ (kw "db/id", Wire.Int root.id) ] in
        let m =
          match target.parent with
          | Some p -> Cljs_map.assoc m "block/parent" (Wire.Int p.id)
          | None -> m
        in
        let m =
          match target.order with
          | Some o -> Cljs_map.assoc m "block/order" (Wire.String o)
          | None -> m
        in
        if Ldb.is_page root then m
        else Cljs_map.assoc m "block/page" (Wire.Int target.page.id)
      in
      let subtree_page_tx =
        List.map
          (fun node ->
             Wire.Map
               [ (kw "db/id", Wire.Int node.id)
               ; (kw "block/page", Wire.Int target.page.id) ])
          subtree
      in
      clear_structure @ [ root_tx ] @ subtree_page_tx @ clear_meta

(* ---------- build-page-tx / create / create! ---------- *)

(* db-property/built-in-has-ref-value? *)
let built_in_has_ref_value (db_ident : string) : bool =
  match Db_property.built_in_property_schema_type db_ident with
  | Some t -> List.mem t Db_schema.value_ref_property_types
  | None -> false

(* db-property-build/build-property-values-tx-m (non-pure variant —
   value is raw; keys may be ident keywords or maps with
   :original-property-id/:db/ident). Only the
   built-in-has-ref-value? properties reach this in build-page-tx. *)
let build_property_values_tx_m (block : Wire.t)
    (properties : (string * Wire.t) list) : (string * Wire.t) list =
  let block' =
    match Cljs_map.get block "db/id" with
    | Some _ -> block
    | None ->
        (match Cljs_map.get block "block/uuid" with
         | Some uuid ->
             Cljs_map.assoc block "db/id"
               (Wire.Array [ Wire.Keyword "block/uuid"; uuid ])
         | None -> block)
  in
  List.filter_map
    (fun (k, v) ->
       let block_id =
         match Cljs_map.get block' "db/id", Cljs_map.get block' "db/ident" with
         | Some id, _ -> id
         | None, Some ident -> ident
         | _ -> Wire.Nil
       in
       let is_default_value_prop =
         (* created-from-property points at the block when the property
            is :logseq.property/default-value *)
         false
       in
       let mk_value_block ?(opts_props = Wire.Nil) (value : Wire.t) : Wire.t =
         (* db-property-build/build-property-value-block *)
         let prop_ident = Wire.Keyword k in
         let base =
           Wire.Map
             [ (Wire.Keyword "block/uuid",
                (match Cljs_map.get opts_props "block/uuid" with
                 | Some u -> u
                 | None -> Wire.Uuid (Uuid_gen.uuid ())))
             ; (Wire.Keyword "block/page",
                (match Cljs_map.get block' "block/page" with
                 | Some (Wire.Int _ as p) -> p
                 | _ -> block_id))
             ; (Wire.Keyword "block/parent", block_id)
             ; (Wire.Keyword "logseq.property/created-from-property",
                (if k = "logseq.property/default-value" then block_id
                 else prop_ident))
             ; (Wire.Keyword "block/order",
                Wire.String (Db_order.gen_key_from_max ())) ]
         in
         let value_key =
           (* property-value-content? for :default type property →
              original-value-ref-property-types default? cljs:
              (property-value-content? (:logseq.property/type property) property)
              — for build-page-tx properties have no entity; value goes
              into :logseq.property/value when the property type is an
              original-value-ref type. Caller filters to ref-valued
              built-ins, so :logseq.property/value. *)
           if built_in_has_ref_value k then "logseq.property/value" else "block/title"
         in
         let m = Cljs_map.assoc base value_key value in
         let m = Sqlite_util.block_with_timestamps m in
         m
       in
       let item =
         match v with
         | Wire.Set vals when
             List.for_all (function Wire.Uuid _ -> true | _ -> false) vals ->
             Some (k, Wire.Set (List.map (fun u -> Wire.Array [ Wire.Keyword "block/uuid"; u ]) vals))
         | Wire.Set vals ->
             Some (k, Wire.Set (List.map (fun v' -> mk_value_block v') vals))
         | Wire.Uuid _ ->
             Some (k, Wire.Array [ Wire.Keyword "block/uuid"; v ])
         | _ -> Some (k, mk_value_block v)
       in
       ignore is_default_value_prop;
       item)
    properties

(* db-property-build/build-properties-with-ref-values *)
let build_properties_with_ref_values
    (prop_vals : (string * Wire.t) list) : (string * Wire.t) list =
  List.map
    (fun (k, v) ->
       let v' =
         match v with
         | Wire.Set vals when
             List.for_all
               (function
                 | Wire.Array [ Wire.Keyword "block/uuid"; _ ] -> true
                 | _ -> false)
               vals -> v
         | Wire.Set vals ->
             Wire.Set
               (List.map
                  (fun item ->
                     Wire.Array
                       [ Wire.Keyword "block/uuid"
                       ; (match Cljs_map.get item "block/uuid" with
                          | Some u -> u
                          | None -> Wire.Nil) ])
                  vals)
         | Wire.Array [ Wire.Keyword "block/uuid"; _ ] -> v
         | Wire.Map _ ->
             Wire.Array
               [ Wire.Keyword "block/uuid"
               ; (match Cljs_map.get v "block/uuid" with
                  | Some u -> u
                  | None -> Wire.Nil) ]
         | _ -> v
       in
       (k, v'))
    prop_vals

(* outliner-page/build-page-tx *)
let build_page_tx db (properties : (string * Wire.t) list) (page : Wire.t)
    ~(class_ : bool) ~(tags : Wire.t list)
    ~(class_ident_namespace : string option) : Wire.t list =
  match Cljs_map.get page "block/uuid" with
  | None -> []
  | Some page_uuid ->
      let type_tag =
        Wire.Keyword
          (if class_ then "logseq.class/Tag" else "logseq.class/Page")
      in
      let tags' =
        match Cljs_map.get page "block/journal-day" with
        | Some _ -> tags
        | None -> tags @ [ type_tag ]
      in
      let page' =
        let existing =
          match Cljs_map.get page "block/tags" with
          | Some (Wire.Array ts) -> ts
          | _ -> []
        in
        Cljs_map.assoc page "block/tags" (Wire.Array (existing @ tags'))
      in
      let prop_val_properties =
        List.filter (fun (k, _) -> built_in_has_ref_value k) properties
      in
      let property_vals_tx_m =
        build_property_values_tx_m page' prop_val_properties
      in
      let base_tx =
        if class_ then
          [ Cljs_map.merge
              (Db_class.build_new_class db page'
                 ?ident_namespace:class_ident_namespace)
              (match Cljs_map.get page' "db/ident" with
               | Some ident -> Wire.Map [ (Wire.Keyword "db/ident", ident) ]
               | None -> Wire.Map [])
          ; Wire.Array
              [ Wire.Keyword "db/retract"
              ; Wire.Array [ Wire.Keyword "block/uuid"; page_uuid ]
              ; Wire.Keyword "block/tags"
              ; Wire.Keyword "logseq.class/Page" ] ]
        else [ page' ]
      in
      base_tx
      @ List.map snd property_vals_tx_m
      @ [ Cljs_map.merge
            (Wire.Map
               ([ (Wire.Keyword "block/uuid", page_uuid) ]
                @ List.map
                    (fun (k, v) -> (Wire.Keyword k, v))
                    properties))
            (Wire.Map
               (List.map
                  (fun (k, v) -> (Wire.Keyword k, v))
                  (build_properties_with_ref_values property_vals_tx_m))) ]

(* outliner-page/create — returns (tx_meta, tx_data, title, page-uuid) *)
type create_result =
  { tx_meta : (string * Wire.t) list
  ; tx_data : Wire.t list
  ; title : string
  ; page_uuid : string option }

let create db (title_star : string)
    ?(uuid : string option) ?(tags : Wire.t list option) ?(properties : (string * Wire.t) list option)
    ?(persist_op = true) ?(class_ = false) ?(journal = false)
    ?(today_journal = false) ?(split_namespace = false)
    ?(class_ident_namespace : string option) () : create_result =
  let date_formatter =
    match Ldb.ent_of_ref db (Ident "logseq.class/Journal") with
    | Some e -> Ldb.string_value e "logseq.property.journal/title-format"
    | None -> None
  in
  let tags = Option.value tags ~default:[] in
  let properties = Option.value properties ~default:[] in
  let resolved_tags = resolve_create_page_tags db tags in
  let class_ =
    class_
    || List.exists
         (fun t -> resolved_tag_ident db t = Some "logseq.class/Tag")
         resolved_tags
  in
  let class_ident_namespace_set =
    class_ && Option.is_some class_ident_namespace
  in
  let title = sanitize_title title_star in
  Outliner_validate.validate_page_title_no_hashtag title;
  let types =
    if class_ then [ "logseq.class/Tag" ]
    else if journal || today_journal then [ "logseq.class/Journal" ]
    else if resolved_tags <> [] then
      List.filter_map (resolved_tag_ident db) resolved_tags
    else [ "logseq.class/Page" ]
  in
  let existing_names_page = page_exists_ids db title types in
  let journal_page_uuid =
    match
      page_name_to_map title db false date_formatter ~class_
        ~skip_existing_page_check:true ()
    with
    | Wire.Map _ as m ->
        (match Cljs_map.get m "block/uuid" with
         | Some (Wire.Uuid u) -> Some u
         | _ -> None)
    | _ -> None
  in
  let existing_page_by_journal_uuid =
    match journal_page_uuid with
    | Some u -> Ldb.ent_of_ref db (Lookup_ref ("block/uuid", Uuid u))
    | None -> None
  in
  let existing_page_id =
    if class_ident_namespace_set then
      List.find_opt
        (fun id ->
           match Ldb.ent_of_id db id with
           | Some e ->
               (match Ldb.ident_of e with
                | Some ident ->
                    (match class_ident_namespace with
                     | Some ns ->
                         (match String.rindex_opt ident '/' with
                          | Some i -> String.sub ident 0 i = ns
                          | None -> false)
                     | None -> false)
                | None -> false)
           | None -> false)
        existing_names_page
    else List.nth_opt existing_names_page 0
  in
  let existing_page =
    match existing_page_id with
    | Some id -> Ldb.ent_of_id db id
    | None -> existing_page_by_journal_uuid
  in
  let mk_meta outliner_op =
    [ ("persist-op?", Wire.Bool persist_op)
    ; ("outliner-op", Wire.Keyword outliner_op) ]
  in
  match existing_page with
  | Some epage
    when Option.is_some (Ldb.value epage "block/journal-day")
         || Option.is_none (Ldb.value epage "block/parent")
         || Ldb.recycled epage ->
      if
        class_ && (not (Ldb.is_class epage))
        && Ldb.internal_page epage
      then
        (* convert existing page to class *)
        let page_m =
          let m = Ds_wire.entity_map_wire epage in
          Cljs_map.assoc_list m
            [ "block/title",
              (match Ldb.value epage "block/title" with
               | Some v -> Ds_wire.transit_of_value v
               | None -> Wire.Nil)
            ; "block/uuid",
              (match Ldb.value epage "block/uuid" with
               | Some v -> Ds_wire.transit_of_value v
               | None -> Wire.Nil)
            ; "block/created-at",
              (match Ldb.value epage "block/created-at" with
               | Some v -> Ds_wire.transit_of_value v
               | None -> Wire.Nil) ]
        in
        { tx_meta = mk_meta "save-block"
        ; tx_data =
            [ Cljs_map.merge
                (Db_class.build_new_class db page_m
                   ?ident_namespace:class_ident_namespace)
                (match Ldb.ident_of epage with
                 | Some ident ->
                     Wire.Map [ (Wire.Keyword "db/ident", Wire.Keyword ident) ]
                 | None -> Wire.Map [])
            ; Wire.Array
                [ Wire.Keyword "db/retract"
                ; Wire.Array
                    [ Wire.Keyword "block/uuid"
                    ; (match Ldb.value epage "block/uuid" with
                       | Some (Uuid u) -> Wire.Uuid u
                       | _ -> Wire.Nil) ]
                ; Wire.Keyword "block/tags"
                ; Wire.Keyword "logseq.class/Page" ] ]
        ; title = Option.value (Ldb.string_value epage "block/title") ~default:title
        ; page_uuid =
            (match Ldb.value epage "block/uuid" with
             | Some (Uuid u) -> Some u
             | _ -> None) }
      else if Ldb.recycled epage then
        { tx_meta = mk_meta "create-page"
        ; tx_data = restore_tx_data db epage
        ; title = Option.value (Ldb.string_value epage "block/title") ~default:title
        ; page_uuid =
            (match Ldb.value epage "block/uuid" with
             | Some (Uuid u) -> Some u
             | _ -> None) }
      else
        { tx_meta = mk_meta "save-block"
        ; tx_data = []
        ; title = Option.value (Ldb.string_value epage "block/title") ~default:title
        ; page_uuid =
            (match Ldb.value epage "block/uuid" with
             | Some (Uuid u) -> Some u
             | _ -> None) }
  | _ ->
      let page =
        page_name_to_map title db true date_formatter ?page_uuid:uuid
          ~class_ ~skip_existing_page_check:true ()
      in
      let is_journal_page =
        Option.is_some (Cljs_map.get page "block/journal-day")
      in
      let page, parents =
        if (not is_journal_page) && namespace_page title && split_namespace then
          let pages = split_namespace_pages db page date_formatter class_ in
          match List.rev pages with
          | last :: rest -> (last, List.rev rest)
          | [] -> (Built page, [])
        else (Built page, [])
      in
      let page_map =
        match page with Built m -> m | Existing e -> Ds_wire.entity_map_wire e
      in
      let page_ident_internal =
        match Cljs_map.get page_map "db/ident" with
        | Some (Wire.Keyword ident) -> Db_schema.internal_ident ident
        | _ -> false
      in
      if page_map <> Wire.Nil && not page_ident_internal then begin
        let page_tags_journal =
          match Cljs_map.get page_map "block/tags" with
          | Some (Wire.Array ts) -> List.mem (Wire.Keyword "logseq.class/Journal") ts
          | _ -> false
        in
        if not (List.mem "logseq.class/Journal" types || page_tags_journal) then begin
          (match Cljs_map.get page_map "block/title" with
           | Some (Wire.String t) ->
               Outliner_validate.validate_page_title_characters t
           | _ -> ());
          List.iter
            (fun p ->
               let t =
                 match p with
                 | Built m -> Cljs_map.get m "block/title"
                 | Existing e ->
                     (match Ldb.string_value e "block/title" with
                      | Some s -> Some (Wire.String s)
                      | None -> None)
               in
               (match t with
                | Some (Wire.String s) ->
                    Outliner_validate.validate_page_title_characters s
                | _ -> ()))
            parents
        end;
        let page_uuid =
          match Cljs_map.get page_map "block/journal-day" with
          | Some (Wire.Int day) -> Common_uuid.gen_journal_page_uuid day
          | _ ->
              (match Cljs_map.get page_map "block/uuid" with
               | Some (Wire.Uuid u) -> u
               | _ -> Uuid_gen.uuid ())
        in
        let page_map = Cljs_map.assoc page_map "block/uuid" (Wire.Uuid page_uuid) in
        let page_txs =
          build_page_tx db properties page_map ~class_ ~tags:resolved_tags
            ~class_ident_namespace
        in
        let parent_txs =
          List.filter_map
            (function Built m -> Some m | Existing _ -> None)
            parents
        in
        let tx_meta =
          let base =
            [ ("outliner-op", Wire.Keyword "create-page")
            ; ("persist-op?", Wire.Bool persist_op) ]
          in
          if today_journal then
            base
            @ [ ("create-today-journal?", Wire.Bool true)
              ; ("today-journal-name", Wire.String title) ]
          else base
        in
        { tx_meta; tx_data = parent_txs @ page_txs; title;
          page_uuid = Some page_uuid }
      end else
        { tx_meta = mk_meta "create-page"; tx_data = []; title;
          page_uuid = None }

(* outliner-page/create! *)
let create_bang conn (title : string)
    ?(opts : (unit -> create_result) option) () : string * string option =
  let r =
    match opts with
    | Some f -> f ()
    | None -> create (Datascript.db conn) title ()
  in
  if r.tx_data <> [] then
    Db_transact.transact conn r.tx_data
      (Ds_wire.tx_meta_of_transit
         (Wire.Map (List.map (fun (k, v) -> (Wire.Keyword k, v)) r.tx_meta)))
    |> ignore;
  (r.title, r.page_uuid)
(* ---------- page delete (outliner-page/delete!) ---------- *)

type ref_rewrite_target =
  { ref_id : entity_id
  ; ref_uuid : string option
  ; title : string
  ; refs : entity_id list }

(* Collect entities that reference [page] via node refs and need title
   rewrite (ref ids resolved to page names). *)
let page_ref_rewrite_targets (page : entity) : ref_rewrite_target list =
  let refs =
    List.filter
      (fun (r : entity) ->
        if r.id = page.id then false
        else
          match Ldb.ref_ent r "block/page" with
          | Some p -> p.id <> page.id
          | None -> true)
      (Ldb.ref_ents page "block/_refs")
  in
  List.filter_map
    (fun (r : entity) ->
      match Ldb.string_value r "block/raw-title" with
      | None -> None
      | Some raw_title ->
          let content' = Db_content.content_id_ref_to_page raw_title [ page ] in
          if raw_title <> content' then
            let remaining_refs =
              List.filter (fun id -> id <> page.id) (Ldb.ref_ids r "block/refs")
            in
            let block_uuid =
              match Ldb.value r "block/uuid" with
              | Some (Uuid u) -> Some u
              | _ -> None
            in
            Some
              { ref_id = r.id
              ; ref_uuid = block_uuid
              ; title = content'
              ; refs = remaining_refs }
          else None)
    refs

(* db-refs->page — retract page refs + rewrite titles *)
let db_refs_to_page (page : entity) : tx_op list =
  List.concat_map
    (fun t ->
      [ Retract (Entity_id t.ref_id, "block/refs", Some (Ref page.id))
      ; Entity
          { db_id = Some (Entity_id t.ref_id)
          ; attrs = [ "block/title", One_value (String t.title) ] } ])
    (page_ref_rewrite_targets page)

(* db-refs->page-save-ops — save-block op entries for the rewired
   refs, appended to :outliner-ops *)
let db_refs_to_page_save_ops (page : entity) : value list =
  List.filter_map
    (fun t ->
      match t.ref_uuid with
      | None -> None
      | Some u ->
          Some
            (Outliner_tx_meta.op_entry "save-block"
               [ Map
                   [ (Keyword "block/uuid", Uuid u)
                   ; (Keyword "block/title", String t.title)
                   ; ( Keyword "block/refs"
                     , Vector (List.map (fun id -> Ref id) t.refs) ) ]
               ; Map [] ]))
    (page_ref_rewrite_targets page)

(* build-page-retract-tx *)
let build_page_retract_tx ?(include_page_retract = true) ?(today_page = false)
    db (page : entity) : tx_op list =
  let page_blocks_tx_data =
    List.filter_map
      (fun (b : entity) ->
        match Ldb.value b "block/uuid" with
        | Some (Uuid u)
          when Option.is_some (entity db (Lookup_ref ("block/uuid", Uuid u))) ->
            Some (RetractEntity (Lookup_ref ("block/uuid", Uuid u)))
        | _ -> None)
      (Ldb.ref_ents page "block/_page")
  in
  if today_page then page_blocks_tx_data
  else
    let property_pair_tx_data =
      if Ldb.is_property page then
        match Ldb.ident_of page with
        | Some ident ->
            List.map
              (fun (d : datom) -> Retract (Entity_id d.e, d.a, Some d.v))
              (List.of_seq (datoms db Avet ~a:ident ()))
        | None -> []
      else []
    in
    let restore_class_parent_tx =
      if Ldb.is_class page then
        List.map
          (fun (p : entity) ->
            Entity
              { db_id = Some (Entity_id p.id)
              ; attrs =
                  [ ( "logseq.property.class/extends"
                    , One_value (Ref_to (Ident "logseq.class/Root")) ) ] })
          (List.filter Ldb.is_class
             (Ldb.ref_ents page "logseq.property.class/_extends"))
      else []
    in
    let page_tx =
      if include_page_retract && Option.is_some (entity db (Entity_id page.id))
      then [ RetractEntity (Entity_id page.id) ]
      else []
    in
    page_blocks_tx_data @ property_pair_tx_data @ restore_class_parent_tx
    @ db_refs_to_page page @ page_tx

(* outliner-page/delete! — returns the cljs result shape: true |
   {:truncated? true} | false *)
let delete_conn (conn : conn) (page_uuid : string) (opts : Wire.t) : Wire.t =
  let persist_op =
    match Cljs_map.get opts "persist-op?" with
    | Some (Wire.Bool b) -> b
    | _ -> true
  in
  let rename = Cljs_map.get opts "rename?" = Some (Wire.Bool true) in
  let deleted_by_uuid =
    match Cljs_map.get opts "deleted-by-uuid" with
    | Some (Wire.Uuid u) -> Some u
    | _ -> None
  in
  let now_ms =
    match Cljs_map.get opts "now-ms" with
    | Some (Wire.Int ms) -> Some (Int64.of_int ms)
    | Some (Wire.Float ms) -> Some (Int64.of_float ms)
    | _ -> None
  in
  match entity (Datascript.db conn) (Lookup_ref ("block/uuid", Uuid page_uuid)) with
  | None -> Wire.Bool false
  | Some page ->
      let db = Datascript.db conn in
      let today_page =
        match Ldb.value page "block/journal-day" with
        | Some (Int day) ->
            let now =
              match now_ms with
              | Some ms -> ms
              | None -> Date_time_util.time_ms ()
            in
            Date_time_util.ms_to_journal_day now = day
        | _ -> false
      in
      let deleted_title =
        match Ldb.value page "block/title" with
        | Some (String t) -> String t
        | _ -> Nil
      in
      let tx_meta =
        let m =
          Outliner_tx_meta.ensure_outliner_ops
            [ ("outliner-op", Keyword "delete-page")
            ; ("deleted-page", deleted_title)
            ; ("persist-op?", Bool persist_op) ]
            (Some
               (Outliner_tx_meta.op_entry "delete-page"
                  [ Uuid page_uuid
                  ; Map
                      (List.filter_map (fun x -> x)
                         [ (match deleted_by_uuid with
                            | Some u -> Some (Keyword "deleted-by-uuid", Uuid u)
                            | None -> None)
                         ; (match now_ms with
                            | Some ms ->
                                Some (Keyword "now-ms", Instant ms)
                            | None -> None) ]) ]))
        in
        if rename then
          Outliner_tx_meta.tx_meta_put m "source-outliner-op"
            (Keyword "rename-page")
        else m
      in
      if Ldb.built_in page || Ldb.hidden page then
        (* cljs error-handler logs; result false *)
        Wire.Bool false
      else if today_page then begin
        let tx_data = build_page_retract_tx ~today_page:true db page in
        if tx_data <> [] then ignore (Db_tx.transact ~tx_meta conn tx_data);
        Wire.Map [ (Wire.Keyword "truncated?", Wire.Bool true) ]
      end
      else if Ldb.is_class page || Ldb.is_property page then begin
        let tx_data = build_page_retract_tx db page in
        ignore (Db_tx.transact ~tx_meta conn tx_data);
        Wire.Bool true
      end
      else begin
        let ref_rewrite_save_ops = db_refs_to_page_save_ops page in
        let tx_data =
          db_refs_to_page page
          @ Outliner_recycle.recycle_page_tx_data db page ?deleted_by_uuid
              ?now_ms:(Option.map Int64.to_float now_ms) ()
        in
        let tx_meta' =
          if ref_rewrite_save_ops <> [] then
            Outliner_tx_meta.append_outliner_ops tx_meta ref_rewrite_save_ops
          else tx_meta
        in
        if tx_data <> [] then
          ignore (Db_tx.transact ~tx_meta:tx_meta' conn tx_data);
        Wire.Bool true
      end
