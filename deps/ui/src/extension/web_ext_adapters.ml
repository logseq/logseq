(* Web adapters for the dedicated widget extensions (em-emoji, katex,
   codemirror, editor): emit plumbing plus per-widget element/property
   handling. The generic lui-dom-<tag> family is adapted upstream by
   [Lui_web_dom_ext] (see Logseq_el.web_adapters). *)

open Lui_protocol
open Lui_web_types
module W = Webapi.Dom

type emit_fn = string -> wire_value String_map.t -> unit
type handler_tbl = (string, Js.Json.t -> unit) Hashtbl.t

external emit_get : W.Element.t -> emit_fn Js.Undefined.t = "__lsEmit"
  [@@mel.get]

external emit_set : W.Element.t -> emit_fn -> unit = "__lsEmit" [@@mel.set]

external handlers_get : W.Element.t -> handler_tbl Js.Undefined.t =
  "__lsHandlers" [@@mel.get]

external handlers_set : W.Element.t -> handler_tbl -> unit = "__lsHandlers"
  [@@mel.set]

external remove_listener :
  W.Element.t -> string -> (Js.Json.t -> unit) -> unit = "removeEventListener"
  [@@mel.send]

(* -- shared helpers -- *)

let is_svg_tag el =
  match W.Element.tagName el with
  | "svg" | "path" | "circle" | "rect" | "line" | "polyline" | "polygon"
  | "g" | "defs" | "use" | "ellipse" | "tspan" ->
      true
  | _ -> false

let set_class el s =
  if is_svg_tag el then W.Element.setAttribute "class" s el
  else W.Element.setClassName el s

let handlers_of el =
  match Js.Undefined.toOption (handlers_get el) with
  | Some t -> t
  | None ->
      let t = Hashtbl.create 8 in
      handlers_set el t;
      t

let cleanup el =
  let tbl = handlers_of el in
  Hashtbl.iter (fun name f -> remove_listener el name f) tbl;
  Hashtbl.reset tbl

(* -- dedicated widget adapters -- *)

(* logseq-em-emoji: a real <em-emoji> custom element; the name prop
   lands on the id attr that emoji-mart's upgrade reads, data-emoji
   carries the resolved native char for non-mart hosts *)
let emoji_adapter : web_extension_adapter =
  let set_property el prop value =
    match (prop, value) with
    | "name", StringValue s -> W.Element.setAttribute "id" s el
    | "data-emoji", StringValue s ->
        if s = "" then W.Element.removeAttribute "data-emoji" el
        else W.Element.setAttribute "data-emoji" s el
    | "style-class", StringValue s -> set_class el s
    | _ -> ()
  in
  { web_extension_create =
      (fun _node document emit ->
        let el = W.Document.createElement "em-emoji" document in
        emit_set el emit;
        el)
  ; web_extension_set_property = set_property
  ; web_extension_remove_property =
      (fun el prop ->
        match prop with
        | "name" -> W.Element.removeAttribute "id" el
        | "data-emoji" -> W.Element.removeAttribute "data-emoji" el
        | "style-class" -> set_class el ""
        | _ -> ())
  ; web_extension_cleanup = cleanup
  }

(* logseq-katex: the slot the render_libs doc-scan fills via
   katex.render — always a <span> (adapter create runs before any prop
   op, so the tag cannot depend on inline); a block slot carries
   display:block instead, matching the old div.latex layout exactly *)
let katex_adapter : web_extension_adapter =
  let set_property el prop value =
    match (prop, value) with
    | "style-class", StringValue s -> set_class el s
    | "accessibility-identifier", StringValue s ->
        W.Element.setAttribute "id" s el
    | "inline", BoolValue inline ->
        if inline then W.Element.removeAttribute "style" el
        else W.Element.setAttribute "style" "display:block" el
    | "display", BoolValue b ->
        (* render_katex_one resolves mode from the pending registry by
           id; data-display is a self-describing fallback since the
           mount is always a span now (tagName no longer tells block
           from inline) *)
        W.Element.setAttribute "data-display"
          (if b then "true" else "false")
          el
    | _ -> ()
  in
  { web_extension_create =
      (fun _node document emit ->
        let el = W.Document.createElement "span" document in
        emit_set el emit;
        el)
  ; web_extension_set_property = set_property
  ; web_extension_remove_property =
      (fun el prop ->
        match prop with
        | "style-class" -> set_class el ""
        | "accessibility-identifier" -> W.Element.removeAttribute "id" el
        | "inline" -> W.Element.removeAttribute "style" el
        | "display" -> W.Element.removeAttribute "data-display" el
        | _ -> ())
  ; web_extension_cleanup = cleanup
  }

let adapters : web_extension_adapter String_map.t =
  String_map.empty
  |> String_map.add Logseq_emoji.identifier emoji_adapter
  |> String_map.add Logseq_katex.identifier katex_adapter
  |> String_map.add Logseq_codemirror.identifier Cm_adapter.adapter
