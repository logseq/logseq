(* Web adapter check — Ui_theme.apply must land the snapshot's vars on
   document.documentElement.style for BOTH modes: canonical --lx-*
   names, --ls-* legacy aliases (accent-invariant only), --lui-*
   semantics, and --color-level-* ladders. Runs under node with
   Stub_dom's element stubs; style.setProperty records into __props. *)

let check label condition = if not condition then failwith label

let style_prop : string -> string option =
  [%mel.raw
    "function (n) { var p = document.documentElement.style.__props; \
     return p ? p[n] : undefined }"]

let run () =
  Ui_theme.apply "dark";
  check "dark literal on root"
    (style_prop "--ls-page-title-size" = Some "36px");
  check "dark canonical twin"
    (style_prop "--lx-page-title-size" = Some "36px");
  check "dark accent-bound canonical ref"
    (style_prop "--lx-primary-background-color"
     = Some "var(--ls-primary-background-color)");
  check "dark accent-bound literal withheld"
    (style_prop "--ls-primary-background-color" = None);
  check "dark lui semantic ref"
    (style_prop "--lui-background" = Some "var(--ls-primary-background-color)");
  check "dark level-1 ref"
    (style_prop "--color-level-1"
     = Some "var(--ls-secondary-background-color)");
  check "dark overlay literal"
    (style_prop "--lx-overlay-color" = Some "#00000088");
  check "typography var"
    (style_prop "--lx-text-input" = Some "1.25rem");
  Ui_theme.apply "light";
  check "light literal on root"
    (style_prop "--ls-page-title-size" = Some "36px");
  check "light level-1 literal"
    (style_prop "--color-level-1" = Some "#f8f8f8");
  check "light overlay literal"
    (style_prop "--lx-overlay-color" = Some "#00000066");
  check "light bullet literal"
    (style_prop "--ls-block-bullet-color" = Some "rgba(67, 63, 56, 0.25)")
