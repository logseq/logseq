(* Web host capabilities for the shared editor command dispatcher —
   clipboard through the browser API, sidebar dispatch through the DOM
   event bus, the asset file picker, and the real plugin runtime. *)

let host () : Editor_cmds.host =
  { Editor_cmds.clipboard_write =
      (fun s -> ignore (Platform.clipboard_write_text s))
  ; open_right_sidebar =
      (fun uuid ->
        Web_dom.dispatch_custom "ls:open-right-sidebar"
          (Js.Json.object_
             (Js.Dict.fromList [ ("uuid", Js.Json.string uuid) ])))
  ; pick_files = Asset_dom.pick_files
  ; exec_plugin_ctx =
      Editor_cmds.Supported
        (fun ~uuid ~plugin ~key ->
          Plugin_host.exec_simple_command
            ~ctx:(Js.Dict.fromList [ ("uuid", Js.Json.string uuid) ])
            plugin key)
  ; report_error = (fun label detail -> Platform.console_error (label, detail))
  }
