(* Drive-based view tests: mounts the real View.view / Update.apply app
   in-process (recording backend, no DOM, no real worker) and asserts on
   the node tree Drive sees -- structure, classes, text, and event-dispatch
   effects. Browser globals come from Stub_dom; worker calls go to
   Fake_worker. One shared session for the whole file: the feature state
   modules are first-mount singletons, so tests order their setup and
   clean up after themselves (close menus/dialogs, dismiss toasts).

   Worker-driven UI updates are async (Js.Promise microtasks): assertions
   that depend on them live in the `async` stage, which the runner chains
   after the synchronous stage before reporting. *)

open Test_check
module M = Drive.Model
module S = Drive.Session
module SM = Lui_protocol.String_map
module Wv = Lui_protocol
module W = Wire

external ls_get_item : string -> string Js.null = "getItem"
  [@@mel.scope "localStorage"]

let session_ref : (Model.t, Action.t) S.t option ref = ref None
let ms_ref : Model.t Signal.signal option ref = ref None

(* sdk/editor helpers read (Runtime.model ()) — test_main stubs it to a
   frozen Model.initial; rewire to a drive-controlled ref so sdk tests
   can stage route_page without touching the live mounted model *)
let drive_model = ref Model.initial

let mount () =
  Stub_dom.install ();
  let registry = Lui_extension.registry () in
  Logseq_emoji.register registry;
  Logseq_katex.register registry;
  Logseq_el.register registry;
  Logseq_editor.register registry;
  Logseq_codemirror.register registry;
  Logseq_virt.register registry;
  let view ctx ms send =
    ms_ref := Some ms;
    View.view ctx ms send
  in
  let s =
    S.mount ~registry ~profile:Logseq_el.web_profile ~initial:Model.initial
      ~reducer:Update.apply ~view ()
  in
  Runtime.app_send :=
    (fun a ->
      let changed = Lui_app.send s.S.app a in
      ignore (Lui_app.flush s.S.app);
      changed);
  Runtime.app_flush :=
    (fun () ->
      ignore (Lui_app.flush s.S.app);
      Editor_actions.focus_pending ());
  (* Runtime.flush defers through schedule_flush on a real host; in the
     synchronous test timeline run the callback inline so signal_set /
     Runtime.flush keep their historical flush-before-return contract *)
  Runtime.schedule_flush := (fun cb -> cb ());
  session_ref := Some s;
  Runtime.read_model := (fun () -> !drive_model);
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

(* dom ~attrs serializes into the "attrs" prop as JSON; kind ~data_attrs
   lands as the "data-attrs" prop — check both *)
let rec attr_val (n : M.node) k =
  (* accessibility-identifier is the typed-kinds' id channel — attr_val
     "id" reads it so assertions keep their old name *)
  if k = "id" then
    match M.string_prop n "accessibility-identifier" with
    | Some _ as v -> v
    | None -> attr_val_dom n k
  else
    match M.string_prop n "data-attrs" with
    | Some payload -> (
      match List.assoc_opt k (Lui_protocol.data_attrs_decode payload) with
      | Some _ as v -> v
      | None -> attr_val_dom n k)
    | None -> attr_val_dom n k

and attr_val_dom (n : M.node) k =
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

let send = Runtime.send
let flush () = Runtime.flush ()

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

let shared_host () : (Model.t, Action.t) Shared_scenarios.host =
  { session = s
  ; check
  ; keydown = (fun ~meta key -> Stub_dom.keydown ~meta key)
  ; toggle_sidebar = (fun () -> click_sel "prop:accessibility-identifier=\"left-menu\"")
  ; storage_get = Ui_services.storage_get
  ; open_settings = (fun () -> Dialogs_state.open_ "settings")
  ; close_settings = Dialogs_state.close_all
  ; wide_mode_label = I18n.wide_mode
  ; theme_label = (function "dark" -> I18n.theme_dark | "light" -> I18n.theme_light | "system" -> I18n.theme_system | _ -> invalid_arg "Unknown theme")
  ; theme_snapshot = (fun () ->
      let snapshot : unit -> Shared_scenarios.theme_snapshot = [%mel.raw
        "function () { const root = document.documentElement.classList, body = document.body.classList; return {root_dark: root.contains('dark'), body_dark: body.contains('dark-theme'), body_light: body.contains('light-theme'), body_white: body.contains('white-theme')}; }"] in
      snapshot ())
  ; prefers_dark = Web_dom.prefers_dark
  ; route_get = Platform.location_hash
  ; route_set = Platform.set_location_hash
  ; route_on_change = Platform.on_hash_change
  ; route_tick = (fun () -> Stub_dom.fire_window "hashchange")
  ; flush
  }

(* ---------------- edit-flow host ---------------- *)

(* ---------------- shell + header ---------------- *)

let test_shell () =
  has "prop:accessibility-identifier=\"head\"";
  has "prop:accessibility-identifier=\"search-button\"";
  has "prop:accessibility-identifier=\"left-menu\"";
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

(* editing state swaps content for the logseq-editor surface *)
let test_block_edit () =
  Editor_state.set (fun st ->
      { st with
        Editor_state.editing =
          Some
            (Editor_state.mk_editing ~uuid:"b1" ~buffer:"editing b1"
               ~scope:"main" ~base:"editing b1" ())
      });
  flush ();
  (match find_block "b1" with
   | Some b1 ->
       check "editor inside row b1"
         (subtree_contains b1 (fun n ->
              n.M.kind = "extension:logseq-editor"
              && M.string_prop n "block-id" = Some "b1"))
   | None -> check "row b1" false);
  (* the run text mounts through .ed-r fragments *)
  (match find_block "b1" with
   | Some b1 ->
       check "run text mounted"
         (subtree_contains b1 (fun n -> has_tok n "ed-r"))
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

(* gpui can report a shift-held keystroke with the flag folded into the
   key name ({key="P", shift=false}) — the mod+p binding must not fire
   off what the DOM would deliver as shiftKey=true *)
let test_key_leaks () =
  (* the stub document replaces the real one after module init, so the
     listeners install_once attached at load are inert — register the
     global-key layer directly *)
  Web_dom.add_document_listener "keydown" Editor_keys.on_global_key true;
  Stub_dom.keydown ~meta:true "P";
  flush ();
  check "folded-shift mod+p does not open add-property"
    (find_where (fun n -> has_tok n "ls-property-dialog") = []);
  check "folded-shift mod+p opens the palette"
    (find_where (fun n -> has_tok n "cp__cmdk__modal") <> []);
  Stub_dom.keydown "Escape";
  Stub_dom.keydown "Escape";
  flush ();
  Stub_dom.keydown ~meta:true ~shift:true "P";
  flush ();
  check "mod+shift+p opens the palette"
    (find_where (fun n -> has_tok n "cp__cmdk__modal") <> []);
  check "mod+shift+p does not open add-property"
    (find_where (fun n -> has_tok n "ls-property-dialog") = []);
  Stub_dom.keydown "Escape";
  Stub_dom.keydown "Escape";
  flush ()

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
  Logseq_emoji.register registry;
  Logseq_katex.register registry;
  Logseq_el.register registry;
  Logseq_editor.register registry;
  Logseq_codemirror.register registry;
  Logseq_virt.register registry;
  let vs =
    S.mount ~registry ~profile:Logseq_el.web_profile ~initial:Model.initial
      ~reducer:Update.update
      ~view:(fun _ctx _ms _send ->
        Logseq_el.el
          [ Views_view.view ~kind:Views_state.KAllPages
              ~owner:(W.String "$$$views") ])
      ()
  in
  views_session := Some vs;
  (* the views element owns signals on this session's scheduler, so flush
     it alongside the main app's *)
  let flush0 = !Runtime.app_flush in
  Runtime.app_flush :=
    (fun () -> flush0 (); ignore (Lui_app.flush vs.S.app))

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
          ; block "bv" "{{vimeo 76979871}}"
          ; block "bb" "{{bilibili BV1xK4y1p7F8}}"
          ; block "bl" "{{loom e5b8c04bca094dd8a56e76b64085464f}}"
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
       check "ts clock icon"
         (subtree_contains a (fun c -> c.M.kind = "icon"))
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
     logseq-codemirror — the patch tree carries the extension node's
     props; the web adapter emits the textarea mount surface and mounts
     CodeMirror client-side *)
  (match
     find_where
       (fun n ->
         n.M.kind = "extension:logseq-codemirror"
         && M.string_prop n "lang" = Some "clojure")
   with
   | p :: _ -> check "code text" (M.string_prop p "value" = Some "(+ 1 2)")
   | [] -> check "code-editor node" false)

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

(* sdk test entities — one canonical shape per role so the api methods
   can exercise uuid/class/property/page resolution *)
let sdk_u1 = "aa000000-0000-4000-8000-000000000001"
let sdk_u2 = "aa000000-0000-4000-8000-000000000002"
let sdk_tag_u = "aa000000-0000-4000-8000-000000000003"
let sdk_btag_u = "aa000000-0000-4000-8000-000000000004"
let sdk_prop_u = "aa000000-0000-4000-8000-000000000005"
let sdk_page_u = "aa000000-0000-4000-8000-000000000006"
let sdk_dpage_u = "aa000000-0000-4000-8000-000000000007"
let sdk_parent_u = "aa000000-0000-4000-8000-000000000008"

let sdk_ent_for uuid : W.t option =
  let kw s = W.Keyword s in
  let ent dbid extra =
    Some
      (W.Map
         ([ kw "block/uuid", W.Uuid uuid; kw "db/id", W.Int dbid ]
         @ extra))
  in
  if uuid = sdk_u1 then ent 11 [ kw "block/title", W.String "B1" ]
  else if uuid = sdk_u2 then ent 22 [ kw "block/title", W.String "B2" ]
  else if uuid = sdk_tag_u then
    ent 33
      [ kw "block/title", W.String "Tag1"
      ; ( kw "block/tags"
        , W.List [ W.Map [ kw "db/ident", kw "logseq.class/Tag" ] ] ) ]
  else if uuid = sdk_btag_u then
    ent 44
      [ kw "block/title", W.String "BTag"
      ; ( kw "block/tags"
        , W.List [ W.Map [ kw "db/ident", kw "logseq.class/Tag" ] ] )
      ; kw "logseq.property/built-in?", W.Bool true ]
  else if uuid = sdk_prop_u then
    ent 55
      [ kw "block/title", W.String "Prop1"
      ; kw "db/ident", kw "user.property/p1"
      ; kw "logseq.property/type", kw "default" ]
  else if uuid = sdk_page_u then
    ent 66 [ kw "block/title", W.String "P" ]
  else if uuid = sdk_dpage_u then
    ent 77
      [ kw "block/title", W.String "DP"
      ; kw "logseq.property/deleted-at", W.Int64 1700000000000L ]
  else if uuid = sdk_parent_u then
    ent 88 [ kw "block/title", W.String "Parent" ]
  else None

let sdk_ops_log : W.t list ref = ref []
let sdk_tx_log : W.t list ref = ref []

(* ---------- properties scenario wiring ----------
   Mirrors the gpui host: Shared_scenarios_props drives the real
   properties modules; writes land on the recorded apply-outliner-ops
   payloads and every worker invoke is logged with its repo arg. *)

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

let sdk_op_args name =
  List.concat_map
    (fun op ->
      match W.elems op with
      | [ W.Keyword n; W.Array a ] when n = name -> [ a ]
      | _ -> [])
    !sdk_ops_log

let ent_for uuid : W.t =
  match sdk_ent_for uuid with
  | Some e -> e
  | None ->
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
               | Some (W.Uuid u) | Some (W.String u) -> u
               | _ -> "?"
             in
             W.Map
               [ W.Keyword "block", ent_for u
               ; W.Keyword "children", W.Array []
               ])
           reqs)
  | _ -> W.List []

let worker_handler name args : W.t =
  props_invoke_log :=
    (name ^ "@"
    ^ (match List.nth_opt args 0 with
       | Some (W.String r) -> r
       | _ -> "?"))
    :: !props_invoke_log;
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
  | "thread-api/apply-outliner-ops" -> (
      (match List.nth_opt args 1 with
       | Some (W.Array ops) ->
           sdk_ops_log := !sdk_ops_log @ ops;
           props_ops_log := !props_ops_log @ ops
       | _ -> ());
      W.Map [ W.Keyword "result", W.Nil ])
  | "thread-api/get-journal-page-by-day" ->
      W.Map
        [ W.Keyword "db/id", W.Int 66
        ; W.Keyword "block/title", W.String "Oct 8th, 2026" ]
  | "thread-api/validate-block-tag" -> (
      match List.nth_opt args 2 with
      | Some (W.Int 33) ->
          W.Map [ W.Keyword "valid?", W.Bool true ]
      | _ ->
          W.Map
            [ W.Keyword "valid?", W.Bool false
            ; ( W.Keyword "payload"
              , W.Map
                  [ W.Keyword "message", W.String "invalid pair"
                  ; W.Keyword "type", W.String "error" ] ) ])
  | "thread-api/transact" -> (
      (match List.nth_opt args 1 with
       | Some tx -> sdk_tx_log := !sdk_tx_log @ [ tx ]
       | _ -> ());
      W.Nil)
  | "thread-api/get-block-parent" ->
      W.Map [ W.Keyword "block/uuid", W.Uuid sdk_parent_u ]
  | "thread-api/api-list-tags" ->
      W.List [ W.Map [ W.Keyword "block/title", W.String "TagOne" ] ]
  | "thread-api/api-get-page-data" -> W.Nil
  | "thread-api/export-edn" ->
      W.Map [ W.Keyword "export-body", W.String "{:x 1}" ]
  | "thread-api/search-blocks" -> W.List []
  | "thread-api/query-custom" | "thread-api/query-dsl-custom-query" ->
      W.Array [ W.Array [ ent_for sdk_u1 ] ]
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
  Stub_dom.set_rtc_test_mode ();
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
          (fun c -> attr_val c "data-blockid")
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

(* ---------------- logseq.api surface ----------------

   The sdk bridge methods round-trip through Runtime.invoke; the fake
   worker resolves synchronously so each api call's promise settles
   during the runner's `after` drain. Write ops are asserted on the
   recorded apply-outliner-ops payload, reads on the canned replies. *)

let sdk_expect name p f =
  ignore
    (Js.Promise.then_
       (fun j -> check name (f j); Js.Promise.resolve ())
       p)

let sdk_expect_reject name p =
  ignore
    (Js.Promise.catch
       (fun _ -> check name true; Js.Promise.resolve ())
       (Js.Promise.then_
          (fun _ -> check name false; Js.Promise.resolve ())
          p))

let sdk_json_get j k =
  Option.bind (Js.Json.decodeObject j) (fun o -> Js.Dict.get o k)

let test_sdk_api () =
  let jstr s = Js.Json.string s in
  let null = Js.Json.null in
  let jobj pairs = Js.Json.object_ (Js.Dict.fromList pairs) in
  sdk_ops_log := [];
  sdk_tx_log := [];
  (* writes: op payload assertions *)
  sdk_expect_reject "sdk rename_page rejects non-uuid"
    (Sdk_write.rename_page (jstr "not-a-page") (jstr "X") null null);
  sdk_expect "sdk rename_page emits rename-page"
    (Sdk_write.rename_page (jstr sdk_page_u) (jstr "NewT") null null)
    (fun j ->
      Js.Json.decodeBoolean j = Some true
      && List.mem [ W.Uuid sdk_page_u; W.String "NewT" ]
           (sdk_op_args "rename-page"));
  sdk_expect "sdk move_block default moves as sibling"
    (Sdk_write.move_block (jstr sdk_u1) (jstr sdk_u2) null null)
    (fun _ ->
      List.mem
        [ W.Array [ W.Uuid sdk_u1 ]
        ; W.Uuid sdk_u2
        ; W.Map [ W.Keyword "sibling?", W.Bool true ] ]
        (sdk_op_args "move-blocks"));
  sdk_expect "sdk move_block children nests"
    (Sdk_write.move_block (jstr sdk_u1) (jstr sdk_u2)
       (jobj [ "children", Js.Json.boolean true ]) null)
    (fun _ ->
      List.mem
        [ W.Array [ W.Uuid sdk_u1 ]
        ; W.Uuid sdk_u2
        ; W.Map [ W.Keyword "sibling?", W.Bool false ] ]
        (sdk_op_args "move-blocks"));
  sdk_expect "sdk move_block before moves to parent top"
    (Sdk_write.move_block (jstr sdk_u1) (jstr sdk_u2)
       (jobj [ "before", Js.Json.boolean true ]) null)
    (fun _ ->
      List.mem
        [ W.Array [ W.Uuid sdk_u1 ]
        ; W.Uuid sdk_parent_u
        ; W.Map [ W.Keyword "top?", W.Bool true ] ]
        (sdk_op_args "move-blocks"));
  (* tags *)
  sdk_expect "sdk add_block_tag validates then applies"
    (Sdk_write.add_block_tag (jstr sdk_u1) (jstr sdk_tag_u) null null)
    (fun _ ->
      List.mem
        [ W.Uuid sdk_u1; W.Keyword "block/tags"; W.Int 33 ]
        (sdk_op_args "set-block-property"));
  sdk_expect "sdk add_block_tag invalid applies nothing"
    (Sdk_write.add_block_tag (jstr sdk_u1) (jstr sdk_btag_u) null null)
    (fun _ ->
      not
        (List.mem
           [ W.Uuid sdk_u1; W.Keyword "block/tags"; W.Int 44 ]
           (sdk_op_args "set-block-property")));
  sdk_expect "sdk remove_block_tag deletes property value"
    (Sdk_write.remove_block_tag (jstr sdk_u1) (jstr sdk_tag_u) null null)
    (fun _ ->
      List.mem
        [ W.Uuid sdk_u1; W.Keyword "block/tags"; W.Int 33 ]
        (sdk_op_args "delete-property-value"));
  sdk_expect "sdk add_tag_extends sets class/extends"
    (Sdk_write.add_tag_extends (jstr sdk_tag_u) (jstr sdk_tag_u) null null)
    (fun _ ->
      List.mem
        [ W.Uuid sdk_tag_u
        ; W.Keyword "logseq.property.class/extends"
        ; W.Int 33 ]
        (sdk_op_args "set-block-property"));
  sdk_expect_reject "sdk add_tag_extends rejects built-in tag"
    (Sdk_write.add_tag_extends (jstr sdk_btag_u) (jstr sdk_tag_u) null null);
  sdk_expect_reject "sdk add_tag_extends rejects non-tag"
    (Sdk_write.add_tag_extends (jstr sdk_u1) (jstr sdk_tag_u) null null);
  sdk_expect "sdk remove_tag_extends deletes class/extends"
    (Sdk_write.remove_tag_extends (jstr sdk_tag_u) (jstr sdk_tag_u) null null)
    (fun _ ->
      List.mem
        [ W.Uuid sdk_tag_u
        ; W.Keyword "logseq.property.class/extends"
        ; W.Int 33 ]
        (sdk_op_args "delete-property-value"));
  sdk_expect "sdk add_tag_property adds class property"
    (Sdk_write.add_tag_property (jstr sdk_tag_u) (jstr sdk_prop_u) null null)
    (fun _ ->
      List.mem
        [ W.Uuid sdk_tag_u; W.Keyword "user.property/p1" ]
        (sdk_op_args "class-add-property"));
  sdk_expect "sdk remove_tag_property removes class property"
    (Sdk_write.remove_tag_property (jstr sdk_tag_u) (jstr sdk_prop_u) null null)
    (fun _ ->
      List.mem
        [ W.Uuid sdk_tag_u; W.Keyword "user.property/p1" ]
        (sdk_op_args "class-remove-property"));
  sdk_expect "sdk set_property_node_tags applies ids"
    (Sdk_write.set_property_node_tags (jstr sdk_prop_u)
       (Js.Json.array [| Js.Json.number 7. |]) null null)
    (fun _ ->
      List.mem
        [ W.Uuid sdk_prop_u
        ; W.Keyword "logseq.property/classes"
        ; W.Array [ W.Int 7 ] ]
        (sdk_op_args "set-block-property"));
  sdk_expect_reject "sdk set_property_node_tags rejects non-number"
    (Sdk_write.set_property_node_tags (jstr sdk_prop_u)
       (Js.Json.array [| jstr "x" |]) null null);
  sdk_expect_reject "sdk set_property_node_tags rejects non-property"
    (Sdk_write.set_property_node_tags (jstr sdk_u1)
       (Js.Json.array [| Js.Json.number 7. |]) null null);
  (* icons *)
  sdk_expect "sdk set_block_icon applies icon property"
    (Sdk_write.set_block_icon (jstr sdk_u1) (jstr "tabler-icon")
       (jstr "IconBolt") null)
    (fun _ ->
      List.mem
        [ W.Uuid sdk_u1
        ; W.Keyword "logseq.property/icon"
        ; W.Map
            [ W.Keyword "type", W.Keyword "tabler-icon"
            ; W.Keyword "id", W.String "IconBolt" ] ]
        (sdk_op_args "set-block-property"));
  sdk_expect_reject "sdk set_block_icon rejects bad type"
    (Sdk_write.set_block_icon (jstr sdk_u1) (jstr "bogus") (jstr "x") null);
  sdk_expect_reject "sdk set_block_icon rejects blank name"
    (Sdk_write.set_block_icon (jstr sdk_u1) (jstr "tabler-icon") (jstr " ")
       null);
  sdk_expect "sdk remove_block_icon removes icon property"
    (Sdk_write.remove_block_icon (jstr sdk_u1) null null null)
    (fun _ ->
      List.mem
        [ W.Uuid sdk_u1; W.Keyword "logseq.property/icon" ]
        (sdk_op_args "remove-block-property"));
  (* page lifecycle *)
  sdk_expect "sdk restore_page emits restore-recycled"
    (Sdk_write.restore_page (jstr sdk_dpage_u) null null null)
    (fun _ ->
      List.mem [ W.Uuid sdk_dpage_u ]
        (sdk_op_args "restore-recycled"));
  sdk_expect "sdk delete_recycled_page_permanently skips live page"
    (Sdk_write.delete_recycled_page_permanently (jstr sdk_page_u) null null
       null)
    (fun _ ->
      not
        (List.mem [ W.Uuid sdk_page_u ]
           (sdk_op_args "recycle-delete-permanently")));
  sdk_expect "sdk delete_recycled_page_permanently deletes recycled"
    (Sdk_write.delete_recycled_page_permanently (jstr sdk_dpage_u) null null
       null)
    (fun _ ->
      List.mem [ W.Uuid sdk_dpage_u ]
        (sdk_op_args "recycle-delete-permanently"));
  sdk_expect "sdk prepend_block_in_page inserts"
    (Sdk_write.prepend_block_in_page (jstr sdk_page_u) (jstr "hi") null null)
    (fun _ -> sdk_op_args "insert-blocks" <> []);
  (* misc writes *)
  sdk_expect "sdk new_block_uuid returns a uuid"
    (Sdk_write.new_block_uuid null null null null)
    (fun j ->
      match Js.Json.decodeString j with
      | Some s -> String.length s = 36 && String.get s 8 = '-'
      | None -> false);
  sdk_expect "sdk force_save_graph true"
    (Sdk_write.force_save_graph null null null null)
    (fun j -> Js.Json.decodeBoolean j = Some true);
  sdk_expect_reject "sdk set_file_content rejects bad path"
    (Sdk_write.set_file_content (jstr "bad/path") (jstr "x") null null);
  sdk_expect_reject "sdk set_file_content rejects non-string"
    (Sdk_write.set_file_content (jstr "logseq/custom.js") (jobj []) null null);
  sdk_expect "sdk set_file_content transacts file entity"
    (Sdk_write.set_file_content (jstr "logseq/custom.js") (jstr "x") null null)
    (fun j ->
      Js.Json.decodeBoolean j = Some true
      && (match !sdk_tx_log with
         | [ W.Array [ m ] ] ->
             W.get m "file/path" = Some (W.String "logseq/custom.js")
             && W.get m "file/content" = Some (W.String "x")
         | _ -> false));
  (* reads *)
  sdk_expect "sdk get_current_graph_favorites"
    (Sdk_read.get_current_graph_favorites null null null null)
    (fun j ->
      match Js.Json.decodeArray j with
      | Some a -> Array.length a = 1
      | None -> false);
  sdk_expect "sdk get_current_graph_recent"
    (Sdk_read.get_current_graph_recent null null null null)
    (fun j -> Js.Json.decodeArray j <> None);
  sdk_expect "sdk list_tags keeps kebab keys"
    (Sdk_read.list_tags null null null null)
    (fun j ->
      match Js.Json.decodeArray j with
      | Some [| t |] ->
          sdk_json_get t "title" = Some (Js.Json.string "TagOne")
      | _ -> false);
  sdk_expect "sdk get_page_data reports missing page"
    (Sdk_read.get_page_data (jstr "Nope") null null null)
    (fun j ->
      match sdk_json_get j "error" with
      | Some e -> (
          match Js.Json.decodeString e with
          | Some s ->
              String.length s > 9
              && String.sub s (String.length s - 9) 9 = "not found"
          | None -> false)
      | None -> false);
  sdk_expect "sdk search returns blocks shape"
    (Sdk_read.search (jstr "b1") null null null)
    (fun j -> sdk_json_get j "blocks" <> None);
  sdk_expect "sdk export_edn returns export-body"
    (Sdk_read.export_edn null null null null)
    (fun j -> sdk_json_get j "export-body" <> None);
  sdk_expect "sdk get_file_content"
    (Sdk_read.get_file_content (jstr "logseq/config.edn") null null null)
    (fun j ->
      match Js.Json.decodeString j with
      | Some s -> String.length s > 0
      | None -> false);
  sdk_expect "sdk custom_query datalog flattens rows"
    (Sdk_read.custom_query
       (jstr "[:find ?b :where [?b :block/title \"B1\"]]")
       null null null)
    (fun j ->
      match Js.Json.decodeArray j with
      | Some a -> Array.length a = 1
      | None -> false);
  sdk_expect "sdk custom_query dsl flattens rows"
    (Sdk_read.custom_query (jstr "(and [[B1]])") null null null)
    (fun j ->
      match Js.Json.decodeArray j with
      | Some a -> Array.length a = 1
      | None -> false);
  sdk_expect "sdk get_all_pages returns array"
    (Sdk_read.get_all_pages null null null null)
    (fun j -> Js.Json.decodeArray j <> None);
  sdk_expect "sdk get_today_page returns entity"
    (Sdk_read.get_today_page null null null null)
    (fun j -> Js.Json.decodeObject j <> None);
  (* editor / ui state *)
  sdk_expect "sdk check_editing false"
    (Sdk_ui.check_editing null null null null)
    (fun j -> Js.Json.decodeBoolean j = Some false);
  sdk_expect "sdk select_block selects uuid"
    (Sdk_ui.select_block (jstr sdk_u1) null null null)
    (fun _ -> Editor_state.is_selected sdk_u1);
  sdk_expect "sdk clear_selected_blocks"
    (Sdk_ui.clear_selected_blocks null null null null)
    (fun _ -> not (Editor_state.is_selected sdk_u1));
  (* collapse only applies to blocks with children — stage one in
     route_page *)
  drive_model :=
    { !drive_model with
      Model.route_page =
        Some (page [ block sdk_u1 "sdkp1" ~children:[ block sdk_u2 "sdkp2" ] ])
    };
  sdk_expect "sdk set_block_collapsed collapses"
    (Sdk_ui.set_block_collapsed (jstr sdk_u1) (Js.Json.boolean true) null
       null)
    (fun _ -> Editor_state.is_collapsed_in sdk_u1);
  sdk_expect_reject "sdk edit_block rejects non-uuid"
    (Sdk_ui.edit_block (jstr "nope") null null null);
  sdk_expect "sdk query_element_by_id missing -> false"
    (Sdk_ui.query_element_by_id (jstr "no-such-el") null null null)
    (fun j -> Js.Json.decodeBoolean j = Some false);
  sdk_expect "sdk get_current_route reports page"
    (Sdk_ui.get_current_route null null null null)
    (fun j -> sdk_json_get j "to" = Some (Js.Json.string "page"));
  sdk_expect "sdk set_left_sidebar_visible resolves"
    (Sdk_ui.set_left_sidebar_visible (Js.Json.boolean false) null null null)
    (fun _ -> true);
  sdk_expect "sdk set_right_sidebar_visible resolves"
    (Sdk_ui.set_right_sidebar_visible (Js.Json.boolean false) null null null)
    (fun _ -> true);
  (* restore sidebar items so async_checks still finds them *)
  let saved_items =
    match Sidebar_state.current () with
    | Some st -> Signal.get_state st.Sidebar_state.items
    | None -> []
  in
  sdk_expect "sdk clear_right_sidebar_blocks clears items"
    (Sdk_ui.clear_right_sidebar_blocks (jobj []) null null null)
    (fun _ ->
      let cleared =
        match Sidebar_state.current () with
        | Some st -> Signal.get_state st.Sidebar_state.items = []
        | None -> true
      in
      (match Sidebar_state.current () with
       | Some st -> Runtime.signal_set st.Sidebar_state.items saved_items
       | None -> ());
      cleared);
  sdk_expect "sdk get_current_page_blocks_tree null without page"
    (Sdk_read.get_current_page_blocks_tree null null null null)
    (fun j -> j == Js.Json.null);
  sdk_expect "sdk get_current_block null when not editing"
    (Sdk_read.get_current_block null null null null)
    (fun j -> j == Js.Json.null || Js.Json.decodeObject j <> None);
  sdk_expect "sdk get_previous_sibling_block resolves"
    (Sdk_read.get_previous_sibling_block (jstr sdk_u1) null null null)
    (fun _ -> true);
  sdk_expect "sdk get_page_linked_references resolves"
    (Sdk_read.get_page_linked_references (jstr sdk_page_u) null null null)
    (fun _ -> true)

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
  let registry = Lui_extension.registry () in
  Logseq_emoji.register registry;
  Logseq_katex.register registry;
  Logseq_el.register registry;
  Logseq_editor.register registry;
  Logseq_codemirror.register registry;
  Logseq_virt.register registry;
  let s =
    S.mount ~registry ~profile:Logseq_el.web_profile ~initial:Model.initial
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
  eqi "failed splice published a second page" 2
    (List.length !subs_publishes);
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
        Js.Promise.make (fun ~resolve ~reject:_ ->
            Web_dom.set_timeout (fun () ->
                let v = () in
                resolve v [@u])
              ms))
  ; reject_promise =
      (fun why ->
        Js.Promise.then_
          (fun () -> failwith why)
          (Js.Promise.resolve ()))
  ; base_handler = worker_handler
  ; snapshot = (fun () -> !drive_model)
  ; restore = (fun m -> drive_model := m)
  ; native = false
  }

let run ~finish =
  ignore (Fake_worker.install worker_handler);
  ignore (mount ());
  test_shell ();
  test_left_menu_dispatch ();
  test_block_tree ();
  test_block_edit ();
  test_cmdk ();
  test_key_leaks ();
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
  test_sdk_api ();
  Shared_scenarios_props.all (props_host ());
  (* the graph-switch scenario leaves props_repo at "graph-b"; restore
     the base model reader so later stages see the test repo *)
  props_repo := "";
  test_subs_pipeline_setup ();
  (* worker-fed assertions must run after promise microtasks drain --
     the views chain is ~2 ticks per invoke: snapshots -> get-blocks ->
     snapshots(view-data) -> get-blocks -> get-all-properties -> render *)
  Edit_flow_test.run (edit_flow_host ());
  after 30 (fun () ->
      async_checks ();
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
                              (edit_flow_host ()))))))))

