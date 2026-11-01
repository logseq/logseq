let unavailable () =
  I18n.t1 "plugin/remote-error" "native:plugin-readme:unavailable"

let open_readme (_item : Js.Json.t) =
  Toast.error (unavailable ());
  Dialogs_state.open_ "plugin-readme"

let body (_ms : Model.t Signal.signal) : Lui_elements.t =
  Lui_elements.text ~key:"plugin-readme" ~value:(unavailable ()) []
