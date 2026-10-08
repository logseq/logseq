(* Edit-mode display runs for a block's rich-text source.

   Splits the source string into a flat [run list] covering 100% of its
   bytes: concatenating [run.text] over all runs reproduces the source
   exactly. Run splitting is DERIVED from {!Render_inline.match_tokens} —
   the same matcher table the renderer parses with — so the editor can
   never disagree with display mode about where a construct starts or
   ends. The db stores the source string itself; runs are a view over it,
   not a transformation.

   Run kinds (Typora-style WYSIWYG, mirrors Out's inline_markup runs):
   - Plain: literal text. [cls] carries the enclosing emphasis class
     (e.g. "ed-bold") when the run sits inside a wrapped construct.
   - Delim: markup delimiter bytes. Hidden unless the caret/selection
     sits inside [reveal] — always the enclosing construct's range.
   - Atomic: a non-editable unit (page ref, tag, link, image, macro,
     latex, emoji, bare url, <br>). Collapses to a [display] pill while
     the caret is outside; [reveal] is the run's strict interior so a
     caret inside shows the raw source, while positions exactly on the
     edges keep the pill. *)

type kind = Plain | Delim | Atomic

type run =
  { start_off : int        (* byte offset, inclusive *)
  ; end_off : int          (* byte offset, exclusive *)
  ; kind : kind
  ; text : string          (* source[start_off, end_off), verbatim *)
  ; reveal : int * int     (* caret in [lo, hi) reveals delim / expands atomic *)
  ; display : string       (* Atomic pill label; "" for Plain/Delim *)
  ; cls : string           (* style-class hint, "" when none *)
  }

let join_cls a b = if a = "" then b else if b = "" then a else a ^ " " ^ b

(* [sub] on the materialized bytes: Melange [String.sub] copies the
   whole source per call (O(len s)), while [Bytes.sub] copies only the
   slice — all run text extraction goes through it *)
let sub_of sb a n = Bytes.unsafe_to_string (Bytes.sub sb a n)

let plain sb a b cls : run =
  { start_off = a; end_off = b; kind = Plain
  ; text = sub_of sb a (b - a); reveal = (a, b); display = ""; cls }

let mk kind sb a b ~reveal ~display ~cls : run =
  { start_off = a; end_off = b; kind
  ; text = sub_of sb a (b - a); reveal; display; cls }

(* Fold the tokens of [sb[lo, hi)] into runs appended to [acc].
   Gaps between tokens are plain text. [Rs_wrapped] emits a Delim pair
   whose reveal range is the whole construct, and recurses into the
   inner range when the construct re-parses (emphasis); code-style
   constructs (re_parse = false) keep their inner bytes as one literal
   Plain run. *)
let rec seg (acc : run list) sb lo hi ~cls : run list =
  let toks = Render_inline.match_tokens (sub_of sb lo (hi - lo)) in
  let acc = ref acc and cur = ref lo in
  List.iter
    (fun (t : Render_inline.span_tok) ->
      let a = lo + t.tok_start and b = lo + t.tok_stop in
      if !cur < a then acc := plain sb !cur a cls :: !acc;
      (match t.tok_spec with
       | Render_inline.Rs_plain ->
           acc := plain sb a b cls :: !acc
       | Rs_atomic (_, "ed-url") ->
           acc := plain sb a b (join_cls cls "ed-url") :: !acc
       | Rs_atomic (display, "ed-page-ref") when Wire.is_uuid_string display ->
           acc :=
             mk Atomic sb a b ~reveal:(a + 1, b) ~display
               ~cls:(join_cls cls "ed-block-ref") :: !acc
       | Rs_atomic (display, c) ->
           acc :=
             mk Atomic sb a b ~reveal:(a + 1, b) ~display
               ~cls:(join_cls cls c) :: !acc
       | Rs_wrapped (o, c, re_parse, c2) ->
           let cls' = join_cls cls c2 in
           acc := mk Delim sb a (a + o) ~reveal:(a, b) ~display:"" ~cls:cls' :: !acc;
           let inner_lo = a + o and inner_hi = b - c in
           if inner_hi > inner_lo then
             if re_parse then acc := seg !acc sb inner_lo inner_hi ~cls:cls'
             else acc := plain sb inner_lo inner_hi cls' :: !acc;
           acc := mk Delim sb (b - c) b ~reveal:(a, b) ~display:"" ~cls:cls' :: !acc);
      cur := b)
    toks;
  if !cur < hi then acc := plain sb !cur hi cls :: !acc;
  !acc

(* Merge adjacent Plain runs that share a class (e.g. a matched literal
   like a <2026-01-01> timestamp between plain gaps) — cosmetic only,
   byte coverage is unchanged. *)
let merge_plains (rs : run list) : run list =
  match rs with
  | [] -> []
  | r0 :: tl ->
      let acc, last =
        List.fold_left
          (fun (acc, (last : run)) (r : run) ->
            match last.kind, r.kind with
            | Plain, Plain
              when last.cls = r.cls && last.end_off = r.start_off ->
                (acc, { last with end_off = r.end_off
                                ; text = last.text ^ r.text })
            | _ -> (last :: acc, r))
          ([], r0) tl
      in
      List.rev (last :: acc)

let runs s : run list =
  (* one O(n) conversion up front; every slice/extraction below is
     O(slice) on both runtimes *)
  let sb = Bytes.of_string s in
  merge_plains (List.rev (seg [] sb 0 (String.length s) ~cls:""))

(* Debug/test helper: concatenate the source slices back — must equal
   the original string. *)
let recompose rs =
  let b = Buffer.create 64 in
  List.iter (fun (r : run) -> Buffer.add_string b r.text) rs;
  Buffer.contents b
