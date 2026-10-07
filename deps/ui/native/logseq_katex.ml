(* logseq-katex — native twin: emits the same generic logseq-div/span
   mount the shared sites used before the dedicated web extension — a
   .latex/.latex-inline holder with the generated #ls-katex-* id plus
   the hidden .opacity-0 tex child. Render_libs pushes the pending +
   scan host ops so the host renders the slot natively; no dedicated
   schema is registered. *)
let identifier = "logseq-katex"

let el ?key ~block ~display ~tex () : Lui_elements.t =
 fun context parent ->
  Render_libs.ensure ();
  let id = "ls-katex-" ^ Platform.random_uuid () in
  Render_libs.katex_register_pending id display;
  Logseq_el.el ?key
    ~tag:(if block then "div" else "span")
    ~style_class:(if block then "latex initial" else "latex-inline initial")
    ~id
    [ Logseq_el.el ~tag:"span" ~style_class:"opacity-0" ~text:tex [] ]
    context parent
