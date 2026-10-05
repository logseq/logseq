(* ported from deps/ui/src/core/icons.ml *)
(* Icons — mirrors shui icon v2 (`logseq.shui.icon.v2/root`).

   Component migration: every entry point now resolves through the LUI
   `icon` kind's `app:` name channel instead of hand-building
   logseq-svg trees. The custom `window.tablerIcons` extension pack is
   a JS bundle — absent on native hosts — so native names resolve
   against the shared tabler registry (GPUI ships the same
   tabler-children.json; SwiftUI the same tabler resources). `tie`
   (tabler-extension) names have no registry entry on native either —
   they rendered as empty font-glyph spans before, they resolve to
   nothing now. *)

(* shui v2 tabler-extension-icon-names *)
let tie_names =
  [ "add-link"; "app-feature"; "block"; "block-search"; "cloud-exclamation"
  ; "connector"; "group"; "h-auto"; "heading-off"; "internal-link"
  ; "link-to-block"; "link-to-page"; "link-to-whiteboard"
  ; "move-to-sidebar-right"; "new-block"; "new-page"; "new-whiteboard"
  ; "new-whiteboard-element"; "object-compact"; "object-expanded"
  ; "open-as-page"; "page"; "page-search"; "references-hide"
  ; "references-show"; "select-cursor"; "text"; "ungroup"; "whiteboard"
  ; "whiteboard-element"; "whiteboard-search" ]
;;

let kebab name =
  (* csk/->kebab-case: separators and lower->upper boundaries become '-';
     collapsing repeats, no leading dash *)
  let b = Buffer.create (String.length name + 4) in
  let prev_dash = ref true in
  String.iter
    (fun c ->
      if c = ' ' || c = '_' || c = '-' then (
        if not !prev_dash then Buffer.add_char b '-';
        prev_dash := true)
      else (
        (if c >= 'A' && c <= 'Z' then (
           if not !prev_dash then Buffer.add_char b '-';
           Buffer.add_char b (Char.lowercase_ascii c))
         else Buffer.add_char b c);
        prev_dash := false))
    name;
  Buffer.contents b
;;

(* equivalent of (shui/tabler-icon name) — the `ui__icon` +
   `ls-icon-<name>` classes stay for web-parity marking; the old `ti`
   font class is dropped (the icon kind renders its own svg) *)
let icon ?(size = 18.) ?(cls = "") name : Lui_elements.t =
  let cls = if cls = "" then "" else " " ^ cls in
  Lui_elements.icon
    ~name:(`app (kebab name))
    ~point_size:(int_of_float size)
    ~style_class:("ui__icon ls-icon-" ^ name ^ cls)
    []
;;

(* raw icon without the ui__icon wrapper class — cljs renders the
   svg directly where the call site already provides positioning
   (e.g. submenu chevrons) *)
let raw ?(size = 18.) ?(cls = "") name : Lui_elements.t =
  Lui_elements.icon
    ~name:(`app (kebab name))
    ~point_size:(int_of_float size)
    ~style_class:cls
    []
;;

(* bare font glyph without the ui__icon wrapper (existing call sites) *)
let font name : Lui_elements.t =
  Lui_elements.icon ~name:(`app (kebab name)) []
;;
