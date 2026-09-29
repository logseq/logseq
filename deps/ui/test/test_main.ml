(* Pure-logic unit tests for deps/ui, compiled by Melange and run under
   node: node _build/default/test/ui_test/test/ui_test/test_main.js *)

let checks = ref 0
let failures = ref 0

let check name cond =
  incr checks;
  if not cond then (
    incr failures;
    Js.log ("FAIL: " ^ name))

let eq name expected actual to_string =
  check
    (name ^ " (expected " ^ to_string expected ^ ", got " ^ to_string actual
   ^ ")")
    (expected = actual)

let eqs name expected actual = eq name expected actual Fun.id
let eqi name expected actual = eq name expected actual string_of_int

(* ---- helpers ---- *)

let block ?(children = []) uuid title : Model.block =
  { Model.block_uuid = Some uuid
  ; block_db_id = None
  ; block_title = title
  ; block_level = 1
  ; block_tag_ids = []
  ; block_tags = []
  ; block_tag_uuids = []
  ; block_tag_idents = []
  ; block_children = children
  ; block_page_name = None
  ; block_reactions = []
  ; block_is_comments_area = false
  ; block_is_comment = false
  ; block_comment_targets = 0
  ; block_link = None
  ; block_embed_children = []
  ; block_is_page = false
  ; block_heading = None
  ; block_default_collapsed = false
  ; block_asset_type = None
  ; block_asset_url = None
  ; block_asset_width = None
  ; block_asset_height = None
  ; block_asset_resize = None
  ; block_asset_align = None
  ; block_display_type = None
  ; block_order_list = None
  ; block_order_index = None
  ; block_code_lang = None
  }

let page blocks : Model.page =
  { Model.page_title = "p"
  ; page_uuid = Some "p"
  ; page_db_id = None
  ; page_is_tag = false
  ; page_is_property = false
  ; page_icon = None
  ; page_journal_day = None
  ; page_is_library = false
  ; page_internal = false
  ; page_built_in = false
  ; page_add_object = false
  ; page_tags = []
  ; page_tag_idents = []
  ; page_blocks = blocks
  ; page_linked_refs = []
  ; page_parents = []
  }

let titles (p : Model.page) =
  List.map (fun (b : Model.block) -> b.block_title) p.page_blocks

(* ---- Model.move_selected_top_blocks ---- *)

let test_move () =
  let p = page [ block "a" "1"; block "b" "2"; block "c" "3"; block "d" "4" ] in
  (* move [c,d] up swaps with the preceding block -> [1,3,4,2] *)
  let up = Model.move_selected_top_blocks p [ "c"; "d" ] true in
  eq "move pair up" [ "1"; "3"; "4"; "2" ] (titles up)
    (String.concat ",");
  (* moving up again reaches the top *)
  let top2 = Model.move_selected_top_blocks up [ "c"; "d" ] true in
  eq "move pair up twice" [ "3"; "4"; "1"; "2" ] (titles top2)
    (String.concat ",");
  (* third up at the top is a no-op *)
  let top3 = Model.move_selected_top_blocks top2 [ "c"; "d" ] true in
  eq "move at top is no-op" [ "3"; "4"; "1"; "2" ] (titles top3)
    (String.concat ",");
  (* move [a,b] down swaps with the following block -> [3,1,2,4] *)
  let down = Model.move_selected_top_blocks p [ "a"; "b" ] false in
  eq "move pair down" [ "3"; "1"; "2"; "4" ] (titles down)
    (String.concat ",");
  (* single element up *)
  let one = Model.move_selected_top_blocks p [ "b" ] true in
  eq "move single up" [ "2"; "1"; "3"; "4" ] (titles one)
    (String.concat ",");
  (* top block cannot move up *)
  let top = Model.move_selected_top_blocks p [ "a" ] true in
  eq "top cannot move up" [ "1"; "2"; "3"; "4" ] (titles top)
    (String.concat ",");
  (* bottom block cannot move down *)
  let bot = Model.move_selected_top_blocks p [ "d" ] false in
  eq "bottom cannot move down" [ "1"; "2"; "3"; "4" ] (titles bot)
    (String.concat ",");
  (* non-contiguous selection is left for the worker to reconcile *)
  let nc = Model.move_selected_top_blocks p [ "a"; "c" ] true in
  eq "non-contiguous no-op" [ "1"; "2"; "3"; "4" ] (titles nc)
    (String.concat ",");
  (* unknown uuid: selection resolves to nothing *)
  let none = Model.move_selected_top_blocks p [ "zzz" ] true in
  eq "unknown uuid no-op" [ "1"; "2"; "3"; "4" ] (titles none)
    (String.concat ",");
  (* dedup: same uuid twice behaves like once *)
  let dup = Model.move_selected_top_blocks p [ "b"; "b" ] true in
  eq "dup selection deduped" [ "2"; "1"; "3"; "4" ] (titles dup)
    (String.concat ",")

(* ---- Update.update ---- *)

let test_update () =
  let m0 = Model.initial in
  let m1 = Update.update m0 (Action.Boot_graph_ready "logseq_db_x") in
  check "boot_ready -> Ready"
    (m1.phase = Model.Ready && m1.repo = Some "logseq_db_x");
  let m2 = Update.update m1 (Action.Navigate_to (Model.Page "foo")) in
  (match (m2.route, m2.route_page) with
   | Model.Page "foo", None -> check "navigate clears route_page" true
   | _ -> check "navigate clears route_page" false);
  (* toast ids are allocated sequentially *)
  let toast = { Model.toast_id = 0; toast_text = "hi"; toast_kind = "success" } in
  let m3 = Update.update m2 (Action.Toast_push toast) in
  let m3 = Update.update m3 (Action.Toast_push toast) in
  eqi "two toasts" 2 (List.length m3.toasts);
  (* newest first; ids still allocated sequentially *)
  check "toast ids sequential"
    (List.map (fun (t : Model.toast) -> t.toast_id) m3.toasts = [ 1; 0 ]);
  let m4 = Update.update m3 (Action.Toast_dismiss 0) in
  check "toast dismiss keeps second"
    (List.length m4.toasts = 1
    && (List.hd m4.toasts).Model.toast_id = 1);
  let m5 = Update.update m4 Action.Dismiss_all in
  check "dismiss clears menus" (m5.page_menu = None && m5.confirm = None);
  (* sidebar toggles *)
  let m6 = Update.update m5 Action.Toggle_left_sidebar in
  check "left toggle" (m6.left_sidebar_open = not m5.left_sidebar_open);
  let m7 = Update.update m6 Action.Toggle_left_sidebar in
  check "left toggle back"
    (m7.left_sidebar_open = m5.left_sidebar_open)

(* ---- Decode.block_of_wire ---- *)

let test_decode () =
  let w =
    Wire.Map
      [ (Wire.kw "block/uuid", Wire.String "u1")
      ; (Wire.kw "block/title", Wire.String "hello")
      ; (Wire.kw "db/id", Wire.Int 7)
      ; (Wire.kw "block/level", Wire.Int 2)
      ; ( Wire.kw "block/children"
        , Wire.Array
            [ Wire.Map
                [ (Wire.kw "block/uuid", Wire.String "u2")
                ; (Wire.kw "block/title", Wire.String "child")
                ]
            ] )
      ]
  in
  let b = Decode.block_of_wire w in
  eqs "block title" "hello" b.Model.block_title;
  eqi "block level" 2 b.block_level;
  check "block uuid" (b.block_uuid = Some "u1");
  check "one child" (List.length b.block_children = 1);
  eqs "child title" "child" (List.hd b.block_children).block_title;
  (* block/name fallback when block/title missing *)
  let w2 = Wire.Map [ (Wire.kw "block/name", Wire.String "nm") ] in
  eqs "name fallback" "nm" (Decode.block_of_wire w2).block_title

(* ---- Wire helpers ---- *)

let test_wire () =
  let m =
    Wire.Map
      [ (Wire.kw "k1", Wire.String "v1"); (Wire.kw "k2", Wire.Int 42) ]
  in
  check "map_get_string hit"
    (Wire.map_get_string m "k1" = Some "v1");
  check "map_get_string miss"
    (Wire.map_get_string m "nope" = None);
  check "map_get_int hit" (Wire.map_get_int m "k2" = Some 42);
  check "map_get_uuid" (Wire.map_get_uuid m "k1" = Some "v1")

(* ---- Decode page/summary/toast ---- *)

let test_decode2 () =
  let p =
    Wire.Map
      [ (Wire.kw "block/title", Wire.String "My Page")
      ; (Wire.kw "block/uuid", Wire.Uuid "uuid-1")
      ; (Wire.kw "db/id", Wire.Int 9)
      ; (Wire.kw "block/journal-day", Wire.Int 20260927)
      ]
  in
  (match Decode.page_of_summary p with
   | Some page ->
       eqs "page title" "My Page" page.Model.page_title;
       check "page uuid" (page.page_uuid = Some "uuid-1");
       check "journal day" (page.page_journal_day = Some 20260927)
   | None -> check "page_of_summary" false);
  check "non-map -> None"
    (Decode.page_of_summary (Wire.String "x") = None);
  (* repos: upload-temp filtered, non-Array -> [] *)
  let repos =
    Wire.Array
      [ Wire.Map [ (Wire.kw "name", Wire.String "logseq_db_a") ]
      ; Wire.Map [ (Wire.kw "name", Wire.String "upload-temp") ]
      ; Wire.Map [ (Wire.kw "name", Wire.String "Upload-Temp") ]
      ; Wire.Map [ (Wire.kw "name", Wire.String "logseq_db_b") ]
      ]
  in
  eq "repos filtered" [ "logseq_db_a"; "logseq_db_b" ]
    (Decode.repos_of_list_db repos)
    (String.concat ",");
  (* toast: [message kind ...] *)
  let t =
    Wire.Array [ Wire.String "Saved!"; Wire.Keyword "success" ]
  in
  (match Decode.toast_of_wire t with
   | Some toast ->
       eqs "toast text" "Saved!" toast.Model.toast_text;
       eqs "toast kind" "success" toast.toast_kind
   | None -> check "toast_of_wire" false);
  check "toast empty -> None"
    (Decode.toast_of_wire (Wire.Array []) = None)

(* ---- Router.parse_path ---- *)

let test_router () =
  let open Model in
  check "route empty" (Router.parse_path "" = Home);
  check "route slash" (Router.parse_path "/" = Home);
  check "route page"
    (Router.parse_path "page/foo" = Page "foo");
  check "route page decode"
    (Router.parse_path "page/my%20page" = Page "my page");
  check "route page nested name"
    (Router.parse_path "page/ns%2Fchild" = Page "ns/child");
  check "route block"
    (Router.parse_path "block/abc-123" = Block_zoom "abc-123");
  check "route journals"
    (Router.parse_path "all-journals" = Journals);
  check "route all-pages"
    (Router.parse_path "all-pages" = All_pages);
  check "route graphs" (Router.parse_path "graphs" = All_graphs);
  check "route import" (Router.parse_path "import" = Import);
  check "route settings"
    (Router.parse_path "settings" = Settings);
  (* hash paths that must NOT silently 404 — regression guards for the
     cmdk go/* items that navigate via these exact strings *)
  check "#/journals is Not_found"
    (match Router.parse_path "journals" with
     | Not_found _ -> true
     | _ -> false);
  check "#/all-graphs is Not_found"
    (match Router.parse_path "all-graphs" with
     | Not_found _ -> true
     | _ -> false);
  check "bare page is Not_found"
    (match Router.parse_path "page" with
     | Not_found _ -> true
     | _ -> false);
  check "unknown is Not_found"
    (match Router.parse_path "wat/ever" with
     | Not_found _ -> true
     | _ -> false)

(* ---- Fuzzy.fuzzy_search ---- *)

let test_fuzzy () =
  let data = [ "alpha"; "beta"; "alpine"; "gamma"; "alp" ] in
  let hits = Fuzzy.fuzzy_search ~extract:Fun.id ~limit:99 data "alp" in
  eq "fuzzy hits" [ "alp"; "alpha"; "alpine" ] hits
    (String.concat ",");
  (* subsequence, not substring: 'alpn' still matches "alpine" *)
  check "fuzzy subsequence"
    (List.mem "alpine" (Fuzzy.fuzzy_search ~extract:Fun.id ~limit:99 data "alpn"));
  (* no match -> dropped *)
  check "fuzzy non-match dropped"
    (Fuzzy.fuzzy_search ~extract:Fun.id ~limit:99 data "zzz" = []);
  (* limit truncates *)
  check "fuzzy limit"
    (List.length (Fuzzy.fuzzy_search ~extract:Fun.id ~limit:1 data "alp")
     = 1);
  (* clean-str strips spaces/brackets like cljs search *)
  check "fuzzy clean-str"
    (List.mem "page one"
       (Fuzzy.fuzzy_search ~extract:Fun.id ~limit:99
          [ "page one"; "other" ] "pageone"))

let test_edn () =
  let w =
    Wire.Map
      [ (Wire.kw "a", Wire.String "x")
      ; (Wire.kw "b", Wire.Int 5)
      ; (Wire.kw "c", Wire.Array [ Wire.Bool true; Wire.Nil ])
      ]
  in
  let s = Edn.to_string w in
  let back = Edn.parse s in
  check "edn roundtrip k1" (Wire.map_get_string back "a" = Some "x");
  check "edn roundtrip k2" (Wire.map_get_int back "b" = Some 5)

(* ---- Update.update: loaders, popups, no-ops ---- *)

let test_update_loaders () =
  let m0 = Model.initial in
  let m1 = Update.update m0 (Action.Repos_loaded [ "a"; "b" ]) in
  eq "repos loaded" [ "a"; "b" ] m1.Model.repos (String.concat ",");
  let p = page [ block "b1" "t" ] in
  let m2 = Update.update m1 (Action.Page_loaded p) in
  check "page_loaded sets route_page"
    (m2.route_page = Some p && not m2.page_missing);
  let m3 = Update.update m2 Action.Page_load_failed in
  check "page_load_failed clears page + flags missing"
    (m3.route_page = None && m3.page_missing);
  let m4 = Update.update m3 (Action.Journals_loaded [ p ]) in
  check "journals loaded" (m4.journals = [ p ]);
  let r = [ block "r1" "ref" ] in
  let m5 = Update.update m4 (Action.Refs_loaded r) in
  check "refs loaded" (m5.page_refs = r);
  let u = [ block "u1" "unlinked" ] in
  let m6 = Update.update m5 (Action.Unlinked_loaded u) in
  check "unlinked loaded" (m6.unlinked_refs = u);
  (* identity arms return the model unchanged *)
  let ident a = Update.update m6 a == m6 in
  check "noop identity" (ident Action.Noop);
  check "refresh identity" (ident Action.Refresh_page);
  check "toggle_search identity" (ident Action.Toggle_search);
  check "worker_event identity"
    (ident (Action.Worker_event ("e", Wire.Nil)));
  check "block_content_changed identity"
    (ident (Action.Block_content_changed ("u", "t")))

let test_update_popups () =
  let m0 = Model.initial in
  let m1 = Update.update m0 Action.Title_edit_start in
  check "title edit start" m1.Model.editing_title;
  let m2 = Update.update m1 Action.Title_edit_done in
  check "title edit done" (not m2.editing_title);
  (* page_menu / appearance / confirm are mutually exclusive *)
  let m3 =
    Update.update m2 (Action.Page_menu_set (Some (10., 20., true)))
  in
  check "page_menu set" (m3.page_menu = Some (10., 20., true));
  let m4 = Update.update m3 (Action.Appearance_set (Some (1., 2.))) in
  check "appearance clears page_menu"
    (m4.appearance = Some (1., 2.) && m4.page_menu = None);
  let m5 =
    Update.update m4 (Action.Page_menu_set (Some (3., 4., false)))
  in
  check "page_menu clears appearance"
    (m5.page_menu = Some (3., 4., false) && m5.appearance = None);
  let m6 =
    Update.update m5
      (Action.Confirm_set (Some (Model.Confirm_delete_page "u")))
  in
  check "confirm clears both popups"
    (m6.confirm = Some (Model.Confirm_delete_page "u")
    && m6.page_menu = None && m6.appearance = None);
  let m7 = Update.update m6 Action.Dismiss_all in
  check "dismiss_all clears confirm too" (m7.confirm = None)

let test_update_popups2 () =
  let m7 =
    Update.update
      { Model.initial with unlinked_query = "abc" }
      Action.Dismiss_all
  in
  (* unlinked refs state; unlinked_open defaults to true *)
  let m8 = Update.update m7 Action.Unlinked_toggle_open in
  check "unlinked open toggles off" (not m8.unlinked_open);
  check "unlinked open toggles back"
    (Update.update m8 Action.Unlinked_toggle_open).unlinked_open;
  let m9 =
    Update.update
      { m8 with unlinked_query = "abc" }
      Action.Unlinked_toggle_search
  in
  check "unlinked search toggles + clears query"
    (m9.unlinked_search && m9.unlinked_query = "");
  let m10 = Update.update m9 (Action.Unlinked_set_query "x") in
  check "unlinked query set" (m10.unlinked_query = "x");
  let m11 = Update.update m10 Action.Help_toggle in
  check "help open" m11.help_open;
  check "help toggle back"
    (not (Update.update m11 Action.Help_toggle).help_open);
  let m12 = Update.update m11 Action.Toasts_clear in
  check "toasts cleared" (m12.toasts = []);
  (* Navigate_to resets all page-local UI state *)
  let dirty =
    { Model.initial with
      Model.editing_title = true
    ; page_menu = Some (0., 0., true)
    ; appearance = Some (1., 1.)
    ; unlinked_open = true
    ; unlinked_search = true
    ; unlinked_query = "q"
    ; unlinked_blocks = [ block "u" "x" ]
    ; page_refs = [ block "r" "x" ]
    ; unlinked_refs = [ block "r" "x" ]
    ; page_missing = true
    }
  in
  let nav = Update.update dirty (Action.Navigate_to Model.All_pages) in
  check "navigate resets page-local state"
    (nav.route = Model.All_pages && not nav.editing_title
    && nav.page_menu = None && nav.appearance = None
    && not nav.unlinked_open && not nav.unlinked_search
    && nav.unlinked_query = "" && nav.unlinked_blocks = []
    && nav.page_refs = [] && nav.unlinked_refs = []
    && not nav.page_missing)

(* ---- Dates ---- *)

let test_dates () =
  eqs "ordinal 1" "st" (Dates.ordinal_suffix 1);
  eqs "ordinal 2" "nd" (Dates.ordinal_suffix 2);
  eqs "ordinal 3" "rd" (Dates.ordinal_suffix 3);
  eqs "ordinal 4" "th" (Dates.ordinal_suffix 4);
  eqs "ordinal 11" "th" (Dates.ordinal_suffix 11);
  eqs "ordinal 13" "th" (Dates.ordinal_suffix 13);
  eqs "ordinal 21" "st" (Dates.ordinal_suffix 21);
  eqs "ordinal 22" "nd" (Dates.ordinal_suffix 22);
  eqs "ordinal 23" "rd" (Dates.ordinal_suffix 23);
  eqs "ordinal 31" "st" (Dates.ordinal_suffix 31);
  (* 2026-09-27T12:00Z — noon UTC lands on the same calendar day in all
     real timezones *)
  let d = Js.Date.fromFloat 1790510400000. in
  eqs "journal title" "Sep 27th, 2026" (Dates.journal_title_of d);
  eqi "journal day" 20260927 (Dates.journal_day_of d);
  eqi "add_days +1" 20260928
    (Dates.journal_day_of (Dates.add_days d 1));
  eqi "add_days month rollover" 20261001
    (Dates.journal_day_of (Dates.add_days d 4));
  eqi "add_days negative" 20260831
    (Dates.journal_day_of (Dates.add_days d (-27)));
  eqs "short date" "Sep 27, 2026"
    (Dates.short_date_of_ts 1790510400000.)

(* ---- Edn edge cases ---- *)

let test_edn2 () =
  let w = Edn.parse "{:a 1, ; trailing comment\n :b [2, 3]}" in
  check "comments + commas skipped"
    (Wire.map_get_int w "a" = Some 1
    && Wire.get w "b" = Some (Wire.Array [ Wire.Int 2; Wire.Int 3 ]));
  let w2 = Edn.parse "{:a 1 #_ :dropped :b 2}" in
  check "discard removes next form"
    (Wire.get w2 "dropped" = None
    && Wire.map_get_int w2 "b" = Some 2);
  check "toplevel discard -> nil" (Edn.parse "#_ 42" = Wire.Nil);
  check "set parse"
    (Edn.parse "#{1 2}" = Wire.Set [ Wire.Int 1; Wire.Int 2 ]);
  check "list parse"
    (Edn.parse "(1 :a)" = Wire.List [ Wire.Int 1; Wire.Keyword "a" ]);
  check "symbol parse" (Edn.parse "foo" = Wire.Symbol "foo");
  check "nil parse" (Edn.parse "nil" = Wire.Nil);
  check "negative int" (Edn.parse "-7" = Wire.Int (-7));
  check "float" (Edn.parse "2.5" = Wire.Float 2.5);
  check "bool" (Edn.parse "false" = Wire.Bool false);
  (* #tag literals don't decode: '#uuid' lexes as a symbol token *)
  check "tagged literal lexes as symbol + value"
    (Edn.parse "[#uuid \"x\"]"
     = Wire.Array [ Wire.Symbol "#uuid"; Wire.String "x" ]);
  (* string escapes, both directions *)
  let s = "a\"b\\c\nd\te" in
  check "string escapes decode"
    (Edn.parse "\"a\\\"b\\\\c\\nd\\te\"" = Wire.String s);
  eqs "string escapes print" "\"a\\\"b\\\\c\\nd\\te\""
    (Edn.to_string (Wire.String s));
  eqs "print uuid" "#uuid \"u-1\"" (Edn.to_string (Wire.Uuid "u-1"));
  eqs "print tagged" "#x 1"
    (Edn.to_string (Wire.Tagged ("x", Wire.Int 1)));
  eqs "print inst" "#inst 99" (Edn.to_string (Wire.Date_ms 99L));
  eqs "print set" "#{1 2}"
    (Edn.to_string (Wire.Set [ Wire.Int 1; Wire.Int 2 ]));
  eqs "print list" "(1 :a)"
    (Edn.to_string (Wire.List [ Wire.Int 1; Wire.kw "a" ]));
  eqs "print int64" "42" (Edn.to_string (Wire.Int64 42L));
  eqs "print float" "2.5" (Edn.to_string (Wire.Float 2.5));
  (* odd trailing key in a map literal is dropped *)
  (match Edn.parse "{:a 1 :dangling}" with
   | Wire.Map kvs -> check "odd map drops trailing key"
                       (List.length kvs = 1)
   | _ -> check "odd map drops trailing key" false)

(* ---- Fuzzy ---- *)

let test_fuzzy2 () =
  eqs "clean_str strips + lowers" "abcdefg"
    (Fuzzy.clean_str "A[b] c\\d/e_f(g)");
  check "len dist equal" (Fuzzy.str_len_distance "abc" "xyz" = 1.0);
  check "len dist empty" (Fuzzy.str_len_distance "" "" = 1.0);
  check "len dist half" (Fuzzy.str_len_distance "ab" "abcd" = 0.5);
  check "starts_with" (Fuzzy.starts_with "foobar" "foo");
  check "starts_with neg"
    (not (Fuzzy.starts_with "foo" "foobar"));
  check "index_of empty" (Fuzzy.index_of "abc" "" = Some 0);
  check "index_of mid" (Fuzzy.index_of "abc" "bc" = Some 1);
  check "index_of miss" (Fuzzy.index_of "abc" "bd" = None);
  check "index_of longer" (Fuzzy.index_of "ab" "abc" = None);
  check "score exact > substring"
    (Fuzzy.score "foo" "foobar" > Fuzzy.score "foo" "xfoox");
  check "score substring > subsequence"
    (Fuzzy.score "foo" "xfoox" > Fuzzy.score "foo" "f0o0o");
  check "score non-subsequence = 0" (Fuzzy.score "q" "abc" = 0.0);
  (* multi-extract: max over fns, score>0 kept, sorted desc, limit *)
  let data =
    [ ("a", "alpha"); ("b", "beta"); ("c", "gamma"); ("d", "zed") ]
  in
  let got =
    Fuzzy.fuzzy_search_multi
      ~extract_fns:[ fst; snd ] ~limit:10 data "a"
  in
  eqi "multi-extract result count" 3 (List.length got);
  eqs "multi-extract best first" "a" (fst (List.hd got));
  let lim = Fuzzy.fuzzy_search ~extract:snd ~limit:2 data "a" in
  eqi "limit applied" 2 (List.length lim);
  check "empty extract skipped"
    (Fuzzy.fuzzy_search_multi
       ~extract_fns:[ (fun _ -> "") ] ~limit:5 data "a"
     = []);
  check "non-matching extract dropped"
    (Fuzzy.fuzzy_search ~extract:fst ~limit:5 data "zzz" = [])

(* ---- Ui_strings + Commands_data ---- *)

let test_ui_strings () =
  eqs "t known key" "Create page" (Ui_strings.t "cmdk.create/page");
  eqs "t unknown falls back to key" "no/such-key"
    (Ui_strings.t "no/such-key");
  eqs "tf {1}" "Create page called 'X'"
    (Ui_strings.tf "cmdk.info/create-page" [ "X" ]);
  eqs "tf extra arg unused" "Create page called 'X'"
    (Ui_strings.tf "cmdk.info/create-page" [ "X"; "Y" ]);
  eqs "replace_all" "a-b-c"
    (Ui_strings.replace_all "a+b+c" "+" "-");
  eqs "replace_all miss" "abc"
    (Ui_strings.replace_all "abc" "+" "-");
  (* this runner is macOS (navigator.platform = MacIntel): mod -> ⌘ *)
  eqs "decorate mod" (Platform.utf8 "\xe2\x8c\x98" ^ "+enter")
    (Commands_data.decorate_binding "mod+enter");
  eqs "display unbound" "" (Commands_data.display Commands_data.Unbound);
  eqs "display disabled" "Disabled"
    (Commands_data.display Commands_data.Disabled);
  eqs "display binds joined" "ctrl+a | ctrl+b"
    (Commands_data.display
       (Commands_data.Binds [ "ctrl+a"; "ctrl+b" ]))

(* ---- Block_parse ---- *)

let test_block_parse () =
  let uu = "01234567-89ab-cdef-0123-456789abcdef" in
  check "uuid_shaped" (Block_parse.uuid_shaped uu);
  check "uuid_shaped short" (not (Block_parse.uuid_shaped "abc"));
  check "uuid_shaped non-hex" (not (Block_parse.uuid_shaped
    "01234567-89ab-cdef-0123-456789abcdeg"));
  check "scan_tok page"
    (Block_parse.scan_tok "[[a]]" 0 = Some (`Page, "a", 5));
  check "scan_tok tag"
    (Block_parse.scan_tok "#tag" 0 = Some (`Tag, "tag", 4));
  check "scan_tok heading not a tag" (Block_parse.scan_tok "# h" 0 = None);
  check "scan_tok ## not a tag" (Block_parse.scan_tok "## x" 0 = None);
  check "scan_tok unclosed [[x" (Block_parse.scan_tok "[[x" 0 = None);
  check "block_ref_at"
    (Block_parse.block_ref_at ("((" ^ uu ^ "))") 0 = Some (uu, 40));
  check "block_ref_at short" (Block_parse.block_ref_at "((abc))" 0 = None);
  (* plain title: no refs, title untouched *)
  let t', refs, tags = Block_parse.parse_title "plain text" in
  check "plain title" (t' = "plain text" && refs = [] && tags = []);
  (* [[page]] -> [[uuid]] + ref map *)
  let t2, refs2, tags2 = Block_parse.parse_title "see [[Foo Bar]]" in
  (match refs2 with
   | [ m ] ->
       let u = Wire.map_get_uuid m "block/uuid" in
       check "page ref rewritten"
         (t2 = "see [[" ^ Option.value u ~default:"" ^ "]]"
         && Wire.map_get_string m "block/title" = Some "Foo Bar"
         && Wire.map_get_string m "block/name" = Some "foo bar"
         && Wire.map_get_string m "block/type" = Some "page"
         && tags2 = [])
   | _ -> check "page ref rewritten" false);
  (* #tag -> #[[uuid]] + ref AND tag entries *)
  let t3, refs3, tags3 = Block_parse.parse_title "x #Baz" in
  (match (refs3, tags3) with
   | [ r ], [ tg ] ->
       let u = Wire.map_get_uuid r "block/uuid" in
       check "tag ref rewritten"
         (t3 = "x #[[" ^ Option.value u ~default:"" ^ "]]"
         && Wire.map_get_uuid tg "block/uuid" = u)
   | _ -> check "tag ref rewritten" false)

let test_block_parse2 () =
  let uu = "01234567-89ab-cdef-0123-456789abcdef" in
  (* already id-ref form: title kept, lookup ref emitted *)
  let t', refs, _ = Block_parse.parse_title ("see [[" ^ uu ^ "]]") in
  check "uuid ref passthrough"
    (t' = "see [[" ^ uu ^ "]]"
    && refs = [ Wire.Array [ Wire.kw "block/uuid"; Wire.Uuid uu ] ]);
  (* ((uuid)) block ref *)
  let t2, refs2, _ = Block_parse.parse_title ("see ((" ^ uu ^ "))") in
  check "block ref passthrough"
    (t2 = "see ((" ^ uu ^ "))"
    && refs2 = [ Wire.Array [ Wire.kw "block/uuid"; Wire.Uuid uu ] ]);
  (* same page twice: one ref map, both occurrences share the uuid *)
  let t3, refs3, _ = Block_parse.parse_title "[[X]] and [[X]]" in
  (match refs3 with
   | [ m ] -> (
       match Wire.map_get_uuid m "block/uuid" with
       | Some u ->
           check "dedup shares uuid"
             (t3 = "[[" ^ u ^ "]] and [[" ^ u ^ "]]")
       | None -> check "dedup shares uuid" false)
   | _ -> check "dedup shares uuid" false);
  (* #[[name]] tag form *)
  let t4, refs4, tags4 = Block_parse.parse_title "#[[Two Words]]" in
  check "#[[x]] tag"
    (List.length refs4 = 1 && List.length tags4 = 1
    && String.sub t4 0 3 = "#[[");
  (* title_fields drops empty collections *)
  eqi "title_fields plain" 1
    (List.length (Block_parse.title_fields "plain"));
  eqi "title_fields with refs" 3
    (List.length (Block_parse.title_fields "a [[p]] #t"))

(* ---- Title_refs ---- *)

let test_title_refs () =
  let refs, tags =
    Title_refs.scan_title "a [[X]] b #y c [[X]] #[[Z]] d #y"
  in
  (* dedup keeps the LAST occurrence: order is right-to-left *)
  eq "scan_title refs deduped" [ "y"; "Z"; "X" ] refs
    (String.concat ",");
  eq "scan_title tags deduped" [ "y"; "Z" ] tags
    (String.concat ",");
  check "scan_title empty" (Title_refs.scan_title "plain" = ([], []));
  eqs "normalize ident" "HelloWorld!"
    (Title_refs.normalize_ident_name_part "Hello World!");
  eqs "normalize digit prefix" "NUM-3abc"
    (Title_refs.normalize_ident_name_part "3abc");
  eqs "normalize drops slash" "ab"
    (Title_refs.normalize_ident_name_part "a/b");
  eqs "replace_all" "aYbYc"
    (Title_refs.replace_all "aXbXc" ~pat:"X" ~rep:"Y");
  eqs "replace_all empty pat" "ab"
    (Title_refs.replace_all "ab" ~pat:"" ~rep:"Y");
  eqs "replace_all overlap" "Ya"
    (Title_refs.replace_all "aaa" ~pat:"aa" ~rep:"Y");
  let resolved =
    [ { Title_refs.name = "X"; uuid = "u1"; is_tag = false
      ; fresh = true; entity = Wire.Nil }
    ; { Title_refs.name = "y"; uuid = "u2"; is_tag = true
      ; fresh = true; entity = Wire.Nil }
    ; { Title_refs.name = "foobar"; uuid = "u3"; is_tag = true
      ; fresh = true; entity = Wire.Nil } ]
  in
  eqs "rewrite page + bare tag" "a [[u1]] #[[u2]]"
    (Title_refs.rewrite_title "a [[X]] #y" resolved);
  eqs "rewrite #[[name]]" "#[[u1]]"
    (Title_refs.rewrite_title "#[[X]]" resolved);
  check "tag_name_at boundary"
    (Title_refs.tag_name_at "#foobar x" 1 resolved
     = Some (List.nth resolved 2));
  check "tag_name_at no boundary"
    (Title_refs.tag_name_at "#yz!" 1
       [ { Title_refs.name = "y"; uuid = "u"; is_tag = true
         ; fresh = true; entity = Wire.Nil } ]
     = None)

let test_title_refs2 () =
  let pm = Title_refs.new_page_map "Foo Bar" "u1" in
  check "new_page_map"
    (Wire.map_get_string pm "block/name" = Some "foo bar"
    && Wire.map_get_string pm "block/title" = Some "Foo Bar"
    && Wire.get pm "block/uuid" = Some (Wire.Uuid "u1")
    && Wire.get pm "block/tags"
       = Some (Wire.Array [ Wire.kw "logseq.class/Page" ]));
  let tm = Title_refs.new_tag_map "Baz" "u2" in
  (match Wire.get tm "db/ident" with
   | Some (Wire.Keyword i) ->
       check "new_tag_map ident" (Fuzzy.starts_with i "user.class/Baz-")
   | _ -> check "new_tag_map ident" false);
  check "new_tag_map tags + extends"
    (Wire.get tm "block/tags"
     = Some (Wire.Array [ Wire.kw "logseq.class/Tag" ])
    && Wire.get tm "logseq.property.class/extends"
       = Some (Wire.kw "logseq.class/Root"));
  check "uuid_lookup"
    (Title_refs.uuid_lookup "u"
     = Wire.Array [ Wire.kw "block/uuid"; Wire.Uuid "u" ]);
  let p =
    { Title_refs.title = "t"
    ; refs = [ Wire.String "r" ]
    ; tags = [ Wire.String "g" ] }
  in
  check "kvs_of_parsed"
    (Title_refs.kvs_of_parsed p
     = [ (Wire.String "block/refs", Wire.List [ Wire.String "r" ])
       ; (Wire.String "block/tags", Wire.List [ Wire.String "g" ]) ]);
  check "kvs_of_parsed empty"
    (Title_refs.kvs_of_parsed
       { Title_refs.title = "t"; refs = []; tags = [] }
     = [])

(* ---- Decode: labels, order lists, reactions, children ---- *)

let wmap kvs = Wire.Map (List.map (fun (k, v) -> (Wire.kw k, v)) kvs)

let test_decode3 () =
  (* prop_label accepts scalar and entity-map values *)
  check "prop_label keyword"
    (Decode.prop_label (wmap [ ("k", Wire.kw "v") ]) "k" = Some "v");
  check "prop_label int"
    (Decode.prop_label (wmap [ ("k", Wire.Int 5) ]) "k" = Some "5");
  check "prop_label entity title"
    (Decode.prop_label
       (wmap [ ("k", wmap [ ("block/title", Wire.String "T") ]) ]) "k"
     = Some "T");
  check "prop_label entity ident tail"
    (Decode.prop_label
       (wmap [ ("k", wmap [ ("db/ident", Wire.kw "a/b/c") ]) ]) "k"
     = Some "c");
  check "prop_label entity value"
    (Decode.prop_label
       (wmap [ ("k", wmap [ ("logseq.property/value", Wire.String "s") ]) ])
       "k" = Some "s");
  check "prop_label miss"
    (Decode.prop_label (wmap []) "k" = None);
  check "order_list lowercases"
    (Decode.order_list_type_of_wire
       (wmap [ ("logseq.property/order-list-type", Wire.kw "Number") ])
     = Some "number");
  (* reactions grouped + counted by emoji id *)
  let em e = wmap [ ("logseq.property.reaction/emoji-id", Wire.String e) ] in
  let rw =
    wmap [ ("block.temp/reactions", Wire.Array [ em "x"; em "y"; em "x" ]) ]
  in
  let rs = Decode.reactions_of_wire rw in
  check "reactions grouped"
    (List.length rs = 2 && List.assoc "x" rs = 2
    && List.assoc "y" rs = 1);
  check "count_refs collection"
    (Decode.count_refs (wmap [ ("r", Wire.List [ Wire.Int 1 ]) ]) "r" = 1);
  check "count_refs miss" (Decode.count_refs (wmap []) "r" = 0);
  (* children with property markers are filtered out *)
  let parent =
    wmap
      [ ("block/uuid", Wire.String "p")
      ; ( "block/children"
        , Wire.Array
            [ wmap [ ("block/uuid", Wire.String "ok") ]
            ; wmap
                [ ("block/uuid", Wire.String "skip1")
                ; ("logseq.property/created-from-property", Wire.Int 1) ]
            ; wmap
                [ ("block/uuid", Wire.String "skip2")
                ; ("block/closed-value-property", Wire.Int 1) ] ]) ]
  in
  let b = Decode.block_of_wire parent in
  check "children filtered"
    (List.length b.block_children = 1
    && (List.hd b.block_children).block_uuid = Some "ok")

let test_decode4 () =
  (* order_list indices: consecutive same-type siblings number 1..n *)
  let ol t = ("logseq.property/order-list-type", Wire.kw t) in
  let bws =
    Wire.Array
      [ wmap [ ol "number" ]
      ; wmap [ ol "number" ]
      ; wmap [ ol "bullet" ]
      ; wmap []
      ]
  in
  let bs = Decode.blocks_of_wire bws in
  eq "order indices" [ Some 1; Some 2; Some 1; None ]
    (List.map (fun (b : Model.block) -> b.block_order_index) bs)
    (fun xs ->
      String.concat ","
        (List.map (fun o -> Option.value ~default:"_" (Option.map string_of_int o)) xs));
  (* block/link {:db/id} stub *)
  let lb =
    Decode.block_of_wire
      (wmap [ ("block/link", wmap [ ("db/id", Wire.Int 42) ]) ])
  in
  check "link db id" (lb.block_link = Some 42);
  (* tags: ints, int64s and {:db/id} stubs all collect *)
  let tb =
    Decode.block_of_wire
      (wmap
         [ ( "block/tags"
           , Wire.Array
               [ Wire.Int 1; Wire.Int64 2L
               ; wmap [ ("db/id", Wire.Int 3) ]; Wire.kw "skip" ]) ])
  in
  eq "tag ids" [ 1; 2; 3 ] tb.block_tag_ids
    (fun xs -> String.concat "," (List.map string_of_int xs));
  check "block/name makes it a page"
    ((Decode.block_of_wire (wmap [ ("block/name", Wire.String "n") ]))
       .block_is_page);
  (* heading: direct field, property int in range, bool -> level+1 *)
  check "heading-level field"
    ((Decode.block_of_wire
        (wmap [ ("block/heading-level", Wire.Int 4) ])).block_heading
     = Some 4);
  check "heading prop int"
    ((Decode.block_of_wire
        (wmap [ ("logseq.property/heading", Wire.Int 3) ])).block_heading
     = Some 3);
  check "heading prop out of range"
    ((Decode.block_of_wire
        (wmap [ ("logseq.property/heading", Wire.Int 9) ])).block_heading
     = None);
  check "heading bool -> level+1"
    ((Decode.block_of_wire
        (wmap
           [ ("block/level", Wire.Int 2)
           ; ("logseq.property/heading", Wire.Bool true) ])).block_heading
     = Some 3)

let test_decode5 () =
  (* asset fields *)
  let a =
    Decode.block_of_wire
      (wmap
         [ ("logseq.property.asset/type", Wire.String "image")
         ; ("logseq.property.asset/width", Wire.Int 100)
         ; ("logseq.property.asset/height", Wire.Int64 50L)
         ; ( "logseq.property.asset/resize-metadata"
           , wmap [ ("width", Wire.Int 33) ] )
         ; ("logseq.property.asset/align", Wire.kw "center") ])
  in
  check "asset fields"
    (a.block_asset_type = Some "image" && a.block_asset_width = Some 100
    && a.block_asset_height = Some 50 && a.block_asset_resize = Some 33
    && a.block_asset_align = Some "center");
  (* comment targets count *)
  let c =
    Decode.block_of_wire
      (wmap
         [ ( "logseq.property.comments/blocks"
           , Wire.Array [ wmap []; wmap [] ]) ])
  in
  eqi "comment targets" 2 c.block_comment_targets;
  (* page predicates off route-info maps *)
  check "tag? flag"
    (Decode.is_tag_page (wmap [ ("tag?", Wire.Bool true) ]));
  check "tag via ident"
    (Decode.is_tag_page
       (wmap [ ("tags", Wire.Array [ wmap [ ("ident", Wire.String "logseq.class/Tag") ] ]) ]));
  check "not tag"
    (not (Decode.is_tag_page (wmap [ ("tag?", Wire.Bool false) ])));
  check "has_ident"
    (Decode.has_ident_page
       (wmap [ ("tags", Wire.Array [ wmap [ ("ident", Wire.String "i/j") ] ]) ])
       "i/j");
  check "property page"
    (Decode.is_property_page
       (wmap
          [ ( "tags"
            , Wire.Array [ wmap [ ("ident", Wire.String "logseq.class/Property") ] ]) ]));
  eq "tag titles" [ "T1"; "T2" ]
    (Decode.page_tag_titles
       (wmap
          [ ( "tags"
            , Wire.Array
                [ wmap [ ("title", Wire.String "T1") ]
                ; wmap [ ("ident", Wire.String "x") ]
                ; wmap [ ("title", Wire.String "T2") ] ]) ]))
    (String.concat ",");
  check "icon"
    (Decode.icon_of_wire
       (wmap [ ("type", Wire.kw "emoji"); ("id", Wire.String "e1") ])
     = Some ("emoji", "e1"))

let test_decode6 () =
  (* view_blocks: library drops non-page subtrees; otherwise page-typed
     blocks get block_default_collapsed *)
  let nonpage = { (block "n" "x") with Model.block_is_page = false } in
  let pageblk = { (block "pg" "y") with Model.block_is_page = true
                                      ; block_children = [ nonpage ] } in
  let lib = Decode.view_blocks ~library:true [ pageblk; nonpage ] in
  check "library keeps pages only"
    (List.length lib = 1
    && (List.hd lib).block_uuid = Some "pg"
    && (List.hd lib).block_children = []);
  let plain = Decode.view_blocks ~library:false [ pageblk; nonpage ] in
  check "non-library marks page children collapsed"
    (List.length plain = 2
    && (List.hd plain).block_default_collapsed
    && not (List.nth plain 1).block_default_collapsed);
  (* page_of_summary extras: icon, library, internal, add-object *)
  let p =
    wmap
      [ ("page-title", Wire.String "Library")
      ; ("page-uuid", Wire.Uuid "u")
      ; ("page-id", Wire.Int 7)
      ; ("built-in?", Wire.Bool true)
      ; ("icon", wmap [ ("type", Wire.kw "emoji"); ("id", Wire.String "i") ])
      ; ("add-object?", Wire.Bool true)
      ; ("tags", Wire.Array [ wmap [ ("title", Wire.String "Tg") ] ]) ]
  in
  (match Decode.page_of_summary p with
   | Some pg ->
       check "summary route-info keys"
         (pg.Model.page_title = "Library"
         && pg.page_uuid = Some "u" && pg.page_db_id = Some 7
         && pg.page_is_library && pg.page_add_object
         && pg.page_icon = Some ("emoji", "i")
         && pg.page_tags = [ "Tg" ])
   | None -> check "summary route-info keys" false);
  (* toast: kind defaults, non-string message rejected *)
  check "toast non-string kind -> info"
    ((Option.get
        (Decode.toast_of_wire
           (Wire.Array [ Wire.String "m"; Wire.Int 1 ])))
       .Model.toast_kind = "info");
  check "toast single-element -> None"
    (Decode.toast_of_wire (Wire.Array [ Wire.String "m" ]) = None);
  check "toast non-string msg -> None"
    (Decode.toast_of_wire (Wire.Array [ Wire.Int 1; Wire.String "x" ])
     = None)

(* ---- Editor_state pure helpers ---- *)

let test_editor_state () =
  let grandchild = block "g" "gc" in
  let child = block ~children:[ grandchild ] "c" "child" in
  let embed =
    { (block "e" "embed") with
      Model.block_link = Some 9
    ; block_embed_children = [ block "ee" "emb" ] }
  in
  let top = block "t" "top" in
  let blocks = [ child; embed; top ] in
  (* a :block/link row renders embed children in place of its own *)
  eqi "children_of link" 1
    (List.length (Editor_state.children_of embed));
  eqi "children_of normal" 1
    (List.length (Editor_state.children_of child));
  check "find_in nested"
    ((Option.map (fun (b : Model.block) -> b.block_uuid)
        (Editor_state.find_in blocks "g"))
     = Some (Some "g"));
  check "find_in descends into embed children"
    (Option.is_some (Editor_state.find_in blocks "ee"));
  check "find_in miss" (Editor_state.find_in blocks "zz" = None);
  (match Editor_state.find_parent_in blocks "g" with
   | Some (Some par, i) ->
       check "find_parent_in" (par.block_uuid = Some "c" && i = 0)
   | _ -> check "find_parent_in" false);
  check "find_parent_in misses top-level uuid"
    (Editor_state.find_parent_in blocks "t" = None);
  (* map_block_title rewrites through children and embed children *)
  let renamed = Editor_state.map_block_title "ee" "new" blocks in
  (match Editor_state.find_in renamed "ee" with
   | Some b -> eqs "map_block_title embed child" "new" b.block_title
   | None -> check "map_block_title embed child" false);
  let renamed2 = Editor_state.map_block_title "g" "g2" blocks in
  (match Editor_state.find_in renamed2 "g" with
   | Some b -> eqs "map_block_title nested" "g2" b.block_title
   | None -> check "map_block_title nested" false);
  (* unmounted state falls back to initial *)
  check "editing none unmounted" (Editor_state.editing () = None);
  check "selection empty unmounted"
    (not (Editor_state.selection_active ()))

let test_editor_state_rt () =
  let saved_page = !Runtime.current_page
  and saved_journals = !Runtime.current_journals in
  let gc = block "g" "gc" in
  let coll =
    { (block ~children:[ gc ] "c" "child") with
      Model.block_default_collapsed = true }
  in
  let t1 = block "t1" "a" and t2 = block "t2" "b" in
  Runtime.current_page := Some (page [ coll; t1; t2 ]);
  eqi "flat_all includes collapsed subtree" 4
    (List.length (Editor_state.flat_all ()));
  let vis = Editor_state.flat_visible () in
  check "flat_visible skips collapsed subtree"
    (List.map
       (fun (b : Model.block) -> Option.value b.block_uuid ~default:"")
       vis
     = [ "c"; "t1"; "t2" ]);
  check "find via current_page" (Option.is_some (Editor_state.find "g"));
  (match Editor_state.find_parent "t1" with
   | Some (None, i) -> check "top-level parent idx" (i = 1)
   | _ -> check "top-level parent idx" false);
  (match Editor_state.find_parent "g" with
   | Some (Some par, i) ->
       check "nested parent" (par.block_uuid = Some "c" && i = 0)
   | _ -> check "nested parent" false);
  check "next_visible"
    (match Editor_state.next_visible "c" with
     | Some b -> b.block_uuid = Some "t1"
     | None -> false);
  check "prev_visible"
    (match Editor_state.prev_visible "t2" with
     | Some b -> b.block_uuid = Some "t1"
     | None -> false);
  check "prev_visible first" (Editor_state.prev_visible "c" = None);
  check "prev_sibling"
    (match Editor_state.prev_sibling "t2" with
     | Some b -> b.block_uuid = Some "t1"
     | None -> false);
  check "prev_sibling of first" (Editor_state.prev_sibling "c" = None);
  check "effective_collapsed flag"
    (Editor_state.effective_collapsed coll);
  check "effective_collapsed default false"
    (not (Editor_state.effective_collapsed t1));
  (* journals fallback when no page is loaded *)
  Runtime.current_page := None;
  Runtime.current_journals := [ page [ block "j" "j" ] ];
  eqi "page_blocks journals fallback" 1
    (List.length (Editor_state.page_blocks ()));
  Runtime.current_page := saved_page;
  Runtime.current_journals := saved_journals

(* ---- Outliner_ops pure op builders ---- *)

let op_name_args o =
  match o with
  | Wire.Array [ Wire.Keyword n; Wire.Array args ] -> Some (n, args)
  | _ -> None

let test_outliner_ops () =
  eqs "sanity lc + slashes" "foo/bar"
    (Outliner_ops.page_name_sanity_lc " /Foo/Bar/ ");
  eqs "sanity all slashes" "" (Outliner_ops.page_name_sanity_lc "///");
  eqi "heading level" 2
    (Option.value
       (Outliner_ops.markdown_heading_level "## hi") ~default:0);
  check "heading needs space after #"
    (Outliner_ops.markdown_heading_level "#nospace" = None);
  check "heading >6 rejected"
    (Outliner_ops.markdown_heading_level "####### x" = None);
  check "heading absent"
    (Outliner_ops.markdown_heading_level "plain" = None);
  eqs "strip heading" "hi" (Outliner_ops.strip_markdown_heading "## hi" 2);
  check "op shape"
    (op_name_args (Outliner_ops.op "x-op" [ Wire.Int 1 ])
     = Some ("x-op", [ Wire.Int 1 ]));
  check "uuids_list"
    (Outliner_ops.uuids_list [ "a"; "b" ]
     = Wire.List [ Wire.Uuid "a"; Wire.Uuid "b" ]);
  check "op_opts"
    (Wire.get (Outliner_ops.op_opts "n") "outliner-op"
     = Some (Wire.Keyword "n"));
  (* block_map: title fields parsed, page/link flags *)
  let bm = Outliner_ops.block_map ~title:"See [[Pg]]" "u" in
  check "block_map uuid + parsed refs"
    (Wire.get bm "block/uuid" = Some (Wire.Uuid "u")
    && (match Wire.get bm "block/refs" with
        | Some (Wire.List [ _ ]) -> true | _ -> false));
  let bp = Outliner_ops.block_map ~title:"Page T" ~page:true "u" in
  check "block_map page"
    (Wire.map_get_string bp "block/name" = Some "page t"
    && Wire.get bp "block/tags"
       = Some (Wire.Set [ Wire.kw "logseq.class/Page" ]));
  check "block_map link"
    (Wire.get (Outliner_ops.block_map ~link:7 "u") "block/link"
     = Some (Wire.Int 7));
  check "block_map plain"
    (Outliner_ops.block_map "u"
     = Wire.Map [ (Wire.String "block/uuid", Wire.Uuid "u") ])

let test_outliner_ops2 () =
  (* saved_block_map / normalized_title: markdown heading split out
     unless the block has a display type *)
  let saved_page = !Runtime.current_page in
  Runtime.current_page := None;
  let sm = Outliner_ops.saved_block_map "u" "## hello [[P]]" in
  check "saved_block_map heading split"
    (Wire.get sm "logseq.property/heading" = Some (Wire.Int 2)
    && (match Wire.map_get_string sm "block/title" with
        | Some t -> String.sub t 0 5 = "hello"
        | None -> false));
  eqs "normalized_title strips heading" "hello [[P]]"
    (Outliner_ops.normalized_title "u" "  ## hello [[P]]");
  let codeblk =
    { (block "cb" "x") with Model.block_display_type = Some "code" } in
  Runtime.current_page := Some (page [ codeblk ]);
  let sm2 = Outliner_ops.saved_block_map "cb" "## raw" in
  check "code block keeps raw title"
    (Wire.map_get_string sm2 "block/title" = Some "## raw"
    && Wire.get sm2 "logseq.property/heading" = None);
  eqs "normalized_title code" "## raw"
    (Outliner_ops.normalized_title "cb" " ## raw");
  Runtime.current_page := saved_page;
  (* save-block op wraps the map *)
  check "save_block op"
    (match op_name_args (Outliner_ops.save_block "u" "t") with
     | Some ("save-block", [ Wire.Map _; Wire.Map [] ]) -> true
     | _ -> false);
  check "delete_blocks op"
    (match op_name_args (Outliner_ops.delete_blocks [ "a" ]) with
     | Some ("delete-blocks", [ Wire.List [ Wire.Uuid "a" ]; Wire.Map [] ]) ->
         true
     | _ -> false);
  check "insert_blocks sibling flag"
    (match
       op_name_args
         (Outliner_ops.insert_blocks [ Wire.Int 1 ] "tgt" ~sibling:true)
     with
     | Some ("insert-blocks", [ _; Wire.Uuid "tgt"; Wire.Map _ as m ]) ->
         Wire.get m "sibling?" = Some (Wire.Bool true)
     | _ -> false);
  check "insert_blocks replace-empty opt-in"
    (match
       op_name_args
         (Outliner_ops.insert_blocks ~replace_empty_target:true []
            "tgt" ~sibling:false)
     with
     | Some ("insert-blocks", [ _; _; Wire.Map _ as m ]) ->
         Wire.get m "replace-empty-target?" = Some (Wire.Bool true)
     | _ -> false)

let test_outliner_ops3 () =
  (* paste_block_maps flattens preorder with levels + parent refs *)
  let child = block "cu" "ctitle" in
  let parent = block ~children:[ child ] "pu" "ptitle" in
  let maps = Outliner_ops.paste_block_maps [ parent ] in
  check "paste maps preorder + level + parent"
    (List.length maps = 2
    && Wire.get (List.hd maps) "block/level" = Some (Wire.Int 1)
    && Wire.get (List.nth maps 1) "block/level" = Some (Wire.Int 2)
    && (match Wire.get (List.nth maps 1) "block/parent" with
        | Some (Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid "pu" ]) ->
            true
        | _ -> false));
  check "paste_trees op"
    (match
       op_name_args (Outliner_ops.paste_trees [ parent ] "tgt"
                       ~replace_empty:true)
     with
     | Some ("insert-blocks", [ Wire.Array _; Wire.Uuid "tgt"; Wire.Map _ as m ]) ->
         Wire.get m "outliner-op" = Some (Wire.Keyword "paste")
         && Wire.get m "replace-empty-target?" = Some (Wire.Bool true)
     | _ -> false);
  (* move ops *)
  check "move_blocks sibling"
    (match
       op_name_args (Outliner_ops.move_blocks [ "a" ] "t" ~sibling:true)
     with
     | Some ("move-blocks", [ _; Wire.Uuid "t"; Wire.Map _ as m ]) ->
         Wire.get m "sibling?" = Some (Wire.Bool true)
     | _ -> false);
  check "move_blocks bottom"
    (match op_name_args (Outliner_ops.move_blocks_bottom [ "a" ] "t") with
     | Some ("move-blocks", [ _; _; Wire.Map _ as m ]) ->
         Wire.get m "bottom?" = Some (Wire.Bool true)
         && Wire.get m "sibling?" = Some (Wire.Bool false)
     | _ -> false);
  check "move_up_down"
    (match op_name_args (Outliner_ops.move_up_down [ "a" ] true) with
     | Some ("move-blocks-up-down", [ _; Wire.Bool true ]) -> true
     | _ -> false);
  check "indent_outdent parent-original"
    (match
       op_name_args
         (Outliner_ops.indent_outdent ~parent_original:"po" [ "a" ] true)
     with
     | Some ("indent-outdent-blocks", [ _; Wire.Bool true; Wire.Map _ as m ]) ->
         Option.is_some (Wire.get m "parent-original")
     | _ -> false)

let test_outliner_ops4 () =
  check "collapse_expand op"
    (match op_name_args (Outliner_ops.collapse_expand [ "u", true ]) with
     | Some ("collapse-expand-blocks", [ Wire.List [ m ]; _ ]) ->
         Wire.get m "block/collapsed?" = Some (Wire.Bool true)
     | _ -> false);
  check "create_page op"
    (op_name_args (Outliner_ops.create_page "t")
     = Some ("create-page", [ Wire.String "t"; Wire.Map [] ]));
  check "create_class op"
    (match op_name_args (Outliner_ops.create_class "t") with
     | Some ("create-page", [ _; Wire.Map _ as m ]) ->
         Wire.get m "class?" = Some (Wire.Bool true)
     | _ -> false);
  check "set_block_property op"
    (match
       op_name_args (Outliner_ops.set_block_property "u" "p" (Wire.Int 1))
     with
     | Some ("set-block-property", [ Wire.Uuid "u"; Wire.Keyword "p"; Wire.Int 1 ]) ->
         true
     | _ -> false);
  check "batch_set_property entity-id"
    (match
       op_name_args
         (Outliner_ops.batch_set_property [ "a" ] "p" (Wire.Int 2)
            ~entity_id:true)
     with
     | Some ("batch-set-property", [ _; _; _; Wire.Map _ as m ]) ->
         Wire.get m "entity-id?" = Some (Wire.Bool true)
     | _ -> false);
  check "apply_template op"
    (match op_name_args (Outliner_ops.apply_template "t" "x") with
     | Some ("apply-template", [ Wire.Uuid "t"; Wire.Uuid "x"; Wire.Map _ as m ]) ->
         Wire.get m "replace-empty-target?" = Some (Wire.Bool true)
     | _ -> false)

let test_outliner_ops5 () =
  (* collect_collapsed walks children for block/collapsed? *)
  let w =
    wmap
      [ ("block/uuid", Wire.Uuid "p")
      ; ( "block/children"
        , Wire.Array
            [ wmap
                [ ("block/uuid", Wire.Uuid "c1")
                ; ("block/collapsed?", Wire.Bool true) ]
            ; wmap
                [ ("block/uuid", Wire.Uuid "c2")
                ; ("block/collapsed?", Wire.Bool false) ] ]) ]
  in
  let set = Outliner_ops.collect_collapsed Editor_state.String_set.empty w in
  check "collect_collapsed"
    (Editor_state.String_set.mem "c1" set
    && not (Editor_state.String_set.mem "c2" set));
  check "internal_tag_ident"
    (Outliner_ops.internal_tag_ident "logseq.class/Page"
    && not (Outliner_ops.internal_tag_ident "user.class/x"));
  check "tag_hidden"
    (Outliner_ops.tag_hidden
       (wmap [ ("block/hidden?", Wire.Bool true) ])
    && Outliner_ops.tag_hidden
         (wmap [ ("logseq.property.class/hide-from-node", Wire.Bool true) ])
    && not (Outliner_ops.tag_hidden (wmap [])));
  let tagged =
    { (block ~children:[ { (block "k" "c") with Model.block_tag_ids = [ 3 ] } ]
         "r" "p")
      with Model.block_tag_ids = [ 1; 2 ] }
  in
  eq "collect_tag_ids" [ 3; 2; 1 ]
    (Outliner_ops.collect_tag_ids [] tagged)
    (fun xs -> String.concat "," (List.map string_of_int xs));
  check "ancestors_of"
    (Outliner_ops.ancestors_of
       { (page []) with Model.page_db_id = Some 9 }
     = [ 9 ]
    && Outliner_ops.ancestors_of (page []) = [])

(* ---- Cmdk_state pure helpers ---- *)

let cmdk_item ?(act = Cmdk_state.Open_page "u") ititle : Cmdk_state.item =
  { ikey = "k-" ^ ititle; idx = -1; gid = Cmdk_state.G_nodes
  ; ititle; info = None; header = None; iicon = ""; isc = ""
  ; ibadge = Cmdk_state.No_badge; act; ihl = false; imouse = false
  ; iq = "" }

let cmdk_group gid items : Cmdk_state.group =
  { Cmdk_state.gid = gid; gtitle = "g"; gitems = items; gtotal = 0
  ; glimit = 0; gexpanded = false; gfilter_active = false }

let test_cmdk_items () =
  eqi "nodes_limit default" 10 (Cmdk_state.nodes_limit false []);
  eqi "nodes_limit move" 20 (Cmdk_state.nodes_limit true []);
  eqi "nodes_limit expanded" 100
    (Cmdk_state.nodes_limit true [ Cmdk_state.G_nodes ]);
  eqi "current_page_limit" 10 (Cmdk_state.current_page_limit []);
  eqi "current_page_limit expanded" 100
    (Cmdk_state.current_page_limit [ Cmdk_state.G_current_page ]);
  check "create empty q" (Cmdk_state.create_items "  " = []);
  check "create hidden name" (Cmdk_state.create_items "config.edn" = []);
  check "create bare hash" (Cmdk_state.create_items "#" = []);
  (match Cmdk_state.create_items "New Page" with
   | [ it ] ->
       check "create page item"
         (it.Cmdk_state.ititle = "Create page"
         && it.info = Some "Create page called 'New Page'"
         && it.act = Cmdk_state.Create_page "New Page")
   | _ -> check "create page item" false);
  (match Cmdk_state.create_items "#mytag" with
   | [ it ] ->
       check "create tag item"
         (it.ititle = "Create tag"
         && it.act = Cmdk_state.Create_page "mytag")
   | _ -> check "create tag item" false);
  (* filter rows: leading current-page row only when a page is current *)
  eqi "filters no page" 5 (List.length (Cmdk_state.filter_items ()));
  let saved_route = !Runtime.current_route
  and saved_page = !Runtime.current_page in
  Runtime.current_route := Some (Model.Page "x");
  Runtime.current_page := Some (page []);
  let fs = Cmdk_state.filter_items () in
  check "filters with page"
    (List.length fs = 6
    && (List.hd fs).Cmdk_state.act
       = Cmdk_state.Set_filter Cmdk_state.G_current_page);
  Runtime.current_route := saved_route;
  Runtime.current_page := saved_page;
  check "file_items empty q" (Cmdk_state.file_items "" = []);
  check "file_items match"
    (match Cmdk_state.file_items "config" with
     | [ it ] -> it.act = Cmdk_state.Open_file "logseq/config.edn"
     | _ -> false)

let test_cmdk_rows () =
  let crumb =
    wmap
      [ ( "block.temp/breadcrumb"
        , Wire.List
            [ wmap [ ("block/title", Wire.String "P") ]
            ; wmap [ ("block/title", Wire.String "C") ] ]) ]
  in
  eqs "breadcrumb joined" "P / C"
    (Option.value (Cmdk_state.breadcrumb_of crumb) ~default:"");
  check "breadcrumb absent"
    (Cmdk_state.breadcrumb_of (wmap []) = None);
  let row =
    wmap
      [ ("block/uuid", Wire.Uuid "bu")
      ; ("block/title", Wire.String "T")
      ; ("page?", Wire.Bool true) ]
  in
  let it = Cmdk_state.item_of_row row 0 in
  check "row page item"
    (it.Cmdk_state.iicon = "file" && it.act = Cmdk_state.Open_page "bu"
    && it.ititle = "T" && it.header = None);
  let brow =
    wmap
      [ ("block/uuid", Wire.Uuid "bu2")
      ; ("block.temp/original-title", Wire.String "B")
      ; ("page?", Wire.Bool false)
      ; ( "block.temp/breadcrumb"
        , Wire.List [ wmap [ ("block/title", Wire.String "P") ] ]) ]
  in
  let ib = Cmdk_state.item_of_row brow 3 in
  check "row block item"
    (ib.iicon = "point-filled" && ib.act = Cmdk_state.Open_block "bu2"
    && ib.header = Some "P" && ib.ikey = "node-bu2-3");
  (* current-page badge needs the page route + loaded page *)
  let saved_route = !Runtime.current_route
  and saved_page = !Runtime.current_page in
  Runtime.current_route := Some (Model.Page "x");
  Runtime.current_page := Some (page []);
  check "badge page on current page"
    (Cmdk_state.badge_of row true "p" = Cmdk_state.Text_badge);
  check "badge block on current page"
    (Cmdk_state.badge_of (wmap [ ("block/page", Wire.Uuid "p") ]) false "x"
     = Cmdk_state.Header_badge);
  check "badge other page"
    (Cmdk_state.badge_of row true "other" = Cmdk_state.No_badge);
  Runtime.current_route := saved_route;
  Runtime.current_page := saved_page;
  (* search opts *)
  let so = Cmdk_state.search_opts true 20 in
  check "search_opts move-mode"
    (Wire.get so "page-only?" = Some (Wire.Bool true)
    && Wire.get so "limit" = Some (Wire.Int 20));
  check "search_opts normal"
    (Wire.get (Cmdk_state.search_opts false 10) "page-only?" = None)

let test_cmdk_view () =
  (* hl matching uses idx — items only get real indices via renumber *)
  let i1 = { (cmdk_item "one") with Cmdk_state.idx = 0 }
  and i2 = { (cmdk_item "two") with Cmdk_state.idx = 1 } in
  let g1 = cmdk_group Cmdk_state.G_nodes [ i1; i2 ] in
  let v =
    { Cmdk_state.initial_view with
      groups = [ g1 ]; hl = 1; mouse = true; input = "q"
    ; filter = Some Cmdk_state.G_nodes }
  in
  let dv = Cmdk_state.decorate v in
  let g = List.hd dv.Cmdk_state.groups in
  check "decorate bakes filter + mouse + iq"
    (g.gfilter_active
    && List.for_all
         (fun (it : Cmdk_state.item) -> it.imouse && it.iq = "q")
         g.gitems);
  check "decorate bakes hl"
    ((List.nth g.gitems 1).ihl && not (List.hd g.gitems).ihl);
  (* renumber assigns flat indices across groups *)
  let g2 = cmdk_group Cmdk_state.G_commands [ cmdk_item "three" ] in
  let re = Cmdk_state.renumber [ g1; g2 ] in
  check "renumber across groups"
    ((List.hd (List.nth re 1).gitems).idx = 2);
  eqi "flat_items" 2
    (Array.length
       (Cmdk_state.flat_items { v with groups = [ g1 ] }));
  check "item_at"
    (match Cmdk_state.item_at { v with groups = [ g1 ] } 1 with
     | Some it -> it.ititle = "two"
     | None -> false);
  check "item_at oob" (Cmdk_state.item_at v 99 = None);
  check "dom key changes on hl"
    (Cmdk_state.item_dom_key i1
     <> Cmdk_state.item_dom_key { i1 with ihl = true });
  check "dom key stable"
    (Cmdk_state.item_dom_key i1 = Cmdk_state.item_dom_key i1);
  (* node_exists suppresses the Create row *)
  check "node_exists" (Cmdk_state.node_exists "Two" [ i2 ]);
  check "node_exists miss" (not (Cmdk_state.node_exists "nope" [ i2 ]));
  check "node_exists only pages"
    (not
       (Cmdk_state.node_exists "two"
          [ { i2 with act = Cmdk_state.Open_block "x" } ]));
  (* upsert_create placement *)
  let v2 =
    Cmdk_state.upsert_create
      { Cmdk_state.initial_view with input = "x"; groups = [ g1 ] }
  in
  check "upsert create first unfiltered"
    ((List.hd v2.groups).gid = Cmdk_state.G_create
    && List.length v2.groups = 2);
  let v3 =
    Cmdk_state.upsert_create
      { Cmdk_state.initial_view with input = "x"; groups = [ g1 ]
                                   ; filter = Some Cmdk_state.G_nodes }
  in
  check "upsert create last when filtered"
    ((List.nth v3.groups 1).gid = Cmdk_state.G_create)

let test_cmdk_groups () =
  let gids v q rows total =
    List.map
      (fun (g : Cmdk_state.group) -> g.gid)
      (Cmdk_state.group_order v q rows total)
  in
  let v = Cmdk_state.initial_view in
  check "blank input order"
    (gids v "" [] 0
     = [ Cmdk_state.G_recently_updated; Cmdk_state.G_filters ]);
  check "query order"
    (gids v "abc" [] 0
     = [ Cmdk_state.G_create; Cmdk_state.G_nodes
       ; Cmdk_state.G_recently_updated; Cmdk_state.G_commands
       ; Cmdk_state.G_files; Cmdk_state.G_filters ]);
  check "leading slash order"
    (gids v "/x" [] 0 = [ Cmdk_state.G_filters; Cmdk_state.G_nodes ]);
  check "mid slash order"
    (gids v "a/b" [] 0
     = [ Cmdk_state.G_create; Cmdk_state.G_nodes; Cmdk_state.G_files
       ; Cmdk_state.G_filters ]);
  let vf = { v with filter = Some Cmdk_state.G_commands } in
  check "filtered order"
    (gids vf "abc" [] 0
     = [ Cmdk_state.G_commands; Cmdk_state.G_create ]);
  let rows = [ cmdk_item ~act:(Cmdk_state.Open_page "u") "abc" ] in
  check "existing node drops create"
    (gids v "abc" rows 1
     = [ Cmdk_state.G_nodes; Cmdk_state.G_recently_updated
       ; Cmdk_state.G_commands; Cmdk_state.G_files
       ; Cmdk_state.G_filters ]);
  (match
     List.find_opt
       (fun (g : Cmdk_state.group) -> g.gid = Cmdk_state.G_nodes)
       (Cmdk_state.group_order v "zzz" rows 7)
   with
   | Some g ->
       check "nodes group totals" (g.gitems = rows && g.gtotal = 7)
   | None -> check "nodes group totals" false);
  (* command table: no dev entries w/o developer-mode, sorted desc by id *)
  let tbl = Cmdk_state.command_table () in
  check "command_table filters dev"
    (List.for_all (fun (c : Commands_data.cmd) -> not c.dev) tbl);
  let ids = List.map (fun (c : Commands_data.cmd) -> c.id) tbl in
  check "command_table sorted desc"
    (ids = List.stable_sort (fun a b -> compare b a) ids);
  check "commands_matched blank = all" (Cmdk_state.commands_matched "" = tbl);
  check "commands_matched fuzzy"
    (List.exists
       (fun (c : Commands_data.cmd) -> c.id = "editor/move-blocks")
       (Cmdk_state.commands_matched "move blocks"))

let () =
  test_move ();
  test_update ();
  test_decode ();
  test_decode2 ();
  test_wire ();
  test_router ();
  test_fuzzy ();
  test_edn ();
  test_update_loaders ();
  test_update_popups ();
  test_update_popups2 ();
  test_dates ();
  test_edn2 ();
  test_fuzzy2 ();
  test_ui_strings ();
  test_block_parse ();
  test_block_parse2 ();
  test_title_refs ();
  test_title_refs2 ();
  test_decode3 ();
  test_decode4 ();
  test_decode5 ();
  test_decode6 ();
  test_editor_state ();
  test_editor_state_rt ();
  test_outliner_ops ();
  test_outliner_ops2 ();
  test_outliner_ops3 ();
  test_outliner_ops4 ();
  test_outliner_ops5 ();
  test_cmdk_items ();
  test_cmdk_rows ();
  test_cmdk_view ();
  test_cmdk_groups ();
  Js.log
    (Printf.sprintf "%d checks, %d failures" !checks !failures);
  if !failures > 0 then exit 1
