(* Shared editing model for a block's rich-text source — pure functions,
   no platform code. The buffer is the exact db-stored string; all
   offsets are BYTE offsets into it (the conduit translates to/from
   UTF-16 for web at the boundary). Semantics mirror Out's
   core/src/editor_view.ml, adapted to the db-version run layer in
   {!Edit_runs}.

   UTF-8 stepping level: every caret/selection/insert/delete operation
   clamps and steps on codepoint boundaries, and next/prev treat the
   common grapheme clusters as one unit — combining marks, variation
   selectors, emoji skin-tone modifiers, tag characters, ZWJ sequences
   and regional-indicator (flag) pairs. This is a documented subset of
   UAX #29 grapheme segmentation: Prepend/SpacingMark classes are not
   modeled, so a few exotic Indic/emoji corner cases step per
   codepoint — never mid-sequence. *)

module E = Edit_runs

(* --- UTF-8 codepoint / cluster boundaries --------------------------------- *)

let is_cont_byte b = Char.code b land 0xC0 = 0x80

(* byte length of the UTF-8 sequence starting at i; malformed leading
   bytes decode as length 1 so stepping never loops *)
let cp_len s i =
  let b = Char.code s.[i] in
  if b < 0x80 || b < 0xC2 then 1
  else if b < 0xE0 then 2
  else if b < 0xF0 then 3
  else if b < 0xF8 then 4
  else 1

let decode_cp s i =
  let n = String.length s in
  let cont k = if i + k < n then Char.code s.[i + k] land 0x3F else 0 in
  let b = Char.code s.[i] in
  if b < 0x80 || b < 0xC2 then b
  else if b < 0xE0 then (b land 0x1F) lsl 6 lor cont 1
  else if b < 0xF0 then
    (b land 0x0F) lsl 12 lor (cont 1 lsl 6) lor cont 2
  else if b < 0xF8 then
    (b land 0x07) lsl 18 lor (cont 1 lsl 12) lor (cont 2 lsl 6)
    lor cont 3
  else b

(* start offset of the codepoint whose last byte is at/left of c - 1 *)
let prev_cp s c =
  let i = ref (c - 1) in
  while !i > 0 && is_cont_byte s.[!i] do
    decr i
  done;
  !i

(* codepoints that glue onto the preceding base in a cluster *)
let is_extender cp =
  (cp >= 0x0300 && cp <= 0x036F)       (* combining diacriticals *)
  || (cp >= 0x1AB0 && cp <= 0x1AFF)    (* combining marks ext. *)
  || (cp >= 0x1DC0 && cp <= 0x1DFF)
  || (cp >= 0x20D0 && cp <= 0x20FF)    (* combining marks for symbols *)
  || (cp >= 0xFE00 && cp <= 0xFE0F)    (* variation selectors *)
  || (cp >= 0xFE20 && cp <= 0xFE2F)
  || (cp >= 0x1F3FB && cp <= 0x1F3FF)  (* emoji skin-tone modifiers *)
  || (cp >= 0xE0020 && cp <= 0xE007F)  (* tag chars (subdivision flags) *)

let zwj = 0x200D

let is_ri cp = cp >= 0x1F1E6 && cp <= 0x1F1FF (* regional indicators *)

(* next caret position: one grapheme-ish cluster forward.
   ZWJ simplification: UAX #29 GB11 joins only Extended_Pictographic
   pairs across a ZWJ; here a ZWJ glues any two surrounding codepoints,
   which over-merges only on hand-typed stray ZWJs. *)
let next_off s off =
  let n = String.length s in
  if off >= n then n
  else
    let i = ref (off + cp_len s off) in
    if is_ri (decode_cp s off) then (
      (* flags come in pairs: absorb at most one more RI *)
      if !i < n && is_ri (decode_cp s !i) then i := !i + cp_len s !i)
    else (
      let more = ref true in
      while !more && !i < n do
        let cp = decode_cp s !i in
        if is_extender cp then i := !i + cp_len s !i
        else if cp = zwj && !i + cp_len s !i < n then (
          (* ZWJ joins the following codepoint into this cluster *)
          i := !i + cp_len s !i;
          if !i < n then i := !i + cp_len s !i)
        else more := false
      done);
    !i

(* count consecutive regional-indicator codepoints ending exactly at c *)
let count_ri_before s c =
  let rec go p k =
    if p <= 0 then k
    else
      let q = prev_cp s p in
      if is_ri (decode_cp s q) then go q (k + 1)
      else k
  in
  go c 0

(* previous caret position: one cluster backward. A boundary at [c] is
   cluster-internal iff the codepoint STARTING at c is an extender or a
   ZWJ, or the codepoint ENDING at c is a ZWJ or an RI completing an
   odd-count RI run (flags pair left-to-right). *)
let prev_off s off =
  if off <= 0 then 0
  else
    let rec back c =
      if c <= 0 then 0
      else
        let cp_c = decode_cp s c in
        if is_extender cp_c || cp_c = zwj then back (prev_cp s c)
        else
          let p = prev_cp s c in
          let cp_p = decode_cp s p in
          if cp_p = zwj then back p
          else if is_ri cp_p && count_ri_before s c land 1 = 1 then back p
          else c
    in
    back (prev_cp s off)

(* clamp to [0, len] and snap back to a codepoint boundary *)
let clamp_caret s off =
  let n = String.length s in
  let off = max 0 (min n off) in
  if off < n && is_cont_byte s.[off] then prev_cp s off else off

(* --- word boundaries -------------------------------------------------------- *)

type cp_class = Space | Word | Punct

let cp_class s i =
  let cp = decode_cp s i in
  if cp >= 0x80 then Word (* non-ASCII counts as word, same as Out *)
  else
    match Char.chr cp with
    | ' ' | '\t' | '\n' | '\r' -> Space
    | 'a' .. 'z' | 'A' .. 'Z' | '0' .. '9' | '_' -> Word
    | _ -> Punct

let word_right s off =
  let n = String.length s in
  let rec skip_spaces i =
    if i < n && cp_class s i = Space then skip_spaces (i + cp_len s i)
    else i
  in
  let i = skip_spaces off in
  if i >= n then n
  else
    let cls = cp_class s i in
    let rec go j =
      if j < n && cp_class s j = cls then go (j + cp_len s j) else j
    in
    go i

let word_left s off =
  let rec skip_spaces i =
    if i <= 0 then 0
    else
      let p = prev_cp s i in
      if cp_class s p = Space then skip_spaces p else i
  in
  let i = skip_spaces off in
  if i <= 0 then 0
  else
    let cls = cp_class s (prev_cp s i) in
    let rec go j =
      if j <= 0 then 0
      else
        let p = prev_cp s j in
        if cp_class s p = cls then go p else j
    in
    go i

(* --- model ------------------------------------------------------------------ *)

type t =
  { source : string           (* the db-stored block text *)
  ; version : int             (* bumped on every buffer change *)
  ; runs : E.run list         (* display runs over [source] *)
  ; caret : int               (* focus end; byte offset, codepoint-aligned *)
  ; anchor : int option       (* selection anchor; None = collapsed *)
  ; composition : (int * int) option
      (* IME marked range. Contract: composing text is NOT in [source];
         (start, stop) tracks where the marked text would sit so the
         view can underline it. Cleared on commit/cancel and on any
         buffer mutation. *)
  ; lines : (int * int) list
      (* visual line byte ranges [start, stop). Populated from '\n'
         breaks by default; the host overwrites via [set_lines] with
         wrapped-line ranges measured on the rendered run nodes. *)
  }

(* default line table: '\n'-separated source lines, '\n' itself belongs
   to the line it terminates *)
let lines_of_source s =
  let n = String.length s in
  let rec go lo acc =
    match Str_util.index_from s lo "\n" with
    | Some i -> go (i + 1) ((lo, i) :: acc)
    | None -> List.rev ((lo, n) :: acc)
  in
  go 0 []

let rebuild m source ~caret ~anchor =
  { source
  ; version = m.version + 1
  ; runs = E.runs source
  ; caret
  ; anchor
  ; composition = None
  ; lines = lines_of_source source
  }

let create source =
  { source
  ; version = 0
  ; runs = E.runs source
  ; caret = 0
  ; anchor = None
  ; composition = None
  ; lines = lines_of_source source
  }

(* external update (db broadcast / undo): re-split, keep caret clamped *)
let set_source m source =
  let caret = clamp_caret source m.caret in
  let anchor = Option.map (clamp_caret source) m.anchor in
  rebuild m source ~caret ~anchor

let selection_range m =
  match m.anchor with
  | Some a when a <> m.caret ->
      Some (min a m.caret, max a m.caret)
  | _ -> None

let has_selection m = Option.is_some (selection_range m)

(* --- line geometry -----------------------------------------------------------
   Line membership is byte-range arithmetic over [lines]; the host owns
   actual line breaking and feeds wrapped ranges back via [set_lines]. *)

let set_lines m lines = { m with lines }

(* a caret on a line's end offset belongs to that line — the offset
   sits before the terminating '\n' (or at end of source) *)
let caret_line m =
  let rec go i = function
    | [] -> max 0 (List.length m.lines - 1)
    | (lo, hi) :: _ when m.caret >= lo && m.caret <= hi -> i
    | _ :: tl -> go (i + 1) tl
  in
  go 0 m.lines

let first_line m = caret_line m = 0
let last_line m = caret_line m = List.length m.lines - 1

let line_bounds m =
  match List.nth_opt m.lines (caret_line m) with
  | Some b -> b
  | None -> (0, String.length m.source)

(* --- reveal ------------------------------------------------------------------
   Typora rule: delimiters show grey and atomic runs expand to raw
   source while the caret (or an active selection) touches their reveal
   range. *)

let in_reveal m (lo, hi) =
  (m.caret >= lo && m.caret < hi)
  ||
  (match selection_range m with
   | Some (s, e) -> s < hi && e > lo
   | None -> false)

let delim_shown m (r : E.run) = r.kind = E.Delim && in_reveal m r.reveal

let atomic_expanded m (r : E.run) =
  r.kind = E.Atomic && in_reveal m r.reveal

let revealed_delims m =
  List.filter (delim_shown m) m.runs

(* --- structural signature ----------------------------------------------------
   Skip-rebuild token for the view: changes only when the run splitting
   changes — typing inside a Plain run keeps it stable (offsets and
   text are intentionally excluded), caret/selection never enter it. *)

let shape m =
  let run_t (r : E.run) =
    match r.kind with
    | E.Plain -> "p" ^ r.cls
    | E.Delim -> "d" ^ r.cls
    | E.Atomic -> "a" ^ r.cls ^ ":" ^ r.display
  in
  String.concat "|" (List.map run_t m.runs)

(* --- mutations ---------------------------------------------------------------- *)

(* replace source[lo, hi) with [text]; caret lands at end of insert *)
let splice m lo hi text =
  let n = String.length m.source in
  let lo = clamp_caret m.source lo and hi = clamp_caret m.source hi in
  let lo, hi = min lo hi, max lo hi in
  let source =
    String.sub m.source 0 lo ^ text ^ String.sub m.source hi (n - hi)
  in
  rebuild m source ~caret:(lo + String.length text) ~anchor:None

let insert_text m text =
  match selection_range m with
  | Some (lo, hi) -> splice m lo hi text
  | None -> splice m m.caret m.caret text

(* atomic run whose boundary the caret sits on, for unit deletes *)
let atomic_ending_at m off =
  List.find_opt
    (fun (r : E.run) -> r.kind = E.Atomic && r.end_off = off)
    m.runs

let atomic_starting_at m off =
  List.find_opt
    (fun (r : E.run) -> r.kind = E.Atomic && r.start_off = off)
    m.runs

(* NB: a caret strictly inside an atomic run deletes per-codepoint —
   the run is already expanded to raw source there; the unit delete
   applies only when the caret sits on the run's boundary *)

let delete_backward m =
  match selection_range m with
  | Some (lo, hi) -> splice m lo hi ""
  | None -> (
      if m.caret <= 0 then m
      else
        match atomic_ending_at m m.caret with
        | Some r -> splice m r.start_off r.end_off ""
        | None -> splice m (prev_off m.source m.caret) m.caret "")

let delete_forward m =
  match selection_range m with
  | Some (lo, hi) -> splice m lo hi ""
  | None -> (
      let n = String.length m.source in
      if m.caret >= n then m
      else
        match atomic_starting_at m m.caret with
        | Some r -> splice m r.start_off r.end_off ""
        | None -> splice m m.caret (next_off m.source m.caret) "")

let delete_word_backward m =
  match selection_range m with
  | Some (lo, hi) -> splice m lo hi ""
  | None -> (
      if m.caret <= 0 then m
      else
        match atomic_ending_at m m.caret with
        | Some r -> splice m r.start_off r.end_off ""
        | None -> splice m (word_left m.source m.caret) m.caret "")

let delete_word_forward m =
  match selection_range m with
  | Some (lo, hi) -> splice m lo hi ""
  | None -> (
      let n = String.length m.source in
      if m.caret >= n then m
      else
        match atomic_starting_at m m.caret with
        | Some r -> splice m r.start_off r.end_off ""
        | None -> splice m m.caret (word_right m.source m.caret) "")

(* --- caret movement ----------------------------------------------------------- *)

type dir =
  | Left | Right | Up | Down
  | Home | End | Doc_start | Doc_end
  | Word_left | Word_right

let move_target m d ~extend =
  match d with
  | Left -> (
      (* plain arrow collapses selection to its left edge; shift+arrow
         steps the focus like native editors *)
      match selection_range m with
      | Some (lo, _) when not extend -> lo
      | _ -> prev_off m.source m.caret)
  | Right -> (
      match selection_range m with
      | Some (_, hi) when not extend -> hi
      | _ -> next_off m.source m.caret)
  | Word_left -> word_left m.source m.caret
  | Word_right -> word_right m.source m.caret
  | Home -> fst (line_bounds m)
  | End -> snd (line_bounds m)
  | Doc_start -> 0
  | Doc_end -> String.length m.source
  | Up | Down -> m.caret (* host resolves vertical moves via
                          caret-rect/offset-at — see set_lines *)

let move m d ~extend =
  let caret = clamp_caret m.source (move_target m d ~extend) in
  let anchor =
    if extend then Some (Option.value m.anchor ~default:m.caret)
    else None
  in
  { m with caret; anchor }

let select m ~anchor ~focus =
  { m with
    anchor = Some (clamp_caret m.source anchor)
  ; caret = clamp_caret m.source focus
  }

let select_all m =
  { m with anchor = Some 0; caret = String.length m.source }

(* --- IME composition -----------------------------------------------------------
   Contract: the conduit does NOT insert marked text into [source];
   the model tracks the virtual [start, stop) range the marked text
   will occupy so the view can draw the composition underline.
   [composition_commit] inserts the committed text at the range start
   (replacing nothing) and clears the window. *)

let composing m = Option.is_some m.composition
let composition_range m = m.composition

let composition_begin m off =
  let off = clamp_caret m.source off in
  { m with composition = Some (off, off); caret = off; anchor = None }

let composition_update m ~len =
  match m.composition with
  | Some (start, _) -> { m with composition = Some (start, start + len) }
  | None -> m

let composition_commit m text =
  match m.composition with
  | Some (start, _) -> splice m start start text
  | None -> insert_text m text

let composition_cancel m = { m with composition = None }

(* --- keymap --------------------------------------------------------------------
   [key_event -> edit_action]; the platform conduit collects raw keys
   (DOM key names: "ArrowLeft", "Backspace", "Enter", ...), the model
   decides. Structural intents (SplitBlock, Merge_prev, Indent, Outdent)
   are returned for the caller to route to the db tx layer — [apply]
   leaves them alone. *)

type key_event =
  { key : string; shift : bool; alt : bool; meta : bool; ctrl : bool }

let key_ev ?(shift = false) ?(alt = false) ?(meta = false)
    ?(ctrl = false) key =
  { key; shift; alt; meta; ctrl }

type delete_kind =
  | D_backward | D_forward
  | D_word_backward | D_word_forward
  | D_selection

type edit_action =
  | Pass
  | Caret_move of dir
  | Select_move of dir
  | Select_all
  | Clear_selection
  | Delete of delete_kind
  | Insert_text of string
  | SplitBlock            (* caller: split block at caret via db tx *)
  | Merge_prev            (* backspace at offset 0 — merge into prev *)
  | Indent | Outdent
  | Cancel

let keymap m ev : edit_action =
  if composing m then Pass (* IME owns keys while a composition is live *)
  else
    let cmd = ev.meta || ev.ctrl in
    let mv d = if ev.shift then Select_move d else Caret_move d in
    match ev.key with
    | "ArrowLeft" ->
        mv (if ev.alt then Word_left else if ev.meta then Home else Left)
    | "ArrowRight" ->
        mv (if ev.alt then Word_right else if ev.meta then End else Right)
    | "ArrowUp" -> mv (if ev.meta then Doc_start else Up)
    | "ArrowDown" -> mv (if ev.meta then Doc_end else Down)
    | "Home" -> mv (if ev.meta then Doc_start else Home)
    | "End" -> mv (if ev.meta then Doc_end else End)
    | "Backspace" ->
        if has_selection m then Delete D_selection
        else if ev.alt then Delete D_word_backward
        else if m.caret = 0 then Merge_prev
        else Delete D_backward
    | "Delete" ->
        if has_selection m then Delete D_selection
        else if ev.alt then Delete D_word_forward
        else Delete D_forward
    | "Enter" -> if ev.shift || cmd then Pass else SplitBlock
    | "Tab" -> if ev.shift then Outdent else Indent
    | "Escape" -> if has_selection m then Clear_selection else Cancel
    | "a" | "A" when cmd -> Select_all
    | _ -> Pass

(* apply the buffer-local actions; routed intents are identity here *)
let apply m a =
  match a with
  | Caret_move (Up | Down) | Select_move (Up | Down) -> m (* host *)
  | Caret_move d -> move m d ~extend:false
  | Select_move d -> move m d ~extend:true
  | Select_all -> select_all m
  | Clear_selection -> { m with anchor = None }
  | Delete D_backward -> delete_backward m
  | Delete D_forward -> delete_forward m
  | Delete D_word_backward -> delete_word_backward m
  | Delete D_word_forward -> delete_word_forward m
  | Delete D_selection -> (
      match selection_range m with
      | Some (lo, hi) -> splice m lo hi ""
      | None -> m)
  | Insert_text t -> insert_text m t
  | SplitBlock | Merge_prev | Indent | Outdent | Cancel | Pass -> m

let handle_key m ev : t * edit_action =
  let a = keymap m ev in
  (apply m a, a)
