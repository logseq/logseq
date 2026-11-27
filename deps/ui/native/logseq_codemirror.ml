(* ported from deps/ui/src/extension/logseq_codemirror.ml — adds the
   native profiles so logseq-codemirror registers on the native
   backends *)
(* logseq-codemirror extension — host-side CodeMirror embed.

   The web adapter owns the CodeMirror mount/unmount lifecycle (block
   role mounts the vendored CM5 on an interior textarea; query role
   builds the fake-CM contenteditable surface). On the native backends
   the extension shares its event schema with the OCaml host.

   Emits one event kind:
     cm-event {name: string (required), value/key: string (optional)} *)

open Lui_protocol
open Lui_elements

let identifier = "logseq-codemirror"

let web_profile =
  { Lui_protocol.profile_os = WebOS; Lui_protocol.profile_host = WebHost }


let native_profile =
  { Lui_protocol.profile_os = MacOS; Lui_protocol.profile_host = GenericHost }

let native_profiles =
  [ native_profile
  ; { Lui_protocol.profile_os = LinuxOS; Lui_protocol.profile_host = GenericHost }
  ; { Lui_protocol.profile_os = WindowsOS
    ; Lui_protocol.profile_host = GenericHost
    }
  ]

let schema =
  Lui_extension.component identifier
    (web_profile :: native_profiles)
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
   receives the decoded cm-event fields: ~name, ~value, ~key.

   The OCaml host has no vendored CodeMirror instance. Block sources use
   the host's real multiline textarea primitive instead of an unimplemented
   extension shell; calc output is a sibling in the same retained tree and
   follows the textarea's local edit signal. Query sources keep the
   extension contract for hosts that implement it. *)
let extension_cm ?key ?(uuid = "") ?(lang = "") ?(value = "")
    ?(read_only = false) ?(source_role = "block") ?(id = "")
    ?(style_class = "") ?on_event () : Lui_elements.t =
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

let cm ?key ?(uuid = "") ?(lang = "") ?(value = "") ?(read_only = false)
    ?(source_role = "block") ?(id = "") ?(style_class = "") ?on_event ()
    : Lui_elements.t =
 fun context parent ->
  if source_role <> "block" then
    extension_cm ?key ~uuid ~lang ~value ~read_only ~source_role ~id
      ~style_class ?on_event () context parent
  else
    let source = Signal.state context.Lui_ui.ui_scheduler value in
    let accessibility_identifier =
      if id <> "" then Some id
      else if uuid <> "" then Some ("edit-block-" ^ uuid)
      else None
    in
    let style_class = if style_class = "" then None else Some style_class in
    let editor =
      Lui_elements.textarea ?key ~grow:1.0 ~text:value ~read_only
        ?accessibility_identifier ?style_class
        ~data_attrs:[ ("data-lang", lang) ]
        ~on_input:(fun next ->
          Signal.set source next;
          match on_event with
          | Some handler ->
              handler ~name:"input" ~value:(Some next) ~key:None
          | None -> ())
        ~on_navigation_key:(fun nav ->
          if nav.key = "Enter" && nav.shift then
            match on_event with
            | Some handler ->
                handler ~name:"key" ~value:(Some (Signal.get_state source))
                  ~key:(Some "Shift-Enter")
            | None -> ())
        []
    in
    match parent with
    | Some p ->
        ignore (editor context (Some p));
        if lang = "calc" then begin
          let output =
            reactive
              (fun source -> Render_calc.output_el source)
              (Signal.value source)
          in
          ignore (output context (Some p))
        end;
        p
    | None -> invalid_arg "logseq-codemirror block surface requires a parent"
