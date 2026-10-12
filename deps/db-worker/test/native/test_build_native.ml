(* 1:1 translations of cljs unit tests exercising the sqlite build pipeline
   (logseq.db.sqlite.build).

   Source: deps/db/test/logseq/db/sqlite/build_test.cljs — all 12 deftests
   ported (the file contains 12 deftests, not 13).

   cljs deftest names are kept as OCaml test names.

   Helper mapping:
   - db-test/create-conn -> Sqlite_export.create_conn ()
   - db-test/create-conn-with-blocks -> create-conn + Sqlite_build.create_blocks
   - db-test/create-conn-with-import-map -> create-conn +
     Sqlite_export.build_import + Db_tx.transact
   - db-test/readable-properties -> readable_properties below
   - db-test/find-block-by-content (regex variant) ->
     find_block_by_content_re below (re-find over :block/title)

   cljs-vs-OCaml notes (no divergences in asserted behavior):
   - cljs d/transact! of EDN tx maps becomes Sqlite_build.tx_ops_of_values +
     Db_tx.transact — the same path Sqlite_build.create_blocks uses.
   - cljs.reader parses #uuid "..." literals into UUID values; the OCaml EDN
     parser surfaces them as Tuple tags, so read_edn normalizes them to Uuid
     before feeding build options (matching cljs reader semantics).
   - cljs readable-properties returns keywords/strings; the OCaml version
     normalizes both to plain strings (idents lose their leading ':').
   - thrown-with-msg? js/Error becomes Sqlite_build.Build_error. *)

open Datascript
open Test_shared

(* ---------- shared helpers ---------- *)

(* cljs.reader resolves #uuid "..." to a UUID; normalize the EDN parser's
   Tagged->Tuple representation back to Uuid so build options see real
   uuid values. *)
let rec resolve_uuid_tags (v : value) : value =
  match v with
  | Tuple [ Some (Symbol "uuid"); Some (String s) ] -> Uuid s
  | Map kvs -> Map (List.map (fun (k, x) -> k, resolve_uuid_tags x) kvs)
  | Vector xs -> Vector (List.map resolve_uuid_tags xs)
  | List xs -> List (List.map resolve_uuid_tags xs)
  | Set xs -> Set (List.map resolve_uuid_tags xs)
  | x -> x

let read_edn (s : string) : value = resolve_uuid_tags (Edn_util.read_string s)

let create_conn () : conn = Sqlite_export.create_conn ()

(* db-test/create-conn-with-blocks *)
let create_conn_with_blocks (options_v : value) : conn =
  let conn = create_conn () in
  Sqlite_build.create_blocks conn options_v;
  conn

(* db-test/create-conn-with-import-map *)
let create_conn_with_import_map (export_v : value) : conn =
  let conn = create_conn () in
  (match Sqlite_export.build_import export_v (db_of conn) None with
   | Ok (txs : Sqlite_export.import_txs) ->
       ignore
         (Db_tx.transact conn
            (Sqlite_build.tx_ops_of_values (db_of conn)
               (Sqlite_export.import_tx_data txs)))
   | Error msg -> failwith msg);
  conn

(* d/transact! over built EDN tx items *)
let transact_values (conn : conn) (txs : value list) : unit =
  ignore (Db_tx.transact conn (Sqlite_build.tx_ops_of_values (db_of conn) txs))

(* db-test/find-block-by-content, regex variant *)
let find_block_by_content_re (db : db) (pat : string) : entity option =
  match
    Datascript.q_string
      ~inputs:[ Arg_scalar (Result_value (Regex pat)) ]
      db
      "[:find [?b ...] :in $ ?pattern :where [?b :block/title ?content] [?b :block/page] [(re-find ?pattern ?content)]]"
  with
  | (Result_entity id :: _) :: _ -> Ldb.ent_of_id db id
  | (Result_value (Int64 id) :: _) :: _ -> (
      match Datascript.Util.int64_to_int id with
      | Some id -> Ldb.ent_of_id db id
      | None -> None)
  | _ -> None

(* ---------- db-test/readable-properties ----------

   Returns an entity's properties and tags in readable form for assertions;
   tags are included since they behave like properties on an ent. Values are
   normalized to plain strings so cljs keyword/string comparisons carry over:
   entities -> :db/ident or property-value-content; sets of entities ->
   sorted list of contents; raw scalars -> printed form. *)
type readable_value =
  | Rv_scalar of string
  | Rv_list of string list

let scalar_string (v : value) : string =
  match v with
  | Keyword s -> s
  | String s -> s
  | Int64 n -> Int64.to_string n
  | Float f -> string_of_float f
  | Bool b -> string_of_bool b
  | Uuid u -> u
  | Symbol s -> s
  | _ -> Edn_util.pr_str v

let readable_properties (e : entity) : (string * readable_value) list =
  let db = e.db in
  let ent_of_value (v : value) : entity option =
    match v with
    | Ref n -> Ldb.ent_of_id db n
    | Int64 n -> Option.bind (Datascript.Util.int64_to_int n) (Ldb.ent_of_id db)
    | Ref_to r -> Datascript.entity db r
    | _ -> None
  in
  let ident_or_content (v : value) : string =
    match ent_of_value v with
    | Some ent ->
        (match Ldb.ident_of ent with
         | Some i -> i
         | None -> Option.value ~default:"" (Ldb.property_value_content ent))
    | None -> scalar_string v
  in
  List.filter_map
    (fun (k, tv) ->
      if List.mem k [ "block/tags"; "logseq.property.class/extends" ] then
        Some
          ( k
          , Rv_list
              (match tv with
               | Many_values vs -> List.map ident_or_content vs
               | One_value v -> [ ident_or_content v ]
               | _ -> []) )
      else
        match tv with
        | Many_values vs when List.for_all (fun v -> ent_of_value v <> None) vs ->
            Some
              ( k
              , Rv_list
                  (List.sort String.compare
                     (List.map ident_or_content vs)) )
        | Many_values vs ->
            Some (k, Rv_list (List.map scalar_string vs))
        | One_value v -> Some (k, Rv_scalar (ident_or_content v))
        | _ -> None)
    (Db_property.properties_of_entity e)
  |> List.sort (fun (a, _) (b, _) -> String.compare a b)

let dissoc (k : string) (m : (string * 'a) list) : (string * 'a) list =
  List.filter (fun (k', _) -> k' <> k) m

let show_rv (v : readable_value) : string =
  match v with
  | Rv_scalar s -> s
  | Rv_list ss -> "[" ^ String.concat "," ss ^ "]"

let check_readable (name : string)
    (expected : (string * readable_value) list)
    (actual : (string * readable_value) list) : unit =
  let show m =
    "{"
    ^ String.concat ", "
        (List.map (fun (k, v) -> k ^ " " ^ show_rv v) m)
    ^ "}"
  in
  if expected = actual then ()
  else Alcotest.failf "%s: expected %s got %s" name (show expected) (show actual)

(* ---------- tx item accessors (assertions over built EDN tx data) ---------- *)

let tx_attr (v : value) (k : string) : value option =
  match v with
  | Map kvs -> List.assoc_opt (Keyword k) kvs
  | _ -> None

let find_tx_ident (ident : string) (txs : value list) : value option =
  List.find_opt
    (fun v ->
      match tx_attr v "db/ident" with
      | Some (Keyword s) -> s = ident
      | _ -> false)
    txs

let coll_items (v : value) : value list =
  match v with
  | Vector xs | List xs | Set xs -> xs
  | _ -> []

(* ---------- helpers over entities ---------- *)

let tag_idents (e : entity) : string list =
  List.filter_map Ldb.ident_of (Ldb.ref_ents e "block/tags")

let property_content (e : entity) (a : attr) : string option =
  match Ldb.ref_ent e a with
  | Some v -> Ldb.property_value_content v
  | None -> None

let str_contains (haystack : string) (needle : string) : bool =
  let hl = String.length haystack and nl = String.length needle in
  let rec go i =
    if i + nl > hl then false
    else if String.sub haystack i nl = needle then true
    else go (i + 1)
  in
  go 0

let expect_cycle_error (name : string) (options_v : value) : unit =
  match Sqlite_build.build_blocks_tx options_v with
  | _ -> check name false
  | exception Sqlite_build.Build_error msg ->
      check name (str_contains msg "Cycle detected in :build/class-extends")

(* ---------- deftests ---------- *)

(* (deftest build-tags ...) *)
let test_build_tags () =
  let options_v =
    read_edn
      "[{:page {:block/title \"page1\"}
         :blocks [{:block/title \"Jrue Holiday\" :build/tags [:Person]}
                  {:block/title \"some task\" :build/tags [:logseq.class/Task]}]}
        {:page {:block/title \"Jayson Tatum\" :build/tags [:Person]}}]"
  in
  let conn = create_conn () in
  Sqlite_build.create_blocks conn options_v;
  let db = db_of conn in
  let block_tags t =
    match Db_test_util.find_block_by_content db t with
    | Some b -> tag_idents b
    | None -> []
  in
  check
    "Person class is created and correctly associated to a block"
    (block_tags "Jrue Holiday" = [ "user.class/Person" ]);
  check
    "Person class is created and correctly associated to a page"
    (match Db_test_util.find_page_by_title db "Jayson Tatum" with
     | Some p -> List.mem "user.class/Person" (tag_idents p)
     | None -> false);
  check
    "Built-in class is associatedly correctly"
    (block_tags "some task" = [ "logseq.class/Task" ])

(* (deftest build-properties-user ...) *)
let test_build_properties_user () =
  let conn =
    create_conn_with_blocks
      (read_edn
         "[{:page {:block/title \"page1\"}
            :blocks [{:block/title \"Jrue Holiday\" :build/properties {:description \"Clutch defense\"}}]}
           {:page {:block/title \"Jayson Tatum\" :build/properties {:description \"Awesome selfless basketball\"}}}]")
  in
  let db = db_of conn in
  check
    "description property is created and correctly associated to a block"
    (match Db_test_util.find_block_by_content db "Jrue Holiday" with
     | Some b -> property_content b "user.property/description" = Some "Clutch defense"
     | None -> false);
  check
    "description property is created and correctly associated to a page"
    (match Db_test_util.find_page_by_title db "Jayson Tatum" with
     | Some p ->
         property_content p "user.property/description"
         = Some "Awesome selfless basketball"
     | None -> false)

(* (deftest build-properties-built-in ...) *)
let test_build_properties_built_in () =
  let conn =
    create_conn_with_blocks
      (read_edn
         "[{:page {:block/title \"page1\"}
            :blocks [{:block/title \"some todo\"
                      :build/properties {:logseq.property/status :logseq.property/status.doing}}
                     {:block/title \"rojo\"
                      :build/properties {:logseq.property/background-color \"red\"}}]}]")
  in
  let db = db_of conn in
  check
    "built-in property with closed value is created and correctly associated to a block"
    (match Db_test_util.find_block_by_content db "some todo" with
     | Some b ->
         (match Ldb.ref_ent b "logseq.property/status" with
          | Some v -> Ldb.ident_of v = Some "logseq.property/status.doing"
          | None -> false)
     | None -> false);
  check
    "built-in :default property is created and correctly associated to a block"
    (match Db_test_util.find_block_by_content db "rojo" with
     | Some b ->
         property_content b "logseq.property/background-color" = Some "red"
     | None -> false)

(* (deftest build-properties-with-build-page ...) *)
let test_build_properties_with_build_page () =
  let options_v =
    Map
      [ ( Keyword "pages-and-blocks"
        , read_edn
            "[{:page {:block/title \"page1\"
                   :build/properties
                   {:date [:build/page {:build/journal 20250223}]
                    :page #{[:build/page {:block/title \"page object\"
                                          :build/properties {:p1 \"foo\"
                                                             :date [:build/page {:build/journal 20250224}]}}]}}}}]" )
      ; (Keyword "auto-create-ontology?", Bool true) ]
  in
  let conn = create_conn_with_blocks options_v in
  let db = db_of conn in
  (match Db_test_util.find_page_by_title db "page object" with
   | Some p ->
       check ":build/page page can have a :default property"
         (property_content p "user.property/p1" = Some "foo");
       check ":build/page page can have a :date property defined by another :build/page"
         (match Ldb.ref_ent p "user.property/date" with
          | Some j -> Ldb.int_value j "block/journal-day" = Some 20250224
          | None -> false)
   | None ->
       check ":build/page page can have a :default property" false;
       check ":build/page page can have a :date property defined by another :build/page" false)

(* (deftest build-for-existing-blocks ...) *)
let test_build_for_existing_blocks () =
  let conn = create_conn () in
  Sqlite_build.create_blocks conn
    (read_edn
       "{:properties {:p1 {}}
         :classes {:MyClass {}}
         :pages-and-blocks
         [{:page {:block/title \"page1\"}
           :blocks [{:block/title \"block 1\"}
                    {:block/title \"block 2\"}]}]}");
  let db0 = db_of conn in
  let block = Option.get (Db_test_util.find_block_by_content db0 "block 1") in
  let block2 = Option.get (Db_test_util.find_block_by_content db0 "block 2") in
  let page1 = Option.get (Db_test_util.find_page_by_title db0 "page1") in
  let built_in_page = Option.get (Db_test_util.find_page_by_title db0 "Quick add") in
  (* (select-keys (:block/page block) [:block/uuid]) *)
  let page_uuid_map (b : entity) : value =
    match Ldb.ref_ent b "block/page" with
    | Some p -> Map [ Keyword "block/uuid", Uuid (uuid_of p) ]
    | None -> Map []
  in
  let init_tx, block_props_tx =
    Sqlite_build.build_blocks_tx
      (Map
         [ ( Keyword "pages-and-blocks"
           , Vector
               [ Map
                   [ ( Keyword "page"
                     , Map
                         [ Keyword "block/uuid", Uuid (uuid_of built_in_page)
                         ; Keyword "build/keep-uuid?", Bool true
                         ; ( Keyword "build/properties"
                           , Map
                               [ ( Keyword "logseq.property/description"
                                 , String "foo" ) ] )
                         ; Keyword "block/title", String "Quick add" ] )
                   ; Keyword "blocks", Vector [] ]
               ; Map
                   [ Keyword "page", page_uuid_map block
                   ; ( Keyword "blocks"
                     , Vector
                         [ Map
                             [ Keyword "block/title"
                             , String "imported task"
                             ; Keyword "block/uuid", Uuid (uuid_of block)
                             ; ( Keyword "build/properties"
                               , Map
                                   [ ( Keyword "logseq.property/status"
                                     , Keyword "logseq.property/status.todo" )
                                   ] )
                             ; ( Keyword "build/tags"
                               , Vector [ Keyword "logseq.class/Task" ] ) ] ] )
                   ] ] )
         ; Keyword "build-existing-tx?", Bool true ])
  in
  transact_values conn init_tx;
  transact_values conn block_props_tx;
  let db1 = db_of conn in
  let updated_block = Option.get (entity_at_uuid db1 (uuid_of block)) in
  (* second build: existing user property + class *)
  let p1 = Option.get (Datascript.entity db1 (Ident "user.property/p1")) in
  let p1_type = Option.get (Ldb.value p1 "logseq.property/type") in
  let init_tx2, block_props_tx2 =
    Sqlite_build.build_blocks_tx
      (Map
         [ ( Keyword "pages-and-blocks"
           , Vector
               [ Map
                   [ Keyword "page", page_uuid_map block2
                   ; ( Keyword "blocks"
                     , Vector
                         [ Map
                             [ Keyword "block/title"
                             , String "imported block"
                             ; Keyword "block/uuid", Uuid (uuid_of block2)
                             ; ( Keyword "build/properties"
                               , Map
                                   [ Keyword "user.property/p1"
                                   , String "foo" ] )
                             ; ( Keyword "build/tags"
                               , Vector [ Keyword "user.class/MyClass" ] ) ] ] )
                   ] ] )
         ; ( Keyword "properties"
           , Map
               [ ( Keyword "user.property/p1"
                 , Map
                     [ Keyword "logseq.property/type", p1_type
                     ; Keyword "block/uuid", Uuid (uuid_of p1) ] ) ] )
         ; Keyword "build-existing-tx?", Bool true ])
  in
  transact_values conn init_tx2;
  transact_values conn block_props_tx2;
  let db = db_of conn in
  let updated_block2 = Option.get (entity_at_uuid db (uuid_of block2)) in
  (* testing "existing page cases" *)
  check "Existing page with no property changes didn't get updated"
    (Ldb.int_value page1 "block/updated-at"
     = Ldb.int_value
         (Option.get (Db_test_util.find_page_by_title db "page1"))
         "block/updated-at");
  check "Existing page with property changes does get updated"
    (Ldb.int_value built_in_page "block/updated-at"
     <> Ldb.int_value
          (Option.get (Db_test_util.find_page_by_title db "Quick add"))
          "block/updated-at");
  (* testing "block with built-in properties and tags" *)
  let stray =
    List.filter
      (fun v ->
        (match tx_attr v "block/uuid" with
         | Some (Uuid u) -> u <> uuid_of built_in_page
         | _ -> true)
        && (tx_attr v "db/id" <> None || tx_attr v "db/ident" <> None))
      (init_tx @ block_props_tx)
  in
  check "Tx doesn't try to create new blocks or modify existing idents"
    (stray = []);
  check "updated-block title" (ent_title updated_block = Some "imported task");
  check_readable "Block's properties and tags are updated"
    [ "block/tags", Rv_list [ "logseq.class/Task" ]
    ; "logseq.property/status", Rv_scalar "logseq.property/status.todo" ]
    (readable_properties updated_block);
  (* testing "block with existing user properties and tags" *)
  check "updated-block2 title"
    (ent_title updated_block2 = Some "imported block");
  check_readable "Block's properties and tags are updated (2)"
    [ "block/tags", Rv_list [ "user.class/MyClass" ]
    ; "user.property/p1", Rv_scalar "foo" ]
    (readable_properties updated_block2)

(* (deftest build-blocks-with-refs ...) *)
let test_build_blocks_with_refs () =
  let block_uuid = Common_uuid.new_block_id () in
  let class_uuid = Common_uuid.new_block_id () in
  let page_uuid = Common_uuid.new_block_id () in
  let property_uuid = Common_uuid.new_block_id () in
  let page_ref u = Page_ref.to_page_ref u in
  let conn =
    create_conn_with_blocks
      (Map
         [ ( Keyword "classes"
           , Map
               [ ( Keyword "C1"
                 , Map
                     [ Keyword "block/uuid", Uuid class_uuid
                     ; Keyword "build/keep-uuid?", Bool true ] ) ] )
         ; ( Keyword "properties"
           , Map
               [ ( Keyword "p1"
                 , Map
                     [ Keyword "block/uuid", Uuid property_uuid
                     ; Keyword "build/keep-uuid?", Bool true ] ) ] )
         ; Keyword "build-existing-tx?", Bool true
         ; ( Keyword "pages-and-blocks"
           , Vector
               [ Map
                   [ Keyword "page", Map [ Keyword "block/title", String "page 1" ]
                   ; ( Keyword "blocks"
                     , Vector
                         [ Map
                             [ ( Keyword "block/title"
                               , String "named page ref to [[named page]]" ) ]
                         ; Map
                             [ ( Keyword "block/title"
                               , String ("page ref to " ^ page_ref page_uuid) ) ]
                         ; Map
                             [ ( Keyword "block/title"
                               , String ("block ref to " ^ page_ref block_uuid) ) ]
                         ; Map
                             [ ( Keyword "block/title"
                               , String ("class ref to " ^ page_ref class_uuid) ) ]
                         ; Map
                             [ ( Keyword "block/title"
                               , String ("inline class ref to #" ^ page_ref class_uuid) ) ]
                         ; Map
                             [ ( Keyword "block/title"
                               , String ("property ref to " ^ page_ref property_uuid) ) ]
                         ; Map
                             [ Keyword "block/title", String "hi"
                             ; Keyword "block/uuid", Uuid block_uuid
                             ; Keyword "build/keep-uuid?", Bool true ] ] ) ]
               ; Map
                   [ ( Keyword "page"
                     , Map
                         [ Keyword "block/title", String "another page"
                         ; Keyword "block/uuid", Uuid page_uuid
                         ; Keyword "build/keep-uuid?", Bool true ] ) ] ] ) ] )
  in
  let db = db_of conn in
  let named_page = Db_test_util.find_page_by_title db "named page" in
  let another_page = Db_test_util.find_page_by_title db "another page" in
  let c1 = ident_ent_exn db "user.class/C1" in
  let p1 = ident_ent_exn db "user.property/p1" in
  let hi_block = Db_test_util.find_block_by_content db "hi" in
  let refs_contain (target : entity) (b : entity option) : bool =
    match b with
    | Some b -> List.exists (fun r -> r.id = target.id) (Ldb.ref_ents b "block/refs")
    | None -> false
  in
  check "named page is internal"
    (match named_page with Some p -> Ldb.internal_page p | None -> false);
  check "named page ref"
    (match named_page with
     | Some p -> refs_contain p (find_block_by_content_re db "^named page ref")
     | None -> false);
  check "another page uuid kept"
    (match another_page with
     | Some p -> uuid_of p = page_uuid
     | None -> false);
  check "page ref"
    (match another_page with
     | Some p -> refs_contain p (find_block_by_content_re db "^page ref")
     | None -> false);
  check "class uuid kept" (uuid_of c1 = class_uuid);
  check "class ref"
    (refs_contain c1 (find_block_by_content_re db "^class ref"));
  check "inline class ref"
    (refs_contain c1 (find_block_by_content_re db "^inline class ref"));
  check "property uuid kept" (uuid_of p1 = property_uuid);
  check "property ref"
    (refs_contain p1 (find_block_by_content_re db "^property ref"));
  check "block uuid kept"
    (match hi_block with
     | Some b -> uuid_of b = block_uuid
     | None -> false);
  check "block ref"
    (match hi_block with
     | Some b -> refs_contain b (find_block_by_content_re db "^block ref")
     | None -> false)

(* (deftest build-class-page-name-from-title ...) *)
let test_build_class_page_name_from_title () =
  (* testing "user tag with a random ident suffix is named from its title" *)
  let conn =
    create_conn_with_blocks
      (read_edn
         "{:classes {:user.class/warning-A04sq4Ln {:block/title \"warning\"}}}")
  in
  let tag = ident_ent_exn (db_of conn) "user.class/warning-A04sq4Ln" in
  check "tag title" (ent_title tag = Some "warning");
  check "Tag page :block/name matches the title, not the ident suffix"
    (Ldb.string_value tag "block/name" = Some "warning");
  (* testing "graph-human import uses the title for the tag page name" *)
  let conn =
    create_conn_with_import_map
      (read_edn
         "{:logseq.db.sqlite.export/export-type :graph-human
           :classes {:user.class/cite-X7ab12Cd {:block/title \"cite\"}}
           :pages-and-blocks
           [{:page {:block/title \"page1\"}
             :blocks [{:block/title \"some text\"
                       :build/tags #{:user.class/cite-X7ab12Cd}}]}]}")
  in
  let tag = ident_ent_exn (db_of conn) "user.class/cite-X7ab12Cd" in
  check "imported tag title" (ent_title tag = Some "cite");
  check "Imported tag page is named from its title, not the ident suffix"
    (Ldb.string_value tag "block/name" = Some "cite")

(* (deftest build-class-and-property-pages ...) *)
let test_build_class_and_property_pages () =
  let class_uuid = Common_uuid.new_block_id () in
  let property_uuid = Common_uuid.new_block_id () in
  let conn =
    create_conn_with_blocks
      (Map
         [ ( Keyword "classes"
           , Map
               [ ( Keyword "C1"
                 , Map
                     [ Keyword "block/uuid", Uuid class_uuid
                     ; Keyword "build/keep-uuid?", Bool true ] ) ] )
         ; ( Keyword "properties"
           , Map
               [ ( Keyword "p1"
                 , Map
                     [ Keyword "block/uuid", Uuid property_uuid
                     ; Keyword "build/keep-uuid?", Bool true ] ) ] )
         ; ( Keyword "pages-and-blocks"
           , Vector
               [ Map
                   [ Keyword "page"
                   , Map [ Keyword "block/uuid", Uuid class_uuid ]
                   ; ( Keyword "blocks"
                     , Vector
                         [ Map
                             [ Keyword "block/title", String "b1"
                             ; ( Keyword "build/children"
                               , Vector
                                   [ Map
                                       [ Keyword "block/title"
                                       , String "b2" ] ] ) ] ] ) ]
               ; Map
                   [ Keyword "page"
                   , Map [ Keyword "block/uuid", Uuid property_uuid ]
                   ; ( Keyword "blocks"
                     , Vector
                         [ Map
                             [ Keyword "block/title", String "b3"
                             ; ( Keyword "build/children"
                               , Vector
                                   [ Map
                                       [ Keyword "block/title"
                                       , String "b4" ] ] ) ] ] ) ] ] )
         ; Keyword "build-existing-tx?", Bool true ])
  in
  let db = db_of conn in
  let block_titles_of_page (u : string) : string list =
    let page_arg =
      (* cljs passes [:block/uuid u] as the input — resolve it to the eid *)
      match Datascript.entity db (Lookup_ref ("block/uuid", Uuid u)) with
      | Some e -> Arg_scalar (Result_value (Int64 (Int64.of_int e.id)))
      | None -> Arg_scalar (Result_value Nil)
    in
    q_string
      ~inputs:[ page_arg ]
      db
      "[:find [?b ...] :in $ ?page-id :where [?b :block/page ?page-id]]"
    |> List.filter_map (function
         | [ Result_entity id ] ->
             (match Ldb.ent_of_id db id with
              | Some e -> ent_title e
              | None -> None)
         | [ Result_value (Int64 id) ] ->
             (match Option.bind (Datascript.Util.int64_to_int id)
                      (Ldb.ent_of_id db) with
              | Some e -> ent_title e
              | None -> None)
         | _ -> None)
  in
  check "Class page has correct blocks"
    (block_titles_of_page class_uuid = [ "b1"; "b2" ]);
  check "Property page has correct blocks"
    (block_titles_of_page property_uuid = [ "b3"; "b4" ])

(* (deftest build-class-extends-rejects-cycles ...) *)
let test_build_class_extends_rejects_cycles () =
  (* testing "self cycle" *)
  expect_cycle_error "self cycle"
    (read_edn
       "{:classes {:user.class/A {:build/class-extends [:user.class/A]}}}");
  (* testing "deprecated class parent self cycle" *)
  expect_cycle_error "deprecated class parent self cycle"
    (read_edn
       "{:classes {:user.class/A {:build/class-parent :user.class/A}}}");
  (* testing "deprecated class parent takes precedence" *)
  let init_tx, _ =
    Sqlite_build.build_blocks_tx
      (read_edn
         "{:classes {:user.class/A {:build/class-parent :user.class/B
                                    :build/class-extends [:user.class/A]}
                     :user.class/B {}}}")
  in
  (match
     ( find_tx_ident "user.class/A" init_tx
     , find_tx_ident "user.class/B" init_tx )
   with
   | Some class_a, Some class_b ->
       (match (tx_attr class_a "logseq.property.class/extends", tx_attr class_b "db/id") with
        | Some extends, Some db_id_b ->
            check "deprecated class parent takes precedence"
              (coll_items extends = [ db_id_b ])
        | _ -> check "deprecated class parent takes precedence" false)
   | _ -> check "deprecated class parent takes precedence" false);
  (* testing "multi-class cycle" *)
  expect_cycle_error "multi-class cycle"
    (read_edn
       "{:classes {:user.class/A {:build/class-extends [:user.class/B]}
                   :user.class/B {:build/class-extends [:user.class/C]}
                   :user.class/C {:build/class-extends [:user.class/A]}}}");
  (* testing "diamond inheritance without a cycle" *)
  check "diamond inheritance without a cycle"
    (match
       Sqlite_build.build_blocks_tx
         (read_edn
            "{:classes {:user.class/A {}
                        :user.class/B {:build/class-extends [:user.class/A]}
                        :user.class/C {:build/class-extends [:user.class/A]}
                        :user.class/D {:build/class-extends [:user.class/B :user.class/C]}}}")
     with
     | _ -> true
     | exception _ -> false)

(* (deftest property-value-with-properties-and-tags ...) *)
let test_property_value_with_properties_and_tags () =
  let conn =
    create_conn_with_blocks
      (read_edn
         "{:properties {:p1 {:logseq.property/type :default}}
           :classes {:C1 {}}
           :pages-and-blocks
           [{:page {:block/title \"page1\"}
             :blocks [{:block/title \"block has pvalue with built-in tag\"
                       :build/properties
                       {:p1 {:build/property-value :block
                             :block/title \"t1\"
                             :build/tags [:logseq.class/Task]}}}
                      {:block/title \"block has pvalue with user tag\"
                       :build/properties
                       {:p1 {:build/property-value :block
                             :block/title \"u1\"
                             :build/tags [:C1]}}}
                      {:block/title \"Todo query\"
                       :build/tags [:logseq.class/Query]
                       :build/properties
                       {:logseq.property/query
                        {:build/property-value :block
                         :block/title \"{:query (task Todo)}\"
                         :build/properties
                         {:logseq.property.code/lang \"clojure\"
                          :logseq.property.node/display-type :code}}}}]}]}")
  in
  let db = db_of conn in
  let readable_no_created t =
    match Db_test_util.find_block_by_content db t with
    | Some b ->
        Some
          (dissoc "logseq.property/created-from-property"
             (readable_properties b))
    | None -> None
  in
  check_readable "query block properties"
    [ "logseq.property.code/lang", Rv_scalar "clojure"
    ; "logseq.property.node/display-type", Rv_scalar "code" ]
    (Option.value ~default:[] (readable_no_created "{:query (task Todo)}"));
  check_readable "t1 properties"
    [ "block/tags", Rv_list [ "logseq.class/Task" ] ]
    (Option.value ~default:[] (readable_no_created "t1"));
  check_readable "u1 properties"
    [ "block/tags", Rv_list [ "user.class/C1" ] ]
    (Option.value ~default:[] (readable_no_created "u1"))

(* (deftest build-ontology-with-multiple-namespaces ...) *)
let test_build_ontology_with_multiple_namespaces () =
  let conn =
    create_conn_with_blocks
      (read_edn
         "{:properties {:user.property/p1 {:logseq.property/type :default}
                        :other.property/p1 {:logseq.property/type :default}}
           :classes {:user.class/C1 {}
                     :other.class/C1 {}}}")
  in
  let db = db_of conn in
  check "user.property/p1 is a property"
    (Ldb.is_property (ident_ent_exn db "user.property/p1"));
  check "other.property/p1 is a property"
    (Ldb.is_property (ident_ent_exn db "other.property/p1"));
  check "user.class/C1 is a class"
    (Ldb.is_class (ident_ent_exn db "user.class/C1"));
  check "other.class/C1 is a class"
    (Ldb.is_class (ident_ent_exn db "other.class/C1"))

(* (deftest build-preserves-class-property-ordering-for-export ...) *)
let test_build_preserves_class_property_ordering_for_export () =
  let class_properties_c1 = [ "user.property/p2"; "user.property/p1"; "user.property/p3" ] in
  let class_properties_c2 = [ "user.property/p4"; "user.property/p2"; "user.property/p3" ] in
  let another_class_properties_c1 = [ "user.property/p5" ] in
  let another_class_properties_c2 = [ "user.property/p6" ] in
  let another_class_properties_c3 = [ "user.property/p6"; "user.property/p5" ] in
  let kw_list xs = Vector (List.map (fun s -> Keyword s) xs) in
  let conn =
    create_conn_with_blocks
      (Map
         [ ( Keyword "properties"
           , Map
               (List.map
                  (fun p ->
                    ( Keyword p
                    , Map [ Keyword "logseq.property/type", Keyword "default" ] ))
                  [ "user.property/p1"; "user.property/p2"; "user.property/p3"
                  ; "user.property/p4"; "user.property/p5"; "user.property/p6" ]) )
         ; ( Keyword "classes"
           , Map
               [ ( Keyword "user.class/C1"
                 , Map [ Keyword "build/class-properties", kw_list class_properties_c1 ] )
               ; ( Keyword "user.class/C2"
                 , Map [ Keyword "build/class-properties", kw_list class_properties_c2 ] )
               ; ( Keyword "user.class/AnotherC1"
                 , Map [ Keyword "build/class-properties", kw_list another_class_properties_c1 ] )
               ; ( Keyword "user.class/AnotherC2"
                 , Map [ Keyword "build/class-properties", kw_list another_class_properties_c2 ] )
               ; ( Keyword "user.class/AnotherC3"
                 , Map [ Keyword "build/class-properties", kw_list another_class_properties_c3 ] ) ] ) ])
  in
  let export_map =
    Sqlite_export.build_export (db_of conn)
      (Map [ Keyword "export-type", Keyword "graph-ontology" ])
  in
  let get_in (v : value) (path : string list) : value option =
    List.fold_left
      (fun acc k ->
        match acc with
        | Some m ->
            (match m with
             | Map kvs -> List.assoc_opt (Keyword k) kvs
             | _ -> None)
        | None -> None)
      (Some v) path
  in
  let class_props (ident : string) : string list =
    match get_in export_map [ "classes"; ident; "build/class-properties" ] with
    | Some v ->
        List.filter_map
          (function Keyword s -> Some s | _ -> None)
          (coll_items v)
    | None -> []
  in
  check "class-properties-c1 ordering preserved"
    (class_props "user.class/C1" = class_properties_c1);
  check "class-properties-c2 ordering preserved"
    (class_props "user.class/C2" = class_properties_c2);
  check "Later class-level ordering constraint :p6 before :p5 is preserved"
    (class_props "user.class/AnotherC3" = another_class_properties_c3)

(* ---------- runner ---------- *)

let () =
  Alcotest.run "sqlite-build"
    [ ( "build_test"
      , [ Alcotest.test_case "build-tags" `Quick test_build_tags
        ; Alcotest.test_case "build-properties-user" `Quick
            test_build_properties_user
        ; Alcotest.test_case "build-properties-built-in" `Quick
            test_build_properties_built_in
        ; Alcotest.test_case "build-properties-with-build-page" `Quick
            test_build_properties_with_build_page
        ; Alcotest.test_case "build-for-existing-blocks" `Quick
            test_build_for_existing_blocks
        ; Alcotest.test_case "build-blocks-with-refs" `Quick
            test_build_blocks_with_refs
        ; Alcotest.test_case "build-class-page-name-from-title" `Quick
            test_build_class_page_name_from_title
        ; Alcotest.test_case "build-class-and-property-pages" `Quick
            test_build_class_and_property_pages
        ; Alcotest.test_case "build-class-extends-rejects-cycles" `Quick
            test_build_class_extends_rejects_cycles
        ; Alcotest.test_case "property-value-with-properties-and-tags" `Quick
            test_property_value_with_properties_and_tags
        ; Alcotest.test_case "build-ontology-with-multiple-namespaces" `Quick
            test_build_ontology_with_multiple_namespaces
        ; Alcotest.test_case "build-preserves-class-property-ordering-for-export" `Quick
            test_build_preserves_class_property_ordering_for_export ] ) ]
