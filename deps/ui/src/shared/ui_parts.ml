(* Shared parity-DOM fragments used by more than one area:
   the editor box shell (.editor-wrapper > .editor-inner.block-editor),
   the mock-text style string (property default-value textarea), and
   the collapse arrow svg. *)

open Lui_elements

(* Wrap adapters dereference the node kind: on dom/extension nodes
   Lui_ui.node_kind raises "unknown node" mid-render — surface a
   caller-pointing message instead. dom nodes must bind ~events/~attrs
   on the node itself. *)
let standard_kind context node =
  try Lui_ui.node_kind context node
  with Invalid_argument _ ->
    invalid_arg
      "Ui_parts adapters wrap standard-kind elements only — \
       dom/extension nodes must use their own ~events/~attrs props"

(* Pressable container: container kinds take no ~on_press, so wrap the
   element and register Press on the mounted node. Kinds that admit no
   PressEnabled make enable a silent no-op and the click dead — fail
   fast so an inert wrap site can never ship. *)
let pressable ~on_press (elem : t) : t =
 fun context parent ->
  let node = elem context parent in
  let kind = standard_kind context node in
  if not (Lui_protocol.property_supported kind Lui_protocol.PressEnabled)
  then
    invalid_arg
      (Printf.sprintf
         "Ui_parts.pressable: kind %s admits no Press — route the press \
          through a supported kind or a Logseq_el.el ~events node"
         (Lui_wire_schema.node_kind_name kind));
  enable context node Lui_protocol.PressEnabled;
  register_press context node on_press;
  node

(* reactive style_class — kinds take only a static ~style_class, so bind
   StyleClass on the mounted node (same wrap pattern as pressable) *)
let class_signal source f (elem : t) : t =
 fun context parent ->
  let node = elem context parent in
  ignore (standard_kind context node);
  Lui_ui.string_property_signal context node Lui_protocol.StyleClass
    (Signal.map f source);
  node

(* reactive string prop — kinds take only a static value, so bind the
   property on the mounted node (same wrap pattern as class_signal) *)
let prop_signal prop source f (elem : t) : t =
 fun context parent ->
  let node = elem context parent in
  ignore (standard_kind context node);
  Lui_ui.string_property_signal context node prop (Signal.map f source);
  node

(* reactive int prop — same wrap pattern as prop_signal *)
let int_prop_signal prop source f (elem : t) : t =
 fun context parent ->
  let node = elem context parent in
  ignore (standard_kind context node);
  Lui_ui.int_property_signal context node prop (Signal.map f source);
  node

(* reactive float prop — same wrap pattern as prop_signal; for kinds
   (e.g. toolbar) that lack an ~opacity_signal constructor arg *)
let float_prop_signal prop source f (elem : t) : t =
 fun context parent ->
  let node = elem context parent in
  ignore (standard_kind context node);
  Lui_ui.float_property_signal context node prop (Signal.map f source);
  node

(* cljs mock-textarea style — kept for the property default-value
   textarea in properties_menu (the block editor's caret mirror is
   gone: logseq-editor measures via Range.getClientRects). The element's
   look comes from the .mock-text rule in resources/css/lui-core.css;
   this string stays for imperative clones that set it inline. *)
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

(* The imperative side queries .mock-text/.editor-inner/.block-editor by
   class, so the semantic classes stay on style_class; flex/grow layout
   moves to the kind's typed props. *)
let mock_text ~key : t = box ~key ~style_class:"mock-text" []

let editor_inner ~key children : t =
  row ~key ~style_class:"editor-inner block-editor" ~grow:1. children

(* cljs editor wrapper — flex container around the logseq-editor
   surface (Edit_view's .block-editor column + hidden .ed-input) *)
let editor_wrapper ~key ~id children : t =
  row ~key ~style_class:"editor-wrapper" ~grow:1.
    ~accessibility_identifier:id children

(* cljs arrow svg inside .control-hide/.rotating-arrow — the custom
   FontAwesome caret path is registered as app: icon "rotating-arrow"
   in Icons.custom_icons *)
let rotating_arrow key : t =
  icon ~key ~name:(`app "rotating-arrow") ~point_size:13 []
