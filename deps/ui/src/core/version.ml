(* Version metadata — cljs frontend.version + logseq.common.version *)

let app = "2.0.1"

(* Injected by vite define (LOGSEQ_REVISION); empty when built
   outside the bundle pipeline. *)
external global : < logseq_revision : string Js.Undefined.t > Js.t
  = "globalThis"

let revision () =
  match Js.Undefined.toOption global##logseq_revision with
  | Some r -> r
  | None -> ""
