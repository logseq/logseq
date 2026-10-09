(* logseq-katex — platform math slot.

   Web emits a slot carrying the .latex/.latex-inline classes and a
   hidden .opacity-0 tex child (a logseq-span); the render_libs doc-scan
   lazy-loads katex + mhchem and calls katex.render into the slot.
   Native hosts emit the same generic logseq-<tag> shape as before (the
   native twin does not register this schema).

   Props:
     tex     — raw latex source (required)
     display — katex displayMode
     inline  — inline vs block slot (drives .latex-inline / display:block)
     style-class / accessibility-identifier — same as standard props *)

open Lui_protocol

let identifier = "logseq-katex"

let schema =
  Lui_extension.component identifier
    [ { profile_os = WebOS; profile_host = WebHost } ]
    false (* standard_children *)
    [ Logseq_el.identifier "span" ]
    (* only the .opacity-0 tex holder mounts inside *)
    [ Lui_extension.property "tex" Lui_extension.StringScalar true None
    ; Lui_extension.property "display" Lui_extension.BoolScalar false None
    ; Lui_extension.property "inline" Lui_extension.BoolScalar false None
    ; Lui_extension.property "style-class" Lui_extension.StringScalar false
        None
    ; Lui_extension.property "accessibility-identifier"
        Lui_extension.StringScalar false None
    ]
    []

let register registry = Lui_extension.register_component registry schema

(* cljs extensions/latex: .latex-inline (inline) / .latex (block) with
   class "initial", a generated #ls-katex-* id, and an .opacity-0 child
   holding the raw tex; render_libs resolves the mount by id. *)
let el ?key ~block ~display ~tex () : Lui_elements.t =
 fun context parent ->
  Render_libs.ensure ();
  let id = "ls-katex-" ^ Ui_services.env_random_uuid () in
  Render_libs.katex_register_pending id display;
  let node = Lui_ui.extension context identifier in
  Option.iter (Lui_ui.key context node) key;
  Lui_ui.extension_property context node "tex" (StringValue tex);
  Lui_ui.extension_property context node "display" (BoolValue display);
  Lui_ui.extension_property context node "inline" (BoolValue (not block));
  Lui_ui.extension_property context node "style-class"
    (StringValue
       (if block then "latex initial" else "latex-inline initial"));
  Lui_ui.extension_property context node "accessibility-identifier"
    (StringValue id);
  (match parent with
   | Some p -> Lui_ui.append context p node
   | None -> ());
  (* hidden tex holder — keeps the raw tex for copy/AT and is what
     render_katex_one reads before katex.render replaces the subtree *)
  let holder =
    Lui_ui.extension context (Logseq_el.identifier "span")
  in
  Lui_ui.extension_property context holder "style-class"
    (StringValue "opacity-0");
  Lui_ui.extension_property context holder "text" (StringValue tex);
  Lui_ui.append context node holder;
  node
