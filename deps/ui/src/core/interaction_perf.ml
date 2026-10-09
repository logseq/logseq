(* Interaction latency instrumentation: stage timings for one dispatch/flush
   cycle pushed onto window.__uiPerf so the bench harness can read them.

   Cost is one small JS object per op plus a handful of performance.now()
   calls — always on. Stage boundaries:

     dispatch  — Lui_app.dispatch_event (event -> enqueued effects)
     send      — Lui_app.send (reducer + publish)
     flush     — Lui_app.flush minus apply (Signal.stabilize, view re-emit,
                 keyed diff, op encode)
     apply     — backend.apply_batch (web store update + DOM patch)
     virt      — Logseq_virt.sync after the flush
     focus     — Editor_actions.focus_pending after the flush

   Counters come from Lui_runtime.diagnostics (signal fan-out per op,
   patch ops per batch, mounted node count). *)

external perf_now : unit -> float = "now" [@@mel.scope "performance"]

type t =
  { mutable label : string
  ; mutable dispatch_ms : float
  ; mutable send_ms : float
  ; mutable flush_ms : float
  ; mutable apply_ms : float
  ; mutable virt_ms : float
  ; mutable focus_ms : float
  ; mutable op_count : int
  ; mutable sig_rounds : int
  ; mutable sig_effects : int
  ; mutable mounted_nodes : int
  }

let current =
  { label = ""
  ; dispatch_ms = 0.
  ; send_ms = 0.
  ; flush_ms = 0.
  ; apply_ms = 0.
  ; virt_ms = 0.
  ; focus_ms = 0.
  ; op_count = 0
  ; sig_rounds = 0
  ; sig_effects = 0
  ; mounted_nodes = 0
  }

let enabled = ref true

(* Nested samples fold into the outermost one: a Runtime.send inside an
   event's stabilize re-enters begin_op, and resetting the shared record
   would zero the outer stage accumulators mid-flight. *)
let depth = ref 0

let begin_op label =
  if !enabled then begin
    if !depth = 0 then (
      current.label <- label;
      current.dispatch_ms <- 0.;
      current.send_ms <- 0.;
      current.flush_ms <- 0.;
      current.apply_ms <- 0.;
      current.virt_ms <- 0.;
      current.focus_ms <- 0.;
      current.op_count <- 0;
      current.sig_rounds <- 0;
      current.sig_effects <- 0);
    depth := !depth + 1
  end

let note_dispatch ms = if !enabled then current.dispatch_ms <- ms
let note_send ms = if !enabled then current.send_ms <- ms
let note_apply ms ops =
  if !enabled then begin
    current.apply_ms <- current.apply_ms +. ms;
    current.op_count <- current.op_count + ops
  end
let note_virt ms = if !enabled then current.virt_ms <- ms
let note_focus ms = if !enabled then current.focus_ms <- ms

(* diagnostics snapshot after each Lui_app.flush — a dirty re-flush inside
   stabilize can run a second internal flush, so accumulate instead of
   reading once at finish *)
let note_flush ms (d : Lui_runtime.flush_diagnostics) =
  if !enabled then begin
    current.flush_ms <- current.flush_ms +. ms;
    current.sig_rounds <- current.sig_rounds + d.flush_signal_round_count;
    current.sig_effects <- current.sig_effects + d.flush_signal_effect_count;
    current.mounted_nodes <- d.flush_mounted_node_count
  end

let time f =
  let t0 = perf_now () in
  let r = f () in
  (r, perf_now () -. t0)

(* melange record -> JS object literal; field names are the __uiPerf keys *)
type js_sample =
  { label : string
  ; dispatch : float
  ; send : float
  ; flush : float
  ; apply : float
  ; virt : float
  ; focus : float
  ; ops : int
  ; sig_rounds : int
  ; sig_effects : int
  ; nodes : int
  ; t : float
  }

let push_raw : js_sample -> unit =
  [%mel.raw
    "function (s) { \
       var a = window.__uiPerf || (window.__uiPerf = []); \
       a.push(s); \
       if (window.__editorPerf) console.debug('PERF ui', s); \
       if (a.length > 512) a.splice(0, a.length - 512); }"]

let finish () =
  if !enabled && !depth > 0 then begin
    depth := !depth - 1;
    if !depth > 0 then ()
    else begin
    push_raw
      { label = current.label
      ; dispatch = current.dispatch_ms
      ; send = current.send_ms
      ; flush = current.flush_ms
      ; apply = current.apply_ms
      ; virt = current.virt_ms
      ; focus = current.focus_ms
      ; ops = current.op_count
      ; sig_rounds = current.sig_rounds
      ; sig_effects = current.sig_effects
      ; nodes = current.mounted_nodes
      ; t = perf_now ()
      }
    end
  end
