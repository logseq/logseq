(* Native stub — plugin manager views are not ported yet *)
let body (_ms : Model.t Signal.signal) : Lui_elements.t =
  Logseq_dom.dom ~tag:"raw-text" []

let settings_body (_ms : Model.t Signal.signal) : Lui_elements.t =
  Logseq_dom.dom ~tag:"raw-text" []
