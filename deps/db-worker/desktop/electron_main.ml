(* Port of src/electron/electron/core.cljs — the Electron main-process
   entry point; replaces the shadow-cljs :electron target's
   electron.core/main, emitted as static/electron.js. *)

open Electron_bindings

(* ---------- module-local externals ------------------------------------ *)

external get_index : 'a -> string -> 'b Js.Undefined.t = "" [@@mel.get_index]
external get_index_exn : 'a -> string -> 'b = "" [@@mel.get_index]
external json_of_any : 'a -> Js.Json.t = "%identity"
external as_fun : 'a -> 'b = "%identity"
external new_url : string -> Js.Json.t = "URL" [@@mel.new]
external js_dirname : string = "__dirname"
external js_require : string -> Js.Json.t = "require"
external decode_uri_component : string -> string = "decodeURIComponent"
external os_homedir : unit -> string = "homedir" [@@mel.module "os"]
external path_resolve1 : string -> string = "resolve" [@@mel.module "path"]

external promise_finally :
  'a Js.Promise.t -> ((unit -> unit)[@u]) -> 'a Js.Promise.t = "finally"
[@@mel.send]

module Fs = struct
  external exists_sync : string -> bool = "existsSync" [@@mel.module "fs"]
  external mkdir_sync : string -> 'a -> unit = "mkdirSync" [@@mel.module "fs"]

  external access_sync : string -> int -> unit = "accessSync"
  [@@mel.module "fs"]

  external read_file_sync : string -> string -> string = "readFileSync"
  [@@mel.module "fs"]

  external write_file_sync : string -> string -> string -> unit
    = "writeFileSync"
  [@@mel.module "fs"]

  external chmod_sync : string -> 'a -> unit = "chmodSync" [@@mel.module "fs"]

  external stat_sync : string -> < isDirectory : unit -> bool [@mel.meth] > Js.t
    = "statSync"
  [@@mel.module "fs"]

  external w_ok : int = "W_OK" [@@mel.module "fs"] [@@mel.scope "constants"]
end

(* ---------- constants -------------------------------------------------- *)

let lsp_scheme = "logseq"
let file_lsp_scheme = "lsp"
let file_assets_scheme = "assets"
let lsp_protocol = file_lsp_scheme ^ "://"
let static_url = lsp_protocol ^ "logseq.com/"
let plugin_url = lsp_protocol ^ "logseq.io/plugins/"
let external_plugin_url = lsp_protocol ^ "logseq.io/external/"
let host_plugin_url = static_url ^ "plugins/"
let host_external_plugin_url = static_url ^ "external/"
let plugins_root = Node.Path.join [| os_homedir (); ".logseq/plugins" |]

(* ---------- volatile state --------------------------------------------- *)

let setup_fn : (unit -> unit) option ref = ref None
let teardown_fn : (unit -> unit Js.Promise.t) option ref = ref None
let lifecycle_op : unit Js.Promise.t ref = ref (Js.Promise.resolve ())
let quit_dirty : bool ref = ref true
let win_ref : Browser_window.t option ref = ref None
let ( let* ) p f = Js.Promise.then_ f p
let exn_json (e : exn) : Js.Json.t = Cli_server.exn_as_json e

(* cljs (and f (f)) — teardown slots hold either a fn or a nil-ish value *)
let call_if_fn (t : 'a) : unit =
  if Js.typeof t = "function" then ignore ((as_fun t : unit -> unit) ()) else ()

(* ---------- helpers ----------------------------------------------------- *)

let setup_updater (win : Browser_window.t) : unit -> unit =
  Electron_updater.init_updater ~win ()

let url_protocol (u : Js.Json.t) : string = get_index_exn u "protocol"
let url_pathname (u : Js.Json.t) : string = get_index_exn u "pathname"

let open_url_handler (win : Browser_window.t) (url : string) : unit =
  Electron_logger.info_args
    [|
      Js.Json.string "open-url";
      Cli_server.js_obj [ ("url", Js.Json.string url) ];
    |];
  match
    try Some (new_url url)
    with e ->
      Electron_logger.info_args
        [|
          Js.Json.string "upon opening non-url";
          Cli_server.js_obj [ ("error", exn_json e) ];
        |];
      None
  with
  | Some parsed_url ->
      if String.equal (url_protocol parsed_url) "logseq:" then
        Electron_url.logseq_url_handler win parsed_url
  | None -> ()

(* Register Logseq as the default handler for the custom protocol.
   Windows dev runs launched through the Electron binary need the entry
   script path passed explicitly so the OS can relaunch the same app. *)
let register_default_protocol_client () : unit =
  if
    Electron_state.win32
    && Option.value ~default:false (Js.Undefined.toOption process_default_app)
  then
    let args =
      if Array.length process_argv >= 2 && String.length process_argv.(1) > 0
      then [| path_resolve1 process_argv.(1) |]
      else [||]
    in
    ignore
      (app_set_as_default_protocol_client_full App.t lsp_scheme
         process_exec_path args)
  else ignore (app_set_as_default_protocol_client App.t lsp_scheme)

(* first (string/split url #"[?#]" 2) *)
let cut_at_query (s : string) : string =
  let min2 a b = if a < 0 then b else if b < 0 then a else min a b in
  let i =
    min2 (Js.String.indexOf ~search:"?" s) (Js.String.indexOf ~search:"#" s)
  in
  if i < 0 then s else String.sub s 0 i

let str_replace_first_literal (s : string) (old : string) (new_ : string) :
    string =
  match Js.String.indexOf ~search:old s with
  | -1 -> s
  | i ->
      String.sub s 0 i ^ new_
      ^ String.sub s
          (i + String.length old)
          (String.length s - i - String.length old)

(* (string/index-of s "/") *)
let index_of_slash (s : string) : int = Js.String.indexOf ~search:"/" s

let setup_interceptor () : unit -> unit =
  Protocol.register_file_protocol Protocol.t file_assets_scheme
    (fun[@u] (request : Js.Json.t) (callback : (Js.Json.t -> unit[@u])) ->
      let url = get_index_exn request "url" in
      let url = Electron_utils.decode_protected_assets_schema_path url in
      (* Query and fragment belong to the document URL, not the
          filename. *)
      let path =
        cut_at_query url |> fun u ->
        str_replace_first_literal u "assets://" "" |> decode_uri_component
      in
      if
        (String.length path > 0 && path.[0] = '/')
        || Regexp.test (Regexp.compile ~caseless:true "^/[a-zA-Z]:") path
      then callback (Cli_server.js_obj [ ("path", Js.Json.string path) ]) [@u]
      else if Electron_state.win32 then begin
        (* assume windows unc path *)
        Electron_logger.debug ":resolve-assets-url %s" url;
        callback
          (Cli_server.js_obj [ ("path", Js.Json.string ("//" ^ path)) ]) [@u]
      end
      else begin
        Electron_logger.warn_args
          [|
            Js.Json.string ":electron.core/resolve-assets-url";
            Js.Json.string "Unknown assets url";
            Js.Json.string url;
          |];
        callback (Cli_server.js_obj [ ("path", Js.Json.string path) ]) [@u]
      end);

  Protocol.register_file_protocol Protocol.t file_lsp_scheme
    (fun[@u] (request : Js.Json.t) (callback : (Js.Json.t -> unit[@u])) ->
      let url = get_index_exn request "url" in
      let url' = new_url url in
      let plugin_url' =
        Common_util.str_starts_with url plugin_url
        || Common_util.str_starts_with url host_plugin_url
      in
      let external_plugin_url' =
        Common_util.str_starts_with url external_plugin_url
        || Common_util.str_starts_with url host_external_plugin_url
      in
      let compatible_plugin_url' =
        Common_util.str_starts_with url (lsp_protocol ^ "logseq.io/")
        && not external_plugin_url'
      in
      let path0 = url_pathname url' in
      let path =
        if plugin_url' then
          Node.Path.join
            [|
              plugins_root;
              str_replace_first_literal
                (Electron_utils.safe_decode_uri_component path0)
                "/plugins" "";
            |]
        else if compatible_plugin_url' then
          Node.Path.join
            [| plugins_root; Electron_utils.safe_decode_uri_component path0 |]
        else if external_plugin_url' then
          let external_path =
            String.sub path0
              (String.length "/external/")
              (String.length path0 - String.length "/external/")
          in
          let separator_index = index_of_slash external_path in
          let encoded_root =
            if separator_index >= 0 then
              String.sub external_path 0 separator_index
            else external_path
          in
          let relative_path =
            if separator_index >= 0 then
              String.sub external_path separator_index
                (String.length external_path - separator_index)
            else ""
          in
          let root = Electron_utils.safe_decode_uri_component encoded_root in
          let rel = Electron_utils.safe_decode_uri_component relative_path in
          Node.Path.join [| root; rel |]
        else
          Node.Path.join
            [| js_dirname; Electron_utils.safe_decode_uri_component path0 |]
      in
      (callback (Cli_server.js_obj [ ("path", Js.Json.string path) ]) [@u]));

  fun () ->
    Protocol.unregister_protocol Protocol.t file_lsp_scheme;
    Protocol.unregister_protocol Protocol.t file_assets_scheme

(* js->clj asset-filenames then (remove nil?) — strings are removed,
   a bare string explodes into characters the way cljs seqs do. *)
let asset_filenames_of_js (v : Js.Json.t) : string list =
  match Js.Json.classify v with
  | Js.Json.JSONArray a ->
      Array.to_list a |> List.filter_map Js.Json.decodeString
  | Js.Json.JSONString s ->
      List.init (String.length s) (fun i -> String.make 1 s.[i])
  | _ -> []

let handle_export_publish_assets (_event : Js.Json.t) (html : Js.Json.t)
    (repo_path : Js.Json.t) (asset_filenames : Js.Json.t)
    (output_path : Js.Json.t) : unit Js.Promise.t =
  let app_path = app_get_app_path () in
  let asset_filenames = asset_filenames_of_js asset_filenames in
  let* root_dir =
    match Js.Json.decodeString output_path with
    | Some p -> Js.Promise.resolve (Some p)
    | None -> Electron_handler.open_dir_dialog ()
  in
  match root_dir with
  | Some root_dir ->
      Cli_server.promise_of_task
        (Publishing_export.create_export
           (Option.value ~default:"" (Js.Json.decodeString html))
           app_path
           (Option.value ~default:"" (Js.Json.decodeString repo_path))
           root_dir
           ~notification_fn:(fun (n : Publishing_export.notification) ->
             Electron_utils.send_to_renderer "notification"
               (Cli_server.js_obj
                  [
                    ("type", Js.Json.string n.ntype);
                    ("payload", Js.Json.string n.payload);
                  ]))
           ~log_error_fn:(fun msg detail err ->
             Electron_logger.error_args
               [|
                 Js.Json.string msg; Js.Json.string detail; Js.Json.string err;
               |])
           ~asset_filenames ())
  | None -> Js.Promise.resolve ()

(* cljs (boolean x): nil/false → false, everything else (incl 0 and "")
   → true *)
external json_as_undefined : 'a -> 'b Js.Undefined.t = "%identity"
external json_as_null : 'a -> 'b Js.Null.t = "%identity"

let cljs_truthy (v : 'a) : bool =
  match Js.Undefined.toOption (json_as_undefined v) with
  | None -> false
  | Some v -> (
      match Js.Null.toOption (json_as_null v) with
      | None -> false
      | Some v -> (
          match Js.Json.decodeBoolean v with Some false -> false | _ -> true))

external reflect_apply : 'a -> 'b -> 'c array -> Js.Json.t = "apply"
[@@mel.scope "Reflect"]

(* js-invoke's `type` arg arrives as a JS value *)
let js_method_name (v : Js.Json.t) : string =
  match Js.Json.decodeString v with Some s -> s | None -> Js.Json.stringify v

(* (js-invoke target type args) *)
let js_invoke (target : 'a) (typ : string) (args : 'b array) : unit =
  ignore (reflect_apply (get_index_exn target typ) (json_of_any target) args)

(* collect the defined rest-args of an ipc_main_handle_args callback *)
let collect_rest (a : 'a Js.Undefined.t) (b : 'b Js.Undefined.t)
    (c : 'c Js.Undefined.t) (d : 'd Js.Undefined.t) (e : 'e Js.Undefined.t) :
    Js.Json.t array =
  [ a; b; c; d; e ]
  |> List.filter_map (fun v -> Option.map json_of_any (Js.Undefined.toOption v))
  |> Array.of_list

let setup_app_manager (win : Browser_window.t) : unit -> unit =
  let toggle_win_channel = "toggle-max-or-min-active-win"
  and call_app_channel = "call-application"
  and call_win_channel = "call-main-win"
  and export_publish_assets = "export-publish-assets"
  and quit_dirty_state = "set-quit-dirty-state" in
  let clear_win_effects = Electron_window.setup_window win in

  Ipc_main.handle quit_dirty_state (fun[@u] _ev dirty ->
      quit_dirty := cljs_truthy dirty;
      Js.Promise.resolve Js.Undefined.empty);

  Ipc_main.handle toggle_win_channel (fun[@u] _ev toggle_min ->
      (match Js.Null.toOption (browser_window_get_focused_window ()) with
      | Some active_win ->
          if cljs_truthy toggle_min then
            if Browser_window.is_minimized active_win then
              Browser_window.restore active_win
            else Browser_window.minimize active_win
          else if browser_window_is_maximized active_win then
            browser_window_unmaximize active_win
          else browser_window_maximize active_win
      | None -> ());
      Js.Promise.resolve Js.Undefined.empty);

  ignore
    (ipc_main_handle5 export_publish_assets
       (fun[@u] ev html repo_path asset_filenames output_path ->
         handle_export_publish_assets ev html repo_path asset_filenames
           output_path));

  (* melange can't capture js rest-args — the callback binds event, type
     and the first five variadic slots (zero callers pass more). *)
  ignore
    (ipc_main_handle_args call_app_channel
       (fun[@u] _ev (typ : Js.Json.t) a b c d e ->
         let args = collect_rest a b c d e in
         (try js_invoke App.t (js_method_name typ) args
          with e ->
            Electron_logger.error_args
              [| Js.Json.string (call_app_channel ^ " "); exn_json e |]);
         Js.Undefined.empty));

  ignore
    (ipc_main_handle_args call_win_channel
       (fun[@u] (ev : Js.Json.t) (typ : Js.Json.t) a b c d e ->
         let args = collect_rest a b c d e in
         (match Electron_utils.get_win_from_sender ev with
         | Some w -> (
             try js_invoke w (js_method_name typ) args
             with e ->
               Electron_logger.error_args
                 [| Js.Json.string (call_win_channel ^ " "); exn_json e |])
         | None -> ());
         Js.Undefined.empty));

  fun () ->
    clear_win_effects ();
    Ipc_main.remove_handler toggle_win_channel;
    Ipc_main.remove_handler export_publish_assets;
    Ipc_main.remove_handler quit_dirty_state;
    Ipc_main.remove_handler call_app_channel;
    Ipc_main.remove_handler call_win_channel

(* ---------- menu -------------------------------------------------------- *)

let menu_item (pairs : (string * Js.Json.t) list) : Js.Json.t =
  Js.Json.object_ (Js.Dict.fromList pairs)

let set_app_menu () : unit =
  let about_fn () =
    ignore
      (dialog_show_message_box
         (Cli_server.js_obj
            [
              ("title", Js.Json.string "Logseq");
              ( "icon",
                Js.Json.string
                  (Node.Path.join [| js_dirname; "icons/logseq.png" |]) );
              ( "message",
                Js.Json.string
                  (Electron_i18n.t "electron/version"
                     [| Electron_updater.electron_version |]) );
            ]))
  in
  let template =
    if Electron_state.mac then
      [|
        menu_item
          [
            ("label", Js.Json.string (App.get_name App.t));
            ( "submenu",
              Js.Json.array
                [|
                  menu_item [ ("role", Js.Json.string "about") ];
                  menu_item [ ("type", Js.Json.string "separator") ];
                  menu_item [ ("role", Js.Json.string "services") ];
                  menu_item [ ("type", Js.Json.string "separator") ];
                  menu_item [ ("role", Js.Json.string "hide") ];
                  menu_item [ ("role", Js.Json.string "hideOthers") ];
                  menu_item [ ("role", Js.Json.string "unhide") ];
                  menu_item [ ("type", Js.Json.string "separator") ];
                  menu_item [ ("role", Js.Json.string "quit") ];
                |] );
          ];
      |]
    else [||]
  in
  let template =
    Array.append template
      [|
        menu_item
          [
            ("role", Js.Json.string "fileMenu");
            ( "submenu",
              Js.Json.array
                [|
                  menu_item
                    [
                      ( "label",
                        Js.Json.string
                          (Electron_i18n.t "electron/new-window" [||]) );
                      ( "click",
                        json_of_any (fun () ->
                            ignore (Electron_handler.open_new_window None)) );
                      ( "accelerator",
                        Js.Json.string
                          (if Electron_state.mac then "CommandOrControl+N"
                           else
                             (* Avoid conflict with `Control+N` shortcut
                                  to move down in the text editor on
                                  Windows/Linux *)
                             "Shift+CommandOrControl+N") );
                    ];
                  (if Electron_state.mac then
                     (* Disable Command+W shortcut *)
                     menu_item
                       [
                         ("role", Js.Json.string "close");
                         ("accelerator", Js.Json.boolean false);
                       ]
                   else menu_item [ ("role", Js.Json.string "quit") ]);
                |] );
          ];
        menu_item [ ("role", Js.Json.string "editMenu") ];
        menu_item [ ("role", Js.Json.string "viewMenu") ];
        menu_item
          [
            ("role", Js.Json.string "windowMenu");
            ( "submenu",
              Js.Json.array
                (Array.append
                   (if Electron_state.mac then [||]
                    else
                      [|
                        menu_item [ ("role", Js.Json.string "minimize") ];
                        menu_item [ ("role", Js.Json.string "zoom") ];
                        (* Disable Control+W shortcut *)
                        menu_item
                          [
                            ("role", Js.Json.string "close");
                            ("accelerator", Js.Json.boolean false);
                          ];
                      |])
                   [|
                     menu_item
                       [
                         ("label", Js.Json.string "Always on Top");
                         ("type", Js.Json.string "checkbox");
                         ( "click",
                           json_of_any (fun[@u] menu_item browser_window ->
                               Browser_window.set_always_on_top browser_window
                                 (get_index_exn menu_item "checked")) );
                       ];
                   |]) );
          ];
      |]
  in
  (* Windows has no about role *)
  let template =
    Array.append template
      [|
        menu_item
          [
            ("role", Js.Json.string "help");
            ( "submenu",
              Js.Json.array
                (Array.append
                   [|
                     menu_item
                       [
                         ( "label",
                           Js.Json.string
                             (Electron_i18n.t "electron/official-docs" [||]) );
                         ( "click",
                           json_of_any (fun () ->
                               ignore
                                 (Shell_.open_external
                                    "https://docs.logseq.com/")) );
                       ];
                   |]
                   (if Electron_state.mac then [||]
                    else
                      [|
                        menu_item
                          [
                            ("role", Js.Json.string "about");
                            ( "label",
                              Js.Json.string
                                (Electron_i18n.t "electron/about" [||]) );
                            ("click", json_of_any about_fn);
                          ];
                      |])) );
          ];
      |]
  in
  (* Enable Cmd/Ctrl+= Zoom In *)
  let template =
    Array.append template
      [|
        menu_item
          [
            ("role", Js.Json.string "zoomin");
            ("accelerator", Js.Json.string "CommandOrControl+=");
          ];
      |]
  in
  let menu = Menu_.build_from_template template in
  Menu_.set_application_menu (Js.Null.return menu)

(* ---------- deeplinks --------------------------------------------------- *)

(* Extract a deeplink URL from command-line argument strings. *)
let find_deeplink_url (args : string list) : string option =
  List.find_opt (fun a -> Common_util.str_starts_with a (lsp_scheme ^ ":")) args

let setup_deeplink () : unit =
  (* macOS: app fires open-url for custom-protocol links when the app is
     already running *)
  App.on2 App.t "open-url" (fun[@u] event url ->
      event_prevent_default event;
      match !win_ref with Some win -> open_url_handler win url | None -> ())

(* On Windows/Linux, the protocol URL is passed as a command-line
   argument on the first launch. Call this after the main window is
   ready. *)
let handle_initial_deeplink (win : Browser_window.t) : unit =
  if not Electron_state.mac then
    match find_deeplink_url (List.tl (Array.to_list process_argv)) with
    | Some url -> open_url_handler win url
    | None -> ()

(* ---------- wrong-release warning ---------------------------------------- *)

let maybe_warn_wrong_release () : unit =
  if
    Electron_release_warning.x64_on_apple_silicon
      {
        Electron_release_warning.platform = process_platform;
        arch = process_arch;
        running_under_arm64_translation =
          Option.value ~default:false
            (Js.Undefined.toOption (app_running_under_arm64_translation App.t));
      }
  then
    ignore
      (Js.Promise.catch
         (fun e ->
           Electron_logger.warn_args
             [|
               Js.Json.string ":electron/wrong-release-warning-failed";
               exn_json (Cli_server.promise_error_as_exn e);
             |];
           Js.Promise.resolve ())
         (Js.Promise.then_
            (fun result ->
              match
                Electron_release_warning.selected_release_url
                  (get_index_exn result "response")
              with
              | Some url ->
                  Js.Promise.then_
                    (fun () -> Js.Promise.resolve ())
                    (Shell_.open_external url)
              | None -> Js.Promise.resolve ())
            (dialog_show_message_box
               (let d =
                  Electron_release_warning.warning_dialog_options (fun key ->
                      Electron_i18n.t key [||])
                in
                Js.Dict.set d "title" (Js.Json.string "Logseq");
                Js.Json.object_ d))))

(* ---------- cli launcher ------------------------------------------------- *)

let writable_dir (dir : string) : bool =
  try
    if Fs.exists_sync dir && (Fs.stat_sync dir)##isDirectory () then (
      Fs.access_sync dir Fs.w_ok;
      true)
    else false
  with _ -> false

let ensure_dir (dir : string) : unit =
  if not (Fs.exists_sync dir) then
    Fs.mkdir_sync dir [%mel.obj { recursive = true }]

let path_join (paths : string list) : string =
  Node.Path.join (Array.of_list paths)

let preferred_unix_cli_dir () : string option =
  Electron_cli_install.preferred_unix_cli_dir
    {
      windows = Electron_state.win32;
      cli_path = "";
      cli_dir = None;
      cli_dir_fn = None;
      exe_path = "";
      appimage_path = None;
      home_dir = os_homedir ();
      path_join;
      exists = Fs.exists_sync;
      read_file = (fun path -> Fs.read_file_sync path "utf8");
      write_file = (fun path content -> Fs.write_file_sync path content "utf8");
      chmod = Fs.chmod_sync;
      ensure_dir;
      writable_dir;
      show_error_box = dialog_show_error_box;
      t = Electron_i18n.t;
      log_info = (fun a b -> Electron_logger.info_args [| a; b |]);
      log_warn =
        (fun a b err ->
          Electron_logger.warn_args
            [| Js.Json.string a; Js.Json.string b; json_of_any err |]);
    }

let preferred_win_cli_dir () : string option =
  let env = process_env in
  let path_env =
    match Js.Dict.get env "PATH" with
    | Some p -> p
    | None -> Js.Dict.get env "Path" |> Option.value ~default:""
  in
  let path_dirs =
    Electron_cli_install.split_path_env ~windows:Electron_state.win32 path_env
  in
  let windows_apps_dir =
    match Js.Dict.get env "LOCALAPPDATA" with
    | Some local_appdata ->
        Some (Node.Path.join [| local_appdata; "Microsoft"; "WindowsApps" |])
    | None -> None
  in
  match
    match windows_apps_dir with
    | Some dir ->
        ensure_dir dir;
        if writable_dir dir then Some dir else None
    | None -> None
  with
  | Some dir -> Some dir
  | None -> List.find_opt writable_dir path_dirs

let cli_script_path () : string =
  if App.is_packaged App.t then
    Node.Path.join
      [| process_resources_path; "app.asar"; "js"; "logseq-cli.js" |]
  else Node.Path.join [| js_dirname; "logseq-cli.js" |]

let install_cli_launcher () : unit =
  let cli_path = cli_script_path () in
  let cli_dir_fn () =
    if Electron_state.win32 then preferred_win_cli_dir ()
    else preferred_unix_cli_dir ()
  in
  let env = process_env in
  Electron_cli_install.install_cli_launcher
    {
      windows = Electron_state.win32;
      cli_path;
      cli_dir = None;
      cli_dir_fn = Some cli_dir_fn;
      exe_path = App.get_path App.t "exe";
      appimage_path = Js.Dict.get env "APPIMAGE";
      home_dir = os_homedir ();
      path_join;
      exists = Fs.exists_sync;
      read_file = (fun path -> Fs.read_file_sync path "utf8");
      write_file = (fun path content -> Fs.write_file_sync path content "utf8");
      chmod = Fs.chmod_sync;
      ensure_dir;
      writable_dir;
      show_error_box = dialog_show_error_box;
      t = Electron_i18n.t;
      log_info = (fun a b -> Electron_logger.info_args [| a; b |]);
      log_warn =
        (fun a b err ->
          Electron_logger.warn_args
            [| Js.Json.string a; Js.Json.string b; json_of_any err |]);
    }

(* setup effects builder — cljs vreset! *setup-fn body *)
let build_teardowns (t0 : 'a) (win : Browser_window.t) () : unit =
  let teardowns =
    [
      json_of_any t0;
      json_of_any (setup_updater win);
      json_of_any (setup_app_manager win);
      json_of_any (Electron_handler.set_ipc_handler win);
      json_of_any (Electron_server.setup win);
      (if Electron_configs.semantic_search_enabled () then
         json_of_any (Electron_embedding_server.setup App.t)
       else Js.Json.null);
      json_of_any (Electron_exceptions.setup_exception_listeners ());
    ]
  in
  teardown_fn :=
    Some
      (fun () ->
        promise_finally
          (Js.Promise.then_
             (fun (_ : bool) -> Js.Promise.resolve ())
             (Electron_handler.stop_all_db_workers ()))
          (fun[@u] () -> List.iter call_if_fn teardowns))

(* ---------- app ready --------------------------------------------------- *)

let on_app_ready () : unit =
  App.on App.t "ready" (fun[@u] _e ->
      Electron_logger.info "Logseq App(%s) Starting... " (App.get_version App.t);

      (* Add React developer tool *)
      (if Electron_state.dev then
         match
           try Some (js_require "electron-devtools-installer") with _ -> None
         with
         | Some devtools_installer ->
             let react_devtools =
               get_index_exn devtools_installer "REACT_DEVELOPER_TOOLS"
             in
             let install_fn = get_index_exn devtools_installer "default" in
             ignore
               (Js.Promise.then_
                  (fun _ ->
                    Js.log2 "Added Extension:" react_devtools;
                    Js.Promise.resolve ())
                  ((as_fun install_fn
                     : Js.Json.t -> Js.Json.t Js.Promise.t)
                     react_devtools))
         | None -> ());

      Electron_db_worker.prepare_startup ()
      |> Js.Promise.then_ (fun _ ->
          let t0 = setup_interceptor () in
          Electron_window.create_main_window
            ~url:Electron_window.main_window_entry None
          |> Js.Promise.then_ (fun win ->
              win_ref := Some win;
              Electron_state.main_window := Some win;

              ignore (Electron_utils.restore_proxy_settings ());

              Electron_js_utils.disable_x_frame_options win;

              Electron_db.ensure_graphs_dir ();
              install_cli_launcher ();

              (* Windows/Linux: handle deeplink URL passed on
                       first launch via argv *)
              handle_initial_deeplink win;
              maybe_warn_wrong_release ();

              setup_fn := Some (build_teardowns t0 win);

              (* setup effects *)
              (match !setup_fn with
              | Some f -> f ()
              | None -> ());

              (* main window events *)
              Browser_window.on win "close" (fun[@u] e ->
                  if !quit_dirty then (
                    (* when not updating *)
                    event_prevent_default e;
                    let windows = Electron_window.get_all_windows ()
                    and window = !win_ref in
                    let multiple_windows = Array.length windows > 1 in
                    if
                      multiple_windows || (not Electron_state.mac)
                      || !Electron_window.quitting
                    then
                      match window with
                      | Some _ ->
                          Electron_window.close_handler win e;
                          win_ref := None
                      | None -> ()
                    else if Electron_state.mac && not multiple_windows then (
                      (* Just hiding — no actual closing *)
                      event_prevent_default e;
                      if Electron_state.mac && Browser_window.is_full_screen win
                      then (
                        Browser_window.once win "leave-full-screen"
                          (fun[@u] () -> browser_window_hide win);
                        Browser_window.set_full_screen win false)
                      else browser_window_hide win)));

              App.on App.t "before-quit" (fun[@u] _e ->
                  Electron_window.quitting := true;
                  ignore
                    (promise_finally (Electron_handler.stop_all_db_workers ())
                       (fun[@u] () -> Electron_embedding_server.stop ())));

              App.on App.t "activate" (fun[@u] _e ->
                  match !win_ref with
                  | Some _ -> Browser_window.show win
                  | None -> ());

              Js.Promise.resolve ()))
      |> Js.Promise.catch (fun error ->
          Electron_logger.error_args
            [|
              Js.Json.string ":electron/worker-upgrade-failed";
              exn_json (Cli_server.promise_error_as_exn error);
            |];
          App.quit App.t;
          Js.Promise.resolve ())
      |> ignore)

let main () : unit =
  if not (App.request_single_instance_lock App.t None) then App.quit App.t
  else
    let privileges =
      Js.Dict.fromList
        [
          ("standard", Js.Json.boolean true);
          ("secure", Js.Json.boolean true);
          ("bypassCSP", Js.Json.boolean true);
          ("corsEnabled", Js.Json.boolean true);
          ("supportFetchAPI", Js.Json.boolean true);
        ]
    in
    let stream_privileges =
      Js.Dict.fromList
        (List.map
           (fun (k, v) -> (k, v))
           (Array.to_list (Js.Dict.entries privileges))
        @ [ ("stream", Js.Json.boolean true) ])
    in
    Protocol.register_schemes_as_privileged Protocol.t
      [|
        menu_item
          [
            ("scheme", Js.Json.string lsp_scheme);
            ("privileges", Js.Json.object_ privileges);
          ];
        menu_item
          [
            ("scheme", Js.Json.string file_lsp_scheme);
            ("privileges", Js.Json.object_ privileges);
          ];
        menu_item
          [
            ("scheme", Js.Json.string file_assets_scheme);
            ("privileges", Js.Json.object_ stream_privileges);
          ];
      |];

    register_default_protocol_client ();
    set_app_menu ();
    Electron_i18n.set_on_locale_change set_app_menu;
    setup_deeplink ();

    App.on3 App.t "second-instance"
      (fun[@u] _event (command_line : Js.Json.t) _working_directory ->
        match !win_ref with
        | Some window -> (
            Electron_window.switch_to_window window;
            (* Windows/Linux: deeplink URL may appear in
                subsequent-instance commandLine *)
            let args =
              match Js.Json.decodeArray command_line with
              | Some a -> (
                  Array.to_list a |> List.filter_map Js.Json.decodeString
                  |> function
                  | _ :: tl -> tl
                  | [] -> [])
              | None -> []
            in
            match find_deeplink_url args with
            | Some url -> open_url_handler window url
            | None -> ())
        | None -> ());

    App.on App.t "window-all-closed" (fun[@u] _e ->
        Electron_logger.debug_args [| "window-all-closed"; "Quitting..." |];
        ignore
          (promise_finally (Electron_handler.stop_all_db_workers ())
             (fun[@u] () ->
               Electron_embedding_server.stop ();
               App.quit App.t)));

    on_app_ready ()

(* ---------- start/stop -------------------------------------------------- *)

let run_current_teardown () : unit Js.Promise.t =
  match !teardown_fn with
  | Some teardown -> (
      teardown_fn := None;
      try
        Js.Promise.catch
          (fun e ->
            Electron_logger.warn_args
              [|
                Js.Json.string ":electron/teardown-failed";
                exn_json (Cli_server.promise_error_as_exn e);
              |];
            Js.Promise.resolve ())
          (teardown ())
      with e ->
        Electron_logger.warn_args
          [| Js.Json.string ":electron/teardown-failed"; exn_json e |];
        Js.Promise.resolve ())
  | None -> Js.Promise.resolve ()

let start () : unit Js.Promise.t =
  Electron_logger.debug "Main - start";
  Electron_lifecycle.enqueue lifecycle_op (fun () ->
      Js.Promise.then_
        (fun () ->
          match !setup_fn with
          | Some f ->
              f ();
              Js.Promise.resolve ()
          | None -> Js.Promise.resolve ())
        (run_current_teardown ()))

let stop () : unit Js.Promise.t =
  Electron_logger.debug "Main - stop";
  Electron_lifecycle.enqueue lifecycle_op run_current_teardown
