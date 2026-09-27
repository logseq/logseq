(* command palette overlay — stub; implementation owned by the src/cmdk/ module area.
   render takes the app model signal; area-local state lives in
   cmdk_state.ml (create it here if needed). *)
open Lui_elements

let render (_ms : Model.t Signal.signal) : t = box ~key:"cmdk_view" []
