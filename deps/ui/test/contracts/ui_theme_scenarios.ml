(* Shared CSS ownership and application-token delivery contracts.
   Runs in byte/native and Melange after Ui_services_scenarios. *)

let check label condition = if not condition then failwith label

let eqs label a b =
  if a <> b then failwith (label ^ ": expected " ^ b ^ ", got " ^ a)

let find name vars = List.assoc_opt name vars

(* Shared source declarations required by application chrome. *)
let required_ls_names =
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
  ; "--ls-block-highlight-color"
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

let is_var_ref v =
  String.length v > 4
  && String.sub v 0 4 = "var("
  && String.get v (String.length v - 1) = ')'

let check_variant (snap : Ui_theme.snapshot) =
  let palette = Ui_theme.css_palette snap.mode ~accent:"logseq" in
  let stylesheet = palette.body @ palette.root in
  List.iter (fun name ->
      check ("stylesheet source for " ^ name)
        (match find name stylesheet with Some value -> value <> "" | None -> false);
      check ("stylesheet owns " ^ name) (find name snap.vars = None);
      let canonical = "--lx-" ^ String.sub name 5 (String.length name - 5) in
      check ("canonical source reference for " ^ name)
        (find canonical snap.vars = Some ("var(" ^ name ^ ")")))
    required_ls_names;
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
      check ("canonical present " ^ name) (find name snap.vars <> None || find name stylesheet <> None))
    required_canonical;
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
  List.iter
    (fun (snapshot, background, border) ->
      check "background retains CSS HSL channels"
        (find "--background" ((Ui_theme.css_palette snapshot.Ui_theme.mode ~accent:"logseq").root) = Some background);
      check "border retains CSS HSL channels"
        (find "--border" ((Ui_theme.css_palette snapshot.Ui_theme.mode ~accent:"logseq").root) = Some border))
    [ (light, "0 0% 100%", "300 1% 92%");
      (dark, "192 100% 11%", "192 100% 14%") ];
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
       check "delivered vars" (snap.vars <> [])
   | None -> failwith "apply did not deliver a snapshot");
  Ui_theme.apply "light";
  (match !Ui_services_scenarios.last_theme_snapshot with
   | Some snap -> eqs "delivered light mode" snap.mode "light"
   | None -> failwith "apply did not deliver a snapshot");
  (match (try ignore (Ui_theme.apply "sepia"); None with
          | Invalid_argument _ -> Some ()) with
   | Some () -> ()
   | None -> failwith "apply accepted an unknown mode")
