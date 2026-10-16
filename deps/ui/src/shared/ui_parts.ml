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

(* cljs shui/button :variant :ghost :size :sm — semantic classes only;
   the former utility bundle's layout/interaction tokens ride the typed
   prop bind in [ghost_wrap] *)
let ghost_btn_cls ?(extra = "") () =
  "ui__button as-ghost" ^ if extra = "" then "" else " " ^ extra

(* The shui ghost-button interaction bundle lives in Ui_components
   (with_props side); ui_parts cannot reference ui_components *)

(* Cover a layer host with the frame: mounted popups measure and place
   against their nearest out-of-flow ancestor, so a content-sized host
   collapses them into a zero-width strip at the window center — and an
   in-flow host (the web stylesheet gives the layer position:fixed;
   inset:0) drags every child's painted origin along with it. The
   fixed+inset props pin the cover to the viewport; the viewport props
   give it the layer's full size. *)
let viewport_cover (elem : t) : t =
 fun context parent ->
  let node = elem context parent in
  ignore (standard_kind context node);
  Lui_ui.position context node "fixed";
  Lui_ui.inset context node 0.;
  Lui_ui.width_viewport context node 1.;
  Lui_ui.height_viewport context node 1.;
  node

(* pointer-events:none for a cover layer: on web the permanent overlay
   layer is hit-transparent so empty regions let clicks fall through to
   the app below; native hit-testing honours pointer-enabled=false the
   same way while children that register handlers still get hit. *)
let hit_transparent (elem : t) : t =
 fun context parent ->
  let node = elem context parent in
  ignore (standard_kind context node);
  Lui_ui.bool_property context node Lui_protocol.PointerEnabled false;
  node


(* The imperative side queries .mock-text/.editor-inner/.block-editor by
   class, so the semantic classes stay on style_class; flex/grow layout
   moves to the kind's typed props. *)
let mock_text ~key : t = box ~key ~style_class:"mock-text" []

let editor_inner ~key children : t =
  row ~key ~style_class:"editor-inner block-editor" ~grow:1.
    ~min_width:0 children

(* cljs editor wrapper — flex container around the logseq-editor
   surface (Edit_view's .block-editor column + hidden .ed-input) *)
let editor_wrapper ~key ~id children : t =
  row ~key ~style_class:"editor-wrapper" ~grow:1.
    ~accessibility_identifier:id children

(* cljs arrow svg inside .control-hide/.rotating-arrow — the custom
   FontAwesome caret path is registered as app: icon "rotating-arrow"
   in Icons.custom_icons *)
let rotating_arrow key : t =
  icon ~key ~name:(`app "rotating-arrow") ~point_size:13
    ~transition:"transform 100ms ease-in" []

(* Typed (property, wire_value) binds for Ui_components.with_props and
   with_signal_props. Each helper pins the property to its encoder, so
   a call site can no longer pair a prop name with a mismatched wire
   type; closed vocabularies (position, overflow, cursor, ...) are
   polymorphic variants so an invalid value fails at compile time
   instead of inside the host's property_value_supported check. *)
module Prop : sig
  type t
  type s

  val set : Lui_ui.ui_context -> int -> t -> unit
  val set_signal : Lui_ui.ui_context -> int -> s -> unit

  val font_size : string -> t
  val s_font_size : string Signal.signal -> s
  val line_height : string -> t
  val font_weight : int -> t
  val font_style : string -> t
  val font_family : string -> t
  val letter_spacing : float -> t
  val text_decoration : string -> t
  val transition : string -> t
  val shadow : string -> t
  val s_shadow : string Signal.signal -> s
  val hover_shadow : string -> t
  val s_hover_shadow : string Signal.signal -> s
  val pressed_shadow : string -> t
  val focus_shadow : string -> t
  val selected_shadow : string -> t
  val selected_hover_shadow : string -> t
  val hover_background : string -> t
  val s_hover_background : string Signal.signal -> s
  val hover_foreground : string -> t
  val hover_border : string -> t
  val pressed_background : string -> t
  val selected_background : string -> t
  val background : string -> t
  val s_background : string Signal.signal -> s
  val foreground : string -> t
  val s_foreground : string Signal.signal -> s
  val border_color : string -> t
  val border_width : int -> t
  val corner_radius : int -> t
  val opacity : float -> t
  val hover_opacity : float -> t
  val pressed_opacity : float -> t
  val disabled_opacity : float -> t
  val z_index : int -> t
  val pointer_enabled : bool -> t
  val grow : float -> t
  val padding : int -> t
  val padding_horizontal : int -> t
  val padding_vertical : int -> t
  val padding_top : int -> t
  val padding_right : int -> t
  val padding_bottom : int -> t
  val padding_left : int -> t
  val margin : int -> t
  val margin_top : int -> t
  val margin_right : int -> t
  val margin_bottom : int -> t
  val margin_left : int -> t
  val width : int -> t
  val s_width : int Signal.signal -> s
  val height : int -> t
  val min_width : int -> t
  val s_min_width : int Signal.signal -> s
  val max_width : int -> t
  val min_height : int -> t
  val max_height : int -> t
  val width_viewport : float -> t
  val height_viewport : float -> t
  val min_width_viewport : float -> t
  val max_width_viewport : float -> t
  val min_height_viewport : float -> t
  val max_height_viewport : float -> t
  val inset : float -> t
  val inset_top : float -> t
  val inset_right : float -> t
  val inset_bottom : float -> t
  val inset_left : float -> t
  val accessibility_label : string -> t
  val s_accessibility_label : string Signal.signal -> s
  val flex_wrap : [ `nowrap | `wrap ] -> t
  val position :
    [ `static_ | `relative | `absolute | `fixed | `sticky ] -> t
  val overflow : [ `visible | `hidden | `auto ] -> t
  val s_overflow : [ `visible | `hidden | `auto ] Signal.signal -> s
  val white_space : [ `normal | `nowrap ] -> t
  val text_overflow : [ `clip | `ellipsis ] -> t
  val user_select : [ `none | `text ] -> t
  val cursor : [ `default | `pointer | `text ] -> t
  val s_cursor : [ `default | `pointer | `text ] Signal.signal -> s
  val display :
    [ `contents | `none | `inline_flex | `block | `inline | `inline_block ] -> t
end = struct
  open Lui_protocol

  type t = property * wire_value
  type s = Sbind : property * 'a Signal.signal * ('a -> wire_value) -> s

  let str p v : t = (p, StringValue v)
  let int p v : t = (p, IntValue v)
  let flt p v : t = (p, FloatValue v)
  let bool p v : t = (p, BoolValue v)

  let sstr p v : s = Sbind (p, v, fun s -> StringValue s)
  let sint p v : s = Sbind (p, v, fun i -> IntValue i)

  let set ctx node ((prop, v) : t) =
    match v with
    | StringValue v -> Lui_ui.string_property ctx node prop v
    | IntValue v -> Lui_ui.int_property ctx node prop v
    | FloatValue v -> Lui_ui.float_property ctx node prop v
    | BoolValue v -> Lui_ui.bool_property ctx node prop v

  let set_signal ctx node (Sbind (prop, src, enc)) =
    Lui_ui.value_property_signal ctx node prop (Signal.map enc src)

  let font_size v = str FontSize v
  let s_font_size v = sstr FontSize v
  let line_height v = str LineHeight v
  let font_weight v = int FontWeight v
  let font_style v = str FontStyle v
  let font_family v = str FontFamily v
  let letter_spacing v = flt LetterSpacing v
  let text_decoration v = str TextDecoration v
  let transition v = str Transition v
  let shadow v = str Shadow v
  let s_shadow v = sstr Shadow v
  let hover_shadow v = str HoverShadow v
  let s_hover_shadow v = sstr HoverShadow v
  let pressed_shadow v = str PressedShadow v
  let focus_shadow v = str FocusShadow v
  let selected_shadow v = str SelectedShadow v
  let selected_hover_shadow v = str SelectedHoverShadow v
  let hover_background v = str HoverBackground v
  let s_hover_background v = sstr HoverBackground v
  let hover_foreground v = str HoverForeground v
  let hover_border v = str HoverBorder v
  let pressed_background v = str PressedBackground v
  let selected_background v = str SelectedBackground v
  let background v = str BackgroundValue v
  let s_background v = sstr BackgroundValue v
  let foreground v = str ForegroundValue v
  let s_foreground v = sstr ForegroundValue v
  let border_color v = str BorderColorValue v
  let border_width v = int BorderWidth v
  let corner_radius v = int CornerRadius v
  let opacity v = flt Opacity v
  let hover_opacity v = flt HoverOpacity v
  let pressed_opacity v = flt PressedOpacity v
  let disabled_opacity v = flt DisabledOpacity v
  let z_index v = int ZIndex v
  let pointer_enabled v = bool PointerEnabled v
  let grow v = flt GrowValue v
  let padding v = int PaddingValue v
  let padding_horizontal v = int PaddingHorizontal v
  let padding_vertical v = int PaddingVertical v
  let padding_top v = int PaddingTop v
  let padding_right v = int PaddingRight v
  let padding_bottom v = int PaddingBottom v
  let padding_left v = int PaddingLeft v
  let margin v = int MarginValue v
  let margin_top v = int MarginTop v
  let margin_right v = int MarginRight v
  let margin_bottom v = int MarginBottom v
  let margin_left v = int MarginLeft v
  let width v = int WidthValue v
  let s_width v = sint WidthValue v
  let height v = int HeightValue v
  let min_width v = int MinWidth v
  let s_min_width v = sint MinWidth v
  let max_width v = int MaxWidth v
  let min_height v = int MinHeight v
  let max_height v = int MaxHeight v
  let width_viewport v = flt WidthViewport v
  let height_viewport v = flt HeightViewport v
  let min_width_viewport v = flt MinWidthViewport v
  let max_width_viewport v = flt MaxWidthViewport v
  let min_height_viewport v = flt MinHeightViewport v
  let max_height_viewport v = flt MaxHeightViewport v
  let inset v = flt Inset v
  let inset_top v = flt InsetTop v
  let inset_right v = flt InsetRight v
  let inset_bottom v = flt InsetBottom v
  let inset_left v = flt InsetLeft v
  let accessibility_label v = str AccessibilityLabel v
  let s_accessibility_label v = sstr AccessibilityLabel v

  let flex_wrap (v : [ `nowrap | `wrap ]) =
    str FlexWrap (match v with `nowrap -> "nowrap" | `wrap -> "wrap")

  let position
      (v : [ `static_ | `relative | `absolute | `fixed | `sticky ]) =
    str Position
      (match v with
       | `static_ -> "static"
       | `relative -> "relative"
       | `absolute -> "absolute"
       | `fixed -> "fixed"
       | `sticky -> "sticky")

  let overflow (v : [ `visible | `hidden | `auto ]) =
    str Overflow
      (match v with
       | `visible -> "visible"
       | `hidden -> "hidden"
       | `auto -> "auto")

  let s_overflow (v : [ `visible | `hidden | `auto ] Signal.signal) =
    Sbind
      ( Overflow
      , Signal.map
          (fun v ->
            match v with
            | `visible -> "visible"
            | `hidden -> "hidden"
            | `auto -> "auto")
          v
      , fun s -> StringValue s )

  let white_space (v : [ `normal | `nowrap ]) =
    str WhiteSpace
      (match v with `normal -> "normal" | `nowrap -> "nowrap")

  let text_overflow (v : [ `clip | `ellipsis ]) =
    str TextOverflow
      (match v with `clip -> "clip" | `ellipsis -> "ellipsis")

  let user_select (v : [ `none | `text ]) =
    str UserSelect
      (match v with `none -> "none" | `text -> "text")

  let cursor (v : [ `default | `pointer | `text ]) =
    str Cursor
      (match v with
       | `default -> "default"
       | `pointer -> "pointer"
       | `text -> "text")

  let s_cursor (v : [ `default | `pointer | `text ] Signal.signal) =
    Sbind
      ( Cursor
      , Signal.map
          (fun v ->
            match v with
            | `default -> "default"
            | `pointer -> "pointer"
            | `text -> "text")
          v
      , fun s -> StringValue s )

  let display
      (v :
        [ `contents | `none | `inline_flex | `block | `inline
        | `inline_block ]) =
    str DisplayValue
      (match v with
       | `contents -> "contents"
       | `none -> "none"
       | `inline_flex -> "inline-flex"
       | `block -> "block"
       | `inline -> "inline"
       | `inline_block -> "inline-block")
end
