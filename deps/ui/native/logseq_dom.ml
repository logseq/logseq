(* ported from deps/ui/src/extension/logseq_dom.ml — adds the
   MacOS/SwiftUIHost and MacOS/GPUIHost profiles so logseq-*
   extensions register on the native backends *)
(* logseq-<tag> extension family — raw DOM elements for attributes and DOM
   events the LUI schema does not cover (blockid, data-*, pointer/keyboard).

   The element tag is encoded in the identifier ("logseq-a" -> <a>) because
   adapter create runs before any SetExtensionProp op.

   Props (extension properties):
     attrs  — JSON object {name: value} applied via setAttribute
     events — space-separated DOM event names to listen for
     text   — textContent (or .value for input/textarea)
     style-class / accessibility-identifier — same as standard props

   Emits one event kind:
     dom-event {name: string, payload: JSON string of event fields} *)

open Lui_protocol

let web_profile =
  { Lui_protocol.profile_os = WebOS; Lui_protocol.profile_host = WebHost }


let gpui_profile =
  { Lui_protocol.profile_os = MacOS; Lui_protocol.profile_host = GPUIHost }

(* tags the UI emits; each becomes a "logseq-<tag>" extension component *)
let tags =
  [ "div"; "span"; "a"; "button"; "textarea"; "input"; "img"; "main"
  ; "header"; "h1"; "h2"; "h3"; "h4"; "h5"; "h6"; "p"; "ul"; "li"; "nav"; "section"
  ; "strong"; "em"; "code"; "pre"; "label"; "form"; "select"; "option"
  ; "video"; "audio"; "iframe"; "small"; "kbd"; "table"; "thead"; "tbody"
  ; "tr"; "td"; "th"; "colgroup"; "col"; "br"; "hr"; "canvas"; "article"
  ; "aside"; "footer"; "details"; "summary"; "u"; "mark"; "b"; "i"
  ; "del"; "ins"; "sub"; "blockquote"
    (* SVG (tabler icons render circle/rect/line/polyline/polygon/g/…
       alongside svg/path) *)
  ; "svg"; "path"; "circle"; "rect"; "line"; "polyline"; "polygon"; "g"
  ; "defs"; "use"; "ellipse"; "tspan"; "sup"; "em-emoji"; "raw-text"
  ; "pdf" ]
let identifier tag = "logseq-" ^ tag

(* dedicated widget extensions (logseq-codemirror) nest inside
   logseq-<tag> parents the same way tags nest in each other *)
let child_identifiers =
  List.map identifier tags @ [ Logseq_codemirror.identifier ]

let schema_of tag =
  Lui_extension.component (identifier tag)
    [ web_profile; gpui_profile ]
    true (* standard_children *)
    child_identifiers (* logseq-* elements nest freely *)
    [ Lui_extension.property "attrs" Lui_extension.StringScalar false None
    ; Lui_extension.property "events" Lui_extension.StringScalar false None
    ; Lui_extension.property "text" Lui_extension.StringScalar false None
    ; Lui_extension.property "style-class" Lui_extension.StringScalar false
        None
    ; Lui_extension.property "accessibility-identifier"
        Lui_extension.StringScalar false None
    ]
    [ Lui_extension.event "dom-event"
        [ Lui_extension.event_field "name" Lui_extension.StringScalar true
        ; Lui_extension.event_field "payload" Lui_extension.StringScalar
            false
        ]
    ]

let register registry =
  List.iter
    (fun tag ->
      Lui_extension.register_component registry (schema_of tag))
    tags

let tag_of_identifier name =
  let prefix = "logseq-" in
  let plen = String.length prefix in
  if String.length name > plen
     && String.sub name 0 plen = prefix
  then String.sub name plen (String.length name - plen)
  else "div"

let esc s =
  let b = Buffer.create (String.length s + 2) in
  String.iter
    (fun c ->
      match c with
      | '"' -> Buffer.add_string b "\\\""
      | '\\' -> Buffer.add_string b "\\\\"
      | '\n' -> Buffer.add_string b "\\n"
      | '\t' -> Buffer.add_string b "\\t"
      | _ -> Buffer.add_char b c)
    s;
  Buffer.contents b

let attrs_json attrs =
  "{"
  ^ String.concat ","
      (List.map (fun (k, v) -> "\"" ^ esc k ^ "\":\"" ^ esc v ^ "\"") attrs)
  ^ "}"

let string_of_wire = function StringValue s -> s | _ -> ""

(* [dom ?key ?tag ?attrs ?events ?style_class ?id ?text ?on_dom_event children]
   - attrs: (name, value) pairs emitted as one JSON "attrs" prop
   - events: space-separated DOM names ("keydown click input")
   - on_dom_event: (event_name, payload_json option) -> unit *)
let class_signal (source : 'a Signal.signal) (f : 'a -> string) =
  Signal.map (fun v -> StringValue (f v)) source

let attrs_signal source (f : 'a -> (string * string) list) =
  Signal.map (fun v -> StringValue (attrs_json (f v))) source

(* `reactive f s`-ordered variants (ppx arg order) for call sites
   migrated off lui_ppx *)
let reactive_class f source = class_signal source f

let reactive_attrs f source = attrs_signal source f

let reactive_text f source = Signal.map (fun v -> StringValue (f v)) source

(* A derived signal (Signal.map/cutoff over another signal) keeps its
   upstream subscription alive until the derived signal itself is disposed —
   an unowned map leaks a subscriber that re-runs its transform on every
   source publish forever. Every derived signal handed to dom/dyn/if_/keyed
   is therefore tied to the node's scope; shared state signals
   (Signal.value/state_signal) carry no upstream links and are left alone so
   they survive the unmount. *)
let own context (source : 'a Signal.signal) =
  if !(source.Signal.upstream_subscriptions) <> [] then
    Signal.own_signal context.Lui_ui.ui_scope source
  else
    source

let trace_equal name eq a b =
  let r = eq a b in
  if (not r) && Sys.getenv_opt "LOGSEQ_PERF" <> None then
    Printf.eprintf "[dyn-remount] %s\n%!" name;
  r

(* dyn/if_/keyed own their signal sources inside Lui_elements — derived
   signals are tied to the node scope there, so these wrappers only
   adjust signatures. *)
let dyn ?equal f (source : 'a Signal.signal) : Lui_elements.t =
  Lui_elements.dyn ?equal f source

let if_ ~test children : Lui_elements.t =
  Lui_elements.if_ ~test children

let keyed ~source ~key ~cmp ~mount : Lui_elements.t =
  Lui_elements.keyed ~source ~key ~cmp ~mount

let dom ?key ?(tag = "div") ?(attrs = []) ?(events = "")
    ?(style_class = "")
    ?(style_class_signal : Lui_protocol.wire_value Signal.signal option)
    ?(attrs_signal_v : Lui_protocol.wire_value Signal.signal option)
    ?(text_signal : Lui_protocol.wire_value Signal.signal option)
    ?(id_signal : Lui_protocol.wire_value Signal.signal option)
    ?(id = "") ?(text = "") ?(html = "") ?on_dom_event
    (children : Lui_elements.t list) : Lui_elements.t =
 fun context parent ->
  let node = Lui_ui.extension context (identifier tag) in
  Option.iter (Lui_ui.key context node) key;
  if attrs <> [] then
    Lui_ui.extension_property context node "attrs"
      (StringValue (attrs_json attrs));
  if html <> "" then
    Lui_ui.extension_property context node "html" (StringValue html);
  (* delegated document click/contextmenu handlers (block edit, page-ref,
     bullet zoom, block context menu) need every dom element to emit
     those dom-events — gpui only emits for names the element opted
     into, so opt in here. The apple host's mouse monitors emit click
     for every hit already; emit_event's 60ms coalescing window drops
     the duplicate. On web these bubble to document listeners; on
     gpui emit_event fans out to window_listeners the same way. *)
  let events =
    let toks = List.filter (( <> ) "") (String.split_on_char ' ' events) in
    let toks =
      (if List.mem "click" toks then [] else [ "click" ])
      @ (if List.mem "contextmenu" toks then [] else [ "contextmenu" ])
      @ toks
    in
    String.concat " " toks
  in
  Lui_ui.extension_property context node "events" (StringValue events);
  if style_class <> "" then
    Lui_ui.extension_property context node "style-class"
      (StringValue style_class);
  let bind prop s =
    Lui_ui.extension_property_signal context node prop (own context s)
  in
  Option.iter (bind "style-class") style_class_signal;
  Option.iter (bind "attrs") attrs_signal_v;
  Option.iter (bind "text") text_signal;
  Option.iter (bind "accessibility-identifier") id_signal;
  if id <> "" then
    Lui_ui.extension_property context node "accessibility-identifier"
      (StringValue id);
  if text <> "" then
    Lui_ui.extension_property context node "text" (StringValue text);
  (* every dom-event fans out to the document-level listeners and, for
     events carrying a nodeId, bubbles the event up the extension tree —
     Platform.emit_event invokes each ancestor's registered handler, so
     on_dom_event behaves like a DOM listener. The payload carries
     "target" — an element snapshot with an ancestor chain — so
     closest()/scope resolution work natively. *)
  Option.iter
    (fun handler -> Platform.register_dom_handler node ~events handler)
    on_dom_event;
  Lui_ui.on_event context node (fun raw ->
      match raw with
      | ExtensionEvent (_, ident, "dom-event", values)
        when String.length ident > 7 && String.sub ident 0 7 = "logseq-"
        ->
          let field name =
            Option.map string_of_wire (String_map.find_opt name values)
          in
          let name = Option.value (field "name") ~default:"" in
          let payload = field "payload" in
          (match payload with
           | Some p -> (
               try
                 Platform.emit_event name (Js.Json.parseExn p)
               with _ -> Platform.emit_event name Js.Json.null)
           | None -> Platform.emit_event name Js.Json.null)
      | _ -> ());
  (match parent with
   | Some parent -> Lui_ui.append context parent node
   | None -> ());
  Lui_elements.mount_children context node children;
  node

(* Renders nothing visible: a <raw-text> placeholder that the document
   observer swaps for an empty Text node — a real anchor node for
   dyn/if_/keyed positions that yields zero extra elements (cljs's nil). *)
let nothing : Lui_elements.t =
  dom ~tag:"raw-text" ~attrs:[ ("data-raw-text", "") ] []

(* Mounts children directly into the parent with no wrapper element —
   only valid in static child lists where parent is always Some. *)
let fragment (children : Lui_elements.t list) : Lui_elements.t =
 fun context parent ->
  match parent with
  | Some p ->
      Lui_elements.mount_children context p children;
      p
  | None -> invalid_arg "fragment requires a parent node"
