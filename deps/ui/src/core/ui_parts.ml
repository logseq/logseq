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

(* reactive style_class — kinds take only a static ~style_class, so bind
   StyleClass on the mounted node (same wrap pattern as pressable) *)
let class_signal source f (elem : t) : t =
 fun context parent ->
  let node = elem context parent in
  Lui_ui.string_property_signal context node Lui_protocol.StyleClass
    (Signal.map f source);
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

(* TODO(component): editor surface — mock_text/editor_inner/editor_wrapper
   collapse into a `logseq-editor` extension node per the migration spec;
   imperative code queries .mock-text/.editor-inner/.block-editor, so the
   dom fragments stay until that extension lands. *)
let mock_text ~key : t =
  dom ~key ~style_class:"mock-text"
    ~attrs:[ ("style", mock_text_style) ]
    []

(* TODO(component): editor surface — see mock_text *)
let editor_inner ~key children : t =
  dom ~key ~style_class:"editor-inner flex flex-1 block-editor" children

(* TODO(component): editor surface — see mock_text *)
let editor_wrapper ~key ~id children : t =
  dom ~key ~style_class:"editor-wrapper flex flex-1 w-full" ~id children

(* cljs arrow svg inside .control-hide/.rotating-arrow — the custom
   FontAwesome caret path is registered as app: icon "rotating-arrow"
   in Icons.custom_icons *)
let rotating_arrow key : t =
  icon ~key ~name:(`app "rotating-arrow") ~point_size:16 []
