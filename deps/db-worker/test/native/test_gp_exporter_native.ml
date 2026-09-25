(* 1:1 port of deps/graph-parser/test/logseq/graph_parser/exporter_test.cljs
   into native OCaml (aggregated into test_db_native as the "gp-exporter"
   suite). All ~70 deftests are ported; cljs deftest names are kept as OCaml
   test names.

   Sources (cljs file -> ported fns used under test):
   - deps/graph-parser/src/logseq/graph_parser/exporter.cljs:
     export-doc-files, export-file-graph, build-doc-options,
     split-title-by-code-fences, update-asset-links-in-block-title,
     handle-template-blocks (cljs extract-template-blocks), add-file-to-db-graph,
     finalize-imported-graph, export-config-file, export-class-properties,
     sanitize-page-aliases-for-import
   - test-side helpers ported here: extract-rules, find-block-by-property(-value),
     ordered-children, block-tree-with-properties, find-template-by-title,
     template-content-trees, block-status, status-content,
     status-closed-value-contents, status-closed-value-content-frequencies,
     blocks-by-title, task-blocks-by-title, report-retracts-block-uuid?,
     imported-favorite-titles, build-graph-files, <read-file, notify-user,
     default-export-options, <read-and-copy-asset, import-file-graph-to-db,
     import-files-to-db, write-temp-graph-file, write-temp-file-graph,
     <export-in-memory-doc-files, and the generated-file-graph corpus fns
     (next-random!, random-choice!, generated-uuid, generated-page-preamble,
     generated-title-suffix, generated-extra-lines, generated-md-block,
     generated-md-file-content, generated-md-file-graph,
     assert-generated-md-file-graph-imports).
   - db-test/create-conn -> [create_conn] below: schema +
     Sqlite_create_graph.initial_tx_data, matching cljs
     sqlite-export/create-conn (the full build-db-initial-data seed), NOT the
     trimmed Db_test_util.create_conn — exporter tests need the full built-in
     ontology (Template/Asset/Pdf-annotation/... idents and closed values).

   Skipped cljs cases:
   - export-docs-graph-with-convert-all-tags (^:integration): skipped when the
     logseq/docs v0.10.12 checkout is absent. Set env var
     LOGSEQ_DOCS_0_10_12_DIR (or LOGSEQ_DOCS_DIR) to a docs checkout at that tag
     to enable it; it is not run by default, same as cljs (:integration tests
     are excluded by default in cljs test runs). The test is implemented fully —
     it just needs the fixture.
   - import-generated-markdown-file-graph-fuzz and
     import-large-flat-file-without-stack-overflow (^:integration): skipped
     unless DB_WORKER_INTEGRATION_TESTS=1, matching cljs where ^:integration
     tests are excluded from default runs.
   - import-missing-local-pdf-asset-link-is-ignored-quietly: the "quietly" part
     asserts nothing writes a console *error* via js/process.stderr.write
     redefinition. There is no equivalent interception point in the native
     runtime; the port asserts the same observable state (ignored-assets +
     validation errors) but does not capture stderr.

   Notes/divergences:
   - cljs deftest-async bodies are synchronous Eff chains natively; [await]
     resolves them.
   - cljs `=` is order-insensitive for maps and sets; [v_eq]/[wire_eq]
     implement those semantics for value and Wire.t comparisons.
   - cljs notify-user calls process.exit on :level :error — that would kill
     the test runner; the port logs to stderr instead. Tests that need to
     observe notifications pass their own notify-user as in cljs.
   - cljs (hash url) for hls__ file renames is the Murmur/goog.string hash —
     see [cljs_string_hash].
   - cljs :block/raw-title -> Ldb.raw_title; entity-plus/lookup-kv-then-entity
     semantics are already in Ldb.raw_title (journal titles formatted).
   - db-validate/validate-local-db! -> Db_validate.validate_local_db; cljs
     (map :entity (:errors ...)) -> List.map ge_entity on the grouped_error
     list. *)

open Datascript
open Test_shared
open Db_test_util

module Eff = Db_worker_effect
module BM = Block_map
module Gp = Gp_exporter

(* ---------- generic helpers ---------- *)

(* cljs p/let chains resolve synchronously in the native runtime. *)
let await (t : 'a Eff.t) : 'a =
  let result = ref None in
  Eff.on_any t (fun v -> result := Some v) (fun e -> raise e);
  match !result with
  | Some v -> v
  | None -> raise (Failure "await: Eff did not resolve")

(* cljs marks these deftests ^:integration — excluded from default runs.
   Opt in with DB_WORKER_INTEGRATION_TESTS=1 *)
let integration_tests_enabled () =
  Sys.getenv_opt "DB_WORKER_INTEGRATION_TESTS" = Some "1"

let eq name expected actual msg =
  Alcotest.(check bool) (if msg = "" then name else name ^ " — " ^ msg) true
    (expected = actual)

let check (name : string) (ok : bool) (msg : string) =
  Alcotest.(check bool) (if msg = "" then name else name ^ " — " ^ msg) true
    ok

let str_contains (s : string) (sub : string) : bool =
  let n = String.length s and m = String.length sub in
  let rec loop i =
    i + m <= n
    && (String.sub s i m = sub || loop (i + 1))
  in
  m = 0 || loop 0

(* cljs `=` on values: maps and sets are order-insensitive; vectors compare
   element-wise; Vector and List are cross-equal (sequential collections). *)
let rec v_eq (a : value) (b : value) : bool =
  match a, b with
  | Map ka, Map kb ->
      List.length ka = List.length kb
      && List.for_all
           (fun (k, v) ->
             match List.find_opt (fun (k', _) -> Util.value_equal k' k) kb with
             | Some (_, v') -> v_eq v v'
             | None -> false)
           ka
  | Set sa, Set sb ->
      List.length sa = List.length sb
      && List.for_all (fun x -> List.exists (fun y -> v_eq x y) sb) sa
      && List.for_all (fun y -> List.exists (fun x -> v_eq x y) sa) sb
  | Vector va, Vector vb | List va, List vb | Vector va, List vb
  | List va, Vector vb ->
      List.length va = List.length vb && List.for_all2 v_eq va vb
  | _ -> Util.value_equal a b

let v_eq_opt a b =
  match a, b with
  | Some a, Some b -> v_eq a b
  | None, None -> true
  | _ -> false

let check_v name expected actual msg =
  Alcotest.(check bool)
    (if msg = "" then name else name ^ " — " ^ msg)
    true (v_eq expected actual)

(* cljs `=` on Wire.t values (readable-properties output): Keyword/String
   cross-equal for kw results, Map unordered, Set unordered, List/Array
   ordered. *)
let rec wire_eq (a : Wire.t) (b : Wire.t) : bool =
  match a, b with
  | Wire.Map ka, Wire.Map kb ->
      List.length ka = List.length kb
      && List.for_all
           (fun (k, v) ->
             match List.find_opt (fun (k', _) -> wire_eq k' k) kb with
             | Some (_, v') -> wire_eq v v'
             | None -> false)
           ka
  | Wire.Set sa, Wire.Set sb ->
      List.length sa = List.length sb
      && List.for_all (fun x -> List.exists (fun y -> wire_eq x y) sb) sa
      && List.for_all (fun y -> List.exists (fun x -> wire_eq x y) sa) sb
  | Wire.Array va, Wire.Array vb | Wire.List va, Wire.List vb
  | Wire.Array va, Wire.List vb | Wire.List va, Wire.Array vb ->
      List.length va = List.length vb && List.for_all2 wire_eq va vb
  | Wire.String a, Wire.Uuid b | Wire.Uuid a, Wire.String b -> a = b
  | Wire.Keyword a, Wire.String b | Wire.String a, Wire.Keyword b -> a = b
  | Wire.Int a, Wire.Int64 b -> Int64.of_int a = b
  | Wire.Int64 a, Wire.Int b -> a = Int64.of_int b
  | Wire.Int a, Wire.Float b -> Float.of_int a = b
  | Wire.Float a, Wire.Int b -> a = Float.of_int b
  | _ -> a = b

(* cljs (select-keys m ks) — keep only the expected keys then compare *)
let wire_select (keys : string list) (w : Wire.t) : Wire.t =
  match w with
  | Wire.Map kvs ->
      Wire.Map
        (List.filter_map
           (fun k ->
             match
               List.find_opt
                 (fun (k', _) ->
                   match k' with Wire.Keyword k' | Wire.String k' -> k' = k | _ -> false)
                 kvs
             with
             | Some (k', v) -> Some (Wire.Keyword k, v)
             | None -> None)
           keys)
  | _ -> w

let wmap (kvs : (string * Wire.t) list) : Wire.t =
  Wire.Map (List.map (fun (k, v) -> Wire.Keyword k, v) kvs)

let wstr (s : string) : Wire.t = Wire.String s
let wkw (s : string) : Wire.t = Wire.Keyword s
let wint (n : int) : Wire.t = Wire.Int n
let wfloat (f : float) : Wire.t = Wire.Float f
let wbool (b : bool) : Wire.t = Wire.Bool b
let wlist (xs : Wire.t list) : Wire.t = Wire.List xs
let wstrs (xs : string list) : Wire.t = Wire.List (List.map wstr xs)
let wkws (xs : string list) : Wire.t = Wire.List (List.map wkw xs)
let wset (xs : Wire.t list) : Wire.t = Wire.Set xs
let wstrset (xs : string list) : Wire.t = Wire.Set (List.map wstr xs)

let check_wire name expected actual msg =
  Alcotest.(check bool)
    (if msg = "" then name else name ^ " — " ^ msg)
    true (wire_eq expected actual)

(* cljs (is (some? x)) *)
let check_some name o msg =
  Alcotest.(check bool)
    (if msg = "" then name else name ^ " — " ^ msg)
    true (Option.is_some o)

let check_none name o msg =
  Alcotest.(check bool)
    (if msg = "" then name else name ^ " — " ^ msg)
    true (Option.is_none o)

(* cljs string/includes?, starts-with?, ends-with? *)
let str_includes = Common_util.str_includes
let str_starts_with = Common_util.str_starts_with
let str_ends_with = Common_util.str_ends_with

let check_includes name haystack needle msg =
  Alcotest.(check bool)
    (if msg = "" then name else name ^ " — " ^ msg)
    true (str_includes haystack needle)

let check_starts name s prefix msg =
  Alcotest.(check bool)
    (if msg = "" then name else name ^ " — " ^ msg)
    true (str_starts_with s prefix)

(* cljs (re-seq re s) — all matches *)
let re_seq (pattern : string) (s : string) : string list =
  let re = Regexp.compile pattern in
  let rec loop pos acc =
    match Regexp.exec ~pos re s with
    | Some m ->
        loop m.Regexp.last
          ((match m.Regexp.groups.(0) with Some g -> g | None -> "") :: acc)
    | None -> List.rev acc
  in
  loop 0 []

let re_find (pattern : string) (s : string) : bool =
  Regexp.test (Regexp.compile pattern) s

(* ---------- db-test helpers ---------- *)

(* cljs db-test/create-conn — sqlite-export/create-conn: schema + full
   build-db-initial-data seed. (Db_test_util.create_conn is trimmed; exporter
   tests need the full ontology.) *)
let create_conn () : conn =
  let conn = Datascript.create_conn ~schema:(schema ()) () in
  ignore
    (Datascript.transact_conn conn
       (Sqlite_create_graph.initial_tx_data ~db:(Datascript.db conn)
          ~config_content:"{}" ()));
  conn

(* cljs db-test/create-conn-with-blocks — full-seed conn + create-blocks *)
let create_conn_with_blocks ?(options = default_options)
    ?(properties = []) ?(classes = []) ?(pages_and_blocks = [])
    ?(pre_txs : (string * edn) list list = []) () : conn =
  let options = { options with properties; classes; pages_and_blocks } in
  let init_tx, block_props_tx = build_blocks_tx options in
  let conn = create_conn () in
  if pre_txs <> [] then transact_maps conn pre_txs;
  transact_maps conn init_tx;
  if block_props_tx <> [] then transact_maps conn block_props_tx;
  conn

(* cljs d/entity helpers *)
let entity_of (db : db) (r : entity_ref) : entity option =
  Datascript.entity db r

let entity_exn (db : db) (r : entity_ref) : entity =
  match Datascript.entity db r with
  | Some e -> e
  | None -> failwith "entity not found"

let entity_at_uuid' db uuid = entity_at_uuid db uuid

let db_entity (conn : conn) (r : entity_ref) : entity option =
  Datascript.entity (Datascript.db conn) r

(* cljs (:attr entity) *)
let getv' (e : entity) (a : attr) : value option = Ldb.value e a
let get_string' (e : entity) (a : attr) : string option = Ldb.string_value e a
let get_id (e : entity) : entity_id = e.id

(* cljs (:db/id (d/entity db ident)) *)
let eid_of_ident (db : db) (ident : string) : entity_id option =
  match Datascript.entity db (Ident ident) with Some e -> Some e.id | None -> None

(* cljs db-test/find-block-by-content — a string does an exact title match;
   a regex does re-find. We take either via Str/Re. *)
type content_match = Str of string | Re of string

let find_block_by_content' (db : db) (cm : content_match) : entity option =
  let input, q =
    match cm with
    | Str s ->
        ( Result_value (String s),
          "[:find [?b ...] :in $ ?content :where [?b :block/title ?content] [?b :block/page]]"
        )
    | Re r ->
        ( Result_value (Regex r),
          "[:find [?b ...] :in $ ?pattern :where [?b :block/title ?content] [?b :block/page] [(re-find ?pattern ?content)]]"
        )
  in
  match Datascript.q_string ~inputs:[ Arg_scalar input ] db q with
  | (Result_entity id :: _) :: _ | (Result_value (Int id) :: _) :: _ ->
      Ldb.ent_of_id db id
  | _ -> None

(* string find — cljs (db-test/find-block-by-content db "x") *)
let find_block (db : db) (content : string) : entity option =
  find_block_by_content' db (Str content)

let find_block_exn db content =
  match find_block db content with
  | Some e -> e
  | None -> failwith ("block not found: " ^ content)

let find_block_re db re = find_block_by_content' db (Re re)

let find_block_re_exn db re =
  match find_block_re db re with
  | Some e -> e
  | None -> failwith ("block not found: " ^ re)

(* cljs db-test/find-page-by-title *)
let find_page (db : db) (title : string) : entity option =
  find_page_by_title db title

let find_page_exn db title =
  match find_page db title with
  | Some e -> e
  | None -> failwith ("page not found: " ^ title)

(* cljs db-test/find-journal-by-journal-day *)
let find_journal (db : db) (day : int) : entity option =
  find_journal_by_journal_day db day

(* cljs db-test/readable-properties — from test_export_native.ml *)
let readable_properties (ent : entity) : (attr * value) list =
  let db = ent.db in
  let ent_of (v : value) : entity option =
    match v with Ref id -> Ldb.ent_of_id db id | _ -> None
  in
  List.map
    (fun (k, tv) ->
      let vals =
        match tv with
        | Many_values vs -> vs
        | One_value v -> [ v ]
        | One_entity _ | Many_entities _ -> []
      in
      ( k,
        if k = "block/tags" || k = "logseq.property.class/extends" then
          Vector
            (List.map
               (fun v ->
                 match ent_of v with
                 | Some e -> Option.value ~default:Nil (Ldb.value e "db/ident")
                 | None -> Nil)
               vals)
        else
          match tv with
          | Many_values vs
            when vs <> [] && List.for_all (fun v -> ent_of v <> None) vs ->
              Set
                (List.map
                   (fun v ->
                     match ent_of v with
                     | Some e ->
                         Option.value ~default:Nil
                           (Db_property.property_value_content e)
                     | None -> Nil)
                   vs)
          | One_value v ->
              (match ent_of v with
               | Some e ->
                   (match Ldb.value e "db/ident" with
                    | Some i -> i
                    | None ->
                        Option.value ~default:Nil
                          (Db_property.property_value_content e))
               | None -> v)
          | Many_values vs -> Set vs
          | One_entity _ | Many_entities _ -> Nil ))
    (Db_property.properties_of_entity ent)

(* cljs (select-keys (readable-properties e) ks) as a plain map for v_eq *)
let props_select (keys : attr list) (e : entity) : value =
  Map
    (List.filter_map
       (fun (k, v) ->
         if List.mem k keys then Some (Keyword k, v) else None)
       (readable_properties e))

let props_map (e : entity) : value =
  Map (List.map (fun (k, v) -> Keyword k, v) (readable_properties e))

(* cljs (dissoc (readable-properties e) ks...) *)
let props_dissoc (keys : attr list) (e : entity) : value =
  Map
    (List.filter_map
       (fun (k, v) ->
         if List.mem k keys then None else Some (Keyword k, v))
       (readable_properties e))

(* cljs (:attr (readable-properties e)) *)
let prop_get (e : entity) (a : attr) : value option =
  List.assoc_opt a (readable_properties e)

let prop_get_string (e : entity) (a : attr) : string option =
  match prop_get e a with Some (String s) -> Some s | _ -> None

(* cljs (:block/refs e) — entities *)
let ref_ents' (e : entity) (a : attr) : entity list = Ldb.ref_ents e a
let ref_ent' (e : entity) (a : attr) : entity option =
  match ref_ents' e a with e :: _ -> Some e | [] -> None

(* cljs (map :block/title (:block/refs e)) *)
let ref_titles (e : entity) (a : attr) : string list =
  List.filter_map
    (fun x -> Ldb.string_value x "block/title")
    (ref_ents' e a)

let ref_idents (e : entity) (a : attr) : string list =
  List.filter_map Ldb.ident_of (ref_ents' e a)

(* cljs (:block/_parent e) — all children *)
let children_of (e : entity) : entity list = Ldb.ref_ents e "block/_parent"

(* cljs (:block/parent e) *)
let parent_of (e : entity) : entity option = Ldb.ref_ent e "block/parent"

(* cljs (:block/namespace e) *)
let namespace_of (e : entity) : entity option = Ldb.ref_ent e "block/namespace"

(* cljs (d/q '[:find ...] @conn ...) — coll rows of eids *)
let q_eids (db : db) (q : string) : entity_id list =
  List.filter_map
    (function
      | [ Result_entity id ] -> Some id
      | [ Result_value (Int id) ] -> Some id
      | _ -> None)
    (Datascript.q_string db q)

let q_entities (db : db) (q : string) : entity list =
  List.filter_map (fun id -> Ldb.ent_of_id db id) (q_eids db q)

let q_eids_in (db : db) (q : string) (inputs : value list) : entity_id list =
  List.filter_map
    (function
      | [ Result_entity id ] -> Some id
      | [ Result_value (Int id) ] -> Some id
      | _ -> None)
    (Datascript.q_string db
       ~inputs:(List.map (fun v -> Arg_scalar (Result_value v)) inputs)
       q)

let q_entities_in db q inputs =
  List.filter_map (fun id -> Ldb.ent_of_id db id) (q_eids_in db q inputs)

(* cljs (d/q '[:find [?x ...] ...]) — first-col values *)
let q_values (db : db) (q : string) : value list =
  List.filter_map
    (function
      | [ Result_value v ] -> Some v
      | [ Result_entity id ] -> Some (Int id)
      | [ Result_attr a ] -> Some (Keyword a)
      | _ -> None)
    (Datascript.q_string db q)

let q_values_in (db : db) (q : string) (inputs : value list) : value list =
  List.filter_map
    (function
      | [ Result_value v ] -> Some v
      | [ Result_entity id ] -> Some (Int id)
      | [ Result_attr a ] -> Some (Keyword a)
      | _ -> None)
    (Datascript.q_string db
       ~inputs:(List.map (fun v -> Arg_scalar (Result_value v)) inputs)
       q)

(* cljs (d/q '[:find ?x . ...]) — single scalar *)
let q_scalar_in (db : db) (q : string) (inputs : value list) : value option =
  match
    Datascript.q_string db
      ~inputs:(List.map (fun v -> Arg_scalar (Result_value v)) inputs)
      q
  with
  | [ [ Result_value v ] ] -> Some v
  | [ [ Result_entity id ] ] -> Some (Int id)
  | [ [ Result_attr a ] ] -> Some (Keyword a)
  | [ [ Result_pull p ] ] -> Some (Tuple []) (* unused *)
  | _ -> None

(* cljs (d/q '[:find (pull ?b ...) ...]) — pulled entities *)
let q_pulls (db : db) (q : string) : pulled_entity list =
  List.filter_map
    (function [ Result_pull p ] -> Some p | _ -> None)
    (Datascript.q_string db q)

(* same with :in inputs *)
let q_pulls_in (db : db) (q : string) (inputs : value list) :
    pulled_entity list =
  List.filter_map
    (function [ Result_pull p ] -> Some p | _ -> None)
    (Datascript.q_string db
       ~inputs:(List.map (fun v -> Arg_scalar (Result_value v)) inputs)
       q)

(* pulled attrs accessor — cljs (:attr pulled-map) *)
let pulled_get (a : attr) (p : pulled_entity) : pulled_value option =
  List.assoc_opt (Keyword a) p.pulled_attrs

let pulled_scalar_value = function
  | Pulled_scalar v -> Some v
  | Pulled_entity p -> Some (Ref p.pulled_id)
  | Pulled_many _ -> None

let pulled_scalar (a : attr) (p : pulled_entity) : value option =
  match pulled_get a p with Some pv -> pulled_scalar_value pv | None -> None

(* pulled sub-entities — cljs ({:attr [:sub]} pulled) *)
let pulled_ents (a : attr) (p : pulled_entity) : pulled_entity list =
  match pulled_get a p with
  | Some (Pulled_entity sub) -> [ sub ]
  | Some (Pulled_many vs) ->
      List.filter_map
        (function Pulled_entity sub -> Some sub | _ -> None)
        vs
  | _ -> []

(* pulled entity -> db entity *)
let pulled_entity_to_entity (db : db) (p : pulled_entity) : entity option =
  Ldb.ent_of_id db p.pulled_id

(* ---------- cljs private test helpers ---------- *)

(* (defn- extract-rules [rules] ...) *)
let extract_rules (rules : string list) : query_arg =
  Db_query_dsl.parse_rules_input (Db_query_dsl.extract_rules rules)

(* cljs [:find [?b ...] :in $ ?prop % :where (has-property ?b ?prop)] *)
let find_block_by_property (db : db) (property : string) : entity list =
  List.filter_map
    (function
      | [ Result_entity id ] -> Ldb.ent_of_id db id
      | [ Result_value (Int id) ] -> Ldb.ent_of_id db id
      | _ -> None)
    (Datascript.q_string db
       ~inputs:
         [ Arg_scalar (Result_value (Keyword property));
           extract_rules [ "has-property" ] ]
       "[:find [?b ...] :in $ ?prop % :where (has-property ?b ?prop)]")

let find_block_by_property_value (db : db) (property : string)
    (property_value : string) : entity option =
  match
    Datascript.q_string db
      ~inputs:
        [ Arg_scalar (Result_value (Keyword property));
          Arg_scalar (Result_value (String property_value));
          extract_rules [ "property" ] ]
      "[:find [?b ...] :in $ ?prop ?prop-value % :where (property ?b ?prop ?prop-value)]"
  with
  | rows ->
      List.find_map
        (function
          | [ Result_entity id ] -> Ldb.ent_of_id db id
          | [ Result_value (Int id) ] -> Ldb.ent_of_id db id
          | _ -> None)
        rows

(* cljs ordered-children — :block/_parent minus property-created children,
   sorted by :block/order *)
let ordered_children (e : entity) : entity list =
  Ldb.sort_by_order
    (List.filter
       (fun c ->
         Option.is_none
           (Ldb.value c "logseq.property/created-from-property"))
       (children_of e))

(* cljs block-tree-with-properties *)
type block_tree =
  { bt_title : string
  ; bt_properties : (attr * value) list
  ; bt_children : block_tree list }

let rec block_tree_with_properties (e : entity) : block_tree =
  { bt_title = Option.value ~default:"" (Ldb.string_value e "block/title")
  ; bt_properties =
      List.remove_assoc "block/tags" (readable_properties e)
  ; bt_children =
      List.map block_tree_with_properties (ordered_children e) }

let rec bt_to_value (t : block_tree) : value =
  Map
    [ (Keyword "title", String t.bt_title);
      ( Keyword "properties",
        Map
          (List.map (fun (k, v) -> Keyword k, v) t.bt_properties) );
      ( Keyword "children",
        Vector (List.map bt_to_value t.bt_children) ) ]

(* cljs find-template-by-title — block with title + Template tag *)
let find_template_by_title (db : db) (title : string) : entity option =
  match
    q_eids_in db
      "[:find [?b ...] :in $ ?title :where [?b :block/title ?title] [?b :block/tags :logseq.class/Template]]"
      [ String title ]
  with
  | id :: _ -> Ldb.ent_of_id db id
  | [] -> None

(* cljs template-content-trees — children trees of the template block *)
let template_content_trees (db : db) (title : string) : block_tree list =
  match find_template_by_title db title with
  | Some t -> List.map block_tree_with_properties (ordered_children t)
  | None -> []

(* cljs block-status — :logseq.property/status entity of a block *)
let block_status (db : db) (content : string) : entity option =
  match find_block db content with
  | Some b -> ref_ent' b "logseq.property/status"
  | None -> None

(* cljs status-content *)
let status_content (db : db) (content : string) : value option =
  match block_status db content with
  | Some s -> Db_property.closed_value_content s
  | None -> None

(* cljs status-closed-value-contents *)
let status_closed_value_contents (db : db) : string list =
  List.filter_map
    (fun e ->
      match Db_property.closed_value_content e with
      | Some (String s) -> Some s
      | _ -> None)
    (Db_property.get_closed_property_values db "logseq.property/status")

(* cljs status-closed-value-content-frequencies — (frequencies ...) map *)
let status_closed_value_content_frequencies (db : db) :
    (string, int) Hashtbl.t =
  let tbl = Hashtbl.create 15 in
  List.iter
    (fun e ->
      match Db_property.closed_value_content e with
      | Some (String s) ->
          Hashtbl.replace tbl s
            (1 + Option.value ~default:0 (Hashtbl.find_opt tbl s))
      | _ -> ())
    (Db_property.get_closed_property_values db "logseq.property/status");
  tbl

(* cljs blocks-by-title — blocks (with :block/page) of the given title *)
let blocks_by_title (db : db) (title : string) : entity list =
  q_entities_in db
    "[:find [?b ...] :in $ ?title :where [?b :block/page] [?b :block/title ?title]]"
    [ String title ]

(* cljs task-blocks-by-title *)
let task_blocks_by_title (db : db) (title : string) : entity list =
  q_entities_in db
    "[:find [?b ...] :in $ ?title :where [?b :block/page] [?b :block/title ?title] [?b :block/tags :logseq.class/Task]]"
    [ String title ]

(* cljs report-retracts-block-uuid? *)
let report_retracts_block_uuid (tx_report : tx_report) (block_uuid : string)
    : bool =
  List.exists
    (fun (d : datom) ->
      d.a = "block/uuid" && d.v = Uuid block_uuid && not d.added)
    tx_report.tx_data

(* cljs imported-favorite-titles *)
let imported_favorite_titles (db : db) : string list =
  match Ldb.get_page db (String Common_config.favorites_page_name) with
  | None -> []
  | Some fav_page ->
      Ldb.get_page_blocks db fav_page.id
      |> List.filter_map (fun p ->
             match List.assoc_opt (Keyword "block/link") p.pulled_attrs with
             | Some (Pulled_entity pe) ->
                 pulled_entity_to_entity db pe
             | Some (Pulled_scalar (Ref id)) -> Ldb.ent_of_id db id
             | _ -> None)
      |> List.filter_map (fun e ->
             Entity_view.get_title_with_parents (Entity_view.of_entity e))

(* ---------- file system helpers (cljs harness) ---------- *)

(* cljs write-temp-graph-file *)
let write_temp_graph_file (relative_path : string) (content : string) : string =
  let dir = Filename.temp_dir "logseq-graph-parser-test-" "" in
  let file_path = Filename.concat dir relative_path in
  ignore
    (await (File_sys.mkdir_p (Filename.dirname file_path)));
  await (File_sys.write_text file_path content);
  Common_path.path_normalize file_path

(* cljs write-temp-file-graph — file map -> graph dir *)
let write_temp_file_graph (files : (string * string) list) : string =
  let dir = Filename.temp_dir "logseq-graph-parser-test-" "" in
  List.iter
    (fun (relative_path, content) ->
      let file_path = Filename.concat dir relative_path in
      ignore (await (File_sys.mkdir_p (Filename.dirname file_path)));
      await (File_sys.write_text file_path content))
    files;
  dir

(* cljs node-path/relative — dir-relative path *)
let path_relative (dir : string) (path : string) : string =
  let dir' = Common_path.path_normalize dir in
  let path' = Common_path.path_normalize path in
  if str_starts_with path' (dir' ^ "/") then
    String.sub path' (String.length dir' + 1)
      (String.length path' - String.length dir' - 1)
  else path'

(* cljs common-graph/get-files + assets readdir -> {:path ::rpath} maps *)
let build_graph_files (dir : string) : BM.t list =
  let dir_abs = Common_path.path_normalize dir in
  let files = await (Common_graph.get_files dir_abs) in
  let assets_dir = Filename.concat dir_abs "assets" in
  let asset_files =
    if await (File_sys.exists assets_dir) then
      await (Common_graph.readdir assets_dir)
    else []
  in
  List.map
    (fun p ->
      [ ("path", String p); ("rpath", String (path_relative dir_abs p)) ])
    (files @ asset_files)

(* cljs <read-file *)
let read_file_bm (f : BM.t) : string Eff.t =
  match BM.string_attr f "path" with
  | Some p -> File_sys.read_text p
  | None -> Eff.error (Failure "file map has no :path")

(* cljs notify-user — print msg + ex-data; no process.exit (kills runner) *)
let rec value_repr (v : value) : string =
  match v with
  | String s -> "\"" ^ s ^ "\""
  | Keyword s -> ":" ^ s
  | Symbol s -> "'" ^ s
  | Uuid s -> "#uuid \"" ^ s ^ "\""
  | Int n -> string_of_int n
  | Float f -> string_of_float f
  | Bool b -> string_of_bool b
  | Nil -> "nil"
  | Vector vs | List vs ->
      "[" ^ String.concat " " (List.map value_repr vs) ^ "]"
  | Set vs -> "#{" ^ String.concat " " (List.map value_repr vs) ^ "}"
  | Map kvs ->
      "{"
      ^ String.concat " "
          (List.map
             (fun (k, v') -> value_repr k ^ " " ^ value_repr v')
             kvs)
      ^ "}"
  | _ -> "<value>"

let notify_user (m : BM.t) : unit =
  (match BM.string_attr m "msg" with
   | Some s -> prerr_string (s ^ "\n")
   | None -> ());
  match BM.attr_value m "ex-data" with
  | Some v -> prerr_string ("Ex-data: " ^ value_repr v ^ "\n")
  | None -> ()

(* cljs default-export-options *)
let default_export_options () : Gp.options =
  { (Gp.default_options ()) with
    Gp.rpath_key = "rpath"
  ; Gp.notify_user = notify_user
  ; Gp.read_file = read_file_bm
  ; Gp.default_config = [] }

(* user options map -> user_options record; cljs merges
   {:convert-all-tags? false} under the passed options for
   import-files-to-db. *)
type import_opts =
  { user_config : (attr * value) list
  ; tag_classes : string list
  ; property_classes : string list
  ; property_parent_classes : string list
  ; convert_all_tags : bool
  ; remove_inline_tags : bool
  ; extract_code_snippets : bool
  ; assets_ids : string list ref option
  ; verbose : bool
  ; import_timeout_ms : int option
  ; import_heartbeat_ms : int option
  ; log_fn : (value list -> unit) option
  ; notify_user_fn : (BM.t -> unit) option
  ; export_file_fn :
      (conn -> BM.t -> Gp.options -> unit Eff.t) option
  ; get_file_stat_fn : (string -> File_sys.file_stat option Eff.t) option
  ; on_tx_report : (tx_report -> unit) option
  ; user_options_extra : (attr * value) list }

let default_import_opts () : import_opts =
  { user_config = []
  ; tag_classes = []
  ; property_classes = []
  ; property_parent_classes = []
  ; convert_all_tags = false (* cljs base {:convert-all-tags? false} *)
  ; remove_inline_tags = true (* cljs build-doc-options merge default *)
  ; extract_code_snippets = false
  ; assets_ids = None
  ; verbose =
      (match Sys.getenv_opt "GP_EXPORTER_VERBOSE" with
       | Some "1" -> true
       | _ -> false)
  ; import_timeout_ms = None
  ; import_heartbeat_ms = None
  ; log_fn = None
  ; notify_user_fn = None
  ; export_file_fn = None
  ; get_file_stat_fn = None
  ; on_tx_report = None
  ; user_options_extra = [] }

let user_options_of (o : import_opts) : Gp.user_options =
  { Gp.tag_classes = o.tag_classes
  ; Gp.property_classes = o.property_classes
  ; Gp.property_parent_classes = o.property_parent_classes
  ; Gp.convert_all_tags = o.convert_all_tags
  ; Gp.remove_inline_tags = o.remove_inline_tags
  ; Gp.extract_code_snippets = o.extract_code_snippets }

(* cljs <read-and-copy-asset — reads file, sha256, records asset-ids for
   non-pdf-annotation assets, stores into assets tbl. *)
let read_and_copy_asset ~(asset_ids : string list ref) (file : BM.t)
    (assets : (string, BM.t) Hashtbl.t)
    (buffer_handler : string -> (BM.t -> BM.t) * bool) : unit Eff.t =
  let path = Option.value ~default:"" (BM.string_attr file "path") in
  let ( >>= ) = Eff.Infix.( >>= ) in
  File_sys.read_binary path
  >>= fun buffer ->
  Crypto.sha256_hex buffer
  >>= fun checksum ->
  let asset_id = Common_uuid.new_block_id () in
  let asset_name = Gp.asset_path_to_name (Some path) in
  let asset_type = Db_asset.asset_path_to_type path in
  let with_edn_content, pdf_annotation = buffer_handler buffer in
  (if not pdf_annotation then asset_ids := asset_id :: !asset_ids);
  (match asset_name with
   | Some name ->
       Hashtbl.replace assets name
         (with_edn_content
            [ ("size", Int (String.length buffer)); ("type", String asset_type)
            ; ("path", String path); ("checksum", String checksum)
            ; ("asset-id", Uuid asset_id) ])
   | None -> ());
  Eff.pure ()

(* cljs <get-file-stat — stat resolved against the graph dir *)
let get_file_stat_of_dir (dir : string) (path : string)
    : File_sys.file_stat option Eff.t =
  let abs =
    if Gp_node_path.is_absolute path then path
    else Common_path.path_join dir [ path ]
  in
  Eff.pure
    (try
       let st = Unix.stat abs in
       Some
         { File_sys.mtime_ms = Some (st.Unix.st_mtime *. 1000.)
         ; File_sys.birthtime_ms = None }
     with Unix.Unix_error _ -> None)

(* cljs import-file-graph-to-db *)
let import_file_graph_to_db (file_graph_dir : string) (conn : conn)
    (o : import_opts) : (string * value) list =
  let files = build_graph_files file_graph_dir in
  let config_file =
    match
      List.find_opt
        (fun f ->
          match BM.string_attr f "path" with
          | Some p -> str_ends_with p "logseq/config.edn"
          | None -> false)
        files
    with
    | Some f -> f
    | None -> failwith "No 'logseq/config.edn' found for file graph dir"
  in
  let asset_ids = Option.value ~default:(ref []) o.assets_ids in
  let options =
    { (default_export_options ()) with
      Gp.user_options = user_options_of o
    ; Gp.verbose = o.verbose
    ; Gp.get_file_stat =
        Some (get_file_stat_of_dir file_graph_dir)
    ; Gp.read_and_copy_asset =
        Some (read_and_copy_asset ~asset_ids)
    ; Gp.import_timeout_ms = o.import_timeout_ms
    ; Gp.import_heartbeat_ms = o.import_heartbeat_ms
    ; Gp.notify_user =
        (match o.notify_user_fn with Some f -> f | None -> notify_user)
    ; Gp.log_fn =
        (match o.log_fn with Some f -> f | None -> Gp.noop_log_fn)
    ; Gp.export_file = o.export_file_fn
    ; Gp.on_tx_report =
        (match o.on_tx_report with Some f -> f | None -> (fun _ -> ())) }
  in
  let result = await (Gp.export_file_graph conn conn config_file files options) in
  result

(* import-state accessor — export-file-graph returns
   [("import-state", Map [...]); ("files", ...)] *)
let import_state_get (key : string) (result : (string * value) list) : value =
  match List.assoc_opt "import-state" result with
  | Some (Map kvs) ->
      (match List.find_opt (fun (k, _) -> k = Keyword key) kvs with
       | Some (_, v) -> v
       | None -> Nil)
  | _ -> Nil

let import_state_list (key : string) (result : (string * value) list)
    : value list =
  match import_state_get key result with
  | Vector vs | List vs -> vs
  | _ -> []

let ignored_count (key : string) (result : (string * value) list) : int =
  List.length (import_state_list key result)

(* cljs (get-in import-state [:ignored-properties]) entry reason check *)
let ignored_entries (key : string) (result : (string * value) list) :
    (value * value) list list =
  List.filter_map
    (fun (v : value) -> match v with Map kvs -> Some kvs | _ -> None)
    (import_state_list key result)

let ignored_reason (entry : (value * value) list) : string option =
  match List.find_opt (fun (k, _) -> k = Keyword "reason") entry with
  | Some (_, Keyword s) -> Some s
  | Some (_, String s) -> Some s
  | _ -> None

(* cljs import-files-to-db — import specific doc files *)
let import_files_to_db (files : string list) (conn : conn)
    (o : import_opts) : Gp.options =
  Gp_block.export_to_db_graph := true;
  Fun.protect
    ~finally:(fun () -> Gp_block.export_to_db_graph := false)
    (fun () ->
      let config =
        [ ("macros", (Map [] : value));
          ("file/name-format", Keyword "triple-lowbar") ]
        @ o.user_config
      in
      let base_options =
        { (default_export_options ()) with
          Gp.user_options = user_options_of o
        ; Gp.verbose = o.verbose
        ; Gp.notify_user =
            (match o.notify_user_fn with Some f -> f | None -> notify_user)
        ; Gp.get_file_stat = o.get_file_stat_fn
        ; Gp.export_file = o.export_file_fn
        ; Gp.on_tx_report =
            (match o.on_tx_report with Some f -> f | None -> (fun _ -> ()))
        ; Gp.import_timeout_ms = o.import_timeout_ms
        ; Gp.import_heartbeat_ms = o.import_heartbeat_ms
        ; Gp.log_fn =
            (match o.log_fn with Some f -> f | None -> Gp.noop_log_fn) }
      in
      let doc_options = Gp.build_doc_options config base_options in
      let files' =
        List.map (fun p -> [ ("path", String p) ]) files
      in
      ignore (await (Gp.export_doc_files conn files' doc_options));
      doc_options)

(* cljs <export-in-memory-doc-files — in-memory file maps; path->stat map of
   "path" -> (birthtime_ms, mtime_ms) options *)
type inmem_file =
  { im_path : string
  ; im_content : string
  ; im_file_created_at : int64 option
  ; im_file_updated_at : int64 option
  ; im_fs_path : string option }

let im_file ?created_at ?updated_at ?fs_path path content : inmem_file =
  { im_path = path; im_content = content;
    im_file_created_at = created_at; im_file_updated_at = updated_at;
    im_fs_path = fs_path }

let im_bm (f : inmem_file) : BM.t =
  List.filter_map Fun.id
    [ Some ("path", String f.im_path)
    ; Some ("content", String f.im_content)
    ; Option.map (fun m -> ("file-created-at", Instant m)) f.im_file_created_at
    ; Option.map (fun m -> ("file-updated-at", Instant m)) f.im_file_updated_at
    ; Option.map (fun p -> ("fs-path", String p)) f.im_fs_path ]

let export_in_memory_doc_files ?conn (files : inmem_file list)
    (path_to_stat : (string * File_sys.file_stat) list) : conn =
  let existing_conn = conn <> None in
  let conn =
    match conn with Some c -> c | None -> create_conn ()
  in
  if not existing_conn then Outliner_db_pipeline.add_listener conn;
  let get_file_stat (path : string) : File_sys.file_stat option Eff.t =
    Eff.pure (List.assoc_opt path path_to_stat)
  in
  let export_file (conn' : conn) (m : BM.t) (opts : Gp.options) : unit Eff.t =
    match BM.string_attr m "file/path", BM.string_attr m "file/content" with
    | Some p, Some c -> Eff.map ignore (Gp.add_file_to_db_graph conn' p c opts)
    | _ -> Eff.pure ()
  in
  let doc_options =
    Gp.build_doc_options
      [ ("macros", Map []); ("file/name-format", Keyword "triple-lowbar") ]
      { (default_export_options ()) with
        Gp.user_options =
          { (Gp.default_user_options ()) with Gp.convert_all_tags = false }
      ; Gp.read_file =
          (fun f ->
            match BM.string_attr f "content" with
            | Some c -> Eff.pure c
            | None -> Eff.error (Failure "in-memory file missing :content"))
      ; Gp.get_file_stat = Some get_file_stat
      ; Gp.export_file = Some export_file }
  in
  Gp_block.export_to_db_graph := true;
  Fun.protect
    ~finally:(fun () -> Gp_block.export_to_db_graph := false)
    (fun () ->
      ignore
        (await
           (Gp.export_doc_files conn (List.map im_bm files) doc_options)));
  conn

(* ---------- generated file graph corpus ---------- *)

let generated_file_graph_page_names =
  [ "Generated Alpha"; "Generated Beta"; "Generated Gamma"; "Generated Delta"
  ; "Generated Epsilon"; "Generated Zeta" ]

let generated_file_graph_ref_page_names =
  generated_file_graph_page_names
  @ [ "Generated/Missing Namespace"; "Generated Nested/Child"
    ; "Missing Alias Target"; "Missing Tag Target"; "Generated PDF" ]

let generated_file_graph_task_markers =
  [ ""; "TODO"; "DOING"; "DONE"; "LATER"; "NOW"; "WAITING" ]

let generated_file_graph_tags =
  [ "generated"; "import"; "file-graph"; "edge-case"; "db-test" ]

let generated_file_graph_test_seeds = [ 1309; 42; 8675309 ]

(* cljs next-random! *)
let next_random (seed : int ref) (n : int) : int =
  let next_seed = !seed * 48271 mod 2147483647 in
  seed := next_seed;
  next_seed mod n

let random_choice (seed : int ref) (choices : 'a list) : 'a =
  List.nth choices (next_random seed (List.length choices))

let generated_uuid (n : int) : string =
  Printf.sprintf "10000000-0000-4000-8000-%012x" n

let generated_page_preamble (seed : int ref) (page_name : string) : string =
  let alias_name = page_name ^ " Alias " ^ string_of_int (next_random seed 30) in
  let tag_page = random_choice seed generated_file_graph_ref_page_names in
  match next_random seed 5 with
  | 0 ->
      Printf.sprintf "alias:: [[%s]], [[Missing Alias Target]]\ntags:: [[%s]], #generated-page\ngenerated-page-rank:: %d\n\n"
        alias_name tag_page (next_random seed 100)
  | 1 -> Printf.sprintf "title:: %s\npublic:: true\n\n" page_name
  | _ -> ""

let generated_title_suffix (seed : int ref) : string =
  match next_random seed 8 with
  | 0 ->
      Printf.sprintf " [missing asset](../assets/missing-%d.pdf)"
        (next_random seed 50)
  | 1 ->
      Printf.sprintf " ![missing image](../assets/missing-%d.png)"
        (next_random seed 50)
  | 2 ->
      Printf.sprintf " [[%s]]"
        (random_choice seed generated_file_graph_ref_page_names)
  | 3 -> " #[[generated multi tag]]"
  | _ -> ""

let generated_extra_lines (seed : int ref) (index : int) : string =
  match next_random seed 8 with
  | 0 -> "  collapsed:: true\n  background-color:: yellow\n"
  | 1 ->
      Printf.sprintf "  alias:: [[Generated Block Alias %d]]\n"
        (next_random seed 100)
  | 2 -> Printf.sprintf "  | generated | table |\n  | row | %d |\n" index
  | 3 ->
      Printf.sprintf "  ```clojure\n  (def generated-%d %d)\n  ```\n" index
        (next_random seed 100)
  | _ -> ""

let generated_md_block (seed : int ref) (index : int) : string =
  let block_id = generated_uuid (index + 1) in
  let duplicate_id = generated_uuid 1 in
  let missing_ref_id = generated_uuid (2000 + index) in
  let task_marker =
    random_choice seed generated_file_graph_task_markers
  in
  let page_name =
    random_choice seed generated_file_graph_ref_page_names
  in
  let missing_page_name =
    "Generated Missing " ^ string_of_int (next_random seed 1000)
  in
  let tag = random_choice seed generated_file_graph_tags in
  let ref_id =
    match next_random seed 5 with
    | 0 -> block_id
    | 1 -> duplicate_id
    | 2 -> missing_ref_id
    | _ -> generated_uuid (next_random seed 90 + 1)
  in
  let id_value =
    match next_random seed 11 with
    | 0 -> "broken-generated-id"
    | 1 -> duplicate_id
    | _ -> block_id
  in
  let page_ref =
    if next_random seed 3 = 0 then missing_page_name else page_name
  in
  let title_prefix = if task_marker = "" then "" else task_marker ^ " " in
  let title_suffix = generated_title_suffix seed in
  let temporal_line =
    match next_random seed 6 with
    | 0 -> "  SCHEDULED: <2026-01-05 Mon .+1w>\n"
    | 1 -> "  DEADLINE: <2026-01-09 Fri +2d>\n"
    | _ -> ""
  in
  let extra_lines = generated_extra_lines seed index in
  let nested_line =
    if next_random seed 3 = 0 then
      Printf.sprintf "  - nested generated block %d [[Generated Nested %d]]\n"
        index (next_random seed 30)
    else ""
  in
  Printf.sprintf "- %sgenerated block %d [[%s]] ((%s)) #%s%s\n%s  id:: %s\n  generated-ref:: [[%s]]\n  generated-rank:: %d\n%s%s"
    title_prefix index page_ref ref_id tag title_suffix temporal_line id_value
    page_name (next_random seed 100) extra_lines nested_line

let generated_md_file_content (seed : int ref) (file_index : int)
    (page_name : string) (block_count : int) : string =
  generated_page_preamble seed page_name
  ^ String.concat ""
      (List.init block_count (fun i ->
           generated_md_block seed ((file_index * 100) + i)))

let generated_md_file_graph (seed_val : int) : (string * string) list =
  let seed = ref seed_val in
  let pages =
    List.mapi
      (fun index page_name ->
        let fname =
          "pages/"
          ^ String.map
              (fun c -> if c = ' ' then '_' else Char.lowercase_ascii c)
              page_name
          ^ ".md"
        in
        ( fname,
          generated_md_file_content seed index page_name
            (8 + next_random seed 8) ))
      generated_file_graph_page_names
  in
  let journals =
    [ ( "journals/2026_01_05.md",
        generated_md_file_content seed 20 "2026_01_05" (8 + next_random seed 8) )
    ; ( "journals/2026_01_06.md",
        generated_md_file_content seed 21 "2026_01_06" (8 + next_random seed 8) )
    ; "assets/generated.md", "Generated asset content\n" ]
  in
  ("logseq/config.edn",
   "{:preferred-format :markdown\n :journal/page-title-format \"yyyy_MM_dd\"}\n")
  :: (pages @ journals)

(* cljs assert-generated-md-file-graph-imports *)
let assert_generated_md_file_graph_imports (tname : string) (seed : int) : unit =
  let graph_dir = write_temp_file_graph (generated_md_file_graph seed) in
  let conn = create_conn () in
  Outliner_db_pipeline.add_listener conn;
  let result =
    import_file_graph_to_db graph_dir conn (default_import_opts ())
  in
  let db = Datascript.db conn in
  let generated_block_count =
    List.length
      (List.filter
         (fun v ->
           match v with
           | String s -> str_includes s "generated block"
           | _ -> false)
         (q_values db "[:find [?title ...] :where [?b :block/title ?title]]"))
  in
  let validation_errors =
    Db_validate.validate_local_db db
    |> List.map (fun (ge : Db_validate.grouped_error) -> ge.Db_validate.ge_entity)
  in
  check tname (generated_block_count >= 60)
    (Printf.sprintf "Seed %d imports the generated block corpus" seed);
  check tname (validation_errors = [])
    (Printf.sprintf "Seed %d generated Markdown file graph validates" seed);
  ignore result

(* cljs validate-local-db! error entities *)
let validation_error_entities (db : db) : value list =
  Db_validate.validate_local_db db
  |> List.map (fun (ge : Db_validate.grouped_error) -> ge.Db_validate.ge_entity)

let check_valid name db =
  let errs = Db_validate.validate_local_db db in
  if errs <> [] then
    List.iter
      (fun (ge : Db_validate.grouped_error) ->
        Printf.eprintf "validation-error entity=%s errors=%d\n%!"
          (match ge.Db_validate.ge_entity with
           | Map _ as m -> "entity=" ^ Edn_util.pr_str m
           | _ -> "other")
          (List.length ge.Db_validate.ge_errors);
        List.iter
          (fun (e : Malli.error) ->
            Printf.eprintf "  in=%s msg=%s\n%!"
              (String.concat "."
                 (List.map
                    (fun v -> match v with Keyword k -> k | _ -> "?")
                    e.Malli.e_in))
              e.Malli.e_message)
          ge.Db_validate.ge_errors)
      errs;
  check name (errs = []) ""

(* test resources dir: deps/graph-parser/test/resources, found by walking
   up from cwd (dune runs tests from deps/db-worker) *)
let test_resources_dir () : string =
  let rec up dir =
    let candidate =
      Filename.concat dir "deps/graph-parser/test/resources"
    in
    if Sys.file_exists (Filename.concat candidate "exporter-test-graph") then
      candidate
    else
      let parent = Filename.dirname dir in
      if parent = dir then
        failwith "cannot locate deps/graph-parser/test/resources"
      else up parent
  in
  up (Sys.getcwd ())

(* ^:integration fixture: logseq/docs at tag v0.10.12. Looked up via env
   vars, the cljs convention <resources>/docs-0.10.12, or a sibling
   checkout repos/logseq-docs-0.10.12. *)
let docs_graph_dir () : string =
  let env_dir =
    match Sys.getenv_opt "LOGSEQ_DOCS_0_10_12_DIR" with
    | Some d -> Some d
    | None -> Sys.getenv_opt "LOGSEQ_DOCS_DIR"
  in
  match env_dir with
  | Some d when Sys.file_exists (Filename.concat d "pages") -> d
  | _ ->
      let local =
        Filename.concat (test_resources_dir ()) "docs-0.10.12"
      in
      if Sys.file_exists (Filename.concat local "pages") then local
      else
        let sibling =
          Filename.concat
            (Filename.dirname (Filename.dirname (test_resources_dir ())))
            "logseq-docs-0.10.12"
        in
        if Sys.file_exists (Filename.concat sibling "pages") then sibling
        else
          (* cljs marks this deftest ^:integration — excluded unless the docs
             checkout is present *)
          Alcotest.skip ()

(* write files into an existing dir — cljs write-temp-file-graph body *)
let write_temp_file_graph_in (dir : string)
    (files : (string * string) list) : string =
  List.iter
    (fun (relative_path, content) ->
      let file_path = Filename.concat dir relative_path in
      ignore (await (File_sys.mkdir_p (Filename.dirname file_path)));
      await (File_sys.write_text file_path content))
    files;
  dir

(* =====================================================================
   Tests (cljs deftests, same order)
   ===================================================================== *)

let local_hhmm (ms : int64) : int * int =
  let tm = Unix.localtime (Int64.to_float ms /. 1000.) in
  (tm.Unix.tm_hour, tm.Unix.tm_min)

(* cljs stores datetime values as plain epoch-ms numbers: they read back as
   Int/Float depending on the platform's numeric rep, Instant only for legacy
   ~t-decoded data *)
let ms_of_value (v : value) : int64 option =
  match v with
  | Int n -> Some (Int64.of_int n)
  | Float f -> Some (Int64.of_float f)
  | Instant ms -> Some ms
  | _ -> None

let journal_day_of_value (v : value) : int =
  match ms_of_value v with
  | Some ms -> Date_time_util.ms_to_journal_day ms
  | None -> -1

let test_import_block_with_journal_ref_and_time_property_value () =
  let file =
    write_temp_graph_file "journals/2023_06_21.md"
      "- DONE foo bar #sometag1 #sometag2\n  completed:: [[Sun, 06.08.2023]] *14:42*\n"
  in
  let conn = create_conn () in
  Outliner_db_pipeline.add_listener conn;
  ignore
    (import_files_to_db [ file ] conn
       { (default_import_opts ()) with
         user_config = [ ("journal/page-title-format", String "EEE, dd.MM.yyyy") ] });
  let db = Datascript.db conn in
  check_some "Block with a journal reference plus time in a property value imports"
    (find_block_re db "foo bar") "";
  check_valid "Imported graph validates" db

let test_import_quote_with_email_address () =
  let file =
    write_temp_graph_file "pages/email.md" "- > \"CachyOS <admin@cachyos.org>\"\n"
  in
  let conn = create_conn () in
  Outliner_db_pipeline.add_listener conn;
  ignore (import_files_to_db [ file ] conn (default_import_opts ()));
  let db = Datascript.db conn in
  let b = find_block_re_exn db "CachyOS" in
  eq "Email addresses inside quotes are preserved during import"
    "\"CachyOS <admin@cachyos.org>\""
    (Option.value ~default:"" (get_string' b "block/title"))
    "";
  check_valid "Imported graph validates" db

let test_import_org_page_title_when_property_appears_in_middle () =
  let file =
    write_temp_graph_file "pages/20230410145300-end_to_end_note.org"
      ":PROPERTIES:\n:ID:       c537c812-1ec9-4f13-adaf-1a39fd7da967\n:END:\n#+title: end_to_end_note\n#+date: <2023-04-10 Mon 14:53>\n#+filetags: :PUBLIC:\n\nabc\n\n#+hugo: more\n\n123\n"
  in
  let conn = create_conn () in
  Outliner_db_pipeline.add_listener conn;
  ignore (import_files_to_db [ file ] conn (default_import_opts ()));
  let db = Datascript.db conn in
  check_some "Org #+title is imported when another property appears in the middle of the file"
    (find_page db "end_to_end_note") "";
  check_none "Importer should not fall back to the org-roam file stem"
    (find_page db "20230410145300-end_to_end_note") "";
  check_valid "Imported graph validates" db

let test_import_empty_journal_file () =
  let file = write_temp_graph_file "journals/2025_11_11.md" "\n" in
  let conn = create_conn () in
  Outliner_db_pipeline.add_listener conn;
  ignore (import_files_to_db [ file ] conn (default_import_opts ()));
  check_valid "Empty imported files do not transact nil block refs"
    (Datascript.db conn)

let test_import_repeated_deadline_and_scheduled () =
  let file =
    write_temp_graph_file "pages/repeated-tasks.md"
      "- TODO wish [[name]] a happy birthday\n  SCHEDULED: <2025-11-01 Sat 08:00 .+1y>\n- TODO prepare weekly report\n  DEADLINE: <2025-11-07 Fri +2w>\n- TODO plan release\n  DEADLINE: <2025-11-08 Sat>\n  SCHEDULED: <2025-11-07 Fri .+1w>\n"
  in
  let conn = create_conn () in
  Outliner_db_pipeline.add_listener conn;
  ignore (import_files_to_db [ file ] conn (default_import_opts ()));
  let db = Datascript.db conn in
  let birthday_props =
    readable_properties (find_block_re_exn db "happy birthday")
  in
  let report_props =
    readable_properties (find_block_re_exn db "weekly report")
  in
  let mixed_props =
    readable_properties (find_block_re_exn db "plan release")
  in
  let get k m = List.assoc_opt k m in
  let scheduled_ms =
    match get "logseq.property/scheduled" birthday_props with
    | Some v -> Option.value ~default:0L (ms_of_value v)
    | None -> 0L
  in
  check "Repeated scheduled timestamp keeps its scheduled date"
    (Date_time_util.ms_to_journal_day scheduled_ms = 20251101) "";
  check "Repeated scheduled timestamp keeps its time"
    ([ 8;
       0 ]
     = (let h, m = local_hhmm scheduled_ms in [ h; m ]))
    "";
  check_v
    "Repeated scheduled timestamp keeps its repeat properties including the `.+` cookie kind"
    (Map
       [ Keyword "logseq.property.repeat/repeated?", Bool true
       ; ( Keyword "logseq.property.repeat/temporal-property",
           Keyword "logseq.property/scheduled" )
       ; ( Keyword "logseq.property.repeat/repeat-type",
           Keyword "logseq.property.repeat/repeat-type.dotted-plus" )
       ; Keyword "logseq.property.repeat/recur-frequency", Int 1
       ; ( Keyword "logseq.property.repeat/recur-unit",
           Keyword "logseq.property.repeat/recur-unit.year" ) ])
    (Map
       (List.filter_map
          (fun k ->
            match List.assoc_opt k birthday_props with
            | Some v -> Some (Keyword k, v)
            | None -> None)
          [ "logseq.property.repeat/repeated?"
          ; "logseq.property.repeat/temporal-property"
          ; "logseq.property.repeat/repeat-type"
          ; "logseq.property.repeat/recur-frequency"
          ; "logseq.property.repeat/recur-unit" ]))
    "";
  let with_day k m =
    List.map
      (fun (a, v) ->
        if a = k then
          ( a,
            match ms_of_value v with
            | Some ms ->
                (Int (Date_time_util.ms_to_journal_day ms) : value)
            | None -> v )
        else (a, v))
      m
  in
  let sel ks m : value =
    Map
      (List.filter_map
         (fun (a, v) ->
           if List.mem a ks then Some (Keyword a, v) else None)
         m)
  in
  check_v
    "Repeated deadline timestamp keeps its repeat properties including the `+` cookie kind"
    (Map
       [ Keyword "logseq.property/deadline", Int 20251107
       ; Keyword "logseq.property.repeat/repeated?", Bool true
       ; ( Keyword "logseq.property.repeat/temporal-property",
           Keyword "logseq.property/deadline" )
       ; ( Keyword "logseq.property.repeat/repeat-type",
           Keyword "logseq.property.repeat/repeat-type.plus" )
       ; Keyword "logseq.property.repeat/recur-frequency", Int 2
       ; ( Keyword "logseq.property.repeat/recur-unit",
           Keyword "logseq.property.repeat/recur-unit.week" ) ])
    (sel
       [ "logseq.property/deadline"; "logseq.property.repeat/repeated?"
       ; "logseq.property.repeat/temporal-property"
       ; "logseq.property.repeat/repeat-type"
       ; "logseq.property.repeat/recur-frequency"
       ; "logseq.property.repeat/recur-unit" ]
       (with_day "logseq.property/deadline" report_props))
    "";
  check_v
    "Mixed deadline and scheduled timestamps keep both dates and the repeated temporal property"
    (Map
       [ Keyword "logseq.property/deadline", Int 20251108
       ; Keyword "logseq.property/scheduled", Int 20251107
       ; Keyword "logseq.property.repeat/repeated?", Bool true
       ; ( Keyword "logseq.property.repeat/temporal-property",
           Keyword "logseq.property/scheduled" )
       ; ( Keyword "logseq.property.repeat/repeat-type",
           Keyword "logseq.property.repeat/repeat-type.dotted-plus" )
       ; Keyword "logseq.property.repeat/recur-frequency", Int 1
       ; ( Keyword "logseq.property.repeat/recur-unit",
           Keyword "logseq.property.repeat/recur-unit.week" ) ])
    (sel
       [ "logseq.property/deadline"; "logseq.property/scheduled"
       ; "logseq.property.repeat/repeated?"
       ; "logseq.property.repeat/temporal-property"
       ; "logseq.property.repeat/repeat-type"
       ; "logseq.property.repeat/recur-frequency"
       ; "logseq.property.repeat/recur-unit" ]
       (with_day "logseq.property/scheduled"
          (with_day "logseq.property/deadline" mixed_props)))
    "";
  check_valid "Imported graph validates" db

let status_ident (db : db) (content : string) : value option =
  match block_status db content with
  | Some s -> Ldb.value s "db/ident"
  | None -> None

let test_import_preserves_legacy_task_markers_as_status_choices () =
  let file =
    write_temp_graph_file "pages/tasks.md"
      "- TODO\n- DONE\n- I recorded a [[voice note]].\n  - TODO\n- TODO todo item\n- LATER later item\n- NOW now item\n- DOING doing item\n- WAIT waiting item\n- WAITING waiting full item\n- IN-PROGRESS in-progress item\n- DONE done item\n"
  in
  let conn = create_conn () in
  Outliner_db_pipeline.add_listener conn;
  ignore (import_files_to_db [ file ] conn (default_import_opts ()));
  let db = Datascript.db conn in
  check_v "TODO still imports to the built-in Todo status"
    (Keyword "logseq.property/status.todo")
    (Option.value ~default:Nil (status_ident db "todo item")) "";
  check_v "DOING still imports to the built-in Doing status"
    (Keyword "logseq.property/status.doing")
    (Option.value ~default:Nil (status_ident db "doing item")) "";
  check_v "DONE still imports to the built-in Done status"
    (Keyword "logseq.property/status.done")
    (Option.value ~default:Nil (status_ident db "done item")) "";
  let freq =
    List.fold_left
      (fun tbl b ->
        match prop_get b "logseq.property/status" with
        | Some v ->
            Hashtbl.replace tbl v
              (1 + Option.value ~default:0 (Hashtbl.find_opt tbl v));
            tbl
        | None -> tbl)
      (Hashtbl.create 5) (task_blocks_by_title db "")
  in
  check "Built-in task markers without titles still import as tasks"
    (Option.value ~default:0
       (Hashtbl.find_opt freq (Keyword "logseq.property/status.todo"))
     = 2
    && Option.value ~default:0
         (Hashtbl.find_opt freq (Keyword "logseq.property/status.done"))
       = 1) "";
  let nested_empty_task =
    List.hd (ordered_children (find_block_re_exn db "recorded"))
  in
  eq "Nested nameless task keeps an empty title" ""
    (Option.value ~default:""
       (get_string' nested_empty_task "block/title"))
    "";
  check_v "Nested nameless TODO keeps its task properties"
    (Map
       [ ( Keyword "logseq.property/status",
           Keyword "logseq.property/status.todo" )
       ; Keyword "block/tags", Vector [ Keyword "logseq.class/Task" ] ])
    (props_select
       [ "logseq.property/status"; "block/tags" ]
       nested_empty_task)
    "";
  check_v "LATER imports to the built-in Todo status"
    (Keyword "logseq.property/status.todo")
    (Option.value ~default:Nil (status_ident db "later item")) "";
  check_v "NOW imports to the built-in Doing status"
    (Keyword "logseq.property/status.doing")
    (Option.value ~default:Nil (status_ident db "now item")) "";
  check_v "WAIT imports as its own status choice" (String "WAIT")
    (Option.value ~default:Nil (status_content db "waiting item")) "";
  check_v "WAITING imports as its own status choice" (String "WAITING")
    (Option.value ~default:Nil (status_content db "waiting full item")) "";
  check_v "IN-PROGRESS imports as its own status choice"
    (String "IN-PROGRESS")
    (Option.value ~default:Nil (status_content db "in-progress item")) "";
  let closed = status_closed_value_contents db in
  check "Custom imported markers are added to Status closed values"
    (List.for_all (fun s -> List.mem s closed)
       [ "WAIT"; "WAITING"; "IN-PROGRESS" ])
    "";
  check_valid "Imported graph validates" db

let test_import_custom_task_marker_across_multiple_files () =
  let first_file =
    write_temp_graph_file "pages/custom-status-a.md"
      "- WAITING first custom status item\n"
  in
  let second_file =
    write_temp_graph_file "pages/custom-status-b.md"
      "- WAITING second custom status item\n"
  in
  let conn = create_conn () in
  Outliner_db_pipeline.add_listener conn;
  ignore
    (import_files_to_db [ first_file; second_file ] conn
       (default_import_opts ()));
  let db = Datascript.db conn in
  check_v "Custom status marker imports from the first file"
    (String "WAITING")
    (Option.value ~default:Nil (status_content db "first custom status item"))
    "";
  check_v "Custom status marker imports from the second file"
    (String "WAITING")
    (Option.value ~default:Nil (status_content db "second custom status item"))
    "";
  eq "Custom status closed value is shared across imported files" 1
    (Option.value ~default:0
       (Hashtbl.find_opt
          (status_closed_value_content_frequencies db)
          "WAITING"))
    "";
  check_valid "Imported graph validates" db

let test_import_repairs_duplicated_block_ids () =
  let duplicated_uuid = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" in
  let file =
    write_temp_graph_file "pages/duplicated-ids.md"
      (Printf.sprintf
         "- First duplicated id\n  id:: %s\n- Second duplicated id\n  id:: %s\n"
         duplicated_uuid duplicated_uuid)
  in
  let conn = create_conn () in
  Outliner_db_pipeline.add_listener conn;
  ignore (import_files_to_db [ file ] conn (default_import_opts ()));
  let db = Datascript.db conn in
  let first_block = find_block_exn db "First duplicated id" in
  let second_block = find_block_exn db "Second duplicated id" in
  check_v "The first imported block keeps the original id"
    (Uuid duplicated_uuid)
    (Option.value ~default:Nil (getv' first_block "block/uuid")) "";
  check_some "The duplicate imported block gets a replacement id"
    (getv' second_block "block/uuid") "";
  check "The duplicate imported block does not keep the conflicting id"
    (getv' second_block "block/uuid" <> Some (Uuid duplicated_uuid)) "";
  check_valid "Imported graph validates" db

let test_import_removes_pre_block_marker_and_missing_block_refs () =
  let missing_uuid = "11111111-1111-1111-1111-111111111111" in
  let missing_embed_uuid = "55555555-5555-5555-5555-555555555555" in
  let target_uuid = "22222222-2222-2222-2222-222222222222" in
  let empty_title_property_uuid = "33333333-3333-3333-3333-333333333333" in
  let empty_title_parent_uuid = "44444444-4444-4444-4444-444444444444" in
  let source_file =
    write_temp_graph_file "pages/A.md"
      (Printf.sprintf
         "Plain pre-block\n- Missing ref ((%s))\n- {{embed ((%s))}}\n- Existing ref ((%s))\n- ((%s))\n  heading:: true\n  background-color:: yellow\n- ((%s))\n  - Child survives\n"
         missing_uuid missing_embed_uuid target_uuid
         empty_title_property_uuid empty_title_parent_uuid)
  in
  let target_file =
    write_temp_graph_file "pages/Z.md"
      (Printf.sprintf "- Target block\n  id:: %s\n" target_uuid)
  in
  let conn = create_conn () in
  Outliner_db_pipeline.add_listener conn;
  ignore
    (import_files_to_db [ source_file; target_file ] conn
       (default_import_opts ()));
  let db = Datascript.db conn in
  let missing_block = find_block_re_exn db "Missing ref" in
  let existing_block = find_block_re_exn db "Existing ref" in
  let target_block = find_block_exn db "Target block" in
  let empty_title_blocks = blocks_by_title db "" in
  let empty_title_property_block =
    List.find_opt
      (fun b ->
        match getv' b "logseq.property/heading" with
        | Some (Bool true) -> true
        | _ -> false)
      empty_title_blocks
  in
  let empty_title_parent_block =
    List.find_opt
      (fun b ->
        List.exists
          (fun child ->
            Ldb.string_value child "block/title" = Some "Child survives")
          (ordered_children b))
      empty_title_blocks
  in
  check "Legacy pre-block markers are never transacted"
    (not
       (Seq.exists (fun (d : datom) -> d.a = "block/pre-block?")
          (Datascript.datoms db Eavt ())))
    "";
  eq "Missing OG block refs are removed from imported content" "Missing ref"
    (Option.value ~default:"" (get_string' missing_block "block/title"))
    "";
  check "Missing OG block refs are removed from imported refs"
    (ref_ents' missing_block "block/refs" = []) "";
  check_none "Missing OG block refs do not leave placeholder entities"
    (Datascript.entity db (Lookup_ref ("block/uuid", Uuid missing_uuid)))
    "";
  check_none
    "Missing OG block embeds do not leave placeholder entities"
    (Datascript.entity db
       (Lookup_ref ("block/uuid", Uuid missing_embed_uuid)))
    "";
  check "Missing OG block embeds do not leave dangling block links"
    (q_eids db
       "[:find ?b :where [?b :block/link ?target] [(missing? $ ?target :block/uuid)]]"
     = [])
    "";
  check_none
    "Missing OG block refs in empty-title property blocks do not leave placeholder entities"
    (Datascript.entity db
       (Lookup_ref ("block/uuid", Uuid empty_title_property_uuid)))
    "";
  check_none
    "Missing OG block refs in empty-title parent blocks do not leave placeholder entities"
    (Datascript.entity db
       (Lookup_ref ("block/uuid", Uuid empty_title_parent_uuid)))
    "";
  eq "Blocks whose titles become empty after cleanup are preserved" 3
    (List.length empty_title_blocks) "";
  (match empty_title_property_block with
   | Some b ->
       check "Empty-title blocks keep imported heading properties"
         (getv' b "logseq.property/heading" = Some (Bool true)) "";
       check_v "Empty-title blocks keep imported background colors"
         (String "yellow")
         (Option.value ~default:Nil
            (prop_get b "logseq.property/background-color"))
         ""
   | None ->
       check "Empty-title property block exists" false "");
  (match empty_title_parent_block with
   | Some b ->
       check "Empty-title parent blocks keep their children"
         (List.filter_map
            (fun c -> Ldb.string_value c "block/title")
            (ordered_children b)
          = [ "Child survives" ])
         ""
   | None -> check "Empty-title parent block exists" false "");
  eq "Existing block refs are preserved, including forward refs from later files"
    [ target_block.id ]
    (List.map (fun e -> e.id) (ref_ents' existing_block "block/refs"))
    "";
  check_valid "Imported graph validates" db

let test_import_converts_markdown_headings_to_db_heading_metadata () =
  let file =
    write_temp_graph_file "pages/headings.md"
      "# Top H1\n## Top H2\n### Top H3\n#### Top H4\n##### Top H5\n###### Top H6\n- # List H1\n- ## List H2\n- ### List H3\n- #### List H4\n- ##### List H5\n- ###### List H6\n- ####### Too many hashes\n- #hashtag-not-heading remains text\n- regular block\n- Auto heading\n  heading:: true\n- Numbered heading property\n  heading:: 3\n- ## TODO task heading\n- ## Parent heading\n  - child of heading\n"
  in
  let conn = create_conn () in
  Outliner_db_pipeline.add_listener conn;
  ignore (import_files_to_db [ file ] conn (default_import_opts ()));
  let db = Datascript.db conn in
  List.iter
    (fun (pattern, title, level) ->
      let block = find_block_re db pattern in
      check_some ("imported markdown heading " ^ title) block "";
      (match block with
       | Some b ->
           eq (title ^ " is stored without markdown heading markers")
             title
             (Option.value ~default:"" (get_string' b "block/title"))
             "";
           check
             (title ^ " does not start with #")
             (not
                (str_starts_with
                   (Option.value ~default:"" (get_string' b "block/title"))
                   "#"))
             "";
           check_v (title ^ " heading level is " ^ string_of_int level)
             (Int level)
             (Option.value ~default:Nil
                (getv' b "logseq.property/heading"))
             ""
       | None -> ()))
    [ ("Top H1$", "Top H1", 1); ("Top H2$", "Top H2", 2)
    ; ("Top H3$", "Top H3", 3); ("Top H4$", "Top H4", 4)
    ; ("Top H5$", "Top H5", 5); ("Top H6$", "Top H6", 6)
    ; ("List H1$", "List H1", 1); ("List H2$", "List H2", 2)
    ; ("List H3$", "List H3", 3); ("List H4$", "List H4", 4)
    ; ("List H5$", "List H5", 5); ("List H6$", "List H6", 6) ];
  let too_many = find_block_re_exn db "Too many hashes" in
  let hashtag = find_block_re_exn db "remains text" in
  let regular = find_block_exn db "regular block" in
  let auto = find_block_exn db "Auto heading" in
  let numbered = find_block_exn db "Numbered heading property" in
  let task = find_block_re_exn db "task heading$" in
  let parent = find_block_re_exn db "Parent heading$" in
  let child = find_block_exn db "child of heading" in
  eq "Seven-hash titles still drop literal heading markers"
    "Too many hashes"
    (Option.value ~default:"" (get_string' too_many "block/title")) "";
  check_some "Parser-assigned heading metadata is kept for seven-hash titles"
    (getv' too_many "logseq.property/heading") "";
  check "Hashtags without a space are not treated as headings"
    (str_includes
       (Option.value ~default:"" (get_string' hashtag "block/title"))
       "remains text") "";
  check_none "Hashtag blocks do not get heading metadata"
    (getv' hashtag "logseq.property/heading") "";
  check_none "Regular blocks are not headings"
    (getv' regular "logseq.property/heading") "";
  check "heading:: true imports as auto heading metadata"
    (getv' auto "logseq.property/heading" = Some (Bool true)) "";
  eq "heading:: true keeps the title without markdown markers"
    "Auto heading"
    (Option.value ~default:"" (get_string' auto "block/title")) "";
  check_v "heading:: 3 imports as heading level 3" (Int 3)
    (Option.value ~default:Nil (getv' numbered "logseq.property/heading"))
    "";
  eq "heading:: 3 keeps the title without markdown markers"
    "Numbered heading property"
    (Option.value ~default:"" (get_string' numbered "block/title")) "";
  eq "Task heading titles are stored without markdown heading markers"
    "task heading"
    (Option.value ~default:"" (get_string' task "block/title")) "";
  check_v "Task heading keeps heading level from markdown syntax" (Int 2)
    (Option.value ~default:Nil (getv' task "logseq.property/heading")) "";
  check_v "Task heading still imports as a TODO task"
    (Keyword "logseq.property/status.todo")
    (Option.value ~default:Nil (prop_get task "logseq.property/status")) "";
  eq "Parent heading title is stored without markdown heading markers"
    "Parent heading"
    (Option.value ~default:"" (get_string' parent "block/title")) "";
  check_v "Parent heading level is imported" (Int 2)
    (Option.value ~default:Nil (getv' parent "logseq.property/heading")) "";
  check "Heading parent keeps its children"
    (List.filter_map
       (fun c -> Ldb.string_value c "block/title")
       (ordered_children parent)
     = [ "child of heading" ])
    "";
  check_none "Child of a heading is not itself a heading"
    (getv' child "logseq.property/heading") "";
  check_valid "Imported graph validates" db

let test_import_generated_markdown_file_graph () =
  List.iter
    (fun seed ->
      assert_generated_md_file_graph_imports
        "import-generated-markdown-file-graph" seed)
    generated_file_graph_test_seeds

let test_import_generated_markdown_file_graph_fuzz () =
  (* ^:integration — seeds 1-100 *)
  if not (integration_tests_enabled ()) then Alcotest.skip ();
  List.iter
    (assert_generated_md_file_graph_imports
       "import-generated-markdown-file-graph-fuzz")
    (List.init 100 (fun i -> i + 1))

let test_export_doc_files_propagates_missing_block_ref_cleanup_report () =
  let missing_uuid = "55555555-5555-5555-5555-555555555555" in
  let tx_reports = ref [] in
  let file =
    write_temp_graph_file "pages/A.md"
      (Printf.sprintf "- Missing ref ((%s))\n" missing_uuid)
  in
  let conn = create_conn () in
  Outliner_db_pipeline.add_listener conn;
  let doc_options =
    Gp.build_doc_options
      [ ("macros", Map []); ("file/name-format", Keyword "triple-lowbar") ]
      { (default_export_options ()) with
        Gp.user_options =
          { (Gp.default_user_options ()) with Gp.convert_all_tags = false }
      ; Gp.on_tx_report = (fun r -> tx_reports := r :: !tx_reports) }
  in
  Gp_block.export_to_db_graph := true;
  Fun.protect
    ~finally:(fun () -> Gp_block.export_to_db_graph := false)
    (fun () ->
      ignore
        (await
           (Gp.export_doc_files conn [ [ ("path", String file) ] ]
              doc_options)));
  check
    "Missing block ref cleanup tx-report is propagated to import callers"
    (List.exists
       (fun r -> report_retracts_block_uuid r missing_uuid)
       !tx_reports)
    "";
  check_none "Missing OG block ref placeholder is removed"
    (Datascript.entity (Datascript.db conn)
       (Lookup_ref ("block/uuid", Uuid missing_uuid)))
    ""

let test_export_doc_files_continues_after_export_file_failure () =
  let attempted_paths = ref [] in
  let graph_dir =
    write_temp_file_graph
      [ ("pages/A.md", "- first\n"); ("pages/B.md", "- second\n") ]
  in
  let first_file =
    Common_path.path_join graph_dir [ "pages"; "A.md" ]
  in
  let second_file =
    Common_path.path_join graph_dir [ "pages"; "B.md" ]
  in
  let conn = create_conn () in
  let notifications = ref [] in
  let export_file (conn' : conn) (m : BM.t) (opts : Gp.options) : unit Eff.t =
    let path = Option.value ~default:"" (BM.string_attr m "file/path") in
    attempted_paths := path :: !attempted_paths;
    if path = first_file then
      Eff.error (Failure "worker transact failed")
    else
      match BM.string_attr m "file/path", BM.string_attr m "file/content" with
      | Some p, Some c ->
          Eff.map ignore (Gp.add_file_to_db_graph conn' p c opts)
      | _ -> Eff.pure ()
  in
  let doc_options =
    Gp.build_doc_options
      [ ("macros", Map []); ("file/name-format", Keyword "triple-lowbar") ]
      { (default_export_options ()) with
        Gp.notify_user = (fun m -> notifications := m :: !notifications)
      ; Gp.user_options =
          { (Gp.default_user_options ()) with Gp.convert_all_tags = false }
      ; Gp.export_file = Some export_file }
  in
  (try
     Gp_block.export_to_db_graph := true;
     Fun.protect
       ~finally:(fun () -> Gp_block.export_to_db_graph := false)
       (fun () ->
         ignore
           (await
              (Gp.export_doc_files conn
                 [ [ ("path", String first_file) ]
                 ; [ ("path", String second_file) ] ]
                 doc_options)))
   with e ->
     check
       ("Single file failure should not abort import: "
        ^ Printexc.to_string e)
       false "");
  let db = Datascript.db conn in
  eq "Import continues with later files after one export failure"
    [ first_file; second_file ] (List.rev !attempted_paths) "";
  eq "Failed files are recorded in import state" [ first_file ]
    (List.filter_map
       (fun f -> BM.string_attr f "path")
       !(doc_options.Gp.import_state.ignored_files))
    "";
  check "The failed file is reported to the user"
    (List.exists
       (fun m ->
         match BM.attr_value m "level" with
         | Some (Keyword "error") | Some (String "error") -> true
         | _ -> false)
       !notifications)
    "";
  check_some "Later files are still imported" (find_block db "second") "";
  check_none "The failed file is not imported" (find_block db "first") ""

(* ----- timestamp tests ----- *)

let instant_ms (iso : string) : int64 =
  match Date_time_util.epoch_ms_of_iso iso with
  | Some ms -> ms
  | None -> failwith ("bad ISO instant: " ^ iso)

let block_created_at (e : entity) : int64 option =
  Ldb.int64_value e "block/created-at"

let block_updated_at (e : entity) : int64 option =
  Ldb.int64_value e "block/updated-at"

let test_export_doc_files_preserves_filesystem_timestamps () =
  let created_at = instant_ms "2020-01-02T03:04:05.000Z" in
  let modified_at = instant_ms "2021-06-07T08:09:10.000Z" in
  let source_file = im_file "pages/A.md" "- [[Timestamps]]\n" in
  let file = im_file "pages/timestamps.md" "- timestamped\n" in
  let conn =
    export_in_memory_doc_files [ source_file; file ]
      [ ( file.im_path,
          { File_sys.birthtime_ms = Some (Int64.to_float created_at)
          ; mtime_ms = Some (Int64.to_float modified_at) } ) ]
  in
  let db = Datascript.db conn in
  let page = Option.get (Ldb.get_page db (String "timestamps")) in
  let block = find_block_exn db "timestamped" in
  check "timestamps preserved"
    (block_created_at page = Some created_at
     && block_created_at block = Some created_at
     && block_updated_at page = Some modified_at
     && block_updated_at block = Some modified_at)
    "";
  check_valid "" db

let test_export_doc_files_uses_serialized_file_timestamps_without_stat () =
  let created_at = instant_ms "2020-01-02T03:04:05.000Z" in
  let modified_at = instant_ms "2021-06-07T08:09:10.000Z" in
  let file =
    im_file ~created_at ~updated_at:modified_at "pages/sport.md"
      "alias:: sportlich\n"
  in
  let conn = export_in_memory_doc_files [ file ] [] in
  let db = Datascript.db conn in
  let page = Option.get (Ldb.get_page db (String "sport")) in
  check "serialized timestamps used"
    (block_created_at page = Some created_at
     && block_updated_at page = Some modified_at)
    "";
  check_valid "" db

let test_export_doc_files_preserves_alias_only_page_file_timestamps () =
  let created_at = instant_ms "2024-03-09T19:03:41.000Z" in
  let modified_at = instant_ms "2024-03-08T21:19:12.000Z" in
  let mention = im_file "journals/2024_01_01.md" "- [[Sport]]\n" in
  let file = im_file "pages/Sport.md" "alias:: sportlich\n" in
  let conn =
    export_in_memory_doc_files [ mention; file ]
      [ ( file.im_path,
          { File_sys.birthtime_ms = Some (Int64.to_float created_at)
          ; mtime_ms = Some (Int64.to_float modified_at) } ) ]
  in
  let db = Datascript.db conn in
  let page = Option.get (Ldb.get_page db (String "sport")) in
  check "alias-only page file timestamps preserved"
    (block_created_at page = Some created_at
     && block_updated_at page = Some modified_at)
    "";
  check_valid "" db

let test_export_doc_files_preserves_multi_alias_page_file_timestamps () =
  let created_at = instant_ms "2025-01-03T13:45:32.000Z" in
  let modified_at = instant_ms "2025-03-02T03:31:18.000Z" in
  let mention = im_file "journals/2024_01_01.md" "- [[schlafe]]\n" in
  let file =
    im_file "pages/Schlaf.md"
      "alias:: schlafe, schlafen, geschlafen, Schlafrhythmus, wach\n\n- ## Problems\n"
  in
  let conn =
    export_in_memory_doc_files [ mention; file ]
      [ ( file.im_path,
          { File_sys.birthtime_ms = Some (Int64.to_float created_at)
          ; mtime_ms = Some (Int64.to_float modified_at) } ) ]
  in
  let db = Datascript.db conn in
  let page = Option.get (Ldb.get_page db (String "schlaf")) in
  let alias_page = Option.get (Ldb.get_page db (String "schlafe")) in
  check "multi-alias page file timestamps preserved"
    (block_created_at page = Some created_at
     && block_updated_at page = Some modified_at)
    "";
  check "alias names"
    (List.sort compare
       (List.filter_map
          (fun e -> Ldb.string_value e "block/name")
          (ref_ents' page "block/alias"))
     = List.sort compare
         [ "schlafe"; "schlafen"; "geschlafen"; "schlafrhythmus"; "wach" ])
    "";
  check "alias source page"
    (match Ldb.get_alias_source_page db alias_page.id with
     | Some e -> e.id = page.id
     | None -> false)
    "";
  check_valid "" db

let test_export_doc_files_uses_first_journal_mention_for_fileless_pages () =
  let journal_day = 20240308 in
  let expected = Date_time_util.int_to_local_ms journal_day in
  let journal =
    im_file "journals/2024_03_08.md" "- first mention [[Referenced Only]]\n"
  in
  let later =
    im_file "journals/2024_06_01.md" "- later mention [[Referenced Only]]\n"
  in
  let conn = export_in_memory_doc_files [ journal; later ] [] in
  let db = Datascript.db conn in
  let page = Option.get (Ldb.get_page db (String "referenced only")) in
  check "first journal mention gives fileless page timestamps"
    (block_created_at page = Some expected
     && block_updated_at page = Some expected)
    "";
  check_valid "" db

let test_export_doc_files_keeps_journal_day_when_journal_has_file_stats () =
  let expected = Date_time_util.int_to_local_ms 20240308 in
  let file_created_at = instant_ms "2025-08-01T00:00:00.000Z" in
  let file_updated_at = instant_ms "2025-08-02T00:00:00.000Z" in
  let journal =
    im_file "journals/2024_03_08.md" "- first mention [[Referenced Only]]\n"
  in
  let conn =
    export_in_memory_doc_files [ journal ]
      [ ( journal.im_path,
          { File_sys.birthtime_ms = Some (Int64.to_float file_created_at)
          ; mtime_ms = Some (Int64.to_float file_updated_at) } ) ]
  in
  let db = Datascript.db conn in
  let page = Option.get (Ldb.get_page db (String "referenced only")) in
  check "journal day wins over file stats for referenced pages"
    (block_created_at page = Some expected
     && block_updated_at page = Some expected)
    "";
  check_valid "" db

let test_export_doc_files_keeps_journal_page_created_at_on_journal_day () =
  let expected = Date_time_util.int_to_local_ms 20240308 in
  let modified_at = instant_ms "2025-08-02T00:00:00.000Z" in
  let journal = im_file "journals/2024_03_08.md" "- journal block\n" in
  let conn =
    export_in_memory_doc_files [ journal ]
      [ ( journal.im_path,
          { File_sys.birthtime_ms = None
          ; mtime_ms = Some (Int64.to_float modified_at) } ) ]
  in
  let db = Datascript.db conn in
  let page = find_page_exn db "Mar 8th, 2024" in
  let block = find_block_exn db "journal block" in
  check "journal page created-at is journal day"
    (block_created_at page = Some expected
     && block_created_at block = Some expected
     && block_created_at page <> Some modified_at)
    "";
  check_valid "" db

let test_export_doc_files_keeps_journal_day_when_journal_mentions_another_date () =
  let expected = Date_time_util.int_to_local_ms 20240308 in
  let journal =
    im_file "journals/2024_03_08.md"
      "- first mention [[Referenced Only]] [[Mar 9th, 2024]]\n"
  in
  let conn = export_in_memory_doc_files [ journal ] [] in
  let db = Datascript.db conn in
  let page = Option.get (Ldb.get_page db (String "referenced only")) in
  check "journal day wins over other date mentions"
    (block_created_at page = Some expected
     && block_updated_at page = Some expected)
    "";
  check_valid "" db

let test_export_doc_files_keeps_file_timestamps_when_page_mentions_one_journal () =
  let created_at = instant_ms "2020-01-02T03:04:05.000Z" in
  let modified_at = instant_ms "2021-06-07T08:09:10.000Z" in
  let file = im_file "pages/foo.md" "- [[Mar 8th, 2024]]\n" in
  let conn =
    export_in_memory_doc_files [ file ]
      [ ( file.im_path,
          { File_sys.birthtime_ms = Some (Int64.to_float created_at)
          ; mtime_ms = Some (Int64.to_float modified_at) } ) ]
  in
  let db = Datascript.db conn in
  let page = Option.get (Ldb.get_page db (String "foo")) in
  check "file timestamps kept when page mentions one journal"
    (block_created_at page = Some created_at
     && block_updated_at page = Some modified_at)
    "";
  check_valid "" db

let test_export_doc_files_keeps_journal_mention_when_later_file_has_no_stats () =
  let expected = Date_time_util.int_to_local_ms 20240308 in
  let mention =
    im_file "journals/2024_03_08.md" "- [[Later File]]\n"
  in
  let file = im_file "pages/Later File.md" "- later file\n" in
  let conn = export_in_memory_doc_files [ mention; file ] [] in
  let db = Datascript.db conn in
  let page = Option.get (Ldb.get_page db (String "later file")) in
  check "journal mention timestamp kept when later file has no stats"
    (block_created_at page = Some expected
     && block_updated_at page = Some expected)
    "";
  check_valid "" db

let test_export_doc_file_ignores_epoch_zero_birthtime () =
  let modified_at = instant_ms "2021-06-07T08:09:10.000Z" in
  let file = im_file "pages/epoch.md" "- epoch birth\n" in
  let conn =
    export_in_memory_doc_files [ file ]
      [ ( file.im_path,
          { File_sys.birthtime_ms = Some 0.
          ; mtime_ms = Some (Int64.to_float modified_at) } ) ]
  in
  let db = Datascript.db conn in
  let page = Option.get (Ldb.get_page db (String "epoch")) in
  check "epoch-zero birthtime ignored"
    (block_created_at page = Some modified_at
     && block_updated_at page = Some modified_at)
    "";
  check_valid "" db

let test_export_doc_file_uses_mtime_when_birthtime_missing () =
  let modified_at = instant_ms "2021-06-07T08:09:10.000Z" in
  let file = im_file "pages/mtime-only.md" "- mtime only\n" in
  let conn =
    export_in_memory_doc_files [ file ]
      [ ( file.im_path,
          { File_sys.birthtime_ms = None
          ; mtime_ms = Some (Int64.to_float modified_at) } ) ]
  in
  let db = Datascript.db conn in
  let page = Option.get (Ldb.get_page db (String "mtime-only")) in
  check "mtime used when birthtime missing"
    (block_created_at page = Some modified_at
     && block_updated_at page = Some modified_at)
    "";
  check_valid "" db

let test_export_doc_files_uses_file_mtime_when_journal_mentions_page () =
  let journal_day_ms = Date_time_util.int_to_local_ms 20240308 in
  let modified_at = instant_ms "2021-06-07T08:09:10.000Z" in
  let mention = im_file "journals/2024_03_08.md" "- [[Mtime Page]]\n" in
  let file = im_file "pages/Mtime Page.md" "- see [[Mtime Page]]\n" in
  let conn =
    export_in_memory_doc_files [ mention; file ]
      [ ( file.im_path,
          { File_sys.birthtime_ms = None
          ; mtime_ms = Some (Int64.to_float modified_at) } ) ]
  in
  let db = Datascript.db conn in
  let page = Option.get (Ldb.get_page db (String "mtime page")) in
  check "file mtime wins over journal mention"
    (block_created_at page = Some modified_at
     && block_updated_at page = Some modified_at
     && block_created_at page <> Some journal_day_ms)
    "";
  check_valid "" db

let test_export_doc_files_keeps_existing_file_timestamps_when_journal_mentions_page () =
  let created_at = instant_ms "2020-01-02T03:04:05.000Z" in
  let modified_at = instant_ms "2021-06-07T08:09:10.000Z" in
  let file = im_file "pages/Existing File.md" "- existing file\n" in
  let mention =
    im_file "journals/2024_03_08.md" "- [[Existing File]]\n"
  in
  let conn =
    export_in_memory_doc_files [ file ]
      [ ( file.im_path,
          { File_sys.birthtime_ms = Some (Int64.to_float created_at)
          ; mtime_ms = Some (Int64.to_float modified_at) } ) ]
  in
  ignore (export_in_memory_doc_files ~conn [ mention ] []);
  let db = Datascript.db conn in
  let page = Option.get (Ldb.get_page db (String "existing file")) in
  check "existing file timestamps kept"
    (block_created_at page = Some created_at
     && block_updated_at page = Some modified_at)
    "";
  check_valid "" db

let test_export_doc_file_accepts_numeric_last_modified_at () =
  let modified_at = instant_ms "2021-06-07T08:09:10.000Z" in
  let file_bm =
    [ ("path", String "pages/numeric.md")
    ; ("content", String "- numeric mtime\n")
    ; ("last-modified-at", Instant modified_at) ]
  in
  let conn = create_conn () in
  Outliner_db_pipeline.add_listener conn;
  let get_file_stat (_ : string) : File_sys.file_stat option Eff.t =
    Eff.pure None
  in
  let export_file (conn' : conn) (m : BM.t) (opts : Gp.options) : unit Eff.t =
    match BM.string_attr m "file/path", BM.string_attr m "file/content" with
    | Some p, Some c ->
        Eff.map ignore (Gp.add_file_to_db_graph conn' p c opts)
    | _ -> Eff.pure ()
  in
  let doc_options =
    Gp.build_doc_options
      [ ("macros", Map []); ("file/name-format", Keyword "triple-lowbar") ]
      { (default_export_options ()) with
        Gp.user_options =
          { (Gp.default_user_options ()) with Gp.convert_all_tags = false }
      ; Gp.read_file =
          (fun f ->
            match BM.string_attr f "content" with
            | Some c -> Eff.pure c
            | None -> Eff.error (Failure "missing content"))
      ; Gp.get_file_stat = Some get_file_stat
      ; Gp.export_file = Some export_file }
  in
  Gp_block.export_to_db_graph := true;
  Fun.protect
    ~finally:(fun () -> Gp_block.export_to_db_graph := false)
    (fun () ->
      ignore (await (Gp.export_doc_files conn [ file_bm ] doc_options)));
  let db = Datascript.db conn in
  let page = Option.get (Ldb.get_page db (String "numeric")) in
  check "numeric last-modified-at accepted"
    (block_created_at page = Some modified_at
     && block_updated_at page = Some modified_at)
    "";
  check_valid "" db

let test_update_asset_links_in_block_title () =
  let ignored = ref [] in
  let run (title, asset_path, expected) =
    let actual =
      Gp.update_asset_links_in_block_title title
        [ (asset_path, "UUID") ] ignored
    in
    eq "update-asset-links" expected actual ""
  in
  run
    ( "![greg-popovich-thumbs-up.png](../assets/greg-popovich-thumbs-up_1704749687791_0.png){:height 288, :width 100} says pop"
    , "assets/greg-popovich-thumbs-up_1704749687791_0.png"
    , "[[UUID]] says pop" );
  run
    ( "![some-title](../assets/CleanShot_2022-10-12_at_15.53.20@2x_1665561216083_0.png)"
    , "assets/CleanShot_2022-10-12_at_15.53.20@2x_1665561216083_0.png"
    , "[[UUID]]" );
  run
    ( "[[FIRST UUID]] and ![dino!](assets/subdir/partydino.gif)"
    , "assets/subdir/partydino.gif"
    , "[[FIRST UUID]] and [[UUID]]" )

(* cljs (hash s) for strings -> goog.string.hashCode (31-rolling, unsigned
   32-bit) — used for the hls__<name>__<hash> file renames *)
let cljs_string_hash (s : string) : string =
  let h = ref 0l in
  String.iter
    (fun c ->
      h :=
        Int32.add
          (Int32.mul 31l !h)
          (Int32.of_int (Char.code c)))
    s;
  Int64.to_string (Int64.logand (Int64.of_int32 !h) 0xFFFFFFFFL)

let test_import_missing_local_pdf_asset_link_is_ignored_quietly () =
  let graph_dir =
    write_temp_file_graph
      [ ("logseq/config.edn", "{}")
      ; ( "pages/missing-asset.md",
          "- Missing local PDF [paper](../assets/missing-paper.pdf)\n" ) ]
  in
  let conn = create_conn () in
  let asset_ids = ref [] in
  let result =
    import_file_graph_to_db graph_dir conn
      { (default_import_opts ()) with assets_ids = Some asset_ids }
  in
  let db = Datascript.db conn in
  let ignored_assets = ignored_entries "ignored-assets" result in
  check "Missing local PDF asset links are reported through ignored assets"
    (List.length ignored_assets = 1
     && (match ignored_assets with
         | [ entry ] ->
             (match
                List.assoc_opt (Keyword "reason") entry,
                List.assoc_opt (Keyword "path") entry
              with
              | Some (String r), Some (String p) | Some (Keyword r), Some (String p) ->
                  r = "No asset data found for this asset path"
                  && p = "../assets/missing-paper.pdf"
              | _ -> false)
         | _ -> false))
    "";
  (* cljs also asserts no console *error* output via js/process.stderr.write
     interception — not interceptable natively; the observable state (ignored
     asset entry + clean validation) is asserted. *)
  check_valid "Imported graph validates" db

let test_extract_template_blocks () =
  let page_uuid = gen_uuid () in
  let parent_uuid = gen_uuid () in
  let child_uuid = gen_uuid () in
  let include_children_only_uuid = gen_uuid () in
  let child_only_1_uuid = gen_uuid () in
  let child_only_2_uuid = gen_uuid () in
  let page_ref_v u = Vector [ Keyword "block/uuid"; Uuid u ] in
  let parent_map u : value =
    Map [ (Keyword "block/uuid", Uuid u) ]
  in
  let props_map kvs : value =
    Map (List.map (fun (k, v) -> Keyword k, v) kvs)
  in
  let kws ss = Vector (List.map (fun s -> Keyword s) ss) in
  let blocks : BM.t list =
    [ [ ("block/uuid", Uuid parent_uuid)
      ; ("block/title", String "source parent")
      ; ("block/page", page_ref_v page_uuid)
      ; ("block/parent", parent_map page_uuid)
      ; ("block/order", String "a")
      ; ( "block/properties",
          props_map
            [ "template", String "  trimmed template  "
            ; "name", String "" ] )
      ; ( "block/properties-text-values",
          props_map
            [ "template", String "  trimmed template  "
            ; "name", String "" ] )
      ; ("block/properties-order", kws [ "template"; "name" ]) ]
    ; [ ("block/uuid", Uuid child_uuid)
      ; ("block/title", String "child")
      ; ("block/page", page_ref_v page_uuid)
      ; ("block/parent", page_ref_v parent_uuid)
      ; ("block/order", String "b")
      ; ( "block/properties",
          props_map
            [ "template", String "nested child"
            ; "name", String "child default" ] )
      ; ( "block/properties-text-values",
          props_map
            [ "template", String "nested child"
            ; "name", String "child default" ] )
      ; ("block/properties-order", kws [ "template"; "name" ]) ]
    ; [ ("block/uuid", Uuid include_children_only_uuid)
      ; ("block/title", String "exclude source block")
      ; ("block/page", page_ref_v page_uuid)
      ; ("block/parent", parent_map page_uuid)
      ; ("block/order", String "c")
      ; ( "block/properties",
          props_map
            [ "template", String "children only"
            ; "template-including-parent", Bool false ] )
      ; ( "block/properties-text-values",
          props_map
            [ "template", String "children only"
            ; "template-including-parent", String "false" ] )
      ; ( "block/properties-order",
          kws [ "template"; "template-including-parent" ] ) ]
    ; [ ("block/uuid", Uuid child_only_1_uuid)
      ; ("block/title", String "first child")
      ; ("block/page", page_ref_v page_uuid)
      ; ("block/parent", page_ref_v include_children_only_uuid)
      ; ("block/order", String "d") ]
    ; [ ("block/uuid", Uuid child_only_2_uuid)
      ; ("block/title", String "second child")
      ; ("block/page", page_ref_v page_uuid)
      ; ("block/parent", page_ref_v include_children_only_uuid)
      ; ("block/order", String "e") ] ]
  in
  let blocks', preserve_uuids = Gp.handle_template_blocks blocks in
  eq "template roots replace source blocks"
    [ "trimmed template"; "source parent"; "nested child"; "child"
    ; "children only"; "first child"; "second child" ]
    (List.filter_map (fun b -> BM.string_attr b "block/title") blocks')
    "";
  let fixture_uuids =
    [ parent_uuid; child_uuid; include_children_only_uuid; child_only_1_uuid
    ; child_only_2_uuid ]
  in
  check "preserve set contains all fixture uuids"
    (List.for_all (fun u -> Hashtbl.mem preserve_uuids u) fixture_uuids)
    "";
  check "template roots use trimmed names"
    (List.sort compare
       (List.filter_map
          (fun b ->
            let tags = BM.attr_value b "block/tags" in
            match tags with
            | Some (List vs) | Some (Vector vs) ->
                if
                  List.exists
                    (fun v -> v = Keyword "logseq.class/Template")
                    vs
                then BM.string_attr b "block/title"
                else None
            | _ -> None)
          blocks')
     = [ "children only"; "nested child"; "trimmed template" ])
    "";
  check "non-template children of source parent preserved"
    (List.filter_map
       (fun b ->
         match BM.attr_value b "block/tags" with
         | Some (List vs) | Some (Vector vs)
           when List.exists (fun v -> v = Keyword "logseq.class/Template") vs ->
             None
         | _ ->
           (match BM.attr_value b "block/parent" with
            | Some (Vector [ Keyword "block/uuid"; Uuid u ])
            | Some (Vector [ Keyword "block/uuid"; String u ]) ->
                if u = parent_uuid then
                  BM.string_attr b "block/title"
                else None
            | _ -> None))
       blocks'
     = [ "source parent" ])
    "";
  check "in-place template content blocks are marked to preserve empty properties"
    (Hashtbl.length preserve_uuids - List.length fixture_uuids = 2)
    ""

(* cljs write-linked-pdf-annotation-graph *)
let write_linked_pdf_annotation_graph (graph_dir : string)
    ~(pdf_uri : string) ~(pdf_label : string) ~(source_line : string)
    ~(annotation_id : string) ~(highlight_text : string) ~(hl_page : int) :
    unit =
  List.iter
    (fun (relative_path, content) ->
      let file_path = Filename.concat graph_dir relative_path in
      ignore (await (File_sys.mkdir_p (Filename.dirname file_path)));
      await (File_sys.write_text file_path content))
    [ ("logseq/config.edn", "{}")
    ; ("pages/source.md", source_line ^ "\n")
    ; ( "pages/hls__" ^ pdf_label ^ ".md",
        Printf.sprintf
          "file:: [%s.pdf](%s)\nfile-path:: %s\n\n- %s\n  ls-type:: annotation\n  hl-page:: %d\n  hl-color:: yellow\n  id:: %s\n"
          pdf_label pdf_uri pdf_uri highlight_text hl_page annotation_id )
    ; ( "assets/" ^ pdf_label ^ ".edn",
        Printf.sprintf
          "{:highlights [{:id #uuid \"%s\", :page %d, :position {:bounding {:x1 1 :y1 2 :x2 3 :y2 4 :width 10 :height 20}, :rects (), :page %d}, :content {:text \"%s\"}, :properties {:color \"yellow\"}}]}"
          annotation_id hl_page hl_page highlight_text ) ]

let uri_encode_spaces s =
  Common_util.str_replace_all s " " "%20"

let test_import_linked_file_pdf_annotations () =
  let annotation_id = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" in
  let area_annotation_id = "cccccccc-cccc-cccc-cccc-cccccccccccc" in
  let dir = Filename.temp_dir "logseq-graph-parser-test-" "" in
  let external_pdf_path = Filename.concat dir "external/Linked Paper.pdf" in
  let graph_dir = Filename.concat dir "graph" in
  let area_image_stamp = "area-stamp" in
  let encoded_pdf_uri = "file://" ^ uri_encode_spaces external_pdf_path in
  ignore (await (File_sys.mkdir_p (Filename.dirname external_pdf_path)));
  await (File_sys.write_text external_pdf_path "pdf");
  ignore
    (write_temp_file_graph_in graph_dir
       [ ("logseq/config.edn", "{}")
       ; ( "pages/source.md",
           "- ![Linked Paper.pdf](" ^ encoded_pdf_uri ^ ")\n" )
       ; ( "pages/hls__Linked Paper.md",
           Printf.sprintf
             "file:: [Linked Paper.pdf](%s)\nfile-path:: %s\n\n- External highlight from linked pdf\n  ls-type:: annotation\n  hl-page:: 3\n  hl-color:: yellow\n  id:: %s\n- External area highlight from linked pdf\n  ls-type:: annotation\n  hl-page:: 4\n  hl-color:: yellow\n  id:: %s\n"
             encoded_pdf_uri encoded_pdf_uri annotation_id
             area_annotation_id )
       ; ( "assets/Linked Paper.edn",
           Printf.sprintf
             "{:highlights [{:id #uuid \"%s\", :page 3, :position {:bounding {:x1 1 :y1 2 :x2 3 :y2 4 :width 10 :height 20}, :rects (), :page 3}, :content {:text \"External highlight from linked pdf\"}, :properties {:color \"yellow\"}} {:id #uuid \"%s\", :page 4, :position {:bounding {:x1 11 :y1 12 :x2 13 :y2 14 :width 10 :height 20}, :rects (), :page 4}, :content {:image \"%s\"}, :properties {:color \"yellow\"}}]}"
             annotation_id area_annotation_id area_image_stamp )
       ; ( Printf.sprintf "assets/Linked Paper/4_%s_%s.png"
             area_annotation_id area_image_stamp,
           "png" ) ]);
  let conn = create_conn () in
  let asset_ids = ref [] in
  let result =
    import_file_graph_to_db graph_dir conn
      { (default_import_opts ()) with assets_ids = Some asset_ids }
  in
  let db = Datascript.db conn in
  let asset = find_block_exn db "Linked Paper" in
  let annotation = find_block_exn db "External highlight from linked pdf" in
  let area_annotation =
    find_block_exn db "External area highlight from linked pdf"
  in
  check "Linked file PDF imports as an external Asset" true "";
  check_v "Linked file PDF keeps the file URI as external asset metadata"
    (Map
       [ Keyword "block/tags", Vector [ Keyword "logseq.class/Asset" ]
       ; Keyword "logseq.property.asset/type", String "pdf"
       ; ( Keyword "logseq.property.asset/external-url",
           String encoded_pdf_uri ) ])
    (props_select
       [ "block/tags"; "logseq.property.asset/type"
       ; "logseq.property.asset/external-url" ]
       asset)
    "";
  check_v "Linked file PDF annotations import and point at the external Asset"
    (Map
       [ ( Keyword "block/tags",
           Vector [ Keyword "logseq.class/Pdf-annotation" ] )
       ; Keyword "logseq.property/asset", String "Linked Paper"
       ; Keyword "logseq.property.pdf/hl-page", Int 3 ])
    (props_select
       [ "block/tags"; "logseq.property/asset"
       ; "logseq.property.pdf/hl-page" ]
       annotation)
    "";
  check_v "Linked file PDF area highlights import their image assets"
    (Map
       [ ( Keyword "block/tags",
           Vector [ Keyword "logseq.class/Pdf-annotation" ] )
       ; Keyword "logseq.property/asset", String "Linked Paper"
       ; Keyword "logseq.property.pdf/hl-page", Int 4
       ; Keyword "logseq.property.pdf/hl-image", String "pdf area highlight"
       ; Keyword "logseq.property.pdf/hl-type", Keyword "area" ])
    (props_select
       [ "block/tags"; "logseq.property/asset"; "logseq.property.pdf/hl-page"
       ; "logseq.property.pdf/hl-image"; "logseq.property.pdf/hl-type" ]
       area_annotation)
    "";
  eq "No ignored assets" 0 (ignored_count "ignored-assets" result) ""

let test_import_linked_file_pdf_annotations_with_uppercase_extension () =
  let annotation_id = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" in
  let dir = Filename.temp_dir "logseq-graph-parser-test-" "" in
  let external_pdf_path = Filename.concat dir "external/Linked Paper.PDF" in
  let graph_dir = Filename.concat dir "graph" in
  let encoded_pdf_uri = "file://" ^ uri_encode_spaces external_pdf_path in
  ignore (await (File_sys.mkdir_p (Filename.dirname external_pdf_path)));
  await (File_sys.write_text external_pdf_path "pdf");
  ignore
    (write_temp_file_graph_in graph_dir
       [ ("logseq/config.edn", "{}")
       ; ( "pages/source.md",
           "- ![Linked Paper.PDF](" ^ encoded_pdf_uri ^ ")\n" )
       ; ( "pages/hls__Linked Paper.md",
           Printf.sprintf
             "file:: [Linked Paper.PDF](%s)\nfile-path:: %s\n\n- External highlight from linked pdf\n  ls-type:: annotation\n  hl-page:: 3\n  hl-color:: yellow\n  id:: %s\n"
             encoded_pdf_uri encoded_pdf_uri annotation_id )
       ; ( "assets/Linked Paper.edn",
           Printf.sprintf
             "{:highlights [{:id #uuid \"%s\", :page 3, :position {:bounding {:x1 1 :y1 2 :x2 3 :y2 4 :width 10 :height 20}, :rects (), :page 3}, :content {:text \"External highlight from linked pdf\"}, :properties {:color \"yellow\"}}]}"
             annotation_id ) ]);
  let conn = create_conn () in
  let asset_ids = ref [] in
  let result =
    import_file_graph_to_db graph_dir conn
      { (default_import_opts ()) with assets_ids = Some asset_ids }
  in
  let db = Datascript.db conn in
  let asset = find_block_exn db "Linked Paper" in
  let annotation = find_block_exn db "External highlight from linked pdf" in
  check "Linked file PDF imports as an external Asset" true "";
  check_v "Linked file PDF keeps the file URI as external asset metadata"
    (Map
       [ Keyword "block/tags", Vector [ Keyword "logseq.class/Asset" ]
       ; Keyword "logseq.property.asset/type", String "pdf"
       ; ( Keyword "logseq.property.asset/external-url",
           String encoded_pdf_uri ) ])
    (props_select
       [ "block/tags"; "logseq.property.asset/type"
       ; "logseq.property.asset/external-url" ]
       asset)
    "";
  check_v
    "Linked file PDF annotations import and keep highlight positions from the EDN file"
    (Map
       [ ( Keyword "block/tags",
           Vector [ Keyword "logseq.class/Pdf-annotation" ] )
       ; Keyword "logseq.property/asset", String "Linked Paper"
       ; Keyword "logseq.property.pdf/hl-page", Int 3 ])
    (props_select
       [ "block/tags"; "logseq.property/asset"
       ; "logseq.property.pdf/hl-page" ]
       annotation)
    "";
  eq "No ignored assets" 0 (ignored_count "ignored-assets" result) ""

let test_import_linked_pdf_annotations_with_missing_attributes_without_log_fn () =
  let annotation_id = "dddddddd-dddd-dddd-dddd-dddddddddddd" in
  let dir = Filename.temp_dir "logseq-graph-parser-test-" "" in
  let external_pdf_path = Filename.concat dir "external/Sparse Paper.pdf" in
  let graph_dir = Filename.concat dir "graph" in
  let encoded_pdf_uri = "file://" ^ uri_encode_spaces external_pdf_path in
  ignore (await (File_sys.mkdir_p (Filename.dirname external_pdf_path)));
  await (File_sys.write_text external_pdf_path "pdf");
  ignore
    (write_temp_file_graph_in graph_dir
       [ ("logseq/config.edn", "{}")
       ; ( "pages/source.md",
           "- ![Sparse Paper.pdf](" ^ encoded_pdf_uri ^ ")\n" )
       ; ( "pages/hls__Sparse Paper.md",
           Printf.sprintf
             "file:: [Sparse Paper.pdf](%s)\nfile-path:: %s\n\n- Sparse highlight\n  ls-type:: annotation\n  id:: %s\n"
             encoded_pdf_uri encoded_pdf_uri annotation_id )
       ; ( "assets/Sparse Paper.edn",
           Printf.sprintf
             "{:highlights [{:id #uuid \"%s\", :position {:bounding {:x1 1 :y1 2 :x2 3 :y2 4 :width 10 :height 20}, :rects ()}, :content {}, :properties {}}]}"
             annotation_id ) ]);
  let conn = create_conn () in
  let result =
    import_file_graph_to_db graph_dir conn (default_import_opts ())
  in
  let db = Datascript.db conn in
  let asset = find_block_exn db "Sparse Paper" in
  let annotation =
    entity_exn db (Lookup_ref ("block/uuid", Uuid annotation_id))
  in
  check "Linked file PDF imports as an external Asset"
    (Option.is_some (Some asset)) "";
  check "Highlights missing color, page, and text still import" true "";
  eq "Annotation title comes from the markdown highlight when EDN text is missing"
    "Sparse highlight"
    (Option.value ~default:"" (get_string' annotation "block/title")) "";
  check_v "Missing annotation attributes fall back to import defaults"
    (Map
       [ ( Keyword "block/tags",
           Vector [ Keyword "logseq.class/Pdf-annotation" ] )
       ; Keyword "logseq.property/asset", String "Sparse Paper"
       ; Keyword "logseq.property.pdf/hl-page", Int 1 ])
    (props_select
       [ "block/tags"; "logseq.property/asset"
       ; "logseq.property.pdf/hl-page" ]
       annotation)
    "";
  eq "No ignored assets" 0 (ignored_count "ignored-assets" result) ""

let test_import_external_pdf_annotations () =
  List.iter
    (fun (pdf_uri, image_link) ->
      let annotation_id = "11111111-1111-1111-1111-111111111111" in
      let dir = Filename.temp_dir "logseq-graph-parser-test-" "" in
      let graph_dir = Filename.concat dir "graph" in
      write_linked_pdf_annotation_graph graph_dir ~pdf_uri
        ~pdf_label:"LocalDoc"
        ~source_line:
          ("- Source "
           ^ (if image_link then "![LocalDoc.pdf](" ^ pdf_uri ^ ")"
              else "((" ^ annotation_id ^ "))"))
        ~annotation_id ~highlight_text:"Sample highlight" ~hl_page:2;
      let conn = create_conn () in
      let result =
        import_file_graph_to_db graph_dir conn (default_import_opts ())
      in
      let db = Datascript.db conn in
      let asset = find_block_exn db "LocalDoc" in
      let annotation =
        entity_exn db (Lookup_ref ("block/uuid", Uuid annotation_id))
      in
      check_v
        ("External PDF preserves its complete URI: " ^ pdf_uri)
        (Map
           [ Keyword "block/tags", Vector [ Keyword "logseq.class/Asset" ]
           ; Keyword "logseq.property.asset/type", String "pdf"
           ; ( Keyword "logseq.property.asset/external-url",
               String pdf_uri ) ])
        (props_select
           [ "block/tags"; "logseq.property.asset/type"
           ; "logseq.property.asset/external-url" ]
           asset)
        "";
      check_v
        "Annotation binds to the external Asset, including without an image link"
        (Map
           [ ( Keyword "block/tags",
               Vector [ Keyword "logseq.class/Pdf-annotation" ] )
           ; Keyword "logseq.property/asset", String "LocalDoc"
           ; Keyword "logseq.property.pdf/hl-page", Int 2 ])
        (props_select
           [ "block/tags"; "logseq.property/asset"
           ; "logseq.property.pdf/hl-page" ]
           annotation)
        "";
      (if image_link then
         let source =
           find_block_re_exn db "^Source "
         in
         let asset_uuid =
           match getv' asset "block/uuid" with
           | Some (Uuid u) -> u
           | _ -> failwith "no asset uuid"
         in
         eq "Source image link becomes an Asset reference"
           ("Source " ^ Page_ref.to_page_ref asset_uuid)
           (Option.value ~default:"" (get_string' source "block/title"))
           "");
      check "No ignored assets"
        (ignored_count "ignored-assets" result = 0) "")
    [ ("file://D:\\assets\\LocalDoc.pdf", true)
    ; ("https://example.com/LocalDoc.pdf", true)
    ; ("https://example.com/LocalDoc.pdf?token=sample#page=2", true)
    ; ("https://example.com/LocalDoc.pdf?token=sample#page=2", false) ]

let test_import_hls_pdfs_uses_annotation_file_identities () =
  let dir = Filename.temp_dir "logseq-hls-identities-" "" in
  let graph_dir = Filename.concat dir "graph" in
  let first_id = "11111111-1111-1111-1111-111111111111" in
  let second_id = "22222222-2222-2222-2222-222222222222" in
  let first_url = "https://example.com/Alpha.pdf" in
  let first_key = "Alpha__" ^ cljs_string_hash first_url in
  List.iter
    (fun (label, url, annotation_id) ->
      write_linked_pdf_annotation_graph graph_dir ~pdf_uri:url
        ~pdf_label:label
        ~source_line:("- ((" ^ annotation_id ^ "))")
        ~annotation_id ~highlight_text:"Original highlight" ~hl_page:2)
    [ ("Alpha", first_url, first_id)
    ; ("Beta", "https://example.com/Beta.pdf", second_id) ];
  await
    (File_sys.append_text
       (Filename.concat graph_dir "pages/hls__Alpha.md")
       "- ![Beta](https://example.com/Beta.pdf)\n");
  await
    (File_sys.append_text
       (Filename.concat graph_dir "pages/hls__Beta.md")
       "  - Child note\n");
  List.iter
    (fun (before, after) ->
      await
        (File_sys.rename
           (Filename.concat graph_dir before)
           (Filename.concat graph_dir after)))
    [ ( "pages/hls__Alpha.md",
        "pages/hls__" ^ first_key ^ ".md" )
    ; ("assets/Alpha.edn", "assets/" ^ first_key ^ ".edn") ];
  let conn = create_conn () in
  ignore
    (import_file_graph_to_db graph_dir conn (default_import_opts ()));
  let db = Datascript.db conn in
  let annotation =
    entity_exn db (Lookup_ref ("block/uuid", Uuid first_id))
  in
  let second_annotation =
    entity_exn db (Lookup_ref ("block/uuid", Uuid second_id))
  in
  eq "annotation title" "Original highlight"
    (Option.value ~default:"" (get_string' annotation "block/title")) "";
  eq "annotation asset title" "Alpha"
    (match ref_ent' annotation "logseq.property/asset" with
     | Some a -> Option.value ~default:"" (get_string' a "block/title")
     | None -> "")
    "";
  check "child note"
    (List.filter_map
       (fun c -> Ldb.string_value c "block/title")
       (ordered_children second_annotation)
     = [ "Child note" ])
    ""

let test_import_large_flat_file_without_stack_overflow () =
  (* ^:integration — 45000 lines *)
  if not (integration_tests_enabled ()) then Alcotest.skip ();
  let content =
    Buffer.create (45000 * 30)
  in
  for i = 0 to 44999 do
    Buffer.add_string content
      (Printf.sprintf "- large line %d #tag\n" i)
  done;
  let file =
    write_temp_graph_file "pages/large.md" (Buffer.contents content)
  in
  let conn = create_conn () in
  Outliner_db_pipeline.add_listener conn;
  ignore
    (import_files_to_db [ file ] conn
       { (default_import_opts ()) with convert_all_tags = true });
  let db = Datascript.db conn in
  eq "Large flat files import without overflowing the stack" 45000
    (List.length
       (List.filter
          (fun v ->
            match v with
            | String s -> str_starts_with s "large line "
            | _ -> false)
          (q_values db
             "[:find [?title ...] :where [?b :block/title ?title]]")))
    "";
  check_valid "Imported graph validates" db

let test_export_docs_graph_with_convert_all_tags () =
  (* ^:integration — needs a logseq/docs v0.10.12 checkout. Set
     LOGSEQ_DOCS_0_10_12_DIR or LOGSEQ_DOCS_DIR, or place the checkout at
     <repo>/deps/graph-parser/test/resources/docs-0.10.12 *)
  let file_graph_dir = docs_graph_dir () in
  let start_time = Unix.gettimeofday () in
  let conn = create_conn () in
  Outliner_db_pipeline.add_listener conn;
  let result =
    import_file_graph_to_db file_graph_dir conn
      { (default_import_opts ()) with
        convert_all_tags = true
      ; import_timeout_ms = Some 30000
      ; import_heartbeat_ms = Some 5000 }
  in
  let elapsed = Unix.gettimeofday () -. start_time in
  check
    (Printf.sprintf "Importing large graph takes less than 25s (took %.1fs)"
       elapsed)
    (elapsed < 25.) "";
  let db = Datascript.db conn in
  check_valid "Created graph has no validation errors" db;
  eq "No ignored properties" 0
    (ignored_count "ignored-properties" result) "";
  eq "No ignored assets" 0 (ignored_count "ignored-assets" result) "";
  check
    "All classes only have :logseq.class/Tag as their tag (and don't have Page)"
    (q_pulls db
       "[:find [(pull ?b [:block/title {:block/tags [:db/ident]}]) ...] :where [?b :block/tags :logseq.class/Tag]]"
     |> List.for_all (fun p ->
            match pulled_get "block/tags" p with
            | Some (Pulled_many [ Pulled_entity tag ]) ->
                pulled_scalar "db/ident" tag
                = Some (Keyword "logseq.class/Tag")
            | _ -> false))
    ""

let test_finalize_imported_graph_avoids_unchanged_ref_writes () =
  let conn = create_conn () in
  let target_uuid = gen_uuid () in
  let block_uuid = gen_uuid () in
  let skipped_uuid = gen_uuid () in
  let reaction_uuid = gen_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1 :block/uuid #uuid \"%s\" :block/title \"target\"} {:db/id -2 :block/uuid #uuid \"%s\" :block/title \"%s\" :block/refs [-1]} {:db/id -3 :block/uuid #uuid \"%s\" :block/title \"already stamped\" :block/tx-id 42 :block/refs [-1]} {:db/id -4 :block/uuid #uuid \"%s\" :block/title \"%s\" :logseq.property.reaction/target -2}]"
          target_uuid block_uuid
          (Page_ref.to_page_ref target_uuid)
          skipped_uuid reaction_uuid
          (Page_ref.to_page_ref target_uuid)));
  let db = Datascript.db conn in
  let block_id =
    (entity_exn db (Lookup_ref ("block/uuid", Uuid block_uuid))).id
  in
  let tx_id = db.max_tx + 1 in
  let reports = ref [] in
  ignore
    (Datascript.listen conn "finalize-test"
       (fun (r : tx_report) -> reports := r :: !reports));
  ignore (Gp.finalize_imported_graph conn (Gp.default_options ()));
  let db = Datascript.db conn in
  let block_ent = entity_exn db (Entity_id block_id) in
  check "block gets stamped with tx-id"
    (getv' block_ent "block/tx-id" = Some (Int tx_id)) "";
  check "refs match target"
    (List.map (fun e -> e.id) (ref_ents' block_ent "block/refs")
     = [ (entity_exn db (Lookup_ref ("block/uuid", Uuid target_uuid))).id ])
    "";
  check
    "Finalization must not retract and re-add refs that already match"
    (List.for_all
       (fun (r : tx_report) ->
         List.for_all
           (fun (d : datom) -> not (d.e = block_id && d.a = "block/refs"))
           r.tx_data)
       !reports)
    "";
  check "skipped block keeps its tx-id"
    ((entity_exn db (Lookup_ref ("block/uuid", Uuid skipped_uuid)))
     |> fun e -> getv' e "block/tx-id" = Some (Int 42))
    "";
  check "reaction target block has no refs written"
    (ref_ents'
       (entity_exn db (Lookup_ref ("block/uuid", Uuid reaction_uuid)))
       "block/refs"
     = [])
    "";
  eq "one report" 1 (List.length !reports) "";
  ignore (Gp.finalize_imported_graph conn (Gp.default_options ()));
  eq "Repeated finalization is a no-op" 1 (List.length !reports) ""


let test_import_file_graph_rebuilds_refs_without_per_file_listener () =
  let file_graph_dir =
    Filename.concat (test_resources_dir ()) "exporter-test-graph"
  in
  let conn = create_conn () in
  ignore (import_file_graph_to_db file_graph_dir conn (default_import_opts ()));
  let db = Datascript.db conn in
  let block = find_block_exn db "old todo block" in
  check_some "Finalize stamps :block/tx-id" (getv' block "block/tx-id") "";
  check
    "One-shot rebuild writes property and class :block/refs without a per-file listener"
    (List.for_all
       (fun ident ->
         List.exists
           (fun e -> Ldb.ident_of e = Some ident)
           (ref_ents' block "block/refs"))
       [ "logseq.property/status"; "logseq.class/Task" ])
    ""

let test_bulk_import_refs_match_single_block_refs () =
  let file_graph_dir =
    Filename.concat (test_resources_dir ()) "exporter-test-graph"
  in
  let conn = create_conn () in
  ignore (import_file_graph_to_db file_graph_dir conn (default_import_opts ()));
  let db = Datascript.db conn in
  let rebuild_refs = Outliner_pipeline.db_rebuild_block_refs_fn db in
  Datascript.datoms db Avet ~a:"block/uuid" ()
  |> Seq.iter (fun (d : datom) ->
         match Ldb.ent_of_id db d.e with
         | Some block ->
             let single =
               List.sort compare
                 (Outliner_pipeline.db_rebuild_block_refs db block ())
             in
             let bulk = List.sort compare (rebuild_refs block) in
             check
               (Printf.sprintf "Bulk refs match for %s"
                  (match getv' block "block/uuid" with
                   | Some (Uuid u) -> u
                   | _ -> "?"))
               (single = bulk) ""
         | None -> ())

let test_export_basic_graph_with_convert_all_tags () =
  (* This graph will contain basic examples of different features to import *)
  let file_graph_dir =
    Filename.concat (test_resources_dir ()) "exporter-test-graph"
  in
  let conn = create_conn () in
  Outliner_db_pipeline.add_listener conn;
  let assets = ref [] in
  let import_state =
    import_file_graph_to_db file_graph_dir conn
      { (default_import_opts ()) with
        convert_all_tags = true
      ; assets_ids = Some assets }
  in
  let db = Datascript.db conn in
  (* testing "whole graph" *)
  check_valid "Created graph has no validation errors" db;
  let tagged_eid_count (tag_ident : string) : int =
    List.length
      (q_eids db
         (Printf.sprintf "[:find ?b :where [?b :block/tags %s]]" tag_ident))
  in
  eq "Journal count" 34 (tagged_eid_count ":logseq.class/Journal") "";
  eq "Asset count" 9 (tagged_eid_count ":logseq.class/Asset") "";
  eq "Task count" 6 (tagged_eid_count ":logseq.class/Task") "";
  eq "Query count" 4 (tagged_eid_count ":logseq.class/Query") "";
  eq "Card count" 2 (tagged_eid_count ":logseq.class/Card") "";
  eq "Cards count" 1 (tagged_eid_count ":logseq.class/Cards") "";
  eq "Code-block count" 2 (tagged_eid_count ":logseq.class/Code-block") "";
  eq "Math-block count" 1 (tagged_eid_count ":logseq.class/Math-block") "";
  eq "Template count" 9 (tagged_eid_count ":logseq.class/Template") "";
  eq "Quote-block count" 6 (tagged_eid_count ":logseq.class/Quote-block") "";
  eq "Pdf-annotation count" 8
    (tagged_eid_count ":logseq.class/Pdf-annotation") "";
  eq "Correct number of pages with block content" 13
    (List.length
       (List.filter Ldb.internal_page
          (q_entities db
             "[:find [?b ...] :where [?b :block/title] [_ :block/page ?b] (not [?b :logseq.property/built-in?])]")))
    "";
  eq "Correct number of user classes" 16
    (List.length
       (q_values db
          "[:find [?ident ...] :where [?b :block/tags :logseq.class/Tag] [?b :db/ident ?ident] (not [?b :logseq.property/built-in?])]"))
    "";
  eq "No ignored properties" 0
    (ignored_count "ignored-properties" import_state) "";
  eq "No ignored assets" 0
    (ignored_count "ignored-assets" import_state) "";
  eq "Ignore .edn for now" 1 (ignored_count "ignored-files" import_state) "";
  (* 2 zotero pdf are external files so not counted here *)
  eq "Imported assets" 7 (List.length !assets) "";
  (* testing "logseq files" *)
  eq "custom.css file content" ".foo {}\n"
    (match
       q_scalar_in db
         "[:find ?content . :where [?b :file/path \"logseq/custom.css\"] [?b :file/content ?content]]"
         []
     with
     | Some (String c) -> c
     | _ -> "")
    "";
  eq "custom.js file content" "logseq.api.show_msg('hello good sir!');\n"
    (match
       q_scalar_in db
         "[:find ?content . :where [?b :file/path \"logseq/custom.js\"] [?b :file/content ?content]]"
         []
     with
     | Some (String c) -> c
     | _ -> "")
    "";
  (* testing "favorites" *)
  check_v "favorites"
    (Set
       (List.map
          (fun t -> String t)
          [ "Interstellar"; "some page"; "new page"; "n1/x/y" ]))
    (Set (List.map (fun t -> String t) (imported_favorite_titles db)))
    "";
  (* testing "user properties" *)
  let internal_ident (ident : string) : bool =
    List.mem ident Db_schema.db_attribute_properties
    || (match Db_property.namespace_of ident with
        | Some ns -> List.mem ns Db_schema.logseq_ident_namespaces
        | None -> false)
  in
  eq "Correct number of user properties" 23
    (List.length
       (List.filter
          (fun p ->
            match pulled_scalar "db/ident" p with
            | Some (Keyword ident) -> not (internal_ident ident)
            | _ -> false)
          (q_pulls db
             "[:find [(pull ?b [:db/ident]) ...] :where [?b :block/tags :logseq.class/Property]]")))
    "";
  check_v "Main property types have correct inferred :type"
    (Set
       [ Map
           [ Keyword "db/ident", Keyword "user.property/prop-bool"
           ; Keyword "logseq.property/type", Keyword "checkbox" ]
       ; Map
           [ Keyword "db/ident", Keyword "user.property/prop-string"
           ; Keyword "logseq.property/type", Keyword "default" ]
       ; Map
           [ Keyword "db/ident", Keyword "user.property/prop-num"
           ; Keyword "logseq.property/type", Keyword "number" ]
       ; Map
           [ Keyword "db/ident", Keyword "user.property/sameas"
           ; Keyword "logseq.property/type", Keyword "url" ]
       ; Map
           [ Keyword "db/ident", Keyword "user.property/rangeincludes"
           ; Keyword "logseq.property/type", Keyword "node" ]
       ; Map
           [ Keyword "db/ident", Keyword "user.property/startedat"
           ; Keyword "logseq.property/type", Keyword "date" ] ])
    (Set
       (List.filter_map
          (fun p ->
            match pulled_scalar "db/ident" p with
            | Some (Keyword ident)
              when List.mem (Ns_util.get_last_part ident)
                     [ "prop-bool"; "prop-string"; "prop-num"
                     ; "rangeincludes"; "sameas"; "startedat" ] ->
                Some
                  ((Map
                      [ Keyword "db/ident", Keyword ident
                      ; ( Keyword "logseq.property/type"
                        , Option.value ~default:Nil
                            (pulled_scalar "logseq.property/type" p) ) ])
                   : value)
            | _ -> None)
          (q_pulls db
             "[:find [(pull ?b [:db/ident :logseq.property/type]) ...] :where [?b :block/tags :logseq.class/Property]]")))
    "";
  let prop_type_of ident =
    match Datascript.entity db (Ident ident) with
    | Some e -> Ldb.value e "logseq.property/type"
    | None -> None
  in
  eq "Property value consisting of text and refs is inferred as :default"
((Some (Keyword "default")) : value option)
    (prop_type_of "user.property/description") "";
  eq "Property value with a macro correctly inferred as :url"
((Some (Keyword "url")) : value option)
    (prop_type_of "user.property/url") "";
  check_v "Basic block has correct properties"
    (Map
       [ Keyword "user.property/prop-bool", Bool true
       ; Keyword "user.property/prop-num", Int 5
       ; Keyword "user.property/prop-string", String "woot" ])
    (props_map (find_block_exn db "b1")) "";
  check_v "Block with properties has correct refs"
    (Set
       [ String "prop-num"; String "prop-string"; String "prop-bool" ])
    (Set (List.map (fun s -> String s)
            (ref_titles (find_block_exn db "b1") "block/refs"))) "";
  check_v "New page has correct properties"
    (Map
       [ (Keyword "user.property/prop-num2", Int 10);
         (Keyword "block/tags", Vector [ Keyword "logseq.class/Page" ]) ])
    (props_map (find_page_exn db "new page")) "";
  check_v "Existing page has correct properties"
    (Map
       [ (Keyword "user.property/prop-bool", Bool true);
         (Keyword "user.property/prop-num", Int 5);
         (Keyword "user.property/prop-string", String "yeehaw");
         ( Keyword "block/tags",
           Vector
             [ Keyword "logseq.class/Page";
               Keyword "user.class/SomeNamespace" ] ) ])
    (props_map (find_page_exn db "some page")) "";
  check_v "Block with float property imports as a float"
    ((Map [ (Keyword "user.property/rating", Float 5.5) ]) : value)
    (props_map (find_block_exn db ":rating float")) "";
  eq "All properties only have :logseq.class/Property as their tag"
    []
    (q_pulls db
       "[:find (pull ?b [:block/title {:block/tags [:db/ident]}]) :where [?b :block/tags :logseq.class/Property]]"
    |> List.filter (fun p ->
           let tags =
             List.filter_map
               (fun t -> pulled_scalar "db/ident" t)
               (pulled_ents "block/tags" p)
           in
           not (tags = [ Keyword "logseq.class/Property" ])))
    "";
  (* testing "built-in properties" *)
  check_v "block with a block-ref has correct :block/refs"
    (Vector [ Int (find_block_exn db "original block").id ])
    (Vector
       (List.map (fun e -> (Int e.id : value))
          (ref_ents' (find_block_re_exn db "ref to") "block/refs"))) "";
  eq "block-ref ((uuid)) is converted to page-ref [[uuid]] in block title"
    "ref to [[65cbb772-fb79-462d-87c8-6f0dad751dee]]"
    (Option.value ~default:""
       (get_string' (find_block_re_exn db "ref to") "block/title")) "";
  eq "deadline block has correct journal as property value" 20221126
    (match prop_get (find_block_exn db "only deadline")
             "logseq.property/deadline" with
     | Some v -> journal_day_of_value v
     | _ -> -1) "";
  let sched_dl =
    props_select
      [ "logseq.property/scheduled"; "logseq.property/deadline" ]
      (find_block_re_exn db "deadline and scheduled")
    |> (fun (x : value) ->
         match x with
         | Map kvs ->
             List.map
               (fun ((k : value), (v : value)) ->
                 ( k,
                   match ms_of_value v with
                   | Some ms ->
                       (Int (Date_time_util.ms_to_journal_day ms) : value)
                   | None -> v ))
               kvs
         | _ -> [])
  in
  check_v "scheduled block converted to correct deadline"
    (Map
       [ (Keyword "logseq.property/scheduled", Int 20221125);
         (Keyword "logseq.property/deadline", Int 20221125) ])
    ((Map sched_dl : value)) "";
  eq "Only one journal page exists when deadline is on same day as journal"
    1
    (List.length
       (q_eids_in db
          "[:find [?b ...] :in $ ?content :where [?b :block/title ?content]]"
          [ String "Apr 1st, 2024" ]))
    "";
  let finish_big () = () in
  ignore finish_big;
  check_v "priority block has correct property"
    (Map
       [ ( Keyword "logseq.property/priority",
           Keyword "logseq.property/priority.high" ) ])
    (props_map (find_block_exn db "high priority")) "";
  check_v "status block has correct task properties and class"
    (Map
       [ ( Keyword "logseq.property/status",
           Keyword "logseq.property/status.doing" );
         ( Keyword "logseq.property/priority",
           Keyword "logseq.property/priority.medium" );
         (Keyword "block/tags", Vector [ Keyword "logseq.class/Task" ]) ])
    (props_map (find_block_exn db "status test")) "";
  (match task_blocks_by_title db "" with
   | empty_title_task :: _ ->
       check_v "Empty-title TODO from file graph imports as a task"
         (Map
            [ ( Keyword "logseq.property/status",
                Keyword "logseq.property/status.todo" );
              ( Keyword "block/tags",
                Vector [ Keyword "logseq.class/Task" ] ) ])
         (props_select
            [ "logseq.property/status"; "block/tags" ]
            empty_title_task)
         ""
   | [] -> failwith "empty-title task not found");
  check_v "old task properties like 'todo' are ignored"
    (Set
       [ Keyword "logseq.property/status"; Keyword "block/tags" ])
    (Set
       (List.map fst (readable_properties (find_block_exn db "old todo block"))
        |> List.map (fun k -> Keyword k)))
    "";
  check_v "numered block has correct property"
    (Map
       [ ( Keyword "logseq.property/order-list-type",
           String "number" ) ])
    (props_map (find_block_exn db "list one")) "";
  check_v "alias set correctly"
    (Set [ String "gpt" ])
    (match prop_get (find_page_exn db "chat-gpt") "block/alias" with
     | Some v -> v
     | None -> Set []) "";
  check_v "alias set correctly on namespaced page"
    (Vector [ String "y" ])
    (Vector
       (match
          q_eids db
            "[:find [?b ...] :where [?b :block/title \"y\"] [?b :block/parent]]"
        with
        | id :: _ -> (
            match Ldb.ent_of_id db id with
            | Some e -> ref_titles e "block/alias" |> List.map (fun s -> String s)
            | None -> [])
        | [] -> []))
    "";
  check_v "linked ref filters set correctly"
    (Map
       [ ( Keyword "logseq.property.linked-references/includes",
           Set [ String "Oct 9th, 2024" ] );
         ( Keyword "logseq.property.linked-references/excludes",
           Set [ String "ref2" ] ) ])
    (props_select
       [ "logseq.property.linked-references/excludes";
         "logseq.property.linked-references/includes" ]
       (find_page_exn db "chat-gpt"))
    "";
  (* testing "built-in classes and their properties" — Queries *)
  let qb =
    Option.get
      (find_block_by_property_value db "logseq.property/query"
         "(property :prop-string)")
  in
  check_v "simple query block has correct query properties"
    (Map
       [ ( Keyword "logseq.property.table/sorting",
           Vector
             [ Map
                 [ Keyword "id", Keyword "user.property/prop-num"
                 ; Keyword "asc?", Bool false ] ] );
         ( Keyword "logseq.property.view/type",
           Keyword "logseq.property.view/type.table" );
         ( Keyword "logseq.property.table/ordered-columns",
           Vector
             [ Keyword "block/title"
             ; Keyword "user.property/prop-string"
             ; Keyword "user.property/prop-num" ] );
         ( Keyword "logseq.property/query",
           String "(property :prop-string)" );
         ( Keyword "block/tags",
           Vector [ Keyword "logseq.class/Query" ] ) ])
    (props_map qb) "";
  eq "Text around a simple query block is set as a query's title"
    "For example, here's a query with title text:"
    (Option.value ~default:""
       (get_string'
          (find_block_re_exn db "query with title text") "block/title"))
    "";
  check_v "Advanced query has correct query properties"
    (Map
       [ ( Keyword "logseq.property.view/type",
           Keyword "logseq.property.view/type.list" );
         ( Keyword "logseq.property/query",
           String "{:query (task todo doing)}" );
         ( Keyword "block/tags",
           Vector [ Keyword "logseq.class/Query" ] );
         ( Keyword "logseq.property.table/ordered-columns",
           Vector [ Keyword "block/title" ] ) ])
    (props_map (find_block_re_exn db "tasks with todo")) "";
  eq "Advanced query has custom title migrated" "tasks with todo and doing"
    (Option.value ~default:""
       (get_string' (find_block_re_exn db "tasks with todo") "block/title"))
    "";
  check_v
    "None of the card properties are imported since they are deprecated"
    (Map
       [ ( Keyword "block/tags",
           Vector [ Keyword "logseq.class/Card" ] ) ])
    (props_map (find_block_exn db "card 1")) "";
  check_v "cards macro block has correct Cards class and query property"
    (Map
       [ ( Keyword "block/tags",
           Vector [ Keyword "logseq.class/Cards" ] );
         ( Keyword "logseq.property/query", String "(tags #Card)" ) ])
    (props_map
       (Option.get
          (find_block_by_property_value db "logseq.property/query"
             "(tags #Card)")))
    "";
  check_v "Math block has correct Math-block class and display-type"
    (Map
       [ ( Keyword "block/tags",
           Vector [ Keyword "logseq.class/Math-block" ] );
         ( Keyword "logseq.property.node/display-type", Keyword "math" ) ])
    (props_map (find_block_exn db "E=mc^2")) "";
  eq "Math block title has delimiters stripped" "E=mc^2"
    (Option.value ~default:""
       (get_string' (find_block_exn db "E=mc^2") "block/title"))
    "";
  check_v "All template definitions are imported as Template blocks"
    (Set
       (List.map (fun t -> String t)
          [ "meeting"; "title-only-no-children"
          ; "properties-only-no-children"; "title-only-with-children"
          ; "empty-title-with-children"; "children-only"; "nested-father"
          ; "nested-child-1"; "nested-child-2" ]))
    (Set
       (q_values db
          "[:find [?title ...] :where [?b :block/tags :logseq.class/Template] [?b :block/title ?title]]"))
    "";
  let journal_uuid =
    match find_journal_by_journal_day db 20240216 with
    | Some e -> (
        match Ldb.value e "block/uuid" with Some v -> v | None -> Nil)
    | None -> Nil
  in
  check_v "All template blocks are created on their source journal page"
    (Set [ journal_uuid ])
    (Set
       (q_values db
          "[:find [?page-uuid ...] :where [?b :block/tags :logseq.class/Template] [?b :block/page ?page] [?page :block/uuid ?page-uuid]]"))
    "";
  let tree (title : string) (ps : (string * value) list) (cs : value list)
      : value =
    Map
      [ (Keyword "title", String title);
        ( Keyword "properties",
          Map (List.map (fun (k, v) -> Keyword k, v) ps) );
        (Keyword "children", Vector cs) ]
  in
  let tts title = Vector (List.map bt_to_value (template_content_trees db title)) in
  check_v "meeting template"
    (Vector
       [ tree "MEETING TITLE"
           [ ( "user.property/participants",
               Set [ String "TODO" ] ) ]
           [] ])
    (tts "meeting") "";
  check_v "title-only-no-children template"
    (Vector [ tree "TITLE" [] [] ])
    (tts "title-only-no-children") "";
  check_v "properties-only-no-children template"
    (Vector
       [ tree ""
           [ ("user.property/name", String "");
             ("user.property/author", String "") ]
           [] ])
    (tts "properties-only-no-children") "";
  check_v "title-only-with-children template"
    (Vector
       [ tree "TITLE" []
           [ tree "intro" [] []; tree "notes" [] [] ] ])
    (tts "title-only-with-children") "";
  check_v "empty-title-with-children template"
    (Vector
       [ tree "" []
           [ tree "intro" [] []; tree "notes" [] [] ] ])
    (tts "empty-title-with-children") "";
  check_v "children-only template"
    (Vector [ tree "intro" [] []; tree "notes" [] [] ])
    (tts "children-only") "";
  check_v "nested-father template"
    (Vector
       [ tree "it's a template with nested templates"
           [ ("user.property/name", String "you named it") ]
           [ tree "nested-child-1" []
               [ tree "child-1"
                   [ ("user.property/name", String "") ]
                   [ tree "child-1-1"
                       [ ("user.property/name", String "") ]
                       [] ] ];
             tree "nested-child-2" []
               [ tree "child-2-1"
                   [ ("user.property/name", String "") ]
                   [] ];
             tree "child-3" [ ("user.property/name", String "") ] [] ] ])
    (tts "nested-father") "";
  check_v "nested-child-1 template"
    (Vector
       [ tree "child-1"
           [ ("user.property/name", String "") ]
           [ tree "child-1-1"
               [ ("user.property/name", String "") ]
               [] ] ])
    (tts "nested-child-1") "";
  check_v "nested-child-2 template"
    (Vector
       [ tree "child-2-1"
           [ ("user.property/name", String "") ]
           [] ])
    (tts "nested-child-2") "";
  (* Assets *)
  check_v "Asset has correct properties"
    (Map
       [ (Keyword "block/tags", Vector [ Keyword "logseq.class/Asset" ]);
         (Keyword "logseq.property.asset/type", String "png");
         ( Keyword "logseq.property.asset/checksum",
           String
             "3d5e620cac62159d8196c118574bfea7a16e86fa86efd1c3fa15a00a0a08792d" );
         (Keyword "logseq.property.asset/size", Int 753471);
         ( Keyword "logseq.property.asset/resize-metadata",
           Map
             [ (Keyword "height", Int 288); (Keyword "width", Int 252) ] ) ])
    (props_map
       (find_block_exn db "greg-popovich-thumbs-up_1704749687791_0")) "";
  check_v "Zotero linked pdf asset has correct external path info"
    (Map
       [ ( Keyword "block/tags",
           Vector [ Keyword "logseq.class/Asset" ] );
         (Keyword "logseq.property.asset/type", String "pdf");
         ( Keyword "logseq.property.asset/external-url",
           String "zotero://select/library/items/QDM8H6EH" );
         ( Keyword "logseq.property.asset/external-file-name",
           String "zotero-link://it/Understanding EXPLAIN.pdf" ) ])
    (props_select
       [ "block/tags"; "logseq.property.asset/type"
       ; "logseq.property.asset/external-url"
       ; "logseq.property.asset/external-file-name" ]
       (find_block_exn db "Understanding EXPLAIN"))
    "";
  check_v "Zotero imported pdf asset has correct external path info"
    (Map
       [ ( Keyword "block/tags",
           Vector [ Keyword "logseq.class/Asset" ] );
         (Keyword "logseq.property.asset/type", String "pdf");
         ( Keyword "logseq.property.asset/external-url",
           String "zotero://select/library/items/RX5JS7SY" );
         ( Keyword "logseq.property.asset/external-file-name",
           String "zotero-path://RX5JS7SY/zlib.pdf" ) ])
    (props_select
       [ "block/tags"; "logseq.property.asset/type"
       ; "logseq.property.asset/external-url"
       ; "logseq.property.asset/external-file-name" ]
       (find_block_exn db "zlib"))
    "";
  eq "Imported into Asset page"
    (match Datascript.entity db (Ident "logseq.class/Asset") with
     | Some e -> e.id
     | None -> -1)
    (match
       ref_ent'
         (find_block_exn db "greg-popovich-thumbs-up_1704749687791_0")
         "block/page"
     with
     | Some e -> e.id
     | None -> -1)
    "";
  (* Annotations *)
  check_v "Pdf text highlight has correct properties"
    (Map
       [ ( Keyword "logseq.property.pdf/hl-color",
           Keyword "logseq.property/color.blue" );
         (Keyword "logseq.property.pdf/hl-page", Int 8);
         ( Keyword "block/tags",
           Vector [ Keyword "logseq.class/Pdf-annotation" ] );
         ( Keyword "logseq.property/asset",
           String
             "Sina_de_Capoeria_Batizado_2025_-_Program_Itinerary_1752179325104_0" ) ])
    (props_dissoc
       [ "logseq.property.pdf/hl-value"; "logseq.property/ls-type" ]
       (find_block_re_exn db "Duke School - modified"))
    "";
  eq "Pdf text highlight has correct children blocks"
    [ "note about duke"; "sub note" ]
    (match
       getv'
         (find_block_re_exn db "Duke School - modified") "block/uuid"
     with
     | Some (Uuid u) ->
         List.tl
           (List.filter_map
              (fun (e : entity) -> Ldb.string_value e "block/title")
              (Ldb.get_block_and_children db u))
     | _ -> [])
    "";
  check_v "Pdf area highlight has correct properties"
    (Map
       [ ( Keyword "logseq.property.pdf/hl-color",
           Keyword "logseq.property/color.yellow" );
         (Keyword "logseq.property.pdf/hl-page", Int 1);
         ( Keyword "block/tags",
           Vector [ Keyword "logseq.class/Pdf-annotation" ] );
         ( Keyword "logseq.property/asset",
           String
             "Sina_de_Capoeria_Batizado_2025_-_Program_Itinerary_1752179325104_0" );
         (Keyword "logseq.property.pdf/hl-image", String "pdf area highlight");
         (Keyword "logseq.property.pdf/hl-type", Keyword "area") ])
    (match
       q_eids db
         "[:find [?b ...] :where [?b :block/tags :logseq.class/Pdf-annotation] [?b :block/title \"\"]]"
     with
     | id :: _ -> (
         match Ldb.ent_of_id db id with
         | Some e ->
             props_dissoc
               [ "logseq.property.pdf/hl-value"; "logseq.property/ls-type" ]
               e
         | None -> Map [])
     | [] -> Map [])
    "";
  eq "Pdf annotation without text imports with an empty title" ""
    (match
       Datascript.entity db
         (Ident "68702499-159a-4a14-a0cf-cf5f015535c2")
     with
     | Some e -> Option.value ~default:"" (Ldb.string_value e "block/title")
     | None -> (
         match
           q_eids db
             "[:find [?b ...] :where [?b :block/uuid ?u]]"
         with
         | _ -> ""))
    "";
  check_v "Zotero linked pdf text highlight links to correct asset"
    (Map
       [ ( Keyword "block/tags",
           Vector [ Keyword "logseq.class/Pdf-annotation" ] );
         (Keyword "logseq.property/asset", String "Understanding EXPLAIN");
         ( Keyword "logseq.property.pdf/hl-color",
           Keyword "logseq.property/color.yellow" );
         (Keyword "logseq.property.pdf/hl-page", Int 6) ])
    (props_select
       [ "block/tags"; "logseq.property/asset"
       ; "logseq.property.pdf/hl-color"; "logseq.property.pdf/hl-page" ]
       (find_block_re_exn db "EXPLAIN is a really nice command"))
    "";
  check_v "Zotero imported pdf text highlight links to correct asset"
    (Map
       [ ( Keyword "block/tags",
           Vector [ Keyword "logseq.class/Pdf-annotation" ] );
         (Keyword "logseq.property/asset", String "zlib");
         ( Keyword "logseq.property.pdf/hl-color",
           Keyword "logseq.property/color.red" );
         (Keyword "logseq.property.pdf/hl-page", Int 1) ])
    (props_select
       [ "block/tags"; "logseq.property/asset"
       ; "logseq.property.pdf/hl-color"; "logseq.property.pdf/hl-page" ]
       (find_block_re_exn db
          "The zlib library is a general purpose data compression library"))
    "";
  let area_hl_props (asset_title : string) : value =
    match
      Datascript.q_string db
        ~inputs:[ Arg_scalar (Result_value (String asset_title)) ]
        "[:find (pull ?b [:block/title {:block/tags [:db/ident]} {:logseq.property/asset [:block/title]} {:logseq.property.pdf/hl-image [:block/title]} {:logseq.property.pdf/hl-color [:db/ident]} :logseq.property.pdf/hl-type :logseq.property.pdf/hl-page]) . :in $ ?t :where [?asset :block/title ?t] [?asset :block/tags :logseq.class/Asset] [?b :block/title \"[:span]\"] [?b :logseq.property/asset ?asset]]"
    with
    | [ [ Result_pull p ] ] ->
        let s a = Option.value ~default:Nil (pulled_scalar a p) in
        Map
          [ ( Keyword "block/tags",
              Vector
                (List.filter_map
                   (fun t -> pulled_scalar "db/ident" t)
                   (pulled_ents "block/tags" p)) );
            ( Keyword "logseq.property/asset",
              (match pulled_ents "logseq.property/asset" p with
               | [ a ] -> (
                   match pulled_scalar "block/title" a with
                   | Some v -> v
                   | None -> Nil)
               | _ -> Nil) );
            ( Keyword "logseq.property.pdf/hl-image",
              (match pulled_ents "logseq.property.pdf/hl-image" p with
               | [ i ] -> (
                   match pulled_scalar "block/title" i with
                   | Some v -> v
                   | None -> Nil)
               | _ -> Nil) );
            ( Keyword "logseq.property.pdf/hl-color",
              (match pulled_ents "logseq.property.pdf/hl-color" p with
               | [ c ] -> (
                   match pulled_scalar "db/ident" c with
                   | Some v -> v
                   | None -> Nil)
               | _ -> Nil) );
            ( Keyword "logseq.property.pdf/hl-type",
              s "logseq.property.pdf/hl-type" );
            ( Keyword "logseq.property.pdf/hl-page",
              s "logseq.property.pdf/hl-page" ) ]
    | _ -> Map []
  in
  check_v "Zotero linked pdf area highlight links to correct asset"
    (Map
       [ ( Keyword "block/tags",
           Vector [ Keyword "logseq.class/Pdf-annotation" ] );
         ( Keyword "logseq.property/asset",
           String "Understanding EXPLAIN" );
         ( Keyword "logseq.property.pdf/hl-color",
           Keyword "logseq.property/color.green" );
         ( Keyword "logseq.property.pdf/hl-image",
           String "pdf area highlight" );
         (Keyword "logseq.property.pdf/hl-type", Keyword "area");
         (Keyword "logseq.property.pdf/hl-page", Int 8) ])
    (area_hl_props "Understanding EXPLAIN") "";
  check_v "Zotero imported pdf area highlight links to correct asset"
    (Map
       [ ( Keyword "block/tags",
           Vector [ Keyword "logseq.class/Pdf-annotation" ] );
         (Keyword "logseq.property/asset", String "zlib");
         ( Keyword "logseq.property.pdf/hl-color",
           Keyword "logseq.property/color.blue" );
         ( Keyword "logseq.property.pdf/hl-image",
           String "pdf area highlight" );
         (Keyword "logseq.property.pdf/hl-type", Keyword "area");
         (Keyword "logseq.property.pdf/hl-page", Int 1) ])
    (area_hl_props "zlib") "";
  (* Quotes *)
  check "Mixed #+BEGIN_QUOTE block: heading retained and quote prefixed '>'"
    (str_starts_with
       (Option.value ~default:""
          (get_string' (find_block_re_exn db "Saito") "block/title"))
       "From Inception:\n> Saito:") "";
  check "Mixed #+BEGIN_QUOTE block is not converted to a Quote-block"
    (Option.is_none
       (prop_get (find_block_re_exn db "Saito")
          "logseq.property.node/display-type")) "";
  eq "Markdown quote imports as full multi-line quote"
    "markdown quote\n[[wut]]\nline 3"
    (Option.value ~default:""
       (get_string' (find_block_re_exn db "markdown quote") "block/title"))
    "";
  check
    "Mixed #+BEGIN_QUOTE block retains heading and quote content in block title"
    (str_starts_with
       (Option.value ~default:""
          (get_string' (find_block_re_exn db "Learn Datalog") "block/title"))
       "Test of various ast types:\n> *Italic*")
    "";
  eq "Nested '>> quote' is preserved as '> ' prefix in Quote-block title"
    "Blockquotes\n> Nested Blockquotes"
    (Option.value ~default:""
       (get_string' (find_block_re_exn db "Nested Blockquotes") "block/title"))
    "";
  check_v "Nested markdown quote block is tagged as Quote-block"
    (Keyword "quote")
    (Option.value ~default:Nil
       (prop_get (find_block_re_exn db "Nested Blockquotes")
          "logseq.property.node/display-type"))
    "";
  eq "#+BEGIN_QUOTE pure block title has no '> ' prefix — display-type provides blockquote styling"
    "it's a\n\norg blockquote"
    (Option.value ~default:""
       (get_string' (find_block_re_exn db "org blockquote") "block/title"))
    "";
  check_v "#+BEGIN_QUOTE pure block is tagged as Quote-block"
    (Keyword "quote")
    (Option.value ~default:Nil
       (prop_get (find_block_re_exn db "org blockquote")
          "logseq.property.node/display-type"))
    "";
  eq
    "Mixed #+BEGIN_QUOTE at start of block: quote content prefixed with '>' and blank line separates following text"
    "> Blockquotes\n> and\n\nsomething else"
    (Option.value ~default:""
       (get_string' (find_block_re_exn db "Blockquotes\n> and") "block/title"))
    "";
  check
    "Mixed #+BEGIN_QUOTE block at start is not converted to a Quote-block"
    (Option.is_none
       (prop_get (find_block_re_exn db "Blockquotes\n> and")
          "logseq.property.node/display-type"))
    "";
  check "Mixed markdown quote block preserves nested quote depth"
    (Common_util.str_includes
       (Option.value ~default:""
          (get_string' (find_block_re_exn db "Question 1") "block/title"))
       "\n>> nested")
    "";
  check "Mixed markdown quote block is not converted to a Quote-block"
    (Option.is_none
       (prop_get (find_block_re_exn db "Question 1")
          "logseq.property.node/display-type"))
    "";
  check "Mixed markdown quote child block preserves separated quote lines"
    (Common_util.str_includes
       (Option.value ~default:""
          (get_string' (find_block_re_exn db "Question 2") "block/title"))
       "> Question 3")
    "";
  check "Mixed markdown quote child block preserves quote content after blank quote line"
    (Common_util.str_includes
       (Option.value ~default:""
          (get_string' (find_block_re_exn db "Question 2") "block/title"))
       "> Answer 3")
    "";
  (* testing "embeds" *)
  check_v "Page embed linked correctly"
    (Map [ (Keyword "block/title", String "") ])
    (match
       q_pulls_in db
         "[:find [(pull ?b [*]) ...] :in $ ?title :where [?b :block/link ?l] [?b :block/page ?bp] [?bp :block/journal-day 20250612] [?l :block/title ?title]]"
         [ String "page embed" ]
     with
     | p :: _ -> (
         match pulled_scalar "block/title" p with
         | Some v -> (Map [ (Keyword "block/title", v) ] : value)
         | None -> Map [])
     | [] -> Map [])
    "";
  check_v "Block embed linked correctly"
    (Map [ (Keyword "block/title", String "") ])
    (match
       q_pulls_in db
         "[:find [(pull ?b [*]) ...] :in $ ?title :where [?b :block/link ?l] [?b :block/page ?bp] [?bp :block/journal-day 20250612] [?l :block/title ?title]]"
         [ String "test block embed" ]
     with
     | p :: _ -> (
         match pulled_scalar "block/title" p with
         | Some v -> (Map [ (Keyword "block/title", v) ] : value)
         | None -> Map [])
     | [] -> Map [])
    "";
  (* testing "tags convert to classes" *)
  eq "Namespaced tag's ident has hierarchy to make it unique"
    "user.class/Quotes___life"
    (Option.value ~default:"" (Ldb.ident_of (find_page_exn db "life")))
    "";
  eq
    "When a class is used and referenced on the same page, there should only be one instance of it"
    [ "logseq.class/Tag" ] (ref_idents (find_page_exn db "life") "block/tags")
    "";
  eq
    "Block tagged with namespace tag is only associated with leaf child tag"
    [ "user.class/Quotes___life" ]
    (ref_idents (find_block_re_exn db "with namespace tag") "block/tags")
    "";
  check_v "Block with tags through tags property"
    (Set
       [ Keyword "user.class/ai";
         Keyword "user.class/block-tag";
         Keyword "user.class/p1" ])
    (Set
       (List.map (fun s -> Keyword s)
          (ref_idents (find_block_re_exn db "Block tags") "block/tags"))) "";
  eq "All classes only have :logseq.class/Tag as their tag"
    []
    (q_pulls db
       "[:find (pull ?b [:block/title {:block/tags [:db/ident]}]) :where [?b :block/tags :logseq.class/Tag]]"
    |> List.filter (fun p ->
           let tags =
             List.filter_map
               (fun t -> pulled_scalar "db/ident" t)
               (pulled_ents "block/tags" p)
           in
           not (tags = [ Keyword "logseq.class/Tag" ])))
    "";
  (* testing "namespaces" *)
  let rec expand_children (e : entity) parent : (string * string) list =
    match Ldb.ref_ents e "block/_parent" with
    | [] ->
        [ ( Option.value ~default:""
              (match parent with
               | Some (p : entity) -> Ldb.string_value p "block/title"
               | None -> None),
            Option.value ~default:"" (Ldb.string_value e "block/title") ) ]
    | children ->
        ( Option.value ~default:""
            (match parent with
             | Some p -> Ldb.string_value p "block/title"
             | None -> None),
          Option.value ~default:"" (Ldb.string_value e "block/title") )
        :: List.concat_map
             (fun c -> expand_children c (Some e))
             children
  in
  let n_pairs pairs : value list =
    List.map
      (fun (p, c) ->
        (Map
           [ (Keyword "parent", String p); (Keyword "child", String c) ]
         : value))
      pairs
  in
  let take n l =
    let rec go i acc = function
      | x :: xs when i < n -> go (i + 1) (x :: acc) xs
      | _ -> List.rev acc
    in
    go 0 [] l
  in
  let rest = function _ :: tl -> tl | [] -> [] in
  check_v "First namespace tests duplicate parent page name"
    (Vector
       (n_pairs
          [ ("n1", "x"); ("x", "z"); ("x", "y") ]))
    (Vector
       (n_pairs
          (take 3
             (rest (expand_children (find_page_exn db "n1") None)))))
    "";
  check_v "First namespace tests duplicate child page name and built-in page name"
    (Vector (n_pairs [ ("n2", "x"); ("x", "z"); ("n2", "alias") ]))
    (Vector
       (n_pairs (rest (expand_children (find_page_exn db "n2") None))))
    "";
  (* testing "journal timestamps" *)
  check_v "journal pages are created on their journal day"
    (Common_util.value_of_ms (Date_time_util.int_to_local_ms 20240207))
    (Option.value ~default:Nil
       (getv' (find_page_exn db "Feb 7th, 2024") "block/created-at"))
    "";
  check_v "journal blocks are created on their page's journal day"
    (Common_util.value_of_ms (Date_time_util.int_to_local_ms 20240207))
    (Option.value ~default:Nil
       (getv' (find_block_re_exn db "Inception") "block/created-at"))
    "";
  (* testing "db attributes" *)
  check_v "Collapsed blocks are imported" (Bool true)
    (Option.value ~default:Nil
       (getv' (find_block_re_exn db "collapsed block") "block/collapsed?"))
    "";
  (* testing "property :type changes" *)
  eq ":date property to :node value changes to :node"
    ((Some (Keyword "node")) : value option)
    (prop_type_of "user.property/finishedat") "";
  eq "template values cause participants to remain a :default property"
    ((Some (Keyword "default")) : value option)
    (prop_type_of "user.property/participants") "";
  check_v ":default participants property keeps the imported text value"
    (Set [ String "[[Feb 7th, 2024]]" ])
    (Option.value ~default:Nil
       (prop_get (find_block_re_exn db "test :node -> :date")
          "user.property/participants"))
    "";
  eq
    ":default property to :node (or any non :default value) remains :default"
    ((Some (Keyword "default")) : value option)
    (prop_type_of "user.property/description") "";
  check_v
    ":default to :node property saves :default property value default with full text"
    (String "[[Jakob]]")
    (Option.value ~default:Nil
       (prop_get (find_block_re_exn db ":default to :node")
          "user.property/description"))
    "";
  (* with changes to upstream/existing property value *)
  eq ":number property to :default value changes to :default"
    ((Some (Keyword "default")) : value option)
    (prop_type_of "user.property/duration") "";
  check_v "existing :number property value correctly saved as :default"
    (String "20")
    (Option.value ~default:Nil
       (prop_get (find_block_exn db "existing :number to :default")
          "user.property/duration"))
    "";
  eq ":node property changes to :default when :node is defined in same file"
    ((Some (Keyword "default")) : value option)
    (prop_type_of "user.property/people2") "";
  check_v
    ":node property to :default value changes to :default and keeps existing cardinality"
    (Map
       [ Keyword "logseq.property/type", Keyword "default"
       ; Keyword "db/cardinality", Keyword "db.cardinality/many" ])
    (Map
       (match Datascript.entity db (Ident "user.property/people") with
        | Some e ->
            List.filter_map
              (fun (a : attr) ->
                match Ldb.value e a with
                | Some v -> Some (Keyword a, v)
                | None -> None)
              [ "logseq.property/type"; "db/cardinality" ]
        | None -> []))
    "";
  check_v
    "existing :node property value correctly saved as :default with full text"
    (Set [ String "[[Jakob]] [[Gabriel]]" ])
    (Option.value ~default:Nil
       (prop_get (find_block_exn db ":node people") "user.property/people"))
    "";
  check_v
    "pending :node property value correctly saved as :default with full text"
    (Set [ String "[[Gabriel]] [[Jakob]]" ])
    (Option.value ~default:Nil
       (prop_get (find_block_re_exn db "pending block for :node")
          "user.property/people"))
    "";
  check_some "Previous :node property value still exists"
    (find_page db "Jakob") "";
  eq "Converted property has correct number of property values" 3
    (List.length (find_block_by_property db "user.property/people")) "";
  (* testing "imported concepts can have names of new-built concepts" *)
  check_v "user description property is separate from built-in one"
    (Set
       [ Keyword "logseq.property/description"
       ; Keyword "user.property/description" ])
    (Set
       (q_values db
          "[:find [?ident ...] :where [?b :db/ident ?ident] [?b :block/name \"description\"]]"))
    "";
  check_v "user page is separate from built-in class"
    (Set [ String "Page"; String "Tag" ])
    (Set
       (q_values db
          "[:find [?t-title ...] :where [?b :block/tags ?t] [?b :block/name \"task\"] [?t :block/title ?t-title]]"))
    "";
  (* testing "multiline blocks" *)
  eq "multiline markdown table keeps title" "|markdown| table|\n|some|thing|"
    (Option.value ~default:""
       (get_string' (find_block_re_exn db "markdown.*table") "block/title"))
    "";
  eq "normal multiline block keeps title"
    "normal multiline block\na 2nd\nand a 3rd"
    (Option.value ~default:""
       (get_string' (find_block_re_exn db "normal multiline block")
          "block/title"))
    "";
  eq "colored multiline block keeps title"
    "colored multiline block\nlast line"
    (Option.value ~default:""
       (get_string' (find_block_re_exn db "colored multiline block")
          "block/title"))
    "";
  let mb_prop_deadline =
    find_block_re_exn db "multiline block with prop and deadline"
  in
  eq "multiline block with prop and deadline keeps title"
    "multiline block with prop and deadline\nlast line"
    (Option.value ~default:"" (get_string' mb_prop_deadline "block/title"))
    "";
  eq "multiline block has correct journal as property value" 20221126
    (match prop_get mb_prop_deadline "logseq.property/deadline" with
     | Some v -> journal_day_of_value v
     | _ -> -1)
    "";
  check_v "multiline block has correct background color as property value"
    (String "red")
    (Option.value ~default:Nil
       (prop_get mb_prop_deadline "logseq.property/background-color"))
    "";
  let mb_deadline_scheduled =
    find_block_re_exn db
      "multiline block with deadline and scheduled in 1 line and sth else"
  in
  eq "multiline block with deadline and scheduled keeps title"
    "multiline block with deadline and scheduled in 1 line and sth else\nsomething else\nlast line"
    (Option.value ~default:""
       (get_string' mb_deadline_scheduled "block/title"))
    "";
  eq
    "multiline block with deadline and scheduled has correct deadline journal as property value"
    20221126
    (match prop_get mb_deadline_scheduled "logseq.property/deadline" with
     | Some v -> journal_day_of_value v
     | _ -> -1)
    "";
  eq
    "multiline block with deadline and scheduled has correct scheduled journal as property value"
    20221126
    (match prop_get mb_deadline_scheduled "logseq.property/scheduled" with
     | Some v -> journal_day_of_value v
     | _ -> -1)
    "";
  eq "logbook block keeps title" "logbook block"
    (Option.value ~default:""
       (get_string' (find_block_re_exn db "^logbook block") "block/title"))
    "";
  eq "multiline logbook block keeps title" "multiline logbook block\nlast line"
    (Option.value ~default:""
       (get_string' (find_block_re_exn db "multiline logbook block")
          "block/title"))
    "";
  (* testing ":block/refs" *)
  check "Page has correct property and property value :block/refs"
    (List.for_all (fun t -> t)
       (List.map
          (fun t -> List.mem t (ref_titles (find_page_exn db "chat-gpt") "block/refs"))
          [ "type"; "LargeLanguageModel" ]))
    "";
  check "Block has correct task tag and property :block/refs"
    (List.for_all (fun t -> t)
       (List.map
          (fun i ->
            List.mem i
              (ref_idents (find_block_exn db "old todo block") "block/refs"))
          [ "logseq.property/status"; "logseq.class/Task" ]))
    ""

let test_export_basic_graph_with_convert_all_tags_option_disabled () =
  let file_graph_dir =
    Filename.concat (test_resources_dir ()) "exporter-test-graph"
  in
  let conn = create_conn () in
  let import_state =
    import_file_graph_to_db file_graph_dir conn
      { (default_import_opts ()) with convert_all_tags = false }
  in
  let db = Datascript.db conn in
  check_valid "Created graph has no validation errors" db;
  eq "No ignored properties" 0
    (ignored_count "ignored-properties" import_state) "";
  eq "Correct number of user classes" 0
    (List.length
       (q_values db
          "[:find [?ident ...] :where [?b :block/tags :logseq.class/Tag] [?b :db/ident ?ident] (not [?b :logseq.property/built-in?])]"))
    "";
  let tagged_eid_count (tag_ident : string) : int =
    List.length
      (q_eids db
         (Printf.sprintf "[:find ?b :where [?b :block/tags %s]]" tag_ident))
  in
  eq "Task count" 6 (tagged_eid_count ":logseq.class/Task") "";
  eq "Query count" 4 (tagged_eid_count ":logseq.class/Query") "";
  eq "Card count" 2 (tagged_eid_count ":logseq.class/Card") "";
  (* replacing refs in :block/title when :remove-inline-tags? set *)
  eq
    "A block with ref names that start with same string has 2 distinct refs"
    2
    (match Ldb.raw_title db (find_block_re_exn db "replace with same start string")
     with
     | Some (String t) -> List.length (Db_content.get_matched_ids t)
     | _ -> -1)
    "";
  eq
    "A block with different case of same ref names has 1 distinct ref"
    1
    (match Ldb.raw_title db (find_block_re_exn db "replace case insensitive")
     with
     | Some (String t) -> List.length (Db_content.get_matched_ids t)
     | _ -> -1)
    "";
  (* tags convert to page, refs and page-tags *)
  let inception = find_block_re_exn db "Inception" in
  let tag_page = find_page_exn db "Movie" in
  check "tagged block tag converts tag to page ref"
    (str_starts_with
       (Option.value ~default:"" (get_string' inception "block/title"))
       "Inception [[")
    "";
  eq "tagged block has correct refs" [ tag_page.id ]
    (List.map (fun e -> e.id) (ref_ents' inception "block/refs")) "";
  check "tag page is not a class" (not (Ldb.is_class tag_page)) "";
  check_v "tagged page has existing page imported as a tag to page-tags"
    (Set [ String "Movie" ])
    (Option.value ~default:Nil
       (prop_get (find_page_exn db "Interstellar")
          "logseq.property/page-tags"))
    "";
  check_v
    "tagged page has new page and other pages marked with '#' and '[[]]' imported as tags to page-tags"
    (Set [ String "LargeLanguageModel"; String "fun"; String "ai" ])
    (Option.value ~default:Nil
       (prop_get (find_page_exn db "chat-gpt")
          "logseq.property/page-tags"))
    ""

let test_import_journals_use_standard_uuids_and_keep_uuid_refs () =
  let file_graph_dir =
    Filename.concat (test_resources_dir ()) "exporter-test-graph"
  in
  let files =
    [ Filename.concat file_graph_dir "journals/2026_01_27.md" ]
  in
  let conn = create_conn () in
  ignore (import_files_to_db files conn (default_import_opts ()));
  let db = Datascript.db conn in
  let journal = Option.get (find_journal_by_journal_day db 20260127) in
  let ref_journal = Option.get (find_journal_by_journal_day db 20260101) in
  let ref_block =
    match
      q_eids_in db
        "[:find [?b ...] :in $ ?page ?ref-page :where [?b :block/page ?page] [?b :block/refs ?ref-page]]"
        [ Int journal.id; Int ref_journal.id ]
    with
    | id :: _ -> Ldb.ent_of_id db id
    | [] -> None
  in
  eq "Imported journal page keeps the standard journal uuid"
((Some (Uuid (Common_uuid.gen_journal_page_uuid 20260127))) : value option)
    (getv' journal "block/uuid") "";
  eq "Referenced journal page keeps the standard journal uuid"
((Some (Uuid (Common_uuid.gen_journal_page_uuid 20260101))) : value option)
    (getv' ref_journal "block/uuid") "";
  check_v "Journal refs point at the standard journal uuid"
    (match getv' ref_journal "block/uuid" with
     | Some u -> Set [ u ]
     | None -> Set [])
    (match ref_block with
     | Some b ->
         Set
           (List.filter_map
              (fun r -> Ldb.value r "block/uuid")
              (ref_ents' b "block/refs"))
     | None -> Set [])
    ""

let test_import_journal_with_slash_title_format_does_not_create_namespace_pages
    () =
  let file_graph_dir =
    Filename.concat (test_resources_dir ()) "exporter-test-graph"
  in
  let files =
    [ Filename.concat file_graph_dir "journals/2026_01_27.md" ]
  in
  let conn = create_conn () in
  ignore
    (import_files_to_db files conn
       { (default_import_opts ()) with
         user_config = [ ("journal/page-title-format", String "yyyy/MM/dd") ] });
  let db = Datascript.db conn in
  let journal = Option.get (find_journal_by_journal_day db 20260127) in
  eq "Journal title follows slash title format" "2026/01/27"
    (Option.value ~default:"" (Ldb.string_value journal "block/title")) "";
  eq "Slash-formatted journal keeps the standard journal uuid"
((Some (Uuid (Common_uuid.gen_journal_page_uuid 20260127))) : value option)
    (getv' journal "block/uuid") "";
  check "Slash-formatted journal does not keep a namespace attribute"
    (Option.is_none (getv' journal "block/namespace")) "";
  check "Journal title is not split into a year namespace page"
    (Option.is_none (find_page_by_title db "2026")) "";
  check "Journal title is not split into a month namespace page"
    (Option.is_none (find_page_by_title db "01")) "";
  check "Journal title is not split into a day namespace page"
    (Option.is_none (find_page_by_title db "27")) ""

let test_import_slash_journal_ref_does_not_create_namespace_pages () =
  let file =
    write_temp_graph_file "journals/2026_05_18.md"
      "- yes\n- [[Sun, 2026/05/17]]\n"
  in
  let conn = create_conn () in
  ignore
    (import_files_to_db [ file ] conn
       { (default_import_opts ()) with
         user_config =
           [ ("journal/page-title-format", String "EEE, yyyy/MM/dd") ] });
  let db = Datascript.db conn in
  let ref_journal = Option.get (find_journal_by_journal_day db 20260517) in
  eq "Journal reference is imported as a journal page" "Sun, 2026/05/17"
    (Option.value ~default:"" (Ldb.string_value ref_journal "block/title"))
    "";
  check "Referenced slash-formatted journal has no namespace attribute"
    (Option.is_none (getv' ref_journal "block/namespace")) "";
  check "Journal reference is not split into a parent namespace page"
    (Option.is_none (find_page_by_title db "Sun, 2026")) "";
  check "Journal reference is not split into a child namespace page"
    (Option.is_none (find_page_by_title db "05")) ""

let test_import_legacy_journal_file_name_refs_as_journals () =
  let source_file =
    write_temp_graph_file "journals/2026_04_01.md"
      "- legacy journal ref [[2026_04_02]]\n"
  in
  let target_file =
    write_temp_graph_file "journals/2026_04_02.md" "- target journal\n"
  in
  let conn = create_conn () in
  ignore
    (import_files_to_db [ source_file; target_file ] conn
       (default_import_opts ()));
  let db = Datascript.db conn in
  let legacy_journal = find_journal_by_journal_day db 20260402 in
  let legacy_ref_block = find_block_re_exn db "legacy journal ref" in
  check "Legacy yyyy_MM_dd journal page refs resolve imported journal files"
    (Option.is_some legacy_journal) "";
  check_v "Legacy journal page ref points at the journal page"
    (match legacy_journal with
     | Some j -> (
         match getv' j "block/uuid" with
         | Some u -> Set [ u ]
         | None -> Set [])
     | None -> Set [])
    (Set
       (List.filter_map
          (fun r -> Ldb.value r "block/uuid")
          (ref_ents' legacy_ref_block "block/refs"))) "";
  check "Legacy journal page ref does not create an ordinary page"
    (Option.is_none (find_page_by_title db "2026_04_02")) ""

let test_import_default_format_journal_refs_with_custom_title_format () =
  let dir =
    write_temp_file_graph
      [ ( "pages/source.md",
          "- existing journal [[May 18th, 2021]]\n- missing journal [[May 19th, 2021]]\n" );
        ("journals/2021_05_18.md", "- journal entry\n");
        ("pages/2021_05_19.md", "- ordinary date-named page\n") ]
  in
  let source_file =
    Common_path.path_join dir [ "pages"; "source.md" ]
  in
  let journal_file =
    Common_path.path_join dir [ "journals"; "2021_05_18.md" ]
  in
  let ordinary_date_file =
    Common_path.path_join dir [ "pages"; "2021_05_19.md" ]
  in
  let conn = create_conn () in
  ignore
    (import_files_to_db
       [ source_file; journal_file; ordinary_date_file ]
       conn
       { (default_import_opts ()) with
         user_config =
           [ ("journal/page-title-format", String "EEEE, dd-MM-yyyy") ] });
  let db = Datascript.db conn in
  let existing_journal =
    Option.get (find_journal_by_journal_day db 20210518)
  in
  let missing_page = find_page_by_title db "May 19th, 2021" in
  let existing_ref_block = find_block_re_exn db "existing journal" in
  let missing_ref_block = find_block_re_exn db "missing journal" in
  eq "Default-format ref resolves the journal file using the configured title"
    "Tuesday, 18-05-2021"
    (Option.value ~default:""
       (Ldb.string_value existing_journal "block/title")) "";
  check_v "Existing journal does not retain the ordinary page tag"
    (Set [ Keyword "logseq.class/Journal" ])
    (Set
       (List.map (fun s -> Keyword s)
          (ref_idents existing_journal "block/tags"))) "";
  check_v "Existing journal ref points at the journal page"
    (match getv' existing_journal "block/uuid" with
     | Some u -> Set [ u ]
     | None -> Set [])
    (Set
       (List.filter_map
          (fun r -> Ldb.value r "block/uuid")
          (ref_ents' existing_ref_block "block/refs"))) "";
  check_v "Default-format ref without journals file remains an ordinary page"
    (Set [ Keyword "logseq.class/Page" ])
    (match missing_page with
     | Some p ->
         Set
           (List.map (fun s -> Keyword s)
              (ref_idents p "block/tags"))
     | None -> Set [])
    "";
  check "Date-named file outside journals does not create a journal"
    (Option.is_none (find_journal_by_journal_day db 20210519)) "";
  check_v "Missing journal ref points at the ordinary page"
    (match missing_page with
     | Some p -> (
         match getv' p "block/uuid" with
         | Some u -> Set [ u ]
         | None -> Set [])
     | None -> Set [])
    (Set
       (List.filter_map
          (fun r -> Ldb.value r "block/uuid")
          (ref_ents' missing_ref_block "block/refs"))) ""

let test_import_creates_missing_ordinary_page_refs () =
  let file =
    write_temp_graph_file "pages/source.md"
      "- missing page ref [[Missing Page]]\n"
  in
  let conn = create_conn () in
  ignore (import_files_to_db [ file ] conn (default_import_opts ()));
  let db = Datascript.db conn in
  let missing_page = find_page_by_title db "Missing Page" in
  let source_block = find_block_re_exn db "missing page ref" in
  check "Missing ordinary page refs create ordinary pages"
    (Option.is_some missing_page) "";
  check_v "Missing ordinary page ref points at the created page"
    (match missing_page with
     | Some p -> (
         match getv' p "block/uuid" with
         | Some u -> Set [ u ]
         | None -> Set [])
     | None -> Set [])
    (Set
       (List.filter_map
          (fun r -> Ldb.value r "block/uuid")
          (ref_ents' source_block "block/refs"))) ""

let test_import_page_drawer_properties_write_refs_on_the_page () =
  let file =
    write_temp_graph_file "pages/Zorba the Greek (1964).md"
      "tags:: movies\ntitle:: Zorba the Greek (1964)\ngenre:: [[Comedy]], [[Drama]]\nactors:: [[Anthony Quinn]], [[Alan Bates]]\n"
  in
  let conn = create_conn () in
  ignore
    (import_files_to_db [ file ] conn
       { (default_import_opts ()) with convert_all_tags = true });
  let db = Datascript.db conn in
  let page = find_page_by_title db "Zorba the Greek (1964)" in
  let comedy = find_page_exn db "Comedy" in
  let drama = find_page_exn db "Drama" in
  let quinn = find_page_exn db "Anthony Quinn" in
  let bates = find_page_exn db "Alan Bates" in
  check "Movie page is imported" (Option.is_some page) "";
  let page = Option.get page in
  let props = readable_properties page in
  let ref_titles = ref_titles page "block/refs" in
  check "Genre page refs are stored on the movie page"
    (v_eq_opt (Some (Set [ String "Comedy"; String "Drama" ]))
       (List.assoc_opt "user.property/genre" props)) "";
  check "Actor page refs are stored on the movie page"
    (v_eq_opt
       (Some (Set [ String "Anthony Quinn"; String "Alan Bates" ]))
       (List.assoc_opt "user.property/actors" props)) "";
  check "Page drawer refs are written onto the page :block/refs"
    (List.for_all
       (fun t -> List.mem t ref_titles)
       [ "Comedy"; "Drama"; "Anthony Quinn"; "Alan Bates" ]) "";
  List.iter
    (fun (e, n) ->
      eq (n ^ " linked references include the movie page") 1
        (List.length
           (List.of_seq
              (Datascript.datoms db Avet ~a:"block/refs"
                 ~v:(Ref e.id) ())))
        "")
    [ (comedy, "Comedy"); (drama, "Drama"); (quinn, "Actor");
      (bates, "Actor") ]

let test_import_favorites_from_og_config_edn () =
  let dir =
    write_temp_file_graph
      [ ( "logseq/config.edn",
          "{:favorites [\"Projects\" \"[[Projects]]\" \"foo/bar\"]\n :file/name-format :triple-lowbar}\n" );
        ("pages/Projects.md", "- project work\n- [[foo/bar]]\n") ]
  in
  let conn = create_conn () in
  Outliner_db_pipeline.add_listener conn;
  ignore
    (import_file_graph_to_db dir conn (default_import_opts ()));
  let db = Datascript.db conn in
  let favorite_titles = imported_favorite_titles db in
  eq "Bare names, bracketed page refs, and namespaced pages each become a favorite link"
    3 (List.length favorite_titles) "";
  check_v "Imported favorites resolve to the original pages including flattened namespaces"
    (Set [ String "Projects"; String "foo/bar" ])
    (Set
       (List.map (fun s -> String s)
          (List.fold_left
             (fun acc t -> if List.mem t acc then acc else acc @ [ t ])
             [] favorite_titles))) ""

let test_import_namespaced_pages_assign_block_order () =
  let files =
    [ ("pages/Country___Australia.md", "- Sydney\n");
      ("pages/Country___Canada.md", "- Ottawa\n");
      ("pages/Continent___Asia___Japan.md", "- Tokyo\n") ]
  in
  let dir =
    write_temp_file_graph
      (files
       @ [ ( "logseq/config.edn",
             "{:file/name-format :triple-lowbar}\n" ) ])
  in
  List.iter
    (fun import_mode ->
      let conn = create_conn () in
      (match import_mode with
       | `File_graph ->
           ignore
             (import_file_graph_to_db dir conn (default_import_opts ()))
       | `Doc_files ->
           let file_paths =
             List.map
               (fun (p, _) ->
                 Common_path.path_join dir
                   (String.split_on_char '/' p))
               files
           in
           ignore
             (import_files_to_db file_paths conn (default_import_opts ())));
      let db = Datascript.db conn in
      let library =
        Option.get
          (Ldb.get_built_in_page db Common_config.library_page_name)
      in
      let country = find_page_exn db "Country" in
      let australia = find_page_exn db "Australia" in
      let canada = find_page_exn db "Canada" in
      let continent = find_page_exn db "Continent" in
      let asia = find_page_exn db "Asia" in
      let japan = find_page_exn db "Japan" in
      let nested_pages = [ australia; canada; asia; japan ] in
      let ordered_pages =
        match import_mode with
        | `File_graph -> nested_pages @ [ country; continent ]
        | `Doc_files -> nested_pages
      in
      check_v
        (Printf.sprintf "%s: Imported pages preserve their namespace parents"
           (match import_mode with
            | `File_graph -> "file-graph"
            | `Doc_files -> "doc-files"))
        (Vector
           [ String "Country"; String "Country"; String "Continent";
             String "Asia" ])
        (Vector
           (List.map
              (fun p ->
                String
                  (match parent_of p with
                   | Some par ->
                       Option.value ~default:""
                         (Ldb.string_value par "block/title")
                   | None -> ""))
              nested_pages))
        "";
      check "Every imported hierarchy child has a string order"
        (List.for_all
           (fun p ->
             match getv' p "block/order" with
             | Some (String _) -> true
             | _ -> false)
           ordered_pages)
        "";
      check "Sibling imported pages get distinct orders"
        (getv' australia "block/order" <> getv' canada "block/order")
        "";
      (match import_mode with
       | `File_graph ->
           check_v "Top-level hierarchy parents are moved under Library"
             (Vector [ Int library.id; Int library.id ])
             (Vector
                (List.map
                   (fun p ->
                     (Int
                        (match parent_of p with
                         | Some par -> par.id
                         | None -> -1)
                      : value))
                   [ country; continent ]))
             ""
       | `Doc_files -> ()))
    [ `File_graph; `Doc_files ]

let test_import_namespaced_pages_order_after_parent_content_blocks () =
  let dir =
    write_temp_file_graph
      [ ("logseq/config.edn", "{:file/name-format :triple-lowbar}\n");
        ("pages/Country.md", "- Overview\n");
        ("pages/Country___Australia.md", "- Sydney\n") ]
  in
  let conn = create_conn () in
  ignore (import_file_graph_to_db dir conn (default_import_opts ()));
  let db = Datascript.db conn in
  let country = find_page_exn db "Country" in
  let australia = find_page_exn db "Australia" in
  let overview = find_block_exn db "Overview" in
  let page_order =
    match getv' australia "block/order" with
    | Some (String s) -> s
    | _ -> ""
  in
  let content_order =
    match getv' overview "block/order" with
    | Some (String s) -> s
    | _ -> ""
  in
  let parent_id (e : entity) =
    match parent_of e with Some p -> p.id | None -> -1
  in
  eq "The imported page and existing content share a parent"
    (List.sort_uniq compare [ parent_id australia; parent_id overview ])
    [ country.id ] "";
  check "The imported page is ordered after existing parent content"
    (page_order <> "" && content_order <> ""
    && String.compare page_order content_order > 0)
    ""

let test_import_normalizes_existing_random_journal_uuid_and_text_refs () =
  let old_journal_uuid = gen_uuid () in
  let standard_journal_uuid =
    Common_uuid.gen_journal_page_uuid 20260127
  in
  let title =
    Printf.sprintf "refs %s and %s"
      (Page_ref.to_page_ref old_journal_uuid)
      (Block_ref.to_block_ref old_journal_uuid)
  in
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page =
              { default_page with
                pg_journal = Some 20260127
              ; pg_uuid = Some old_journal_uuid
              ; pg_extra = [ "build/keep-uuid?", Bool true ] }
          ; blocks =
              [ { default_block with b_title = Some title } ] } ]
      ()
  in
  let file =
    write_temp_graph_file "pages/trigger-normalize.md" "- trigger normalize\n"
  in
  ignore (import_files_to_db [ file ] conn (default_import_opts ()));
  let db = Datascript.db conn in
  let journal =
    Option.get (find_journal_by_journal_day db 20260127)
  in
  let ref_block = find_block_re_exn db "refs" in
  eq "Existing random journal uuid is normalized to the standard journal uuid"
((Some (Uuid standard_journal_uuid)) : value option)
    (getv' journal "block/uuid") "";
  check "Old journal uuid no longer resolves after normalization"
    (Option.is_none
       (Datascript.entity db
          (Lookup_ref ("block/uuid", Uuid old_journal_uuid)))) "";
  eq "Text references are rewritten to the standard journal uuid"
    (Printf.sprintf "refs %s and %s"
       (Page_ref.to_page_ref standard_journal_uuid)
       (Block_ref.to_block_ref standard_journal_uuid))
    (Option.value ~default:"" (get_string' ref_block "block/title")) "";
  eq "Structured block page reference still points to the same journal entity"
    (Some journal.id)
    (match ref_ent' ref_block "block/page" with
     | Some p -> Some p.id
     | None -> None) ""

let test_export_files_with_tag_classes_option () =
  let file_graph_dir =
    Filename.concat (test_resources_dir ()) "exporter-test-graph"
  in
  let files =
    List.map (Filename.concat file_graph_dir)
      [ "journals/2024_02_07.md"; "pages/Interstellar.md" ]
  in
  let conn = create_conn () in
  ignore
    (import_files_to_db files conn
       { (default_import_opts ()) with tag_classes = [ "movie" ] });
  let db = Datascript.db conn in
  check_valid "Created graph has no validation errors" db;
  let block = find_block_re_exn db "Inception" in
  let tag_page = find_page_exn db "Movie" in
  let another_tag_page = find_page_exn db "p0" in
  eq "tagged block with configured tag strips tag from content" "Inception"
    (Option.value ~default:"" (Ldb.string_value block "block/title")) "";
  eq "tagged block has configured tag imported as a class"
((Some (Vector [ Keyword "user.class/Movie" ])) : value option)
    (prop_get block "block/tags") "";
  eq "configured tag page in :tag-classes is a class"
    [ "logseq.class/Tag" ]
    (ref_idents tag_page "block/tags") "";
  check "unconfigured tag page is not a class"
    (not (Ldb.is_class another_tag_page)) "";
  check_v "tagged page has configured tag imported as a class"
    (Map
       [ ( Keyword "block/tags",
           Vector
             [ Keyword "logseq.class/Page"; Keyword "user.class/Movie" ] ) ])
    (props_map (find_page_exn db "Interstellar")) ""

let test_export_files_with_property_classes_option () =
  let file_graph_dir =
    Filename.concat (test_resources_dir ()) "exporter-test-graph"
  in
  let files =
    List.map (Filename.concat file_graph_dir)
      [ "journals/2024_02_23.md"; "pages/url.md";
        "pages/Whiteboard___Tool.md";
        "pages/Whiteboard___Arrow_head_toggle.md"; "pages/Library.md" ]
  in
  let conn = create_conn () in
  let options =
    import_files_to_db files conn
      { (default_import_opts ()) with property_classes = [ "type" ] }
  in
  ignore (Gp.export_class_properties conn (Datascript.db conn) options);
  let db = Datascript.db conn in
  check_valid "Created graph has no validation errors" db;
  check_v "All classes are correctly defined by :type"
    (Set
       (List.map (fun s -> Keyword s)
          [ "user.class/Property"; "user.class/Movie"; "user.class/Class";
            "user.class/Tool" ]))
    (Set
       (q_values db
          "[:find [?ident ...] :where [?b :block/tags :logseq.class/Tag] [?b :db/ident ?ident] (not [?b :logseq.property/built-in?])]"))
    "";
  check_v "Properties are correctly inferred for a class"
    (Set
       (List.map (fun s -> Keyword s)
          [ "user.property/url"; "user.property/sameas";
            "user.property/rangeincludes" ]))
    (match Datascript.entity db (Ident "user.class/Property") with
     | Some e ->
         Set
           (List.map (fun s -> Keyword s)
              (ref_idents e "logseq.property.class/properties"))
     | None -> Set [])
    "";
  let block = find_block_re_exn db "The Creator" in
  let tag_page = find_page_exn db "Movie" in
  eq "tagged block with configured tag strips tag from content"
    "The Creator"
    (Option.value ~default:"" (Ldb.string_value block "block/title")) "";
  eq "tagged block has configured tag imported as a class"
((Some (Vector [ Keyword "user.class/Movie" ])) : value option)
    (prop_get block "block/tags") "";
  check_v "tagged block can have another property that references the same class"
    (ref_ents' block "user.property/testtagclass"
     |> List.map (fun e -> (Int e.id : value)) |> fun l -> Vector l)
    (ref_ents' block "block/tags"
     |> List.map (fun e -> (Int e.id : value)) |> fun l -> Vector l)
    "";
  eq "configured tag page derived from :property-classes is a class"
    [ "logseq.class/Tag" ]
    (ref_idents tag_page "block/tags") "";
  check "No page exists for configured property"
    (Option.is_none (find_page_by_title db "type")) "";
  check "tagged page has correct tags including one from option"
    (v_eq_opt
       (Some
          (Set
             [ Keyword "user.class/Property"; Keyword "logseq.class/Property" ]))
       (match prop_get (find_page_exn db "url") "block/tags" with
        | Some (Vector vs) -> Some (Set vs)
        | v -> v)) ""

let test_export_files_with_remove_inline_tags () =
  let file_graph_dir =
    Filename.concat (test_resources_dir ()) "exporter-test-graph"
  in
  let files =
    List.map (Filename.concat file_graph_dir)
      [ "journals/2024_02_07.md"; "journals/2026_01_27.md" ]
  in
  let conn = create_conn () in
  ignore
    (import_files_to_db files conn
       { (default_import_opts ()) with
         remove_inline_tags = false
       ; convert_all_tags = true });
  let namespaced_file =
    write_temp_graph_file "pages/namespace-inline-tag.md"
      "- #parent/child\n"
  in
  let namespaced_conn = create_conn () in
  ignore
    (import_files_to_db [ namespaced_file ] namespaced_conn
       { (default_import_opts ()) with
         remove_inline_tags = false
       ; convert_all_tags = true });
  let ndb = Datascript.db namespaced_conn in
  let block_and_tag =
    match
      Datascript.q_string ndb
        "[:find ?b ?t :where [?b :block/tags ?t] [?b :block/page] [?t :db/ident :user.class/parent___child]]"
    with
    | [ Result_entity b; Result_entity t ] :: _ -> (
        match (Ldb.ent_of_id ndb b, Ldb.ent_of_id ndb t) with
        | Some b, Some t -> Some (b, t)
        | _ -> None)
    | [ Result_value (Int b); Result_value (Int t) ] :: _ -> (
        match (Ldb.ent_of_id ndb b, Ldb.ent_of_id ndb t) with
        | Some b, Some t -> Some (b, t)
        | _ -> None)
    | _ -> None
  in
  let db = Datascript.db conn in
  check_valid "Created graph has no validation errors" db;
  check "block with tag preserves inline tag"
    (str_starts_with
       (Option.value ~default:""
          (get_string' (find_block_re_exn db "Inception") "block/title"))
       "Inception #Movie") "";
  check "block with multi word tag preserves inline tag"
    (str_contains
       (Option.value ~default:""
          (get_string' (find_block_re_exn db "block with multi word tag")
             "block/title"))
       "#[[another test]]") "";
  (* namespaced inline tag on first line is preserved as inline tag *)
  check "imported first-line namespaced tag block"
    (Option.is_some block_and_tag) "";
  (match block_and_tag with
   | Some (b, tag) ->
       let raw_title =
         match Ldb.raw_title ndb b with
         | Some (String s) -> s
         | _ -> ""
       in
       check "imported block has raw title" (raw_title <> "") "";
       let tag_uuid =
         match getv' tag "block/uuid" with
         | Some (Uuid u) -> u
         | _ -> ""
       in
       check "first-line namespaced tag is stored as an inline tag"
         (Ldb.inline_tag raw_title tag_uuid) ""
   | None -> ())

let icon_value (e : entity) : value option =
  prop_get e "logseq.property/icon"

(* cljs (count (filter #(= :icon (:property %)) ignored-props)) —
   lib stores ignored-property entries as BM.t with string keys *)
let count_ignored_props_bm (entries : BM.t list) (prop : string) : int =
  List.length
    (List.filter
       (fun e ->
         match BM.attr_value e "property" with
         | Some (Keyword s) | Some (String s) -> s = prop
         | _ -> false)
       entries)

let test_export_files_with_icon_properties () =
  let file_graph_dir =
    Filename.concat (test_resources_dir ()) "exporter-test-graph"
  in
  let files =
    [ Filename.concat file_graph_dir "ignored/icon-page.md" ]
  in
  let conn = create_conn () in
  let options =
    import_files_to_db files conn (default_import_opts ())
  in
  let db = Datascript.db conn in
  let page = find_page_by_title db "icon-page" in
  let block = find_block_by_content' db (Str "has some content") in
  let expected_icon =
    (Map [ (Keyword "type", Keyword "emoji"); (Keyword "id", String "\xF0\x9F\x98\x86") ] : value)
  in
  check_valid "Created graph has no validation errors" db;
  check "imported icon page" (Option.is_some page) "";
  check "imported icon block" (Option.is_some block) "";
  check "page emoji icon is imported"
    (v_eq_opt (Some expected_icon) (Option.bind page icon_value)) "";
  check "block emoji icon is imported"
    (v_eq_opt (Some expected_icon) (Option.bind block icon_value)) "";
  eq "importable emoji icons are not ignored" 0
    (count_ignored_props_bm
       !(options.Gp.import_state.Gp.ignored_properties) "icon")
    ""

let test_export_files_preserves_icon_skin_tone () =
  let file =
    write_temp_graph_file "pages/skin-tone.md"
      "icon:: \xF0\x9F\x91\x8D\xF0\x9F\x8F\xBD\n\n- note\n"
  in
  let conn = create_conn () in
  ignore (import_files_to_db [ file ] conn (default_import_opts ()));
  let db = Datascript.db conn in
  let page = find_page_exn db "skin-tone" in
  check "icon skin tone preserved"
    (v_eq_opt
       (Some
          (Map
             [ (Keyword "type", Keyword "emoji")
             ; (Keyword "id", String "\xF0\x9F\x91\x8D\xF0\x9F\x8F\xBD")
             ; (Keyword "skin", Int 4) ]))
       (icon_value page)) ""

let test_export_files_with_unmappable_icon_properties () =
  let file =
    write_temp_graph_file "pages/bad-icon.md"
      "icon:: not-an-emoji\n\n- block with file icon\n  icon:: ./assets/ghost.png\n"
  in
  let conn = create_conn () in
  let options = import_files_to_db [ file ] conn (default_import_opts ()) in
  let db = Datascript.db conn in
  let page = find_page_by_title db "bad-icon" in
  let block = find_block_by_content' db (Str "block with file icon") in
  check_valid "Created graph has no validation errors" db;
  check "imported page with unmappable icon" (Option.is_some page) "";
  check "imported block with unmappable icon" (Option.is_some block) "";
  check "unmappable page icon is not imported"
    (Option.bind page icon_value = None) "";
  check "unmappable block icon is not imported"
    (Option.bind block icon_value = None) "";
  eq "unmappable icon properties are still ignored" 2
    (count_ignored_props_bm
       !(options.Gp.import_state.Gp.ignored_properties) "icon")
    ""

let test_export_files_with_property_parent_classes_option () =
  let file_graph_dir =
    Filename.concat (test_resources_dir ()) "exporter-test-graph"
  in
  let files =
    List.map (Filename.concat file_graph_dir)
      [ "journals/2024_11_26.md"; "pages/CreativeWork.md"; "pages/Movie.md";
        "pages/type.md"; "pages/Whiteboard___Tool.md";
        "pages/Whiteboard___Arrow_head_toggle.md"; "pages/Property.md";
        "pages/url.md" ]
  in
  let conn = create_conn () in
  ignore
    (import_files_to_db files conn
       { (default_import_opts ()) with
         property_parent_classes = [ "parent" ]
         (* Also add this option to trigger some edge cases with
            namespace pages *)
       ; property_classes = [ "type" ] });
  let db = Datascript.db conn in
  check_valid "Created graph has no validation errors" db;
  check_v "All classes are correctly defined by :type"
    (Set
       (List.map (fun s -> Keyword s)
          [ "user.class/Movie"; "user.class/CreativeWork"; "user.class/Thing";
            "user.class/Feature"; "user.class/Class"; "user.class/Tool";
            "user.class/Whiteboard___Tool"; "user.class/Property" ]))
    (Set
       (q_values db
          "[:find [?ident ...] :where [?b :block/tags :logseq.class/Tag] [?b :db/ident ?ident] (not [?b :logseq.property/built-in?])]"))
    "";
  let extends_titles ident =
    match Datascript.entity db (Ident ident) with
    | Some e -> ref_titles e "logseq.property.class/extends"
    | None -> []
  in
  check_v "Existing page correctly set as class parent"
    (Vector [ String "CreativeWork" ])
    (Vector
       (List.map (fun s -> String s)
          (extends_titles "user.class/Movie"))) "";
  check_v "New page correctly set as class parent"
    (Vector [ String "Thing" ])
    (Vector
       (List.map (fun s -> String s)
          (extends_titles "user.class/CreativeWork"))) ""

let test_export_files_with_property_pages_disabled () =
  let file_graph_dir =
    Filename.concat (test_resources_dir ()) "exporter-test-graph"
  in
  let files =
    [ Filename.concat file_graph_dir "journals/2024_01_17.md" ]
  in
  let conn = create_conn () in
  ignore
    (import_files_to_db files conn
       { (default_import_opts ()) with
         user_config =
           [ ("property-pages/enabled?", Bool false);
             ( "property-pages/excludelist",
               Set [ Keyword "prop-string" ] ) ] });
  let db = Datascript.db conn in
  check_valid "Created graph has no validation errors" db

let test_export_config_file_sets_title_format () =
  let conn = create_conn () in
  let options =
    { (default_export_options ()) with
      Gp.read_file =
        (fun _ -> Eff.pure "{:journal/page-title-format \"yyyy-MM-dd\"}") }
  in
  ignore
    (await
       (Gp.export_config_file conn
          [ ("path", String "logseq/config.edn") ]
          options));
  let db = Datascript.db conn in
  eq "title format set correctly by config"
((Some (String "yyyy-MM-dd")) : value option)
    (match Datascript.entity db (Ident "logseq.class/Journal") with
     | Some e -> Ldb.value e "logseq.property.journal/title-format"
     | None -> None) ""

let split_result_value (texts, segs) : value =
  Map
    [ ( Keyword "text-parts",
        Vector (List.map (fun s -> String s) texts) );
      ( Keyword "code-segs",
        Vector
          (List.map
             (fun (c : Gp.code_seg) : value ->
               Map
                 [ (Keyword "text", String c.cs_text);
                   ( Keyword "lang",
                     match c.cs_lang with
                     | Some l -> String l
                     | None -> Nil ) ])
             segs) ) ]

let code_seg text lang : value =
  (Map
     [ (Keyword "text", String text);
       ( Keyword "lang",
         match lang with Some l -> String l | None -> Nil ) ]
   : value)

let split_result texts segs : value =
  Map
    [ ( Keyword "text-parts",
        Vector (List.map (fun s -> String s) texts) );
      (Keyword "code-segs", Vector segs) ]

let test_split_title_by_code_fences () =
  let split_fn = Gp.split_title_by_code_fences in
  check_v "standalone code fence with language"
    (split_result []
       [ code_seg "it's an individual code snippet with language tag"
           (Some "markdown") ])
    (split_result_value
       (split_fn
          "```markdown\nit's an individual code snippet with language tag\n```"))
    "";
  check_v "standalone code fence without language"
    (split_result []
       [ code_seg "it's an individual code snippet without language tag"
           None ])
    (split_result_value
       (split_fn
          "```\nit's an individual code snippet without language tag\n```"))
    "";
  check_v "one code fence with leading text"
    (split_result [ "before code snippet" ]
       [ code_seg "echo \"ok\"\nexit" None ])
    (split_result_value
       (split_fn "before code snippet\n```\necho \"ok\"\nexit\n```"))
    "";
  check_v "one code fence with leading and trailing text"
    (split_result [ "before code snippet"; "after code snippet" ]
       [ code_seg "echo \"ok\"\nexit" (Some "bash") ])
    (split_result_value
       (split_fn
          "before code snippet\n```bash\necho \"ok\"\nexit\n```\nafter code snippet"))
    "";
  check_v "one code fence followed by trailing text"
    (split_result [ "after code snippet" ]
       [ code_seg "echo \"ok\"\nexit" (Some "bash") ])
    (split_result_value
       (split_fn "```bash\necho \"ok\"\nexit\n```\nafter code snippet"))
    "";
  check_v "multiple code fences mixed with text"
    (split_result
       [ "before code snippet"; "middle"; "after code snippet" ]
       [ code_seg "echo \"ok\"\nexit" (Some "bash");
         code_seg "echo \"bye\"\nexit" (Some "bash") ])
    (split_result_value
       (split_fn
          "before code snippet\n```bash\necho \"ok\"\nexit\n```\nmiddle\n```bash\necho \"bye\"\nexit\n```\nafter code snippet"))
    "";
  check_v "edge: one code fence followed by opening fence without closing fence"
    (split_result [ "echo \"missing end fence\"" ]
       [ code_seg "echo \"ok\"\nexit" (Some "bash") ])
    (split_result_value
       (split_fn
          "```bash\necho \"ok\"\nexit\n```\n```bash\necho \"missing end fence\""))
    "";
  let texts, segs =
    split_fn
      "```markdown\n1st code snippet with language tag\n```\n```\n2nd code snippet without language tag\n```"
  in
  check "edge: pure multiple code fences with no extra text"
    (texts = [] && List.length segs > 1) "";
  let title = "```bash\necho \"missing end fence\"" in
  let texts2, segs2 = split_fn title in
  check "edge: opening fence without closing fence"
    (List.length texts2 = 1
    && List.hd texts2 <> title
    && segs2 = []) "";
  check_v "edge: plain text without any code fence"
    (split_result [ "plain text only" ] [])
    (split_result_value (split_fn "plain text only")) "";
  check_v "edge: empty title"
    (split_result [ "" ] [])
    (split_result_value (split_fn "")) ""

(* shared by the two extract-code-snippet tests *)
let top_blocks_of_journal (db : db) (day : int) : entity list =
  match
    q_eids_in db
      "[:find [?p ...] :in $ ?d :where [?p :block/journal-day ?d]]"
      [ Int day ]
  with
  | page_id :: _ ->
      Ldb.sort_by_order
        (q_entities_in db
           "[:find [?b ...] :in $ ?page :where [?b :block/page ?page] [?b :block/parent ?page]]"
           [ Int page_id ])
  | [] -> []

let direct_children (e : entity) : entity list = children_of e

let code_block_checks db label (b : entity) expected_title expected_lang =
  eq (label ^ " title has fences stripped") expected_title
    (Option.value ~default:"" (get_string' b "block/title")) "";
  eq (label ^ " no children") 0
    (List.length (direct_children b)) "";
  check_v (label ^ " tagged as Code-block")
    (Set [ Keyword "logseq.class/Code-block" ])
    (Set
       (List.map (fun s -> Keyword s) (ref_idents b "block/tags"))) "";
  eq (label ^ " language property")
    (match expected_lang with
     | Some l -> Some (String l)
     | None -> None)
    (getv' b "logseq.property.code/lang") ""

let test_export_files_with_extract_code_snippet () =
  let file_graph_dir =
    Filename.concat (test_resources_dir ()) "exporter-test-graph"
  in
  let files =
    [ Filename.concat file_graph_dir "journals/2026_03_01.md" ]
  in
  let conn = create_conn () in
  ignore
    (import_files_to_db files conn
       { (default_import_opts ()) with extract_code_snippets = true });
  let db = Datascript.db conn in
  let top_blocks = top_blocks_of_journal db 20260301 in
  let child_of b =
    match Ldb.sort_by_order (direct_children b) with
    | c :: _ -> c
    | [] -> failwith "expected code child"
  in
  (* standalone code block with language tag *)
  let b0 = List.nth top_blocks 0 in
  code_block_checks db "Standalone code block" b0
    "it's an individual code snippet with language tag" (Some "markdown");
  (* standalone code block without language tag *)
  let b1 = List.nth top_blocks 1 in
  code_block_checks db "Standalone code block" b1
    "it's an individual code snippet without language tag" None;
  (* text before code snippet *)
  let b2 = List.nth top_blocks 2 in
  eq "Block title has text only without code" "before code snippet"
    (Option.value ~default:"" (get_string' b2 "block/title")) "";
  eq "Block has 1 code child" 1 (List.length (direct_children b2)) "";
  let c2 = child_of b2 in
  eq "Child code block has correct content without fence markers"
    "echo \"ok\"\nexit"
    (Option.value ~default:"" (get_string' c2 "block/title")) "";
  check_v "Child block is tagged as Code-block"
    (Set [ Keyword "logseq.class/Code-block" ])
    (Set (List.map (fun s -> Keyword s) (ref_idents c2 "block/tags")))
    "";
  check "Child block has no language property"
    (Option.is_none (getv' c2 "logseq.property.code/lang")) "";
  (* text before and after code snippet *)
  let b3 = List.nth top_blocks 3 in
  eq "Block title has text only without code"
    "before code snippet\nafter code snippet"
    (Option.value ~default:"" (get_string' b3 "block/title")) "";
  eq "Block has 1 code child" 1 (List.length (direct_children b3)) "";
  let c3 = child_of b3 in
  eq "Child code block has correct content without fence markers"
    "echo \"ok\"\nexit"
    (Option.value ~default:"" (get_string' c3 "block/title")) "";
  check_v "Child block is tagged as Code-block"
    (Set [ Keyword "logseq.class/Code-block" ])
    (Set (List.map (fun s -> Keyword s) (ref_idents c3 "block/tags")))
    "";
  eq "Child block has bash language property" (Some (String "bash"))
    (getv' c3 "logseq.property.code/lang") "";
  (* code snippet before text *)
  let b4 = List.nth top_blocks 4 in
  eq "Block title has text only without code" "after code snippet"
    (Option.value ~default:"" (get_string' b4 "block/title")) "";
  eq "Block has 1 code child" 1 (List.length (direct_children b4)) "";
  let c4 = child_of b4 in
  eq "Child code block has correct content without fence markers"
    "echo \"ok\"\nexit"
    (Option.value ~default:"" (get_string' c4 "block/title")) "";
  check_v "Child block is tagged as Code-block"
    (Set [ Keyword "logseq.class/Code-block" ])
    (Set (List.map (fun s -> Keyword s) (ref_idents c4 "block/tags")))
    "";
  eq "Child block has bash language property" (Some (String "bash"))
    (getv' c4 "logseq.property.code/lang") "";
  (* multiple code snippets mixed with text *)
  let b5 = List.nth top_blocks 5 in
  eq "Block title has all text parts without code"
    "before code snippet\nmiddle\nafter code snippet"
    (Option.value ~default:"" (get_string' b5 "block/title")) "";
  let children5 = Ldb.sort_by_order (direct_children b5) in
  eq "Block has 2 code children" 2 (List.length children5) "";
  (match children5 with
   | [ c1; c2 ] ->
       eq "First child code block has correct content without fence markers"
         "echo \"ok\"\nexit"
         (Option.value ~default:"" (get_string' c1 "block/title")) "";
       eq "Second child code block has correct content without fence markers"
         "echo \"bye\"\nexit"
         (Option.value ~default:"" (get_string' c2 "block/title")) ""
   | _ -> failwith "expected 2 code children");
  check "Both child blocks are tagged as Code-block"
    (List.for_all
       (fun c ->
         ref_idents c "block/tags" = [ "logseq.class/Code-block" ])
       children5)
    "";
  check "Both child blocks have bash language property"
    (List.for_all
       (fun c ->
         getv' c "logseq.property.code/lang" = Some (String "bash"))
       children5)
    ""

let test_export_files_without_extract_code_snippet () =
  let file_graph_dir =
    Filename.concat (test_resources_dir ()) "exporter-test-graph"
  in
  let files =
    [ Filename.concat file_graph_dir "journals/2026_03_01.md" ]
  in
  let conn = create_conn () in
  ignore
    (import_files_to_db files conn
       { (default_import_opts ()) with extract_code_snippets = false });
  let db = Datascript.db conn in
  let top_blocks = top_blocks_of_journal db 20260301 in
  let b0 = List.nth top_blocks 0 in
  code_block_checks db "Standalone code block" b0
    "it's an individual code snippet with language tag" (Some "markdown");
  let b1 = List.nth top_blocks 1 in
  code_block_checks db "Standalone code block" b1
    "it's an individual code snippet without language tag" None;
  let b2 = List.nth top_blocks 2 in
  check "Block with text before code has no children extracted"
    (direct_children b2 = []) "";
  check "Block title retains raw code fence markup"
    (str_contains
       (Option.value ~default:"" (get_string' b2 "block/title"))
       "```") "";
  let b3 = List.nth top_blocks 3 in
  check "Block with text surrounding code has no children extracted"
    (direct_children b3 = []) "";
  check "Block title retains raw code fence markup"
    (str_contains
       (Option.value ~default:"" (get_string' b3 "block/title"))
       "```") ""

(* cljs page-alias-sanitise-for-import — pages as BM maps *)
let alias_page name aliases : BM.t =
  [ ("block/name", String name);
    ( "block/alias",
      List
        (List.map (fun a -> (Map [ (Keyword "block/name", String a) ] : value)) aliases)
    ) ]

let alias_of (page : BM.t) : value option =
  List.assoc_opt "block/alias" page

let test_page_alias_sanitise_for_import () =
  (* duplicate-owner alias is dropped and reported *)
  let import_state = Gp.new_import_state () in
  let pages =
    [ alias_page "p1" [ "shared" ]; alias_page "p2" [ "shared" ] ]
  in
  let result = Gp.sanitize_page_aliases_for_import pages import_state in
  eq "first declarer wins ownership" (Some "p1")
    (Hashtbl.find_opt import_state.Gp.alias_owners "shared") "";
  eq "duplicate alias is reported in ignored-properties" 1
    (List.length
       (List.filter
          (fun e ->
            match BM.attr_value e "reason" with
            | Some (Keyword s) | Some (String s) ->
                s = "alias/duplicate-owner"
            | _ -> false)
          !(import_state.Gp.ignored_properties))) "";
  check "second page's conflicting alias is removed"
    (match List.nth_opt result 1 with
     | Some p -> alias_of p = None || alias_of p = Some (List [])
     | None -> false) "";
  (* alias-of-alias is dropped and reported *)
  let import_state = Gp.new_import_state () in
  let pages =
    [ alias_page "root" [ "mid" ]; alias_page "mid" [ "leaf" ] ]
  in
  let result = Gp.sanitize_page_aliases_for_import pages import_state in
  eq "alias-of-alias is reported in ignored-properties" 1
    (List.length
       (List.filter
          (fun e ->
            match BM.attr_value e "reason" with
            | Some (Keyword s) | Some (String s) ->
                s = "alias/alias-owns-aliases"
            | _ -> false)
          !(import_state.Gp.ignored_properties))) "";
  check "alias pointing to a page that owns aliases is removed"
    (match List.nth_opt result 0 with
     | Some p -> alias_of p = None || alias_of p = Some (List [])
     | None -> false) "";
  (* self-alias is dropped and reported *)
  let import_state = Gp.new_import_state () in
  let pages = [ alias_page "self" [ "self" ] ] in
  let result = Gp.sanitize_page_aliases_for_import pages import_state in
  check "self-alias declaration is removed"
    (match List.nth_opt result 0 with
     | Some p -> alias_of p = None || alias_of p = Some (List [])
     | None -> false) "";
  check "self-alias is reported in ignored-properties"
    (List.exists
       (fun e ->
         match BM.attr_value e "reason" with
         | Some (Keyword s) | Some (String s) -> s = "alias/self"
         | _ -> false)
       !(import_state.Gp.ignored_properties)) ""

let test_page_alias_sanitise_for_import_cross_file () =
  (* source-is-alias caught across files (root->mid in file 1, mid->leaf in
     file 2) *)
  let import_state = Gp.new_import_state () in
  ignore
    (Gp.sanitize_page_aliases_for_import
       [ alias_page "root" [ "mid" ] ]
       import_state);
  let result =
    Gp.sanitize_page_aliases_for_import
      [ alias_page "mid" [ "leaf" ] ]
      import_state
  in
  check "mid's alias declaration dropped: mid is already an alias"
    (match List.nth_opt result 0 with
     | Some p -> alias_of p = None || alias_of p = Some (List [])
     | None -> false) "";
  check "source-is-alias reason recorded"
    (List.exists
       (fun e ->
         match BM.attr_value e "reason" with
         | Some (Keyword s) | Some (String s) ->
             s = "alias/source-is-alias"
         | _ -> false)
       !(import_state.Gp.ignored_properties)) "";
  (* alias-owns-aliases caught across files (mid->leaf in file 1, root->mid
     in file 2) *)
  let import_state = Gp.new_import_state () in
  ignore
    (Gp.sanitize_page_aliases_for_import
       [ alias_page "mid" [ "leaf" ] ]
       import_state);
  let result =
    Gp.sanitize_page_aliases_for_import
      [ alias_page "root" [ "mid" ] ]
      import_state
  in
  check "root's alias pointing to mid dropped: mid already owns aliases"
    (match List.nth_opt result 0 with
     | Some p -> alias_of p = None || alias_of p = Some (List [])
     | None -> false) "";
  check "alias-owns-aliases reason recorded"
    (List.exists
       (fun e ->
         match BM.attr_value e "reason" with
         | Some (Keyword s) | Some (String s) ->
             s = "alias/alias-owns-aliases"
         | _ -> false)
       !(import_state.Gp.ignored_properties)) ""

(* =====================================================================
   cases — registered in test_db_native.ml as the "gp-exporter" suite
   ===================================================================== *)

let cases : unit Alcotest.test_case list =
  let tc name f = Alcotest.test_case name `Quick f in
  [ tc "import-block-with-journal-ref-and-time-property-value"
      test_import_block_with_journal_ref_and_time_property_value;
    tc "import-quote-with-email-address"
      test_import_quote_with_email_address;
    tc "import-org-page-title-when-property-appears-in-middle"
      test_import_org_page_title_when_property_appears_in_middle;
    tc "import-empty-journal-file" test_import_empty_journal_file;
    tc "import-repeated-deadline-and-scheduled"
      test_import_repeated_deadline_and_scheduled;
    tc "import-preserves-legacy-task-markers-as-status-choices"
      test_import_preserves_legacy_task_markers_as_status_choices;
    tc "import-custom-task-marker-across-multiple-files"
      test_import_custom_task_marker_across_multiple_files;
    tc "import-repairs-duplicated-block-ids"
      test_import_repairs_duplicated_block_ids;
    tc "import-removes-pre-block-marker-and-missing-block-refs"
      test_import_removes_pre_block_marker_and_missing_block_refs;
    tc "import-converts-markdown-headings-to-db-heading-metadata"
      test_import_converts_markdown_headings_to_db_heading_metadata;
    tc "import-generated-markdown-file-graph"
      test_import_generated_markdown_file_graph;
    tc "import-generated-markdown-file-graph-fuzz"
      test_import_generated_markdown_file_graph_fuzz;
    tc "export-doc-files-propagates-missing-block-ref-cleanup-report"
      test_export_doc_files_propagates_missing_block_ref_cleanup_report;
    tc "export-doc-files-continues-after-export-file-failure"
      test_export_doc_files_continues_after_export_file_failure;
    tc "export-doc-files-preserves-filesystem-timestamps"
      test_export_doc_files_preserves_filesystem_timestamps;
    tc "export-doc-files-uses-serialized-file-timestamps-without-stat"
      test_export_doc_files_uses_serialized_file_timestamps_without_stat;
    tc "export-doc-files-preserves-alias-only-page-file-timestamps"
      test_export_doc_files_preserves_alias_only_page_file_timestamps;
    tc "export-doc-files-preserves-multi-alias-page-file-timestamps"
      test_export_doc_files_preserves_multi_alias_page_file_timestamps;
    tc "export-doc-files-uses-first-journal-mention-for-fileless-pages"
      test_export_doc_files_uses_first_journal_mention_for_fileless_pages;
    tc "export-doc-files-keeps-journal-day-when-journal-has-file-stats"
      test_export_doc_files_keeps_journal_day_when_journal_has_file_stats;
    tc "export-doc-files-keeps-journal-page-created-at-on-journal-day"
      test_export_doc_files_keeps_journal_page_created_at_on_journal_day;
    tc "export-doc-files-keeps-journal-day-when-journal-mentions-another-date"
      test_export_doc_files_keeps_journal_day_when_journal_mentions_another_date;
    tc "export-doc-files-keeps-file-timestamps-when-page-mentions-one-journal"
      test_export_doc_files_keeps_file_timestamps_when_page_mentions_one_journal;
    tc "export-doc-files-keeps-journal-mention-when-later-file-has-no-stats"
      test_export_doc_files_keeps_journal_mention_when_later_file_has_no_stats;
    tc "export-doc-file-ignores-epoch-zero-birthtime"
      test_export_doc_file_ignores_epoch_zero_birthtime;
    tc "export-doc-file-uses-mtime-when-birthtime-missing"
      test_export_doc_file_uses_mtime_when_birthtime_missing;
    tc "export-doc-files-uses-file-mtime-when-journal-mentions-page"
      test_export_doc_files_uses_file_mtime_when_journal_mentions_page;
    tc "export-doc-files-keeps-existing-file-timestamps-when-journal-mentions-page"
      test_export_doc_files_keeps_existing_file_timestamps_when_journal_mentions_page;
    tc "export-doc-file-accepts-numeric-last-modified-at"
      test_export_doc_file_accepts_numeric_last_modified_at;
    tc "update-asset-links-in-block-title"
      test_update_asset_links_in_block_title;
    tc "import-missing-local-pdf-asset-link-is-ignored-quietly"
      test_import_missing_local_pdf_asset_link_is_ignored_quietly;
    tc "extract-template-blocks" test_extract_template_blocks;
    tc "export-docs-graph-with-convert-all-tags"
      test_export_docs_graph_with_convert_all_tags;
    tc "import-linked-file-pdf-annotations"
      test_import_linked_file_pdf_annotations;
    tc "import-linked-file-pdf-annotations-with-uppercase-extension"
      test_import_linked_file_pdf_annotations_with_uppercase_extension;
    tc "import-linked-pdf-annotations-with-missing-attributes-without-log-fn"
      test_import_linked_pdf_annotations_with_missing_attributes_without_log_fn;
    tc "import-external-pdf-annotations"
      test_import_external_pdf_annotations;
    tc "import-hls-pdfs-uses-annotation-file-identities"
      test_import_hls_pdfs_uses_annotation_file_identities;
    tc "import-large-flat-file-without-stack-overflow"
      test_import_large_flat_file_without_stack_overflow;
    tc "export-basic-graph-with-convert-all-tags"
      test_export_basic_graph_with_convert_all_tags;
    tc "finalize-imported-graph-avoids-unchanged-ref-writes"
      test_finalize_imported_graph_avoids_unchanged_ref_writes;
    tc "import-file-graph-rebuilds-refs-without-per-file-listener"
      test_import_file_graph_rebuilds_refs_without_per_file_listener;
    tc "bulk-import-refs-match-single-block-refs"
      test_bulk_import_refs_match_single_block_refs;
    tc "export-basic-graph-with-convert-all-tags-option-disabled"
      test_export_basic_graph_with_convert_all_tags_option_disabled;
    tc "import-journals-use-standard-uuids-and-keep-uuid-refs"
      test_import_journals_use_standard_uuids_and_keep_uuid_refs;
    tc "import-journal-with-slash-title-format-does-not-create-namespace-pages"
      test_import_journal_with_slash_title_format_does_not_create_namespace_pages;
    tc "import-slash-journal-ref-does-not-create-namespace-pages"
      test_import_slash_journal_ref_does_not_create_namespace_pages;
    tc "import-legacy-journal-file-name-refs-as-journals"
      test_import_legacy_journal_file_name_refs_as_journals;
    tc "import-default-format-journal-refs-with-custom-title-format"
      test_import_default_format_journal_refs_with_custom_title_format;
    tc "import-creates-missing-ordinary-page-refs"
      test_import_creates_missing_ordinary_page_refs;
    tc "import-page-drawer-properties-write-refs-on-the-page"
      test_import_page_drawer_properties_write_refs_on_the_page;
    tc "import-favorites-from-og-config-edn"
      test_import_favorites_from_og_config_edn;
    tc "import-namespaced-pages-assign-block-order"
      test_import_namespaced_pages_assign_block_order;
    tc "import-namespaced-pages-order-after-parent-content-blocks"
      test_import_namespaced_pages_order_after_parent_content_blocks;
    tc "import-normalizes-existing-random-journal-uuid-and-text-refs"
      test_import_normalizes_existing_random_journal_uuid_and_text_refs;
    tc "export-files-with-tag-classes-option"
      test_export_files_with_tag_classes_option;
    tc "export-files-with-property-classes-option"
      test_export_files_with_property_classes_option;
    tc "export-files-with-remove-inline-tags"
      test_export_files_with_remove_inline_tags;
    tc "export-files-with-icon-properties"
      test_export_files_with_icon_properties;
    tc "export-files-preserves-icon-skin-tone"
      test_export_files_preserves_icon_skin_tone;
    tc "export-files-with-unmappable-icon-properties"
      test_export_files_with_unmappable_icon_properties;
    tc "export-files-with-property-parent-classes-option"
      test_export_files_with_property_parent_classes_option;
    tc "export-files-with-property-pages-disabled"
      test_export_files_with_property_pages_disabled;
    tc "export-config-file-sets-title-format"
      test_export_config_file_sets_title_format;
    tc "split-title-by-code-fences" test_split_title_by_code_fences;
    tc "export-files-with-extract-code-snippet"
      test_export_files_with_extract_code_snippet;
    tc "export-files-without-extract-code-snippet"
      test_export_files_without_extract_code_snippet;
    tc "page-alias-sanitise-for-import" test_page_alias_sanitise_for_import;
    tc "page-alias-sanitise-for-import-cross-file"
      test_page_alias_sanitise_for_import_cross_file ]