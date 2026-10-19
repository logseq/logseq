(* Theme CSS owns global colors and dimensions. This bridge supplies
   derived application tokens and the generated native palette layers. *)

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

let lui_vars (c : colors) =
  let channels =
    [ "background"; "foreground"; "card"; "card-foreground"; "primary"
    ; "primary-foreground"; "secondary"; "secondary-foreground"; "accent"
    ; "accent-foreground"; "muted-foreground"; "destructive"
    ; "destructive-foreground"; "input"; "ring"; "border" ] in
  let colors =
    List.map (fun name -> "--lui-" ^ name, "hsl(var(--" ^ name ^ "))") channels
    @ [ "--lui-success", c.success
  ; "--lui-success-foreground", c.on_accent
  ; "--lui-warning", c.warning
  ; "--lui-warning-foreground", c.on_accent
  ; "--lui-error", c.danger
  ; "--lui-error-foreground", c.on_accent
  ] in
  colors
  @ List.map (fun (name, _) ->
      "--color-" ^ String.sub name 6 (String.length name - 6),
      "var(" ^ name ^ ")") colors
  @ ["--lui-radius", "8px"]

let semantic_color_vars =
  lui_vars (colors Light)
  |> List.filter_map (fun (name, value) ->
      if String.starts_with ~prefix:"--color-" name then
        Some (String.sub name 8 (String.length name - 8), value)
      else None)

let semantic_color_var name = List.assoc_opt name semantic_color_vars

let faded_link_opacity = 0.8

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
  ; "--lx-faded-link-opacity", string_of_float faded_link_opacity
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

(* Canonical names refer to their stylesheet-owned source declarations. *)
let ls_vars =
  Ui_theme_css.owned_names
  |> List.filter_map (fun name ->
      if String.starts_with ~prefix:"--ls-" name then
        Some ("--lx-" ^ String.sub name 5 (String.length name - 5),
              "var(" ^ name ^ ")")
      else None)

(* cmdk mode-conditional tokens: values that differ per theme mode
   (state rings, keycap glow, the dark icon override, the chosen-row
   paint) can't ride a shared var chain — the chain resolves once.
   On web each --ls/- --lx var reference still resolves accent-aware
   through colors.css; the literal fallbacks give the native host the
   classic
   values through its existing css-var table. *)
let cmdk_vars = function
  | Light ->
    [ "--lx-cmdk-chosen-bg", "var(--ls-a-chosen-bg, #dcdcdc)"
    ; "--lx-select-active-bg", "var(--lx-gray-03)"
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
    ; "--lx-select-active-bg", "var(--lx-gray-02)"
    ; "--lx-cmdk-icon-fg", "#ffffff"
    ; "--lx-cmdk-kb-shadow", "none"
    ; "--lx-cmdk-hover-ring", "none"
    ; "--lx-cmdk-hover-ring-hl", "none"
    ; "--kbd-glow-top", "rgba(255, 255, 255, 0.15)"
    ; "--kbd-glow-bottom", "rgba(0, 0, 0, 0.25)"
    ; "--lx-nav-active", "rgb(255 255 255 / 0.08)"
    ]

let handbook_vars = function
  | Light ->
      ["--lx-handbook-bg","var(--ls-primary-background-color)";
       "--lx-handbook-heading-fg","var(--lx-gray-12)";
       "--lx-handbook-body-fg","var(--lx-gray-12)";
       "--lx-handbook-section-fg","var(--lx-gray-12)";
       "--lx-handbook-hover-bg","var(--ls-tertiary-background-color)";
       "--lx-handbook-footer-bg","var(--ls-primary-background-color)"]
  | Dark ->
      ["--lx-handbook-bg","var(--ls-tertiary-background-color)";
       "--lx-handbook-heading-fg","#ffffff";
       "--lx-handbook-body-fg","#f9fafb";
       "--lx-handbook-section-fg","#f3f4f6";
       "--lx-handbook-hover-bg","var(--ls-primary-background-color)";
       "--lx-handbook-footer-bg","var(--ls-quaternary-background-color)"]

(* Global palette declarations have one owner: the authored theme CSS. *)
let stylesheet_owned_var name =
  String.starts_with ~prefix:"--rx-" name
  || List.mem name Ui_theme_css.owned_names

type css_palette = { root : (string * string) list; body : (string * string) list }

let css_palette mode ~accent =
  let root, body = Ui_theme_css.vars ~dark:(mode = Dark) ~accent in
  { root = (match mode with Light -> Ui_theme_radix.light | Dark -> Ui_theme_radix.dark) @ root
  ; body
  }

let snapshot mode =
  let c = colors mode in
  let cs = components c in
  { mode
  ; colors = c
  ; components = cs
  ; typography
  ; levels = levels mode
  ; vars =
      List.filter (fun (name, _) -> not (stylesheet_owned_var name))
        (ls_vars @ lui_vars c @ canonical_vars c cs
           typography @ cmdk_vars mode @ handbook_vars mode
         @ [ "--left-sidebar-bg-color", "var(--lx-gray-02)" ])
  }

let mode_of_string = function
  | "dark" -> Dark
  | "light" -> Light
  | other -> invalid_arg ("Ui_theme.mode_of_string: " ^ other)

let to_service (s : snapshot) : Ui_services.theme_snapshot =
  { mode = (match s.mode with Light -> "light" | Dark -> "dark")
  ; vars = s.vars
  }

let apply effective =
  Ui_services.theme_apply_snapshot (to_service (snapshot (mode_of_string effective)))
