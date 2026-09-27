(* modal dialogs — stub; implementation owned by the src/dialogs/ module area.
   render takes the app model signal; area-local state lives in
   dialogs_state.ml (create it here if needed). *)
open Lui_elements

let render (_ms : Model.t Signal.signal) : t = box ~key:"dialogs_view" []
