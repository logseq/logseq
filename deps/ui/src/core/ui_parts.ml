(* Shared parity-DOM fragments used by more than one area:
   the cljs editor box (.editor-wrapper > .editor-inner.block-editor >
   textarea + .mock-text caret mirror) and the collapse arrow svg. *)

open Lui_elements

let dom = Logseq_dom.dom

(* cljs mock-textarea style: hidden caret mirror for popup placement,
   consumed on the imperative side by dom_ext.mock_text_el/build_mock_text *)
let mock_text_style =
  "width:100%;height:100%;position:absolute;visibility:hidden;top:0;left:0"

let mock_text ~key : t =
  dom ~key ~style_class:"mock-text"
    ~attrs:[ ("style", mock_text_style) ]
    []

let editor_inner ~key children : t =
  dom ~key ~style_class:"editor-inner flex flex-1 block-editor" children

let editor_wrapper ~key ~id children : t =
  dom ~key ~style_class:"editor-wrapper flex flex-1 w-full" ~id children

(* cljs arrow svg inside .control-hide/.rotating-arrow *)
let rotating_arrow key : t =
  dom ~key ~tag:"svg"
    ~style_class:"h-4 w-4"
    ~attrs:
      [ ("aria-hidden", "true"); ("version", "1.1")
      ; ("viewBox", "0 0 192 512"); ("fill", "currentColor")
      ; ("display", "inline-block"); ("style", "margin-left: 2px") ]
    [ dom ~key:"p" ~tag:"path"
        ~attrs:
          [ ( "d"
            , "M0 384.662V127.338c0-17.818 21.543-26.741 \
               34.142-14.142l128.662 128.662c7.81 7.81 7.81 20.474 0 \
               28.284L34.142 398.804C21.543 411.404 0 402.48 0 384.662z" )
          ; ("fill-rule", "evenodd") ]
        []
    ]
