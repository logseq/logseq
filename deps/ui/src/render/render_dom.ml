(* Shared DOM helpers for the render area.

   [el] is [Logseq_dom.dom] with a fallback for tags that are not yet
   registered in [Logseq_dom.tags].  The runtime raises
   [invalid_arg "unknown extension identifier"] for unregistered
   extension identifiers, so unregistered tags are emitted as their
   nearest registered equivalent plus a [data-tag] attribute recording
   the intended tag.

   NOTE(render): tags not yet registered in [Logseq_dom.tags] mount as
   the fallback below plus [data-tag]; register new tags centrally in
   src/extension/logseq_dom.ml so real tags are emitted. *)

open Lui_elements

let registered_tag tag = List.mem tag Logseq_dom.tags

let fallback_tag = function
  | _ -> "span"

let el ?key ~tag ?(attrs = []) ?(events = "") ?(style_class = "")
    ?style_class_signal ?attrs_signal_v ?text_signal ?id_signal ?(id = "")
    ?(text = "") ?on_dom_event children =
  let tag, attrs =
    if registered_tag tag then (tag, attrs)
    else (fallback_tag tag, attrs @ [ ("data-tag", tag) ])
  in
  Logseq_dom.dom ?key ~tag ~attrs ~events ~style_class ?style_class_signal
    ?attrs_signal_v ?text_signal ?id_signal ~id ~text ?on_dom_event children

(* Plain text run — a real DOM text node. cljs hiccup emits raw strings
   interleaved with elements; LUI's own text nodes render as
   span.lui-text (an extra element), so a <raw-text> placeholder is
   mounted at the exact DOM position and the MutationObserver in
   Editor_dom swaps it for a real text node. *)
let txt (s : string) : t =
 fun context parent ->
  Editor_dom.ensure_raw_text_observer ();
  Logseq_dom.dom ~tag:"raw-text" ~attrs:[ ("data-raw-text", s) ] []
    context parent

let text_of_class_signal source f =
  Signal.map (fun v -> Lui_protocol.StringValue (f v)) source
