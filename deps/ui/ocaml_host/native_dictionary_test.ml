let check message condition = if not condition then failwith message

(* Load real resource files and exercise first view construction without
   pumping graph startup or starting a worker, including live locale changes. *)
let () =
  Platform_native.load_state ();
  let previous_language=Hashtbl.find_opt Platform_native.ls "preferred-language"
  and previous_assets=Sys.getenv_opt "LOGSEQ_NATIVE_ASSET_DIR"
  and previous_root=Sys.getenv_opt "LOGSEQ_ROOT_DIR" in
  let dictionaries=Hashtbl.copy I18n.locale_tbls
  and loads=Hashtbl.copy I18n.locale_loads in
  let root=Filename.temp_file "native-locale-" "" in
  Sys.remove root;Unix.mkdir root 0o700;
  let dicts=Filename.concat root "dicts" in
  Unix.mkdir dicts 0o700;
  let failures=ref [] in
  let expect message value=if not value then failures:=message::!failures in
  let reset ()=Hashtbl.clear I18n.locale_tbls;Hashtbl.clear I18n.locale_loads in
  let select code=Hashtbl.replace Platform_native.ls "preferred-language" ("\"" ^ code ^ "\"") in
  let write name contents=Out_channel.with_open_bin (Filename.concat dicts name)
      (fun channel -> output_string channel contents) in
  let load () =
    try match (I18n.init ()).Js.Promise.state with
      | Js.Promise.Resolved () -> true
      | Js.Promise.Rejected _ -> false
      | Js.Promise.Pending -> failwith "Native dictionary startup remained pending"
    with Sys_error _ | Failure _ -> false in
  Fun.protect ~finally:(fun () ->
    ignore (Native_embed.dispose ());
    (match previous_language with
     | Some value -> Hashtbl.replace Platform_native.ls "preferred-language" value
     | None -> Hashtbl.remove Platform_native.ls "preferred-language");
    Hashtbl.clear I18n.locale_tbls;Hashtbl.iter (Hashtbl.replace I18n.locale_tbls) dictionaries;
    Hashtbl.clear I18n.locale_loads;Hashtbl.iter (Hashtbl.replace I18n.locale_loads) loads;
    Unix.putenv "LOGSEQ_NATIVE_ASSET_DIR" (Option.value previous_assets ~default:"");
    Unix.putenv "LOGSEQ_ROOT_DIR" (Option.value previous_root ~default:"");
    Array.iter (fun name -> Sys.remove (Filename.concat dicts name)) (Sys.readdir dicts);
    Unix.rmdir dicts;Unix.rmdir root) (fun () ->
    Unix.putenv "LOGSEQ_NATIVE_ASSET_DIR" root;
    Unix.putenv "LOGSEQ_ROOT_DIR" (Filename.concat root "graphs");
    reset ();select "en";
    expect "English startup must use its embedded dictionary without external files" (load ());
    reset ();select "fr";
    write "fr.edn" "{:header/more \"Bienvenue café 中文 👩🏽‍💻\"}";
    expect "Native startup must load a selected dictionary file"
      (load () && Option.is_some (I18n.locale_tbl "fr"));
    expect "Native dictionary text must preserve Unicode"
      (I18n.t "header/more"="Bienvenue café 中文 👩🏽‍💻");
    expect "Missing locale entries must retain the canonical English fallback"
      (I18n.t "nav/journals"=I18n.en_text "nav/journals");
    Sys.remove (Filename.concat dicts "fr.edn");
    expect "Loaded native dictionaries must be reused without another file read" (load ());
    expect "Cached native dictionary text changed"
      (I18n.t "header/more"="Bienvenue café 中文 👩🏽‍💻");
    reset ();
    expect "A missing packaged dictionary must fail startup" (not (load ()));
    write "fr.edn" "[]";reset ();
    expect "A malformed packaged dictionary must fail startup" (not (load ()));
    List.iter (fun (locale,file) ->
      write file (In_channel.with_open_bin (Filename.concat Sys.argv.(1) file)
        In_channel.input_all);
      reset ();select locale;
      expect ("The shipped dictionary must load on native: " ^ locale)
        (load () && Option.is_some (I18n.locale_tbl locale));
      if locale="zh-CN" then
        expect "The shipped Chinese dictionary must preserve its decoded text"
          (I18n.t "cmdk.group/recently-updated"="最近更新")) Dicts_gen.dict_files;
    Printf.printf "native shipped dictionaries loaded: %d\n%!" (List.length Dicts_gen.dict_files);
    reset ();select "zh-CN";
    write "zh-cn.edn"
      "{:header/more \"更多\" :nav/journals \"日志\" :sidebar.left/navigations \"导航\"}";
    ignore (Native_embed.initialize 1 0 "");
    let elements=Native_embed.collect_elements () in
    let displays property value=List.exists (fun element ->
      let encoded=Js.Json.stringify element in
      I18n.contains encoded ("\"" ^ property ^ "\":\"" ^ value ^ "\"")) elements in
    expect "Native first mount must use the selected dictionary for the header"
      (displays "aria-label" "更多");
    expect "Native first mount must use the selected dictionary for navigation"
      (displays "text" "日志" && displays "text" "导航");
    let app=Option.get !Native_embed.current_app in
    let node identifier=List.find_map (fun element ->
      match Yojson.Safe.from_string (Js.Json.stringify element) with
      | `Assoc fields when List.assoc_opt "id" fields=Some (`String identifier) ->
          (match List.assoc_opt "node-id" fields with Some (`Int id) -> Some id | _ -> None)
      | _ -> None) (Native_embed.collect_elements ()) in
    let toggle=Option.get (node "left-menu") in
    let sidebar=Option.get (Sidebar_state.current ()) in
    let draft="Draft café 中文 👩🏽‍💻" in
    Native_embed.with_entry_lock (fun () ->
      let block=Model.empty_block ~uuid:"locale-block" ~title:"Original" ~is_page:false in
      let summary=Option.get (Decode.page_of_summary (Wire.Map
        [Wire.Keyword "block/uuid",Wire.Uuid "locale-page";
         Wire.Keyword "block/title",Wire.String "Locale fixture"])) in
      let page={summary with Model.page_blocks=[block]} in
      Runtime.current_page:=Some page;
      Runtime.send (Action.Boot_graph_ready ("logseq_db_LocaleFixture",Wire.Map []));
      Runtime.send (Action.Navigate_to (Model.Page "locale-page"));
      Runtime.send (Action.Page_loaded page);
      Signal.set sidebar.Sidebar_state.left_width 288.;
      Editor_state.set (fun state -> {state with editing=Some
        (Editor_state.mk_editing ~uuid:"locale-block" ~buffer:draft
          ~scope:"main" ~base:"Original" ~caret:6 ())});
      ignore (Lui_app.flush app));
    let editor=node "edit-block-locale-block" in
    expect "Live locale fixture must mount a real rich-text editor" (Option.is_some editor);
    let counts table=Hashtbl.fold (fun name listeners entries ->
      (name,List.length listeners)::entries) table [] |> List.sort compare in
    let captures=counts Platform.capture_listeners
    and listeners=counts Platform.window_listeners
    and navigation=List.length !Platform_native.hash_change_fns in
    let mounted_text property value=List.exists (fun element ->
      I18n.contains (Js.Json.stringify element)
        ("\"" ^ property ^ "\":\"" ^ value ^ "\""))
        (Native_embed.collect_elements ()) in
    let change language=Native_embed.with_entry_lock (fun () ->
      Settings_view.set_language language;ignore (Lui_app.flush app)) in
    change "fr";
    expect "Native language selection must refresh existing header text"
      (mounted_text "aria-label" "Plus");
    expect "Native language selection must refresh existing navigation text"
      (mounted_text "text" "Journaux");
    change "en";
    expect "Native language selection must restore English without restarting"
      (mounted_text "aria-label" "More" && mounted_text "text" "Journals");
    for _=1 to 10 do change "fr";change "zh-CN";change "en" done;
    expect "Live locale changes must retain toolbar node identity" (node "left-menu"=Some toggle);
    expect "Live locale changes must retain the mounted editor" (node "edit-block-locale-block"=editor);
    expect "Live locale changes must preserve the unsaved rich-text draft and caret"
      (match (Editor_state.value ()).editing with
       | Some editing -> editing.buffer=draft && editing.model.caret=6
       | None -> false);
    expect "Live locale changes must preserve page and sidebar width"
      ((Runtime.model ()).route=Model.Page "locale-page"
       && Signal.get_state sidebar.left_width=288.);
    expect "Live locale changes must not accumulate capture listeners"
      (counts Platform.capture_listeners=captures);
    expect "Live locale changes must not accumulate document listeners"
      (counts Platform.window_listeners=listeners);
    expect "Live locale changes must not accumulate navigation listeners"
      (List.length !Platform_native.hash_change_fns=navigation);
    let key value=Native_embed.with_entry_lock (fun () ->
      Platform.emit_event "keydown" (Js.Json.JObject
        ["key",Js.Json.JString value;"metaKey",Js.Json.boolean (value="k")]);
      ignore (Lui_app.flush app)) in
    key "k";
    expect "Search shortcut must target the live palette after locale changes"
      (Cmdk_state.get (Option.get !Cmdk_state.latest_t)).open_;
    key "Escape";
    expect "Escape must dismiss the live palette after locale changes"
      (not (Cmdk_state.get (Option.get !Cmdk_state.latest_t)).open_);
    let expanded=(Runtime.model ()).left_sidebar_open in
    ignore (Native_embed.press toggle);
    expect "Sidebar button must toggle exactly once after locale changes"
      ((Runtime.model ()).left_sidebar_open <> expanded);
    Native_embed.with_entry_lock (fun () ->
      Dialogs_state.open_ "settings";ignore (Lui_app.flush app));
    let control tag text=List.find_map (fun element ->
      match Yojson.Safe.from_string (Js.Json.stringify element) with
      | `Assoc fields when List.assoc_opt "tag" fields=Some (`String tag)
                        && List.assoc_opt "text" fields=Some (`String text) ->
          (match List.assoc_opt "node-id" fields with Some (`Int id) -> Some id | _ -> None)
      | _ -> None) (Native_embed.collect_elements ()) in
    let choose current next=
      ignore (Native_embed.press (Option.get (control "select" current)));
      ignore (Native_embed.press (Option.get (control "menuitem" next))) in
    choose "English" "Français";
    expect "Native Settings language menu must refresh the open dialog"
      (mounted_text "text" "Général" && mounted_text "text" "Langue"
       && Option.is_some (control "select" "Français"));
    choose "Français" "English";
    expect "Native Settings language menu must restore English in place"
      (mounted_text "text" "General" && mounted_text "text" "Language"
       && Option.is_some (control "select" "English")));
  expect "Disposing the native interface must release its refresh handler"
    (ignore (Native_embed.dispose ()); !Platform_native.document_refresh=None);
  List.iter prerr_endline (List.rev !failures);
  check "Native dictionary delivery, first mount and live switching" (!failures=[]);
  print_endline "native dictionary delivery, first mount and live switching: OK"
