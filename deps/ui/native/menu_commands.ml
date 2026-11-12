let dispatch = function
  | "toggle-left-sidebar" -> Runtime.send Action.Toggle_left_sidebar
  | "reload" -> Router.reload ()
  | "documentation" -> Host.open_url "https://docs.logseq.com"
  | command -> invalid_arg ("Unknown application menu command: " ^ command)

let updater_enabled = ref false

let updater_labels () =
  Js.Json.JObject
    [ "menu-check", Js.Json.JString (I18n.t "updater.menu/check-label")
    ; "menu-install", Js.Json.JString (I18n.t "updater.menu/install-label")
    ; "menu-checking", Js.Json.JString (I18n.t "updater.menu/checking-label")
    ; "menu-downloading", Js.Json.JString (I18n.t "updater.menu/downloading-label")
    ; "menu-prompt", Js.Json.JString (I18n.t "updater.menu/available-label")
    ; "menu-installing", Js.Json.JString (I18n.t "updater.menu/installing-label")
    ; "menu-cancelling", Js.Json.JString (I18n.t "updater.menu/cancelling-label")
    ; "menu-cancel", Js.Json.JString (I18n.t "updater.menu/cancel-label")
    ; "menu-unavailable", Js.Json.JString (I18n.t "updater.menu/unavailable-label")
    ; "current-title", Js.Json.JString (I18n.t "updater.dialog/current-title")
    ; "current-description", Js.Json.JString (I18n.t "updater.dialog/current-description")
    ; "done", Js.Json.JString (I18n.t "updater.dialog/done-label")
    ; "available-title", Js.Json.JString (I18n.t "updater.dialog/available-title")
    ; "version-available", Js.Json.JString (I18n.t "updater.dialog/version-available-description")
    ; "version-notes", Js.Json.JString (I18n.t "updater.dialog/version-notes-description")
    ; "later", Js.Json.JString (I18n.t "updater.dialog/later-label")
    ; "download", Js.Json.JString (I18n.t "updater.dialog/download-label")
    ; "open-download", Js.Json.JString (I18n.t "updater.dialog/open-download-label")
    ; "ready-title", Js.Json.JString (I18n.t "updater.dialog/ready-title")
    ; "ready-description", Js.Json.JString (I18n.t "updater.dialog/ready-description")
    ; "install", Js.Json.JString (I18n.t "updater.dialog/install-label")
    ; "error-title", Js.Json.JString (I18n.t "updater.dialog/error-title") ]

let configure ~updates = updater_enabled := updates

let refresh_labels () =
  let labels =
    [ "toggle-left-sidebar", Js.Json.JString (I18n.t "command.ui/toggle-left-sidebar")
    ; "documentation", Js.Json.JString (I18n.t "help/docs")
    ; "file", Js.Json.JString (I18n.t "desktop.menu/file-label")
    ; "edit", Js.Json.JString (I18n.t "desktop.menu/edit-label")
    ; "view", Js.Json.JString (I18n.t "desktop.menu/view-label")
    ; "window", Js.Json.JString (I18n.t "desktop.menu/window-label")
    ; "help", Js.Json.JString (I18n.t "desktop.menu/help-label")
    ; "reload", Js.Json.JString (I18n.t "desktop.menu/reload-label") ]
  in
  let labels = if !updater_enabled then labels @ ["updates", updater_labels ()] else labels in
  !Host.host_op "application-menu-labels"
    (Js.Json.stringify (Js.Json.JObject labels))

let install () =
  refresh_labels ();
  Ui_services.dom_on_document_event "application-menu-command" (fun event ->
      match event.detail "command" with
      | Some command -> dispatch command
      | None -> invalid_arg "Application menu event requires a command")
