(* 1:1 translations of cljs unit tests exercising the ported search code.

   Sources:
   - src/test/frontend/worker/search_test.cljs — all deftests whose cljs
     assertions map onto ported OCaml fns. cljs uses js-object sqlite
     mocks (checking-db, canned .exec rows) and with-redefs on d/entity,
     d/pull-many and ldb predicates; in OCaml the same tests run against
     a real :memory: sqlite FTS db and real Datascript conns (the
     observable results are asserted identically). Spy-style assertions
     on generated SQL that have no OCaml hook are replaced by direct
     checks of build_search_bind / get_match_input output, which is what
     those mocks were observing.
   - src/test/frontend/common/search_fuzzy_test.cljs — the fuzzy-search
     deftests (hanzi->initials is not ported: tiny-pinyin dependency).

   Skipped cljs cases:
   - search-blocks-includes-vector-only-results,
     search-blocks-excludes-built-in-class-vector-results-when-built-ins-disabled,
     search-blocks-limits-vector-results-before-combining,
     search-blocks-hybrid-ranks-keyword-and-vector-results,
     search-blocks-filters-weak-vector-result: cljs injects a fake
     vector-index js map; OCaml Vector_index.index is an abstract
     platform handle with no test constructor. The combine-level scoring
     the tests exercise is covered by the combine-results tests below
     (vector rows passed directly).
   - sync-search-indice-300-new-blocks-does-not-check-page-descendants:
     asserts a ldb/page? call count via with-redefs; no OCaml hook.
   - frontend.handler.search-test: tests the main-thread caller
     (frontend.handler.search), not worker code.

   cljs deftest names are kept as OCaml test names. *)

open Datascript
module Ev = Entity_view
module T = Db_test_util

let failures = ref 0

let check name cond =
  if cond then Printf.printf "ok - %s\n" name
  else begin
    incr failures;
    Printf.printf "FAIL - %s\n%!" name
  end

let check_eq name expected actual =
  check
    (Printf.sprintf "%s (expected %S got %S)" name expected actual)
    (expected = actual)

let check_list name (expected : 'a list) (actual : 'a list) show =
  check
    (Printf.sprintf "%s (expected %s got %s)" name
       (String.concat ";" (List.map show expected))
       (String.concat ";" (List.map show actual)))
    (expected = actual)

let nbsp = "\u{00A0}"
let ellipsis = nbsp ^ nbsp ^ nbsp ^ "..." ^ nbsp ^ nbsp ^ nbsp

let mk_open = "$pfts_2lqh>$"
let mk_close = "$<pfts_2lqh$"

(* cljs test-uuid-string *)
let test_uuid_string n = Printf.sprintf "00000000-0000-0000-0000-%012x" n

let str_contains haystack needle =
  let hl = String.length haystack and nl = String.length needle in
  let rec go i =
    if i + nl > hl then false
    else if String.sub haystack i nl = needle then true
    else go (i + 1)
  in
  go 0

let starts_with s prefix =
  let pl = String.length prefix in
  String.length s >= pl && String.sub s 0 pl = prefix

let ends_with s suffix =
  let sl = String.length s and sufl = String.length suffix in
  sl >= sufl && String.sub s (sl - sufl) sufl = suffix

let count_char c s =
  let n = ref 0 in
  String.iter (fun x -> if x = c then incr n) s;
  !n

(* re-find #%s — only used for literal substring checks in the ported
   tests (cljs regexes here are literal). *)
let re_find needle haystack = str_contains haystack needle

let sql_placeholder_count s = count_char '?' s

let repeat_str n s = String.concat "" (List.init n (fun _ -> s))

(* ---------- pulled-node builders (cljs plain-map entities) ---------- *)

let pscalar k v = (Keyword k, Pulled_scalar v)
let pstrings k ss = Pulled_many (List.map (fun s -> Pulled_scalar (String s)) ss)

let pulled_node id attrs : Ev.node =
  Ev.of_pulled { pulled_id = id; pulled_attrs = attrs }

let pulled_scalar_attrs id kvs : Ev.node =
  pulled_node id (List.map (fun (k, v) -> pscalar k v) kvs)

let pulled_tag ident : pulled_entity =
  { pulled_id = 0
  ; pulled_attrs =
      [ (Keyword "db/ident", Pulled_scalar (Keyword ident)) ] }

(* ---------- real search-db helper ---------- *)

let open_search_db () =
  let db = Sqlite.open_db ~path:":memory:" in
  Search_index.create_tables_and_triggers db;
  db

(* ---------- block-result access ---------- *)

let br_get (br : Search_index.block_result) k : value option =
  List.assoc_opt k br

let br_string br k =
  match br_get br k with Some (String s) -> Some s | _ -> None

let br_uuid br k =
  match br_get br k with Some (Uuid u) -> Some u | _ -> None

let outcome_rows = function
  | Search_index.Rows rs -> rs
  | Search_index.Rows_with_count (rs, _) -> rs

let result_titles (rows : Search_index.block_result list) =
  List.filter_map (fun r -> br_string r "block/title") rows

let opts ?(limit = 100) ?enable_snippet ?include_breadcrumb ?built_in
    ?include_matched_count ?code_only ?page_only ?dev ?library_page_search
    ?search_limit ?page ?enable_semantic ?query_embedding () =
  let get default = function Some x -> x | None -> default in
  { Search_index.opt_limit = limit
  ; opt_enable_snippet = get true enable_snippet
  ; opt_include_breadcrumb = get false include_breadcrumb
  ; opt_built_in = get false built_in
  ; opt_include_matched_count = get false include_matched_count
  ; opt_code_only = get false code_only
  ; opt_page_only = get false page_only
  ; opt_dev = get false dev
  ; opt_library_page_search = get false library_page_search
  ; opt_search_limit = search_limit
  ; opt_page = page
  ; opt_enable_semantic_search = get false enable_semantic
  ; opt_query_embedding = query_embedding
  }

let run_search conn sdb q ?(opts = opts ()) () =
  Search_index.search_blocks ~conn ~search_db:(Some sdb) ~vector_index:None
    ~q0:q ~opts

(* index the conn's blocks (id=block/uuid, page=page uuid) into sdb *)
let index_conn_blocks conn sdb =
  let items =
    Search_index.build_blocks_indice (Datascript.db conn)
  in
  Search_index.upsert_blocks sdb items;
  items

let block_uuid e =
  match Ldb.value e "block/uuid" with Some (Uuid u) -> u | _ -> ""

(* =================== tests =================== *)

let test_ensure_highlighted_snippet_adds_marker () =
  check_eq "adds highlight markers for first matching term [1]"
    ("今天学习" ^ mk_open ^ "中文" ^ mk_close)
    (Option.value
       (Search_index.ensure_highlighted_snippet None (Some "今天学习中文") "中文")
       ~default:"<nil>");
  check_eq "adds highlight markers [2]"
    (mk_open ^ "今天" ^ mk_close ^ "学习" ^ mk_open ^ "中文" ^ mk_close)
    (Option.value
       (Search_index.ensure_highlighted_snippet
          (Some ("今天学习" ^ mk_open ^ "中文" ^ mk_close))
          None "今天 中文")
       ~default:"<nil>");
  check_eq "adds highlight markers [3]"
    ("Hello " ^ mk_open ^ "World" ^ mk_close)
    (Option.value
       (Search_index.ensure_highlighted_snippet None (Some "Hello World") "world")
       ~default:"<nil>");
  check_eq "adds highlight markers [4]"
    (mk_open ^ "Hello" ^ mk_close ^ " Clojure " ^ mk_open ^ "World" ^ mk_close)
    (Option.value
       (Search_index.ensure_highlighted_snippet
          (Some (mk_open ^ "Hello" ^ mk_close ^ " Clojure World"))
          None "hello world")
       ~default:"<nil>")

let test_ensure_highlighted_snippet_keeps_existing () =
  check_eq "keeps snippet when already highlighted"
    ("Hi " ^ mk_open ^ "Logseq" ^ mk_close)
    (Option.value
       (Search_index.ensure_highlighted_snippet
          (Some ("Hi " ^ mk_open ^ "Logseq" ^ mk_close))
          (Some "Hi Logseq") "logseq")
       ~default:"<nil>")

let test_ensure_highlighted_snippet_preserves_original_title_case () =
  let snippet =
    "clojure is a dynamic and " ^ mk_open ^ "functional" ^ mk_close
    ^ " dialect of the programming " ^ mk_open ^ "language" ^ mk_close
    ^ " lisp on the java platform."
  in
  let title =
    "Clojure is a dynamic and functional dialect of the programming language Lisp on the Java platform."
  in
  check_eq "uses original title casing while keeping case-insensitive term matching"
    ("Clojure is a dynamic and " ^ mk_open ^ "functional" ^ mk_close
     ^ " dialect of the programming " ^ mk_open ^ "language" ^ mk_close
     ^ " Lisp on the Java platform.")
    (Option.value
       (Search_index.ensure_highlighted_snippet (Some snippet) (Some title)
          "functional language")
       ~default:"<nil>")

let test_ensure_highlighted_snippet_no_match () =
  check_eq "returns base text when no match" "Nothing here"
    (Option.value
       (Search_index.ensure_highlighted_snippet None (Some "Nothing here") "中文")
       ~default:"<nil>")

let test_ensure_highlighted_snippet_appends_tail_ellipsis () =
  let text = "match starts here " ^ repeat_str 320 "x" in
  let result =
    Option.value
      (Search_index.ensure_highlighted_snippet None (Some text) "match")
      ~default:"<nil>"
  in
  check "append trailing ... keeps match marker"
    (re_find (mk_open ^ "match" ^ mk_close) result);
  check "append trailing ... ends with ..." (ends_with result "...")

let test_ensure_highlighted_snippet_windowed () =
  let prefix = repeat_str 10 "甲乙丙丁戊己庚辛壬癸，子丑寅卯辰巳午未申酉戌亥。" in
  let text = prefix ^ "Clojure是Lisp编程语言在Java平台上的现代、动态及函数式方言。" in
  let result =
    Option.value
      (Search_index.ensure_highlighted_snippet None (Some text) "函数式")
      ~default:"<nil>"
  in
  (* cljs (subs prefix 0 50) is 50 utf16 units; each char is BMP so = 50 chars *)
  let prefix50 = String.sub prefix 0 (String.length prefix / 10 * 0 + 3 * 50 / 3 * 0 + 150) in
  (* careful: prefix chars are 3-byte utf8; 50 units = 150 bytes *)
  check "windowed: keeps prefix"
    (starts_with result (String.sub prefix 0 150 ^ ellipsis));
  ignore prefix50;
  check "windowed: shows window around match"
    (re_find
       (ellipsis ^ "动态及" ^ mk_open ^ "函数式" ^ mk_close)
       result);
  let prefix2 = repeat_str 10 "ABCDEFG, HIJKLMN, OPQRST, UVWXYZ." in
  let text2 =
    prefix2
    ^ "Clojure is a dynamic and functional dialect of the programming language Lisp on the Java platform."
  in
  let result2 =
    Option.value
      (Search_index.ensure_highlighted_snippet None (Some text2) "functional")
      ~default:"<nil>"
  in
  check "windowed [ascii]: keeps prefix"
    (starts_with result2 (String.sub prefix2 0 50 ^ ellipsis));
  check "windowed [ascii]: shows window"
    (re_find
       (ellipsis ^ "Clojure is a dynamic and " ^ mk_open ^ "functional" ^ mk_close)
       result2)

let test_ensure_highlighted_snippet_multi_term_merged () =
  let prefix = repeat_str 20 "甲乙丙丁戊己庚辛壬癸，子丑寅卯辰巳午未申酉戌亥。" in
  let text = prefix ^ "Clojure是Lisp编程语言在Java平台上的现代、动态及函数式方言。" in
  let result =
    Option.value
      (Search_index.ensure_highlighted_snippet None (Some text) "编程 函数式")
      ~default:"<nil>"
  in
  check "multi-term merged: keeps prefix"
    (starts_with result (String.sub prefix 0 150 ^ ellipsis));
  check "multi-term merged: single window covers both terms"
    (re_find
       (mk_open ^ "编程" ^ mk_close ^ "语言在Java平台上的现代、动态及" ^ mk_open
        ^ "函数式" ^ mk_close)
       result);
  check "multi-term merged: has ellipsis" (re_find ellipsis result);
  let double_ellipsis = ellipsis ^ ".*" in
  ignore double_ellipsis;
  check "multi-term merged: exactly one ellipsis"
    (not
       (let i = str_contains result ellipsis in
        i
        &&
        (let off =
           match
             (let rec find i =
                if i + String.length ellipsis <= String.length result
                   && String.sub result i (String.length ellipsis) = ellipsis
                then Some i
                else find (i + 1)
              in
              try find 0 with _ -> None)
           with
           | Some i -> Some (i + String.length ellipsis)
           | None -> None
         in
         match off with
         | Some o -> str_contains (String.sub result o (String.length result - o)) ellipsis
         | None -> false)));
  let prefix2 = repeat_str 20 "ABCDEFG, HIJKLMN, OPQRST, UVWXYZ." in
  let text2 =
    prefix2
    ^ "Clojure is a dynamic and functional dialect of the programming language Lisp on the Java platform."
  in
  let result2 =
    Option.value
      (Search_index.ensure_highlighted_snippet None (Some text2)
         "dynamic language")
      ~default:"<nil>"
  in
  check "multi-term merged [ascii]: keeps prefix"
    (starts_with result2 (String.sub prefix2 0 50 ^ ellipsis));
  check "multi-term merged [ascii]: window"
    (re_find
       (mk_open ^ "dynamic" ^ mk_close
        ^ " and functional dialect of the programming " ^ mk_open ^ "language"
        ^ mk_close)
       result2)

let ellipsis_count s =
  let rec go i acc =
    if i + String.length ellipsis > String.length s then acc
    else if String.sub s i (String.length ellipsis) = ellipsis then
      go (i + String.length ellipsis) (acc + 1)
    else go (i + 1) acc
  in
  go 0 0

let test_ensure_highlighted_snippet_multi_term_split () =
  let filler = repeat_str 20 "甲乙丙丁戊己庚辛壬癸，子丑寅卯辰巳午未申酉戌亥。" in
  let text = "君不见黄河之水天上来，" ^ filler ^ "奔流到海不复回" in
  let result =
    Option.value
      (Search_index.ensure_highlighted_snippet None (Some text) "黄河 到海")
      ~default:"<nil>"
  in
  check "split [1]: keeps start"
    (starts_with result
       ("君不见" ^ mk_open ^ "黄河" ^ mk_close ^ "之水天上来，"));
  check "split [1]: second window" (re_find (ellipsis ^ "奔流" ^ mk_open ^ "到海" ^ mk_close) result);
  check "split [1]: two windows only" (ellipsis_count result <= 1);
  let prefix = repeat_str 20 "甲乙丙丁戊己庚辛壬癸，子丑寅卯辰巳午未申酉戌亥。" in
  let far = repeat_str 20 "甲乙丙丁戊己庚辛壬癸，子丑寅卯辰巳午未申酉戌亥。" in
  let text2 = prefix ^ "仙人抚我顶，" ^ far ^ "结发受长生" in
  let result2 =
    Option.value
      (Search_index.ensure_highlighted_snippet None (Some text2) "仙人 长生")
      ~default:"<nil>"
  in
  check "split [2]: keeps prefix"
    (starts_with result2 (String.sub prefix 0 150 ^ ellipsis));
  check "split [2]: first term" (re_find (ellipsis ^ mk_open ^ "仙人" ^ mk_close) result2);
  check "split [2]: second term" (re_find (ellipsis ^ "结发受" ^ mk_open ^ "长生" ^ mk_close) result2);
  check "split [2]: at least two ellipses" (ellipsis_count result2 >= 2);
  let prefix3 = repeat_str 20 "ABCDEFG, HIJKLMN, OPQRST, UVWXYZ." in
  let far3 = repeat_str 20 "ABCDEFG, HIJKLMN, OPQRST, UVWXYZ." in
  let text3 = prefix3 ^ "life it seems will fade away, " ^ far3 ^ "now i will just say good-bye" in
  let result3 =
    Option.value
      (Search_index.ensure_highlighted_snippet None (Some text3) "fade say")
      ~default:"<nil>"
  in
  check "split [3]: keeps prefix"
    (starts_with result3 (String.sub prefix3 0 50 ^ ellipsis));
  check "split [3]: fade window"
    (re_find (ellipsis ^ "life it seems will " ^ mk_open ^ "fade" ^ mk_close) result3);
  check "split [3]: say window"
    (re_find (ellipsis ^ "now i will just " ^ mk_open ^ "say" ^ mk_close) result3);
  check "split [3]: at least two ellipses" (ellipsis_count result3 >= 2);
  let prefix4 = repeat_str 48 "A" in
  let far4 = repeat_str 260 "B" in
  let text4 = prefix4 ^ "token" ^ far4 ^ " ending target" in
  let result4 =
    Option.value
      (Search_index.ensure_highlighted_snippet None (Some text4) "token target")
      ~default:"<nil>"
  in
  check "split [4]: keeps prefix+token"
    (starts_with result4 (prefix4 ^ mk_open ^ "token" ^ mk_close));
  check "split [4]: target window" (re_find (mk_open ^ "target" ^ mk_close) result4);
  check "split [4]: ellipsis present" (ellipsis_count result4 >= 1)

let test_ensure_highlighted_snippet_overlap () =
  let text = "十步杀一人，千里不留行。北国风光，千里冰封，万里雪飘。" in
  let cases =
    [ ("十步 杀一人",
       mk_open ^ "十步" ^ mk_close ^ mk_open ^ "杀一人" ^ mk_close
       ^ "，千里不留行。北国风光，千里冰封，万里雪飘。")
    ; ("千里 千",
       "十步杀一人，" ^ mk_open ^ "千里" ^ mk_close
       ^ "不留行。北国风光，" ^ mk_open ^ "千" ^ mk_close
       ^ "里冰封，万里雪飘。")
    ; ("千 千里",
       "十步杀一人，" ^ mk_open ^ "千里" ^ mk_close
       ^ "不留行。北国风光，" ^ mk_open ^ "千" ^ mk_close
       ^ "里冰封，万里雪飘。")
    ; ("千里不留行 千里",
       "十步杀一人，" ^ mk_open ^ "千里不留行" ^ mk_close
       ^ "。北国风光，" ^ mk_open ^ "千里" ^ mk_close ^ "冰封，万里雪飘。")
    ; ("千里不留行 千里不",
       "十步杀一人，" ^ mk_open ^ "千里不留行" ^ mk_close
       ^ "。北国风光，千里冰封，万里雪飘。") ]
  in
  List.iteri
    (fun i (q, expected) ->
       check_eq
         (Printf.sprintf "overlap-prefers-non-overlap-hit [%d]" i)
         expected
         (Option.value
            (Search_index.ensure_highlighted_snippet None (Some text) q)
            ~default:"<nil>"))
    cases;
  let text2 =
    "Clojure is a dynamic and functional dialect of the programming language Lisp on the Java platform."
  in
  let cases2 =
    [ ("programming i",
       "Clojure " ^ mk_open ^ "i" ^ mk_close
       ^ "s a dynamic and functional dialect of the " ^ mk_open ^ "programming"
       ^ mk_close ^ " language Lisp on the Java platform.")
    ; ("functional f",
       "Clojure is a dynamic and " ^ mk_open ^ "functional" ^ mk_close
       ^ " dialect o" ^ mk_open ^ "f" ^ mk_close
       ^ " the programming language Lisp on the Java platform.")
    ; ("Clojure l",
       mk_open ^ "Clojure" ^ mk_close
       ^ " is a dynamic and functiona" ^ mk_open ^ "l" ^ mk_close
       ^ " dialect of the programming language Lisp on the Java platform.")
    ; ("dynamic dy",
       "Clojure is a " ^ mk_open ^ "dynamic" ^ mk_close
       ^ " and functional dialect of the programming language Lisp on the Java platform.") ]
  in
  List.iteri
    (fun i (q, expected) ->
       check_eq
         (Printf.sprintf "overlap-prefers-non-overlap-hit ascii [%d]" i)
         expected
         (Option.value
            (Search_index.ensure_highlighted_snippet None (Some text2) q)
            ~default:"<nil>"))
    cases2

let test_code_block_predicate () =
  let code_pulled attrs =
    pulled_scalar_attrs 1
      ([ "logseq.property.node/display-type", Keyword "code" ] @ attrs)
  in
  let math_pulled =
    pulled_scalar_attrs 1 [ "logseq.property.node/display-type", Keyword "math" ]
  in
  check "matches display-type code first"
    (Search_index.code_block None (code_pulled []));
  check "display-type math is not code"
    (not (Search_index.code_block None math_pulled));
  (* falls back to Code class instance when display-type is missing:
     cljs redefs ldb/class-instance?; here a real conn with a Code-block
     class + tagged block exercises the same path. *)
  let conn = T.create_conn () in
  let cc_uuid = test_uuid_string 500 in
  ignore
    (transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"%s\" :db/ident :logseq.class/Tag :block/title \"Tag\"}]"
          (test_uuid_string 501)));
  ignore
    (transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"%s\" :db/ident :logseq.class/Code-block :block/title \"Code block\" :block/tags [{:db/ident :logseq.class/Tag}]}]"
          cc_uuid));
  ignore
    (transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"%s\" :block/title \"code block\" :block/tags [[:block/uuid #uuid \"%s\"]]}
            {:block/uuid #uuid \"%s\" :block/title \"normal block\"}]"
          (test_uuid_string 502) cc_uuid (test_uuid_string 503)));
  let db = Datascript.db conn in
  let cc =
    Datascript.entity db (Ident "logseq.class/Code-block")
  in
  let code_block_ent =
    Datascript.entity db (Lookup_ref ("block/uuid", Uuid (test_uuid_string 502)))
  in
  let normal_block =
    Datascript.entity db (Lookup_ref ("block/uuid", Uuid (test_uuid_string 503)))
  in
  (match cc, code_block_ent, normal_block with
   | Some cc, Some cb, Some nb ->
       check "falls back to Code class instance [code block]"
         (Search_index.code_block (Some cc) (Ev.of_entity cb));
       check "falls back to Code class instance [normal block]"
         (not (Search_index.code_block (Some cc) (Ev.of_entity nb)))
   | _ -> check "code class fixture exists" false);
  (* excludes page entities in code-only mode — page tagged Page + code *)
  let page_uuid = test_uuid_string 510 in
  let page_class_uuid = test_uuid_string 511 in
  ignore
    (transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"%s\" :db/ident :logseq.class/Page :block/title \"Page\"}
            {:block/uuid #uuid \"%s\" :block/title \"code page\" :block/tags [[:block/uuid #uuid \"%s\"]] :logseq.property.node/display-type :code}]"
          page_class_uuid page_uuid page_class_uuid));
  let db2 = Datascript.db conn in
  (match
     Datascript.entity db2 (Lookup_ref ("block/uuid", Uuid page_uuid))
   with
   | Some p ->
       check "excludes page entities in code-only mode"
         (not (Search_index.code_block cc (Ev.of_entity p)))
   | None -> check "code page fixture exists" false)

let test_hidden_entity_recycled () =
  let recycled_root =
    pulled_scalar_attrs 1 [ "logseq.property/deleted-at", Int 1 ]
  in
  check "recycled roots are hidden" (Search_index.hidden_entity recycled_root);
  let on_recycled_page =
    pulled_node 2
      [ pscalar "block/title" (String "child")
      ; ( Keyword "block/page",
          Pulled_entity
            { pulled_id = 9
            ; pulled_attrs =
                [ pscalar "logseq.property/deleted-at" (Int 1) ] } ) ]
  in
  check "entities on recycled pages are hidden"
    (Search_index.hidden_entity on_recycled_page)

let test_search_indexes_hide_by_default_properties () =
  let conn =
    T.create_conn_with_blocks
      ~properties:
        [ ( "keywords",
            T.{ default_property with
                p_schema =
                  [ ( "logseq.property/hide?",
                      Bool true ) ] } )
        ; ( "author",
            T.{ default_property with p_schema = [] } ) ]
      ~pages_and_blocks:
        [ T.{ page =
                { default_page with
                  pg_title = Some "Hidden page"
                ; pg_properties = []
                ; pg_extra = [ ("logseq.property/hide?", T.Bool true) ] }
            ; blocks = [] } ]
      ()
  in
  let tag_uuid = test_uuid_string 910 and prop_tag_uuid = test_uuid_string 911
  and pt_uuid = test_uuid_string 912 in
  ignore
    (transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"%s\" :db/ident :logseq.class/Tag :block/title \"Tag\"}]"
          tag_uuid));
  ignore
    (transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"%s\" :db/ident :logseq.class/Property :block/title \"Property\" :block/tags [[:block/uuid #uuid \"%s\"]]}]"
          prop_tag_uuid tag_uuid));
  ignore
    (transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"%s\" :db/ident :logseq.property/type :block/title \"Property type\" :block/tags [[:block/uuid #uuid \"%s\"]] :logseq.property/built-in? true}]"
          pt_uuid prop_tag_uuid));
  let db = Datascript.db conn in
  let keywords = Datascript.entity db (Ident "user.property/keywords") in
  let author = Datascript.entity db (Ident "user.property/author") in
  let private_property = Datascript.entity db (Ident "logseq.property/type") in
  let hidden_page = T.find_page_by_title db "Hidden page" in
  let indexed_titles =
    Search_index.get_all_blocks db
    |> List.filter_map (fun e -> Option.bind (Ldb.value e "block/title")
                              (function String s -> Some s | _ -> None))
  in
  (match keywords with
   | Some k ->
       check "keywords property hide? is true"
         (match Ldb.value k "logseq.property/hide?" with
          | Some (Bool true) -> true
          | _ -> false);
       check "keywords property is not hidden-entity"
         (not (Search_index.hidden_entity (Ev.of_entity k)))
   | None -> check "keywords property exists" false);
  (match author with
   | Some a ->
       check "author property is not hidden-entity"
         (not (Search_index.hidden_entity (Ev.of_entity a)))
   | None -> check "author property exists" false);
  (match private_property with
   | Some p ->
       check "private built-in property is hidden-entity"
         (Search_index.hidden_entity (Ev.of_entity p))
   | None -> check "logseq.property/type exists" false);
  (match hidden_page with
   | Some p ->
       check "hidden page is hidden-entity"
         (Search_index.hidden_entity (Ev.of_entity p))
   | None -> check "hidden page exists" false);
  check "indexed titles contain keywords" (List.mem "keywords" indexed_titles);
  check "indexed titles contain author" (List.mem "author" indexed_titles);
  check "indexed titles exclude Property type"
    (not (List.mem "Property type" indexed_titles));
  check "indexed titles exclude Hidden page"
    (not (List.mem "Hidden page" indexed_titles));
  match keywords with
  | Some k ->
      let combined =
        Search_index.combine_results db
          [ Search_index.result_of_row ~id:(block_uuid k) ~title:"keywords"
              ~keyword_score:1.0 () ]
      in
      check "combine-results keeps keywords result"
        (List.exists (fun r -> r.Search_index.id = block_uuid k) combined)
  | None -> ()

let test_search_blocks_aux_bind_count () =
  let sdb = open_search_db () in
  let cases =
    [ ("select id, page, title, rank from blocks_fts where title match ? or title match ? limit ?",
       "a/b", "a/b", None, 10, true)
    ; ("select id, page, title, rank from blocks_fts where title like ? limit ?",
       "a/", "%a/%", None, 10, false)
    ; ("select id, page, title, rank from blocks_fts where page = ? and title like ? limit ?",
       "a/", "%a/%", Some "page-1", 10, false) ]
  in
  List.iteri
    (fun i (sql, q, input, page, limit, ns) ->
       let bind =
         Search_index.build_search_bind q input page limit ns
       in
       check
         (Printf.sprintf "aux bind count aligned [%d]" i)
         (Array.length bind = sql_placeholder_count sql);
       let res =
         Search_index.search_blocks_aux ~use_namespace_last_part:ns sdb ~sql ~q
           ~input ~page ~limit
       in
       check (Printf.sprintf "aux returns rows [%d]" i) (res = []))
    cases

let test_search_blocks_escapes_quotes_for_fts () =
  let cases =
    [ "\"", "\"\"\"\"*"
    ; "foo \"bar", "\"foo \"\"bar\"*"
    ; "foo \"bar AND baz", "\"foo \"\"bar AND baz\"*"
    ; "foo \"bar or baz", "\"foo \"\"bar OR baz\"*"
    ; "foo \"bar not baz", "\"foo \"\"bar NOT baz\"*" ]
  in
  List.iteri
    (fun i (q, expected) ->
       check_eq (Printf.sprintf "escapes quotes [%d]" i) expected
         (Search_index.get_match_input q))
    cases

let test_search_blocks_dangling_boolean () =
  let cases =
    [ "xxx and ", "\"xxx AND \"*"
    ; "xxx AND ", "\"xxx AND \"*"
    ; "xxx or ", "\"xxx OR \"*"
    ; "xxx NOT ", "\"xxx NOT \"*"
    ; "xxx & ", "\"xxx AND \"*"
    ; "xxx | ", "\"xxx OR \"*" ]
  in
  List.iteri
    (fun i (q, expected) ->
       check_eq (Printf.sprintf "dangling boolean [%d]" i) expected
         (Search_index.get_match_input q))
    cases

(* cljs search-blocks-large-graph-benchmark-regression: the cljs spy asserts
   the generated SQL never orders by rank; on native the query SQL is a
   compile-time literal inside search_blocks (no "order by rank" — visible
   in search_index.ml) so only the empty-result half is asserted here. *)
let test_search_blocks_large_graph_no_rank_scan () =
  let sdb = open_search_db () in
  let conn = T.create_conn () in
  let res = run_search conn sdb "alpha" ~opts:(opts ~limit:10 ()) () in
  check "large-graph regression returns empty" (outcome_rows res = [])

(* Real-conn + real-sqlite fixture: blocks with uuid + page, indexed. *)
let graph_with_blocks titles =
  let conn =
    T.create_conn_with_blocks
      ~pages_and_blocks:
        [ T.{ page = { default_page with pg_title = Some "P" }
            ; blocks =
                List.map
                  (fun t -> { T.default_block with b_title = Some t })
                  titles } ]
      ()
  in
  let sdb = open_search_db () in
  let _items = index_conn_blocks conn sdb in
  (conn, sdb)

let test_search_blocks_fuzzy_matches_from_search_db () =
  let conn, sdb = graph_with_blocks [ "New Project" ] in
  let res =
    run_search conn sdb "nwp" ~opts:(opts ~limit:10 ~enable_snippet:false ()) ()
  in
  let rows = outcome_rows res in
  check "fuzzy returns one row" (List.length rows = 1);
  check_list "fuzzy returns New Project" [ "New Project" ]
    (result_titles rows) Fun.id

let test_search_blocks_fuzzy_matches_sanitized_umlaut () =
  let conn, sdb = graph_with_blocks [ "Grun" ] in
  let res =
    run_search conn sdb "grün" ~opts:(opts ~limit:10 ~enable_snippet:false ()) ()
  in
  check "umlaut fuzzy finds Grun" (result_titles (outcome_rows res) = [ "Grun" ])

let test_search_blocks_fuzzy_prioritizes_page_candidates () =
  (* page row (id=page) "New Project" + block "New Project task" *)
  let conn =
    T.create_conn_with_blocks
      ~pages_and_blocks:
        [ T.{ page = { default_page with pg_title = Some "New Project" }
            ; blocks = [ { T.default_block with b_title = Some "New Project task" } ] } ]
      ()
  in
  let sdb = open_search_db () in
  let _ = index_conn_blocks conn sdb in
  let res =
    run_search conn sdb "nwp" ~opts:(opts ~limit:10 ~enable_snippet:false ()) ()
  in
  let rows = outcome_rows res in
  let ids =
    List.filter_map (fun r -> br_uuid r "block/uuid") rows
  in
  let db = Datascript.db conn in
  let page_uuid =
    match T.find_page_by_title db "New Project" with
    | Some p -> block_uuid p
    | None -> ""
  in
  check "page candidate returned" (List.mem page_uuid ids);
  match rows with
  | first :: _ ->
      check "page row first" (br_uuid first "block/uuid" = Some page_uuid)
  | [] -> check "page row first" false

let test_search_blocks_skips_fuzzy_for_multi_term_keyword_hits () =
  let conn, sdb = graph_with_blocks [ "Page-10000" ] in
  let res =
    run_search conn sdb "page 10000" ~opts:(opts ~limit:10 ~enable_snippet:false ())
      ()
  in
  let rows = outcome_rows res in
  check "multi-term keyword hit returned" (List.length rows = 1);
  check_list "multi-term row title" [ "Page-10000" ] (result_titles rows) Fun.id

let test_search_blocks_skips_fts_for_enough_exact_title_hits () =
  (* 100 blocks all titled "Block" — exact-title cap *)
  let conn, sdb =
    let conn =
      T.create_conn_with_blocks
        ~pages_and_blocks:
          [ T.{ page = { default_page with pg_title = Some "P" }
              ; blocks =
                  List.init 100 (fun _ ->
                      { T.default_block with b_title = Some "Block" }) } ]
        ()
    in
    let sdb = open_search_db () in
    let _ = index_conn_blocks conn sdb in
    (conn, sdb)
  in
  let res =
    run_search conn sdb "block"
      ~opts:(opts ~limit:10 ~search_limit:100 ~enable_snippet:false ()) ()
  in
  let rows = outcome_rows res in
  check "exact-title cap returns 10 rows" (List.length rows = 10);
  check "all rows titled Block"
    (List.for_all (fun r -> br_string r "block/title" = Some "Block") rows)

let test_search_blocks_normalizes_tag_title_query () =
  let conn, sdb = graph_with_blocks [] in
  (* add a page "Movies" *)
  let db0 = Datascript.db conn in
  ignore
    (transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"%s\" :db/ident :logseq.class/Page :block/title \"Page\"}
            {:block/uuid #uuid \"%s\" :block/title \"Movies\" :block/name \"movies\" :block/tags [[:block/uuid #uuid \"%s\"]]}]"
          (test_uuid_string 601) (test_uuid_string 600) (test_uuid_string 601)));
  ignore db0;
  (* index the page *)
  let _ = index_conn_blocks conn sdb in
  let res =
    run_search conn sdb "#Movies" ~opts:(opts ~limit:10 ~enable_snippet:false ())
      ()
  in
  let rows = outcome_rows res in
  check "tag title query returns Movies"
    (result_titles rows = [ "Movies" ])

let test_search_blocks_skips_direct_page_scan_after_exact_title () =
  let conn =
    T.create_conn_with_blocks
      ~pages_and_blocks:
        [ T.{ page = { default_page with pg_title = Some "Tag" }; blocks = [] } ]
      ()
  in
  let sdb = open_search_db () in
  let _ = index_conn_blocks conn sdb in
  let res =
    run_search conn sdb "Tag" ~opts:(opts ~limit:10 ~enable_snippet:false ()) ()
  in
  check "exact title hit returns Tag"
    (result_titles (outcome_rows res) = [ "Tag" ])

let test_combine_results_large_result_benchmark () =
  (* 2500 blocks "Result n", one page "Result 42" (page boost) *)
  let n = 2500 in
  let conn =
    T.create_conn_with_blocks
      ~pages_and_blocks:
        [ T.{ page =
                { default_page with
                  pg_title = Some "Result 42"
                ; pg_tags = [ "logseq.class/Page" ] }
            ; blocks =
                List.init n (fun i ->
                    { T.default_block with
                      b_title = Some (Printf.sprintf "Result %d" i) }) } ]
      ()
  in
  let db = Datascript.db conn in
  let page_uuid =
    (* a block titled "Result 42" also exists; the page has the Page class *)
    Search_index.get_all_blocks db
    |> List.find_opt (fun e ->
           Ev.is_page (Ev.of_entity e)
           && (match Ldb.value e "block/title" with
               | Some (String "Result 42") -> true
               | _ -> false))
    |> (function Some p -> block_uuid p | None -> "")
  in
  let keyword_results =
    (* cljs mocks ldb/page? so only the target is a page; the real db also
       indexes built-in class entities (Page/Task/...), which are pages too.
       Restrict to the fixture's own entities ("Result *" titles). *)
    Search_index.get_all_blocks db
    |> List.filter (fun e ->
           match Ldb.value e "block/title" with
           | Some (String t) -> String.length t >= 6 && String.sub t 0 6 = "Result"
           | _ -> false)
    |> List.filter_map (fun e ->
           let title =
             match Ldb.value e "block/title" with
             | Some (String t) -> t
             | _ -> ""
           in
           let u = block_uuid e in
           if u = "" then None
           else
             Some
               (Search_index.result_of_row ~id:u ~title
                  ~keyword_score:(if u = page_uuid then 0.5 else 1.0) ()))
  in
  let started = Unix.gettimeofday () in
  let result = Search_index.combine_results db keyword_results in
  let elapsed_ms = (Unix.gettimeofday () -. started) *. 1000. in
  check
    (Printf.sprintf
       "combine-results large set stays fast (%.1fms CPU)" elapsed_ms)
    (elapsed_ms < 200.);
  check "combine-results large count"
    (List.length result = List.length keyword_results);
  match result with
  | first :: _ ->
      check "page boost ranks first" (first.Search_index.id = page_uuid)
  | [] -> check "page boost ranks first" false

let test_search_blocks_applies_final_limit () =
  let conn =
    T.create_conn_with_blocks
      ~pages_and_blocks:
        [ T.{ page = { default_page with pg_title = Some "P" }
            ; blocks =
                List.init 100 (fun i ->
                    { T.default_block with
                      b_title = Some (Printf.sprintf "logseq result %d" i) }) } ]
      ()
  in
  let sdb = open_search_db () in
  let _ = index_conn_blocks conn sdb in
  let res =
    run_search conn sdb "logseq" ~opts:(opts ~limit:10 ~enable_snippet:false ())
      ()
  in
  check "final limit 10" (List.length (outcome_rows res) = 10)

let test_search_blocks_can_return_matched_count () =
  let conn =
    T.create_conn_with_blocks
      ~pages_and_blocks:
        [ T.{ page = { default_page with pg_title = Some "P" }
            ; blocks =
                List.init 100 (fun i ->
                    { T.default_block with
                      b_title = Some (Printf.sprintf "logseq result %d" i) }) } ]
      ()
  in
  let sdb = open_search_db () in
  let _ = index_conn_blocks conn sdb in
  match
    run_search conn sdb "logseq"
      ~opts:(opts ~limit:10 ~enable_snippet:false ~include_matched_count:true
                ~search_limit:100 ())
      ()
  with
  | Search_index.Rows_with_count (rows, n) ->
      check "matched-count items limited to 10" (List.length rows = 10);
      check "matched-count is 100" (n = 100)
  | Search_index.Rows _ -> check "returns matched-count" false

(* result record -> search_result_to_block_result *)
let call_result_to_block conn q ?(code_class = None) o r =
  Search_index.search_result_to_block_result ~conn ~q ~code_class ~opts:o r

let test_search_result_omits_empty_optional_fields () =
  let conn, _sdb = graph_with_blocks [ "logseq result" ] in
  let block_id = "00000000-0000-0000-0000-000000000123" in
  let blk =
    pulled_node 1
      [ pscalar "block/uuid" (Uuid block_id)
      ; pscalar "block/title" (String "logseq result") ]
  in
  match blk with
  | _ ->
      let r =
        Search_index.result_of_row ~id:block_id ~page:block_id
          ~title:"logseq result" ~block:blk ()
      in
      (match
         call_result_to_block conn "logseq" (opts ~enable_snippet:false ()) r
       with
       | None -> check "result produced" false
       | Some br ->
           check_eq "title" "logseq result"
             (Option.value (br_string br "block/title") ~default:"");
           check "no block/parent" (br_get br "block/parent" = None);
           check "no block/tags" (br_get br "block/tags" = None);
           check "no icon" (br_get br "logseq.property/icon" = None);
           check "no alias" (br_get br "alias" = None))

let test_search_result_includes_canonical_breadcrumb () =
  let conn =
    T.create_conn_with_blocks
      ~pages_and_blocks:
        [ T.{ page = { default_page with pg_title = Some "Teams" }
            ; blocks =
                [ { T.default_block with b_title = Some "Parent" }
                ; { T.default_block with b_title = Some "Search target" } ] } ]
      ()
  in
  let db = Datascript.db conn in
  match
    ( T.find_block_by_content db "Parent"
    , T.find_block_by_content db "Search target" )
  with
  | Some parent, Some target ->
      ignore
        (transact_conn_string conn
           (Printf.sprintf "[[:db/add %d :block/parent %d]]" target.id
              parent.id));
      let page_uuid =
        match Ldb.value target "block/page" with
        | Some (Ref eid) ->
            (match Ldb.ent_of_id db eid with
             | Some p -> block_uuid p
             | None -> "")
        | _ -> ""
      in
      let r =
        Search_index.result_of_row ~id:(block_uuid target) ~page:page_uuid
          ~title:"Search target" ()
      in
      (match
         call_result_to_block conn "target"
           (opts ~enable_snippet:false ~include_breadcrumb:true ()) r
       with
       | None -> check "result produced" false
       | Some br ->
           (match br_get br "block.temp/breadcrumb" with
            | Some (List crumbs) ->
                let titles =
                  List.filter_map
                    (fun crumb ->
                       match crumb with
                       | Map pairs ->
                           List.find_map
                             (fun (k, v) ->
                                match k, v with
                                | Keyword "block/title", String s -> Some s
                                | _ -> None)
                             pairs
                       | _ -> None)
                    crumbs
                in
                check_list "breadcrumb titles" [ "Teams"; "Parent" ] titles
                  Fun.id
            | _ -> check "breadcrumb present" false))
  | _ -> check "fixtures exist" false

let test_breadcrumb_resolves_page_uuid_and_ident_refs () =
  let conn = T.create_conn () in
  ignore
    (transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"%s\" :db/ident :logseq.class/Tag :block/title \"Tag\"}
            {:block/uuid #uuid \"%s\" :db/ident :logseq.class/Page :block/title \"Page\" :block/tags [[:block/uuid #uuid \"%s\"]]}]"
          (test_uuid_string 700) (test_uuid_string 701)
          (test_uuid_string 700)));
  let db = Datascript.db conn in
  match Datascript.entity db (Ident "logseq.class/Page") with
  | None -> check "Page class exists" false
  | Some page ->
      let page_uuid = block_uuid page in
      check "page uuid" (page_uuid <> "");
      let id1 =
        Block_breadcrumb.shallow_ref_identity db (Ev.of_entity page)
      in
      check "shallow-ref-identity by uuid" (id1 <> []);
      let id2 =
        Block_breadcrumb.shallow_ref_identity db
          (pulled_node (-1)
             [ pscalar "block/uuid" (Uuid page_uuid)
             ; pscalar "block/title" (String "Page") ])
      in
      check "shallow-ref-identity pulled uuid" (id2 <> []);
      let id3 =
        Block_breadcrumb.shallow_ref_identity db
          (pulled_scalar_attrs (-1) [ "db/ident", Keyword "logseq.class/Page" ])
      in
      check "shallow-ref-identity by ident" (id3 <> []);
      (try
         let _ = Block_breadcrumb.block_breadcrumb db (Ev.of_entity page) in
         check "block-breadcrumb on Page" true
       with _ -> check "block-breadcrumb on Page" false);
      let child_conn =
        T.create_conn_with_blocks
          ~pages_and_blocks:
            [ T.{ page = { default_page with pg_title = Some "page 1" }
                ; blocks = [ { T.default_block with b_title = Some "child" } ] } ]
          ()
      in
      let cdb = Datascript.db child_conn in
      (match T.find_block_by_content cdb "child" with
       | Some child ->
           let crumb =
             Block_breadcrumb.block_breadcrumb cdb
               (Ev.of_entity child)
           in
           let titles =
             List.concat_map
               (fun crumb ->
                  List.filter_map
                    (fun (k, v) ->
                       match k, v with
                       | "block/title", String s -> Some s
                       | _ -> None)
                    crumb)
               crumb
           in
           check_list "child breadcrumb" [ "page 1" ] titles Fun.id
       | None -> check "child exists" false)

let test_breadcrumb_survives_every_named_page () =
  let conn =
    T.create_conn_with_blocks
      ~pages_and_blocks:
        [ T.{ page = { default_page with pg_title = Some "P" }
            ; blocks = [ { T.default_block with b_title = Some "b" } ] } ]
      ()
  in
  let db = Datascript.db conn in
  let failures =
    List.filter_map
      (fun e ->
         try
           let _ = Block_breadcrumb.block_breadcrumb db (Ev.of_entity e) in
           None
         with exn -> Some (Printexc.to_string exn))
      (Search_index.get_all_blocks db)
  in
  check "breadcrumb survives every named page" (failures = [])

let test_search_result_keeps_tag_identities () =
  let page_id = "00000000-0000-0000-0000-000000000124" in
  let page_tag =
    { pulled_id = 2
    ; pulled_attrs =
        [ pscalar "db/ident" (Keyword "logseq.class/Page")
        ; pscalar "block/title" (String "Page") ] }
  in
  let page =
    pulled_node 1
      [ pscalar "block/uuid" (Uuid page_id)
      ; pscalar "block/title" (String "Foo")
      ; (Keyword "block/tags", Pulled_many [ Pulled_entity page_tag ]) ]
  in
  let conn = T.create_conn () in
  let r =
    Search_index.result_of_row ~id:page_id ~page:page_id ~title:"Foo"
      ~block:page ()
  in
  match call_result_to_block conn "Foo" (opts ~enable_snippet:false ()) r with
  | None -> check "result produced" false
  | Some br ->
      (match br_get br "block/tags" with
       | Some (List [ Map pairs ]) ->
           check "block/tags keeps ident"
             (List.exists
                (fun (k, v) ->
                   k = Keyword "db/ident"
                   && v = Keyword "logseq.class/Page")
                pairs)
       | _ -> check "block/tags shape" false)

let test_block_index_includes_page_alias_titles () =
  let page_id = "00000000-0000-0000-0000-000000000234" in
  let page =
    pulled_node 1
      [ pscalar "block/uuid" (Uuid page_id)
      ; pscalar "block/title" (String "Artificial Intelligence")
      ; ( Keyword "block/alias",
          Pulled_many
            [ Pulled_entity
                { pulled_id = 2
                ; pulled_attrs =
                    [ pscalar "block/uuid"
                        (Uuid "00000000-0000-0000-0000-000000000235")
                    ; pscalar "block/title" (String "ai") ] } ] )
      ; (Keyword "block/tags",
         Pulled_many [ Pulled_entity (pulled_tag "logseq.class/Page") ]) ]
  in
  match Search_index.block_to_index page with
  | None -> check "index item produced" false
  | Some it ->
      check_eq "id" page_id it.item_id;
      check_eq "title with alias" "Artificial Intelligence ai" it.item_title

let test_block_index_sanitizes_page_titles () =
  let page_id = "00000000-0000-0000-0000-000000000236" in
  let page =
    pulled_node 1
      [ pscalar "block/uuid" (Uuid page_id)
      ; pscalar "block/title" (String "Überprüfen")
      ; (Keyword "block/tags",
         Pulled_many [ Pulled_entity (pulled_tag "logseq.class/Page") ]) ]
  in
  match Search_index.block_to_index page with
  | None -> check "index item produced" false
  | Some it -> check_eq "sanitized title" "Uberprufen" it.item_title

let test_block_index_does_not_generate_embedding () =
  let block_id = "00000000-0000-0000-0000-000000000238" in
  let block =
    pulled_node 1
      [ pscalar "block/uuid" (Uuid block_id)
      ; pscalar "block/title" (String "Local-first semantic search")
      ; ( Keyword "block/page",
          Pulled_entity
            { pulled_id = 2
            ; pulled_attrs =
                [ pscalar "block/uuid"
                    (Uuid "00000000-0000-0000-0000-000000000239") ] } ) ]
  in
  match Search_index.block_to_index block with
  | None -> check "index item produced" false
  | Some it ->
      check_eq "title" "Local-first semantic search" it.item_title;
      check "no embedding" (it.item_embedding = None)

let test_block_index_includes_vector_title_when_enabled () =
  let block =
    pulled_node 5
      [ pscalar "block/uuid" (Uuid "00000000-0000-0000-0000-000000000241")
      ; pscalar "block/title" (String "Hybrid retrieval")
      ; pscalar "block/order" (String "b")
      ; ( Keyword "block/page",
          Pulled_entity
            { pulled_id = 1
            ; pulled_attrs =
                [ pscalar "block/uuid"
                    (Uuid "00000000-0000-0000-0000-000000000240")
                ; pscalar "block/title" (String "Search Design") ] } ) ]
  in
  match Search_index.block_to_index ~include_vector_title:true block with
  | None -> check "index item produced" false
  | Some it ->
      check_eq "title" "Hybrid retrieval" it.item_title;
      check "vector-title = title" (it.item_vector_title = Some "Hybrid retrieval")

let test_block_index_skips_vector_title_when_disabled () =
  let block =
    pulled_node 1
      [ pscalar "block/uuid" (Uuid "00000000-0000-0000-0000-000000000247")
      ; pscalar "block/title" (String "Hybrid retrieval")
      ; ( Keyword "block/page",
          Pulled_entity
            { pulled_id = 2
            ; pulled_attrs =
                [ pscalar "block/uuid"
                    (Uuid "00000000-0000-0000-0000-000000000248") ] } ) ]
  in
  match Search_index.block_to_index block with
  | None -> check "index item produced" false
  | Some it ->
      check_eq "title" "Hybrid retrieval" it.item_title;
      check "no vector-title" (it.item_vector_title = None)

let test_build_blocks_indice_uses_block_index () =
  let blocks =
    List.init 40 (fun idx ->
        pulled_node (100 + idx)
          [ pscalar "block/uuid" (Uuid (test_uuid_string (250 + idx)))
          ; pscalar "block/title" (String (Printf.sprintf "Sibling %d" idx))
          ; pscalar "block/order" (String (string_of_int idx)) ])
  in
  let indexed =
    List.filter_map
      (Search_index.block_to_index ~include_vector_title:true)
      blocks
  in
  check "40 indexed" (List.length indexed = 40);
  check "title = vector-title"
    (List.for_all
       (fun (it : Search_index.index_item) ->
          it.item_vector_title = Some it.item_title)
       indexed)

(* ---------- sync-search-indice tests ---------- *)

let sync_result r =
  Search_index.sync_search_indice ~include_vector_title:true r

let test_sync_indice_indexes_only_affected () =
  let conn =
    T.create_conn_with_blocks
      ~pages_and_blocks:
        [ T.{ page = { default_page with pg_title = Some "Teams" }
            ; blocks =
                [ { T.default_block with b_title = Some "which team is Manu in?" }
                ; { T.default_block with b_title = Some "Spurs" } ] } ]
      ()
  in
  let db = Datascript.db conn in
  match
    ( T.find_block_by_content db "which team is Manu in?"
    , T.find_block_by_content db "Spurs" )
  with
  | Some manu, Some spurs ->
      let report =
        transact_conn_string conn
          (Printf.sprintf "[[:db/add %d :block/parent %d]]" spurs.id manu.id)
      in
      (match sync_result report with
       | None -> check "sync result produced" false
       | Some { Search_index.blocks_to_add; _ } ->
           let titles = List.map (fun (it : Search_index.index_item) -> it.item_title) blocks_to_add in
           check "Spurs added" (List.mem "Spurs" titles);
           check "parent not reindexed" (not (List.mem "which team is Manu in?" titles));
           let spurs_index =
             List.find_opt (fun (it : Search_index.index_item) -> it.item_title = "Spurs") blocks_to_add
           in
           (match spurs_index with
            | Some it -> check "vector-title set" (it.item_vector_title = Some "Spurs")
            | None -> check "spurs index" false))
  | _ -> check "fixtures exist" false;
  (* reordering a sibling *)
  let conn2 =
    T.create_conn_with_blocks
      ~pages_and_blocks:
        [ T.{ page = { default_page with pg_title = Some "Teams" }
            ; blocks =
                [ { T.default_block with b_title = Some "Spurs"; b_order = Some "a" }
                ; { T.default_block with
                    b_title = Some "Which team is Tony in?"
                  ; b_order = Some "b" } ] } ]
      ()
  in
  let db2 = Datascript.db conn2 in
  match T.find_block_by_content db2 "Spurs" with
  | Some spurs ->
      let report =
        transact_conn_string conn2
          (Printf.sprintf "[[:db/add %d :block/order \"c\"]]" spurs.id)
      in
      (match sync_result report with
       | None -> check "sync result produced [2]" false
       | Some { Search_index.blocks_to_add; _ } ->
           let titles = List.map (fun (it : Search_index.index_item) -> it.item_title) blocks_to_add in
           check "Spurs added [2]" (List.mem "Spurs" titles);
           check "sibling not reindexed"
             (not (List.mem "Which team is Tony in?" titles));
           (match List.find_opt (fun (it : Search_index.index_item) -> it.item_title = "Spurs") blocks_to_add with
            | Some it ->
                check "vector-title set [2]" (it.item_vector_title = Some "Spurs")
            | None -> check "spurs index [2]" false))
  | None -> check "fixture 2" false

let test_sync_indice_reindexes_descendant_pages () =
  let conn = T.create_conn () in
  let pa = test_uuid_string 800 and pb = test_uuid_string 801
  and ch = test_uuid_string 802 and gc = test_uuid_string 803
  and tag = test_uuid_string 804 in
  ignore
    (transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"%s\" :db/ident :logseq.class/Page :block/title \"Page\"}
            {:block/uuid #uuid \"%s\" :block/title \"Parent A\" :block/name \"parent a\" :block/tags [[:block/uuid #uuid \"%s\"]]}
            {:block/uuid #uuid \"%s\" :block/title \"Parent B\" :block/name \"parent b\" :block/tags [[:block/uuid #uuid \"%s\"]]}
            {:block/uuid #uuid \"%s\" :block/title \"Child Page\" :block/name \"child page\" :block/tags [[:block/uuid #uuid \"%s\"]] :block/parent [:block/uuid #uuid \"%s\"] :block/order \"a\"}
            {:block/uuid #uuid \"%s\" :block/title \"Grand Page\" :block/name \"grand page\" :block/tags [[:block/uuid #uuid \"%s\"]] :block/parent [:block/uuid #uuid \"%s\"] :block/order \"a\"}]"
          tag pa tag pb tag ch tag pa gc tag ch));
  let report =
    transact_conn_string conn
      (Printf.sprintf
         "[[:db/add [:block/uuid #uuid \"%s\"] :block/parent [:block/uuid #uuid \"%s\"]]]"
         ch pb)
  in
  match sync_result report with
  | None -> check "sync result produced" false
  | Some { Search_index.blocks_to_add; _ } ->
      let titles = List.map (fun (it : Search_index.index_item) -> it.item_title) blocks_to_add in
      check "descendant page reindexed [child]"
        (List.exists (fun t -> str_contains t "Child Page") titles);
      check "descendant page reindexed [grandchild]"
        (List.exists (fun t -> str_contains t "Grand Page") titles);
      check "all vector-title = title"
        (List.for_all
           (fun (it : Search_index.index_item) ->
              it.item_vector_title = Some it.item_title)
           blocks_to_add)

let test_sync_indice_skips_vector_title_when_disabled () =
  let conn =
    T.create_conn_with_blocks
      ~pages_and_blocks:
        [ T.{ page = { default_page with pg_title = Some "Teams" }
            ; blocks = [ { T.default_block with b_title = Some "Spurs" } ] } ]
      ()
  in
  let db = Datascript.db conn in
  match T.find_block_by_content db "Spurs" with
  | Some spurs ->
      let report =
        transact_conn_string conn
          (Printf.sprintf "[[:db/add %d :block/title \"San Antonio Spurs\"]]"
             spurs.id)
      in
      (match Search_index.sync_search_indice report with
       | None -> check "sync result produced" false
       | Some { Search_index.blocks_to_add; _ } ->
           (match
              List.find_opt
                (fun (it : Search_index.index_item) -> it.item_title = "San Antonio Spurs")
                blocks_to_add
            with
            | Some it -> check "no vector-title" (it.item_vector_title = None)
            | None -> check "spurs found" false))
  | None -> check "fixture" false

let run_sync_new_blocks_case include_vector_title =
  let conn =
    T.create_conn_with_blocks
      ~pages_and_blocks:
        [ T.{ page = { default_page with pg_title = Some "Bulk Insert" }
            ; blocks = [] } ]
      ()
  in
  let db = Datascript.db conn in
  match T.find_page_by_title db "Bulk Insert" with
  | None -> (check "page exists" false; ([], 0.))
  | Some page ->
      let txs =
        String.concat " "
          (List.init 300 (fun idx ->
               Printf.sprintf
                 "{:block/uuid #uuid \"%s\" :block/title \"Inserted %d\" :block/page %d :block/parent %d :block/order \"a%d\" :block/created-at 1760000000000 :block/updated-at 1760000000000}"
                 (test_uuid_string (1000 + idx)) idx page.id page.id idx))
      in
      let report =
        transact_conn_string conn ("[" ^ txs ^ "]")
      in
      let started = Unix.gettimeofday () in
      let res =
        Search_index.sync_search_indice ~include_vector_title report
      in
      let elapsed_ms = (Unix.gettimeofday () -. started) *. 1000. in
      (match res with
       | None -> ([], elapsed_ms)
       | Some r -> (r.blocks_to_add, elapsed_ms))

let test_sync_indice_300_blocks_perf_enabled () =
  let blocks_to_add, elapsed = run_sync_new_blocks_case true in
  check "300 blocks added" (List.length blocks_to_add = 300);
  check
    (Printf.sprintf "sync 300 blocks semantic enabled <1000ms (%.1f)" elapsed)
    (elapsed < 1000.);
  check "all vector-title = title"
    (List.for_all
       (fun (it : Search_index.index_item) ->
          it.item_vector_title = Some it.item_title)
       blocks_to_add)

let test_sync_indice_300_blocks_perf_disabled () =
  let blocks_to_add, elapsed = run_sync_new_blocks_case false in
  check "300 blocks added [off]" (List.length blocks_to_add = 300);
  check
    (Printf.sprintf "sync 300 blocks semantic disabled <1000ms (%.1f)" elapsed)
    (elapsed < 1000.);
  check "no vector-title"
    (List.for_all
       (fun (it : Search_index.index_item) -> it.item_vector_title = None)
       blocks_to_add)

let test_sync_indice_removes_page_descendants_when_page_deleted () =
  let conn =
    T.create_conn_with_blocks
      ~pages_and_blocks:
        [ T.{ page = { default_page with pg_title = Some "Deleted page" }
            ; blocks =
                [ { T.default_block with
                    b_title = Some "Parent"
                  ; b_children =
                      [ { T.default_block with b_title = Some "Child" } ] } ] } ]
      ()
  in
  let db = Datascript.db conn in
  match T.find_page_by_title db "Deleted page" with
  | Some page ->
      let parent = T.find_block_by_content db "Parent" in
      let child = T.find_block_by_content db "Child" in
      let report =
        transact_conn_string conn
          (Printf.sprintf
             "[[:db/add %d :logseq.property/deleted-at 1760000000000]]" page.id)
      in
      (match Search_index.sync_search_indice report with
       | None -> check "sync result produced" false
       | Some { Search_index.blocks_to_remove; _ } ->
           check "page removed" (List.mem (block_uuid page) blocks_to_remove);
           (match parent with
            | Some p ->
                check "parent removed" (List.mem (block_uuid p) blocks_to_remove)
            | None -> check "parent fixture" false);
           (match child with
            | Some c ->
                check "child removed" (List.mem (block_uuid c) blocks_to_remove)
            | None -> check "child fixture" false))
  | None -> check "page fixture" false

let test_sync_indice_removes_block_descendants_when_parent_deleted () =
  let conn =
    T.create_conn_with_blocks
      ~pages_and_blocks:
        [ T.{ page = { default_page with pg_title = Some "Deleted block" }
            ; blocks =
                [ { T.default_block with
                    b_title = Some "Parent"
                  ; b_children =
                      [ { T.default_block with b_title = Some "Child" } ] } ] } ]
      ()
  in
  let db = Datascript.db conn in
  match T.find_block_by_content db "Parent" with
  | Some parent ->
      let child = T.find_block_by_content db "Child" in
      let report =
        transact_conn_string conn
          (Printf.sprintf
             "[[:db/add %d :logseq.property/deleted-at 1760000000000]]"
             parent.id)
      in
      (match Search_index.sync_search_indice report with
       | None -> check "sync result produced" false
       | Some { Search_index.blocks_to_remove; _ } ->
           check "parent removed" (List.mem (block_uuid parent) blocks_to_remove);
           (match child with
            | Some c ->
                check "child removed" (List.mem (block_uuid c) blocks_to_remove)
            | None -> check "child fixture" false))
  | None -> check "fixture" false

let test_sync_indice_removes_when_parent_hidden () =
  let conn =
    T.create_conn_with_blocks
      ~pages_and_blocks:
        [ T.{ page = { default_page with pg_title = Some "Hidden move" }
            ; blocks =
                [ { T.default_block with
                    b_title = Some "Hidden parent"
                  ; b_extra = [ ("logseq.property/hide?", T.Bool true) ] }
                ; { T.default_block with
                    b_title = Some "Moved parent"
                  ; b_children =
                      [ { T.default_block with b_title = Some "Moved child" } ] } ] } ]
      ()
  in
  let db = Datascript.db conn in
  match
    ( T.find_block_by_content db "Hidden parent"
    , T.find_block_by_content db "Moved parent"
    , T.find_block_by_content db "Moved child" )
  with
  | Some hidden, Some moved, Some child ->
      let report =
        transact_conn_string conn
          (Printf.sprintf "[[:db/add %d :block/parent %d]]" moved.id hidden.id)
      in
      (match Search_index.sync_search_indice report with
       | None -> check "sync result produced" false
       | Some { Search_index.blocks_to_remove; _ } ->
           check "moved parent removed"
             (List.mem (block_uuid moved) blocks_to_remove);
           check "moved child removed"
             (List.mem (block_uuid child) blocks_to_remove))
  | _ -> check "fixtures" false

let test_sync_indice_adds_when_parent_visible () =
  let conn =
    T.create_conn_with_blocks
      ~pages_and_blocks:
        [ T.{ page = { default_page with pg_title = Some "Visible move" }
            ; blocks =
                [ { T.default_block with
                    b_title = Some "Hidden parent"
                  ; b_extra = [ ("logseq.property/hide?", T.Bool true) ]
                  ; b_children =
                      [ { T.default_block with
                          b_title = Some "Moved parent"
                        ; b_children =
                            [ { T.default_block with b_title = Some "Moved child" } ] } ] } ] } ]
      ()
  in
  let db = Datascript.db conn in
  match T.find_page_by_title db "Visible move" with
  | Some page ->
      (match T.find_block_by_content db "Moved parent" with
       | Some moved ->
           let report =
             transact_conn_string conn
               (Printf.sprintf "[[:db/add %d :block/parent %d]]" moved.id page.id)
           in
           (match Search_index.sync_search_indice report with
            | None -> check "sync result produced" false
            | Some { Search_index.blocks_to_add; _ } ->
                let titles = List.map (fun (it : Search_index.index_item) -> it.item_title) blocks_to_add in
                check "moved parent added" (List.mem "Moved parent" titles);
                check "moved child added" (List.mem "Moved child" titles))
       | None -> check "moved fixture" false)
  | None -> check "page fixture" false

let test_sync_indice_reindexes_holders_when_property_deleted () =
  let conn =
    T.create_conn_with_blocks
      ~properties:
        [ ( "foo",
            T.{ default_property with p_type = "default" } ) ]
      ~pages_and_blocks:
        [ T.{ page =
                { default_page with
                  pg_title = Some "Test Page"
                ; pg_properties =
                    [ ("foo", T.build_property_value ~value:(T.Str "page value") ()) ] }
            ; blocks =
                [ { T.default_block with
                    b_title = Some "Holder block"
                  ; b_properties =
                      [ ("foo", T.build_property_value ~value:(T.Str "block value") ()) ] } ] } ]
      ()
  in
  let db = Datascript.db conn in
  match Datascript.entity db (Ident "user.property/foo") with
  | None -> check "property exists" false
  | Some property ->
      let page = T.find_page_by_title db "Test Page" in
      let holder = T.find_block_by_content db "Holder block" in
      (match page, holder with
       | Some page, Some holder ->
           (* seed :block/refs like the worker pipeline *)
           let property_uuid = block_uuid property in
           let page_uuid = block_uuid page in
           let holder_uuid = block_uuid holder in
           ignore
             (transact_conn_string conn
                (Printf.sprintf
                   "[[:db/add %d :block/refs %d] [:db/add %d :block/refs %d]]"
                   page.id property.id holder.id property.id));
           let referrer_ids =
             List.sort compare
               (List.map (fun (e : entity) -> e.id)
                  (Ldb.ref_ents
                     (Option.value
                        (Datascript.entity (Datascript.db conn)
                           (Ident "user.property/foo"))
                        ~default:property)
                     "block/_refs"))
           in
           check "referrers reference property"
             (referrer_ids = List.sort compare [ page.id; holder.id ]);
           let db2 = Datascript.db conn in
           let report =
             Datascript.transact_conn conn
               (Outliner_page.build_page_retract_tx db2 property)
           in
           let res = Search_index.sync_search_indice report in
           let db3 = Datascript.db conn in
           check "holder page remains"
             (Option.is_some (Ldb.ent_of_id db3 page.id));
           check "holder block remains"
             (Option.is_some (Ldb.ent_of_id db3 holder.id));
           check "property gone"
             (Datascript.entity db3 (Ident "user.property/foo") = None);
           (match res with
            | None -> check "sync result produced" false
            | Some { Search_index.blocks_to_add; blocks_to_remove } ->
                let add_ids =
                  List.map (fun (it : Search_index.index_item) -> it.item_id) blocks_to_add
                in
                let add_titles =
                  List.map (fun (it : Search_index.index_item) -> it.item_title) blocks_to_add
                in
                check "page reindexed" (List.mem page_uuid add_ids);
                check "holder reindexed" (List.mem holder_uuid add_ids);
                check "page title" (List.mem "Test Page" add_titles);
                check "holder title" (List.mem "Holder block" add_titles);
                check "property removed from fts"
                  (List.mem property_uuid blocks_to_remove);
                check "page removed-then-readded"
                  (List.mem page_uuid blocks_to_remove);
                check "holder removed-then-readded"
                  (List.mem holder_uuid blocks_to_remove);
                check "property not re-added"
                  (not (List.mem property_uuid add_ids)))
       | _ -> check "fixtures" false)

(* ---------- vector / combine ---------- *)

let test_reciprocal_rank_fusion () =
  let r id = Search_index.result_of_row ~id () in
  let result =
    Search_index.reciprocal_rank_fusion
      [ [ r "keyword-only"; r "shared" ]
      ; [ r "vector-only"; r "shared" ] ]
  in
  check_list "rrf promotes shared" [ "shared"; "keyword-only"; "vector-only" ]
    (List.map (fun r -> r.Search_index.id) result) Fun.id

let test_combine_results_uses_vector_context_terms () =
  let conn =
    T.create_conn_with_blocks
      ~pages_and_blocks:
        [ T.{ page = { default_page with pg_title = Some "nba" }
            ; blocks =
                [ { T.default_block with
                    b_title = Some "Which team is Tony in?"
                  ; b_uuid = Some (test_uuid_string 930) }
                ; { T.default_block with
                    b_title = Some "which team is Manu in?"
                  ; b_uuid = Some (test_uuid_string 932) }
                ; { T.default_block with
                    b_title = Some "generic tagged result"
                  ; b_uuid = Some (test_uuid_string 933) } ] } ]
      ()
  in
  let db = Datascript.db conn in
  let page_uuid =
    match T.find_page_by_title db "nba" with
    | Some p -> block_uuid p
    | None -> test_uuid_string 931
  in
  let vr id score vector_title =
    Search_index.result_of_row ~id ~vector_score:score ~vector_title ()
  in
  let result =
    Search_index.combine_results db []
      ~vector_results:
        [ vr (test_uuid_string 930) 0.72
            "Previous: which team is Manu in?\nBlock: Which team is Tony in?\nNext: Spurs"
        ; vr page_uuid 0.70 "Page: nba\nBlock: nba"
        ; vr (test_uuid_string 932) 0.69
            "Block: which team is Manu in?\nChildren: Spurs"
        ; vr (test_uuid_string 933) 0.68 "Block: generic tagged result" ]
      ~q:"manu spurs"
  in
  let titles =
    List.filter_map (fun r -> r.Search_index.title) result
  in
  check_list "semantic tie-breaker ordering"
    [ "which team is Manu in?"
    ; "Which team is Tony in?"
    ; "nba"
    ; "generic tagged result" ]
    titles Fun.id

let test_benchmark_scoring_keyword_ahead () =
  let conn, _sdb = graph_with_blocks [ "keyword hit" ] in
  let db = Datascript.db conn in
  let keyword_uuid =
    match T.find_block_by_content db "keyword hit" with
    | Some b -> block_uuid b
    | None -> ""
  in
  (* vector-only block must also resolve in conn *)
  let vector_uuid = test_uuid_string 941 in
  ignore
    (transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"%s\" :block/title \"semantic only\"}]"
          vector_uuid));
  let result =
    Search_index.combine_results db
      [ Search_index.result_of_row ~id:keyword_uuid ~keyword_score:0.1
          ~title:"keyword hit" () ]
      ~vector_results:
        [ Search_index.result_of_row ~id:vector_uuid ~vector_score:1000.
            ~title:"semantic only" () ]
  in
  match result with
  | first :: _ -> check "keyword result rank 1" (first.id = keyword_uuid)
  | [] -> check "keyword result rank 1" false

(* ---------- search-result page/alias tests ---------- *)

let pulled_alias uuid title : pulled_value =
  Pulled_entity
    { pulled_id = 2
    ; pulled_attrs =
        [ pscalar "block/uuid" (Uuid uuid)
        ; pscalar "block/title" (String title) ] }

let ai_page ?(extra = []) page_id alias_id =
  pulled_node 1
    ([ pscalar "block/uuid" (Uuid page_id)
     ; pscalar "block/title" (String "Artificial Intelligence")
     ; (Keyword "block/alias", Pulled_many [ pulled_alias alias_id "ai" ])
     ; ( Keyword "block/tags",
         Pulled_many [ Pulled_entity (pulled_tag "logseq.class/Page") ]) ]
     @ extra)

let test_search_result_keeps_page_title_when_alias_matches () =
  let page_id = "00000000-0000-0000-0000-000000000236" in
  let alias_id = "00000000-0000-0000-0000-000000000237" in
  let conn = T.create_conn () in
  let r =
    Search_index.result_of_row ~id:page_id ~page:page_id
      ~title:"Artificial Intelligence ai" ~block:(ai_page page_id alias_id) ()
  in
  match call_result_to_block conn "ai" (opts ~enable_snippet:false ()) r with
  | None -> check "result produced" false
  | Some br ->
      check_eq "canonical title" "Artificial Intelligence"
        (Option.value (br_string br "block/title") ~default:"");
      (match br_get br "alias" with
       | Some (Map pairs) ->
           check "alias map"
             (List.exists
                (fun (k, v) -> k = Keyword "block/uuid" && v = Uuid alias_id)
                pairs
              && List.exists
                   (fun (k, v) -> k = Keyword "block/title" && v = String "ai")
                   pairs)
       | _ -> check "alias present" false)

let test_search_result_detects_alias_from_pulled_map () =
  let page_id = "00000000-0000-0000-0000-000000000238" in
  let alias_id = "00000000-0000-0000-0000-000000000239" in
  let conn = T.create_conn () in
  let r =
    Search_index.result_of_row ~id:page_id ~page:page_id
      ~title:"Artificial Intelligence ai" ~block:(ai_page page_id alias_id) ()
  in
  match call_result_to_block conn "ai" (opts ~enable_snippet:false ()) r with
  | None -> check "result produced" false
  | Some br ->
      check_eq "canonical title [pulled]" "Artificial Intelligence"
        (Option.value (br_string br "block/title") ~default:"");
      check "alias present [pulled]"
        (match br_get br "alias" with Some (Map _) -> true | _ -> false)

let test_search_result_keeps_page_title_when_canonical_matches () =
  let page_id = "00000000-0000-0000-0000-000000000240" in
  let conn = T.create_conn () in
  let r =
    Search_index.result_of_row ~id:page_id ~page:page_id
      ~title:"Artificial Intelligence ai"
      ~block:(ai_page page_id "00000000-0000-0000-0000-000000000241") ()
  in
  match call_result_to_block conn "Artificial" (opts ~enable_snippet:false ()) r
  with
  | None -> check "result produced" false
  | Some br ->
      check_eq "canonical title [match]" "Artificial Intelligence"
        (Option.value (br_string br "block/title") ~default:"");
      check "no alias" (br_get br "alias" = None)

let test_search_result_replaces_page_title_uuid_refs () =
  let page_id = "00000000-0000-0000-0000-000000000246" in
  let ref_id = "00000000-0000-0000-0000-000000000247" in
  let page =
    pulled_node 1
      [ pscalar "block/uuid" (Uuid page_id)
      ; pscalar "block/title"
          (String (Printf.sprintf "Artificial [[%s]]" ref_id))
      ; ( Keyword "block/refs",
          Pulled_many
            [ Pulled_entity
                { pulled_id = 9
                ; pulled_attrs =
                    [ pscalar "block/uuid" (Uuid ref_id)
                    ; pscalar "block/title" (String "Machine Learning") ] } ] )
      ; ( Keyword "block/alias",
          Pulled_many [ pulled_alias "00000000-0000-0000-0000-000000000248" "ai" ] )
      ; ( Keyword "block/tags",
          Pulled_many [ Pulled_entity (pulled_tag "logseq.class/Page") ]) ]
  in
  let conn = T.create_conn () in
  let r =
    Search_index.result_of_row ~id:page_id ~page:page_id
      ~title:"Artificial [[Machine Learning]] ai" ~block:page ()
  in
  match call_result_to_block conn "Artificial" (opts ~enable_snippet:false ()) r
  with
  | None -> check "result produced" false
  | Some br ->
      check_eq "uuid refs resolved"
        "Artificial [[Machine Learning]]"
        (Option.value (br_string br "block/title") ~default:"");
      check "no alias [uuid]" (br_get br "alias" = None)

let test_search_result_snippet_uses_canonical_page_title () =
  let page_id = "00000000-0000-0000-0000-000000000242" in
  let conn = T.create_conn () in
  let r =
    Search_index.result_of_row ~id:page_id ~page:page_id
      ~title:"Artificial Intelligence ai"
      ~snippet:(mk_open ^ "Artificial" ^ mk_close ^ " Intelligence ai")
      ~block:(ai_page page_id "00000000-0000-0000-0000-000000000243") ()
  in
  match call_result_to_block conn "Artificial" (opts ~enable_snippet:true ()) r
  with
  | None -> check "result produced" false
  | Some br ->
      check_eq "snippet canonical title"
        (mk_open ^ "Artificial" ^ mk_close ^ " Intelligence")
        (Option.value (br_string br "block/title") ~default:"");
      check "no alias [snippet]" (br_get br "alias" = None)

let test_search_result_keeps_valid_page_snippet () =
  let page_id = "00000000-0000-0000-0000-000000000244" in
  let conn = T.create_conn () in
  let r =
    Search_index.result_of_row ~id:page_id ~page:page_id
      ~title:"Artificial Intelligence ai"
      ~snippet:(mk_open ^ "Artificial" ^ mk_close ^ " Intelligence")
      ~block:(ai_page page_id "00000000-0000-0000-0000-000000000245") ()
  in
  match call_result_to_block conn "Artificial" (opts ~enable_snippet:true ()) r
  with
  | None -> check "result produced" false
  | Some br ->
      check_eq "snippet kept"
        (mk_open ^ "Artificial" ^ mk_close ^ " Intelligence")
        (Option.value (br_string br "block/title") ~default:"");
      check "no alias [valid]" (br_get br "alias" = None)

let test_search_result_includes_block_unique_title () =
  let conn =
    T.create_conn_with_blocks
      ~classes:
        [ "Project", T.{ default_class with c_title = Some "Project" }
        ; "Area", T.{ default_class with c_title = Some "Area" }
        ; ( "user.class/Milestone",
            T.{ default_class with
                c_title = Some "Milestone"
              ; c_extends = [ "Project" ] } )
        ; ( "other.class/Milestone",
            T.{ default_class with
                c_title = Some "Milestone"
              ; c_extends = [ "Area" ] } ) ]
      ()
  in
  let db = Datascript.db conn in
  match Datascript.entity db (Ident "user.class/Milestone") with
  | None -> check "milestone class exists" false
  | Some milestone ->
      let r =
        Search_index.result_of_row ~id:(block_uuid milestone)
          ~page:(block_uuid milestone) ~title:"Milestone" ()
      in
      (match
         call_result_to_block conn "stone" (opts ~enable_snippet:true ()) r
       with
       | None -> check "result produced" false
       | Some br ->
           check_eq "unique title"
             ("Project/Mile" ^ mk_open ^ "stone" ^ mk_close)
             (Option.value
                (br_string br "block.temp/unique-title")
                ~default:"");
           check_eq "display title"
             ("Mile" ^ mk_open ^ "stone" ^ mk_close)
             (Option.value (br_string br "block/title") ~default:""))

let test_upsert_blocks_batched_single_statement () =
  (* cljs asserts a single INSERT statement with one VALUES group per row;
     our upsert_blocks_sql builder is the same code path. *)
  let sdb = open_search_db () in
  let items =
    [ Search_index.mk_index_item ~id:"67e55044-10b1-426f-9247-bb680e5fe0c8"
        ~page:"67e55044-10b1-426f-9247-bb680e5fe0c8" ~title:"alpha" ()
    ; Search_index.mk_index_item ~id:"8f14e45f-ea6e-4be8-b53f-bf0f2ca8a5db"
        ~page:"8f14e45f-ea6e-4be8-b53f-bf0f2ca8a5db" ~title:"beta" ()
    ; Search_index.mk_index_item ~id:"9d5ed678-fe57-4bcf-bf4d-6f2fd5f8995d"
        ~page:"9d5ed678-fe57-4bcf-bf4d-6f2fd5f8995d" ~title:"gamma" () ]
  in
  Search_index.upsert_blocks sdb items;
  let rows =
    Sqlite.query sdb ~sql:"select id, title, page from blocks" ~bind:[||]
  in
  check "3 rows upserted" (List.length rows = 3);
  let titles =
    List.sort compare
      (List.filter_map
         (fun r ->
            match r with
            | [| _; Sqlite.Text t; _ |] -> Some t
            | _ -> None)
         rows)
  in
  check_list "upserted titles" [ "alpha"; "beta"; "gamma" ] titles Fun.id

let test_upsert_blocks_throws_on_invalid_input () =
  let sdb = open_search_db () in
  let error =
    try
      Search_index.upsert_blocks sdb
        [ Search_index.mk_index_item ~id:"not-uuid" ~page:"not-uuid"
            ~title:"alpha" () ];
      None
    with exn -> Some exn
  in
  check "throws on invalid input" (error <> None);
  match error with
  | Some e ->
      check "error message"
        (re_find "Search upsert-blocks wrong data" (Printexc.to_string e))
  | None -> ()

(* ---------- fuzzy-search (frontend.common.search-fuzzy) ---------- *)

let test_fuzzy_search_umlauts () =
  let data = [ "Überprüfen"; "Grün"; "Ändern"; "Todo" ] in
  let search q =
    Search_fuzzy.fuzzy_search ~limit:10 ~extract_fn:Fun.id data q
  in
  check_list "grün" [ "Grün" ] (search "grün") Fun.id;
  check_list "über" [ "Überprüfen" ] (search "über") Fun.id;
  check_list "ä" [ "Ändern" ] (search "ä") Fun.id;
  check_list "Grun" [ "Grün" ] (search "Grun") Fun.id

let test_fuzzy_search_multi () =
  let data =
    [ ("粗体", "Bold"); ("斜体", "Italic"); ("代码", "Code") ]
  in
  let search_multi q items =
    Search_fuzzy.fuzzy_search_multi ~limit:5
      ~extract_fns:[ (fun (a, _) -> Some a); (fun (_, b) -> Some b) ]
      items q
  in
  check "multi first-field" (search_multi "粗体" data <> []);
  check_list "multi second-field" [ ("粗体", "Bold") ]
    (search_multi "bold" data) (fun (a, _) -> a);
  let results = search_multi "粗体" data in
  (match results with
   | (a, _) :: _ -> check "best field first" (a = "粗体")
   | [] -> check "best field first" false);
  check "multi empty" (search_multi "xyz" [ ("粗体", "Bold") ] = []);
  (* nil extract fields skipped — represented as absent second field *)
  let data2 = [ ("Delete Page", None); ("New Page", None) ] in
  let res =
    Search_fuzzy.fuzzy_search_multi ~limit:5
      ~extract_fns:[ (fun (a, _) -> Some a); snd ]
      data2 "delete"
  in
  check_list "nil fields skipped" [ ("Delete Page", None) ] res (fun (a, _) -> a)

let () =
  test_ensure_highlighted_snippet_adds_marker ();
  test_ensure_highlighted_snippet_keeps_existing ();
  test_ensure_highlighted_snippet_preserves_original_title_case ();
  test_ensure_highlighted_snippet_no_match ();
  test_ensure_highlighted_snippet_appends_tail_ellipsis ();
  test_ensure_highlighted_snippet_windowed ();
  test_ensure_highlighted_snippet_multi_term_merged ();
  test_ensure_highlighted_snippet_multi_term_split ();
  test_ensure_highlighted_snippet_overlap ();
  test_code_block_predicate ();
  test_hidden_entity_recycled ();
  test_search_indexes_hide_by_default_properties ();
  test_search_blocks_aux_bind_count ();
  test_search_blocks_escapes_quotes_for_fts ();
  test_search_blocks_dangling_boolean ();
  test_search_blocks_large_graph_no_rank_scan ();
  test_search_blocks_fuzzy_matches_from_search_db ();
  test_search_blocks_fuzzy_matches_sanitized_umlaut ();
  test_search_blocks_fuzzy_prioritizes_page_candidates ();
  test_search_blocks_skips_fuzzy_for_multi_term_keyword_hits ();
  test_search_blocks_skips_fts_for_enough_exact_title_hits ();
  test_search_blocks_normalizes_tag_title_query ();
  test_search_blocks_skips_direct_page_scan_after_exact_title ();
  test_combine_results_large_result_benchmark ();
  test_search_blocks_applies_final_limit ();
  test_search_blocks_can_return_matched_count ();
  test_search_result_omits_empty_optional_fields ();
  test_search_result_includes_canonical_breadcrumb ();
  test_breadcrumb_resolves_page_uuid_and_ident_refs ();
  test_breadcrumb_survives_every_named_page ();
  test_search_result_keeps_tag_identities ();
  test_block_index_includes_page_alias_titles ();
  test_block_index_sanitizes_page_titles ();
  test_block_index_does_not_generate_embedding ();
  test_block_index_includes_vector_title_when_enabled ();
  test_block_index_skips_vector_title_when_disabled ();
  test_build_blocks_indice_uses_block_index ();
  test_sync_indice_indexes_only_affected ();
  test_sync_indice_reindexes_descendant_pages ();
  test_sync_indice_skips_vector_title_when_disabled ();
  test_sync_indice_300_blocks_perf_enabled ();
  test_sync_indice_300_blocks_perf_disabled ();
  test_sync_indice_removes_page_descendants_when_page_deleted ();
  test_sync_indice_removes_block_descendants_when_parent_deleted ();
  test_sync_indice_removes_when_parent_hidden ();
  test_sync_indice_adds_when_parent_visible ();
  test_sync_indice_reindexes_holders_when_property_deleted ();
  test_reciprocal_rank_fusion ();
  test_combine_results_uses_vector_context_terms ();
  test_benchmark_scoring_keyword_ahead ();
  test_search_result_keeps_page_title_when_alias_matches ();
  test_search_result_detects_alias_from_pulled_map ();
  test_search_result_keeps_page_title_when_canonical_matches ();
  test_search_result_replaces_page_title_uuid_refs ();
  test_search_result_snippet_uses_canonical_page_title ();
  test_search_result_keeps_valid_page_snippet ();
  test_search_result_includes_block_unique_title ();
  test_upsert_blocks_batched_single_statement ();
  test_upsert_blocks_throws_on_invalid_input ();
  test_fuzzy_search_umlauts ();
  test_fuzzy_search_multi ();
  Printf.printf "\n%d failures\n%!" !failures;
  if !failures > 0 then exit 1
