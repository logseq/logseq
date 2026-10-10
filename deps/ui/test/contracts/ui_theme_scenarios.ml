(* Ui_theme snapshot completeness contract — every token name that
   still-live CSS (resources/css/theme/vars-classic.css) or gpui-kit
   theme slots rely on must exist in the shared snapshot, for BOTH
   variants, with literal values or explicit var(--ls-<name>) references.
   Runs under byte/native (task_native_test) and melange
   (task_web_test); Ui_services_scenarios must run first (it installs
   the fake services [apply] delivers through). *)

let check label condition = if not condition then failwith label

let eqs label a b =
  if a <> b then failwith (label ^ ": expected " ^ b ^ ", got " ^ a)

let find name vars = List.assoc_opt name vars

(* accent-invariant --ls-* names the snapshot emits with literal values
   under both modes — the subset of vars-classic.css that colors.css
   accent themes never rebind. *)
let required_ls_literals =
  [ "--ls-tag-text-opacity"
  ; "--ls-tag-text-hover-opacity"
  ; "--ls-page-text-size"
  ; "--ls-page-title-size"
  ; "--ls-main-content-max-width"
  ; "--ls-main-content-max-width-wide"
  ; "--ls-font-family"
  ; "--ls-scrollbar-width"
  ; "--ls-border-radius-low"
  ; "--ls-border-radius-medium"
  ; "--ls-headbar-height"
  ; "--ls-headbar-inner-top-padding"
  ; "--ls-left-sidebar-width"
  ; "--ls-left-sidebar-sm-width"
  ; "--ls-left-sidebar-nav-btn-size"
  ; "--ls-native-kb-height"
  ; "--ls-highlight-color-gray"
  ; "--ls-highlight-color-red"
  ; "--ls-highlight-color-yellow"
  ; "--ls-highlight-color-green"
  ; "--ls-highlight-color-blue"
  ; "--ls-highlight-color-purple"
  ; "--ls-highlight-color-pink"
  ; "--ls-active-primary-color"
  ; "--ls-active-secondary-color"
  ; "--ls-tertiary-border-color"
  ; "--ls-guideline-color"
  ; "--ls-title-text-color"
  ; "--ls-block-bullet-border-color"
  ; "--ls-block-bullet-color"
  ; "--ls-page-mark-color"
  ; "--ls-page-mark-bg-color"
  ; "--ls-scrollbar-foreground-color"
  ; "--ls-scrollbar-background-color"
  ; "--ls-scrollbar-thumb-hover-color"
  ; "--ls-pie-bg-color"
  ; "--ls-pie-fg-color"
  ; "--ls-header-button-background"
  ; "--ls-button-background-hsl"
  ; "--ls-button-background"
  ]

(* vars-classic names rebound per data-color accent (colors.css) or
   chained via var() to one that is — the snapshot must NOT emit them
   as --ls-* literals; canonical --lx-* var(--ls-<name>) refs only. *)
let bound_ls =
  [ "--ls-primary-background-color"
  ; "--ls-secondary-background-color"
  ; "--ls-tertiary-background-color"
  ; "--ls-quaternary-background-color"
  ; "--ls-table-tr-even-background-color"
  ; "--ls-block-properties-background-color"
  ; "--ls-page-properties-background-color"
  ; "--ls-block-ref-link-text-color"
  ; "--ls-border-color"
  ; "--ls-secondary-border-color"
  ; "--ls-menu-hover-color"
  ; "--ls-primary-text-color"
  ; "--ls-secondary-text-color"
  ; "--ls-link-text-color"
  ; "--ls-link-text-hover-color"
  ; "--ls-link-ref-text-color"
  ; "--ls-link-ref-text-hover-color"
  ; "--ls-tag-text-color"
  ; "--ls-tag-text-hover-color"
  ; "--ls-slide-background-color"
  ; "--ls-block-highlight-color"
  ; "--ls-selection-background-color"
  ; "--ls-selection-text-color"
  ; "--ls-page-checkbox-color"
  ; "--ls-page-checkbox-border-color"
  ; "--ls-page-blockquote-color"
  ; "--ls-page-blockquote-bg-color"
  ; "--ls-page-blockquote-border-color"
  ; "--ls-page-inline-code-bg-color"
  ; "--ls-page-inline-code-color"
  ; "--ls-cloze-text-color"
  ; "--ls-icon-color"
  ; "--ls-search-icon-color"
  ; "--ls-search-icon-hover-color"
  ; "--ls-a-chosen-bg"
  ; "--ls-focus-ring-color"
  ; "--ls-left-sidebar-text-color"
  ]

(* canonical-only tokens (no --ls-* legacy): elevation/overlay, status
   colors, component slots, typography, and LUI semantic names *)
let required_canonical =
  [ "--lx-overlay-color"
  ; "--lx-danger-color"
  ; "--lx-success-color"
  ; "--lx-warning-color"
  ; "--lx-dialog-surface"
  ; "--lx-panel-surface"
  ; "--lx-popup-surface"
  ; "--lx-menu-hover"
  ; "--lx-item-row-selected"
  ; "--lx-text-header"
  ; "--lx-text-row"
  ; "--lx-text-input"
  ; "--lx-weight-medium"
  ; "--lx-weight-bold"
  ; "--lui-background"
  ; "--lui-foreground"
  ; "--lui-border"
  ; "--lui-ring"
  ; "--lui-destructive"
  ; "--lui-radius"
  ; "--color-level-1"
  ; "--color-level-3"
  ; "--color-level-6"
  ]

(* gpui-kit ThemeConfig slot keys the snapshot must fill (logseq_theme.rs
   vocabulary — was the hardcoded LOGSEQ_THEME palette) *)
let required_kit_slots =
  [ "background"
  ; "foreground"
  ; "caret"
  ; "border"
  ; "input.border"
  ; "ring"
  ; "overlay"
  ; "window.border"
  ; "accent.background"
  ; "accent.foreground"
  ; "muted.background"
  ; "muted.foreground"
  ; "popover.background"
  ; "popover.foreground"
  ; "primary.background"
  ; "primary.active.background"
  ; "primary.foreground"
  ; "primary.hover.background"
  ; "secondary.background"
  ; "secondary.active.background"
  ; "secondary.foreground"
  ; "secondary.hover.background"
  ; "selection.background"
  ; "sidebar.background"
  ; "sidebar.border"
  ; "sidebar.foreground"
  ; "sidebar.accent.background"
  ; "sidebar.accent.foreground"
  ; "sidebar.primary.background"
  ; "sidebar.primary.foreground"
  ; "list.background"
  ; "list.hover.background"
  ; "list.active.background"
  ; "list.active.border"
  ; "list.even.background"
  ; "list.head.background"
  ; "title_bar.background"
  ; "title_bar.border"
  ; "status_bar.background"
  ; "status_bar.border"
  ; "tab.background"
  ; "tab.foreground"
  ; "tab.active.background"
  ; "tab.active.foreground"
  ; "tab_bar.background"
  ; "table.even.background"
  ; "table.head.background"
  ; "table.hover.background"
  ; "table.row.border"
  ; "scrollbar.background"
  ; "scrollbar.thumb.background"
  ; "scrollbar.thumb.hover.background"
  ; "skeleton.background"
  ; "slider.background"
  ; "slider.thumb.background"
  ; "switch.background"
  ; "switch.thumb.background"
  ; "link"
  ; "link.hover"
  ; "link.active"
  ; "progress.bar.background"
  ; "base.blue"
  ; "base.blue.light"
  ; "base.cyan"
  ; "base.cyan.light"
  ; "base.green"
  ; "base.green.light"
  ; "base.magenta"
  ; "base.magenta.light"
  ; "base.red"
  ; "base.red.light"
  ; "base.yellow"
  ; "base.yellow.light"
  ]

let is_var_ref v =
  String.length v > 4
  && String.sub v 0 4 = "var("
  && String.get v (String.length v - 1) = ')'

let check_variant (snap : Ui_theme.snapshot) =
  (* every accent-invariant --ls-* literal present, literal valued *)
  List.iter
    (fun name ->
      match find name snap.vars with
      | Some v -> check ("literal value for " ^ name) (v <> "" && not (is_var_ref v))
      | None -> failwith ("missing " ^ name ^ " in vars"))
    required_ls_literals;
  (* every emitted --ls-* has a canonical --lx-* twin carrying the same
     value *)
  List.iter
    (fun name ->
      let canonical =
        "--lx-" ^ String.sub name 5 (String.length name - 5)
      in
      match find name snap.vars, find canonical snap.vars with
      | Some v, Some c -> eqs ("--lx twin of " ^ name) c v
      | _, None -> failwith ("missing canonical twin " ^ canonical)
      | None, _ -> ())
    required_ls_literals;
  (* accent-bound names: no --ls-* literal; canonical --lx-* ref only *)
  List.iter
    (fun name ->
      let canonical =
        "--lx-" ^ String.sub name 5 (String.length name - 5)
      in
      check ("no literal " ^ name) (find name snap.vars = None);
      check ("canonical ref " ^ canonical)
        (find canonical snap.vars = Some ("var(" ^ name ^ ")")))
    bound_ls;
  List.iter
    (fun name ->
      check ("canonical present " ^ name) (find name snap.vars <> None))
    required_canonical;
  (* kit slots all present and literal *)
  List.iter
    (fun slot ->
      match find slot snap.kit with
      | Some v -> check ("literal kit " ^ slot) (v <> "" && not (is_var_ref v))
      | None -> failwith ("missing kit slot " ^ slot))
    required_kit_slots;
  (* six levels, all set *)
  check "six color levels" (Array.length snap.levels = 6);
  Array.iter (fun v -> check "level nonempty" (v <> "")) snap.levels;
  (* component slots populated *)
  let c (n, (c : Ui_theme.component)) =
    check (n ^ " slots")
      (c.surface <> "" && c.foreground <> "" && c.border <> ""
       && c.hover <> "" && c.selected <> "")
  in
  List.iter c
    [ "dialog", snap.components.dialog
    ; "panel", snap.components.panel
    ; "popup", snap.components.popup
    ; "menu", snap.components.menu
    ; "item_row", snap.components.item_row
    ];
  (* typography scale the cmdk uses *)
  let t = snap.typography in
  eqs "header size" t.text_header "0.75rem";
  eqs "row size" t.text_row "0.875rem";
  eqs "input size" t.text_input "1.25rem";
  check "weights"
    (t.weight_light = 300 && t.weight_regular = 400
     && t.weight_medium = 500 && t.weight_bold = 700)

let run () =
  let light = Ui_theme.snapshot Ui_theme.Light
  and dark = Ui_theme.snapshot Ui_theme.Dark in
  check_variant light;
  check_variant dark;
  (* both variants emit the same var name set — mode flips can never
     leave stale names on the root *)
  let names (s : Ui_theme.snapshot) = List.map fst s.vars |> List.sort compare in
  eqs "same var names both modes" (String.concat "," (names light))
    (String.concat "," (names dark));
  (* and differ where they must *)
  check "background differs"
    (light.colors.background <> dark.colors.background);
  check "level-1 differs" (light.levels.(0) <> dark.levels.(0));
  (* delivery: apply pushes a mode-stamped wire snapshot through the
     installed services channel *)
  Ui_theme.apply "dark";
  (match !Ui_services_scenarios.last_theme_snapshot with
   | Some (snap : Ui_services.theme_snapshot) ->
       eqs "delivered mode" snap.mode "dark";
       check "delivered vars" (snap.vars <> []);
       check "delivered kit" (snap.kit <> [])
   | None -> failwith "apply did not deliver a snapshot");
  Ui_theme.apply "light";
  (match !Ui_services_scenarios.last_theme_snapshot with
   | Some snap -> eqs "delivered light mode" snap.mode "light"
   | None -> failwith "apply did not deliver a snapshot");
  (match (try ignore (Ui_theme.apply "sepia"); None with
          | Invalid_argument _ -> Some ()) with
   | Some () -> ()
   | None -> failwith "apply accepted an unknown mode")
