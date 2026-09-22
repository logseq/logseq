(* 1:1 translations of deps/db/test/logseq/db/common/view_test.cljs —
   all 42 deftests.

   cljs with-redefs instrumentation maps to lib counters:
   - d/entity                        -> Ldb.entity_lookups (counted_entity)
   - db-class/get-class-objects      -> Db_class.get_class_objects_calls
   - db-class/get-class-object-ids   -> Db_class.get_class_object_ids_calls
   - d/datoms + d/rseek-datoms       -> Db_view.index_scans[attr]
     (datoms consumed from :avet <sort-attr>)
   - entity-plus/unsafe->Entity      -> no OCaml equivalent: entities are lazy
     records; every materialization goes through counted Ldb.ent_of_*
   - js/Date.now                     -> Unix.gettimeofday (elapsed ms)

   Skipped cases: none — the whole file is ported. *)

open Datascript
open Test_shared
open Db_test_util

(* ---------- option-map builders (transit Wire shape) ---------- *)

let kw s = Wire.Keyword s

let opts pairs = Wire.Map (List.map (fun (k, v) -> (kw k, v)) pairs)

(* cljs assoc — replace the key in place *)
let opt_add o extras =
  match o with
  | Wire.Map pairs ->
      let extras = List.map (fun (k, v) -> (kw k, v)) extras in
      Wire.Map
        (List.filter (fun (k, _) -> not (List.mem k (List.map fst extras))) pairs
         @ extras)
  | _ -> o

let sorting xs =
  Wire.Array
    (List.map
       (fun (id, asc) -> Wire.Map [ (kw "id", kw id); (kw "asc?", Wire.Bool asc) ])
       xs)

let clause a op m = Wire.Array [ kw a; kw op; m ]

let filters ?(or_ = false) clauses =
  Wire.Map
    [ (kw "or?", Wire.Bool or_)
    ; (kw "filters", Wire.Array clauses) ]

(* ---------- helpers ---------- *)

(* cljs create-view-id — transacts the view entity map, resolves the
   tempid (by uuid here, since transact_maps does not return tempids) *)
let create_view_id conn ?view_for_id feature_type =
  let uuid = gen_uuid () in
  let tx =
    [ ("db/id", Int (-100))
    ; ("block/title", Str "Test view")
    ; ("block/uuid", Uuid uuid)
    ; ("logseq.property.view/feature-type", Kw feature_type)
    ; ("logseq.property.view/type", Kw "logseq.property.view/type.table") ]
    @ (match view_for_id with
       | Some id -> [ ("logseq.property/view-for", Int id) ]
       | None -> [])
  in
  transact_maps conn [ tx ];
  (Option.get (entity_at_uuid (db_of conn) uuid)).id

let view_count (r : Wire.t) =
  match Wire.get "count" r with Some (Wire.Int n) -> n | _ -> -1

let data_wire (r : Wire.t) : Wire.t list =
  match Wire.get "data" r with Some (Wire.Array xs) -> xs | _ -> []

let data_ids (r : Wire.t) : entity_id list =
  List.filter_map (function Wire.Int i -> Some i | _ -> None) (data_wire r)

(* cljs result-titles *)
let result_titles db (r : Wire.t) : string list =
  List.filter_map
    (fun id ->
       match Ldb.ent_of_id db id with
       | Some e ->
           (match Ldb.value e "block/title" with
            | Some (String s) -> Some s
            | _ -> None)
       | None -> None)
    (data_ids r)

let ident_eid db s = (ent_of_ref_exn db (Ident s)).id

(* cljs (d/q '[:find ?e . :in $ ?title :where [?e :block/title ?title]] db t) *)
let eid_of_title db t = (Option.get (find_page_by_title db t)).id

let subvec xs a b = List.filteri (fun i _ -> i >= a && i < b) xs

let int_list_eq name a b = check name (a = b)

let str_list_eq' name a b = check name (a = b)

let wire_set_of_ids xs = List.sort_uniq compare xs

(* cljs first-window-without-row-hydration — counters + elapsed *)
type window_probe =
  { result : Wire.t
  ; entity_calls : int
  ; class_object_calls : int
  ; class_object_id_calls : int
  ; elapsed_ms : float }

let first_window_without_row_hydration db view_id opt : window_probe =
  Ldb.entity_lookups := 0;
  Db_class.get_class_objects_calls := 0;
  Db_class.get_class_object_ids_calls := 0;
  Db_view.index_scans_reset ();
  let t0 = Unix.gettimeofday () in
  let result = Db_view.get_view_data db (Some view_id) opt in
  { result
  ; entity_calls = !Ldb.entity_lookups
  ; class_object_calls = !Db_class.get_class_objects_calls
  ; class_object_id_calls = !Db_class.get_class_object_ids_calls
  ; elapsed_ms = (Unix.gettimeofday () -. t0) *. 1000. }

(* cljs topic-conn *)
let topic_conn ?(properties = []) pages =
  create_conn_with_blocks
    ~classes: [ ("Topic", { default_class with c_title = Some "Topic" }) ]
    ~properties
    ~pages_and_blocks: pages
    ()

let journal_pages days =
  List.map
    (fun day ->
       { page = { default_page with pg_journal = Some day }
       ; blocks = [ { default_block with b_title = Some (Printf.sprintf "Block %d" day) } ] })
    days

(* ---------- tests ---------- *)

let test_journals_ordered_compact_index () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        (journal_pages [ 20260716; 20260715; 20260714; 20260713; 20260712 ])
      ()
  in
  let result =
    Db_view.get_view_data (db_of conn) None (opts [ "journals?", Wire.Bool true ])
  in
  let index = data_wire result in
  check "count = 5" (view_count result = 5);
  let days =
    List.map (fun w -> Wire.get "block/journal-day" w) index
  in
  check "journal-day order"
    (days
     = [ Some (Wire.Int 20260716); Some (Wire.Int 20260715)
       ; Some (Wire.Int 20260714); Some (Wire.Int 20260713)
       ; Some (Wire.Int 20260712) ]);
  check "every row is a map"
    (List.for_all (function Wire.Map _ -> true | _ -> false) index);
  check "index rows hold only db/id + block/journal-day"
    (List.for_all
       (fun w ->
          match w with
          | Wire.Map kvs ->
              List.length kvs = 2
              && Wire.get "db/id" w <> None
              && Wire.get "block/journal-day" w <> None
          | _ -> false)
       index);
  check "no :selection-block-ids"
    (Wire.get "selection-block-ids" result = None)

let test_all_pages_sorts_and_filters_hidden () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page =
              { default_page with
                pg_title = Some "Alpha"
              ; pg_extra = [ "block/updated-at", Int 10 ] }
          ; blocks = [] }
        ; { page =
              { default_page with
                pg_title = Some "Beta"
              ; pg_extra = [ "block/updated-at", Int 20 ] }
          ; blocks = [] }
        ; { page =
              { default_page with
                pg_title = Some "Hidden"
              ; pg_extra =
                  [ "block/updated-at", Int 30
                  ; "logseq.property/hide?", Bool true ] }
          ; blocks = [] }
        ; { page =
              { default_page with
                pg_title = Some "Deleted"
              ; pg_extra =
                  [ "block/updated-at", Int 40
                  ; "logseq.property/deleted-at", Int 1 ] }
          ; blocks = [] } ]
      ()
  in
  let view_id = create_view_id conn "all-pages" in
  let result =
    Db_view.get_view_data (db_of conn) (Some view_id)
      (opts [ "view-feature-type", kw "all-pages"
            ; "sorting", sorting [ ("block/updated-at", false) ] ])
  in
  check "count = 2" (view_count result = 2);
  str_list_eq' "titles" (result_titles (db_of conn) result) [ "Beta"; "Alpha" ]

let test_journal_window_excludes_future_with_aliases () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_journal = Some 20240101 }; blocks = [] }
        ; { page = { default_page with pg_journal = Some 29990101 }; blocks = [] }
        ; { page = { default_page with pg_title = Some "Alias target" }; blocks = [] } ]
      ()
  in
  let db = db_of conn in
  let future_id =
    match
      List.of_seq (datoms db Avet ~a:"block/journal-day" ~v:(Int 29990101) ())
    with
    | d :: _ -> d.e
    | [] -> failwith "no journal-day datom"
  in
  let alias_id = (Option.get (find_page_by_title db "Alias target")).id in
  transact_maps conn [ op_db_add (Int future_id) "block/alias" (Int alias_id) ];
  List.iter
    (fun extra ->
       let result =
         Db_view.get_view_data (db_of conn) None
           (opts ([ "journals?", Wire.Bool true ] @ extra))
       in
       check "count = 1" (view_count result = 1);
       check "only 20240101"
         (List.map (fun w -> Wire.get "block/journal-day" w) (data_wire result)
          = [ Some (Wire.Int 20240101) ]))
    [ []; [ "row-limit", Wire.Int 26 ] ]

let test_small_class_window_no_unrelated_scan () =
  let conn =
    create_conn_with_blocks
      ~classes: [ ("Topic", { default_class with c_title = Some "Topic" }) ]
      ~pages_and_blocks:
        [ { page =
              { default_page with
                pg_title = Some "Tagged"
              ; pg_tags = [ "Topic" ] }
          ; blocks = [] }
        ; { page = { default_page with pg_title = Some "Unrelated" }
          ; blocks =
              List.init 1000
                (fun i ->
                   { default_block with
                     b_title = Some (Printf.sprintf "Unrelated %d" i) }) } ]
      ()
  in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  Db_view.index_scans_reset ();
  let result =
    Db_view.get_view_data db (Some view_id)
      (opts [ "view-feature-type", kw "class-objects"
            ; "view-for-id", Wire.Int class_id
            ; "sorting", sorting [ ("block/updated-at", false) ]
            ; "row-limit", Wire.Int 26 ])
  in
  check "count = 1" (view_count result = 1);
  str_list_eq' "titles" (result_titles db result) [ "Tagged" ];
  let scanned =
    Option.value ~default:0
      (Hashtbl.find_opt Db_view.index_scans "block/updated-at")
  in
  check "scanned < 26" (scanned < 26)

let test_all_pages_title_sort () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page =
              { default_page with
                pg_title = Some "gamma"
              ; pg_extra = [ "block/updated-at", Int 1 ] }
          ; blocks = [] }
        ; { page =
              { default_page with
                pg_title = Some "alpha"
              ; pg_extra = [ "block/updated-at", Int 2 ] }
          ; blocks = [] }
        ; { page =
              { default_page with
                pg_title = Some "beta"
              ; pg_extra = [ "block/updated-at", Int 3 ] }
          ; blocks = [] } ]
      ()
  in
  let view_id = create_view_id conn "all-pages" in
  let result =
    Db_view.get_view_data (db_of conn) (Some view_id)
      (opts [ "view-feature-type", kw "all-pages"
            ; "sorting", sorting [ ("block/title", true) ] ])
  in
  str_list_eq' "title sort" (result_titles (db_of conn) result)
    [ "alpha"; "beta"; "gamma" ]

let test_all_pages_row_limit_keeps_full_count () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        (List.map
           (fun (t, ts) ->
              { page =
                  { default_page with
                    pg_title = Some t
                  ; pg_extra = [ "block/updated-at", Int ts ] }
              ; blocks = [] })
           [ ("alpha", 1); ("beta", 2); ("gamma", 3) ])
      ()
  in
  let view_id = create_view_id conn "all-pages" in
  let result =
    Db_view.get_view_data (db_of conn) (Some view_id)
      (opts [ "view-feature-type", kw "all-pages"
            ; "sorting", sorting [ ("block/title", true) ]
            ; "row-limit", Wire.Int 2 ])
  in
  check "count = 3" (view_count result = 3);
  str_list_eq' "window titles" (result_titles (db_of conn) result)
    [ "alpha"; "beta" ]

let test_class_objects_row_limit_keeps_full_count () =
  let conn =
    create_conn_with_blocks
      ~classes: [ ("Topic", { default_class with c_title = Some "Topic" }) ]
      ~pages_and_blocks:
        (List.map
           (fun (t, ts) ->
              { page =
                  { default_page with
                    pg_title = Some t
                  ; pg_tags = [ "Topic" ]
                  ; pg_extra = [ "block/updated-at", Int ts ] }
              ; blocks = [] })
           [ ("A", 10); ("B", 20); ("C", 30) ])
      ()
  in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let result =
    Db_view.get_view_data db (Some view_id)
      (opts [ "view-feature-type", kw "class-objects"
            ; "view-for-id", Wire.Int class_id
            ; "sorting", sorting [ ("block/title", true) ]
            ; "row-limit", Wire.Int 2 ])
  in
  check "count = 3" (view_count result = 3);
  str_list_eq' "window titles" (result_titles db result) [ "A"; "B" ]

let test_all_pages_row_offset_scrolled_window () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        (List.map
           (fun (t, ts) ->
              { page =
                  { default_page with
                    pg_title = Some t
                  ; pg_extra = [ "block/updated-at", Int ts ] }
              ; blocks = [] })
           [ ("alpha", 1); ("beta", 2); ("gamma", 3); ("delta", 4) ])
      ()
  in
  let db = db_of conn in
  let view_id = create_view_id conn "all-pages" in
  let option =
    opts [ "view-feature-type", kw "all-pages"
         ; "sorting", sorting [ ("block/title", true) ] ]
  in
  let full = Db_view.get_view_data db (Some view_id) option in
  let window =
    Db_view.get_view_data db (Some view_id)
      (opt_add option [ "row-limit", Wire.Int 2; "row-offset", Wire.Int 1 ])
  in
  check "count matches" (view_count window = 4 && view_count full = 4);
  str_list_eq' "scrolled titles" (result_titles db window) [ "beta"; "delta" ];
  check "subvec of full" (subvec (data_ids full) 1 3 = data_ids window)

let test_class_objects_row_offset_scrolled_window () =
  let conn =
    create_conn_with_blocks
      ~classes: [ ("Topic", { default_class with c_title = Some "Topic" }) ]
      ~pages_and_blocks:
        (List.map
           (fun (t, ts) ->
              { page =
                  { default_page with
                    pg_title = Some t
                  ; pg_tags = [ "Topic" ]
                  ; pg_extra = [ "block/updated-at", Int ts ] }
              ; blocks = [] })
           [ ("A", 10); ("B", 20); ("C", 30); ("D", 40) ])
      ()
  in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let option =
    opts [ "view-feature-type", kw "class-objects"
         ; "view-for-id", Wire.Int class_id
         ; "sorting", sorting [ ("block/title", true) ] ]
  in
  let full = Db_view.get_view_data db (Some view_id) option in
  let window =
    Db_view.get_view_data db (Some view_id)
      (opt_add option [ "row-limit", Wire.Int 2; "row-offset", Wire.Int 2 ])
  in
  check "count matches" (view_count window = 4 && view_count full = 4);
  str_list_eq' "scrolled titles" (result_titles db window) [ "C"; "D" ];
  check "subvec of full" (subvec (data_ids full) 2 4 = data_ids window);
  (* cljs with-redefs: get-class-object-ids must not be called *)
  Db_class.get_class_object_ids_calls := 0;
  let window2 =
    Db_view.get_view_data db (Some view_id)
      (opt_add option [ "row-limit", Wire.Int 2; "row-offset", Wire.Int 2 ])
  in
  str_list_eq' "re-run titles" (result_titles db window2) [ "C"; "D" ];
  check "no get-class-object-ids" (!Db_class.get_class_object_ids_calls = 0)

let test_class_objects_id_path_bounded_many_rows () =
  let pages =
    List.init 400
      (fun idx ->
         { page =
             { default_page with
               pg_title = Some (Printf.sprintf "Topic %d" idx)
             ; pg_tags = [ "Topic" ]
             ; pg_extra = [ "block/updated-at", Int idx ] }
         ; blocks = [] })
  in
  let conn =
    create_conn_with_blocks
      ~classes: [ ("Topic", { default_class with c_title = Some "Topic" }) ]
      ~pages_and_blocks: pages ()
  in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let option =
    opts [ "view-feature-type", kw "class-objects"
         ; "view-for-id", Wire.Int class_id
         ; "sorting", sorting [ ("block/title", true) ] ]
  in
  Db_class.get_class_objects_calls := 0;
  let window =
    Db_view.get_view_data db (Some view_id)
      (opt_add option [ "row-limit", Wire.Int 30 ])
  in
  let full = Db_view.get_view_data db (Some view_id) option in
  check "no entity-path hydration" (!Db_class.get_class_objects_calls = 0);
  check "count 400" (view_count window = 400 && view_count full = 400);
  check "window 30" (List.length (data_ids window) = 30);
  check "full 400" (List.length (data_ids full) = 400);
  check "window = take 30 full"
    (List.filteri (fun i _ -> i < 30) (data_ids full) = data_ids window);
  check "all ids" (List.length (data_wire window)
                 = List.length (data_ids window)
                 && List.length (data_wire full) = List.length (data_ids full))

let test_class_objects_first_window_instant () =
  let pages =
    List.init 400
      (fun idx ->
         { page =
             { default_page with
               pg_title = Some (Printf.sprintf "Topic %d" idx)
             ; pg_tags = [ "Topic" ]
             ; pg_extra = [ "block/updated-at", Int idx ] }
         ; blocks = [] })
  in
  let conn =
    create_conn_with_blocks
      ~classes: [ ("Topic", { default_class with c_title = Some "Topic" }) ]
      ~pages_and_blocks: pages ()
  in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let w =
    first_window_without_row_hydration db view_id
      (opts [ "view-feature-type", kw "class-objects"
            ; "view-for-id", Wire.Int class_id
            ; "sorting", sorting [ ("block/title", true) ]
            ; "row-limit", Wire.Int 30 ])
  in
  check "entity-calls <= 3" (w.entity_calls <= 3);
  check "no get-class-objects" (w.class_object_calls = 0);
  check "count 400" (view_count w.result = 400);
  check "data 30" (List.length (data_ids w.result) = 30);
  check "all ids"
    (List.length (data_wire w.result) = List.length (data_ids w.result));
  check "elapsed < 400ms" (w.elapsed_ms < 400.)

let test_all_pages_first_window_count_hidden_filter () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page =
              { default_page with
                pg_title = Some "Alpha"
              ; pg_extra = [ "block/updated-at", Int 10 ] }
          ; blocks = [] }
        ; { page =
              { default_page with
                pg_title = Some "Beta"
              ; pg_extra = [ "block/updated-at", Int 20 ] }
          ; blocks = [] }
        ; { page =
              { default_page with
                pg_title = Some "Hidden"
              ; pg_extra =
                  [ "block/updated-at", Int 30
                  ; "logseq.property/hide?", Bool true ] }
          ; blocks = [] }
        ; { page =
              { default_page with
                pg_title = Some "Deleted"
              ; pg_extra =
                  [ "block/updated-at", Int 40
                  ; "logseq.property/deleted-at", Int 1 ] }
          ; blocks = [] } ]
      ()
  in
  let db = db_of conn in
  let view_id = create_view_id conn "all-pages" in
  let option =
    opts [ "view-feature-type", kw "all-pages"
         ; "sorting", sorting [ ("block/updated-at", false) ] ]
  in
  let window =
    Db_view.get_view_data db (Some view_id)
      (opt_add option [ "row-limit", Wire.Int 10 ])
  in
  let full = Db_view.get_view_data db (Some view_id) option in
  check "count matches" (view_count full = view_count window);
  check "count 2" (view_count window = 2);
  check "window = take 10 full"
    (List.filteri (fun i _ -> i < 10) (data_ids full) = data_ids window)

let test_all_pages_count_drops_after_delete () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        (List.map
           (fun (t, ts) ->
              { page =
                  { default_page with
                    pg_title = Some t
                  ; pg_extra = [ "block/updated-at", Int ts ] }
              ; blocks = [] })
           [ ("Alpha", 10); ("Beta", 20); ("Gamma", 30) ])
      ()
  in
  let db = db_of conn in
  let view_id = create_view_id conn "all-pages" in
  let option =
    opts [ "view-feature-type", kw "all-pages"
         ; "sorting", sorting [ ("block/updated-at", false) ] ]
  in
  let before =
    Db_view.get_view_data db (Some view_id)
      (opt_add option [ "row-limit", Wire.Int 10 ])
  in
  let gamma = Option.get (find_page_by_title db "Gamma") in
  transact_maps conn
    [ [ ("db/id", Int gamma.id); ("logseq.property/deleted-at", Int 1) ] ];
  let db' = db_of conn in
  let after =
    Db_view.get_view_data db' (Some view_id)
      (opt_add option [ "row-limit", Wire.Int 10 ])
  in
  check "before count 3" (view_count before = 3);
  str_list_eq' "before titles" (result_titles db before)
    [ "Gamma"; "Beta"; "Alpha" ];
  check "after count 2" (view_count after = 2);
  str_list_eq' "after titles" (result_titles db' after) [ "Beta"; "Alpha" ];
  check "count = data length"
    (view_count after = List.length (data_ids after))

let test_all_pages_filter_count_matches_rows () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        (List.map
           (fun (t, ts) ->
              { page =
                  { default_page with
                    pg_title = Some t
                  ; pg_extra = [ "block/updated-at", Int ts ] }
              ; blocks = [] })
           [ ("alpha", 1); ("alpine", 2); ("beta", 3) ])
      ()
  in
  let db = db_of conn in
  let view_id = create_view_id conn "all-pages" in
  let option =
    opts [ "view-feature-type", kw "all-pages"
         ; "sorting", sorting [ ("block/title", true) ] ]
  in
  let unfiltered =
    Db_view.get_view_data db (Some view_id)
      (opt_add option [ "row-limit", Wire.Int 10 ])
  in
  let filtered =
    Db_view.get_view_data db (Some view_id)
      (opt_add option
         [ "row-limit", Wire.Int 10
         ; "filters",
           filters ~or_:false [ clause "block/title" "text-contains" (Wire.String "alp") ] ])
  in
  check "unfiltered count 3" (view_count unfiltered = 3);
  check "filtered count 2 = rows"
    (view_count filtered = 2 && List.length (data_ids filtered) = 2);
  str_list_eq' "filtered titles" (result_titles db filtered) [ "alpha"; "alpine" ]

let test_all_pages_first_window_instant () =
  let pages =
    List.init 200
      (fun idx ->
         { page =
             { default_page with
               pg_title = Some (Printf.sprintf "Page %d" idx)
             ; pg_extra = [ "block/updated-at", Int idx ] }
         ; blocks = [] })
  in
  let conn = create_conn_with_blocks ~pages_and_blocks:pages () in
  let db = db_of conn in
  let view_id = create_view_id conn "all-pages" in
  let w =
    first_window_without_row_hydration db view_id
      (opts [ "view-feature-type", kw "all-pages"
            ; "sorting", sorting [ ("block/updated-at", false) ]
            ; "row-limit", Wire.Int 30 ])
  in
  check "entity-calls <= 3" (w.entity_calls <= 3);
  check "no get-class-objects" (w.class_object_calls = 0);
  check "count 200" (view_count w.result = 200);
  check "data 30" (List.length (data_ids w.result) = 30);
  check "all ids"
    (List.length (data_wire w.result) = List.length (data_ids w.result));
  check "elapsed < 400ms" (w.elapsed_ms < 400.)

let test_class_objects_small_set_sorts_eids () =
  let pages =
    List.init 21
      (fun idx ->
         { page =
             { default_page with
               pg_title = Some (Printf.sprintf "Tag %d" idx)
             ; pg_tags = [ "Topic" ]
             ; pg_extra = [ "block/updated-at", Int idx ] }
         ; blocks = [] })
  in
  let conn =
    create_conn_with_blocks
      ~classes: [ ("Topic", { default_class with c_title = Some "Topic" }) ]
      ~pages_and_blocks: pages ()
  in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let option =
    opts [ "view-feature-type", kw "class-objects"
         ; "view-for-id", Wire.Int class_id
         ; "sorting", sorting [ ("block/updated-at", false) ] ]
  in
  let t0 = Unix.gettimeofday () in
  let window =
    Db_view.get_view_data db (Some view_id)
      (opt_add option [ "row-limit", Wire.Int 26 ])
  in
  let elapsed_ms = (Unix.gettimeofday () -. t0) *. 1000. in
  let full = Db_view.get_view_data db (Some view_id) option in
  check "count 21" (view_count window = 21 && view_count full = 21);
  check "data 21" (List.length (data_ids window) = 21);
  check "window = full" (data_ids full = data_ids window);
  check "elapsed < 50ms" (elapsed_ms < 50.)

let test_all_pages_first_window_no_full_sort () =
  let pages =
    List.init 2500
      (fun idx ->
         { page =
             { default_page with
               pg_title = Some (Printf.sprintf "Page %d" idx)
             ; pg_extra = [ "block/updated-at", Int idx ] }
         ; blocks = [] })
  in
  let conn = create_conn_with_blocks ~pages_and_blocks:pages () in
  let db = db_of conn in
  let view_id = create_view_id conn "all-pages" in
  let option =
    opts [ "view-feature-type", kw "all-pages"
         ; "sorting", sorting [ ("block/updated-at", false) ] ]
  in
  let t0 = Unix.gettimeofday () in
  let window =
    Db_view.get_view_data db (Some view_id)
      (opt_add option [ "row-limit", Wire.Int 30 ])
  in
  let elapsed_ms = (Unix.gettimeofday () -. t0) *. 1000. in
  let full = Db_view.get_view_data db (Some view_id) option in
  check "count 2500" (view_count window = 2500 && view_count full = 2500);
  check "data 30" (List.length (data_ids window) = 30);
  check "window = take 30 full"
    (List.filteri (fun i _ -> i < 30) (data_ids full) = data_ids window);
  check "elapsed < 150ms" (elapsed_ms < 150.)

let test_class_objects_first_window_filters_hidden () =
  let conn =
    create_conn_with_blocks
      ~classes:
        [ ("Parent", { default_class with c_title = Some "Parent" })
        ; ("Child",
           { default_class with
             c_title = Some "Child"
           ; c_extends = [ "Parent" ] }) ]
      ~pages_and_blocks:
        [ { page =
              { default_page with
                pg_title = Some "Visible"
              ; pg_tags = [ "Child" ]
              ; pg_extra = [ "block/updated-at", Int 10 ] }
          ; blocks = [] }
        ; { page =
              { default_page with
                pg_title = Some "Deleted"
              ; pg_tags = [ "Child" ]
              ; pg_extra =
                  [ "block/updated-at", Int 20
                  ; "logseq.property/deleted-at", Int 1 ] }
          ; blocks = [] }
        ; { page =
              { default_page with
                pg_title = Some "Hidden"
              ; pg_tags = [ "Child" ]
              ; pg_extra =
                  [ "block/updated-at", Int 30
                  ; "logseq.property/hide?", Bool true ] }
          ; blocks = [] }
        ; { page =
              { default_page with
                pg_title = Some "Hidden parent"
              ; pg_extra = [ "logseq.property/hide?", Bool true ] }
          ; blocks =
              [ { default_block with
                  b_title = Some "Nested hidden"
                ; b_tags = [ "Child" ]
                ; b_extra = [ "block/updated-at", Int 40 ] } ] }
        ; { page = { default_page with pg_title = Some "Visible parent" }
          ; blocks =
              [ { default_block with
                  b_title = Some "Nested visible"
                ; b_tags = [ "Child" ]
                ; b_extra = [ "block/updated-at", Int 50 ] } ] } ]
      ()
  in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Parent" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let option =
    opts [ "view-feature-type", kw "class-objects"
         ; "view-for-id", Wire.Int class_id
         ; "sorting", sorting [ ("block/updated-at", false) ] ]
  in
  let full = Db_view.get_view_data db (Some view_id) option in
  let window =
    Db_view.get_view_data db (Some view_id)
      (opt_add option [ "row-limit", Wire.Int 10 ])
  in
  check "count matches" (view_count full = view_count window);
  check "visible titles"
    (List.sort_uniq String.compare (result_titles db window)
     = [ "Nested visible"; "Visible" ]);
  check "window = full" (data_ids full = data_ids window)

let number_prop =
  [ ("user.property/score", { default_property with p_type = "number" }) ]

let test_class_objects_number_property_sort () =
  let conn =
    topic_conn ~properties:number_prop
      (List.map
         (fun (t, s) ->
            { page =
                { default_page with
                  pg_title = Some t
                ; pg_tags = [ "Topic" ]
                ; pg_properties = [ "user.property/score", Int s ] }
            ; blocks = [] })
         [ ("A", 2); ("B", 10); ("C", 1) ])
  in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let option =
    opts [ "view-feature-type", kw "class-objects"
         ; "view-for-id", Wire.Int class_id ]
  in
  let asc =
    Db_view.get_view_data db (Some view_id)
      (opt_add option [ "sorting", sorting [ ("user.property/score", true) ] ])
  in
  let desc =
    Db_view.get_view_data db (Some view_id)
      (opt_add option [ "sorting", sorting [ ("user.property/score", false) ] ])
  in
  let w =
    first_window_without_row_hydration db view_id
      (opt_add option
         [ "sorting", sorting [ ("user.property/score", true) ]
         ; "row-limit", Wire.Int 2 ])
  in
  str_list_eq' "asc" (result_titles db asc) [ "C"; "A"; "B" ];
  str_list_eq' "desc" (result_titles db desc) [ "B"; "A"; "C" ];
  check "window count 3" (view_count w.result = 3);
  str_list_eq' "window titles" (result_titles db w.result) [ "C"; "A" ];
  check "entity-calls <= 3" (w.entity_calls <= 3);
  check "no get-class-objects" (w.class_object_calls = 0)

let test_class_objects_number_sort_first_window_instant () =
  let pages =
    List.init 200
      (fun idx ->
         { page =
             { default_page with
               pg_title = Some (Printf.sprintf "Topic %d" idx)
             ; pg_tags = [ "Topic" ]
             ; pg_extra = [ "block/updated-at", Int idx ]
             ; pg_properties = [ "user.property/score", Int idx ] }
         ; blocks = [] })
  in
  let conn = topic_conn ~properties:number_prop pages in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let w =
    first_window_without_row_hydration db view_id
      (opts [ "view-feature-type", kw "class-objects"
            ; "view-for-id", Wire.Int class_id
            ; "sorting", sorting [ ("user.property/score", false) ]
            ; "row-limit", Wire.Int 30 ])
  in
  check "entity-calls <= 3" (w.entity_calls <= 3);
  check "count 200" (view_count w.result = 200);
  check "data 30" (List.length (data_ids w.result) = 30);
  str_list_eq' "titles"
    (result_titles db w.result)
    (List.init 30 (fun i -> Printf.sprintf "Topic %d" (199 - i)));
  check "elapsed < 400ms" (w.elapsed_ms < 400.)

let test_class_objects_title_is_filter_id_path () =
  let conn =
    topic_conn
      (List.map
         (fun t ->
            { page =
                { default_page with pg_title = Some t; pg_tags = [ "Topic" ] }
            ; blocks = [] })
         [ "A"; "B"; "C" ])
  in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let w =
    first_window_without_row_hydration db view_id
      (opts [ "view-feature-type", kw "class-objects"
            ; "view-for-id", Wire.Int class_id
            ; "sorting", sorting [ ("block/title", true) ]
            ; "filters",
              filters ~or_:false
                [ clause "block/title" "is" (Wire.Set [ Wire.String "B" ]) ] ])
  in
  check "entity-calls <= 3" (w.entity_calls <= 3);
  check "no get-class-objects" (w.class_object_calls = 0);
  str_list_eq' "titles" (result_titles db w.result) [ "B" ];
  check "count 1" (view_count w.result = 1)

let test_class_objects_title_is_not_and_empty_filter () =
  let conn =
    topic_conn
      (List.map
         (fun t ->
            { page =
                { default_page with pg_title = Some t; pg_tags = [ "Topic" ] }
            ; blocks = [] })
         [ "A"; "B"; "C" ])
  in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let option =
    opts [ "view-feature-type", kw "class-objects"
         ; "view-for-id", Wire.Int class_id
         ; "sorting", sorting [ ("block/title", true) ] ]
  in
  let is_not =
    Db_view.get_view_data db (Some view_id)
      (opt_add option
         [ "filters",
           filters ~or_:false
             [ clause "block/title" "is-not" (Wire.Set [ Wire.String "B" ]) ] ])
  in
  let empty_result =
    Db_view.get_view_data db (Some view_id)
      (opt_add option
         [ "filters",
           filters ~or_:false [ clause "block/title" "is" (kw "empty") ] ])
  in
  str_list_eq' "is-not" (result_titles db is_not) [ "A"; "C" ];
  str_list_eq' "empty" (result_titles db empty_result) []

let test_class_objects_text_contains_and_input () =
  let conn =
    topic_conn
      (List.map
         (fun t ->
            { page =
                { default_page with pg_title = Some t; pg_tags = [ "Topic" ] }
            ; blocks = [] })
         [ "Alpha"; "Alpine"; "Beta" ])
  in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let option =
    opts [ "view-feature-type", kw "class-objects"
         ; "view-for-id", Wire.Int class_id
         ; "sorting", sorting [ ("block/title", true) ] ]
  in
  let contains =
    first_window_without_row_hydration db view_id
      (opt_add option
         [ "filters",
           filters ~or_:false
             [ clause "block/title" "text-contains" (Wire.String "alp") ] ])
  in
  let input =
    first_window_without_row_hydration db view_id
      (opt_add option [ "input", Wire.String "be" ])
  in
  check "contains entity-calls <= 3" (contains.entity_calls <= 3);
  str_list_eq' "contains" (result_titles db contains.result) [ "Alpha"; "Alpine" ];
  check "input entity-calls <= 3" (input.entity_calls <= 3);
  str_list_eq' "input" (result_titles db input.result) [ "Beta" ]

let test_class_objects_number_filter_and_sort () =
  let conn =
    topic_conn ~properties:number_prop
      (List.map
         (fun (t, s) ->
            { page =
                { default_page with
                  pg_title = Some t
                ; pg_tags = [ "Topic" ]
                ; pg_properties = [ "user.property/score", Int s ] }
            ; blocks = [] })
         [ ("A", 2); ("B", 10); ("C", 1); ("D", 7) ])
  in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let option =
    opts [ "view-feature-type", kw "class-objects"
         ; "view-for-id", Wire.Int class_id
         ; "sorting", sorting [ ("user.property/score", true) ] ]
  in
  let gt =
    Db_view.get_view_data db (Some view_id)
      (opt_add option
         [ "filters",
           filters ~or_:false
             [ clause "user.property/score" "number-gt" (Wire.Int 2) ] ])
  in
  let between =
    Db_view.get_view_data db (Some view_id)
      (opt_add option
         [ "filters",
           filters ~or_:false
             [ clause "user.property/score" "between"
                 (Wire.Array [ Wire.Int 2; Wire.Int 7 ]) ] ])
  in
  let w =
    first_window_without_row_hydration db view_id
      (opt_add option
         [ "filters",
           filters ~or_:false
             [ clause "user.property/score" "number-gt" (Wire.Int 2) ]
         ; "row-limit", Wire.Int 1 ])
  in
  str_list_eq' "gt" (result_titles db gt) [ "D"; "B" ];
  str_list_eq' "between" (result_titles db between) [ "A"; "D" ];
  check "window count 2" (view_count w.result = 2);
  str_list_eq' "window" (result_titles db w.result) [ "D" ];
  check "entity-calls <= 3" (w.entity_calls <= 3)

let test_class_objects_or_and_and_filters () =
  let conn =
    topic_conn ~properties:number_prop
      (List.map
         (fun (t, s) ->
            { page =
                { default_page with
                  pg_title = Some t
                ; pg_tags = [ "Topic" ]
                ; pg_properties = [ "user.property/score", Int s ] }
            ; blocks = [] })
         [ ("A", 1); ("B", 5); ("C", 9) ])
  in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let option =
    opts [ "view-feature-type", kw "class-objects"
         ; "view-for-id", Wire.Int class_id
         ; "sorting", sorting [ ("block/title", true) ] ]
  in
  let or_result =
    Db_view.get_view_data db (Some view_id)
      (opt_add option
         [ "filters",
           filters ~or_:true
             [ clause "block/title" "is" (Wire.Set [ Wire.String "A" ])
             ; clause "user.property/score" "number-gt" (Wire.Int 5) ] ])
  in
  let and_result =
    Db_view.get_view_data db (Some view_id)
      (opt_add option
         [ "filters",
           filters ~or_:false
             [ clause "block/title" "text-contains" (Wire.String "B")
             ; clause "user.property/score" "number-gte" (Wire.Int 5) ] ])
  in
  str_list_eq' "or" (result_titles db or_result) [ "A"; "C" ];
  str_list_eq' "and" (result_titles db and_result) [ "B" ]

let test_class_objects_ref_filter_first_window_instant () =
  let pages =
    List.init 80
      (fun idx ->
         { page =
             { default_page with pg_title = Some (Printf.sprintf "Page %d" idx) }
         ; blocks =
             [ { default_block with
                 b_title = Some (Printf.sprintf "Obj %d" idx)
               ; b_tags = [ "Topic" ] } ] })
  in
  let conn = topic_conn pages in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let page_0_uuid = uuid_of (Option.get (find_page_by_title db "Page 0")) in
  let w =
    first_window_without_row_hydration db view_id
      (opts [ "view-feature-type", kw "class-objects"
            ; "view-for-id", Wire.Int class_id
            ; "sorting", sorting [ ("block/title", true) ]
            ; "filters",
              filters ~or_:false
                [ clause "block/page" "is" (Wire.Set [ Wire.Uuid page_0_uuid ]) ] ])
  in
  check "entity-calls <= 5" (w.entity_calls <= 5);
  str_list_eq' "titles" (result_titles db w.result) [ "Obj 0" ];
  check "elapsed < 400ms" (w.elapsed_ms < 400.)

let test_class_objects_combined_sort_filter_input () =
  let pages =
    List.init 120
      (fun idx ->
         { page =
             { default_page with
               pg_title =
                 Some (Printf.sprintf "%s %d"
                         (if idx mod 2 = 0 then "Keep" else "Skip")
                         idx)
             ; pg_tags = [ "Topic" ]
             ; pg_extra = [ "block/updated-at", Int idx ]
             ; pg_properties = [ "user.property/score", Int idx ] }
         ; blocks = [] })
  in
  let conn = topic_conn ~properties:number_prop pages in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let w =
    first_window_without_row_hydration db view_id
      (opts [ "view-feature-type", kw "class-objects"
            ; "view-for-id", Wire.Int class_id
            ; "sorting", sorting [ ("user.property/score", false) ]
            ; "filters",
              filters ~or_:false
                [ clause "user.property/score" "number-gte" (Wire.Int 40) ]
            ; "input", Wire.String "Keep"
            ; "row-limit", Wire.Int 10 ])
  in
  check "entity-calls <= 3" (w.entity_calls <= 3);
  check "count 40" (view_count w.result = 40);
  str_list_eq' "titles"
    (result_titles db w.result)
    (List.map (Printf.sprintf "Keep %d")
       [ 118; 116; 114; 112; 110; 108; 106; 104; 102; 100 ]);
  check "elapsed < 400ms" (w.elapsed_ms < 400.)

let test_class_objects_missing_sort_value_last () =
  let conn =
    topic_conn ~properties:number_prop
      [ { page =
            { default_page with
              pg_title = Some "With score"
            ; pg_tags = [ "Topic" ]
            ; pg_properties = [ "user.property/score", Int 3 ] }
        ; blocks = [] }
      ; { page =
            { default_page with pg_title = Some "Without score"; pg_tags = [ "Topic" ] }
        ; blocks = [] } ]
  in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let result =
    Db_view.get_view_data db (Some view_id)
      (opts [ "view-feature-type", kw "class-objects"
            ; "view-for-id", Wire.Int class_id
            ; "sorting", sorting [ ("user.property/score", false) ] ])
  in
  str_list_eq' "missing sorts last"
    (result_titles db result) [ "With score"; "Without score" ]

let test_class_objects_status_closed_value_sort () =
  let conn =
    topic_conn
      (List.map
         (fun (t, s) ->
            { page =
                { default_page with
                  pg_title = Some t
                ; pg_tags = [ "Topic" ]
                ; pg_properties = [ "logseq.property/status", Kw s ] }
            ; blocks = [] })
         [ ("Doing", "logseq.property/status.doing")
         ; ("Todo", "logseq.property/status.todo")
         ; ("Done", "logseq.property/status.done") ])
  in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let result =
    Db_view.get_view_data db (Some view_id)
      (opts [ "view-feature-type", kw "class-objects"
            ; "view-for-id", Wire.Int class_id
            ; "sorting", sorting [ ("logseq.property/status", true) ] ])
  in
  let orders =
    List.filter_map
      (fun id ->
         match Ldb.ent_of_id db id with
         | Some e ->
             (match Ldb.ref_ent e "logseq.property/status" with
              | Some st ->
                  (match Ldb.value st "block/order" with
                   | Some (String o) -> Some o
                   | _ -> None)
              | None -> None)
         | None -> None)
      (data_ids result)
  in
  check "count 3" (view_count result = 3);
  check "orders sorted" (orders = List.sort String.compare orders);
  check "titles"
    (List.sort_uniq String.compare (result_titles db result)
     = [ "Doing"; "Done"; "Todo" ])

let test_all_pages_title_filter_and_sort () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        (List.map
           (fun (t, ts) ->
              { page =
                  { default_page with
                    pg_title = Some t
                  ; pg_extra = [ "block/updated-at", Int ts ] }
              ; blocks = [] })
           [ ("alpha", 1); ("alpine", 2); ("beta", 3) ])
      ()
  in
  let db = db_of conn in
  let view_id = create_view_id conn "all-pages" in
  let w =
    first_window_without_row_hydration db view_id
      (opts [ "view-feature-type", kw "all-pages"
            ; "sorting", sorting [ ("block/title", false) ]
            ; "filters",
              filters ~or_:false
                [ clause "block/title" "text-contains" (Wire.String "alp") ] ])
  in
  check "entity-calls <= 3" (w.entity_calls <= 3);
  str_list_eq' "titles" (result_titles db w.result) [ "alpine"; "alpha" ]

let test_class_objects_sort_keeps_missing_sort_value () =
  let conn =
    create_conn_with_blocks
      ~classes: [ ("Topic", { default_class with c_title = Some "Topic" }) ]
      ~pages_and_blocks:
        [ { page =
              { default_page with
                pg_title = Some "With timestamp"
              ; pg_tags = [ "Topic" ]
              ; pg_extra = [ "block/updated-at", Int 20 ] }
          ; blocks = [] }
        ; { page =
              { default_page with
                pg_title = Some "Without timestamp"
              ; pg_tags = [ "Topic" ]
              ; pg_extra = [ "block/updated-at", Int 10 ] }
          ; blocks = [] } ]
      ()
  in
  let db = db_of conn in
  let without_ts = Option.get (find_page_by_title db "Without timestamp") in
  let v = Ldb.value without_ts "block/updated-at" in
  ignore
    (Datascript.transact_conn conn
       [ Retract (Entity_id without_ts.id, "block/updated-at", v) ]);
  let db' = db_of conn in
  let class_id = ident_eid db' "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let result =
    Db_view.get_view_data (db_of conn) (Some view_id)
      (opts [ "view-feature-type", kw "class-objects"
            ; "view-for-id", Wire.Int class_id
            ; "sorting", sorting [ ("block/updated-at", false) ] ])
  in
  check "count 2" (view_count result = 2);
  check "titles"
    (List.sort_uniq String.compare (result_titles (db_of conn) result)
     = [ "With timestamp"; "Without timestamp" ])

let test_class_objects_row_offset_keeps_missing_sort_value () =
  let conn =
    create_conn_with_blocks
      ~classes: [ ("Topic", { default_class with c_title = Some "Topic" }) ]
      ~pages_and_blocks:
        [ { page =
              { default_page with
                pg_title = Some "With timestamp 1"
              ; pg_tags = [ "Topic" ]
              ; pg_extra = [ "block/updated-at", Int 10 ] }
          ; blocks = [] }
        ; { page =
              { default_page with
                pg_title = Some "With timestamp 2"
              ; pg_tags = [ "Topic" ]
              ; pg_extra = [ "block/updated-at", Int 20 ] }
          ; blocks = [] }
        ; { page =
              { default_page with
                pg_title = Some "Without timestamp"
              ; pg_tags = [ "Topic" ]
              ; pg_extra = [ "block/updated-at", Int 1 ] }
          ; blocks = [] } ]
      ()
  in
  let db = db_of conn in
  let without_ts = Option.get (find_page_by_title db "Without timestamp") in
  let v = Ldb.value without_ts "block/updated-at" in
  ignore
    (Datascript.transact_conn conn
       [ Retract (Entity_id without_ts.id, "block/updated-at", v) ]);
  let db' = db_of conn in
  let class_id = ident_eid db' "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let option =
    opts [ "view-feature-type", kw "class-objects"
         ; "view-for-id", Wire.Int class_id
         ; "sorting", sorting [ ("block/updated-at", false) ] ]
  in
  let db'' = db_of conn in
  let full = Db_view.get_view_data db'' (Some view_id) option in
  let window =
    Db_view.get_view_data db'' (Some view_id)
      (opt_add option [ "row-limit", Wire.Int 2; "row-offset", Wire.Int 2 ])
  in
  str_list_eq' "full titles"
    (result_titles db'' full)
    [ "With timestamp 2"; "With timestamp 1"; "Without timestamp" ];
  check "window count 3" (view_count window = 3);
  str_list_eq' "window" (result_titles db'' window) [ "Without timestamp" ];
  check "subvec" (subvec (data_ids full) 2 3 = data_ids window)

let test_class_objects_simple_is_filter () =
  let conn =
    create_conn_with_blocks
      ~classes: [ ("Topic", { default_class with c_title = Some "Topic" }) ]
      ~pages_and_blocks:
        (List.map
           (fun t ->
              { page =
                  { default_page with pg_title = Some t; pg_tags = [ "Topic" ] }
              ; blocks = [] })
           [ "A"; "B"; "C" ])
      ()
  in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let result =
    Db_view.get_view_data db (Some view_id)
      (opts [ "view-feature-type", kw "class-objects"
            ; "view-for-id", Wire.Int class_id
            ; "filters",
              filters ~or_:false
                [ clause "block/title" "is" (Wire.Set [ Wire.String "B" ]) ] ])
  in
  check "count 1" (view_count result = 1);
  str_list_eq' "titles" (result_titles db result) [ "B" ]

let test_class_objects_groups_by_title () =
  let conn =
    create_conn_with_blocks
      ~classes: [ ("Topic", { default_class with c_title = Some "Topic" }) ]
      ~pages_and_blocks:
        (List.map
           (fun t ->
              { page =
                  { default_page with pg_title = Some t; pg_tags = [ "Topic" ] }
              ; blocks = [] })
           [ "A"; "B" ])
      ()
  in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  transact_maps conn
    [ op_db_add (Int view_id) "logseq.property.view/group-by-property"
        (Kw "block/title") ];
  let result =
    Db_view.get_view_data (db_of conn) (Some view_id)
      (opts [ "view-feature-type", kw "class-objects"
            ; "view-for-id", Wire.Int class_id ])
  in
  let group_titles =
    List.filter_map
      (fun w ->
         match w with
         | Wire.Array (g :: _) | Wire.List (g :: _) ->
             (match g with
              | Wire.String s -> Some s
              | Wire.Map _ -> wire_string_field "block/title" (match g with Wire.Map kvs -> kvs | _ -> [])
              | _ -> None)
         | _ -> None)
      (data_wire result)
  in
  str_list_eq' "group titles desc" group_titles [ "B"; "A" ]

let test_class_objects_groups_by_many_values () =
  let conn =
    create_conn_with_blocks
      ~classes:
        [ ("Topic", { default_class with c_title = Some "Topic" })
        ; ("SciFi", { default_class with c_title = Some "Sci-Fi" })
        ; ("Drama", { default_class with c_title = Some "Drama" }) ]
      ~pages_and_blocks:
        [ { page =
              { default_page with
                pg_title = Some "Movie A"
              ; pg_tags = [ "Topic"; "SciFi"; "Drama" ] }
          ; blocks = [] }
        ; { page =
              { default_page with
                pg_title = Some "Movie B"
              ; pg_tags = [ "Topic"; "SciFi" ] }
          ; blocks = [] } ]
      ()
  in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  transact_maps conn
    [ op_db_add (Int view_id) "logseq.property.view/group-by-property"
        (Kw "block/tags") ];
  let result =
    Db_view.get_view_data (db_of conn) (Some view_id)
      (opts [ "view-feature-type", kw "class-objects"
            ; "view-for-id", Wire.Int class_id ])
  in
  let group_titles_of w =
    match w with
    | Wire.Array [ g; rows ] | Wire.List [ g; rows ] ->
        let gt =
          match g with
          | Wire.Map kvs -> wire_string_field "block/title" kvs
          | _ -> None
        in
        (match gt with
         | Some t ->
             Some
               ( t
               , List.sort_uniq String.compare
                   (List.filter_map
                      (function
                        | Wire.Int id ->
                            (match Ldb.ent_of_id db id with
                             | Some e ->
                                 (match Ldb.value e "block/title" with
                                  | Some (String s) -> Some s | _ -> None)
                             | None -> None)
                        | _ -> None)
                      (match rows with
                       | Wire.Array rs -> rs
                       | _ -> [])) )
         | None -> None)
    | _ -> None
  in
  let tbl = List.filter_map group_titles_of (data_wire result) in
  let get t = match List.assoc_opt t tbl with Some s -> s | None -> [] in
  check "Sci-Fi group" (get "Sci-Fi" = [ "Movie A"; "Movie B" ]);
  check "Drama group" (get "Drama" = [ "Movie A" ])

let test_all_pages_groups_by_context_tags () =
  let conn =
    create_conn_with_blocks
      ~classes:
        [ ("Topic", { default_class with c_title = Some "Topic" })
        ; ("Project", { default_class with c_title = Some "Project" }) ]
      ~pages_and_blocks:
        [ { page =
              { default_page with pg_title = Some "Alpha"; pg_tags = [ "Topic" ] }
          ; blocks = [] }
        ; { page =
              { default_page with pg_title = Some "Beta"; pg_tags = [ "Topic" ] }
          ; blocks = [] }
        ; { page =
              { default_page with pg_title = Some "Gamma"; pg_tags = [ "Project" ] }
          ; blocks = [] } ]
      ()
  in
  let view_id = create_view_id conn "all-pages" in
  let db = db_of conn in
  let option =
    opts [ "view-feature-type", kw "all-pages"
         ; "group-by-property-ident", kw "block/tags" ]
  in
  let result = Db_view.get_view_data db (Some view_id) option in
  let group_rows w =
    match w with
    | Wire.Array [ g; rows ] | Wire.List [ g; rows ] ->
        let gt =
          match g with Wire.Map kvs -> wire_string_field "block/title" kvs | _ -> None
        in
        (match gt with
         | Some t ->
             Some
               ( t
               , List.sort_uniq String.compare
                   (List.filter_map
                      (function
                        | Wire.Int id ->
                            (match Ldb.ent_of_id db id with
                             | Some e ->
                                 (match Ldb.value e "block/title" with
                                  | Some (String s) -> Some s | _ -> None)
                             | None -> None)
                        | _ -> None)
                      (match rows with Wire.Array rs -> rs | _ -> [])) )
         | None -> None)
    | _ -> None
  in
  let tbl_of r = List.filter_map group_rows (data_wire r) in
  let get tbl t = match List.assoc_opt t tbl with Some s -> s | None -> [] in
  let tbl = tbl_of result in
  check "Topic group" (get tbl "Topic" = [ "Alpha"; "Beta" ]);
  check "Project group" (get tbl "Project" = [ "Gamma" ]);
  let order_of r =
    List.filter_map
      (fun w ->
         match w with
         | Wire.Array (g :: _) | Wire.List (g :: _) ->
             (match g with
              | Wire.Map kvs -> wire_string_field "block/title" kvs
              | _ -> None)
         | _ -> None)
      (data_wire r)
    |> List.filter (fun t -> t = "Project" || t = "Topic")
  in
  str_list_eq' "desc default" (order_of result) [ "Topic"; "Project" ];
  transact_maps conn
    [ op_db_add (Int view_id) "logseq.property.view/sort-groups-desc?"
        (Bool false) ];
  let result2 = Db_view.get_view_data (db_of conn) (Some view_id) option in
  str_list_eq' "asc order" (order_of result2) [ "Project"; "Topic" ]

let test_group_sort_ref_values_readable_keys () =
  let conn =
    create_conn_with_blocks
      ~classes:
        [ ("Topic", { default_class with c_title = Some "Topic" })
        ; ("Project", { default_class with c_title = Some "Project" })
        ; ("Item", { default_class with c_title = Some "Item" }) ]
      ~pages_and_blocks:
        [ { page =
              { default_page with pg_title = Some "Alpha"; pg_tags = [ "Topic" ] }
          ; blocks =
              [ { default_block with
                  b_title = Some "Alpha item"; b_tags = [ "Item" ] } ] }
        ; { page =
              { default_page with pg_title = Some "Beta"; pg_tags = [ "Project" ] }
          ; blocks =
              [ { default_block with
                  b_title = Some "Beta item"; b_tags = [ "Item" ] } ] } ]
      ()
  in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Item" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let page_property = ident_eid db "block/page" in
  let tags_property = ident_eid db "block/tags" in
  transact_maps conn
    [ op_db_add (Int view_id) "logseq.property.view/group-by-property"
        (Int page_property)
    ; op_db_add (Int view_id) "logseq.property.view/sort-groups-by-property"
        (Int tags_property) ];
  let result =
    Db_view.get_view_data (db_of conn) (Some view_id)
      (opts [ "view-feature-type", kw "class-objects"
            ; "view-for-id", Wire.Int class_id ])
  in
  let order =
    List.filter_map
      (fun w ->
         match w with
         | Wire.Array (g :: _) | Wire.List (g :: _) ->
             (match g with
              | Wire.Map kvs -> wire_string_field "block/title" kvs
              | _ -> None)
         | _ -> None)
      (data_wire result)
  in
  str_list_eq' "readable group order" order [ "Alpha"; "Beta" ]

let test_list_view_one_row_shape () =
  let conn =
    create_conn_with_blocks
      ~classes: [ ("Topic", { default_class with c_title = Some "Topic" }) ]
      ~pages_and_blocks:
        [ { page =
              { default_page with
                pg_title = Some "Tagged page"; pg_tags = [ "Topic" ] }
          ; blocks = [] }
        ; { page = { default_page with pg_title = Some "Block page" }
          ; blocks =
              [ { default_block with
                  b_title = Some "Tagged block"; b_tags = [ "Topic" ] } ] } ]
      ()
  in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  transact_maps conn
    [ op_db_add (Int view_id) "logseq.property.view/group-by-property"
        (Kw "block/page")
    ; op_db_add (Int view_id) "logseq.property.view/type"
        (Kw "logseq.property.view/type.list") ];
  let result =
    Db_view.get_view_data (db_of conn) (Some view_id)
      (opts [ "view-feature-type", kw "class-objects"
            ; "view-for-id", Wire.Int class_id ])
  in
  check "count 2" (view_count result = 2);
  check "all partitions are [uuid, map rows]"
    (List.for_all
       (fun w ->
          match w with
          | Wire.Array [ _g; parts ] | Wire.List [ _g; parts ] ->
              (match parts with
               | Wire.Array ps | Wire.List ps ->
                   List.for_all
                     (fun p ->
                        match p with
                        | Wire.Array [ crumb; rows ]
                        | Wire.List [ crumb; rows ] ->
                            (match crumb with
                             | Wire.Uuid _ ->
                                 (match rows with
                                  | Wire.Array rs | Wire.List rs ->
                                      List.for_all
                                        (function Wire.Map _ -> true | _ -> false)
                                        rs
                                  | _ -> false)
                             | _ -> false)
                        | _ -> false)
                     ps
               | _ -> false)
          | _ -> false)
       (data_wire result))

let test_linked_references_no_crash_missing_ident () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Foo" }; blocks = [] }
        ; { page = { default_page with pg_title = Some "Bar" }; blocks = [] } ]
      ()
  in
  let db = db_of conn in
  let foo_id = eid_of_title db "Foo" in
  let bar_id = eid_of_title db "Bar" in
  transact_maps conn [ op_db_add (Int bar_id) "block/refs" (Int foo_id) ];
  let view_id = create_view_id conn ~view_for_id:foo_id "linked-references" in
  let result =
    Db_view.get_view_data (db_of conn) (Some view_id)
      (opts [ "view-feature-type", kw "linked-references"
            ; "view-for-id", Wire.Int foo_id ])
  in
  check "count is int" (view_count result >= 0);
  check "bar in data" (List.mem bar_id (data_ids result))

let test_groups_page_level_linked_references () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Target" }; blocks = [] }
        ; { page = { default_page with pg_title = Some "Referring page" }
          ; blocks = [] } ]
      ()
  in
  let db = db_of conn in
  let target_id = eid_of_title db "Target" in
  let referring = Option.get (find_page_by_title db "Referring page") in
  let referring_uuid = uuid_of referring in
  let view_id = create_view_id conn ~view_for_id:target_id "linked-references" in
  transact_maps conn
    [ op_db_add (Int referring.id) "block/refs" (Int target_id)
    ; op_db_add (Int view_id) "logseq.property.view/type"
        (Kw "logseq.property.view/type.list")
    ; op_db_add (Int view_id) "logseq.property.view/group-by-property"
        (Kw "block/page") ];
  let result =
    Db_view.get_view_data (db_of conn) (Some view_id)
      (opts [ "view-feature-type", kw "linked-references"
            ; "view-for-id", Wire.Int target_id ])
  in
  match data_wire result with
  | [ (Wire.Array [ group; partitions ]) ] | [ (Wire.List [ group; partitions ]) ] ->
      (let guuid =
         match group with
         | Wire.Map kvs ->
             (match List.assoc_opt (kw "block/uuid") kvs with
              | Some (Wire.Uuid u) -> Some u
              | _ -> None)
         | _ -> None
       in
       check "group uuid = referring page uuid" (guuid = Some referring_uuid);
       (match partitions with
        | Wire.Array [ (Wire.Array [ crumb; rows ]) ]
        | Wire.List [ (Wire.List [ crumb; rows ]) ] ->
            check "breadcrumb uuid"
              (crumb = Wire.Uuid referring_uuid);
            (match rows with
             | Wire.Array [ row ] | Wire.List [ row ] ->
                 check "row db/id"
                   (match row with
                    | Wire.Map _ ->
                        Wire.get "db/id" row = Some (Wire.Int referring.id)
                        && Wire.get "block/parent" row = Some Wire.Nil
                    | _ -> false)
             | _ -> check "one row" false)
        | _ -> check "one partition" false))
  | _ -> check "single group" false

let test_class_objects_ref_filter_fast_path () =
  let conn =
    create_conn_with_blocks
      ~classes: [ ("Topic", { default_class with c_title = Some "Topic" }) ]
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Page A" }
          ; blocks =
              [ { default_block with
                  b_title = Some "Obj A"; b_tags = [ "Topic" ] } ] }
        ; { page = { default_page with pg_title = Some "Page B" }
          ; blocks =
              [ { default_block with
                  b_title = Some "Obj B"; b_tags = [ "Topic" ] } ] } ]
      ()
  in
  let db = db_of conn in
  let obj_a_id = (Option.get (find_page_by_title db "Obj A")).id in
  let obj_b_id = (Option.get (find_page_by_title db "Obj B")).id in
  let page_a_uuid =
    uuid_of (Option.get (find_page_by_title db "Page A"))
  in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  let is_result =
    Db_view.get_view_data db (Some view_id)
      (opts [ "view-feature-type", kw "class-objects"
            ; "view-for-id", Wire.Int class_id
            ; "filters",
              filters ~or_:false
                [ clause "block/page" "is" (Wire.Set [ Wire.Uuid page_a_uuid ]) ] ])
  in
  let is_not_result =
    Db_view.get_view_data db (Some view_id)
      (opts [ "view-feature-type", kw "class-objects"
            ; "view-for-id", Wire.Int class_id
            ; "filters",
              filters ~or_:false
                [ clause "block/page" "is-not" (Wire.Set [ Wire.Uuid page_a_uuid ]) ] ])
  in
  str_list_eq' "is titles" (result_titles db is_result) [ "Obj A" ];
  str_list_eq' "is-not titles" (result_titles db is_not_result) [ "Obj B" ];
  int_list_eq "is ids" (wire_set_of_ids (data_ids is_result)) [ obj_a_id ];
  int_list_eq "is-not ids" (wire_set_of_ids (data_ids is_not_result)) [ obj_b_id ]

let test_class_objects_groups_by_number_sorts_numerically () =
  let conn =
    create_conn_with_blocks
      ~classes: [ ("Topic", { default_class with c_title = Some "Topic" }) ]
      ~properties: number_prop
      ~pages_and_blocks:
        (List.map
           (fun (t, s) ->
              { page =
                  { default_page with
                    pg_title = Some t
                  ; pg_tags = [ "Topic" ]
                  ; pg_properties = [ "user.property/score", Int s ] }
              ; blocks = [] })
           [ ("A", 2); ("B", 10); ("C", 1) ])
      ()
  in
  let db = db_of conn in
  let class_id = ident_eid db "user.class/Topic" in
  let view_id = create_view_id conn ~view_for_id:class_id "class-objects" in
  transact_maps conn
    [ op_db_add (Int view_id) "logseq.property.view/group-by-property"
        (Kw "user.property/score") ];
  let opt =
    opts [ "view-feature-type", kw "class-objects"
         ; "view-for-id", Wire.Int class_id ]
  in
  let num_of w =
    match w with
    | Wire.Int n -> Some n
    | Wire.Float f -> Some (int_of_float f)
    | Wire.Map kvs ->
        (match wire_string_field "logseq.property/value" kvs with
         | Some s -> (try Some (int_of_string s) with _ -> None)
         | None -> None)
    | _ -> None
  in
  let groups r =
    List.filter_map
      (fun w ->
         match w with
         | Wire.Array (g :: _) | Wire.List (g :: _) -> num_of g
         | _ -> None)
      (data_wire r)
  in
  let desc_groups = groups (Db_view.get_view_data (db_of conn) (Some view_id) opt) in
  transact_maps conn
    [ op_db_add (Int view_id) "logseq.property.view/sort-groups-desc?"
        (Bool false) ];
  let asc_groups =
    groups (Db_view.get_view_data (db_of conn) (Some view_id) opt)
  in
  int_list_eq "desc numeric" desc_groups [ 10; 2; 1 ];
  int_list_eq "asc numeric" asc_groups [ 1; 2; 10 ]

(* ---------- suite ---------- *)

let () =
  Alcotest.run "db_view"
    [ ( "view_test"
      , [ Alcotest.test_case
            "get-view-data-journals-returns-ordered-compact-index-test" `Quick
            test_journals_ordered_compact_index
        ; Alcotest.test_case
            "get-view-data-all-pages-sorts-and-filters-hidden-test" `Quick
            test_all_pages_sorts_and_filters_hidden
        ; Alcotest.test_case
            "journal-window-excludes-future-journals-with-aliases-test" `Quick
            test_journal_window_excludes_future_with_aliases
        ; Alcotest.test_case
            "small-class-window-does-not-scan-unrelated-sort-values-test"
            `Quick test_small_class_window_no_unrelated_scan
        ; Alcotest.test_case "get-view-data-all-pages-title-sort-test" `Quick
            test_all_pages_title_sort
        ; Alcotest.test_case
            "get-view-data-all-pages-row-limit-keeps-full-count-test" `Quick
            test_all_pages_row_limit_keeps_full_count
        ; Alcotest.test_case
            "get-view-data-class-objects-row-limit-keeps-full-count-test"
            `Quick test_class_objects_row_limit_keeps_full_count
        ; Alcotest.test_case
            "get-view-data-all-pages-row-offset-returns-the-scrolled-window-test"
            `Quick test_all_pages_row_offset_scrolled_window
        ; Alcotest.test_case
            "get-view-data-class-objects-row-offset-returns-the-scrolled-window-test"
            `Quick test_class_objects_row_offset_scrolled_window
        ; Alcotest.test_case
            "get-view-data-class-objects-id-path-stays-bounded-with-many-rows-test"
            `Quick test_class_objects_id_path_bounded_many_rows
        ; Alcotest.test_case
            "get-view-data-class-objects-first-window-is-instant-test" `Quick
            test_class_objects_first_window_instant
        ; Alcotest.test_case
            "get-view-data-all-pages-first-window-count-matches-hidden-filter-test"
            `Quick test_all_pages_first_window_count_hidden_filter
        ; Alcotest.test_case
            "get-view-data-all-pages-count-drops-after-delete-test" `Quick
            test_all_pages_count_drops_after_delete
        ; Alcotest.test_case
            "get-view-data-all-pages-filter-count-matches-rows-test" `Quick
            test_all_pages_filter_count_matches_rows
        ; Alcotest.test_case
            "get-view-data-all-pages-first-window-is-instant-test" `Quick
            test_all_pages_first_window_instant
        ; Alcotest.test_case
            "get-view-data-class-objects-small-set-sorts-the-eids-test" `Quick
            test_class_objects_small_set_sorts_eids
        ; Alcotest.test_case
            "get-view-data-all-pages-first-window-does-not-sort-every-page-test"
            `Quick test_all_pages_first_window_no_full_sort
        ; Alcotest.test_case
            "get-view-data-class-objects-first-window-filters-hidden-objects-test"
            `Quick test_class_objects_first_window_filters_hidden
        ; Alcotest.test_case
            "get-view-data-class-objects-number-property-sort-test" `Quick
            test_class_objects_number_property_sort
        ; Alcotest.test_case
            "get-view-data-class-objects-number-sort-first-window-is-instant-test"
            `Quick test_class_objects_number_sort_first_window_instant
        ; Alcotest.test_case
            "get-view-data-class-objects-title-is-filter-uses-id-path-test"
            `Quick test_class_objects_title_is_filter_id_path
        ; Alcotest.test_case
            "get-view-data-class-objects-title-is-not-and-empty-filter-test"
            `Quick test_class_objects_title_is_not_and_empty_filter
        ; Alcotest.test_case
            "get-view-data-class-objects-text-contains-and-input-filter-test"
            `Quick test_class_objects_text_contains_and_input
        ; Alcotest.test_case
            "get-view-data-class-objects-number-filter-and-sort-test" `Quick
            test_class_objects_number_filter_and_sort
        ; Alcotest.test_case
            "get-view-data-class-objects-or-and-and-filters-test" `Quick
            test_class_objects_or_and_and_filters
        ; Alcotest.test_case
            "get-view-data-class-objects-ref-filter-first-window-is-instant-test"
            `Quick test_class_objects_ref_filter_first_window_instant
        ; Alcotest.test_case
            "get-view-data-class-objects-combined-sort-filter-input-first-window-test"
            `Quick test_class_objects_combined_sort_filter_input
        ; Alcotest.test_case
            "get-view-data-class-objects-missing-custom-sort-value-stays-last-test"
            `Quick test_class_objects_missing_sort_value_last
        ; Alcotest.test_case
            "get-view-data-class-objects-status-closed-value-sort-test" `Quick
            test_class_objects_status_closed_value_sort
        ; Alcotest.test_case
            "get-view-data-all-pages-title-filter-and-sort-test" `Quick
            test_all_pages_title_filter_and_sort
        ; Alcotest.test_case
            "get-view-data-class-objects-sort-keeps-rows-with-missing-sort-value-test"
            `Quick test_class_objects_sort_keeps_missing_sort_value
        ; Alcotest.test_case
            "get-view-data-class-objects-row-offset-keeps-missing-sort-value-test"
            `Quick test_class_objects_row_offset_keeps_missing_sort_value
        ; Alcotest.test_case
            "get-view-data-class-objects-simple-is-filter-test" `Quick
            test_class_objects_simple_is_filter
        ; Alcotest.test_case
            "get-view-data-class-objects-groups-by-title-test" `Quick
            test_class_objects_groups_by_title
        ; Alcotest.test_case
            "get-view-data-class-objects-groups-by-many-values-test" `Quick
            test_class_objects_groups_by_many_values
        ; Alcotest.test_case
            "get-view-data-all-pages-groups-by-context-tags-test" `Quick
            test_all_pages_groups_by_context_tags
        ; Alcotest.test_case
            "get-view-data-group-sort-ref-values-use-readable-keys-test"
            `Quick test_group_sort_ref_values_readable_keys
        ; Alcotest.test_case
            "get-view-data-list-view-keeps-one-row-shape-for-pages-and-blocks-test"
            `Quick test_list_view_one_row_shape
        ; Alcotest.test_case
            "get-view-data-linked-references-page-view-does-not-crash-on-missing-db-ident-test"
            `Quick test_linked_references_no_crash_missing_ident
        ; Alcotest.test_case
            "get-view-data-groups-page-level-linked-references-under-the-referring-page-test"
            `Quick test_groups_page_level_linked_references
        ; Alcotest.test_case
            "get-view-data-class-objects-ref-filter-fast-path-test" `Quick
            test_class_objects_ref_filter_fast_path
        ; Alcotest.test_case
            "get-view-data-class-objects-groups-by-number-property-sorts-numerically-test"
            `Quick test_class_objects_groups_by_number_sorts_numerically ] ) ]
