(* Shared parity-DOM fragments used by more than one area:
   the cljs editor box (.editor-wrapper > .editor-inner.block-editor >
   textarea + .mock-text caret mirror) and the collapse arrow svg. *)

open Lui_elements

let dom = Logseq_dom.dom

(* Pressable container: container kinds take no ~on_press, so wrap the
   element and register Press on the mounted node. *)
let pressable ~on_press (elem : t) : t =
 fun context parent ->
  let node = elem context parent in
  enable context node Lui_protocol.PressEnabled;
  register_press context node on_press;
  node

(* cljs mock-textarea style: hidden caret mirror for popup placement,
   consumed on the imperative side by dom_ext.mock_text_el/build_mock_text *)
let mock_text_style =
  "width:100%;height:100%;position:absolute;visibility:hidden;top:0;left:0"

(* cljs shui/button :variant :ghost :size :sm — the shared class
   bundle; per-site size/padding overrides go in [extra] *)
let ghost_btn_cls ?(extra = "") () =
  "ui__button inline-flex cursor-pointer items-center justify-center \
   whitespace-nowrap rounded-md text-sm gap-1 font-medium \
   ring-offset-background transition-colors focus-visible:outline-none \
   focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 \
   disabled:pointer-events-none disabled:opacity-50 select-none \
   hover:bg-secondary/70 hover:text-secondary-foreground \
   active:opacity-80 as-ghost"
  ^ if extra = "" then "" else " " ^ extra

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
