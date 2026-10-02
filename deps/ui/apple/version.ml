(* ported from deps/ui/src/core/version.ml — see apple/NOTES.md *)
(* Version metadata — cljs frontend.version + logseq.common.version *)

let app = "2.0.1"

(* Injected by vite define (LOGSEQ_REVISION); empty when built
   outside the bundle pipeline. *)
let revision () =
  match Sys.getenv_opt "LOGSEQ_REVISION" with
  | Some r -> r
  | None -> ""
