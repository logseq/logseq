let check message condition = if not condition then failwith message

(* Load real resource files and exercise first view construction without
   pumping graph startup or starting a worker. *)
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
      (displays "text" "日志" && displays "text" "导航"));
  List.iter prerr_endline (List.rev !failures);
  check "Native dictionary delivery and first mount" (!failures=[]);
  print_endline "native dictionary delivery and first mount: OK"
