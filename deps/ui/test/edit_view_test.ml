(* Unit tests for the shared editor view + input layer:

   - run-node emit structure: line rows, plain/delim/pill runs, the
     zero-width pad, the logseq-editor sink node and its props
   - shape-gated rebuild: typing inside a Plain run republishes only
     the changed ~value prop (node ids stay); delimiter reveal flips
     only the style-class prop
   - input-event -> model mapping incl. composition commit/cancel and
     routed intents (split/merge/indent/outdent via the route record)
   - U16 unit mode: stepping over proper JS strings (the web surface) *)

open Test_check
open Lui_protocol
module M = Edit_model
module E = Edit_input
module DM = Drive.Model
module S = Drive.Session

(* ---------- harness ---------- *)

type tmodel =
  { ed : M.t
  ; frame : E.frame
  }

type tact =
  | In of E.event
  | Frame of E.frame

type harness =
  { s : (tmodel, tact) S.t
  ; routed : string list ref (* routed intents, most recent first *)
  ; conduit : E.conduit ref
  }

let route_of routed =
  { E.split_block = (fun () -> routed := "split" :: !routed)
  ; merge_prev = (fun () -> routed := "merge" :: !routed)
  ; indent = (fun () -> routed := "indent" :: !routed)
  ; outdent = (fun () -> routed := "outdent" :: !routed)
  ; cancel = (fun () -> routed := "cancel" :: !routed)
  ; focused = (fun b -> routed := (if b then "focus" else "blur") :: !routed)
  ; menu = (fun n -> routed := ("menu:" ^ n) :: !routed)
  }

let mount_editor ?(units = M.Bytes) source =
  Stub_dom.install ();
  let routed = ref [] in
  let conduit = ref E.no_conduit in
  let route = route_of routed in
  let reducer (m : tmodel) (a : tact) : tmodel =
    match a with
    | Frame f -> { m with frame = f }
    | In ev -> { m with ed = E.handle ~route ~conduit:!conduit m.ed ev }
  in
  let registry = Lui_extension.registry () in
  Logseq_dom.register registry;
  Logseq_editor.register registry;
  Logseq_codemirror.register registry;
  Logseq_virt.register registry;
  let view _ctx ms send =
    let ed_s = Signal.map (fun m -> m.ed) ms in
    let frame_s = Signal.map (fun m -> m.frame) ms in
    Edit_view.view ~model:ed_s ~frame:frame_s ~block_id:"b1"
      ~on_input:(fun ev -> ignore (send (In ev)))
  in
  let s =
    S.mount ~registry ~profile:Logseq_editor.web_profile
      ~initial:{ ed = M.create ~units source; frame = E.empty_frame }
      ~reducer ~view ()
  in
  { s; routed; conduit }

let send h a =
  ignore (Lui_app.send h.s.S.app a);
  S.poll h.s

let ed h = (S.read_model h.s).ed
let tree h = h.s.S.tree

let sel str =
  match DM.selector_of_string str with
  | Some x -> x
  | None -> failwith ("bad selector " ^ str)

(* nodes whose style-class prop contains [needle] *)
let cls_nodes h needle =
  List.filter
    (fun (n : DM.node) ->
      match DM.string_prop n "style-class" with
      | Some s -> DM.contains_ic s needle
      | None -> false)
    (DM.all_nodes (tree h))

let cls_ids h needle = List.map (fun (n : DM.node) -> n.DM.id) (cls_nodes h needle)

let sink_node h =
  match DM.first (tree h) (sel "ext:logseq-editor") with
  | Some n -> n
  | None ->
      failwith ("no logseq-editor node; tree:\n" ^ DM.dump (tree h))

let fields kvs =
  List.fold_left
    (fun m (k, v) -> String_map.add k v m)
    String_map.empty kvs

let ext_event h name kvs =
  S.extension_event h.s ~node:(sink_node h).DM.id
    ~identifier:"logseq-editor" ~name ~fields:(fields kvs)

(* ---------- emit structure ---------- *)

let test_emit_structure () =
  let h = mount_editor "a **b** and [[Page]] tail" in
  let t = tree h in
  (* .block-editor column: line row + overlay + extension sink *)
  let editor =
    match DM.first t (sel "prop:style-class=block-editor") with
    | Some n -> n
    | None -> failwith ("no .block-editor; tree:\n" ^ DM.dump t)
  in
  let kids = DM.children t editor.DM.id in
  eqi "block-editor children" 3 (List.length kids);
  (match List.nth_opt kids 0 with
   | Some line ->
       check "first child is ed-line"
         (DM.string_prop line "style-class" = Some "ed-line");
       (* run texts in order: "a " | "**" | "b" | "**" | " and " |
          pill("Page") | " tail" | pad *)
       let texts = DM.children t line.DM.id in
       eqi "frag count" 8 (List.length texts);
       let vals =
         List.map
           (fun n -> Option.value (DM.string_prop n "text") ~default:"?")
           texts
       in
       eqs "frag values" "a ;**;b;**; and ;Page; tail"
         (String.concat ";" (List.filteri (fun i _ -> i < 7) vals));
       (* pad is a single U+200B code unit *)
       eqi "pad is ZWSP" 1 (String.length (List.nth vals 7));
       (* classes: plain carries no extra, delims hidden at caret 0,
          pill non-editable, pad last *)
       let clss =
         List.map
           (fun n -> Option.value (DM.string_prop n "style-class")
                       ~default:"")
           texts
       in
       check "frag classes"
         (List.nth clss 0 = "ed-r"
          && DM.contains_ic (List.nth clss 1) "ed-hidden"
          && DM.contains_ic (List.nth clss 2) "ed-bold"
          && DM.contains_ic (List.nth clss 3) "ed-hidden"
          && List.nth clss 4 = "ed-r"
          && DM.contains_ic (List.nth clss 5) "ed-pill"
          && List.nth clss 6 = "ed-r"
          && DM.contains_ic (List.nth clss 7) "ed-pad")
   | None -> check "first child is ed-line" false);
  (* overlay mounts but shows no caret until a frame arrives *)
  check "overlay mounted"
    (Option.is_some (DM.first t (sel "prop:style-class=ed-overlay")));
  check "no caret bar before measurement" (cls_nodes h "ed-caret" = []);
  (* sink node carries identity + measurement props *)
  let sink = sink_node h in
  check "sink block-id"
    (DM.prop t sink.DM.id "block-id" = Some (StringValue "b1"));
  check "sink caret prop"
    (DM.prop t sink.DM.id "caret" = Some (IntValue 0));
  (* runs prop zips frags: 7 source frags + pad *)
  (match DM.string_prop sink "runs" with
   | Some runs ->
       eqi "runs entries" 8
         (List.length (String.split_on_char ';' runs))
   | None -> check "runs prop" false)

let test_empty_line_pad () =
  let h = mount_editor "" in
  (* an empty buffer still emits a pad so the caret has somewhere to
     land *)
  check "pad on empty buffer" (cls_nodes h "ed-pad" <> [])

(* ---------- shape-gated rebuild ---------- *)

let test_shape_gated () =
  let h = mount_editor "a **b** c" in
  let ids0 = List.sort compare (cls_ids h "ed-r") in
  let count0 = DM.node_count (tree h) in
  (* caret into the first plain run, then type *)
  send h (In (E.Pointer (1, false)));
  send h (In (E.Insert "x"));
  let ids1 = List.sort compare (cls_ids h "ed-r") in
  eqi "node count stable on inner edit" count0
    (DM.node_count (tree h));
  check "frag ids stable on inner edit" (ids0 = ids1);
  eqs "source updated" "ax **b** c" (ed h).M.source;
  (* the runs prop republished with the new span *)
  (match DM.string_prop (sink_node h) "runs" with
   | Some runs -> check "runs prop republished" (String.sub runs 0 4 = "0,3,")
   | None -> check "runs prop republished" false);
  (* caret into the **b** construct reveals the delimiters — same nodes,
     only style-class changes *)
  send h (In (E.Pointer (5, false)));
  let delims =
    List.filter
      (fun (n : DM.node) ->
        match DM.string_prop n "style-class" with
        | Some s -> DM.contains_ic s "ed-delim"
        | None -> false)
      (DM.all_nodes (tree h))
  in
  eqi "two delim nodes" 2 (List.length delims);
  check "delims revealed"
    (List.for_all
       (fun n ->
         match DM.string_prop n "style-class" with
         | Some s -> not (DM.contains_ic s "ed-hidden")
         | None -> false)
       delims);
  check "frag ids stable through reveal"
    (ids0 = List.sort compare (cls_ids h "ed-r"));
  (* moving the caret back out hides them again *)
  send h (In (E.Pointer (0, false)));
  check "delims hidden again"
    (List.for_all
       (fun (n : DM.node) ->
         match DM.string_prop n "style-class" with
         | Some s -> DM.contains_ic s "ed-hidden"
         | None -> false)
       (cls_nodes h "ed-delim"))

(* ---------- overlay frame ---------- *)

let test_overlay () =
  let h = mount_editor "ab\ncd" in
  send h
    (Frame
       { E.caret = Some { E.x = 10; y = 4; w = 0; h = 12 }
       ; selection = [ { E.x = 2; y = 4; w = 30; h = 12 } ]
       });
  let t = tree h in
  (* the caret bar appears in a positioned wrapper *)
  (match cls_nodes h "ed-caret" with
   | [ bar ] -> (
       match bar.DM.parent with
       | Some pid ->
           check "caret wrapper positioned"
             (DM.prop t pid "padding-horizontal" = Some (IntValue 10)
              && DM.prop t pid "padding-vertical" = Some (IntValue 4))
       | None -> check "caret wrapper positioned" false)
   | _ -> check "caret bar emitted" false);
  (match cls_nodes h "ed-sel" with
   | [ r ] ->
       check "sel rect sized"
         (DM.prop t r.DM.id "width" = Some (IntValue 30)
          && DM.prop t r.DM.id "height" = Some (IntValue 12))
   | _ -> check "sel rect emitted" false);
  (* frame update republishes positions on the same nodes *)
  let ids0 = List.sort compare (cls_ids h "ed-pos") in
  send h
    (Frame
       { E.caret = Some { E.x = 20; y = 16; w = 0; h = 12 }
       ; selection = [ { E.x = 4; y = 16; w = 8; h = 12 } ]
       });
  check "overlay nodes stable" (ids0 = List.sort compare (cls_ids h "ed-pos"));
  (match cls_nodes h "ed-caret" with
   | [ bar ] -> (
       match bar.DM.parent with
       | Some pid ->
           check "caret re-positioned"
             (DM.prop t pid "padding-horizontal" = Some (IntValue 20))
       | None -> check "caret re-positioned" false)
   | _ -> check "caret bar still there" false)

(* ---------- extension events through the sink ---------- *)

let test_sink_events () =
  let h = mount_editor "ac" in
  ext_event h "pointer" [ "offset", IntValue 1 ];
  eqi "pointer moves caret" 1 (ed h).M.caret;
  ext_event h "insert" [ "text", StringValue "x" ];
  eqs "insert through sink" "axc" (ed h).M.source;
  (* composition: start -> update -> end commits once *)
  ext_event h "composition" [ "state", StringValue "start" ];
  ext_event h "composition"
    [ "state", StringValue "update"; "text", StringValue "zh" ];
  check "composing range"
    ((ed h).M.composition = Some (2, 4));
  ext_event h "composition"
    [ "state", StringValue "end"; "text", StringValue "中" ];
  eqs "composition commit" "ax中c" (ed h).M.source;
  check "composition cleared" (not (M.composing (ed h)));
  (* focus routes to the caller *)
  ext_event h "focus" [];
  check "focus routed" (List.hd !(h.routed) = "focus");
  (* key events decode + route *)
  ext_event h "key" [ "key", StringValue "Enter" ];
  check "enter routes to split" (List.hd !(h.routed) = "split")

(* ---------- input mapping (unit level) ---------- *)

let test_input_mapping () =
  let routed = ref [] in
  let route = route_of routed in
  let h = E.handle ~route ~conduit:E.no_conduit in
  let m = { (M.create "ab") with M.caret = 1 } in
  let m = h m (E.Insert "x") in
  eqs "insert" "axb" m.M.source;
  (* delete kinds *)
  let m2 =
    h { (M.create "foo bar") with M.caret = 7 }
      (E.Delete E.Del_word_backward)
  in
  eqs "word delete" "foo " m2.M.source;
  (let ml = { (M.create "one two") with M.caret = 4 } in
   let ml = h ml (E.Delete E.Del_line_backward) in
   eqs "line delete" "two" ml.M.source);
  (* decode *)
  (match E.decode "delete"
           (fields [ "kind", StringValue "word-forward" ]) with
   | Some (E.Delete E.Del_word_forward) -> check "decode word-fwd" true
   | _ -> check "decode word-fwd" false);
  check "decode unknown"
    (E.decode "bogus" (fields []) = None);
  (* routed intents *)
  ignore (h m (E.Key (M.key_ev "Enter", false)));
  ignore (h m (E.Key (M.key_ev "Tab", false)));
  ignore
    (h { m with M.caret = 0 } (E.Key (M.key_ev "Backspace", false)));
  ignore (h m (E.Menu "paste"));
  check "routed order"
    (!routed = [ "menu:paste"; "merge"; "indent"; "split" ]);
  (* pointer extend preserves the anchor *)
  let ms = h m (E.Pointer (0, false)) in
  let ms = h ms (E.Pointer (2, true)) in
  check "pointer extend" (ms.M.anchor = Some 0 && ms.M.caret = 2);
  (* composition cancel leaves the buffer *)
  let mc = h m (E.Composition (E.Comp_start, "")) in
  let mc = h mc (E.Composition (E.Comp_cancel, "")) in
  eqs "comp cancel" "axb" mc.M.source;
  check "comp cancel clears" (not (M.composing mc));
  (* blur ends a live composition *)
  let mb = h m (E.Composition (E.Comp_start, "")) in
  let mb = h mb E.Blur in
  check "blur ends comp" (not (M.composing mb));
  check "blur routed" (List.hd !routed = "blur");
  (* vertical arrows resolve through the conduit *)
  let conduit =
    { E.no_conduit with
      caret_rect = (fun _ -> Some { E.x = 4; y = 2; w = 0; h = 8 })
    ; offset_at = (fun ~x:_ ~y -> if y < 2 then Some 0 else Some 2)
    }
  in
  let mv = E.handle ~route ~conduit m (E.Key (M.key_ev "ArrowUp", false)) in
  eqi "arrow-up hit-tests" 0 mv.M.caret;
  let mv2 =
    E.handle ~route ~conduit m (E.Key (M.key_ev ~shift:true "ArrowDown", false))
  in
  (* caret was 2: extending down sets anchor at the old caret *)
  check "shift-down extends"
    (mv2.M.caret = 2 && mv2.M.anchor = Some 2)

(* ---------- U16 unit mode ---------- *)

(* proper JS strings: these literals are byte-strings in the file;
   Platform.utf8 decodes them into real UTF-16 JS strings *)
let js s = Platform.utf8 s

let test_u16 () =
  let s = js "中a文" in (* 3 code units *)
  eqi "u16 len" 3 (String.length s);
  eqi "u16 next" 1 (M.next_off M.U16 s 0);
  eqi "u16 next 2" 2 (M.next_off M.U16 s 1);
  eqi "u16 prev" 2 (M.prev_off M.U16 s 3);
  (* surrogate pair: 😀 occupies 2 code units *)
  let s2 = js "a\xf0\x9f\x98\x80b" in (* a 😀 b *)
  eqi "u16 emoji len" 4 (String.length s2);
  eqi "u16 emoji next" 3 (M.next_off M.U16 s2 1);
  eqi "u16 emoji prev" 1 (M.prev_off M.U16 s2 3);
  eqi "u16 emoji clamp" 1 (M.clamp_caret M.U16 s2 2);
  (* a U16 model edits by code units — the é bug case: a precomposed é
     (1 code unit) must not be treated as 2 *)
  let m = M.create ~units:M.U16 (js "a\xc3\xa9b") in
  eqi "u16 é model len" 3 (String.length m.M.source);
  let m = { m with M.caret = 2 } in
  let m = M.delete_backward m in
  eqs "u16 é backspace" "ab" (m.M.source);
  (* splice/insert at unit offsets round-trips *)
  let m2 = M.create ~units:M.U16 (js "a\xf0\x9f\x98\x80b") in
  let m2 = { m2 with M.caret = 3 } in
  let m2 = M.delete_backward m2 in
  eqs "u16 emoji backspace" "ab" (m2.M.source);
  let m3 = M.insert_text { m2 with M.caret = 1 } (js "中") in
  eqs "u16 insert" (js "a中b") m3.M.source

(* byte semantics stay the default — a byte-string literal steps by
   UTF-8 bytes *)
let test_bytes_default () =
  let m = M.create "中a" in
  check "default is bytes" (m.M.units = M.Bytes);
  eqs "byte insert" "中xa"
    (M.insert_text { m with M.caret = 3 } "x").M.source

(* incremental line table: [lines_step] must emit exactly what a fresh
   [lines_of] produces on every transition, and must return the previous
   list untouched when only caret/selection/composition moved *)
let test_incremental () =
  let src = "alpha **b1** line0\nbeta line1 **b2**\ngamma line2 tail" in
  let m0 = M.create src in
  let cache = Edit_view.line_cache () in
  let ls0 = Edit_view.lines_step cache m0 in
  check "step base == full" (ls0 = Edit_view.lines_of m0);
  (* caret-only move shares runs/lines -> same list object *)
  let m1 = { m0 with M.caret = 3 } in
  let ls1 = Edit_view.lines_step cache m1 in
  check "caret move reuses lines" (ls1 == ls0);
  (* plain-char insert inside line 1: line 0 is reused, line 2 is a
     shifted copy, the whole result equals a full recompute *)
  let pos = String.index src '\n' + 5 in
  let m3 = M.splice m1 pos pos "X" in
  check "splice records dirty span"
    (m3.M.dirty = Some (pos, 0, 1));
  check "splice keeps line count"
    (List.length m1.M.lines = List.length m3.M.lines);
  check "splice keeps shape" (M.shape m1 = M.shape m3);
  let ls3 = Edit_view.lines_step cache m3 in
  check "splice == full" (ls3 = Edit_view.lines_of m3);
  check "splice keeps untouched line" (List.hd ls3 == List.hd ls1);
  (* IME composition keeps the line list *)
  let m4 =
    M.composition_update (M.composition_begin m3 m3.M.caret) ~len:2
  in
  let ls4 = Edit_view.lines_step cache m4 in
  check "ime reuses lines" (ls4 == ls3);
  (* caret inside a `**` construct flips its reveal -> result still
     matches a full recompute *)
  let m2 = { m0 with M.caret = 8 } in
  let ls2 = Edit_view.lines_step cache m2 in
  check "reveal flip == full" (ls2 = Edit_view.lines_of m2);
  check "reveal flip changed frags" (ls2 <> ls0);
  (* newline insert changes the line count -> full recompute path,
     still equal *)
  let m5 = M.splice m0 pos pos "\nx" in
  let ls5 = Edit_view.lines_step cache m5 in
  check "line-count change == full" (ls5 = Edit_view.lines_of m5)

let run () =
  test_emit_structure ();
  test_empty_line_pad ();
  test_incremental ();
  test_shape_gated ();
  test_overlay ();
  test_sink_events ();
  test_input_mapping ();
  test_u16 ();
  test_bytes_default ()
