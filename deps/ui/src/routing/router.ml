(* hash routing — stub; implementation owned by the src/routing/ module area.
   render takes the app model signal; area-local state lives in
   routing_state.ml (create it here if needed). *)
open Lui_elements

let render (_ms : Model.t Signal.signal) : t = box ~key:"router" []
