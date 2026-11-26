(* Native math is typeset offline through embedded QuickJS + KaTeX and
   painted by the host image pipeline. Raw source remains the fail-fast
   fallback when a formula cannot be laid out. *)
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

let fallback ?key ~block ~tex context parent =
  let source =
    if block then
      let lines = String.split_on_char '\n' tex in
      Lui_elements.column ?key ~style_class:"latex"
        (List.map
           (fun line ->
             let value = if line = "" then " " else line in
             Lui_elements.text ~white_space:`pre_wrap ~value [])
           lines)
    else Lui_elements.text ?key ~style_class:"latex-inline" ~value:tex []
  in source context parent

let el ?key ~block ~display ~tex () : Lui_elements.t =
 fun context parent ->
  match Native_katex.layout ~tex ~display with
  | Ok layout when layout.Native_katex.items <> [] ->
      let width, height, _depth = Native_katex.logical_size layout in
      let dark =
        match Platform.theme_mode () with
        | "system" -> Host.prefers_dark ()
        | "dark" -> true
        | _ -> false
      in
      let image =
        Lui_elements.image ?key
          ~url:(Native_katex.resource_url ~tex ~display ~dark)
          ~width ~height ~alt:tex ~label:tex []
      in
      let source =
        if block then
          Lui_elements.row ~grow:1. ~main:`center ~cross:`center
            ~margin_vertical:8 [ image ]
        else image
      in
      source context parent
  | Ok _ | Error _ -> fallback ?key ~block ~tex context parent
