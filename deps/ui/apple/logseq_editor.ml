(* logseq-editor extension — apple twin of
   src/extension/logseq_editor.ml: adds the MacOS/SwiftUIHost and
   MacOS/GPUIHost profiles so the sink node registers on the native
   backends.

   The OCaml half of the conduit is identical to web: the shared
   src/editor/edit_view.ml sink emits the `logseq-editor` node with
   `block-id`/`caret`/`composition`/`runs` props and decodes
   key/insert/delete/composition/focus/blur/pointer events through
   Edit_input.decode. What differs is the adapter: the run views are
   host-rendered, so there is no hidden <input> element and no DOM
   Range to measure against — both channels are host services over
   the existing wires.

   Host contract (the Swift side lives in
   apple/Sources/Logseq/LogseqExtensions.swift — the parts still owed
   are marked TODO(logseq-editor) there):

   Events (host -> OCaml, via context.emit on the sink node):
     key         {key, shift, alt, meta, ctrl, repeat}
     insert      {text}
     delete      {kind} — "backward" | "forward" | "word-backward" |
                          "word-forward" | "line-backward" |
                          "line-forward" | "selection"
     composition {state, text, range} — IME marked text
     focus / blur
     pointer     {offset, extend} — offset hit-tested host-side, in
                 model units. Native units are Bytes (Edit_model.Bytes):
                 NSString is UTF-16, so the host converts its UTF-16
                 offsets to UTF-8 byte offsets before emitting.
     A hidden UIKeyInput (iOS) / NSTextInputClient (macOS) responder
     attached to the block editor supplies these; hardware-keyboard
     and IME marked text route to it while the block is edited.

   Commands (OCaml -> host via Host.dom_op; measurement replies come
   back through the platform-event channel under the same name):
     caret-rect      {block-id, offset} -> {block-id, offset, x, y, h}
     offset-at       {block-id, x, y}   -> {block-id, x, y, offset}
     line-ranges     {block-id}         -> {block-id, ranges} — "lo,hi;…"
     scroll-height   {block-id}         -> {block-id, height}
     set-input-focus {block-id, focused} — one-way, no reply

   Measurement is the host's job over the rendered .ed-r text views:
   NSTextLayoutManager/NSLayoutManager (or the LUI renderer's own
   text layout) over the composed run strings — the `runs` prop zips
   each .ed-r view against its unit span exactly as
   Range.getClientRects zips DOM text nodes on web. All rects are px
   relative to the block-editor container; all offsets are model
   units (UTF-8 bytes on native — the host translates its UTF-16
   layout offsets at this boundary; see the units note in
   docs/editor-surface-extension.md).

   Replies are asynchronous: a query issued before the host answers
   gets the no-data response (None / []) and the next
   Edit_input.measure pass sees the fresh value — the same
   stale-then-fresh contract as Dom_ext.bounding_rect. *)

open Lui_protocol

let identifier = "logseq-editor"

let web_profile =
  { Lui_protocol.profile_os = WebOS; Lui_protocol.profile_host = WebHost }

let apple_profile =
  { Lui_protocol.profile_os = MacOS
  ; Lui_protocol.profile_host = SwiftUIHost
  }

let gpui_profile =
  { Lui_protocol.profile_os = MacOS; Lui_protocol.profile_host = GPUIHost }

(* --- schema — identical to the web twin (same wire vocabulary) --------- *)

let schema =
  Lui_extension.component identifier
    [ web_profile; apple_profile; gpui_profile ]
    false (* standard_children *)
    []
    [ Lui_extension.property "block-id" Lui_extension.StringScalar true
        None
    ; Lui_extension.property "caret" Lui_extension.IntScalar false None
    ; Lui_extension.property "composition" Lui_extension.StringScalar
        false None
    ; Lui_extension.property "runs" Lui_extension.StringScalar false None
    ]
    [ Lui_extension.event "key"
        [ Lui_extension.event_field "key" Lui_extension.StringScalar true
        ; Lui_extension.event_field "shift" Lui_extension.BoolScalar false
        ; Lui_extension.event_field "alt" Lui_extension.BoolScalar false
        ; Lui_extension.event_field "meta" Lui_extension.BoolScalar false
        ; Lui_extension.event_field "ctrl" Lui_extension.BoolScalar false
        ; Lui_extension.event_field "repeat" Lui_extension.BoolScalar
            false
        ]
    ; Lui_extension.event "insert"
        [ Lui_extension.event_field "text" Lui_extension.StringScalar
            true
        ]
    ; Lui_extension.event "delete"
        [ Lui_extension.event_field "kind" Lui_extension.StringScalar
            true
        ]
    ; Lui_extension.event "composition"
        [ Lui_extension.event_field "state" Lui_extension.StringScalar
            true
        ; Lui_extension.event_field "text" Lui_extension.StringScalar
            false
        ; Lui_extension.event_field "range" Lui_extension.StringScalar
            false
        ]
    ; Lui_extension.event "focus" []
    ; Lui_extension.event "blur" []
    ; Lui_extension.event "pointer"
        [ Lui_extension.event_field "offset" Lui_extension.IntScalar true
        ; Lui_extension.event_field "extend" Lui_extension.BoolScalar
            false
        ]
    ]

let register registry =
  Lui_extension.register_component registry schema

(* --- measurement reply store ---------------------------------------------
   Replies to the measurement dom-ops above arrive as platform events
   routed here by Native_embed.platform_event. Entries are keyed by the
   full query (block-id + args) so a stale reply can never answer a
   different query. *)

type caret_rect_reply = { cx : int; cy : int; ch : int }

let caret_rects : (string * int, caret_rect_reply) Hashtbl.t =
  Hashtbl.create 64

let offset_ats : (string * int * int, int) Hashtbl.t = Hashtbl.create 64

let line_ranges_store : (string, (int * int) list) Hashtbl.t =
  Hashtbl.create 8

let scroll_heights : (string, int) Hashtbl.t = Hashtbl.create 8

(* replies are ephemeral: reset rather than grow unboundedly — a dropped
   entry just means the next query re-requests *)
let cap tbl = if Hashtbl.length tbl > 512 then Hashtbl.reset tbl

let parse_ranges (s : string) : (int * int) list =
  s
  |> String.split_on_char ';'
  |> List.filter_map (fun p ->
      match String.split_on_char ',' p with
      | [ a; b ] -> Some (int_of_string a, int_of_string b)
      | _ -> None)

let jstr = Dom_ext.str_prop
let jnum = Dom_ext.num_prop

let note_measurement name (j : Js.Json.t) : unit =
  match jstr "block-id" j with
  | None -> ()
  | Some block_id -> (
      match name with
      | "caret-rect" -> (
          match (jnum "offset" j, jnum "x" j, jnum "y" j, jnum "h" j) with
          | Some off, Some x, Some y, Some h ->
              cap caret_rects;
              Hashtbl.replace caret_rects (block_id, int_of_float off)
                { cx = int_of_float x
                ; cy = int_of_float y
                ; ch = int_of_float h
                }
          | _ -> ())
      | "offset-at" -> (
          match (jnum "x" j, jnum "y" j, jnum "offset" j) with
          | Some x, Some y, Some off ->
              cap offset_ats;
              Hashtbl.replace offset_ats
                (block_id, int_of_float x, int_of_float y)
                (int_of_float off)
          | _ -> ())
      | "line-ranges" -> (
          match jstr "ranges" j with
          | Some s ->
              Hashtbl.replace line_ranges_store block_id
                (parse_ranges s)
          | None -> ())
      | "scroll-height" -> (
          match jnum "height" j with
          | Some h ->
              Hashtbl.replace scroll_heights block_id (int_of_float h)
          | None -> ())
      | _ -> ())

(* --- commands ---------------------------------------------------------- *)

let request block_id name fields =
  Host.dom_op name
    (Js.Json.stringify
       (Js.Json.JObject
          (("block-id", Js.Json.JString block_id) :: fields)))

let jnum_v n = Js.Json.JNumber (Float.of_int n)

(* Unlike the web adapter there is no per-element create callback on the
   native backends, so mountedness is a host fact — the conduit is always
   constructible and each op degrades to the no-data answer (None / [])
   until the host starts replying. The option keeps call-site parity with
   the web conduit. *)
let conduit block_id : Edit_input.conduit option =
  Some
    { Edit_input.caret_rect =
        (fun off ->
          request block_id "caret-rect" [ ("offset", jnum_v off) ];
          Option.map
            (fun r ->
              { Edit_input.x = r.cx; y = r.cy; w = 0; h = r.ch })
            (Hashtbl.find_opt caret_rects (block_id, off)))
    ; offset_at =
        (fun ~x ~y ->
          request block_id "offset-at"
            [ ("x", jnum_v x); ("y", jnum_v y) ];
          Hashtbl.find_opt offset_ats (block_id, x, y))
    ; line_ranges =
        (fun () ->
          request block_id "line-ranges" [];
          Option.value
            (Hashtbl.find_opt line_ranges_store block_id) ~default:[])
    ; set_input_focus =
        (fun focused ->
          request block_id "set-input-focus"
            [ ("focused", Js.Json.JBoolean focused) ])
    }

(* host-side content height of the block editor's scrollable text —
   same request/reply pattern as the conduit ops *)
let scroll_height block_id : int option =
  request block_id "scroll-height" [];
  Hashtbl.find_opt scroll_heights block_id

(* the shared editor machinery resolves Editor_sink — no-ops until a
   surface registers an impl. The conduit above answers the host
   measurement ops; focus goes through set-input-focus and is_focused
   reads the conduit "focus"/"blur" events that route.focused folds
   into Editor_state.focused_block — the web profile's
   document.activeElement tracker has no native equivalent. *)
let () =
  Editor_sink.register
    { Editor_sink.conduit
    ; focus_input =
        (fun block_id ->
          request block_id "set-input-focus"
            [ ("focused", Js.Json.JBoolean true) ])
    ; is_focused =
        (fun block_id -> !Editor_state.focused_block = Some block_id)
    ; popup_pos = (fun _ -> None)
    ; container_rect = (fun _ -> None)
    }
