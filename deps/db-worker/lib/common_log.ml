(* logseq.common.log — minimal error-logging shim (the cljs ns shims
   lambdaisland.glogi fns for nbb by applying console.error to each
   message arg; here messages are concatenated). *)

let error (msgs : string list) : unit =
  Worker_log.error (String.concat " " msgs) []
