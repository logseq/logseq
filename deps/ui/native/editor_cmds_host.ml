(* Native host capabilities for the shared editor command dispatcher —
   clipboard and dispatch through the host bridge, the asset picker,
   and no plugin runtime: plugin context commands report unavailable. *)

let host () : Editor_cmds.host =
  { Editor_cmds.clipboard_write = Platform.copy_to_clipboard
  ; open_right_sidebar =
      (fun uuid ->
        Platform.dispatch "ls:open-right-sidebar"
          (Js.Json.object_
             (Js.Dict.fromList [ ("uuid", Js.Json.string uuid) ])))
  ; pick_files = Asset_dom.pick_files
  ; exec_plugin_ctx = Editor_cmds.Unavailable
  ; report_error =
      (fun label detail ->
        Printf.eprintf "[editor-cmds] %s: %s\n%!" label detail)
  }
