(* Native stub — plugin manager views are not ported yet *)
let body (_ms : Model.t Signal.signal) : Lui_elements.t =
  Lui_elements.spacer ~key:"plugin-readme" []
