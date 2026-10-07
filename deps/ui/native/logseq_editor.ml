(* logseq-editor extension — native twin of
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

   Host contract (implemented per native host — GPUI implements it in
   platform/gpui's editor extension):

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
     caret-rect      {block-id, offset} -> {block-id, offset, x, y, h, ox, oy}
                     x/y/h relative to .block-editor; ox/oy its
                     window-space origin (popup anchors add them)
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


let gpui_profile =
  { Lui_protocol.profile_os = MacOS; Lui_protocol.profile_host = GPUIHost }

(* --- schema — identical to the web twin (same wire vocabulary) --------- *)

let schema =
  Lui_extension.component identifier
    [ web_profile; gpui_profile ]
    false (* standard_children *)
    []
    [ Lui_extension.property "block-id" Lui_extension.StringScalar true
        None
    ; Lui_extension.property "caret" Lui_extension.IntScalar false None
    ; Lui_extension.property "composition" Lui_extension.StringScalar
        false None
    ; Lui_extension.property "runs" Lui_extension.StringScalar false None
    ; (* e2e/a11y hooks: the web adapter materializes
         textarea#edit-block-<uuid>[data-testid='block editor'] inside
         the extension; native hosts render the surface themselves, so
         the same identifiers ride the extension node as props *)
      Lui_extension.property "accessibility-identifier"
        Lui_extension.StringScalar false None
    ; Lui_extension.property "data-testid" Lui_extension.StringScalar
        false None
    ; Lui_extension.property "style-class" Lui_extension.StringScalar
        false None
    ; Lui_extension.property "attrs" Lui_extension.StringScalar false
        None
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
        (* hosts carry document-level events (keydown feeding popups and
           global chords) through the focused node as dom-event — the
           sink's on_event fans them out to Platform.emit_event *)
    ; Lui_extension.event "dom-event"
        [ Lui_extension.event_field "name" Lui_extension.StringScalar true
        ; Lui_extension.event_field "payload" Lui_extension.StringScalar
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

(* x/y/h are .block-editor-container relative (the overlay frame
   draws in container space); ox/oy are the container's window-space
   origin — popup anchors add them to land in viewport px like the
   web twin's caretPopupPos contract *)
type caret_rect_reply =
  { cx : int; cy : int; ch : int; ox : int; oy : int }

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
                ; ox = Option.value ~default:0 (Option.map int_of_float (jnum "ox" j))
                ; oy = Option.value ~default:0 (Option.map int_of_float (jnum "oy" j))
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

(* caret anchor for popups — same (x-20, line bottom, line top)
   contract as the web twin. The live caret goes through the
   caret-rect measurement op (first calls answer after the host
   replies); before that, the element snapshot's caretRect/bounding
   rect anchors the popup at the input's corner instead of (0,0). *)
let popup_pos block_id : (float * float * float) option =
  let live =
    match Editor_state.editing () with
    | Some e when e.Editor_state.uuid = block_id ->
        let off = e.Editor_state.model.Edit_model.caret in
        request block_id "caret-rect" [ ("offset", jnum_v off) ];
        (* reply coords are container-relative — re-anchor into viewport
           space (x-20, line bottom - 3, line top), matching the web
           twin's popup_pos *)
        Option.map
          (fun r ->
            let vx = Float.of_int (r.cx + r.ox)
            and vy = Float.of_int (r.cy + r.oy) in
            (vx -. 20., vy +. Float.of_int r.ch -. 3., vy))
          (Hashtbl.find_opt caret_rects (block_id, off))
    | _ -> None
  in
  match live with
  | Some _ -> live
  | None -> (
      match Editor_dom.textarea_of block_id with
      | Some el -> Some (Dom_ext.caret_popup_pos el)
      | None -> None)

(* bounding rect of the .block-editor container — popup clamp anchor.
   Same (left, top, right, bottom) contract as the web twin; the
   measure-node reply lands in Dom_ext.rect_store, so early calls can
   still answer zeros until the host replies *)
let container_rect block_id : (float * float * float * float) option =
  match Editor_dom.textarea_of block_id with
  | Some el -> (
      match Editor_dom.el_closest el ".block-editor" with
      | Some c ->
          let r = Dom_ext.bounding_rect c in
          Some
            ( Dom_ext.rect_left r
            , Dom_ext.rect_top r
            , Dom_ext.rect_right r
            , Dom_ext.rect_bottom r )
      | None -> None)
  | None -> None

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
    ; (* the native host queues set-input-focus for a sink that mounts
         late — an emit never lands in the void *)
      can_focus = (fun _ -> true)
    ; popup_pos
    ; container_rect
    }
