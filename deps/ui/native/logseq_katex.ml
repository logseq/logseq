(* Native hosts present math source text without a browser renderer. *)
let identifier = "logseq-katex"

let schema =
  Lui_extension.component identifier
    (Logseq_el.web_profile :: Logseq_el.native_profiles) false []
    [ Lui_extension.property "tex" Lui_extension.StringScalar true None
    ; Lui_extension.property "display" Lui_extension.BoolScalar false None
    ; Lui_extension.property "inline" Lui_extension.BoolScalar false None
    ; Lui_extension.property "style-class" Lui_extension.StringScalar false None
    ; Lui_extension.property "accessibility-identifier"
        Lui_extension.StringScalar false None
    ] []

let register registry = Lui_extension.register_component registry schema

let el ?key ~block ~display:_ ~tex () : Lui_elements.t =
 fun context parent ->
  let source =
    if block then Lui_elements.column ?key ~style_class:"latex"
      [ Lui_elements.text ~value:tex [] ]
    else Lui_elements.text ?key ~style_class:"latex-inline" ~value:tex []
  in source context parent
