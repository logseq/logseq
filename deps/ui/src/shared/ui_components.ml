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
       ~foreground:"var(--lx-gray-12, var(--ls-primary-text-color, var(--rx-gray-12)))"
       ~data_attrs:[ "data-keep-selection", "true" ]
       children)

(* 54px input band; the bottom hairline is an inset shadow so the row
   keeps its full 54px of content (border-box would eat 1px). *)
let cmdk_input_row ~key children =
  with_props
    [ ( P.Shadow
      , sv
          "inset 0 -1px 0 0 var(--ls-border-color, \
           hsl(var(--border)))" )
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
         [ (* prod input sits 1px inset inside the 54px row *)
           ("style", "box-shadow: none; outline: none; height: auto; \
                      min-height: 0; margin: 1px") ]
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
    ((* prod scroller sits on gray-02 (#f8f8f8 / #023643 dark), measured
        off the .search-results parent *)
     scroll ~key ~orientation:`vertical ~style_class:"cp__cmdk-scroller"
       ~background:"var(--lx-gray-02, var(--rx-gray-02, #f8f8f8))"
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
  column ~key ~cross:`stretch ~gap:0
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
    ; text ~key:"t"
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
       (row ~key
          [ row ~key:"i"
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
    (row ~key ~style_class:"breadcrumb" ~cross:`center
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
  row ~key ~cross:`start ~gap:12 children

(* 16x20 rounded icon chip; the glyph
   color is a mode token (white in dark like the deleted .dark rule). *)
let cmdk_icon_chip ~key children =
  row ~key ~style_class:"cmdk-item-icon" ~main:`center ~cross:`center
    ~width:16 ~height:20 ~corner_radius:4
    ~background:
      "var(--lx-gray-05, var(--ls-tertiary-background-color, \
       hsl(var(--muted))))"
    ~foreground:"var(--lx-cmdk-icon-fg)" children

let cmdk_item_body ~key children =
  column ~key ~grow:1. ~min_width:0
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
  row ~key ~cross:`center ~gap:8
    children

(* "then" separator between chord groups — 10px at 45% opacity like
   cljs shui-shortcut-chord-sep. *)
let chord_separator ~key : t =
  with_props [ P.Opacity, fv 0.45 ]
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

(* prod .text-sm.leading-6 tip container: no extra horizontal pad,
   4px of vertical pad around the 24px line *)
let cmdk_hints_inner ~key children =
  with_props
    [ P.FontSize, sv "var(--lx-text-row)"; P.LineHeight, sv "1.5rem" ]
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
  with_props [ P.Opacity, fv 0.5; P.HoverOpacity, fv 1.0 ]
    (row ~key ~cross:`center ~gap:4 children)

(* Right-aligned action hints group — the -6px bleed-out under the bar's
   6px pad becomes a relative inset like the item header's. *)
let cmdk_hints_group ~key children : t =
  with_props [ P.Position, sv "relative"; P.InsetRight, fv (-6.) ]
    (row ~key ~cross:`center ~gap:8
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
  with_props [ P.Cursor, sv "pointer" ]
    (button ~key ~icon:`x ~size:`icon ~label ~on_press
       ~background:"transparent"
       ~border_width:0 ~padding:4 [])

let cmdk_empty ~key children : t =
  box ~key ~padding:16 ~opacity:0.5
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
       ~style_class:"ui__tooltip-content" ~gap:6 ~cross:`center
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
  column ~key ~cross:`start ~gap:4 children

let ls_tooltip_keys ~key children : t =
  with_props [ P.Opacity, fv 0.8 ]
    (row ~key ~cross:`center ~gap:1
       children)

(* -- settings & properties recipes (task 5) ----------------------------- *)

(* `.it` form row — the deleted `sm:grid-cols-3` rules become flex
   growth: label cell 1/3, control cell 2/3 (the `>:nth-child(2):last-child`
   span-2 when no side slot); each `side` slot is its own third. Every
   cljs `.it` carries `sm:items-start`, so cells top-align. The <640px
   stacked variant is a documented leftover (no breakpoint channel). *)
let form_row ~key ~label ?(label_extra = []) ?desc ?(side = [])
    ?(col_gap = 24) ~control () : t =
  (* cljs .it is sm:grid sm:grid-cols-3 sm:gap-4: exact 1/3 + 2/3
     columns — flex-grow with auto bases drifts with content width, so
     the cells carry explicit zero-basis flex ratios. .its nested inside
     another wrapper keep sm:gap-4 (16px) — e.g. the accent row *)
  let third =
    Printf.sprintf "calc((100%% - %dpx) / 3)" (2 * col_gap)
  in
  row ~key ~style_class:"it" ~gap:col_gap ~min_width:0 ~cross:`start
    ([ column ~key:(key ^ "-lc") ~min_width:0 ~cross:`stretch
         ~gap:0
         ~data_attrs:
           [ "style"
           , Printf.sprintf "flex: 0 0 %s; min-width: 0" third ]
         ([ row ~key:(key ^ "-l") ~cross:`center ~gap:0 ~min_height:28
              (label :: label_extra) ]
          @ match desc with Some d -> [ d ] | None -> [])
     ; row ~key:(key ^ "-rc") ~min_width:0 ~cross:`center ~gap:16
         ~data_attrs:
           [ "style"
           , Printf.sprintf "flex: %s; min-width: 0"
               (if side = [] then "1 1 0"
                else "0 0 " ^ third) ]
         [ control ] ]
    @ List.mapi
        (fun i s ->
          box ~key:(key ^ "-s" ^ string_of_int i) ~min_width:0
            ~data_attrs:
              [ "style"
              , Printf.sprintf "flex: 0 0 %s; min-width: 0" third ]
            [ s ])
        side)

(* `.ls-label`/`.it-label` — 14px medium, 28px line, 70% opacity.
   Inside a flex-col label cell cljs uses leading-5 (20px). *)
let form_label ~key ?(line_height = "1.75rem") ?text_signal ~text () : t =
  with_props
    [ P.FontSize, sv "0.875rem"
    ; P.FontWeight, iv 500
    ; P.LineHeight, sv line_height
    ; P.Opacity, fv 0.7
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
       var(--muted-foreground)))"
    []

(* Leading-icon search field — the `.search-ctls`/`.search-input-wrap`/
   `.search-input` pattern: the row anchors an absolutely-positioned
   icon; its unset top falls back to the flex static position
   (`cross:`center` → vertically centered). `pad_left` clears the icon —
   per-side padding has no prop, the documented channel is the
   data-attrs style pair. `borderless` kills the `.lui-search-field`
   border+ring (icon-picker's gray-03 input). *)
let search_row ~key ?(height = 26) ?(font_size = "0.8125rem")
    ?(pad_left = 28) ?background ?(borderless = false) ?(trailing = [])
    ?autofocus ~placeholder ~text_signal:text ~on_input () : t =
  with_props [ P.Position, sv "relative" ]
    (row ~key ~cross:`center ~gap:0
       ~min_width:0
       ([ with_props
            [ P.Position, sv "absolute"
            ; P.InsetLeft, fv (if pad_left >= 32 then 10. else 8.)
            ; P.Opacity, fv 0.5
            ; P.PointerEnabled, P.BoolValue false
            ]
            (box ~key:"ic" [ icon ~key:"i" ~name:`search ~size:`sm [] ])
        ; with_props
            ([ P.FontSize, sv font_size ]
            @
            if borderless then
              [ P.BorderWidth, iv 0; P.FocusShadow, sv "none" ]
            else [])
            (search_field ~key:"in" ~grow:1. ~min_width:0 ~height
               ?background ~placeholder ?autofocus ~text_signal:text
               ~data_attrs:
                 [ ( "style"
                   , "padding-left: " ^ string_of_int pad_left ^ "px" )
                 ]
               ~on_input [])
        ]
       @ trailing))

(* Settings nav item — `.settings-menu-item` visual spec: 6/8px padding,
   4px radius, 14px/20px type; hover and active paint ride the
   `--lx-nav-active` mode token (black 10% light / white 8% dark —
   replaces the `.active`/`.dark .active` pair). The `.active` class
   itself stays on the element via the caller's class_signal (gpui
   hook). *)
let nav_item ~key ~data_id ~icon ~text ~selected_signal:selected
    ~on_press () : t =
  with_props [ P.HoverBackground, sv "var(--lx-nav-active)" ]
    (with_props
       [ P.FontSize, sv "0.875rem"; P.LineHeight, sv "1.25rem" ]
       (list_item ~key ~icon ~text ~corner_radius:4 ~min_height:0
          ~padding_vertical:6 ~padding_horizontal:8 ~main:`start
          ~foreground:"inherit"
          ~style_class:"settings-menu-item"
          ~accessibility_identifier:data_id
          ~data_attrs:[ "data-id", data_id; "style", "gap:0" ]
          ~background_signal:
            (Signal.map
               (fun a ->
                 if a then "var(--lx-nav-active)" else "transparent")
               selected)
          ~selected_signal:selected ~on_press []))

(* Pill/chip toggle — the `.shortcut-filter-pill` (9999 bordered) and
   `.secondary-tabs > button` (6px radius, 4/12 padding) shapes share one
   recipe: ghost toggle_button, checked = gray-04 fill + full opacity.
   `radius`/`pad_v`/`pad_h`/`font_size` select the variant. The kind has
   no background/opacity signal channels, so the paint rides a reactive
   rebuild on `checked`. *)
let chip_toggle ~key ~radius ~pad_v ~pad_h ~font_size ~text
    ~checked_signal:checked ?(off_opacity = 0.7) ~on_toggle () : t =
  reactive ~equal:( = ) (fun c ->
    with_props
      [ P.Cursor, sv "pointer"
      ; P.FontSize, sv font_size
      ; P.Opacity, fv (if c then 1. else off_opacity)
      ; P.HoverOpacity, fv 1.
      ]
      (toggle_button ~key ~variant:`ghost ~text ~checked:c ~on_toggle
         ~min_height:0 ~height:(pad_v * 2 + 14) ~padding_vertical:pad_v
         ~padding_horizontal:pad_h ~corner_radius:radius ~border_width:1
         ~border_color:
           "var(--lx-gray-06, var(--ls-border-color, hsl(var(--border))))"
         ~background:
           (if c then
              "var(--lx-gray-04, var(--ls-tertiary-background-color, \
               hsl(var(--muted))))"
            else "transparent")
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
    ([ P.Cursor, sv "pointer"; P.Opacity, fv opacity ]
    @
    match hover_opacity with
    | Some o -> [ P.HoverOpacity, fv o ]
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
   gpui/web hook; visuals ride typed props. *)
let property_pill ~key children : t =
  with_props
    [ ( P.Shadow
      , sv "inset 0 0 0 1px var(--lx-gray-06, var(--ls-border-color))" )
    ; P.FontSize, sv "0.875rem"
    ; P.LineHeight, sv "20px"
    ; P.Overflow, sv "hidden"
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
  with_props [ P.Position, sv "relative" ]
    (card ~key ~style_class:("cp__plugins-item-card" ^ classes)
       ~corner_radius:8 ~padding:12 ~min_width:256 ~border_width:1
       ~border_color:
         "var(--lx-gray-06, var(--ls-border-color, hsl(var(--border))))"
       ~data_attrs:[ "style", "width:calc(50% - 0.5rem);box-sizing:border-box" ]
       [ child ])

(* Theme-mode option card — the `.cp__theme-modes-options > li` spec:
   92px thumbnail (`i.mode-*`) over a centered 12px label, `.9` opacity
   until hover/active, selected thumbnail ring = inset 2px link color.
   list_item keeps the `selected` prop + kind hooks; the active ring
   rides the thumbnail's shadow signal. Per-side pads ride the
   documented data-attrs style pair. *)
let option_card ~key ~mode ~image_url ~label ~selected_signal:selected
    ~on_press () : t =
  with_props
    [ P.HoverOpacity, fv 1.; P.Cursor, sv "pointer"; P.Opacity, fv 0.9 ]
    (list_item ~key ~on_press ~selected_signal:selected
       ~min_height:0 ~width:100 ~padding_vertical:0 ~padding_horizontal:0
       (* cljs li: <i> thumbnail 92x63 on top, <strong> label centered
          below — column keeps the label under the image instead of
          beside it; cljs li has no padding, i and strong are flush *)
       [ column ~key:"c" ~cross:`start ~gap:0
           [ Ui_parts.class_signal selected
               (fun s -> "mode-" ^ mode ^ if s then " mode-active" else "")
               (image ~key:"i" ~url:image_url ~alt:label ~width:92
                  ~height:63 ~corner_radius:4
                  ~data_attrs:
                    [ "style", "height:63.25px;object-fit:cover" ]
                  ~background:"var(--lx-gray-04, hsl(var(--muted)))" [])
           ; text ~key:"t" ~font_size:"0.75rem" ~font_weight:500
               ~line_height:"1rem" ~value:label ~text_alignment:`center
               ~data_attrs:
                 [ "style"
                 , "width:92px;height:22px;line-height:16px;padding-top:3px" ]
               []
           ]
       ])

(* -- menus & overlays -------------------------------------------------- *)

(* The lui-overlay .ui__dropdown-menu-content/.ui__select-content card
   spec as props — migrated dropdown/select popups carry this chrome so
   the compat class can be dropped. [cls] keeps app-semantic hooks. *)
let menu_card ~key ?(cls = "") ~anchor ~anchor_alignment ~on_dismiss
    ?(data_attrs = []) items : t =
  with_props
    [ ( P.Shadow
      , sv "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / \
           0.1)" )
    ; P.FontSize, sv "0.875rem" ]
    (dropdown_menu ~key ~anchor ~anchor_alignment ~on_dismiss
       ~min_width:128 ~padding:4
       ~background:"hsl(var(--popover))"
       ~border_color:"var(--lui-c-border)" ~border_width:1
       ~corner_radius:6 ~style_class:cls ~data_attrs items)

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

(* Card shadows as with_props binds for ~at-anchored popups (point-
   anchored surfaces can't use the ~anchor recipes above): [card_shadow]
   is the .ui__popover-content/.ui__dropdown-menu-content shadow,
   [sub_card_shadow] the deeper .ui__dropdown-menu-sub-content variant. *)
let card_shadow =
  ( P.Shadow
  , sv "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
  )

let sub_card_shadow =
  ( P.Shadow
  , sv "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / \
        0.1)" )

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
    [ ( P.Shadow
      , sv "0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, \
           0.08)" ) ]
    (box ~key ~style_class:cls ~background:"hsl(var(--popover))"
       ?border_color ?border_width ~corner_radius:6 [ child ])

(* Inline action toolbar — the `toolbar` kind's role=toolbar semantics
   with the .lui-toolbar card chrome flattened, so it reads as the
   plain ghost-icon row it replaces (.view-actions). The kind admits
   only orientation/label/gap/style-class/placement/data-attrs (no
   background/border/pad/opacity), so the chrome reset goes through
   the documented data-attrs style pair and the reveal opacity rides
   a wrapping box (which does take ~opacity_signal). The `toolbar`
   kind requires a non-empty accessibility label or the store rejects
   the whole patch batch.
   Toolbar children are restricted to control kinds (button/input/
   select/text/spacer/divider): mount conditional buttons with [if_]
   (mounts no node when false) and never [box]/[row] wrappers inside. *)
let flat_toolbar ~key ?(cls = "") ?opacity_signal ~label children : t =
  box ~style_class:cls ?opacity_signal ~min_width:0
    [ toolbar ~key ~orientation:`horizontal ~label ~gap:4
        ~data_attrs:
          [ ("style", "background: transparent; border: none; \
                      padding: 0") ]
        children ]

(* -- dialog chrome ------------------------------------------------------

   Typed-prop carriers for the deleted .ui__button.ls-btn /
   .ls-btn-primary dialog paints and the .ui__alert-dialog-* chrome.
   The semantic classes stay on the elements as e2e/imperative hooks;
   the residual stylesheet rules keep only what props can't express
   (backdrop-filter, entry animations, runtime state attrs). *)

(* cljs .ui__button.ls-btn — the neutral card button used in dialog
   footers/bodies. ~variant stays: the kit data-variant paint loses to
   the inline declarations either way, so it only remains a semantic
   attr + gpui fallback. *)
let dialog_btn_neutral ~key ?size ~variant ~text ?(autofocus = false)
    ~on_press =
  with_props
    [ P.FontSize, sv "0.875rem"; P.FontWeight, iv 500
    ; P.Cursor, sv "pointer"; P.HoverBackground, sv "hsl(var(--muted))" ]
    (button ~key ?size ~variant ~text ~autofocus
       ~style_class:"ui__button ls-btn"
       ~corner_radius:6 ~border_width:1
       ~border_color:"var(--lui-c-border)"
       ~background:"var(--ls-primary-background-color, var(--lui-c-background))"
       ~padding_vertical:8 ~padding_horizontal:16
       ~on_press:(fun _ -> on_press ()) [])

(* cljs .ui__button.ls-btn-primary — lx-accent-09 fill + opacity hover. *)
let dialog_btn_primary ~key ?size ~variant ~text ?(autofocus = false)
    ~on_press =
  with_props
    [ P.FontSize, sv "0.875rem"; P.FontWeight, iv 500
    ; P.Cursor, sv "pointer"; P.HoverOpacity, fv 0.9 ]
    (button ~key ?size ~variant ~text ~autofocus
       ~style_class:"ui__button ls-btn-primary"
       ~corner_radius:6 ~border_width:0
       ~background:
         "var(--lx-accent-09, hsl(var(--primary, var(--ls-link-text-color, \
           #0f7b6c))))"
       ~foreground:"#fff" ~height:40 ~padding_horizontal:16
       ~on_press:(fun _ -> on_press ()) [])

(* cljs AlertDialog chrome (shui dialog-confirm!) — shared by
   dialogs_view.confirm_view and the page_menu confirm layers. The card
   is hand-rolled (not the dialog kind) because outside presses must
   NOT dismiss; it rides a cover popover for the scrim + Escape.

   Web keeps position:fixed + left/top/translate centering through the
   documented data-attrs style pair (left:%/transform have no prop);
   gpui anchors absolute children through the parent's flex centering —
   the same mechanism .cp__dialog-shell uses. *)
let alert_dialog_overlay ~key children =
  with_props
    [ P.Position, sv "fixed"; P.Inset, fv 0.; P.ZIndex, iv 999 ]
    (column ~key ~grow:1. ~main:`center ~cross:`center
       ~style_class:"ui__alert-dialog-overlay"
       ~background:
         "color-mix(in oklab, var(--lui-c-background) 80%, transparent)"
       children)

let alert_dialog_content ~key ~data_attrs children =
  with_props
    [ P.Position, sv "fixed"; P.ZIndex, iv 999
    ; ( P.Shadow
      , sv "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px \
            rgb(0 0 0 / 0.1)" ) ]
    (column ~key ~gap:16 ~padding:24 ~max_width:512 ~corner_radius:8
       ~border_width:1 ~border_color:"var(--lui-c-border)"
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
