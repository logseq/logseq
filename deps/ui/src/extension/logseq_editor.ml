(* logseq-editor extension — the web input conduit + measurement
   surface for the shared-OCaml rich-text editor
   (docs/editor-surface-extension.md).

   DOM side: a hidden <input> per block editor. It never holds
   committed text — the model owns the buffer; the input only collects
   keys, beforeinput intents, and IME composition. On every `caret`
   prop update the input is re-anchored to the caret rect so the IME
   candidate window tracks the real caret.

   Units: the conduit assumes the block's model was built with
   [Edit_model.create ~units:U16] — web db text is already a proper JS
   string, so model offsets ARE utf-16 code units and Range offsets
   map 1:1 (no byte conversion at this boundary).

   Events emitted (consumed by Edit_input.decode):
     key         {key, shift, alt, meta, ctrl, repeat}
     insert      {text}
     delete      {kind} — "backward" | "forward" | "word-backward"
                        | "word-forward" | "line-backward"
                        | "line-forward" | "selection"
     composition {state, text, range} — state "start" | "update" |
                 "end"; range = "0,<unit len>" of the marked text
                 relative to the composition start
     focus / blur
     pointer     {offset, extend} — offset already in model units

   Props consumed:
     block-id    registry key for [conduit]/[set_input_focus]
     caret       model-unit caret offset — re-anchors the hidden input
     composition "a,b" marked range (bookkeeping only)
     runs        "a,b,k;…" — one entry per .ed-r element in document
                 order: unit range + tag (p=plain d=delim
                 a=atomic-pill r=raw z=pad)

   Commands are plain OCaml calls — on web the OCaml->host channel is a
   direct melange call (no async bus): [conduit block_id] yields the
   Edit_input.conduit record. *)

open Lui_protocol
module W = Webapi.Dom

let identifier = Editor_sink.identifier

let web_profile =
  { Lui_protocol.profile_os = WebOS; Lui_protocol.profile_host = WebHost }

(* --- schema ------------------------------------------------------------------ *)

let schema =
  Lui_extension.component identifier [ web_profile ]
    false (* standard_children *)
    []
    [ Lui_extension.property "block-id" Lui_extension.StringScalar true
        None
    ; Lui_extension.property "caret" Lui_extension.IntScalar false None
    ; Lui_extension.property "composition" Lui_extension.StringScalar
        false None
    ; Lui_extension.property "runs" Lui_extension.StringScalar false None
    ; (* same wire vocabulary as the native twin: the e2e/a11y hooks the
         web adapter materializes on the hidden textarea ride the
         extension node as props on native hosts (ignored here) *)
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
    ]

let register registry =
  Lui_extension.register_component registry schema

(* --- DOM externals ---------------------------------------------------------------
   Two typed views like web_ext_adapters: event-derived values stay
   [Js.Json.t], elements we created stay [W.Element.t] — no casts. *)

type range_t
type domrect
type rect_list

external prop_undef : Js.Json.t -> string -> 'a Js.Undefined.t = ""
  [@@mel.get_index]

external create_element : W.Document.t -> string -> W.Element.t =
  "createElement" [@@mel.send]

external set_attr : W.Element.t -> string -> string -> unit =
  "setAttribute" [@@mel.send]

external set_class_name : W.Element.t -> string -> unit = "className"
  [@@mel.set]

external add_listener :
  W.Element.t -> string -> (Js.Json.t -> unit) -> unit =
  "addEventListener" [@@mel.send]

external add_doc_listener :
  W.Document.t -> string -> (Js.Json.t -> unit) -> unit =
  "addEventListener" [@@mel.send]

external remove_doc_listener :
  W.Document.t -> string -> (Js.Json.t -> unit) -> unit =
  "removeEventListener" [@@mel.send]

external prevent_default : Js.Json.t -> unit = "preventDefault"
  [@@mel.send]

external ev_cancelable : Js.Json.t -> bool = "cancelable" [@@mel.get]

external focus : W.Element.t -> unit = "focus" [@@mel.send]
external blur : W.Element.t -> unit = "blur" [@@mel.send]
external set_value : W.Element.t -> string -> unit = "value" [@@mel.set]

external parent_element : W.Element.t -> W.Element.t Js.Nullable.t =
  "parentElement" [@@mel.get]

external closest_el : W.Element.t -> string -> W.Element.t Js.Nullable.t =
  "closest" [@@mel.send]

external j_contains : W.Element.t -> Js.Json.t -> bool = "contains"
  [@@mel.send]

external j_node_type : Js.Json.t -> int = "nodeType" [@@mel.get]
external j_text_content : Js.Json.t -> string = "textContent" [@@mel.get]

external j_parent_element : Js.Json.t -> Js.Json.t = "parentElement"
  [@@mel.get]

external j_closest : Js.Json.t -> string -> Js.Json.t = "closest"
  [@@mel.send]

external j_child_nodes : Js.Json.t -> Js.Json.t = "childNodes"
  [@@mel.get]

external nl_length : Js.Json.t -> int = "length" [@@mel.get]
external nl_at : Js.Json.t -> int -> Js.Json.t = "" [@@mel.get_index]

external qsa_json : W.Element.t -> string -> Js.Json.t =
  "querySelectorAll" [@@mel.send]

external arr_from : Js.Json.t -> Js.Json.t array = "from"
  [@@mel.scope "Array"]

external arr_index_of : Js.Json.t array -> Js.Json.t -> int = "indexOf"
  [@@mel.send]

external el_rect : W.Element.t -> domrect = "getBoundingClientRect"
  [@@mel.send]

external el_rects : Js.Json.t -> rect_list = "getClientRects"
  [@@mel.send]

external rl_len : rect_list -> int = "length" [@@mel.get]
external rl_at : rect_list -> int -> domrect = "" [@@mel.get_index]
external rect_left : domrect -> float = "left" [@@mel.get]
external rect_top : domrect -> float = "top" [@@mel.get]
external rect_right : domrect -> float = "right" [@@mel.get]
external rect_height : domrect -> float = "height" [@@mel.get]

external create_range : unit -> range_t = "createRange"
  [@@mel.scope "document"]

external range_set_start : range_t -> Js.Json.t -> int -> unit =
  "setStart" [@@mel.send]

external range_set_end : range_t -> Js.Json.t -> int -> unit =
  "setEnd" [@@mel.send]

external range_rects : range_t -> rect_list = "getClientRects"
  [@@mel.send]

external caret_from_point : float -> float -> Js.Json.t =
  "caretRangeFromPoint" [@@mel.scope "document"]

external range_container : Js.Json.t -> Js.Json.t = "startContainer"
  [@@mel.get]

external range_offset : Js.Json.t -> int = "startOffset" [@@mel.get]

external cd_data : Js.Json.t -> Js.Json.t = "clipboardData" [@@mel.get]
external cd_get : Js.Json.t -> string -> string = "getData" [@@mel.send]

external j_first_child : Js.Json.t -> Js.Json.t = "firstChild"
  [@@mel.get]

external j_brect : Js.Json.t -> domrect = "getBoundingClientRect"
  [@@mel.send]

external owner_document : W.Element.t -> W.Document.t =
  "ownerDocument" [@@mel.get]

(* --- json field helpers --------------------------------------------------------- *)

let jstr ev k =
  match Js.Undefined.toOption (prop_undef ev k) with
  | Some v -> Js.Json.decodeString v
  | None -> None

let jbool ev k =
  match Js.Undefined.toOption (prop_undef ev k) with
  | Some v -> Option.value (Js.Json.decodeBoolean v) ~default:false
  | None -> false

let jnum ev k =
  match Js.Undefined.toOption (prop_undef ev k) with
  | Some v -> Option.value (Js.Json.decodeNumber v) ~default:0.
  | None -> 0.

(* null or undefined *)
let js_nullish (v : Js.Json.t) = Js.testAny v

(* --- per-element state + block registry ---------------------------------------- *)

(* one entry per .ed-r element, in document order *)
type run_span = int * int * string (* unit lo, unit hi, tag *)

type ed_state =
  { mutable block_id : string
  ; mutable runs : run_span array
  ; mutable caret_off : int
  ; mutable composing : bool
  ; mutable on_mousedown : (Js.Json.t -> unit) option
  ; mutable dragging : bool
  ; mutable on_mousemove : (Js.Json.t -> unit) option
  ; mutable on_mouseup : (Js.Json.t -> unit) option
  ; mutable drag_off : int
  }

external state_get : W.Element.t -> ed_state Js.Undefined.t = "__lsEd"
  [@@mel.get]

external state_set : W.Element.t -> ed_state -> unit = "__lsEd"
  [@@mel.set]

let state_of el =
  match Js.Undefined.toOption (state_get el) with
  | Some s -> s
  | None ->
      { block_id = ""; runs = [||]; caret_off = 0; composing = false
      ; on_mousedown = None; dragging = false; on_mousemove = None
      ; on_mouseup = None; drag_off = -1
      }

(* block-id -> input element; commands resolve through this *)
let by_block : (string, W.Element.t) Hashtbl.t = Hashtbl.create 8

let container_of el : W.Element.t option =
  match Js.Nullable.toOption (closest_el el ".block-editor") with
  | Some c -> Some c
  | None -> Js.Nullable.toOption (parent_element el)

(* .ed-r elements in document order — the i-th entry zips with
   st.runs.(i) *)
let run_els el =
  match container_of el with
  | Some c -> arr_from (qsa_json c ".ed-r")
  | None -> [||]

let parse_runs (s : string) : run_span array =
  s
  |> String.split_on_char ';'
  |> List.filter_map (fun p ->
      match String.split_on_char ',' p with
      | [ a; b; k ] -> Some (int_of_string a, int_of_string b, k)
      | _ -> None)
  |> Array.of_list

(* --- emit --------------------------------------------------------------------- *)

let emit_now el name fields =
  match Js.Undefined.toOption (Web_ext_adapters.emit_get el) with
  | Some emit -> emit name fields
  | None -> ()

let emit_str el name k v =
  emit_now el name (String_map.singleton k (StringValue v))

(* --- measurement ------------------------------------------------------------------
   All offsets are model units (utf-16 on web — equal to DOM code-unit
   offsets); px are VIEWPORT coords inside these helpers, converted to
   block-editor-relative in [conduit]. *)

(* every frag whose unit span covers [off], document order *)
let frags_at runs off =
  let acc = ref [] in
  Array.iteri
    (fun i (a, b, _k) ->
      if a <= off && off <= b then acc := i :: !acc)
    runs;
  List.rev !acc

(* float rect: caret spot in viewport px — domrect is opaque, so pick
   the edge that matters *)
type frect = { fx : float; fy : float; fh : float }

(* rect of [fel]'s first text child at unit offset [u16]; [u16] = model
   offset - frag lo, already a DOM code-unit offset *)
let frag_rect fel u16 =
  let tn = j_first_child fel in
  if js_nullish tn then None
  else (
    let rng = create_range () in
    range_set_start rng tn u16;
    range_set_end rng tn u16;
    let rl = range_rects rng in
    if rl_len rl > 0 then
      let r = rl_at rl 0 in
      Some { fx = rect_left r; fy = rect_top r; fh = rect_height r }
    else
      (* a zero-width text node (the ZWSP pad — the only frag of an empty
         block/line) yields no client rects, leaving an empty block with
         no measurable caret spot at all: fall back to the frag element's
         own box — its left edge is the caret position *)
      let r = j_brect fel in
      Some { fx = rect_left r; fy = rect_top r; fh = rect_height r })

let caret_rect_el el (off : int) : frect option =
  let st = state_of el in
  let els = run_els el in
  let try_idx i =
    if i >= Array.length els || i >= Array.length st.runs then None
    else
      let a, b, tag = st.runs.(i) in
      let fel = els.(i) in
      if tag = "a" then
        (* pill: caret sits on the edge the offset reaches *)
        let r = j_brect fel in
        Some
          { fx = (if off >= b then rect_right r else rect_left r)
          ; fy = rect_top r
          ; fh = rect_height r
          }
      else
        (* pad ("z") covers [e, e): u16 = 0 lands on its ZWSP;
           text frags clamp to their content length *)
        let u16 =
          if tag = "z" then 0
          else min (off - a) (String.length (j_text_content fel))
        in
        frag_rect fel u16
  in
  let rec first_ok = function
    | [] -> None
    | i :: tl -> (
        match try_idx i with Some r -> Some r | None -> first_ok tl)
  in
  first_ok (frags_at st.runs off)

(* px -> model unit offset: caretRangeFromPoint hits a text node inside
   an .ed-r element (frag lo + DOM offset) or an element boundary (the
   frag before the hit index ends there). Pads hit their [e]. *)
let offset_at_el el ~x ~y : int option =
  let st = state_of el in
  let r = caret_from_point x y in
  if js_nullish r then None
  else
    let cont = range_container r and off = range_offset r in
    let frag_el, u16 =
      if j_node_type cont = 3 then
        (* text node: its parent is the .ed-r element *)
        (cont, off)
      else
        (* element position: offset indexes childNodes — use the node
           before the boundary at its end *)
        let cn = j_child_nodes cont in
        let i = min (off - 1) (nl_length cn - 1) in
        if i >= 0 then
          let c = nl_at cn i in
          (c, String.length (j_text_content c))
        else (cont, 0)
    in
    let frag_el =
      if j_node_type frag_el = 3 then j_parent_element frag_el
      else frag_el
    in
    let rel = j_closest frag_el ".ed-r" in
    if js_nullish rel then None
    else
      let els = run_els el in
      let idx = arr_index_of els rel in
      if idx < 0 || idx >= Array.length st.runs then None
      else
        let a, _b, tag = st.runs.(idx) in
        if tag = "z" then Some a (* pads hit the line-end offset *)
        else if tag = "a" then Some (a + 1) (* pill interior expands *)
        else Some (a + u16)

(* visual lines as [lo, hi) unit ranges: group every .ed-r element's
   client rects by row top, then hit-test each row's left/right edge *)
let line_ranges_el el : (int * int) list =
  (* collect every run rect, then cluster by row: a pad's line box can
     sit a couple px off the text run's, so exact-top grouping splits
     one visual row into a text row and a pad-only row — the pad row
     then hit-tests to a degenerate [e,e) range that corrupts the
     model's line table *)
  let rects = ref [] in
  Array.iter
    (fun fel ->
      let rl = el_rects fel in
      for i = 0 to rl_len rl - 1 do
        rects := rl_at rl i :: !rects
      done)
    (run_els el);
  let sorted =
    List.sort
      (fun a b -> Float.compare (rect_top a) (rect_top b))
      !rects
  in
  (* walk top-sorted rects into row clusters: a rect joins the open
     cluster while its top is within half the tallest member's height;
     a wrap's next row starts a full line height lower *)
  let clusters =
    List.fold_left
      (fun acc r ->
        match acc with
        | (top0, maxh, rs) :: tl when rect_top r <= top0 +. (maxh *. 0.5)
          ->
            (top0, Float.max maxh (rect_height r), r :: rs) :: tl
        | _ -> (rect_top r, rect_height r, [ r ]) :: acc)
      [] sorted
  in
  List.rev clusters
  |> List.filter_map (fun (_, _, rects) ->
      let left =
        List.fold_left
          (fun m r -> Float.min m (rect_left r))
          Float.max_float rects
      and right =
        List.fold_left
          (fun m r -> Float.max m (rect_right r))
          Float.min_float rects
      and mid =
        match rects with
        | r :: _ -> rect_top r +. (rect_height r /. 2.)
        | [] -> 0.
      in
      match
        ( offset_at_el el ~x:(left +. 0.5) ~y:mid
        , offset_at_el el ~x:(right -. 0.5) ~y:mid )
      with
      | Some lo, Some hi -> Some (lo, hi)
      | _ -> None)

(* keep the hidden input parked at the caret so the IME candidate
   window opens at the right spot — px are relative to the block editor *)
let base_style =
  "position:absolute;left:0;top:0;width:1px;height:1em;opacity:0;pointer-events:none"

let reanchor el =
  let st = state_of el in
  match caret_rect_el el st.caret_off with
  | Some r -> (
      match container_of el with
      | Some c ->
          let cr = el_rect c in
          set_attr el "style"
            (Printf.sprintf "%s;transform:translate(%dpx,%dpx);height:%dpx"
               base_style
               (int_of_float (r.fx -. rect_left cr))
               (int_of_float (r.fy -. rect_top cr))
               (max (int_of_float r.fh) 1))
      | None -> ())
  | None -> ()

(* --- listeners ---------------------------------------------------------------- *)

(* keys the input layer treats as commands — preventDefault keeps the
   scratch input's own caret/value frozen; printable keys fall through
   to beforeinput so text arrives via "insert" *)
let command_keys =
  [ "Enter"; "Tab"; "Escape"; "Backspace"; "Delete"; "ArrowLeft"
  ; "ArrowRight"; "ArrowUp"; "ArrowDown"; "Home"; "End" ]

let on_keydown el ev =
  let st = state_of el in
  let key = Option.value (jstr ev "key") ~default:"" in
  let meta = jbool ev "metaKey" and ctrl = jbool ev "ctrlKey" in
  emit_now el "key"
    (String_map.empty
    |> String_map.add "key" (StringValue key)
    |> String_map.add "shift" (BoolValue (jbool ev "shiftKey"))
    |> String_map.add "alt" (BoolValue (jbool ev "altKey"))
    |> String_map.add "meta" (BoolValue meta)
    |> String_map.add "ctrl" (BoolValue ctrl)
    |> String_map.add "repeat" (BoolValue (jbool ev "repeat")));
  (* while a composition is live the IME owns the keys *)
  if (not st.composing) && (List.mem key command_keys || meta || ctrl)
  then prevent_default ev

let on_beforeinput el ev =
  let st = state_of el in
  let kind = Option.value (jstr ev "inputType") ~default:"" in
  if st.composing
     || kind = "insertCompositionText"
     || kind = "deleteCompositionText"
  then
    (* IME owns the scratch buffer while composing — composition events
       carry the text *)
    ()
  else (
    (match kind with
     | "insertText" | "insertReplacementText" -> (
         match jstr ev "data" with
         | Some text -> emit_str el "insert" "text" text
         | None -> ())
     | "insertFromPaste" | "insertFromDrop" -> (
         (* the paste listener usually gets there first; cover the
            data-carrying path for browsers that skip it *)
         match jstr ev "data" with
         | Some text when text <> "" ->
             emit_str el "insert" "text" text
         | _ -> ())
     | "insertParagraph" | "insertLineBreak" ->
         () (* Enter already went through the key event *)
     | "deleteContentBackward" ->
         emit_str el "delete" "kind" "backward"
     | "deleteContentForward" ->
         emit_str el "delete" "kind" "forward"
     | "deleteWordBackward" ->
         emit_str el "delete" "kind" "word-backward"
     | "deleteWordForward" ->
         emit_str el "delete" "kind" "word-forward"
     | "deleteSoftLineBackward" | "deleteHardLineBackward" ->
         emit_str el "delete" "kind" "line-backward"
     | "deleteSoftLineForward" | "deleteHardLineForward" ->
         emit_str el "delete" "kind" "line-forward"
     | "deleteByCut" | "deleteByDrag" ->
         emit_str el "delete" "kind" "selection"
     | _ -> ());
    (* the scratch input's buffer never mutates for non-IME input *)
    if ev_cancelable ev then prevent_default ev)

let on_paste el ev =
  prevent_default ev;
  let cd = cd_data ev in
  if not (js_nullish cd) then
    let text = cd_get cd "text" in
    if text <> "" then emit_str el "insert" "text" text

let on_composition state_name el ev =
  let st = state_of el in
  let text = Option.value (jstr ev "data") ~default:"" in
  if state_name = "start" then st.composing <- true;
  emit_now el "composition"
    (String_map.empty
    |> String_map.add "state" (StringValue state_name)
    |> String_map.add "text" (StringValue text)
    |> String_map.add "range"
         (StringValue ("0," ^ string_of_int (String.length text))));
  if state_name = "end" then (
    st.composing <- false;
    set_value el "" (* scratch: committed text went to the model *))

(* click hit-testing lives on the container (the input is invisible);
   the document-level listener works regardless of attach order *)
let on_mousedown el ev =
  match Js.Undefined.toOption (prop_undef ev "target") with
  | Some target -> (
      match container_of el with
      | Some c when j_contains c target -> (
          match
            offset_at_el el ~x:(jnum ev "clientX") ~y:(jnum ev "clientY")
          with
          | Some off ->
              prevent_default ev;
              focus el;
              let st = state_of el in
              st.dragging <- true;
              st.drag_off <- off;
              emit_now el "pointer"
                (String_map.empty
                |> String_map.add "offset" (IntValue off)
                |> String_map.add "extend" (BoolValue (jbool ev "shiftKey")))
          | None -> ())
      | _ -> ())
  | None -> ()

(* press-drag inside the editor = text selection (native textarea
   parity): each move re-hit-tests and extends the model selection
   from the mousedown offset *)
let on_mousemove el ev =
  let st = state_of el in
  if st.dragging && int_of_float (jnum ev "buttons") land 1 = 1 then
    match
      offset_at_el el ~x:(jnum ev "clientX") ~y:(jnum ev "clientY")
    with
    | Some off when off <> st.drag_off ->
        st.drag_off <- off;
        emit_now el "pointer"
          (String_map.empty
          |> String_map.add "offset" (IntValue off)
          |> String_map.add "extend" (BoolValue true))
    | _ -> ()

let on_mouseup el _ev =
  let st = state_of el in
  st.dragging <- false

(* --- adapter + conduit --------------------------------------------------------- *)

let create _id document emit =
  (* e2e contract: the block editor's input element is a
     textarea#edit-block-<uuid>[data-testid='block editor'] inside
     .editor-wrapper (`.editor-wrapper textarea` is the e2e editor
     handle). Enter/beforeinput are all preventDefault'd so a
     multi-line-capable element behaves like the old <input>. *)
  let el = create_element document "textarea" in
  set_attr el "autocapitalize" "off";
  set_attr el "autocomplete" "off";
  set_attr el "autocorrect" "off";
  set_attr el "spellcheck" "false";
  set_attr el "data-testid" "block editor";
  set_attr el "style" base_style;
  set_class_name el "ed-input";
  Web_ext_adapters.emit_set el emit;
  let on_md ev = on_mousedown el ev in
  let on_mm ev = on_mousemove el ev in
  let on_mu ev = on_mouseup el ev in
  let st = state_of el in
  st.on_mousedown <- Some on_md;
  st.on_mousemove <- Some on_mm;
  st.on_mouseup <- Some on_mu;
  state_set el st;
  add_doc_listener document "mousedown" on_md;
  add_doc_listener document "mousemove" on_mm;
  add_doc_listener document "mouseup" on_mu;
  add_listener el "keydown" (on_keydown el);
  add_listener el "beforeinput" (on_beforeinput el);
  add_listener el "paste" (on_paste el);
  add_listener el "compositionstart" (on_composition "start" el);
  add_listener el "compositionupdate" (on_composition "update" el);
  add_listener el "compositionend" (on_composition "end" el);
  add_listener el "focus" (fun _ -> emit_now el "focus" String_map.empty);
  add_listener el "blur" (fun _ ->
      (state_of el).composing <- false;
      emit_now el "blur" String_map.empty);
  el

let set_property el name v =
  let st = state_of el in
  match name, v with
  | "block-id", StringValue s ->
      if st.block_id <> "" then Hashtbl.remove by_block st.block_id;
      st.block_id <- s;
      Hashtbl.replace by_block s el;
      (* mirrored as a DOM attr so document-level dispatch
         (editor_keys) can resolve a target's block without reaching
         into this module's state; the id is the e2e block-editor hook *)
      set_attr el "data-block-id" s;
      set_attr el "id" ("edit-block-" ^ s)
  | "caret", IntValue n ->
      st.caret_off <- n;
      reanchor el
  | "runs", StringValue s -> st.runs <- parse_runs s
  | _ -> ()

let remove_property el name =
  let st = state_of el in
  match name with
  | "block-id" ->
      if st.block_id <> "" then Hashtbl.remove by_block st.block_id;
      st.block_id <- "";
      set_attr el "data-block-id" ""
  | _ -> ()

let cleanup el =
  let st = state_of el in
  if st.block_id <> "" then Hashtbl.remove by_block st.block_id;
  let doc = owner_document el in
  (match st.on_mousedown with
   | Some f -> remove_doc_listener doc "mousedown" f
   | None -> ());
  (match st.on_mousemove with
   | Some f -> remove_doc_listener doc "mousemove" f
   | None -> ());
  match st.on_mouseup with
  | Some f -> remove_doc_listener doc "mouseup" f
  | None -> ()

let adapter : Lui_web_types.web_extension_adapter =
  { web_extension_create = create
  ; web_extension_set_property = set_property
  ; web_extension_remove_property = remove_property
  ; web_extension_cleanup = cleanup
  }

(* OCaml->host command channel: direct calls, block-editor-relative px
   out, viewport px in *)
let conduit block_id : Edit_input.conduit option =
  match Hashtbl.find_opt by_block block_id with
  | None -> None
  | Some el ->
      let origin () =
        match container_of el with
        | Some c ->
            let r = el_rect c in
            (int_of_float (rect_left r), int_of_float (rect_top r))
        | None -> (0, 0)
      in
      Some
        { Edit_input.caret_rect =
            (fun off ->
              Option.map
                (fun r ->
                  let ox, oy = origin () in
                  { Edit_input.x = int_of_float r.fx - ox
                  ; y = int_of_float r.fy - oy
                  ; w = 0
                  ; h = int_of_float r.fh
                  })
                (caret_rect_el el off))
        ; offset_at =
            (fun ~x ~y ->
              let ox, oy = origin () in
              offset_at_el el ~x:(float x +. float ox)
                ~y:(float y +. float oy))
        ; line_ranges = (fun () -> line_ranges_el el)
        ; set_input_focus = (fun b -> if b then focus el else blur el)
        }

(* --- imperative accessors for the editing layer -------------------------
   The editor machinery (pending focus, popup anchors, document key
   dispatch) resolves blocks through by_block — the hidden input is the
   focus target; the .block-editor container anchors popup placement. *)

external el_json : W.Element.t -> Js.Json.t = "%identity"

let input_el block_id = Hashtbl.find_opt by_block block_id

let focus_input block_id =
  match input_el block_id with
  | Some el -> focus el
  | None -> ()

let is_focused block_id =
  match (input_el block_id, Web_dom.active_element ()) with
  | Some el, Some ae -> ae == el_json el
  | _ -> false

(* the pending-focus emit must wait for the conduit input to be
   registered AND attached — el.focus() on a detached element silently
   does nothing, and the emit dedup would swallow the retry *)
external el_is_connected : W.Element.t -> bool = "isConnected" [@@mel.get]

let can_focus block_id =
  match input_el block_id with
  | Some el -> el_is_connected el
  | None -> false


(* caret anchor for popups, in viewport coords — mirrors the old
   caret_popup_pos contract: (x, popup top, caret line top).
   cljs: pos = (rect.left - 20, rect.top + lineHeight) where the
   computed lineHeight sits ~3px above the caret bottom, so the popup
   overlaps the line's descender space *)
let popup_pos block_id : (float * float * float) option =
  match input_el block_id with
  | None -> None
  | Some el ->
      let st = state_of el in
      Option.map
        (fun r -> (r.fx -. 20., r.fy +. r.fh -. 3., r.fy))
        (caret_rect_el el st.caret_off)

(* bounding rect of the block-editor container — popup clamp anchor.
   Returns (left, top, right, bottom) viewport px *)
let container_rect block_id : (float * float * float * float) option =
  match input_el block_id with
  | Some el -> (
      match container_of el with
      | Some c ->
          let r = el_rect c in
          Some
            ( rect_left r
            , rect_top r
            , rect_right r
            , rect_top r +. rect_height r )
      | None -> None)
  | None -> None

(* install this surface's implementation for shared editor code; module
   load order guarantees it is set before any mounted editor produces
   events (Editor_sink defaults make early calls no-ops anyway) *)
let () =
  Editor_sink.register
    { Editor_sink.conduit
    ; focus_input
    ; is_focused
    ; can_focus
    ; popup_pos
    ; container_rect
    }
