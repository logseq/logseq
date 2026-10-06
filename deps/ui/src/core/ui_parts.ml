(* Shared parity-DOM fragments used by more than one area:
   the editor box shell (.editor-wrapper > .editor-inner.block-editor),
   the mock-text style string (property default-value textarea), and
   the collapse arrow svg. *)

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

(* cljs mock-textarea style — kept for the property default-value
   textarea in properties_menu (the block editor's caret mirror is
   gone: logseq-editor measures via Range.getClientRects) *)
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

(* the comment box reuses the cljs .editor-inner shell classes *)
let editor_inner ~key children : t =
  dom ~key ~style_class:"editor-inner flex flex-1 block-editor" children

(* cljs editor wrapper — flex container around the logseq-editor
   surface (Edit_view's .block-editor column + hidden .ed-input) *)
let editor_wrapper ~key ~id children : t =
  dom ~key ~style_class:"editor-wrapper flex flex-1 w-full" ~id children

(* cljs arrow svg inside .control-hide/.rotating-arrow — the custom
   FontAwesome caret path is registered as app: icon "rotating-arrow"
   in Icons.custom_icons *)
let rotating_arrow key : t =
  icon ~key ~name:(`app "rotating-arrow") ~point_size:16 []
