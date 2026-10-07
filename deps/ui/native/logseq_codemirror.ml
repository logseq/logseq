(* ported from deps/ui/src/extension/logseq_codemirror.ml — adds the
   MacOS/SwiftUIHost and MacOS/GPUIHost profiles so logseq-codemirror
   registers on the native backends *)
(* logseq-codemirror extension — host-side CodeMirror embed.

   The web adapter owns the CodeMirror mount/unmount lifecycle (block
   role mounts the vendored CM5 on an interior textarea; query role
   builds the fake-CM contenteditable surface). On the native backends
   the extension registers with a platform-gated impl — see
   LogseqExtensions.swift / LogseqCodeMirror.swift for the native host.

   Emits one event kind:
     cm-event {name: string (required), value/key: string (optional)} *)

open Lui_protocol

let identifier = "logseq-codemirror"

let web_profile =
  { Lui_protocol.profile_os = WebOS; Lui_protocol.profile_host = WebHost }


let gpui_profile =
  { Lui_protocol.profile_os = MacOS; Lui_protocol.profile_host = GPUIHost }

let schema =
  Lui_extension.component identifier
    [ web_profile; gpui_profile ]
    false (* interior is adapter-owned; no LUI children *)
    []
    [ Lui_extension.property "uuid" Lui_extension.StringScalar false None
    ; Lui_extension.property "lang" Lui_extension.StringScalar false None
    ; Lui_extension.property "value" Lui_extension.StringScalar false None
    ; Lui_extension.property "read-only" Lui_extension.BoolScalar false
        None
    ; Lui_extension.property "source-role" Lui_extension.StringScalar
        false None
    ; Lui_extension.property "style-class" Lui_extension.StringScalar
        false None
    ; Lui_extension.property "accessibility-identifier"
        Lui_extension.StringScalar false None
    ]
    [ Lui_extension.event "cm-event"
        [ Lui_extension.event_field "name" Lui_extension.StringScalar
            true
        ; Lui_extension.event_field "value" Lui_extension.StringScalar
            false
        ; Lui_extension.event_field "key" Lui_extension.StringScalar
            false
        ]
    ]

let register registry =
  Lui_extension.register_component registry schema

let string_of_wire = function StringValue s -> s | _ -> ""

(* [cm ~source_role ...] — source_role is "block" or "query". on_event
   receives the decoded cm-event fields: ~name, ~value, ~key. source-role
   is emitted last so the web adapter can materialize its interior DOM
   once every build prop has landed. *)
let cm ?key ?(uuid = "") ?(lang = "") ?(value = "") ?(read_only = false)
    ?(source_role = "block") ?(id = "") ?(style_class = "") ?on_event ()
    : Lui_elements.t =
 fun context parent ->
  let node = Lui_ui.extension context identifier in
  Option.iter (Lui_ui.key context node) key;
  Lui_ui.extension_property context node "uuid" (StringValue uuid);
  if lang <> "" then
    Lui_ui.extension_property context node "lang" (StringValue lang);
  Lui_ui.extension_property context node "value" (StringValue value);
  if read_only then
    Lui_ui.extension_property context node "read-only" (BoolValue true);
  Lui_ui.extension_property context node "source-role"
    (StringValue source_role);
  if id <> "" then
    Lui_ui.extension_property context node "accessibility-identifier"
      (StringValue id);
  if style_class <> "" then
    Lui_ui.extension_property context node "style-class"
      (StringValue style_class);
  Option.iter
    (fun handler ->
      Lui_ui.on_event context node (fun raw ->
          match raw with
          | ExtensionEvent (_, ident, "cm-event", values)
            when ident = identifier ->
              let field name =
                Option.map string_of_wire (String_map.find_opt name values)
              in
              handler ~name:(Option.value (field "name") ~default:"")
                ~value:(field "value") ~key:(field "key")
          | _ -> ()))
    on_event;
  (match parent with
   | Some p -> Lui_ui.append context p node
   | None -> ());
  node
