(* Web adapter for the logseq-<tag> extension family. *)

open Lui_protocol
open Lui_web_types
module W = Webapi.Dom

type emit_fn = string -> wire_value String_map.t -> unit
type handler_tbl = (string, Js.Json.t -> unit) Hashtbl.t

external parse_json : string -> Js.Json.t = "parse" [@@mel.scope "JSON"]

external obj_keys : Js.Json.t -> string array = "keys" [@@mel.scope "Object"]

external json_get : Js.Json.t -> string -> Js.Json.t Js.Undefined.t = ""
  [@@mel.get_index]

external prop_undef : Js.Json.t -> string -> 'a Js.Undefined.t = ""
  [@@mel.get_index]

external prop_get : Js.Json.t -> string -> Js.Json.t = "" [@@mel.get_index]

external closest_json : Js.Json.t -> string -> Js.Json.t = "closest"
  [@@mel.send]

external get_attr_json : Js.Json.t -> string -> string Js.Nullable.t =
  "getAttribute" [@@mel.send]

external get_attr_opt : W.Element.t -> string -> string option =
  "getAttribute" [@@mel.send] [@@mel.return nullable]

external managed_get : W.Element.t -> string Js.Undefined.t = "__lsAttrs"
  [@@mel.get]

external managed_set : W.Element.t -> string -> unit = "__lsAttrs" [@@mel.set]

external emit_get : W.Element.t -> emit_fn Js.Undefined.t = "__lsEmit"
  [@@mel.get]

external emit_set : W.Element.t -> emit_fn -> unit = "__lsEmit" [@@mel.set]

external handlers_get : W.Element.t -> handler_tbl Js.Undefined.t =
  "__lsHandlers" [@@mel.get]

external handlers_set : W.Element.t -> handler_tbl -> unit = "__lsHandlers"
  [@@mel.set]

external set_value : W.Element.t -> string -> unit = "value" [@@mel.set]

external set_inner_html : W.Element.t -> string -> unit = "innerHTML"
  [@@mel.set]

external get_value : W.Element.t -> string = "value" [@@mel.get]

external create_element_ns : string -> string -> W.Element.t
  = "createElementNS" [@@mel.scope "document"]

external add_listener :
  W.Element.t -> string -> (Js.Json.t -> unit) -> unit = "addEventListener"
  [@@mel.send]

external remove_listener :
  W.Element.t -> string -> (Js.Json.t -> unit) -> unit =
  "removeEventListener" [@@mel.send]

external prevent_default : Js.Json.t -> unit = "preventDefault"
  [@@mel.send]

external owner_document : W.Element.t -> W.Document.t = "ownerDocument"
  [@@mel.get]

external create_text_node : W.Document.t -> string -> W.Node.t =
  "createTextNode" [@@mel.send]

external first_child_node : W.Element.t -> W.Node.t Js.Null.t = "firstChild"
  [@@mel.get]

external node_type : W.Node.t -> int = "nodeType" [@@mel.get]

external set_node_data : W.Node.t -> string -> unit = "data" [@@mel.set]

external node_remove : W.Node.t -> unit = "remove" [@@mel.send]

(* <raw-text> placeholders are swapped for real Text nodes by the
   document observer; the placeholder keeps a handle on its Text node
   here so attr updates and cleanup can reach it after the swap *)
external raw_text_node_get : W.Element.t -> W.Node.t Js.Undefined.t =
  "__lsText" [@@mel.get]

external insert_before_node :
  W.Element.t -> W.Node.t -> W.Node.t -> unit = "insertBefore" [@@mel.send]

external append_child_node : W.Element.t -> W.Node.t -> unit = "appendChild"
  [@@mel.send]

(* A textContent write would wipe LUI-tracked children the reconciler still
   expects to remove itself (e.g. the <br> an empty block title carries), so
   the text lives in a leading text node instead. Children inserts index
   Element.children, which ignores text nodes. *)
let set_text el s =
  let document = owner_document el in
  match Js.Null.toOption (first_child_node el) with
  | Some n when node_type n = 3 -> set_node_data n s
  | Some n -> insert_before_node el (create_text_node document s) n
  | None -> append_child_node el (create_text_node document s)

let clear_text el =
  match Js.Null.toOption (first_child_node el) with
  | Some n when node_type n = 3 -> set_node_data n ""
  | _ -> ()

let is_input_tag el =
  match String.lowercase_ascii (W.Element.tagName el) with
  | "input" | "textarea" | "select" -> true
  | _ -> false

(* SVGElement.className is a read-only SVGAnimatedString — must go through
   setAttribute *)
let is_svg_tag el =
  match String.lowercase_ascii (W.Element.tagName el) with
  | "svg" | "path" | "circle" | "rect" | "line" | "polyline" | "polygon"
  | "g" | "defs" | "use" | "ellipse" | "tspan" -> true
  | _ -> false

let set_class el s =
  if is_svg_tag el then W.Element.setAttribute "class" s el
  else W.Element.setClassName el s

(* -- attrs prop -- *)

let json_string v = Option.value (Js.Json.decodeString v) ~default:""

let apply_attrs el json =
  let prev =
    managed_get el
    |> Js.Undefined.toOption
    |> Option.value ~default:""
    |> String.split_on_char ','
    |> List.filter (fun s -> s <> "")
  in
  let obj = parse_json json in
  let keys = Array.to_list (obj_keys obj) in
  List.iter
    (fun k ->
      match Js.Undefined.toOption (json_get obj k) with
      | Some v -> W.Element.setAttribute k (json_string v) el
      | None -> ())
    keys;
  List.iter
    (fun k ->
      if not (List.mem k keys) then W.Element.removeAttribute k el)
    prev;
  managed_set el (String.concat "," keys);
  (* after the swap the placeholder is detached and setAttribute writes
     are invisible — mirror the text payload onto the live Text node *)
  (match Js.Undefined.toOption (raw_text_node_get el) with
   | Some tn ->
       set_node_data tn
         (match Js.Undefined.toOption (json_get obj "data-raw-text") with
          | Some v -> json_string v
          | None -> "")
   | None -> ())

(* -- events prop -- *)

let is_undefined_json v =
  match Js.Json.classify v with Js.Json.JSONFalse -> true | _ -> false

let json_of_event name (ev : Js.Json.t) : string =
  let d = Js.Dict.empty () in
  let put name v = if not (is_undefined_json v) then Js.Dict.set d name v in
  put "type" (Js.Json.string name);
  let s k = Option.iter (fun v -> put k (Js.Json.string v)) in
  let b k = Option.iter (fun v -> put k (Js.Json.boolean v)) in
  let n k = Option.iter (fun v -> put k (Js.Json.number v)) in
  s "key" (Js.Undefined.toOption (prop_undef ev "key"));
  s "code" (Js.Undefined.toOption (prop_undef ev "code"));
  s "data" (Js.Undefined.toOption (prop_undef ev "data"));
  s "inputType" (Js.Undefined.toOption (prop_undef ev "inputType"));
  b "shiftKey" (Js.Undefined.toOption (prop_undef ev "shiftKey"));
  b "ctrlKey" (Js.Undefined.toOption (prop_undef ev "ctrlKey"));
  b "metaKey" (Js.Undefined.toOption (prop_undef ev "metaKey"));
  b "altKey" (Js.Undefined.toOption (prop_undef ev "altKey"));
  b "repeat" (Js.Undefined.toOption (prop_undef ev "repeat"));
  b "isComposing" (Js.Undefined.toOption (prop_undef ev "isComposing"));
  n "button" (Js.Undefined.toOption (prop_undef ev "button"));
  n "buttons" (Js.Undefined.toOption (prop_undef ev "buttons"));
  n "clientX" (Js.Undefined.toOption (prop_undef ev "clientX"));
  n "clientY" (Js.Undefined.toOption (prop_undef ev "clientY"));
  n "which" (Js.Undefined.toOption (prop_undef ev "which"));
  (match Js.Undefined.toOption (prop_undef ev "target") with
   | Some t -> (
       (match Js.Undefined.toOption (prop_undef t "value") with
        | Some v -> put "value" (Js.Json.string v)
        | None -> ());
       (match Js.Undefined.toOption (prop_undef t "checked") with
        | Some v -> put "checked" (Js.Json.boolean v)
        | None -> ());
       (match Js.Undefined.toOption (prop_undef t "id") with
        | Some v -> put "targetId" (Js.Json.string v)
        | None -> ());
       (match Js.Undefined.toOption (prop_undef t "className") with
        | Some v -> put "targetClass" (Js.Json.string v)
        | None -> ());
       (* true when the click target sits inside a control/interactive
          region — lets container-level click handlers (e.g. page-title
          starting title edit) skip clicks aimed at buttons, fold controls,
          or mounted property areas *)
       if
         Js.Undefined.toOption (prop_undef t "closest") <> None
       then (
         (* nearest anchor href — readme/comment containers delegate
            <a> clicks (cljs local-markdown-display onClick) *)
         let a = closest_json t "a[href]" in
         if not (Js.Json.test a Js.Json.Null) then
           s "href" (Js.Nullable.toOption (get_attr_json a "href"));
         if
           not
             (Js.Json.test
                (closest_json t
                   "a, button, input, textarea, select, summary, \
                    .block-control-wrap, .bullet-container, \
                    .ls-properties-area, .ls-page-title-actions, \
                    .lsp-hook-ui-slot")
                Js.Json.Null)
         then put "interactive" (Js.Json.boolean true)))
   | None -> ());
  Js.Json.stringify (Js.Json.object_ d)

let handlers_of el =
  match Js.Undefined.toOption (handlers_get el) with
  | Some h -> h
  | None ->
      let h = Hashtbl.create 8 in
      handlers_set el h;
      h

let apply_events el names =
  (* The emit closure is bound to the node's runtime id at create time; read
     it lazily so a reused element always emits for its current node. *)
  let current_emit () =
    match Js.Undefined.toOption (emit_get el) with
    | Some e -> e
    | None -> fun _ _ -> ()
  in
  let tbl = handlers_of el in
  let wanted =
    names
    |> String.split_on_char ' '
    |> List.filter (fun s -> s <> "")
  in
  Hashtbl.iter
    (fun name f ->
      if not (List.mem name wanted) then (
        remove_listener el name f;
        Hashtbl.remove tbl name))
    (Hashtbl.copy tbl);
  List.iter
    (fun name ->
      if not (Hashtbl.mem tbl name) then (
        let f (ev : Js.Json.t) =
          if name = "contextmenu" then prevent_default ev;
          (* data-capture-click hosts handle anchor clicks themselves
             (e.g. .cp__plugins-details opens them externally) *)
          if
            name = "click"
            && get_attr_opt el "data-capture-click" <> None
          then
            (match Js.Undefined.toOption (prop_undef ev "target") with
             | Some t ->
                 if
                   not
                     (Js.Json.test (closest_json t "a[href]") Js.Json.Null)
                 then prevent_default ev
             | None -> ());
          (* keep textarea textContent matching its value so innerText and
             Playwright :has-text see what was typed *)
          if name = "input" && W.Element.tagName el = "TEXTAREA" then
            W.Element.setTextContent el (get_value el);
          let payload = json_of_event name ev in
          current_emit () "dom-event"
            (String_map.empty
            |> String_map.add "name" (StringValue name)
            |> String_map.add "payload" (StringValue payload))
        in
        add_listener el name f;
        Hashtbl.replace tbl name f))
    wanted

(* -- adapter -- *)

let set_property el prop value =
  match (prop, value) with
  | "attrs", StringValue s -> apply_attrs el s
  | "events", StringValue s -> apply_events el s
  | "text", StringValue s ->
      if is_input_tag el then (
        (* skip redundant .value writes — assigning resets the caret *)
        if get_value el <> s then set_value el s;
        (* textarea: keep textContent in sync so innerText/:has-text and
           e2e value assertions observe the buffer *)
        if W.Element.tagName el = "TEXTAREA" then
          W.Element.setTextContent el s)
      else set_text el s
  | "style-class", StringValue s -> set_class el s
  | "html", StringValue s -> set_inner_html el s
  | "accessibility-identifier", StringValue s ->
      W.Element.setAttribute "id" s el
  | _ -> ()

let remove_property el prop =
  match prop with
  | "attrs" -> apply_attrs el "{}"
  | "events" -> apply_events el ""
  | "text" ->
      if is_input_tag el then begin
        set_value el "";
        W.Element.setTextContent el ""
      end
      else clear_text el
  | "style-class" -> set_class el ""
  | "html" -> set_inner_html el ""
  | "accessibility-identifier" -> W.Element.removeAttribute "id" el
  | _ -> ()

let cleanup el =
  (* drop the swapped-in Text node too — removeChild ops target the
     detached placeholder, which cannot reach it *)
  (match Js.Undefined.toOption (raw_text_node_get el) with
   | Some tn -> node_remove tn
   | None -> ());
  let tbl = handlers_of el in
  Hashtbl.iter (fun name f -> remove_listener el name f) tbl;
  Hashtbl.reset tbl

(* createElement alone yields HTMLUnknownElement for svg children — the
   SVG namespace list mirrors the tags registered for icon rendering *)
let svg_tags =
  [ "svg"; "path"; "circle"; "rect"; "line"; "polyline"; "polygon"; "g"
  ; "defs"; "use"; "ellipse"; "tspan" ]

let adapter_of_tag tag : web_extension_adapter =
  { web_extension_create =
      (fun _node document emit ->
        let el =
          if List.mem tag svg_tags then
            create_element_ns "http://www.w3.org/2000/svg" tag
          else W.Document.createElement tag document
        in
        emit_set el emit;
        el)
  ; web_extension_set_property = set_property
  ; web_extension_remove_property = remove_property
  ; web_extension_cleanup = cleanup
  }

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
  List.fold_left
    (fun acc tag ->
      String_map.add (Logseq_dom.identifier tag) (adapter_of_tag tag) acc)
    String_map.empty Logseq_dom.tags
  |> String_map.add Logseq_emoji.identifier emoji_adapter
  |> String_map.add Logseq_katex.identifier katex_adapter
  |> String_map.add Logseq_codemirror.identifier Cm_adapter.adapter
