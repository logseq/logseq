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
  check "toast ids sequential"
    (List.map (fun (t : Model.toast) -> t.toast_id) m3.toasts = [ 0; 1 ]);
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

(* ---- Edn round-trip ---- *)

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

let () =
  test_move ();
  test_update ();
  test_decode ();
  test_decode2 ();
  test_wire ();
  test_edn ();
  Js.log
    (Printf.sprintf "%d checks, %d failures" !checks !failures);
  if !failures > 0 then exit 1
