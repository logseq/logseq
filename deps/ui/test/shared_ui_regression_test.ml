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
  let previous_sidebar = !Sidebar_state.st_ref
  and previous_sidebar_model = !Sidebar_state.model_signal
  and previous_model = !Runtime.read_model
  and previous_worker = !Runtime.worker
  and previous_send = !Runtime.app_send in
  let page uuid = Option.get (Decode.page_of_summary
    (Wire.Map [Wire.Keyword "block/uuid",Wire.Uuid uuid;
               Wire.Keyword "block/title",Wire.String "Same title"])) in
  let target = page "menu-target" and current = page "current-route" in
  let sidebar = ref None in
  let menu = S.mount ~registry ~profile
    ~initial:{Model.initial with repo=Some "menu-fixture";route_page=Some current}
    ~reducer:(fun m () -> m) ~view:(fun ctx ms _ ->
      let state value = Signal.state ctx.Lui_ui.ui_scheduler value in
      let st : Sidebar_state.t =
        {favorites=state [target];recents=state [];nav_checked=state [];
         nav_tag_titles=state [];items=state [];
         open_menu=state "";groups_collapsed=state [];
         left_fraction=state 0.2;right_fraction=state 0.3;viewport_w=state 1440.} in
      sidebar:=Some st;Sidebar_state.st_ref:=Some st;Sidebar_state.model_signal:=Some ms;
      Lui_elements.column (Page_menu.page_items target @ [Left_sidebar_view.nav_edit_menu st])) () in
  let st = Option.get !sidebar in
  let item = nodes menu |> List.filter (fun n -> n.M.kind="menu-item")
    |> List.sort (fun a b -> Int.compare a.M.id b.M.id) |> List.hd in
  let label () = M.string_prop (List.find (fun n -> n.M.id=item.M.id) (nodes menu)) "text" in
  check "page menu reflects the target favorite instead of the current route"
    (label ()=Some I18n.unfavorite_page);
  check "navigation checkbox menu uses the translated Pages label"
    (List.exists (fun n -> M.string_prop n "text"=Some (I18n.t "nav.all-pages/label")) (nodes menu));
  Runtime.signal_set st.favorites [current]; S.flush menu;
  check "page menu reacts to favorite changes without remounting its row"
    (label ()=Some I18n.add_to_favorites);
  Runtime.signal_set st.favorites [target]; S.flush menu;
  check "page menu restores the target's favorite label with the same row identity"
    (label ()=Some I18n.unfavorite_page);
  let queried = ref [] in
  Runtime.worker:=Some {Worker_client.invoke_fn=(fun name args ->
      queried:=(name,args)::!queried;
      Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()));
    on_message=(fun _ _ -> ());dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
  Runtime.read_model:=(fun () -> Lui_app.model menu.S.app);
  Runtime.app_send:=(fun _ -> false);
  S.press menu item.M.id;
  check "page menu favorite action queries its target UUID"
    (List.exists (function
      | "thread-api/favorited-page?",[_;Wire.Uuid "menu-target"] -> true
      | _ -> false) !queried);
  check "page menu favorite action does not query the current route UUID"
    (not (List.exists (function
      | "thread-api/favorited-page?",[_;Wire.Uuid "current-route"] -> true
      | _ -> false) !queried));
  ignore (Lui_app.dispose menu.S.app);
  Sidebar_state.st_ref:=previous_sidebar;Sidebar_state.model_signal:=previous_sidebar_model;
  Runtime.read_model:=previous_model;Runtime.worker:=previous_worker;Runtime.app_send:=previous_send;
  List.iter (fun (name, title, query, expected) ->
    let palette = mount (fun ms ->
      let item : Cmdk_state.item =
        { ikey = name; idx = 0; gid = G_recently_updated; ititle = title
        ; info = None; header = None; iicon = ""; isc = ""; ibadge = No_badge
        ; act = Open_page name; ihl = false; imouse = false; iq = query } in
      let item_s = Signal.state (Signal.signal_owner ms) item in
      Cmdk_view.hl_span "label" (Signal.value item_s) (fun it -> it.Cmdk_state.ititle)) in
    let runs = nodes palette
      |> List.sort (fun a b -> Int.compare a.M.id b.M.id)
      |> List.filter_map (fun n -> M.string_prop n "text") in
    check ("command palette preserves Unicode text and spacing: " ^ name)
      (runs = expected);
    ignore (Lui_app.dispose palette.S.app))
    [ "date", "Oct 17th, 2026", "", [{js|Oct 17th, 2026|js}]
    ; "highlighted date", "Oct 17th, 2026", "17th",
        [{js|Oct |js}; "17th"; {js|, 2026|js}]
    ; "Unicode", {js|中文 café 😀|js}, {js|café|js},
        [{js|中文 |js}; {js|café|js}; {js| 😀|js}]
    ; "existing spaces", {js|a b  c|js}, "", [{js|a b  c|js}]
    ; "empty", "", "", [] ];
  List.iter (fun value ->
    List.iter (fun (name, view) ->
      let rendered = mount view in
      let text = nodes rendered |> List.filter_map (fun n -> M.string_prop n "text") in
      check (name ^ " preserves runtime Unicode: " ^ value) (text=[value]);
      ignore (Lui_app.dispose rendered.S.app))
      [ "settings shortcut", (fun _ -> Settings_controls.kbd_seq
          ~key:"unicode" ~binding:"custom" [value])
      ; "context menu shortcut", (fun _ -> Popups_view.cm_shortcut_el ("custom",[value]))
      ; "journal format menu", (fun ms ->
          let state = Signal.state (Signal.signal_owner ms) true in
          Settings_page.dfmt_menu ~key:"unicode" state [value] value) ])
    [ {js|中文|js}; {js|café|js}; {js|é|js}; {js|😀|js}; {js|a b|js} ];
  check "English fallback text emits its Unicode arrow without byte decoding"
    (I18n.t "settings.editor/preferred-outdenting-tip" =
      {js|The left side shows outdenting with the default setting, and the right shows outdenting with logical outdenting enabled → Learn more|js});
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
  let standard_item = mount (fun _ ->
      Menu_item.el ~key:"parity-menu-item" ~icon:(Icons.name_ref "search")
        ~label:"Action" ~on_click:(fun () -> ()) ()) in
  let standard_row = List.find (fun n -> n.M.kind = "menu-item") (nodes standard_item) in
  check "shared menu rows carry typed icon spacing"
    (Hashtbl.find_opt standard_row.M.props "gap" = Some (P.IntValue 4)
     && Hashtbl.find_opt standard_row.M.props "padding-horizontal" = Some (P.IntValue 8));
  ignore (Lui_app.dispose standard_item.S.app);
  let language_view _ ctx parent =
    let label = Signal.state ctx.Lui_ui.ui_scheduler "English" in
    Settings_view.lang_trigger ~ctx ~key:"parity-language" ~height:40
      ~st:label ctx parent
  in
  let language = mount language_view in
  let trigger = List.find (fun n -> n.M.kind = "select") (nodes language) in
  S.press language trigger.M.id;
  check "settings language picker opens"
    (List.exists (fun n -> n.M.kind = "dropdown-menu") (nodes language));
  let options = List.filter (fun n -> n.M.kind = "menu-item") (nodes language) in
  check "language options reserve a leading selection slot on every host"
    (options <> [] && List.for_all (fun n ->
         M.string_prop n "selection-placement" = Some "leading"
         && Hashtbl.find_opt n.M.props "padding-horizontal" = Some (P.IntValue 8)
         && Hashtbl.find_opt n.M.props "gap" = Some (P.IntValue 8)) options);
  ignore (Lui_app.dispose language.S.app);
  let reopened = mount language_view in
  check "reopening settings starts with its language picker closed"
    (not (List.exists (fun n -> n.M.kind = "dropdown-menu") (nodes reopened)));
  ignore (Lui_app.dispose reopened.S.app);
  let key_event ?(meta = false) ?(ctrl = false) ?(shift = false) ?(composing = false) key =
    { Ui_services.x = 0.; y = 0.; shift; meta; ctrl;
      alt = false; composing; key = Some key; key_char = None;
      buttons = 0; button = 0;
      repeat = false; movement_x = 0.; movement_y = 0.; default_prevented = false;
      target = None; touches = []; detail = (fun _ -> None);
      detail_json = (fun _ -> None); clipboard_get = (fun _ -> "");
      clipboard_set = (fun _ _ -> ()); data_transfer_get = (fun _ -> "");
      files = []; has_files = false; prevent_default = (fun () -> ());
      stop_propagation = (fun () -> ()); stop_immediate = (fun () -> ()) }
  in
  let previous_tip = !Tooltip.state and previous_armed = !Tooltip.armed_on
  and previous_timer = !Tooltip.timer in
  let pending = ref [] and next_timer = ref 0 and flushes = ref 0 in
  let window : Js.Json.t = Stub_dom.get_field Stub_dom.global "window" in
  let document : Js.Json.t = Stub_dom.get_field Stub_dom.global "document" in
  let previous_timeout : Js.Json.t = Stub_dom.get_field window "setTimeout"
  and previous_clear : Js.Json.t = Stub_dom.get_field window "clearTimeout" in
  let previous_query : string -> Js.Json.t = Stub_dom.get_field document "querySelector" in
  let bubble = Stub_dom.make_element "div" in
  Stub_dom.set_field bubble "getBoundingClientRect" (fun () ->
    Js.Json.object_ (Js.Dict.fromList ["x",Js.Json.number 0.;"y",Js.Json.number 0.;
      "width",Js.Json.number 120.;"height",Js.Json.number 28.]));
  Stub_dom.set_field window "setTimeout" (fun f _ ->
    incr next_timer;pending:=(!next_timer,f)::!pending;!next_timer);
  Stub_dom.set_field window "clearTimeout" (fun id ->
    pending:=List.filter (fun (i,_) -> i<>id) !pending);
  Stub_dom.set_field document "querySelector" (fun q ->
    if q="#lui-tooltip" then bubble else previous_query q);
  let base = Ui_services.dom_body () in
  let connected = ref true in
  let trigger_pending = ref false in
  let trigger token tag attrs =
    let rec el = {base with token;tag=(fun () -> String.uppercase_ascii tag);
      id=(fun () -> string_of_int token);attr=(fun k -> List.assoc_opt k attrs);
      closest=(fun _ -> Some el);contains=(fun other -> other.Ui_services.token=token);
      connected=(fun () -> !connected);
      rect=(fun () -> if !trigger_pending then 0.,0.,0.,0. else 100.,100.,32.,32.);
      rect_pending=(fun () -> !trigger_pending)} in el in
  let button = trigger 901 "button" ["aria-label","Search"] in
  let toolbar = trigger 902 "div" ["role","toolbar";"aria-label","Selection actions"] in
  let tooltip = mount (fun ms ->
    Tooltip.state:=Some (Signal.state (Signal.signal_owner ms) None);
    Tooltip.armed_on:=None;Tooltip.timer:= -1;Tooltip.el) in
  Runtime.app_flush:=(fun () -> incr flushes;S.flush tooltip);
  let move target = Tooltip.on_mousemove {(key_event "") with key=None;target} in
  let fire () = let ready=List.rev !pending in pending:=[];List.iter (fun (_,f) -> f ()) ready in
  let shown () = Runtime.signal_get (Option.get !Tooltip.state) in
  Fun.protect ~finally:(fun () ->
    Tooltip.hide ();ignore (Lui_app.dispose tooltip.S.app);
    Tooltip.state:=previous_tip;Tooltip.armed_on:=previous_armed;Tooltip.timer:=previous_timer;
    Stub_dom.set_field window "setTimeout" previous_timeout;
    Stub_dom.set_field window "clearTimeout" previous_clear;
    Stub_dom.set_field document "querySelector" previous_query) (fun () ->
    move (Some toolbar);
    check "an accessible toolbar is not an implicit tooltip trigger" (List.length !pending=0);
    fire ();
    check "hovering popup ancestry never shows a toolbar name" (shown ()=None);
    Tooltip.hide ();pending:=[];
    move (Some button);
    check "button tooltip waits for its hover delay" (shown ()=None && List.length !pending=1);
    fire ();S.flush tooltip;
    check "the delayed tooltip mounts its button label"
      (List.exists (fun n -> M.string_prop n "text"=Some "Search") (nodes tooltip));
    fire ();
    let before = !flushes in
    move (Some button);
    check "moving within a shown tooltip trigger preserves its timer and content"
      (List.length !pending=0 && shown ()<>None && !flushes=before);
    move None;
    check "leaving the document target hides and disarms the tooltip"
      (shown ()=None && !Tooltip.armed_on=None && List.length !pending=0);
    let before = !flushes in
    let blank = {base with closest=(fun _ -> None)} in
    move (Some blank);move (Some blank);
    check "unlabelled pointer moves do not request redundant UI flushes" (!flushes=before);
    move (Some button);connected:=false;fire ();
    check "a detached trigger cannot display after its delay" (shown ()=None);
    connected:=true;Tooltip.hide ();pending:=[];
    trigger_pending:=true;move (Some button);fire ();
    check "an unmeasured anchor never flashes a tooltip at zero coordinates"
      (shown ()=None && List.length !pending=1);
    trigger_pending:=false;fire ();
    check "resolved anchor geometry places the tooltip below its button"
      (Option.map (fun t -> t.Tooltip.tip_x,t.tip_y) (shown ())=Some (116.,132.));
    Tooltip.hide ();pending:=[];
    trigger_pending:=true;move (Some button);fire ();Tooltip.hide ();
    trigger_pending:=false;fire ();
    check "dismissal while measuring the trigger cancels deferred mounting" (shown ()=None);
    Tooltip.hide ();pending:=[];
    move (Some button);fire ();
    let stale = (match !pending with (_,f)::_ -> Some f | [] -> None) in
    Tooltip.hide ();
    check "dismissal cancels pending placement work" (List.length !pending=0);
    Option.iter (fun f -> f ()) stale;
    check "a dequeued placement cannot resurrect a dismissed tooltip" (shown ()=None);
    Tooltip.hide ();pending:=[];
    move (Some button);fire ();
    let stale = (match !pending with (_,f)::_ -> Some f | [] -> None) in
    Tooltip.hide ();move (Some button);
    Option.iter (fun f -> f ()) stale;
    check "old placement cannot bypass the delay after re-entering the same anchor"
      (shown ()=None && List.length !pending=1);
    Tooltip.hide ();pending:=[];
    move (Some button);fire ();
    let stale = (match !pending with (_,f)::_ -> Some f | [] -> None) in
    let other = trigger 906 "button" ["aria-label","Other action"] in
    move (Some other);fire ();
    Option.iter (fun f -> f ()) stale;
    check "old placement cannot replace the new anchor's content"
      (Option.map (fun t -> t.Tooltip.tip_label) (shown ())=Some "Other action");
    Tooltip.hide ();pending:=[];
    let suppressed = trigger 903 "button" ["aria-label","Accessible name";"data-tooltip",""] in
    move (Some suppressed);
    check "explicit suppression does not arm a tooltip timer" (List.length !pending=0);
    Tooltip.hide ();pending:=[];
    let explicit = trigger 904 "div" ["aria-label","Name";"data-tooltip","Explicit tip"] in
    move (Some explicit);fire ();
    check "explicit tooltip text can describe a non-button and owns its label"
      (Option.map (fun t -> t.Tooltip.tip_label) (shown ())=Some "Explicit tip"));
  let keymap = mount (fun _ -> Settings_page.keymap_pane ()) in
  check "keycap modifier glyphs are ready for the host text runtime"
    (Keymap_record.keycaps "meta+shift+k" =
      [{js|⌘|js};{js|⇧|js};"K"]);
  let dynamic_key = {js|é|js} in
  check "keycaps preserve runtime Unicode key names"
    (Keymap_record.keycaps dynamic_key=[dynamic_key]);
  let header_keys () =
    let header = mount (fun _ -> Chrome.search_button ()) in
    let keys = nodes header |> List.find_map (fun n ->
      if n.M.kind="button" then Option.bind (M.string_prop n "data-attrs")
        (fun encoded -> List.assoc_opt "data-tooltip-keys" (P.data_attrs_decode encoded))
      else None) in
    ignore (Lui_app.dispose header.S.app);keys in
  check "search tooltip emits decoded shortcut glyphs"
    (header_keys ()=Some {js|⌘ K|js});
  let stored_search_shortcut = Ui_services.storage_get "ls-shortcuts" in
  Ui_services.storage_set "ls-shortcuts" "{:go/search [\"f8\"]}";
  Keymap_data.reload_shortcuts ();
  check "search tooltip follows the configured binding" (header_keys ()=Some "F8");
  Ui_services.storage_set "ls-shortcuts" "{:go/search false}";
  Keymap_data.reload_shortcuts ();
  check "disabled search binding has no shortcut keycaps" (header_keys ()=None);
  restore_storage "ls-shortcuts" stored_search_shortcut;
  Keymap_data.reload_shortcuts ();
  Runtime.app_flush:=(fun () -> S.flush keymap);
  let keymap_nodes () = nodes keymap in
  let keymap_rows () =
    List.filter (fun n -> class_has n "shortcut-row") (keymap_nodes ())
  in
  let input =
    List.find (fun n -> n.M.kind = "search-field") (keymap_nodes ())
  in
  let clear_buttons () =
    List.filter
      (fun n ->
        M.string_prop n "accessibility-label"
        = Some (I18n.t "keymap/clear-search"))
      (keymap_nodes ())
  in
  let category_headers () =
    List.filter (fun n -> class_has n "th") (keymap_nodes ())
  in
  let pill prefix =
    List.find
      (fun n ->
        match M.string_prop n "text" with
        | Some text -> String.starts_with ~prefix text
        | None -> false)
      (keymap_nodes ())
  in
  let category_toggle () =
    List.find
      (fun n ->
        M.string_prop n "accessibility-label"
        = Some I18n.keymap_toggle_categories)
      (keymap_nodes ())
  in
  let category_tools () =
    List.filter
      (fun n ->
        let label = M.string_prop n "accessibility-label" in
        label = Some I18n.keymap_toggle_categories
        || label = Some I18n.keymap_refresh_all)
      (keymap_nodes ())
  in
  eqi "empty query shows category actions" 2 (List.length (category_tools ()));
  let categories =
    List.filter_map
      (function Keymap_data.Category label -> Some label | _ -> None)
      Keymap_data.items
  in
  eqi "unfiltered Keymap retains empty category headings"
    (List.length categories)
    (List.length (category_headers ()));
  let all_rows = List.length (keymap_rows ()) in
  let first_category () = List.hd (category_headers ()) in
  S.press keymap (first_category ()).M.id;
  check "individual category collapse leaves other commands visible"
    (List.length (keymap_rows ()) > 0 && List.length (keymap_rows ()) < all_rows);
  S.press keymap (category_toggle ()).M.id;
  eqi "global category toggle collapses a partly collapsed list" 0
    (List.length (keymap_rows ()));
  S.text_changed keymap input.M.id "Undo";
  eqi "search ignores category collapse" 13 (List.length (keymap_rows ()));
  eqi "query results hide category actions" 0 (List.length (category_tools ()));
  S.text_changed keymap input.M.id "";
  eqi "clearing search retains category collapse" 0
    (List.length (keymap_rows ()));
  eqi "clearing search restores category actions" 2
    (List.length (category_tools ()));
  S.toggle keymap (pill "Disabled").M.id true;
  check "status filter shows commands independently of category collapse"
    (keymap_rows () <> [] && category_headers () = []);
  S.toggle keymap (pill "All").M.id true;
  eqi "restoring All retains category collapse" 0 (List.length (keymap_rows ()));
  S.press keymap (first_category ()).M.id;
  check "individual expansion opens just one group"
    (List.length (keymap_rows ()) > 0 && List.length (keymap_rows ()) < all_rows);
  S.press keymap (category_toggle ()).M.id;
  eqi "global category toggle collapses a partly expanded list" 0
    (List.length (keymap_rows ()));
  S.press keymap (category_toggle ()).M.id;
  eqi "global category toggle expands every collapsed group" all_rows
    (List.length (keymap_rows ()));
  check "keymap initially hides query clear" (clear_buttons () = []);
  S.text_changed keymap input.M.id "Undo";
  check "keymap search uses fuzzy command identifiers and descriptions"
    (List.length (keymap_rows ()) > 1);
  check "query results flatten categories" (category_headers () = []);
  eqi "query results retain matches in their original categories" 13
    (List.length (keymap_rows ()));
  check "query counts follow matching commands"
    (M.string_prop (pill "All") "text"
    <> Some
         (I18n.keymap_all
         ^ {js| · |js}
         ^ string_of_int (Keymap_data.count Keymap_data.All)));
  eqi "nonempty query shows exactly one clear control" 1
    (List.length (clear_buttons ()));
  S.toggle keymap (pill "Disabled").M.id true;
  eqi "filter applies to fuzzy query results" 1 (List.length (keymap_rows ()));
  S.toggle keymap (pill "Disabled").M.id false;
  eqi "pressing the active filter restores all query results" 13
    (List.length (keymap_rows ()));
  S.toggle keymap (pill "Disabled").M.id true;
  (match clear_buttons () with
  | [ clear ] -> S.press keymap clear.M.id
  | _ -> ());
  check "query clear resets text without replacing the search field"
    (M.string_prop input "text" = Some ""
    && List.exists (fun n -> n.M.id = input.M.id) (keymap_nodes ()));
  check "query clear removes its control" (clear_buttons () = []);
  S.toggle keymap (pill "All").M.id true;
  check "all without a query restores category headers"
    (category_headers () <> []);
  S.text_changed keymap input.M.id "zzzz-no-shortcut";
  check "empty keymap search shows its translated empty state"
    (List.exists
       (fun n ->
         M.string_prop n "text" = Some (I18n.t "keymap/no-matching-shortcuts"))
       (keymap_nodes ()));
  S.text_changed keymap input.M.id "  ";
  check "whitespace query restores categories and hides clear"
    (category_headers () <> [] && clear_buttons () = []);
  let key_search = List.find (fun n ->
      M.string_prop n "text" = Some I18n.keymap_search_by_keys) (keymap_nodes ()) in
  let row_ids () = List.map (fun n -> n.M.id) (keymap_rows ()) |> List.sort Int.compare in
  let grouped_row_ids = row_ids () in
  S.press keymap key_search.M.id;
  check "opening the recorder preserves command row identity"
    (row_ids () = grouped_row_ids);
  let recorders = List.filter (fun n -> class_has n "shortcut-filter-popover") (keymap_nodes ()) in
  eqi "key search opens exactly one recorder" 1 (List.length recorders);
  check "recorder declares the shared 150 ms ease motion"
    (List.for_all
       (fun n -> M.string_prop n "transition" = Some "opacity 150ms ease, transform 150ms ease")
       recorders);
  check "the recorder exclusively owns keyboard input" (Keyboard_capture.active ());
  Keyboard_capture.dispatch (key_event ~meta:true "k");
  S.flush keymap;
  eqi "recording a shortcut filters commands" 1 (List.length (keymap_rows ()));
  check "dynamic recorder buttons satisfy the accessible-name contract"
    (List.for_all (fun n -> n.M.kind <> "button"
        || P.node_properties_supported P.Button (button_properties n)) (keymap_nodes ()));
  let module R = Keymap_record in
  let update strokes committed event = R.update ~strokes ~committed event in
  check "the plus key is distinct from the chord separator"
    (update [] false (key_event ~shift:true "+") = R.Set (["shift+="], false)
     && R.keycaps "shift+=" = [{js|⇧|js};"="]);
  check "shifted punctuation uses the same names as command bindings"
    (update [] false (key_event ~shift:true "?") = R.Set (["shift+/"], false));
  check "folded native Shift is restored for recorded modifiers"
    (update [] false (key_event ~meta:true "P") = R.Set (["meta+shift+p"], true));
  check "named keycaps retain their standard labels" (R.keycaps "delete" = ["Delete"]);
  check "modifier-only events do not alter recordings"
    (update ["g"] false (key_event "Shift") = R.Ignore);
  check "composition does not enter shortcut recordings"
    (update [] false (key_event ~composing:true "a") = R.Ignore);
  check "plain strokes append within a sequence"
    (update ["g"] false (key_event "j") = R.Set (["g";"j"], false));
  check "a committed sequence is replaced by the next stroke"
    (update ["g";"j"] true (key_event "k") = R.Set (["k"], false));
  check "modified strokes commit immediately"
    (update ["g"] false (key_event ~meta:true "k") = R.Set (["meta+k"], true));
  check "recordings stop at five strokes"
    (update ["a";"b";"c";"d";"e"] false (key_event "f") = R.Ignore);
  check "Backspace removes the last pending stroke"
    (update ["g";"j"] false (key_event "Backspace") = R.Set (["g"], false));
  check "Backspace clears committed strokes"
    (update ["g";"j"] true (key_event "Backspace") = R.Set ([], false));
  check "Escape dismisses recording without changing the filter"
    (update ["meta+k"] true (key_event "Escape") = R.Close);
  let filtered_row_ids = row_ids () in
  (match recorders with
   | [recorder] -> S.dismiss keymap recorder.M.id;
       check "dismissing the recorder preserves filtered command row identity"
         (row_ids () = filtered_row_ids);
       check "recorder dismissal retains the settings pane"
         (List.exists (fun n -> n.M.id = input.M.id) (keymap_nodes ()))
   | _ -> ());
  ignore (Lui_app.dispose keymap.S.app);
  check "recorder disposal releases keyboard capture" (not (Keyboard_capture.active ()));
  let reopened_keymap = mount (fun _ -> Settings_page.keymap_pane ()) in
  eqi "remounting Keymap restores every command" all_rows
    (List.length (List.filter (fun n -> class_has n "shortcut-row") (nodes reopened_keymap)));
  eqi "remounting Keymap retains every empty heading" (List.length categories)
    (List.length (List.filter (fun n -> class_has n "th") (nodes reopened_keymap)));
  ignore (Lui_app.dispose reopened_keymap.S.app);
  let previous_shortcuts = Ui_services.storage_get "ls-shortcuts" in
  Ui_services.storage_set "ls-shortcuts"
    "{:ui/toggle-left-sidebar [\"f8\"]}";
  let configured_keymap = mount (fun _ -> Settings_page.keymap_pane ()) in
  let configured_nodes () = nodes configured_keymap in
  let configured_binding () =
    List.find_opt (fun n -> M.string_prop n "text" = Some "F8")
      (configured_nodes ())
  in
  check "stored custom shortcut is shown by the real Keymap view"
    (configured_binding () <> None);
  let custom_label = I18n.keymap_custom ^ {js| · 1|js} in
  let custom_pill () = List.find (fun n ->
      M.string_prop n "text" = Some custom_label)
      (configured_nodes ()) in
  check "stored custom shortcut contributes to the Custom count"
    (List.exists (fun n -> M.string_prop n "text"
       = Some custom_label) (configured_nodes ()));
  (match List.find_opt (fun n -> M.string_prop n "text"
       = Some custom_label) (configured_nodes ()) with
   | Some _ ->
       S.toggle configured_keymap (custom_pill ()).M.id true;
       eqi "Custom filter contains the stored command" 1
         (List.length (List.filter (fun n -> class_has n "shortcut-row")
           (configured_nodes ())))
   | None -> ());
  let command_binding () =
    let command = List.find (fun (c : Cmdk_services.cmd) ->
        c.id = "ui/toggle-left-sidebar") ((Cmdk_host.services ()).commands ()) in
    command.sc
  in
  eqs "the command palette reads the same configured binding" "f8"
    (command_binding ());
  Ui_services.storage_set "ls-shortcuts"
    "{:ui/toggle-left-sidebar [\"f9\"]}";
  let refresh = List.find (fun n ->
      M.string_prop n "accessibility-label" = Some I18n.keymap_refresh_all)
      (configured_nodes ()) in
  S.press configured_keymap refresh.M.id;
  check "Refresh all re-reads stored bindings without resetting them"
    (List.exists (fun n -> M.string_prop n "text" = Some "F9")
       (configured_nodes ()) && configured_binding () = None);
  eqs "Refresh all updates the command palette binding" "f9"
    (command_binding ());
  ignore (Lui_app.dispose configured_keymap.S.app);
  restore_storage "ls-shortcuts" previous_shortcuts;
  let restored_keymap = mount (fun _ -> Settings_page.keymap_pane ()) in
  ignore (Lui_app.dispose restored_keymap.S.app);
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
  let previous_view_ops = !Views_state.ops_ref in
  let previous_popup_stack = !Views_popup.stack_st in
  Views_popup.stack_st := None;
  let refreshes = ref 0 in
  let sorting_inst = ref None in
  let sorting = mount (fun _ context parent ->
      let sched = context.Lui_ui.ui_scheduler in
      let view = Option.get (Views_wire.decode_view_ent (Wire.Map
        [Wire.kw "block/uuid", Wire.Uuid "sort-parity";
         Wire.kw "db/id", Wire.Int 42;
         Wire.kw "block/title", Wire.String I18n.all])) in
      let created = Views_state.make ~sched ~kind:Views_state.KAllPages
          ~feature:"all-pages" ~owner:Wire.Nil in
      let initial = { (Views_state.empty_vstate ()) with
        Views_state.view_uuid=view.vu; views=[view]; view_ent=Some view;
        columns=[Views_table.updated_column; Views_table.created_column];
        sorting=[{Views_state.s_id="block/updated-at"; s_asc=false};
                 {Views_state.s_id="block/created-at"; s_asc=true}] } in
      let inst = {created with Views_state.st=Signal.state sched initial} in
      sorting_inst := Some inst;
      Views_state.install_ops
        {o_refresh=(fun _ -> incr refreshes); o_refresh_src=(fun _ _ -> ());
         o_create_view=(fun _ -> ()); o_rename_box=(fun _ _ -> Lui_elements.spacer []);
         o_export=(fun _ -> ()); o_add_object=(fun _ -> ());
         o_title_of_uuid=(fun _ uuid -> uuid); o_load_more=(fun _ -> ())};
      Views_head.sorting_popup inst (Ui_services.dom_body ());
      Lui_elements.column
        [Views_head.view_tab inst (Signal.value (Signal.state sched view)); Views_popup.layer]
        context parent) in
  let inst = Option.get !sorting_inst in
  let tab = List.find (fun n -> class_has n "ls-view-tab") (nodes sorting) in
  check "Pages preserves the default All view title"
    (M.string_prop tab "accessibility-label" = Some I18n.all);
  let order () = List.find (fun n -> class_has n "ls-sort-order") (nodes sorting) in
  check "sorting direction exposes a select trigger" ((order ()).M.kind = "select");
  let parent_popups = List.length !Views_popup.open_popups in
  let options () = List.filter (fun n -> class_has n "ls-sort-option") (nodes sorting) in
  S.press sorting (order ()).M.id;
  eqi "opening sort direction does not refresh data" 0 !refreshes;
  check "opening sort direction preserves its value"
    (not (List.hd (Views_state.get inst).sorting).s_asc);
  eqi "sort direction offers both choices" 2 (List.length (options ()));
  (match List.find_opt (fun n -> class_has n "ls-sort-options") (nodes sorting) with
   | Some menu -> S.dismiss sorting menu.M.id
   | None -> check "sort direction has its own dismissible layer" false);
  eqi "cancelled sort direction does not refresh data" 0 !refreshes;
  check "cancelling direction preserves the sorting menu"
    (List.length !Views_popup.open_popups = parent_popups);
  S.press sorting (order ()).M.id;
  (match List.find_opt (fun n -> M.string_prop n "text" = Some I18n.ascending) (options ()) with
   | Some option -> S.press sorting option.M.id
   | None -> check "ascending sort option is available" false);
  check "choosing ascending updates sorting" (List.hd (Views_state.get inst).sorting).s_asc;
  eqi "choosing a direction refreshes exactly once" 1 !refreshes;
  check "choosing direction updates the retained trigger label"
    (M.string_prop (order ()) "text" = Some I18n.ascending);
  check "choosing direction closes only its option list"
    (options () = [] && List.length !Views_popup.open_popups = parent_popups);
  S.press sorting (order ()).M.id;
  (match List.find_opt (fun n -> M.string_prop n "text" = Some I18n.ascending) (options ()) with
   | Some option -> S.press sorting option.M.id
   | None -> ());
  eqi "reselecting the current direction does not refresh" 1 !refreshes;
  S.press sorting (order ()).M.id;
  (match List.find_opt (fun n -> M.string_prop n "text" = Some I18n.descending) (options ()) with
   | Some option -> S.press sorting option.M.id
   | None -> ());
  check "choosing descending restores sorting" (not (List.hd (Views_state.get inst).sorting).s_asc);
  eqi "choosing the other direction refreshes once" 2 !refreshes;
  let remove = List.find (fun n -> class_has n "ls-sort-x") (nodes sorting) in
  let removed = try S.press sorting remove.M.id; true with _ -> false in
  check "removing a sorting row closes its owner before invalidating its value" removed;
  check "removing one sorting row preserves the other row and parent menu"
    (List.map (fun so -> so.Views_state.s_id) (Views_state.get inst).sorting
       = ["block/created-at"]
     && List.length (List.filter (fun n -> class_has n "ls-sort-order") (nodes sorting)) = 1
     && List.length !Views_popup.open_popups = parent_popups);
  (match List.find_opt (fun n -> class_has n "ls-sort-x") (nodes sorting) with
   | Some remove ->
       check "removing the final sorting row is safe"
         (try S.press sorting remove.M.id; true with _ -> false)
   | None -> check "the remaining sorting row can be removed" false);
  check "removed sorting row and menu leave no controls behind"
    ((Views_state.get inst).sorting = []
     && not (List.exists (fun n -> class_has n "ls-sort-order") (nodes sorting)));
  Views_state.update inst (fun s -> {s with sorting=
    [{Views_state.s_id="block/updated-at"; s_asc=false}]});
  Views_head.sorting_popup inst (Ui_services.dom_body ());
  S.flush sorting;
  let delete = List.find (fun n -> class_has n "ls-sort-delete") (nodes sorting) in
  check "Delete sort closes the complete sorting configuration safely"
    (try S.press sorting delete.M.id;
       (Views_state.get inst).sorting = [] && !Views_popup.open_popups = []
     with _ -> false);
  Views_popup.close_all ();
  ignore (Lui_app.dispose sorting.S.app);
  Views_popup.stack_st := previous_popup_stack;
  Views_state.ops_ref := previous_view_ops;
  let previous_cmdk =
    (!Cmdk_state.latest_vs, !Cmdk_state.latest_t, !Cmdk_state.latest_st,
     !Cmdk_state.services_ref)
  in
  let handlers : Cmdk_services.handlers option ref = ref None in
  let shortcut_actions = ref 0 in
  let services =
    { (Cmdk_host.services ()) with
      repo = (fun () -> None)
    ; focus_input_init = (fun _ -> ())
    ; install_listeners = (fun h -> handlers := Some h)
    ; toggle_left_sidebar = (fun () -> incr shortcut_actions)
    }
  in
  let search = mount (fun ms -> Cmdk_view.render ~services ms) in
  let stroke key = Editor_keys.on_global_key (key_event key) in
  stroke "t"; stroke "l";
  eqi "default global sequence dispatches once" 1 !shortcut_actions;
  let previous_shortcuts = Ui_services.storage_get "ls-shortcuts" in
  Ui_services.storage_set "ls-shortcuts"
    "{:ui/toggle-left-sidebar [\"f8\"]}";
  let binding_settings = mount (fun _ -> Settings_page.keymap_pane ()) in
  let refresh_bindings () =
    let refresh = List.find (fun n ->
      M.string_prop n "accessibility-label" = Some I18n.keymap_refresh_all)
      (nodes binding_settings) in
    S.press binding_settings refresh.M.id
  in
  let before_replaced = !shortcut_actions in
  stroke "t"; stroke "l";
  eqi "replacing a global sequence removes its previous execution" before_replaced
    !shortcut_actions;
  let before_configured = !shortcut_actions in
  stroke "F8";
  eqi "the configured stroke dispatches the existing command action" (before_configured + 1)
    !shortcut_actions;
  Ui_services.storage_set "ls-shortcuts" "{:ui/toggle-left-sidebar false}";
  refresh_bindings ();
  let before_disabled = !shortcut_actions in
  stroke "F8"; stroke "t"; stroke "l";
  eqi "disabling a global shortcut removes both custom and default execution" before_disabled
    !shortcut_actions;
  check "a disabled override counts as custom rather than unset"
    (Keymap_data.count Keymap_data.Custom = 1
     && Keymap_data.count Keymap_data.Disabled = 5
     && Keymap_data.count Keymap_data.Unset = 9);
  Ui_services.storage_remove "ls-shortcuts";
  refresh_bindings ();
  let before_reset = !shortcut_actions in
  stroke "t"; stroke "l";
  eqi "removing an override restores the default sequence" (before_reset + 1)
    !shortcut_actions;
  Ui_services.storage_set "ls-shortcuts"
    "{:ui/toggle-left-sidebar [\"t x\"]}";
  refresh_bindings ();
  stroke "t";
  Ui_services.storage_set "ls-shortcuts"
    "{:ui/toggle-left-sidebar [\"t l\"]}";
  refresh_bindings ();
  let before_stale_prefix = !shortcut_actions in
  stroke "l";
  eqi "a binding reload discards a sequence started under the old bindings"
    before_stale_prefix !shortcut_actions;
  stroke "t"; stroke "l";
  eqi "the replacement sequence works after a fresh prefix"
    (before_stale_prefix + 1) !shortcut_actions;
  ignore (Lui_app.dispose binding_settings.S.app);
  restore_storage "ls-shortcuts" previous_shortcuts;
  let restored_bindings = mount (fun _ -> Settings_page.keymap_pane ()) in
  ignore (Lui_app.dispose restored_bindings.S.app);
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
