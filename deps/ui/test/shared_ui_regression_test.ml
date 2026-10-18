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

let localization () =
  let previous_language = Platform.local_storage_get "preferred-language" in
  let previous_dictionary = Hashtbl.find_opt I18n.locale_tbls "zh-CN" in
  let previous_flush = !Runtime.app_flush in
  let previous_settings = !Settings_state.st in
  Settings_state.st:=None;
  Fun.protect ~finally:(fun () ->
    (match previous_language with
     | Some language -> Platform.local_storage_set "preferred-language" language
     | None -> Platform.local_storage_remove "preferred-language");
    (match previous_dictionary with
     | Some dictionary -> Hashtbl.replace I18n.locale_tbls "zh-CN" dictionary
     | None -> Hashtbl.remove I18n.locale_tbls "zh-CN");
    Runtime.app_flush:=previous_flush;
    Settings_state.st:=previous_settings) (fun () ->
    let dictionary=Hashtbl.create 16 in
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
       "view.table/select-column","Translated Select column"];
    Hashtbl.replace I18n.locale_tbls "zh-CN" (Some dictionary);
    Platform.local_storage_set "preferred-language" "\"zh-CN\"";
    check "Locale fixture loads after application modules initialize"
      (I18n.t "settings/general"="Translated General");
    let columns=ref [] in
    let session=S.mount ~registry:(Views_drive.registry ())
      ~profile:Logseq_el.web_profile ~initial:Model.initial
      ~reducer:(fun model () -> model)
      ~view:(fun context model _ ->
        Settings_state.ensure context;
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
              Page.library_add_pages_button])) () in
    Fun.protect ~finally:(fun () -> ignore (Lui_app.dispose session.S.app)) (fun () ->
      let texts=List.filter_map (fun n -> M.string_prop n "text") (nodes session) in
      List.iter (fun value -> check ("Late locale reaches " ^ value) (List.mem value texts))
        ["Translated Settings";"Translated General";"Translated Editor";
         "Translated Keymap";"Translated Advanced";"Translated Features";
         "Translated Version";"Translated Skip";"Translated Not Found";
         "Translated Sync server";"Translated Add Pages"];
      check "Late locale reaches the retained More recipe"
        (List.exists (fun n -> M.string_prop n "accessibility-label"=Some "Translated More") (nodes session)));
    check "Built-in view columns resolve the initialized locale"
      (List.exists (fun (column:Views_state.column) -> column.c_name="Translated Page name") !columns);
    check "Selection column resolves the initialized locale"
      (List.exists (fun (column:Views_state.column) -> column.c_name="Translated Select column") !columns);
    check "Timestamp choices resolve the initialized locale"
      (List.exists (fun (_,label) -> label="Translated Custom date") (I18n.timestamp_options ())))

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
  let neutral_controls = mount (fun _ context parent ->
    let sched = context.Lui_ui.ui_scheduler in
    let keymap = Signal.state sched
      {Settings_page.km_query="";km_filter=Keymap_data.All;km_collapsed=[];
       km_keys=[];km_recording=false;km_committed=false;km_revision=0} in
    let created = Views_state.make ~sched ~kind:Views_state.KAllPages
      ~feature:"neutral-button-parity" ~owner:Wire.Nil in
    let selected = { (Views_state.empty_vstate ()) with
      Views_state.selected=Views_state.Sset.singleton "neutral-row" } in
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
  let picked_date = ref None in
  let calendar = mount (fun _ -> Ui_components.date_picker ~day_label:I18n.calendar_day_label ~translate:I18n.t
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
  let labelled_calendar = mount (fun _ -> Ui_components.calendar ~day_label:I18n.calendar_day_label
      ~initial:(Dates.make ~year:2024 ~month:2 ~day:29 ()) ~translate:I18n.t
      ~on_pick:(fun _ -> ()) ()) in
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
  let popup : Editor_commands.popup =
    {kind=Cal_insert;uuid="calendar-keyboard-owner";from=0;cy=2024;cm=1;cd=31;
     hour=0;tmin=0;x=0.;y=0.;menu=None;rpt=None} in
  Editor_commands.active:=Some popup;Editor_commands.popup_vs:=None;
  Editor_commands.nav_month 1;
  check "Editor month controls clamp the focused day to the target month"
    (match !Editor_commands.active with Some current -> current.cy=2024 && current.cm=2 && current.cd=29 | None -> false);
  Editor_commands.active:=Some popup;
  let editor_calendar = mount (fun _ context parent ->
    let source = Signal.value (Editor_commands.popup_vs_of context) in
    Lui_elements.column [Editor_commands.cal_head source;Editor_commands.cal_table popup] context parent) in
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
  let day = find_day editor_calendar 2024 1 31 in
  check "Editor calendars share complete date labels"
    (M.string_prop day "accessibility-label"=Some "Wednesday, January 31st, 2024");
  navigate editor_calendar day (P.NavigationKey (day.M.id,"ArrowRight",false));
  check "Editor calendar navigation updates the day exactly once"
    (match !Editor_commands.active with Some current -> current.cy=2024 && current.cm=2 && current.cd=1 | None -> false);
  ignore (Lui_app.dispose editor_calendar.S.app);
  Editor_commands.active:=old_calendar;Editor_commands.popup_vs:=old_calendar_signal;
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
    ~on_chosen:(fun _ _ -> ()) ();
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
  let filter_value_check done_ =
    let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model
    and previous_stack = !Views_popup.stack_st in
    Runtime.read_model := (fun () -> {Model.initial with repo=Some "filter-value-fixture"});
    let rec next = function
      | [] ->
          Runtime.worker:=previous_worker;Runtime.read_model:=previous_model;
          Views_popup.stack_st:=previous_stack;done_ ()
      | (column,data,expected,empty_action)::rest ->
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
              eqi "view filter values use the same portable option list" expected
                (List.length (List.filter (fun n -> class_has n "ls-view-select-option") (nodes selector)));
              let input=List.find (fun n -> n.M.kind="input") (nodes selector) in
              if empty_action then begin
                S.text_changed selector input.M.id "No matching value";
                let action=List.find_opt (fun n -> n.M.kind="button"
                  && List.exists (fun c -> M.string_prop c "text"=Some (I18n.t "view.filter/is-empty"))
                    (M.children selector.S.tree n.M.id)) (nodes selector) in
                check "value search preserves its empty-value footer action" (Option.is_some action);
                Option.iter (fun n -> S.press selector n.M.id) action
              end else S.submit selector input.M.id;
              check "view filter value selection updates one clause and closes"
                (List.length (Views_state.get inst).filters=1 && !Views_popup.open_popups=[]);
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
    next [(Views_table.created_column ()),data "timestamp" [],List.length (I18n.timestamp_options ()),false;
      {(Views_table.created_column ()) with Views_state.c_id="fixture/checked";c_name="Checked";c_type="checkbox"},
        data "checkbox" [],2,true;
      {(Views_table.created_column ()) with Views_state.c_id="fixture/value";c_name="Value";c_type="default"},
        data "property-values" [Wire.Map [Wire.kw "label",Wire.String "Alpha";Wire.kw "value",Wire.String "alpha"]],1,false]
  in
  let custom_date_check done_ =
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
            S.submit selector input.M.id;
            check "custom date opens a calendar without changing the filter" ((Views_state.get inst).filters=[]);
            let calendar=List.find_opt (fun n -> M.string_prop n "accessibility-identifier"=Some "date-time-picker") (nodes selector) in
            check "custom date renders the shared calendar" (Option.is_some calendar);
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
            next rest;Js.Promise.resolve ()) (Js.Promise.resolve ()))
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
        {favorites=state [target];recents=state [];nav_checked=state [];
         nav_tag_titles=state [];items=state [];
         open_menu=state "";groups_collapsed=state [];
         left_width=state 246.;right_fraction=state 0.3;viewport_w=state 1440.} in
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
  let previous_view_overlays = !Properties_state.view_overlays_state in
  Properties_state.view_overlays_state := None;
  let escape_owner = mount (fun _ -> Properties_view.overlays) in
  let dismissed = ref 0 in
  let close_escape_owner () =
    incr dismissed;
    Properties_state.remove_view_overlay "escape-owner" in
  ignore (Properties_state.push_view_overlay_ctxfree ~key:"escape-owner"
    ~on_escape:close_escape_owner
    ~view:(Lui_elements.popover ~role:`dialog ~anchor:`below
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
         ((I18n.t "keymap/all")
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
  let previous_context = !Popups_state.active and previous_highlight = !Popups_view.cm_hi_el in
  let previous_menu_query : string -> Js.Json.t array = Stub_dom.get_field document "querySelectorAll" in
  let previous_menu_id : string -> Js.Json.t = Stub_dom.get_field document "getElementById" in
  let foreign_menu=Stub_dom.make_element "div" and foreign_item=Stub_dom.make_element "div" in
  let owned_menu=Stub_dom.make_element "div" and owned_item=Stub_dom.make_element "div" in
  let foreign_actions=ref 0 and owned_actions=ref 0 in
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
    if identifier="block-context-menu" then owned_menu else previous_menu_id identifier);
  Stub_dom.set_field document "querySelectorAll" (fun selector ->
    if selector=".ui__dropdown-menu-content" then [|foreign_menu|]
    else previous_menu_query selector);
  Fun.protect ~finally:(fun () ->
    Stub_dom.set_field document "querySelectorAll" previous_menu_query;
    Stub_dom.set_field document "getElementById" previous_menu_id;
    Popups_state.active:=previous_context;Popups_view.cm_hi_el:=previous_highlight) (fun () ->
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
    let cm : Popups_state.cm = {cx=0.;cy=0.;atop=0.;flip=false;block_id="context-fixture";
      multi=false;entries=[];sub_open=(-1);sub_xy=(0.,0.);tag=None;native=false;native_acts=[]} in
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
         o_title_of_uuid=(fun _ uuid -> uuid); o_load_more=(fun _ -> ())};
      Views_head.sorting_popup inst (popup_anchor ());
      Lui_elements.column
        [Views_table.foldable inst ~key:"tab-fixture"
           ~title:(Views_head.render_head inst)
           ~body:(Lui_elements.spacer []);
         Page.fold_arrow ~on_click:(fun () -> incr fold_presses) "page-fold-fixture";
         popup_layer]
        context parent) in
  let inst = Option.get !sorting_inst in
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
    (Hashtbl.find_opt search_input.M.props "width" = Some (P.IntValue 183)
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
      ~on_chosen:(fun item checked -> selected_items := !selected_items @ [item.Views_popup.si_value, checked])
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
  Views_builder.full_text_picker inst ~tree:(ref (Views_builder.COp ("and",[])))
    ~loc:[] ~anchor:(popup_anchor ());
  let full_text_rendered = try S.flush sorting;true with Invalid_argument _ -> false in
  check "query builder full-text input only uses supported component properties" full_text_rendered;
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
  let item index action : Cmdk_state.item =
    { ikey = string_of_int index; idx = index; gid = G_nodes;
      ititle = "Footer result"; info = None; header = None; iicon = "";
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
  check "footer Open resolves a selected block through the existing navigation action"
    (List.mem "thread-api/get-block-page-info" !footer_effects);
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
    {key="c"; meta=true; ctrl=false; shift=false; alt=false});
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
      async_selection_check (fun () -> filter_value_check (fun () ->
        custom_date_check (fun () -> type_choice_check (fun () -> Runtime.app_flush := previous_flush;finish ()))));
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
