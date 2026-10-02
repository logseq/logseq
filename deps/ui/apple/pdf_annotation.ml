(* Native stub — pdf annotation prefix renders nothing until the pdf
   extension is ported *)
let prefix_el (_b : Model.block) : Lui_elements.t =
  Logseq_dom.dom ~tag:"raw-text" []
