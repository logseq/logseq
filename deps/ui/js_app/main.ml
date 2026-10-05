(* Logseq web UI entry — LUI web backend + db-worker boot. *)

module W = Webapi.Dom

open Promise_ext

(* forward uncaught errors/rejections to console.error so the e2e console
   dumps see them (Playwright's console event misses pageerror) *)
external add_window_listener : string -> (Js.Json.t -> unit) -> unit =
  "addEventListener"
  [@@mel.scope "window"]

external rejection_reason : Js.Json.t -> Js.Json.t = "reason" [@@mel.get]

external error_error : Js.Json.t -> Js.Json.t = "error" [@@mel.get]

external set_interval : (unit -> unit) -> int -> unit = "setInterval"
  [@@mel.scope "window"]

let describe_json (v : Js.Json.t) =
  match Js.Json.decodeString v with
  | Some s -> s
  | None -> (
      match Js.Json.decodeObject v with
      | Some o -> (
          match Js.Dict.get o "stack", Js.Dict.get o "message" with
          | Some m, _ | None, Some m -> (
              match Js.Json.decodeString m with
              | Some s -> s
              | None -> Js.Json.stringify v)
          | None, None -> Js.Json.stringify v)
      | None -> Js.Json.stringify v)
;;

let install_error_reporting () =
  add_window_listener "error" (fun ev ->
      Platform.console_error ("UNCAUGHT " ^ describe_json (error_error ev)));
  add_window_listener "unhandledrejection" (fun ev ->
      Platform.console_error
        ("UNHANDLED-REJECTION " ^ describe_json (rejection_reason ev)))
;;

let main root =
  install_error_reporting ();
  let registry = Lui_extension.registry () in
  Logseq_dom.register registry;
  let renderer =
    Lui_web.create_with_extensions root (Icons.app_icons ()) registry
      Dom_adapter.adapters
  in
  let app =
    Lui_app.create_with_extensions (Lui_web.backend renderer) registry
      Model.initial Update.apply View.view
  in
  Runtime.read_model := (fun () -> Lui_app.model app);
  Runtime.app_send :=
    (fun action ->
      let changed = Lui_app.send app action in
      Platform.perf_time "flush" (fun () ->
          ignore (Lui_app.flush app);
          Virtual_scroll.sync ());
      changed);
  Runtime.app_flush :=
    (fun () ->
      Platform.perf_time "flush" (fun () ->
          ignore (Lui_app.flush app);
          Virtual_scroll.sync ();
          (* one focus pass per flush — a pending arm (or keys queued
             during the remount window) progresses as the DOM
             re-patches *)
          Editor_actions.focus_pending ()));
  ignore
    (Lui_web.set_event_handler renderer (fun event ->
         Platform.perf_time "event" (fun () ->
             ignore (Lui_app.dispatch_event app event);
             let flushed = Lui_app.flush app in
             Virtual_scroll.sync ();
             flushed)));
  ignore (Lui_app.start app);
  ignore (Lui_app.flush app);
  Lui_web.mount renderer (Lui_app.root_node app) root;
  Virtual_scroll.sync ();
  Sdk_api.install ();
  Properties_view.install ();
  Editor_commands.install ();
  (* views mount declaratively at their host sites — no
     Views_mount observer *)
  Router.init ();
  Rtc_flows.init ();
  ignore (Boot.run ())

(* gate first render on the active locale: non-English dicts arrive as
   lazy chunks (en is embedded, resolves immediately) *)
let () =
  Printexc.record_backtrace true;
  match W.Document.getElementById "root" W.document with
  | None -> ()
  | Some root ->
      ignore
        ((let* () = I18n.init () in
          (try main root
           with error ->
             W.Element.setTextContent root (Printexc.to_string error));
          Js.Promise.resolve ()))
