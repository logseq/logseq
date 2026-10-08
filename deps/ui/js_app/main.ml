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
  Logseq_emoji.register registry;
  Logseq_katex.register registry;
  Logseq_el.register registry;
  Logseq_editor.register registry;
  Logseq_codemirror.register registry;
  Logseq_virt.register registry;
  let renderer =
    Lui_web.create_with_extensions root (Icons.app_icons ()) registry
      (Lui_protocol.String_map.fold Lui_protocol.String_map.add
         Logseq_el.web_adapters
         (Lui_protocol.String_map.add Logseq_editor.identifier
            Logseq_editor.adapter Web_ext_adapters.adapters
          |> Lui_protocol.String_map.add Logseq_virt.identifier
               Logseq_virt.adapter))
  in
  let base_backend = Lui_web.backend renderer in
  (* per-stage timings for one dispatch/flush cycle land in __uiPerf *)
  let backend =
    { Lui_protocol.backend_profile = base_backend.backend_profile
    ; apply_batch =
        (fun batch ->
          let focused =
            if Editor_state.ready () then
              match Editor_state.editing () with
              | Some e when Editor_sink.is_focused e.Editor_state.uuid ->
                  Some e.Editor_state.uuid
              | _ -> None
            else None
          in
          let r, ms =
            Interaction_perf.time (fun () -> base_backend.apply_batch batch)
          in
          Interaction_perf.note_apply ms
            (List.length batch.Lui_protocol.ops);
          (* DOM reparenting can blur the active textarea. Preserve focus
             across this patch only when the editor owned it beforehand. *)
          let focus_lost = match Web_dom.active_element () with
            | None -> true
            | Some el -> el == Web_dom.document_body
          in
          (match focused with
           | Some uuid when focus_lost && Editor_state.editing_uuid () = Some uuid
               && Editor_sink.can_focus uuid && not (Editor_sink.is_focused uuid) ->
               Editor_sink.focus_input uuid
           | _ -> ());
          r)
    }
  in
  let app =
    Lui_app.create_with_extensions backend registry
      Model.initial Update.apply View.view
  in
  (* Event callbacks run during signal stabilization. Measure only after
     the host has applied the content patch, then paint the overlay in
     the same task so input never waits for a timer or a second frame. *)
  let flush () =
    let flushed = Platform.perf_time "editor-content" (fun () -> Lui_app.flush app) in
    (match Editor_state.editing () with
     | Some e ->
         ignore (Platform.perf_time "editor-measure" (fun () ->
           Editor_actions.refresh_overlay e.Editor_state.uuid));
         ignore (Platform.perf_time "editor-overlay" (fun () -> Lui_app.flush app));
         (match !Editor_state.active_frame with
          | Some frame ->
              (match (Signal.get_state frame).Edit_input.caret with
               | Some rect -> Logseq_editor.position_input e.Editor_state.uuid rect
               | None -> ())
          | None -> ())
     | None -> ());
    flushed
  in
  let finish_sample () = Interaction_perf.finish () in
  Runtime.read_model := (fun () -> Lui_app.model app);
  Runtime.app_send :=
    (fun action ->
      Interaction_perf.begin_op ("send:" ^ Action.tag action);
      let changed, sms =
        Interaction_perf.time (fun () -> Lui_app.send app action)
      in
      Interaction_perf.note_send sms;
      let _, fms =
        Interaction_perf.time (fun () ->
            Platform.perf_time "flush" (fun () ->
                ignore (flush ())))
      in
      Interaction_perf.note_flush fms
        (Lui_runtime.diagnostics (Lui_app.runtime app));
      let _, vms =
        Interaction_perf.time (fun () -> Logseq_virt.sync ())
      in
      Interaction_perf.note_virt vms;
      finish_sample ();
      changed);
  Runtime.app_flush :=
    (fun () ->
      Interaction_perf.begin_op "flush";
      let _, fms =
        Interaction_perf.time (fun () ->
            Platform.perf_time "flush" (fun () ->
                ignore (flush ())))
      in
      Interaction_perf.note_flush fms
        (Lui_runtime.diagnostics (Lui_app.runtime app));
      let _, vms =
        Interaction_perf.time (fun () -> Logseq_virt.sync ())
      in
      Interaction_perf.note_virt vms;
      let _, foms =
        Interaction_perf.time (fun () ->
            (* one focus pass per flush — a pending arm (or keys queued
               during the remount window) progresses as the DOM
               re-patches *)
            Editor_actions.focus_pending ())
      in
      Interaction_perf.note_focus foms;
      finish_sample ());
  Runtime.schedule_flush := (fun cb -> Web_dom.set_timeout cb 0);
  ignore
    (Lui_web.set_event_handler renderer (fun event ->
         Interaction_perf.begin_op "dom-event";
         let flushed =
           Platform.perf_time "event" (fun () ->
               let _, dms =
                 Interaction_perf.time (fun () ->
                     ignore (Lui_app.dispatch_event app event))
               in
               Interaction_perf.note_dispatch dms;
               let flushed, fms =
                 Interaction_perf.time (fun () -> flush ())
               in
               Interaction_perf.note_flush fms
                 (Lui_runtime.diagnostics (Lui_app.runtime app));
               let _, vms =
                 Interaction_perf.time (fun () -> Logseq_virt.sync ())
               in
               Interaction_perf.note_virt vms;
               flushed)
         in
         finish_sample ();
         flushed));
  ignore (Lui_app.start app);
  ignore (flush ());
  Lui_web.mount renderer (Lui_app.root_node app) root;
  Logseq_virt.sync ();
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
           with
           | Js.Exn.Error e ->
               W.Element.setTextContent root
                 (Option.value (Js.Exn.message e) ~default:"?" ^ "\n"
                 ^ Option.value (Js.Exn.stack e) ~default:"")
           | error ->
               W.Element.setTextContent root
                 (Printexc.to_string error ^ "\n"
                 ^ Printexc.get_backtrace ()));
          Js.Promise.resolve ()))
