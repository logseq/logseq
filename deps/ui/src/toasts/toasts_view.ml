(* ui__toast stack — stub; implementation owned by the src/toasts/ module area.
   render takes the app model signal; area-local state lives in
   toasts_state.ml (create it here if needed). *)
open Lui_elements

let render (_ms : Model.t Signal.signal) : t = box ~key:"toasts_view" []
