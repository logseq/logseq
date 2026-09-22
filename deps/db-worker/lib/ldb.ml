(* Read-side domain helpers — faithful ports of logseq.db and
   logseq.db.frontend.entity-util / db.common.initial-data used by the
   group-(b) query endpoints. Each fn cites its cljs source. *)

open Datascript

(* ---------- entity access ---------- *)

(* Test instrumentation: number of entity lookups — mirrors the cljs
   view_test `with-redefs d/entity` counter. *)
let entity_lookups = ref 0

let counted_entity db (r : entity_ref) : entity option =
  incr entity_lookups;
  entity db r

let ent_of_id db (id : entity_id) : entity option =
  counted_entity db (Entity_id id)

let ent_of_ref db (r : entity_ref) : entity option = counted_entity db r

(* cljs entity-attr on a :_reverse attr scans the forward attr's datoms
   (db/-search) — it never requires :db/index. The engine's entity_attr
   routes reverse refs through the AVET index which does, so do the same
   scan over the AEVT index here. *)
let reverse_attr_values (db : db) (id : entity_id) (a : attr) : value list =
  datoms db Aevt ~a:(reverse_ref a) ~v:(Ref id) ()
  |> Seq.map (fun (d : datom) -> Ref d.e)
  |> List.of_seq
  |> List.sort Util.compare_value

(* cljs (get entity attr) over forward and :_reverse attrs. entity_attr
   materializes ref values into tx_entities — unwrap their :db/id back to
   Ref so ref attrs keep working (cljs yields {:db/id ...} maps). *)
let values (e : entity) (a : attr) : value list =
  let db_id_ref (te : tx_entity) =
    match te.db_id with
    | Some (Entity_id id) -> Some (Ref id)
    | _ -> None
  in
  if is_reverse_ref a then reverse_attr_values e.db e.id a
  else
    match entity_attr e a with
    | Some (One_value v) -> [ v ]
    | Some (Many_values vs) -> vs
    | Some (One_entity te) -> List.filter_map Fun.id [ db_id_ref te ]
    | Some (Many_entities tes) -> List.filter_map db_id_ref tes
    | _ -> []

let value (e : entity) (a : attr) : value option =
  match values e a with v :: _ -> Some v | [] -> None

let truthy = function
  | Some Nil | None -> false
  | Some (Bool b) -> b
  | Some _ -> true

let ref_ids (e : entity) (a : attr) : entity_id list =
  List.filter_map (function Ref id -> Some id | _ -> None) (values e a)

let ref_ent (e : entity) (a : attr) : entity option =
  match ref_ids e a with
  | id :: _ -> ent_of_id e.db id
  | [] -> None

let ref_ents (e : entity) (a : attr) : entity list =
  List.filter_map (fun id -> ent_of_id e.db id) (ref_ids e a)

let string_value (e : entity) (a : attr) : string option =
  match value e a with Some (String s) -> Some s | _ -> None

let int_value (e : entity) (a : attr) : int option =
  match value e a with
  | Some (Int n) -> Some n
  | Some (Instant ms) -> Some (Int64.to_int ms)
  | _ -> None

let ident_of (e : entity) : string option =
  match value e "db/ident" with Some (Keyword s) -> Some s | _ -> None

(* cljs (get-in (d/schema db) [attr :db/valueType]) OR the attr
   entity's own :db/valueType (db properties carry schema on their
   ident entity). *)
let ref_attr (db : db) (a : attr) : bool =
  match Schema.schema_attr_by_name (schema db) a with
  | Some sa when sa.value_type = Some RefType -> true
  | _ ->
      (match counted_entity db (Ident a) with
       | Some e -> value e "db/valueType" = Some (Keyword "db.type/ref")
       | None -> false)

let many_attr (db : db) (a : attr) : bool =
  match Schema.schema_attr_by_name (schema db) a with
  | Some sa -> sa.cardinality = Many
  | None ->
      (match counted_entity db (Ident a) with
       | Some e -> value e "db/cardinality" = Some (Keyword "db.cardinality/many")
       | None -> false)

(* cljs db/is-attr? :db/unique — static schema OR the attr entity's own
   :db/unique. *)
let unique_attr (db : db) (a : attr) : bool =
  match Schema.schema_attr_by_name (schema db) a with
  | Some sa -> sa.unique <> None
  | None ->
      (match counted_entity db (Ident a) with
       | Some e -> value e "db/unique" <> None
       | None -> false)

(* ---------- entity-util predicates ---------- *)

(* entity-util/has-tag? *)
let has_tag (e : entity) (tag_ident : string) : bool =
  List.exists
    (fun v ->
      match v with
      | Ref id ->
          (match ent_of_id e.db id with
           | Some t -> ident_of t = Some tag_ident
           | None -> false)
      | Keyword s -> s = tag_ident
      | _ -> false)
    (values e "block/tags")

let internal_page (e : entity) = has_tag e "logseq.class/Page"
let is_class (e : entity) = has_tag e "logseq.class/Tag"
let is_property (e : entity) = has_tag e "logseq.class/Property"
let is_journal (e : entity) = has_tag e "logseq.class/Journal"
let closed_value (e : entity) = Option.is_some (value e "block/closed-value-property")
let asset (e : entity) = Option.is_some (value e "logseq.property.asset/type")

let is_page (e : entity) =
  internal_page e || is_journal e || is_class e || is_property e

(* entity-util/hidden? — own flags or any ancestor's, cycle-safe. *)
let hidden (page : entity) : bool =
  let rec hidden_parent (parent : entity option) seen =
    match parent with
    | Some e when not (List.mem e.id seen) ->
        truthy (value e "logseq.property/hide?")
        || truthy (value e "logseq.property/deleted-at")
        || hidden_parent (ref_ent e "block/parent") (e.id :: seen)
    | _ -> false
  in
  truthy (value page "logseq.property/hide?")
  || truthy (value page "logseq.property/deleted-at")
  || hidden_parent (ref_ent page "block/parent") []

(* entity-util/recycled? *)
let recycled (e : entity) : bool =
  let rec recycled_parent (parent : entity option) seen =
    match parent with
    | Some p when not (List.mem p.id seen) ->
        truthy (value p "logseq.property/deleted-at")
        || recycled_parent (ref_ent p "block/parent") (p.id :: seen)
    | _ -> false
  in
  truthy (value e "logseq.property/deleted-at")
  || recycled_parent (ref_ent e "block/parent") []

let built_in (e : entity) = truthy (value e "logseq.property/built-in?")

(* ---------- page name helpers (common-util) ---------- *)

(* common-util/remove-boundary-slashes *)
let remove_boundary_slashes s =
  let s = if String.length s > 0 && s.[0] = '/' then String.sub s 1 (String.length s - 1) else s in
  let n = String.length s in
  if n > 0 && s.[n - 1] = '/' then String.sub s 0 (n - 1) else s

(* common-util/page-name-sanity: boundary slashes + NFC. *)
let page_name_sanity s = Unicode.nfc (remove_boundary_slashes s)
let page_name_sanity_lc s = page_name_sanity (Unicode.lowercase s)

(* ---------- initial-data helpers ---------- *)

(* entity-util/get-pages-by-name *)
let pages_by_name db page_name : datom list =
  List.of_seq
    (datoms db Avet ~a:"block/name" ~v:(String (page_name_sanity_lc page_name)) ())

(* initial-data/get-first-page-by-name — oldest page id. *)
let first_page_by_name db page_name : entity_id option =
  pages_by_name db page_name
  |> List.map (fun d -> d.e)
  |> List.sort compare
  |> fun l -> List.nth_opt l 0

(* initial-data/get-first-page-by-title — oldest page? id for :block/title. *)
let first_page_by_title db page_name : entity_id option =
  datoms db Avet ~a:"block/title" ~v:(String page_name) ()
  |> List.of_seq
  |> List.filter_map (fun d ->
         match ent_of_id db d.e with
         | Some e when is_page e -> Some d.e
         | _ -> None)
  |> List.sort compare
  |> fun l -> List.nth_opt l 0

(* cljs parse-uuid accepts the canonical 8-4-4-4-12 hex form. *)
let is_uuid_string s =
  let hex c =
    (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')
  in
  let check i =
    match i with
    | 8 | 13 | 18 | 23 -> s.[i] = '-'
    | _ -> hex s.[i]
  in
  let rec loop i = i >= 36 || (check i && loop (i + 1)) in
  String.length s = 36 && loop 0

(* ---------- journal titles (date-time-util/int->journal-title) ----------

   Formats a :block/journal-day int (yyyymmdd) with a strftime-ish
   pattern. Supports the tokens used by the built-in journal title
   formats: yyyy yy MMMM MMM MM dd do. Unknown text passes through. *)

let month_short =
  [| "Jan"; "Feb"; "Mar"; "Apr"; "May"; "Jun"; "Jul"; "Aug"; "Sep";
     "Oct"; "Nov"; "Dec" |]

let month_long =
  [| "January"; "February"; "March"; "April"; "May"; "June"; "July";
     "August"; "September"; "October"; "November"; "December" |]

let ordinal n =
  let suffix =
    if n mod 100 >= 11 && n mod 100 <= 13 then "th"
    else match n mod 10 with 1 -> "st" | 2 -> "nd" | 3 -> "rd" | _ -> "th"
  in
  string_of_int n ^ suffix

let journal_title_of_day (day : int) (fmt : string) : string =
  let y = day / 10000 in
  let m = day / 100 mod 100 in
  let d = day mod 100 in
  let b = Buffer.create 16 in
  let n = String.length fmt in
  let try_token i tok rep =
    let len = String.length tok in
    if i + len <= n && String.sub fmt i len = tok then Some (rep, i + len)
    else None
  in
  let rec loop i =
    if i < n then begin
      let i' =
        match
          List.find_map Fun.id
            [ try_token i "yyyy" (Printf.sprintf "%04d" y);
              try_token i "MMMM" month_long.(m - 1);
              try_token i "MMM" month_short.(m - 1);
              try_token i "yy" (Printf.sprintf "%02d" (y mod 100));
              try_token i "MM" (Printf.sprintf "%02d" m);
              try_token i "dd" (Printf.sprintf "%02d" d);
              try_token i "do" (ordinal d) ]
        with
        | Some (rep, next) ->
            Buffer.add_string b rep;
            next
        | None ->
            Buffer.add_char b fmt.[i];
            i + 1
      in
      loop i'
    end
  in
  loop 0;
  Buffer.contents b

let journal_title_format db : string =
  match counted_entity db (Ident "logseq.class/Journal") with
  | Some j ->
      (match value j "logseq.property.journal/title-format" with
       | Some (String s) -> s
       | _ -> "MMM do, yyyy")
  | None -> "MMM do, yyyy"

(* entity-plus/lookup-kv-then-entity :block/raw-title — journal pages
   get their formatted journal title; everything else falls back to
   :block/title. *)
let raw_title db (e : entity) : value option =
  if is_journal e then
    (* cljs get-journal-title — int->journal-title returns nil for a
       journal without :block/journal-day (callers then fall back to
       :block/title/:block/name themselves). *)
    match int_value e "block/journal-day" with
    | Some day -> Some (String (journal_title_of_day day (journal_title_format db)))
    | None -> None
  else
    value e "block/title"

(* ldb/get-page — eid | uuid | page name (case-insensitive). *)
let get_page db (ref_v : value) : entity option =
  match ref_v with
  | Int id -> ent_of_id db id
  | Uuid u -> counted_entity db (Lookup_ref ("block/uuid", Uuid u))
  | String s ->
      if is_uuid_string s then
        counted_entity db (Lookup_ref ("block/uuid", Uuid s))
      else
        (match first_page_by_name db s with
         | Some id -> ent_of_id db id
         | None -> None)
  | _ -> None

(* ldb/get-case-page — uuid or exact :block/title. *)
let get_case_page db (ref_v : value) : entity option =
  match ref_v with
  | Uuid u -> counted_entity db (Lookup_ref ("block/uuid", Uuid u))
  | String s ->
      if is_uuid_string s then
        counted_entity db (Lookup_ref ("block/uuid", Uuid s))
      else
        (match first_page_by_title db s with
         | Some id -> ent_of_id db id
         | None -> None)
  | _ -> None

(* ldb/get-journal-page-by-day *)
let get_journal_page_by_day db (journal_day : int) : entity option =
  match
    Seq.uncons (datoms db Avet ~a:"block/journal-day" ~v:(Int journal_day) ())
  with
  | Some (d, _) -> ent_of_id db d.e
  | None -> None

(* ldb/sort-by-order — cljs sort-by :block/order; nil sorts first. *)
let sort_by_order (ents : entity list) : entity list =
  let order_of (e : entity) =
    match value e "block/order" with Some (String s) -> Some s | _ -> None
  in
  List.stable_sort
    (fun a b ->
      match (order_of a, order_of b) with
      | None, None -> 0
      | None, Some _ -> -1
      | Some _, None -> 1
      | Some x, Some y -> String.compare x y)
    ents


(* entity-plus/lookup-kv-then-entity :block/_parent — raw children minus
   property-created and closed-value children. The unfiltered cljs variant
   :block/_raw-parent is a plain :block/_parent reverse lookup here. *)
let parent_children (e : entity) : entity list =
  ref_ents e "block/_parent"
  |> List.filter (fun c ->
      not (Option.is_some (value c "logseq.property/created-from-property")
           || Option.is_some (value c "block/closed-value-property")))

(* ldb/get-children — sorted :block/_parent (no nested). *)
let get_children (parent : entity) : entity list =
  sort_by_order (parent_children parent)

(* get-block-children-or-property-children (db.cljs) *)
let block_children_or_property_children (block : entity) (parent : entity) : entity list =
  let from_property = ref_ids block "logseq.property/created-from-property" in
  let closed_property = ref_ent block "block/closed-value-property" in
  match closed_property, from_property with
  | Some cp, _ -> sort_by_order (ref_ents cp "block/_closed-value-property")
  | None, prop_id :: _ ->
      sort_by_order
        (List.filter
           (fun e -> List.mem prop_id (ref_ids e "logseq.property/created-from-property"))
           (ref_ents parent "block/_parent"))
  | None, [] -> sort_by_order (parent_children parent)

(* get-ordinary-sibling — sibling by :block/order among :block/parent
   children, skipping property-created and closed-value children. *)
let ordinary_sibling (block : entity) (dir : [ `Left | `Right ]) : entity option =
  let db = block.db in
  match ref_ids block "block/parent", value block "block/order" with
  | parent_id :: _, Some (String block_order) ->
      let eligible, closer =
        match dir with
        | `Left -> ((fun c -> c < 0), fun c -> c > 0)
        | `Right -> ((fun c -> c > 0), fun c -> c < 0)
      in
      let has_datom e a =
        Option.is_some (Seq.uncons (datoms db Eavt ~e ~a ()))
      in
      let best_id, _ =
        Seq.fold_left
          (fun (best_id, best_order) (d : datom) ->
            let child_id = d.e in
            let child_order =
              match
                Seq.uncons (datoms db Eavt ~e:child_id ~a:"block/order" ())
              with
              | Some (od, _) -> (match od.v with String s -> Some s | _ -> None)
              | None -> None
            in
            match child_order with
            | Some child_order
              when eligible (String.compare child_order block_order)
                   && not (has_datom child_id "logseq.property/created-from-property")
                   && not (has_datom child_id "block/closed-value-property")
                   && (match best_order with
                       | None -> true
                       | Some bo -> closer (String.compare child_order bo)) ->
                (Some child_id, Some child_order)
            | _ -> (best_id, best_order))
          (None, None)
          (datoms db Avet ~a:"block/parent" ~v:(Ref parent_id) ())
      in
      (match best_id with Some id -> ent_of_id db id | None -> None)
  | _ -> None

(* get-left/right-sibling-for-property-children *)
let sibling_for_property_children (block : entity) (parent : entity)
    (dir : [ `Left | `Right ]) : entity option =
  let children = block_children_or_property_children block parent in
  let children = match dir with `Left -> List.rev children | `Right -> children in
  let found =
    match value block "block/order" with
    | Some (String block_order) ->
        List.find_opt
          (fun child ->
            match value child "block/order" with
            | Some (String child_order) ->
                (match dir with
                 | `Left -> String.compare child_order block_order < 0
                 | `Right -> String.compare child_order block_order > 0)
            | _ -> false)
          children
    | _ -> None
  in
  (match found with
   | Some child when child.id <> block.id -> Some child
   | _ -> None)

(* ldb/get-left-sibling, get-right-sibling *)
let get_left_sibling (block : entity) : entity option =
  match ref_ent block "block/parent" with
  | None -> None
  | Some parent ->
      if closed_value block || Option.is_some (value block "logseq.property/created-from-property")
      then sibling_for_property_children block parent `Left
      else ordinary_sibling block `Left

let get_right_sibling (block : entity) : entity option =
  match ref_ent block "block/parent" with
  | None -> None
  | Some parent ->
      if closed_value block || Option.is_some (value block "logseq.property/created-from-property")
      then sibling_for_property_children block parent `Right
      else ordinary_sibling block `Right

(* ldb/get-down — filtered :block/_parent, first by :block/order *)
let get_down (block : entity) : entity option =
  match sort_by_order (parent_children block) with
  | first :: _ -> Some first
  | [] -> None

let ref_v_to_ref = function
  | Int id -> Entity_id id
  | Ref id -> Entity_id id
  | Keyword s -> Ident s
  | Uuid u -> Lookup_ref ("block/uuid", Uuid u)
  | v -> Lookup_ref ("block/uuid", v)

(* ldb/has-children? — cljs (:block/_parent e) is the filtered reverse
   lookup (minus property-created and closed-value children). *)
let has_children db (ref_v : value) : bool =
  match counted_entity db (ref_v_to_ref ref_v) with
  | Some e -> parent_children e <> []
  | None -> false

(* ldb/get-key-value — :kv/value of the kv entity named by ident. *)
let get_key_value db (key_ident : string) : value option =
  match counted_entity db (Ident key_ident) with
  | Some e -> value e "kv/value"
  | None -> None

let get_graph_rtc_uuid db = get_key_value db "logseq.kv/graph-uuid"
let get_graph_local_uuid db = get_key_value db "logseq.kv/local-graph-uuid"
let get_graph_schema_version db = get_key_value db "logseq.kv/schema-version"
let get_graph_rtc_e2ee db = get_key_value db "logseq.kv/graph-rtc-e2ee?"

(* ldb/page-exists? — pages titled `page-name` with one of `tags`.
   Classes/Property tags are case-sensitive (:block/title); others go
   through :block/name. *)
(* entity-plus/db-based-graph? *)
let db_based_graph (db : db) : bool =
  match counted_entity db (Ident "logseq.kv/db-type") with
  | Some e -> value e "kv/value" = Some (String "db")
  | None -> false

(* db-db/get-built-in-page — lookup by deterministic :builtin-block-uuid. *)
let get_built_in_page db (title : string) : entity option =
  let u = Common_uuid.gen_uuid "builtin-block-uuid" title in
  counted_entity db (Lookup_ref ("block/uuid", Uuid u))

(* common-initial-data/get-block-full-children-ids — the recursive
   :parent rule, as in cljs. *)
let get_block_full_children_ids db (block_eid : entity_id) : entity_id list =
  let rules_edn =
    "[[(parent ?p ?c) [?c :block/parent ?p]] \
      [(parent ?p ?c) [?t :block/parent ?p] (parent ?t ?c)]]"
  in
  q_string db
    "[:find [?c ...] :in $ ?id % :where (parent ?id ?c)]"
    ~inputs:
      [ Arg_scalar (Result_entity block_eid);
        Arg_rules (Parser.parse_rules (Parser.read_edn rules_edn)) ]
  |> List.filter_map
       (fun row -> match row with [ Result_entity c ] -> Some c | _ -> None)

let page_exists_ids db (page_name : string) (tag_idents : string list) : entity_id list =
  let tag_set = tag_idents in
  let only_class_tags =
    tag_set <> []
    && List.for_all
         (fun t -> t = "logseq.class/Tag" || t = "logseq.class/Property")
         tag_set
  in
  let attr = if only_class_tags then "block/title" else "block/name" in
  let name_v = if only_class_tags then page_name else page_name_sanity_lc page_name in
  let candidate_ids =
    datoms db Avet ~a:attr ~v:(String name_v) ()
    |> List.of_seq
    |> List.map (fun d -> d.e)
  in
  match tag_set with
  | [] ->
      (* cljs binds [?tag-ident ...] to the empty collection — the query
         yields no candidates without a tag check. *)
      []
  | _ ->
      List.filter
        (fun eid ->
          match ent_of_id db eid with
          | None -> false
          | Some e ->
              List.exists
                (fun tid ->
                  match ent_of_id db tid with
                  | Some t -> (match ident_of t with Some i -> List.mem i tag_set | None -> false)
                  | None -> false)
                (ref_ids e "block/tags"))
        candidate_ids

let page_exists db (page_name : string) (tag_idents : string list) : bool =
  page_exists_ids db page_name tag_idents <> []

(* initial-data/get-latest-journals — journal-day desc, not recycled. *)
let get_latest_journals db : entity list =
  let today = Clock.today_int () in
  (* rseek walks the index backwards from the seek point; keep while
     the attr stays :block/journal-day and day <= today. *)
  let ds =
    rseek_datoms db Avet ~a:"block/journal-day" ~v:(Int today) ()
    |> Seq.take_while (fun d -> d.a = "block/journal-day")
    |> List.of_seq
  in
  let seen = Hashtbl.create 31 in
  List.filter_map
    (fun (d : datom) ->
      match d.v with
      | Int day when day <= today ->
          (match ent_of_id db d.e with
           | Some e
             when is_journal e && not (recycled e)
                  && not (Hashtbl.mem seen e.id) ->
               Hashtbl.replace seen e.id ();
               Some e
           | _ -> None)
      | _ -> None)
    ds

(* db-class/internal-tags — built-in classes hidden on a node and in
   all-pages views. *)
let internal_tag_ident (ident : string) : bool =
  List.mem ident
    [ "logseq.class/Page"; "logseq.class/Property"; "logseq.class/Tag";
      "logseq.class/Root"; "logseq.class/Asset" ]

let hidden_or_internal_tag (e : entity) : bool =
  hidden e || (match ident_of e with Some i -> internal_tag_ident i | None -> false)

(* ldb/get-all-pages — :block/name entities that are not hidden or an
   internal tag. *)
let get_all_pages db : entity list =
  List.of_seq (datoms db Avet ~a:"block/name" ())
  |> List.filter_map (fun (d : datom) ->
         match ent_of_id db d.e with
         | Some e when not (hidden_or_internal_tag e) -> Some e
         | _ -> None)

(* ldb/get-page-blocks — pull [*] for every :block/page datom of the
   page. *)
let get_page_blocks db (page_id : entity_id) : pulled_entity list =
  List.of_seq (datoms db Avet ~a:"block/page" ~v:(Ref page_id) ())
  |> List.map (fun (d : datom) -> Entity_id d.e)
  |> pull_many_string db "[*]"
  |> List.filter_map (fun x -> x)

(* ldb/collapsed-and-has-children? *)
let collapsed_and_has_children db (block : entity) : bool =
  truthy (value block "block/collapsed?") && has_children db (Ref block.id)

(* ldb/get-block-last-direct-child-id — last filtered :block/_parent
   child by :block/order; not-collapsed? skips blocks that are
   collapsed w/ children. *)
let get_block_last_direct_child_id db ?(not_collapsed = false)
    (block_id : entity_id) : entity_id option =
  match ent_of_id db block_id with
  | None -> None
  | Some block ->
      if not_collapsed && collapsed_and_has_children db block then None
      else
        let children = sort_by_order (parent_children block) in
        (match List.rev children with
         | last :: _ -> Some last.id
         | [] -> None)

(* ldb/get-block-and-children — preorder list of entity and its
   descendants. include-property-block? also walks each child's
   :logseq.property/query target (children list is _raw-parent). *)
let get_block_and_children db ?(include_property_block : bool option) (block_uuid : string)
    : entity list =
  let include_property_block = Option.value include_property_block ~default:false in
  let rec aux (e : entity) : entity list =
    let children =
      if include_property_block then begin
        let raw = ref_ents e "block/_parent" in
        let extras =
          List.filter_map (fun c -> ref_ent c "logseq.property/query") raw
        in
        sort_by_order (raw @ extras)
      end else
        sort_by_order (parent_children e)
    in
    e :: List.concat_map aux children
  in
  match counted_entity db (Lookup_ref ("block/uuid", Uuid block_uuid)) with
  | Some e -> aux e
  | None -> []

(* ldb/get-pages — :block/title falling back to :block/name for every
   :block/name entity. Upstream removes hidden? on the returned title
   strings, which is a no-op; titles are kept as-is here too. *)
let get_pages db : value list =
  List.of_seq
    (datoms db Aevt ~a:"block/name" ())
  |> List.filter_map (fun (d : datom) ->
         match ent_of_id db d.e with
         | Some e -> Some (match value e "block/title" with Some t -> t | None -> d.v)
         | None -> Some d.v)

(* ---------- bidirectional properties ---------- *)

(* db-property/user-property-namespace? *)
let user_property_namespace (ns : string) : bool =
  let sub = ".property" in
  let n = String.length ns and m = String.length sub in
  let rec found i =
    i + m <= n && (String.sub ns i m = sub || found (i + 1))
  in
  n >= m && found 0

(* db-property/plugin-property? *)
let plugin_property (a : attr) : bool =
  match Schema.split_namespaced_attr a with
  | Some ns, _ ->
      let p = "plugin.property." in
      String.length ns >= String.length p
      && String.sub ns 0 (String.length p) = p
  | _ -> false

(* db-property/property-value-content *)
let property_value_content (e : entity) : string option =
  match string_value e "block/title" with
  | Some s -> Some s
  | None -> string_value e "logseq.property/value"

type bidirectional_group =
  { title : string
  ; class_ : entity
  ; entities : entity list
  }

(* ldb/get-bidirectional-properties — ref properties on user/plugin
   namespaces that carry :logseq.property/classes, grouped by tag
   class. *)
let get_bidirectional_properties db (target_id : entity_id)
    : bidirectional_group list =
  let created_from_property =
    match ent_of_id db target_id with
    | Some e -> Option.is_some (value e "logseq.property/created-from-property")
    | None -> false
  in
  if created_from_property then []
  else begin
    let attrs =
      q_string db
        "[:find [?a ...] :where
          [?property :db/ident ?a]
          [?property :db/valueType :db.type/ref]
          [?property :logseq.property/classes ?class]]"
      |> List.filter_map (function
           | [ Result_attr a ] -> Some a
           | [ Result_value (Keyword a) ] -> Some a
           | _ -> None)
      |> List.filter (fun a ->
             match Schema.split_namespaced_attr a with
             | Some ns, _ when user_property_namespace ns || plugin_property a ->
                 (match counted_entity db (Ident a) with
                  | Some p ->
                      value p "db/valueType" = Some (Keyword "db.type/ref")
                      && ref_ids p "logseq.property/classes" <> []
                  | None -> false)
             | _ -> false)
    in
    let referrers =
      List.concat_map
        (fun a ->
          List.of_seq (datoms db Avet ~a ~v:(Ref target_id) ())
          |> List.filter_map (fun (d : datom) -> ent_of_id db d.e))
        attrs
    in
    let class_entities =
      List.concat_map
        (fun (e : entity) ->
          if
            e.id = target_id || recycled e || is_class e || is_property e
          then []
          else
            List.filter_map
              (fun (t : entity) ->
                if is_class t && not (built_in t) && not (recycled t)
                then Some (t.id, e)
                else None)
              (ref_ents e "block/tags"))
        referrers
    in
    let groups =
      List.fold_left
        (fun acc (cid, e) ->
          match List.assoc_opt cid acc with
          | Some es when List.exists (fun (x : entity) -> x.id = e.id) es -> acc
          | Some es -> (cid, e :: es) :: List.remove_assoc cid acc
          | None -> (cid, [ e ]) :: acc)
        [] class_entities
    in
    let created_at (e : entity) =
      match value e "block/created-at" with
      | Some (Int n) -> Some n
      | _ -> None
    in
    let cmp_created_at a b =
      match created_at a, created_at b with
      | None, None -> 0
      | None, Some _ -> -1
      | Some _, None -> 1
      | Some x, Some y -> compare x y
    in
    List.filter_map
      (fun (cid, ents) ->
        match ent_of_id db cid with
        | None -> None
        | Some class_ ->
            if value class_ "logseq.property.class/enable-bidirectional?"
               = Some (Bool true)
            then begin
              let custom_title =
                match value class_
                        "logseq.property.class/bidirectional-property-title" with
                | Some (String s) -> Some s
                | Some (Ref id) ->
                    (match ent_of_id db id with
                     | Some v -> property_value_content v
                     | None -> None)
                | _ -> None
              in
              let title =
                match custom_title with
                | Some s when String.length (Unicode.trim s) > 0 -> s
                | _ ->
                    Plural.plural
                      (Option.value
                         (string_value class_ "block/title")
                         ~default:"")
              in
              Some
                { title
                ; class_
                ; entities = List.sort cmp_created_at ents
                }
            end
            else None)
      groups
    |> List.sort (fun g1 g2 -> cmp_created_at g1.class_ g2.class_)
  end

(* ldb/get-block-parents — walk :block/parent up to [depth] (default
   100), collecting parents farthest-first (cljs conj on list). *)
let get_block_parents db ?(depth : int option) (block_uuid : string) : entity list =
  let depth = Option.value depth ~default:100 in
  let rec loop uuid parents d =
    if d > depth then parents
    else
      match counted_entity db (Lookup_ref ("block/uuid", Uuid uuid)) with
      | None -> parents
      | Some e ->
          (match ref_ent e "block/parent" with
           | Some parent ->
               (match value parent "block/uuid" with
                | Some (Uuid u) -> loop u (parent :: parents) (d + 1)
                | _ -> parent :: parents)
           | None -> parents)
  in
  loop block_uuid [] 1

(* ldb/get-alias-source-page — first :block/_alias entity. *)
let get_alias_source_page db (page_id : entity_id) : entity option =
  match ent_of_id db page_id with
  | None -> None
  | Some e ->
      (match ref_ents e "block/_alias" with
       | src :: _ -> Some src
       | [] -> None)

(* db-property/public-built-in-property? *)
let public_built_in_property (e : entity) =
  truthy (value e "logseq.property/public?")

(* db-db/private-built-in-page? *)
let private_built_in_page (e : entity) : bool =
  if is_property e then not (public_built_in_property e)
  else if is_class e || internal_page e then false
  else true

(* common-initial-data/get-block-children-ids — all descendant ids
   via :block/_parent (include-collapsed-children? default true,
   pages always expand). *)
let get_block_children_ids db ?(include_collapsed_children : bool option)
    (block_eid : entity_id) : entity_id list =
  let include_collapsed = Option.value include_collapsed_children ~default:true in
  match ent_of_id db block_eid with
  | None -> []
  | Some _ ->
      let seen = Hashtbl.create 64 in
      let expand ids =
        List.concat_map
          (fun eid ->
            match ent_of_id db eid with
            | Some e when include_collapsed || not (truthy (value e "block/collapsed?")) || is_page e ->
                ref_ids e "block/_parent"
            | _ -> [])
          ids
      in
      let rec loop ids =
        let fresh = List.filter (fun id -> not (Hashtbl.mem seen id)) (expand ids) in
        if fresh <> [] then begin
          List.iter (fun id -> Hashtbl.replace seen id ()) fresh;
          loop fresh
        end
      in
      loop [ block_eid ];
      Hashtbl.fold (fun id () acc -> id :: acc) seen []

(* ldb/get-library-page — built-in "Library" page *)
let get_library_page db : entity option = get_built_in_page db "Library"

(* ---------- entity-util predicates (cont.) ---------- *)

let uuid_value (e : entity) (a : attr) : string option =
  match value e a with Some (Uuid u) -> Some u | _ -> None

(* entity-util/object? — has any :block/tags *)
let is_object (e : entity) : bool = values e "block/tags" <> []

(* common-config/library-page-name / quick-add-page-name *)
let library_page_name = "Library"
let quick_add_page_name = "Quick add"

(* sqlite-create-graph/built-in-pages-names *)
let built_in_pages_names = [ library_page_name; quick_add_page_name; "Contents" ]

(* db-db/library? — built-in page titled "Library" *)
let is_library (e : entity) : bool =
  built_in e && string_value e "block/title" = Some library_page_name

(* db-db/inline-tag? — "#[[uuid]]" occurs in the raw title *)
let inline_tag (raw_title : string) (tag_uuid : string) : bool =
  Ns_util.str_contains raw_title ("#" ^ Page_ref.to_page_ref tag_uuid)

(* ---------- page / orphan helpers ---------- *)

(* ldb/page-empty? — no raw :block/_parent children *)
let page_empty (db : db) (page_id : entity_id) : bool =
  match counted_entity db (Entity_id page_id) with
  | None -> false
  | Some page -> ref_ents page "block/_parent" = []

(* ldb/get-first-child — first raw :block/_parent child by :block/order *)
let get_first_child db (id : entity_id) : entity option =
  match counted_entity db (Entity_id id) with
  | Some e ->
      (match sort_by_order (ref_ents e "block/_parent") with
       | c :: _ -> Some c
       | [] -> None)
  | None -> None

(* ldb/get-orphaned-pages — pages with no refs left, empty or containing a
   lone placeholder block, not built-in/property/journal-named/hidden. *)
let get_orphaned_pages db
    ?(empty_ref_f = fun (page : entity) -> ref_ids page "block/_refs" = [])
    ?(built_in_pages_names = built_in_pages_names) (pages : string list)
    : entity list =
  let built_in_lower = List.map Unicode.lowercase built_in_pages_names in
  List.filter_map
    (fun page_name ->
      match get_page db (String page_name) with
      | Some page when not (hidden page) ->
          let name' = Option.value (string_value page "block/name") ~default:"" in
          if
            empty_ref_f page
            && (page_empty db page.id
                ||
                (match get_first_child db page.id with
                 | Some first_child ->
                     List.length (ref_ids page "block/_page") = 1
                     &&
                     (match string_value first_child "block/title" with
                      | Some t -> List.mem (Unicode.trim t) [ ""; "-"; "*" ]
                      | None -> false)
                 | None -> false))
            && not (List.mem name' built_in_lower)
            && not (is_property page)
            && not (Ns_util.str_contains name' "/" && not (is_journal page))
            && not (Option.is_some (value page "block/properties"))
          then Some page
          else None
      | _ -> None)
    pages

(* ---------- block ordering ---------- *)

(* ldb/block-order-path — :block/order chain root-first, from the page's
   top-level down to [block]; None when unreachable from the page. *)
let block_order_path (page_id : entity_id) (block : entity) : string option list option =
  let rec aux (b : entity) (path : string option list) : string option list option =
    if
      Option.is_some (value b "logseq.property/created-from-property")
      || Option.is_some (value b "block/closed-value-property")
    then None
    else
      match ref_ent b "block/parent" with
      | None -> None
      | Some parent ->
          let path = string_value b "block/order" :: path in
          if parent.id = page_id then Some (List.rev path) else aux parent path
  in
  aux block []

let compare_order_paths (p1 : string option list) (p2 : string option list) : int =
  List.compare Stdlib.compare p1 p2

(* ldb/sort-page-random-blocks — possibly non-consecutive blocks of one page,
   sorted by preorder path. *)
let sort_page_random_blocks _db (blocks : entity list) : entity list =
  let page_id =
    match blocks with
    | b :: _ -> (
        match ref_ent b "block/page" with
        | Some p -> p.id
        | None -> invalid_arg "sort_page_random_blocks: block has no :block/page")
    | [] -> 0
  in
  let sorted =
    blocks
    |> List.filter_map (fun b ->
        Option.map (fun p -> (p, b)) (block_order_path page_id b))
    |> List.stable_sort (fun (p1, _) (p2, _) -> compare_order_paths p1 p2)
    |> List.map snd
  in
  let seen = Hashtbl.create 16 in
  List.filter
    (fun (b : entity) ->
      if Hashtbl.mem seen b.id then false
      else begin
        Hashtbl.add seen b.id ();
        true
      end)
    sorted

(* ldb/last-child-block? — child (or its chain) is the right-most sibling.
   Child may be collapsed. *)
let rec last_child_block db (parent_id : entity_id) (child_id : entity_id) : bool =
  match counted_entity db (Entity_id child_id) with
  | None -> false
  | Some child ->
      if parent_id = child_id then true
      else
        (match get_right_sibling child with
         | Some _ -> false
         | None ->
             (match ref_ent child "block/parent" with
              | Some p -> last_child_block db parent_id p.id
              | None -> false))

(* ldb/consecutive-block? — block-1 and block-2 are adjacent in page order:
   same page and one is the left sibling of, or last-descendant-left of,
   the other. *)
let consecutive_block db (b1 : entity) (b2 : entity) : bool =
  let same_page (x : entity) (y : entity) =
    match ref_ent x "block/page", ref_ent y "block/page" with
    | Some p, Some q -> p.id = q.id
    | None, None -> true
    | _ -> false
  in
  let aux (x : entity) (y : entity) =
    same_page x y
    &&
    (match get_left_sibling y with
     | Some ls -> ls.id = x.id
     | None -> false
     | exception _ -> false)
    || (match get_left_sibling y with
        | Some prev_sibling -> last_child_block db prev_sibling.id x.id
        | None -> false)
  in
  (aux b1 b2) || (aux b2 b1)

(* ldb/get-non-consecutive-blocks — each block whose right neighbor in the
   given order isn't consecutive with it. *)
let get_non_consecutive_blocks db (blocks : entity list) : entity list =
  let arr = Array.of_list blocks in
  let n = Array.length arr in
  List.init (n - 1) (fun i -> i)
  |> List.filter_map (fun i ->
      if not (consecutive_block db arr.(i) arr.(i + 1)) then Some arr.(i)
      else None)

(* db/get-page-parents — walk :block/parent chain to the root. *)
let get_page_parents (node : entity) : entity list =
  let rec loop (current : entity option) (parents : entity list) =
    match current with
    | Some p when not (List.exists (fun e -> e.id = p.id) parents) ->
        loop (ref_ent p "block/parent") (parents @ [ p ])
    | _ -> parents
  in
  loop (ref_ent node "block/parent") []

(* db/build-favorite-tx — tx for a favorite block in the favorite page. *)
let build_favorite_tx (favorite_uuid : string) : (attr * value) list =
  [ ("block/link", Vector [ Keyword "block/uuid"; Uuid favorite_uuid ])
  ; ("block/title", String "") ]

(* db/get-all-properties — all entities tagged logseq.class/Property. *)
let get_all_properties (db : db) : entity list =
  match counted_entity db (Ident "logseq.class/Property") with
  | None -> []
  | Some class_ent ->
      datoms db Avet ~a:"block/tags" ~v:(Ref class_ent.id) ()
      |> Seq.filter_map (fun d -> ent_of_id db d.e)
      |> List.of_seq
