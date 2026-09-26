(* Port of src/electron/electron/window.cljs — main-window creation,
   window-state keeping, navigation/link handlers, and per-graph window
   bookkeeping. *)

open Electron_bindings

external __dirname : string = "__dirname"

module Url = struct
  type t

  external make : string -> t = "URL" [@@mel.new]
  external protocol : t -> string = "protocol" [@@mel.get]
end

(* electron-window-state (CJS default-exported function). *)
external window_state_keeper_mod : 'a = "electron-window-state"
  [@@mel.module]

type window_state

external win_state_width : window_state -> int = "width" [@@mel.get]
external win_state_height : window_state -> int = "height" [@@mel.get]

let window_state_keeper (opts : 'a) : window_state =
  let f : 'a -> window_state =
    Electron_interop.default_function_or_module window_state_keeper_mod
  in
  f opts

(* Event-object property getters (webRequest details, window.open
   details). *)
external details_request_headers : 'a -> string Js.Dict.t
  = "requestHeaders" [@@mel.get]

external details_url : 'a -> string = "url" [@@mel.get]
external details_features : 'a -> string = "features" [@@mel.get]

(* cljs `*quitting?` atom — flipped by electron.core's before-quit. *)
let quitting : bool ref = ref false

let main_window_entry : string =
  if Electron_state.dev then
    (* Use index.html to test plugins on development mode *)
    "http://localhost:3001"
  else
    (* Loading the renderer through Logseq's privileged scheme keeps the
       parent origin non-opaque for plugin iframe postMessage
       handshakes. *)
    "lsp://logseq.com/index.html"

let create_main_window ?(url = main_window_entry)
    (opts : 'a Js.t option) : Browser_window.t Js.Promise.t =
  let win_state =
    window_state_keeper
      [%mel.obj { defaultWidth = 980; defaultHeight = 700 }]
  in
  let graph : string option =
    match opts with
    | Some o -> Js.Undefined.toOption (Electron_utils.get_index o "graph")
    | None -> None
  in
  let url =
    match graph with
    | Some graph -> url ^ "#/?graph=" ^ graph
    | None -> url
  in
  let spell_check_enabled =
    Electron_spell_check.session_spellcheck_enabled
      (Electron_configs.get_item "spell-check")
  in
  let initial_spell_check_enabled, ready_spell_check_enabled =
    Electron_spell_check.startup_spellcheck_states Electron_state.linux
      spell_check_enabled
  in
  (* SEE https://www.electronjs.org/docs/latest/faq#the-font-looks-blurry-what-is-this-and-what-can-i-do
     for backgroundColor *)
  let win_opts =
    [%mel.obj
      { backgroundColor = "#fff"
      ; width = win_state_width win_state
      ; height = win_state_height win_state
      ; frame =
          Electron_state.mac
          || Clj_value.truthy
               (Electron_configs.get_item "window/native-titlebar?")
      ; titleBarStyle = "hiddenInset"
      ; trafficLightPosition = [%mel.obj { x = 16; y = 16 }]
      ; autoHideMenuBar = not Electron_state.mac
      ; show = false
      ; webPreferences =
          [%mel.obj
            { plugins = true
            ; nodeIntegration = false
            ; nodeIntegrationInWorker = false
            ; nativeWindowOpen = true
            ; sandbox = false
            ; webSecurity = not Electron_state.dev
            ; contextIsolation = true
            ; enableBlinkFeatures = "OverlayScrollbars"
            ; preload = Node.Path.join [| __dirname; "js/preload.js" |]
            }] }]
  in
  let win_opts =
    match opts with
    | Some o -> Electron_utils.object_assign win_opts o
    | None -> win_opts
  in
  if Electron_state.linux then
    Electron_utils.set_index win_opts "icon"
      (Node.Path.join [| __dirname; "icons/logseq.png" |]);
  let win = Browser_window.make win_opts in
  ignore
    (Electron_spell_check.apply_window_spellcheck win
       initial_spell_check_enabled);
  web_request_on_before_send_headers
    (Session.web_request session_default_session)
    [%mel.obj { urls = [| "*://*.youtube.com/*" |] }]
    (fun [@u] details callback ->
       let headers : Js.Json.t Js.Dict.t = Js.Dict.empty () in
       Array.iter
         (fun (k, v) ->
            if k <> "Cookie" && k <> "cookie" then
              Js.Dict.set headers k (Js.Json.string v))
         (Js.Dict.entries (details_request_headers details));
       Js.Dict.set headers "Referrer-Policy"
         (Js.Json.string "strict-origin-when-cross-origin");
       Js.Dict.set headers "referer" (Js.Json.string "https://logseq.com");
       let response = Js.Dict.empty () in
       Js.Dict.set response "cancel" (Js.Json.boolean false);
       Js.Dict.set response "requestHeaders" (Js.Json.object_ headers);
       (callback (Js.Json.object_ response) [@u]));
  (* Keep spellcheck disabled until ready-to-show on Linux to avoid the
     Electron 40+ cached dictionary initialization race (#50327). *)
  Browser_window.once win "ready-to-show"
    (fun [@u] () ->
       ignore
         (Electron_spell_check.apply_window_spellcheck win
            ready_spell_check_enabled);
       Browser_window.show win);
  ignore (Browser_window.load_url win url None);
  Js.Promise.resolve win

let get_all_windows () : Browser_window.t array =
  Browser_window.get_all_windows ()

let destroy_window (win : Browser_window.t) : unit =
  Browser_window.destroy win

let close_handler (win : Browser_window.t) (e : 'a) : unit =
  event_prevent_default e;
  Electron_db_worker.release_window (Browser_window.id win);
  Electron_state.close_window win;
  let web_contents = Browser_window.web_contents win in
  Web_contents.send_v web_contents "persist-zoom-level"
    [| web_contents_get_zoom_level web_contents |];
  destroy_window win

(* TODO merge with the on close in core *)
let on_close_actions (win : Browser_window.t) : unit =
  Browser_window.on win "close" (fun [@u] e -> close_handler win e)

let switch_to_window (win : Browser_window.t) : unit =
  if Browser_window.is_minimized win then Browser_window.restore win;
  (* Ref: https://github.com/electron/electron/issues/8734 *)
  browser_window_set_visible_on_all_workspaces win true;
  Browser_window.focus win;
  browser_window_set_visible_on_all_workspaces win false

(* cljs keys :window/graph by the window object; here it is keyed by
   window id, so ids are resolved back through BrowserWindow.fromId. *)
let get_graph_all_windows (graph_path : string) : Browser_window.t list =
  Hashtbl.fold
    (fun id path acc ->
       if String.equal path graph_path then id :: acc else acc)
    Electron_state.window_graph []
  |> List.filter_map (fun id ->
       Js.Null.toOption (Browser_window.from_id id))

let graph_has_other_window (win : Browser_window.t) (dir : string) :
    bool =
  let win_id = Browser_window.id win in
  List.exists
    (fun window ->
       (not (Browser_window.is_destroyed window))
       && Browser_window.id window <> win_id)
    (get_graph_all_windows dir)

let open_default_app (url : string)
    (default_open : string -> unit Js.Promise.t) : unit =
  let parsed_url =
    try Some (Url.make url) with _ -> None
  in
  match parsed_url with
  | Some parsed ->
      let protocol = Url.protocol parsed in
      if
        String.equal protocol "https:"
        || String.equal protocol "http:"
        || String.equal protocol "mailto:"
      then ignore (Shell_.open_external url)
      else (
        (* %mel.obj emits a literal `type_` field, so the reserved `type`
           key is set through Js.Dict instead. *)
        let opts =
          Js.Dict.fromList
            [ ("type", Js.Json.string "warning")
            ; ( "message"
              , Js.Json.string
                  (Electron_i18n.t "electron/link-open-confirm" [| url |]) )
            ; ("defaultId", Js.Json.number 1.0)
            ; ("cancelId", Js.Json.number 0.0)
            ; ( "buttons"
              , Js.Json.stringArray
                  [| Electron_i18n.t "electron/cancel" [||]
                   ; Electron_i18n.t "electron/ok" [||] |] ) ]
        in
        let res = dialog_show_message_box_sync (Js.Json.object_ opts) in
        if res = 1 then ignore (default_open url))
  | None -> ()

let setup_window (win : Browser_window.t) : unit -> unit =
  let web_contents = Browser_window.web_contents win in

  let open_external url =
    let url =
      if Common_util.str_starts_with url "file:" then
        Electron_utils.safe_decode_uri_component url
      else url
    in
    let url =
      if not Electron_state.win32 then
        Common_util.str_replace_all url "file://" ""
      else url
    in
    Electron_logger.info_args [| "new-window"; url |];
    let app_index =
      Node.Path.join [| app_get_app_path (); "index.html" |]
    in
    if Common_util.str_includes (Node.Path.normalize url) app_index then
      Electron_logger.info_args [| "pass-window"; url |]
    else
      open_default_app url (fun u -> Electron_utils.open_external u None)
  in

  let will_navigate_handler =
    fun [@u] (e : 'a) (url : string) ->
      event_prevent_default e;
      open_default_app url
        (fun u -> Electron_utils.open_external u None)
  in

  (* registers itself on the window's webContents *)
  let _context_menu_handler =
    Electron_context_menu.setup_context_menu win
  in

  let window_open_handler =
    fun [@u] (details : 'a) ->
    let url = details_url details in
    let fullscreen = Browser_window.is_full_screen win in
    let features =
      Js.String.split ~sep:"," (details_features details)
      |> Array.to_list
      |> List.filter_map (fun part ->
           (* cljs string/split drops the trailing "" so `a=` binds
              v=nil and is skipped *)
           match String.split_on_char '=' part with
           | k :: v :: _ when v <> "" ->
               Some (k, int_of_string (String.trim v))
           | _ -> None)
    in
    if String.equal url "about:blank" then (
      let result = Js.Dict.empty () in
      Js.Dict.set result "action" (Js.Json.string "allow");
      Js.Dict.set result "overrideBrowserWindowOptions"
        (Js.Json.object_
           (Js.Dict.fromList
              [ ("frame", Js.Json.boolean true)
              ; ("titleBarStyle", Js.Json.string "default")
              ; ( "trafficLightPosition"
                , Js.Json.object_
                    (Js.Dict.fromList
                       [ ("x", Js.Json.number 16.0)
                       ; ("y", Js.Json.number 16.0) ]) )
              ; ("autoHideMenuBar", Js.Json.boolean (not Electron_state.mac))
              ; ("fullscreenable", Js.Json.boolean (not fullscreen))
              ; ( "webPreferences"
                , Js.Json.object_
                    (Js.Dict.fromList
                       [ ("plugins", Js.Json.boolean true)
                       ; ("nodeIntegration", Js.Json.boolean false)
                       ; ("webSecurity", Js.Json.boolean (not Electron_state.dev))
                       ; ( "preload"
                         , Js.Json.string
                             (Node.Path.join
                                [| __dirname; "js/preload.js" |]) )
                       ; ("nativeWindowOpen", Js.Json.boolean true) ]) )
              ]));
      (* cljs `(merge base features)` — feature pairs land at top level *)
      List.iter
        (fun (k, v) ->
           Js.Dict.set result k (Js.Json.number (Float.of_int v)))
        features;
      Js.Json.object_ result)
    else (
      open_external url;
      Js.Json.object_
        (Js.Dict.fromList [ ("action", Js.Json.string "deny") ]))
  in

  web_contents_on2 web_contents "will-navigate" will_navigate_handler;
  Web_contents.on web_contents "did-start-navigation"
    (fun [@u] _ ->
       Web_contents.send_v web_contents "persist-zoom-level"
         [| web_contents_get_zoom_level web_contents |]);
  Web_contents.on web_contents "page-title-updated"
    (fun [@u] _ -> Web_contents.send web_contents "restore-zoom-level");
  web_contents_set_window_open_handler web_contents window_open_handler;

  Browser_window.on win "enter-full-screen"
    (fun [@u] _ ->
       Web_contents.send_v web_contents "full-screen" [| "enter" |]);
  Browser_window.on win "leave-full-screen"
    (fun [@u] _ ->
       Web_contents.send_v web_contents "full-screen" [| "leave" |]);
  Browser_window.on win "maximize"
    (fun [@u] _ ->
       Web_contents.send_v web_contents "maximize" [| true |]);
  Browser_window.on win "unmaximize"
    (fun [@u] _ ->
       Web_contents.send_v web_contents "maximize" [| false |]);

  (* The cljs `(when win ... #())` discards the clear-effects fn built
     in the let and returns `#()`; callers get a no-op teardown. *)
  fun () -> ()
