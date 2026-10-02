(* Native twin of icon/icon_picker.ml — the picker is rendered by the
   Swift logseq-icon-picker extension; open calls emit a dom-event the
   host turns into an NSPopover. *)

module E = Editor_dom

type choice =
  | Emoji of string
  | Tabler of (string * string option)
  | Remove
type picker_opts = { emoji_only : bool; sub : bool }

let open_picker_with_opts ~(anchor : Js.Json.t) ~(del : bool)
    ~(opts : picker_opts) ~(on_chosen : choice -> unit) : E.el =
  ignore del; ignore opts; ignore on_chosen;
  Host.dom_op "open-icon-picker" (Js.Json.stringify anchor);
  anchor

let open_picker ~(anchor : Js.Json.t) ~(del : bool)
    ~(on_chosen : choice -> unit) : unit =
  ignore
    (open_picker_with_opts ~anchor ~del
       ~opts:{ emoji_only = false; sub = false } ~on_chosen)

let open_emoji_picker ~(anchor : Js.Json.t)
    ~(on_chosen : choice -> unit) : unit =
  ignore
    (open_picker_with_opts ~anchor ~del:false
       ~opts:{ emoji_only = true; sub = false } ~on_chosen)

let icon_el ?(size = 18.) ?(cls = "") (c : choice) : E.el =
  ignore size; ignore cls;
  let el = E.create_element "i" in
  (match c with
   | Emoji id -> E.el_set_class el ("ls-icon-emoji " ^ id)
   | Tabler (id, _) -> E.el_set_class el ("ti ti-" ^ id)
   | Remove -> ());
  el

let em_emoji_el ?(cls = "") (id : string) : E.el =
  ignore cls;
  E.create_element "span"
