(* Electron main-process bindings.

   Shared externals for the "electron" module. Extend this file when a
   needed API is missing — add new externals, never change existing
   ones (other modules depend on them). Mirror the JS API shape; keep
   wrappers thin. *)

(* Opaque JS values passed straight through (options objects, ipc
   payloads). Build them with [%mel.obj] or [@@mel.obj] externals in
   the calling module; bindings take 'a/abstract slots for them. *)

module App = struct
  type t

  external t : t = "app" [@@mel.module "electron"]

  external get_path : t -> string -> string = "getPath" [@@mel.send]
  external set_path : t -> string -> string -> unit = "setPath"
    [@@mel.send]
  external get_version : t -> string = "getVersion" [@@mel.send]
  external get_name : t -> string = "getName" [@@mel.send]
  external set_name : t -> string -> unit = "setName" [@@mel.send]
  external quit : t -> unit = "quit" [@@mel.send]
  external exit : t -> int -> unit = "exit" [@@mel.send]
  external relaunch : t -> 'a option -> unit = "relaunch" [@@mel.send]
  external is_ready : t -> bool = "isReady" [@@mel.send]
  external when_ready : t -> unit Js.Promise.t = "whenReady" [@@mel.send]
  external on : t -> string -> ('a -> unit [@u]) -> unit = "on"
    [@@mel.send]
  external on2 :
    t -> string -> (Js.Json.t -> 'a -> unit [@u]) -> unit = "on"
    [@@mel.send]
  external once : t -> string -> (unit -> unit [@u]) -> unit = "once"
    [@@mel.send]
  external set_app_user_model_id : t -> string -> unit = "setAppUserModelId"
    [@@mel.send]
  external request_single_instance_lock :
    t -> 'a option -> bool = "requestSingleInstanceLock" [@@mel.send]
  external has_single_instance_lock : t -> bool
    = "hasSingleInstanceLock" [@@mel.send]
  external set_login_item_settings : t -> Js.Json.t -> unit
    = "setLoginItemSettings" [@@mel.send]
  external set_accessibility_support_enabled :
    t -> bool -> unit = "setAccessibilitySupportEnabled" [@@mel.send]
  external disable_hardware_acceleration : t -> unit
    = "disableHardwareAcceleration" [@@mel.send]
  external is_packaged : t -> bool = "isPackaged" [@@mel.get]
  external command_line_append_switch :
    t -> string -> unit = "appendSwitch"
    [@@mel.send] [@@mel.scope "commandLine"]
  external command_line_append_switch_value :
    t -> string -> string -> unit = "appendSwitch"
    [@@mel.send] [@@mel.scope "commandLine"]
end

module Browser_window = struct
  type t

  external make : 'a -> t = "BrowserWindow" [@@mel.new] [@@mel.module "electron"]
  external from_id : int -> t Js.Null.t = "fromId"
    [@@mel.module "electron"] [@@mel.scope "BrowserWindow"]
  external get_all_windows : unit -> t array = "getAllWindows"
    [@@mel.module "electron"] [@@mel.scope "BrowserWindow"]
  external load_url : t -> string -> 'a option -> unit Js.Promise.t
    = "loadURL" [@@mel.send]
  external load_file : t -> string -> 'a option -> unit Js.Promise.t
    = "loadFile" [@@mel.send]
  external web_contents : t -> < > Js.t = "webContents" [@@mel.get]
  external id : t -> int = "id" [@@mel.get]
  external on : t -> string -> ('a -> unit [@u]) -> unit = "on"
    [@@mel.send]
  external once : t -> string -> (unit -> unit [@u]) -> unit = "once"
    [@@mel.send]
  external show : t -> unit = "show" [@@mel.send]
  external close : t -> unit = "close" [@@mel.send]
  external destroy : t -> unit = "destroy" [@@mel.send]
  external focus : t -> unit = "focus" [@@mel.send]
  external restore : t -> unit = "restore" [@@mel.send]
  external minimize : t -> unit = "minimize" [@@mel.send]
  external is_minimized : t -> bool = "isMinimized" [@@mel.send]
  external is_destroyed : t -> bool = "isDestroyed" [@@mel.send]
  external is_visible : t -> bool = "isVisible" [@@mel.send]
  external is_full_screen : t -> bool = "isFullScreen" [@@mel.send]
  external set_full_screen : t -> bool -> unit = "setFullScreen" [@@mel.send]
  external set_always_on_top : t -> bool -> unit = "setAlwaysOnTop" [@@mel.send]
  external set_menu_bar_visibility : t -> bool -> unit
    = "setMenuBarVisibility" [@@mel.send]
  external set_progress_bar : t -> float -> unit = "setProgressBar"
    [@@mel.send]
  external get_bounds : t -> < x : int ; y : int ; width : int ; height : int > Js.t = "getBounds" [@@mel.send]
  external set_bounds : t -> 'a -> unit = "setBounds" [@@mel.send]
  external get_size : t -> int array = "getSize" [@@mel.send]
  external set_size : t -> int -> int -> unit = "setSize" [@@mel.send]
  external get_position : t -> int array = "getPosition" [@@mel.send]
  external set_position : t -> int -> int -> unit = "setPosition" [@@mel.send]
  external center : t -> unit = "center" [@@mel.send]
  external open_dev_tools : t -> 'a -> unit = "openDevTools"
    [@@mel.send] [@@mel.scope "webContents"]
end

module Web_contents = struct
  type t = < > Js.t

  external send : t -> string -> unit = "send" [@@mel.send]
  external send_v : t -> string -> 'a array -> unit = "send" [@@mel.send]
    [@@mel.variadic]
  external execute_javascript : t -> string -> 'a Js.Promise.t
    = "executeJavaScript" [@@mel.send]
  external set_window_open_handler : t -> Js.Json.t -> unit
    = "setWindowOpenHandler" [@@mel.send]
  external on : t -> string -> ('a -> unit [@u]) -> unit = "on"
    [@@mel.send]
  external session : t -> < > Js.t = "session" [@@mel.get]
end

module Ipc_main = struct
  type t = < > Js.t

  external handle : string -> (Js.Json.t -> 'a -> 'b Js.Promise.t [@u]) -> unit
    = "handle" [@@mel.module "electron"] [@@mel.scope "ipcMain"]
  external on : string -> (Js.Json.t -> 'a -> unit [@u]) -> unit = "on"
    [@@mel.module "electron"] [@@mel.scope "ipcMain"]
  external handle_once : string -> (Js.Json.t -> 'a -> unit [@u]) -> unit
    = "handleOnce" [@@mel.module "electron"] [@@mel.scope "ipcMain"]
  external remove_handler : string -> unit = "removeHandler"
    [@@mel.module "electron"] [@@mel.scope "ipcMain"]
  external emit : Js.Json.t -> string -> 'a array -> unit = "emit" [@@mel.send]
    [@@mel.variadic]
end

module Dialog = struct
  external show_open_dialog :
    Browser_window.t -> 'a -> 'b Js.Promise.t = "showOpenDialog"
    [@@mel.module "electron"] [@@mel.scope "dialog"]
  external show_save_dialog :
    Browser_window.t -> 'a -> 'b Js.Promise.t = "showSaveDialog"
    [@@mel.module "electron"] [@@mel.scope "dialog"]
  external show_message_box :
    Browser_window.t -> 'a -> 'b Js.Promise.t = "showMessageBox"
    [@@mel.module "electron"] [@@mel.scope "dialog"]
end

module Shell_ = struct
  external open_external : string -> unit Js.Promise.t = "openExternal"
    [@@mel.module "electron"] [@@mel.scope "shell"]
  external show_item_in_folder : string -> unit = "showItemInFolder"
    [@@mel.module "electron"] [@@mel.scope "shell"]
  external trash_item : string -> unit Js.Promise.t = "trashItem"
    [@@mel.module "electron"] [@@mel.scope "shell"]
end

module Menu_ = struct
  type t

  external build_from_template : 'a array -> t = "buildFromTemplate"
    [@@mel.module "electron"] [@@mel.scope "Menu"]
  external set_application_menu : t Js.Null.t -> unit
    = "setApplicationMenu"
    [@@mel.module "electron"] [@@mel.scope "Menu"]
end

module Native_theme = struct
  type t

  external t : t = "nativeTheme" [@@mel.module "electron"]
  external theme_source_set : t -> string -> unit = "themeSource"
    [@@mel.set]
  external should_use_dark_colors : t -> bool = "shouldUseDarkColors"
    [@@mel.get]
end

external process_platform : string = "platform" [@@mel.scope "process"]

external process_env : unit -> string Js.Dict.t = "env"
  [@@mel.scope "process"]

external process_resources_path : string = "resourcesPath"
  [@@mel.scope "process"]

(* Appended externals — port of the remaining electron main modules. *)

module Session = struct
  type t
  type web_request = < > Js.t

  external from_partition : string -> t = "fromPartition"
    [@@mel.module "electron"] [@@mel.scope "session"]
  external set_proxy : t -> 'a -> unit Js.Promise.t = "setProxy"
    [@@mel.send]
  external force_reload_proxy_config : t -> unit Js.Promise.t
    = "forceReloadProxyConfig" [@@mel.send]
  external resolve_proxy : t -> string -> string Js.Promise.t
    = "resolveProxy" [@@mel.send]
  external web_request : t -> web_request = "webRequest" [@@mel.get]
end

module Web_request = struct
  type t = Session.web_request
  type details = < responseHeaders : Js.Json.t Js.Dict.t [@mel.get] > Js.t

  external on_headers_received :
    t ->
    (details -> (Js.Json.t -> unit [@u]) -> unit [@u]) ->
    unit = "onHeadersReceived" [@@mel.send]
end

external web_contents_session : Web_contents.t -> Session.t = "session"
  [@@mel.get]

external browser_window_get_focused_window : unit -> Browser_window.t Js.Null.t
  = "getFocusedWindow"
  [@@mel.module "electron"] [@@mel.scope "BrowserWindow"]

external browser_window_from_web_contents :
  Web_contents.t -> Browser_window.t Js.Null.t = "fromWebContents"
  [@@mel.module "electron"] [@@mel.scope "BrowserWindow"]

external browser_window_set_visible_on_all_workspaces :
  Browser_window.t -> bool -> unit = "setVisibleOnAllWorkspaces"
  [@@mel.send]

(* Appended externals — window / context-menu / spell-check /
   find-in-page port. *)

external event_prevent_default : 'a -> unit = "preventDefault"
  [@@mel.send]

external app_get_app_path : unit -> string = "getAppPath"
  [@@mel.module "electron"] [@@mel.scope "app"]

external browser_window_off :
  Browser_window.t -> string -> ('a -> unit [@u]) -> unit = "off"
  [@@mel.send]

external web_contents_get_zoom_level : Web_contents.t -> float
  = "getZoomLevel" [@@mel.send]

external web_contents_on2 :
  Web_contents.t -> string -> ('a -> 'b -> unit [@u]) -> unit = "on"
  [@@mel.send]

external web_contents_off2 :
  Web_contents.t -> string -> ('a -> 'b -> unit [@u]) -> unit = "off"
  [@@mel.send]

external web_contents_set_window_open_handler :
  Web_contents.t -> ('a -> Js.Json.t [@u]) -> unit
  = "setWindowOpenHandler" [@@mel.send]

external web_contents_find_in_page :
  Web_contents.t -> string -> 'a -> int = "findInPage" [@@mel.send]

external web_contents_stop_find_in_page :
  Web_contents.t -> string -> unit = "stopFindInPage" [@@mel.send]

external web_contents_replace_misspelling :
  Web_contents.t -> string -> unit = "replaceMisspelling" [@@mel.send]

external web_contents_show_definition_for_selection :
  Web_contents.t -> unit = "showDefinitionForSelection" [@@mel.send]

external session_default_session : Session.t = "defaultSession"
  [@@mel.module "electron"] [@@mel.scope "session"]

external session_set_spell_checker_enabled :
  Session.t -> bool -> unit = "setSpellCheckerEnabled" [@@mel.send]

external session_add_word_to_spell_checker_dictionary :
  Session.t -> string -> unit = "addWordToSpellCheckerDictionary"
  [@@mel.send]

external web_request_on_before_send_headers :
  Web_request.t ->
  'a ->
  ('b -> (Js.Json.t -> unit [@u]) -> unit [@u]) ->
  unit = "onBeforeSendHeaders" [@@mel.send]

module Menu_item = struct
  type t

  external make : 'a -> t = "MenuItem" [@@mel.new] [@@mel.module "electron"]
end

external menu_make : unit -> Menu_.t = "Menu" [@@mel.new]
  [@@mel.module "electron"]

external menu_append : Menu_.t -> Menu_item.t -> unit = "append"
  [@@mel.send]

external menu_items : Menu_.t -> Menu_item.t array = "items" [@@mel.get]

external menu_popup : Menu_.t -> unit = "popup" [@@mel.send]

module Native_image = struct
  type t

  external create_from_path : string -> t = "createFromPath"
    [@@mel.module "electron"] [@@mel.scope "nativeImage"]
end

module Clipboard = struct
  external write_image : Native_image.t -> unit = "writeImage"
    [@@mel.module "electron"] [@@mel.scope "clipboard"]
end

external dialog_show_message_box_sync : 'a -> int = "showMessageBoxSync"
  [@@mel.module "electron"] [@@mel.scope "dialog"]
