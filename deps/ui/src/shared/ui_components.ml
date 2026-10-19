(* Shared component recipes — ONE visual spec consumed by both the web
   and native renderers (task 4 pilot: the cmdk palette). Recipes emit
   kinds + typed props bound to Ui_theme tokens/var() chains; they own
   the visual spec that used to live in lui-overlay.css and the native
   host's class registrations.

   Colors are emitted as `var(--lx-*, fallback)` strings — the same
   chains the deleted CSS used, so web resolution is unchanged; the
   native host resolves the names it knows via its css-var/theme-slot
   table.
   Mode-conditional values (state rings, keycap glow, the dark icon
   override) ride the snapshot `vars` --lx-cmdk-* tokens: their value
   differs per theme mode, so a static string could never express
   both. *)

open Lui_elements
module P = Lui_protocol

let sv v = P.StringValue v
let iv v = P.IntValue v
let fv v = P.FloatValue v
let bv v = P.BoolValue v

(* cljs .lui-popover open/close motion (fade-in-0 zoom-in-95): every
   popover call site carries the same shorthand. *)
let popover_transition =
  "opacity 150ms ease, transform 150ms ease"

(* cljs .ls-block motion: transform 0.3s on the base rule plus the
   background-color 0.2s cubic-bezier of .block-highlight /
   .ls-block.selected — merged into one shorthand on the selectable row
   emitters. Rows that can never gain .selected use plain
   "transform 0.3s ease". *)
let block_transition =
  "transform 0.3s ease, background-color 0.2s cubic-bezier(0, 1, 0, 1)"

let foldable_control ?key children : t =
  box ?key ~style_class:"ls-foldable-title-control block-control"
    ~width:22 ~height:22 ~padding:2 ~margin_top:1 ~margin_left:(-27) children

(* Typed prop binds — see Ui_parts.Prop. *)
module Prop = Ui_parts.Prop

(* Post-mount static binds for props with no constructor argument
   (overflow, shadow, cursor, user-select, font-* on container kinds).
   Same wrap pattern as Ui_parts.pressable. *)
let with_props (binds : Prop.t list) (elem : t) : t =
 fun ctx parent ->
  let node = elem ctx parent in
  ignore (Ui_parts.standard_kind ctx node);
  List.iter (Prop.set ctx node) binds;
  node

(* Application form colors belong to the shared view layer. Constructor
   arguments remain available to fields with an authored surface. *)
let form_control make ?(background = "hsl(var(--background))")
    ?(border_color = "hsl(var(--border))") ?(border_width = 1)
    ?(corner_radius = 6) =
  make background border_color border_width corner_radius

let input =
  form_control (fun background border_color border_width corner_radius ->
      Lui_elements.input ~background ~border_color ~border_width ~corner_radius)

let text_field =
  form_control (fun background border_color border_width corner_radius ->
      Lui_elements.text_field ~background ~border_color ~border_width
        ~corner_radius)

let secure_field =
  form_control (fun background border_color border_width corner_radius ->
      Lui_elements.secure_field ~background ~border_color ~border_width
        ~corner_radius)

let search_field =
  form_control (fun background border_color border_width corner_radius ->
      Lui_elements.search_field ~background ~border_color ~border_width
        ~corner_radius)

let textarea =
  form_control (fun background border_color border_width corner_radius ->
      Lui_elements.textarea ~background ~border_color ~border_width
        ~corner_radius)

(* Reference portals live outside the page-size root. Establish the body
   type scale once on overlay carriers, independently of page text sizing. *)
let overlay_typography element =
  with_props [ Prop.font_size "1rem"; Prop.line_height "1.5" ] element

let page_heading ?(margin_bottom=0) ~key ~value () =
  heading ~key ~level:1 ~as_:`H1 ~style_class:"title"
    ~font_size:"var(--ls-page-title-size, 32px)" ~line_height:"1.5"
    ~font_weight:500 ~margin:0 ~margin_bottom
    ~foreground:"var(--lx-gray-12, var(--ls-title-text-color, hsl(var(--foreground))))"
    ~value []

(* Secondary navigation links keep body text ink while fading on hover. *)
let faded_link ?key ~url ~text () =
  with_props
    [ Prop.font_size "0.875rem"; Prop.line_height "1.25rem"
    ; Prop.text_decoration "underline"
    ; Prop.opacity Ui_theme.faded_link_opacity; Prop.hover_opacity 1.
    ; Prop.hover_foreground "var(--ls-primary-text-color)" ]
    (link ?key ~url ~text ~style_class:"fade-link"
       ~foreground:"var(--ls-primary-text-color)"
       ~transition:"opacity 300ms ease"
       ~data_attrs:["style", "text-underline-offset: auto"] [])

(* Master button appearance belongs to the shared view layer. Both hosts
   receive the same typed defaults; explicit caller properties take precedence. *)
let button ?key ?gap ?main ?cross ?grow ?columns ?padding ?padding_horizontal
    ?padding_vertical ?margin ?margin_horizontal ?margin_vertical ?margin_top ?margin_right ?margin_bottom ?margin_left
    ?background ?foreground ?border_color ?border_width ?corner_radius ?width ?height ?min_width
    ?max_width ?min_height ?max_height ?container_relative_frame ?container_relative_frame_inset ?accessibility_identifier ?accessibility_identifier_signal ?foreground_signal
    ?background_signal ?style_class ?data_attrs ?data_attrs_signal ?on_appear ?on_pointer_enter ?on_pointer_leave ?text
    ?text_signal ~variant ?size ?icon ?icon_signal ?icon_placement ?label ?text_alignment
    ?selected ?selected_signal ?autofocus ?disabled ?disabled_signal ?on_navigate ?on_press ?on_long_press ?on_press_detail ?on_pointer_down
    ?on_pointer_up ?on_context_menu ?tooltip ?tooltip_signal ?shortcut_hint ?shortcut_hint_signal ?transition (children : t list) : t =
  let size = Option.value size ~default:`default in
  let base, ink, hover, hover_ink, pressed = match variant with
    | `default | `primary ->
        "hsl(var(--primary) / 0.9)", "hsl(var(--primary-foreground))",
        "hsl(var(--primary))", "hsl(var(--primary-foreground))", 0.9
    | `destructive ->
        "hsl(var(--destructive) / 0.9)", "hsl(var(--destructive-foreground))",
        "hsl(var(--destructive))", "hsl(var(--destructive-foreground))", 0.9
    | `secondary ->
        "hsl(var(--secondary) / 0.7)", "hsl(var(--secondary-foreground))",
        "hsl(var(--secondary))", "hsl(var(--secondary-foreground))", 0.8
    | `outline ->
        "hsl(var(--background))", "inherit",
        "hsl(var(--accent))", "hsl(var(--accent-foreground))", 0.8
    | `ghost ->
        "transparent", "inherit", "hsl(var(--secondary) / 0.7)",
        "hsl(var(--secondary-foreground))", 0.8
  in
  let h, ph, pv, font, line = match size with
    | `default -> 40,16,8,"0.875rem","1.25rem"
    | `sm -> 28,12,4,"0.875rem","1.25rem"
    | `lg -> 44,32,0,"1rem","1.5rem"
    | `icon -> 32,4,4,"0.875rem","1.25rem"
  in
  let default value fallback = Some (Option.value value ~default:fallback) in
  let gap = default gap 4 in
  let height = default height h in
  let width = match width,size with None,`icon -> Some 32 | _ -> width in
  let padding_horizontal = match padding with
    | Some _ -> padding_horizontal | None -> default padding_horizontal ph in
  let padding_vertical = match padding with
    | Some _ -> padding_vertical | None -> default padding_vertical pv in
  let background = default background base and foreground = default foreground ink in
  let border_width = default border_width (if variant=`outline then 1 else 0) in
  let border_color = default border_color "hsl(var(--border))" in
  let corner_radius = default corner_radius 6 in
  let text_alignment = default text_alignment (if children=[] then `center else `start) in
  let transition = default transition "background-color 150ms, color 150ms" in
  with_props
    [ Prop.white_space `nowrap;Prop.cursor `pointer;Prop.user_select `none
    ; Prop.font_size font;Prop.line_height line;Prop.font_weight 500
    ; Prop.hover_background hover;Prop.hover_foreground hover_ink
    ; Prop.disabled_opacity 0.5;Prop.pressed_opacity pressed ]
    (Lui_elements.button
      ?key ?gap ?main ?cross ?grow ?columns ?padding ?padding_horizontal
    ?padding_vertical ?margin ?margin_horizontal ?margin_vertical ?margin_top ?margin_right ?margin_bottom ?margin_left
    ?background ?foreground ?border_color ?border_width ?corner_radius ?width ?height ?min_width
    ?max_width ?min_height ?max_height ?container_relative_frame ?container_relative_frame_inset ?accessibility_identifier ?accessibility_identifier_signal ?foreground_signal
    ?background_signal ?style_class ?data_attrs ?data_attrs_signal ?on_appear ?on_pointer_enter ?on_pointer_leave ?text
    ?text_signal ~variant ~size ?icon ?icon_signal ?icon_placement ?label ?text_alignment
    ?selected ?selected_signal ?autofocus ?disabled ?disabled_signal ?on_navigate ?on_press ?on_long_press ?on_press_detail ?on_pointer_down
    ?on_pointer_up ?on_context_menu ?tooltip ?tooltip_signal ?shortcut_hint ?shortcut_hint_signal ?transition children)

let chrome_button element =
  with_props [Prop.opacity 0.7; Prop.hover_opacity 1.] element

(* Exactly one leading toolbar is interactive: the open sidebar owns it,
   otherwise the detail header does. Only the native host reserves traffic lights. *)
let leading_toolbar ~key ~in_sidebar ~safe_area ~state ~is_open ~controls =
  reactive
    ~equal:(fun a b -> is_open a = is_open b)
    (fun value ->
      if is_open value = in_sidebar then
        row ~key ~height:48 ~min_height:48 ~cross:`center
          ~margin_left:safe_area ~padding_horizontal:8 (controls ())
      else spacer ~key:(key ^ "-empty") []) state

let native_performance ~label ~unavailable ~format_fps () : t =
 fun ctx parent ->
  match Ui_services.native_performance () with
  | None -> box ~display:`contents [] ctx parent
  | Some service ->
    let sample = Signal.state ctx.Lui_ui.ui_scheduler (service.current ()) in
    let cancel = service.subscribe (fun value ->
      Signal.set sample value;
      Ui_services.request_flush ()) in
    Signal.on_dispose ctx.Lui_ui.ui_scope cancel;
    let source = Signal.value sample in
    row ~key:"native-performance" ~gap:8 ~cross:`center ~padding_horizontal:8
      [ text ~key:"fps" ~accessibility_identifier:"native-performance-fps"
          ~font_size:"0.875rem" ~line_height:"1.25rem" ~white_space:"nowrap"
          ~value:(reactive (fun (value : Ui_services.native_performance_sample) ->
            match value.fps with
            | None -> unavailable
            | Some fps -> format_fps (Printf.sprintf "%.0f" fps)) source) []
      ; button ~key:"dialog" ~variant:`ghost ~size:`sm ~label ~text:label
          ~accessibility_identifier:"native-performance-toggle"
          ~selected:(reactive (fun (value : Ui_services.native_performance_sample) -> value.panel_open) source)
          ~on_press:(fun _ -> service.toggle_panel ()) []
      ] ctx parent

(* Post-mount reactive binds (state channels + cursor on the cmdk item
   rows). *)
let with_signal_props (binds : Prop.s list) (elem : t) : t =
 fun ctx parent ->
  let node = elem ctx parent in
  ignore (Ui_parts.standard_kind ctx node);
  List.iter (Prop.set_signal ctx node) binds;
  node

(* Application dialog geometry is shared by both hosts. The primitive
   owns presentation; this recipe owns the responsive card dimensions. *)
let dialog_width viewport = if viewport >= 1024. then 768. else 672.

let dialog ?key ?(gap=16) ?(padding=24) ?padding_horizontal ?padding_vertical
    ?padding_top ?padding_bottom
    ?(width=dialog_width) ?(content_sized=false) ?style_class ?data_attrs
    ?text ?description ?on_dismiss children : t =
 fun ctx parent ->
  let element = with_props
    (List.filter_map Fun.id
      [Option.map Prop.padding_top padding_top;Option.map Prop.padding_bottom padding_bottom])
    (Lui_elements.dialog ?key ~gap ~padding ?padding_horizontal ?padding_vertical
    ~corner_radius:8 ~background:"hsl(var(--background))" ~foreground:"inherit"
    ~border_width:1 ~border_color:"hsl(var(--border))"
    ?style_class ?data_attrs ?text ?description ?on_dismiss children) in
  if content_sized then element ctx parent
  else
    let viewport = Ui_services.viewport_width_signal
      ~scheduler:ctx.Lui_ui.ui_scheduler ~scope:ctx.Lui_ui.ui_scope in
    Ui_parts.int_prop P.WidthValue
      ~value:(reactive (fun viewport ->
        int_of_float (Float.max 0. (Float.min (width viewport) (viewport -. 32.)))) viewport)
      element ctx parent

(* -- cmdk frame ------------------------------------------------------ *)

(* Rounded clip column inside the dialog host; the host keeps
   placement via .ls-dialog-cmdk. *)
let cmdk_modal ~key children =
  with_props [ Prop.overflow `hidden ]
    (column ~key ~gap:0 ~cross:`stretch ~corner_radius:8
       ~style_class:"cp__cmdk__modal" children)

(* Palette body — data-keep-selection is a closest() contract
   (container.cljs + selection_bar.ml); position:relative anchors
   overlay children like the tooltip arrow. *)
let cmdk_palette ~key ~sidebar children =
  with_props
    [ Prop.position `relative; Prop.user_select `none ]
    (column ~key ~style_class:"cp__cmdk" ~cross:`stretch ~grow:1.
       ~corner_radius:(if sidebar then 0 else 8)
       ~foreground:"var(--lx-gray-12, var(--ls-primary-text-color, var(--rx-gray-12)))"
       ~data_attrs:[ "data-keep-selection", "true" ]
       children)

(* 54px input band; the bottom hairline is an inset shadow so the row
   keeps its full 54px of content (border-box would eat 1px). *)
let cmdk_input_row ~key children =
  with_props
    [ ( Prop.shadow
          "inset 0 -1px 0 0 var(--ls-border-color, \
           hsl(var(--border)))" )
    ]
    (row ~key ~style_class:"cp__cmdk-input-row" ~cross:`center ~gap:8
       ~height:54 ~background:"var(--lx-gray-02, #f8f8f8)" children)

let cmdk_search_input ~key ?placeholder ?placeholder_signal
    ~text_signal:text ~on_text () =
  (* TextChanged is decoded once here — callers take the string *)
  let on_input ev =
    match ev with
    | P.TextChanged (_, q) -> on_text q
    | _ -> ()
  in
  with_props
    [ Prop.font_size "var(--lx-text-input)"
    ; Prop.line_height "1.75rem"
    ; Prop.border_width 0
    ; Prop.focus_shadow "none"
    ]
    ((* .lui-input ships h-10 + :focus-visible ring-2 that no typed prop
        reaches (the channel lands on --lui-focus-shadow, consumed only
        by a zero-specificity :where rule the kind rule beats). The
        documented escape hatch is the data-attrs style pair — merged
        per declaration, so it composes with the emitted style attr. *)
     input ~key ~style_class:"cp__cmdk-search-input" ~grow:1.
       ~data_attrs:
         [ (* prod input sits 1px inset inside the 54px row *)
           ("style", "box-shadow: none; outline: none; height: auto; \
                      min-height: 0; margin: 1px") ]
       ~min_width:256 ~padding:12 ~background:"transparent"
       ~foreground:
         "var(--lx-gray-12, var(--ls-primary-text-color, \
          var(--lui-c-foreground)))"
       ?placeholder ?placeholder_signal ~text_signal:text ~on_input [])

(* Results scroller — viewport-bounded like the cljs 65dvh block; owns
   the column children stack into (scroll children share a grid cell —
   multiple children need a single column root). A trailing spacer
   scrolls the last row clear of the hints bar. *)
let cmdk_scroller ~key ~bottom_pad children =
  with_props
    [ Prop.min_height_viewport 0.65; Prop.max_height_viewport 0.65 ]
    ((* prod scroller sits on gray-02 (#f8f8f8 / #023643 dark), measured
        off the .search-results parent *)
     scroll ~key ~orientation:`vertical ~style_class:"cp__cmdk-scroller"
       ~background:"var(--lx-gray-02, var(--rx-gray-02, #f8f8f8))"
       [ column ~key:"scroller-body" ~grow:1.
           (children
           @ [ spacer ~key:"scrollpad" ~grow:0. ~height:bottom_pad ~width:1 [] ])
       ])

(* -- cmdk groups ----------------------------------------------------- *)

(* Group frame: the bottom hairline is a real child (a 1px stretch box),
   skipped on the last group — same visual as the deleted border-bottom
   rule. *)
let cmdk_group_hairline ~key : t =
  box ~key ~height:1
    ~background:
      "var(--lx-gray-06, var(--ls-border-color, hsl(var(--border))))"
    []

let cmdk_group ~key ~kind ~last_signal ~pad children =
  column ~key ~cross:`stretch ~gap:0
    ~data_attrs:[ "data-cmdk-group-kind", kind ]
    (children
    @ [ spacer ~key:"gpad" ~grow:0. ~height:pad []
      ; if_
          ~test:(reactive not last_signal)
          (cmdk_group_hairline ~key:"gline")
      ])

(* 32px header row: title toggles more/less, count is a small label,
   the "show more" link fades in on hover (its own hover channel). *)
let cmdk_group_header ~key children =
  with_props
    [ Prop.font_size "var(--lx-text-header)"; Prop.line_height "16px" ]
    (row ~key ~style_class:"cp__cmdk-group-header" ~cross:`center
       ~gap:8 ~height:32 ~padding_horizontal:12
       ~background:
         "var(--lx-gray-02, var(--ls-secondary-background-color, \
          hsl(var(--muted))))"
       ~foreground:
         "var(--lx-gray-11, var(--ls-secondary-text-color, \
          hsl(var(--muted-foreground))))"
       children)

(* A two-point leading spacer keeps the count's inset in row flow. *)
let cmdk_group_title ~key ~value ~on_press : t =
  row ~key ~gap:0
    [ spacer ~key:"i" ~width:2 ~height:1 []
    ; with_props [ Prop.user_select `none; Prop.cursor `pointer ]
        (text ~key:"t" ~style_class:"cp__cmdk-group-title" ~font_weight:700
           ~value ~on_press [])
    ]

let cmdk_group_count ~key ~value : t =
  row ~key ~gap:0
    [ spacer ~key:"i" ~width:6 ~height:1 []
    ; text ~key:"t"
        ~font_size:"0.7rem" ~corner_radius:9999 ~value []
    ]

let cmdk_group_more ~key ~on_press children : t =
  Ui_parts.pressable ~on_press
    (with_props
       [ Prop.opacity 0.5
       ; Prop.hover_opacity 0.9
       ; Prop.user_select `none
       ; Prop.cursor `pointer
       ]
       (row ~key ~min_width:110
          [ row ~key:"i"
              ~cross:`center ~gap:4 children ]))

(* -- cmdk items ------------------------------------------------------ *)

(* Item row: rounded token-typed column + state-channel props the view
   binds to item signals (background/hover ring/kb shadow/cursor). The
   [data-cmdk-item] hooks are attrs only — the old cp__cmdk-item class
   dual-track is gone. The header's -4px pull becomes a relative inset
   on the header row — same pixels as the deleted negative margin. *)
let cmdk_item_row ~key ~data_attrs_signal ~background_signal ~shadow_signal
    ~hover_background_signal ~hover_ring_signal
    ~(cursor_signal : [ `default | `pointer | `text ] Signal.signal)
    ~header ~main : t =
  let children =
    (match header with Some h -> [ h ] | None -> [])
    @ [ main ]
  in
  with_signal_props
    [ Prop.s_shadow shadow_signal
    ; Prop.s_hover_background hover_background_signal
    ; Prop.s_hover_shadow hover_ring_signal
    ; Prop.s_cursor cursor_signal
    ]
    (with_props
       [ Prop.font_size "var(--lx-text-row)"; Prop.line_height "1.25rem" ]
       (column ~key ~gap:2 ~cross:`stretch ~padding_vertical:6
          ~padding_horizontal:12 ~corner_radius:8
          ~data_attrs_signal ~background_signal children))

(* Breadcrumb header inside an item row — 32px left inset, small light
   type, single-line ellipsis. *)
let cmdk_item_header ~key children =
  with_props
    [ Prop.font_size "var(--lx-text-header)"
    ; Prop.font_weight 300
    ; Prop.line_height "16px"
    ; Prop.overflow `hidden
    ; Prop.position `relative
    ; Prop.inset_top (-4.)
    ]
    (row ~key ~style_class:"breadcrumb" ~cross:`center
       ~gap:8 ~min_width:0
       ~data_attrs:
         [ (* WhiteSpace/TextOverflow are text-kind props — on a row the
              only channel is the documented data-attrs style pair. *)
           ("style", "white-space: nowrap; text-overflow: ellipsis") ]
       ~foreground:
         "var(--lx-gray-11, var(--ls-secondary-text-color, \
          hsl(var(--muted-foreground))))"
       (spacer ~key:"i" ~width:32 ~height:1 [] :: children))

let cmdk_item_main ~key children =
  row ~key ~cross:`start ~gap:12 children

(* 20x20 rounded icon chip (cljs w-5 h-5); the glyph
   color is a mode token (white in dark like the deleted .dark rule). *)
let cmdk_icon_chip ~key children =
  row ~key ~style_class:"cmdk-item-icon" ~main:`center ~cross:`center
    ~width:20 ~height:20 ~corner_radius:4
    ~background:
      "var(--lx-gray-05, var(--ls-tertiary-background-color, \
       hsl(var(--muted))))"
    ~foreground:"var(--lx-cmdk-icon-fg)" children

let cmdk_item_body ~key children =
  column ~key ~grow:1. ~min_width:0
    ~cross:`stretch children

let cmdk_main_text ~key children =
  with_props [ Prop.font_weight 500; Prop.overflow `hidden ]
    (row ~key ~style_class:"cp__cmdk-item-main-text" ~cross:`center
       ~gap:4 ~min_width:0
       ~foreground:
         "var(--lx-gray-12, var(--ls-primary-text-color, \
          var(--lui-c-foreground)))"
       children)

(* Inline info suffix — a gap-0 row (NOT a text/span: keyed children
   under a text element render as block-level .lui-stack divs and wrap
   to their own line). Small gray text like the deleted
   .cp__cmdk-item-info rule. *)
let cmdk_info_text ~key children =
  with_props [ Prop.font_size "var(--lx-text-header)" ]
    (row ~key ~style_class:"cp__cmdk-item-info" ~cross:`center ~gap:0
       ~min_width:0
       ~foreground:
         "var(--lx-gray-11, var(--ls-secondary-text-color, \
          hsl(var(--muted-foreground))))"
       children)

let cmdk_badge ~key ~value : t =
  text ~key ~as_:`Span
    ~font_size:"var(--lx-text-header)" ~font_weight:500 ~line_height:"1"
    ~padding_vertical:2 ~padding_horizontal:8 ~corner_radius:9999
    ~border_width:1
    ~border_color:
      "var(--lx-gray-06, var(--ls-border-color, rgb(0 0 0 / 0.12)))"
    ~background:
      "var(--lx-gray-04, var(--ls-tertiary-background-color, \
       rgb(0 0 0 / 0.08)))"
    ~foreground:
      "var(--lx-gray-11, var(--ls-secondary-text-color, \
       rgb(0 0 0 / 0.7)))"
    ~value []

(* -- cmdk shortcut keycaps -------------------------------------------- *)

(* Kbd admits only typography — the keycap chrome (20px slot, boxed
   border/bg, glow shadow) lives on a centered row wrapper. [boxed]
   mirrors .shui-key-boxed; [glow] mirrors .shui-shortcut-glow.
   [min_slot] is the 20px floor combo/separate keys get; standalone
   keycaps (tooltips) stay content-sized.
   Boxed keys keep the kbd unclassed: .shui-shortcut-separate
   kbd.shui-shortcut-key in shui.css would paint a second chrome box
   inside the wrapper. Unboxed keys (combo/tooltip) keep the class so
   the surviving stylesheet supplies their padding/height exactly. *)
let keycap ~key ~boxed ~glow ?(min_slot = 20) ~value : t =
  let binds =
    (if boxed then
       [ ( Prop.background "var(--lx-gray-06-alpha, var(--rx-gray-06-alpha))" )
       ; Prop.corner_radius 4
       ]
       @
       (* glow replaces the 1px border (.shui-shortcut-*.shui-shortcut-glow
          kbd{box-shadow:…;border:none}) *)
       if glow then
         [ ( Prop.shadow
               "var(--kbd-glow-top) 0px 1px 0px 0px inset, \
                var(--kbd-glow-bottom) 0px -1px 0px 0px inset" )
         ]
       else
         [ Prop.border_width 1
         ; ( Prop.border_color "var(--lx-gray-06-alpha, var(--rx-gray-06-alpha))" )
         ]
     else [])
  in
  with_props binds
    (row ~key ~main:`center ~cross:`center
       (* web kbd.shui-shortcut-key: h-5 + padding 2px 4px *)
       ~height:20
       ?min_width:(if min_slot > 0 then Some min_slot else None)
       ~padding_horizontal:4
       ~foreground:"var(--lx-gray-12, var(--rx-gray-12))"
       [ with_props
           [ Prop.font_size "var(--lx-text-header)"
           ; Prop.font_weight 400
           ; Prop.line_height "16px"
           ; Prop.letter_spacing (-0.5)
           ; Prop.white_space `nowrap
           ; (* the wrapper owns the keycap chrome — web kbd.shui-shortcut-key
                has no intrinsic box; suppress the kind default's muted
                chip + hairline so the translucent gray-06 fill shows *)
             Prop.background "transparent"
           ; (* the kbd kind's text placement reserves 6/2 ink inset
                which would stack on the wrapper's padding — zero it so
                each key measures glyph + wrapper px-1, matching web *)
             Prop.padding_horizontal 0
           ; Prop.padding_vertical 0
           ]
           (kbd
              ~style_class:(if boxed then "" else "shui-shortcut-key")
              ~value []) ])

(* 1px divider between combo keys (width 0 + no paint inside hints —
   combo just isn't used there). *)
let keycap_separator ~key : t =
  box ~key ~width:1
    ~background:"var(--lx-gray-07-alpha, var(--rx-gray-07-alpha))"
    []

(* Combo: one boxed+glowing container wrapping all keys. Glow replaces
   the border like .shui-shortcut-combo.shui-shortcut-glow (border:none);
   the surviving stylesheet still paints the same chrome, so the typed
   props below carry identical values for the native host, not a
   second paint. *)
let shortcut_combo ~key ~glow children : t =
  with_props
    ([ ( Prop.background "var(--lx-gray-06-alpha, var(--rx-gray-06-alpha))" )
     ; Prop.corner_radius 4
     ]
     @
     if glow then
       [ Prop.border_width 0
       ; ( Prop.shadow
             "var(--kbd-glow-top) 0px 1px 0px 0px inset, \
              var(--kbd-glow-bottom) 0px -1px 0px 0px inset" )
       ]
     else
       [ Prop.border_width 1
       ; ( Prop.border_color "var(--lx-gray-06-alpha, var(--rx-gray-06-alpha))" )
       ])
    (row ~key ~style_class:"shui-shortcut-combo" ~cross:`stretch
       ~height:20 ~gap:0 children)

(* Separate: transparent container; the glow lives on each boxed key,
   matching .shui-shortcut-separate.shui-shortcut-glow kbd (no container
   shadow in the original CSS). *)
let shortcut_separate ~key ~glow:_ children : t =
  row ~key ~style_class:"shui-shortcut-separate" ~cross:`center ~gap:4
    children

let shortcut_chord ~key children : t =
  row ~key ~cross:`center ~gap:8
    children

(* "then" separator between chord groups — 10px at 45% opacity like
   cljs shui-shortcut-chord-sep. *)
let chord_separator ~key : t =
  with_props [ Prop.opacity 0.45 ]
    (text ~key ~font_size:"0.625rem"
       ~value:"then" [])

(* Text-only spans for the compact header link — same typography as a
   keycap, no chrome. *)
let compact_key ~key ~value : t =
  text ~key ~as_:`Span ~font_size:"var(--lx-text-header)" ~font_weight:400
    ~line_height:"16px" ~letter_spacing:(-0.5) ~white_space:"nowrap"
    ~foreground:"var(--lx-gray-12, var(--rx-gray-12))" ~value []

let shortcut_compact ~key children : t =
  row ~key ~style_class:"shui-shortcut-compact" ~cross:`center ~gap:2
    children

(* 20px shortcut slot inside an item row — the cells box is clipped at
   20px like the deleted .shui-shortcut-row > .lui-box rule. *)
let shortcut_slot ~key ~opacity_signal children : t =
  row ~key ~style_class:"shui-shortcut-row" ~cross:`center ~gap:4
    ~height:20 ~min_height:20 ~max_height:20 ~opacity_signal
    [ with_props [ Prop.overflow `hidden ]
        (box ~key:"sc-cells" ~height:20 ~max_height:20 children) ]

(* -- cmdk hints bar --------------------------------------------------- *)

(* 45px footer band; the top hairline is an inset shadow like the input
   row's bottom one. *)
let cmdk_hints_bar ~key children =
  with_props
    [ ( Prop.shadow
          "inset 0 1px 0 0 var(--lx-gray-05, var(--ls-border-color, \
           hsl(var(--border))))" )
    ]
    (row ~key ~style_class:"hints" ~main:`space_between ~cross:`center
       ~gap:8 ~min_height:45 ~padding_vertical:8 ~padding_horizontal:12
       ~background:
         "var(--lx-gray-03, var(--ls-tertiary-background-color, \
          hsl(var(--muted))))"
       children)

(* prod .text-sm.leading-6 tip container: no extra horizontal pad,
   4px of vertical pad around the 24px line *)
let cmdk_hints_inner ~key children =
  with_props
    [ Prop.font_size "var(--lx-text-row)"; Prop.line_height "1.5rem" ]
    (box ~key ~padding_vertical:2
       children)

let cmdk_hints_row ~key children =
  row ~key ~cross:`center ~gap:4
    children

let cmdk_hints_label ~key ~value : t =
  text ~key ~font_weight:500 ~value
    ~foreground:
      "var(--lx-gray-12, var(--ls-primary-text-color, \
       var(--lui-c-foreground)))"
    []

(* The tip line brightens on hover (own hover channel). *)
let cmdk_tip ~key children : t =
  with_props [ Prop.opacity 0.5; Prop.hover_opacity 1.0 ]
    (row ~key ~cross:`center ~gap:4 children)

(* Right-aligned action hints group — the -6px bleed-out under the bar's
   6px pad becomes a relative inset like the item header's. *)
let cmdk_hints_group ~key children : t =
  with_props [ Prop.position `relative; Prop.inset_right (-6.) ]
    (row ~key ~cross:`center ~gap:8
       children)

(* Flat 28px hint button — dims to 0.8 on hover via its own channel. *)
let cmdk_hint_button ~key ~label ~on_press children : t =
  with_props
    [ Prop.font_size "var(--lx-text-header)"
    ; Prop.opacity 0.4
    ; Prop.hover_opacity 0.8
    ; Prop.cursor `pointer
    ]
    (button ~variant:`ghost ~key ~label ~on_press ~height:28 ~min_height:28 ~padding:0
       ~style_class:"cp__cmdk-hint"
       ~foreground:
         "var(--lx-gray-11, var(--ls-secondary-text-color, \
          hsl(var(--muted-foreground))))"
       [ row ~key:"inner" ~cross:`center ~gap:6 children ])

(* -- cmdk misc -------------------------------------------------------- *)

(* "Search only: <group>" filter chip. *)
let cmdk_search_only ~key children : t =
  with_props
    [ Prop.font_size "var(--lx-text-header)"
    ; Prop.font_weight 500
    ; Prop.line_height "1rem"
    ]
    (column ~key ~opacity:0.7
       ~padding_vertical:4 ~padding_horizontal:12 children)

let cmdk_search_only_row ~key children : t =
  row ~key ~cross:`center ~gap:4
    children

(* 4px left inset via leading spacer (see group_title). *)
let cmdk_search_only_name ~key ~value : t =
  row ~key ~gap:0
    [ spacer ~key:"i" ~width:4 ~height:1 []
    ; text ~key:"t"
        ~font_weight:500 ~value []
    ]

let cmdk_search_only_clear ~key ~label ~on_press : t =
  with_props [ Prop.cursor `pointer ]
    (button ~variant:`ghost ~key ~icon:(`app "x") ~size:`icon ~label ~on_press
       ~padding:4 [])

let cmdk_empty ~key children : t =
  box ~key ~padding:16 ~opacity:0.5
    children

(* -- tooltip ---------------------------------------------------------- *)

(* Popover surface — hsl() chains stay web-only (the native host
   leaves them
   unresolved: documented leftover). The fade-in animation and the
   rotated arrow transform remain CSS deco rules; pointer-events stays
   off so the bubble never steals hover from its own trigger. *)
let tooltip_content ~key ~at ~arrow_x ~above children : t =
  with_props
    [ Prop.z_index 50
    ; Prop.pointer_enabled false
    ; ( Prop.shadow
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / \
           0.1)" )
    ]
    (popover ~transition:popover_transition ~key ~accessibility_identifier:"lui-tooltip" ~at
       ~style_class:"ui__tooltip-content" ~gap:6
       ~data_attrs:[ "role", "tooltip" ]
       ~padding_horizontal:12 ~padding_vertical:6 ~max_width:320
       ~corner_radius:6 ~border_width:1
       ~border_color:"hsl(var(--border))" ~background:"hsl(var(--popover))"
       ~foreground:"hsl(var(--popover-foreground))"
       ([ with_props
            [ Prop.font_size "0.75rem"; Prop.line_height "16px" ]
            (column ~key:"tip" ~gap:6 children)
        ; with_props
            ([ Prop.position `absolute
             ; Prop.pointer_enabled false
             ; Prop.inset_left arrow_x
             ]
            @ if above then [ Prop.inset_bottom (-4.) ]
              else [ Prop.inset_top (-4.) ])
            (box ~key:"arrow" ~style_class:"ui__tooltip-arrow" ~width:8
               ~height:8 ~border_width:1
               ~border_color:"hsl(var(--border))"
               ~background:"hsl(var(--popover))" [])
        ]))

let ls_tooltip_col ~key children : t =
  column ~key ~cross:`start ~gap:4 children

let ls_tooltip_keys ~key children : t =
  with_props [ Prop.opacity 0.8 ]
    (row ~key ~cross:`center ~gap:1
       children)

(* -- settings & properties recipes (task 5) ----------------------------- *)

(* Form labels use one grid column; controls span two when no side slot
   is present. Responsive properties preserve mounted controls across resize. *)
type form_density = [ `regular | `compact ]

let form_row ~key ~label ?(label_extra = []) ?desc ?(side = [])
    ?(density : form_density = `regular) ?col_gap ?min_height ?(cross = `start) ~control () : t =
 fun ctx parent ->
  let label_height = if density=`compact then 20 else 28 in
  let col_gap = Option.value col_gap ~default:(if density=`compact then 16 else 24) in
  let min_height = Option.value min_height ~default:label_height in
  let viewport = Ui_services.viewport_width_signal ~scheduler:ctx.Lui_ui.ui_scheduler
    ~scope:ctx.Lui_ui.ui_scope in
  let control =
    Ui_parts.int_prop P.GridColumnSpan
      ~value:(reactive (fun viewport -> if viewport>=640. && side=[] then 2 else 1) viewport)
      (Ui_parts.int_prop P.MarginTop
        ~value:(reactive (fun viewport -> if viewport<640. then 4 else 0) viewport)
      (row ~key:(key ^ "-rc") ~min_width:0 ~cross:`center ~gap:16
        [control])) in
  Ui_parts.int_prop P.GridColumns
    ~value:(reactive (fun viewport -> if viewport>=640. then 3 else 1) viewport)
    (Ui_parts.int_prop P.Gap
      ~value:(reactive (fun viewport -> if viewport>=640. then col_gap else 0) viewport)
    (grid ~key ~style_class:"it" ~min_width:0 ~cross ~min_height
      ([column ~key:(key ^ "-lc") ~min_width:0 ~cross:`stretch ~gap:0
          ([row ~key:(key ^ "-l") ~cross:`center ~gap:0 ~min_height:label_height
              (label :: label_extra)]
           @ match desc with Some d -> [d] | None -> []);
        control]
       @ List.mapi (fun i content ->
         box ~key:(key ^ "-s" ^ string_of_int i) ~min_width:0 [content]) side))) ctx parent

(* `.ls-label`/`.it-label` — 14px medium, 28px line, 70% opacity.
   Inside a flex-col label cell cljs uses leading-5 (20px). *)
let form_label ~key ?(density : form_density = `regular) ?line_height ?text_signal ~text () : t =
  let line_height = Option.value line_height
    ~default:(if density=`compact then "1.25rem" else "1.75rem") in
  with_props
    [ Prop.font_size "0.875rem"
    ; Prop.font_weight 500
    ; Prop.line_height line_height
    ; Prop.opacity 0.7
    ]
    (match text_signal with
     | Some s -> label ~key ~value_signal:s []
     | None -> label ~key ~value:text [])

(* `.it-desc`/`.ls-it-desc` — 12px muted line under a label or next to a
   control. *)
let form_desc ~key ~value : t =
  text ~key ~font_size:"0.75rem" ~value
    ~foreground:
      "var(--lx-gray-10, var(--ls-secondary-text-color, \
       hsl(var(--muted-foreground))))"
    []

(* The field paints first; its hit-transparent leading icon paints above the
   surface. Typed edge padding keeps text, caret, and pointer coordinates in
   the same content box on every host. Trailing controls remain in row flow. *)
let search_row ~key ?(height = 26) ?(font_size = "0.8125rem") ?(pad_left = 28)
    ?pad_right ?background ?(borderless = false) ?(trailing = []) ?autofocus
    ?clear_label ?on_clear ~placeholder ~text_signal:text ~on_text () : t =
  let background =
    match background, borderless with
    | None, true -> Some "transparent"
    | _ -> background
  in
  let on_input ev =
    match ev with P.TextChanged (_, q) -> on_text q | _ -> ()
  in
  let clear =
    match clear_label with
    | None -> []
    | Some label ->
        [
          if_
            ~test:(reactive (fun value -> String.trim value <> "") text)
            (with_props
               [ Prop.position `absolute; Prop.inset_right 4. ]
               (button ~key:"clear" ~variant:`ghost ~width:20 ~height:20
                  ~min_width:0 ~min_height:0 ~padding:4 ~label ~icon:(`app "x")
                  ~on_press:(fun _ ->
                    on_text "";
                    Option.iter (fun focus -> focus ()) on_clear)
                  []));
        ]
  in
  with_props
    [ Prop.position `relative ]
    (row ~key ~cross:`center ~gap:0 ~min_width:0
       ([
          with_props
            ([ Prop.font_size font_size; Prop.padding_left pad_left ]
            @ Option.to_list (Option.map Prop.padding_right pad_right)
            @
            if borderless then [ Prop.border_width 0; Prop.focus_shadow "none" ]
            else [])
            (search_field ~key:"in" ~grow:1. ~min_width:0 ~height ?background
               ?style_class:
                 (Option.map (fun _ -> "ls-search-with-clear") clear_label)
               ~placeholder ?autofocus ~text_signal:text ~on_input []);
          with_props
            [
              Prop.position `absolute;
              Prop.inset_left (if pad_left >= 32 then 10. else 8.);
              Prop.opacity 0.5;
              Prop.pointer_enabled false;
            ]
            (box ~key:"ic" [ icon ~key:"i" ~name:(`app "search") ~size:`sm [] ]);
        ]
       @ clear @ trailing))

(* Settings nav item — `.settings-menu-item` visual spec: 6/8px padding,
   4px radius, 14px/20px type; hover and active paint ride the
   `--lx-nav-active` mode token (black 10% light / white 8% dark —
   replaces the `.active`/`.dark .active` pair). The `.active` class
   itself stays on the element via the caller's class_signal (native
   hook). *)
let nav_item_height = 32

let nav_item ~key ~data_id ~icon:icon_ ~text:label ~selected_signal:selected
    ~on_press () : t =
  with_props
    [
      Prop.hover_background "var(--lx-nav-active)";
      Prop.font_size "0.875rem";
      Prop.line_height "1.25rem";
      Prop.font_weight 400;
    ]
    (list_item ~key ~corner_radius:4 ~min_height:nav_item_height ~height:nav_item_height
       ~padding_vertical:6 ~padding_horizontal:8 ~main:`start ~cross:`center
       ~foreground:"inherit" ~style_class:"settings-menu-item"
       ~accessibility_identifier:data_id
       ~data_attrs:[ ("data-id", data_id) ]
       ~background:
         (reactive
            (fun active ->
              if active then "var(--lx-nav-active)" else "transparent")
            selected)
       ~selected_signal:selected ~on_press
       [
         row ~key:"content" ~cross:`center ~gap:4
           [
             Icons.icon ~size:18. ~cls:"ls-nav-item-icon" icon_;
             with_props [Prop.opacity 0.9] (text ~key:"label" ~value:label []);
           ];
       ])

(* Pill/chip toggle — the `.shortcut-filter-pill` (9999 bordered) and
   `.secondary-tabs > button` (6px radius, 4/12 padding) shapes share one
   recipe: ghost toggle_button, checked = gray-04 fill + full opacity.
   `radius`/`pad_v`/`pad_h`/`font_size` select the variant. The kind has
   no background/opacity signal channels, so the paint rides a reactive
   rebuild on `checked`. *)
let chip_toggle ~key ~radius ~pad_v ~pad_h ~font_size ?text ?text_signal
    ~checked_signal:checked ?(off_opacity = 0.7) ?(on_border = true)
    ?(on_background =
        "var(--lx-gray-04, var(--ls-tertiary-background-color, \
         hsl(var(--muted))))") ~on_toggle () : t =
  reactive ~equal:( = ) (fun c ->
    with_props
      [ Prop.cursor `pointer
      ; Prop.font_size font_size
      ; Prop.opacity (if c then 1. else off_opacity)
      ; Prop.hover_opacity 1.
      ]
      (toggle_button ~key ~variant:`ghost ?text ?text_signal ~foreground:"inherit"
         ~checked:c ~on_toggle
         ~min_height:0 ~height:(pad_v * 2 + 14) ~padding_vertical:pad_v
         ~padding_horizontal:pad_h ~corner_radius:radius
         ~border_width:(if on_border then 1 else 0)
         ~border_color:
           "var(--lx-gray-06, var(--ls-border-color, hsl(var(--border))))"
         ~background:(if c then on_background else "transparent")
         []))
    checked

(* Round color swatch button — `.color-picker-presets .it`, the accent
   swatch, `.ls-cm-swatch` share this chrome: ghost button, fixed square,
   9999 radius; the colored dot/variant glyph is a child so "none"/"-"
   variants ride the same 30px hit area. *)
let color_swatch ~key ~size ~background ~on_press ?(selected = false)
    ?(opacity = 1.) ?hover_opacity ?border_color ?border_width ?label
    ?style_class children : t =
  with_props
    ([ Prop.cursor `pointer; Prop.opacity opacity ]
    @
    match hover_opacity with
    | Some o -> [ Prop.hover_opacity o ]
    | None -> [])
    (button ~key ~variant:`ghost ~width:size ~height:size ~min_width:size
       ~min_height:size ~padding:0 ~corner_radius:9999 ~background
       ~selected ~on_press ?border_color ?label ?style_class
       ?border_width:(match border_color with
                      | Some _ -> Some (Option.value ~default:1 border_width)
                      | None -> None)
       children)

(* `.bottom-property-pill` — 24px rounded chip (key + ":" + value):
   gray-03 fill, inset 1px ring, nowrap. The class stays as the
   native/web hook; visuals ride typed props. *)
let property_pill ~key children : t =
  with_props
    [ ( Prop.shadow "inset 0 0 0 1px var(--lx-gray-06, var(--ls-border-color))" )
    ; Prop.font_size "0.875rem"
    ; Prop.line_height "20px"
    ; Prop.overflow `hidden
    ]
    (row ~key ~style_class:"bottom-property-pill"
       ~cross:`center ~gap:4 ~height:24 ~padding_vertical:2
       ~padding_horizontal:8 ~corner_radius:9999 ~min_width:0
       ~background:
         "var(--lx-gray-03, var(--ls-secondary-background-color))"
       ~foreground:
         "var(--lx-gray-12, var(--ls-primary-text-color))" children)

(* Plugin card — `.lui-card` stacks children into one grid cell, so the
   whole card body arrives as a single child. position:relative keeps
   the gear menu's absolute `.menu-list` anchored to the card. *)
let plugin_card ~key ?(classes = "") child : t =
  with_props [ Prop.position `relative ]
    (card ~key ~style_class:("cp__plugins-item-card" ^ classes)
       ~corner_radius:8 ~padding:12 ~min_width:256 ~border_width:1
       ~border_color:
         "var(--lx-gray-06, var(--ls-border-color, hsl(var(--border))))"
       ~data_attrs:[ "style", "width:calc(50% - 0.5rem);box-sizing:border-box" ]
       [ child ])

(* Theme-mode option card — the `.cp__theme-modes-options > li` spec:
   92px thumbnail (`i.mode-*`) over a centered 12px label, `.9` opacity
   until hover/active, selected thumbnail ring = inset 2px link color.
   The selected prop owns state; a shared overlay paints the ring. *)
let option_card ~key ~thumbnail ~label ?(min_height = 0)
    ~selected_signal:selected
    ~on_press () : t =
  with_props
    [ Prop.hover_opacity 1.; Prop.cursor `pointer
    ; Prop.hover_background "transparent" ]
    (Ui_parts.float_prop P.Opacity
      ~value:(reactive (fun active -> if active then 1. else 0.9) selected)
    (list_item ~key ~on_press ~selected_signal:selected ~background:"transparent"
       ~min_height:0 ~width:100 ~padding_vertical:0 ~padding_horizontal:0
       (* cljs li: <i> thumbnail 92x63 on top, <strong> label centered
          below — column keeps the label under the image instead of
          beside it; cljs li has no padding, i and strong are flush *)
       [ column ~key:"c" ~cross:`start ~gap:6 ~min_height
           [ with_props [ Prop.overflow `hidden ]
                  (stack ~key:"i" ~width:92 ~height:63 ~corner_radius:4
                     ~background:"var(--lx-gray-04, hsl(var(--muted)))"
                     [ thumbnail
                     ; with_props [Prop.pointer_enabled false]
                         (box ~key:"ring" ~width:92 ~height:63 ~corner_radius:4
                            ~border_width:2 ~border_color:"var(--ls-link-text-color)"
                            ~background:"transparent"
                            ~opacity:(reactive (fun active -> if active then 1. else 0.) selected)
                            []) ])
           ; text ~key:"t" ~font_size:"0.75rem" ~font_weight:500
               ~line_height:"1rem" ~width:84 ~height:16
               ~value:label ~text_alignment:`center []
           ]
       ]))

(* -- menus & overlays -------------------------------------------------- *)

let menu_item_chrome element =
  with_props
    [ Prop.font_size "0.875rem"
    ; Prop.line_height "1.25rem"
    ; Prop.foreground "inherit"
    ; Prop.hover_background "var(--lx-gray-05, hsl(var(--muted)))" ]
    element

(* The lui-overlay .ui__dropdown-menu-content/.ui__select-content card
   spec as props — migrated dropdown/select popups carry this chrome so
   the compat class can be dropped. [cls] keeps app-semantic hooks. *)
let menu_surface ?max_height element =
  with_props
    [ ( Prop.shadow "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / \
           0.1)" )
    ; Prop.font_size "0.875rem"
    ; Prop.line_height "1.25rem"
    ; (match max_height with
       | Some height -> Prop.max_height height
       | None -> Prop.max_height_viewport 1.)
    ; Prop.padding 4
    ; Prop.background "hsl(var(--popover))"
    ; Prop.foreground "inherit"
    ; Prop.border_color "hsl(var(--border))"
    ; Prop.border_width 1
    ; Prop.corner_radius 6
    ; Prop.overflow `auto ]
    element

let menu_card ~key ?(cls = "") ~anchor ~anchor_alignment ~on_dismiss
    ?max_height ?(data_attrs = []) items : t =
  menu_surface ?max_height
    (dropdown_menu ~key ~anchor ~anchor_alignment ~on_dismiss
       ~min_width:128 ~style_class:cls ~data_attrs items)

(* Same chrome on a popover surface — for anchored popups whose children
   are not menu rows (dropdown_menu rejects non-menu children). *)
let popover_card ~key ?(cls = "") ~anchor ~anchor_alignment ~on_dismiss
    children : t =
  with_props
    [ ( Prop.shadow "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / \
           0.1)" ) ]
    (popover ~transition:popover_transition ~key ~anchor ~anchor_alignment ~on_dismiss
       ~min_width:128 ~padding:4
       ~background:"hsl(var(--popover))"
       ~border_color:"hsl(var(--border))" ~border_width:1
       ~corner_radius:6 ~style_class:cls children)

(* Card shadows as with_props binds for ~at-anchored popups (point-
   anchored surfaces can't use the ~anchor recipes above): [card_shadow]
   is the .ui__popover-content/.ui__dropdown-menu-content shadow,
   [sub_card_shadow] the deeper .ui__dropdown-menu-sub-content variant. *)
let card_shadow =
  ( Prop.shadow "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
  )

let sub_card_shadow =
  ( Prop.shadow "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / \
        0.1)" )

(* Floating dialog close — the .ui__dialog-close spec (absolute
   top-right, 16px ghost icon, hover/focus opacity) as props. Mounts
   inside .lui-dialog-body; the fixed-positioned .lui-dialog section is
   the containing block. *)
let dialog_close ~key ~label ~on_press : t =
  with_props
    [ Prop.position `absolute
    ; Prop.inset_top 16.
    ; Prop.inset_right 16.
    ; Prop.opacity 0.7
    ; Prop.hover_opacity 1. ]
    (button ~key ~variant:`ghost ~size:`icon ~width:16 ~height:16
       ~corner_radius:4 ~icon:(`app "x") ~label ~on_press [])

(* -- editor chrome (task 5) -------------------------------------------- *)

(* Floating action-bar capsule — the deleted
   .selection-action-bar/.table-action-bar card spec (popover bg, 6px
   radius, drop shadow) as props. Wraps an
   [Lui_element_combine.action_toolbar], optionally with leading content
   (e.g. the selected-count text). The kit composite's own
   `surface`/`corner_radius:20` are transparent on web, so the capsule
   is what paints the floating surface there. *)
let action_bar_capsule ~key ?(cls = "") ?border_color ?border_width
    child : t =
  with_props
    [ ( Prop.shadow "0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, \
           0.08)" ) ]
    (box ~key ~style_class:cls ~background:"hsl(var(--popover))"
       ?border_color ?border_width ~corner_radius:6 [ child ])

(* Inline action toolbar with typed neutral chrome. Reveal opacity
   belongs to a wrapping row because Toolbar does not admit opacity;
   flex layout also avoids an inline toolbar's baseline gap on Web.
   Toolbar requires a non-empty accessibility label.
   Toolbar admits controls and control groups. Mount conditional controls
   with [if_] and group related inputs with ButtonGroup. *)
let flat_toolbar ~key ?(cls = "") ?opacity_signal ~label children : t =
  row ~style_class:cls ?opacity_signal ~min_width:0 ~cross:`center
    [ toolbar ~key ~orientation:`horizontal ~label ~gap:4
        ~background:"transparent" ~border_width:0 ~padding:0 ~corner_radius:0
        children ]

(* -- dialog chrome ------------------------------------------------------ *)

(* cljs AlertDialog chrome (shui dialog-confirm!) — shared by
   dialogs_view.confirm_view and the page_menu confirm layers. The card
   is hand-rolled (not the dialog kind) because outside presses must
   NOT dismiss; it rides a cover popover for the scrim + Escape.

   Web keeps position:fixed + left/top/translate centering through the
   documented data-attrs style pair (left:%/transform have no prop);
   the native host anchors absolute children through the parent's flex
   centering —
   the same mechanism .cp__dialog-shell uses. *)
let alert_dialog_overlay ~key children =
  with_props
    [ Prop.position `fixed; Prop.inset 0.; Prop.z_index 999 ]
    (column ~key ~grow:1. ~main:`center ~cross:`center
       ~style_class:"ui__alert-dialog-overlay"
       ~background:
         "color-mix(in oklab, var(--lui-c-background) 80%, transparent)"
       children)

let alert_dialog_content ~key ~data_attrs children =
  with_props
    [ Prop.position `fixed; Prop.z_index 999
    ; ( Prop.shadow "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px \
            rgb(0 0 0 / 0.1)" ) ]
    (column ~key ~gap:16 ~padding:24 ~max_width:512 ~corner_radius:8
       ~border_width:1 ~border_color:"hsl(var(--border))"
       ~background:"var(--ls-primary-background-color, var(--lui-c-background))"
       ~style_class:"ui__alert-dialog-content"
       ~data_attrs:
         ( ( "style"
           , "left:50%;top:50%;width:100%;transform:translate(-50%,-50%)" )
         :: data_attrs )
       children)

(* gap-2 column (the deleted rule's text-align:left is the inherited
   default — no ancestor centers) *)
let alert_dialog_header ~key children =
  column ~key ~gap:8 ~style_class:"ui__alert-dialog-header" children

(* grid sibling of the header, not an AlertDialogDescription *)
let alert_dialog_main_content ~key children =
  box ~key ~padding_vertical:8
    ~style_class:"ui__alert-dialog-main-content" children

let alert_dialog_footer ~key children =
  row ~key ~main:`end_ ~gap:8 ~style_class:"ui__alert-dialog-footer"
    children


(* One day grid for editor calendars and standalone date selection. *)
let calendar_grid ~week_starts_on ~month_label ~day_label ~year ~month ~day ~tab_day ~on_navigate ~on_pick : t =
  let today = Dates.today_journal_day () in
  let cell ~outside y m d =
    let focused = (not outside) && day = Some d in
    let is_today = (y * 10000) + (m * 100) + d = today in
    with_props
      ([
         Prop.font_size "0.875rem";
         Prop.font_weight 400;
         Prop.hover_background
           "var(--lx-gray-03, var(--ls-menu-hover-color, hsl(var(--muted))))";
       ]
      @ if outside then [ Prop.opacity 0.55 ] else [])
      (button
         ~key:(Printf.sprintf "%04d-%02d-%02d" y m d)
         ~style_class:"ui__calendar-day" ~variant:`ghost
         ~accessibility_identifier:
           (Printf.sprintf "calendar-day-%04d-%02d-%02d" y m d)
         ~width:36 ~height:36 ~padding:0 ~corner_radius:6
         ~autofocus:focused
         ~background:
           (if focused then
              "var(--lx-accent-09, var(--ls-link-text-color, \
               hsl(var(--primary))))"
            else if is_today then "var(--lx-calendar-today-background)"
            else "transparent")
         ~foreground:
           (if outside then "var(--lx-gray-07, var(--ls-secondary-text-color))"
            else if focused then "#fff"
            else if is_today then "var(--lx-calendar-today-foreground)"
            else "inherit")
         ~text:(string_of_int d)
         ~label:(day_label ~today:is_today ~year:y ~month:m ~day:d)
         ~data_attrs:
           ([ ("tabindex", if not outside && d=tab_day then "0" else "-1") ]
           @ if focused then [ ("data-focused", "true") ] else [])
         ~on_navigate:(function
           | P.NavigationKey (_,key,shift) ->
               let y,m,d = Dates.calendar_navigate ~week_starts_on ~year:y ~month:m ~day:d ~key ~shift in
               on_navigate y m d
           | _ -> ())
         ~on_press:(fun _ -> on_pick y m d)
         [])
  in
  let days = Dates.days_in_month ~y:year ~m:month in
  let lead = Dates.weekday_offset ~week_starts_on
      (Dates.fields (Dates.make ~year ~month ~day:1 ())).wday in
  let py, pm = if month = 1 then (year - 1, 12) else (year, month - 1) in
  let ny, nm = if month = 12 then (year + 1, 1) else (year, month + 1) in
  let pdays = Dates.days_in_month ~y:py ~m:pm in
  column ~key:"grid" ~gap:4 ~width:276
    ~data_attrs:["role","grid";"aria-label",month_label ~year ~month;
                 "aria-multiselectable","false"]
    (List.init ((lead + days + 6) / 7) (fun week ->
       row ~key:("week-" ^ string_of_int week) ~gap:4
         ~data_attrs:["role","row"]
         (List.init 7 (fun weekday ->
            let d = week * 7 + weekday + 1 - lead in
            let outside,y,m,d =
              if d < 1 then true,py,pm,pdays+d
              else if d > days then true,ny,nm,d-days
              else false,year,month,d
            in
            box ~key:(Printf.sprintf "cell-%04d-%02d-%02d" y m d)
              ~width:36 ~height:36 ~data_attrs:["role","gridcell"]
              [cell ~outside y m d]))))

let calendar_month_names translate =
  Array.map translate Dates.month_keys

let calendar_header ~clear ~previous ~next ~month ~year : t =
 fun context parent ->
  (stack ~key:"calendar-header" ~width:276 ~height:32 ~margin_top:4
    [ row ~key:"navigation" ~width:276 ~height:32 ~main:`end_ ~cross:`center ~gap:4
        ([previous;next] @ Option.to_list clear);
      row ~key:"caption" ~width:(if clear=None then 196 else 156) ~height:32 ~cross:`center ~gap:8
        [month;year] ]) context parent

let calendar_nav_button ~id ~label ~icon ~autofocus ~on_press =
  with_props
    [ Prop.hover_background "var(--lx-gray-03, hsl(var(--muted)))" ]
    (button ~variant:`ghost ~width:36 ~height:32 ~padding:0 ~border_width:1
       ~border_color:"var(--lx-popover-border, hsl(var(--border)))"
       ~corner_radius:6 ~accessibility_identifier:id ~label ~icon ~autofocus ~on_press [])

let calendar ?initial ?(datetime=false) ?(initial_focus_day=false) ?on_clear
    ~week_starts_on ~month_label ~day_label ~translate ~on_pick () : t =
 fun context parent ->
  let initial = Dates.fields (Option.value initial ~default:(Dates.date_now ())) in
  let date =
    Signal.state context.Lui_ui.ui_scheduler
      (initial.year, initial.month, initial.day)
  in
  let month_open = Signal.state context.Lui_ui.ui_scheduler false in
  let day_focused = Signal.state context.Lui_ui.ui_scheduler initial_focus_day in
  let time = Signal.state context.Lui_ui.ui_scheduler
      (Printf.sprintf "%02d:%02d" initial.hours initial.minutes) in
  let buffer = Signal.state context.Lui_ui.ui_scheduler "" in
  let committed = ref None in
  let set_month y m =
    let _, _, d = Signal.get_state date in
    Signal.set day_focused false;
    Signal.set date (y, m, min d (Dates.days_in_month ~y ~m))
  in
  let move delta =
    let y, m, _ = Signal.get_state date in
    let f = Dates.fields (Dates.make ~year:y ~month:(m + delta) ~day:1 ()) in
    set_month f.year f.month
  in
  let time_fields () =
    let value = Signal.get_state time in
    let digit index = value.[index]>='0' && value.[index]<='9' in
    if String.length value=5 && value.[2]=':' && digit 0 && digit 1 && digit 3 && digit 4 then
      match int_of_string_opt (String.sub value 0 2), int_of_string_opt (String.sub value 3 2) with
      | Some hours,Some minutes when hours>=0 && hours<24 && minutes>=0 && minutes<60 -> Some (hours,minutes)
      | _ -> None
    else None
  in
  let commit value =
    let fields=Dates.fields value in
    Signal.set date (fields.year,fields.month,fields.day);
    if datetime then Signal.set time (Printf.sprintf "%02d:%02d" fields.hours fields.minutes);
    Signal.set day_focused true;
    if !committed<>Some value then (committed:=Some value;on_pick value)
  in
  let publish y m d hours minutes =
    commit (Dates.make ~year:y ~month:m ~day:d ~hours ~minutes ())
  in
  let pick y m d =
    let selected = if datetime then time_fields () else Some (0,0) in
    Option.iter (fun (hours,minutes) -> publish y m d hours minutes) selected
  in
  let commit_time () = let y,m,d=Signal.get_state date in pick y m d in
  let submit () =
    let value = String.trim (Signal.get_state buffer) in
    let parsed =
      match String.split_on_char '-' value with
      | [ year; month; day ]
        when String.length year = 4
             && String.length month = 2
             && String.length day = 2 -> (
          match
            ( int_of_string_opt year,
              int_of_string_opt month,
              int_of_string_opt day )
          with
          | Some y, Some m, Some d
            when m >= 1 && m <= 12 && d >= 1 && d <= Dates.days_in_month ~y ~m
            ->
              Some (Dates.make ~year:y ~month:m ~day:d ())
          | _ -> None)
      | _ ->
          Dates.parse value
    in
    Option.iter (fun value ->
      if datetime then commit value
      else let f=Dates.fields value in publish f.year f.month f.day 0 0) parsed
  in
  (with_props
     [ Prop.font_size "0.875rem"; Prop.line_height "1.25rem" ]
     (column ~accessibility_identifier:"date-time-picker" ~width:300 ~gap:8
        [
          column ~style_class:"ui__calendar" ~padding:12 ~gap:16
            [
              calendar_header
                ~clear:(Option.map (fun clear -> calendar_nav_button
                    ~id:"calendar-clear" ~autofocus:false ~label:(translate "ui/delete")
                    ~icon:(`app "trash") ~on_press:(fun _ -> clear ())) on_clear)
                ~previous:(calendar_nav_button ~id:"calendar-prev" ~autofocus:(not initial_focus_day)
                    ~label:(translate "editor.date-picker/previous-month")
                    ~icon:(`app "chevron-left") ~on_press:(fun _ -> move (-1)))
                ~next:(calendar_nav_button ~id:"calendar-next" ~autofocus:false
                    ~label:(translate "editor.date-picker/next-month")
                    ~icon:(`app "chevron-right") ~on_press:(fun _ -> move 1))
                ~month:(column ~min_width:0
                    [
                      button ~variant:`ghost
                        ~accessibility_identifier:"calendar-month" ~width:96
                        ~min_width:0 ~height:32 ~main:`start
                        ~text_alignment:`start ~padding_horizontal:12
                        ~padding_vertical:0 ~border_width:1
                        ~text:
                          (reactive
                             (fun (_, m, _) ->
                               (calendar_month_names translate).(m - 1))
                             (Signal.value date))
                        ~on_press:(fun _ ->
                          Signal.set month_open
                            (not (Signal.get_state month_open)))
                        [];
                      if_ ~test:(Signal.value month_open)
                        (menu_card ~key:"calendar-months" ~max_height:256
                           ~anchor:`below ~anchor_alignment:`start
                           ~on_dismiss:(fun _ -> Signal.set month_open false)
                           (Array.to_list
                              (Array.mapi
                                 (fun index name ->
                                   menu_item_chrome
                                     (menu_item ~text:name
                                        ~on_press:(fun _ ->
                                          let y, _, _ = Signal.get_state date in
                                          set_month y (index + 1);
                                          Signal.set month_open false)
                                        []))
                                 (calendar_month_names translate))));
                    ])
                ~year:(input ~accessibility_identifier:"calendar-year" ~width:52
                    ~height:32 ~padding_horizontal:8 ~padding_vertical:0
                    ~text:
                      (reactive
                         (fun (y, _, _) -> string_of_int y)
                         (Signal.value date))
                    ~on_input:(function
                      | P.TextChanged (_, value) -> (
                          match int_of_string_opt value with
                          | Some y when y >= 1000 && y <= 9999 ->
                              let _, m, _ = Signal.get_state date in
                              set_month y m
                          | _ -> ())
                      | _ -> ())
                    []);
              reactive
                (fun (year, month, d) focused ->
                  calendar_grid ~week_starts_on ~month_label ~day_label ~year ~month ~day:(if focused then Some d else None)
                    ~tab_day:d ~on_navigate:(fun y m d ->
                      Signal.set date (y,m,d);
                      Signal.set day_focused true)
                    ~on_pick:pick)
                (Signal.value date) (Signal.value day_focused);
            ];
          column ~padding_horizontal:12 ~gap:12
            ((if datetime then
              [row ~key:"calendar-time" ~cross:`center ~gap:8
                [input ~kind:`time ~accessibility_identifier:"calendar-time-input"
                   ~label:(translate "ui.calendar/time-label") ~height:32 ~width:112
                   ~padding_horizontal:12 ~padding_vertical:0 ~submit_on_blur:true
                   ~text:(reactive Fun.id (Signal.value time))
                   ~on_input:(function P.TextChanged (_,value) -> Signal.set time value | _ -> ())
                   ~on_submit:(fun _ -> commit_time ()) [];
                 button ~variant:`ghost ~size:`sm ~grow:1. ~height:32 ~padding:0
                   ~foreground:"hsl(var(--muted-foreground))"
                   ~text:(translate "ui/use-current-time")
                   ~accessibility_identifier:"calendar-current-time"
                   ~on_press:(fun _ ->
                     let now=Dates.fields (Dates.date_now ()) in
                     Signal.set time (Printf.sprintf "%02d:%02d" now.hours now.minutes);
                     let y,m,d=Signal.get_state date in
                     publish y m d now.hours now.minutes) []]] else []) @ [
              input ~accessibility_identifier:"calendar-date-input" ~height:40
                ~margin_bottom:12
                ~placeholder:(translate "ui/date-natural-language-placeholder")
                ~on_input:(function
                  | P.TextChanged (_, value) -> Signal.set buffer value
                  | _ -> ())
                ~on_submit:(fun _ -> submit ())
                [];
            ]);
        ]))
    context parent

let date_picker ~week_starts_on ~month_label ~day_label ~translate ~on_pick = calendar ~week_starts_on ~month_label ~day_label ~translate ~on_pick ()
