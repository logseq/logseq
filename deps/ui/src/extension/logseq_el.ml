(* Raw-element escape — the renamed `dom` (component-residuals.md:
   "D.el/dom stays as the *documented* raw-element escape for user
   markup; rename if dom must die").

   Emits `lui-dom-<tag>` extension nodes — the upstream raw-DOM family
   (`logseq/lui` platform/web/melange/extensions/lui_web_dom_ext.ml)
   rather than the retired app-side `logseq-<tag>` family. Schemas are
   registered here (a superset of the upstream tag list) so callers
   keep arbitrary-tag coverage; the web adapter comes from
   [Lui_web_dom_ext.adapter_of_tag].

   Only user-authored markup (`@@html` fragments, `:view` hiccup) and
   elements that genuinely need verbatim attrs may use [el]; typed
   Lui_elements kinds cover everything else.

   Props (extension properties):
     attrs  — JSON object {name: value} applied via setAttribute
     events — space-separated DOM event names to listen for
     text   — textContent (or .value for input/textarea)
     style-class / accessibility-identifier — same as standard props

   Emits one event kind:
     dom-event {name: string, payload: JSON string of event fields} *)

open Lui_protocol
open Lui_web_types

let web_profile =
  { Lui_protocol.profile_os = WebOS; Lui_protocol.profile_host = WebHost }

(* markup tags the escape covers; each becomes a "lui-dom-<tag>"
   extension component *)
let tags =
  [ "div"; "span"; "a"; "button"; "textarea"; "input"; "img"; "main"
  ; "header"; "h1"; "h2"; "h3"; "h4"; "h5"; "h6"; "p"; "ul"; "ol"; "li"
  ; "nav"; "section"; "strong"; "em"; "code"; "pre"; "label"; "form"
  ; "select"; "option"; "video"; "audio"; "iframe"; "small"; "kbd"
  ; "table"; "thead"; "tbody"; "tr"; "td"; "th"; "br"; "hr"; "canvas"
  ; "article"; "aside"; "footer"; "details"; "summary"; "u"; "mark"; "b"
  ; "i"; "del"; "ins"; "sub"; "blockquote"
    (* SVG (tabler icons render circle/rect/line/polyline/polygon/g/…
       alongside svg/path) *)
  ; "svg"; "path"; "circle"; "rect"; "line"; "polyline"; "polygon"; "g"
  ; "defs"; "use"; "ellipse"; "tspan"; "sup" ]

let identifier tag = "lui-dom-" ^ tag

(* dedicated widget extensions nest inside raw-element parents the same
   way tags nest in each other *)
let child_identifiers =
  List.map identifier tags
  @ [ Logseq_emoji.identifier; Logseq_katex.identifier ]

let schema_of tag =
  Lui_extension.component (identifier tag) [ web_profile ]
    true (* standard_children *)
    child_identifiers (* raw elements nest freely *)
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

let web_adapters : web_extension_adapter String_map.t =
  List.fold_left
    (fun acc tag ->
      String_map.add (identifier tag)
        (Lui_web_dom_ext.adapter_of_tag tag) acc)
    String_map.empty tags

let tag_of_identifier name =
  let prefix = "lui-dom-" in
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
   source publish forever. Every derived signal handed to an extension
   prop or if_/keyed is therefore tied to the node's scope; shared state
   signals (Signal.value/state_signal) carry no upstream links and are
   left alone so they survive the unmount. *)
let own context (source : 'a Signal.signal) =
  if !(source.Signal.upstream_subscriptions) <> [] then
    Signal.own_signal context.Lui_ui.ui_scope source
  else
    source

(* [el ?key ?tag ?attrs ?events ?style_class ?id ?text ?on_dom_event
   children] — the raw-element escape.
   - attrs: (name, value) pairs emitted as one JSON "attrs" prop
   - events: space-separated DOM names ("keydown click input")
   - on_dom_event: (event_name, payload_json option) -> unit *)
let el ?key ?(tag = "div") ?(attrs = []) ?(events = "")
    ?(style_class = "")
    ?(style_class_signal : Lui_protocol.wire_value Signal.signal option)
    ?(attrs_signal_v : Lui_protocol.wire_value Signal.signal option)
    ?(text_signal : Lui_protocol.wire_value Signal.signal option)
    ?(id_signal : Lui_protocol.wire_value Signal.signal option)
    ?(id = "") ?(text = "") ?on_dom_event
    (children : Lui_elements.t list) : Lui_elements.t =
 fun context parent ->
  let node = Lui_ui.extension context (identifier tag) in
  Option.iter (Lui_ui.key context node) key;
  if attrs <> [] then
    Lui_ui.extension_property context node "attrs"
      (StringValue (attrs_json attrs));
  if events <> "" then
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
  Option.iter
    (fun handler ->
      Lui_ui.on_event context node (fun raw ->
          match raw with
          | ExtensionEvent (_, ident, "dom-event", values)
            when String.length ident > 8
                 && String.sub ident 0 8 = "lui-dom-" ->
              let field name =
                Option.map string_of_wire (String_map.find_opt name values)
              in
              handler
                (Option.value (field "name") ~default:"")
                (field "payload")
          | _ -> ()))
    on_dom_event;
  (match parent with
   | Some parent -> Lui_ui.append context parent node
   | None -> ());
  Lui_elements.mount_children context node children;
  node

(* the native twin's invisible document-event carrier — a no-op on web
   (real DOM events reach document listeners directly) *)
let carrier : Lui_elements.t = Lui_elements.box ~display:`contents []

(* Renders nothing visible: a `display:contents` box — a real anchor node
   for dyn/if_/keyed positions that yields zero layout (cljs's nil). *)
let nothing : Lui_elements.t = Lui_elements.box ~display:`contents []

(* Mounts children directly into the parent with no wrapper element —
   only valid in static child lists where parent is always Some. *)
let fragment (children : Lui_elements.t list) : Lui_elements.t =
 fun context parent ->
  match parent with
  | Some p ->
      Lui_elements.mount_children context p children;
      p
  | None -> invalid_arg "fragment requires a parent node"
