(* Shared visual-design tokens — see ui_theme.mli for the ownership
   model. Values mirror resources/css/theme/vars-classic.css (classic
   logseq accent) resolved to literals, plus the semantic additions the
   kit/component layers need. Accent-bound --ls-* names are never
   emitted as literals (colors.css owns them per data-color); their
   canonical --lx-* twins carry var(--ls-<name>) references. *)

type mode =
  | Light
  | Dark

type colors = {
  background : string;
  background_raised : string;
  background_sunken : string;
  background_selected : string;
  surface_elevated : string;
  foreground : string;
  foreground_strong : string;
  foreground_muted : string;
  foreground_faint : string;
  border : string;
  border_soft : string;
  border_faint : string;
  accent : string;
  accent_hover : string;
  on_accent : string;
  active : string;
  on_active : string;
  selection : string;
  on_selection : string;
  focus_ring : string;
  danger : string;
  success : string;
  warning : string;
  overlay : string;
}

type component = {
  surface : string;
  foreground : string;
  border : string;
  hover : string;
  selected : string;
}

type components = {
  dialog : component;
  panel : component;
  popup : component;
  menu : component;
  item_row : component;
}

type typography = {
  font_family : string;
  page_text_size : string;
  page_title_size : string;
  text_header : string;
  text_row : string;
  text_input : string;
  weight_light : int;
  weight_regular : int;
  weight_medium : int;
  weight_bold : int;
}

type snapshot = {
  mode : mode;
  colors : colors;
  components : components;
  typography : typography;
  levels : string array;
  vars : (string * string) list;
  kit : (string * string) list;
}

let typography =
  { font_family = "Inter"
  ; page_text_size = "1em"
  ; page_title_size = "36px"
  ; text_header = "0.75rem"
  ; text_row = "0.875rem"
  ; text_input = "1.25rem"
  ; weight_light = 300
  ; weight_regular = 400
  ; weight_medium = 500
  ; weight_bold = 700
  }

(* --ls-* names rebound by colors.css per data-color accent (or chained
   via var() to one that is). The snapshot must not pin them to logseq
   literals — the stylesheet owns them until accent palettes move into
   the snapshot. Emitted only as --lx-* var(--ls-<name>) references. *)
let accent_bound =
  [ "primary-background-color"
  ; "secondary-background-color"
  ; "tertiary-background-color"
  ; "quaternary-background-color"
  ; "table-tr-even-background-color"
  ; "block-properties-background-color"
  ; "page-properties-background-color"
  ; "block-ref-link-text-color"
  ; "border-color"
  ; "secondary-border-color"
  ; "menu-hover-color"
  ; "primary-text-color"
  ; "secondary-text-color"
  ; "link-text-color"
  ; "link-text-hover-color"
  ; "link-ref-text-color"
  ; "link-ref-text-hover-color"
  ; "tag-text-color"
  ; "tag-text-hover-color"
  ; "slide-background-color"
  ; "block-highlight-color"
  ; "selection-background-color"
  ; "selection-text-color"
  ; "page-checkbox-color"
  ; "page-checkbox-border-color"
  ; "page-blockquote-color"
  ; "page-blockquote-bg-color"
  ; "page-blockquote-border-color"
  ; "page-inline-code-bg-color"
  ; "page-inline-code-color"
  ; "cloze-text-color"
  ; "icon-color"
  ; "search-icon-color"
  ; "search-icon-hover-color"
  ; "a-chosen-bg"
  ; "focus-ring-color"
  ; "left-sidebar-text-color"
  ]

(* Mode-invariant --ls-* tokens (vars-classic :root block plus shared
   entries) — emitted as --ls-* literals with --lx-* canonical twins. *)
let common_ls =
  [ "tag-text-opacity", "0.8"
  ; "tag-text-hover-opacity", "1"
  ; "page-text-size", "1em"
  ; "page-title-size", "36px"
  ; "main-content-max-width", "960px"
  ; "main-content-max-width-wide", "1440px"
  ; "font-family", "Inter"
  ; "scrollbar-width", "6px"
  ; "border-radius-low", "4px"
  ; "border-radius-medium", "8px"
  ; "headbar-height", "3rem"
  ; "headbar-inner-top-padding", "0px"
  ; "left-sidebar-width", "246px"
  ; "left-sidebar-sm-width", "74vw"
  ; "left-sidebar-nav-btn-size", "38px"
  ; "native-kb-height", "0px"
  ; "page-mark-color", "#262626"
  ; "page-mark-bg-color", "#fef3ac"
  ; "button-background-hsl", "200 98% 35%"
  ; "button-background", "hsl(200 98% 35%)"
  ]

(* radix *-05 accent highlights — resolved to literals so GPUI (which
   cannot parse hsl()/var() chains) gets the same colors as the web *)
let highlight_ls =
  [ "highlight-color-gray", "#e8e8e8"
  ; "highlight-color-red", "#fdd8d8"
  ; "highlight-color-yellow", "#fef2a4"
  ; "highlight-color-green", "#ccebd7"
  ; "highlight-color-blue", "#cee7fe"
  ; "highlight-color-purple", "#eddbf9"
  ; "highlight-color-pink", "#f9d8ec"
  ]

(* Mode-dependent --ls-* literals (accent-invariant only) *)
let mode_ls mode =
  match mode with
  | Light ->
    [ "active-primary-color", "rgb(0, 105, 182)"
    ; "active-secondary-color", "#00477c"
    ; "tertiary-border-color", "rgba(200, 200, 200, 0.3)"
    ; "guideline-color", "rgba(46, 27, 5, 0.08)"
    ; "title-text-color", "rgba(15, 20, 25, 1)"
    ; "block-bullet-border-color", "#dedede"
    ; "block-bullet-color", "rgba(67, 63, 56, 0.25)"
    ; "scrollbar-foreground-color", "rgba(0, 0, 0, 0.1)"
    ; "scrollbar-background-color", "rgba(0, 0, 0, 0.05)"
    ; "scrollbar-thumb-hover-color", "rgba(0, 0, 0, 0.2)"
    ; "pie-bg-color", "#e1e1e1"
    ; "pie-fg-color", "#0a4a5d"
    ; "header-button-background", "rgba(15, 20, 25, 1)"
    ]
  | Dark ->
    [ "active-primary-color", "#8ec2c2"
    ; "active-secondary-color", "#d0e8e8"
    ; "tertiary-border-color", "rgba(0, 2, 0, 0.1)"
    ; "guideline-color", "#0b4a5a"
    ; "title-text-color", "#93a1a1"
    ; "block-bullet-border-color", "#0f4958"
    ; "block-bullet-color", "#608e91"
    ; "scrollbar-foreground-color", "#11505f"
    ; "scrollbar-background-color", "rgba(30, 60, 67, 0.1)"
    ; "scrollbar-thumb-hover-color", "rgba(255, 255, 255, 0.2)"
    ; "pie-bg-color", "#01303b"
    ; "pie-fg-color", "#0b5869"
    ; "header-button-background", "#dee4ea"
    ]

let colors mode =
  match mode with
  | Light ->
    { background = "#ffffff"
    ; background_raised = "#f7f7f7"
    ; background_sunken = "#eaeaea"
    ; background_selected = "#dcdcdc"
    ; surface_elevated = "#ffffff"
    ; foreground = "#433f38"
    ; foreground_strong = "#161e2e"
    ; foreground_muted = "#8a8580"
    ; foreground_faint = "rgba(15, 20, 25, 1)"
    ; border = "#ccc"
    ; border_soft = "#e2e2e2"
    ; border_faint = "rgba(200, 200, 200, 0.3)"
    ; accent = "#106ba3"
    ; accent_hover = "#1a537c"
    ; on_accent = "#ffffff"
    ; active = "rgb(0, 105, 182)"
    ; on_active = "#00477c"
    ; selection = "#e4f2ff"
    ; on_selection = "#161e2e"
    ; focus_ring = "rgba(66, 133, 244, 0.5)"
    ; danger = "#b91c1c"
    ; success = "#15803d"
    ; warning = "#a16207"
    ; overlay = "#00000066"
    }
  | Dark ->
    { background = "#002b36"
    ; background_raised = "#023643"
    ; background_sunken = "#08404f"
    ; background_selected = "#094b5a"
    ; surface_elevated = "#023643"
    ; foreground = "#a4b5b6"
    ; foreground_strong = "#dfdfdf"
    ; foreground_muted = "#608e91"
    ; foreground_faint = "#93a1a1"
    ; border = "#0e5263"
    ; border_soft = "#126277"
    ; border_faint = "rgba(0, 2, 0, 0.1)"
    ; accent = "#8abbbb"
    ; accent_hover = "#d0e8e8"
    ; on_accent = "#002b36"
    ; active = "#8ec2c2"
    ; on_active = "#d0e8e8"
    ; selection = "#338fff"
    ; on_selection = "#ffffff"
    ; focus_ring = "rgba(18, 98, 119, 0.5)"
    ; danger = "#d98a8a"
    ; success = "#7dbb8a"
    ; warning = "#c9a86a"
    ; overlay = "#00000088"
    }

(* --color-level-1..6: raised-surface ladder. Light resolves the radix
   gray steps; dark keeps the vars-classic var(--ls-<name>) chains so accent
   themes can re-theme them. *)
let levels mode =
  match mode with
  | Light ->
    [| "#f8f8f8"; "#f3f3f3"; "#ededed"; "#e8e8e8"; "#e2e2e2"; "#dbdbdb" |]
  | Dark ->
    [| "var(--ls-secondary-background-color)"
     ; "var(--ls-tertiary-background-color)"
     ; "var(--ls-quaternary-background-color)"
     ; "#195d6c"
     ; "#266c7d"
     ; "#3a7e8e"
    |]

let components (c : colors) =
  { dialog =
      { surface = c.surface_elevated
      ; foreground = c.foreground
      ; border = c.border_soft
      ; hover = c.background_sunken
      ; selected = c.background_selected
      }
  ; panel =
      { surface = c.background_raised
      ; foreground = c.foreground
      ; border = c.border_soft
      ; hover = c.background_sunken
      ; selected = c.background_selected
      }
  ; popup =
      { surface = c.surface_elevated
      ; foreground = c.foreground
      ; border = c.border
      ; hover = c.background_selected
      ; selected = c.background_selected
      }
  ; menu =
      { surface = c.surface_elevated
      ; foreground = c.foreground
      ; border = c.border_soft
      ; hover = c.background_selected
      ; selected = c.background_selected
      }
  ; item_row =
      { surface = c.background
      ; foreground = c.foreground
      ; border = c.border_soft
      ; hover = c.background_selected
      ; selected = c.background_selected
      }
  }

(* gpui-kit ThemeConfig.colors slot map — the same palette the host's
   logseq_theme.rs hardcoded, now delivered by the shared layer. *)
let kit (c : colors) mode =
  [ "background", c.background
  ; "foreground", c.foreground
  ; "caret", c.foreground
  ; "border", c.border
  ; "input.border", c.border
  ; "ring", c.accent
  ; "overlay", c.overlay
  ; "window.border", c.border
  ; "accent.background", c.background_selected
  ; "accent.foreground", c.foreground
  ; "muted.background", c.background_sunken
  ; "muted.foreground", c.foreground_muted
  ; "popover.background", c.surface_elevated
  ; "popover.foreground", c.foreground
  ; "primary.background", c.accent
  ; "primary.active.background", c.accent_hover
  ; "primary.foreground", c.on_accent
  ; "primary.hover.background", c.accent_hover
  ; "secondary.background", c.background_raised
  ; "secondary.active.background", c.background_selected
  ; "secondary.foreground", c.foreground
  ; "secondary.hover.background", c.background_sunken
  ; "selection.background",
    (match mode with Light -> "#c0e6fd" | Dark -> "#0a3d4b")
  ; "sidebar.background", c.background_raised
  ; "sidebar.border", c.border_soft
  ; "sidebar.foreground", c.foreground
  ; "sidebar.accent.background", c.background_selected
  ; "sidebar.accent.foreground", c.foreground_strong
  ; "sidebar.primary.background",
    (match mode with Light -> c.accent | Dark -> "#377f91")
  ; "sidebar.primary.foreground", c.on_accent
  ; "list.background", c.background
  ; "list.hover.background", c.background_selected
  ; "list.active.background",
    (match mode with Light -> "#c0e6fd" | Dark -> "#0a3d4b")
  ; "list.active.border", c.accent
  ; "list.even.background",
    (match mode with Light -> c.background_raised | Dark -> "#03333f")
  ; "list.head.background", c.background_raised
  ; "title_bar.background", c.background
  ; "title_bar.border", c.border_soft
  ; "status_bar.background", c.background_raised
  ; "status_bar.border", c.border_soft
  ; "tab.background", c.background_raised
  ; "tab.foreground", c.foreground_muted
  ; "tab.active.background", c.background
  ; "tab.active.foreground", c.accent
  ; "tab_bar.background", c.background_raised
  ; "table.even.background",
    (match mode with Light -> c.background_raised | Dark -> "#03333f")
  ; "table.head.background", c.background_raised
  ; "table.hover.background", c.background_selected
  ; "table.row.border", c.border_soft
  ; "scrollbar.background",
    (match mode with
     | Light -> "rgba(0, 0, 0, 0.05)"
     | Dark -> "rgba(30, 60, 67, 0.1)")
  ; "scrollbar.thumb.background", c.border
  ; "scrollbar.thumb.hover.background", c.border_soft
  ; "skeleton.background", c.background_sunken
  ; "slider.background", c.background_selected
  ; "slider.thumb.background", c.accent
  ; "switch.background", c.background_selected
  ; "switch.thumb.background",
    (match mode with Light -> "#ffffff" | Dark -> "#a4b5b6")
  ; "link", c.accent
  ; "link.hover", c.accent_hover
  ; "link.active", c.accent_hover
  ; "progress.bar.background", c.accent
  ; "base.blue",
    (match mode with Light -> "#106ba3" | Dark -> "#8abbbb")
  ; "base.blue.light",
    (match mode with Light -> "#c0e6fd" | Dark -> "#0a4a5e")
  ; "base.cyan",
    (match mode with Light -> "#0e7490" | Dark -> "#67c8d0")
  ; "base.cyan.light",
    (match mode with Light -> "#a5f3fc" | Dark -> "#0e4a52")
  ; "base.green",
    (match mode with Light -> "#15803d" | Dark -> "#7dbb8a")
  ; "base.green.light",
    (match mode with Light -> "#bbf7d0" | Dark -> "#0a4633")
  ; "base.magenta",
    (match mode with Light -> "#a21caf" | Dark -> "#c993d4")
  ; "base.magenta.light",
    (match mode with Light -> "#f5d0fe" | Dark -> "#4a2450")
  ; "base.red",
    (match mode with Light -> "#b91c1c" | Dark -> "#d98a8a")
  ; "base.red.light",
    (match mode with Light -> "#fecaca" | Dark -> "#4d2626")
  ; "base.yellow",
    (match mode with Light -> "#a16207" | Dark -> "#c9a86a")
  ; "base.yellow.light",
    (match mode with Light -> "#fef08a" | Dark -> "#4a3d24")
  ]

(* LUI semantic color names — typed-prop colors on web resolve
   var(--color-X) -> var(--lui-X); accent-dependent roles point at the
   --ls-* names the stylesheet owns so accent themes still apply. *)
let lui_vars (c : colors) =
  [ "--lui-background", "var(--ls-primary-background-color)"
  ; "--lui-foreground", "var(--ls-primary-text-color)"
  ; "--lui-card", "var(--ls-secondary-background-color)"
  ; "--lui-card-foreground", "var(--ls-primary-text-color)"
  ; "--lui-primary", "var(--ls-link-text-color)"
  ; "--lui-primary-foreground", c.on_accent
  ; "--lui-secondary", "var(--ls-secondary-background-color)"
  ; "--lui-secondary-foreground", "var(--ls-primary-text-color)"
  ; "--lui-accent", "var(--ls-a-chosen-bg)"
  ; "--lui-accent-foreground", "var(--ls-primary-text-color)"
  ; "--lui-muted-foreground", c.foreground_muted
  ; "--lui-destructive", c.danger
  ; "--lui-destructive-foreground", c.on_accent
  ; "--lui-success", c.success
  ; "--lui-success-foreground", c.on_accent
  ; "--lui-warning", c.warning
  ; "--lui-warning-foreground", c.on_accent
  ; "--lui-error", c.danger
  ; "--lui-error-foreground", c.on_accent
  ; "--lui-input", "var(--ls-border-color)"
  ; "--lui-ring", "var(--ls-focus-ring-color)"
  ; "--lui-border", "var(--ls-border-color)"
  ; "--lui-radius", "8px"
  ]

(* canonical-only tokens: elevation/overlay, status colors, component
   slots, and the typography scale *)
let canonical_vars (c : colors) (cs : components) (t : typography) =
  let comp name (x : component) =
    [ "--lx-" ^ name ^ "-surface", x.surface
    ; "--lx-" ^ name ^ "-foreground", x.foreground
    ; "--lx-" ^ name ^ "-border", x.border
    ; "--lx-" ^ name ^ "-hover", x.hover
    ; "--lx-" ^ name ^ "-selected", x.selected
    ]
  in
  [ "--lx-overlay-color", c.overlay
  ; "--lx-danger-color", c.danger
  ; "--lx-danger-foreground", c.on_accent
  ; "--lx-success-color", c.success
  ; "--lx-success-foreground", c.on_accent
  ; "--lx-warning-color", c.warning
  ; "--lx-warning-foreground", c.on_accent
  ; "--lx-font-family", t.font_family
  ; "--lx-text-page", t.page_text_size
  ; "--lx-text-title", t.page_title_size
  ; "--lx-text-header", t.text_header
  ; "--lx-text-row", t.text_row
  ; "--lx-text-input", t.text_input
  ; "--lx-weight-light", string_of_int t.weight_light
  ; "--lx-weight-regular", string_of_int t.weight_regular
  ; "--lx-weight-medium", string_of_int t.weight_medium
  ; "--lx-weight-bold", string_of_int t.weight_bold
  ]
  @ comp "dialog" cs.dialog
  @ comp "panel" cs.panel
  @ comp "popup" cs.popup
  @ comp "menu" cs.menu
  @ comp "item-row" cs.item_row

(* [--ls-* literals for invariant names] + [--lx-* canonical twins] +
   [--lx-* var(--ls-<name>) refs for accent-bound names] *)
let ls_vars mode =
  let literals = common_ls @ highlight_ls @ mode_ls mode in
  List.concat_map
    (fun (stem, v) ->
      [ "--ls-" ^ stem, v; "--lx-" ^ stem, v ])
    literals
  @ List.map
      (fun stem -> "--lx-" ^ stem, "var(--ls-" ^ stem ^ ")")
      accent_bound

let level_vars mode =
  Array.to_list
    (Array.mapi
       (fun i v -> "--color-level-" ^ string_of_int (i + 1), v)
       (levels mode))

(* cmdk mode-conditional tokens: values that differ per theme mode
   (state rings, keycap glow, the dark icon override, the chosen-row
   paint) can't ride a shared var chain — the chain resolves once.
   On web each --ls/- --lx var reference still resolves accent-aware
   through colors.css; the literal fallbacks give gpui the classic
   values through its existing css-var table. *)
let cmdk_vars = function
  | Light ->
    [ "--lx-cmdk-chosen-bg", "var(--ls-a-chosen-bg, #dcdcdc)"
    ; "--lx-cmdk-icon-fg", "var(--lx-gray-12, var(--rx-gray-12))"
    ; ( "--lx-cmdk-kb-shadow"
      , "inset 0 0 0 9999px rgb(0 0 0 / 0.07), inset 0 0 0 1px \
         var(--lx-accent-03, #3b82f6)" )
    ; ( "--lx-cmdk-hover-ring"
      , "inset 0 0 0 1px var(--ls-border-color, var(--lx-gray-03, rgb(0 \
         0 0 / 0.24)))" )
    ; ( "--lx-cmdk-hover-ring-hl"
      , "inset 0 0 0 1px var(--ls-border-color, var(--lx-gray-09, rgb(0 \
         0 0 / 0.32)))" )
    ; "--kbd-glow-top", "transparent"
    ; "--kbd-glow-bottom", "rgba(0, 0, 0, 0.10)"
    ; (* settings nav item: the .active/.dark .active paint pair *)
      "--lx-nav-active", "rgb(0 0 0 / 0.1)"
    ]
  | Dark ->
    [ "--lx-cmdk-chosen-bg", "var(--ls-a-chosen-bg, #094b5a)"
    ; "--lx-cmdk-icon-fg", "#ffffff"
    ; "--lx-cmdk-kb-shadow", "none"
    ; "--lx-cmdk-hover-ring", "none"
    ; "--lx-cmdk-hover-ring-hl", "none"
    ; "--kbd-glow-top", "rgba(255, 255, 255, 0.15)"
    ; "--kbd-glow-bottom", "rgba(0, 0, 0, 0.25)"
    ; "--lx-nav-active", "rgb(255 255 255 / 0.08)"
    ]

let snapshot mode =
  let c = colors mode in
  let cs = components c in
  { mode
  ; colors = c
  ; components = cs
  ; typography
  ; levels = levels mode
  ; vars =
      ls_vars mode @ level_vars mode @ lui_vars c @ canonical_vars c cs
        typography
      @ cmdk_vars mode
  ; kit = kit c mode
  }

let mode_of_string = function
  | "dark" -> Dark
  | "light" -> Light
  | other -> invalid_arg ("Ui_theme.mode_of_string: " ^ other)

let to_service (s : snapshot) : Ui_services.theme_snapshot =
  { mode = (match s.mode with Light -> "light" | Dark -> "dark")
  ; vars = s.vars
  ; kit = s.kit
  }

let apply effective =
  Ui_services.theme_apply_snapshot (to_service (snapshot (mode_of_string effective)))
