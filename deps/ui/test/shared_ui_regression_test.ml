(* Run the same shared views against the web and native recording hosts. *)
open Test_check
module M = Drive.Model
module S = Drive.Session
module P = Lui_protocol

let nodes s = M.all_nodes s.S.tree
let class_has n cls =
  List.mem cls
    (String.split_on_char ' '
       (Option.value (M.string_prop n "style-class") ~default:""))

let button_properties n =
  List.fold_left
    (fun props p ->
      match Hashtbl.find_opt n.M.props (Lui_wire_schema.property_name p) with
      | Some v -> P.Property_map.add p v props
      | None -> props)
    P.Property_map.empty [ P.TextValue; P.AccessibilityLabel ]

let run_views ~registry ~profile ~finish =
  let previous_flush = !Runtime.app_flush in
  let previous_preset = Ui_services.storage_get "ls-icon-color-preset" in
  let previous_used = Ui_services.storage_get "ls-icons-used" in
  let restore_storage key = function
    | Some value -> Ui_services.storage_set key value
    | None -> Ui_services.storage_remove key
  in
  let mount view =
    let s = S.mount ~registry ~profile ~initial:Model.initial
      ~reducer:(fun m () -> m) ~view:(fun _ctx ms _send -> view ms) () in
    Runtime.app_flush := (fun () -> S.flush s);
    s
  in
  let chosen = ref None in
  let picker = mount (fun _ ->
      Icon_picker.picker_view ~del:true ~emoji_only:false
        ~on_chosen:(fun c -> chosen := Some c) ~close:(fun () -> ())) in
  let buttons () = List.filter (fun n -> n.M.kind = "button") (nodes picker) in
  let labelled () = List.for_all (fun n ->
      P.node_properties_supported P.Button (button_properties n)) (buttons ()) in
  check "icon picker buttons satisfy the host label contract" (labelled ());
  let presets () = List.filter (fun n -> class_has n "it") (buttons ()) in
  check "icon color presets start closed" (presets () = []);
  let trigger = List.find (fun n -> class_has n "color-picker") (buttons ()) in
  S.press picker trigger.M.id;
  eqi "palette trigger opens every preset" 9 (List.length (presets ()));
  check "color preset buttons satisfy the host label contract" (labelled ());
  S.press picker trigger.M.id;
  check "palette trigger closes presets" (presets () = []);
  S.press picker trigger.M.id;
  (match List.find_opt (fun n -> M.string_prop n "background" = Some "#6e7b8b") (presets ()) with
   | Some n -> S.press picker n.M.id
   | None -> check "gray preset exists" false);
  check "selecting a preset closes the palette" (presets () = []);
  eqs "selected icon color is persisted" "#6e7b8b"
    (Option.value (Ui_services.storage_get "ls-icon-color-preset") ~default:"");
  let icon = List.find_opt (fun n -> class_has n "ls-emoji-cell") (buttons ()) in
  (match icon with
   | Some n -> S.press picker n.M.id;
       check "selected icon carries the preset color"
         (match !chosen with Some (Icon_picker.Tabler (_, Some "#6e7b8b")) -> true | _ -> false)
   | None -> check "icon picker renders icon buttons" false);
  ignore (Lui_app.dispose picker.S.app);
  restore_storage "ls-icon-color-preset" previous_preset;
  restore_storage "ls-icons-used" previous_used;
  let actions = ref 0 in
  let menu = mount (fun _ -> Menu_item.dots_menu ~key:"parity-actions"
      [ "", "Enabled", false, (fun () -> incr actions)
      ; "", "Disabled", true, (fun () -> incr actions) ]) in
  let trigger = List.find (fun n -> class_has n "graph-action-btn") (nodes menu) in
  check "graph and member action triggers have an accessible label"
    (P.node_properties_supported P.Button (button_properties trigger));
  let menu_nodes () = List.filter (fun n -> n.M.kind = "dropdown-menu") (nodes menu) in
  S.press menu trigger.M.id;
  eqi "action trigger opens one menu" 1 (List.length (menu_nodes ()));
  check "open action trigger announces expanded state"
    (match M.string_prop trigger "data-attrs" with
     | Some raw -> Str_util.contains raw "aria-expanded" && Str_util.contains raw "true"
     | None -> false);
  S.press menu trigger.M.id;
  check "action trigger toggles the menu closed" (menu_nodes () = []);
  S.press menu trigger.M.id;
  let disabled = List.find (fun n -> M.string_prop n "text" = Some "Disabled") (nodes menu) in
  check "disabled menu actions are disabled at the host boundary"
    (Hashtbl.find_opt disabled.M.props "enabled" = Some (P.BoolValue false));
  eqi "no action fires when the menu opens" 0 !actions;
  check "disabled menu action keeps the menu open" (menu_nodes () <> []);
  let enabled = List.find (fun n -> M.string_prop n "text" = Some "Enabled") (nodes menu) in
  S.press menu enabled.M.id;
  eqi "enabled menu action is invoked once" 1 !actions;
  check "enabled menu action closes its menu" (menu_nodes () = []);
  ignore (Lui_app.dispose menu.S.app);
  let language_view _ ctx parent =
    let label = Signal.state ctx.Lui_ui.ui_scheduler "English" in
    Settings_view.lang_trigger ~ctx ~key:"parity-language" ~h_cls:""
      ~st:label ctx parent
  in
  let language = mount language_view in
  let trigger = List.find (fun n -> n.M.kind = "select") (nodes language) in
  S.press language trigger.M.id;
  check "settings language picker opens"
    (List.exists (fun n -> n.M.kind = "dropdown-menu") (nodes language));
  ignore (Lui_app.dispose language.S.app);
  let reopened = mount language_view in
  check "reopening settings starts with its language picker closed"
    (not (List.exists (fun n -> n.M.kind = "dropdown-menu") (nodes reopened)));
  ignore (Lui_app.dispose reopened.S.app);
  let storage_key = "parity-server-url" in
  let previous_url = Ui_services.storage_get storage_key in
  Ui_services.storage_remove storage_key;
  let editor = mount (fun ms -> Settings_url_view.url_editor_body
      ~key:"parity-url" ~storage_key ~title:"Server" ~desc:"Address"
      ~placeholder:"https://example.com" ~saved_msg:"Saved" ~cleared_msg:"Cleared"
      ~on_saved:(fun () -> ()) ms) in
  let reset_buttons () = List.filter (fun n -> M.string_prop n "text" = Some I18n.reset_default) (nodes editor) in
  check "empty URL editor hides Reset" (reset_buttons () = []);
  let input = List.find (fun n -> n.M.kind = "input") (nodes editor) in
  S.text_changed editor input.M.id "https://example.com";
  eqi "typing a URL reveals Reset" 1 (List.length (reset_buttons ()));
  check "URL input text follows the edit state"
    (M.string_prop input "text" = Some "https://example.com");
  S.text_changed editor input.M.id "";
  check "clearing a URL hides Reset" (reset_buttons () = []);
  check "URL input retains its mounted identity while editing"
    (List.exists (fun n -> n.M.id = input.M.id) (nodes editor));
  ignore (Lui_app.dispose editor.S.app);
  restore_storage storage_key previous_url;
  let notifications = S.mount ~registry ~profile ~initial:Model.initial
      ~reducer:Update.update ~view:(fun _ctx ms _send -> Toasts_view.render ms) () in
  let push kind text =
    ignore (Lui_app.send notifications.S.app
        (Action.Toast_push { Model.toast_id = 0; toast_text = text;
          toast_kind = kind; toast_key = None }));
    S.flush notifications
  in
  push "success" "First";
  let first = List.find (fun n -> n.M.kind = "toast") (nodes notifications) in
  check "notifications use the platform toast lifecycle" (first.M.kind = "toast");
  push "error" "Persistent";
  check "adding a notification preserves previous toast identity"
    (List.exists (fun n -> n.M.id = first.M.id) (nodes notifications));
  let persistent = List.find (fun n -> class_has n "error") (nodes notifications) in
  check "error notifications have no auto-dismiss duration"
    (Hashtbl.find_opt persistent.M.props "duration" = Some (P.IntValue 0));
  ignore (Lui_app.dispose notifications.S.app);
  let key_handler = ref (fun (_ : Ui_services.ev) -> ()) in
  let key_event key =
    { Ui_services.x = 0.; y = 0.; shift = false; meta = false; ctrl = false;
      alt = false; composing = false; key = Some key; buttons = 0; button = 0;
      repeat = false; movement_x = 0.; movement_y = 0.; default_prevented = false;
      target = None; touches = []; detail = (fun _ -> None);
      detail_json = (fun _ -> None); clipboard_get = (fun _ -> "");
      clipboard_set = (fun _ _ -> ()); data_transfer_get = (fun _ -> "");
      files = []; has_files = false; prevent_default = (fun () -> ());
      stop_propagation = (fun () -> ()); stop_immediate = (fun () -> ()) }
  in
  let empty_menu = mount (fun _ -> Views_popup.menu_level ~pid:9001 ~cls:""
      ~register:(fun h -> key_handler := h) [ Views_popup.MSep ]) in
  check "empty view-action menu safely ignores navigation"
    (try !key_handler (key_event "ArrowDown"); true with Division_by_zero -> false);
  ignore (Lui_app.dispose empty_menu.S.app);
  let submenu = mount (fun _ -> Views_popup.menu_level ~pid:9002 ~cls:""
      ~register:(fun h -> key_handler := h)
      [ Views_popup.MSub ("Nested", [ Views_popup.MItem ("Child", (fun () -> ())) ]) ]) in
  let trigger = List.find (fun n -> M.string_prop n "text" = Some "Nested") (nodes submenu) in
  S.press submenu trigger.M.id;
  let submenus () = List.filter (fun n -> n.M.kind = "popover") (nodes submenu) in
  eqi "view-action submenu opens" 1 (List.length (submenus ()));
  !key_handler (key_event "ArrowLeft");
  S.flush submenu;
  check "ArrowLeft closes only the view-action submenu" (submenus () = []);
  check "closing a submenu preserves its parent trigger"
    (List.exists (fun n -> n.M.id = trigger.M.id) (nodes submenu));
  ignore (Lui_app.dispose submenu.S.app);
  let previous_cmdk =
    (!Cmdk_state.latest_vs, !Cmdk_state.latest_t, !Cmdk_state.latest_st,
     !Cmdk_state.services_ref)
  in
  let handlers : Cmdk_services.handlers option ref = ref None in
  let services =
    { (Cmdk_host.services ()) with
      repo = (fun () -> None)
    ; focus_input_init = (fun _ -> ())
    ; install_listeners = (fun h -> handlers := Some h)
    }
  in
  let search = mount (fun ms -> Cmdk_view.render ~services ms) in
  let toggle_search () =
    ignore ((Option.get !handlers).Cmdk_services.key
      { key = "k"; meta = true; ctrl = false; shift = false; alt = false });
    S.flush search
  in
  let search_inputs () =
    List.filter (fun n -> class_has n "cp__cmdk-search-input") (nodes search)
  in
  toggle_search ();
  check "search shortcut mounts its input" (search_inputs () <> []);
  (match List.find_opt (fun n -> n.M.kind = "dialog") (nodes search) with
   | None -> check "search exposes a host-owned dismissible modal" false
   | Some modal ->
       S.dismiss search modal.M.id;
       check "host dismissal closes the search input" (search_inputs () = []);
       toggle_search ();
       check "search reopens after host dismissal" (search_inputs () <> []);
       toggle_search ();
       check "search shortcut closes the reopened input" (search_inputs () = []));
  ignore (Lui_app.dispose search.S.app);
  let vs, current, shortcuts, services = previous_cmdk in
  Cmdk_state.latest_vs := vs;
  Cmdk_state.latest_t := current;
  Cmdk_state.latest_st := shortcuts;
  Cmdk_state.services_ref := services;
  let remote_before = !Graphs_view.remote_st_ref in
  let members_before = !Collaborators.members_sig_ref in
  let repos_changed_before = !Graphs_ops.on_repos_changed in
  Graphs_view.remote_st_ref := None;
  Collaborators.members_sig_ref := None;
  let visible = ref None in
  let s = mount (fun ms ctx parent ->
      let st = Signal.state ctx.Lui_ui.ui_scheduler false in
      visible := Some st;
      Lui_elements.column
        [ Lui_elements.if_ ~test:(Signal.value st)
            (Lui_elements.column [ Graphs_view.view ms; Collaborators.body ms ]) ]
        ctx parent) in
  (* new Signal.subscribers is an opaque linked registry — probe leaked
     downstream work instead: publishing to the sources after unmount must
     perform no more computation than it did before the views mounted *)
  let sched =
    (Signal.signal_owner (Signal.value (Option.get !visible)))
  in
  let st r default =
    match !r with
    | Some s -> s
    | None ->
        let s = Signal.state sched default in
        r := Some s;
        s
  in
  let publish_work () =
    Signal.set (st Graphs_view.remote_st_ref []) [];
    Signal.set (st Collaborators.members_sig_ref ([], false)) ([], false);
    Signal.stabilize sched;
    let d = Signal.last_stabilization sched in
    d.Signal.stabilization_rounds + d.Signal.stabilization_dirty_tasks
  in
  let baseline = publish_work () in
  for cycle = 1 to 5 do
    Signal.set (Option.get !visible) true;
    S.flush s;
    Signal.set (Option.get !visible) false;
    S.flush s;
    check (Printf.sprintf "unmounted graph and members views release subscriptions (%d)" cycle)
      (publish_work () = baseline)
  done;
  ignore (Lui_app.dispose s.S.app);
  (* Logged-out graph refreshes resolve on the next web microtask. Let
     them finish against their original state before restoring globals. *)
  ignore (Js.Promise.then_ (fun () ->
      Graphs_view.remote_st_ref := remote_before;
      Collaborators.members_sig_ref := members_before;
      Graphs_ops.on_repos_changed := repos_changed_before;
      Runtime.app_flush := previous_flush;
      finish ();
      Js.Promise.resolve ()) (Js.Promise.resolve ()))

let popup_press (ev : Ui_services.ev) =
  let state_before = Editor_state.read () in
  Editor_state.set (fun v -> { v with editing = Some
      (Editor_state.mk_editing ~uuid:"b1" ~buffer:"text"
         ~scope:"main" ~base:"text" ()) });
  let popup : Editor_commands.popup =
    { kind = Editor_commands.Link_form false; uuid = "b1"; from = 0
    ; cy = 2026; cm = 10; cd = 9; hour = 0; tmin = 0; x = 0.; y = 0.
    ; menu = None; rpt = None } in
  Editor_commands.active := Some popup;
  Editor_keys.on_mousedown ev;
  check "pressing inside the editor popup keeps it open"
    (!Editor_commands.active <> None);
  check "pressing inside the editor popup does not schedule a blur commit"
    (!Editor_actions.pending_blur_uuid = None);
  Editor_actions.clear_pending_blur ();
  Editor_commands.active := None;
  Runtime.editor_popup_open := false;
  Editor_state.set (fun _ -> state_before)

let dates () =
  for month = 1 to 12 do
    let source = Printf.sprintf "2026-%02d-15T12:34:56" month in
    match Properties_value.parse_ms source with
    | None -> check ("property datetime parses " ^ source) false
    | Some ms ->
        let f = Ui_services.time_local_fields ms in
        check ("property datetime preserves local fields " ^ source)
          (f.year = 2026 && f.month = month && f.day = 15
           && f.hours = 12 && f.minutes = 34 && f.seconds = 56)
  done

let dialogs () =
  let previous = Dialogs_state.value () in
  Dialogs_state.close_all ();
  check "close-all clears named dialogs without a pending request"
    ((Dialogs_state.value ()).dialogs = []);
  Dialogs_state.open_ "layer-parent";
  Dialogs_state.ask ~title:"Confirm" ~desc:"Question" ~on_confirm:(fun () -> ()) ();
  Dialogs_state.open_ "layer-child";
  Dialogs_state.close_top ();
  check "closing the newest named dialog preserves its older confirmation"
    ((Dialogs_state.value ()).dialogs = [ "layer-parent" ]
     && Option.is_some (Dialogs_state.value ()).confirm);
  Dialogs_state.close_top ();
  check "the next dismissal closes the confirmation only"
    ((Dialogs_state.value ()).dialogs = [ "layer-parent" ]
     && (Dialogs_state.value ()).confirm = None);
  Dialogs_state.open_ "layer-child";
  Dialogs_state.close_all ();
  check "close-all clears every named layer"
    ((Dialogs_state.value ()).dialogs = []);
  let rejected = ref 0 in
  Dialogs_state.open_ui_request
    { ur_id = "parity-request"; ur_reason = "test";
      ur_reject = (fun () -> incr rejected) };
  Dialogs_state.close_all ();
  eqi "close-all rejects the blocking request once" 1 !rejected;
  check "close-all clears the blocking request" ((Dialogs_state.value ()).ui_request = None);
  List.iter (fun name -> check ("dialog event recognizes " ^ name) (Dialogs_state.known name))
    [ "sync-server"; "publish-server"; "rtc-collaborators"; "quick-add" ];
  Dialogs_state.set (fun _ -> previous)
