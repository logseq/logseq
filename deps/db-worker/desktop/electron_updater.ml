(* Port of src/electron/electron/updater.cljs — auto-updates via the
   electron-updater npm module; state mirrored to the renderer over the
   "updates-callback" / "auto-updater-downloaded" channels. *)

open Electron_bindings

module Auto_updater = struct
  type t

  external t : t = "autoUpdater" [@@mel.module "electron-updater"]
  external channel_set : t -> string -> unit = "channel" [@@mel.set]

  external allow_downgrade_set : t -> bool -> unit = "allowDowngrade"
    [@@mel.set]

  external auto_install_on_app_quit_set : t -> bool -> unit
    = "autoInstallOnAppQuit"
  [@@mel.set]

  external auto_download_set : t -> bool -> unit = "autoDownload"
    [@@mel.set]

  external check_for_updates : t -> Js.Json.t Js.Promise.t
    = "checkForUpdates" [@@mel.send]

  external quit_and_install : t -> bool -> bool -> unit = "quitAndInstall"
    [@@mel.send]

  external on : t -> string -> (Js.Json.t -> unit [@u]) -> unit = "on"
    [@@mel.send]

  external off : t -> string -> (Js.Json.t -> unit [@u]) -> unit = "off"
    [@@mel.send]
end

external promise_finally :
  (unit -> unit [@u]) -> ('a Js.Promise.t[@mel.this]) -> 'a Js.Promise.t
  = "finally"
[@@mel.send]

external err_message : 'a -> string Js.Undefined.t = "message"
  [@@mel.get]

let update_pending = ref false
let downloaded_update : Js.Json.t option ref = ref None

(* (partial logger/debug "[updater]") *)
let debug args =
  Electron_logger.debug_args
    (Array.append [| Js.Json.string "[updater]" |] args)

(* frontend.version/version *)
let electron_version = "2.0.1"

let updater_channel () =
  let platform = Node.Process.process##platform in
  let arch = Node.Process.process##arch in
  match platform with
  | "win32" | "darwin" ->
      (match arch with
       | "x64" | "arm64" -> Some ("latest-" ^ arch)
       | _ -> None)
  | _ -> None

let js_obj (kvs : (string * Js.Json.t) list) : Js.Json.t =
  let d = Js.Dict.empty () in
  List.iter (fun (k, v) -> Js.Dict.set d k v) kvs;
  Js.Json.object_ d

(* cljs normalize-payload/bean->clj + bean/->js round-trips the JS info
   object through cljs and back (camelCase <-> kebab-case); the JS value
   passing straight through is equivalent. *)
let normalize_payload (payload : Js.Json.t) : Js.Json.t option =
  match Js.Json.decodeNull payload with
  | Some _ -> None
  | None -> Some payload

let emit_update win typ (payload : Js.Json.t option) =
  let msg =
    js_obj
      [ ("type", Js.Json.string typ)
      ; ("payload", Option.value payload ~default:Js.Json.null) ]
  in
  Web_contents.send_v (Browser_window.web_contents win)
    "updates-callback" [| msg |]

let emit_completed win = emit_update win "completed" None

let normalize_error e : Js.Json.t =
  let msg =
    match Js.Undefined.toOption (err_message e) with
    | Some m -> m
    | None -> Js.String.make e
  in
  js_obj [ ("message", Js.Json.string msg) ]

let emit_update_downloaded (payload : Js.Json.t) =
  match !Electron_state.main_window with
  | Some win ->
      Web_contents.send_v (Browser_window.web_contents win)
        "auto-updater-downloaded" [| payload |]
  | None -> ()

let configure_auto_updater () =
  let channel = updater_channel () in
  (match channel with
   | Some ch ->
       Auto_updater.channel_set Auto_updater.t ch;
       (* Keep the original downgrade policy even though setting channel
          flips it on. *)
       Auto_updater.allow_downgrade_set Auto_updater.t false
   | None -> ());
  debug
    [| Js.Json.string "configure-auto-updater"
     ; js_obj
         [ ("platform", Js.Json.string Node.Process.process##platform)
         ; ("arch", Js.Json.string Node.Process.process##arch)
         ; ( "channel"
           , match channel with
             | Some c -> Js.Json.string c
             | None -> Js.Json.null ) ] |];
  Auto_updater.auto_install_on_app_quit_set Auto_updater.t false;
  Auto_updater.auto_download_set Auto_updater.t false

let register_auto_updater_listeners win =
  let checking_handler = fun [@u] (_ : Js.Json.t) ->
    emit_update win "checking-for-update" None
  in
  let available_handler = fun [@u] (info : Js.Json.t) ->
    emit_update win "update-available" (normalize_payload info)
  in
  let not_available_handler = fun [@u] (info : Js.Json.t) ->
    emit_update win "update-not-available" (normalize_payload info);
    emit_completed win
  in
  let progress_handler = fun [@u] (progress : Js.Json.t) ->
    emit_update win "download-progress" (normalize_payload progress)
  in
  let downloaded_handler = fun [@u] (info : Js.Json.t) ->
    let payload = normalize_payload info in
    downloaded_update := payload;
    Electron_logger.info_args
      [| Js.Json.string "[update-downloaded]"
       ; Option.value payload ~default:Js.Json.null |];
    emit_update win "update-downloaded" payload;
    emit_update_downloaded (Option.value payload ~default:Js.Json.null);
    emit_completed win
  in
  let error_handler = fun [@u] (error : Js.Json.t) ->
    Electron_logger.warn_args
      [| "[updater/error]"; Js.String.make error |];
    emit_update win "error" (Some (normalize_error error));
    emit_completed win
  in
  let auto_updater = Auto_updater.t in
  Auto_updater.on auto_updater "checking-for-update" checking_handler;
  Auto_updater.on auto_updater "update-available" available_handler;
  Auto_updater.on auto_updater "update-not-available"
    not_available_handler;
  Auto_updater.on auto_updater "download-progress" progress_handler;
  Auto_updater.on auto_updater "update-downloaded" downloaded_handler;
  Auto_updater.on auto_updater "error" error_handler;
  fun () ->
    Auto_updater.off auto_updater "checking-for-update" checking_handler;
    Auto_updater.off auto_updater "update-available" available_handler;
    Auto_updater.off auto_updater "update-not-available"
      not_available_handler;
    Auto_updater.off auto_updater "download-progress" progress_handler;
    Auto_updater.off auto_updater "update-downloaded" downloaded_handler;
    Auto_updater.off auto_updater "error" error_handler

let check_for_updates win (auto_download : bool) : unit Js.Promise.t =
  debug
    [| Js.Json.string "check-for-updates"
     ; js_obj [ ("auto-download?", Js.Json.boolean auto_download) ] |];
  Auto_updater.auto_download_set Auto_updater.t auto_download;
  Auto_updater.check_for_updates Auto_updater.t
  |> Js.Promise.then_ (fun _ ->
         (* Manual checks without auto download need an explicit
            terminal event. *)
         if not auto_download then emit_completed win;
         Js.Promise.resolve ())
  |> Js.Promise.catch (fun error ->
         Electron_logger.warn_args
           [| "[updater/check]"; Js.String.make error |];
         emit_update win "error" (Some (normalize_error error));
         emit_completed win;
         Js.Promise.resolve ())

(* cljs's `false`-literal compare: anything but explicit false enables
   auto-update. *)
let auto_update_enabled () =
  match Electron_configs.get_item "auto-update" with
  | Datascript.Bool false -> false
  | _ -> true

let init_auto_updater win =
  if Electron_utils.prod && auto_update_enabled () then begin
    debug [| Js.Json.string "init-auto-updater" |];
    Auto_updater.auto_download_set Auto_updater.t true;
    ignore
      (Auto_updater.check_for_updates Auto_updater.t
       |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ())
       |> Js.Promise.catch (fun error ->
              Electron_logger.warn_args
                [| "[updater/auto-check]"; Js.String.make error |];
              emit_update win "error" (Some (normalize_error error));
              emit_completed win;
              Js.Promise.resolve ())
        : unit Js.Promise.t)
  end

let init_updater ~win () : unit -> unit =
  configure_auto_updater ();
  let dispose_listeners = register_auto_updater_listeners win in
  let check_channel = "check-for-updates"
  and install_channel = "install-updates"
  and get_downloaded_channel = "get-downloaded-update" in
  init_auto_updater win;
  Ipc_main.handle check_channel (fun [@u] _e auto_download ->
      if not !update_pending then begin
        update_pending := true;
        let auto_download =
          match Js.Json.decodeBoolean auto_download with
          | Some b -> b
          | None -> false
        in
        check_for_updates win auto_download
        |> promise_finally (fun [@u] () -> update_pending := false)
      end
      else Js.Promise.resolve ());
  Ipc_main.handle install_channel (fun [@u] _e _quit_app ->
      Auto_updater.quit_and_install Auto_updater.t false true;
      Js.Promise.resolve ());
  Ipc_main.handle get_downloaded_channel (fun [@u] _e _arg ->
      Js.Promise.resolve
        (Option.value !downloaded_update ~default:Js.Json.null));
  fun () ->
    dispose_listeners ();
    Ipc_main.remove_handler install_channel;
    Ipc_main.remove_handler check_channel;
    Ipc_main.remove_handler get_downloaded_channel;
    update_pending := false
