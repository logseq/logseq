(* Web adapter check — Ui_theme.apply delivers derived application tokens
   to document.body.style in both modes and leaves source-owned globals
   to CSS. Runs under node with Stub_dom's element stubs;
   style.setProperty records into __props. *)

let check label condition = if not condition then failwith label

let style_prop : string -> string option =
  [%mel.raw
    "function (n) { var p = document.body.style.__props; \
     return p ? p[n] : undefined }"]

let custom_css_fixture : unit -> (unit -> unit) = [%mel.raw {|
  function () {
    const query = document.querySelector, get = document.getElementById;
    const head = document.createElement('head');
    document.querySelector = selector => selector === 'head' ? head : query.call(document, selector);
    document.getElementById = id => Array.from(head.children).find(el => el.getAttribute('id') === id) || get.call(document, id);
    return () => { document.querySelector = query; document.getElementById = get; };
  }
|}]

let custom_css_href () =
  Option.bind (Web_dom.get_element_by_id Custom_css.theme_id)
    (fun el -> Web_dom.el_get_attr el "href")

let test_custom_css_clearing () =
  let restore = custom_css_fixture () in
  Fun.protect ~finally:restore (fun () ->
    Custom_css.apply_content "body { color: red; }";
    check "Custom CSS creates a stylesheet" (custom_css_href () <> None);
    Custom_css.on_file_saved "logseq/config.edn" "";
    check "An unrelated file cannot clear custom CSS" (custom_css_href () <> None);
    Custom_css.on_file_saved Custom_css.file_path "";
    check "Saving an empty custom.css removes the previous stylesheet" (custom_css_href () = None);
    Custom_css.apply_content "body { color: blue; }";
    Custom_css.on_file_saved Custom_css.file_path " \n\t";
    check "Whitespace-only custom.css removes the previous stylesheet" (custom_css_href () = None))

let run () =
  test_custom_css_clearing ();
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
    (style_prop "--lui-background" = Some "hsl(var(--background))");
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
