(* right sidebar contents — stub; implementation owned by the src/sidebar/ module area.
   render takes the app model signal; area-local state lives in
   sidebar_state.ml (create it here if needed). *)
open Lui_elements

let render (_ms : Model.t Signal.signal) : t = box ~key:"right_sidebar_view" []
