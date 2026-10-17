(* Web adapter check — Ui_theme.apply delivers derived application tokens
   to document.body.style in both modes and leaves source-owned globals
   to CSS. Runs under node with Stub_dom's element stubs;
   style.setProperty records into __props. *)

let check label condition = if not condition then failwith label

let style_prop : string -> string option =
  [%mel.raw
    "function (n) { var p = document.body.style.__props; \
     return p ? p[n] : undefined }"]

let run () =
  Ui_theme.apply "dark";
  List.iter (fun name -> check ("stylesheet owns " ^ name) (style_prop name = None))
    [ "--background"; "--card"; "--border"; "--primary"; "--ring"
    ; "--rx-gray-12"; "--rx-gray-12-hsl"; "--lx-gray-12" ];
  check "stylesheet owns title size"
    (style_prop "--ls-page-title-size" = None);
  check "dark canonical twin"
    (style_prop "--lx-page-title-size" = Some "var(--ls-page-title-size)");
  check "dark accent-bound canonical ref"
    (style_prop "--lx-primary-background-color"
     = Some "var(--ls-primary-background-color)");
  check "dark accent-bound literal withheld"
    (style_prop "--ls-primary-background-color" = None);
  check "dark lui semantic ref"
    (style_prop "--lui-background" = Some "var(--ls-primary-background-color)");
  check "stylesheet owns dark level ladder"
    (style_prop "--color-level-1" = None);
  check "dark overlay literal"
    (style_prop "--lx-overlay-color" = Some "#00000088");
  check "typography var"
    (style_prop "--lx-text-input" = Some "1.25rem");
  Ui_theme.apply "light";
  check "stylesheet owns light title size"
    (style_prop "--ls-page-title-size" = None);
  check "stylesheet owns light level ladder"
    (style_prop "--color-level-1" = None);
  check "light overlay literal"
    (style_prop "--lx-overlay-color" = Some "#00000066");
  check "stylesheet owns light bullet color"
    (style_prop "--ls-block-bullet-color" = None)
