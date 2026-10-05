(* Unit tests for the shared editor model layer:
   Edit_runs (byte-exact run splitting over Render_inline tokens) and
   Edit_model (caret arithmetic, reveal, deletes, keymap, IME, shape). *)

open Test_check
module R = Edit_runs
module M = Edit_model

(* ---------- run invariants ---------- *)

let check_runs name s =
  let rs = R.runs s in
  eqs (name ^ " recompose") s (R.recompose rs);
  (* contiguous, ordered, non-empty runs *)
  let rec ok pos = function
    | [] -> pos = String.length s
    | (r : R.run) :: tl ->
        r.start_off = pos && r.end_off > r.start_off && ok r.end_off tl
  in
  check (name ^ " coverage") (ok 0 rs);
  (* every offset is a codepoint boundary *)
  check (name ^ " boundaries")
    (List.for_all
       (fun (r : R.run) ->
         M.clamp_caret s r.start_off = r.start_off
         && M.clamp_caret s r.end_off = r.end_off)
       rs)

let test_byte_exact () =
  List.iter
    (fun (name, s) -> check_runs name s)
    [ "plain", "plain text"
    ; "page-ref", "[[Some Page]]"
    ; "refs+tag", "see [[page]] and #tag here"
    ; "emphasis", "**bold** and *ital* and `code`"
    ; "link", "[label](https://x.io)"
    ; "ref+label-ish", "[[link][label]]"
    ; "latex", "math $$x^2$$ and $y$"
    ; "hash-ref", "#[[abcde-f123]] tail"
    ; "macro", "{{cloze answer\\cue}} text"
    ; "bare url", "go http://example.com/p now"
    ; "image", "![alt](img.png)"
    ; "nested", "outer **a _b_ c** end"
    ; "unclosed", "unclosed **bold stays"
    ; "empty", ""
    ; "newline", "line1\nline2"
    ; "html tag", "<u>under</u> and <mark>hi</mark>"
    ; "timestamp", "due <2026-10-05 Mon> soon"
    ; "unicode", "unicode 中文测试 é😀 tail"
    ; "zwj emoji", "a 👩‍💻 b"
    ; "mixed", "中文 **粗体** [[页]] #标签 `代`码 tail" ]

let run_desc (r : R.run) =
  Printf.sprintf "%s[%d,%d)%s" 
    (match r.kind with Plain -> "p" | Delim -> "d" | Atomic -> "a")
    r.start_off r.end_off
    (if r.display = "" then "" else ":" ^ r.display)

let show_runs rs = String.concat " " (List.map run_desc rs)

let test_run_kinds () =
  (* [[x]] is one atomic run *)
  (match R.runs "[[x]]" with
   | [ r ] ->
       check "page-ref atomic" (r.R.kind = R.Atomic);
       eqs "page-ref display" "x" r.display
   | rs -> check "page-ref atomic" false;
           Js.log ("got: " ^ show_runs rs));
  (* **bold** = delim/plain/delim *)
  (match R.runs "**b**" with
   | [ d1; mid; d2 ] ->
       check "bold delim left"
         (d1.R.kind = R.Delim && d1.R.text = "**"
          && mid.kind = R.Plain && mid.text = "b"
          && d2.kind = R.Delim && d2.R.text = "**");
       check "bold inner cls" (mid.R.cls = "ed-bold")
   | rs -> check "bold shape" false; Js.log ("got: " ^ show_runs rs));
  (* nested emphasis inside bold *)
  (match R.runs "**a *b* c**" with
   | rs ->
       check "nested byte-exact"
         (R.recompose rs = "**a *b* c**");
       check "nested has inner italic delim"
         (List.exists
            (fun (r : R.run) -> r.kind = R.Delim && r.text = "*")
            rs)
   );
  (* `code` inner is literal — markup inside stays plain *)
  (match R.runs "`a**b`" with
   | [ _d1; mid; _d2 ] -> eqs "code inner literal" "a**b" mid.R.text
   | rs -> check "code inner literal" false;
           Js.log ("got: " ^ show_runs rs))

(* ---------- reveal ---------- *)

let test_reveal () =
  let m = M.create "a **b** c" in
  (* runs: "a " | ** | b | ** | " c"; each delim's reveal = the
     construct's outer span [2, 7) *)
  let delims = List.filter (fun (r : R.run) -> r.kind = R.Delim) m.M.runs in
  eqi "two delims" 2 (List.length delims);
  let shown_at off = List.length (M.revealed_delims { m with M.caret = off }) in
  eqi "delims hidden far" 0 (shown_at 0);
  eqi "caret at open shows" 2 (shown_at 2);
  eqi "caret inside shows" 2 (shown_at 5);
  eqi "caret in close shows" 2 (shown_at 6);
  eqi "caret past close hides" 0 (shown_at 7);
  eqi "caret in tail hides" 0 (shown_at 8);
  (* selection overlapping the construct reveals too *)
  let sel = M.select m ~anchor:0 ~focus:4 in
  eqi "selection overlap reveals" 2 (List.length (M.revealed_delims sel));
  (* atomic expand: strict interior only *)
  let m2 = M.create "x [[p]] y" in
  let at =
    List.find (fun (r : R.run) -> r.kind = R.Atomic) m2.M.runs
  in
  check "atomic collapsed at left edge"
    (not (M.atomic_expanded { m2 with caret = at.R.start_off } at));
  check "atomic expanded inside"
    (M.atomic_expanded { m2 with caret = at.R.start_off + 1 } at);
  check "atomic collapsed at right edge"
    (not (M.atomic_expanded { m2 with caret = at.R.end_off } at))

(* ---------- caret arithmetic / UTF-8 ---------- *)

let test_utf8 () =
  let s = "中文字" in (* 9 bytes, 3 codepoints *)
  eqi "cjk len" 9 (String.length s);
  eqi "next cp" 3 (M.next_off s 0);
  eqi "next cp 2" 6 (M.next_off s 3);
  eqi "prev cp" 6 (M.prev_off s 9);
  eqi "clamp mid" 0 (M.clamp_caret s 1);
  eqi "clamp mid 2" 3 (M.clamp_caret s 5);
  eqi "clamp hi" 9 (M.clamp_caret s 99);
  (* emoji surrogate pair (4 bytes) *)
  let s2 = "a😀b" in
  eqi "emoji next" 5 (M.next_off s2 1);
  eqi "emoji prev" 1 (M.prev_off s2 5);
  eqi "emoji clamp" 1 (M.clamp_caret s2 3);
  (* combining mark cluster: e + U+0301 = "é" (3 bytes) *)
  let s3 = "e\xcc\x81x" in
  eqi "combining next" 3 (M.next_off s3 0);
  eqi "combining prev" 0 (M.prev_off s3 3);
  (* ZWJ family emoji *)
  let s4 = "👩‍💻x" in
  eqi "zwj next" 11 (M.next_off s4 0);
  eqi "zwj prev" 0 (M.prev_off s4 11);
  eqi "zwj step to x" 12 (M.next_off s4 11);
  (* flag: two regional indicators pair up *)
  let s5 = "🇫🇷x" in
  eqi "flag next" 8 (M.next_off s5 0);
  eqi "flag prev" 0 (M.prev_off s5 8);
  (* three RIs: first pair clusters, third lone *)
  let s6 = "🇫🇷🇺🇸x" in
  eqi "ri3 prev lands at third" 8 (M.prev_off s6 12)

let test_caret_moves () =
  let m = M.create "中a文" in (* bytes: 中=0-3, a=3-4, 文=4-7 *)
  let m = { m with M.caret = 7 } in
  let m' = M.apply m (M.Caret_move M.Left) in
  eqi "left over cjk" 4 m'.caret;
  let m'' = M.apply m' (M.Caret_move M.Left) in
  eqi "left to ascii" 3 m''.caret;
  let m3 = M.apply m'' (M.Caret_move M.Left) in
  eqi "left to 0" 0 m3.caret;
  let m4 = M.apply m3 (M.Caret_move M.Right) in
  eqi "right over cjk" 3 m4.caret;
  (* selection extend *)
  let m5 = M.apply m4 (M.Select_move M.Right) in
  check "extend sets anchor" (m5.M.anchor = Some 3 && m5.caret = 4);
  let m6 = M.apply m5 (M.Caret_move M.Left) in
  check "left collapses sel to lo" (m6.M.caret = 3 && m6.anchor = None);
  (* shift+arrow with an active selection steps the focus, not collapse *)
  let m6b = M.apply m5 (M.Select_move M.Left) in
  check "shift-left shrinks sel" (m6b.caret = 3 && m6b.M.anchor = Some 3);
  (* home/end over '\n' lines *)
  let ml = M.create "aa\nbb\ncc" in
  let ml = { ml with M.caret = 5 } in (* inside "bb" *)
  let mh = M.apply ml (M.Caret_move M.Home) in
  eqi "home to line start" 3 mh.caret;
  let me = M.apply ml (M.Caret_move M.End) in
  eqi "end to line end" 5 me.caret;
  check "not first line" (not (M.first_line ml));
  check "not last line" (not (M.last_line ml));
  check "first line" (M.first_line { ml with caret = 1 });
  check "last line" (M.last_line { ml with caret = 8 });
  (* host-fed wrapped lines override the default split *)
  let mw = M.set_lines (M.create "abcdef") [ (0, 3); (3, 6) ] in
  let mwh = M.apply { mw with M.caret = 5 } (M.Caret_move M.Home) in
  eqi "wrapped home" 3 mwh.caret

(* ---------- deletes ---------- *)

let test_deletes () =
  (* atomic boundary: caret right after [[x]] removes the whole run *)
  let m = { (M.create "a [[x]] b") with M.caret = 7 } in
  let m = M.delete_backward m in
  eqs "atomic del source" "a  b" m.M.source;
  eqi "atomic del caret" 2 m.caret;
  (* delete-forward at the run's left edge also removes the unit *)
  let m2 = { (M.create "a [[x]] b") with M.caret = 2 } in
  let m2 = M.delete_forward m2 in
  eqs "atomic fwd del" "a  b" m2.M.source;
  eqi "atomic fwd caret" 2 m2.caret;
  (* inside an atomic run the edit is raw: one codepoint *)
  let m3 = { (M.create "a [[xy]] b") with M.caret = 6 } in
  let m3 = M.delete_backward m3 in
  eqs "inside atomic del" "a [[x]] b" m3.M.source;
  (* char delete over multibyte *)
  let m4 = { (M.create "中a") with M.caret = 3 } in
  let m4 = M.delete_backward m4 in
  eqs "cjk backspace" "a" m4.M.source;
  eqi "cjk backspace caret" 0 m4.caret;
  (* emoji cluster backspace *)
  let m5 = { (M.create "a😀b") with M.caret = 5 } in
  let m5 = M.delete_backward m5 in
  eqs "emoji backspace" "ab" m5.M.source;
  (* combining char backspace removes base+mark *)
  let m6 = { (M.create "e\xcc\x81x") with M.caret = 3 } in
  let m6 = M.delete_backward m6 in
  eqs "combining backspace" "x" m6.M.source;
  (* word delete *)
  let m7 = { (M.create "foo bar baz") with M.caret = 11 } in
  let m7 = M.delete_word_backward m7 in
  eqs "word backspace" "foo bar " m7.M.source;
  (* selection across run boundaries *)
  let m8 = M.select (M.create "ab **cd** ef") ~anchor:1 ~focus:9 in
  let m8 = M.delete_backward m8 in
  eqs "sel del across runs" "a ef" m8.M.source;
  eqi "sel del caret" 1 m8.caret;
  check "sel cleared" (m8.M.anchor = None);
  (* backspace at 0 is a no-op (Merge_prev is the keymap's call) *)
  let m9 = { (M.create "x") with M.caret = 0 } in
  check "del at 0 noop" (M.delete_backward m9 == m9)

(* ---------- insert / keymap / composition ---------- *)

let test_insert_keymap () =
  let m = M.create "ac" in
  let m = { m with M.caret = 1 } in
  let m = M.insert_text m "中" in
  eqs "insert" "a中c" m.M.source;
  eqi "insert caret" 4 m.caret;
  (* Enter -> SplitBlock routed, buffer untouched *)
  let (m2, a2) = M.handle_key m (M.key_ev "Enter") in
  check "enter is SplitBlock" (a2 = M.SplitBlock && m2 == m);
  let (_, a3) = M.handle_key m (M.key_ev ~shift:true "Enter") in
  check "shift-enter passes" (a3 = M.Pass);
  (* backspace at 0 -> Merge_prev *)
  let m4 = { (M.create "x") with M.caret = 0 } in
  let (_, a4) = M.handle_key m4 (M.key_ev "Backspace") in
  check "bs at 0 is Merge_prev" (a4 = M.Merge_prev);
  (* shift+arrow selects *)
  let m5 = { (M.create "abc") with M.caret = 0 } in
  let (m5, a5) = M.handle_key m5 (M.key_ev ~shift:true "ArrowRight") in
  check "shift-right selects" (a5 = M.Select_move M.Right && m5.caret = 1
                             && m5.M.anchor = Some 0);
  (* backspace over selection -> D_selection *)
  let (_, a6) = M.handle_key m5 (M.key_ev "Backspace") in
  check "sel bs" (a6 = M.Delete M.D_selection);
  let m5' = M.apply m5 (M.Delete M.D_selection) in
  eqs "sel applied" "bc" m5'.M.source;
  (* cmd+a selects all *)
  let (_, a7) = M.handle_key m (M.key_ev ~meta:true "a") in
  check "cmd-a" (a7 = M.Select_all);
  (* alt+backspace -> word delete *)
  let (_, a8) = M.handle_key m (M.key_ev ~alt:true "Backspace") in
  check "alt-bs word" (a8 = M.Delete M.D_word_backward)

let test_composition () =
  let m = M.create "ac" in
  let m = M.composition_begin m 1 in
  check "composing" (M.composing m);
  eq "comp range" (Some (1, 1)) (M.composition_range m)
    (function Some (a, b) -> Printf.sprintf "(%d,%d)" a b | None -> "-");
  let m = M.composition_update m ~len:6 in
  eq "comp range grown" (Some (1, 7)) (M.composition_range m)
    (function Some (a, b) -> Printf.sprintf "(%d,%d)" a b | None -> "-");
  (* keys pass through while composing *)
  let (_, a) = M.handle_key m (M.key_ev "Backspace") in
  check "composing passes keys" (a = M.Pass);
  let m = M.composition_commit m "中文" in
  check "comp cleared" (not (M.composing m));
  eqs "comp commit text" "a中文c" m.M.source;
  eqi "comp caret" 7 m.caret;
  (* cancel leaves the buffer alone *)
  let m2 = M.composition_cancel (M.composition_begin (M.create "z") 0) in
  check "comp cancel" (not (M.composing m2) && m2.M.source = "z")

(* ---------- shape ---------- *)

let test_shape () =
  let m = M.create "a **b** c" in
  let s0 = M.shape m in
  (* caret moves don't change shape *)
  eqs "shape stable on caret" s0 (M.shape { m with M.caret = 6 });
  (* typing inside a plain run keeps the splitting *)
  let m2 = M.insert_text { m with M.caret = 1 } "x" in
  eqs "shape stable on inner edit" s0 (M.shape m2);
  (* an edit that re-splits changes it *)
  let m3 = M.insert_text { m with M.caret = 0 } "*" in
  check "shape changes on resplit" (M.shape m3 <> s0);
  let m4 = M.set_source m "a [[x]] c" in
  check "shape changes on atomic" (M.shape m4 <> s0)

let run () =
  test_byte_exact ();
  test_run_kinds ();
  test_reveal ();
  test_utf8 ();
  test_caret_moves ();
  test_deletes ();
  test_insert_keymap ();
  test_composition ();
  test_shape ()
