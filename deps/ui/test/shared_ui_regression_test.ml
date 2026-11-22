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

let button_label node =
  match M.string_prop node "accessibility-label" with
  | Some _ as label -> label
  | None -> M.string_prop node "text"

let localization () =
  let previous_language = Platform.local_storage_get "preferred-language" in
  let previous_dictionary = Hashtbl.find_opt I18n.locale_tbls "zh-CN" in
  let previous_flush = !Runtime.app_flush in
  let previous_settings = !Settings_state.st in
  let previous_cmdk_services = !Cmdk_state.services_ref in
  Settings_state.st:=None;
  Fun.protect ~finally:(fun () ->
    (match previous_language with
     | Some language -> Platform.local_storage_set "preferred-language" language
     | None -> Platform.local_storage_remove "preferred-language");
    (match previous_dictionary with
     | Some dictionary -> Hashtbl.replace I18n.locale_tbls "zh-CN" dictionary
     | None -> Hashtbl.remove I18n.locale_tbls "zh-CN");
    Runtime.app_flush:=previous_flush;
    Cmdk_state.services_ref:=previous_cmdk_services;
    Settings_state.st:=previous_settings) (fun () ->
    let group_labels = Cmdk_state.[
      G_create,"create","Translated Create";
      G_current_page,"current-page","Translated Current page";
      G_nodes,"nodes","Translated Nodes";
      G_recently_updated,"recently-updated","Translated Recently updated";
      G_commands,"commands","Translated Commands";
      G_files,"files","Translated Files";
      G_filters,"filters","Translated Filters";
      G_codes,"codes","Translated Code";
      G_themes,"themes","Translated Themes"] in
    let dictionary=Hashtbl.create 16 in
    List.iter (fun (_,key,value) -> Hashtbl.add dictionary ("cmdk.group/" ^ key) value)
      group_labels;
    List.iter (fun (key,value) -> Hashtbl.add dictionary key value)
      ["nav/settings","Translated Settings";
       "settings/general","Translated General";
       "settings/editor","Translated Editor";
       "settings/keymap","Translated Keymap";
       "settings/advanced","Translated Advanced";
       "settings/features","Translated Features";
       "settings.general/current-version","Translated Version";
       "view.table/group-page-name","Translated Page name";
       "view.filter/custom-date","Translated Custom date";
       "header/more","Translated More";
       "nav/skip-to-main-content","Translated Skip";
       "settings.sync-server/url","Translated Sync server";
       "page/not-found-title","Translated Not Found";
       "library/add-existing-pages","Translated Add Pages";
       "view.table/select-column","Translated Select column";
       "cmdk/current-page-badge","Translated Current Page badge"];
    Hashtbl.replace I18n.locale_tbls "zh-CN" (Some dictionary);
    Platform.local_storage_set "preferred-language" "\"zh-CN\"";
    check "Locale fixture loads after application modules initialize"
      (I18n.t "settings/general"="Translated General");
    List.iter (fun (operator,label) ->
      eqs "Numeric comparison labels remain mathematical symbols in every locale" label (I18n.operator_text operator))
      ["number-gt",">";"number-lt","<";"number-gte",">=";"number-lte","<="];
    check "Unknown filter operators fail instead of displaying a different operation"
      (try ignore (I18n.operator_text "unknown-operator");false with Invalid_argument _ -> true);
    let services = {(Cmdk_host.services ()) with
      i18n=I18n.t;repo=(fun () -> None);commands=(fun () -> []);
      route_is_page=(fun () -> true);route_page_uuid=(fun () -> Some "locale-page")} in
    Cmdk_state.services_ref:=Some services;
    let result_groups=Cmdk_state.group_order Cmdk_state.initial_view "fixture" [] 0 in
    List.iter (fun (group:Cmdk_state.group) ->
      let _,_,expected=List.find (fun (gid,_,_) -> gid=group.gid) group_labels in
      eqs "Search result groups use the initialized dictionary" expected group.gtitle)
      result_groups;
    let columns=ref [] in
    let session=S.mount ~registry:(Views_drive.registry ())
      ~profile:Logseq_el.web_profile ~initial:Model.initial
      ~reducer:(fun model () -> model)
      ~view:(fun context model _ ->
        Settings_state.ensure context;
        let search_state=Cmdk_state.make ~register:false context.Lui_ui.ui_scheduler services in
        columns:=Views_table.build_columns
          (Views_state.make ~sched:context.Lui_ui.ui_scheduler
             ~kind:Views_state.KAllPages ~feature:"locale-columns" ~owner:Wire.Nil) [];
        Lui_elements.column
          (Page_menu.global_items ()
           @ List.mapi (fun i item -> Settings_page.nav_item ~key:("locale-nav-"^string_of_int i) item)
               (Settings_page.nav_items ())
           @ [Settings_page.general_pane ~modal:false context;
              Chrome.dots_button; Chrome.skip_to_main; Chrome.not_found_page;
              Settings_url_view.sync_body model;
              Page.library_add_pages_button;Cmdk_view.badge_el services "locale-badge"]
           @ List.map (fun (gid,key,_) -> Lui_elements.column ~key:("locale-group-" ^ key)
              [Cmdk_view.group_header services search_state
               {Cmdk_state.gid;gtitle=Cmdk_view.gid_label services gid;gitems=[];
                gtotal=0;glimit=5;gexpanded=false;gfilter_active=false}]) group_labels)) () in
    Fun.protect ~finally:(fun () -> ignore (Lui_app.dispose session.S.app)) (fun () ->
      let texts=List.filter_map (fun n -> M.string_prop n "text") (nodes session) in
      List.iter (fun value -> check ("Late locale reaches " ^ value) (List.mem value texts))
        ["Translated Settings";"Translated General";"Translated Editor";
         "Translated Keymap";"Translated Advanced";"Translated Features";
         "Translated Version";"Translated Skip";"Translated Not Found";
         "Translated Sync server";"Translated Add Pages"];
      List.iter (fun (_,_,value) -> check ("Localized search heading: " ^ value)
          (List.mem value texts)) group_labels;
      check "Search current-page badge resolves its own late locale entry"
        (List.mem "Translated Current Page badge" texts);
      check "Late locale reaches the retained More recipe"
        (List.exists (fun n -> M.string_prop n "accessibility-label"=Some "Translated More") (nodes session)));
    check "Built-in view columns resolve the initialized locale"
      (List.exists (fun (column:Views_state.column) -> column.c_name="Translated Page name") !columns);
    check "Selection column resolves the initialized locale"
      (List.exists (fun (column:Views_state.column) -> column.c_name="Translated Select column") !columns);
    check "Timestamp choices resolve the initialized locale"
      (List.exists (fun (_,label) -> label="Translated Custom date") (I18n.timestamp_options ())))

let show_brackets_rendering ~registry ~profile =
  let previous_model = !Runtime.read_model
  and previous_sidebar_model_source = !Sidebar_state.model_signal in
  let repo = "show-brackets-rendering-fixture" in
  let uuid = "00000000-0000-0000-0000-000000000001" in
  let nested_uuid = "00000000-0000-0000-0000-000000000002" in
  let config enabled =
    Wire.Map [Wire.kw "ui/show-brackets?", Wire.Bool enabled]
  in
  let current = ref {Model.initial with repo=Some repo; graph_config=Wire.Map []} in
  Runtime.read_model := (fun () -> !current);
  Render_inline.prime_ref_metas ["Show Brackets Target", uuid];
  Render_inline.prime_pull_meta ~name:"Show Brackets Nested Block"
    ~uuid:nested_uuid
    ~entity:(Wire.Map
      [Wire.kw "block/uuid", Wire.Uuid nested_uuid;
       Wire.kw "block/title", Wire.String
         "Baseline journal: review [[Show Brackets Target]]"]);
  let session = S.mount ~registry ~profile ~initial:!current
    ~reducer:(fun model action ->
      let updated = Update.update model action in
      current := updated;
      updated)
    ~view:(fun _ model_source _ ->
      Sidebar_state.model_signal := Some model_source;
      Lui_elements.row
        (Render_inline.parse ~self:"show-brackets-page"
           ("[[Show Brackets Target]] [[" ^ uuid ^ "]] [[" ^ nested_uuid ^ "]] "
            ^ "[Atlas alias]([[Show Brackets Target]]) "
            ^ "[UUID alias]([[" ^ uuid ^ "]]) "
            ^ "[Website](https://example.com)"))) () in
  let bracket_count () =
    List.fold_left (fun count node ->
      match M.string_prop node "text" with
      | Some "[[" | Some "]]" -> count + 1
      | _ -> count) 0 (nodes session)
  in
  let reference_link_ids () =
    nodes session
    |> List.filter (fun node ->
      node.M.kind = "link" && M.string_prop node "url" = Some "#")
    |> List.map (fun node -> node.M.id)
    |> List.sort Int.compare
  in
  let data_attr node key =
    match M.string_prop node "data-attrs" with
    | Some attrs -> List.assoc_opt key (P.data_attrs_decode attrs)
    | None -> None
  in
  let rec text_content node =
    match M.string_prop node "text" with
    | Some text -> text
    | None ->
        String.concat ""
          (List.map text_content (M.children session.S.tree node.M.id))
  in
  let alias_link label =
    List.find_opt (fun node ->
      node.M.kind = "link" && text_content node = label)
      (nodes session)
  in
  let is_page_alias label =
    match alias_link label with
    | Some node ->
        class_has node "page-ref"
        && M.string_prop node "url" = Some "#"
        && data_attr node "data-ref" = Some "show brackets target"
        && data_attr node "data-uuid" = Some uuid
    | None -> false
  in
  let check_brackets expected label =
    let actual = bracket_count () in
    check (Printf.sprintf "%s (expected %d, got %d)" label expected actual)
      (actual = expected)
  in
  Fun.protect
    ~finally:(fun () ->
      ignore (Lui_app.dispose session.S.app);
      Runtime.read_model := previous_model;
      Sidebar_state.model_signal := previous_sidebar_model_source)
    (fun () ->
      let link_ids = reference_link_ids () in
      check "Reference and alias links are mounted" (List.length link_ids = 6);
      check_brackets 12 "Show brackets defaults to visible for page aliases";
      check "Name-target alias renders as an internal page reference"
        (is_page_alias "Atlas alias");
      check "UUID-target alias renders as an internal page reference"
        (is_page_alias "UUID alias");
      check "External Markdown URLs remain external links"
        (List.exists (fun node ->
           node.M.kind = "link" && class_has node "external-link"
           && M.string_prop node "url" = Some "https://example.com")
           (nodes session));
      let publish enabled =
        ignore (Lui_app.send session.S.app
          (Action.Graph_config_loaded (repo, config enabled)));
        S.flush session
      in
      publish false;
      check_brackets 0 "Show brackets off hides delimiters in resolved block titles";
      check "Show brackets off preserves page alias labels"
        (is_page_alias "Atlas alias" && is_page_alias "UUID alias");
      check "Show brackets off retains reference link identities"
        (reference_link_ids () = link_ids);
      publish true;
      check_brackets 12 "Show brackets on restores page-alias delimiters";
      check "Show brackets on preserves page alias labels"
        (is_page_alias "Atlas alias" && is_page_alias "UUID alias");
      check "Show brackets on retains reference link identities"
        (reference_link_ids () = link_ids);
      check "Show brackets rejects a non-boolean graph setting"
        (try
           ignore (Lui_app.send session.S.app
             (Action.Graph_config_loaded
               (repo, Wire.Map [Wire.kw "ui/show-brackets?", Wire.String "false"])));
           S.flush session;
           false
         with Invalid_argument _ -> true))

let settings_config ~registry ~profile ~finish =
  let previous_settings = !Settings_state.st and previous_model = !Runtime.read_model
  and previous_worker = !Runtime.worker and previous_flush = !Runtime.app_flush
  and previous_send = !Runtime.app_send and previous_published = !Sdk_config.published_config in
  let rec next = function
  | [] ->
    Settings_state.st:=previous_settings;Runtime.read_model:=previous_model;
    Runtime.worker:=previous_worker;Runtime.app_flush:=previous_flush;
    Runtime.app_send:=previous_send;Sdk_config.published_config:=previous_published;
    finish ()
  | owner::rest ->
      Settings_state.st:=None;
      Sdk_config.published_config:=None;
      let config checked = Wire.Map [Wire.kw "ui/show-brackets?",Wire.Bool checked;
        Wire.kw "start-of-week",Wire.Int 2;Wire.kw "custom-fixture",Wire.String "retained"] in
      let files=Hashtbl.create 2 in
      List.iter (fun repo -> Hashtbl.add files repo (config false))
        ["settings-config-fixture";"second-settings-fixture"];
      let current=ref {Model.initial with repo=Some "settings-config-fixture";
        graph_config=config false} in
      Runtime.read_model:=(fun () -> !current);
      Runtime.worker:=Some {Worker_client.invoke_fn=(fun name args ->
        match name,args with
        | "thread-api/get-file-content",[Wire.String repo;Wire.String "logseq/config.edn"] ->
            Js.Promise.resolve (Wire.String (Edn.to_string (Hashtbl.find files repo)))
        | "thread-api/pull",[Wire.String repo;Wire.String _;_] ->
            ignore (Hashtbl.find files repo);
            Js.Promise.resolve Wire.Nil
        | "thread-api/transact",Wire.String repo::Wire.Array [file]::_ ->
            (match Wire.get file "file/content" with
             | Some (Wire.String content) -> Hashtbl.replace files repo (Edn.parse content)
             | _ -> failwith "Settings fixture requires config file content");
            Js.Promise.resolve Wire.Nil
        | _ -> failwith ("Unexpected Settings config request: " ^ name));
        on_message=(fun _ _ -> ());dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
      let session=S.mount ~registry ~profile ~initial:!current
        ~reducer:(fun model action ->
          let updated=Update.update model action in current:=updated;updated)
        ~view:(fun _ ms _ -> match owner with
          | "appearance" -> Settings_page.appearance_body ms
          | "page" -> Settings_page.view ms
          | _ -> Settings_page.modal_body ms) () in
      Runtime.app_flush:=(fun () -> S.flush session);
      let complete=ref (fun () -> ()) in
      let saved=Js.Promise.make (fun ~resolve ~reject:_ ->
        complete:=(fun () -> resolve true [@u])) in
      Runtime.app_send:=(fun action ->
        let changed=Lui_app.send session.S.app action in
        (match action with
         | Action.Graph_config_loaded ("second-settings-fixture",_) -> !complete ()
         | _ -> ());
        changed);
      if owner<>"appearance" then (Settings_state.set_tab "editor";S.flush session);
      let switch () =
        let rec descendant node =
          if node.M.kind="switch" then Some node else
            List.find_map descendant (M.children session.S.tree node.M.id) in
        let rec containing node = match descendant node with
          | Some control -> control
          | None -> containing (Hashtbl.find session.S.tree.M.nodes (Option.get node.M.parent)) in
        containing (List.find (fun node -> M.string_prop node "text"
          =Some (I18n.t "settings.editor/show-brackets")) (nodes session)) in
      check (owner ^ " reads persisted config before Settings has loaded")
        (Hashtbl.find_opt (switch ()).M.props "checked"=Some (P.BoolValue false));
      let publish repo cfg =
        Hashtbl.replace files repo cfg;
        ignore (Lui_app.send session.S.app (Action.Graph_config_loaded (repo,cfg)));
        S.flush session in
      publish "settings-config-fixture" (config true);
      check (owner ^ " follows a live graph configuration edit")
        (Hashtbl.find_opt (switch ()).M.props "checked"=Some (P.BoolValue true));
      publish "settings-config-fixture" (config false);
      check (owner ^ " follows a second live graph configuration edit")
        (Hashtbl.find_opt (switch ()).M.props "checked"=Some (P.BoolValue false));
      ignore (Lui_app.send session.S.app (Action.Boot_graph_ready ("second-settings-fixture",config false)));
      S.flush session;
      check (owner ^ " follows the newly opened graph configuration")
        (Hashtbl.find_opt (switch ()).M.props "checked"=Some (P.BoolValue false));
      S.toggle session (switch ()).M.id true;
      ignore (Js.Promise.then_ (fun _ ->
        check (owner ^ " preserves other graph preferences when toggled")
          (Hashtbl.find files "second-settings-fixture"=config true
           && Hashtbl.find files "settings-config-fixture"=config false
           && Wire.get (!current).Model.graph_config "ui/show-brackets?"=Some (Wire.Bool true)
           && Wire.get (!current).Model.graph_config "start-of-week"=Some (Wire.Int 2)
           && Wire.get (!current).Model.graph_config "custom-fixture"=Some (Wire.String "retained")
           && Wire.get (!current).Model.graph_config "ui/auto-expand-block-refs?"=Some (Wire.Bool true));
        ignore (Lui_app.dispose session.S.app);
        next rest;Js.Promise.resolve ()) saved)
  in
  next ["appearance";"page";"dialog"]

let flashcards_config ~registry ~profile =
  let previous_settings = !Settings_state.st and previous_model = !Runtime.read_model
  and previous_worker = !Runtime.worker and previous_flush = !Runtime.app_flush
  and previous_due = !Cards_state.Due_count.st and previous_popup = !Popups_state.active in
  Fun.protect ~finally:(fun () ->
    Settings_state.st:=previous_settings;Runtime.read_model:=previous_model;
    Runtime.worker:=previous_worker;Runtime.app_flush:=previous_flush;
    Cards_state.Due_count.st:=previous_due;Popups_state.active:=previous_popup) (fun () ->
    Settings_state.st:=None;Cards_state.Due_count.st:=None;
    let config enabled = Wire.Map [Wire.kw "feature/enable-flashcards?",Wire.Bool enabled] in
    let current=ref {Model.initial with repo=Some "flashcards-fixture";graph_config=config false}
    and popup=ref None in
    Runtime.read_model:=(fun () -> !current);
    Runtime.worker:=Some {Worker_client.invoke_fn=(fun _ _ ->
      Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()));
      on_message=(fun _ _ -> ());dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
    let session=S.mount ~registry ~profile ~initial:!current
      ~reducer:(fun model action ->
        let updated=Update.update model action in current:=updated;updated)
      ~view:(fun ctx ms _ ->
        let state value=Signal.state ctx.Lui_ui.ui_scheduler value in
        let sidebar : Sidebar_state.t =
          {favorites=state [];home_page=state None;favorite_drop=state None;recents=state [];nav_checked=state ["flashcards";"all-pages"];
           nav_tag_titles=state [];block_sources = Hashtbl.create 8; items = state [];open_menu=state "";groups_collapsed=state [];
           left_width=state 246.;right_fraction=state 0.3;viewport_w=state 1280.;
           restored_repo=ref None;restoring=ref true;history_repo=ref None;history_state=ref None} in
        popup:=Some (Popups_state.make ctx.Lui_ui.ui_scheduler);
        Left_sidebar_view.nav_group ms sidebar) () in
    Runtime.app_flush:=(fun () -> S.flush session);
    let has_nav ()=List.exists (fun node -> class_has node "flashcards-nav") (nodes session) in
    let expect label enabled =
      check (label ^ " gates the sidebar entry") (has_nav ()=enabled);
      List.iter (fun multi ->
        let popup=Option.get !popup in
        Popups_state.open_cm ~scope:"main" popup ~ax:10. ~atop:10. ~abot:10. ~block_id:"flashcard-block" ~multi;
        let entries=(Option.get (Popups_state.get popup).cm).entries in
        check (label ^ (if multi then " gates the multi-block menu" else " gates the single-block menu"))
          (List.exists (function Popups_state.Ci_item (_,_,"make-flashcard") -> true | _ -> false) entries=enabled);
        Popups_state.close_cm popup) [false;true]
    in
    expect "Cold graph preferences before Settings mounts" false;
    List.iter (fun enabled ->
      ignore (Lui_app.send session.S.app (Action.Graph_config_loaded ("flashcards-fixture",config enabled)));
      S.flush session;
      expect "Live feature edits" enabled) [true;false;true];
    Runtime.signal_set (Cards_state.Due_count.state ()) 3;S.flush session;
    check "The retained flashcard entry updates its due-count badge"
      (List.exists (fun node -> M.string_prop node "text"=Some "3") (nodes session));
    Runtime.signal_set (Cards_state.Due_count.state ()) 0;S.flush session;
    check "A zero due count removes its badge"
      (not (List.exists (fun node -> M.string_prop node "text"=Some "3") (nodes session)));
    ignore (Lui_app.send session.S.app (Action.Boot_graph_ready ("second-flashcards-fixture",config false)));
    S.flush session;expect "Switching graphs" false;
    ignore (Lui_app.send session.S.app (Action.Graph_config_loaded ("flashcards-fixture",config true)));
    S.flush session;expect "A late configuration from the previous graph" false;
    check "Feature visibility does not mount Settings" (not (Settings_state.ready ()));
    check "Feature visibility retains unrelated navigation"
      (List.exists (fun node -> class_has node "all-pages-nav") (nodes session));
    check "The Pages navigation link stays in the current application tab"
      (List.exists (fun node -> node.M.kind="link"
        && Option.fold ~none:false ~some:(fun url -> String.starts_with ~prefix:"#/all-pages" url)
             (M.string_prop node "url")
        && M.string_prop node "target"=Some "_self") (nodes session));
    ignore (Lui_app.dispose session.S.app))

let grouped_table_selection ~registry ~profile =
  let module V = Views_state in
  let instance = ref None in
  let session = S.mount ~registry ~profile ~initial:Model.initial
      ~reducer:(fun model () -> model)
      ~view:(fun context _ _ ->
        let inst = V.make ~sched:context.Lui_ui.ui_scheduler
            ~kind:V.KAllPages ~feature:"all-pages" ~owner:Wire.Nil in
        instance := Some inst;
        V.set inst { (V.empty_vstate ()) with
          V.loading = false;
          columns = [Views_table.builtin_column "select" "" "select" ()];
          selected = V.Sset.of_list ["a"; "c"; "stale"];
          data = Views_wire.VGrouped
            [ { gv = Wire.Nil; grows = ["b"; "a"] }
            ; { gv = Wire.Nil; grows = ["c"; "b"] } ] };
        Lui_elements.column
          [ Views_table.grouped_table inst ~rows:["b"; "a"]
          ; Views_table.grouped_table inst ~rows:["c"; "b"] ]) () in
  Fun.protect ~finally:(fun () -> ignore (Lui_app.dispose session.S.app))
    (fun () ->
      let inst = Option.get !instance in
      List.iter (fun (data,items_count,expected) ->
        let state={(V.get inst) with V.data;items_count} in
        check "View totals count unique grouped entities while preserving full result counts"
          (Views_head.count_of state=expected))
        [(V.get inst).V.data,0,3;
         Views_wire.VGroupedList [{glv=Wire.Nil;glparts=["first",["a";"b"];"second",["b";"c"]]}],0,3;
         (V.get inst).V.data,7,7;
         Views_wire.VFlat {rows=["a";"b"];count=9;previews=Hashtbl.create 0;qprops=[]},0,9;
         Views_wire.VEmpty,0,0;
         Views_wire.VEmpty,7,7];
      let headers = List.filter
          (fun node -> M.string_prop node "accessibility-identifier" =
            Some "header-checkbox") (nodes session) in
      let header = List.hd headers in
      check "A partially selected group is not checked as a fully selected group"
        (Hashtbl.find_opt header.M.props "checked" <> Some (P.BoolValue true));
      S.dispatch session (P.ToggleChangedDetail (header.M.id, true, 0));
      check "Selecting a group preserves the other group's selected rows"
        (V.Sset.equal (V.get inst).V.selected
           (V.Sset.of_list ["a"; "b"; "c"; "stale"]));
      S.dispatch session (P.ToggleChangedDetail (header.M.id, false, 0));
      check "Clearing a group preserves selection outside that group"
        (V.Sset.equal (V.get inst).V.selected
           (V.Sset.of_list ["c"; "stale"]));
      V.update inst (fun state -> { state with
        V.selected = V.Sset.of_list ["a"; "b"; "c"; "stale"] });
      check "Bulk actions use current row order once, without stale selections"
        (Views_table.selected_uuids inst = ["b"; "a"; "c"]))

let table_range_selection () =
  let module V = Views_state in
  let initial = { (V.empty_vstate ()) with
    V.selected = V.Sset.of_list ["a"; "outside"]; table_anchor = Some "a" } in
  let select state rows uuid checked shift =
    V.table_select_row state ~rows ~uuid ~checked ~shift in
  let ranged = select initial ["c"; "b"; "a"] "c" true true in
  check "A range follows the current order and preserves outside selection"
    (V.Sset.equal ranged.V.selected (V.Sset.of_list ["a"; "b"; "c"; "outside"]));
  let missing = select initial ["b"; "c"] "c" true true in
  check "A filtered-out anchor does not select unrelated rows"
    (V.Sset.equal missing.V.selected (V.Sset.of_list ["a"; "c"; "outside"]));
  let cleared = select initial ["a"; "b"; "c"] "a" false false in
  let next = select cleared ["a"; "b"; "c"] "c" true true in
  check "Deselecting the anchor ends the previous range"
    (cleared.V.table_anchor = None &&
      V.Sset.equal next.V.selected (V.Sset.of_list ["c"; "outside"]));
  let all = V.table_select_all_rows initial true in
  let excluded = select all ["a"; "b"] "b" false false in
  let group = V.table_set_rows excluded ~rows:["a"] ~checked:false in
  check "Select-all includes later rows while row and group exclusions stay local"
    (V.table_row_selected all "later" &&
      not (V.table_row_selected group "a") &&
      not (V.table_row_selected group "b") && V.table_row_selected group "later");
  let pending = { group with V.table_action_pending = Some group.V.table_selection_epoch } in
  let cleared = V.table_clear_selection pending in
  check "Clearing selection retires pending full-data actions and all-row membership"
    (not (V.table_row_selected cleared "later") && cleared.V.table_action_pending = None &&
      cleared.V.table_selection_epoch > pending.V.table_selection_epoch)

let table_resize_transaction () =
  let module V = Views_state in
  let initial = { (V.empty_vstate ()) with
    V.view_uuid = "table-a"; sized = V.Smap.singleton "title" 180 } in
  let start = V.start_table_resize initial ~owner:7 ~column:"title" ~x:50. ~width:180 in
  let move = V.move_table_resize start ~owner:7 ~x:82.6 in
  check "Resize preview leaves the persisted-width map unchanged"
    (move.V.sized = initial.V.sized &&
      Option.map (fun r -> r.V.resize_preview) move.V.table_resize = Some 213);
  let cancel = V.finish_table_resize move ~owner:7 ~commit:false in
  check "Cancelling a drag rolls back without changing committed widths"
    (cancel.V.table_resize = None && cancel.V.sized = initial.V.sized);
  let release = V.finish_table_resize move ~owner:7 ~commit:true in
  check "Release commits the rounded preview once"
    (release.V.table_resize = None && V.Smap.find "title" release.V.sized = 213 &&
      V.finish_table_resize release ~owner:7 ~commit:true = release);
  let low = V.move_table_resize start ~owner:7 ~x:(-1000.) in
  let high = V.move_table_resize start ~owner:7 ~x:1000. in
  check "Resize previews clamp to the table's supported width range"
    (Option.map (fun r -> r.V.resize_preview) low.V.table_resize = Some 40 &&
      Option.map (fun r -> r.V.resize_preview) high.V.table_resize = Some 500);
  check "A disposed older header cannot finish another header's drag"
    (V.finish_table_resize move ~owner:8 ~commit:false = move);
  let switched = { move with V.view_uuid = "table-b" } in
  let stale = V.finish_table_resize switched ~owner:7 ~commit:true in
  check "A previous view's drag never commits into the current view"
    (stale.V.table_resize = None && stale.V.sized = initial.V.sized)

let settings_date_format ~registry ~profile ~finish =
  let previous_settings = !Settings_state.st and previous_model = !Runtime.read_model
  and previous_worker = !Runtime.worker in
  let rec next = function
    | [] ->
        Settings_state.st := previous_settings;
        Runtime.read_model := previous_model;
        Runtime.worker := previous_worker;
        finish ()
    | (failed, transition) :: rest ->
        Settings_state.st := None;
        let current = ref { Model.initial with repo = Some "format-save-fixture" } in
        Runtime.read_model := (fun () -> !current);
        let acknowledge = ref (fun () -> ()) in
        let requested = ref (fun () -> ()) in
        let dispatched = Js.Promise.make (fun ~resolve ~reject:_ ->
          requested := (fun () -> let value = () in resolve value [@u])) in
        Runtime.worker := Some {
          Worker_client.invoke_fn = (fun name _ ->
            if name <> "thread-api/apply-outliner-ops" then
              failwith ("Unexpected date format request: " ^ name);
            Js.Promise.make (fun ~resolve ~reject ->
              acknowledge := (fun () ->
                if failed then reject (Failure "format persistence failed") [@u]
                else resolve Wire.Nil [@u]);
              !requested ()));
          on_message = (fun _ _ -> ());
          dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) };
        let session = S.mount ~registry ~profile ~initial:!current
          ~reducer:(fun model () -> model)
          ~view:(fun context _ _ ->
            Settings_state.ensure context;
            Lui_elements.column []) () in
        Settings_state.set (fun state ->
          { state with journal_uuid = Some "journal-format-fixture" });
        let original = (Settings_state.value ()).date_format in
        let saved = Settings_state.set_date_format "yyyy-MM-dd" in
        check "Journal format remains persisted value while its save is pending"
          ((Settings_state.value ()).date_format = original);
        let stale = transition = `Navigate in
        (match transition with
         | `None -> ()
         | `Refresh ->
             current := Update.update !current (Action.Journals_loaded [])
         | `Navigate ->
             Settings_state.deactivate ();
             current := Update.update !current (Action.Navigate_to Model.Home);
             Settings_state.set (fun _ ->
               { Settings_state.initial with date_format = "dd-MM-yyyy" }));
        ignore (Js.Promise.then_ (fun () ->
          !acknowledge ();
          Js.Promise.resolve ()) dispatched);
        let settled = Js.Promise.then_ (fun _ -> Js.Promise.resolve ()) saved
          |> Js.Promise.catch (fun _ -> Js.Promise.resolve ()) in
        ignore (Js.Promise.then_ (fun () ->
          eqs "Only acknowledged saves in the originating graph update its format"
            (if stale then "dd-MM-yyyy" else if failed then original else "yyyy-MM-dd")
            (Settings_state.value ()).date_format;
          ignore (Lui_app.dispose session.S.app);
          next rest;
          Js.Promise.resolve ()) settled)
  in
  next [false, `None; true, `None; false, `Refresh; false, `Navigate]

let configured_continuations finish =
  let open Promise_ext in
  let previous_model = !Runtime.read_model and previous_worker = !Runtime.worker in
  let previous_flush = !Runtime.app_flush and previous_popup = !Popups_state.active in
  let previous_editor_cell = !Editor_state.st in
  Editor_state.st := Some (Signal.state (Signal.scheduler ()) (Editor_state.read ()));
  let previous_input_seq = !Editor_state.edit_input_seq in
  let previous_pending = !Outliner_ops.pending_save in
  let previous_timer = !Outliner_ops.save_timer in
  let previous_history = !Editor_state.history_input_before in
  Outliner_ops.pending_save := None;
  Runtime.app_flush := (fun () -> ());
  let uuid = "configured-continuation-fixture" in
  let rec next = function
    | [] ->
        Runtime.read_model := previous_model;
        Runtime.worker := previous_worker;
        Runtime.app_flush := previous_flush;
        Popups_state.active := previous_popup;
        Editor_state.st := previous_editor_cell;
        Editor_state.edit_input_seq := previous_input_seq;
        Outliner_ops.pending_save := previous_pending;
        Outliner_ops.save_timer := previous_timer;
        Editor_state.history_input_before := previous_history;
        finish ()
    | transition :: rest ->
        let model = ref {Model.initial with repo = Some "configured-continuation"} in
        Runtime.read_model := (fun () -> !model);
        let editor = Editor_state.mk_editing ~uuid ~scope:"main"
            ~buffer:"seed" ~base:"seed" ~caret:4 () in
        Editor_state.set (fun state -> {state with editing = Some editor});
        let popup = Popups_state.make (Signal.scheduler ()) in
        let ac : Popups_state.ac =
          {kind = Slash; x = 0.; y = 0.; cy = 0.; pos_pending = false;
           flip = None; flipx = None; query = ""; tpos = 0; tlen = 0;
           items = []; chosen = 0; auuid = uuid; editor = Some editor} in
        let release = ref (fun () -> ()) in
        let requested = ref (fun () -> ()) in
        let dispatched = Js.Promise.make (fun ~resolve ~reject:_ ->
          requested := (fun () -> let value = () in resolve value [@u])) in
        Runtime.worker := Some {
          Worker_client.invoke_fn = (fun name _ ->
            if name <> "thread-api/pull" then
              failwith ("Unexpected configured continuation request: " ^ name);
            Js.Promise.make (fun ~resolve ~reject:_ ->
              release := (fun () -> resolve (Wire.Map []) [@u]);
              !requested ()));
          on_message = (fun _ _ -> ());
          dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
        let steps = Option.get (Popups_state.configured_program (Edn.parse
          "[[:editor/set-property-on-block-property :user/ref :user/flag true] \
            [:editor/input \"continued\" {:last-pattern :skip-check}]]")) in
        let pending = Popups_state.run_configured popup ac
            ~unsupported:(fun () -> failwith "Supported configured continuation rejected") steps in
        ignore (Js.Promise.then_ (fun () ->
          (match transition with
           | `Unchanged -> ()
           | `Input ->
               Editor_actions.update_model uuid (fun _ ->
                 Edit_model.select (Edit_model.create ~units:editor.model.units "new input")
                   ~anchor:9 ~focus:9);
               Editor_state.note_input ()
           | `Epoch -> Editor_state.set (fun state -> {state with editing = Some
               (Editor_state.mk_editing ~uuid ~scope:"main" ~buffer:"new session"
                  ~base:"new session" ~caret:11 ())})
           | `Scope -> Editor_state.set (fun state ->
               {state with editing = Some {editor with scope = "right"}})
           | `Caret -> Editor_actions.set_caret uuid 2
           | `Popup -> incr popup.session
           | `Repo -> model := {!model with repo = Some "another-graph"}
           | `Route -> model := Update.update !model (Action.Navigate_to Model.All_pages));
          let before = Option.get (Editor_state.editing ()) in
          !release ();
          let* () = pending in
          let after = Option.get (Editor_state.editing ()) in
          check "Configured continuations only edit their unchanged originating checkpoint"
            (if transition = `Unchanged then after.buffer = "seedcontinued"
             else after.buffer = before.buffer && after.model.caret = before.model.caret
               && after.epoch == before.epoch && after.scope = before.scope);
          Outliner_ops.cancel_pending_save ();
          Ui_services.timers_clear_timeout !Outliner_ops.save_timer;
          next rest;
          Js.Promise.resolve ()) dispatched)
  in
  next [`Unchanged; `Input; `Epoch; `Scope; `Caret; `Popup; `Repo; `Route]

let configured_popup_ownership () =
  let previous_model = !Runtime.read_model and previous_editor = !Editor_state.st in
  let previous_popup = !Editor_commands.active and previous_signal = !Editor_commands.popup_vs in
  let previous_open = !Runtime.editor_popup_open and previous_flush = !Runtime.app_flush in
  let previous_seq = !Editor_state.edit_input_seq and previous_history = !Editor_state.history_input_before in
  let previous_pending = !Outliner_ops.pending_save and previous_timer = !Outliner_ops.save_timer in
  Editor_state.st := Some (Signal.state (Signal.scheduler ()) (Editor_state.read ()));
  Editor_commands.popup_vs := None;
  Runtime.app_flush := (fun () -> ());
  Outliner_ops.pending_save := None;
  Fun.protect ~finally:(fun () ->
    Ui_services.timers_clear_timeout !Outliner_ops.save_timer;
    Runtime.read_model := previous_model; Editor_state.st := previous_editor;
    Editor_commands.active := previous_popup; Editor_commands.popup_vs := previous_signal;
    Runtime.editor_popup_open := previous_open; Runtime.app_flush := previous_flush;
    Editor_state.edit_input_seq := previous_seq; Editor_state.history_input_before := previous_history;
    Outliner_ops.pending_save := previous_pending; Outliner_ops.save_timer := previous_timer)
    (fun () -> List.iter (fun image -> List.iter (fun transition ->
      let uuid = "configured-popup-owner" in
      let model = ref {Model.initial with repo = Some "configured-popup"} in
      Runtime.read_model := (fun () -> !model);
      let editor = Editor_state.mk_editing ~uuid ~scope:"main"
          ~buffer:"/link" ~base:"/link" ~caret:5 () in
      Editor_state.set (fun state -> {state with editing = Some editor});
      let popup_session = ref 0 in
      let checkpoint : Popups_state.configured_checkpoint =
        {configured_uuid=uuid; configured_caret=5; configured_editor=editor;
         configured_repo="configured-popup"; configured_route=Runtime.route ();
         configured_input_seq= !Editor_state.edit_input_seq;
         configured_popup_session=popup_session; configured_popup_generation=0;
         configured_lease=(fun () -> true)} in
      let open_popup () =
        if image then begin
          Editor_commands.open_link_form ~configured:checkpoint false uuid 0;
          Editor_commands.update_p (fun popup -> {popup with kind=Link_form
            {image=false;url="https://example.com";label="Example"}})
        end else Editor_commands.open_cal ~configured:checkpoint (Cal_insert "") uuid 0 in
      open_popup ();
      let popup = Option.get !Editor_commands.active in
      (match transition with
       | `Unchanged -> ()
       | `Epoch -> Editor_state.set (fun state -> {state with editing = Some
           (Editor_state.mk_editing ~uuid ~scope:"main" ~buffer:"/link" ~base:"/link" ~caret:5 ())})
       | `Scope -> Editor_state.set (fun state -> {state with editing=Some {editor with scope="right"}})
       | `Input -> Editor_state.note_input ()
       | `Source -> Editor_actions.update_model uuid (fun value -> Edit_model.set_source value "newer text")
       | `Caret -> Editor_actions.set_caret uuid 2
       | `Popup -> open_popup ()
       | `Autocomplete -> incr popup_session
       | `Repo -> model := {!model with repo=Some "another-graph"}
       | `Route -> model := Update.update !model (Action.Navigate_to Model.All_pages));
      let before = Option.get (Editor_state.editing ()) in
      if image then Editor_commands.submit_link popup else Editor_commands.commit_cal popup;
      let after = Option.get (Editor_state.editing ()) in
      check "Configured popup completion only mutates its owning editor checkpoint"
        (if transition = `Unchanged then after.buffer <> before.buffer
         else after.buffer=before.buffer && after.epoch == before.epoch
           && after.scope=before.scope && after.model.caret=before.model.caret);
      Ui_services.timers_clear_timeout !Outliner_ops.save_timer;
      Outliner_ops.pending_save := None;
      Editor_commands.active := None;
      Runtime.editor_popup_open := false)
      [`Unchanged; `Epoch; `Scope; `Input; `Source; `Caret; `Popup; `Autocomplete; `Repo; `Route]) [false;true])

let page_disclosure ~registry ~profile =
  let previous_flush = !Runtime.app_flush in
  let previous_hidden = !Properties_state.show_hidden in
  let previous_editor = !Editor_state.st and previous_fields = !Editor_state.field_sigs_opt in
  Fun.protect ~finally:(fun () ->
    Editor_state.st := previous_editor; Editor_state.field_sigs_opt := previous_fields;
    Properties_state.show_hidden := previous_hidden;
    Runtime.app_flush := previous_flush) (fun () ->
    Properties_state.show_hidden := false;
    List.iter (fun is_tag ->
      Editor_state.st := None; Editor_state.field_sigs_opt := None;
      let uuid = if is_tag then "disclosure-tag" else "disclosure-journal" in
      let page = {(Test_check.page []) with Model.page_uuid=Some uuid;
        page_is_tag=is_tag} in
      let session = S.mount ~registry ~profile ~initial:Model.initial
        ~reducer:(fun model () -> model)
        ~view:(fun context _ _ ->
          ignore (Properties_state.area_state context
            ~key:(Properties_area.page_key uuid) ~fetch:(fun _ -> Js.Promise.resolve ()));
          Page.page_title_el Model.initial page) () in
      Runtime.app_flush := (fun () -> S.flush session);
      let arrow () = List.find (fun node -> class_has node "rotating-arrow") (nodes session) in
      let title_row () = List.find (fun node -> class_has node "is-page-title-row") (nodes session) in
      let control () = List.find (fun node -> M.string_prop node "accessibility-identifier"=Some ("control-" ^ uuid)) (nodes session) in
      let visible () = Hashtbl.find_opt (arrow ()).M.props "opacity"=Some (P.FloatValue 1.) in
      check "Page disclosure is hidden before title hover" (not (visible ()));
      S.dispatch session (P.PointerEnter (title_row ()).M.id);
      check "Only collapsable page titles reveal their disclosure" (visible ()=is_tag);
      if not is_tag then begin
        let area = Hashtbl.find Properties_state.areas (Properties_area.page_key uuid) in
        Runtime.signal_set area.Properties_state.a_state
          {Properties_state.empty_area_data with hidden=[Wire.Nil]};
        S.flush session;
        check "Live property data reveals disclosure without a DOM attribute read" (visible ());
        Runtime.signal_set area.Properties_state.a_state Properties_state.empty_area_data;
        S.flush session;
        check "Removing the last property hides disclosure while still hovered" (not (visible ()))
      end;
      if is_tag then begin
        let press () =
          S.press session (control ()).M.id;
          S.flush session in
        check "Class titles start collapsed" (class_has (arrow ()) "collapsed");
        press ();
        check "Page disclosure updates its direction after expanding"
          (class_has (arrow ()) "not-collapsed");
        check "Expanding a page title reveals its property area"
          (List.exists (fun node -> class_has node "ls-page-properties") (nodes session));
        press ();
        check "Repeated page disclosure presses collapse the title again"
          (class_has (arrow ()) "collapsed");
        check "Collapsing a page title removes its property area"
          (not (List.exists (fun node -> class_has node "ls-page-properties") (nodes session)))
      end;
      S.dispatch session (P.PointerLeave (title_row ()).M.id);
      check "Page disclosure hides when the pointer leaves" (not (visible ()));
      ignore (Lui_app.dispose session.S.app);
      Hashtbl.remove Properties_state.areas (Properties_area.page_key uuid)) [false;true])

let reference_disclosure ~registry ~profile =
  let previous_flush = !Runtime.app_flush and previous_worker = !Runtime.worker in
  let previous_settings = !Settings_state.st in
  let previous_editor = !Editor_state.st and previous_fields = !Editor_state.field_sigs_opt in
  let writes = ref 0 in
  let scope = "reference-disclosure" in
  let child_id = "reference-default-child" and leaf_id = "reference-default-leaf" in
  let default block = {block with Model.block_default_collapsed = true} in
  let child = default (Test_check.block child_id "Reference child"
    ~children:[Test_check.block leaf_id "Reference leaf"]) in
  let empty = default (Test_check.block "reference-empty" "Empty reference") in
  let root = Test_check.block "reference-root" "Reference root" ~children:[child;empty] in
  let blank = Test_check.block "reference-blank" "" in
  let child = {child with Model.block_children = child.Model.block_children @ [blank]} in
  let root = {root with Model.block_children = [child;empty]} in
  Fun.protect ~finally:(fun () ->
    Editor_state.st := previous_editor; Editor_state.field_sigs_opt := previous_fields;
    Settings_state.st := previous_settings;
    Runtime.worker := previous_worker; Runtime.app_flush := previous_flush) (fun () ->
    Editor_state.st := None; Editor_state.field_sigs_opt := None;
    Settings_state.st := None;
    Runtime.worker := Some {Worker_client.invoke_fn=(fun name _ ->
      if name = "thread-api/apply-outliner-ops" then incr writes;
      Js.Promise.resolve Wire.Nil);
      on_message=(fun _ _ -> ());
      dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
    let session = S.mount ~registry ~profile ~initial:Model.initial
      ~reducer:(fun model () -> model)
      ~view:(fun _ _ _ -> Tree.block_row_static
        ~collapse_scope:scope ~persist_collapse:false root) () in
    Fun.protect ~finally:(fun () -> ignore (Lui_app.dispose session.S.app)) (fun () ->
      Runtime.app_flush := (fun () -> S.flush session);
      check "Static reference rows mount without registering an editable ref scope"
        (Option.is_none (Editor_state.block_source "ref"));
      let editable uuid =
        List.exists (fun node ->
          M.string_prop node "accessibility-identifier"=Some ("ls-block-" ^ uuid)
          && List.assoc_opt "data-editable" (P.data_attrs_decode
            (Option.value (M.string_prop node "data-attrs") ~default:""))=Some "true")
          (nodes session) in
      check "Linked-reference roots and children advertise editability"
        (editable "reference-root" && editable child_id);
      check "Linked-reference editing resolves its root and child in the occurrence scope"
        (Editor_state.find_in (Editor_state.blocks_in_scope scope) child_id<>None);
      Editor_state.set_collapsed ~scope:"other-reference" child_id false;
      S.flush session;
      let leaf_visible () = List.exists (fun node ->
        M.string_prop node "accessibility-identifier"=Some ("ls-block-" ^ leaf_id))
        (nodes session) in
      let press uuid =
        let control = List.find (fun node -> M.string_prop node "accessibility-identifier"
          = Some ("control-" ^ uuid)) (nodes session) in
        S.press session control.M.id; S.flush session in
      check "A default-collapsed reference child initially hides its descendants" (not (leaf_visible ()));
      List.iter (fun expanded ->
        press child_id;
        check "Repeated reference caret presses expand and collapse the same child"
          (leaf_visible ()=expanded
           && Editor_state.effective_collapsed ~scope child=not expanded);
        check "Reference disclosure leaves another projection's override unchanged"
          (not (Editor_state.effective_collapsed ~scope:"other-reference" child)))
        [true;false;true;false];
      press "reference-empty";
      check "An empty reference child cannot create a collapse override"
        (not (Editor_state.is_collapsed_in ~scope "reference-empty")
         && not (leaf_visible ()));
      check "Reference disclosure never writes a graph collapse property" (!writes=0);
      let edit uuid title =
        Editor_state.set (fun state -> {state with Editor_state.editing=Some
          (Editor_state.mk_editing ~uuid ~scope ~buffer:title ~base:title ())});
        S.flush session;
        List.filter (fun n -> M.string_prop n "accessibility-identifier"
          =Some ("editor-edit-block-" ^ uuid)) (nodes session) in
      check "A linked-reference child mounts its editor in place"
        (List.length (edit child_id "Reference child")=1);
      check "Editing the linked root replaces the child editor instead of duplicating it"
        (List.length (edit "reference-root" "Reference root")=1
         && not (List.exists (fun n -> M.string_prop n "accessibility-identifier"
           =Some ("editor-edit-block-" ^ child_id)) (nodes session)))))

let preview_reference_disclosure ~registry ~profile =
  let previous_flush = !Runtime.app_flush and previous_worker = !Runtime.worker in
  let previous_settings = !Settings_state.st in
  let previous_editor = !Editor_state.st and previous_fields = !Editor_state.field_sigs_opt in
  let opened = ref [] in
  let root_id = "preview-reference-root" and child_id = "preview-reference-child" in
  let root = Test_check.block root_id "Preview root"
    ~children:[Test_check.block child_id "Preview child"] in
  Fun.protect ~finally:(fun () ->
    Editor_state.st := previous_editor; Editor_state.field_sigs_opt := previous_fields;
    Settings_state.st := previous_settings;
    Runtime.worker := previous_worker; Runtime.app_flush := previous_flush) (fun () ->
    Editor_state.st := None; Editor_state.field_sigs_opt := None;
    Settings_state.st := None;
    Runtime.worker := Some {Worker_client.invoke_fn=(fun _ _ -> Js.Promise.resolve Wire.Nil);
      on_message=(fun _ _ -> ());dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
    let session = S.mount ~registry ~profile ~initial:Model.initial
      ~reducer:(fun model () -> model)
      ~view:(fun _ _ _ context parent ->
        let extras = Popups_view.preview_row_extras context [root_id,0;child_id,1]
          ~open_in_sidebar:(fun uuid -> opened := uuid :: !opened)
          ~render_references:(fun uuid -> Lui_elements.text
            ~value:("references for " ^ uuid) []) in
        Tree.block_row ~scope:"preview-reference-count-test" ~editable:false ~extras root
          context parent) () in
    Fun.protect ~finally:(fun () -> ignore (Lui_app.dispose session.S.app)) (fun () ->
      Runtime.app_flush := (fun () -> S.flush session);
      let counter uuid = List.find_opt (fun node ->
        M.string_prop node "accessibility-identifier"=Some ("preview-reference-count-" ^ uuid))
        (nodes session) in
      let references_visible () = List.exists (fun node ->
        M.string_prop node "text"=Some ("references for " ^ child_id)) (nodes session) in
      check "A nested preview block exposes its positive count without a zero-count root badge"
        (Option.is_some (counter child_id) && Option.is_none (counter root_id)
         && not (references_visible ()));
      let child_counter = Option.get (counter child_id) in
      check "Preview reference counts expose the action's accessible label"
        (M.string_prop child_counter "accessibility-label" =
           Some (I18n.t "block/open-block-references"));
      let click modifiers =
        S.dispatch session (P.PressDetail (child_counter.M.id,
          {x=0.;y=0.;modifiers;button=0;target_class=""}));
        S.press session child_counter.M.id;
        S.flush session in
      List.iter (fun expected ->
        click 0;
        check "Preview count presses expand and re-collapse the referenced block's inline references"
          (references_visible ()=expected && !opened=[])) [true;false];
      click 2;
      check "Shift-clicking a preview count opens that block's sidebar references without expanding inline"
        (!opened=[child_id] && not (references_visible ()));
      opened := [];
      List.iter (fun modifiers ->
        click modifiers;
        check "Unshifted modifier presses toggle inline references without opening the sidebar"
          (!opened=[] && references_visible ()=(modifiers=0))) [0;1];
      click 2;
      check "Shift-modified preview activation opens sidebar references without expanding inline"
        (!opened=[child_id] && not (references_visible ()))))

let keymap_recording_workflow ~registry ~profile ~finish =
  let previous_flush = !Runtime.app_flush in
  let previous_send = !Runtime.app_send in
  let errors = ref 0 in
  Runtime.app_send := (function
    | Action.Toast_push { Model.toast_kind = "error"; _ } -> incr errors; true
    | _ -> false);
  let previous = Ui_services.storage_get "ls-shortcuts" in
  Ui_services.storage_remove "ls-shortcuts";
  Keymap_data.reload_shortcuts ();
  let id = "ui/toggle-left-sidebar" in
  let row = List.find (fun (r : Keymap_data.row) ->
    Keymap_data.command_id r.title = id)
    (Keymap_data.unique_rows (Keymap_data.current_items ())) in
  let view ctx _ _ =
    let st = Signal.state ctx.Lui_ui.ui_scheduler (Settings_page.initial_keymap ()) in
    let editing = Signal.state ctx.ui_scheduler (Some id) in
    Settings_page.keymap_row st editing ~key:"recorder-fixture" row in
  let session = S.mount ~registry ~profile ~initial:Model.initial
    ~reducer:(fun m () -> m) ~view () in
  Runtime.app_flush := (fun () -> S.flush session);
  let key key =
    Keyboard_capture.dispatch
      { Ui_services.x = 0.; y = 0.; shift = false; meta = false; ctrl = false;
        alt = false; composing = false; key = Some key; key_char = None;
        buttons = 0; button = 0; repeat = false; movement_x = 0.; movement_y = 0.;
        default_prevented = false; target = None; touches = [];
        detail = (fun _ -> None); detail_json = (fun _ -> None);
        clipboard_get = (fun _ -> "");
        clipboard_snapshot = (fun () -> Ui_services.empty_clipboard_snapshot);
        clipboard_set = (fun _ _ -> ()); data_transfer_get = (fun _ -> "");
        files = []; has_files = false; prevent_default = (fun () -> ());
        stop_propagation = (fun () -> ()); stop_immediate = (fun () -> ()) };
    S.flush session in
  let later f = ignore (Ui_services.timers_timeout f 450) in
  let original = Keymap_data.bindings id in
  key "F8";
  later (fun () ->
    check "shortcut recording auto-saves without an explicit Save action"
      (Keymap_data.bindings id = original @ ["f8"]);
    key "g";
    key "Escape";
    check "Escape cancels pending shortcut input without closing its recorder"
      (Keyboard_capture.active ());
    later (fun () ->
      check "cancelled shortcut input cannot commit after its debounce"
        (Keymap_data.bindings id = original @ ["f8"]);
      key "Backspace";
      check "idle Backspace removes the last committed shortcut"
        (Keymap_data.bindings id = original);
      let storage : Js.Json.t = Stub_dom.get_field Stub_dom.global "localStorage" in
      let set_item : string -> string -> unit = Stub_dom.get_field storage "setItem" in
      Stub_dom.set_field storage "setItem" (fun name value ->
        if name = "ls-shortcuts" then failwith "shortcut storage fixture"
        else set_item name value);
      key "F9";
      later (fun () ->
        Stub_dom.set_field storage "setItem" set_item;
        check "a rejected shortcut write preserves the saved bindings"
          (Keymap_data.bindings id = original);
        eqi "a rejected shortcut write reports its failure once" 1 !errors;
        key "Escape";
        ignore (Lui_app.dispose session.S.app);
        check "recorder disposal releases its exclusive keyboard ownership"
          (not (Keyboard_capture.active ()));
        (match previous with
         | Some value -> Ui_services.storage_set "ls-shortcuts" value
         | None -> Ui_services.storage_remove "ls-shortcuts");
        Keymap_data.reload_shortcuts ();
        Runtime.app_send := previous_send;
        Runtime.app_flush := previous_flush;
        finish ())))

let sidebar_history ~registry ~profile ~finish =
  let open Promise_ext in
  let previous_model = !Runtime.read_model and previous_send = !Runtime.app_send
  and previous_flush = !Runtime.app_flush and previous_worker = !Runtime.worker
  and previous_sidebar_model = !Sidebar_state.model_signal
  and previous_snapshot = !Editor_actions.History_ui.sidebar_snapshot
  and previous_restore = !Editor_actions.History_ui.restore_sidebar
  and previous_paused = !Editor_actions.History_ui.paused
  and previous_restoring = !Editor_actions.History_ui.restoring in
  let previous_storage = Ui_services.storage_get Sidebar_state.right_sidebar_storage_key in
  let sidebar = ref None in
  let session = S.mount ~registry ~profile
    ~initial:{Model.initial with repo=Some "sidebar-history-fixture";
      route=Model.Page "Current"; phase=Model.Ready}
    ~reducer:Update.update ~view:(fun ctx ms _ ->
      let state value = Signal.state ctx.Lui_ui.ui_scheduler value in
      let st : Sidebar_state.t =
        { favorites=state [];home_page=state None;favorite_drop=state None;recents=state [];
          nav_checked=state [];nav_tag_titles=state [];items=state [];
          block_sources=Hashtbl.create 4;open_menu=state "";groups_collapsed=state [];
          left_width=state 246.;right_fraction=state 0.3;viewport_w=state 1440.;
          restored_repo=ref (Some "sidebar-history-fixture");restoring=ref false;
          history_repo=ref None;history_state=ref None } in
      sidebar:=Some st;
      Sidebar_state.model_signal:=Some ms;
      Sidebar_state.bind_history st;
      let subscription = Signal.subscribe ~emit_initial:false ms
        (fun _ -> Sidebar_state.persist_right_sidebar st) in
      Signal.on_dispose ctx.ui_scope (fun () -> Signal.dispose_subscription subscription);
      Lui_elements.column []) () in
  let st = Option.get !sidebar in
  Runtime.read_model := (fun () -> Lui_app.model session.S.app);
  Runtime.app_flush := (fun () -> S.flush session);
  Runtime.app_send := (fun action ->
    let changed = Lui_app.send session.S.app action in S.flush session; changed);
  Editor_actions.History_ui.paused:=false;
  Editor_actions.History_ui.restoring:=None;
  let payloads = ref [] and reject_page = ref false in
  Runtime.worker := Some {Worker_client.invoke_fn=(fun name args ->
    match name,args with
    | "thread-api/undo-redo-record-ui-state",[Wire.String "sidebar-history-fixture";Wire.String payload] ->
        payloads:= !payloads @ [payload];Js.Promise.resolve Wire.Nil
    | "thread-api/get-page-route-info",_ when !reject_page ->
        Js.Promise.then_ (fun () -> failwith "sidebar history fixture rejection") (Js.Promise.resolve ())
    | _ -> Js.Promise.resolve Wire.Nil);
    on_message=(fun _ _ -> ());dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
  let rec settle n = if n=0 then Js.Promise.resolve () else
    Js.Promise.then_ (fun () -> settle (n-1)) (Js.Promise.resolve ()) in
  let restore undo payload = Editor_actions.restore_history
    (Wire.Map [Wire.kw "undo?",Wire.Bool undo;Wire.kw "ui-state-str",Wire.String payload]) in
  let items () = Runtime.signal_get st.items in
  let cleanup () =
    st.restoring:=true;Sidebar_state.set_items st [];
    ignore (Lui_app.dispose session.S.app);
    Runtime.read_model:=previous_model;Runtime.app_send:=previous_send;
    Runtime.app_flush:=previous_flush;Runtime.worker:=previous_worker;
    Sidebar_state.model_signal:=previous_sidebar_model;
    Editor_actions.History_ui.sidebar_snapshot:=previous_snapshot;
    Editor_actions.History_ui.restore_sidebar:=previous_restore;
    Editor_actions.History_ui.paused:=previous_paused;
    Editor_actions.History_ui.restoring:=previous_restoring;
    (match previous_storage with
     | Some value -> Ui_services.storage_set Sidebar_state.right_sidebar_storage_key value
     | None -> Ui_services.storage_remove Sidebar_state.right_sidebar_storage_key);
    finish () in
  ignore ((let* () = settle 8 in
    Sidebar_state.persist_right_sidebar st;
    Sidebar_state.open_sticky_item st "help";
    let* () = settle 8 in
    check "Sidebar membership and open state enter UI undo history" (!payloads<>[]);
    Sidebar_state.open_sticky_item st "shortcut-settings";
    Sidebar_state.toggle_collapsed st "help";
    let* () = settle 8 in
    let collapsed_payload = List.hd (List.rev !payloads) in
    let count = List.length !payloads in
    let* () = restore true collapsed_payload in
    check "Sidebar undo preserves order and expands the previously open item"
      (List.map (fun (it : Sidebar_state.item) -> it.key,it.collapsed) (items ()) =
       ["shortcut-settings",false;"help",false]
       && (Runtime.model ()).right_sidebar_open);
    let* () = restore false collapsed_payload in
    check "Sidebar redo restores the recorded collapse without recording itself"
      (List.map (fun (it : Sidebar_state.item) -> it.key,it.collapsed) (items ()) =
       ["shortcut-settings",false;"help",true] && List.length !payloads=count);
    Sidebar_state.clear_items st;
    let* () = settle 8 in
    check "Closing every sidebar item records an empty closed sidebar"
      (items ()=[] && not (Runtime.model ()).right_sidebar_open);
    let closed_payload = List.hd (List.rev !payloads) in
    let* () = restore true closed_payload in
    check "Undo of sidebar close restores its open state"
      ((Runtime.model ()).right_sidebar_open);
    let* () = restore false closed_payload in
    check "Redo of sidebar close restores an empty closed sidebar"
      (items ()=[] && not (Runtime.model ()).right_sidebar_open);
    let page = Option.get (Sidebar_state.static_item "page-missing" "page" "Missing") in
    let page = {page with Sidebar_state.uuid=Some "missing"} in
    let old_state = Editor_actions.History_ui.snapshot (Runtime.route ()) in
    st.restoring:=true;Sidebar_state.set_items st [page];st.restoring:=false;
    let new_state = Editor_actions.History_ui.snapshot (Runtime.route ()) in
    st.restoring:=true;Sidebar_state.set_items st [];st.restoring:=false;
    Sidebar_state.persist_right_sidebar st;
    let failing = Transit.to_string (Editor_actions.History_ui.map
      ["old-state",old_state;"new-state",new_state]) in
    reject_page:=true;
    let rejected=ref false in
    let* () = restore false failing |> Js.Promise.catch (fun _ ->
      rejected:=true;Js.Promise.resolve ()) in
    check "Failed sidebar hydration leaves membership intact and releases history pause"
      (!rejected && items ()=[] && not !Editor_actions.History_ui.paused);
    let count=List.length !payloads in
    Sidebar_state.open_sticky_item st "help";
    let* () = settle 8 in
    check "Sidebar actions can be recorded after a failed history restoration"
      (List.length !payloads>count);
    cleanup ();Js.Promise.resolve ())
    |> Js.Promise.catch (fun _ -> check "Sidebar history workflow completes" false;
      cleanup ();Js.Promise.resolve ()))

let preview_block_spacing ~registry ~profile =
  let previous_editor = !Editor_state.st and previous_fields = !Editor_state.field_sigs_opt
  and previous_settings = !Settings_state.st and previous_popup = !Popups_state.active in
  Fun.protect ~finally:(fun () ->
    Editor_state.st:=previous_editor; Editor_state.field_sigs_opt:=previous_fields;
    Settings_state.st:=previous_settings; Popups_state.active:=previous_popup) (fun () ->
    let page = {(Test_check.page []) with Model.page_title="Containing page"} in
    List.iter (fun (root_uuid,block_preview) ->
      Editor_state.st:=None; Editor_state.field_sigs_opt:=None; Settings_state.st:=None;
      let session = S.mount ~registry ~profile ~initial:Model.initial
        ~reducer:(fun model () -> model) ~view:(fun _ _ _ context parent ->
          Popups_view.pv_popover (Popups_state.make context.Lui_ui.ui_scheduler)
            {Popups_state.pv_x=10.;pv_y=10.;pv_content={pc_title="Containing page";
              pc_page=Some page;pc_root_uuid=root_uuid;pc_ref_counts=None;
              pc_blocks=[Test_check.block "preview-spacing-root" "Preview parent"
                ~children:[Test_check.block "preview-spacing-child" "Preview child"]]}}
            context parent) () in
      Fun.protect ~finally:(fun () -> ignore (Lui_app.dispose session.S.app)) (fun () ->
        let sections=List.find (fun n -> class_has n "page") (nodes session) in
        let title=List.find (fun n -> M.string_prop n "accessibility-identifier"
          =Some "page title") (nodes session) in
        let prop n key value = Hashtbl.find_opt n.M.props key=Some (P.IntValue value) in
        check "Page and block previews retain Master's section gap and page-inner bottom margin"
          (prop sections "gap" 32 && prop sections "margin-bottom" 64);
        check "Block preview breadcrumbs retain both my-2 margins without changing page titles"
          (prop title "margin-top" (if block_preview then 8 else 0)
           && prop title "margin-bottom" (if block_preview then 8 else 0));
        check "Page preview titles retain Master's ls-block vertical padding, unlike breadcrumbs"
          (prop title "padding-vertical" (if block_preview then 0 else 2))))
      [Some "preview-spacing-root",true;page.Model.page_uuid,false])

let bottom_pills_rows () =
  let row ident title ty value = Wire.Map [
    Wire.kw "property-id", Wire.kw ident;
    Wire.kw "property", Wire.Map [Wire.kw "block/title", Wire.String title;
      Wire.kw "block/uuid", Wire.Uuid (if ty="node" then "00000000-0000-4000-8000-000000000031" else "00000000-0000-4000-8000-000000000032");
      Wire.kw "logseq.property/type", Wire.kw ty];
    Wire.kw "value", value] in
  [row "fixture/bottom-node" "Bottom Node" "node"
     (Wire.Map [Wire.kw "block/title", Wire.String (String.concat " "
         (List.init 16 (fun _ -> "Long node property value")));
       Wire.kw "block/uuid", Wire.Uuid "00000000-0000-4000-8000-000000000033"]);
   row "fixture/bottom-number" "Bottom Number" "number" (Wire.Int 42)]

let bottom_pills_fixture ?source ?(overlays = false) profile initial_rows =
  let rows = ref None in
  let source = Option.value source ~default:(ref initial_rows) in
  let uuid = "00000000-0000-4000-8000-000000000030" in
  let session = S.mount ~profile ~initial:Model.initial ~reducer:(fun model () -> model)
    ~view:(fun context _ _ ->
      let state = Properties_state.area_state context ~key:(Properties_area.block_key uuid)
        ~fetch:(fun publish -> publish {Properties_state.empty_area_data with below= !source};
          Js.Promise.resolve ()) in
      rows := Some state;
      Lui_elements.column
        ([Tree.block_row_sig (Signal.constant context.Lui_ui.ui_scheduler
          (Test_check.block uuid "Bottom properties owner"))]
         @ if overlays then [Properties_view.overlays] else [])) () in
  Runtime.signal_set (Option.get !rows) {Properties_state.empty_area_data with below=initial_rows};
  S.flush session;
  session, Option.get !rows

let bottom_pills ~profile =
  let previous_flush = !Runtime.app_flush in
  let previous_editor = !Editor_state.st and previous_fields = !Editor_state.field_sigs_opt
  and previous_settings = !Settings_state.st in
  Editor_state.st:=None; Editor_state.field_sigs_opt:=None; Settings_state.st:=None;
  let session, rows = bottom_pills_fixture profile (bottom_pills_rows ()) in
  Runtime.app_flush := (fun () -> S.flush session);
  Fun.protect ~finally:(fun () ->
    ignore (Lui_app.dispose session.S.app); Runtime.app_flush := previous_flush;
    Editor_state.st:=previous_editor; Editor_state.field_sigs_opt:=previous_fields;
    Settings_state.st:=previous_settings;
    Hashtbl.remove Properties_state.areas (Properties_area.block_key "00000000-0000-4000-8000-000000000030")) (fun () ->
    let find cls = List.find (fun n -> class_has n cls) (nodes session) in
    let control () = find "bottom-property-expand-btn" in
    let check_prop node name value = Hashtbl.find_opt node.M.props name=Some value in
    check "Collapsed bottom properties use intrinsic fitting and retain a single 32px row"
      (List.exists (fun n -> n.M.kind="view-that-fits") (nodes session)
       && check_prop (find "bottom-properties-row") "max-height" (P.IntValue 32)
       && button_label (control ())=Some (I18n.t "property/expand-bottom-pills"));
    let ids = List.filter_map (fun n -> M.string_prop n "accessibility-identifier") (nodes session) in
    check "Adaptive pill candidates have distinct property and value-picker targets"
      (List.length ids=List.length (List.sort_uniq String.compare ids));
    check "Long bottom node values truncate inside their own content instead of covering the key"
      (List.exists (fun n -> M.string_prop n "text-overflow"=Some "ellipsis"
        && M.string_prop n "white-space"=Some "nowrap") (nodes session)
       && check_prop (find "bottom-property-content") "overflow" (P.StringValue "hidden"));
    S.press session (control ()).M.id;
    check "Expand reveals all pills with auto height and a translated Collapse control"
      (button_label (control ())=Some (I18n.t "property/collapse-bottom-pills")
       && not (List.exists (fun n -> n.M.kind="view-that-fits") (nodes session))
       && List.length (List.filter (fun n -> class_has n "bottom-property-pill") (nodes session))=2
       && List.for_all (fun n -> not (class_has n "bottom-property-pill")
          || (not (Hashtbl.mem n.M.props "height") && check_prop n "corner-radius" (P.IntValue 8))) (nodes session));
    check "Expanded pill keys and numeric values keep the compact 20px line box"
      (List.for_all (fun n -> not (class_has n "property-k" || class_has n "pv-scalar")
        || check_prop n "height" (P.IntValue 20)) (nodes session));
    check "Bottom pill text keeps Master's regular weight and no trailing empty-picker gap"
      (List.for_all (fun n -> not (class_has n "property-k" || class_has n "pv-scalar")
        || check_prop n "font-weight" (P.IntValue 400)) (nodes session)
       && not (List.exists (fun n -> n.M.kind="button"
         && M.string_prop n "accessibility-label"=Some (I18n.t "property/select-property-placeholder")) (nodes session)));
    let numeric_refresh = List.map (fun row ->
      if Properties_data.row_type row = "number"
      then Properties_data.row_with_value row (Wire.Int 88) else row)
      (bottom_pills_rows ()) in
    Runtime.signal_set rows {Properties_state.empty_area_data with below=numeric_refresh};
    Render_inline.invalidate_pull_caches ();
    Editor_state.bump_invalidation ();
    S.flush session;
    check "Numeric value refresh and block-content remount retain expanded bottom pills"
      (button_label (control ())=Some (I18n.t "property/collapse-bottom-pills")
       && check_prop (find "bottom-properties-row") "max-height" (P.IntValue 384)
       && List.exists (fun n -> button_label n=Some "88") (nodes session));
    let updated = List.map (fun row -> Properties_data.row_with_value row Wire.Nil) (bottom_pills_rows ()) in
    Runtime.signal_set rows {Properties_state.empty_area_data with below=updated}; S.flush session;
    check "Property refresh preserves expansion and handles missing values"
      (button_label (control ())=Some (I18n.t "property/collapse-bottom-pills"));
    S.press session (control ()).M.id;
    check "Collapse restores the single-line layout after a property refresh"
      (check_prop (find "bottom-properties-row") "max-height" (P.IntValue 32)
       && button_label (control ())=Some (I18n.t "property/expand-bottom-pills"));
    Runtime.signal_set rows Properties_state.empty_area_data; S.flush session;
    check "Empty bottom properties mount no fit probes or expansion controls"
      (not (List.exists (fun n -> class_has n "bottom-properties-row" || n.M.kind="view-that-fits") (nodes session))))

let bottom_pills_commit ~profile ~finish =
  let previous_flush = !Runtime.app_flush and previous_worker = !Runtime.worker
  and previous_model = !Runtime.read_model and previous_send = !Runtime.app_send
  and previous_editor = !Editor_state.st and previous_fields = !Editor_state.field_sigs_opt
  and previous_settings = !Settings_state.st and previous_overlays = !Properties_state.view_overlays_state
  and previous_close = !Properties_value.close_editor and previous_active = !Properties_value.active_editor
  and previous_refresh = Runtime.hooks.refresh_after_ops in
  Editor_state.st:=None; Editor_state.field_sigs_opt:=None; Settings_state.st:=None;
  Properties_state.view_overlays_state:=None; Properties_value.close_editor:=(fun () -> ());
  Properties_value.active_editor:=None;
  Runtime.read_model:=(fun () -> {Model.initial with repo=Some "bottom-commit-fixture"});
  Runtime.hooks.refresh_after_ops<-(fun () -> Ui_task.resolve ());
  let source = ref (bottom_pills_rows ()) and operations = ref [] and navigated = ref false in
  ignore (Fake_worker.install (fun name args ->
    if name="thread-api/apply-outliner-ops" then begin
      let ops=Wire.elems (List.nth args 1) in
      operations:= !operations @ ops;
      List.iter (function
        | Wire.Array [Wire.Keyword "set-block-property";Wire.Array [_;_;value]] ->
            source:=List.map (fun row -> if Properties_data.row_type row="number"
              then Properties_data.row_with_value row value else row) !source
        | Wire.Array [Wire.Keyword "remove-block-property";_] ->
            source:=List.map (fun row -> if Properties_data.row_type row="number"
              then Properties_data.row_with_value row Wire.Nil else row) !source
        | _ -> ()) ops;
      Render_inline.invalidate_pull_caches (); Editor_state.bump_invalidation ();
      Wire.Map [Wire.kw "result",Wire.Nil]
    end else Wire.Nil));
  Runtime.app_send:=(fun action -> (match action with Action.Navigate_to _ -> navigated:=true | _ -> ());true);
  let session,_ = bottom_pills_fixture ~source ~overlays:true profile !source in
  Runtime.app_flush:=(fun () -> S.flush session);
  let find cls = List.find (fun n -> class_has n cls) (nodes session) in
  let expanded () = button_label (find "bottom-property-expand-btn")=Some (I18n.t "property/collapse-bottom-pills") in
  let numeric () = find "pv-scalar" in
  let field () = List.find (fun n -> n.M.kind="text-field") (nodes session) in
  check "Collapsed Node values use typed single-line ellipsis truncation"
    (List.exists (fun n -> Hashtbl.find_opt n.M.props "line-clamp"=Some (P.IntValue 1)
      && M.string_prop n "text-overflow"=Some "ellipsis") (nodes session));
  let commit value = S.press session (numeric ()).M.id;
    S.text_changed session (field ()).M.id value; S.submit session (field ()).M.id in
  let done_ () =
    Properties_state.close_all_view_overlays (); ignore (Lui_app.dispose session.S.app);
    Hashtbl.remove Properties_state.areas (Properties_area.block_key "00000000-0000-4000-8000-000000000030");
    Runtime.app_flush:=previous_flush;Runtime.worker:=previous_worker;Runtime.read_model:=previous_model;
    Runtime.app_send:=previous_send;Editor_state.st:=previous_editor;Editor_state.field_sigs_opt:=previous_fields;
    Settings_state.st:=previous_settings;Properties_state.view_overlays_state:=previous_overlays;
    Properties_value.close_editor:=previous_close;Properties_value.active_editor:=previous_active;
    Runtime.hooks.refresh_after_ops<-previous_refresh;finish () in
  S.press session (find "bottom-property-expand-btn").M.id;
  commit "89";
  ignore (Js.Global.setTimeout ~f:(fun () ->
    S.flush session;
    check "Numeric Submit dispatches and refreshes the saved value without Escape or collapse"
      (expanded () && button_label (numeric ())=Some "89"
       && match !operations with
       | [Wire.Array [Wire.Keyword "set-block-property";Wire.Array [_;_;Wire.Float value]]] -> value=89.
       | _ -> false);
    commit "not-a-number";
    check "Rejected numeric text preserves expansion and performs no write" (expanded () && List.length !operations=1);
    commit "";
    ignore (Js.Global.setTimeout ~f:(fun () ->
      S.flush session;
      check "Empty numeric Submit removes the value without collapsing"
        (expanded () && button_label (numeric ())=Some (I18n.t "ui/empty") && List.length !operations=2);
      let chip = List.find (fun n -> class_has n "bottom-property-node-value") (nodes session) in
      let target = Stub_dom.make_element (if chip.M.kind="link" then "a" else "button") in
      let set_attr : string -> string -> unit = Stub_dom.get_field target "setAttribute" in
      set_attr "class" (Option.value (M.string_prop chip "style-class") ~default:"");
      let text_target=Stub_dom.make_element "span" in
      let append : Js.Json.t -> unit = Stub_dom.get_field target "appendChild" in
      append text_target;
      let click=Ui_dom_web.ev_of (Stub_dom.make_event ~target:text_target "click") in
      check "Bottom Node's rendered text child cannot hit the delegated reference-navigation selector"
        (chip.M.kind="button" && M.string_prop chip "accessibility-label"<>None
         && Sidebar_state.click_target "a.page-ref, a.tag" click=None);
      check "Expand matches Master's medium text and four-pixel icon gap"
        (Hashtbl.find_opt (find "bottom-property-expand-btn").M.props "font-weight"=Some (P.IntValue 500)
         && Hashtbl.find_opt (find "bottom-property-expand-btn").M.props "gap"=Some (P.IntValue 4));
      let anchor = List.find (fun n -> Option.fold ~none:false ~some:(fun id -> Str_util.contains id "property-node-")
        (M.string_prop n "accessibility-identifier")) (nodes session) in
      let id=Option.get (M.string_prop anchor "accessibility-identifier") in
      let document= !(Stub_dom.document_ref) in
      let lookup : string -> Js.Json.t = Stub_dom.get_field document "getElementById" in
      let element=Stub_dom.make_element "div" in
      let set : string -> string -> unit = Stub_dom.get_field element "setAttribute" in
      set "id" id;
      Stub_dom.set_field document "getElementById" (fun key -> if key=id then element else lookup key);
      S.press session chip.M.id;
      Stub_dom.set_field document "getElementById" lookup;
      ignore (Js.Global.setTimeout ~f:(fun () ->
        S.flush session;
        check "Bottom Node text opens its Set value picker instead of navigating"
          (not !navigated && Properties_state.view_overlay_open ()
           && List.exists (fun n -> M.string_prop n "placeholder"=Some (I18n.t1 "property/set-placeholder" "Bottom Node")) (nodes session));
        done_ ()) 0)) 0)) 0)

let run_views ~registry ~profile ~finish =
  let finish () = bottom_pills_commit ~profile ~finish in
  bottom_pills ~profile;
  preview_block_spacing ~registry ~profile;
  page_disclosure ~registry ~profile;
  reference_disclosure ~registry ~profile;
  preview_reference_disclosure ~registry ~profile;
  show_brackets_rendering ~registry ~profile;
  let finish () = sidebar_history ~registry ~profile ~finish:(fun () ->
    keymap_recording_workflow ~registry ~profile
      ~finish:(fun () -> configured_continuations finish)) in
  configured_popup_ownership ();
  table_resize_transaction ();
  table_range_selection ();
  grouped_table_selection ~registry ~profile;
  settings_config ~registry ~profile ~finish:(fun () ->
  settings_date_format ~registry ~profile ~finish:(fun () ->
  flashcards_config ~registry ~profile;
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
  let () =
    let token = Ui_services.storage_get "id-token"
    and server = Ui_services.storage_get "sync-server-url" in
    Ui_services.storage_remove "id-token";
    let set key = function Some value -> Ui_services.storage_set key value | None -> Ui_services.storage_remove key in
    let check_sync server =
      set "sync-server-url" server;
      let expected = Ui_services.env_rtc_test_mode () || Rtc_flows.rtc_group () in
      let graph = mount New_graph.body in
      check "Signed-out Create graph follows Master's RTC group eligibility"
        (List.exists (fun n -> M.string_prop n "accessibility-identifier" = Some "rtc-sync")
          (nodes graph) = expected);
      if expected then begin
        let sync = List.find (fun n -> M.string_prop n "accessibility-identifier" = Some "rtc-sync")
          (nodes graph) in
        S.dispatch graph (P.ToggleChanged (sync.M.id,true));
        check "Signed-out eligible Create graph retains the Sync encryption option"
          (List.exists (fun n -> M.string_prop n "accessibility-identifier" = Some "rtc-graph-e2ee")
            (nodes graph))
      end;
      ignore (Lui_app.dispose graph.S.app)
    in
    Fun.protect ~finally:(fun () -> set "id-token" token;set "sync-server-url" server) (fun () ->
      check_sync (Some "https://sync.example.test");
      check_sync None)
  in
  let () =
    let warning : Model.toast =
      {toast_id=810;toast_text="Reserved characters:\n/ (forward slash)";
       toast_kind="warning";toast_key=Some Toast.reserved_graph_name_key;
       toast_code=None;toast_duration=Some 0} in
    let toast = mount (fun _ -> Toasts_view.toast_item warning) in
    let description = List.find (fun n -> n.M.kind="column"
      && Hashtbl.find_opt n.M.props "margin-top"=Some (P.IntValue 8)) (nodes toast) in
    check "Reserved graph warning keeps Master's paragraph margins and available description width"
      (Hashtbl.find_opt description.M.props "margin-bottom" = Some (P.IntValue 4)
       && Hashtbl.find_opt description.M.props "gap" = Some (P.IntValue 8)
       && not (List.exists (fun n -> Hashtbl.find_opt n.M.props "padding-right" = Some (P.IntValue 24)) (nodes toast)));
    ignore (Lui_app.dispose toast.S.app)
  in
  let () =
    let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model in
    let writes = ref [] in
    Runtime.read_model := (fun () -> {Model.initial with repo=Some "query-page-grouping-fixture"});
    ignore (Fake_worker.install (fun name args ->
      if name="thread-api/apply-outliner-ops" then
        writes := Option.value (List.nth_opt args 1) ~default:Wire.Nil :: !writes;
      Wire.Nil));
    Fun.protect ~finally:(fun () -> Runtime.worker:=previous_worker;Runtime.read_model:=previous_model) (fun () ->
      let uuid = "00000000-0000-0000-0000-000000000081" in
      let test kind display group data should_group =
        writes:=[];
        let inst = Views_state.make ~sched:(Signal.scheduler ()) ~kind ~feature:"query-result" ~owner:(Wire.Uuid uuid) in
        Views_state.set inst {(Views_state.empty_vstate ()) with
          view_uuid=uuid; display_type=display; group_by=group; data};
        Views_state.persist_display_type inst;
        let group_op = Outliner_ops.op "set-block-property"
          [Wire.Uuid uuid;Wire.Keyword "logseq.property.view/group-by-property";Wire.Keyword "block/page"] in
        let grouped = List.exists (function Wire.Array ops -> List.mem group_op ops | _ -> false) !writes in
        check "Query List selection atomically persists page grouping without overriding explicit groups"
          (grouped=should_group && List.length !writes=1);
        check "Query page grouping remains available when returning to Table or Gallery"
          ((Views_state.get inst).group_by = (if should_group then Some "block/page" else group))
      in
      test (Views_state.KQuery {block_uuid=uuid}) "list" None (Views_wire.VFlat {rows=["a";"b";"c"];count=3;previews=Hashtbl.create 0;qprops=[]}) true;
      test (Views_state.KQuery {block_uuid=uuid}) "list" None Views_wire.VEmpty true;
      test (Views_state.KQuery {block_uuid=uuid}) "list" (Some "fixture/custom-group") Views_wire.VEmpty false;
      test (Views_state.KQuery {block_uuid=uuid}) "table" None Views_wire.VEmpty false;
      test Views_state.KAllPages "list" None Views_wire.VEmpty false)
  in
  let login = mount Login_view.body in
  let login_links () = List.filter (fun node -> class_has node "ls-auth-link") (nodes login) in
  check "Login links use the same accent-first color as Master anchors"
    (List.length (login_links ()) = 2 && List.for_all (fun node ->
       M.string_prop node "foreground" = Some "var(--lx-accent-11, var(--ls-link-text-color))")
       (login_links ()));
  let footer = List.find (fun node -> class_has node "ls-auth-foot") (nodes login) in
  check "Login footer retains the paragraph margins and padding"
    (Hashtbl.find_opt footer.M.props "margin-vertical" = Some (P.IntValue 8)
     && Hashtbl.find_opt footer.M.props "padding-top" = Some (P.IntValue 16));
  let _, login_width, _ = Dialogs_view.dialog_spec "login" in
  check "Login width includes padding and both border pixels at desktop and mobile sizes"
    (login_width 1600. = 490. && login_width 400. = 330.);
  let signup = List.find (fun node -> button_label node = Some (I18n.t "account/sign-up"))
    (login_links ()) in
  S.press login signup.M.id;
  check "The Login signup link still switches panels"
    (List.exists (fun node -> M.string_prop node "accessibility-identifier" = Some "auth-username")
       (nodes login));
  ignore (Lui_app.dispose login.S.app);
  let contribution = mount (fun _ -> Plugins_view.contribution) in
  check "Marketplace contribution props are accepted by their component kinds"
    (List.for_all (fun node ->
       let props = List.fold_left (fun props property ->
         match Hashtbl.find_opt node.M.props (Lui_wire_schema.property_name property) with
         | Some value -> P.Property_map.add property value props
         | None -> props) P.Property_map.empty Lui_wire_schema.all_properties in
       let kind = Lui_wire.kind_of_name node.M.kind in
       P.node_properties_supported kind props
       && P.Property_map.for_all (fun property value ->
         P.property_supported kind property
         && P.property_value_supported_for_kind kind property value) props)
       (nodes contribution));
  ignore (Lui_app.dispose contribution.S.app);
  let counts = ["Page",2; "tags",2; "Ref A",1; "Ref B",1; "Zebra",1; "Alpha",1] in
  check "Reference filter preserves the worker frequency order including tied pages"
    (Views_head.reference_filter_options ~query:"" ~selected:[] counts = counts);
  check "Selected reference chips do not reorder the remaining pages"
    (Views_head.reference_filter_options ~query:"" ~selected:["zebra"] counts
      = List.filter (fun (title, _) -> title <> "Zebra") counts);
  check "Reference search retains descending frequencies"
    (Views_head.reference_filter_options ~query:"a" ~selected:[] counts
      = List.stable_sort (fun (_, a) (_, b) -> compare b a)
        (Fuzzy.fuzzy_search ~extract:fst ~limit:100 counts "a"));
  check "Empty reference filters have no options"
    (Views_head.reference_filter_options ~query:"" ~selected:[] [] = []);
  let many = List.init 110 (fun i -> Printf.sprintf "Page %03d" i, 1) in
  let first = fst (List.hd (Fuzzy.fuzzy_search ~extract:fst ~limit:100 many "Page")) in
  check "Reference search limits before removing selected chips like Master"
    (List.length (Views_head.reference_filter_options ~query:"Page"
      ~selected:[String.lowercase_ascii first] many) = 99);
  check "Malformed reference counts are rejected"
    (try ignore (Views_wire.decode_ref_counts_resource
      (Wire.Map [Wire.kw "ref-pages-count", Wire.Array [Wire.Array [Wire.String "Page"; Wire.Int (-1)]]]));
      false with Invalid_argument _ -> true);
  let description = "Anki Sync keeps your Logseq flashcards synchronized with Anki across all of your decks and notes." in
  let card = mount (fun _ -> fun context parent ->
    let search = Signal.state context.Lui_ui.ui_scheduler "" in
    Plugins_view.market_card ~stats:Js.Json.null ~search_st:search
      (Js.Json.object_ (Js.Dict.fromList
        ["id", Js.Json.string "anki"; "repo", Js.Json.string "owner/anki";
         "title", Js.Json.string "Anki Sync"; "description", Js.Json.string description]))
      context parent) in
  let paragraph = List.find (fun node -> M.string_prop node "text" = Some description) (nodes card) in
  check "Marketplace descriptions clamp an unpadded paragraph inside the card's spacing box"
    (Hashtbl.find_opt paragraph.M.props "line-clamp" = Some (P.IntValue 2)
      && not (Hashtbl.mem paragraph.M.props "height")
      && not (Hashtbl.mem paragraph.M.props "padding-vertical")
      && M.string_prop paragraph "text-overflow" = Some "ellipsis");
  check "Marketplace repository links use Master's filled GitHub mark"
    (List.exists (fun node -> M.string_prop node "icon" = Some "app:github-mark") (nodes card)
     && String.starts_with ~prefix:"<svg" (List.assoc "github-mark" Icons.custom_icons));
  ignore (Lui_app.dispose card.S.app);
  let token = Ui_services.storage_get "id-token"
  and server = Ui_services.storage_get "sync-server-url"
  and remotes = !Graphs_ops.remote_graphs
  and rtc_uuid = !Rtc_flows.db_rtc_uuid
  and rtc_repo = !Rtc_flows.db_rtc_repo
  and settings = !Settings_state.st in
  Fun.protect ~finally:(fun () ->
    restore_storage "id-token" token; restore_storage "sync-server-url" server;
    Graphs_ops.remote_graphs := remotes; Rtc_flows.db_rtc_uuid := rtc_uuid;
    Rtc_flows.db_rtc_repo := rtc_repo;
    Settings_state.st := settings) (fun () ->
    let model = {Model.initial with repo = Some (Graph.full_graph_name "Recent")} in
    Ui_services.storage_remove "id-token";
    Ui_services.storage_set "sync-server-url" "https://sync.invalid";
    Graphs_ops.remote_graphs := ["Recent", "remote-uuid", false, "manager"];
    Rtc_flows.db_rtc_uuid := Some "remote-uuid";
    check "Signed-out recent highlights do not mount their controls"
      (not (Chrome.recent_controls_visible model));
    Settings_state.st := None;
    let recent = mount (fun _ -> fun context parent ->
      Settings_state.ensure context;
      Settings_state.toggle_recent ();
      let source = Signal.state context.Lui_ui.ui_scheduler model in
      Chrome.recent_slider (Signal.value source) context parent) in
    check "Plain local-page shortcut mode has no Quit highlight button or slider"
      (not (List.exists (fun node -> node.M.kind = "slider"
        || button_label node = Some (I18n.t "header/quit-highlight-recent-blocks")) (nodes recent))
       && Settings_state.Recent_blocks.is_empty (Settings_state.value ()).recent_blocks);
    ignore (Lui_app.dispose recent.S.app);
    Ui_services.storage_set "id-token" "test-token";
    check "Eligible remote graphs can show recent controls"
      (Chrome.recent_controls_visible model);
    Rtc_flows.db_rtc_repo := model.repo;
    Settings_state.st := None;
    let remote = mount (fun _ -> fun context parent ->
      Settings_state.ensure context;
      Settings_state.toggle_recent ();
      let source = Signal.state context.Lui_ui.ui_scheduler model in
      Chrome.recent_slider (Signal.value source) context parent) in
    check "Eligible remote highlight mode mounts its slider"
      (List.exists (fun node -> node.M.kind = "slider") (nodes remote));
    let quit = List.find (fun node -> button_label node =
      Some (I18n.t "header/quit-highlight-recent-blocks")) (nodes remote) in
    S.press remote quit.M.id;
    check "Quit highlight unmounts the controls and clears recent rows"
      (not (List.exists (fun node -> node.M.kind = "slider") (nodes remote))
       && not (Settings_state.value ()).highlight_recent
       && Settings_state.Recent_blocks.is_empty (Settings_state.value ()).recent_blocks);
    ignore (Lui_app.dispose remote.S.app);
    check "No open graph has no recent controls"
      (not (Chrome.recent_controls_visible Model.initial));
    Rtc_flows.db_rtc_uuid := None;
    let rtc = Decode.rtc_of_wire (Wire.Map []) in
    check "An RTC state without a graph UUID cannot show recent controls"
      (not (Chrome.recent_controls_visible {model with rtc = Some rtc}));
    check "Another remote graph's RTC state cannot show recent controls"
      (not (Chrome.recent_controls_visible
        {model with rtc = Some {rtc with rtc_graph_uuid = Some "another-uuid"}}));
    check "Matching RTC state enables controls before the DB UUID resolves"
      (Chrome.recent_controls_visible
        {model with rtc = Some {rtc with rtc_graph_uuid = Some "remote-uuid"}});
    Graphs_ops.remote_graphs := [];
    check "Signed-in local graphs still do not show recent controls"
      (not (Chrome.recent_controls_visible model)));
  let market_state = ref None in
  let marketplace = mount (fun _ -> fun ctx parent ->
    let filter = Signal.state ctx.Lui_ui.ui_scheduler Plugins_view.All
    and search = Signal.state ctx.ui_scheduler "" in
    market_state := Some (filter, search);
    (Lui_elements.column
      [Plugins_view.search_input ~key:"market-search" search;
       Plugins_view.options_menu ~key:"market-filter" ~icon:"filter"
         ~label:(I18n.t "cmdk.action/filter") ~state:filter
         [Plugins_view.All, I18n.t "plugin/all";
          Plugins_view.Installed, I18n.t "plugin/installed"]]) ctx parent) in
  let market_option label =
    let trigger = List.find (fun node -> button_label node = Some (I18n.t "cmdk.action/filter"))
      (nodes marketplace) in
    S.press marketplace trigger.M.id;
    let option = List.find (fun node -> M.string_prop node "text" = Some label)
      (nodes marketplace) in
    S.press marketplace option.M.id in
  let applied_market_option () = List.exists (fun node ->
    match M.string_prop node "data-attrs" with
    | Some value -> I18n.contains_ci value "data-plugin-option-active"
    | None -> false) (nodes marketplace) in
  check "The default marketplace filter has no applied marker" (not (applied_market_option ()));
  market_option (I18n.t "plugin/installed");
  check "Choosing the installed marketplace filter applies its state and marker"
    (Runtime.signal_get (fst (Option.get !market_state)) = Plugins_view.Installed
     && applied_market_option ());
  market_option (I18n.t "plugin/all");
  check "Clearing the marketplace filter clears its state and applied marker"
    (Runtime.signal_get (fst (Option.get !market_state)) = Plugins_view.All
     && not (applied_market_option ()));
  let market_input = List.find (fun node -> node.M.kind = "search-field") (nodes marketplace) in
  S.text_changed marketplace market_input.M.id "No marketplace match";
  check "Marketplace search remains editable while filtering"
    (Runtime.signal_get (snd (Option.get !market_state)) = "No marketplace match");
  S.text_changed marketplace market_input.M.id "";
  check "Marketplace search accepts an empty query"
    (Runtime.signal_get (snd (Option.get !market_state)) = "");
  ignore (Lui_app.dispose marketplace.S.app);
  List.iter (fun (source, expected) ->
    check "Markdown thematic breaks accept repeated markers but not empty or malformed text"
      (Render.horizontal_rule source = expected))
    ["---",true;"* * *",true;"___",true;"",false;"--",false;"--x",false];
  let inline_image = mount (fun _ -> Lui_elements.column
    (Render_inline.parse "![Fixture](https://example.invalid/fixture.png)after-image-fixture")) in
  check "A Markdown image commits its render transaction and preserves following content"
    (List.exists (fun node -> M.string_prop node "text"=Some "after-image-fixture")
      (nodes inline_image));
  ignore (Lui_app.dispose inline_image.S.app);
  let install_file_host : (string -> unit Js.Promise.t) -> (unit -> unit) =
    [%mel.raw {|function (openPath) {
      const previous = window.apis;
      window.apis = {openPath, doAction: () => Promise.resolve(null)};
      return () => { if (previous === undefined) delete window.apis; else window.apis = previous; };
    }|}] in
  let opened = ref [] in
  let restore_host = install_file_host (fun url -> opened := url :: !opened; Js.Promise.resolve ()) in
  let file_pdf = "FILE:///Workspace/sample%2520%23name.pdf?download=1#page=2" in
  let expected_pdf = "assets://localhost/logseq__file/file%3A%2F%2F%2FWorkspace%2Fsample%252520%2523name.pdf?download=1#page=2" in
  List.iter (fun (source,expected) ->
    check "Local file previews preserve URL encoding, drives, hosts and document suffixes"
      (Platform.file_url_to_assets_url source=expected))
    [file_pdf,Some expected_pdf;
     "file://C:/docs/sample.pdf",Some "assets://localhost/logseq__file/file%3A%2F%2F%2FC%3A%2Fdocs%2Fsample.pdf";
     "file://server/share/sample.pdf",Some "assets://localhost/logseq__file/file%3A%2F%2Fserver%2Fshare%2Fsample.pdf";
     "",None;"https://example.com/sample.pdf",None;"file://[",None];
  let local_image = mount (fun _ -> Lui_elements.column
    (Render_inline.parse "![Local](file:///tmp/image%2520.png)")) in
  check "Markdown file images load through Electron's local-file asset protocol"
    (List.exists (fun node -> match M.string_prop node "attrs" with
      | Some attrs -> let obj=Js.Json.decodeObject (Js.Json.parseExn attrs) in
          Option.bind obj (fun o -> Option.bind (Js.Dict.get o "src") Js.Json.decodeString)
            =Some "assets://localhost/logseq__file/file%3A%2F%2F%2Ftmp%2Fimage%252520.png"
      | None -> false) (nodes local_image));
  ignore (Lui_app.dispose local_image.S.app);
  let local_link = mount (fun _ -> Lui_elements.column
    (Render_inline.parse ("[Local PDF](" ^ file_pdf ^ ")"))) in
  let local_anchor = List.find (fun n -> n.M.kind="link"
    && M.string_prop n "url"=Some file_pdf) (nodes local_link) in
  S.press local_link local_anchor.M.id;
  check "File links retain their file icon and dispatch the original URL to the host opener"
    (!opened=[file_pdf] && M.string_prop local_anchor "icon"=Some "app:file");
  ignore (Lui_app.dispose local_link.S.app);
  let pdf = Pdf_assets.inflate_asset ~original_path:file_pdf ~href:file_pdf
    ~block_uuid:None ~block_db_id:None ~block_external_url:None in
  check "Local PDF inflation uses the preview URL without changing its original identity"
    (Option.map (fun asset -> asset.Model.pdf_url,asset.pdf_original_path) pdf
      =Some (expected_pdf,file_pdf));
  let pdf_link = mount (fun _ -> Lui_elements.column
    (Render_inline.parse ("![Local PDF](" ^ file_pdf ^ ")"))) in
  check "PDF URLs with query and fragment still render the PDF opener"
    (List.exists (fun n -> class_has n "is-pdf") (nodes pdf_link));
  ignore (Lui_app.dispose pdf_link.S.app);
  restore_host ();
  check "Browser previews retain file URLs instead of using an Electron-only scheme"
    (Platform.media_url file_pdf=file_pdf);
  let install_browser_host : bool -> (string -> unit) -> (unit -> unit) =
    [%mel.raw {|function (shim, open) {
      const previousApis = window.apis, previousOpen = window.open;
      if (shim) window.apis = {on() {}, emit() {}}; else delete window.apis;
      window.open = open;
      return () => {
        if (previousApis === undefined) delete window.apis; else window.apis = previousApis;
        window.open = previousOpen;
      };
    }|}] in
  List.iter (fun shim ->
    let browser_opened = ref [] in
    let restore_browser = install_browser_host shim (fun url -> browser_opened:=url::!browser_opened) in
    let browser_link = mount (fun _ -> Lui_elements.column
      (Render_inline.parse ("[Local](" ^ file_pdf ^ ")"))) in
    let anchor = List.find (fun n -> n.M.kind="link"
      && M.string_prop n "url"=Some file_pdf) (nodes browser_link) in
    check "Browser file links keep native navigation without an application press handler"
      (!browser_opened=[] && M.string_prop anchor "target"=Some "_blank"
       && Hashtbl.find_opt anchor.M.props "press-enabled"<>Some (P.BoolValue true)
       && M.string_prop anchor "icon"=Some "app:file");
    Platform.open_url file_pdf;
    Platform.open_url "";
    check "Browser open_url never calls Electron APIs, with or without the plugin shim"
      (!browser_opened=["";file_pdf] && Platform.media_url file_pdf=file_pdf);
    ignore (Lui_app.dispose browser_link.S.app);
    restore_browser ()) [false;true];
  List.iter (fun code ->
    let results = mount (fun _ -> Option.get (Render.calc_results_el code)) in
    let lines = List.filter (fun node ->
      class_has node "extensions__code-calc-output-line") (nodes results) in
    check "Calculator results retain one single-height line per expression"
      (List.map (fun node -> M.string_prop node "text") lines
       = List.map Option.some (Render_calc.results code)
       && List.for_all (fun node ->
         M.string_prop node "white-space" = Some "nowrap"
         && M.string_prop node "line-height" = Some "1.45rem"
         && Hashtbl.find_opt node.M.props "min-height" = Some (P.IntValue 23)) lines);
    ignore (Lui_app.dispose results.S.app))
    ["1+1"; "2^256"; ""; "bad(" ];
  let footnote_document : Js.Json.t = Stub_dom.get_field Stub_dom.global "document" in
  let previous_query : string -> Js.Json.t = Stub_dom.get_field footnote_document "querySelector" in
  let jumped = ref [] in
  let target name =
    let el = Stub_dom.make_element "a" in
    Stub_dom.set_field el "scrollIntoView" (fun () -> jumped := name :: !jumped);
    el in
  let note_target = target "definition" and reference_target = target "reference" in
  Stub_dom.set_field footnote_document "querySelector" (fun selector ->
    if selector = "[id=\"fn.1\"]" then note_target
    else if selector = "[id=\"fnr.1\"]" then reference_target
    else if selector = "[id=\"fn.missing\"]" then Js.Json.null
    else previous_query selector);
  Fun.protect ~finally:(fun () -> Stub_dom.set_field footnote_document "querySelector" previous_query)
    (fun () ->
      let notes = mount (fun _ -> Lui_elements.column
        (Render.title "Footnote[^1]\n\n[^1]: footnote text")) in
      let anchor id = List.find (fun node ->
        M.string_prop node "accessibility-identifier" = Some id) (nodes notes) in
      check "Footnote definitions render their body instead of raw Markdown syntax"
        (List.exists (fun node -> M.string_prop node "text" = Some "footnote text") (nodes notes));
      check "Footnote backlinks preserve the Unicode return marker"
        (List.exists (fun node -> M.string_prop node "text" = Some {js|1↩︎|js}) (nodes notes));
      S.press notes (anchor "fnr.1").M.id;
      S.press notes (anchor "fn.1").M.id;
      check "Footnote links navigate to the definition and back to their reference"
        (!jumped = ["reference"; "definition"]);
      ignore (Lui_app.dispose notes.S.app);
      List.iter (fun source ->
        let session = mount (fun _ -> Lui_elements.column (Render.title source)) in
        check "Empty and malformed footnotes do not create navigation targets"
          (not (List.exists (fun node ->
            Option.fold ~none:false ~some:(fun id -> Str_util.starts_with id "fn.")
              (M.string_prop node "accessibility-identifier")) (nodes session)));
        ignore (Lui_app.dispose session.S.app)) [""; "Footnote[^]\n\n[^]: invalid"];
      let missing = mount (fun _ -> Lui_elements.column (Render.title "Unresolved[^missing]")) in
      let link = List.find (fun node ->
        M.string_prop node "accessibility-identifier" = Some "fnr.missing") (nodes missing) in
      S.press missing link.M.id;
      check "An unresolved footnote leaves navigation unchanged" (!jumped = ["reference"; "definition"]);
      ignore (Lui_app.dispose missing.S.app));
  let startup_error=I18n.t "graph/load-error" in
  let failed_startup=mount (fun _ context parent ->
    Page.region (Signal.constant context.Lui_ui.ui_scheduler
      {Model.initial with phase=Model.Failed startup_error}) context parent) in
  check "A failed graph startup renders its message instead of a loading placeholder"
    (List.exists (fun n -> M.string_prop n "text"=Some startup_error) (nodes failed_startup)
     && not (List.exists (fun n -> M.string_prop n "text"=Some (I18n.t "ui/loading")) (nodes failed_startup)));
  ignore (Lui_app.dispose failed_startup.S.app);
  let neutral_controls = mount (fun _ context parent ->
    let sched = context.Lui_ui.ui_scheduler in
    let keymap = Signal.state sched
      {Settings_page.km_query="";km_filter=Keymap_data.All;km_collapsed=[];
       km_keys=[];km_recording=false;km_committed=false;km_revision=0} in
    let created = Views_state.make ~sched ~kind:Views_state.KAllPages
      ~feature:"neutral-button-parity" ~owner:Wire.Nil in
    let selected = { (Views_state.empty_vstate ()) with
      Views_state.selected=Views_state.Sset.singleton "neutral-row";
      data=Views_wire.VFlat { rows=["neutral-row"]; count=1;
        previews=Hashtbl.create 0; qprops=[] } } in
    let table = {created with Views_state.st=Signal.state sched selected} in
    Lui_elements.column
      [Right_sidebar_view.topbar_btn "contents" (I18n.t "page/contents") (fun () -> ());
       Settings_page.keymap_controls keymap;Views_table.action_bar table] context parent) in
  let neutral_buttons = List.filter (fun n -> n.M.kind="button") (nodes neutral_controls) in
  check "neutral control fixture renders sidebar, keymap and selection actions"
    (List.length neutral_buttons>=9);
  List.iter (fun n ->
    let label = Option.value (M.string_prop n "accessibility-label")
      ~default:(Option.value (M.string_prop n "text") ~default:"button") in
    check (label ^ " declares a neutral semantic button appearance")
      (match M.string_prop n "variant" with
       | Some ("ghost" | "outline" | "secondary") -> true | _ -> false);
    check (label ^ " does not inherit the primary action foreground")
      (M.string_prop n "foreground"<>Some "hsl(var(--primary-foreground))")) neutral_buttons;
  ignore (Lui_app.dispose neutral_controls.S.app);
  let navigate selector input event =
    if Hashtbl.find_opt input.M.props "navigate-enabled"=Some (P.BoolValue true)
    then S.dispatch selector event
  in
  let calendar_structure session expected_label =
    let attrs n=Option.value (M.string_prop n "data-attrs") ~default:""
      |> P.data_attrs_decode in
    let has_role role n=List.assoc_opt "role" (attrs n)=Some role in
    let grids=List.filter (has_role "grid") (nodes session) in
    check "A calendar exposes exactly one named date grid" (List.length grids=1);
    match grids with
    | [grid] ->
        check "Calendar grid names the displayed month and year"
          (List.assoc_opt "aria-label" (attrs grid)=Some expected_label);
        check "Calendar grid declares single-date selection"
          (List.assoc_opt "aria-multiselectable" (attrs grid)=Some "false");
        let rows=M.children session.S.tree grid.M.id in
        let days=List.filter (fun n -> class_has n "ui__calendar-day") (nodes session) in
        check "Calendar groups date buttons into complete semantic weeks"
          (List.length rows=List.length days/7 && List.for_all (has_role "row") rows);
        List.iter (fun week ->
          let cells=M.children session.S.tree week.M.id in
          check "Each calendar week exposes seven date cells"
            (List.length cells=7 && List.for_all (has_role "gridcell") cells);
          List.iter (fun cell ->
            check "Every calendar cell retains one ordinary date button"
              (match M.children session.S.tree cell.M.id with
               | [button] -> button.M.kind="button" && class_has button "ui__calendar-day"
               | _ -> false)) cells) rows
    | _ -> ()
  in
  List.iter (fun (week_starts_on,year,month,first,rows) ->
    let session=mount (fun _ -> Ui_components.calendar ~week_starts_on
      ~month_label:I18n.calendar_month_label ~day_label:I18n.calendar_day_label
      ~initial:(Dates.make ~year ~month ~day:1 ()) ~translate:I18n.t ~on_pick:ignore ()) in
    let grid=List.find (fun n -> List.assoc_opt "role"
      (P.data_attrs_decode (Option.value (M.string_prop n "data-attrs") ~default:""))=Some "grid") (nodes session) in
    let weeks=M.children session.S.tree grid.M.id in
    check "Configured calendars retain the expected week count" (List.length weeks=rows);
    let cell=List.hd (M.children session.S.tree (List.hd weeks).M.id) in
    let day=List.hd (M.children session.S.tree cell.M.id) in
    check "Calendar columns begin with the configured weekday"
      (M.string_prop day "accessibility-identifier"=Some first);
    ignore (Lui_app.dispose session.S.app))
    [0,2024,2,"calendar-day-2024-01-28",5;
     1,2024,2,"calendar-day-2024-01-29",5;
     2,2024,2,"calendar-day-2024-01-30",5;
     3,2024,2,"calendar-day-2024-01-31",5;
     4,2024,2,"calendar-day-2024-02-01",5;
     5,2024,2,"calendar-day-2024-01-26",5;
     6,2024,2,"calendar-day-2024-01-27",5;
     0,2024,3,"calendar-day-2024-02-25",6;
     1,2024,3,"calendar-day-2024-02-26",5;
     1,2021,2,"calendar-day-2021-02-01",4];
  let picked_date = ref None in
  let calendar = mount (fun _ -> Ui_components.date_picker ~week_starts_on:0 ~month_label:I18n.calendar_month_label ~day_label:I18n.calendar_day_label ~translate:I18n.t
      ~on_pick:(fun date -> picked_date:=Some date)) in
  let today = Dates.fields (Dates.date_now ()) in
  let day_name y m d = Printf.sprintf "calendar-day-%04d-%02d-%02d" y m d in
  let find_day session y m d = List.find (fun n -> M.string_prop n "accessibility-identifier"
      =Some (day_name y m d)) (nodes session) in
  let day = find_day calendar today.year today.month today.day in
  check "Calendar today labels include the current-day context"
    (match M.string_prop day "accessibility-label" with
     | Some label -> String.starts_with ~prefix:"Today, " label
     | None -> false);
  let header_names = ["calendar-prev";"calendar-next";"calendar-month";"calendar-year"] in
  let header = List.filter_map (fun n -> match M.string_prop n "accessibility-identifier" with
    | Some name when List.mem name header_names -> Some name | _ -> None) (nodes calendar) in
  check "Calendar header order matches navigation, month and year traversal" (header=header_names);
  check "Standalone calendar initially focuses previous-month navigation"
    (List.exists (fun n -> M.string_prop n "accessibility-identifier"=Some "calendar-prev"
      && Hashtbl.find_opt n.M.props "autofocus"=Some (P.BoolValue true)) (nodes calendar));
  check "Calendar dates must be ordinary activation buttons, not pressed toggles"
    (List.for_all (fun n -> not (Hashtbl.mem n.M.props "selected"))
      (List.filter (fun n -> class_has n "ui__calendar-day") (nodes calendar)));
  check "Standalone calendars expose a single date in the Tab sequence"
    (List.length (List.filter (fun n -> class_has n "ui__calendar-day"
      && M.string_prop n "data-attrs"=Some (P.data_attrs_encode ["tabindex","0"])) (nodes calendar))=1);
  navigate calendar day (P.NavigationKey (day.M.id,"ArrowRight",false));
  let next = Dates.fields (Dates.shift_day (Dates.make ~year:today.year ~month:today.month ~day:today.day ()) 1) in
  let target = find_day calendar next.year next.month next.day in
  if next.year=today.year && next.month=today.month then
    check "Moving calendar focus within the month retains its date buttons"
      (List.exists (fun n -> n.M.id=day.M.id) (nodes calendar));
  check "Calendar keyboard navigation moves the focused day without committing"
    (Hashtbl.find_opt target.M.props "autofocus"=Some (P.BoolValue true) && !picked_date=None);
  S.press calendar target.M.id;
  check "Calendar activation commits the navigated date"
    (Option.map Dates.journal_day_of !picked_date=Some (next.year*10000+next.month*100+next.day));
  ignore (Lui_app.dispose calendar.S.app);
  let labelled_calendar = mount (fun _ -> Ui_components.calendar ~week_starts_on:0 ~month_label:I18n.calendar_month_label ~day_label:I18n.calendar_day_label
      ~initial:(Dates.make ~year:2024 ~month:2 ~day:29 ()) ~translate:I18n.t
      ~on_pick:(fun _ -> ()) ()) in
  calendar_structure labelled_calendar "February 2024";
  List.iter (fun (y,m,d,label) ->
    let button = find_day labelled_calendar y m d in
    check "Calendar date labels distinguish weekdays, months and years"
      (M.string_prop button "accessibility-label"=Some label);
    check "Full calendar labels do not replace visible day numbers"
      (M.string_prop button "text"=Some (string_of_int d)))
    [2024,1,28,"Sunday, January 28th, 2024";
     2024,2,1,"Thursday, February 1st, 2024";
     2024,2,11,"Sunday, February 11th, 2024";
     2024,2,22,"Thursday, February 22nd, 2024";
     2024,2,29,"Thursday, February 29th, 2024";
     2024,3,2,"Saturday, March 2nd, 2024"];
  ignore (Lui_app.dispose labelled_calendar.S.app);
  let old_calendar = !Editor_commands.active and old_calendar_signal = !Editor_commands.popup_vs in
  let previous_calendar_model = !Runtime.read_model in
  Runtime.read_model:=(fun () -> {Model.initial with repo=Some "editor-week-fixture";
    graph_config=Wire.Map [Wire.kw "start-of-week",Wire.Int 0]});
  let popup : Editor_commands.popup =
    {kind=Cal_insert "";configured=None;uuid="calendar-keyboard-owner";from=0;cy=2024;cm=1;cd=31;
     hour=0;tmin=0;x=0.;y=0.;menu=None;rpt=None} in
  Editor_commands.active:=Some popup;Editor_commands.popup_vs:=None;
  Editor_commands.nav_month 1;
  check "Editor month controls clamp the focused day to the target month"
    (match !Editor_commands.active with Some current -> current.cy=2024 && current.cm=2 && current.cd=29 | None -> false);
  Editor_commands.active:=Some popup;
  let editor_calendar = mount (fun _ ->
    Lui_elements.column [Editor_commands.popup_view]) in
  let editor_header = List.filter (fun n -> n.M.kind="button"
    && not (class_has n "ui__calendar-day")) (nodes editor_calendar) in
  check "Editor calendars use the same navigation-first header order"
    (List.map (fun n -> match M.string_prop n "accessibility-label" with
       | Some label -> label | None -> Option.get (M.string_prop n "text")) editor_header
     = [I18n.t "editor.date-picker/previous-month";I18n.t "editor.date-picker/next-month";
        I18n.t "format.month/january"]);
  check "Editor calendar dates also remain ordinary activation buttons"
    (List.for_all (fun n -> not (Hashtbl.mem n.M.props "selected"))
      (List.filter (fun n -> class_has n "ui__calendar-day") (nodes editor_calendar)));
  let prevented = ref false in
  check "Editor calendar navigation is consumed before editor commands"
    (Editor_commands.popup_key ~key:"ArrowRight" ~inside:(fun () -> true)
       ~prevent_default:(fun () -> prevented:=true));
  check "The editor key router leaves calendar navigation to the focused button"
    (!Editor_commands.active=Some popup && not !prevented);
  calendar_structure editor_calendar "January 2024";
  let first_editor_date=List.find (fun n -> class_has n "ui__calendar-day") (nodes editor_calendar) in
  check "Editor calendars inherit the graph's Monday start"
    (M.string_prop first_editor_date "accessibility-identifier"=Some "calendar-day-2024-01-01");
  let day = find_day editor_calendar 2024 1 31 in
  check "Editor calendars share complete date labels"
    (M.string_prop day "accessibility-label"=Some "Wednesday, January 31st, 2024");
  navigate editor_calendar day (P.NavigationKey (day.M.id,"ArrowRight",false));
  calendar_structure editor_calendar "February 2024";
  check "Editor calendar navigation updates the day exactly once"
    (match !Editor_commands.active with Some current -> current.cy=2024 && current.cm=2 && current.cd=1 | None -> false);
  ignore (Lui_app.dispose editor_calendar.S.app);
  Editor_commands.active:=old_calendar;Editor_commands.popup_vs:=old_calendar_signal;
  Runtime.read_model:=previous_calendar_model;
  let popup_anchor () =
    let body = Ui_services.dom_body () in
    {body with Ui_services.attr=(fun name ->
      if name="id" then Some "shared-popup-trigger" else body.attr name)} in
  let popup_layer = Lui_elements.column
    [Lui_elements.button ~accessibility_identifier:"shared-popup-trigger"
       ~text:"Trigger" []; Views_popup.layer] in
  let previous_popup_stack = !Views_popup.stack_st in
  Views_popup.stack_st := None;
  let anchored = mount (fun _ -> Lui_elements.column
    [Lui_elements.button ~accessibility_identifier:"retained-popup-trigger"
       ~text:"Trigger" []; Views_popup.layer]) in
  let body = Ui_services.dom_body () in
  let trigger = {body with Ui_services.attr=(fun name ->
    if name="id" then Some "retained-popup-trigger" else body.attr name)} in
  let assert_anchored label =
    let surface = List.find (fun n -> n.M.kind="popover") (nodes anchored) in
    check (label ^ " uses the retained trigger")
      (M.string_prop surface "anchor-target"=Some "retained-popup-trigger");
    check (label ^ " delegates side and alignment to the host")
      (M.string_prop surface "anchor"=Some "below"
       && M.string_prop surface "anchor-alignment"=Some "end");
    check (label ^ " has no competing point coordinates")
      (not (Hashtbl.mem surface.M.props "x" || Hashtbl.mem surface.M.props "y"));
    Views_popup.close_all () in
  Views_popup.show_menu ~anchor:trigger ~align_end:true
    [Views_popup.MItem ("Item",fun () -> ())];
  assert_anchored "View menu";
  Views_popup.show_select ~anchor:trigger ~align_end:true
    ~items:(Views_popup.fixed_items []) ~placeholder:"Choice"
    ~on_chosen:(fun _ _ _ -> ()) ();
  assert_anchored "View select";
  Views_popup.show_custom ~anchor:trigger ~align_end:true ~cls:"popup-fixture"
    (Lui_elements.text ~value:"Content" []);
  assert_anchored "Custom popup";
  ignore (Lui_app.dispose anchored.S.app);
  Views_popup.stack_st := previous_popup_stack;
  let previous_property = !Properties_dialog.current
  and previous_property_signal = !Properties_dialog.current_sig
  and previous_worker = !Runtime.worker in
  Properties_dialog.current := None;Properties_dialog.current_sig := None;
  Runtime.worker := Some {Worker_client.invoke_fn=(fun _ _ ->
    Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()));
    on_message=(fun _ _ -> ());dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
  let property_ctx : Properties_value.ctx =
    {owner_key="inline-property";block_uuid="inline-property-owner";block_id=Some 123;refresh=(fun () -> ());
     jump_owner=Jump_state.owner ~scope:"main" ~container:"inline-property-owner";
     is_page=true;class_schema=false} in
  let inline_properties = mount (fun _ -> Lui_elements.column
    [Properties_area.new_property_btn property_ctx ~for_class:false ~owner_title:"Owner";
     Properties_area.new_property_btn property_ctx ~for_class:true ~owner_title:"Owner";
     Properties_area.new_property_btn property_ctx ~for_class:false ~owner_title:"Owner"]) in
  let restore_inline () =
    ignore (Lui_app.dispose inline_properties.S.app);
    Properties_dialog.current:=previous_property;
    Properties_dialog.current_sig:=previous_property_signal;
    Runtime.worker:=previous_worker in
  (let buttons = List.filter (fun n -> n.M.kind="button") (nodes inline_properties) in
    let popups () = List.filter (fun n -> n.M.kind="popover") (nodes inline_properties) in
    List.iteri (fun index button ->
      S.press inline_properties button.M.id;
      check "inline Add property uses its known owner without a worker round trip"
        (match !Properties_dialog.current with
         | Some d -> d.Properties_dialog.d_target=
             {uuid="inline-property-owner";uuids=[];db_id=Some 123;is_tag=(index=1);title="Owner"}
         | None -> false);
      check "inline Add property opens exactly one anchored popup" (List.length (popups ())=1);
      check "inline Add property popup belongs to the clicked occurrence"
        (match popups () with [popup] -> popup.M.parent=button.M.parent | _ -> false);
      S.press inline_properties button.M.id;
      check "pressing the same Add property button closes its workflow"
        (not (Properties_dialog.is_open ()) && popups ()=[])) buttons;
    S.press inline_properties (List.nth buttons 0).M.id;
    S.press inline_properties (List.nth buttons 2).M.id;
    check "another occurrence of the same block replaces the popup owner"
      (match popups () with [popup] -> popup.M.parent=(List.nth buttons 2).M.parent | _ -> false);
    (match popups () with [popup] -> S.dismiss inline_properties popup.M.id | _ -> ());
    check "dismissing the inline popup closes its workflow" (not (Properties_dialog.is_open ()));
    S.press inline_properties (List.hd buttons).M.id;
    ignore (Lui_app.dispose inline_properties.S.app);
    check "disposing an inline Add property owner closes its workflow" (not (Properties_dialog.is_open ())));
  restore_inline ();
  let previous_stack = !Views_popup.stack_st in
  Views_popup.stack_st := None;
  let filter_instance = ref None in
  let delayed_filter = mount (fun _ context parent ->
      let inst = Views_state.make ~sched:context.Lui_ui.ui_scheduler
          ~kind:Views_state.KAllPages ~feature:"delayed-filter-columns"
          ~owner:Wire.Nil in
      filter_instance := Some inst;
      popup_layer context parent) in
  let filter_inst = Option.get !filter_instance in
  let options () = List.filter (fun n -> class_has n "ls-view-select-option")
      (nodes delayed_filter) in
  let rec caption node = match M.string_prop node "text" with
    | Some text -> Some text
    | None -> List.find_map caption (M.children delayed_filter.S.tree node.M.id) in
  let option_labels () = List.filter_map caption (options ()) in
  Views_head.filter_popup filter_inst (popup_anchor ());
  let filter_input = List.find (fun n -> n.M.kind="input") (nodes delayed_filter) in
  S.text_changed delayed_filter filter_input.M.id "Later";
  let column id name =
    Views_table.builtin_column id name "string" () in
  let earlier = column "fixture/earlier" "Earlier"
  and later = column "fixture/later" "Later" in
  Views_state.update filter_inst (fun state ->
      {state with columns=[earlier;later]});
  S.flush delayed_filter;
  check "Filter options arrive in the already open popup and retain its query"
    (option_labels ()=["Later"]);
  check "Loading filter columns preserves the mounted input"
    (List.exists (fun n -> n.M.id=filter_input.M.id) (nodes delayed_filter));
  S.text_changed delayed_filter filter_input.M.id "";
  check "Clearing a pending Filter query exposes the current columns"
    (option_labels ()=["Earlier";"Later"]);
  S.dispatch delayed_filter (P.NavigateNext filter_input.M.id);
  let existing : Views_state.filter_clause =
    {c_prop="fixture/existing";c_op="text-contains";c_val=None} in
  Views_state.update filter_inst (fun state ->
      {state with columns=[{later with c_name="Latest"}];
        filters=[existing];filters_or=true});
  S.flush delayed_filter;
  check "An open Filter replaces renamed and removed columns"
    (option_labels ()=["Latest"]);
  check "Filter keeps a visible selected option after its source shrinks"
    (List.exists (fun n -> Hashtbl.find_opt n.M.props "selected"=Some (P.BoolValue true))
       (options ()));
  S.submit delayed_filter filter_input.M.id;
  check "Filter submits the current column without overwriting newer clauses"
    ((Views_state.get filter_inst).filters_or
     && match (Views_state.get filter_inst).filters with
       | [first;second] -> first=existing && second.c_prop="fixture/later"
           && second.c_op="text-contains"
       | _ -> false);
  check "Filter submission closes the open surface" (!Views_popup.open_popups=[]);
  Views_popup.close_all ();
  ignore (Lui_app.dispose delayed_filter.S.app);
  Views_popup.stack_st := previous_stack;
  let reference_facet_check done_ =
    let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model
    and previous_stack = !Views_popup.stack_st and previous_ops = !Views_state.ops_ref in
    Runtime.read_model := (fun () -> {Model.initial with repo=Some "reference-facets"});
    Views_state.install_ops
      {o_refresh=(fun _ -> ()); o_refresh_src=(fun _ _ -> ()); o_create_view=(fun _ -> ());
       o_rename_box=(fun _ _ -> Lui_elements.spacer []); o_export=(fun _ -> ());
       o_add_object=(fun _ -> ()); o_title_of_uuid=(fun _ uuid -> uuid);
       o_load_more=(fun _ -> ()); o_full_action_rows=(fun _ reply -> reply (Error "Full action rows are not installed"))};
    let rec next = function
      | [] ->
          Runtime.worker:=previous_worker; Runtime.read_model:=previous_model;
          Views_popup.stack_st:=previous_stack; Views_state.ops_ref:=previous_ops; done_ ()
      | scenario::rest ->
          Views_popup.stack_st:=None;
          let selected = ref false and requests = ref 0 in
          let counts = ["Page",2;"tags",2;"Ref A",1;"Ref B",1;"Zebra",1;"Alpha",1] in
          let key = Views_db.key_ref_pages_count "facet-owner" in
          ignore (Fake_worker.install (fun name args -> match name with
            | "thread-api/get-render-snapshots" ->
                let resources = Wire.get (List.nth args 1) "resources" |> Option.get |> Wire.elems in
                let slots = List.map (fun resource ->
                  let value = if resource=key then begin
                    incr requests;
                    let counts = if scenario=`Empty then [] else if !selected
                      then ["Page",1;"Ref B",1;"tags",1] else counts in
                    if scenario=`Error then Wire.Map [Wire.kw "error",Wire.String "facet request failed"]
                    else Wire.Map [Wire.kw "ref-pages-count",Wire.Array
                      (List.map (fun (title,n) -> Wire.Array [Wire.String title;Wire.Int n]) counts)]
                  end else Wire.Int 1 in
                  Wire.Array [Wire.kw "resource";resource],Wire.Map [Wire.kw "value",value]) resources in
                Wire.Map [Wire.kw "slots",Wire.Map slots]
            | "thread-api/pull" -> Wire.Map [Wire.kw "db/id",Wire.Int 12]
            | "thread-api/apply-outliner-ops" -> selected:=true; Wire.Map []
            | "thread-api/pull-many" -> Wire.Array [Wire.Map
                (if !selected then [Wire.kw Views_db.includes_prop,Wire.Array [Wire.Map
                  [Wire.kw "block/name",Wire.String "alpha";Wire.kw "block/title",Wire.String "Alpha"]]] else [])]
            | _ -> Wire.Nil));
          let instance = ref None and scope = ref None in
          let popup = mount (fun _ context parent ->
            instance:=Some (Views_state.make ~sched:context.Lui_ui.ui_scheduler
              ~kind:Views_state.KLinkedRefs ~feature:"linked-references" ~owner:(Wire.Uuid "facet-owner"));
            scope:=Some context.ui_scope; popup_layer context parent) in
          let inst = Option.get !instance in
          let open_popup () =
            Views_head.ref_filter_dialog ~owner_scope:(Option.get !scope) inst (popup_anchor ());
            S.flush popup in
          let chips () = List.filter (fun n -> class_has n "ls-ref-btn") (nodes popup) in
          let labels () = List.filter_map button_label (chips ()) in
          let count_labels () = nodes popup |> List.filter_map (fun n ->
            match M.string_prop n "text" with Some (" 1"|" 2" as value) -> Some value | _ -> None)
            |> List.sort String.compare in
          let includes () = List.exists (fun n -> M.string_prop n "text"=
            Some (I18n.t "reference.filter/includes")) (nodes popup) in
          open_popup ();
          ignore (Js.Global.setTimeout ~f:(fun () ->
            S.flush popup;
            let finish () = Views_popup.close_all (); ignore (Lui_app.dispose popup.S.app); next rest in
            match scenario with
            | `Empty -> check "Empty reference facets leave an editable search without chips"
                (chips ()=[] && List.exists (fun n -> M.string_prop n "placeholder"=
                  Some (I18n.t "reference.filter/search-placeholder")) (nodes popup)); finish ()
            | `Error -> check "Failed reference facets show the existing error, not stale options"
                (chips ()=[] && List.exists (fun n -> M.string_prop n "text"=Some (I18n.t "view/error")) (nodes popup)); finish ()
            | `Select ->
                let original_counts = count_labels () in
                check "Reference popup opens with all original facets" (labels ()=List.map fst counts);
                let alpha = List.find (fun n -> button_label n=Some "Alpha") (chips ()) in
                S.dispatch popup (P.PressDetail (alpha.M.id,
                  {x=0.;y=0.;modifiers=0;button=0;target_class=""}));
                ignore (Js.Global.setTimeout ~f:(fun () ->
                  S.flush popup; Runtime.run_sync_subs [];
                  ignore (Js.Global.setTimeout ~f:(fun () ->
                    S.flush popup;
                    check "Selecting Alpha saves the live page filter"
                      (!selected && (Views_state.get inst).ref_includes=["alpha","Alpha"]);
                    check "Selection and sync keep the popup's full facets and original counts"
                      (labels ()=List.map fst counts && count_labels ()=original_counts && !requests=1);
                    check "Includes does not appear in an already-open unfiltered snapshot" (not (includes ()));
                    Views_popup.close_all (); S.flush popup; open_popup ();
                    ignore (Js.Global.setTimeout ~f:(fun () ->
                      S.flush popup;
                      check "Reopening reflects the saved Includes section and fresh filtered counts"
                        (includes () && labels ()=["Alpha";"Page";"Ref B";"tags"]
                         && count_labels ()=[" 1";" 1";" 1"] && !requests=2);
                      finish ()) 20)) 200)) 0)) 200)
    in next [`Select;`Empty;`Error]
  in
  let filter_value_check done_ =
    let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model
    and previous_stack = !Views_popup.stack_st in
    Runtime.read_model := (fun () -> {Model.initial with repo=Some "filter-value-fixture"});
    let rec next = function
      | [] ->
          Runtime.worker:=previous_worker;Runtime.read_model:=previous_model;
          Views_popup.stack_st:=previous_stack;done_ ()
      | (column,data,expected,scenario)::rest ->
          Views_popup.stack_st:=None;
          Runtime.worker:=Some {Worker_client.invoke_fn=(fun name args ->
              if name="thread-api/get-view-filter-data" then
                check "filter value requests include their complete property type"
                  (match args with
                   | [_;options] -> (match Wire.get options "property" with
                     | Some property -> Wire.get property "logseq.property/type"=Some (Wire.Keyword column.Views_state.c_type)
                     | None -> false)
                   | _ -> false);
              Js.Promise.resolve (if name="thread-api/get-view-filter-data" then data else Wire.Nil));
            on_message=(fun _ _ -> ());dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
          let instance = ref None in
          let selector = mount (fun _ context parent ->
            let inst=Views_state.make ~sched:context.Lui_ui.ui_scheduler
              ~kind:Views_state.KAllPages ~feature:"filter-value-fixture" ~owner:Wire.Nil in
            instance:=Some inst;popup_layer context parent) in
          let inst=Option.get !instance in
          Views_head.filter_value_phase inst ~anchor:(popup_anchor ()) column;
          ignore (Js.Promise.then_ (fun () ->
            let rendered = List.exists (fun n -> n.M.kind="input") (nodes selector) in
            check "asynchronous view popups publish their own frame without another input event" rendered;
            if rendered then begin
              let multiple=Wire.get data "value-source"=Some (Wire.Keyword "property-values") in
              check "filter value controls satisfy the portable button naming contract"
                (List.for_all (fun node -> node.M.kind<>"button"
                  || P.node_properties_supported P.Button (button_properties node)) (nodes selector));
              eqi "view filter values use the same portable option list" expected
                (List.length (List.filter (fun n -> class_has n "ls-view-select-option") (nodes selector)));
              let input=List.find (fun n -> n.M.kind="input") (nodes selector) in
              check "property-value filters expose checkbox choices"
                (List.length (List.filter (fun node -> node.M.kind="checkbox") (nodes selector))
                 =if multiple then expected else 0);
              check "live property-value filters have no Apply action"
                (not (List.exists (fun node -> node.M.kind="button"
                  && M.string_prop node "text"=Some (I18n.t "ui/apply")) (nodes selector)));
              (match scenario with
              | `Empty key ->
                S.text_changed selector input.M.id "No matching value";
                let action=List.find_opt (fun n -> n.M.kind="button"
                  && button_label n=Some (I18n.t key)) (nodes selector) in
                check "value search preserves its empty-value footer action" (Option.is_some action);
                Option.iter (fun n -> S.press selector n.M.id) action;
                check "empty-value footer commits the chosen operator"
                  (match (Views_state.get inst).filters with
                   | [clause] -> clause.c_op=(if key="view.filter/is-empty" then "is" else "is-not")
                       && clause.c_val=Some (Wire.Keyword "empty")
                   | _ -> false);
                check "empty-value footer closes its popup" (!Views_popup.open_popups=[])
              | `Choose ->
                  S.submit selector input.M.id;
                  check "view filter value selection updates one clause"
                    (List.length (Views_state.get inst).filters=1);
                  check "only multi-value filters retain their popup after selection"
                    ((!Views_popup.open_popups<>[])=multiple);
                  if multiple then
                    check "property-value filters persist a value set"
                      (match (Views_state.get inst).filters with
                       | [{c_val=Some (Wire.Set [Wire.String "alpha"]);_}] -> true | _ -> false)
              | `Multiple ->
                  let previous={Views_state.c_prop="fixture/previous";c_op="text-contains";c_val=Some (Wire.String "keep")}
                  and newer={Views_state.c_prop="fixture/newer";c_op="text-contains";c_val=Some (Wire.String "also keep")} in
                  Views_state.update inst (fun state -> {state with filters=[previous]});
                  let rows ()=List.filter (fun node -> class_has node "ls-view-select-option") (nodes selector) in
                  let choose index=match List.nth_opt (rows ()) index with
                    | Some node -> S.press selector node.M.id
                    | None -> check "requested multi-value choice remains available" false in
                  let values ()=List.find_map (fun (clause:Views_state.filter_clause) ->
                    if clause.Views_state.c_prop=column.c_id then match clause.c_val with
                      | Some (Wire.Set values) -> Some values | _ -> None
                    else None) (Views_state.get inst).filters in
                  choose 0;
                  check "first tag selection creates a set and keeps the picker open"
                    (values ()=Some [Wire.Uuid "tag-a"] && !Views_popup.open_popups<>[]);
                  Views_state.update inst (fun state -> {state with filters=state.filters @ [newer]});
                  S.text_changed selector input.M.id "Omega";
                  S.submit selector input.M.id;
                  check "filtered selection preserves hidden checked values"
                    (values ()=Some [Wire.Uuid "tag-a";Wire.Uuid "tag-c"]);
                  check "multi-value selection preserves the searched result list"
                    (List.length (rows ())=1);
                  S.text_changed selector input.M.id "";
                  choose 1;
                  check "identical tag labels retain distinct reference values"
                    (values ()=Some [Wire.Uuid "tag-a";Wire.Uuid "tag-b";Wire.Uuid "tag-c"]);
                  check "repeated tag selection updates one owned clause and preserves other filters"
                    (List.length (Views_state.get inst).filters=3
                     && List.mem previous (Views_state.get inst).filters && List.mem newer (Views_state.get inst).filters);
                  (match List.find_opt (fun (clause:Views_state.filter_clause) -> clause.c_prop=column.c_id) (Views_state.get inst).filters with
                   | Some clause -> check "selected tag sets display titles instead of UUIDs"
                       (Views_head.filter_value_label inst clause="Same, Same, Omega")
                   | None -> check "selected tag clause exists" false);
                  List.iter choose [0;1;2];
                  check "unchecking all tags removes only the owned filter"
                    ((Views_state.get inst).filters=[previous;newer] && !Views_popup.open_popups<>[]);
                  choose 0;
                  let empty=List.find_opt (fun node -> node.M.kind="button"
                    && button_label node=Some (I18n.t "view.filter/is-empty")) (nodes selector) in
                  Option.iter (fun node -> S.press selector node.M.id) empty;
                  check "empty footer replaces the live tag clause instead of appending another"
                    (List.length (Views_state.get inst).filters=3 && !Views_popup.open_popups=[]));
              if column.Views_state.c_type="datetime" then
                check "timestamp filter presets use the reference after operator"
                  (List.exists (fun f -> f.Views_state.c_op="after") (Views_state.get inst).filters)
            end;
            Views_popup.close_all ();
            ignore (Lui_app.dispose selector.S.app);
            next rest;Js.Promise.resolve ()) (Js.Promise.resolve ()))
    in
    let data source values=Wire.Map [Wire.kw "value-source",Wire.Keyword source;
      Wire.kw "values",Wire.Array values] in
    let checked={(Views_table.created_column ()) with Views_state.c_id="fixture/checked";c_name="Checked";c_type="checkbox"}
    and value={(Views_table.created_column ()) with Views_state.c_id="fixture/value";c_name="Value";c_type="default"} in
    let values=data "property-values" [Wire.Map [Wire.kw "label",Wire.String "Alpha";Wire.kw "value",Wire.String "alpha"]] in
    next [(Views_table.created_column ()),data "timestamp" [],List.length (I18n.timestamp_options ()),`Choose;
      checked,data "checkbox" [],2,`Empty "view.filter/is-empty";
      checked,data "checkbox" [],2,`Empty "view.filter/is-not-empty";
      value,values,1,`Choose;
      value,values,1,`Empty "view.filter/is-empty";
      value,values,1,`Empty "view.filter/is-not-empty";
      {value with c_id="fixture/tags";c_name="Tags"},data "property-values"
        (List.map (fun (label,uuid) -> Wire.Map [Wire.kw "label",Wire.String label;Wire.kw "value",Wire.Uuid uuid])
          ["Same","tag-a";"Same","tag-b";"Omega","tag-c"]),3,`Multiple]
  in
  let filter_reference_titles_check done_ =
    let previous_worker= !Runtime.worker and previous_model= !Runtime.read_model in
    Runtime.read_model:=(fun () -> {Model.initial with repo=Some "filter-reference-fixture"});
    let requested=ref [] in
    Runtime.worker:=Some {Worker_client.invoke_fn=(fun method_ args ->
      let results=if method_="thread-api/get-blocks" then
        match args with
        | [_;Wire.Array requests] ->
            List.map (fun request ->
              let uuid=Option.get (Option.bind (Wire.get request "id") Wire.as_uuid) in
              requested:= !requested @ [uuid];
              Wire.Map [Wire.kw "id",Wire.Uuid uuid;Wire.kw "block",Wire.Map
                [Wire.kw "block/uuid",Wire.Uuid uuid;Wire.kw "block/title",Wire.String
                  (match uuid with "tag-a" -> "Journal" | "tag-b" -> "Page" | _ -> "Row")]]) requests
        | _ -> []
        else [] in
      Js.Promise.resolve (Wire.List results));on_message=(fun _ _ -> ());
      dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
    let instance=ref None in
    let selector=mount (fun _ context parent ->
      let inst=Views_state.make ~sched:context.Lui_ui.ui_scheduler
        ~kind:Views_state.KAllPages ~feature:"filter-reference-fixture" ~owner:Wire.Nil in
      instance:=Some inst;Views_head.filters_row inst context parent) in
    let inst=Option.get !instance in
    let clause={Views_state.c_prop="block/tags";c_op="is";
      c_val=Some (Wire.Set [Wire.Uuid "tag-a";Wire.Uuid "tag-b"])} in
    Views_state.update inst (fun state -> {state with filters=[clause]});
    S.flush selector;
    let retained_label=List.find (fun node -> M.string_prop node "text"=Some "tag-a, tag-b") (nodes selector) in
    Views_view.load_blocks inst ["row"] (fun () ->
      S.flush selector;
      check "view loading fetches filter references with row metadata"
        (!requested=["row";"tag-a";"tag-b"]);
      check "reloaded filter sets resolve reference titles"
        (Views_head.filter_value_label inst clause="Journal, Page");
      check "hydrating reference titles updates the existing filter label"
        (List.exists (fun node -> node.M.id=retained_label.M.id
          && M.string_prop node "text"=Some "Journal, Page") (nodes selector));
      ignore (Lui_app.dispose selector.S.app);Runtime.worker:=previous_worker;
      Runtime.read_model:=previous_model;done_ ())
  in
  let filter_edit_check done_ =
    let previous_worker= !Runtime.worker and previous_model= !Runtime.read_model
    and previous_stack= !Views_popup.stack_st in
    Runtime.read_model:=(fun () -> {Model.initial with repo=Some "filter-edit-fixture"});
    let rec next = function
      | [] -> Runtime.worker:=previous_worker;Runtime.read_model:=previous_model;
          Views_popup.stack_st:=previous_stack;done_ ()
      | (column,operator,initial,source,many,choices)::rest ->
          Views_popup.stack_st:=None;
          Runtime.worker:=Some {Worker_client.invoke_fn=(fun method_ args ->
            if method_="thread-api/get-view-filter-data" then
              check "reopening a filter requests values for its current operator"
                (match args with [_;opts] -> Wire.get opts "operator"=Some (Wire.Keyword operator) | _ -> false);
            Js.Promise.resolve (if method_="thread-api/get-view-filter-data" then Wire.Map
              [Wire.kw "value-source",Wire.Keyword source;Wire.kw "many?",Wire.Bool many;
               Wire.kw "values",Wire.Array (List.map (fun (label,value) -> Wire.Map
                 [Wire.kw "label",Wire.String label;Wire.kw "value",value]) choices)] else Wire.Nil));
            on_message=(fun _ _ -> ());dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
          let previous={Views_state.c_prop="fixture/previous";c_op="is";c_val=Some (Wire.Bool true)}
          and current={Views_state.c_prop=column.Views_state.c_id;c_op=operator;c_val=Some initial}
          and following={Views_state.c_prop="fixture/following";c_op="is";c_val=Some (Wire.Bool false)} in
          let unlisted=initial=Wire.Set [Wire.Uuid "tag-a";Wire.Uuid "tag-c"] in
          let retained=if unlisted then [Wire.Uuid "tag-c"] else [] in
          let instance=ref None in
          let selector=mount (fun _ context parent ->
            let inst=Views_state.make ~sched:context.Lui_ui.ui_scheduler
              ~kind:Views_state.KAllPages ~feature:"filter-edit-fixture" ~owner:Wire.Nil in
            instance:=Some inst;
            Views_state.update inst (fun state ->
              Hashtbl.replace state.ref_titles "tag-c" "Retained";
              {state with columns=[column];filters=[previous;current;following]});
            Lui_elements.column [Views_head.filters_row inst;popup_layer] context parent) in
          let inst=Option.get !instance in
          let value_id="vchip-value-" ^ string_of_int inst.Views_state.id ^ "-1" in
          let button ()=List.find_opt (fun node -> M.string_prop node "accessibility-identifier"=Some value_id) (nodes selector) in
          check "every existing filter has an editable value button"
            (match button () with Some node -> node.M.kind="button" | None -> false);
          (match button () with
          | None -> ignore (Lui_app.dispose selector.S.app);next rest
          | Some trigger ->
              let document= !(Stub_dom.document_ref) in
              let lookup : string -> Js.Json.t=Stub_dom.get_field document "getElementById" in
              let anchor=Stub_dom.make_element "button" in
              let set_attribute : string -> string -> unit=Stub_dom.get_field anchor "setAttribute" in
              set_attribute "id" value_id;
              Stub_dom.set_field document "getElementById" (fun id -> if id=value_id then anchor else lookup id);
              S.press selector trigger.M.id;
              Stub_dom.set_field document "getElementById" lookup;
              ignore (Js.Promise.then_ (fun () ->
                let input=List.find_opt (fun node -> node.M.kind="input") (nodes selector) in
                check "clicking an existing filter opens its value picker" (Option.is_some input);
                Option.iter (fun input ->
                  check "reopening a value picker does not alter its filter"
                    ((Views_state.get inst).filters=[previous;current;following]);
                  check "only many-value editors expose checkboxes"
                    ((List.exists (fun node -> node.M.kind="checkbox") (nodes selector))=many);
                  if many then begin
                    let boxes ()=List.filter (fun node -> node.M.kind="checkbox") (nodes selector) in
                    check "reopened multi-value filters restore their checked choice"
                      (List.exists (fun node -> M.string_prop node "accessibility-label"=Some "First"
                        && Hashtbl.find_opt node.M.props "checked"=Some (P.BoolValue true)) (boxes ()));
                    S.text_changed selector input.M.id "Second";
                    S.submit selector input.M.id;
                    check "editing updates one clause and retains hidden selected references"
                      ((Views_state.get inst).filters=[previous;{current with c_val=Some
                        (Wire.Set ([Wire.Uuid "tag-a";Wire.Uuid "tag-b"] @ retained))};following]);
                    check "live filter edits retain the value trigger"
                      (match button () with Some node -> node.M.id=trigger.M.id | None -> false);
                    S.submit selector input.M.id;
                    S.text_changed selector input.M.id "First";
                    S.submit selector input.M.id;
                    check "clearing available choices preserves unlisted references and the operator"
                      ((Views_state.get inst).filters=[previous;{current with c_val=Some (Wire.Set retained)};following]);
                    if not unlisted then
                      check "empty selections display the translated All label"
                        (Views_head.filter_value_label inst {current with c_val=Some (Wire.Set [])}=I18n.t "view/all");
                    let empty=List.filter (fun node -> node.M.kind="button"
                      && button_label node=Some (I18n.t "view.filter/empty")) (nodes selector) in
                    check "existing value filters offer exactly one Empty footer action" (List.length empty=1);
                    check "filter footer actions keep the reference height"
                      (List.for_all (fun node -> Hashtbl.find_opt node.M.props "height"=Some (P.IntValue 28)) empty);
                    List.iter (fun node -> S.press selector node.M.id) empty;
                    check "the Empty action preserves the existing operator and popup"
                      ((Views_state.get inst).filters=[previous;{current with c_val=Some (Wire.Keyword "empty")};following]
                       && !Views_popup.open_popups<>[])
                  end else begin
                    S.submit selector input.M.id;
                    check "single value replacement preserves adjacent clauses and its operator"
                      (match (Views_state.get inst).filters with
                       | [a;b;c] -> a=previous && c=following && b.c_op=operator && b.c_val<>current.c_val
                       | _ -> false);
                    check "single value replacement closes its picker" (!Views_popup.open_popups=[]);
                    if source="property-values" then
                        check "single reference choices publish their title immediately"
                          (Views_head.filter_value_label inst (List.nth (Views_state.get inst).filters 1)="First")
                  end) input;
                Views_popup.close_all ();ignore (Lui_app.dispose selector.S.app);next rest;Js.Promise.resolve ())
                (Js.Promise.resolve ())))
    in
    let tags=Views_table.tags_column () in
    let checked={tags with Views_state.c_id="fixture/checked";c_name="Checked";c_type="checkbox"} in
    next [tags,"is-not",Wire.Set [Wire.Uuid "tag-a"],"property-values",true,
        ["First",Wire.Uuid "tag-a";"Second",Wire.Uuid "tag-b"];
      tags,"is",Wire.Set [Wire.Uuid "tag-a";Wire.Uuid "tag-c"],"property-values",true,
        ["First",Wire.Uuid "tag-a";"Second",Wire.Uuid "tag-b"];
      checked,"is",Wire.Bool false,"checkbox",false,[];
      (Views_table.created_column ()),"before",Wire.String "1 year ago","timestamp",false,[];
      {tags with c_id="fixture/date";c_name="Date";c_type="date"},"date-before",Wire.Uuid "tag-b","property-values",false,
        ["First",Wire.Uuid "tag-a";"Second",Wire.Uuid "tag-b"]]
  in
  let filter_operator_check done_ =
    let previous_worker= !Runtime.worker and previous_model= !Runtime.read_model
    and previous_stack= !Views_popup.stack_st in
    Runtime.read_model:=(fun () -> {Model.initial with repo=Some "filter-operator-fixture"});
    let rec next = function
      | [] -> Runtime.worker:=previous_worker;Runtime.read_model:=previous_model;
          Views_popup.stack_st:=previous_stack;done_ ()
      | (before,operand,after,normalized)::rest ->
          Views_popup.stack_st:=None;
          let requests=ref [] in
          Runtime.worker:=Some {Worker_client.invoke_fn=(fun method_ args ->
            let response=if method_="thread-api/get-view-filter-data" then begin
              let opts=List.nth args 1 in
              requests:=opts::!requests;
              if Wire.get opts "operator"=Some (Wire.Keyword after) then
                Wire.Map [Wire.kw "value-after-operator-change",normalized]
              else Wire.Map [Wire.kw "operators",Wire.Array [Wire.Keyword after]]
            end else Wire.Nil in
            Js.Promise.resolve response);on_message=(fun _ _ -> ());
            dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
          let instance=ref None in
          let previous={Views_state.c_prop="fixture/other";c_op="is";c_val=Some (Wire.Bool false)}
          and clause={Views_state.c_prop="fixture/value";c_op=before;c_val=operand}
          and following={Views_state.c_prop="fixture/following";c_op="is";c_val=Some (Wire.Bool true)} in
          let retire=after="number-lt" in
          let retire_on_open=after="number-gte" in
          let hydrate=operand=Some (Wire.String "hydrate") in
          let selector=mount (fun _ context parent ->
            let inst=Views_state.make ~sched:context.Lui_ui.ui_scheduler
              ~kind:Views_state.KAllPages ~feature:"filter-operator-fixture" ~owner:Wire.Nil in
            instance:=Some inst;Views_state.update inst (fun state -> {state with filters=[previous;clause;following]});
            Lui_elements.column [Views_head.filters_row inst;popup_layer] context parent) in
          let inst=Option.get !instance in
          let identifier="vchip-op-" ^ string_of_int inst.Views_state.id ^ "-1" in
          let trigger=List.find (fun node -> M.string_prop node "accessibility-identifier"=Some identifier) (nodes selector) in
          let document= !(Stub_dom.document_ref) in
          let lookup : string -> Js.Json.t=Stub_dom.get_field document "getElementById" in
          let anchor=Stub_dom.make_element "button" in
          let set_attribute : string -> string -> unit=Stub_dom.get_field anchor "setAttribute" in
          set_attribute "id" identifier;
          Stub_dom.set_field document "getElementById" (fun id -> if id=identifier then anchor else lookup id);
          S.press selector trigger.M.id;Stub_dom.set_field document "getElementById" lookup;
          if retire_on_open then Views_state.update inst (fun state -> {state with filters=[previous;following]});
          S.flush selector;
          ignore (Js.Promise.then_ (fun () ->
            if retire_on_open then begin
              check "a retired operator trigger cannot publish its delayed menu" (!Views_popup.open_popups=[]);
              Views_popup.close_all ();ignore (Lui_app.dispose selector.S.app);next rest
            end else begin
            let choice=List.find (fun node -> node.M.kind="menu-item"
              && M.string_prop node "text"=Some (I18n.operator_text after)) (nodes selector) in
            S.press selector choice.M.id;
            if retire then Views_state.update inst (fun state -> {state with filters=[previous;following]});
            if hydrate then Views_state.update inst (fun state ->
              let filters,filters_or=Views_state.filters_of_wire
                (Views_state.filters_to_wire state.filters state.filters_or) in
              {state with filters;filters_or;loading=not state.loading});
            S.flush selector;
            ignore (Js.Promise.then_ (fun () ->
              S.flush selector;
              check "operator changes request normalization with their current operand"
                (List.exists (fun opts -> Wire.get opts "operator"=Some (Wire.Keyword after)
                   && Wire.get opts "value"=Some (Option.value operand ~default:Wire.Nil)) !requests);
              if retire then
                check "a retired clause cannot apply its delayed operator reply to the next filter"
                  ((Views_state.get inst).filters=[previous;following])
              else check (if hydrate then "equivalent resource rehydration preserves a pending operator change"
                else "operator changes apply the worker's normalized value and preserve adjacent clauses")
                ((Views_state.get inst).filters=[previous;{clause with c_op=after;
                    c_val=(if normalized=Wire.Nil then None else Some normalized)};following]);
              Views_popup.close_all ();ignore (Lui_app.dispose selector.S.app);next rest;Js.Promise.resolve ())
              (Js.Promise.resolve ()))
            end;Js.Promise.resolve ()) (Js.Promise.resolve ()))
    in
    next ["is",Some (Wire.Set [Wire.Uuid "tag"]),"text-contains",Wire.Nil;
      "is",Some (Wire.Keyword "empty"),"is-not",Wire.Nil;
      "text-contains",Some (Wire.String "café 中文 😀"),"text-not-contains",Wire.String "café 中文 😀";
      "text-contains",Some (Wire.String "12"),"number-gt",Wire.Nil;
      "number-gt",Some (Wire.Float 0.),"number-lte",Wire.Float 0.;
      "between",Some (Wire.Array [Wire.Int 1;Wire.Int 2]),"between",Wire.Array [Wire.Int 1;Wire.Int 2];
      "after",Some (Wire.Date_ms 0L),"before",Wire.Date_ms 0L;
      "is",None,"text-contains",Wire.Nil;
      "text-contains",Some (Wire.String "retire"),"number-lt",Wire.Nil;
      "text-contains",Some (Wire.String "retire menu"),"number-gte",Wire.Nil;
      "text-contains",Some (Wire.String "hydrate"),"text-not-contains",Wire.String "hydrate"]
  in
  let page_name_filter_check done_ =
    let previous_worker= !Runtime.worker and previous_model= !Runtime.read_model
    and previous_stack= !Views_popup.stack_st in
    Views_popup.stack_st:=None;
    Runtime.read_model:=(fun () -> {Model.initial with repo=Some "page-name-filter-fixture"});
    Runtime.worker:=Some {Worker_client.invoke_fn=(fun method_ _ -> Js.Promise.resolve
      (if method_="thread-api/get-view-filter-data" then Wire.Map
        [Wire.kw "value-source",Wire.Keyword "property-values";Wire.kw "values",Wire.Array []]
       else Wire.Nil));on_message=(fun _ _ -> ());dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
    let instance=ref None in
    let selector=mount (fun _ context parent ->
      let inst=Views_state.make ~sched:context.Lui_ui.ui_scheduler
        ~kind:Views_state.KAllPages ~feature:"page-name-filter-fixture" ~owner:Wire.Nil in
      instance:=Some inst;Views_state.update inst (fun state -> {state with columns=[Views_table.page_title_column ()]});
      Lui_elements.column [Views_head.filters_row inst;popup_layer] context parent) in
    let inst=Option.get !instance in
    Views_head.filter_popup inst (popup_anchor ());S.flush selector;
    let search=List.find (fun node -> node.M.kind="input") (nodes selector) in
    S.submit selector search.M.id;
    ignore (Js.Promise.then_ (fun () ->
      S.flush selector;
      check "choosing Page name creates a text-contains filter directly"
        ((Views_state.get inst).filters=[{Views_state.c_prop="block/title";c_op="text-contains";c_val=None}]);
      check "Page name exposes an inline field instead of opening a value picker"
        (!Views_popup.open_popups=[] && List.exists (fun node -> node.M.kind="input"
          && match M.string_prop node "accessibility-identifier" with
             | Some id -> String.starts_with ~prefix:"vchip-input-" id | None -> false) (nodes selector));
      Views_popup.close_all ();ignore (Lui_app.dispose selector.S.app);
      Runtime.worker:=previous_worker;Runtime.read_model:=previous_model;
      Views_popup.stack_st:=previous_stack;done_ ();Js.Promise.resolve ()) (Js.Promise.resolve ()))
  in
  let filter_input_check () =
    let previous_worker= !Runtime.worker and previous_model= !Runtime.read_model in
    Runtime.worker:=Some {Worker_client.invoke_fn=(fun _ _ -> Js.Promise.resolve Wire.Nil);
      on_message=(fun _ _ -> ());dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
    Runtime.read_model:=(fun () -> Model.initial);
    List.iter (fun (operator,initial) ->
      let instance=ref None in
      let previous={Views_state.c_prop="fixture/other";c_op="is";c_val=Some (Wire.Bool false)}
      and clause={Views_state.c_prop="fixture/value";c_op=operator;c_val=initial} in
      let selector=mount (fun _ context parent ->
        let inst=Views_state.make ~sched:context.Lui_ui.ui_scheduler
          ~kind:Views_state.KAllPages ~feature:"filter-input-fixture" ~owner:Wire.Nil in
        instance:=Some inst;Views_state.update inst (fun state -> {state with filters=[previous;clause]});
        Views_head.filters_row inst context parent) in
      let inst=Option.get !instance in
      let inputs ()=List.filter (fun node -> node.M.kind="input") (nodes selector) in
      let range=operator="between" in
      check "text, numeric and range operators render their inline fields"
        (List.length (inputs ())=(if range then 2 else 1));
      (match inputs () with
       | [] -> ()
       | first::rest ->
          let current ()=List.nth (Views_state.get inst).filters 1 in
          let write node draft expected =
            S.text_changed selector node.M.id draft;
            check "inline input persists its typed operand" ((current ()).c_val=expected);
            check "inline edits preserve adjacent filters and the operator"
              (List.hd (Views_state.get inst).filters=previous && (current ()).c_op=operator);
            check "typing preserves the field and its exact draft"
              (List.exists (fun live -> live.M.id=node.M.id && M.string_prop live "text"=Some draft) (inputs ())) in
          check "inline fields use the reference ninety-six by twenty-four bounds"
            (List.for_all (fun node -> Hashtbl.find_opt node.M.props "width"=Some (P.IntValue 96)
              && Hashtbl.find_opt node.M.props "height"=Some (P.IntValue 24)) (inputs ()));
          if range then begin
            let last=List.hd rest in
            check "range fields expose translated endpoint placeholders"
              (M.string_prop first "placeholder"=Some (I18n.t "view.filter/from")
               && M.string_prop last "placeholder"=Some (I18n.t "view.filter/to"));
            write first "" None;
            write last "0" (Some (Wire.Array [Wire.Nil;Wire.Float 0.]));
            write first "1." (Some (Wire.Array [Wire.Float 1.;Wire.Float 0.]));
            write first "1.5" (Some (Wire.Array [Wire.Float 1.5;Wire.Float 0.]));
            write last "10" (Some (Wire.Array [Wire.Float 1.5;Wire.Float 10.]));
            write first "" (Some (Wire.Array [Wire.Nil;Wire.Float 10.]));
            write last "" None
          end else if String.starts_with ~prefix:"number-" operator then begin
            List.iter (fun (draft,number) -> write first draft (Option.map (fun n -> Wire.Float n) number))
              ["-",None;"-1",Some (-1.);"-1.",Some (-1.);"-1.25",Some (-1.25);
               "",None;"0",Some 0.;"1e",None;"1e2",Some 100.;"NaN",None;"infinity",None];
            Views_state.update inst (fun state -> {state with filters=[previous;{clause with c_val=Some (Wire.Int 42)}]});
            S.flush selector;
            check "external numeric changes refresh the retained field"
              (List.exists (fun node -> node.M.id=first.M.id && M.string_prop node "text"=Some "42") (inputs ()))
          end else begin
            write first "café 中文 😀" (Some (Wire.String "café 中文 😀"));
            for count=1 to 200 do
              let draft=String.make count 'x' in
              S.text_changed selector first.M.id draft
            done;
            check "rapid filter typing retains every character and its input"
              ((current ()).c_val=Some (Wire.String (String.make 200 'x'))
               && List.exists (fun node -> node.M.id=first.M.id) (inputs ()));
            write first "" (Some (Wire.String ""))
          end);
      ignore (Lui_app.dispose selector.S.app))
      ["text-contains",Some (Wire.String "First");"text-not-contains",None;
       "number-gt",Some (Wire.Int 2);"between",Some (Wire.Array [Wire.Int 2;Wire.Nil])];
    Runtime.worker:=previous_worker;Runtime.read_model:=previous_model
  in
  let filter_scope_check () =
    let previous_worker= !Runtime.worker and previous_model= !Runtime.read_model in
    Runtime.worker:=Some {Worker_client.invoke_fn=(fun _ _ -> Js.Promise.resolve Wire.Nil);
      on_message=(fun _ _ -> ());dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
    Runtime.read_model:=(fun () -> Model.initial);
    List.iter (fun query -> List.iter (fun operator ->
      let instance=ref None in
      let selector=mount (fun _ context parent ->
        let inst=Views_state.make ~sched:context.Lui_ui.ui_scheduler
          ~kind:(if query then Views_state.KQuery {block_uuid="scope-query"} else Views_state.KAllPages)
          ~feature:"filter-scope-fixture" ~owner:Wire.Nil in
        instance:=Some inst;
        Views_state.update inst (fun state -> {state with qsrc="(task TODO)";loading=false;query_rows=["scope-result"];
          data=Views_wire.VFlat {rows=[];count=0;previews=Hashtbl.create 0;qprops=[]};
          filters=[{Views_state.c_prop="fixture/value";c_op=operator;c_val=None}]});
        Lui_elements.column [if query then Views_view.query_view_el inst else Views_view.view_el inst] context parent) in
      let inst=Option.get !instance in
      let fields ()=List.filter (fun node -> match M.string_prop node "accessibility-identifier" with
        | Some id -> String.starts_with ~prefix:"vchip-input-" id | None -> false) (nodes selector) in
      let first=List.hd (fields ()) in
      S.text_changed selector first.M.id "-1.";
      check (if query then "query table updates preserve an active filter draft"
             else "ordinary table updates preserve an active filter draft")
        (List.exists (fun node -> node.M.id=first.M.id && M.string_prop node "text"=Some "-1.") (fields ()));
      Views_state.update inst (fun state -> {state with loading=not state.loading});S.flush selector;
      check "loading changes do not dispose filter inputs"
        (List.exists (fun node -> node.M.id=first.M.id && M.string_prop node "text"=Some "-1.") (fields ()));
      Views_state.update inst (fun state -> {state with view_uuid="another-view";
        filters=[{Views_state.c_prop="fixture/value";c_op=operator;c_val=None}]});S.flush selector;
      check "switching views resets unfinished filter drafts"
        (fields ()<>[] && List.for_all (fun node -> M.string_prop node "text"=Some "") (fields ()));
      Views_state.update inst (fun state -> {state with columns=[
        Views_table.builtin_column "fixture/value" "Amount" "number" ()]});S.flush selector;
      check "retained filter chips show property metadata loaded after their first frame"
        (List.exists (fun node -> node.M.kind="button"
          && Hashtbl.find_opt node.M.props "enabled"=Some (P.BoolValue false)
          && M.string_prop node "text"=Some "Amount") (nodes selector));
      ignore (Lui_app.dispose selector.S.app)) ["number-gt";"between"]) [false;true];
    Runtime.worker:=previous_worker;Runtime.read_model:=previous_model
  in
  let config_boot_check done_ =
    let previous_worker = !Runtime.worker and previous_published = !Sdk_config.published_config in
    let requests=ref [] in
    Sdk_config.published_config:=None;
    Runtime.worker:=Some {Worker_client.invoke_fn=(fun method_ args ->
      requests:=(method_,args)::!requests;
      Js.Promise.resolve (match method_ with
        | "thread-api/get-file-content" -> Wire.String "{:start-of-week 0}"
        | "thread-api/create-or-open-db" -> Wire.Map [Wire.kw "schema",Wire.Map []]
        | _ -> failwith ("Unexpected config boot request: " ^ method_)));
      on_message=(fun _ _ -> ());dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
    ignore (Js.Promise.then_ (fun config ->
      check "Graph opening loads its own calendar configuration"
        (Wire.get config "start-of-week"=Some (Wire.Int 0));
      check "Graph config is read from the opened repo"
        (List.exists (fun (name,args) -> name="thread-api/get-file-content"
          && args=[Wire.String "calendar-config-fixture";Wire.String "logseq/config.edn"]) !requests);
      Runtime.worker:=previous_worker;Sdk_config.published_config:=previous_published;
      done_ ();Js.Promise.resolve ()) (Graph.open_graph "calendar-config-fixture"))
  in
  let config_save_check done_ =
    let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model
    and previous_send = !Runtime.app_send in
    let original=Wire.Map [Wire.kw "start-of-week",Wire.Int 0]
    and updated=Wire.Map [Wire.kw "start-of-week",Wire.Int 5] in
    let rec next = function
      | [] -> Runtime.worker:=previous_worker;Runtime.read_model:=previous_model;
          Runtime.app_send:=previous_send;done_ ()
      | (file,stale,invalid)::rest ->
          let state=ref {Model.initial with repo=Some "calendar-save-fixture";graph_config=original}
          and complete=ref (fun () -> ()) in
          Runtime.read_model:=(fun () -> !state);
          Runtime.app_send:=(fun action -> state:=Update.update !state action;true);
          Runtime.worker:=Some {Worker_client.invoke_fn=(fun name _ ->
            if name<>"thread-api/transact" then failwith ("Unexpected config save: " ^ name);
            Js.Promise.make (fun ~resolve ~reject:_ -> complete:=(fun () -> resolve Wire.Nil [@u])));
            on_message=(fun _ _ -> ());dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
          if file then File_view.save "calendar-save-fixture" "logseq/config.edn"
            (if invalid then "[:invalid-config]" else "{:start-of-week 5}")
          else ignore (Sdk_config.write_config "calendar-save-fixture" updated);
          check "Graph preferences wait for successful file persistence" ((!state).graph_config=original);
          if stale then state:={(!state) with repo=Some "new-calendar-graph"};
          !complete ();
          ignore (Js.Promise.then_ (fun () ->
            check "Config saves refresh only their originating graph"
              (if stale || invalid then (!state).graph_config=original else
                 Wire.get (!state).graph_config "start-of-week"=Some (Wire.Int 5)
                 && Wire.get (!state).graph_config "ui/hide-empty-properties?"
                    =Some (Wire.Bool false));
            if invalid then check "Invalid config edits report an error and retain the last valid preferences"
              (List.exists (fun toast -> toast.Model.toast_kind="error"
                && toast.toast_text=I18n.t1 "file.config/invalid-title" "logseq/config.edn") (!state).toasts);
            next rest;Js.Promise.resolve ()) (Js.Promise.resolve ()))
    in next [false,false,false;true,false,false;false,true,false;true,true,false;true,false,true]
  in
  let batch_property_check done_ =
    let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model
    and previous_dialog = !Properties_dialog.current
    and previous_signal = !Properties_dialog.current_sig
    and previous_scope = !Properties_dialog.open_scope
    and previous_close = !Properties_dialog.current_on_close in
    Runtime.read_model := (fun () -> {Model.initial with repo=Some "batch-property-fixture"});
    Properties_dialog.current := None;
    Properties_dialog.current_sig := None;
    Properties_dialog.open_scope := None;
    let operations = ref [] and dismissed = ref 0 and available = ref [] in
    let previous_pending = !Properties_value.pending_edit in
    ignore (Fake_worker.install (fun name args ->
      if name="thread-api/apply-outliner-ops" then (
        operations := Wire.elems (List.nth args 1) @ !operations;
        Wire.Map [Wire.kw "result",Wire.Nil])
      else if name="thread-api/get-all-properties" then Wire.Array !available
      else Wire.Nil));
    let target : Properties_dialog.target =
      {uuid="batch-first";uuids=["batch-first";"batch-second"];
       db_id=None;is_tag=false;title=""} in
    let prop = Wire.Map [Wire.kw "db/ident",Wire.kw "fixture/batch-flag";
      Wire.kw "block/title",Wire.String "Flag";
      Wire.kw "logseq.property/type",Wire.kw "checkbox"] in
    let picker = mount (fun _ -> Properties_dialog.view) in
    let rec defaults = function
      | [] ->
          ignore (Lui_app.dispose picker.S.app);
          Properties_dialog.current := previous_dialog;
          Properties_dialog.current_sig := previous_signal;
          Properties_dialog.open_scope := previous_scope;
          Properties_dialog.current_on_close := previous_close;
          Runtime.worker := previous_worker;
          Runtime.read_model := previous_model;
          Properties_value.pending_edit := previous_pending;
          done_ ()
      | (ty,default,expected)::rest ->
          operations := [];
          available := [Wire.Map ([Wire.kw "db/ident",Wire.kw "fixture/batch-flag";
            Wire.kw "block/title",Wire.String "Flag";
            Wire.kw "logseq.property/type",Wire.kw ty]
            @ match default with None -> [] | Some value ->
              [Wire.kw (if ty="checkbox" then "logseq.property/scalar-default-value"
                 else "logseq.property/default-value"),value])];
          Properties_dialog.open_at ~remove:false ~phase:Properties_dialog.Prop_select
            (Properties_dialog.Anchor_rect (120.,80.,104.,32.)) {target with uuids=[]};
          ignore (Js.Global.setTimeout ~f:(fun () ->
            S.flush picker;
            let choice=List.find (fun n -> n.M.kind="list-item") (nodes picker) in
            S.press picker choice.M.id;
            ignore (Js.Global.setTimeout ~f:(fun () ->
              check "Adding a property through its picker writes its configured default"
                (match !operations,expected with
                 | [Wire.Array [Wire.Keyword "batch-set-property";
                     Wire.Array [Wire.List [Wire.Uuid "batch-first"];
                       Wire.Keyword "fixture/batch-flag";value;_]]],Wire.Bool _ -> value=expected
                 | [Wire.Array [Wire.Keyword "create-property-text-block";
                     Wire.Array [Wire.Uuid "batch-first";
                       Wire.Keyword "fixture/batch-flag";value;_]]],Wire.String _ -> value=expected
                 | _ -> false);
              check "Successful default application closes the Set property picker"
                (not (Properties_dialog.is_open ()));
              defaults rest) 0)) 0)
    in
    let rec next = function
      | [] -> defaults [
          "checkbox",Some (Wire.Bool true),Wire.Bool true;
          "checkbox",Some (Wire.Bool false),Wire.Bool false;
          "checkbox",None,Wire.Bool false;
          "default",Some (Wire.Map [Wire.kw "block/title",Wire.String "Default text"]),Wire.String "Default text";
          "url",Some (Wire.Map [Wire.kw "block/title",Wire.String "https://example.com"]),Wire.String "https://example.com";
          "default",None,Wire.String ""]
      | value :: rest ->
          operations := [];
          Properties_dialog.open_at ~on_close:(fun () -> incr dismissed)
            ~remove:false ~phase:Properties_dialog.Prop_select
            (Properties_dialog.Anchor_rect (120.,80.,104.,32.)) target;
          Properties_dialog.property_chosen (Option.get !Properties_dialog.current) prop;
          S.flush picker;
          check "Choosing a batch checkbox property does not write a default"
            (!operations=[] && match !Properties_dialog.current with
             | Some {d_phase=Properties_dialog.Value_edit _;_} -> true | _ -> false);
          ignore (Js.Global.setTimeout ~f:(fun () ->
            S.flush picker;
            let popup=List.find (fun n -> n.M.kind="popover") (nodes picker) in
            check "Batch property pickers keep the toolbar trigger's virtual reference"
              (M.string_prop popup "anchor-rect"=Some "116. 80. 1. 32."
               && M.string_prop popup "anchor"=Some "below"
               && M.string_prop popup "anchor-alignment"=Some "start");
            check "Batch property pickers have one compact surface without a modal card"
              (not (List.exists (fun n -> n.M.kind="dialog" || n.M.kind="card") (nodes picker))
               && List.exists (fun n -> n.M.kind="text-field"
                    && Hashtbl.find_opt n.M.props "height"=Some (P.IntValue 32)) (nodes picker));
            let choices=List.filter (fun n -> n.M.kind="list-item") (nodes picker) in
            check "Batch checkbox properties offer both explicit boolean values" (List.length choices=2);
            let label=I18n.t (if value then "ui/true" else "ui/false") in
            let choice=List.find (fun n -> M.string_prop n "key"=Some label) choices in
            S.press picker choice.M.id;
            ignore (Js.Global.setTimeout ~f:(fun () ->
              check "A batch boolean choice writes exactly once to the complete selection"
                (match !operations with
                 | [Wire.Array [Wire.Keyword "batch-set-property";
                     Wire.Array [Wire.List [Wire.Uuid "batch-first";Wire.Uuid "batch-second"];
                       Wire.Keyword "fixture/batch-flag";Wire.Bool actual;_]]] -> actual=value
                 | _ -> false);
              check "A scalar batch choice closes its picker and restores the action bar once"
                (not (Properties_dialog.is_open ()) && !dismissed=(if value then 1 else 2));
              next rest) 0)) 0)
    in next [true;false]
  in
  let embedded_indent_check done_ =
    let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model
    and previous_send = !Runtime.app_send and previous_flush = !Runtime.app_flush
    and previous_page = !Runtime.current_page
    and previous_editor = !Editor_state.st and previous_fields = !Editor_state.field_sigs_opt
    and previous_settings = !Settings_state.st in
    Editor_state.st := None; Editor_state.field_sigs_opt := None; Settings_state.st := None;
    let entity id uuid title children =
      {(Test_check.block ~children uuid title) with Model.block_db_id = Some id} in
    let child = entity 214 "embed-child" "Child" [] in
    let root = entity 213 "embed-target" "Target" [child] in
    let link id uuid target = {(entity id uuid "" []) with Model.block_link = Some target} in
    let first = link 210 "first-link" 213 and second = link 211 "second-link" 213
    and page_link = link 212 "page-link" 207 in
    let between = entity 215 "between" "Between" [] in
    let page_root = {(entity 207 "linked-page" "Source" [root]) with Model.block_is_page = true} in
    let host = {(Test_check.page
      [{first with Model.block_embed_children = [root]}; between;
       {second with Model.block_embed_children = [root]};
       {page_link with Model.block_embed_children = [page_root]}]) with
        Model.page_uuid = Some "host-page"; page_db_id = Some 208} in
    let model = ref {Model.initial with repo = Some "embed-indent";
      route = Model.Page "host-page"; route_page = Some host} in
    let state = ref None and viewport = ref None in
    Runtime.read_model := (fun () -> !model);
    Runtime.current_page := Some host;
    let moved = ref false and restored = ref false and writes = ref 0 and rejected = ref false in
    let source_view = ref false and source_restored = ref false in
    let completed = ref 0 and failures = ref 0 in
    let observe_structure () =
      Option.iter (fun (_, completion) -> ignore (completion
        |> Js.Promise.then_ (fun () -> incr completed; Js.Promise.resolve ())
        |> Js.Promise.catch (fun _ -> incr failures; Js.Promise.resolve ())))
        !Editor_actions.structure_owner in
    let rec wire (block : Model.block) = Wire.Map
      ([Wire.kw "db/id", Wire.Int (Option.get block.block_db_id);
        Wire.kw "block/uuid", Wire.Uuid (Option.get block.block_uuid);
        Wire.kw "block/title", Wire.String block.block_title;
        Wire.kw "block/children", Wire.List (List.map wire block.block_children)]
       @ (if block.block_is_page then [Wire.kw "block/name", Wire.String "source"] else [])
       @ (match block.block_link with None -> [] | Some id ->
         [Wire.kw "block/link", Wire.Map [Wire.kw "db/id",Wire.Int id]])) in
    Runtime.worker := Some {Worker_client.invoke_fn = (fun name args ->
      if name = "thread-api/apply-outliner-ops" && !rejected then
        Js.Promise.make (fun ~resolve:_ ~reject -> reject (Failure "indent rejected") [@u])
      else Js.Promise.resolve (match name,args with
      | "thread-api/apply-outliner-ops", [_;Wire.Array operations;_] ->
          List.iter (function
            | Wire.Array [Wire.Keyword "indent-outdent-blocks";
                Wire.Array [Wire.List [Wire.Uuid owner]; Wire.Bool indent; opts]] ->
                incr writes;
                if owner = "page-link" && indent then moved := true
                else if owner = "page-link" && not indent && !source_view
                  && Wire.get opts "parent-original" = None then begin
                  moved := false; source_restored := true
                end
                else if owner = "page-link" && not indent
                  && Option.bind (Wire.get opts "parent-original")
                      (fun value -> Wire.map_get_uuid value "block/uuid") = Some "second-link" then begin
                  moved := false; restored := true
                end
            | _ -> ()) operations;
          Wire.Map [Wire.kw "result",Wire.Nil]
      | "thread-api/get-page-blocks-tree", _ ->
          let root = if !moved then {root with Model.block_children = page_link :: root.block_children} else root in
          let blocks = match List.nth_opt args 1 with
            | Some (Wire.Int 213) -> [root]
            | Some (Wire.Int 207) -> [{page_root with Model.block_children = [root]}]
            | _ when !source_view -> [root] @ if !moved then [] else [page_link]
            | _ -> [first;between;second] @ if !moved then [] else [page_link] in
          Wire.List (List.map wire blocks)
      | "thread-api/get-render-snapshots", [_;request] ->
          Wire.Map [Wire.kw "slots", Wire.Map (List.map (fun key ->
            Wire.Array [Wire.kw "resource";key], Wire.Map [Wire.kw "value",Wire.Int 2])
            (Wire.elems (Option.value (Wire.get request "resources") ~default:Wire.Nil)))]
      | "thread-api/get-file-content", _ -> Wire.String "{}"
      | _ -> Wire.Nil));
      on_message = (fun _ _ -> ()); dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
    let mounted = mount (fun _ context parent ->
      let source = Signal.state context.Lui_ui.ui_scheduler !model in
      state := Some source;
      viewport := Some (Outline_viewport_state.create context (Signal.value source));
      Lui_elements.column [] context parent) in
    Runtime.app_send := (fun action ->
      model := Update.update !model action;
      Option.iter (fun source -> Runtime.signal_set source !model) !state;
      true);
    let page_scope = Outliner_projection.embedded_scope ~scope:"main" page_link in
    Editor_state.set_collapsed "embed-target" true;
    Editor_actions.select_single_in ~scope:page_scope "linked-page";
    Editor_actions.indent_or_outdent ~indent:true;
    observe_structure ();
    check "Selection-only embedded indent does not wait for a nonexistent editor sink"
      (Editor_state.editing () = None && !Editor_state.pending_focus = None);
    check "Indenting an embedded root reveals only its target occurrence"
      (Editor_state.is_collapsed_in ~scope:(Outliner_projection.embedded_scope ~scope:"main" first) "embed-target"
       && not (Editor_state.is_collapsed_in ~scope:(Outliner_projection.embedded_scope ~scope:"main" second) "embed-target"));
    ignore (Js.Global.setTimeout ~f:(fun () ->
      S.flush mounted;
      check "Embedded-root Tab completes without a structural failure" (!completed = 1 && !failures = 0);
      let rows = Signal.get (Option.get !viewport).Outline_viewport_state.rows in
      check "Canonical embed relocation retains a visible selected root and live source scope"
        (!moved && Editor_state.is_selected "linked-page"
         && List.exists (function Outliner_projection.Block row ->
              row.block.Model.block_uuid = Some "linked-page"
              && row.scope = Editor_state.selection_scope () | _ -> false) rows);
      Editor_actions.indent_or_outdent ~indent:false;
      observe_structure ();
      ignore (Js.Global.setTimeout ~f:(fun () ->
        S.flush mounted;
        check "Outdenting the relocated embed moves its link back to the host container"
          (!restored && not !moved && Editor_state.is_selected "linked-page");
        check "Embedded-root Shift-Tab completes without a structural failure" (!completed = 2 && !failures = 0);
        check "Selection-only embedded outdent does not arm editor focus"
          (!Editor_state.pending_focus = None);
        Editor_state.set (fun st -> {st with selected = Editor_state.String_set.empty; anchor = None});
        let before = !writes in
        Editor_actions.indent_or_outdent ~indent:true;
        check "An empty embedded selection does not move a block" (!writes = before);
        check "An empty embedded selection does not arm editor focus"
          (!Editor_state.pending_focus = None);
        Editor_actions.select_single_in ~scope:page_scope "linked-page";
        rejected := true;
        Editor_actions.indent_or_outdent ~indent:true;
        check "A rejected selection-only move does not arm editor focus"
          (!Editor_state.pending_focus = None);
        ignore (Js.Global.setTimeout ~f:(fun () ->
          check "Rejected embedded moves retain selection ownership"
            (Editor_state.is_selected "linked-page" && not !moved);
          rejected := false; source_view := true; moved := true;
          Editor_state.set_collapsed "embed-target" false;
          let source_page = {host with Model.page_uuid = Some "linked-page";
            page_db_id = Some 207; page_blocks = [{root with Model.block_children = page_link :: root.block_children}]} in
          model := {!model with Model.route = Model.Page "source"; route_page = Some source_page};
          Runtime.current_page := Some source_page;
          Option.iter (fun source -> Runtime.signal_set source !model) !state;
          S.flush mounted;
          Editor_actions.select_single_in ~scope:page_scope "page-link";
          Editor_actions.indent_or_outdent ~indent:false;
          observe_structure ();
          ignore (Js.Global.setTimeout ~f:(fun () ->
          S.flush mounted;
          check "Source-view outdent follows its actual parent instead of returning to the host"
            (!source_restored && not !moved && Editor_state.is_selected "page-link"
             && !completed = 3 && !failures = 0);
          ignore (Lui_app.dispose mounted.S.app);
          Runtime.worker := previous_worker; Runtime.read_model := previous_model;
          Runtime.app_send := previous_send; Runtime.app_flush := previous_flush;
          Runtime.current_page := previous_page;
          Editor_state.st := previous_editor; Editor_state.field_sigs_opt := previous_fields;
          Settings_state.st := previous_settings;
          done_ ()) 20)) 20)) 20)) 20)
  in
  let ordinary_reference_count_check done_ =
    let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model
    and previous_flush = !Runtime.app_flush
    and previous_editor = !Editor_state.st and previous_fields = !Editor_state.field_sigs_opt
    and previous_settings = !Settings_state.st in
    Editor_state.st := None; Editor_state.field_sigs_opt := None; Settings_state.st := None;
    let block = {(Test_check.block "ordinary-reference-target" "Target") with Model.block_db_id=Some 201} in
    let page = Test_check.page [block] in
    let model = {Model.initial with repo=Some "ordinary-references";route_page=Some page} in
    Runtime.read_model := (fun () -> model);
    let count = ref 1 and failed = ref false in
    Runtime.worker := Some {Worker_client.invoke_fn=(fun name args ->
      if name="thread-api/get-render-snapshots" && !failed then
        Js.Promise.make (fun ~resolve:_ ~reject -> reject (Failure "reference count rejected") [@u])
      else Js.Promise.resolve (match name,args with
        | "thread-api/get-render-snapshots",[_;request] ->
            let resources=Option.value (Wire.get request "resources") ~default:Wire.Nil in
            Wire.Map [Wire.kw "slots",Wire.Map (List.map (fun key ->
              let value=match Wire.elems key with
                | [Wire.Keyword "block-ref-count";_] -> Wire.Int !count
                | _ -> Wire.Array [] in
              Wire.Array [Wire.kw "resource";key],Wire.Map [Wire.kw "value",value]) (Wire.elems resources))]
        | "thread-api/get-file-content", _ -> Wire.String "{}"
        | _ -> Wire.Nil));on_message=(fun _ _ -> ());
      dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
    let mounted=mount (fun _ context parent ->
      let ms=Signal.constant context.Lui_ui.ui_scheduler model in
      let state=Outline_viewport_state.ensure context ms in
      let section : Outliner_projection.section = {section_key="ordinary";repository=model.repo;
        scope="main";page;is_last=true} in
      let source=Signal.constant context.ui_scheduler (Outliner_projection.Block
        {block;scope="main";section;depth=0;ancestors=[]}) in
      Flat_outliner.block_row ~state ~library:false ~source context parent) in
    let visible () = S.flush mounted;
      List.exists (fun node -> class_has node "block-refs-count") (nodes mounted) in
    let changed () = Subs_state.run_sync_subs [Wire.Array [Wire.kw "refs";Wire.Uuid "ordinary-reference-target"]] in
    ignore (Js.Global.setTimeout ~f:(fun () ->
      check "Ordinary rows expose their incoming reference count" (visible ());
      let counter = List.find (fun node -> class_has node "block-refs-count") (nodes mounted) in
      let references_visible () = List.exists (fun node ->
        Hashtbl.find_opt node.M.props "margin-left"=Some (P.IntValue 42)
        && Hashtbl.find_opt node.M.props "padding-horizontal"=Some (P.IntValue 16)
        && Hashtbl.find_opt node.M.props "border-width"=Some (P.IntValue 1)) (nodes mounted) in
      List.iter (fun expected ->
        S.dispatch mounted (P.PressDetail (counter.M.id,
          {x=0.;y=0.;modifiers=0;button=0;target_class=""}));
        S.press mounted counter.M.id;
        S.flush mounted;
        check "Ordinary count-one clicks expand and re-collapse inline references exactly once"
          (references_visible ()=expected)) [true;false];
      failed:=true;changed ();
      ignore (Js.Global.setTimeout ~f:(fun () ->
        check "A rejected reference-count refresh retains the last successful count" (visible ());
        failed:=false;count:=0;changed ();
        ignore (Js.Global.setTimeout ~f:(fun () ->
          check "Removing the final incoming reference hides its count" (not (visible ()));
          ignore (Lui_app.dispose mounted.S.app);
          Runtime.worker:=previous_worker;Runtime.read_model:=previous_model;Runtime.app_flush:=previous_flush;
          Editor_state.st := previous_editor; Editor_state.field_sigs_opt := previous_fields;
          Settings_state.st := previous_settings;
          done_ ()) 0)) 0)) 0)
  in
  let optimistic_reactions_check done_ =
    let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model
    and previous_flush = !Runtime.app_flush
    and previous_editor = !Editor_state.st and previous_fields = !Editor_state.field_sigs_opt
    and previous_settings = !Settings_state.st in
    Editor_state.st := None; Editor_state.field_sigs_opt := None; Settings_state.st := None;
    Runtime.read_model := (fun () -> {Model.initial with repo = Some "optimistic-reactions"});
    let persisted = ref false and premature = ref false and source = ref None in
    Runtime.worker := Some {
      Worker_client.invoke_fn = (fun name args -> Js.Promise.resolve (match name,args with
        | "thread-api/get-render-snapshots", [_;request] ->
            let resources = Option.value (Wire.get request "resources") ~default:Wire.Nil in
            Wire.Map [Wire.kw "slots", Wire.Map (List.filter_map (fun key ->
              match Wire.elems key with
              | Wire.Keyword "block-reactions" :: Wire.Uuid "optimistic-target" :: _ ->
                  if not !persisted then premature := true;
                  let value = if not !persisted then Wire.Map [] else Wire.Array [Wire.Map
                    [Wire.kw "emoji-id", Wire.String "grinning"; Wire.kw "count", Wire.Int 1;
                     Wire.kw "reacted-by-me?", Wire.Bool false; Wire.kw "usernames", Wire.Nil]] in
                  Some (Wire.Array [Wire.kw "resource";key], Wire.Map [Wire.kw "value",value])
              | _ -> None) (Wire.elems resources))]
        | _ -> Wire.Nil));
      on_message = (fun _ _ -> ()); dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
    let block = Test_check.block "optimistic-target" "new block" in
    let mounted = mount (fun _ context parent ->
      let state = Signal.state context.Lui_ui.ui_scheduler block in
      source := Some state;
      Tree.block_row_sig ~scope:"optimistic-reactions" ~editable:false
        (Signal.value state) context parent) in
    ignore (Js.Global.setTimeout ~f:(fun () ->
      check "Optimistic rows do not read reactions before their worker entity exists" (not !premature);
      persisted := true;
      Runtime.signal_set (Option.get !source) {block with Model.block_db_id = Some 101};
      S.flush mounted;
      ignore (Js.Global.setTimeout ~f:(fun () ->
        S.flush mounted;
        check "Canonical new rows load reactions after insertion is acknowledged"
          (List.exists (fun node -> button_label node = Some "grinning 1") (nodes mounted));
        ignore (Lui_app.dispose mounted.S.app);
        Runtime.worker := previous_worker;
        Runtime.read_model := previous_model;
        Runtime.app_flush := previous_flush;
        Editor_state.st := previous_editor; Editor_state.field_sigs_opt := previous_fields;
        Settings_state.st := previous_settings;
        done_ ()) 0)) 0)
  in
  let reaction_refresh_check done_ =
    let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model
    and previous_flush = !Runtime.app_flush in
    Runtime.read_model := (fun () -> { Model.initial with repo = Some "reaction-refresh" });
    let count = ref 0 and failed = ref false in
    Runtime.worker := Some {
      Worker_client.invoke_fn = (fun name args ->
        if name = "thread-api/get-render-snapshots" && !failed then
          Js.Promise.make (fun ~resolve:_ ~reject -> reject (Failure "reaction read failed") [@u])
        else Js.Promise.resolve (match name, args with
          | "thread-api/get-render-snapshots", [_; request] ->
              let resources = Option.value (Wire.get request "resources") ~default:Wire.Nil in
              Wire.Map [ Wire.kw "slots", Wire.Map (List.map (fun key ->
                let value = if !count = 0 then Wire.Array [] else Wire.Array [Wire.Map
                  [ Wire.kw "emoji-id", Wire.String "grinning";
                    Wire.kw "count", Wire.Int !count;
                    Wire.kw "reacted-by-me?", Wire.Bool true;
                    Wire.kw "usernames", Wire.Nil ]] in
                Wire.Array [Wire.kw "resource"; key], Wire.Map [Wire.kw "value", value])
                (Wire.elems resources)) ]
          | "thread-api/apply-outliner-ops", _ ->
              count := 1;
              Wire.Map [Wire.kw "result", Wire.Nil]
          | _ -> Wire.Nil));
      on_message = (fun _ _ -> ()); dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) };
    let mounted = mount (fun _ -> Comments_view.reactions_el "reaction-target") in
    let has_count n = S.flush mounted;
      List.exists (fun node -> button_label node = Some ("grinning " ^ string_of_int n)) (nodes mounted) in
    let changed () = Subs_state.run_sync_subs
      [Wire.Array [Wire.kw "reactions"; Wire.Uuid "reaction-target"]] in
    ignore (Js.Global.setTimeout ~f:(fun () ->
      check "A block without reactions has no reaction badge" (not (has_count 1));
      Comments_view.toggle_reaction "reaction-target" "grinning";
      ignore (Js.Global.setTimeout ~f:(fun () ->
        check "A local reaction appears without navigating away" (has_count 1);
        failed := true;
        changed ();
        ignore (Js.Global.setTimeout ~f:(fun () ->
          check "A failed reaction refresh retains the successful badge" (has_count 1);
          failed := false;
          count := 0;
          changed ();
          ignore (Js.Global.setTimeout ~f:(fun () ->
            check "A remote reaction removal clears the badge without navigation" (not (has_count 1));
            ignore (Lui_app.dispose mounted.S.app);
            Runtime.worker := previous_worker;
            Runtime.read_model := previous_model;
            Runtime.app_flush := previous_flush;
            done_ ()) 0)) 0)) 0)) 0)
  in
  let graph_delete_check done_ =
    let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model
    and previous_send = !Runtime.app_send and previous_changed = !Graphs_ops.on_repos_changed
    and metadata = Graphs_meta.read () in
    let first = "logseq_db_Delete fixture" and last = "logseq_db_Last fixture" in
    let state = ref { Model.initial with repos = [first;last] } in
    let mode = ref `Pending and requests = ref [] and unlink_done = ref None in
    Runtime.read_model := (fun () -> !state);
    Runtime.app_send := (fun action -> state := Update.update !state action; true);
    Graphs_ops.on_repos_changed := (fun () -> ());
    List.iter (fun repo -> Graphs_meta.remember_uuid repo repo) [first;last];
    Runtime.worker := Some { Worker_client.invoke_fn = (fun name args ->
      requests := (name,args) :: !requests;
      match !mode with
      | `Pending -> Js.Promise.make (fun ~resolve ~reject:_ -> unlink_done := Some resolve)
      | `Success -> Js.Promise.resolve Wire.Nil
      | `Error -> Js.Promise.resolve (Wire.Tagged ("error", Wire.String "locked"))
      | `Reject -> Js.Promise.make (fun ~resolve:_ ~reject -> reject (Failure "locked") [@u]));
      on_message = (fun _ _ -> ()); dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) };
    let success_text name =
      List.exists (fun (toast : Model.toast) -> toast.toast_text = I18n.removed name) (!state).toasts in
    let open Promise_ext in
    ignore (
      let deletion = Graphs_ops.delete_graph first ~remote:false in
      let* () = Js.Promise.resolve () in
      check "Pending graph deletion retains its row and metadata until storage completes"
        (!requests = ["thread-api/unsafe-unlink-db",[Wire.String first]]
         && (!state).repos = [first;last] && Graphs_meta.uuid_of first = Some first
         && (!state).toasts = []);
      (Option.get !unlink_done) Wire.Nil [@u];
      let* () = deletion in
      check "Graph deletion sends the internal repo to storage but displays its name"
        (!requests = ["thread-api/unsafe-unlink-db",[Wire.String first]]
         && (!state).repos = [last] && success_text "Delete fixture"
         && Graphs_meta.uuid_of first = None);
      let rec failures = function
        | [] -> Js.Promise.resolve ()
        | failure :: rest ->
            mode := failure;
            state := { !state with toasts = [] };
            let* () = Graphs_ops.delete_graph last ~remote:false in
            check "Failed graph deletion restores membership and retains metadata without a success toast"
              ((!state).repos = [last] && Graphs_meta.uuid_of last = Some last
               && (!state).toasts = []);
            failures rest
      in
      let* () = failures [`Error;`Reject] in
      mode := `Success;
      let* () = Graphs_ops.delete_graph last ~remote:false in
      check "Deleting the final listed graph leaves an empty list and uses its display name"
        ((!state).repos = [] && success_text "Last fixture" && Graphs_meta.uuid_of last = None);
      Runtime.worker := previous_worker;
      Runtime.read_model := previous_model;
      Runtime.app_send := previous_send;
      Graphs_ops.on_repos_changed := previous_changed;
      Graphs_meta.write metadata;
      done_ ();
      Js.Promise.resolve ())
  in
  let missing_reference_view_check done_ =
    let previous_worker= !Runtime.worker and previous_model= !Runtime.read_model
    and previous_flush= !Runtime.app_flush in
    Runtime.read_model:=(fun () -> {Model.initial with repo=Some "missing-reference-view"});
    let rec next = function
      | [] -> Runtime.worker:=previous_worker;Runtime.read_model:=previous_model;
          Runtime.app_flush:=previous_flush;done_ ()
      | count::rest ->
          let stored=ref None and source_op=ref None and history_source=ref None in
          ignore (Fake_worker.install (fun name args -> match name,args with
            | "thread-api/get-render-snapshots",[_;request] ->
                let resources=Option.value (Wire.get request "resources") ~default:Wire.Nil in
                Wire.Map [Wire.kw "slots",Wire.Map (List.map (fun key ->
                  let value=match key with
                    | Wire.Array [Wire.Keyword "block-ref-count";_] ->
                        (match count with Some n -> Wire.Int n | None -> Wire.Nil)
                    | Wire.Array [Wire.Keyword "page-identity";_] -> Wire.Uuid "views-page"
                    | Wire.Array [Wire.Keyword "views";_;_] ->
                        Wire.Array (match !stored with None -> [] | Some block ->
                          [Option.get (Wire.get block "block/uuid")])
                    | Wire.Array (Wire.Keyword "view-data"::_) -> Wire.Map
                        [Wire.kw "count",Wire.Int 0;Wire.kw "partition",Wire.kw "grouped";
                         Wire.kw "groups",Wire.Array []]
                    | _ -> Wire.Nil in
                  Wire.Array [Wire.kw "resource";key],Wire.Map [Wire.kw "value",value])
                  (Wire.elems resources))]
            | "thread-api/get-blocks",[_;Wire.Array requests] ->
                Wire.Array (List.map (fun request ->
                  let id=Option.get (Wire.get request "id") in
                  let block=if id=Wire.Uuid "views-page" then
                      Wire.Map [Wire.kw "block/uuid",id;Wire.kw "block/children",Wire.Array []]
                    else Option.value !stored ~default:Wire.Nil in
                  Wire.Map [Wire.kw "id",id;Wire.kw "block",block]) requests)
            | "thread-api/apply-outliner-ops",[_;Wire.Array ops;tx_opts] ->
                history_source:=Wire.get tx_opts "source-outliner-op";
                List.iter (function
                  | Wire.Array [Wire.Keyword "insert-blocks";
                      Wire.Array [Wire.List [block];_;opts]] ->
                      stored:=Some block;source_op:=Wire.get opts "outliner-op"
                  | _ -> ()) ops;
                Wire.Map [Wire.kw "result",Wire.Nil]
            | _ -> Wire.Nil));
          let instance=ref None in
          let mounted=mount (fun _ context parent ->
            instance:=Some (Views_state.make ~sched:context.Lui_ui.ui_scheduler
              ~kind:Views_state.KLinkedRefs ~feature:"linked-references" ~owner:(Wire.Uuid "owner"));
            Lui_elements.column [] context parent) in
          let inst=Option.get !instance in
          Views_view.ensure_default_view inst;
          ignore (Js.Global.setTimeout ~f:(fun () ->
            let state=Views_state.get inst in
            check "Missing linked-reference views are created only after a positive count, never on failure"
              (match count with
               | Some 0 -> !stored=None && not state.loading && state.view_error=None
                   && state.data=Views_wire.VGroupedList []
               | Some _ -> Option.is_some !stored && !source_op=Some (Wire.kw "create-view")
                   && state.views<>[] && state.view_error=None
               | None -> !stored=None && Option.is_some state.view_error);
            check "Automatic reference views carry the worker's non-undoable source marker"
              (!history_source=(if !stored=None then None else Some (Wire.kw "create-view")));
            ignore (Lui_app.dispose mounted.S.app);next rest) 0)
    in next [Some 0;Some 1;None]
  in
  let node_picker_lifetime_check done_ =
    let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model
    and previous_overlays = !Properties_state.view_overlays_state
    and previous_flush = !Runtime.app_flush in
    Runtime.read_model := (fun () -> {Model.initial with repo=Some "node-lifetime-fixture"});
    let entity id title = Wire.Map [Wire.kw "db/id",Wire.Int id;
      Wire.kw "block/uuid",Wire.Uuid ("node-" ^ string_of_int id);
      Wire.kw "block/title",Wire.String title] in
    let page = Wire.Map [Wire.kw "db/id",Wire.Int 4;
      Wire.kw "db/ident",Wire.kw "logseq.class/Page";Wire.kw "block/title",Wire.String "Page"] in
    let audit = entity 80 "Audit Target" and card = entity 81 "Card" in
    let rec next = function
      | [] ->
          Runtime.worker:=previous_worker;Runtime.read_model:=previous_model;
          Properties_state.view_overlays_state:=previous_overlays;
          Runtime.app_flush:=previous_flush;done_ ()
      | (table_view, ident, metadata, initial, closes)::rest ->
          Properties_state.view_overlays_state:=None;
          let chosen = ref initial and created = ref [] in
          let prop = Wire.Map [Wire.kw "db/id",Wire.Int 100;
            Wire.kw "db/ident",Wire.kw ident;
            Wire.kw "logseq.property/type",Wire.kw (if ident="block/tags" then "class" else if ident="block/alias" then "page" else "node");
            Wire.kw "db/cardinality",Wire.kw "db.cardinality/many"] in
          ignore (Fake_worker.install (fun name args -> match name with
            | "thread-api/entity" ->
                (match List.nth_opt args 1 with
                 | Some (Wire.List [Wire.Keyword "db/ident";Wire.Keyword "block/tags"]) -> prop
                 | _ -> Wire.Map [Wire.kw ident,Wire.Set (List.map (fun id -> Wire.Int id) !chosen)])
            | "thread-api/get-property-node-selector-data" -> Wire.Map
                [Wire.kw "all-classes",Wire.Array [page;audit;card];
                 Wire.kw "initial-choices",Wire.Array [page;audit;card];
                 Wire.kw "class-options",Wire.Array [audit;card]]
            | "thread-api/get-case-page" -> entity 82 "New Alias"
            | "thread-api/apply-outliner-ops" ->
                (match List.nth_opt args 1 with
                 | Some (Wire.Array ops) -> List.iter (function
                     | Wire.Array [Wire.Keyword "create-page";Wire.Array [Wire.String title;opts]] ->
                         created := [title];
                         check "New aliases create ordinary pages rather than classes"
                           (Wire.get opts "class?"=Some (Wire.Bool false))
                     | Wire.Array [Wire.Keyword "batch-set-property";
                         Wire.Array [Wire.List [Wire.Uuid "node-owner"];Wire.Keyword key;Wire.Int id;
                           Wire.Map [(Wire.Keyword "entity-id?",Wire.Bool true)]]] when key=ident ->
                         chosen:=id::List.filter ((<>) id) !chosen
                     | Wire.Array [Wire.Keyword "delete-property-value";
                         Wire.Array [_;Wire.Keyword key;Wire.Int id]] when key=ident ->
                         chosen:=List.filter ((<>) id) !chosen
                     | Wire.Array [Wire.Keyword "batch-set-property";
                         Wire.Array [Wire.List [Wire.Uuid "node-owner"];Wire.Keyword "block/alias";
                           Wire.Int id;Wire.Map []]] when ident="block/alias" -> chosen:=[id]
                     | _ -> ()) ops
                 | _ -> ());
                Wire.Map [Wire.kw "result",if !created=[] then Wire.Nil
                  else Wire.Array [Wire.Nil;Wire.Uuid "node-82"]]
            | _ -> Wire.Nil));
          let ctx : Properties_value.ctx = {owner_key="node-lifetime";block_uuid="node-owner";
            jump_owner=Jump_state.owner ~scope:"main" ~container:"node-owner";
            block_id=Some 196;refresh=ignore;is_page=false;class_schema=false} in
          let values = Wire.Array (List.filter (fun entity ->
            List.mem (Option.get (Properties_data.entity_id_of entity)) initial) [page;audit;card]) in
          let row = Wire.Map [Wire.kw "property-id",Wire.kw ident;
            Wire.kw "value",values;Wire.kw "property",prop] in
          let owner = ref ctx.owner_key in
          let picker = mount (fun _ context parent ->
            let cell = if not table_view then
              Properties_value.node_view ~jump_target:false ctx row
            else
              let inst=Views_state.make ~sched:context.Lui_ui.ui_scheduler
                ~kind:Views_state.KAllPages ~feature:"node-lifetime-fixture" ~owner:Wire.Nil in
              owner:="view-" ^ string_of_int inst.Views_state.id;
              let column={(Views_table.tags_column ()) with Views_state.c_id=ident;
                c_prop=(if metadata then Some prop else None)} in
              let blk=Wire.Map [Wire.kw ident,values] in
              Views_table.cell_el inst ~row_uuid:ctx.block_uuid ~blk column in
            Lui_elements.column [cell;Properties_view.overlays] context parent) in
          if table_view && ident="block/tags" then
            check "Table Tags hide the implicit Page chip without changing stored references"
              (not (List.exists (fun n -> List.mem (button_label n) [Some "Page";Some "#Page"])
                (nodes picker)) && !chosen=initial);
          let id = "property-node-" ^ !owner ^ "-node-owner-" ^ ident in
          let control_id=id ^ "-picker" in
          let trigger = List.find_opt (fun n -> M.string_prop n "accessibility-identifier"=Some control_id)
            (nodes picker) in
          match trigger with
          | None ->
              check "Populated table node cells expose an editable picker" false;
              ignore (Lui_app.dispose picker.S.app);next rest
          | Some trigger ->
          if List.mem 81 initial then begin
            let chip=List.find (fun n -> (n.M.kind="button" || n.M.kind="link")
              && List.mem (button_label n) [Some "Card";Some "#Card"]) (nodes picker) in
            let actions=ref [] and previous_send= !Runtime.app_send in
            Runtime.app_send:=(fun action -> actions:=action::!actions;true);
            S.press picker chip.M.id;
            Runtime.app_send:=previous_send;
            check "A populated table node chip navigates without editing or opening a picker"
              (!actions=[Action.Navigate_to (Model.Page "node-81")]
               && !chosen=initial && not (Properties_state.view_overlay_open ()))
          end;
          let document = !(Stub_dom.document_ref) in
          let lookup : string -> Js.Json.t = Stub_dom.get_field document "getElementById" in
          let anchor = Stub_dom.make_element "button" in
          let set : string -> string -> unit = Stub_dom.get_field anchor "setAttribute" in
          set "id" id;
          Stub_dom.set_field document "getElementById" (fun key -> if key=id then anchor else lookup key);
          S.press picker trigger.M.id;
          Stub_dom.set_field document "getElementById" lookup;
          let toggle title checked =
            let option = List.find (fun n -> n.M.kind="checkbox"
              && M.string_prop n "accessibility-label"=Some title) (nodes picker) in
            S.toggle picker option.M.id checked in
          ignore (Js.Global.setTimeout ~f:(fun () ->
            if ident="block/alias" then begin
              let input=List.find (fun n -> n.M.kind="text-field") (nodes picker) in
              S.text_changed picker input.M.id "New Alias";
              check "Alias search exposes a new option for a missing page"
                (List.exists (fun n -> M.string_prop n "accessibility-label"=
                  Some (I18n.t1 "select/new-option" "New Alias")) (nodes picker));
              S.submit picker input.M.id;
              ignore (Js.Global.setTimeout ~f:(fun () ->
                check "Choosing a new alias creates its page and stores its entity reference"
                  (!created=["New Alias"] && !chosen=[82]);
                Properties_state.close_all_view_overlays ();
                ignore (Lui_app.dispose picker.S.app);
                let previous_dialog = !Properties_dialog.current in
                let d : Properties_dialog.dlg_state =
                  {d_target={uuid="node-owner";uuids=[];db_id=Some 79;is_tag=false;title=""};
                   d_remove=false;d_placement=Properties_dialog.Centered;
                   d_phase=Properties_dialog.Value_edit prop;d_phase_sig=None} in
                chosen:=[];created:=[];
                Properties_dialog.current:=Some d;
                let dialog=mount (fun _ -> Properties_dialog.value_edit_view d prop) in
                ignore (Js.Global.setTimeout ~f:(fun () ->
                  let input=List.find (fun n -> n.M.kind="text-field") (nodes dialog) in
                  S.text_changed dialog input.M.id "Dialog Alias";
                  S.submit dialog input.M.id;
                  ignore (Js.Global.setTimeout ~f:(fun () ->
                    check "The Set property Alias picker also creates and stores a new page"
                      (!created=["Dialog Alias"] && !chosen=[82]);
                    ignore (Lui_app.dispose dialog.S.app);
                    Properties_dialog.current:=previous_dialog;
                    next rest) 0)) 0)) 0)
            end else begin
            check "Reopening a table node picker preserves and checks its existing values"
              (!chosen=initial && List.for_all (fun (title,id) ->
                List.exists (fun n -> n.M.kind="checkbox"
                  && M.string_prop n "accessibility-label"=Some title
                  && Hashtbl.find_opt n.M.props "checked"=Some (P.BoolValue (List.mem id initial)))
                  (nodes picker)) ["Page",4;"Card",81]);
            toggle "Audit Target" true;
            ignore (Js.Global.setTimeout ~f:(fun () ->
              check "A many-node add updates values and retains its popup"
                (List.sort compare !chosen=List.sort compare (80::initial)
                 && Properties_state.view_overlay_open ());
              toggle "Audit Target" false;
              ignore (Js.Global.setTimeout ~f:(fun () ->
                check "Table removal dismissal uses the opening raw value count, not the live count"
                  (List.sort compare !chosen=List.sort compare initial
                   && Properties_state.view_overlay_open ()=not closes);
                let finish () =
                  Properties_state.close_all_view_overlays ();
                  ignore (Lui_app.dispose picker.S.app);next rest in
                if table_view && initial=[4;81] then begin
                  toggle "Card" false;
                  ignore (Js.Global.setTimeout ~f:(fun () ->
                    check "An initially plural table value does not close merely because its last visible tag is removed"
                      (!chosen=[4] && Properties_state.view_overlay_open ());
                    finish ()) 0)
                end else finish ()) 0)) 0) end) 0)
    in
    next [true,"block/tags",false,[4],true;true,"block/tags",false,[],true;
      true,"block/tags",false,[4;81],false;false,"block/tags",false,[4],false;
      true,"block/tags",true,[4;81],false;true,"fixture/nodes",true,[4;81],false;
      false,"fixture/nodes",true,[4;81],false;false,"fixture/nodes",true,[],false;
      false,"block/alias",true,[],false]
  in
  let property_picker_check done_ =
    let items =
      List.map
        (fun (key, title) -> Properties_select.item ~key title (fun () -> ()))
        [ "entity-83", "Gamma"; "entity-81", "Alpha"; "entity-82", "Beta" ]
    in
    let visible ?(filter = "") ?(selected_keys = []) () =
      Properties_select.visible_items_with_selection ~multiple_choices:true ~selected_keys
        ~items ~filter ~searched:None ~new_option:None ~new_case_sensitive:false ()
    in
    let item_keys items = List.filter_map (fun item -> item.Properties_select.it_key) items in
    let initial = visible () in
    check "Selecting a many-value option does not reorder the unfiltered choices"
      (item_keys initial = item_keys (visible ~selected_keys:[ "entity-81" ] ()));
    let searched = visible ~filter:"a" () in
    let selected_searched = visible ~filter:"a" ~selected_keys:[ "entity-81" ] () in
    let selected, unselected =
      List.partition
        (fun item -> item.Properties_select.it_key = Some "entity-81") searched
    in
    check "A selected matching many-value choice leads the fuzzy results"
      (item_keys selected_searched = item_keys (selected @ unselected));
    let toggle_count = ref 0 and selected_signal = ref None in
    let previous_flush = !Runtime.app_flush in
    let selector = mount (fun _ context parent ->
      let selected = Signal.state context.Lui_ui.ui_scheduler [] in
      selected_signal := Some selected;
      let choose () =
        incr toggle_count;
        let current = Runtime.signal_get selected in
        Runtime.signal_set selected
          (if List.mem "entity-91" current then [] else ["entity-91"])
      in
      Properties_select.view ~placeholder:"Search" ~multiple_choices:true
        ~clear_input_on_choice:true
        ~selected_keys:(Signal.value selected)
        [Properties_select.item ~key:"entity-91" "Alpha" choose]
        context parent)
    in
    let input () = List.find (fun node -> node.M.kind = "text-field") (nodes selector) in
    let original_input = (input ()).M.id in
    S.text_changed selector original_input "a";
    S.flush selector;
    let option () = List.find_opt (fun node -> node.M.kind = "checkbox"
      && M.string_prop node "accessibility-label" = Some "Alpha") (nodes selector) in
    let checked = function
      | Some node -> Hashtbl.find_opt node.M.props "checked" = Some (P.BoolValue true)
      | None -> false
    in
    let selected () = Runtime.signal_get (Option.get !selected_signal) in
    check "A many-value property option has reactive checkbox semantics"
      (Option.is_some (option ()) && not (checked (option ())));
    Option.iter (fun node -> S.toggle selector node.M.id true)
      (option ());
    S.flush selector;
    check "A checkbox selection toggles once and clears the search query"
      (!toggle_count = 1 && selected () = ["entity-91"]
       && (input ()).M.id = original_input
       && M.string_prop (input ()) "text" = Some ""
       && checked (option ()));
    S.submit selector original_input;
    S.flush selector;
    check "Enter toggles the active many-value choice once and clears search"
      (!toggle_count = 2 && selected () = []
       && (input ()).M.id = original_input
       && M.string_prop (input ()) "text" = Some ""
       && not (checked (option ())));
    ignore (Lui_app.dispose selector.S.app);
    Runtime.app_flush := previous_flush;
    List.iter (fun (presentation, multiple_choices, query, index, enter) ->
      let chosen = ref [] in
      let selector = mount (fun _ -> Properties_select.view ~placeholder:"Search"
        ~presentation ~multiple_choices ~clear_input_on_choice:true
        (List.map (fun (key, title) -> Properties_select.item ~key title
          (fun () -> chosen:=key::!chosen))
          ["page","Page";"audit","Audit Target";"card","Card"])) in
      let input () = List.find (fun n -> n.M.kind="text-field") (nodes selector) in
      let original_input = (input ()).M.id in
      S.text_changed selector original_input query;
      for _ = 1 to index do
        S.dispatch selector (P.NavigateNext original_input)
      done;
      let list = List.find (fun n -> n.M.kind="list") (nodes selector) in
      let picked = Option.get (M.string_prop list "scroll-target") in
      let title = List.assoc picked ["page","Page";"audit","Audit Target";"card","Card"] in
      let option = List.find (fun n ->
        n.M.kind=(if multiple_choices then "checkbox" else "list-item")
        && M.string_prop n "text"=Some title) (nodes selector) in
      S.dispatch selector (P.PointerEnter option.M.id);
      if enter then S.submit selector original_input
      else if multiple_choices then S.toggle selector option.M.id true
      else S.press selector option.M.id;
      let expected = if presentation=Properties_select.Node_picker && multiple_choices
        then List.nth ["page";"audit";"card"] index else "page" in
      let list = List.find (fun n -> n.M.kind="list") (nodes selector) in
      check "Choice clears the query while only many-node pickers retain the numeric active index"
        (!chosen=[picked] && (input ()).M.id=original_input
         && M.string_prop (input ()) "text"=Some ""
         && M.string_prop list "scroll-target"=Some expected);
      S.submit selector original_input;
      check "Repeated Enter chooses the active index in the restored unfiltered results"
        (!chosen=[expected;picked]);
      ignore (Lui_app.dispose selector.S.app))
      [Properties_select.Node_picker,true,"",1,false;
       Properties_select.Node_picker,true,"",1,true;
       Properties_select.Node_picker,true,"Audit",0,false;
       Properties_select.Node_picker,true,"Audit",0,true;
       Properties_select.Node_picker,true,"a",1,false;
       Properties_select.Node_picker,true,"a",1,true;
       Properties_select.Standard,true,"",1,false;
       Properties_select.Standard,true,"",1,true;
       Properties_select.Node_picker,false,"",1,false;
       Properties_select.Node_picker,false,"",1,true];
    let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model in
    let previous_dialog = !Properties_dialog.current in
    let previous_dialog_sig = !Properties_dialog.current_sig in
    let previous_overlays = !Properties_state.view_overlays_state in
    Runtime.read_model := (fun () -> {Model.initial with repo=Some "property-picker-fixture"});
    let rec next = function
      | [] ->
          Properties_dialog.current := previous_dialog;
          Properties_dialog.current_sig := previous_dialog_sig;
          Properties_state.view_overlays_state := previous_overlays;
          Runtime.worker := previous_worker;
          Runtime.read_model := previous_model;
          done_ ()
      | (ty, many, closed, in_panel) :: rest ->
          let ident = "fixture/" ^ ty in
          let chosen = ref [80] in
          let choice id title = Wire.Map [Wire.kw "db/id",Wire.Int id;
            Wire.kw "block/uuid",Wire.Uuid ("value-" ^ string_of_int id);
            Wire.kw "block/title",Wire.String title] in
          let first = choice 80 "First" and second = choice 81 "Second" in
          ignore (Fake_worker.install (fun name args -> match name with
            | "thread-api/get-property-values" -> Wire.Array (List.map (fun value ->
                Wire.Map [Wire.kw "value",value; Wire.kw "label",Wire.String (Properties_data.ref_title value)])
                [first;second])
            | "thread-api/entity" -> Wire.Map [Wire.kw ident,Wire.Set (List.map (fun id -> Wire.Int id) !chosen)]
            | "thread-api/apply-outliner-ops" ->
                (match List.nth_opt args 1 with
                 | Some (Wire.Array ops) -> List.iter (function
                     | Wire.Array [Wire.Keyword "batch-set-property";
                         Wire.Array [_;Wire.Keyword key;Wire.Int id;_]]
                     | Wire.Array [Wire.Keyword "set-block-property";
                         Wire.Array [_;Wire.Keyword key;Wire.Int id]] when key=ident ->
                         chosen := if many && ty="number" && id=23 then 82 :: !chosen
                           else if many then id :: List.filter ((<>) id) !chosen else [id]
                     | Wire.Array [Wire.Keyword "delete-property-value";
                         Wire.Array [_;Wire.Keyword key;Wire.Int id]] when key=ident ->
                         chosen := List.filter ((<>) id) !chosen
                     | Wire.Array [Wire.Keyword "batch-set-property";
                         Wire.Array [_;Wire.Keyword key;Wire.Float _;_]] when key=ident -> chosen := 82 :: !chosen
                     | _ -> ()) ops
                 | _ -> ());
                Wire.Map [Wire.kw "result",Wire.Nil]
            | _ -> Wire.Nil));
          let prop = Wire.Map [Wire.kw "db/ident",Wire.kw ident;
            Wire.kw "block/title",Wire.String ty;
            Wire.kw "logseq.property/type",Wire.kw ty;
            Wire.kw "db/cardinality",Wire.kw (if many then "db.cardinality/many" else "db.cardinality/one");
            Wire.kw "property/closed-values",Wire.Array (if closed then [first;second] else [])] in
          let d : Properties_dialog.dlg_state =
            {d_target={uuid="property-owner";uuids=[];db_id=Some 79;is_tag=false;title=""};
             d_remove=false;d_placement=Properties_dialog.Centered;
             d_phase=Properties_dialog.Value_edit prop;d_phase_sig=None} in
          Properties_dialog.current := (if in_panel then None else Some d);
          if in_panel then (Properties_state.view_overlays_state := None;Properties_dialog.current_sig := None);
          let picker = mount (fun _ context parent ->
            let open Lui_elements in
            if not in_panel then Properties_dialog.value_edit_view d prop context parent else
            let ctx : Properties_value.ctx = {owner_key="property-picker";block_uuid="property-owner";
              jump_owner=Jump_state.owner ~scope:"main" ~container:"property-owner";
              block_id=Some 79;refresh=(fun () -> ());is_page=false;class_schema=false} in
            let row = Wire.Map [Wire.kw "property-id",Wire.kw ident;Wire.kw "property",prop;
              Wire.kw "value",Wire.Set [first]] in
            let view = column [Properties_value.view ~hover:None ctx row;Properties_view.overlays] in
            view context parent) in
          if in_panel then begin
            let trigger = List.find (fun n -> n.M.kind="button") (nodes picker) in
            let document = !(Stub_dom.document_ref) in
            let lookup : string -> Js.Json.t = Stub_dom.get_field document "getElementById" in
            let anchor = Stub_dom.make_element "button" in
            let id = "property-number-property-picker-property-owner-" ^ ident in
            let set : string -> string -> unit = Stub_dom.get_field anchor "setAttribute" in
            set "id" id;
            Stub_dom.set_field document "getElementById" (fun key -> if key=id then anchor else lookup key);
            S.press picker trigger.M.id;
            Stub_dom.set_field document "getElementById" lookup
          end;
          ignore (Js.Global.setTimeout ~f:(fun () ->
            let input () = List.find (fun n -> n.M.kind="text-field") (nodes picker) in
            let original_input = (input ()).M.id in
            let checks () = List.length (List.filter (fun n -> n.M.kind="icon"
              && M.string_prop n "name"=Some "app:check") (nodes picker)) in
            let owned () = if in_panel then Properties_state.view_overlay_open () else
              Option.fold ~none:false ~some:(fun current -> current==d) !Properties_dialog.current in
            if many then check "A reopened property chooser marks its current entity" (checks ()=1);
            let option = List.find_opt (fun n -> n.M.kind="list-item"
              && M.string_prop n "text"=Some "Second") (nodes picker) in
            check ("Property dialog reuses existing " ^ ty ^ " value entities") (Option.is_some option);
            Option.iter (fun n -> S.press picker n.M.id) option;
            ignore (Js.Global.setTimeout ~f:(fun () ->
              check ("Choosing existing " ^ ty ^ " persists its entity rather than creating text")
                (List.sort compare !chosen=(if many then [80;81] else [81]));
              let finish () = ignore (Lui_app.dispose picker.S.app); next rest in
              if not many then finish () else begin
                check "A many property chooser retains its input and both selected entities"
                  ((input ()).M.id=original_input && checks ()=2
                   && owned ());
                let first = List.find_opt (fun n -> n.M.kind="list-item"
                  && M.string_prop n "text"=Some "First") (nodes picker) in
                Option.iter (fun n -> S.press picker n.M.id) first;
                ignore (Js.Global.setTimeout ~f:(fun () ->
                  check "Toggling a selected entity removes only that entity and keeps the chooser usable"
                    (!chosen=[81] && checks ()=1 && (input ()).M.id=original_input);
                  if closed then finish () else begin
                    S.text_changed picker (input ()).M.id "23";
                    S.submit picker (input ()).M.id;
                    ignore (Js.Global.setTimeout ~f:(fun () ->
                      check "A new number appends without closing the many chooser"
                        (List.sort compare !chosen=[81;82]
                         && owned ());
                      finish ()) 0)
                  end) 0)
              end) 0)) 0)
    in
    next ["number",false,false,false;"default",false,false,false;"url",false,false,false;
      "number",true,false,false;"default",true,true,false;"number",true,false,true]
  in
  let property_text_many_check done_ =
    let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model in
    let previous_editor = !Editor_state.st and previous_fields = !Editor_state.field_sigs_opt in
    let reset_editor () = Editor_state.st := None; Editor_state.field_sigs_opt := None in
    reset_editor ();
    let operations = ref [] in
    Runtime.read_model := (fun () -> {Model.initial with repo=Some "property-text-fixture"});
    ignore (Fake_worker.install (fun name args ->
      if name = "thread-api/apply-outliner-ops" then
        operations := List.nth args 1 :: !operations;
      Wire.Map [Wire.kw "result", Wire.Nil]));
    let value uuid title =
      Wire.Map [Wire.kw "block/uuid", Wire.Uuid uuid; Wire.kw "block/title", Wire.String title]
    in
    let row = Wire.Map [
      Wire.kw "property-id", Wire.kw "fixture/text";
      Wire.kw "property", Wire.Map [Wire.kw "db/cardinality", Wire.kw "db.cardinality/many"];
      Wire.kw "value", Wire.Set [
        value "11111111-1111-4111-8111-111111111111" "alpha";
        value "22222222-2222-4222-8222-222222222222" "beta"]
    ] in
    let ctx : Properties_value.ctx =
      {owner_key="property-text-fixture";block_uuid="33333333-3333-4333-8333-333333333333";
       jump_owner=Jump_state.owner ~scope:"main" ~container:"33333333-3333-4333-8333-333333333333";
       block_id=Some 79;refresh=(fun () -> ());is_page=false;class_schema=false} in
    let editor = mount (fun _ -> Properties_value.view ~hover:None ctx row) in
    let open_editor () =
      let button = List.find (fun n -> n.M.kind = "button"
        && not (List.mem (button_label n) [Some "alpha";Some "beta"])) (nodes editor) in
      S.press editor button.M.id;
      List.find (fun n -> n.M.kind = "text-field") (nodes editor)
    in
    let input = open_editor () in
    S.submit editor input.M.id;
    ignore (Js.Global.setTimeout ~f:(fun () ->
      check "Leaving a blank multi-value Text editor preserves existing values" (!operations = []);
      operations := [];
      let input = open_editor () in
      S.text_changed editor input.M.id "gamma";
      S.submit editor input.M.id;
      ignore (Js.Global.setTimeout ~f:(fun () ->
        check "Submitting Text in a populated multi-value editor appends one value"
          (match !operations with
           | [Wire.Array [Wire.Array [Wire.Keyword "create-property-text-block";
               Wire.Array [_; Wire.Keyword "fixture/text"; Wire.String "gamma"; _]]]] -> true
           | _ -> false);
        let beta = List.find_opt (fun n -> n.M.kind="button" && button_label n=Some "beta") (nodes editor) in
        check "Many Text exposes each existing value as its own editable block" (Option.is_some beta);
        Option.iter (fun n -> S.press editor n.M.id) beta;
        ignore (Js.Global.setTimeout ~f:(fun () ->
          check "Editing a many Text value retains its UUID and title, not the owner or a sibling"
            (match Editor_state.editing () with Some e ->
              e.uuid="22222222-2222-4222-8222-222222222222" && e.buffer="beta" | None -> false);
          Option.iter (fun _ -> Editor_state.set (fun st -> {st with editing=None})) !Editor_state.st;
          ignore (Lui_app.dispose editor.S.app);
          reset_editor ();
          let url_row = Wire.Map [Wire.kw "property-id",Wire.kw "fixture/text";
            Wire.kw "value",Properties_data.row_value row;
            Wire.kw "property",Wire.Map [
              Wire.kw "db/cardinality",Wire.kw "db.cardinality/many";
              Wire.kw "logseq.property/type",Wire.kw "url"]] in
          let url = mount (fun _ -> Properties_value.view ~hover:None ctx url_row) in
          let beta = List.find_opt (fun n -> n.M.kind="button" && button_label n=Some "beta") (nodes url) in
          check "Many URL values have individual existing-block edit entries" (Option.is_some beta);
          Option.iter (fun n -> S.press url n.M.id) beta;
          ignore (Js.Global.setTimeout ~f:(fun () ->
            check "Editing a many URL value preserves the selected existing UUID"
              (Editor_state.editing_uuid ()=Some "22222222-2222-4222-8222-222222222222");
            Option.iter (fun _ -> Editor_state.set (fun st -> {st with editing=None})) !Editor_state.st;
            ignore (Lui_app.dispose url.S.app);
            reset_editor ();
            operations := [];
            let prop = Wire.Map [Wire.kw "db/ident",Wire.kw "fixture/text";
              Wire.kw "db/cardinality",Wire.kw "db.cardinality/many"] in
            let d : Properties_dialog.dlg_state =
              {d_target={uuid=ctx.block_uuid;uuids=[];db_id=ctx.block_id;is_tag=false;title=""};
               d_remove=false;d_placement=Properties_dialog.Centered;
               d_phase=Properties_dialog.Value_edit prop;d_phase_sig=None} in
            Properties_dialog.add_empty_text_block d prop;
            ignore (Js.Global.setTimeout ~f:(fun () ->
              let uuid = Option.get (List.find_map (function
                | Wire.Array [Wire.Array [Wire.Keyword "create-property-text-block";
                    Wire.Array [_;_;_;opts]]] -> Option.bind (Properties_data.getf opts "new-block-id") Wire.as_uuid
                | _ -> None) !operations) in
              let row = Wire.Map [Wire.kw "property-id",Wire.kw "fixture/text";
                Wire.kw "property",prop;
                Wire.kw "value",Wire.Set (Properties_data.value_elems (Properties_data.row_value row)
                  @ [value uuid ""])] in
              let pending = mount (fun _ -> Properties_value.view ~hover:None ctx row) in
              List.iter (fun n -> if Hashtbl.find_opt n.M.props "appear-enabled"=Some (P.BoolValue true)
                then S.appear pending n.M.id) (nodes pending);
              ignore (Js.Global.setTimeout ~f:(fun () ->
                check "A newly appended value activates its exact UUID instead of the first sibling"
                  (Editor_state.editing_uuid ()=Some uuid);
                Option.iter (fun _ -> Editor_state.set (fun st -> {st with editing=None})) !Editor_state.st;
                ignore (Lui_app.dispose pending.S.app);
                Editor_state.st := previous_editor;
                Editor_state.field_sigs_opt := previous_fields;
                Runtime.worker := previous_worker;
                Runtime.read_model := previous_model;
                done_ ()) 0)) 0)) 0)) 0)) 0)) 0)
  in
  let property_value_completion_check done_ =
    let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model in
    let previous_pending = !Properties_value.pending_edit in
    let previous_active = !Properties_value.active_editor and previous_close = !Properties_value.close_editor in
    Runtime.read_model := (fun () -> {Model.initial with repo=Some "property-completion-fixture"});
    let finish () =
      Properties_value.pending_edit := previous_pending;
      Properties_value.active_editor := previous_active;
      Properties_value.close_editor := previous_close;
      Runtime.worker := previous_worker;Runtime.read_model := previous_model;done_ () in
    let rec escape = function
      | [] -> finish ()
      | ty::rest ->
          Properties_value.close_editor := (fun () -> ());
          let operations = ref [] in
          ignore (Fake_worker.install (fun name args ->
            if name="thread-api/apply-outliner-ops" then (
              operations := !operations @ Wire.elems (List.nth args 1);
              Wire.Map [Wire.kw "result",Wire.Nil]) else Wire.Nil));
          let ctx : Properties_value.ctx = {owner_key="property-completion";block_uuid="owner";
            jump_owner=Jump_state.owner ~scope:"main" ~container:"owner";
            block_id=None;refresh=(fun () -> ());is_page=false;class_schema=false} in
          let row = Wire.Map [Wire.kw "property-id",Wire.kw "fixture/escape";
            Wire.kw "value",(if ty="string" then Wire.String "seed" else Wire.Float 7.);
            Wire.kw "property",Wire.Map [Wire.kw "logseq.property/type",Wire.kw ty]] in
          let editor = mount (fun _ -> Properties_value.scalar_edit_cell ctx row) in
          S.press editor (List.find (fun n -> n.M.kind="button") (nodes editor)).M.id;
          let input = List.find (fun n -> n.M.kind="text-field") (nodes editor) in
          let draft = if ty="string" then "cancelled" else "23" in
          S.text_changed editor input.M.id draft;
          let target = Stub_dom.make_element "input" in
          let document = !(Stub_dom.document_ref) in
          let previous_focus : Js.Json.t = Stub_dom.get_field document "activeElement" in
          let set : string -> string -> unit = Stub_dom.get_field target "setAttribute" in
          set "id" (Option.get (M.string_prop input "accessibility-identifier"));
          Stub_dom.set_field target "value" draft;
          Stub_dom.set_field target "contains" (fun other -> other == target);
          Stub_dom.set_field document "activeElement" target;
          let listener = List.find (fun listener -> listener.Stub_dom.l_name="keydown")
              (List.rev (Stub_dom.rec_r !(Stub_dom.window_ref)).listeners) in
          listener.l_fn (Stub_dom.make_event ~target ~fields:["key",Js.Json.string "Escape"] "keydown");
          Stub_dom.set_field document "activeElement" previous_focus;
          S.flush editor;
          ignore (Js.Global.setTimeout ~f:(fun () ->
            check (ty ^ " Escape exits only its active property cell")
              (not (List.exists (fun n -> n.M.kind="text-field") (nodes editor)));
            check (ty ^ " Escape preserves its type-specific write policy")
              (if ty="string" then !operations=[] else match !operations with
                | [Wire.Array [Wire.Keyword "set-block-property";
                    Wire.Array [Wire.Uuid "owner";Wire.Keyword "fixture/escape";Wire.Float 23.]]] -> true
                | _ -> false);
            if ty="string" then (
              S.press editor (List.find (fun n -> n.M.kind="button") (nodes editor)).M.id;
              check "Reopening a cancelled String edit restores its original value"
                (List.exists (fun n -> n.M.kind="text-field" && M.string_prop n "text"=Some "seed") (nodes editor)));
            ignore (Lui_app.dispose editor.S.app);
            Properties_value.active_editor := None;
            escape rest) 0)
    in
    let rec next = function
      | [] -> escape ["string";"number"]
      | (ty,many)::rest ->
          let operations = ref [] in
          ignore (Fake_worker.install (fun name args ->
            if name="thread-api/apply-outliner-ops" then (
              operations := !operations @ Wire.elems (List.nth args 1);
              Wire.Map [Wire.kw "result",Wire.Nil]) else Wire.Nil));
          let shared = "44444444-4444-4444-8444-444444444444" in
          let prop = Wire.Map [Wire.kw "db/ident",Wire.kw "fixture/default";
            Wire.kw "logseq.property/type",Wire.kw ty;
            Wire.kw "db/cardinality",Wire.kw (if many then "db.cardinality/many" else "db.cardinality/one");
            Wire.kw "logseq.property/default-value",Wire.Map [Wire.kw "block/uuid",Wire.Uuid shared;
              Wire.kw "block/title",Wire.String "seed"]] in
          let d : Properties_dialog.dlg_state =
            {d_target={uuid="owner-a";uuids=["owner-a";"owner-b"];db_id=None;is_tag=false;title=""};
             d_remove=false;d_placement=Properties_dialog.Centered;
             d_phase=Properties_dialog.Value_edit prop;d_phase_sig=None} in
          Properties_dialog.add_empty_text_block d prop;
          ignore (Js.Global.setTimeout ~f:(fun () ->
            check ("Creating " ^ (if many then "many " else "single ") ^ ty ^ " seeds only fresh owned value blocks")
              (List.length !operations=2 && List.for_all (function
                | Wire.Array [Wire.Keyword "create-property-text-block";
                    Wire.Array [Wire.Uuid owner;Wire.Keyword "fixture/default";Wire.String title;opts]] ->
                    List.mem owner ["owner-a";"owner-b"] && title=(if many then "" else "seed")
                    && Option.bind (Properties_data.getf opts "new-block-id") Wire.as_uuid<>Some shared
                | _ -> false) !operations);
            next rest) 0)
    in next ["default",false;"url",false;"default",true]
  in
  let property_date_check done_ =
    let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model in
    Runtime.read_model := (fun () -> {Model.initial with repo=Some "property-date-fixture"});
    let day = 20261110 in
    let page = Wire.Map [Wire.kw "db/id",Wire.Int 78;
      Wire.kw "block/journal-day",Wire.Int day] in
    let ctx : Properties_value.ctx =
      {owner_key="property-date-fixture";block_uuid="date-owner";block_id=Some 79;
       jump_owner=Jump_state.owner ~scope:"main" ~container:"date-owner";
       refresh=(fun () -> ());is_page=false;class_schema=false} in
    ignore (Fake_worker.install (fun _ _ -> Wire.Nil));
    List.iter (fun (positioned,many,icon) ->
      let value=Wire.Map ([Wire.kw "db/id",Wire.Int 80;Wire.kw "block/title",Wire.String "High"]
        @ if icon then [Wire.kw "logseq.property/icon",Wire.Map
            [Wire.kw "id",Wire.String "priority-lvl-high"]] else []) in
      let prop=Wire.Map ([Wire.kw "db/ident",Wire.kw "logseq.property/priority";
        Wire.kw "logseq.property/type",Wire.kw "default";
        Wire.kw "property/closed-values",Wire.Array [value]]
        @ if many then [Wire.kw "db/cardinality",Wire.kw "db.cardinality/many"] else []) in
      let priority=mount (fun _ -> Properties_value.view ~positioned ~hover:None ctx
        (Wire.Map [Wire.kw "property-id",Wire.kw "logseq.property/priority";
          Wire.kw "property",prop;Wire.kw "value",if many then Wire.Set [value] else value])) in
      check "Positioned priority icons suppress visible labels, not accessible names"
        ((List.exists (fun n -> M.string_prop n "text"=Some "High") (nodes priority))
           =not (positioned && icon)
         && List.exists (fun n -> M.string_prop n "accessibility-label"=Some "High") (nodes priority));
      ignore (Lui_app.dispose priority.S.app))
      [true,false,true;false,false,true;true,false,false;true,true,true;false,true,true];
    List.iter (fun ident ->
      List.iter (fun future ->
        let row=Wire.Map [Wire.kw "property-id",Wire.kw ident;
          Wire.kw "property",Wire.Map [Wire.kw "db/ident",Wire.kw ident;
            Wire.kw "logseq.property/type",Wire.kw "datetime"];
          Wire.kw "value",Wire.Float (Dates.make ~year:(if future then 2999 else 2000) ~month:1 ~day:1 ())] in
        let date=mount (fun _ -> Properties_value.view ~hover:None ctx row) in
        let link=List.find (fun n -> n.M.kind="link") (nodes date) in
        let expected=if not future && ident<>"fixture/date" then "var(--lx-property-overdue-fg)"
          else "var(--lx-accent-11, var(--ls-link-text-color))" in
        check "Date links use link blue while scheduled/deadline overdue colors remain intact"
          (M.string_prop link "foreground"=Some expected);
        ignore (Lui_app.dispose date.S.app)) [true;false])
      ["logseq.property/scheduled";"logseq.property/deadline";"fixture/date"];
    let many_date_check () =
      let ident = "fixture/date" in
      let selected = ref None in
      ignore (Fake_worker.install (fun name args ->
        match name with
        | "thread-api/entity" ->
            Wire.Map [Wire.kw ident, Wire.Set [Wire.Int 80; Wire.Int 81]]
        | "thread-api/get-journal-page-by-day" -> page
        | "thread-api/apply-outliner-ops" ->
            selected := List.nth_opt args 1;
            Wire.Map [Wire.kw "result", Wire.Nil]
        | _ -> Wire.Nil));
      let prop = Wire.Map [Wire.kw "db/ident", Wire.kw ident;
        Wire.kw "logseq.property/type", Wire.kw "date";
        Wire.kw "db/cardinality", Wire.kw "db.cardinality/many"] in
      let d : Properties_dialog.dlg_state =
        {d_target={uuid="date-owner";uuids=[];db_id=Some 79;is_tag=false;title=""};
         d_remove=false;d_placement=Properties_dialog.Centered;
         d_phase=Properties_dialog.Value_edit prop;d_phase_sig=None} in
      let picker = mount (fun _ -> Properties_dialog.date_value_view d prop) in
      ignore (Js.Global.setTimeout ~f:(fun () ->
        let find id = List.find_opt (fun n ->
          M.string_prop n "accessibility-identifier" = Some id) (nodes picker) in
        check "A populated multi-value Date opens the calendar without a clear-all action"
          (Option.is_some (find "date-time-picker") && Option.is_none (find "calendar-clear"));
        Option.iter (fun n ->
          S.text_changed picker n.M.id "2026-11-10";
          S.submit picker n.M.id) (find "calendar-date-input");
        ignore (Js.Global.setTimeout ~f:(fun () ->
          check "The multi-value Date calendar writes the selected journal ID"
            (match !selected with
             | Some (Wire.Array [Wire.Array [Wire.Keyword "batch-set-property";
                 Wire.Array [_; Wire.Keyword "fixture/date"; Wire.Int 78; _]]]) -> true
             | _ -> false);
          ignore (Lui_app.dispose picker.S.app);
          Runtime.worker:=previous_worker;Runtime.read_model:=previous_model;done_ ()) 0)) 0)
    in
    let rec next = function
      | [] -> many_date_check ()
      | (calendar,existing)::rest ->
          let journal = ref (if existing then Some page else None) and written = ref None in
          ignore (Fake_worker.install (fun name args ->
            if name="thread-api/get-journal-page-by-day" then
              Option.value !journal ~default:Wire.Nil
            else if name="thread-api/entity" then
              (match List.nth_opt args 1 with
               | Some (Wire.Int 78) -> Option.value !journal ~default:Wire.Nil
               | _ -> Wire.Map [Wire.kw "fixture/date",Option.value !written ~default:Wire.Nil])
            else if name="thread-api/apply-outliner-ops" then (
              (match List.nth_opt args 1 with
               | Some (Wire.Array ops) -> List.iter (function
                   | Wire.Array [Wire.Keyword "create-page";Wire.Array [Wire.String title;_]] ->
                       if Dates.journal_title_parts title=Some (10,11,2026) then journal:=Some page
                   | Wire.Array [Wire.Keyword "batch-set-property";
                       Wire.Array [Wire.List [Wire.Uuid "date-owner"];Wire.Keyword "fixture/date";value;_]] ->
                       written:=Some value
                   | _ -> ()) ops
               | _ -> ());
              Wire.Map [Wire.kw "result",Wire.Nil])
            else Wire.Nil));
          let selector = if calendar then
            Some (mount (fun _ -> Properties_value.date_picker_content ctx
              ~ident:"fixture/date" ~is_datetime:false
              ~value:(Wire.Map [Wire.kw "block/journal-day",Wire.Int 20261101])
              ~on_value:(fun value -> Properties_value.set_picker_value ctx ~ident:"fixture/date" ~value)
              ~on_clear:(fun () -> ()) ~on_dismiss:(fun () -> ())))
            else None in
          (match selector with
           | Some selector ->
               let button = List.find (fun n -> M.string_prop n "accessibility-identifier"
                 =Some "calendar-day-2026-11-10") (nodes selector) in
               S.press selector button.M.id
           | None -> Properties_value.commit_date_text ctx "fixture/date" ~is_datetime:false "2026-11-10");
          ignore (Js.Global.setTimeout ~f:(fun () ->
            check (Printf.sprintf "Date %s commits the requested %s journal entity"
              (if calendar then "picker" else "text") (if existing then "existing" else "new"))
              (!journal=Some page && !written=Some (Wire.Int 78));
            Option.iter (fun selector -> ignore (Lui_app.dispose selector.S.app)) selector;
            let prop=Wire.Map [Wire.kw "db/ident",Wire.kw "fixture/date";
              Wire.kw "logseq.property/type",Wire.kw "date"] in
            let d : Properties_dialog.dlg_state =
              {d_target={uuid="date-owner";uuids=[];db_id=Some 79;is_tag=false;title=""};
               d_remove=false;d_placement=Properties_dialog.Centered;
               d_phase=Properties_dialog.Value_edit prop;d_phase_sig=None} in
            let reopened=mount (fun _ -> Properties_dialog.date_value_view d prop) in
            ignore (Js.Global.setTimeout ~f:(fun () ->
              check "Reopening a saved Date selects its journal day rather than an epoch date"
                (List.exists (fun n -> M.string_prop n "accessibility-identifier"
                  =Some "calendar-day-2026-11-10" &&
                  Hashtbl.find_opt n.M.props "autofocus"=Some (P.BoolValue true)) (nodes reopened));
              ignore (Lui_app.dispose reopened.S.app);
              next rest) 0)) 0)
    in
    batch_property_check (fun () -> property_picker_check (fun () -> embedded_indent_check (fun () -> ordinary_reference_count_check (fun () -> optimistic_reactions_check (fun () -> reaction_refresh_check (fun () -> graph_delete_check (fun () -> missing_reference_view_check (fun () -> node_picker_lifetime_check
      (fun () -> property_text_many_check (fun () -> property_value_completion_check
        (fun () -> next [false,false;false,true;true,false;true,true])))))))))))
  in
  let custom_date_check done_ =
    let measured_options=Hashtbl.create 3 in
    let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model
    and previous_stack = !Views_popup.stack_st in
    Runtime.read_model := (fun () -> {Model.initial with repo=Some "custom-date-fixture"});
    Runtime.worker := Some {Worker_client.invoke_fn=(fun name _ ->
      Js.Promise.resolve (if name="thread-api/get-view-filter-data" then
        Wire.Map [Wire.kw "value-source",Wire.Keyword "timestamp"] else Wire.Nil));
      on_message=(fun _ _ -> ());dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
    let rec next = function
      | [] -> Runtime.worker:=previous_worker;Runtime.read_model:=previous_model;
          Views_popup.stack_st:=previous_stack;done_ ()
      | mode::rest ->
          Views_popup.stack_st:=None;
          let instance=ref None in
          let selector=mount (fun _ context parent ->
            let inst=Views_state.make ~sched:context.Lui_ui.ui_scheduler
              ~kind:Views_state.KAllPages ~feature:"custom-date-fixture" ~owner:Wire.Nil in
            Views_state.update inst (fun st -> {st with filters_or=true});
            instance:=Some inst;popup_layer context parent) in
          let inst=Option.get !instance in
          Views_head.filter_value_phase inst ~anchor:(popup_anchor ()) (Views_table.created_column ());
          ignore (Js.Promise.then_ (fun () ->
            let input=List.find (fun n -> n.M.kind="input") (nodes selector) in
            S.text_changed selector input.M.id I18n.(t "view.filter/custom-date");
            let option_id=Option.get (List.find_map (fun node ->
              match M.string_prop node "accessibility-identifier" with
              | Some identifier when String.starts_with ~prefix:"ac-content-" identifier -> Some identifier
              | _ -> None) (nodes selector)) in
            check "replacement selectors own distinct measurement identifiers"
              (not (Hashtbl.mem measured_options option_id));
            Hashtbl.replace measured_options option_id ();
            let document = !(Stub_dom.document_ref) in
            let original_lookup : string -> Js.Json.t = Stub_dom.get_field document "getElementById" in
            let option_element=Stub_dom.make_element "div" in
            Stub_dom.set_field option_element "getBoundingClientRect" (fun () ->
              Js.Json.object_ (Js.Dict.fromList (List.map (fun (key,value) -> key,Js.Json.number value)
                ["x",320.;"y",240.;"width",208.;"height",20.])));
            Stub_dom.set_field document "getElementById" (fun id ->
              if id=option_id then option_element else original_lookup id);
            S.submit selector input.M.id;
            ignore (Js.Promise.then_ (fun () ->
            Stub_dom.set_field document "getElementById" original_lookup;
            check "custom date opens a calendar without changing the filter" ((Views_state.get inst).filters=[]);
            let calendar=List.find_opt (fun n -> M.string_prop n "accessibility-identifier"=Some "date-time-picker") (nodes selector) in
            check "custom date renders the shared calendar" (Option.is_some calendar);
            let popup=List.find (fun n -> n.M.kind="popover") (nodes selector) in
            check "custom date stays at the chosen option after the select unmounts"
              (M.string_prop popup "anchor-target"=None
               && M.string_prop popup "anchor-rect"=Some "320. 240. 208. 20.");
            (match calendar with
             | None -> ()
             | Some _ ->
                 let find id=List.find (fun n -> M.string_prop n "accessibility-identifier"=Some id) (nodes selector) in
                 let check_value y m d =
                   let state=Views_state.get inst in
                   check "custom date writes one typed local-midnight instant and preserves OR"
                     (state.filters_or && match state.filters with
                      | [{Views_state.c_prop="block/created-at";c_op="after";c_val=Some (Wire.Date_ms value)}] ->
                          Int64.to_float value=Dates.make ~year:y ~month:m ~day:d ()
                      | _ -> false);
                   check "custom date selection closes its popup" (!Views_popup.open_popups=[]);
                   let clause=List.hd state.filters in
                   eqs "custom date chip displays a readable date" (Printf.sprintf "%04d-%02d-%02d" y m d)
                     (Views_head.filter_value_label inst clause)
                 in
                 if mode="dismiss" then begin
                   let popup=List.find (fun n -> n.M.kind="popover") (nodes selector) in
                   S.dismiss selector popup.M.id;
                   check "calendar dismissal preserves the existing filter state"
                     ((Views_state.get inst).filters=[] && !Views_popup.open_popups=[])
                 end else if mode="text" then begin
                   let input=find "calendar-date-input" in
                   S.text_changed selector input.M.id "not a date";
                   S.submit selector input.M.id;
                   check "invalid calendar input does not commit or close"
                     ((Views_state.get inst).filters=[] && !Views_popup.open_popups<>[]);
                   S.text_changed selector input.M.id "2024-02-29";
                   S.submit selector input.M.id;
                   check_value 2024 2 29
                 end else begin
                   S.text_changed selector (find "calendar-year").M.id "2024";
                   S.press selector (find "calendar-month").M.id;
                   let feb=List.find (fun n -> n.M.kind="menu-item" && M.string_prop n "text"=Some (I18n.t "format.month/february")) (nodes selector) in
                   S.press selector feb.M.id;
                   check "choosing a month keeps the calendar open without committing"
                     ((Views_state.get inst).filters=[] && !Views_popup.open_popups<>[]);
                   S.press selector (find "calendar-next").M.id;
                   check "month navigation renders the following month"
                     (List.exists (fun n -> M.string_prop n "accessibility-identifier"=Some "calendar-day-2024-03-01") (nodes selector));
                   S.press selector (find "calendar-prev").M.id;
                   S.press selector (find "calendar-day-2024-02-29").M.id;
                   check_value 2024 2 29
                 end);
            Views_popup.close_all ();ignore (Lui_app.dispose selector.S.app);
            next rest;Js.Promise.resolve ()) (Js.Promise.resolve ()));
            Js.Promise.resolve ()) (Js.Promise.resolve ()))
    in next ["day";"text";"dismiss"]
  in
  let type_choice_check done_ =
    let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model in
    Runtime.read_model := (fun () -> {Model.initial with repo=Some "type-fixture"});
    let rec next = function
      | [] -> Runtime.worker:=previous_worker;Runtime.read_model:=previous_model;done_ ()
      | (ty,label,name)::rest ->
          let requests = ref [] in
          let notified,notify =
            let callback = ref (fun () -> ()) in
            let promise = Js.Promise.make (fun ~resolve ~reject:_ -> callback := (fun () -> let value=() in resolve value [@u])) in
            promise,(fun () -> !callback ()) in
          Runtime.worker := Some {Worker_client.invoke_fn=(fun method_ args ->
            requests := (method_,args)::!requests;notify ();
            Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()));
            on_message=(fun _ _ -> ());dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
          let d : Properties_dialog.dlg_state =
            {d_target={uuid="type-target";uuids=[];db_id=None;is_tag=false;title=""};
             d_remove=false;d_placement=Properties_dialog.Centered;
             d_phase=Properties_dialog.Type_select name;d_phase_sig=None} in
          let picker = mount (fun _ -> Properties_dialog.type_select_view d name) in
          let control = List.find_opt (fun n -> n.M.kind="select") (nodes picker) in
          check ("new property has a type selection control: "^ty) (Option.is_some control);
          check "entering property type selection does not write to the graph" (!requests=[]);
          match control with
          | None -> ignore (Lui_app.dispose picker.S.app);next rest
          | Some control ->
              let menus () = List.filter (fun n -> n.M.kind="dropdown-menu") (nodes picker) in
              check "new property opens its type menu immediately" (List.length (menus ())=1);
              eqs "new property preserves its Unicode name" name
                (List.find_map (fun n -> match M.string_prop n "text" with
                  | Some value when value=name -> Some value | _ -> None) (nodes picker) |> Option.value ~default:"");
              let menu = List.hd (menus ()) in
              S.dismiss picker menu.M.id;
              check "type dismissal preserves the property workflow and control"
                (menus ()=[] && List.exists (fun n -> n.M.id=control.M.id) (nodes picker));
              S.press picker control.M.id;
              check "type control reopens the dismissed menu" (List.length (menus ())=1);
              let options = List.filter (fun n -> n.M.kind="menu-item") (nodes picker) in
              check "type selection exposes all eight supported types" (List.length options=8);
              let option = List.find (fun n -> M.string_prop n "text"=Some (I18n.t label)) options in
              S.press picker option.M.id;
              check "choosing a type closes only its menu" (menus ()=[]);
              ignore (Js.Promise.then_ (fun () ->
                check ("type choice sends its exact name and schema: "^ty)
                  (match !requests with
                   | ["thread-api/apply-outliner-ops",[_;Wire.Array [Wire.Array
                       [Wire.Keyword "upsert-property";Wire.Array [Wire.Nil;schema;opts]]];_]] ->
                       Wire.get schema "logseq.property/type"=Some (Wire.Keyword ty)
                       && Wire.get opts "property-name"=Some (Wire.String name)
                   | _ -> false);
                ignore (Lui_app.dispose picker.S.app);next rest;Js.Promise.resolve ()) notified)
    in
    next ["default","property/type-text","Type fixture";
      "number","property/type-number",{js|中文 café 😀|js};
      "date","property/type-date","A property with a deliberately long display name";
      "datetime","property/type-datetime","Type fixture";
      "checkbox","property/type-checkbox","Type fixture";
      "url","property/type-url","Type fixture";
      "node","property/type-node","Type fixture";
      "asset","property/type-asset","Type fixture"]
  in
  List.iter (fun (label,case_sensitive,allow_new,titles,query,expected) ->
    let chosen = ref None in
    let selector = mount (fun _ -> Properties_select.view ~placeholder:"Rank fixture"
      ~compact:true ~new_case_sensitive:case_sensitive
      ?new_option:(if allow_new then Some (fun value -> chosen:=Some ("new:"^value)) else None)
      (List.map (fun title -> Properties_select.item title (fun () -> chosen:=Some title)) titles)) in
    let input = List.find (fun n -> n.M.kind="text-field") (nodes selector) in
    S.text_changed selector input.M.id query;
    let list = List.find (fun n -> n.M.kind="list") (nodes selector) in
    let rows = M.children selector.S.tree list.M.id |> List.filter (fun n -> n.M.kind="list-item") in
    eqs ("property ranking: "^label) (String.concat " | " expected)
      (String.concat " | " (List.filter_map (fun n -> M.string_prop n "key") rows));
    S.submit selector input.M.id;
    let expected_choice = match expected with
      | "__new__"::_ -> Some ("new:"^String.trim query)
      | first::_ -> Some first | [] -> None in
    check ("property ranking submits the first choice: "^label) (!chosen=expected_choice);
    check ("property ranking retains its focused input node: "^label)
      (List.exists (fun n -> n.M.id=input.M.id) (nodes selector));
    ignore (Lui_app.dispose selector.S.app))
    ["sparse match",true,true,["User Avatar";"Status";"Tags"],"Sta",["Status";"__new__";"User Avatar"];
     "new before sparse-only matches",true,true,["User Avatar"],"Sta",["__new__";"User Avatar"];
     "exact property",true,true,["Status";"User Avatar"],"Status",["Status"];
     "case-sensitive property creation",true,true,["Status"],"status",["Status";"__new__"];
     "case-insensitive value",false,true,["Status"],"status",["Status"];
     "creation disabled",true,false,["User Avatar";"Status"],"Sta",["Status";"User Avatar"];
     "empty query preserves order",true,true,["Zebra";"Alpha";"Beta"],"",["Zebra";"Alpha";"Beta"];
     "empty source",true,true,[],"",[];
     "unmatched new value",true,true,["Status"],"Missing",["__new__"];
     "unmatched query",true,false,["Status"],"Missing",[];
     "Unicode accent",true,true,[{js|Café|js};"Cafe menu";{js|中文|js}],"cafe",[{js|Café|js};"__new__";"Cafe menu"];
     "Unicode sparse match",true,true,[{js|中文|js};{js|中间文字|js};{js|世界|js}],{js|中文|js},[{js|中文|js};{js|中间文字|js}];
     "emoji",true,true,[{js|😀 note|js};"Other";{js|🧑‍💻|js}],{js|😀|js},[{js|😀 note|js};"__new__"];
     "canonical forms remain distinct new names",true,true,[{js|café|js}],{js|café|js},["__new__";{js|café|js}]];
  let many = List.init 120 (fun index -> Printf.sprintf "Choice %03d" index) in
  let selector = mount (fun _ -> Properties_select.view ~placeholder:"Limit fixture"
    (List.map (fun title -> Properties_select.item title (fun () -> ())) many)) in
  check "property selector limits the mounted fuzzy result set to 100"
    (List.length (List.filter (fun n -> n.M.kind="list-item") (nodes selector))=100);
  ignore (Lui_app.dispose selector.S.app);
  List.iter (fun compact ->
    let chosen = ref [] in
    let selector = mount (fun _ -> Properties_select.view ~placeholder:"Select fixture"
      ~compact [Properties_select.item "Alpha" (fun () -> chosen:="Alpha"::!chosen);
                Properties_select.item "Beta" (fun () -> chosen:="Beta"::!chosen);
                Properties_select.item "Gamma" (fun () -> chosen:="Gamma"::!chosen)]) in
    let rows () = nodes selector |> List.filter (fun n -> n.M.kind="list-item")
      |> List.sort (fun a b -> Int.compare a.M.id b.M.id) in
    let input = List.find (fun n -> n.M.kind="text-field") (nodes selector) in
    let original_rows = List.map (fun n -> n.M.id) (rows ()) in
    let selected () = rows () |> List.filter (fun n -> M.string_prop n "background"=
        Some "var(--lx-gray-04, var(--ls-menu-hover-color, hsl(var(--secondary))))")
      |> List.map (fun n -> M.string_prop n "key") in
    check "property selector starts on the first result" (selected ()=[Some "Alpha"]);
    check "Search-result highlighting must not expose a pressed control"
      (List.for_all (fun n -> not (Hashtbl.mem n.M.props "selected")) (rows ()));
    check "Property results share the reference foreground and hover recipe"
      (List.for_all (fun n ->
        M.string_prop n "foreground"=Some (if M.string_prop n "key"=Some "Alpha"
          then "var(--ls-secondary-text-color, hsl(var(--popover-foreground)))" else "hsl(var(--popover-foreground) / 0.75)")
        && M.string_prop n "hover-foreground"=Some "var(--ls-secondary-text-color, hsl(var(--popover-foreground)))"
        && M.string_prop n "hover-background"=
          Some "var(--lx-gray-04, var(--ls-menu-hover-color, hsl(var(--secondary))))") (rows ()));
    check "property selector opts into input navigation"
      (Hashtbl.find_opt input.M.props "navigate-enabled"=Some (P.BoolValue true));
    navigate selector input (P.NavigatePrevious input.M.id);
    check "property selector previous wraps to the last result" (selected ()=[Some "Gamma"]);
    navigate selector input (P.NavigateNext input.M.id);
    check "property selector next wraps to the first result" (selected ()=[Some "Alpha"]);
    navigate selector input (P.NavigateNext input.M.id);
    check "property selector next selects the second result" (selected ()=[Some "Beta"]);
    let list = List.find (fun n -> n.M.kind="list") (nodes selector) in
    check "property selector requests minimal reveal for keyboard selection"
      (M.string_prop list "scroll-anchor"=Some "nearest"
       && M.string_prop list "scroll-target"=Some "Beta");
    S.submit selector input.M.id;
    check "property selector Enter chooses the keyboard result" (!chosen=["Beta"]);
    chosen:=[];
    S.dispatch selector (P.PointerEnter (List.nth (rows ()) 2).M.id);
    S.dispatch selector (P.PointerEnter (List.nth (rows ()) 1).M.id);
    check "property selector hover moves selection" (selected ()=[Some "Beta"]);
    S.submit selector input.M.id;
    check "property selector Enter chooses the hovered result" (!chosen=["Beta"]);
    check "property selector retains input and row identities while selecting"
      (List.exists (fun n -> n.M.id=input.M.id) (nodes selector)
       && List.map (fun n -> n.M.id) (rows ())=original_rows);
    S.text_changed selector input.M.id "Gamma";
    check "property selector filtering resets selection" (selected ()=[Some "Gamma"]);
    S.submit selector input.M.id;
    check "property selector submits its filtered result" (!chosen=["Gamma";"Beta"]);
    S.text_changed selector input.M.id "missing";
    navigate selector input (P.NavigatePrevious input.M.id);
    navigate selector input (P.NavigateNext input.M.id);
    S.submit selector input.M.id;
    check "property selector empty results do not choose a stale item" (!chosen=["Gamma";"Beta"]);
    ignore (Lui_app.dispose selector.S.app)) [false;true];
  let entered = ref [] in
  let raw = mount (fun _ -> Properties_select.view ~placeholder:"Raw fixture"
    ~on_enter_text:(Some (fun value -> entered:=value::!entered)) []) in
  let field = List.find (fun n -> n.M.kind="text-field") (nodes raw) in
  S.submit raw field.M.id;
  S.text_changed raw field.M.id "  free text  ";
  navigate raw field (P.NavigateNext field.M.id);
  S.submit raw field.M.id;
  check "property selector raw entry trims text and ignores blank submits" (!entered=["free text"]);
  ignore (Lui_app.dispose raw.S.app);
  let fresh = mount (fun _ -> Properties_select.view ~placeholder:"New fixture"
    ~new_option:(fun value -> entered:=value::!entered)
    [Properties_select.item "Alpha" (fun () -> entered:="existing"::!entered)]) in
  let field = List.find (fun n -> n.M.kind="text-field") (nodes fresh) in
  S.text_changed fresh field.M.id "Alpha";S.submit fresh field.M.id;
  S.text_changed fresh field.M.id "  Delta  ";S.submit fresh field.M.id;
  check "property selector retains existing and new-option submission" (!entered=["Delta";"existing";"free text"]);
  ignore (Lui_app.dispose fresh.S.app);
  let async_selection_check done_ =
    let pending = ref [] in
    let search q = Js.Promise.make (fun ~resolve ~reject:_ ->
      pending:= !pending @ [q,resolve]) in
    let selector = mount (fun _ -> Properties_select.view ~placeholder:"Async fixture"
      ~on_search:(Some search) [Properties_select.item "Alpha" (fun () -> ())]) in
    let input = List.find (fun n -> n.M.kind="text-field") (nodes selector) in
    let titles () = nodes selector |> List.filter (fun n -> n.M.kind="list-item")
      |> List.filter_map (fun n -> M.string_prop n "key") |> List.sort String.compare in
    List.iter (S.text_changed selector input.M.id) ["A";"B";"A"];
    let resolve index title =
      let callback = snd (List.nth !pending index) in
      callback [Properties_select.item title (fun () -> ())] [@u] in
    resolve 0 "Stale A";resolve 1 "Stale B";
    ignore (Js.Promise.then_ (fun () ->
      S.flush selector;
      check "property selector rejects stale results after A-B-A input" (titles ()=["Alpha"]);
      resolve 2 "Fresh";
      Js.Promise.then_ (fun () ->
        S.flush selector;
        check "property selector accepts the latest async result" (titles ()=["Fresh"]);
        let row = List.find (fun n -> n.M.kind="list-item") (nodes selector) in
        check "property selector async results start selected"
          (M.string_prop row "background"=
            Some "var(--lx-gray-04, var(--ls-menu-hover-color, hsl(var(--secondary))))");
        S.text_changed selector input.M.id "B";
        ignore (Lui_app.dispose selector.S.app);
        resolve 3 "Disposed";
        Js.Promise.then_ (fun () ->
          check "property selector ignores async completion after disposal" (nodes selector=[]);
          done_ ();Js.Promise.resolve ()) (Js.Promise.resolve ())) (Js.Promise.resolve ()))
      (Js.Promise.resolve ()))
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
        {favorites=state [target];home_page=state None;favorite_drop=state None;recents=state [];nav_checked=state [];
         nav_tag_titles=state [];block_sources = Hashtbl.create 8; items = state [];
         open_menu=state "";groups_collapsed=state [];
         left_width=state 246.;right_fraction=state 0.3;viewport_w=state 1440.;
         restored_repo=ref None;restoring=ref true;history_repo=ref None;history_state=ref None} in
      sidebar:=Some st;Sidebar_state.st_ref:=Some st;Sidebar_state.model_signal:=Some ms;
      Lui_elements.column (Page_menu.page_items target @ [Left_sidebar_view.nav_edit_menu st])) () in
  let st = Option.get !sidebar in
  let item = nodes menu |> List.filter (fun n -> n.M.kind="menu-item")
    |> List.sort (fun a b -> Int.compare a.M.id b.M.id) |> List.hd in
  let label () = M.string_prop (List.find (fun n -> n.M.id=item.M.id) (nodes menu)) "text" in
  check "page menu reflects the target favorite instead of the current route"
    (label ()=Some (I18n.t "page/unfavorite"));
  check "navigation checkbox menu uses the translated Pages label"
    (List.exists (fun n -> M.string_prop n "text"=Some (I18n.t "nav.all-pages/label")) (nodes menu));
  Runtime.signal_set st.favorites [current]; S.flush menu;
  check "page menu reacts to favorite changes without remounting its row"
    (label ()=Some (I18n.t "page/add-to-favorites"));
  Runtime.signal_set st.favorites [target]; S.flush menu;
  check "page menu restores the target's favorite label with the same row identity"
    (label ()=Some (I18n.t "page/unfavorite"));
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
        ; info = None; header = None; iicon = None; inline_icon = None; isc = ""; ibadge = No_badge
        ; act = Open_page name; ihl = false; imouse = false; iq = query } in
      let item_s = Signal.state (Signal.signal_owner ms) item in
      Cmdk_view.hl_span "label" (Signal.value item_s) (fun it -> it.Cmdk_state.ititle)) in
    let runs = nodes palette
      |> List.sort (fun a b -> Int.compare a.M.id b.M.id)
      |> List.filter_map (fun n -> M.string_prop n "text") in
    check ("command palette preserves Unicode text and spacing: " ^ name)
      (runs = expected);
    ignore (Lui_app.dispose palette.S.app))
    [ "date", "Oct 17th, 2026", "", ["Oct 17th, 2026"]
    ; "highlighted date", "Oct 17th, 2026", "17th",
        ["Oct "; "17th"; ", 2026"]
    ; "Unicode", {js|中文 café 😀|js}, {js|café|js},
        [{js|中文 |js}; {js|café|js}; {js| 😀|js}]
    ; "existing spaces", {js|a b  c|js}, "", [{js|a b  c|js}]
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
      ; "journal format menu", (fun ms context parent ->
          let state = Signal.state (Signal.signal_owner ms) true in
          Settings_page.dfmt_menu ~scope:context.Lui_ui.ui_scope ~key:"unicode" state [value] value context parent) ])
    [ {js|中文|js}; {js|café|js}; {js|é|js}; {js|😀|js}; {js|a b|js} ];
  check "The canonical English help link preserves its Unicode arrow"
    (I18n.t "settings.editor/preferred-outdenting-tip-more" = {js|→ Learn more|js});
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
  List.iter (fun n ->
    if n.M.kind = "virtual-list" then
      match Hashtbl.find_opt n.M.props "virtual-generation" with
      | Some (P.IntValue epoch) -> S.dispatch picker (P.VirtualWindow (n.M.id, epoch, 0, 20, []))
      | _ -> ()) (nodes picker);
  let icon = List.find_opt (fun n -> class_has n "ls-emoji-cell") (buttons ()) in
  (match icon with
   | Some n -> S.press picker n.M.id;
       check "selected icon carries the preset color"
         (match !chosen with Some (Icon_picker.Tabler (_, Some "#6e7b8b")) -> true | _ -> false)
   | None -> check "icon picker renders icon buttons" false);
  ignore (Lui_app.dispose picker.S.app);
  restore_storage "ls-icon-color-preset" previous_preset;
  List.iter (fun fail ->
    let accepted = ref [] and closed = ref 0 in
    let terminal = mount (fun _ ->
      Icon_picker.picker_view ~del:true ~emoji_only:false
        ~on_chosen:(fun choice ->
          accepted := choice :: !accepted;
          if fail then failwith "icon selection failed")
        ~close:(fun () -> incr closed)) in
    check "An unopened icon choice has no commit" (!accepted=[] && !closed=0);
    let choices = nodes terminal |> List.filter (fun n ->
      n.M.kind="button" && class_has n "ls-emoji-cell") in
    let activate node =
      try S.press terminal node.M.id with Failure _ -> () in
    activate (List.hd choices);
    activate (List.hd choices);
    activate (List.nth choices 1);
    check (if fail then "Failed icon selection remains terminal before teardown"
           else "One icon selection cannot commit again before teardown")
      (List.length !accepted=1 && !closed=1);
    ignore (Lui_app.dispose terminal.S.app)) [false;true];
  restore_storage "ls-icons-used" previous_used;
  let menu_row_style row =
    Hashtbl.find_opt row.M.props "corner-radius" = Some (P.IntValue 4)
    && M.string_prop row "font-size" = Some "0.875rem"
    && M.string_prop row "hover-background" = Some "var(--lx-gray-05, hsl(var(--muted)))"
    && M.string_prop row "hover-foreground" = Some
      (if M.string_prop row "variant" = Some "destructive"
       then "var(--color-destructive)" else "inherit")
    && M.string_prop row "focus-within-background" = Some "var(--lx-gray-05, hsl(var(--muted)))"
  in
  let property_row = Wire.Map
    [ Wire.Keyword "property-id", Wire.Keyword "user.property/T98MenuNumber"
    ; Wire.Keyword "property", Wire.Map
        [ Wire.Keyword "block/uuid", Wire.Uuid "menu-number-property"
        ; Wire.Keyword "block/title", Wire.String "T98MenuNumber"
        ; Wire.Keyword "logseq.property/type", Wire.Keyword "number" ]
    ; Wire.Keyword "value", Wire.Int 42 ] in
  let property_menu = mount (fun _ -> Properties_menu.menu_view
    ~owner_uuid:"menu-number-owner" ~owner_id:None ~owner_is_tag:false
    ~owner_title:"Menu fixture" ~refresh:(fun () -> ()) ~close:(fun () -> ()) property_row) in
  let surface = List.find (fun n -> n.M.kind = "popover") (nodes property_menu) in
  check "property-name menu applies its 260px width and 6px padding to the surface"
    (Hashtbl.find_opt surface.M.props "width" = Some (P.IntValue 260)
     && Hashtbl.find_opt surface.M.props "padding" = Some (P.IntValue 6)
     && M.string_prop surface "foreground" = Some "inherit");
  let property_items = List.filter (fun n -> n.M.kind = "menu-item") (nodes property_menu) in
  check "property-name rows share rounded, non-inverted hover and keyboard styling"
    (property_items <> [] && List.for_all menu_row_style property_items);
  ignore (Lui_app.dispose property_menu.S.app);
  List.iter (fun empty ->
    let shared_menu = mount (fun _ -> Lui_elements.dropdown_menu_view
      (Ui_components.dropdown_menu ~key:"shared-menu-style"
         (if empty then [] else
           [ Ui_components.dropdown_menu_item ~text:"Enabled" []
           ; Ui_components.dropdown_menu_item ~text:"Disabled" ~disabled:true [] ]))) in
    let surface = List.find (fun n -> n.M.kind = "dropdown-menu") (nodes shared_menu) in
    check "shared dropdown surfaces retain typed chrome even without rows"
      (Hashtbl.find_opt surface.M.props "padding" = Some (P.IntValue 4)
       && M.string_prop surface "overflow" = Some "auto"
       && M.string_prop surface "font-size" = Some "0.875rem"
       && class_has surface "ui__dropdown-menu-content");
    let rows = List.filter (fun n -> n.M.kind = "menu-item") (nodes shared_menu) in
    check "enabled and disabled restricted rows receive the shared style"
      (List.for_all menu_row_style rows);
    ignore (Lui_app.dispose shared_menu.S.app)) [false;true];
  let custom_menu = mount (fun _ -> Lui_elements.dropdown_menu_view
    (Ui_components.dropdown_menu ~key:"custom-menu-style"
      [ Ui_components.dropdown_menu_item ~text:"Custom"
          ~style:(Lui_elements.Slot_style.make ~hover_background:"custom-background"
            ~hover_foreground:"custom-foreground" ()) [] ])) in
  let custom_row = List.find (fun n -> n.M.kind = "menu-item") (nodes custom_menu) in
  check "authored menu styles override shared colors without dropping row geometry"
    (M.string_prop custom_row "hover-background" = Some "custom-background"
     && M.string_prop custom_row "hover-foreground" = Some "custom-foreground"
     && Hashtbl.find_opt custom_row.M.props "corner-radius" = Some (P.IntValue 4));
  ignore (Lui_app.dispose custom_menu.S.app);
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
      clipboard_snapshot = (fun () -> Ui_services.empty_clipboard_snapshot); clipboard_set = (fun _ _ -> ()); data_transfer_get = (fun _ -> "");
      files = []; has_files = false; prevent_default = (fun () -> ());
      stop_propagation = (fun () -> ()); stop_immediate = (fun () -> ()) }
  in
  let previous_view_overlays = !Properties_state.view_overlays_state in
  Properties_state.view_overlays_state := None;
  let escape_owner = mount (fun _ -> Properties_view.overlays) in
  let dismissed = ref 0 in
  let close_escape_owner () =
    incr dismissed;
    Properties_state.remove_view_overlay "escape-owner" in
  ignore (Properties_state.push_view_overlay_ctxfree ~key:"escape-owner"
    ~on_escape:close_escape_owner
    ~view:(Lui_elements.popover ~role:`dialog
      ~target:(Anchor {side=`below; source=Parent; align=`start; offset=0.; align_offset=0.})
      ~on_dismiss:(fun _ -> close_escape_owner ())
      [Lui_elements.text ~value:"Outer property surface" []]));
  S.flush escape_owner;
  let surface = List.find (fun n -> n.M.kind = "popover") (nodes escape_owner) in
  Properties_view.on_keydown (key_event "Escape");
  S.flush escape_owner;
  check "Document property shortcuts leave Escape dismissal to the mounted layer"
    (!dismissed = 0 && Properties_state.view_overlay_open ());
  if Properties_state.view_overlay_open () then
    S.dispatch escape_owner (P.Dismiss surface.M.id);
  check "The mounted property surface still owns its dismissal callback"
    (!dismissed = 1 && not (Properties_state.view_overlay_open ()));
  ignore (Lui_app.dispose escape_owner.S.app);
  Properties_state.view_overlays_state := previous_view_overlays;
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
  let tip_layer = ref None in
  let tooltip = mount (fun ms ->
    let layers = List.init 3 (fun _ -> Signal.state (Signal.signal_owner ms) false) in
    tip_layer := Some layers;
    Tooltip.state:=Some (Signal.state (Signal.signal_owner ms) None);
    Tooltip.armed_on:=None;Tooltip.timer:= -1;
    let open Lui_elements in
    column [Tooltip.el;
      if_ ~test:(Signal.value (List.nth layers 0)) (popover ~role:`menu ~target:(At (10.,10.)) []);
      if_ ~test:(Signal.value (List.nth layers 1)) (dialog ~text:"Tooltip dialog fixture" []);
      if_ ~test:(Signal.value (List.nth layers 2)) (popover ~role:`dialog ~target:(At (10.,10.)) [])]) in
  let set_tip_layer kind =
    List.iteri (fun index state -> Signal.set state (index + 1 = kind)) (Option.get !tip_layer);
    S.flush tooltip in
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
      (Option.map (fun t -> t.Tooltip.tip_label) (shown ())=Some "Explicit tip");
    List.iter (fun kind ->
      Tooltip.hide (); pending:=[];
      move (Some button);
      let stale = List.map snd !pending in
      set_tip_layer kind;
      move (Some button); fire ();
      List.iter (fun callback -> callback ()) stale;
      check "An open menu, popup or dialog suppresses trigger tooltips and stale timers"
        (shown ()=None && !pending=[]);
      set_tip_layer 0;
      move (Some button); fire ();
      check "Closing the surface restores normal tooltip delay and display" (shown ()<>None))
      [1;2;3]);
  let keymap_state = ref None in
  let keymap = mount (fun _ context parent ->
    let state = Signal.state context.Lui_ui.ui_scheduler (Settings_page.initial_keymap ()) in
    keymap_state := Some state;
    Settings_page.keymap_pane ~state () context parent) in
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
        match M.string_prop n "accessibility-label" with
        | Some text -> String.starts_with ~prefix text
        | None -> false)
      (keymap_nodes ())
  in
  let category_toggle () =
    List.find
      (fun n ->
        M.string_prop n "accessibility-label"
        = Some (I18n.t "keymap/toggle-categories-pane"))
      (keymap_nodes ())
  in
  let category_tools () =
    List.filter
      (fun n ->
        let label = M.string_prop n "accessibility-label" in
        label = Some (I18n.t "keymap/toggle-categories-pane")
        || label = Some (I18n.t "keymap/refresh-all"))
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
  eqi "search ignores category collapse" 15 (List.length (keymap_rows ()));
  eqi "query results hide category actions" 0 (List.length (category_tools ()));
  S.text_changed keymap input.M.id "";
  eqi "clearing search retains category collapse" 0
    (List.length (keymap_rows ()));
  eqi "clearing search restores category actions" 2
    (List.length (category_tools ()));
  S.press keymap (pill "Disabled").M.id;
  check "status filter shows commands independently of category collapse"
    (keymap_rows () <> [] && category_headers () = []);
  S.press keymap (pill "All").M.id;
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
  eqi "query results retain matches in their original categories" 15
    (List.length (keymap_rows ()));
  check "query counts follow matching commands"
    (M.string_prop (pill "All") "accessibility-label"
    <> Some
         ((I18n.t "keymap/all")
         ^ {js| · |js}
         ^ string_of_int (Keymap_data.count Keymap_data.All)));
  eqi "nonempty query shows exactly one clear control" 1
    (List.length (clear_buttons ()));
  S.press keymap (pill "Disabled").M.id;
  eqi "filter applies to fuzzy query results" 1 (List.length (keymap_rows ()));
  S.press keymap (pill "Disabled").M.id;
  eqi "pressing the active filter restores all query results" 15
    (List.length (keymap_rows ()));
  S.press keymap (pill "Disabled").M.id;
  (match clear_buttons () with
  | [ clear ] -> S.press keymap clear.M.id
  | _ -> ());
  check "query clear resets text without replacing the search field"
    (M.string_prop input "text" = Some ""
    && List.exists (fun n -> n.M.id = input.M.id) (keymap_nodes ()));
  check "query clear removes its control" (clear_buttons () = []);
  S.press keymap (pill "All").M.id;
  check "all without a query restores category headers"
    (category_headers () <> []);
  S.text_changed keymap input.M.id "zzzz-no-shortcut";
  check "empty keymap search shows its translated empty state"
    (List.exists
       (fun n ->
         M.string_prop n "text" = Some (I18n.t "keymap/no-matching-shortcuts"))
       (keymap_nodes ()));
  Settings_page.keymap_escape (Option.get !keymap_state);
  S.flush keymap;
  check "Escape clears shortcut search without replacing its owner"
    (M.string_prop input "text" = Some ""
     && List.exists (fun n -> n.M.id = input.M.id) (keymap_nodes ()));
  S.text_changed keymap input.M.id "  ";
  check "whitespace query restores categories and hides clear"
    (category_headers () <> [] && clear_buttons () = []);
  let key_search = List.find (fun n ->
      M.string_prop n "text" = Some (I18n.t "keymap/search-by-keys")) (keymap_nodes ()) in
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
  let custom_label = (I18n.t "keymap/custom") ^ {js| · 1|js} in
  let custom_pill () = List.find (fun n ->
      M.string_prop n "accessibility-label" = Some custom_label)
      (configured_nodes ()) in
  check "stored custom shortcut contributes to the Custom count"
    (List.exists (fun n -> M.string_prop n "accessibility-label"
       = Some custom_label) (configured_nodes ()));
  (match List.find_opt (fun n -> M.string_prop n "accessibility-label"
       = Some custom_label) (configured_nodes ()) with
   | Some _ ->
       S.press configured_keymap (custom_pill ()).M.id;
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
      M.string_prop n "accessibility-label" = Some (I18n.t "keymap/refresh-all"))
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
  let reset_buttons () = List.filter (fun n -> M.string_prop n "text" = Some (I18n.t "settings.sync-server/reset")) (nodes editor) in
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
          toast_kind = kind; toast_key = None; toast_code = None; toast_duration = None }));
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
  let trigger = List.find (fun n -> M.string_prop n "accessibility-identifier" = Some "vp9002-i0") (nodes submenu) in
  S.press submenu trigger.M.id;
  let submenus () = List.filter (fun n -> n.M.kind = "popover") (nodes submenu) in
  eqi "view-action submenu opens" 1 (List.length (submenus ()));
  !key_handler (key_event "ArrowLeft");
  S.flush submenu;
  check "ArrowLeft closes only the view-action submenu" (submenus () = []);
  check "closing a submenu preserves its parent trigger"
    (List.exists (fun n -> n.M.id = trigger.M.id) (nodes submenu));
  ignore (Lui_app.dispose submenu.S.app);
  let nested_key = ref (fun (_ : Ui_services.ev) -> ()) in
  let nested = mount (fun _ -> Views_popup.menu_level ~pid:9003 ~cls:""
      ~register:(fun handler -> nested_key := handler)
      [ Views_popup.MSub ("Parent",
          [Views_popup.MSub ("Nested", [Views_popup.MItem ("Deep action",ignore)]);
           Views_popup.MItem ("Child action",ignore)]);
        Views_popup.MSub ("Other parent",[Views_popup.MItem ("Other action",ignore)]) ]) in
  let nested_popups () = List.filter (fun n -> n.M.kind="popover") (nodes nested) in
  let unique_menu_ids () =
    let ids=List.filter_map (fun n -> M.string_prop n "accessibility-identifier") (nodes nested) in
    List.length ids=List.length (List.sort_uniq String.compare ids) in
  let press_nested key = !nested_key (key_event key) in
  press_nested "ArrowDown";
  press_nested "ArrowRight";
  check "submenu keyboard entry publishes without another input event"
    (List.length (nested_popups ())=1);
  S.flush nested;
  check "the first down-arrow from the menu container selects its first branch"
    (List.exists (fun n -> M.string_prop n "text"=Some "Nested") (nodes nested));
  check "parent and child menu controls have distinct retained identifiers" (unique_menu_ids ());
  let press_from identifier key =
    let row=List.find (fun n -> M.string_prop n "accessibility-identifier"=Some identifier) (nodes nested) in
    let target={ (Ui_services.dom_body ()) with Ui_services.attr=(fun name ->
      if name="id" then M.string_prop row "accessibility-identifier" else None) } in
    !nested_key {(key_event key) with target=Some target} in
  press_from "vp9003-s0-i0" "ArrowRight";
  S.flush nested;
  eqi "a second right-arrow opens the next submenu depth" 2 (List.length (nested_popups ()));
  check "deep submenu controls have distinct retained identifiers" (unique_menu_ids ());
  press_nested "ArrowLeft";
  S.flush nested;
  eqi "left-arrow closes only the deepest submenu" 1 (List.length (nested_popups ()));
  check "closing the deepest submenu preserves the immediate parent"
    (List.exists (fun n -> M.string_prop n "text"=Some "Nested") (nodes nested));
  press_nested "ArrowLeft";
  S.flush nested;
  check "a second left-arrow returns to the root menu" (nested_popups ()=[]);
  press_nested "ArrowRight";
  S.flush nested;
  let other=List.find (fun n -> M.string_prop n "accessibility-identifier"=Some "vp9003-i1") (nodes nested) in
  S.press nested other.M.id;
  check "switching submenu branches removes the previous branch"
    (List.length (nested_popups ())=1
     && List.exists (fun n -> M.string_prop n "text"=Some "Other action") (nodes nested)
     && not (List.exists (fun n -> M.string_prop n "text"=Some "Child action") (nodes nested)));
  ignore (Lui_app.dispose nested.S.app);
  let previous_context = !Popups_state.active in
  let previous_menu_query : string -> Js.Json.t array = Stub_dom.get_field document "querySelectorAll" in
  let previous_menu_id : string -> Js.Json.t = Stub_dom.get_field document "getElementById" in
  let previous_menu_dispatch : Js.Json.t -> bool = Stub_dom.get_field document "dispatchEvent" in
  let foreign_menu=Stub_dom.make_element "div" and foreign_item=Stub_dom.make_element "div" in
  let owned_menu=Stub_dom.make_element "div" and owned_item=Stub_dom.make_element "div" in
  let foreign_actions=ref 0 and owned_actions=ref 0 in
  Stub_dom.set_field document "dispatchEvent" (fun event ->
    let name : string = Stub_dom.get_field event "type" in
    if name="ls:editor-command" then (incr owned_actions; true)
    else previous_menu_dispatch event);
  List.iter (fun menu -> Stub_dom.set_field menu "getBoundingClientRect" (fun () ->
    Js.Json.object_ (Js.Dict.fromList ["x",Js.Json.number 0.;"y",Js.Json.number 0.;
      "width",Js.Json.number 200.;"height",Js.Json.number 100.]))) [foreign_menu;owned_menu];
  Stub_dom.set_field foreign_menu "querySelectorAll" (fun _ -> [|foreign_item|]);
  Stub_dom.set_field foreign_item "focus" (fun () -> incr foreign_actions);
  Stub_dom.set_field foreign_item "click" (fun () -> incr foreign_actions);
  Stub_dom.set_field owned_menu "querySelectorAll" (fun _ -> [|owned_item|]);
  Stub_dom.set_field owned_item "focus" (fun () -> incr owned_actions);
  Stub_dom.set_field owned_item "click" (fun () -> incr owned_actions);
  let set_menu_attr : string -> string -> unit = Stub_dom.get_field owned_menu "setAttribute" in
  set_menu_attr "id" "block-context-menu";
  ignore (Stub_dom.append_child owned_menu owned_item);
  check "the DOM fixture resolves selector lists through owned menu ancestry"
    (Option.is_some ((Ui_dom_web.el_of owned_item).Ui_services.closest
      "#missing-context-menu, #block-context-menu"));
  Stub_dom.set_field document "getElementById" (fun identifier ->
    if identifier="block-context-menu" then owned_menu
    else if identifier="cm-item-0" then owned_item else previous_menu_id identifier);
  Stub_dom.set_field document "querySelectorAll" (fun selector ->
    if selector=".ui__dropdown-menu-content" then [|foreign_menu|]
    else previous_menu_query selector);
  Fun.protect ~finally:(fun () ->
    Stub_dom.set_field document "querySelectorAll" previous_menu_query;
    Stub_dom.set_field document "getElementById" previous_menu_id;
    Stub_dom.set_field document "dispatchEvent" previous_menu_dispatch;
    Popups_state.active:=previous_context) (fun () ->
    let context_scheduler=Signal.scheduler () in
    let context=Popups_state.make context_scheduler in
    List.iter (fun key ->
      let consumed=ref false in
      Popups_view.handle_keydown context {(key_event key) with
        prevent_default=(fun () -> consumed:=true);
        stop_immediate=(fun () -> consumed:=true)};
      check ("a closed block menu cannot consume another menu's " ^ key)
        (not !consumed)) ["ArrowDown";"Enter"];
    check "block-menu listeners cannot focus or activate foreign menu items" (!foreign_actions=0);
    let cm : Popups_state.cm = {epoch=0;cx=0.;cy=0.;atop=0.;flip=false;block_id="context-fixture";scope="main";
      multi=false;entries=[Ci_item ("Action",None,"fixture-action")];
      sub_open=(-1);sub_xy=(0.,0.);highlighted=None;tag=None} in
    Signal.set context.vs {ac=None;cm=Some cm;pv=None};
    Signal.stabilize context_scheduler;
    let key_in target key =
      let consumed=ref false in
      Popups_view.handle_keydown context {(key_event key) with target=Some (Ui_dom_web.el_of target);
        prevent_default=(fun () -> consumed:=true);stop_immediate=(fun () -> consumed:=true)};
      !consumed in
    check "an open block menu cannot consume a foreign menu's navigation"
      (not (key_in foreign_item "ArrowDown"));
    check "the block menu keeps navigation for its own rows" (key_in owned_item "ArrowDown");
    check "the block menu keeps activation for its own rows" (key_in owned_item "Enter");
    check "owned context navigation and activation stay inside their menu" (!owned_actions=2));
  let previous_view_ops = !Views_state.ops_ref in
  let previous_popup_stack = !Views_popup.stack_st in
  Views_popup.stack_st := None;
  let refreshes = ref 0 in
  let fold_presses = ref 0 in
  let sorting_inst = ref None in
  let sorting = mount (fun _ context parent ->
      let sched = context.Lui_ui.ui_scheduler in
      let view = Option.get (Views_wire.decode_view_ent (Wire.Map
        [Wire.kw "block/uuid", Wire.Uuid "sort-parity";
         Wire.kw "db/id", Wire.Int 42;
         Wire.kw "block/title", Wire.String (I18n.t "view/all")])) in
      let created = Views_state.make ~sched ~kind:Views_state.KAllPages
          ~feature:"all-pages" ~owner:Wire.Nil in
      let initial = { (Views_state.empty_vstate ()) with
        Views_state.view_uuid=view.vu; views=[view]; view_ent=Some view;
        items_count=7;
        columns=[(Views_table.updated_column ()); (Views_table.created_column ())];
        sorting=[{Views_state.s_id="block/updated-at"; s_asc=false};
                 {Views_state.s_id="block/created-at"; s_asc=true}] } in
      let inst = {created with Views_state.st=Signal.state sched initial} in
      sorting_inst := Some inst;
      Views_state.install_ops
        {o_refresh=(fun _ -> incr refreshes); o_refresh_src=(fun _ _ -> ());
         o_create_view=(fun _ -> ()); o_rename_box=(fun _ _ -> Lui_elements.spacer []);
         o_export=(fun _ -> ()); o_add_object=(fun _ -> ());
         o_title_of_uuid=(fun _ uuid -> uuid); o_load_more=(fun _ -> ());
         o_full_action_rows=(fun _ reply -> reply (Error "Full action rows are not installed"))};
      Views_head.sorting_popup inst (popup_anchor ());
      Lui_elements.column
        [Views_table.foldable inst ~key:"tab-fixture"
           ~title:(Views_head.render_head inst)
           ~body:(Lui_elements.spacer []);
         Page.fold_arrow ~on_click:(fun () -> incr fold_presses) "page-fold-fixture";
         Views_table.with_column_width inst (Views_table.created_column ())
           (Lui_elements.column ~accessibility_identifier:"table-width-fixture" []);
         Views_table.table_el inst initial;
         Views_table.grouped_table inst ~rows:[];
         (fun context parent ->
           let grouped = Views_state.make ~sched:context.Lui_ui.ui_scheduler
             ~kind:(Views_state.KQuery {block_uuid="group-query-fixture"}) ~feature:"query" ~owner:Wire.Nil in
           let state = Views_state.empty_vstate () in
           Hashtbl.replace state.Views_state.ref_titles "group-journal-fixture" "T94 Journal";
           Hashtbl.replace state.Views_state.blocks "group-row-fixture"
             (Wire.Map [Wire.kw "block/title", Wire.String "Grouped row"]);
           let state = {state with Views_state.loading=false;
             columns=[Views_table.select_column ();Views_table.created_column ()];
             data=Views_wire.VFlat {rows=["group-row-fixture"];count=1;
               previews=Hashtbl.create 0;qprops=[]}} in
           Signal.set grouped.Views_state.st state;
           Lui_elements.column
             [ Lui_elements.column ~accessibility_identifier:"flat-select-fixture"
                 [Views_table.table_el grouped state]
             ; Lui_elements.column ~accessibility_identifier:"grouped-select-fixture"
                 [Views_table.grouped_table grouped ~rows:["group-row-fixture"]]
             ; Lui_elements.column ~accessibility_identifier:"pages-select-fixture"
                 [Views_table.table_el {grouped with Views_state.kind=Views_state.KAllPages} state]
             ; Views_table.table_group_heading grouped state
                 (Wire.Map [Wire.kw "kind", Wire.Keyword "entity"; Wire.kw "uuid", Wire.Uuid "group-journal-fixture"])
             ; Views_table.table_group_heading grouped state Wire.Nil
             ; Views_table.table_group_heading grouped state
                 (Wire.Map [Wire.kw "kind", Wire.Keyword "entity"; Wire.kw "uuid", Wire.Uuid "unavailable-group-fixture"]) ]
             context parent);
         Views_builder.clause_el (Views_builder.editor_of_inst inst ~active:(fun () -> true))
           ~tree:(ref (Views_builder.COp ("and",[]))) ~loc:[99]
           (Views_builder.CText "Wrapping clause fixture");
         Views_builder.editor_el (Views_builder.editor_of_inst inst ~active:(fun () -> true))
           ~tree:(ref (Views_builder.COp ("and", [Views_builder.CText "Alignment fixture";
             Views_builder.CText "Second alignment fixture"])));
         Views_view.query_content inst {initial with loading=false;qsrc="(between [[Nov 18th, 2026]] [[Nov 20th, 2026]])"};
         popup_layer]
        context parent) in
  let inst = Option.get !sorting_inst in
  let empty_query = {(Views_state.empty_vstate ()) with loading=false;qsrc="(between [[Nov 18th, 2026]] [[Nov 20th, 2026]])"} in
  check "Empty raw DSL results display Master's no-result message without a table"
    (Views_view.query_content_key empty_query=`Empty
     && List.exists (fun n -> M.string_prop n "text"=Some (I18n.t "search/no-result")) (nodes sorting)
     && not (List.exists (fun n -> class_has n "query-result") (nodes sorting)));
  check "Raw block results retain the query view even when its filtered rows are empty"
    (Views_view.query_content_key {empty_query with qsrc="Search seed parity";query_rows=["self-match"]}=`Table);
  check "Loading, blank and failed queries do not display the settled empty state"
    (Views_view.query_content_key {empty_query with loading=true}=`Loading
     && Views_view.query_content_key {empty_query with qsrc=""}=`Blank
     && Views_view.query_content_key {empty_query with query_error=Some "query unavailable"}=`Error "query unavailable");
  let cell = List.find (fun n -> M.string_prop n "accessibility-identifier"=Some "table-width-fixture") (nodes sorting) in
  check "The final table column retains both its own width and minimum"
    (Hashtbl.find_opt cell.M.props "min-width"=Some (P.IntValue 160)
     && Hashtbl.find_opt cell.M.props "width"=Some (P.IntValue 160));
  let header = List.find (fun n -> class_has n "ls-table-header") (nodes sorting) in
  let parent node = List.find (fun n -> Some n.M.id=node.M.parent) (nodes sorting) in
  check "The real empty-table header overlay fills a column parent instead of shrink-to-fit"
    ((parent header).M.kind="overlay" && (parent (parent header)).M.kind="column");
  check "Grouped table frames can shrink to the viewport without clipping sticky body cells"
    (List.exists (fun n -> n.M.kind="column"
       && Hashtbl.find_opt n.M.props "min-width"=Some (P.IntValue 0)
       && List.exists (fun child -> child.M.kind="overlay") (M.children sorting.S.tree n.M.id))
       (nodes sorting));
  let body_of identifier =
    let root = List.find (fun n -> M.string_prop n "accessibility-identifier"=Some identifier) (nodes sorting) in
    let rec find node =
      if class_has node "ls-table-row" then Some node
      else List.find_map find (M.children sorting.S.tree node.M.id)
    in
    Option.get (find root)
  in
  check "Flat query rows clip sticky body cells just like Master's indexed item wrappers"
    (M.string_prop (body_of "flat-select-fixture") "overflow"=Some "hidden");
  check "Grouped query rows preserve sticky body cells while Pages rows still scroll away"
    (M.string_prop (body_of "grouped-select-fixture") "overflow"=None
     && M.string_prop (body_of "pages-select-fixture") "overflow"=Some "hidden");
  let journal = List.find (fun n -> M.string_prop n "text"=Some "group-journal-fixture") (nodes sorting) in
  let attr node key = List.assoc_opt key (P.data_attrs_decode
    (Option.value (M.string_prop node "data-attrs") ~default:"")) in
  check "Entity table group headings use the navigating page-reference target and link color"
    (class_has journal "page-ref"
     && attr journal "data-uuid"=Some "group-journal-fixture"
     && M.string_prop journal "foreground"=Some "var(--lx-accent-11, var(--ls-link-text-color))");
  check "Empty and unavailable table groups do not fabricate reference links"
    (not (List.exists (fun n -> attr n "data-uuid"=Some "unavailable-group-fixture") (nodes sorting)));
  let handle = List.find (fun n -> class_has n "ls-table-resize-handle") (nodes sorting) in
  check "The four-pixel resize handle extends one pixel beyond the header edge"
    (Hashtbl.find_opt handle.M.props "width"=Some (P.IntValue 4)
     && Hashtbl.find_opt handle.M.props "min-width"=Some (P.IntValue 4)
     && Hashtbl.find_opt handle.M.props "inset-right"=Some (P.FloatValue (-1.)));
  let operator = List.find (fun n -> class_has n "query-clause"
    && M.string_prop n "text"=Some "AND") (nodes sorting) in
  let group = parent operator in
  check "The first clause line is not lowered by the taller adjacent Filter control"
    (M.string_prop (parent group) "cross"=Some "start");
  check "Query operators have no button padding or inline-wrapper baseline gap"
    (Hashtbl.find_opt operator.M.props "padding-horizontal"=Some (P.IntValue 0)
     && Hashtbl.find_opt operator.M.props "padding-vertical"=Some (P.IntValue 0)
     && M.string_prop operator "height"=Some "auto"
     && group.M.kind="row");
  check "Query groups share Master's fourteen-pixel text and twenty-pixel line height"
    (M.string_prop group "font-size"=Some "0.875rem"
     && M.string_prop group "line-height"=Some "1.25rem");
  let clause = List.find (fun n -> Option.fold ~none:false ~some:(fun text ->
    Str_util.contains text "Wrapping clause fixture") (M.string_prop n "text")) (nodes sorting) in
  check "Operator and clause text use Master's theme-aware primary and hover colors"
    (List.for_all (fun node ->
       M.string_prop node "foreground"=Some "var(--ls-primary-text-color)"
       && M.string_prop node "hover-foreground"=Some "var(--ls-secondary-text-color)")
       [operator;clause]);
  check "Query clause text uses normal weight and wraps without a fixed line height"
    (Hashtbl.find_opt clause.M.props "font-weight"=Some (P.IntValue 400)
     && M.string_prop clause "white-space"=Some "normal"
     && M.string_prop clause "height"=Some "auto");
  let tab = List.find (fun n -> class_has n "ls-view-tab") (nodes sorting) in
  check "Pages preserves the default All view title"
    (M.string_prop tab "accessibility-label" = Some (I18n.t "view/all"));
  check "view tabs use the reference's unpadded text button"
    (Hashtbl.find_opt tab.M.props "padding-horizontal" = Some (P.IntValue 0)
     && Hashtbl.find_opt tab.M.props "padding-vertical" = Some (P.IntValue 0));
  let tab_children = M.children sorting.S.tree tab.M.id in
  let icon_wrap = List.find (fun n -> class_has n "ls-icon-color-wrap") tab_children in
  check "view icon spacing belongs to the button gap alone"
    (not (Hashtbl.mem icon_wrap.M.props "margin-right"));
  let view_icon = List.hd (M.children sorting.S.tree icon_wrap.M.id) in
  check "view tabs match the reference's fifteen-point icon"
    (Hashtbl.find_opt view_icon.M.props "width" = Some (P.IntValue 15)
     && Hashtbl.find_opt view_icon.M.props "height" = Some (P.IntValue 15));
  let count = List.find (fun n -> M.string_prop n "text" = Some "7") tab_children in
  check "view counts use their own small-text line height without duplicate spacing"
    (M.string_prop count "line-height" = Some "1rem"
     && not (Hashtbl.mem count.M.props "margin-left"));
  check "view counts use the current theme's valid muted foreground"
    (M.string_prop count "foreground" = Some "hsl(var(--muted-foreground))");
  let tabs = List.find (fun n -> class_has n "views") (nodes sorting) in
  check "view tabs and Add view use the reference's eight-point row gap"
    (Hashtbl.find_opt tabs.M.props "gap" = Some (P.IntValue 8));
  let add_view = List.find (fun n -> class_has n "ls-add-view") (nodes sorting) in
  check "Add view uses the same semantic muted foreground as the reference"
    (M.string_prop add_view "foreground" = Some "hsl(var(--muted-foreground))");
  check "Add view offset is portable typed geometry"
    (Hashtbl.find_opt add_view.M.props "margin-left" = Some (P.IntValue (-4))
     && not (Hashtbl.mem add_view.M.props "data-attrs"));
  check "Add view matches the reference's fifteen-point icon"
    (List.exists (fun n -> n.M.kind = "icon"
      && Hashtbl.find_opt n.M.props "width" = Some (P.IntValue 15))
      (M.children sorting.S.tree add_view.M.id));
  let toolbar = List.find (fun n -> n.M.kind = "toolbar"
    && M.string_prop n "accessibility-label" = Some "View actions") (nodes sorting) in
  check "view toolbar wrapper uses flex layout without an inline baseline gap"
    (match toolbar.M.parent with
     | Some id -> (List.find (fun n -> n.M.id = id) (nodes sorting)).M.kind = "row"
     | None -> false);
  check "flat toolbar chrome is portable typed geometry"
    (M.string_prop toolbar "background" = Some "transparent"
     && Hashtbl.find_opt toolbar.M.props "padding" = Some (P.IntValue 0)
     && Hashtbl.find_opt toolbar.M.props "border-width" = Some (P.IntValue 0)
     && not (Hashtbl.mem toolbar.M.props "data-attrs"));
  let rec toolbar_descendants node =
    List.concat_map (fun n -> n :: toolbar_descendants n)
      (M.children sorting.S.tree node.M.id) in
  let toolbar_buttons = List.filter (fun n -> n.M.kind = "button")
    (toolbar_descendants toolbar) in
  eqi "view actions include sort, filter, search, type and more" 5 (List.length toolbar_buttons);
  List.iter (fun n ->
    check "view actions match the reference's centered twenty-four-point hit area"
      (Hashtbl.find_opt n.M.props "width" = Some (P.IntValue 24)
       && Hashtbl.find_opt n.M.props "height" = Some (P.IntValue 24));
    check "view action glyphs use the effective eighteen-point reference size"
      (List.exists (fun child -> child.M.kind = "icon"
        && Hashtbl.find_opt child.M.props "width" = Some (P.IntValue 18))
        (M.children sorting.S.tree n.M.id))) toolbar_buttons;
  List.iter (fun n ->
    List.iter (fun child ->
      if child.M.kind="icon" then
        check "view action glyphs use application assets rather than a second icon family"
          (match M.string_prop child "name" with
           | Some name -> String.starts_with ~prefix:"app:" name | None -> false))
      (M.children sorting.S.tree n.M.id)) toolbar_buttons;
  check "view search uses one supported control group with no internal gap"
    (List.exists (fun n -> n.M.kind = "button-group"
      && class_has n "view-action-search"
      && Hashtbl.find_opt n.M.props "gap" = Some (P.IntValue 0))
      (toolbar_descendants toolbar));
  let search_group = List.find (fun n -> class_has n "view-action-search")
    (toolbar_descendants toolbar) in
  check "view search has transparent group chrome on every host"
    (M.string_prop search_group "background" = Some "transparent"
     && Hashtbl.find_opt search_group.M.props "border-width" = Some (P.IntValue 0)
     && Hashtbl.find_opt search_group.M.props "corner-radius" = Some (P.IntValue 0));
  let search_action = List.find (fun n -> M.string_prop n "accessibility-label"
    = Some (I18n.t "cmdk.action/search")) toolbar_buttons in
  S.press sorting search_action.M.id;
  let search_input = List.find (fun n -> M.string_prop n "placeholder"
    = Some (I18n.t "view.filter/type-to-search")) (nodes sorting) in
  check "view search shares the measured reference width and padding across hosts"
    (Hashtbl.find_opt search_input.M.props "width" = Some (P.IntValue 190)
     && Hashtbl.find_opt search_input.M.props "padding-horizontal" = Some (P.IntValue 12));
  check "expanded search input stays inside its control group"
    (match search_input.M.parent with
     | Some id -> (List.find (fun n -> n.M.id = id) (nodes sorting)).M.kind = "button-group"
     | None -> false);
  let close_search = List.find (fun n -> n.M.kind = "button"
    && M.string_prop n "accessibility-label" = Some (I18n.t "ui/close"))
    (toolbar_descendants toolbar) in
  S.press sorting close_search.M.id;
  check "closing grouped view search restores its collapsed state"
    (not (Views_state.get inst).search_open
     && not (List.exists (fun n -> n.M.id = search_input.M.id) (nodes sorting)));
  refreshes := 0;
  let fold_controls = List.filter (fun n -> class_has n "ls-foldable-title-control")
    (nodes sorting) in
  eqi "both page and view fold controls share the fixture" 2 (List.length fold_controls);
  List.iter (fun n ->
    check "fold controls include the reference's block-control geometry"
      (Hashtbl.find_opt n.M.props "width" = Some (P.IntValue 22)
       && Hashtbl.find_opt n.M.props "height" = Some (P.IntValue 22)
       && Hashtbl.find_opt n.M.props "padding" = Some (P.IntValue 2)
       && Hashtbl.find_opt n.M.props "margin-top" = Some (P.IntValue 1)))
    fold_controls;
  List.iter (fun n -> S.press sorting n.M.id) fold_controls;
  eqi "shared page fold geometry preserves its press action" 1 !fold_presses;
  check "shared view fold geometry preserves collapse behavior"
    (Views_state.Sset.mem "tab-fixture" (Views_state.get inst).collapsed_groups);
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
  (match List.find_opt (fun n -> M.string_prop n "text" = Some (I18n.t "view.table/ascending")) (options ()) with
   | Some option -> S.press sorting option.M.id
   | None -> check "ascending sort option is available" false);
  check "choosing ascending updates sorting" (List.hd (Views_state.get inst).sorting).s_asc;
  eqi "choosing a direction refreshes exactly once" 1 !refreshes;
  check "choosing direction updates the retained trigger label"
    (M.string_prop (order ()) "text" = Some (I18n.t "view.table/ascending"));
  check "choosing direction closes only its option list"
    (options () = [] && List.length !Views_popup.open_popups = parent_popups);
  S.press sorting (order ()).M.id;
  (match List.find_opt (fun n -> M.string_prop n "text" = Some (I18n.t "view.table/ascending")) (options ()) with
   | Some option -> S.press sorting option.M.id
   | None -> ());
  eqi "reselecting the current direction does not refresh" 1 !refreshes;
  S.press sorting (order ()).M.id;
  (match List.find_opt (fun n -> M.string_prop n "text" = Some (I18n.t "view.table/descending")) (options ()) with
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
  Views_head.sorting_popup inst (popup_anchor ());
  S.flush sorting;
  let delete = List.find (fun n -> class_has n "ls-sort-delete") (nodes sorting) in
  check "Delete sort closes the complete sorting configuration safely"
    (try S.press sorting delete.M.id;
       (Views_state.get inst).sorting = [] && !Views_popup.open_popups = []
     with _ -> false);
  Views_popup.close_all ();
  let selected_items = ref [] and applied_items = ref [] in
  let choices = List.init 30 (fun i ->
    {Views_popup.si_label=Printf.sprintf "Choice %02d" i;
     si_value=string_of_int i;si_extra=None}) in
  let open_choices ?(multiple=false) items =
    Views_popup.show_select ~anchor:(popup_anchor ()) ~items:(Views_popup.fixed_items items)
      ~placeholder:"Choice" ~multiple
      ~on_chosen:(fun item checked _ -> selected_items := !selected_items @ [item.Views_popup.si_value, checked])
      ~on_apply:(fun items -> applied_items := items) ();
    S.flush sorting in
  let choice_rows () = List.filter (fun n -> class_has n "ls-view-select-option") (nodes sorting) in
  let choice_input () = List.find (fun n -> n.M.kind="input"
    && M.string_prop n "placeholder"=Some "Choice") (nodes sorting) in
  open_choices choices;
  eqi "view select exposes every option as a portable interactive row" 30 (List.length (choice_rows ()));
  check "view select rows share a bounded scrolling list"
    (List.exists (fun n -> n.M.kind="list"
      && Hashtbl.find_opt n.M.props "height"=Some (P.IntValue 280)) (nodes sorting));
  check "view select labels use portable text nodes"
    (List.exists (fun n -> n.M.kind="text"
      && M.string_prop n "text"=Some "Choice 00") (nodes sorting));
  List.iter (fun (mode, expected) ->
    check "view select active background follows the reference theme mode"
      (List.assoc_opt "--lx-select-active-bg" (Ui_theme.snapshot mode).vars = Some expected))
    [Ui_theme.Light,"var(--lx-gray-03)";Ui_theme.Dark,"var(--lx-gray-02)"];
  let select_input = choice_input () in
  navigate sorting select_input (P.NavigateNext select_input.M.id);
  S.submit sorting select_input.M.id;
  check "native and web select navigation submit the next result exactly once"
    (!selected_items=["1",true] && !Views_popup.open_popups=[]);
  open_choices choices;
  let select_input = choice_input () in
  S.text_changed sorting select_input.M.id "Choice 29";
  eqi "view select query filters its portable result rows" 1 (List.length (choice_rows ()));
  S.submit sorting select_input.M.id;
  check "view select submits the filtered result" (List.nth_opt (List.rev !selected_items) 0 = Some ("29",true));
  let chosen_language = ref None in
  Views_popup.show_code_language_picker ~anchor:(popup_anchor ())
    ~languages:["JavaScript";"Python"] ~on_choose:(fun name -> chosen_language:=Some name);
  S.flush sorting;
  let language_input = List.find (fun n -> n.M.kind="input"
    && M.string_prop n "placeholder"=Some (I18n.t "editor/code-language-placeholder")) (nodes sorting) in
  S.text_changed sorting language_input.M.id "Java";
  check "Code language search narrows the available modes"
    (List.length (choice_rows ())=1);
  S.submit sorting language_input.M.id;
  check "Code language search submits the selected language and dismisses"
    (!chosen_language=Some "JavaScript" && !Views_popup.open_popups=[]);
  Views_popup.show_code_language_picker ~anchor:(popup_anchor ()) ~languages:[]
    ~on_choose:(fun name -> chosen_language:=Some name);
  S.flush sorting;
  let language_input = List.find (fun n -> n.M.kind="input"
    && M.string_prop n "placeholder"=Some (I18n.t "editor/code-language-placeholder")) (nodes sorting) in
  S.text_changed sorting language_input.M.id "Missing language";
  S.submit sorting language_input.M.id;
  check "An empty code language search cannot invent a mode"
    (!chosen_language=Some "JavaScript" && choice_rows ()=[]);
  open_choices [];
  let select_input = choice_input () in
  navigate sorting select_input (P.NavigateNext select_input.M.id);
  let before_empty = !selected_items in
  S.submit sorting select_input.M.id;
  check "empty view select does not submit a stale result" (!selected_items=before_empty);
  check "empty view select displays the shared no-result message"
    (List.exists (fun n -> n.M.kind="text"
      && M.string_prop n "text"=Some (I18n.t "search/no-result")) (nodes sorting));
  open_choices ~multiple:true choices;
  (match choice_rows () with
   | row::_ -> S.press sorting row.M.id; S.press sorting row.M.id; S.press sorting row.M.id
   | [] -> check "multiple view select has interactive rows" false);
  check "multiple view select toggles values while retaining its popup"
    ((match List.rev !selected_items with
      | ("0",true)::("0",false)::("0",true)::_ -> true | _ -> false)
     && !Views_popup.open_popups<>[]);
  (match List.find_opt (fun n -> n.M.kind="button"
     && M.string_prop n "text"=Some (I18n.t "ui/apply")) (nodes sorting) with
   | Some apply -> S.press sorting apply.M.id
   | None -> check "multiple view select exposes its apply action" false);
  check "multiple view select applies exactly the checked values and closes"
    (!applied_items=["0"] && !Views_popup.open_popups=[]);
  Views_popup.close_all ();
  let rename_error = ref "" in
  let rename =
    try Some (mount (fun _ -> Views_view.rename_editor_box inst
      (Option.get (Views_state.get inst).view_ent)))
    with Invalid_argument reason -> rename_error:=reason;None in
  check ("view rename input only uses supported component properties: " ^ !rename_error) (Option.is_some rename);
  Option.iter (fun editor ->
    let input=List.find (fun n -> n.M.kind="input") (nodes editor) in
    check "view rename uses a portable stretchable layout"
      (List.exists (fun n -> n.M.kind="column"
        && Hashtbl.find_opt n.M.props "padding"=Some (P.IntValue 8)) (nodes editor));
    S.text_changed editor input.M.id "Renamed view";
    check "view rename retains the focused input while typing"
      (List.exists (fun n -> n.M.id=input.M.id) (nodes editor));
    ignore (Lui_app.dispose editor.S.app)) rename;
  Views_builder.full_text_picker
    (Views_builder.editor_of_inst inst ~active:(fun () -> true))
    ~tree:(ref (Views_builder.COp ("and",[])))
    ~loc:[] ~anchor:(popup_anchor ());
  let full_text_rendered = try S.flush sorting;true with Invalid_argument _ -> false in
  check "query builder full-text input only uses supported component properties" full_text_rendered;
  Views_popup.close_all ();
  let () =
    let saved = ref [] and active = ref true in
    let editor = { (Views_builder.editor_of_inst inst ~active:(fun () -> !active)) with
      save=(fun clause -> saved := Views_builder.tree_to_dsl clause :: !saved) } in
    let open_range () =
      Views_builder.between_picker editor ~tree:(ref (Views_builder.COp ("and",[])))
        ~loc:[0] ~anchor:(popup_anchor ()); S.flush sorting
    in
    let press label =
      match List.find_opt (fun n -> n.M.kind="button" && M.string_prop n "text"=Some label) (nodes sorting) with
      | Some node -> S.press sorting node.M.id
      | None -> check ("Between exposes " ^ label) false
    in
    let pick () =
      match List.find_opt (fun n -> M.string_prop n "accessibility-identifier"=Some "calendar-date-input") (nodes sorting) with
      | Some input -> S.text_changed sorting input.M.id "2026-11-19";S.submit sorting input.M.id
      | None -> check "Between date field opens a retained calendar" false
    in
    open_range ();
    check "Between opens Start / End / Submit without forcing a calendar"
      (List.for_all (fun label -> List.exists (fun n -> M.string_prop n "text"=Some label) (nodes sorting))
        [I18n.t "query.builder/between-start-label";I18n.t "query.builder/between-end-label";I18n.t "ui/submit"]
       && not (List.exists (fun n -> M.string_prop n "accessibility-identifier"=Some "calendar-date-input") (nodes sorting)));
    press (I18n.t "ui/submit");
    check "An empty Between range does not submit or dismiss" (!saved=[] && List.length !Views_popup.open_popups=1);
    press (I18n.t "query.builder/between-start-label");
    S.flush sorting;
    check "Between keeps its range form mounted beneath the selected date calendar"
      (let calendar = List.find (fun n -> M.string_prop n "accessibility-identifier"=Some "calendar-date-input") (nodes sorting) in
       let rec owners node =
         match node.M.parent with
         | None -> 0
         | Some id -> let parent=Hashtbl.find sorting.S.tree.M.nodes id in
             (if parent.M.kind="popover" then 1 else 0) + owners parent
       in owners calendar=2);
    pick ();
    check "Picking the start date returns to End date without auto-opening another calendar"
      (!saved=[] && List.length !Views_popup.open_popups=1
       && List.exists (fun n -> M.string_prop n "text"=Some (I18n.t "query.builder/between-end-label")) (nodes sorting));
    press (I18n.t "ui/submit");
    check "A partial Between range waits for its second date" (!saved=[]);
    press (I18n.t "query.builder/between-end-label");pick ();
    check "Both Between dates remain uncommitted until Submit" (!saved=[]);
    press (I18n.t "ui/submit");
    let title = Dates.journal_title_of (Dates.make ~year:2026 ~month:11 ~day:19 ()) in
    check "Between submits the two selected journal dates and dismisses the range"
      (!saved=["(between [[" ^ title ^ "]] [[" ^ title ^ "]])"] && !Views_popup.open_popups=[]);
    saved:=[];open_range ();press (I18n.t "query.builder/between-start-label");
    active:=false;pick ();
    check "A retired query cannot receive a date or submit a stale Between clause" (!saved=[]);
    Views_popup.close_all ()
  in
  let () =
    let uuid = "00000000-0000-0000-0000-000000000091" in
    let cache_key = Runtime.repo (),uuid in
    let previous_stack = !Views_popup.stack_st in
    Views_popup.stack_st:=None;
    let owner = mount (fun _ -> Lui_elements.column
      [Views_view.query_title_el ~block_uuid:uuid ~title:None;popup_layer]) in
    let previous_id : string -> Js.Json.t = Stub_dom.get_field document "getElementById" in
    let trigger = Stub_dom.make_element "button" in
    let attr : string -> string -> unit = Stub_dom.get_field trigger "setAttribute" in
    Stub_dom.set_field document "getElementById" (fun id -> attr "id" id;trigger);
    Fun.protect ~finally:(fun () ->
      Stub_dom.set_field document "getElementById" previous_id;
      Views_popup.close_all ();
      ignore (Lui_app.dispose owner.S.app);
      Option.iter Views_builder.drop_tree (Hashtbl.find_opt Views_view.query_insts cache_key);
      Hashtbl.remove Views_view.query_insts cache_key;
      Views_popup.stack_st:=previous_stack;
      Runtime.app_flush:=(fun () -> S.flush sorting)) (fun () ->
      let press label =
        let node = List.find (fun n -> button_label n=Some label) (nodes owner) in
        S.press owner node.M.id in
      press (I18n.t "view.filter/filter");
      press (Views_builder.item_label "between");
      press (I18n.t "query.builder/between-start-label");
      let input = List.find (fun n -> M.string_prop n "accessibility-identifier"=Some "calendar-date-input") (nodes owner) in
      let query = Hashtbl.find Views_view.query_insts cache_key in
      Views_state.update query (fun s -> {s with loading=not s.loading;query_rows=["refresh-row"]});
      check "A query result refresh does not unmount the active Between calendar"
        (List.exists (fun n -> n.M.id=input.M.id) (nodes owner));
      S.text_changed owner input.M.id "2026-11-19";
      S.submit owner input.M.id;
      let title = Dates.journal_title_of (Dates.make ~year:2026 ~month:11 ~day:19 ()) in
      check "A date remains selectable after its query builder rerenders for result data"
        (List.exists (fun n -> M.string_prop n "text"=Some title) (nodes owner)
         && not (List.exists (fun n -> M.string_prop n "text"=Some (I18n.t "query.builder/between-start-label")) (nodes owner)));
      press (I18n.t "query.builder/between-end-label");
      let input = List.find (fun n -> M.string_prop n "accessibility-identifier"=Some "calendar-date-input") (nodes owner) in
      Views_state.update query (fun s -> {s with qsrc="\"replacement\""});
      S.text_changed owner input.M.id "2026-11-20";S.submit owner input.M.id;
      check "Changing the query source retires its older date range draft"
        (List.exists (fun n -> M.string_prop n "text"=Some (I18n.t "query.builder/between-end-label")) (nodes owner));
      press (I18n.t "ui/submit");
      check "A stale Between form cannot overwrite a newer query source"
        ((Views_state.get query).qsrc="\"replacement\""))
  in
  ignore (Lui_app.dispose sorting.S.app);
  Views_popup.stack_st := previous_popup_stack;
  Views_state.ops_ref := previous_view_ops;
  let previous_cmdk =
    (!Cmdk_state.latest_vs, !Cmdk_state.latest_t, !Cmdk_state.latest_st,
     !Cmdk_state.services_ref)
  in
  let handlers : Cmdk_services.handlers option ref = ref None in
  let shortcut_actions = ref 0 in
  let shortcut_dialogs = ref [] in
  let highlight_toggles = ref 0 in
  let routed_commands = ref [] and legacy_selection = ref 0 in
  let services =
    { (Cmdk_host.services ()) with
      repo = (fun () -> None)
    ; focus_input_init = (fun _ -> ())
    ; install_listeners = (fun _scope h -> handlers := Some h)
    ; toggle_left_sidebar = (fun () -> incr shortcut_actions)
    ; dialogs_open = (fun name -> shortcut_dialogs := name :: !shortcut_dialogs)
    ; settings_toggle_recent = (fun () -> incr highlight_toggles)
    ; dialogs_is_open = (fun _ -> false)
    ; editor_command = (fun cid -> routed_commands := cid :: !routed_commands)
    ; extend_selection = (fun _ -> incr legacy_selection)
    ; move_selection_focus = (fun _ -> incr legacy_selection)
    ; move_blocks_vert = (fun _ -> incr legacy_selection)
    ; toggle_collapse = (fun _ -> incr legacy_selection)
    ; set_collapsed = (fun _ _ -> incr legacy_selection)
    }
  in
  let search = mount (fun ms -> Cmdk_view.render ~services ms) in
  let search_st = Option.get !Cmdk_state.latest_t in
  let footer_effects = ref [] in
  let record_effect value = footer_effects := value :: !footer_effects in
  let footer_services =
    { services with
      repo = (fun () -> Some "footer-fixture")
    ; invoke = (fun name _ -> record_effect name;
        Ui_task.create (fun ~resolve:_ ~reject:_ -> ()))
    ; create_page_op = (fun title -> record_effect ("page:" ^ title); Wire.Nil)
    ; create_class_op = (fun title -> record_effect ("tag:" ^ title); Wire.Nil)
    ; nav_hash = (fun hash -> record_effect hash; hash)
    ; sidebar_open_uuid = (fun uuid -> record_effect ("sidebar:" ^ uuid))
    ; toggle_left_sidebar = (fun () -> record_effect "toggle-sidebar")
    ; editor_ready = (fun () -> true)
    ; selected_uuids = (fun () -> ["moving-block"])
    ; editing_uuid = (fun () -> None)
    ; clear_selection = (fun () -> ())
    ; move_blocks_bottom_op = (fun uuids target ->
        record_effect (String.concat "," uuids ^ "->" ^ target); Wire.Nil)
    ; apply_ops = (fun _ -> Ui_task.resolve ())
    ; exit_edit = (fun () -> ())
    ; mark_nav = (fun () -> ())
    }
  in
  let footer_state = ref None in
  let footer = mount (fun _ ctx parent ->
    let st = Cmdk_state.make ~register:false ctx.Lui_ui.ui_scheduler footer_services in
    footer_state := Some st;
    Cmdk_view.hints footer_services st ctx parent) in
  let footer_st = Option.get !footer_state in
  List.iter (fun cid ->
    let previous = !routed_commands in
    Option.iter (fun run -> run ()) (Cmdk_state.editor_action footer_st cid);
    check ("Editor command delegates to mode-aware dispatch: " ^ cid)
      (!routed_commands=cid :: previous && !legacy_selection=0))
    ["editor/select-up";"editor/select-down";
     "editor/select-block-up";"editor/select-block-down";
     "editor/move-block-up";"editor/move-block-down";
     "editor/collapse-block-children";"editor/expand-block-children";"editor/toggle-block-children"];
  let item index action : Cmdk_state.item =
    { ikey = string_of_int index; idx = index; gid = G_nodes;
      ititle = "Footer result"; info = None; header = None; iicon = None; inline_icon = None;
      isc = ""; ibadge = No_badge; act = action; ihl = false;
      imouse = false; iq = "" }
  in
  let select ?(move = false) items index =
    Cmdk_state.set footer_st
      { Cmdk_state.initial_view with open_ = true; hl = index; move_mode = move;
        groups = [{ gid = G_nodes; gtitle = "Results"; gitems = items;
          gtotal = List.length items; glimit = 10; gexpanded = false;
          gfilter_active = false }] };
    S.flush footer;
    footer_effects := []
  in
  let footer_button key = List.find (fun n ->
    M.string_prop n "accessibility-label" = Some (I18n.t key)) (nodes footer) in
  let press_footer key = S.press footer (footer_button key).M.id in
  List.iter (fun (meta, ctrl, shift) ->
    select [item 0 (Run "ui/toggle-left-sidebar")] 0;
    let answer = Cmdk_view.handle_keydown footer_st
      {key="Enter"; meta; ctrl; shift; alt=false; composing=true} in
    check "IME confirmation preserves the palette without dispatching Enter actions"
      (!footer_effects = [] && (Cmdk_state.get footer_st).open_
       && not answer.prevent && not answer.stop))
    [false, false, false; true, false, false; false, true, false;
     false, false, true];
  List.iter (fun (action, expected) ->
    select [item 0 action] 0;
    press_footer "cmdk.action/create";
    check ("footer Create dispatches " ^ expected)
      (List.mem expected !footer_effects
       && List.mem "thread-api/apply-outliner-ops" !footer_effects
       && not (Cmdk_state.get footer_st).open_))
    [Create_page "Page title", "page:Page title";
     Create_tag "Tag", "tag:Tag"];
  select [item 0 (Run "ui/toggle-left-sidebar")] 0;
  press_footer "cmdk.action/trigger";
  check "footer Trigger executes its command once"
    (List.filter ((=) "toggle-sidebar") !footer_effects = ["toggle-sidebar"]);
  select [item 0 (Set_filter G_commands)] 0;
  press_footer "cmdk.action/filter";
  check "footer Filter applies the selected filter without closing"
    ((Cmdk_state.get footer_st).filter = Some G_commands
     && (Cmdk_state.get footer_st).open_);
  let pages = [item 0 (Open_page "first-page"); item 1 (Open_page "second-page")] in
  let previous_active : Js.Json.t = Stub_dom.get_field document "activeElement" in
  let previous_query : string -> Js.Json.t = Stub_dom.get_field document "querySelector" in
  let search_input = Stub_dom.make_element "input"
  and footer_action = Stub_dom.make_element "button" in
  Stub_dom.set_field search_input "closest" (fun selector ->
    if selector=".cp__cmdk-search-input" then search_input else Js.Json.null);
  Stub_dom.set_field footer_action "focus" (fun () ->
    Stub_dom.set_field document "activeElement" footer_action);
  let has_footer = ref true in
  Stub_dom.set_field document "querySelector" (fun selector ->
    if selector=".cp__cmdk__modal .cp__cmdk-hint" then
      (if !has_footer then footer_action else Js.Json.null)
    else previous_query selector);
  Fun.protect ~finally:(fun () ->
    Stub_dom.set_field document "activeElement" previous_active;
    Stub_dom.set_field document "querySelector" previous_query) (fun () ->
    select pages 0;
    Stub_dom.set_field document "activeElement" search_input;
    let tab shift = Cmdk_view.handle_keydown footer_st
      {key="Tab";meta=false;ctrl=false;shift;alt=false;composing=false} in
    let answer = tab false in
    check "Tab from palette search transfers focus to the footer action"
      (answer.prevent && answer.stop
       && Stub_dom.get_field document "activeElement" == footer_action);
    Stub_dom.set_field document "activeElement" search_input;
    check "Reverse Tab retains default focus traversal" (not (tab true).prevent);
    has_footer:=false;
    select [] (-1);
    check "An empty palette without footer actions does not swallow Tab"
      (not (tab false).prevent));
  let () =
  let window : Js.Json.t = Stub_dom.get_field Stub_dom.global "window" in
  let previous_timeout : Js.Json.t = Stub_dom.get_field window "setTimeout"
  and previous_clear : Js.Json.t = Stub_dom.get_field window "clearTimeout" in
  let previous_schedule = !Runtime.schedule_flush and previous_flush = !Runtime.app_flush
  and previous_pending = !Runtime.flush_pending in
  let previous_view = Cmdk_state.get search_st in
  let body : Js.Json.t = Stub_dom.get_field document "body" in
  let trigger = Stub_dom.make_element "button"
  and surface = Stub_dom.make_element "div"
  and input = Stub_dom.make_element "input" in
  ignore (Stub_dom.append_child body trigger);
  ignore (Stub_dom.append_child body surface);
  ignore (Stub_dom.append_child surface input);
  let focus element = (Stub_dom.get_field element "focus" : unit -> unit) () in
  let pending = Queue.create () and cancelled = Hashtbl.create 4 and next_timer = ref 0 in
  let run_timer () =
    let id, callback = Queue.take pending in
    if not (Hashtbl.mem cancelled id) then callback () in
  let drain () = while not (Queue.is_empty pending) do run_timer () done in
  let was_open = ref previous_view.open_ in
  Fun.protect ~finally:(fun () ->
    Stub_dom.set_field window "setTimeout" previous_timeout;
    Stub_dom.set_field window "clearTimeout" previous_clear;
    Runtime.schedule_flush := previous_schedule; Runtime.app_flush := previous_flush;
    Runtime.flush_pending := previous_pending;
    Signal.set search_st.Cmdk_state.vs previous_view; S.flush search;
    Stub_dom.detach trigger; Stub_dom.detach surface;
    Stub_dom.set_field document "activeElement" previous_active) (fun () ->
    Stub_dom.set_field window "setTimeout" (fun callback _ ->
      incr next_timer; Queue.add (!next_timer, callback) pending; !next_timer);
    Stub_dom.set_field window "clearTimeout" (fun id -> Hashtbl.replace cancelled id ());
    Runtime.flush_pending := false;
    Runtime.schedule_flush := (fun callback -> ignore (Ui_services.timers_timeout callback 0));
    Runtime.app_flush := (fun () ->
      S.flush search;
      let open_ = (Cmdk_state.get search_st).open_ in
      if !was_open && not open_ then begin
        focus trigger;
        ignore (Ui_services.timers_timeout (fun () ->
          if Stub_dom.get_field document "activeElement" == body then focus trigger) 0)
      end;
      was_open := open_);
    let open_search items =
      Cmdk_state.set search_st {Cmdk_state.initial_view with open_=true;persist=false;
        groups=[{gid=G_nodes;gtitle="Results";gitems=items;gtotal=List.length items;
          glimit=10;gexpanded=false;gfilter_active=false}]};
      drain (); focus input in
    let escape () = ignore (Cmdk_view.handle_keydown search_st
      {key="Escape";meta=false;ctrl=false;shift=false;alt=false;composing=false}) in
    List.iter (fun items ->
      open_search items; escape (); drain ();
      check "Palette Escape focuses BODY after deferred host trigger restoration"
        (not (Cmdk_state.get search_st).open_
         && Stub_dom.get_field document "activeElement" == body)) [pages;[]];
    open_search pages; escape ();
    run_timer (); run_timer ();
    Cmdk_state.set search_st {Cmdk_state.initial_view with open_=true;persist=false};
    focus input; drain ();
    check "Reopening the palette cancels pending Escape body focus"
      ((Cmdk_state.get search_st).open_
       && Stub_dom.get_field document "activeElement" == input)) in
  List.iter (fun (action, shift, expected) ->
    select [item 0 action] 0;
    Cmdk_view.handle_click footer_st
      {search_button=false; inside_modal=true; item_key=Some "0"; shift};
    check "Document capture preserves pointer navigation modifiers"
      (!footer_effects = [expected] && not (Cmdk_state.get footer_st).open_))
    [Open_page "first-page", true, "sidebar:first-page";
     Open_block "first-block", true, "sidebar:first-block";
     Open_page "first-page", false, "#/page/first-page"];
  select [] (-1);
  Cmdk_view.handle_click footer_st
    {search_button=false; inside_modal=true; item_key=Some "0"; shift=true};
  check "An empty palette cannot dispatch a stale pointer result"
    (!footer_effects=[] && (Cmdk_state.get footer_st).open_);
  select pages 0;
  Cmdk_view.handle_click footer_st
    {search_button=false; inside_modal=true; item_key=Some "absent"; shift=true};
  check "Unknown document result keys do not navigate"
    (!footer_effects=[] && (Cmdk_state.get footer_st).open_);
  List.iter (fun (action, modifiers, expected) ->
    select [item 0 action] 0;
    let pointer = mount (fun _ context parent ->
      let value = Signal.state context.Lui_ui.ui_scheduler (item 0 action) in
      Cmdk_view.item_row footer_services footer_st (Signal.value value) context parent) in
    let target = List.find (fun node ->
      Option.fold ~none:false ~some:(fun attrs ->
        List.assoc_opt "data-cmdk-item" (P.data_attrs_decode attrs) = Some "true")
        (M.string_prop node "data-attrs")) (nodes pointer) in
    S.dispatch pointer (P.PressDetail (target.M.id,
      {x=0.;y=0.;modifiers;button=0;target_class=""}));
    check "cmdk pointer activation respects Shift without changing command actions"
      (List.mem expected !footer_effects && not (Cmdk_state.get footer_st).open_);
    let effects = !footer_effects in
    S.press pointer target.M.id;
    check "the following plain press cannot replay a closed cmdk result"
      (!footer_effects = effects);
    ignore (Lui_app.dispose pointer.S.app))
    [Open_page "first-page", 2, "sidebar:first-page";
     Open_page "first-page", 0, "#/page/first-page";
     Run "ui/toggle-left-sidebar", 2, "toggle-sidebar"];
  select [item 0 (Open_page "first-page"); item 1 (Create_page "New page")] 1;
  let fallback_open = List.find_opt (fun n ->
    M.string_prop n "accessibility-label" = Some (I18n.t "cmdk.action/open")) (nodes footer) in
  check "a create selection keeps the matched-result footer actions" (fallback_open <> None);
  Option.iter (fun button -> S.press footer button.M.id;
    check "fallback footer actions dispatch the live create selection"
      (List.mem "page:New page" !footer_effects
       && not (Cmdk_state.get footer_st).open_)) fallback_open;
  select pages 0;
  let open_id = (footer_button "cmdk.action/open").M.id in
  select pages 1;
  check "changing between page results retains the footer button"
    ((footer_button "cmdk.action/open").M.id = open_id);
  press_footer "cmdk.action/open";
  check "retained Open reads the latest highlighted page"
    (List.mem "#/page/second-page" !footer_effects
     && not (List.mem "#/page/first-page" !footer_effects)
     && not (Cmdk_state.get footer_st).open_);
  select ~move:true pages 1;
  press_footer "cmdk.action/open";
  check "footer primary action preserves move-block mode"
    (!footer_effects = ["moving-block->second-page"]
     && not (Cmdk_state.get footer_st).open_);
  List.iter (fun action ->
    select [item 0 action] 0;
    press_footer "cmdk.action/open-in-sidebar";
    check "footer sidebar action opens the selected page or block once"
      (!footer_effects = ["sidebar:sidebar-target"]
       && not (Cmdk_state.get footer_st).open_))
    [Open_page "sidebar-target"; Open_block "sidebar-target"];
  select [item 0 (Open_block "block-target")] 0;
  press_footer "cmdk.action/open";
  check "footer Open starts block reveal with a fresh block read"
    (List.mem "thread-api/get-blocks" !footer_effects);
  let document = !Stub_dom.document_ref in
  let previous_copy : Js.Json.t = Stub_dom.get_field document "execCommand" in
  Stub_dom.set_field document "execCommand" (fun (_ : string) ->
    let body = Stub_dom.get_field document "body" in
    let children = (Stub_dom.rec_r body).kids in
    let textarea = Stub_dom.arr_at children (Stub_dom.arr_len children - 1) in
    record_effect ("legacy-copy:" ^ Stub_dom.get_field textarea "value");
    true);
  let navigator : Js.Json.t = Stub_dom.get_field Stub_dom.global "navigator" in
  let previous_clipboard : Js.Json.t = Stub_dom.get_field navigator "clipboard" in
  let clipboard = Js.Json.object_ (Js.Dict.empty ()) in
  Stub_dom.set_field clipboard "writeText" (fun text ->
    record_effect ("copy:" ^ text); Js.Promise.resolve ());
  Stub_dom.set_field navigator "clipboard" clipboard;
  List.iter (fun action ->
    select [item 0 action] 0;
    press_footer "cmdk.action/copy-ref";
    check "footer Copy ref writes the selected UUID and closes"
      (!footer_effects = ["copy:[[ref-target]]"]
       && not (Cmdk_state.get footer_st).open_))
    [Open_page "ref-target"; Open_block "ref-target"];
  select pages 1;
  ignore (Cmdk_view.handle_keydown footer_st
    {key="c"; meta=true; ctrl=false; shift=false; alt=false; composing=false});
  check "palette copy shortcut shares the selected-result copy action"
    (!footer_effects = ["copy:[[second-page]]"]
     && not (Cmdk_state.get footer_st).open_);
  Stub_dom.set_field document "execCommand" previous_copy;
  Stub_dom.set_field navigator "clipboard" previous_clipboard;
  select [] (-1);
  check "an empty selection exposes no inert action buttons"
    (not (List.exists (fun n -> class_has n "cp__cmdk-hint") (nodes footer)));
  select [item 0 (Open_file "logseq/config.edn")] 0;
  check "file results do not advertise a block-reference copy action"
    (not (List.exists (fun n -> M.string_prop n "accessibility-label"
      = Some (I18n.t "cmdk.action/copy-ref")) (nodes footer)));
  ignore (Lui_app.dispose footer.S.app);
  let stroke key = Editor_keys.on_global_key (key_event key) in
  stroke "t"; stroke "l";
  eqi "default global sequence dispatches once" 1 !shortcut_actions;
  stroke "t"; stroke "p";
  check "The Plugins chord dispatches the same named dialog as its command"
    (!shortcut_dialogs = ["plugins"]);
  stroke "t"; stroke "s";
  check "The Settings chord retains its named-dialog dispatch alongside Plugins"
    (!shortcut_dialogs = ["settings"; "plugins"]);
  let highlight = List.find (fun (it : Cmdk_state.item) ->
    it.act=Cmdk_state.Run "ui/highlight-recent-blocks") (Cmdk_state.commands_items services "") in
  check "The recent-highlight command advertises Master's unmodified chord"
    (highlight.isc="t h");
  let shortcut = mount (fun _ context parent ->
    Cmdk_view.shortcut_slot services (Signal.constant context.Lui_ui.ui_scheduler highlight)
      context parent) in
  check "The command palette renders t and h without Command modifiers"
    (List.exists (fun n -> M.string_prop n "text"=Some "T") (nodes shortcut)
     && List.exists (fun n -> M.string_prop n "text"=Some "H") (nodes shortcut)
     && not (List.exists (fun n -> M.string_prop n "text"=Some {js|⌘|js}) (nodes shortcut)));
  ignore (Lui_app.dispose shortcut.S.app);
  stroke "t"; stroke "h";
  check "The displayed recent-highlight chord dispatches its actual command once"
    (!highlight_toggles=1);
  let previous_shortcuts = Ui_services.storage_get "ls-shortcuts" in
  Ui_services.storage_set "ls-shortcuts"
    "{:ui/toggle-left-sidebar [\"f8\"]}";
  let binding_settings = mount (fun _ -> Settings_page.keymap_pane ()) in
  let refresh_bindings () =
    let refresh = List.find (fun n ->
      M.string_prop n "accessibility-label" = Some (I18n.t "keymap/refresh-all"))
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
  check "shortcut ownership excludes mutually exclusive navigation and popup contexts"
    (Keymap_data.conflicting_rows "ui/toggle-left-sidebar" "enter" = []);
  let before_reassign = Ui_services.storage_get "ls-shortcuts" in
  Keymap_data.save_shortcuts
    [ "ui/toggle-right-sidebar", Some (Keymap_data.Binds ["ctrl+shift+f10"; "t r"])
    ; "ui/toggle-help", Some (Keymap_data.Binds ["ctrl+shift+f10 x"])
    ; "auto-complete/complete", Some (Keymap_data.Binds ["ctrl+shift+f10"]) ];
  let owned_before = List.map (fun id -> id, Keymap_data.effective_shortcut id)
    ["ui/toggle-left-sidebar"; "ui/toggle-right-sidebar"; "ui/toggle-help";
     "auto-complete/complete"] in
  let snapshot = Keymap_data.reassign_binding "ui/toggle-left-sidebar" "shift+ctrl+f10" in
  List.iter (fun (id, expected) ->
    check ("reassign preserves legal bindings for " ^ id)
      (Keymap_data.effective_shortcut id = Keymap_data.Binds expected))
    [ "ui/toggle-left-sidebar", ["t l"; "shift+ctrl+f10"]
    ; "ui/toggle-right-sidebar", ["t r"]
    ; "ui/toggle-help", ["ctrl+shift+f10 x"]
    ; "auto-complete/complete", ["ctrl+shift+f10"] ];
  Keymap_data.reload_shortcuts ();
  check "reassigned ownership survives storage reload"
    ((Keymap_data.binding_conflicts "ui/toggle-left-sidebar" "ctrl+shift+f10").exact = []);
  Keymap_data.save_shortcuts snapshot;
  Keymap_data.reload_shortcuts ();
  check "undo restores all affected shortcut owners without touching legal overlaps"
    (List.for_all (fun (id, binding) -> Keymap_data.effective_shortcut id = binding)
      owned_before);
  restore_storage "ls-shortcuts" before_reassign;
  Keymap_data.reload_shortcuts ();
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
      { key = "k"; meta = true; ctrl = false; shift = false; alt = false; composing = false });
    S.flush search
  in
  let search_inputs () =
    List.filter (fun n -> class_has n "cp__cmdk-search-input") (nodes search)
  in
  toggle_search ();
  check "search shortcut mounts its input" (search_inputs () <> []);
  List.iter (fun input ->
    let attrs=P.data_attrs_decode (Option.value (M.string_prop input "data-attrs") ~default:"") in
    check "search focus chrome uses typed properties instead of inline CSS" (List.assoc_opt "style" attrs=None);
    check "search field retains its typed focus override" (M.string_prop input "focus-shadow"=Some "none");
    check "search field uses typed automatic height" (M.string_prop input "height"=Some "auto")) (search_inputs ());
  (match List.find_opt (fun n -> n.M.kind = "dialog") (nodes search) with
   | None -> check "search exposes a host-owned dismissible modal" false
   | Some modal ->
       S.dismiss search modal.M.id;
       check "host dismissal closes the search input" (search_inputs () = []);
       toggle_search ();
       check "search reopens after host dismissal" (search_inputs () <> []);
       toggle_search ();
       check "search shortcut keeps the reopened input open" (search_inputs () <> []));
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
  let metadata = Graphs_meta.read () in
  Graphs_meta.upsert "logseq_db_Layout fixture" [Wire.kw "created-at", Wire.Int 0];
  let graph_rows=mount (fun _ -> Lui_elements.column
    [Graphs_view.graph_row "logseq_db_Layout fixture";
     Graphs_view.remote_row ("Remote fixture","layout-fixture",false,"manager")]) in
  Graphs_meta.write metadata;
  List.iter (fun label ->
    let name=List.find (fun n -> M.string_prop n "text"=Some label) (nodes graph_rows) in
    check "Graph names use the current theme accent"
      (M.string_prop name "foreground"=Some "var(--lx-accent-11)"))
    ["Layout fixture";"Remote fixture"];
  let timestamp=List.find (fun n -> match M.string_prop n "text" with
    | Some value -> I18n.contains value (I18n.sub (I18n.t "graph/last-opened-at-label") [""])
    | None -> false) (nodes graph_rows) in
  check "Graph timestamps use the canonical muted foreground"
    (M.string_prop timestamp "foreground"=Some "hsl(var(--muted-foreground))");
  let graph_list_rows=List.filter (fun n -> n.M.kind="row" && class_has n "group") (nodes graph_rows) in
  check "Local and remote graph rows retain the reference list gap"
    (List.length graph_list_rows=2
     && List.for_all (fun n -> Hashtbl.find_opt n.M.props "margin-bottom"=Some (P.IntValue 8)) graph_list_rows);
  ignore (Lui_app.dispose graph_rows.S.app);
  for cycle = 1 to 5 do
    Signal.set (Option.get !visible) true;
    S.flush s;
    if cycle=1 then begin
      let title=List.find (fun n -> M.string_prop n "text"=Some (I18n.t "graph/all-graphs")) (nodes s)
      and section=List.find (fun n -> M.string_prop n "text"=Some (I18n.t "graph/local-graphs")) (nodes s) in
      check "Graph page titles use the reference typography"
        (M.string_prop title "font-size"=Some "var(--ls-page-title-size, 32px)"
         && M.string_prop title "line-height"=Some "1.5"
         && M.string_prop title "foreground"=Some "var(--lx-gray-12, var(--ls-title-text-color, hsl(var(--foreground))))"
         && Hashtbl.find_opt title.M.props "font-weight"=Some (P.IntValue 500)
         && Hashtbl.find_opt title.M.props "margin"=Some (P.IntValue 0));
      check "Graph section headings retain their size and bottom spacing"
        (M.string_prop section "font-size"=Some "1.125rem"
         && M.string_prop section "line-height"=Some "1.75rem"
         && Hashtbl.find_opt section.M.props "font-weight"=Some (P.IntValue 500)
         && Hashtbl.find_opt section.M.props "margin-bottom"=Some (P.IntValue 16))
    end;
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
      async_selection_check (fun () -> reference_facet_check (fun () -> filter_value_check (fun () ->
        filter_reference_titles_check (fun () -> filter_edit_check (fun () -> filter_operator_check (fun () -> page_name_filter_check (fun () -> filter_input_check ();filter_scope_check ();config_boot_check (fun () -> config_save_check (fun () -> custom_date_check (fun () -> property_date_check (fun () -> type_choice_check (fun () -> Runtime.app_flush := previous_flush;finish ()))))))))))));
      Js.Promise.resolve ()) (Js.Promise.resolve ()))))

let popup_press (ev : Ui_services.ev) =
  let state_before = Editor_state.read () in
  Editor_state.set (fun v -> { v with editing = Some
      (Editor_state.mk_editing ~uuid:"b1" ~buffer:"text"
         ~scope:"main" ~base:"text" ()) });
  let popup : Editor_commands.popup =
    { kind = Editor_commands.Link_form { image = false; url = ""; label = "" }; configured = None; uuid = "b1"; from = 0
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
