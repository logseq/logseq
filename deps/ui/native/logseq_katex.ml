(* SwiftUI hosts render this platform widget with bundled KaTeX. Other
   native hosts retain their existing source-text presentation. *)
open Lui_protocol

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

let el ?key ~block ~display ~tex () : Lui_elements.t =
 fun context parent ->
  if Lui_ui.host context = SwiftUIHost then begin
    let node = Lui_ui.extension context identifier in
    Option.iter (Lui_ui.key context node) key;
    Lui_ui.extension_property context node "tex" (StringValue tex);
    Lui_ui.extension_property context node "display" (BoolValue display);
    Lui_ui.extension_property context node "inline" (BoolValue (not block));
    Lui_ui.extension_property context node "style-class"
      (StringValue (if block then "latex" else "latex-inline"));
    Option.iter (fun p -> Lui_ui.append context p node) parent;
    node
  end else
    let source =
      if block then Lui_elements.column ?key ~style_class:"latex"
        [ Lui_elements.text ~value:tex [] ]
      else Lui_elements.text ?key ~style_class:"latex-inline" ~value:tex []
    in source context parent
