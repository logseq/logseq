(* Edit_view — renders an Edit_model.t as a Lui_elements tree.

     block-editor (column)
       ed-line (row)              bounded multiline flows on Web; native
                                  keeps one row per logical line
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
   same helper as Logseq_el.own, kept local so the editor surface has
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

let frag_key f =
  let identity =
    if List.mem "ed-block-ref" (String.split_on_char ' ' f.cls) then f.display
    else ""
  in
  (f.idx, frag_tag f.kind, f.cls, identity)

let cls_suffix f = if f.cls = "" then "" else " " ^ f.cls

(* the zero-width space the caret lands on at line end — decoded to a
   real U+200B codepoint so the DOM side carries one code unit *)
(* module-init constant — evaluated before services install, so the raw
   platform utf8 op rather than Ui_services.literal_text *)
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

(* materialized bytes of the current source — Melange [String.sub]
   copies the whole string per call (O(len s)); a cached [Bytes.t] makes
   every slice extraction O(slice) instead *)
let src_bytes_memo : (string * Bytes.t) option ref = ref None

let src_bytes s =
  match !src_bytes_memo with
  | Some (s0, b) when s0 == s -> b
  | _ ->
      let b = Bytes.of_string s in
      src_bytes_memo := Some (s, b);
      b

let sub_of sb a n = Bytes.unsafe_to_string (Bytes.sub sb a n)

(* clip one run to the line range; kind resolves against reveal state *)
let frag_of_run m sb (r : Edit_runs.run) lo hi idx : frag option =
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
      ; text = sub_of sb a (b - a)
      ; display = if List.mem "ed-page-ref" (String.split_on_char ' ' r.cls)
                  then "[[" ^ r.display ^ "]]" else r.display
      ; shown = Edit_model.delim_shown m r
      }

type line =
  { lidx : int
  ; lo : int
  ; hi : int
  ; frags : frag list
  }

(* first index into the run list whose run can overlap [lo], plus the
   remaining run tail — runs are contiguous and offset-ordered, so the
   cursor is monotone across ascending lines *)
let rec runs_at_offset idx rs lo =
  match rs with
  | (r : Edit_runs.run) :: tl when r.end_off <= lo ->
      runs_at_offset (idx + 1) tl lo
  | _ -> (idx, rs)

(* frags for one line: iteration starts at run index [idx0] and stops at
   the first run at/past [hi], so per-line work is O(overlapping runs),
   not O(all runs); frag [idx] is the run's global index — the keyed
   identity *)
let line_frags m sb idx0 rs lo hi : frag list =
  let rec go idx rs acc =
    match rs with
    | (r : Edit_runs.run) :: tl when r.start_off < hi -> (
        match frag_of_run m sb r lo hi idx with
        | Some f -> go (idx + 1) tl (f :: acc)
        | None -> go (idx + 1) tl acc)
    | _ -> List.rev (pad_frag hi :: acc)
  in
  go idx0 rs []

let line_at m sb lidx (lo, hi) : line =
  let idx, rs = runs_at_offset 0 m.Edit_model.runs lo in
  { lidx; lo; hi; frags = line_frags m sb idx rs lo hi }

(* full single-pass recompute: the run cursor advances monotonically
   with the line cursor — O(runs + lines) *)
let lines_of (m : Edit_model.t) : line list =
  let sb = src_bytes m.Edit_model.source in
  let rec go lidx lines_left idx rs acc =
    match lines_left with
    | [] -> List.rev acc
    | (lo, hi) :: rest ->
        let idx, rs = runs_at_offset idx rs lo in
        let l =
          { lidx; lo; hi; frags = line_frags m sb idx rs lo hi }
        in
        go (lidx + 1) rest idx rs (l :: acc)
  in
  go 0 m.Edit_model.lines 0 m.Edit_model.runs []

(* --- incremental line table --------------------------------------------------
   [lines_step] keeps the previous emit and recomputes only the lines
   whose inputs changed, so a caret move or a single-line edit does not
   rebuild the buffer's frag tree.

   - caret/selection/composition updates share [runs]/[lines] with the
     previous model — only a reveal-state flip can dirty a line
   - a [splice] that keeps the run structure ([shape] equal) and the
     line count localizes to the lines overlapping the dirty span;
     lines below it hold the same bytes shifted by the splice delta, so
     their frags are shifted copies rather than recomputes
   - anything else (line-count change, delimiter re-pairing, host
     [set_lines], external [set_source]) falls back to [lines_of] *)

type line_cache =
  { mutable lc_model : Edit_model.t option
  ; mutable lc_lines : line list
  }

let line_cache () = { lc_model = None; lc_lines = [] }

(* indices of lines whose range overlaps [a, b) — a run contributes
   frags to every line it spans *)
let lines_overlapping (lines : (int * int) list) a b : int list =
  let rec go i acc = function
    | [] -> List.rev acc
    | (lo, hi) :: tl ->
        go (i + 1) (if a <= hi && b > lo then i :: acc else acc) tl
  in
  go 0 [] lines

(* lines holding a run whose rendered reveal state flipped between the
   two models. Only Delim and Atomic runs consume reveal state — a Plain
   run's [reveal] is its own span and must not dirty on caret moves
   through it. The run lists pair positionally — callers guarantee
   [shape] equality (non-mutating updates share the list outright), so
   paired kinds always match. *)
let reveal_dirty pm m : int list =
  let rec go acc ors nrs =
    match ors, nrs with
    | (ro : Edit_runs.run) :: otl, (rn : Edit_runs.run) :: ntl ->
        let acc =
          if
            (ro.kind = Edit_runs.Delim
             && Edit_model.delim_shown pm ro
                <> Edit_model.delim_shown m rn)
            || (ro.kind = Edit_runs.Atomic
                && Edit_model.atomic_expanded pm ro
                   <> Edit_model.atomic_expanded m rn)
          then
            lines_overlapping m.Edit_model.lines rn.start_off rn.end_off
            @ acc
          else acc
        in
        go acc otl ntl
    | _ -> acc
  in
  List.sort_uniq Int.compare (go [] pm.Edit_model.runs m.Edit_model.runs)

(* same bytes, [delta] further right — offset-shifted copy *)
let shift_line (l : line) delta : line =
  { l with
    lo = l.lo + delta
  ; hi = l.hi + delta
  ; frags =
      List.map
        (fun (f : frag) ->
          { f with start_off = f.start_off + delta
                 ; end_off = f.end_off + delta })
        l.frags
  }

let apply_dirty m prev_lines dirty : line list =
  let sb = src_bytes m.Edit_model.source in
  List.mapi
    (fun i (l : line) ->
      if List.mem i dirty then line_at m sb i (List.nth m.Edit_model.lines i)
      else l)
    prev_lines

(* splice tier — needs the recorded dirty span, an unchanged split
   ([shape]) and a stable line count; each surviving line is verified
   against the expected prefix/shifted range so a host-side [set_lines]
   interleave degrades to per-line recompute, never wrong output *)
let step_splice pm m prev_lines : line list =
  match m.Edit_model.dirty with
  | Some (pos, old_len, new_len)
    when List.length pm.Edit_model.lines = List.length m.Edit_model.lines
         && Edit_model.shape pm = Edit_model.shape m ->
      let sb = src_bytes m.Edit_model.source in
      let delta = new_len - old_len in
      let dend = pos + max old_len new_len in
      let new_arr = Array.of_list m.Edit_model.lines
      and old_arr = Array.of_list pm.Edit_model.lines in
      let dirty = Array.make (Array.length new_arr) false in
      Array.iteri
        (fun i (nlo, nhi) ->
          if nlo < dend && nhi >= pos then dirty.(i) <- true)
        new_arr;
      List.iter (fun i -> dirty.(i) <- true) (reveal_dirty pm m);
      List.mapi
        (fun i (l : line) ->
          let nlo, nhi = new_arr.(i) in
          let olo, ohi = old_arr.(i) in
          if dirty.(i) then line_at m sb i (nlo, nhi)
          else if (nlo, nhi) = (olo, ohi) then l
          else if nlo = olo + delta && nhi = ohi + delta
          then shift_line l delta
          else line_at m sb i (nlo, nhi))
        prev_lines
  | _ -> lines_of m

let lines_step cache (m : Edit_model.t) : line list =
  let ls =
    match cache.lc_model with
    | None -> lines_of m
    | Some pm ->
        if pm.Edit_model.runs == m.Edit_model.runs
           && pm.Edit_model.lines == m.Edit_model.lines
        then
          match reveal_dirty pm m with
          | [] -> cache.lc_lines
          | dirty -> apply_dirty m cache.lc_lines dirty
        else step_splice pm m cache.lc_lines
  in
  cache.lc_model <- Some m;
  cache.lc_lines <- ls;
  ls

(* Keep browser text reflow local without emitting one row per source
   line. Newlines within each flow remain literal source; the row break
   represents the separator between flows, as it does on native. *)
let web_flow_ranges (m : Edit_model.t) =
  let rec group first last count runs acc = function
    | [] -> List.rev ((first, last) :: acc)
    | (lo, hi) :: rest ->
        let _, runs = runs_at_offset 0 runs lo in
        let inside_atomic =
          match runs with
          | r :: _ -> r.Edit_runs.kind = Atomic && r.start_off < lo
          | [] -> false
        in
        if count >= 32 && not inside_atomic then
          group lo hi 1 runs ((first, last) :: acc) rest
        else group first hi (count + 1) runs acc rest
  in
  match Edit_model.lines_of_source m.source with
  | [] -> assert false
  | (lo, hi) :: rest -> group lo hi 1 m.runs [] rest

(* decimal write without Printf — the prop is re-serialized per emit *)
let rec add_uint b n =
  if n >= 10 then add_uint b (n / 10);
  Buffer.add_char b (Char.unsafe_chr (48 + (n mod 10)))

let add_int b n =
  if n < 0 then (Buffer.add_char b '-'; add_uint b (-n))
  else add_uint b n

(* "a,b,k;…" over every emitted .ed-r element in document order —
   measurement zips it against querySelectorAll(".ed-r") *)
let runs_prop_of (ls : line list) : string =
  let b = Buffer.create 256 in
  List.iter
    (fun l ->
      List.iter
        (fun f ->
          if Buffer.length b > 0 then Buffer.add_char b ';';
          add_int b f.start_off;
          Buffer.add_char b ',';
          add_int b f.end_off;
          Buffer.add_char b ',';
          Buffer.add_string b (frag_tag f.kind))
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
let frag_view ~on_input ~start_off_of (frag_s : frag Signal.signal) : t =
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
  | Frag_pill when List.mem "ed-block-ref" (String.split_on_char ' ' (Signal.sample frag_s).cls) ->
      let f = Signal.sample frag_s in
      row ~style_class:("ed-r ed-pill" ^ cls_suffix f)
        [ Render_inline.page_ref ~refs:[] ~self:"" f.display ]
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
                  (start_off_of (Signal.sample frag_s).idx + 1, false)))
           [])

let same_rendered_frags before after =
  let rec equal a b =
    match a, b with
    | [], [] -> true
    | f :: fs, g :: gs ->
        f.idx = g.idx && f.kind = g.kind && f.cls = g.cls
        && f.text = g.text && f.display = g.display && f.shown = g.shown
        && equal fs gs
    | _ -> false
  in
  equal before after

let line_view ~on_input (line_s : line Signal.signal) : t =
 fun context parent ->
  (* Offset shifts update the sink's source spans, but unchanged text
     must not reconcile every following line's fragment subtree. *)
  let frags_s =
    own context
      (Signal.cutoff same_rendered_frags (Signal.map (fun l -> l.frags) line_s))
  in
  let start_off_of idx =
    let f = List.find (fun f -> f.idx = idx) (Signal.sample line_s).frags in
    f.start_off
  in
  (row ~style_class:"ed-line"
     [ keyed ~source:frags_s ~key:frag_key ~cmp:Stdlib.compare
         ~mount:(frag_view ~on_input ~start_off_of) ])
    context parent

(* --- selection overlay + caret -------------------------------------------------
   Each measured rect is a .ed-pos wrapper absolutely positioned over
   the block editor; its typed padding props push the inner bar to
   (x, y) — px arrive via Edit_input.measure. *)

(* layout props reject negatives: a mid-reflow measure can report a
   transient negative rect (e.g. a `**` delimiter insertion shifting
   runs before the next layout) — clamp rather than crashing the
   flush inside set_prop *)
let clamp_nonneg v = if v < 0 then 0 else v

let sel_rect_view (r_s : (int * rect) Signal.signal) : t =
 fun context parent ->
  let rect_s = own context (Signal.map snd r_s) in
  let wrap = (row ~style_class:"ed-pos" []) context parent in
  bind_int context wrap PaddingHorizontal
    (Signal.map (fun r -> clamp_nonneg r.Edit_input.x) rect_s);
  bind_int context wrap PaddingVertical
    (Signal.map (fun r -> clamp_nonneg r.Edit_input.y) rect_s);
  let bar = (row ~style_class:"ed-sel" []) context (Some wrap) in
  bind_int context bar WidthValue
    (Signal.map (fun r -> clamp_nonneg r.Edit_input.w) rect_s);
  bind_int context bar HeightValue
    (Signal.map (fun r -> clamp_nonneg r.Edit_input.h) rect_s);
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
    (Signal.map (fun r -> clamp_nonneg r.Edit_input.x) r_s);
  bind_int context wrap PaddingVertical
    (Signal.map (fun r -> clamp_nonneg r.Edit_input.y) r_s);
  let bar = (row ~style_class:"ed-caret" ~width:2 []) context (Some wrap) in
  bind_int context bar HeightValue
    (Signal.map (fun r -> clamp_nonneg r.Edit_input.h) r_s);
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
         ~test:
           (own context
              (Signal.map
                 (fun f -> Option.is_some f.Edit_input.caret) frame))
         (caret_view frame)
     ])
    context parent

(* --- input sink ---------------------------------------------------------------- *)

let sink ~block_id ~runs_s ~caret_s ~comp_s ~on_input : t =
 fun context parent ->
  let node = Lui_ui.extension context Editor_sink.identifier in
  Lui_ui.key context node ("ed-sink-" ^ block_id);
  Lui_ui.extension_property context node "block-id" (StringValue block_id);
  (* the web adapter materializes these on its hidden textarea; native
     hosts render the surface, so the same e2e/a11y hooks ride the
     extension node itself *)
  Lui_ui.extension_property context node "accessibility-identifier"
    (StringValue ("edit-block-" ^ block_id));
  Lui_ui.extension_property context node "data-testid"
    (StringValue "block editor");
  (* the web adapter's hidden textarea carries class ed-input +
     data-block-id; the clipboard guards (editing_clipboard_target,
     targets_block_editor) and document keydown routing match on those
     selectors, so the native sink needs the same surface *)
  Lui_ui.extension_property context node "style-class"
    (StringValue "ed-input");
  Lui_ui.extension_property context node "attrs"
    (StringValue
       (Printf.sprintf {|{"data-block-id":"%s"}|} block_id));
  Lui_ui.extension_property_signal context node "runs" runs_s;
  Lui_ui.extension_property_signal context node "caret" caret_s;
  Lui_ui.extension_property_signal context node "composition" comp_s;
  Lui_ui.on_event context node
    (fun ev ->
      match ev with
      | ExtensionEvent (_, ident, "dom-event", fields)
        when ident = Editor_sink.identifier -> (
          (* native hosts carry document-level events (keydown feeding
             popups and global chords) through the focused node — unwrap
             and fan out to the document listeners like the logseq-*
             dom trampoline does; a no-op on web *)
          let field name =
            match String_map.find_opt name fields with
            | Some (StringValue s) -> Some s
            | _ -> None
          in
          match field "name" with
          | Some name ->
              Ui_services.dom_emit_json name
                (match field "payload" with
                 | Some p -> p
                 | None -> "null")
          | None -> ())
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

let view ~model ~frame ~block_id ~on_input ~cls : t =
 fun context parent ->
  let model = own context (Signal.map Edit_model.display_model model) in
  let cache = line_cache () in
  (* [lines_step] returns the previous list untouched when nothing a
     line depends on changed; the cutoff then keeps the whole line
     subtree idle on caret/IME flushes *)
  let mapped =
    own context
      (Signal.map
         (fun m ->
           match m.Edit_model.units with
           | U16 ->
               let lines =
                 match cache.lc_model with
                 | Some previous when previous.source == m.source -> previous.lines
                 | _ -> web_flow_ranges m
               in
               lines_step cache { m with lines }
           | Bytes -> lines_step cache m)
         model)
  in
  let lines_s = own context (Signal.cutoff ( == ) mapped) in
  let runs_s =
    own context
      (Signal.map (fun ls -> StringValue (runs_prop_of ls)) lines_s)
  in
  let caret_s = own context (Signal.map caret_prop model) in
  let comp_s = own context (Signal.map composition_prop model) in
  (column ~style_class:("block-editor" ^ cls)
     [ keyed ~source:lines_s ~key:(fun l -> l.lidx) ~cmp:Int.compare
         ~mount:(line_view ~on_input)
     ; overlay frame
     ; sink ~block_id ~runs_s ~caret_s ~comp_s ~on_input
     ])
    context parent
