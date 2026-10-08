(* editor_bench — keystroke-latency + patch-size smoke for the shared
   block editor (edit_model / edit_input / edit_view + the logseq-editor
   sink).

   Mounts a real Lui_app on a recording backend and replays Edit_input
   events through the same reducer the unit tests use, so the numbers
   cover the whole model -> signal -> emit -> patch path minus real DOM
   work. Synthetic corpus: one 500-line block (~30KB), per docs/
   editor-perf.md.

   Phases reported per operation:
     model — pure Edit_input.handle on a pristine model (no app)
     send  — reducer dispatch inside Lui_app.send (model + publish)
     emit  — Lui_app.flush minus patch-callback time (signal recompute,
             view re-emit, keyed diff, op encoding)
     apply — inside the backend's apply_batch (op replay; a proxy for
             host-side patch application)
     ops / nodes / bytes — per-flush patch batch size; bytes are a rough
             serialized estimate (tag + ids + payload strings)

   Run: node _build/default/test/editor_bench/editor_bench.js *)

open Lui_protocol
module M = Edit_model
module E = Edit_input
module DM = Drive.Model

external performance_now : unit -> float = "now" [@@mel.scope "performance"]

let now = performance_now

(* Js.log flushes immediately — OCaml stdout stays buffered under
   Melange, so long runs would otherwise print nothing until exit *)
let outf fmt = Printf.ksprintf Js.log fmt

(* ---------- patch statistics ---------- *)

type stats =
  { mutable batches : int
  ; mutable ops : int
  ; mutable bytes : int
  ; mutable creates : int
  ; mutable drops : int
  ; mutable sets : int
  ; mutable apply_ms : float
  ; touched : (int, unit) Hashtbl.t
  }

let fresh_stats () =
  { batches = 0; ops = 0; bytes = 0; creates = 0; drops = 0; sets = 0
  ; apply_ms = 0.; touched = Hashtbl.create 16 }

let reset_stats s =
  s.batches <- 0;
  s.ops <- 0;
  s.bytes <- 0;
  s.creates <- 0;
  s.drops <- 0;
  s.sets <- 0;
  s.apply_ms <- 0.;
  Hashtbl.reset s.touched

let wire_bytes = function
  | StringValue s -> String.length s
  | BoolValue _ | IntValue _ | FloatValue _ -> 9

(* rough per-op serialized size: discriminant + ids + payload *)
let op_bytes = function
  | CreateNode _ -> 12
  | CreateExtension (_, ident, fp) ->
      20 + String.length ident + String.length fp
  | DropNode _ | DetachSubtree _ -> 9
  | SetProp (_, p, v) ->
      16 + String.length (Lui_wire_schema.property_name p) + wire_bytes v
  | RemoveProp (_, p) ->
      12 + String.length (Lui_wire_schema.property_name p)
  | SetExtensionProp (_, name, v) ->
      16 + String.length name + wire_bytes v
  | RemoveExtensionProp (_, name) -> 12 + String.length name
  | InsertChild _ | RemoveChild _ | MoveChild _ -> 15

let op_nodes = function
  | CreateNode (a, _) | CreateExtension (a, _, _) | DropNode a
  | DetachSubtree a -> [ a ]
  | SetProp (a, _, _) | RemoveProp (a, _) -> [ a ]
  | SetExtensionProp (a, _, _) | RemoveExtensionProp (a, _) -> [ a ]
  | InsertChild (p, c, _) | RemoveChild (p, c) | MoveChild (p, c, _) ->
      [ p; c ]

let record st (b : patch_batch) =
  st.batches <- st.batches + 1;
  List.iter
    (fun op ->
      st.ops <- st.ops + 1;
      st.bytes <- st.bytes + op_bytes op;
      (match op with
       | CreateNode _ | CreateExtension _ -> st.creates <- st.creates + 1
       | DropNode _ | DetachSubtree _ -> st.drops <- st.drops + 1
       | SetProp _ | SetExtensionProp _ -> st.sets <- st.sets + 1
       | _ -> ());
      List.iter (fun id -> Hashtbl.replace st.touched id ()) (op_nodes op))
    b.ops

(* ---------- harness ---------- *)

type tmodel =
  { ed : M.t
  ; frame : E.frame
  }

(* Restore swaps the model back to a pristine record between samples so
   every measured op starts from identical state — including the ops
   that leave the buffer unchanged (caret moves, Enter routing). *)
type tact =
  | In of E.event
  | Frame of E.frame
  | Restore of M.t

type harness =
  { app : (tmodel, tact) Lui_app.reducer_app
  ; tree : DM.t
  ; stats : stats
  }

let mount ?(units = M.Bytes) source =
  Stub_dom.install ();
  let stats = fresh_stats () in
  let tree = DM.create () in
  let backend =
    { backend_profile = Logseq_editor.web_profile
    ; apply_batch =
        (fun b ->
          record stats b;
          let t0 = now () in
          DM.apply_batch tree b;
          stats.apply_ms <- stats.apply_ms +. (now () -. t0);
          true)
    }
  in
  let registry = Lui_extension.registry () in
  Logseq_emoji.register registry;
  Logseq_katex.register registry;
  Logseq_el.register registry;
  Logseq_editor.register registry;
  Logseq_codemirror.register registry;
  Logseq_virt.register registry;
  let reducer (m : tmodel) (a : tact) : tmodel =
    match a with
    | Frame f -> { m with frame = f }
    | Restore ed -> { m with ed }
    | In ev -> { m with ed = E.handle ~route:E.no_route
                             ~conduit:E.no_conduit m.ed ev }
  in
  let view _ctx ms send =
    let ed_s = Signal.map (fun m -> m.ed) ms in
    let frame_s = Signal.map (fun m -> m.frame) ms in
    Edit_view.view ~model:ed_s ~frame:frame_s ~block_id:"b1"
      ~on_input:(fun ev -> ignore (send (In ev))) ~cls:""
  in
  let app =
    Lui_app.create_with_extensions backend registry
      { ed = M.create ~units source; frame = E.empty_frame }
      reducer view
  in
  ignore (Lui_app.start app);
  ignore (Lui_app.flush app);
  { app; tree; stats }

(* ---------- corpus ---------- *)

(* 500 lines, ~30KB: mostly plain text with a markup line every ~5th —
   bold construct, page ref, tag+code span — so re-segmentation has real
   work to do. *)
let mk_source () =
  let b = Buffer.create 40000 in
  for i = 0 to 499 do
    (match i mod 9 with
     | 3 ->
         Printf.bprintf b
           "Line %04d has **bold phrase** and more plain text\n" i
     | 5 ->
         Printf.bprintf b
           "Line %04d links [[Page %02d]] plus trailing words\n" i
           (i mod 50)
     | 7 ->
         Printf.bprintf b
           "Line %04d tags #topic and `code span` inline here\n" i
     | _ ->
         Printf.bprintf b
           "Line %04d plain text with some words for typing tests\n" i)
  done;
  Buffer.contents b

let find_from src start needle =
  match Str_util.index_from src start needle with
  | Some i -> i
  | None -> failwith ("bench corpus missing " ^ needle)

let paste_200 =
  let b = Buffer.create 12000 in
  for i = 0 to 199 do
    Printf.bprintf b "Pasted line %04d with **bold** and plain text\n" i
  done;
  Buffer.contents b

(* ---------- measurement ---------- *)

let iterations = 15
let warmup = 5

type sample =
  { send_ms : float
  ; emit_ms : float
  ; apply_ms : float
  ; ops : int
  ; bytes : int
  ; creates : int
  ; touched : int
  }

let timed ?(iters = iterations) ?(wm = warmup) f =
  let arr = Array.make iters 0. in
  for _ = 1 to wm do
    ignore (f ())
  done;
  for i = 0 to iters - 1 do
    let t0 = now () in
    ignore (f ());
    arr.(i) <- now () -. t0
  done;
  Array.sort compare arr;
  arr

let p50 arr = arr.(Array.length arr / 2)
let p95 arr = arr.(min (Array.length arr - 1)
                    (int_of_float (0.95 *. float_of_int (Array.length arr))))
let pmax arr = arr.(Array.length arr - 1)

(* one pipeline sample: restore the pristine model (flush outside the
   timing), then send the event and measure dispatch + flush *)
let sample_op h m0 ev =
  ignore (Lui_app.send h.app (Restore m0));
  ignore (Lui_app.flush h.app);
  reset_stats h.stats;
  let t0 = now () in
  ignore (Lui_app.send h.app (In ev));
  let t1 = now () in
  ignore (Lui_app.flush h.app);
  let t2 = now () in
  { send_ms = t1 -. t0
  ; emit_ms = (t2 -. t1) -. h.stats.apply_ms
  ; apply_ms = h.stats.apply_ms
  ; ops = h.stats.ops
  ; bytes = h.stats.bytes
  ; creates = h.stats.creates
  ; touched = Hashtbl.length h.stats.touched
  }

let run_pipeline h ~iters m0 ev =
  let samples = Array.make iters
      { send_ms = 0.; emit_ms = 0.; apply_ms = 0.; ops = 0; bytes = 0
      ; creates = 0; touched = 0 }
  in
  for _ = 1 to warmup do
    ignore (sample_op h m0 ev)
  done;
  for i = 0 to iters - 1 do
    samples.(i) <- sample_op h m0 ev
  done;
  samples

(* ---------- reporting ---------- *)

let print_header () =
  outf
    "%-22s %8s %8s %8s %8s %8s %8s %6s %6s %6s %7s\n"
    "op" "model50" "model95" "send50" "emit50" "emit95" "apply50"
    "ops50" "opsmax" "nodes" "bytes50";
  Js.log (String.make 110 '-')

let report h name m0 ev =
  let model = timed ~iters:12 ~wm:3 (fun () ->
      E.handle ~route:E.no_route ~conduit:E.no_conduit m0 ev)
  in
  outf "  [%s] model done, pipeline..." name;
  let ss = run_pipeline h ~iters:iterations m0 ev in
  let sends = Array.map (fun s -> s.send_ms) ss in
  Array.sort compare sends;
  let emits = Array.map (fun s -> s.emit_ms) ss in
  Array.sort compare emits;
  let applies = Array.map (fun s -> s.apply_ms) ss in
  Array.sort compare applies;
  let ops = Array.map (fun s -> float_of_int s.ops) ss in
  Array.sort compare ops;
  let touched = Array.map (fun s -> float_of_int s.touched) ss in
  Array.sort compare touched;
  let bytes = Array.map (fun s -> float_of_int s.bytes) ss in
  Array.sort compare bytes;
  outf "%-22s %8.3f %8.3f %8.3f %8.3f %8.3f %8.3f %6.0f %6.0f %6.0f %7.0f\n"
    name (p50 model) (p95 model) (p50 sends) (p50 emits) (p95 emits)
    (p50 applies) (p50 ops) (pmax ops) (p50 touched) (p50 bytes);
  ss

(* distinct line-row node ids touched by a batch — used to check that
   an edit near the end leaves earlier lines alone *)
let touched_line_ids h =
  Hashtbl.fold (fun id _ acc -> id :: acc) h.stats.touched []

let () =
  let src = mk_source () in
  let l249 = find_from src 0 "Line 0249" in (* mod-9 class 6 -> plain *)
  let pos_plain = l249 + 15 in
  let l250 = find_from src 0 "Line 0250" in
  let l246 = find_from src 0 "Line 0246" in (* mod-9 class 3 -> bold *)
  let bold = find_from src l246 "**bold phrase**" in
  let pos_bold = bold + 4 in (* inside the bold word, construct revealed *)
  let pos_bold_end = bold + 15 in (* right after the closing ** *)
  let pos_mid = l250 in (* paste lands at a line boundary mid-buffer *)
  let pos_end = find_from src 0 "Line 0499" + 15 in
  outf "corpus: %d bytes, 500 lines\n\n" (String.length src);

  (* ---- model-internals breakdown (context for the table) ---- *)
  outf "%-34s %9s %9s\n" "model/view internals" "p50" "p95";
  Js.log (String.make 55 '-');
  let row name f =
    let a = timed ~iters:8 ~wm:2 f in
    outf "%-34s %9.3f %9.3f\n" name (p50 a) (p95 a)
  in
  row "M.create (runs + lines)" (fun () -> M.create src);
  row "Edit_runs.runs source" (fun () -> Edit_runs.runs src);
  row "M.lines_of_source source" (fun () -> M.lines_of_source src);
  let m_base = M.create src in
  row "Edit_view.lines_of model" (fun () -> Edit_view.lines_of m_base);
  row "Edit_view.runs_prop_of lines" (fun () ->
      Edit_view.runs_prop_of (Edit_view.lines_of m_base));
  Js.log "";

  (* ---- mounted session ---- *)
  let h = mount src in
  (* map node id -> line index for the touched-line check *)
  let line_index =
    let tbl = Hashtbl.create 512 in
    (match DM.first h.tree
             (match DM.selector_of_string "prop:style-class=block-editor"
              with Some s -> s | None -> failwith "selector") with
     | Some ed ->
         List.iteri
           (fun i (n : DM.node) ->
             match DM.string_prop n "style-class" with
             | Some "ed-line" -> Hashtbl.replace tbl n.DM.id i
             | _ -> ())
           (DM.children h.tree ed.DM.id)
     | None -> failwith "no .block-editor");
    tbl
  in
  let mounted_nodes = DM.node_count h.tree in
  outf "mounted nodes: %d\n\n" mounted_nodes;
  reset_stats h.stats;

  (* single-shot magnitudes before the sampling loops — these decide how
     long the table takes *)
  (let t0 = now () in
   ignore (Lui_app.flush h.app);
   outf "idle flush: %.1fms" (now () -. t0));
  (let t0 = now () in
   ignore (Lui_app.send h.app (In (E.Insert "x")));
   let t1 = now () in
   ignore (Lui_app.flush h.app);
   let t2 = now () in
   outf "insert: send %.1fms, flush %.1fms, ops %d, apply %.1fms"
     (t1 -. t0) (t2 -. t1) h.stats.ops h.stats.apply_ms);
  (let t0 = now () in
   ignore (Lui_app.send h.app (Restore m_base));
   let t1 = now () in
   ignore (Lui_app.flush h.app);
   let t2 = now () in
   outf "restore: send %.1fms, flush %.1fms, ops %d"
     (t1 -. t0) (t2 -. t1) h.stats.ops);

  let m caret = { m_base with M.caret } in
  let m_sel = (* selection over ~10 chars *)
    M.select (m pos_plain) ~anchor:pos_plain ~focus:(pos_plain + 10)
  in
  let m_ime = M.composition_begin (m pos_plain) pos_plain in
  let m_ime_marked = M.composition_update m_ime ~len:4 in

  print_header ();
  let s_move =
    report h "caret_move" (m pos_plain)
      (E.Key (M.key_ev "ArrowRight", false))
  in
  let s_ins =
    report h "insert_plain" (m pos_plain) (E.Insert "x")
  in
  let s_bold =
    report h "insert_in_bold_reveal" (m pos_bold) (E.Insert "x")
  in
  let s_bs =
    report h "backspace_at_delim" (m pos_bold_end)
      (E.Delete E.Del_backward)
  in
  let s_sel =
    report h "select_expand" m_sel
      (E.Key (M.key_ev ~shift:true "ArrowRight", false))
  in
  let s_ime =
    report h "ime_comp_update" m_ime
      (E.Composition (E.Comp_update, "kaku"))
  in
  let s_ime_c =
    report h "ime_commit" m_ime_marked
      (E.Composition (E.Comp_end, "\xe4\xb8\xad"))
  in
  let s_enter =
    report h "enter_split_route" (m pos_plain)
      (E.Key (M.key_ev "Enter", false))
  in
  let s_paste =
    report h "paste_200_lines" (m pos_mid) (E.Insert paste_200)
  in
  let s_end =
    report h "insert_near_end" (m pos_end) (E.Insert "x")
  in
  ignore s_move; ignore s_ins; ignore s_bold; ignore s_bs; ignore s_sel;
  ignore s_ime; ignore s_ime_c; ignore s_enter;

  (* which line rows did the near-end insert touch? *)
  let () =
    ignore (Lui_app.send h.app (Restore (m pos_end)));
    ignore (Lui_app.flush h.app);
    reset_stats h.stats;
    ignore (Lui_app.send h.app (In (E.Insert "x")));
    ignore (Lui_app.flush h.app);
    let idxs =
      List.filter_map
        (fun id -> Hashtbl.find_opt line_index id)
        (touched_line_ids h)
    in
    outf
      "\ninsert_near_end: ops=%d touched-nodes=%d line-rows-touched=[%s] creates=%d\n"
      h.stats.ops (Hashtbl.length h.stats.touched)
      (String.concat "," (List.map string_of_int (List.sort compare idxs)))
      h.stats.creates
  in

  (* ---- regression checks ---- *)
  let med ss f =
    let a = Array.map f ss in
    Array.sort compare a;
    p50 a
  in
  let ins_model_p50 = med s_ins (fun s -> s.send_ms) in
  let paste_total_p50 = med s_paste (fun s -> s.send_ms +. s.emit_ms) in
  let ins_total_p50 = med s_ins (fun s -> s.send_ms +. s.emit_ms) in
  let paste_ops = med s_paste (fun s -> float_of_int s.ops) in
  let end_ops = med s_end (fun s -> float_of_int s.ops) in
  outf "\nregression checks\n%s\n" (String.make 60 '-');
  outf
    "paste200 total p50 = %.3fms ; 200x insert p50 = %.3fms ; ratio %.2f \
     (batched tx/emit OK iff << 200)\n"
    paste_total_p50 (200. *. ins_total_p50)
    (paste_total_p50 /. ins_total_p50);
  outf
    "insert_near_end patch: ops p50 = %.0f, creates p50 = %.0f \
     (O(1) iff ops stays single-digit and no creates)\n"
    end_ops (med s_end (fun s -> float_of_int s.creates));
  outf
    "paste patch: ops p50 = %.0f (expected ~O(pasted lines) creates)\n"
    paste_ops;
  outf
    "send-vs-model overhead at insert_plain: send p50 %.3fms \
     vs model p50 (see table)\n"
    ins_model_p50
