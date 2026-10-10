(* Shared component recipes — ONE visual spec consumed by both the web
   and gpui renderers (task 4 pilot: the cmdk palette). Recipes emit
   kinds + typed props bound to Ui_theme tokens/var() chains; they own
   the visual spec that used to live in lui-overlay.css and the gpui
   class registrations in logseq_ext.rs.

   Colors are emitted as `var(--lx-*, fallback)` strings — the same
   chains the deleted CSS used, so web resolution is unchanged; gpui
   resolves the names it knows via its css-var/theme-slot table.
   Mode-conditional values (state rings, keycap glow, the dark icon
   override) ride the snapshot `vars` --lx-cmdk-* tokens: their value
   differs per theme mode, so a static string could never express
   both. *)

open Lui_elements
module P = Lui_protocol

let sv v = P.StringValue v
let iv v = P.IntValue v
let fv v = P.FloatValue v

(* Post-mount static binds for props with no constructor argument
   (overflow, shadow, cursor, user-select, font-* on container kinds).
   Same wrap pattern as Ui_parts.pressable. *)
let with_props binds (elem : t) : t =
 fun ctx parent ->
  let node = elem ctx parent in
  ignore (Ui_parts.standard_kind ctx node);
  List.iter
    (fun (prop, value) ->
      match value with
      | P.StringValue s -> Lui_ui.string_property ctx node prop s
      | P.IntValue i -> Lui_ui.int_property ctx node prop i
      | P.FloatValue f -> Lui_ui.float_property ctx node prop f
      | P.BoolValue b -> Lui_ui.bool_property ctx node prop b)
    binds;
  node

(* Post-mount reactive string-prop binds (state channels + cursor on
   the cmdk item rows). *)
let with_signal_props binds (elem : t) : t =
 fun ctx parent ->
  let node = elem ctx parent in
  ignore (Ui_parts.standard_kind ctx node);
  List.iter
    (fun (prop, source) ->
      Lui_ui.string_property_signal ctx node prop source)
    binds;
  node

(* -- cmdk frame ------------------------------------------------------ *)

(* Rounded clip column inside the dialog host; the host keeps
   placement via .ls-dialog-cmdk. *)
let cmdk_modal ~key children =
  with_props [ P.Overflow, sv "hidden" ]
    (column ~key ~gap:0 ~cross:`stretch ~corner_radius:8
       ~style_class:"cp__cmdk__modal" children)

(* Palette body — data-keep-selection is a closest() contract
   (container.cljs + selection_bar.ml); position:relative anchors
   overlay children like the tooltip arrow. *)
let cmdk_palette ~key ~sidebar children =
  with_props
    [ P.Position, sv "relative"; P.UserSelect, sv "none" ]
    (column ~key ~style_class:"cp__cmdk" ~cross:`stretch ~grow:1.
       ~corner_radius:(if sidebar then 0 else 8)
       ~foreground:"var(--lx-gray-12, var(--rx-gray-12))"
       ~data_attrs:[ "data-keep-selection", "true" ]
       children)

(* 54px input band; the bottom hairline is an inset shadow so the row
   keeps its full 54px of content (border-box would eat 1px). *)
let cmdk_input_row ~key children =
  with_props
    [ ( P.Shadow
      , sv
          "inset 0 -1px 0 0 var(--lx-gray-05, var(--ls-border-color, \
           hsl(var(--border))))" )
    ]
    (row ~key ~style_class:"cp__cmdk-input-row" ~cross:`center ~gap:8
       ~height:54 ~background:"var(--lx-gray-02, #f8f8f8)" children)

let cmdk_search_input ~key ?placeholder ~text ~on_input () =
  with_props
    [ P.FontSize, sv "var(--lx-text-input)"
    ; P.LineHeight, sv "1.75rem"
    ; P.BorderWidth, iv 0
    ; P.FocusShadow, sv "none"
    ]
    ((* .lui-input ships h-10 + :focus-visible ring-2 that no typed prop
        reaches (the channel lands on --lui-focus-shadow, consumed only
        by a zero-specificity :where rule the kind rule beats). The
        documented escape hatch is the data-attrs style pair — merged
        per declaration, so it composes with the emitted style attr. *)
     input ~key ~style_class:"cp__cmdk-search-input" ~grow:1.
       ~data_attrs:
         [ ("style", "box-shadow: none; outline: none; height: auto; \
                      min-height: 0") ]
       ~min_width:256 ~padding:12 ~background:"transparent"
       ~foreground:
         "var(--lx-gray-12, var(--ls-primary-text-color, \
          var(--lui-c-foreground)))"
       ?placeholder ~text ~on_input [])

(* Results scroller — viewport-bounded like the cljs 65dvh block; the
   56px bottom pad scrolls the last row clear of the hints bar (a
   trailing spacer — scroll has no bottom-only padding prop). *)
let cmdk_scroller ~key children =
  with_props
    [ P.MinHeightViewport, fv 0.65; P.MaxHeightViewport, fv 0.65 ]
    (scroll ~key ~orientation:`vertical ~style_class:"cp__cmdk-scroller"
       (children @ [ spacer ~key:"scrollpad" ~height:56 ~width:1 [] ]))

(* -- cmdk groups ----------------------------------------------------- *)

(* Group frame: the bottom hairline is a real child (a 1px stretch box),
   skipped on the last group — same visual as the deleted border-bottom
   rule. *)
let cmdk_group_hairline ~key : t =
  box ~key ~height:1
    ~background:
      "var(--lx-gray-06, var(--ls-border-color, hsl(var(--border))))"
    []

let cmdk_group ~key ~kind ~last ~pad children =
  column ~key ~style_class:"cp__cmdk-group" ~cross:`stretch ~gap:0
    ~data_attrs:[ "data-cmdk-group-kind", kind ]
    (children
    @ [ spacer ~key:"gpad" ~height:pad []
      ; if_
          ~test:(Signal.map not last)
          (cmdk_group_hairline ~key:"gline")
      ])

(* 32px header row: title toggles more/less, count is a small label,
   the "show more" link fades in on hover (its own hover channel). *)
let cmdk_group_header ~key children =
  with_props
    [ P.FontSize, sv "var(--lx-text-header)"; P.LineHeight, sv "16px" ]
    (row ~key ~style_class:"cp__cmdk-group-header" ~cross:`center
       ~main:`space_between ~gap:8 ~height:32 ~padding_horizontal:12
       ~background:
         "var(--lx-gray-02, var(--ls-secondary-background-color, \
          hsl(var(--muted))))"
       ~foreground:
         "var(--lx-gray-11, var(--ls-secondary-text-color, \
          var(--muted-foreground)))"
       children)

(* 2px left inset without a pad — the leading spacer keeps the count's
   position pixel-identical (a left-only padding prop does not exist). *)
let cmdk_group_title ~key ~value ~on_press : t =
  row ~key ~gap:0
    [ spacer ~key:"i" ~width:2 ~height:1 []
    ; with_props [ P.UserSelect, sv "none"; P.Cursor, sv "pointer" ]
        (text ~key:"t" ~style_class:"cp__cmdk-group-title" ~font_weight:700
           ~value ~on_press [])
    ]

let cmdk_group_count ~key ~value : t =
  row ~key ~gap:0
    [ spacer ~key:"i" ~width:6 ~height:1 []
    ; text ~key:"t" ~style_class:"cp__cmdk-group-count"
        ~font_size:"0.7rem" ~corner_radius:9999 ~value []
    ]

let cmdk_group_more ~key ~on_press children : t =
  Ui_parts.pressable ~on_press
    (with_props
       [ P.Opacity, fv 0.5
       ; P.HoverOpacity, fv 0.9
       ; P.UserSelect, sv "none"
       ; P.Cursor, sv "pointer"
       ]
       (row ~key ~style_class:"cp__cmdk-group-more"
          [ row ~key:"i" ~style_class:"cp__cmdk-group-more-inner"
              ~cross:`center ~gap:4 children ]))

(* -- cmdk items ------------------------------------------------------ *)

(* Item row: rounded token-typed column + state-channel props the view
   binds to item signals (background/hover ring/kb shadow/cursor). The
   [data-cmdk-item] hooks are attrs only — the old cp__cmdk-item class
   dual-track is gone. The header's -4px pull becomes a relative inset
   on the header row — same pixels as the deleted negative margin. *)
let cmdk_item_row ~key ~data_attrs ~background ~shadow ~hover_background
    ~hover_ring ~cursor ~header ~main : t =
  let children =
    (match header with Some h -> [ h ] | None -> [])
    @ [ main ]
  in
  with_signal_props
    [ P.Shadow, shadow
    ; P.HoverBackground, hover_background
    ; P.HoverShadow, hover_ring
    ; P.Cursor, cursor
    ]
    (with_props
       [ P.FontSize, sv "var(--lx-text-row)"; P.LineHeight, sv "1.25rem" ]
       (column ~key ~gap:2 ~cross:`stretch ~padding_vertical:6
          ~padding_horizontal:12 ~corner_radius:8
          ~data_attrs_signal:data_attrs
          ~background_signal:background children))

(* Breadcrumb header inside an item row — 32px left inset, small light
   type, single-line ellipsis. *)
let cmdk_item_header ~key children =
  with_props
    [ P.FontSize, sv "var(--lx-text-header)"
    ; P.FontWeight, iv 300
    ; P.LineHeight, sv "16px"
    ; P.Overflow, sv "hidden"
    ; P.Position, sv "relative"
    ; P.InsetTop, fv (-4.)
    ]
    (row ~key ~style_class:"breadcrumb cmdk-item-header" ~cross:`center
       ~gap:8 ~min_width:0
       ~data_attrs:
         [ (* WhiteSpace/TextOverflow are text-kind props — on a row the
              only channel is the documented data-attrs style pair. *)
           ("style", "white-space: nowrap; text-overflow: ellipsis") ]
       ~foreground:
         "var(--lx-gray-11, var(--ls-secondary-text-color, \
          var(--muted-foreground)))"
       (spacer ~key:"i" ~width:32 ~height:1 [] :: children))

let cmdk_item_main ~key children =
  row ~key ~style_class:"cmdk-item-main" ~cross:`start ~gap:12 children

(* 16x20 rounded icon chip; the glyph color is a mode token (white in
   dark like the deleted .dark rule). *)
let cmdk_icon_chip ~key children =
  row ~key ~style_class:"cmdk-item-icon" ~main:`center ~cross:`center
    ~width:16 ~height:20 ~corner_radius:4
    ~background:
      "var(--lx-gray-05, var(--ls-tertiary-background-color, \
       hsl(var(--muted))))"
    ~foreground:"var(--lx-cmdk-icon-fg)" children

let cmdk_item_body ~key children =
  column ~key ~style_class:"cmdk-item-body" ~grow:1. ~min_width:0
    ~cross:`stretch children

let cmdk_main_text ~key children =
  with_props [ P.FontWeight, iv 500; P.Overflow, sv "hidden" ]
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
  with_props [ P.FontSize, sv "var(--lx-text-header)" ]
    (row ~key ~style_class:"cp__cmdk-item-info" ~cross:`center ~gap:0
       ~min_width:0
       ~foreground:
         "var(--lx-gray-11, var(--ls-secondary-text-color, \
          var(--muted-foreground)))"
       children)

let cmdk_badge ~key ~value : t =
  text ~key ~as_:`Span ~style_class:"cp__cmdk-current-page-badge"
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
       [ ( P.BackgroundValue
         , sv "var(--lx-gray-06-alpha, var(--rx-gray-06-alpha))" )
       ; P.CornerRadius, iv 4
       ]
       @
       (* glow replaces the 1px border (.shui-shortcut-*.shui-shortcut-glow
          kbd{box-shadow:…;border:none}) *)
       if glow then
         [ ( P.Shadow
           , sv
               "var(--kbd-glow-top) 0px 1px 0px 0px inset, \
                var(--kbd-glow-bottom) 0px -1px 0px 0px inset" )
         ]
       else
         [ P.BorderWidth, iv 1
         ; ( P.BorderColorValue
           , sv "var(--lx-gray-06-alpha, var(--rx-gray-06-alpha))" )
         ]
     else [])
  in
  with_props binds
    (row ~key ~main:`center ~cross:`center
       ?height:(if boxed then Some 20 else None)
       ?min_width:(if min_slot > 0 then Some min_slot else None)
       ?padding_horizontal:(if boxed then Some 4 else None)
       ~foreground:"var(--lx-gray-12, var(--rx-gray-12))"
       [ with_props
           [ P.FontSize, sv "var(--lx-text-header)"
           ; P.FontWeight, iv 400
           ; P.LineHeight, sv "16px"
           ; P.LetterSpacing, fv (-0.5)
           ; P.WhiteSpace, sv "nowrap"
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
   props below carry identical values for gpui, not a second paint. *)
let shortcut_combo ~key ~glow children : t =
  with_props
    ([ ( P.BackgroundValue
       , sv "var(--lx-gray-06-alpha, var(--rx-gray-06-alpha))" )
     ; P.CornerRadius, iv 4
     ]
     @
     if glow then
       [ P.BorderWidth, iv 0
       ; ( P.Shadow
         , sv
             "var(--kbd-glow-top) 0px 1px 0px 0px inset, \
              var(--kbd-glow-bottom) 0px -1px 0px 0px inset" )
       ]
     else
       [ P.BorderWidth, iv 1
       ; ( P.BorderColorValue
         , sv "var(--lx-gray-06-alpha, var(--rx-gray-06-alpha))" )
       ])
    (row ~key ~style_class:"shui-shortcut-combo" ~cross:`stretch
       ~gap:0 children)

(* Separate: transparent container; the glow lives on each boxed key,
   matching .shui-shortcut-separate.shui-shortcut-glow kbd (no container
   shadow in the original CSS). *)
let shortcut_separate ~key ~glow:_ children : t =
  row ~key ~style_class:"shui-shortcut-separate" ~cross:`center ~gap:4
    children

let shortcut_chord ~key children : t =
  row ~key ~style_class:"shui-shortcut-chord" ~cross:`center ~gap:8
    children

(* "then" separator between chord groups — 10px at 45% opacity like
   cljs shui-shortcut-chord-sep. *)
let chord_separator ~key : t =
  with_props [ P.Opacity, fv 0.45 ]
    (text ~key ~style_class:"shui-shortcut-chord-sep" ~font_size:"0.625rem"
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
let shortcut_slot ~key ~opacity children : t =
  row ~key ~style_class:"shui-shortcut-row" ~cross:`center ~gap:4
    ~height:20 ~min_height:20 ~max_height:20 ~opacity_signal:opacity
    [ with_props [ P.Overflow, sv "hidden" ]
        (box ~key:"sc-cells" ~height:20 ~max_height:20 children) ]

(* -- cmdk hints bar --------------------------------------------------- *)

(* 45px footer band; the top hairline is an inset shadow like the input
   row's bottom one. *)
let cmdk_hints_bar ~key children =
  with_props
    [ ( P.Shadow
      , sv
          "inset 0 1px 0 0 var(--lx-gray-05, var(--ls-border-color, \
           hsl(var(--border))))" )
    ]
    (row ~key ~style_class:"hints" ~main:`space_between ~cross:`center
       ~gap:8 ~min_height:45 ~padding_vertical:8 ~padding_horizontal:12
       ~background:
         "var(--lx-gray-03, var(--ls-tertiary-background-color, \
          hsl(var(--muted))))"
       children)

let cmdk_hints_inner ~key children =
  with_props
    [ P.FontSize, sv "var(--lx-text-row)"; P.LineHeight, sv "1.5rem" ]
    (box ~key ~style_class:"cp__cmdk-hints-inner" ~padding_horizontal:6
       children)

let cmdk_hints_row ~key children =
  row ~key ~style_class:"cp__cmdk-hints-row" ~cross:`center ~gap:4
    children

let cmdk_hints_label ~key ~value : t =
  text ~key ~style_class:"cp__cmdk-hints-label" ~font_weight:500 ~value
    ~foreground:
      "var(--lx-gray-12, var(--ls-primary-text-color, \
       var(--lui-c-foreground)))"
    []

(* The tip line brightens on hover (own hover channel). *)
let cmdk_tip ~key children : t =
  with_props [ P.Opacity, fv 0.5; P.HoverOpacity, fv 1.0 ]
    (row ~key ~style_class:"cp__cmdk-tip" ~cross:`center ~gap:4 children)

(* Right-aligned action hints group — the -6px bleed-out under the bar's
   6px pad becomes a relative inset like the item header's. *)
let cmdk_hints_group ~key children : t =
  with_props [ P.Position, sv "relative"; P.InsetRight, fv (-6.) ]
    (row ~key ~style_class:"cp__cmdk-hints" ~cross:`center ~gap:8
       children)

(* Flat 28px hint button — dims to 0.8 on hover via its own channel. *)
let cmdk_hint_button ~key ~label ~on_press children : t =
  with_props
    [ P.FontSize, sv "var(--lx-text-header)"
    ; P.Opacity, fv 0.4
    ; P.HoverOpacity, fv 0.8
    ; P.Cursor, sv "pointer"
    ]
    (button ~key ~label ~on_press ~height:28 ~min_height:28 ~padding:0
       ~style_class:"cp__cmdk-hint" ~background:"transparent"
       ~border_width:0
       ~foreground:
         "var(--lx-gray-11, var(--ls-secondary-text-color, \
          var(--muted-foreground)))"
       [ row ~key:"inner" ~cross:`center ~gap:6 children ])

(* -- cmdk misc -------------------------------------------------------- *)

(* "Search only: <group>" filter chip. *)
let cmdk_search_only ~key children : t =
  with_props
    [ P.FontSize, sv "var(--lx-text-header)"
    ; P.FontWeight, iv 500
    ; P.LineHeight, sv "1rem"
    ]
    (column ~key ~style_class:"cp__cmdk-search-only" ~opacity:0.7
       ~padding_vertical:4 ~padding_horizontal:12 children)

let cmdk_search_only_row ~key children : t =
  row ~key ~style_class:"cp__cmdk-search-only-row" ~cross:`center ~gap:4
    children

(* 4px left inset via leading spacer (see group_title). *)
let cmdk_search_only_name ~key ~value : t =
  row ~key ~gap:0
    [ spacer ~key:"i" ~width:4 ~height:1 []
    ; text ~key:"t" ~style_class:"cp__cmdk-search-only-name"
        ~font_weight:500 ~value []
    ]

let cmdk_search_only_clear ~key ~label ~on_press : t =
  with_props [ P.Cursor, sv "pointer" ]
    (button ~key ~icon:`x ~size:`icon ~label ~on_press
       ~style_class:"cp__cmdk-search-only-clear" ~background:"transparent"
       ~border_width:0 ~padding:4 [])

let cmdk_empty ~key children : t =
  box ~key ~style_class:"cp__cmdk-empty" ~padding:16 ~opacity:0.5
    children

(* -- tooltip ---------------------------------------------------------- *)

(* Popover surface — hsl() chains stay web-only (gpui leaves them
   unresolved: documented leftover). The fade-in animation and the
   rotated arrow transform remain CSS deco rules; pointer-events stays
   off so the bubble never steals hover from its own trigger. *)
let tooltip_content ~key ~at ~arrow_x ~above children : t =
  with_props
    [ P.FontSize, sv "0.75rem"
    ; P.LineHeight, sv "16px"
    ; P.ZIndex, iv 50
    ; P.PointerEnabled, P.BoolValue false
    ; ( P.Shadow
      , sv
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / \
           0.1)" )
    ]
    (popover ~key ~accessibility_identifier:"lui-tooltip" ~at
       ~style_class:"ui__tooltip-content ls-tooltip" ~gap:6 ~cross:`center
       ~data_attrs:[ "role", "tooltip" ]
       ~padding_horizontal:12 ~padding_vertical:6 ~max_width:320
       ~corner_radius:6 ~border_width:1
       ~border_color:"var(--lui-c-border)" ~background:"hsl(var(--popover))"
       ~foreground:"hsl(var(--popover-foreground))"
       (children
       @ [ with_props
             ([ P.Position, sv "absolute"
              ; P.PointerEnabled, P.BoolValue false
              ; P.InsetLeft, fv arrow_x
              ]
             @ if above then [ P.InsetBottom, fv (-4.) ]
               else [ P.InsetTop, fv (-4.) ])
             (box ~key:"arrow" ~style_class:"ui__tooltip-arrow" ~width:8
                ~height:8 ~border_width:1
                ~border_color:"hsl(var(--border))"
                ~background:"hsl(var(--popover))" [])
         ]))

let ls_tooltip_col ~key children : t =
  column ~key ~style_class:"ls-tooltip-col" ~cross:`start ~gap:4 children

let ls_tooltip_keys ~key children : t =
  with_props [ P.Opacity, fv 0.8 ]
    (row ~key ~style_class:"ls-tooltip-keys" ~cross:`center ~gap:1
       children)

(* -- menus & overlays -------------------------------------------------- *)

(* The lui-overlay .ui__dropdown-menu-content/.ui__select-content card
   spec as props — migrated dropdown/select popups carry this chrome so
   the compat class can be dropped. [cls] keeps app-semantic hooks. *)
let menu_card ~key ?(cls = "") ~anchor ~anchor_alignment ~on_dismiss
    items : t =
  with_props
    [ ( P.Shadow
      , sv "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / \
           0.1)" )
    ; P.FontSize, sv "0.875rem" ]
    (dropdown_menu ~key ~anchor ~anchor_alignment ~on_dismiss
       ~min_width:128 ~padding:4
       ~background:"hsl(var(--popover))"
       ~border_color:"var(--lui-c-border)" ~border_width:1
       ~corner_radius:6 ~style_class:cls items)

(* Same chrome on a popover surface — for anchored popups whose children
   are not menu rows (dropdown_menu rejects non-menu children). *)
let popover_card ~key ?(cls = "") ~anchor ~anchor_alignment ~on_dismiss
    children : t =
  with_props
    [ ( P.Shadow
      , sv "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / \
           0.1)" ) ]
    (popover ~key ~anchor ~anchor_alignment ~on_dismiss
       ~min_width:128 ~padding:4
       ~background:"hsl(var(--popover))"
       ~border_color:"var(--lui-c-border)" ~border_width:1
       ~corner_radius:6 ~style_class:cls children)

(* Floating dialog close — the .ui__dialog-close spec (absolute
   top-right, 16px ghost icon, hover/focus opacity) as props. Mounts
   inside .lui-dialog-body; the fixed-positioned .lui-dialog section is
   the containing block. *)
let dialog_close ~key ~label ~on_press : t =
  with_props
    [ P.Position, sv "absolute"
    ; P.InsetTop, fv 16.
    ; P.InsetRight, fv 16.
    ; P.Opacity, fv 0.7
    ; P.HoverOpacity, fv 1. ]
    (button ~key ~variant:`ghost ~size:`icon ~width:16 ~height:16
       ~corner_radius:4 ~icon:`x ~label ~on_press [])
