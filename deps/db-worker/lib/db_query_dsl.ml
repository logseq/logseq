(* Faithful port of the worker query-dsl stack:

   - logseq.db.frontend.query-dsl (deps/db/src/logseq/db/frontend/query_dsl.cljs)
     — pre-transform, simplify-query, get-timestamp-property, custom readers
   - frontend.worker.query-dsl (src/main/frontend/worker/query_dsl.cljs)
     — build-query pipeline, parse, query-wrapper, execute-query,
       execute-custom-query
   - logseq.db.frontend.datalog (deps/db/src/logseq/db/frontend/datalog.cljc)
     — find-rules-in-where, query-vec->map, add-to-end-of-query-section
   - logseq.db.frontend.rules (deps/db/src/logseq/db/frontend/rules.cljc)
     — rules, db-query-dsl-rules, rules-dependencies, extract-rules
   - db-property/property? + public-db-attribute-properties
   - db-class/get-structured-children

   Query forms are manipulated as datascript_ocaml query_form trees and
   serialized through Ds_wire.edn_of_query_form; rule sets are kept as
   EDN text and parsed with Datascript.Parser. *)

open Datascript

let kw s = QueryFormKeyword s
let sym s = QueryFormSymbol s
let str s = QueryFormString s
let int n = QueryFormInt n
let list_ xs = QueryFormList xs
let vec_ xs = QueryFormVector xs

(* cljs name for keyword/symbol/string forms *)
let name_of_form = function
  | QueryFormKeyword s | QueryFormSymbol s | QueryFormString s ->
      (* cljs name takes everything after the last '/' *)
      (match String.rindex_opt s '/' with
       | Some i -> String.sub s (i + 1) (String.length s - i - 1)
       | None -> s)
  | _ -> invalid_arg "name of non-named form"

let namespace_of_kw (s : string) : string option =
  match String.rindex_opt s '/' with
  | Some i -> Some (String.sub s 0 i)
  | None -> None

let qualified_kw s = Option.is_some (namespace_of_kw s)

let is_coll = function
  | QueryFormVector _ | QueryFormList _ | QueryFormSet _ | QueryFormMap _ -> true
  | _ -> false

let is_list = function QueryFormList _ -> true | _ -> false
let is_vector = function QueryFormVector _ -> true | _ -> false
let is_seq = is_list

let coll_elems = function
  | QueryFormVector xs | QueryFormList xs | QueryFormSet xs -> xs
  | QueryFormMap kvs -> List.map (fun (k, v) -> vec_ [ k; v ]) kvs
  | _ -> []

let first_elem f = match coll_elems f with x :: _ -> Some x | [] -> None

let sym_named name = function QueryFormSymbol s -> s = name | _ -> false

(* cljs = on sequential collections is type-agnostic (list = vector). *)
let rec form_equal a b =
  match (a, b) with
  | QueryFormNil, QueryFormNil -> true
  | QueryFormBool x, QueryFormBool y -> x = y
  | QueryFormInt x, QueryFormInt y -> x = y
  | QueryFormFloat x, QueryFormFloat y -> x = y
  | QueryFormString x, QueryFormString y -> x = y
  | QueryFormKeyword x, QueryFormKeyword y -> x = y
  | QueryFormSymbol x, QueryFormSymbol y -> x = y
  | (QueryFormVector x, QueryFormVector y) | (QueryFormList x, QueryFormList y)
  | (QueryFormVector x, QueryFormList y) | (QueryFormList x, QueryFormVector y)
    -> List.length x = List.length y && List.for_all2 form_equal x y
  | QueryFormSet x, QueryFormSet y ->
      List.length x = List.length y
      && List.for_all (fun e -> List.exists (form_equal e) y) x
  | QueryFormTagged (t1, x), QueryFormTagged (t2, y) -> t1 = t2 && form_equal x y
  | QueryFormMap x, QueryFormMap y ->
      List.length x = List.length y
      && List.for_all2
           (fun (k1, v1) (k2, v2) -> form_equal k1 k2 && form_equal v1 v2)
           x y
  | _ -> false

let distinct_preserve_order xs =
  List.fold_left
    (fun acc x -> if List.exists (form_equal x) acc then acc else acc @ [ x ])
    [] xs

(* cljs flatten — recursively yield non-coll leaves (maps flatten to their
   k/v pairs). *)
let rec flatten f =
  match f with
  | QueryFormVector xs | QueryFormList xs | QueryFormSet xs ->
      List.concat_map flatten xs
  | QueryFormMap kvs -> List.concat_map (fun (k, v) -> flatten k @ flatten v) kvs
  | QueryFormTagged (t, f') -> flatten (QueryFormTagged (t, f'))
  | leaf -> [ leaf ]

let lvar_name = function
  | QueryFormSymbol s when String.length s > 0 && s.[0] = '?' -> Some s
  | _ -> None

(* cljs postwalk over query_form: children first, then the fn. *)
let rec postwalk fn form =
  let form' =
    match form with
    | QueryFormVector xs -> vec_ (List.map (postwalk fn) xs)
    | QueryFormList xs -> list_ (List.map (postwalk fn) xs)
    | QueryFormSet xs -> QueryFormSet (List.map (postwalk fn) xs)
    | QueryFormMap kvs ->
        QueryFormMap (List.map (fun (k, v) -> (postwalk fn k, postwalk fn v)) kvs)
    | QueryFormTagged (t, f') -> QueryFormTagged (t, postwalk fn f')
    | leaf -> leaf
  in
  fn form'

(* ============ logseq.db.frontend.rules tables ============ *)

(* rules map — keep as EDN text per entry; the cljs vals are either a
   single rule form [(head) clause...] or a vector of rule forms. *)
let rules_base =
  [
    ( "parent",
      {|
[[(parent ?p ?c)
  [?c :block/parent ?p]]
 [(parent ?p ?c)
  [?t :block/parent ?p]
  (parent ?t ?c)]]|} );
    ( "class-extends",
      {|
[[(class-extends ?p ?c)
  [?c :logseq.property.class/extends ?p]]
 [(class-extends ?p ?c)
  [?t :logseq.property.class/extends ?p]
  (class-extends ?t ?c)]]|} );
    ( "alias",
      {|
[[(alias ?e2 ?e1)
  [?e2 :block/alias ?e1]]
 [(alias ?e2 ?e1)
  [?e1 :block/alias ?e2]]]|} );
    ( "self-ref",
      {|
[(self-ref ?b ?ref)
 [?b :block/refs ?ref]]|} );
    ( "has-ref",
      {|
[[(has-ref ?b ?r)
  [?b :block/refs ?r]]
 [(has-ref ?b ?r)
  (parent ?p ?b)
  [?p :block/refs ?r]]]|} );
  ]

(* db-query-dsl-rules — merge of rules + the dsl rules *)
let db_query_dsl_rules =
  rules_base
  @ [
      ( "page-ref",
        {|
[(page-ref ?b ?ref)
 (has-ref ?b ?ref)]|} );
      ( "block-content",
        {|
[(block-content ?b ?query)
 [?b :block/title ?content]
 [(clojure.string/includes? ?content ?query)]]|} );
      ( "page",
        {|
[(page ?b ?page-name)
 [?b :block/page ?bp]
 [?bp :block/name ?page-name]]|} );
      ( "between",
        {|
[(between ?b ?start ?end)
 [?b :block/page ?p]
 [?p :block/tags :logseq.class/Journal]
 [?p :block/journal-day ?d]
 [(>= ?d ?start)]
 [(<= ?d ?end)]]|} );
      ( "ref->val",
        {|
[[(ref->val ?pv ?val)
  [?pv :block/title ?val]]
 [(ref->val ?pv ?val)
  [?pv :logseq.property/value ?val]]]|} );
      ( "property-missing-value",
        {|
[(property-missing-value ?b ?prop-e ?default-p ?default-v)
 [?t :logseq.property.class/properties ?prop-e]
 [?prop-e :db/ident ?prop]
 (object-has-class-property? ?b ?prop)
 [(get-else $ ?b ?prop "N/A") ?prop-v]
 [(= ?prop-v "N/A")]
 [?prop-e ?default-p ?default-v]]|} );
      ( "scalar-property-value",
        {|
[[(scalar-property-value ?b ?prop-e ?val)
  [?prop-e :db/ident ?prop]
  [?b ?prop ?val]]]|} );
      ( "scalar-property-value-with-default",
        {|
[[(scalar-property-value-with-default ?b ?prop-e ?val)
  (scalar-property-value ?b ?prop-e ?val)]

 [(scalar-property-value-with-default ?b ?prop-e ?val)
  (property-missing-value ?b ?prop-e :logseq.property/scalar-default-value ?val)]]|}
      );
      ( "ref-property-value",
        {|
[[(ref-property-value ?b ?prop-e ?val)
  [?prop-e :db/ident ?prop]
  [?b ?prop ?pv]
  (ref->val ?pv ?val)]]|} );
      ( "ref-property-value-with-default",
        {|
[[(ref-property-value-with-default ?b ?prop-e ?val)
  (ref-property-value ?b ?prop-e ?val)]
 [(ref-property-value-with-default ?b ?prop-e ?val)
  (property-missing-value ?b ?prop-e :logseq.property/default-value ?pv)
  (ref->val ?pv ?val)]]|} );
      ( "object-has-class-property",
        {|
[(object-has-class-property? ?b ?prop)
 [?prop-e :db/ident ?prop]
 [?t :logseq.property.class/properties ?prop-e]
 [?b :block/tags ?tc]
 (or
  [(= ?t ?tc)]
  (class-extends ?t ?tc))]|} );
      ( "has-property-or-object-property",
        {|
[(has-property-or-object-property? ?b ?prop)
 [?prop-e :db/ident ?prop]
 (or
  [?b ?prop _]
  (object-has-class-property? ?b ?prop))]|} );
      ( "has-simple-query-property",
        {|
[(has-simple-query-property ?b ?prop)
 [?prop-e :db/ident ?prop]
 [?prop-e :block/tags :logseq.class/Property]
 (has-property-or-object-property? ?b ?prop)
 (or
  [(missing? $ ?prop-e :logseq.property/public?)]
  [?prop-e :logseq.property/public? true])]|} );
      ( "has-private-simple-query-property",
        {|
[(has-private-simple-query-property ?b ?prop)
 [?prop-e :db/ident ?prop]
 [?prop-e :block/tags :logseq.class/Property]
 (has-property-or-object-property? ?b ?prop)]|} );
      ( "has-property",
        {|
[(has-property ?b ?prop)
 [?b ?prop _]
 [?prop-e :db/ident ?prop]
 [?prop-e :block/tags :logseq.class/Property]
 (or
  [(missing? $ ?prop-e :logseq.property/public?)]
  [?prop-e :logseq.property/public? true])]|} );
      ( "scalar-property",
        {|
[(scalar-property ?b ?prop ?val)
 [?prop-e :db/ident ?prop]
 (scalar-property-value ?b ?prop-e ?val)
 (or
  [(missing? $ ?prop-e :logseq.property/public?)]
  [?prop-e :logseq.property/public? true])]|} );
      ( "scalar-property-with-default",
        {|
[(scalar-property-with-default ?b ?prop ?val)
 [?prop-e :db/ident ?prop]
 (scalar-property-value-with-default ?b ?prop-e ?val)
 (or
  [(missing? $ ?prop-e :logseq.property/public?)]
  [?prop-e :logseq.property/public? true])]|} );
      ( "ref-property",
        {|
[(ref-property ?b ?prop ?val)
 [?prop-e :db/ident ?prop]
 (ref-property-value ?b ?prop-e ?val)
 (or
  [(missing? $ ?prop-e :logseq.property/public?)]
  [?prop-e :logseq.property/public? true])]|} );
      ( "ref-property-with-default",
        {|
[(ref-property-with-default ?b ?prop ?val)
 [?prop-e :db/ident ?prop]
 (ref-property-value-with-default ?b ?prop-e ?val)
 (or
  [(missing? $ ?prop-e :logseq.property/public?)]
  [?prop-e :logseq.property/public? true])]|} );
      ( "private-scalar-property",
        {|
[(private-scalar-property ?b ?prop ?val)
 [?prop-e :db/ident ?prop]
 [?prop-e :block/tags :logseq.class/Property]
 (scalar-property-value ?b ?prop-e ?val)]|} );
      ( "private-scalar-property-with-default",
        {|
[(private-scalar-property-with-default ?b ?prop ?val)
 [?prop-e :db/ident ?prop]
 [?prop-e :block/tags :logseq.class/Property]
 (scalar-property-value-with-default ?b ?prop-e ?val)]|} );
      ( "private-ref-property",
        {|
[(private-ref-property ?b ?prop ?val)
 [?prop-e :db/ident ?prop]
 [?prop-e :block/tags :logseq.class/Property]
 (ref-property-value ?b ?prop-e ?val)]|} );
      ( "private-ref-property-with-default",
        {|
[(private-ref-property-with-default ?b ?prop ?val)
 [?prop-e :db/ident ?prop]
 [?prop-e :block/tags :logseq.class/Property]
 (ref-property-value-with-default ?b ?prop-e ?val)]|} );
      ( "property",
        {|
[(property ?b ?prop ?val)
 [?prop-e :db/ident ?prop]
 [?prop-e :block/tags :logseq.class/Property]
 (or
  [(missing? $ ?prop-e :logseq.property/public?)]
  [?prop-e :logseq.property/public? true])
 [?b ?prop ?pv]
 (or
  (and
   [(missing? $ ?prop-e :db/valueType)]
   [?b ?prop ?val])
  (and
   [?prop-e :db/valueType :db.type/ref]
   (or [?pv :block/title ?val]
       [?pv :logseq.property/value ?val])))]|} );
      ( "tags",
        {|
[[(tag-spec->tag ?tag ?spec)
  [(number? ?spec)]
  [(identity ?spec) ?tag]]

 [(tag-spec->tag ?tag ?spec)
  [?tag :block/title ?spec]]

 [(tag-spec->tag ?tag ?spec)
  [?tag :db/ident ?spec]]

 [(tags ?b ?tags)
  [(identity ?tags) [?spec ...]]
  (tag-spec->tag ?tag ?spec)
  [?b :block/tags ?tc]
  (or
   [(= ?tag ?tc)]
   (class-extends ?tag ?tc))
  [(missing? $ ?b :block/link)]]]|} );
      ( "task",
        {|
[(task ?b ?statuses)
 (ref-property-with-default ?b :logseq.property/status ?val)
 [(contains? ?statuses ?val)]]|} );
      ( "priority",
        {|
[(priority ?b ?priorities)
 (ref-property-with-default ?b :logseq.property/status ?priority)
 [(contains? ?priorities ?priority)]]|} );
    ]

let rules_dependencies =
  [
    ("has-ref", [ "parent" ]);
    ("page-ref", [ "has-ref" ]);
    ("task", [ "ref-property-with-default" ]);
    ("priority", [ "ref-property-with-default" ]);
    ("tags", [ "class-extends" ]);
    ("has-property-or-object-property", [ "object-has-class-property" ]);
    ("object-has-class-property", [ "class-extends" ]);
    ("has-simple-query-property", [ "has-property-or-object-property" ]);
    ("has-private-simple-query-property", [ "has-property-or-object-property" ]);
    ("property-missing-value", [ "object-has-class-property" ]);
    ("ref-property-value", [ "ref->val" ]);
    ("scalar-property", [ "scalar-property-value" ]);
    ( "scalar-property-with-default",
      [ "scalar-property-value-with-default" ] );
    ( "scalar-property-value-with-default",
      [ "scalar-property-value"; "property-missing-value" ] );
    ("ref-property", [ "ref-property-value" ]);
    ( "ref-property-value-with-default",
      [ "ref-property-value"; "property-missing-value" ] );
    ("ref-property-with-default", [ "ref-property-value-with-default" ]);
    ("private-scalar-property", [ "scalar-property-value" ]);
    ( "private-scalar-property-with-default",
      [ "scalar-property-value-with-default" ] );
    ("private-ref-property", [ "ref-property-value" ]);
    ( "private-ref-property-with-default",
      [ "ref-property-value-with-default" ] );
  ]

(* rules/get-full-deps — transitive closure over rules-dependencies;
   returns rule names incl. the input ones, deduped preserving
   first-seen order (cljs uses a set — order unspecified there). *)
let get_full_deps names =
  (* result must include the input rules themselves *)
  let rec go deps' result =
    match deps' with
    | [] -> result
    | _ ->
        let result' = result @ List.filter (fun d -> not (List.mem d result)) deps' in
        let next =
          List.concat_map
            (fun d -> Option.value (List.assoc_opt d rules_dependencies) ~default:[])
            deps'
        in
        go next result'
  in
  go names []

(* rules/extract-rules — the EDN of each rule entry; a vector whose first
   element is a vector holds multiple rule clauses. Returns a list of
   rule forms (each a vector [(head) clauses...]). *)
let extract_rules names : query_form list =
  let names = get_full_deps names in
  List.concat_map
    (fun name ->
      match List.assoc_opt name db_query_dsl_rules with
      | None -> [ QueryFormNil ] (* cljs: (rules-m %) -> nil -> [nil] *)
      | Some edn ->
          (match Parser.read_edn edn with
           | QueryFormVector (QueryFormVector _ :: _ as rules) -> rules
           | QueryFormList (QueryFormVector _ :: _ as rules) -> rules
           | rule -> [ rule ]))
    names

let parse_rules_input (rules : query_form list) : query_arg =
  let edn = "[" ^ String.concat " " (List.map Ds_wire.edn_of_query_form rules) ^ "]" in
  Arg_rules (Parser.parse_rules (Parser.read_edn edn))

(* ============ logseq.db.frontend.datalog ============ *)

(* find-rules-in-where *)
let find_rules_in_where (where : query_form list) (valid : string list) : string list =
  flatten (vec_ where)
  |> List.filter_map (function
         | QueryFormSymbol s when List.mem s valid -> Some s
         | _ -> None)
  |> List.fold_left (fun acc x -> if List.mem x acc then acc else acc @ [ x ]) []

(* query-vec->map — ordered assoc map: key = section keyword name (or ""
   for the leading group), value = that section's forms. *)
let query_vec_to_map (q : query_form list) : (string * query_form list) list =
  let rec go acc cur forms =
    match forms with
    | [] -> acc
    | QueryFormKeyword k :: rest -> go acc (Some k) rest
    | f :: rest ->
        let key = match cur with Some k -> k | None -> "" in
        let acc =
          match List.assoc_opt key acc with
          | Some _ ->
              List.map (fun (k, v) -> if k = key then (k, v @ [ f ]) else (k, v)) acc
          | None -> acc @ [ (key, [ f ]) ]
        in
        go acc cur rest
  in
  go [] None q

(* Ordered section keys incl. the leading nil group. *)
let query_map_sections (q : query_form list) : (string option * query_form list) list =
  let rec go acc cur forms =
    match forms with
    | [] -> acc
    | QueryFormKeyword k :: rest ->
        let cur' = Some k in
        if List.exists (fun (k', _) -> k' = cur') acc then go acc cur' rest
        else go (acc @ [ (cur', []) ]) cur' rest
    | f :: rest ->
        let acc =
          match List.assoc_opt cur acc with
          | Some _ ->
              List.map
                (fun (k, v) -> if k = cur then (k, v @ [ f ]) else (k, v))
                acc
          | None -> acc @ [ (cur, [ f ]) ]
        in
        go acc cur rest
  in
  go [] None q

(* add-to-end-of-query-section — cljs concats [k] (nil for the leading
   group) into the rebuilt vector *)
let add_to_end_of_query_section (q : query_form list) (query_kw : string)
    (elems : query_form list) : query_form list =
  let sections = query_map_sections q in
  List.concat_map
    (fun (k, v) ->
      let key_el =
        match k with Some name -> [ kw name ] | None -> [ QueryFormNil ]
      in
      key_el @ v @ (match k with Some name when name = query_kw -> elems | _ -> []))
    sections

(* ============ db-property helpers ============ *)

let logseq_property_namespaces =
  [ "logseq.property"; "logseq.property.tldraw"; "logseq.property.pdf";
    "logseq.property.fsrs"; "logseq.property.linked-references";
    "logseq.property.asset"; "logseq.property.table"; "logseq.property.node";
    "logseq.property.code"; "logseq.property.repeat";
    "logseq.property.journal"; "logseq.property.class"; "logseq.property.view";
    "logseq.property.user"; "logseq.property.history";
    "logseq.property.reaction"; "logseq.property.sync"; "logseq.property.publish";
    "logseq.property.recycle"; "logseq.property.comments"; "logseq.property.agent" ]

let public_db_attribute_properties = [ "block/alias"; "block/tags" ]

let user_property_namespace (s : string) =
  let rec contains i =
    i + 10 <= String.length s
    && (String.sub s i 10 = ".property" || contains (i + 1))
  in
  contains 0

(* db-property/property? *)
let property_kw (k : string) : bool =
  match namespace_of_kw k with
  | None -> false
  | Some ns ->
      List.mem ns logseq_property_namespaces
      || user_property_namespace ns
      || List.mem k public_db_attribute_properties

(* shared-query-dsl/get-timestamp-property *)
let get_timestamp_property (form : query_form) : string option =
  match coll_elems form with
  | _ :: property_name :: _ ->
      (match property_name with
       | QueryFormKeyword _ | QueryFormSymbol _ | QueryFormString _ ->
           let p =
             name_of_form property_name
             |> String.lowercase_ascii
             |> String.map (fun c -> if c = '_' then '-' else c)
           in
           if property_kw p then Some p
           else (match p with
                 | "created-at" -> Some "block/created-at"
                 | "updated-at" -> Some "block/updated-at"
                 | _ -> None)
       | _ -> None)
  | _ -> None

(* ============ logseq.db.frontend.query-dsl: pre-transform ============ *)

let tag_placeholder = "~~~tag-placeholder~~~"

let wrapped_by_quotes s =
  let n = String.length s in
  n >= 2 && s.[0] = '"' && s.[n - 1] = '"'

(* Step 1: #"\"(?:\\.|[^\"\\])*\"|\[\[(.*?)\]\]" — walk s; keep
   double-quoted spans verbatim (with escapes); rewrite each [[inner]]
   to a quoted "[[" inner-with-placeholder "]]". *)
let quote_page_refs (s : string) : string =
  let n = String.length s in
  let b = Buffer.create (n + 16) in
  let rec loop i =
    if i < n then
      if s.[i] = '"' then begin
        (* copy the string literal including escapes *)
        Buffer.add_char b '"';
        let rec str j =
          if j >= n then n
          else if s.[j] = '\\' && j + 1 < n then begin
            Buffer.add_char b s.[j];
            Buffer.add_char b s.[j + 1];
            str (j + 2)
          end
          else if s.[j] = '"' then begin
            Buffer.add_char b '"';
            j + 1
          end
          else begin
            Buffer.add_char b s.[j];
            str (j + 1)
          end
        in
        loop (str (i + 1))
      end
      else if i + 1 < n && s.[i] = '[' && s.[i + 1] = '[' then
        (* non-greedy inner: earliest "]]" *)
        let rec find j =
          if j + 1 >= n then None
          else if s.[j] = ']' && s.[j + 1] = ']' then Some j
          else find (j + 1)
        in
        match find (i + 2) with
        | Some j ->
            let inner = String.sub s (i + 2) (j - i - 2) in
            let inner' =
              String.concat tag_placeholder (String.split_on_char '#' inner)
            in
            Buffer.add_string b "\"[[";
            Buffer.add_string b inner';
            Buffer.add_string b "]]\"";
            loop (j + 2)
        | None ->
            Buffer.add_char b s.[i];
            loop (i + 1)
      else begin
        Buffer.add_char b s.[i];
        loop (i + 1)
      end
  in
  loop 0;
  Buffer.contents b

(* Step 2: #"\(between ([^\)]+)\)" — keywordize offset args. *)
let between_rewrite (s : string) : string =
  let n = String.length s in
  let b = Buffer.create (n + 16) in
  let rec loop i =
    if i < n then begin
      if i + 8 <= n && String.sub s i 8 = "(between " then begin
        (* capture [^\)]+ *)
        let j = try String.index_from s (i + 8) ')' with Not_found -> n - 1 in
        let argstr = String.sub s (i + 8) (j - i - 8) in
        let parts =
          String.split_on_char ' ' argstr
          |> List.filter (fun p -> String.trim p <> "")
          |> List.map (fun value ->
                 let firstc = if String.length value > 0 then String.make 1 value.[0] else "" in
                 let starts_offset = firstc = "+" || firstc = "-" in
                 let first_digit =
                   String.length value > 0 && value.[0] >= '0' && value.[0] <= '9'
                 in
                 let suffix_match =
                   List.exists
                     (fun suf ->
                       let l = String.length suf in
                       String.length value >= l
                       && String.sub value (String.length value - l) l = suf)
                     [ "y"; "m"; "d"; "h"; "min" ]
                 in
                 if starts_offset || (first_digit && suffix_match) then ":" ^ value
                 else value)
        in
        Buffer.add_string b "(between ";
        Buffer.add_string b (String.concat " " parts);
        Buffer.add_char b ')';
        loop (j + 1)
      end
      else begin
        Buffer.add_char b s.[i];
        loop (i + 1)
      end
    end
  in
  loop 0;
  Buffer.contents b

(* Step 3: #"..."#-spans — replace # with placeholder inside
   quoted strings (simple, no escapes — matching cljs). *)
let placeholder_hashes_in_strings (s : string) : string =
  let n = String.length s in
  let b = Buffer.create n in
  let rec loop i =
    if i < n then
      if s.[i] = '"' then begin
        let j = try Some (String.index_from s (i + 1) '"') with Not_found -> None in
        match j with
        | Some j when j > i + 1 ->
            Buffer.add_char b '"';
            for k = i + 1 to j - 1 do
              if s.[k] = '#' then Buffer.add_string b tag_placeholder
              else Buffer.add_char b s.[k]
            done;
            Buffer.add_char b '"';
            loop (j + 1)
        | _ ->
            Buffer.add_char b s.[i];
            loop (i + 1)
      end
      else begin
        Buffer.add_char b s.[i];
        loop (i + 1)
      end
  in
  loop 0;
  Buffer.contents b

let replace_all s ~pattern ~replacement =
  let n = String.length s and l = String.length pattern in
  if l = 0 then s
  else
    let b = Buffer.create n in
    let rec loop i =
      if i + l <= n && String.sub s i l = pattern then begin
        Buffer.add_string b replacement;
        loop (i + l)
      end
      else if i < n then begin
        Buffer.add_char b s.[i];
        loop (i + 1)
      end
    in
    loop 0;
    Buffer.contents b

(* shared-query-dsl/pre-transform *)
let pre_transform (s : string) : string =
  if wrapped_by_quotes s then s
  else
    s
    |> quote_page_refs
    |> between_rewrite
    |> placeholder_hashes_in_strings
    |> replace_all ~pattern:" #" ~replacement:" #tag "
    |> (fun s ->
        if String.length s > 0 && s.[0] = '#' then "#tag " ^ String.sub s 1 (String.length s - 1)
        else s)
    |> replace_all ~pattern:tag_placeholder ~replacement:"#"

(* shared-query-dsl/simplify-query — postwalk: (and x)/(or x) -> x *)
let simplify_query form =
  postwalk
    (fun f ->
      match f with
      | (QueryFormList [ head; x' ] | QueryFormVector [ head; x' ])
          when sym_named "and" head || sym_named "or" head ->
          x'
      | f -> f)
    form

(* cljs reader custom-readers: #tag x -> ->page-ref x *)
let apply_custom_readers form =
  match form with
  | QueryFormTagged ("tag", f) ->
      let name =
        match f with
        | QueryFormSymbol s -> s
        | other -> Ds_wire.edn_of_query_form other
      in
      str (Page_ref.to_page_ref name)
  | f -> f

(* ============ time helpers (worker query_dsl) ============ *)

let journal_title_formatters =
  Date_time_util.journal_title_formatters None

let valid_journal_title = Date_time_util.valid_journal_title
let journal_title_to_int t = Date_time_util.journal_title_to_int ~formatters:journal_title_formatters t
let journal_title_to_long t = Date_time_util.parse_journal_title ~formatters:journal_title_formatters t

(* journal-name — default-journal-title-formatter "MMM do, yyyy" *)
let journal_name (ms : int64) : string =
  let day = Date_time_util.date_to_int ms in
  Ldb.journal_title_of_day day "MMM do, yyyy"

(* current-time — "h:mm a" *)
let current_time () : string =
  let c = Date_time.of_epoch_ms (Int64.of_float (Clock.now_ms ())) in
  let h12 = match c.Date_time.hour mod 12 with 0 -> 12 | h -> h in
  Printf.sprintf "%d:%02d %s" h12 c.minute (if c.hour < 12 then "AM" else "PM")

let variable_rules ~current_page_title ~today_day =
  let today_date =
    match today_day with
    | Some day -> Date_time_util.int_to_local_ms day
    | None -> Date_time_util.today_ms ()
  in
  let today = journal_name today_date in
  [ ("today", Page_ref.to_page_ref today);
    ("yesterday",
     Page_ref.to_page_ref
       (journal_name (Date_time_util.minus Days 1 today_date)));
    ("tomorrow",
     Page_ref.to_page_ref
       (journal_name (Date_time_util.plus Days 1 today_date)));
    ("time", current_time ());
    ( "current page",
      Page_ref.to_page_ref
        (match current_page_title with Some t -> t | None -> today) ) ]

(* chrono-node is a JS-only npm dep — deferred: always None, so the cljs
   `if-let` falls through to returning the raw match text. *)
let nld_parse (_ : string) : int64 option = None

(* resolve-dynamic-template — #<%([^%].*?)%> replace-all *)
let resolve_dynamic_template (content : string) ~current_page_title ~today_day : string =
  let rules = lazy (variable_rules ~current_page_title ~today_day) in
  let n = String.length content in
  let b = Buffer.create n in
  let rec loop i =
    if i < n then begin
      if i + 2 < n && content.[i] = '<' && content.[i + 1] = '%'
         && content.[i + 2] <> '%' then begin
        (* lazy .*? up to first "%>" *)
        let rec find j =
          if j + 1 >= n then None
          else if content.[j] = '%' && content.[j + 1] = '>' then Some j
          else find (j + 1)
        in
        match find (i + 3) with
        | Some j ->
            let matched = String.trim (String.sub content (i + 2) (j - i - 2)) in
            let key = String.lowercase_ascii matched in
            let rep =
              if matched = "" then ""
              else
                match List.assoc_opt key (Lazy.force rules) with
                | Some r -> r
                | None ->
                    (match nld_parse matched with
                     | Some d -> Page_ref.to_page_ref (journal_name d)
                     | None -> matched)
            in
            Buffer.add_string b rep;
            loop (j + 2)
        | None ->
            Buffer.add_char b content.[i];
            loop (i + 1)
      end
      else begin
        Buffer.add_char b content.[i];
        loop (i + 1)
      end
    end
  in
  loop 0;
  Buffer.contents b

(* ->journal-day-int / ->timestamp — inputs are keyword/symbol/string forms *)

let to_journal_day_int (input : query_form) : int option =
  let input = String.lowercase_ascii (name_of_form input) in
  match input with
  | "today" -> Some (Date_time_util.date_to_int (Date_time_util.today_ms ()))
  | "yesterday" ->
      Some
        (Date_time_util.date_to_int
           (Date_time_util.minus Days 1 (Date_time_util.today_ms ())))
  | "tomorrow" ->
      Some
        (Date_time_util.date_to_int
           (Date_time_util.plus Days 1 (Date_time_util.today_ms ())))
  | _ when Page_ref.is_page_ref input ->
      let name =
        match Page_ref.get_page_name input with
        | Some n -> n
        | None -> input
      in
      let name =
        String.concat "" (String.split_on_char ':' name)
        |> Date_time_util.capitalize_all
      in
      if valid_journal_title ~formatters:journal_title_formatters name then
        journal_title_to_int name
      else None
  | _ ->
      let len = String.length input in
      if len < 1 then None
      else
        (match int_of_string_opt (String.sub input 0 (len - 1)) with
         | Some duration ->
             let kind = input.[len - 1] in
             let p =
               match kind with
               | 'y' -> Date_time_util.Years
               | 'm' -> Date_time_util.Months
               | 'w' -> Date_time_util.Weeks
               | _ -> Date_time_util.Days
             in
             Some
               (Date_time_util.date_to_int
                  (Date_time_util.plus p duration (Date_time_util.today_ms ())))
         | None -> None)

let to_timestamp (input : query_form) : int64 option =
  let input = String.lowercase_ascii (name_of_form input) in
  match input with
  | "now" -> Some (Date_time_util.time_ms ())
  | "today" -> Some (Date_time_util.today_ms ())
  | "yesterday" -> Some (Date_time_util.minus Days 1 (Date_time_util.today_ms ()))
  | "tomorrow" -> Some (Date_time_util.plus Days 1 (Date_time_util.today_ms ()))
  | _ when Page_ref.is_page_ref input ->
      let name =
        match Page_ref.get_page_name input with
        | Some n -> n
        | None -> input
      in
      let name =
        String.concat "" (String.split_on_char ':' name)
        |> Date_time_util.capitalize_all
      in
      if valid_journal_title ~formatters:journal_title_formatters name then
        journal_title_to_long name
      else None
  | _ ->
      let len = String.length input in
      if len < 1 then None
      else
        (match int_of_string_opt (String.sub input 0 (len - 1)) with
         | Some duration ->
             let p =
               match input.[len - 1] with
               | 'y' -> Date_time_util.Years
               | 'm' -> Date_time_util.Months
               | 'w' -> Date_time_util.Weeks
               | 'h' -> Date_time_util.Hours
               | 'n' -> Date_time_util.Minutes
               | _ -> Date_time_util.Days
             in
             Some (Date_time_util.plus p duration (Date_time_util.time_ms ()))
         | None -> None)

(* cljs str of a number: integral doubles print without decimal point *)
let str_of_number = function
  | Int n -> string_of_int n
  | Float f ->
      if Float.is_integer f then Int64.to_string (Int64.of_float f)
      else Printf.sprintf "%g" f
  | _ -> assert false

(* ============ build-query ============ *)

type env =
  { db : db
  ; form : query_form
  ; mutable blocks : bool
  ; mutable sample : int option
  ; vars : (string, unit) Hashtbl.t
  ; private_property : bool
  }

type built = { bquery : query_form; brules : string list }

(* collect-vars — all ?-prefixed symbols anywhere in the form *)
let collect_vars form : string list =
  let vars = Hashtbl.create 8 in
  ignore
    (postwalk
       (fun f ->
         (match lvar_name f with Some v -> Hashtbl.replace vars v () | None -> ());
         f)
       form);
  Hashtbl.fold (fun k () acc -> k :: acc) vars []

let not_clause = function
  | QueryFormList (QueryFormSymbol "not" :: _) -> true
  | _ -> false

let build_and_or_not_result (fe : string) (clauses : query_form list)
    (current_filter : string option) (nested_and : bool) : query_form =
  match fe with
  | "not" ->
      if List.for_all is_list clauses then list_ (sym "not" :: clauses)
      else
        let clauses =
          match clauses with
          | first :: _ when is_coll first -> List.concat_map coll_elems clauses
          | _ -> clauses
        in
        let clauses =
          match clauses with
          | [ QueryFormList (QueryFormSymbol "and" :: inner) ] -> inner
          | _ -> clauses
        in
        list_ (sym "not" :: clauses)
  | _ ->
      (match clauses with
       | first :: _ when is_coll first ->
           if current_filter = Some "not" || current_filter = Some "or" || nested_and
           then list_ (sym "and" :: clauses)
           else
             list_
               (sym fe
                :: List.concat_map
                     (fun result ->
                       if is_list result then [ result ]
                       else if is_vector result then coll_elems result
                       else [ list_ (sym "and" :: coll_elems result) ])
                     clauses)
       | _ -> list_ (sym fe :: clauses))

(* db-based between helpers *)

let build_journal_between_two_arg (e : query_form) : built option =
  match coll_elems e with
  | [ _; a; b ] ->
      let start = to_journal_day_int a and stop = to_journal_day_int b in
      let to_form = function Some n -> int n | None -> QueryFormNil in
      let s, e' = (to_form start, to_form stop) in
      let s, e' =
        match (s, e') with
        | QueryFormInt x, QueryFormInt y when x > y -> (e', s)
        | _ -> (s, e')
      in
      Some { bquery = list_ [ sym "between"; sym "?b"; s; e' ]; brules = [ "between" ] }
  | _ -> None

let db_based_build_between_three_arg (e : query_form) : built option =
  match get_timestamp_property e with
  | Some k ->
      (match coll_elems e with
       | [ _; _; a; b ] ->
           (match (to_timestamp a, to_timestamp b) with
            | Some start, Some stop ->
                let start, stop = if Int64.compare start stop > 0 then (stop, start) else (start, stop) in
                Some
                  { bquery =
                      vec_
                        [
                          vec_ [ sym "?b"; kw k; sym "?v" ];
                          vec_
                            [ list_
                                [ sym ">="; sym "?v"
                                ; QueryFormTagged ("inst", QueryFormString (Ds_wire.iso_of_ms start)) ] ];
                          vec_
                            [ list_
                                [ sym "<"; sym "?v"
                                ; QueryFormTagged ("inst", QueryFormString (Ds_wire.iso_of_ms stop)) ] ];
                        ];
                    brules = [] }
            | _ -> None)
       | _ -> None)
  | None -> None

let db_based_build_between_two_arg (e : query_form) : built option =
  match coll_elems e with
  | [ a; b; c ] -> db_based_build_between_three_arg (vec_ [ a; b; c; sym "now" ])
  | _ -> None

let build_between (e : query_form) : built option =
  match List.length (coll_elems e) with
  | 3 ->
      (match get_timestamp_property e with
       | Some _ -> db_based_build_between_two_arg e
       | None -> build_journal_between_two_arg e)
  | 4 -> db_based_build_between_three_arg e
  | _ -> None

(* db-class/get-structured-children — class-extends closure minus self *)
let get_structured_children (db : db) (eid : entity_id) : entity_id list =
  let rules_edn =
    "["
    ^ String.concat " "
        [ "[(class-extends ?p ?c) [?c :logseq.property.class/extends ?p]]";
          "[(class-extends ?p ?c) [?t :logseq.property.class/extends ?p] (class-extends ?t ?c)]" ]
    ^ "]"
  in
  let rows =
    Datascript.q_string db
      "[:find [?c ...] :in $ ?p % :where (class-extends ?p ?c)]"
      ~inputs:
        [ Arg_scalar (Result_entity eid);
          Arg_rules (Parser.parse_rules (Parser.read_edn rules_edn)) ]
  in
  List.filter_map
    (fun row ->
      match row with
      | [ Result_entity c ] when c <> eid -> Some c
      | _ -> None)
    rows

(* ldb/page-exists? — the cljs version returns the seq of page ids;
   private copy returning ids (Ldb.page_exists returns a bool). *)
let page_exists_ids (db : db) (page_name : string) (tag_idents : string list) : entity_id list =
  let check_tags (d : datom) : bool =
    match Ldb.ent_of_id db d.e with
    | None -> false
    | Some e ->
        List.exists
          (fun tid ->
            match Ldb.ent_of_id db tid with
            | Some t ->
                (match Ldb.ident_of t with
                 | Some ident -> List.mem ident tag_idents
                 | None -> false)
            | None -> false)
          (Entity_refs.ref_ids e "block/tags")
  in
  if
    tag_idents <> []
    && List.for_all
         (fun t -> t = "logseq.class/Tag" || t = "logseq.class/Property")
         tag_idents
  then
    datoms db Avet ~a:"block/title" ~v:(String page_name) ()
    |> List.of_seq |> List.filter check_tags |> List.map (fun d -> d.e)
  else
    datoms db Avet ~a:"block/name" ~v:(String (Ldb.page_name_sanity_lc page_name)) ()
    |> List.of_seq |> List.filter check_tags |> List.map (fun d -> d.e)

(* ->db-property-value *)
let db_property_value (db : db) (k : string) (v : query_form) : query_form =
  let v' =
    match v with
    | QueryFormSymbol s -> str s
    | other -> other
  in
  match v' with
  | QueryFormString s ->
      if String.length s > 0 && s.[0] = '#' then
        str (String.sub s 1 (String.length s - 1))
      else
        (match Page_ref.get_page_name s with
         | Some name -> str name
         | None -> v')
  | (QueryFormInt _ | QueryFormFloat _) as v'' ->
      (* cljs double? covers all numbers; :node type -> str *)
      let is_node =
        match entity db (Ident k) with
        | Some prop ->
            (match Ldb.value prop "logseq.property/type" with
             | Some (Keyword "node") -> true
             | _ -> false)
        | None -> false
      in
      if is_node then
        match v'' with
        | QueryFormInt n -> str (string_of_int n)
        | QueryFormFloat f -> str (str_of_number (Float f))
        | _ -> assert false
      else v''
  | _ -> v'

(* ->db-keyword-property — title lookup for unqualified names *)
let no_property_found = "frontend.worker.query-dsl/no-property-found"

let db_keyword_property (db : db) (property_name : query_form) : string =
  match property_name with
  | QueryFormKeyword k when qualified_kw k -> k
  | _ ->
      let title = name_of_form property_name in
      let found =
        datoms db Avet ~a:"block/title" ~v:(String title) ()
        |> List.of_seq
        |> List.find_map (fun (d : datom) ->
               match Ldb.ent_of_id db d.e with
               | Some e when Entity_refs.has_tag e "logseq.class/Property" -> Ldb.ident_of e
               | _ -> None)
      in
      (match found with Some ident -> ident | None -> no_property_found)

let value_of_form (f : query_form) : value option =
  match f with
  | QueryFormInt n -> Some (Int n)
  | QueryFormFloat x -> Some (Float x)
  | QueryFormString s -> Some (String s)
  | QueryFormBool b -> Some (Bool b)
  | QueryFormKeyword k -> Some (Keyword k)
  | QueryFormNil -> Some Nil
  | _ -> None

let build_property_two_arg (db : db) (e : query_form) (private_property : bool) : built =
  match coll_elems e with
  | [ _; prop_name; v ] ->
      let k = db_keyword_property db prop_name in
      let v' = db_property_value db k v in
      let property =
        if qualified_kw k then entity db (Ident k) else None
      in
      let ref_type =
        match property with
        | Some p ->
            (match Ldb.value p "db/valueType" with
             | Some (Keyword "db.type/ref") -> true
             | _ -> false)
        | None -> false
      in
      let default_value : value option =
        if ref_type then
          match property with
          | Some p ->
              (match Entity_refs.ref_ent p "logseq.property/default-value" with
               | Some dv ->
                   (match Ldb.value dv "block/title" with
                    | Some t -> Some t
                    | None -> Ldb.value dv "logseq.property/value")
               | None -> None)
          | None -> None
        else
          match property with
          | Some p -> Ldb.value p "logseq.property/scalar-default-value"
          | None -> None
      in
      let default_value' =
        match value_of_form v' with
        | Some vv ->
            (match default_value with Some dv -> dv = vv | None -> false)
        | None -> false
      in
      let rule =
        if private_property then
          if ref_type && default_value' then "private-ref-property-with-default"
          else if ref_type then "private-ref-property"
          else if default_value' then "private-scalar-property-with-default"
          else "private-scalar-property"
        else if ref_type && default_value' then "ref-property-with-default"
        else if ref_type then "ref-property"
        else if default_value' then "scalar-property-with-default"
        else "scalar-property"
      in
      { bquery = list_ [ sym rule; sym "?b"; kw k; v' ]; brules = [ rule ] }
  | _ -> invalid_arg "build-property-two-arg expects 3 elements"

let build_property_one_arg (db : db) (e : query_form) (private_property : bool) : built =
  match coll_elems e with
  | [ _; prop_name ] ->
      let k = db_keyword_property db prop_name in
      if private_property then
        { bquery = list_ [ sym "has-private-simple-query-property"; sym "?b"; kw k ];
          brules = [ "has-private-simple-query-property" ] }
      else
        { bquery = list_ [ sym "has-simple-query-property"; sym "?b"; kw k ];
          brules = [ "has-simple-query-property" ] }
  | _ -> invalid_arg "build-property-one-arg expects 2 elements"

let build_property (db : db) (e : query_form) (env : env) : built option =
  match List.length (coll_elems e) with
  | 3 -> Some (build_property_two_arg db e env.private_property)
  | 2 -> Some (build_property_one_arg db e env.private_property)
  | _ -> None

let build_task (e : query_form) : built option =
  match coll_elems e with
  | _ :: rest ->
      let markers =
        match rest with
        | [ first ] when is_coll first -> coll_elems first
        | _ -> rest
      in
      (match markers with
       | [] -> None
       | _ ->
           let marker_set =
             markers
             |> List.map (fun m -> Date_time_util.capitalize_all (name_of_form m))
             |> List.sort_uniq compare
             |> List.map str
           in
           Some
             { bquery = list_ [ sym "task"; sym "?b"; QueryFormSet marker_set ];
               brules = [ "task" ] })
  | _ -> None

let build_priority (e : query_form) : built option =
  match coll_elems e with
  | _ :: rest ->
      let priorities =
        match rest with
        | [ first ] when is_coll first -> coll_elems first
        | _ -> rest
      in
      (match priorities with
       | [] -> None
       | _ ->
           let prios =
             priorities
             |> List.map (fun p ->
                    let n = name_of_form p in
                    (* string/capitalize — first char up, rest down *)
                    if n = "" then n
                    else
                      String.uppercase_ascii (String.sub n 0 1)
                      ^ String.lowercase_ascii (String.sub n 1 (String.length n - 1)))
             |> List.sort_uniq compare
             |> List.map str
           in
           Some
             { bquery = list_ [ sym "priority"; sym "?b"; QueryFormSet prios ];
               brules = [ "priority" ] })
  | _ -> None

let build_tags (db : db) (e : query_form) : built option =
  match coll_elems e with
  | _ :: rest ->
      let tags =
        match rest with
        | [ first ] when is_coll first -> coll_elems first
        | _ -> rest
      in
      (match tags with
       | [] -> None
       | _ ->
           let tag_names =
             tags
             |> List.map (fun t -> Page_ref.get_page_name_exn (name_of_form t))
             |> List.sort_uniq compare
           in
           let ids =
             List.concat_map
               (fun tag_name ->
                 let tag_id : entity_id option =
                   if Ldb.is_uuid_string tag_name then
                     match entity db (Lookup_ref ("block/uuid", Uuid tag_name)) with
                     | Some t -> Some t.id
                     | None -> None
                   else
                     match page_exists_ids db tag_name [ "logseq.class/Tag" ] with
                     | id :: _ -> Some id
                     | [] -> None
                 in
                 match tag_id with
                 | Some id -> id :: get_structured_children db id
                 | None -> [])
               tag_names
             |> List.sort_uniq compare
           in
           Some
             { bquery =
                 list_ [ sym "tags"; sym "?b"; QueryFormSet (List.map int ids) ];
               brules = [ "tags" ] })
  | _ -> None

let build_sample (e : query_form) (env : env) : built option =
  match coll_elems e with
  | [ _; QueryFormInt n ] ->
      env.sample <- Some n;
      (* blank b/c this post-process filter doesn't affect query *)
      Some { bquery = QueryFormNil; brules = [] } (* filtered out later *)
  | _ -> None

let build_page (e : query_form) : built option =
  match coll_elems e with
  | _ :: first :: _ ->
      let name =
        Page_ref.get_page_name_exn
          (match first with
           | QueryFormSymbol s | QueryFormString s | QueryFormKeyword s -> s
           | other -> Ds_wire.edn_of_query_form other)
        |> Ldb.page_name_sanity_lc
      in
      Some { bquery = list_ [ sym "page"; sym "?b"; str name ]; brules = [ "page" ] }
  | _ -> None

let build_page_ref_or_self_ref (db : db) (e : query_form) (self : bool) : built option =
  let name =
    match Page_ref.get_page_name (match e with QueryFormString s -> s | _ -> Ds_wire.edn_of_query_form e) with
    | Some n -> n
    | None -> (match e with QueryFormString s -> s | _ -> Ds_wire.edn_of_query_form e)
  in
  let name = Ldb.page_name_sanity_lc name in
  match Ldb.get_page db (String name) with
  | Some page ->
      Some
        { bquery = list_ [ sym (if self then "self-ref" else "page-ref"); sym "?b"; int page.id ];
          brules = [ (if self then "self-ref" else "page-ref") ] }
  | None -> None

let build_block_content (e : query_form) : built =
  { bquery = list_ [ sym "block-content"; sym "?b"; e ]; brules = [ "block-content" ] }

(* datalog-clause? *)
let is_datalog_clause (e : query_form) : bool =
  is_coll e
  && (match first_elem e with
      | Some f when is_list f -> true
      | Some (QueryFormSymbol s) ->
          List.length (coll_elems e) >= 2
          && String.length s > 0 && s.[0] = '?'
      | _ -> false)

let rec build_query (e : query_form) (env : env) (level : int)
    (current_filter : string option) : built option =
  let fe : query_form option =
    match first_elem e with
    | Some f -> Some f
    | None ->
        (* cljs (first "abc") -> "a" char; on non-coll e first is nil *)
        (match e with
         | QueryFormString s when String.length s > 0 -> Some (str (String.make 1 s.[0]))
         | _ -> None)
  in
  let fe_name =
    match fe with
    | Some f when is_list f -> None (* list fe stays a form *)
    | Some (QueryFormSymbol s) -> Some (String.lowercase_ascii (name_of_form (sym s)))
    | Some (QueryFormKeyword s) -> Some (String.lowercase_ascii (name_of_form (kw s)))
    | Some other ->
        (match other with
         | QueryFormString s -> Some (String.lowercase_ascii s)
         | f -> Some (String.lowercase_ascii (Ds_wire.edn_of_query_form f)))
    | None -> None
  in
  let fe_sym name = fe_name = Some name && (match fe with Some (QueryFormSymbol _ | QueryFormKeyword _) -> true | _ -> false) in
  let page_ref =
    match e with QueryFormString s -> Page_ref.is_page_ref s | _ -> false
  in
  if
    List.exists
      (fun op -> fe_sym op)
      [ "between"; "property"; "private-property"; "todo"; "task"; "priority"; "page" ]
    || ((not page_ref) && match e with QueryFormString _ -> true | _ -> false)
  then env.blocks <- true;
  if match e with QueryFormNil -> true | _ -> false then None
  else if is_datalog_clause e then Some { bquery = vec_ [ e ]; brules = [] }
  else if
    fe_sym "and"
    && List.for_all
         (fun f -> match f with QueryFormString s -> Page_ref.is_page_ref s | _ -> false)
         (match coll_elems e with _ :: rest -> rest | _ -> [])
  then
    (* (and [[a]] [[b]]) -> (and [[a]] [[b]] (or [[a]] [[b]])) *)
    let rest = match coll_elems e with _ :: r -> r | _ -> [] in
    let e' = list_ (coll_elems e @ [ list_ (sym "or" :: rest) ]) in
    build_query e' env level current_filter
  else if page_ref then
    if current_filter = Some "or" || form_equal env.form e then
      build_page_ref_or_self_ref env.db e true
    else build_page_ref_or_self_ref env.db e false
  else
    match e with
    | QueryFormString _ -> Some (build_block_content e)
    | _ when fe_sym "and" || fe_sym "or" || fe_sym "not" ->
        build_and_or_not env level e (Option.get fe_name) current_filter
    | _ when fe_sym "between" -> build_between e
    | _ when fe_sym "property" -> build_property env.db e env
    | _ when fe_sym "private-property" ->
        build_property env.db e { env with private_property = true }
    | _ when fe_sym "todo" || fe_sym "task" -> build_task e
    | _ when fe_sym "priority" -> build_priority e
    | _ when fe_sym "page" -> build_page e
    | _ when fe_sym "sample" -> build_sample e env
    | _ when fe_sym "tags" -> build_tags env.db e
    | _ -> None

and build_and_or_not (env : env) (level : int) (e : query_form) (fe : string)
    (current_filter : string option) : built option =
  let raw_clauses =
    List.filter_map
      (fun form -> build_query form env (level + 1) (Some fe))
      (match coll_elems e with _ :: r -> r | _ -> [])
  in
  let clauses =
    raw_clauses
    |> List.map (fun b -> b.bquery)
    |> List.filter (fun q -> not (match q with QueryFormNil -> true | _ -> false))
    |> distinct_preserve_order
  in
  let clauses =
    if fe = "and" then
      let nots, others = List.partition not_clause clauses in
      others @ nots
    else clauses
  in
  let nested_and = fe = "and" && current_filter = Some "and" in
  match clauses with
  | [] -> None
  | _ ->
      let result = build_and_or_not_result fe clauses current_filter nested_and in
      List.iter (fun v -> Hashtbl.replace env.vars v ()) (collect_vars result);
      let query =
        if nested_and then result
        else if level = 0 && (fe = "and" || fe = "or") then result
        else if fe = "not" && Option.is_some current_filter then result
        else vec_ [ result ]
      in
      Some
        { bquery = query;
          brules =
            List.fold_left
              (fun acc x -> if List.mem x acc then acc else acc @ [ x ])
              []
              (List.concat_map (fun b -> b.brules) raw_clauses) }

(* ============ parse ============ *)

(* collect-vars-by-polarity — vars inside (not ...) count as negative *)
let collect_vars_by_polarity (form : query_form) : string list * string list =
  let pos = Hashtbl.create 8 and neg = Hashtbl.create 8 in
  let rec walk x positive =
    match x with
    | QueryFormSymbol s when String.length s > 0 && s.[0] = '?' ->
        Hashtbl.replace (if positive then pos else neg) s ()
    | QueryFormList (QueryFormSymbol "not" :: rest) ->
        List.iter (fun c -> walk c false) rest
    | QueryFormVector xs | QueryFormList xs | QueryFormSet xs ->
        List.iter (fun c -> walk c positive) xs
    | QueryFormMap kvs ->
        List.iter (fun (k, v) -> walk k positive; walk v positive) kvs
    | _ -> ()
  in
  walk form true;
  ( Hashtbl.fold (fun k () acc -> k :: acc) pos [],
    Hashtbl.fold (fun k () acc -> k :: acc) neg [] )

(* add-bindings! — prepend domain-establishing clauses for vars that
   only appear negatively *)
let add_bindings (q : query_form list) : query_form list =
  let pos, neg =
    List.fold_left
      (fun (p, n) clause ->
        let p', n' = collect_vars_by_polarity clause in
        (p @ p', n @ n'))
      ([], []) q
  in
  let pos = List.sort_uniq compare pos and neg = List.sort_uniq compare neg in
  let appears v = List.mem v pos || List.mem v neg in
  let needs_domain v = appears v && not (List.mem v pos) in
  let b_need = needs_domain "?b" and p_need = needs_domain "?p" in
  let bindings =
    if b_need && p_need then [ [ vec_ [ sym "?b"; kw "block/page"; sym "?p" ] ] ]
    else if b_need then
      [ [ vec_ [ sym "?b"; kw "block/uuid" ];
          vec_ [ list_ [ sym "missing?"; sym "$"; sym "?b"; kw "logseq.property/built-in?" ] ] ] ]
    else if p_need then [ [ vec_ [ sym "?p"; kw "block/name" ] ] ]
    else if List.mem "?b" pos && List.mem "?p" pos then
      [ [ vec_ [ sym "?b"; kw "block/page"; sym "?p" ] ] ]
    else []
  in
  List.concat bindings @ q

type parsed =
  { pquery : query_form list option
  ; prules : query_form list
  ; prule_names : string list
  ; pblocks : bool
  ; psample : int option
  }

(* query-dsl/parse *)
let parse ?(cards : bool = false) (db : db) (s : string) : parsed option =
  ignore cards;
  if String.trim s = "" then None
  else
    let s =
      if String.length s > 0 && s.[0] = '#' then
        Page_ref.to_page_ref (String.sub s 1 (String.length s - 1))
      else s
    in
    let form =
      try Some (apply_custom_readers (Parser.read_edn (pre_transform s)))
      with _ -> None
    in
    let env =
      { db; form = Option.value form ~default:QueryFormNil; blocks = false;
        sample = None; vars = Hashtbl.create 8; private_property = false }
    in
    let form = Option.map simplify_query form in
    let built = match form with Some f -> build_query f env 0 None | None -> None in
    let result =
      match built with
      | Some { bquery = q; _ } -> (match coll_elems q with [] -> None | elems -> Some (q, elems))
      | None -> None
    in
    let result' =
      match result with
      | None -> None
      | Some (q, elems) ->
          (* key = keyword of first element of first element when it is a
             coll, else keyword of the first element *)
          let key =
            match elems with
            | first :: _ when is_coll first ->
                (match first_elem first with
                 | Some (QueryFormSymbol s) -> s
                 | Some (QueryFormKeyword s) -> s
                 | _ -> "")
            | QueryFormSymbol s :: _ -> s
            | QueryFormKeyword k :: _ -> k
            | _ -> ""
          in
          if key = "and" then
            (* (and c1 c2 ...) -> (c1 c2 ...) *)
            (match q with
             | QueryFormList (_ :: clauses) -> Some clauses
             | _ -> Some elems)
          else Some (coll_elems q)
    in
    let result' = Option.map add_bindings result' in
    let rule_names =
      match built with
      | Some b ->
          let rules = List.sort_uniq compare b.brules in
          if List.mem "page-ref" rules then List.sort_uniq compare ("self-ref" :: rules)
          else rules
      | None -> []
    in
    Some
      { pquery = result'
      ; prules = extract_rules rule_names
      ; prule_names = rule_names
      ; pblocks = env.blocks
      ; psample = env.sample
      }

let parse_query ?(cards : bool = false) db s options =
  ignore cards;
  let current_page_title, today_day = options in
  parse ~cards db (resolve_dynamic_template s ~current_page_title ~today_day)

(* ============ query wrapper + execution ============ *)

(* query-dsl/query-wrapper — where is the clause list produced by parse *)
let query_wrapper (where : query_form list) ~blocks ~block_attrs_edn : string =
  let attrs =
    match block_attrs_edn with
    | Some e -> (match try Some (Parser.read_edn e) with _ -> None with Some f -> f | None -> vec_ [ sym "*" ])
    | None -> vec_ [ sym "*" ]
  in
  let find =
    if blocks then
      [ kw "find"; list_ [ sym "pull"; sym "?b"; attrs ]; kw "in"; sym "$"; sym "%"; kw "where" ]
    else
      [ kw "find"; list_ [ sym "pull"; sym "?p"; vec_ [ sym "*" ] ]; kw "in"; sym "$"; sym "%"; kw "where" ]
  in
  let elems =
    match where with
    | first :: _ when is_coll first -> find @ where
    | _ -> find @ [ list_ where ]
  in
  Ds_wire.edn_of_query_form (vec_ elems)

let with_raw_title (r : query_result) : query_result =
  match r with
  | Result_pull p ->
      let has k = List.exists (fun (key, _) -> key = Keyword k) p.pulled_attrs in
      if has "block/title" && not (has "block/raw-title") then
        let title_v = List.assoc (Keyword "block/title") p.pulled_attrs in
        Result_pull
          { p with pulled_attrs = p.pulled_attrs @ [ (Keyword "block/raw-title", title_v) ] }
      else r
  | _ -> r

let query_result_tuples (rows : query_result list list) : query_result list list =
  List.map (List.map with_raw_title) rows

let sample_results (rows : query_result list list) (sample : int option) : query_result list list =
  match sample with
  | Some n when n > 0 && List.length rows > n ->
      let arr = Array.of_list rows in
      for i = Array.length arr - 1 downto 1 do
        let j = Random.int (i + 1) in
        let tmp = arr.(i) in
        arr.(i) <- arr.(j);
        arr.(j) <- tmp
      done;
      Array.to_list (Array.sub arr 0 n)
  | _ -> rows

type exec_opts =
  { opt_cards : bool
  ; opt_block_attrs : string option
  ; opt_current_page_title : string option
  ; opt_today_day : int option
  }

let () = Random.self_init ()

(* query-dsl/execute-query *)
let execute_query (db : db) (query_string : string) (opts : exec_opts) : query_result list list option =
  if String.length query_string > 0 && query_string <> "\"\"" then
    match
      parse_query db query_string
        (opts.opt_current_page_title, opts.opt_today_day)
    with
    | Some { pquery = Some query_star; prules; psample; _ } ->
        let query_star =
          if opts.opt_cards then
            let card_id =
              match entity db (Ident "logseq.class/Card") with
              | Some e -> int e.id
              | None -> QueryFormNil
            in
            vec_ [ sym "?b"; kw "block/tags"; card_id ] :: query_star
          else query_star
        in
        let q' = query_wrapper query_star ~blocks:true ~block_attrs_edn:opts.opt_block_attrs in
        let rows = Datascript.q_string db q' ~inputs:[ parse_rules_input prules ] in
        Some (sample_results (query_result_tuples rows) psample)
    | _ -> None
  else None

(* query-dsl/execute-custom-query — :query is a DSL form (list), not a
   string. cljs does (resolve-dynamic-template (pr-str (:query m)) {}). *)
let execute_custom_query (db : db) (query_form_edn : string) (opts : exec_opts) : query_result list list option =
  (* query_form_edn = pr-str of (:query query-m); empty -> nil like cljs (seq (:query m)) *)
  let s = resolve_dynamic_template query_form_edn ~current_page_title:None ~today_day:None in
  match parse db s with
  | Some { pquery = Some query_star; prules; pblocks; _ } ->
      let q' = query_wrapper query_star ~blocks:pblocks ~block_attrs_edn:opts.opt_block_attrs in
      Some (query_result_tuples (Datascript.q_string db q' ~inputs:[ parse_rules_input prules ]))
  | _ -> None
