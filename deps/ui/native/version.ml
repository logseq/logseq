(* ported from deps/ui/src/core/version.ml — see the src/ original *)
(* App version generated from resources/package.json. *)

let app = Version_gen.app

(* Injected by vite define (LOGSEQ_REVISION); empty when built
   outside the bundle pipeline. *)
let revision () =
  match Sys.getenv_opt "LOGSEQ_REVISION" with
  | Some r -> r
  | None -> ""
