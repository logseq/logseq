(* LSPlugin host runtime for the web build. Installs window.apis
   (EventEmitter3), wires LSPluginCore listeners, persists installed
   plugins + per-plugin settings under localStorage keys mirroring the
   cljs idb paths (LSPUserDotRoot/ subtree), relays marketplace installs via
   the lsp-updates channel, and exposes the plugin-facing host api fns
   that the lsplugin dispatch resolves on window.logseq.api. *)

open Sdk_util

external window_ : Js.Json.t = "window"

external new_ee3 : unit -> Js.Json.t = "EventEmitter3"
  [@@mel.new] [@@mel.scope "window"]

external ls_remove : string -> unit = "removeItem"
  [@@mel.scope "localStorage"]

external as_promise : Js.Json.t -> Js.Json.t Js.Promise.t = "%identity"
external as_any : 'a -> Js.Json.t = "%identity"
external getf : Js.Json.t -> string -> Js.Json.t = "" [@@mel.get_index]
external setf : Js.Json.t -> string -> Js.Json.t -> unit = ""
  [@@mel.set_index]
external reflect_apply :
  Js.Json.t -> Js.Json.t -> Js.Json.t array -> Js.Json.t = "apply"
  [@@mel.scope "Reflect"]
external del_prop : Js.Json.t -> string -> bool = "deleteProperty"
  [@@mel.scope "Reflect"]

let jstr o k = Option.value ~default:"" (Js.Json.decodeString (getf o k))
let jbool o k = Option.value ~default:false (Js.Json.decodeBoolean (getf o k))
let meth o m args : Js.Json.t = reflect_apply (getf o m) o args
let lsplugin () = getf window_ "LSPlugin"
let core () = getf window_ "LSPluginCore"

let jobj pairs = Sdk_convert.json_obj (Js.Dict.fromList pairs)
let jstr_ s = Js.Json.string s

(* ---------- persistent stores (localStorage mirrors cljs idb) *)

let store_key = "LSPUserDotRoot/installed-plugins-for-web/all.json"
let settings_key pid = "LSPUserDotRoot/settings/" ^ pid ^ ".json"
let prefs_key = "LSPUserDotRoot/preferences.json"

let read_json key =
  match Platform.local_storage_get key with
  | Some s -> (try Platform.json_parse s with _ -> Js.Json.null)
  | None -> Js.Json.null

let read_dict key =
  match Js.Json.decodeObject (read_json key) with
  | Some d -> d
  | None -> Js.Dict.empty ()

let write_dict key d =
  Platform.local_storage_set key
    (Js.Json.stringify (Sdk_convert.json_obj d))

(* ---------- in-memory host state ---------- *)

type ui_item = { it_pid : string; it_type : string; it_opts : Js.Json.t }

let installed : Js.Json.t Js.Dict.t = Js.Dict.empty ()
let items : ui_item list ref = ref []
let dirty : int Signal.state option ref = ref None
let marketplace : Js.Json.t Js.Promise.t option ref = ref None

let dirty_signal owner =
  match !dirty with
  | Some s -> s
  | None ->
      let s = Signal.state owner 0 in
      dirty := Some s;
      s

let dirty_value owner = Signal.value (dirty_signal owner)

let bump () =
  match !dirty with
  | Some s -> Runtime.signal_set s (Signal.get_state s + 1)
  | None -> ()

(* ---------- injected ui (toolbar slots) ---------- *)

let toolbar_items () =
  !items
  |> List.filter (fun it -> it.it_type = "toolbar")
  |> List.sort (fun x y ->
         String.compare (jstr x.it_opts "key") (jstr y.it_opts "key"))

(* any registered plugin (loaded or disabled) — disabled plugins keep
   their `installed` entry until unregister/unlink, matching cljs
   :plugin/installed-plugins *)
let has_installed () = Array.length (Js.Dict.keys installed) > 0

let slot_id it =
  "pl-injected-ui-item-pl-" ^ jstr it.it_opts "key" ^ "-" ^ it.it_pid

let inject_toolbar_ui () =
  let setup =
    match Js.Json.classify (lsplugin ()) with
    | Js.Json.JSONObject _ ->
        getf (getf (lsplugin ()) "pluginHelpers") "setupInjectedUI"
    | _ -> Js.Json.null
  in
  List.iter
    (fun it ->
      match
        ( Js.Dict.get installed it.it_pid
        , Platform.get_element_by_id (slot_id it) )
      with
      | Some pl, Some _ ->
          let opts =
            jobj
              [ ("slot", jstr_ (slot_id it))
              ; ("key", jstr_ ("pl-" ^ jstr it.it_opts "key"))
              ; ("template", getf it.it_opts "template")
              ]
          in
          ignore (meth setup "call" [| pl; opts; jobj [] |])
      | _ -> ())
    (toolbar_items ())

(* after a dirty bump re-renders the open menu, slots are recreated
   empty — re-inject on the next tick *)
let schedule_inject () =
  ignore (Browser_ui.set_timeout (fun () -> inject_toolbar_ui ()) 0)


(* ---------- installed-plugin tracking ---------- *)

let pid_of_event (e : Js.Json.t) =
  match Js.Json.decodeString e with
  | Some s -> s
  | None -> jstr e "id"

let save_plugin_json (pl : Js.Json.t) =
  let j = meth pl "toJSON" [| Js.Json.boolean false |] in
  let key = jstr j "key" in
  if key <> "" then (
    let m = read_dict store_key in
    Js.Dict.set m key j;
    write_dict store_key m)

let track pl =
  let pid = jstr pl "id" in
  if pid <> "" then (
    Js.Dict.set installed pid pl;
    if jbool pl "isWebPlugin" then save_plugin_json pl;
    bump ();
    schedule_inject ())

let clear_pid pid =
  items := List.filter (fun it -> it.it_pid <> pid) !items;
  bump ()

let unlink_pid pid =
  ignore (del_prop (Sdk_convert.json_obj installed) pid);
  items := List.filter (fun it -> it.it_pid <> pid) !items;
  (let m = read_dict store_key in
   ignore (del_prop (Sdk_convert.json_obj m) pid);
   write_dict store_key m);
  ls_remove (settings_key pid);
  bump ()

(* ---------- lsp-updates (marketplace install/update) ---------- *)

let on_lsp_update (e : Js.Json.t) =
  match jstr e "status" with
  | "completed" ->
      let payload = getf e "payload" in
      let id = jstr payload "id" in
      if
        (not (jbool e "onlyCheck"))
        && id <> ""
        && Js.Dict.get installed id = None
      then
        let entry =
          jobj
            [ ("key", jstr_ id)
            ; ("url", getf payload "dst")
            ; ("webPkg", getf payload "webPkg")
            ]
        in
        ignore (as_promise (meth (core ()) "register" [| entry |]))
  | _ -> ()

(* ---------- boot ---------- *)

let boot_register () =
  let d = read_dict store_key in
  let plugins =
    Js.Dict.values d
    |> Array.to_list
    |> List.filter (fun p -> jstr p "url" <> "")
  in
  if plugins <> [] then
    ignore
      (as_promise
         (meth (core ()) "register"
            [| Sdk_convert.json_arr (Array.of_list plugins)
             ; Js.Json.boolean true
            |]))

let setup () =
  (match Js.typeof (getf window_ "apis") with
   | "undefined" -> setf window_ "apis" (new_ee3 ())
   | _ -> ());
  ignore
    (meth (lsplugin ()) "setupPluginCore"
       [| jobj
            [ ("localUserConfigRoot", jstr_ "LSPUserDotRoot/")
            ; ("dotConfigRoot", jstr_ "LSPUserDotRoot/")
            ]
       |]);
  let core = core () in
  ignore
    (meth core "on" [| jstr_ "registered"; as_any (fun pl -> track pl) |]);
  ignore
    (meth core "on" [| jstr_ "reloaded"; as_any (fun pl -> track pl) |]);
  ignore
    (meth core "on"
       [| jstr_ "unregistered"; as_any (fun pid -> unlink_pid (pid_of_event pid)) |]);
  ignore
    (meth core "on"
       [| jstr_ "beforereload"; as_any (fun pl -> clear_pid (pid_of_event pl)) |]);
  ignore
    (meth core "on"
       [| jstr_ "disabled"; as_any (fun pid -> clear_pid (pid_of_event pid)) |]);
  ignore
    (meth core "on"
       [| jstr_ "unlink-plugin"; as_any (fun pid -> unlink_pid (pid_of_event pid)) |]);
  let apis = getf window_ "apis" in
  ignore
    (meth apis "addListener"
       [| jstr_ "lsp-updates"; as_any on_lsp_update |]);
  boot_register ()

(* ---------- pinned toolbar items (in user preferences) ---------- *)

let pinned () =
  match Js.Dict.get (read_dict prefs_key) "pinnedToolbarItems" with
  | Some j -> (
      match Js.Json.decodeArray j with
      | Some xs ->
          Array.to_list xs
          |> List.filter_map Js.Json.decodeString
      | None -> [])
  | None -> []

let toggle_pinned pkey =
  let cur = pinned () in
  let next =
    if List.mem pkey cur then List.filter (fun k -> k <> pkey) cur
    else cur @ [ pkey ]
  in
  let d = read_dict prefs_key in
  Js.Dict.set d "pinnedToolbarItems"
    (Sdk_convert.json_arr
       (Array.of_list (List.map jstr_ next)));
  write_dict prefs_key d;
  bump ()

(* ---------- enable / disable ---------- *)

let set_plugin_disabled pid disabled =
  ignore
    (as_promise
       (meth (core ())
          (if disabled then "disable" else "enable")
          [| jstr_ pid |]))

let plugin_disabled (pl : Js.Json.t) = jbool pl "disabled"

(* ---------- marketplace ---------- *)

let marketplace_url =
  "https://raw.githubusercontent.com/logseq/marketplace/master/plugins.json"

external resp_json : Js.Json.t -> Js.Json.t Js.Promise.t = "json" [@@mel.send]
external fetch_ : string -> Js.Json.t Js.Promise.t = "fetch" [@@mel.scope "window"]

let marketplace_pkgs owner =
  match !marketplace with
  | Some p -> p
  | None ->
      let p =
        fetch_ marketplace_url
        |> Js.Promise.then_ (fun r -> resp_json r)
        |> Js.Promise.then_ (fun j ->
               let pkgs =
                 match Js.Json.decodeArray (getf j "packages") with
                 | Some xs -> Array.to_list xs
                 | None -> []
               in
               (* web platform filter: web:true or effect not true *)
               let web_ok p =
                 jbool p "web" || not (jbool p "effect")
               in
               let pkgs = List.filter web_ok pkgs in
               bump ();
               Js.Promise.resolve
                 (Sdk_convert.json_arr (Array.of_list pkgs)))
      in
      marketplace := Some p;
      ignore (dirty_signal owner);
      p

let r2_entry_url repo version =
  "https://plugins.logseq.io/r2/" ^ repo ^ "/" ^ version

let install_marketplace pkg =
  let repo = jstr pkg "repo" in
  if repo <> "" && Js.Dict.get installed (jstr pkg "id") = None then (
    let apis = getf window_ "apis" in
    ignore
      (fetch_ (r2_entry_url repo "")
      |> Js.Promise.then_ (fun r -> resp_json r)
      |> Js.Promise.then_ (fun web_pkg ->
             let version = jstr web_pkg "version" in
             let payload =
               jobj
                 [ ("id", getf pkg "id")
                 ; ("name", getf pkg "title")
                 ; ("title", getf pkg "title")
                 ; ("icon", getf pkg "icon")
                 ; ("author", getf pkg "author")
                 ; ("repo", jstr_ repo)
                 ; ("dst", jstr_ repo)
                 ; ("version", jstr_ version)
                 ; ("webPkg", web_pkg)
                 ]
             in
             let evt =
               jobj
                 [ ("status", jstr_ "completed")
                 ; ("payload", payload)
                 ]
             in
             ignore (meth apis "emit" [| jstr_ "lsp-updates"; evt |]);
             Js.Promise.resolve Js.Json.null)))

(* ---------- plugin host api fns ---------- *)

let nil_fn _a _b _c _d = resolved_nil
let false_fn _a _b _c _d = resolved (Js.Json.boolean false)
let arr0_fn _a _b _c _d = resolved (Sdk_convert.json_arr [||])

let load_installed_plugins _a _b _c _d =
  resolved (Sdk_convert.json_obj (read_dict store_key))

let save_installed_plugin a _b _c _d =
  let key = jstr a "key" in
  if key <> "" then (
    let m = read_dict store_key in
    Js.Dict.set m key a;
    write_dict store_key m);
  resolved_nil

let unlink_installed_plugin a _b _c _d =
  let key =
    match arg_string a with Some s -> s | None -> jstr a "key"
  in
  if key <> "" then (
    let m = read_dict store_key in
    ignore (del_prop (Sdk_convert.json_obj m) key);
    write_dict store_key m);
  resolved_nil

let load_plugin_settings a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some pid ->
      let path = settings_key pid in
      let data =
        match Js.Json.classify (read_json path) with
        | Js.Json.JSONObject _ -> read_json path
        | _ -> jobj []
      in
      resolved
        (Sdk_convert.json_arr [| jstr_ path; data |])

let save_plugin_settings a b _c _d =
  (match arg_string a with
   | Some pid ->
       Platform.local_storage_set (settings_key pid)
         (Js.Json.stringify b)
   | None -> ());
  resolved_nil

let unlink_plugin_settings a _b _c _d =
  (match arg_string a with
   | Some pid -> ls_remove (settings_key pid)
   | None -> ());
  resolved_nil

let load_user_preferences _a _b _c _d = resolved (read_json prefs_key)

let save_user_preferences a _b _c _d =
  Platform.local_storage_set prefs_key (Js.Json.stringify a);
  resolved_nil

let register_ui_item a b c _d =
  (match arg_string a, arg_string b with
   | Some pid, Some ty ->
       if Js.Dict.get installed pid <> None then (
         let key = jstr c "key" in
         items :=
           List.filter
             (fun it ->
               not
                 (it.it_pid = pid
                  && it.it_type = ty
                  && jstr it.it_opts "key" = key))
             !items
           @ [ { it_pid = pid; it_type = ty; it_opts = c } ];
         bump ())
   | _ -> ());
  resolved_nil

let unregister_ui_items a _b _c _d =
  (match arg_string a with
   | Some pid ->
       items := List.filter (fun it -> it.it_pid <> pid) !items;
       bump ()
   | None -> ());
  resolved_nil

let get_external_plugin a _b _c _d =
  match arg_string a with
  | Some pid -> (
      match Js.Dict.get installed pid with
      | Some pl -> resolved (meth pl "toJSON" [| Js.Json.boolean true |])
      | None -> resolved_nil)
  | None -> resolved_nil

let get_caller_plugin_id _a _b _c _d =
  let v = getf window_ "$$callerPluginID" in
  if Js.typeof v = "undefined" then resolved_nil else resolved v

let get_app_info _a _b _c _d =
  resolved (jobj [ ("version", jstr_ "0.0.0"); ("supportDb", Js.Json.boolean true) ])

let check_is_db_graph _a _b _c _d = resolved (Js.Json.boolean true)

(* cljs get_user_configs -> state/get-config surface;
   preferredDateFormat = :journal/page-title-format from config.edn,
   default "MMM do, yyyy" (cljs state/default-date-formatter) *)
let get_user_configs _a _b _c _d =
  Sdk_config.read_config (repo ())
  |> Js.Promise.then_ (fun cfg ->
         let fmt =
           match Wire.get cfg "journal/page-title-format" with
           | Some (Wire.String s) -> s
           | _ -> "MMM do, yyyy"
         in
         resolved
           (jobj
              [ ("preferredDateFormat", jstr_ fmt)
              ; ("preferredStartOfWeek", Js.Json.number 0.)
              ; ("currentGraph", jstr_ (repo ()))
              ]))

(* kept annotation-free to avoid a Plugin_host <-> Sdk_api module
   cycle; the shape must match Sdk_api.api_fn *)
let api_methods =
  [ "load_installed_web_plugins", load_installed_plugins
  ; "save_installed_web_plugin", save_installed_plugin
  ; "unlink_installed_web_plugin", unlink_installed_plugin
  ; "load_plugin_user_settings", load_plugin_settings
  ; "save_plugin_user_settings", save_plugin_settings
  ; "update_plugin_user_settings", save_plugin_settings
  ; "unlink_plugin_user_settings", unlink_plugin_settings
  ; "load_user_preferences", load_user_preferences
  ; "save_user_preferences", save_user_preferences
  ; "register_plugin_ui_item", register_ui_item
  ; "unregister_plugin_ui_items", unregister_ui_items
  ; "register_plugin_ui_items", register_ui_item
  ; "install_plugin_hook", nil_fn
  ; "uninstall_plugin_hook", nil_fn
  ; "register_plugin_simple_command", nil_fn
  ; "unregister_plugin_simple_command", nil_fn
  ; "register_plugin_slash_command", nil_fn
  ; "unregister_plugin_slash_command", nil_fn
  ; "register_search_service", nil_fn
  ; "unregister_search_services", nil_fn
  ; "load_plugin_readme", nil_fn
  ; "load_plugin_config", nil_fn
  ; "write_dotdir_file", nil_fn
  ; "write_user_tmp_file", nil_fn
  ; "read_dotdir_file", nil_fn
  ; "unlink_dotdir_file", nil_fn
  ; "list_dotdir_files", arr0_fn
  ; "exist_dotdir_file", false_fn
  ; "save_plugin_package_json", nil_fn
  ; "read_plugin_storage_file", nil_fn
  ; "write_plugin_storage_file", nil_fn
  ; "unlink_plugin_storage_file", nil_fn
  ; "exist_plugin_storage_file", false_fn
  ; "list_plugin_storage_files", arr0_fn
  ; "get_external_plugin", get_external_plugin
  ; "invoke_external_plugin_cmd", nil_fn
  ; "validate_external_plugins", nil_fn
  ; "__install_plugin", nil_fn
  ; "get_caller_plugin_id", get_caller_plugin_id
  ; "should_exec_plugin_hook", false_fn
  ; "get_app_info", get_app_info
  ; "check_current_is_db_graph", check_is_db_graph
  ; "get_user_configs", get_user_configs
  (* main-ui visibility — plugins own no main UI surface yet, so these
     are no-ops that must still resolve (a missing method aborts the
     plugin's promise chain before e.g. push_state runs) *)
  ; "show_main_ui", nil_fn
  ; "hide_main_ui", nil_fn
  ; "toggle_main_ui", nil_fn
  ; "set_main_ui_inline_style", nil_fn
  ; "set_main_ui_attrs", nil_fn
  ]
