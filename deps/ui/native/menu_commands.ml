let dispatch = function
  | "toggle-left-sidebar" -> Runtime.send Action.Toggle_left_sidebar
  | "reload" -> Router.reload ()
  | "documentation" -> Host.open_url "https://docs.logseq.com"
  | command -> invalid_arg ("Unknown application menu command: " ^ command)

let refresh_labels () =
  !Host.host_op "application-menu-labels"
    (Js.Json.stringify
       (Js.Json.JObject
          [ "toggle-left-sidebar", Js.Json.JString (I18n.t "command.ui/toggle-left-sidebar")
          ; "documentation", Js.Json.JString (I18n.t "help/docs") ]))

let install () =
  refresh_labels ();
  Ui_services.dom_on_document_event "application-menu-command" (fun event ->
      match event.detail "command" with
      | Some command -> dispatch command
      | None -> invalid_arg "Application menu event requires a command")
