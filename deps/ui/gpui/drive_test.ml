(* Drive-based view tests, native twin of test/test_drive.ml: mounts the
   real View.view / Update.apply app in-process (recording backend, no
   DOM, no real worker) and asserts on the node tree Drive sees --
   structure, classes, text, and event-dispatch effects. Browser globals
   come from the native platform shims already linked into this target;
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

(* sdk/editor helpers read (Runtime.model ()) — stage it the same way
   test_drive.ml does under Melange: a decoupled stub the scenario code
   can update without touching the live mounted model *)
let drive_model = ref Model.initial

(* the test-side edit-view mounts use the same native registry set as
   the app mount (no stub DOM on this runtime) *)
let native_env : Edit_view_test.env =
  { install = (fun () -> ())
  ; utf16 = false
  ; register_extensions =
      (fun registry ->
        Logseq_el.register_all registry;
        Logseq_editor.register registry;
        Logseq_codemirror.register registry)
  }

let mount () =
  (* rtc-test mode: Virt_list mounts eagerly — the drive harness has no
     scroll/layout machinery, the web run gets the same effect from the
     stub DOM's zero viewport *)
  Platform.set_location_search "?rtc-test=true";
  let registry = Lui_extension.registry () in
  Logseq_el.register_all registry;
  Logseq_editor.register registry;
  Logseq_codemirror.register registry;
  let view ctx ms send =
    ms_ref := Some ms;
    View.view ctx ms send
  in
  let s =
    S.mount ~registry ~profile:Logseq_el.gpui_profile
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
  Runtime.read_model := (fun () -> !drive_model);
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

let json_attr body k =
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

(* two attr channels land in the recorded tree: logseq-* dom nodes
   serialize their attributes as a JSON-ish "attrs" prop, while typed
   ~data_attrs emit the wire "data-attrs" prop (\x1e/\x1f records) *)
let attr_val (n : M.node) k =
  (* accessibility-identifier is the typed-kinds' id channel — attr_val
     "id" reads it so assertions keep their old name *)
  if k = "id" then
    match M.string_prop n "accessibility-identifier" with
    | Some _ as v -> v
    | None -> (
        match M.string_prop n "attrs" with
        | None -> None
        | Some body -> json_attr body k)
  else
    match M.string_prop n "data-attrs" with
    | Some body -> (
        match
          List.assoc_opt k (Lui_protocol.data_attrs_decode body)
        with
        | Some v -> Some v
        | None -> (
            match M.string_prop n "attrs" with
            | None -> None
            | Some body -> json_attr body k))
    | None -> (
        match M.string_prop n "attrs" with
        | None -> None
        | Some body -> json_attr body k)

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

(* Native host contract: a lazily-mounted container's onAppear fires
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
  (* drain the Ui_task mailbox before the render flush, like
     native_embed's pump *)
  Host.drain ();
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
    (fun n -> attr_val n "data-blockid" = Some uuid)
    (M.all_nodes (tree ()))

let node_of_id id =
  match M.find (tree ()) (M.Id id) with
  | n :: _ -> Some n
  | [] -> None

let shared_host () : (Model.t, Action.t) Shared_scenarios.host =
  { session = s
  ; check
  ; keydown = (fun ~meta key -> keydown ~meta key)
  ; toggle_sidebar = (fun () -> send Action.Toggle_left_sidebar)
  ; storage_get = Ui_services.storage_get
  ; open_settings = (fun () -> Dialogs_state.open_ "settings")
  ; close_settings = Dialogs_state.close_all
  ; wide_mode_label = I18n.wide_mode
  ; theme_label = (function "dark" -> I18n.theme_dark | "light" -> I18n.theme_light | "system" -> I18n.theme_system | _ -> invalid_arg "Unknown theme")
  ; theme_snapshot = (fun () ->
      { Shared_scenarios.root_dark = Hashtbl.mem Platform.root_classes "dark"
      ; body_dark = Hashtbl.mem Platform.body_classes "dark-theme"
      ; body_light = Hashtbl.mem Platform.body_classes "light-theme"
      ; body_white = Hashtbl.mem Platform.body_classes "white-theme"
      })
  ; prefers_dark = Host.prefers_dark
  ; route_get = Platform.location_hash
  ; route_set = Platform.set_location_hash
  ; route_on_change = Platform.on_hash_change
  ; route_tick = (fun () -> ())
  ; flush
  }

let sidebar_push_item key title : Sidebar_state.item =
  { Sidebar_state.key
  ; kind = "page"
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

let sidebar_host () : (Model.t, Action.t) Shared_scenarios_sidebar.host =
  { base = shared_host ()
  ; storage_set = Ui_services.storage_set
  ; toggle_right_sidebar = (fun () -> send Action.Toggle_right_sidebar)
  ; push_right_item =
      (fun key title ->
        match Sidebar_state.current () with
        | Some st -> Sidebar_state.push_item st (sidebar_push_item key title)
        | None -> check "sidebar state mounted" false)
  ; toggle_nav =
      (fun nav checked ->
        match Sidebar_state.current () with
        | Some st -> Sidebar_state.toggle_nav st nav checked
        | None -> check "sidebar state mounted" false)
  ; set_theme = (fun m -> Settings_view.use_mode m)
  ; set_language = (fun m -> Settings_view.set_language m)
  }

let test_shared_sidebar () =
  Shared_scenarios_sidebar.all (sidebar_host ())

(* ---------------- shell + header ---------------- *)

let test_shell () =
  (* web-parity header (a1faf4c9): left-menu + search on the left,
     rtc/home/dots/rs-toggle on the right; no back/fwd nav buttons *)
  has "prop:accessibility-identifier=\"left-menu\"";
  has "prop:accessibility-identifier=\"home-btn\"";
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

let test_left_menu_dispatch () = Shared_scenarios.sidebar (shared_host ())

(* ---------------- editor block tree ---------------- *)

let test_block_tree () =
  load_test_page ();
  (match find_block "b1", find_block "b2", find_block "b2c" with
   | Some b1, Some b2, Some b2c ->
       List.iter (fun n -> check_tok "ls-block class" n "ls-block")
         [ b1; b2; b2c ];
       attr_eq "block row id" b1 "id" "ls-block-b1";
       check "child row nested under parent"
         (subtree_contains b2 (fun n -> attr_val n "data-blockid" = Some "b2c"));
       check "b2c not at top level"
         (not
            (subtree_contains b1 (fun n -> attr_val n "data-blockid" = Some "b2c")));
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
          (Some
             (Editor_state.mk_editing ~uuid:"b1" ~buffer:"editing b1"
                ~scope:"main" ~base:"editing b1" ()))
      });
  has "prop:accessibility-identifier=\"edit-block-b1\"";
  (match find_block "b1" with
   | Some b1 ->
       (* native editor surface: the e2e hooks ride the logseq-editor
          extension node as props (no interior textarea on native) *)
       check "editor inside row b1"
         (subtree_contains b1 (fun n ->
              n.M.kind = "extension:logseq-editor"
              && M.string_prop n "data-testid" = Some "block editor"))
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
  Shared_scenarios.palette (shared_host ());
  Shared_scenarios_cmdk.run (shared_host ())

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
       Popups_state.open_cm t ~ax:10. ~atop:10. ~abot:10. ~block_id:"b1" ~multi:false;
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
  Shared_scenarios.settings (shared_host ());
  Shared_scenarios.themes (shared_host ());
  Shared_scenarios.routes (shared_host ());
  test_shared_sidebar ();
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
  send (Action.Page_menu_set (Some (100., 40., 50., true, None)));
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
  Logseq_el.register_all registry;
  Logseq_editor.register registry;
  Logseq_codemirror.register registry;
  let vs =
    S.mount ~registry ~profile:Logseq_el.gpui_profile
      ~initial:Model.initial ~reducer:Update.update
      ~view:(fun ctx _ms _send ->
        (* the views element owns signals on this session's scheduler —
           register it before mount so promise-driven signal_set calls can
           stabilize it while the mount is still running *)
        extra_sched := Some ctx.Lui_ui.ui_scheduler;
        Logseq_el.el
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
          ; block "bl" "see [Devin](https://devin.ai) now"
          ; { (block "bc" "(+ 1 2)") with
              Model.block_display_type = Some "code"
            ; block_code_lang = Some "clojure" }
          ; block "bv" "{{vimeo 76979871}}"
          ; block "bb" "{{bilibili BV1xK4y1p7F8}}"
          ; block "bo" "{{loom e5b8c04bca094dd8a56e76b64085464f}}"
          ; block "btw" "{{tweet https://twitter.com/logseq/status/1593969270893658112}}"
          ; block "bw"
              "{{video https://www.youtube.com/watch?v=dQw4w9WgXcQ, w=300}}"
          ; block "bh" "[:iframe {:src \"https://example.com/frame\"}]"
          ; block "bu" "{{not-a-real-macro x}}"
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
       (* web materializes the clock glyph through the logseq-svg
          adapter; native emits the same icon as a typed icon node *)
       check "ts clock svg"
         (subtree_contains a (fun c ->
              c.M.kind = "icon"
              || c.M.kind = "extension:logseq-svg"))
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
  (* display-mode code block: web mounts CodeMirror onto an interior
     textarea inside logseq-textarea; native emits the same surface as
     the logseq-codemirror extension with lang/value props *)
  (match
     find_where
       (fun n ->
         (n.M.kind = "extension:logseq-codemirror"
          && M.string_prop n "lang" = Some "clojure")
         || (n.M.kind = "extension:logseq-textarea"
             && attr_val n "data-lang" = Some "clojure"))
   with
   | p :: _ ->
       check "code text"
         (M.string_prop p "value" = Some "(+ 1 2)"
          || M.string_prop p "text" = Some "(+ 1 2)")
   | [] -> check "code-editor textarea node" false);
  (* markdown external link: the anchor keeps its label children and
     url/target props (electron-vs-gpui audit: the label used to drop
     entirely on gpui) *)
  (match find_where (fun n -> has_tok n "external-link") with
   | a :: _ ->
       check "ext link label"
         (subtree_contains a (fun c ->
              M.string_prop c "text" = Some "Devin"));
       check "ext link url"
         (M.string_prop a "url" = Some "https://devin.ai");
       check "ext link target"
         (M.string_prop a "target" = Some "_blank")
   | [] -> check "external-link node" false)

(* embed/macro parity with the cljs renderer — provider-mapped iframe
   srcs, .video-embed-shell geometry + w=N width, tweet id extraction,
   hiccup iframes, unknown-macro warning *)
let test_embed_parity () =
  let iframe_src s =
    find_where (fun n -> attr_val n "src" = Some s) <> []
  in
  check "vimeo iframe src"
    (iframe_src "https://player.vimeo.com/video/76979871");
  check "bilibili iframe src"
    (iframe_src
       "https://player.bilibili.com/player.html?bvid=BV1xK4y1p7F8&high_quality=1&autoplay=0");
  check "loom iframe src"
    (iframe_src
       "https://www.loom.com/embed/e5b8c04bca094dd8a56e76b64085464f");
  (match find_where (fun n -> has_tok n "tweet-embed") with
   | n :: _ ->
       attr_eq "tweet src" n "src"
         "https://platform.twitter.com/embed/Tweet.html?id=1593969270893658112"
   | [] -> check "tweet iframe" false);
  (match
     find_where
       (fun n -> attr_val n "id" = Some "youtube-player-dQw4w9WgXcQ")
   with
   | f :: _ ->
       attr_eq "video iframe src" f "src"
         "https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1"
   | [] -> check "video iframe node" false);
  check "w=300 frame style"
    (find_where (fun n ->
         has_tok n "video-embed-frame"
         && attr_val n "style" = Some "width:300px;aspect-ratio:16 / 9")
     <> []);
  check "has-video-embed wrap"
    (find_where (fun n -> has_tok n "has-video-embed") <> []);
  check "hiccup iframe src" (iframe_src "https://example.com/frame");
  (match
     find_where
       (fun n -> attr_val n "data-macro-name" = Some "not-a-real-macro")
   with
   | n :: _ ->
       check "unknown macro warning"
         (subtree_contains n (fun c -> has_tok c "warning"))
   | [] -> check "unknown macro node" false)

(* the :macros page is loaded last so async_checks (after the worker
   microtasks drain) can assert the expanded content *)
let test_custom_macro_page () =
  send (Action.Navigate_to (Model.Page "p"));
  send
    (Action.Page_loaded
       (page [ block "cm" "res {{cm-hi ab}} done" ]))

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

(* ---------- properties scenario wiring ----------

   Shared_scenarios_props drives the real properties modules through a
   host record: mounted cell sessions render Properties_value.view
   directly, writes land on the recorded apply-outliner-ops payloads, and
   every worker invoke is logged with its repo arg so the stale-response
   scenario can assert which graph the request bound to. *)

let props_ops_log : W.t list ref = ref []
let props_invoke_log : string list ref = ref []
let props_resolved : (string * W.t) list ref = ref []
let props_repo = ref ""
let props_repo_hooked = ref false

let rec props_after n f =
  ignore
    (Js.Promise.(resolve () |> then_ (fun () ->
         if n <= 0 then (f (); Js.Promise.resolve ())
         else (props_after (n - 1) f; Js.Promise.resolve ()))))

let props_w_str (w : W.t) : string =
  match w with
  | W.Uuid s | W.String s | W.Keyword s | W.Symbol s -> s
  | W.Int i -> string_of_int i
  | W.Int64 i -> Int64.to_string i
  | W.Float f -> Printf.sprintf "%g" f
  | W.Bool b -> string_of_bool b
  | W.Nil -> "nil"
  | _ -> "?"

let props_op_str (op : W.t) : string =
  match W.elems op with
  | [ W.Keyword name; W.Array args ] ->
      name ^ "|" ^ String.concat "|" (List.map props_w_str args)
  | _ -> "op?"

let props_mount_cell ~block_uuid ~row =
  let s_ref = ref None in
  let ctx : Properties_value.ctx =
    { block_uuid
    ; block_id = None
    ; refresh =
        (fun () ->
          match !s_ref with Some s -> S.poll s | None -> ())
    ; is_page = false
    ; class_schema = false
    }
  in
  let s =
    S.mount ~profile:Logseq_el.gpui_profile ~initial:Model.initial
      ~reducer:Update.apply
      ~view:(fun _ctx _ms _send -> Properties_value.view ctx row)
      ()
  in
  s_ref := Some s;
  s

let props_host () : (Model.t, Action.t) Shared_scenarios_props.host =
  if not !props_repo_hooked then (
    props_repo_hooked := true;
    let base = !Runtime.read_model in
    Runtime.read_model :=
      (fun () ->
        match !props_repo with
        | "" -> base ()
        | r -> { (base ()) with Model.repo = Some r }));
  { Shared_scenarios_props.session = s ()
  ; check
  ; mount_cell = props_mount_cell
  ; commit_date =
      (fun ~ident ~is_datetime ~text ->
        Properties_value.commit_date_text
          { Properties_value.block_uuid = "b1"
          ; block_id = None
          ; refresh = (fun () -> ())
          ; is_page = false
          ; class_schema = false
          }
          ident ~is_datetime text)
  ; ops_log = (fun () -> List.map props_op_str !props_ops_log)
  ; invoke_log = (fun () -> List.rev !props_invoke_log)
  ; clear_logs =
      (fun () -> props_ops_log := []; props_invoke_log := [])
  ; after = props_after
  ; set_repo = (fun r -> props_repo := r)
  ; request_block_data =
      (fun ~uuid ->
        ignore
          (Js.Promise.then_
             (fun w ->
               props_resolved := (uuid, w) :: !props_resolved;
               Js.Promise.resolve ())
             (Properties_data.block_render_data uuid)))
  ; flush_pending = Properties_data.flush_render_data
  ; positioned_rows = Properties_data.positioned_rows
  ; split_display = Properties_data.split_display
  ; filter_items =
      (fun items filter ->
        List.map
          (fun (it : Properties_select.item) -> it.it_title)
          (Properties_select.visible_items
             ~items:
               (List.map
                  (fun (_id, t) -> Properties_select.item t (fun () -> ()))
                  items)
             ~filter ~searched:None ~new_option:None))
  }

let worker_handler name args : W.t =
  props_invoke_log :=
    (name ^ "@"
    ^ (match List.nth_opt args 0 with
       | Some (W.String r) -> r
       | _ -> "?"))
    :: !props_invoke_log;
  match name with
  | "thread-api/apply-outliner-ops" -> (
      (match List.nth_opt args 1 with
       | Some (W.Array ops) ->
           props_ops_log := !props_ops_log @ ops
       | _ -> ());
      W.Map [ W.Keyword "result", W.Nil ])
  | "thread-api/get-journal-page-by-day" ->
      W.Map
        [ W.Keyword "db/id", W.Int 66
        ; W.Keyword "block/title", W.String "Oct 8th, 2026" ]
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
  | "thread-api/get-file-content" ->
      (* graph config: one user macro for the custom-macro render path *)
      W.String "{:macros {\"cm-hi\" \"[[pre $1 post]]\"}}"
  | "thread-api/list-db" ->
      (* model_stub has no repo set — the macro config falls back to
         resolving the graph name through list-db *)
      W.Array
        [ W.Map [ W.Keyword "name", W.String "logseq_db_test" ] ]
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

let test_clipboard_paste () =
  let read_model = !Runtime.read_model in
  Runtime.read_model := (fun () -> Lui_app.model (s ()).S.app);
  let saved_title = ref None in
  ignore (Fake_worker.install (fun name args ->
    if name = "thread-api/apply-outliner-ops" then begin
      (match List.nth_opt args 1 with
       | Some (W.Array ops) ->
           List.iter (function
             | W.Array [W.Keyword "save-block"; W.Array [block; _]] ->
                 check "clipboard saves the editing block"
                   (W.get block "block/uuid" = Some (W.Uuid "b1"));
                 saved_title := W.map_get_string block "block/title"
             | _ -> failwith "Expected a clipboard save operation") ops
       | _ -> failwith "Expected clipboard save operations");
      W.Nil
    end else worker_handler name args));
  let scenario label ~meta ~ctrl ~lo ~hi replies expected caret =
    Outliner_ops.cancel_pending_save ();
    saved_title := None;
    let source = "left old right" in
    let editing = Editor_state.mk_editing ~uuid:"b1" ~buffer:source
      ~scope:"main" ~base:source () in
    let model = Edit_model.select editing.model ~anchor:lo ~focus:hi in
    Editor_state.set (fun st ->
      { st with Editor_state.editing = Some (Editor_state.with_model editing model) });
    List.iter (fun _ ->
      Editor_keys.apply_input "b1"
        (Edit_input.Key (Edit_model.key_ev ~meta ~ctrl ~shift:true "v", false))) replies;
    List.iter (fun text ->
      let host_reply = Thread.create Platform.note_clipboard_text text in
      Thread.join host_reply) replies;
    eqs (label ^ ": host replies do not edit outside the application entry")
      source (Editor_actions.live_buffer "b1");
    check (label ^ ": save waits for the application entry")
      (!(Outliner_ops.pending_save) = None);
    Host.drain ();
    flush ();
    eqs (label ^ ": clipboard text reaches the editing model")
      expected (Editor_actions.live_buffer "b1");
    check (label ^ ": selection collapses after the inserted text")
      (Editor_actions.sel_span "b1" = (caret, caret));
    check (label ^ ": rendered editor receives the caret")
      (List.exists (fun n ->
        n.M.kind = "extension:logseq-editor"
        && M.string_prop n "block-id" = Some "b1"
        && Hashtbl.find_opt n.M.props "caret" = Some (Wv.IntValue caret))
        (M.all_nodes (tree ())));
    check (label ^ ": clipboard edit schedules its save")
      (!(Outliner_ops.pending_save) = Some ("b1", expected));
    ignore (Outliner_ops.flush_pending_save ());
    check (label ^ ": worker receives the edited title")
      (!saved_title = Some expected)
  in
  scenario "Cmd+Shift+V Unicode replacement" ~meta:true ~ctrl:false
    ~lo:5 ~hi:8 ["snow 雪😀\nline"] "left snow 雪😀\nline right"
    (5 + String.length "snow 雪😀\nline");
  scenario "Ctrl+Shift+V empty replacement" ~meta:false ~ctrl:true
    ~lo:5 ~hi:8 [""] "left  right" 5;
  scenario "successive clipboard replies" ~meta:true ~ctrl:false
    ~lo:5 ~hi:5 ["A"; "B"] "left ABold right" 7;
  Outliner_ops.cancel_pending_save ();
  Editor_state.set (fun st -> { st with Editor_state.editing = None });
  Runtime.read_model := read_model;
  ignore (Fake_worker.install worker_handler)

let rec after n f =
  ignore
    (Js.Promise.(resolve () |> then_ (fun () ->
         (* Ui_task completions post to the host mailbox like the real
            pump — drain it between async steps *)
         Host.drain ();
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
  (match !views_session with
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
  | None -> ());
  (* :macros {"cm-hi" "[[pre $1 post]]"} — expanded content renders
     through the inline renderer once the config promise resolves;
     the [[pre ab post]] page-ref link carries data-ref on its anchor *)
  check "custom macro expanded"
    (find_where (fun n -> attr_val n "data-ref" = Some "pre ab post")
     <> []);
  check "custom macro wrapper"
    (find_where
       (fun n -> attr_val n "data-macro-name" = Some "cm-hi")
     <> [])

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
    (* on native each keyed row sits inside a lazy-mount wrapper, so a
       slot child may not itself carry ls-block — resolve each slot
       child to its first ls-block descendant, keeping slot order *)
    let rec first_block n =
      if has_tok n "ls-block" then Some n
      else
        let rec find_in = function
          | [] -> None
          | c :: rest -> (
              match first_block c with
              | Some _ as r -> r
              | None -> find_in rest)
        in
        find_in (M.children (tree ()) n.M.id)
    in
    match find_block uuid with
    | Some row ->
        (* the slot is the nearest ancestor whose children resolve to
           more than one block row: web rows are direct children, on
           native each sits inside a lazy-mount wrapper one level up *)
        let rec slot_of pid =
          let rows =
            List.filter_map first_block (M.children (tree ()) pid)
          in
          if List.length rows >= 2 then Some pid
          else
            match node_of_id pid with
            | Some { M.parent = Some p; _ } -> slot_of p
            | _ -> None
        in
        (match row.M.parent with
         | Some pid -> (
             match slot_of pid with
             | Some sid ->
                 List.filter_map
                   (fun c ->
                     match first_block c with
                     | Some r -> attr_val r "data-blockid"
                     | None -> None)
                   (M.children (tree ()) sid)
             | None -> [])
         | None -> [])
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

(* ---------------- shared views scenarios ----------------

   Scripted worker mirroring test/views_drive.ml: the [:views] -> view
   ents -> [:view-data] -> rows -> get-blocks -> get-all-properties
   chain answers from mutable scenario state so Shared_scenarios_views
   can change data and hold/release responses mid-flight. *)

let vws_requests : string list ref = ref []
let vws_resources : string list ref = ref []
let vws_views : (string * string * string) list ref = ref []
let vws_flags : (string, string list) Hashtbl.t = Hashtbl.create 8
let vws_rows : (string, (string * string) list) Hashtbl.t =
  Hashtbl.create 8
let vws_titles : (string, string) Hashtbl.t = Hashtbl.create 64
let vws_qsrc : (string, string) Hashtbl.t = Hashtbl.create 8
let vws_qrows : (string, string list) Hashtbl.t = Hashtbl.create 8
let vws_qerr : (string, string) Hashtbl.t = Hashtbl.create 8
let vws_held : string list ref = ref []
let vws_parked : (string * W.t * (W.t -> unit)) list ref = ref []

let vws_flag uuid name =
  match Hashtbl.find_opt vws_flags uuid with
  | Some fs -> List.mem name fs
  | None -> false

let vws_query_block_ent uuid : W.t =
  let kw s = W.Keyword s in
  let vbu = uuid ^ "-v" in
  W.Map
    [ kw "block/uuid", W.Uuid uuid
    ; kw "db/id", W.Int 90
    ; kw "block/title", W.String ""
    ; kw "logseq.property/query", W.Map [ kw "block/uuid", W.Uuid vbu ]
    ; ( kw "block/children"
      , W.Array
          [ W.Map
              [ kw "block/uuid", W.Uuid vbu
              ; kw "block/title"
              , W.String
                  (Option.value (Hashtbl.find_opt vws_qsrc uuid)
                     ~default:"") ] ] ) ]

let vws_view_ent uuid title ty : W.t =
  let kw s = W.Keyword s in
  let extra =
    (if vws_flag uuid "sort" then
       [ ( kw "logseq.property.table/sorting"
         , W.Array
             [ W.Map [ kw "id", kw "block/title"; kw "asc?", W.Bool true ] ] )
       ]
     else [])
    @
    if vws_flag uuid "filters" then
      [ ( kw "logseq.property.table/filters"
        , W.Map
            [ kw "or?", W.Bool false
            ; ( kw "filters"
              , W.Array
                  [ W.Array [ kw "user.property/p1"; kw "is"; W.String "x" ]
                  ] ) ] ) ]
    else []
  in
  W.Map
    ([ kw "block/uuid", W.Uuid uuid
     ; kw "db/id", W.Int 42
     ; kw "block/title", W.String title
     ; kw "logseq.property.view/type", W.Map [ kw "db/ident", kw ty ] ]
    @ extra)

let vws_ent_for uuid : W.t =
  let kw s = W.Keyword s in
  match List.find_opt (fun (u, _, _) -> u = uuid) !vws_views with
  | Some (u, t, ty) -> vws_view_ent u t ty
  | None ->
      if Hashtbl.mem vws_qsrc uuid || Hashtbl.mem vws_qerr uuid then
        vws_query_block_ent uuid
      else
        W.Map
          [ kw "block/uuid", W.Uuid uuid
          ; kw "db/id", W.Int 7
          ; kw "block/title"
          , W.String
              (Option.value (Hashtbl.find_opt vws_titles uuid)
                 ~default:("Row " ^ uuid)) ]

let vws_blocks_response = function
  | Some (W.Array reqs) ->
      let kw s = W.Keyword s in
      W.List
        (List.map
           (fun req ->
             let u =
               match W.get req "id" with
               | Some (W.Uuid u) | Some (W.String u) -> u
               | _ -> "?"
             in
             W.Map
               [ kw "block", vws_ent_for u; kw "children", W.Array [] ])
           reqs)
  | _ -> W.List []

let vws_view_data uuid : W.t =
  let kw s = W.Keyword s in
  let rows =
    match Hashtbl.find_opt vws_rows uuid with
    | Some rs -> List.map fst rs
    | None -> []
  in
  W.Map
    [ kw "count", W.Int (List.length rows)
    ; kw "rows", W.Array (List.map (fun u -> W.Uuid u) rows)
    ; kw "properties", W.List [ kw "block/title" ] ]

let vws_query_value spec : W.t =
  let kw s = W.Keyword s in
  let qb =
    match W.get spec "current-block-uuid" with
    | Some (W.Uuid u) -> u
    | _ -> ""
  in
  match Hashtbl.find_opt vws_qerr qb with
  | Some msg ->
      W.Map
        [ kw "error", W.Map [ kw "message", W.String msg ] ]
  | None ->
      W.Map
        [ ( kw "rows"
          , W.Array
              (List.map (fun u -> W.Uuid u)
                 (Option.value (Hashtbl.find_opt vws_qrows qb)
                    ~default:[]))) ]

let vws_slot_value (rk : W.t) : W.t option =
  match rk with
  | W.Array (W.Keyword "views" :: _ :: _) ->
      Some
        (W.Array (List.map (fun (u, _, _) -> W.Uuid u) !vws_views))
  | W.Array (W.Keyword "view-data" :: W.Uuid vu :: _) ->
      Some (vws_view_data vu)
  | W.Array (W.Keyword "query" :: spec :: _) -> Some (vws_query_value spec)
  | _ -> None

let rec vws_wire_str (w : W.t) : string =
  match w with
  | W.Keyword s -> ":" ^ s
  | W.String s -> s
  | W.Uuid u -> u
  | W.Int i -> string_of_int i
  | W.Array xs | W.List xs | W.Set xs ->
      "[" ^ String.concat " " (List.map vws_wire_str xs) ^ "]"
  | W.Map kvs ->
      "{"
      ^ String.concat " "
          (List.map
             (fun (k, v) -> vws_wire_str k ^ " " ^ vws_wire_str v)
             kvs)
      ^ "}"
  | _ -> "?"

let vws_snapshots_response req : W.t =
  let kw s = W.Keyword s in
  match W.get req "resources" with
  | Some (W.Array rks) ->
      vws_resources :=
        !vws_resources @ [ String.concat " " (List.map vws_wire_str rks) ];
      W.Map
        [ ( kw "slots"
          , W.Map
              (List.filter_map
                 (fun rk ->
                   Option.map
                     (fun v ->
                       ( W.Array [ kw "resource"; rk ]
                       , W.Map [ kw "value", v ] ))
                     (vws_slot_value rk))
                 rks) ) ]
  | _ -> W.Map []

let vws_response (name : string) (args : W.t list) : W.t =
  match name with
  | "thread-api/get-render-snapshots" ->
      vws_snapshots_response
        (match List.nth_opt args 1 with Some r -> r | None -> W.Map [])
  | "thread-api/get-blocks" -> vws_blocks_response (List.nth_opt args 1)
  | "thread-api/get-all-properties" -> W.List []
  | "thread-api/pull" | "thread-api/pull-many" -> W.List []
  | _ -> W.Map []

let vws_invoke name args : W.t Js.Promise.t =
  vws_requests := !vws_requests @ [ name ];
  let resp = vws_response name args in
  if List.mem name !vws_held then
    Js.Promise.make (fun ~resolve ~reject:_ ->
        vws_parked := !vws_parked @ [ (name, resp, fun w -> resolve w) ])
  else Js.Promise.resolve resp

let vws_install () =
  let dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) in
  Runtime.worker :=
    Some
      { Worker_client.invoke_fn = (fun n a -> vws_invoke n a)
      ; on_message = (fun _ _ -> ())
      ; dead
      }

let vws_mount ~kind () =
  vws_install ();
  let registry = Lui_extension.registry () in
  Logseq_el.register_all registry;
  Logseq_editor.register registry;
  Logseq_codemirror.register registry;
  let vs =
    S.mount ~registry ~profile:Logseq_el.gpui_profile
      ~initial:Model.initial ~reducer:Update.update
      ~view:(fun ctx _ms _send ->
        extra_sched := Some ctx.Lui_ui.ui_scheduler;
        Logseq_el.el
          [ Views_view.view ~kind ~owner:(W.String "$$$views") ])
      ()
  in
  let flush0 = !Runtime.app_flush in
  Runtime.app_flush := (fun () -> flush0 (); flush_app vs.S.app);
  vs

let vws_host () : (Model.t, Action.t) Shared_scenarios_views.host =
  { Shared_scenarios_views.check = check
  ; mount_table =
      (fun () -> vws_mount ~kind:Views_state.KAllPages ())
  ; mount_query =
      (fun ~uuid ->
        vws_mount ~kind:(Views_state.KQuery { block_uuid = uuid }) ())
  ; after = (fun n f -> after n f)
  ; requests = (fun () -> !vws_requests)
  ; resources = (fun () -> !vws_resources)
  ; clear_requests = (fun () -> vws_requests := [])
  ; set_views = (fun vs -> vws_views := vs)
  ; set_view_flags =
      (fun uuid flags -> Hashtbl.replace vws_flags uuid flags)
  ; set_rows =
      (fun ~view rows ->
        Hashtbl.replace vws_rows view rows;
        List.iter (fun (u, t) -> Hashtbl.replace vws_titles u t) rows)
  ; set_query =
      (fun ~uuid ~src ~rows ->
        Hashtbl.replace vws_qsrc uuid src;
        Hashtbl.replace vws_qrows uuid rows)
  ; set_query_error =
      (fun ~uuid ~msg -> Hashtbl.replace vws_qerr uuid msg)
  ; hold = (fun name -> vws_held := name :: !vws_held)
  ; release =
      (fun name ->
        match
          List.find_opt (fun (n, _, _) -> n = name) !vws_parked
        with
        | Some ((_, resp, resolve) as p) ->
            vws_parked := List.filter (fun q -> q != p) !vws_parked;
            (if not (List.exists (fun (n, _, _) -> n = name) !vws_parked)
             then vws_held := List.filter (fun n -> n <> name) !vws_held);
            resolve resp
        | None -> check ("release: parked " ^ name) false)
  ; pending = (fun () -> List.map (fun (n, _, _) -> n) !vws_parked)
  }

(* ---- editor command dispatch scenarios (native entry) ---- *)

(* the recording host stands in for the host-bridge boundary;
   Editor_cmds, Editor_state, Outliner_ops and the fake worker stay
   real *)
let cmds_outcome_tag = function
  | Editor_cmds.Handled -> "handled"
  | Editor_cmds.Unavailable_command c -> "unavailable:" ^ c
  | Editor_cmds.Unimplemented c -> "unimplemented:" ^ c
  | Editor_cmds.Unknown c -> "unknown:" ^ c
  | Editor_cmds.No_target -> "no-target"

let test_editor_cmds () =
  let clip = ref [] and side = ref [] and dialogs = ref []
  and picked = ref 0 and plugs = ref [] and reports = ref [] in
  let invokes = ref [] and ops = ref [] in
  let prev_model = !Runtime.read_model in
  Editor_cmds.install_host
    { Editor_cmds.clipboard_write = (fun s -> clip := !clip @ [ s ])
    ; open_right_sidebar = (fun u -> side := !side @ [ u ])
    ; pick_files = (fun () -> incr picked)
    ; exec_plugin_ctx = Editor_cmds.Unavailable
    ; report_error =
        (fun label detail -> reports := !reports @ [ (label, detail) ])
    };
  ignore
    (Fake_worker.install (fun name args ->
         invokes := !invokes @ [ name ];
         (match name, List.nth_opt args 1 with
          | "thread-api/apply-outliner-ops", Some (W.Array os) ->
              ops := !ops
                @ List.filter_map
                    (function
                      | W.Array (W.Keyword n :: _) -> Some n
                      | _ -> None)
                    os
          | _ -> ());
         (match name with
          | "thread-api/get-property-closed-values" ->
              W.List
                [ W.Map
                    [ W.Keyword "logseq.property/value", W.String "Doing"
                    ; W.Keyword "db/id", W.Int 7 ] ]
          | "thread-api/get-case-page" ->
              W.Map [ W.Keyword "db/id", W.Int 7 ]
          | _ -> worker_handler name args)));
  (* journals (not route_page) keeps refresh_page on the route-less
     path — no Page_loaded re-enters the mounted drive app *)
  Runtime.read_model := (fun () ->
      { Model.initial with
        Model.repo = Some "logseq_db_test"
      ; Model.journals = [ page [ block "c1" "Copy me" ] ] });
  Platform.add_event_listener "ls:open-dialog" (fun j ->
      match Dom_ext.str_prop "name" (Dom_ext.prop "detail" j) with
      | Some n -> dialogs := !dialogs @ [ n ]
      | None -> ());
  Shared_scenarios_editor_cmds.run
    { Shared_scenarios_editor_cmds.check = check
    ; run = (fun ~command ~block ~value ->
          cmds_outcome_tag (Editor_cmds.run ~command ~block ~value))
    ; (* the native Js shim settles resolved promises synchronously —
         every continuation already ran by the time run returns *)
      drain = (fun f -> f ())
    ; install = (fun () -> ())
    ; set_editing = (fun u ->
          (* silent — no flush re-render over the borrowed model reader *)
          Editor_state.set_silent (fun st ->
              { st with
                Editor_state.editing =
                  Option.map
                    (fun uuid ->
                      Editor_state.mk_editing ~uuid ~buffer:"Copy me"
                        ~scope:"main" ~base:"Copy me" ())
                    u }))
    ; clipboard = (fun () -> !clip)
    ; sidebars = (fun () -> !side)
    ; dialogs = (fun () -> !dialogs)
    ; picked = (fun () -> !picked)
    ; plugin_calls = (fun () -> !plugs)
    ; reports = (fun () -> !reports)
    ; invokes = (fun () -> !invokes)
    ; ops = (fun () -> !ops)
    ; plugin_ctx_supported = false
    };
  Runtime.read_model := prev_model;
  ignore (Fake_worker.install worker_handler)

(* ---------------- subs async pipeline (Ui_task boundary) ----------------

   The subscription pipeline's async work runs on Ui_task in both
   runtimes: broadcasts stash through on_db_changes, splice arms
   serialize through Page_delta.with_apply_queue, and a page store
   that moves on mid-splice must never see the late completion
   publish over the new route. *)

let subs_publishes : Model.page list ref = ref []
let subs_held_gate = ref false
let subs_held_release : (unit -> unit) ref = ref (fun () -> ())
let subs_refetch : Model.page option ref = ref None
(* signal resolved by the stub once a held arm reaches helpers.resolve —
   stages fence on it so the graph switch provably lands while the arm
   is parked, never by a hop-count guess *)
let subs_parked : unit Ui_task.t option ref = ref None
let subs_parked_resolve : (unit -> unit) ref = ref (fun () -> ())
(* the apply_pending task of the last armed delta — stages fence on the
   pipeline's own completion instead of fixed hop counts, since every
   Ui_task hop drains through the runtime's own deferred queue *)
let subs_pipeline_t : unit Ui_task.t option ref = ref None

let when_done (t : unit Ui_task.t option) (f : unit -> unit) : unit =
  match t with
  | Some t -> ignore (Ui_task.bind t (fun () -> f (); Ui_task.resolve ()))
  | None -> f ()

let install_subs_stubs () =
  let parked_t, parked_res, _ = Ui_task.pending () in
  subs_parked := Some parked_t;
  subs_parked_resolve := parked_res;
  Subs.install_hooks
    { Subs.reload = (fun () -> ())
    ; refresh_page_side = (fun _ -> ())
    ; prune_overrides = (fun _ -> ())
    ; invalidate_pull_uuids = (fun _ -> ())
    ; invalidate_pull_caches = (fun () -> ())
    ; fire_db_hooks = (fun _ -> ())
    ; helpers_of = (fun _ ->
        { Page_delta.resolve =
            (fun bs ->
              if !subs_held_gate
              then begin
                let t, complete, _ = Ui_task.pending () in
                subs_held_release := (fun () -> complete bs);
                parked_res ();
                t
              end
              else Ui_task.resolve bs)
        ; fill_embeds = (fun bs -> Ui_task.resolve bs)
        ; merge_collapsed = (fun _ _ -> ())
        ; refresh_page_fields = (fun p -> Ui_task.resolve p) })
    ; ui_busy = (fun ~now:_ ~last_fire:_ -> false)
    ; (* the debounce timer is wall-clock — the test invokes
         apply_pending directly, so the armed fire_reload is dropped *)
      schedule = (fun _ -> ())
    ; publish_page = (fun p -> subs_publishes := !subs_publishes @ [ p ])
    ; publish_journals = (fun _ -> ())
    ; refetch_page = (fun _ -> Ui_task.resolve !subs_refetch)
    ; resync_editing = (fun () -> ()) }

let subs_canon uuid title =
  ( W.Uuid uuid
  , W.Map
      [ W.Keyword "block/uuid", W.Uuid uuid
      ; W.Keyword "block/title", W.String title ] )

let subs_delta ?(children = W.Map []) rev canon =
  W.Map
    [ W.Keyword "rev", W.Int rev
    ; W.Keyword "blocks", W.Map canon
    ; W.Keyword "deleted", W.Map []
    ; W.Keyword "children", children ]

let subs_crossed : int list ref = ref []
let subs_order : [ `First | `Second | `Third | `Fourth ] list ref =
  ref []

let test_subs_pipeline_setup () =
  subs_publishes := [];
  install_subs_stubs ();
  (* task/promise adapters: each direction completes inside the other
     runtime's deferred queue *)
  subs_crossed := [];
  ignore
    (Js.Promise.then_
       (fun v ->
         subs_crossed := !subs_crossed @ [ v ];
         Js.Promise.resolve ())
       (Subs_state.promise_of_task (Ui_task.resolve 7)));
  ignore
    (Ui_task.catch
       (Subs_state.task_of_promise
          (Js.Promise.reject (Failure "bridge rejected")))
       (fun _ ->
         subs_crossed := !subs_crossed @ [ 9 ];
         Ui_task.resolve ()));
  (* the apply queue serializes Ui_task arms in submission order, and a
     rejected arm still releases its queued successor *)
  subs_order := [];
  let gate, release_gate, _ = Ui_task.pending () in
  ignore
    (Page_delta.with_apply_queue (fun () ->
         Ui_task.bind gate (fun () ->
             subs_order := !subs_order @ [ `First ];
             Ui_task.resolve ())));
  ignore
    (Page_delta.with_apply_queue (fun () ->
         subs_order := !subs_order @ [ `Second ];
         Ui_task.resolve ()));
  ignore
    (Page_delta.with_apply_queue (fun () ->
         subs_order := !subs_order @ [ `Third ];
         Ui_task.reject (Failure "arm failed")));
  ignore
    (Page_delta.with_apply_queue (fun () ->
         subs_order := !subs_order @ [ `Fourth ];
         Ui_task.resolve ()));
  release_gate ();
  (* a canon broadcast splices into the subscribed page and republishes
     the merged store through the installed hooks *)
  Subs_state.current_page :=
    Some (page [ block "d1" "first"; block "d2" "second" ]);
  Subs.on_db_changes
    (W.Map
       [ W.Keyword "delta", subs_delta 1 [ subs_canon "d1" "first EDITED" ] ]);
  subs_pipeline_t := Some (Subs.apply_pending ())

let subs_stage_a () =
  check "task/promise bridge settles inside each runtime"
    (!subs_crossed = [ 7; 9 ]);
  check "apply queue orders Ui_task arms past a rejection"
    (!subs_order = [ `First; `Second; `Third; `Fourth ]);
  (match !subs_publishes with
   | [ p ] ->
       eq "spliced delta republished the merged page"
         [ "first EDITED"; "second" ] (titles p)
         (fun l -> String.concat "," l)
   | _ -> check "spliced delta republished exactly one page" false);
  (* the second delta parks inside helpers.resolve — the store moves on
     before its completion lands *)
  subs_held_gate := true;
  install_subs_stubs ();
  Subs.on_db_changes
    (W.Map
       [ W.Keyword "delta", subs_delta 2 [ subs_canon "d2" "second EDITED" ] ]);
  subs_pipeline_t := Some (Subs.apply_pending ())

let subs_stage_b () =
  Subs_state.current_page := None;
  !subs_held_release ()

let subs_stage_c () =
  eqi "late splice completion never published" 1
    (List.length !subs_publishes);
  (* an unspliceable delta falls back to the per-page refetch and
     publishes the refetched page *)
  subs_held_gate := false;
  subs_refetch := Some (page [ block "r1" "refetched" ]);
  install_subs_stubs ();
  Subs_state.current_page :=
    Some (page [ block "d1" "first EDITED"; block "d2" "second" ]);
  Subs.on_db_changes
    (W.Map
       [ ( W.Keyword "delta"
         , subs_delta 3 []
             ~children:
               (W.Map
                  [ ( W.Uuid "p"
                    , W.Map
                        [ W.Keyword "base-rev", W.Int 999
                        ; W.Keyword "remove", W.List []
                        ; W.Keyword "upsert", W.List [] ] ) ]) ) ]);
  subs_pipeline_t := Some (Subs.apply_pending ())

let subs_stage_d () =
  match !subs_publishes with
  | _ :: p :: _ ->
      eq "failed splice republished the refetched page" [ "refetched" ]
        (titles p)
        (fun l -> String.concat "," l)
  | _ -> check "failed splice republished the refetched page" false

(* ---------------- runner ---------------- *)

let edit_flow_host () : Edit_flow_test.host =
  { repo = "logseq_db_test"
  ; stage =
      (fun rp ->
        drive_model :=
          { !drive_model with
            Model.route_page = rp
          ; repo = Some "logseq_db_test"
          ; route = Model.Page "p"
          })
  ; sync_page =
      (fun () ->
        drive_model :=
          { !drive_model with Model.route_page = !Runtime.current_page })
  ; wait_ms =
      (fun ms ->
        Unix.sleepf (Float.of_int ms /. 1000.);
        Host.drain ();
        Js.Promise.resolve ())
  ; reject_promise = (fun why -> Js.Promise.reject (Failure why))
  ; base_handler = worker_handler
  ; snapshot = (fun () -> !drive_model)
  ; restore = (fun m -> drive_model := m)
  ; native = true
  }

let run ~finish =
  ignore (Fake_worker.install worker_handler);
  ignore (mount ());
  let registry = Lui_extension.registry () in
  native_env.register_extensions registry;
  Shared_ui_regression_test.run_views ~registry ~profile:Logseq_el.gpui_profile
    ~finish:(fun () ->
  Shared_ui_regression_test.dates ();
  Shared_ui_regression_test.dialogs ();
  (* portable editor suites — the same scenario sources compiled under
     Melange (test/ui_test) run here under native byte semantics *)
  Edit_model_test.run ();
  Edit_view_test.run ~env:native_env;
  Edit_geom_test.run ();
  test_shell ();
  test_left_menu_dispatch ();
  test_block_tree ();
  test_block_edit ();
  Shared_ui_regression_test.popup_press
    (Ui_dom_native.ev_of (Js.Json.JObject
       [ "target", Js.Json.JObject
           [ "tag", Js.Json.JString "input"
           ; "ancestors", Js.Json.JArray
               [| Js.Json.JObject [ "tag", Js.Json.JString "div"
                                 ; "class", Js.Json.JString "ls-editor-link-form" ] |] ] ]));
  test_clipboard_paste ();
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
  test_embed_parity ();
  test_journal_splice_row_level ();
  test_page_splice_row_level ();
  test_journal_reorder_move_collapse ();
  test_custom_macro_page ();
  Shared_scenarios_props.all (props_host ());
  (* the graph-switch scenario leaves props_repo at "graph-b"; restore
     the base model reader so later stages see the test repo *)
  props_repo := "";
  test_editor_cmds ();
  test_subs_pipeline_setup ();
  (* worker-fed assertions must run after promise microtasks drain --
     the views chain is ~2 ticks per invoke: snapshots -> get-blocks ->
     snapshots(view-data) -> get-blocks -> get-all-properties -> render *)
  Edit_flow_test.run (edit_flow_host ());
  after 30 (fun () ->
      async_checks ();
      Shared_scenarios_views.run (vws_host ()) ~finish:(fun () ->
          (* each subs stage fences on the pipeline's own task — a fixed
             hop count can't reach past a parked arm or a queued splice *)
          when_done !subs_pipeline_t (fun () ->
              subs_stage_a ();
              when_done !subs_parked (fun () ->
                  subs_stage_b ();
                  when_done !subs_pipeline_t (fun () ->
                      subs_stage_c ();
                      when_done !subs_pipeline_t (fun () ->
                          subs_stage_d ();
                          ignore
                            (Js.Promise.then_
                               (fun () -> finish (); Js.Promise.resolve ())
                               (Edit_flow_test.async_stage
                                  (edit_flow_host ())))))));
          (* the task-fenced callbacks post to the host mailbox like
             every Ui_task continuation — one drain cascades the chain *)
          Host.drain ())))

let () =
  let owner = Thread.id (Thread.self ()) in
  Platform.install_ui_services
    ~assert_owner:(fun () ->
      if Thread.id (Thread.self ()) <> owner then invalid_arg "UI scenario requires its application thread")
    ~request_flush:Runtime.flush
    ~dom:Ui_dom_native.ops ~timers:Ui_dom_native.timers ~files:Ui_dom_native.files;
  Editor_keys.install_once ();
  run ~finish:(fun () ->
      Js.log
        (Printf.sprintf
          "%d checks, %d failures, %d expected-failures, %d unexpected-passes"
          !checks !failures !expected_failures !unexpected_passes);
      if !failures > 0 then exit 1)
