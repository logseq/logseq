(* Logseq web UI entry — LUI web backend + db-worker boot. *)

module W = Webapi.Dom

let main root =
  let registry = Lui_extension.registry () in
  Logseq_dom.register registry;
  let renderer =
    Lui_web.create_with_extensions root Lui_protocol.String_map.empty
      registry Dom_adapter.adapters
  in
  let app =
    Lui_app.create_with_extensions (Lui_web.backend renderer) registry
      Model.initial Update.update View.view
  in
  Runtime.app_send :=
    (fun action ->
      let changed = Lui_app.send app action in
      ignore (Lui_app.flush app);
      changed);
  Runtime.app_flush := (fun () -> ignore (Lui_app.flush app));
  ignore
    (Lui_web.set_event_handler renderer (fun event ->
         ignore (Lui_app.dispatch_event app event);
         Lui_app.flush app));
  ignore (Lui_app.start app);
  ignore (Lui_app.flush app);
  Lui_web.mount renderer (Lui_app.root_node app) root;
  Sdk_api.install ();
  Editor_cmds.install ();
  Properties_view.install ();
  Views_mount.install ();
  Router.init ();
  ignore (Boot.run ())

let () =
  Printexc.record_backtrace true;
  match W.Document.getElementById "root" W.document with
  | None -> ()
  | Some root -> (
      try main root
      with error ->
        W.Element.setTextContent root (Printexc.to_string error))
