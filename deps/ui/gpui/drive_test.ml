(* Drive-based view tests, native twin of test/test_drive.ml: mounts the
   real View.view / Update.apply app in-process (recording backend, no
   DOM, no real worker) and asserts on the node tree Drive sees --
   structure, classes, text, and event-dispatch effects. Browser globals
   come from the apple platform shims already linked into this target;
   worker calls go to Fake_worker. One shared session for the whole file:
   the feature state modules are first-mount singletons, so tests order
   their setup and clean up after themselves (close menus/dialogs,
   dismiss toasts).

   Worker-driven UI updates are async (Js.Promise microtasks): under the
   native Js shim a resolved promise settles its callbacks immediately,
   so the `async` stage still runs through `after` -- it just drains
   synchronously instead of on a node microtask. *)

open Test_check
module M = Drive.Model
module S = Drive.Session
module SM = Lui_protocol.String_map
module Wv = Lui_protocol
module W = Wire

(* document-level keydown, matching Stub_dom.keydown's payload shape *)
let keydown ?(meta = false) ?(ctrl = false) ?(shift = false) key =
  Platform.emit_event "keydown"
    (Js.Json.JObject
       [ ("key", Js.Json.JString key)
       ; ("metaKey", Js.Json.JBoolean meta)
       ; ("ctrlKey", Js.Json.JBoolean ctrl)
       ; ("shiftKey", Js.Json.JBoolean shift)
       ; ("altKey", Js.Json.JBoolean false)
       ])

let session_ref : (Model.t, Action.t) S.t option ref = ref None
let ms_ref : Model.t Signal.signal option ref = ref None

(* async work (promise resolutions, worker replies) flushes from inside
   mount-time then_ chains — mirror native_embed's checked flush so a
   failure is reported, not rethrown into a promise the harness can't see *)
let flush_app app =
  try ignore (Lui_app.flush app)
  with e ->
    Printf.eprintf "[flush] FAILED: %s\n%s\n%!" (Printexc.to_string e)
      (Printexc.get_backtrace ())

(* a session mounts auxiliary schedulers (the views session mounts its own
   Lui_app) — Signal.set only stages values until the owning scheduler
   stabilizes, so app_flush must reach it even while that session's own
   mount is still running *)
let extra_sched : Signal.scheduler option ref = ref None

let mount () =
  (* rtc-test mode: Virt_list mounts eagerly — the drive harness has no
     scroll/layout machinery, the web run gets the same effect from the
     stub DOM's zero viewport *)
  Platform.set_location_search "?rtc-test=true";
  let registry = Lui_extension.registry () in
  Logseq_dom.register registry;
  let view ctx ms send =
    ms_ref := Some ms;
    View.view ctx ms send
  in
  let s =
    S.mount ~registry ~profile:Logseq_dom.gpui_profile
      ~initial:Model.initial ~reducer:Update.apply ~view ()
  in
  Runtime.app_send :=
    (fun a ->
      let changed = Lui_app.send s.S.app a in
      flush_app s.S.app;
      changed);
  Runtime.app_flush :=
    (fun () ->
      flush_app s.S.app;
      (match !extra_sched with
       | Some sched -> ignore (Signal.stabilize sched)
       | None -> ());
      Editor_actions.focus_pending ());
  (* Platform.emit_event bubbles dom-events up the extension tree through
     this hook — the same wiring native_embed performs for the real host *)
  Platform.dom_parent_of :=
    (fun id ->
      Hashtbl.find_opt
        (Lui_app.runtime s.S.app).Lui_runtime.runtime_parents id);
  session_ref := Some s;
  s

let s () = Option.get !session_ref
let tree () = (s ()).S.tree

let sel str =
  match M.selector_of_string str with
  | Some x -> M.find (tree ()) x
  | None -> []

let first str = match sel str with n :: _ -> Some n | [] -> None
let has str = check ("exists: " ^ str) (first str <> None)
let absent str = check ("absent: " ^ str) (sel str = [])
let count str = List.length (sel str)
let at_least str n = check (">= " ^ string_of_int n ^ ": " ^ str) (count str >= n)

let cls_of (n : M.node) =
  Option.value (M.string_prop n "style-class") ~default:""

let has_tok n tok =
  List.mem tok
    (List.filter (fun s -> s <> "") (String.split_on_char ' ' (cls_of n)))

let check_tok name n tok = check name (has_tok n tok)

let attr_val (n : M.node) k =
  match M.string_prop n "attrs" with
  | None -> None
  | Some body ->
    let pat = "\"" ^ k ^ "\":\"" in
    let np = String.length pat in
    let nb = String.length body in
    let rec scan i =
      if i + np > nb then None
      else if String.sub body i np = pat then (
        let start = i + np in
        match String.index_from_opt body start '"' with
        | Some j -> Some (String.sub body start (j - start))
        | None -> None)
      else scan (i + 1)
    in
    scan 0

let str_opt = function Some s -> s | None -> "None"

let attr_eq name n k v =
  eq name (Some v) (attr_val n k) str_opt

(* selector-parsable attrs only match whole prop strings; for partial
   attr lookups walk the tree with a predicate *)
let find_where pred = List.filter pred (M.all_nodes (tree ()))

let find_attr k v =
  find_where (fun n -> attr_val n k = Some v)

let rec subtree_contains n pred =
  pred n
  || List.exists (fun c -> subtree_contains c pred)
       (M.children (tree ()) n.M.id)

(* dispatch a DOM event on a logseq-<tag> extension node *)
let dom_event ?payload (n : M.node) name =
  let fields = SM.add "name" (Wv.StringValue name) SM.empty in
  let fields =
    match payload with
    | Some p -> SM.add "payload" (Wv.StringValue p) fields
    | None -> fields
  in
  let ident =
    let k = n.M.kind in
    if String.length k > 10 && String.sub k 0 10 = "extension:"
    then String.sub k 10 (String.length k - 10)
    else k
  in
  S.extension_event (s ()) ~node:n.M.id ~identifier:ident ~name:"dom-event"
    ~fields

let click_node n =
  if String.length n.M.kind > 10 && String.sub n.M.kind 0 10 = "extension:"
  then dom_event n "click"
  else S.press (s ()) n.M.id

let click_sel str =
  match first str with
  | Some n -> click_node n
  | None -> check ("click target: " ^ str) false

(* Swift/GPUI host contract: a lazily-mounted container's onAppear fires
   the "lazy-mount" dom-event with its nodeId. The drive harness plays
   the host and mounts every pending lazy subtree eagerly — the web
   harness gets the same coverage from the stub IntersectionObserver
   firing immediately. *)
let rec settle_lazy depth =
  if depth < 16 then begin
    let pending =
      find_where (fun n -> attr_val n "data-lazy-mount" <> None)
    in
    if pending <> [] then begin
      List.iter
        (fun (n : M.node) ->
          Platform.emit_event "lazy-mount"
            (Js.Json.JObject [ ("nodeId", Js.Json.JNumber (Float.of_int n.M.id)) ]))
        pending;
      Runtime.flush ();
      settle_lazy (depth + 1)
    end
  end

let flush () =
  Runtime.flush ();
  settle_lazy 0

let send a =
  Runtime.send a;
  settle_lazy 0

(* bootstrap: graph + page with nested blocks *)
let load_test_page () =
  send (Action.Boot_graph_ready "logseq_db_test");
  send (Action.Navigate_to (Model.Page "p"));
  send
    (Action.Page_loaded
       (page
          [ block "b1" "First block"
          ; block "b2" "Parent block" ~children:[ block "b2c" "Child block" ]
          ]))

let find_block uuid =
  List.find_opt
    (fun n -> attr_val n "blockid" = Some uuid)
    (M.all_nodes (tree ()))

(* ---------------- shell + header ---------------- *)

let test_shell () =
  (* native chrome (apple/chrome.ml): the header is a host toolbar --
     tb-leading/tb-trailing with nav/home/search/dots/rs-toggle -- not
     the web's #head row; the left-menu button is a host-chrome
     affordance and does not exist in the app tree *)
  has "prop:accessibility-identifier=\"nav-back\"";
  has "prop:accessibility-identifier=\"nav-fwd\"";
  has "prop:accessibility-identifier=\"search-button\"";
  has "prop:accessibility-identifier=\"toolbar-dots-btn\"";
  has "prop:accessibility-identifier=\"rs-toggle\"";
  has "prop:accessibility-identifier=\"left-sidebar\"";
  has "prop:accessibility-identifier=\"right-sidebar\"";
  has "prop:accessibility-identifier=\"main-container\"";
  has "prop:accessibility-identifier=\"main-content-container\"";
  (match first "prop:accessibility-identifier=\"left-sidebar\"" with
   | Some n -> check "left sidebar starts closed" (not (has_tok n "is-open"))
   | None -> check "left sidebar node" false);
  has "text:\"Select a Graph\""

(* ---------------- event dispatch: header buttons ---------------- *)

let test_left_menu_dispatch () =
  (* the left-menu button is host chrome on native -- dispatch the same
     action the press handler sends *)
  send Action.Toggle_left_sidebar;
  flush ();
  (match first "prop:accessibility-identifier=\"left-sidebar\"" with
   | Some n -> check_tok "sidebar is-open after click" n "is-open"
   | None -> check "left sidebar node" false);
  (match first "prop:accessibility-identifier=\"main-container\"" with
   | Some n ->
       check_tok "main is-left-sidebar-open" n "is-left-sidebar-open"
   | None -> check "main container" false);
  (* persisted through the platform localStorage *)
  (match Platform.local_storage_get "ls-left-sidebar-open?" with
   | Some "true" -> check "sidebar-open persisted" true
   | v ->
       check ("sidebar-open persisted (got " ^ str_opt v ^ ")") false);
  send Action.Toggle_left_sidebar;
  flush ();
  (match first "prop:accessibility-identifier=\"left-sidebar\"" with
   | Some n ->
       check "sidebar closed after second click" (not (has_tok n "is-open"))
   | None -> check "left sidebar node" false)

(* ---------------- editor block tree ---------------- *)

let test_block_tree () =
  load_test_page ();
  (match find_block "b1", find_block "b2", find_block "b2c" with
   | Some b1, Some b2, Some b2c ->
       List.iter (fun n -> check_tok "ls-block class" n "ls-block")
         [ b1; b2; b2c ];
       attr_eq "block row id" b1 "id" "ls-block-b1";
       check "child row nested under parent"
         (subtree_contains b2 (fun n -> attr_val n "blockid" = Some "b2c"));
       check "b2c not at top level"
         (not
            (subtree_contains b1 (fun n -> attr_val n "blockid" = Some "b2c")));
       (* bullet affordance in each row *)
       List.iter
         (fun n ->
           check "bullet container"
             (subtree_contains n (fun c -> has_tok c "bullet-container")))
         [ b1; b2 ];
       ignore b2c
   | _ -> check "block rows present" false);
  (* block titles are rendered as text nodes *)
  has "text:\"First block\"";
  has "text:\"Parent block\"";
  has "text:\"Child block\""

(* editing state swaps content for the editor textarea *)
let test_block_edit () =
  Editor_state.set (fun st ->
      { st with
        Editor_state.editing =
          Some
            { Editor_state.uuid = "b1"; buffer = "editing b1"; scope = "main"
            ; base = "editing b1" }
      });
  has "prop:accessibility-identifier=\"edit-block-b1\"";
  (match find_block "b1" with
   | Some b1 ->
       check "editor inside row b1"
         (subtree_contains b1 (fun n ->
              attr_val n "data-testid" = Some "block editor"))
   | None -> check "row b1" false);
  Editor_state.set (fun st -> { st with Editor_state.editing = None });
  (match find_block "b1" with
   | Some b1 ->
       check "content restored"
         (subtree_contains b1 (fun n -> has_tok n "block-content-wrapper"))
   | None -> check "row b1" false)

(* ---------------- cmdk ---------------- *)

let cmdk_items () = find_attr "data-cmdk-item" "true"

let test_cmdk () =
  (* open through the real document keydown listener *)
  keydown ~meta:true "k";
  flush ();
  check "cmdk modal open"
    (find_where (fun n -> has_tok n "cp__cmdk__modal") <> []);
  check "cmdk search input"
    (find_where (fun n -> has_tok n "cp__cmdk-search-input") <> []);
  (* command items from the static command table arrive synchronously *)
  let items = cmdk_items () in
  check "cmdk has items" (items <> []);
  (* ArrowDown moves the highlight onto an item *)
  keydown "ArrowDown";
  flush ();
  let hl = find_attr "data-highlighted" "true" in
  check "cmdk highlight after ArrowDown" (hl <> []);
  keydown "Escape";
  flush ();
  check "cmdk closed on Escape"
    (find_where (fun n -> has_tok n "cp__cmdk__modal") = [])

(* ---------------- left sidebar (state-driven) ---------------- *)

let sidebar_st () = Sidebar_state.ensure (Option.get !ms_ref)

let sidebar_page ?(uuid = "uuid-x") title : Model.page =
  { (page []) with Model.page_title = title; page_uuid = Some uuid }

let sidebar_item key kind title : Sidebar_state.item =
  { Sidebar_state.key
  ; kind
  ; uuid = None
  ; title
  ; icon = None
  ; breadcrumb = []
  ; blocks = []
  ; linked_refs = []
  ; page_ref = Some title
  ; page = None
  ; props_collapsed = true
  ; collapsed = false
  }

let test_left_sidebar () =
  let st = sidebar_st () in
  Runtime.signal_set st.Sidebar_state.favorites
    [ sidebar_page ~uuid:"fav-u" "Fav Page" ];
  Runtime.signal_set st.Sidebar_state.recents
    [ sidebar_page ~uuid:"rec-u" "Recent Page" ];
  (* favorites + recents groups render li.favorite-item / li.recent-item
     rows carrying a .page-title span with the title text *)
  at_least "text:\"Fav Page\"" 1;
  at_least "text:\"Recent Page\"" 1;
  let fav_items = find_where (fun n -> has_tok n "favorite-item") in
  let rec_items = find_where (fun n -> has_tok n "recent-item") in
  check "favorite-item row" (fav_items <> []);
  check "recent-item row" (rec_items <> [])

(* ---------------- right sidebar ---------------- *)

let test_right_sidebar () =
  let st = sidebar_st () in
  Sidebar_state.push_item st (sidebar_item "pg-x" "page" "Right Page");
  send Action.Toggle_right_sidebar;
  let items =
    find_where (fun n ->
        has_tok n "sidebar-item" && has_tok n "item-type-page")
  in
  check "right sidebar page item" (items <> []);
  (match items with
   | n :: _ ->
       check "sidebar item header"
         (subtree_contains n (fun c -> has_tok c "sidebar-item-header"));
       check "sidebar item title text"
         (subtree_contains n (fun c ->
              match M.string_prop c "text" with
              | Some t -> t = "Right Page"
              | None -> false))
   | [] -> check "right sidebar item" false)

(* ---------------- context menu (popups layer) ---------------- *)

let test_context_menu () =
  (match !Popups_state.active with
   | Some t ->
       Popups_state.open_cm t ~x:10. ~y:10. ~block_id:"b1" ~multi:false;
       flush ();
       let menu =
         find_where (fun n -> has_tok n "ls-context-menu-content")
       in
       check "context menu open" (menu <> []);
       let items = find_where (fun n -> n.M.kind = "menu-item") in
       check "context menu items" (items <> []);
       Popups_state.close_cm t;
       flush ();
       check "context menu closed"
         (find_where (fun n -> has_tok n "ls-context-menu-content") = [])
   | None -> check "popups state mounted" false)

(* ---------------- dialogs ---------------- *)

let test_dialogs () =
  Dialogs_state.open_ "settings";
  flush ();
  (match find_where (fun n -> has_tok n "ui__dialog-content") with
   | dlg :: _ ->
       check "settings dialog content" true;
       (* settings dialogs carry no title — the parity marker is the
          main-content body *)
       check "dialog title"
         (subtree_contains dlg
            (fun n -> has_tok n "ui__dialog-main-content"))
   | [] -> check "settings dialog content" false);
  (* confirm layer: div[role=alertdialog] *)
  Dialogs_state.ask ~title:"Delete it?" ~desc:"no undo" ~on_confirm:(fun () ->
      Js.log "confirm-firing")
    ();
  flush ();
  check "confirm dialog"
    (find_where (fun n -> has_tok n "ui__alert-dialog-content") <> []);
  Dialogs_state.close_all ();
  flush ();
  check "dialogs closed"
    (find_where (fun n -> has_tok n "ui__dialog-content") = [])

(* ---------------- page menu / confirm / toasts / help ---------------- *)

let test_page_menu () =
  send (Action.Page_menu_set (Some (100., 50., true, None)));
  let menus =
    find_where (fun n -> has_tok n "ui__dropdown-menu-content")
  in
  check "page menu open" (menus <> []);
  has "text:\"Settings\"";
  send (Action.Page_menu_set None);
  check "page menu closed"
    (find_where (fun n -> has_tok n "ui__dropdown-menu-content") = [])

let test_confirm () =
  send
    (Action.Confirm_set
       (Some (Model.Confirm_delete_page ("puuid", "P Title", false))));
  check "alertdialog layer"
    (find_where (fun n -> has_tok n "ui__alert-dialog-content") <> []);
  has "text:\"Confirm\"";
  has "text:\"Cancel\"";
  send (Action.Confirm_set None);
  check "alertdialog closed"
    (find_where (fun n -> has_tok n "ui__alert-dialog-content") = [])

let test_toasts () =
  send
    (Action.Toast_push
       { Model.toast_id = 1; toast_text = "Saved"; toast_kind = "success"
       ; toast_key = None });
  (match find_where (fun n -> has_tok n "ui__toast") with
   | [] -> check "toast node" false
   | t :: _ ->
       check "toast text"
         (subtree_contains t (fun n ->
              match M.string_prop n "text" with
              | Some "Saved" -> true
              | _ -> false)));
  (* Toast_push allocates the id from toast_next, ignoring the pushed
     record's own toast_id -- the first toast is always id 0 *)
  send (Action.Toast_dismiss 0);
  check "toast dismissed"
    (find_where (fun n -> has_tok n "ui__toast") = [])

let test_help () =
  send Action.Help_toggle;
  check "help popup"
    (find_where (fun n -> has_tok n "cp__sidebar-help-menu-popup") <> []);
  send Action.Help_toggle;
  check "help popup closed"
    (find_where (fun n -> has_tok n "cp__sidebar-help-menu-popup") = [])

let test_appearance () =
  send (Action.Appearance_set (Some (10., 10.)));
  has "prop:accessibility-identifier=\"appearance_settings\"";
  send (Action.Appearance_set None);
  absent "prop:accessibility-identifier=\"appearance_settings\""

let test_not_found () =
  send (Action.Navigate_to (Model.Not_found "ghost"));
  has "text:\"ghost\"";
  (* restore the test page for any later assertions *)
  send (Action.Navigate_to (Model.Page "p"));
  send
    (Action.Page_loaded
       (page [ block "b1" "First block" ]))

(* ---------------- views table (stretch) ---------------- *)

(* Views render through the declarative LUI tree now -- mount a session
   whose root view is the views element itself and assert on the Drive
   tree once worker snapshots resolve. *)

let view_uuid = "11111111-2222-3333-4444-555555555555"
let row_uuid_1 = "aaaaaaaa-0000-0000-0000-000000000001"
let row_uuid_2 = "aaaaaaaa-0000-0000-0000-000000000002"

(* the views session is asserted in the async stage once snapshots
   and block pulls have resolved *)
let views_session : (Model.t, Action.t) S.t option ref = ref None

let test_views_table () =
  let registry = Lui_extension.registry () in
  Logseq_dom.register registry;
  let vs =
    S.mount ~registry ~profile:Logseq_dom.gpui_profile
      ~initial:Model.initial ~reducer:Update.update
      ~view:(fun ctx _ms _send ->
        (* the views element owns signals on this session's scheduler —
           register it before mount so promise-driven signal_set calls can
           stabilize it while the mount is still running *)
        extra_sched := Some ctx.Lui_ui.ui_scheduler;
        Logseq_dom.dom
          [ Views_view.view ~kind:Views_state.KAllPages
              ~owner:(W.String "$$$views") ])
      ()
  in
  views_session := Some vs;
  (* the views element owns signals on this session's scheduler, so flush
     it alongside the main app's *)
  let flush0 = !Runtime.app_flush in
  Runtime.app_flush := (fun () -> flush0 (); flush_app vs.S.app)

(* vendored-libs markup: katex shell (cljs latex.latex-inline/.latex +
   .opacity-0 holder), youtube-timestamp link, youtube embed iframe
   attrs, code block shell. The katex/hljs calls themselves happen at
   the DOM level via Render_libs' doc-scan and are not visible here. *)
let test_render_libs_dom () =
  send
    (Action.Page_loaded
       (page
          [ { (block "bm" "x^2") with
              Model.block_display_type = Some "math" }
          ; block "bi" "inline $x^2$ math"
          ; block "bt" "at {{youtube-timestamp 1:23}} mark"
          ; block "by" "{{youtube https://youtu.be/7xTGNNLPyMI?t=30}}"
          ; { (block "bc" "(+ 1 2)") with
              Model.block_display_type = Some "code"
            ; block_code_lang = Some "clojure" }
          ]));
  check "math-block shell"
    (find_where (fun n -> has_tok n "math-block") <> []);
  (match find_where (fun n -> has_tok n "latex") with
   | l :: _ ->
       check_tok "math latex initial" l "initial";
       check "math latex id"
         (match M.string_prop l "accessibility-identifier" with
          | Some i ->
              String.length i > 9 && String.sub i 0 9 = "ls-katex-"
          | None -> false);
       check "math opacity holder"
         (subtree_contains l (fun c -> has_tok c "opacity-0"))
   | [] -> check "math latex node" false);
  (match find_where (fun n -> has_tok n "latex-inline") with
   | l :: _ ->
       check_tok "inline latex initial" l "initial";
       check "inline opacity holder"
         (subtree_contains l (fun c -> has_tok c "opacity-0"))
   | [] -> check "inline latex node" false);
  (match find_where (fun n -> has_tok n "youtube-timestamp") with
   | a :: _ ->
       check "ts icon"
         (subtree_contains a (fun c -> has_tok c "youtube-timestamp-icon"));
       check "ts label"
         (subtree_contains a (fun c ->
              has_tok c "youtube-timestamp-label"
              && M.string_prop c "text" = Some "01:23"));
       check "ts clock svg"
         (subtree_contains a (fun c -> c.M.kind = "extension:logseq-svg"))
   | [] -> check "youtube-timestamp node" false);
  (match
     find_where (fun n -> attr_val n "id" = Some "youtube-player-7xTGNNLPyMI")
   with
   | f :: _ ->
       attr_eq "yt iframe src" f "src"
         "https://www.youtube.com/embed/7xTGNNLPyMI?enablejsapi=1&start=30";
       attr_eq "yt iframe allow-full-screen" f "allow-full-screen"
         "allowfullscreen";
       attr_eq "yt iframe referrer-policy" f "referrer-policy"
         "strict-origin-when-cross-origin"
   | [] -> check "youtube iframe node" false);
  (* display-mode code block = .extensions__code > .code-editor >
     textarea[data-lang] — CodeMirror mounts onto the textarea in the
     browser and generates .CodeMirror-line nodes, so the patch tree
     itself only carries the mount surface *)
  (match
     find_where
       (fun n ->
         n.M.kind = "extension:logseq-textarea"
         && attr_val n "data-lang" = Some "clojure")
   with
   | p :: _ -> check "code text" (M.string_prop p "text" = Some "(+ 1 2)")
   | [] -> check "code-editor textarea node" false)

(* ---------------- async stage: worker-fed views ---------------- *)

let uuid_s = "01234567-89ab-cdef-0123-456789abcdef"

let page_summary title : W.t =
  W.Map
    [ W.Keyword "block/title", W.String title
    ; W.Keyword "block/uuid", W.Uuid uuid_s
    ]

(* one view "All" over two rows; values mirror the shape
   snapshot_slot_value expects: slots -> [:resource k] -> {value} *)
let slot_value (rk : W.t) : W.t option =
  match rk with
  | W.Array (W.Keyword "views" :: _ :: _) ->
      Some (W.Array [ W.Uuid view_uuid ])
  | W.Array (W.Keyword "view-data" :: _ :: _) ->
      Some
        (W.Map
           [ W.Keyword "count", W.Int 2
           ; ( W.Keyword "rows"
             , W.Array [ W.Uuid row_uuid_1; W.Uuid row_uuid_2 ] )
           ; ( W.Keyword "properties"
             , W.List [ W.Keyword "block/title" ] )
           ])
  | _ -> None

let snapshot_response = function
  | Some req -> (
      match W.get req "resources" with
      | Some (W.Array rks) ->
          W.Map
            [ ( W.Keyword "slots"
              , W.Map
                  (List.filter_map
                     (fun rk ->
                       Option.map
                         (fun v ->
                           ( W.Array [ W.Keyword "resource"; rk ]
                           , W.Map [ W.Keyword "value", v ] ))
                         (slot_value rk))
                     rks) )
            ]
      | _ -> W.Map [])
  | _ -> W.Map []

let ent_for uuid : W.t =
  let kw s = W.Keyword s in
  if uuid = view_uuid then
    W.Map
      [ kw "block/uuid", W.Uuid uuid
      ; kw "db/id", W.Int 42
      ; kw "block/title", W.String "All"
      ; ( kw "logseq.property.view/type"
        , W.Map [ kw "db/ident", kw "logseq.property.view/type.table" ] )
      ]
  else
    W.Map
      [ kw "block/uuid", W.Uuid uuid
      ; kw "db/id", W.Int 7
      ; kw "block/title", W.String ("Row " ^ uuid)
      ]

let blocks_response = function
  | Some (W.Array reqs) ->
      W.List
        (List.map
           (fun req ->
             let u =
               match W.get req "id" with
               | Some (W.Uuid u) -> u
               | _ -> "?"
             in
             W.Map
               [ W.Keyword "block", ent_for u
               ; W.Keyword "children", W.Array []
               ])
           reqs)
  | _ -> W.List []

let worker_handler name args : W.t =
  match name with
  | "thread-api/get-favorite-pages" -> W.List [ page_summary "Fav Page" ]
  | "thread-api/get-recent-pages" -> W.List [ page_summary "Recent Page" ]
  | "thread-api/favorited-page?" -> W.Bool true
  | "thread-api/pull" -> (
      (* nav tag titles pull the class entities *)
      match List.nth_opt args 2 with
      | Some (W.Keyword cls) ->
          W.Map
            [ W.Keyword "block/title", W.String cls ]
      | _ -> W.Map [])
  | "thread-api/get-page-route-info" -> page_summary "Fav Page"
  | "thread-api/get-page-blocks-tree" -> W.List []
  | "thread-api/get-block-refs" -> W.List []
  | "thread-api/get-ent-tags" -> W.List []
  | "thread-api/get-contents-blocks" -> W.List []
  | "thread-api/pull-many" -> W.List []
  | "thread-api/get-blocks" -> blocks_response (List.nth_opt args 1)
  | "thread-api/get-all-properties" -> W.List []
  | "thread-api/get-render-snapshots" ->
      snapshot_response (List.nth_opt args 1)
  | _ -> W.Nil

let rec after n f =
  ignore
    (Js.Promise.(resolve () |> then_ (fun () ->
         if n <= 0 then (f (); Js.Promise.resolve ())
         else (after (n - 1) f; Js.Promise.resolve ()))))

let async_checks () =
  (* favorites/recents/contents land through fake-worker invocations *)
  check "worker fav item rendered"
    (find_where (fun n -> has_tok n "favorite-item") <> []);
  at_least "text:\"Fav Page\"" 1;
  let st = sidebar_st () in
  let items = Signal.get_state st.Sidebar_state.items in
  check "right sidebar items non-empty" (items <> []);
  (* views table: snapshots -> view ents -> view-data -> rows/props
     -> render *)
  match !views_session with
  | Some vs ->
      let nodes = M.all_nodes vs.S.tree in
      check "views .ls-table rendered"
        (List.exists (fun n -> has_tok n "ls-table") nodes);
      check "views header cells"
        (List.exists (fun n -> has_tok n "ls-table-header-cell") nodes);
      check "views rows"
        (List.exists (fun n -> has_tok n "ls-table-row") nodes);
      check "views cells"
        (List.exists (fun n -> has_tok n "ls-table-cell") nodes);
      check "views sticky-columns"
        (List.exists (fun n -> has_tok n "sticky-columns") nodes)
  | None -> ()

(* ---------------- outliner-op repaint granularity ----------------

   Every outliner op (collapse/indent/outdent/delete/move/title edit)
   reaches the UI as a delta spliced into the page model and republished
   via Journals_loaded / Page_loaded. These tests pin row-level repaint:
   a regression back to whole-day / whole-list remounts blows the patch-
   op budget (a day remount is hundreds of ops; a row repaint is a
   handful) and churns untouched rows' node ids. *)

let ops_now () = Drive.Model.((tree ()).ops_applied)

let block_row_ids uuids =
  List.map
    (fun u ->
      match find_block u with Some n -> Some n.M.id | None -> None)
    uuids

let show_ids ids =
  String.concat ","
    (List.map (function Some i -> string_of_int i | None -> "-") ids)

let journal_day ?(uuid = "jd1") blocks : Model.page =
  { (page blocks) with
    Model.page_uuid = Some uuid
  ; page_journal_day = Some 20261004
  ; page_title = "Oct 4th, 2026" }

let test_journal_splice_row_level () =
  (* eager journal items: the virt scroller needs real layout, absent
     in the drive harness *)
  Platform.set_location_search "?rtc-test=true";
  send (Action.Navigate_to Model.Home);
  let b1 = block "j1" "first" in
  let b2 = block "j2" "parent" ~children:[ block "j2c" "kid" ] in
  let b3 = block "j3" "third" in
  let b4 = block "j4" "fourth" in
  let b5 = block "j5" "fifth" in
  let b6 = block "j6" "sixth" in
  let b7 = block "j7" "seventh" in
  let b8 = block "j8" "eighth" in
  let day1 = [ b1; b2; b3; b4; b5; b6; b7; b8 ] in
  send (Action.Journals_loaded [ journal_day day1 ]);
  flush ();
  check "journal day rows mounted" (find_block "j8" <> None);
  let before =
    block_row_ids [ "j1"; "j2"; "j2c"; "j3"; "j4"; "j5"; "j6"; "j7"; "j8" ]
  in
  (* content splice — title/property edits repaint one row only *)
  let ops0 = ops_now () in
  send
    (Action.Journals_loaded
       [ journal_day
           (List.map
              (fun (b : Model.block) ->
                if b.block_uuid = Some "j3" then
                  { b with Model.block_title = "third EDITED" }
                else b)
              day1) ]);
  flush ();
  let content_ops = ops_now () - ops0 in
  check "journal content splice repaints row-level"
    (content_ops > 0 && content_ops < 40);
  eq "content splice keeps row node ids" before
    (block_row_ids [ "j1"; "j2"; "j2c"; "j3"; "j4"; "j5"; "j6"; "j7"; "j8" ])
    show_ids;
  has "text:third EDITED";
  (* structural splice — delete/indent-out drops a row; survivors keep
     their mounted rows *)
  let ops1 = ops_now () in
  send
    (Action.Journals_loaded
       [ journal_day (List.filter (fun (b : Model.block) ->
                b.block_uuid <> Some "j3") day1) ]);
  flush ();
  let remove_ops = ops_now () - ops1 in
  check "journal structural splice stays bounded"
    (remove_ops > 0 && remove_ops < 100);
  check "removed row unmounted" (find_block "j3" = None);
  eq "untouched rows survive structural splice"
    (block_row_ids [ "j1"; "j2"; "j2c"; "j4"; "j5"; "j6"; "j7"; "j8" ])
    (List.filteri (fun i _ -> i <> 3) before)
    show_ids;
  (* structural splice — insert a row mid-list (new-block/indent-in) —
     bounded well under a whole-day remount (~8 rows x ~60 ops) *)
  let ops2 = ops_now () in
  send
    (Action.Journals_loaded
       [ journal_day
           [ b1; block "j9" "inserted"; b2; b4; b5; b6; b7; b8 ] ]);
  flush ();
  let insert_ops = ops_now () - ops2 in
  check "journal row-insert splice stays bounded"
    (insert_ops > 0 && insert_ops < 150);
  check "inserted row mounted" (find_block "j9" <> None);
  eq "surrounding rows survive insert splice"
    (block_row_ids [ "j1"; "j2"; "j2c"; "j4"; "j5"; "j6"; "j7"; "j8" ])
    (List.filteri (fun i _ -> i <> 3) before)
    show_ids

let test_page_splice_row_level () =
  load_test_page ();
  flush ();
  check "page rows mounted" (find_block "b2c" <> None);
  let before = block_row_ids [ "b1"; "b2"; "b2c" ] in
  let ops0 = ops_now () in
  send
    (Action.Page_loaded
       (page
          [ block "b1" "First block"
          ; block "b2" "Parent EDITED"
              ~children:[ block "b2c" "Child block" ] ]));
  flush ();
  let content_ops = ops_now () - ops0 in
  check "page content splice repaints row-level"
    (content_ops > 0 && content_ops < 40);
  eq "page splice keeps row node ids" before
    (block_row_ids [ "b1"; "b2"; "b2c" ]) show_ids;
  has "text:Parent EDITED";
  let ops1 = ops_now () in
  send
    (Action.Page_loaded
       (page
          [ block "b1" "First block"
          ; block "b2" "Parent EDITED" ]));
  flush ();
  let remove_ops = ops_now () - ops1 in
  check "page child-removal splice stays bounded"
    (remove_ops > 0 && remove_ops < 100);
  check "removed child row unmounted" (find_block "b2c" = None);
  eq "untouched page rows survive removal splice"
    (block_row_ids [ "b1"; "b2" ]) [ List.hd before; List.nth before 1 ]
    show_ids

let test_journal_reorder_move_collapse () =
  (* move up/down republishes a swapped sibling order; indent/outdent is
     a cross-parent move; collapse toggles children mount through
     editor-state (no model change). All must stay far below a whole-day
     remount. *)
  send (Action.Navigate_to Model.Home);
  let r2c = block "r2c" "kid" in
  let b1 = block "r1" "one" in
  let b2 = block "r2" "two" ~children:[ r2c ] in
  let b3 = block "r3" "three" in
  let b4 = block "r4" "four" in
  send (Action.Journals_loaded [ journal_day [ b1; b2; b3; b4 ] ]);
  flush ();
  flush ();
  check "reorder day mounted" (find_block "r4" <> None);
  let before = block_row_ids [ "r1"; "r2"; "r2c"; "r3"; "r4" ] in
  let ops0 = ops_now () in
  send
    (Action.Journals_loaded [ journal_day [ b1; b3; b2; b4 ] ]);
  flush ();
  let reorder_ops = ops_now () - ops0 in
  check "journal reorder stays bounded"
    (reorder_ops > 0 && reorder_ops < 100);
  eq "reorder keeps every row's node id" before
    (block_row_ids [ "r1"; "r2"; "r2c"; "r3"; "r4" ]) show_ids;
  (* sibling DOM order: all_nodes is id-sorted, not visual — walk the
     row's parent children instead *)
  let sibling_order uuid =
    match find_block uuid with
    | Some { M.parent = Some pid; _ } ->
        List.filter_map
          (fun c -> attr_val c "blockid")
          (List.filter (fun c -> has_tok c "ls-block")
             (M.children (tree ()) pid))
    | _ -> []
  in
  (match sibling_order "r2" with
   | [ "r1"; "r3"; "r2"; "r4" ] -> check "reorder applied to mounted rows" true
   | got ->
       check
         ("sibling order r1,r3,r2,r4 (got " ^ String.concat "," got ^ ")")
         false);
  (* indent/outdent: r2's child moves under r3 — a cross-parent keyed
     move, remove from one list + insert into another *)
  let ops1 = ops_now () in
  let parents_before = block_row_ids [ "r2"; "r3" ] in
  let b2' = { b2 with Model.block_children = [] } in
  let b3' = { b3 with Model.block_children = [ r2c ] } in
  send
    (Action.Journals_loaded
       [ journal_day [ b1; b3'; b2'; b4 ] ]);
  flush ();
  let move_ops = ops_now () - ops1 in
  check "cross-parent move stays bounded" (move_ops > 0 && move_ops < 300);
  eq "parent rows survive cross-parent move" parents_before
    (block_row_ids [ "r2"; "r3" ]) show_ids;
  (match find_block "r3", find_block "r2c" with
   | Some r3, Some r2c ->
       check "moved child mounted under new parent"
         (subtree_contains r3 (fun n -> n.M.id = r2c.M.id))
   | _ -> check "moved child row mounted" false);
  (match find_block "r2", find_block "r2c" with
   | Some r2, Some r2c ->
       check "moved child gone from old parent"
         (not (subtree_contains r2 (fun n -> n.M.id = r2c.M.id)))
   | _ -> check "old parent row mounted" false);
  (* collapse: children unmount through the editor-state override while
     the published model is unchanged *)
  let ops2 = ops_now () in
  Editor_state.set_collapsed ~scope:"main" "r3" true;
  flush ();
  let collapse_ops = ops_now () - ops2 in
  check "collapse unmounts children" (find_block "r2c" = None);
  check "collapse stays bounded" (collapse_ops > 0 && collapse_ops < 100);
  Editor_state.set_collapsed ~scope:"main" "r3" false;
  flush ();
  check "expand remounts children" (find_block "r2c" <> None)

(* ---------------- runner ---------------- *)

let run ~finish =
  ignore (Fake_worker.install worker_handler);
  ignore (mount ());
  test_shell ();
  test_left_menu_dispatch ();
  test_block_tree ();
  test_block_edit ();
  test_cmdk ();
  test_left_sidebar ();
  test_right_sidebar ();
  test_context_menu ();
  test_dialogs ();
  test_page_menu ();
  test_confirm ();
  test_toasts ();
  test_help ();
  test_appearance ();
  test_not_found ();
  test_views_table ();
  test_render_libs_dom ();
  test_journal_splice_row_level ();
  test_page_splice_row_level ();
  test_journal_reorder_move_collapse ();
  (* worker-fed assertions must run after promise microtasks drain --
     the views chain is ~2 ticks per invoke: snapshots -> get-blocks ->
     snapshots(view-data) -> get-blocks -> get-all-properties -> render *)
  after 30 (fun () -> async_checks (); finish ())

let () =
  run ~finish:(fun () ->
      Js.log
        (Printf.sprintf "%d checks, %d failures" !checks !failures);
      if !failures > 0 then exit 1)
