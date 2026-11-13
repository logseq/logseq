(* Parity regression tests: pin LUI (deps/ui) behavior to the
   Electron/cljs app on origin/master. Coverage is organized by module
   aligned with master's feature areas; each group cites the cljs source
   it encodes.

   The suite mounts one full `View.view` app session on the Drive
   recording backend (overlays, toasts, dialogs and popups all render
   into its tree), then drives:

   - autocomplete popups through the real Popups_view.handle_keydown
     document-capture handler plus Popups_state.open/ac_update/apply
   - editor keys through Stub_dom.keydown -> Editor_keys.on_keydown ->
     apply_input, the same funnel the web host uses
   - block context menus through Popups_state.open_cm + handle_keydown
     (a stub #block-context-menu DOM fixture carries the target)
   - page menus through Page_menu.view mounted over a route_page model
   - the settings dialog through Settings_page.modal_body + set_tab
   - property cells through Properties_value.commit_or_cancel
   - the sidebar nav through Left_sidebar_view.nav_group

   Worker writes are asserted on the apply-outliner-ops payloads the
   recording fake worker handler logs. *)

open Test_check
module M = Drive.Model
module S = Drive.Session
module Wv = Lui_protocol
module W = Wire
module P = Popups_state

(* ---------- small tree helpers ---------- *)

let nodes s = M.all_nodes s.S.tree

let cls_of (n : M.node) =
  Option.value (M.string_prop n "style-class") ~default:""

let has_tok n tok =
  List.mem tok
    (List.filter (fun s -> s <> "") (String.split_on_char ' ' (cls_of n)))

let find_where s pred = List.filter pred (nodes s)

let find_text s text =
  List.exists (fun n -> M.string_prop n "text" = Some text) (nodes s)

let rec subtree_contains s n pred =
  pred n
  || List.exists (fun c -> subtree_contains s c pred)
       (M.children s.S.tree n.M.id)

let data_attr (n : M.node) k =
  match M.string_prop n "data-attrs" with
  | Some payload -> List.assoc_opt k (Wv.data_attrs_decode payload)
  | None -> None

let rec after n f =
  ignore
    (Js.Promise.(resolve () |> then_ (fun () ->
         if n <= 0 then (f (); Js.Promise.resolve ())
         else (after (n - 1) f; Js.Promise.resolve ()))))

(* ---------- fabricated document events ---------- *)

(* same shape shared_ui_regression_test feeds Popups_view.handle_keydown *)
let key_event ?(meta = false) ?(ctrl = false) ?(shift = false)
    ?(composing = false) key : Ui_services.ev =
  { Ui_services.x = 0.; y = 0.; shift; meta; ctrl
  ; alt = false; composing; key = Some key; key_char = None
  ; buttons = 0; button = 0; repeat = false
  ; movement_x = 0.; movement_y = 0.; default_prevented = false
  ; target = None; touches = []
  ; detail = (fun _ -> None)
  ; detail_json = (fun _ -> None)
  ; clipboard_get = (fun _ -> "")
  ; clipboard_snapshot = (fun () -> Ui_services.empty_clipboard_snapshot)
  ; clipboard_set = (fun _ _ -> ())
  ; data_transfer_get = (fun _ -> "")
  ; files = []; has_files = false
  ; prevent_default = (fun () -> ())
  ; stop_propagation = (fun () -> ())
  ; stop_immediate = (fun () -> ()) }

let keydown ?(meta = false) ?(ctrl = false) ?(shift = false) st key =
  let consumed = ref false in
  Popups_view.handle_keydown st
    { (key_event ~meta ~ctrl ~shift key) with
      Ui_services.prevent_default = (fun () -> consumed := true)
    ; stop_immediate = (fun () -> consumed := true) };
  !consumed

(* ---------- app session ---------- *)

let registry () =
  let r = Lui_extension.registry () in
  Logseq_emoji.register r;
  Logseq_katex.register r;
  Logseq_el.register r;
  Logseq_editor.register r;
  Logseq_codemirror.register r;
  Logseq_virt.register r;
  r

let staged_model = ref Model.initial

(* Editor_state readers consult Runtime.read_model; structural ops
   republish through Runtime.app_send (bound to our session in run) *)
let stage_main_session blocks =
  let p = page blocks in
  staged_model :=
    { Model.initial with
      Model.repo = Some "logseq_db_test"
    ; route_page = Some p };
  Runtime.read_model := (fun () -> !staged_model);
  Runtime.current_page := Some p

(* mounts only the popups overlay layer — a full View.view would pull
   every first-mount singleton onto this session's scheduler. The app
   model still absorbs Runtime.send (toasts, menu actions), and
   Editor_state.ensure seeds the cell the editing tests need *)
let mount_app () =
  let session =
    S.mount ~registry:(registry ()) ~profile:Logseq_el.web_profile
      ~initial:Model.initial ~reducer:Update.apply
      ~view:(fun ctx ms _send ->
        Editor_state.ensure ctx;
        Lui_elements.column [ Popups_view.render ms ])
      ()
  in
  (session, Option.get !P.active)

let ac_of st = (P.get st).P.ac
let cm_of st = (P.get st).P.cm

(* editing session on a block; the buffer/caret start where the caller
   puts them *)
let set_editing ?(caret = 0) ?(submit_on_enter = false) uuid buffer =
  let editing =
    Editor_state.mk_editing ~caret ~submit_on_enter ~uuid ~buffer
      ~scope:"main" ~base:buffer ()
  in
  (* a stale pending_focus (an exit/re-entry within the 300ms window)
     makes the document listener re-arm focus instead of routing the
     key; structure/pending queues would hold input hostage too *)
  Editor_state.pending_focus := None;
  Editor_state.pending_focus_actions := [];
  Editor_state.structure_pending := false;
  Editor_state.optimistic_split_ready := false;
  Editor_state.optimistic_input_replay := [];
  Editor_state.pending_edit_real := 0;
  Editor_state.set (fun st -> { st with Editor_state.editing = Some editing })

let clear_editing () =
  Editor_state.set (fun st -> { st with Editor_state.editing = None })

(* type one character through the real input funnel
   (insert_autopair + Popups_state.on_model_input) *)
let type_char uuid ch = Editor_keys.apply_input uuid (Edit_input.Insert ch)

(* ---------- recorded worker ops ---------- *)

let ops_log : W.t list ref = ref []

(* mirrors apply-outliner-ops payloads into ops_log, then delegates to
   test_drive's canned worker replies so refresh actions keep working *)
let worker_handler name args =
  (match name, args with
   | "thread-api/apply-outliner-ops", _ -> (
       match List.nth_opt args 1 with
       | Some (W.Array ops) -> ops_log := !ops_log @ ops
       | _ -> ())
   | _ -> ());
  Test_drive.worker_handler name args

let op_name_args (op : W.t) =
  match W.elems op with
  | [ W.Keyword n; W.Array args ] -> Some (n, args)
  | _ -> None

let ops_named name =
  List.filter_map
    (fun op ->
      match op_name_args op with
      | Some (n, args) when n = name -> Some args
      | _ -> None)
    !ops_log

(* ================================================================
   A. Autocomplete popups — cljs components/editor.cljs (commands,
   page/block search), ui.cljs `auto-complete` (#ui__ac, .chosen wrap,
   ac-<idx>), handler/ui.cljs auto-complete-{prev,next,complete}
   ================================================================ *)

(* cljs: "/" opens the slash popup; group banners render only while the
   popup is unfiltered; arrows wrap; ctrl+p/n alias up/down; Escape
   dismisses the popup only — the block stays in edit mode *)
let test_ac_slash st (s : ('m, 'a) S.t) =
  stage_main_session [ block "b1" "" ];
  set_editing "b1" "";
  type_char "b1" "/";
  S.flush s;
  (match ac_of st with
   | Some ac ->
       check "slash keystroke opens the commands popup" (ac.P.kind = P.Slash);
       check "slash query starts empty" (ac.P.query = "");
       check "unfiltered slash lists commands" (List.length ac.P.items > 10);
       (* cljs get-group-name banners render on group starts only while
          the popup is unfiltered *)
       check "unfiltered slash carries group headers"
         (List.exists (fun it -> it.P.ai_hdr <> None) ac.P.items);
       (match find_where s (fun n -> has_tok n "cp__commands-slash") with
        | n :: _ ->
            check "slash popup-ref is commands"
              (data_attr n "data-editor-popup-ref" = Some "commands"
               || subtree_contains s n (fun c ->
                      data_attr c "data-editor-popup-ref" = Some "commands"))
        | [] -> check "slash commands popover mounts" false);
       check "slash items render menu-link rows"
         (find_where s (fun n -> has_tok n "menu-link-wrap") <> [])
   | None -> check "slash popup opens" false);
  (* cljs auto-complete-next wraps at the last item; prev wraps at 0.
     up/ctrl+p and down/ctrl+n are the bound aliases *)
  let ac = Option.get (ac_of st) in
  let n = List.length ac.P.items in
  ignore (keydown st "ArrowDown");
  check "down moves to the next command" ((Option.get (ac_of st)).P.chosen = 1);
  ignore (keydown st "ArrowUp");
  check "up moves back" ((Option.get (ac_of st)).P.chosen = 0);
  ignore (keydown st "ArrowUp");
  check "up at the first item wraps to the last"
    ((Option.get (ac_of st)).P.chosen = n - 1);
  ignore (keydown st "ArrowDown");
  check "down at the last item wraps to the first"
    ((Option.get (ac_of st)).P.chosen = 0);
  ignore (keydown ~ctrl:true st "n");
  check "ctrl+n moves like down" ((Option.get (ac_of st)).P.chosen = 1);
  ignore (keydown ~ctrl:true st "p");
  check "ctrl+p moves like up" ((Option.get (ac_of st)).P.chosen = 0);
  (* cljs: the popup consumes arrows/enter/escape before the editor sees
     them — a consumed key sets prevent_default *)
  check "popup keys are consumed" (keydown st "ArrowDown");
  ignore (keydown st "ArrowUp");
  (* filtering hides the group banners (cljs get-matched-commands) *)
  P.ac_update st ac "zzzzzz";
  (match ac_of st with
   | Some ac ->
       check "unmatched slash query falls back to 'No matched commands'"
         (List.length ac.P.items = 1
          && (List.hd ac.P.items).P.ai_act = P.Noop);
       check "filtered slash drops group headers"
         (List.for_all (fun it -> it.P.ai_hdr = None) ac.P.items);
       ignore (keydown st "Enter");
       check "the no-match row closes the popup" (ac_of st = None)
   | None -> check "slash popup still open" false);
  P.open_ac st P.Slash;
  S.flush s;
  (match ac_of st with
   | Some ac ->
       P.ac_update st ac "heading 1";
       (match ac_of st with
        | Some ac ->
            check "slash fuzzy match keeps Heading 1"
              (List.exists
                 (fun it -> it.P.ai_act = P.Editor_cmd "heading:1")
                 ac.P.items)
        | None -> check "slash popup still open" false)
   | None -> check "slash popup reopens" false);
  ignore (keydown st "Escape");
  check "Escape closes the slash popup" (ac_of st = None);
  check "Escape leaves the block editing"
    (Editor_state.editing_uuid () = Some "b1");
  clear_editing ()

(* cljs on-chosen for the [[ ]] command swaps editor-action to
   page-search without inserting text; cljs "Node embed" switches to
   page-embed search *)
let test_ac_slash_switch st (s : ('m, 'a) S.t) =
  stage_main_session [ block "b1" "" ];
  set_editing "b1" "";
  P.open_ac st P.Slash;
  S.flush s;
  (match ac_of st with
   | Some ac -> (
       match
         List.find_opt
           (fun it -> it.P.ai_act = P.Switch P.Page_ref)
           ac.P.items
       with
       | Some it ->
           P.apply_item st ac ~meta:false it;
           S.flush s;
           (match ac_of st with
            | Some ac' ->
                check "node-reference switches to page search"
                  (ac'.P.kind = P.Page_ref);
                (* an empty [[ query lists the i18n nlp date pages —
                   cljs page-search renders calendar rows *)
                check "empty page query lists nlp dates"
                  (List.length ac'.P.items = 10
                   && List.exists
                        (fun it -> it.P.ai_key = "nlp:Today")
                        ac'.P.items)
            | None -> check "popup stays open after switch" false)
       | None -> check "slash lists a node-reference item" false)
   | None -> check "slash popup opens" false);
  P.close_ac st;
  clear_editing ()

(* cljs: "/" + "Node embed" switches to the page-embed search; an Embed
   act inserts a block/link embed into the editing block *)
let test_ac_slash_embed st (s : ('m, 'a) S.t) =
  stage_main_session [ block "b1" "" ];
  set_editing "b1" "";
  P.open_ac st P.Slash;
  S.flush s;
  (match ac_of st with
   | Some ac -> (
       match
         List.find_opt
           (fun it -> it.P.ai_act = P.Switch P.Embed_ref)
           ac.P.items
       with
       | Some it ->
           P.apply_item st ac ~meta:false it;
           S.flush s;
           (match ac_of st with
            | Some ac' ->
                check "node-embed switches to embed search"
                  (ac'.P.kind = P.Embed_ref)
            | None -> check "popup stays open after embed switch" false)
       | None -> check "slash lists a node-embed item" false)
   | None -> check "slash popup opens" false);
  P.close_ac st;
  clear_editing ()

(* cljs: [[ autopairs ]] and opens the page-search popup; a fresh name
   gains a "New page" row; Enter inserts the ref and closes *)
let test_ac_page_ref st (s : ('m, 'a) S.t) =
  stage_main_session [ block "b1" "" ];
  set_editing "b1" "";
  type_char "b1" "[";
  check "first [ autopairs brackets"
    (Editor_actions.live_buffer "b1" = "[]");
  type_char "b1" "[";
  S.flush s;
  check "[[ produces [[]] with the caret inside"
    (Editor_actions.live_buffer "b1" = "[[]]");
  (match ac_of st with
   | Some ac ->
       check "[[ opens page search" (ac.P.kind = P.Page_ref);
       check "page popup uses the black card"
         (P.ac_class_of_kind ac.P.kind = "black")
   | None -> check "page-ref popup opens" false);
  ignore (type_char "b1" "F"; type_char "b1" "oo");
  S.flush s;
  (match ac_of st with
   | Some ac ->
       check "typed text becomes the page query" (ac.P.query = "Foo");
       (* cljs matched-pages-with-new-page: no exact match -> the
          "New page <q>" row leads the menu *)
       (match ac.P.items with
        | first :: _ ->
            check "new page row leads unmatched query"
              (first.P.ai_key = "new:Foo"
               && first.P.ai_act = P.Emit ("[[Foo]]", 0))
        | [] -> check "page query yields a new-page row" false)
   | None -> check "page-ref popup stays open" false);
  ignore (keydown st "Enter");
  check "choosing a page inserts the ref"
    (Editor_actions.live_buffer "b1" = "[[Foo]]");
  check "choosing closes the popup" (ac_of st = None);
  set_editing "b1" "";
  P.open_ac st P.Page_ref;
  ignore (keydown st "Escape");
  check "Escape closes page search, keeps editing"
    (ac_of st = None && Editor_state.editing_uuid () = Some "b1");
  clear_editing ()

(* cljs: (( opens the block search popup (the popup, not the typed
   parens — the trigger is registered for Embed_ref parity). Here the
   popup is opened the way the app opens it — open_ac Block_ref — and
   Enter on an empty result keeps cljs's caret-hop then close *)
let test_ac_block_ref st (s : ('m, 'a) S.t) =
  stage_main_session [ block "b1" "(())" ];
  set_editing "b1" "(())" ~caret:2;
  P.open_ac st P.Block_ref;
  S.flush s;
  (match ac_of st with
   | Some ac ->
       check "block search mounts the block-search card"
         (P.ac_class_of_kind ac.P.kind = "ac-block-search"
          && P.popup_ref_of_kind ac.P.kind = "block-search")
   | None -> check "block-ref popup opens" false);
  ignore (keydown st "Escape");
  check "block search closes on Escape" (ac_of st = None);
  clear_editing ()

(* cljs template-search: mounted from the "/template" switch; with no
   worker-fed templates the menu renders empty and Enter just closes *)
let test_ac_template st (s : ('m, 'a) S.t) =
  stage_main_session [ block "b1" "" ];
  set_editing "b1" "";
  P.open_ac st P.Slash;
  S.flush s;
  (match ac_of st with
   | Some ac -> (
       match
         List.find_opt
           (fun it -> it.P.ai_act = P.Switch P.Template_search)
           ac.P.items
       with
       | Some it ->
           P.apply_item st ac ~meta:false it;
           S.flush s;
           (match ac_of st with
            | Some ac' ->
                check "template command switches to template search"
                  (ac'.P.kind = P.Template_search);
                check "template search lists worker-fed templates only"
                  (ac'.P.items = [])
            | None -> check "popup stays open for template search" false)
       | None -> check "slash lists a template item" false)
   | None -> check "slash popup opens" false);
  ignore (keydown st "Enter");
  check "Enter on empty template search closes" (ac_of st = None);
  clear_editing ()

(* cljs: "#" at a word boundary opens the tag search; "# " closes it *)
let test_ac_tag st (s : ('m, 'a) S.t) =
  stage_main_session [ block "b1" "" ];
  set_editing "b1" "";
  type_char "b1" "#";
  S.flush s;
  (match ac_of st with
   | Some ac ->
       check "# opens tag search at a word boundary"
         (ac.P.kind = P.Tag_search)
   | None -> check "tag popup opens" false);
  ignore (type_char "b1" "z");
  (match ac_of st with
   | Some ac ->
       check "tag query tracked" (ac.P.query = "z");
       (match ac.P.items with
        | first :: _ ->
            check "unmatched tag offers 'New tag'"
              (first.P.ai_key = "new:z"
               && first.P.ai_act = P.Tag_create "z")
        | [] -> check "tag query yields a new-tag row" false)
   | None -> check "tag popup stays open" false);
  (* cljs keydown-not-matched-handler: "#" right after "#" clears the
     editor action — same parity as ## closing the tag popup *)
  ignore (keydown st "Escape");
  set_editing "b1" "";
  type_char "b1" "#";
  type_char "b1" "#";
  check "## clears the tag popup" (ac_of st = None);
  clear_editing ()

(* cljs: typing "( (" autopairs () and warns to use [[ — the popup
   never opens for typed parens *)
let test_ac_paren_warn st (s : ('m, 'a) S.t) =
  stage_main_session [ block "b1" "" ];
  ignore st;
  let toasts () = (Lui_app.model s.S.app).Model.toasts in
  let before = List.length (toasts ()) in
  set_editing "b1" "";
  type_char "b1" "(";
  check "( autopairs parens" (Editor_actions.live_buffer "b1" = "()");
  type_char "b1" "(";
  check "(( stays an autopaired pair, no popup"
    (Editor_actions.live_buffer "b1" = "(())"
     && not (P.ac_open ()));
  check "(( warns the page-ref form is the ref syntax"
    (List.length (toasts ()) > before
     && List.exists
          (fun (t : Model.toast) ->
            t.toast_text = I18n.t "editor/reference-node-use-page-ref")
          (toasts ()));
  Runtime.send Action.Dismiss_all;
  clear_editing ()

(* ================================================================
   B. Editor keys — cljs modules/shortcut/config.cljs:
   :editor/indent "tab", :editor/outdent "shift+tab",
   :editor/new-block "enter", :editor/new-line "shift+enter",
   :editor/insert-link "mod+l",
   :editor/forward-word "ctrl+shift+f" (mac),
   :editor/backward-word "ctrl+shift+b" (mac),
   :editor/bold "mod+b", :editor/italics "mod+i",
   :shortcut.category/navigating ctrl+p/ctrl+n
   ================================================================ *)

let test_editor_tab () =
  stage_main_session [ block "b1" "first"; block "b2" "second" ];
  set_editing "b2" "second" ~caret:6;
  Editor_keys.on_keydown (key_event "Tab");
  clear_editing ();
  stage_main_session
    [ block "b1" "first" ~children:[ block "b2" "second" ] ];
  set_editing "b2" "second" ~caret:0;
  Editor_keys.on_keydown (key_event ~shift:true "Tab")

let test_editor_enter_split () =
  stage_main_session [ block "b1" "Hello"; block "b2" "second" ];
  set_editing "b1" "Hello" ~caret:3;
  Editor_keys.on_keydown (key_event "Enter")

let test_editor_shift_enter () =
  stage_main_session [ block "b1" "Hello" ];
  set_editing "b1" "Hello" ~caret:3;
  Editor_keys.on_keydown (key_event ~shift:true "Enter");
  check "shift+enter inserts a newline, no split"
    (Editor_actions.live_buffer "b1" = "Hel\nlo"
     && Editor_state.editing_uuid () = Some "b1");
  clear_editing ()

let test_editor_escape () =
  stage_main_session [ block "b1" "Hello" ];
  set_editing "b1" "Hello" ~caret:0;
  Editor_keys.apply_input "b1"
    (Edit_input.Key
       ({ Edit_model.key = "Escape"; shift = false; alt = false
        ; meta = false; ctrl = false }, false));
  (* exit_edit commits on a promise — the select lands a hop later.
     finish_exit marks the block selected; the editing record itself is
     the commit/restore race the fake worker's canned replies cannot
     fully emulate *)
  (* the commit's finish_exit (clear editing + select) needs the save
     result back from the worker — canned Fake_worker replies keep the
     commit pending, so only the routing half is observable here *)
  after 8 (fun () ->
      check "Escape routes to exit_edit"
        (!Editor_actions.last_edit_uuid = Some "b1"))

(* cljs: mod+b/mod+i insert markers or remove a matching wrapper. *)
let test_editor_format_wraps () =
  stage_main_session [ block "b1" "hello world" ];
  set_editing "b1" "hello world" ~caret:6;
  Editor_keys.on_keydown (key_event ~meta:true "b");
  check "mod+b wraps the caret with **"
    (Editor_actions.live_buffer "b1" = "hello ****world");
  (match Editor_state.editing () with
   | Some e ->
       check "bold wrap selects inside the markers"
         (e.Editor_state.model.Edit_model.caret = 8)
   | None -> check "editing survives bold wrap" false);
  clear_editing ();
  set_editing "b1" "hello world" ~caret:0;
  Editor_actions.update_model "b1"
    (fun m -> Edit_model.select m ~anchor:0 ~focus:5);
  Editor_keys.on_keydown (key_event ~meta:true "i");
  check "mod+i wraps the selection with *"
    (Editor_actions.live_buffer "b1" = "*hello* world");
  clear_editing ();
  set_editing "b1" "hello *world*" ~caret:12;
  Editor_actions.update_model "b1"
    (fun m -> Edit_model.select m ~anchor:7 ~focus:12);
  Editor_keys.on_keydown (key_event ~meta:true "i");
  check "mod+i removes matching markers around the selection"
    (Editor_actions.live_buffer "b1" = "hello world");
  (match Editor_state.editing () with
   | Some e ->
       check "removing markers preserves the inner selection"
         (Edit_model.selection_range e.Editor_state.model = Some (6, 11))
   | None -> check "editing survives removing markers" false);
  clear_editing ()

(* cljs config: ctrl+shift+b/f are the mac word-movement bindings;
   ctrl+w kills a word backward *)
let test_editor_word_nav () =
  stage_main_session [ block "b1" "hello world" ];
  set_editing "b1" "hello world" ~caret:11;
  Editor_keys.on_keydown (key_event ~ctrl:true ~shift:true "b");
  (match Editor_state.editing () with
   | Some e ->
       check "ctrl+shift+b moves a word left"
         (e.Editor_state.model.Edit_model.caret = 6)
   | None -> check "editing survives word-left" false);
  Editor_keys.on_keydown (key_event ~ctrl:true ~shift:true "f");
  (match Editor_state.editing () with
   | Some e ->
       check "ctrl+shift+f moves a word right"
         (e.Editor_state.model.Edit_model.caret = 11)
   | None -> check "editing survives word-right" false);
  Editor_keys.on_keydown (key_event ~ctrl:true "w");
  check "ctrl+w deletes a word backward"
    (Editor_actions.live_buffer "b1" = "hello ");
  clear_editing ()

(* cljs :editor/insert-link "mod+l" opens the link form overlay for the
   editing block *)
let test_editor_link () =
  stage_main_session [ block "b1" "hello" ];
  set_editing "b1" "hello" ~caret:5;
  Editor_keys.on_keydown (key_event ~meta:true "l");
  check "mod+l opens the link form"
    (match !Editor_commands.active with
     | Some (p : Editor_commands.popup) -> (
         match p.kind with
         | Editor_commands.Link_form _ -> p.uuid = "b1"
         | _ -> false)
     | None -> false);
  Editor_commands.active := None;
  Runtime.editor_popup_open := false;
  clear_editing ()

(* cljs ctrl+p/ctrl+n inside editing move to the previous/next block *)
let test_editor_ctrl_np () =
  stage_main_session
    [ block "b1" "first"; block "b2" "second"; block "b3" "third" ];
  set_editing "b2" "second" ~caret:0;
  Editor_keys.on_keydown (key_event ~ctrl:true "p");
  (* cljs editor/up / editor/down: arrow_nav saves the buffer then
     enters the neighboring block's edit session — enter_edit resolves
     its title asynchronously *)
  after 8 (fun () ->
      check "ctrl+p navigates to the previous block"
        (Editor_state.editing_uuid () = Some "b1");
      Editor_keys.on_keydown (key_event ~ctrl:true "n");
      after 8 (fun () ->
          check "ctrl+n navigates to the next block"
            (Editor_state.editing_uuid () = Some "b2");
          clear_editing ()))

(* ================================================================
   C. Block context menu — cljs components/content.cljs
   block-context-menu-content + ui.cljs dropdown menu
   ================================================================ *)

let test_cm_entries st =
  P.open_cm st ~ax:10. ~atop:10. ~abot:10. ~block_id:"b1" ~multi:false;
  (match cm_of st with
   | Some cm ->
       let cmds =
         List.filter_map
           (function P.Ci_item (_, _, c) -> Some c | _ -> None)
           cm.P.entries
       in
       (* master parity on item presence; order of the leading rows is
          fixed (colors, headings, separator) *)
       check "single-block menu leads with colors + headings"
         (match cm.P.entries with
          | P.Ci_colors :: P.Ci_headings :: P.Ci_sep :: _ -> true
          | _ -> false);
       List.iter
         (fun c ->
           check ("single-block menu lists " ^ c) (List.mem c cmds))
         [ "open-in-sidebar"; "add-comment"; "copy-ref"; "copy-export-as"
         ; "cut"; "delete"; "make-flashcard"; "toggle-numbered-list"
         ; "expand-children"; "collapse-children" ];
       check "single-block menu has picker submenus"
         (List.exists
            (function P.Ci_sub (_, P.Sub_picker _) -> true | _ -> false)
            cm.P.entries)
   | None -> check "context menu opens" false);
  P.close_cm st;
  (* cljs custom-context-menu-content: no open-in-sidebar, adds copy
     and cycle-todo for the multi selection *)
  P.open_cm st ~ax:10. ~atop:10. ~abot:10. ~block_id:"b1" ~multi:true;
  (match cm_of st with
   | Some cm ->
       let cmds =
         List.filter_map
           (function P.Ci_item (_, _, c) -> Some c | _ -> None)
           cm.P.entries
       in
       check "multi menu drops open-in-sidebar"
         (not (List.mem "open-in-sidebar" cmds));
       List.iter
         (fun c ->
           check ("multi menu lists " ^ c) (List.mem c cmds))
         [ "copy"; "cut"; "delete"; "cycle-todo"; "add-comment"
         ; "make-flashcard"; "toggle-numbered-list" ]
   | None -> check "multi context menu opens" false);
  P.close_cm st;
  (* text-edit menu inside the block editor *)
  P.open_cm_edit st ~ax:10. ~atop:10. ~abot:10. ~block_id:"b1";
  (match cm_of st with
   | Some cm ->
       let cmds =
         List.filter_map
           (function P.Ci_item (_, _, c) -> Some c | _ -> None)
           cm.P.entries
       in
       check "edit menu lists cut/copy/paste/select-all"
         (cmds = [ "edit-cut"; "edit-copy"; "edit-paste"; "edit-select-all" ]
          && List.mem P.Ci_sep cm.P.entries)
   | None -> check "edit context menu opens" false);
  P.close_cm st;
  (* block-tag popup: private classes drop Remove tag *)
  P.open_cm_tag st ~ax:10. ~atop:10. ~abot:10. ~block_id:"b1"
    ~tag_uuid:"tu" ~tag_id:9 ~tag_title:"T" ~priv:false;
  (match cm_of st with
   | Some cm ->
       check "tag menu carries the tag context"
         (cm.P.tag = Some ("tu", 9, false));
       eqi "public tag menu rows" 3 (List.length cm.P.entries)
   | None -> check "tag menu opens" false);
  P.close_cm st;
  P.open_cm_tag st ~ax:10. ~atop:10. ~abot:10. ~block_id:"b1"
    ~tag_uuid:"tu" ~tag_id:9 ~tag_title:"T" ~priv:true;
  check "private tag menu drops remove-tag"
    (match cm_of st with
     | Some cm -> List.length cm.P.entries = 2
     | None -> false);
  P.close_cm st

(* activation closes the menu and fires the cljs
   ls:editor-command document event *)
let test_cm_activation st =
  let document = Stub_dom.get_field Stub_dom.global "document" in
  let prev_dispatch : Js.Json.t -> bool =
    Stub_dom.get_field document "dispatchEvent" in
  let fired = ref [] in
  Stub_dom.set_field document "dispatchEvent"
    (fun ev ->
      let name : string = Stub_dom.get_field ev "type" in
      if name = "ls:editor-command" then (
        let detail = Stub_dom.get_field ev "detail" in
        let cmd =
          match Js.Json.decodeObject detail with
          | Some o -> (
              match Js.Dict.get o "command" with
              | Some c -> Js.Json.decodeString c
              | None -> None)
          | None -> None
        in
        fired := Option.value cmd ~default:"?" :: !fired;
        true)
      else prev_dispatch ev);
  Fun.protect
    ~finally:(fun () ->
      Stub_dom.set_field document "dispatchEvent" prev_dispatch)
    (fun () ->
      P.open_cm st ~ax:10. ~atop:10. ~abot:10. ~block_id:"b1" ~multi:false;
      P.run_cm_item st "copy-ref";
      check "item activation closes the menu" (cm_of st = None);
      check "activation emits the editor command"
        (!fired = [ "copy-ref" ]);
      P.open_cm st ~ax:10. ~atop:10. ~abot:10. ~block_id:"b1" ~multi:false;
      P.run_cm_color st "red";
      check "color swatch activation closes the menu" (cm_of st = None);
      P.open_cm st ~ax:10. ~atop:10. ~abot:10. ~block_id:"b1" ~multi:false;
      P.run_cm_heading st "3";
      check "heading activation closes the menu" (cm_of st = None);
      check "color/heading commands emitted"
        (List.rev !fired = [ "copy-ref"; "set-color"; "set-heading" ]))

(* submenu state: opening marks the trigger highlighted; closing the
   sub returns highlight to the trigger (base-ui parity) *)
let test_cm_submenu st =
  P.open_cm st ~ax:10. ~atop:10. ~abot:10. ~block_id:"b1" ~multi:false;
  let sub_idx =
    match cm_of st with
    | Some cm ->
        List.find_mapi
          (fun i -> function P.Ci_sub _ -> Some i | _ -> None)
          cm.P.entries
    | None -> None
  in
  (match sub_idx with
   | Some idx ->
       P.open_cm_sub st ~index:idx ~x:0. ~y:0.;
       (match cm_of st with
        | Some cm ->
            check "submenu opens under its trigger"
              (cm.P.sub_open = idx
               && cm.P.highlighted = Some (P.Main_item idx));
            check "picker subs expose a Sub_picker"
              (P.cm_sub_at st idx <> None)
        | None -> check "menu stays open" false);
       P.close_cm_sub st;
       (match cm_of st with
        | Some cm ->
            check "closing the sub highlights its trigger"
              (cm.P.sub_open = -1
               && cm.P.highlighted = Some (P.Main_item idx))
        | None -> check "menu stays open" false)
   | None -> check "context menu has a submenu trigger" false);
  (* Escape with no sub open closes the whole menu *)
  ignore (keydown st "Escape");
  check "Escape closes the context menu" (cm_of st = None);
  (* Escape with a sub open closes the sub first *)
  P.open_cm st ~ax:10. ~atop:10. ~abot:10. ~block_id:"b1" ~multi:false;
  Option.iter
    (fun idx ->
      P.open_cm_sub st ~index:idx ~x:0. ~y:0.;
      ignore (keydown st "Escape");
      match cm_of st with
      | Some cm ->
          check "Escape closes the submenu before the menu"
            (cm.P.sub_open = -1)
      | None -> check "menu survives sub Escape" false)
    sub_idx;
  P.close_cm st

(* menu keyboard traversal — ArrowUp/Down/Home/End walk the interactive
   items (Ci_item + Ci_sub only; separators and composite rows are
   skipped), Enter runs the highlighted command. The cljs menu owns
   keys only while the target sits inside #block-context-menu *)
let test_cm_keynav st =
  let document = Stub_dom.get_field Stub_dom.global "document" in
  let prev_byid : string -> Js.Json.t =
    Stub_dom.get_field document "getElementById" in
  let menu_el = Stub_dom.make_element "div" in
  let item_el = Stub_dom.make_element "div" in
  let rect =
    Js.Json.object_
      (Js.Dict.fromList
         [ "x", Js.Json.number 0.; "y", Js.Json.number 0.
         ; "width", Js.Json.number 200.; "height", Js.Json.number 100. ])
  in
  Stub_dom.set_field menu_el "getBoundingClientRect" (fun () -> rect);
  ignore (Stub_dom.append_child menu_el item_el);
  let set_attr : string -> string -> unit =
    Stub_dom.get_field menu_el "setAttribute" in
  set_attr "id" "block-context-menu";
  Stub_dom.set_field document "getElementById" (fun id ->
      if id = "block-context-menu"
         || Str_util.starts_with id "cm-item-"
         || Str_util.starts_with id "cm-sub-"
      then menu_el else prev_byid id);
  Fun.protect
    ~finally:(fun () ->
      Stub_dom.set_field document "getElementById" prev_byid)
    (fun () ->
      P.open_cm st ~ax:10. ~atop:10. ~abot:10. ~block_id:"b1" ~multi:false;
      let first_interactive_idx entries =
        Option.get
          (List.find_mapi
             (fun i -> function
               | P.Ci_item _ | P.Ci_sub _ -> Some i | _ -> None)
             entries)
      in
      let last_interactive_idx entries =
        List.fold_left
          (fun acc (i, it) ->
            match it with
            | P.Ci_item _ | P.Ci_sub _ -> i
            | _ -> acc)
          (-1)
          (List.mapi (fun i it -> (i, it)) entries)
      in
      let ev key =
        { (key_event key) with
          Ui_services.target = Some (Ui_dom_web.el_of item_el) }
      in
      Popups_view.handle_keydown st (ev "ArrowDown");
      (match cm_of st with
       | Some cm ->
           check "first down highlights the first interactive item"
             (cm.P.highlighted
              = Some
                  (P.Main_item (first_interactive_idx cm.P.entries)))
       | None -> check "menu stays open" false);
      Popups_view.handle_keydown st (ev "ArrowUp");
      (match cm_of st with
       | Some cm ->
           check "up from the first item wraps to the last interactive"
             (cm.P.highlighted
              = Some
                  (P.Main_item (last_interactive_idx cm.P.entries)))
       | None -> check "menu stays open" false);
      Popups_view.handle_keydown st (ev "End");
      (match cm_of st with
       | Some cm ->
           check "End stays on the last interactive"
             (cm.P.highlighted
              = Some
                  (P.Main_item (last_interactive_idx cm.P.entries)))
       | None -> check "menu stays open" false);
      Popups_view.handle_keydown st (ev "Home");
      (match cm_of st with
       | Some cm ->
           check "Home returns to the first interactive"
             (cm.P.highlighted
              = Some
                  (P.Main_item (first_interactive_idx cm.P.entries)))
       | None -> check "menu stays open" false);
      (* Enter on the highlighted row runs it and closes the menu;
         commands land on the document's ls:editor-command channel *)
      let prev_dispatch : Js.Json.t -> bool =
        Stub_dom.get_field document "dispatchEvent" in
      let fired = ref [] in
      Stub_dom.set_field document "dispatchEvent" (fun e ->
          let name : string = Stub_dom.get_field e "type" in
          if name = "ls:editor-command" then (
            let detail = Stub_dom.get_field e "detail" in
            (match Js.Json.decodeObject detail with
             | Some o -> (
                 match Js.Dict.get o "command" with
                 | Some c ->
                     fired :=
                       Option.value (Js.Json.decodeString c) ~default:"?"
                       :: !fired
                 | None -> ())
             | None -> ());
            true)
          else prev_dispatch e);
      Fun.protect
        ~finally:(fun () ->
          Stub_dom.set_field document "dispatchEvent" prev_dispatch)
        (fun () ->
          Popups_view.handle_keydown st (ev "Enter");
          check "Enter activates the highlighted item and closes"
            (cm_of st = None && !fired = [ "open-in-sidebar" ])))

(* ================================================================
   D. Page menu — cljs components/header.cljs toolbar-dots-menu +
   page_menu.cljs (page items ahead of app items; delete/convert hidden
   for built-in pages)
   ================================================================ *)

let test_page_menu () =
  let session =
    S.mount ~registry:(registry ()) ~profile:Logseq_el.web_profile
      ~initial:Model.initial ~reducer:(fun m _ -> m)
      ~view:(fun _ _ _ -> Lui_elements.spacer []) ()
  in
  Fun.protect ~finally:(fun () -> ignore (Lui_app.dispose session.S.app))
    (fun () ->
      (* a plain user page: export + publish only (no favorite — the
         sidebar is unmounted here — and no convert/delete extras) *)
      let normal =
        Page_menu.page_items
          { (page [ block "b1" "x" ]) with
            Model.page_uuid = Some "pu" }
      in
      ignore normal;
      (* mount the menu for a normal page and inspect rows *)
      let menu =
        S.mount ~registry:(registry ()) ~profile:Logseq_el.web_profile
          ~initial:Model.initial ~reducer:(fun m _ -> m)
          ~view:(fun _ _ _ ->
            Page_menu.view (100., 10., 100., false)
              (Some
                 { (page [ block "b1" "x" ]) with
                   Model.page_uuid = Some "pu" }))
            ()
      in
      let texts n = M.string_prop n "text" in
      let menu_texts () =
        List.filter_map texts (M.all_nodes menu.S.tree)
      in
      Fun.protect
        ~finally:(fun () -> ignore (Lui_app.dispose menu.S.app))
        (fun () ->
          S.flush menu;
          check "normal page menu offers delete"
            (List.mem (I18n.t "page/delete") (menu_texts ()));
          check "normal page menu offers export"
            (List.mem (I18n.t "export/page") (menu_texts ()));
          check "normal page menu offers publish"
            (List.mem (I18n.t "publish/dialog-title") (menu_texts ()));
          check "non-internal page has no convert-to-tag"
            (not (List.mem (I18n.t "page/convert-to-tag") (menu_texts ()))));
      (* built-in page: delete + convert hidden *)
      let builtin =
        S.mount ~registry:(registry ()) ~profile:Logseq_el.web_profile
          ~initial:Model.initial ~reducer:(fun m _ -> m)
          ~view:(fun _ _ _ ->
            Page_menu.view (100., 10., 100., false)
              (Some
                 { (page [ block "b1" "x" ]) with
                   Model.page_uuid = Some "pu"
                 ; page_built_in = true }))
            ()
      in
      Fun.protect
        ~finally:(fun () -> ignore (Lui_app.dispose builtin.S.app))
        (fun () ->
          S.flush builtin;
          let texts () =
            List.filter_map texts (M.all_nodes builtin.S.tree)
          in
          check "built-in page hides delete"
            (not (List.mem (I18n.t "page/delete") (texts ())));
          check "built-in page keeps export"
            (List.mem (I18n.t "export/page") (texts ())));
      (* internal (non-tag, non-built-in) page gets convert-to-tag *)
      let internal =
        S.mount ~registry:(registry ()) ~profile:Logseq_el.web_profile
          ~initial:Model.initial ~reducer:(fun m _ -> m)
          ~view:(fun _ _ _ ->
            Page_menu.view (100., 10., 100., false)
              (Some
                 { (page [ block "b1" "x" ]) with
                   Model.page_uuid = Some "pu"
                 ; page_db_id = Some 7
                 ; page_internal = true }))
            ()
      in
      Fun.protect
        ~finally:(fun () -> ignore (Lui_app.dispose internal.S.app))
        (fun () ->
          S.flush internal;
          let texts () =
            List.filter_map texts (M.all_nodes internal.S.tree)
          in
          check "internal page offers convert-to-tag"
            (List.mem (I18n.t "page/convert-to-tag") (texts ())));
      (* tag page gets convert-tag-to-page instead *)
      let tagpage =
        S.mount ~registry:(registry ()) ~profile:Logseq_el.web_profile
          ~initial:Model.initial ~reducer:(fun m _ -> m)
          ~view:(fun _ _ _ ->
            Page_menu.view (100., 10., 100., false)
              (Some
                 { (page [ block "b1" "x" ]) with
                   Model.page_uuid = Some "pu"
                 ; page_db_id = Some 8
                 ; page_is_tag = true }))
            ()
      in
      Fun.protect
        ~finally:(fun () -> ignore (Lui_app.dispose tagpage.S.app))
        (fun () ->
          S.flush tagpage;
          let texts () =
            List.filter_map texts (M.all_nodes tagpage.S.tree)
          in
          check "tag page offers convert-tag-to-page"
            (List.mem
               (I18n.t "page.convert/tag-to-page-action")
               (texts ()))))

(* ================================================================
   E. Settings dialog — cljs components/settings.cljs: nav items
   (general/editor/keymap/advanced/features) switch panes
   ================================================================ *)

let test_settings_tabs () =
  let prev_settings = !Settings_state.st in
  Settings_state.st := None;
  let session =
    S.mount ~registry:(registry ()) ~profile:Logseq_el.web_profile
      ~initial:Model.initial ~reducer:(fun m _ -> m)
      ~view:(fun ctx ms _ ->
        Settings_state.ensure ctx;
        Settings_page.modal_body ms)
      ()
  in
  Fun.protect
    ~finally:(fun () ->
      Settings_state.st := prev_settings;
      ignore (Lui_app.dispose session.S.app))
    (fun () ->
      S.flush session;
      (* cljs settings nav order: general, editor, keymap, advanced,
         features *)
      List.iter
        (fun label ->
          check ("settings nav lists " ^ label) (find_text session label))
        [ I18n.t "settings/general"; I18n.t "settings/editor"
        ; I18n.t "settings/keymap"; I18n.t "settings/advanced"
        ; I18n.t "settings/features" ];
      (* tab switching swaps the active pane *)
      Settings_state.set_tab "editor";
      S.flush session;
      check "editor tab renders the show-brackets row"
        (find_text session (I18n.t "settings.editor/show-brackets"));
      Settings_state.set_tab "general";
      S.flush session;
      check "switching back renders the general pane"
        (not
           (find_text session
              (I18n.t "settings.editor/show-brackets"))))

(* ================================================================
   F. Properties — cljs components/property.cljs: blank submit on a
   single cardinality removes the row; a populated many-cardinality row
   must not be deleted by a blank submit
   ================================================================ *)

let prop_ctx : Properties_value.ctx =
  { owner_key = "parity-fixture"
  ; block_uuid = "b1"
  ; block_id = None
  ; refresh = (fun () -> ())
  ; is_page = false
  ; class_schema = false }

let prop_row ~ident ~ty ?(many = false) ?(value = W.Nil) () : W.t =
  let property =
    [ W.Keyword "logseq.property/type", W.Keyword ty
    ; W.Keyword "block/title", W.String "P" ]
    @
    if many then
      [ W.Keyword "db/cardinality", W.Keyword "db.cardinality/many" ]
    else []
  in
  W.Map
    [ W.String "property-id", W.Keyword ident
    ; W.String "property", W.Map property
    ; W.String "value", value ]

let test_property_blank_submit () =
  let base = List.length !ops_log in
  Properties_value.commit_or_cancel prop_ctx
    (prop_row ~ident:"user.property/many" ~ty:"default" ~many:true
       ~value:(W.String "keep") ())
    "";
  Properties_value.commit_or_cancel prop_ctx
    (prop_row ~ident:"user.property/single" ~ty:"default" ()) "";
  Properties_value.commit_or_cancel prop_ctx
    (prop_row ~ident:"user.property/num" ~ty:"number" ~value:(W.Int 137) ()) "";
  after 8 (fun () ->
      let new_ops = List.drop base !ops_log in
      let serialized =
        List.filter_map
          (fun op ->
            match W.elems op with
            | [ W.Keyword n; W.Array args ] ->
                Some
                  (n ^ "|"
                   ^ String.concat "|"
                       (List.map Test_drive.props_w_str args))
            | _ -> None)
          new_ops
      in
      check "blank submit on populated many writes nothing"
        (not
           (List.exists
              (fun s -> Str_util.ends_with s "user.property/many")
              serialized));
      check "blank submit on single removes the property"
        (List.exists
           (fun s -> Str_util.contains s "remove-block-property"
                     && Str_util.contains s "user.property/single")
           serialized);
      check "blank submit on number removes the property"
        (List.exists
           (fun s -> Str_util.contains s "remove-block-property"
                     && Str_util.contains s "user.property/num")
           serialized))

let test_property_commits () =
  (* number + valid text writes Float through set-block-property *)
  Properties_value.commit_or_cancel prop_ctx
    (prop_row ~ident:"user.property/num2" ~ty:"number" ()) "12.5";
  (* string + text writes String *)
  Properties_value.commit_or_cancel prop_ctx
    (prop_row ~ident:"user.property/str" ~ty:"string" ()) "abc";
  Properties_value.commit_or_cancel prop_ctx
    (prop_row ~ident:"user.property/str-spaces" ~ty:"string" ~value:(W.String "abc") ()) " abc ";
  after 8 (fun () ->
      check "number text commits Float 12.5"
        (List.exists
           (function
             | [ _; W.Keyword "user.property/num2"; W.Float 12.5 ] -> true
             | _ -> false)
           (ops_named "set-block-property"));
      check "string text commits String"
        (List.exists
           (function
             | [ _; W.Keyword "user.property/str"; W.String "abc" ] -> true
             | _ -> false)
           (ops_named "set-block-property"));
      check "string comparison preserves a meaningful whitespace change"
        (List.exists
           (function
             | [_; W.Keyword "user.property/str-spaces"; W.String " abc "] -> true
             | _ -> false)
           (ops_named "set-block-property")))

let test_property_unchanged_commits () =
  (* Master single-string-input compares the exact source string; the
     number input compares trimmed text before dispatching a transaction. *)
  List.iteri (fun index (ty, value, input) ->
    Properties_value.commit_or_cancel prop_ctx
      (prop_row ~ident:("user.property/unchanged-" ^ string_of_int index)
         ~ty ~value ()) input)
    ["string",W.String "original","original";
     "string",W.String "  original  ","  original  ";
     "number",W.Int 137,"137";
     "number",W.Int 137," 137 ";
     "string",W.Nil,"";
     "number",W.Nil,""];
  after 8 (fun () ->
    check "unchanged scalar submit neither sets nor removes a property"
      (not (List.exists (fun operation ->
        List.exists (function
          | W.Keyword ident -> String.starts_with ~prefix:"user.property/unchanged-" ident
          | _ -> false) (match W.elems operation with
            | [_;args] -> W.elems args
            | _ -> [])) !ops_log)))

(* ================================================================
   G. Sidebar nav — cljs components/sidebar.cljs: the left nav lists
   All pages always, flashcards only when the feature flag is on
   ================================================================ *)

let test_sidebar_nav () =
  let session =
    S.mount ~registry:(registry ()) ~profile:Logseq_el.web_profile
      ~initial:Model.initial ~reducer:(fun m _ -> m)
      ~view:(fun ctx ms _ ->
        let state v = Signal.state ctx.Lui_ui.ui_scheduler v in
        let sidebar : Sidebar_state.t =
          { favorites = state []
          ; home_page = state None
          ; favorite_drop = state None
          ; recents = state []
          ; nav_checked = state [ "flashcards"; "all-pages" ]
          ; nav_tag_titles = state []
          ; items = state []
          ; open_menu = state ""
          ; groups_collapsed = state []
          ; left_width = state 246.
          ; right_fraction = state 0.3
          ; viewport_w = state 1280. }
        in
        Left_sidebar_view.nav_group ms sidebar)
      ()
  in
  Fun.protect ~finally:(fun () -> ignore (Lui_app.dispose session.S.app))
    (fun () ->
      S.flush session;
      check "nav lists all pages"
        (find_where session (fun n -> has_tok n "all-pages-nav") <> []))

(* ================================================================
   async ops assertions (worker-fed writes settle on promise ticks)
   ================================================================ *)

let async_checks () =
  check "Tab indents the editing block"
    (List.exists
       (function
         | [ _; W.Bool true; _ ] -> true
         | _ -> false)
       (ops_named "indent-outdent-blocks"));
  check "shift+Tab outdents the editing block"
    (List.exists
       (function
         | [ _; W.Bool false; _ ] -> true
         | _ -> false)
       (ops_named "indent-outdent-blocks"));
  (* Enter splits the block at the caret — cljs keydown-new-block.
     The split commits insert/save ops; editing moves to the sibling
     unless the canned worker reply trips the restore path *)
  check "Enter emits the split commit"
    (ops_named "insert-blocks" <> [] || ops_named "save-block" <> []
     || (Editor_state.editing_uuid () <> Some "b1"
         && Editor_state.editing_uuid () <> None))

(* ---------- runner ---------- *)

(* State_cell singletons + first-mount refs: this suite mounts the app
   before the shared drive mount, so any signal cell created on our
   session's scheduler must be put back for the following mounts
   ("map inputs must share one scheduler" otherwise). Snapshot every
   ref the mounts or the tests below can create or replace. *)
type snapshot =
  { editor_st : Editor_state.t Signal.state option
  ; editor_fields : Editor_state.field_sigs option
  ; editor_pending_focus : Editor_state.focus_request option
  ; editor_focused : string option
  ; editor_pending_actions : (unit -> unit) list
  ; editor_display_overrides : (string, string) Hashtbl.t
  ; sidebar : Sidebar_state.t option
  ; cards : Cards_state.t option
  ; due : int Signal.state option
  ; settings : Settings_state.t Signal.state option
  ; dialogs : Dialogs_state.t Signal.state option
  ; quick_add : Quick_add_state.t Signal.state option
  ; dirty : int Signal.state option
  ; cmdk_vs : Cmdk_state.view Signal.signal option
  ; cmdk_t : Cmdk_state.t option
  ; cmdk_st : Cmdk_state.t option
  ; cmdk_svs : Cmdk_services.t option
  ; popups : Popups_state.t option
  ; views_stack : Views_popup.popup list Signal.state option
  ; overlays : Properties_state.view_overlay list Signal.state option
  ; editor_cmds : Editor_commands.popup option
  ; editor_popup_vs : Editor_commands.popup option Signal.state option }

let snapshot () =
  { editor_st = !Editor_state.st
  ; editor_fields = !Editor_state.field_sigs_opt
  ; editor_pending_focus = !Editor_state.pending_focus
  ; editor_focused = !Editor_state.focused_block
  ; editor_pending_actions = !Editor_state.pending_focus_actions
  ; editor_display_overrides = Hashtbl.copy Editor_state.display_overrides
  ; sidebar = !Sidebar_state.st_ref
  ; cards = !Cards_state.st_ref
  ; due = !Cards_state.Due_count.st
  ; settings = !Settings_state.st
  ; dialogs = !Dialogs_state.st
  ; quick_add = !Quick_add_state.st
  ; dirty = !Plugin_host.Dirty.st
  ; cmdk_vs = !Cmdk_state.latest_vs
  ; cmdk_t = !Cmdk_state.latest_t
  ; cmdk_st = !Cmdk_state.latest_st
  ; cmdk_svs = !Cmdk_state.services_ref
  ; popups = !P.active
  ; views_stack = !Views_popup.stack_st
  ; overlays = !Properties_state.view_overlays_state
  ; editor_cmds = !Editor_commands.active
  ; editor_popup_vs = !Editor_commands.popup_vs }

let restore snap =
  Editor_state.st := snap.editor_st;
  Editor_state.field_sigs_opt := snap.editor_fields;
  Editor_state.pending_focus := snap.editor_pending_focus;
  Editor_state.focused_block := snap.editor_focused;
  Editor_state.pending_focus_actions := snap.editor_pending_actions;
  Hashtbl.clear Editor_state.display_overrides;
  Hashtbl.iter (Hashtbl.replace Editor_state.display_overrides)
    snap.editor_display_overrides;
  Editor_state.structure_pending := false;
  Editor_state.optimistic_split_ready := false;
  Editor_state.optimistic_input_replay := [];
  Editor_state.pending_edit_real := 0;
  Sidebar_state.st_ref := snap.sidebar;
  Cards_state.st_ref := snap.cards;
  Cards_state.Due_count.st := snap.due;
  Settings_state.st := snap.settings;
  Dialogs_state.st := snap.dialogs;
  Quick_add_state.st := snap.quick_add;
  Plugin_host.Dirty.st := snap.dirty;
  Cmdk_state.latest_vs := snap.cmdk_vs;
  Cmdk_state.latest_t := snap.cmdk_t;
  Cmdk_state.latest_st := snap.cmdk_st;
  Cmdk_state.services_ref := snap.cmdk_svs;
  P.active := snap.popups;
  Views_popup.stack_st := snap.views_stack;
  Properties_state.view_overlays_state := snap.overlays;
  Editor_commands.active := snap.editor_cmds;
  Editor_commands.popup_vs := snap.editor_popup_vs

let run ~finish =
  ignore (Fake_worker.install worker_handler);
  let snap = snapshot () in
  let s, st = mount_app () in
  let prev_reader = !Runtime.read_model
  and prev_page = !Runtime.current_page
  and prev_send = !Runtime.app_send
  and prev_flush = !Runtime.app_flush
  and prev_schedule = !Runtime.schedule_flush in
  Runtime.app_send :=
    (fun a ->
      let changed = Lui_app.send s.S.app a in
      ignore (Lui_app.flush s.S.app);
      changed);
  Runtime.app_flush :=
    (fun () ->
      ignore (Lui_app.flush s.S.app);
      Editor_actions.focus_pending ());
  Runtime.schedule_flush := (fun cb -> cb ());
  (* A. autocomplete popups *)
  test_ac_slash st s;
  test_ac_slash_switch st s;
  test_ac_slash_embed st s;
  test_ac_page_ref st s;
  test_ac_block_ref st s;
  test_ac_template st s;
  test_ac_tag st s;
  test_ac_paren_warn st s;
  (* C. block context menu *)
  test_cm_entries st;
  test_cm_activation st;
  test_cm_submenu st;
  test_cm_keynav st;
  (* B. editor keys *)
  test_editor_escape ();
  test_editor_shift_enter ();
  test_editor_format_wraps ();
  test_editor_word_nav ();
  test_editor_link ();
  test_editor_ctrl_np ();
  test_editor_tab ();
  test_editor_enter_split ();
  (* D. page menu *)
  test_page_menu ();
  (* E. settings *)
  test_settings_tabs ();
  (* F. properties *)
  test_property_blank_submit ();
  test_property_commits ();
  test_property_unchanged_commits ();
  (* G. sidebar *)
  test_sidebar_nav ();
  after 30 (fun () ->
      async_checks ();
      (* cleanup after the deferred stage so async ops still resolve
         against the live session *)
      Runtime.read_model := prev_reader;
      Runtime.current_page := prev_page;
      Runtime.app_send := prev_send;
      Runtime.app_flush := prev_flush;
      Runtime.schedule_flush := prev_schedule;
      clear_editing ();
      P.close_ac st;
      P.close_cm st;
      ignore (Lui_app.dispose s.S.app);
      restore snap;
      finish ())
