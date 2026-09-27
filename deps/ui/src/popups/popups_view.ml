(* autocomplete/slash/context-menu overlays — stub; implementation owned by the src/popups/ module area.
   render takes the app model signal; area-local state lives in
   popups_state.ml (create it here if needed). *)
open Lui_elements

let render (_ms : Model.t Signal.signal) : t = box ~key:"popups_view" []
