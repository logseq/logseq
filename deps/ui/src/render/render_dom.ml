(* Shared DOM helpers for the render area.

   [el] is [Logseq_dom.dom] with a fallback for tags that are not yet
   registered in [Logseq_dom.tags].  The runtime raises
   [invalid_arg "unknown extension identifier"] for unregistered
   extension identifiers, so unregistered tags are emitted as their
   nearest registered equivalent plus a [data-tag] attribute recording
   the intended tag.

   TODO(render): "h4" "h5" "h6" "ins" "del" "sup" "sub" "blockquote" and
   "em-emoji" are not in Logseq_dom.tags.  Add them centrally in
   src/extension/logseq_dom.ml so real tags are emitted (e2e asserts on
   h4..h6 and em-emoji[id]); until then this module maps them to
   fallbacks. *)

open Lui_elements

let registered_tag tag = List.mem tag Logseq_dom.tags

let fallback_tag = function
  | "ins" -> "u" (* underline semantics *)
  | "em-emoji" -> "em"
  | "h4" | "h5" | "h6" -> "h3"
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

(* Plain text run — mounts a Text node (renders as a bare span on web). *)
let txt (s : string) : t =
 fun context parent ->
  let node = Lui_ui.text context s in
  attach context parent node;
  node

let text_of_class_signal source f =
  Signal.map (fun v -> Lui_protocol.StringValue (f v)) source
