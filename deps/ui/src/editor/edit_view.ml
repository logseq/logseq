(* Edit_view — renders an Edit_model.t as a Lui_elements tree.

     block-editor (column)
       ed-line (row) x n          one row per model line (m.lines; '\n'
                                  bytes are never inside a range)
         ed-r run fragment        keyed; Plain -> text, Delim -> text
                                  with ed-delim (+ed-hidden when the
                                  caret is outside the construct's
                                  reveal), collapsed Atomic -> ed-pill
                                  with the display label, expanded
                                  Atomic -> ed-raw text
         ed-pad                   zero-width landing span at line end —
                                  caret-rect needs a text node to land
                                  on even when the tail run is hidden
                                  or the line is empty
       ed-overlay (column)        selection rects + caret bar, each in
                                  an .ed-pos wrapper pushed to (x, y)
                                  by typed padding props — LUI has no
                                  coordinate channel, so offsets go
                                  through padding on an absolutely
                                  positioned wrapper (px from host
                                  measurements via Edit_input.frame)
       logseq-editor (extension)  hidden input sink — see
                                  extension/logseq_editor.ml

   Narrow patching: frags are keyed by (index, kind-tag); typing inside
   a Plain run republishes the frag items and only the changed ~value
   prop emits a SetProp — children are never re-emitted. Delim reveal
   flips only the style-class prop. *)

open Lui_protocol
open Lui_elements

type rect = Edit_input.rect
type frame = Edit_input.frame

(* tie a derived signal's upstream subscription to the mount scope —
   same helper as Logseq_dom.own, kept local so the editor surface has
   zero logseq-dom deps *)
let own context (source : 'a Signal.signal) =
  if !(source.Signal.upstream_subscriptions) <> [] then
    Signal.own_signal context.Lui_ui.ui_scope source
  else
    source

let bind_int context node key s =
  Lui_ui.int_property_signal context node key (own context s)

type frag_kind =
  | Frag_plain
  | Frag_delim
  | Frag_pill (* collapsed atomic *)
  | Frag_raw (* expanded atomic — caret inside reveal *)
  | Frag_pad

type frag =
  { idx : int (* position within the line — keyed identity *)
  ; start_off : int
  ; end_off : int (* byte range the fragment covers; pad = [hi, hi) *)
  ; kind : frag_kind
  ; cls : string (* run cls hint (ed-bold etc); "" for pad *)
  ; text : string (* source[start_off, end_off) *)
  ; display : string (* pill label *)
  ; shown : bool (* delim: caret/selection inside the construct *)
  }

(* order tag — also the kind marker in the `runs` prop *)
let frag_tag = function
  | Frag_plain -> "p"
  | Frag_delim -> "d"
  | Frag_pill -> "a"
  | Frag_raw -> "r"
  | Frag_pad -> "z"

let frag_key f = (f.idx, frag_tag f.kind)

let cls_suffix f = if f.cls = "" then "" else " " ^ f.cls

(* the zero-width space the caret lands on at line end — decoded to a
   real U+200B codepoint so the DOM side carries one code unit *)
let pad_text = Platform.utf8 "\xe2\x80\x8b"

let pad_frag hi =
  { idx = -1
  ; start_off = hi
  ; end_off = hi
  ; kind = Frag_pad
  ; cls = ""
  ; text = pad_text
  ; display = ""
  ; shown = false
  }

(* clip one run to the line range; kind resolves against reveal state *)
let frag_of_run m (r : Edit_runs.run) lo hi idx : frag option =
  let a = max r.start_off lo and b = min r.end_off hi in
  if a >= b then None
  else
    let kind =
      match r.kind with
      | Edit_runs.Plain -> Frag_plain
      | Edit_runs.Delim -> Frag_delim
      | Edit_runs.Atomic ->
          if Edit_model.atomic_expanded m r then Frag_raw else Frag_pill
    in
    Some
      { idx
      ; start_off = a
      ; end_off = b
      ; kind
      ; cls = r.cls
      ; text = String.sub m.Edit_model.source a (b - a)
      ; display = r.display
      ; shown = Edit_model.delim_shown m r
      }

let line_frags m (lo, hi) : frag list =
  let fs =
    List.filter_map
      (fun (idx, r) -> frag_of_run m r lo hi idx)
      (List.mapi (fun i r -> (i, r)) m.Edit_model.runs)
  in
  fs @ [ pad_frag hi ]

type line =
  { lidx : int
  ; lo : int
  ; hi : int
  ; frags : frag list
  }

let lines_of (m : Edit_model.t) : line list =
  List.mapi
    (fun lidx (lo, hi) -> { lidx; lo; hi; frags = line_frags m (lo, hi) })
    m.lines

(* "a,b,k;…" over every emitted .ed-r element in document order —
   measurement zips it against querySelectorAll(".ed-r") *)
let runs_prop_of (ls : line list) : string =
  let b = Buffer.create 64 in
  List.iter
    (fun l ->
      List.iter
        (fun f ->
          if Buffer.length b > 0 then Buffer.add_char b ';';
          Buffer.add_string b
            (Printf.sprintf "%d,%d,%s" f.start_off f.end_off
               (frag_tag f.kind)))
        l.frags)
    ls;
  Buffer.contents b

(* the `caret`/`composition` props carry raw model offsets — on web
   (units=U16) they are already utf-16 code units *)
let caret_prop (m : Edit_model.t) : wire_value =
  IntValue m.Edit_model.caret

let composition_prop (m : Edit_model.t) : wire_value =
  match m.Edit_model.composition with
  | Some (a, b) -> StringValue (Printf.sprintf "%d,%d" a b)
  | None -> StringValue ""

(* --- run fragments ------------------------------------------------------------ *)

(* kinds take only a static ~style_class at this LUI rev — reactive
   class toggles go through Ui_parts.class_signal (binds StyleClass on
   the mounted node) *)
let frag_view ~on_input (frag_s : frag Signal.signal) : t =
  match (Signal.sample frag_s).kind with
  | Frag_pad ->
      text ~value:(reactive (fun f -> f.text) frag_s)
        ~style_class:"ed-r ed-pad" []
  | Frag_plain ->
      Ui_parts.class_signal frag_s (fun f -> "ed-r" ^ cls_suffix f)
        (text ~value:(reactive (fun f -> f.text) frag_s)
           ~style_class:"ed-r" [])
  | Frag_delim ->
      Ui_parts.class_signal frag_s
        (fun f ->
          "ed-r ed-delim" ^ (if f.shown then "" else " ed-hidden")
          ^ cls_suffix f)
        (text ~value:(reactive (fun f -> f.text) frag_s)
           ~style_class:"ed-r ed-delim" [])
  | Frag_raw ->
      Ui_parts.class_signal frag_s
        (fun f -> "ed-r ed-raw" ^ cls_suffix f)
        (text ~value:(reactive (fun f -> f.text) frag_s)
           ~style_class:"ed-r ed-raw" [])
  | Frag_pill ->
      (* click reveals the raw source: dropping the caret inside the
         atomic's strict interior expands it via the model *)
      Ui_parts.class_signal frag_s
        (fun f -> "ed-r ed-pill" ^ cls_suffix f)
        (text
           ~value:(reactive (fun f -> f.display) frag_s)
           ~style_class:"ed-r ed-pill"
           ~on_press:(fun _ ->
             on_input
               (Edit_input.Pointer
                  ((Signal.sample frag_s).start_off + 1, false)))
           [])

let line_view ~on_input (line_s : line Signal.signal) : t =
 fun context parent ->
  let frags_s = own context (Signal.map (fun l -> l.frags) line_s) in
  (row ~style_class:"ed-line"
     [ keyed ~source:frags_s ~key:frag_key ~cmp:Stdlib.compare
         ~mount:(frag_view ~on_input) ])
    context parent

(* --- selection overlay + caret -------------------------------------------------
   Each measured rect is a .ed-pos wrapper absolutely positioned over
   the block editor; its typed padding props push the inner bar to
   (x, y) — px arrive via Edit_input.measure. *)

let sel_rect_view (r_s : (int * rect) Signal.signal) : t =
 fun context parent ->
  let rect_s = own context (Signal.map snd r_s) in
  let wrap = (row ~style_class:"ed-pos" []) context parent in
  bind_int context wrap PaddingHorizontal
    (Signal.map (fun r -> r.Edit_input.x) rect_s);
  bind_int context wrap PaddingVertical
    (Signal.map (fun r -> r.Edit_input.y) rect_s);
  let bar = (row ~style_class:"ed-sel" []) context (Some wrap) in
  bind_int context bar WidthValue
    (Signal.map (fun r -> r.Edit_input.w) rect_s);
  bind_int context bar HeightValue
    (Signal.map (fun r -> r.Edit_input.h) rect_s);
  wrap

let caret_view (frame : frame Signal.signal) : t =
 fun context parent ->
  (* test mounts under if_ — caret is Some whenever this renders *)
  let r_s =
    own context
      (Signal.map
         (fun f ->
           Option.value f.Edit_input.caret
             ~default:{ x = 0; y = 0; w = 0; h = 0 })
         frame)
  in
  let wrap = (row ~style_class:"ed-pos" []) context parent in
  bind_int context wrap PaddingHorizontal
    (Signal.map (fun r -> r.Edit_input.x) r_s);
  bind_int context wrap PaddingVertical
    (Signal.map (fun r -> r.Edit_input.y) r_s);
  let bar = (row ~style_class:"ed-caret" ~width:2 []) context (Some wrap) in
  bind_int context bar HeightValue (Signal.map (fun r -> r.Edit_input.h) r_s);
  wrap

let overlay (frame : frame Signal.signal) : t =
 fun context parent ->
  let sel_s =
    own context
      (Signal.map
         (fun f -> List.mapi (fun i r -> (i, r)) f.Edit_input.selection)
         frame)
  in
  (column ~style_class:"ed-overlay"
     [ keyed ~source:sel_s ~key:fst ~cmp:Int.compare ~mount:sel_rect_view
     ; if_
         ~test:(reactive (fun f -> Option.is_some f.Edit_input.caret) frame)
         (caret_view frame)
     ])
    context parent

(* --- input sink ---------------------------------------------------------------- *)

let sink ~block_id ~runs_s ~caret_s ~comp_s ~on_input : t =
 fun context parent ->
  let node = Lui_ui.extension context Editor_sink.identifier in
  Lui_ui.key context node ("ed-sink-" ^ block_id);
  Lui_ui.extension_property context node "block-id" (StringValue block_id);
  Lui_ui.extension_property_signal context node "runs" runs_s;
  Lui_ui.extension_property_signal context node "caret" caret_s;
  Lui_ui.extension_property_signal context node "composition" comp_s;
  Lui_ui.on_event context node
    (fun ev ->
      match ev with
      | ExtensionEvent (_, ident, name, fields)
        when ident = Editor_sink.identifier -> (
          match Edit_input.decode name fields with
          | Some e -> on_input e
          | None -> ())
      | _ -> ());
  (match parent with
   | Some p -> Lui_ui.append context p node
   | None -> ());
  node

(* --- root --------------------------------------------------------------------- *)

let view ~model ~frame ~block_id ~on_input : t =
 fun context parent ->
  let lines_s = own context (Signal.map lines_of model) in
  let runs_s =
    own context
      (Signal.map (fun ls -> StringValue (runs_prop_of ls)) lines_s)
  in
  let caret_s = own context (Signal.map caret_prop model) in
  let comp_s = own context (Signal.map composition_prop model) in
  (column ~style_class:"block-editor"
     [ keyed ~source:lines_s ~key:(fun l -> l.lidx) ~cmp:Int.compare
         ~mount:(line_view ~on_input)
     ; overlay frame
     ; sink ~block_id ~runs_s ~caret_s ~comp_s ~on_input
     ])
    context parent
