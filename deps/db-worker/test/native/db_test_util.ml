(* Port of the cljs test fixture machinery used by deps/db/test/logseq/db_test.cljs:

   * deps/db/src/logseq/db/test/helper.cljs `create-conn` /
     `create-conn-with-blocks` and the find-* helpers
   * deps/db/src/logseq/db/sqlite/build.cljs `create-blocks` /
     `build-blocks-tx` — the :properties / :classes / :pages-and-blocks /
     :build/* EDN DSL expanding to transactable data
   * helper fns from deps/db/src/logseq/db/sqlite/util.cljs,
     deps/db/src/logseq/db/frontend/property.cljs (+ .type .build),
     deps/db/src/logseq/db/frontend/class.cljs and
     deps/db/src/logseq/db/frontend/db_ident.cljc

   cljs builds a vector of tx maps; here tx maps are represented as
   [edn Map]s and transacted with Datascript.transact_conn_string. As in
   cljs, create_blocks transacts :init-tx first and :block-props-tx second
   so that user property entities (carrying :db/valueType / :db/cardinality)
   land before the blocks that reference them.

   Options mirror the cljs create-blocks / build-blocks-tx defaults:
   {:auto-create-ontology? true :extract-content-refs? true
    :translate-property-values? true}. Ident generation follows the
   LOGSEQ_STABLE_IDENTS=1 path of db-ident/create-db-ident-from-name —
   deterministic user.property.<name> / user.class.<name> idents with no
   random suffix. cljs create-conn also transacts the full built-in ontology
   (build-db-initial-data); the tests this port covers don't depend on those
   entities so the conn starts empty. :build/closed-values and
   {:build/property-value ...} blocks are supported; :build-existing-tx? and
   :graph-namespace are not (unused by the ported tests).

   NOTE for a future melange (node) runner of tests using this module:
   test/dune must add it (and the test module) to the melange.emit modules
   field, e.g. (modules test_worker_melange db_test_util test_db_melange),
   since melange.emit does not auto-include all modules like the native
   executable does. *)

open Datascript

(* ---------- EDN values (representation of cljs tx maps) ---------- *)

type edn =
  | Kw of string              (* :foo/bar *)
  | Str of string
  | Int of int
  | Flt of float
  | Bool of bool
  | Uuid of string
  | Vec of edn list
  | Set_ of edn list
  | Map of (string * edn) list

let rec edn_to_string = function
  | Kw s -> ":" ^ s
  | Str s -> Printf.sprintf "%S" s
  | Int n -> string_of_int n
  | Flt f ->
      let s = Printf.sprintf "%g" f in
      if String.contains s '.' || String.contains s 'e' then s else s ^ ".0"
  | Bool b -> string_of_bool b
  | Uuid s -> Printf.sprintf "#uuid \"%s\"" s
  | Vec vs -> "[" ^ String.concat " " (List.map edn_to_string vs) ^ "]"
  | Set_ vs -> "#{" ^ String.concat " " (List.map edn_to_string vs) ^ "}"
  | Map kvs ->
      "{"
      ^ String.concat " "
          (List.map (fun (k, v) -> ":" ^ k ^ " " ^ edn_to_string v) kvs)
      ^ "}"

let edn_map_to_string (m : (string * edn) list) = edn_to_string (Map m)

(* assoc-list helpers over attr maps (cljs map semantics: later wins) *)
let assoc' m k v = (k, v) :: List.remove_assoc k m
let merge' a b = List.fold_left (fun acc (k, v) -> assoc' acc k v) a b
let get' m k = List.assoc_opt k m
let dissoc' m ks = List.filter (fun (k, _) -> not (List.mem k ks)) m

(* ---------- counters / generators ---------- *)

(* cljs build.cljs current-db-id atom — negative temp ids *)
let db_id_counter = ref 0
let new_db_id () = decr db_id_counter; Int !db_id_counter

let order_counter = ref 0
(* db-order/gen-key — lexicographically increasing, valid fractional-index
   keys (integer char a..z then a trailing digit) *)
let gen_order_key () =
  incr order_counter;
  (* a0..a9, b00..b99, c000..c999 — head char encodes integer length *)
  let n = ref (!order_counter - 1) in
  let cap = ref 10 in
  let level = ref 1 in
  while !n >= !cap do n := !n - !cap; cap := !cap * 10; incr level done;
  Printf.sprintf "%c%0*d"
    (Char.chr (Char.code 'a' + !level - 1))
    !level !n

let time_counter = ref 0
(* common-util/time-ms — monotonically increasing epoch-ms ints *)
let time_ms () = incr time_counter; Int (1_700_000_000_000 + !time_counter)

let uuid_counter = ref 0
(* common-uuid/gen-uuid — deterministic, unique, canonical format *)
let gen_uuid () =
  incr uuid_counter;
  Printf.sprintf "00000000-0000-4000-8000-%012d" !uuid_counter

(* common-uuid/gen-uuid :journal-page-uuid — cljs format
   "00000001-<yyyy>-<mmdd>-0000-000000000000" *)
let gen_journal_uuid (day : int) =
  Printf.sprintf "00000001-%04d-%04d-0000-000000000000" (day / 10000) (day mod 10000)

(* common-uuid/gen-uuid :db-ident-block-uuid — deterministic per ident
   (cljs hashes the ident; a memoized per-ident uuid is equivalent here) *)
let ident_uuid_table : (string, string) Hashtbl.t = Hashtbl.create 16
let gen_db_ident_uuid ident =
  match Hashtbl.find_opt ident_uuid_table ident with
  | Some u -> u
  | None ->
      incr uuid_counter;
      let u = Printf.sprintf "00000002-0000-4000-8000-%012d" !uuid_counter in
      Hashtbl.add ident_uuid_table ident u;
      u

(* ---------- string / kw utils ---------- *)

let starts_with s prefix =
  let n = String.length prefix in
  String.length s >= n && String.sub s 0 n = prefix

let includes s sub =
  let n = String.length s and m = String.length sub in
  let rec go i = i + m <= n && (String.sub s i m = sub || go (i + 1)) in
  m = 0 || go 0

let kw_namespace (kw : string) : string option =
  match String.rindex_opt kw '/' with
  | Some i -> Some (String.sub kw 0 i)
  | None -> None

let kw_name (kw : string) : string =
  match String.rindex_opt kw '/' with
  | Some i -> String.sub kw (i + 1) (String.length kw - i - 1)
  | None -> kw

let qualified_kw (kw : string) = Option.is_some (kw_namespace kw)

let find_sub_from (s : string) (pat : string) (i : int) : int option =
  let n = String.length s and m = String.length pat in
  let rec go j =
    if j + m > n then None
    else if String.sub s j m = pat then Some j
    else go (j + 1)
  in
  if i >= n then None else go i

(* cljs extract-basic-content-refs — page-ref/page-ref-re #"\[\[(.*?)\]\]" *)
let extract_basic_content_refs (s : string) : string list =
  if starts_with s "{{" then []
  else
    let rec go i acc =
      match find_sub_from s "[[" i with
      | Some open_i ->
          (match find_sub_from s "]]" (open_i + 2) with
           | Some close_i ->
               go (close_i + 2)
                 (String.sub s (open_i + 2) (close_i - open_i - 2) :: acc)
           | None -> List.rev acc)
      | None -> List.rev acc
    in
    go 0 []

let replace_all (s : string) (pat : string) (rep : string) : string =
  let m = String.length pat in
  let rec go i acc =
    match find_sub_from s pat i with
    | None -> String.concat "" (List.rev (String.sub s i (String.length s - i) :: acc))
    | Some j ->
        go (j + m) (rep :: String.sub s i (j - i) :: acc)
  in
  go 0 []

(* db-content/title-ref->id-ref (fixture-local): [[page name]] -> [[uuid]] *)
let title_ref_to_id_ref (title : string) (refs : (string * string) list) : string =
  List.fold_left
    (fun content (ref_title, uuid) ->
      replace_all content ("[[" ^ ref_title ^ "]]") ("[[" ^ uuid ^ "]]"))
    title
    refs

let uuid_like s = Ldb.is_uuid_string s

(* ---------- db-ident / db-property / db-class helpers ---------- *)

(* db-ident/normalize-ident-name-part *)
let normalize_ident_name_part (s : string) : string =
  let s =
    if String.length s > 0 && s.[0] >= '0' && s.[0] <= '9' then "NUM-" ^ s else s
  in
  let allowed c =
    (c >= '0' && c <= '9')
    || (c >= 'a' && c <= 'z')
    || (c >= 'A' && c <= 'Z')
    || List.mem c [ '*'; '+'; '!'; '_'; '\''; '?'; '<'; '>'; '='; '-' ]
  in
  String.of_seq (Seq.filter allowed (String.to_seq s))

(* db-ident/create-db-ident-from-name — the stable-ident form
   (LOGSEQ_STABLE_IDENTS=1) *)
let create_db_ident_from_name ns name_string =
  ns ^ "/" ^ normalize_ident_name_part name_string

let create_user_property_ident_from_name name =
  create_db_ident_from_name "user.property" name

let create_user_class_ident_from_name name =
  create_db_ident_from_name "user.class" name

(* db-property/logseq-property-namespaces *)
let logseq_property_namespaces =
  [ "logseq.property"; "logseq.property.tldraw"; "logseq.property.pdf";
    "logseq.property.fsrs"; "logseq.property.linked-references";
    "logseq.property.asset"; "logseq.property.table"; "logseq.property.node";
    "logseq.property.code"; "logseq.property.repeat"; "logseq.property.journal";
    "logseq.property.class"; "logseq.property.view"; "logseq.property.user";
    "logseq.property.history"; "logseq.property.reaction"; "logseq.property.sync";
    "logseq.property.publish"; "logseq.property.recycle";
    "logseq.property.comments"; "logseq.property.agent" ]

let user_property_namespace s = includes s ".property"
let user_class_namespace s = includes s ".class"
let logseq_class kw = kw_namespace kw = Some "logseq.class"

(* db-property/public-db-attribute-properties — block/* attrs whose built-in
   schema has :public? true *)
let public_db_attribute_properties = [ "block/alias"; "block/tags" ]

(* db-property/internal-property? *)
let internal_property k =
  match kw_namespace k with
  | Some ns ->
      List.mem ns logseq_property_namespaces || List.mem k public_db_attribute_properties
  | None -> false

(* db-property/property? *)
let property_kw k =
  match kw_namespace k with
  | Some ns ->
      List.mem ns logseq_property_namespaces || user_property_namespace ns
      || List.mem k public_db_attribute_properties
  | None -> false

(* db-malli-schema/class? *)
let class_kw k = match kw_namespace k with Some ns -> includes ns ".class" | None -> false

(* db-class/page-classes — built-in classes that behave like a page. cljs
   additionally derives page-children-classes from built-in-classes; the
   base three are the ones the ported tests construct. *)
let page_classes = [ "logseq.class/Page"; "logseq.class/Tag"; "logseq.class/Property" ]

(* db-property-type sets *)
let value_ref_property_types = [ "default"; "url"; "number" ]
let all_ref_property_types =
  [ "entity"; "class"; "page"; "property"; "date"; "node"; "asset" ]
  @ value_ref_property_types
let original_value_ref_property_types = [ "number" ]

(* db-property-type/property-value-content? — whether the value stores into
   :logseq.property/value rather than :block/title *)
let property_value_content_type block_type property_ident =
  List.mem block_type original_value_ref_property_types
  || (property_ident = "logseq.property/default-value"
      && List.mem block_type original_value_ref_property_types)

(* Built-in property :schema :type lookups needed by
   build-property-map-for-pvalue-tx for the attrs the ported tests use.
   Absent means "not a built-in" here. *)
let built_in_property_type (k : string) : string option =
  match k with
  | "logseq.property.class/enable-bidirectional?" -> Some "checkbox"
  | "logseq.property.class/bidirectional-property-title" -> Some "default"
  | "logseq.property.class/properties" -> Some "property"
  | "logseq.property.class/extends" -> Some "class"
  | "logseq.property/created-from-property" -> Some "entity"
  | "logseq.property/classes" -> Some "class"
  | "logseq.property/value" -> Some "any"
  | "logseq.property/type" -> Some "keyword"
  | "logseq.property/deleted-at" -> Some "number"
  | "logseq.property/hide?" -> Some "checkbox"
  | "logseq.property/public?" -> Some "checkbox"
  | "logseq.property/icon" -> Some "map"
  | "logseq.property/default-value" -> Some "entity"
  | _ -> None

(* ---------- schema ---------- *)
(* deps/db/src/logseq/db/frontend/schema.cljs schema — the same EDN map,
   parsed by Datascript.schema_of_edn_string *)
let schema_edn =
  "{:db/ident {:db/unique :db.unique/identity}
    :kv/value {}
    :block/uuid {:db/unique :db.unique/identity}
    :block/parent {:db/valueType :db.type/ref :db/index true}
    :block/order {:db/index true}
    :block/collapsed? {}
    :block/page {:db/valueType :db.type/ref :db/index true}
    :block/refs {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
    :block/tags {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
    :block/link {:db/valueType :db.type/ref :db/index true}
    :block/alias {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many :db/index true}
    :block/created-at {:db/index true}
    :block/updated-at {:db/index true}
    :block/name {:db/index true}
    :block/title {:db/index true}
    :block/journal-day {:db/index true}
    :block/tx-id {}
    :block/closed-value-property {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
    :logseq.property/built-in? {:db/index true}
    :logseq.property/type {:db/index true}
    :logseq.property/hide? {:db/index true}
    :logseq.property/deleted-at {:db/index true}
    :logseq.property/public? {:db/index true}
    :logseq.property/value {:db/index true}
    :logseq.property/classes {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many :db/index true}
    :logseq.property.class/properties {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many :db/index true}
    :logseq.property.class/extends {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many :db/index true}
    :logseq.property/created-from-property {:db/valueType :db.type/ref :db/index true}
    :file/path {:db/unique :db.unique/identity}
    :file/content {}
    :file/created-at {}
    :file/last-modified-at {}
    :file/size {}}"

let schema () = Datascript.schema_of_edn_string schema_edn

(* db-test/create-conn — cljs transacts build-db-initial-data in a separate
   first tx so built-in idents exist and :db/valueType datoms land in the
   schema before test tx data resolves ref values. Only the ident entities
   the fixture machinery references are emitted: the logseq.class/* idents
   used as :block/tags / :logseq.property.class/extends /
   :logseq.property/classes values, and the logseq.property* idents used as
   values (journal title-format) or whose :db/valueType makes their attrs
   ref-typed in datascript. *)
(* cljs build-new-property gives every property entity :db/index true and
   :db/valueType :db.type/ref for ref-typed properties — mirrored on the
   property idents below so :avet lookups work like the cljs conn. *)
let initial_data_edn =
  "[{:db/ident :logseq.class/Root}
    ;; cljs build-initial-classes gives every class entity a :block/title
    ;; (name of its ident) and :block/tags #{:logseq.class/Tag} — needed
    ;; so ref->val resolves class refs and tag-membership queries behave
    ;; like cljs.
    ;; NOTE: datascript-ocaml resolves idents only against entities
    ;; already applied in the tx, so :logseq.class/Tag must precede every
    ;; class that tags itself with it. cljs also self-tags Tag; omitted
    ;; here because the ident cannot resolve inside its own entity map.
    {:db/ident :logseq.class/Tag :block/title \"Tag\"}
    {:db/ident :logseq.class/Page :block/title \"Page\" :block/tags #{:logseq.class/Tag}}
    {:db/ident :logseq.class/Property :block/title \"Property\" :block/tags #{:logseq.class/Tag}}
    {:db/ident :logseq.class/Journal :block/title \"Journal\" :block/tags #{:logseq.class/Tag}}
    {:db/ident :logseq.class/Task
     :block/title \"Task\" :block/name \"task\"
     :block/uuid #uuid \"00000003-0000-4000-8000-000000000101\"
     :block/tags #{:logseq.class/Tag}
     :logseq.property.class/extends #{:logseq.class/Root}}
    {:db/ident :logseq.class/Card
     :block/title \"Card\" :block/name \"card\"
     :block/uuid #uuid \"00000003-0000-4000-8000-000000000102\"
     :block/tags #{:logseq.class/Tag}
     :logseq.property.class/extends #{:logseq.class/Root}}
    ;; cljs build-bootstrap-property for :logseq.property/background-color
    ;; (built-in?, Property tag) — the validate tests resolve its title.
    {:db/ident :logseq.property/background-color
     :block/title \"Background color\" :block/name \"background color\"
     :block/uuid #uuid \"00000003-0000-4000-8000-000000000103\"
     :block/tags #{:logseq.class/Property}
     :logseq.property/type :default
     :logseq.property/hide? true
     :logseq.property/built-in? true
     :db/index true
     :db/cardinality :db.cardinality/one}
    ;; cljs build-bootstrap-property tags every built-in property entity
    ;; :logseq.class/Property; :block/tags is the public? one that
    ;; has-property/property rules return for every tagged node. Its
    ;; db/* datoms must be present because datascript recomputes the attr
    ;; schema from the ident entity's own datoms.
    ;; NOTE: cljs also sets :logseq.property/public? true here. The OCaml
    ;; fixture omits it so the rules' public check takes the `missing?`
    ;; branch — Avet literal-Bool lookups return no rows in
    ;; datascript-ocaml (reported bug), so the `public? true` clause can
    ;; never match. The asserted results are the same either way.
    {:db/ident :block/tags
     :block/tags #{:logseq.class/Property}
     :logseq.property/type :class
     :block/title \"Tags\"
     :db/index true
     :db/cardinality :db.cardinality/many
     :db/valueType :db.type/ref}
    {:db/ident :logseq.property}
    {:db/ident :logseq.property/public? :db/index true}
    {:db/ident :logseq.property/default-value :db/index true :logseq.property/type :entity}
    {:db/ident :logseq.property/deleted-at :db/index true :logseq.property/type :datetime}
    {:db/ident :logseq.property/cardinality :db/index true :logseq.property/type :keyword}
    {:db/ident :logseq.property/type :db/index true}
    {:db/ident :logseq.property/hide? :db/index true}
    {:db/ident :logseq.property/built-in? :db/index true :logseq.property/type :checkbox}
    {:db/ident :logseq.property/description :db/index true
     :block/tags #{:logseq.class/Property}
     :logseq.property/type :default}
    {:db/ident :logseq.property.class/enable-bidirectional? :db/index true :logseq.property/type :checkbox}
    {:db/ident :logseq.property.class/bidirectional-property-title :db/index true :logseq.property/type :string}
    {:db/ident :logseq.property.journal/title-format :db/index true :logseq.property/type :string}
    {:db/ident :logseq.property/status :db/valueType :db.type/ref :db/cardinality :db.cardinality/one :db/index true :logseq.property/type :default}
    {:db/ident :logseq.property/classes :db/valueType :db.type/ref :db/cardinality :db.cardinality/many :db/index true :logseq.property/type :entity}
    {:db/ident :logseq.property.class/properties :db/valueType :db.type/ref :db/cardinality :db.cardinality/many :db/index true :logseq.property/type :property}
    {:db/ident :logseq.property.class/extends :db/valueType :db.type/ref :db/cardinality :db.cardinality/many :db/index true :logseq.property/type :class}
    ;; cljs (sqlite-util/kv :logseq.kv/db-type 'db') — marks the graph as
    ;; db-based so Db_tx routes through the transact pipeline like the
    ;; cljs create-conn.
    {:db/ident :logseq.kv/db-type :kv/value \"db\"}
    {:db/ident :logseq.property/created-from-property :db/valueType :db.type/ref :db/cardinality :db.cardinality/one :db/index true :logseq.property/type :entity}
    {:db/ident :logseq.property/closed-values :db/valueType :db.type/ref :db/cardinality :db.cardinality/many :db/index true :logseq.property/type :entity}
    {:db/ident :logseq.property/value :db/cardinality :db.cardinality/one :db/index true :logseq.property/type :any}
    {:db/ident :logseq.property.history/block :db/valueType :db.type/ref :db/cardinality :db.cardinality/one :db/index true :logseq.property/type :entity}
    {:db/ident :logseq.property.history/property :db/valueType :db.type/ref :db/cardinality :db.cardinality/one :db/index true :logseq.property/type :property}
    {:db/ident :logseq.property.history/ref-value :db/valueType :db.type/ref :db/cardinality :db.cardinality/one :db/index true :logseq.property/type :entity}
    {:db/ident :logseq.property.history/scalar-value :db/index true :logseq.property/type :any}
    {:db/ident :logseq.property.reaction/target :db/valueType :db.type/ref :db/cardinality :db.cardinality/one :db/index true :logseq.property/type :node}
    {:db/ident :logseq.property.reaction/emoji-id :db/index true :logseq.property/type :string}
    {:db/ident :logseq.property/view-for :db/valueType :db.type/ref :db/cardinality :db.cardinality/one :db/index true :logseq.property/type :node}
    {:db/ident :logseq.property.view/type :db/index true :logseq.property/type :default}
    {:db/ident :logseq.property.view/feature-type :db/index true :logseq.property/type :keyword}
    {:db/ident :block/alias :db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
    {:db/ident :block/tags :db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
    {:db/ident :logseq.class/Status}
    ;; cljs build-recycle-page — the built-in Recycle page every graph gets.
    {:block/uuid #uuid \"00000004-1514-5003-0003-000000000000\"
     :block/name \"recycle\" :block/title \"Recycle\"
     :block/tags [:logseq.class/Page]
     :block/created-at 0 :block/updated-at 0
     :logseq.property/hide? true :logseq.property/built-in? true}]"

let create_conn () : conn =
  let conn = Datascript.create_conn ~schema:(schema ()) () in
  ignore (Datascript.transact_conn_string conn initial_data_edn);
  conn

(* cljs (d/create-conn db-schema/schema) — schema only, no initial data.
   Used by the worker thread-api tests which seed their own entities. *)
let create_conn_bare () : conn =
  Datascript.create_conn ~schema:(schema ()) ()

(* ---------- build input decls (OCaml-friendly mirrors of the EDN maps) ---------- *)

(* A cljs property value as written in :build/properties. In EDN this can be
   a scalar, [:build/page page-map], [:block/uuid uuid],
   {:build/property-value ...} block map, or a set/vec of those. *)
type prop_value = edn

(* [:build/page {...}] reference value *)
let build_page_ref ?uuid ?title ?journal () : prop_value =
  Vec
    [ Kw "build/page";
      Map
        (List.filter_map Fun.id
           [ Option.map (fun u -> "block/uuid", Uuid u) uuid;
             Option.map (fun t -> "block/title", Str t) title;
             Option.map (fun j -> "build/journal", Int j) journal ]) ]

(* {:build/property-value :block ...} — a full property-value block *)
let build_property_value ?uuid ?title ?value ?(properties = []) ?(tags = []) () : prop_value =
  Map
    (List.filter_map Fun.id
       [ Some ("build/property-value", Kw "block");
         Option.map (fun u -> "block/uuid", Uuid u) uuid;
         Option.map (fun t -> "block/title", Str t) title;
         Option.map (fun v -> "logseq.property/value", v) value;
         (match properties with
          | [] -> None
          | props -> Some ("build/properties", Map props));
         (match tags with
          | [] -> None
          | ts -> Some ("build/tags", Vec (List.map (fun t -> Kw t) ts))) ])

type closed_value_decl =
  { cv_value : string
  ; cv_uuid : string option
  ; cv_ident : string option
  ; cv_icon : (string * edn) list option
  ; cv_properties : (string * edn) list }

type property_decl =
  { p_type : string (* :logseq.property/type value, default "default" *)
  ; p_cardinality_many : bool (* :db/cardinality :db.cardinality/many *)
  ; p_schema : (string * edn) list (* other schema-properties attrs *)
  ; p_properties : (string * prop_value) list (* :build/properties *)
  ; p_property_classes : string list (* :build/property-classes *)
  ; p_closed_values : closed_value_decl list (* :build/closed-values *)
  ; p_title : string option (* :block/title *)
  ; p_uuid : string option
  ; p_ident_namespace : string option (* :db.property/ident-namespace *)
  ; p_extra : (string * edn) list }

let default_property =
  { p_type = "default"
  ; p_cardinality_many = false
  ; p_schema = []
  ; p_properties = []
  ; p_property_classes = []
  ; p_closed_values = []
  ; p_title = None
  ; p_uuid = None
  ; p_ident_namespace = None
  ; p_extra = [] }

type class_decl =
  { c_title : string option
  ; c_uuid : string option
  ; c_properties : (string * prop_value) list (* :build/properties *)
  ; c_extends : string list (* :build/class-extends or :build/class-parent *)
  ; c_class_properties : string list (* :build/class-properties *)
  ; c_extra : (string * edn) list }

let default_class =
  { c_title = None
  ; c_uuid = None
  ; c_properties = []
  ; c_extends = []
  ; c_class_properties = []
  ; c_extra = [] }

type block_decl =
  { b_title : string option (* :block/title *)
  ; b_uuid : string option
  ; b_parent : edn option (* explicit :block/parent value *)
  ; b_page : edn option (* explicit :block/page value *)
  ; b_order : string option
  ; b_properties : (string * prop_value) list (* :build/properties *)
  ; b_tags : string list (* :build/tags *)
  ; b_children : block_decl list (* :build/children *)
  ; b_extra : (string * edn) list }

let default_block =
  { b_title = None
  ; b_uuid = None
  ; b_parent = None
  ; b_page = None
  ; b_order = None
  ; b_properties = []
  ; b_tags = []
  ; b_children = []
  ; b_extra = [] }

type page_decl =
  { pg_title : string option
  ; pg_name : string option (* :block/name — overrides the sanity-lc default *)
  ; pg_uuid : string option
  ; pg_journal : int option (* :build/journal day int e.g. 20260410 *)
  ; pg_properties : (string * prop_value) list
  ; pg_tags : string list
  ; pg_extra : (string * edn) list }

let default_page =
  { pg_title = None
  ; pg_name = None
  ; pg_uuid = None
  ; pg_journal = None
  ; pg_properties = []
  ; pg_tags = []
  ; pg_extra = [] }

type page_blocks = { page : page_decl; blocks : block_decl list }

type create_options =
  { properties : (string * property_decl) list
  ; classes : (string * class_decl) list
  ; pages_and_blocks : page_blocks list
  ; auto_create_ontology : bool (* cljs default true in create-blocks *)
  ; extract_content_refs : bool (* cljs default true *)
  ; translate_property_values : bool (* cljs default true *) }

let default_options =
  { properties = []
  ; classes = []
  ; pages_and_blocks = []
  ; auto_create_ontology = true
  ; extract_content_refs = true
  ; translate_property_values = true }

(* ---------- build internals ---------- *)

module StringMap = Map.Make (String)

let map_uuid (m : (string * edn) list) =
  match get' m "block/uuid" with Some (Uuid u) -> Some u | _ -> None

let map_title (m : (string * edn) list) =
  match get' m "block/title" with Some (Str t) -> Some t | _ -> None

(* cljs get-ident — qualified kws that are properties or user classes pass
   through as-is; other names resolve through all-idents *)
let get_ident (all_idents : string StringMap.t) (kw : string) : string =
  if qualified_kw kw
     && (property_kw kw || user_class_namespace (Option.get (kw_namespace kw)))
  then kw
  else
    match StringMap.find_opt kw all_idents with
    | Some ident -> ident
    | None -> failwith ("No ident found for :" ^ kw)

(* cljs translate-property-value — [:build/page m] -> [:block/uuid uuid] *)
let translate_property_value (v : prop_value) (page_uuids : string StringMap.t) : edn =
  match v with
  | Vec (Kw "build/page" :: Map m :: _) ->
      let page_name =
        match get' m "build/journal", get' m "block/title" with
        | Some (Int day), _ -> Ldb.journal_title_of_day day "MMM do, yyyy"
        | _, Some (Str t) -> t
        | _ -> failwith "[:build/page ...] requires :block/title or :build/journal"
      in
      (match StringMap.find_opt page_name page_uuids with
       | Some uuid -> Vec [ Kw "block/uuid"; Uuid uuid ]
       | None -> failwith ("No uuid for page " ^ page_name))
  | Vec (Kw "block/uuid" :: _) -> v
  | other -> other

(* cljs ->block-properties — {:build/properties} -> entity attrs *)
let block_properties (props : (string * prop_value) list)
    (page_uuids : string StringMap.t) (all_idents : string StringMap.t)
    ~(translate_values : bool) : (string * edn) list =
  List.map
    (fun (prop_name, v) ->
      let v' =
        if translate_values then
          match v with
          | Set_ vs -> Set_ (List.map (fun x -> translate_property_value x page_uuids) vs)
          | _ -> translate_property_value v page_uuids
        else v
      in
      get_ident all_idents prop_name, v')
    props

(* ---------- pre-build (page/block decls -> cljs maps) ---------- *)

(* cljs expand-build-children — flatten :build/children, assign uuids, set
   :block/parent to {:db/id [:block/uuid parent-uuid]} *)
let rec block_decl_to_flat (d : block_decl) ~(parent : string option)
    : (string * edn) list list =
  let uuid = match d.b_uuid with Some u -> u | None -> gen_uuid () in
  let m =
    List.filter_map Fun.id
      [ Option.map (fun t -> "block/title", Str t) d.b_title;
        Option.map (fun p -> "block/page", p) d.b_page;
        Option.map (fun o -> "block/order", Str o) d.b_order ]
    @ (match d.b_parent, parent with
       | Some p, _ -> [ "block/parent", p ]
       | None, Some p -> [ "block/parent", Map [ "db/id", Vec [ Kw "block/uuid"; Uuid p ] ] ]
       | None, None -> [])
    @ [ "block/uuid", Uuid uuid ]
    @ (match d.b_properties with
       | [] -> []
       | props -> [ "build/properties", Map props ])
    @ (match d.b_tags with
       | [] -> []
       | ts -> [ "build/tags", Vec (List.map (fun t -> Kw t) ts) ])
    @ d.b_extra
  in
  m :: List.concat_map (fun c -> block_decl_to_flat c ~parent:(Some uuid)) d.b_children

(* decl -> cljs :page map (pre expand-journal: :build/journal kept as key) *)
let page_decl_to_raw_map (p : page_decl) : (string * edn) list =
  List.filter_map Fun.id
    [ Option.map (fun t -> "block/title", Str t) p.pg_title;
      Option.map (fun n -> "block/name", Str n) p.pg_name;
      Option.map (fun u -> "block/uuid", Uuid u) p.pg_uuid;
      Option.map (fun j -> "build/journal", Int j) p.pg_journal ]
  @ (match p.pg_tags with
     | [] -> []
     | ts -> [ "build/tags", Vec (List.map (fun t -> Kw t) ts) ])
  @ (match p.pg_properties with
     | [] -> []
     | props -> [ "build/properties", Map props ])
  @ p.pg_extra

(* cljs pre-build expand-journal on a page map *)
let expand_journal_map (m : (string * edn) list) : (string * edn) list =
  match get' m "build/journal" with
  | Some (Int day) ->
      let title = Ldb.journal_title_of_day day "MMM do, yyyy" in
      merge'
        (dissoc' m [ "build/journal" ])
        [ "block/journal-day", Int day;
          "block/title", Str title;
          "block/uuid",
          Uuid (match map_uuid m with Some u -> u | None -> gen_journal_uuid day);
          "block/tags", Kw "logseq.class/Journal" ]
  | _ -> m

(* cljs add-new-pages-from-properties — auto-add pages referenced by
   [:build/page m] property values; the referenced map becomes the page *)
let collect_build_page_refs (v : prop_value) : (string * edn) list list =
  match v with
  | Vec [ Kw "build/page"; Map m ] -> [ m ]
  | Set_ vs | Vec vs ->
      List.concat_map
        (function Vec [ Kw "build/page"; Map m ] -> [ m ] | _ -> [])
        vs
  | _ -> []

let props_of_map m = match get' m "build/properties" with Some (Map ps) -> ps | _ -> []

let add_new_pages_from_properties ~(options : create_options)
    (pages : (string * edn) list list) (blocks : (string * edn) list list) :
    (string * edn) list list =
  let existing =
    List.filter_map
      (fun p ->
        match get' p "build/journal" with
        | Some (Int j) -> Some (`Journal j)
        | _ ->
            (match map_title p with Some t -> Some (`Title t) | None -> None))
      pages
  in
  let all_page_refs =
    List.concat_map
      (fun m -> List.concat_map (fun (_, v) -> collect_build_page_refs v) (props_of_map m))
      (pages @ blocks)
    @ List.concat_map
        (fun (_, d) -> List.concat_map (fun (_, v) -> collect_build_page_refs v) d.p_properties)
        options.properties
  in
  let new_pages =
    List.filter
      (fun m ->
        let key =
          match get' m "build/journal" with
          | Some (Int j) -> Some (`Journal j)
          | _ -> (match map_title m with Some t -> Some (`Title t) | None -> None)
        in
        match key with Some k -> not (List.mem k existing) | None -> false)
      all_page_refs
    |> List.sort_uniq compare
  in
  new_pages @ pages

(* cljs add-new-pages-from-refs — [[name]] refs in block titles create pages *)
let add_new_pages_from_refs (pages : (string * edn) list list)
    (blocks : (string * edn) list list) : (string * edn) list list =
  let existing = List.filter_map map_title pages in
  let new_names =
    List.concat_map
      (fun b ->
        match get' b "block/title" with
        | Some (Str t) -> extract_basic_content_refs t
        | _ -> [])
      blocks
    |> List.filter (fun n -> not (uuid_like n))
    |> List.filter (fun n -> not (List.mem n existing))
    |> List.sort_uniq compare
  in
  List.map (fun n -> [ "block/title", Str n ]) new_names @ pages

(* ---------- auto-create-ontology ---------- *)

(* cljs db-property-type/infer-property-type-from-value *)
let infer_property_type_from_value (v : edn) : string =
  match v with
  | Int _ | Flt _ -> "number"
  | Bool _ -> "checkbox"
  | Vec [ Kw "build/page"; _ ] -> "node"
  | _ -> "default"

let auto_create_ontology ~(options : create_options)
    ~(pages : (string * edn) list list) ~(blocks : (string * edn) list list)
    : (string * property_decl) list * (string * class_decl) list =
  let tags_of m =
    match get' m "build/tags" with
    | Some (Vec ts) | Some (Set_ ts) ->
        List.filter_map (function Kw t -> Some t | _ -> None) ts
    | _ -> []
  in
  let used_tags = List.concat_map tags_of pages @ List.concat_map tags_of blocks in
  let new_classes =
    used_tags
    |> List.filter (fun t -> not (logseq_class t))
    |> List.sort_uniq compare
    |> List.filter (fun t -> not (List.mem_assoc t options.classes))
  in
  let used_props =
    List.concat_map props_of_map pages
    @ List.concat_map props_of_map blocks
    @ List.concat_map (fun (_, d) -> d.c_properties) options.classes
    (* cljs props-to-values includes :build/class-properties as [p ::no-value] *)
    @ List.concat_map
        (fun (_, d) -> List.map (fun p -> p, Map []) d.c_class_properties)
        options.classes
    @ List.concat_map (fun (_, d) -> d.p_properties) options.properties
  in
  let used_prop_kws = List.map fst used_props |> List.sort_uniq compare in
  let new_properties =
    List.filter
      (fun p -> not (internal_property p || List.mem_assoc p options.properties))
      used_prop_kws
  in
  let props' =
    List.map
      (fun p ->
        let values = List.filter_map (fun (k, v) -> if k = p then Some v else None) used_props in
        let first' =
          match values with
          | Set_ (v :: _) :: _ -> Some v
          | v :: _ -> Some v
          | [] -> None
        in
        let typ =
          match first' with
          | Some (Vec [ Kw "build/page"; Map m ]) ->
              (match get' m "build/journal" with Some _ -> "date" | None -> "node")
          | Some v -> infer_property_type_from_value v
          | None -> "default"
        in
        let many = List.exists (function Set_ _ -> true | _ -> false) values in
        p, { default_property with p_type = typ; p_cardinality_many = many })
      new_properties
  in
  options.properties @ props',
  options.classes @ List.map (fun c -> c, default_class) new_classes

(* ---------- create-all-idents ---------- *)

let create_all_idents ~(properties : (string * property_decl) list)
    ~(classes : (string * class_decl) list) : string StringMap.t =
  let prop_idents =
    List.map
      (fun (kw, decl) ->
        let ident =
          if qualified_kw kw then begin
            let ns = Option.get (kw_namespace kw) in
            if not (user_property_namespace ns) then
              failwith "Property ident must have valid namespace";
            create_db_ident_from_name ns (kw_name kw)
          end
          else
            match decl.p_ident_namespace with
            | Some ns -> create_db_ident_from_name ns kw
            | None -> create_user_property_ident_from_name kw
        in
        kw, ident)
      properties
  in
  let class_idents =
    List.map
      (fun (kw, _) ->
        let ident =
          if qualified_kw kw then begin
            let ns = Option.get (kw_namespace kw) in
            if not (user_class_namespace ns) then
              failwith "Class ident must have valid namespace";
            create_db_ident_from_name ns (kw_name kw)
          end
          else create_user_class_ident_from_name kw
        in
        kw, ident)
      classes
  in
  List.fold_left
    (fun m (k, v) -> StringMap.add k v m)
    StringMap.empty
    (prop_idents @ class_idents)

(* ---------- sqlite-util / property-build builders ---------- *)

let timestamps () = [ "block/created-at", time_ms (); "block/updated-at", time_ms () ]

(* cljs sqlite-util/build-new-property *)
let build_new_property ~db_ident ~(decl : property_decl) () : (string * edn) list =
  let prop_type = decl.p_type in
  let prop_name = match decl.p_title with Some t -> t | None -> kw_name db_ident in
  let ref_type = List.mem prop_type all_ref_property_types in
  (* cljs (merge (dissoc prop-schema :db/cardinality) defaults-with-attrs) —
     schema attrs first, defaults win on collisions *)
  merge'
    decl.p_schema
    ([ "db/ident", Kw db_ident;
       "block/tags", Set_ [ Kw "logseq.class/Property" ];
       "logseq.property/type", Kw prop_type;
       "block/name", Str (Ldb.page_name_sanity_lc (kw_name prop_name));
       "block/uuid",
       Uuid (match decl.p_uuid with Some u -> u | None -> gen_db_ident_uuid db_ident);
       "block/title", Str (kw_name prop_name);
       "db/index", Bool true;
       "db/cardinality",
       Kw (if decl.p_cardinality_many then "db.cardinality/many" else "db.cardinality/one");
       "block/order", Str (gen_order_key ()) ]
     @ (if ref_type then [ "db/valueType", Kw "db.type/ref" ] else [])
     @ decl.p_extra
     @ timestamps ())

(* cljs sqlite-util/build-new-class *)
let build_new_class (block : (string * edn) list) : (string * edn) list =
  let db_ident =
    match get' block "db/ident" with
    | Some (Kw i) -> i
    | _ -> failwith "build-new-class requires :db/ident"
  in
  let tags =
    match get' block "block/tags" with
    | Some (Set_ ts) | Some (Vec ts) -> ts
    | _ -> []
  in
  let block' = assoc' block "block/tags" (Set_ (Kw "logseq.class/Tag" :: tags)) in
  let block'' =
    if db_ident <> "logseq.class/Root" && get' block' "logseq.property.class/extends" = None
    then assoc' block' "logseq.property.class/extends" (Kw "logseq.class/Root")
    else block'
  in
  merge' block'' (timestamps ())

(* cljs db-property-build/build-closed-value-block *)
let build_closed_value_block ~block_uuid ~block_type ~value ~property_ident
    ~(db_ident : string option) ~(icon : (string * edn) list option)
    ~(extra : (string * edn) list) : (string * edn) list =
  let property_ref = Kw property_ident in
  merge'
    ([ "block/uuid", Uuid block_uuid;
       "block/page", property_ref;
       "block/closed-value-property", property_ref;
       "logseq.property/created-from-property",
       (if property_ident = "logseq.property/default-value"
        then Vec [ Kw "block/uuid"; Uuid block_uuid ]
        else property_ref);
       "block/parent", property_ref ]
     @ (if property_value_content_type block_type property_ident
        then [ "logseq.property/value", Str value ]
        else [ "block/title", Str value ])
     @ (match db_ident with Some i -> [ "db/ident", Kw i ] | None -> [])
     @ (match icon with Some m -> [ "logseq.property/icon", Map m ] | None -> [])
     @ timestamps ()
     @ [ "block/order", Str (gen_order_key ()) ])
    extra

(* Handle for the entity a pvalue belongs to (cljs new-block) *)
type new_block =
  { nb_db_id : edn (* Int tempid | Vec lookup | Kw ident *)
  ; nb_page : edn option }

(* cljs db-property-build/build-property-value-block *)
let build_property_value_block (block : new_block) ~(property_ident : string)
    ~(property_id : edn) ~(prop_type : string) ~(value : edn)
    ~(extra : (string * edn) list) : (string * edn) list =
  let uuid = gen_uuid () in
  merge'
    ([ "block/uuid", Uuid uuid;
       "block/page", (match block.nb_page with Some p -> p | None -> block.nb_db_id);
       "block/parent", block.nb_db_id;
       "logseq.property/created-from-property",
       (if property_ident = "logseq.property/default-value"
        then block.nb_db_id
        else property_id);
       "block/order", Str (gen_order_key ()) ]
     @ (if property_value_content_type prop_type property_ident
        then [ "logseq.property/value", value ]
        else [ "block/title", value ])
     @ timestamps ())
    extra

(* cljs ->property-value-tx-m + build-pvalue +
   build-property-values-tx-m :pvalue-map? — for each property whose values
   need property-value entities, returns the extra entity maps plus the ref
   value to assoc on the owning block. *)
type pvalue_entry =
  { pv_key : string
  ; pv_txs : (string * edn) list list
  ; pv_ref : edn }

let rec property_value_tx (block : new_block) (prop : string) (v : prop_value)
    ~(properties_config : (string * property_decl) list)
    ~(all_idents : string StringMap.t) ~(page_uuids : string StringMap.t)
    : pvalue_entry option =
  (* cljs build-property-map-for-pvalue-tx *)
  let is_ref_vec = function Vec _ -> true | _ -> false in
  let pvalue_type =
    match built_in_property_type prop with
    | Some t when List.mem t value_ref_property_types -> Some (t, prop)
    | Some _ -> None
    | None ->
        (match List.assoc_opt prop properties_config with
         | Some decl when List.mem decl.p_type value_ref_property_types ->
             (match v with
              | Set_ (x :: _) when is_ref_vec x -> None
              | Vec _ -> None
              | _ -> Some (decl.p_type, get_ident all_idents prop))
         | _ -> None)
  in
  match pvalue_type with
  | None -> None
  | Some (prop_type, ident) ->
      let property_id = Kw ident in
      let decl = List.assoc_opt prop properties_config in
      let build_one (v' : prop_value) : (string * edn) list list * edn =
        match v' with
        | Map m when List.mem_assoc "build/property-value" m ->
            (* cljs build-pvalue: :attributes = merge of the map's
               :build/properties + nested pvalue refs + :build/tags +
               created/updated/children; :value = :logseq.property/value or
               :block/title *)
            let uuid = match get' m "block/uuid" with Some (Uuid u) -> u | _ -> gen_uuid () in
            let value =
              match get' m "logseq.property/value", get' m "block/title" with
              | Some x, _ | None, Some x -> x
              | None, None -> Str ""
            in
            let nested_props = props_of_map m in
            let nb' =
              { nb_db_id = Vec [ Kw "block/uuid"; Uuid uuid ]; nb_page = block.nb_page }
            in
            let nested_entries =
              List.filter_map
                (fun (pk, pv) ->
                  property_value_tx nb' pk pv ~properties_config ~all_idents ~page_uuids)
                nested_props
            in
            let attrs =
              block_properties nested_props page_uuids all_idents ~translate_values:true
              @ List.map (fun e -> e.pv_key, e.pv_ref) nested_entries
              @ (match get' m "build/tags" with
                 | Some (Vec ts) | Some (Set_ ts) ->
                     [ "block/tags",
                       Vec
                         (List.map
                            (function
                              | Kw t -> Map [ "db/ident", Kw (get_ident all_idents t) ]
                              | t -> t)
                            ts) ]
                 | _ -> [])
              @ List.filter_map
                  (fun (k, x) ->
                    match k with
                    | "block/created-at" | "block/updated-at" -> Some (k, x)
                    | _ -> None)
                  m
            in
            let ent =
              merge'
                (build_property_value_block block ~property_ident:ident
                   ~property_id ~prop_type ~value ~extra:attrs)
                [ "block/uuid", Uuid uuid ]
            in
            (ent :: List.concat_map (fun e -> e.pv_txs) nested_entries,
             Vec [ Kw "block/uuid"; Uuid uuid ])
        | scalar ->
            let closed_uuid =
              match decl with
              | Some d ->
                  List.find_map
                    (fun cv ->
                      match scalar with
                      | Str s when cv.cv_value = s -> cv.cv_uuid
                      | _ -> None)
                    d.p_closed_values
              | None -> None
            in
            (match closed_uuid with
             | Some u -> [], Vec [ Kw "block/uuid"; Uuid u ]
             | None ->
                 let ent =
                   build_property_value_block block ~property_ident:ident
                     ~property_id ~prop_type ~value:scalar ~extra:[]
                 in
                 let uuid =
                   match get' ent "block/uuid" with Some (Uuid u) -> u | _ -> assert false
                 in
                 [ ent ], Vec [ Kw "block/uuid"; Uuid uuid ])
      in
      (match v with
       | Set_ vs ->
           let txs, refs = List.split (List.map build_one vs) in
           Some { pv_key = prop; pv_txs = List.concat txs; pv_ref = Set_ refs }
       | _ ->
           let txs, ref' = build_one v in
           Some { pv_key = prop; pv_txs = txs; pv_ref = ref' })

(* cljs ->block-tx — pvalue txs first, then the block map *)
let block_tx ~(block_map : (string * edn) list) ~(page_id : edn)
    ~(page_uuids : string StringMap.t) ~(all_idents : string StringMap.t)
    ~(properties_config : (string * property_decl) list)
    ~(translate_values : bool) ~(extract_refs : bool) : (string * edn) list list =
  let properties = props_of_map block_map in
  let db_id = new_db_id () in
  let nb =
    { nb_db_id = db_id; nb_page = Some (Map [ "db/id", page_id ]) }
  in
  let pvalue_entries =
    List.filter_map
      (fun (pk, pv) -> property_value_tx nb pk pv ~properties_config ~all_idents ~page_uuids)
      properties
  in
  let ref_strings =
    match get' block_map "block/title", extract_refs with
    | Some (Str t), true -> extract_basic_content_refs t
    | _ -> []
  in
  let base =
    merge'
      ([ "db/id", db_id;
         "block/page", Map [ "db/id", page_id ];
         "block/order", Str (gen_order_key ());
         "block/parent",
         (match get' block_map "block/parent" with
          | Some p -> p
          | None -> Map [ "db/id", page_id ]) ]
       @ timestamps ())
      (dissoc' block_map [ "build/properties"; "build/tags"; "build/keep-uuid?" ])
  in
  let with_props =
    match properties @ List.map (fun e -> e.pv_key, e.pv_ref) pvalue_entries with
    | [] -> base
    | props -> merge' base (block_properties props page_uuids all_idents ~translate_values)
  in
  let with_tags =
    match get' block_map "build/tags" with
    | Some (Vec ts) | Some (Set_ ts) ->
        assoc' with_props "block/tags"
          (Vec
             (List.map
                (function
                  | Kw t -> Map [ "db/ident", Kw (get_ident all_idents t) ]
                  | t -> t)
                ts))
    | _ -> with_props
  in
  let final =
    match ref_strings with
    | [] -> with_tags
    | _ ->
        let title =
          match get' with_tags "block/title" with Some (Str t) -> t | _ -> ""
        in
        let ref_maps =
          List.map
            (fun rs ->
              if uuid_like rs then [ "block/uuid", Uuid rs ]
              else
                match StringMap.find_opt rs page_uuids with
                | Some u -> [ "block/uuid", Uuid u; "block/title", Str rs ]
                | None -> failwith ("No uuid for page ref name " ^ rs))
            ref_strings
        in
        let block_refs = List.map (fun m -> Map m) ref_maps in
        let ref_pairs =
          List.filter_map
            (fun m ->
              match map_title m, map_uuid m with
              | Some t, Some u -> Some (t, u)
              | None, Some u -> Some (u, u)
              | _ -> None)
            ref_maps
        in
        merge' with_tags
          [ "block/title", Str (title_ref_to_id_ref title ref_pairs);
            "block/refs", Vec block_refs ]
  in
  List.concat_map (fun e -> e.pv_txs) pvalue_entries @ [ final ]

(* cljs build-page-tx *)
let build_page_tx ~(page : (string * edn) list) ~(all_idents : string StringMap.t)
    ~(page_uuids : string StringMap.t) ~(properties_config : (string * property_decl) list)
    ~(translate_values : bool) : (string * edn) list list =
  let properties = props_of_map page in
  let db_id = match get' page "db/id" with Some id -> id | None -> new_db_id () in
  let nb = { nb_db_id = db_id; nb_page = None } in
  let pvalue_entries =
    List.filter_map
      (fun (pk, pv) -> property_value_tx nb pk pv ~properties_config ~all_idents ~page_uuids)
      properties
  in
  let tag_idents =
    match get' page "build/tags" with
    | Some (Vec ts) | Some (Set_ ts) ->
        List.filter_map (function Kw t -> Some (get_ident all_idents t) | _ -> None) ts
    | _ -> []
  in
  let tags_value =
    let add_page_tag =
      not (List.exists (fun t -> List.mem t page_classes) tag_idents)
    in
    Vec
      (List.map (fun i -> Map [ "db/ident", Kw i ]) tag_idents
       @ if add_page_tag then [ Kw "logseq.class/Page" ] else [])
  in
  (* cljs build-pages-and-blocks-tx: the default page map carries
     :block/tags #{:logseq.class/Page}; a journal page's expand-journal
     :block/tags #{:logseq.class/Journal} (or an explicit page attr) wins
     over the default. *)
  let page' =
    match get' (dissoc' page [ "build/tags"; "build/properties"; "build/keep-uuid?" ]) "block/tags" with
    | Some _ -> dissoc' page [ "build/tags"; "build/properties"; "build/keep-uuid?" ]
    | None ->
        assoc'
          (dissoc' page [ "build/tags"; "build/properties"; "build/keep-uuid?" ])
          "block/tags" (Set_ [ Kw "logseq.class/Page" ])
  in
  let final =
    merge' page'
      (timestamps ()
       @ (match properties @ List.map (fun e -> e.pv_key, e.pv_ref) pvalue_entries with
          | [] -> []
          | props -> block_properties props page_uuids all_idents ~translate_values)
       @ (* cljs build-page-tx emits :block/tags only when :build/tags is
            present *)
         (match tag_idents with
          | [] -> []
          | _ -> [ "block/tags", tags_value ]))
  in
  List.concat_map (fun e -> e.pv_txs) pvalue_entries @ [ final ]

(* cljs split-blocks-tx — attrs keyed by declared property idents go to the
   second tx so property schema lands first *)
let split_blocks_tx (blocks_tx : (string * edn) list list)
    (properties : (string * property_decl) list)
    : (string * edn) list list * (string * edn) list list =
  let property_idents =
    List.filter_map
      (fun m ->
        match get' m "db/cardinality", get' m "db/ident" with
        | Some _, Some (Kw i) -> Some i
        | _ -> None)
      blocks_tx
    @ List.map fst properties
  in
  List.fold_left
    (fun (init, props_tx) m ->
      let props = List.filter (fun (k, _) -> List.mem k property_idents) m in
      let init' =
        match dissoc' m (List.map fst props) with
        | [] -> init
        | rest -> init @ [ rest ]
      in
      let props_tx' =
        match props with
        | [] -> props_tx
        | _ ->
            (match get' m "block/uuid" with
             | Some u -> props_tx @ [ ("block/uuid", u) :: props ]
             | None -> failwith "No :block/uuid for block")
      in
      init', props_tx')
    ([], []) blocks_tx

(* cljs build-property-tx — one declared property *)
let build_property_tx ~(prop_name : string) ~(decl : property_decl)
    ~(all_idents : string StringMap.t) ~(page_uuids : string StringMap.t)
    ~(properties_config : (string * property_decl) list)
    ~(property_db_id : edn) ~(class_property_order : string option)
    ~(translate_values : bool) : (string * edn) list list =
  let db_ident = get_ident all_idents prop_name in
  let new_block, additional =
    match decl.p_closed_values with
    | [] ->
        merge'
          (build_new_property ~db_ident ~decl ())
          ([ "db/id", property_db_id ]
           @ (match class_property_order with
              | Some o -> [ "block/order", Str o ]
              | None -> [])),
        []
    | closed_values ->
        (* cljs db-property-build/build-closed-values: property map + one
           closed-value block per value *)
        let prop_m =
          merge'
            (build_new_property ~db_ident ~decl ())
            ([ "db/id", property_db_id ]
             @ (match class_property_order with
                | Some o -> [ "block/order", Str o ]
                | None -> []))
        in
        let cv_blocks =
          List.map
            (fun (cv : closed_value_decl) ->
              let uuid = match cv.cv_uuid with Some u -> u | None -> gen_uuid () in
              build_closed_value_block ~block_uuid:uuid ~block_type:decl.p_type
                ~value:cv.cv_value ~property_ident:db_ident ~db_ident:cv.cv_ident
                ~icon:cv.cv_icon ~extra:cv.cv_properties)
            closed_values
        in
        prop_m, cv_blocks
  in
  let nb = { nb_db_id = property_db_id; nb_page = None } in
  let pvalue_entries =
    List.filter_map
      (fun (pk, pv) -> property_value_tx nb pk pv ~properties_config ~all_idents ~page_uuids)
      decl.p_properties
  in
  let final =
    merge'
      (dissoc' new_block [ "build/properties-ref-types" ])
      ((match decl.p_properties @ List.map (fun e -> e.pv_key, e.pv_ref) pvalue_entries with
        | [] -> []
        | props -> block_properties props page_uuids all_idents ~translate_values)
       @ (match decl.p_property_classes with
          | [] -> []
          | cs ->
              [ "logseq.property/classes",
                Vec (List.map (fun c -> Map [ "db/ident", Kw (get_ident all_idents c) ]) cs) ]))
  in
  List.concat_map (fun e -> e.pv_txs) pvalue_entries @ [ final ] @ additional

(* cljs class-properties->ordered-properties — topo order inferred from
   :build/class-properties with input-order tie-break *)
let class_properties_ordered (classes : (string * class_decl) list) : string list =
  let all =
    List.concat_map (fun (_, c) -> c.c_class_properties) classes |> List.sort_uniq compare
  in
  let index = List.mapi (fun i p -> p, i) all in
  let edges =
    List.concat_map
      (fun (_, c) ->
        let rec pairs = function a :: (b :: _ as rest) -> (a, b) :: pairs rest | _ -> [] in
        pairs c.c_class_properties)
      classes
    |> List.filter (fun (a, b) -> a <> b)
    |> List.sort_uniq compare
  in
  let rec kahn edges pending acc =
    let sources =
      List.filter (fun n -> not (List.exists (fun (_, b) -> b = n) edges)) pending
      |> List.sort (fun a b -> compare (List.assoc a index) (List.assoc b index))
    in
    match sources with
    | [] -> List.rev acc @ pending
    | next :: _ ->
        kahn
          (List.filter (fun (a, _) -> a <> next) edges)
          (List.filter (fun n -> n <> next) pending)
          (next :: acc)
  in
  kahn edges all []

(* cljs build-properties-tx (build-existing-tx? path omitted — unused) *)
let build_properties_tx ~(properties : (string * property_decl) list)
    ~(classes : (string * class_decl) list) ~(all_idents : string StringMap.t)
    ~(page_uuids : string StringMap.t) ~(translate_values : bool) : (string * edn) list list =
  let ordered = class_properties_ordered classes in
  let orders = List.map2 (fun p o -> p, o) ordered (List.map (fun _ -> gen_order_key ()) ordered) in
  let property_db_ids = List.map (fun (name, _) -> name, new_db_id ()) properties in
  List.concat_map
    (fun (name, decl) ->
      build_property_tx ~prop_name:name ~decl ~all_idents ~page_uuids
        ~properties_config:properties ~property_db_id:(List.assoc name property_db_ids)
        ~class_property_order:(List.assoc_opt name orders) ~translate_values)
    properties

(* cljs build-classes-tx *)
let build_classes_tx ~(classes : (string * class_decl) list)
    ~(properties_config : (string * property_decl) list)
    ~(all_idents : string StringMap.t) ~(page_uuids : string StringMap.t)
    ~(translate_values : bool) : (string * edn) list list =
  let class_db_ids = List.map (fun (name, _) -> name, new_db_id ()) classes in
  List.concat_map
    (fun (class_name, decl) ->
      let db_ident = get_ident all_idents class_name in
      let title = match decl.c_title with Some t -> t | None -> kw_name class_name in
      let new_block =
        build_new_class
          ([ "block/name", Str (Ldb.page_name_sanity_lc title);
             "block/title", Str title;
             "block/uuid",
             Uuid (match decl.c_uuid with Some u -> u | None -> gen_db_ident_uuid db_ident);
             "db/ident", Kw db_ident;
             "db/id", List.assoc class_name class_db_ids ]
           @ decl.c_extra)
      in
      let nb = { nb_db_id = List.assoc class_name class_db_ids; nb_page = None } in
      let pvalue_entries =
        List.filter_map
          (fun (pk, pv) -> property_value_tx nb pk pv ~properties_config ~all_idents ~page_uuids)
          decl.c_properties
      in
      let extends =
        match decl.c_extends with
        | [] -> None
        | cs ->
            Some
              (Vec
                 (List.map
                    (fun c ->
                      match List.assoc_opt c class_db_ids with
                      | Some id -> id
                      | None when class_kw c -> Kw c
                      | None -> failwith ("No :db/id for :" ^ c))
                    cs))
      in
      let final =
        merge'
          (dissoc' new_block
             [ "build/properties"; "build/class-extends"; "build/class-parent";
               "build/class-properties"; "build/keep-uuid?" ])
          ((match decl.c_properties @ List.map (fun e -> e.pv_key, e.pv_ref) pvalue_entries with
            | [] -> []
            | props -> block_properties props page_uuids all_idents ~translate_values)
           @ (match extends with
              | Some e -> [ "logseq.property.class/extends", e ]
              | None -> [])
           @ (match decl.c_class_properties with
              | [] -> []
              | cps ->
                  [ "logseq.property.class/properties",
                    Vec (List.map (fun p -> Map [ "db/ident", Kw (get_ident all_idents p) ]) cps) ]))
      in
      List.concat_map (fun e -> e.pv_txs) pvalue_entries @ [ final ])
    classes

(* cljs validate-class-extends-acyclic! *)
let validate_class_extends_acyclic ~(classes : (string * class_decl) list)
    ~(all_idents : string StringMap.t) : unit =
  let class_idents = List.map (fun (k, _) -> get_ident all_idents k) classes in
  let edges =
    List.concat_map
      (fun (name, decl) ->
        let ci = get_ident all_idents name in
        List.filter_map
          (fun parent ->
            let pi = get_ident all_idents parent in
            if List.mem pi class_idents then Some (ci, pi) else None)
          decl.c_extends)
      classes
  in
  if edges <> [] then begin
    let pending = ref class_idents in
    let edges_ref = ref edges in
    while !pending <> [] do
      let sources =
        List.filter (fun c -> not (List.exists (fun (_, p) -> p = c) !edges_ref)) !pending
      in
      match sources with
      | [] -> failwith "Cycle detected in :build/class-extends"
      | _ ->
          List.iter
            (fun s ->
              edges_ref := List.filter (fun (c, _) -> c <> s) !edges_ref;
              pending := List.filter ((<>) s) !pending)
            sources
    done
  end

(* cljs build-blocks-tx — returns (init-tx, block-props-tx) entity maps *)
let build_blocks_tx (options : create_options)
    : (string * edn) list list * (string * edn) list list =
  let raw_pages = List.map (fun pb -> page_decl_to_raw_map pb.page) options.pages_and_blocks in
  let blocks =
    List.map
      (fun pb -> List.concat_map (fun b -> block_decl_to_flat b ~parent:None) pb.blocks)
      options.pages_and_blocks
  in
  (* cljs order: add-new-pages-from-properties -> expand-journal ->
     expand-block-children -> add-new-pages-from-refs -> ensure-page-uuids *)
  let raw_pages =
    add_new_pages_from_properties ~options raw_pages (List.concat blocks)
  in
  let n_new = List.length raw_pages - List.length blocks in
  let blocks = List.init n_new (fun _ -> []) @ blocks in
  let pages = List.map expand_journal_map raw_pages in
  let pages =
    if options.extract_content_refs then add_new_pages_from_refs pages (List.concat blocks)
    else pages
  in
  let n_new' = List.length pages - List.length blocks in
  let blocks =
    if n_new' > 0 then List.init n_new' (fun _ -> []) @ blocks else blocks
  in
  (* ensure-page-uuids + page defaults (cljs build-pages-and-blocks-tx) *)
  let pages =
    List.map
      (fun p ->
        let p =
          match get' p "block/uuid" with
          | Some _ -> p
          | None -> p @ [ "block/uuid", Uuid (gen_uuid ()) ]
        in
        let title =
          match get' p "block/title", get' p "block/name" with
          | Some (Str t), _ -> t
          | None, Some (Str n) -> String.capitalize_ascii n
          | _ -> failwith ":block/title, :block/uuid or :build/journal required"
        in
        merge'
          [ "db/id", (match get' p "db/id" with Some id -> id | None -> new_db_id ());
            "block/title", Str title;
            "block/name",
            (match get' p "block/name" with
             | Some n -> n
             | None -> Str (Ldb.page_name_sanity_lc title));
            "block/tags", Set_ [ Kw "logseq.class/Page" ] ]
          p)
      pages
  in
  let page_uuids =
    List.fold_left
      (fun m p ->
        match map_title p, map_uuid p with
        | Some t, Some u -> StringMap.add t u m
        | _ -> m)
      StringMap.empty pages
  in
  let properties, classes =
    if options.auto_create_ontology then
      auto_create_ontology ~options ~pages ~blocks:(List.concat blocks)
    else options.properties, options.classes
  in
  let all_idents = create_all_idents ~properties ~classes in
  validate_class_extends_acyclic ~classes ~all_idents;
  let properties_tx =
    build_properties_tx ~properties ~classes ~all_idents ~page_uuids
      ~translate_values:options.translate_property_values
  in
  let classes_tx =
    build_classes_tx ~classes ~properties_config:properties ~all_idents ~page_uuids
      ~translate_values:options.translate_property_values
  in
  let class_ident_to_id =
    List.filter_map
      (fun c ->
        match get' c "db/ident", get' c "db/id" with
        | Some (Kw i), Some id -> Some (i, id)
        | _ -> None)
      classes_tx
  in
  let properties_tx' =
    List.map
      (fun m ->
        match get' m "logseq.property/classes" with
        | Some (Vec cs) ->
            assoc' m "logseq.property/classes"
              (Vec
                 (List.map
                    (function
                      | Map [ ("db/ident", Kw i) ] as c ->
                          if logseq_class i then c
                          else
                            (match List.assoc_opt i class_ident_to_id with
                             | Some id -> Map [ "db/id", id ]
                             | None -> failwith ("No :db/id found for :db/ident " ^ i))
                      | other -> other)
                    cs))
        | _ -> m)
      properties_tx
  in
  let pages_and_blocks_tx =
    List.concat_map
      (fun (page, page_blocks) ->
        let page_id =
          match get' page "db/id" with Some id -> id | None -> assert false
        in
        build_page_tx ~page ~all_idents ~page_uuids ~properties_config:properties
          ~translate_values:options.translate_property_values
        @ List.concat_map
            (fun b ->
              block_tx ~block_map:b ~page_id ~page_uuids ~all_idents
                ~properties_config:properties
                ~translate_values:options.translate_property_values
                ~extract_refs:options.extract_content_refs)
            page_blocks)
      (List.combine pages blocks)
  in
  split_blocks_tx (properties_tx' @ classes_tx @ pages_and_blocks_tx) properties

(* db-test/create-conn-with-blocks — cljs create-blocks transacts init-tx
   then block-props-tx *)
let transact_maps conn (txs : (string * edn) list list) =
  ignore
    (Datascript.transact_conn_string conn
       ("[" ^ String.concat " " (List.map edn_map_to_string txs) ^ "]"))

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

(* ---------- finders (db-test helpers) ---------- *)

let query_one_id (db : db) (q : string) (input : value) : entity option =
  match Datascript.q_string ~inputs:[ Arg_scalar (Result_value input) ] db q with
  | [ [ Result_entity id ] ] -> Ldb.ent_of_id db id
  | [ [ Result_value (Int id) ] ] -> Ldb.ent_of_id db id
  | _ -> None

(* db-test/find-block-by-content — blocks only ([?b :block/page]) *)
let find_block_by_content (db : db) (content : string) : entity option =
  query_one_id db
    "[:find [?b ...] :in $ ?content :where [?b :block/title ?content] [?b :block/page]]"
    (String content)

(* db-test/find-page-by-title — first entity with the title *)
let find_page_by_title (db : db) (title : string) : entity option =
  query_one_id db
    "[:find [?b ...] :in $ ?title :where [?b :block/title ?title]]"
    (String title)

(* db-test/find-journal-by-journal-day *)
let find_journal_by_journal_day (db : db) (day : int) : entity option =
  query_one_id db
    "[:find [?page ...] :in $ ?journal-day :where [?page :block/journal-day ?journal-day]]"
    (Int day)


(* ---------- pipeline fixture (richer built-ins) ---------- *)

let initial_data_ident ident attrs =
  Datascript.Entity
    { db_id = None; attrs = ("db/ident", One_value (Keyword ident)) :: attrs }

let initial_data_ident = initial_data_ident

(* db-test/initial-data — cljs transacts ident entities in a first tx so
   :db/valueType datoms land in the schema before test tx data resolves ref
   values. Direct Entity tx_ops (not transact_conn_string): the strict
   schema check on the slow path rejects ref-typed db/cardinality values
   produced by the edn parser. *)
let initial_data_ops : tx_op list =
  let ref_attr ?(card = "db.cardinality/many") ident =
    initial_data_ident ident
      [ "db/valueType", One_value (Keyword "db.type/ref")
      ; "db/cardinality", One_value (Keyword card)
      ]
  in
  (* tempid-based refs: same-tx ident lookups don't resolve *)
  (* classes and properties are pages: page_attr_checks (name/title) +
     page_checks (uuid/created-at/updated-at) apply — match cljs built-ins
     which carry db-ident-block-uuid uuids *)
  let name_of ident =
    let idx = String.rindex_opt ident '/' in
    match idx with
    | Some i -> String.sub ident (i + 1) (String.length ident - i - 1)
    | None -> ident
  in
  let page_attrs ~uuid_seed ~title =
    [ "block/uuid",
      One_value (Uuid (Common_uuid.gen_uuid "db-ident-block-uuid" uuid_seed))
    ; "block/name", One_value (String (Ldb.page_name_sanity_lc title))
    ; "block/title", One_value (String title)
    ; "block/created-at", One_value (Int 1700000000000)
    ; "block/updated-at", One_value (Int 1700000000000) ]
  in
  let class_ident ?(title = "") ?(extends = []) ?(extra = []) ident =
    let title =
      if title = "" then String.capitalize_ascii (name_of ident) else title
    in
    Datascript.Entity
      { db_id = Some (Temp_id ("cls-" ^ ident))
      ; attrs =
          ("db/ident", One_value (Keyword ident))
          :: ("block/tags", One_value (Ref_to (Temp_id "cls-logseq.class/Tag")))
          :: ("logseq.property/built-in?", One_value (Bool true))
          :: (page_attrs ~uuid_seed:ident ~title
              @ List.map
                  (fun e ->
                    "logseq.property.class/extends",
                    One_value (Ref_to (Temp_id ("cls-" ^ e))))
                  extends
              @ extra)
      }
  in
  (* closed-value blocks — cljs build-closed-value-block: page/parent/
     closed-value-property/created-from-property all ref the property *)
  let closed_value parent_ident ident =
    Datascript.Entity
      { db_id = Some (Temp_id ("cv-" ^ ident))
      ; attrs =
          ("db/ident", One_value (Keyword ident))
          :: ("block/closed-value-property",
              One_value (Ref_to (Temp_id ("prop-" ^ parent_ident))))
          :: ("logseq.property/created-from-property",
              One_value (Ref_to (Temp_id ("prop-" ^ parent_ident))))
          :: ("block/page",
              One_value (Ref_to (Temp_id ("prop-" ^ parent_ident))))
          :: ("block/parent",
              One_value (Ref_to (Temp_id ("prop-" ^ parent_ident))))
          :: ("block/order", One_value (String (gen_order_key ())))
          :: page_attrs ~uuid_seed:ident ~title:(name_of ident)
      }
  in
  (* property ident entity — tagged logseq.class/Property like cljs built-ins *)
  let property_ident ?(typ = "default") ?(ref_ = false)
      ?(card = "db.cardinality/many") ?(extra = []) ident =
    Datascript.Entity
      { db_id = Some (Temp_id ("prop-" ^ ident))
      ; attrs =
          ("db/ident", One_value (Keyword ident))
          :: ("block/tags",
              One_value (Ref_to (Temp_id "cls-logseq.class/Property")))
          :: ("logseq.property/built-in?", One_value (Bool true))
          :: ("logseq.property/type", One_value (Keyword typ))
          :: (page_attrs ~uuid_seed:ident ~title:(name_of ident)
              @ (if ref_ then
                   [ "db/valueType", One_value (Keyword "db.type/ref")
                   ; "db/cardinality", One_value (Keyword card) ]
                 else [])
              @ extra)
      }
  in
  [ initial_data_ident "logseq.property" [] ]
  @ [ class_ident "logseq.class/Root"
    ; class_ident "logseq.class/Tag"
    ; class_ident ~extends:[ "logseq.class/Root" ] "logseq.class/Page"
    ; class_ident ~extends:[ "logseq.class/Root" ] "logseq.class/Property"
    ; class_ident
        ~extends:[ "logseq.class/Page" ]
        ~extra:
          [ "logseq.property.journal/title-format",
            One_value (String "MMM do, yyyy") ]
        "logseq.class/Journal"
    ; class_ident ~extends:[ "logseq.class/Root" ] "logseq.class/Task"
    ; class_ident ~extends:[ "logseq.class/Root" ] "logseq.class/Comments"
    ; class_ident ~extends:[ "logseq.class/Root" ] "logseq.class/Comment"
    ; class_ident ~extends:[ "logseq.class/Root" ] "logseq.class/Query"
    ; class_ident ~extends:[ "logseq.class/Root" ] "logseq.class/Card"
    ; class_ident ~extends:[ "logseq.class/Page" ] "logseq.class/Whiteboard"
    ; class_ident ~extends:[ "logseq.class/Root" ] "logseq.class/Asset"
    ; class_ident ~extends:[ "logseq.class/Root" ] "logseq.class/Code-block"
    ; class_ident ~extends:[ "logseq.class/Root" ] "logseq.class/Quote-block"
    ; class_ident ~extends:[ "logseq.class/Root" ] "logseq.class/Math-block"
    ; class_ident ~extends:[ "logseq.class/Root" ] "logseq.class/Template"
    ; (* Library built-in page — deterministic builtin-block-uuid like cljs *)
      Datascript.Entity
        { db_id = Some (Temp_id "lib-page")
        ; attrs =
            [ "block/uuid",
              One_value
                (Uuid (Common_uuid.gen_uuid "builtin-block-uuid" "Library"))
            ; "block/name", One_value (String "library")
            ; "block/title", One_value (String "Library")
            ; "block/tags",
              One_value (Ref_to (Temp_id "cls-logseq.class/Page"))
            ; "logseq.property/built-in?", One_value (Bool true)
            ; "block/created-at", One_value (Int 1700000000000)
            ; "block/updated-at", One_value (Int 1700000000000)
            ]
        }
    ; property_ident ~typ:"keyword" "logseq.property/type"
    ; property_ident ~typ:"checkbox" "logseq.property/hide?"
    ; property_ident ~typ:"entity" ~ref_:true ~card:"db.cardinality/one"
        "logseq.property/default-value"
    ; property_ident ~typ:"datetime" "logseq.property/deleted-at"
    ; property_ident ~typ:"keyword" "logseq.property/cardinality"
    ; property_ident ~typ:"checkbox"
        "logseq.property.class/enable-bidirectional?"
    ; property_ident ~typ:"string"
        "logseq.property.class/bidirectional-property-title"
    ; property_ident ~typ:"string" "logseq.property.journal/title-format"
    ; property_ident ~typ:"entity" ~ref_:true "logseq.property/classes"
    ; property_ident ~typ:"property" ~ref_:true
        "logseq.property.class/properties"
    ; property_ident ~typ:"class" ~ref_:true
        "logseq.property.class/extends"
    ; property_ident ~typ:"entity" ~ref_:true ~card:"db.cardinality/one"
        "logseq.property/created-from-property"
    ; property_ident ~typ:"node" ~ref_:true
        "logseq.property/closed-values"
    ; property_ident ~typ:"any" ~card:"db.cardinality/one"
        "logseq.property/value"
    ; (* cljs prod schema indexes logseq.property/public? — pipeline
         reference-attrs reads it through :avet *)
      property_ident ~typ:"checkbox" "logseq.property/public?"
        ~extra:[ "db/index", One_value (Bool true) ]
    ; property_ident ~typ:"checkbox" "logseq.property/publishing-public?"
    ; property_ident ~typ:"checkbox" "logseq.property/built-in?"
    ; property_ident ~typ:"default" ~ref_:true ~card:"db.cardinality/one"
        "logseq.property/query"
    ; property_ident ~typ:"node" ~ref_:true
        "logseq.property.comments/blocks"
    ; property_ident ~typ:"keyword" "logseq.property.node/display-type"
    ; property_ident ~typ:"class" ~ref_:true
        "logseq.property/template-applied-to"
    ; property_ident ~typ:"string" "logseq.property.reaction/emoji-id"
    ; property_ident ~typ:"node" ~ref_:true ~card:"db.cardinality/one"
        "logseq.property.reaction/target"
    ; property_ident ~typ:"node" ~ref_:true ~card:"db.cardinality/one"
        "logseq.property/view-for"
    ; property_ident ~typ:"keyword" "logseq.property/view-context"
    ; property_ident ~typ:"node" ~ref_:true ~card:"db.cardinality/one"
        "logseq.property.history/block"
    ; property_ident ~typ:"property" ~ref_:true ~card:"db.cardinality/one"
        "logseq.property.history/property"
    ; property_ident ~typ:"node" ~ref_:true ~card:"db.cardinality/one"
        "logseq.property.history/ref-value"
    ; property_ident ~typ:"default" "logseq.property.history/scalar-value"
    ; property_ident ~typ:"checkbox" "logseq.property/enable-history?"
    ; property_ident ~typ:"string" "logseq.property.code/lang"
    ; property_ident ~typ:"default" ~ref_:true ~card:"db.cardinality/one"
        ~extra:
          [ "logseq.property/enable-history?", One_value (Bool true) ]
        "logseq.property/status"
    ; property_ident ~typ:"datetime" "logseq.property/scheduled"
    ; property_ident ~typ:"number" ~ref_:true ~card:"db.cardinality/one"
        "logseq.property.repeat/recur-frequency"
    ; property_ident ~typ:"default" ~ref_:true ~card:"db.cardinality/one"
        "logseq.property.repeat/recur-unit"
    ; property_ident ~typ:"default" ~ref_:true ~card:"db.cardinality/one"
        "logseq.property.repeat/repeat-type"
    ; property_ident ~typ:"checkbox" "logseq.property.repeat/repeated?"
    ; property_ident ~typ:"string" "logseq.property.asset/type"
    ; property_ident ~typ:"raw-number" "logseq.property.asset/size"
    ; property_ident ~typ:"string" "logseq.property.asset/checksum"
    ; property_ident ~typ:"node" ~ref_:true ~card:"db.cardinality/one"
        "logseq.property/used-template"
    ; closed_value "logseq.property/status" "logseq.property/status.backlog"
    ; closed_value "logseq.property/status" "logseq.property/status.todo"
    ; closed_value "logseq.property/status" "logseq.property/status.doing"
    ; closed_value "logseq.property/status"
        "logseq.property/status.in-review"
    ; closed_value "logseq.property/status" "logseq.property/status.done"
    ; closed_value "logseq.property/status" "logseq.property/status.canceled"
    ; closed_value "logseq.property.repeat/recur-unit"
        "logseq.property.repeat/recur-unit.day"
    ; closed_value "logseq.property.repeat/repeat-type"
        "logseq.property.repeat/repeat-type.double-plus"
    ; (* block/tags ident entity — cljs update-properties-in-ents wraps the
         value into a [property v opts] tuple for validation; ident must
         redeclare its schema or the install wipes the attr spec *)
      ref_attr "block/tags"
    ]


let create_pipeline_conn () : conn =
  let conn = create_conn_bare () in
  ignore (Datascript.transact_conn conn initial_data_ops);
  (* sqlite-util/kv — cljs initial data marks the graph as db-based *)
  ignore
    (Datascript.transact_conn conn
       [ Datascript.Entity
           { db_id = None
           ; attrs =
               [ "db/ident", One_value (Keyword "logseq.kv/db-type")
               ; "kv/value", One_value (String "db")
               ]
           }
       ]);
  conn

(* create-conn-with-blocks on the pipeline fixture *)
let create_pipeline_conn_with_blocks ?(options = default_options)
    ?(properties = []) ?(classes = []) ?(pages_and_blocks = [])
    ?(pre_txs : (string * edn) list list = []) () : conn =
  let options = { options with properties; classes; pages_and_blocks } in
  let init_tx, block_props_tx = build_blocks_tx options in
  let conn = create_pipeline_conn () in
  if pre_txs <> [] then transact_maps conn pre_txs;
  transact_maps conn init_tx;
  if block_props_tx <> [] then transact_maps conn block_props_tx;
  conn
