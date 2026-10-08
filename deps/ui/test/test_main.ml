(* Pure-logic unit tests for deps/ui, compiled by Melange and run under
   node: node _build/default/test/ui_test/test/ui_test/test_main.js *)

open Test_check

let () = Platform_web.install ~request_flush:Runtime.flush

(* tests exercising model-derived readers stub the live model through
   Runtime.read_model *)
let model_stub = ref Model.initial

let () = Runtime.read_model := (fun () -> !model_stub)

let set_page p = model_stub := { !model_stub with Model.route_page = p }

let set_journals js =
  model_stub := { !model_stub with Model.journals = js }

let set_route r = model_stub := { !model_stub with Model.route = r }

let test_editor_wire_runs () =
  check "editor run wire preserves source spans, kinds and line pads"
    (Logseq_editor.parse_runs "0,4,p;4,6,d;6,18,a;18,29,r;29,29,z;" =
     [| (0, 4, "p"); (4, 6, "d"); (6, 18, "a"); (18, 29, "r"); (29, 29, "z") |]);
  check "empty editor run wire" (Logseq_editor.parse_runs "" = [||]);
  let entries = Array.init 1800 (fun i ->
    Printf.sprintf "%d,%d,p" (i * 12) (i * 12 + 12)) in
  let parsed = Logseq_editor.parse_runs (String.concat ";" (Array.to_list entries)) in
  check "long editor wire retains every source span"
    (Array.length parsed = 1800 && parsed.(1799) = (21588, 21600, "p"))

let test_merge_source () =
  List.iter (fun left ->
    let merged, caret = Editor_actions.merge_source left "suffix" in
    check ("merge token separator " ^ left)
      (merged = left ^ " suffix" && caret = String.length left + 1)
  ) [ "[[node]]"; "#tag"; "#[[tag name]]"; "https://example.test/path"
    ; "[label](https://example.test)"; "**[[node]]**" ];
  List.iter (fun (left, right, expected) ->
    check ("merge literal boundary " ^ left ^ right)
      (fst (Editor_actions.merge_source left right) = expected)
  ) [ "plain", "suffix", "plainsuffix"
    ; "[[node]] ", "suffix", "[[node]] suffix"
    ; "[[node]]", " suffix", "[[node]] suffix"
    ; "[[node]]", "", "[[node]]"
    ; "", "suffix", "suffix"
    ; "`#tag`", "suffix", "`#tag`suffix" ]

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
  let toast = { Model.toast_id = 0; toast_text = "hi"; toast_kind = "success"; toast_key = None } in
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
  (* cljs parity: #/journals is the canonical master route *)
  check "#/journals is Journals"
    (Router.parse_path "journals" = Journals);
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
  let m5 = Update.update m4 (Action.Ref_count_loaded 3) in
  check "ref count loaded" (m5.Model.page_ref_count = 3);
  let m6 = Update.update m5 (Action.Unlinked_exists true) in
  check "unlinked exists" m6.Model.unlinked_exists;
  let m6' = Update.update m6 Action.Unlinked_toggle_open in
  check "unlinked toggle" (m6'.Model.unlinked_open = not m6.Model.unlinked_open);
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
    Update.update m2 (Action.Page_menu_set (Some (10., 15., 20., true, None)))
  in
  check "page_menu set" (m3.page_menu = Some (10., 15., 20., true, None));
  let m4 = Update.update m3 (Action.Appearance_set (Some (1., 2.))) in
  check "appearance clears page_menu"
    (m4.appearance = Some (1., 2.) && m4.page_menu = None);
  let m5 =
    Update.update m4 (Action.Page_menu_set (Some (3., 3., 4., false, None)))
  in
  check "page_menu clears appearance"
    (m5.page_menu = Some (3., 3., 4., false, None) && m5.appearance = None);
  let m6 =
    Update.update m5
      (Action.Confirm_set
         (Some (Model.Confirm_delete_page ("u", "T", false))))
  in
  check "confirm clears both popups"
    (m6.confirm = Some (Model.Confirm_delete_page ("u", "T", false))
    && m6.page_menu = None && m6.appearance = None);
  let m7 = Update.update m6 Action.Dismiss_all in
  check "dismiss_all clears confirm too" (m7.confirm = None)

let test_update_popups2 () =
  let m7 = Update.update Model.initial Action.Dismiss_all in
  (* unlinked refs fold; unlinked_open defaults to true *)
  let m8 = Update.update m7 Action.Unlinked_toggle_open in
  check "unlinked open toggles off" (not m8.unlinked_open);
  check "unlinked open toggles back"
    (Update.update m8 Action.Unlinked_toggle_open).unlinked_open;
  let m11 = Update.update m8 Action.Help_toggle in
  check "help open" m11.help_open;
  check "help toggle back"
    (not (Update.update m11 Action.Help_toggle).help_open);
  let m12 = Update.update m11 Action.Toasts_clear in
  check "toasts cleared" (m12.toasts = []);
  (* Navigate_to resets all page-local UI state *)
  let dirty =
    { Model.initial with
      Model.editing_title = true
    ; page_menu = Some (0., 0., 0., true, None)
    ; appearance = Some (1., 1.)
    ; unlinked_open = true
    ; unlinked_exists = true
    ; page_ref_count = 5
    ; page_missing = true
    }
  in
  let nav = Update.update dirty (Action.Navigate_to Model.All_pages) in
  check "navigate resets page-local state"
    (nav.route = Model.All_pages && not nav.editing_title
    && nav.page_menu = None && nav.appearance = None
    && not nav.unlinked_open && not nav.unlinked_exists
    && nav.page_ref_count = 0 && not nav.page_missing)

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
  check "starts_with" (Str_util.starts_with "foobar" "foo");
  check "starts_with neg"
    (not (Str_util.starts_with "foo" "foobar"));
  check "index_of empty" (Str_util.index_of "abc" "" = Some 0);
  check "index_of mid" (Str_util.index_of "abc" "bc" = Some 1);
  check "index_of miss" (Str_util.index_of "abc" "bd" = None);
  check "index_of longer" (Str_util.index_of "ab" "abc" = None);
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

(* ---- I18n + Commands_data ---- *)

let test_ui_strings () =
  eqs "t known key" "Create page" (I18n.t "cmdk.create/page");
  eqs "t unknown falls back to key" "no/such-key"
    (I18n.t "no/such-key");
  eqs "tf {1}" "Create page called 'X'"
    (I18n.tf "cmdk.info/create-page" [ "X" ]);
  eqs "tf extra arg unused" "Create page called 'X'"
    (I18n.tf "cmdk.info/create-page" [ "X"; "Y" ]);
  eqs "replace_all" "a-b-c"
    (I18n.replace_all "a+b+c" "+" "-");
  eqs "replace_all miss" "abc"
    (I18n.replace_all "abc" "+" "-");
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
  let t', refs, tags, _ = Block_parse.parse_title "plain text" in
  check "plain title" (t' = "plain text" && refs = [] && tags = []);
  (* [[page]] -> [[uuid]] + ref map *)
  let t2, refs2, tags2, _ = Block_parse.parse_title "see [[Foo Bar]]" in
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
  (* #tag -> literal title + ref entry only (bare #x is a hash ref,
     never a block tag) *)
  let t3, refs3, tags3, _ = Block_parse.parse_title "x #Baz" in
  (match (refs3, tags3) with
   | [ r ], [] ->
       check "tag ref rewritten"
         (t3 = "x #Baz"
         && Wire.map_get_string r "block/title" = Some "Baz"
         && Wire.map_get_uuid r "block/uuid" <> None)
   | _ -> check "tag ref rewritten" false)

let test_block_parse2 () =
  let uu = "01234567-89ab-cdef-0123-456789abcdef" in
  (* already id-ref form: title kept, lookup ref emitted *)
  let t', refs, _, _ = Block_parse.parse_title ("see [[" ^ uu ^ "]]") in
  check "uuid ref passthrough"
    (t' = "see [[" ^ uu ^ "]]"
    && refs = [ Wire.Array [ Wire.kw "block/uuid"; Wire.Uuid uu ] ]);
  (* ((uuid)) block ref *)
  let t2, refs2, _, _ = Block_parse.parse_title ("see ((" ^ uu ^ "))") in
  check "block ref passthrough"
    (t2 = "see ((" ^ uu ^ "))"
    && refs2 = [ Wire.Array [ Wire.kw "block/uuid"; Wire.Uuid uu ] ]);
  (* same page twice: one ref map, both occurrences share the uuid *)
  let t3, refs3, _, _ = Block_parse.parse_title "[[X]] and [[X]]" in
  (match refs3 with
   | [ m ] -> (
       match Wire.map_get_uuid m "block/uuid" with
       | Some u ->
           check "dedup shares uuid"
             (t3 = "[[" ^ u ^ "]] and [[" ^ u ^ "]]")
       | None -> check "dedup shares uuid" false)
   | _ -> check "dedup shares uuid" false);
  (* #[[name]] tag form *)
  let t4, refs4, tags4, _ = Block_parse.parse_title "#[[Two Words]]" in
  check "#[[x]] tag"
    (List.length refs4 = 1 && List.length tags4 = 1
    && String.sub t4 0 3 = "#[[");
  (* title_fields drops empty collections *)
  eqi "title_fields plain" 1
    (List.length (fst (Block_parse.title_fields "plain")));
  eqi "title_fields with refs" 2
    (List.length (fst (Block_parse.title_fields "a [[p]] #t")))

(* ---- Title_refs ---- *)

let test_title_refs () =
  let refs, tags, hash =
    Title_refs.scan_title "a [[X]] b #y c [[X]] #[[Z]] d #y"
  in
  (* dedup keeps the LAST occurrence: order is right-to-left *)
  eq "scan_title refs deduped" [ "y"; "Z"; "X" ] refs
    (String.concat ",");
  (* #[[Z]] and the bare #y both tag the block (cljs parity) *)
  eq "scan_title tags deduped" [ "y"; "Z" ] tags
    (String.concat ",");
  eq "scan_title hash deduped" [ "y" ] hash
    (String.concat ",");
  check "scan_title empty" (Title_refs.scan_title "plain" = ([], [], []));
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
      ; is_hash = false; fresh = true; entity = Wire.Nil }
    ; { Title_refs.name = "y"; uuid = "u2"; is_tag = true
      ; is_hash = true; fresh = true; entity = Wire.Nil }
    ; { Title_refs.name = "foobar"; uuid = "u3"; is_tag = true
      ; is_hash = true; fresh = true; entity = Wire.Nil } ]
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
         ; is_hash = true; fresh = true; entity = Wire.Nil } ]
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
       check "new_tag_map ident" (Str_util.starts_with i "user.class/Baz-")
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
  (* unmounted state falls back to initial *)
  check "editing none unmounted" (Editor_state.editing () = None);
  check "selection empty unmounted"
    (not (Editor_state.selection_active ()))

let test_editor_state_rt () =
  let saved_model = !model_stub in
  let gc = block "g" "gc" in
  let coll =
    { (block ~children:[ gc ] "c" "child") with
      Model.block_default_collapsed = true }
  in
  let t1 = block "t1" "a" and t2 = block "t2" "b" in
  set_page (Some (page [ coll; t1; t2 ]));
  eqi "flat_all includes collapsed subtree" 4
    (List.length (Editor_state.flat_all ()));
  let vis = Editor_state.flat_visible () in
  check "flat_visible skips collapsed subtree"
    (List.map
       (fun (b : Model.block) -> Option.value b.block_uuid ~default:"")
       vis
     = [ "c"; "t1"; "t2" ]);
  check "find via route_page" (Option.is_some (Editor_state.find "g"));
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
  set_page None;
  set_journals [ page [ block "j" "j" ] ];
  eqi "page_blocks journals fallback" 1
    (List.length (Editor_state.page_blocks ()));
  model_stub := saved_model

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
  (* normalized_title: markdown heading split out unless the block has a
     display type (the saved map itself is built async via
     block_map_parsed — Title_refs resolves entities through the worker) *)
  let saved_model = !model_stub in
  set_page None;
  eqs "normalized_title strips heading" "hello [[P]]"
    (Outliner_ops.normalized_title "u" "  ## hello [[P]]");
  let codeblk =
    { (block "cb" "x") with Model.block_display_type = Some "code" } in
  set_page (Some (page [ codeblk ]));
  eqs "normalized_title code" "## raw"
    (Outliner_ops.normalized_title "cb" " ## raw");
  model_stub := saved_model;
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
         (Outliner_ops.indent_outdent ~logical:false ~parent_original:"po" [ "a" ] true)
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
    (match op_name_args (Outliner_ops.create_page "t") with
     | Some ("create-page", [ _; Wire.Map _ as m ]) ->
         Wire.get m "split-namespace?" = Some (Wire.Bool true)
     | _ -> false);
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
  Cmdk_state.install (Cmdk_host.services ());
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
         && it.act = Cmdk_state.Create_tag "mytag")
   | _ -> check "create tag item" false);
  (* filter rows: leading current-page row only when a page is current *)
  eqi "filters no page" 5 (List.length (Cmdk_state.filter_items ()));
  let saved_model = !model_stub in
  set_route (Model.Page "x");
  set_page (Some (page []));
  let fs = Cmdk_state.filter_items () in
  check "filters with page"
    (List.length fs = 6
    && (List.hd fs).Cmdk_state.act
       = Cmdk_state.Set_filter Cmdk_state.G_current_page);
  model_stub := saved_model;
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
  let saved_model = !model_stub in
  set_route (Model.Page "x");
  set_page (Some (page []));
  check "badge page on current page"
    (Cmdk_state.badge_of row true "p" = Cmdk_state.Text_badge);
  check "badge block on current page"
    (Cmdk_state.badge_of (wmap [ ("block/page", Wire.Uuid "p") ]) false "x"
     = Cmdk_state.Header_badge);
  check "badge other page"
    (Cmdk_state.badge_of row true "other" = Cmdk_state.No_badge);
  model_stub := saved_model;
  (* search opts *)
  let so = Cmdk_state.search_opts ~dev:true true 20 in
  check "search_opts move-mode"
    (Wire.get so "page-only?" = Some (Wire.Bool true)
    && Wire.get so "limit" = Some (Wire.Int 20)
    && Wire.get so "dev?" = Some (Wire.Bool true));
  check "search_opts normal"
    (Wire.get (Cmdk_state.search_opts ~dev:false false 10) "page-only?" = None)

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
  check "dom key stable on hl"
    (Cmdk_state.item_dom_key i1
     = Cmdk_state.item_dom_key { i1 with ihl = true });
  check "dom key differs per item"
    (Cmdk_state.item_dom_key i1 <> Cmdk_state.item_dom_key i2);
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
  (* cljs :default refresh only fires on an input change, so a fresh-open
     blank palette shows recents alone; the filters group appears once
     the input has been edited *)
  check "blank input order"
    (gids v "" [] 0 = [ Cmdk_state.G_recently_updated ]);
  check "blank input order after edit"
    (gids { v with Cmdk_state.edited = true } "" [] 0
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
    (List.for_all (fun (c : Cmdk_services.cmd) -> not c.dev) tbl);
  let ids = List.map (fun (c : Cmdk_services.cmd) -> c.id) tbl in
  check "command_table sorted desc"
    (ids = List.stable_sort (fun a b -> compare b a) ids);
  check "commands_matched blank = all" (Cmdk_state.commands_matched "" = tbl);
  check "commands_matched fuzzy"
    (List.exists
       (fun (c : Cmdk_services.cmd) -> c.id = "editor/move-blocks")
       (Cmdk_state.commands_matched "move blocks"))

(* ---- Model.indent_blocks / outdent_blocks ---- *)

let uus bs =
  List.map
    (fun (b : Model.block) -> Option.value b.Model.block_uuid ~default:"?")
    bs

let test_model_indent () =
  let p = page [ block "a" "A"; block "b" "B"; block "c" "C" ] in
  (* contiguous run absorbed by previous unselected sibling *)
  (match Model.indent_blocks p [ "b"; "c" ] with
   | Some p' -> (
       check "indent run: top reduced"
         (uus p'.Model.page_blocks = [ "a" ]);
       match p'.Model.page_blocks with
       | [ a ] ->
           check "indent run: children appended"
             (uus a.Model.block_children = [ "b"; "c" ])
       | _ -> check "indent run: children appended" false)
   | None -> check "indent run" false);
  (* first child has no previous sibling *)
  check "indent first child no-op"
    (Model.indent_blocks p [ "a" ] = None);
  (* non-contiguous: c joins previous unselected sibling b; a stays *)
  (match Model.indent_blocks p [ "a"; "c" ] with
   | Some p' -> (
       check "indent non-contig tops"
         (uus p'.Model.page_blocks = [ "a"; "b" ]);
       match p'.Model.page_blocks with
       | [ _; b ] ->
           check "indent non-contig: c under b"
             (uus b.Model.block_children = [ "c" ])
       | _ -> check "indent non-contig: c under b" false)
   | None -> check "indent non-contig" false);
  (* duplicate uuids = single *)
  (match
     (Model.indent_blocks p [ "b"; "b" ], Model.indent_blocks p [ "b" ])
   with
   | Some x, Some y -> check "indent dup = single" (x = y)
   | _ -> check "indent dup = single" false);
  check "indent unknown no-op" (Model.indent_blocks p [ "zz" ] = None);
  (* linked/embed rows are not indent targets *)
  let pl =
    page
      [ { (block "e" "E") with Model.block_link = Some 7 }
      ; block "b" "B" ]
  in
  check "indent link row not target"
    (Model.indent_blocks pl [ "b" ] = None);
  (* a link row further up doesn't block a later absorb *)
  let pl2 =
    page
      [ { (block "e" "E") with Model.block_link = Some 7 }
      ; block "b" "B"; block "c" "C" ]
  in
  (* a run headed by b cannot absorb into a link row above, so the
     whole indent is refused *)
  check "indent past link refused"
    (Model.indent_blocks pl2 [ "b"; "c" ] = None);
  (* selecting only c still indents it under b *)
  (match Model.indent_blocks pl2 [ "c" ] with
   | Some p' -> (
       match p'.Model.page_blocks with
       | [ _e; b' ] ->
           check "indent past link: c under b"
             (uus b'.Model.block_children = [ "c" ])
       | _ -> check "indent past link: c under b" false)
   | None -> check "indent past link: c under b" false);
  (* nested level *)
  let pn =
    page
      [ block ~children:[ block "x" "X"; block "y" "Y" ] "p" "P" ]
  in
  (match Model.indent_blocks pn [ "y" ] with
   | Some p' -> (
       match p'.Model.page_blocks with
       | [ pr ] -> (
           match pr.Model.block_children with
           | [ x ] ->
               check "indent nested: y under x"
                 (uus x.Model.block_children = [ "y" ])
           | _ -> check "indent nested: y under x" false)
       | _ -> check "indent nested" false)
   | None -> check "indent nested" false);
  (* parent block indents under previous top-level sibling, taking its
     children along *)
  let pm =
    page
      [ block "a" "A"
      ; block ~children:[ block "x" "X"; block "y" "Y" ] "p" "P" ]
  in
  (match Model.indent_blocks pm [ "p" ] with
   | Some p' -> (
       match p'.Model.page_blocks with
       | [ a' ] -> (
           match a'.Model.block_children with
           | [ pr ] ->
               check "indent parent keeps children"
                 (uus pr.Model.block_children = [ "x"; "y" ])
           | _ -> check "indent parent keeps children" false)
       | _ -> check "indent parent" false)
   | None -> check "indent parent" false);
  (* uuid-less blocks still absorb a selected next sibling *)
  let pu =
    page
      [ { (block "x" "X") with Model.block_uuid = None }
      ; block "b" "B" ]
  in
  (match Model.indent_blocks pu [ "b" ] with
   | Some p' -> (
       match p'.Model.page_blocks with
       | [ x ] ->
           check "indent under uuid-less" (uus x.Model.block_children = [ "b" ])
       | _ -> check "indent under uuid-less" false)
   | None -> check "indent under uuid-less" false)

let test_model_outdent () =
  let pb =
    block ~children:[ block "a" "A"; block "b" "B"; block "c" "C" ] "p" "P"
  in
  let p = page [ pb ] in
  (* middle child outdents; its right siblings move under it *)
  (match Model.outdent_blocks ~logical:false p [ "b" ] with
   | Some p' -> (
       check "outdent mid: order" (uus p'.Model.page_blocks = [ "p"; "b" ]);
       match p'.Model.page_blocks with
       | [ pr; b' ] ->
           check "outdent mid: prefix stays"
             (uus pr.Model.block_children = [ "a" ]);
           check "outdent mid: suffix under selected"
             (uus b'.Model.block_children = [ "c" ])
       | _ -> check "outdent mid" false)
   | None -> check "outdent mid" false);
  (* Logical mode lifts the run without adopting following siblings. *)
  (match Model.outdent_blocks ~logical:true p [ "a"; "b" ] with
   | Some { Model.page_blocks = [ pr; a'; b' ]; _ } ->
       check "logical outdent retains later siblings under parent"
         (uus pr.Model.block_children = [ "c" ]
          && a'.Model.block_children = [] && b'.Model.block_children = [])
   | _ -> check "logical outdent shape" false);
  (* contiguous run at tail: no suffix *)
  (match Model.outdent_blocks ~logical:false p [ "b"; "c" ] with
   | Some p' -> (
       match p'.Model.page_blocks with
       | [ pr; b'; c' ] ->
           check "outdent tail run"
             (uus p'.Model.page_blocks = [ "p"; "b"; "c" ]
             && uus pr.Model.block_children = [ "a" ]
             && b'.Model.block_children = []
             && c'.Model.block_children = [])
       | _ -> check "outdent tail run" false)
   | None -> check "outdent tail run" false);
  (* head run: empty prefix, suffix under last selected *)
  (match Model.outdent_blocks ~logical:false p [ "a"; "b" ] with
   | Some p' -> (
       match p'.Model.page_blocks with
       | [ pr; _; b' ] ->
           check "outdent head: empty prefix" (pr.Model.block_children = []);
           check "outdent head: suffix under last"
             (uus b'.Model.block_children = [ "c" ])
       | _ -> check "outdent head" false)
   | None -> check "outdent head" false);
  (* non-contiguous: only the first selected run outdents; later
     selected blocks land inside it as children *)
  (match Model.outdent_blocks ~logical:false p [ "a"; "c" ] with
   | Some p' -> (
       match p'.Model.page_blocks with
       | [ _; a' ] ->
           check "outdent non-contig: c under a"
             (uus a'.Model.block_children = [ "b"; "c" ])
       | _ -> check "outdent non-contig" false)
   | None -> check "outdent non-contig" false);
  check "outdent top-level no-op" (Model.outdent_blocks ~logical:false p [ "p" ] = None);
  check "outdent unknown no-op" (Model.outdent_blocks ~logical:false p [ "z" ] = None);
  (* selected block keeps own children; suffix appended after them *)
  let pb2 =
    block
      ~children:
        [ { (block "b" "B") with
            Model.block_children = [ block "g" "G" ] }
        ; block "x" "X" ]
      "p" "P"
  in
  (match Model.outdent_blocks ~logical:false (page [ pb2 ]) [ "b" ] with
   | Some p' -> (
       match p'.Model.page_blocks with
       | [ _; b' ] ->
           check "outdent keeps children, suffix appended"
             (uus b'.Model.block_children = [ "g"; "x" ])
       | _ -> check "outdent keeps children" false)
   | None -> check "outdent keeps children" false);
  (match Model.outdent_blocks ~logical:true (page [ pb2 ]) [ "b" ] with
   | Some { Model.page_blocks = [ pr; b' ]; _ } ->
       check "logical outdent preserves both existing subtrees"
         (uus pr.Model.block_children = [ "x" ]
          && uus b'.Model.block_children = [ "g" ])
   | _ -> check "logical outdent subtrees" false);
  (* several parents in one pass *)
  let p2 =
    page
      [ block ~children:[ block "a" "A"; block "b" "B" ] "p1" "P1"
      ; block ~children:[ block "c" "C"; block "d" "D" ] "p2" "P2" ]
  in
  (match Model.outdent_blocks ~logical:false p2 [ "b"; "d" ] with
   | Some p' ->
       check "outdent multi-parent"
         (uus p'.Model.page_blocks = [ "p1"; "b"; "p2"; "d" ])
   | None -> check "outdent multi-parent" false);
  (* deeper nesting *)
  let pd =
    page
      [ block
          ~children:[ block ~children:[ block "x" "X"; block "y" "Y" ] "m" "M" ]
          "p" "P" ]
  in
  (match Model.outdent_blocks ~logical:false pd [ "y" ] with
   | Some p' -> (
       match p'.Model.page_blocks with
       | [ pr ] -> (
           match pr.Model.block_children with
           | [ m'; yr ] ->
               check "outdent deep"
                 (uus m'.Model.block_children = [ "x" ]
                 && yr.Model.block_uuid = Some "y")
           | _ -> check "outdent deep" false)
       | _ -> check "outdent deep" false)
   | None -> check "outdent deep" false)

(* ---- sdk_convert ---- *)

external undefined_json : Js.Json.t = "undefined"

let json_get o k =
  match Js.Json.decodeObject o with
  | Some d -> Js.Dict.get d k
  | None -> None

let json_str o k = Option.bind (json_get o k) Js.Json.decodeString

let test_sdk_convert () =
  eqs "camel basic" "journalDay" (Sdk_convert.camel_case "journal-day");
  eqs "camel snake" "aBC" (Sdk_convert.camel_case "a_b-c");
  eqs "camel trailing dash" "x" (Sdk_convert.camel_case "x-");
  eqs "camel untouched" "foo" (Sdk_convert.camel_case "foo");
  check "split_ns qualified"
    (Sdk_convert.split_ns "a/b" = (Some "a", "b"));
  check "split_ns unqualified"
    (Sdk_convert.split_ns "abc" = (None, "abc"));
  check "split_ns multi-slash"
    (Sdk_convert.split_ns "a/b/c" = (Some "a", "b/c"));
  eqs "json name kept ns" ":logseq.property/foo"
    (Sdk_convert.json_name_of_keyword "logseq.property/foo");
  eqs "json name block ns" "journalDay"
    (Sdk_convert.json_name_of_keyword "block/journal-day");
  eqs "json name unqualified" "someKey"
    (Sdk_convert.json_name_of_keyword "some-key");
  eqs "json name camel off" "journal-day"
    (Sdk_convert.json_name_of_keyword ~camel:false "block/journal-day");
  check "hidden tx-id" (Sdk_convert.hidden_key (Wire.kw "block/tx-id"));
  check "hidden block.temp"
    (Sdk_convert.hidden_key (Wire.kw "block.temp/x"));
  check "hidden normal" (not (Sdk_convert.hidden_key (Wire.kw "block/title")));
  check "hidden string key"
    (not (Sdk_convert.hidden_key (Wire.String "block.temp/x")));
  eqs "map key kw" "journalDay"
    (Sdk_convert.map_key_json (Wire.kw "block/journal-day"));
  eqs "map key str" "x" (Sdk_convert.map_key_json (Wire.String "x"));
  (* json_of_wire: hidden keys stripped, uuid+title maps get
     content/fullTitle aliases, kept-ns keywords keep ':', sets->arrays *)
  let j =
    Sdk_convert.json_of_wire
      (wmap
         [ "block/uuid", Wire.Uuid "u1"
         ; "block/title", Wire.String "T"
         ; "block/tx-id", Wire.Int 9
         ; "logseq.property/kind", Wire.Keyword "logseq.property.type/number"
         ; "block.temp/x", Wire.String "tmp" ])
  in
  eqs "json uuid" "u1" (Option.value (json_str j "uuid") ~default:"-");
  eqs "json content alias" "T"
    (Option.value (json_str j "content") ~default:"-");
  eqs "json fullTitle alias" "T"
    (Option.value (json_str j "fullTitle") ~default:"-");
  check "json hidden stripped" (json_get j "txId" = None);
  eqs "json kept-ns kw value" ":logseq.property.type/number"
    (Option.value (json_str j ":logseq.property/kind") ~default:"-");
  (match
     json_get
       (Sdk_convert.json_of_wire
          (wmap [ "s", Wire.Set [ Wire.Int 1; Wire.Int 2 ] ]))
       "s"
   with
   | Some a -> (
       match Js.Json.decodeArray a with
       | Some arr -> check "json set->array" (Array.length arr = 2)
       | None -> check "json set->array" false)
   | None -> check "json set->array" false);
  (* wire_of_json *)
  check "wire undefined" (Sdk_convert.wire_of_json undefined_json = Wire.Nil);
  check "wire int" (Sdk_convert.wire_of_json (Js.Json.number 3.0) = Wire.Int 3);
  check "wire float"
    (Sdk_convert.wire_of_json (Js.Json.number 1.5) = Wire.Float 1.5);
  check "wire bool"
    (Sdk_convert.wire_of_json (Js.Json.boolean true) = Wire.Bool true);
  check "wire null" (Sdk_convert.wire_of_json Js.Json.null = Wire.Nil);
  check "wire string"
    (Sdk_convert.wire_of_json (Js.Json.string "s") = Wire.String "s");
  check "wire obj string keys"
    (Sdk_convert.wire_of_json
       (Js.Json.object_ (Js.Dict.fromList [ "k", Js.Json.number 1.0 ]))
     = Wire.Map [ (Wire.String "k", Wire.Int 1) ]);
  check "wire array"
    (Sdk_convert.wire_of_json (Js.Json.array [| Js.Json.number 1.0 |])
     = Wire.Array [ Wire.Int 1 ]);
  (* key_reduces *)
  check "reduces block/tags" (Sdk_convert.key_reduces (Wire.kw "block/tags"));
  check "reduces block/title"
    (not (Sdk_convert.key_reduces (Wire.kw "block/title")));
  check "reduces db ns" (not (Sdk_convert.key_reduces (Wire.kw "db/ident")));
  check "reduces custom ns" (Sdk_convert.key_reduces (Wire.kw "custom/prop"));
  check "reduces unqualified" (Sdk_convert.key_reduces (Wire.kw "tags"));
  check "reduces never string"
    (not (Sdk_convert.key_reduces (Wire.String "block/tags")));
  (* ref_ids *)
  let ent = wmap [ "db/id", Wire.Int 42; "block/title", Wire.String "t" ] in
  check "ref_ids collapse"
    (Sdk_convert.ref_ids ent = Wire.Int 42);
  check "ref_ids int64"
    (Sdk_convert.ref_ids (wmap [ "db/id", Wire.Int64 9L ]) = Wire.Int 9);
  check "ref_ids no id recurses"
    (Sdk_convert.ref_ids (wmap [ "x", wmap [ "db/id", Wire.Int 2 ] ])
     = wmap [ "x", Wire.Int 2 ]);
  (* property_refs_to_ids: only ref keys collapse *)
  check "refs->ids under block/tags"
    (Sdk_convert.property_refs_to_ids
       (wmap [ "block/tags", Wire.List [ ent ] ])
     = wmap [ "block/tags", Wire.List [ Wire.Int 42 ] ]);
  check "refs->ids keeps block/title"
    (Sdk_convert.property_refs_to_ids (wmap [ "block/title", ent ])
     = wmap [ "block/title", ent ]);
  check "refs->ids custom key"
    (Sdk_convert.property_refs_to_ids (wmap [ "custom/ref", ent ])
     = wmap [ "custom/ref", Wire.Int 42 ])

(* ---- sdk_util ---- *)

let test_sdk_util () =
  check "uuid ok"
    (Wire.is_uuid_string "123e4567-e89b-42d3-a456-426614174000");
  check "uuid bad len" (not (Wire.is_uuid_string "123e4567"));
  check "uuid bad dash pos"
    (not
       (Wire.is_uuid_string "123e4567e89b-42d3-a456-426614174000"));
  check "uuid non-hex head"
    (not
       (Wire.is_uuid_string "zzze4567-e89b-42d3-a456-426614174000"));
  (* only the first 8 chars are hex-checked — pin the quirk *)
  check "uuid lax tail"
    (Wire.is_uuid_string "123e4567-xxxx-xxxx-xxxx-xxxxxxxxxxxx");
  eqs "trim_leading mixed" "x" (Sdk_util.trim_leading ":_ \t\nx");
  eqs "trim_leading all" "" (Sdk_util.trim_leading ":_ :_");
  eqs "trim_leading none" "abc" (Sdk_util.trim_leading "abc");
  check "ident_char"
    (Sdk_util.ident_char_ok 'a' && Sdk_util.ident_char_ok '?'
    && not (Sdk_util.ident_char_ok ' '));
  eqs "normalize digit" "NUM-3abc" (Sdk_util.normalize_ident_name "3abc");
  eqs "normalize filters" "ab?c" (Sdk_util.normalize_ident_name "a b?c");
  eqs "property_title" "foo" (Sdk_util.property_title " : foo ");
  eqs "sanitize prop" "myprop" (Sdk_util.sanitize_property_name " my prop ");
  eqs "ident qualified" "ns/x" (Sdk_util.property_ident "ns/x");
  eqs "ident unqualified" "plugin.property._test_plugin/foo"
    (Sdk_util.property_ident "foo");
  eqs "ident digit" "plugin.property._test_plugin/NUM-3x"
    (Sdk_util.property_ident "3x");
  check "wire_elems array"
    (Wire.elems (Wire.Array [ Wire.Int 1 ]) = [ Wire.Int 1 ]);
  check "wire_elems map" (Wire.elems (Wire.Map []) = []);
  eqs "sanity lc" "foo" (Sdk_util.page_name_sanity_lc "Foo");
  eqs "sanity boundary slashes" "foo"
    (Sdk_util.page_name_sanity_lc "/Foo/");
  eqs "sanity ns child" "ns/child" (Sdk_util.page_name_sanity_lc "/ns/child");
  eqi "find_from hit" 2 (Sdk_util.find_from "aabb" 0 "b");
  eqi "find_from miss" (-1) (Sdk_util.find_from "aa" 0 "b");
  eqi "find_from offset" 1 (Sdk_util.find_from "abab" 1 "b");
  eqi "find_from offset 2" 3 (Sdk_util.find_from "abab" 2 "b");
  check "page_ref_names basic"
    (Sdk_util.page_ref_names "see [[Some Page]]" = [ "Some Page" ]);
  check "page_ref_names uuid skipped"
    (Sdk_util.page_ref_names "[[123e4567-e89b-42d3-a456-426614174000]]" = []);
  check "page_ref_names dedup"
    (Sdk_util.page_ref_names "[[x]] and [[x]]" = [ "x" ]);
  check "page_ref_names unclosed" (Sdk_util.page_ref_names "[[open" = []);
  check "page_ref_names empty" (Sdk_util.page_ref_names "[[]]" = []);
  eqs "replace_all" "xbx" (Sdk_util.replace_all "xax" ~pat:"a" ~rep:"b");
  eqs "replace_all empty pat" "ab"
    (Sdk_util.replace_all "ab" ~pat:"" ~rep:"x");
  check "collect_title_strings nested"
    (List.sort compare
       (Sdk_util.collect_title_strings
          (wmap
             [ "block/title", Wire.String "t1"
             ; "x", Wire.List [ wmap [ "block/title", Wire.String "t2" ] ] ])
          [])
     = [ "t1"; "t2" ]);
  eqs "edn_escape" "a\\\\b\\\"c" (Sdk_util.edn_escape "a\\b\"c");
  check "hashtag start" (Sdk_util.hashtag_names "#tag text" = [ "tag" ]);
  check "hashtag after space" (Sdk_util.hashtag_names "a #tag" = [ "tag" ]);
  check "hashtag mid-word skipped" (Sdk_util.hashtag_names "a#tag" = []);
  check "hashtag digit skipped" (Sdk_util.hashtag_names "#1tag" = []);
  check "hashtag bracket skipped" (Sdk_util.hashtag_names "#[[x]]" = []);
  check "hashtag tag chars" (Sdk_util.hashtag_names "#a-b.c_d" = [ "a-b.c_d" ]);
  check "hashtag after paren" (Sdk_util.hashtag_names "(#tag)" = [ "tag" ]);
  check "hashtag dedup" (Sdk_util.hashtag_names "#t #t" = [ "t" ]);
  (* rewrite_title_refs: [[name]] -> [[uuid]], stub appended to
     block/refs; only class-resolved hashtags also land in block/tags *)
  let out =
    Sdk_util.rewrite_title_refs ~tags:[] [ ("x", "u-x") ]
      (wmap
         [ "block/title", Wire.String "see [[X]]"
         ; "block/refs", Wire.List [ wmap [ "block/uuid", Wire.Uuid "old" ] ] ])
  in
  eqs "rewrite title" "see [[u-x]]"
    (Option.value (Wire.map_get_string out "block/title") ~default:"");
  (match Wire.get out "block/refs" with
   | Some (Wire.List [ _old; stub ]) ->
       check "rewrite ref stub"
         (Wire.map_get_string stub "block/title" = Some "X"
         && Wire.map_get_uuid stub "block/uuid" = Some "u-x"
         && Wire.map_get_string stub "block/name" = Some "x"
         && Wire.map_get_string stub "block/type" = Some "page")
   | _ -> check "rewrite ref stub" false);
  let out2 =
    Sdk_util.rewrite_title_refs ~tags:[ "cls" ]
      [ ("cls", "u-cls"); ("misc", "u-misc") ]
      (wmap
         [ "block/title", Wire.String "a #cls and #misc"
         ; "block/tags", Wire.List [] ])
  in
  (match Wire.get out2 "block/tags" with
   | Some (Wire.List [ tag ]) ->
       check "rewrite class tag stub"
         (Wire.map_get_uuid tag "block/uuid" = Some "u-cls"
         && Wire.get tag "block/type" = None)
   | _ -> check "rewrite class tag stub" false);
  (match Wire.get out2 "block/refs" with
   | Some (Wire.List xs) ->
       check "rewrite hashtags both become refs" (List.length xs = 2)
   | _ -> check "rewrite hashtags both become refs" false);
  (* non-class hashtag: no block/tags key added *)
  let out3 =
    Sdk_util.rewrite_title_refs ~tags:[] [ ("misc", "u-misc") ]
      (wmap [ "block/title", Wire.String "a #misc" ])
  in
  check "rewrite non-class tag: no tags key"
    (Wire.get out3 "block/tags" = None);
  (* already-id refs untouched *)
  let idtitle = "[[123e4567-e89b-42d3-a456-426614174000]]" in
  check "rewrite id refs untouched"
    (Sdk_util.rewrite_title_refs ~tags:[] []
       (wmap [ "block/title", Wire.String idtitle ])
     = wmap [ "block/title", Wire.String idtitle ]);
  (* nested maps recurse *)
  (match
     Wire.get
       (Sdk_util.rewrite_title_refs ~tags:[] [ ("p", "u-p") ]
          (wmap
             [ "nested", wmap [ "block/title", Wire.String "[[P]]" ] ]))
       "nested"
   with
   | Some m ->
       eqs "rewrite nested" "[[u-p]]"
         (Option.value (Wire.map_get_string m "block/title") ~default:"")
   | None -> check "rewrite nested" false);
  (* block_of_pair *)
  check "block_of_pair key"
    (Wire.block_of_pair
       (Wire.Map [ (Wire.String "block", Wire.Int 5) ])
     = Some (Wire.Int 5));
  check "block_of_pair seq"
    (Wire.block_of_pair
       (Wire.Array [ Wire.Int 1; Wire.String "b" ])
     = Some (Wire.String "b"));
  check "block_of_pair none" (Wire.block_of_pair (Wire.Int 1) = None);
  (* eid_wire_of_json *)
  check "eid number"
    (Sdk_util.eid_wire_of_json (Js.Json.number 5.0) = Some (Wire.Int64 5L));
  check "eid string"
    (Sdk_util.eid_wire_of_json (Js.Json.string "s") = Some (Wire.String "s"));
  check "eid {id}"
    (Sdk_util.eid_wire_of_json
       (Js.Json.object_ (Js.Dict.fromList [ "id", Js.Json.number 3.0 ]))
     = Some (Wire.Int64 3L));
  check "eid {uuid}"
    (Sdk_util.eid_wire_of_json
       (Js.Json.object_ (Js.Dict.fromList [ "uuid", Js.Json.string "u" ]))
     = Some (Wire.String "u"));
  check "eid null" (Sdk_util.eid_wire_of_json Js.Json.null = None);
  (* is_class_entity *)
  check "class entity"
    (Sdk_util.is_class_entity
       (wmap
          [ "block/tags"
          , Wire.Set
              [ wmap [ "db/ident", Wire.Keyword "logseq.class/Tag" ] ] ]));
  check "non-class entity"
    (not
       (Sdk_util.is_class_entity
          (wmap
             [ "block/tags"
             , Wire.Set
                 [ wmap [ "db/ident", Wire.Keyword "logseq.class/Page" ] ]
             ])));
  check "block_uuid_of"
    (Sdk_util.block_uuid_of (wmap [ "block/uuid", Wire.Uuid "uu" ])
     = Some "uu");
  (* arg helpers *)
  check "arg_is_nil null" (Sdk_util.arg_is_nil Js.Json.null);
  check "arg_is_nil undefined" (Sdk_util.arg_is_nil undefined_json);
  check "arg_is_nil val" (not (Sdk_util.arg_is_nil (Js.Json.number 0.0)));
  check "arg_string" (Sdk_util.arg_string (Js.Json.string "x") = Some "x");
  check "arg_string nil" (Sdk_util.arg_string Js.Json.null = None);
  check "arg_map nil" (Sdk_util.arg_map Js.Json.null = Wire.Map [])

(* ---- views_builder ---- *)

let barg dsl disp = { Views_builder.a_dsl = dsl; a_disp = disp }
let ci f args = Views_builder.CItem (f, args)

let test_views_builder () =
  let open Views_builder in
  (* to_dsl / simplify *)
  let task = CItem ("task", [ barg "\"TODO\"" "TODO" ]) in
  eqs "to_dsl op" "(and (task \"TODO\"))" (to_dsl (COp ("and", [ task ])));
  eqs "to_dsl page-ref" "[[b]]" (to_dsl (CItem ("page-ref", [ barg "[[b]]" "b" ])));
  eqs "to_dsl no args" "(f)" (to_dsl (CItem ("f", [])));
  eqs "to_dsl text" "\"hi\"" (to_dsl (CText "hi"));
  check "simplify single and" (simplify (COp ("and", [ task ])) = Some task);
  check "simplify empty" (simplify (COp ("and", [])) = None);
  check "simplify not kept"
    (simplify (COp ("not", [ task ])) = Some (COp ("not", [ task ])));
  check "simplify nested collapse"
    (simplify (COp ("and", [ COp ("or", [ task ]) ])) = Some task);
  eqs "tree_to_dsl collapse" "(task \"TODO\")" (tree_to_dsl (COp ("and", [ task ])));
  eqs "tree_to_dsl empty" "" (tree_to_dsl (COp ("and", [])));
  (* unwrap / strip_ref *)
  eqs "unwrap quoted" "x" (unwrap "\"x\"");
  eqs "unwrap bare" "x" (unwrap "x");
  eqs "unwrap single quote" "\"" (unwrap "\"");
  eqs "strip_ref" "x" (strip_ref "[[x]]");
  eqs "strip_ref short" "[[" (strip_ref "[[");
  eqs "strip_ref plain" "x" (strip_ref "x");
  (* arg_of_wire *)
  check "arg page-ref"
    (arg_of_wire (Wire.Array [ Wire.Array [ Wire.String "p" ] ])
     = barg "[[p]]" "p");
  check "arg string" (arg_of_wire (Wire.String "s") = barg "\"s\"" "s");
  check "arg keyword" (arg_of_wire (Wire.Keyword "k") = barg ":k" "k");
  check "arg int" (arg_of_wire (Wire.Int 3) = barg "3" "3");
  (* clause_of_wire *)
  (match clause_of_wire (Wire.List [ Wire.Symbol "and"; Wire.Symbol "x" ]) with
   | Some (COp ("and", _)) -> check "clause op" true
   | _ -> check "clause op" false);
  (match
     clause_of_wire
       (Wire.List [ Wire.Symbol "property"; Wire.Keyword "k" ])
   with
   | Some (CItem ("property", [ a ])) ->
       check "clause item arg" (a.a_dsl = ":k")
   | _ -> check "clause item arg" false);
  check "clause text" (clause_of_wire (Wire.String "q") = Some (CText "q"));
  (match
     clause_of_wire (Wire.Array [ Wire.Array [ Wire.String "p" ] ])
   with
   | Some (CItem ("page-ref", _)) -> check "clause page-ref" true
   | _ -> check "clause page-ref" false);
  check "clause non-form" (clause_of_wire (Wire.Int 1) = None);
  (* tree_of_src *)
  (match tree_of_src "(and (property :x))" with
   | COp ("and", [ CItem ("property", _) ]) -> check "tree_of_src op" true
   | _ -> check "tree_of_src op" false);
  (match tree_of_src "\"text\"" with
   | COp ("and", [ CText "text" ]) -> check "tree_of_src text wrap" true
   | _ -> check "tree_of_src text wrap" false);
  check "tree_of_src non-op" (tree_of_src "sym" = COp ("and", []));
  check "tree_of_src malformed" (tree_of_src "(broken" = COp ("and", []));
  (* loc-based tree surgery: loc [i] at a group indexes clause i-1;
     [0] targets the group node itself *)
  let ta, tb, tc = (ci "a" [], ci "b" [], ci "c" []) in
  let tor = COp ("or", [ tb; tc ]) in
  let t = COp ("and", [ ta; tor ]) in
  check "get_at root" (get_at t [] = Some t && get_at t [ 0 ] = Some t);
  check "get_at child" (get_at t [ 1 ] = Some ta && get_at t [ 2 ] = Some tor);
  check "get_at nested" (get_at t [ 2; 2 ] = Some tc);
  check "get_at oob" (get_at t [ 3 ] = None);
  check "get_at into leaf" (get_at t [ 1; 1 ] = None);
  check "append_at root"
    (append_at t [ 0 ] tc = COp ("and", [ ta; tor; tc ]));
  check "append_at nested"
    (append_at t [ 2; 0 ] ta = COp ("and", [ ta; COp ("or", [ tb; tc; ta ]) ]));
  check "append_at leaf no-op" (append_at t [ 1 ] tc = t);
  check "remove_at child" (remove_at t [ 1 ] = COp ("and", [ tor ]));
  check "remove_at nested"
    (remove_at t [ 2; 1 ] = COp ("and", [ ta; COp ("or", [ tc ]) ]));
  check "remove_at root resets" (remove_at t [] = COp ("and", []));
  check "remove_at oob" (remove_at t [ 9 ] = t);
  check "replace_at root" (replace_at t [ 0 ] tc = tc);
  check "replace_at child"
    (replace_at t [ 1; 0 ] tc = COp ("and", [ tc; tor ]));
  check "replace_at nested"
    (replace_at t [ 2; 2; 0 ] ta
     = COp ("and", [ ta; COp ("or", [ tb; ta ]) ]));
  (* a loc that stops at a clause index descends into it rather than
     replacing it, so [i] alone is a no-op *)
  check "replace_at leaf no-op" (replace_at t [ 1 ] tc = t);
  check "wrap_op"
    (wrap_op t [ 2; 0 ] "not"
     = COp ("and", [ ta; COp ("not", [ tor ]) ]));
  check "wrap_op oob" (wrap_op t [ 9 ] "not" = t);
  check "is_op" (is_op "and" && is_op "or" && is_op "not" && not (is_op "property"))

(* ---- views_wire ---- *)

let test_views_wire () =
  check "seq_items set"
    (Wire.elems (Wire.Set [ Wire.Int 1 ]) = [ Wire.Int 1 ]);
  check "seq_items other" (Wire.elems (Wire.Int 1) = []);
  check "as_float int" (Views_wire.as_float (Wire.Int 2) = Some 2.);
  check "as_float i64" (Views_wire.as_float (Wire.Int64 2L) = Some 2.);
  check "as_float none" (Views_wire.as_float (Wire.String "x") = None);
  check "ref_uuid map"
    (Views_wire.ref_uuid (wmap [ "block/uuid", Wire.Uuid "u" ]) = Some "u");
  check "ref_uuid bare" (Views_wire.ref_uuid (Wire.Uuid "u") = Some "u");
  check "ref_uuid int" (Views_wire.ref_uuid (Wire.Int 3) = None);
  check "ref_title"
    (Views_wire.ref_title (wmap [ "block/title", Wire.String "t" ])
     = Some "t");
  check "ref_id" (Views_wire.ref_id (wmap [ "db/id", Wire.Int 4 ]) = Some 4);
  let rk = Wire.Keyword "rq1" in
  let snap =
    wmap
      [ "slots"
      , Wire.Map
          [ ( Wire.Array [ Wire.Keyword "resource"; rk ]
            , wmap [ "value", Wire.Int 7 ] )
          ; ( Wire.Array [ Wire.Keyword "resource"; Wire.Keyword "other" ]
            , wmap [ "value", Wire.Int 9 ] ) ] ]
  in
  check "slot value" (Views_wire.snapshot_slot_value snap rk = Some (Wire.Int 7));
  check "slot miss"
    (Views_wire.snapshot_slot_value snap (Wire.Keyword "zzz") = None);
  check "slot no slots"
    (Views_wire.snapshot_slot_value (Wire.Map []) rk = None);
  check "ident kw" (Views_wire.ident_of_value (Wire.Keyword "k/v") = Some "k/v");
  check "ident map"
    (Views_wire.ident_of_value (wmap [ "db/ident", Wire.Keyword "k/v" ])
     = Some "k/v");
  check "ident none" (Views_wire.ident_of_value (Wire.Int 1) = None);
  check "str_list"
    (Views_wire.str_list
       (Wire.List [ Wire.String "a"; Wire.Keyword "b"; Wire.Int 1 ])
     = [ "a"; "b" ]);
  (* decode_view_ent *)
  let ent =
    wmap
      [ "block/uuid", Wire.Uuid "vu"
      ; "db/id", Wire.Int 5
      ; "block/title", Wire.String "V"
      ; ( "logseq.property.view/type"
        , wmap [ "db/ident", Wire.Keyword "logseq.property.view/type.list" ] )
      ; ( "logseq.property.table/hidden-columns"
        , Wire.List [ Wire.Keyword "block/title" ] )
      ; "logseq.property.view/group-by-property", Wire.Keyword "p/g"
      ; "logseq.property.view/sort-groups-desc?", Wire.Bool true ]
  in
  (match Views_wire.decode_view_ent ent with
   | Some v ->
       check "view ent fields"
         (v.Views_wire.vu = "vu" && v.vid = 5 && v.vtitle = "V"
         && v.vtype = "logseq.property.view/type.list"
         && v.vhidden = [ "block/title" ]
         && v.vgroup_by = Some "p/g"
         && v.vgroup_desc = Some true)
   | None -> check "view ent fields" false);
  (match
     Views_wire.decode_view_ent (wmap [ "block/uuid", Wire.Uuid "u" ])
   with
   | Some v ->
       check "view ent defaults"
         (v.Views_wire.vtype = "logseq.property.view/type.table"
         && v.vid = 0 && v.vgroup_desc = None)
   | None -> check "view ent defaults" false);
  check "view ent no uuid"
    (Views_wire.decode_view_ent (wmap [ "block/title", Wire.String "t" ])
     = None);
  (* decode_view_data *)
  (match
     Views_wire.decode_view_data
       (wmap
          [ "rows", Wire.List [ Wire.Uuid "a"; Wire.Uuid "b" ]
          ; "count", Wire.Int 2
          ; ( "row-previews"
            , Wire.Map
                [ (Wire.Uuid "a", wmap [ "block/title", Wire.String "ta" ]) ]
            )
          ; "properties"
          , Wire.List
              [ Wire.Keyword "p/x"; wmap [ "db/ident", Wire.Keyword "p/y" ] ]
          ])
   with
   | Views_wire.VFlat f ->
       check "view data flat"
         (f.rows = [ "a"; "b" ] && f.count = 2
         && f.qprops = [ "p/x"; "p/y" ]
         && Hashtbl.find_opt f.previews "a" <> None)
   | _ -> check "view data flat" false);
  (match
     Views_wire.decode_view_data
       (wmap
          [ "partition", Wire.Keyword "grouped"
          ; ( "groups"
            , Wire.List
                [ wmap
                    [ "value", wmap [ "block/title", Wire.String "g1" ]
                    ; "rows", Wire.List [ Wire.Uuid "r1" ] ] ] ) ])
   with
   | Views_wire.VGrouped [ g ] ->
       check "view data grouped"
         (g.Views_wire.grows = [ "r1" ]
         && Wire.map_get_string g.gv "block/title" = Some "g1")
   | _ -> check "view data grouped" false);
  (match
     Views_wire.decode_view_data
       (wmap
          [ "partition", Wire.Keyword "grouped-list"
          ; ( "groups"
            , Wire.List
                [ wmap
                    [ "value", Wire.Int 1
                    ; ( "partitions"
                      , Wire.List
                          [ wmap
                              [ "breadcrumb-uuid", Wire.Uuid "b1"
                              ; "rows", Wire.List [ Wire.Uuid "r1" ] ] ] )
                    ] ] ) ])
   with
   | Views_wire.VGroupedList [ g ] ->
       check "view data grouped-list"
         (g.Views_wire.glparts = [ ("b1", [ "r1" ]) ])
   | _ -> check "view data grouped-list" false);
  check "view data empty"
    (Views_wire.decode_view_data (Wire.Int 1) = Views_wire.VEmpty);
  (* prop_text *)
  eqs "prop_text str" "s" (Views_wire.prop_text (Wire.String "s"));
  eqs "prop_text int" "5" (Views_wire.prop_text (Wire.Int 5));
  eqs "prop_text bool" "true" (Views_wire.prop_text (Wire.Bool true));
  eqs "prop_text uuid" "u" (Views_wire.prop_text (Wire.Uuid "u"));
  eqs "prop_text kw" "k/v" (Views_wire.prop_text (Wire.Keyword "k/v"));
  eqs "prop_text map title" "T"
    (Views_wire.prop_text (wmap [ "block/title", Wire.String "T" ]));
  eqs "prop_text array" "a, 1"
    (Views_wire.prop_text (Wire.Array [ Wire.String "a"; Wire.Int 1 ]));
  eqs "prop_text nil" "" (Views_wire.prop_text Wire.Nil)

(* ---- views_db ---- *)

let test_views_db () =
  check "utf16 ascii" (Views_db.utf16_units "ab" = [ 0x61; 0x62 ]);
  check "utf16 2-byte" (Views_db.utf16_units "\xc3\xa9" = [ 0xE9 ]);
  check "utf16 surrogate pair"
    (Views_db.utf16_units "\xf0\x9f\x98\x80" = [ 0xD83D; 0xDE00 ]);
  check "utf16 mixed"
    (Views_db.utf16_units "a\xc3\xa9b" = [ 0x61; 0xE9; 0x62 ]);
  eqi "hash empty" 0 (Views_db.hash_string "");
  eqi "hash known answer" 1968171120 (Views_db.hash_string "abc");
  check "hash deterministic"
    (Views_db.hash_string "abc" = Views_db.hash_string "abc");
  check "hash differs"
    (Views_db.hash_string "abc" <> Views_db.hash_string "abd");
  eqs "clamp_sub" "bc" (Views_db.clamp_sub "abc" 1);
  eqs "clamp_sub past end" "" (Views_db.clamp_sub "abc" 9);
  eqs "clamp_sub_n" "b" (Views_db.clamp_sub_n "abc" 1 2);
  eqs "clamp_sub_n clamp" "bc" (Views_db.clamp_sub_n "abc" 1 99);
  eqs "clamp_sub_n empty" "" (Views_db.clamp_sub_n "abc" 2 2);
  eqs "fill0 pad" "0042" (Views_db.fill0 "42" 4);
  eqs "fill0 long" "12345" (Views_db.fill0 "12345" 4);
  (* gen_view_uuid: deterministic uuid shape from owner+feature *)
  let u = Views_db.gen_view_uuid ~owner:"owneruuid" ~feature_type:"all-pages" in
  eqs "gen_view_uuid known answer" "00000006-8545-0681-0008-000000000000" u;
  check "gen_view_uuid deterministic"
    (u = Views_db.gen_view_uuid ~owner:"owneruuid" ~feature_type:"all-pages");
  check "gen_view_uuid differs by owner"
    (u <> Views_db.gen_view_uuid ~owner:"other" ~feature_type:"all-pages");
  check "gen_view_uuid differs by feature"
    (u <> Views_db.gen_view_uuid ~owner:"owneruuid" ~feature_type:"x")

(* ---- views_state codecs + query ---- *)

let test_sched = Signal.scheduler ()

let mk_view_inst feature =
  Views_state.make ~sched:test_sched
    ~kind:(Views_state.KQuery { block_uuid = "b1" })
    ~feature ~owner:Wire.Nil

(* Signal.set stages until stabilize — publish before reading V.get *)
let vget inst =
  Signal.stabilize test_sched;
  Views_state.get inst

let test_views_state () =
  let s =
    [ { Views_state.s_id = "block/title"; s_asc = true }
    ; { s_id = "p/x"; s_asc = false } ]
  in
  check "sorting roundtrip"
    (Views_state.sorting_of_wire (Views_state.sorting_to_wire s) = s);
  check "sorting default asc"
    (Views_state.sorting_of_wire
       (Wire.Array [ wmap [ "id", Wire.Keyword "a/b" ] ])
     = [ { Views_state.s_id = "a/b"; s_asc = true } ]);
  check "sorting non-array" (Views_state.sorting_of_wire (Wire.Int 1) = []);
  check "sorting bad rows dropped"
    (Views_state.sorting_of_wire
       (Wire.Array [ Wire.Int 1; wmap [ "id", Wire.Keyword "a/b" ] ])
     = [ { Views_state.s_id = "a/b"; s_asc = true } ]);
  let f =
    [ { Views_state.c_prop = "p/a"; c_op = "is"
      ; c_val = Some (Wire.String "v") }
    ; { c_prop = "p/b"; c_op = "empty"; c_val = None } ]
  in
  (match
     Views_state.filters_of_wire (Views_state.filters_to_wire f true)
   with
   | clauses, or_ -> check "filters roundtrip" (clauses = f && or_));
  (match
     Views_state.filters_of_wire
       (wmap
          [ "or?", Wire.Bool true
          ; ( "filters"
            , Wire.Array
                [ Wire.Array [ Wire.Keyword "p"; Wire.Keyword "o"; Wire.Nil ]
                ; Wire.Array [ Wire.Keyword "p"; Wire.Keyword "o" ]
                ; Wire.Int 7 ] ) ])
   with
   | [ c1; c2 ], true ->
       check "filters nil + bare op"
         (c1.Views_state.c_val = None && c2.c_val = None)
   | _ -> check "filters nil + bare op" false);
  check "filters non-map" (Views_state.filters_of_wire (Wire.Int 1) = ([], false));
  check "filters no filters key keeps or"
    (Views_state.filters_of_wire (wmap [ "or?", Wire.Bool true ])
     = ([], true));
  (* ctx_of: query-result emits row uuids; filters land when set *)
  let inst = mk_view_inst "query-result" in
  Views_state.set inst
    { (vget inst) with
      Views_state.sorting = [ { Views_state.s_id = "p/a"; s_asc = false } ]
    ; input = "q"
    ; query_rows = [ "r1" ]
    ; filters = f
    ; filters_or = true
    };
  let vs = vget inst in
  let ctx = Views_state.ctx_of inst in
  check "ctx feature"
    (Wire.get ctx "feature-type" = Some (Wire.Keyword "query-result"));
  check "ctx sorting"
    (Wire.get ctx "sorting" = Some (Views_state.sorting_to_wire vs.sorting));
  check "ctx input" (Wire.get ctx "input" = Some (Wire.String "q"));
  check "ctx filters"
    (Wire.get ctx "filters"
     = Some (Views_state.filters_to_wire vs.filters vs.filters_or));
  check "ctx query rows"
    (Wire.get ctx "query-row-uuids"
     = Some (Wire.Array [ Wire.Uuid "r1" ]));
  check "ctx no initial-row-count for query-result"
    (Wire.get ctx "initial-row-count" = None);
  check "ctx group-by"
    (let inst2 = mk_view_inst "x" in
     Views_state.update inst2 (fun s ->
         { s with Views_state.group_by = Some "p/g" });
     Signal.stabilize test_sched;
     Wire.get (Views_state.ctx_of inst2) "group-by-property-ident"
     = Some (Wire.Keyword "p/g"))

let test_views_query () =
  check "parse blank" (Views_query.parse_src "" = Views_query.QBlank);
  check "parse (and)" (Views_query.parse_src "(and)" = Views_query.QBlank);
  (match Views_query.parse_src "(and (task \"TODO\"))" with
   | Views_query.QDsl s ->
       check "parse dsl" (s = "(and (task \"TODO\"))")
   | _ -> check "parse dsl" false);
  (match
     Views_query.parse_src "{:query [:find ?e :where [?e :block/title ?t]]}"
   with
   | Views_query.QDatalog _ -> check "parse datalog" true
   | _ -> check "parse datalog" false);
  (match Views_query.parse_src "   " with
   | Views_query.QBlank -> check "parse ws blank" true
   | _ -> check "parse ws blank" false);
  (* malformed '{...' propagates the Edn parse error — pin the contract *)
  check "parse malformed raises"
    (try
       (match Views_query.parse_src "{" with _ -> false)
     with _ -> true);
  (* spec_of *)
  let inst = mk_view_inst "query-result" in
  (match
     Views_query.spec_of (Wire.Map []) "b1" (Views_query.QDsl "(task)")
   with
   | Ok spec ->
       check "spec dsl kind"
         (Wire.get spec "kind" = Some (Wire.Keyword "dsl"));
       check "spec dsl query"
         (Wire.get spec "query" = Some (Wire.String "(task)"));
       check "spec block uuid"
         (Wire.get spec "current-block-uuid" = Some (Wire.Uuid "b1"));
       check "spec removes children"
         (Wire.get spec "remove-block-children?" = Some (Wire.Bool true))
   | Error _ -> check "spec dsl" false);
  check "spec blank error"
    (Result.is_error
       (Views_query.spec_of (Wire.Map []) "b1" Views_query.QBlank));
  (match
     Views_query.spec_of (Wire.Map []) "b1"
       (Views_query.QDatalog
          (Edn.parse
             "{:query [:find ?e :where [?e :block/title ?t]] :inputs [:today]}"))
   with
   | Ok spec ->
       check "spec datalog kind"
         (Wire.get spec "kind" = Some (Wire.Keyword "datalog"));
       check "spec datalog inputs" (Wire.get spec "inputs" <> None)
   | Error _ -> check "spec datalog" false);
  check "spec datalog missing query"
    (Result.is_error
       (Views_query.spec_of (Wire.Map []) "b1"
          (Views_query.QDatalog (wmap [ "x", Wire.Int 1 ]))));
  (* current page title lands in the spec *)
  let saved_model = !model_stub and saved_cp = !Runtime.current_page in
  set_page (Some (page []));
  (* views still read the derived mirror — set both for this check *)
  Runtime.current_page := Some (page []);
  (match
     Views_query.spec_of (Wire.Map []) "b1" (Views_query.QDsl "x")
   with
   | Ok spec ->
       check "spec page title"
         (Wire.get spec "current-page-title" = Some (Wire.String "p"))
   | Error _ -> check "spec page title" false);
  model_stub := saved_model;
  Runtime.current_page := saved_cp;
  (* decode_result *)
  Views_query.decode_result inst
    (wmap [ "error", wmap [ "message", Wire.String "boom" ] ]);
  let vs1 = vget inst in
  check "decode error"
    (vs1.Views_state.query_error = Some "boom"
    && vs1.query_rows = [] && vs1.query_scalar_rows = []);
  Views_query.decode_result inst
    (wmap [ "rows", Wire.Array [ Wire.Uuid "u1"; Wire.Uuid "u2" ] ]);
  let vs2 = vget inst in
  check "decode rows"
    (vs2.query_error = None && vs2.query_rows = [ "u1"; "u2" ]
    && vs2.query_scalar_rows = []);
  Views_query.decode_result inst (Wire.Array [ Wire.Int 1; Wire.Int 2 ]);
  let vs3 = vget inst in
  check "decode scalar rows"
    (vs3.query_rows = []
    && vs3.query_scalar_rows = [ Wire.Int 1; Wire.Int 2 ]);
  (* mixed uuid+scalar goes to scalar rows *)
  Views_query.decode_result inst (Wire.Array [ Wire.Uuid "u1"; Wire.Int 2 ]);
  check "decode mixed -> scalars"
    ((vget inst).Views_state.query_scalar_rows <> []);
  (* query_value_block *)
  let parent =
    wmap
      [ "logseq.property/query", wmap [ "block/uuid", Wire.Uuid "qb" ]
      ; ( "block/children"
        , Wire.Array
            [ wmap [ "block/uuid", Wire.Uuid "qb" ]
            ; wmap [ "block/uuid", Wire.Uuid "other" ] ] ) ]
  in
  check "query value block"
    (match Views_query.query_value_block parent with
     | Some b -> Wire.map_get_uuid b "block/uuid" = Some "qb"
     | None -> false);
  check "query value missing"
    (Views_query.query_value_block
       (wmap [ "logseq.property/query", wmap [ "block/uuid", Wire.Uuid "qb" ] ])
     = None);
  check "query value bare uuid"
    (Views_query.query_value_block
       (wmap
          [ "logseq.property/query", Wire.Uuid "qb"
          ; "block/children"
          , Wire.Array [ wmap [ "block/uuid", Wire.Uuid "qb" ] ] ])
     <> None)

(* ---- views_table ---- *)

let test_views_table () =
  check "page row"
    (Views_table.is_page_row (wmap [ "block/name", Wire.String "n" ]));
  check "non-page row"
    (not (Views_table.is_page_row (wmap [ "block/title", Wire.String "t" ])));
  let prop =
    wmap
      [ "db/ident", Wire.Keyword "user/rating"
      ; "block/title", Wire.String "Rating"
      ; "logseq.property/type", wmap [ "db/ident", Wire.Keyword "logseq.property.type/number" ]
      ; "db/cardinality", Wire.Keyword "db.cardinality/many" ]
  in
  (match Views_table.column_of_property prop with
   | Some c ->
       check "column_of_property"
         (c.Views_state.c_id = "user/rating" && c.c_name = "Rating"
         && c.c_type = "logseq.property.type/number" && c.c_many)
   | None -> check "column_of_property" false);
  check "column skip hide?"
    (Views_table.column_of_property
       (wmap [ "db/ident", Wire.Keyword "logseq.property/hide?" ])
     = None);
  check "column skip map type"
    (Views_table.column_of_property
       (wmap
          [ "db/ident", Wire.Keyword "p/m"
          ; "logseq.property/type", Wire.Keyword "map" ])
     = None);
  (* a qualified type ident does not match the bare "map"/"entity"
     skip names, so the column is kept *)
  check "column qualified type kept"
    (Views_table.column_of_property
       (wmap
          [ "db/ident", Wire.Keyword "p/m"
          ; "logseq.property/type"
          , Wire.Keyword "logseq.property.type/map" ])
     <> None);
  check "column no ident"
    (Views_table.column_of_property (wmap [ "block/title", Wire.String "t" ])
     = None);
  check "column type default"
    ((Option.get (Views_table.column_of_property (wmap [ "db/ident", Wire.Keyword "p/x" ]))).Views_state.c_type
     = "default");
  (* cell_value: direct attr then block/properties fallback *)
  let blk =
    wmap
      [ "block/title", Wire.String "T"
      ; "block/properties", wmap [ "p/x", Wire.Int 9 ] ]
  in
  let col_title = { Views_state.c_id = "block/title"; c_name = ""; c_type = "default"; c_prop = None; c_disable_hide = false; c_many = false } in
  let col_px = { col_title with Views_state.c_id = "p/x" } in
  let col_miss = { col_title with Views_state.c_id = "p/y" } in
  check "cell direct" (Views_table.cell_value blk col_title = Wire.String "T");
  check "cell props fallback" (Views_table.cell_value blk col_px = Wire.Int 9);
  check "cell miss" (Views_table.cell_value blk col_miss = Wire.Nil);
  (* fmt_cell_value: datetime columns format ints, others use prop_text *)
  let col_dt = { col_title with Views_state.c_type = "datetime" } in
  check "fmt datetime"
    (let s = Views_table.fmt_cell_value col_dt (Wire.Int64 1700000000000L) in
     String.length s = 16 && String.get s 4 = '-' && String.get s 10 = ' ');
  eqs "fmt non-datetime int" "7"
    (Views_table.fmt_cell_value col_title (Wire.Int 7));
  (* prop_text has no Int64 case, so a non-datetime Int64 renders
     empty *)
  eqs "fmt non-datetime int64" ""
    (Views_table.fmt_cell_value col_title (Wire.Int64 7L));
  eqs "fmt string" "v"
    (Views_table.fmt_cell_value col_title (Wire.String "v"));
  check "sortable"
    (Views_table.sortable col_title
    && not (Views_table.sortable { col_title with c_id = "select" })
    && not
         (Views_table.sortable
            { col_title with c_id = "block.temp/refs-count" }))

(* ---- popups_state ---- *)

let ac_it ?group label =
  Popups_state.mk_item ~key:label ~label ?group Popups_state.Noop

let mk_ac kind =
  { Popups_state.kind; x = 0.; y = 0.; cy = 0.; flip = None; flipx = None
    ; query = ""
  ; tpos = 0; tlen = 0
  ; items = []; chosen = 0; auuid = "" }

let test_popups_state () =
  (* fuzzy_score: subsequence match, first*1000 + span *)
  check "fuzzy h1" (Fuzzy.score "h1" "Heading 1" > 0.);
  check "fuzzy te 1" (Fuzzy.score "te 1" "template 1" > 0.);
  check "fuzzy no subseq" (Fuzzy.score "acb" "abc" = 0.);
  check "fuzzy empty needle" (Fuzzy.score "" "abc" > 0.);
  check "fuzzy too long" (Fuzzy.score "abc" "ab" = 0.);
  check "fuzzy case" (Fuzzy.score "abc" "ABC" > 0.);
  check "contains_ci" (I18n.contains_ci "Hello World" "world");
  check "contains_ci miss" (not (I18n.contains_ci "abc" "z"));
  check "contains_ci empty" (I18n.contains_ci "abc" "");
  (* with_headers: banner only on group transitions, only when shown *)
  let items =
    [ ac_it ~group:"g1" "Alpha"; ac_it ~group:"g1" "Beta"
    ; ac_it ~group:"g2" "Gamma"; ac_it "Solo" ]
  in
  let hs = Popups_state.with_headers true items in
  check "headers on transitions"
    (match hs with
     | [ a; b; c; d ] ->
         a.Popups_state.ai_hdr = Some "g1" && b.ai_hdr = None
         && c.ai_hdr = Some "g2" && d.ai_hdr = None
         && a.ai_idx = 0 && d.ai_idx = 3
     | _ -> false);
  check "headers off"
    (List.for_all
       (fun (i : Popups_state.ac_item) -> i.ai_hdr = None)
       (Popups_state.with_headers false items));
  (* filter_slash: fuzzy on label, headers only for empty query *)
  let f0 = Popups_state.filter_slash "" items in
  check "filter_slash empty keeps all" (List.length f0 = 4);
  let f1 = Popups_state.filter_slash "alp" items in
  check "filter_slash fuzzy" (List.length f1 = 1);
  check "filter_slash hides headers"
    ((List.hd f1).Popups_state.ai_hdr = None);
  (match Popups_state.filter_slash "zzzzz" items with
   | [ f ] -> check "filter_slash fallback" (f.Popups_state.ai_key = "no-matched")
   | _ -> check "filter_slash fallback" false);
  (* query_closed per kind *)
  let closed kind q = Popups_state.query_closed (mk_ac kind) q in
  check "qc page_ref"
    (closed Popups_state.Page_ref "a]" && not (closed Popups_state.Page_ref "ab"));
  check "qc page_embed" (closed Popups_state.Page_embed "]");
  check "qc block_ref"
    (closed Popups_state.Block_ref ")" && not (closed Popups_state.Block_ref "x"));
  check "qc slash"
    (closed Popups_state.Slash "\n" && not (closed Popups_state.Slash "x"));
  check "qc tag" (closed Popups_state.Tag_search "\n");
  check "qc embed_ref" (closed Popups_state.Embed_ref "\n");
  (* nlp date helpers *)
  eqs "nlp key" "date.nlp/next-week"
    (Popups_state.nlp_i18n_key "Next week");
  check "nlp names"
    (List.length Popups_state.nlp_en_names = 10
    && List.mem "Tomorrow" Popups_state.nlp_en_names);
  let now = Dates.date_now () in
  let ms_diff en =
    Js.Date.getTime (Popups_state.nlp_date_of en)
    -. Js.Date.getTime now
  in
  check "nlp tomorrow" (ms_diff "Tomorrow" > 86000000. && ms_diff "Tomorrow" < 87000000.);
  check "nlp yesterday" (ms_diff "Yesterday" < -86000000.);
  check "nlp next week" (ms_diff "Next week" > 604700000.);
  check "nlp today" (abs_float (ms_diff "Today") < 5000.);
  check "nlp unknown" (abs_float (ms_diff "Bogus") < 5000.);
  check "nlp next month"
    (Js.Date.getMonth (Popups_state.nlp_date_of "Next month")
     = mod_float (Js.Date.getMonth now +. 1.) 12.);
  check "nlp next year"
    (Js.Date.getFullYear (Popups_state.nlp_date_of "Next year")
     = Js.Date.getFullYear now +. 1.);
  (* kind mappings *)
  eqs "ac class slash" "cp__commands-slash"
    (Popups_state.ac_class_of_kind Popups_state.Slash);
  eqs "ac class block_ref" "ac-block-search"
    (Popups_state.ac_class_of_kind Popups_state.Block_ref);
  eqi "trigger len slash" 1 (Popups_state.trigger_len_of_kind Popups_state.Slash);
  eqi "trigger len page_ref" 2
    (Popups_state.trigger_len_of_kind Popups_state.Page_ref);
  eqi "trigger len embed_ref" 0
    (Popups_state.trigger_len_of_kind Popups_state.Embed_ref);
  eqs "trigger text page" "[["
    (Popups_state.trigger_text_of_kind Popups_state.Page_ref);
  eqs "trigger text block" "(("
    (Popups_state.trigger_text_of_kind Popups_state.Block_ref);
  eqs "popup ref slash" "commands"
    (Popups_state.popup_ref_of_kind Popups_state.Slash);
  (* slash_items: clear-heading gated on has_heading *)
  check "slash has clear-heading"
    (List.exists
       (fun (i : Popups_state.ac_item) -> i.ai_key = "editor.slash/clear-heading")
       (Popups_state.slash_items ~has_heading:true));
  check "slash no clear-heading"
    (not
       (List.exists
          (fun (i : Popups_state.ac_item) ->
            i.ai_key = "editor.slash/clear-heading")
          (Popups_state.slash_items ~has_heading:false)));
  check "slash has heading levels"
    (List.exists
       (fun (i : Popups_state.ac_item) -> i.ai_key = "heading-3")
       (Popups_state.slash_items ~has_heading:false));
  (* block_item_of_row / class_titles_of *)
  let bi =
    Popups_state.block_item_of_row 0
      (wmap [ "block/uuid", Wire.Uuid "bu"; "block/title", Wire.String "BT" ])
  in
  check "block_item"
    (bi.Popups_state.ai_label = "BT"
    && bi.ai_act = Popups_state.Emit ("[[bu]]", 0)
    && bi.ai_node && bi.ai_node_icon = Some ("point-filled", true)
    && bi.ai_breadcrumb = Some "");
  check "class_titles"
    (Popups_state.class_titles_of
       [ wmap
           [ "block/title", Wire.String "Cls"
           ; "logseq.property/icon", wmap [ "id", Wire.String "ico" ]
           ; "block/alias", Wire.List [ wmap [ "block/title", Wire.String "Al" ] ] ] ]
     = [ ("Cls", Some "ico"); ("Al", None) ]);
  check "class_titles no title"
    (Popups_state.class_titles_of [ wmap [ "x", Wire.Int 1 ] ] = []);
  (* detail_obj *)
  let d = Popups_state.detail_obj [ "a", Js.Json.string "v" ] in
  check "detail_obj" (json_str d "a" = Some "v")

(* ---- editor_actions pure helpers ---- *)

let test_editor_actions () =
  let b = block ~children:[ block "c1" "C1"; block "c2" "C2" ] "b" "B" in
  (match Editor_actions.move_children_ops b "tgt" with
   | [ op ] -> (
       match op_name_args op with
       | Some ("move-blocks", [ Wire.List uuids; Wire.Uuid "tgt"; Wire.Map _ ]) ->
           check "move_children uuids"
             (List.filter_map Wire.as_uuid uuids = [ "c1"; "c2" ])
       | _ -> check "move_children op" false)
   | _ -> check "move_children op" false);
  check "move_children empty"
    (Editor_actions.move_children_ops (block "x" "X") "t" = []);
  (match Editor_actions.move_children_except_ops b "c1" "tgt" with
   | [ op ] -> (
       match op_name_args op with
       | Some ("move-blocks", [ Wire.List uuids; _; _ ]) ->
           check "move_children_except"
             (List.filter_map Wire.as_uuid uuids = [ "c2" ])
       | _ -> check "move_children_except" false)
   | _ -> check "move_children_except" false);
  check "move_children_except all skipped"
    (Editor_actions.move_children_except_ops
       (block ~children:[ block "c1" "C" ] "b" "B") "c1" "t"
     = []);
  check "is_parent_of"
    (Editor_actions.is_parent_of b "c2"
    && not (Editor_actions.is_parent_of b "b"));
  eqi "index_of" 1 (Editor_actions.index_of [ "a"; "b" ] "b");
  eqi "index_of miss" (-1) (Editor_actions.index_of [ "a" ] "z");
  eqs "file_ext" "png" (Editor_actions.file_ext "a/b.PNG");
  eqs "file_ext none" "" (Editor_actions.file_ext "noext");
  eqs "file_ext trailing" "" (Editor_actions.file_ext "x.");
  eqs "file_title" "a/b" (Editor_actions.file_title "a/b.png");
  eqs "file_title dotfile" ".x" (Editor_actions.file_title ".x");
  eqs "file_title none" "noext" (Editor_actions.file_title "noext");
  (match
     Editor_actions.asset_block_map ~uuid:"u" ~title:"t" ~ext:"png" ~size:5
       ~checksum:"cs"
   with
   | Wire.Map _ as m ->
       check "asset map"
         (Wire.map_get_uuid m "block/uuid" = Some "u"
         && Wire.map_get_string m "block/title" = Some "t"
         && Wire.map_get_string m "logseq.property.asset/type" = Some "png"
         && Wire.map_get_int m "logseq.property.asset/size" = Some 5
         && Wire.map_get_string m "logseq.property.asset/checksum" = Some "cs"
         && Wire.get m "block/tags"
            = Some (Wire.Set [ Wire.Keyword "logseq.class/Asset" ]))
   | _ -> check "asset map" false);
  (* Ops.last_inserted_uuid *)
  check "last_inserted"
    (Outliner_ops.last_inserted_uuid
       (Some
          (wmap
             [ "result"
             , wmap
                 [ "blocks"
                 , Wire.Array
                     [ wmap [ "block/uuid", Wire.Uuid "u1" ]
                     ; wmap [ "block/uuid", Wire.Uuid "u2" ] ] ] ]))
     = Some "u2");
  check "last_inserted none" (Outliner_ops.last_inserted_uuid None = None);
  check "last_inserted empty"
    (Outliner_ops.last_inserted_uuid
       (Some (wmap [ "result", wmap [ "blocks", Wire.Array [] ] ]))
     = None);
  (* model route_page-backed pure fns *)
  let saved_model = !model_stub in
  set_page
    (Some
      (page
         [ block ~children:[ block "ca" "CA" ] "a" "A"
         ; block ~children:[ block "gc" "GC" ] "p1" "P1"
         ; block ~children:[ block "gc2" "GC2" ] "p2" "P2"
         ; { (block "top" "T") with
             Model.block_order_list = Some "1." } ]));
  check "is_descendant"
    (Editor_actions.is_descendant "gc" "p1"
    && not (Editor_actions.is_descendant "gc" "p2")
    && not (Editor_actions.is_descendant "p1" "gc"));
  check "same_parent"
    (Editor_actions.same_parent "gc" "gc" = true
    && Editor_actions.same_parent "gc" "gc2" = false
    && Editor_actions.same_parent "gc" "top" = false
    && Editor_actions.same_parent "a" "top" = true);
  check "boundary_merge allowed same top-level"
    (Editor_actions.boundary_merge_allowed
       (block ~children:[ block "x" "X" ] "a" "A") "top");
  check "boundary_merge blocked cross-parent"
    (not
       (Editor_actions.boundary_merge_allowed
          (block ~children:[ block "x" "X" ] "a" "A") "gc"));
  check "boundary_merge childless always ok"
    (Editor_actions.boundary_merge_allowed (block "a" "A") "gc");
  let sel = Editor_state.String_set.of_list [ "p1"; "gc"; "top" ] in
  check "has_selected_ancestor"
    (Editor_actions.has_selected_ancestor sel "gc"
    && not (Editor_actions.has_selected_ancestor sel "gc2")
    && not (Editor_actions.has_selected_ancestor sel "top"));
  check "range_between"
    (Editor_actions.range_between "gc" "top" = [ "gc"; "p2"; "gc2"; "top" ]);
  check "range_between reversed"
    (Editor_actions.range_between "top" "gc" = [ "gc"; "p2"; "gc2"; "top" ]);
  check "flat_uuids"
    (Editor_actions.flat_uuids () = [ "a"; "ca"; "p1"; "gc"; "p2"; "gc2"; "top" ]);
  check "drop_own_order_list ok"
    (Editor_actions.drop_own_order_list "top" "  " false);
  check "drop_own_order_list parent ordered"
    (not (Editor_actions.drop_own_order_list "top" "  " true));
  check "drop_own_order_list nonempty"
    (not (Editor_actions.drop_own_order_list "top" "text" false));
  check "drop_own_order_list no prop"
    (not (Editor_actions.drop_own_order_list "p1" "  " false));
  check "library_context false" (not (Editor_actions.library_context ()));
  set_page
    (Some { (page []) with Model.page_is_library = true });
  check "library_context true" (Editor_actions.library_context ());
  model_stub := saved_model

(* ---- update: remaining arms ---- *)

let test_update2 () =
  let m0 = Model.initial in
  let m1 = Update.update m0 Action.Toggle_right_sidebar in
  check "right sidebar toggle"
    (m1.Model.right_sidebar_open = not m0.Model.right_sidebar_open);
  let rtc =
    { Model.rtc_lock = true; rtc_ws_state = "on"
    ; rtc_local_tx = Some 3; rtc_remote_tx = Some 4
    ; rtc_pending_local = 1; rtc_pending_asset = 2; rtc_pending_server = 3
    ; rtc_online_users = []; rtc_missing_files = [] }
  in
  let m2 = Update.update m1 (Action.Rtc_state rtc) in
  check "rtc_state sets" (m2.Model.rtc = Some rtc);
  let m3 = Update.update m2 Action.Rtc_state_clear in
  check "rtc cleared" (m3.Model.rtc = None);
  (* Boot_graph_ready clears stale rtc of the previous graph conn *)
  let m4 = Update.update m2 (Action.Boot_graph_ready "logseq_db_y") in
  check "boot clears rtc"
    (m4.Model.rtc = None && m4.phase = Model.Ready
    && m4.repo = Some "logseq_db_y")

(* ---- decode: rtc_of_wire ---- *)

let test_decode_rtc () =
  let w =
    wmap
      [ "rtc-state", wmap [ "ws-state", Wire.Keyword "open" ]
      ; "rtc-lock", Wire.Bool true
      ; "local-tx", Wire.Int 7
      ; "remote-tx", Wire.Int64 8L
      ; "unpushed-block-update-count", Wire.Int 1
      ; "pending-asset-ops-count", Wire.Int 2
      ; "pending-server-ops-count", Wire.Int 3 ]
  in
  let r = Decode.rtc_of_wire w in
  check "rtc decode"
    (r.Model.rtc_ws_state = "open" && r.rtc_lock = true
    && r.rtc_local_tx = Some 7 && r.rtc_remote_tx = Some 8
    && r.rtc_pending_local = 1 && r.rtc_pending_asset = 2
    && r.rtc_pending_server = 3);
  let r2 = Decode.rtc_of_wire (Wire.Map []) in
  check "rtc decode defaults"
    (r2.Model.rtc_ws_state = "" && r2.rtc_lock = false
    && r2.rtc_local_tx = None && r2.rtc_pending_local = 0)

(* ---- properties_data ---- *)

let test_properties_data () =
  check "untag" (Properties_data.untag (Wire.Tagged ("t", Wire.Int 3)) = Wire.Int 3);
  check "untag plain" (Properties_data.untag (Wire.Int 3) = Wire.Int 3);
  check "entity_id" (Properties_data.entity_id_of (wmap [ "db/id", Wire.Int 9 ]) = Some 9);
  check "entity_uuid tagged"
    (Properties_data.entity_uuid_of
       (Wire.Tagged ("x", wmap [ "block/uuid", Wire.Uuid "u" ]))
     = Some "u");
  check "entity_title"
    (Properties_data.entity_title_of (wmap [ "block/title", Wire.String "t" ]) = Some "t");
  check "ident_entry_id"
    (Properties_data.ident_entry_id (wmap [ "db/id", Wire.Int 2 ]) = Some 2);
  check "ident_entry_ident"
    (Properties_data.ident_entry_ident (wmap [ "db/ident", Wire.Keyword "p/x" ]) = Some "p/x");
  check "ident_entry non-map" (Properties_data.ident_entry_id (Wire.Int 1) = None);
  check "tag_idents"
    (Properties_data.tag_idents
       (wmap
          [ "block/tags"
          , Wire.Set [ wmap [ "db/ident", Wire.Keyword "a/b" ]; Wire.Int 1 ] ])
     = [ "a/b" ]);
  let prop =
    wmap
      [ "block/title", Wire.String "Prop"
      ; "logseq.property/type", Wire.Keyword "number"
      ; "db/cardinality", Wire.Keyword "db.cardinality/many"
      ; "logseq.property/hide?", Wire.Bool true
      ; "logseq.property/hide-empty-value", Wire.Bool true
      ; "property/closed-values", Wire.List [ Wire.Int 1 ]
      ; ( "logseq.property/ui-position"
        , wmap [ "db/ident", Wire.Keyword "logseq.property.ui-position/block-left" ] )
      ; "logseq.property/default-value", Wire.Int 99 ]
  in
  let row =
    Wire.Map
      [ (Wire.String "property-id", Wire.Keyword "p/prop")
      ; (Wire.String "property", prop)
      ; (Wire.String "value", Wire.Nil) ]
  in
  check "row_ident" (Properties_data.row_ident row = Some "p/prop");
  check "row_title" (Properties_data.row_title row = "Prop");
  eqs "row_type" "number" (Properties_data.row_type row);
  eqs "row_type default" "default"
    (Properties_data.row_type (Wire.Map [ (Wire.String "property", Wire.Map []) ]));
  check "row_many" (Properties_data.row_many row);
  check "row_many single"
    (not
       (Properties_data.row_many
          (Wire.Map
             [ ( Wire.String "property"
               , wmap [ "db/cardinality", Wire.Keyword "db.cardinality/one" ] ) ])));
  check "row_closed" (Properties_data.row_closed_values row = [ Wire.Int 1 ]);
  check "row_hidden" (Properties_data.row_hidden row);
  check "row_hide_empty" (Properties_data.row_hide_empty row);
  check "row_position"
    (Properties_data.row_position row = "logseq.property.ui-position/block-left");
  check "row_position default"
    (Properties_data.row_position (Wire.Map [])
     = "logseq.property.ui-position/properties");
  check "row_effective default"
    (Properties_data.row_effective_value row = Wire.Int 99);
  let rowv =
    Wire.Map
      [ (Wire.String "property", prop)
      ; (Wire.String "value", Wire.Int 5) ]
  in
  check "row_effective own" (Properties_data.row_effective_value rowv = Wire.Int 5);
  (match Properties_data.row_with_effective_value row with
   | Wire.Map _ as r' ->
       check "row_with_effective" (Properties_data.row_value r' = Wire.Int 99)
   | _ -> check "row_with_effective" false);
  check "row_with_effective unchanged"
    (Properties_data.row_with_effective_value rowv = rowv);
  eqs "value_display int" "5" (Properties_data.value_display (Wire.Int 5));
  eqs "value_display set" "a, b"
    (Properties_data.value_display
       (Wire.Set [ Wire.String "a"; Wire.String "b" ]));
  eqs "value_display ref" "T"
    (Properties_data.value_display (wmap [ "block/title", Wire.String "T" ]));
  eqs "value_display ref name" "n"
    (Properties_data.value_display (wmap [ "block/name", Wire.String "n" ]));
  eqs "value_display nil" "" (Properties_data.value_display Wire.Nil);
  eqs "value_display kw" "k/v" (Properties_data.value_display (Wire.Keyword "k/v"));
  eqs "value_display float int" "3" (Properties_data.value_display (Wire.Float 3.0));
  check "value_empty"
    (Properties_data.value_empty_p Wire.Nil
    && Properties_data.value_empty_p (Wire.String "  ")
    && Properties_data.value_empty_p (Wire.Set [])
    && not (Properties_data.value_empty_p (Wire.Int 0))
    && not (Properties_data.value_empty_p (Wire.Set [ Wire.Nil ])));
  check "value_elems scalar" (Properties_data.value_elems (Wire.Int 1) = [ Wire.Int 1 ]);
  check "value_elems nil" (Properties_data.value_elems Wire.Nil = []);
  (* split_display / positioned_rows *)
  (match
     Properties_data.split_display
       (wmap
          [ "full-properties", Wire.List [ row ]
          ; "hidden-properties", Wire.List [ row ] ])
   with
   | r, h -> check "split_display" (List.length r = 1 && List.length h = 1));
  check "split_display none"
    (Properties_data.split_display (Wire.Map []) = ([], []));
  let block_w =
    wmap
      [ ( "block.temp/positioned-properties"
        , wmap [ "pos-a", Wire.List [ wmap [ "db/ident", Wire.Keyword "p/x" ] ] ] )
      ; "p/x", wmap [ "logseq.property/value", Wire.Int 8 ] ]
  in
  (match Properties_data.positioned_rows block_w "pos-a" with
   | [ r ] ->
       check "positioned row"
         (Properties_data.row_ident r = Some "p/x"
         && Properties_data.row_value r = Wire.Int 8)
   | _ -> check "positioned row" false);
  check "positioned missing" (Properties_data.positioned_rows block_w "zzz" = [])

(* ---- sidebar_state ---- *)

let test_sidebar_state () =
  let p = page [ block "b" "B" ] in
  let it = Sidebar_state.item_of_page p in
  check "item_of_page"
    (it.Sidebar_state.key = "page-p" && it.kind = "page"
    && it.title = "p" && it.page_ref = Some "p"
    && it.props_collapsed);
  check "item_of_page tag keeps props"
    ((Sidebar_state.item_of_page
        { p with Model.page_is_tag = true }).props_collapsed
     = false);
  check "item_of_page uuid ref"
    ((Sidebar_state.item_of_page
        { p with Model.page_title = "" }).page_ref
     = Some "p");
  eqs "page_key uuid" "u:p" (Sidebar_state.page_key p);
  eqs "page_key dbid" "d:5"
    (Sidebar_state.page_key
       { p with Model.page_uuid = None; page_db_id = Some 5 });
  check "breadcrumb_titles"
    (Sidebar_state.breadcrumb_titles
       (Wire.List
          [ wmap [ "block/title", Wire.String "T1" ]
          ; wmap [ "block/name", Wire.String "n2" ]
          ; Wire.Int 3 ])
     = [ "T1"; "n2" ]);
  check "is_page_entity class"
    (Sidebar_state.is_page_entity
       (wmap
          [ "block/tags"
          , Wire.Set [ wmap [ "db/ident", Wire.String "logseq.class/Page" ] ]
          ; "block/page", Wire.Int 1 ]));
  check "is_page_entity name no page"
    (Sidebar_state.is_page_entity (wmap [ "block/name", Wire.String "n" ]));
  check "is_page_entity block"
    (not
       (Sidebar_state.is_page_entity
          (wmap [ "block/page", Wire.Int 1; "block/title", Wire.String "t" ])));
  check "sidebar block_of_pair"
    (Sidebar_state.block_of_pair (Wire.Map [ (Wire.Keyword "block", Wire.Int 4) ])
     = Wire.Int 4)

(* ---- settings_state / cards_state / graphs_ops / boot ---- *)

let test_settings_state () =
  eqs "settings lc" "foo" (Settings_state.page_name_lc " /Foo/ ");
  eqs "settings lc ns" "a/b" (Settings_state.page_name_lc "a/b");
  eqs "settings lc all slashes" "" (Settings_state.page_name_lc "///");
  (* map_assoc updates keyword keys only; string keys untouched *)
  let kvs =
    [ (Wire.Keyword "k", Wire.Int 0); (Wire.String "s", Wire.Int 9) ]
  in
  check "map_assoc update"
    (Settings_state.map_assoc "k" (Wire.Int 1) kvs
     = [ (Wire.Keyword "k", Wire.Int 1); (Wire.String "s", Wire.Int 9) ]);
  check "map_assoc insert"
    (Settings_state.map_assoc "n" (Wire.Int 2) kvs
     = kvs @ [ (Wire.Keyword "n", Wire.Int 2) ]);
  check "map_assoc string key no match"
    (Settings_state.map_assoc "s" (Wire.Int 2) kvs
     = kvs @ [ (Wire.Keyword "s", Wire.Int 2) ]);
  check "map_dissoc"
    (Settings_state.map_dissoc "k" kvs = [ (Wire.String "s", Wire.Int 9) ]);
  check "map_dissoc keeps strings"
    (Settings_state.map_dissoc "s" kvs = kvs)

let test_cards_state () =
  check "cards elems"
    (Wire.elems (Wire.Set [ Wire.Int 1 ]) = [ Wire.Int 1 ]);
  check "cards elems other" (Wire.elems Wire.Nil = []);
  (* uuid refs -> names; spaced names keep [[..]] *)
  check "refs_to_names"
    (Cards_state.refs_to_names "x [[u1]] #[[u2]] and #u3"
       [ ("u1", "A"); ("u2", "B C"); ("u3", "D") ]
     = "x [[A]] #[[B C]] and #u3");
  check "refs_to_names untouched"
    (Cards_state.refs_to_names "plain" [ ("u", "T") ] = "plain")

let test_graphs_ops () =
  check "invalid_chars"
    (Graphs_ops.invalid_chars "a:b*c+d" = [ ':'; '*'; '+' ]);
  check "invalid_chars ok" (Graphs_ops.invalid_chars "MyGraph" = []);
  eqs "short_name" "MyGraph" (Graphs_ops.short_name "logseq_db_MyGraph");
  eqs "short_name other" "other" (Graphs_ops.short_name "other");
  check "is_demo exact" (Graphs_ops.is_demo "logseq_db_Demo");
  check "is_demo suffix" (Graphs_ops.is_demo "logseq_db_xDemo");
  check "is_demo short" (not (Graphs_ops.is_demo "Demo"));
  check "is_demo no" (not (Graphs_ops.is_demo "logseq_db_x"));
  let saved = !Graphs_ops.repos in
  Graphs_ops.repos := [ "logseq_db_A"; "logseq_db_Demo" ];
  check "already_exists" (Graphs_ops.already_exists "A");
  check "already_exists no" (not (Graphs_ops.already_exists "B"));
  check "removable demo multi" (Graphs_ops.removable "logseq_db_Demo");
  Graphs_ops.repos := [ "logseq_db_Demo" ];
  check "removable demo single" (not (Graphs_ops.removable "logseq_db_Demo"));
  check "removable normal" (Graphs_ops.removable "logseq_db_A");
  Graphs_ops.repos := saved

let test_boot () =
  eqs "unquote" "x" (Platform.storage_unquote "\"x\"");
  eqs "unquote bare" "x" (Platform.storage_unquote "x");
  eqs "unquote empty" "" (Platform.storage_unquote "\"\"");
  eqs "unquote single" "\"" (Platform.storage_unquote "\"")

(* ---- update: Toast_dismiss_key + confirm reset on navigate ---- *)

let test_update3 () =
  let keyed k =
    { Model.toast_id = 0; toast_text = "t"; toast_kind = "info"
    ; toast_key = k }
  in
  let m =
    Update.update Model.initial (Action.Toast_push (keyed (Some "k1")))
    |> fun m -> Update.update m (Action.Toast_push (keyed (Some "k2")))
    |> fun m -> Update.update m (Action.Toast_push (keyed None))
  in
  let m1 = Update.update m (Action.Toast_dismiss_key "k2") in
  check "dismiss_key removes only that key"
    (List.length m1.Model.toasts = 2
    && not
         (List.exists
            (fun t -> t.Model.toast_key = Some "k2")
            m1.Model.toasts)
    && List.exists
         (fun t -> t.Model.toast_key = Some "k1")
         m1.Model.toasts);
  (* sdk close_msg with an unknown key clears nothing *)
  let m2 = Update.update m (Action.Toast_dismiss_key "absent") in
  check "dismiss_key unknown keeps all"
    (List.length m2.Model.toasts = 3);
  (* Navigate_to resets confirm alongside other page-local state *)
  let dirty =
    { Model.initial with
      Model.confirm = Some (Model.Confirm_delete_page ("u", "T", false)) }
  in
  check "navigate clears confirm"
    ((Update.update dirty (Action.Navigate_to Model.All_pages))
       .Model.confirm
     = None)

(* ---- runtime: nav_hash / nav mark / after_page_load ---- *)

let test_runtime_nav () =
  let saved_uuid = !Runtime.current_graph_uuid in
  Runtime.current_graph_uuid := None;
  eqs "nav_hash no uuid" "#/page/u" (Runtime.nav_hash "#/page/u");
  Runtime.current_graph_uuid := Some "g-uuid";
  eqs "nav_hash appends graph-id" "#/page/u?graph-id=g-uuid"
    (Runtime.nav_hash "#/page/u");
  Runtime.current_graph_uuid := Some "";
  eqs "nav_hash empty uuid skipped" "#/page/u"
    (Runtime.nav_hash "#/page/u");
  Runtime.current_graph_uuid := saved_uuid;
  (* mark_nav/take_nav_mark is a consume-once flag *)
  Runtime.mark_nav ();
  check "take_nav_mark first" (Runtime.take_nav_mark ());
  check "take_nav_mark consumed" (not (Runtime.take_nav_mark ()));
  (* on_page_loaded arms the one-shot; cleared afterwards so no state
     leaks into later tests *)
  Runtime.on_page_loaded "u1" (fun () -> ());
  (match !Runtime.after_page_load with
   | Some (want, _) -> check "after_page_load armed" (want = "u1")
   | None -> check "after_page_load armed" false);
  Runtime.after_page_load := None

(* ---- views: pinned columns ---- *)

let test_views_pinned () =
  let ent =
    wmap
      [ "block/uuid", Wire.Uuid "v1"
      ; "logseq.property.table/pinned-columns"
      , Wire.List
          [ Wire.Keyword "user/rating"
          ; wmap [ "db/ident", Wire.Keyword "p/via-map" ]
          ; Wire.String "dropped/string" ] ]
  in
  (match Views_wire.decode_view_ent ent with
   | Some v ->
       check "vpinned decodes idents only"
         (v.Views_wire.vpinned = [ "user/rating"; "p/via-map" ])
   | None -> check "vpinned decodes idents only" false);
  let inst = mk_view_inst "x" in
  (match Views_wire.decode_view_ent ent with
   | Some v ->
       Views_state.update inst (fun s -> Views_state.apply_view_entity s v)
   | None -> check "pinned applied" false);
  let col id =
    { Views_state.c_id = id; c_name = ""; c_type = "default"
    ; c_prop = None; c_disable_hide = false; c_many = false }
  in
  (* select/id are always pinned, the rest come from inst.pinned *)
  check "is_pinned select/id always"
    (Views_table.is_pinned (vget inst) (col "select")
    && Views_table.is_pinned (vget inst) (col "id"));
  check "is_pinned member"
    (Views_table.is_pinned (vget inst) (col "user/rating"));
  check "is_pinned non-member"
    (not (Views_table.is_pinned (vget inst) (col "p/other")))

(* ---- edn/wire edge cases ---- *)

let test_edn3 () =
  check "parse empty -> Nil" (Edn.parse "" = Wire.Nil);
  check "parse first form only" (Edn.parse "1 2" = Wire.Int 1);
  (try
     ignore (Edn.parse "{");
     check "unclosed map raises" false
   with Edn.Parse_error _ -> check "unclosed map raises" true);
  (try
     ignore (Edn.parse "]");
     check "stray close raises" false
   with Edn.Parse_error _ -> check "stray close raises" true);
  (* whitespace-only input parses to Nil too *)
  check "parse whitespace" (Edn.parse "  , " = Wire.Nil);
  (* get matches Keyword/String/Symbol keys by name; first wins *)
  let m =
    Wire.Map
      [ (Wire.String "k", Wire.Int 1); (Wire.Symbol "s", Wire.Int 2)
      ; (Wire.kw "k", Wire.Int 9) ]
  in
  check "get string key" (Wire.get m "k" = Some (Wire.Int 1));
  check "get symbol key" (Wire.get m "s" = Some (Wire.Int 2));
  check "as_uuid string" (Wire.as_uuid (Wire.String "u") = Some "u");
  check "as_uuid uuid" (Wire.as_uuid (Wire.Uuid "v") = Some "v");
  check "as_uuid non-string" (Wire.as_uuid (Wire.Int 1) = None);
  check "as_bool" (Wire.as_bool (Wire.Bool true) = Some true);
  check "as_bool non-bool" (Wire.as_bool (Wire.Int 1) = None);
  check "as_int int64" (Wire.as_int (Wire.Int64 7L) = Some 7)

(* ---- block_parse edges ---- *)

let test_block_parse3 () =
  (* only whitespace/brackets/parens/# delimit a bare tag name — a
     trailing '.' stays part of the name *)
  check "tag trailing dot kept"
    (Block_parse.scan_tok "#tag." 0 = Some (`Tag, "tag.", 5));
  check "hash at end is none"
    (Block_parse.scan_tok "x #" 2 = None);
  check "tag stops at bracket"
    (Block_parse.scan_tok "#a]b" 0 = Some (`Tag, "a", 2));
  check "tag empty name"
    (Block_parse.scan_tok "#[x" 0 = None);
  (* an unclosed [[ stays literal text, no refs *)
  let t', refs, _, _ = Block_parse.parse_title "see [[unclosed" in
  check "unclosed page literal" (t' = "see [[unclosed" && refs = []);
  (* a '#' mid-word still opens a hash ref — no boundary
     requirement; the title stays literal and nothing lands in tags *)
  let t2, refs2, tags2, _ = Block_parse.parse_title "a#b" in
  check "mid-word tag"
    (t2 = "a#b" && List.length refs2 = 1 && List.length tags2 = 0)

(* ---- title_refs edges ---- *)

let test_title_refs3 () =
  (* scan_title trims [[ name ]] and drops empties *)
  check "scan trims + drops empty"
    (Title_refs.scan_title "[[ P ]] [[ ]] x" = ([ "P" ], [], []));
  check "scan hash at end"
    (Title_refs.scan_title "x #" = ([], [], []));
  check "scan unclosed ignored"
    (Title_refs.scan_title "a [[oops" = ([], [], []));
  (* tag_name_at picks the longest matching name *)
  let resolved =
    [ { Title_refs.name = "y"; uuid = "u1"; is_tag = true
      ; is_hash = true; fresh = true; entity = Wire.Nil }
    ; { Title_refs.name = "yard"; uuid = "u2"; is_tag = true
      ; is_hash = true; fresh = true; entity = Wire.Nil } ]
  in
  check "tag_name_at longest match"
    (Title_refs.tag_name_at "#yard" 1 resolved
     = Some (List.nth resolved 1));
  (* unresolved names stay literal *)
  eqs "rewrite unresolved kept" "a [[X]] #q"
    (Title_refs.rewrite_title "a [[X]] #q" []);
  (* ## is a heading marker, not a tag rewrite *)
  eqs "rewrite ## untouched" "##h"
    (Title_refs.rewrite_title "##h"
       [ { Title_refs.name = "h"; uuid = "u"; is_tag = true
         ; is_hash = true; fresh = true; entity = Wire.Nil } ]);
  (* tag at end of string counts as a boundary *)
  eqs "rewrite tag at eos" "see #[[u1]]"
    (Title_refs.rewrite_title "see #y" resolved)

(* ---- editor_actions: selected_uuids fallback ---- *)

let test_selected_uuids () =
  (* no mounted editor state -> empty selection -> empty list *)
  let saved_model = !model_stub in
  set_page (Some (page [ block "a" "A"; block "b" "B" ]));
  check "selected_uuids empty sel"
    (Editor_actions.selected_uuids () = []);
  model_stub := saved_model

(* ---- Update.update: remaining arm ---- *)

let test_update_sidebar2 () =
  let m0 = Model.initial in
  check "right sidebar closed" (not m0.Model.right_sidebar_open);
  let m1 = Update.update m0 Action.Toggle_right_sidebar in
  check "right sidebar toggles on" m1.Model.right_sidebar_open;
  let m2 = Update.update m1 Action.Toggle_right_sidebar in
  check "right sidebar toggles off" (not m2.Model.right_sidebar_open);
  (* left/right are independent *)
  let m3 = Update.update m1 Action.Toggle_left_sidebar in
  check "sidebars independent"
    (m3.Model.right_sidebar_open && m3.Model.left_sidebar_open);
  check "noop identity" (Update.update m3 Action.Noop == m3)

(* ---- Decode: collection wrappers ---- *)

let test_decode7 () =
  let nb u t =
    wmap
      [ ("block/uuid", Wire.Uuid u); ("block/title", Wire.String t)
      ; ("logseq.property/order-list-type", Wire.String "number") ]
  in
  let ol u t ty =
    wmap
      [ ("block/uuid", Wire.Uuid u); ("block/title", Wire.String t)
      ; ("logseq.property/order-list-type", Wire.String ty) ]
  in
  let bs =
    Decode.blocks_of_wire (Wire.Array [ nb "a" "A"; nb "b" "B" ])
  in
  eqi "blocks_of_wire count" 2 (List.length bs);
  check "blocks_of_wire order idx"
    ((List.nth bs 0).Model.block_order_index = Some 1
    && (List.nth bs 1).Model.block_order_index = Some 2);
  (* order_index resets when the list type changes; unlisted = None *)
  let bs2 =
    Decode.blocks_of_wire
      (Wire.Array
         [ nb "a" "a"; ol "b" "b" "bullet"; nb "c" "c"
         ; wmap [ ("block/uuid", Wire.Uuid "d") ] ])
  in
  check "order resets on type change"
    (List.map (fun (b : Model.block) -> b.block_order_index) bs2
    = [ Some 1; Some 1; Some 1; None ]);
  check "blocks_of_wire non-seq" (Decode.blocks_of_wire Wire.Nil = []);
  (* mark_default_collapsed: page blocks collapse, others don't *)
  let pb = Decode.block_of_wire (wmap [ ("block/uuid", Wire.Uuid "p"); ("block/name", Wire.String "p") ]) in
  let rb = Decode.block_of_wire (wmap [ ("block/uuid", Wire.Uuid "r") ]) in
  check "mark_default_collapsed"
    ((Decode.mark_default_collapsed pb).Model.block_default_collapsed
    && not (Decode.mark_default_collapsed rb).Model.block_default_collapsed);
  (* pages_only keeps only page subtrees *)
  let tree =
    { (block ~children:[ block "k" "c"; { (block "kp" "cp") with
        Model.block_is_page = true } ] "r" "r")
      with Model.block_is_page = true }
  in
  let kept = Decode.pages_only [ tree; block "x" "y" ] in
  check "pages_only drops non-pages"
    (List.length kept = 1
    && List.length (List.hd kept).Model.block_children = 1
    && (List.hd (List.hd kept).Model.block_children).block_uuid = Some "kp")

(* ---- Edn: more edge cases ---- *)

(* ---- Sdk_convert: wire <-> json ---- *)

let json_obj kvs =
  let d = Js.Dict.empty () in
  List.iter (fun (k, v) -> Js.Dict.set d k v) kvs;
  Js.Json.object_ d

let test_sdk_convert2 () =
  (* entity maps with uuid+title gain content/fullTitle aliases *)
  let j =
    Sdk_convert.json_of_wire
      (wmap
         [ ("block/uuid", Wire.Uuid "u"); ("block/title", Wire.String "t") ])
  in
  eqs "content alias" "{\"uuid\":\"u\",\"title\":\"t\",\"content\":\"t\",\"fullTitle\":\"t\"}"
    (Js.Json.stringify j);
  (* result side: hidden keys out, tag refs reduced *)
  let rj =
    Sdk_convert.result_json_of_wire
      (wmap
         [ ("block/tx-id", Wire.Int 9)
         ; ("block/tags", Wire.Set [ wmap [ ("db/id", Wire.Int 4) ] ]) ])
  in
  eqs "result hides + reduces" "{\"tags\":[4]}"
    (Js.Json.stringify rj);
  (* wire_of_json direction *)
  let jn = Js.Json.number 3.5 in
  check "wire_of_json float"
    (Sdk_convert.wire_of_json jn = Wire.Float 3.5);
  check "wire_of_json int"
    (Sdk_convert.wire_of_json (Js.Json.number 4.) = Wire.Int 4);
  check "wire_of_json bool"
    (Sdk_convert.wire_of_json (Js.Json.boolean true) = Wire.Bool true);
  check "wire_of_json null"
    (Sdk_convert.wire_of_json Js.Json.null = Wire.Nil);
  check "wire_of_json string"
    (Sdk_convert.wire_of_json (Js.Json.string "x") = Wire.String "x");
  let jo = json_obj [ ("k", Js.Json.string "v"); ("n", Js.Json.number 2.) ] in
  check "wire_of_json object"
    (Sdk_convert.wire_of_json jo
     = Wire.Map
         [ (Wire.String "k", Wire.String "v"); (Wire.String "n", Wire.Int 2) ])

(* ---- Sdk_util pure helpers ---- *)

let test_sdk_util2 () =
  let u = "aaaaaaaa-1111-2222-3333-444444444444" in
  eq "page_ref_names" [ "Page X"; "Y" ]
    (Sdk_util.page_ref_names ("see [[Page X]] and [[" ^ u ^ "]] or [[Y]]"))
    (String.concat ",");
  check "page_ref_names dedup"
    (Sdk_util.page_ref_names "[[A]] [[A]]" = [ "A" ]);
  eqs "replace_all" "x-b-x" (Sdk_util.replace_all "a-b-a" ~pat:"a" ~rep:"x");
  eqs "replace_all empty pat" "ab"
    (Sdk_util.replace_all "ab" ~pat:"" ~rep:"x");
  check "collect_title_strings"
    (Sdk_util.collect_title_strings
       (wmap
          [ ("block/title", Wire.String "t1")
          ; ( "nested"
            , Wire.Array [ wmap [ ("block/title", Wire.String "t2") ] ] )
          ])
       []
    = [ "t2"; "t1" ]);
  eqs "edn_escape" "a\\\\b\\\"c" (Sdk_util.edn_escape "a\\b\"c");
  eq "hashtag_names" [ "tag1"; "tag_2" ]
    (Sdk_util.hashtag_names "#tag1 and mid#no and #tag_2 x#no")
    (String.concat ",");
  (* '{' of '#{' is not a boundary char — set literals don't tag *)
  check "hashtag dedup" (Sdk_util.hashtag_names "#a #a" = [ "a" ])

let test_sdk_util3 () =
  let known = [ ("page x", "u-px"); ("tag1", "u-t1") ] in
  let w =
    Sdk_util.rewrite_title_refs ~tags:[ "tag1" ] known
      (wmap [ ("block/title", Wire.String "see [[Page X]] and #tag1") ])
  in
  eqs "title rewritten" "see [[u-px]] and #tag1"
    (Option.get (Wire.map_get_string w "block/title"));
  let refs =
    match Wire.get w "block/refs" with
    | Some (Wire.List xs) -> xs
    | _ -> []
  in
  eqi "refs stubs" 2 (List.length refs);
  check "ref stub shape"
    (Wire.get (List.hd refs) "block/name" = Some (Wire.String "page x")
    && Wire.get (List.hd refs) "block/uuid" = Some (Wire.Uuid "u-px")
    && Wire.get (List.hd refs) "block/type" = Some (Wire.String "page"));
  let tags =
    match Wire.get w "block/tags" with
    | Some (Wire.List xs) -> xs
    | _ -> []
  in
  eqi "tags stubs" 1 (List.length tags);
  check "tag stub has no type"
    (Wire.get (List.hd tags) "block/name" = Some (Wire.String "tag1")
    && Wire.get (List.hd tags) "block/type" = None);
  (* non-class hashtag still refs but doesn't tag *)
  let w2 =
    Sdk_util.rewrite_title_refs ~tags:[] known
      (wmap [ ("block/title", Wire.String "hi #tag1") ])
  in
  check "unclassed hashtag refs only"
    (match Wire.get w2 "block/refs", Wire.get w2 "block/tags" with
     | Some (Wire.List [ _ ]), None -> true
     | _ -> false);
  check "no refs -> untouched"
    (Sdk_util.rewrite_title_refs ~tags:[] known
       (wmap [ ("block/title", Wire.String "plain") ])
     = wmap [ ("block/title", Wire.String "plain") ]);
  check "block_of_pair map"
    (Wire.block_of_pair
       (wmap [ ("block", Wire.Int 3) ]) = Some (Wire.Int 3));
  check "block_of_pair seq"
    (Wire.block_of_pair
       (Wire.Array [ Wire.Int 1; Wire.Int 9 ]) = Some (Wire.Int 9));
  check "block_of_pair junk"
    (Wire.block_of_pair (Wire.Int 5) = None)

let test_sdk_util4 () =
  check "eid number"
    (Sdk_util.eid_wire_of_json (Js.Json.number 5.)
     = Some (Wire.Int64 5L));
  check "eid string"
    (Sdk_util.eid_wire_of_json (Js.Json.string "u")
     = Some (Wire.String "u"));
  check "eid id map"
    (Sdk_util.eid_wire_of_json (json_obj [ ("id", Js.Json.number 7.) ])
     = Some (Wire.Int64 7L));
  check "eid uuid map"
    (Sdk_util.eid_wire_of_json
       (json_obj [ ("uuid", Js.Json.string "u") ])
     = Some (Wire.String "u"));
  check "eid junk" (Sdk_util.eid_wire_of_json Js.Json.null = None);
  let cls =
    wmap
      [ ( "block/tags"
        , Wire.Array [ wmap [ ("db/ident", Wire.kw "logseq.class/Tag") ] ]
        )
      ]
  in
  check "is_class_entity yes" (Sdk_util.is_class_entity cls);
  check "is_class_entity no"
    (not
       (Sdk_util.is_class_entity
          (wmap
             [ ( "block/tags"
               , Wire.Array [ wmap [ ("db/ident", Wire.kw "user/x") ] ] )
             ])));
  check "is_class_entity missing"
    (not (Sdk_util.is_class_entity (wmap [])));
  eq "block_uuid_of" (Some "u")
    (Sdk_util.block_uuid_of (wmap [ ("block/uuid", Wire.Uuid "u") ]))
    (function
      | Some s -> s
      | None -> "none")

(* ---- Sdk_write pure op-building ---- *)

let test_sdk_write () =
  check "url_like http" (Sdk_write.url_like "https://x.y");
  check "url_like custom scheme" (Sdk_write.url_like "zotero://x");
  check "url_like plain" (not (Sdk_write.url_like "just text"));
  check "url_like leading digit scheme"
    (not (Sdk_write.url_like "9lives:x"));
  eqs "infer checkbox" "checkbox"
    (Sdk_write.infer_property_type (Wire.Bool true));
  eqs "infer number" "number" (Sdk_write.infer_property_type (Wire.Int 3));
  eqs "infer url" "url"
    (Sdk_write.infer_property_type (Wire.String "https://x"));
  eqs "infer url set" "url"
    (Sdk_write.infer_property_type
       (Wire.Set [ Wire.String "a://x"; Wire.String "b://y" ]));
  eqs "infer json" "json" (Sdk_write.infer_property_type (Wire.Map []));
  eqs "infer default" "default"
    (Sdk_write.infer_property_type (Wire.String "plain"));
  eqs "property_name_of_ident" "tail"
    (Sdk_write.property_name_of_ident "ns/tail");
  eqs "property_name_of_ident bare" "x"
    (Sdk_write.property_name_of_ident "x");
  let v = Sdk_write.stringify_wire (wmap [ ("a", Wire.Int 1) ]) in
  eqs "stringify_wire" "{\"a\":1}"
    (match v with Wire.String s -> s | _ -> "");
  eqs "str_wire string" "x"
    (match Sdk_write.str_wire (Wire.String "x") with
     | Wire.String s -> s
     | _ -> "");
  eqs "str_wire int" "4"
    (match Sdk_write.str_wire (Wire.Int 4) with
     | Wire.String s -> s
     | _ -> "")

let test_sdk_write2 () =
  let ent =
    Sdk_write.entry_ops ~reset:false "bu"
      ("k", "plugin.property._test_plugin/k", Wire.Int 1)
      (Wire.Map []) None
  in
  eqi "entry_ops upsert+set" 2 (List.length ent);
  check "entry_ops upsert shape"
    (match List.hd ent with
     | Wire.Array
         [ Wire.Keyword "upsert-property"
         ; Wire.Array [ Wire.Keyword "plugin.property._test_plugin/k"; spec; opts ]
         ] ->
         Wire.get spec "logseq.property/type" = Some (Wire.Keyword "number")
         && Wire.get spec "db/cardinality"
            = Some (Wire.Keyword "db.cardinality/one")
         && Wire.get opts "property-name" = Some (Wire.String "k")
     | _ -> false);
  check "entry_ops set shape"
    (match List.nth ent 1 with
     | Wire.Array
         [ Wire.Keyword "set-block-property"
         ; Wire.Array [ Wire.Uuid "bu"; Wire.Keyword _; Wire.Int 1 ] ] ->
         true
     | _ -> false);
  (* seq value -> cardinality many + one set per element *)
  let ent2 =
    Sdk_write.entry_ops ~reset:false "bu" ("k", "i", Wire.Array [ Wire.Int 1; Wire.Int 2 ])
      (Wire.Map []) None
  in
  eqi "entry_ops many sets" 3 (List.length ent2);
  (* existing prop -> no upsert *)
  let prop = wmap [ ("logseq.property/type", Wire.kw "number") ] in
  check "entry_ops existing prop"
    (match
       Sdk_write.entry_ops ~reset:false "bu" ("k", "i", Wire.Int 1)
         (Wire.Map []) (Some prop)
     with
     | [ Wire.Array (Wire.Keyword "set-block-property" :: _) ] -> true
     | _ -> false)

let test_sdk_write3 () =
  let prop = wmap [ ("logseq.property/type", Wire.kw "number") ] in
  (* nil value on existing prop -> remove op, then a set of nil *)
  check "entry_ops nil removes"
    (match
       Sdk_write.entry_ops ~reset:false "bu" ("k", "i", Wire.Nil)
         (Wire.Map []) (Some prop)
     with
     | [ Wire.Array
           [ Wire.Keyword "remove-block-property"
           ; Wire.Array [ Wire.Uuid "bu"; Wire.Keyword "i" ] ]
       ; _ ] -> true
     | _ -> false);
  (* many + reset on existing prop removes first *)
  let ops =
    Sdk_write.entry_ops ~reset:true "bu"
      ("k", "i", Wire.Array [ Wire.Int 1 ])
      (Wire.Map []) (Some prop)
  in
  check "entry_ops reset removes first"
    (match ops with
     | Wire.Array (Wire.Keyword "remove-block-property" :: _)
       :: Wire.Array (Wire.Keyword "set-block-property" :: _) :: _ ->
         true
     | _ -> false);
  (* json + many raises *)
  check "json+many raises"
    (try
       ignore
         (Sdk_write.entry_ops ~reset:false "bu"
            ("k", "i", Wire.Array [ Wire.Int 1 ])
            (wmap [ ("type", Wire.String "json") ]) None);
       false
     with
     | Js.Exn.Error _ -> true);
  (* existing prop + schema hint raises *)
  check "schema-hint on existing raises"
    (try
       ignore
         (Sdk_write.entry_ops ~reset:false "bu" ("k", "i", Wire.Int 1)
            (wmap [ ("type", Wire.String "number") ]) (Some prop));
       false
     with
     | Js.Exn.Error _ -> true);
  (* json conversion: map value stringified under json schema *)
  let ops2 =
    Sdk_write.entry_ops ~reset:false "bu" ("k", "i", Wire.Map [])
      (wmap [ ("type", Wire.String "json") ]) None
  in
  check "json value converted"
    (match List.nth ops2 1 with
     | Wire.Array
         [ _; Wire.Array [ _; _; Wire.String s ] ] -> s = "{}"
     | _ -> false)

let test_sdk_write4 () =
  let flat =
    Sdk_write.flat_map_of "u1" 2 (Some "pu")
      { Title_refs.title = "t"; refs = []; tags = [] }
  in
  check "flat_map_of"
    (Wire.get flat "block/title" = Some (Wire.String "t")
    && Wire.get flat "block/uuid" = Some (Wire.Uuid "u1")
    && Wire.get flat "block/level" = Some (Wire.Int 2)
    && Wire.get flat "block/parent"
       = Some (Wire.Array [ Wire.kw "block/uuid"; Wire.Uuid "pu" ]));
  check "flat_map_of no parent"
    (Wire.get
       (Sdk_write.flat_map_of "u1" 1 None
          { Title_refs.title = "t"; refs = []; tags = [] })
       "block/parent"
     = None);
  (* flatten_batch: preorder fold, children before their siblings' rest,
     reversed acc — callers List.rev *)
  let tree =
    Wire.Array
      [ wmap
          [ ("content", Wire.String "p")
          ; ("uuid", Wire.Uuid "pu")
          ; ( "children"
            , Wire.Array
                [ wmap
                    [ ("content", Wire.String "c")
                    ; ("uuid", Wire.String "cu") ] ] ) ]
      ]
  in
  let flats =
    List.rev (List.fold_left (Sdk_write.flatten_batch 1 None) []
                (Sdk_write.list_items tree))
  in
  check "flatten_batch shape"
    (match flats with
     | [ (pu, "p", 1, None, _); (cu, "c", 2, Some pu', _) ] ->
         pu = "pu" && cu = "cu" && pu' = "pu"
     | _ -> false)

(* ---- Views_wire decoders ---- *)

let test_views_wire2 () =
  (* snapshot slots are keyed by [:resource <key>] vectors *)
  let snap =
    wmap
      [ ( "slots"
        , Wire.Map
            [ ( Wire.Array [ Wire.kw "resource"; Wire.String "rk" ]
              , wmap [ ("value", Wire.Int 9) ] ) ] ) ]
  in
  check "snapshot_slot_value"
    (Views_wire.snapshot_slot_value snap (Wire.String "rk")
     = Some (Wire.Int 9));
  check "snapshot_slot_value miss"
    (Views_wire.snapshot_slot_value snap (Wire.String "other") = None);
  let ent =
    Views_wire.decode_view_ent
      (wmap
         [ ("block/uuid", Wire.Uuid "vu"); ("db/id", Wire.Int 7)
         ; ("block/title", Wire.String "My View")
         ; ("logseq.property.view/type", Wire.kw "logseq.property.view/type.list")
         ; ("logseq.property.table/hidden-columns",
            Wire.Array [ Wire.kw "block/journal-day" ]) ])
  in
  check "decode_view_ent"
    (match ent with
     | Some v ->
         v.Views_wire.vu = "vu" && v.vid = 7 && v.vtitle = "My View"
         && v.vtype = "logseq.property.view/type.list"
         && v.vhidden = [ "block/journal-day" ]
     | None -> false);
  check "decode_view_ent no uuid -> None"
    (Views_wire.decode_view_ent (wmap []) = None);
  (* defaults when optional fields absent *)
  check "decode_view_ent defaults"
    (match
       Views_wire.decode_view_ent
         (wmap [ ("block/uuid", Wire.Uuid "v") ])
     with
     | Some v ->
         v.vtype = "logseq.property.view/type.table"
         && v.vhidden = [] && v.vordered = [] && v.vgroup_by = None
     | None -> false)

let test_views_wire3 () =
  let flat =
    Views_wire.decode_view_data
      (wmap
         [ ("count", Wire.Int 2)
         ; ("rows", Wire.Array [ Wire.Uuid "a"; Wire.Uuid "b" ])
         ; ("properties", Wire.Array [ Wire.kw "block/title" ])
         ; ( "row-previews"
           , Wire.Map [ (Wire.Uuid "a", wmap [ ("block/title", Wire.String "T") ]) ]
           )
         ])
  in
  check "view_data flat"
    (match flat with
     | Views_wire.VFlat { rows; count; previews; qprops } ->
         rows = [ "a"; "b" ] && count = 2 && qprops = [ "block/title" ]
         && Hashtbl.find previews "a"
            = wmap [ ("block/title", Wire.String "T") ]
     | _ -> false);
  let grouped =
    Views_wire.decode_view_data
      (wmap
         [ ("partition", Wire.kw "grouped")
         ; ( "groups"
           , Wire.Array
               [ wmap
                   [ ("value", Wire.String "g1")
                   ; ("rows", Wire.Array [ Wire.Uuid "x" ]) ] ] ) ])
  in
  check "view_data grouped"
    (match grouped with
     | Views_wire.VGrouped [ { gv = Wire.String "g1"; grows = [ "x" ] } ] ->
         true
     | _ -> false);
  let glist =
    Views_wire.decode_view_data
      (wmap
         [ ("partition", Wire.kw "grouped-list")
         ; ( "groups"
           , Wire.Array
               [ wmap
                   [ ("value", Wire.Nil)
                   ; ( "partitions"
                     , Wire.Array
                         [ wmap
                             [ ("breadcrumb-uuid", Wire.Uuid "bc")
                             ; ("rows", Wire.Array [ Wire.Uuid "r1" ]) ] ]
                     ) ] ] ) ])
  in
  check "view_data grouped-list"
    (match glist with
     | Views_wire.VGroupedList
         [ { glparts = [ ("bc", [ "r1" ]) ]; _ } ] -> true
     | _ -> false);
  check "view_data non-map empty"
    (Views_wire.decode_view_data (Wire.Int 1) = Views_wire.VEmpty)

let test_views_wire4 () =
  eqs "prop_text str" "s" (Views_wire.prop_text (Wire.String "s"));
  eqs "prop_text int" "4" (Views_wire.prop_text (Wire.Int 4));
  eqs "prop_text float" "2.5" (Views_wire.prop_text (Wire.Float 2.5));
  eqs "prop_text bool" "true" (Views_wire.prop_text (Wire.Bool true));
  eqs "prop_text kw" "a/b" (Views_wire.prop_text (Wire.kw "a/b"));
  eqs "prop_text map title" "t"
    (Views_wire.prop_text (wmap [ ("block/title", Wire.String "t") ]));
  eqs "prop_text list join" "a, b"
    (Views_wire.prop_text
       (Wire.List [ Wire.String "a"; Wire.String "b" ]));
  eqs "prop_text nil" "" (Views_wire.prop_text Wire.Nil)

(* ---- Views_state sorting/filters wire roundtrips ---- *)

(* ---- Views_table pure helpers ---- *)

let test_views_table2 () =
  (* fmt_cell_value: Int under datetime col formats, others prop_text *)
  let col_dt = { Views_table.created_column with Views_state.c_type = "datetime" } in
  let s = Views_table.fmt_cell_value col_dt (Wire.Int 0) in
  check "fmt_cell_value datetime shape"
    (String.length s = 16 && String.get s 4 = '-' && String.get s 10 = ' ');
  eqs "fmt_cell_value plain" "5"
    (Views_table.fmt_cell_value Views_table.title_column (Wire.Int 5));
  (* cell_value: builtin reads directly, else property map fallback *)
  let blk =
    wmap
      [ ("block/title", Wire.String "T")
      ; ( "block/properties"
        , wmap [ ("user.prop/x", Wire.Int 9) ] ) ]
  in
  check "cell_value builtin"
    (Views_table.cell_value blk Views_table.title_column
     = Wire.String "T");
  let user_col =
    { Views_state.c_id = "user.prop/x"; c_name = "X"; c_type = "default"
    ; c_prop = None; c_disable_hide = false; c_many = false }
  in
  check "cell_value props fallback"
    (Views_table.cell_value blk user_col = Wire.Int 9);
  check "cell_value missing -> Nil"
    (Views_table.cell_value (wmap []) user_col = Wire.Nil);
  (* title text: select/id none, empty none *)
  let title_text blk col =
    match Views_wire.prop_text (Views_table.cell_value blk col) with
    | "" -> None
    | t -> Some t
  in
  check "title_text select none"
    (title_text blk Views_table.select_column = None);
  check "title_text value" (title_text blk Views_table.title_column = Some "T");
  check "title_text empty none"
    (title_text (wmap []) Views_table.title_column = None)

(* ---- Properties_data pure helpers ---- *)

let test_props_data () =
  let row =
    wmap
      [ ("property-id", Wire.kw "user.prop/x")
      ; ( "property"
        , wmap
            [ ("block/title", Wire.String "X")
            ; ("logseq.property/type", Wire.kw "number")
            ; ("db/cardinality", Wire.kw "db.cardinality/many")
            ; ("logseq.property/hide?", Wire.Bool true)
            ; ("logseq.property/hide-empty-value", Wire.Bool true)
            ; ( "logseq.property/ui-position"
              , wmap [ ("db/ident", Wire.kw "logseq.property.ui-position/block-right") ] )
            ; ("property/closed-values", Wire.Array [ Wire.Int 1 ]) ] )
      ; ("value", Wire.Int 5) ]
  in
  eq "row_ident" (Some "user.prop/x")
    (Properties_data.row_ident row)
    (function
      | Some s -> s
      | None -> "none");
  eqs "row_title" "X" (Properties_data.row_title row);
  eqs "row_type" "number" (Properties_data.row_type row);
  check "row_many" (Properties_data.row_many row);
  eqi "row_closed_values" 1
    (List.length (Properties_data.row_closed_values row));
  check "row_hidden" (Properties_data.row_hidden row);
  check "row_hide_empty" (Properties_data.row_hide_empty row);
  eqs "row_position" "logseq.property.ui-position/block-right"
    (Properties_data.row_position row);
  check "row_is_class_schema no"
    (not (Properties_data.row_is_class_schema row));
  check "row_is_class_schema"
    (Properties_data.row_is_class_schema
       (wmap [ ("schema?", Wire.Bool true) ]));
  (* defaults on sparse row *)
  let bare = wmap [ ("property-id", Wire.kw "p") ] in
  eqs "row defaults" "default" (Properties_data.row_type bare);
  eqs "row_position default" "logseq.property.ui-position/properties"
    (Properties_data.row_position bare);
  check "row_ident missing" (Properties_data.row_ident (wmap []) = None)

let test_props_data2 () =
  (* default value substituted when value empty *)
  let row =
    wmap
      [ ( "property"
        , wmap [ ("logseq.property/default-value", Wire.Int 42) ] )
      ; ("value", Wire.Nil) ]
  in
  check "row_effective_value default"
    (Properties_data.row_effective_value row = Wire.Int 42);
  let eff = Properties_data.row_with_effective_value row in
  check "row_with_effective_value swaps"
    (Wire.get eff "value" = Some (Wire.Int 42));
  check "row_with_effective_value keeps own"
    (Properties_data.row_with_effective_value
       (wmap [ ("value", Wire.Int 1) ])
     = wmap [ ("value", Wire.Int 1) ]);
  (* tag_idents / ident entry helpers *)
  let ent =
    wmap
      [ ( "block/tags"
        , Wire.Set
            [ wmap [ ("db/ident", Wire.kw "a/b") ]
            ; Wire.Tagged ("e", wmap [ ("db/ident", Wire.kw "c/d") ]) ] )
      ]
  in
  eq "tag_idents" [ "a/b"; "c/d" ]
    (Properties_data.tag_idents ent) (String.concat ",");
  check "ident_entry_id"
    (Properties_data.ident_entry_id (wmap [ ("db/id", Wire.Int 3) ])
     = Some 3);
  check "ident_entry_ident kw"
    (Properties_data.ident_entry_ident
       (wmap [ ("db/ident", Wire.kw "a/b") ])
     = Some "a/b")

let test_props_data3 () =
  check "value_is_ref map"
    (Properties_data.value_is_ref (Wire.Map []));
  check "value_is_ref scalar no"
    (not (Properties_data.value_is_ref (Wire.Int 1)));
  eq "value_elems set" [ Wire.Int 1 ]
    (Properties_data.value_elems (Wire.Set [ Wire.Int 1 ]))
    (fun _ -> "x");
  eq "value_elems scalar wrap" [ Wire.String "a" ]
    (Properties_data.value_elems (Wire.String "a"))
    (fun _ -> "x");
  check "value_elems nil" (Properties_data.value_elems Wire.Nil = []);
  eqs "ref_title title" "T"
    (Properties_data.ref_title (wmap [ ("block/title", Wire.String "T") ]));
  eqs "ref_title name fallback" "n"
    (Properties_data.ref_title (wmap [ ("block/name", Wire.String "n") ]));
  check "ref_dbid"
    (Properties_data.ref_dbid (wmap [ ("db/id", Wire.Int 8) ]) = Some 8);
  eqs "value_display int" "4" (Properties_data.value_display (Wire.Int 4));
  eqs "value_display float int" "3"
    (Properties_data.value_display (Wire.Float 3.0));
  eqs "value_display set join" "a, b"
    (Properties_data.value_display
       (Wire.Set [ Wire.String "a"; Wire.String "b" ]));
  eqs "value_display tagged" "x"
    (Properties_data.value_display
       (Wire.Tagged ("t", Wire.String "x")));
  eqs "value_display kw" "a/b"
    (Properties_data.value_display (Wire.kw "a/b"));
  check "value_empty_p nil" (Properties_data.value_empty_p Wire.Nil);
  check "value_empty_p blank"
    (Properties_data.value_empty_p (Wire.String "  "));
  check "value_empty_p seq"
    (Properties_data.value_empty_p (Wire.Array []));
  check "value_empty_p no"
    (not (Properties_data.value_empty_p (Wire.Int 0)))

let test_props_data4 () =
  (* positioned_rows unwraps value entities and builds display rows *)
  let blk =
    wmap
      [ ( "block.temp/positioned-properties"
        , wmap
            [ ( "logseq.property.ui-position/properties"
              , Wire.Array
                  [ wmap [ ("db/ident", Wire.kw "user.prop/x") ]
                  ; wmap [ ("db/ident", Wire.kw "user.prop/y") ] ] ) ] )
      ; ( "user.prop/x"
        , wmap
            [ ("db/id", Wire.Int 1)
            ; ("logseq.property/value", Wire.String "inner") ] )
      ; ("user.prop/y", Wire.Int 2) ]
  in
  let rows =
    Properties_data.positioned_rows blk
      "logseq.property.ui-position/properties"
  in
  eqi "positioned_rows count" 2 (List.length rows);
  check "positioned_rows value unwrap"
    (Wire.get (List.hd rows) "property-id"
     = Some (Wire.kw "user.prop/x")
    && Wire.get (List.hd rows) "value" = Some (Wire.String "inner")
    && Wire.get (List.nth rows 1) "value" = Some (Wire.Int 2));
  check "positioned_rows missing pos"
    (Properties_data.positioned_rows blk "nope" = []);
  check "positioned_rows no positioned"
    (Properties_data.positioned_rows (wmap []) "x" = []);
  (* split_display *)
  let rows_w, hid =
    Properties_data.split_display
      (wmap
         [ ("full-properties", Wire.Array [ Wire.Int 1 ])
         ; ("hidden-properties", Wire.List [ Wire.Int 2 ]) ])
  in
  check "split_display" (rows_w = [ Wire.Int 1 ] && hid = [ Wire.Int 2 ])

(* ---- Properties_value pure helpers ---- *)

let test_props_value () =
  check "parse_date" (Properties_value.parse_date "2026-09-27" = Some 20260927);
  check "parse_date bad" (Properties_value.parse_date "27/9" = None);
  check "parse_date pad" (Properties_value.parse_date "2026-9-27" = None);
  check "ms_of_value int" (Properties_value.ms_of_value (Wire.Int 5) = Some 5.);
  check "ms_of_value no" (Properties_value.ms_of_value (Wire.String "x") = None);
  (* journal-day map -> the day itself, no tz round-trip *)
  check "ymd_of_datetime_value journal-day"
    (Properties_value.ymd_of_datetime_value
       (wmap [ ("block/journal-day", Wire.Int 20260927) ])
    = Some (2026, 9, 27));
  check "ymd_of_datetime_value none"
    (Properties_value.ymd_of_datetime_value (wmap []) = None)

let test_props_value2 () =
  let mkchoice classes =
    wmap
      ([ ("db/id", Wire.Int 9) ]
       @ (match classes with
          | [] -> []
          | cs ->
              [ ( "logseq.property/choice-classes"
                , Wire.Array
                    (List.map
                       (fun id -> wmap [ ("db/id", Wire.Int id) ])
                       cs) ) ]))
  in
  (* unscoped choice is always visible (unless excluded) *)
  check "choice unscoped"
    (Properties_value.choice_visible (mkchoice []) [ 1; 2 ] []);
  check "choice scoped hit"
    (Properties_value.choice_visible (mkchoice [ 2 ]) [ 1; 2 ] []);
  check "choice scoped miss"
    (not (Properties_value.choice_visible (mkchoice [ 3 ]) [ 1; 2 ] []));
  check "choice excluded"
    (not (Properties_value.choice_visible (mkchoice []) [ 1; 2 ] [ 9 ]));
  (* closed value icon: icon entity id, else empty-placeholder dash *)
  let v =
    wmap
      [ ( "logseq.property/icon"
        , wmap [ ("id", Wire.String "icn") ] ) ]
  in
  eq "closed_value_icon_id" (Some "icn")
    (Properties_value.closed_value_icon_id v)
    (function
      | Some s -> s
      | None -> "none");
  eq "closed_value_icon_id placeholder" (Some "line-dashed")
    (Properties_value.closed_value_icon_id
       (wmap [ ("db/ident", Wire.kw "logseq.property/empty-placeholder") ]))
    (function
      | Some s -> s
      | None -> "none");
  check "closed_value_icon_id bare kw"
    (Properties_value.closed_value_icon_id
       (Wire.kw "logseq.property/empty-placeholder")
     = Some "line-dashed");
  check "closed_value_icon_id none"
    (Properties_value.closed_value_icon_id (wmap []) = None)

(* ---- Runtime.scan_gate — doc-scan coalescing (perf regression) ---- *)

let test_scan_gate () =
  let g = Runtime.scan_gate () in
  let iv = Runtime.scan_gate_interval in
  (* first structural generation always scans immediately *)
  Runtime.scan_gate_note_structural g;
  check "gate structural immediate"
    (Runtime.scan_gate_should g ~gen:1 ~now:0.);
  Runtime.scan_gate_mark g ~gen:1 ~now:0.;
  (* prop-only generations inside the interval coalesce *)
  check "gate prop same gen skipped"
    (not (Runtime.scan_gate_should g ~gen:1 ~now:iv));
  check "gate prop burst coalesced"
    (not (Runtime.scan_gate_should g ~gen:2 ~now:(iv -. 0.01)));
  check "gate prop burst still coalesced"
    (not (Runtime.scan_gate_should g ~gen:5 ~now:(iv -. 0.001)));
  (* past the interval the latest generation scans once *)
  check "gate prop after interval runs"
    (Runtime.scan_gate_should g ~gen:5 ~now:(iv +. 0.01));
  Runtime.scan_gate_mark g ~gen:5 ~now:(iv +. 0.01);
  (* structural flag forces a scan even inside the interval *)
  Runtime.scan_gate_note_structural g;
  check "gate structural inside interval"
    (Runtime.scan_gate_should g ~gen:6 ~now:(iv +. 0.02));
  Runtime.scan_gate_mark g ~gen:6 ~now:(iv +. 0.02);
  (* mark cleared the flag — next prop-only gen waits again *)
  check "gate flag cleared by mark"
    (not (Runtime.scan_gate_should g ~gen:7 ~now:(iv +. 0.03)));
  check "gate stale gen + old time"
    (Runtime.scan_gate_should g ~gen:7 ~now:1000.)

let () =
  Edit_model_test.run ();
  Edit_view_test.run ();
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
  test_model_indent ();
  test_model_outdent ();
  test_editor_wire_runs ();
  test_merge_source ();
  test_sdk_convert ();
  test_sdk_util ();
  test_views_builder ();
  test_views_wire ();
  test_views_db ();
  test_views_state ();
  test_views_query ();
  test_views_table ();
  test_popups_state ();
  test_editor_actions ();
  test_update2 ();
  test_decode_rtc ();
  test_properties_data ();
  test_sidebar_state ();
  test_settings_state ();
  test_cards_state ();
  test_graphs_ops ();
  test_boot ();
  test_update3 ();
  test_runtime_nav ();
  test_views_pinned ();
  test_edn3 ();
  test_block_parse3 ();
  test_title_refs3 ();
  test_selected_uuids ();
  test_update_sidebar2 ();
  test_decode7 ();
  test_edn3 ();
  test_sdk_convert ();
  test_sdk_convert2 ();
  test_sdk_util ();
  test_sdk_util2 ();
  test_sdk_util3 ();
  test_sdk_util4 ();
  test_sdk_write ();
  test_sdk_write2 ();
  test_sdk_write3 ();
  test_sdk_write4 ();
  test_views_wire ();
  test_views_wire2 ();
  test_views_wire3 ();
  test_views_wire4 ();
  test_views_state ();
  test_views_table ();
  test_views_table2 ();
  test_props_data ();
  test_props_data2 ();
  test_props_data3 ();
  test_props_data4 ();
  test_props_value ();
  test_props_value2 ();
  test_scan_gate ();
  (* Drive view tests run their worker-fed assertions on a promise tick;
     the summary + exit must wait for that stage *)
  Test_drive.run ~finish:(fun () ->
      Js.log
        (Printf.sprintf "%d checks, %d failures" !checks !failures);
      if !failures > 0 then exit 1)
