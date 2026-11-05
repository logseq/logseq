(* Native hosts do not ship a TeX renderer. Keep the source visible using
   retained text, without web-only pending slots or readiness requests. *)
let identifier = "logseq-katex"

let el ?key ~block ~display:_ ~tex () : Lui_elements.t =
  if block then
    Lui_elements.column ?key ~style_class:"latex"
      [ Lui_elements.text ~value:tex [] ]
  else Lui_elements.text ?key ~style_class:"latex-inline" ~value:tex []
