(* logseq-codemirror extension — host-side CodeMirror embed.

   source-role "block": the web adapter builds
   textarea#edit-block-<uuid>[data-lang] inside the extension node and
   mounts the vendored CodeMirror 5 on it (editor/code_mirror.ml owns the
   instance). The DOM contract the rest of the codebase relies on —
   .code-editor textarea, #edit-block-<uuid> lookups, .CodeMirror
   wrappers — is emitted by the adapter, so document scans and
   closest() callers keep working unchanged.

   source-role "query": the web adapter builds the cljs fake-CM surface
   .CodeMirror > pre.CodeMirror-line[contenteditable][role=textbox] and
   reports edits over the cm-event channel; Enter/Escape preventDefault
   stays inside the adapter's listener.

   Emits one event kind:
     cm-event {name: string (required), value/key: string (optional)} *)

open Lui_protocol

let identifier = "logseq-codemirror"

let web_profile =
  { Lui_protocol.profile_os = WebOS; Lui_protocol.profile_host = WebHost }

let schema =
  Lui_extension.component identifier [ web_profile ]
    false (* interior DOM is adapter-owned; no LUI children *)
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
