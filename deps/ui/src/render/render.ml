(* block title markup (page-refs tags code katex) — stub; implementation owned by the src/render/ module area.
   render takes the app model signal; area-local state lives in
   render_state.ml (create it here if needed). *)
open Lui_elements

let render (_ms : Model.t Signal.signal) : t = box ~key:"render" []
