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
         M.clamp_caret M.Bytes s r.start_off = r.start_off
         && M.clamp_caret M.Bytes s r.end_off = r.end_off)
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

(* Keep a small reference implementation to check every field, including
   the first run's deliberately unchanged reveal and display metadata. *)
let test_plain_merge () =
  let reference = function
    | [] -> []
    | first :: tail ->
        let acc, last = List.fold_left (fun (acc, (last : R.run)) (r : R.run) ->
          match last.kind, r.kind with
          | R.Plain, R.Plain when last.cls = r.cls && last.end_off = r.start_off ->
              acc, {last with end_off=r.end_off; text=last.text ^ r.text}
          | _ -> last :: acc, r) ([], first) tail in
        List.rev (last :: acc) in
  let make kind start_off end_off text cls : R.run =
    {kind; start_off; end_off; text; cls;
     reveal=(start_off + 3, end_off + 7); display="first metadata"} in
  let cases =
    [ []
    ; [make R.Plain 0 1 "a" ""]
    ; [make R.Plain 0 1 "a" ""; make R.Plain 1 7 "中文" "";
       make R.Plain 7 8 "b" ""]
    ; [make R.Plain 0 1 "a" ""; make R.Plain 2 3 "b" ""]
    ; [make R.Plain 0 1 "a" "x"; make R.Plain 1 2 "b" "y"]
    ; [make R.Plain 0 1 "a" ""; make R.Delim 1 2 "*" "";
       make R.Plain 2 3 "b" ""; make R.Atomic 3 4 "x" ""]
    ; [make R.Plain 0 0 "" ""; make R.Plain 0 1 "a" "";
       make R.Plain 1 1 "" ""]
    ] in
  List.iteri (fun i input ->
    check (Printf.sprintf "plain merge preserves all fields %d" i)
      (R.merge_plains input = reference input)) cases;
  for seed = 0 to 63 do
    let input = List.init 40 (fun i ->
      let kind = match (i + seed) mod 11 with 0 -> R.Atomic | 1 -> R.Delim | _ -> R.Plain in
      let start_off = i * 4 + (if (i + seed) mod 13 = 0 then 1 else 0) in
      make kind start_off (i * 4 + 4) "text" (if (i + seed) mod 7 = 0 then "bold" else "")) in
    check (Printf.sprintf "plain merge mixed boundary replay %d" seed)
      (R.merge_plains input = reference input)
  done;
  let singleton = make R.Plain 0 1 "a" "" in
  check "unmerged singleton retains its original record"
    (match R.merge_plains [singleton] with [r] -> r == singleton | _ -> false)

(* Route repeated failed delimiters through the actual parse-owned finder.
   Counts describe matcher search requests, not hidden character-visit timing. *)
let test_unclosed_inline_search () =
  let repeated count chunk =
    let buffer = Buffer.create (count * String.length chunk) in
    for _ = 1 to count do Buffer.add_string buffer chunk done;
    Buffer.contents buffer in
  List.iter (fun (label, chunk, expected_patterns) ->
    let count = 512 in
    let source = repeated count chunk in
    let cached = Render_inline.substring_finder source in
    let requests = Hashtbl.create 4 in
    let find offset pattern =
      Hashtbl.replace requests pattern
        (1 + Option.value (Hashtbl.find_opt requests pattern) ~default:0);
      cached offset pattern in
    for i = 0 to count - 1 do
      check (label ^ " unmatched opener remains literal")
        (match Render_inline.try_match ~find ~refs:[] ~self:"" source
           (i * String.length chunk) with None -> true | Some _ -> false)
    done;
    List.iter (fun pattern ->
      eqi (label ^ " routes each delimiter request through the owned finder") count
        (Option.value (Hashtbl.find_opt requests pattern) ~default:0)) expected_patterns;
    eqi (label ^ " has a bounded number of routed patterns")
      (List.length expected_patterns) (Hashtbl.length requests);
    let large = repeated 10000 chunk in
    check (label ^ " adversarial source keeps exactly one byte-exact Plain run")
      (match R.runs large with
       | [run] -> run.R.kind = R.Plain && run.start_off = 0
           && run.end_off = String.length large && run.text = large
           && run.reveal = (0, String.length large) && run.cls = "" && run.display = ""
       | _ -> false))
    ["hash reference", "#[[missing ", ["]]"]
    ; "image separator", "![missing ", ["]("]
    ; "image close", "![x](missing ", ["]("; ")"]
    ; "HTML close", "<u>missing ", ["</u>"]
    ; "date close", "<2026-11-13 missing ", [">"]];
  (* Cache hits must preserve found-position boundaries, earlier queries,
     independent needles and independent parse ownership. *)
  let source = "x]] y]]" in
  let find = Render_inline.substring_finder source in
  List.iter (fun offset ->
    eqi "cached delimiter result matches a fresh search at every boundary"
      (Render_inline.find_sub source offset "]]") (find offset "]]"))
    [0; 1; 2; 3; 5; 6; 7; 0; 3];
  eqi "failed needle does not hide another delimiter" (-1) (find 0 "absent");
  eqi "other needle retains its own result" 5 (find 3 "]]");
  eqi "a separate parse does not inherit a previous failed search" 0
    ((Render_inline.substring_finder "absent") 0 "absent");
  (* Compare token offsets and specifications against uncached searches.
     Closures are deliberately excluded; matching does not mount views. *)
  List.iter (fun source ->
    let raw offset pattern = Render_inline.find_sub source offset pattern in
    let rec scan offset acc =
      if offset >= String.length source then List.rev acc else
      match Render_inline.try_match ~find:raw ~refs:[] ~self:"" source offset with
      | None -> scan (offset + 1) acc
      | Some (_, length, tok_spec) ->
          scan (offset + length)
            ({Render_inline.tok_start=offset; tok_stop=offset + length; tok_spec} :: acc) in
    check "cached matching preserves raw token offsets and specs"
      (Render_inline.match_tokens source = scan 0 []);
    check_runs "cached nested/escaped inline source" source)
    ["#[[one]] #[[]] #[[two]] tail"
    ; "![a](x.png) ![](y.pdf) ![broken]( tail"
    ; "<u>a <b>b</b> c</u> <ins>x</ins> <s>y</s> <br>"
    ; "\\![a](x.png) \\#[[tag]] \\<u>x</u>"
    ; "<2026-11-13 Fri> then <2026-11-14 Sat>"
    ; "<u>unclosed <b>closed</b> <u>still unclosed"]

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
  eqi "next cp" 3 (M.next_off M.Bytes s 0);
  eqi "next cp 2" 6 (M.next_off M.Bytes s 3);
  eqi "prev cp" 6 (M.prev_off M.Bytes s 9);
  eqi "clamp mid" 0 (M.clamp_caret M.Bytes s 1);
  eqi "clamp mid 2" 3 (M.clamp_caret M.Bytes s 5);
  eqi "clamp hi" 9 (M.clamp_caret M.Bytes s 99);
  (* emoji surrogate pair (4 bytes) *)
  let s2 = "a😀b" in
  eqi "emoji next" 5 (M.next_off M.Bytes s2 1);
  eqi "emoji prev" 1 (M.prev_off M.Bytes s2 5);
  eqi "emoji clamp" 1 (M.clamp_caret M.Bytes s2 3);
  (* combining mark cluster: e + U+0301 = "é" (3 bytes) *)
  let s3 = "e\xcc\x81x" in
  eqi "combining next" 3 (M.next_off M.Bytes s3 0);
  eqi "combining prev" 0 (M.prev_off M.Bytes s3 3);
  (* ZWJ family emoji *)
  let s4 = "👩‍💻x" in
  eqi "zwj next" 11 (M.next_off M.Bytes s4 0);
  eqi "zwj prev" 0 (M.prev_off M.Bytes s4 11);
  eqi "zwj step to x" 12 (M.next_off M.Bytes s4 11);
  (* flag: two regional indicators pair up *)
  let s5 = "🇫🇷x" in
  eqi "flag next" 8 (M.next_off M.Bytes s5 0);
  eqi "flag prev" 0 (M.prev_off M.Bytes s5 8);
  (* three RIs: first pair clusters, third lone *)
  let s6 = "🇫🇷🇺🇸x" in
  eqi "ri3 prev lands at third" 8 (M.prev_off M.Bytes s6 12)

(* B1: the create sites run under the backend's unit system — Bytes on
   native. Multi-byte text edited in Bytes mode must keep caret,
   insert, and delete on codepoint boundaries (no mid-codepoint caret,
   no invalid-UTF-8 splice). *)
let test_units_multibyte () =
  let m = M.create ~units:M.Bytes "中a😀b文" in
  (* byte offsets: 中=0-3, a=3-4, 😀=4-8, b=8-9, 文=9-12 *)
  eqi "mb len" 12 (String.length m.M.source);
  let r1 = M.apply m (M.Caret_move M.Right) in
  eqi "right over 中" 3 r1.M.caret;
  let r2 = M.apply r1 (M.Caret_move M.Right) in
  eqi "right over a" 4 r2.M.caret;
  let r3 = M.apply r2 (M.Caret_move M.Right) in
  eqi "right over emoji" 8 r3.M.caret;
  (* insert at a boundary: valid utf-8, caret lands on next boundary *)
  let mi = M.insert_text r3 "字" in
  eqs "insert at boundary" "中a😀字b文" mi.M.source;
  eqi "insert caret" 11 mi.caret;
  (* backspace removes the whole inserted codepoint, not one byte *)
  let md = M.delete_backward mi in
  eqs "del restores source" "中a😀b文" md.M.source;
  eqi "del caret" 8 md.caret;
  (* a grapheme cluster steps and deletes as one unit *)
  let mz = { (M.create ~units:M.Bytes "a👩‍💻x") with M.caret = 1 } in
  let mz' = M.apply mz (M.Caret_move M.Right) in
  eqi "zwj cluster one step" 12 mz'.caret;
  let mz'' = M.delete_forward mz in
  eqs "fwd del drops cluster" "ax" mz''.M.source

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
  let m = M.composition_update m ~text:"abcdef" in
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

let test_source_replacement () =
  let before = "prefix short suffix" in
  let after = "prefix canonical title suffix" in
  let m =
    M.select (M.create before) ~anchor:2
      ~focus:(String.length before - 3)
    |> fun m -> M.set_source m after
  in
  eqi "source replacement retains suffix-relative caret"
    (String.length after - 3) m.M.caret;
  eq "source replacement retains prefix-relative anchor"
    (Some 2) m.M.anchor
    (function Some x -> string_of_int x | None -> "none")

let test_double_click () =
  List.iter
    (fun (source, offset, expected) ->
      let m = Edit_input.handle ~route:Edit_input.no_route
          ~conduit:Edit_input.no_conduit (M.create source)
          (Edit_input.Dblclick offset) in
      check (Printf.sprintf "double click %S at %d" source offset)
        (M.selection_range m = expected))
    [ "one two", 0, Some (0, 3)
    ; "one two", 3, Some (3, 4)
    ; "one two", 4, Some (4, 7)
    ; "one two", 7, Some (4, 7)
    ; "one.two", 3, Some (3, 4)
    ; "one  two", 4, Some (3, 5)
    ; "", 0, None
    ; "中文 word", 7, Some (7, 11)
    ]

let test_wrap_affinity () =
  let m = M.set_lines (M.create "ab中文cd") [0,5;5,10] in
  let upstream = M.select ~affinity:M.Upstream m ~anchor:5 ~focus:5 in
  let downstream = M.select m ~anchor:5 ~focus:5 in
  eqi "same source offset upstream" 5 upstream.M.caret;
  eqi "same source offset downstream" 5 downstream.M.caret;
  eqi "upstream belongs to preceding visual line" 0 (M.caret_line upstream);
  eqi "downstream belongs to following visual line" 1 (M.caret_line downstream);
  eqi "upstream end uses preceding line" 5 (M.move upstream M.End ~extend:false).M.caret;
  eqi "downstream home uses following line" 5 (M.move downstream M.Home ~extend:false).M.caret;
  let inserted = M.insert_text upstream "X" in
  eqs "affinity does not alter insertion offset" "ab中X文cd" inserted.M.source;
  check "edits reset affinity" (inserted.M.caret_affinity = M.Downstream);
  let moved = M.move upstream M.Right ~extend:false in
  eqi "right steps a whole character" 8 moved.M.caret;
  check "ordinary movement resets affinity" (moved.M.caret_affinity = M.Downstream)

let run () =
  test_unclosed_inline_search ();
  test_plain_merge ();
  test_wrap_affinity ();
  test_source_replacement ();
  test_double_click ();
  test_byte_exact ();
  test_run_kinds ();
  test_reveal ();
  test_utf8 ();
  test_units_multibyte ();
  test_caret_moves ();
  test_deletes ();
  test_insert_keymap ();
  test_composition ();
  test_shape ()
